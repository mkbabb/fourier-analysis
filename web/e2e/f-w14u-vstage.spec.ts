// SERVED MODEL: claude-opus-5-5
import { expect, test, type Page } from "@playwright/test";
import * as path from "node:path";
import { seededViz } from "./fixtures/seed";

/**
 * X.F.W14U.vstage — the Visualize stage's family (spec `F-W14U.md` Units :8-18;
 * register `audit/UI-AUDIT-fourier.md` sections visualize-empty,
 * -loading-error, -loaded-image-mode, -publish-flow). One case per cured row
 * (or per rows cured by one act); every case frames the served page under
 * `FW14U_PHASE` (before | after) in `e2e/screenshots/f-w14u/vstage/`.
 *
 * e69   UIA-F-69 ⊕ F-165 ⊕ F-237 — the empty stage is composed: one h1, a
 *       lede, the primary action (primary emphasis, copy that does not say
 *       "click"), a secondary path to the gallery; the canvas paints no second
 *       grid under the page's; at 390 the chassis keeps the 16 px gutter.
 * e166  UIA-F-166 ⊕ F-237 — a drag over the stage signals on the whole stage;
 *       a drop on the header band does not navigate; a rejected file says why;
 *       with an image, no page-covering hand-rolled overlay.
 * e167  UIA-F-167 — an upload failure is shown at the drop target, never as
 *       "Could not load this workspace"; nothing throws unhandled.
 * e70   UIA-F-70 ⊕ F-71 ⊕ F-238 — a cold load keeps the Configurator chassis:
 *       the busy mark (role=status, no retired ring) and the error card render
 *       inside the stage.
 * e73   UIA-F-73 — while computing, the stage says so in the DOM (role=status)
 *       and the canvas paints no dashed "drop here" box.
 * e133  UIA-F-133 (consumer) — the upload button says what is happening.
 * e95   UIA-F-95 ⊕ F-245 — logged out, Publish sends nothing and opens the
 *       shell's inline sign-in (X.F.W14V.p: no toast).
 * e169  UIA-F-169 — the sidebar spends no height on duplicates: a compact image
 *       row, no Preview layer, one amplitude view.
 * e170  UIA-F-170 ⊕ F-238 — the Fourier mode is a three-option chooser, the
 *       polynomial bases a toggle group; no hidden cycle, no 2+1 orphan.
 * e171  UIA-F-171 ⊕ F-146 ⊕ F-172 — Advanced is a glass Button disclosure; no
 *       tooltip wraps a non-focusable control. F-172's "one slider accent" is
 *       INVERTED by X.F.W14U.c1 (addendum (g)): each slider wears its owner's
 *       hue and the pressed basis chip carries its basis tint.
 * e239  UIA-F-239 (media half) — the image preview's corner rounds the image,
 *       not letterbox space.
 *
 * Data: the e2e global seed (`e2e/global-seed.ts`) for the saved
 * visualization; uploads use `assets/animals/golden-retriever.webp`. Network
 * failures and delays are stubbed with `page.route`, never seeded.
 */

const PHASE = process.env.FW14U_PHASE ?? "after";
const FRAMES = "e2e/screenshots/f-w14u/vstage";
const TEST_IMAGE = path.resolve(import.meta.dirname, "../../assets/animals/golden-retriever.webp");

async function frame(page: Page, name: string): Promise<void> {
    const w = page.viewportSize()!.width;
    await page.screenshot({ path: `${FRAMES}/${PHASE}-${name}-${w}.png` });
}

async function openEmpty(page: Page): Promise<void> {
    await page.goto("/visualize");
    await expect(page.locator(".drop-target")).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(500);
}

/** Open the seeded visualization and wait for its animation dock. */
async function openViz(page: Page): Promise<void> {
    const viz = seededViz();
    await page.goto(`/v/${viz.slug}`);
    if (page.viewportSize()!.width < 1024) await page.getByRole("tab", { name: "Controls" }).click();
    await expect(page.locator(".viz-panel-left-wrap")).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(600);
}

/** Painted (alpha > 0) backing pixels of the stage canvas, whole or one row. */
async function painted(page: Page, rowFrac?: number): Promise<number> {
    return page.evaluate((rf) => {
        const c = document.querySelector(".canvas-stage canvas") as HTMLCanvasElement;
        const ctx = c.getContext("2d")!;
        const y = rf === undefined ? 0 : Math.round(c.height * rf);
        const h = rf === undefined ? c.height : 1;
        const d = ctx.getImageData(0, y, c.width, h).data;
        let n = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
        return n;
    }, rowFrac);
}

