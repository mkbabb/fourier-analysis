// SERVED MODEL: claude-opus-5-5
import { expect, test, type Locator, type Page } from "@playwright/test";
import { ADMIN_AUDIT, ADMIN_TOKEN, ENTRY, stubAdminApi, stubGallery } from "./fixtures/gallery";

/**
 * X.F.W14V.au4 — the AUDIT-2 gallery and admin family (F-W14V.md §1 `.au0…`,
 * `audit/AUDIT-2-fourier.md`): L1-9 L1-10 L1-27 (consumer half) L2-9 L2-10
 * L2-11 L3-1 (consumer half) L3-2 L3-3 L3-4, and `.au0`'s X-8. One case per
 * row, served on :3100 over stubbed admin data (`fixtures/gallery`).
 *
 * The structural rows read the mounted component's source file off the dev
 * server's `__vueParentComponent` chain (the `.au3` instrument): one confirm,
 * one tier readout and setter, one pager, the users toolbar as its own file.
 */

const DESKTOP = { width: 1440, height: 900 };
const PHONES = [
    { width: 360, height: 780 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
];

const ENTRIES = Array.from({ length: 8 }, (_, i) => ({
    ...ENTRY,
    slug: `gallery-entry-${i}`,
    image_slug: `img-gallery-entry-${i}`,
    title: `Gallery entry ${i}`,
    tier: i === 1 ? "featured" : i === 2 ? "saved" : "normal",
}));

function json(body: unknown, status = 200) {
    return { status, contentType: "application/json", body: JSON.stringify(body) };
}

async function openAdmin(page: Page): Promise<void> {
    await stubAdminApi(page, ENTRIES);
    await page.route("**/api/admin/visualizations/*/tier", (r) => {
        const slug = r.request().url().split("/visualizations/")[1].split("/")[0];
        const tier = (r.request().postDataJSON() as { tier?: string } | null)?.tier ?? "saved";
        return r.fulfill(json({ ...ENTRY, slug, tier }));
    });
    await page.goto(`/gallery?admin=${ADMIN_TOKEN}`);
    await expect(page.getByRole("region", { name: "Admin mode banner" })).toBeVisible({ timeout: 60_000 });
}

async function openTab(page: Page, tab: string, settle: string): Promise<void> {
    await page.getByRole("tab", { name: tab }).click();
    await expect(page.getByText(settle).first()).toBeVisible({ timeout: 60_000 });
}

/** The source files of the Vue components that own `el`, innermost first. */
async function owners(el: Locator): Promise<string[]> {
    return el.evaluate((node) => {
        const files: string[] = [];
        type Inst = { type?: { __file?: string }; parent?: Inst | null };
        let inst = (node as unknown as { __vueParentComponent?: Inst }).__vueParentComponent ?? null;
        while (inst) {
            const f = inst.type?.__file;
            if (f) files.push(f.split("/src/")[1] ?? f);
            inst = inst.parent ?? null;
        }
        return files;
    });
}

async function ownedBy(el: Locator, file: string): Promise<void> {
    await expect(el.first()).toBeVisible({ timeout: 30_000 });
    const chain = await owners(el.first());
    expect(chain.some((f) => f.endsWith(file)), `owned by ${file} (read ${chain.slice(0, 4).join(" < ")})`).toBe(true);
}

function box(el: Locator) {
    return el.first().evaluate((n) => {
        const r = n.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, bottom: r.bottom, cy: r.y + r.height / 2 };
    });
}

// ── L1-9: one destructive-confirm idiom ─────────────────────────────────────
test.describe("L1-9 — the three destructive confirms are one ConfirmDialog", () => {
    test.use({ viewport: DESKTOP });
    test("gallery, users and flagged confirms mount shared/ConfirmDialog.vue", async ({ page }) => {
        await openAdmin(page);
        const card = page.locator("article.gallery-card", { hasText: "Gallery entry 3" });
        await card.getByRole("button", { name: /^Delete/ }).click();
        await ownedBy(page.getByRole("dialog"), "components/shared/ConfirmDialog.vue");
        await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
        await expect(page.getByRole("dialog")).toHaveCount(0);

        await openTab(page, "Users", "amber-fox-12");
        await page.getByRole("button", { name: "Actions for user amber-fox-12" }).click();
        await page.getByRole("menuitem", { name: /Delete user/ }).click();
        await ownedBy(page.getByRole("dialog"), "components/shared/ConfirmDialog.vue");
        await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
        await expect(page.getByRole("dialog")).toHaveCount(0);

        await openTab(page, "Flagged", "spiral-lattice-04");
        await page.getByRole("button", { name: "More actions for spiral-lattice-04" }).click();
        await page.getByRole("menuitem", { name: /Delete entry/ }).click();
        await ownedBy(page.getByRole("dialog"), "components/shared/ConfirmDialog.vue");
    });
});

