/**
 * Paper search index — builds a flat searchable index from parsed paper sections
 * and scores queries by word-start matching (UIA-F-161). Pure functions, no Vue reactivity.
 */
import type {
    PaperSectionData,
    PaperTheoremData,
    MathBlockData,
    PaperProofData,
    PaperCodeBlockData,
    ContentBlock,
    PaperLabelInfo,
} from "@mkbabb/latex-paper";

/**
 * UIA-F-26 — a `\label` key is not a DOM id. The renderer mints the element id
 * (`thm:residue` → `thm-residue`) and `labelMap` publishes it as `anchorId`;
 * the navigator lands with `getElementById`, so an entry that carried the raw
 * key mounted the right section and then searched for an element that does not
 * exist, leaving the reader wherever the virtual window settled (Thm 4.2.1 at
 * 6.3.8). A labelled entry's destination is its anchor; a label the map does
 * not know falls to the owning section, never to the raw key.
 */
type LabelAnchors = Record<string, Pick<PaperLabelInfo, "anchorId" | "elementId">>;

/**
 * UIA-F-21 — a label cut at `limit` never severs inline math: when the cut
 * falls inside a `$…$` span, the label ends before that span opens, so the
 * row typesets whole math or none (a severed `$w` printed as raw TeX).
 */
function clipLabel(text: string, limit: number): string {
    if (text.length <= limit) return text;
    const cut = text.slice(0, limit);
    const opens = [...cut.matchAll(/(?<!\\)\$/g)].map((m) => m.index ?? 0);
    return opens.length % 2 === 1 ? cut.slice(0, opens[opens.length - 1]).trimEnd() : cut;
}

function anchorFor(labels: LabelAnchors, label: string | undefined): string | undefined {
    if (!label) return undefined;
    const info = labels[label];
    return info?.anchorId ?? info?.elementId;
}

// ── Types ────────────────────────────────────────────────────

export interface SearchEntry {
    /** The navigation target — NOT unique; see `key`. */
    id: string;
    /**
     * `PSM-7`/`PSM-39` — the stable identity the rows never had.
     *
     * `id` is the scroll target and is deliberately not unique: code and proof
     * entries take their SECTION's id unconditionally, so the second proof in a
     * section is indistinguishable from the first — selecting it sent the
     * reader to the section heading with no way to tell that was wrong. A
     * minted key gives every entry an identity of its own; `id` stays what it
     * always was, a destination. The `v-for` keys read this instead of the
     * array index, which was positional and re-created every row on reorder.
     */
    key: string;
    sectionId: string;
    type:
        | "section"
        | "theorem"
        | "definition"
        | "lemma"
        | "proposition"
        | "corollary"
        | "equation"
        | "figure"
        | "code"
        | "proof"
        | "bibliography"
        | "aside"
        | "example";
    number?: string;
    label?: string;
    plainText: string;
    rawTex?: string;
    depth: number;
    // Pre-lowercased fields for search (built once, reused every query)
    _lc: {
        number: string;
        label: string;
        type: string;
        rawTex: string;
        plain: string;
    };
}

export interface PaperSearchResult extends SearchEntry {
    score: number;
}

// ── Word-start matching ─────────────────────────────────────

/** A letter or digit in any script: the inside of a word. */
const WORD_CHAR = /[\p{L}\p{N}]/u;

/**
 * X.F.W14U.paper — UIA-F-161: matches `pattern` as a PREFIX OF A WORD in
 * `text` (both already lower-cased). The subsequence scorer this replaces let
 * any in-order scatter of letters match ("prsvl" found Parseval, "fo" found
 * every body with an f before an o), so a query returned whatever happened to
 * contain its letters and the rows lit single letters across the label. A
 * token now has to begin a word; the highlight is that one contiguous run.
 *
 * Returns null when no word starts with `pattern`, otherwise the score and the
 * contiguous indices of the best occurrence.
 *
 * Scoring (per the best word-start occurrence):
 *   +2 per matched character (a longer token is more specific)
 *   +8 the occurrence starts the field
 *   +4 the token is a whole word (the next character ends the word)
 *   ×  pLen / (pLen + excess × 0.02): a hit in a short label outranks the
 *      same hit in a long body, as a ratio that can never outrun the match
 *      (`PSM-14`'s shape, kept).
 */
