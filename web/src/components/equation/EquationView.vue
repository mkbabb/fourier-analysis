<script lang="ts">
import {
    computeEquation,
    isAbortError,
    abortInflight,
    EQUATION_ABORT_KEYS,
} from "@/lib/equation/api";
import type { NotationMode, ComputeEquationRequest, ComputeEquationResponse, FourierTermDTO, EquationDisplayMode } from "@/lib/equation/types";
import {
    loadCachedInputState,
    saveCachedInputState,
    loadCachedResult,
    saveCachedResult,
    type CachedInputState,
} from "./composables/useEquationCache";

/** The inputs a first visit opens on. */
const DEFAULT_INPUT: CachedInputState = {
    expression: "x*(pi - x)",
    domainStart: 0,
    domainEnd: Math.PI,
    nHarmonics: 20,
    notation: "trig",
};

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

/** The request the view sends for these inputs (`auto_harmonics` is not persisted). */
function requestFor(input: CachedInputState, autoHarmonics: boolean, budget: number): ComputeEquationRequest {
    return {
        expression: input.expression.trim(),
        domain_start: input.domainStart,
        domain_end: input.domainEnd,
        n_harmonics: input.nHarmonics,
        n_eval_points: N_EVAL_POINTS,
        notation: input.notation,
        budget: clampBudget(budget),
        auto_harmonics: autoHarmonics,
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
 * X·OD19 ALL — the route's prefetch on navigation intent (`prefetchRoute` in
 * `router/index.ts` calls it when the reader points at the section). The
 * first visit's compute was a cold server integration (1.7–2.5 s TTFB) that
 * started only once the view mounted, behind a loader. It now starts on intent,
 * for exactly the request the view will send (the restored inputs, or the
 * defaults): a view that mounts while it is in flight takes the promise
 * (`takePrefetch`) instead of sending a second request, and a compute that
 * lands first is filed in the session cache the view restores from, so the
 * view mounts on its result. Nothing is fetched when the cache already holds
 * that request's answer.
 */
let pending: { key: string; response: Promise<ComputeEquationResponse> } | null = null;

export function prefetch(): void {
    const input = loadCachedInputState() ?? DEFAULT_INPUT;
    const req = requestFor(input, true, input.nHarmonics + 1);
    if (!req.expression) return;
    const key = computeKey(req);
    if (pending?.key === key || loadCachedResult()?.key === key) return;
    const response = computeEquation(req);
    pending = { key, response };
    response.then(
        (res) => {
            if (pending?.response !== response) return;
            pending = null;
            saveCachedResult(key, res, res.latex, res.energy_captured);
        },
        () => {
            if (pending?.response === response) pending = null;
        },
    );
}

/** The in-flight prefetch for `key`, handed over once (the view owns it from here). */
function takePrefetch(key: string): Promise<ComputeEquationResponse> | null {
    if (pending?.key !== key) return null;
    const { response } = pending;
    pending = null;
    return response;
}
</script>

<script setup lang="ts">
import { ref, shallowRef, computed, watch, onScopeDispose, useTemplateRef, h } from "vue";
import { useRoute, useRouter } from "vue-router";
import { formatEquationQuery, hasEquationState, parseEquationQuery, type EquationView as EquationUrlView } from "@/lib/equation/query";
import { isOwnWrite, pageOf, writeParams } from "@/lib/urlState";
import { PAGE_TOOLS_COMPACT, providePageTools } from "@/composables/usePageTools";
import EquationTools from "./EquationTools.vue";
import PlotToolsDock from "./PlotToolsDock.vue";
import type { JobStage } from "@/lib/api";
import { jobProgressValue, jobStageLabel } from "@/lib/jobProgress";
import { useMediaQuery, watchDebounced } from "@vueuse/core";
import { useWorkspaceForm } from "@/composables/useWorkspaceForm";
import { useWorkspacePane } from "@/composables/useWorkspacePane";
import type { BasisComponent } from "@/lib/types";
import { tierInfo } from "@/lib/equation/notation";
import { ApiProblem, problemMessage } from "@/lib/api-problem";
import { Button } from "@mkbabb/glass-ui/button";
import { Progress } from "@mkbabb/glass-ui/progress";
import { Skeleton } from "@mkbabb/glass-ui";
import { Configurator } from "@mkbabb/glass-ui/configurator";

import FunctionInput from "./FunctionInput.vue";
import EquationResult from "./EquationResult.vue";
import EquationModeToggle from "./EquationModeToggle.vue";
import ConvergencePlot from "./ConvergencePlot.vue";
import CoefficientsPanel from "@/components/shared/CoefficientsPanel.vue";

import { useCoeffHover } from "./composables/useCoeffHover";
import { useSimplifiedSeries } from "./composables/useSimplifiedSeries";

// ── Input state (restore from cache) ──
/*
 * Owner, 2026-11-15: "Each page should have state defined in the URL". The
 * explorer's view is in its query (`lib/equation/query.ts`): a link that names
 * any of it is the whole view (an absent key is its default); the clean
 * `/equation` restores this reader's last session (the cache) and writes it
 * into the URL, so a copied link is the view on screen.
 */
const route = useRoute();
const router = useRouter();
const ownPage = pageOf(route);
const fromUrl = hasEquationState(route.query) ? parseEquationQuery(route.query) : null;
const cached = fromUrl ? null : loadCachedInputState();
const expression = ref(fromUrl?.f ?? cached?.expression ?? DEFAULT_INPUT.expression);
const domainStart = ref(fromUrl?.a ?? cached?.domainStart ?? DEFAULT_INPUT.domainStart);
const domainEnd = ref(fromUrl?.b ?? cached?.domainEnd ?? DEFAULT_INPUT.domainEnd);
const nHarmonics = ref(fromUrl?.n ?? cached?.nHarmonics ?? DEFAULT_INPUT.nHarmonics);
const notation = ref<NotationMode>(fromUrl?.nt ?? cached?.notation ?? DEFAULT_INPUT.notation);
/** The sweep's paused point (`s`), null while it plays. */
const sweep = ref<number | null>(fromUrl?.s ?? null);
/** The plot's layers (`orig`, `harm`), the stage dock's menu. */
const showOriginal = ref(fromUrl?.orig ?? true);
const showHarmonics = ref(fromUrl?.harm ?? true);
const plotRef = useTemplateRef<{ exportPng: () => void }>("plot");

// ── Result state ──
const computing = ref(false);
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
const effectiveN = ref(cachedRes?.result?.effective_n ?? 20);
/**
 * `fr-ConvergencePlot L-M2` / `M-L1`, the callsite half — the plot used to bind
 * the LIVE domain refs against last-successful-response data, and
 * `onDomainInput` writes the model and emits nothing, so a typed domain edit
 * rendered wrong-frequency curves against old coefficients for an UNBOUNDED
 * window. The plot is given the domain that produced the data it is drawing.
 */
const resultDomain = ref<[number, number]>([domainStart.value, domainEnd.value]);

/*
 * O16 (owner frame 50: "realtime updates as progress completes ... visualize
 * it too"): while a compute job runs, its live picture. The sampled f(x)
 * arrives first and is drawn at once; each coefficient that lands joins the
 * partial sum, so the plot sharpens harmonic by harmonic (ConvergencePlot
 * tweens between coefficient sets: nothing jumps). The stage and fraction
 * drive the determinate progress line and its caption.
 */
const jobStage = shallowRef<JobStage | null>(null);
const liveSamples = shallowRef<{ x: number[]; y: number[] } | null>(null);
const liveTerms = shallowRef<FourierTermDTO[]>([]);
const liveDomain = ref<[number, number]>([domainStart.value, domainEnd.value]);
const showLive = computed(() => computing.value && !!liveSamples.value);
const plotPoints = computed(() => (showLive.value ? liveSamples.value : result.value?.original_points) ?? null);
const plotCoefficients = computed(() => (showLive.value ? liveTerms.value : result.value?.coefficients) ?? []);
const plotDomain = computed<[number, number]>(() => (showLive.value ? liveDomain.value : resultDomain.value));
const jobValue = computed(() => jobProgressValue(jobStage.value));
const jobLabel = computed(() => jobStageLabel(jobStage.value));
const autoHarmonics = ref(fromUrl?.auto ?? true);
const eqMode = ref<EquationDisplayMode>(fromUrl?.m ?? "sigma");
/* X.F.W14V.au1 — A2-FO-X-1 ⊕ L2-4: /visualize's form rule (`useWorkspaceForm`),
   read from glass's shell at glass's split threshold. */
const workspace = useTemplateRef<HTMLElement>("workspace");
const form = useWorkspaceForm(computed(() => workspace.value?.querySelector<HTMLElement>(".eq-configurator") ?? null));
const tabbed = computed(() => form.value === "sheet");
/* FORTY-SECOND D: on a phone the pane is the top dock's Controls seat, in the
   URL (`tab=controls`); the two regions slide on one track (`workspace.css`). */
const { pane } = useWorkspacePane(tabbed);
const eqCardRef = ref<HTMLDivElement>();

// ── Derived state ──
const activeLatex = computed(() =>
    eqMode.value === "sigma" && displayLatexSigma.value ? displayLatexSigma.value : displayLatex.value,
);

const vizHarmonics = computed(() =>
    autoHarmonics.value ? Math.min(effectiveN.value, nHarmonics.value) : nHarmonics.value,
);
/**
 * Canon F3 (restraint, C-100): ONE harmonic count. The expanded form, the plot
 * and the coefficient list all follow the count the Harmonics control shows;
 * the separate "Displayed harmonics" budget is gone. The budget counts
 * harmonics with DC as one (UIA-F-35), so showing every drawn harmonic takes
 * N + 1, within the server's bound.
 */
const budget = computed(() => clampBudget(vizHarmonics.value + 1));

const loading = computed(() => computing.value || series.loading.value);

const components = computed<BasisComponent[]>(() => {
    if (!result.value) return [];
    return result.value.coefficients.map((c: FourierTermDTO) => ({
        index: c.n,
        coefficient: [c.coefficient_re, c.coefficient_im] as [number, number],
        amplitude: c.amplitude,
        phase: c.phase,
    }));
});

/**
 * X.F.W14V.au3 — A2-FO-L1-5: the simplified series is the one flow
 * /visualize's equation panel reads too (`useSimplifiedSeries`). A compute
 * writes the same three refs (its response carries the series), and the cache
 * seeds them.
 */
/** Canon F3: the list shows the harmonics the series draws, |n| ≤ N. */
const shownComponents = computed(() => components.value.filter((c) => Math.abs(c.index) <= vizHarmonics.value));

const series = useSimplifiedSeries(components, {
    notation,
    budget: () => clampBudget(budget.value),
    autoHarmonics,
    initial: { latex: cachedRes?.latex, latexSigma: cachedRes?.result?.latex_sigma, energy: cachedRes?.energy },
});
const { latex: displayLatex, latexSigma: displayLatexSigma, energy: displayEnergy } = series;

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
 * UIA-F-201 — one variable across the page: the plot, its legend and the
 * Function layer's caption (X-DS DS-F3-C14) speak the variable the rendered
 * series is written in. X-DS fourier pass 7 · DS-F7-C1: with no result yet
 * the fallback is the engine's own variable, `t` (it was "x", so the caption
 * read f(x) until the first response and f(t) after it).
 */
