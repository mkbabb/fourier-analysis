/**
 * The local spectral lens: near a point on the curve, the curve gives way to
 * a lower partial sum of itself, in a small window along its parameter.
 *
 * P(θ) = F(θ) + depth · g(θ) · (L(θ) − F(θ)), g = exp(−(Δθ/σ)²), Δθ wrapped
 * on the circle. F and L are two partial sums sampled at the same θ_j (the
 * rest form and the lower level). Windowing the removed band in θ is a local
 * low-pass: no point is pushed in the plane, the curve only loses detail
 * there, and at depth 0 it is exactly F.
 */

/**
 * The parameter θ0 in [0, 1) of the point on a sampled closed curve
 * `[x0, y0, ...]` nearest (x, y), projected onto the nearest segment so it
 * moves continuously between samples.
 */
export function nearestParam(points: Float64Array, x: number, y: number): number {
    const m = points.length >> 1;
    if (!m) return 0;
    let best = 0;
    let bestU = 0;
    let bestD = Infinity;
    for (let j = 0; j < m; j++) {
        const ax = points[2 * j]!;
        const ay = points[2 * j + 1]!;
        const k = (j + 1) % m;
        const dx = points[2 * k]! - ax;
        const dy = points[2 * k + 1]! - ay;
        const len2 = dx * dx + dy * dy;
        const u = len2 > 0 ? Math.min(1, Math.max(0, ((x - ax) * dx + (y - ay) * dy) / len2)) : 0;
        const ex = ax + u * dx - x;
        const ey = ay + u * dy - y;
        const d = ex * ex + ey * ey;
        if (d < bestD) {
            bestD = d;
            best = j;
            bestU = u;
        }
    }
    return ((best + bestU) / m) % 1;
}

/**
 * Blend the rest form `full` toward `low` in a window of width `sigma` (in θ)
 * around `theta0`, by `depth` in [0, 1]. Both inputs are `[x0, y0, ...]` at
 * the same m samples; the result is written into `out` and returned.
 */
export function lensBlend(
    full: Float64Array,
    low: Float64Array,
    theta0: number,
    sigma: number,
    depth: number,
    out: Float64Array,
): Float64Array {
    const m = full.length >> 1;
    for (let j = 0; j < m; j++) {
        let d = j / m - theta0;
        d -= Math.round(d);
        const w = sigma > 0 ? depth * Math.exp(-(d * d) / (sigma * sigma)) : 0;
        out[2 * j] = full[2 * j]! + w * (low[2 * j]! - full[2 * j]!);
        out[2 * j + 1] = full[2 * j + 1]! + w * (low[2 * j + 1]! - full[2 * j + 1]!);
    }
    return out;
}
