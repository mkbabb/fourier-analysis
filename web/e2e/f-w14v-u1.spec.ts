import { expect, test, type Locator, type Page } from "@playwright/test";
import { seededViz } from "./fixtures/seed";

/**
 * X.F.W14V `.u1` — the stage and its docks (F-W14V.md addendum (c) ⊕
 * F-W14U.md addendum (h): `.vdock` E-1..E-4, `.vedit` E-2).
 *
 * u14  UIA-F-14 ⊕ F-93 ⊕ F-244 — the ONE live stage moves into the fullscreen
 *      takeover: the document holds exactly one BasisCanvas canvas and one
 *      ContourEditorCanvas surface, both inside the takeover; the editor's
 *      dock is there; an edit made in fullscreen is still there after exit;
 *      the canvas dock (View options, Equation) is hosted in the takeover, and
 *      its Fullscreen control becomes the Exit (no free-floating Button).
 * u182 UIA-F-182 — one Export, on the canvas dock, always through the dialog
 *      (inline and in fullscreen); the playback ⋮ menu holds no Export.
 * u79  UIA-F-79 ⊕ F-77 (consumer) — one View options menu (a DropdownMenu of
 *      labelled CheckboxItems) on both docks: the same name, rows and order;
 *      the editor's More-tools menu holds no view-layer rows.
 * u173 UIA-F-173 — the view mark shows only an off-default state, as glass's
 *      StatusDot, on its own control (and on the collapsed face).
 *
 * Served from :3100 (BASE_URL) against the API on :8000; data = the e2e global
 * seed. `FW14V_PHASE` names the frames (before/after).
 */

const PHASE = process.env.FW14V_PHASE ?? "after";
const FRAMES = "e2e/screenshots/f-w14v/u1";

async function frame(page: Page, name: string): Promise<void> {
    const w = page.viewportSize()!.width;
    await page.screenshot({ path: `${FRAMES}/${PHASE}-${name}-${w}.png` });
}

async function openViz(page: Page): Promise<void> {
    await page.goto(`/v/${seededViz().slug}`);
    if (page.viewportSize()!.width < 640) await page.getByRole("tab", { name: "Canvas" }).click();
    await expect(page.locator(".animation-dock")).toBeVisible({ timeout: 30_000 });
}

/** Expand the canvas dock (the pointer rests on its persistent Edit control). */
async function expandCanvasDock(page: Page): Promise<void> {
    await page.getByRole("button", { name: "Edit contour" }).first().hover();
    await page.waitForTimeout(700);
}

async function openFullscreen(page: Page): Promise<Locator> {
    await expandCanvasDock(page);
    await page.locator(".controls-dock-anchor [aria-label='Fullscreen']").first().click();
    const dialog = page.getByRole("dialog", { name: /fullscreen/i });
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(900);
    return dialog;
}

/** Where the stage's two live surfaces are, counted over the whole document. */
async function stageCensus(page: Page) {
    return page.evaluate(() => {
        const dlg = document.querySelector("[role=dialog].fs-dialog");
        const canvases = [...document.querySelectorAll("canvas.canvas-el")];
        const editors = [...document.querySelectorAll(".editor-shell[tabindex]")];
        return {
            canvases: canvases.length,
            canvasesInTakeover: dlg ? canvases.filter((c) => dlg.contains(c)).length : 0,
            editors: editors.length,
            editorsInTakeover: dlg ? editors.filter((e) => dlg.contains(e)).length : 0,
            freeExit: document.querySelectorAll(".fs-close").length,
        };
    });
}

const WIDTHS = [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
];

