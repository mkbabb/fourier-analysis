// SERVED MODEL: claude-opus-5-5
/**
 * X.F.W14V.au2 — the AUDIT-2 workspace family, /w and /v (F-W14V.md §1
 * `.au0…`, F-W14U.md addendum (e), `audit/AUDIT-2-fourier.md` Lens 1/2/3 and
 * the `.au0` receipt's X rows). One falsifier per row:
 *
 *   L2-8   landscape 844×390: the Export dialog fits the viewport (it scrolls
 *          inside itself) and its title and footer are reachable.
 *   L2-15  the expanded editor dock at 360/390/430: every tool is inside the
 *          plate, none behind an unmarked sideways scroll.
 *   L2-19  the expanded animation dock layer never overflows its own width
 *          (360/390/430/1440).
 *   L3-5ˢ  no consumer surface between glass's aside card and its layers
 *          (1440 and 390, Controls tab): the layer stack's rim is the only
 *          one inside the aside (the glass "flush" arm rides O-74).
 *   L1-11  one upload owner: one file input on /w (empty) and /v (loaded),
 *          and it is the view's (the Replace command summons that input).
 *
 * Served from :3100 against :8000 (BASE_URL), Chromium (CDP insets).
 */
import { expect, test, type Page } from "@playwright/test";

import { seededViz } from "./fixtures/seed";

const L_INSETS = { top: 0, bottom: 21, left: 47, right: 47 };

async function insets(page: Page, i: { top: number; bottom: number; left: number; right: number }): Promise<void> {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setSafeAreaInsetsOverride" as never, { insets: i } as never);
}

async function settle(page: Page, ms = 700): Promise<void> {
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await page.waitForTimeout(ms);
}

async function openWorkspace(page: Page): Promise<void> {
    await page.goto(`/v/${seededViz().slug}`);
    await expect(page.locator(".viz-configurator")).toBeVisible({ timeout: 30_000 });
    await settle(page);
}

async function tab(page: Page, name: "Canvas" | "Controls"): Promise<void> {
    const t = page.getByRole("tab", { name }).filter({ visible: true }).first();
    if (await t.count()) {
        await t.click();
        await settle(page, 500);
    }
}

async function toCanvas(page: Page): Promise<void> {
    await tab(page, "Canvas");
    await expect(page.locator(".animation-dock")).toBeVisible({ timeout: 30_000 });
}

/** Expand a dock through its own disclosure (the collapsed summary). */
async function expand(page: Page, dockSel: string): Promise<void> {
    const summary = page.locator(dockSel).getByRole("button", { name: "Expand dock" });
    if (await summary.isVisible().catch(() => false)) {
        await summary.click();
        await page.waitForTimeout(700);
    }
}

// ── L2-8: the landscape Export dialog fits and scrolls inside itself ─────────
test("L2-8 · 844×390: the Export dialog fits the viewport; title and footer reachable", async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await insets(page, L_INSETS);
    await openWorkspace(page);
    await toCanvas(page);
    await expand(page, ".canvas-controls-dock, .controls-dock-anchor");
    await page.getByRole("button", { name: "Export frame" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Export Frame" });
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(500);
    const read = await dialog.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return { top: r.top, bottom: r.bottom, h: r.height, vh: window.innerHeight, sh: el.scrollHeight, ch: el.clientHeight, oy: s.overflowY };
    });
    console.log(`[au2] L2-8 ${JSON.stringify(read)}`);
    expect(read.top, "the dialog's top edge is on screen").toBeGreaterThanOrEqual(0);
    expect(read.bottom, "the dialog's bottom edge is on screen").toBeLessThanOrEqual(read.vh);
    // Every part is reachable: the footer scrolls into view inside the dialog,
    // and the title is on screen once the dialog is scrolled back to its top.
    for (const name of ["Save PNG", "Cancel"]) {
        const b = dialog.getByRole("button", { name });
        await b.scrollIntoViewIfNeeded();
        const hit = await b.evaluate((el) => {
            const r = el.getBoundingClientRect();
            const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            return !!at && (at === el || el.contains(at)) && r.top >= 0 && r.bottom <= window.innerHeight;
        });
        expect(hit, `${name} is on screen and hit-testable`).toBe(true);
    }
    const title = dialog.getByRole("heading", { name: "Export Frame" });
    await title.scrollIntoViewIfNeeded();
    const tb = await title.boundingBox();
    expect(tb!.y, "the title is on screen").toBeGreaterThanOrEqual(0);
});

