// SERVED MODEL: claude-opus-5-5
import { describe, expect, it } from "vitest";
import * as paperEngine from "@/components/paper/search/paperSearchIndex";

/**
 * X.F.W14V.au5 — A2-FO-L1-4 (consumer half). fourier's paper search engine
 * was a fork of glass's internal matcher and still exported the producer's
 * names (`searchIndex`, `clearSearchCache`; the matcher itself became the
 * word-start `wordMatch` at X.F.W14U.paper `cd414b2`). glass 10.1.0 keeps the
 * engine INTERNAL (no `./search` export key), so the paper engine is
 * consumer-owned: it stops shadowing the producer's engine names and keeps
 * only its own domain vocabulary. If glass publishes `./search`, the adopt
 * replaces this module's ranking with the producer's and keeps
 * `buildSearchIndex` (ADOPT-AT-LANDING).
 */

/** glass `src/composables/search/index.ts` runtime exports (read at glass HEAD). */
const GLASS_ENGINE_NAMES = [
    "useFuzzySearch",
    "buildIndex",
    "searchIndex",
    "fuzzyMatch",
    "clearSearchCache",
    "multiTokenFuzzy",
];

describe("A2-FO-L1-4 — the paper engine does not shadow glass's engine", () => {
    it("exports none of the producer's engine names", () => {
        const shadowed = Object.keys(paperEngine).filter((k) => GLASS_ENGINE_NAMES.includes(k));
        expect(shadowed).toEqual([]);
    });

    it("keeps its own domain vocabulary: the index builder, the ranker, the cache drop, the matcher", () => {
        expect(Object.keys(paperEngine).sort()).toEqual(
            ["buildSearchIndex", "clearPaperSearchCache", "searchPaper", "wordMatch"].sort(),
        );
    });
});
