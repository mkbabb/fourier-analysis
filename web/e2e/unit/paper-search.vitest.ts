import { describe, expect, it } from "vitest";
// ⊘ IMPORT LOCK, minted by `DECISIONS-F.W4.md` D6 and binding on this file:
// `wordMatch` is imported from its DEFINITION (`./paperSearchIndex`), NEVER
// from `search/index.ts`. That barrel is the zero-consumer file the SCRUB
// deletes under `G-F4-DEAD-DEP` (§2.L: *"PSM's zero-consumer `search/index.ts`"*,
// `.e` step 8). A test importing the barrel MANUFACTURES a consumer and
// falsifies `.e`'s zero-consumer proof — a green gate bought by reddening
// another. Do not "tidy" this into the barrel.
import { wordMatch } from "@/components/paper/search/paperSearchIndex";

/**
 * X·F F.W4 `.g` — `G-F4-VITEST`, assertion subject 2 of the four `D6` names.
 *
 * X.F.W14U.paper — UIA-F-161 (register: "fuzzy matching returns irrelevant
 * results and scatters single-letter highlights"): the subsequence scorer is
 * replaced by `wordMatch`, a WORD-START matcher; the subsequence-era
 * assertions below are INVERTED to the new contract, none deleted.
 *
 * `wordMatch` is `PSM-14`'s scoring function: a pure word-start scorer whose
 * failure mode is *valid-and-wrong ordering* — it always returns a number, and
 * nothing downstream can tell a mis-ranked result from a correct one. Playwright
 * cannot substitute (`R-20`): the dropdown renders whatever order it is given.
 *
 * ⊘ These assertions pin the CONTRACT the docblock states, not the constants:
 * they are written as ORDERINGS and INVARIANTS wherever a bonus weight could be
 * re-tuned, so `PSM-14`'s open relay (the scoring formula goes to the glass
 * relay per §5.2) can re-tune weights without a false RED — while a broken
 * word-start rule, a lost tie-break or a dropped tightness penalty still fails.
 */
describe("wordMatch", () => {
    it("requires the pattern to begin a word (word-start prefix, not subsequence)", () => {
        expect(wordMatch("four", "fourier")).not.toBeNull();
        expect(wordMatch("fur", "fourier")).toBeNull();
        expect(wordMatch("ruf", "fourier")).toBeNull();
        expect(wordMatch("fourierx", "fourier")).toBeNull();
    });

    it("returns the matched indices: one contiguous run, pattern-length-many", () => {
        const m = wordMatch("four", "fourier");
        expect(m).not.toBeNull();
        expect(m!.matches).toHaveLength(4);
        expect(m!.matches.every((idx, k) => k === 0 || idx === m!.matches[k - 1] + 1)).toBe(true);
        expect(m!.matches.map((i: number) => "fourier"[i]).join("")).toBe("four");
    });

    it("treats the empty pattern as a zero-score match, not as a failure", () => {
        expect(wordMatch("", "anything")).toEqual({ score: 0, matches: [] });
    });

    it("ranks a start-of-string match above the same match mid-string", () => {
        const head = wordMatch("se", "series expansion")!;
        const tail = wordMatch("se", "the series")!;
        expect(head.score).toBeGreaterThan(tail.score);
    });

    it("matches a contiguous run at a word start; the same characters scattered match nothing", () => {
        expect(wordMatch("abc", "z abcz")).not.toBeNull();
        expect(wordMatch("abc", "z azbzcz")).toBeNull();
    });

    it("matches at a word-separator boundary; an interior occurrence matches nothing", () => {
        expect(wordMatch("t", "fourier transform")).not.toBeNull();
        expect(wordMatch("t", "aaaataaaaaaaaaaa")).toBeNull();
    });

    it("ranks a whole-word hit above the same prefix of a longer word", () => {
        const whole = wordMatch("series", "the series")!;
        const prefix = wordMatch("series", "the seriesx")!;
        expect(whole.score).toBeGreaterThan(prefix.score);
    });

    it("penalises excess text length, so the tighter of two equal matches wins", () => {
        const tight = wordMatch("fft", "fft")!;
        const loose = wordMatch("fft", "fft in a very long trailing heading")!;
        expect(tight.score).toBeGreaterThan(loose.score);
    });
});
