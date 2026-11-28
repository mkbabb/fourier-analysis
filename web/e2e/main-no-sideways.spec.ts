import { expect, test } from "@playwright/test";

/**
 * FORTY-SEVENTH (owner, 23 Nov: "Many items can horizontally scroll ... which
 * should not"; the sideways-scroll census, fourier row: `<main>`). `<main>` is
 * the app's one scroller and it scrolls on y: `overflow-y: auto` alone
 * computes x to `auto` as well, so anything that ever spilled a pixel past the
 * page's width made the whole page pan sideways under a thumb. Its x is
 * clipped now: a sideways swipe over a spill moves nothing.
 */

test.describe("@coarse the page never pans sideways (390x844)", () => {
    test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

    for (const route of ["/paper", "/gallery", "/morph"]) {
        test(`@coarse ${route}: a spill wider than the page does not pan <main> sideways`, async ({ page }) => {
            await page.goto(route);
            const main = page.locator("main[data-route-window]");
            await expect(main).toBeVisible({ timeout: 60_000 });
            await page.waitForTimeout(800);
            expect(await main.evaluate((m) => getComputedStyle(m).overflowX), "x is clipped, not a scroll axis").toBe("hidden");

            // A spill: one box 200 px wider than the page, at the top of <main>.
            await main.evaluate((m) => {
                const spill = document.createElement("div");
                spill.setAttribute("data-spill", "");
                spill.style.cssText = "flex:none; inline-size: calc(100vw + 200px); block-size: 120px;";
                m.prepend(spill);
            });
            const box = (await main.boundingBox())!;
            const y = box.y + 60;
            const cdp = await page.context().newCDPSession(page);
            const at = (x: number) => [{ x, y }];
            await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: at(300) });
            for (let i = 1; i <= 10; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: at(300 - 22 * i) });
            await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
            await page.waitForTimeout(400);
            expect(await main.evaluate((m) => m.scrollLeft), "<main> did not pan sideways").toBe(0);
            expect(await page.evaluate(() => document.documentElement.scrollWidth), "the page did not widen").toBeLessThanOrEqual(390);
        });
    }
});