export function wordMatch(
    pattern: string,
    text: string,
): { score: number; matches: number[] } | null {
    const pLen = pattern.length;
    const tLen = text.length;
    if (pLen === 0) return { score: 0, matches: [] };
    if (pLen > tLen) return null;

    let best = -1;
    let bestAt = -1;
    for (let at = text.indexOf(pattern); at !== -1; at = text.indexOf(pattern, at + 1)) {
        if (at > 0 && WORD_CHAR.test(text[at - 1])) continue;
        const next = text[at + pLen];
        let score = 2 * pLen;
        if (at === 0) score += 8;
        if (next === undefined || !WORD_CHAR.test(next)) score += 4;
        if (score > best) {
            best = score;
            bestAt = at;
        }
    }
    if (bestAt < 0) return null;

    const matches = Array.from({ length: pLen }, (_, k) => bestAt + k);
    return { score: best * (pLen / (pLen + Math.max(0, tLen - pLen) * 0.02)), matches };
}

// ── Multi-token word-start search ─────────────────────────────────

interface TokenMatch {
    score: number;
    matches: number[];
}

/**
 * Matches a query against a single text field. The query is split into
 * whitespace tokens; every token must begin a word independently (AND logic).
 * Returns aggregate score + merged match indices, or null if any token fails.
 */
function multiTokenMatch(
    queryTokens: string[],
    text: string,
): TokenMatch | null {
    if (!text) return null;
    let total = 0;
    const allMatches: number[] = [];

    for (const token of queryTokens) {
        const m = wordMatch(token, text);
        if (!m) return null;
        total += m.score;
        for (const idx of m.matches) allMatches.push(idx);
    }

    return { score: total, matches: allMatches };
}

/**
 * `FR-PSD-TYPE` (⊕ `PSM-14`) — THE SCORING DECISION, MADE HERE AND EXPLICITLY.
 *
 * `_lc.type` is a closed internal enum and is BYTE-IDENTICAL across every entry
 * of a type. Scored as a field at weight 10 it outranked `rawTex` (6) and
 * `plainText` (3), so a query that matched a type name — `"thm"` against
 * `"theorem"`, `"fig"` against `"figure"` — gave every member of that type the
 * SAME score, and the sort then fell through to document order. The record
 * measured the consequence at +37.2% over genuine hits: content-blind slabs
 * displacing real matches.
 *
 * It is not fixed by re-weighting, because the defect is not the weight: a
 * field that cannot discriminate between the entries it matches cannot RANK
 * them, at any weight. It is fixed by taking it out of the ranking and leaving
 * it as what it actually is — a way to ask for a KIND of thing when nothing
 * else matched. So:
 *
 *   TIER 1 — the content fields (number · label · rawTex · plainText). These
 *            differ per entry, so a score over them is a ranking.
 *   TIER 0 — the type name, consulted ONLY when no content field matched. A
 *            type-only hit can therefore never displace a genuine one; within
 *            the tier the order is document order, which for "show me the
 *            theorems" is reading order and is the right answer.
 *
 * ⊘ The capability survives and the slab does not. The alternative considered
 * and rejected was deleting the type field outright: it would have silently
 * removed `"thm"`/`"fig"`/`"eq"` as a way into the paper, which is a real use
 * and costs nothing to keep once it cannot outrank anything.
 *
 * ⊘ This decision is NOT inherited from `@mkbabb/glass-ui/search`. The producer
 * at the adopted pin scores `[label,12] [type,10] [text,3]` — the same
 * inversion, one field wider — and its matcher still carries `PSM-14`'s
 * unbounded subtractive length penalty (`score -= max(0,(tLen-pLen)*0.1)`),
 * which this module has already replaced with a ratio. See the `PSM-9`
 * disposition recorded by this unit.
 */
const TYPE_FALLBACK_WEIGHT = 10;

function scoreEntry(
    tokens: string[],
    entry: SearchEntry,
): { score: number; tier: number } | null {
    let best = 0;

    // Content fields — number and label matches are most valuable
    const fields: [string, number][] = [
        [entry._lc.number, 18],
        [entry._lc.label, 12],
        [entry._lc.rawTex, 6],
        [entry._lc.plain, 3],
    ];

    for (const [text, weight] of fields) {
        if (!text) continue;
        const m = multiTokenMatch(tokens, text);
        if (m && m.score * weight > best) best = m.score * weight;
    }

    // `PSM-11`: a `matches` array used to ride every result and be read by
    // NOBODY — the highlighter re-ran the match inline because these indices
    // were computed against the LOWER-CASED field while the display label is
    // the original-case string (or a `rawTex`/`plainText` slice), so they
    // genuinely misaligned. The re-run was a correct workaround for a broken
    // contract; the contract is deleted and the re-run is the only path.
    if (best > 0) return { score: best, tier: 1 };

    const byType = entry._lc.type
        ? multiTokenMatch(tokens, entry._lc.type)
        : null;
    if (byType && byType.score > 0) {
        return { score: byType.score * TYPE_FALLBACK_WEIGHT, tier: 0 };
    }

    return null;
}

