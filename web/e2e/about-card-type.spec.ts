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

async function openCard(page: Page, phone: boolean) {
    await page.goto("/gallery");
    const dock = await openAppDock(page);
    await dock.getByRole("button", { name: "About Fourier analysis" }).click();
    const card = page.locator(".about-card");
    await expect(card).toContainText(/orthogonal decomposition/i);
    if (!phone) {
        await page.keyboard.press("Escape");
        await dock.getByRole("button", { name: "Log in" }).click();
    }
    return card;
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
                await openCard(page, phone);
                const read = await page.evaluate(() => {
                    const px = (el: Element | null) => (el ? parseFloat(getComputedStyle(el).fontSize) : null);
                    const tagline = [...document.querySelectorAll(".about-card p")].find((p) => /orthogonal decomposition/i.test(p.textContent ?? ""));
                    const handle = [...document.querySelectorAll(".about-card p")].find((p) => p.textContent?.trim() === "@mbabb");
                    const label = document.querySelector('label[for="user-slug-input"]');
                    return { tagline: px(tagline ?? null), handle: px(handle ?? null), label: px(label) };
                });
                expect(read.tagline, "the tagline").toBeGreaterThanOrEqual(13.95);
                expect(read.handle, "the handle").toBeGreaterThanOrEqual(13.95);
                expect(read.label, "the field's label").toBeGreaterThanOrEqual(13.95);
            });
        });
    }
}
