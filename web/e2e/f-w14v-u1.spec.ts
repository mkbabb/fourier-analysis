import { expect, test, type Locator, type Page } from "@playwright/test";
import { clickCanvasDockExport, openCanvasDock, pressStageTool } from "./fixtures/canvas-dock";
import { seededViz } from "./fixtures/seed";
import { showView } from "./fixtures/workspace";
import { editorReady } from "./fixtures/editor";

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
    if (page.viewportSize()!.width < 640) await showView(page, "Canvas");
    await expect(page.locator(".animation-dock")).toBeVisible({ timeout: 30_000 });
}

/** Expand the canvas dock (the pointer rests on its persistent Edit control). */
/** Owner, 2026-11-15: the canvas dock opens by a press on its folded face. */
async function expandCanvasDock(page: Page, scope: Page | Locator = page): Promise<void> {
    await openCanvasDock(page, scope);
}

async function openFullscreen(page: Page): Promise<Locator> {
    // A seat of the open dock on a desk, a row of More on a phone (FORTY-FIRST H).
    await pressStageTool(page, "Fullscreen");
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
            // FORTY-FIRST L: while editing the stage has one dock, the editor's;
            // Fullscreen is a row of its tools menu.
            await page.locator(".controls-overlay").last().getByRole("button", { name: "More editor tools" }).click();
            await page.getByRole("menuitem", { name: "Fullscreen", exact: true }).click();
            const dialog = page.getByRole("dialog", { name: /fullscreen/i });
            await expect(dialog).toBeVisible();
            await page.waitForTimeout(900);
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
            // An edit made in the takeover: pick the point of the line nearest the
            // centre (read off the drawn line: only the handles near the pointer
            // are mounted) and delete it by key.
            await editorReady(page, ".fs-dialog .editor-shell:not(.is-hidden)");
            const pt = await page.evaluate(() => {
                const path = document.querySelector(".fs-dialog path.spline-path") as SVGPathElement;
                const m = path.getScreenCTM()!;
                const cx = innerWidth / 2;
                const cy = innerHeight / 2;
                const len = path.getTotalLength();
                let best = { x: 0, y: 0, d: Infinity };
                for (let i = 0; i < 400; i++) {
                    const p = path.getPointAtLength((i / 400) * len);
                    const x = p.x * m.a + p.y * m.c + m.e;
                    const y = p.x * m.b + p.y * m.d + m.f;
                    const d = Math.hypot(x - cx, y - cy);
                    if (d < best.d) best = { x, y, d };
                }
                return best;
            });
            await expect(dialog.locator("[aria-label='Undo']")).toBeDisabled();
            await page.mouse.click(pt.x, pt.y);
            await page.keyboard.press("Delete");
            await expect(dialog.locator("[aria-label='Undo']")).toBeEnabled();
            // Leave through the dock's own Exit (the Fullscreen row, turned).
            await dialog.locator(".controls-overlay").getByRole("button", { name: "More editor tools" }).click();
            await page.getByRole("menuitem", { name: "Exit fullscreen" }).click();
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
            const dock = dialog.locator(".controls-overlay .glass-dock");
            await expect(dock).toHaveCount(1);
            // Owner, 2026-11-15: the series panel is the page's tool, in the app
            // dock. Owner, 2026-11-16: the takeover covers the app dock, so there the
            // page's tools (Publish, Series, Copy link) are this dock's too: seats
            // outside its fold on a desk, rows of its More on a phone (FORTY-FIRST H),
            // with Export frame and Exit fullscreen.
            const phone = page.viewportSize()!.width < 640;
            await expect(dock.locator("[aria-label='Picture']"), "Picture").toHaveCount(1);
            if (!phone) {
                for (const name of ["Export frame", "Exit fullscreen"]) {
                    await expect(dock.locator(`[aria-label='${name}']`), name).toHaveCount(1);
                }
                for (const name of ["Series", "Publish to Gallery", "Copy link"]) {
                    await expect(dock.locator(`[aria-label='${name}']`), name).toBeVisible();
                }
                await expandCanvasDock(page, dialog);
                await dock.locator("[aria-label='Exit fullscreen']").click();
            } else {
                await dock.getByRole("button", { name: "Layers and more" }).click();
                const menu = page.getByRole("menu");
                for (const name of ["Series", "Publish to Gallery", "Copy link", "Export frame", "Exit fullscreen"]) {
                    await expect(menu.getByRole("menuitem", { name, exact: true }), name).toBeVisible();
                }
                await menu.getByRole("menuitem", { name: "Exit fullscreen", exact: true }).click();
            }
            await expect(dialog).toBeHidden({ timeout: 10_000 });
            await expect(page.locator(".canvas-stage canvas.canvas-el")).toHaveCount(1);
            // A second takeover hosts the same stage again (the host is a new element).
            await openFullscreen(page);
            expect(await stageCensus(page)).toMatchObject({ canvases: 1, canvasesInTakeover: 1 });
            // Nothing the takeover hosts is hidden from assistive technology.
            if (!phone) await expect(dialog.getByRole("button", { name: "Exit fullscreen" })).toHaveCount(1);
            else await expect(dialog.getByRole("button", { name: "Layers and more" })).toHaveCount(1);
        });
    });
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
        // X.F.W14V Repair 2 (C2R1-1): every Export-frame entry opens from a
        // settled dock (`fixtures/canvas-dock.ts`).
        await clickCanvasDockExport(page);
        const exp = page.getByRole("dialog", { name: "Export Frame" });
        await expect(exp).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(exp).toBeHidden();
        // In fullscreen the same dock's Export opens the same dialog.
        const fs = await openFullscreen(page);
        await clickCanvasDockExport(page, fs);
        await expect(page.getByRole("dialog", { name: "Export Frame" })).toBeVisible();
        await frame(page, "u182-fs-export");
    });

    // FORTY-FIRST Q (one home per layer): Picture and Outline are seats of the
    // stage's one dock; while editing, the editor's dock carries the same two
    // (the stage dock leaves with the transport), and its More holds no view rows.
    test("u79 — the layers are seats, on the stage dock and the editor's: the same two, editing or not", async ({ page }) => {
        await openViz(page);
        const stage = page.locator(".controls-overlay .glass-dock");
        for (const name of ["Picture", "Outline"]) await expect(stage.getByRole("button", { name, exact: true })).toBeVisible();
        await frame(page, "u79-view-menu");
        await page.getByRole("button", { name: "Edit contour" }).first().click();
        await page.getByRole("button", { name: "Save contour" }).first().hover();
        await page.waitForTimeout(700);
        const editor = page.locator(".controls-overlay .glass-dock");
        for (const name of ["Picture", "Outline"]) {
            await expect(editor.getByRole("button", { name, exact: true }), `${name} while editing`).toHaveCount(1);
        }
        await frame(page, "u79-edit-menu");
        await page.getByRole("button", { name: "More editor tools" }).click();
        await expect(page.getByRole("menu")).toBeVisible();
        await expect(page.getByRole("menu").getByRole("menuitemcheckbox"), "no view rows in More tools").toHaveCount(0);
    });

    test("u173 — a layer's state is its own seat's (pressed), with no dot beside it", async ({ page }) => {
        await openViz(page);
        const dock = page.locator(".controls-overlay .glass-dock");
        const outline = dock.getByRole("button", { name: "Outline", exact: true });
        await expect(outline).toHaveAttribute("aria-pressed", "false");
        await outline.click();
        await expect(outline).toHaveAttribute("aria-pressed", "true");
        await expect(page.locator(".canvas-stage .status-dot, .canvas-stage .view-dot"), "no StatusDot on the stage").toHaveCount(0);
        await frame(page, "u173-trace-off");
    });

});