// ── Search function ──────────────────────────────────────────

/**
 * Result cache: query string → the FULL scored array for that query.
 *
 * `PSM-5`: this used to store the TRUNCATED top-30 and then narrow the next
 * keystroke's candidates from it — so a row that fell out of a prefix's top 30
 * was permanently unreachable down that keystroke path, and typing a query
 * returned a different result set than pasting it. `PSM-30`: because the stored
 * array was pre-sliced, the exported `maxResults` parameter was inert on every
 * cache hit — an exported contract that did nothing. The producer caches the
 * full array and slices per call; the fork diverged by one `.slice()`, and this
 * is that slice put back where it belongs.
 *
 * `PSM-22`: the cache is keyed by query alone and is module-global, so a second
 * index in the same session would read the first one's answers. It is owned by
 * the index now — one cache per index, disposed with it.
 */
const caches = new WeakMap<SearchEntry[], Map<string, PaperSearchResult[]>>();

function cacheFor(index: SearchEntry[]): Map<string, PaperSearchResult[]> {
    let c = caches.get(index);
    if (!c) {
        c = new Map();
        caches.set(index, c);
    }
    return c;
}

/** `PSM-22`/`PSM-27`: drop an index's memo — on dispose, and on close. */
export function clearPaperSearchCache(index: SearchEntry[]): void {
    caches.get(index)?.clear();
}

/**
 * X.F.W14V.au5 — A2-FO-L1-4 (consumer half): the paper's ranker. glass keeps
 * its fuzzy engine INTERNAL at 10.1.0 (no `./search` export key), so this
 * engine is consumer-owned and no longer carries the producer's names
 * (`searchIndex`, `clearSearchCache`, `SearchResult`): nothing here shadows
 * glass's engine. When glass publishes `./search` this ranking is the adopt
 * (ADOPT-AT-LANDING) and `buildSearchIndex` stays the domain half.
 */
export function searchPaper(
    index: SearchEntry[],
    query: string,
    maxResults = 30,
): PaperSearchResult[] {
    const cache = cacheFor(index);
    const q = query.toLowerCase().trim();
    if (!q) {
        cache.clear();
        return [];
    }

    // Cache hit — re-sliced per call, because `maxResults` is a parameter of
    // THIS call and not of the call that happened to fill the cache.
    const cached = cache.get(q);
    if (cached) return cached.slice(0, maxResults);

    // Prune cache if it grows too large
    if (cache.size > 200) cache.clear();

    const tokens = q.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return [];

    // Narrowing from a prefix's results is sound only because the FULL scored
    // array is what was stored: every entry that can match `q` also matched
    // `q.slice(0, -1)`.
    let candidates = index;
    if (q.length > 1) {
        const prefixResults = cache.get(q.slice(0, -1));
        if (prefixResults) candidates = prefixResults;
    }

    const scored: { result: PaperSearchResult; tier: number }[] = [];
    for (const entry of candidates) {
        const m = scoreEntry(tokens, entry);
        if (m) {
            scored.push({ result: { ...entry, score: m.score }, tier: m.tier });
        }
    }

    // `FR-PSD-TYPE`: tier first, score second. The tier is the whole content of
    // the decision above — a type-only match ranks below every content match
    // and can never displace one — and it stays out of `PaperSearchResult`, because
    // nothing downstream has any business reading it.
    scored.sort((a, b) => b.tier - a.tier || b.result.score - a.result.score);
    const ranked = scored.map((s) => s.result);
    cache.set(q, ranked);
    return ranked.slice(0, maxResults);
}

// ── Index construction ───────────────────────────────────────

const HTML_TAG_RE = /<[^>]*>/g;
const LATEX_CMD_RE = /\\[a-zA-Z]+\{?|}|\^|_|\{|\}/g;

function stripHtml(s: string): string {
    return s.replace(HTML_TAG_RE, "");
}

function stripLatex(s: string): string {
    return s.replace(LATEX_CMD_RE, " ").replace(/\s+/g, " ").trim();
}

