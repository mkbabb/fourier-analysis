// SERVED MODEL: claude-opus-5-5
import { expect, test, type Locator, type Page } from "@playwright/test";
import { ADMIN_AUDIT, ADMIN_FLAGGED, ADMIN_TOKEN, stubAdminApi } from "./fixtures/gallery";

/**
 * X.F.W14.t — gate G-t, OA-42 (COHESION §0bu; owner frame
 * `fourier/evidence/W14/owner-2026-09-23-malformed.png`: *"these UI elements
 * are malformed in fourier, mark"*).
 *
 * The frame shows three defects in the admin audit log, and each is asserted
 * here against computed values on the served page, never against a copied
 * pixel figure:
 *
 *   1. Every action badge is sized to its content:
 *      `scrollWidth <= clientWidth` for every glass `Badge` in the panel.
 *      The frame's `JANITOR:HARD_DELETE_VISUALIZATIONS` spilled past its pill.
 *   2. At 1440 the timestamp is one line (the frame wrapped it into
 *      "2026," / "AM"), and it is set in tabular figures.
 *   3. Exactly one painted rule separates each pair of adjacent rows. The rule
 *      count is the lower row edge's border, plus the next row's top border,
 *      plus any outer offset shadow that paints below the upper row. The frame
 *      doubled it with a card border plus an offset stamp.
 *
 * The same three checks sweep the other two admin surfaces (Flagged, Users) at
 * 1440 and 390, in both themes. The audit fixture carries the frame's own long
 * action names, so the overflow check is not vacuous.
 */

const LONG_AUDIT = {
    ...ADMIN_AUDIT,
    items: [
        {
            timestamp: "2026-09-17T22:44:10Z",
            action: "janitor:hard_delete_visualizations",
            target: "system",
            ip_hash: "0bd41e9f7a",
        },
        {
            timestamp: "2026-09-17T21:02:55Z",
            action: "set_tier:featured",
            target: "spiral-lattice-04",
            ip_hash: "0bd41e9f7a",
        },
        {
            timestamp: "2026-09-16T09:12:00Z",
            action: "suspend_user",
            target: "quiet-heron-77",
            ip_hash: "0bd41e9f7a",
        },
        {
            timestamp: "2026-09-15T08:01:30Z",
            action: "batch_users:delete",
            target: "amber-fox-12,quiet-heron-77",
            ip_hash: "6f1c9a2d11",
        },
        {
            timestamp: "2026-09-14T23:59:59Z",
            action: "janitor:prune_audit",
            target: "admin_audit",
            ip_hash: "b03e77aa42",
        },
    ],
    total: 5,
};

/** Two queue entries, so the flagged sweep has an adjacent pair to measure. */
const TWO_FLAGGED = {
    ...ADMIN_FLAGGED,
    items: [
        ...ADMIN_FLAGGED.items,
        {
            ...ADMIN_FLAGGED.items[0],
            slug: "harmonic-rose-janitor-candidate-11",
            flag_count: 12,
            owner_slug: "amber-fox-12",
        },
    ],
};

const PHASE = process.env.FW14_PHASE ?? "after";

async function openPanel(page: Page, tab: string, label: string, settle: string): Promise<Locator> {
    await stubAdminApi(page);
    // Registered after the shared stub, so this route answers first.
    await page.route("**/api/admin/audit**", (r) =>
        r.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(LONG_AUDIT),
        }),
    );
    await page.route("**/api/admin/flagged**", (r) =>
        r.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(TWO_FLAGGED),
        }),
    );
    await page.goto(`/gallery?admin=${ADMIN_TOKEN}`);
    await expect(page.getByRole("region", { name: "Admin mode banner" })).toBeVisible({
        timeout: 60_000,
    });
    await page.getByRole("tab", { name: tab }).click();
    // The panel is the labelled collection itself: every row and every badge
    // the gate reads sits inside it, and nothing from the tab bar or banner does.
    const panel = page.locator(`[aria-label="${label}"]`);
    await expect(panel.getByText(settle).first()).toBeVisible({ timeout: 60_000 });
    return panel;
}

/** Every glass Badge in the panel: [text, scrollWidth, clientWidth]. */
async function badgeOverflow(panel: Locator) {
    return panel.locator(".badge-atom").evaluateAll((els) =>
        els.map((el) => ({
            text: (el.textContent ?? "").trim(),
            scroll: el.scrollWidth,
            client: el.clientWidth,
        })),
    );
}

