/**
 * X.F.W14V.au1 — the AUDIT-2 safe-area / mobile-shell family (F-W14V.md §1
 * `.au0…`, F-W14U.md addendum (e), `audit/AUDIT-2-fourier.md` Lens 2 + the
 * `.au0` receipt's X rows). One falsifier per row, each measured with the
 * CDP safe-area override (`Emulation.setSafeAreaInsetsOverride`, COHESION
 * §0cy item 11): portrait phones carry top 47 / bottom 34, landscape 844×390
 * carries left 47 / right 47 / bottom 21 (the register's insets).
 *
 *   L2-1   the document scroll range is 0 with a bottom inset (every route).
 *   L2-2ˢ  the bottom docks clear the home-indicator zone (/v Canvas tab and
 *          the fullscreen takeover). The glass half (`--safe-block-end`) is O-74.
 *   L2-3   landscape: no interactive content under the notch sides.
 *   L2-4   short landscape: the controls sit beside the stage (no tab row);
 *          /equation puts its plot beside the series.
 *   L2-5   the mobile Controls/Canvas strip is centred on the column's axis.
 *   L2-16  landscape paper chrome: the floating bar is one title rung and the
 *          ToC plate ends above the inset.
 *   L3-6ˢ  one page gutter across the routes (the glass gutter token is O-68).
 *   L2-17  the Like control and the About links are ≥ 44 px on touch.
 *   X-1    1024×768: the workspace takes one coherent form (never a stacked
 *          strip beside a hidden tab row).
 *   X-5    the logged-in app dock at 360 does not pan sideways.
 *
 * Served from :3100 against :8000 (BASE_URL), Chromium (CDP).
 */
import { expect, test, type Page } from "@playwright/test";

import { ENTRY, stubGallery } from "./fixtures/gallery";
import { seededViz } from "./fixtures/seed";

const PORTRAIT = { width: 390, height: 844 };
const LANDSCAPE = { width: 844, height: 390 };
const P_INSETS = { top: 47, bottom: 34, left: 0, right: 0 };
const L_INSETS = { top: 0, bottom: 21, left: 47, right: 47 };

async function insets(page: Page, i: { top: number; bottom: number; left: number; right: number }): Promise<void> {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setSafeAreaInsetsOverride" as never, { insets: i } as never);
}

async function settle(page: Page, ms = 700): Promise<void> {
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await page.waitForTimeout(ms);
}

type Box = { x: number; y: number; w: number; h: number; r: number; b: number };
async function box(page: Page, sel: string): Promise<Box | null> {
    return page.evaluate((s) => {
        const el = Array.from(document.querySelectorAll(s)).find((e) => {
            const r = e.getBoundingClientRect();
            return r.width > 1 && r.height > 1 && getComputedStyle(e).visibility !== "hidden";
        });
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left, y: r.top, w: r.width, h: r.height, r: r.right, b: r.bottom };
    }, sel);
}

async function openWorkspace(page: Page): Promise<void> {
    await page.goto(`/v/${seededViz().slug}`);
    await expect(page.locator(".viz-configurator")).toBeVisible({ timeout: 30_000 });
    await settle(page);
}

async function toCanvasTab(page: Page): Promise<void> {
    const tab = page.getByRole("tab", { name: "Canvas" }).filter({ visible: true }).first();
    if (await tab.count()) {
        await expect(async () => {
            await tab.click();
            await expect(page.locator(".animation-dock")).toBeVisible({ timeout: 4_000 });
        }).toPass({ timeout: 30_000 });
    }
    await expect(page.locator(".animation-dock")).toBeVisible({ timeout: 30_000 });
    await settle(page, 500);
}

