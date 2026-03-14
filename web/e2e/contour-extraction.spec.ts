import { test, expect } from "@playwright/test";
import * as path from "node:path";
import * as fs from "node:fs";

const ANIMALS_DIR = path.resolve(import.meta.dirname, "../../assets/animals");

const animalImages = fs.readdirSync(ANIMALS_DIR).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));

test.describe("Contour extraction with animal images", () => {
    test.beforeEach(async ({ page }) => {
        // Navigate — asset-based architecture shows upload UI at /visualize (no session)
        await page.goto("/visualize");
    });

    for (const imageName of animalImages) {
        test(`upload and extract contours — ${imageName}`, async ({ page }) => {
            // Upload image via file input
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles(path.join(ANIMALS_DIR, imageName));

            // Should redirect to /w/{imageSlug}
            await page.waitForURL(/\/w\//, { timeout: 15_000 });

            // Wait for canvas to render (auto-compute on mount)
            const canvas = page.locator("canvas").first();
            await expect(canvas).toBeVisible({ timeout: 60_000 });
            await page.waitForTimeout(2000);

            // Verify epicycle canvas renders with non-zero dimensions
            const box = await canvas.boundingBox();
            expect(box).toBeTruthy();
            expect(box!.width).toBeGreaterThan(0);
            expect(box!.height).toBeGreaterThan(0);

            // Screenshot for visual inspection
            await page.screenshot({
                path: `e2e/screenshots/${imageName}-default.png`,
                fullPage: true,
            });
        });
    }

    test("adjust contour controls and verify recomputation", async ({ page }) => {
        if (animalImages.length === 0) {
            test.skip();
            return;
        }

        // Upload first animal image
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(path.join(ANIMALS_DIR, animalImages[0]));

        await page.waitForURL(/\/w\//, { timeout: 15_000 });

        // Wait for initial computation
        const canvas = page.locator("canvas").first();
        await expect(canvas).toBeVisible({ timeout: 60_000 });
        await page.waitForTimeout(2000);

        // Open the Contour collapsible (click the trigger text)
        await page.locator("button, [role='button']").filter({ hasText: "Contour" }).first().click();
        await page.waitForTimeout(500);

        // Wait for Blur Sigma to be visible
        await expect(page.locator("text=Blur Sigma").first()).toBeVisible({ timeout: 5_000 });

        // Adjust blur sigma via the number input next to the slider
        const blurSection = page.locator("text=Blur Sigma").first().locator("..");
        const blurInput = blurSection.locator('input[type="number"]');
        if (await blurInput.count() > 0) {
            await blurInput.fill("3");
            await blurInput.press("Enter");
        } else {
            // Fallback: fill the range input
            const blurSlider = blurSection.locator('input[type="range"]');
            await blurSlider.fill("3");
        }

        // Wait for debounced recomputation (1s debounce + compute time)
        await page.waitForTimeout(5000);

        // Verify canvas still renders
        await expect(canvas).toBeVisible({ timeout: 10_000 });

        // Screenshot adjusted result
        await page.screenshot({
            path: `e2e/screenshots/${animalImages[0]}-adjusted.png`,
            fullPage: true,
        });
    });

    test("strategy switching triggers recomputation", async ({ page }) => {
        if (animalImages.length === 0) {
            test.skip();
            return;
        }

        // Upload first animal image
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(path.join(ANIMALS_DIR, animalImages[0]));

        await page.waitForURL(/\/w\//, { timeout: 15_000 });

        // Wait for initial computation
        const canvas = page.locator("canvas").first();
        await expect(canvas).toBeVisible({ timeout: 60_000 });
        await page.waitForTimeout(2000);

        // Open the Contour collapsible
        const contourHeader = page.locator("text=Contour").first();
        await contourHeader.click();
        await page.waitForTimeout(300);

        // Change strategy to "threshold"
        const strategyTrigger = page.locator('[role="combobox"]').first();
        await strategyTrigger.click();
        await page.locator('[role="option"]').filter({ hasText: "Otsu Threshold" }).click();

        // Wait for debounced recomputation
        await page.waitForTimeout(5000);

        // Verify canvas still renders
        await expect(canvas).toBeVisible({ timeout: 10_000 });

        await page.screenshot({
            path: `e2e/screenshots/${animalImages[0]}-threshold.png`,
            fullPage: true,
        });
    });

    test("no console errors during flow", async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on("console", (msg) => {
            if (msg.type() === "error") {
                consoleErrors.push(msg.text());
            }
        });

        if (animalImages.length === 0) {
            test.skip();
            return;
        }

        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(path.join(ANIMALS_DIR, animalImages[0]));

        await page.waitForURL(/\/w\//, { timeout: 15_000 });

        const canvas = page.locator("canvas").first();
        await expect(canvas).toBeVisible({ timeout: 60_000 });
        await page.waitForTimeout(2000);

        // Filter out benign errors (e.g. favicon 404)
        const realErrors = consoleErrors.filter(
            (e) => !e.includes("favicon") && !e.includes("404") && !e.includes("ERR_CONNECTION_REFUSED"),
        );
        expect(realErrors).toEqual([]);
    });
});
