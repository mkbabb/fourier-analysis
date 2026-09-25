// SERVED MODEL: claude-opus-5-5
import { expect, test, type Locator, type Page } from "@playwright/test";
import {
    ADMIN_AUDIT,
    ADMIN_FLAGGED,
    ADMIN_TOKEN,
    ADMIN_USERS,
    ENTRY,
    stubAdminApi,
} from "./fixtures/gallery";

/**
 * X.F.W14U.admin — the admin family (spec `F-W14U.md` Units :8-18; register
 * `audit/UI-AUDIT-fourier.md` sections gallery-admin-banner-batch,
 * gallery-admin-users, gallery-admin-flagged, gallery-admin-audit). One case
 * per cured row; the frame cases bank the served page under `FW14U_PHASE`
 * (before | after) at 1440 and 390, light and dark.
 *
 * Data: every admin endpoint is stubbed (`fixtures/gallery`); per-case routes
 * registered after `stubAdminApi` win (Playwright matches the newest first).
 */

const PHASE = process.env.FW14U_PHASE ?? "after";
const FRAMES = "e2e/screenshots/f-w14u/admin";

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };

const FEATURED = { ...ENTRY, slug: "gilded-crane-orbit-two", image_slug: "img-gilded-crane", title: "Gilded crane orbit", tier: "featured" };
const SAVED = { ...ENTRY, slug: "quiet-heron-lattice-three", image_slug: "img-quiet-heron", title: "Quiet heron lattice", tier: "saved" };
const SAVED2 = { ...ENTRY, slug: "saffron-kite-drift-four", image_slug: "img-saffron-kite", title: "Saffron kite drift", tier: "saved" };
const ENTRIES = [ENTRY, FEATURED, SAVED, SAVED2];

function json(body: unknown, status = 200) {
    return { status, contentType: "application/json", body: JSON.stringify(body) };
}

function problem(detail: string) {
    return {
        status: 500,
        contentType: "application/problem+json",
        body: JSON.stringify({ type: "about:blank", title: "Internal Server Error", status: 500, detail }),
    };
}

async function frame(page: Page, name: string): Promise<void> {
    const w = page.viewportSize()!.width;
    await page.screenshot({ path: `${FRAMES}/${PHASE}-${name}-${w}.png`, fullPage: false });
}

/** Admin mode on /gallery over stubbed data; `before` registers extra routes. */
async function openAdmin(page: Page, before?: (page: Page) => Promise<void>): Promise<void> {
    await stubAdminApi(page, ENTRIES);
    if (before) await before(page);
    await page.goto(`/gallery?admin=${ADMIN_TOKEN}`);
    await expect(page.getByRole("region", { name: "Admin mode banner" })).toBeVisible({ timeout: 60_000 });
}

async function openTab(page: Page, tab: string): Promise<void> {
    await page.getByRole("tab", { name: tab }).click();
}

async function openUsers(page: Page, before?: (page: Page) => Promise<void>): Promise<Locator> {
    await openAdmin(page, before);
    await openTab(page, "Users");
    const list = page.locator('[aria-label="Admin user list"]');
    await expect(list.getByText("amber-fox-12").first()).toBeVisible({ timeout: 60_000 });
    return list;
}

async function openFlagged(page: Page, before?: (page: Page) => Promise<void>): Promise<Locator> {
    await openAdmin(page, before);
    await openTab(page, "Flagged");
    const list = page.locator('[aria-label="Flagged gallery entries"]');
    await expect(list.getByText("spiral-lattice-04").first()).toBeVisible({ timeout: 60_000 });
    return list;
}

async function openAudit(page: Page, before?: (page: Page) => Promise<void>): Promise<void> {
    await openAdmin(page, before);
    await openTab(page, "Audit Log");
    await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 60_000 });
}

/** The distinct line boxes a text element paints (1 = it never wrapped). */
async function lineCount(el: Locator): Promise<number> {
    // Per text node: a word that breaks ("ENTRI/ES", "70./0") paints one text
    // node on two lines. Element boxes are not read (an inline box and its
    // text sit at different tops on one line).
    return el.evaluate((node) => {
        let most = 0;
        const walk = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        for (let t = walk.nextNode(); t; t = walk.nextNode()) {
            if (!t.textContent?.trim()) continue;
            const r = document.createRange();
            r.selectNodeContents(t);
            const tops = new Set<number>();
            for (const rect of Array.from(r.getClientRects())) if (rect.width > 0) tops.add(Math.round(rect.top));
            most = Math.max(most, tops.size);
        }
        return most;
    });
}

