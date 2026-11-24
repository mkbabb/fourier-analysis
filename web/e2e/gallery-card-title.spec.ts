import { expect, test } from "@playwright/test";
import { ENTRY, stubGallery } from "./fixtures/gallery";

/**
 * FORTY-SIXTH C (the gallery's demo pieces, read on its cards): at 390 a title
 * was cut to one line ("Augustin-Louis Cauc..."), and at a desk a titled card
 * repeated itself as its slug line. A title takes two lines before it is cut,
 * and a titled card carries no slug line; an untitled card is named by its slug.
 */

const LONG = { ...ENTRY, slug: "washed-blazing-latte-beetle", title: "Augustin-Louis Cauchy, from a lithograph of about 1840" };
const SHORT = { ...ENTRY, slug: "vast-pacing-cedar-turtle", title: "Joseph Fourier" };
const UNTITLED = { ...ENTRY, slug: "noble-skating-cocoa-koala", title: null };

for (const vp of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
]) {
    test(`a card's title takes two lines and no slug repeats it (${vp.width})`, async ({ page }) => {
        await page.setViewportSize(vp);
        await stubGallery(page, [LONG, SHORT, UNTITLED]);
        await page.goto("/gallery");
        const long = page.locator("article.gallery-card", { hasText: "Augustin-Louis" });
        await expect(long).toBeVisible({ timeout: 30_000 });

        const title = long.locator(".card-title");
        const lines = await title.evaluate((el) => {
            const lh = parseFloat(getComputedStyle(el).lineHeight);
            return el.getBoundingClientRect().height / lh;
        });
        if (vp.width === 390) expect(lines, "a long title wraps to a second line on a phone's card").toBeGreaterThan(1.8);
        expect(lines, "and stops at two").toBeLessThan(2.2);

        for (const entry of [LONG, SHORT]) {
            const c = page.locator("article.gallery-card", { hasText: entry.title! });
            await expect(c).not.toContainText(entry.slug);
        }
        // The untitled card is named by its slug.
        await expect(page.locator("article.gallery-card .card-title", { hasText: UNTITLED.slug })).toHaveText(UNTITLED.slug);
    });
}
