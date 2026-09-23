<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useMediaQuery } from "@vueuse/core";
import type { FourierTermDTO } from "@/lib/equation/types";
import { applyGoldenShimmer, clearShimmer } from "@/lib/golden-shimmer";
import { easeInOutSine } from "@mkbabb/value.js/easing";
import { lerp } from "@mkbabb/value.js/math";
import { renderLatex } from "@/lib/equation/render";

import { useCanvasSetup } from "@/components/visualization/composables/useCanvasSetup";
import { drawPlotGrid, type PlotPadding } from "./lib/grid";
import { hitTestCurves, type CurveHitRegion } from "./lib/hit-test";
import { groupTrigHarmonics, harmonicProgress, spectrumColor, type TrigHarmonic } from "./lib/harmonics";
import { createTransitionState, startTransition, snapshotForTransition } from "./composables/useCurveTransition";

import ConvergenceLegend from "./convergence/ConvergenceLegend.vue";
import ConvergenceTimeline from "./convergence/ConvergenceTimeline.vue";

const props = defineProps<{
    originalPoints: { x: number[]; y: number[] };
    coefficients: FourierTermDTO[];
    nHarmonics: number;
    domain: [number, number];
    expression?: string;
}>();

// ── Refs ──
const canvasRef = ref<HTMLCanvasElement>();
const containerRef = ref<HTMLDivElement>();

const t = ref(0);
const playing = ref(false);
const hoveredCurve = ref<string | null>(null);
const mousePos = ref<{ x: number; y: number } | null>(null);

// ── Derived data ──
const easedT = computed(() => easeInOutSine(t.value));
const trigHarmonics = computed(() => groupTrigHarmonics(props.coefficients, props.nHarmonics));
const dcTerm = computed(() => props.coefficients.find((c) => c.n === 0));
const animDuration = computed(() => {
    const n = trigHarmonics.value.length;
    // Few harmonics: slower to appreciate each term; many: faster per-term
    return Math.max(2_000, Math.min(12_000, 3_000 + Math.max(0, n - 3) * 200));
});

// ── Transition state ──
const transition = createTransitionState();
let cancelTransition: (() => void) | null = null;

// ── Canvas state ──
let visibilityObserver: IntersectionObserver | null = null;
let rafId: number | null = null;
let loopStartTime: number | null = null;
let cachedScreenCurves: CurveHitRegion[] = [];

const PAD: PlotPadding = { top: 14, bottom: 18, left: 12, right: 12 };

/**
 * `D-9 + C-2` — three JS clocks CSS cannot reach ran regardless of
 * `prefers-reduced-motion`: the autoplaying ping-pong rAF (2–12 s sweeps, from
 * mount, forever), the 500 ms transition rAF, and the shimmer's
 * `performance.now()` alpha oscillation (which only ticks while a loop is
 * redrawing, so gating the loops silences it too).
 *
 * ⊘ `M-D1` IS THE WHOLE CURE CONSTRAINT: both prescribed gates freeze the plot
 * at `t = 0`, and at `t = 0` `easeInOutSine(0) = 0`, every `harmonicProgress`
 * returns 0, every cursor is 0, `:205`'s guard skips EVERY harmonic stroke and
 * hit region, and the sum collapses to DC — a blank grid whose only escape is a
 * scrubber. The reduced arm therefore seeds the TERMINAL frame `t = 1`, where
 * every harmonic is fully drawn: a reduced-motion reader gets the CONVERGED
 * state, which is what the instrument is for.
 *
 * A user who presses Play is asking for motion explicitly, and that still works;
 * what PRM gates is the clock nobody asked for.
 */
const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

/** `L-M3 + D-26` — false while the panel is `display:none` (mobile `panel-inactive`). */
const isVisible = ref(true);

// ── Animation loop ──

