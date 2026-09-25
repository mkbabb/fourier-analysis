// SERVED MODEL: claude-opus-5-5
import { expect, test, type Locator, type Page } from "@playwright/test";
import { seededViz } from "./fixtures/seed";

/**
 * X.F.W14V `.c3` — the editor dock's leftovers from F.W14U.c2 (F-W14V.md
 * addendum (a); COHESION §0dc).
 *
 * c3m  The magnet's state shows without opening a menu: while the magnet is
 *      engaged the More-tools trigger carries an "on" mark in the magnet's hue
 *      (the Fourier red the in-menu Magnet glyph wears); at radius 0 it carries
 *      none. The probe is seat-agnostic: it walks the trigger, its descendants
 *      and their ::before/::after, and looks for the magnet's hue in any
 *      painted colour (ink, fill, stroke, background, border, shadow). The
 *      mark may only arrive through glass's DockControl/DockTrigger seat
 *      (addendum (a)); glass 10.1.0 publishes none, so this is honest-RED
 *      MAGNET-STATE-HIDDEN until it does (O-76 addendum 2026-09-25).
 * c3g  Smooth, Simplify and Reset carry an icon-to-label gap no smaller than
 *      glass's DropdownMenuItem icon gap, and glass publishes one (> 0). The
 *      gap is glass's anatomy, never a consumer margin; at glass 10.1.0
 *      `.menu__item` is a flex row with no gap and no icon slot, so this is
 *      honest-RED MENU-ICON-GAP (the same O-76 addendum).
 *
 * Served from :3100 (BASE_URL) against the API on :8000; data = the e2e global
 * seed. `FW14V_PHASE` names the frames (before/after).
 */

const PHASE = process.env.FW14V_PHASE ?? "after";
const FRAMES = "e2e/screenshots/f-w14v/c3";

async function openEditor(page: Page): Promise<void> {
    const viz = seededViz();
    await page.goto(`/v/${viz.slug}`);
    if (page.viewportSize()!.width < 1024) await page.getByRole("tab", { name: "Canvas" }).click();
    await expect(page.locator(".controls-dock-anchor")).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(600);
    const edit = page.getByRole("button", { name: "Edit contour" }).first();
    await edit.hover();
    await page.waitForTimeout(600);
    await edit.click();
    await expect(page.locator(".canvas-stage > .editor-shell:not(.is-hidden) svg.editor-svg")).toBeVisible();
    await expect(page.locator("circle.control-point").nth(10)).toBeAttached();
    const dock = editorDock(page);
    const summary = dock.getByRole("button", { name: "Expand dock" });
    if (await summary.isVisible()) {
        await summary.click();
        await page.waitForTimeout(700);
    }
}

function editorDock(page: Page): Locator {
    return page.locator(".controls-overlay").last();
}

function moreTools(page: Page): Locator {
    return editorDock(page).getByRole("button", { name: "More editor tools" });
}

/**
 * Open More tools. At 390 the editor dock's row overflows its plate and the
 * trigger sits under the plate's edge (a pointer click is intercepted; recorded
 * as a residual in the `.c3` receipt), so the frames reach it by keyboard, the
 * path the trigger's own focus contract publishes.
 */
async function openMore(page: Page): Promise<void> {
    if (page.viewportSize()!.width < 1024) {
        await moreTools(page).focus();
        await page.keyboard.press("Enter");
    } else {
        await moreTools(page).click();
    }
    await expect(page.getByRole("menu")).toBeVisible();
}

/** Set the magnet radius through its menu field, then close the menu. */
async function setMagnet(page: Page, radius: number): Promise<void> {
    await openMore(page);
    await page.waitForTimeout(400);
    const field = page.getByRole("menu").getByRole("spinbutton", { name: /Magnet/ });
    await field.fill(String(radius));
    await field.press("Enter");
    await page.waitForTimeout(300);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await page.mouse.move(2, 2);
    await page.waitForTimeout(500);
}

