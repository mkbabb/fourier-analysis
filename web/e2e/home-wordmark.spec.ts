import { expect, test } from "@playwright/test";
import { openAppDock } from "./fixtures/app-dock";

/**
 * The desk's Home seat is the wordmark, and it opens with the site's mark:
 * the epicycle figure the folded seal, the tab and the share card carry
 * (FORTY-FIRST B; the study's line 10, "a site's mark is one flat drawing on
 * every surface"). It never opens with the font's ℱ, which names the Fourier
 * basis on the stage and the chips, so one glyph would mean two things (check 6).
 */

for (const scheme of ["dark", "light"] as const) {
    test.describe(`the desk wordmark (${scheme})`, () => {
        test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme });

        test("Home's wordmark is the mark, then the words; no ℱ", async ({ page }) => {
            await page.goto("/gallery");
            const dock = await openAppDock(page);
            const home = dock.getByRole("link", { name: "Home" });
            await expect(home).toBeVisible();
            const read = await home.evaluate((a) => {
                const shown = [...a.querySelectorAll<Element>("*")].filter((e) => e.getClientRects().length > 0);
                const first = shown.find((e) => e.tagName.toLowerCase() === "svg" || (e.children.length === 0 && e.textContent?.trim()));
                const mark = a.querySelector("svg[data-mark]");
                const words = a.textContent?.replace(/\s+/g, " ").trim() ?? "";
                const m = mark?.getBoundingClientRect();
                const textEl = [...a.querySelectorAll("span")].find((s) => s.children.length === 0 && s.textContent?.trim());
                const t = textEl?.getBoundingClientRect();
                return {
                    firstIsMark: !!first && first === mark,
                    words,
                    mark: m ? { w: m.width, h: m.height, right: m.right, cy: m.top + m.height / 2 } : null,
                    text: t ? { left: t.left, cy: t.top + t.height / 2 } : null,
                    ring: mark ? getComputedStyle(mark.querySelector("circle")!).stroke : "",
                };
            });
            expect(read.firstIsMark, "the wordmark opens with the mark").toBe(true);
            expect(read.words).toBe("Fourier analysis");
            expect(read.words).not.toContain("ℱ");
            // On the dock's one glyph size, on the words' axis, before them.
            expect(read.mark!.w).toBeGreaterThanOrEqual(20);
            expect(read.mark!.w).toBeLessThanOrEqual(28);
            expect(Math.abs(read.mark!.w - read.mark!.h)).toBeLessThanOrEqual(0.5);
            expect(read.mark!.right).toBeLessThanOrEqual(read.text!.left);
            expect(Math.abs(read.mark!.cy - read.text!.cy), "the mark on the words' axis").toBeLessThanOrEqual(2);
            // In the page's own tokens, as the seal is: not a literal.
            expect(read.ring).not.toBe("");
            expect(read.ring).not.toBe("none");
        });
    });
}