function startLoop() {
    // `L-B2` — the store's two guards, ported: never a second loop (the old
    // `rafId !== null` predicate was untruthful because `tick`'s early return
    // never nulled it), and never a loop for a plot nobody can see.
    if (rafId !== null || !isVisible.value) return;
    loopStartTime = null;
    function tick(now: number) {
        if (!playing.value || !isVisible.value) { rafId = null; return; }
        if (loopStartTime === null) loopStartTime = now - t.value * animDuration.value;
        const elapsed = now - loopStartTime;
        const cycle = Math.floor(elapsed / animDuration.value);
        const frac = (elapsed % animDuration.value) / animDuration.value;
        t.value = cycle % 2 === 0 ? frac : 1 - frac;
        draw();
        rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
}

function stopLoop() {
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    loopStartTime = null;
}

// ── Frame geometry (memoised) ──

/** Sample count of the partial-sum grid. */
const N_POINTS = 500;

interface FrameGeometry {
    xGrid: number[];
    /** One sampled curve per harmonic, at the transition-lerped coefficients. */
    curves: number[][];
    lerpDc: number;
    /** Y-extent of the samples and of the CONVERGED series — neither is animated. */
    tMinY: number;
    tMaxY: number;
}

let geometryKey: readonly unknown[] | null = null;
let geometryValue: FrameGeometry | null = null;

/**
 * `L-B3 + C-11` — the curve matrix and a COMPLETE second series evaluation were
 * rebuilt on every frame although neither reads `t`, `easedT` or `cursors`: only
 * the prefix reveal (`end = cursors[hi] + 1`) is animated. At the UI-reachable
 * ceiling (N = 100, FunctionInput's slider max) that is ≈200k trig calls and
 * ≈51k allocations per frame, doubled during the 500 ms transition window when
 * `draw()` runs twice per frame.
 *
 * The memo key is exactly the record's: `[coefficients, nHarmonics, domain,
 * transition.progress]` — identity-compared, since every one of them is replaced
 * wholesale rather than mutated. ⊘ SEQUENCING: this lands and is MEASURED BEFORE
 * the BasisCanvas↔FourierField convergence study (`G-F4-CONV-STUDY`, unit `.f`),
 * or the study charges Canvas2D for recomputation it never asked for.
 */
function frameGeometry(
    harmonics: TrigHarmonic[],
    dc: FourierTermDTO | undefined,
    tp: number,
    domA: number,
    domB: number,
): FrameGeometry {
    const key = [props.coefficients, props.nHarmonics, domA, domB, tp] as const;
    if (geometryValue && geometryKey && key.every((k, i) => k === geometryKey![i])) {
        return geometryValue;
    }

    const omega = (2 * Math.PI) / (domB - domA);
    const xGrid: number[] = [];
    // X-grid for the partial-sum curve (endpoint=false matches backend convention:
    // the canonical equispaced Fourier sampling drops x = domB since the periodic
    // wrap identifies it with x = domA — see api/routers/equations.py:61).
    for (let i = 0; i < N_POINTS; i++) xGrid.push(domA + (i / N_POINTS) * (domB - domA));

    const lerpH: TrigHarmonic[] = harmonics.map((h, i) => {
        if (tp >= 1 || i >= transition.prevHarmonics.length) return h;
        const o = transition.prevHarmonics[i];
        return { k: h.k, a_n: lerp(o.a_n, h.a_n, tp), b_n: lerp(o.b_n, h.b_n, tp), amplitude: lerp(o.amplitude, h.amplitude, tp) };
    });
    const lerpDc = tp >= 1 ? (dc?.coefficient_re ?? 0) : lerp(transition.prevDcRe, dc?.coefficient_re ?? 0, tp);

    const curves = lerpH.map((h) =>
        xGrid.map((x) => h.a_n * Math.cos(h.k * omega * x) + h.b_n * Math.sin(h.k * omega * x)),
    );

    // The converged series, whose only consumers are the two extent calls below.
    const oy = props.originalPoints.y;
    let tMinY = Infinity, tMaxY = -Infinity;
    for (let j = 0; j < N_POINTS; j++) {
        let v = dc?.coefficient_re ?? 0;
        for (let hi = 0; hi < harmonics.length; hi++) {
            const h = harmonics[hi];
            v += h.a_n * Math.cos(h.k * omega * xGrid[j]) + h.b_n * Math.sin(h.k * omega * xGrid[j]);
        }
        if (v < tMinY) tMinY = v;
        if (v > tMaxY) tMaxY = v;
    }
    // ⊘ `Math.min(...oy)` on a 500-element spread is a stack-shaped hazard as well
    // as a cost; the extents are folded instead.
    for (let i = 0; i < oy.length; i++) {
        if (oy[i] < tMinY) tMinY = oy[i];
        if (oy[i] > tMaxY) tMaxY = oy[i];
    }

    geometryKey = key;
    geometryValue = { xGrid, curves, lerpDc, tMinY, tMaxY };
    return geometryValue;
}

// ── Draw ──

// OA-44 — the backing store is the app's one DPR-aware idiom: sized to the
// canvas's device-pixel box on resize, zoom and DPR change, never per frame
// (the old per-draw `canvas.width =` reallocated the bitmap 60 times a second).
const { surface } = useCanvasSetup(canvasRef, () => draw());

function draw() {
    const canvas = canvasRef.value;
    const s = surface.value;
    if (!canvas || !s) return;

    const ctx = s.ctx;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // `D-1` — the neutral ink, READ FROM THE CASCADE rather than frozen. The
    // canvas carries `text-muted-foreground`, so `getComputedStyle().color` hands
    // back the USED value (an `rgb()` Canvas2D can paint) with `light-dark()` and
    // the alias chain already resolved by the engine — the same probe the sibling
    // `FrequencyGraph` uses for its index labels, and the only form that follows
    // a theme flip without a string-parsing guess. The three frozen greys it
    // replaces (`rgba(150,150,150,.2)` axes · `rgba(150,150,150,.07)` grid ·
    // `rgba(180,180,180,.55)` original) were theme-blind by construction and put
    // every meaning-bearing mark under the 1.4.11 floor in the default arm.
    const ink = getComputedStyle(canvas).getPropertyValue("color").trim() || "#888";

    const w = s.width, h = s.height;
    const ox = props.originalPoints.x, oy = props.originalPoints.y;
    if (!ox.length) return;
    ctx.clearRect(0, 0, w, h);

    const [domA, domB] = props.domain;
    // `M-L1` — the precondition nothing stated. A zero-width domain divides by
    // zero in `omega` and in `toScreen`'s x-mapping; a reversed one renders a
    // mirrored projection. Neither is a frame worth painting.
    if (!(domB > domA)) return;
    const harmonics = trigHarmonics.value;
    const totalH = harmonics.length;
    const dc = dcTerm.value;
    const tp = transition.progress;

    // `L-B3 + C-11` — the curve matrix and the full-series evaluation come from
    // the memo, because NEITHER reads `t`, `easedT` or `cursors`: only the prefix
    // reveal is animated, and everything under it was rebuilt from scratch on
    // every frame.
    const { xGrid, curves, lerpDc, tMinY, tMaxY } = frameGeometry(harmonics, dc, tp, domA, domB);

    // Lerp original Y
    const oyLerped = oy.map((y, i) => {
        if (tp >= 1 || !transition.prevOrigY.length) return y;
        return lerp(i < transition.prevOrigY.length ? transition.prevOrigY[i] : y, y, tp);
    });

    // Closed grid for the ORIGINAL curve only (endpoint=true) — visual closure
    // over [a, b]. The Fourier expansion treats f as periodic with period (b - a)
    // (paper §ch:interpreting, f(x) = Σ c_n e^(πinx/L) on [-L, L]), hence the wrap
    // sample y(b) = y(a). The partial-sum curve below retains the backend's
    // endpoint=false grid so the numerical convention is preserved.
    const oxClosed = ox.length ? [...ox, domB] : ox;
    const oyClosed = oyLerped.length ? [...oyLerped, oyLerped[0]] : oyLerped;

    // Cursor indices — the one genuinely per-frame quantity.
    const eT = easedT.value;
    const cursors = curves.map((_, hi) => Math.floor(harmonicProgress(hi, totalH, eT) * (N_POINTS - 1)));

    // Sum curve
    const BLEND = 10;
    const sumY = xGrid.map((_, j) => {
        let val = lerpDc;
        for (let hi = 0; hi < totalH; hi++) {
            const c = cursors[hi];
            const wt = j <= c - BLEND ? 1 : j >= c + 1 ? 0 : Math.max(0, Math.min(1, (c - j + 1) / (BLEND + 1)));
            val += curves[hi][j] * wt;
        }
        return val;
    });

    // Y-bounds (lerped for smooth transition) — from the memo, above.
    const yP = (tMaxY - tMinY) * 0.08 || 1;
    let minY: number, maxY: number;
    if (tp >= 1 || !transition.prevOrigY.length) {
        minY = tMinY - yP; maxY = tMaxY + yP;
    } else {
        minY = lerp(transition.prevMinY, tMinY - yP, tp);
        maxY = lerp(transition.prevMaxY, tMaxY + yP, tp);
    }

    // Plot extent spans the full closed domain [a, b]; the closed-original grid
    // reaches domB while the partial-sum grid stops one sample short by convention.
    const minX = ox[0], maxX = domB;
    const plotW = w - PAD.left - PAD.right, plotH = h - PAD.top - PAD.bottom;
    const toScreen = (xv: number, yv: number): [number, number] => [
        PAD.left + ((xv - minX) / (maxX - minX)) * plotW,
        PAD.top + (1 - (yv - minY) / (maxY - minY)) * plotH,
    ];

    // Grid
    drawPlotGrid(ctx, w, h, PAD, minX, maxX, minY, maxY, toScreen, ink);

    // Original f(x) — rendered over the closed [a, b] grid so the curve visually
    // closes (periodic wrap appended as final sample). Hover is carried by stroke
    // WIDTH, which was always the second channel here; the brightness step that
    // used to carry it is what put the resting curve at 1.40:1.
    const isOrigHov = hoveredCurve.value === "original";
    ctx.strokeStyle = ink;
    ctx.globalAlpha = isOrigHov ? 1 : 0.85;
    ctx.lineWidth = isOrigHov ? 3.5 : 2.5;
    ctx.setLineDash([6, 4]);
    const origPts: [number, number][] = [];
    ctx.beginPath();
    for (let i = 0; i < oxClosed.length; i++) {
        const pt = toScreen(oxClosed[i], oyClosed[i]);
        origPts.push(pt);
        i === 0 ? ctx.moveTo(pt[0], pt[1]) : ctx.lineTo(pt[0], pt[1]);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Individual harmonics
    const harmPts: CurveHitRegion[] = [];
    for (let hi = 0; hi < totalH; hi++) {
        if (cursors[hi] < 3) continue;
        const isHov = hoveredCurve.value === `h-${hi}`;
        ctx.strokeStyle = spectrumColor(hi, totalH, isHov ? 1.0 : 0.55);
        ctx.lineWidth = isHov ? 3.5 : 2.5;
        const pts: [number, number][] = [];
        ctx.beginPath();
        const end = Math.min(cursors[hi] + 1, N_POINTS);
        for (let i = 0; i < end; i++) {
            const pt = toScreen(xGrid[i], curves[hi][i]);
            pts.push(pt);
            i === 0 ? ctx.moveTo(pt[0], pt[1]) : ctx.lineTo(pt[0], pt[1]);
        }
        ctx.stroke();
        harmPts.push({ key: `h-${hi}`, points: pts });
    }

    // Sum curve (golden)
    ctx.save();
    applyGoldenShimmer(ctx, { hovered: hoveredCurve.value === "sum", playing: playing.value, baseWidth: 5, hoverWidth: 7, hoverBlur: 14, playBlur: 8 });
    const sumPts: [number, number][] = [];
    ctx.beginPath();
    for (let i = 0; i < N_POINTS; i++) {
        const pt = toScreen(xGrid[i], sumY[i]);
        sumPts.push(pt);
        i === 0 ? ctx.moveTo(pt[0], pt[1]) : ctx.lineTo(pt[0], pt[1]);
    }
    ctx.stroke();
    clearShimmer(ctx);
    ctx.restore();

    cachedScreenCurves = [{ key: "sum", points: sumPts }, { key: "original", points: origPts }, ...harmPts];
}

// ── Mouse interaction ──

function onCanvasMove(e: MouseEvent) {
    const canvas = canvasRef.value;
    const container = containerRef.value;
    if (!canvas || !container) return;
    const rect = canvas.getBoundingClientRect();
    const hit = hitTestCurves(cachedScreenCurves, e.clientX - rect.left, e.clientY - rect.top);
    // `L-m10` — `mousePos` was written on EVERY move regardless of hover state,
    // so a pointer crossing empty plot re-rendered the template for a tooltip
    // that was not shown. It is written only when there is something to place.
    if (hit !== null) {
        // `D·D-m9` — the template used to call `getBoundingClientRect()` TWICE
        // per render for one rect, unthrottled, over a KaTeX subtree. One read,
        // at the event, and the tooltip positions off plain numbers.
        const cr = container.getBoundingClientRect();
        mousePos.value = { x: e.clientX - cr.left + 14, y: e.clientY - cr.top - 32 };
    } else {
        mousePos.value = null;
    }
    if (hit !== hoveredCurve.value) { hoveredCurve.value = hit; if (!playing.value) draw(); }
}

function onCanvasLeave() {
    hoveredCurve.value = null;
    mousePos.value = null;
    if (!playing.value) draw();
}

/**
 * `L-M8 + C-9` — the old catch returned the raw interpolated user expression
 * into a `v-html` sink. `renderLatex` escapes on that path, at the one home.
 */
function renderKatexInline(latex: string): string {
    return renderLatex(latex, { displayMode: false });
}

const tooltipHtml = computed(() => {
    const h = hoveredCurve.value;
    if (!h) return "";
    if (h === "sum") return renderKatexInline(`f(x) = ${props.expression ?? "\\text{sum}"}`);
    if (h === "original") return renderKatexInline(`f(x) = ${props.expression ?? "f(x)"}`);
    if (h.startsWith("h-")) {
        const harm = trigHarmonics.value[parseInt(h.slice(2))];
        return harm ? renderKatexInline(`n = ${harm.k},\\; A = ${harm.amplitude.toFixed(4)}`) : "";
    }
    return "";
});

// ── Playback ──

function togglePlay() {
    playing.value = !playing.value;
    if (playing.value) { if (t.value >= 0.99) t.value = 0; startLoop(); }
    else { stopLoop(); draw(); }
}

// ── Scrubbing ──

function onScrubStart() {
    stopLoop();
}
function onScrubMove(newT: number) {
    t.value = newT;
    draw();
}
function onScrubEnd() {
    if (playing.value) startLoop();
}

// ── Legend ──

function onLegendEnter(key: string) { hoveredCurve.value = key; if (!playing.value) draw(); }
function onLegendLeave() { hoveredCurve.value = null; if (!playing.value) draw(); }

const plotDescription = computed(() => {
    const total = trigHarmonics.value.length;
    if (!total) return "Convergence plot: no harmonics to draw yet.";
    return `Convergence plot: the function f(x), its ${total}-harmonic Fourier sum, `
        + `and each harmonic drawn separately. ${activeCount.value} of ${total} harmonics `
        + `have entered at the current position in the sweep.`;
});

const activeCount = computed(() => {
    const total = trigHarmonics.value.length;
    const eT = easedT.value;
    let n = 0;
    for (let i = 0; i < total; i++) if (harmonicProgress(i, total, eT) > 0.5) n++;
    return n;
});

// ── Watches ──

/**
 * `L-M1` — the snapshot was taken from the NEW state and called PREVIOUS.
 *
 * `trigHarmonics` and `dcTerm` are computeds, and a pre-flush watcher runs after
 * the source has already mutated, so both re-evaluated to the incoming values:
 * only `oldOy` was genuinely old. Every harmonic and DC lerp was therefore an
 * IDENTITY for all `tp`, `prevMinY`/`prevMaxY` were derived from a hybrid state
 * that never existed on screen, and the composable's own docblock was false on
 * three of its four claims. The watcher already held the answer in `old[1]`.
 *
 * ⊘ `deep: true` goes in the SAME edit and not as a separate tidy: a deep watcher
 * on in-place mutation hands back the same reference as both arguments, which
 * destabilises the very `old` tuple this cure reads. Both props are replaced
 * wholesale on every response, so the getter's array identity is the honest
 * trigger (`SP-16`'s member: the deep traversal was priced for nothing).
 */
watch(() => [props.originalPoints, props.coefficients] as const, (_now, old) => {
    const oldPoints = old?.[0];
    const oldCoefficients = old?.[1];
    if (oldPoints && oldCoefficients) {
        const oldHarmonics = groupTrigHarmonics(oldCoefficients, props.nHarmonics);
        const oldDc = oldCoefficients.find((c) => c.n === 0)?.coefficient_re ?? 0;
        snapshotForTransition(transition, oldPoints.y, oldHarmonics, oldDc, oldPoints.x, props.domain);
        cancelTransition?.();
        cancelTransition = startTransition(transition, draw, prefersReducedMotion.value);
    } else {
        draw();
    }
});

watch(() => props.nHarmonics, () => { if (!playing.value) draw(); });

/**
 * `L-M2` — `props.domain` feeds `omega`, the x-grid, the closing sample and
 * `maxX`, and had NO watcher at all, so a domain change repainted only if
 * something else happened to trigger a draw. The divergence window was
 * UNBOUNDED at the callsite, which bound live refs against last-response data:
 * a typed domain edit emitted nothing, so the plot rendered wrong-frequency
 * curves and a backwards closing segment until the user pressed Compute, which
 * may be never. The callsite now sources `domain` from the request that produced
 * the result; this watcher is the other half, for the props that reach it.
 */
watch(() => [props.domain, props.expression], () => { if (!playing.value) draw(); });

// ── Lifecycle ──

onMounted(() => {
    nextTick(() => {
        if (prefersReducedMotion.value) {
            // The TERMINAL frame, per `M-D1`: converged, complete, and static.
            t.value = 1;
            playing.value = false;
            draw();
        } else {
            draw();
            t.value = 0;
            playing.value = true;
            startLoop();
        }
    });
    // `L-M3 + D-26` — neither clock was visibility-gated, and the mobile panel is
    // `display:none` WHILE MOUNTED (`EquationView`'s `.panel-inactive`, default
    // tab `controls`), so the loop, the per-frame layout read and the reactive
    // cascade all ran unseen. A `display:none` element never intersects, which
    // is precisely the signal needed.
    visibilityObserver = new IntersectionObserver((entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (visible === isVisible.value) return;
        isVisible.value = visible;
        if (visible) {
            if (playing.value) startLoop();
            else draw();
        } else {
            stopLoop();
        }
    });
    if (containerRef.value) visibilityObserver.observe(containerRef.value);
});

onUnmounted(() => {
    // `L-B2` — `playing` was never cleared, so a teardown mid-play left the flag
    // true for any orphan tick to re-arm on; the orphan retained the whole
    // closure (props, transition state, the cached screen curves).
    playing.value = false;
    stopLoop();
    cancelTransition?.();
    visibilityObserver?.disconnect();
});
</script>

<template>
    <div ref="containerRef" class="convergence-container">
        <!-- `D-5` — the plot is the route's primary figure and announced as
             nothing at all: no role, no name, no text equivalent. `role="img"`
             plus a name that carries the READING (which curves, how many
             harmonics, where the sweep is) is the text equivalent a canvas
             cannot otherwise have. -->
        <canvas
            ref="canvasRef"
            class="absolute inset-0 size-full text-muted-foreground"
            role="img"
            :aria-label="plotDescription"
            @mousemove="onCanvasMove"
            @mouseleave="onCanvasLeave"
        />

        <!-- Cursor-following tooltip -->
        <div
            v-if="hoveredCurve && mousePos && tooltipHtml"
            class="curve-tooltip"
            :style="{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }"
            v-html="tooltipHtml"
        />

        <!-- Legend -->
        <ConvergenceLegend
            :harmonics="trigHarmonics"
            :hovered-curve="hoveredCurve"
            @hover="onLegendEnter"
            @leave="onLegendLeave"
        />
    </div>

    <!-- Timeline -->
    <ConvergenceTimeline
        :t="t"
        :playing="playing"
        :active-count="activeCount"
        :total-harmonics="trigHarmonics.length"
        @toggle-play="togglePlay"
        @scrub-start="onScrubStart"
        @scrub-move="onScrubMove"
        @scrub-end="onScrubEnd"
    />
</template>

<style scoped>
@reference "tailwindcss";

/* ── Container ── */
.convergence-container {
    @apply w-full relative flex-1 select-none;
    min-height: 200px;
}

/* ── Tooltip ── */
.curve-tooltip {
    @apply absolute pointer-events-none rounded-md;
    font-family: "Fira Code", monospace;
    font-size: 13px;
    line-height: 1.4;
    padding: 5px 10px;
    background: color-mix(in srgb, var(--popover) 92%, transparent);
    color: var(--popover-foreground);
    border: 1.5px solid var(--border);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    white-space: nowrap;
    z-index: var(--z-controls);
    /* A.W3.d — `tooltip-in` is canonical in glass-ui's animations.css; the
       consumer-side shadow keyframe has been excised. Resolves via global cascade. */
    animation: tooltip-in 0.1s var(--ease-standard);
}

/* `M-L7` — the local `@media (prefers-reduced-motion: reduce) { animation: none }`
   block is GONE: glass-ui's `utilities/a11y-overrides.css` already resets
   `animation-duration` to 0.01ms on `*` with `!important` under the same query,
   so the component's one act of compliance was a no-op that cost a maintainer's
   attention and bought nothing. The clocks CSS cannot reach are gated in script,
   above, which is where the omission actually was. */
</style>
