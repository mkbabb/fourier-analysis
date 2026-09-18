import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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

const ADMIN_TOKEN = "e2e-admin-token";

/** The fixture set, typed by the shapes `lib/types.ts` declares. */
const ADMIN_STATS = {
    total_entries: 128,
    featured: 7,
    saved: 41,
    normal: 80,
    total_views: 9314,
    total_likes: 452,
    storage_bytes: 73_400_320,
};

const ADMIN_USERS = {
    items: [
        {
            user_slug: "amber-fox-12",
            created_at: "2026-04-02T10:15:00Z",
            last_seen_at: "2026-09-17T22:41:00Z",
            entry_count: 9,
            status: "active",
        },
        {
            user_slug: "quiet-heron-77",
            created_at: "2026-06-19T08:02:00Z",
            last_seen_at: "2026-09-01T11:20:00Z",
            entry_count: 2,
            status: "suspended",
        },
    ],
    total: 2,
    page: 1,
    pages: 1,
};

const ADMIN_FLAGGED = {
    items: [
        {
            slug: "spiral-lattice-04",
            flag_count: 3,
            flags: [
                {
                    reporter_slug: "amber-fox-12",
                    reason: "inappropriate",
                    detail: "reported from the gallery grid",
                    created_at: "2026-09-10T14:00:00Z",
                },
            ],
            image_slug: "img-spiral-lattice-04",
            owner_slug: "quiet-heron-77",
            tier: "normal",
            created_at: "2026-08-30T09:00:00Z",
        },
    ],
    next_cursor: null,
    has_more: false,
};

const ADMIN_AUDIT = {
    items: [
        {
            timestamp: "2026-09-17T22:44:10Z",
            action: "set_tier",
            target: "spiral-lattice-04",
            ip_hash: "6f1c9a2d",
        },
        {
            timestamp: "2026-09-17T21:02:55Z",
            action: "delete",
            target: "gull-figure-19",
            ip_hash: "b03e77aa",
        },
    ],
    total: 2,
    page: 1,
    pages: 1,
};

function json(body: unknown) {
    return {
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
    };
}

/** Serve the admin surface deterministically; leave every other route live. */
async function stubAdminApi(page: Page): Promise<void> {
    await page.route("**/api/admin/verify", (r) => r.fulfill(json({ ok: true })));
    await page.route("**/api/admin/stats", (r) => r.fulfill(json(ADMIN_STATS)));
    await page.route("**/api/admin/users**", (r) => r.fulfill(json(ADMIN_USERS)));
    await page.route("**/api/admin/flagged**", (r) => r.fulfill(json(ADMIN_FLAGGED)));
    await page.route("**/api/admin/audit**", (r) => r.fulfill(json(ADMIN_AUDIT)));
    // The gallery grid itself: an empty page keeps the reading about the ADMIN
    // surface and off the card grid, which the `/visualize` keystones already
    // cover and `.d` owns.
    await page.route("**/api/visualizations**", (r) =>
        r.fulfill(json({ items: [], next_cursor: null, has_more: false })),
    );
}

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
