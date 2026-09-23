// SERVED MODEL: claude-opus-5-5
import { expect, test, type Page } from "@playwright/test";
import { ENTRY, stubGallery } from "./fixtures/gallery";

/**
 * X.F.W14.u — the UIA-F register (`value.js/docs/tranches/X/audit/UI-AUDIT-fourier.md`).
 *
 * One falsifier per CONSUMER row this unit cures at its cause, named by the
 * row id so a regression reads back to the register. Each test drives the
 * served page (Vite dev at `BASE_URL`) and asserts the computed or behavioural
 * reading the row's "expected (canon)" names, never a pixel copy.
 */

/** Collect uncaught page errors for the life of the test. */
function pageErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    return errors;
}

const FEATURED = { ...ENTRY, slug: "crowned-heron-lattice", title: "Crowned heron lattice", tier: "featured" };

test.describe("UIA-F-1 — a featured entry renders the strip, not a crash", () => {
    test("the pager lives inside its Carousel; no useCarousel pageerror", async ({ page }) => {
        const errors = pageErrors(page);
        await stubGallery(page, [FEATURED, ENTRY]);
        await page.goto("/gallery");
        const strip = page.locator("section.featured-section");
        await expect(strip).toBeVisible();
        await expect(strip.getByRole("heading", { name: "Featured" })).toBeVisible();
        await expect(strip.getByRole("group", { name: FEATURED.title })).toBeVisible();
        await expect(page.getByText("1 loaded")).toBeVisible();
        expect(errors.filter((m) => /useCarousel/.test(m))).toEqual([]);
    });
});

/** The first public saved visualization on the served API (read-only GET). */
async function firstSavedViz(page: Page): Promise<{ slug: string; image_slug: string }> {
    const res = await page.request.get("/api/visualizations?limit=1");
    expect(res.ok()).toBe(true);
    const body = (await res.json()) as { items: { slug: string; image_slug: string }[] };
    expect(body.items.length, "the served API holds a saved visualization").toBeGreaterThan(0);
    return body.items[0];
}

/** Push through the app's own router (no in-app link targets `/v/` yet). */
async function routerPush(page: Page, path: string): Promise<void> {
    await page.waitForFunction(() => "__vue_app__" in (document.querySelector("#app") ?? {}));
    await page.evaluate(async (p) => {
        const el = document.querySelector("#app") as unknown as {
            __vue_app__: { config: { globalProperties: { $router: { push(p: string): Promise<unknown> } } } };
        };
        await el.__vue_app__.config.globalProperties.$router.push(p);
    }, path);
}

test.describe("UIA-F-2 / UIA-F-3 — /v/:visualizationSlug loads the saved entity", () => {
    test("F-2: a cold deep link sends GET /api/visualizations/<slug> and leaves the upload stage", async ({ page }) => {
        const viz = await firstSavedViz(page);
        const got = page.waitForResponse(
            (r) => new URL(r.url()).pathname === `/api/visualizations/${viz.slug}` && r.request().method() === "GET",
        );
        await page.goto(`/v/${viz.slug}`);
        expect((await got).status()).toBe(200);
        await expect(page.getByText(/Drop or click to upload/i)).toHaveCount(0);
        await expect(page).toHaveURL(new RegExp(`/v/${viz.slug}$`));
    });

    test("F-3: an in-app push /w/ → /v/ stays on /v/ with no orphaned transition", async ({ page }) => {
        const errors = pageErrors(page);
        const viz = await firstSavedViz(page);
        await page.goto(`/w/${viz.image_slug}`);
        await expect(page).toHaveURL(new RegExp(`/w/${viz.image_slug}$`));
        await routerPush(page, `/v/${viz.slug}`);
        await page.waitForTimeout(600);
        await expect(page).toHaveURL(new RegExp(`/v/${viz.slug}$`));
        expect(errors).toEqual([]);
    });
});
