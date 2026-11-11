/** F-L1-2 and the rest of the engine's contract. */
import { describe, expect, it } from "vitest";
import {
    coef,
    convergingLevel,
    fft,
    ifft,
    lensBlend,
    nearestParam,
    partialSum,
    resampleArcLength,
    spectrumOf,
    svgPathOf,
    topOf,
    weight,
} from "../src/index";

function rng(seed: number) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32) * 2 - 1;
}

describe("fft", () => {
    it("ifft(fft(x)) / n = x within 1e-12", () => {
        const r = rng(7);
        for (const n of [1, 2, 8, 64, 1024, 4096]) {
            const re = Float64Array.from({ length: n }, r);
            const im = Float64Array.from({ length: n }, r);
            const re0 = re.slice();
            const im0 = im.slice();
            fft(re, im);
            ifft(re, im);
            let worst = 0;
            for (let i = 0; i < n; i++) worst = Math.max(worst, Math.abs(re[i]! / n - re0[i]!), Math.abs(im[i]! / n - im0[i]!));
            expect(worst).toBeLessThanOrEqual(1e-12);
        }
    });

    it("refuses a length that is not a power of two", () => {
        expect(() => fft(new Float64Array(6), new Float64Array(6))).toThrow(RangeError);
    });
});

describe("weight", () => {
    it("is continuous in level: no pair pops in", () => {
        const d = 1e-6;
        let worst = 0;
        for (let k = 1; k <= 8; k++)
            for (let level = 0; level <= 9; level += 0.001) worst = Math.max(worst, Math.abs(weight(k, level + d) - weight(k, level)));
        expect(worst).toBeLessThanOrEqual(1e-5);
    });

    it("is 1 at or below an integer level and 0 above it", () => {
        expect(weight(0, 0)).toBe(1);
        expect(weight(3, 3)).toBe(1);
        expect(weight(-3, 3)).toBe(1);
        expect(weight(4, 3)).toBe(0);
    });

    it("moves the partial sum continuously", () => {
        const th = Float64Array.from({ length: 2 * 256 }, (_, i) => {
            const t = (2 * Math.PI * (i >> 1)) / 256;
            return i % 2 ? 10 * Math.sin(t) + Math.sin(7 * t) : 10 * Math.cos(t) + Math.cos(5 * t);
        });
        const s = spectrumOf(th, 16);
        let worst = 0;
        for (let level = 0; level < 10; level += 0.01) {
            const a = partialSum(s, level, 256);
            const b = partialSum(s, level + 1e-6, 256);
            for (let i = 0; i < a.length; i++) worst = Math.max(worst, Math.abs(a[i]! - b[i]!));
        }
        expect(worst).toBeLessThanOrEqual(1e-4);
    });
});

describe("transform", () => {
    it("resamples a square evenly in arc length from its first vertex", () => {
        const sq = Float64Array.from([0, 0, 4, 0, 4, 4, 0, 4, 0, 0]);
        const r = resampleArcLength(sq, 8);
        expect(Array.from(r)).toEqual([0, 0, 2, 0, 4, 0, 4, 2, 4, 4, 2, 4, 0, 4, 0, 2]);
    });

    it("stores the flat frequency order and reads it back by k", () => {
        const n = 64;
        const pts = Float64Array.from({ length: 2 * n }, (_, i) => {
            const t = (2 * Math.PI * (i >> 1)) / n;
            // z = 2 e^{3iθ} + 0.5 e^{-2iθ}
            return i % 2 ? 2 * Math.sin(3 * t) - 0.5 * Math.sin(2 * t) : 2 * Math.cos(3 * t) + 0.5 * Math.cos(2 * t);
        });
        const s = spectrumOf(pts, 4);
        expect(topOf(s)).toBe(4);
        expect(coef(s, 3)[0]).toBeCloseTo(2, 12);
        expect(coef(s, -2)[0]).toBeCloseTo(0.5, 12);
        expect(coef(s, 9)).toEqual([0, 0]);
    });

    it("finds the least converging level", () => {
        const n = 256;
        const pts = Float64Array.from({ length: 2 * n }, (_, i) => {
            const t = (2 * Math.PI * (i >> 1)) / n;
            return i % 2 ? 100 * Math.sin(t) + 3 * Math.sin(4 * t) : 100 * Math.cos(t) + 3 * Math.cos(4 * t);
        });
        const s = spectrumOf(pts, 32);
        expect(convergingLevel(s, 0.5)).toBe(4);
        expect(convergingLevel(s, 10)).toBe(1);
        expect(convergingLevel(s, 0.5, 2)).toBe(2);
    });
});

describe("lens", () => {
    const m = 256;
    const circle = (r: number) =>
        Float64Array.from({ length: 2 * m }, (_, i) => (i % 2 ? r * Math.sin((2 * Math.PI * (i >> 1)) / m) : r * Math.cos((2 * Math.PI * (i >> 1)) / m)));

    it("finds the parameter of the nearest point", () => {
        expect(nearestParam(circle(10), 0, 12)).toBeCloseTo(0.25, 3);
        expect(nearestParam(circle(10), 11, -0.5)).toBeGreaterThan(0.99);
    });

    it("changes only the window and is the rest form at depth 0", () => {
        const full = circle(10);
        const low = circle(9);
        const out = new Float64Array(full.length);
        expect(Array.from(lensBlend(full, low, 0.25, 0.05, 0, out))).toEqual(Array.from(full));
        lensBlend(full, low, 0.25, 0.05, 1, out);
        const at = (j: number) => Math.hypot(out[2 * j]!, out[2 * j + 1]!);
        expect(at(m / 4)).toBeCloseTo(9, 9);
        expect(at((3 * m) / 4)).toBeCloseTo(10, 6);
    });
});

describe("svgPathOf", () => {
    it("emits a closed Catmull-Rom path at two places", () => {
        expect(svgPathOf([0, 0, 1, 0, 1, 1, 0, 1])).toBe(
            "M0,0 C0.17,-0.17 0.83,-0.17 1,0 C1.17,0.17 1.17,0.83 1,1 C0.83,1.17 0.17,1.17 0,1 C-0.17,0.83 -0.17,0.17 0,0 Z",
        );
        expect(svgPathOf([1, 2])).toBe("");
    });
});
