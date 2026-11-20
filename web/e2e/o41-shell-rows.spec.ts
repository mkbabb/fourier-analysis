import { expect, test, type Page } from "@playwright/test";
import { showView } from "./fixtures/workspace";

/**
 * The small rows of the FORTY-FIRST and FORTY-SECOND build, each deft: the
 * slider's thumb (nothing painted inside it), /equation's controls card ending
 * with its content, words that restate their control, read text at the small
 * step, the coarse control scale, and the plot dock's seats on the touch cell.
 */

async function equation(page: Page): Promise<void> {
    await page.goto("/equation");
    await expect(page.locator(".eq-card .katex").first()).toBeVisible({ timeout: 90_000 });
}

test.describe("desk rows", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("audit 14: nothing the site paints sits inside a slider's thumb; it wears the fill's colour", async ({ page }) => {
        await equation(page);
        const row = page.locator("[data-control-row] .glass-slider").first();
        await expect(row).toBeVisible();
        const m = await row.evaluate((r) => {
            const thumb = r.querySelector<HTMLElement>(".slider-thumb")!;
            const range = r.querySelector<HTMLElement>(".slider-range")!;
            const probe = document.createElement("span");
            probe.style.color = getComputedStyle(range).getPropertyValue("--liquid-fill-tint");
            r.appendChild(probe);
            const fill = getComputedStyle(probe).color;
            probe.remove();
            return { image: getComputedStyle(thumb).backgroundImage, color: getComputedStyle(thumb).backgroundColor, fill };
        });
        expect(m.image, "no disc painted in the thumb").toBe("none");
        expect(m.color, "the thumb is the fill's colour").toBe(m.fill);
    });

    test("audit 23: /equation's controls card ends with its content", async ({ page }) => {
        await equation(page);
        const g = await page.evaluate(() => {
            const aside = document.querySelector(".eq-configurator [data-slot='configurator'] > .configurator-aside")!.getBoundingClientRect();
            const sections = [...document.querySelectorAll<HTMLElement>(".eq-layers > *")];
            const last = sections.at(-1)!.getBoundingClientRect();
            return { asideBottom: aside.bottom, lastBottom: last.bottom };
        });
        expect(g.asideBottom - g.lastBottom).toBeLessThanOrEqual(16);
    });

    test("audit 27: the not-found card says no line that restates its title", async ({ page }) => {
        await page.goto("/no-such-page-here");
        await expect(page.getByText("Page not found")).toBeVisible({ timeout: 30_000 });
        await expect(page.getByText("Nothing lives at this address.")).toHaveCount(0);
    });

    test("audits 40 and 51: read text is 14 px or more, quiet by ink and not by opacity", async ({ page }) => {
        await page.goto("/paper");
        await expect(page.locator(".toc-number").first()).toBeAttached({ timeout: 30_000 });
        const nums = await page.locator(".toc-number").evaluateAll((els) =>
            els.slice(0, 6).map((e) => ({ px: parseFloat(getComputedStyle(e).fontSize), op: Number(getComputedStyle(e).opacity) })),
        );
        for (const n of nums) {
            expect(n.px).toBeGreaterThanOrEqual(14);
            expect(n.op).toBe(1);
        }
        await equation(page);
        for (const sel of [".legend-label", ".control-row-sub"]) {
            const sizes = await page.locator(sel).evaluateAll((els) => els.map((e) => parseFloat(getComputedStyle(e).fontSize)));
            for (const px of sizes) expect(px, sel).toBeGreaterThanOrEqual(14);
        }
    });
});

test.describe("phone rows @coarse", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("@coarse audit 43: chips are 46 px or less on a touch screen, every target 44 px or more", async ({ page }) => {
        await equation(page);
        await showView(page, "Controls");
        const boxes = await page.locator(".eq-panel-left-wrap").evaluate((root) =>
            [...root.querySelectorAll<HTMLElement>("button, [role=radio], input")]
                .filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== "hidden")
                .map((e) => ({ name: e.getAttribute("aria-label") ?? e.textContent?.trim() ?? e.tagName, h: e.getBoundingClientRect().height, w: e.getBoundingClientRect().width })),
        );
        expect(boxes.length).toBeGreaterThan(3);
        for (const b of boxes) expect(b.h, `${b.name} height`).toBeGreaterThanOrEqual(44 - 0.5);
        const chips = await page.locator(".eq-panel-left-wrap [role=radio]").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
        for (const h of chips) expect(h).toBeLessThanOrEqual(46);
    });

    test("@coarse G: every seat in the open plot column is 44 by 44", async ({ page }) => {
        await equation(page);
        const seat = page.locator(".plot-tools-seat");
        await seat.getByRole("button", { name: "Plot tools" }).click();
        await page.waitForTimeout(500);
        const cells = await seat.evaluate((s) =>
            [...s.querySelectorAll<HTMLElement>("button")]
                .filter((b) => b.getClientRects().length && !b.closest("[inert]"))
                .map((b) => ({ name: b.getAttribute("aria-label"), w: b.getBoundingClientRect().width, h: b.getBoundingClientRect().height })),
        );
        expect(cells.length).toBeGreaterThan(2);
        for (const c of cells) {
            expect(c.w, `${c.name} width`).toBeGreaterThanOrEqual(44 - 0.5);
            expect(c.h, `${c.name} height`).toBeGreaterThanOrEqual(44 - 0.5);
        }
    });
});
