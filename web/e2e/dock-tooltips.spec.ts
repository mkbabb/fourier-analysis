import { expect, test } from "@playwright/test";

/**
 * FORTY-SIXTH A (the dock study's F-3): in his frame the theme seat's
 * "Switch to dark mode" stood at the far left of the screen. That was the
 * seat's native `title`, drawn by the browser and anchored to nothing on the
 * page; Home, About and Controls were native titles too. Every dock seat now
 * explains itself with glass's Tooltip, which stands on its seat: on hover or
 * keyboard focus the tooltip's centre is over the seat's centre, and no seat
 * carries a `title` for the browser to draw. On a touch screen a tap shows no
 * tooltip (tooltips are a desk's, STUDY 2.1).
 */

const SEATS = [
    { what: "Home", locator: ".app-dock .logo-trigger", text: "Home" },
    { what: "About", locator: ".app-dock .about-trigger", text: "About" },
    { what: "the theme", locator: ".app-dock .sun-moon-toggle", text: /Switch to (dark|light) mode/ },
] as const;

for (const scheme of ["light", "dark"] as const) {
    test(`a desk's dock seats stand their tooltips on themselves (${scheme})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto("/w");
        const dock = page.locator(".app-dock");
        await expect(dock).toHaveClass(/(^|\s)collapsed(\s|$)/, { timeout: 30_000 });
        await page.waitForTimeout(600);
        await dock.getByRole("button", { name: "Expand dock" }).hover();
        await expect(dock).not.toHaveAttribute("data-morphing", /.*/, { timeout: 5_000 });
        await expect(dock).toHaveClass(/(^|\s)expanded(\s|$)/);

        const titled = await dock.evaluate((d) =>
            [...d.querySelectorAll<HTMLElement>("[title]")].map((el) => `${el.className}: ${el.title}`),
        );
        expect(titled, "no dock seat leaves its name to the browser's native title").toEqual([]);

        for (const seat of SEATS) {
            const el = page.locator(seat.locator);
            // A hand arrives over a seat in several moves; one jump from the
            // last seat lands while the last tooltip's pointer grace is open.
            await el.hover();
            const at = (await el.boundingBox())!;
            await page.mouse.move(at.x + at.width / 2 + 2, at.y + at.height / 2, { steps: 4 });
            const tip = page.locator(".app-tooltip-content").filter({ hasText: seat.text });
            await expect(tip, `${seat.what}: its tooltip shows on hover`).toBeVisible({ timeout: 3_000 });
            const [a, b] = await Promise.all([el.boundingBox(), tip.boundingBox()]);
            const seatX = a!.x + a!.width / 2;
            const tipX = b!.x + b!.width / 2;
            expect(Math.abs(tipX - seatX), `${seat.what}: the tooltip stands on its seat (${tipX.toFixed(1)} vs ${seatX.toFixed(1)})`).toBeLessThanOrEqual(2);
            // The far-left fault: never at the screen's edge.
            expect(b!.x, `${seat.what}: the tooltip is not at the screen's left edge`).toBeGreaterThan(a!.x - b!.width);
        }

        // The tooltip wraps About's trigger and must not take its card's anchor:
        // pressed, the card stands under its "i", inside the screen.
        const about = page.locator(".app-dock .about-trigger");
        await about.click();
        const card = page.locator(".about-card");
        await expect(card).toBeVisible();
        await card.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)));
        const [i, c] = await Promise.all([about.boundingBox(), card.boundingBox()]);
        expect(c!.y, "the card opens below its seat").toBeGreaterThanOrEqual(i!.y + i!.height);
        expect(c!.y + c!.height, "and ends inside the screen").toBeLessThanOrEqual(900);
        expect(c!.x + c!.width, "its end edge at its seat's").toBeCloseTo(i!.x + i!.width, -1);
    });
}

