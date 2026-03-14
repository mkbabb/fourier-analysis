import { useWorkspaceStore } from "@/stores/workspace";
import type { CanvasSurface, ViewTransform } from "../lib/canvas-drawing";

export function useViewTransform() {
    const store = useWorkspaceStore();

    function getViewTransform(s: CanvasSurface): ViewTransform {
        let xs: number[];
        let ys: number[];
        if (store.epicycleData) {
            xs = store.epicycleData.path.x;
            ys = store.epicycleData.path.y;
        } else if (store.basesData) {
            xs = store.basesData.original.x;
            ys = store.basesData.original.y;
        } else {
            const noop: ViewTransform = { cx: 0, cy: 0, scale: 1, toScreen: (x, y) => [x, y] };
            return noop;
        }

        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const rangeX = maxX - minX || 1;
        const rangeY = maxY - minY || 1;
        const margin = 0.15;
        const scale = Math.min(
            s.width / (rangeX * (1 + margin * 2)),
            s.height / (rangeY * (1 + margin * 2)),
        );
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const w = s.width;
        const h = s.height;

        return {
            cx, cy, scale,
            toScreen(x: number, y: number): [number, number] {
                return [w / 2 + (x - cx) * scale, h / 2 - (y - cy) * scale];
            },
        };
    }

    return { getViewTransform };
}
