/**
 * Curve hit-testing for mouse hover detection.
 */

export interface CurveHitRegion {
    key: string;
    points: [number, number][];
}

/**
 * Find the nearest curve to (mx, my) within a pixel threshold.
 * Samples every 3rd point for performance.
 */
export function hitTestCurves(
    curves: CurveHitRegion[],
    mx: number,
    my: number,
    threshold: number = 12,
): string | null {
    let bestDist = Infinity;
    let bestKey: string | null = null;

    for (const { key, points } of curves) {
        for (let i = 0; i < points.length; i += 3) {
            const [px, py] = points[i];
            const dx = mx - px;
            const dy = my - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < threshold && dist < bestDist) {
                bestDist = dist;
                bestKey = key;
            }
        }
    }
    return bestKey;
}
