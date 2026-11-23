<script setup lang="ts">
import type { EditorState } from "./lib/editor-state";
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useId, watch, type Ref } from "vue";
import { useMediaQuery, useResizeObserver } from "@vueuse/core";
import type { ContourAsset } from "@/lib/types";
import {
    alignClosed,
    blendClosed,
    closedPolylinePath,
    closedSplinePath,
    handleStations,
    nearestSegmentIndex,
    projectOntoSegment,
    reachSamples,
    removedPoints,
    sampleClosedSpline,
    simplifyClosedPoints,
    smoothClosedPoints,
    zipPoints,
    unzipPoints,
    type Point2D,
} from "@/lib/contourEditing";
import { overlayUrl } from "@/lib/api";
import { cssCubicBezier } from "@/lib/easings";
import { useImageSources } from "@/composables/useImageSources";
import { useWorkspaceStore } from "@/stores/workspace";
import { useContourHistory } from "./composables/useContourHistory";
import { usePointDrag } from "./composables/usePointDrag";
import { useStageGestures } from "./composables/useStageGestures";
import { IDENTITY_VIEW, type StageView } from "./lib/stage-view";

const props = defineProps<{
    contour: ContourAsset;
    imageSlug: string | null;
    showImageOverlay?: boolean;
    /** The extraction's own outline under the edit (the dock's Contour trace). */
    showGhost?: boolean;
}>();

const emit = defineEmits<{
    stateChange: [state: EditorState];
    save: [points: { x: number[]; y: number[] }];
}>();

const MARGIN = 0.15;

/*
 * The editor's measures, all in screen pixels, so a handle, a target and a
 * bend are the same size on screen at every zoom and every sample density.
 */
/** A handle's disc radius (a 9 px disc; UIA-F-87). */
const HANDLE_PX = 4.5;
/** The nearest handle starts to show when the pointer is this close. */
const APPROACH_PX = 56;
/** Handles along the curve stand at least this far apart, and a quarter of
 *  the reach apart when that is more: about four each side at every Magnet
 *  setting, so their spacing shows the reach and a long reach is not a mat. */
const STATION_PX = 14;
/** The selection ring: at a mouse it hugs the handle; under a finger it is
 *  wide enough to show round the fingertip. */
const RING_PX = 9.5;
const RING_COARSE_PX = 26;
/** A held point returns to where it was grabbed inside this distance. */
const SNAP_PX = 6;
/** One step of the Magnet: this much more of the curve, each side. */
const REACH_STEP_PX = 16;
/** A scene change (Smooth, Simplify, Reset, Undo, Redo) travels for this long. */
const TRAVEL_MS = 240;
/**
 * ...on the house's standard ease (glass's `--ease-standard`, the curve a
 * thing moving across the screen takes). A cubic-out put half the way in the
 * first 40 ms, so Undo read as a jump and a settle (PR 33 frames: 47 % of the
 * change in one frame); this one answers within 100 ms and spreads the way.
 */
const travelEase = cssCubicBezier(0.4, 0, 0.2, 1);

const isCoarse = useMediaQuery("(pointer: coarse)");
const hitPx = computed(() => (isCoarse.value ? 22 : 12));
const ringPx = computed(() => (isCoarse.value ? RING_COARSE_PX : RING_PX));
const prefersReduced = useMediaQuery("(prefers-reduced-motion: reduce)");

const wStore = useWorkspaceStore();

// ── State ──
/** The curve on screen. Never mutated: every edit and every frame is a new array. */
const points = shallowRef<Point2D[]>([]);
const svgRef = ref<SVGSVGElement | null>(null);
const shellRef = ref<HTMLDivElement | null>(null);
/** The surface's box in CSS pixels; the SVG's user unit is one of them. */
const size = shallowRef({ w: 1, h: 1 });
/** The zoom and pan over the fit (the stage's own view type). */
const view = shallowRef<StageView>({ ...IDENTITY_VIEW });
/** A mouse or pen over the surface, in data coordinates. */
const pointerAt = shallowRef<Point2D | null>(null);
const sceneId = useId();

/** The Magnet, 0 (off) to 10: each step carries 16 px more of the curve, each
 *  side. The default (96 px) turns a first pull into a hill, not a nose. */
const magnetRadius = ref(6);

const { pushHistory, amendHistory, undo, redo, initHistory, canUndo, canRedo } = useContourHistory();
/** A run of keyboard nudges on one point is one history step. */
let nudged: { index: number; at: number } | null = null;

