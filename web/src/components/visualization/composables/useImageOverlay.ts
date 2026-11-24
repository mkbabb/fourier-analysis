import { ref, shallowRef, watch } from "vue";
import { useGlobalDark } from "@mkbabb/glass-ui/dark";
import { useWorkspaceStore } from "@/stores/workspace";
import { WASH_DEFAULT } from "../lib/workspace-query";
import { LAYER_FADE_MS, LAYER_FADE_REDUCED_MS } from "./useLayerFade";
import { imageSrc, overlayUrl } from "@/lib/api";
import { keeper, laid, lightness, measureTones, washGain, type Tones } from "../lib/picture-key";
import type { CanvasSurface } from "@/components/shared/canvas/useCanvasSetup";
import type { ViewTransform } from "../lib/canvas-drawing";
import type { Bbox } from "../lib/stage-view";

const MAX_CACHE_SIZE = 10;

/** The picture's strength under the drawing by default: a wash, so the line reads over it. */
export const PICTURE_WASH = WASH_DEFAULT / 100;

/** A picture twice: as it is, and keyed as a wash on the stage's ground (`lib/picture-key`). */
interface Picture {
    whole: HTMLCanvasElement;
    keyed: HTMLCanvasElement;
    /** What its own pixels say about how it keys (measured once). */
    tones: Tones;
    /** The ground's lightness (0..1) the wash was keyed against. */
    ground: number;
    /** How densely the wash is laid on that ground (1: as it is). */
    gain: number;
    /** The wash keyed against the ground before, crossing out after a theme change. */
    before?: { keyed: HTMLCanvasElement; gain: number; t0: number };
    /** Made from the dropped file in the browser, standing in until the server's overlay lands. */
    local?: boolean;
}

// Module-scoped cache survives component unmount/remount (e.g. gallery → visualizer)
const cache = new Map<string, Picture>();

/** The wash's feathered edge, as a share of the picture's shorter side. */
export const WASH_FEATHER = 0.12;

/** 0 at the picture's edge, rising smoothly to 1 at the feather's depth. */
function feather(d: number, depth: number): number {
    const t = Math.min(1, d / depth);
    return t * t * (3 - 2 * t);
}

/**
 * The lightness of the ground a canvas is drawn on: the nearest ancestor that
 * paints a mostly opaque background, read through a 1x1 canvas so any colour
 * syntax the cascade resolves to (oklch, color-mix) is measured as drawn.
 * A cream stage reads about 0.95, the dark stage about 0.2.
 */
export function groundLightness(el: Element | null): number {
    const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    if (!probe) return 1;
    probe.canvas.width = probe.canvas.height = 1;
    for (let node = el; node; node = node.parentElement) {
        const bg = getComputedStyle(node).backgroundColor;
        if (!bg || bg === "transparent") continue;
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = bg;
        probe.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
        if (a >= 128) return lightness(r, g, b);
    }
    return 1;
}

/**
 * Key the picture as a wash on a ground of lightness `ground` (UIA-F-174;
 * FORTY-SIXTH D; the rule is `lib/picture-key`): a drawing's paper and a
 * photograph's ground-toned parts key out, and the rest stays. The pixels keep
 * their own colours; only their alpha changes. The overlay is drawn over a
 * transparent canvas, where a blend mode has no backdrop to act on; the key is
 * the blend the canvas cannot do.
 *
 * The keyed wash also fades out toward the picture's four edges (PR 33
 * review: on by default, its hard edge read as a pale box across the stage).
 * The whole picture, shown alone, keeps its edges.
 */
function keyedAgainst(whole: HTMLCanvasElement, ground: number, tones: Tones): HTMLCanvasElement {
    const w = whole.width;
    const h = whole.height;
    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    const ctx = out.getContext("2d")!;
    ctx.drawImage(whole, 0, 0);
    const data = ctx.getImageData(0, 0, w, h);
    const px = data.data;
    const depth = Math.max(1, WASH_FEATHER * Math.min(w, h));
    const keep = keeper(tones, ground);
    const edgeX = new Float32Array(w);
    for (let x = 0; x < w; x++) edgeX[x] = feather(Math.min(x, w - 1 - x) + 0.5, depth);
    for (let y = 0; y < h; y++) {
        const fy = feather(Math.min(y, h - 1 - y) + 0.5, depth);
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            px[i + 3] = Math.round(px[i + 3] * keep(lightness(px[i], px[i + 1], px[i + 2])) * fy * edgeX[x]);
        }
    }
    ctx.putImageData(data, 0, 0);
    return out;
}

