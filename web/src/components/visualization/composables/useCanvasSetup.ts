import { type Ref, type ShallowRef, shallowRef, onMounted, onUnmounted } from "vue";
import type { CanvasSurface } from "../lib/canvas-drawing";

/**
 * Manages DPR-aware canvas initialization and ResizeObserver lifecycle.
 * Returns a reactive `surface` and a manual `setupCanvas()` trigger.
 */
export function useCanvasSetup(
    canvasRef: Ref<HTMLCanvasElement | undefined>,
    containerRef: Ref<HTMLDivElement | undefined>,
    onResize: (surface: CanvasSurface) => void,
): { surface: ShallowRef<CanvasSurface | null>; setupCanvas: () => void } {
    const surface = shallowRef<CanvasSurface | null>(null);
    let resizeObserver: ResizeObserver | null = null;

    function setupCanvas() {
        if (!canvasRef.value || !containerRef.value) return;
        const rect = containerRef.value.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const dpr = window.devicePixelRatio || 1;
        const width = rect.width;
        const height = rect.height;

        canvasRef.value.width = Math.round(width * dpr);
        canvasRef.value.height = Math.round(height * dpr);
        canvasRef.value.style.width = `${width}px`;
        canvasRef.value.style.height = `${height}px`;

        const ctx = canvasRef.value.getContext("2d")!;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const s: CanvasSurface = { ctx, width, height, dpr };
        surface.value = s;
        onResize(s);
    }

    onMounted(() => {
        setupCanvas();
        resizeObserver = new ResizeObserver(() => setupCanvas());
        if (containerRef.value) resizeObserver.observe(containerRef.value);
    });

    onUnmounted(() => {
        resizeObserver?.disconnect();
    });

    return { surface, setupCanvas };
}
