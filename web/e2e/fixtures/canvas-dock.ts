// SERVED MODEL: claude-opus-5-5
import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Open the canvas dock's Export frame dialog from a SETTLED dock (X.F.W14V
 * Repair 1 C1R1-1 `05f99a6`, carried to every Export-frame entry by Repair 2
 * C2R1-1). The one path every spec that exports a frame takes.
 *
 * Why state, not a sleep: the canvas dock expands on pointer ENTRY and is
 * anchored right, so a collapse shrinks it toward its persistent Edit control.
 * After an export dialog closes, it hands focus back to Export frame, the dock
 * holds itself open for that focus, and the hold's release collapses it even
 * under a pointer already resting on it (no fresh entry follows). Export
 * frame's own visibility is no witness either: mid-collapse the expanded
 * layer is still painted. So the path leaves the dock and waits for it to rest
 * collapsed, enters it again on the one control that stays put in both
 * postures (Edit contour), and waits for the expanded STATE and a settled
 * morph (glass marks the root `data-morphing` while `.dock-layers` intercepts
 * pointer events) before the click.
 *
 * `scope` is the surface that hosts the dock: the page, or the fullscreen
 * takeover's dialog (the same dock, hosted there).
 */
export async function clickCanvasDockExport(page: Page, scope: Page | Locator = page): Promise<void> {
    const dockEl = scope.locator(".controls-dock-anchor .glass-dock").first();
    const editContour = scope.locator(".controls-dock-anchor [aria-label='Edit contour']").first();
    // A fresh entry first: a dock held open (the fullscreen takeover's focus on
    // its first control) collapses only on a leave that follows an entry.
    await editContour.hover();
    const dock = (await dockEl.boundingBox())!;
    await page.mouse.move(dock.x + dock.width / 2, dock.y + dock.height + 160);
    await expect(dockEl).toHaveClass(/(^|\s)collapsed(\s|$)/);
    await expect(dockEl).not.toHaveAttribute("data-morphing");
    await editContour.hover();
    await expect(dockEl).toHaveClass(/(^|\s)expanded(\s|$)/);
    await expect(dockEl).not.toHaveAttribute("data-morphing");
    const exportFrame = scope.locator(".controls-dock-anchor [aria-label='Export frame']").first();
    await expect(exportFrame).toBeVisible();
    await exportFrame.click();
}