/**
 * The picture whole, its tones measured, and its wash keyed against `ground`
 * (null: not read yet, so keyed at the first draw).
 */
function luminanceKeyed(img: CanvasImageSource, w: number, h: number, ground: number | null): Picture {
    const whole = document.createElement("canvas");
    whole.width = w;
    whole.height = h;
    const ctx = whole.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, w, h);
    const tones = measureTones(ctx.getImageData(0, 0, w, h).data, w, h);
    if (ground === null) return { whole, keyed: whole, tones, ground: NaN, gain: 1 };
    return { whole, keyed: keyedAgainst(whole, ground, tones), tones, ground, gain: washGain(tones, ground) };
}

/**
 * The dropped file at w x h. `createImageBitmap` decodes and resizes it off the
 * main thread: a 12 MP photo drawn through an <img> is decoded on it, a long
 * frame at the drop while the drop target fades and the aside opens. Where it
 * cannot (an engine that refuses an option, or one that sized the file before
 * turning it upright), the <img> is drawn as before.
 */
async function decodedAt(url: string, img: HTMLImageElement, w: number, h: number): Promise<CanvasImageSource> {
    try {
        const file = await (await fetch(url)).blob();
        const bitmap = await createImageBitmap(file, {
            resizeWidth: w,
            resizeHeight: h,
            resizeQuality: "high",
            imageOrientation: "from-image",
        });
        if (bitmap.width === w && bitmap.height === h) return bitmap;
        bitmap.close();
    } catch {
        // The <img> below.
    }
    return img;
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

    /*
     * The stage's ground, read where the picture is drawn. A theme change is
     * read once the page's colours have crossed (their transitions settle
     * inside the wait), and the wash re-keyed against the new ground crosses
     * from the old one over the layer's own fade, never in one frame.
     */
    const GROUND_SETTLE_MS = 450;
    let ground: number | null = null;
    let groundTimer = 0;
    const { isDark } = useGlobalDark();
    watch(isDark, () => {
        window.clearTimeout(groundTimer);
        groundTimer = window.setTimeout(() => {
            ground = null;
            onImageLoaded?.();
        }, GROUND_SETTLE_MS);
    });
    function groundFor(canvas: HTMLCanvasElement): number {
        if (ground === null) ground = groundLightness(canvas);
        return ground;
    }
    /** The picture's wash against `g`: re-keyed when the ground has moved, the old wash kept to cross out. */
    function rekey(picture: Picture, g: number): void {
        if (!Number.isFinite(picture.ground)) {
            // First drawn: keyed against the ground it lands on, nothing to cross.
            picture.keyed = keyedAgainst(picture.whole, g, picture.tones);
            picture.gain = washGain(picture.tones, g);
            picture.ground = g;
            return;
        }
        if (Math.abs(picture.ground - g) < 0.02) return;
        picture.before = { keyed: picture.keyed, gain: picture.gain, t0: performance.now() };
        picture.keyed = keyedAgainst(picture.whole, g, picture.tones);
        picture.gain = washGain(picture.tones, g);
        picture.ground = g;
    }
    /** How far the old wash has crossed out (1: gone). */
    function crossed(picture: Picture): number {
        if (!picture.before) return 1;
        const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        const k = Math.min(1, (performance.now() - picture.before.t0) / (reduce ? LAYER_FADE_REDUCED_MS : LAYER_FADE_MS));
        if (k >= 1) picture.before = undefined;
        return 1 - (1 - k) ** 3;
    }

    function cacheKey(): string | null {
        if (!store.imageSlug) return null;
        return `${store.imageSlug}:${resizeFromBounds(store)}`;
    }

    /** The dropped file's picture stands while its upload runs, and after, until the server's lands. */
    function localStands(): boolean {
        return !!current.value?.local && !!store.localPicture;
    }

    /*
     * The dropped file, decoded in the browser at the extraction's size (the
     * overlay is the image at `resize` on its longer side), so the server's
     * overlay takes its place without the picture moving.
     */
    let localUrl: string | null = null;
    function loadLocal(url: string) {
        if (localUrl === url) return;
        localUrl = url;
        const img = new Image();
        /** This file is still the stage's, and the server's picture for it is not in hand. */
        const wanted = () => store.localPicture === url && (store.uploading || !current.value || !!current.value.local);
        // The <img> reads the file's size (and its orientation) without drawing it.
        img.onload = async () => {
            if (!wanted() || !img.naturalWidth || !img.naturalHeight) return;
            const k = resizeFromBounds(store) / Math.max(img.naturalWidth, img.naturalHeight);
            const w = Math.max(1, Math.round(img.naturalWidth * k));
            const h = Math.max(1, Math.round(img.naturalHeight * k));
            const source = await decodedAt(url, img, w, h);
            try {
                if (!wanted()) return;
                current.value = { ...luminanceKeyed(source, w, h, ground), local: true };
                onImageLoaded?.();
            } finally {
                if (source instanceof ImageBitmap) source.close();
            }
        };
        // A file the browser cannot draw (HEIC in a desk's Chrome) leaves no
        // blank stage: it is let go, and the drop target stays, busy.
        img.onerror = () => {
            if (store.localPicture === url) store.releaseLocalPicture();
        };
        img.src = url;
    }

    /** The server's picture is in hand: it stands, and the dropped file (held whole until now) is let go. */
    function showServer(picture: Picture) {
        current.value = picture;
        loading.value = false;
        if (!store.uploading && store.localPicture) store.releaseLocalPicture();
        onImageLoaded?.();
    }

    watch(
        () => [store.imageSlug, store.contour, store.localPicture, store.uploading] as const,
        () => {
            if (store.uploading && store.localPicture) {
                loadLocal(store.localPicture);
                return;
            }
            const key = cacheKey();
            if (!key) {
                if (!localStands()) current.value = null;
                loading.value = false;
                return;
            }
            if (cache.has(key)) {
                showServer(cache.get(key)!);
                return;
            }
            if (!localStands()) current.value = null;
            loading.value = true;
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                if (cache.size >= MAX_CACHE_SIZE) {
                    const oldest = cache.keys().next().value!;
                    cache.delete(oldest);
                }
                const keyed = luminanceKeyed(img, img.naturalWidth, img.naturalHeight, ground);
                cache.set(key, keyed);
                if (cacheKey() === key) showServer(keyed);
            };
            img.onerror = () => {
                if (cacheKey() === key) {
                    if (!localStands()) current.value = null;
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
     * drawing it is the keyed wash at `wash` (0..1, the reader's strength,
     * `wash` in the URL); with nothing drawn it is the whole picture at full
     * strength. Between the two it crosses over, in the drawing's own
     * transform, so nothing moves. On a ground where a photograph reads
     * faintly its wash is laid thicker (`laid`, the picture's own gain).
     * `whole` is the whole picture's own share (0..1): it gives way a step
     * while the first compute's found lines stand on it (FORTY-SIXTH G).
     */
    function drawImageOverlay(s: CanvasSurface, view: ViewTransform, strength = 1, under = 1, wash = PICTURE_WASH, whole = 1) {
        const picture = current.value;
        if (!picture || strength <= 0) return;
        if (under > 0) rekey(picture, groundFor(s.ctx.canvas));

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
            const e = crossed(picture);
            s.ctx.globalAlpha = laid(wash, picture.gain) * k * u * e;
            s.ctx.drawImage(picture.keyed, sx1, sy1, boxW, boxH);
            if (picture.before) {
                s.ctx.globalAlpha = laid(wash, picture.before.gain) * k * u * (1 - e);
                s.ctx.drawImage(picture.before.keyed, sx1, sy1, boxW, boxH);
                // The crossing runs on the stage's own frames while the clock is parked.
                requestAnimationFrame(() => onImageLoaded?.());
            }
        }
        if (u < 1) {
            s.ctx.globalAlpha = k * (1 - u) * Math.min(1, Math.max(0, whole));
            s.ctx.drawImage(picture.whole, sx1, sy1, boxW, boxH);
        }
        s.ctx.restore();
    }

    return { drawImageOverlay, pictureBounds, hasPicture: () => current.value !== null, loading };
}
