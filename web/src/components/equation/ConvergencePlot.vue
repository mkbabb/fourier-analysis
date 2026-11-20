<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useElementSize, useMediaQuery } from "@vueuse/core";
import type { FourierTermDTO } from "@/lib/equation/types";
import { applyGoldenStroke } from "@/lib/golden-stroke";
import { formatNumber } from "@/lib/format";
import { easeInOutSine } from "@mkbabb/value.js/easing";
import { lerp } from "@mkbabb/value.js/math";
import { renderLatex } from "@/lib/equation/render";

import { useCanvasSetup } from "@/components/shared/canvas/useCanvasSetup";
import { drawPlotGrid, type PlotPadding } from "@/lib/equation/grid";
import { hitTestCurves, type CurveHitRegion } from "@/lib/equation/hit-test";
import { groupTrigHarmonics, harmonicProgress, revealWeight, spectrumColor, type TrigHarmonic } from "@/lib/equation/harmonics";
import { createTransitionState, startTransition, snapshotForTransition } from "./composables/useCurveTransition";
import { useAmbientHold } from "./composables/useAmbientHold";

import ConvergenceLegend from "./convergence/ConvergenceLegend.vue";
import ConvergenceTimeline from "./convergence/ConvergenceTimeline.vue";

const props = defineProps<{
    originalPoints: { x: number[]; y: number[] };
    coefficients: FourierTermDTO[];
    nHarmonics: number;
    domain: [number, number];
    expression?: string;
    /** UIA-F-201 — the variable the rendered series is written in (one across the page). */
    variable?: string;
    /**
     * The sweep's paused point (owner, 2026-11-15: the sweep position is in the
     * URL, `s`): a number holds the sweep there, null lets it play. The plot
     * reports the reader's pause, scrub and play back through `update:sweep`.
     */
    sweep?: number | null;
    /** The plot's layers (the stage dock's Plot layers menu): the original curve, the harmonics. */
    showOriginal?: boolean;
    showHarmonics?: boolean;
}>();

const emit = defineEmits<{
    "update:sweep": [value: number | null];
}>();

const v = computed(() => props.variable ?? "x");

// ── Refs ──
const canvasRef = ref<HTMLCanvasElement>();
const containerRef = ref<HTMLDivElement>();
/* X-DS pass 2 · DS-F2-C9: under ~30rem the legend leaves its desktop column
   (a plate nested in the stage plate, a third of the plot at 390) and wraps
   as one plate-less row under the curves. */
const { width: containerWidth } = useElementSize(containerRef);
/* X §0hm D-8: in short landscape (844×390) height is the scarce axis, so the
   legend keeps its column beside the curves (wrapped under them it took two
   rows and pushed the timeline out of the stage). */
const shortLandscape = useMediaQuery("(orientation: landscape) and (max-height: 500px)");
const legendWrapped = computed(() => !shortLandscape.value && containerWidth.value > 0 && containerWidth.value < 480);

const t = ref(0);
const playing = ref(false);
/**
 * LAST-TEN F-06: the sweep that plays from mount is AMBIENT, motion nobody
 * asked for, and it holds still while the reader acts (`useAmbientHold`). A
 * press of Play, or a scrub, is the reader taking the instrument: from then
 * the sweep is theirs and never holds on its own.
 */
const ambient = ref(false);
const { held: readerBusy } = useAmbientHold(containerRef);
const holding = computed(() => ambient.value && readerBusy.value);
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
let cachedScreenCurves: CurveHitRegion[] | null = null;

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

/** `L-M3 + D-26` — false while the plot is out of view (a phone with its controls pane shown). */
const isVisible = ref(true);

// ── Animation loop ──

