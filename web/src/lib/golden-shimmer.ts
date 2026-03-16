/**
 * Shared golden shimmer/halo effect for canvas rendering.
 *
 * Used by both the visualizer (BasisCanvas, labels) and the equation
 * convergence plot to give hovered/active curves a consistent golden glow.
 */

import { VIZ_COLORS, hexToRgba } from "@/lib/colors";

/** Compute the shimmer alpha oscillation (0.85 → 1.0 at ~200ms period). */
export function goldenShimmerAlpha(): number {
    return 0.85 + 0.15 * Math.sin(performance.now() / 200);
}

/**
 * Apply golden shimmer styling to a canvas context before stroking a path.
 *
 * Sets strokeStyle, globalAlpha, lineWidth, shadowColor, and shadowBlur.
 * Call `clearShimmer(ctx)` after stroke to reset shadow state.
 */
export function applyGoldenShimmer(
    ctx: CanvasRenderingContext2D,
    opts: {
        /** Whether the element is hovered */
        hovered?: boolean;
        /** Whether animation is playing (lighter shimmer) */
        playing?: boolean;
        /** Line width when not hovered */
        baseWidth?: number;
        /** Line width when hovered */
        hoverWidth?: number;
        /** Shadow blur radius when hovered */
        hoverBlur?: number;
        /** Shadow blur radius when playing (not hovered) */
        playBlur?: number;
    } = {},
): void {
    const {
        hovered = false,
        playing = false,
        baseWidth = 5,
        hoverWidth = 7,
        hoverBlur = 12,
        playBlur = 6,
    } = opts;

    const active = hovered || playing;
    const shimmer = active ? goldenShimmerAlpha() : 0.9;

    ctx.strokeStyle = VIZ_COLORS.golden;
    ctx.globalAlpha = shimmer;
    ctx.lineWidth = hovered ? hoverWidth : baseWidth;

    if (hovered) {
        ctx.shadowColor = hexToRgba(VIZ_COLORS.golden, shimmer * 0.5);
        ctx.shadowBlur = hoverBlur;
    } else if (playing) {
        ctx.shadowColor = hexToRgba(VIZ_COLORS.golden, shimmer * 0.3);
        ctx.shadowBlur = playBlur;
    }
}

/** Reset shadow state after a golden shimmer stroke. */
export function clearShimmer(ctx: CanvasRenderingContext2D): void {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
}
