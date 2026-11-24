import { expect, test } from "@playwright/test";

/**
 * FORTY-SIXTH D (owner, 23 Nov: "we should store page state in the URL, not
 * just in browser session, such that if we go back to a bare
 * keyframes.babb.dev, it should be the homescreen"). A bare
 * fourier.babb.dev opened whichever section browser storage remembered
 * (`fourier_active_tab`), which is how he reached the Visualize hero he
 * called Home. A bare `/` opens Home, the page the dock's Home seat opens,
 * whatever a past visit left in storage.
 */

for (const remembered of ["/gallery", "/visualize", "/equation"]) {
    test(`a bare / opens Home, whatever storage remembers (${remembered})`, async ({ page }) => {
        await page.addInitScript((tab) => {
            try {
                localStorage.setItem("fourier_active_tab", tab);
            } catch {
                /* storage blocked: nothing remembered */
            }
        }, remembered);
        await page.goto("/");
        await expect(page).toHaveURL(/\/paper$/);
        // The section a press then opens is the place, not a remembered one.
        const homeHref = await page.locator(".app-dock .logo-trigger").getAttribute("href");
        expect(new URL(page.url()).pathname).toBe(homeHref);
    });
}

test("a visit to a section leaves nothing that changes where / opens", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page).toHaveURL(/\/gallery/);
    await page.goto("/");
    await expect(page).toHaveURL(/\/paper$/);
});
