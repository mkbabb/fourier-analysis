import { expect, test, type Page } from "@playwright/test";

/**
 * FORTY-SIXTH A (the dock study's F-1): "hovering the darkmode toggle or
 * toggling it should not shift it around". About 0.2 s after a theme press
 * every seat of the open dock stepped 4 px left in one frame (1024.2 to
 * 1020.2 at 1440, 295.5 to 291.5 at 390), and the next fold's first frame
 * stepped them back: the dock's run was 4 px wider than its port, so focus on
 * its end seat scrolled it. Filmed per animation frame: from the press to a
 * second after it, no seat moves and the run never scrolls.
 */

interface Frame {
    t: number;
    plate: number;
    seats: number[];
    scrollLeft: number;
}

async function openDock(page: Page, touch: boolean): Promise<void> {
    const dock = page.locator(".app-dock");
    await expect(dock).toHaveClass(/(^|\s)collapsed(\s|$)/, { timeout: 30_000 });
    await page.waitForTimeout(600);
    const expand = dock.getByRole("button", { name: "Expand dock" });
    if (touch) await expand.tap();
    else await expand.hover();
    await expect(dock).toHaveClass(/(^|\s)expanded(\s|$)/);
    // The morph settles (glass clears `data-morphing`), then a beat more.
    await expect(dock).not.toHaveAttribute("data-morphing", /.*/, { timeout: 5_000 });
    await page.waitForTimeout(400);
}

async function filmSeats(page: Page, ms: number): Promise<void> {
    await page.evaluate((ms) => {
        const dock = document.querySelector<HTMLElement>(".app-dock")!;
        const frames: Frame[] = [];
        (window as unknown as { __frames: Frame[] }).__frames = frames;
        const t0 = performance.now();
        const tick = () => {
            const run = dock.querySelector<HTMLElement>(".dock-layer--full");
            frames.push({
                t: performance.now() - t0,
                plate: dock.getBoundingClientRect().width,
                seats: [...dock.querySelectorAll<HTMLElement>(".dock-layer--full button, .dock-layer--full a[href]")]
                    .filter((b) => b.getBoundingClientRect().width > 0)
                    .map((b) => b.getBoundingClientRect().left),
                scrollLeft: run?.scrollLeft ?? 0,
            });
            if (performance.now() - t0 < ms) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, ms);
}

async function frames(page: Page): Promise<Frame[]> {
    return page.evaluate(() => (window as unknown as { __frames: Frame[] }).__frames);
}

function assertStill(fs: Frame[], what: string): void {
    expect(fs.length, `${what}: frames filmed`).toBeGreaterThan(10);
    for (let i = 1; i < fs.length; i++) {
        const a = fs[i - 1], b = fs[i];
        expect(b.scrollLeft, `${what}: the run scrolled at ${b.t.toFixed(0)} ms`).toBe(0);
        if (a.seats.length !== b.seats.length) continue;
        const step = Math.max(...b.seats.map((x, k) => Math.abs(x - a.seats[k])));
        expect(step, `${what}: a seat stepped ${step.toFixed(1)} px between ${a.t.toFixed(0)} and ${b.t.toFixed(0)} ms`).toBeLessThanOrEqual(0.5);
    }
}

async function runFits(page: Page): Promise<{ scroll: number; client: number }> {
    return page.evaluate(() => {
        const run = document.querySelector<HTMLElement>(".app-dock .dock-layer--full")!;
        return { scroll: run.scrollWidth, client: run.clientWidth };
    });
}

for (const scheme of ["light", "dark"] as const) {
    test.describe(`theme seat, ${scheme}`, () => {
        test.use({ colorScheme: scheme });

        test(`a desk's theme hover and press move no seat (${scheme})`, async ({ page }) => {
            await page.setViewportSize({ width: 1440, height: 900 });
            await page.goto("/w");
            await openDock(page, false);
            const fit = await runFits(page);
            expect(fit.scroll, "the open run fits its port").toBeLessThanOrEqual(fit.client);

            const theme = page.locator(".app-dock .sun-moon-toggle");
            await filmSeats(page, 1600);
            await theme.hover();
            await page.waitForTimeout(400);
            await theme.click();
            await page.waitForTimeout(1300);
            assertStill(await frames(page), "hover and press");
        });

        test(`a phone's theme press moves no seat (${scheme}) @coarse`, async ({ page }) => {
            await page.setViewportSize({ width: 390, height: 844 });
            await page.goto("/w");
            await openDock(page, true);
            const fit = await runFits(page);
            expect(fit.scroll, "the open run fits its port").toBeLessThanOrEqual(fit.client);

            await filmSeats(page, 1200);
            await page.locator(".app-dock .sun-moon-toggle").tap();
            await page.waitForTimeout(1300);
            assertStill(await frames(page), "press");
        });
    });
}
