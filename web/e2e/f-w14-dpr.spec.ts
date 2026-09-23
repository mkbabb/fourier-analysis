import { expect, test, type Page } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * X.F.W14 `.p` — OA-44, crisp visualizations (COHESION §0bw; frame
 * `fourier/evidence/W14/owner-2026-09-23-blurry.png`).
 *
 * G-p, on the served page at DPR 1 and 2:
 *   1. every visible <canvas> holds a backing store of exactly
 *      round(clientWidth × dpr) × round(clientHeight × dpr) — at rest, after a
 *      viewport resize, after a DPR change (a window moved between displays),
 *      and after a browser-zoom step (CSS viewport and DPR change together);
 *   2. a 1-px stroke (the plot grid) read off a device-scale screen crop at rest spans
 *      ≤ 2 device pixels of transition — a stale bitmap stretched by CSS smears
 *      the same stroke over 4+;
 *   3. the crops are written beside this spec (`screenshots/f-w14/`).
 *
 * The surfaces: `/equation` (ConvergencePlot) and the image mode on `/w`
 * (BasisCanvas — the epicycles of the owner's frame — and FrequencyGraph under
 * the Coefficients layer). `/`, `/morph`, `/gallery` mount no canvas.
 */

const TEST_IMAGE = path.resolve(import.meta.dirname, "../../assets/animals/golden-retriever.webp");
const SHOTS = path.resolve(import.meta.dirname, "screenshots/f-w14");
const PHASE = process.env.FW14_PHASE ?? "after";
const W = 1440;
const H = 900;

interface CanvasRead {
    name: string;
    width: number;
    height: number;
    cw: number;
    ch: number;
    /** The CSS box at layout precision, and its edges (for the device-snapped box). */
    box: { l: number; t: number; w: number; h: number };
    dpr: number;
}

/** Every visible canvas's backing store against its CSS box × the live DPR. */
function readCanvases(page: Page): Promise<CanvasRead[]> {
    return page.evaluate(() =>
        [...document.querySelectorAll("canvas")]
            .filter((c) => c.clientWidth > 0 && c.clientHeight > 0 && c.checkVisibility())
            .map((c) => ({
                name: `${c.parentElement?.className.split(/\s+/)[0] || "?"} > canvas.${c.className.split(/\s+/)[0] || ""}`,
                width: c.width,
                height: c.height,
                cw: c.clientWidth,
                ch: c.clientHeight,
                box: (({ left, top, width, height }) => ({ l: left, t: top, w: width, h: height }))(
                    c.getBoundingClientRect(),
                ),
                dpr: window.devicePixelRatio,
            })),
    );
}

/**
 * `clientWidth` is the CSS box rounded to an integer by the DOM, so on a
 * fractional box (the image-mode stage is 802.5 px wide at 1440) the literal
 * `round(clientWidth × dpr)` names a bitmap one device pixel wider than the box
 * it paints — a resample. The gate reads the same law at layout precision: the
 * backing store is `round(width × dpr)` of the CSS box, or that box snapped to
 * the device grid (`devicePixelContentBoxSize`), per axis. On an integer box
 * both equal `round(clientWidth × dpr)`.
 */
function fits(size: number, start: number, extent: number, dpr: number): boolean {
    return size === Math.round(extent * dpr) || size === Math.round((start + extent) * dpr) - Math.round(start * dpr);
}

function misfits(reads: CanvasRead[]): string[] {
    return reads
        .filter((r) => !fits(r.width, r.box.l, r.box.w, r.dpr) || !fits(r.height, r.box.t, r.box.h, r.dpr))
        .map(
            (r) =>
                `${r.name} ${r.width}×${r.height} ≠ (${r.box.w}×${r.dpr})×(${r.box.h}×${r.dpr}) [client ${r.cw}×${r.ch}]`,
        );
}

/** Two frames — enough for a ResizeObserver / media-query change to land and repaint. */
async function frames(page: Page): Promise<void> {
    await page.evaluate(
        () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
    );
    await page.waitForTimeout(150);
}

