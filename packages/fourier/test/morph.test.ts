/** FORTY-SIXTH B: a curve becoming another, in its coefficients. */
import { describe, expect, it } from "vitest";
import { alignStart, chainAt, circleBetween, coef, evaluateAt, morphSpectra, partialSum, resampleArcLength, spectrumOf, topOf } from "../src/index";

const TAU = 2 * Math.PI;

/** A closed curve sampled at `m` points, as `[x0, y0, ...]`. */
function curve(fn: (u: number) => [number, number], m = 1024): Float64Array {
    const out = new Float64Array(2 * m);
    for (let j = 0; j < m; j++) [out[2 * j], out[2 * j + 1]] = fn(j / m);
    return out;
}
const rose = spectrumOf(resampleArcLength(curve((u) => { const t = TAU * u / 2; const r = Math.cos(5 * t); return [r * Math.cos(t), r * Math.sin(t)]; }), 1024), 160);
const lissajous = spectrumOf(resampleArcLength(curve((u) => [Math.sin(3 * TAU * u + Math.PI / 2), Math.sin(2 * TAU * u)]), 1024), 160);
const ellipse = spectrumOf(curve((u) => [2 * Math.cos(TAU * u), Math.sin(TAU * u)]), 64);

describe("alignStart", () => {
    it("finds the shift that put a curve's start elsewhere, and keeps the curve", () => {
        const tau = 0.2137;
        const c = new Float64Array(rose.c.length);
        for (let j = 0; 2 * j + 1 < c.length; j++) {
            const k = j === 0 ? 0 : j % 2 ? (j + 1) / 2 : -j / 2;
            const ca = Math.cos(TAU * k * tau), sa = Math.sin(TAU * k * tau);
            c[2 * j] = rose.c[2 * j]! * ca - rose.c[2 * j + 1]! * sa;
            c[2 * j + 1] = rose.c[2 * j]! * sa + rose.c[2 * j + 1]! * ca;
        }
        const back = alignStart(rose, { c });
        // It starts where the rose starts...
        const [x0, y0] = evaluateAt(rose, 0);
        const [x1, y1] = evaluateAt(back, 0);
        expect(Math.hypot(x1 - x0, y1 - y0)).toBeLessThan(1e-6);
        // ...and every |c_k| is the shifted curve's own.
        for (let k = -20; k <= 20; k++) expect(Math.hypot(...coef(back, k))).toBeCloseTo(Math.hypot(...coef({ c }, k)), 12);
    });
});

describe("morphSpectra", () => {
    it("is each end at 0 and 1, and in between each circle's radius moves linearly", () => {
        const a = morphSpectra(rose, lissajous, 0);
        const b = morphSpectra(rose, lissajous, 1);
        for (let i = 0; i < rose.c.length; i++) {
            expect(a.c[i]).toBeCloseTo(rose.c[i]!, 12);
            expect(b.c[i]).toBeCloseTo(lissajous.c[i]!, 12);
        }
        const mid = morphSpectra(rose, lissajous, 0.5);
        for (let k = -12; k <= 12; k++) {
            const r = (Math.hypot(...coef(rose, k)) + Math.hypot(...coef(lissajous, k))) / 2;
            expect(Math.hypot(...coef(mid, k))).toBeCloseTo(r, 12);
        }
    });

    it("turns each arm the short way round", () => {
        const a = { c: Float64Array.from([0, 0, Math.cos(3), Math.sin(3), 0, 0]) };
        const b = { c: Float64Array.from([0, 0, Math.cos(-3), Math.sin(-3), 0, 0]) };
        const mid = morphSpectra(a, b, 0.5);
        // From 3 rad to -3 rad the short way crosses π, not 0.
        expect(Math.atan2(mid.c[3]!, mid.c[2]!)).toBeCloseTo(Math.PI, 12);
    });

    it("takes the wider band and writes into `out` without allocating", () => {
        const out = new Float64Array(rose.c.length);
        const got = morphSpectra(ellipse, rose, 0.25, out);
        expect(got.c).toBe(out);
        expect(topOf(got)).toBe(160);
        expect(() => morphSpectra(ellipse, rose, 0.5, new Float64Array(10))).toThrow(RangeError);
    });
});

describe("circleBetween", () => {
    it("is one circle, the size of both shapes, never a dot", () => {
        const c = circleBetween(rose, lissajous);
        const r = Math.hypot(...coef(c, 1));
        for (let k = -160; k <= 160; k++) if (k !== 1 && k !== 0) expect(Math.hypot(...coef(c, k))).toBe(0);
        const size = (s: typeof rose) => {
            let e = 0;
            for (let k = 1; k <= 24; k++) e += Math.hypot(...coef(s, k)) ** 2 + Math.hypot(...coef(s, -k)) ** 2;
            return Math.sqrt(e);
        };
        expect(r).toBeCloseTo((0.92 * (size(rose) + size(lissajous))) / 2, 12);
        // The rose's energy is not at k = ±1, so a way through its first
        // circles would pass a dot; this circle is the size of both.
        expect(Math.hypot(...coef(rose, 1))).toBeLessThan(0.2 * r);
        expect(r).toBeGreaterThan(0.4);
    });

    it("every moment of a morph through it is a curve of size, not a dot", () => {
        const c = circleBetween(rose, lissajous);
        for (const s of [0, 0.25, 0.5, 0.75, 1]) {
            const m = morphSpectra(s <= 0.5 ? rose : c, s <= 0.5 ? c : lissajous, s <= 0.5 ? s / 0.5 : (s - 0.5) / 0.5);
            const pts = partialSum(m, 160, 1024);
            let reach = 0;
            for (let j = 0; j < pts.length; j += 2) reach = Math.max(reach, Math.hypot(pts[j]!, pts[j + 1]!));
            expect(reach, `at ${s}`).toBeGreaterThan(0.4);
        }
    });
});

describe("chainAt in frequency order", () => {
    it("walks 0, +1, -1, +2, ... and ends where the whole sum does", () => {
        const out = new Float64Array(2 * 22);
        const j = chainAt(lissajous, 0.3, 21, { order: "frequency", out });
        expect(j).toBe(out);
        // The first vector is the centre, the second the +1 arm.
        expect(j[2]).toBeCloseTo(lissajous.c[0]!, 12);
        const [r1, i1] = coef(lissajous, 1);
        const a = TAU * 0.3;
        expect(j[4]! - j[2]!).toBeCloseTo(r1 * Math.cos(a) - i1 * Math.sin(a), 12);
        const all = chainAt(lissajous, 0.3, undefined, { order: "frequency" });
        const [x, y] = evaluateAt(lissajous, 0.3);
        expect(all[all.length - 2]).toBeCloseTo(x, 9);
        expect(all[all.length - 1]).toBeCloseTo(y, 9);
    });

    it("refuses an `out` too small for the terms", () => {
        expect(() => chainAt(lissajous, 0, 10, { order: "frequency", out: new Float64Array(4) })).toThrow(RangeError);
    });
});
