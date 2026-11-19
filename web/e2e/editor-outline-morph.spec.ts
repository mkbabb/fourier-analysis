import { expect, test, type Page } from "@playwright/test";
import { seededViz } from "./fixtures/seed";

/**
 * LAST-TEN F-13: the editor's Smooth, Simplify and Reset replaced the outline
 * in one frame. The outline now travels from its old form to its new one over
 * about 200 ms (both sampled along the curve at one count and blended), then
 * hands over to the new form's own spline. Sampled on every frame.
 */
test.use({ viewport: { width: 1440, height: 900 } });

async function openEditor(page: Page): Promise<void> {
    await page.goto(`/v/${seededViz().slug}`);
    await expect(page.locator(".controls-dock-anchor")).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(600);
    const edit = page.getByRole("button", { name: "Edit contour" }).first();
    await edit.hover();
    await page.waitForTimeout(600);
    await edit.click();
    await expect(page.locator(".canvas-stage > .editor-shell:not(.is-hidden) svg.editor-svg")).toBeVisible();
    await expect(page.locator("circle.control-point").nth(10)).toBeAttached();
    const dock = page.locator(".controls-overlay").last();
    const summary = dock.getByRole("button", { name: "Expand dock" });
    if (await summary.isVisible()) {
        await summary.click();
        await page.waitForTimeout(700);
    }
}

/** Press a More-tools row and return the distinct outlines drawn on the frames after. */
async function framesAfter(page: Page, row: string): Promise<string[]> {
    await page.locator(".controls-overlay").last().getByRole("button", { name: "More editor tools" }).click();
    const item = page.getByRole("menu").getByRole("menuitem", { name: row });
    await expect(item).toBeVisible();
    await page.evaluate(() => {
        const seen: string[] = [];
        const path = () => document.querySelector(".canvas-stage > .editor-shell:not(.is-hidden) path.spline-path")!.getAttribute("d")!;
        let last = path();
        const t0 = performance.now();
        const tick = () => {
            const d = path();
            if (d !== last) seen.push(d);
            last = d;
            if (performance.now() - t0 < 900) requestAnimationFrame(tick);
        };
        (window as unknown as { __outlines: string[] }).__outlines = seen;
        requestAnimationFrame(tick);
    });
    await item.click();
    await page.waitForTimeout(1000);
    return page.evaluate(() => (window as unknown as { __outlines: string[] }).__outlines);
}

for (const row of ["Smooth contour", "Simplify contour"]) {
    test(`${row}: the outline travels to its new form over several frames`, async ({ page }) => {
        await openEditor(page);
        const outlines = await framesAfter(page, row);
        expect(outlines.length, "distinct outlines drawn after the press").toBeGreaterThanOrEqual(4);
        // It ends on the new form's own spline (cubic segments), not a blend.
        expect(outlines.at(-1)).toMatch(/C/);
    });
}

test("Reset to extraction: the edit travels back", async ({ page }) => {
    await openEditor(page);
    await framesAfter(page, "Smooth contour");
    const outlines = await framesAfter(page, "Reset to extraction");
    expect(outlines.length).toBeGreaterThanOrEqual(4);
});
