import { expect, test, type Locator, type Page } from "@playwright/test";
import { openAppDock } from "./fixtures/app-dock";
import { openCanvasDock } from "./fixtures/canvas-dock";
import { seededViz } from "./fixtures/seed";
import { showView } from "./fixtures/workspace";

/**
 * menu-glyphs (owner, 12 Nov: icons with labelled menu items): every item of
 * a menu carries its own glyph beside its label — the sections menu on every
 * route (with the page's tools under 40rem), and the View options and Plot
 * layers menus.
 */

const LOAD = 60_000;
const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } as const;

async function openWorkspace(page: Page, query = ""): Promise<void> {
    await page.goto(`/v/${seededViz().slug}${query}`);
    if (page.viewportSize()!.width < 640) await showView(page, "Canvas");
    await expect(page.locator(".animation-dock")).toBeVisible({ timeout: LOAD });
}

/** The text of every item in `menu` that has no glyph of its own beside its label. */
function itemsWithoutGlyph(menu: Locator): Promise<string[]> {
    return menu.evaluate((m) =>
        [...m.querySelectorAll("[role=menuitem], [role=menuitemcheckbox], [role=menuitemradio]")]
            .filter((item) => {
                const glyph = item.querySelector(":scope > svg");
                const r = glyph?.getBoundingClientRect();
                return !r || r.width < 8 || r.height < 8;
            })
            .map((item) => item.textContent?.trim() ?? ""),
    );
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

for (const vp of [
    { tag: "1440", use: { viewport: { width: 1440, height: 900 } } },
    { tag: "390 @coarse", use: PHONE },
] as const) {
    const coarse = vp.tag.includes("@coarse") ? "@coarse " : "";

    test.describe(`i1 — every menu item carries its glyph (${vp.tag})`, () => {
        test.use(vp.use);

        for (const route of ["/paper", "/w", "/gallery", "/equation", "/morph"]) {
            test(`${coarse}the sections menu on ${route}`, async ({ page }) => {
                await page.goto(route);
                const menu = await openSections(page);
                expect(await itemsWithoutGlyph(menu)).toEqual([]);
            });
        }

        test(`${coarse}the sections menu on a saved visualization: the five places`, async ({ page }) => {
            await openWorkspace(page);
            const menu = await openSections(page);
            await expect(menu.getByRole("menuitem")).toHaveCount(5);
            expect(await itemsWithoutGlyph(menu)).toEqual([]);
        });

        test(`${coarse}the stage dock's menus`, async ({ page }) => {
            await openWorkspace(page);
            const dock = await openCanvasDock(page);
            // A phone's More holds the layers and the page's acts, each row with its glyph.
            if (page.viewportSize()!.width < 640) {
                await dock.getByRole("button", { name: "Layers and more" }).click();
                const more = page.getByRole("menu");
                await expect(more.getByRole("menuitemcheckbox", { name: "Line" })).toBeVisible();
                await page.waitForTimeout(400);
                expect(await itemsWithoutGlyph(more)).toEqual([]);
                await page.keyboard.press("Escape");
                await expect(more).toBeHidden();
            }
            await dock.getByRole("button", { name: "Easing" }).click();
            const menu = page.getByRole("menu");
            await expect(menu).toBeVisible();
            await page.waitForTimeout(400);
            expect(await itemsWithoutGlyph(menu)).toEqual([]);
        });

        test(`${coarse}the Plot layers menu`, async ({ page }) => {
            await page.goto("/equation");
            await expect(page.locator(".eq-card .katex").first()).toBeVisible({ timeout: LOAD });
            const stage = page.locator(".eq-card .stage-dock .glass-dock");
            await stage.getByRole("button", { name: "Plot tools" }).click();
            await expect(stage).toHaveClass(/\bexpanded\b/);
            await stage.getByRole("button", { name: "Plot layers" }).click();
            const menu = page.getByRole("menu");
            await expect(menu.getByRole("menuitemcheckbox", { name: "Harmonics" })).toBeVisible();
            await page.waitForTimeout(400);
            expect(await itemsWithoutGlyph(menu)).toEqual([]);
        });
    });
}
