import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { seededViz } from "./fixtures/seed";

/**
 * X.F.W14U.vdock — the visualize docks' family (spec `F-W14U.md` Units :8-18;
 * register `audit/UI-AUDIT-fourier.md` sections visualize-animation-more-menu,
 * -view-options-popover, -fullscreen, -export-modal). One case per cured row;
 * every case frames the served page under `FW14U_PHASE` (before | after).
 *
 * v9   UIA-F-9 (BROKEN) ⊕ F-82 ⊕ F-175 ⊕ F-240 — the ⋮ menu's content fits
 *      the menu at 390 and 1440: no row runs past it, nothing scrolls on x,
 *      Export stays in view; speed is one control (menu radio items, never a
 *      Select listbox over the menu, never a second control in the dock); every
 *      section is labelled; choosing a speed or an easing keeps the menu open.
 * v76  UIA-F-76 — View options opens below its trigger, into the canvas, and at
 *      390 never over the app chrome above the stage.
 * v94  UIA-F-94 — the collapsed canvas dock's face is not the Fullscreen glyph.
 * v244 UIA-F-244 — the fullscreen takeover carries a description (and F-92's
 *      fill is read: the canvas fills its container).
 * v181 UIA-F-181 ⊕ F-229 ⊕ F-243 — the export dialog: glass LabeledSwitch
 *      rows, a description, no consumer size on the title, choices remembered,
 *      an opaque-ground switch, a reference-contour switch, and Labels off
 *      skips the labels rather than erasing a fixed corner.
 *
 * Data: the e2e global seed (`e2e/global-seed.ts`, per-run keyed); nothing is
 * seeded here.
 */

const PHASE = process.env.FW14U_PHASE ?? "after";
const FRAMES = "e2e/screenshots/f-w14u/vdock";

async function frame(page: Page, name: string): Promise<void> {
    const w = page.viewportSize()!.width;
    await page.screenshot({ path: `${FRAMES}/${PHASE}-${name}-${w}.png` });
}

/** Open the seeded visualization; at 390 show the Canvas tab. */
async function openViz(page: Page): Promise<void> {
    const viz = seededViz();
    await page.goto(`/v/${viz.slug}`);
    if (page.viewportSize()!.width < 640) await page.getByRole("tab", { name: "Canvas" }).click();
    await expect(page.locator(".animation-dock")).toBeVisible({ timeout: 30_000 });
}

/** Pause the clock by keyboard, so frames and pixel reads are stable. */
async function pause(page: Page): Promise<void> {
    const btn = page.getByRole("button", { name: "Pause animation" }).first();
    await btn.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Play animation" }).first()).toBeVisible();
}

/** Expand the animation dock and open its ⋮ menu. */
async function openMore(page: Page) {
    await page.getByRole("button", { name: /(Play|Pause) animation/ }).first().hover();
    await page.waitForTimeout(800);
    await page.getByRole("button", { name: "More options" }).first().click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await page.waitForTimeout(400);
    return menu;
}

/** Expand the canvas dock (the pointer rests on its persistent Edit control). */
async function expandCanvasDock(page: Page): Promise<void> {
    await page.getByRole("button", { name: "Edit contour" }).first().hover();
    await expect(page.getByRole("button", { name: "View options" }).first()).toBeVisible();
    await page.waitForTimeout(700);
}

const WIDTHS = [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
];

