import { expect, test, type Page } from "@playwright/test";
import { seededViz } from "./fixtures/seed";
import { showViewIfTabbed } from "./fixtures/workspace";
import { filmStage } from "./fixtures/stage-ink";

/**
 * The drawn line is the curve up to t: the forward leg of the ping-pong writes
 * it and the reverse leg un-writes it, smoothly, on a desk and on a throttled
 * phone (where a long frame used to drop the line in one jump and leave it at a
 * stale length).
 */

const LOAD = 60_000;

async function openPlaying(page: Page): Promise<void> {
    // The picture and the outline are off, so the red on the stage is the line.
    await page.goto(`/v/${seededViz().slug}?speed=4&bg=0&trace=0`);
    await showViewIfTabbed(page, "Canvas");
    await expect(page.locator(".animation-dock")).toBeVisible({ timeout: LOAD });
    await expect(page.getByRole("button", { name: "Pause animation" }).first()).toBeAttached({ timeout: LOAD });
}

/** The longest run of falling t in the film, from near the end of the cycle to near its start. */
function reverseLeg(rows: { t: number; red: number }[]): { t: number; red: number }[] {
    let best: { t: number; red: number }[] = [];
    let run: { t: number; red: number }[] = [];
    for (let i = 1; i < rows.length; i++) {
        if (rows[i]!.t < rows[i - 1]!.t) {
            if (!run.length) run.push(rows[i - 1]!);
            run.push(rows[i]!);
        } else if (rows[i]!.t > rows[i - 1]!.t) {
            if (run.length > best.length) best = run;
            run = [];
        }
    }
    return run.length > best.length ? run : best;
}

function judge(film: { t: number; ink: { red: number } | null }[]): void {
    const rows = film.filter((r) => r.ink && Number.isFinite(r.t)).map((r) => ({ t: r.t, red: r.ink!.red }));
    const leg = reverseLeg(rows);
    expect(leg.length, "a reverse leg was filmed").toBeGreaterThan(8);
    expect(leg[0]!.t, "the leg starts near the end of the cycle").toBeGreaterThan(0.8);
    expect(leg.at(-1)!.t, "the leg ends near its start").toBeLessThan(0.2);
    // The line un-writes: at the leg's end it is a fraction of what it was.
    expect(leg.at(-1)!.red, "the line falls across the reverse leg").toBeLessThan(0.35 * leg[0]!.red);
    // In steps, never a jump: no step more than three times both its neighbours'
    // (a floor of 2 % of the line keeps the tip's own wobble out of it).
    const floor = 0.02 * Math.max(...leg.map((r) => r.red));
    const steps = leg.slice(1).map((r, i) => Math.abs(leg[i]!.red - r.red));
    for (let i = 1; i < steps.length - 1; i++) {
        const near = Math.max(steps[i - 1]!, steps[i + 1]!, floor);
        expect(steps[i]!, `step ${i} of the reverse leg (t ${leg[i + 1]!.t})`).toBeLessThanOrEqual(3 * near);
    }
}

test.describe("o41 stage — the line un-writes on reverse (1440)", () => {
    test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: "dark" });
    test.setTimeout(120_000);

    test("the reverse leg un-writes the line in steps", async ({ page }) => {
        await openPlaying(page);
        await page.mouse.move(5, 5);
        // A leg is about five seconds at 4x: film two and a half.
        judge(await filmStage(page, 13_000));
    });
});

test.describe("o41 stage — the line un-writes on reverse (390, 4x CPU) @coarse", () => {
    test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: "dark" });
    test.setTimeout(150_000);

    test("@coarse the reverse leg un-writes the line in steps on a throttled phone", async ({ page }) => {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
        try {
            await openPlaying(page);
            judge(await filmStage(page, 14_000));
        } finally {
            await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
        }
    });
});
