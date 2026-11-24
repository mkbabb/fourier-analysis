import { expect, test, type Page } from "@playwright/test";
import { ENTRY, stubGallery } from "./fixtures/gallery";

/**
 * FORTY-SIXTH C (the gallery's demo pieces) exposed a scroll fault the empty
 * gallery never showed. The shell's `<main>` and the gallery's own column were
 * both vertical scrollers, and both scrolled: on a landscape phone (844x390)
 * six swipes left each at 426 px, every card above the screen and the screen
 * an empty grid; at 390 portrait the double offset left about 160 px of empty
 * page under the last card. CONVERGE 3: no scroll past the page's bottom. The
 * page has one scroller, `<main>` (the one the dock folds and draws its
 * progress on), and at its foot the last card ends the page.
 */

const PIECES = Array.from({ length: 6 }, (_, i) => ({
    ...ENTRY,
    slug: `one-scroller-piece-${i + 1}`,
    image_slug: `img-one-scroller-piece-${i + 1}`,
    content_hash: `c0ffee0${i + 1}`,
    title: `Piece ${i + 1}`,
}));

interface Reading {
    scrollers: string[];
    lastBottom: number;
    mainTop: number;
    mainBottom: number;
}

async function read(page: Page): Promise<Reading> {
    return page.evaluate(() => {
        // Every box the scroll moved (the document included).
        const scrollers: string[] = [];
        for (const el of [document.scrollingElement!, ...document.querySelectorAll("body *")]) {
            if (el.scrollTop > 0) scrollers.push(`${el.tagName.toLowerCase()}${el.hasAttribute("data-route-window") ? "[data-route-window]" : ""}`);
        }
        const cards = [...document.querySelectorAll(".gallery-card")];
        const main = document.querySelector("main")!.getBoundingClientRect();
        return {
            scrollers,
            lastBottom: cards.at(-1)!.getBoundingClientRect().bottom,
            mainTop: main.top,
            mainBottom: main.bottom,
        };
    });
}

function assertFoot(m: Reading, how: string): void {
    expect(m.scrollers, `${how}: one box scrolled, <main>`).toEqual(["main[data-route-window]"]);
    expect(m.lastBottom, `${how}: the last card is not above the screen`).toBeGreaterThan(m.mainTop + 40);
    expect(m.lastBottom, `${how}: the last card ends inside the window`).toBeLessThanOrEqual(m.mainBottom);
    // The foot is the column's bottom padding, the grid's gap and the infinite
    // scroll's sentinel (49 px); the fault left 160 px, or the whole screen.
    expect(m.mainBottom - m.lastBottom, `${how}: under the last card, only the page's foot`).toBeLessThanOrEqual(64);
}

for (const vp of [
    { width: 844, height: 390 },
    { width: 390, height: 844 },
]) {
    test.describe(`the gallery's foot ${vp.width}x${vp.height}`, () => {
        test.use({ viewport: vp });

        test("a wheel to the foot ends on the last card", async ({ page }) => {
            await stubGallery(page, PIECES);
            await page.goto("/gallery");
            await expect(page.locator(".gallery-card")).toHaveCount(PIECES.length);
            await page.mouse.move(vp.width / 2, vp.height * 0.6);
            for (let i = 0; i < 12; i++) {
                await page.mouse.wheel(0, 400);
                await page.waitForTimeout(60);
            }
            await page.waitForTimeout(600);
            assertFoot(await read(page), "wheel");
        });

        test("@coarse six swipes to the foot end on the last card", async ({ page }) => {
            await stubGallery(page, PIECES);
            await page.goto("/gallery");
            await expect(page.locator(".gallery-card")).toHaveCount(PIECES.length);
            const cdp = await page.context().newCDPSession(page);
            for (let i = 0; i < 6; i++) {
                await cdp.send("Input.synthesizeScrollGesture", {
                    x: Math.round(vp.width / 2),
                    y: Math.round(vp.height * 0.7),
                    yDistance: -Math.round(vp.height * 0.6),
                    speed: 1200,
                    gestureSourceType: "touch",
                });
                await page.waitForTimeout(300);
            }
            await page.waitForTimeout(1200);
            assertFoot(await read(page), "swipes");
            await cdp.detach();
        });
    });
}
