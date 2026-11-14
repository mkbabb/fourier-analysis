import type { CanvasSurface } from "@/components/shared/canvas/useCanvasSetup";
import type { ViewTransform } from "./types";

/**
 * Draw the original contour as a dashed outline in the page's ink.
 *
 * O16 [52] ("does nothing"): the outline was a 25% grey stroke drawn UNDER the
 * trail, so at full detail the trail covered it and the View layers toggle
 * changed nothing anyone could see. It is now drawn over the trail, dashed, in
 * `--foreground` (read from the canvas at draw time, so a theme switch re-inks
 * it), at a weight that reads beside the trail's own. Where the series has
 * converged the dashes ride on the trail; where it has not, they show the shape
 * it is converging to. `alpha` is the layer's fade (0..1), so the toggle
 * tweens in and out instead of cutting.
 *
 * @param closePath  Whether to close the path (epicycle mode closes it).
 * @param alpha      The layer's fade, 0 (gone) to 1 (fully shown).
 */
export function drawGhostPath(
    surface: CanvasSurface,
    view: ViewTransform,
    pathX: number[],
    pathY: number[],
    closePath = false,
    alpha = 1,
): void {
    if (alpha <= 0 || pathX.length === 0) return;
    const { ctx } = surface;
    const { toScreen } = view;

    ctx.save();
    // The grey stays only as the fallback if the token does not resolve.
    ctx.strokeStyle = "rgb(150, 150, 150)";
    const ink = getComputedStyle(ctx.canvas).getPropertyValue("--foreground").trim();
    if (ink) ctx.strokeStyle = ink;
    ctx.globalAlpha = 0.72 * Math.min(1, alpha);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let i = 0; i < pathX.length; i++) {
        const [sx, sy] = toScreen(pathX[i], pathY[i]);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
    }
    if (closePath) ctx.closePath();
    ctx.stroke();
    ctx.restore();
}
