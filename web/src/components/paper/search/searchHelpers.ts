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
 * The fix is to do the matching over the SAME units the renderer uses: the
 * code-point array is built first and the match runs over its joined form with
 * an index map back to code points.
 */
export function highlightFuzzy(text: string, query: string): string {
    if (!query.trim() || !text) return escapeHtml(text);

    const chars = [...text];
    // code-unit offset → code-point index
    const unitToPoint = new Map<number, number>();
    let unit = 0;
    for (let point = 0; point < chars.length; point++) {
        unitToPoint.set(unit, point);
        unit += chars[point].length;
    }

    const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const textLc = text.toLowerCase();
    const matchSet = new Set<number>();

    for (const token of tokens) {
        const m = fuzzyMatch(token, textLc);
        if (m) {
            for (const idx of m.matches) {
                const point = unitToPoint.get(idx);
                if (point !== undefined) matchSet.add(point);
            }
        }
    }

    if (matchSet.size === 0) return escapeHtml(text);

    // Build highlighted string, grouping consecutive matches into single <mark> tags
    const parts: string[] = [];
    let i = 0;

    while (i < chars.length) {
        if (matchSet.has(i)) {
            // Collect consecutive matched chars
            let j = i;
            while (j < chars.length && matchSet.has(j)) j++;
            parts.push(`<mark>${escapeHtml(chars.slice(i, j).join(""))}</mark>`);
            i = j;
        } else {
            parts.push(escapeHtml(chars[i]));
            i++;
        }
    }

    return parts.join("");
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
