// SERVED MODEL: claude-opus-5-5
import { expect, test, type Page } from "@playwright/test";

/**
 * X.F.W14U.t — gate G-t, OA-60 (owner, 2026-09-24): "The table of contents
 * should be hideable in the paper view, it should slide under the paper and
 * become a drawer that expands out to where it is now."
 *
 * Spec `F-W14U.md` §0cq `.t` + (b) §0cr (P-2 ruled: glass has no
 * edge-drawer-under-content primitive; the hiding is fourier's layout — the
 * paper grid's ToC column collapses and the ToC goes under the paper, leaving a
 * drawer tab at the paper's edge; glass's own surfaces, none copied).
 *
 *   t1  the toggle is a button with `aria-expanded`/`aria-controls`; hiding is
 *       an animated width transition on the ToC column, the ToC ends hidden
 *       (out of the a11y tree), the column is the tab alone, and the tab sits
 *       at the paper's edge; focus stays on the toggle throughout.
 *   t2  expanding returns the ToC to exactly its place (rect ±0.5 px) with its
 *       own scroll position kept.
 *   t3  the state persists per viewer across a reload, both ways.
 *   t4  storage that throws never breaks the page: the ToC shows, the toggle
 *       still works.
 *   t5  prefers-reduced-motion: the hide is instant (no running transition,
 *       the column collapsed in the first frame).
 *
 * Every figure is read from the served page.
 */

const PHASE = process.env.FW14U_PHASE ?? "after";
const FRAMES = "e2e/screenshots/f-w14u/t";
const TOGGLE = /^(Hide|Show) contents$/;

async function openPaper(page: Page): Promise<void> {
    await page.goto("/paper");
    await expect(page.locator(".paper-article h1")).toBeVisible({ timeout: 60_000 });
}

/** Every time-based animation in the paper's column grid has ended. */
async function settled(page: Page): Promise<void> {
    await page.waitForFunction(() => {
        const grid = document.querySelector(".paper-columns");
        return (
            !!grid &&
            grid
                .getAnimations({ subtree: true })
                .every(
                    (a) =>
                        a.playState !== "running" ||
                        !(a.timeline instanceof DocumentTimeline) ||
                        a.effect?.getTiming().iterations === Infinity,
                )
        );
    });
}

type Box = { l: number; r: number; t: number; b: number; w: number };

async function geometry(page: Page) {
    return page.evaluate(() => {
        const box = (el: Element | null): Box | null => {
            if (!el) return null;
            const q = el.getBoundingClientRect();
            return { l: q.left, r: q.right, t: q.top, b: q.bottom, w: q.width };
        };
        const nav = document.querySelector('nav[aria-label="Table of contents"]');
        const toggle = [...document.querySelectorAll("button")].find((b) =>
            /^(Hide|Show) contents$/.test(b.getAttribute("aria-label") ?? ""),
        );
        return {
            nav: box(nav),
            navScroll: nav?.scrollTop ?? null,
            navVisibility: nav ? getComputedStyle(nav).visibility : null,
            column: box(document.querySelector(".paper-columns > :first-child")),
            article: box(document.querySelector(".paper-article")),
            toggle: box(toggle ?? null),
            focused: !!toggle && document.activeElement === toggle,
        };
    });
}

/** Activate the toggle from the keyboard and read what the first frame shows. */
async function pressToggle(page: Page) {
    await page.getByRole("button", { name: TOGGLE }).focus();
    await page.keyboard.press("Enter");
    return page.evaluate(async () => {
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        const col = document.querySelector(".paper-columns > :first-child")!;
        const running = col
            .getAnimations({ subtree: true })
            .filter((a) => a.playState === "running" && a instanceof CSSTransition)
            .map((a) => ({
                prop: (a as CSSTransition).transitionProperty,
                ms: Number(a.effect?.getTiming().duration ?? 0),
            }));
        return { running, width: col.getBoundingClientRect().width };
    });
}