// ── L2-1: the document scroll range is 0 with a bottom inset ────────────────
for (const [name, vp, ins, inset] of [
    ["portrait 390", PORTRAIT, P_INSETS, 34],
    ["landscape 844", LANDSCAPE, L_INSETS, 21],
] as const) {
    test.describe(`au1 L2-1 (${name})`, () => {
        test.use({ viewport: vp, hasTouch: true });
        test("the document never scrolls by the inset", async ({ page }) => {
            test.setTimeout(90_000);
            await insets(page, ins);
            // The override is live (the inset reads through env()).
            await page.goto("/gallery");
            await settle(page);
            const envB = await page.evaluate(() => {
                const d = document.createElement("div");
                d.style.cssText = "position:fixed;height:env(safe-area-inset-bottom)";
                document.body.appendChild(d);
                const h = d.getBoundingClientRect().height;
                d.remove();
                return h;
            });
            expect(envB, "CDP inset reads through env()").toBe(inset);
            for (const route of ["/gallery", "/paper", `/v/${seededViz().slug}`]) {
                await page.goto(route);
                await settle(page, 900);
                const m = await page.evaluate(() => {
                    // What reaches past the viewport outside every clipping box
                    // (named in the failure so a RED says which element).
                    const past: string[] = [];
                    for (const e of Array.from(document.body.querySelectorAll("*"))) {
                        const r = e.getBoundingClientRect();
                        if (r.height === 0 || r.bottom <= innerHeight + 1) continue;
                        // An out-of-flow box may escape its scroller, so it is never
                        // excused as clipped.
                        const oof = /absolute|fixed/.test(getComputedStyle(e).position);
                        let a = oof ? null : e.parentElement, clipped = false;
                        while (a && a !== document.body) {
                            const o = getComputedStyle(a);
                            if ((o.overflowY !== "visible" || o.overflowX !== "visible") && a.getBoundingClientRect().bottom <= innerHeight + 1) { clipped = true; break; }
                            a = a.parentElement;
                        }
                        if (!clipped) past.push(`${e.tagName.toLowerCase()}.${String(e.className).slice(0, 40)} b=${Math.round(r.bottom)}`);
                    }
                    window.scrollTo(0, 9999);
                    return { sh: document.documentElement.scrollHeight, ih: innerHeight, sy: scrollY, past: past.slice(0, 6) };
                });
                expect.soft(m.sh, `${route}: docSH vs innerHeight ${m.ih} (past the fold: ${m.past.join(" | ")})`).toBe(m.ih);
                expect.soft(m.sy, `${route}: scrollY after scrollTo(0, 9999)`).toBe(0);
            }
        });
    });
}

// ── L2-2ˢ: the bottom docks clear the home-indicator zone ────────────────────
test.describe("au1 L2-2 consumer half (390 portrait)", () => {
    test.use({ viewport: PORTRAIT, hasTouch: true });
    test("the animation dock ends above the inset, in the stage and in fullscreen", async ({ page }) => {
        test.setTimeout(90_000);
        await insets(page, P_INSETS);
        await openWorkspace(page);
        await toCanvasTab(page);
        const limit = PORTRAIT.height - P_INSETS.bottom;
        const stage = await box(page, ".animation-dock");
        expect(stage, "animation dock present").not.toBeNull();
        expect.soft(stage!.b, `stage dock bottom vs ${limit}`).toBeLessThanOrEqual(limit);
        // The canvas dock expands on hover (f-w14v-u1's idiom); its Fullscreen
        // control opens the takeover, which re-hosts the one stage.
        await page.getByRole("button", { name: "Edit contour" }).first().hover();
        await page.waitForTimeout(700);
        await page.locator(".controls-dock-anchor [aria-label='Fullscreen']").first().click();
        await expect(page.getByRole("dialog", { name: /fullscreen/i })).toBeVisible({ timeout: 10_000 });
        await settle(page, 600);
        const fs = await box(page, ".animation-dock");
        expect(fs, "animation dock in fullscreen").not.toBeNull();
        expect.soft(fs!.b, `fullscreen dock bottom vs ${limit}`).toBeLessThanOrEqual(limit);
    });
});

// ── L2-3: landscape, nothing interactive under the notch sides ───────────────
test.describe("au1 L2-3 (844×390, insets L/R 47)", () => {
    test.use({ viewport: LANDSCAPE, hasTouch: true });
    test("interactive content keeps clear of the notch sides on every route", async ({ page }) => {
        test.setTimeout(120_000);
        await insets(page, L_INSETS);
        for (const route of ["/gallery", `/v/${seededViz().slug}`, "/equation", "/paper"]) {
            await page.goto(route);
            await settle(page, 1200);
            const bad = await page.evaluate(({ l, r }) => {
                const out: string[] = [];
                const sel = "button, a[href], [role=tab], [role=button], input, select, textarea, canvas";
                for (const el of Array.from(document.querySelectorAll(sel))) {
                    const b = el.getBoundingClientRect();
                    if (b.width < 2 || b.height < 2) continue;
                    if (b.bottom <= 0 || b.top >= innerHeight) continue;
                    const cs = getComputedStyle(el);
                    if (cs.visibility === "hidden" || el.closest("[aria-hidden=true],[inert]")) continue;
                    // Content clipped inside its own scroller is judged by the scroller.
                    let clip = el.parentElement, hidden = false;
                    while (clip) {
                        const o = getComputedStyle(clip).overflowX;
                        if (o !== "visible") {
                            const c = clip.getBoundingClientRect();
                            if (b.right <= c.left || b.left >= c.right) hidden = true;
                        }
                        clip = clip.parentElement;
                    }
                    if (hidden) continue;
                    if (b.left < l - 0.5 || b.right > innerWidth - r + 0.5) {
                        const name = (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 24);
                        out.push(`${el.tagName.toLowerCase()} "${name}" [${Math.round(b.left)}..${Math.round(b.right)}]`);
                    }
                }
                return out;
            }, { l: L_INSETS.left, r: L_INSETS.right });
            expect.soft(bad, `${route}: controls under the notch sides`).toEqual([]);
        }
    });
});

