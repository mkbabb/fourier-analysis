// SERVED MODEL: claude-opus-5-5
import { expect, test, type Page } from "@playwright/test";
import { SAMPLE_IMAGE } from "./fixtures/sample";

/**
 * X.F.W14.r — F.W13's residuals, gated on the served page.
 *
 *   G-r1  the desktop ToC's scroll-to-top: a glass Button beside the CONTENTS
 *         disclosure (not in its seat), and it scrolls the paper to the top.
 *   G-r2  `.sidebar-link` corner = glass's row canon (`--radius-lg`), computed.
 *   G-c1  `.c` r1: the sidebar enters on the pick (the upload in flight), not
 *         when the upload response lands. Its busy mark follows `.u4`'s rule
 *         (`8e19043`, UIA-F-71 ⊕ F-238; re-baselined at X.F.W14V Repair 1,
 *         addendum (g) routing 1, §0bt): a FIRST upload's one mark is the
 *         stage's drop-target button (glass's dot ring) and the aside has no
 *         bar; a REPLACE upload's mark is the aside's "Uploading the image" bar.
 *   G-c2  `.c` r2: the leave path — an upload that fails clears the flight
 *         with no image; the sidebar is gone, and the chassis re-mounted from
 *         the not-found card opens no empty column.
 *   G-c4  `.c` r4: the PRM context reaches the page through the lawful
 *         spelling `contextOptions.reducedMotion` (a bare `reducedMotion` is
 *         not a Playwright test option, which is why F.W13 saw it not arrive).
 */

async function openPaper(page: Page): Promise<void> {
    await page.goto("/paper");
    await expect(page.locator(".paper-sidebar .toc-link").first()).toBeVisible({ timeout: 60_000 });
}

async function openEmpty(page: Page): Promise<void> {
    await page.goto("/visualize");
    await expect(page.locator(".drop-target")).toBeVisible({ timeout: 60_000 });
}

test.describe("F.W14.r — the desktop ToC (F.W13 `.a` residuals)", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("G-r1 — scroll-to-top is a glass Button beside the disclosure, and it acts", async ({ page }) => {
        await openPaper(page);
        const header = page.locator(".paper-sidebar .sidebar-header");
        const top = header.getByRole("button", { name: "Scroll to top" });
        const disclosure = header.getByRole("button", { name: "Contents" });
        await expect(top).toHaveCount(1);
        await expect(disclosure).toHaveCount(1);
        // The glass primitive, and a sibling of the disclosure — never its seat.
        await expect(top).toHaveAttribute("data-slot", "button");
        await expect(disclosure).toHaveAttribute("aria-expanded", "true");
        const sameGroup = await top.evaluate(
            (el, other) => el.parentElement === other?.parentElement && el !== other,
            await disclosure.elementHandle(),
        );
        expect(sameGroup).toBe(true);

        const scroller = page.locator(".paper-scroll");
        await scroller.evaluate((el) => el.scrollTo({ top: 6000, behavior: "instant" as ScrollBehavior }));
        await expect.poll(() => scroller.evaluate((el) => el.scrollTop)).toBeGreaterThan(1000);
        await top.click();
        await expect.poll(() => scroller.evaluate((el) => el.scrollTop), { timeout: 10_000 }).toBeLessThan(2);
        // It is not the disclosure: the contents stay open.
        await expect(disclosure).toHaveAttribute("aria-expanded", "true");
    });

    test("G-r2 — `.sidebar-link` corner is glass's row canon (`--radius-lg`)", async ({ page }) => {
        await openPaper(page);
        const read = await page.locator(".paper-sidebar .toc-link").first().evaluate((el) => {
            const probe = document.createElement("div");
            probe.style.borderRadius = "var(--radius-lg)";
            el.parentElement!.appendChild(probe);
            const canon = getComputedStyle(probe).borderTopLeftRadius;
            probe.remove();
            return { link: getComputedStyle(el).borderTopLeftRadius, canon };
        });
        expect(read.canon).not.toBe("0px");
        expect(read.link).toBe(read.canon);
    });
});

