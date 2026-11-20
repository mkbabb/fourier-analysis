/**
 * The contour editor's geometry: one morph for every scene change (the
 * spline sampled, aligned and blended), the reach of a drag along the curve,
 * the handle stations, the start of a scene change's travel, and a point added
 * on the line.
 */
import { describe, expect, it } from "vitest";

import {
    alignClosed,
    blendClosed,
    closedPolylinePath,
    handleStations,
    projectOntoSegment,
    reachSamples,
    removedPoints,
    sampleClosedSpline,
    simplifyClosedPoints,
    smoothClosedPoints,
    type Point2D,
} from "./contourEditing";

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

/** A ring of `n` samples, radius `r`: neighbours are 2·r·sin(pi/n) apart. */
function ring(n: number, r = 100): Point2D[] {
    return Array.from({ length: n }, (_, i) => ({
        x: r * Math.cos((2 * Math.PI * i) / n),
        y: r * Math.sin((2 * Math.PI * i) / n),
    }));
}

describe("reachSamples", () => {
    it("is the grabbed sample alone at reach 0", () => {
        expect(reachSamples(ring(64), 5, 0)).toEqual([{ index: 5, along: 0, weight: 1 }]);
    });

    it("covers the same length of curve at every sample density", () => {
        // The old magnet counted samples: 3 each side, whatever they spanned.
        for (const n of [128, 512, 2048]) {
            const pts = ring(n);
            const reach = reachSamples(pts, 0, 40);
            const far = Math.max(...reach.map((s) => Math.abs(s.along)));
            expect(far).toBeLessThan(40);
            expect(far).toBeGreaterThan(40 - (2 * Math.PI * 100) / n);
        }
    });

    it("weights fall from 1 to 0 along the curve, the same on both sides", () => {
        const reach = reachSamples(ring(512), 100, 40);
        const ahead = reach.filter((s) => s.along > 0);
        const behind = reach.filter((s) => s.along < 0);
        expect(ahead.length).toBe(behind.length);
        for (let i = 1; i < ahead.length; i++) expect(ahead[i].weight).toBeLessThan(ahead[i - 1].weight);
        expect(ahead[0].weight).toBeGreaterThan(0.99);
        expect(ahead[ahead.length - 1].weight).toBeLessThan(0.02);
        ahead.forEach((s, i) => expect(s.weight).toBeCloseTo(behind[i].weight, 9));
    });

    it("wraps across the seam and never takes a sample twice", () => {
        const reach = reachSamples(ring(16), 0, 1e6);
        const seen = new Set(reach.map((s) => s.index));
        expect(seen.size).toBe(reach.length);
        expect(seen.has(15)).toBe(true);
        expect(seen.has(1)).toBe(true);
    });
});

describe("handleStations", () => {
    it("stands handles at least the gap apart, the seam included", () => {
        const pts = ring(1024);
        const mask = handleStations(pts, 14);
        const at = [...mask.keys()].filter((i) => mask[i]);
        expect(at[0]).toBe(0);
        const step = (2 * Math.PI * 100) / 1024;
        for (let k = 1; k < at.length; k++) expect((at[k] - at[k - 1]) * step).toBeGreaterThanOrEqual(14 - 1e-9);
        expect((1024 - at[at.length - 1]) * step).toBeGreaterThanOrEqual(14 - step);
        // About one per 14 px of a 628 px curve, never one per sample.
        expect(at.length).toBeGreaterThan(30);
        expect(at.length).toBeLessThan(46);
    });
});

describe("removedPoints", () => {
    it("is what Simplify took, in order", () => {
        const before = ring(200);
        const after = simplifyClosedPoints(before);
        const gone = removedPoints(before, after);
        expect(gone.length).toBe(before.length - after.length);
        for (const p of gone) expect(after.some((q) => q.x === p.x && q.y === p.y)).toBe(false);
    });
});

describe("projectOntoSegment", () => {
    it("drops a press beside the line onto the line", () => {
        expect(projectOntoSegment({ x: 5, y: 10 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toEqual({ x: 5, y: 0 });
    });

    it("holds at the segment's ends", () => {
        expect(projectOntoSegment({ x: -4, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toEqual({ x: 0, y: 0 });
        expect(projectOntoSegment({ x: 3, y: 3 }, { x: 2, y: 2 }, { x: 2, y: 2 })).toEqual({ x: 2, y: 2 });
    });
});

describe("smoothClosedPoints", () => {
    /** A ring of radius 300 sampled every half pixel, with a 2 px ripple of a 6 px wavelength. */
    function rippled(scale = 1): Point2D[] {
        const r = 300;
        const n = Math.round((2 * Math.PI * r) / 0.5);
        const waves = Math.round((2 * Math.PI * r) / 6);
        return Array.from({ length: n }, (_, i) => {
            const a = (2 * Math.PI * i) / n;
            const rr = r + 2 * Math.sin(waves * a);
            return { x: scale * rr * Math.cos(a), y: scale * rr * Math.sin(a) };
        });
    }
    const moved = (a: Point2D[], b: Point2D[]) => Math.max(...a.map((p, i) => Math.hypot(p.x - b[i].x, p.y - b[i].y)));

    it("moves a few-pixel ripple on a dense outline by pixels, not a twentieth of one", () => {
        const before = rippled();
        const d = moved(before, smoothClosedPoints(before));
        expect(d).toBeGreaterThan(1);
        expect(d).toBeLessThan(6);
    });

    it("gives the same outline at any zoom", () => {
        const one = smoothClosedPoints(rippled());
        const eight = smoothClosedPoints(rippled(8));
        for (let i = 0; i < one.length; i += 97) {
            expect(eight[i].x / 8).toBeCloseTo(one[i].x, 6);
            expect(eight[i].y / 8).toBeCloseTo(one[i].y, 6);
        }
    });

    it("keeps the centroid and the count", () => {
        const before = rippled();
        const after = smoothClosedPoints(before);
        expect(after).toHaveLength(before.length);
        const mean = (pts: Point2D[], k: "x" | "y") => pts.reduce((s, p) => s + p[k], 0) / pts.length;
        expect(mean(after, "x")).toBeCloseTo(mean(before, "x"), 9);
        expect(mean(after, "y")).toBeCloseTo(mean(before, "y"), 9);
    });
});
