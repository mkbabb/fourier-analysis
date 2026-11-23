import { expect, test, type Page } from "@playwright/test";

/**
 * /morph's readings at the type floors (FORTY-SECOND A; the study's floors,
 * 2.6: 14 px for anything read, 13 px only for a true caption). A reading's
 * label ("phase", "n", "shape", "total") and the total's unit are read, so
 * they take the small step, never the caption step (12.2 px at 390). The label
 * stays quieter than its value by its ink, not by a smaller size (the study's
 * line 7: "secondary text is quieter ink, not smaller type").
 */

async function openMorph(page: Page): Promise<void> {
    await page.goto("/morph");
    await expect(page.locator(".demo-info .metric").first()).toBeVisible({ timeout: 30_000 });
}

for (const vp of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 1440, height: 900 },
]) {
    test.describe(`the morph readings at ${vp.width}x${vp.height}`, () => {
        test.use({ viewport: vp });

        test("every word and figure of the readings is 14 px or larger", async ({ page }) => {
            await openMorph(page);
            const sizes = await page.locator(".demo-info").evaluate((row) => {
                const out: { text: string; px: number }[] = [];
                const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT);
                for (let n = walker.nextNode(); n; n = walker.nextNode()) {
                    const text = n.textContent?.trim() ?? "";
                    const el = n.parentElement!;
                    if (!text || el.getClientRects().length === 0 || el.closest(".sr-only")) continue;
                    out.push({ text, px: parseFloat(getComputedStyle(el).fontSize) });
                }
                return out;
            });
            expect(sizes.map((s) => s.text)).toEqual(expect.arrayContaining(["phase", "n", "shape", "total", "ms"]));
            const under = sizes.filter((s) => s.px < 13.95);
            expect(under, "text under the 14 px floor").toEqual([]);
        });

        test("every reading ends inside the card, whole", async ({ page }) => {
            await openMorph(page);
            const out = await page.locator(".demo-info").evaluate((row) => {
                const card = row.closest(".demo-stage")!.getBoundingClientRect();
                const bad: string[] = [];
                const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT);
                for (let n = walker.nextNode(); n; n = walker.nextNode()) {
                    const text = n.textContent?.trim() ?? "";
                    if (!text || n.parentElement!.closest(".sr-only")) continue;
                    const range = document.createRange();
                    range.selectNodeContents(n);
                    for (const r of range.getClientRects()) {
                        if (r.width && (r.left < card.left - 0.5 || r.right > card.right + 0.5)) bad.push(`${text} [${Math.round(r.left)}, ${Math.round(r.right)}] in [${Math.round(card.left)}, ${Math.round(card.right)}]`);
                    }
                }
                return bad;
            });
            expect(out, "a reading cut by the card's edge").toEqual([]);
        });

        test("a label is quieter than its value by its ink", async ({ page }) => {
            await openMorph(page);
            const inks = await page.locator(".demo-info .metric").evaluateAll((ms) =>
                ms.map((m) => {
                    const label = m.querySelector(".metric__label")!;
                    const value = m.querySelector(".metric__value")!;
                    return { label: getComputedStyle(label).color, value: getComputedStyle(value).color };
                }),
            );
            expect(inks.length).toBe(4);
            for (const ink of inks) expect(ink.label, "the label's ink is not the value's").not.toBe(ink.value);
        });
    });
}
