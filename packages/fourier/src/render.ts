/** Drawing a sampled closed curve `[x0, y0, ...]` to a canvas path or an SVG path. */

/** Trace the points into a Path2D or a 2D context as one polyline, closed by default. */
export function tracePath(path: Path2D | CanvasRenderingContext2D, points: ArrayLike<number>, closed = true): void {
    if (points.length < 2) return;
    path.moveTo(points[0]!, points[1]!);
    for (let j = 2; j + 1 < points.length; j += 2) path.lineTo(points[j]!, points[j + 1]!);
    if (closed) path.closePath();
}

/**
 * The points as a closed SVG path `d`: a Catmull-Rom spline through every
 * point (tangents wrap at the seam), emitted at `decimals` places without
 * trailing zeros. Rounding happens at emission, since the control points are
 * computed from the points here.
 */
export function svgPathOf(points: ArrayLike<number>, decimals = 2): string {
    const count = points.length >> 1;
    if (count < 2) return "";
    const f = (v: number) => String(Number(v.toFixed(decimals)));
    const x = (i: number) => points[2 * (((i % count) + count) % count)]!;
    const y = (i: number) => points[2 * (((i % count) + count) % count) + 1]!;
    let d = `M${f(x(0))},${f(y(0))}`;
    for (let i = 0; i < count; i++) {
        const c1x = x(i) + (x(i + 1) - x(i - 1)) / 6;
        const c1y = y(i) + (y(i + 1) - y(i - 1)) / 6;
        const c2x = x(i + 1) - (x(i + 2) - x(i)) / 6;
        const c2y = y(i + 1) - (y(i + 2) - y(i)) / 6;
        d += ` C${f(c1x)},${f(c1y)} ${f(c2x)},${f(c2y)} ${f(x(i + 1))},${f(y(i + 1))}`;
    }
    return `${d} Z`;
}