// ── frames: the four admin surfaces at 1440 and 390, light and dark ─────────
for (const scheme of ["light", "dark"] as const) {
    for (const vp of [DESKTOP, PHONE]) {
        test.describe(`frames ${vp.width} ${scheme}`, () => {
            test.use({ viewport: vp, colorScheme: scheme, hasTouch: vp.width < 1024 });
            test(`admin surfaces ${vp.width} ${scheme}`, async ({ page }) => {
                await openAdmin(page);
                await page.waitForTimeout(400);
                await frame(page, `banner-${scheme}`);
                for (const e of [SAVED, SAVED2, ENTRY]) {
                    await page.getByRole("checkbox", { name: `Select ${e.title}` }).first().click();
                }
                await page.getByRole("group", { name: "Batch gallery actions" }).scrollIntoViewIfNeeded();
                await page.waitForTimeout(300);
                await frame(page, `batch-${scheme}`);
                await openTab(page, "Users");
                await expect(page.getByText("amber-fox-12").first()).toBeVisible({ timeout: 60_000 });
                await page.waitForTimeout(300);
                await frame(page, `users-${scheme}`);
                await openTab(page, "Flagged");
                await expect(page.getByText("spiral-lattice-04").first()).toBeVisible({ timeout: 60_000 });
                await page.waitForTimeout(300);
                await frame(page, `flagged-${scheme}`);
                await openTab(page, "Audit Log");
                await expect(page.getByText("gull-figure-19").first()).toBeVisible({ timeout: 60_000 });
                await page.waitForTimeout(300);
                await frame(page, `audit-${scheme}`);
            });
        });
    }
}

// ── gallery-admin-banner-batch ─────────────────────────────────────────────
test.describe("a104 UIA-F-104 — selection reads on every tier", () => {
    test.use({ viewport: DESKTOP });
    test("a selected saved card wears a selection ring an unselected saved card does not", async ({ page }) => {
        await openAdmin(page);
        await page.getByRole("checkbox", { name: `Select ${SAVED.title}` }).click();
        const ring = (title: string) =>
            page.locator("article.gallery-card", { hasText: title }).evaluate((el) => {
                const cs = getComputedStyle(el);
                return { style: cs.outlineStyle, width: parseFloat(cs.outlineWidth), color: cs.outlineColor, rim: cs.borderTopColor };
            });
        const on = await ring(SAVED.title);
        const off = await ring(SAVED2.title);
        expect(on.style, "the selected card draws a ring layer").not.toBe("none");
        expect(on.width).toBeGreaterThanOrEqual(2);
        expect(off.style, "the unselected card draws none").toBe("none");
        expect(on.color, "the ring is not the tier rim's hue").not.toBe(on.rim);
    });
});

test.describe("a105 UIA-F-105 — metric cells never break a word at 390", () => {
    test.use({ viewport: PHONE, hasTouch: true });
    test("every label and value is one line; the cells share one height", async ({ page }) => {
        await openAdmin(page);
        const banner = page.getByRole("region", { name: "Admin mode banner" });
        const cells = banner.locator(".metric");
        await expect(cells).toHaveCount(6);
        const heights: number[] = [];
        for (let i = 0; i < 6; i++) {
            const cell = cells.nth(i);
            expect(await lineCount(cell.locator(".metric__label")), `label ${i}`).toBe(1);
            expect(await lineCount(cell.locator(".metric__reading, .metric__value").first()), `value ${i}`).toBe(1);
            heights.push(Math.round((await cell.boundingBox())!.height));
        }
        expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);
    });
});

// ── gallery-admin-users ────────────────────────────────────────────────────
test.describe("a106 UIA-F-106 — the admin search glyph paints", () => {
    for (const vp of [DESKTOP, PHONE]) {
        test.describe(`${vp.width}`, () => {
            test.use({ viewport: vp, hasTouch: vp.width < 1024 });
            test("the glyph is the topmost element at its own centre", async ({ page }) => {
                await openUsers(page);
                const field = page.getByRole("searchbox", { name: "Search users" });
                const glyph = field.locator("xpath=..").locator("svg").first();
                // Paint order, read by hit-testing: the glyph is `pointer-events:
                // none` by design (clicks reach the field), so the probe arms it
                // for the one read and restores it.
                const hit = await glyph.evaluate((svg) => {
                    const el = svg as SVGElement;
                    const was = el.style.pointerEvents;
                    el.style.pointerEvents = "auto";
                    const b = el.getBoundingClientRect();
                    const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
                    el.style.pointerEvents = was;
                    return { tag: top?.tagName ?? "", inGlyph: !!top && (top === el || el.contains(top)) };
                });
                expect(hit.tag, "the Input no longer covers its glyph").not.toBe("INPUT");
                expect(hit.inGlyph).toBe(true);
            });
        });
    }
});

