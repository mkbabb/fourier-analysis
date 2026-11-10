// SERVED MODEL: claude-opus-5-5
import { expect, test, type Page } from "@playwright/test";

/**
 * The restraint precept (value.js docs/precepts/restraint.md), fourier's
 * units of the 2026-11-09 feedback canon. Each test is the unit's falsifier:
 * RED on the tree before the unit, GREEN after it.
 *
 * F2  one control per number: a slider and its readout, no second field.
 * F3  one harmonic count: no "Displayed harmonics", the list follows it.
 * F4  the workspace and gallery tabs are glass's default tabs.
 * F5  a portrait tablet shows the plot beside the controls; a phone opens on it.
 * F6  the dock folds when the page scrolls; reading progress is its border.
 * F7  no standing captions.
 * F8  one number format, a true minus, a labelled list, one row per ±n.
 * F9  no bold or caps that the app sets on labels and readings.
 * F10 the morph tiles are not boxed inside their card.
 * F12 the serif faces are woff2.
 * F14 /paper closes the title gap and hides the page count at the top;
 *     /w paints one grid.
 */

const LOAD = 90_000;

async function equation(page: Page): Promise<void> {
    await page.goto("/equation");
    await expect(page.locator(".eq-card .katex").first()).toBeVisible({ timeout: LOAD });
}

async function bodyText(page: Page): Promise<string> {
    return page.evaluate(() => document.body.innerText);
}

