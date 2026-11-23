import { expect, test, type Page } from "@playwright/test";
import { seededViz } from "./fixtures/seed";

/**
 * FORTY-SIXTH D (owner, 23 Nov: "We should better save state in the URL for
 * visualize mode, too, like our layers, etc"). The view was already in the
 * link; what lost it was the dock. Its Visualize seat pushed a bare
 * `/visualize`, which the loader replaced with `/w/<picture>` and no query, so
 * a trip to the paper and back by the dock reset every layer, the terms and
 * the zoom. The dock now opens a section at its last full URL in this tab, and
 * a bare `/visualize` is the defaults (the empty stage), never rewritten.
 */

async function routerPush(page: Page, path: string): Promise<void> {
    await page.waitForFunction(() => "__vue_app__" in (document.querySelector("#app") ?? {}));
    await page.evaluate(async (p) => {
        const el = document.querySelector("#app") as unknown as {
            __vue_app__: { config: { globalProperties: { $router: { push(p: string): Promise<unknown> } } } };
        };
        await el.__vue_app__.config.globalProperties.$router.push(p);
    }, path);
}

async function openDock(page: Page): Promise<void> {
    const dock = page.locator(".app-dock");
    await expect(dock).toHaveClass(/(^|\s)collapsed(\s|$)/, { timeout: 30_000 });
    await page.waitForTimeout(400);
    await dock.getByRole("button", { name: "Expand dock" }).hover();
    await expect(dock).toHaveClass(/(^|\s)expanded(\s|$)/);
    await expect(dock).not.toHaveAttribute("data-morphing", /.*/, { timeout: 5_000 });
}

function query(url: string): Record<string, string> {
    return Object.fromEntries(new URL(url).searchParams);
}

test("the dock's Visualize seat returns to the picture and its view", async ({ page }) => {
    const { image_slug } = seededViz();
    await page.setViewportSize({ width: 1440, height: 900 });
    const left = `/w/${image_slug}?circles=0&n=12&z=2`;
    await page.goto(left);
    await expect(page.locator(".drop-target")).toHaveCount(0, { timeout: 30_000 });
    await page.waitForTimeout(1500);
    const before = page.url();
    expect(query(before)).toMatchObject({ circles: "0", n: "12", z: "2" });

    await openDock(page);
    await page.locator(".app-dock .logo-trigger").click();
    await expect(page).toHaveURL(/\/paper/);

    await page.locator(".app-dock .nav-trigger").focus();
    await page.keyboard.press("Enter");
    await page.getByRole("menuitem", { name: "Visualize" }).click();
    await expect(page).toHaveURL(new RegExp(`/w/${image_slug}`));
    // Long enough for the loader and the view's own writes to have run.
    await page.waitForTimeout(2000);
    const back = new URL(page.url());
    expect(back.pathname).toBe(`/w/${image_slug}`);
    expect(query(page.url()), "the layers, terms and zoom came back with the picture").toMatchObject({ circles: "0", n: "12", z: "2" });
    await expect(page.locator(".drop-target")).toHaveCount(0);
});

test("a bare /visualize is the empty stage, even after a picture", async ({ page }) => {
    const { image_slug } = seededViz();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/visualize");
    await expect(page.locator(".drop-target")).toBeVisible({ timeout: 30_000 });
    await routerPush(page, `/w/${image_slug}`);
    await expect(page.locator(".drop-target")).toHaveCount(0, { timeout: 30_000 });
    await page.goBack();
    await page.waitForTimeout(1500);
    expect(new URL(page.url()).pathname, "Back to a bare /visualize stays there").toBe("/visualize");
    await expect(page.locator(".drop-target"), "the empty stage, not the last picture").toBeVisible();
});
