// SERVED MODEL: claude-opus-5-5
import { expect, test, type Page } from "@playwright/test";

/**
 * X.F.W14V.eq2 — F-W14V.md addendum (b), COHESION §0dh. The owner called
 * fourier's pages "inconsistent": /visualize is a stage plus a controls
 * inspector on glass's `Configurator layout="detached"`, and /equation is the
 * same shape (a stage of the series and its plot, beside the Function and
 * Coefficients layers). Ruled: one page shape, one primitive.
 *
 * q1  At lg+ (1440×900), /equation mounts ONE glass Configurator with
 *     `data-layout="detached"`. The series card and the convergence plot are in
 *     its `#stage`; the Function and Coefficients sections are ConfiguratorLayers
 *     in its aside. The stage and the aside are two surfaces with a gap between
 *     them. The local grid (`.eq-grid`) and the stage's `cartoon-card` stamps
 *     are gone, and no reset sits in a layer body (a reset lives in `#actions`).
 * q2  Below lg (390×844), the Controls tab shows the aside's layers and no empty
 *     stage box; the Canvas tab shows the stage and hides the aside.
 *
 * Headed Chromium (`--project chromium --headed`) against the served app.
 */

const PHASE = process.env.FW14V_PHASE ?? "after";
const FRAMES = "e2e/screenshots/f-w14v/eq2";
const LOAD = 90_000;

async function openEquation(page: Page): Promise<void> {
    await page.goto("/equation");
    await expect(page.locator(".configurator-layer").first()).toBeVisible({ timeout: LOAD });
    if (page.viewportSize()!.width >= 1024) {
        await expect(page.locator(".eq-card .katex").first()).toBeVisible({ timeout: LOAD });
    }
    await page.mouse.move(2, 2);
    await page.waitForTimeout(600);
}

test.describe("X.F.W14V.eq2 — q1 /equation on the detached Configurator (1440)", () => {
    test.use({ viewport: { width: 1440, height: 900 } });
    test("q1 one detached Configurator: series + plot in #stage, sections as layers in the aside", async ({ page }) => {
        await openEquation(page);
        const cfg = page.locator('[data-slot="configurator"]');
        await expect(cfg, "one glass Configurator on /equation").toHaveCount(1);
        await expect(cfg, "layout is detached").toHaveAttribute("data-layout", "detached");

        const stage = cfg.locator(":scope > .configurator-stage");
        const aside = cfg.locator(":scope > .configurator-aside");
        await expect(stage.locator(".eq-card"), "the series card is in #stage").toHaveCount(1);
        await expect(stage.locator(".eq-plot-card"), "the convergence plot is in #stage").toHaveCount(1);
        await expect(stage.locator(".cartoon-card"), "no local card stamp inside the stage").toHaveCount(0);
        await expect(page.locator(".eq-grid"), "the local grid is retired").toHaveCount(0);

        const layers = aside.locator(".configurator-layer");
        expect(await layers.count(), "the Function and Coefficients sections are layers in the aside").toBeGreaterThanOrEqual(2);
        await expect(aside.locator(".configurator-layer-body").getByRole("button", { name: /reset/i }),
            "no reset in a layer body (resets go in #actions)").toHaveCount(0);

        const s = (await stage.boundingBox())!;
        const a = (await aside.boundingBox())!;
        const gap = a.x >= s.x + s.width ? a.x - (s.x + s.width) : s.x - (a.x + a.width);
        expect(gap, "the stage and the aside are two surfaces with a gap").toBeGreaterThan(0);
    });
});

test.describe("X.F.W14V.eq2 — q2 /equation below lg (390)", () => {
    test.use({ viewport: { width: 390, height: 844 } });
    test("q2 Controls tab shows the layers and no empty stage box; Canvas tab shows the stage", async ({ page }) => {
        await openEquation(page);
        const cfg = page.locator('[data-slot="configurator"][data-layout="detached"]');
        await expect(cfg).toHaveCount(1);
        const stage = cfg.locator(":scope > .configurator-stage");
        const aside = cfg.locator(":scope > .configurator-aside");
        await expect(aside.locator(".configurator-layer").first()).toBeVisible();
        const sb = await stage.boundingBox();
        expect(sb === null || sb.height === 0, "no empty stage box above the controls").toBe(true);

        await page.getByRole("tab", { name: "Canvas" }).click();
        await expect(stage.locator(".eq-card .katex").first()).toBeVisible({ timeout: LOAD });
        const ab = await aside.boundingBox();
        expect(ab === null || ab.height === 0, "the aside is hidden on the Canvas tab").toBe(true);
        const vw = page.viewportSize()!.width;
        const s = (await stage.boundingBox())!;
        expect(s.x + s.width, "the stage fits the viewport").toBeLessThanOrEqual(vw);
    });
});

for (const scheme of ["light", "dark"] as const) {
    for (const [w, h] of [[1440, 900], [390, 844]] as const) {
        test.describe(`X.F.W14V.eq2 — frames ${w} ${scheme}`, () => {
            test.use({ viewport: { width: w, height: h }, colorScheme: scheme });
            test(`frames ${w} ${scheme}`, async ({ page }) => {
                await openEquation(page);
                await page.screenshot({ path: `${FRAMES}/${PHASE}-${w}-${scheme}.png` });
                if (w < 1024) {
                    await page.getByRole("tab", { name: "Canvas" }).click();
                    await expect(page.locator(".eq-card .katex").first()).toBeVisible({ timeout: LOAD });
                    await page.waitForTimeout(600);
                    await page.screenshot({ path: `${FRAMES}/${PHASE}-${w}-${scheme}-canvas.png` });
                }
            });
        });
    }
}
