import { expect, test, type Page } from "@playwright/test";
import { openAppDock } from "./fixtures/app-dock";

/**
 * Home on every page (owner: "a home button" on every site; the design
 * critique's S2 and N1). The app dock's first seat is Home (a house on a
 * phone, the wordmark on a desk) and goes to the paper, the page a first
 * visit opens on. On the paper a press does nothing (no second entrance), and
 * the seat is never marked current, so it keeps its own width. About is
 * the "i" beside the theme seat at every width; on a phone the account is
 * the "i" card's last part, so the run is Home, Navigate, About and the theme.
 * The not-found card offers Home first.
 */

/** The open dock's seats in order: their accessible names and tags. */
async function seats(page: Page) {
    const dock = await openAppDock(page);
    return dock.evaluate((d) =>
        [...d.querySelectorAll<HTMLElement>("[data-glass-dock-seat], button, a[href]")]
            .filter((e, i, all) => all.indexOf(e) === i && e.getBoundingClientRect().width > 0 && !e.closest("[inert]"))
            .filter((e) => !e.parentElement?.closest("[data-glass-dock-seat]"))
            .map((e) => ({ name: (e.getAttribute("aria-label") ?? e.textContent ?? "").replace(/ — .*/, "").trim(), tag: e.tagName })),
    );
}

for (const vp of [
    { width: 1440, height: 900, touch: false },
    { width: 390, height: 844, touch: true },
]) {
    test.describe(`Home seat (${vp.width})`, () => {
        test.use({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.touch, isMobile: vp.touch });

        test("Home is the dock's first seat, a link to the paper, on every section", async ({ page }) => {
            for (const path of ["/gallery", "/equation", "/morph", "/visualize"]) {
                await page.goto(path);
                const run = await seats(page);
                expect(run[0], `first seat on ${path}`).toEqual({ name: "Home", tag: "A" });
                const home = page.locator(".app-dock").getByRole("link", { name: "Home" });
                await expect(home).toHaveAttribute("href", /\/paper$/);
                await expect(home).not.toHaveAttribute("aria-current");
            }
            await page.locator(".app-dock").getByRole("link", { name: "Home" }).click();
            await expect(page).toHaveURL(/\/paper$/);
        });

        test("on the paper Home keeps its own seat and a press changes nothing", async ({ page }) => {
            await page.goto("/paper");
            await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 60_000 });
            const dock = await openAppDock(page);
            const home = dock.getByRole("link", { name: "Home" });
            // Not a current seat: glass gives one three pitches of the run, which
            // put the phone's theme seat off the screen and hung the desk's
            // wordmark over its plate (PR 33 review, blocker 1).
            await expect(home).not.toHaveAttribute("aria-current");
            const g = await home.evaluate((a) => {
                const seat = a.getBoundingClientRect();
                const shown = [...a.children].filter((c) => c.getClientRects().length > 0);
                const ink = shown.map((c) => c.getBoundingClientRect());
                return {
                    w: seat.width,
                    left: seat.left,
                    right: seat.right,
                    inkLeft: Math.min(...ink.map((r) => r.left)),
                    inkRight: Math.max(...ink.map((r) => r.right)),
                    glyph: shown.length === 1 && shown[0]!.tagName.toLowerCase() === "svg",
                };
            });
            if (vp.width < 640) {
                // A phone: the house, on the dock's cell.
                expect(g.glyph, "the phone's Home is the house glyph").toBe(true);
                expect(g.w, "the phone's Home seat").toBeLessThanOrEqual(46);
            }
            // At every width the seat holds what it shows.
            expect(g.inkLeft, "Home's content starts inside its seat").toBeGreaterThanOrEqual(g.left - 0.5);
            expect(g.inkRight, "Home's content ends inside its seat").toBeLessThanOrEqual(g.right + 0.5);
            const before = await page.evaluate(() => ({ url: location.href, entries: history.length }));
            await home.click();
            await page.waitForTimeout(400);
            expect(await page.evaluate(() => ({ url: location.href, entries: history.length }))).toEqual(before);
        });

        test("About sits beside the theme seat at every width, and the sections menu holds only places", async ({ page }) => {
            await page.goto("/gallery");
            const run = await seats(page);
            const names = run.map((s) => s.name);
            // On a phone the "i" holds the account too, and is named for both.
            const about = vp.width < 640 ? "About Fourier analysis and your account" : "About Fourier analysis";
            expect(names.slice(-2)).toEqual([about, "Dark mode"]);
            if (vp.width < 640) expect(names).toEqual(["Home", "Navigate", about, "Dark mode"]);
            await page.getByRole("button", { name: "About Fourier analysis" }).click();
            await expect(page.locator(".about-card")).toContainText(/orthogonal decomposition/i);
            await page.keyboard.press("Escape");
            await page.locator(".app-dock").getByRole("button", { name: /^Navigate/ }).click();
            await expect(page.getByRole("menu").getByRole("menuitem")).toHaveCount(5);
            await expect(page.getByRole("menu").locator("[data-about]")).toHaveCount(0);
        });
    });
}

test("the not-found card offers Home first", async ({ page }) => {
    await page.goto("/no/such/page");
    const card = page.getByTestId("not-found");
    const first = card.getByRole("button").first();
    await expect(first).toHaveAccessibleName("Home");
    await first.click();
    await expect(page).toHaveURL(/\/paper$/);
});
