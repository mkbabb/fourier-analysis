<script setup lang="ts">
import { ref, computed, watch, onScopeDispose } from "vue";
import { watchDebounced, useMediaQuery } from "@vueuse/core";
import {
    computeEquation,
    simplifyCoefficients,
    isAbortError,
    abortInflight,
    EQUATION_ABORT_KEYS,
} from "@/lib/equation/api";
import type { NotationMode, ComputeEquationRequest, ComputeEquationResponse, FourierTermDTO, EquationDisplayMode } from "@/lib/equation/types";
import type { BasisComponent } from "@/lib/types";
import { tierInfo, energyColor } from "@/lib/equation/notation";
import { Button } from "@mkbabb/glass-ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@mkbabb/glass-ui/popover";
import { Metric } from "@mkbabb/glass-ui/metric";
import { FadingScroll } from "@mkbabb/glass-ui/fading-scroll";
import { Info } from "@lucide/vue";

import { SegmentedTabs } from "@mkbabb/glass-ui/tabs";
import FunctionInput from "./FunctionInput.vue";
import EquationResult from "./EquationResult.vue";
import EquationModeToggle from "./EquationModeToggle.vue";
import ConvergencePlot from "./ConvergencePlot.vue";
import EqCoefficientsPanel from "./EqCoefficientsPanel.vue";

import { loadCachedInputState, saveCachedInputState, loadCachedResult, saveCachedResult } from "./composables/useEquationCache";
import { useCoeffHover } from "./composables/useCoeffHover";

// ── Input state (restore from cache) ──
const cached = loadCachedInputState();
const expression = ref(cached?.expression ?? "x*(pi - x)");
const domainStart = ref(cached?.domainStart ?? 0);
const domainEnd = ref(cached?.domainEnd ?? Math.PI);
const nHarmonics = ref(cached?.nHarmonics ?? 20);
const budget = ref(cached?.budget ?? 10);
const notation = ref<NotationMode>(cached?.notation ?? "trig");

// ── Result state ──
const computing = ref(false);
const simplifying = ref(false);
const error = ref<string | null>(null);
const cachedRes = loadCachedResult();
const result = ref<ComputeEquationResponse | null>(cachedRes?.result ?? null);
const displayLatex = ref(cachedRes?.latex ?? "");
const displayLatexSigma = ref(cachedRes?.result?.latex_sigma ?? "");
const displayEnergy = ref(cachedRes?.energy ?? 1);
const effectiveN = ref(cachedRes?.result?.effective_n ?? 20);
/**
 * `fr-ConvergencePlot L-M2` / `M-L1`, the callsite half — the plot used to bind
 * the LIVE domain refs against last-successful-response data, and
 * `onDomainInput` writes the model and emits nothing, so a typed domain edit
 * rendered wrong-frequency curves against old coefficients for an UNBOUNDED
 * window. The plot is given the domain that produced the data it is drawing.
 */
const resultDomain = ref<[number, number]>([domainStart.value, domainEnd.value]);
const autoHarmonics = ref(true);
const eqMode = ref<EquationDisplayMode>("sigma");
const mobileView = ref<"controls" | "canvas">("controls");
const isDesktop = useMediaQuery("(min-width: 1024px)");
const eqCardRef = ref<HTMLDivElement>();

// ── Derived state ──
const activeLatex = computed(() =>
    eqMode.value === "sigma" && displayLatexSigma.value ? displayLatexSigma.value : displayLatex.value,
);

const vizHarmonics = computed(() =>
    autoHarmonics.value ? Math.min(effectiveN.value, nHarmonics.value) : nHarmonics.value,
);

const loading = computed(() => computing.value || simplifying.value);

const components = computed<BasisComponent[]>(() => {
    if (!result.value) return [];
    return result.value.coefficients.map((c: FourierTermDTO) => ({
        index: c.n,
        coefficient: [c.coefficient_re, c.coefficient_im] as [number, number],
        amplitude: c.amplitude,
        phase: c.phase,
    }));
});

const tier = computed(() => result.value ? tierInfo(result.value.tier) : null);
const eColor = computed(() => energyColor(displayEnergy.value));

const coefficients = computed(() => result.value?.coefficients ?? []);

