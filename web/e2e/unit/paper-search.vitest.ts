import { describe, expect, it } from "vitest";
// ⊘ IMPORT LOCK, minted by `DECISIONS-F.W4.md` D6 and binding on this file:
// `fuzzyMatch` is imported from its DEFINITION (`./paperSearchIndex`), NEVER
// from `search/index.ts`. That barrel is the zero-consumer file the SCRUB
// deletes under `G-F4-DEAD-DEP` (§2.L: *"PSM's zero-consumer `search/index.ts`"*,
// `.e` step 8). A test importing the barrel MANUFACTURES a consumer and
// falsifies `.e`'s zero-consumer proof — a green gate bought by reddening
// another. Do not "tidy" this into the barrel.
import { fuzzyMatch } from "@/components/paper/search/paperSearchIndex";

/**
 * X·F F.W4 `.g` — `G-F4-VITEST`, assertion subject 2 of the four `D6` names.
 *
 * `fuzzyMatch` is `PSM-14`'s scoring function: a pure subsequence scorer whose
 * failure mode is *valid-and-wrong ordering* — it always returns a number, and
 * nothing downstream can tell a mis-ranked result from a correct one. Playwright
 * cannot substitute (`R-20`): the dropdown renders whatever order it is given.
 *
 * ⊘ These assertions pin the CONTRACT the docblock states, not the constants:
 * they are written as ORDERINGS and INVARIANTS wherever a bonus weight could be
 * re-tuned, so `PSM-14`'s open relay (the scoring formula goes to the glass
 * relay per §5.2) can re-tune weights without a false RED — while a broken
 * subsequence rule, a lost tie-break or a dropped tightness penalty still fails.
 */
describe("fuzzyMatch", () => {
    it("requires every pattern character in order (subsequence, not substring)", () => {
        expect(fuzzyMatch("fur", "fourier")).not.toBeNull();
        expect(fuzzyMatch("ruf", "fourier")).toBeNull();
        expect(fuzzyMatch("fourierx", "fourier")).toBeNull();
    });

    it("returns the matched indices, ascending and pattern-length-many", () => {
        const m = fuzzyMatch("fur", "fourier");
        expect(m).not.toBeNull();
        expect(m!.matches).toHaveLength(3);
        expect([...m!.matches].sort((a, b) => a - b)).toEqual(m!.matches);
        expect(m!.matches.map((i) => "fourier"[i]).join("")).toBe("fur");
    });

    it("treats the empty pattern as a zero-score match, not as a failure", () => {
        expect(fuzzyMatch("", "anything")).toEqual({ score: 0, matches: [] });
    });

    it("ranks a start-of-string match above the same match mid-string", () => {
        const head = fuzzyMatch("se", "series expansion")!;
        const tail = fuzzyMatch("se", "the series")!;
        expect(head.score).toBeGreaterThan(tail.score);
    });

    it("ranks a consecutive run above the same characters scattered", () => {
        const run = fuzzyMatch("abc", "zabcz")!;
        const scattered = fuzzyMatch("abc", "zazbzcz")!;
        expect(run.score).toBeGreaterThan(scattered.score);
    });

    it("ranks a word-separator boundary above an interior match", () => {
        const boundary = fuzzyMatch("t", "fourier transform")!;
        const interior = fuzzyMatch("t", "aaaataaaaaaaaaaa")!;
        expect(boundary.score).toBeGreaterThan(interior.score);
    });

    it("ranks a camelCase boundary above an interior lowercase match", () => {
        const camel = fuzzyMatch("T", "fourierTransform")!;
        const interior = fuzzyMatch("t", "fourierxtransform")!;
        expect(camel.score).toBeGreaterThan(interior.score);
    });

    it("penalises excess text length, so the tighter of two equal matches wins", () => {
        const tight = fuzzyMatch("fft", "fft")!;
        const loose = fuzzyMatch("fft", "fft in a very long trailing heading")!;
        expect(tight.score).toBeGreaterThan(loose.score);
    });
});
