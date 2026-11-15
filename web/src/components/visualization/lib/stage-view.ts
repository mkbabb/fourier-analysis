/**
 * LAST-TEN F-01: the stage's own view, laid over the fit-to-drawing transform.
 *
 * A pinch on the epicycle canvas zoomed the whole page (visualViewport 1 ->
 * 1.80, the docks left untappable) because the canvas owned no gesture. The
 * stage now owns them: pinch and wheel zoom the drawing about the fingers or
 * the cursor, a drag pans it, and past the limits the view rubber-bands and
 * settles back. This module is the pure geometry; `useStageGestures` drives it.
 *
 * A view maps a fitted screen point `p` to `p * k + (x, y)`. The identity is
 * the fitted drawing. The limits keep the zoomed drawing covering the stage:
 * `k` in [ZOOM_MIN, ZOOM_MAX], and the offset in [size * (1 - k), 0] per axis,
 * so at k = 1 the only resting view is the fit.
 */
import type { ViewTransform } from "./canvas-drawing/types";

export interface StageView {
    k: number;
    x: number;
    y: number;
}

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 8;
export const IDENTITY_VIEW: Readonly<StageView> = Object.freeze({ k: 1, x: 0, y: 0 });

/** Zoom by `factor` about the screen point (fx, fy), which stays under the fingers. */
export function zoomAbout(v: StageView, factor: number, fx: number, fy: number): StageView {
    const k = v.k * factor;
    return { k, x: fx - (fx - v.x) * factor, y: fy - (fy - v.y) * factor };
}

/** The resting view nearest `v`: zoom and offset inside their limits. */
export function clampView(v: StageView, w: number, h: number): StageView {
    const k = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v.k));
    // Re-centre a zoom held at its limit about the stage centre, so the
    // offset stays consistent with the clamped scale.
    const r = k / v.k;
    const x = w / 2 - (w / 2 - v.x) * r;
    const y = h / 2 - (h / 2 - v.y) * r;
    return {
        k,
        x: Math.min(0, Math.max(w * (1 - k), x)),
        y: Math.min(0, Math.max(h * (1 - k), y)),
    };
}

/** True when `v` is a resting view (inside every limit, within `eps`). */
export function isAtRest(v: StageView, w: number, h: number, eps = 0.01): boolean {
    const c = clampView(v, w, h);
    return Math.abs(c.k - v.k) < eps * 0.01 && Math.abs(c.x - v.x) < eps && Math.abs(c.y - v.y) < eps;
}

/**
 * How much of a move past a limit still moves the view: 1 inside, falling as
 * the overshoot grows (the rubber band's resistance). `overshoot` and `dim`
 * share a unit; `dim` is the distance at which the band has given half.
 */
export function resistance(overshoot: number, dim: number): number {
    if (overshoot <= 0) return 1;
    const t = overshoot / Math.max(1, dim);
    return 1 / ((1 + t) * (1 + t));
}

/** How far `v` is past its limits, per channel (0 when inside). */
export function overshoot(v: StageView, w: number, h: number): { k: number; x: number; y: number } {
    const c = clampView(v, w, h);
    return {
        // In log space, so zooming out past 1 and in past 8 resist alike.
        k: Math.abs(Math.log(v.k / c.k)),
        x: Math.abs(v.x - c.x),
        y: Math.abs(v.y - c.y),
    };
}

/** Compose the view with a fitted screen point. */
export function applyView(v: StageView, sx: number, sy: number): [number, number] {
    return [sx * v.k + v.x, sy * v.k + v.y];
}

/** Step `from` toward `to` by the fraction an exponential approach of time
 *  constant `tau` (ms) covers in `dt` (ms): frame-rate independent. */
export function approach(from: StageView, to: StageView, dt: number, tau: number): StageView {
    const a = 1 - Math.exp(-dt / tau);
    return { k: from.k + (to.k - from.k) * a, x: from.x + (to.x - from.x) * a, y: from.y + (to.y - from.y) * a };
}

export function isIdentity(v: StageView, eps = 1e-3): boolean {
    return Math.abs(v.k - 1) < eps && Math.abs(v.x) < eps * 100 && Math.abs(v.y) < eps * 100;
}

/**
 * The fitted transform seen through the stage view: what the grid, the
 * trail, the outline and the curves draw with. The identity returns `base`.
 */
export function composeView(base: ViewTransform, v: StageView, w: number, h: number): ViewTransform {
    if (isIdentity(v, 1e-6)) return base;
    const { k, x, y } = v;
    const sxBase = (w / 2 - x) / k;
    const syBase = (h / 2 - y) / k;
    return {
        cx: base.cx + (sxBase - w / 2) / base.scale,
        cy: base.cy - (syBase - h / 2) / base.scale,
        scale: base.scale * k,
        toScreen(dx: number, dy: number): [number, number] {
            const [sx, sy] = base.toScreen(dx, dy);
            return [sx * k + x, sy * k + y];
        },
    };
}