// ── Coefficient hover (composable) ──
const { hoveredCoeff, popoverPos, popoverHtml, onMouseMove: onCoeffMove, onMouseLeave: onCoeffLeave } =
    useCoeffHover(coefficients);

// ── The ONE normalization seam ──
//
// `M-CK` — `computeKey()` used to return 4 fields while the POST carried 7,
// including `notation` and `budget`, both of which the server reads to build the
// response (`equations.py:91` `simplify_series(terms, budget, notation)` →
// `latex`; `:96` `render_latex_sigma(terms, notation)` → `latex_sigma`). A key
// that under-determines its own request is a memo that returns the wrong answer,
// and it is why BOTH prescribed cures for `B-1` reproduced `B-1` one layer down.
// `R2-N5` rides the same seam: the key read the UNTRIMMED expression while the
// body sent the trimmed one, so a trailing space was a cache miss for an
// identical request. Normalize ONCE, here, and key off the result — never off
// the refs.
const N_EVAL_POINTS = 500;

/**
 * `B-2` / `M-BR` — the server bounds `budget` at `ge=2, le=50` on BOTH pydantic
 * models, and one Harmonics drag from the shipped defaults used to walk the ref
 * past 50; the 422 then landed in `doSimplify`'s silent catch and the escalated
 * value was persisted, so the NEXT session's first compute 422'd cold.
 *
 * The clamp lands HERE, at the one seam every request passes through, because
 * `M-BR` killed the slider-side cure by enumeration: the restore path never
 * passes through the slider at all. The Display-terms control clamps its own
 * WRITE as well (`FI-N-5`) — that is the second instance, not a duplicate of
 * this one: it stops the ref from ever HOLDING a number the component will not
 * send, which is what makes the displayed figure honest.
 *
 * ⊘ The shared bound constant across the client/server seam is F.W5–W8's
 * (`EV-B-2`'s contract half). Until it exists this is a local mirror and says so.
 */
const MAX_BUDGET = 50;
const MIN_BUDGET = 2;

function clampBudget(v: number): number {
    return Math.max(MIN_BUDGET, Math.min(MAX_BUDGET, Math.round(v)));
}

function currentRequest(): ComputeEquationRequest {
    return {
        expression: expression.value.trim(),
        domain_start: domainStart.value,
        domain_end: domainEnd.value,
        n_harmonics: nHarmonics.value,
        n_eval_points: N_EVAL_POINTS,
        notation: notation.value,
        budget: clampBudget(budget.value),
    };
}

/**
 * The compute operation's identity — six of the seven request fields.
 *
 * `budget` is deliberately absent and the omission is SOUND, which is the thing
 * the old key could not say: every field of the compute response is either
 * determined by one of these six (`coefficients`, `original_points`,
 * `effective_n`, and — the `B-1` fix — `latex_sigma`, which is
 * notation-determined), or is repaired by the `doSimplify` the memo branch calls
 * on its way out (`latex` and `energy_captured`, which are exactly what
 * `/simplify` returns). Putting `budget` in here would turn every Display-terms
 * drag into a fresh symbolic integration for a string `/simplify` already owns.
 */
function computeKey(req: ComputeEquationRequest): string {
    return JSON.stringify([
        req.expression,
        req.domain_start,
        req.domain_end,
        req.n_harmonics,
        req.n_eval_points,
        req.notation,
    ]);
}

/** The render identity: the computed state, times the two knobs that re-render it. */
function displayKey(req: ComputeEquationRequest): string {
    return JSON.stringify([lastComputeKey, req.notation, req.budget]);
}

// ── Cache keys ──
//
// `L·M-3` — seeded from the record's OWN key, never re-derived from the inputs
// the user may have edited since. When they disagree, `:174`'s guard below fires
// a corrective recompute instead of showing an old result under new inputs.
let lastComputeKey = cachedRes?.key ?? "";
let lastDisplayKey = cachedRes ? displayKey(currentRequest()) : "";

// ── API ──

