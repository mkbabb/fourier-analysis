// SERVED MODEL: claude-opus-5[1m]
import { test, expect } from "@playwright/test";

/**
 * X·F F.W9 `.b` — the **S3 seat**'s behavioural half (`G-F9-4`'s residue).
 *
 * THE RESIDUE, MEASURED AT OPEN
 * -----------------------------
 * F.W4 `.g` landed the `/paper` AXE artifact (`visualization-ux.spec.ts`'s
 * *"keystone: /paper is a11y-clean"*), which discharged the first half of
 * `G-F9-4`. The second half it did not: the gate's own born-RED reads *"the
 * void is zero assertions on any `paper-search*` selector and zero axe on the
 * route"*, and at open ⟨cmd⟩ `grep -rn 'paper-search' web/e2e/` returned ONE
 * hit — a docblock line inside a unit test. Not one `*.spec.ts` asserted
 * anything about the paper's search surface, which is `PAW-34`'s and
 * `PaperView D/i-1`'s whole subject.
 *
 * ════════════════════════════════════════════════════════════════════════════
 * THE TWO LOCKS THIS FILE LANDS UNDER, BOTH CHECKED RATHER THAN ASSUMED
 * ════════════════════════════════════════════════════════════════════════════
 * **§4a-13 — M2 HARD LOCK.** *"No `/paper` selector F.W9 authors may depend on
 * `.sidebar-top-btn`"*, because F.W4 must not rename it before the latex-paper
 * relay lands and a spec keyed on it would freeze the rename. Not one selector
 * below names that class, or any class the sidebar owns. Every one of them is
 * the search surface's OWN published contract: `role="combobox"` named "Search
 * the paper", `role="listbox"` named "Search results", `role="option"` rows —
 * all minted by `usePaperSearch`'s `PV ★MF-2` ARIA wiring, which exists
 * precisely so the three components can agree on identities.
 *
 * **§4a-10 — the D/i-1 COUPLED LOCK.** *"Coverage rides the B-1/B-2 cure wave,
 * never scheduled independently."* That wave has landed: F.W3 CLOSED
 * 2026-09-19 and F.W4 CLOSED 2026-09-17, and their repairs are in this
 * surface's own bytes (`PaperSearch.vue`'s `FR-PS-CLIP`/`FR-PS-BDT` portal
 * root, F.W4 `.e`'s `PSM-1` colocation). The lock is DISCHARGED by its
 * predecessor landing, not waived.
 *
 * ⊘ ONE ARTIFACT (§4a-7). The `/paper` axe pass is NOT re-run here — a second
 * would be the rival oracle `KF.W4` forbids. This is the behavioural half and
 * it cites the keystone rather than duplicating it.
 *
 * ⊘ F.W9 OWNS GATES AND NO CURE. `PaperSidebar D-B2`'s token is F.W4's; the
 * `f20` panel re-rasterisation rides the LATEX-PAPER relay. Nothing under
 * `web/src/**` is written here.
 */

/** The paper's own compiled body is the route's mount condition. */
async function openPaper(page: import("@playwright/test").Page): Promise<void> {
    await page.goto("/paper");
    await page.waitForLoadState("networkidle", { timeout: 60_000 });
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({
        timeout: 60_000,
    });
}

test.describe("S3 — /paper search (G-F9-4)", () => {
    test("the search field is a named combobox with the listbox it controls", async ({
        page,
    }) => {
        await openPaper(page);

        // `C-7`'s cure: the field's accessible NAME is its `aria-label`, not
        // its placeholder — a placeholder-named field loses its name on the
        // first keystroke, which is exactly the state this spec types into.
        const field = page.getByRole("combobox", { name: "Search the paper" }).first();
        await expect(field).toBeVisible({ timeout: 30_000 });

        // The combobox contract `usePaperSearch` mints. `aria-controls` must
        // name the listbox that actually appears below; the two ids are
        // generated in one place so they cannot disagree — this asserts they
        // still reach the DOM.
        await expect(field).toHaveAttribute("aria-autocomplete", "list");
        await expect(field).toHaveAttribute("aria-expanded", "false");
        const listboxId = await field.getAttribute("aria-controls");
        expect(listboxId, "the combobox controls no listbox").toBeTruthy();
        expect(listboxId).toMatch(/^paper-search-listbox-/);
    });

    test("typing a query opens the listbox and populates typed result rows", async ({
        page,
    }) => {
        await openPaper(page);

        const field = page.getByRole("combobox", { name: "Search the paper" }).first();
        await expect(field).toBeVisible({ timeout: 30_000 });
        // "fourier" is in the paper's title and in most of its sections, so a
        // zero-result reading here means the index did not build — which is
        // the failure this test exists to make visible.
        await field.fill("fourier");

        const listbox = page.getByRole("listbox", { name: "Search results" });
        await expect(listbox).toBeVisible({ timeout: 15_000 });
        await expect(field).toHaveAttribute("aria-expanded", "true");

        const options = listbox.getByRole("option");
        await expect(options.first()).toBeVisible({ timeout: 15_000 });
        expect(await options.count()).toBeGreaterThan(0);

        // `aria-activedescendant` must point at a row that exists. A combobox
        // pointing at a stale or absent id announces nothing, and no other
        // check in the repo would see it.
        const active = await field.getAttribute("aria-activedescendant");
        expect(active, "the combobox highlights no option").toBeTruthy();
        await expect(page.locator(`#${active}`)).toHaveAttribute("aria-selected", "true");

        // The rows are TYPED — `paper-search-badge[data-type]` is the label
        // that tells a theorem from a definition, and `PSM-18`'s duplicated row
        // was retired into one component precisely so this has a single answer.
        const badges = listbox.locator(".paper-search-badge");
        expect(await badges.count()).toBeGreaterThan(0);
        const types = await badges.evaluateAll((els) =>
            els.map((el) => el.getAttribute("data-type")),
        );
        expect(types.every((t) => !!t), "a result row carries no result type").toBe(true);
    });

    test("selecting a result navigates the paper to that section", async ({ page }) => {
        await openPaper(page);

        const field = page.getByRole("combobox", { name: "Search the paper" }).first();
        await expect(field).toBeVisible({ timeout: 30_000 });
        await field.fill("fourier");

        const listbox = page.getByRole("listbox", { name: "Search results" });
        await expect(listbox.getByRole("option").first()).toBeVisible({ timeout: 15_000 });

        // `PAW-34` / `D/i-1`: the point of the surface is that selecting a
        // result MOVES the reader. Enter is the keyboard path the combobox
        // model promises, and it is the one no test has ever taken.
        await field.press("Enter");

        // `close()` is synchronous after `PSM-27`: the query clears and the
        // panel goes with it. A search that navigates but leaves its own
        // overlay up is the defect that fix was for.
        await expect(listbox).toBeHidden({ timeout: 15_000 });
        await expect(field).toHaveValue("");
    });
});
