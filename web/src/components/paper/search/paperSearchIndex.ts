/**
 * Paper search index — builds a flat searchable index from parsed paper sections
 * and scores queries with VSCode-style fuzzy matching. Pure functions, no Vue reactivity.
 */
import type {
    PaperSectionData,
    PaperTheoremData,
    MathBlockData,
    PaperProofData,
    PaperCodeBlockData,
    ContentBlock,
} from "@mkbabb/latex-paper";

// ── Types ────────────────────────────────────────────────────

export interface SearchEntry {
    id: string;
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

export interface SearchResult extends SearchEntry {
    score: number;
    /** Matched character indices into the display label, for highlighting. */
    matches: number[];
}

// ── Fuzzy matching (VSCode-style subsequence scorer) ─────────

/**
 * Scores a fuzzy subsequence match of `pattern` against `text`.
 * Every character in `pattern` must appear in `text` in order.
 * Returns null if no match, otherwise { score, matches }.
 *
 * Scoring bonuses:
 *   +8  match at index 0 (start of string)
 *   +7  match after a word separator (space, -, _, ., /, \, :)
 *   +6  camelCase boundary (lowercase → uppercase)
 *   +5  consecutive characters in a run
 *   +3  pattern index === text index (prefix alignment)
 *   +1  base per-character match
 *  −0.1 per excess character in text (prefer tighter matches)
 */
export function fuzzyMatch(
    pattern: string,
    text: string,
): { score: number; matches: number[] } | null {
    const pLen = pattern.length;
    const tLen = text.length;
    if (pLen === 0) return { score: 0, matches: [] };
    if (pLen > tLen) return null;

    const matches: number[] = [];
    let pi = 0;
    let score = 0;
    let prevIdx = -2; // -2 so first match is never "consecutive"

    for (let ti = 0; ti < tLen && pi < pLen; ti++) {
        if (pattern[pi] !== text[ti]) continue;

        matches.push(ti);
        let cs = 1; // base

        // Consecutive run bonus
        if (prevIdx === ti - 1) cs += 5;

        // Start-of-string
        if (ti === 0) {
            cs += 8;
        } else {
            const prev = text[ti - 1];
            // Word boundary
            if (" -_./\\:()".includes(prev)) {
                cs += 7;
            }
            // camelCase boundary
            else if (
                text[ti] >= "A" &&
                text[ti] <= "Z" &&
                prev >= "a" &&
                prev <= "z"
            ) {
                cs += 6;
            }
        }

        // Prefix alignment
        if (pi === ti) cs += 3;

        score += cs;
        prevIdx = ti;
        pi++;
    }

    if (pi < pLen) return null;

    // Tighter matches preferred
    score -= Math.max(0, (tLen - pLen) * 0.1);

    return { score, matches };
}

// ── Multi-token fuzzy search ─────────────────────────────────

interface TokenMatch {
    score: number;
    matches: number[];
}

/**
 * Matches a query against a single text field. The query is split into
 * whitespace tokens; every token must fuzzy-match independently (AND logic).
 * Returns aggregate score + merged match indices, or null if any token fails.
 */
function multiTokenFuzzy(
    queryTokens: string[],
    text: string,
): TokenMatch | null {
    if (!text) return null;
    let total = 0;
    const allMatches: number[] = [];

    for (const token of queryTokens) {
        const m = fuzzyMatch(token, text);
        if (!m) return null;
        total += m.score;
        for (const idx of m.matches) allMatches.push(idx);
    }

    return { score: total, matches: allMatches };
}

/**
 * Scores one query (pre-split, pre-lowercased tokens) against one entry.
 * Tries each field with different weights and returns the best composite score.
 */
function scoreEntry(
    tokens: string[],
    entry: SearchEntry,
): { score: number; matches: number[] } | null {
    let best = 0;
    let bestMatches: number[] = [];

    // Field weights — number and label matches are most valuable
    const fields: [string, number][] = [
        [entry._lc.number, 18],
        [entry._lc.label, 12],
        [entry._lc.type, 10],
        [entry._lc.rawTex, 6],
        [entry._lc.plain, 3],
    ];

    for (const [text, weight] of fields) {
        if (!text) continue;
        const m = multiTokenFuzzy(tokens, text);
        if (m && m.score * weight > best) {
            best = m.score * weight;
            // Only keep matches for label field (used for display highlighting)
            bestMatches = text === entry._lc.label ? m.matches : [];
        }
    }

    if (best <= 0) return null;
    return { score: best, matches: bestMatches };
}

// ── Search function ──────────────────────────────────────────

/** Result cache: query string → results. Cleared when query prefix diverges. */
let _cache: Map<string, SearchResult[]> = new Map();

export function searchIndex(
    index: SearchEntry[],
    query: string,
    maxResults = 30,
): SearchResult[] {
    const q = query.toLowerCase().trim();
    if (!q) {
        _cache.clear();
        return [];
    }

    // Cache hit
    const cached = _cache.get(q);
    if (cached) return cached;

    // Prune cache if it grows too large
    if (_cache.size > 200) _cache.clear();

    const tokens = q.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return [];

    // If we have cached results for a prefix, narrow from those
    let candidates = index;
    if (q.length > 1) {
        const prefix = q.slice(0, -1);
        const prefixResults = _cache.get(prefix);
        if (prefixResults) {
            // Re-score the previous result set (already filtered, much smaller)
            candidates = prefixResults;
        }
    }

    const scored: SearchResult[] = [];
    for (const entry of candidates) {
        const m = scoreEntry(tokens, entry);
        if (m) {
            scored.push({ ...entry, score: m.score, matches: m.matches });
        }
    }

    scored.sort((a, b) => b.score - a.score);
    const results = scored.slice(0, maxResults);
    _cache.set(q, results);
    return results;
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

function pushEntry(entries: SearchEntry[], partial: Omit<SearchEntry, "_lc">) {
    entries.push({ ...partial, _lc: makeLc(partial) });
}

function isMathBlock(block: ContentBlock): block is MathBlockData {
    return typeof block === "object" && "tex" in block;
}

function processContentBlocks(
    blocks: ContentBlock[],
    sectionId: string,
    depth: number,
    entries: SearchEntry[],
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
                id: thm.label ?? sectionId,
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
                id: fig.label ?? sectionId,
                sectionId,
                type: "figure",
                label: stripHtml(fig.caption).slice(0, 200),
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
                    ? stripHtml(code.caption).slice(0, 200)
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

        processContentBlocks(section.content, section.id, depth, entries);

        if (section.subsections) {
            walkSections(section.subsections, sectionId, depth + 1, entries);
        }
    }
}

export function buildSearchIndex(sections: PaperSectionData[]): SearchEntry[] {
    const entries: SearchEntry[] = [];
    walkSections(sections, null, 0, entries);
    return entries;
}
