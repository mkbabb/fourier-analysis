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
 * moves through extraction in real steps (the drawing's four checkpoints)
 * rather than breathing until the outline lands.
 *
 * FORTY-SIXTH G (FORTY-EIGHTH, his frame: the photo alone, the timeline empty
 * at its start): the measure is the stage dock's timeline row, where the
 * drawing will play, not the top dock's rim (one rendering of it, and the rim
 * carries none). It is determinate from the job's first stage to the landing,
 * rising and never standing still for more than 400 ms. And the drawing shows
 * as it is found: the found lines, in the line's own hue, are on the stage
 * before the drawing lands.
 */

const LOAD = 90_000;

interface Sample {
    at: number;
    painted: number;
    rim: number | null;
    /** The timeline row's measure: its value, null while indeterminate, undefined when there is none. */
    bar: number | null | undefined;
    /** Pixels in the line's hue on the stage canvas (every 16th sampled). */
    line: number;
    /** The drawing has landed (the transport's Play seat is live). */
    landed: boolean;
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
        // The line's hue as the canvas paints it (`--viz-fourier`, resolved).
        const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
        probe.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--viz-fourier").trim() || "#bf4040";
        probe.fillRect(0, 0, 1, 1);
        const [hr, hg, hb] = probe.getImageData(0, 0, 1, 1).data;
        const id = window.setInterval(() => {
            const c = document.querySelector(".canvas-stage canvas") as HTMLCanvasElement | null;
            let painted = 0;
            let line = 0;
            if (c && c.width > 0 && c.height > 0) {
                const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
                for (let i = 3; i < d.length; i += 64) if (d[i]! > 8) painted++;
                for (let i = 0; i < d.length; i += 64) {
                    if (d[i + 3]! > 200 && Math.abs(d[i]! - hr!) + Math.abs(d[i + 1]! - hg!) + Math.abs(d[i + 2]! - hb!) < 60) line++;
                }
            }
            const measure = document.querySelector(".canvas-stage [data-job-measure] [role=progressbar]");
            const now = measure?.getAttribute("aria-valuenow");
            const play = document.querySelector<HTMLButtonElement>('.canvas-stage button[aria-label="Play animation"], .canvas-stage button[aria-label="Pause animation"]');
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
                bar: measure ? (now == null ? null : Number(now)) : undefined,
                line,
                // glass's DockControl marks a seat off with `aria-disabled`.
                landed: !!play && !play.disabled && play.getAttribute("aria-disabled") !== "true",
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
    // The rim carries no job measure: the timeline row is its one rendering.
    expect(samples.filter((s) => s.rim !== null && s.rim > 0 && s.rim < 1).length, "no job measure on the top dock's rim").toBe(0);
    // The timeline row measures the job, rising through extraction, from the
    // job's first stage until the drawing lands.
    const landing = samples.findIndex((s) => s.landed);
    expect(landing, "the drawing landed while sampled").toBeGreaterThan(0);
    const before = samples.slice(0, landing);
    const first = before.findIndex((s) => typeof s.bar === "number");
    expect(first, "a determinate measure before the landing").toBeGreaterThanOrEqual(0);
    const run = before.slice(first);
    expect(run.every((s) => typeof s.bar === "number"), "determinate from its first stage to the landing").toBe(true);
    const values = run.map((s) => s.bar as number);
    for (let i = 1; i < values.length; i++) expect(values[i]!, "the measure never falls back").toBeGreaterThanOrEqual(values[i - 1]!);
    const steps = [...new Set(values.filter((v) => v > 0 && v < 1).map((v) => v.toFixed(4)))].map(Number);
    expect(steps.length, `the measure rose in steps (${steps.length})`).toBeGreaterThanOrEqual(4);
    const inExtraction = steps.filter((v) => v < 0.85);
    expect(inExtraction.length, `the measure moves inside extraction (${inExtraction.length})`).toBeGreaterThanOrEqual(3);
    // Never a still measure: no stretch of more than 400 ms at one value.
    let still = 0;
    let from = run[0]!.at;
    for (let i = 1; i < run.length; i++) {
        if (run[i]!.bar !== run[i - 1]!.bar) from = run[i]!.at;
        still = Math.max(still, run[i]!.at - from);
    }
    expect(still, "the longest stretch the measure stood still (ms)").toBeLessThanOrEqual(400);
    // On the landing it runs on to full as it leaves, never back to indeterminate.
    const leaving = samples.slice(landing).filter((s) => s.bar !== undefined);
    expect(leaving.every((s) => typeof s.bar === "number"), "determinate on its way out").toBe(true);
    expect(Math.max(...leaving.map((s) => s.bar as number)), "the measure runs on to full as it leaves").toBeGreaterThanOrEqual(0.95);
    // The drawing as it is found: lines in the line's hue before the landing,
    // well past what the picture itself holds in that hue at the job's start.
    const atStart = Math.max(...before.slice(0, Math.max(1, first + 1)).map((s) => s.line));
    const found = Math.max(...before.map((s) => s.line));
    expect(found, `the found lines are on the stage before the drawing lands (${atStart} -> ${found})`).toBeGreaterThan(atStart + 40);
}

test.describe("o41 stage — progress drawn, not described (1440)", () => {
    test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: "dark" });
    test.setTimeout(150_000);

    test("the picture stands on the stage at once, the found lines arrive on it, and the timeline measures the job", async ({ page }) => {
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
