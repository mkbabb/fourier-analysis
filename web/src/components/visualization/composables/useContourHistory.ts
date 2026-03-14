import { ref, type Ref } from "vue";
import type { Point2D } from "@/lib/contourEditing";

export function useContourHistory(points: Ref<Point2D[]>) {
    const history = ref<Point2D[][]>([]);
    const historyIndex = ref(-1);

    function pushHistory() {
        const snapshot = points.value.map((p) => ({ ...p }));
        history.value = history.value.slice(0, historyIndex.value + 1);
        history.value.push(snapshot);
        historyIndex.value = history.value.length - 1;
    }

    function undo() {
        if (historyIndex.value <= 0) return;
        historyIndex.value--;
        points.value = history.value[historyIndex.value].map((p) => ({ ...p }));
    }

    function redo() {
        if (historyIndex.value >= history.value.length - 1) return;
        historyIndex.value++;
        points.value = history.value[historyIndex.value].map((p) => ({ ...p }));
    }

    function initHistory(pts: Point2D[]) {
        history.value = [pts.map((p) => ({ ...p }))];
        historyIndex.value = 0;
    }

    const canUndo = () => historyIndex.value > 0;
    const canRedo = () => historyIndex.value < history.value.length - 1;

    return { pushHistory, undo, redo, initHistory, canUndo, canRedo, historyIndex };
}