function startLoop() {
    // `L-B2` — the store's two guards, ported: never a second loop (the old
    // `rafId !== null` predicate was untruthful because `tick`'s early return
    // never nulled it), and never a loop for a plot nobody can see.
    if (rafId !== null || !isVisible.value || holding.value) return;
    loopStartTime = null;
    function tick(now: number) {
        if (!playing.value || !isVisible.value || holding.value) { rafId = null; return; }
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
    // X.F.W14U.eq — UIA-F-205: every drawn series is inside the plot box, so the
    // range covers each harmonic's own curve too (they oscillate about zero and
    // ran off the canvas bottom whenever f stayed positive).
    for (const curve of curves) {
        for (let j = 0; j < curve.length; j++) {
            if (curve[j] < tMinY) tMinY = curve[j];
            if (curve[j] > tMaxY) tMaxY = curve[j];
        }
    }

    geometryKey = key;
    geometryValue = { xGrid, curves, lerpDc, tMinY, tMaxY };
    return geometryValue;
}

// ── Draw ──

// OA-44 — the backing store is the app's one DPR-aware idiom: sized to the
// canvas's device-pixel box on resize, zoom and DPR change, never per frame
// (the old per-draw `canvas.width =` reallocated the bitmap 60 times a second).
const { surface } = useCanvasSetup(canvasRef, () => { readInk(); draw(); });

/*
 * LAST-TEN F-06: the neutral ink was a `getComputedStyle` read in every frame
 * of the sweep (a forced style recalculation while anything on the page
 * animates). It is read when the canvas is sized and when the theme changes.
 */
let ink = "#888";
function readInk(): void {
    const canvas = canvasRef.value;
    if (canvas) ink = getComputedStyle(canvas).getPropertyValue("color").trim() || "#888";
}
let themeObserver: MutationObserver | null = null;

/*
 * The last frame's geometry, kept so the hover hit-test can rebuild the screen
 * curves when the pointer asks, rather than every frame building ~500 point
 * tuples per curve that only a hover reads.
 */
let lastFrame: {
    toScreen: (x: number, y: number) => [number, number];
    xGrid: number[];
    curves: number[][];
    cursors: number[];
    sumY: Float64Array;
    oxClosed: number[];
    oyClosed: number[];
} | null = null;
let sumScratch = new Float64Array(0);

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
    // the alias chain already resolved by the engine. The three frozen greys it
    // replaces were theme-blind by construction. Read by `readInk` (sizing and
    // theme changes), not here (LAST-TEN F-06).

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

    // Lerp original Y (only while a transition runs; at rest it is `oy`).
    const lerping = tp < 1 && transition.prevOrigY.length > 0;
    const oyLerped = lerping
        ? oy.map((y, i) => lerp(i < transition.prevOrigY.length ? transition.prevOrigY[i] : y, y, tp))
        : oy;

    // Closed grid for the ORIGINAL curve only (endpoint=true) — visual closure
    // over [a, b]. The Fourier expansion treats f as periodic with period (b - a)
    // (paper §ch:interpreting, f(x) = Σ c_n e^(πinx/L) on [-L, L]), hence the wrap
    // sample y(b) = y(a). The partial-sum curve below retains the backend's
    // endpoint=false grid so the numerical convention is preserved.
    const { oxClosed, oyClosed } = closedOriginal(ox, oyLerped, domB, lerping);

    // Cursor indices — the one genuinely per-frame quantity.
    const eT = easedT.value;
    const cursors = curves.map((_, hi) => Math.floor(harmonicProgress(hi, totalH, eT) * (N_POINTS - 1)));

    // Sum curve (into a reused buffer: no per-frame array)
    const BLEND = 10;
    if (sumScratch.length !== N_POINTS) sumScratch = new Float64Array(N_POINTS);
    const sumY = sumScratch;
    for (let j = 0; j < N_POINTS; j++) {
        let val = lerpDc;
        for (let hi = 0; hi < totalH; hi++) {
            val += curves[hi][j] * revealWeight(j, cursors[hi], BLEND, N_POINTS);
        }
        sumY[j] = val;
    }

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
    ctx.globalAlpha = (isOrigHov ? 1 : 0.85) * layerAlpha.orig;
    ctx.lineWidth = isOrigHov ? 3.5 : 2.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    for (let i = 0; i < oxClosed.length; i++) {
        const pt = toScreen(oxClosed[i], oyClosed[i]);
        if (i === 0) ctx.moveTo(pt[0], pt[1]);
        else ctx.lineTo(pt[0], pt[1]);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Individual harmonics
    ctx.globalAlpha = layerAlpha.harm;
    for (let hi = 0; hi < totalH; hi++) {
        if (cursors[hi] < 3 || layerAlpha.harm === 0) continue;
        const isHov = hoveredCurve.value === `h-${hi}`;
        ctx.strokeStyle = spectrumColor(hi, totalH, isHov ? 1.0 : 0.55);
        ctx.lineWidth = isHov ? 3.5 : 2.5;
        ctx.beginPath();
        const end = Math.min(cursors[hi] + 1, N_POINTS);
        for (let i = 0; i < end; i++) {
            const pt = toScreen(xGrid[i], curves[hi][i]);
            if (i === 0) ctx.moveTo(pt[0], pt[1]);
            else ctx.lineTo(pt[0], pt[1]);
        }
        ctx.stroke();
    }

    ctx.globalAlpha = 1;

    // Sum curve (golden)
    ctx.save();
    applyGoldenStroke(ctx, { hovered: hoveredCurve.value === "sum", baseWidth: 5, hoverWidth: 7 });
    ctx.beginPath();
    for (let i = 0; i < N_POINTS; i++) {
        const pt = toScreen(xGrid[i], sumY[i]);
        if (i === 0) ctx.moveTo(pt[0], pt[1]);
        else ctx.lineTo(pt[0], pt[1]);
    }
    ctx.stroke();
    ctx.restore();

    // UIA-F-253 — a sweep held part-way shows where it stands: the harmonics
    // enter from the left, so the Sum right of the front is still the partial
    // one. A thin rule in the axis ink marks the entering harmonic's front.
    if (eT > 0 && eT < 1) {
        let front = -1;
        for (const c of cursors) if (c > 0 && c < N_POINTS - 1 && c > front) front = c;
        if (front >= 0) {
            const [fx] = toScreen(xGrid[front], minY);
            ctx.save();
            ctx.strokeStyle = ink;
            ctx.globalAlpha = 0.45;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(fx, PAD.top);
            ctx.lineTo(fx, h - PAD.bottom);
            ctx.stroke();
            ctx.restore();
        }
    }

    lastFrame = { toScreen, xGrid, curves, cursors, sumY, oxClosed, oyClosed };
    cachedScreenCurves = null;
}

/** The closed original curve, rebuilt only when its source (or a transition) changes. */
let closedKey: unknown[] = [];
let closedValue = { oxClosed: [] as number[], oyClosed: [] as number[] };
function closedOriginal(ox: number[], oy: number[], domB: number, lerping: boolean) {
    if (!lerping && closedKey[0] === ox && closedKey[1] === oy && closedKey[2] === domB) return closedValue;
    closedValue = {
        oxClosed: ox.length ? [...ox, domB] : ox,
        oyClosed: oy.length ? [...oy, oy[0]] : oy,
    };
    closedKey = lerping ? [] : [ox, oy, domB];
    return closedValue;
}

/** The hover hit-test's screen curves for the frame on screen, built on demand. */
function screenCurves(): CurveHitRegion[] {
    if (cachedScreenCurves) return cachedScreenCurves;
    if (!lastFrame) return [];
    const { toScreen, xGrid, curves, cursors, sumY, oxClosed, oyClosed } = lastFrame;
    const sumPts: [number, number][] = [];
    for (let i = 0; i < N_POINTS; i++) sumPts.push(toScreen(xGrid[i], sumY[i]));
    const origPts: [number, number][] = [];
    for (let i = 0; i < oxClosed.length; i++) origPts.push(toScreen(oxClosed[i], oyClosed[i]));
    const harmPts: CurveHitRegion[] = [];
    for (let hi = 0; hi < curves.length; hi++) {
        if (cursors[hi] < 3) continue;
        const pts: [number, number][] = [];
        const end = Math.min(cursors[hi] + 1, N_POINTS);
        for (let i = 0; i < end; i++) pts.push(toScreen(xGrid[i], curves[hi][i]));
        harmPts.push({ key: `h-${hi}`, points: pts });
    }
    cachedScreenCurves = [
        { key: "sum", points: sumPts },
        ...(props.showOriginal === false ? [] : [{ key: "original", points: origPts }]),
        ...(props.showHarmonics === false ? [] : harmPts),
    ];
    return cachedScreenCurves;
}

// ── Mouse interaction ──

function onCanvasMove(e: MouseEvent) {
    const canvas = canvasRef.value;
    const container = containerRef.value;
    if (!canvas || !container) return;
    const rect = canvas.getBoundingClientRect();
    const hit = hitTestCurves(screenCurves(), e.clientX - rect.left, e.clientY - rect.top);
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
    if (hit !== hoveredCurve.value) { hoveredCurve.value = hit; if (rafId === null) draw(); }
}

function onCanvasLeave() {
    hoveredCurve.value = null;
    mousePos.value = null;
    if (rafId === null) draw();
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
    // UIA-F-201 — the partial sum is S_N, never "f(x) = …"; both speak the series' variable.
    if (h === "sum") return renderKatexInline(`S_{${trigHarmonics.value.length}}(${v.value})`);
    if (h === "original") return renderKatexInline(`f(${v.value})`);
    if (h.startsWith("h-")) {
        const harm = trigHarmonics.value[parseInt(h.slice(2))];
        return harm ? renderKatexInline(`n = ${harm.k},\\; A = ${formatNumber(harm.amplitude)}`) : "";
    }
    return "";
});

