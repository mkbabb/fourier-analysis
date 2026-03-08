/**
 * Client-side basis evaluation functions for real-time rendering.
 */

import type { BasisComponent, BasisDecomposition } from "./types";
export { evaluateFourier, evaluateChebyshev, evaluateLegendre } from "./evaluators";
import { evaluateFourier, evaluateChebyshev, evaluateLegendre } from "./evaluators";

/** Generic dispatch by basis name */
export function evaluateBasis(
    decomp: BasisDecomposition,
    t: number,
    maxTerms?: number,
): [number, number] {
    if (decomp.basis === "fourier") {
        return evaluateFourier(decomp.components, t, maxTerms);
    }
    // Polynomial bases need s in [-1, 1]
    const s = decomp.domain[0] + (decomp.domain[1] - decomp.domain[0]) * t;
    const evalFn =
        decomp.basis === "chebyshev" ? evaluateChebyshev : evaluateLegendre;
    const val = evalFn(decomp.components, s, maxTerms);
    return [val, 0];
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
