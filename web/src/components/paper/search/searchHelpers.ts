/**
 * Pure utility functions for paper search result display — type labels,
 * label formatting, HTML escaping, and fuzzy highlight rendering.
 */
import { fuzzyMatch } from "./paperSearchIndex";
import type { SearchResult } from "./paperSearchIndex";

export const TYPE_LABELS: Record<string, string> = {
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

export function resultLabel(r: SearchResult): string {
    if (r.label) return r.label;
    if (r.rawTex) return r.rawTex.slice(0, 120);
    return r.plainText.slice(0, 120);
}

/**
 * Highlight matched characters using the fuzzy match indices.
 * Falls back to re-running fuzzyMatch on the display label.
 */
export function highlightFuzzy(text: string, query: string): string {
    if (!query.trim() || !text) return escapeHtml(text);

    // Re-run fuzzy match on the display text to get precise indices
    const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const textLc = text.toLowerCase();
    const matchSet = new Set<number>();

    for (const token of tokens) {
        const m = fuzzyMatch(token, textLc);
        if (m) {
            for (const idx of m.matches) matchSet.add(idx);
        }
    }

    if (matchSet.size === 0) return escapeHtml(text);

    // Build highlighted string, grouping consecutive matches into single <mark> tags
    const chars = [...text];
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

export function escapeHtml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
