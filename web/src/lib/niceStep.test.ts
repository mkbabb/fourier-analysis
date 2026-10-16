// SERVED MODEL: claude-opus-5-5
/**
 * X.F.W14V.au2 — A2-FO-L1-23: the "nice number" grid step is written once and
 * read by both canvases (the /equation plot's grid and the /visualize canvas
 * grid). The step is the 1-2-5 ladder at or above the raw step.
 */
import { describe, expect, it } from "vitest";

import { niceStep } from "./niceStep";

describe("niceStep (A2-FO-L1-23)", () => {
    it("rounds a raw step up the 1-2-5 ladder of its decade", () => {
        expect(niceStep(0.013)).toBeCloseTo(0.02);
        expect(niceStep(0.3)).toBeCloseTo(0.5);
        expect(niceStep(7)).toBeCloseTo(10);
        expect(niceStep(1.5)).toBeCloseTo(2);
        expect(niceStep(40)).toBeCloseTo(50);
        expect(niceStep(420)).toBeCloseTo(500);
    });

    it("keeps the decade edges both canvases drew before (norm 1 → 2, 2 → 2, 5 → 5)", () => {
        expect(niceStep(1)).toBeCloseTo(2);
        expect(niceStep(2)).toBeCloseTo(2);
        expect(niceStep(5)).toBeCloseTo(5);
        expect(niceStep(0.05)).toBeCloseTo(0.05);
    });
});
