/**
 * Adaptive grid drawing for the equation convergence plot.
 */

import { niceStep } from "@/lib/niceStep";

export interface PlotPadding {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

/**
 * Alpha applied to the resolved ink for the AXES — the meaning-bearing marks
 * that state where zero is. `fr-ConvergencePlot D-1` measured the old frozen
 * `rgba(150,150,150,0.2)` at 1.19:1 light / 1.37:1 dark against `--card`: below
 * the WCAG 1.4.11 3:1 floor in BOTH arms, which is why this pair is the one the
 * wave's contrast gate names. At 0.8 of `--muted-foreground` the same marks
 * measure 3.380 / 4.038 (this seat's arithmetic; the harness re-derives it live).
 */
const AXIS_ALPHA = 0.8;

/** The minor rules are orientation texture, not data: deliberately below the floor. */
const MINOR_GRID_ALPHA = 0.12;

/**
 * Draw minor grid lines and axes onto a canvas context.
 *
 * `ink` is a RESOLVED colour — the used value the cascade produced, read from
 * the canvas by its caller — not a token expression and not a frozen literal.
 * That is the whole of `D-1`'s "theme-blind by enumeration": a hard-coded grey
 * cannot follow a theme, and a `var()` string cannot be painted by Canvas2D.
 */
export function drawPlotGrid(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    pad: PlotPadding,
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
    toScreen: (x: number, y: number) => [number, number],
    ink: string,
): void {
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const xStep = niceStep((maxX - minX) / Math.max(4, plotW / 60));
    const yStep = niceStep((maxY - minY) / Math.max(3, plotH / 60));

    const priorAlpha = ctx.globalAlpha;

    // Minor grid lines
    ctx.strokeStyle = ink;
    ctx.globalAlpha = MINOR_GRID_ALPHA;
    ctx.lineWidth = 1;
    for (let x = Math.ceil(minX / xStep) * xStep; x <= maxX; x += xStep) {
        const [sx] = toScreen(x, 0);
        ctx.beginPath();
        ctx.moveTo(sx, pad.top);
        ctx.lineTo(sx, h - pad.bottom);
        ctx.stroke();
    }
    for (let y = Math.ceil(minY / yStep) * yStep; y <= maxY; y += yStep) {
        const [, sy] = toScreen(0, y);
        ctx.beginPath();
        ctx.moveTo(pad.left, sy);
        ctx.lineTo(w - pad.right, sy);
        ctx.stroke();
    }

    // Axes
    ctx.globalAlpha = AXIS_ALPHA;
    ctx.lineWidth = 1.5;
    if (minY <= 0 && maxY >= 0) {
        const [, zy] = toScreen(0, 0);
        ctx.beginPath();
        ctx.moveTo(pad.left, zy);
        ctx.lineTo(w - pad.right, zy);
        ctx.stroke();
    }
    if (minX <= 0 && maxX >= 0) {
        const [zx] = toScreen(0, 0);
        ctx.beginPath();
        ctx.moveTo(zx, pad.top);
        ctx.lineTo(zx, h - pad.bottom);
        ctx.stroke();
    }

    ctx.globalAlpha = priorAlpha;
}
