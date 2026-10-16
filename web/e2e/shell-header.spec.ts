// SERVED MODEL: claude-opus-5[1m]
import { test, expect } from "@playwright/test";

/**
 * X·F F.W9 `.b` — `G-F9-12`: the shell header's nav, logo and toggle.
 *
 * THE BORN-RED, REPRODUCED AT THESE BYTES
 * ---------------------------------------
 * No e2e touched the header's nav, logo or toggle. `AppHeader` mounts on every
 * route and `FR-AH-45` books it as contract-less — zero props, zero emits, zero
 * slots — so there was nothing to type-check and nothing to assert against
 * either. The suite's ONLY incidental reach was
 * `paper-performance.spec.ts`'s dark-mode click, and that was a side effect of
 * a contrast test rather than a check of the header.
 *
 * ── THE N-2 RIDER, AND WHY IT NEEDS NO CO-LANDING COMMIT HERE ──
 * `F-W9.md` §4a-12 carries the rider *"the DarkModeToggle a11y label change
 * lands in the SAME commit as the spec locator update"*, and `fr-DarkModeToggle`
 * banks the CURE half at **F.W4**, never here (*"F.W9 owns ONLY the spec-side
 * half"*). The cure has landed: `DarkModeToggle.vue` now reads
 * `aria-label="Dark mode"` with `:aria-pressed="isDark"`, and
 * `paper-performance.spec.ts:328` already carries the matching
 * `{ name: /dark mode/i, pressed: false }` locator. The rider is therefore
 * DISCHARGED, not skipped — there is no label byte left for this commit to
 * carry, because the commit that owed it was F.W4's and it kept its word.
 *
 * ⊘ F.W9 OWNS GATES AND NO CURE. No `web/src/**` byte is written here.
 */

/** Routes the header's nav declares (`AppHeader.vue`'s `TABS`). */
const NAV_TABS = [
    { label: "Paper", path: "/paper" },
    { label: "Visualize", path: "/visualize" },
    { label: "Gallery", path: "/gallery" },
    { label: "Equation", path: "/equation" },
    { label: "Morph", path: "/morph" },
] as const;

/** X.F.W14V `.nav` (§0dw): the section menu is the nav at every one of these. */
const NAV_WIDTHS = [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
] as const;

test.describe("Shell header (G-F9-12)", () => {
    test("the logo trigger is named and opens its attribution card", async ({ page }) => {
        await page.goto("/");

        // `.logo-trigger` is a `PopoverTrigger` whose accessible name is the
        // component's own `aria-label`; the mark itself is decorative text.
        const logo = page.getByRole("button", { name: "About Fourier analysis" });
        await expect(logo).toBeVisible({ timeout: 30_000 });

        await logo.click();
        // The card carries the author attribution. Asserting content rather
        // than the popover box keeps this from passing on an empty panel.
        await expect(page.getByText(/orthogonal decomposition/i).first()).toBeVisible({
            timeout: 10_000,
        });
    });

    for (const vp of NAV_WIDTHS) {
        test(`the nav trigger names the current section and lists every route (${vp.width})`, async ({ page }) => {
            // X.F.W14V `.nav` — owner-ruling re-baseline (COHESION §0dw, reversing
            // UIA-F-151's tab limb): the one menu is the nav at EVERY width, so
            // this reads it at 1440, 1024, 768 and 390 (was: 390 only).
            await page.setViewportSize(vp);
            await page.goto("/gallery");

            // `:aria-label="`Navigate — current section ${activeTabData.label}`"` —
            // the trigger's name CARRIES the current section, which is the only
            // statement of it available to a screen reader.
            const nav = page.getByRole("button", { name: /^Navigate — current section/ });
            await expect(nav).toBeVisible({ timeout: 30_000 });
            await expect(nav).toHaveAccessibleName("Navigate — current section Gallery");

            await nav.click();
            const menu = page.getByRole("menu");
            await expect(menu).toBeVisible({ timeout: 10_000 });

            // Every declared route is reachable from the one nav affordance. A
            // dropped tab is a route with no navigation path, and nothing else in
            // the suite would notice.
            for (const tab of NAV_TABS) {
                await expect(menu.getByRole("menuitem", { name: tab.label })).toBeVisible();
            }
        });

        test(`the nav trigger actually navigates, and re-names itself when it does (${vp.width})`, async ({
            page,
        }) => {
            // X.F.W14V `.nav` — owner-ruling re-baseline (§0dw): at every width.
            await page.setViewportSize(vp);
            await page.goto("/gallery");

            const nav = page.getByRole("button", { name: /^Navigate — current section/ });
            await expect(nav).toBeVisible({ timeout: 30_000 });
            await nav.click();
            await page.getByRole("menuitem", { name: "Equation" }).click();

            await expect(page).toHaveURL(/\/equation$/, { timeout: 15_000 });
            // The name is derived from the route, so this is the round trip: a nav
            // that moved the URL but not its own label would be a lie to AT users.
            await expect(nav).toHaveAccessibleName("Navigate — current section Equation", {
                timeout: 10_000,
            });
        });
    }

    test("the dark-mode toggle announces its state through aria-pressed", async ({ page }) => {
        await page.goto("/");

        // N-2's contract, spec side: the NAME is stable ("Dark mode") and the
        // STATE is `aria-pressed`. The old label put the state inside the name,
        // so the name changed under AT users on every activation — and a
        // locator keyed on it matched only one of the two states.
        const toggle = page.getByRole("button", { name: /dark mode/i });
        await expect(toggle).toBeVisible({ timeout: 30_000 });

        const before = await toggle.getAttribute("aria-pressed");
        expect(
            before,
            "the toggle must state a pressed value — `aria-pressed` IS the contract",
        ).toMatch(/^(true|false)$/);

        await toggle.click();
        // Settle on the ATTRIBUTE flipping rather than on a timeout: the
        // theme morph is ~350ms and any fixed wait is either a flake or a
        // drag. `fr-DarkModeToggle K-1` / N-2's rider.
        await expect(toggle).toHaveAttribute(
            "aria-pressed",
            before === "true" ? "false" : "true",
            { timeout: 10_000 },
        );
        // The name must NOT have moved with the state.
        await expect(toggle).toHaveAccessibleName(/dark mode/i);
    });
});