// ── Playback ──

function togglePlay() {
    ambient.value = false;
    playing.value = !playing.value;
    if (playing.value) { if (t.value >= 0.99) t.value = 0; startLoop(); }
    else { stopLoop(); draw(); }
    emit("update:sweep", playing.value ? null : t.value);
}

/** Hold the sweep at `at` (a link's or the history's paused point). */
function holdAt(at: number) {
    ambient.value = false;
    playing.value = false;
    stopLoop();
    t.value = at;
    draw();
}

// Back and Forward (and a pasted link's point) move the sweep to the URL's.
watch(() => props.sweep, (at) => {
    if (at === null || at === undefined) {
        if (!playing.value) togglePlayFromUrl();
    } else if (playing.value || Math.abs(at - t.value) > 5e-4) {
        holdAt(at);
    }
});

function togglePlayFromUrl() {
    ambient.value = false;
    playing.value = true;
    if (t.value >= 0.99) t.value = 0;
    startLoop();
}

// ── Layers: a toggled layer fades, never cuts (motion law; reduced motion is a fade too) ──
const layerAlpha = { orig: props.showOriginal === false ? 0 : 1, harm: props.showHarmonics === false ? 0 : 1 };
let layerRaf = 0;
function fadeLayers() {
    cancelAnimationFrame(layerRaf);
    const from = { ...layerAlpha };
    const to = { orig: props.showOriginal === false ? 0 : 1, harm: props.showHarmonics === false ? 0 : 1 };
    const ms = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--duration-normal")) || 240;
    const start = performance.now();
    const step = (now: number) => {
        const k = Math.min(1, (now - start) / ms);
        const e = easeInOutSine(k);
        layerAlpha.orig = lerp(from.orig, to.orig, e);
        layerAlpha.harm = lerp(from.harm, to.harm, e);
        if (rafId === null) draw();
        if (k < 1) layerRaf = requestAnimationFrame(step);
    };
    layerRaf = requestAnimationFrame(step);
}
watch(() => [props.showOriginal, props.showHarmonics], fadeLayers);

