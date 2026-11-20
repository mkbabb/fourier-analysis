import { expect, test, type Page } from "@playwright/test";
import { openAppDock } from "./fixtures/app-dock";

/**
 * FORTY-SECOND D (owner, 19 Nov: "the tabs toggle for controls should
 * potentially be re-integrated into the top dock") and the cut between the
 * panes. On a phone the Controls/Canvas strip and its 58 px band are gone: the
 * switch is one seat of the top dock, outside its fold (one press from rest),
 * lit while the controls show, in the URL (`tab=controls`, pushed, so Back
 * returns to the canvas). The two regions stand on one track and the swap is a
 * slide, never a cut.
 *
 * Phone cell: 390x844, touch (`@coarse`).
 */

const STAGE = '.workspace-host [data-slot="configurator"] > .configurator-stage';
const ASIDE = '.workspace-host [data-slot="configurator"] > .configurator-aside';

async function openEquation(page: Page): Promise<void> {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/equation");
    await expect(page.locator(".eq-card .katex").first()).toBeVisible({ timeout: 90_000 });
}

test.describe("FORTY-SECOND D — the pane switch in the top dock @coarse", () => {
    test("@coarse /equation: no strip; the stage starts under the dock", async ({ page }) => {
        await openEquation(page);
        await expect(page.locator(".workspace-tabs")).toHaveCount(0);
        const stage = (await page.locator(STAGE).boundingBox())!;
        expect(stage.y, "the stage's top").toBeLessThanOrEqual(80);
    });

    test("@coarse one press from rest shows the controls and pushes tab=controls; Back shows the canvas", async ({ page }) => {
        await openEquation(page);
        const dock = page.locator(".app-dock");
        await expect(dock).toHaveClass(/(^|\s)collapsed(\s|$)/, { timeout: 30_000 });
        const seat = dock.locator(".pane-seat");
        await expect(seat).toBeVisible();
        await expect(seat).toHaveAccessibleName("Controls");
        await expect(seat).toHaveAttribute("aria-pressed", "false");
        await seat.click();
        await expect(page).toHaveURL(/[?&]tab=controls/);
        await expect(seat).toHaveAttribute("aria-pressed", "true");
        await page.waitForTimeout(400);
        await expect(page.locator(ASIDE)).toBeInViewport({ ratio: 0.9 });
        await expect(page.locator(STAGE)).not.toBeInViewport();
        await page.goBack();
        await expect(page).not.toHaveURL(/[?&]tab=controls/);
        await page.waitForTimeout(400);
        await expect(page.locator(STAGE)).toBeInViewport({ ratio: 0.9 });
        await expect(seat).toHaveAttribute("aria-pressed", "false");
    });

    test("@coarse the swap is a slide: the track passes between its ends on three frames or more", async ({ page }) => {
        await openEquation(page);
        await page.evaluate((sel) => {
            const el = document.querySelector<HTMLElement>(sel)!;
            const xs: number[] = [];
            const t0 = performance.now();
            const tick = () => {
                xs.push(el.getBoundingClientRect().left);
                if (performance.now() - t0 < 900) requestAnimationFrame(tick);
            };
            (window as unknown as { __xs: number[] }).__xs = xs;
            requestAnimationFrame(tick);
        }, STAGE);
        await page.locator(".app-dock .pane-seat").click();
        await page.waitForTimeout(1000);
        const xs = await page.evaluate(() => (window as unknown as { __xs: number[] }).__xs);
        const start = xs[0];
        const end = xs.at(-1)!;
        expect(end, "the stage went off to the left").toBeLessThan(start - 300);
        const between = xs.filter((x) => x < start - 1 && x > end + 1);
        expect(between.length, `frames mid-slide (${xs.map((x) => x.toFixed(0)).join(" ")})`).toBeGreaterThanOrEqual(3);
    });

    test("@coarse the open dock with the seat keeps the gutter", async ({ page }) => {
        await openEquation(page);
        const dock = await openAppDock(page);
        await page.waitForTimeout(500);
        const box = (await dock.boundingBox())!;
        expect(box.width, "the open dock's width").toBeLessThanOrEqual(358);
        await expect(dock.locator(".pane-seat")).toBeVisible();
    });
});