for (const vp of WIDTHS) {
    test.describe(`F.W14U.vdock — the animation dock's ⋮ menu (${vp.width})`, () => {
        test.use({ viewport: vp });
        test.setTimeout(90_000);

        test("v9 — the menu's content fits the menu, speed is one control, sections are labelled, choosing keeps it open", async ({
            page,
        }) => {
            await openViz(page);
            await pause(page);
            const menu = await openMore(page);
            await frame(page, "v9-more-open");
            // F-82: one control per setting — the dock itself holds no speed Select.
            await expect.soft(page.locator(".animation-dock [role=combobox]")).toHaveCount(0);
            const fit = await menu.evaluate((el) => {
                const b = el.getBoundingClientRect();
                const rows = [...el.querySelectorAll<HTMLElement>("[role^=menuitem],[role=group],[role=combobox]")].filter(
                    (r) => r.getClientRects().length,
                );
                return {
                    overflowX: el.scrollWidth - el.clientWidth,
                    out: rows
                        .filter((r) => {
                            const q = r.getBoundingClientRect();
                            return q.left < b.left - 0.5 || q.right > b.right + 0.5;
                        })
                        .map((r) => r.textContent?.trim().slice(0, 24)),
                    combobox: el.querySelectorAll("[role=combobox]").length,
                };
            });
            test.info().annotations.push({ type: "v9-fit", description: JSON.stringify(fit) });
            expect.soft(fit.combobox, "no Select listbox is a child of the menu").toBe(0);
            expect.soft(fit.out, "every row sits inside the menu").toEqual([]);
            expect.soft(fit.overflowX, "the menu never scrolls on x").toBeLessThanOrEqual(0.5);
            // Export is in view and is what its centre hits (not clipped by a scroller).
            const exp = menu.getByRole("menuitem", { name: /export/i });
            const hit = await exp.evaluate((el) => {
                const r = el.getBoundingClientRect();
                const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
                return { inView: r.top >= 0 && r.bottom <= innerHeight, hits: !!h && (h === el || el.contains(h)) };
            });
            expect.soft(hit, "Export is in view and hittable").toEqual({ inView: true, hits: true });
            // F-175: every section carries a menu label.
            for (const name of ["Speed", "Easing"]) {
                await expect(menu.getByRole("group", { name })).toHaveCount(1);
            }
            // F-82 / F-240: speed is a menu radio item; choosing one (and an easing) keeps the menu open.
            await menu.getByRole("menuitemradio", { name: /^2\s*×$/ }).click({ timeout: 5_000 });
            await expect(menu).toBeVisible();
            await expect(menu.getByRole("menuitemradio", { name: /^2\s*×$/ })).toHaveAttribute("aria-checked", "true");
            await menu.getByRole("menuitemradio", { name: "Linear" }).click({ timeout: 5_000 });
            await expect(menu).toBeVisible();
            await expect(menu.getByRole("menuitemradio", { name: "Linear" })).toHaveAttribute("aria-checked", "true");
            // F-137, read (not asserted here: the anchor is glass's DockTrigger, O-59).
            const clear = await page.evaluate(() => {
                const m = document.querySelector("[role=menu]")!.getBoundingClientRect();
                const d = document.querySelector(".animation-dock")!.getBoundingClientRect();
                return { menuBottom: m.bottom, plateTop: d.top, gap: d.top - m.bottom };
            });
            test.info().annotations.push({ type: "v137-clearance", description: JSON.stringify(clear) });
        });
    });
}

for (const vp of WIDTHS) {
    test.describe(`F.W14U.vdock — the canvas dock (${vp.width})`, () => {
        test.use({ viewport: vp });
        test.setTimeout(90_000);

        test("v76 — View options opens below its trigger, into the canvas, clear of the app chrome", async ({ page }) => {
            await openViz(page);
            await expandCanvasDock(page);
            const trigger = page.getByRole("button", { name: "View options" }).first();
            await trigger.click();
            await expect(page.getByRole("button", { name: "Image overlay" })).toBeVisible();
            await page.waitForTimeout(400);
            await frame(page, "v76-view-options");
            const g = await page.evaluate(() => {
                const t = document.querySelector("[aria-label='View options']")!.getBoundingClientRect();
                // The popover's own plate: the popper wrapper holding its toggles.
                const c = document
                    .querySelector("[aria-label='Image overlay']")!
                    .closest("[data-reka-popper-content-wrapper]")!
                    .getBoundingClientRect();
                const stage = document.querySelector(".canvas-stage")!.getBoundingClientRect();
                return { triggerBottom: t.bottom, contentTop: c.top, stageTop: stage.top, contentRight: c.right, vw: innerWidth };
            });
            test.info().annotations.push({ type: "v76", description: JSON.stringify(g) });
            expect(g.contentTop, "opens below the trigger").toBeGreaterThanOrEqual(g.triggerBottom);
            expect(g.contentTop, "never over the chrome above the stage").toBeGreaterThanOrEqual(g.stageTop);
            expect(g.contentRight, "inside the viewport").toBeLessThanOrEqual(g.vw);
        });

        test("v94 — the collapsed canvas dock's face is not the Fullscreen glyph", async ({ page }) => {
            await openViz(page);
            await page.mouse.move(5, 5);
            const dock = page.locator(".controls-dock-anchor .glass-dock");
            await expect(dock).toHaveClass(/\bcollapsed\b/, { timeout: 30_000 });
            await page.waitForTimeout(600);
            await frame(page, "v94-collapsed");
            const same = await page.evaluate(() => {
                const face = document.querySelector(".controls-dock-anchor .dock-summary-glyph");
                const fs = document.querySelector(".controls-dock-anchor [aria-label='Fullscreen'] svg");
                return !!face && !!fs && face.innerHTML === fs.innerHTML;
            });
            expect(same, "the resting face does not wear the Fullscreen action's glyph").toBe(false);
        });
    });
}