/** The plot as a PNG on the stage card's ground (the stage dock's Export plot). */
function exportPng(filename = "fourier-series.png"): void {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const out = document.createElement("canvas");
    out.width = canvas.width;
    out.height = canvas.height;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    const ground = getComputedStyle(containerRef.value ?? canvas).getPropertyValue("--card").trim();
    ctx.fillStyle = ground || "#fff";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, 0, 0);
    out.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
}

defineExpose({ exportPng });

// ── Scrubbing ──

/* True from `scrub-start` to `scrub-end`: the hand holds the sweep. Since
   glass 11.1.0 the scrub opens on the press, before reka's seek reaches `t`, so
   the hold's release below (ambient turning false here) would restart the loop
   under the hand and the loop would overwrite the seek. */
const scrubbing = ref(false);
function onScrubStart() {
    scrubbing.value = true;
    ambient.value = false;
    stopLoop();
}
function onScrubMove(newT: number) {
    t.value = newT;
    draw();
}
function onScrubEnd() {
    scrubbing.value = false;
    if (playing.value) startLoop();
    else emit("update:sweep", t.value);
}

// ── Legend ──

function onLegendEnter(key: string) { hoveredCurve.value = key; if (rafId === null) draw(); }
function onLegendLeave() { hoveredCurve.value = null; if (rafId === null) draw(); }

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

watch(() => props.nHarmonics, () => { if (rafId === null) draw(); });

/* The hold parks the loop where it stands (the frame stays); its release
   continues the sweep from there. */
watch(holding, (h) => { if (!h && playing.value && !scrubbing.value) startLoop(); });

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
watch(() => [props.domain, props.expression], () => { if (rafId === null) draw(); });

// ── Lifecycle ──