/**
 * `C·D-02`, the client half — the banner's truthiness gate used to be the whole
 * error channel, and `title` falls back to `response.statusText`, which is `""`
 * over HTTP/2: an empty string is falsy, so a real failure rendered as SILENCE.
 * A failure always names itself here, whatever the envelope managed to carry.
 *
 * ⊘ The other half is `lib/api-problem.ts`'s destructure, which removes `detail`
 * from `...extensions` and then drops FastAPI's array-shaped
 * `{"detail":[{loc,msg,type}]}` on a `typeof detail === "string"` test — that
 * file is unit `.f`'s and the row is declared to it, never written from here.
 */
function failureMessage(e: unknown, fallback: string): string {
    const msg = e instanceof Error ? e.message.trim() : "";
    return msg || fallback;
}

/**
 * `L·M-2` — abort identity. `abortable(key)` cancels the prior controller
 * SYNCHRONOUSLY before the first await, so request A's `finally` used to clear
 * `computing` while request B was still in flight: a whole network round trip
 * with the template fallen through to the EMPTY state mid-compute (⊘ that empty
 * state is `I-2`-protected — it is this defect's only visible symptom and is not
 * an "unused branch"). Reachable from a cold load, since the initial compute is
 * routinely superseded by a preset or an Enter press. A generation counter per
 * abort key makes every write and every flag clear belong to the request that is
 * actually current. doSimplify carries the same shape: it was consequence-free
 * only while `simplifying` had no template consumer, and `D-B4` just gave it one.
 */
let computeGeneration = 0;
let simplifyGeneration = 0;

async function doCompute(force = false) {
    const req = currentRequest();
    if (!req.expression) return;
    const key = computeKey(req);
    if (!force && key === lastComputeKey && result.value) {
        await doSimplify();
        return;
    }

    const gen = ++computeGeneration;
    computing.value = true;
    error.value = null;
    try {
        const res = await computeEquation(req);
        if (gen !== computeGeneration) return;
        result.value = res;
        lastComputeKey = key;
        displayLatex.value = res.latex;
        displayLatexSigma.value = res.latex_sigma;
        displayEnergy.value = res.energy_captured;
        // Capture display key BEFORE effectiveN triggers the vizHarmonics→budget
        // chain, so a subsequent doSimplify can detect the budget changed.
        lastDisplayKey = displayKey(req);
        effectiveN.value = res.effective_n;
        resultDomain.value = [req.domain_start, req.domain_end];
        saveCachedResult(key, res, displayLatex.value, displayEnergy.value);
    } catch (e) {
        if (!isAbortError(e) && gen === computeGeneration) {
            error.value = failureMessage(e, "Computation failed");
        }
    } finally {
        if (gen === computeGeneration) computing.value = false;
    }
}

async function doSimplify() {
    if (!components.value.length) return;
    const req = currentRequest();
    const key = displayKey(req);
    if (key === lastDisplayKey) return;

    const gen = ++simplifyGeneration;
    simplifying.value = true;
    try {
        const resp = await simplifyCoefficients(components.value, req.budget, req.notation);
        if (gen !== simplifyGeneration) return;
        displayLatex.value = resp.latex;
        displayEnergy.value = resp.energy_captured;
        lastDisplayKey = key;
        // `L·m-10` — `error` was cleared ONLY by doCompute, so a failed compute's
        // banner outlived every successful notation and budget re-render. Any
        // successful settle clears it.
        error.value = null;
        if (result.value) {
            saveCachedResult(lastComputeKey, result.value, displayLatex.value, displayEnergy.value);
        }
    } catch (e) {
        // `D·D-B4` — this was a terminal no-op (`/* silent */`): opposite error
        // postures at two async seams forty lines apart, and the silent one is
        // the seam the user drives most — every notation click, every budget
        // drag. It gets doCompute's banner.
        if (!isAbortError(e) && gen === simplifyGeneration) {
            error.value = failureMessage(e, "Could not re-render the series");
        }
    } finally {
        if (gen === simplifyGeneration) simplifying.value = false;
    }
}

/**
 * `L·M-7` — this lazily-loaded route component had no teardown at all, so a
 * dead instance's resolved handler wrote six refs and re-saved the cache AFTER a
 * fresh instance had already restored it. `abortInflight` exists at
 * `lib/api.ts:61` with four call sites, all in `stores/workspace.ts`; the
 * equation route was the one async surface not using it.
 */
onScopeDispose(() => abortInflight([...EQUATION_ABORT_KEYS]));

