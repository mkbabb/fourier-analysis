import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * FORTY-FIRST C (owner, 19 Nov: "the font and margins in the searchbar/toc bar
 * on mobile is a bit too small or a bit too much padding thereon? more like
 * glass-ui dock"). On a phone the contents bar was 64 px tall (70 with search
 * open, so the page under it moved), its title 14 px, its number and page
 * readout 12.2 px, its glyphs 14 px, its search cell 54 px. It now takes the
 * dock's measure: a 60 px pill in both states, a 16 px title, 14 px number and
 * readout, the dock's glyph, the 44 px touch cell.
 *
 * Phone cell: 390x844, touch (`@coarse`).
 */

async function fontPx(el: Locator): Promise<number> {
    return el.evaluate((n) => parseFloat(getComputedStyle(n).fontSize));
}

async function openPaper(page: Page): Promise<Locator> {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/paper");
    const bar = page.locator(".floating-toc-bar--trigger");
    await expect(bar).toBeVisible({ timeout: 30_000 });
    // The bar names the section once the paper has laid out its first section.
    await expect(bar.locator(".floating-toc-crumb")).toBeVisible({ timeout: 30_000 });
    return bar;
}

test.describe("FORTY-FIRST C — the contents bar on the dock's measure @coarse", () => {
    test("the bar is the dock's height, with the dock's type and cells", async ({ page }) => {
        const bar = await openPaper(page);
        const box = (await bar.boundingBox())!;
        expect(box.height, "the bar's plate").toBeCloseTo(60, 0);
        const dock = (await page.locator(".app-dock").boundingBox())!;
        expect(box.height, "the dock's plate").toBeCloseTo(dock.height, 0);

        expect(await fontPx(bar.locator(".floating-toc-section")), "the title").toBeGreaterThanOrEqual(16);
        const number = bar.locator(".floating-toc-number");
        if (await number.count()) expect(await fontPx(number.first()), "its number").toBeGreaterThanOrEqual(14);
        expect(await fontPx(bar.locator(".page-readout")), "the page readout").toBeGreaterThanOrEqual(14);

        const search = bar.getByRole("button", { name: "Search paper" });
        const cell = (await search.boundingBox())!;
        expect(cell.width).toBeCloseTo(44, 0);
        expect(cell.height).toBeCloseTo(44, 0);

        const glyph = (await search.locator("svg").boundingBox())!;
        const dockGlyph = (await page.locator(".app-dock .nav-tab-icon").boundingBox())!;
        expect(glyph.width, "the search glyph is the dock's glyph").toBeCloseTo(dockGlyph.width, 0);
    });

    test("opening search keeps the bar's height and moves nothing under it", async ({ page }) => {
        const bar = await openPaper(page);
        const article = page.locator("article.paper-article");
        const before = (await article.boundingBox())!.y;
        await bar.getByRole("button", { name: "Search paper" }).click();
        const searchBar = page.locator(".floating-toc-bar--search");
        await expect(searchBar).toBeVisible();
        await expect(page.locator(".floating-toc-bar--trigger")).toHaveCount(0);
        expect((await searchBar.boundingBox())!.height, "the search state's plate").toBeCloseTo(60, 0);
        expect((await article.boundingBox())!.y, "the article does not move").toBeCloseTo(before, 0);
        expect(await fontPx(searchBar.locator("input")), "the field's type").toBeGreaterThanOrEqual(16);
        const close = searchBar.getByRole("button", { name: "Close search" });
        const c = (await close.boundingBox())!;
        expect(c.width).toBeCloseTo(44, 0);
        expect(c.height).toBeCloseTo(44, 0);
    });
});
