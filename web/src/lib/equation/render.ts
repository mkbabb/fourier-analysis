/**
 * THE KaTeX SINGLETON — X·F F.W4 `.b`, spine member `SP-18`.
 *
 * Before this module there were FOUR render sites (`EquationResult.vue`,
 * `EquationPanel.vue`, `useCoeffHover.ts`, `ConvergencePlot.vue`) carrying three
 * byte-identical option triples, a fourth that omitted `trust`, and three
 * divergent fallbacks (`<code>…</code>` / a `text-red-400` span / `""`).
 * `fr-EquationResult FR-EQR-17` names this file as the DESIGNATED CURE VEHICLE
 * and the spec's §0 repair-unit-sizing law makes four-site patching an
 * escalation, so the four rows below land here or they do not land:
 *
 *   FR-EQR-15 / fr-EquationView I-3 — `trust` is LOAD-BEARING and the cure is a
 *     HANDLER, never `trust: false` and never a naive `() => true`.
 *   FR-EQR-16 ⊕ fr-ConvergencePlot L-M8/C-9 — `escapeHtml` in EVERY catch.
 *   FR-EQR-19 — the `strict` callback that silences `htmlExtension`.
 *   FR-EQR-4 — `plainLatex()`, so the copy affordance emits portable LaTeX.
 *
 * ── WHY `trust` CANNOT BE WITHDRAWN (fr-EquationView I-3, the cure-constraint)
 * The backend authors this route's hover hooks as `\htmlClass{eq-coeff eq-…}`
 * at four sites in `src/fourier_analysis/symbolic/latex_rendering.py`
 * (`:175`, `:176`, `:216`, `:248` — the `eq-An` site included), KaTeX gates the
 * `\html*` family behind `trust`, and `useCoeffHover.ts` hit-tests exactly those
 * classes. `trust: false` therefore deletes the feature the equation card exists
 * to provide — silently, because KaTeX renders the symbol either way. The
 * handler below is the narrowest predicate that keeps the feature: one command,
 * one closed class set, everything else refused.
 *
 * ── WHY `strict` IS A CALLBACK AND NOT `"ignore"`
 * KaTeX's `\html*` handler calls `reportNonstrict("htmlExtension", …)`
 * unconditionally, BEFORE the trust check, and `strict` defaults to `"warn"` —
 * so the app's own deliberate feature logged one `console.warn` per occurrence
 * per render in its own default mode (measured: 2 warns for a two-hook sigma
 * render). Blanket `strict: "ignore"` would also silence the unrelated
 * diagnostics that are worth hearing, so only `htmlExtension` is quieted.
 * This is `G-F4-KATEX-QUIET`'s cure.
 */

import katex from "katex";

/** The class set the backend emits — anything else is refused by the handler. */
const TRUSTED_COEFF_CLASSES: ReadonlySet<string> = new Set([
    "eq-coeff",
    "eq-an",
    "eq-bn",
    "eq-cn",
    "eq-An",
]);

/**
 * The trust predicate. `\htmlClass` only, and only for the closed class set the
 * backend's four emission sites use; every other `\html*` command (`\htmlId`,
 * `\htmlData`, `\href`, `\includegraphics`, `\url`) is refused, which is what
 * makes this a handler and not `trust: true` under another name.
 */
function trustCoeffHooks(context: { command: string; class?: string }): boolean {
    if (context.command !== "\\htmlClass") return false;
    const classes = (context.class ?? "").trim().split(/\s+/).filter(Boolean);
    return classes.length > 0 && classes.every((c) => TRUSTED_COEFF_CLASSES.has(c));
}

/** FR-EQR-19 — quiet the diagnostic the app's own feature provokes, nothing else. */
function strictExceptHtmlExtension(code: string): "ignore" | "warn" {
    return code === "htmlExtension" ? "ignore" : "warn";
}

/**
 * Escape a string that is about to enter a `v-html` sink.
 *
 * Every `renderLatex` fallback below goes through this. The threat model is
 * self-XSS (`fr-ConvergencePlot RD-3/K-10`): the equation route rehydrates its
 * inputs from `sessionStorage` without shape validation, so "the user's own
 * string" is not the same claim as "a string the user typed this session".
 * Kept local rather than imported from `components/paper/search/searchHelpers`:
 * that module is the paper route's, and its barrel is the zero-consumer file
 * `G-F4-DEAD-DEP` deletes — importing either would weld two routes together to
 * share six lines.
 */
export function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export interface RenderLatexOptions {
    /** KaTeX display mode. Defaults to `true` (the card and popover registers). */
    displayMode?: boolean;
}

/**
 * Render LaTeX to HTML for a `v-html` sink — the ONE home.
 *
 * `throwOnError: false` makes KaTeX render its own red error node for a parse
 * error, so the catch below is reached only by a NON-ParseError throw; that path
 * returns the source escaped, which is the honest degradation (the user sees the
 * string they gave) and never an HTML injection.
 */
export function renderLatex(latex: string, options: RenderLatexOptions = {}): string {
    if (!latex) return "";
    try {
        return katexRenderToString(latex, options.displayMode ?? true);
    } catch {
        return escapeHtml(latex);
    }
}

/**
 * FR-EQR-4 — the portable form, for the clipboard.
 *
 * `eqMode` defaults to `"sigma"`, `activeLatex` prefers the sigma render, and the
 * sigma renders are precisely the ones carrying `\htmlClass` — so the app's only
 * copy affordance emitted LaTeX that every consumer but KaTeX-with-trust rejects
 * with `Undefined control sequence`, in its own default mode. The expanded
 * renderers are already clean, so stripping the wrapper is the whole cure.
 *
 * The pattern is exact rather than generous on purpose: all four emission sites
 * spell `\htmlClass{<classes>}{<symbol>}` with no nested braces in either
 * argument, so a brace-free match cannot mis-parse a real equation body.
 */
export function plainLatex(latex: string): string {
    return latex.replace(/\\htmlClass\{[^{}]*\}\{([^{}]*)\}/g, "$1");
}

/** The single option object. Nothing else in the app constructs one. */
function katexRenderToString(latex: string, displayMode: boolean): string {
    return katex.renderToString(latex, {
        displayMode,
        throwOnError: false,
        trust: trustCoeffHooks,
        strict: strictExceptHtmlExtension,
    });
}