// ── L1-10: one tier readout, one tier setter, one mutation ──────────────────
test.describe("L1-10 — TierMark reads the tier, TierControl sets it, the store mutates it", () => {
    test.use({ viewport: DESKTOP });
    test("card, modal and flagged row share the readout; card and modal share the setter", async ({ page }) => {
        await openAdmin(page);
        const featured = page.locator("article.gallery-card", { hasText: "Gallery entry 1" }).first();
        await ownedBy(featured.locator('[data-slot="tier-mark"]'), "gallery/TierMark.vue");
        await ownedBy(featured.locator('[data-slot="tier-control"]'), "gallery/TierControl.vue");
        await featured.getByRole("button", { name: /^Open/ }).click();
        const dialog = page.getByRole("dialog");
        await ownedBy(dialog.locator('[data-slot="tier-mark"]'), "gallery/TierMark.vue");
        await ownedBy(dialog.locator('[data-slot="tier-control"]'), "gallery/TierControl.vue");
        await page.keyboard.press("Escape");
        await expect(dialog).toHaveCount(0);

        await page.route("**/api/admin/flagged**", (r) =>
            r.fulfill(json({
                items: [{
                    slug: "spiral-lattice-04", flag_count: 1, image_slug: "img-spiral-lattice-04",
                    owner_slug: "quiet-heron-77", tier: "featured", created_at: "2026-08-30T09:00:00Z",
                    flags: [{ reporter_slug: "amber-fox-12", reason: "spam", detail: "", created_at: "2026-09-10T14:00:00Z" }],
                }],
                next_cursor: null, has_more: false,
            })),
        );
        await openTab(page, "Flagged", "spiral-lattice-04");
        await ownedBy(page.locator('[aria-label="Flagged gallery entries"] [data-slot="tier-mark"]'), "gallery/TierMark.vue");
    });

    test("the flagged Keep speaks through the gallery store's setTier (the fork is gone)", async ({ page }) => {
        await openAdmin(page);
        await openTab(page, "Flagged", "spiral-lattice-04");
        await page.getByRole("button", { name: "More actions for spiral-lattice-04" }).click();
        await page.getByRole("menuitem", { name: /Keep/ }).click();
        await expect(page.getByText("Tier set to saved").first()).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText(/Kept spiral-lattice-04/)).toHaveCount(0);
    });
});

// ── L1-27: the admin ledgers on one idiom ───────────────────────────────────
test.describe("L1-27 — users and flagged on glass DataTable, one pager, admin-row.css retired", () => {
    test.use({ viewport: DESKTOP });
    test("users and flagged are DataTables; users and audit share one Pager; the toolbar is its own file", async ({ page }) => {
        await openAdmin(page);
        await openTab(page, "Users", "amber-fox-12");
        await expect(page.locator('[data-slot="data-table"]').filter({ hasText: "amber-fox-12" })).toHaveCount(1);
        await ownedBy(page.getByRole("navigation", { name: "User list pagination" }), "components/shared/Pager.vue");
        await ownedBy(page.getByRole("searchbox", { name: "Search users" }), "admin/AdminUserToolbar.vue");
        const retired = await page.evaluate(() => {
            const probe = document.createElement("div");
            probe.className = "admin-row";
            document.body.appendChild(probe);
            const d = getComputedStyle(probe).display;
            probe.remove();
            return d;
        });
        expect(retired, "admin-row.css paints nothing").toBe("block");

        await openTab(page, "Flagged", "spiral-lattice-04");
        await expect(page.locator('[data-slot="data-table"]').filter({ hasText: "spiral-lattice-04" })).toHaveCount(1);

        await openTab(page, "Audit Log", "gull-figure-19");
        await ownedBy(page.getByRole("navigation", { name: "Audit log pagination" }), "components/shared/Pager.vue");
    });
});

