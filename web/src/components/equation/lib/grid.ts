/**
 * Adaptive grid drawing for the equation convergence plot.
 */

export interface PlotPadding {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

/** Compute a "nice" step size for grid lines given a data range and target count. */
export function niceStep(range: number, targetCount: number): number {
    const raw = range / targetCount;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    if (norm <= 2) return 2 * mag;
    if (norm <= 5) return 5 * mag;
    return 10 * mag;
}

/** Draw minor grid lines and axes onto a canvas context. */
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
): void {
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const xStep = niceStep(maxX - minX, Math.max(4, plotW / 60));
    const yStep = niceStep(maxY - minY, Math.max(3, plotH / 60));

    // Minor grid lines
    ctx.strokeStyle = "rgba(150, 150, 150, 0.07)";
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
    ctx.strokeStyle = "rgba(150, 150, 150, 0.2)";
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
}