/** Painted rules between each adjacent pair of rows. */
async function rulesBetweenRows(rows: Locator) {
    return rows.evaluateAll((els) => {
        const painted = (w: string, s: string, c: string) =>
            parseFloat(w) > 0 && s !== "none" && s !== "hidden" && !/,\s*0\)$|transparent/.test(c);
        const stamp = (shadow: string) =>
            shadow !== "none" &&
            shadow.split(/,(?![^(]*\))/).some((part) => {
                if (/inset/.test(part)) return false;
                if (/rgba?\([^)]*,\s*0\)/.test(part) || /transparent/.test(part)) return false;
                const nums = part.replace(/rgba?\([^)]*\)|oklch\([^)]*\)|color\([^)]*\)/g, "")
                    .match(/-?\d*\.?\d+px/g);
                return !!nums && nums.length >= 2 && parseFloat(nums[1]) > 0;
            });
        const out: { pair: number; rules: number; parts: string[] }[] = [];
        for (let i = 0; i + 1 < els.length; i++) {
            const a = getComputedStyle(els[i]);
            const b = getComputedStyle(els[i + 1]);
            const parts: string[] = [];
            if (painted(a.borderBottomWidth, a.borderBottomStyle, a.borderBottomColor))
                parts.push(`upper border-bottom ${a.borderBottomWidth}`);
            if (painted(b.borderTopWidth, b.borderTopStyle, b.borderTopColor))
                parts.push(`lower border-top ${b.borderTopWidth}`);
            if (stamp(a.boxShadow)) parts.push(`upper offset shadow ${a.boxShadow}`);
            out.push({ pair: i, rules: parts.length, parts });
        }
        return out;
    });
}

/** Line count of an element's text: distinct line boxes of its text range. */
async function lineCount(loc: Locator) {
    return loc.evaluate((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        const tops = new Set<number>();
        for (const r of Array.from(range.getClientRects())) {
            if (r.width > 0) tops.add(Math.round(r.top));
        }
        return {
            lines: tops.size,
            numeric: getComputedStyle(el).fontVariantNumeric,
            text: (el.textContent ?? "").trim(),
        };
    });
}

const PANELS = [
    { tab: "Audit Log", label: "Admin audit entries", settle: "suspend_user", rows: ':scope tbody > tr, :scope > [role="listitem"]' },
    { tab: "Flagged", label: "Flagged gallery entries", settle: "spiral-lattice-04", rows: '[role="listitem"]' },
    { tab: "Users", label: "Admin user list", settle: "amber-fox-12", rows: ':scope > [role="listitem"]' },
] as const;

for (const scheme of ["light", "dark"] as const) {
    for (const vp of [
        { width: 1440, height: 900 },
        { width: 390, height: 844 },
    ]) {
        test.describe(`G-t — admin tables @ ${vp.width} ${scheme}`, () => {
            test.use({ viewport: vp, colorScheme: scheme });

            for (const p of PANELS) {
                test(`${p.tab}: badges fit, one rule per row${p.tab === "Audit Log" && vp.width === 1440 ? ", one-line timestamp" : ""}`, async ({ page }) => {
                    const panel = await openPanel(page, p.tab, p.label, p.settle);

                    const rows = panel.locator(p.rows);
                    await expect(rows.first()).toBeVisible();
                    expect(await rows.count()).toBeGreaterThanOrEqual(p.tab === "Audit Log" ? 5 : 2);

                    await panel.screenshot({
                        path: `e2e/screenshots/f-w14/${PHASE}-${p.tab.replace(/\s+/g, "-").toLowerCase()}-${vp.width}-${scheme}.png`,
                    });

                    const badges = await badgeOverflow(panel);
                    expect(badges.length).toBeGreaterThan(0);
                    for (const b of badges) {
                        expect.soft(b.scroll, `badge "${b.text}" overflows its pill`).toBeLessThanOrEqual(b.client);
                    }

                    for (const r of await rulesBetweenRows(rows)) {
                        expect.soft(r.rules, `rows ${r.pair}/${r.pair + 1}: ${r.parts.join(" + ") || "no rule"}`).toBe(1);
                    }

                    if (p.tab === "Audit Log" && vp.width === 1440) {
                        const stamps = panel.locator("time[datetime], .tabular-nums");
                        expect.soft(await stamps.count()).toBe(LONG_AUDIT.items.length);
                        for (let i = 0; i < LONG_AUDIT.items.length; i++) {
                            const t = await lineCount(stamps.nth(i));
                            expect.soft(t.lines, `timestamp "${t.text}" wraps`).toBe(1);
                            expect.soft(t.numeric).toContain("tabular-nums");
                        }
                    }
                });
            }
        });
    }
}
