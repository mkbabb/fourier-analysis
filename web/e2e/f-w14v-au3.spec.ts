// SERVED MODEL: claude-opus-5-5
/**
 * X.F.W14V.au3 — the AUDIT-2 equation and morph family (F-W14V.md §1 `.au0…`,
 * F-W14U.md addendum (e), `audit/AUDIT-2-fourier.md` Lens 1). One falsifier
 * per row:
 *
 *   L1-5   one series renderer: /visualize's equation panel renders its body
 *          through EquationResult, so it has the Copy LaTeX action and the
 *          named, keyboard-reachable scroll region /equation has.
 *   L1-6   one coefficients panel: the Coefficients layer on /visualize and
 *          on /equation is mounted by the same component file.
 *   L1-12  the card-title rung is glass's: every /morph card title is a glass
 *          CardTitle in a glass Card, on one size and one gap to its body.
 *   L1-13  `.cartoon-card` is retired app-wide: no element wears it on
 *          /equation, /morph or /visualize, and the class paints nothing
 *          (the local @utility is gone).
 *
 * Served from :3100 (dev, so Vue's component files are readable) against
 * :8000 (BASE_URL), Chromium.
 */
import { expect, test, type Page } from "@playwright/test";

import { seededViz } from "./fixtures/seed";

const DESKTOP = { width: 1440, height: 900 };
const LOAD = 90_000;

async function settle(page: Page, ms = 700): Promise<void> {
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await page.waitForTimeout(ms);
}

async function openViz(page: Page): Promise<void> {
    await page.goto(`/v/${seededViz().slug}`);
    await expect(page.locator(".viz-configurator")).toBeVisible({ timeout: LOAD });
    await settle(page);
}

async function openEquationPanel(page: Page) {
    await openViz(page);
    await page.getByRole("button", { name: "Edit contour" }).first().hover();
    const eq = page.getByRole("button", { name: "Equation", exact: true }).first();
    await expect(eq).toBeVisible();
    await page.waitForTimeout(700);
    await eq.click();
    const panel = page.locator(".eq-panel");
    await expect(panel).toBeVisible();
    await expect(panel.locator(".katex").first()).toBeVisible({ timeout: 30_000 });
    return panel;
}

async function openEquation(page: Page): Promise<void> {
    await page.goto("/equation");
    await expect(page.locator(".eq-card .katex").first()).toBeVisible({ timeout: LOAD });
    await settle(page);
}

async function openMorph(page: Page): Promise<void> {
    await page.goto("/morph");
    await expect(page.getByRole("button", { name: "Morph between the sun and moon shapes" })).toBeVisible({ timeout: LOAD });
    await settle(page);
}

