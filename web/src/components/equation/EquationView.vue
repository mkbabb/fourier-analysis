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
import { tierInfo } from "@/lib/equation/notation";
import { ApiProblem, problemMessage } from "@/lib/api-problem";
import { Button } from "@mkbabb/glass-ui/button";
import { Badge } from "@mkbabb/glass-ui/badge";
import { Card } from "@mkbabb/glass-ui/card";
import { Progress } from "@mkbabb/glass-ui/progress";
import { Popover, PopoverTrigger, PopoverContent } from "@mkbabb/glass-ui/popover";
import { Metric } from "@mkbabb/glass-ui/metric";
import { Configurator } from "@mkbabb/glass-ui/configurator";
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
/**
 * X.F.W14U.eq — UIA-F-112 / F-113 (consumer): the server answers an invalid
 * f(x) with a typed 422 (`urn:contract:validation-failed`, `.srv` `798c98f`).
 * That is the INPUT's fault, not the service's, so it is a field state under the
 * Expression (never a Retry: re-sending the same bad input cannot succeed), and
 * it lives in the Controls pane, where the user is typing at every width.
 */
const expressionError = ref<string | null>(null);
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
/**
 * UIA-F-253 — the tier is glass's `Badge` on its semantic tone register (the
 * hand-rolled stadium badge retires). R-2 from `.vedit` (UIA-F-178's twin): the
 * energy is a measurement, so its Metric keeps glass's ink (no `energyColor`).
 */
const TIER_TONE = { symbolic: "success", identified: "warning", spline: "info" } as const;
const tierTone = computed(() => TIER_TONE[(result.value?.tier ?? "spline") as keyof typeof TIER_TONE] ?? "info");
/** UIA-F-202 — the result on screen answers an earlier request. */
const stale = computed(() => !!result.value && (!!error.value || !!expressionError.value));
/**
 * UIA-F-201 — one variable across the page: the plot and its legend speak the
 * variable the rendered series is written in.
 */
const seriesVariable = computed(() => activeLatex.value.match(/f\s*\(\s*([a-z])\s*\)/)?.[1] ?? "x");

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
        auto_harmonics: autoHarmonics.value,
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

/**
 * The render identity: the computed state, times the knobs that re-render it.
 * X.F.W14V `.u2` — UIA-F-201: Auto is one of them, because the Σ form is
 * bounded at the displayed N (the effective N under Auto, every harmonic off it).
 */
function displayKey(req: ComputeEquationRequest): string {
    return JSON.stringify([lastComputeKey, req.notation, req.budget, req.auto_harmonics]);
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
    return problemMessage(e, fallback);
}

/**
 * UIA-F-112 — the server's typed rejection of the INPUT (422
 * `urn:contract:validation-failed`). Transient failures (429, 5xx, the network)
 * are not this, and keep the Retry.
 */
