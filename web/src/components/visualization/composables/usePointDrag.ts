import { ref, type Ref } from "vue";
import type { Point2D } from "@/lib/contourEditing";

export function usePointDrag(
    points: Ref<Point2D[]>,
    magnetRadius: Ref<number>,
    svgPoint: (e: PointerEvent) => Point2D,
    onDragEnd: () => void,
) {
    const dragging = ref(false);
    const selectedIdx = ref<number | null>(null);
    let dragStartIdx: number | null = null;
    let dragPrevPt: Point2D | null = null;

    function onPointPointerDown(idx: number, e: PointerEvent) {
        e.preventDefault();
        e.stopPropagation();
        selectedIdx.value = idx;
        dragStartIdx = idx;
        dragPrevPt = { ...points.value[idx] };
        dragging.value = true;
        (e.target as Element).setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
        if (!dragging.value || dragStartIdx === null || !dragPrevPt) return;
        const pt = svgPoint(e);
        const dx = pt.x - dragPrevPt.x;
        const dy = pt.y - dragPrevPt.y;

        points.value[dragStartIdx] = pt;

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
            onDragEnd();
        }
        dragging.value = false;
        dragStartIdx = null;
    }

    function deselect() {
        selectedIdx.value = null;
    }

    return { dragging, selectedIdx, onPointPointerDown, onPointerMove, onPointerUp, deselect };
}
