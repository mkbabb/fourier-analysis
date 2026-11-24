import { readFileSync } from "node:fs";
import { extname } from "node:path";
import { randomBytes } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { SAMPLE_IMAGE, SAMPLE_MIME } from "./fixtures/sample";
import { isJobPost } from "./fixtures/jobs";
import { showViewIfTabbed } from "./fixtures/workspace";

/**
 * Progress drawn, not described: while an upload's first compute runs the
 * stage shows the picture itself within a second of the job starting, no
 * caption or second copy of the outline stands on it, and the job's measure
 * is the top dock's rim, which moves through extraction in real steps (the
 * drawing's four checkpoints) rather than breathing until the outline lands.
 */

const LOAD = 90_000;

interface Sample {
    at: number;
    painted: number;
    rim: number | null;
    captions: number;
    bars: number;
    outlines: number;
}

/** Sample the stage every 50 ms until `stop()`: painted pixels, the rim's value and what stands on the stage. */
async function startSampling(page: Page): Promise<void> {
    await page.evaluate(() => {
        const w = window as unknown as { __samples: Sample[]; __stop: () => void };
        w.__samples = [];
        const t0 = performance.now();
        const id = window.setInterval(() => {
            const c = document.querySelector(".canvas-stage canvas") as HTMLCanvasElement | null;
            let painted = 0;
            if (c && c.width > 0 && c.height > 0) {
                const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
                for (let i = 3; i < d.length; i += 64) if (d[i]! > 8) painted++;
            }
            const rim = document.querySelector(".app-dock .dock-progress");
            const stage = document.querySelector(".canvas-stage");
            // The stage's own statuses and bars: the dock standing on it keeps
            // glass's live region for its own fold and the clock's position
            // readout (a progressbar of the animation, not of the job), which
            // are the dock's, not the stage's.
            const own = (sel: string) => (stage ? [...stage.querySelectorAll(sel)].filter((e) => !e.closest(".glass-dock")) : []);
            const statuses = own("[role=status]");
            const shown = (els: Iterable<Element>) =>
                [...els].filter((e) => {
                    const r = e.getBoundingClientRect();
                    return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden";
                }).length;
            w.__samples.push({
                at: performance.now() - t0,
                painted,
                rim: rim ? Number(rim.getAttribute("aria-valuenow")) : null,
                captions: shown(statuses.filter((e) => (e.textContent ?? "").trim())),
                bars: shown(own("[role=progressbar]")),
                outlines: stage ? shown(stage.querySelectorAll("svg.stage-outline")) : 0,
            });
        }, 50);
        w.__stop = () => window.clearInterval(id);
    });
}

async function stopSampling(page: Page): Promise<Sample[]> {
    return page.evaluate(() => {
        const w = window as unknown as { __samples: Sample[]; __stop: () => void };
        w.__stop();
        return w.__samples;
    });
}

/**
 * The sample with a few bytes after its end marker: the same picture to every
 * decoder, but new to the API, so its extraction is computed (and reports its
 * checkpoints) instead of answered from the extraction cache.
 */
function freshSample(): { name: string; mimeType: string; buffer: Buffer } {
    return { name: `sample${extname(SAMPLE_IMAGE)}`, mimeType: SAMPLE_MIME, buffer: Buffer.concat([readFileSync(SAMPLE_IMAGE), randomBytes(16)]) };
}

async function uploadAndWatch(page: Page): Promise<Sample[]> {
    await page.goto("/visualize");
    await expect(page.locator(".drop-target")).toBeVisible({ timeout: LOAD });
    const job = page.waitForResponse((r) => isJobPost(r, "images"), { timeout: LOAD });
    await page.getByTestId("image-file-input").setInputFiles(freshSample());
    await job;
    await showViewIfTabbed(page, "Canvas");
    await startSampling(page);
    // Until the drawing is on the stage and the job is done (the busy mark goes).
    const busy = page.locator(".canvas-stage [role=status]:not(.dock-run-status)");
    await expect(busy).toHaveCount(1, { timeout: 10_000 });
    await expect(busy).toHaveCount(0, { timeout: LOAD });
    return stopSampling(page);
}

function judge(samples: Sample[]): void {
    expect(samples.length, "the first compute was sampled").toBeGreaterThan(10);
    // The picture is on the stage within a second of the job starting.
    const firstPaint = samples.find((s) => s.painted > 50);
    expect(firstPaint, "the stage painted the picture").toBeTruthy();
    expect(firstPaint!.at, "the picture is on the stage within 1 s").toBeLessThanOrEqual(1000);
    // No caption, no bar and no copy of the outline on the stage, ever.
    expect(Math.max(...samples.map((s) => s.captions)), "no status caption on the stage").toBe(0);
    expect(Math.max(...samples.map((s) => s.bars)), "no progress bar on the stage").toBe(0);
    expect(Math.max(...samples.map((s) => s.outlines)), "no SVG copy of the outline").toBe(0);
    // The rim moves through the job in real steps, rising.
    const values = samples.map((s) => s.rim).filter((v): v is number => v !== null && v > 0 && v < 1);
    const steps = [...new Set(values.map((v) => v.toFixed(4)))].map(Number);
    expect(steps.length, `the rim rose in steps (${steps.join(", ")})`).toBeGreaterThanOrEqual(4);
    expect(steps, "the rim never falls back").toEqual([...steps].sort((a, b) => a - b));
    const inExtraction = steps.filter((v) => v < 0.85);
    expect(inExtraction.length, `the rim moves inside extraction (${inExtraction.join(", ")})`).toBeGreaterThanOrEqual(3);
}

test.describe("o41 stage — progress drawn, not described (1440)", () => {
    test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: "dark" });
    test.setTimeout(150_000);

    test("the picture stands on the stage at once and the rim measures the job", async ({ page }) => {
        await expect(page.getByText("Finding the outline")).toHaveCount(0);
        judge(await uploadAndWatch(page));
        await expect(page.getByText("Finding the outline")).toHaveCount(0);
    });
});

test.describe("o41 stage — progress drawn, not described (390, 4x CPU) @coarse", () => {
    test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: "dark" });
    test.setTimeout(180_000);

    test("@coarse the picture stands on the stage at once on a throttled phone", async ({ page }) => {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
        try {
            judge(await uploadAndWatch(page));
        } finally {
            await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
        }
    });
});
