<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useMediaQuery, useResizeObserver } from "@vueuse/core";
import type { ContourAsset } from "@/lib/types";
import {
    closedSplinePath,
    nearestSegmentIndex,
    simplifyClosedPoints,
    smoothClosedPoints,
    zipPoints,
    unzipPoints,
    type Point2D,
} from "@/lib/contourEditing";
import { overlayUrl } from "@/lib/api";
import { useWorkspaceStore } from "@/stores/workspace";
import { useContourHistory } from "./composables/useContourHistory";
import { usePointDrag } from "./composables/usePointDrag";

const props = defineProps<{
    contour: ContourAsset;
    imageSlug: string | null;
    showImageOverlay?: boolean;
    /** The extraction's own outline under the edit (the dock's Contour trace). */
    showGhost?: boolean;
}>();

const emit = defineEmits<{
    stateChange: [state: { canUndo: boolean; canRedo: boolean; canDelete: boolean; pointCount: number }];
    save: [points: { x: number[]; y: number[] }];
}>();

const MARGIN = 0.15;

/*
 * X.F.W14U.vedit — UIA-F-87: the surface was a mat of 1024 handles 5-7 px
 * across, all painted, so the shape did not dominate and the selection could
 * not be found. Handles are now sized in screen pixels (DESIGN.md :930/:1429):
 * the press target is the 24 px floor (44 px on a coarse pointer), measured
 * from the nearest point, so neighbours never shadow one another; a handle is
 * painted only near the pointer, and the selection always, inside a ring.
 */
const HANDLE_PX = 4.5;
const REVEAL_PX = 56;
const isCoarse = useMediaQuery("(pointer: coarse)");
const hitPx = computed(() => (isCoarse.value ? 22 : 12));

const wStore = useWorkspaceStore();

// State
const points = ref<Point2D[]>([]);
const svgRef = ref<SVGSVGElement | null>(null);
const shellRef = ref<HTMLDivElement | null>(null);
/** Screen pixels per data unit (the viewBox's uniform `meet` scale). */
const pxPerUnit = ref(1);
/** The pointer in data coordinates while it is over the surface. */
const pointerAt = ref<Point2D | null>(null);

function measureScale() {
    const m = svgRef.value?.getScreenCTM();
    if (m && m.a > 0) pxPerUnit.value = m.a;
}
useResizeObserver(svgRef, measureScale);

// Magnet mode: drag adjacent points with falloff
const magnetRadius = ref(3); // 0 = off, 1-10 = number of adjacent points affected; default on

// Composables
const { pushHistory, undo, redo, initHistory, canUndo, canRedo } = useContourHistory(points);
const { selectedIdx, onPointPointerDown: rawPointPointerDown, onPointerMove, onPointerUp: rawPointerUp, deselect } = usePointDrag(
    points,
    magnetRadius,
    svgPoint,
    pushHistory,
);

// Stable bounds — computed from initial contour, not live points
const stableBounds = ref({ minX: 0, maxX: 1, minY: 0, maxY: 1, width: 1, height: 1 });

// Initialize from contour
function initFromContour() {
    const pts = zipPoints(props.contour.points.x, props.contour.points.y);
    points.value = pts;
    initHistory(pts);
    deselect();

    // Compute stable bounds from initial points
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of pts) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    }
    stableBounds.value = { minX, maxX, minY, maxY, width: maxX - minX || 1, height: maxY - minY || 1 };

    requestAnimationFrame(measureScale);
    emitState();
}

watch(() => props.contour, initFromContour, { immediate: true });

// Bounds — use stable bounds for viewBox and image overlay, live bounds for nothing
const bounds = computed(() => stableBounds.value);

const viewBox = computed(() => {
    const b = bounds.value;
    const padX = b.width * MARGIN;
    const padY = b.height * MARGIN;
    return `${b.minX - padX} ${-(b.maxY + padY)} ${b.width + padX * 2} ${b.height + padY * 2}`;
});

// Spline path
const splinePath = computed(() => closedSplinePath(points.value));

/* UIA-F-86: the dock's Contour trace acted on nothing here. On the editing
   surface it draws the saved outline under the edit, so every change reads
   against what it changes. */