test.describe("a107 UIA-F-107 — the batch-delete confirm fits its plate", () => {
    for (const vp of [DESKTOP, PHONE]) {
        test.describe(`${vp.width}`, () => {
            test.use({ viewport: vp, hasTouch: vp.width < 1024 });
            test("every footer control sits inside the dialog", async ({ page }) => {
                await openUsers(page);
                await page.getByLabel("Select all on page").check();
                await page.getByRole("group", { name: "Batch user actions" }).getByRole("button", { name: /^Delete/ }).click();
                const dialog = page.getByRole("dialog");
                await expect(dialog).toBeVisible();
                await page.waitForTimeout(400);
                await frame(page, "a107-dialog");
                const plate = (await dialog.boundingBox())!;
                for (const b of await dialog.getByRole("button").all()) {
                    const box = await b.boundingBox();
                    if (!box || box.width === 0) continue;
                    expect(box.x + box.width, `${await b.textContent()} right edge`).toBeLessThanOrEqual(plate.x + plate.width + 0.5);
                    expect(box.x).toBeGreaterThanOrEqual(plate.x - 0.5);
                }
            });
        });
    }
});

// ── gallery-admin-flagged ──────────────────────────────────────────────────
/** Two queue rows: the fixture's normal-tier row and a saved row, broken thumb. */
const FLAGGED_TWO = {
    ...ADMIN_FLAGGED,
    items: [
        ...ADMIN_FLAGGED.items,
        {
            ...ADMIN_FLAGGED.items[0],
            slug: "harmonic-rose-kept-05",
            image_slug: "img-broken-thumb",
            flag_count: 1,
            tier: "saved",
        },
    ],
    has_more: true,
    next_cursor: "c2",
};

async function flaggedTwo(page: Page): Promise<void> {
    await page.route("**/api/admin/flagged**", (r) => r.fulfill(json(FLAGGED_TWO)));
    await page.route("**/api/images/img-broken-thumb/**", (r) => r.fulfill({ status: 404, body: "" }));
}

function flaggedRow(list: Locator, slug: string): Locator {
    return list.getByRole("listitem").filter({ hasText: slug }).first();
}

test.describe("a109 UIA-F-109 — the moderation row is padded", () => {
    for (const vp of [DESKTOP, PHONE]) {
        test.describe(`${vp.width}`, () => {
            test.use({ viewport: vp, hasTouch: vp.width < 1024 });
            test("media and text sit inset from the plate's rim", async ({ page }) => {
                const list = await openFlagged(page);
                const row = flaggedRow(list, "spiral-lattice-04");
                const plate = (await list.locator("xpath=ancestor::*[contains(@class,'card')][1]").boundingBox())!;
                const media = (await row.locator("img, [data-admin-media]").first().boundingBox())!;
                const title = (await row.getByText("spiral-lattice-04").first().boundingBox())!;
                expect(media.x - plate.x, "media inset").toBeGreaterThanOrEqual(8);
                expect(media.y - plate.y, "media top inset").toBeGreaterThanOrEqual(8);
                expect(title.x - plate.x, "text inset").toBeGreaterThanOrEqual(8);
            });
        });
    }
});

test.describe("a110 UIA-F-110 — one visible action per row, the rest in a menu", () => {
    for (const vp of [DESKTOP, PHONE]) {
        test.describe(`${vp.width}`, () => {
            test.use({ viewport: vp, hasTouch: vp.width < 1024 });
            test("Dismiss shows; Keep and Delete live in the row's menu", async ({ page }) => {
                const list = await openFlagged(page);
                const row = flaggedRow(list, "spiral-lattice-04");
                const actions = row.locator("[data-admin-actions]");
                await expect(actions.getByRole("button", { name: /^Dismiss flags on/ })).toBeVisible();
                await expect(actions.getByRole("button", { name: /^Keep|acceptable/ })).toHaveCount(0);
                await expect(actions.getByRole("button", { name: /^Delete entry/ })).toHaveCount(0);
                await actions.getByRole("button", { name: "More actions for spiral-lattice-04" }).click();
                const menu = page.getByRole("menu");
                await expect(menu.getByRole("menuitem", { name: /Keep/ })).toBeVisible();
                await expect(menu.getByRole("menuitem", { name: /Delete/ })).toBeVisible();
                await frame(page, "a110-menu");
            });
        });
    }
});