/** A DataTransfer holding one file, built in the page. */
async function dispatchDrag(page: Page, selector: string, type: string, file: { name: string; mime: string }) {
    return page.evaluate(
        ({ selector, type, file }) => {
            const dt = new DataTransfer();
            dt.items.add(new File(["x"], file.name, { type: file.mime }));
            const el = document.querySelector(selector)!;
            const ev = new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt });
            el.dispatchEvent(ev);
            return ev.defaultPrevented;
        },
        { selector, type, file },
    );
}

const WIDTHS = [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
];

for (const vp of WIDTHS) {
    test.describe(`F.W14U.vstage — the empty stage (${vp.width})`, () => {
        test.use({ viewport: vp, colorScheme: "light" });
        test.setTimeout(90_000);

        test("e69 · F-69 ⊕ F-165 ⊕ F-237 — a composed empty state on one grid and the gutter", async ({ page }) => {
            await openEmpty(page);
            await frame(page, "e69-empty");
            const stage = page.locator(".canvas-stage");
            // F-165: one h1 for the route, in the stage.
            await expect(page.locator("h1:visible")).toHaveCount(1);
            await expect(stage.getByRole("heading", { level: 1 })).toBeVisible();
            // F-69 / F-165: the primary action is primary, and says what it does.
            const primary = page.locator('.drop-target [data-emphasis="primary"]');
            await expect(primary).toHaveCount(1);
            await expect(primary).toHaveAccessibleName(/choose an image/i);
            await expect(primary).not.toHaveAccessibleName(/click/i);
            // F-69: a secondary path.
            await expect(page.locator(".drop-target").getByRole("button", { name: "Browse the gallery" })).toBeVisible();
            // F-237: the canvas paints no second grid under the page's.
            expect(await painted(page)).toBe(0);
            // F-237: the 16 px gutter at 390.
            if (vp.width < 1024) {
                const r = await page.locator(".viz-configurator").evaluate((el) => {
                    const b = el.getBoundingClientRect();
                    return { l: b.left, r: document.documentElement.clientWidth - b.right };
                });
                expect(r.l).toBeGreaterThanOrEqual(15.5);
                expect(r.r).toBeGreaterThanOrEqual(15.5);
            }
        });
    });
}

test.describe("F.W14U.vstage — drops and upload failures (1440)", () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
    test.setTimeout(90_000);

    test("e166 · F-166 ⊕ F-237 — the stage signals, the header band cannot navigate, a rejection says why", async ({ page }) => {
        await openEmpty(page);
        const png = { name: "shape.png", mime: "image/png" };
        await dispatchDrag(page, ".canvas-stage", "dragenter", png);
        await expect(page.locator(".canvas-stage")).toHaveAttribute("data-dragging", "true");
        await frame(page, "e166-dragover-stage");
        await dispatchDrag(page, ".canvas-stage", "dragleave", png);
        // A drop outside the view (the header band) is prevented at the window.
        expect(await dispatchDrag(page, "header", "dragover", png)).toBe(true);
        expect(await dispatchDrag(page, "header", "drop", png)).toBe(true);
        // A rejected file says why, at the drop target.
        await dispatchDrag(page, ".drop-target", "drop", { name: "notes.txt", mime: "text/plain" });
        await expect(page.locator(".drop-target").getByRole("alert")).toContainText("notes.txt");
        await frame(page, "e166-rejected");
        // With an image: the stage signals; no page-covering overlay.
        await openViz(page);
        await dispatchDrag(page, ".canvas-stage", "dragenter", png);
        await expect(page.locator(".canvas-stage")).toHaveAttribute("data-dragging", "true");
        await frame(page, "e166-dragover-loaded");
        const covering = await page.evaluate(() =>
            [...document.querySelectorAll("body *")].filter((el) => {
                // The page's own decorative ground (the fixed paper grid) takes no
                // pointer; a drag overlay does.
                const cs = getComputedStyle(el);
                if (cs.position !== "fixed" || cs.pointerEvents === "none") return false;
                const b = el.getBoundingClientRect();
                return b.width * b.height > 0.5 * innerWidth * innerHeight && getComputedStyle(el).opacity !== "0";
            }).length,
        );
        expect(covering).toBe(0);
    });

    test("e167 · F-167 — an upload failure is shown at the drop target; an unknown slug throws nothing", async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await page.route("**/api/images", (route) =>
            route.request().method() === "POST"
                ? route.fulfill({
                      status: 500,
                      contentType: "application/problem+json",
                      body: JSON.stringify({ type: "about:blank", title: "Internal Server Error", status: 500, detail: "storage offline" }),
                  })
                : route.fallback(),
        );
        await openEmpty(page);
        await page.getByTestId("image-file-input").setInputFiles(TEST_IMAGE);
        await expect(page.locator(".drop-target").getByRole("alert")).toBeVisible({ timeout: 20_000 });
        await expect(page.getByText(/Could not load this workspace/)).toHaveCount(0);
        await frame(page, "e167-upload-failed");
        await page.goto("/w/no-such-image-slug");
        await expect(page.getByTestId("not-found")).toBeVisible({ timeout: 30_000 });
        await page.waitForTimeout(500);
        expect(errors).toEqual([]);
    });
});