const referencePath = computed(() =>
    props.showGhost ? closedSplinePath(zipPoints(props.contour.points.x, props.contour.points.y)) : null,
);

const handleR = computed(() => HANDLE_PX / pxPerUnit.value);
const ringR = computed(() => (HANDLE_PX + 5) / pxPerUnit.value);

/** The index of the point nearest `at` within `px` screen pixels, else null. */
function nearestWithin(at: Point2D, px: number): number | null {
    const limit = (px / pxPerUnit.value) ** 2;
    let best: number | null = null;
    let bestD = limit;
    points.value.forEach((p, i) => {
        const d = (p.x - at.x) ** 2 + (p.y - at.y) ** 2;
        if (d <= bestD) {
            bestD = d;
            best = i;
        }
    });
    return best;
}

/** The points painted as handles: those near the pointer. */
const revealed = computed(() => {
    const at = pointerAt.value;
    const shown = new Set<number>();
    if (!at) return shown;
    const limit = (REVEAL_PX / pxPerUnit.value) ** 2;
    points.value.forEach((p, i) => {
        if ((p.x - at.x) ** 2 + (p.y - at.y) ** 2 <= limit) shown.add(i);
    });
    return shown;
});

/** The point a press would pick right now. */
const hotIdx = computed(() => (pointerAt.value ? nearestWithin(pointerAt.value, hitPx.value) : null));

// Image overlay: use the resized overlay endpoint + image_bounds for positioning.
// Derive resize from image_bounds so the overlay always matches the extraction dimensions.
const overlayHref = computed(() => {
    if (!props.imageSlug) return null;
    const ib = props.contour.image_bounds;
    const resize = ib
        ? Math.round(Math.max(ib.maxX - ib.minX, ib.maxY - ib.minY))
        : (wStore.contourSettings?.resize ?? 768);
    return overlayUrl(props.imageSlug, resize);
});

// Image bounds from contour document (authoritative data-space rectangle).
const imageOverlayRect = computed(() => {
    const ib = props.contour.image_bounds;
    if (!ib) return null;
    return {
        x: ib.minX,
        y: ib.minY,
        w: ib.maxX - ib.minX,
        h: ib.maxY - ib.minY,
    };
});

// Wrapped undo/redo with side effects
function doUndo() {
    undo();
    deselect();
    emitState();
}

function doRedo() {
    redo();
    deselect();
    emitState();
}

function emitState() {
    emit("stateChange", {
        canUndo: canUndo(),
        canRedo: canRedo(),
        canDelete: selectedIdx.value !== null,
        pointCount: points.value.length,
    });
}

// SVG coordinate conversion
function svgPoint(e: MouseEvent | PointerEvent): Point2D {
    const svg = svgRef.value!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM()!.inverse();
    const transformed = pt.matrixTransform(ctm);
    // Y is flipped in our coordinate system
    return { x: transformed.x, y: -transformed.y };
}

// Interaction handlers
function onDblClick(e: MouseEvent) {
    const click = svgPoint(e);
    const idx = nearestSegmentIndex(points.value, click);
    points.value.splice(idx, 0, click);
    selectedIdx.value = idx;
    pushHistory();
    emitState();
}

/* UIA-F-87: a press picks the nearest point within the target floor (the
   handles are not the targets — a 24 px circle per point would let each
   neighbour shadow the next); a press on open surface clears the selection. */
function onSurfacePointerDown(e: PointerEvent) {
    if (e.button !== 0) return;
    const idx = nearestWithin(svgPoint(e), hitPx.value);
    if (idx === null) {
        deselect();
        emitState();
        return;
    }
    rawPointPointerDown(idx, e);
    // The drag's `preventDefault` suppresses the compatibility mousedown, and
    // with it the browser's focus move; the editing surface takes focus
    // itself so its shortcuts follow the point the user just picked.
    shellRef.value?.focus({ preventScroll: true });
    emitState();
}

// X.F.W14.u — UIA-F-16: the drag's end writes history (`onDragEnd` pushes it,
// and ⌘Z restores the point), but the raw handler emitted no state, so the
// dock's Undo stayed disabled after every drag. Every history mutation emits,
// as the other paths above and below already do.
function onPointerUp() {
    rawPointerUp();
    emitState();
}

