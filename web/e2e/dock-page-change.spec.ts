import { expect, test, type Page } from "@playwright/test";

/**
 * FORTY-SIXTH A (the dock study's F-2): a page change with the dock open was
 * two one-frame cuts at a desk. Going from the visualizer to the paper, the
 * section seat's word swapped in place (the plate 712 -> 687 px, every seat
 * stepping 12.5 px), then the page's group left after its fade and was
 * removed (687 -> 528 px, the seats jumping about 80 px). The motion canon:
 * a box that resizes is tweened, and no leg lands more than two fifths of its
 * travel in one frame. Filmed per animation frame: the plate's width reaches
 * the paper's along a glide, never a step.
 */

interface Frame {
    t: number;
    w: number;
}

/**
 * Films the plate's width every animation frame until `settleMs` after the
 * page's group has arrived (`want: true`) or left (`want: false`), so a page
 * whose seats come late is filmed through their glide all the same.
 */
async function film(page: Page, want: boolean, settleMs = 1600): Promise<void> {
    await page.evaluate(
        ([want, settleMs]) => {
            const dock = document.querySelector<HTMLElement>(".app-dock")!;
            const frames: Frame[] = [];
            (window as unknown as { __frames: Frame[] }).__frames = frames;
            const t0 = performance.now();
            let since = -1;
            const tick = () => {
                const now = performance.now() - t0;
                frames.push({ t: now, w: dock.getBoundingClientRect().width });
                const there = dock.querySelector("[data-page-tools]") !== null;
                if (there === want && since < 0) since = now;
                if ((since < 0 || now - since < settleMs) && now < 10_000) requestAnimationFrame(tick);
                else (window as unknown as { __filmed: boolean }).__filmed = true;
            };
            (window as unknown as { __filmed: boolean }).__filmed = false;
            requestAnimationFrame(tick);
        },
        [want, settleMs] as const,
    );
}

async function filmed(page: Page): Promise<Frame[]> {
    await page.waitForFunction(() => (window as unknown as { __filmed: boolean }).__filmed, null, { timeout: 15_000 });
    return page.evaluate(() => (window as unknown as { __frames: Frame[] }).__frames);
}

async function openDock(page: Page): Promise<void> {
    const dock = page.locator(".app-dock");
    await expect(dock).toHaveClass(/(^|\s)collapsed(\s|$)/, { timeout: 30_000 });
    await page.waitForTimeout(600);
    await dock.getByRole("button", { name: "Expand dock" }).hover();
    await expect(dock).toHaveClass(/(^|\s)expanded(\s|$)/);
    await expect(dock).not.toHaveAttribute("data-morphing", /.*/, { timeout: 5_000 });
    await page.waitForTimeout(400);
}

/** The plate's travel from its first width to its last, as legs between rests. */
function assertGlides(fs: Frame[], what: string): void {
    const start = fs[0].w, end = fs.at(-1)!.w;
    const travel = Math.abs(end - start);
    expect(travel, `${what}: the plate changed width`).toBeGreaterThan(40);
    let first = -1, last = -1;
    for (let i = 1; i < fs.length; i++) {
        const step = Math.abs(fs[i].w - fs[i - 1].w);
        if (step > 0.25) {
            if (first < 0) first = i - 1;
            last = i;
        }
        expect(
            step,
            `${what}: the plate stepped ${fs[i - 1].w.toFixed(1)} -> ${fs[i].w.toFixed(1)} px between ${fs[i - 1].t.toFixed(0)} and ${fs[i].t.toFixed(0)} ms`,
        ).toBeLessThanOrEqual(0.4 * travel);
    }
    expect(fs[last].t - fs[first].t, `${what}: the width's travel takes time`).toBeGreaterThanOrEqual(150);
}

for (const scheme of ["light", "dark"] as const) {
    test(`a desk's page change glides the dock's width (${scheme})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto("/w");
        await openDock(page);
        await expect(page.locator(".app-dock [data-page-tools]")).toBeVisible({ timeout: 30_000 });

        // Home goes to the paper, the pointer stays on the dock, so it stays open.
        await film(page, false);
        await page.waitForTimeout(150); // the film holds the plate at rest before the press
        await page.locator(".app-dock .logo-trigger").click();
        await expect(page).toHaveURL(/\/paper/);
        assertGlides(await filmed(page), "/w -> /paper");

        // And back, by the dock's sections menu from the keyboard (focus holds
        // the dock open): the page's group comes in along a glide.
        await page.locator(".app-dock .nav-trigger").focus();
        await page.keyboard.press("Enter");
        const visualize = page.getByRole("menuitem", { name: "Visualize" });
        await expect(visualize).toBeVisible();
        await visualize.focus();
        await film(page, true);
        await page.waitForTimeout(150);
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(/\/(w|visualize)/);
        assertGlides(await filmed(page), "/paper -> /w");
    });
}
