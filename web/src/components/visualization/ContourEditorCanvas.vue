<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
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
import * as api from "@/lib/api";

const props = defineProps<{
    contour: ContourAsset;
    imageSlug: string | null;
    showImageOverlay?: boolean;
}>();

const emit = defineEmits<{
    stateChange: [state: { canUndo: boolean; canRedo: boolean; canDelete: boolean; pointCount: number }];
    save: [points: { x: number[]; y: number[] }];
}>();

const MARGIN = 0.15;

// State
const points = ref<Point2D[]>([]);
const selectedIdx = ref<number | null>(null);
const dragging = ref(false);
const history = ref<Point2D[][]>([]);
const historyIndex = ref(-1);
const svgRef = ref<SVGSVGElement | null>(null);

// Stable bounds — computed from initial contour, not live points
const stableBounds = ref({ minX: 0, maxX: 1, minY: 0, maxY: 1, width: 1, height: 1 });

// Initialize from contour
function initFromContour() {
    const pts = zipPoints(props.contour.points.x, props.contour.points.y);
    points.value = pts;
    history.value = [pts.map((p) => ({ ...p }))];
    historyIndex.value = 0;
    selectedIdx.value = null;

    // Compute stable bounds from initial points
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of pts) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    }
    stableBounds.value = { minX, maxX, minY, maxY, width: maxX - minX || 1, height: maxY - minY || 1 };

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

// Image overlay URL
const overlayUrl = computed(() =>
    props.imageSlug ? api.imageUrl(props.imageSlug) : null,
);

// Image overlay natural size for aspect-ratio-correct rendering
const overlayNaturalSize = ref<{ w: number; h: number } | null>(null);

watch(overlayUrl, (url) => {
    if (!url) { overlayNaturalSize.value = null; return; }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    // decode() pre-loads the image into the browser cache so the SVG <image>
    // element renders without a visible delay on first paint.
    img.decode().then(() => {
        overlayNaturalSize.value = { w: img.naturalWidth, h: img.naturalHeight };
    }).catch(() => {
        // Fallback: use naturalWidth/Height if decode() fails (e.g. old browser)
        if (img.naturalWidth > 0) {
            overlayNaturalSize.value = { w: img.naturalWidth, h: img.naturalHeight };
        }
    });
}, { immediate: true });

const imageOverlayRect = computed(() => {
    const b = bounds.value;
    const ns = overlayNaturalSize.value;
    if (!ns || ns.w === 0 || ns.h === 0) return { x: b.minX, y: b.minY, w: b.width, h: b.height };
    const imgAR = ns.w / ns.h;
    const boxAR = b.width / b.height;
    let w: number, h: number;
    if (imgAR > boxAR) {
        // Image wider than box — fit to width
        w = b.width;
        h = b.width / imgAR;
    } else {
        // Image taller — fit to height
        h = b.height;
        w = b.height * imgAR;
    }
    const x = b.minX + (b.width - w) / 2;
    const y = b.minY + (b.height - h) / 2;
    return { x, y, w, h };
});

// History management
function pushHistory() {
    const snapshot = points.value.map((p) => ({ ...p }));
    // Truncate future history
    history.value = history.value.slice(0, historyIndex.value + 1);
    history.value.push(snapshot);
    historyIndex.value = history.value.length - 1;
    emitState();
}

function undo() {
    if (historyIndex.value <= 0) return;
    historyIndex.value--;
    points.value = history.value[historyIndex.value].map((p) => ({ ...p }));
    selectedIdx.value = null;
    emitState();
}

function redo() {
    if (historyIndex.value >= history.value.length - 1) return;
    historyIndex.value++;
    points.value = history.value[historyIndex.value].map((p) => ({ ...p }));
    selectedIdx.value = null;
    emitState();
}

