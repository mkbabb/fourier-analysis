import { ref } from "vue";
import type { Point2D } from "@/lib/contourEditing";

/**
 * The editor's history: whole curves, kept by reference. The editor never
 * mutates a point array (each edit is a new array), so a step costs one
 * pointer, and Undo and Redo hand back the very curve that was there for the
 * editor to travel to.
 */
export function useContourHistory() {
    // Plain, not reactive: a reactive wrapper would proxy every point read
    // while the editor builds its path. The editor reports its state itself.
    let history: Point2D[][] = [];
    const historyIndex = ref(-1);

    function pushHistory(points: Point2D[]) {
        history = history.slice(0, historyIndex.value + 1);
        history.push(points);
        historyIndex.value = history.length - 1;
    }

    /** Replace the present step (a run of keyboard nudges is one step). */
    function amendHistory(points: Point2D[]) {
        if (historyIndex.value >= 0) history[historyIndex.value] = points;
    }

    /** One step back: the curve to show, or null at the start. */
    function undo(): Point2D[] | null {
        if (historyIndex.value <= 0) return null;
        historyIndex.value--;
        return history[historyIndex.value];
    }

    /** One step forward: the curve to show, or null at the end. */
    function redo(): Point2D[] | null {
        if (historyIndex.value >= history.length - 1) return null;
        historyIndex.value++;
        return history[historyIndex.value];
    }

    function initHistory(points: Point2D[]) {
        history = [points];
        historyIndex.value = 0;
    }

    const canUndo = () => historyIndex.value > 0;
    const canRedo = () => historyIndex.value < history.length - 1;

    return { pushHistory, amendHistory, undo, redo, initHistory, canUndo, canRedo, historyIndex };
}