test.describe("a197 UIA-F-197 — one destructive signal; Normal hidden; Keep gated", () => {
    test.use({ viewport: DESKTOP });
    test("neutral row ink, no Normal tier line, Keep disabled on a Saved row", async ({ page }) => {
        const list = await openFlagged(page, flaggedTwo);
        const row = flaggedRow(list, "spiral-lattice-04");
        const reds = await row.evaluate((el) => {
            const probe = document.createElement("span");
            probe.style.color = "var(--destructive)";
            document.body.appendChild(probe);
            const red = getComputedStyle(probe).color;
            probe.remove();
            const rowBg = getComputedStyle(el).backgroundColor;
            let n = 0;
            for (const node of Array.from(el.querySelectorAll<HTMLElement>("*"))) {
                const cs = getComputedStyle(node);
                const b = node.getBoundingClientRect();
                if (b.width === 0 || cs.visibility === "hidden") continue;
                if (cs.color === red || cs.backgroundColor === red || cs.borderLeftColor === red) n++;
            }
            return { n, rowBg };
        });
        expect(reds.rowBg, "no destructive wash on the row").toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
        expect(reds.n, "destructive inks painted on the resting row").toBeLessThanOrEqual(1);
        await expect(row.getByText(/^normal$/i)).toHaveCount(0);
        const saved = flaggedRow(list, "harmonic-rose-kept-05");
        await saved.getByRole("button", { name: "More actions for harmonic-rose-kept-05" }).click();
        await expect(page.getByRole("menuitem", { name: /Keep/ })).toHaveAttribute("data-disabled", "");
    });
});