test.describe("F.W14.r — the image sidebar (F.W13 `.c` residuals)", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("G-c1 — the sidebar enters on the pick, while the upload is still in flight", async ({ page }) => {
        await openEmpty(page);
        let release!: () => void;
        const held = new Promise<void>((r) => (release = r));
        let seenUpload = false;
        await page.route("**/api/images", async (route) => {
            if (route.request().method() !== "POST") return route.fallback();
            seenUpload = true;
            await held;
            await route.fallback();
        });
        await page.getByTestId("image-file-input").setInputFiles(SAMPLE_IMAGE);
        await expect.poll(() => seenUpload).toBe(true);

        // The response has NOT landed: no image, no `/w/<slug>` yet.
        expect(page.url()).not.toMatch(/\/w\/[^/]+/);
        const side = page.locator(".viz-panel-left-wrap");
        const asideBar = side.getByRole("progressbar", { name: "Uploading the image" });
        await expect(side).toBeVisible();
        // First upload (`.u4` rule): the stage button is the one busy mark; no aside bar.
        await expect(page.locator(".drop-target-button [data-slot=dot-ring]")).toBeVisible();
        await expect(asideBar).toHaveCount(0);
        // The column opens on the panel spring; read it once the enter settles.
        await expect
            .poll(() => page.locator(".configurator-aside").evaluate((el) => el.getBoundingClientRect().width))
            .toBeGreaterThanOrEqual(300);
        expect(page.url()).not.toMatch(/\/w\/[^/]+/);

        release();
        await page.waitForURL(/\/w\//, { timeout: 20_000 });
        await expect(side).toBeVisible();
        await expect(asideBar).toHaveCount(0, { timeout: 30_000 });

        // Replace (`.u4` rule): the image is already here, so the aside's bar
        // is the upload's mark, and it leaves when the upload lands.
        let releaseReplace!: () => void;
        const heldReplace = new Promise<void>((r) => (releaseReplace = r));
        let seenReplace = false;
        await page.unroute("**/api/images");
        await page.route("**/api/images", async (route) => {
            if (route.request().method() !== "POST") return route.fallback();
            seenReplace = true;
            await heldReplace;
            await route.fallback();
        });
        await page.getByTestId("image-file-input").setInputFiles(SAMPLE_IMAGE);
        await expect.poll(() => seenReplace).toBe(true);
        await expect(asideBar).toBeVisible();
        releaseReplace();
        await expect(asideBar).toHaveCount(0, { timeout: 30_000 });
    });

    test("G-c2 — a failed upload is the leave path: no sidebar, and no empty column after", async ({ page }) => {
        await openEmpty(page);
        let release!: () => void;
        const held = new Promise<void>((r) => (release = r));
        await page.route("**/api/images", async (route) => {
            if (route.request().method() !== "POST") return route.fallback();
            await held;
            await route.fulfill({
                status: 500,
                contentType: "application/problem+json",
                body: JSON.stringify({ title: "Upload failed", status: 500, detail: "stubbed failure" }),
            });
        });
        await page.getByTestId("image-file-input").setInputFiles(SAMPLE_IMAGE);
        await expect(page.locator(".viz-panel-left-wrap")).toBeVisible();

        release();
        await expect(page.locator(".viz-panel-left-wrap")).toHaveCount(0, { timeout: 20_000 });
        // X.F.W14U.vstage (UIA-F-167): the failure is shown at the drop target,
        // not as a workspace not-found card.
        await expect(page.locator(".drop-target").getByRole("alert")).toBeVisible({ timeout: 20_000 });
        await expect(page.locator(".viz-panel-left-wrap")).toHaveCount(0);
        const band = await page.locator(".configurator-aside").evaluate((el) => el.getBoundingClientRect().width);
        expect(band).toBe(0);
    });
});

test.describe("F.W14.r — PRM reaches the page (F.W13 `.c` r4)", () => {
    test.use({ viewport: { width: 1440, height: 900 }, contextOptions: { reducedMotion: "reduce" } });

    test("G-c4 — `contextOptions.reducedMotion` is in force on the page", async ({ page }) => {
        await openEmpty(page);
        expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
    });
});