// Stable bounds — computed from the contour as loaded, not the live points
const stableBounds = ref({ minX: 0, maxX: 1, minY: 0, maxY: 1, width: 1, height: 1 });

// ── The view: fit, then zoom and pan ──
const fit = computed(() => {
    const b = stableBounds.value;
    const { w, h } = size.value;
    const s = Math.min(w / (b.width * (1 + MARGIN * 2)), h / (b.height * (1 + MARGIN * 2)));
    return { s: s > 0 ? s : 1, cx: (b.minX + b.maxX) / 2, cy: (b.minY + b.maxY) / 2 };
});
/** Data to screen: x' = S·x + tx, y' = −S·y + ty. */
const xf = computed(() => {
    const { s, cx, cy } = fit.value;
    const { w, h } = size.value;
    const v = view.value;
    return { S: s * v.k, tx: (w / 2 - cx * s) * v.k + v.x, ty: (h / 2 + cy * s) * v.k + v.y };
});
const sceneTransform = computed(() => {
    const { S, tx, ty } = xf.value;
    return `matrix(${S} 0 0 ${-S} ${tx} ${ty})`;
});

let rect: DOMRect | null = null;
function surfaceRect(): DOMRect {
    return (rect ??= svgRef.value!.getBoundingClientRect());
}
useResizeObserver(svgRef, ([entry]) => {
    rect = null;
    const { width, height } = entry.contentRect;
    if (width > 0 && height > 0) size.value = { w: width, h: height };
});
// The first frame is already at the fit (the observer reports a frame later).
onMounted(() => {
    const r = svgRef.value?.getBoundingClientRect();
    if (r && r.width > 0 && r.height > 0) size.value = { w: r.width, h: r.height };
});

function toData(e: { clientX: number; clientY: number }): Point2D {
    const r = surfaceRect();
    const { S, tx, ty } = xf.value;
    return { x: (e.clientX - r.left - tx) / S, y: -(e.clientY - r.top - ty) / S };
}

/* The stage's own gestures, on the editor: one finger off the line pans with
   momentum, two pinch about their midpoint, the wheel and a trackpad pinch
   zoom about the cursor, the view rubber-bands and a double-tap off the line
   returns to the fit. A press on the line is the editor's (`claim`). */
const gestures = useStageGestures({
    el: svgRef as unknown as Ref<HTMLElement | undefined>,
    fadeEl: () => (svgRef.value as unknown as HTMLElement | null) ?? undefined,
    size: () => size.value,
    onChange: syncView,
    claim: onClaim,
    unclaim: onUnclaim,
    onDouble,
});
/** Where a mouse or pen last was, so the handle under it follows the view
 *  when the drawing moves beneath a still pointer (a wheel zoom, momentum). */
let hoverClient: { clientX: number; clientY: number } | null = null;
function syncView(): void {
    view.value = { ...gestures.getView() };
    if (hoverClient && !dragging.value) pointerAt.value = toData(hoverClient);
}

// ── The drag ──
const reachUnits = computed(() => (magnetRadius.value * REACH_STEP_PX) / xf.value.S);
const drag = usePointDrag(
    points,
    () => reachUnits.value,
    toData,
    () => {
        pushHistory(points.value);
        nudged = null;
    },
    () => dragBounds.value,
    () => SNAP_PX / xf.value.S,
);
const { selectedIdx, deselect } = drag;
const dragging = drag.dragging;
const atHome = drag.atHome;
const home = drag.home;

