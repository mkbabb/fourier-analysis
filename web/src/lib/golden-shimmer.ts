/**
 * Shared golden shimmer/halo effect for canvas rendering.
 *
 * Used by both the visualizer (BasisCanvas, labels) and the equation
 * convergence plot to give hovered/active curves a consistent golden glow.
 */

import { VIZ_COLORS, withAlpha } from "@/lib/colors";

/** Compute the shimmer alpha oscillation (0.85 → 1.0 at ~200ms period). */
export function goldenShimmerAlpha(): number {
    return 0.85 + 0.15 * Math.sin(performance.now() / 200);
}

/**
 * The golden halo paint at a given alpha — ONE source for every shimmer site.
 *
 * The sum swatch and the shimmer pipeline paint one identity, and they drifted
 * apart once already: the legend swatch moved to a token while the curve kept a
 * frozen hex, so the halo was re-derived from `VIZ_COLORS.golden` at each canvas
 * that drew it (fr-ConvergenceLegend C-2). The halo color is now named here and
 * nowhere else, which is what makes the swatch's own re-join a one-line change
 * at the owning wave instead of a hunt through three canvases.
 */
export function goldenShimmerShadow(alpha: number): string {
    return withAlpha(VIZ_COLORS.golden, alpha);
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
        ctx.shadowColor = goldenShimmerShadow(shimmer * 0.5);
        ctx.shadowBlur = hoverBlur;
    } else if (playing) {
        ctx.shadowColor = goldenShimmerShadow(shimmer * 0.3);
        ctx.shadowBlur = playBlur;
    }
}

/** Reset shadow state after a golden shimmer stroke. */
export function clearShimmer(ctx: CanvasRenderingContext2D): void {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
}