// ── L2-9: the card modal keeps glass's gutter on phones ─────────────────────
for (const vp of PHONES) {
    test.describe(`L2-9 — the card modal is inset @ ${vp.width}`, () => {
        test.use({ viewport: vp });
        for (const scheme of ["light", "dark"] as const) {
            test(`gutters ≥ --space-section (${scheme})`, async ({ page }) => {
                await page.emulateMedia({ colorScheme: scheme });
                await stubGallery(page, ENTRIES);
                await page.goto("/gallery");
                await page.locator("article.gallery-card").first().getByRole("button", { name: /^Open/ }).click();
                const dialog = page.locator('[data-slot="dialog-content"]');
                await expect(dialog).toBeVisible({ timeout: 30_000 });
                await page.waitForTimeout(400);
                const gutter = await page.evaluate(() => {
                    const el = document.createElement("div");
                    el.style.width = "var(--space-section)";
                    document.body.appendChild(el);
                    const w = el.getBoundingClientRect().width;
                    el.remove();
                    return w;
                });
                const b = await box(dialog);
                expect(gutter).toBeGreaterThan(0);
                expect(b.x, `left gutter ${b.x} vs --space-section ${gutter}`).toBeGreaterThanOrEqual(gutter - 0.5);
                expect(vp.width - b.right, `right gutter vs --space-section ${gutter}`).toBeGreaterThanOrEqual(gutter - 0.5);
            });
        }
    });
}

// ── L2-10: the admin checkboxes keep glass's touch seat ─────────────────────
test.describe("L2-10 — admin checkboxes are ≥ 44 px on touch", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    test("user rows and gallery cards", async ({ page }) => {
        await openAdmin(page);
        const seat = (el: Locator) =>
            el.first().evaluate((n) => {
                const b = n.getBoundingClientRect();
                const t = (n.closest("label") ?? n).getBoundingClientRect();
                return Math.min(Math.max(b.width, t.width), Math.max(b.height, t.height));
            });
        expect(await seat(page.locator("article.gallery-card").getByRole("checkbox")), "card").toBeGreaterThanOrEqual(44);
        await openTab(page, "Users", "amber-fox-12");
        const row = page.getByRole("checkbox", { name: "Select user amber-fox-12" });
        const b = await box(row);
        expect(Math.min(b.w, b.h), `user row checkbox ${b.w}x${b.h}`).toBeGreaterThanOrEqual(44);
    });
});

// ── L2-11: the audit table projects to cards on phones ──────────────────────
for (const vp of PHONES) {
    test.describe(`L2-11 — the audit ledger fits @ ${vp.width}`, () => {
        test.use({ viewport: vp });
        test("card-per-row projection, no sideways pan", async ({ page }) => {
            await openAdmin(page);
            await page.route("**/api/admin/audit**", (r) =>
                r.fulfill(json({
                    ...ADMIN_AUDIT,
                    items: [
                        ...ADMIN_AUDIT.items,
                        { timestamp: "2026-09-17T20:00:00Z", action: "batch_users:delete", target: "harmonic-rose-janitor-candidate-11", ip_hash: "9a8b7c6d5e4f3a2b" },
                    ],
                    total: 3,
                })),
            );
            await openTab(page, "Audit Log", "gull-figure-19");
            await expect(page.locator(".data-table-cards")).toBeVisible();
            const pans = await page.locator('[data-slot="data-table"]').evaluate((root) => {
                const out: string[] = [];
                for (const el of [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))]) {
                    if (el.scrollWidth > el.clientWidth + 1 && ["auto", "scroll"].includes(getComputedStyle(el).overflowX)) {
                        out.push(`${el.className}:${el.scrollWidth}/${el.clientWidth}`);
                    }
                }
                return out;
            });
            expect(pans, "sideways scrollers in the audit ledger").toEqual([]);
            const target = page.locator(".data-table-cards").getByText("harmonic-rose-janitor-candidate-11").first();
            const t = await box(target);
            expect(t.w, "the target is painted in its card").toBeGreaterThan(40);
        });
    });
}

// ── L3-1: the users toolbar is one row at 1440 ──────────────────────────────
for (const scheme of ["light", "dark"] as const) {
    test.describe(`L3-1 — the users toolbar @ 1440 ${scheme}`, () => {
        test.use({ viewport: DESKTOP, colorScheme: scheme });
        test("search, sort and the overflow share one row", async ({ page }) => {
            await openAdmin(page);
            await openTab(page, "Users", "amber-fox-12");
            const search = await box(page.getByRole("searchbox", { name: "Search users" }));
            const sort = await box(page.getByRole("combobox", { name: "Sort users" }));
            const more = await box(page.getByRole("button", { name: "More user actions" }));
            expect(Math.abs(search.cy - sort.cy), "search and sort on one row").toBeLessThanOrEqual(4);
            expect(Math.abs(sort.cy - more.cy), "sort and overflow on one row").toBeLessThanOrEqual(4);
            expect(sort.w, "the sort Select is not stretched").toBeLessThanOrEqual(200);
        });
    });
}