// ── A scene change travels (LAST-TEN F-13) ──
// Smooth, Simplify, Reset, Undo and Redo. The curve is its new form at once
// (a pick or a drag reads it), and the drawn line travels to it: both forms
// sampled along the curve at one count, aligned, and blended (240 ms, the
// standard ease), then the new form's own spline. A press mid-way lands the line
// at its end; a second change mid-way starts from where the line stands.
// Under reduced motion the old line fades out over the new one.
const MORPH_SAMPLES = 512;
const morph = shallowRef<{ from: Point2D[]; to: Point2D[]; leaving: string } | null>(null);
/** The travel's eased progress, 0 → 1. */
const morphT = ref(1);
let travelRaf = 0;
/** The curve as it stands (a travel only changes what is drawn). */
function current(): Point2D[] {
    return points.value;
}
/** The line as it is drawn this frame (mid-travel, the blend). */
function drawnSamples(): Point2D[] {
    const m = morph.value;
    return m ? blendClosed(m.from, m.to, morphT.value) : sampleClosedSpline(points.value, MORPH_SAMPLES);
}
/** Land a running travel at its end. */
function settle() {
    cancelAnimationFrame(travelRaf);
    morph.value = null;
    morphT.value = 1;
}
function travelTo(next: Point2D[]) {
    const from = drawnSamples();
    const leaving = splinePath.value;
    points.value = next;
    cancelAnimationFrame(travelRaf);
    morph.value = { from, to: alignClosed(sampleClosedSpline(next, MORPH_SAMPLES), from), leaving };
    morphT.value = 0;
    const t0 = performance.now();
    const step = (now: number) => {
        const t = Math.min(1, (now - t0) / TRAVEL_MS);
        morphT.value = travelEase(t);
        if (t < 1) travelRaf = requestAnimationFrame(step);
        else morph.value = null;
    };
    travelRaf = requestAnimationFrame(step);
}
onBeforeUnmount(() => {
    cancelAnimationFrame(travelRaf);
    cancelAnimationFrame(moveRaf);
    clearTimeout(removedTimer);
});

// Initialize from contour
function initFromContour() {
    settle();
    const pts = zipPoints(props.contour.points.x, props.contour.points.y);
    points.value = pts;
    initHistory(pts);
    deselect();
    nudged = null;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of pts) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    }
    stableBounds.value = { minX, maxX, minY, maxY, width: maxX - minX || 1, height: maxY - minY || 1 };
    gestures.reset(false);
    emitState();
}

watch(() => props.contour, initFromContour, { immediate: true });

const bounds = computed(() => stableBounds.value);

/* LAST-TEN F-03: a dragged point stays on the stage: inside the fitted
   extent, and inside the image's own rectangle (`image_bounds`, the
   authoritative data space) when the contour carries one. */
const dragBounds = computed(() => {
    const b = bounds.value;
    const padX = b.width * MARGIN;
    const padY = b.height * MARGIN;
    const stage = { minX: b.minX - padX, maxX: b.maxX + padX, minY: b.minY - padY, maxY: b.maxY + padY };
    const ib = props.contour.image_bounds;
    if (!ib) return stage;
    return {
        minX: Math.max(stage.minX, ib.minX),
        maxX: Math.min(stage.maxX, ib.maxX),
        minY: Math.max(stage.minY, ib.minY),
        maxY: Math.min(stage.maxY, ib.maxY),
    };
});

// Spline path (mid-travel, the blend between the two forms)
const splinePath = computed(() => {
    const m = morph.value;
    if (m && !prefersReduced.value) return closedPolylinePath(blendClosed(m.from, m.to, morphT.value));
    return closedSplinePath(points.value);
});
/** Under reduced motion, the old line fading out over the new one. */
const leavingPath = computed(() => (morph.value && prefersReduced.value ? morph.value.leaving : null));

/* UIA-F-86: the dock's Contour trace acted on nothing here. On the editing
   surface it draws the saved outline under the edit, so every change reads
   against what it changes. */
/* O16 [52]: the path stays mounted and the toggle fades it (an exit is an
   animation too); `showGhost` drives its opacity, not its presence. */
const referencePath = computed(() =>
    closedSplinePath(zipPoints(props.contour.points.x, props.contour.points.y)),
);

const handleR = computed(() => HANDLE_PX / xf.value.S);
const ringR = computed(() => ringPx.value / xf.value.S);

/** The sample nearest `at`, and how far it is on screen. */
function nearestSample(at: Point2D): { index: number; px: number } | null {
    const pts = points.value;
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < pts.length; i++) {
        const dx = pts[i].x - at.x;
        const dy = pts[i].y - at.y;
        const d = dx * dx + dy * dy;
        if (d < bestD) {
            bestD = d;
            best = i;
        }
    }
    return best < 0 ? null : { index: best, px: Math.sqrt(bestD) * xf.value.S };
}

/** What a press at `at` would pick. Under a finger the selection's ring is
 *  its grab: a press anywhere inside it takes the selected point, so it can be
 *  pulled from beside and stays in sight. Otherwise, the nearest sample inside
 *  the target floor. */
