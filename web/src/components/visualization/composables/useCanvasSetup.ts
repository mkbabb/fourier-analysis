import { type Ref, type ShallowRef, shallowRef, onMounted, onUnmounted } from "vue";
import type { CanvasSurface } from "../lib/canvas-drawing";

/**
 * The one DPR-aware canvas idiom (X.F.W14 `.p`, OA-44): every canvas in the app
 * holds a backing store of exactly its CSS box in device pixels, and draws in
 * CSS pixels through the context transform.
 *
 * - The canvas's CSS box is layout's (its stylesheet or its owner's `style`
 *   binding) — this composable never writes `style.width/height`, so a canvas
 *   can never be stretched by CSS from a smaller bitmap.
 * - A `ResizeObserver` on the canvas itself reads `devicePixelContentBoxSize`
 *   where the engine provides it: the exact device-pixel box, fractional CSS
 *   sizes and page zoom included. Elsewhere the box is `round(css × dpr)`.
 *   The device box is taken only while it describes the DPR the page renders
 *   at: under DPR emulation (DevTools device mode, a test's
 *   `deviceScaleFactor`) Chromium still reports the physical screen's box —
 *   measured: a 300.5-px box reads 601 device px at an emulated DPR of 1 on a
 *   2× display — and a bitmap sized to it would be resampled onto the page.
 * - The observer watches the CSS content box, so every layout change of the
 *   box re-sizes the bitmap — including a sub-pixel one. Observing only the
 *   device-pixel box (as the first cut did) reports a change only when that box
 *   moves, and under DPR emulation it is the physical screen's box: measured
 *   (F.W14 Repair 1), a stage settling from 798.59 to 798.34 CSS px left the
 *   physical 2x box at 1597 — no entry — while the page's DPR-1 bitmap stayed
 *   799 wide for a 798-px box. Where the engine supports it, a second observer
 *   watches the device-pixel box too, so a snap that moves no CSS size (a
 *   sub-pixel position shift) still re-sizes. Both read the one entry law below.
 * - A `(resolution: <dpr>dppx)` media query, re-armed at each change, catches a
 *   DPR change that moves no CSS box (the window dragged to another display),
 *   which the observer does not report where the device-pixel box is absent.
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

    function apply(canvas: HTMLCanvasElement, width: number, height: number, deviceW: number, deviceH: number) {
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
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        apply(canvas, rect.width, rect.height, Math.round(rect.width * dpr), Math.round(rect.height * dpr));
    }

    function onEntries(entries: ResizeObserverEntry[]) {
        const canvas = canvasRef.value;
        const entry = entries[entries.length - 1];
        if (!canvas || !entry) return;
        const css = entry.contentBoxSize[0];
        const dpr = window.devicePixelRatio || 1;
        const deviceW = Math.round(css.inlineSize * dpr);
        const deviceH = Math.round(css.blockSize * dpr);
        const device = devicePixelBox ? entry.devicePixelContentBoxSize[0] : null;
        // Snapping moves a device box by at most one pixel from `css × dpr`.
        const snapped =
            device !== null &&
            Math.abs(device.inlineSize - deviceW) <= 1 &&
            Math.abs(device.blockSize - deviceH) <= 1;
        apply(
            canvas,
            css.inlineSize,
            css.blockSize,
            snapped ? device.inlineSize : deviceW,
            snapped ? device.blockSize : deviceH,
        );
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
        setupCanvas();
        watchResolution();
        const canvas = canvasRef.value;
        if (!canvas) return;
        resizeObserver = new ResizeObserver(onEntries);
        resizeObserver.observe(canvas);
        if (devicePixelBox) {
            deviceObserver = new ResizeObserver(onEntries);
            deviceObserver.observe(canvas, { box: "device-pixel-content-box" });
        }
    });

    onUnmounted(() => {
        resizeObserver?.disconnect();
        deviceObserver?.disconnect();
        resolution?.removeEventListener("change", onResolutionChange);
    });

    return { surface, setupCanvas };
}
