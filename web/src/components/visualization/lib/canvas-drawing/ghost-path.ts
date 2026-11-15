import type { CanvasSurface } from "@/components/shared/canvas/useCanvasSetup";
import type { ViewTransform } from "./types";
import { viewKey } from "./trail";

/** The outline in screen space per source array, valid while its view holds
 *  (LAST-TEN F-04: it was re-projected point by point every frame). */
const cache = new WeakMap<number[], { key: string; closed: boolean; path: Path2D }>();

function outlinePath(view: ViewTransform, pathX: number[], pathY: number[], closePath: boolean): Path2D {
    const key = viewKey(view);
    const hit = cache.get(pathX);
    if (hit && hit.key === key && hit.closed === closePath) return hit.path;
    const path = new Path2D();
    for (let i = 0; i < pathX.length; i++) {
        const [sx, sy] = view.toScreen(pathX[i], pathY[i]);
        if (i === 0) path.moveTo(sx, sy);
        else path.lineTo(sx, sy);
    }
    if (closePath) path.closePath();
    cache.set(pathX, { key, closed: closePath, path });
    return path;
}

/**
 * Draw the original contour as a dashed outline in the page's ink.
 *
 * O16 [52] ("does nothing"): the outline was a 25% grey stroke drawn UNDER the
 * trail, so at full detail the trail covered it and the View layers toggle
 * changed nothing anyone could see. It is now drawn over the trail, dashed, in
 * `--foreground` (the stage's ink, re-read on a theme switch), at a weight that reads beside the trail's own. Where the series has
 * converged the dashes ride on the trail; where it has not, they show the shape
 * it is converging to. `alpha` is the layer's fade (0..1), so the toggle
 * tweens in and out instead of cutting.
 *
 * @param closePath  Whether to close the path (epicycle mode closes it).
 * @param alpha      The layer's fade, 0 (gone) to 1 (fully shown).
 * @param ink        The stage's `--foreground` (empty keeps the grey fallback).
 */
export function drawGhostPath(
    surface: CanvasSurface,
    view: ViewTransform,
    pathX: number[],
    pathY: number[],
    closePath = false,
    alpha = 1,
    ink = "",
): void {
    if (alpha <= 0 || pathX.length === 0) return;
    const { ctx } = surface;

    ctx.save();
    // The grey stays only as the fallback if the token does not resolve.
    ctx.strokeStyle = "rgb(150, 150, 150)";
    if (ink) ctx.strokeStyle = ink;
    ctx.globalAlpha = 0.72 * Math.min(1, alpha);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke(outlinePath(view, pathX, pathY, closePath));
    ctx.restore();
}
