// SERVED MODEL: claude-opus-5-5
import { expect, test } from "@playwright/test";

/**
 * X.F.W14V `.nav` — addendum (e), COHESION §0dw. The owner, on a 1440 dark
 * frame of the inline tab row: "this should be a dropdown, not expanded out
 * into paper, visualize, etc." The five sections are the one `nav-trigger`
 * menu at every viewport.
 *
 * FALSIFIER: at 1440 the dock holds exactly one section trigger and no inline
 * section links (RED at the before bytes, where ≥1024 px rendered the
 * `nav[aria-label=Sections]` tab row and no trigger).
 */
const SECTIONS = ["/paper", "/visualize", "/gallery", "/equation", "/morph"];

test.describe("nav falsifier (1440): one section trigger, no inline section links", () => {
    test.use({ viewport: { width: 1440, height: 900 } });
    test("the dock's sections are one dropdown trigger", async ({ page }) => {
        await page.goto("/gallery");
        const dock = page.locator(".app-dock");
        await expect(dock).toBeVisible({ timeout: 30_000 });
        await page.waitForTimeout(400);
        await expect(dock.locator(".nav-trigger")).toHaveCount(1);
        await expect(dock.getByRole("button", { name: /^Navigate/ })).toHaveCount(1);
        await expect(dock.locator('nav[aria-label="Sections"]')).toHaveCount(0);
        const inlineLinks = await dock.locator("a[href]").evaluateAll(
            (as, paths) => as.filter((a) => paths.some((p) => new URL((a as HTMLAnchorElement).href).pathname.endsWith(p))).length,
            SECTIONS,
        );
        expect(inlineLinks, "inline section links in the dock").toBe(0);
    });
});

/**
 * X.F.W14V `.dm` — addendum (f), COHESION §0dx. The owner: "the darkmode
 * toggle is too small as well". The morph glyph's box is the sibling dock
 * glyphs' box (the section glyph and the account glyph), at 1440 and 390.
 *
 * FALSIFIER: RED at the before bytes, where glass's `.dock-icon-button > svg`
 * sized the morph to `--dock-icon-glyph` (20 px) beside 24 px siblings.
 */
for (const vp of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
]) {
    test.describe(`dm falsifier (${vp.width}): the dark-mode glyph is the dock's glyph box`, () => {
        test.use({ viewport: vp });
        test("morph glyph bbox equals the section and account glyph bboxes", async ({ page }) => {
            await page.goto("/gallery");
            await expect(page.locator(".app-dock .sun-moon-toggle svg")).toBeVisible({ timeout: 30_000 });
            await page.waitForTimeout(400);
            const read = await page.evaluate(() => {
                const box = (sel: string) => {
                    const r = document.querySelector(sel)!.getBoundingClientRect();
                    return { w: Math.round(r.width), h: Math.round(r.height) };
                };
                return {
                    morph: box(".app-dock .sun-moon-toggle svg"),
                    section: box(".app-dock .nav-tab-icon"),
                    account: box(".app-dock .account-trigger svg"),
                };
            });
            expect(read.morph, `morph vs section glyph ${JSON.stringify(read)}`).toEqual(read.section);
            expect(read.morph, `morph vs account glyph ${JSON.stringify(read)}`).toEqual(read.account);
        });
    });
}
