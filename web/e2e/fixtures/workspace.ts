import { expect, type Page } from "@playwright/test";

/**
 * Canon F5 (restraint, C-47): below 640 px a stage-plus-inspector route is a
 * Controls/Canvas strip, and it opens on the canvas. Glass's default tabs seat
 * their indicator over the selected tab, so the selected tab is never clicked:
 * a spec asks for a view, and the tab is pressed only when it is not already
 * the one showing.
 */
export async function showView(page: Page, name: "Canvas" | "Controls"): Promise<void> {
    await selectTab(page, name);
}

/** Any glass tab strip: press the tab unless it is the one already selected. */
export async function selectTab(page: Page, name: string): Promise<void> {
    const tab = page.getByRole("tab", { name }).filter({ visible: true }).first();
    await expect(tab).toBeVisible({ timeout: 30_000 });
    if ((await tab.getAttribute("aria-selected")) !== "true") await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
}

/** As `showView`, at any width: from 640 px the route is one row (stage and
 *  controls side by side, canon F5) and has no strip to press. */
export async function showViewIfTabbed(page: Page, name: "Canvas" | "Controls"): Promise<void> {
    if (page.viewportSize()!.width < 640) await showView(page, name);
}