function pick(at: Point2D): number | null {
    const sel = selectedIdx.value;
    const p = sel === null ? undefined : points.value[sel];
    if (isCoarse.value && sel !== null && p && Math.hypot(p.x - at.x, p.y - at.y) * xf.value.S <= ringPx.value + 4) {
        return sel;
    }
    const n = nearestSample(at);
    return n && n.px <= hitPx.value ? n.index : null;
}

// ── What is painted as handles ──
const near = computed(() => (pointerAt.value && !dragging.value ? nearestSample(pointerAt.value) : null));
/** The point a press would pick right now. */
const hotIdx = computed(() => {
    const n = near.value;
    return n && n.px <= hitPx.value ? n.index : null;
});
/** The nearest handle, coming to meet the pointer before it is in reach. */
const approach = computed(() => {
    const n = near.value;
    if (!n || n.px <= hitPx.value || n.px > APPROACH_PX) return null;
    const p = points.value[n.index];
    return { x: p.x, y: p.y, o: 0.55 * (1 - (n.px - hitPx.value) / (APPROACH_PX - hitPx.value)) };
});

const stationGapPx = computed(() => Math.max(STATION_PX, (magnetRadius.value * REACH_STEP_PX) / 4));
const stations = computed(() => handleStations(points.value, stationGapPx.value / xf.value.S));
/** The handles of a drag in progress: fixed at the press. */
let heldBeads: { index: number; o: number }[] | null = null;
function beadsAround(index: number): { index: number; o: number }[] {
    const pts = points.value;
    if (!pts[index]) return [];
    const mask = stations.value;
    const S = xf.value.S;
    const out: { index: number; o: number }[] = [];
    for (const s of reachSamples(pts, index, reachUnits.value)) {
        if (s.along === 0 || !mask[s.index]) continue;
        // A station fades out as it nears the active point's ring (under a
        // finger the ring is wide, and nothing is painted inside it).
        const clear = Math.min(1, Math.max(0, (Math.abs(s.along) * S - ringPx.value) / STATION_PX));
        if (clear > 0) out.push({ index: s.index, o: 0.85 * s.weight * clear });
    }
    return out;
}
/** The handles along the reach of the active point: the one held, else the
 *  one under the pointer, else the selection. Each shows its share of a drag. */
const beads = computed(() => {
    const pts = points.value;
    const list = dragging.value && heldBeads ? heldBeads : beadsAround(hotIdx.value ?? selectedIdx.value ?? -1);
    return list.map((b) => ({ key: b.index, x: pts[b.index].x, y: pts[b.index].y, o: b.o }));
});
const hotPoint = computed(() => (hotIdx.value !== null && hotIdx.value !== selectedIdx.value ? points.value[hotIdx.value] : null));
const selectedPoint = computed(() => (selectedIdx.value !== null ? (points.value[selectedIdx.value] ?? null) : null));

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
// X·F F-D5: the overlay passes the read gate with the session.
const imageSource = useImageSources(() => [overlayHref.value]);

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

function emitState() {
    emit("stateChange", {
        canUndo: canUndo(),
        canRedo: canRedo(),
        canDelete: selectedIdx.value !== null,
        pointCount: current().length,
    });
}

/** A new curve: one history step, and the line travels to it. */
function commit(next: Point2D[]) {
    pushHistory(next);
    nudged = null;
    travelTo(next);
    emitState();
}

function doUndo() {
    const prev = undo();
    if (!prev) return;
    deselect();
    nudged = null;
    travelTo(prev);
    emitState();
}

function doRedo() {
    const next = redo();
    if (!next) return;
    deselect();
    nudged = null;
    travelTo(next);
    emitState();
}

// ── Pointer ──
let pressAt = 0;
let lastLineTap: { t: number; x: number; y: number } | null = null;
let lastAddAt = -Infinity;

/** The view's gestures ask: is this press the editor's? It is when it lands
 *  on the line (or on the selection's ring). */
function onClaim(e: PointerEvent): boolean {
    rect = null;
    settle();
    const at = toData(e);
    const idx = pick(at);
    if (idx === null) {
        if (selectedIdx.value !== null) {
            deselect();
            emitState();
        }
        return false;
    }
    heldBeads = beadsAround(idx);
    pressAt = performance.now();
    drag.onPointPointerDown(idx, e);
    // The drag's `preventDefault` suppresses the compatibility mousedown, and
    // with it the browser's focus move; the editing surface takes focus
    // itself so its shortcuts follow the point the user just picked.
    shellRef.value?.focus({ preventScroll: true });
    emitState();
    return true;
}

