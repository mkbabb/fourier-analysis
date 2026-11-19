import { expect, test, type Page } from "@playwright/test";
import { openAppDock } from "./fixtures/app-dock";

/**
 * Home on every page (owner: "a home button" on every site; the design
 * critique's S2 and N1). The app dock's first seat is Home, the wordmark,
 * and goes to the paper, the page a first visit opens on. On the paper it is
 * the current page and a press does nothing (no second entrance). About is
 * the "i" beside the theme seat on a desk; under 40rem the sections menu
 * carries it, so the phone's run keeps its four seats. The not-found card
 * offers Home first.
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

        test("on the paper Home is the current page and a press changes nothing", async ({ page }) => {
            await page.goto("/paper");
            await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 60_000 });
            const dock = await openAppDock(page);
            const home = dock.getByRole("link", { name: "Home" });
            await expect(home).toHaveAttribute("aria-current", "page");
            const before = await page.evaluate(() => ({ url: location.href, entries: history.length }));
            await home.click();
            await page.waitForTimeout(400);
            expect(await page.evaluate(() => ({ url: location.href, entries: history.length }))).toEqual(before);
        });

        test("About sits beside the theme seat on a desk, in the sections menu on a phone", async ({ page }) => {
            await page.goto("/gallery");
            const run = await seats(page);
            const names = run.map((s) => s.name);
            if (vp.width >= 640) {
                expect(names.slice(-2)).toEqual(["About Fourier analysis", "Dark mode"]);
                await page.getByRole("button", { name: "About Fourier analysis" }).click();
                await expect(page.locator(".about-card")).toContainText(/orthogonal decomposition/i);
            } else {
                expect(names).toEqual(["Home", "Navigate", "Log in", "Dark mode"]);
                await page.locator(".app-dock").getByRole("button", { name: /^Navigate/ }).click();
                const about = page.getByRole("menu").locator("[data-about]");
                await expect(about).toContainText(/orthogonal decomposition/i);
                await expect(about.getByRole("menuitem", { name: "View the project on GitHub" })).toBeVisible();
            }
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
