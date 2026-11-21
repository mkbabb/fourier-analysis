import { expect, test } from "@playwright/test";

/**
 * LAST-TEN F-08, the site's half: on a phone the first open
 * after a load showed the section's name and then dropped it, the dock
 * snapping from 334 to 283 px within 450 ms of opening. The dock opens at
 * its final width: from the press, its box only grows to its rest and holds
 * there (a spring's settle is allowed a few px; the snap was 51).
 */
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

// "/" opens the paper (the first visit's page) and /paper is Home's own page:
// the Home seat must not take a current seat's three pitches there (PR 33
// review, blocker 1: the theme seat stood at x 371 to 415 of 390).
for (const path of ["/", "/paper", "/gallery", "/equation"]) {
    test(`the phone dock opens at its final width (${path})`, async ({ page }) => {
        await page.goto(path);
        const dock = page.locator(".app-dock");
        await expect(dock).toHaveClass(/(^|\s)collapsed(\s|$)/, { timeout: 30_000 });
        await page.waitForTimeout(800);

        await page.evaluate(() => {
            const el = document.querySelector(".app-dock")!;
            const widths: number[] = [];
            const t0 = performance.now();
            const tick = () => {
                widths.push(el.getBoundingClientRect().width);
                if (performance.now() - t0 < 1800) requestAnimationFrame(tick);
            };
            (window as unknown as { __widths: number[] }).__widths = widths;
            requestAnimationFrame(tick);
        });
        await dock.getByRole("button", { name: "Expand dock" }).tap();
        await page.waitForTimeout(2000);
        await expect(dock).toHaveClass(/(^|\s)expanded(\s|$)/);
        const widths = await page.evaluate(() => (window as unknown as { __widths: number[] }).__widths);

        const peak = Math.max(...widths);
        const after = widths.slice(widths.indexOf(peak));
        const rest = after.at(-1)!;
        expect(peak - rest, `the open dock shrank after its rest: ${peak.toFixed(1)} -> ${rest.toFixed(1)} px`).toBeLessThanOrEqual(6);
        // O41 S4: the open dock keeps the page gutter. With the Controls seat
        // on a stage route the "i" would take it past, so there About is a
        // group of the Sections menu instead (S4's fallback).
        expect(rest, "the open dock's width").toBeLessThanOrEqual(358);
        // Every seat is on the screen, inside the gutter, and pressable.
        const seats = await dock.evaluate((d) =>
            [...d.querySelectorAll<HTMLElement>("button, a[href]")]
                .filter((b) => b.getBoundingClientRect().width > 0 && !b.closest("[inert]"))
                .map((b) => {
                    const r = b.getBoundingClientRect();
                    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
                    return { name: b.getAttribute("aria-label") ?? "", left: r.left, right: r.right, w: r.width, hit: !!hit && (hit === b || b.contains(hit)) };
                }),
        );
        const home = seats.find((x) => x.name.startsWith("Home"));
        expect(home?.w, "Home stands on the dock's cell, never a current seat's three pitches").toBeLessThanOrEqual(46);
        for (const x of seats) {
            expect(x.left, `${x.name}: left edge`).toBeGreaterThanOrEqual(16 - 0.5);
            expect(x.right, `${x.name}: right edge`).toBeLessThanOrEqual(390 - 16 + 0.5);
            expect(x.hit, `${x.name}: pressable at its centre`).toBe(true);
        }
        // Whatever the dock holds, the run never pans.
        const run = await dock.evaluate((d) => {
            const port = [...d.querySelectorAll<HTMLElement>("*")].find((n) => {
                const o = getComputedStyle(n).overflowX;
                return (o === "auto" || o === "scroll") && !n.closest("[inert]");
            });
            return port ? port.scrollLeft : 0;
        });
        expect(run).toBe(0);
    });
}
