/**
 * Pure utility functions for paper search result display — type labels,
 * label formatting, HTML escaping, and fuzzy highlight rendering.
 */
import { fuzzyMatch, type SearchResult } from "./paperSearchIndex";

/**
 * `PSM-17`: typed `Record<string, string>`, this defeated exhaustiveness over a
 * CLOSED 13-member union — a new entry type would have shipped with no label
 * and no error. Keyed to the union, it is a compile-time question instead.
 * (`"bibliography"` is declared and never produced by any push site today; it
 * stays, because the type says the parser may produce it.)
 */
export const TYPE_LABELS: Record<SearchResult["type"], string> = {
    section: "Sec",
    theorem: "Thm",
    definition: "Def",
    lemma: "Lem",
    proposition: "Prop",
    corollary: "Cor",
    equation: "Eq",
    figure: "Fig",
    code: "Code",
    proof: "Prf",
    bibliography: "Bib",
    aside: "Note",
    example: "Ex",
};

/**
 * `PSM-35` (+ `PSM-28`'s third-order rider): the fallback used a code-UNIT
 * `.slice(0, 120)`, which can cut an equation mid-token AND can emit a lone
 * surrogate that `escapeHtml` then passes straight to a `v-html` sink. The cut
 * is by code POINT and it backs up to a token boundary when it can, so a row
 * shows a whole prefix rather than a severed one.
 */
const LABEL_LIMIT = 120;

function truncate(text: string): string {
    const points = [...text];
    if (points.length <= LABEL_LIMIT) return text;
    const cut = points.slice(0, LABEL_LIMIT).join("");
    const lastSpace = cut.lastIndexOf(" ");
    return `${lastSpace > LABEL_LIMIT * 0.6 ? cut.slice(0, lastSpace) : cut}\u2026`;
}

export function resultLabel(r: SearchResult): string {
    if (r.label) return r.label;
    return truncate(r.rawTex ?? r.plainText);
}

/**
 * Highlight the matched characters of the DISPLAY text.
 *
 * `PSM-11`: this re-runs the match rather than reading indices off the result,
 * and that is now the only path — the shipped `matches` array was computed
 * against a lower-cased FIELD while this receives the display label, so its
 * indices were misaligned by construction and nothing ever read them.
 *
 * `PSM-28` — CODE POINTS, NOT CODE UNITS. `fuzzyMatch` walks the string with
 * `[i]`, i.e. UTF-16 code units, while the renderer below splits with `[...t]`,
 * i.e. code points. The record reproduced both failures by execution:
 * `highlightFuzzy("𝔽ourier basis", "basis")` marked one character off, and
 * `highlightFuzzy("İstanbul set", "set")` marked the wrong characters
 * entirely. Mathematical alphanumerics are plausible in this paper's labels.
 *
 * There are TWO length axes here and they are not the same defect. A code point
 * outside the BMP is two code units, so a code-unit index overshoots the
 * renderer's array; and `toLowerCase()` may return MORE code points than it was
 * given (`"İ"` → `"i"` + U+0307), so an index into the lower-cased text does not
 * name the same character in the original at all. One map closes both: the
 * lower-cased text is built one code point at a time, and every code unit it
 * emits records the index of the ORIGINAL code point that produced it. The
 * matcher then indexes what it indexes, and the renderer marks what the reader
 * actually sees.
 *
 * ⊘ Lower-casing per code point rather than per string gives up the handful of
 * context-sensitive foldings (Greek final sigma). That is the right trade for a
 * highlighter: a mark one character wide in the wrong place is visible to every
 * reader, and a σ/ς near-miss costs a highlight on a query no one has typed.
 */
export function highlightFuzzy(text: string, query: string): string {
    const chars = [...text];
    return renderMarked(chars, fuzzyMarks(chars, query), 0);
}

/** The ORIGINAL code-point indices of `chars` a fuzzy match of `query` marks. */
function fuzzyMarks(chars: string[], query: string): Set<number> {
    const matchSet = new Set<number>();
    if (!query.trim() || chars.length === 0) return matchSet;

    // lower-cased code-unit offset → ORIGINAL code-point index
    const unitToPoint = new Map<number, number>();
    let textLc = "";
    for (let point = 0; point < chars.length; point++) {
        const lower = chars[point].toLowerCase();
        for (let k = 0; k < lower.length; k++) {
            unitToPoint.set(textLc.length + k, point);
        }
        textLc += lower;
    }

    const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    for (const token of tokens) {
        const m = fuzzyMatch(token, textLc);
        if (m) {
            for (const idx of m.matches) {
                const point = unitToPoint.get(idx);
                if (point !== undefined) matchSet.add(point);
            }
        }
    }
    return matchSet;
}

/**
 * Escape `chars`, grouping consecutive marked points into single `<mark>`s.
 * `offset` is the index of `chars[0]` in the text the marks were computed on.
 */
function renderMarked(chars: string[], marks: Set<number>, offset: number): string {
    if (marks.size === 0) return escapeHtml(chars.join(""));
    const parts: string[] = [];
    let i = 0;
    while (i < chars.length) {
        if (marks.has(offset + i)) {
            let j = i;
            while (j < chars.length && marks.has(offset + j)) j++;
            parts.push(`<mark>${escapeHtml(chars.slice(i, j).join(""))}</mark>`);
            i = j;
        } else {
            parts.push(escapeHtml(chars[i]));
            i++;
        }
    }
    return parts.join("");
}

/** `$…$` spans (an escaped `\$` is text), in document order. */
const INLINE_MATH = /(?<!\\)\$((?:\\\$|[^$])+?)(?<!\\)\$/g;

/**
 * UIA-F-21 — a result label as the paper reads it.
 *
 * Section titles, captions and theorem names carry inline TeX, and the row
 * printed it raw (`$\mathbf{L}^2…`), with the fuzzy `<mark>`s landing inside
 * the source. The label is split into text and `$…$` math: the math is
 * typeset by the paper's own KaTeX renderer (the one `PAPER_CONTEXT` carries,
 * macros and all), and the match is computed over the TEXT segments only, so
 * a mark never lands inside the math. An equation entry with no label is its
 * TeX, typeset whole rather than cut mid-token by the text limit.
 */
export function highlightLabel(
    r: SearchResult,
    query: string,
    renderMath: (tex: string) => string,
): string {
    if (!r.label && r.rawTex) return renderMath(r.rawTex);
    const text = resultLabel(r);
    const segments: { math: boolean; value: string }[] = [];
    let last = 0;
    for (const m of text.matchAll(INLINE_MATH)) {
        const at = m.index ?? 0;
        if (at > last) segments.push({ math: false, value: text.slice(last, at) });
        segments.push({ math: true, value: m[1] });
        last = at + m[0].length;
    }
    if (last < text.length) segments.push({ math: false, value: text.slice(last) });

    const prose = segments.filter((seg) => !seg.math).flatMap((seg) => [...seg.value]);
    const marks = fuzzyMarks(prose, query);
    let offset = 0;
    return segments
        .map((seg) => {
            if (seg.math) return renderMath(seg.value);
            const chars = [...seg.value];
            const html = renderMarked(chars, marks, offset);
            offset += chars.length;
            return html;
        })
        .join("");
}

/**
 * `PSM-41`: this used to be published as general-purpose API through
 * `search/index.ts` while escaping only three characters — attribute-unsafe for
 * `"` and `'`. The barrel is deleted and this is module-internal to the search
 * subtree, whose single sink is element content; the two quote forms are
 * escaped anyway, because the cheapest way to keep a claim like that true is
 * not to depend on it.
 */
export function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
