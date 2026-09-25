// SERVED MODEL: claude-opus-5-5
import { expect, test, type Locator, type Page } from "@playwright/test";
import { seededViz } from "./fixtures/seed";

/**
 * X.F.W14U.vedit — the contour editor and the equation panel (spec
 * `F-W14U.md` Units :8-18; register `audit/UI-AUDIT-fourier.md` sections
 * visualize-contour-editor and visualize-equation-panel). One case per cured
 * row (or per rows cured by one act); every case frames the served page under
 * `FW14U_PHASE` (before | after) in `e2e/screenshots/f-w14u/vedit/`.
 *
 * v86   UIA-F-86 — the editor's Contour trace acts on the editing surface.
 * v87   UIA-F-87 — handles are legible: at rest only the selection shows, the
 *       pointer reveals the handles near it, a press within the 24 px target
 *       floor picks the nearest point, and the selection wears a ring.
 * v88   UIA-F-88 — at 390 every tool of the expanded editor dock is reachable
 *       without a sideways scroll; the secondary tools sit in one menu.
 *       Restated at X.F.W14V.r1 (owner ruling, F-W14V addendum (h) 1): below
 *       sm the row is Undo · Redo · More editor tools; Delete (last, behind a
 *       separator) and View options (a submenu) live in that menu.
 * v89   UIA-F-89 — at 390, editing, the Controls tab gives the pane the height.
 * v83   UIA-F-83 (consumer) ⊕ F-176 — Terms 20 renders more than four terms,
 *       every term reachable through a visible fading scroller, with
 *       conventional signs (`e^{-it}`) and plain decimals.
 * v177  UIA-F-177 — the panel is a labelled non-modal dialog: its close is the
 *       glass icon rung, Escape dismisses from anywhere, a refetch keeps its
 *       size, and at 390 it clears the canvas dock.
 * v178  UIA-F-178 — the fit is a measurement: the Metric never paints the
 *       destructive ink, and the Terms track wears its owner's Fourier hue
 *       (F-W14U addendum (g), §0da), never the destructive ink.
 * v179  UIA-F-179 — keyboard focus on the editor surface is visible.
 * v180  UIA-F-180 — leaving with unsaved edits asks; Reset is undoable; the
 *       selection clears on exit.
 * v242  UIA-F-242 ⊕ F-172 (Magnet limb) — a neutral summary glyph, the point
 *       count as a glass Metric, a bare click writes no history; the tools'
 *       hover tints and the Magnet glyph's red are back (X.F.W14U.c2, §0db:
 *       "one hover tint" INVERTED), and the Magnet radius (in the menu)
 *       wears the contour's hue (addendum (g)).
 *
 * Data: the e2e global seed (`e2e/global-seed.ts`) for the saved
 * visualization. Nothing is saved to the server by any case.
 */

const PHASE = process.env.FW14U_PHASE ?? "after";
const FRAMES = "e2e/screenshots/f-w14u/vedit";

async function frame(page: Page, name: string): Promise<void> {
    const w = page.viewportSize()!.width;
    await page.screenshot({ path: `${FRAMES}/${PHASE}-${name}-${w}.png` });
}

/** Open the seeded visualization on its canvas. */
async function openViz(page: Page): Promise<void> {
    const viz = seededViz();
    await page.goto(`/v/${viz.slug}`);
    if (page.viewportSize()!.width < 1024) await page.getByRole("tab", { name: "Canvas" }).click();
    await expect(page.locator(".controls-dock-anchor")).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(600);
}

/** Enter contour-edit mode through the canvas dock. */
async function openEditor(page: Page): Promise<Locator> {
    await openViz(page);
    const edit = page.getByRole("button", { name: "Edit contour" }).first();
    await edit.hover();
    await page.waitForTimeout(600);
    await edit.click();
    const svg = page.locator(".canvas-stage > .editor-shell:not(.is-hidden) svg.editor-svg");
    await expect(svg).toBeVisible();
    await expect(page.locator("circle.control-point").nth(10)).toBeAttached();
    await page.waitForTimeout(400);
    return svg;
}

