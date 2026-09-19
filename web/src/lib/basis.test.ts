import { describe, expect, it } from "vitest";
import { basisModeLabel, normalizeBasisKey, type BasisKey } from "./basis";

/**
 * X.F.W3 `.e` — the unit floor for `fr-BasisSelector M-10`.
 *
 * The seven inline `startsWith("fourier")` sites and the four mode-label
 * ladders agreed with each other by accident, never by construction. These
 * cases are what "by construction" now means.
 */
describe("normalizeBasisKey", () => {
    it("maps BOTH fourier keys onto the one display family", () => {
        expect(normalizeBasisKey("fourier-epicycles")).toBe("fourier");
        expect(normalizeBasisKey("fourier-series")).toBe("fourier");
    });

    it("leaves a non-fourier key alone", () => {
        expect(normalizeBasisKey("chebyshev")).toBe("chebyshev");
        expect(normalizeBasisKey("legendre")).toBe("legendre");
    });

    it("returns an unknown key unchanged, so the display lookup still misses it", () => {
        // Every copy behaved this way and the unification does not change it:
        // an unknown basis is dropped by the caller, never rendered blank.
        expect(normalizeBasisKey("hermite")).toBe("hermite");
    });

    it("is the WAVE-LOCK's predicate: a family filter cannot match a stored key", () => {
        // `active_bases` arrives off the wire as `string[]`, which is why the
        // naive comparison below compiles in the app and returns nothing.
        const stored: string[] = ["fourier-epicycles", "fourier-series"] satisfies BasisKey[];
        // This is the F.W5-W8 defect stated as a test: the naive comparison
        // returns nothing for the Fourier pill, the normalised one returns both.
        expect(stored.filter((b) => b === "fourier")).toHaveLength(0);
        expect(stored.filter((b) => normalizeBasisKey(b) === "fourier")).toHaveLength(2);
    });
});

describe("basisModeLabel", () => {
    it("names the two fourier MODES, which is the only reason the ladder existed", () => {
        expect(basisModeLabel("fourier-epicycles", "Fourier")).toBe("Epicycles");
        expect(basisModeLabel("fourier-series", "Fourier")).toBe("Series");
    });

    it("falls back to the family label for every other key", () => {
        expect(basisModeLabel("chebyshev", "Chebyshev")).toBe("Chebyshev");
        expect(basisModeLabel("legendre", "Legendre")).toBe("Legendre");
        expect(basisModeLabel("hermite", "Hermite")).toBe("Hermite");
    });
});
