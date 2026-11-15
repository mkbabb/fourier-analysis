import { ref, type Ref } from "vue";
import type { Point2D } from "@/lib/contourEditing";

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

export function usePointDrag(
    points: Ref<Point2D[]>,
    magnetRadius: Ref<number>,
    svgPoint: (e: PointerEvent) => Point2D,
    onDragEnd: () => void,
    /** LAST-TEN F-03: the stage's data rectangle. A point dragged past the
     *  stage edge stops at the edge and slides along it; it is never dropped
     *  outside the image. */
    bounds: () => DragBounds | null = () => null,
) {
    const dragging = ref(false);
    const selectedIdx = ref<number | null>(null);
    let dragStartIdx: number | null = null;
    /** The point's offset from the pointer at the press, so the point keeps
     *  that offset wherever the pointer goes (and re-syncs after the edge). */
    let grab: Point2D | null = null;
    // X.F.W14U.vedit — UIA-F-242: a press that never moves is a selection, not
    // an edit; only a drag that moved a point ends in a history snapshot.
    let moved = false;

    function onPointPointerDown(idx: number, e: PointerEvent) {
        e.preventDefault();
        e.stopPropagation();
        selectedIdx.value = idx;
        dragStartIdx = idx;
        // The drag keeps the press's offset from the point, so a press beside
        // a point (inside its target floor) moves it without a jump.
        const at = svgPoint(e);
        const p = points.value[idx];
        grab = { x: p.x - at.x, y: p.y - at.y };
        dragging.value = true;
        moved = false;
        // The press may land on the surface near the point (the editor picks
        // the nearest point within its target floor), so the capture is taken
        // by the element the handler is bound to.
        ((e.currentTarget ?? e.target) as Element).setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
        if (!dragging.value || dragStartIdx === null || !grab) return;
        const pt = svgPoint(e);
        const box = bounds();
        const p = points.value[dragStartIdx];
        const target = clampToBounds({ x: pt.x + grab.x, y: pt.y + grab.y }, box);
        const dx = target.x - p.x;
        const dy = target.y - p.y;
        if (dx === 0 && dy === 0) return;
        moved = true;

        points.value[dragStartIdx] = target;

        const n = points.value.length;
        const radius = magnetRadius.value;
        if (radius > 0) {
            for (let offset = 1; offset <= radius; offset++) {
                const falloff = 1 - offset / (radius + 1);
                const before = (dragStartIdx - offset + n) % n;
                const after = (dragStartIdx + offset) % n;
                points.value[before] = clampToBounds({
                    x: points.value[before].x + dx * falloff,
                    y: points.value[before].y + dy * falloff,
                }, box);
                points.value[after] = clampToBounds({
                    x: points.value[after].x + dx * falloff,
                    y: points.value[after].y + dy * falloff,
                }, box);
            }
        }
    }

    function onPointerUp() {
        if (dragging.value && dragStartIdx !== null && moved) {
            onDragEnd();
        }
        dragging.value = false;
        dragStartIdx = null;
        grab = null;
        moved = false;
    }

    function deselect() {
        selectedIdx.value = null;
    }

    return { dragging, selectedIdx, onPointPointerDown, onPointerMove, onPointerUp, deselect };
}