for (const vp of WIDTHS) {
    test.describe(`F.W14U.vstage — loading and error keep the chassis (${vp.width})`, () => {
        test.use({ viewport: vp, colorScheme: "light" });
        test.setTimeout(90_000);

        test("e70 · F-70 ⊕ F-71 ⊕ F-238 — the busy mark and the error card render inside the stage", async ({ page }) => {
            const viz = seededViz();
            await page.route(`**/api/visualizations/${viz.slug}`, async (route) => {
                await new Promise((r) => setTimeout(r, 4000));
                await route.fallback();
            });
            await page.goto(`/v/${viz.slug}`);
            const busy = page.locator(".configurator-stage").getByRole("status").filter({ hasText: /Loading/ });
            await expect(busy).toBeVisible({ timeout: 3500 });
            await frame(page, "e70-coldload");
            await expect(page.locator(".viz-configurator")).toBeVisible();
            await expect(page.locator(".animate-spin")).toHaveCount(0);
            await page.goto("/v/no-such-slug");
            await expect(page.locator(".configurator-stage").getByTestId("not-found")).toBeVisible({ timeout: 30_000 });
            await frame(page, "e70-error");
        });
    });
}

for (const scheme of ["light", "dark"] as const) {
    test.describe(`F.W14U.vstage — computing (1440 ${scheme})`, () => {
        test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme });
        test.setTimeout(90_000);

        test("e73 · F-73 — the stage says computing in the DOM; the canvas paints no drop box", async ({ page }) => {
            await page.route("**/api/contours/*/compute/**", async (route) => {
                await new Promise((r) => setTimeout(r, 6000));
                await route.fallback();
            });
            const viz = seededViz();
            await page.goto(`/v/${viz.slug}`);
            const busy = page.locator(".configurator-stage").getByRole("status").filter({ hasText: /Computing/ });
            await expect(busy).toBeVisible({ timeout: 20_000 });
            await page.waitForTimeout(300);
            await frame(page, `e73-computing-${scheme}`);
            // The row the dashed box's top edge would lie on: across the box's
            // 280 css px a dashed stroke paints ~60 %; a grid paints ~7 px.
            const row = await page.evaluate(() => {
                const c = document.querySelector(".canvas-stage canvas") as HTMLCanvasElement;
                const s = c.height / c.clientHeight;
                const by = Math.round(((c.clientHeight - 100) / 2) * s);
                const bw = Math.min(280, c.clientWidth * 0.6) * s;
                const x0 = Math.round((c.width - bw) / 2);
                const d = c.getContext("2d")!.getImageData(x0, by, Math.round(bw), 1).data;
                let n = 0;
                for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
                return { n, s };
            });
            expect(row.n).toBeLessThan(40 * row.s);
        });
    });
}

