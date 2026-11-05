/**
 * X·F F-D2 (D-17, D-17-GPU) — the /equation convergence sweep's frame time,
 * at the area-bound cells (1440×900, 1800×1000), N = 100.
 *
 * Read on prod 2026-11-04 in software raster: rAF p50 25–33 ms at 1440–1800.
 * The design's cure (cache the grid, f(x) and the settled harmonics in an
 * offscreen layer) was built and measured here, ×2, and NOT landed:
 *  - real GPU (`@gpu`, `chrome-gpu`: GPU/ANGLE-Metal frame-budget witness,
 *    machine law 2026-10-16, the project's own `channel: "chrome"` citation):
 *    before the change the sweep already holds the display rate, p50 16.7 ms
 *    and 0 frames over 33 ms at both cells; after it, the same. Headless Chrome
 *    paces rAF at 60 Hz, so the design's 120 Hz bar (p50 ≤ 8.4 ms) cannot be
 *    read by this instrument at all;
 *  - software raster: 1440 p50 17.0/17.6 ms before, 25.0/25.2 after (worse:
 *    a full-store drawImage costs more than the strokes it replaced); 1800
 *    41.6/49.0 before, 41.5/41.6 after.
 * What stands is the guard: on the real GPU the sweep holds the display rate
 * with no long frame, the software sweep is live, and the reduced-motion
 * terminal frame's digest is recorded (identical across the trial change:
 * 1440 f787c93933aa7bf1, 1800 465a1b183de4d3b4).
 */
import { createHash } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { expectHardwareGpu } from "./fixtures/gpu";

const CELLS = [
    { width: 1440, height: 900 },
    { width: 1800, height: 1000 },
] as const;

const FRAMES = 240;

async function openAtMaxHarmonics(page: Page) {
    await page.goto("/equation");
    const harmonics = page.getByRole("spinbutton", { name: "Harmonics", exact: true });
    await harmonics.fill("100");
    await harmonics.press("Enter");
    await page.getByRole("button", { name: "Compute" }).click();
    await expect(page.locator(".timeline-count")).toHaveText(/\/\s*100$/, { timeout: 60_000 });
}

/** rAF deltas over FRAMES frames, taken a second into a running sweep. */
async function sweepDeltas(page: Page): Promise<number[]> {
    return page.evaluate(async (n) => {
        await new Promise((r) => setTimeout(r, 1000));
        const out: number[] = [];
        let last = await new Promise<number>((r) => requestAnimationFrame(r));
        while (out.length < n) {
            const now = await new Promise<number>((r) => requestAnimationFrame(r));
            out.push(now - last);
            last = now;
        }
        return out;
    }, FRAMES);
}

function quantile(xs: number[], q: number): number {
    const s = [...xs].sort((a, b) => a - b);
    return s[Math.min(s.length - 1, Math.floor(q * s.length))];
}

async function plotDigest(page: Page): Promise<string> {
    const url = await page.locator(".plot-box canvas").evaluate((c) => (c as HTMLCanvasElement).toDataURL("image/png"));
    return createHash("sha256").update(url).digest("hex").slice(0, 16);
}

for (const cell of CELLS) {
    test.describe(`F-D2 · the convergence sweep at ${cell.width}×${cell.height}`, () => {
        test.use({ viewport: cell });

        test("the sweep is live; its frame times are recorded", async ({ page }) => {
            await openAtMaxHarmonics(page);
            const before = await plotDigest(page);
            const deltas = await sweepDeltas(page);
            const p50 = quantile(deltas, 0.5), p95 = quantile(deltas, 0.95);
            test.info().annotations.push({ type: "frames", description: JSON.stringify({ ...cell, p50, p95, max: Math.max(...deltas) }) });
            expect(deltas.length).toBe(FRAMES);
            expect(await plotDigest(page), "the sweep repaints").not.toBe(before);
        });

        test("the reduced-motion terminal frame (pixel guard)", async ({ browser }) => {
            const context = await browser.newContext({ viewport: cell, reducedMotion: "reduce" });
            try {
                const page = await context.newPage();
                await openAtMaxHarmonics(page);
                await page.waitForTimeout(800); // the 500 ms coefficient transition settles
                test.info().annotations.push({ type: "terminal-frame", description: `${cell.width}x${cell.height} ${await plotDigest(page)}` });
            } finally {
                await context.close();
            }
        });
    });
}

test.describe("F-D2 · the sweep on the real GPU", { tag: "@gpu" }, () => {
    test.beforeAll(async ({ browser }) => {
        await expectHardwareGpu(browser);
    });

    // One 60 Hz interval (headless Chrome's rAF pace) plus timer slack.
    const DISPLAY_INTERVAL = 1000 / 60 + 0.5;
    for (const cell of CELLS) {
        test(`the display rate holds, no frame over 33 ms, at ${cell.width}×${cell.height}`, async ({ browser }) => {
            const context = await browser.newContext({ viewport: cell });
            try {
                const page = await context.newPage();
                await openAtMaxHarmonics(page);
                const deltas = await sweepDeltas(page);
                const p50 = quantile(deltas, 0.5);
                const long = deltas.filter((d) => d > 33).length;
                test.info().annotations.push({ type: "frames", description: JSON.stringify({ ...cell, p50, p95: quantile(deltas, 0.95), long }) });
                expect(p50).toBeLessThanOrEqual(DISPLAY_INTERVAL);
                expect(long).toBe(0);
            } finally {
                await context.close();
            }
        });
    }
});
