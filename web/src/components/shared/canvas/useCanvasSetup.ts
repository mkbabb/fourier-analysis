import { type Ref, type ShallowRef, shallowRef, onMounted, onUnmounted } from "vue";

/** A canvas's 2D context with its CSS-pixel size and the device-pixel ratio it was sized at. */
export interface CanvasSurface {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    dpr: number;
}

/** A box's two extents, in the `ResizeObserverSize` shape. */
export interface BoxSize {
    inlineSize: number;
    blockSize: number;
}

/**
 * THE backing-store rule (X.F.W14 `.p2`, OA-44; COHESION §0cl), one for the
 * stage and every canvas: the engine's device-pixel box
 * (`devicePixelContentBoxSize`) when it reports one — the exact bitmap that
 * maps 1:1 onto the device grid, fractional CSS boxes and page zoom included —
 * else `Math.round(cssBox × dpr)` per axis. No other rounding exists: no
 * `getBoundingClientRect` product where a device box is on offer, and no
 * guard that trades the device box for a product when the two disagree.
 */
export function backingSize(css: BoxSize, device: BoxSize | null | undefined, dpr: number): BoxSize {
    if (device) return { inlineSize: device.inlineSize, blockSize: device.blockSize };
    return { inlineSize: Math.round(css.inlineSize * dpr), blockSize: Math.round(css.blockSize * dpr) };
}

/**
 * The one DPR-aware canvas idiom (X.F.W14 `.p`/`.p2`, OA-44): every canvas in
 * the app holds a backing store sized by `backingSize` above, and draws in CSS
 * pixels through the context transform.
 *
 * - The canvas's CSS box is layout's (its stylesheet or its owner's `style`
 *   binding) — this composable never writes `style.width/height`, so a canvas
 *   can never be stretched by CSS from a smaller bitmap.
 * - A `ResizeObserver` on the canvas's CSS content box re-sizes the bitmap on
 *   every layout change of the box, sub-pixel ones included; where the engine
 *   reports device-pixel boxes a second observer watches that box, so a snap
 *   that moves no CSS size (a sub-pixel position shift, a display move) still
 *   re-sizes. Every entry carries both boxes and goes through `backingSize`.
 * - `setupCanvas` (mount, data arrival, DPR change) measures the box now: where
 *   device-pixel boxes exist it re-observes, so the engine delivers a fresh
 *   entry — the device box is only ever read off an entry — before the next
 *   paint; elsewhere it sizes from the layout rect by the same rule's fallback.
 * - A `(resolution: <dpr>dppx)` media query, re-armed at each change, catches a
 *   DPR change that moves no CSS box (the window dragged to another display).
 * - The transform maps one CSS pixel onto the device grid, so a `lineWidth` of 1
 *   is one CSS pixel at any DPR.
 */
export function useCanvasSetup(
    canvasRef: Ref<HTMLCanvasElement | undefined>,
    onResize: (surface: CanvasSurface) => void,
): { surface: ShallowRef<CanvasSurface | null>; setupCanvas: () => void } {
    const surface = shallowRef<CanvasSurface | null>(null);
    let resizeObserver: ResizeObserver | null = null;
    let deviceObserver: ResizeObserver | null = null;
    let resolution: MediaQueryList | null = null;

    const devicePixelBox =
        typeof ResizeObserverEntry !== "undefined" &&
        "devicePixelContentBoxSize" in ResizeObserverEntry.prototype;

    function apply(canvas: HTMLCanvasElement, css: BoxSize, device: BoxSize | null) {
        const { inlineSize: width, blockSize: height } = css;
        const backing = backingSize(css, device, window.devicePixelRatio || 1);
        const { inlineSize: deviceW, blockSize: deviceH } = backing;
        if (width === 0 || height === 0 || deviceW === 0 || deviceH === 0) return;
        // Assigning `width`/`height` reallocates (and clears) the bitmap even at
        // the same value — only a changed box pays for it.
        if (canvas.width !== deviceW) canvas.width = deviceW;
        if (canvas.height !== deviceH) canvas.height = deviceH;

        const ctx = canvas.getContext("2d")!;
        ctx.setTransform(deviceW / width, 0, 0, deviceH / height, 0, 0);

        const s: CanvasSurface = { ctx, width, height, dpr: deviceW / width };
        surface.value = s;
        onResize(s);
    }

    /** Size from the canvas's current layout box (mount, data arrival, DPR change). */
    function setupCanvas() {
        const canvas = canvasRef.value;
        if (!canvas) return;
        if (resizeObserver && devicePixelBox) {
            resizeObserver.unobserve(canvas);
            resizeObserver.observe(canvas);
            return;
        }
        const rect = canvas.getBoundingClientRect();
        apply(canvas, { inlineSize: rect.width, blockSize: rect.height }, null);
    }

    function onEntries(entries: ResizeObserverEntry[]) {
        const canvas = canvasRef.value;
        const entry = entries[entries.length - 1];
        if (!canvas || !entry) return;
        apply(canvas, entry.contentBoxSize[0], devicePixelBox ? entry.devicePixelContentBoxSize[0] : null);
    }

    function watchResolution() {
        resolution?.removeEventListener("change", onResolutionChange);
        resolution = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
        resolution.addEventListener("change", onResolutionChange);
    }

    function onResolutionChange() {
        watchResolution();
        setupCanvas();
    }

    onMounted(() => {
        const canvas = canvasRef.value;
        watchResolution();
        if (!canvas) return;
        resizeObserver = new ResizeObserver(onEntries);
        resizeObserver.observe(canvas);
        if (devicePixelBox) {
            deviceObserver = new ResizeObserver(onEntries);
            deviceObserver.observe(canvas, { box: "device-pixel-content-box" });
        } else {
            setupCanvas();
        }
    });

    onUnmounted(() => {
        resizeObserver?.disconnect();
        deviceObserver?.disconnect();
        resolution?.removeEventListener("change", onResolutionChange);
    });

    return { surface, setupCanvas };
}
