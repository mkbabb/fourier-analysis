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