/** The screen position of contour point `i`. */
async function pointXY(page: Page, i: number): Promise<{ x: number; y: number }> {
    const box = (await page.locator("circle.control-point").nth(i).boundingBox())!;
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Press on point `i` and drag it a few pixels (a real edit). */
async function dragPoint(page: Page, i: number): Promise<void> {
    const { x, y } = await pointXY(page, i);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 14, y + 10, { steps: 4 });
    await page.mouse.up();
}

/** The editor dock (the only dock in `.controls-overlay` while editing). */
function editorDock(page: Page): Locator {
    return page.locator(".controls-overlay").last();
}

/** Expand the editor dock through its own disclosure. */
async function expandEditorDock(page: Page): Promise<void> {
    const dock = editorDock(page);
    const summary = dock.getByRole("button", { name: "Expand dock" });
    if (await summary.isVisible()) {
        await summary.click();
        await page.waitForTimeout(700);
    }
}

/** Reach the editor's Contour trace control, in whichever container holds it. */
async function traceControl(page: Page): Promise<Locator> {
    await expandEditorDock(page);
    const dock = editorDock(page);
    // X.F.W14V.u1 (UIA-F-79, §0bt): the view layers are the one View options menu
    // both docks mount (they left More editor tools).
    await dock.getByRole("button", { name: "View options" }).click();
    await page.waitForTimeout(400);
    return page.getByRole("menuitemcheckbox", { name: "Contour trace" })
        .or(page.getByRole("button", { name: "Contour trace" })).first();
}

