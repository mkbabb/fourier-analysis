// SERVED MODEL: claude-opus-5-5
import { expect, test, type Page } from "@playwright/test";

/**
 * X.F.W14.u — Repair 2 continuation of the UIA-F register
 * (`value.js/docs/tranches/X/audit/UI-AUDIT-fourier.md`), BROKEN rows first.
 *
 * One falsifier per CONSUMER row cured at its cause in this sitting, named by
 * the row id. Each drives the served page (Vite dev at `BASE_URL`) and asserts
 * the row's "expected (canon)" reading.
 */

async function openPaper(page: Page) {
    await page.goto("/paper");
    const scroller = page.locator(".paper-scroll");
    await expect.poll(() => scroller.evaluate((el) => el.scrollHeight), { timeout: 15_000 }).toBeGreaterThan(5000);
    return scroller;
}

/** The element's top relative to the scroller's viewport, or null when it is not mounted. */
async function topInScroller(page: Page, id: string): Promise<number | null> {
    return page.evaluate((id) => {
        const el = document.getElementById(id);
        const s = document.querySelector(".paper-scroll");
        if (!el || !s) return null;
        return el.getBoundingClientRect().top - s.getBoundingClientRect().top;
    }, id);
}

test.describe("UIA-F-26 — Enter on a theorem result lands on that theorem", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    for (const { query, number, anchor } of [
        { query: "Residue Theorem", number: "4.2.1", anchor: "thm-residue" },
        { query: "Parseval's Identity", number: "2.10.2", anchor: "thm-parseval" },
    ]) {
        test(`Thm ${number} (${query}) scrolls #${anchor} into the viewport`, async ({ page }) => {
            const scroller = await openPaper(page);
            const field = page.getByRole("combobox", { name: "Search the paper" }).first();
            await field.fill(query);
            const row = page.getByRole("option").filter({ hasText: number }).first();
            await expect(row).toBeVisible();
            await field.focus();
            // Arrow to the theorem row, then Enter (the register's interaction).
            const selected = page.locator('[role="option"][aria-selected="true"]');
            for (let i = 0; i < 12; i++) {
                if (((await selected.count()) && (await selected.first().innerText()).includes(number))) break;
                await page.keyboard.press("ArrowDown");
            }
            await expect(selected.first()).toContainText(number);
            await page.keyboard.press("Enter");
            const h = await scroller.evaluate((el) => el.clientHeight);
            await expect
                .poll(() => topInScroller(page, anchor), { timeout: 15_000 })
                .not.toBeNull();
            await expect
                .poll(async () => {
                    const t = await topInScroller(page, anchor);
                    return t != null && t >= -4 && t < h;
                }, { timeout: 15_000 })
                .toBe(true);
        });
    }
});