/** A second finger: the pair is the view's pinch. A drag that had barely
 *  begun goes back; one that was already an edit stays (Undo has it). */
function onUnclaim() {
    const wasEdit = performance.now() - pressAt > 250 && drag.travelled() * xf.value.S >= 12;
    drag.handBack(wasEdit);
    heldBeads = null;
    lastLineTap = null;
    emitState();
}

// One write per frame, however many pointer events arrive in it.
let moveRaf = 0;
let pendingMove: PointerEvent | null = null;
function onSurfacePointerMove(e: PointerEvent) {
    pendingMove = e;
    if (moveRaf) return;
    moveRaf = requestAnimationFrame(() => {
        moveRaf = 0;
        const ev = pendingMove;
        pendingMove = null;
        if (!ev) return;
        if (dragging.value) drag.onPointerMove(ev);
        else if (ev.pointerType !== "touch") {
            hoverClient = { clientX: ev.clientX, clientY: ev.clientY };
            pointerAt.value = toData(ev);
        }
    });
}

function onSurfacePointerEnter() {
    rect = null;
}

function onSurfacePointerLeave() {
    hoverClient = null;
    pointerAt.value = null;
}

function onSurfacePointerUp(e: PointerEvent) {
    if (!dragging.value) return;
    // The last move of the gesture lands before the release reads the curve.
    if (pendingMove) {
        cancelAnimationFrame(moveRaf);
        moveRaf = 0;
        drag.onPointerMove(pendingMove);
        pendingMove = null;
    }
    const tap = home.value === null;
    drag.onPointerUp();
    heldBeads = null;
    // Two taps on the line, close in time and place, add a point there.
    if (tap && e.type === "pointerup" && e.pointerType !== "mouse") {
        const now = performance.now();
        if (lastLineTap && now - lastLineTap.t < 300 && Math.hypot(e.clientX - lastLineTap.x, e.clientY - lastLineTap.y) < 24) {
            lastLineTap = null;
            addPointAt(toData(e));
        } else {
            lastLineTap = { t: now, x: e.clientX, y: e.clientY };
        }
    }
    emitState();
}

/** A double-click or double-tap: on the line it adds a point, on the line
 *  itself (the press is dropped onto its segment); anywhere else the view
 *  returns to the fit (the gestures' own answer). */
function onDouble(e: MouseEvent | PointerEvent): boolean {
    const at = toData(e);
    const n = nearestSample(at);
    if (!n || n.px > hitPx.value) return false;
    addPointAt(at);
    return true;
}

function addPointAt(at: Point2D) {
    // A touch double-tap can arrive twice (the taps, then the browser's dblclick).
    const now = performance.now();
    if (now - lastAddAt < 400) return;
    lastAddAt = now;
    settle();
    const pts = points.value;
    const idx = nearestSegmentIndex(pts, at);
    const n = pts.length;
    const on = projectOntoSegment(at, pts[(idx - 1 + n) % n], pts[idx % n]);
    const next = [...pts.slice(0, idx), on, ...pts.slice(idx)];
    points.value = next;
    selectedIdx.value = idx;
    pushHistory(next);
    nudged = null;
    emitState();
}

// ── Keyboard ──

function stepSelection(dir: 1 | -1, fine: boolean) {
    const pts = current();
    const n = pts.length;
    if (n === 0) return;
    const sel = selectedIdx.value;
    if (sel === null) {
        // The first press picks the top of the curve.
        let top = 0;
        for (let i = 1; i < n; i++) if (pts[i].y > pts[top].y) top = i;
        selectedIdx.value = top;
        return;
    }
    if (fine) {
        selectedIdx.value = (sel + dir + n) % n;
        return;
    }
    const mask = stations.value;
    for (let step = 1; step <= n; step++) {
        const i = (((sel + dir * step) % n) + n) % n;
        if (mask[i]) {
            selectedIdx.value = i;
            return;
        }
    }
}

