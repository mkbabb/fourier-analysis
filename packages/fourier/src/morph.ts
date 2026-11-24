/**
 * One curve becoming another, in the coefficients themselves. Two spectra over
 * the same band morph circle by circle (each grows or shrinks, each arm turns
 * the short way); `alignStart` first lines the new curve's start up with the
 * old one's, so nothing spins on the way; `circleBetween` is the one circle a
 * morph can pass through, the size of both shapes, so the way from a rose to a
 * Lissajous figure is never a dot or a tangle.
 */
import { slotOf, topOf, type Spectrum } from "./spectrum.js";

const TAU = 2 * Math.PI;

/** |c_k|² summed over 1 ≤ |k| ≤ `top`, square-rooted: the curve's size about its centre. */
function sizeOf(s: Spectrum, top: number): number {
    const last = Math.min(top, topOf(s));
    let e = 0;
    for (let k = 1; k <= last; k++) {
        for (const i of [slotOf(k), slotOf(-k)]) e += s.c[2 * i]! ** 2 + s.c[2 * i + 1]! ** 2;
    }
    return Math.sqrt(e);
}

/**
 * `b` with its parameter shifted so it starts where `a` does: the shift τ
 * (a turn in `steps` parts, then refined) that best matches the two curves'
 * first `terms` harmonics, applied as c_k · e^{2πikτ}. The curve is the same;
 * only where θ = 0 falls on it moves.
 */
export function alignStart(a: Spectrum, b: Spectrum, terms = 24, steps = 720): Spectrum {
    const top = Math.min(terms, topOf(a), topOf(b));
    // Re Σ a_k · conj(b_k e^{2πikτ}): the match at a shift τ.
    const match = (tau: number): number => {
        let v = 0;
        for (let k = -top; k <= top; k++) {
            if (!k) continue;
            const i = slotOf(k);
            const ang = TAU * k * tau;
            const ca = Math.cos(ang);
            const sa = Math.sin(ang);
            const br = b.c[2 * i]! * ca - b.c[2 * i + 1]! * sa;
            const bi = b.c[2 * i]! * sa + b.c[2 * i + 1]! * ca;
            v += a.c[2 * i]! * br + a.c[2 * i + 1]! * bi;
        }
        return v;
    };
    let best = 0;
    let bestV = -Infinity;
    for (let j = 0; j < steps; j++) {
        const v = match(j / steps);
        if (v > bestV) {
            bestV = v;
            best = j / steps;
        }
    }
    // A golden-section refinement inside the winning step.
    let lo = best - 1 / steps;
    let hi = best + 1 / steps;
    const g = (Math.sqrt(5) - 1) / 2;
    for (let it = 0; it < 24; it++) {
        const m1 = hi - g * (hi - lo);
        const m2 = lo + g * (hi - lo);
        if (match(m1) >= match(m2)) hi = m2;
        else lo = m1;
    }
    const tau = (lo + hi) / 2;
    const c = new Float64Array(b.c.length);
    for (let j = 0; 2 * j + 1 < c.length; j++) {
        const k = j === 0 ? 0 : j % 2 ? (j + 1) / 2 : -j / 2;
        const ang = TAU * k * tau;
        const ca = Math.cos(ang);
        const sa = Math.sin(ang);
        c[2 * j] = b.c[2 * j]! * ca - b.c[2 * j + 1]! * sa;
        c[2 * j + 1] = b.c[2 * j]! * sa + b.c[2 * j + 1]! * ca;
    }
    return { c };
}

/**
 * The spectrum `s` of the way from `a` (s = 0) to `b` (s = 1), polar per
 * coefficient: each |c_k| moves linearly and each arm turns the short way
 * round (an arm that is not there takes the other's angle). The band is the
 * wider of the two; written into `out` when given (no allocation).
 */
export function morphSpectra(a: Spectrum, b: Spectrum, s: number, out?: Float64Array): Spectrum {
    const len = Math.max(a.c.length, b.c.length);
    const c = out ?? new Float64Array(len);
    if (c.length !== len) throw new RangeError(`morphSpectra: out has ${c.length} values, the band needs ${len}`);
    for (let i = 0; 2 * i + 1 < len; i++) {
        const ar = 2 * i + 1 < a.c.length ? a.c[2 * i]! : 0;
        const ai = 2 * i + 1 < a.c.length ? a.c[2 * i + 1]! : 0;
        const br = 2 * i + 1 < b.c.length ? b.c[2 * i]! : 0;
        const bi = 2 * i + 1 < b.c.length ? b.c[2 * i + 1]! : 0;
        const ra = Math.hypot(ar, ai);
        const rb = Math.hypot(br, bi);
        let fa = Math.atan2(ai, ar);
        let fb = Math.atan2(bi, br);
        if (ra < 1e-12) fa = fb;
        if (rb < 1e-12) fb = fa;
        let df = fb - fa;
        df -= TAU * Math.round(df / TAU);
        const r = ra + (rb - ra) * s;
        const f = fa + df * s;
        c[2 * i] = r * Math.cos(f);
        c[2 * i + 1] = r * Math.sin(f);
    }
    return { c };
}

/**
 * The one circle between `a` and `b`: the pair k = +1 alone, its radius
 * `scale` times the mean of the two curves' sizes over their first `terms`
 * harmonics, its arm at `a`'s first harmonic (or `b`'s, when `a` has next to
 * none there), its centre midway between theirs. The band is the wider one.
 */
export function circleBetween(a: Spectrum, b: Spectrum, terms = 24, scale = 0.92): Spectrum {
    const len = Math.max(a.c.length, b.c.length);
    const r = (scale * (sizeOf(a, terms) + sizeOf(b, terms))) / 2;
    const first = (s: Spectrum): [number, number] => (s.c.length > 3 ? [s.c[2]!, s.c[3]!] : [0, 0]);
    const [a1r, a1i] = first(a);
    const [b1r, b1i] = first(b);
    const phase =
        Math.hypot(a1r, a1i) > 0.05 * r ? Math.atan2(a1i, a1r) : Math.hypot(b1r, b1i) > 0.05 * r ? Math.atan2(b1i, b1r) : 0;
    const c = new Float64Array(len);
    c[0] = (a.c[0]! + b.c[0]!) / 2;
    c[1] = (a.c[1]! + b.c[1]!) / 2;
    if (len > 3) {
        c[2] = r * Math.cos(phase);
        c[3] = r * Math.sin(phase);
    }
    return { c };
}
