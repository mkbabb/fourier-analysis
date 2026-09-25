// SERVED MODEL: claude-opus-5-5
import { expect, test, type Page } from "@playwright/test";
import { seededViz } from "./fixtures/seed";

/**
 * X.F.W14V.s2 (glass half, adopted early) ⊕ X.F.W14U.a2 — COHESION §0dd, glass
 * 10.1.0 (O-75 CONFIGURATOR-DETACHED, O-68 CONFIGURATOR-HEADER-ACTIONS).
 *
 * da  Owner frame `fourier/evidence/W14/owner-2026-09-24-configurator-shell-band.png`:
 *     the gutter between the stage and the controls pane showed the
 *     Configurator's shell plate, so the two surfaces did not read as distinct.
 *     At 1440×900 and 1024×768, light and dark, the gutter between the stage and
 *     the controls surface is the PAGE GROUND: the median colour of the gutter
 *     has the ground's colour (the median of the margin outside the
 *     Configurator), at most shifted a neutral shade by the cards' casts — its
 *     channel shifts from the ground agree within 4 and it is no more tinted. The
 *     medians are area medians, so the ground's sparse grid lines decide
 *     nothing.
 * db  Owner: "the refresh button should be inline in the section when expanded
 *     too. Ensure proper design hierarchy and usage of space". Every layer's
 *     reset sits in its header row (inside the layer's header, its box on the
 *     label's row), clicking it resets without toggling the layer, and no reset
 *     stays in a layer body.
 *
 * Headed Chromium (`--project chromium --headed`) against the served app.
 */

const PHASE = process.env.FW14V_PHASE ?? "after";
const FRAMES = "e2e/screenshots/f-w14v/s2";

async function openViz(page: Page): Promise<void> {
    await page.goto(`/v/${seededViz().slug}`);
    await expect(page.locator(".viz-panel-left-wrap")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("button", { name: /Replace image/ })).toBeVisible({ timeout: 30_000 });
    await page.mouse.move(2, 890);
    await page.waitForTimeout(1200);
}

type Rgb = [number, number, number];

/** Median colour of each region {x, y, w, h} (CSS px) of the current viewport. */
async function medians(page: Page, boxes: { x: number; y: number; w: number; h: number }[]): Promise<Rgb[]> {
    const png = (await page.screenshot()).toString("base64");
    return page.evaluate(
        async ({ png, boxes }) => {
            const img = new Image();
            img.src = `data:image/png;base64,${png}`;
            await img.decode();
            const c = document.createElement("canvas");
            c.width = img.width;
            c.height = img.height;
            const ctx = c.getContext("2d", { willReadFrequently: true })!;
            ctx.drawImage(img, 0, 0);
            const s = img.width / window.innerWidth;
            return boxes.map(({ x, y, w, h }) => {
                const d = ctx.getImageData(Math.round(x * s), Math.round(y * s),
                    Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s))).data;
                return [0, 1, 2].map((k) => {
                    const v: number[] = [];
                    for (let i = k; i < d.length; i += 4) v.push(d[i]);
                    v.sort((p, q) => p - q);
                    return v[v.length >> 1];
                }) as Rgb;
            });
        },
        { png, boxes },
    );
}