function nudge(dxPx: number, dyPx: number) {
    const sel = selectedIdx.value;
    if (sel === null) return;
    settle();
    const pts = points.value;
    const S = xf.value.S;
    const dx = dxPx / S;
    const dy = -dyPx / S;
    const box = dragBounds.value;
    const next = pts.slice();
    for (const s of reachSamples(pts, sel, reachUnits.value)) {
        const b = pts[s.index];
        next[s.index] = {
            x: Math.min(box.maxX, Math.max(box.minX, b.x + dx * s.weight)),
            y: Math.min(box.maxY, Math.max(box.minY, b.y + dy * s.weight)),
        };
    }
    points.value = next;
    const now = performance.now();
    if (nudged && nudged.index === sel && now - nudged.at < 1000) amendHistory(next);
    else pushHistory(next);
    nudged = { index: sel, at: now };
    emitState();
}

const ARROWS: Record<string, [number, number]> = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
};

function onKeyDown(e: KeyboardEvent) {
    const arrow = ARROWS[e.key];
    if (arrow && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (e.shiftKey) {
            // Shift moves the point: 1 px, or 10 with Alt.
            const by = e.altKey ? 10 : 1;
            nudge(arrow[0] * by, arrow[1] * by);
        } else {
            // An arrow moves the selection along the curve, handle to handle
            // (Alt: sample to sample).
            stepSelection(arrow[0] + arrow[1] > 0 ? 1 : -1, e.altKey);
            emitState();
        }
        return;
    }
    if (e.key === "Escape" && selectedIdx.value !== null) {
        // One Escape closes one surface: here, the selection.
        e.preventDefault();
        e.stopPropagation();
        deselect();
        emitState();
        return;
    }
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
    const pts = current();
    const sel = selectedIdx.value;
    if (sel === null || pts.length <= 3) return;
    deselect();
    commit([...pts.slice(0, sel), ...pts.slice(sel + 1)]);
}

function applySmooth() {
    deselect();
    commit(smoothClosedPoints(current()));
}

/* Simplify keeps the shape, so the line has nothing to travel: what it took
   shows instead, as the removed points fading where they stood. */
const removed = shallowRef<{ key: number; d: string } | null>(null);
let removedTimer = 0;
function applySimplify() {
    const before = current();
    const next = simplifyClosedPoints(before);
    if (next === before) return;
    deselect();
    const gone = removedPoints(before, next);
    removed.value = {
        key: (removed.value?.key ?? 0) + 1,
        d: gone.map((p) => `M${p.x},${p.y}h0.001`).join(""),
    };
    clearTimeout(removedTimer);
    removedTimer = window.setTimeout(() => (removed.value = null), 900);
    commit(next);
}

/* UIA-F-180: Reset wiped the undo history with no confirmation. It is an
   edit like any other now — one history step, so Undo brings the work back. */
function resetToExtraction() {
    deselect();
    commit(zipPoints(props.contour.points.x, props.contour.points.y));
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
    return unzipPoints(current());
}

/** The view is zoomed or panned off the fit; `resetView` returns it (as a
 *  double-tap off the line does). */
const viewMoved = gestures.moved;
function resetView(): void {
    gestures.reset();
}

/* The grid is the paper under the drawing: it moves and scales with the view. */
const gridStyle = computed(() => ({
    "--grid": `${28 * view.value.k}px`,
    "--grid-x": `${view.value.x}px`,
    "--grid-y": `${view.value.y}px`,
}));

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
    viewMoved,
    resetView,
});
</script>

