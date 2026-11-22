// SERVED MODEL: claude-opus-5-5
import { expect, type Locator, type Page } from "@playwright/test";

/**
 * FORTY-FIRST H (owner, 19 Nov: "the visualize area should take up more of the
 * screen and not have two docks of controls"): the stage has ONE dock, at its
 * foot (`.controls-overlay .animation-dock`). The canvas's tools that stood on
 * a second dock at the stage's top-right corner are this dock's now.
 *
 *  · Desk (and the rail form): one plate of two rows, never folded: the scrub
 *    alone on its row (its run up to 52rem), then Play | the four layers | the
 *    rate, the easing, More | Edit. More holds Just the picture, Reset view,
 *    Fullscreen and Export frame.
 *  · Phone (the sheet form): one plate of two rows, never folded: the scrub,
 *    then Play | Picture, Outline, More | the rate, the easing | Edit. More
 *    ("Layers and more") holds Line, Circles, Just the picture, Series, Reset
 *    view, Fullscreen, Copy link, Export frame and Publish to Gallery.
 *  · A short landscape stage (844x390): the phone's plate as a card on the
 *    stage's trailing edge, the same seats and the same More.
 *  · In the fullscreen takeover its way out, Exit fullscreen, is a seat in
 *    every form (one press): beside Edit on a desk, in Edit's place on a phone,
 *    where Edit becomes a row of More.
 *
 * `scope` is the surface that hosts the dock: the page, or the fullscreen
 * takeover's dialog (the same dock, hosted there). The dock stands open in
 * every form.
 */
export async function openCanvasDock(page: Page, scope: Page | Locator = page): Promise<Locator> {
    const dock = scope.locator(".controls-overlay .animation-dock").first();
    await expect(dock).toBeVisible({ timeout: 60_000 });
    await expect(dock).toHaveClass(/(^|\s)expanded(\s|$)/);
    return dock;
}

/**
 * Press one of the stage dock's tools by its name, where it lives at this
 * width: a seat of the dock, else a row of its More (named "Layers and more"
 * on a phone's plate, where it holds the layers, and "More" at a desk).
 */
export async function pressStageTool(page: Page, name: string, scope: Page | Locator = page): Promise<void> {
    const dock = await openCanvasDock(page, scope);
    const seat = dock.getByRole("button", { name, exact: true });
    if (await seat.isVisible().catch(() => false)) {
        await seat.click();
        return;
    }
    await dock.getByRole("button", { name: /^(Layers and more|More)$/ }).click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await menu.getByRole("menuitem", { name, exact: true }).or(menu.getByRole("menuitemcheckbox", { name, exact: true })).click();
}

/**
 * Open the Export frame dialog (X.F.W14V Repair 1 C1R1-1, carried to every
 * Export-frame entry by Repair 2 C2R1-1): the one path every spec that exports
 * a frame takes.
 */
export async function clickCanvasDockExport(page: Page, scope: Page | Locator = page): Promise<void> {
    await pressStageTool(page, "Export frame", scope);
}
