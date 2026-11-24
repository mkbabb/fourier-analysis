import { expect, test } from "@playwright/test";
import { seededViz } from "./fixtures/seed";
import { slider } from "./fixtures/slider";

/**
 * FORTY-SIXTH D (owner, 23 Nov: "We should better save state in the URL for
 * visualize mode, too"). The series panel opened from a link (`eq=1`) always
 * came back in trig notation at six terms, whatever the reader had left it
 * at. Its notation (`nt`, a push: Back undoes it) and its term budget (`en`, a
 * replace) are in the link now, so it reopens as it was.
 */

async function openPanel(page: import("@playwright/test").Page, query: string) {
    const { image_slug } = seededViz();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/w/${image_slug}?eq=1${query}`);
    const panel = page.getByRole("dialog", { name: /series|equation/i });
    await expect(panel).toBeVisible({ timeout: 60_000 });
    return panel;
}

test("a link reopens the series panel in its notation and at its budget", async ({ page }) => {
    const panel = await openPanel(page, "&nt=polar&en=9");
    await expect(panel.getByRole("radio", { name: /polar/i })).toHaveAttribute("aria-checked", "true");
    await expect(slider(panel, "Terms")).toHaveAttribute("aria-valuenow", "9");
});

test("the panel writes its notation as a step and its budget in place", async ({ page }) => {
    const panel = await openPanel(page, "");
    await expect(panel.getByRole("radio", { name: /trig/i })).toHaveAttribute("aria-checked", "true");
    const entries = await page.evaluate(() => history.length);
    await panel.getByRole("radio", { name: /exp/i }).click();
    await expect(page).toHaveURL(/[?&]nt=exponential(&|$)/);
    expect(await page.evaluate(() => history.length), "the notation is a step Back undoes").toBe(entries + 1);

    const terms = slider(panel, "Terms");
    await terms.focus();
    for (let i = 0; i < 3; i++) await terms.press("ArrowRight");
    await expect(page).toHaveURL(/[?&]en=9(&|$)/);
    expect(await page.evaluate(() => history.length), "the budget writes no entry").toBe(entries + 1);

    await page.goBack();
    await expect(page).not.toHaveURL(/nt=/);
    await expect(panel.getByRole("radio", { name: /trig/i })).toHaveAttribute("aria-checked", "true");
});
