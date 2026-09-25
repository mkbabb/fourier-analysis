// SERVED MODEL: claude-opus-5-5
import { expect, test, type Page } from "@playwright/test";
import { seededViz } from "./fixtures/seed";
import { SAMPLE_IMAGE } from "./fixtures/sample";

/**
 * X.F.W14V `.u4` — the stage surface and its readouts (F-W14V.md addendum (c)
 * ⊕ F-W14U.md addendum (h): `.vstage` E-1 and E-3, and the PARTIAL limbs of
 * F-71, F-146, F-172, F-238 and F-239).
 *
 * u68  UIA-F-68 ⊕ F-168 (stage limb) — no cartoon-card stamp inside the glass
 *      stage: the canvas root has no border and no offset shadow; the stage
 *      cell is the surface.
 * u170 UIA-F-170 (legend limb) — the readouts agree: the Epicycles legend
 *      counts circles by name, and no legend "N = k" exceeds the Harmonics N.
 * u74  UIA-F-74 — at 390, a finished upload shows the canvas, not the sheet.
 * u71  UIA-F-71 — the first upload shows one busy mark, and it is in view.
 * u146 UIA-F-146 — no tooltip wraps a non-focusable target, and no Tooltip is
 *      a TransitionGroup child (no guard or non-element-root warning on load).
 * u172 UIA-F-172 (non-colour limb) — the magnet's on/off state reads in text,
 *      never by hue alone.
 * u238 UIA-F-238 — reserved compute row (no jump), role=status, the tab strip
 *      off an opaque fill, the reset in the layer header, no 2+1 orphan.
 * u239 UIA-F-239 — no local `GlassTimeline`; the caret readout is glass's
 *      floating plate on the panel radius; at 390 the legend is clear of the
 *      expanded dock.
 *
 * Served from :3100 (BASE_URL) against the API on :8000; data = the e2e global
 * seed; uploads use `SAMPLE_IMAGE` (`fixtures/sample.ts`). `FW14V_PHASE`
 * names the frames (before/after).
 */

const PHASE = process.env.FW14V_PHASE ?? "after";
const FRAMES = "e2e/screenshots/f-w14v/u4";
async function frame(page: Page, name: string): Promise<void> {
    const w = page.viewportSize()!.width;
    await page.screenshot({ path: `${FRAMES}/${PHASE}-${name}-${w}.png` });
}

/** Record every string the canvas draws (text, x, y in CSS px). */
async function recordCanvasText(page: Page): Promise<void> {
    await page.addInitScript(() => {
        const seen: [string, number, number][] = [];
        (window as unknown as { __texts: typeof seen }).__texts = seen;
        const fill = CanvasRenderingContext2D.prototype.fillText;
        CanvasRenderingContext2D.prototype.fillText = function (t: string, x: number, y: number, m?: number) {
            if (this.canvas.classList.contains("canvas-el")) seen.push([String(t), x, y]);
            if (seen.length > 4000) seen.splice(0, 2000);
            return m === undefined ? fill.call(this, t, x, y) : fill.call(this, t, x, y, m);
        };
    });
}

async function canvasTexts(page: Page, since = 0): Promise<[string, number, number][]> {
    return page.evaluate((s) => (window as unknown as { __texts: [string, number, number][] }).__texts.slice(s), since);
}

async function openViz(page: Page): Promise<void> {
    await page.goto(`/v/${seededViz().slug}`);
    if (page.viewportSize()!.width < 1024) await page.getByRole("tab", { name: "Canvas" }).click();
    await expect(page.locator(".animation-dock")).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(600);
}

/** Park the playback at its end: pause, then End on the timeline's thumb. */
async function toEnd(page: Page): Promise<void> {
    const pause = page.getByRole("button", { name: "Pause animation" });
    if (await pause.isVisible()) await pause.click();
    const thumb = page.locator(".animation-dock [role=slider]").first();
    await thumb.focus();
    await page.keyboard.press("End");
    await page.waitForTimeout(500);
}

