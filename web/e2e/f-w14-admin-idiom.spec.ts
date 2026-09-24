import { expect, test, type Locator, type Page } from "@playwright/test";
import { ADMIN_FLAGGED, ADMIN_TOKEN, stubAdminApi } from "./fixtures/gallery";

/**
 * X.F.W14 `.h` — OA-50 (COHESION §0cc, addendum (b)): ONE admin card/row idiom
 * across every admin page. Owner frame `owner-2026-09-23-admin-panels.png`:
 * the actions stacked and Delete overran the card; the thumbnail sat flush; a
 * mono title, a serif body and a mono reporter line LARGER than the byline; a
 * bare "Normal"; "3 flags" over one listed flag.
 *
 * Census (the admin pages, `GalleryView.vue` admin tabs): Users
 * (`AdminUserList`), Flagged (`AdminFlaggedPanel`), Audit Log
 * (`AdminAuditLog`, `.t`'s DataTable) — plus the banner above them.
 *
 * The gate, per panel at 1440 and 390 in both themes (served, headed ×2):
 * - every list row is the idiom (`[data-admin-row]`);
 * - media is inset from the row edge (≥ 8 px) — never flush;
 * - the action group is horizontal (one top) and inside the row;
 * - text sits on glass's type rungs, resolved in the page: the row title on
 *   `--type-small`, every meta line on `--type-micro` (none larger than the
 *   title), flag detail on `--type-caption`; one title rung across panels;
 * - every field is labelled (`[data-admin-field]` holds a `dt`);
 * - the flag count equals the flags listed, or the list says how many it shows;
 * - the Audit Log (`.t`) re-read against the same rungs.
 */

const PHASE = process.env.FW14_PHASE ?? "after";

/** Three flags on the first entry, one listed — the frame's exact datum. */
const FLAGGED = {
    ...ADMIN_FLAGGED,
    items: [
        ...ADMIN_FLAGGED.items,
        {
            ...ADMIN_FLAGGED.items[0],
            slug: "harmonic-rose-janitor-candidate-11",
            flag_count: 2,
            owner_slug: "amber-fox-12",
            tier: "saved",
            flags: [
                { reporter_slug: "quiet-heron-77", reason: "spam", detail: "", created_at: "2026-09-12T10:00:00Z" },
                { reporter_slug: "amber-fox-12", reason: "other", detail: "duplicate of an older entry", created_at: "2026-09-13T10:00:00Z" },
            ],
        },
    ],
};

const PANELS = [
    { tab: "Users", label: "Admin user list", settle: "amber-fox-12", slug: "users" },
    { tab: "Flagged", label: "Flagged gallery entries", settle: "spiral-lattice-04", slug: "flagged" },
    { tab: "Audit Log", label: "Admin audit entries", settle: "set_tier", slug: "audit-log" },
] as const;

async function openPanel(page: Page, tab: string, label: string, settle: string): Promise<Locator> {
    await stubAdminApi(page);
    await page.route("**/api/admin/flagged**", (r) =>
        r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(FLAGGED) }),
    );
    await page.goto(`/gallery?admin=${ADMIN_TOKEN}`);
    await expect(page.getByRole("region", { name: "Admin mode banner" })).toBeVisible({ timeout: 60_000 });
    await page.getByRole("tab", { name: tab }).click();
    const panel = page.locator(`[aria-label="${label}"]`);
    await expect(panel.getByText(settle).first()).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(400);
    return panel;
}

/** Glass's type rungs, resolved in the page from probe elements (never copied). */
async function rungs(page: Page) {
    return page.evaluate(() => {
        const out: Record<string, number> = {};
        for (const r of ["micro", "caption", "small", "body"]) {
            const el = document.createElement("span");
            el.style.fontSize = `var(--type-${r})`;
            document.body.appendChild(el);
            out[r] = parseFloat(getComputedStyle(el).fontSize);
            el.remove();
        }
        return out;
    });
}

/** Font size of the first element matching `sel` in each row (NaN if absent). */
async function sizes(rows: Locator, sel: string) {
    return rows.evaluateAll(
        (els, s) =>
            els.flatMap((row) =>
                [...row.querySelectorAll<HTMLElement>(s)]
                    .filter((e) => e.getClientRects().length > 0)
                    .map((e) => ({ text: (e.textContent ?? "").trim().slice(0, 40), px: parseFloat(getComputedStyle(e).fontSize) })),
            ),
        sel,
    );
}