test("a phone's tap on a dock seat shows no tooltip @coarse", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/w");
    const dock = page.locator(".app-dock");
    await expect(dock).toHaveClass(/(^|\s)collapsed(\s|$)/, { timeout: 30_000 });
    await page.waitForTimeout(600);
    await dock.getByRole("button", { name: "Expand dock" }).tap();
    await expect(dock).not.toHaveAttribute("data-morphing", /.*/, { timeout: 5_000 });
    const titled = await dock.evaluate((d) => [...d.querySelectorAll<HTMLElement>("[title]")].length);
    expect(titled, "no native title on a phone's dock").toBe(0);
    await page.locator(".app-dock .sun-moon-toggle").tap();
    await page.waitForTimeout(900);
    await expect(page.locator(".app-tooltip-content")).toHaveCount(0);
});

/*
 * The theme seat's tooltip names the press's action, and the press flips the
 * theme. Its words were read from the theme, so the leaving tooltip swapped to
 * the opposite action in the same frame as the ground ("Switch to dark mode"
 * became "Switch to light mode", at full strength 8 ms after the press in
 * dark, at two thirds 20 ms after it in light, then faded). It keeps the words
 * it opened with until it has left. Filmed per animation frame from the press.
 */
for (const scheme of ["light", "dark"] as const) {
    test(`the theme seat's tooltip keeps its words until it has left (${scheme})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto("/w");
        const dock = page.locator(".app-dock");
        await expect(dock).toHaveClass(/(^|\s)collapsed(\s|$)/, { timeout: 30_000 });
        await page.waitForTimeout(600);
        await dock.getByRole("button", { name: "Expand dock" }).hover();
        await expect(dock).not.toHaveAttribute("data-morphing", /.*/, { timeout: 5_000 });

        const seat = page.locator(".app-dock .sun-moon-toggle");
        await seat.hover();
        const at = (await seat.boundingBox())!;
        await page.mouse.move(at.x + at.width / 2 + 2, at.y + at.height / 2, { steps: 4 });
        const opened = scheme === "light" ? "Switch to dark mode" : "Switch to light mode";
        const other = scheme === "light" ? "Switch to light mode" : "Switch to dark mode";
        await expect(page.locator(".app-tooltip-content").filter({ hasText: opened })).toBeVisible({ timeout: 3_000 });

        await page.evaluate(() => {
            const seen: { t: number; words: string; ink: number }[] = [];
            const w = window as unknown as { __tip: typeof seen; __tipDone: boolean };
            w.__tip = seen;
            w.__tipDone = false;
            const t0 = performance.now();
            const tick = () => {
                for (const el of document.querySelectorAll<HTMLElement>(".app-tooltip-content")) {
                    let ink = 1;
                    for (let e: HTMLElement | null = el; e; e = e.parentElement) ink *= Number.parseFloat(getComputedStyle(e).opacity);
                    seen.push({ t: performance.now() - t0, words: (el.textContent ?? "").trim(), ink });
                }
                if (performance.now() - t0 < 1200) requestAnimationFrame(tick);
                else w.__tipDone = true;
            };
            requestAnimationFrame(tick);
        });
        await seat.click();
        await page.waitForFunction(() => (window as unknown as { __tipDone: boolean }).__tipDone);
        const seen = await page.evaluate(() => (window as unknown as { __tip: { t: number; words: string; ink: number }[] }).__tip);
        await expect(seat).toHaveAttribute("aria-pressed", scheme === "light" ? "true" : "false");

        expect(seen.length, "the leaving tooltip was filmed").toBeGreaterThan(0);
        // Until the tooltip has gone, every frame that shows it shows the words it opened with.
        const gone = seen.findIndex((f) => f.ink < 0.01);
        const leaving = gone < 0 ? seen : seen.slice(0, gone);
        // (The content also carries its words once more for a screen reader.)
        for (const f of leaving) {
            const what = `at ${f.t.toFixed(0)} ms the leaving tooltip reads "${f.words}" at ${f.ink.toFixed(2)}`;
            expect(f.words, what).toContain(opened);
            expect(f.words, what).not.toContain(other);
        }
    });
}