for (const vp of WIDTHS) {
    test.describe(`F.W14U.vdock — fullscreen (${vp.width})`, () => {
        test.use({ viewport: vp });
        test.setTimeout(90_000);

        async function openFullscreen(page: Page) {
            await expandCanvasDock(page);
            await page.getByRole("button", { name: "Fullscreen" }).first().click();
            const dialog = page.getByRole("dialog", { name: /fullscreen/i });
            await expect(dialog).toBeVisible();
            await page.waitForTimeout(900);
            return dialog;
        }

        test("v244 — the takeover is described (F-92 read: its canvas fills the container)", async ({ page }) => {
            await openViz(page);
            await pause(page);
            const dialog = await openFullscreen(page);
            await frame(page, "v244-fs-open");
            // F-92, read: the stage canvas fills its container inside the takeover.
            const fill = await page.evaluate(() => {
                const c = document.querySelector<HTMLElement>(".fs-dialog canvas")!;
                const p = c.parentElement!;
                return { cw: c.offsetWidth, pw: p.clientWidth, ch: c.offsetHeight, ph: p.clientHeight };
            });
            test.info().annotations.push({ type: "v92-fill", description: JSON.stringify(fill) });
            // F-244: the takeover carries a description.
            const described = await dialog.evaluate((el) => {
                const id = el.getAttribute("aria-describedby");
                return id ? (document.getElementById(id)?.textContent ?? "").trim() : "";
            });
            expect(described.length, "the takeover is described").toBeGreaterThan(0);
        });
    });
}

/** Read a PNG in the page: painted (alpha > 0) and transparent pixels, whole and in a top-left region. */
async function readPng(page: Page, png: Buffer, region: { w: number; h: number }) {
    return page.evaluate(
        async ({ b64, region }) => {
            const img = new Image();
            img.src = `data:image/png;base64,${b64}`;
            await img.decode();
            const c = document.createElement("canvas");
            c.width = img.naturalWidth;
            c.height = img.naturalHeight;
            const ctx = c.getContext("2d")!;
            ctx.drawImage(img, 0, 0);
            const d = ctx.getImageData(0, 0, c.width, c.height).data;
            let painted = 0;
            let clear = 0;
            let corner = 0;
            const rw = Math.round(region.w * devicePixelRatio);
            const rh = Math.round(region.h * devicePixelRatio);
            for (let i = 0; i < d.length; i += 4) {
                const px = (i / 4) % c.width;
                const py = Math.floor(i / 4 / c.width);
                if (d[i + 3] > 0) {
                    painted++;
                    if (px < rw && py < rh) corner++;
                } else clear++;
            }
            return { painted, clear, corner };
        },
        { b64: png.toString("base64"), region },
    );
}