for (const vp of WIDTHS) {
    test.describe(`F.W14V.u1 — the one live stage in the takeover (${vp.width})`, () => {
        test.use({ viewport: vp });
        test.setTimeout(120_000);

        test("u14 — fullscreen editing hosts the single live editor with its dock; the edit survives exit", async ({
            page,
        }) => {
            await openViz(page);
            await expandCanvasDock(page);
            await page.getByRole("button", { name: "Edit contour" }).first().click();
            await expect(page.getByRole("button", { name: "Save contour" }).first()).toBeVisible();
            const dialog = await openFullscreen(page);
            await frame(page, "u14-fs-editing");
            const census = await stageCensus(page);
            test.info().annotations.push({ type: "u14-census", description: JSON.stringify(census) });
            expect(census, "one BasisCanvas and one editor, both inside the takeover").toEqual({
                canvases: 1,
                canvasesInTakeover: 1,
                editors: 1,
                editorsInTakeover: 1,
                freeExit: 0,
            });
            // The editor's own dock rides with it.
            await expect(dialog.getByRole("button", { name: "Save contour" })).toBeVisible();
            // An edit made in the takeover: pick the point nearest the centre and
            // delete it by key (menus opened inside the takeover still sit under
            // the dialog until glass 10.2.0, UIA-F-13 / O-78, so no menu is used).
            const pt = await page.evaluate(() => {
                const cx = innerWidth / 2;
                const cy = innerHeight / 2;
                let best = { x: 0, y: 0, d: Infinity };
                for (const c of document.querySelectorAll(".fs-dialog .control-point")) {
                    const r = c.getBoundingClientRect();
                    const x = r.left + r.width / 2;
                    const y = r.top + r.height / 2;
                    const d = Math.hypot(x - cx, y - cy);
                    if (d < best.d) best = { x, y, d };
                }
                return best;
            });
            await expect(dialog.locator("[aria-label='Undo']")).toBeDisabled();
            await page.mouse.click(pt.x, pt.y);
            await page.keyboard.press("Delete");
            await expect(dialog.locator("[aria-label='Undo']")).toBeEnabled();
            // Leave through the dock's own Exit (the Fullscreen control, turned).
            await dialog.locator(".controls-dock-anchor [aria-label='Edit contour']").hover();
            await page.waitForTimeout(700);
            await dialog.locator(".controls-dock-anchor [aria-label='Exit fullscreen']").click();
            await expect(dialog).toBeHidden({ timeout: 10_000 });
            // The same editor, back on the page, still holds the step.
            await expect(page.locator(".controls-overlay [aria-label='Undo']")).toBeEnabled();
            expect((await stageCensus(page)).editors).toBe(1);
        });

        test("u93 — fullscreen hosts the canvas dock; its Fullscreen control is the Exit", async ({ page }) => {
            await openViz(page);
            const dialog = await openFullscreen(page);
            const census = await stageCensus(page);
            test.info().annotations.push({ type: "u93-census", description: JSON.stringify(census) });
            expect(census.canvases, "one BasisCanvas in the document").toBe(1);
            expect(census.canvasesInTakeover).toBe(1);
            expect(census.freeExit, "no free-floating Exit button").toBe(0);
            const dock = dialog.locator(".controls-dock-anchor .glass-dock");
            await expect(dock).toHaveCount(1);
            for (const name of ["View options", "Equation", "Export frame", "Exit fullscreen"]) {
                await expect(dock.locator(`[aria-label='${name}']`), name).toHaveCount(1);
            }
            await dialog.locator(".controls-dock-anchor [aria-label='Edit contour']").hover();
            await page.waitForTimeout(700);
            await dock.locator("[aria-label='Exit fullscreen']").click();
            await expect(dialog).toBeHidden({ timeout: 10_000 });
            await expect(page.locator(".canvas-stage canvas.canvas-el")).toHaveCount(1);
            // A second takeover hosts the same stage again (the host is a new element).
            await openFullscreen(page);
            expect(await stageCensus(page)).toMatchObject({ canvases: 1, canvasesInTakeover: 1 });
            // Nothing the takeover hosts is hidden from assistive technology.
            await expect(dialog.getByRole("button", { name: "Exit fullscreen" })).toHaveCount(1);
        });
    });
}

async function menuRows(page: Page): Promise<string[]> {
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    return menu.getByRole("menuitemcheckbox").allTextContents().then((t) => t.map((s) => s.trim()));
}