// ── L3-2: the flagged actions stay inside the row at 390 ────────────────────
for (const scheme of ["light", "dark"] as const) {
    test.describe(`L3-2 — the flagged actions @ 390 ${scheme}`, () => {
        test.use({ viewport: { width: 390, height: 844 }, colorScheme: scheme, hasTouch: true });
        test("no action runs past the row", async ({ page }) => {
            await openAdmin(page);
            await openTab(page, "Flagged", "spiral-lattice-04");
            const table = page.locator('[aria-label="Flagged gallery entries"]').first();
            const row = page.locator("[data-admin-row]").filter({ hasText: "spiral-lattice-04" }).first();
            const r = await box(row);
            const t = await box(table);
            for (const b of await row.getByRole("button").all()) {
                const bb = (await b.boundingBox())!;
                expect(bb.x + bb.width, `${await b.getAttribute("aria-label")} inside the row`).toBeLessThanOrEqual(Math.min(r.right, t.right) + 0.5);
            }
        });
    });
}

// ── L3-3: the gallery chrome is one toolbar row at ≥ sm ─────────────────────
for (const scheme of ["light", "dark"] as const) {
    test.describe(`L3-3 — the gallery chrome ${scheme}`, () => {
        test.use({ colorScheme: scheme });
        test("1440: tabs and search share one row; 390: tabs then search, no count row", async ({ page }) => {
            await stubGallery(page, ENTRIES);
            await page.setViewportSize(DESKTOP);
            await page.goto("/gallery");
            await expect(page.locator("article.gallery-card").first()).toBeVisible({ timeout: 60_000 });
            const tabs = await box(page.getByRole("tablist").first());
            const search = await box(page.getByRole("search", { name: "Gallery search and filters" }));
            expect(Math.abs(tabs.cy - search.cy), `tabs cy ${tabs.cy} vs search cy ${search.cy}`).toBeLessThanOrEqual(6);
            expect(search.x, "search trails the tabs").toBeGreaterThan(tabs.x);

            await page.setViewportSize({ width: 390, height: 844 });
            await page.waitForTimeout(300);
            const t2 = await box(page.getByRole("tablist").first());
            const s2 = await box(page.getByRole("search", { name: "Gallery search and filters" }));
            expect(s2.y, "search below the tabs at 390").toBeGreaterThanOrEqual(t2.bottom - 1);
            await expect(page.getByText(/^\d+ loaded$/)).toHaveCount(0);
        });
    });
}

// ── L3-4: two cards per row on a phone ──────────────────────────────────────
for (const scheme of ["light", "dark"] as const) {
    test.describe(`L3-4 — the phone gallery @ 390 ${scheme}`, () => {
        test.use({ viewport: { width: 390, height: 844 }, colorScheme: scheme });
        test("the grid shows two columns", async ({ page }) => {
            await stubGallery(page, ENTRIES);
            await page.goto("/gallery");
            const grid = page.locator("article.gallery-card:not([data-tier='featured'])");
            await expect(grid.first()).toBeVisible({ timeout: 60_000 });
            const boxes = await grid.evaluateAll((els) => els.slice(0, 4).map((e) => { const r = e.getBoundingClientRect(); return { y: Math.round(r.y), w: r.width, right: r.right }; }));
            expect(boxes[0].y, `cards 0 and 1 share a row (${JSON.stringify(boxes)})`).toBe(boxes[1].y);
            for (const b of boxes) expect(b.right, "inside the viewport").toBeLessThanOrEqual(390);
        });
    });
}

// ── X-8 (`.au0`): the audit toolbar and chips at 1440 ───────────────────────
test.describe("X-8 — the audit log's filters, header and chips @ 1440", () => {
    test.use({ viewport: DESKTOP });
    test("filters sized to their tokens, IP hash one line, chips carry one destructive signal", async ({ page }) => {
        await openAdmin(page);
        await openTab(page, "Audit Log", "gull-figure-19");
        for (const id of ["#audit-action-filter", "#audit-target-filter"]) {
            const b = await box(page.locator(id));
            expect(b.w, `${id} ${b.w}px`).toBeLessThanOrEqual(320);
        }
        const th = page.locator("thead th", { hasText: "IP hash" });
        const lines = await th.evaluate((n) => {
            const r = document.createRange();
            r.selectNodeContents(n);
            return new Set(Array.from(r.getClientRects()).filter((x) => x.width > 0).map((x) => Math.round(x.top))).size;
        });
        expect(lines, "IP hash header lines").toBe(1);
        const fills = await page.locator("tbody [data-slot='badge']").evaluateAll((els) =>
            els.map((e) => ({ text: e.textContent?.trim(), bg: getComputedStyle(e).backgroundColor })),
        );
        const tier = fills.find((f) => f.text === "set_tier")!;
        expect(tier.bg, "a curation action is not a solid fill").toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    });
});