onMounted(() => {
    nextTick(() => {
        if (props.sweep !== null && props.sweep !== undefined) {
            // A link's paused point (`s`): the sweep opens held there.
            holdAt(props.sweep);
        } else if (prefersReducedMotion.value) {
            // The TERMINAL frame, per `M-D1`: converged, complete, and static.
            t.value = 1;
            playing.value = false;
            draw();
        } else {
            draw();
            t.value = 0;
            playing.value = true;
            ambient.value = true;
            startLoop();
        }
    });
    themeObserver = new MutationObserver(() => {
        readInk();
        if (rafId === null) draw();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
    // `L-M3 + D-26` — neither clock was visibility-gated, and on a phone the
    // plot stays mounted while the controls pane is shown (the stage then
    // stands off-screen beside it, `styles/workspace.css`), so the loop, the
    // per-frame layout read and the reactive cascade would run unseen. An
    // element out of the viewport never intersects, which is the signal needed.
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
    cancelAnimationFrame(layerRaf);
    visibilityObserver?.disconnect();
    themeObserver?.disconnect();
});
</script>

<template>
    <div ref="containerRef" class="convergence-container" :data-legend-wrapped="legendWrapped || undefined">
        <!-- `D-5` — the plot is the route's primary figure and announced as
             nothing at all: no role, no name, no text equivalent. `role="img"`
             plus a name that carries the READING (which curves, how many
             harmonics, where the sweep is) is the text equivalent a canvas
             cannot otherwise have. -->
        <!-- X.F.W14U.eq — UIA-F-205: the plot box and the legend are two cells;
             the legend sits in its own gutter beside the curves, never on them. -->
        <div class="plot-box">
            <canvas
                ref="canvasRef"
                class="absolute inset-0 size-full text-muted-foreground"
                role="img"
                :aria-label="plotDescription"
                @mousemove="onCanvasMove"
                @mouseleave="onCanvasLeave"
            />
        </div>

        <!-- Cursor-following tooltip -->
        <div
            v-if="hoveredCurve && mousePos && tooltipHtml"
            class="curve-tooltip glass-floating"
            :style="{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }"
            v-html="tooltipHtml"
        />

        <!-- Legend -->
        <ConvergenceLegend
            :harmonics="trigHarmonics"
            :hovered-curve="hoveredCurve"
            :variable="v"
            :wrapped="legendWrapped"
            :drawn="activeCount"
            :show-original="showOriginal !== false"
            :show-harmonics="showHarmonics !== false"
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
    display: flex;
    gap: 0.5rem;
}
.plot-box {
    position: relative;
    flex: 1 1 auto;
    min-width: 0;
}
.convergence-container[data-legend-wrapped] {
    flex-direction: column;
}
/* X §0hm D-8: in short landscape the plot takes the stage's remaining height
   rather than a 200 px floor the stage cannot hold beside the series. */
@media (orientation: landscape) and (max-height: 500px) {
    .convergence-container {
        min-height: 0;
    }
}

/* ── Tooltip ── */
/* X.F.W14U.eq — UIA-F-203: the same floating surface as the coefficient
   popover — glass's `glass-floating` plate (template) at the popover canon's
   `--radius-panel` corner — instead of a second hand-rolled plate. */
.curve-tooltip {
    @apply absolute pointer-events-none;
    border-radius: var(--radius-panel);
    font-family: var(--font-mono);
    font-size: var(--type-caption);
    line-height: var(--type-leading-caption);
    padding: 0.375rem 0.75rem;
    color: var(--popover-foreground);
    /* X-DS pass 1 · F1-11: the plate's one shadow is glass-floating's. */
    white-space: nowrap;
    z-index: var(--z-controls);
    /* A.W3.d — `tooltip-in` is canonical in glass-ui's animations.css; the
       consumer-side shadow keyframe has been excised. Resolves via global cascade. */
    animation: tooltip-in var(--duration-control) var(--ease-out);
}

/* `M-L7` — the local `@media (prefers-reduced-motion: reduce) { animation: none }`
   block is GONE: glass-ui's `utilities/a11y-overrides.css` already resets
   `animation-duration` to 0.01ms on `*` with `!important` under the same query,
   so the component's one act of compliance was a no-op that cost a maintainer's
   attention and bought nothing. The clocks CSS cannot reach are gated in script,
   above, which is where the omission actually was. */
</style>
