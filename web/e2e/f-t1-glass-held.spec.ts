import { expect, test, type Page } from "@playwright/test";
import { seededViz } from "./fixtures/seed";

/**
 * X·F F-T1 (value.js `realization/fourier-DESIGN-TAIL.md` §A; COHESION §0hs.3):
 * glass holds that had no RED test now each have one. Every case asserts the
 * glass contract its relay letter asks for. It is RED on the pinned glass, so
 * its row sits in `producer-held.json`. The honest-red reporter fails the run
 * the day glass lands it, which forces the adoption. No case overrides a glass
 * class; each one only reads the served page.
 *
 *   LAYER-HEADER-LABEL (O-77a): no ConfiguratorLayer header line ellipsizes.
 *   GLASS-VEIL-GREY    (O-62):  the light-theme dock veil is a light frost, not dark ink.
 *   DOCK-SCROLL-MORPH  (O-55):  the page's ScrollProgressRim is seated in the
 *                               dock's bottom edge (R-2).
 *
 * The rows the design names but no test here can carry are listed, each with
 * its reason, in the F-T1 record (COHESION §0hs.3).
 */

const DESKTOP = { width: 1440, height: 900 };

async function openViz(page: Page): Promise<void> {
    await page.goto(`/v/${seededViz().slug}`);
    await expect(page.locator(".viz-panel-left-wrap")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("button", { name: /Replace image/ })).toBeVisible({ timeout: 30_000 });
    await page.mouse.move(2, 890);
    await page.waitForTimeout(1200);
}

test.describe("F-T1 · glass-held contracts (1440, light)", () => {
    test.use({ viewport: DESKTOP, colorScheme: "light" });
    test.setTimeout(120_000);

    test("O-77a · no layer header line ellipsizes", async ({ page }) => {
        await openViz(page);
        const clipped = await page.locator(".viz-panel-left-wrap").evaluate((root) =>
            [...root.querySelectorAll('[data-slot="configurator-layer-trigger"] *')]
                .filter((el) => el.children.length === 0 && (el.textContent ?? "").trim())
                .filter((el) => el.scrollWidth > el.clientWidth + 0.5 || getComputedStyle(el).textOverflow === "ellipsis")
                .map((el) => `${(el.textContent ?? "").trim()} (${el.scrollWidth}/${el.clientWidth}, ${getComputedStyle(el).textOverflow})`),
        );
        expect(clipped, `LAYER-HEADER-LABEL: header lines that ellipsize or overflow: ${clipped.join("; ")}`).toEqual([]);
    });

    test("O-62 · the light dock veil is a light frost", async ({ page }) => {
        await page.goto("/equation");
        const plate = page.locator(".app-dock .dock-plate").first();
        await expect(plate).toBeAttached({ timeout: 30_000 });
        // The veil's own colour, before its alpha: OKLab lightness of its sRGB channels.
        const read = await plate.evaluate((el) => {
            const bg = getComputedStyle(el).backgroundColor;
            const n = (bg.match(/[\d.]+/g) ?? []).map(Number);
            const srgb = bg.startsWith("color(") ? n.slice(0, 3) : n.slice(0, 3).map((v) => v / 255);
            const lin = srgb.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
            const l = 0.4122214708 * lin[0]! + 0.5363325363 * lin[1]! + 0.0514459929 * lin[2]!;
            const m = 0.2119034982 * lin[0]! + 0.6806995451 * lin[1]! + 0.1073969566 * lin[2]!;
            const s = 0.0883024619 * lin[0]! + 0.2817188376 * lin[1]! + 0.6299787005 * lin[2]!;
            const L = 0.2104542553 * Math.cbrt(l) + 0.793617785 * Math.cbrt(m) - 0.0040720468 * Math.cbrt(s);
            return { bg, L };
        });
        expect(read.L, `GLASS-VEIL-GREY: the light dock veil ${read.bg} has ink lightness ${read.L.toFixed(3)} (a frost is >= 0.6)`).toBeGreaterThanOrEqual(0.6);
    });

    test("O-55 · the scroll progress rim sits in the dock's bottom edge", async ({ page }) => {
        await page.goto("/paper");
        const rim = page.locator(".scroll-progress-rim").first();
        await expect(rim).toBeAttached({ timeout: 30_000 });
        const seated = await rim.evaluate((el) => {
            const dock = document.querySelector(".app-dock");
            if (!dock || !dock.contains(el)) return { inDock: false, detail: "the rim is not inside the app dock" };
            const r = el.getBoundingClientRect();
            const d = dock.getBoundingClientRect();
            return { inDock: Math.abs(r.bottom - d.bottom) <= 2, detail: `rim bottom ${r.bottom} vs dock bottom ${d.bottom}` };
        });
        expect(seated.inDock, `DOCK-SCROLL-MORPH: ${seated.detail}`).toBe(true);
    });
});
