// SERVED MODEL: claude-opus-5-5
import { expect, test } from "@playwright/test";
import { openAppDock } from "./fixtures/app-dock";

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
        await openAppDock(page);
        const dock = page.locator(".app-dock");
        await expect(dock).toBeVisible({ timeout: 30_000 });
        await page.waitForTimeout(400);
        await expect(dock.locator(".nav-trigger")).toHaveCount(1);
        await expect(dock.getByRole("button", { name: /^Navigate/ })).toHaveCount(1);
        await expect(dock.locator('nav[aria-label="Sections"]')).toHaveCount(0);
        // Home is the dock's first seat (the wordmark, to the paper: the page a
        // first visit opens on); it is Home, not a section row, and it is the
        // only link in the dock. Every other section is in the one menu.
        const home = dock.getByRole("link", { name: "Home — Fourier analysis" });
        await expect(home).toHaveCount(1);
        const inlineLinks = await dock.locator("a[href]").evaluateAll(
            (as, paths) =>
                as.filter((a) => a.getAttribute("aria-label") !== "Home — Fourier analysis" && paths.some((p) => new URL((a as HTMLAnchorElement).href).pathname.endsWith(p))).length,
            SECTIONS,
        );
        expect(inlineLinks, "inline section links in the dock").toBe(0);
        await expect(dock.locator("a[href]")).toHaveCount(1);
    });
});

/**
 * X.F.W14V `.dm` — addendum (f), COHESION §0dx. The owner: "the darkmode
 * toggle is too small as well". The morph glyph's box is the sibling dock
 * glyphs' box (the section glyph, and the account glyph where the account has
 * a seat), at 1440 and 390. On a phone the account is the "i" card's last
 * part (PR 33 review, should-fix 2), so there the sibling is the "i" glyph;
 * at 1440 both are read.
 *
 * FALSIFIER: RED at the before bytes, where glass's `.dock-icon-button > svg`
 * sized the morph to `--dock-icon-glyph` (20 px) beside 24 px siblings.
 */
for (const vp of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
]) {
    const accountSeat = vp.width >= 640;
    test.describe(`dm falsifier (${vp.width}): the dark-mode glyph is the dock's glyph box`, () => {
        test.use({ viewport: vp });
        test(`morph glyph bbox equals the section, "i"${accountSeat ? " and account" : ""} glyph bboxes`, async ({ page }) => {
            await page.goto("/gallery");
            await openAppDock(page);
            await expect(page.locator(".app-dock .sun-moon-toggle svg")).toBeVisible({ timeout: 30_000 });
            await page.waitForTimeout(400);
            const read = await page.evaluate((accountSeat) => {
                const box = (sel: string) => {
                    const el = document.querySelector(sel);
                    if (!el) return null;
                    const r = el.getBoundingClientRect();
                    return { w: Math.round(r.width), h: Math.round(r.height) };
                };
                return {
                    morph: box(".app-dock .sun-moon-toggle svg"),
                    section: box(".app-dock .dock-layer--full .nav-tab-icon"),
                    about: box(".app-dock .about-trigger svg"),
                    account: accountSeat ? box(".app-dock .account-trigger svg") : null,
                };
            }, accountSeat);
            expect(read.morph, `the morph glyph ${JSON.stringify(read)}`).not.toBeNull();
            expect(read.morph, `morph vs section glyph ${JSON.stringify(read)}`).toEqual(read.section);
            expect(read.morph, `morph vs "i" glyph ${JSON.stringify(read)}`).toEqual(read.about);
            if (accountSeat) expect(read.morph, `morph vs account glyph ${JSON.stringify(read)}`).toEqual(read.account);
        });
    });
}
