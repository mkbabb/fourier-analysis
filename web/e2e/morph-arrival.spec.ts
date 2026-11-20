import { expect, test } from "@playwright/test";
import { openAppDock } from "./fixtures/app-dock";

/**
 * LAST-TEN F-07: entering /morph drew its ten level tiles in
 * the route's first frame, a 150 ms frame on the GPU inside glass's 200 ms
 * route crossfade. The tiles hold their place from the first frame and their
 * drawings arrive after the crossfade, in turns. Sampled on every frame from
 * the press in the sections menu.
 */
test.use({ viewport: { width: 1440, height: 900 } });

test("arriving at /morph, the tiles' drawings come in turns after the crossfade", async ({ page }) => {
    await page.goto("/gallery");
    const dock = await openAppDock(page);
    await dock.getByRole("button", { name: /^Navigate/ }).click();
    const row = page.getByRole("menu").getByRole("menuitem", { name: "Morph" });
    await expect(row).toBeVisible();

    await page.evaluate(() => {
        const counts: { t: number; tiles: number; drawn: number }[] = [];
        const t0 = performance.now();
        const tick = () => {
            const card = document.querySelector(".levels-card");
            counts.push({
                t: performance.now() - t0,
                tiles: card ? card.querySelectorAll(".grid-cell").length : 0,
                drawn: card ? card.querySelectorAll("svg.grid-svg").length : 0,
            });
            if (performance.now() - t0 < 2500) requestAnimationFrame(tick);
        };
        (window as unknown as { __arrival: typeof counts }).__arrival = counts;
        requestAnimationFrame(tick);
    });
    await row.click();
    await page.waitForTimeout(2700);
    const counts = await page.evaluate(() => (window as unknown as { __arrival: { t: number; tiles: number; drawn: number }[] }).__arrival);

    const mounted = counts.find((c) => c.tiles > 0);
    expect(mounted, "the grid mounted").toBeTruthy();
    expect(mounted!.drawn, "no drawing in the grid's first frame").toBe(0);
    const steps = new Set(counts.filter((c) => c.drawn > 0).map((c) => c.drawn));
    expect(steps.size, `drawings arrived in turns (${[...steps]})`).toBeGreaterThanOrEqual(3);
    expect(counts.at(-1)!.drawn).toBe(counts.at(-1)!.tiles);
});