for (const scheme of ["light", "dark"] as const) {
    for (const vp of [
        { width: 1440, height: 900 },
        { width: 1024, height: 768 },
    ]) {
        test.describe(`da · O-75 — the gutter reads the page ground (${vp.width}×${vp.height} ${scheme})`, () => {
            test.use({ viewport: vp, colorScheme: scheme });
            test.setTimeout(90_000);

            test("the stage and the controls pane are each their own surface over the page ground", async ({ page }) => {
                await openViz(page);
                const geo = () => page.evaluate(() => {
                    const r = (el: Element) => el.getBoundingClientRect();
                    const stage = r(document.querySelector(".configurator-stage")!);
                    const aside = r(document.querySelector(".configurator-aside")!);
                    const pane = r(document.querySelector(".viz-panel-left-wrap")!);
                    const shell = r(document.querySelector(".viz-configurator")!);
                    // The controls surface begins at the outermost painted box of
                    // the pane: glass's aside card, or the pane card inset in it.
                    return {
                        stage: { l: stage.left, r: stage.right, t: stage.top, b: stage.bottom },
                        pane: { l: Math.max(aside.left, pane.left), r: Math.min(aside.right, pane.right),
                            t: Math.max(aside.top, pane.top), b: Math.min(aside.bottom, pane.bottom) },
                        shellLeft: shell.left, vh: window.innerHeight,
                    };
                });
                let g = await geo();
                // Beside (two columns) or below (one column: 1024 wide once the
                // shell's own margins take the Configurator under its lg band).
                const beside = g.pane.l >= g.stage.r - 0.5;
                if (!beside) {
                    // Bring the seam into the middle of the viewport.
                    await page.mouse.wheel(0, g.stage.b - g.vh / 2);
                    await page.waitForTimeout(600);
                    g = await geo();
                }
                const gap = beside ? g.pane.l - g.stage.r : g.pane.t - g.stage.b;
                expect(gap, `a gutter between the stage and the pane (${beside ? "beside" : "below"})`).toBeGreaterThanOrEqual(4);
                const box = beside
                    ? { x: g.stage.r + 2, y: Math.max(g.stage.t, g.pane.t) + 40, w: Math.max(1, gap - 4), h: Math.min(g.stage.b, g.pane.b) - Math.max(g.stage.t, g.pane.t) - 80 }
                    : { x: Math.max(g.stage.l, g.pane.l) + 40, y: g.stage.b + 2, w: Math.min(g.stage.r, g.pane.r) - Math.max(g.stage.l, g.pane.l) - 80, h: Math.max(1, gap - 4) };
                // Page ground: the margin outside the Configurator's left edge,
                // over the viewport's rows. Both reads are AREA medians, so the
                // ground's sparse 1 px grid lines do not decide either one.
                expect(g.shellLeft, "the Configurator leaves a page margin to sample").toBeGreaterThanOrEqual(4);
                const [gutter, ground] = await medians(page, [box, { x: 1, y: 80, w: Math.max(1, g.shellLeft - 2), h: g.vh - 160 }]);
                await page.screenshot({ path: `${FRAMES}/${PHASE}-da-${vp.width}-${scheme}.png` });
                // The gutter is the page ground: the same colour, at most a shade
                // lighter or darker where the two cards' casts fall on it (a neutral
                // cast shifts the ground's channels together). A plate in the gutter
                // is its own tint: its channels move apart (the warm shell plate
                // read 242,232,219 over a neutral 227,227,225 ground, and
                // 66,49,37 over 25,24,23 dark).
                const delta = gutter.map((v, i) => v - ground[i]);
                const spread = Math.max(...delta) - Math.min(...delta);
                const chroma = (c: Rgb) => Math.max(...c) - Math.min(...c);
                // X.F.W14V.s2 (verify) — publish the measured pixels, so the
                // record's gutter table is read from the run, not transcribed.
                // The shell's own computed paint is published beside them: the
                // `.glass-opaque` class on it must paint no band.
                const shellPaint = await page.evaluate(() => {
                    const bg = (sel: string) => getComputedStyle(document.querySelector(sel)!).backgroundColor;
                    // O-77 LAYER-HEADER-LABEL (honest-RED, no consumer override):
                    // the header labels that ellipsise beside `#actions`.
                    const clipped = [...document.querySelectorAll(".configurator-layer-trigger *")]
                        .filter((el) => el.children.length === 0 && (el.textContent ?? "").trim() && el.scrollWidth > el.clientWidth + 0.5)
                        .map((el) => `${(el.textContent ?? "").trim()}(${el.scrollWidth}>${el.clientWidth})`);
                    return { shell: bg(".viz-configurator"), grid: bg(".viz-configurator > [data-slot=\"configurator\"]"), clipped: clipped.join(";") || "none" };
                });
                const reading = `${vp.width}x${vp.height} ${scheme} ${beside ? "beside" : "below"} gap=${gap.toFixed(1)} gutter=${gutter} ground=${ground} delta=${delta} spread=${spread} chroma=${chroma(gutter)}/${chroma(ground)} shellBg=${shellPaint.shell} gridBg=${shellPaint.grid} o77Clipped=${shellPaint.clipped}`;
                test.info().annotations.push({ type: "gutter", description: reading });
                console.log(`[f-w14v gutter] ${reading}`);
                expect.soft(spread, `the gutter (${gutter}) is the page ground's colour (${ground}): the shift ${delta} is a neutral shade`).toBeLessThanOrEqual(4);
                expect.soft(chroma(gutter), `the gutter (${gutter}) is no more tinted than the ground (${ground})`).toBeLessThanOrEqual(chroma(ground) + 3);
            });
        });
    }
}