/**
 * The DPR change a display move makes: same CSS viewport, a new deviceScaleFactor.
 *
 * Measured (2026-09-23, headed Chromium): a CDP `deviceScaleFactor` change
 * updates `devicePixelRatio` but tells the page nothing — no `resize`, no
 * `devicePixelContentBoxSize` entry (that box reports the physical screen under
 * emulation), and no `(resolution)` media-query `change` until media values are
 * next re-evaluated. A real display move re-evaluates them (that is the event
 * the app listens for), so the instrument re-evaluates them too: an
 * `emulateMedia` round-trip that changes no feature the app reads. The app's
 * code is not touched and no event is synthesised.
 */
async function setMetrics(page: Page, width: number, height: number, dpr: number): Promise<void> {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: dpr, mobile: false });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.emulateMedia({ reducedMotion: null });
    await frames(page);
}

/**
 * A 1-px stroke's cross-section, read off a device-scale crop in the page.
 * Per scan row: background = the row's median; each run of ink ≥ 1.5 levels is
 * one stroke crossing. Its integrated ink I over its nominal width (1 CSS px =
 * dpr device px) gives the full-ink level F = I / dpr — independent of the
 * stroke's alpha, and conserved by any resampling. Transition pixels are those
 * strictly between 15% and 85% of F. Runs wider than 4·dpr + 4 are not 1-px
 * strokes; nor is a run carrying over twice the crop's median ink (the 1.8-px,
 * 0.25-alpha axis) — both are left out. Resampling conserves a stroke's ink, so
 * a smeared grid line is still counted.
 */
async function strokeEdge(page: Page, png: Buffer, cssWidth: number): Promise<{ lines: number; worst: number; dpr: number }> {
    return page.evaluate(
        async ({ b64, cssWidth }) => {
            const img = new Image();
            img.src = `data:image/png;base64,${b64}`;
            await img.decode();
            const cv = document.createElement("canvas");
            cv.width = img.naturalWidth;
            cv.height = img.naturalHeight;
            const cx = cv.getContext("2d", { willReadFrequently: true })!;
            cx.drawImage(img, 0, 0);
            // The crop's own device scale (device px per CSS px), read off its bytes.
            const dpr = img.naturalWidth / cssWidth;
            const scan = (vertical: boolean) => {
                const out: { ink: number; run: number[] }[] = [];
                const [n, m] = vertical ? [cv.width, cv.height] : [cv.height, cv.width];
                for (let k = Math.floor(n * 0.1); k < n * 0.9; k += Math.max(1, Math.floor(n / 12))) {
                    const px = vertical ? cx.getImageData(k, 0, 1, m).data : cx.getImageData(0, k, m, 1).data;
                    const lum: number[] = [];
                    for (let i = 0; i < m; i++) lum.push(0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2]);
                    const bg = [...lum].sort((a, b) => a - b)[Math.floor(m / 2)];
                    const d = lum.map((v) => Math.abs(v - bg));
                    for (let i = 0; i < m; i++) {
                        if (d[i] < 1.5) continue;
                        let j = i;
                        while (j < m && d[j] >= 1.5) j++;
                        const run = d.slice(i, j);
                        if (i > 0 && j < m && run.length <= 4 * dpr + 4)
                            out.push({ ink: run.reduce((a, b) => a + b, 0), run });
                        i = j;
                    }
                }
                return out;
            };
            const runs = [...scan(false), ...scan(true)];
            const median = [...runs.map((r) => r.ink)].sort((a, b) => a - b)[Math.floor(runs.length / 2)] ?? 0;
            const all = runs
                .filter((r) => r.ink <= 2 * median)
                .map((r) => {
                    const F = r.ink / dpr;
                    return r.run.filter((v) => v > 0.15 * F && v < 0.85 * F).length;
                });
            return { lines: all.length, worst: all.length ? Math.max(...all) : -1, dpr };
        },
        { b64: png.toString("base64"), cssWidth },
    );
}

