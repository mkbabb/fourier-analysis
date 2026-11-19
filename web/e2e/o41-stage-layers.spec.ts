import { expect, test, type Page } from "@playwright/test";
import { openCanvasDock } from "./fixtures/canvas-dock";
import { seededViz } from "./fixtures/seed";
import { showViewIfTabbed } from "./fixtures/workspace";
import { SAMPLE_STAGE, type StageInk } from "./fixtures/stage-ink";

/**
 * The visualizer's layers: each one fades in and out (never a one-frame cut).
 */

const LOAD = 60_000;

/** Open the seeded piece paused at t = 0.5, so the stage changes only when a layer does. */
async function openPaused(page: Page, query = ""): Promise<void> {
    await page.goto(`/v/${seededViz().slug}?t=0.5${query}`);
    await showViewIfTabbed(page, "Canvas");
    await expect(page.locator(".animation-dock")).toBeVisible({ timeout: LOAD });
    await expect(page.getByRole("button", { name: "Play animation" }).first()).toBeAttached({ timeout: LOAD });
    // The picture is fetched and keyed after the drawing lands.
    await page.waitForTimeout(1500);
}

/** Toggle the picture where it lives. */
async function togglePicture(page: Page): Promise<void> {
    const dock = await openCanvasDock(page);
    await dock.getByRole("button", { name: "View options" }).click();
    await page.getByRole("menuitemcheckbox", { name: "Background image" }).click();
}

/** Film the stage's paint on every frame across `act`; the frames whose paint changed. */
async function changingFrames(page: Page, act: () => Promise<void>, ms = 800): Promise<number> {
    await page.evaluate(
        ({ ms, src }) => {
            const sample = new Function(`return (${src})()`) as () => StageInk | null;
            const w = window as unknown as { __film: number[] };
            w.__film = [];
            const t0 = performance.now();
            const loop = () => {
                w.__film.push(sample()?.alpha ?? 0);
                if (performance.now() - t0 < ms) requestAnimationFrame(loop);
            };
            requestAnimationFrame(loop);
        },
        { ms, src: SAMPLE_STAGE.toString() },
    );
    await act();
    await page.waitForTimeout(ms + 200);
    const film = await page.evaluate(() => (window as unknown as { __film: number[] }).__film);
    const deltas = film.slice(1).map((a, i) => Math.abs(a - film[i]!));
    const total = deltas.reduce((s, d) => s + d, 0);
    // A frame counts when it carries at least 2 % of the whole change.
    return deltas.filter((d) => d > 0.02 * total).length;
}

for (const vp of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
]) {
    test.describe(`o41 stage — the picture fades (${vp.width})`, () => {
        test.use({ viewport: vp, colorScheme: "dark" });
        test.setTimeout(120_000);

        test("toggling the picture changes the stage over several frames, out and in", async ({ page }) => {
            await openPaused(page);
            const out = await changingFrames(page, () => togglePicture(page));
            await expect(page).toHaveURL(/[?&]bg=0/);
            expect(out, "the picture leaves over five frames or more").toBeGreaterThanOrEqual(5);
            await page.keyboard.press("Escape");
            const back = await changingFrames(page, () => togglePicture(page));
            await expect(page).not.toHaveURL(/[?&]bg=/);
            expect(back, "the picture arrives over five frames or more").toBeGreaterThanOrEqual(5);
        });
    });
}