test.describe("canon · restraint · fourier", () => {
    test("F2 · F3 · F7 · /equation: one slider, one count, no captions", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await equation(page);
        const aside = page.locator(".eq-panel-left-wrap");
        await expect(aside.getByRole("slider")).toHaveCount(1);
        await expect(aside.getByRole("spinbutton")).toHaveCount(0);
        const text = await bodyText(page);
        for (const caption of [
            "Displayed harmonics",
            "terms in the Fourier sum",
            "DC counts as one",
            "Parabolic arch",
            "harmonics · n =",
            "The expanded equation keeps",
        ]) {
            expect(text, caption).not.toContain(caption);
        }
    });

    test("F3 · the harmonic count is the same at 390 and 1440", async ({ page }) => {
        const counts: string[] = [];
        for (const [width, height] of [[1440, 900], [390, 844]] as const) {
            await page.setViewportSize({ width, height });
            await page.evaluate(() => sessionStorage.clear()).catch(() => {});
            await equation(page);
            await expect(page.locator(".eq-card [data-stale]")).toHaveCount(0);
            const upper = await page.locator(".eq-card .katex-mathml annotation").first().textContent();
            counts.push(upper?.match(/\\sum_\{n=1\}\^\{(\d+)\}/)?.[1] ?? "none");
        }
        expect(counts[0]).not.toBe("none");
        expect(counts[1]).toBe(counts[0]);
    });

    test("F8 · the coefficient list is labelled, paired, with a true minus", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await equation(page);
        const aside = page.locator(".eq-panel-left-wrap");
        await aside.locator('[data-slot="configurator-layer-trigger"]', { hasText: "Coefficients" }).click();
        const list = page.getByRole("region", { name: "Fourier coefficient spectrum" });
        await expect(list).toBeVisible();
        await expect(aside).toContainText("|cn|");
        const rows = await list.locator("li").allInnerTexts();
        expect(rows.length).toBeGreaterThan(1);
        const labels = rows.map((r) => r.trim().split(/\s+/)[0]);
        expect(new Set(labels).size).toBe(labels.length);
        expect(labels.filter((l) => l !== "0").every((l) => l.startsWith("±"))).toBe(true);
        expect(rows.join(" ")).not.toMatch(/(^|\s)-\d/);
    });

    test("F2 · F7 · F9 · F10 · /morph: readouts, no subtitles, plain tiles", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto("/morph");
        await expect(page.locator(".grid-cell").first()).toBeVisible({ timeout: LOAD });
        await expect(page.getByRole("spinbutton")).toHaveCount(0);
        const text = await bodyText(page);
        for (const caption of ["Tune the morph", "Shape degrades", "Cross-fade at low", "Resolves to full"]) {
            expect(text, caption).not.toContain(caption);
        }
        const tiles = await page.locator(".grid-cell").evaluateAll((cells) =>
            cells
                .filter((c) => !c.classList.contains("active"))
                .map((c) => {
                    const s = getComputedStyle(c);
                    return { border: s.borderTopColor, bg: s.backgroundColor, weight: getComputedStyle(c.querySelector(".grid-label")!).fontWeight };
                }),
        );
        for (const t of tiles) {
            expect(t.border).toBe("rgba(0, 0, 0, 0)");
            expect(t.bg).toBe("rgba(0, 0, 0, 0)");
            expect(Number(t.weight)).toBeLessThan(600);
        }
    });

    test("F4 · F5 · 390 opens on the canvas, on glass's default tabs", async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto("/equation");
        const tabs = page.locator(".workspace-tabs .segmented-tabs");
        await expect(tabs).toBeVisible({ timeout: LOAD });
        await expect(tabs).not.toHaveClass(/segmented-tabs--underline/);
        await expect(page.getByRole("tab", { name: "Canvas" })).toHaveAttribute("aria-selected", "true");
    });

    test("F5 · 820 shows the plot beside the controls, no tabs", async ({ page }) => {
        await page.setViewportSize({ width: 820, height: 1180 });
        await page.goto("/equation");
        await expect(page.locator(".eq-panel-right")).toBeVisible({ timeout: LOAD });
        await expect(page.locator(".eq-panel-left-wrap")).toBeVisible();
        await expect(page.getByRole("tablist")).toHaveCount(0);
    });

    test("F6 · /paper: progress is the dock's border; scrolling folds the dock", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto("/paper");
        const dock = page.locator(".app-dock");
        await expect(dock).toHaveClass(/(^|\s)expanded(\s|$)/, { timeout: LOAD });
        await expect(dock.locator(".scroll-progress-rim")).toHaveCount(1);
        await page.mouse.move(720, 600);
        await page.mouse.wheel(0, 900);
        await expect(dock).not.toHaveClass(/(^|\s)expanded(\s|$)/, { timeout: 1_000 });
    });

    test("F9 · F14 · /paper: sentence-case contents, body-face numerals, no dead gap", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto("/paper");
        const label = page.locator(".sidebar-label");
        await expect(label).toBeVisible({ timeout: LOAD });
        expect(await label.evaluate((e) => getComputedStyle(e).textTransform)).toBe("none");
        const numeral = page.locator(".toc-number").first();
        expect(await numeral.evaluate((e) => getComputedStyle(e).fontFamily)).not.toMatch(/Fira|mono/i);
        await expect(page.locator(".page-readout").first()).toBeHidden();
        const gap = await page.evaluate(() => {
            const head = document.querySelector(".paper-title-block")!.getBoundingClientRect();
            const h2 = document.querySelector(".paper-article h2")!.getBoundingClientRect();
            return h2.top - head.bottom;
        });
        expect(gap).toBeLessThan(100);
    });

    test("F14 · /w paints one grid; F7 · no upload captions", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto("/w");
        await expect(page.getByRole("heading", { name: "Draw any outline in circles" })).toBeVisible({ timeout: LOAD });
        await expect(page.locator(".paper-grid")).toHaveCount(1);
        const text = await bodyText(page);
        expect(text).not.toContain("Upload an image:");
        expect(text).not.toContain("10 MB");
    });

    test("F12 · the serif faces load as woff2", async ({ page }) => {
        const fonts: string[] = [];
        page.on("request", (r) => {
            if (r.resourceType() === "font") fonts.push(r.url());
        });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto("/morph");
        await expect(page.locator(".grid-cell").first()).toBeVisible({ timeout: LOAD });
        await page.evaluate(() => document.fonts.ready);
        expect(fonts.filter((u) => /cmun/.test(u)).length).toBeGreaterThan(0);
        expect(fonts.filter((u) => /\.woff(\?|$)/.test(u))).toEqual([]);
    });
});