function onSurfacePointerMove(e: PointerEvent) {
    pointerAt.value = svgPoint(e);
    onPointerMove(e);
}

function onSurfacePointerLeave() {
    pointerAt.value = null;
}

function onKeyDown(e: KeyboardEvent) {
    if ((e.key === "Delete" || e.key === "Backspace") && selectedIdx.value !== null) {
        e.preventDefault();
        deleteSelected();
    }
    if (e.key === "z" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        doUndo();
    }
    if ((e.key === "z" && (e.metaKey || e.ctrlKey) && e.shiftKey) || (e.key === "y" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        doRedo();
    }
}

function deleteSelected() {
    if (selectedIdx.value === null || points.value.length <= 3) return;
    points.value.splice(selectedIdx.value, 1);
    deselect();
    pushHistory();
    emitState();
}

function applySmooth() {
    points.value = smoothClosedPoints(points.value);
    deselect();
    pushHistory();
    emitState();
}

function applySimplify() {
    points.value = simplifyClosedPoints(points.value);
    deselect();
    pushHistory();
    emitState();
}

/* UIA-F-180: Reset wiped the undo history with no confirmation. It is an
   edit like any other now — one history step, so Undo brings the work back. */
function resetToExtraction() {
    points.value = zipPoints(props.contour.points.x, props.contour.points.y);
    deselect();
    pushHistory();
    emitState();
}

/** Drop the unsaved edits: back to the saved contour, with a fresh history. */
function discardEdits() {
    initFromContour();
}

/** UIA-F-180 ⊕ F-15: leaving the editor clears the selection. */
function clearSelection() {
    deselect();
    emitState();
}

function getPoints(): { x: number[]; y: number[] } {
    return unzipPoints(points.value);
}

// X.F.W14.u — UIA-F-15: the shortcuts were a WINDOW keydown listener on an
// editor that stays mounted (hidden by opacity) outside edit mode, so Backspace,
// Delete and ⌘Z were taken from the whole page: typing in a sidebar spinbutton
// lost its keystroke and deleted a contour point out of view. They are bound on
// the editor's own focusable surface now (the template's `@keydown`), so they
// act only while focus is on the editor.

defineExpose({
    undo: doUndo,
    redo: doRedo,
    applySmooth,
    applySimplify,
    deleteSelected,
    resetToExtraction,
    discardEdits,
    clearSelection,
    getPoints,
    points,
    magnetRadius,
});
</script>

<template>
    <div ref="shellRef" class="editor-shell" tabindex="0" @keydown="onKeyDown">
        <svg
            ref="svgRef"
            :viewBox="viewBox"
            preserveAspectRatio="xMidYMid meet"
            class="editor-svg"
            @dblclick="onDblClick"
            @pointerdown="onSurfacePointerDown"
            @pointermove="onSurfacePointerMove"
            @pointerleave="onSurfacePointerLeave"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
        >
            <g transform="scale(1,-1)">
                <!-- Image overlay — positioned using authoritative image_bounds -->
                <image
                    v-if="showImageOverlay && overlayHref && imageOverlayRect"
                    :href="overlayHref"
                    :x="imageOverlayRect.x"
                    :y="imageOverlayRect.y"
                    :width="imageOverlayRect.w"
                    :height="imageOverlayRect.h"
                    :transform="`translate(0, ${imageOverlayRect.y * 2 + imageOverlayRect.h}) scale(1, -1)`"
                    style="opacity: 0.28; pointer-events: none"
                    preserveAspectRatio="xMidYMid meet"
                />

                <!-- UIA-F-86: the saved outline, under the edit -->
                <path
                    v-if="referencePath"
                    :d="referencePath"
                    fill="none"
                    stroke="var(--contour-stroke)"
                    stroke-opacity="0.35"
                    stroke-width="1.5"
                    stroke-dasharray="6 5"
                    vector-effect="non-scaling-stroke"
                    class="reference-trace"
                />

                <!-- Spline path -->
                <path
                    :d="splinePath"
                    fill="none"
                    stroke="var(--contour-stroke)"
                    stroke-opacity="0.85"
                    stroke-width="3"
                    vector-effect="non-scaling-stroke"
                    class="spline-path"
                />

                <!-- Control points: sized in screen pixels, painted near the
                     pointer, the selection always (UIA-F-87). The surface takes
                     the press and picks the nearest point. -->
                <circle
                    v-for="(pt, i) in points"
                    :key="i"
                    :cx="pt.x"
                    :cy="pt.y"
                    :r="handleR"
                    vector-effect="non-scaling-stroke"
                    class="control-point"
                    :class="{
                        selected: i === selectedIdx,
                        'is-shown': revealed.has(i) || i === selectedIdx,
                        'is-hot': i === hotIdx,
                    }"
                />
                <circle
                    v-if="selectedIdx !== null && points[selectedIdx]"
                    :cx="points[selectedIdx].x"
                    :cy="points[selectedIdx].y"
                    :r="ringR"
                    vector-effect="non-scaling-stroke"
                    class="selection-ring"
                />
            </g>
        </svg>
    </div>
