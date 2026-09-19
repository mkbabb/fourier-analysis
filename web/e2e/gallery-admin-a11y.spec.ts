import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import { ADMIN_TOKEN, stubAdminApi } from "./fixtures/gallery";

/**
 * X·F F.W4 `.g` — `G-F4-ADMIN-AXE`: *"one spec enters admin mode and runs axe
 * over the banner + panels"*.
 *
 * THE BORN-RED WITNESS, REPRODUCED AT THE BYTES BEFORE THIS FILE EXISTED:
 * `grep -rln "admin" web/e2e/` → **zero files**. The entire admin surface — the
 * banner and the three admin-only tabs — had never been rendered by any
 * automated check, so `GAB-1`'s six sub-4.5:1 stat cells (exactly axe's
 * `color-contrast` serious class) were *unverified by construction*
 * (`GAB-10(b)`, folding `AA-44`). This spec is the first reading.
 *
 * WHY THE ADMIN API IS STUBBED AT THE NETWORK BOUNDARY
 * ----------------------------------------------------
 * Admin mode is real state, not a flag: `GalleryView`'s `onMounted` reads
 * `?admin=<token>`, calls `gallery.activateAdmin()`, which awaits
 * `verifyAdmin()` before flipping `adminMode`. Everything downstream of that —
 * the store, the components, the styles, the DOM axe grades — is the shipped
 * code path. Only the HTTP boundary is stubbed, for two reasons that both cut
 * toward a STRONGER gate:
 *
 *   1. A live backend would need a real `ADMIN_TOKEN` secret in CI; a gate that
 *      cannot run without a secret is a gate that quietly stops running.
 *   2. A fresh CI database renders every admin panel EMPTY, and axe over an
 *      empty table grades nothing. `GAB-1`'s cells, the flagged rows and the
 *      audit rows are exactly what this gate exists to grade, so the fixtures
 *      below populate them deterministically.
 *
 * ⊘ Nothing here is skipped, allow-listed or downgraded. The assertion is the
 * same zero-serious/zero-critical bar the `/visualize` keystones carry, and the
 * findings route to the units that own the components — `.d` for the gallery
 * route and the three admin panels.
 */

/**
 * X·F F.W9 `.b` (§4a-7, author once / cite many): the fixture set and the
 * network stub that were declared inline here now live in
 * `./fixtures/gallery`, because this wave needed the SAME deterministic
 * surface for `G-F9-9` (open a card) and `G-F9-23` (photograph one). A second
 * copy would have been a second oracle. Every assertion in this file is
 * unchanged; only the source of the fixtures moved.
 */

/** Inject axe into `page` and assert zero serious/critical violations. */
async function checkA11y(page: Page, label: string): Promise<void> {
    const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

    const blocking = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(
        blocking,
        `axe-core serious/critical violations at "${label}":\n` +
            blocking
                .map(
                    (v) =>
                        `  • [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length} node(s))` +
                        v.nodes
                            .slice(0, 4)
                            .map((n) => `\n      ${n.target.join(" ")}`)
                            .join(""),
                )
                .join("\n"),
    ).toEqual([]);
}

/** Enter admin mode through the shipped path and wait for the banner. */
async function enterAdminMode(page: Page) {
    await stubAdminApi(page);
    await page.goto(`/gallery?admin=${ADMIN_TOKEN}`);

    const banner = page.getByRole("region", { name: "Admin mode banner" });
    await expect(banner).toBeVisible({ timeout: 30_000 });
    return banner;
}

/** Switch to one of the three admin-only tabs and settle on its own content. */
async function openAdminTab(page: Page, label: string, settle: () => Promise<void>) {
    await page.getByRole("tab", { name: label }).click();
    await settle();
}

test.describe("X·F F.W4 — admin-mode a11y (G-F4-ADMIN-AXE)", () => {
    test("admin banner: the stat cells are graded for the first time", async ({ page }) => {
        const banner = await enterAdminMode(page);

        // The gate is about the CELLS, so refuse to grade a banner that never
        // rendered them — a loading banner would pass vacuously.
        await expect(banner.getByText("entries", { exact: false }).first()).toBeVisible({
            timeout: 30_000,
        });

        await checkA11y(page, "gallery admin banner (GAB-1 stat cells)");
    });

    test("admin users panel", async ({ page }) => {
        await enterAdminMode(page);
        await openAdminTab(page, "Users", async () => {
            await expect(page.getByText("amber-fox-12").first()).toBeVisible({
                timeout: 30_000,
            });
        });

        await checkA11y(page, "admin panel — Users");
    });

    test("admin flagged panel", async ({ page }) => {
        await enterAdminMode(page);
        await openAdminTab(page, "Flagged", async () => {
            await expect(page.getByText("spiral-lattice-04").first()).toBeVisible({
                timeout: 30_000,
            });
        });

        await checkA11y(page, "admin panel — Flagged");
    });

    test("admin audit log panel", async ({ page }) => {
        await enterAdminMode(page);
        await openAdminTab(page, "Audit Log", async () => {
            await expect(page.getByText("spiral-lattice-04").first()).toBeVisible({
                timeout: 30_000,
            });
        });

        await checkA11y(page, "admin panel — Audit Log");
    });
});
