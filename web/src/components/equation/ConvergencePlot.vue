<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import type { FourierTermDTO } from "@/lib/equation/types";
import { applyGoldenShimmer, clearShimmer } from "@/lib/golden-shimmer";
import { easeInOutSine } from "@mkbabb/value.js";
import katex from "katex";

import { drawPlotGrid, type PlotPadding } from "./lib/grid";
import { hitTestCurves, type CurveHitRegion } from "./lib/hit-test";
import { groupTrigHarmonics, harmonicProgress, spectrumColor, type TrigHarmonic } from "./lib/harmonics";
import { createTransitionState, startTransition, snapshotForTransition, lerp } from "./composables/useCurveTransition";

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
const trackRef = ref<HTMLElement>();

const t = ref(0);
const playing = ref(false);
const scrubbing = ref(false);
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
let resizeObserver: ResizeObserver | null = null;
let rafId: number | null = null;
let loopStartTime: number | null = null;
let cachedScreenCurves: CurveHitRegion[] = [];

const PAD: PlotPadding = { top: 14, bottom: 18, left: 12, right: 12 };

// ── Animation loop ──

function startLoop() {
    loopStartTime = null;
    function tick(now: number) {
        if (!playing.value) return;
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

// ── Draw ──

function draw() {
    const canvas = canvasRef.value;
    const container = containerRef.value;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const w = rect.width, h = rect.height;
    const ox = props.originalPoints.x, oy = props.originalPoints.y;
    if (!ox.length) return;
    ctx.clearRect(0, 0, w, h);

    const [domA, domB] = props.domain;
    const omega = (2 * Math.PI) / (domB - domA);
    const harmonics = trigHarmonics.value;
    const totalH = harmonics.length;
    const dc = dcTerm.value;
    const nPts = 500;
    const tp = transition.progress;

    // X-grid (endpoint=false to match backend)
    const xGrid: number[] = [];
    for (let i = 0; i < nPts; i++) xGrid.push(domA + (i / nPts) * (domB - domA));

    // Lerp original Y
    const oyLerped = oy.map((y, i) => {
        if (tp >= 1 || !transition.prevOrigY.length) return y;
        return lerp(i < transition.prevOrigY.length ? transition.prevOrigY[i] : y, y, tp);
    });

    // Lerp harmonic coefficients
    const lerpH: TrigHarmonic[] = harmonics.map((h, i) => {
        if (tp >= 1 || i >= transition.prevHarmonics.length) return h;
        const o = transition.prevHarmonics[i];
        return { k: h.k, a_n: lerp(o.a_n, h.a_n, tp), b_n: lerp(o.b_n, h.b_n, tp), amplitude: lerp(o.amplitude, h.amplitude, tp) };
    });
    const lerpDc = tp >= 1 ? (dc?.coefficient_re ?? 0) : lerp(transition.prevDcRe, dc?.coefficient_re ?? 0, tp);

    // Cursor indices
    const eT = easedT.value;
    const cursors = lerpH.map((_, hi) => Math.floor(harmonicProgress(hi, totalH, eT) * (nPts - 1)));

    // Harmonic curves
    const curves = lerpH.map((h) => xGrid.map((x) => h.a_n * Math.cos(h.k * omega * x) + h.b_n * Math.sin(h.k * omega * x)));

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

    // Y-bounds (lerped for smooth transition)
    const fullSum = xGrid.map((x) => {
        let v = dc?.coefficient_re ?? 0;
        for (const h of harmonics) v += h.a_n * Math.cos(h.k * omega * x) + h.b_n * Math.sin(h.k * omega * x);
        return v;
    });
    const tMinY = Math.min(...oy, ...fullSum), tMaxY = Math.max(...oy, ...fullSum);
    const yP = (tMaxY - tMinY) * 0.08 || 1;
    let minY: number, maxY: number;
    if (tp >= 1 || !transition.prevOrigY.length) {
        minY = tMinY - yP; maxY = tMaxY + yP;
    } else {
        minY = lerp(transition.prevMinY, tMinY - yP, tp);
        maxY = lerp(transition.prevMaxY, tMaxY + yP, tp);
    }

    const minX = ox[0], maxX = ox[ox.length - 1];
    const plotW = w - PAD.left - PAD.right, plotH = h - PAD.top - PAD.bottom;
    const toScreen = (xv: number, yv: number): [number, number] => [
        PAD.left + ((xv - minX) / (maxX - minX)) * plotW,
        PAD.top + (1 - (yv - minY) / (maxY - minY)) * plotH,
    ];

    // Grid
    drawPlotGrid(ctx, w, h, PAD, minX, maxX, minY, maxY, toScreen);

    // Original f(x)
    const isOrigHov = hoveredCurve.value === "original";
    ctx.strokeStyle = isOrigHov ? "rgba(220,220,220,0.85)" : "rgba(180,180,180,0.55)";
    ctx.lineWidth = isOrigHov ? 3.5 : 2.5;
    ctx.setLineDash([6, 4]);
    const origPts: [number, number][] = [];
    ctx.beginPath();
    for (let i = 0; i < ox.length; i++) {
        const pt = toScreen(ox[i], oyLerped[i]);
        origPts.push(pt);
        i === 0 ? ctx.moveTo(pt[0], pt[1]) : ctx.lineTo(pt[0], pt[1]);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Individual harmonics
    const harmPts: CurveHitRegion[] = [];
    for (let hi = 0; hi < totalH; hi++) {
        if (cursors[hi] < 3) continue;
        const isHov = hoveredCurve.value === `h-${hi}`;
        ctx.strokeStyle = spectrumColor(hi, totalH, isHov ? 1.0 : 0.55);
        ctx.lineWidth = isHov ? 3.5 : 2.5;
        const pts: [number, number][] = [];
        ctx.beginPath();
        const end = Math.min(cursors[hi] + 1, nPts);
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
    for (let i = 0; i < nPts; i++) {
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
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mousePos.value = { x: e.clientX, y: e.clientY };
    const hit = hitTestCurves(cachedScreenCurves, e.clientX - rect.left, e.clientY - rect.top);
    if (hit !== hoveredCurve.value) { hoveredCurve.value = hit; if (!playing.value) draw(); }
}

function onCanvasLeave() {
    hoveredCurve.value = null;
    mousePos.value = null;
    if (!playing.value) draw();
}

function renderKatexInline(latex: string): string {
    try { return katex.renderToString(latex, { throwOnError: false, displayMode: false }); }
    catch { return latex; }
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

function tFromPointer(e: PointerEvent): number {
    const r = trackRef.value!.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
}
function onTrackDown(e: PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    scrubbing.value = true; stopLoop(); t.value = tFromPointer(e); draw();
}
function onTrackMove(e: PointerEvent) { if (!scrubbing.value) return; t.value = tFromPointer(e); draw(); }
function onTrackUp() { scrubbing.value = false; if (playing.value) startLoop(); }

// ── Legend ──

function onLegendEnter(key: string) { hoveredCurve.value = key; if (!playing.value) draw(); }
function onLegendLeave() { hoveredCurve.value = null; if (!playing.value) draw(); }

const activeCount = computed(() => {
    const total = trigHarmonics.value.length;
    const eT = easedT.value;
    let n = 0;
    for (let i = 0; i < total; i++) if (harmonicProgress(i, total, eT) > 0.5) n++;
    return n;
});

// ── Watches ──

watch(() => [props.originalPoints, props.coefficients], (_, old) => {
    if (old?.[0]) {
        const oldOy = (old[0] as { x: number[]; y: number[] }).y;
        snapshotForTransition(transition, oldOy, trigHarmonics.value, dcTerm.value?.coefficient_re ?? 0, props.originalPoints.x, props.domain);
        cancelTransition?.();
        cancelTransition = startTransition(transition, draw);
    } else {
        draw();
    }
}, { deep: true });

watch(() => props.nHarmonics, () => { if (!playing.value) draw(); });

// ── Lifecycle ──

onMounted(() => {
    nextTick(() => { draw(); t.value = 0; playing.value = true; startLoop(); });
    resizeObserver = new ResizeObserver(() => draw());
    if (containerRef.value) resizeObserver.observe(containerRef.value);
});

onUnmounted(() => {
    stopLoop();
    cancelTransition?.();
    resizeObserver?.disconnect();
});
</script>

<template>
    <div ref="containerRef" class="convergence-container">
        <canvas
            ref="canvasRef"
            class="block size-full text-muted-foreground"
            @mousemove="onCanvasMove"
            @mouseleave="onCanvasLeave"
        />

        <!-- Cursor-following tooltip -->
        <div
            v-if="hoveredCurve && mousePos && tooltipHtml"
            class="curve-tooltip"
            :style="{
                left: (mousePos.x - (containerRef?.getBoundingClientRect().left ?? 0) + 14) + 'px',
                top: (mousePos.y - (containerRef?.getBoundingClientRect().top ?? 0) - 32) + 'px',
            }"
            v-html="tooltipHtml"
        />

        <!-- Legend -->
        <div v-if="trigHarmonics.length" class="legend-overlay">
            <div class="legend-entry" :class="{ 'is-hovered': hoveredCurve === 'sum' }"
                @pointerenter="onLegendEnter('sum')" @pointerleave="onLegendLeave()">
                <span class="legend-dot legend-dot--golden" />
                <span class="legend-label legend-label--golden">Sum</span>
            </div>
            <div class="legend-entry" :class="{ 'is-hovered': hoveredCurve === 'original' }"
                @pointerenter="onLegendEnter('original')" @pointerleave="onLegendLeave()">
                <span class="legend-dot legend-dot--dashed" />
                <span class="legend-label">f(x)</span>
            </div>
            <div class="legend-divider" />
            <div
                v-for="(h, i) in trigHarmonics" :key="h.k"
                class="legend-entry"
                :class="{ 'is-hovered': hoveredCurve === `h-${i}` }"
                @pointerenter="onLegendEnter(`h-${i}`)"
                @pointerleave="onLegendLeave()"
            >
                <span class="legend-dot" :style="{ background: spectrumColor(i, trigHarmonics.length) }" />
                <span class="legend-label">n={{ h.k }}</span>
            </div>
        </div>
    </div>

    <!-- Timeline -->
    <div class="timeline-dock">
        <button class="play-btn" :class="{ 'is-playing': playing }" @click="togglePlay">
            <Transition name="icon-swap" mode="out-in">
                <svg v-if="playing" class="size-3" viewBox="0 0 320 512" fill="currentColor"><path d="M48 64C21.5 64 0 85.5 0 112L0 400c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48L48 64zm192 0c-26.5 0-48 21.5-48 48l0 288c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48l-32 0z"/></svg>
                <svg v-else class="size-3" viewBox="0 0 384 512" fill="currentColor"><path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80L0 432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/></svg>
            </Transition>
        </button>

        <div class="timeline-track-wrap">
            <div
                ref="trackRef"
                class="glass-track"
                role="slider"
                tabindex="0"
                :aria-valuenow="activeCount"
                aria-valuemin="0"
                :aria-valuemax="trigHarmonics.length"
                aria-label="Harmonics timeline"
                @pointerdown="onTrackDown"
                @pointermove="onTrackMove"
                @pointerup="onTrackUp"
                @pointercancel="onTrackUp"
            >
                <div class="glass-fill" :style="{ width: `${t * 100}%` }" />
                <div class="glass-thumb" :style="{ left: `${t * 100}%` }" />
            </div>
        </div>

        <span class="timeline-count">N={{ activeCount }}/{{ trigHarmonics.length }}</span>
    </div>
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
    background: hsl(var(--popover) / 0.92);
    color: hsl(var(--popover-foreground));
    border: 1.5px solid hsl(var(--border));
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    white-space: nowrap;
    z-index: 20;
    animation: tooltip-in 0.1s ease;
}

@keyframes tooltip-in {
    from { opacity: 0; transform: scale(0.96); }
    to   { opacity: 1; transform: scale(1); }
}

/* ── Legend ── */
.legend-overlay {
    @apply absolute top-2 right-2 flex flex-col gap-0.5 pointer-events-auto;
    max-height: calc(100% - 16px);
    overflow-y: auto;
    overflow-x: hidden;
    padding: 8px 12px;
    border-radius: 8px;
    background: hsl(var(--background) / 0.75);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid hsl(var(--foreground) / 0.06);
    scrollbar-width: thin;
    z-index: 5;
    min-width: 100px;
}

.legend-entry {
    @apply flex items-center gap-2.5 px-2 py-1 rounded cursor-default;
    transition: background 0.1s;
}
.legend-entry:hover,
.legend-entry.is-hovered {
    background: hsl(var(--foreground) / 0.06);
}

.legend-divider {
    height: 1px;
    margin: 3px 0;
    background: hsl(var(--foreground) / 0.06);
}

.legend-dot {
    @apply shrink-0 rounded-full;
    width: 10px;
    height: 10px;
}
.legend-dot--golden {
    background: #f0b632;
    box-shadow: 0 0 4px rgba(240, 182, 50, 0.4);
}
.legend-dot--dashed {
    background: transparent;
    border: 2px dashed rgba(180, 180, 180, 0.6);
}

.legend-label {
    @apply select-none;
    font-family: "Fira Code", monospace;
    color: hsl(var(--muted-foreground));
    font-size: 13px;
    line-height: 1.3;
}
.legend-label--golden {
    color: #f0b632;
    font-weight: 600;
}

/* ── Timeline ── */
.timeline-dock {
    @apply flex items-center gap-2 mt-2;
}

.timeline-count {
    font-family: "Fira Code", monospace;
    font-size: 12px;
    color: hsl(var(--muted-foreground));
    width: 3.5rem;
    text-align: right;
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
}

.play-btn {
    @apply flex items-center justify-center shrink-0 rounded-full cursor-pointer;
    width: 1.75rem;
    height: 1.75rem;
    border: 1.5px solid hsl(var(--foreground) / 0.1);
    background: hsl(var(--background) / 0.6);
    backdrop-filter: blur(8px);
    color: hsl(var(--muted-foreground));
    transition: all 0.15s ease;
}
.play-btn:hover {
    background: hsl(var(--background) / 0.85);
    color: hsl(var(--foreground));
}
.play-btn.is-playing {
    background: hsl(var(--foreground) / 0.08);
    border-color: hsl(var(--foreground) / 0.2);
    color: hsl(var(--foreground));
}

.timeline-track-wrap {
    @apply flex-1 min-w-0 relative flex items-center;
    padding: 0 0.125rem;
}

.glass-track {
    @apply relative w-full rounded-xl cursor-pointer outline-none;
    height: 20px;
    background: hsl(var(--foreground) / 0.05);
    backdrop-filter: blur(12px);
    touch-action: none;
    overflow: hidden;
    transition: background 0.2s;
}
.glass-track:hover,
.glass-track:focus-visible {
    background: hsl(var(--foreground) / 0.08);
}
.glass-track:focus-visible {
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.4);
}

.glass-fill {
    @apply absolute inset-y-0 left-0 rounded-xl pointer-events-none;
    background: hsl(var(--foreground) / 0.07);
}

.glass-thumb {
    @apply absolute pointer-events-none;
    top: 50%;
    transform: translate(calc(-50% - 3px), -50%);
    width: 6px;
    height: 14px;
    border-radius: 2px;
    background: hsl(var(--foreground) / 0.25);
    opacity: 0;
    transition: all 0.15s ease;
}
.glass-track:hover .glass-thumb {
    opacity: 1;
    width: 7px;
    height: 16px;
    background: hsl(var(--foreground) / 0.4);
}

/* ── Transitions ── */
.icon-swap-enter-active,
.icon-swap-leave-active {
    transition: opacity 0.1s ease, transform 0.1s ease;
}
.icon-swap-enter-from { opacity: 0; transform: scale(0.7); }
.icon-swap-leave-to   { opacity: 0; transform: scale(0.7); }
</style>