// ── L2-15: the expanded editor dock keeps every tool inside its plate ────────
for (const width of [360, 390, 430]) {
    test(`L2-15 · ${width}: every expanded editor tool is inside the plate, no sideways scroll`, async ({ page }) => {
        await page.setViewportSize({ width, height: 844 });
        await openWorkspace(page);
        await toCanvas(page);
        const edit = page.getByRole("button", { name: "Edit contour" }).first();
        await edit.click();
        await expect(page.locator(".canvas-stage > .editor-shell:not(.is-hidden) svg.editor-svg")).toBeVisible({ timeout: 30_000 });
        await page.waitForTimeout(500);
        const dock = page.locator(".controls-overlay").last();
        const summary = dock.getByRole("button", { name: "Expand dock" });
        if (await summary.isVisible().catch(() => false)) {
            await summary.click();
            await page.waitForTimeout(700);
        }
        const read = await dock.evaluate((root) => {
            const vw = window.innerWidth;
            const plate = (root.querySelector(".dock-plate") ?? root).getBoundingClientRect();
            const buttons = [...root.querySelectorAll<HTMLElement>("button[aria-label]")].filter(
                (b) => !b.closest("[inert]") && getComputedStyle(b).visibility !== "hidden" && b.getBoundingClientRect().width > 0,
            );
            const out = buttons
                .filter((b) => {
                    const r = b.getBoundingClientRect();
                    return !(r.left >= Math.max(0, plate.left) - 0.5 && r.right <= Math.min(vw, plate.right) + 0.5);
                })
                .map((b) => b.getAttribute("aria-label"));
            const scrollers = [...root.querySelectorAll<HTMLElement>("*")]
                .filter((e) => e.scrollWidth > e.clientWidth + 1 && /auto|scroll/.test(getComputedStyle(e).overflowX))
                .map((e) => `${e.className} ${e.scrollWidth}/${e.clientWidth}`);
            // X.F.W14V.r1 (addendum (h) 1): the expanded layer's content fits its
            // own box, read directly (scrollWidth <= clientWidth), whatever its
            // overflow style.
            const layer = root.querySelector<HTMLElement>(".dock-layer--full.is-active");
            const fit = layer ? [layer.scrollWidth, layer.clientWidth] : null;
            return { n: buttons.length, out, scrollers, plate: [plate.left, plate.right], fit };
        });
        console.log(`[au2] L2-15@${width} ${JSON.stringify(read)}`);
        expect(read.fit, "the expanded editor layer is present").not.toBeNull();
        expect(read.fit![0], "expanded layer scrollWidth <= clientWidth").toBeLessThanOrEqual(read.fit![1]);
        expect(read.scrollers, "no unmarked sideways scroller in the editor dock").toEqual([]);
        expect(read.out, "no tool outside the plate").toEqual([]);
    });
}

// ── L2-19: the expanded animation dock layer never overflows its width ───────
for (const width of [360, 390, 430, 768, 1440]) {
    test(`L2-19 · ${width}: the expanded animation dock layer does not overflow`, async ({ page }) => {
        await page.setViewportSize({ width, height: width === 768 ? 1024 : width > 1000 ? 900 : 844 });
        await openWorkspace(page);
        await toCanvas(page);
        await expand(page, ".animation-dock");
        const read = await page.locator(".animation-dock").evaluate((root) => {
            return [...root.querySelectorAll<HTMLElement>("*")]
                .filter((e) => e.scrollWidth > e.clientWidth + 0.5 && /auto|scroll|hidden/.test(getComputedStyle(e).overflowX) && e.clientWidth > 0)
                .map((e) => `${e.className.toString().slice(0, 60)} ${e.scrollWidth}/${e.clientWidth}`);
        });
        console.log(`[au2] L2-19@${width} ${JSON.stringify(read)}`);
        expect(read, "no box in the animation dock overflows its own width").toEqual([]);
    });
}

// ── L3-5ˢ: the layer stack is the aside's one rim (no consumer surface) ──────
for (const width of [1440, 390]) {
    test(`L3-5ˢ · ${width}: no consumer surface between the aside card and its layers`, async ({ page }) => {
        await page.setViewportSize({ width, height: width > 1000 ? 900 : 844 });
        await openWorkspace(page);
        await tab(page, "Controls");
        const between = await page.locator(".configurator-layer").first().evaluate((layer) => {
            const painted: string[] = [];
            let e = layer.parentElement;
            while (e && !e.matches("aside.configurator-aside")) {
                const s = getComputedStyle(e);
                const bg = s.backgroundColor !== "rgba(0, 0, 0, 0)" || s.backgroundImage !== "none";
                const rim = ["Top", "Right", "Bottom", "Left"].some(
                    (k) => parseFloat(s.getPropertyValue(`border-${k.toLowerCase()}-width`)) > 0 && s.getPropertyValue(`border-${k.toLowerCase()}-style`) !== "none",
                );
                if (bg || rim || s.boxShadow !== "none") painted.push(`${e.tagName.toLowerCase()}.${e.className.toString().slice(0, 60)}`);
                e = e.parentElement;
            }
            return { painted, reachedAside: !!e };
        });
        console.log(`[au2] L3-5@${width} ${JSON.stringify(between)}`);
        expect(between.reachedAside, "the layers sit inside glass's aside card").toBe(true);
        expect(between.painted, "no consumer surface wraps the layer stack").toEqual([]);
    });
}

// ── L1-11: one upload owner (one file input; the Replace command uses it) ────
test("L1-11 · /w empty and /v loaded: one file input, the view's", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/w");
    await expect(page.getByTestId("image-file-input")).toBeAttached({ timeout: 30_000 });
    const emptyInputs = await page.locator('input[type="file"]').count();
    console.log(`[au2] L1-11 /w fileInputs=${emptyInputs}`);
    expect(emptyInputs, "one file input on the empty workspace").toBe(1);

    await openWorkspace(page);
    const loadedInputs = await page.locator('input[type="file"]').count();
    console.log(`[au2] L1-11 /v fileInputs=${loadedInputs}`);
    expect(loadedInputs, "one file input on the loaded workspace").toBe(1);

    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Replace image" }).click();
    const testId = await (await chooser).element().getAttribute("data-testid");
    expect(testId, "Replace summons the view's one input").toBe("image-file-input");
});
