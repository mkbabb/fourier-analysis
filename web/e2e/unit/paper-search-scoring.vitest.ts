import { describe, expect, it } from "vitest";
// ⊘ The import lock `.g` minted holds here too: these come from their
// DEFINITIONS, never from `search/index.ts` — the zero-consumer barrel this
// unit deleted under `G-F4-DEAD-DEP`. A test that imports a barrel manufactures
// the consumer whose absence is the proof.
import { wordMatch } from "@/components/paper/search/paperSearchIndex";
import { highlightMatch } from "@/components/paper/search/searchHelpers";

/**
 * X·F F.W4 `.e` — the two search defects that were CONFIRMED BY EXECUTION in
 * the record and could not be seen from a rendered page.
 *
 * `.g`'s `paper-search.vitest.ts` pins `wordMatch`'s ordering contract
 * (X.F.W14U.paper, UIA-F-161: the subsequence scorer `fuzzyMatch` became the
 * word-start `wordMatch`, and `highlightFuzzy` became `highlightMatch`). This
 * file pins the two facts that made the surface wrong in ways an ordering
 * assertion cannot express: a score that goes NEGATIVE for a real hit, and a
 * highlighter that marks the wrong characters.
 */
describe("wordMatch — `PSM-14`, the length penalty", () => {
    // The record's own reproduction: a 458-character lowercase body.
    const BODY =
        "the fourier transform decomposes a function into the frequencies that make it up, " +
        "much as a chord can be expressed as the amplitudes of its constituent notes. " +
        "convergence of the partial sums is the central question of the classical theory, " +
        "and the answer depends on what one means by convergence: pointwise, uniform, " +
        "in the mean square, or almost everywhere. each of these has its own theorem, " +
        "and the distance between them is where the subject lives.";

    it("scores an exact mid-body word hit ABOVE zero (the drop threshold)", () => {
        // Banked: `"fourier"` scored −1.1 over this body and `scoreEntry` drops
        // anything at or below 0 — an exact hit of the word "fourier" in a
        // Fourier paper was DROPPED whenever no other field matched.
        const m = wordMatch("fourier", BODY);
        expect(m).not.toBeNull();
        expect(m!.score).toBeGreaterThan(0);
    });

    it("scores short prefixes above zero — `\"fo\"` and `\"conv\"` were −31.6 and −36.4", () => {
        expect(wordMatch("fo", BODY)!.score).toBeGreaterThan(0);
        expect(wordMatch("conv", BODY)!.score).toBeGreaterThan(0);
    });

    it("still prefers the tighter field — the penalty is re-shaped, not removed", () => {
        const tight = wordMatch("fourier", "fourier series")!.score;
        const loose = wordMatch("fourier", BODY)!.score;
        expect(tight).toBeGreaterThan(loose);
    });

    it("never returns a negative score, at any text length", () => {
        const veryLong = BODY.repeat(6);
        expect(wordMatch("f", veryLong)!.score).toBeGreaterThan(0);
        // UIA-F-161: "series" is not a word of BODY (it matched only as a
        // letter subsequence); "square" is, and the invariant is the same.
        expect(wordMatch("square", veryLong)!.score).toBeGreaterThan(0);
    });
});

describe("highlightMatch — `PSM-28`, code points not code units", () => {
    const marked = (html: string) =>
        [...html.matchAll(/<mark>(.*?)<\/mark>/g)].map((m) => m[1]).join("");

    it("marks the matched characters of an ASCII label", () => {
        expect(marked(highlightMatch("Fourier basis", "basis"))).toBe("basis");
    });

    it("marks correctly after an astral character (was off by one)", () => {
        // The record's executed reproduction: `𝔽` is ONE code point and TWO
        // code units, so indices from a code-unit walk landed one place left of
        // where the code-point renderer put them.
        const html = highlightMatch("𝔽ourier basis", "basis");
        expect(marked(html)).toBe("basis");
        expect(html).toBe("𝔽ourier <mark>basis</mark>");
    });

    it("marks correctly after a character whose lowercase is LONGER (was catastrophic)", () => {
        // `"İ".toLowerCase()` is two code points, so every index after it was
        // shifted: the record's run marked `s`, `t` and `t` in "İstanbul set".
        expect(marked(highlightMatch("İstanbul set", "set"))).toBe("set");
    });

    it("escapes the text it does not mark, including both quote forms", () => {
        const html = highlightMatch(`a <b> & "q" 'r'`, "zzz");
        expect(html).not.toContain("<b>");
        expect(html).toContain("&lt;b&gt;");
        expect(html).toContain("&quot;");
        expect(html).toContain("&#39;");
    });

    it("returns escaped text unchanged when the query matches nothing", () => {
        expect(highlightMatch("Fourier basis", "zzz")).toBe("Fourier basis");
        expect(highlightMatch("Fourier basis", "   ")).toBe("Fourier basis");
    });
});