async function crop(page: Page, selector: string, name: string) {
    const box = (await page.locator(selector).first().boundingBox())!;
    // The grid's left field at mid-height: clear of the painted labels (top-left),
    // the centred figure and the controls dock (bottom).
    const clip = { x: box.x + 8, y: box.y + box.height * 0.4, width: Math.min(160, box.width / 4), height: Math.min(120, box.height / 4) };
    // Read at the launch DPR only: after a CDP DPR change neither capture path
    // renders at the page's live DPR (Playwright's keeps the context's; CDP's
    // headed capture takes the physical screen's), so a crop there would measure
    // the capture's resampling, not the page. The crop's scale is asserted below.
    const png = await page.screenshot({ clip, scale: "device" });
    fs.writeFileSync(path.join(SHOTS, `${PHASE}-dpr-${name}.png`), png);
    return strokeEdge(page, png, clip.width);
}

/** The epicycle chain itself (fitted to the stage's lower left) — the owner's frame, before/after. */
async function figureCrop(page: Page, name: string): Promise<void> {
    const box = (await page.locator(".canvas-el").first().boundingBox())!;
    const clip = { x: box.x, y: box.y + box.height * 0.45, width: box.width * 0.5, height: box.height * 0.55 };
    fs.writeFileSync(path.join(SHOTS, `${PHASE}-dpr-${name}.png`), await page.screenshot({ clip, scale: "device" }));
}

async function openImage(page: Page): Promise<void> {
    await page.goto("/visualize");
    await expect(page.locator(".drop-target")).toBeVisible({ timeout: 60_000 });
    await page.getByTestId("image-file-input").setInputFiles(TEST_IMAGE);
    await page.waitForURL(/\/w\//, { timeout: 20_000 });
    await expect(page.getByRole("button", { name: /Replace image/ })).toBeVisible({ timeout: 60_000 });
    await page.getByText("Coefficients", { exact: true }).first().click();
    await expect(page.locator(".canvas-el")).toBeVisible();
    await page.waitForTimeout(800);
}

for (const dpr of [1, 2]) {
    test.describe(`G-p at DPR ${dpr}`, () => {
        test.use({ deviceScaleFactor: dpr, viewport: { width: W, height: H } });

        for (const route of ["equation", "image"] as const) {
            test(`${route}: backing store = CSS × dpr at rest, resize, DPR change, zoom`, async ({ page }) => {
                test.setTimeout(120_000);
                if (route === "equation") {
                    await page.goto("/equation");
                    await expect(page.locator(".convergence-container canvas")).toBeVisible({ timeout: 60_000 });
                    await page.waitForTimeout(800);
                } else {
                    await openImage(page);
                }
                const failures: string[] = [];
                const seen = new Set<string>();
                const limb = async (label: string) => {
                    const reads = await readCanvases(page);
                    reads.forEach((r) => seen.add(r.name));
                    failures.push(...misfits(reads).map((m) => `${label}: ${m}`));
                    return reads;
                };
                await limb("rest");

                if (route === "image") {
                    const edge = await crop(page, ".canvas-el", `epicycles-${dpr}x-rest`);
                    expect(edge.lines, "a 1-px grid stroke is in the crop").toBeGreaterThan(0);
                    expect(edge.dpr, "the crop is read at the page's DPR").toBeCloseTo(dpr, 1);
                    await figureCrop(page, `epicycles-${dpr}x-figure`);
                    if (edge.worst > 2) failures.push(`rest: stroke edge spans ${edge.worst} device px of transition (crop ${edge.dpr}×, ${edge.lines} crossings)`);
                }

                await page.setViewportSize({ width: 1180, height: 820 });
                await frames(page);
                await limb("resize 1180×820");

                const other = dpr === 1 ? 2 : 1;
                await setMetrics(page, 1180, 820, other);
                await limb(`DPR ${dpr}→${other}`);

                // Browser zoom 125 %: the CSS viewport shrinks and the DPR grows together.
                await setMetrics(page, Math.round(1180 / 1.25), Math.round(820 / 1.25), dpr * 1.25);
                await limb(`zoom 125% (dpr ${dpr * 1.25})`);

                expect(seen.size, "canvases measured").toBeGreaterThan(0);
                expect(failures, [...seen].join(" | ")).toEqual([]);
            });
        }
    });
}