/** Row geometry: media inset, action group tops and right edges. */
async function geometry(rows: Locator) {
    return rows.evaluateAll((els) =>
        els.map((row) => {
            const r = row.getBoundingClientRect();
            const media = row.querySelector<HTMLElement>("[data-admin-media]")?.getBoundingClientRect();
            const buttons = [...row.querySelectorAll<HTMLElement>("[data-admin-actions] button")].map((b) =>
                b.getBoundingClientRect(),
            );
            return {
                media: media ? { left: media.left - r.left, top: media.top - r.top } : null,
                tops: buttons.map((b) => Math.round(b.top)),
                overrun: Math.max(0, ...buttons.map((b) => b.right - r.right)),
                buttons: buttons.length,
            };
        }),
    );
}

for (const scheme of ["light", "dark"] as const) {
    for (const vp of [
        { width: 1440, height: 900 },
        { width: 390, height: 844 },
    ]) {
        test.describe(`G-a (OA-50) admin idiom @ ${vp.width} ${scheme}`, () => {
            test.use({ viewport: vp, colorScheme: scheme });

            for (const p of PANELS) {
                test(`${p.tab}: one admin row idiom`, async ({ page }) => {
                    const panel = await openPanel(page, p.tab, p.label, p.settle);
                    await panel.screenshot({ path: `e2e/screenshots/f-w14/${PHASE}-oa50-${p.slug}-${vp.width}-${scheme}.png` });
                    const rung = await rungs(page);
                    const near = (a: number, b: number) => Math.abs(a - b) < 0.5;

                    if (p.tab === "Audit Log") {
                        // `.t` re-read against the idiom's rungs: every cell on small or below.
                        const cells = await sizes(panel, "td, th");
                        expect(cells.length).toBeGreaterThan(0);
                        for (const c of cells) {
                            expect.soft(c.px, `audit cell "${c.text}" above --type-small (${rung.small})`).toBeLessThanOrEqual(rung.small + 0.5);
                        }
                        return;
                    }

                    const rows = panel.locator(":scope > [role='listitem']");
                    const n = await rows.count();
                    expect(n).toBeGreaterThanOrEqual(2);
                    expect.soft(await panel.locator(":scope > [data-admin-row]").count(), "rows on the idiom").toBe(n);

                    for (const t of await sizes(rows, "[data-admin-title]")) {
                        expect.soft(t.px, `title "${t.text}" on --type-small (${rung.small})`).toBeCloseTo(rung.small, 0);
                    }
                    expect.soft((await sizes(rows, "[data-admin-title]")).length, "every row titled").toBe(n);
                    const metas = await sizes(rows, "[data-admin-meta]");
                    expect.soft(metas.length, "meta lines present").toBeGreaterThanOrEqual(n);
                    for (const m of metas) {
                        expect.soft(near(m.px, rung.micro), `meta "${m.text}" ${m.px}px on --type-micro (${rung.micro})`).toBe(true);
                    }
                    for (const d of await sizes(rows, "[data-admin-detail]")) {
                        expect.soft(near(d.px, rung.caption), `detail "${d.text}" ${d.px}px on --type-caption (${rung.caption})`).toBe(true);
                    }

                    for (const [i, g] of (await geometry(rows)).entries()) {
                        expect.soft(g.buttons, `row ${i}: an action group`).toBeGreaterThan(0);
                        expect.soft(new Set(g.tops).size, `row ${i}: actions stacked (tops ${g.tops})`).toBe(1);
                        expect.soft(g.overrun, `row ${i}: an action overruns the row`).toBeLessThanOrEqual(0.5);
                        if (p.tab === "Flagged") {
                            expect.soft(g.media, `row ${i}: media present`).not.toBeNull();
                            if (g.media) {
                                expect.soft(g.media.left, `row ${i}: media flush left`).toBeGreaterThanOrEqual(8);
                                expect.soft(g.media.top, `row ${i}: media flush top`).toBeGreaterThanOrEqual(8);
                            }
                        }
                    }

                    // Every field labelled: no bare value.
                    const fields = panel.locator("[data-admin-field]");
                    if (p.tab === "Flagged") expect.soft(await fields.count(), "tier is a labelled field").toBeGreaterThanOrEqual(n);
                    for (const f of await fields.all()) {
                        expect.soft((await f.locator("dt").innerText()).trim().length, "field label").toBeGreaterThan(0);
                    }

                    if (p.tab === "Flagged") {
                        for (let i = 0; i < n; i++) {
                            const item = FLAGGED.items[i];
                            const row = rows.nth(i);
                            const listed = await row.locator("[data-admin-flag]").count();
                            const note = await row.locator("[data-admin-flag-note]").count();
                            expect.soft(
                                listed === item.flag_count || (note === 1 && listed === item.flags.length),
                                `row ${i}: "${item.flag_count} flags" over ${listed} listed with ${note} note`,
                            ).toBe(true);
                        }
                    }
                });
            }
        });
    }
}
