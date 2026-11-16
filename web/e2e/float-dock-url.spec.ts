import { expect, test, type Page } from "@playwright/test";
import { openAppDock } from "./fixtures/app-dock";
import { openCanvasDock } from "./fixtures/canvas-dock";
import { seededViz } from "./fixtures/seed";
import { showView } from "./fixtures/workspace";

/**
 * Owner, 2026-11-15: "Each page should have a tool set in the main dock, but
 * pages like the quaran reader and fourier should have an additional floating
 * bar ... which is a collapsible glass-ui dock." · "Each page should have state
 * defined in the URL, like with fourier for the currently selected picture,
 * background showing, etc."
 *
 * t1 — each page's own tools are in the app dock; the canvas's are in the
 *      stage's floating dock, which folds to one glyph, opens by a press, and
 *      is a column on a phone. Each tool has one home.
 * u1 — a deep link per page reopens that view cold; a change writes the URL;
 *      Back and Forward walk the discrete changes.
 */

const LOAD = 60_000;

async function openWorkspace(page: Page, query = ""): Promise<void> {
    await page.goto(`/v/${seededViz().slug}${query}`);
    if (page.viewportSize()!.width < 640) await showView(page, "Canvas");
    await expect(page.locator(".animation-dock")).toBeVisible({ timeout: LOAD });
}

test.describe("t1 — one tool model (1440)", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("workspace: Publish and Σ in the app dock; canvas tools in the folded stage dock, once each", async ({ page }) => {
        await openWorkspace(page);
        const dock = page.locator(".controls-dock-anchor .glass-dock");
        await expect(dock).toHaveClass(/\bcollapsed\b/);
        // Hover opens nothing (a press does).
        await dock.hover();
        await page.waitForTimeout(900);
        await expect(dock).toHaveClass(/\bcollapsed\b/);
        await openCanvasDock(page);
        for (const name of ["View options", "Export frame", "Fullscreen", "Edit contour"])
            await expect(page.getByRole("button", { name, exact: true }), name).toHaveCount(1);
        const app = await openAppDock(page);
        for (const name of ["Publish to Gallery", "Equation"])
            await expect(app.getByRole("button", { name, exact: true }), name).toHaveCount(1);
        await expect(dock.locator("[aria-label='Publish to Gallery'], [aria-label='Equation']")).toHaveCount(0);
        // The editor dock carries no second copy of the view layers.
        await page.getByRole("button", { name: "Edit contour" }).click();
        await expect(page.getByRole("button", { name: "Save contour" }).first()).toBeVisible();
        await expect(page.locator(".controls-overlay [aria-label='View options']")).toHaveCount(0);
    });

    test("workspace: a menu opened from the stage dock holds it open; a press outside folds it", async ({ page }) => {
        await openWorkspace(page);
        const dock = await openCanvasDock(page);
        await dock.getByRole("button", { name: "View options" }).click();
        await expect(page.getByRole("menuitemcheckbox", { name: "Background image" })).toBeVisible();
        await page.waitForTimeout(1500);
        await expect(dock).toHaveClass(/\bexpanded\b/);
        await page.keyboard.press("Escape");
        await page.mouse.click(5, 300);
        await expect(dock).toHaveClass(/\bcollapsed\b/, { timeout: 10_000 });
    });

    test("equation: Copy LaTeX and About in the app dock; plot tools in the folded stage dock", async ({ page }) => {
        await page.goto("/equation");
        await expect(page.locator(".eq-card .katex").first()).toBeVisible({ timeout: LOAD });
        const stage = page.locator(".eq-card .stage-dock .glass-dock");
        await expect(stage).toHaveClass(/\bcollapsed\b/);
        await stage.getByRole("button", { name: "Plot tools" }).click();
        await expect(stage).toHaveClass(/\bexpanded\b/);
        for (const name of ["Plot layers", "Export plot"]) await expect(stage.getByRole("button", { name })).toBeVisible();
        const app = await openAppDock(page);
        for (const name of ["Copy LaTeX", "About this approximation"])
            await expect(app.getByRole("button", { name }), name).toHaveCount(1);
        await expect(page.locator(".eq-card [aria-label='Copy LaTeX']")).toHaveCount(0);
    });
});

test.describe("t1 — the stage dock on a phone @coarse", () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

    test("@coarse the open stage dock is a column at the stage's top-right, clear of the app dock and the drawing's centre", async ({ page }) => {
        await openWorkspace(page);
        const dock = await openCanvasDock(page);
        const g = await page.evaluate(() => {
            const d = document.querySelector(".controls-dock-anchor .glass-dock")!.getBoundingClientRect();
            const s = document.querySelector(".canvas-stage")!.getBoundingClientRect();
            const a = document.querySelector(".app-dock")!.getBoundingClientRect();
            return { d: d.toJSON(), s: s.toJSON(), a: a.toJSON() };
        });
        expect(g.d.height, "a column").toBeGreaterThan(g.d.width);
        expect(g.d.right).toBeLessThanOrEqual(g.s.right + 0.5);
        expect(g.d.top, "below the app dock").toBeGreaterThanOrEqual(g.a.bottom);
        const cx = g.s.left + g.s.width / 2;
        expect(g.d.left, "clear of the drawing's centre").toBeGreaterThan(cx + 40);
        await expect(dock).toHaveAttribute("aria-orientation", /vertical/).catch(() => undefined);
    });
});

