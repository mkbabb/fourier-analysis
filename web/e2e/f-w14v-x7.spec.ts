// SERVED MODEL: claude-opus-5-5
import { expect, test, type Page } from "@playwright/test";

/**
 * X.F.W14V.r4 — A2-FO-X-7 x UIA-F-59 (F-W14V addendum (h) 4, COHESION §0eb,
 * the no-ellipsis bar of §0dy).
 *
 * At >= lg the inline paper search results live INSIDE the sidebar column:
 * the plate's box sits within `.sidebar-nav`'s box (its inline size is the
 * column's, never breaking out over the article), and every result title
 * wraps instead of truncating: no `text-overflow: ellipsis` in effect, no
 * clipped label (`scrollWidth <= clientWidth`), and at least one long title
 * visibly runs onto a second line.
 */

async function openPaper(page: Page) {
    await page.goto("/paper");
    const scroller = page.locator(".paper-scroll");
    await expect.poll(() => scroller.evaluate((el) => el.scrollHeight), { timeout: 15_000 }).toBeGreaterThan(5000);
}

const VIEWPORTS = [
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
];

const QUERIES = ["Fourier Transform", "convergence", "Parseval"];

for (const viewport of VIEWPORTS) {
    test.describe(`A2-FO-X-7 x UIA-F-59 @${viewport.width}`, () => {
        test.use({ viewport });

        for (const query of QUERIES) {
            test(`"${query}": the results plate sits inside the sidebar column and every title wraps unclipped`, async ({ page }) => {
                await openPaper(page);
                const field = page.getByRole("combobox", { name: "Search the paper" }).first();
                await field.fill(query);
                const panel = page.locator(".paper-search-results");
                await expect(panel).toBeVisible();
                await expect(panel.getByRole("option").first()).toBeVisible();
                // The open transition translates the plate by -4px; read it settled.
                await page.waitForTimeout(300);
                const read = await page.evaluate(() => {
                    const plate = document.querySelector(".paper-search-results")!.getBoundingClientRect();
                    const nav = document.querySelector(".sidebar-nav")!.getBoundingClientRect();
                    const labels = [...document.querySelectorAll(".paper-search-results .paper-search-label")].map((el) => {
                        const cs = getComputedStyle(el);
                        const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4;
                        const h = el.getBoundingClientRect().height;
                        return {
                            text: (el.textContent ?? "").slice(0, 60),
                            textOverflow: cs.textOverflow,
                            whiteSpace: cs.whiteSpace,
                            textWrap: cs.getPropertyValue("text-wrap-style") || cs.getPropertyValue("text-wrap"),
                            clipped: el.scrollWidth > el.clientWidth,
                            sw: el.scrollWidth,
                            cw: el.clientWidth,
                            lines: Math.round(h / lh),
                        };
                    });
                    const r = (b: DOMRect) => ({ l: b.left, r: b.right, t: b.top, b: b.bottom });
                    return { plate: r(plate), nav: r(nav), labels };
                });
                const msg = JSON.stringify({ plate: read.plate, nav: read.nav });
                // The plate inside the sidebar column (1px for subpixel rounding).
                expect(read.plate.l, msg).toBeGreaterThanOrEqual(read.nav.l - 1);
                expect(read.plate.r, msg).toBeLessThanOrEqual(read.nav.r + 1);
                expect(read.plate.t, msg).toBeGreaterThanOrEqual(read.nav.t - 1);
                expect(read.plate.b, msg).toBeLessThanOrEqual(read.nav.b + 1);
                // Every title: no ellipsis in effect, nothing clipped, wrapping allowed and pretty.
                expect(read.labels.length).toBeGreaterThan(0);
                for (const l of read.labels) {
                    const lm = JSON.stringify(l);
                    expect(l.textOverflow, lm).not.toBe("ellipsis");
                    expect(l.clipped, lm).toBe(false);
                    expect(l.whiteSpace, lm).not.toMatch(/nowrap|pre$/);
                    expect(l.textWrap, lm).toMatch(/pretty/);
                }
                // The long titles wrap rather than fit by truncation.
                expect(read.labels.some((l) => l.lines >= 2), JSON.stringify(read.labels)).toBe(true);
            });
        }
    });
}