/** The workspace's measured form: the visible tab row, the stage, the aside. */
async function form(page: Page, shell: string) {
    return page.evaluate((s) => {
        const vis = (e: Element | null) => {
            if (!e) return null;
            const r = e.getBoundingClientRect();
            if (r.width < 2 || r.height < 2 || getComputedStyle(e).display === "none") return null;
            return { x: r.left, y: r.top, w: r.width, h: r.height, r: r.right, b: r.bottom };
        };
        const tabs = Array.from(document.querySelectorAll("[role=tablist]")).find(
            (t) => /Controls/.test(t.textContent ?? "") && /Canvas/.test(t.textContent ?? "") && vis(t),
        );
        return {
            tabs: tabs ? vis(tabs) : null,
            stage: vis(document.querySelector(`${s} .configurator-stage`)),
            aside: vis(document.querySelector(`${s} .configurator-aside`)),
            shell: vis(document.querySelector(s)),
        };
    }, shell);
}

// ── L2-4: short landscape, the controls beside the stage ─────────────────────
test.describe("au1 L2-4 (844×390)", () => {
    test.use({ viewport: LANDSCAPE, hasTouch: true });
    test("/v and /equation put the controls beside the stage, with no tab row", async ({ page }) => {
        test.setTimeout(120_000);
        await insets(page, L_INSETS);
        await openWorkspace(page);
        let f = await form(page, ".viz-configurator");
        expect.soft(f.tabs, "/v: no Controls/Canvas tab row").toBeNull();
        expect.soft(f.stage && f.aside ? f.aside.x - f.stage.r : -1, "/v: the aside starts right of the stage").toBeGreaterThanOrEqual(0);
        expect.soft(f.stage?.h ?? 0, "/v: stage height").toBeGreaterThanOrEqual(280);
        await expect(page.locator(".animation-dock")).toBeVisible();
        await page.goto("/equation");
        await expect(page.locator(".eq-configurator")).toBeVisible({ timeout: 30_000 });
        await expect(page.locator(".eq-plot-card")).toBeAttached({ timeout: 30_000 });
        await settle(page, 900);
        f = await form(page, ".eq-configurator");
        expect.soft(f.tabs, "/equation: no Controls/Canvas tab row").toBeNull();
        expect.soft(f.stage && f.aside ? f.aside.x - f.stage.r : -1, "/equation: the aside starts right of the stage").toBeGreaterThanOrEqual(0);
        const eq = await box(page, ".eq-card");
        const plot = await box(page, ".eq-plot-card");
        expect.soft(eq && plot ? plot.x - eq.r : -1, "/equation: the plot starts right of the series").toBeGreaterThanOrEqual(-1);
        expect.soft(plot ? plot.b : 9999, "/equation: the plot ends inside the viewport").toBeLessThanOrEqual(LANDSCAPE.height);
    });
});

// ── L2-5: the mobile tab strip spans the column on its gutter ────────────────
for (const width of [360, 390, 430]) {
    test.describe(`au1 L2-5 (${width})`, () => {
        test.use({ viewport: { width, height: 844 }, hasTouch: true });
        test("the Controls/Canvas strip is centred on the column, inside its gutter", async ({ page }) => {
            test.setTimeout(90_000);
            await insets(page, P_INSETS);
            for (const [route, shell] of [[`/v/${seededViz().slug}`, ".viz-configurator"], ["/equation", ".eq-configurator"]] as const) {
                await page.goto(route);
                await expect(page.locator(shell)).toBeVisible({ timeout: 30_000 });
                await settle(page, 700);
                const f = await form(page, shell);
                expect(f.tabs, `${route}: tab row present`).not.toBeNull();
                // Centred on the column's axis (the register's second arm): the
                // strip is glass's content-width tablist, so its centre is the
                // column's centre, and it stays inside the column's gutter.
                const cx = (b: { x: number; r: number }) => (b.x + b.r) / 2;
                expect.soft(Math.abs(cx(f.tabs!) - cx(f.shell!)), `${route}: strip centre vs column centre`).toBeLessThanOrEqual(1);
                expect.soft(f.tabs!.x, `${route}: strip left vs column left`).toBeGreaterThanOrEqual(f.shell!.x - 0.5);
            }
        });
    });
}