// ── Watches ──

// `L·M-6` — the rescale arm is GONE, not re-guarded. Its comment claimed to fire
// only when the budget sat "at or near the old cap", but `budget <= oldV` holds
// in EVERY reachable steady state (the first branch forces `budget ≤ v`, and the
// Display-terms slider's own `:max` IS `vizHarmonics`), so exactly one branch
// fired on every change and the user's explicit Display-terms choice was
// rewritten on every step of a Harmonics drag. That recurrence — `budget(v) =
// v − 10` on a monotone up-drag — is `B-2`'s engine, and a guard that merely
// said what the comment said would keep a rescale nobody asked for. What
// survives is the only honest half: when the cap DROPS below the choice, the
// choice is lowered to the cap.
//
// `M-BR` — `immediate: true` is the restore-time reconciliation the watcher
// never had: `autoHarmonics` is not persisted and resets true, so a reload could
// collapse `vizHarmonics` below a restored `budget` with no watcher fire at all.
watch(vizHarmonics, (v) => {
    if (budget.value > v) budget.value = Math.max(MIN_BUDGET, v);
}, { immediate: true });

watch(
    () => [expression.value, domainStart.value, domainEnd.value, nHarmonics.value, budget.value, notation.value],
    () => saveCachedInputState({
        expression: expression.value,
        domainStart: domainStart.value,
        domainEnd: domainEnd.value,
        nHarmonics: nHarmonics.value,
        budget: budget.value,
        notation: notation.value,
    }),
);

// Initial compute. `L·M-3` — nullity is not the question; PROVENANCE is. A
// restored result whose own key disagrees with the restored inputs is a result
// for a different request, and the corrective recompute the old `!result.value`
// test could never fire now does.
if (!result.value || computeKey(currentRequest()) !== lastComputeKey) doCompute();

// `B-1` — the Notation control used to be inert in the DEFAULT mode: `eqMode`
// starts at `"sigma"`, `activeLatex` prefers `displayLatexSigma`, and the ONLY
// writer of `displayLatexSigma` is a compute — `/simplify` has no `latex_sigma`
// field on either side of the wire. Routing notation through `doCompute` is the
// cure the key fix above makes possible: the notation is IN the compute
// identity, so the memo no longer swallows the change, and the `force` memo
// branch (`L·m-1`, dead until now because nothing ever called `doCompute(false)`
// with a result in hand) comes alive as the cheap path for a budget-only edit.
// ⊘ `latex_sigma` on `SimplifyResponse` is the F.W5–W8 contract half; until it
// lands, a notation change costs a recompute, and that is the honest price.
watchDebounced(
    () => [notation.value, budget.value] as const,
    () => { if (result.value) doCompute(); },
    { debounce: 200 },
);
</script>

