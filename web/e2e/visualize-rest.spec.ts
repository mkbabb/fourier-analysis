import { expect, test, type Page } from "@playwright/test";

/**
 * The design critique's V1: /visualize opened as a dead slab (one line, one
 * button, one link in a 1408 x 800 card). At rest the stage now draws an
 * outline in circles with the site's own engine, the invitation under it; under
 * reduced motion it is the still drawing.
 */

async function sampleTrail(page: Page, ms: number): Promise<string[]> {
    return page.evaluate(async (ms) => {
        const line = document.querySelector(".rest-drawing .rest-line")!;
        const seen = new Set<string>();
        const t0 = performance.now();
        while (performance.now() - t0 < ms) {
            seen.add(line.getAttribute("d")!);
            await new Promise(requestAnimationFrame);
        }
        return [...seen];
    }, ms);
}

for (const vp of [
    { width: 1440, height: 900, touch: false },
    { width: 390, height: 844, touch: true },
]) {
    test.describe(`/visualize at rest (${vp.width})`, () => {
        test.use({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.touch, isMobile: vp.touch });

        test("the stage draws an outline in circles, the invitation under it", async ({ page }) => {
            await page.goto("/visualize");
            const stage = page.locator(".drop-target");
            await expect(stage.locator(".rest-drawing")).toBeVisible({ timeout: 30_000 });
            expect((await sampleTrail(page, 700)).length, "the line is being written").toBeGreaterThan(8);
            expect(await stage.locator(".rest-chain circle").count()).toBeGreaterThan(10);

            // The drawing stands clear of the words (PR 33 review: the line ran
            // through the title and the button), and the invitation takes the press.
            const drawing = (await stage.locator(".rest-drawing").boundingBox())!;
            const title = (await stage.getByRole("heading", { level: 1 }).boundingBox())!;
            expect(drawing.y + drawing.height, "the drawing ends above the title").toBeLessThanOrEqual(title.y);
            const upload = stage.getByRole("button", { name: /upload|choose/i }).first();
            const box = (await upload.boundingBox())!;
            const hit = await page.evaluate(
                ([x, y]) => document.elementFromPoint(x, y)?.closest("button")?.textContent?.trim() ?? null,
                [box.x + box.width / 2, box.y + box.height / 2] as const,
            );
            expect(hit).toBe((await upload.textContent())!.trim());
            await expect(stage.getByRole("heading", { level: 1 })).toBeVisible();
        });
    });
}

test("under reduced motion the drawing is still and whole", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/visualize");
    await expect(page.locator(".rest-drawing")).toBeVisible({ timeout: 30_000 });
    const seen = await sampleTrail(page, 500);
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatch(/Z\s*$/);
});
