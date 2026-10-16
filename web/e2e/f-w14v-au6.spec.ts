// SERVED MODEL: claude-opus-5-5
import { expect, test } from "@playwright/test";

/**
 * X.F.W14V.au6 — A2-FO-L1-24 (d): the shape extractor is a dev-only tool. It
 * traces the morph demo's sun and moon into contour data for a developer; it
 * is registered only when `import.meta.env.DEV`, so the dev server (:3100)
 * still serves it and the production bundle (the `vite preview` on :4190 that
 * `playwright.config.ts` builds) answers the not-found card.
 */

const PROD = process.env.FW14U_MISC_PROD ?? "http://localhost:4190";

test.describe("A2-FO-L1-24 (d) — the shape extractor is dev-only", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("the dev server still serves the tool", async ({ page }) => {
        await page.goto("/demo/shape-extractor");
        await expect(page.locator("#extract-status")).toContainText(/xtracted \d+ sun/, { timeout: 30_000 });
    });

    test("the production bundle has no such route: it is the not-found page", async ({ page }) => {
        await page.goto(`${PROD}/demo/shape-extractor`);
        await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible({ timeout: 30_000 });
        await expect(page.locator("#extract-status")).toHaveCount(0);
    });
});