test.describe("F.W14U.vstage — upload and publish (1440)", () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
    test.setTimeout(90_000);

    test("e133 · F-133 (consumer) — the upload button says it is uploading", async ({ page }) => {
        await page.route("**/api/images", async (route) => {
            if (route.request().method() !== "POST") return route.fallback();
            await new Promise((r) => setTimeout(r, 4000));
            await route.fallback();
        });
        await openEmpty(page);
        await page.getByTestId("image-file-input").setInputFiles(TEST_IMAGE);
        const primary = page.locator(".drop-target button").first();
        await expect(primary).toHaveAttribute("aria-busy", "true", { timeout: 3000 });
        await expect(primary).toHaveAccessibleName(/Uploading/);
        await frame(page, "e133-uploading");
    });

    test("e95 · F-95 ⊕ F-245 — logged out, Publish sends nothing and opens the inline sign-in", async ({ page }) => {
        let posts = 0;
        await page.route("**/api/visualizations", (route) => {
            if (route.request().method() === "POST") posts++;
            return route.fallback();
        });
        const viz = seededViz();
        await page.goto(`/v/${viz.slug}`);
        await expect(page.getByRole("button", { name: "Log in" })).toBeVisible({ timeout: 30_000 });
        await page.getByRole("button", { name: "Edit contour" }).first().hover();
        const publish = page.getByRole("button", { name: "Publish to Gallery" }).first();
        await expect(publish).toBeVisible();
        await page.waitForTimeout(600);
        await publish.click();
        await page.waitForTimeout(2500);
        await frame(page, "e95-publish-logged-out");
        expect(posts).toBe(0);
        // X.F.W14V.p restated: the way to publish is the shell's inline sign-in, not a toast.
        await expect(page.locator('[data-slot="toast"]')).toHaveCount(0);
        await expect(page.locator("#user-slug-input")).toBeVisible();
    });
});

