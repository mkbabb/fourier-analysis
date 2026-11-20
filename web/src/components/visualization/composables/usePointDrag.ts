import { ref, shallowRef, type Ref } from "vue";
import { reachSamples, type Point2D, type ReachSample } from "@/lib/contourEditing";

/** The rectangle, in data coordinates, a dragged point may not leave. */
export interface DragBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}

/** `p` held inside `b` (each axis clamped on its own, so a point slides along the edge). */
export function clampToBounds(p: Point2D, b: DragBounds | null): Point2D {
    if (!b) return p;
    return {
        x: Math.min(b.maxX, Math.max(b.minX, p.x)),
        y: Math.min(b.maxY, Math.max(b.minY, p.y)),
    };
}

/**
 * One point's drag. The curve at the press is kept whole (`base`) and every
 * frame is that curve plus the pointer's travel, weighted along the reach, so
 * a drag never accumulates rounding, a second finger can hand the curve back
 * untouched, and Undo has one clean step. The point arrays are never mutated:
 * each frame is a new array, so the history may keep them by reference.
 */
export function usePointDrag(
    points: Ref<Point2D[]>,
    /** How far along the curve a drag carries its neighbours, in the points'
     *  unit (0: the point alone). The editor passes screen pixels over its scale. */
    reach: () => number,
    toPoint: (e: PointerEvent) => Point2D,
    onDragEnd: () => void,
    /** LAST-TEN F-03: the stage's data rectangle. A point dragged past the
     *  stage edge stops at the edge and slides along it; it is never dropped
     *  outside the image. */
    bounds: () => DragBounds | null = () => null,
    /** Brought back inside this distance of where it was grabbed, the point
     *  returns there exactly (the points' unit; 0: no snap). */
    snap: () => number = () => 0,
) {
    const dragging = ref(false);
    const selectedIdx = ref<number | null>(null);
    /** Where the held point was grabbed, once the drag has moved it. */
    const home = shallowRef<Point2D | null>(null);
    /** The held point is back on its home (the snap). */
    const atHome = ref(false);

    let base: Point2D[] | null = null;
    let carried: ReachSample[] = [];
    let idx: number | null = null;
    /** The point's offset from the pointer at the press, so the point keeps
     *  that offset wherever the pointer goes (and re-syncs after the edge). */
    let grab: Point2D | null = null;
    // A press that never moves is a selection, not an edit.
    let moved = false;
    /** The snap arms once the point has left its home's neighbourhood, so the
     *  first pixels of a drag are never swallowed. */
    let armed = false;
    let farthest = 0;

    function onPointPointerDown(i: number, e: PointerEvent) {
        e.preventDefault();
        e.stopPropagation();
        selectedIdx.value = i;
        idx = i;
        base = points.value;
        carried = reachSamples(base, i, reach());
        // The drag keeps the press's offset from the point, so a press beside
        // a point (inside its target floor) moves it without a jump.
        const at = toPoint(e);
        const p = base[i];
        grab = { x: p.x - at.x, y: p.y - at.y };
        dragging.value = true;
        moved = false;
        armed = false;
        farthest = 0;
        home.value = null;
        atHome.value = false;
        ((e.currentTarget ?? e.target) as Element).setPointerCapture?.(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
        if (!dragging.value || idx === null || !grab || !base) return;
        const at = toPoint(e);
        const box = bounds();
        const origin = base[idx];
        let target = clampToBounds({ x: at.x + grab.x, y: at.y + grab.y }, box);
        const away = Math.hypot(target.x - origin.x, target.y - origin.y);
        farthest = Math.max(farthest, away);
        const r = snap();
        if (r > 0 && away > r * 2) armed = true;
        const snapped = armed && away <= r;
        if (snapped) target = origin;
        const dx = target.x - origin.x;
        const dy = target.y - origin.y;
        if (!moved && dx === 0 && dy === 0) return;
        moved = true;
        home.value = origin;
        atHome.value = snapped;

        const next = base.slice();
        for (const s of carried) {
            const b = base[s.index];
            next[s.index] = clampToBounds({ x: b.x + dx * s.weight, y: b.y + dy * s.weight }, box);
        }
        points.value = next;
    }

    function end(commit: boolean) {
        if (dragging.value && moved && base) {
            // Dropped back on its home (or handed back): the curve is as it was.
            if (!commit || atHome.value) points.value = base;
            else onDragEnd();
        }
        dragging.value = false;
        idx = null;
        base = null;
        carried = [];
        grab = null;
        moved = false;
        home.value = null;
        atHome.value = false;
    }

    function onPointerUp() {
        end(true);
    }

    /** The gesture is taken away (a second finger: the view's pinch). The
     *  curve goes back unless the drag was already a real edit. */
    function handBack(keep: boolean) {
        end(keep);
    }

    function deselect() {
        selectedIdx.value = null;
    }

    return {
        dragging,
        selectedIdx,
        home,
        atHome,
        /** How far the held point has been from its home in this drag (the points' unit). */
        travelled: () => farthest,
        onPointPointerDown,
        onPointerMove,
        onPointerUp,
        handBack,
        deselect,
    };
}