test.describe("F.W14U.vdock — the export dialog (1440)", () => {
    test.use({ viewport: { width: 1440, height: 900 } });
    test.setTimeout(120_000);

    async function openExport(page: Page) {
        const menu = await openMore(page);
        await menu.getByRole("menuitem", { name: /export/i }).click();
        const dialog = page.getByRole("dialog", { name: "Export Frame" });
        await expect(dialog).toBeVisible();
        await page.waitForTimeout(300);
        return dialog;
    }

    /** Set the named switches, save, and read the PNG. */
    async function exportWith(page: Page, set: Record<string, boolean>) {
        const dialog = await openExport(page);
        for (const [name, on] of Object.entries(set)) {
            const sw = dialog.getByRole("switch", { name });
            if ((await sw.getAttribute("aria-checked", { timeout: 5_000 })) !== String(on)) await sw.click();
        }
        const dl = page.waitForEvent("download");
        await dialog.getByRole("button", { name: "Save PNG" }).click();
        const file = await (await dl).path();
        await expect(dialog).toHaveCount(0);
        return readPng(page, readFileSync(file!), { w: 200, h: 100 });
    }

    test("v181 — glass rows, a description, the title's own rung, remembered choices, every layer switchable", async ({
        page,
    }) => {
        const warnings: string[] = [];
        page.on("console", (m) => {
            if (/Description|aria-describedby/.test(m.text())) warnings.push(m.text());
        });
        await openViz(page);
        await pause(page);
        const dialog = await openExport(page);
        await frame(page, "v181-export-open");
        const shape = await dialog.evaluate((el) => {
            const id = el.getAttribute("aria-describedby");
            const title = el.querySelector("h2, [data-slot=dialog-title]") as HTMLElement | null;
            const switches = [...el.querySelectorAll("[role=switch]")];
            return {
                description: id ? (document.getElementById(id)?.textContent ?? "").trim() : "",
                titleSizeClass: /\btext-(xs|sm|base|lg|xl|\dxl)\b/.test(title?.className ?? ""),
                switches: switches.length,
                glassRows: switches.filter((s) => s.closest("[data-slot=labeled-field]")).length,
            };
        });
        test.info().annotations.push({ type: "v181", description: JSON.stringify(shape) });
        expect.soft(shape.description.length, "F-181: the dialog is described").toBeGreaterThan(0);
        expect.soft(shape.glassRows, "F-181: every switch is a glass LabeledSwitch row").toBe(shape.switches);
        expect.soft(shape.titleSizeClass, "F-229/F-243: the title keeps glass's own rung").toBe(false);
        for (const name of [/Opaque background/, /Reference contour/]) {
            await expect.soft(dialog.getByRole("switch", { name }), `F-243: a switch for ${name}`).toHaveCount(1);
        }
        await dialog.getByRole("button", { name: "Cancel" }).click();
        expect.soft(warnings, "F-181: Reka raises no missing-Description warning").toEqual([]);

        // F-243: an opaque ground leaves no transparent pixel.
        const opaque = await exportWith(page, { "Opaque background": true, "Grid lines": true, Labels: true });
        expect.soft(opaque.clear, "F-243: the opaque ground fills the PNG").toBe(0);
        // F-243: choices are remembered across opens.
        const again = await openExport(page);
        await expect.soft(again.getByRole("switch", { name: "Opaque background" })).toHaveAttribute("aria-checked", "true");
        await again.getByRole("button", { name: "Cancel" }).click();
        // F-243: the reference contour has its own switch, and it changes the PNG.
        const withRef = await exportWith(page, { "Opaque background": false, "Grid lines": false, Labels: false, "Reference contour": true });
        const noRef = await exportWith(page, { "Opaque background": false, "Grid lines": false, Labels: false, "Reference contour": false });
        expect.soft(withRef.painted - noRef.painted, "F-243: the reference contour switch removes its pixels").toBeGreaterThan(100);
        // F-182: Labels off skips the labels, it does not erase a corner of the grid.
        const gridNoLabels = await exportWith(page, { "Grid lines": true, Labels: false });
        expect.soft(gridNoLabels.corner, "F-182: the grid survives in the top-left corner").toBeGreaterThan(0);
    });
});