for (const scheme of ["light", "dark"] as const) {
    test.describe(`G-t — the desktop ToC is a drawer under the paper (1440, ${scheme})`, () => {
        test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme });

        test("t1+t2 — hide slides it under the paper to an edge tab; show restores it exactly; focus stays", async ({ page }) => {
            await openPaper(page);
            await settled(page);
            await page.screenshot({ path: `${FRAMES}/${PHASE}-1440-${scheme}.png` });

            const toggle = page.getByRole("button", { name: TOGGLE });
            await expect(toggle).toHaveCount(1);
            await expect(toggle).toHaveAttribute("aria-expanded", "true");
            await expect(toggle).toHaveAccessibleName("Hide contents");
            const controls = await toggle.getAttribute("aria-controls");
            expect(controls, "the toggle names the region it hides").toBeTruthy();
            expect(await page.locator(`[id="${controls}"]`).count()).toBe(1);

            // The ToC's own scroll position is part of "exactly where it is now".
            await page.locator('nav[aria-label="Table of contents"]').evaluate((el) => {
                el.scrollTop = Math.min(120, el.scrollHeight - el.clientHeight);
            });
            const open = await geometry(page);
            expect(open.nav && open.column && open.article && open.toggle).toBeTruthy();

            const hide = await pressToggle(page);
            expect(
                hide.running.some((a) => a.ms > 0),
                `hiding is animated (running transitions: ${JSON.stringify(hide.running)})`,
            ).toBe(true);
            await settled(page);
            await expect(toggle).toHaveAttribute("aria-expanded", "false");
            await expect(toggle).toHaveAccessibleName("Show contents");
            await expect(page.getByRole("navigation", { name: "Table of contents" })).toBeHidden();
            const shut = await geometry(page);
            expect(shut.focused, "focus stays on the toggle after hiding").toBe(true);
            expect(shut.navVisibility).toBe("hidden");
            // The column collapses to the tab alone, and the tab sits at the paper's edge.
            expect(shut.column!.w).toBeLessThanOrEqual(shut.toggle!.w + 1);
            expect(shut.toggle!.r).toBeLessThanOrEqual(shut.article!.l + 0.5);
            expect(shut.article!.l - shut.toggle!.r).toBeLessThan(24);
            expect(shut.toggle!.l).toBeGreaterThanOrEqual(0);
            expect(shut.article!.l).toBeLessThan(open.article!.l);
            await page.screenshot({ path: `${FRAMES}/${PHASE}-1440-${scheme}-hidden.png` });

            const show = await pressToggle(page);
            expect(show.running.some((a) => a.ms > 0), "showing is animated").toBe(true);
            await settled(page);
            await expect(toggle).toHaveAttribute("aria-expanded", "true");
            await expect(page.getByRole("navigation", { name: "Table of contents" })).toBeVisible();
            const back = await geometry(page);
            expect(back.focused, "focus stays on the toggle after showing").toBe(true);
            for (const k of ["l", "r", "t", "b"] as const) {
                expect(Math.abs(back.nav![k] - open.nav![k]), `nav.${k} restored`).toBeLessThanOrEqual(0.5);
                expect(Math.abs(back.article![k] - open.article![k]), `article.${k} restored`).toBeLessThanOrEqual(0.5);
            }
            expect(back.navScroll).toBe(open.navScroll);
        });
    });
}

test.describe("G-t — persistence and motion (1440)", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("t3 — the state persists per viewer across a reload, both ways", async ({ page }) => {
        await openPaper(page);
        const toggle = page.getByRole("button", { name: TOGGLE });
        await toggle.click();
        await expect(toggle).toHaveAttribute("aria-expanded", "false");
        await openPaper(page);
        await expect(toggle).toHaveAttribute("aria-expanded", "false");
        await expect(page.getByRole("navigation", { name: "Table of contents" })).toBeHidden();
        await toggle.click();
        await expect(toggle).toHaveAttribute("aria-expanded", "true");
        await openPaper(page);
        await expect(toggle).toHaveAttribute("aria-expanded", "true");
        await expect(page.getByRole("navigation", { name: "Table of contents" })).toBeVisible();
    });

    test("t4 — storage that throws never breaks the page", async ({ page }) => {
        // Storage throws for the ToC's own key (blocked site data, quota). Not
        // for every key: under the dev server, pinia's devtools timeline reads
        // storage unguarded at boot (`getTimelineLayersStateFromStorage`) and a
        // global throw measures that tool, not this page.
        await page.addInitScript(() => {
            const { getItem, setItem } = Storage.prototype;
            Storage.prototype.getItem = function (key: string) {
                if (/toc/i.test(key)) throw new DOMException("blocked", "SecurityError");
                return getItem.call(this, key);
            };
            Storage.prototype.setItem = function (key: string, value: string) {
                if (/toc/i.test(key)) throw new DOMException("blocked", "SecurityError");
                return setItem.call(this, key, value);
            };
        });
        await openPaper(page);
        const toggle = page.getByRole("button", { name: TOGGLE });
        await expect(toggle).toHaveAttribute("aria-expanded", "true");
        await expect(page.getByRole("navigation", { name: "Table of contents" })).toBeVisible();
        await toggle.click();
        await expect(toggle).toHaveAttribute("aria-expanded", "false");
        await toggle.click();
        await expect(toggle).toHaveAttribute("aria-expanded", "true");
    });

    test.describe("reduced motion", () => {
        test.use({ contextOptions: { reducedMotion: "reduce" } });

        test("t5 — prefers-reduced-motion: the hide is instant", async ({ page }) => {
            await openPaper(page);
            await settled(page);
            const toggle = page.getByRole("button", { name: TOGGLE });
            await expect(toggle).toHaveAttribute("aria-expanded", "true");
            const first = await pressToggle(page);
            expect(first.running.filter((a) => a.ms > 0), "no running transition").toEqual([]);
            const tab = await geometry(page);
            expect(first.width, "collapsed in the first frame").toBeLessThanOrEqual(tab.toggle!.w + 1);
        });
    });
});

for (const scheme of ["light", "dark"] as const) {
    test.describe(`G-t — the mobile presentation of the one ToC (390, ${scheme})`, () => {
        test.use({ viewport: { width: 390, height: 844 }, colorScheme: scheme, hasTouch: true });

        test("t6 — no desktop drawer below lg; the floating bar opens the ToC", async ({ page }) => {
            await openPaper(page);
            await page.screenshot({ path: `${FRAMES}/${PHASE}-390-${scheme}.png` });
            await expect(page.getByRole("button", { name: TOGGLE })).toHaveCount(0);
            const scroller = page.locator(".paper-scroll");
            await expect.poll(() => scroller.evaluate((el) => el.scrollHeight), { timeout: 10_000 }).toBeGreaterThan(5000);
            await scroller.evaluate((el) => el.scrollTo({ top: 2500 }));
            await page.locator(".floating-toc-title-btn").click();
            await expect(page.locator(".floating-toc-root").first()).toBeVisible();
            await page.screenshot({ path: `${FRAMES}/${PHASE}-390-${scheme}-open.png` });
        });
    });
}
