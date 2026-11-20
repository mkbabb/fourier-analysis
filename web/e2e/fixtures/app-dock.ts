import { expect, type Locator, type Page } from "@playwright/test";

/**
 * O16 [49] [57] (owner, 13 Nov: "it should by default be collapsed"): the app
 * dock rests at its seal from first paint (glass `collapse="closed"`), so its
 * controls are inert until it opens. A spec that acts on the dock's controls
 * opens it the way a reader does, through the seal, and waits for the morph to
 * settle. An already open dock is left as it is.
 */
export async function openAppDock(page: Page): Promise<Locator> {
    const dock = page.locator(".app-dock");
    await expect(dock).toBeVisible({ timeout: 30_000 });
    const seal = dock.getByRole("button", { name: "Expand dock" });
    // The dock also opens under a resting pointer, so the seal can leave between
    // the look and the press: press it while it is there, until the dock is open.
    await expect(async () => {
        if (await seal.isVisible().catch(() => false)) await seal.click({ timeout: 2_000 });
        await expect(dock).toHaveClass(/(^|\s)expanded(\s|$)/, { timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    await expect(dock).not.toHaveAttribute("data-morphing", { timeout: 5_000 });
    return dock;
}

/**
 * Owner, 2026-11-15: "Each page should have a tool set in the main dock". A
 * page's tool is a seat in the open app dock's centre. Below 40rem the app
 * dock draws no page tools (O41 S4): the page holds them on its own stage
 * dock (/equation: the plot's dock). Press the named tool where it lives at
 * the current width.
 */
export async function pressPageTool(page: Page, name: string): Promise<void> {
    if (page.viewportSize()!.width < 640) {
        const plot = page.locator(".plot-tools-seat");
        if (await plot.count()) {
            const seat = plot.getByRole("button", { name, exact: true });
            if (!(await seat.isVisible().catch(() => false))) await plot.getByRole("button", { name: "Plot tools" }).click();
            await expect(seat).toBeVisible();
            await seat.click();
            return;
        }
        // A stage route (/w, /v): the page's acts are rows of the stage dock's More.
        await page.getByRole("button", { name: "Layers and more" }).click();
        const menu = page.getByRole("menu");
        await expect(menu).toBeVisible();
        await menu.getByRole("menuitem", { name, exact: true }).or(menu.getByRole("menuitemcheckbox", { name, exact: true })).click();
        return;
    }
    const dock = await openAppDock(page);
    const seat = dock.getByRole("button", { name, exact: true });
    await expect(seat).toBeVisible();
    await page.waitForTimeout(700);
    await seat.click();
}
