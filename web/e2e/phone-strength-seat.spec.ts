import { expect, test, type Page } from "@playwright/test";
import { seededViz } from "./fixtures/seed";
import { slider } from "./fixtures/slider";
import { showViewIfTabbed } from "./fixtures/workspace";

/**
 * The phone's "Layers and more" menu (glass on G-1, 24 Nov: it held the
 * picture's strength slider, and at 390x844 it stood 517 px tall over a 750 px
 * stage, so the stage the slider previews was under it). More holds rows only
 * now; its first row names the strength with its value, and choosing it gives
 * the slider a seat of its own: a glass popover one row tall standing on the
 * plate's top edge, inside the stage, so the stage above it stays in view while
 * the hand tunes it. The menu leaves before the popover arrives; the popover
 * hands the focus back to More when it closes.
 */

const CELLS = [
    { name: "390x844", viewport: { width: 390, height: 844 } },
    { name: "844x390", viewport: { width: 844, height: 390 } },
] as const;

interface Rect { x: number; y: number; w: number; h: number }

async function rect(page: Page, selector: string): Promise<Rect | null> {
    return page.evaluate((sel) => {
        const e = document.querySelector(sel);
        if (!e) return null;
        const b = e.getBoundingClientRect();
        return { x: b.x, y: b.y, w: b.width, h: b.height };
    }, selector);
}

async function settled(page: Page, selector: string): Promise<void> {
    await page.locator(selector).first().evaluate((m) => Promise.all(m.getAnimations({ subtree: true }).map((a) => a.finished)));
}

for (const cell of CELLS) {
    test.describe(`@coarse the picture's strength has its own seat on a phone (${cell.name})`, () => {
        test.use({ viewport: cell.viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
        test.setTimeout(120_000);

        test(`@coarse ${cell.name}: More holds rows only, and its strength row opens a popover that leaves the stage in view`, async ({ page }) => {
            const { image_slug } = seededViz();
            await page.goto(`/w/${image_slug}?t=0.5`);
            await showViewIfTabbed(page, "Canvas");
            const dock = page.locator(".animation-dock");
            await expect(dock.getByRole("button", { name: /Play animation|Pause animation/ })).toBeEnabled({ timeout: 60_000 });
            await page.waitForTimeout(800);
            const entries = await page.evaluate(() => history.length);

            const more = dock.getByRole("button", { name: "Layers and more" });
            await more.tap();
            const menu = page.getByRole("menu");
            await expect(menu).toBeVisible();
            await settled(page, "[role=menu]");
            await expect(menu.getByRole("slider"), "no slider stands in the menu").toHaveCount(0);
            const row = menu.getByRole("menuitem", { name: /^Picture strength\s*22%$/ });
            await expect(row, "the strength row names its value").toBeVisible();
            await expect(menu.getByRole("menuitemcheckbox", { name: "Line" })).toBeVisible();

            await row.tap();
            await expect(menu, "the menu leaves").toHaveCount(0);
            const strength = slider(page, "Picture strength");
            await expect(strength).toBeVisible();
            await settled(page, ".strength-popover");
            await expect(strength, "the slider holds the focus").toBeFocused();
            await expect(strength).toHaveAttribute("aria-valuenow", "22");

            const pop = (await rect(page, ".strength-popover"))!;
            const plate = (await rect(page, ".animation-dock .card-face"))!;
            const stage = (await rect(page, ".canvas-stage"))!;
            expect(pop.h, "one row tall").toBeLessThanOrEqual(80);
            expect(pop.y + pop.h, "it stands on the plate, never over it").toBeLessThanOrEqual(plate.y + 1);
            expect(pop.x, "inside the stage").toBeGreaterThanOrEqual(stage.x - 1);
            expect(pop.x + pop.w, "inside the stage").toBeLessThanOrEqual(stage.x + stage.w + 1);
            // The stage stays in view: the popover stands over at most a sixth of it
            // (More stood over 517 of its 750 px at 390x844, about half its area).
            expect((pop.w * pop.h) / (stage.w * stage.h), "the stage stays in view").toBeLessThanOrEqual(1 / 6);

            // The keyboard tunes it, written to the link once, with no history entry.
            for (let i = 0; i < 8; i++) await strength.press("ArrowRight");
            await expect(strength).toHaveAttribute("aria-valuenow", "30");
            await expect(page).toHaveURL(/[?&]wash=30(&|$)/);
            expect(await page.evaluate(() => history.length), "tuning writes no history entry").toBe(entries);

            // A drag with the finger moves it 1:1 under the thumb.
            const track = (await page.locator(".strength-popover .strength-slider").boundingBox())!;
            const y = track.y + track.height / 2;
            const cdp = await page.context().newCDPSession(page);
            const at = (f: number) => [{ x: track.x + track.width * f, y }];
            await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: at(0.3) });
            for (let i = 1; i <= 8; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: at(0.3 + 0.04 * i) });
            await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
            const dragged = Number(await strength.getAttribute("aria-valuenow"));
            expect(dragged, "the drag moved the strength").toBeGreaterThan(50);
            await expect(page).toHaveURL(new RegExp(`[?&]wash=${dragged}(&|$)`));

            // Escape closes it, and the focus goes back to More.
            await page.keyboard.press("Escape");
            await expect(page.locator(".strength-popover")).toHaveCount(0);
            await expect(more).toBeFocused();

            // More's row carries the new value.
            await more.tap();
            await expect(page.getByRole("menu").getByRole("menuitem", { name: new RegExp(`^Picture strength\\s*${dragged}%$`) })).toBeVisible();
        });
    });
}