/** The disabled state of a dock control, read off the element. */
function isDisabled(control: Locator): Promise<boolean> {
    return control.evaluate((el) => (el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true");
}

/** Open the equation panel through the canvas dock's Σ. */
async function openEquation(page: Page): Promise<Locator> {
    await openViz(page);
    // The canvas dock expands from its persistent control (UIA-F-5's path).
    await page.getByRole("button", { name: "Edit contour" }).first().hover();
    const eq = page.getByRole("button", { name: "Equation", exact: true }).first();
    await expect(eq).toBeVisible();
    await page.waitForTimeout(700);
    await eq.click();
    const panel = page.locator(".eq-panel");
    await expect(panel).toBeVisible();
    await expect(panel.locator(".eq-scroll-region .katex").first()).toBeVisible({ timeout: 30_000 });
    return panel;
}

test.describe("X.F.W14U.vedit — the contour editor", () => {
    test("v86 · UIA-F-86 — the editor's Contour trace acts on the editing surface", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        const svg = await openEditor(page);
        const traced = () => svg.locator(".reference-trace").count();
        const before = await traced();
        const control = await traceControl(page);
        await frame(page, "v86-trace-control");
        await control.click();
        await page.waitForTimeout(400);
        const after = await traced();
        expect(before + after, "one state draws the extraction's reference trace").toBe(1);
        expect(after, "toggling Contour trace changes the editing surface").not.toBe(before);
    });

    test("v87 · UIA-F-87 — handles are legible, targetable and the selection is found", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        const svg = await openEditor(page);
        const shown = () =>
            page.locator("circle.control-point").evaluateAll((cs) =>
                cs.filter((c) => Number(getComputedStyle(c).opacity) > 0.05).length,
            );
        // At rest (pointer away from the surface), the shape dominates.
        await page.mouse.move(2, 2);
        await page.waitForTimeout(300);
        await frame(page, "v87-rest");
        const atRest = await shown();
        expect(atRest, "at rest no mat of handles is painted").toBeLessThanOrEqual(1);

        // Near the pointer, the handles near it are shown at a legible size.
        const p = await pointXY(page, 40);
        await page.mouse.move(p.x, p.y, { steps: 3 });
        await page.waitForTimeout(300);
        await frame(page, "v87-near");
        const near = await shown();
        expect(near, "the pointer reveals the handles near it").toBeGreaterThan(0);
        expect(near, "…and only those").toBeLessThan(await page.locator("circle.control-point").count() / 4);
        const r = await page.locator("circle.control-point").nth(40).evaluate((c) => {
            const b = (c as SVGCircleElement).getBoundingClientRect();
            return b.width / 2;
        });
        expect(r, "a shown handle is at least 4 px in radius").toBeGreaterThanOrEqual(4);

        // A press 9 px from a point (inside the 24 px floor) picks that point.
        const q = await pointXY(page, 60);
        await page.mouse.move(q.x + 9, q.y);
        await page.mouse.down();
        await page.mouse.up();
        await page.waitForTimeout(200);
        const selected = svg.locator("circle.control-point.selected");
        await expect(selected, "a press within the target floor selects a point").toHaveCount(1);
        const ring = await selected.evaluate((c) => {
            const s = getComputedStyle(c);
            return { w: parseFloat(s.strokeWidth), stroke: s.stroke, fill: s.fill, op: Number(s.opacity) };
        });
        expect(ring.op, "the selected handle is painted").toBeGreaterThan(0.9);
        expect(ring.w, "the selection wears a ring").toBeGreaterThanOrEqual(2);
        expect(ring.stroke, "the ring is not the fill").not.toBe(ring.fill);
        await page.mouse.move(2, 2);
        await page.waitForTimeout(300);
        expect(await shown(), "the selection stays found when the pointer leaves").toBe(1);
        await frame(page, "v87-selected");
    });

    test("v88 · UIA-F-88 — at 390 every expanded editor tool is reachable", async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await openEditor(page);
        await expandEditorDock(page);
        await frame(page, "v88-dock-expanded");
        const dock = editorDock(page);
        const read = await dock.evaluate((root) => {
            const vw = window.innerWidth;
            const buttons = [...root.querySelectorAll<HTMLElement>("button[aria-label]")].filter((b) => {
                const s = getComputedStyle(b);
                const layer = b.closest("[inert]");
                return !layer && s.visibility !== "hidden" && b.getBoundingClientRect().width > 0;
            });
            const plate = (root.querySelector(".dock-plate") ?? root).getBoundingClientRect();
            const out = buttons.filter((b) => {
                const r = b.getBoundingClientRect();
                const inside = r.left >= Math.max(0, plate.left) - 0.5 && r.right <= Math.min(vw, plate.right) + 0.5;
                // An enabled control is hit-tested at its centre (a clipped or
                // scrolled-away control is not the element under its own
                // centre); a disabled one takes no pointer, so it is read by
                // its box inside the plate alone.
                const disabled = (b as HTMLButtonElement).disabled || b.getAttribute("aria-disabled") === "true";
                const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
                return !inside || (!disabled && !(hit && (hit === b || b.contains(hit))));
            });
            const scrollers = [...root.querySelectorAll<HTMLElement>("*")].filter(
                (e) => e.scrollWidth > e.clientWidth + 1 && /auto|scroll/.test(getComputedStyle(e).overflowX),
            );
            return { n: buttons.length, out: out.map((b) => b.getAttribute("aria-label")), scrollers: scrollers.length };
        });
        expect(read.out, "no expanded tool is clipped or off-screen").toEqual([]);
        expect(read.scrollers, "no unmarked sideways scroller").toBe(0);
        // X.F.W14V.r1 — NAMED OWNER-RULING RE-BASELINE (§0bt; F-W14V.md
        // addendum (h) item 1, COHESION §0eb): below sm the row's set moves
        // from Undo · Redo · Delete to Undo · Redo · More editor tools. Delete
        // and View options are no longer row controls; both are asserted
        // inside the menu below (Delete last behind a separator, View options
        // a submenu of the same rows). No limb is deleted: each moved control
        // is still asserted present and reachable.
        for (const name of ["Undo", "Redo", "More editor tools"])
            await expect(dock.getByRole("button", { name, exact: true })).toBeVisible();
        for (const name of ["Delete point", "View options"])
            await expect(dock.getByRole("button", { name, exact: true })).toHaveCount(0);
        // The rest are one menu away.
        await dock.getByRole("button", { name: "More editor tools" }).click();
        const menu = page.getByRole("menu");
        await expect(menu.getByRole("spinbutton", { name: /Magnet/ })).toBeVisible();
        for (const name of ["Smooth contour", "Simplify contour", "Reset to extraction", "View options", "Delete point"])
            await expect(menu.getByRole("menuitem", { name })).toBeVisible();
        // Delete is the menu's last item, behind a separator, in the rose tone.
        const order = await menu.first().evaluate((m) => {
            const kids = [...m.querySelectorAll<HTMLElement>('[role="menuitem"], [role="separator"]')];
            return kids.map((k) => (k.getAttribute("role") === "separator" ? "|" : (k.textContent ?? "").trim()));
        });
        expect(order.at(-1), "Delete point is the last item").toBe("Delete point");
        expect(order.at(-2), "a separator precedes Delete point").toBe("|");
        await expect(menu.getByRole("menuitem", { name: "Delete point" })).toHaveClass(/is-rose/);
        await frame(page, "v88-more-menu");
        // View options opens its submenu of the same view-layer rows.
        await menu.getByRole("menuitem", { name: "View options" }).click();
        for (const name of ["Image overlay", "Contour trace"])
            await expect(page.getByRole("menuitemcheckbox", { name })).toBeVisible();
        await frame(page, "v88-view-sub");
    });

    test("v89 · UIA-F-89 — at 390, editing, the Controls tab gives the pane the height", async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await openEditor(page);
        await page.getByRole("tab", { name: "Controls" }).click();
        await page.waitForTimeout(600);
        await frame(page, "v89-controls-tab");
        const read = await page.evaluate(() => {
            const stage = document.querySelector(".viz-configurator .configurator-stage") as HTMLElement;
            const pane = document.querySelector(".viz-panel-left-wrap") as HTMLElement;
            return { stageH: stage.getBoundingClientRect().height, paneTop: pane.getBoundingClientRect().top };
        });
        expect(read.stageH, "the inactive stage takes no height").toBeLessThanOrEqual(1);
        expect(read.paneTop, "the pane starts in the first screen").toBeLessThan(844 / 2);
    });

    test("v179 · UIA-F-179 — keyboard focus on the editor surface is visible", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await openEditor(page);
        const surface = page.locator(".canvas-stage > .editor-shell > .editor-shell");
        await surface.focus();
        // Focus by keyboard: a Tab away and a Shift+Tab back.
        await page.keyboard.press("Tab");
        await page.keyboard.press("Shift+Tab");
        await expect(surface).toBeFocused();
        await frame(page, "v179-focus");
        const ring = await surface.evaluate((el) => {
            const s = getComputedStyle(el);
            return { outline: s.outlineStyle !== "none" ? parseFloat(s.outlineWidth) : 0, shadow: s.boxShadow };
        });
        expect(ring.outline > 0 || ring.shadow !== "none", "the focused editor shows a ring").toBe(true);
    });

    test("v180 · UIA-F-180 — leaving with edits asks; Reset is undoable; exit clears the selection", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await openEditor(page);
        const undo = editorDock(page).locator('[aria-label="Undo"]').first();
        const del = editorDock(page).locator('[aria-label="Delete point"]').first();

        // Reset to extraction is a history step.
        await dragPoint(page, 30);
        await expect.poll(() => isDisabled(undo)).toBe(false);
        await expandEditorDock(page);
        const more = editorDock(page).getByRole("button", { name: "More editor tools" });
        if (await more.count()) {
            await more.click();
            await page.getByRole("menuitem", { name: "Reset to extraction" }).click();
        } else {
            await editorDock(page).getByRole("button", { name: "Reset to extraction" }).click();
        }
        await page.waitForTimeout(300);
        expect(await isDisabled(undo), "Reset leaves an Undo").toBe(false);

        // Leaving with unsaved edits asks first.
        await dragPoint(page, 30);
        expect(await isDisabled(del), "the dragged point is selected").toBe(false);
        const edit = page.getByRole("button", { name: "Edit contour" }).first();
        await edit.hover();
        await page.waitForTimeout(600);
        await edit.click();
        const ask = page.getByRole("dialog", { name: /unsaved/i });
        await expect(ask, "leaving with unsaved edits asks").toBeVisible();
        await page.waitForTimeout(500);
        await frame(page, "v180-leave-dialog");
        await ask.getByRole("button", { name: "Keep editing" }).click();
        await expect(page.locator(".canvas-stage > .editor-shell")).not.toHaveAttribute("inert", "");

        // Discard leaves, and the selection does not survive the exit.
        await edit.hover();
        await page.waitForTimeout(600);
        await edit.click();
        await page.getByRole("dialog", { name: /unsaved/i }).getByRole("button", { name: /discard/i }).click();
        await expect(page.locator(".canvas-stage > .editor-shell")).toHaveAttribute("inert", "");
        await edit.hover();
        await page.waitForTimeout(600);
        await edit.click();
        await expect(page.locator(".canvas-stage > .editor-shell")).not.toHaveAttribute("inert", "");
        await expect(page.locator("circle.control-point.selected"), "no selection survives the exit").toHaveCount(0);
    });

    test("v242 · UIA-F-242 ⊕ F-172 — dock micro-issues", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await openEditor(page);
        const dock = editorDock(page);
        await page.mouse.move(2, 2);
        await page.waitForTimeout(800);
        await frame(page, "v242-collapsed");
        expect(await dock.locator('svg[class*="lucide-wand"]').count(),
            "the collapsed summary does not wear an action's wand").toBe(0);
        expect(await dock.locator(".metric").count(), "the point count is a glass Metric").toBeGreaterThan(0);
        expect(await dock.locator(".dock-badge").count(), "no hand-rolled badge").toBe(0);

        // A bare click on a handle is not an edit.
        const undo = dock.locator('[aria-label="Undo"]').first();
        const p = await pointXY(page, 12);
        await page.mouse.click(p.x, p.y);
        await page.waitForTimeout(300);
        expect(await isDisabled(undo), "a no-op click writes no history").toBe(true);

        // One hover tint across the tools.
        await expandEditorDock(page);
        const tints = await dock.locator("button[aria-label]").evaluateAll((bs) =>
            [...new Set(bs.map((b) => getComputedStyle(b).getPropertyValue("--btn-hover-color").trim()))],
        );
        // X.F.W14U.c2 — COHESION §0db (addendum (g)'s "and the like"): INVERTED,
        // never deleted. The tools do not share one hover tint; each wears its
        // hue from the one palette through DockControl's published
        // `--btn-hover-color`: Delete the accent pink, Save the Fourier red.
        expect.soft(tints.length, `the tools do not share one hover tint (read ${JSON.stringify(tints)})`).toBeGreaterThan(1);
        const toolHues = await dock.evaluate((root) => {
            const resolve = (v: string) => {
                const s = document.createElement("span");
                s.style.color = v;
                root.appendChild(s);
                const c = getComputedStyle(s).color;
                s.remove();
                return c;
            };
            const tint = (label: string) => {
                const b = root.querySelector(`button[aria-label="${label}"]`);
                return b ? resolve(getComputedStyle(b).getPropertyValue("--btn-hover-color").trim() || "transparent") : null;
            };
            return {
                // An ink is the hue carried a quarter toward --foreground (the
                // chip recipe, for contrast; measured in the c2 record).
                del: tint("Delete point"), pink: resolve("color-mix(in oklab, var(--accent-pink) 75%, var(--foreground))"),
                save: tint("Save contour"), fourier: resolve("color-mix(in oklab, var(--viz-fourier) 75%, var(--foreground))"),
            };
        });
        expect.soft(toolHues.del, "Delete's hover ink is the accent pink").toBe(toolHues.pink);
        expect.soft(toolHues.save, "Save's hover ink is the Fourier red").toBe(toolHues.fourier);
        // Save's hover, as glass paints it: the glyph takes the tint.
        const save = dock.getByRole("button", { name: "Save contour" }).first();
        await save.hover();
        await page.waitForTimeout(400);
        expect.soft(await save.evaluate((b) => getComputedStyle(b).color), "hovered Save wears the Fourier red").toBe(toolHues.fourier);
        // The Magnet radius stays a menu row (no popover toggle, dd123a9's
        // structure); INVERTED colour limb: its Magnet glyph is back and wears the
        // Fourier red while the magnet is on.
        expect(await dock.locator('[aria-label="Magnet options"]').count(), "no Magnet popover toggle (the radius is a menu row)").toBe(0);
        await dock.getByRole("button", { name: "More editor tools" }).click();
        await page.waitForTimeout(400);
        const menu = page.getByRole("menu");
        const magnetField = menu.getByRole("spinbutton", { name: /Magnet/ });
        await magnetField.fill("4");
        await magnetField.press("Enter");
        await page.waitForTimeout(300);
        const glyph = await menu.evaluate((m) => {
            const g = m.querySelector("svg.lucide-magnet");
            const s = document.createElement("span");
            s.style.color = "color-mix(in oklab, var(--viz-fourier) 75%, var(--foreground))";
            m.appendChild(s);
            const fourier = getComputedStyle(s).color;
            s.remove();
            return g ? { color: getComputedStyle(g).color, fourier } : null;
        });
        expect.soft(glyph, "the Magnet glyph is in the menu").not.toBeNull();
        expect.soft(glyph?.color, "the Magnet glyph wears the Fourier red while on").toBe(glyph?.fourier);
        // Smooth and Simplify (menu rows since dd123a9) keep their hover hues:
        // the glyph takes the hue and glass's `--menu-row-bg` carries its tint.
        for (const [name, token] of [["Smooth contour", "--viz-amber"], ["Simplify contour", "--viz-chebyshev"]] as const) {
            const row = menu.getByRole("menuitem", { name });
            await row.hover();
            await page.waitForTimeout(350);
            const read = await row.evaluate((el, token) => {
                const s = document.createElement("span");
                s.style.color = `var(${token})`;
                el.appendChild(s);
                const hueColor = getComputedStyle(s).color;
                s.style.color = `color-mix(in oklab, var(${token}) 75%, var(--foreground))`;
                const want = getComputedStyle(s).color;
                s.remove();
                const svg = el.querySelector("svg");
                // HSL hue and chroma of a colour painted over white (mixing
                // toward white keeps the hue exactly).
                const c = document.createElement("canvas");
                c.width = c.height = 1;
                const x = c.getContext("2d", { willReadFrequently: true })!;
                const hc = (css: string) => {
                    x.fillStyle = "#fff"; x.fillRect(0, 0, 1, 1);
                    x.fillStyle = css; x.fillRect(0, 0, 1, 1);
                    const [r, g, b] = x.getImageData(0, 0, 1, 1).data;
                    const max = Math.max(r, g, b), min = Math.min(r, g, b), k = max - min;
                    if (!k) return { hue: NaN, chroma: 0 };
                    const h = max === r ? ((g - b) / k) % 6 : max === g ? (b - r) / k + 2 : (r - g) / k + 4;
                    return { hue: (h * 60 + 360) % 360, chroma: k };
                };
                const bg = hc(getComputedStyle(el).backgroundColor), hue = hc(hueColor);
                return {
                    glyph: svg ? getComputedStyle(svg).color : null, want,
                    chroma: bg.chroma, dHue: Math.abs(((bg.hue - hue.hue + 540) % 360) - 180),
                };
            }, token);
            expect.soft(read.glyph, `hovered ${name}'s glyph wears ${token}`).toBe(read.want);
            expect.soft(read.chroma, `hovered ${name}'s row is tinted (chroma ${read.chroma})`).toBeGreaterThanOrEqual(6);
            expect.soft(read.dHue, `hovered ${name}'s row tint carries ${token}`).toBeLessThanOrEqual(25);
        }
        await page.mouse.move(2, 2);
        const magnet = await page.getByRole("menu").evaluate((menu) => {
            const row = menu.querySelector("[style*='--track-color']") as HTMLElement | null;
            const resolve = (v: string) => {
                const s = document.createElement("span");
                s.style.color = v;
                menu.appendChild(s);
                const c = getComputedStyle(s).color;
                s.remove();
                return c;
            };
            return row
                ? { track: resolve(getComputedStyle(row).getPropertyValue("--track-color").trim()), owner: resolve("var(--viz-amber)") }
                : null;
        });
        expect(magnet, "the Magnet radius is in the menu").not.toBeNull();
        expect(magnet!.track, "the Magnet track wears the contour's hue").toBe(magnet!.owner);
        await frame(page, "v242-expanded");
    });
});

