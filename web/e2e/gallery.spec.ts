import { test, expect } from "@playwright/test";

test.describe("Gallery UX", () => {
    test("gallery page renders with tabs and search bar", async ({ page }) => {
        await page.goto("/gallery");

        // BouncyToggle tabs should be visible
        const galleryTab = page.locator("button.bouncy-btn", { hasText: "Gallery" });
        const draftsTab = page.locator("button.bouncy-btn", { hasText: "Drafts" });
        await expect(galleryTab).toBeVisible({ timeout: 10_000 });
        await expect(draftsTab).toBeVisible();

        // Gallery tab is active by default
        await expect(galleryTab).toHaveClass(/is-active/);

        // Search bar (GlassDock) should be visible
        const searchInput = page.locator('input[placeholder="Search by slug..."]');
        // Either in the dock or visible directly
        const glassDock = page.locator(".glass-dock");
        await expect(glassDock.or(searchInput)).toBeVisible();
    });

    test("switching to drafts tab shows drafts section", async ({ page }) => {
        await page.goto("/gallery");

        const draftsTab = page.locator("button.bouncy-btn", { hasText: "Drafts" });
        await expect(draftsTab).toBeVisible({ timeout: 10_000 });
        await draftsTab.click();

        // Drafts tab becomes active
        await expect(draftsTab).toHaveClass(/is-active/);

        // Should show either drafts or the empty state
        const draftsContent = page.locator("text=No drafts yet").or(
            page.locator(".draft-item"),
        );
        await expect(draftsContent).toBeVisible({ timeout: 5_000 });
    });

    test("search bar filter drawer toggles", async ({ page }) => {
        await page.goto("/gallery");

        // Wait for the page to load
        await page.waitForTimeout(1000);

        // Expand dock if collapsed
        const glassDock = page.locator(".glass-dock");
        if (await glassDock.locator(".dock-layer--summary").isVisible().catch(() => false)) {
            await glassDock.click();
            await page.waitForTimeout(500);
        }

        // Click the filter toggle (SlidersHorizontal button)
        const filterToggle = page.locator(".filter-toggle");
        if (await filterToggle.isVisible()) {
            await filterToggle.click();

            // Filter drawer should appear
            const filterPanel = page.locator(".filter-panel");
            await expect(filterPanel).toBeVisible({ timeout: 3_000 });
        }
    });

    test("login form shows emoji placeholder and dice button", async ({ page }) => {
        await page.goto("/gallery");

        // Click the login button in the header
        const loginBtn = page.locator("button", { hasText: "Log in" });
        if (await loginBtn.isVisible().catch(() => false)) {
            await loginBtn.click();

            // Input should have the emoji placeholder
            const slugInput = page.locator('input[placeholder="your-slug-here 🐌"]');
            await expect(slugInput).toBeVisible({ timeout: 3_000 });

            // Dice button should be present (title="Generate new slug")
            const diceBtn = page.locator('button[title="Generate new slug"]');
            await expect(diceBtn).toBeVisible();
        }
    });

    test("visualizer has overlay buttons in flex layout", async ({ page }) => {
        await page.goto("/visualize");

        // Upload an image to get overlay buttons
        const fileInput = page.locator('input[type="file"]');
        const testImage = new URL(
            "../../assets/animals/golden-retriever.webp",
            import.meta.url,
        ).pathname;
        await fileInput.setInputFiles(testImage);

        await page.waitForURL(/\/w\//, { timeout: 15_000 });

        // Wait for canvas
        const canvas = page.locator("canvas").first();
        await expect(canvas).toBeVisible({ timeout: 60_000 });

        // Overlay buttons should be in a flex container
        const overlayContainer = page.locator(".absolute.top-2.right-2.z-20.flex");
        await expect(overlayContainer).toBeVisible({ timeout: 5_000 });

        // Should contain glass-btn elements
        const buttons = overlayContainer.locator(".glass-btn");
        const count = await buttons.count();
        expect(count).toBeGreaterThanOrEqual(2); // at least expand + edit
    });

    test("no console errors on gallery page", async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on("console", (msg) => {
            if (msg.type() === "error") {
                consoleErrors.push(msg.text());
            }
        });

        await page.goto("/gallery");
        await page.waitForTimeout(2000);

        // Filter benign errors
        const realErrors = consoleErrors.filter(
            (e) =>
                !e.includes("favicon") &&
                !e.includes("404") &&
                !e.includes("ERR_CONNECTION_REFUSED") &&
                !e.includes("429"),
        );
        expect(realErrors).toEqual([]);
    });
});