function emitState() {
    emit("stateChange", {
        canUndo: historyIndex.value > 0,
        canRedo: historyIndex.value < history.value.length - 1,
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
}

let dragStartIdx: number | null = null;
let dragPrevPt: Point2D | null = null;

// Magnet mode: drag adjacent points with falloff
const magnetRadius = ref(0); // 0 = off, 1-10 = number of adjacent points affected

function onPointPointerDown(idx: number, e: PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    selectedIdx.value = idx;
    dragStartIdx = idx;
    dragPrevPt = { ...points.value[idx] };
    dragging.value = true;
    emitState();
    (e.target as Element).setPointerCapture(e.pointerId);
}

function onPointerMove(e: PointerEvent) {
    if (!dragging.value || dragStartIdx === null || !dragPrevPt) return;
    const pt = svgPoint(e);
    const dx = pt.x - dragPrevPt.x;
    const dy = pt.y - dragPrevPt.y;

    // Move the dragged point
    points.value[dragStartIdx] = pt;

    // Magnet: move adjacent points with linear falloff
    const n = points.value.length;
    const radius = magnetRadius.value;
    if (radius > 0) {
        for (let offset = 1; offset <= radius; offset++) {
            const falloff = 1 - offset / (radius + 1);
            const before = (dragStartIdx - offset + n) % n;
            const after = (dragStartIdx + offset) % n;
            points.value[before] = {
                x: points.value[before].x + dx * falloff,
                y: points.value[before].y + dy * falloff,
            };
            points.value[after] = {
                x: points.value[after].x + dx * falloff,
                y: points.value[after].y + dy * falloff,
            };
        }
    }

    dragPrevPt = { ...pt };
}

function onPointerUp() {
    if (dragging.value && dragStartIdx !== null) {
        pushHistory();
    }
    dragging.value = false;
    dragStartIdx = null;
}

function onBgClick() {
    selectedIdx.value = null;
    emitState();
}

function onKeyDown(e: KeyboardEvent) {
    if ((e.key === "Delete" || e.key === "Backspace") && selectedIdx.value !== null) {
        e.preventDefault();
        deleteSelected();
    }
    if (e.key === "z" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        undo();
    }
    if ((e.key === "z" && (e.metaKey || e.ctrlKey) && e.shiftKey) || (e.key === "y" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        redo();
    }
}

function deleteSelected() {
    if (selectedIdx.value === null || points.value.length <= 3) return;
    points.value.splice(selectedIdx.value, 1);
    selectedIdx.value = null;
    pushHistory();
}

function applySmooth() {
    points.value = smoothClosedPoints(points.value);
    selectedIdx.value = null;
    pushHistory();
}

function applySimplify() {
    points.value = simplifyClosedPoints(points.value);
    selectedIdx.value = null;
    pushHistory();
}

function resetToExtraction() {
    initFromContour();
}

function getPoints(): { x: number[]; y: number[] } {
    return unzipPoints(points.value);
}

onMounted(() => {
    window.addEventListener("keydown", onKeyDown);
});

onUnmounted(() => {
    window.removeEventListener("keydown", onKeyDown);
});

defineExpose({
    undo,
    redo,
    applySmooth,
    applySimplify,
    deleteSelected,
    resetToExtraction,
    getPoints,
    points,
    magnetRadius,
});
</script>

<template>
    <div class="editor-shell" tabindex="0">
        <svg
            ref="svgRef"
            :viewBox="viewBox"
            preserveAspectRatio="xMidYMid meet"
            class="editor-svg"
            @dblclick="onDblClick"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
            @click.self="onBgClick"
        >
            <g transform="scale(1,-1)">
                <!-- Image overlay -->
                <image
                    v-if="showImageOverlay && overlayUrl"
                    :href="overlayUrl"
                    :x="imageOverlayRect.x"
                    :y="imageOverlayRect.y"
                    :width="imageOverlayRect.w"
                    :height="imageOverlayRect.h"
                    :transform="`translate(0, ${imageOverlayRect.y * 2 + imageOverlayRect.h}) scale(1, -1)`"
                    style="opacity: 0.28; pointer-events: none"
                    preserveAspectRatio="none"
                />

                <!-- Spline path -->
                <path
                    :d="splinePath"
                    fill="none"
                    stroke="hsl(40 90% 55% / 0.85)"
                    stroke-width="3"
                    vector-effect="non-scaling-stroke"
                    class="spline-path"
                />

                <!-- Control points -->
                <circle
                    v-for="(pt, i) in points"
                    :key="i"
                    :cx="pt.x"
                    :cy="pt.y"
                    :r="3.5"
                    vector-effect="non-scaling-stroke"
                    class="control-point"
                    :class="{ selected: i === selectedIdx }"
                    @pointerdown="onPointPointerDown(i, $event)"
                />
            </g>
        </svg>
    </div>
</template>

<style scoped>
.editor-shell {
    flex: 1;
    min-height: 0;
    border-radius: var(--radius);
    border: 1px solid hsl(var(--border));
    overflow: hidden;
    outline: none;
    background:
        linear-gradient(hsl(var(--foreground) / 0.05) 1px, transparent 1px),
        linear-gradient(90deg, hsl(var(--foreground) / 0.05) 1px, transparent 1px),
        hsl(var(--card));
    background-size: 28px 28px, 28px 28px, auto;
}

.editor-svg {
    width: 100%;
    height: 100%;
    display: block;
    cursor: crosshair;
}

.control-point {
    fill: hsl(40 90% 55% / 0.6);
    stroke: hsl(40 90% 55%);
    stroke-width: 2.5;
    cursor: grab;
    transition: fill 0.15s, r 0.15s;
}

.control-point:hover {
    fill: hsl(40 90% 55% / 0.5);
}

.spline-path {
    filter: drop-shadow(0 0 2px hsl(40 90% 55% / 0.3));
    transition: filter 0.2s ease;
}

.editor-svg:hover .spline-path {
    animation: golden-shimmer 1.2s ease-in-out infinite;
}

@keyframes golden-shimmer {
    0%, 100% { filter: drop-shadow(0 0 2px hsl(40 90% 55% / 0.3)); }
    50% { filter: drop-shadow(0 0 5px hsl(40 90% 55% / 0.5)); }
}

.control-point.selected {
    fill: hsl(40 90% 55%);
    stroke: hsl(var(--background));
}

.control-point:active {
    cursor: grabbing;
}
</style>
