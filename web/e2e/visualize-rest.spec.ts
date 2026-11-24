import { expect, test, type Page } from "@playwright/test";

/**
 * The design critique's V1: /visualize opened as a dead slab (one line, one
 * button, one link in a 1408 x 800 card). At rest the stage now draws an
 * outline in circles with the site's own engine, the invitation under it; under
 * reduced motion it is the still drawing. (FORTY-SIXTH B: the drawing is a
 * canvas that moves through a family of shapes, `rest-hero.spec.ts`; these read
 * its pixels where they read the old drawing's SVG path.)
 */

/** The distinct canvas images over `ms`, one fingerprint per frame. */
async function sampleTrail(page: Page, ms: number): Promise<number[]> {
    return page.evaluate(async (ms) => {
        const c = document.querySelector<HTMLCanvasElement>(".rest-drawing canvas")!;
        const ctx = c.getContext("2d")!;
        const seen = new Set<number>();
        const t0 = performance.now();
        while (performance.now() - t0 < ms) {
            const d = ctx.getImageData(0, 0, c.width, c.height).data;
            let h = 0;
            for (let i = 3; i < d.length; i += 4) if (d[i]) h = (h * 31 + i * d[i]!) % 2147483647;
            seen.add(h);
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
            expect(Number(await stage.locator(".rest-drawing canvas").getAttribute("data-circles")), "the chain's circles").toBeGreaterThan(10);

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
    await page.waitForTimeout(300);
    const seen = await sampleTrail(page, 500);
    expect(seen).toHaveLength(1);
    // Whole: the line closes, so the canvas holds a full outline's ink, not a stub.
    const inked = await page.evaluate(() => {
        const c = document.querySelector<HTMLCanvasElement>(".rest-drawing canvas")!;
        const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
        let n = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i]! > 100) n++;
        return n / (c.width / c.getBoundingClientRect().width);
    });
    expect(inked, "the whole outline is drawn").toBeGreaterThan(600);
});
