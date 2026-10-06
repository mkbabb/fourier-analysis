/**
 * The golden Sum stroke for canvas rendering (the equation convergence plot).
 *
 * X-DS pass 1 · F1-04 — the stroke is steady. The shimmer (a 200 ms sine on
 * alpha), the playback glow (`shadowBlur` 8) and the hover halo (`shadowBlur`
 * 14) are DELETED: idle motion and glow on a curve whose identity is its hue.
 * Hover is one width step; playing changes nothing about the stroke.
 */

import { VIZ_COLORS } from "@/lib/colors";

/** Set the golden stroke on a canvas context before stroking the Sum path. */
export function applyGoldenStroke(
    ctx: CanvasRenderingContext2D,
    opts: {
        /** Whether the curve is hovered */
        hovered?: boolean;
        /** Line width at rest */
        baseWidth?: number;
        /** Line width when hovered */
        hoverWidth?: number;
    } = {},
): void {
    const { hovered = false, baseWidth = 5, hoverWidth = 7 } = opts;
    ctx.strokeStyle = VIZ_COLORS.golden;
    ctx.globalAlpha = 1;
    ctx.lineWidth = hovered ? hoverWidth : baseWidth;
}