function flattenNestedBlocks(
    blocks: (string | { tex?: string } | { figure?: any } | { code?: any })[],
): string {
    const parts: string[] = [];
    for (const b of blocks) {
        if (typeof b === "string") {
            parts.push(stripHtml(b));
        } else if (b && "tex" in b && typeof b.tex === "string") {
            parts.push(stripLatex(b.tex));
        }
    }
    return parts.join(" ").replace(/\s+/g, " ").trim();
}

function makeLc(entry: Omit<SearchEntry, "_lc">): SearchEntry["_lc"] {
    return {
        number: entry.number?.toLowerCase() ?? "",
        label: entry.label?.toLowerCase() ?? "",
        type: entry.type,
        rawTex: entry.rawTex?.toLowerCase() ?? "",
        plain: entry.plainText.toLowerCase(),
    };
}

function pushEntry(
    entries: SearchEntry[],
    partial: Omit<SearchEntry, "_lc" | "key">,
) {
    entries.push({
        ...partial,
        key: `${partial.type}:${partial.id}:${entries.length}`,
        _lc: makeLc({ ...partial, key: "" }),
    });
}

function isMathBlock(block: ContentBlock): block is MathBlockData {
    return typeof block === "object" && "tex" in block;
}

function processContentBlocks(
    blocks: ContentBlock[],
    sectionId: string,
    depth: number,
    entries: SearchEntry[],
    labels: LabelAnchors,
): void {
    for (const block of blocks) {
        if (typeof block === "string") continue;

        if (isMathBlock(block)) {
            if (block.number || block.id) {
                pushEntry(entries, {
                    id: block.id ?? block.anchorId ?? sectionId,
                    sectionId,
                    type: "equation",
                    number: block.number,
                    plainText: stripLatex(block.tex),
                    rawTex: block.tex,
                    depth,
                });
            }
        } else if ("theorem" in block) {
            const thm = block.theorem as PaperTheoremData;
            const plainText = flattenNestedBlocks(thm.content);
            pushEntry(entries, {
                id: anchorFor(labels, thm.label) ?? sectionId,
                sectionId,
                type: thm.type as SearchEntry["type"],
                number: thm.number,
                label: thm.name,
                plainText: plainText.slice(0, 300),
                depth,
            });
        } else if ("figure" in block) {
            const fig = block.figure;
            pushEntry(entries, {
                id: anchorFor(labels, fig.label) ?? sectionId,
                sectionId,
                type: "figure",
                label: clipLabel(stripHtml(fig.caption), 200),
                plainText: stripHtml(fig.caption),
                depth,
            });
        } else if ("code" in block) {
            const code = block.code as PaperCodeBlockData;
            pushEntry(entries, {
                id: sectionId,
                sectionId,
                type: "code",
                label: code.caption
                    ? clipLabel(stripHtml(code.caption), 200)
                    : undefined,
                plainText:
                    (code.caption ? stripHtml(code.caption) + " " : "") +
                    code.code.slice(0, 200),
                depth,
            });
        } else if ("proof" in block) {
            const proof = block.proof as PaperProofData;
            const plainText = flattenNestedBlocks(proof.content);
            pushEntry(entries, {
                id: sectionId,
                sectionId,
                type: "proof",
                label: proof.name,
                plainText: plainText.slice(0, 300),
                depth,
            });
        }
    }
}

function collectParagraphText(blocks: ContentBlock[]): string {
    const parts: string[] = [];
    for (const block of blocks) {
        if (typeof block === "string") parts.push(stripHtml(block));
    }
    return parts.join(" ").replace(/\s+/g, " ").trim();
}

function walkSections(
    sections: PaperSectionData[],
    rootSectionId: string | null,
    depth: number,
    entries: SearchEntry[],
    labels: LabelAnchors,
): void {
    for (const section of sections) {
        const sectionId = rootSectionId ?? section.id;
        const paragraphText = collectParagraphText(section.content);

        pushEntry(entries, {
            id: section.id,
            sectionId,
            type: "section",
            number: section.number,
            label: stripHtml(section.title),
            plainText: paragraphText.slice(0, 500),
            depth,
        });

        processContentBlocks(section.content, section.id, depth, entries, labels);

        if (section.subsections) {
            walkSections(section.subsections, sectionId, depth + 1, entries, labels);
        }
    }
}

export function buildSearchIndex(
    sections: PaperSectionData[],
    labels: LabelAnchors,
): SearchEntry[] {
    const entries: SearchEntry[] = [];
    walkSections(sections, null, 0, entries, labels);
    return entries;
}