<template>
    <div ref="shellRef" class="editor-shell" tabindex="0" :style="gridStyle" @keydown="onKeyDown">
        <svg
            ref="svgRef"
            :viewBox="`0 0 ${size.w} ${size.h}`"
            class="editor-svg"
            :class="{ 'is-hot': hotIdx !== null, 'is-dragging': dragging }"
            @pointerenter="onSurfacePointerEnter"
            @pointermove="onSurfacePointerMove"
            @pointerleave="onSurfacePointerLeave"
            @pointerup="onSurfacePointerUp"
            @pointercancel="onSurfacePointerUp"
        >
            <!-- The scene, in data coordinates (y up): the fit, then the view. -->
            <g :id="sceneId" :transform="sceneTransform">
                <!-- Image overlay — positioned using authoritative image_bounds.
                     Mounted with its source; the layer's toggle fades it. -->
                <image
                    v-if="imageSource(overlayHref) && imageOverlayRect"
                    :href="imageSource(overlayHref)"
                    :x="imageOverlayRect.x"
                    :y="imageOverlayRect.y"
                    :width="imageOverlayRect.w"
                    :height="imageOverlayRect.h"
                    :transform="`translate(0, ${imageOverlayRect.y * 2 + imageOverlayRect.h}) scale(1, -1)`"
                    class="overlay-image"
                    :class="{ 'is-shown': showImageOverlay }"
                    preserveAspectRatio="xMidYMid meet"
                />

                <!-- UIA-F-86: the saved outline, under the edit -->
                <path
                    :d="referencePath"
                    fill="none"
                    stroke="var(--foreground)"
                    stroke-width="1.5"
                    stroke-dasharray="5 5"
                    vector-effect="non-scaling-stroke"
                    class="reference-trace"
                    :class="{ 'is-shown': showGhost }"
                    :data-shown="showGhost ? '' : undefined"
                />

                <!-- Under reduced motion, the replaced line fading out -->
                <path
                    v-if="leavingPath"
                    :d="leavingPath"
                    fill="none"
                    stroke="var(--contour-stroke)"
                    :stroke-opacity="0.85 * (1 - morphT)"
                    stroke-width="3"
                    vector-effect="non-scaling-stroke"
                    class="spline-path-leaving"
                />
                <!-- Spline path -->
                <path
                    :d="splinePath"
                    fill="none"
                    stroke="var(--contour-stroke)"
                    :stroke-opacity="leavingPath ? 0.85 * morphT : 0.85"
                    stroke-width="3"
                    vector-effect="non-scaling-stroke"
                    class="spline-path"
                />

                <!-- Simplify: the points it took, fading where they stood. -->
                <path
                    v-if="removed"
                    :key="removed.key"
                    :d="removed.d"
                    vector-effect="non-scaling-stroke"
                    class="removed-points"
                />

                <!-- The reach: handles at their stations along the curve, each
                     as strong as its share of a drag. Only these are mounted
                     (a dozen, not one per sample). -->
                <TransitionGroup name="handle">
                    <circle
                        v-for="b in beads"
                        :key="b.key"
                        :cx="b.x"
                        :cy="b.y"
                        :r="handleR"
                        vector-effect="non-scaling-stroke"
                        class="control-point is-bead"
                        :style="{ '--o': b.o }"
                    />
                </TransitionGroup>

                <!-- The nearest handle, coming to meet the pointer. -->
                <circle
                    v-if="approach"
                    :cx="approach.x"
                    :cy="approach.y"
                    :r="handleR"
                    vector-effect="non-scaling-stroke"
                    class="control-point is-bead"
                    :style="{ '--o': approach.o }"
                />

                <!-- Where the held point was grabbed: bring it back here and it
                     returns exactly. -->
                <Transition name="handle">
                    <circle
                        v-if="home"
                        :cx="home.x"
                        :cy="home.y"
                        :r="handleR"
                        vector-effect="non-scaling-stroke"
                        class="home-mark"
                        :class="{ 'is-met': atHome }"
                    />
                </Transition>

                <!-- The point a press would pick. -->
                <Transition name="handle">
                    <circle
                        v-if="hotPoint"
                        :cx="hotPoint.x"
                        :cy="hotPoint.y"
                        :r="handleR"
                        vector-effect="non-scaling-stroke"
                        class="control-point is-hot"
                    />
                </Transition>

                <!-- The selection, always painted, inside its ring. -->
                <Transition name="handle">
                    <g v-if="selectedPoint" class="selection">
                        <circle
                            :cx="selectedPoint.x"
                            :cy="selectedPoint.y"
                            :r="ringR"
                            vector-effect="non-scaling-stroke"
                            class="selection-ring"
                            :class="{ 'is-held': dragging, 'is-home': atHome }"
                        />
                        <circle
                            :cx="selectedPoint.x"
                            :cy="selectedPoint.y"
                            :r="handleR"
                            vector-effect="non-scaling-stroke"
                            class="control-point selected"
                        />
                    </g>
                </Transition>
            </g>

        </svg>
    </div>
</template>

<style scoped>
/* O16 [52]: the original outline fades in and out with its View layers toggle,
   in the page's ink, dashed, over the edit; reduced motion keeps the fade. */
.reference-trace {
    stroke-opacity: 0;
    pointer-events: none;
    transition: stroke-opacity var(--duration-normal, 280ms) var(--ease-standard, ease);
}
.reference-trace.is-shown {
    stroke-opacity: 0.6;
}
/* The picture fades with its layer toggle too (it was mounted and unmounted,
   a cut). */
