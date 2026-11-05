/**
 * X·F F-D14a/b — /morph's proportion (the owner's standing design asks).
 *
 * a. At short landscape (844×390) the stage stacked under the title, a centred
 *    square cut by the fold, with every control below it. /equation solves
 *    this viewport with its `(orientation: landscape) and (max-height: 500px)`
 *    rule (D-8): stage and controls side by side. /morph takes the same query:
 *    the stage fits the viewport, centred on the left column's axis, and the
 *    first slider is in view without scrolling.
 * b. The PHASE / N / SHAPE / TOTAL readout hung between the stage card and the
 *    controls with no container. It is the stage card's foot: its box lies
 *    inside the card's box at 390, 430 and 1440.
 *
 * Light and dark; each cell writes one frame to test-results for reading.
 */
import { expect, test, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
// The stage card: before the cure the plate button was the card; after it the
// card holds the plate and the readout. The outer one comes first in DOM order.
const CARD = ".morph-card, .morph-button";

async function open(page: Page) {
    await page.goto("/morph");
    await expect(page.locator(CARD).first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
}

function box(page: Page, selector: string) {
    return page.locator(selector).first().evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    });
}

for (const colorScheme of SCHEMES) {
    test.describe(`F-D14a · /morph at 844×390 (${colorScheme})`, () => {
        test.use({ viewport: { width: 844, height: 390 }, colorScheme });

        test("the stage fits the viewport, beside the controls", async ({ page }) => {
            await open(page);
            const stage = await box(page, CARD);
            const rail = await box(page, ".stage-column");
            const slider = await box(page, ".controls-column [role='slider']");
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
            await page.screenshot({ path: test.info().outputPath(`morph-844x390-${colorScheme}.png`) });
            expect(stage.bottom, "the stage is not cut by the fold").toBeLessThanOrEqual(390);
            expect(Math.abs((stage.left + stage.right) / 2 - (rail.left + rail.right) / 2), "the stage sits on its column's axis").toBeLessThanOrEqual(1);
            expect(slider.top, "the first slider is in view").toBeGreaterThanOrEqual(0);
            expect(slider.bottom, "the first slider is in view").toBeLessThanOrEqual(390);
            expect(overflow, "no horizontal overflow").toBe(0);
            const clipped = await page.locator(".demo-info").evaluate((e) => e.scrollWidth - e.clientWidth);
            expect(clipped, "the readout fits its foot").toBeLessThanOrEqual(0);
        });
    });

    for (const vp of [{ width: 390, height: 844 }, { width: 430, height: 932 }, { width: 1440, height: 900 }]) {
        test.describe(`F-D14b · /morph at ${vp.width} (${colorScheme})`, () => {
            test.use({ viewport: vp, colorScheme });

            test("the readout is the stage card's foot", async ({ page }) => {
                await open(page);
                const card = await box(page, CARD);
                const info = await box(page, ".demo-info");
                await page.screenshot({ path: test.info().outputPath(`morph-${vp.width}-${colorScheme}.png`) });
                expect(info.left).toBeGreaterThanOrEqual(card.left);
                expect(info.right).toBeLessThanOrEqual(card.right);
                expect(info.top).toBeGreaterThanOrEqual(card.top);
                expect(info.bottom).toBeLessThanOrEqual(card.bottom);
            });
        });
    }
}
