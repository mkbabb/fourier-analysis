import { ref, watch } from "vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { overlayUrl } from "@/lib/api";
import type { CanvasSurface, ViewTransform } from "../lib/canvas-drawing";

const MAX_CACHE_SIZE = 10;

// Module-scoped cache survives component unmount/remount (e.g. gallery → visualizer)
const cache = new Map<string, HTMLCanvasElement>();

/**
 * Luminance-key the loaded overlay once (UIA-F-174): each pixel's alpha is
 * scaled by its darkness, so a white ground keys out and ink stays. The
 * overlay is drawn over a transparent canvas, where a blend mode has no
 * backdrop to act on; the key is the multiply the canvas cannot do.
 */
function luminanceKeyed(img: HTMLImageElement): HTMLCanvasElement {
    const out = document.createElement("canvas");
    out.width = img.naturalWidth;
    out.height = img.naturalHeight;
    const ctx = out.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, out.width, out.height);
    const px = data.data;
    for (let i = 0; i < px.length; i += 4) {
        const lum = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255;
        px[i + 3] = Math.round(px[i + 3] * (1 - lum));
    }
    ctx.putImageData(data, 0, 0);
    return out;
}

/**
 * Derive the resize value from image_bounds.
 * image_bounds = {-w/2, w/2, -h/2, h/2} → max(w, h) == resize parameter.
 */
function resizeFromBounds(store: ReturnType<typeof useWorkspaceStore>): number {
    const ib = store.contour?.image_bounds;
    if (!ib) return store.contourSettings?.resize ?? 768;
    return Math.round(Math.max(ib.maxX - ib.minX, ib.maxY - ib.minY));
}

/**
 * Loads the resized overlay image (matching contour-extraction dimensions)
 * and draws it behind the animation using the authoritative `image_bounds`
 * from the contour document — pixel-perfect alignment with contour data space.
 */
export function useImageOverlay(onImageLoaded?: () => void) {
    const store = useWorkspaceStore();
    const loading = ref(false);
    let currentImage: HTMLCanvasElement | null = null;

    function cacheKey(): string | null {
        if (!store.imageSlug) return null;
        return `${store.imageSlug}:${resizeFromBounds(store)}`;
    }

    watch(
        () => [store.imageSlug, store.contour] as const,
        () => {
            const key = cacheKey();
            if (!key) { currentImage = null; loading.value = false; return; }
            if (cache.has(key)) {
                currentImage = cache.get(key)!;
                loading.value = false;
                onImageLoaded?.();
                return;
            }
            currentImage = null;
            loading.value = true;
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                if (cache.size >= MAX_CACHE_SIZE) {
                    const oldest = cache.keys().next().value!;
                    cache.delete(oldest);
                }
                const keyed = luminanceKeyed(img);
                cache.set(key, keyed);
                if (cacheKey() === key) {
                    currentImage = keyed;
                    loading.value = false;
                    onImageLoaded?.();
                }
            };
            img.onerror = () => {
                if (cacheKey() === key) {
                    currentImage = null;
                    loading.value = false;
                }
            };
            img.src = overlayUrl(store.imageSlug!, resizeFromBounds(store));
        },
        { immediate: true },
    );

    function drawImageOverlay(s: CanvasSurface, view: ViewTransform) {
        if (!currentImage) return;

        const bounds = store.contour?.image_bounds;
        if (!bounds) return;

        const [sx1, sy1] = view.toScreen(bounds.minX, bounds.maxY);
        const [sx2, sy2] = view.toScreen(bounds.maxX, bounds.minY);
        const boxW = sx2 - sx1;
        const boxH = sy2 - sy1;
        if (boxW <= 0 || boxH <= 0) return;

        s.ctx.save();
        s.ctx.globalAlpha = 0.28;
        s.ctx.drawImage(currentImage, sx1, sy1, boxW, boxH);
        s.ctx.restore();
    }

    return { drawImageOverlay, loading };
}