/** The painted colours on the trigger that equal the magnet's hue (ink or bare). */
async function magnetHueOnTrigger(page: Page): Promise<string[]> {
    return moreTools(page).evaluate((trigger) => {
        const probe = document.createElement("span");
        document.body.appendChild(probe);
        const resolve = (c: string) => {
            probe.style.color = c;
            return getComputedStyle(probe).color;
        };
        const hues = new Set([
            resolve("var(--viz-fourier)"),
            resolve("color-mix(in oklab, var(--viz-fourier) 75%, var(--foreground))"),
        ]);
        probe.remove();
        const props = ["color", "fill", "stroke", "background-color", "border-top-color", "outline-color"] as const;
        const hits: string[] = [];
        const nodes = [trigger, ...Array.from(trigger.querySelectorAll("*"))];
        for (const el of nodes) {
            for (const pseudo of [null, "::before", "::after"] as const) {
                const cs = getComputedStyle(el, pseudo);
                if (pseudo && (cs.content === "none" || cs.content === "normal")) continue;
                if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") continue;
                for (const p of props) {
                    const v = cs.getPropertyValue(p);
                    if (hues.has(v)) hits.push(`${el.tagName.toLowerCase()}${pseudo ?? ""} ${p} ${v}`);
                }
                for (const p of ["box-shadow", "background-image"]) {
                    const v = cs.getPropertyValue(p);
                    for (const h of hues) if (v.includes(h)) hits.push(`${el.tagName.toLowerCase()}${pseudo ?? ""} ${p}`);
                }
            }
        }
        return hits;
    });
}

test.describe("X.F.W14V.c3 — the editor dock's leftovers", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("c3m — the More-tools trigger shows the magnet's state (on: a mark in its hue; off: none)", async ({ page }) => {
        await openEditor(page);
        await setMagnet(page, 0);
        const off = await magnetHueOnTrigger(page);
        await setMagnet(page, 4);
        const on = await magnetHueOnTrigger(page);
        expect.soft(off, "magnet off: the trigger carries no mark in the magnet's hue").toEqual([]);
        expect.soft(on.length, `magnet on: the trigger carries a mark in the magnet's hue (MAGNET-STATE-HIDDEN while 0; found ${JSON.stringify(on)})`).toBeGreaterThan(0);
    });

    test("c3g — Smooth, Simplify and Reset keep glass's menu icon gap", async ({ page }) => {
        await openEditor(page);
        await moreTools(page).click();
        await page.waitForTimeout(400);
        const menu = page.getByRole("menu");
        for (const name of ["Smooth contour", "Simplify contour", "Reset to extraction"]) {
            const row = menu.getByRole("menuitem", { name });
            const m = await row.evaluate((item) => {
                const svg = item.querySelector("svg")!;
                const text = Array.from(item.childNodes).find((n) => n.nodeType === 3 && n.textContent!.trim())!;
                const range = document.createRange();
                range.selectNodeContents(text);
                const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0);
                const labelLeft = Math.min(...rects.map((r) => r.left));
                const gap = labelLeft - svg.getBoundingClientRect().right;
                // Glass's published gap for a DropdownMenuItem: a bare glass item's
                // own column gap (the row reads it from `.menu__item`).
                const bare = document.createElement("div");
                bare.className = "menu__item interactive-item glass-menu-row";
                item.parentElement!.appendChild(bare);
                const cg = getComputedStyle(bare).columnGap;
                bare.remove();
                return { gap: Math.round(gap * 100) / 100, glassGap: cg === "normal" ? 0 : parseFloat(cg) };
            });
            expect.soft(m.glassGap, `${name}: glass publishes a DropdownMenuItem icon gap (MENU-ICON-GAP while 0)`).toBeGreaterThan(0);
            expect.soft(m.gap, `${name}: icon-to-label gap ${m.gap}px >= glass's ${m.glassGap}px, and not flush`).toBeGreaterThanOrEqual(Math.max(m.glassGap, 0.5));
        }
    });
});

for (const scheme of ["light", "dark"] as const) {
    for (const [w, h] of [[1440, 900], [390, 844]] as const) {
        test.describe(`X.F.W14V.c3 — frames ${w} ${scheme}`, () => {
            test.use({ viewport: { width: w, height: h }, colorScheme: scheme });
            test(`frames ${w} ${scheme} — the closed dock (magnet on) and the open menu`, async ({ page }) => {
                await openEditor(page);
                await setMagnet(page, 4);
                await page.screenshot({ path: `${FRAMES}/${PHASE}-dock-magnet-on-${w}-${scheme}.png` });
                await openMore(page);
                await page.waitForTimeout(500);
                await page.screenshot({ path: `${FRAMES}/${PHASE}-menu-${w}-${scheme}.png` });
            });
        });
    }
}