function isInputRejection(e: unknown): e is ApiProblem {
    return e instanceof ApiProblem && e.status === 422 && e.type === "urn:contract:validation-failed";
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
    expressionError.value = null;
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
            if (isInputRejection(e)) expressionError.value = failureMessage(e, "This expression cannot be computed");
            else error.value = failureMessage(e, "Computation failed");
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
        const resp = await simplifyCoefficients(components.value, req.budget, req.notation, req.auto_harmonics);
        if (gen !== simplifyGeneration) return;
        displayLatex.value = resp.latex;
        displayLatexSigma.value = resp.latex_sigma;
        if (result.value) result.value.latex_sigma = resp.latex_sigma;
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

// UIA-F-112 — an edit answers the field's error; the next compute re-judges it.
watch(expression, () => { expressionError.value = null; });

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
// X.F.W14U.eq — UIA-F-35 (consumer): the budget counts harmonics with DC as
// one, so the cap that shows every drawn harmonic is N + 1.
watch(vizHarmonics, (v) => {
    if (budget.value > v + 1) budget.value = Math.max(MIN_BUDGET, v + 1);
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
// `latex_sigma` on `SimplifyResponse` landed at X.F.W14V `.u2` (UIA-F-201), so a
// budget or Auto change re-renders BOTH forms through the memo branch; the
// notation stays in the compute identity above, so it still recomputes.
watchDebounced(
    () => [notation.value, budget.value, autoHarmonics.value] as const,
    () => { if (result.value) doCompute(); },
    { debounce: 200 },
);
</script>

<template>
    <div class="flex flex-col flex-1 min-h-0">
        <!-- Mobile tab bar. UIA-F-253 — no opaque band: the strip sits on the
             page's own ground, as `/w`'s does. -->
        <div class="flex px-3 py-1 lg:hidden">
            <SegmentedTabs variant="underline"
                :options="[{ label: 'Controls', value: 'controls' }, { label: 'Canvas', value: 'canvas' }]"
                v-model="mobileView" />
        </div>

        <!-- X.F.W14V.eq2 — F-W14V.md addendum (b), COHESION §0dh. /equation is a
             stage (the series and its convergence plot) plus a controls
             inspector (the Function and Coefficients layers), the shape
             /visualize already is. The owner called the pages "inconsistent",
             so one page shape takes one primitive: glass's `Configurator` with
             `layout="detached"` (the stage and the aside are each glass's own
             card over the page ground). The local grid, the controls column's
             own FadingScroll (the aside's `scroll-mode="auto"` port replaces
             it) and the stage's `cartoon-card` stamps retire with the move.
             `.glass-opaque` is /visualize's OA-43 choice: both cards are the
             solid `--card`. -->
        <Configurator scroll-mode="auto" layout="detached" class="eq-configurator glass-opaque">
            <template #stage>
            <div
                class="eq-panel-right"
                :class="{ 'panel-inactive': mobileView !== 'canvas' && !isDesktop, 'is-busy': loading }"
                :aria-busy="loading"
            >
                <!-- Loading (no prior result). X.F.W14U.eq — UIA-F-202 ⊕ F-71's
                     carried sites: glass's indeterminate Progress, not a
                     transparent-topped ring. -->
                <div v-if="computing && !result" class="eq-state" role="status">
                    <Progress :model-value="null" variant="liquid" size="sm" class="eq-state-bar" aria-label="Computing the series" />
                    <p class="text-caption text-muted-foreground">Computing…</p>
                </div>

                <!-- Error (no prior result): a transient failure keeps its retry. -->
                <div v-else-if="error && !result" class="eq-state">
                    <Card class="eq-state-card">
                        <div role="alert" class="text-center">
                            <p class="text-small font-medium text-foreground mb-1">Computation failed</p>
                            <p class="text-caption text-muted-foreground fira-code break-words">{{ error }}</p>
                            <Button emphasis="secondary" size="sm" class="mt-3" @click="doCompute(true)">
                                Try again
                            </Button>
                        </div>
                    </Card>
                </div>

                <!-- Results -->
                <template v-else-if="result">
                    <!-- Equation card. X.F.W14U.eq — UIA-F-202: the status surfaces
                         are OUT OF FLOW (an overlay on this card), so a recompute or a
                         failure moves nothing; a result that answers an earlier
                         request is marked stale (dimmed, `data-stale`). -->
                    <div
                        ref="eqCardRef"
                        class="relative eq-card"
                        :data-stale="stale || undefined"
                        @mousemove="(e) => onCoeffMove(e, eqCardRef)"
                        @mouseleave="onCoeffLeave"
                    >
                        <EquationResult :latex="activeLatex">
                            <template #leading>
                                <EquationModeToggle v-model="eqMode" />
                            </template>
                            <template #actions>
                                <!-- Info card. F.W1 / FR-COB-19 — the Popover union's hover
                                     arm; `D·D-B2` names the icon-only trigger. -->
                                <Popover v-if="tier" trigger="hover" :open-delay="200" :close-delay="150">
                                    <PopoverTrigger as-child>
                                        <Button emphasis="primary" size="md" icon-only
                                                aria-label="About this approximation">
                                            <Info class="size-[18px]" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent class="info-hovercard" side="bottom" :side-offset="6" align="end"
                                        aria-label="About this approximation">
                                        <!-- UIA-F-253 — glass Badge on its tone register; the
                                             energy Metric keeps glass's ink (R-2). -->
                                        <div class="flex items-center gap-2 flex-wrap">
                                            <Badge :tone="tierTone">{{ tier.label }}</Badge>
                                            <Metric
                                                :value="(displayEnergy * 100).toFixed(1)"
                                                unit="% energy"
                                                size="sm"
                                            />
                                        </div>
                                        <div class="flex gap-1.5 items-start text-small text-muted-foreground mt-2">
                                            <Info class="size-3.5 shrink-0 mt-0.5" />
                                            <p>{{ tier.description }}</p>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </template>
                        </EquationResult>

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

                        <Transition name="status-fade" mode="out-in">
                            <div v-if="loading" class="eq-status glass-floating glass-opaque" role="status">
                                <Progress :model-value="null" variant="liquid" size="sm" class="eq-status-bar"
                                    :aria-label="computing ? 'Recomputing the series' : 'Re-rendering the series'" />
                                <span class="text-caption text-muted-foreground">{{ computing ? "Recomputing…" : "Re-rendering…" }}</span>
                            </div>
                            <div v-else-if="error" class="eq-status glass-floating glass-opaque" role="alert">
                                <span class="text-caption font-medium text-foreground shrink-0">Not updated</span>
                                <span class="text-caption text-muted-foreground fira-code break-words min-w-0" :title="error">{{ error }}</span>
                                <Button emphasis="quiet" size="sm" class="shrink-0" @click="doCompute(true)">Retry</Button>
                            </div>
                            <div v-else-if="expressionError" class="eq-status glass-floating glass-opaque" role="status">
                                <span class="text-caption text-muted-foreground">Showing the last expression that computed</span>
                            </div>
                        </Transition>
                    </div>

                    <!-- Convergence plot -->
                    <div class="px-3 py-2 flex-1 min-h-0 flex flex-col eq-plot-card" :data-stale="stale || undefined">
                        <ConvergencePlot
                            class="flex-1"
                            :original-points="result.original_points"
                            :coefficients="result.coefficients"
                            :n-harmonics="vizHarmonics"
                            :domain="resultDomain"
                            :expression="expression"
                            :variable="seriesVariable"
                        />
                    </div>
                </template>

                <!-- Empty state -->
                <div v-else class="flex items-center justify-center flex-1">
                    <p class="text-small text-muted-foreground font-serif-math italic">
                        {{ expressionError ? "Correct the expression to see its Fourier series" : "Enter a function to see its Fourier series" }}
                    </p>
                </div>
            </div>
            </template>

            <!-- The controls aside: the sections are glass ConfiguratorLayers
                 (X.F.W14U.eq — UIA-F-114: adjacent siblings, no gap, so glass
                 fuses them into one group). No layer carries a reset; a reset
                 would sit in its layer's `#actions`. -->
            <div class="eq-panel-left-wrap" role="group" aria-label="Equation controls"
                :class="{ 'panel-inactive': mobileView !== 'controls' && !isDesktop }">
                <div class="eq-layers">
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
                        :expression-error="expressionError"
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
                </div>
            </div>
        </Configurator>
    </div>
</template>

<style scoped>
@reference "tailwindcss";

/* ── The Configurator chassis (X.F.W14V.eq2) ──
   glass's `Configurator` supplies the stage|aside grid and, detached, each
   region's card and the gap between them. The host only makes the shell
   flex-fill the column and sets the aside's width band, as /visualize does
   (`:deep`, because the shell is glass's element, not this component's root). */
:deep(.eq-configurator) {
    flex: 1;
    min-height: 0;
    margin: 0.25rem 1rem;
}
@media (min-width: 1024px) {
    :deep(.eq-configurator) {
        margin: 0.5rem;
        margin-bottom: 0.75rem;
        --configurator-aside-min: calc(320px + 2 * var(--space-body));
        --configurator-aside-max: calc(360px + 2 * var(--space-body));
    }
}
@media (min-width: 1280px) {
    :deep(.eq-configurator) { --configurator-aside-min: calc(360px + 2 * var(--space-body)); --configurator-aside-max: calc(400px + 2 * var(--space-body)); }
}
@media (min-width: 1536px) {
    :deep(.eq-configurator) { --configurator-aside-min: calc(400px + 2 * var(--space-body)); --configurator-aside-max: calc(440px + 2 * var(--space-body)); }
}
/* Below lg the grid is one column and the Controls/Canvas tabs pick a region,
   the same rules /visualize carries: the column may not outgrow the shell, the
   active stage fills it, and an inactive region takes no box (a detached card
   would otherwise paint an empty border and hold a gap). */
@media (max-width: 1023px) {
    :deep(.eq-configurator > [data-slot="configurator"]) { display: flex; flex-direction: column; min-width: 0; }
    :deep(.eq-configurator .configurator-stage) { flex: 1 1 0%; min-height: 0; }
    :deep(.eq-configurator .configurator-stage:has(> .panel-inactive)),
    :deep(.eq-configurator .configurator-aside:has(.eq-panel-left-wrap.panel-inactive)) {
        display: none;
    }
}

/* ── Controls (the aside body) ── */
.eq-panel-left-wrap {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 0.5rem;
}
/* X.F.W14U.eq — UIA-F-114: the layers stack with no gap, so glass's
   adjacent-layer rule joins them into one group. */
.eq-layers {
    display: flex;
    flex-direction: column;
}

/* ── Stage (the Configurator #stage cell body) ── */
/* glass's `.configurator-stage` cell is a grid cell, not a flex container, so
   the body fills it explicitly and owns its own vertical scroll. */
.eq-panel-right {
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
}
/* The series and its plot are two regions of the one stage card, divided by
   glass's configurator hairline. */
.eq-plot-card {
    border-top: 1px solid var(--configurator-divider);
}

/* `D·D-B4` — the unified busy state was designed and never wired: `loading` had
   zero consumers. The equation stage dims while either async seam is in flight,
   which is the sighted half of the `aria-busy` the panel now also carries. */
.eq-panel-right.is-busy .eq-card > :not(.eq-status) {
    opacity: 0.6;
    transition: opacity 0.15s var(--ease-standard);
}

/* X.F.W14U.eq — UIA-F-202: a result that answers an earlier request is dimmed
   (never the status that says why). */
.eq-card[data-stale] > :not(.eq-status):not(.coeff-popover),
.eq-plot-card[data-stale] {
    opacity: 0.55;
    transition: opacity 0.15s var(--ease-standard);
}

/* UIA-F-202 — the status is OUT OF FLOW: a floating plate that straddles the
   seam between the series and the plot (the stage's hairline; half over each
   region's margin, clear of the equation's last line and the plot's first curve), so a
   recompute or a failure moves nothing on the page. */
.eq-status {
    position: absolute;
    inset-inline: 0.75rem;
    bottom: 0;
    transform: translateY(50%);
    margin-inline: auto;
    width: fit-content;
    max-width: calc(100% - 1.5rem);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    border-radius: var(--radius-panel);
    z-index: var(--z-bar);
}
.eq-status-bar {
    width: 6rem;
    flex: none;
}

/* The cold states (no prior result): centred in the panel. */
.eq-state {
    @apply flex flex-col items-center justify-center flex-1 gap-3;
}
.eq-state-bar {
    width: 10rem;
}
.eq-state-card {
    max-width: 28rem;
    padding: 1rem;
}

/* ── Equation card ── */
/* X.F.W14.u — UIA-F-34: a floor, not a fixed box — the card grows with the
   header row and the equation instead of cutting them at 10rem.
   UIA-F-32: no `overflow: hidden`, so the per-coefficient popover escapes the
   card instead of being clipped to its first line (the equation's own scroll
   region owns the inline overflow). */
.eq-card {
    min-height: 10rem;
    flex-shrink: 0;
}

/* ── Coefficient popover ── */
/* UIA-F-203 — the two floating surfaces (this and the plot's tooltip) share
   glass's popover canon: the `--radius-panel` corner of `.popover-content`.
   The glass primitive itself cannot host them yet (no virtual anchor export,
   ESCALATED with `.vedit` E-2). */
.coeff-popover {
    @apply absolute pointer-events-none;
    border-radius: var(--radius-panel);
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

/* The status plate owns its transform (the seam offset), so it fades only. */
.status-fade-enter-active { transition: opacity 0.15s var(--ease-standard); }
.status-fade-leave-active { transition: opacity 0.1s var(--ease-in); }
.status-fade-enter-from, .status-fade-leave-to { opacity: 0; }

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
