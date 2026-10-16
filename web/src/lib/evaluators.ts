/**
 * Client-side Fourier evaluation for real-time rendering: the partial sum at t
 * and the epicycle chain's cumulative positions. The polynomial bases are
 * evaluated server-side; the client-side multi-basis dispatch and its
 * Chebyshev/Legendre evaluators had no caller and are deleted (X.F.W14V.au6,
 * A2-FO-L1-22).
 */

import type { BasisComponent } from "./types";

/** Fourier: sum c_k * exp(2*pi*i*k*t) */
export function evaluateFourier(
    components: BasisComponent[],
    t: number,
    maxTerms?: number,
): [number, number] {
    let re = 0,
        im = 0;
    const n = maxTerms ?? components.length;
    for (let i = 0; i < n && i < components.length; i++) {
        const c = components[i];
        const angle = 2 * Math.PI * c.index * t;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        re += c.coefficient[0] * cos - c.coefficient[1] * sin;
        im += c.coefficient[0] * sin + c.coefficient[1] * cos;
    }
    return [re, im];
}

/** Cumulative positions for epicycle chain (Fourier only) */
export function fourierPositionsAt(
    components: BasisComponent[],
    t: number,
    maxCircles?: number,
): [number, number][] {
    const positions: [number, number][] = [[0, 0]];
    let cx = 0,
        cy = 0;
    const n = maxCircles ?? components.length;
    for (let i = 0; i < n && i < components.length; i++) {
        const c = components[i];
        const angle = 2 * Math.PI * c.index * t;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        cx += c.coefficient[0] * cos - c.coefficient[1] * sin;
        cy += c.coefficient[0] * sin + c.coefficient[1] * cos;
        positions.push([cx, cy]);
    }
    return positions;
}
