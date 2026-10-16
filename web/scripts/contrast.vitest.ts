import { describe, expect, it } from "vitest";
import {
    FLOOR,
    contrastRatio,
    gradeAgainstFloor,
    parseRgb,
    ratioOf,
    relativeLuminance,
} from "./contrast";

/**
 * X·F F.W4 `.g` — the arithmetic half of `G-F4-CONTRAST-FLOOR`, asserted by the
 * unit floor `G-F4-VITEST` stands up.
 *
 * This is the reason the computation is a separate pure module rather than an
 * inline `page.evaluate`: a contrast harness whose arithmetic is unverified
 * produces confident numbers, and confident wrong numbers are how `GAB-1` was
 * argued three different ways before a seat reproduced it. The anchors below
 * are WCAG 2.1's own published values, not this repo's.
 */
describe("contrast arithmetic", () => {
    it("pins the two WCAG floors and does not invent a large-text relief", () => {
        expect(FLOOR.text).toBe(4.5);
        expect(FLOOR["non-text"]).toBe(3);
        expect(Object.keys(FLOOR).sort()).toEqual(["non-text", "text"]);
    });

    it("reproduces the WCAG reference extremes", () => {
        const white = { r: 255, g: 255, b: 255 };
        const black = { r: 0, g: 0, b: 0 };
        expect(relativeLuminance(white)).toBeCloseTo(1, 12);
        expect(relativeLuminance(black)).toBeCloseTo(0, 12);
        expect(contrastRatio(white, black)).toBeCloseTo(21, 10);
        expect(contrastRatio(white, white)).toBeCloseTo(1, 12);
    });

    it("is symmetric — argument order can never change a verdict", () => {
        const a = { r: 17, g: 34, b: 51 };
        const b = { r: 200, g: 190, b: 180 };
        expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 12);
    });

    it("applies the sRGB transfer function, not a naive linear channel", () => {
        // Mid-grey #777777: linear-channel arithmetic gives ~0.467; the WCAG
        // transfer function gives ~0.184. The difference is the whole reason
        // eyeballed ratios disagree with measured ones.
        expect(relativeLuminance({ r: 119, g: 119, b: 119 })).toBeCloseTo(0.1845, 3);
    });

    it("parses both the rgb() and rgba() forms a browser hands back", () => {
        expect(parseRgb("rgb(12, 34, 56)")).toEqual({ r: 12, g: 34, b: 56 });
        expect(parseRgb("rgba(12, 34, 56, 0.5)")).toEqual({ r: 12, g: 34, b: 56 });
        expect(parseRgb("rgb(12 34 56 / 50%)")).toEqual({ r: 12, g: 34, b: 56 });
    });

    it("THROWS on an unresolved colour rather than grading it", () => {
        // The failure this guards: a `var(--x)` that never resolved would
        // otherwise be silently read as black and produce a flattering 21:1 —
        // a green gate bought with a parse bug.
        expect(() => parseRgb("var(--background)")).toThrow(/cannot parse/);
        expect(() => parseRgb("oklch(0.72 0.19 149.5)")).toThrow(/cannot parse/);
        expect(() => parseRgb("rgb(300, 0, 0)")).toThrow(/out of sRGB range/);
    });

    it("grades text and non-text against different floors at the same ratio", () => {
        // ~3.61:1 — the live light-arm reading of `--section-color-11`, the
        // worst of `PS D-M4 extended`'s four stops — passes 1.4.11 and fails
        // 1.4.3. A harness carrying one floor would call that surface clean.
        // The pair here is a neutral of the same luminance, so the assertion
        // pins the BRANCH and never the ramp's own colour (which `.e` cures).
        const ink = "rgb(132, 132, 132)";
        const plate = "rgb(251, 250, 248)";
        const ratio = ratioOf(ink, plate);
        expect(ratio).toBeGreaterThan(3);
        expect(ratio).toBeLessThan(4.5);
        expect(gradeAgainstFloor(ink, plate, "non-text").passes).toBe(true);
        expect(gradeAgainstFloor(ink, plate, "text").passes).toBe(false);
    });

    it("treats the floor as inclusive — exactly 3:1 is a pass, not a fail", () => {
        const verdict = gradeAgainstFloor("rgb(0, 0, 0)", "rgb(255, 255, 255)", "text");
        expect(verdict.passes).toBe(true);
        expect(verdict.floor).toBe(4.5);
        expect(verdict.ratio).toBeCloseTo(21, 10);
    });
});
