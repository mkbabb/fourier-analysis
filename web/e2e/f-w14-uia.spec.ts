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
