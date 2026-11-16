import { expect, test, type Locator, type Page } from "@playwright/test";
import { openAppDock } from "./fixtures/app-dock";
import { openCanvasDock } from "./fixtures/canvas-dock";
import { seededViz } from "./fixtures/seed";
import { showView } from "./fixtures/workspace";

/**
 * escape-layers (owner, 16 Nov; production check P-2): one Escape closes one
 * surface, the topmost.
 *
 * e1 — with a menu open over the series panel, Escape closes the menu and
 *      leaves the panel and the URL as they were; a second Escape closes the
 *      panel and drops `eq`. At 1440 the menu is the stage dock's View
 *      options; at 390 it is the app dock's sections menu.
 * e2 — in the fullscreen takeover the panel is the topmost surface: Escape
 *      closes it and leaves the takeover open; a second Escape leaves it.
 */

const LOAD = 60_000;
const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } as const;

async function openWorkspace(page: Page, query = ""): Promise<void> {
    await page.goto(`/v/${seededViz().slug}${query}`);
    if (page.viewportSize()!.width < 640) await showView(page, "Canvas");
    await expect(page.locator(".animation-dock")).toBeVisible({ timeout: LOAD });
}

/** Escape twice over an open menu: the menu first, then the panel and `eq`. */
async function escapeMenuThenPanel(page: Page, menu: Locator): Promise<void> {
    const panel = page.locator(".eq-panel");
    const url = page.url();
    await page.keyboard.press("Escape");
    await expect(menu, "the first Escape closes the menu").toBeHidden();
    // Past every exit: the panel is still open and the URL is unchanged.
    await page.waitForTimeout(800);
    await expect(panel, "the first Escape leaves the panel open").toBeVisible();
    expect(page.url(), "the first Escape leaves the URL alone").toBe(url);
    await page.keyboard.press("Escape");
    await expect(panel, "the second Escape closes the panel").toHaveCount(0);
    await expect(page).not.toHaveURL(/[?&]eq=1/);
}

/** Open the app dock's sections menu and return it once its items are laid out. */
async function openSections(page: Page): Promise<Locator> {
    const dock = await openAppDock(page);
    await dock.getByRole("button", { name: /^Navigate/ }).click();
    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitem", { name: "Paper" })).toBeVisible();
    await page.waitForTimeout(400);
    return menu;
}

test.describe("e1 — Escape over the series panel (1440)", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("a menu open over the panel: Escape closes the menu only; a second closes the panel and drops eq", async ({ page }) => {
        await openWorkspace(page, "?eq=1");
        await expect(page.locator(".eq-panel")).toBeVisible({ timeout: LOAD });
        const dock = await openCanvasDock(page);
        await dock.getByRole("button", { name: "View options" }).click();
        const menu = page.getByRole("menu");
        await expect(menu.getByRole("menuitemcheckbox", { name: "Background image" })).toBeVisible();
        await escapeMenuThenPanel(page, menu);
    });
});

test.describe("e1 — Escape over the series panel on a phone @coarse", () => {
    test.use(PHONE);

    test("@coarse the sections menu open over the panel: Escape closes the menu only; a second closes the panel and drops eq", async ({ page }) => {
        await openWorkspace(page, "?eq=1");
        await expect(page.locator(".eq-panel")).toBeVisible({ timeout: LOAD });
        const menu = await openSections(page);
        await escapeMenuThenPanel(page, menu);
    });
});

test.describe("e2 — Escape in the fullscreen takeover (1440)", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("the panel is the takeover's topmost surface: Escape closes it and keeps fullscreen; a second leaves", async ({ page }) => {
        await openWorkspace(page, "?eq=1");
        const dock = await openCanvasDock(page);
        await dock.getByRole("button", { name: "Fullscreen", exact: true }).click();
        const takeover = page.getByRole("dialog", { name: /fullscreen/ });
        await expect(takeover).toBeVisible();
        await expect(takeover.locator(".eq-panel")).toBeVisible({ timeout: LOAD });
        await page.waitForTimeout(800);
        await page.keyboard.press("Escape");
        await expect(takeover.locator(".eq-panel"), "the first Escape closes the panel").toHaveCount(0);
        await expect(page).not.toHaveURL(/[?&]eq=1/);
        await page.waitForTimeout(800);
        await expect(takeover, "the first Escape leaves the takeover open").toBeVisible();
        await expect(page).toHaveURL(/[?&]fs=1/);
        await page.keyboard.press("Escape");
        await expect(takeover, "the second Escape leaves fullscreen").toHaveCount(0);
        await expect(page).not.toHaveURL(/[?&]fs=1/);
    });
});
