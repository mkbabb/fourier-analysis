/**
 * A closed curve's Fourier series, stored flat in frequency order.
 *
 * The harmonics are 0, +1, -1, +2, -2, ... up to ±top, each as an [re, im]
 * pair: `c = [re0, im0, re+1, im+1, re-1, im-1, ...]`. The curve is
 * `z(θ) = Σ_k c_k e^{2πikθ}` for θ in [0, 1), with x = Re z and y = Im z.
 * This is the one wire shape between the fourier API, the fourier web app and
 * any other consumer.
 */
export interface Spectrum {
    /** [re0, im0, re+1, im+1, re-1, im-1, ...] up to ±top. */
    c: Float64Array;
    /** N_c, the converging level, when the producer measured one. */
    n?: number;
}

/** One rotating vector of an epicycle chain, as the fourier API sends it. */
export interface BasisComponent {
    /** The frequency k. */
    index: number;
    /** c_k as [re, im]. */
    coefficient: [number, number];
    amplitude: number;
    phase: number;
}

/** The highest harmonic a spectrum stores. */
export const topOf = (s: Spectrum): number => (s.c.length / 2 - 1) / 2;

/** The pair slot of frequency `k` in the flat order. */
export const slotOf = (k: number): number => (k === 0 ? 0 : k > 0 ? 2 * k - 1 : -2 * k);

/** The frequency stored at pair slot `j` (the inverse of `slotOf`). */
export const frequencyAt = (j: number): number => (j === 0 ? 0 : j % 2 ? (j + 1) / 2 : -j / 2);

/** The coefficient of harmonic `k`, or zero past the stored band. */
export function coef(s: Spectrum, k: number): [number, number] {
    const i = slotOf(k);
    return 2 * i + 1 < s.c.length ? [s.c[2 * i]!, s.c[2 * i + 1]!] : [0, 0];
}

const smoothstep = (x: number): number => {
    const t = Math.min(1, Math.max(0, x));
    return t * t * (3 - 2 * t);
};

/**
 * The weight of the pair ±k at a fractional `level`: 0 at or below k − 1,
 * 1 from k up, smoothstep between. A level that moves continuously moves the
 * curve continuously, so no harmonic pops in.
 */
export const weight = (k: number, level: number): number => (k === 0 ? 1 : smoothstep(level - Math.abs(k) + 1));

/**
 * The spectrum as epicycle components in descending amplitude (ties keep the
 * frequency order), the order the Python `EpicycleChain` and the API use.
 */
export function toComponents(s: Spectrum): BasisComponent[] {
    const out: BasisComponent[] = [];
    for (let j = 0; 2 * j + 1 < s.c.length; j++) {
        const re = s.c[2 * j]!;
        const im = s.c[2 * j + 1]!;
        out.push({ index: frequencyAt(j), coefficient: [re, im], amplitude: Math.hypot(re, im), phase: Math.atan2(im, re) });
    }
    return out.sort((a, b) => b.amplitude - a.amplitude);
}

/** Components in any order back to a spectrum. */
export function fromComponents(cs: readonly BasisComponent[]): Spectrum {
    let top = 0;
    for (const c of cs) top = Math.max(top, Math.abs(c.index));
    const c = new Float64Array(2 * (2 * top + 1));
    for (const { index, coefficient } of cs) {
        const i = slotOf(index);
        c[2 * i] = coefficient[0];
        c[2 * i + 1] = coefficient[1];
    }
    return { c };
}