<template>
    <div class="flex flex-col flex-1 min-h-0">
        <!-- Mobile tab bar -->
        <div class="flex px-3 py-1 bg-background lg:hidden">
            <SegmentedTabs variant="underline"
                :options="[{ label: 'Controls', value: 'controls' }, { label: 'Canvas', value: 'canvas' }]"
                :model-value="mobileView"
                @update:model-value="mobileView = $event as 'controls' | 'canvas'" />
        </div>

        <div class="eq-grid">
            <!-- Left panel -->
            <div class="eq-panel-left-wrap" :class="{ 'panel-inactive': mobileView !== 'controls' && !isDesktop }">
                <!-- X.F.W3 `.d` — `fr-EquationView D·D-M14`, dying inside the
                     `M-6` FadingScroll adoption exactly as the family books it.
                     The trailing feather was a `::after` on the WRAPPER: a fixed
                     2.5rem gradient painted unconditionally whenever the panel
                     was mounted at ≥1024px and `display:none` below it — so it
                     lied in both directions at once, hiding content that had
                     already been scrolled to the end and vanishing on the
                     viewport where a 480px column overflows most. The producer's
                     port measures its own scroll extent and feathers the edge
                     that actually has trailing overflow, at every width, and it
                     names the port while it is at it. -->
                <FadingScroll axis="y" aria-label="Equation controls" class="eq-panel-left">
                    <FunctionInput
                        v-model:expression="expression"
                        v-model:domain-start="domainStart"
                        v-model:domain-end="domainEnd"
                        v-model:n-harmonics="nHarmonics"
                        v-model:budget="budget"
                        v-model:notation="notation"
                        :effective-n="effectiveN"
                        :energy-captured="displayEnergy"
                        :auto-harmonics="autoHarmonics"
                        :viz-harmonics="vizHarmonics"
                        @update:auto-harmonics="autoHarmonics = $event"
                        @compute="doCompute(true)"
                    />
                    <Transition name="slide-down">
                        <EqCoefficientsPanel
                            v-if="components.length"
                            :components="components"
                            :rendered-terms="budget"
                        />
                    </Transition>
                </FadingScroll>
            </div>

            <!-- Right panel -->
            <div
                class="eq-panel-right"
                :class="{ 'panel-inactive': mobileView !== 'canvas' && !isDesktop, 'is-busy': loading }"
                :aria-busy="loading"
            >
                <!-- Loading (no prior result) -->
                <div v-if="computing && !result" class="flex items-center justify-center flex-1" role="status">
                    <div class="flex flex-col items-center gap-3">
                        <div class="size-6 animate-spin rounded-full border-2 border-border border-t-primary" aria-hidden="true" />
                        <p class="text-sm text-muted-foreground fira-code">Computing…</p>
                    </div>
                </div>

                <!-- Error (no prior result) -->
                <div v-else-if="error && !result" class="flex items-center justify-center flex-1">
                    <div class="cartoon-card p-4 max-w-md text-center" role="alert">
                        <p class="text-sm font-medium text-foreground mb-1">Computation failed</p>
                        <p class="text-sm text-muted-foreground fira-code break-words">{{ error }}</p>
                        <Button emphasis="secondary" size="sm" class="mt-3" @click="doCompute(true)">
                            Try again
                        </Button>
                    </div>
                </div>

                <!-- Results -->
                <template v-else-if="result">
                    <!-- Re-compute status banners. `D·D-M6` — the async surfaces
                         had zero live-region semantics, so a screen-reader user
                         got no announcement of start, completion or failure;
                         this pass lands with `D-B4`'s `loading` wiring, as the
                         record asks. -->
                    <div
                        v-if="loading"
                        class="cartoon-card px-3 py-2 flex items-center gap-2 text-sm shrink-0"
                        role="status"
                    >
                        <div class="size-3.5 animate-spin rounded-full border-[1.5px] border-border border-t-primary" aria-hidden="true" />
                        <span class="text-muted-foreground fira-code">
                            {{ computing ? "Recomputing…" : "Re-rendering…" }}
                        </span>
                    </div>
                    <div
                        v-else-if="error"
                        class="cartoon-card px-3 py-2 flex items-start gap-2 text-sm border-red-500/30 bg-red-500/5 shrink-0"
                        role="alert"
                    >
                        <span class="font-medium text-red-400 shrink-0">Error:</span>
                        <!-- `D·D-M7` — the message used to `truncate` with no
                             `title`, no wrap and no way to read the rest of it,
                             and neither error surface offered a retry. -->
                        <span class="text-muted-foreground fira-code break-words min-w-0" :title="error">{{ error }}</span>
                        <Button emphasis="quiet" size="sm" class="ml-auto shrink-0" @click="doCompute(true)">
                            Retry
                        </Button>
                    </div>

                    <!-- Equation card -->
                    <div
                        ref="eqCardRef"
                        class="cartoon-card relative eq-card"
                        @mousemove="(e) => onCoeffMove(e, eqCardRef)"
                        @mouseleave="onCoeffLeave"
                    >
                        <EquationResult :latex="activeLatex" />

                        <!-- Per-coefficient popover -->
                        <Transition name="pop">
                            <div
                                v-if="hoveredCoeff && popoverHtml"
                                class="coeff-popover glass-floating"
                                :style="{ left: `${popoverPos.x}px`, top: `${popoverPos.y}px` }"
                            >
                                <div class="coeff-popover-inner" v-html="popoverHtml" />
                            </div>
                        </Transition>

                        <!-- Mode toggle -->
                        <div class="eq-mode-anchor">
                            <EquationModeToggle v-model="eqMode" />
                        </div>

                        <!-- Info card. F.W1 / FR-COB-19 — `./hover-card` is
                             definition-absent at the adopted pin; the Popover
                             union takes it, with `trigger="hover"` preserving the
                             preview register and seating the click root on coarse
                             pointers. `:collision-padding` is gone with it: the
                             union's placement contract is side/sideOffset/align/
                             alignOffset, so the attribute would have fallen
                             through to the DOM doing nothing (FR-TT-5's class). -->
                        <Popover v-if="tier" trigger="hover" :open-delay="200" :close-delay="150">
                            <PopoverTrigger as-child>
                                <!-- `D·D-B2` — the info button had NO accessible name:
                                     an icon-only Button wrapping a bare glyph, with
                                     `PopoverTrigger as-child` forwarding no naming
                                     attribute. The convention exists three siblings
                                     over. -->
                                <Button emphasis="primary" size="md" icon-only class="info-anchor"
                                        aria-label="About this approximation">
                                    <!-- F.W1 / D·D-M11 — the one hand-inlined copy the
                                         import-keyed lucide sweep is blind to: this markup
                                         was element-identical to lucide `Info`, which this
                                         file already imports. -->
                                    <Info class="size-[18px]" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent class="info-hovercard" side="bottom" :side-offset="6" align="end">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <!-- `D·D-B3` — the ink is a token now, and the plate
                                         is TRANSPARENT: a 15% tint of the ink itself
                                         darkened the ground under the very colour it was
                                         tinting, which is what took every stop further
                                         below the floor. The border still carries the
                                         tier hue; the label is graded against the
                                         popover it actually sits on. -->
                                    <span
                                        class="inline-flex items-center px-2 py-0.5 rounded-full text-sm font-semibold border-[1.5px]"
                                        :style="{
                                            borderColor: `color-mix(in srgb, ${tier.color} 45%, transparent)`,
                                            color: tier.color,
                                        }"
                                    >{{ tier.label }}</span>
                                    <Metric
                                        :value="(displayEnergy * 100).toFixed(1)"
                                        unit="% energy"
                                        size="sm"
                                        :style="{ color: eColor }"
                                    />
                                </div>
                                <div class="flex gap-1.5 items-start text-sm text-muted-foreground mt-2">
                                    <Info class="size-3.5 shrink-0 mt-0.5" />
                                    <p>{{ tier.description }}</p>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <!-- Convergence plot -->
                    <div class="cartoon-card px-3 py-2 flex-1 min-h-0 flex flex-col">
                        <ConvergencePlot
                            class="flex-1"
                            :original-points="result.original_points"
                            :coefficients="result.coefficients"
                            :n-harmonics="vizHarmonics"
                            :domain="resultDomain"
                            :expression="expression"
                        />
                    </div>
                </template>

                <!-- Empty state -->
                <div v-else class="flex items-center justify-center flex-1">
                    <p class="text-sm text-muted-foreground cm-serif italic">
                        Enter a function to see its Fourier series
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@reference "tailwindcss";

