import { expect, test } from "@playwright/test";

/**
 * PAPER-CRITIQUE finding 1: a far jump (a contents row, a search hit, a
 * cross-reference, Back) raised a page-tone veil over the whole viewport,
 * fading the card, the rail and the dock to the ground and back. Only the
 * article's text changes, so only the text cross-fades now (as the jump to the
 * top already did): the rail and the dock stay painted on every frame, and the
 * text goes out and comes back.
 */
test.use({ viewport: { width: 1440, height: 900 } });

test("a far contents jump fades the text alone; the rail and dock stay painted", async ({ page }) => {
    await page.goto("/paper");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 60_000 });
    // From the top of the paper, a chapter many pages down: a far jump (the
    // teleport path; a near one is a smooth scroll and changes nothing here).
    const row = page.locator('[data-toc-id="the-discrete-fourier-transform"]');
    await expect(row).toBeVisible();
    await page.waitForTimeout(400);
    const before = await page.locator(".paper-scroll").evaluate((el) => el.scrollTop);

    await page.evaluate(() => {
        const at = (el: Element) => {
            const r = el.getBoundingClientRect();
            return [r.left + r.width / 2, r.top + r.height / 2] as const;
        };
        const rail = at(document.querySelector('[data-toc-id="the-discrete-fourier-transform"]')!);
        const dock = at(document.querySelector(".app-dock")!);
        const root = document.querySelector<HTMLElement>(".paper-scroll .paper-window-root")!;
        const samples: { covered: boolean[]; text: number }[] = [];
        const t0 = performance.now();
        const tick = () => {
            samples.push({
                covered: [rail, dock].map(([x, y]) => {
                    const e = document.elementFromPoint(x, y);
                    return !e || !e.closest(".paper-sidebar, .app-header");
                }),
                text: parseFloat(getComputedStyle(root).opacity),
            });
            if (performance.now() - t0 < 1600) requestAnimationFrame(tick);
        };
        (window as unknown as { __jump: typeof samples }).__jump = samples;
        requestAnimationFrame(tick);
    });
    await row.click();
    await page.waitForTimeout(1800);
    const samples = await page.evaluate(() => (window as unknown as { __jump: { covered: boolean[]; text: number }[] }).__jump);

    expect(samples.length).toBeGreaterThan(20);
    const after = await page.locator(".paper-scroll").evaluate((el) => el.scrollTop);
    expect(after - before, "the jump is a far one").toBeGreaterThan(2000);
    const coveredFrames = samples.filter((s) => s.covered.some(Boolean)).length;
    expect(coveredFrames, "frames on which the rail or the dock was covered").toBe(0);
    expect(Math.min(...samples.map((s) => s.text)), "the text went out").toBeLessThan(0.5);
    expect(samples.at(-1)!.text, "the text came back").toBe(1);
    await expect(page.locator("#the-discrete-fourier-transform")).toBeInViewport({ timeout: 15_000 });
});
