/**
 * FORTY-SIXTH G (FORTY-EIGHTH: "a better way to display partial progress"):
 * while a picture computes, the drawing found so far writes itself in along
 * its own length, and when the drawing lands its circles grow in term by term,
 * the largest first, each new one from nothing.
 */
import { describe, expect, it } from "vitest";
import { chainGrowth, grownCircles, prefixOf } from "./canvas-drawing";

describe("the found lines write themselves in", () => {
    // An L: 30 along x, then 40 up y (70 long).
    const line = Float64Array.of(0, 0, 30, 0, 30, 40);

    it("draws nothing at the start and the whole line at the end", () => {
        expect(prefixOf(line, 0)).toEqual({ last: 0, x: 0, y: 0 });
        expect(prefixOf(line, 1)).toEqual({ last: 2, x: 30, y: 40 });
    });

    it("ends its prefix at that share of the line's own length, round the corner", () => {
        expect(prefixOf(line, 15 / 70)).toEqual({ last: 0, x: 15, y: 0 });
        const p = prefixOf(line, 50 / 70);
        expect(p.last).toBe(1);
        expect(p.x).toBeCloseTo(30);
        expect(p.y).toBeCloseTo(20);
    });
});

describe("the landing chain grows term by term", () => {
    it("starts with no circle and ends with every circle it shows", () => {
        expect(grownCircles(80, 0)).toBe(0);
        expect(grownCircles(80, 1)).toBe(80);
        expect(grownCircles(80, 2)).toBe(80);
    });

    it("never takes a circle back", () => {
        let last = -1;
        for (let k = 0; k <= 1; k += 0.01) {
            const n = grownCircles(80, k);
            expect(n).toBeGreaterThanOrEqual(last);
            last = n;
        }
    });

    it("gives the largest circles their own time: the first alone for a sixth of the growth, the last half in its final sixth", () => {
        expect(grownCircles(80, 1 / 6)).toBeLessThanOrEqual(1.1);
        expect(grownCircles(80, 5 / 6)).toBeLessThan(40);
    });

    it("grows the newest circle from nothing, never popping in whole", () => {
        expect(chainGrowth(0)).toEqual({ drawn: 0, share: 0 });
        expect(chainGrowth(2.25)).toEqual({ drawn: 3, share: 0.25 });
        expect(chainGrowth(3)).toEqual({ drawn: 3, share: 1 });
    });
});