/* ── Grid layout ── */
.eq-grid {
    @apply flex flex-col flex-1 min-h-0 p-1 gap-1;
}
@media (min-width: 1024px) {
    .eq-grid {
        display: grid;
        grid-template-columns: 360px 1fr;
        grid-template-rows: 1fr;
        gap: 0.5rem;
        padding: 0.5rem;
        padding-bottom: 0.75rem;
        overflow: hidden;
    }
}
@media (min-width: 1280px) { .eq-grid { grid-template-columns: 400px 1fr; } }
@media (min-width: 1536px) { .eq-grid { grid-template-columns: 440px 1fr; } }

/* ── Left panel ── */
.eq-panel-left-wrap {
    @apply relative flex flex-col w-full min-h-0;
    max-width: 480px;
    margin: 0 auto;
    overflow-x: visible;
    overflow-y: clip;
    flex: 1;
}
@media (max-width: 1023px) { .eq-panel-left-wrap { overflow: visible; flex: none; } }
@media (min-width: 1024px) { .eq-panel-left-wrap { max-width: none; margin: 0; } }

/* X.F.W3 `.d` — `D·D-M14`: the hand-rolled `::after` feather is DELETED, not
   re-tuned. `<FadingScroll axis="y">` owns the port's scroll behaviour and its
   edge treatment, so the port's own `overflow-y` retires with the gradient;
   what stays here is the LAYOUT this column asks for. */