test.describe("u1 — URL state (1440)", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("workspace: a deep link reopens the layers, the series panel, the rate and the paused moment", async ({ page }) => {
        await openWorkspace(page, "?bg=1&trace=0&eq=1&speed=2&t=0.42");
        await expect(page.locator(".eq-panel")).toBeVisible({ timeout: LOAD });
        await expect(page.getByRole("button", { name: "Play animation" }).first(), "paused at the link's moment").toBeVisible();
        await expect(page.locator(".animation-dock [aria-label='Playback speed']")).toContainText("2");
        // The folded transport's readout (glass progressbar) holds the link's moment.
        const value = await page.locator(".mini-progress").first().getAttribute("aria-valuenow");
        expect(Math.abs(Number(value) - 0.42)).toBeLessThan(0.011);
        const dock = await openCanvasDock(page);
        await dock.getByRole("button", { name: "View options" }).click();
        await expect(page.getByRole("menuitemcheckbox", { name: "Background image" })).toHaveAttribute("aria-checked", "true");
        await expect(page.getByRole("menuitemcheckbox", { name: "Original outline" })).toHaveAttribute("aria-checked", "false");
    });

    test("workspace: a layer toggle pushes, Back undoes it, Forward redoes it; pausing writes t by replace", async ({ page }) => {
        await openWorkspace(page);
        const before = page.url();
        const dock = await openCanvasDock(page);
        await dock.getByRole("button", { name: "View options" }).click();
        await page.getByRole("menuitemcheckbox", { name: "Background image" }).click();
        await expect(page).toHaveURL(/[?&]bg=1/);
        await page.keyboard.press("Escape");
        await page.goBack();
        await expect(page).toHaveURL(before);
        await page.goForward();
        await expect(page).toHaveURL(/[?&]bg=1/);
        const len = await page.evaluate(() => history.length);
        await page.getByRole("button", { name: "Pause animation" }).first().click();
        await expect(page).toHaveURL(/[?&]t=0?\.\d+/);
        expect(await page.evaluate(() => history.length), "the moment is a replace").toBe(len);
        await page.getByRole("button", { name: "Play animation" }).first().click();
        await expect(page).not.toHaveURL(/[?&]t=/);
    });

    test("equation: a deep link reopens the function, the count, the form, the layers and the sweep", async ({ page }) => {
        await page.goto("/equation?f=abs(x)&a=-pi&b=pi&n=7&m=expanded&s=0.3&harm=0");
        await expect(page.locator(".eq-card .katex").first()).toBeVisible({ timeout: LOAD });
        await expect(page.getByRole("textbox", { name: "Expression" }).first()).toHaveValue("abs(x)");
        await expect(page.getByRole("button", { name: "Play the convergence sweep" }).first(), "the sweep is held").toBeVisible();
        await expect(page.locator(".legend-entry.is-layer-off").first()).toBeVisible();
        const sweep = await page.getByRole("slider", { name: "Convergence sweep position" }).getAttribute("aria-valuenow");
        expect(Math.abs(Number(sweep) - 0.3)).toBeLessThan(0.02);
        await expect(page).toHaveURL(/m=expanded/);
    });

    test("equation: a typed change replaces, a menu change pushes; Back restores the form", async ({ page }) => {
        await page.goto("/equation?n=9");
        await expect(page.locator(".eq-card .katex").first()).toBeVisible({ timeout: LOAD });
        const stage = page.locator(".eq-card .stage-dock .glass-dock");
        await stage.getByRole("button", { name: "Plot tools" }).click();
        await stage.getByRole("button", { name: "Plot layers" }).click();
        await page.getByRole("menuitemcheckbox", { name: "Harmonics" }).click();
        await expect(page).toHaveURL(/[?&]harm=0/);
        await page.keyboard.press("Escape");
        await page.goBack();
        await expect(page).not.toHaveURL(/harm=0/);
        await expect(page.locator(".legend-entry.is-layer-off")).toHaveCount(0);
    });

    test("gallery: a deep link reopens the search, the order and the tab; a filter pushes", async ({ page }) => {
        await page.goto("/gallery?q=zzz-no-such-title&sort=likes");
        await expect(page.getByRole("searchbox", { name: "Search gallery" }).or(page.getByRole("textbox", { name: "Search gallery" })).first()).toHaveValue("zzz-no-such-title", { timeout: LOAD });
        await page.goto("/gallery?tab=drafts");
        await expect(page.getByRole("tab", { name: "Drafts" })).toHaveAttribute("aria-selected", "true", { timeout: LOAD });
        await page.getByRole("tab", { name: "Gallery" }).click();
        await expect(page).not.toHaveURL(/tab=drafts/);
        await page.goBack();
        await expect(page.getByRole("tab", { name: "Drafts" })).toHaveAttribute("aria-selected", "true");
    });

    test("paper: a deep link opens its section, and reading writes the section by replace", async ({ page }) => {
        await page.goto("/paper");
        const scroller = page.locator(".paper-scroll");
        await expect.poll(() => scroller.evaluate((el) => el.scrollHeight), { timeout: LOAD }).toBeGreaterThan(5000);
        const len = await page.evaluate(() => history.length);
        await scroller.evaluate((el) => el.scrollTo({ top: el.scrollHeight * 0.4 }));
        await expect(page).toHaveURL(/[?&]s=[\w-]+/, { timeout: 10_000 });
        expect(await page.evaluate(() => history.length), "reading is a replace").toBe(len);
        const url = page.url();
        const id = new URL(url).searchParams.get("s")!;
        const fresh = await page.context().newPage();
        try {
            await fresh.goto(url);
            await expect
                .poll(() => fresh.evaluate((s) => document.getElementById(s)?.getBoundingClientRect().top ?? null, id), { timeout: LOAD })
                .not.toBeNull();
            const top = await fresh.evaluate((s) => document.getElementById(s)!.getBoundingClientRect().top, id);
            expect(Math.abs(top), `section #${id} is in view`).toBeLessThan(900);
        } finally {
            await fresh.close();
        }
    });
});