/** The SFC file that mounts the "Coefficients" layer (the nearest component whose file names a coefficients panel). */
function coefficientsOwner(page: Page): Promise<string | null> {
    return page.evaluate(() => {
        type Inst = { type: { __file?: string }; parent: Inst | null };
        const layer = [...document.querySelectorAll<HTMLElement>(".configurator-layer")].find((l) =>
            /^\s*Coefficients/.test(l.textContent ?? ""),
        );
        if (!layer) return null;
        let inst = (layer as unknown as { __vueParentComponent?: Inst }).__vueParentComponent ?? null;
        while (inst) {
            const file = inst.type.__file ?? "";
            if (/CoefficientsPanel\.vue$/.test(file)) return file.replace(/^.*\/src\//, "src/");
            inst = inst.parent;
        }
        return null;
    });
}

/** Count `.cartoon-card` wearers, and what the class paints on a probe element. */
function cartoonCensus(page: Page): Promise<{ wearers: number; probeBorder: string }> {
    return page.evaluate(() => {
        const probe = document.createElement("div");
        probe.className = "cartoon-card";
        document.body.appendChild(probe);
        const probeBorder = getComputedStyle(probe).borderTopWidth;
        probe.remove();
        return { wearers: document.querySelectorAll(".cartoon-card").length, probeBorder };
    });
}

test.describe("X.F.W14V.au3 — equation and morph (1440)", () => {
    test.use({ viewport: DESKTOP });

    test("L1-5 · the /visualize equation panel renders through EquationResult", async ({ page }) => {
        const panel = await openEquationPanel(page);
        await expect(panel.getByRole("button", { name: "Copy LaTeX" }), "the panel has the series' Copy").toHaveCount(1);
        const region = panel.getByRole("region", { name: "Rendered Fourier series" });
        await expect(region, "the series sits in the named scroll region").toHaveCount(1);
        await expect(region).toHaveAttribute("tabindex", "0");
        await expect(region.locator(".katex").first()).toBeVisible();
    });

    test("L1-6 · one coefficients panel on /visualize and /equation", async ({ page }) => {
        await openViz(page);
        const tabCtl = page.getByRole("tab", { name: "Controls" }).filter({ visible: true }).first();
        if (await tabCtl.count()) await tabCtl.click();
        await expect(page.locator(".configurator-layer", { hasText: "Coefficients" }).first()).toBeAttached({ timeout: 30_000 });
        const viz = await coefficientsOwner(page);
        await openEquation(page);
        await expect(page.locator(".configurator-layer", { hasText: "Coefficients" }).first()).toBeAttached({ timeout: 30_000 });
        const eq = await coefficientsOwner(page);
        expect(viz, "the /visualize layer has an owner").not.toBeNull();
        expect(eq, `one component mounts both (read ${viz} | ${eq})`).toBe(viz);
    });

    test("L1-12 · every /morph card title is glass's CardTitle on one rung", async ({ page }) => {
        await openMorph(page);
        const read = await page.evaluate(() => {
            const titles = [...document.querySelectorAll<HTMLElement>("[data-card-title]")].filter(
                (t) => t.getClientRects().length > 0,
            );
            // The rung is the title's size and its own block margins plus the
            // inset of the header that holds it (the drift was a hand-set
            // title margin: --space-residue on one card, --space-body on another).
            return titles.map((t) => {
                const cs = getComputedStyle(t);
                const host = getComputedStyle(t.parentElement!);
                return {
                    text: t.textContent!.trim(),
                    glass: t.matches("[data-slot=card-title]") && !!t.closest("[data-slot=card]"),
                    size: cs.fontSize,
                    gap: `${cs.marginTop}/${cs.marginBottom}/${host.paddingTop}`,
                };
            });
        });
        expect(read.length, "the four /morph cards (three phases, the levels)").toBe(4);
        for (const t of read) expect(t.glass, `${t.text} is a glass CardTitle in a glass Card`).toBe(true);
        expect(new Set(read.map((t) => t.size)).size, `one title size (read ${read.map((t) => t.size)})`).toBe(1);
        expect(new Set(read.map((t) => t.gap)).size, `one title margin and header inset (read ${read.map((t) => t.gap)})`).toBe(1);
    });

    for (const route of ["/morph", "/equation", "/visualize"] as const) {
        test(`L1-13 · no cartoon-card on ${route}, and the class paints nothing`, async ({ page }) => {
            if (route === "/morph") await openMorph(page);
            else if (route === "/equation") await openEquation(page);
            else await openViz(page);
            const c = await cartoonCensus(page);
            expect(c.wearers, "no element wears .cartoon-card").toBe(0);
            expect(c.probeBorder, "the local @utility is retired (a probe paints no stamp)").toBe("0px");
        });
    }

    test("L1-13 · the morph control is a glass Surface, the cards glass Cards", async ({ page }) => {
        await openMorph(page);
        const morph = page.getByRole("button", { name: "Morph between the sun and moon shapes" });
        await expect(morph).toHaveAttribute("data-slot", "surface");
        await expect(page.locator(".config-card[data-slot=card]")).toHaveCount(3);
        await expect(page.locator(".levels-card[data-slot=card]")).toHaveCount(1);
    });
});