const seriesVariable = computed(() => activeLatex.value.match(/f\s*\(\s*([a-z])\s*\)/)?.[1] ?? "t");

const coefficients = computed(() => result.value?.coefficients ?? []);

// ── Coefficient hover (composable) ──
const { hoveredCoeff, popoverPos, popoverHtml, onMouseMove: onCoeffMove, onMouseLeave: onCoeffLeave } =
    useCoeffHover(coefficients);

// ── The ONE normalization seam ── (the pure half — the bounds, the request
// shape and the key — lives in the module script above, so the route's
// `prefetch()` builds the very request this view sends).
function currentRequest(): ComputeEquationRequest {
    return requestFor(
        {
            expression: expression.value,
            domainStart: domainStart.value,
            domainEnd: domainEnd.value,
            nHarmonics: nHarmonics.value,
            notation: notation.value,
        },
        autoHarmonics.value,
        budget.value,
    );
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
const COMPUTE_FAILED = "Computation failed";

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
 * actually current. The simplify seam carries the same shape, in
 * `useSimplifiedSeries` (X.F.W14V.au3): it was consequence-free only while its
 * busy flag had no template consumer, and `D-B4` gave it one.
 */
let computeGeneration = 0;

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
    jobStage.value = null;
    liveSamples.value = null;
    liveTerms.value = [];
    liveDomain.value = [req.domain_start, req.domain_end];
    const live = {
        stage: (d: JobStage) => {
            if (gen === computeGeneration) jobStage.value = d;
        },
        partial: (d: { stage: string } & Record<string, unknown>) => {
            if (gen !== computeGeneration) return;
            if (d.stage === "samples") liveSamples.value = { x: d.x as number[], y: d.y as number[] };
            else if (d.stage === "coefficient") liveTerms.value = [...liveTerms.value, d as unknown as FourierTermDTO];
        },
    };
    const run = () => computeEquation(req, live);
    try {
        // X·OD19 ALL: the intent prefetch for this very request, if one is in flight.
        const res = await (takePrefetch(key)?.catch(run) ?? run());
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
            else error.value = failureMessage(e, COMPUTE_FAILED);
        }
    } finally {
        if (gen === computeGeneration) {
            computing.value = false;
            jobStage.value = null;
            liveSamples.value = null;
            liveTerms.value = [];
        }
    }
}