// ── L2-16: landscape paper chrome ────────────────────────────────────────────
test.describe("au1 L2-16 (844×390 /paper)", () => {
    test.use({ viewport: LANDSCAPE, hasTouch: true });
    test("the floating bar is one title rung and its ToC plate ends above the inset", async ({ page }) => {
        test.setTimeout(90_000);
        await insets(page, L_INSETS);
        await page.goto("/paper");
        const trigger = page.locator(".floating-toc-title-btn");
        await expect(trigger).toBeVisible({ timeout: 30_000 });
        await settle(page, 900);
        // One title rung: the sticky band is the bar's own row (its tallest
        // control, glass's 4 px pad and 1 px edge each side) plus at most the
        // residue rung above it (4 px), never the portrait 8 px gap.
        const band = await box(page, ".floating-toc");
        const tallest = await page.evaluate(() =>
            Math.max(...Array.from(document.querySelectorAll(".floating-toc-bar > *, .floating-toc-bar button")).map((e) => e.getBoundingClientRect().height)),
        );
        expect.soft(Math.round(band!.h - tallest), "floating band minus its tallest control").toBeLessThanOrEqual(14);
        await trigger.click();
        const plate = page.locator(".floating-toc-dropdown");
        await expect(plate).toBeVisible();
        await settle(page, 500);
        const p = await box(page, ".floating-toc-dropdown");
        expect.soft(p!.b, "ToC plate bottom vs 390 − 21").toBeLessThanOrEqual(LANDSCAPE.height - L_INSETS.bottom);
        expect.soft(p!.x, "ToC plate left vs the notch side").toBeGreaterThanOrEqual(L_INSETS.left);
        expect.soft(p!.r, "ToC plate right vs the notch side").toBeLessThanOrEqual(LANDSCAPE.width - L_INSETS.right);
        const over = await page.evaluate(() => {
            const chip = document.querySelector(".overlay-page");
            const pl = document.querySelector(".floating-toc-dropdown");
            if (!chip || !pl) return "no chip";
            const a = chip.getBoundingClientRect(), b = pl.getBoundingClientRect();
            const x = Math.max(a.left, b.left), y = Math.max(a.top, b.top);
            const x2 = Math.min(a.right, b.right), y2 = Math.min(a.bottom, b.bottom);
            if (x2 <= x || y2 <= y) return "apart";
            const hit = document.elementFromPoint((x + x2) / 2, (y + y2) / 2);
            return hit && pl.contains(hit) ? "plate on top" : "chip over the plate";
        });
        expect.soft(["apart", "plate on top", "no chip"], `page chip vs ToC plate: ${over}`).toContain(over);
    });
});

// ── L3-6ˢ: one page gutter across the routes ─────────────────────────────────
/** The route's content edge: a border box, or (`content`) a padded root's content box. */
async function gutter(page: Page, route: string, sel: string, content = false): Promise<number> {
    await page.goto(route);
    await expect(page.locator(sel).first()).toBeVisible({ timeout: 30_000 });
    await settle(page, 700);
    return page.evaluate(({ s, c }) => {
        const el = document.querySelector(s)!;
        const r = el.getBoundingClientRect();
        const pl = c ? parseFloat(getComputedStyle(el).paddingLeft) || 0 : 0;
        return Math.round(r.left + pl);
    }, { s: sel, c: content });
}
for (const vp of [{ width: 1440, height: 900 }, PORTRAIT]) {
    test.describe(`au1 L3-6 consumer half (${vp.width})`, () => {
        test.use({ viewport: vp, hasTouch: vp.width < 1024 });
        test("the content edge holds across route switches", async ({ page }) => {
            test.setTimeout(120_000);
            const g: Record<string, number> = {};
            g.visualize = await gutter(page, `/v/${seededViz().slug}`, ".viz-configurator");
            g.equation = await gutter(page, "/equation", ".eq-configurator");
            g.gallery = await gutter(page, "/gallery", "main [role=tablist]");
            if (vp.width < 640) {
                g.extractor = await gutter(page, "/demo/shape-extractor", ".extractor-page", true);
                g.notFound = await gutter(page, "/no-such-route", "[data-testid=not-found]");
                g.paper = await gutter(page, "/paper", ".paper-layout", true);
            }
            const vals = Object.values(g);
            expect.soft(Math.max(...vals) - Math.min(...vals), `gutters ${JSON.stringify(g)}`).toBe(0);
        });
    });
}

