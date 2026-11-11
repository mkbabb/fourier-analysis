/**
 * Evaluating a spectrum: partial sums along the whole curve (one inverse FFT)
 * and the epicycle chain at one moment.
 */
import { ifft } from "./fft.js";
import { coef, frequencyAt, topOf, weight, type Spectrum } from "./spectrum.js";

/** Reusable buffers for `partialSum` (each of length `m`). */
export interface Scratch {
    re: Float64Array;
    im: Float64Array;
}

/** The default sample count: a power of two, at least 256 and above four times the band. */
export function samplesFor(s: Spectrum): number {
    let m = 256;
    while (m <= 4 * topOf(s)) m <<= 1;
    return m;
}

/**
 * The weighted partial sum S_level(θ) = Σ_k weight(k, level)·c_k·e^{2πikθ} at
 * `m` points θ = j/m, by one inverse FFT. `level` may be fractional (see
 * `weight`); `m` must be a power of two above twice the band in use.
 * Returns `[x0, y0, x1, y1, ...]`, written into `out` when given.
 */
export function partialSum(
    s: Spectrum,
    level: number,
    m: number = samplesFor(s),
    scratch: Scratch = { re: new Float64Array(m), im: new Float64Array(m) },
    out: Float64Array = new Float64Array(2 * m),
): Float64Array {
    const { re, im } = scratch;
    re.fill(0);
    im.fill(0);
    const top = Math.min(topOf(s), Math.ceil(level));
    if (2 * top >= m) throw new RangeError(`partialSum: m = ${m} cannot carry the band ±${top}`);
    for (let k = -top; k <= top; k++) {
        const w = weight(k, level);
        if (!w) continue;
        const [a, b] = coef(s, k);
        const i = (k + m) % m;
        re[i] = re[i]! + w * a;
        im[i] = im[i]! + w * b;
    }
    ifft(re, im);
    for (let j = 0; j < m; j++) {
        out[2 * j] = re[j]!;
        out[2 * j + 1] = im[j]!;
    }
    return out;
}

/** Each spectrum's pair slots in descending amplitude, computed once per array. */
const ORDER = new WeakMap<Float64Array, Uint32Array>();

function amplitudeOrder(s: Spectrum): Uint32Array {
    let order = ORDER.get(s.c);
    if (!order) {
        const pairs = s.c.length >> 1;
        const amp = new Float64Array(pairs);
        for (let j = 0; j < pairs; j++) amp[j] = Math.hypot(s.c[2 * j]!, s.c[2 * j + 1]!);
        // A stable sort over the frequency order: the Python chain's order exactly.
        order = Uint32Array.from(
            Array.from({ length: pairs }, (_, j) => j).sort((a, b) => amp[b]! - amp[a]!),
        );
        ORDER.set(s.c, order);
    }
    return order;
}

/**
 * The curve at θ = `t`, summing the chain's first `terms` vectors (the
 * largest, as the Python `EpicycleChain` orders them); all of them by default.
 */
export function evaluateAt(s: Spectrum, t: number, terms?: number): [number, number] {
    const order = amplitudeOrder(s);
    const n = Math.min(terms ?? order.length, order.length);
    let x = 0;
    let y = 0;
    for (let i = 0; i < n; i++) {
        const j = order[i]!;
        const a = 2 * Math.PI * frequencyAt(j) * t;
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        const re = s.c[2 * j]!;
        const im = s.c[2 * j + 1]!;
        x += re * ca - im * sa;
        y += re * sa + im * ca;
    }
    return [x, y];
}

/**
 * The chain's cumulative positions at θ = `t`: `[0, 0, x1, y1, ...]`, the
 * origin and then the tip of each of the first `terms` vectors in descending
 * amplitude (Python's `positions_at`). The last pair is `evaluateAt(s, t, terms)`.
 */
export function chainAt(s: Spectrum, t: number, terms?: number): Float64Array {
    const order = amplitudeOrder(s);
    const n = Math.min(terms ?? order.length, order.length);
    const out = new Float64Array(2 * (n + 1));
    let x = 0;
    let y = 0;
    for (let i = 0; i < n; i++) {
        const j = order[i]!;
        const a = 2 * Math.PI * frequencyAt(j) * t;
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        const re = s.c[2 * j]!;
        const im = s.c[2 * j + 1]!;
        x += re * ca - im * sa;
        y += re * sa + im * ca;
        out[2 * i + 2] = x;
        out[2 * i + 3] = y;
    }
    return out;
}
