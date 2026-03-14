import { test, expect } from "@playwright/test";
import * as path from "node:path";

const TEST_IMAGE = path.resolve(import.meta.dirname, "../../assets/animals/golden-retriever.webp");

// These tests rely on the old session-based API (/api/sessions/{slug}).
// The new asset-based architecture uses workspace drafts (IndexedDB) + snapshots.
// TODO: Rewrite for asset-based persistence (workspace store + snapshot API).
test.describe.skip("Settings persistence across page reload", () => {
    test("contour settings and harmonics persist via session slug", async ({ page }) => {
        // 1. Navigate and create session
        await page.goto("/visualize");
        await page.waitForURL(/\/s\//);

        // 2. Upload image
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(TEST_IMAGE);

        // Wait for canvas to appear (computation done)
        const canvas = page.locator("canvas").first();
        await expect(canvas).toBeVisible({ timeout: 30_000 });
        await page.waitForTimeout(2000);

        // 3. Record the slug URL
        const url = page.url();
        const slug = url.match(/\/s\/(.+)/)?.[1];
        expect(slug).toBeTruthy();

        // 4. Open the Contour settings collapsible
        const contourHeader = page.locator("text=Contour").first();
        await contourHeader.click();
        await page.waitForTimeout(300);

        // 5. Change harmonics to 150 via the number input
        const harmonicsInput = page.locator('input[type="number"]').filter({ hasText: "" }).first();
        // Find the harmonics number input by its label context
        const harmonicsSection = page.locator("text=Harmonics (N)").locator("..");
        const harmonicsNumberInput = harmonicsSection.locator('input[type="number"]');
        await harmonicsNumberInput.fill("150");
        await harmonicsNumberInput.press("Enter");

        // 6. Change blur sigma via slider
        // The first slider in Contour section is blur sigma
        // Find the Contour card's blur slider
        const blurSection = page.locator("text=Blur Sigma").locator("..");
        const blurNumberInput = blurSection.locator('input[type="number"]');
        await blurNumberInput.fill("3.5");
        await blurNumberInput.press("Enter");

        // 7. Wait for debounced compute + settings save (1s debounce + network)
        await page.waitForTimeout(4000);

        // 8. Verify settings were saved by checking the API directly
        const apiResponse = await page.evaluate(async (s) => {
            const res = await fetch(`/api/sessions/${s}`);
            return res.json();
        }, slug);

        expect(apiResponse.parameters.n_harmonics).toBe(150);
        expect(apiResponse.parameters.blur_sigma).toBeCloseTo(3.5, 1);

        // 9. Reload the page
        await page.reload();
        await page.waitForURL(/\/s\//);

        // Wait for session to load and canvas to appear
        await expect(canvas).toBeVisible({ timeout: 30_000 });
        await page.waitForTimeout(3000);

        // 10. Verify harmonics input shows saved value (150, not default 50)
        const harmonicsSectionAfter = page.locator("text=Harmonics (N)").locator("..");
        const harmonicsInputAfter = harmonicsSectionAfter.locator('input[type="number"]');
        await expect(harmonicsInputAfter).toHaveValue("150");

        // 11. Open Contour section and verify blur sigma
        const contourHeaderAfter = page.locator("text=Contour").first();
        await contourHeaderAfter.click();
        await page.waitForTimeout(300);

        const blurSectionAfter = page.locator("text=Blur Sigma").locator("..");
        const blurInputAfter = blurSectionAfter.locator('input[type="number"]');
        await expect(blurInputAfter).toHaveValue("3.5");

        // 12. Verify the API still returns correct values
        const apiAfterReload = await page.evaluate(async (s) => {
            const res = await fetch(`/api/sessions/${s}`);
            return res.json();
        }, slug);

        expect(apiAfterReload.parameters.n_harmonics).toBe(150);
        expect(apiAfterReload.parameters.blur_sigma).toBeCloseTo(3.5, 1);
    });

    test("sample points persist across reload", async ({ page }) => {
        await page.goto("/visualize");
        await page.waitForURL(/\/s\//);

        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(TEST_IMAGE);

        const canvas = page.locator("canvas").first();
        await expect(canvas).toBeVisible({ timeout: 30_000 });
        await page.waitForTimeout(2000);

        const url = page.url();
        const slug = url.match(/\/s\/(.+)/)?.[1];

        // Change sample points to 2048
        const pointsSection = page.locator("text=Sample Points").locator("..");
        const pointsInput = pointsSection.locator('input[type="number"]');
        await pointsInput.fill("2048");
        await pointsInput.press("Enter");

        // Wait for save
        await page.waitForTimeout(4000);

        // Verify in API
        const apiResponse = await page.evaluate(async (s) => {
            const res = await fetch(`/api/sessions/${s}`);
            return res.json();
        }, slug);
        expect(apiResponse.parameters.n_points).toBe(2048);

        // Reload
        await page.reload();
        await page.waitForURL(/\/s\//);
        await expect(canvas).toBeVisible({ timeout: 30_000 });
        await page.waitForTimeout(3000);

        // Verify persisted
        const pointsSectionAfter = page.locator("text=Sample Points").locator("..");
        const pointsInputAfter = pointsSectionAfter.locator('input[type="number"]');
        await expect(pointsInputAfter).toHaveValue("2048");
    });

    test("shared URL loads saved settings for new visitor", async ({ page, context }) => {
        // Create session with custom settings
        await page.goto("/visualize");
        await page.waitForURL(/\/s\//);

        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(TEST_IMAGE);

        const canvas = page.locator("canvas").first();
        await expect(canvas).toBeVisible({ timeout: 30_000 });
        await page.waitForTimeout(2000);

        const url = page.url();

        // Change harmonics to 200
        const harmonicsSection = page.locator("text=Harmonics (N)").locator("..");
        const harmonicsInput = harmonicsSection.locator('input[type="number"]');
        await harmonicsInput.fill("200");
        await harmonicsInput.press("Enter");
        await page.waitForTimeout(4000);

        // Open a NEW tab (simulates a different user visiting the shared URL)
        const newPage = await context.newPage();
        await newPage.goto(url);
        await newPage.waitForURL(/\/s\//);

        const newCanvas = newPage.locator("canvas").first();
        await expect(newCanvas).toBeVisible({ timeout: 30_000 });
        await newPage.waitForTimeout(3000);

        // Verify harmonics loaded from session
        const newHarmonicsSection = newPage.locator("text=Harmonics (N)").locator("..");
        const newHarmonicsInput = newHarmonicsSection.locator('input[type="number"]');
        await expect(newHarmonicsInput).toHaveValue("200");

        await newPage.close();
    });

    test("easing, speed, and active bases persist across reload", async ({ page }) => {
        await page.goto("/visualize");
        await page.waitForURL(/\/s\//);

        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(TEST_IMAGE);

        const canvas = page.locator("canvas").first();
        await expect(canvas).toBeVisible({ timeout: 30_000 });
        await page.waitForTimeout(2000);

        const url = page.url();
        const slug = url.match(/\/s\/(.+)/)?.[1];
        expect(slug).toBeTruthy();

        // Open the three-dot menu (contains easing + speed on mobile, easing on desktop)
        const menuBtn = page.locator("button.menu-btn").first();
        await menuBtn.click();
        await page.waitForTimeout(300);

        // Change easing by clicking the "Linear" chip inside the menu
        const linearChip = page.locator(".easing-chip-label").filter({ hasText: "Linear" }).first();
        await linearChip.click();
        await page.waitForTimeout(300);

        // Change speed to 2x via the speed select (desktop: inline, may also be in menu)
        const speedTrigger = page.locator('[role="combobox"]').filter({ hasText: /×/ }).first();
        await speedTrigger.click();
        await page.locator('[role="option"]').filter({ hasText: "2×" }).click();
        await page.waitForTimeout(500);

        // Close menu by clicking outside
        await page.locator("canvas").first().click({ position: { x: 10, y: 10 } });
        await page.waitForTimeout(300);

        // Toggle Chebyshev basis on
        const chebyshevPill = page.locator("button.basis-pill").filter({ hasText: "Chebyshev" });
        await chebyshevPill.click();
        await page.waitForTimeout(500);

        // Wait for debounced save (500ms debounce + network)
        await page.waitForTimeout(2000);

        // Verify in API
        const apiResponse = await page.evaluate(async (s) => {
            const res = await fetch(`/api/sessions/${s}`);
            return res.json();
        }, slug);

        expect(apiResponse.animation_settings.speed).toBe(2);
        expect(apiResponse.animation_settings.easing).toBe("linear");
        expect(apiResponse.animation_settings.active_bases).toContain("chebyshev");
        expect(apiResponse.animation_settings.active_bases).toContain("fourier-epicycles");

        // Reload the page
        await page.reload();
        await page.waitForURL(/\/s\//);
        await expect(canvas).toBeVisible({ timeout: 30_000 });
        await page.waitForTimeout(3000);

        // Verify Chebyshev pill is active
        const chebyshevAfter = page.locator("button.basis-pill.active").filter({ hasText: "Chebyshev" });
        await expect(chebyshevAfter).toBeVisible();

        // Verify API returns persisted values
        const apiAfter = await page.evaluate(async (s) => {
            const res = await fetch(`/api/sessions/${s}`);
            return res.json();
        }, slug);
        expect(apiAfter.animation_settings.speed).toBe(2);
        expect(apiAfter.animation_settings.easing).toBe("linear");
        expect(apiAfter.animation_settings.active_bases).toContain("chebyshev");
    });
});
