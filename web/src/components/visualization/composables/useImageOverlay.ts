import { ref, shallowRef, watch } from "vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { imageSrc, overlayUrl } from "@/lib/api";
import type { CanvasSurface } from "@/components/shared/canvas/useCanvasSetup";
import type { ViewTransform } from "../lib/canvas-drawing";
import type { Bbox } from "./useViewTransform";

const MAX_CACHE_SIZE = 10;

/** The picture's strength under the drawing: a wash, so the line reads over it. */
export const PICTURE_WASH = 0.22;

/** A picture twice: as it is, and keyed by its darkness (the wash under a drawing). */
interface Picture {
    whole: HTMLCanvasElement;
    keyed: HTMLCanvasElement;
}

// Module-scoped cache survives component unmount/remount (e.g. gallery → visualizer)
const cache = new Map<string, Picture>();

/**
 * Luminance-key the loaded overlay once (UIA-F-174): each pixel's alpha is
 * scaled by its darkness, so a white ground keys out and ink stays. The
 * overlay is drawn over a transparent canvas, where a blend mode has no
 * backdrop to act on; the key is the multiply the canvas cannot do.
 */
function luminanceKeyed(img: HTMLImageElement): Picture {
    const whole = document.createElement("canvas");
    whole.width = img.naturalWidth;
    whole.height = img.naturalHeight;
    whole.getContext("2d")!.drawImage(img, 0, 0);
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
    return { whole, keyed: out };
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
    /** The picture in hand (reactive, so a stage can wait on it). */
    const current = shallowRef<Picture | null>(null);

    function cacheKey(): string | null {
        if (!store.imageSlug) return null;
        return `${store.imageSlug}:${resizeFromBounds(store)}`;
    }

    watch(
        () => [store.imageSlug, store.contour] as const,
        () => {
            const key = cacheKey();
            if (!key) { current.value = null; loading.value = false; return; }
            if (cache.has(key)) {
                current.value = cache.get(key)!;
                loading.value = false;
                onImageLoaded?.();
                return;
            }
            current.value = null;
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
                    current.value = keyed;
                    loading.value = false;
                    onImageLoaded?.();
                }
            };
            img.onerror = () => {
                if (cacheKey() === key) {
                    current.value = null;
                    loading.value = false;
                }
            };
            // X·F F-D5: the overlay passes the read gate with the session; the
            // object URL is released once the pixels are copied (luminanceKeyed).
            void imageSrc(overlayUrl(store.imageSlug!, resizeFromBounds(store))).then((src) => {
                if (src.startsWith("blob:")) {
                    img.addEventListener("load", () => URL.revokeObjectURL(src), { once: true });
                    img.addEventListener("error", () => URL.revokeObjectURL(src), { once: true });
                }
                img.src = src;
            });
        },
        { immediate: true },
    );

    /**
     * Where the picture lies in the drawing's units: the contour's
     * `image_bounds`, or, before there is a contour, the picture's own frame
     * (the overlay is the image at the extraction's resize, centred on the
     * origin, which is what `image_bounds` will say).
     */
    function pictureBounds(): Bbox | null {
        const bounds = store.contour?.image_bounds;
        if (bounds) return bounds;
        const picture = current.value;
        if (!picture) return null;
        const w = picture.whole.width;
        const h = picture.whole.height;
        return { minX: -w / 2, maxX: w / 2, minY: -h / 2, maxY: h / 2 };
    }

    /**
     * Draw the picture at `strength` (0..1, the layer's fade). `under` is how
     * much drawing is over it (0..1, the strongest drawn layer): under a
     * drawing it is the keyed wash; with nothing drawn it is the whole
     * picture at full strength. Between the two it crosses over, in the
     * drawing's own transform, so nothing moves.
     */
    function drawImageOverlay(s: CanvasSurface, view: ViewTransform, strength = 1, under = 1) {
        const picture = current.value;
        if (!picture || strength <= 0) return;

        const bounds = pictureBounds();
        if (!bounds) return;

        const [sx1, sy1] = view.toScreen(bounds.minX, bounds.maxY);
        const [sx2, sy2] = view.toScreen(bounds.maxX, bounds.minY);
        const boxW = sx2 - sx1;
        const boxH = sy2 - sy1;
        if (boxW <= 0 || boxH <= 0) return;

        const k = Math.min(1, strength);
        const u = Math.min(1, Math.max(0, under));
        s.ctx.save();
        if (u > 0) {
            s.ctx.globalAlpha = PICTURE_WASH * k * u;
            s.ctx.drawImage(picture.keyed, sx1, sy1, boxW, boxH);
        }
        if (u < 1) {
            s.ctx.globalAlpha = k * (1 - u);
            s.ctx.drawImage(picture.whole, sx1, sy1, boxW, boxH);
        }
        s.ctx.restore();
    }

    return { drawImageOverlay, pictureBounds, hasPicture: () => current.value !== null, loading };
}
