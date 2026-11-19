import { describe, expect, it } from "vitest";
import { alignClosed, blendClosed, closedPolylinePath, sampleClosedSpline, simplifyClosedPoints, type Point2D } from "./contourEditing";

/** A circle of radius 1 as `n` points. */
function circle(n: number, r = 1): Point2D[] {
    return Array.from({ length: n }, (_, i) => ({ x: r * Math.cos((2 * Math.PI * i) / n), y: r * Math.sin((2 * Math.PI * i) / n) }));
}

describe("sampleClosedSpline", () => {
    it("samples the spline at the asked count, evenly along it, from the first point", () => {
        const s = sampleClosedSpline(circle(40), 64);
        expect(s).toHaveLength(64);
        expect(s[0].x).toBeCloseTo(1, 6);
        expect(s[0].y).toBeCloseTo(0, 6);
        for (const p of s) expect(Math.hypot(p.x, p.y)).toBeCloseTo(1, 2);
        const chords = s.map((p, i) => Math.hypot(s[(i + 1) % 64].x - p.x, s[(i + 1) % 64].y - p.y));
        expect(Math.max(...chords) - Math.min(...chords)).toBeLessThan(1e-3);
    });

    it("gives two outlines of different point counts one correspondence", () => {
        const dense = circle(400);
        const sparse = simplifyClosedPoints(dense, 0.8);
        expect(sparse.length).toBeLessThan(dense.length);
        const a = sampleClosedSpline(dense, 128);
        const b = alignClosed(sampleClosedSpline(sparse, 128), a);
        expect(b).toHaveLength(a.length);
        for (let i = 0; i < a.length; i++) expect(Math.hypot(a[i].x - b[i].x, a[i].y - b[i].y)).toBeLessThan(0.02);
    });
});

describe("alignClosed", () => {
    it("turns an outline to start nearest the other's start", () => {
        const a = circle(16);
        const turned = [...a.slice(5), ...a.slice(0, 5)];
        expect(alignClosed(turned, a)).toEqual(a);
    });
});

describe("blendClosed", () => {
    it("is the first outline at 0, the second at 1, and between them midway", () => {
        const a = sampleClosedSpline(circle(30, 1), 32);
        const b = sampleClosedSpline(circle(30, 2), 32);
        expect(blendClosed(a, b, 0)).toEqual(a);
        expect(blendClosed(a, b, 1)).toEqual(b);
        for (const p of blendClosed(a, b, 0.5)) expect(Math.hypot(p.x, p.y)).toBeCloseTo(1.5, 2);
    });
});

describe("closedPolylinePath", () => {
    it("draws the points as one closed path", () => {
        expect(closedPolylinePath([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }])).toBe("M0,0L1,0L1,1Z");
    });
});
