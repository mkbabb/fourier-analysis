import { expect, type Page } from "@playwright/test";

/**
 * Canon F5 (restraint, C-47): below 640 px a stage-plus-inspector route shows
 * one pane, and it opens on the canvas. FORTY-SECOND D (owner, 19 Nov: "the
 * tabs toggle for controls should potentially be re-integrated into the top
 * dock"): the switch is the top dock's Controls seat, outside its fold, lit
 * while the controls show. A spec asks for a view; the seat is pressed only
 * when that view is not already the one showing, and the slide is let land.
 */
export async function showView(page: Page, name: "Canvas" | "Controls"): Promise<void> {
    // Every stage route's switch is the seat now (/w and /v took the pane in
    // the stage track's T-A); no route keeps a Controls/Canvas strip.
    const seat = page.locator(".app-dock .pane-seat");
    await expect(seat).toBeVisible({ timeout: 30_000 });
    const want = String(name === "Controls");
    if ((await seat.getAttribute("aria-pressed")) !== want) await seat.click();
    await expect(seat).toHaveAttribute("aria-pressed", want);
    await page.waitForTimeout(350);
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
