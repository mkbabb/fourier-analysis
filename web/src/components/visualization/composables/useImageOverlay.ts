import { ref, watch } from "vue";
import { useWorkspaceStore } from "@/stores/workspace";
import type { CanvasSurface, ViewTransform } from "../lib/canvas-drawing";

const MAX_CACHE_SIZE = 10;

// Module-scoped cache survives component unmount/remount (e.g. gallery → visualizer)
const cache = new Map<string, HTMLImageElement>();

/**
 * Eagerly preloads the image overlay as soon as imageSlug is known.
 * Draws behind the epicycle animation using contour/path bounds,
 * preserving the image's natural aspect ratio (contain-fit).
 */
export function useImageOverlay(onImageLoaded?: () => void) {
    const store = useWorkspaceStore();
    const loading = ref(false);
    let currentImage: HTMLImageElement | null = null;

    watch(
        () => store.imageSlug,
        (slug) => {
            if (!slug) { currentImage = null; loading.value = false; return; }
            if (cache.has(slug)) {
                currentImage = cache.get(slug)!;
                loading.value = false;
                onImageLoaded?.();
                return;
            }
            currentImage = null;
            loading.value = true;
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                // Evict oldest entry if cache is full
                if (cache.size >= MAX_CACHE_SIZE) {
                    const oldest = cache.keys().next().value!;
                    cache.delete(oldest);
                }
                cache.set(slug, img);
                if (store.imageSlug === slug) {
                    currentImage = img;
                    loading.value = false;
                    onImageLoaded?.();
                }
            };
            img.onerror = () => {
                if (store.imageSlug === slug) {
                    currentImage = null;
                    loading.value = false;
                }
            };
            img.src = `/api/images/${slug}/blob`;
        },
        { immediate: true },
    );

    function getImageBounds() {
        const pts = store.contour?.points;
        if (pts && pts.x.length > 0) return computeBBox(pts.x, pts.y);
        const ep = store.epicycleData?.path;
        if (ep && ep.x.length > 0) return computeBBox(ep.x, ep.y);
        const bo = store.basesData?.original;
        if (bo && bo.x.length > 0) return computeBBox(bo.x, bo.y);
        return null;
    }

    function computeBBox(x: number[], y: number[]) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let i = 0; i < x.length; i++) {
            if (x[i] < minX) minX = x[i];
            if (x[i] > maxX) maxX = x[i];
            if (y[i] < minY) minY = y[i];
            if (y[i] > maxY) maxY = y[i];
        }
        return { minX, maxX, minY, maxY };
    }

    function drawImageOverlay(s: CanvasSurface, view: ViewTransform) {
        if (!currentImage) return;
        const b = getImageBounds();
        if (!b) return;

        const [sx1, sy1] = view.toScreen(b.minX, b.maxY);
        const [sx2, sy2] = view.toScreen(b.maxX, b.minY);
        const boxW = sx2 - sx1;
        const boxH = sy2 - sy1;
        if (boxW <= 0 || boxH <= 0) return;

        // Contain-fit: preserve image aspect ratio
        const imgAR = currentImage.naturalWidth / currentImage.naturalHeight;
        const boxAR = boxW / boxH;
        let dw: number, dh: number, dx: number, dy: number;
        if (imgAR > boxAR) {
            dw = boxW; dh = boxW / imgAR;
            dx = sx1; dy = sy1 + (boxH - dh) / 2;
        } else {
            dh = boxH; dw = boxH * imgAR;
            dx = sx1 + (boxW - dw) / 2; dy = sy1;
        }

        s.ctx.save();
        s.ctx.globalAlpha = 0.28;
        s.ctx.drawImage(currentImage, dx, dy, dw, dh);
        s.ctx.restore();
    }

    return { drawImageOverlay, loading };
}
