import { test, expect, type Page } from "@playwright/test";
import * as path from "node:path";

/**
 * Settings persistence across reload — asset architecture.
 *
 * The legacy session-API persistence (`/api/sessions/{slug}` + `/s/` routes) was
 * removed. The asset architecture persists the working session as an IndexedDB
 * `WorkspaceDraft` (db `fourier-drafts`, store `drafts`, keyPath `imageSlug`),
 * auto-saved (debounced ~1s) by the workspace store whenever `contourSettings` /
 * `animationSettings` change (stores/workspace.ts `scheduleDraftSave`). On reload
 * of `/w/{imageSlug}`, `loadWorkspace` → `loadDraft` restores those settings,
 * which `useWorkspaceLoader` seeds back into the `nHarmonics` / `nPoints` inputs.
 *
 * This spec exercises that real client-side persistence path end-to-end:
 *   upload → change Harmonics → (draft auto-saves to IndexedDB) → reload →
 *   assert the input restored the value + the IndexedDB draft holds it.
 * No `/api/sessions`, no `/s/` routes, no shared-URL multi-visitor flow (that
 * was a session-API affordance with no asset-arch analogue — drafts are
 * device-local IndexedDB, the cross-visitor share path is the published
 * `/v/{slug}` visualization, covered by visualization-crud.spec.ts).
 */

const TEST_IMAGE = path.resolve(import.meta.dirname, "../../assets/animals/golden-retriever.webp");

/** The IndexedDB draft layer the asset arch persists settings into. */
const DRAFT_DB = "fourier-drafts";
const DRAFT_STORE = "drafts";

/** Read the persisted `WorkspaceDraft` for `imageSlug` straight from IndexedDB. */
async function readDraft(page: Page, imageSlug: string): Promise<any> {
    return page.evaluate(
        ({ dbName, storeName, key }) =>
            new Promise((resolve, reject) => {
                const req = indexedDB.open(dbName);
                req.onsuccess = () => {
                    const db = req.result;
                    const tx = db.transaction(storeName, "readonly");
                    const get = tx.objectStore(storeName).get(key);
                    get.onsuccess = () => resolve(get.result ?? null);
                    get.onerror = () => reject(get.error);
                };
                req.onerror = () => reject(req.error);
            }),
        { dbName: DRAFT_DB, storeName: DRAFT_STORE, key: imageSlug },
    );
}

/** Upload the fixture, returning the `/w/{imageSlug}` slug once the canvas renders. */
async function uploadAndOpen(page: Page): Promise<string> {
    await page.goto("/visualize");
    await page.getByTestId("image-file-input").setInputFiles(TEST_IMAGE);
    await page.waitForURL(/\/w\//, { timeout: 15_000 });
    const imageSlug = page.url().match(/\/w\/([^/?#]+)/)?.[1];
    expect(imageSlug, "imageSlug parsed from /w/ URL").toBeTruthy();

    // Canvas appears once auto-compute lands — the BasisSelector (which holds the
    // Harmonics / Sample-Points inputs) only mounts once `hasData` is true.
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    return imageSlug as string;
}

test.describe.serial("Settings persistence across reload (asset arch)", () => {
    test("harmonics setting persists to the IndexedDB draft and restores on reload", async ({ page }) => {
        const imageSlug = await uploadAndOpen(page);

        // The Harmonics input lives in BasisSelector (aria-label="Harmonics"),
        // visible once data has computed.
        const harmonicsInput = page.getByRole("spinbutton", { name: "Harmonics" });
        await expect(harmonicsInput).toBeVisible({ timeout: 30_000 });

        // Change harmonics to a non-default value (default is 50).
        await harmonicsInput.fill("120");
        await harmonicsInput.press("Enter");

        // The store debounces the draft save (~1s) after `contourSettings`
        // changes; poll IndexedDB until the draft reflects the new value. This is
        // deterministic — the assertion targets the persisted state, not a timer.
        await expect
            .poll(async () => (await readDraft(page, imageSlug))?.contourSettings?.n_harmonics, {
                timeout: 15_000,
            })
            .toBe(120);

        // Reload `/w/{imageSlug}` — `loadWorkspace` rehydrates from the draft.
        await page.reload();
        await page.waitForURL(/\/w\//, { timeout: 15_000 });

        const canvas = page.locator("canvas").first();
        await expect(canvas).toBeVisible({ timeout: 60_000 });

        // The restored draft seeds the Harmonics input back to 120 (not default 50).
        const harmonicsAfter = page.getByRole("spinbutton", { name: "Harmonics" });
        await expect(harmonicsAfter).toBeVisible({ timeout: 30_000 });
        await expect(harmonicsAfter).toHaveValue("120");

        // And the persisted draft still carries it.
        const draftAfter = await readDraft(page, imageSlug);
        expect(draftAfter?.contourSettings?.n_harmonics).toBe(120);
    });

    test("sample points setting persists to the IndexedDB draft and restores on reload", async ({ page }) => {
        const imageSlug = await uploadAndOpen(page);

        const pointsInput = page.getByRole("spinbutton", { name: "Sample Points" });
        await expect(pointsInput).toBeVisible({ timeout: 30_000 });

        // Change sample points to 2048 (default 1024; step 128).
        await pointsInput.fill("2048");
        await pointsInput.press("Enter");

        await expect
            .poll(async () => (await readDraft(page, imageSlug))?.contourSettings?.n_points, {
                timeout: 15_000,
            })
            .toBe(2048);

        await page.reload();
        await page.waitForURL(/\/w\//, { timeout: 15_000 });

        const canvas = page.locator("canvas").first();
        await expect(canvas).toBeVisible({ timeout: 60_000 });

        const pointsAfter = page.getByRole("spinbutton", { name: "Sample Points" });
        await expect(pointsAfter).toBeVisible({ timeout: 30_000 });
        await expect(pointsAfter).toHaveValue("2048");

        const draftAfter = await readDraft(page, imageSlug);
        expect(draftAfter?.contourSettings?.n_points).toBe(2048);
    });
});