.overlay-image {
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--duration-normal, 280ms) var(--ease-standard, ease);
}
/* The stage's wash (FORTY-FIRST K): a bit lighter than it was. */
.overlay-image.is-shown {
    opacity: 0.22;
}
@media (prefers-reduced-motion: reduce) {
    .reference-trace,
    .overlay-image { transition-duration: 120ms; }
}
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
    /* The grid is the paper: it rides the view (`--grid*`, set by the editor). */
    background:
        linear-gradient(color-mix(in srgb, var(--foreground) 5%, transparent) 1px, transparent 1px),
        linear-gradient(90deg, color-mix(in srgb, var(--foreground) 5%, transparent) 1px, transparent 1px),
        var(--card);
    background-size: var(--grid, 28px) var(--grid, 28px), var(--grid, 28px) var(--grid, 28px), auto;
    background-position: var(--grid-x, 0) var(--grid-y, 0), var(--grid-x, 0) var(--grid-y, 0), 0 0;
}

.editor-svg {
    width: 100%;
    height: 100%;
    display: block;
    cursor: crosshair;
    /* The editor owns every gesture over it, as the stage does (LAST-TEN
       F-01): the browser neither takes a drag back nor zooms the page. */
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
}
.editor-svg.is-hot {
    cursor: grab;
}
.editor-svg.is-dragging {
    cursor: grabbing;
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

/* UIA-F-87 ⊕ F-242: one handle register. The one a press would pick is
   filled; the handles along its reach are as strong as their share of a drag. */
.control-point {
    fill: var(--contour-stroke);
    fill-opacity: 0.45;
    stroke: var(--contour-stroke);
    stroke-width: 1.5;
    pointer-events: none;
    transition: opacity 0.15s var(--ease-standard), fill-opacity 0.15s var(--ease-standard);
}
.control-point.is-bead {
    opacity: var(--o, 1);
}
.control-point.is-hot {
    fill-opacity: 1;
}
.control-point.selected {
    fill: var(--contour-stroke);
    fill-opacity: 1;
    stroke: var(--background);
    stroke-width: 2;
}

/* A handle arrives and leaves on a fade, at every motion setting (it used to
   cut under reduced motion). */
.handle-enter-active,
.handle-leave-active {
    transition: opacity 0.15s var(--ease-standard);
}
.control-point.handle-enter-from,
.control-point.handle-leave-to,
.handle-enter-from,
.handle-leave-to {
    opacity: 0;
}

.selection-ring {
    fill: none;
    stroke: var(--contour-stroke);
    stroke-width: 2;
    pointer-events: none;
    transform-box: fill-box;
    transform-origin: center;
    transition:
        transform 0.18s var(--ease-standard),
        stroke 0.15s var(--ease-standard);
}
/* Under a finger the ring is wide (26 px), so it is drawn thinner. */
@media (pointer: coarse) {
    .selection-ring { stroke-width: 1.5; }
}
/* Held: the ring opens a little, the press's answer. */
.selection-ring.is-held {
    transform: scale(1.12);
}
/* Home: the ring takes the page's ink while the point sits where it was. */
.selection-ring.is-home {
    stroke: var(--foreground);
}

.home-mark {
    fill: none;
    stroke: var(--foreground);
    stroke-opacity: 0.55;
    stroke-width: 1.5;
    pointer-events: none;
    transition: stroke-opacity 0.15s var(--ease-standard);
}
.home-mark.is-met {
    stroke-opacity: 0;
}

.removed-points {
    fill: none;
    stroke: var(--contour-stroke);
    stroke-width: 4;
    stroke-linecap: round;
    pointer-events: none;
    animation: removed-out 0.7s var(--ease-standard) forwards;
}
@keyframes removed-out {
    from { opacity: 0.9; stroke-width: 5; }
    to { opacity: 0; stroke-width: 1.5; }
}

@media (prefers-reduced-motion: reduce) {
    .control-point,
    .handle-enter-active,
    .handle-leave-active {
        transition-duration: 120ms;
    }
    .selection-ring { transition: stroke 120ms var(--ease-standard); }
    .selection-ring.is-held { transform: none; }
    @keyframes removed-out {
        from { opacity: 0.9; }
        to { opacity: 0; }
    }
}

/* X-DS pass 1 · F1-02 — the spline's drop-shadow glow and the infinite
   hover shimmer that pulsed it are DELETED. The path is a flat stroke. */
</style>
