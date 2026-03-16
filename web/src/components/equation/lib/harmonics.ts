/**
 * Harmonic animation math, trig grouping, and spectrum colors.
 */

import { easeInOutSine } from "@mkbabb/value.js";
import type { FourierTermDTO } from "@/lib/equation/types";

// ── Trig harmonic grouping ──

export interface TrigHarmonic {
    k: number;   // |n|
    a_n: number; // cosine coefficient
    b_n: number; // sine coefficient
    amplitude: number;
}

/**
 * Group ±n coefficient pairs into trig harmonics: a_n cos(kωx) + b_n sin(kωx).
 * Returns sorted by k, capped at `maxK` entries.
 */
export function groupTrigHarmonics(
    coefficients: FourierTermDTO[],
    maxK: number = Infinity,
): TrigHarmonic[] {
    const seen = new Set<number>();
    const out: TrigHarmonic[] = [];

    for (const c of coefficients) {
        if (c.n === 0) continue;
        const k = Math.abs(c.n);
        if (seen.has(k)) continue;
        seen.add(k);

        const pos = coefficients.find((h) => h.n === k);
        const neg = coefficients.find((h) => h.n === -k);
        const crP = pos?.coefficient_re ?? 0;
        const ciP = pos?.coefficient_im ?? 0;
        const crN = neg?.coefficient_re ?? 0;
        const ciN = neg?.coefficient_im ?? 0;

        const a_n = crP + crN;
        const b_n = -(ciP - ciN);
        const amp = Math.sqrt(a_n * a_n + b_n * b_n);
        if (amp > 1e-14) out.push({ k, a_n, b_n, amplitude: amp });
    }

    out.sort((a, b) => a.k - b.k);
    return maxK < Infinity ? out.slice(0, maxK) : out;
}

// ── Animation progress ──

/**
 * Compute how far across the x-axis harmonic `idx` has drawn (0..1).
 *
 * Each harmonic gets at least 25% of the timeline. Start points are
 * distributed evenly. Local fraction uses easeInOutSine.
 */
export function harmonicProgress(
    idx: number,
    total: number,
    globalEasedT: number,
): number {
    if (total <= 0) return 1;

    const minWindow = 0.25;
    const sliceW = Math.max(minWindow, 1 / total);
    const availableRange = Math.max(0, 1 - sliceW);
    const start = total > 1 ? idx * (availableRange / (total - 1)) : 0;
    const end = start + sliceW;

    if (globalEasedT <= start) return 0;
    if (globalEasedT >= end) return 1;
    const localFrac = (globalEasedT - start) / (end - start);
    return easeInOutSine(localFrac);
}

// ── Colors ──

/** HSL spectrum color for harmonic index `i` out of `total`. */
export function spectrumColor(
    i: number,
    total: number,
    alpha: number = 1,
): string {
    const hue = (1 - i / Math.max(total - 1, 1)) * 300;
    return `hsla(${hue}, 85%, 55%, ${alpha})`;
}
