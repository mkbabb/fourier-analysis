import { expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import type { AxeResults } from "axe-core";

/**
 * X.F.W3 `.d` — `fr-ExportModal LC-1`: THE TREE’S SOLE LIVE AXE KEYSTONE WAS
 * SILENTLY NARROWED BY ITS OWN SUBJECT.
 *
 * Opening `ExportModal` makes axe’s `isModalOpen()` true (a visible
 * `[role=dialog]` — the keystone ASSERTS it before calling this helper), which
 * flips all three checks of `aria-hidden-focus` (`serious`, `wcag2a`, inside
 * this filter): `focusable-modal-open` returns `undefined`, so the node lands in
 * **`incomplete`** rather than `violations`. The suppressed condition is REAL
 * and created by the subject — reka’s `useHideOthers` stamps `aria-hidden="true"`
 * over the app root and every focusable workspace control while the dialog is
 * open — and this helper read `results.violations` ONLY. Page-wide, because it
 * carried no `.include()`/`.exclude()` either.
 *
 * THE CURE, as adjudicated: SCOPE the run per surface, and never let the
 * suppressed set be invisible again. Two changes, both here:
 *
 *   1. `include` scopes the analysis to the surface under test, so a modal
 *      keystone grades THE MODAL instead of grading the whole document through
 *      a rule that the modal has just disabled.
 *   2. The failure message now prints the serious/critical `incomplete` set
 *      beside the violations, and the full results are RETURNED, so a caller can
 *      assert on the suppression rather than inherit it.
 *
 * Precision bound, preserved from the adjudication so a later seat does not
 * over-read this: the other two `passForModal` consumers (`landmark-one-main`,
 * `page-has-heading-one`) are `best-practice`-tagged and outside the filter.
 * `aria-hidden-focus` is the SOLE in-scope suppressed rule.
 *
 * ⊘ SS-13 #13 — the `results.incomplete` CENSUS (how many nodes land there on a
 * real modal run) is the corroboration probe, and it is named rather than run:
 * the suppression itself is proven statically above, and this unit does not
 * mint an assertion that must break on the day the producer ships `inert`.
 */
export interface A11yOptions {
    /** CSS selector the analysis is scoped to. Omitted = the whole document. */
    include?: string;
}

export async function checkA11y(
    page: Page,
    label: string,
    options: A11yOptions = {},
): Promise<AxeResults> {
    let builder = new AxeBuilder({ page }).withTags([
        "wcag2a",
        "wcag2aa",
        "wcag21a",
        "wcag21aa",
    ]);
    if (options.include) builder = builder.include(options.include);

    const results = await builder.analyze();

    const blocking = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
    );
    const suppressed = results.incomplete.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
    );

    const fmt = (v: { impact?: string | null; id: string; help: string; nodes: unknown[] }) =>
        `  • [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length} node(s))`;

    const scope = options.include ? ` scoped to \`${options.include}\`` : " (whole document)";

    expect(
        blocking,
        `axe-core serious/critical violations at "${label}"${scope}:\n` +
            blocking.map(fmt).join("\n") +
            (suppressed.length
                ? `\nserious/critical rules axe could NOT decide (incomplete) — ` +
                  `LC-1’s suppression channel, printed so it can never be ` +
                  `invisible again:\n` + suppressed.map(fmt).join("\n")
                : ""),
    ).toEqual([]);

    return results;
}