.eq-panel-left {
    @apply flex flex-col gap-3 w-full pb-8 min-h-0 flex-1;
}
@media (min-width: 1024px) { .eq-panel-left { padding-right: 0.25rem; } }

/* ── Right panel ── */
.eq-panel-right {
    @apply flex flex-col gap-3 min-h-0 min-w-0 flex-1;
    overflow-y: auto;
    overflow-x: hidden;
}

/* `D·D-B4` — the unified busy state was designed and never wired: `loading` had
   zero consumers. The equation stage dims while either async seam is in flight,
   which is the sighted half of the `aria-busy` the panel now also carries. */
.eq-panel-right.is-busy .eq-card {
    opacity: 0.6;
    transition: opacity 0.15s var(--ease-standard);
}

/* ── Equation card ── */
.eq-card {
    height: 10rem;
    flex-shrink: 0;
    overflow: hidden;
}

/* ── Coefficient popover ── */
.coeff-popover {
    @apply absolute pointer-events-none rounded-lg;
    transform: translateX(-50%);
    z-index: var(--z-bar);
    min-width: 160px;
    max-width: 320px;
    padding: 0.5rem 0.75rem;
    box-shadow: 0 4px 12px color-mix(in srgb, var(--foreground) 8%, transparent);
}

.coeff-popover-inner :deep(.katex-display) {
    margin: 0;
    padding: 0;
    overflow: visible !important;
}
.coeff-popover-inner :deep(.katex) {
    font-size: 1em;
    text-align: left;
}

/* ── Golden hover on sigma coefficients ── */
.eq-card :deep(.eq-coeff) {
    cursor: pointer;
    border-radius: var(--radius-xs);
    padding: 0 2px;
    transition: color 0.12s ease, background 0.12s ease;
}
.eq-card :deep(.eq-coeff:hover) {
    color: var(--viz-amber) !important;
    background: color-mix(in srgb, var(--viz-amber) 10%, transparent);
}

/* ── Anchors ── */
.eq-mode-anchor {
    @apply absolute top-2 left-2;
    z-index: var(--z-controls);
}
.info-anchor {
    @apply absolute top-2;
    right: 3.25rem;
    z-index: var(--z-bar);
}

/* ── Mobile panel toggle ── */
@media (max-width: 1023px) {
    .panel-inactive {
        display: none;
    }
}

/* ── Transitions (A.W3.d — bezier→token; transition:all→named properties) ── */
.pop-enter-active  { transition: opacity 0.15s var(--ease-standard), transform 0.15s var(--ease-standard); }
.pop-leave-active  { transition: opacity 0.1s var(--ease-in), transform 0.1s var(--ease-in); }
.pop-enter-from    { opacity: 0; transform: translateY(-4px) scale(0.97); }
.pop-leave-to      { opacity: 0; transform: translateY(-2px) scale(0.98); }

.slide-down-enter-active { transition: opacity 0.3s var(--ease-standard), transform 0.3s var(--ease-standard); }
.slide-down-leave-active { transition: opacity 0.2s var(--ease-in), transform 0.2s var(--ease-in); }
.slide-down-enter-from   { opacity: 0; transform: translateY(-8px); }
.slide-down-leave-to     { opacity: 0; transform: translateY(-4px); }
</style>

<!-- Global style for portaled Popover content -->
<style>
.info-hovercard {
    /* `M-ZM` — this painted at `--z-modal` (140) on a ladder that ships an
       exactly-named `--z-hovercard` rung (120) two levels below, so a
       hover-opened, close-delayed surface could outlive and overlay a dialog. */
    z-index: var(--z-hovercard);
    width: 300px;
    padding: 0.75rem;
    color: var(--popover-foreground);
    background: var(--popover);
    border: 1.5px solid var(--border);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    animation: tooltip-in 0.15s var(--ease-out-expo);
    /* `M-US` — `user-select: none` is defensible for a one-line label and wrong
       for an explanatory paragraph: it made the tier description, which the
       record nominates as copy that should survive any redesign, uncopyable. */
}
</style>
