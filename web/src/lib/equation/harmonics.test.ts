// SERVED MODEL: claude-opus-5-5
import { describe, expect, it } from "vitest";
import { revealWeight } from "./harmonics";

// X.F.W14.u — UIA-F-31: a revealed partial sum equals DC + Σ at every sample.
describe("revealWeight", () => {
    const N = 400;
    const BLEND = 10;

    it("weighs every sample 1 once the harmonic is fully revealed (the right edge included)", () => {
        for (let j = 0; j < N; j++) expect(revealWeight(j, N - 1, BLEND, N)).toBe(1);
    });

    it("keeps the leading-edge ramp mid-reveal: 1 behind, a ramp at the cursor, 0 ahead", () => {
        const c = 200;
        expect(revealWeight(c - BLEND, c, BLEND, N)).toBe(1);
        expect(revealWeight(c, c, BLEND, N)).toBeCloseTo(1 / (BLEND + 1));
        expect(revealWeight(c - 5, c, BLEND, N)).toBeCloseTo(6 / (BLEND + 1));
        expect(revealWeight(c + 1, c, BLEND, N)).toBe(0);
    });
});
