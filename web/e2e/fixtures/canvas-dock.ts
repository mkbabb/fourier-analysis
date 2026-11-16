// SERVED MODEL: claude-opus-5-5
import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Owner, 2026-11-15: the canvas's tools are the stage's floating dock, folded
 * to one glyph and opened by a PRESS (glass `expandOn="press"`, `StageDock`);
 * hover opens nothing. Edit contour stands outside the fold (R-close-1). A spec
 * that acts on a folded tool opens the dock the way a reader does, through its
 * summary ("Canvas tools"), and waits for the morph to settle. An open dock is
 * left as it is. `scope` is the surface that hosts the dock: the page, or the
 * fullscreen takeover's dialog (the same dock, hosted there).
 */
export async function openCanvasDock(page: Page, scope: Page | Locator = page): Promise<Locator> {
    const dock = scope.locator(".controls-dock-anchor .glass-dock").first();
    await expect(dock).toBeVisible({ timeout: 60_000 });
    const summary = dock.getByRole("button", { name: "Canvas tools" });
    // A press opens it. Right after a dialog or a navigation the dock may still
    // be settling (focus handed back, an overlay leaving), so a press that
    // lands before it settles is pressed again; the dock must still open by a press.
    await expect(async () => {
        if (await summary.isVisible().catch(() => false)) await summary.click({ timeout: 2_000 });
        await expect(dock).toHaveClass(/(^|\s)expanded(\s|$)/, { timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    await expect(dock).not.toHaveAttribute("data-morphing", { timeout: 5_000 });
    return dock;
}

/**
 * Open the canvas dock's Export frame dialog (X.F.W14V Repair 1 C1R1-1, carried
 * to every Export-frame entry by Repair 2 C2R1-1): the one path every spec
 * that exports a frame takes. The dock opens by a press (`openCanvasDock`), so
 * no hover-collapse settling is needed before the click.
 */
export async function clickCanvasDockExport(page: Page, scope: Page | Locator = page): Promise<void> {
    await openCanvasDock(page, scope);
    const exportFrame = scope.locator(".controls-dock-anchor [aria-label='Export frame']").first();
    await expect(exportFrame).toBeVisible();
    await exportFrame.click();
}
