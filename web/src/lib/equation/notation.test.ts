import { describe, expect, it } from "vitest";
import { NOTATION_OPTIONS, TIER_INFO, energyColor, tierInfo } from "./notation";

/**
 * X.F.W3 `.e` — the unit floor for `fr-CoefficientsPanel FR-CP-28`'s notation
 * limb.
 *
 * The row books the extraction and the missing tests as ONE motion; the
 * extraction landed at F.W4 and the tests did not, so this file closes the
 * motion rather than opening a new one. Every case is a property the module's
 * own docblocks CLAIM — the tokenised inks, the runtime-live fallback, the
 * energy ladder — so a later edit that quietly breaks one of them fails here
 * instead of on a page.
 */
describe("tierInfo", () => {
    it("answers every tier the type declares", () => {
        for (const tier of ["symbolic", "identified", "spline"] as const) {
            expect(tierInfo(tier)).toBe(TIER_INFO[tier]);
        }
    });

    it("keeps the fallback the type system had proved dead", () => {
        // `L·m-7`: the backend types `tier` as a bare `str`, so the guard is
        // runtime-live even where TypeScript can no longer see why. A regression
        // here is an unlabelled tier chip in production, not a compile error.
        expect(tierInfo("something-the-api-invented")).toBe(TIER_INFO.spline);
        expect(tierInfo("")).toBe(TIER_INFO.spline);
    });
});

describe("TIER_INFO", () => {
    it("routes every ink through the token layer (D·D-B3)", () => {
        // The three inks were hard-coded sRGB triples that BYPASSED the token
        // layer and failed WCAG AA in the light arm. Any hex reappearing here is
        // that defect returning.
        for (const info of Object.values(TIER_INFO)) {
            expect(info.color).toMatch(/^var\(--/);
        }
    });
});

describe("energyColor", () => {
    it("steps at the two thresholds and nowhere else", () => {
        expect(energyColor(1)).toBe(TIER_INFO.symbolic.color);
        expect(energyColor(0.99)).toBe(TIER_INFO.symbolic.color);
        expect(energyColor(0.989)).toBe(TIER_INFO.identified.color);
        expect(energyColor(0.95)).toBe(TIER_INFO.identified.color);
        expect(energyColor(0.949)).toBe(TIER_INFO.spline.color);
        expect(energyColor(0)).toBe(TIER_INFO.spline.color);
    });

    it("is total, including for values outside [0, 1]", () => {
        expect(energyColor(-1)).toBe(TIER_INFO.spline.color);
        expect(energyColor(2)).toBe(TIER_INFO.symbolic.color);
    });
});

describe("NOTATION_OPTIONS", () => {
    it("covers the NotationMode union exactly once each", () => {
        expect(NOTATION_OPTIONS.map((o) => o.value)).toEqual([
            "trig",
            "exponential",
            "polar",
        ]);
    });

    it("routes every notation ink through the palette tokens (UIA-F-241)", () => {
        // X.F.W14V `.u2`: the three hsl literals were blind to the theme; the
        // hues stay fourier's (§0da), carried by the one palette's tokens.
        for (const o of NOTATION_OPTIONS) {
            expect(o.color).toMatch(/^var\(--(viz|section-color)-[a-z0-9-]+\)$/);
        }
    });

    it("spells every glyph as TeX, never a Unicode superscript (UIA-F-241)", () => {
        for (const o of NOTATION_OPTIONS) {
            expect(o.glyph).not.toMatch(/[\u2070-\u209f]/);
        }
    });
});
