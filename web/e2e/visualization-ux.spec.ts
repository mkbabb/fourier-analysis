import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import * as path from "node:path";

/**
 * B.W2 — visualization-route UX coherence spec (Invariant 18 + 19 binding).
 *
 * This is the axe-core keystone-state spec folded forward from W4.d
 * (W2 scope items 16 + 17). It binds Invariant 18 (modal a11y + dock idiom)
 * with measurement at four keystone states, and captures the Invariant 19
 * auto-recompute regression-guard as a red-baseline assertion that un-skips
 * once W3's `saveContourPoints` auto-recompute seam lands.
 *
 * @axe-core/playwright exposes the builder API (`AxeBuilder`), not the
 * `injectAxe` / `checkA11y` helpers (those belong to the separate
 * `axe-playwright` package). The local `checkA11y` wrapper below preserves the
 * wave's intent — inject axe + assert zero serious/critical violations — atop
 * the package that the W2 hard gate (H-W2-1) actually installs.
 */

const TEST_IMAGE = path.resolve(
    import.meta.dirname,
    "../../assets/animals/golden-retriever.webp",
);

/** Inject axe-core into `page` and assert zero serious/critical violations. */
async function checkA11y(page: Page, label: string): Promise<void> {
    const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

    const blocking = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(
        blocking,
        `axe-core serious/critical violations at "${label}":\n` +
            blocking
                .map((v) => `  • [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length} node(s))`)
                .join("\n"),
    ).toEqual([]);
}

/** Upload the keystone image and wait for the workspace canvas to render. */
async function openWorkspace(page: Page): Promise<void> {
    await page.goto("/visualize");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGE);
    await page.waitForURL(/\/w\//, { timeout: 15_000 });
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    // Settle deterministically on the actual mount condition the keystones
    // depend on — NOT a blind fixed timeout (flaky: too short on slow CI, so
    // axe runs against a half-mounted DOM; wasteful on fast). The auto-compute
    // round-trip resolving (networkidle) plus the dock's "More options" trigger
    // becoming visible is the precise "dock + panels are fully mounted" signal.
    await page.waitForLoadState("networkidle", { timeout: 60_000 });
    await expect(page.locator('[aria-label="More options"]').first()).toBeVisible({
        timeout: 60_000,
    });
}

test.describe.serial("B.W2 — visualization UX coherence (a11y keystones)", () => {
    // ── Keystone 1 — workspace default ──
    test("keystone: workspace default has no serious/critical a11y violations", async ({
        page,
    }) => {
        await openWorkspace(page);
        await checkA11y(page, "workspace default");
    });

    // ── Keystone 2 — ContourSettings Configurator open ──
    test("keystone: ContourSettings Configurator-open is a11y-clean", async ({ page }) => {
        await openWorkspace(page);

        // Expand the Contour configurator section.
        await page
            .locator("button, [role='button']")
            .filter({ hasText: "Contour" })
            .first()
            .click();
        await expect(page.locator("text=Blur Sigma").first()).toBeVisible({
            timeout: 5_000,
        });

        await checkA11y(page, "ContourSettings Configurator-open");
    });

    // ── Keystone 3 — ExportModal Dialog open ──
    test("keystone: ExportModal Dialog-open is a11y-clean", async ({ page }) => {
        await openWorkspace(page);

        // The export affordance lives behind the AnimationControls "More
        // options" dropdown; open it, then trigger Export to raise the Dialog.
        const moreOptions = page
            .locator('[aria-label="More options"]')
            .first();
        await moreOptions.click();
        await page.getByText("Export", { exact: false }).first().click();

        // The glass-ui Dialog should expose role="dialog".
        const dialog = page.locator('[role="dialog"]').first();
        await expect(dialog).toBeVisible({ timeout: 5_000 });

        await checkA11y(page, "ExportModal Dialog-open");
    });

    // ── Keystone 4 — AnimationControls dropdown open ──
    test("keystone: AnimationControls dropdown-open is a11y-clean", async ({ page }) => {
        await openWorkspace(page);

        const moreOptions = page
            .locator('[aria-label="More options"]')
            .first();
        await moreOptions.click();

        // The glass-ui DropdownMenuContent should expose role="menu".
        const menu = page.locator('[role="menu"]').first();
        await expect(menu).toBeVisible({ timeout: 5_000 });

        await checkA11y(page, "AnimationControls dropdown-open");
    });

    // ── Invariant 19 — auto-recompute regression guard ──
    // RED BASELINE: `saveContourPoints` (workspace.ts) nulls epicycleData /
    // basesData and launches no recompute; the ContourSettings watcher does not
    // key on `store.contour`, so post-save the canvas stays blank. This
    // assertion asserts the OPPOSITE (canvas re-renders within one rAF with no
    // control perturbation + a single compute pass) and therefore FAILS today.
    // Un-skip at W3 when the auto-recompute seam (the ComputeBasesRequest model
    // + the `store.contour`-keyed auto-compute watcher) lands.
    test.fixme(
        "save_contour_then_recompute: canvas re-renders within one rAF after saveContourPoints",
        async ({ page }) => {
            await openWorkspace(page);

            const canvas = page.locator("canvas").first();

            // Snapshot the control values before the save so we can assert they
            // are not perturbed by the auto-recompute.
            const controlsBefore = await page
                .locator('input[type="number"], input[type="range"]')
                .evaluateAll((els) =>
                    (els as (HTMLInputElement)[]).map((el) => el.value),
                );

            // Drive a contour edit + save through the store hook (W3 exposes
            // `window.__store`; until then this is part of the red baseline).
            await page.evaluate(() => {
                const store = (window as unknown as { __store?: { saveContourPoints?: () => void } }).__store;
                store?.saveContourPoints?.();
            });

            // One rAF (~16ms) plus a small slack: the canvas must NOT fall back
            // to the placeholder; it must re-render the recomputed chain.
            await page.waitForTimeout(64);

            // Canvas is still the live render, not the placeholder.
            await expect(canvas).toBeVisible();
            const box = await canvas.boundingBox();
            expect(box!.width).toBeGreaterThan(0);

            // Controls were not perturbed by the auto-recompute.
            const controlsAfter = await page
                .locator('input[type="number"], input[type="range"]')
                .evaluateAll((els) =>
                    (els as (HTMLInputElement)[]).map((el) => el.value),
                );
            expect(controlsAfter).toEqual(controlsBefore);

            // A single compute pass — not a recompute storm.
            const computeCount = await page.evaluate(
                () =>
                    (window as unknown as { __computeCount?: number }).__computeCount ?? 0,
            );
            expect(computeCount).toBe(1);
        },
    );
});
