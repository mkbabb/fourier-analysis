// SERVED MODEL: claude-opus-5-5
import { expect, test, type Page } from "@playwright/test";
import { ENTRY, stubAdminApi } from "./fixtures/gallery";
import { seededViz } from "./fixtures/seed";

/**
 * X.F.W14V.u3 — the shell/admin rows re-homed by F-W14U.md addendum (h).
 *
 * e183 — UIA-F-183, the control-state half: publishing is not a dead end and
 * does not duplicate. One Publish makes one public piece; the toast names it
 * without the raw slug and offers View; the control then shows the published
 * state (its own glyph and name), and pressing it again opens the piece rather
 * than creating another public copy. (The toast's View seat itself landed in
 * F.W14U `.shell`.)
 *
 * e149 — UIA-F-149, the consumer half: the admin banner is a glass Card, so its
 * radius is the card radius and the Metric cells inside it no longer invert the
 * concentric law (16px cells in a 10px banner). The strict law — the cell
 * radius derived from `--radius-ctx` minus the inset — is glass's half (O-59).
 *
 * Served from :3100 (BASE_URL) against the API on :8000. `FW14V_PHASE` names
 * the frames (before/after).
 */

const PHASE = process.env.FW14V_PHASE ?? "after";
const FRAMES = "e2e/screenshots/f-w14v/u3";

async function frame(page: Page, name: string): Promise<void> {
    const w = page.viewportSize()!.width;
    await page.screenshot({ path: `${FRAMES}/${PHASE}-${name}-${w}.png` });
}

test.describe("UIA-F-183 — publishing is not a dead end and does not duplicate", () => {
    test("e183: one public copy; the toast names no slug and offers View; the control shows Published and opens the piece", async ({ page }) => {
        const viz = seededViz();
        const saved = { ...ENTRY, slug: "still-cobalt-meadow-wren", visibility: "draft", title: null };
        let posts = 0;
        let patches = 0;
        await page.route("**/api/visualizations", async (route) => {
            if (route.request().method() !== "POST") return route.fallback();
            posts++;
            await route.fulfill({ status: 201, contentType: "application/json", headers: { ETag: '"e1"' }, body: JSON.stringify(saved) });
        });
        await page.route(`**/api/visualizations/${saved.slug}`, (route) => {
            if (route.request().method() === "PATCH") patches++;
            return route.fulfill({ status: 200, contentType: "application/json", headers: { ETag: '"e2"' }, body: JSON.stringify({ ...saved, visibility: "public" }) });
        });
        // Publishing needs a session (UIA-F-95); the viewer is logged in the app's own way.
        await page.addInitScript(() => localStorage.setItem("fourier-user-slug", "e2e-publisher"));
        await page.goto(`/v/${viz.slug}`);
        const edit = page.getByRole("button", { name: "Edit contour" }).first();
        await edit.hover();
        const publish = page.getByRole("button", { name: "Publish to Gallery" }).first();
        await expect(publish).toBeVisible({ timeout: 60_000 });
        await page.waitForTimeout(600);
        await frame(page, "e183-before-press");
        await publish.click();

        // The toast names the act, never the raw slug, and offers View.
        await expect(page.getByText("Published to the gallery").first()).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText(saved.slug)).toHaveCount(0);
        await expect(page.getByRole("button", { name: "View", exact: true }).first()).toBeVisible();
        await frame(page, "e183-toast");

        // The control shows the published state: its own name, its own glyph.
        await edit.hover();
        const published = page.getByRole("button", { name: /^Published/ }).first();
        await expect(published).toBeVisible();
        await expect(page.getByRole("button", { name: "Publish to Gallery" })).toHaveCount(0);
        await frame(page, "e183-published-control");

        // Pressing it again opens the piece; it makes no second public copy.
        await published.click();
        await expect(page).toHaveURL(new RegExp(`/v/${saved.slug}$`), { timeout: 10_000 });
        expect(posts).toBe(1);
        expect(patches).toBe(1);
    });
});

test.describe("UIA-F-149 — the admin banner obeys the concentric law (consumer half)", () => {
    test("e149: the banner is a glass Card on the card radius; no Metric cell is rounder than its container", async ({ page }) => {
        await stubAdminApi(page);
        await page.goto("/gallery?admin=e2e-admin-token");
        const banner = page.getByRole("region", { name: "Admin mode banner" });
        await expect(banner).toBeVisible({ timeout: 30_000 });
        await expect(banner.getByText("entries", { exact: false }).first()).toBeVisible({ timeout: 30_000 });
        await frame(page, "e149-banner");
        const radii = await banner.evaluate((el) => {
            const px = (v: string) => parseFloat(v);
            const probe = document.createElement("div");
            probe.style.borderRadius = "var(--radius-card)";
            el.appendChild(probe);
            const card = px(getComputedStyle(probe).borderTopLeftRadius);
            probe.remove();
            const cells = [...el.querySelectorAll<HTMLElement>('.metric[data-posture="cell"]')];
            return {
                isCard: el.classList.contains("card"),
                outer: px(getComputedStyle(el).borderTopLeftRadius),
                card,
                cells: cells.map((c) => px(getComputedStyle(c).borderTopLeftRadius)),
            };
        });
        expect(radii.isCard, "the banner is a glass Card").toBe(true);
        expect(radii.outer, "the banner wears the card radius").toBe(radii.card);
        expect(radii.cells.length).toBe(6);
        for (const inner of radii.cells) expect(inner, "a cell is never rounder than the banner").toBeLessThanOrEqual(radii.outer);
    });
});
