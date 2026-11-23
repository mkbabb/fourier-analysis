import { expect, test, type Page } from "@playwright/test";
import { openAppDock } from "./fixtures/app-dock";

/**
 * The About card's own words at the type floor (FORTY-SECOND A; the study's
 * floors, 2.6: 14 px for anything read). The tagline says what the site is and
 * the sign-in field's label names the field: neither is a caption, so both take
 * the small step (14 px on a phone), in quieter ink. On a phone the card holds
 * the sign-in (the account is its last part); at a desk the field is in the
 * account seat's popover.
 */

/** The font size of the first element matching `selector` (and `text`, when given). */
function sizeOf(page: Page, selector: string, text?: RegExp): Promise<number | null> {
    return page.evaluate(
        ([sel, src]) => {
            const re = src ? new RegExp(src, "i") : null;
            const el = [...document.querySelectorAll(sel)].find((e) => !re || re.test(e.textContent?.trim() ?? ""));
            return el ? parseFloat(getComputedStyle(el).fontSize) : null;
        },
        [selector, text?.source ?? ""] as const,
    );
}

for (const vp of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
]) {
    for (const scheme of ["dark", "light"] as const) {
        test.describe(`the About card's words at ${vp.width} (${scheme})`, () => {
            test.use({ viewport: vp, colorScheme: scheme });

            test("the tagline, the handle and the field's label are 14 px or larger", async ({ page }) => {
                const phone = vp.width < 640;
                await page.goto("/gallery");
                const dock = await openAppDock(page);
                await dock.getByRole("button", { name: "About Fourier analysis" }).click();
                await expect(page.locator(".about-card")).toContainText(/orthogonal decomposition/i);
                const tagline = await sizeOf(page, ".about-card p", /orthogonal decomposition/);
                const handle = await sizeOf(page, ".about-card p", /^@mbabb$/);
                // On a phone the card holds the sign-in; at a desk it is the
                // account seat's popover.
                if (!phone) {
                    await page.keyboard.press("Escape");
                    await expect(page.locator(".about-card")).toHaveCount(0);
                    await dock.getByRole("button", { name: "Log in" }).click();
                }
                await expect(page.locator('label[for="user-slug-input"]')).toBeVisible();
                const label = await sizeOf(page, 'label[for="user-slug-input"]');
                expect(tagline, "the tagline").toBeGreaterThanOrEqual(13.95);
                expect(handle, "the handle").toBeGreaterThanOrEqual(13.95);
                expect(label, "the field's label").toBeGreaterThanOrEqual(13.95);
            });
        });
    }
}
