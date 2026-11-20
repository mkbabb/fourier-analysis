import { computed } from "vue";
import { useWorkspaceStore } from "@/stores/workspace";
import type { CanvasSurface } from "@/components/shared/canvas/useCanvasSetup";
import type { ViewTransform } from "../lib/canvas-drawing";

export interface Bbox {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}

/** The fit's free margin on each side, as a fraction of the drawing's size. */
export const FIT_MARGIN = 0.06;

/**
 * The fit of a box: centred in the stage's box above `insetBottom` (the foot
 * the bottom dock covers), with `FIT_MARGIN` of its size free on each side.
 * The drawing's fit, and the picture's while the first compute runs.
 */
export function fitTransform(bbox: Bbox, s: { width: number; height: number }, insetBottom = 0): ViewTransform {
    const { minX, maxX, minY, maxY } = bbox;
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const w = s.width;
    const h = Math.max(1, s.height - Math.max(0, insetBottom));
    const scale = Math.min(
        w / (rangeX * (1 + FIT_MARGIN * 2)),
        h / (rangeY * (1 + FIT_MARGIN * 2)),
    );
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    return {
        cx, cy, scale,
        toScreen(x: number, y: number): [number, number] {
            return [w / 2 + (x - cx) * scale, h / 2 - (y - cy) * scale];
        },
    };
}

export function useViewTransform() {
    const store = useWorkspaceStore();

    // ── Memoized data bounding box (Invariant 20) ──
    // The variadic `Math.min(...xs)` / `Math.max(...xs)` spread allocates an
    // arguments array of length n_points; at n=1024 that's four allocations of
    // ~1k elements every rAF, and at n≈10k the spread approaches V8's argument
    // count ceiling.  Hoist it into a `computed` keyed on the source-path
    // *identity* (`store.epicycleData` / `store.basesData`) — Vue re-evaluates
    // the bbox only when that identity changes (a new compute pass), never on
    // the per-frame `drawFrame` path.
    const dataBbox = computed<Bbox | null>(() => {
        let xs: number[];
        let ys: number[];
        if (store.epicycleData) {
            xs = store.epicycleData.path.x;
            ys = store.epicycleData.path.y;
        } else if (store.basesData) {
            xs = store.basesData.original.x;
            ys = store.basesData.original.y;
        } else {
            return null;
        }
        // Single linear scan — no variadic spread, no arguments array.
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let i = 0; i < xs.length; i++) {
            const x = xs[i];
            const y = ys[i];
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
        return { minX, maxX, minY, maxY };
    });

    /** The drawing's fit (`fitTransform`); the identity before there is a drawing. */
    function getViewTransform(s: CanvasSurface, insetBottom = 0): ViewTransform {
        const bbox = dataBbox.value;
        if (!bbox) return { cx: 0, cy: 0, scale: 1, toScreen: (x, y) => [x, y] };
        return fitTransform(bbox, s, insetBottom);
    }

    /** The drawing's size in its own units (the larger side of its box): the link's unit for the view's centre. */
    function extent(): number {
        const bbox = dataBbox.value;
        return bbox ? Math.max(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY) || 1 : 1;
    }

    return { getViewTransform, extent };
}