for (const vp of WIDTHS) {
    test.describe(`F.W14U.vstage — the loaded image mode's sidebar (${vp.width})`, () => {
        test.use({ viewport: vp, colorScheme: "light" });
        test.setTimeout(120_000);

        test("e169 ⊕ e239 · F-169 ⊕ F-239 — a compact image row, no Preview layer, one amplitude view", async ({ page }) => {
            await openViz(page);
            const side = page.locator(".viz-panel-left-wrap");
            const img = side.locator('img[alt="Uploaded image"]');
            await expect(img).toBeVisible({ timeout: 30_000 });
            await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
            await frame(page, "e169-sidebar");
            const m = await img.evaluate((el: HTMLImageElement) => {
                const b = el.getBoundingClientRect();
                const btn = [...el.closest(".viz-panel-left-wrap")!.querySelectorAll("button")].find((x) =>
                    /Replace image/.test(x.textContent ?? ""),
                )!.getBoundingClientRect();
                return {
                    h: b.height,
                    boxAspect: b.width / b.height,
                    imgAspect: el.naturalWidth / el.naturalHeight,
                    radius: parseFloat(getComputedStyle(el).borderTopLeftRadius),
                    sameRow: btn.top < b.bottom && btn.bottom > b.top,
                };
            });
            // F-169: the image is a compact row with its Replace action.
            expect(m.h).toBeLessThanOrEqual(96);
            expect(m.sameRow).toBe(true);
            // F-239: the corner rounds the image itself (its box is the image's aspect).
            expect(m.radius).toBeGreaterThan(0);
            expect(Math.abs(m.boxAspect / m.imgAspect - 1)).toBeLessThan(0.03);
            // F-169: one amplitude view in Coefficients.
            await side.locator('[data-slot="configurator-layer-trigger"]', { hasText: "Coefficients" }).click();
            await page.waitForTimeout(500);
            await expect(side.locator(".freq-graph-host")).toHaveCount(0);
            // F-169: no Preview layer in the editor.
            if (vp.width < 1024) await page.getByRole("tab", { name: "Canvas" }).click();
            await page.getByRole("button", { name: "Edit contour" }).first().click();
            if (vp.width < 1024) await page.getByRole("tab", { name: "Controls" }).click();
            await page.waitForTimeout(600);
            await frame(page, "e169-editor-panel");
            await expect(side.locator('[data-slot="configurator-layer-trigger"]', { hasText: "Preview" })).toHaveCount(0);
        });

        test("e170 · F-170 ⊕ F-238 — the Fourier mode is a three-option chooser; no 2+1 orphan", async ({ page }) => {
            await openViz(page);
            const side = page.locator(".viz-panel-left-wrap");
            await frame(page, "e170-decomposition");
            await expect(side.locator(".basis-toggle")).toHaveCount(0);
            // A one-of-three chooser is a radio group; the bases are a group of toggles.
            const fourier = side.getByRole("radiogroup", { name: "Fourier mode" });
            await expect(fourier).toBeVisible();
            // Adjacent (X.F.W14U.c2): the modes carry the aria-hidden ℱ glyph, so
            // each is found by its accessible name, which the glyph leaves unchanged.
            for (const name of ["Epicycles", "Series", "Off"]) await expect(fourier.getByRole("radio", { name, exact: true })).toBeVisible();
            const poly = side.getByRole("group", { name: "Polynomial bases" });
            await expect(poly).toBeVisible();
            // Each group sits on one row.
            for (const g of [fourier, poly]) {
                const tops = await g.locator('[data-state]').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
                expect(new Set(tops).size).toBe(1);
            }
            // X.F.W14U.c2 — §0db: the basis glyphs are back on the chips, inside
            // glass's ToggleGroupItem: ℱ on Epicycles and Series, Tₙ and Pₙ on
            // the polynomial bases; "Off" is not a basis and wears none.
            const glyphs = await side.locator('[data-slot="toggle-group-item"]').evaluateAll((els) =>
                els.map((e) => [e.textContent!.replace(/\s+/g, " ").trim(), e.querySelector(".basis-icon")?.textContent?.trim() ?? null]),
            );
            expect.soft(Object.fromEntries(glyphs), "each basis chip wears its glyph").toEqual({
                "ℱ Epicycles": "ℱ", "ℱ Series": "ℱ", Off: null, "Tₙ Chebyshev": "Tₙ", "Pₙ Legendre": "Pₙ",
            });
            await fourier.getByRole("radio", { name: "Series", exact: true }).click();
            await expect(fourier.locator('[data-state="on"]')).toHaveCount(1);
            await expect(fourier.locator('[data-state="on"]')).toContainText("Series");
        });

        test("e171 · F-171 ⊕ F-146 ⊕ F-172 — Advanced is a glass disclosure; tooltips only on focusable triggers; each slider its owner's hue", async ({ page }) => {
            await openViz(page);
            const side = page.locator(".viz-panel-left-wrap");
            await side.locator('[data-slot="configurator-layer-trigger"]', { hasText: "Contour" }).click();
            const adv = side.getByRole("button", { name: "Advanced" });
            await expect(adv).toBeVisible();
            await adv.click();
            await page.waitForTimeout(500);
            await frame(page, "e171-contour-advanced");
            // glass's Button (its emphasis attribute), seated as the Collapsible's
            // trigger (which names the element's data-slot).
            await expect(adv).toHaveAttribute("data-emphasis", "quiet");
            await expect(adv).toHaveAttribute("aria-expanded", "true");
            await expect(side.locator(".advanced-divider")).toHaveCount(0);
            // The Decomposition and Contour layers (this unit's; the spectrum
            // rows' tooltips are CoefficientsSpectrum's, a residual).
            const unfocusable = await side.evaluate((root) =>
                [...root.querySelectorAll('[data-slot="configurator-layer-trigger"]')]
                    .filter((t) => /^(Decomposition|Contour)/.test(t.textContent?.trim() ?? ""))
                    .map((t) => t.closest('[data-slot="configurator-layer"]') ?? t.parentElement!)
                    .flatMap((layer) => [...layer.querySelectorAll("[data-grace-area-trigger]")])
                    .filter((el) => (el as HTMLElement).tabIndex < 0).length,
            );
            expect(unfocusable).toBe(0);
            const fills = await side.evaluate((root) =>
                [...root.querySelectorAll<HTMLElement>('[style*="--row-fill"]')].map((el) => el.style.getPropertyValue("--track-color").trim()),
            );
            expect(fills.length).toBeGreaterThan(3);
            // X.F.W14U.c1 — addendum (g), COHESION §0da: the owner reverses F-172's
            // colour limb. INVERTED (never deleted): the sliders do NOT share one
            // accent; each wears its owner's hue from the one palette, and none is
            // the error ink.
            expect.soft(new Set(fills).size, "the sliders do not share one accent").toBeGreaterThan(1);
            const hues = await side.evaluate((root, owner) => {
                const probe = document.createElement("span");
                root.appendChild(probe);
                const cvs = document.createElement("canvas");
                cvs.width = cvs.height = 1;
                const ctx = cvs.getContext("2d", { willReadFrequently: true })!;
                /** The used colour of `css`, painted opaque over white, as 0-255 rgb. */
                const rgb = (css: string, under = "#fff"): number[] => {
                    probe.style.color = "";
                    probe.style.color = css;
                    const used = getComputedStyle(probe).color;
                    ctx.clearRect(0, 0, 1, 1);
                    ctx.fillStyle = under;
                    ctx.fillRect(0, 0, 1, 1);
                    ctx.fillStyle = used;
                    ctx.fillRect(0, 0, 1, 1);
                    return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)];
                };
                const destructive = rgb("var(--destructive)");
                const sliders = [...root.querySelectorAll<HTMLElement>('[style*="--row-fill"]')].map((el) => {
                    const label = el.closest("[data-control-row]")?.querySelector("[data-row-label]")?.textContent?.trim() ?? "";
                    const token = owner[label];
                    return {
                        label,
                        track: rgb(el.style.getPropertyValue("--track-color").trim()),
                        want: token ? rgb(`var(${token})`) : null,
                    };
                });
                /** HSL hue (deg) and chroma (max - min, 0-255) of an rgb triple. */
                const hc = ([r, g, b]: number[]) => {
                    const max = Math.max(r, g, b), min = Math.min(r, g, b), c = max - min;
                    if (c === 0) return { hue: NaN, chroma: 0 };
                    const h = max === r ? ((g - b) / c) % 6 : max === g ? (b - r) / c + 2 : (r - g) / c + 4;
                    return { hue: (h * 60 + 360) % 360, chroma: c };
                };
                // The pressed basis chips: their computed background, composited
                // over white (mixing toward white keeps the HSL hue exactly).
                const CHIP_OWNER: Record<string, string> = {
                    Epicycles: "--viz-fourier", Series: "--viz-fourier",
                    Chebyshev: "--viz-chebyshev", Legendre: "--viz-legendre",
                };
                const chips = [...root.querySelectorAll<HTMLElement>('[data-slot="toggle-group-item"][data-state="on"]')]
                    .map((el) => {
                        const label = [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE)
                            .map((n) => n.textContent).join("").trim();
                        const token = CHIP_OWNER[label];
                        return {
                            label,
                            bg: hc(rgb(getComputedStyle(el).backgroundColor)),
                            want: token ? hc(rgb(`var(${token})`)) : null,
                        };
                    });
                probe.remove();
                return { destructive, sliders, chips };
            }, {
                Harmonics: "--viz-fourier",
                "Sample Points": "--viz-chebyshev",
                "ML Threshold": "--viz-amber",
                "Blur Sigma": "--viz-amber",
                "Min Area %": "--viz-amber",
                "Max Contours": "--viz-amber",
                Smoothing: "--viz-amber",
            } as Record<string, string>);
            for (const s of hues.sliders) {
                expect.soft(s.want, `slider "${s.label}" has an owner`).not.toBeNull();
                const off = Math.max(...s.track.map((v, i) => Math.abs(v - s.want![i])));
                expect.soft(off, `slider "${s.label}" wears its owner's hue (track ${s.track} vs ${s.want})`).toBeLessThanOrEqual(3);
                expect.soft(s.track, `slider "${s.label}" is not the error ink`).not.toEqual(hues.destructive);
            }
            expect(hues.chips.map((c) => c.label)).toContain("Epicycles");
            for (const c of hues.chips) {
                if (!c.want) continue; // "Off" is not a basis
                const d = Math.abs(((c.bg.hue - c.want.hue + 540) % 360) - 180);
                expect.soft(c.bg.chroma, `the pressed ${c.label} chip is tinted (chroma ${c.bg.chroma})`).toBeGreaterThanOrEqual(6);
                expect.soft(d, `the pressed ${c.label} chip carries its basis hue (${c.bg.hue} vs ${c.want.hue})`).toBeLessThanOrEqual(20);
            }
        });
    });
}

for (const vp of WIDTHS) {
    test.describe(`F.W14U.vstage — the error card (${vp.width})`, () => {
        test.use({ viewport: vp, colorScheme: "light" });
        test.setTimeout(90_000);

        test("e168 · F-168 (error limb) — the load error is glass's Card with a heading, no stamp", async ({ page }) => {
            await page.goto("/v/no-such-slug");
            const card = page.getByTestId("not-found");
            await expect(card).toBeVisible({ timeout: 30_000 });
            await frame(page, "e168-error");
            await expect(card).not.toHaveClass(/cartoon-card/);
            await expect(card.getByRole("heading", { name: "Could not open this visualization" })).toBeVisible();
            await expect(card.getByText(/workspace/i)).toHaveCount(0);
        });
    });
}