test.describe("db · O-68 — each layer's reset is inline in its header", () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
    test.setTimeout(120_000);

    test("the reset sits on the header row, resets without toggling, and no body reset remains", async ({ page }) => {
        await openViz(page);
        const side = page.locator(".viz-panel-left-wrap");
        // Open the Contour layer (Decomposition opens by default).
        const contourTrigger = side.locator('[data-slot="configurator-layer-trigger"]', { hasText: "Contour" });
        await contourTrigger.click();
        await page.waitForTimeout(500);
        // Move a value off its default in each layer so the reset is live.
        const harmonics = side.getByRole("spinbutton", { name: "Harmonics" });
        await harmonics.fill("40");
        await harmonics.press("Enter");
        const blur = side.getByRole("spinbutton", { name: "Blur Sigma" });
        await blur.fill("1.5");
        await blur.press("Enter");
        await page.waitForTimeout(400);
        await page.screenshot({ path: `${FRAMES}/${PHASE}-db-1440-light.png` });

        const layers = await side.evaluate((root) =>
            [...root.querySelectorAll<HTMLElement>('[data-slot="configurator-layer"]')].map((layer) => {
                const trigger = layer.querySelector('[data-slot="configurator-layer-trigger"]')!;
                const header = trigger.closest('[data-slot="configurator-layer-header"]');
                const resets = [...layer.querySelectorAll<HTMLElement>('button[aria-label="Reset to defaults"]')];
                const t = trigger.getBoundingClientRect();
                return {
                    label: trigger.textContent!.trim().match(/^(Image|Decomposition|Contour|Coefficients)/)?.[1] ?? trigger.textContent!.trim(),
                    resets: resets.map((b) => {
                        const r = b.getBoundingClientRect();
                        const cy = (r.top + r.bottom) / 2;
                        return {
                            inHeader: !!header && header.contains(b) && !trigger.contains(b),
                            onRow: cy >= t.top && cy <= t.bottom,
                        };
                    }),
                };
            }),
        );
        const withReset = layers.filter((l) => l.resets.length);
        expect(withReset.map((l) => l.label).sort(), "the layers that own a reset").toEqual(["Contour", "Decomposition"]);
        for (const l of withReset) {
            expect.soft(l.resets.length, `${l.label}: one reset`).toBe(1);
            expect.soft(l.resets.every((r) => r.inHeader), `${l.label}: the reset is in the header, not the body`).toBe(true);
            expect.soft(l.resets.every((r) => r.onRow), `${l.label}: the reset sits on the label's row`).toBe(true);
        }

        // Clicking it resets and does not toggle the layer.
        for (const [name, field, want] of [["Decomposition", harmonics, "200"], ["Contour", blur, "0.5"]] as const) {
            const layer = side.locator('[data-slot="configurator-layer"]', {
                has: page.locator('[data-slot="configurator-layer-trigger"]', { hasText: name }),
            });
            const trigger = layer.locator('[data-slot="configurator-layer-trigger"]');
            await expect(trigger).toHaveAttribute("aria-expanded", "true");
            await layer.getByRole("button", { name: "Reset to defaults" }).click();
            await page.waitForTimeout(300);
            await expect.soft(trigger, `${name}: the reset does not toggle the layer`).toHaveAttribute("aria-expanded", "true");
            await expect.soft(field, `${name}: the reset restores the default`).toHaveValue(want);
        }
    });
});