test.describe("F.W14V.u1 — the canvas dock's controls (1440)", () => {
    test.use({ viewport: { width: 1440, height: 900 } });
    test.setTimeout(120_000);

    test("u182 — one Export, on the canvas dock, always through the dialog", async ({ page }) => {
        await openViz(page);
        // The playback ⋮ menu holds no Export.
        await page.getByRole("button", { name: /(Play|Pause) animation/ }).first().hover();
        await page.waitForTimeout(800);
        const more = page.locator(".animation-dock [aria-label='More options']");
        if (await more.count()) {
            await more.first().click();
            await expect(page.getByRole("menu")).toBeVisible();
            await expect(page.getByRole("menu").getByRole("menuitem", { name: /export/i })).toHaveCount(0);
            await page.keyboard.press("Escape");
        }
        await expandCanvasDock(page);
        await page.locator(".controls-dock-anchor [aria-label='Export frame']").click();
        const exp = page.getByRole("dialog", { name: "Export Frame" });
        await expect(exp).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(exp).toBeHidden();
        // In fullscreen the same dock's Export opens the same dialog.
        const fs = await openFullscreen(page);
        await fs.locator(".controls-dock-anchor [aria-label='Edit contour']").hover();
        await page.waitForTimeout(700);
        await fs.locator(".controls-dock-anchor [aria-label='Export frame']").click();
        await expect(page.getByRole("dialog", { name: "Export Frame" })).toBeVisible();
        await frame(page, "u182-fs-export");
    });

    test("u79 — one View options menu on both docks: the same rows, the same order", async ({ page }) => {
        await openViz(page);
        await expandCanvasDock(page);
        await page.locator(".controls-dock-anchor [aria-label='View options']").click();
        const viewRows = await menuRows(page);
        await frame(page, "u79-view-menu");
        await page.keyboard.press("Escape");
        expect(viewRows).toEqual(["Image overlay", "Contour trace"]);
        await page.getByRole("button", { name: "Edit contour" }).first().click();
        await page.getByRole("button", { name: "Save contour" }).first().hover();
        await page.waitForTimeout(700);
        await page.locator(".controls-overlay [aria-label='View options']").click();
        const editRows = await menuRows(page);
        await frame(page, "u79-edit-menu");
        await page.keyboard.press("Escape");
        expect(editRows, "the editor dock mounts the same menu").toEqual(viewRows);
        await page.getByRole("button", { name: "Save contour" }).first().hover();
        await page.waitForTimeout(500);
        await page.getByRole("button", { name: "More editor tools" }).click();
        await expect(page.getByRole("menu")).toBeVisible();
        await expect(page.getByRole("menu").getByRole("menuitemcheckbox"), "no view rows in More tools").toHaveCount(0);
    });

    test("u173 — the view mark shows only off-default, as glass's StatusDot, on its own control", async ({ page }) => {
        await openViz(page);
        const dock = page.locator(".controls-dock-anchor .glass-dock");
        await expandCanvasDock(page);
        await expect(dock.locator(".view-dot"), "no mark at the default view").toHaveCount(0);
        await page.locator(".controls-dock-anchor [aria-label='View options']").click();
        await page.getByRole("menuitemcheckbox", { name: "Contour trace" }).click();
        // Dismiss by pointer, outside (an Escape hands focus back to the trigger,
        // and a dock holding focus stays expanded, by glass's design).
        await page.mouse.click(5, 5);
        const trigger = dock.locator("[aria-label='View options']");
        await expect(trigger.locator(".status-dot.view-dot"), "the mark rides the View options control").toHaveCount(1);
        await page.mouse.move(5, 5);
        await expect(dock).toHaveClass(/\bcollapsed\b/, { timeout: 30_000 });
        await expect(dock.locator(".dock-layer--summary .status-dot.view-dot")).toHaveCount(1);
        await frame(page, "u173-trace-off");
    });
});