</template>

<style scoped>
/* The contour stroke is the brand amber, taken from the semantic token rather
   than re-authored as an inline literal at every paint site: the retired
   inline amber (hue 40, 90%, 55%) composited to 1.660:1 against light
   `--card`, while `--viz-amber` clears AA at both pins. Every alpha moves to
   `stroke-opacity` / `fill-opacity` / a
   `color-mix()` stop, so the hue stays a token the cascade — and a token audit
   — can still see.

   The token is declared at each of the two contour surfaces' own roots because
   `ContourEditorCanvas` and `ContourPreview` have no shared ancestor: this
   shell mounts standalone under `FullscreenViewer` as well as beside the
   preview under `VisualizationView`. */
.editor-shell {
    --contour-stroke: var(--viz-amber);
    flex: 1;
    min-height: 0;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    overflow: hidden;
    background:
        linear-gradient(color-mix(in srgb, var(--foreground) 5%, transparent) 1px, transparent 1px),
        linear-gradient(90deg, color-mix(in srgb, var(--foreground) 5%, transparent) 1px, transparent 1px),
        var(--card);
    background-size: 28px 28px, 28px 28px, auto;
}

.editor-svg {
    width: 100%;
    height: 100%;
    display: block;
    cursor: crosshair;
}

/* UIA-F-179: the surface takes keyboard focus (its shortcuts act there), and
   the retired `outline: none` hid it. Keyboard focus paints the producer's
   ring pair, as the app's other hand-focused surfaces do (style.css
   `.sidebar-link:focus-visible` …), inset so the stage does not clip it; a
   pointer press does not match `:focus-visible`. */
.editor-shell:focus-visible {
    outline: var(--focus-ring-width) solid var(--focus-ring-color);
    outline-offset: calc(-1 * var(--focus-ring-width));
}

/* UIA-F-87 ⊕ F-242: one handle register. A handle is hidden until the pointer
   comes near; the one a press would pick is filled; there is one hover ink. */
.control-point {
    fill: var(--contour-stroke);
    fill-opacity: 0.45;
    stroke: var(--contour-stroke);
    stroke-width: 1.5;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s var(--ease-standard), fill-opacity 0.15s var(--ease-standard);
}

.control-point.is-shown {
    opacity: 1;
}

.control-point.is-hot {
    fill-opacity: 1;
}

.editor-svg:has(.control-point.is-hot) {
    cursor: grab;
}

.selection-ring {
    fill: none;
    stroke: var(--contour-stroke);
    stroke-width: 2;
    pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
    .control-point {
        transition: none;
    }
}

.spline-path {
    filter: drop-shadow(0 0 2px color-mix(in srgb, var(--contour-stroke) 30%, transparent));
    transition: filter 0.2s ease;
}

.editor-svg:hover .spline-path {
    animation: golden-shimmer 1.2s ease-in-out infinite;
}

@keyframes golden-shimmer {
    0%, 100% { filter: drop-shadow(0 0 2px color-mix(in srgb, var(--contour-stroke) 30%, transparent)); }
    50% { filter: drop-shadow(0 0 5px color-mix(in srgb, var(--contour-stroke) 50%, transparent)); }
}

.control-point.selected {
    fill: var(--contour-stroke);
    fill-opacity: 1;
    stroke: var(--background);
    stroke-width: 2;
}
</style>