async function startUpload(page: Page, delayMs: number): Promise<void> {
    await page.route("**/api/images", async (route) => {
        if (route.request().method() !== "POST") return route.fallback();
        await new Promise((r) => setTimeout(r, delayMs));
        await route.fallback();
    });
    await page.goto("/visualize");
    await expect(page.locator(".drop-target")).toBeVisible({ timeout: 60_000 });
    await page.getByTestId("image-file-input").setInputFiles(SAMPLE_IMAGE);
}

/** Busy marks a person can see: glass's dot ring and indeterminate bars. */
async function visibleBusyMarks(page: Page): Promise<string[]> {
    return page.evaluate(() => {
        const seen = (el: Element) => {
            const r = el.getBoundingClientRect();
            if (r.width < 1 || r.height < 1) return false;
            if (r.right <= 0 || r.bottom <= 0 || r.left >= innerWidth || r.top >= innerHeight) return false;
            for (let e: Element | null = el; e; e = e.parentElement) {
                const s = getComputedStyle(e);
                if (s.display === "none" || s.visibility === "hidden" || +s.opacity === 0) return false;
                if (e.classList.contains("panel-inactive")) return false;
            }
            return true;
        };
        const marks = [...document.querySelectorAll("[data-slot=dot-ring], [role=progressbar]:not([aria-valuenow])")];
        return marks.filter(seen).map((m) => m.getAttribute("aria-label") ?? m.closest("button")?.textContent?.trim() ?? m.className.toString());
    });
}