async function doSimplify() {
    if (!components.value.length) return;
    const key = displayKey(currentRequest());
    if (key === lastDisplayKey) return;

    const resp = await series.simplify();
    // `D·D-B4` — a failed re-render gets doCompute's banner (this seam was a
    // silent no-op); a superseded or aborted call answers nothing and writes
    // nothing (the generation rule lives in the composable now).
    if (series.error.value) error.value = series.error.value;
    if (!resp) return;
    if (result.value) result.value.latex_sigma = resp.latex_sigma;
    lastDisplayKey = key;
    // `L·m-10` — `error` was cleared ONLY by doCompute, so a failed compute's
    // banner outlived every successful notation and budget re-render. Any
    // successful settle clears it.
    error.value = null;
    if (result.value) {
        saveCachedResult(lastComputeKey, result.value, displayLatex.value, displayEnergy.value);
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
watch(
    () => [expression.value, domainStart.value, domainEnd.value, nHarmonics.value, notation.value],
    () => saveCachedInputState({
        expression: expression.value,
        domainStart: domainStart.value,
        domainEnd: domainEnd.value,
        nHarmonics: nHarmonics.value,
        notation: notation.value,
    }),
);

// Initial compute. `L·M-3` — nullity is not the question; PROVENANCE is. A
// restored result whose own key disagrees with the restored inputs is a result
// for a different request, and the corrective recompute the old `!result.value`
// test could never fire now does.
// A link's view that the cached result does not answer shows the skeleton
// until its own compute lands, never another expression's series.
if (fromUrl && result.value && computeKey(currentRequest()) !== lastComputeKey) result.value = null;
if (!result.value || computeKey(currentRequest()) !== lastComputeKey) doCompute();

// ── The URL (owner, 2026-11-15) ──
function currentView(): EquationUrlView {
    return {
        f: expression.value,
        a: domainStart.value,
        b: domainEnd.value,
        n: nHarmonics.value,
        auto: autoHarmonics.value,
        nt: notation.value,
        m: eqMode.value,
        s: sweep.value,
        orig: showOriginal.value,
        harm: showHarmonics.value,
    };
}
function writeView(view: Partial<EquationUrlView>, push = false) {
    writeParams(router, formatEquationQuery(view), push, ownPage);
}
// The clean link restored the reader's last session: the URL now names it.
if (!fromUrl) writeView(currentView());
// Typing settles before it is written; a drag of the domain or the count, and
// the sweep, replace; the toggles and menus push (Back undoes them).
watchDebounced(expression, (f) => writeView({ f }), { debounce: 400 });
watch([domainStart, domainEnd, nHarmonics], ([a, b, n]) => writeView({ a, b, n }));
watch(sweep, (at) => writeView({ s: at }));
watch([autoHarmonics, notation, eqMode, showOriginal, showHarmonics], ([auto, nt, m, orig, harm]) =>
    writeView({ auto, nt, m, orig, harm }, true),
);
// Back and Forward (or a link pasted on this page) apply the URL they reach.
watch(
    () => route.fullPath,
    () => {
        if (isOwnWrite(route.fullPath) || pageOf(route) !== ownPage) return;
        const v = parseEquationQuery(route.query);
        const inputChanged =
            v.f !== expression.value || v.a !== domainStart.value || v.b !== domainEnd.value || v.n !== nHarmonics.value;
        expression.value = v.f;
        domainStart.value = v.a;
        domainEnd.value = v.b;
        nHarmonics.value = v.n;
        autoHarmonics.value = v.auto;
        notation.value = v.nt;
        eqMode.value = v.m;
        sweep.value = v.s;
        showOriginal.value = v.orig;
        showHarmonics.value = v.harm;
        if (inputChanged) doCompute();
    },
);

// The page's tool set (owner, 2026-11-15; 19 Nov, the top bar contextual by
// design): Copy LaTeX and About this approximation, declared once and present
// from the first frame. From 40rem the app dock's centre holds them; under
// 40rem the app dock draws no page tools and they stand in the plot's stage
// dock (the template's `PlotToolsDock`).
const toolsProps = computed(() => ({
    latex: activeLatex.value,
    tier: tier.value,
    tierTone: tierTone.value,
    energy: displayEnergy.value,
}));
providePageTools("Equation tools", () => h(EquationTools, toolsProps.value));
const compact = useMediaQuery(PAGE_TOOLS_COMPACT);

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
    <div
        ref="workspace"
        class="eq-workspace workspace-host flex flex-col flex-1 min-h-0"
        :data-form="form"
        :data-pane="tabbed ? pane : undefined"
    >

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
                :class="{ 'is-busy': loading }"
                :inert="tabbed && pane !== 'canvas'"
                :aria-busy="loading"
            >
                <!-- Loading (no prior result). X.F.W14U.eq — UIA-F-202 ⊕ F-71's
                     carried sites. X·OD19 ALL (owner: "the loading text should be
                     removed in favor of a skeleton shimmer"): glass's `Skeleton shimmer` (10.1.1) in
                     the stage's own shape — the series card's lines over the plot
                     region, on the same hairline — with the panel `aria-busy`
                     (above); the status keeps its name for AT, with no text. -->
                <div v-if="computing && !result" class="eq-skeleton" role="status" aria-label="Computing the series">
                    <div class="eq-card eq-skeleton-series">
                        <Skeleton shimmer class="eq-skeleton-line" />
                        <Skeleton shimmer class="eq-skeleton-line eq-skeleton-line--short" />
                        <!-- O16 frame 50: how far the job is, and in what stage. -->
                        <div class="eq-job">
                            <Progress :model-value="jobValue" :max="1" size="sm" class="eq-job-bar"
                                :aria-label="jobLabel" />
                            <span class="text-caption text-muted-foreground">{{ jobLabel }}</span>
                        </div>
                    </div>
                    <!-- O16 frame 50: f(x) as soon as it is sampled, then the series
                         sharpening term by term; the shimmer only until then. -->
                    <Transition name="status-fade" mode="out-in">
                        <div v-if="plotPoints" class="px-3 py-2 flex-1 min-h-0 flex flex-col eq-plot-card">
                            <ConvergencePlot
                                ref="plot"
                                v-model:sweep="sweep"
                                :show-original="showOriginal"
                                :show-harmonics="showHarmonics"
                                class="flex-1"
                                :original-points="plotPoints"
                                :coefficients="plotCoefficients"
                                :n-harmonics="nHarmonics"
                                :domain="plotDomain"
                                :expression="expression"
                                :variable="seriesVariable"
                            />
                        </div>
                        <div v-else class="eq-plot-card eq-skeleton-plot">
                            <Skeleton shimmer class="eq-skeleton-fill" />
                        </div>
                    </Transition>
                </div>

                <!-- Error (no prior result): a transient failure keeps its retry.
                     X-DS fourier pass 11 · DS-F11C-C1: the app's one recovery
                     grammar for a failed background compute, the shared
                     `.compute-status` line (/visualize's stage and aside wear
                     it): the message, then glass's text Retry. No raised pill. -->
                <div v-else-if="error && !result" class="eq-state">
                    <p role="alert" class="compute-status text-caption">
                        <span class="compute-status-msg">{{ error }}</span>
                        <Button emphasis="text" size="sm" @click="doCompute(true)">Retry</Button>
                    </p>
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
                                <!-- The stage's floating dock: the plot's tools at the stage
                                     card's top-right corner (owner, 2026-11-15). -->
                                <PlotToolsDock
                                    v-model:show-original="showOriginal"
                                    v-model:show-harmonics="showHarmonics"
                                    :variable="seriesVariable"
                                    @export-plot="plotRef?.exportPng()"
                                >
                                    <template v-if="compact" #tools="{ column }">
                                        <EquationTools v-bind="toolsProps" :tooltip-side="column ? 'left' : 'bottom'" />
                                    </template>
                                </PlotToolsDock>
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
                                <Progress :model-value="computing ? jobValue : null" :max="1" size="sm" class="eq-status-bar"
                                    :aria-label="computing ? jobLabel : 'Re-rendering the series'" />
                                <span class="text-caption text-muted-foreground">{{ computing ? jobLabel : "Re-rendering" }}</span>
                            </div>
                            <div v-else-if="error" class="eq-status glass-floating glass-opaque" role="alert">
                                <span class="text-caption font-medium text-foreground shrink-0">Not updated</span>
                                <span class="text-mono-small text-muted-foreground break-words min-w-0" :title="error">{{ error }}</span>
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
                            ref="plot"
                            v-model:sweep="sweep"
                            :show-original="showOriginal"
                            :show-harmonics="showHarmonics"
                            class="flex-1"
                            :original-points="plotPoints ?? result.original_points"
                            :coefficients="plotCoefficients"
                            :n-harmonics="showLive ? nHarmonics : vizHarmonics"
                            :domain="plotDomain"
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
                :inert="tabbed && pane !== 'controls'">
                <div class="eq-layers">
                    <FunctionInput
                        v-model:expression="expression"
                        v-model:domain-start="domainStart"
                        v-model:domain-end="domainEnd"
                        v-model:n-harmonics="nHarmonics"
                        v-model:notation="notation"
                        :effective-n="effectiveN"
                        :energy-captured="displayEnergy"
                        :auto-harmonics="autoHarmonics"
                        :viz-harmonics="vizHarmonics"
                        :expression-error="expressionError"
                        :variable="seriesVariable"
                        @update:auto-harmonics="autoHarmonics = $event"
                        @compute="doCompute(true)"
                    />
                    <Transition name="slide-down">
                        <CoefficientsPanel
                            v-if="shownComponents.length"
                            :components="shownComponents"
                            paired
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
   region's card and the gap between them. The gutters, the foot, the page
   radius and the sheet form are the stage routes' one file
   (`styles/workspace.css`, `.workspace-host`); this view sets the aside's
   width band, as /visualize does (`:deep`, because the shell is glass's
   element, not this component's root). */
@media (min-width: 1024px) {
    :deep(.eq-configurator) {
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
/* The sheet form (`data-form="sheet"`, read from glass's shell): the two
   regions on one track, one in view, the top dock's Controls seat choosing
   (`styles/workspace.css`). */
/* X.F.W14V.au1 — A2-FO-L2-4 ⊕ X-1: the rail form (landscape, narrower than
   glass's split), /visualize's rule: the stage and the controls rail sit in a
   row. X §0hm D-8: inside the stage the series stands OVER the plot at the
   stage's full width. Side by side (X-1) each took half of a ~480 px stage, so
   at 844×390 the formula clipped in a 232 px column (the Σ limit sliced, Copy
   LaTeX half under the column edge) and the plot was 232×148. The height the
   stack needs is bought where it is short (EquationResult's short-landscape
   rule: the tools ride the formula's row, the formula on the fluid type step). */
.eq-workspace[data-form="rail"] :deep(.eq-configurator > [data-slot="configurator"]) {
    display: flex;
    flex-direction: row;
    min-width: 0;
}
.eq-workspace[data-form="rail"] :deep(.eq-configurator .configurator-stage) {
    flex: 1 1 0%;
    min-width: 0;
    min-height: 0;
}
.eq-workspace[data-form="rail"] :deep(.eq-configurator > [data-slot="configurator"] > .configurator-aside) {
    flex: 0 0 clamp(16rem, 38%, 22rem);
    min-height: 0;
    border-block-start-width: 0;
}
@media (orientation: landscape) and (max-height: 500px) {
    .eq-workspace[data-form="rail"] .eq-card {
        min-height: 0;
    }
}

/* X §0hm D-25 — the split form: the stage and the aside are one row of two
   cards on one top and one foot. glass's split grid keeps a gallery row above
   the aside (`auto minmax(0, 1fr)`, the stage spanning both); with no presets
   that row is empty but its detached gap is not, so the aside card started
   12 px under the stage card. The aside spans the same two rows as the stage
   (glass relay: an empty gallery row should not hold the aside down). */
.eq-workspace:not([data-form="sheet"]):not([data-form="rail"]) :deep(.eq-configurator > [data-slot="configurator"] > .configurator-aside) {
    grid-row: 1 / span 2;
}

/* ── Controls (the aside body) ── */
/* X-DS DS-F-C4 (as on /v): no inset — the layer group's hairline is the
   aside's own edge, not a second ring inside it. */
/* X·OD19 F5 (as on /v): the flush stack publishes its real inset, the aside's
   1px border, so glass derives the first layer's corner concentric with the
   card (`--radius-ctx − --radius-inset` = 15px), not the padded shell's
   `max(4px, 16 − 20)`. */
.eq-panel-left-wrap {
    --radius-inset: 1px;
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 0;
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
/* X·OD19 ALL — the cold compute's Skeleton: the series' two lines, then the
   plot filling the rest, in the regions the result will occupy. */
.eq-skeleton {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
}
.eq-skeleton-series {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 2rem 1.5rem;
}
.eq-skeleton-line {
    block-size: 1.5rem;
    inline-size: min(36rem, 80%);
    border-radius: var(--radius-floor);
}
.eq-skeleton-line--short {
    inline-size: min(20rem, 50%);
}
/* O16 frame 50: the job's line and its stage, under the series' place. */
.eq-job {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-atom);
    inline-size: min(20rem, 70%);
    margin-top: var(--space-atom);
}
.eq-job-bar {
    inline-size: 100%;
}
.eq-skeleton-plot {
    flex: 1;
    min-height: 0;
    display: flex;
    padding: 0.5rem 0.75rem;
}
.eq-skeleton-fill {
    flex: 1;
    border-radius: var(--radius-floor);
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

/* The cold failure state (no prior result): centred in the panel. */
.eq-state {
    @apply flex flex-col items-center justify-center flex-1 gap-3;
}
/* DS-F11C-C1: the failure line stays inside the stage's measure. */
.eq-state > .compute-status {
    max-inline-size: 100%;
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
    /* X-DS pass 1 · F1-11: the plate's one shadow is glass-floating's. */
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
    /* LAST-TEN F-27: the small-state clock on the press spring. */
    transition: color var(--duration-control) var(--spring-press), background-color var(--duration-control) var(--spring-press);
}
.eq-card :deep(.eq-coeff:hover) {
    color: var(--viz-amber) !important;
    background: color-mix(in srgb, var(--viz-amber) 10%, transparent);
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
    /* X-DS pass 2 · DS-F2-C12 (§0ek): the local plate (background, border,
       ink) and the local `tooltip-in` entrance are deleted; the popover's
       material and motion are glass PopoverContent's. */
    /* `M-US` — `user-select: none` is defensible for a one-line label and wrong
       for an explanatory paragraph: it made the tier description, which the
       record nominates as copy that should survive any redesign, uncopyable. */
}
</style>