test.describe("a198 UIA-F-198 — a broken thumbnail falls back to a media tile", () => {
    test.use({ viewport: DESKTOP });
    test("no broken-image glyph; a fallback tile on --radius-media", async ({ page }) => {
        const list = await openFlagged(page, flaggedTwo);
        const row = flaggedRow(list, "harmonic-rose-kept-05");
        await expect(row.locator("[data-admin-media]")).toBeVisible();
        await page.waitForTimeout(500);
        const broken = await row.locator("img").evaluateAll((imgs) =>
            imgs.filter((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth === 0).length,
        );
        expect(broken, "no painted broken <img>").toBe(0);
    });
});

test.describe("a251 UIA-F-251 — flagged micro-issues", () => {
    test.use({ viewport: DESKTOP });
    test("Load more is a chevron; the thumbnail is --radius-media; the in-flight dialog is locked", async ({ page }) => {
        let release: () => void = () => {};
        const list = await openFlagged(page, async (p) => {
            await flaggedTwo(p);
            await p.route("**/api/admin/visualizations/**", (r) =>
                new Promise<void>((res) => (release = res)).then(() => r.fulfill(json({ ok: true }))),
            );
        });
        const more = page.getByRole("button", { name: "Load more flagged entries" });
        await expect(more.locator("svg.lucide-rotate-cw, svg.lucide-rotate-cw-icon")).toHaveCount(0);
        await expect(more.locator("svg")).toHaveCount(1);
        const radius = await flaggedRow(list, "spiral-lattice-04").locator("[data-admin-media]").evaluate((el) => {
            const probe = document.createElement("span");
            probe.style.borderTopLeftRadius = "var(--radius-media)";
            document.body.appendChild(probe);
            const want = getComputedStyle(probe).borderTopLeftRadius;
            probe.remove();
            return { got: getComputedStyle(el).borderTopLeftRadius, want };
        });
        expect(radius.got).toBe(radius.want);
        const row = flaggedRow(list, "spiral-lattice-04");
        await row.getByRole("button", { name: "More actions for spiral-lattice-04" }).click();
        await page.getByRole("menuitem", { name: /Delete/ }).click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await dialog.getByRole("button", { name: "Delete" }).click();
        await page.keyboard.press("Escape");
        await page.waitForTimeout(300);
        await expect(dialog, "Escape does not close a dialog whose Cancel is disabled").toBeVisible();
        release();
    });
});

// ── gallery-admin-audit ────────────────────────────────────────────────────
/** A 60-entry ledger, 25 on the first page — enough to scroll and to page. */
function auditPage(n: number, total = 60) {
    return {
        items: Array.from({ length: n }, (_, i) => ({
            timestamp: new Date(Date.now() - (i + 1) * 3_600_000).toISOString(),
            action: i % 2 ? "delete" : "set_tier",
            target: `entry-${String(i).padStart(2, "0")}`,
            ip_hash: `a${i}f00d`,
        })),
        total,
        page: 1,
        pages: Math.ceil(total / 25),
    };
}

test.describe("a111 UIA-F-111 — the badge shows the stored action; the filter finds what it shows", () => {
    test.use({ viewport: DESKTOP });
    test("no uppercase transform; typing the shown value in any case matches", async ({ page }) => {
        const asked: string[] = [];
        await openAudit(page, async (p) => {
            await p.route("**/api/admin/audit**", (r) => {
                asked.push(new URL(r.request().url()).searchParams.get("action") ?? "");
                return r.fulfill(json(ADMIN_AUDIT));
            });
        });
        const badge = page.locator("table").getByText("set_tier", { exact: true }).first();
        await expect(badge).toBeVisible();
        expect(await badge.evaluate((el) => getComputedStyle(el).textTransform)).toBe("none");
        await page.getByLabel(/^Action/).fill("SET_TIER");
        await page.getByLabel(/^Action/).press("Enter");
        await expect.poll(() => asked.at(-1)).toBe("set_tier");
    });
});

test.describe("a200 UIA-F-200 — the ledger's filter bar sticks flush and stays compact", () => {
    test.describe("1440", () => {
        test.use({ viewport: DESKTOP });
        test("scrolled, no row paints between the dock and the bar", async ({ page }) => {
            await openAudit(page, async (p) => {
                await p.route("**/api/admin/audit**", (r) => r.fulfill(json(auditPage(25))));
            });
            const bar = page.locator("[data-admin-toolbar], .cartoon-card.sticky").first();
            await expect(bar).toBeVisible();
            const scroller = await bar.evaluate((el) => {
                let s: HTMLElement | null = el.parentElement;
                while (s && !/(auto|scroll)/.test(getComputedStyle(s).overflowY)) s = s.parentElement;
                s!.scrollTop = 600;
                return s!.getBoundingClientRect().top;
            });
            await page.waitForTimeout(300);
            await frame(page, "a200-scrolled");
            const b = (await bar.boundingBox())!;
            expect(b.y - scroller, "the bar's top is the scroller's top").toBeLessThanOrEqual(1);
        });
    });
    test.describe("390", () => {
        test.use({ viewport: PHONE, hasTouch: true });
        test("the phone bar is one compact row; its filters open in a popover", async ({ page }) => {
            await openAudit(page);
            const bar = page.locator("[data-admin-toolbar], .cartoon-card.sticky").first();
            const h = (await bar.boundingBox())!.height;
            expect(h, "phone bar height").toBeLessThanOrEqual(64);
            await bar.getByRole("button", { name: /Filters/ }).click();
            await expect(page.getByLabel(/^Action/)).toBeVisible();
            await frame(page, "a200-popover");
        });
    });
});

test.describe("a252 UIA-F-252 — audit micro-issues", () => {
    test.use({ viewport: DESKTOP });
    test("short relative times, an inline clear on filtered-empty, one pager voice, no double dim", async ({ page }) => {
        let hold = false;
        let release: () => void = () => {};
        await openAudit(page, async (p) => {
            await p.route("**/api/admin/audit**", async (r) => {
                const action = new URL(r.request().url()).searchParams.get("action");
                if (hold) await new Promise<void>((res) => (release = res));
                return r.fulfill(json(action ? { items: [], total: 0, page: 1, pages: 1 } : auditPage(25)));
            });
        });
        const firstTime = page.locator("table time").first();
        await expect(firstTime).toBeVisible();
        const t = (await firstTime.textContent())!.trim();
        expect(t, "no year").not.toMatch(/20\d\d/);
        expect(t, "no seconds").not.toMatch(/\d:\d\d:\d\d/);
        await expect(firstTime).toHaveAttribute("title", /20\d\d/);
        const pager = page.getByRole("navigation", { name: "Audit log pagination" });
        await expect(pager).toContainText(/Page 1 of 3/);
        await expect(pager).not.toContainText(/\/\s*\d+\s*total/);
        hold = true;
        await page.getByLabel(/^Action/).fill("nothing_matches");
        await page.getByLabel(/^Action/).press("Enter");
        const op = await page.locator("table").evaluate((el) => {
            let o = 1;
            for (let n: Element | null = el; n; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity);
            return o;
        });
        expect(op, "the table is not dimmed a second time while loading").toBeGreaterThan(0.95);
        hold = false;
        release();
        await expect(page.getByText("No entries match these filters")).toBeVisible();
        await page.getByRole("button", { name: "Clear filters" }).last().click();
        await expect(page.getByLabel(/^Action/)).toHaveValue("");
    });
});

// ── users: rows, toolbar, paging ───────────────────────────────────────────
function usersPage(n: number, total: number, page = 1) {
    return {
        items: Array.from({ length: n }, (_, i) => ({
            ...ADMIN_USERS.items[i % 2],
            user_slug: i === 0 ? "amber-fox-12" : `user-${page}-${String(i).padStart(2, "0")}`,
        })),
        total,
        page,
        pages: Math.ceil(total / 20),
    };
}

test.describe("a193 UIA-F-193 — user rows read selected; one count; labelled row actions", () => {
    test.use({ viewport: DESKTOP });
    test("the selected row takes a fill; a header count; the row menu names Suspend and Delete", async ({ page }) => {
        const list = await openUsers(page);
        const rows = list.getByRole("listitem");
        await rows.first().getByRole("checkbox").click();
        const bg = (i: number) => rows.nth(i).evaluate((el) => getComputedStyle(el).backgroundColor + "|" + getComputedStyle(el).backgroundImage);
        expect(await bg(0), "selected row differs from the unselected row").not.toBe(await bg(1));
        await expect(page.getByRole("heading", { name: /\b2 users\b/ })).toBeVisible();
        await expect(page.getByText(/\b\d+ users? selected\b/)).toHaveCount(1);
        await expect(page.locator('label[for="admin-select-all"]')).toHaveText(/^\s*Select all on page\s*$/);
        await rows.first().getByRole("button", { name: "Actions for user amber-fox-12" }).click();
        const menu = page.getByRole("menu");
        await expect(menu.getByRole("menuitem", { name: /^Suspend/ })).toBeVisible();
        await expect(menu.getByRole("menuitem", { name: /^Delete/ })).toBeVisible();
    });
});

test.describe("a194 UIA-F-194 — one toolbar pattern; Prune in an overflow menu", () => {
    test.use({ viewport: DESKTOP });
    test("no Prune peer of search; the More menu's Prune opens the confirm", async ({ page }) => {
        await openUsers(page);
        const bar = page.locator("[data-admin-toolbar], .cartoon-card.sticky").first();
        await expect(bar.getByRole("button", { name: /^Prune/ })).toHaveCount(0);
        await bar.getByRole("button", { name: "More user actions" }).click();
        await page.getByRole("menuitem", { name: /Prune empty users/ }).click();
        await expect(page.getByRole("dialog")).toContainText("Prune empty users?");
        await page.keyboard.press("Escape");
        await openTab(page, "Audit Log");
        await expect(page.getByText("gull-figure-19").first()).toBeVisible();
        await expect(page.locator("[data-admin-toolbar]")).toHaveCount(1);
    });
});

test.describe("a195 UIA-F-195 — a page turn lands on the list's top", () => {
    test.use({ viewport: DESKTOP });
    test("Next brings the list head into view", async ({ page }) => {
        const list = await openUsers(page, async (p) => {
            await p.route("**/api/admin/users**", (r) => {
                const pg = Number(new URL(r.request().url()).searchParams.get("page") ?? 1);
                return r.fulfill(json(usersPage(20, 45, pg)));
            });
        });
        const next = page.getByRole("navigation", { name: "User list pagination" }).getByRole("button", { name: "Next page" });
        await next.scrollIntoViewIfNeeded();
        const turnedFrom = (await list.boundingBox())!.y;
        expect(turnedFrom, "the pager sits below the fold's list head (scrolled)").toBeLessThan(0);
        await next.click();
        await expect(list.getByText("user-2-01")).toBeAttached();
        await page.waitForTimeout(500);
        const top = (await list.boundingBox())!.y;
        expect(top, "list head is on screen").toBeGreaterThanOrEqual(0);
        expect(top).toBeLessThan(DESKTOP.height / 2);
    });
});

test.describe("a195b UIA-F-195 — the audit ledger's page turn lands on its top", () => {
    test.use({ viewport: DESKTOP });
    test("Next brings the table head into view", async ({ page }) => {
        await openAudit(page, async (p) => {
            await p.route("**/api/admin/audit**", (r) => r.fulfill(json(auditPage(25))));
        });
        const next = page.getByRole("navigation", { name: "Audit log pagination" }).getByRole("button", { name: "Next page" });
        await next.scrollIntoViewIfNeeded();
        const table = page.locator("table").first();
        expect((await table.boundingBox())!.y, "scrolled").toBeLessThan(0);
        await next.click();
        await page.waitForTimeout(600);
        const top = (await table.boundingBox())!.y;
        expect(top, "table head is on screen").toBeGreaterThanOrEqual(0);
        expect(top).toBeLessThan(DESKTOP.height / 2);
    });
});

test.describe("a196 UIA-F-196 — at 390 user meta never wraps and slugs keep their length", () => {
    test.use({ viewport: PHONE, hasTouch: true });
    test("each labelled field is one line; a 24-character slug is whole", async ({ page }) => {
        const slug = "harmonic-rose-janitor-24";
        const list = await openUsers(page, async (p) => {
            await p.route("**/api/admin/users**", (r) =>
                r.fulfill(json({ ...ADMIN_USERS, items: [...ADMIN_USERS.items, { ...ADMIN_USERS.items[0], user_slug: slug }], total: 3 })),
            );
        });
        for (const f of await list.locator("[data-admin-field]").all()) expect(await lineCount(f), (await f.textContent())!.trim()).toBe(1);
        const t = list.getByText(slug, { exact: true });
        expect(await t.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    });
});

test.describe("a250 UIA-F-250 — users loading is skeletal; the pager jumps and sizes", () => {
    test.use({ viewport: DESKTOP });
    test("Skeleton rows while loading; First/Last and a page size", async ({ page }) => {
        let release: () => void = () => {};
        let hold = true;
        await openAdmin(page, async (p) => {
            await p.route("**/api/admin/users**", async (r) => {
                const pg = Number(new URL(r.request().url()).searchParams.get("page") ?? 1);
                if (hold) await new Promise<void>((res) => (release = res));
                return r.fulfill(json(usersPage(20, 45, pg)));
            });
        });
        await openTab(page, "Users");
        await expect(page.locator('[data-slot="skeleton"], [class*="skeleton"]').first()).toBeAttached();
        await expect(page.getByText("Loading users…")).toHaveCount(0);
        hold = false;
        release();
        const nav = page.getByRole("navigation", { name: "User list pagination" });
        await expect(nav.getByRole("button", { name: "First page" })).toBeVisible();
        await expect(nav.getByRole("button", { name: "Last page" })).toBeVisible();
        await expect(nav.getByRole("combobox", { name: "Rows per page" })).toBeVisible();
    });
});

// ── status surfaces (users, flagged, audit) ───────────────────────────────
test.describe("a199 UIA-F-199 — errors are glass Alerts carrying the problem's detail", () => {
    test.use({ viewport: DESKTOP });
    for (const [tab, route] of [
        ["Users", "**/api/admin/users**"],
        ["Flagged", "**/api/admin/flagged**"],
        ["Audit Log", "**/api/admin/audit**"],
    ] as const) {
        test(`${tab}`, async ({ page }) => {
            const detail = `upstream ledger unavailable (${tab})`;
            await openAdmin(page, async (p) => {
                await p.route(route, (r) => r.fulfill(problem(detail)));
            });
            await openTab(page, tab);
            const alert = page.locator('[data-slot="alert"]');
            await expect(alert).toBeVisible({ timeout: 30_000 });
            await expect(alert).toContainText(detail);
            await expect(alert.locator("svg.lucide-flag, svg.lucide-flag-icon")).toHaveCount(0);
            await expect(alert.getByRole("button", { name: "Try again" })).toBeVisible();
        });
    }
});

// ── banner + batch ─────────────────────────────────────────────────────────
test.describe("a191 UIA-F-191 — card overlay controls on the producer's rungs", () => {
    test.use({ viewport: DESKTOP });
    test("overlay buttons are square, the checkbox is a ≥24px target", async ({ page }) => {
        await openAdmin(page);
        const card = page.locator("article.gallery-card", { hasText: SAVED.title });
        for (const b of await card.getByRole("button", { name: /Toggle featured|Toggle saved|^Delete/ }).all()) {
            const box = (await b.boundingBox())!;
            expect(Math.abs(box.width - box.height), "square").toBeLessThanOrEqual(1);
        }
        const cb = card.getByRole("checkbox");
        const hit = await cb.evaluate((el) => {
            const b = el.getBoundingClientRect();
            const target = el.closest("label") ?? el;
            const t = target.getBoundingClientRect();
            return Math.min(Math.max(b.width, t.width), Math.max(b.height, t.height));
        });
        expect(hit).toBeGreaterThanOrEqual(24);
    });
});

test.describe("a192 UIA-F-192 — focus lands on a neighbour when its control unmounts", () => {
    test.use({ viewport: DESKTOP });
    test("after Clear selection and after Log out, focus is not on <body>", async ({ page }) => {
        await openAdmin(page);
        await page.getByRole("checkbox", { name: `Select ${SAVED.title}` }).click();
        await page.getByRole("button", { name: "Clear selection" }).focus();
        await page.keyboard.press("Enter");
        await expect(page.getByRole("group", { name: "Batch gallery actions" })).toHaveCount(0);
        expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY");
        await page.getByRole("button", { name: "Exit admin mode" }).focus();
        await page.keyboard.press("Enter");
        await expect(page.getByRole("region", { name: "Admin mode banner" })).toHaveCount(0);
        expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY");
    });
});

test.describe("a249 UIA-F-249 — banner and batch micro-issues", () => {
    test.describe("stats error", () => {
        test.use({ viewport: DESKTOP });
        test("the copy states the failure without blaming the credential", async ({ page }) => {
            await stubAdminApi(page, ENTRIES);
            await page.route("**/api/admin/stats", (r) => r.fulfill(problem("stats aggregation timed out")));
            await page.goto(`/gallery?admin=${ADMIN_TOKEN}`);
            const alert = page.getByRole("region", { name: "Admin mode banner" }).getByRole("alert");
            await expect(alert).toBeVisible({ timeout: 60_000 });
            const text = (await alert.textContent())!.replace(/\s+/g, " ").trim();
            expect(text).not.toMatch(/credential/i);
            expect(text).toMatch(/stats aggregation timed out[.:;]/);
        });
    });
    for (const vp of [DESKTOP, PHONE]) {
        test.describe(`batch ${vp.width}`, () => {
            test.use({ viewport: vp, hasTouch: vp.width < 1024 });
            test("a grouped bar; verbs never overlap; Unfeature has a glyph and waits for a featured entry", async ({ page }) => {
                await openAdmin(page);
                await page.getByRole("checkbox", { name: `Select ${SAVED.title}` }).click();
                const bar = page.getByRole("group", { name: "Batch gallery actions" });
                await bar.scrollIntoViewIfNeeded();
                const count = (await bar.getByText(/selected/).boundingBox())!;
                const verbs = await bar.getByRole("button").all();
                const boxes = [];
                for (const v of verbs) boxes.push({ name: (await v.getAttribute("aria-label")) ?? (await v.textContent())!.trim(), box: (await v.boundingBox())! });
                const plate = (await bar.boundingBox())!;
                for (let i = 0; i < boxes.length; i++) {
                    const a = boxes[i].box;
                    expect(a.x + a.width, `${boxes[i].name} inside the bar`).toBeLessThanOrEqual(plate.x + plate.width + 0.5);
                    for (let j = i + 1; j < boxes.length; j++) {
                        const b = boxes[j].box;
                        const overlap = a.x < b.x + b.width - 0.5 && b.x < a.x + a.width - 0.5 && a.y < b.y + b.height - 0.5 && b.y < a.y + a.height - 0.5;
                        expect(overlap, `${boxes[i].name} × ${boxes[j].name}`).toBe(false);
                    }
                }
                const feature = bar.getByRole("button", { name: /^Feature/ });
                const gap = (await feature.boundingBox())!.x - (count.x + count.width);
                if (vp.width >= 1024) expect(gap, "count sits with its verbs").toBeLessThanOrEqual(24);
                const unfeature = bar.getByRole("button", { name: /^Unfeature/ });
                await expect(unfeature.locator("svg")).toHaveCount(1);
                await expect(unfeature).toBeDisabled();
                expect(await feature.evaluate((el) => el.classList.contains("text-xs"))).toBe(false);
                await frame(page, "a249-batch");
            });
        });
    }
});