test.describe("X.F.W14V.u4 — the stage surface and its readouts", () => {
    test.setTimeout(90_000);

    for (const width of [1440, 390]) {
        test(`u68 · UIA-F-68 ⊕ F-168 — no cartoon-card stamp inside the stage (${width})`, async ({ page }) => {
            await page.setViewportSize({ width, height: width < 640 ? 844 : 900 });
            await openViz(page);
            const m = await page.evaluate(() => {
                const root = document.querySelector(".canvas-stage canvas.canvas-el")!.parentElement!;
                const s = getComputedStyle(root);
                return {
                    stamps: document.querySelectorAll(".canvas-stage .cartoon-card").length,
                    border: s.borderTopWidth,
                    shadow: s.boxShadow,
                    bg: s.backgroundColor,
                };
            });
            await frame(page, "u68-stage");
            expect(m.stamps, "no cartoon-card inside the stage").toBe(0);
            expect(m.border, "the canvas root draws no border").toBe("0px");
            expect(m.shadow, "the canvas root casts no offset stamp").toBe("none");
            expect(m.bg, "the stage cell is the surface; the canvas root paints none").toBe("rgba(0, 0, 0, 0)");
        });
    }

    test("u170 · UIA-F-170 — the legend and the Harmonics readout agree", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await recordCanvasText(page);
        await openViz(page);
        const harmonics = Number(
            await page.getByRole("spinbutton", { name: "Harmonics" }).inputValue(),
        );
        expect(harmonics).toBeGreaterThan(0);
        const mark = (await canvasTexts(page)).length;
        await toEnd(page);
        const texts = (await canvasTexts(page, mark)).map(([t]) => t.trim());
        await frame(page, "u170-legend-end");
        const ns = texts.map((t) => /^N = (\d+)$/.exec(t)).filter(Boolean).map((m) => Number(m![1]));
        for (const n of ns) expect(n, `a legend "N = ${n}" is not the Harmonics N (${harmonics})`).toBeLessThanOrEqual(harmonics);
        const circles = texts.filter((t) => /^\d+ of \d+ circles$/.test(t)).at(-1);
        expect(circles, "the Epicycles legend names what it counts (circles)").toBeTruthy();
        const [drawn, total] = /^(\d+) of (\d+) circles$/.exec(circles!)!.slice(1).map(Number);
        expect(drawn, "at the end every circle is drawn").toBe(total);
    });

    test("u74 · UIA-F-74 — at 390 a finished upload shows the canvas", async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto("/visualize");
        await expect(page.locator(".drop-target")).toBeVisible({ timeout: 60_000 });
        await page.getByTestId("image-file-input").setInputFiles(SAMPLE_IMAGE);
        await page.waitForURL(/\/w\//, { timeout: 20_000 });
        await expect(page.locator(".canvas-stage")).not.toHaveClass(/panel-inactive/, { timeout: 30_000 });
        await expect(page.locator(".viz-panel-left-wrap")).toHaveClass(/panel-inactive/);
        await expect(page.getByRole("tab", { name: "Canvas" })).toHaveAttribute("aria-selected", "true");
        await page.waitForTimeout(800);
        await frame(page, "u74-after-upload");
    });

    for (const width of [1440, 390]) {
        test(`u71 · UIA-F-71 — the first upload shows one busy mark, in view (${width})`, async ({ page }) => {
            await page.setViewportSize({ width, height: width < 640 ? 844 : 900 });
            await startUpload(page, 3000);
            await page.waitForTimeout(900);
            const marks = await visibleBusyMarks(page);
            await frame(page, "u71-uploading");
            expect(marks, `one visible busy mark while uploading (saw: ${JSON.stringify(marks)})`).toHaveLength(1);
            expect(await page.locator(".animate-spin").count(), "no retired ring").toBe(0);
        });
    }

    test("u146 · UIA-F-146 — no tooltip on a non-focusable target; no Tooltip as a TransitionGroup child", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        const warns: string[] = [];
        page.on("console", (m) => {
            if (m.type() === "warning" || m.type() === "error") warns.push(m.text());
        });
        await openViz(page);
        await page.waitForTimeout(1500);
        const guard = warns.filter((w) => w.startsWith("[Tooltip]"));
        const fragment = warns.filter((w) => w.includes("renders non-element root node"));
        expect(guard, "Tooltip guard: every trigger is a focusable element").toEqual([]);
        expect(fragment, "no fragment root inside a Transition").toEqual([]);
        // Each coefficient row that carries a tooltip is reachable by keyboard.
        const rows = page.locator(".coeff-row");
        expect(await rows.count()).toBeGreaterThan(0);
        for (const tab of await rows.evaluateAll((els) => els.map((e) => (e as HTMLElement).tabIndex)))
            expect(tab, "a coefficient row is focusable").toBeGreaterThanOrEqual(0);
    });

    test("u172 · UIA-F-172 (non-colour limb) — the magnet's state reads in text", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await openViz(page);
        const edit = page.getByRole("button", { name: "Edit contour" }).first();
        await edit.hover();
        await page.waitForTimeout(600);
        await edit.click();
        await expect(page.locator(".canvas-stage > .editor-shell:not(.is-hidden) svg.editor-svg")).toBeVisible();
        const dock = page.locator(".controls-overlay").last();
        const summary = dock.getByRole("button", { name: "Expand dock" });
        if (await summary.isVisible()) {
            await summary.click();
            await page.waitForTimeout(700);
        }
        await dock.getByRole("button", { name: "More editor tools" }).click();
        const menu = page.getByRole("menu");
        const slider = menu.getByRole("slider").first();
        const field = menu.getByRole("spinbutton", { name: /Magnet/ });
        const shown = () => field.evaluate((i: HTMLInputElement) => i.value || i.placeholder);
        await slider.focus();
        await page.keyboard.press("Home");
        await page.waitForTimeout(200);
        await frame(page, "u172-magnet-off");
        expect(await shown(), "radius 0 reads Off").toBe("Off");
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(200);
        expect(await shown(), "radius 1 reads its radius").toBe("1");
        await frame(page, "u172-magnet-on");
        await page.keyboard.press("Home");
    });

    test("u238 · UIA-F-238 — reserved compute row, role=status, the tab strip, the header reset, no orphan", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.route("**/api/contours/*/compute/**", async (route) => {
            await new Promise((r) => setTimeout(r, 6000));
            await route.fallback();
        });
        await page.goto("/visualize");
        await expect(page.locator(".drop-target")).toBeVisible({ timeout: 60_000 });
        await page.getByTestId("image-file-input").setInputFiles(SAMPLE_IMAGE);
        const status = page.locator(".canvas-stage [role=status]").filter({ hasText: "Computing" });
        await expect(status).toBeVisible({ timeout: 30_000 });
        const layer = page.locator("[data-slot=configurator-layer]").filter({ hasText: "Decomposition" }).first();
        // Read once the sidebar's entrance (the glass panel spring) has settled,
        // while the stage still computes.
        await page.waitForTimeout(2500);
        await expect(status).toBeVisible();
        const during = (await layer.boundingBox())!.y;
        expect(await page.locator(".viz-panel-left-wrap [role=progressbar]").count(), "the aside holds no busy bar while the stage computes (its unmount jumped the layers)").toBe(0);
        await expect(status).toBeHidden({ timeout: 60_000 });
        await page.waitForTimeout(800);
        const after = (await layer.boundingBox())!.y;
        expect(Math.abs(after - during), "Decomposition does not jump when computing ends").toBeLessThanOrEqual(1);
        await expect(layer.getByRole("button", { name: "Reset to defaults" }).first()).toBeVisible();
        const tops = await layer.locator("[role=radio], [role=group] button").evaluateAll((els) =>
            [...new Set(els.filter((e) => (e as HTMLElement).offsetParent).map((e) => Math.round(e.getBoundingClientRect().top)))],
        );
        expect(tops.length, "the basis choosers wrap no orphan").toBeLessThanOrEqual(2);
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(600);
        const strip = await page.getByRole("tablist").first().evaluate((t) => {
            // The row that seats the tab list (the shared WorkspaceTabs bar,
            // X.F.W14V.au1), not glass's own list.
            for (let e: Element | null = t.parentElement; e; e = e.parentElement) {
                if (e.classList.contains("workspace-tabs")) {
                    const own = getComputedStyle(e).backgroundColor;
                    return own === "rgba(0, 0, 0, 0)" || own.endsWith(", 0)") ? "transparent" : own;
                }
            }
            return "no strip row";
        });
        expect(strip, "the tab strip sits on no opaque fill of its own").toBe("transparent");
    });

    test("u239 · UIA-F-239 — no local GlassTimeline; the caret is glass's floating plate", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await openViz(page);
        const m = await page.evaluate(() => {
            const row = document.querySelector(".animation-dock .timeline-row") as HTMLElement & {
                __vueParentComponent?: { type: { __name?: string; name?: string } };
            };
            const plate = row.querySelector(".caret-value") as HTMLElement;
            const probe = document.createElement("div");
            probe.style.borderRadius = "var(--radius-panel)";
            row.appendChild(probe);
            const panel = getComputedStyle(probe).borderTopLeftRadius;
            probe.remove();
            const t = row.__vueParentComponent?.type;
            return {
                name: t?.__name ?? t?.name ?? null,
                floating: plate.classList.contains("glass-floating"),
                radius: getComputedStyle(plate).borderTopLeftRadius,
                panel,
            };
        });
        expect(m.name, "the fourier timeline does not shadow glass's namespace").toBe("FourierTimeline");
        expect(m.floating, "the caret readout is glass's floating plate").toBe(true);
        expect(m.radius, "on the panel radius (the popover canon)").toBe(m.panel);
    });

    test("u239b · UIA-F-239 — at 390 the legend is clear of the expanded dock", async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await recordCanvasText(page);
        await openViz(page);
        await page.getByRole("button", { name: "Edit contour" }).first().hover();
        await page.waitForTimeout(900);
        const mark = (await canvasTexts(page)).length;
        await page.waitForTimeout(400);
        const legend = (await canvasTexts(page, mark)).filter(([t, x]) => x < 120 && /Epicycles|circles|^N = /.test(t.trim()));
        expect(legend.length, "the legend draws").toBeGreaterThan(0);
        const geo = await page.evaluate(() => {
            const dock = document.querySelector(".controls-dock-anchor .glass-dock")!.getBoundingClientRect();
            const canvas = document.querySelector(".canvas-stage canvas.canvas-el")!.getBoundingClientRect();
            return { dockBottom: dock.bottom, dockLeft: dock.left, canvasTop: canvas.top, canvasLeft: canvas.left };
        });
        await frame(page, "u239-dock-expanded");
        expect(geo.dockLeft, "the dock is expanded across the legend's column").toBeLessThan(geo.canvasLeft + 120);
        const top = Math.min(...legend.map(([, , y]) => y)) - 8; // the ℱ glyph rides 8 px above its row
        expect(geo.canvasTop + top, "the legend's top is below the expanded dock").toBeGreaterThanOrEqual(geo.dockBottom);
    });
});
