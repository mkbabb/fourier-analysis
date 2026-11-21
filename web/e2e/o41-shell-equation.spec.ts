import { expect, test, type Page } from "@playwright/test";
import { openAppDock } from "./fixtures/app-dock";

/**
 * /equation reached from the sections menu came up empty (audit row 1): the
 * menu row's intent prefetch and the view's own compute shared one inflight
 * key, so a prefetch that started second cancelled the view's job and the
 * stage never took an answer. Each now keeps its own key; a prefetch never
 * starts for the request the view is computing; a view that mounts while a
 * prefetch is in flight takes its promise.
 *
 * The API is slowed by 300 ms so the prefetch and the view's mount overlap.
 */

async function slowApi(page: Page): Promise<{ cancels: string[] }> {
    const seen = { cancels: [] as string[] };
    await page.route("**/api/**", async (route) => {
        if (route.request().method() === "DELETE" && /\/jobs\//.test(route.request().url())) {
            seen.cancels.push(route.request().url());
        }
        await new Promise((r) => setTimeout(r, 300));
        await route.continue();
    });
    return seen;
}

async function viaSections(page: Page): Promise<void> {
    await page.goto("/paper");
    await expect(page.locator("article.paper-article")).toBeVisible({ timeout: 30_000 });
    const dock = await openAppDock(page);
    await dock.getByRole("button", { name: /^Navigate/ }).click();
    const row = page.getByRole("menu").getByRole("menuitem", { name: "Equation" });
    await row.hover();
    await row.click();
    await page.waitForURL(/\/equation/);
}

for (const vp of [
    { name: "desk", width: 1440, height: 900 },
    { name: "phone", width: 390, height: 844 },
]) {
    test.describe(`audit 1 — /equation from the sections menu (${vp.name})`, () => {
        test.use({ viewport: { width: vp.width, height: vp.height } });

        test("the series lands on the stage and the page cancels none of its own jobs", async ({ page }) => {
            // A fresh context: no cached series to restore from.
            const seen = await slowApi(page);
            await viaSections(page);
            await expect(page.locator(".eq-card .katex").first()).toBeVisible({ timeout: 60_000 });
            expect(seen.cancels, "jobs the page cancelled").toEqual([]);
        });
    });
}
