// SERVED MODEL: claude-opus-5-5
import { expect, test } from "@playwright/test";
import { seededViz } from "./fixtures/seed";

/**
 * X.F.W14V Repair 1 (Check 1 RESUME 1, C1R1-1's second failure mode; F.W14U
 * R-1 / Check C2R-1, homed here by the root).
 *
 * h1  A reader's pause holds across the load's last data write. The saved
 *     visualization loads its contour, then computes its epicycles and its
 *     bases; the epicycles' arrival starts the clock. The bases response is
 *     held back here (a routed delay on the second write, the ruling's own
 *     shape), the reader pauses by keyboard while it is in flight, and the
 *     clock must still be paused, at the same position, after it lands. At
 *     the before bytes the loader's data watcher called `play()` on any later
 *     arrival while the clock was stopped, so the bases restarted it.
 *
 * Served from :3100 (BASE_URL) against the API on :8000; data = the e2e
 * global seed.
 */

const BASES_DELAY_MS = 3_000;

test.describe("F.W14U R-1 — a reader's pause survives a late data write", () => {
    test("h1 pause while the bases compute is in flight; its arrival does not restart the clock", async ({ page }) => {
        let releaseAt = 0;
        await page.route("**/api/contours/*/compute/bases*", async (route) => {
            await new Promise((r) => setTimeout(r, BASES_DELAY_MS));
            releaseAt = Date.now();
            await route.continue();
        });
        const basesLanded = page.waitForResponse((r) => /\/compute\/bases/.test(r.url()), { timeout: 30_000 });
        await page.goto(`/v/${seededViz().slug}`);

        // The epicycles have arrived and the loader started the clock.
        const pause = page.getByRole("button", { name: "Pause animation" }).first();
        await expect(pause).toBeVisible({ timeout: 20_000 });
        expect(releaseAt, "the bases response is still held back when the reader pauses").toBe(0);

        // The reader pauses (keyboard: a pointer press on a persistent dock
        // control can be discarded mid-morph by glass's click guard, UIA-F-8).
        await pause.focus();
        await page.keyboard.press("Enter");
        const play = page.getByRole("button", { name: "Play animation" }).first();
        await expect(play).toBeVisible();

        await basesLanded;
        const bar = page.locator(".mini-progress").first();
        const at = Number(await bar.getAttribute("aria-valuenow"));
        // Let any watcher the arrival fired run its course.
        await page.waitForTimeout(1_500);
        await expect(play, "the late bases write left the reader's pause standing").toBeVisible();
        await expect(page.getByRole("button", { name: "Pause animation" })).toHaveCount(0);
        expect(Number(await bar.getAttribute("aria-valuenow")), "the clock did not move").toBe(at);
    });
});
