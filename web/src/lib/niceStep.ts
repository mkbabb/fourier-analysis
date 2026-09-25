/**
 * X.F.W14V.au2 — A2-FO-L1-23: the "nice number" grid step, written once. The
 * /equation plot's grid (`components/equation/lib/grid.ts`) and the /visualize
 * canvas grid (`components/visualization/lib/canvas-drawing/grid.ts`) each
 * carried a copy of the same ladder.
 *
 * Returns the step on the 1-2-5 ladder of `raw`'s decade: 2, 5 or 10 times the
 * decade's power of ten (a raw step already on a 2 or a 5 keeps it).
 */
export function niceStep(raw: number): number {
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    if (norm <= 2) return 2 * mag;
    if (norm <= 5) return 5 * mag;
    return 10 * mag;
}
