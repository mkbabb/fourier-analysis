/**
 * Shared basis evaluation functions.
 * Used by both the main thread (bases.ts) and the web worker (math-worker.ts).
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

/** Chebyshev: sum c_k * T_k(s) via Clenshaw recurrence */
export function evaluateChebyshev(
    components: BasisComponent[],
    s: number,
    maxTerms?: number,
    buffer?: Float64Array,
): number {
    const n = maxTerms ?? components.length;
    let maxDeg = 0;
    for (let i = 0; i < n && i < components.length; i++) {
        if (components[i].index > maxDeg) maxDeg = components[i].index;
    }
    const coeffs = buffer && buffer.length >= maxDeg + 1
        ? (buffer.fill(0, 0, maxDeg + 1), buffer)
        : new Float64Array(maxDeg + 1);
    for (let i = 0; i < n && i < components.length; i++) {
        const c = components[i];
        if (c.index >= 0 && c.index <= maxDeg) {
            coeffs[c.index] = c.coefficient[0];
        }
    }
    if (maxDeg === 0) return coeffs[0];
    let b1 = 0,
        b2 = 0;
    for (let k = maxDeg; k >= 1; k--) {
        const tmp = 2 * s * b1 - b2 + coeffs[k];
        b2 = b1;
        b1 = tmp;
    }
    return s * b1 - b2 + coeffs[0];
}

/** Legendre: sum c_k * P_k(s) via Clenshaw recurrence */
export function evaluateLegendre(
    components: BasisComponent[],
    s: number,
    maxTerms?: number,
    buffer?: Float64Array,
): number {
    const n = maxTerms ?? components.length;
    let maxDeg = 0;
    for (let i = 0; i < n && i < components.length; i++) {
        if (components[i].index > maxDeg) maxDeg = components[i].index;
    }
    const coeffs = buffer && buffer.length >= maxDeg + 1
        ? (buffer.fill(0, 0, maxDeg + 1), buffer)
        : new Float64Array(maxDeg + 1);
    for (let i = 0; i < n && i < components.length; i++) {
        const c = components[i];
        if (c.index >= 0 && c.index <= maxDeg) {
            coeffs[c.index] = c.coefficient[0];
        }
    }
    if (maxDeg === 0) return coeffs[0];
    let b1 = 0,
        b2 = 0;
    for (let k = maxDeg; k >= 1; k--) {
        const tmp =
            ((2 * k + 1) * s * b1) / (k + 1) - ((k + 1) * b2) / (k + 2) + coeffs[k];
        b2 = b1;
        b1 = tmp;
    }
    return s * b1 - b2 / 2 + coeffs[0];
}
