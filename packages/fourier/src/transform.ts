/**
 * Contour → spectrum. The Python engine (`fourier_analysis`) stays canonical
 * for image → contour; this is its forward transform written once in
 * TypeScript and held equal to it by golden fixtures (test/golden.test.ts).
 */
import { fft } from "./fft.js";
import { partialSum } from "./evaluate.js";
import { slotOf, topOf, type Spectrum } from "./spectrum.js";

/**
 * Resample a closed polyline `[x0, y0, x1, y1, ...]` to `n` points evenly
 * spaced in arc length, the first on the first vertex. A repeated closing
 * vertex and zero-length steps are ignored. (The Python
 * `resample_arc_length` also weights samples toward turns; this is its
 * `detail=0` case, which is what an even parametrisation needs.)
 */
export function resampleArcLength(points: Float64Array, n: number): Float64Array {
    const xs: number[] = [];
    const ys: number[] = [];
    for (let j = 0; j + 1 < points.length; j += 2) {
        const x = points[j]!;
        const y = points[j + 1]!;
        const k = xs.length;
        if (k && Math.hypot(x - xs[k - 1]!, y - ys[k - 1]!) <= 1e-12) continue;
        xs.push(x);
        ys.push(y);
    }
    while (xs.length > 1 && Math.hypot(xs[0]! - xs[xs.length - 1]!, ys[0]! - ys[ys.length - 1]!) <= 1e-12) {
        xs.pop();
        ys.pop();
    }
    const m = xs.length;
    const out = new Float64Array(2 * n);
    if (m < 2) {
        for (let i = 0; i < n; i++) {
            out[2 * i] = xs[0] ?? 0;
            out[2 * i + 1] = ys[0] ?? 0;
        }
        return out;
    }
    const cum = new Float64Array(m + 1);
    for (let i = 0; i < m; i++) {
        const j = (i + 1) % m;
        cum[i + 1] = cum[i]! + Math.hypot(xs[j]! - xs[i]!, ys[j]! - ys[i]!);
    }
    const total = cum[m]!;
    let seg = 0;
    for (let i = 0; i < n; i++) {
        const s = (i / n) * total;
        while (seg < m - 1 && cum[seg + 1]! <= s) seg++;
        const len = cum[seg + 1]! - cum[seg]!;
        const u = len > 0 ? (s - cum[seg]!) / len : 0;
        const j = (seg + 1) % m;
        out[2 * i] = xs[seg]! + u * (xs[j]! - xs[seg]!);
        out[2 * i + 1] = ys[seg]! + u * (ys[j]! - ys[seg]!);
    }
    return out;
}

/**
 * The spectrum of a sampled closed curve `[x0, y0, ...]` (N samples, taken as
 * z_j = x_j + i·y_j at θ = j/N), to ±`harmonics`:
 * c_k = (1/N) Σ_j z_j e^{−2πijk/N}. This is `EpicycleChain.from_signal`
 * (`fourier_coefficients` = FFT/N) in frequency order. `harmonics` is
 * clamped to N/2; at exactly N/2 the −N/2 slot is the +N/2 one and stays zero,
 * as Python leaves it out.
 */
export function spectrumOf(points: Float64Array, harmonics: number): Spectrum {
    const n = points.length >> 1;
    const top = Math.max(0, Math.min(Math.floor(harmonics), n >> 1));
    const c = new Float64Array(2 * (2 * top + 1));
    const put = (k: number, re: number, im: number) => {
        const i = slotOf(k);
        c[2 * i] = re / n;
        c[2 * i + 1] = im / n;
    };
    if (n && !(n & (n - 1))) {
        const re = new Float64Array(n);
        const im = new Float64Array(n);
        for (let j = 0; j < n; j++) {
            re[j] = points[2 * j]!;
            im[j] = points[2 * j + 1]!;
        }
        fft(re, im);
        put(0, re[0]!, im[0]!);
        for (let k = 1; k <= top; k++) {
            put(k, re[k]!, im[k]!);
            if (2 * k !== n) put(-k, re[n - k]!, im[n - k]!);
        }
        return { c };
    }
    // Not a power of two: the direct sum, only for the 2·top + 1 harmonics kept.
    for (let k = -top; k <= top; k++) {
        if (k < 0 && -2 * k === n) continue;
        let re = 0;
        let im = 0;
        for (let j = 0; j < n; j++) {
            const a = (-2 * Math.PI * ((k * j) % n)) / n;
            const ca = Math.cos(a);
            const sa = Math.sin(a);
            const x = points[2 * j]!;
            const y = points[2 * j + 1]!;
            re += x * ca - y * sa;
            im += x * sa + y * ca;
        }
        put(k, re, im);
    }
    return { c };
}

/**
 * Whether two point sets `[x0, y0, ...]` lie within `eps` of each other
 * (symmetric Hausdorff ≤ eps), on a grid of `eps` cells so each point checks
 * only its neighbourhood.
 */
function withinHausdorff(a: Float64Array, b: Float64Array, eps: number): boolean {
    const covers = (from: Float64Array, to: Float64Array): boolean => {
        const grid = new Map<string, number[]>();
        for (let j = 0; j < to.length; j += 2) {
            const key = `${Math.floor(to[j]! / eps)},${Math.floor(to[j + 1]! / eps)}`;
            const cell = grid.get(key);
            if (cell) cell.push(j);
            else grid.set(key, [j]);
        }
        const e2 = eps * eps;
        for (let j = 0; j < from.length; j += 2) {
            const x = from[j]!;
            const y = from[j + 1]!;
            const gx = Math.floor(x / eps);
            const gy = Math.floor(y / eps);
            let hit = false;
            for (let dx = -1; dx <= 1 && !hit; dx++)
                for (let dy = -1; dy <= 1 && !hit; dy++) {
                    const cell = grid.get(`${gx + dx},${gy + dy}`);
                    if (!cell) continue;
                    for (const i of cell) {
                        const ex = to[i]! - x;
                        const ey = to[i + 1]! - y;
                        if (ex * ex + ey * ey <= e2) {
                            hit = true;
                            break;
                        }
                    }
                }
            if (!hit) return false;
        }
        return true;
    };
    return covers(a, b) && covers(b, a);
}

/**
 * N_c: the least level whose partial sum lies within `epsilon` (Hausdorff, in
 * the curve's units) of the full stored band, capped at `cap`. Both curves are
 * sampled at `m` points (a power of two above twice the band).
 */
export function convergingLevel(s: Spectrum, epsilon: number, cap = Infinity, m?: number): number {
    const top = Math.min(topOf(s), Math.floor(cap));
    const ref = partialSum(s, topOf(s), m);
    for (let level = 0; level < top; level++) {
        if (withinHausdorff(partialSum(s, level, m), ref, epsilon)) return level;
    }
    return top;
}