// ── L2-17: the under-44 px controls on touch ─────────────────────────────────
test.describe("au1 L2-17 (390 touch)", () => {
    test.use({ viewport: PORTRAIT, hasTouch: true });
    test("the modal Like, the /equation layer triggers and the About links are ≥ 44 px", async ({ page }) => {
        test.setTimeout(90_000);
        await stubGallery(page, [ENTRY]);
        await page.goto("/gallery");
        await page.getByRole("button", { name: new RegExp(`^Open (${ENTRY.title ?? ENTRY.image_slug})$`) }).first().click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await settle(page, 600);
        const like = await dialog.getByRole("button", { name: "Like" }).boundingBox();
        expect.soft(like!.height, "modal Like block size").toBeGreaterThanOrEqual(44);
        await page.keyboard.press("Escape");
        await expect(dialog).toBeHidden();
        await page.locator(".logo-trigger").click();
        const about = page.locator(".about-card");
        await expect(about).toBeVisible();
        await settle(page, 400);
        for (const a of await about.locator("a[href]").all()) {
            const b = await a.boundingBox();
            expect.soft(b!.height, `About link "${(await a.textContent())?.trim()}"`).toBeGreaterThanOrEqual(44);
        }
        await page.keyboard.press("Escape");
        await page.goto("/equation");
        await expect(page.locator(".eq-configurator")).toBeVisible({ timeout: 30_000 });
        await settle(page, 700);
        const trig = await page.locator(".eq-configurator .configurator-layer-trigger").evaluateAll((els) =>
            els.filter((e) => e.getBoundingClientRect().height > 0).map((e) => [e.textContent?.trim().slice(0, 16), e.getBoundingClientRect().height] as const),
        );
        expect(trig.length, "/equation layer triggers present").toBeGreaterThan(0);
        for (const [name, h] of trig) expect.soft(h, `/equation trigger "${name}"`).toBeGreaterThanOrEqual(44);
    });
});

// ── X-1: 1024×768, one coherent workspace form ───────────────────────────────
test.describe("au1 X-1 (1024×768)", () => {
    test.use({ viewport: { width: 1024, height: 768 } });
    test("the stage is either beside the controls or a full tab, never a stacked strip", async ({ page }) => {
        test.setTimeout(90_000);
        await openWorkspace(page);
        const f = await form(page, ".viz-configurator");
        if (f.tabs) {
            // Tabbed: one region at a time (the Controls tab shows no stage).
            expect.soft(f.stage, "tabbed: the Controls tab shows no stage strip").toBeNull();
        } else {
            expect.soft(f.stage && f.aside ? f.aside.x - f.stage.r : -1, "no tab row: the aside starts right of the stage").toBeGreaterThanOrEqual(0);
            expect.soft(f.stage?.h ?? 0, "no tab row: stage height").toBeGreaterThanOrEqual(500);
        }
    });
});

// ── X-5: the logged-in app dock at 360 (and 390), on every section ──────────
for (const width of [360, 390]) {
    test.describe(`au1 X-5 (${width} logged in)`, () => {
        test.use({ viewport: { width, height: 780 }, hasTouch: true });
        test("the app dock's layer does not pan sideways once the Account group mounts", async ({ page }) => {
            test.setTimeout(120_000);
            await insets(page, P_INSETS);
            await page.addInitScript(() => {
                localStorage.setItem("fourier-user-slug", "quiet-amber-lattice-fox");
                localStorage.setItem("fourier-user-token", "e2e-token");
            });
            // Every section's name rides the nav trigger, so each is measured.
            for (const route of ["/gallery", "/paper", "/visualize", "/equation", "/morph"]) {
                await page.goto(route);
                await expect(page.locator(".app-dock")).toBeVisible({ timeout: 30_000 });
                await expect(page.locator(".account-trigger")).toBeVisible({ timeout: 10_000 });
                await settle(page, 800);
                const pans = await page.evaluate(() =>
                    Array.from(document.querySelectorAll(".app-header *"))
                        .filter((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== "visible")
                        .map((e) => `${e.className.toString().slice(0, 40)} ${e.scrollWidth}/${e.clientWidth}`),
                );
                expect.soft(pans, `${route}: app-dock scrollers`).toEqual([]);
                const dock = await box(page, ".app-dock");
                expect.soft(dock!.r, `${route}: app dock right edge`).toBeLessThanOrEqual(width);
            }
        });
    });
}
