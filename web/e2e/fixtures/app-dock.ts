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
    if (await seal.isVisible().catch(() => false)) {
        await seal.click();
    }
    await expect(dock).toHaveClass(/(^|\s)expanded(\s|$)/);
    await expect(dock).not.toHaveAttribute("data-morphing", { timeout: 5_000 });
    return dock;
}
