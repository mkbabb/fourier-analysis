// SERVED MODEL: claude-opus-5-5
import { expect, type Locator, type Page } from "@playwright/test";

/**
 * FORTY-FIRST H (owner, 19 Nov: "the visualize area should take up more of the
 * screen and not have two docks of controls"): the stage has ONE dock, at its
 * foot (`.controls-overlay .animation-dock`). The canvas's tools that stood on
 * a second dock at the stage's top-right corner are this dock's now.
 *
 *  · Desk (and the rail form): one row that folds as glass folds it. Play, the
 *    four layers and Edit stand outside the fold; the scrub, the rate, the
 *    easing and More are in its open face, and More holds Just the picture,
 *    Reset view, Fullscreen and Export frame (PR 33 review: the scrub keeps
 *    most of the row).
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
 * takeover's dialog (the same dock, hosted there). The dock is returned open.
 */
export async function openCanvasDock(page: Page, scope: Page | Locator = page): Promise<Locator> {
    const dock = scope.locator(".controls-overlay .animation-dock").first();
    await expect(dock).toBeVisible({ timeout: 60_000 });
    if (await dock.evaluate((d) => d.classList.contains("animation-dock--card"))) return dock;
    const summary = dock.getByRole("button", { name: "Expand dock" });
    // A press opens it. Right after a dialog or a navigation the dock may still
    // be settling, so a press that lands before it settles is pressed again.
    await expect(async () => {
        if (await summary.isVisible().catch(() => false)) await summary.click({ timeout: 2_000 });
        await expect(dock).toHaveClass(/(^|\s)expanded(\s|$)/, { timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    await expect(dock).not.toHaveAttribute("data-morphing", { timeout: 5_000 });
    return dock;
}

/**
 * Press one of the stage dock's tools by its name, where it lives at this
 * width: a seat of the dock (opened first), else a row of its More (named
 * "Layers and more" on the plate, where it holds the layers, and "More" on
 * the desk's row).
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