test.describe("X.F.W14U.vedit — the equation panel", () => {
    /** Set Terms through its value field and return the answered LaTeX. */
    async function setTerms(page: Page, panel: Locator, n: number): Promise<string> {
        const answered = page.waitForResponse((r) => r.url().includes("/api/equations/simplify") && r.ok());
        const field = panel.getByRole("spinbutton", { name: "Terms" });
        await field.fill(String(n));
        await field.press("Enter");
        const body = await (await answered).json();
        await page.waitForTimeout(500);
        return body.latex as string;
    }

    test("v83 · UIA-F-83 (consumer) ⊕ F-176 — every term, reachable, conventionally written", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        const panel = await openEquation(page);
        // Exponential notation, where the sign and scale defects show.
        await panel.getByRole("button", { name: /Exp/ }).or(panel.getByRole("radio", { name: /Exp/ })).first().click();
        const latex = await setTerms(page, panel, 20);
        await frame(page, "v83-terms-20");
        const terms = (latex.match(/e\^\{/g) ?? []).length;
        expect(terms, `Terms 20 renders more than four terms (read ${terms})`).toBeGreaterThan(4);
        expect(latex, "no `i-` inside an exponent").not.toMatch(/e\^\{i-/);
        expect(latex, "no scientific notation typeset as arithmetic").not.toMatch(/\d[eE][+-]\d/);
        const scroller = panel.locator(".fading-scroll");
        await expect(scroller, "the equation sits in a visible fading scroller").toHaveCount(1);
        const read = await scroller.evaluate((el) => ({
            overflow: el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1,
            cue: el.getAttribute("data-fade-end"),
        }));
        if (read.overflow) expect(read.cue, "an overflowing equation shows its end cue").not.toBeNull();
    });

    test("v177 · UIA-F-177 — the panel is a labelled dialog with glass chrome", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        const panel = await openEquation(page);
        await expect(panel).toHaveAttribute("role", "dialog");
        const labelled = await panel.evaluate((el) => {
            const id = el.getAttribute("aria-labelledby");
            return id ? document.getElementById(id)?.textContent?.trim() : null;
        });
        expect(labelled, "the dialog is named by its title").toBe("Equation");
        const close = panel.getByRole("button", { name: "Close equation panel" });
        const box = (await close.boundingBox())!;
        expect(Math.abs(box.width - box.height), `the close is square (read ${box.width}×${box.height})`).toBeLessThanOrEqual(1);
        expect(box.width, "the close keeps the 24 px floor").toBeGreaterThanOrEqual(24);
        await expect(panel.locator(".animate-spin"), "no hand-rolled spinner").toHaveCount(0);

        // A refetch keeps the panel's size.
        const h0 = (await panel.boundingBox())!.height;
        let minH = h0;
        const field = panel.getByRole("spinbutton", { name: "Terms" });
        await page.route("**/api/equations/simplify", async (route) => {
            await new Promise((r) => setTimeout(r, 900));
            await route.fallback();
        });
        await field.fill("7");
        await field.press("Enter");
        for (let i = 0; i < 12; i++) {
            await page.waitForTimeout(100);
            minH = Math.min(minH, (await panel.boundingBox())!.height);
        }
        await frame(page, "v177-refetch");
        expect(h0 - minH, "a refetch does not shrink the panel").toBeLessThanOrEqual(2);
        await page.unroute("**/api/equations/simplify");

        // Escape dismisses with focus anywhere on the page.
        await page.locator("body").click({ position: { x: 5, y: 5 } });
        await page.keyboard.press("Escape");
        await expect(panel, "Escape dismisses the panel").toHaveCount(0);
    });

    test("v177m · UIA-F-177 — at 390 the panel clears the canvas dock", async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        const panel = await openEquation(page);
        await page.mouse.click(5, 300);
        await page.waitForTimeout(900);
        await frame(page, "v177-390");
        const overlap = await page.evaluate(() => {
            const a = document.querySelector(".eq-panel")!.getBoundingClientRect();
            const b = document.querySelector(".controls-dock-anchor .glass-dock, .controls-dock-anchor > *")!.getBoundingClientRect();
            const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            return w > 0 && h > 0 ? h : 0;
        });
        expect(overlap, "the panel does not overlap the canvas dock").toBe(0);
        const r = (await panel.boundingBox())!;
        expect(r.x, "inside the viewport").toBeGreaterThanOrEqual(0);
        expect(r.x + r.width, "inside the viewport").toBeLessThanOrEqual(390);
    });

    test("v178 · UIA-F-178 — the fit is a measurement, never the destructive ink", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        const panel = await openEquation(page);
        await setTerms(page, panel, 2);
        await frame(page, "v178-low-fit");
        const read = await panel.evaluate((el) => {
            const probe = document.createElement("span");
            probe.style.color = "var(--destructive)";
            el.appendChild(probe);
            const destructive = getComputedStyle(probe).color;
            probe.remove();
            const metric = el.querySelector(".metric") as HTMLElement;
            const value = el.querySelector(".metric__value") as HTMLElement;
            // The Terms row paints its fill from `--track-color` (SliderControl).
            const row = el.querySelector("[style*='--track-color']") as HTMLElement | null;
            const resolve = (v: string) => {
                const s = document.createElement("span");
                s.style.color = v;
                el.appendChild(s);
                const c = getComputedStyle(s).color;
                s.remove();
                return c;
            };
            return {
                destructive,
                metric: getComputedStyle(metric).color,
                value: getComputedStyle(value).color,
                range: row ? resolve(getComputedStyle(row).getPropertyValue("--track-color").trim()) : null,
                owner: resolve("var(--viz-fourier)"),
                pct: value.textContent,
            };
        });
        expect(Number(read.pct), `the fit reads below 95% at Terms 2 (read ${read.pct})`).toBeLessThan(95);
        expect(read.metric, "the Metric is not destructive").not.toBe(read.destructive);
        expect(read.value, "the Metric value is not destructive").not.toBe(read.destructive);
        expect(read.range, "the Terms track is found").not.toBeNull();
        expect(read.range, "the Terms track is not destructive").not.toBe(read.destructive);
        expect(read.range, "the Terms track wears the Fourier hue").toBe(read.owner);
    });
});

/* The family's frames at both widths (the per-row cases above each frame the
   width their row names; these frame the editor and the panel at the other). */
test.describe("X.F.W14U.vedit — frames at 1440 and 390", () => {
    for (const [w, h] of [[1440, 900], [390, 844]] as const) {
        test(`frames ${w} — the editor and the equation panel`, async ({ page }) => {
            await page.setViewportSize({ width: w, height: h });
            await openEditor(page);
            await expandEditorDock(page);
            await frame(page, "frames-editor");
            const edit = page.getByRole("button", { name: "Edit contour" }).first();
            await edit.hover();
            await page.waitForTimeout(600);
            await edit.click();
            await expect(page.locator(".canvas-stage > .editor-shell")).toHaveAttribute("inert", "");
            const eq = page.getByRole("button", { name: "Equation", exact: true }).first();
            await edit.hover();
            await expect(eq).toBeVisible();
            await page.waitForTimeout(700);
            await eq.click();
            await expect(page.locator(".eq-panel .eq-scroll-region .katex").first()).toBeVisible({ timeout: 30_000 });
            await frame(page, "frames-equation");
        });
    }
});
