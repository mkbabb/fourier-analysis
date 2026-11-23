import { expect, test, type Page } from "@playwright/test";
import { SAMPLE_IMAGE } from "./fixtures/sample";
import { IMAGE_JOB } from "./fixtures/jobs";

/**
 * The first compute, cut where the site can (PR 33 review, should-fix 10: the
 * picture came at 1.1 to 1.4 s, and "Uploading…" showed under the button for
 * the first second). The file is already in the browser: from the drop the
 * stage shows its own picture, while it uploads, with one wordless bar where
 * the dock will stand; when the server's overlay lands it takes the picture's
 * place with no blank frame between.
 *
 * And it never jumps (PR 35 review, blocker 3): the stage's plate stands from
 * the drop, so the picture is first fitted above it, and nothing moves it
 * when the upload lands. Its painted box is filmed from the drop to the first
 * drawing; between two frames it moves at most 2 px, except while the stage
 * itself is resized (the aside opening at a desk), which carries it.
 */

/** Painted (alpha > 40) samples in the middle of the stage canvas. */
async function painted(page: Page): Promise<number> {
    return page.evaluate(() => {
        const c = document.querySelector<HTMLCanvasElement>(".canvas-stage > .canvas-container canvas");
        const ctx = c?.getContext("2d");
        if (!c || !ctx || !c.width || !c.height) return 0;
        const w = Math.min(160, c.width);
        const h = Math.min(160, c.height);
        const d = ctx.getImageData(Math.round((c.width - w) / 2), Math.round((c.height - h) / 2), w, h).data;
        let n = 0;
        for (let i = 3; i < d.length; i += 16) if (d[i]! > 40) n++;
        return n;
    });
}

interface PictureBox {
    top: number;
    bottom: number;
    left: number;
    right: number;
}
interface BoxFrame {
    /** The canvas's backing size: a change is the stage's own resize. */
    w: number;
    h: number;
    /** The picture's painted box in CSS px (alpha > 40), or null while nothing is painted. */
    box: PictureBox | null;
}

/**
 * Film the stage canvas's painted box on every frame, until the first drawing
 * (the Play seat comes alive, and the intro takes the view from the picture's
 * fit to the drawing's). The box is read on the column through the stage's
 * centre (the picture's top and bottom) and the row through its middle (its
 * sides), at full resolution.
 */
function filmPictureBox(): void {
    const rec = { frames: [] as unknown[], done: false };
    (window as unknown as { __box: typeof rec }).__box = rec;
    const tick = () => {
        const play = document.querySelector(
            '.animation-dock button[aria-label="Play animation"], .animation-dock button[aria-label="Pause animation"]',
        );
        if (play && play.getAttribute("aria-disabled") !== "true") {
            rec.done = true;
            return;
        }
        const c = document.querySelector<HTMLCanvasElement>(".canvas-stage > .canvas-container canvas");
        const ctx = c?.getContext("2d");
        if (c && ctx && c.width && c.height) {
            const W = c.width;
            const H = c.height;
            const dpr = devicePixelRatio || 1;
            const col = ctx.getImageData(Math.floor(W / 2), 0, 1, H).data;
            let top = -1;
            let bottom = -1;
            for (let y = 0; y < H; y++) if (col[y * 4 + 3]! > 40) { top = y; break; }
            for (let y = H - 1; y >= 0; y--) if (col[y * 4 + 3]! > 40) { bottom = y; break; }
            let box: PictureBox | null = null;
            if (top >= 0) {
                const row = ctx.getImageData(0, Math.floor((top + bottom) / 2), W, 1).data;
                let left = -1;
                let right = -1;
                for (let x = 0; x < W; x++) if (row[x * 4 + 3]! > 40) { left = x; break; }
                for (let x = W - 1; x >= 0; x--) if (row[x * 4 + 3]! > 40) { right = x; break; }
                box = { top: top / dpr, bottom: (bottom + 1) / dpr, left: left / dpr, right: (right + 1) / dpr };
            }
            rec.frames.push({ w: W, h: H, box });
        }
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

const CELLS = [
    { width: 1440, height: 900, scheme: "dark" },
    { width: 1440, height: 900, scheme: "light" },
    { width: 390, height: 844, scheme: "dark" },
    { width: 390, height: 844, scheme: "light" },
] as const;

for (const c of CELLS) {
    const phone = c.width < 640;
    test.describe(`the first picture (${c.width} ${c.scheme})`, () => {
        test.use({
            viewport: { width: c.width, height: c.height },
            colorScheme: c.scheme,
            ...(phone ? { isMobile: true, hasTouch: true } : {}),
        });
        test.setTimeout(90_000);

        test("the dropped file's picture shows while it uploads, with one wordless mark, and the server's takes its place", async ({ page }) => {
            let release!: () => void;
            const held = new Promise<void>((r) => (release = r));
            let seenUpload = false;
            await page.route("**/api/images", async (route) => {
                if (route.request().method() !== "POST") return route.fallback();
                seenUpload = true;
                await held;
                await route.fallback();
            });
            // The first drawing is held too, until the film ends: its intro
            // dims the picture to the drawing's ground by design, and on a fast
            // host it lands within a quarter second of the upload, inside the
            // window this film reads (the server's picture taking the file's).
            let releaseCompute!: () => void;
            const computeHeld = new Promise<void>((r) => (releaseCompute = r));
            await page.route(IMAGE_JOB, async (route) => {
                if (route.request().method() !== "POST") return route.fallback();
                await computeHeld;
                await route.fallback();
            });
            await page.goto("/visualize");
            await expect(page.locator(".drop-target")).toBeVisible({ timeout: 60_000 });
            await page.getByTestId("image-file-input").setInputFiles(SAMPLE_IMAGE);
            await expect.poll(() => seenUpload).toBe(true);

            // The upload is held: the stage shows the file's picture within 1.5 s.
            const t0 = Date.now();
            await expect.poll(() => painted(page), { timeout: 1_500, intervals: [50] }).toBeGreaterThan(300);
            test.info().annotations.push({ type: "picture-after-ms", description: String(Date.now() - t0) });
            expect(page.url(), "the upload has not landed").not.toMatch(/\/w\/[^/]+/);
            await expect(page.locator(".drop-target")).toHaveCount(0);
            await expect(page.getByText(/Uploading/)).toHaveCount(0);
            const bar = page.getByRole("progressbar", { name: "Uploading the image" });
            await expect(bar).toHaveCount(1);
            await expect(bar).toBeVisible();
            const stage = (await page.locator(".canvas-stage").boundingBox())!;
            const b = (await bar.boundingBox())!;
            expect(b.x).toBeGreaterThanOrEqual(stage.x);
            expect(b.x + b.width).toBeLessThanOrEqual(stage.x + stage.width);
            expect(b.y + b.height).toBeLessThanOrEqual(stage.y + stage.height);

            // Film the middle of the stage from the release until 1.2 s after the
            // upload lands (the server's overlay is fetched then, and the first
            // drawing is seconds away): the picture never blanks.
            const atRelease = await painted(page);
            await page.evaluate(() => {
                const w = window as unknown as { __low: number; __frames: number; __stop: boolean };
                w.__low = Infinity;
                w.__frames = 0;
                w.__stop = false;
                const tick = () => {
                    const c = document.querySelector<HTMLCanvasElement>(".canvas-stage > .canvas-container canvas");
                    const ctx = c?.getContext("2d");
                    if (c && ctx && c.width && c.height) {
                        const s = Math.min(160, c.width, c.height);
                        const d = ctx.getImageData(Math.round((c.width - s) / 2), Math.round((c.height - s) / 2), s, s).data;
                        let n = 0;
                        for (let i = 3; i < d.length; i += 16) if (d[i]! > 40) n++;
                        w.__low = Math.min(w.__low, n);
                        w.__frames++;
                    }
                    if (!w.__stop) requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
            });
            release();
            await page.waitForURL(/\/w\//, { timeout: 20_000 });
            await expect(bar).toHaveCount(0, { timeout: 5_000 });
            await page.waitForTimeout(1200);
            const film = await page.evaluate(() => {
                const w = window as unknown as { __low: number; __frames: number; __stop: boolean };
                w.__stop = true;
                return { low: w.__low, frames: w.__frames };
            });
            releaseCompute();
            expect(film.frames).toBeGreaterThan(10);
            expect(film.low, `the picture's middle never blanks (at release ${atRelease})`).toBeGreaterThan(atRelease * 0.5);
        });

        test("from the drop to the first drawing the picture never jumps: at most 2 px between two frames", async ({ page }) => {
            test.setTimeout(120_000);
            let release!: () => void;
            const held = new Promise<void>((r) => (release = r));
            await page.route("**/api/images", async (route) => {
                if (route.request().method() !== "POST") return route.fallback();
                await held;
                await route.fallback();
            });
            await page.goto("/visualize");
            await expect(page.locator(".drop-target")).toBeVisible({ timeout: 60_000 });
            await page.evaluate(filmPictureBox);
            await page.getByTestId("image-file-input").setInputFiles(SAMPLE_IMAGE);
            // The upload is held until the file's own picture stands, so the
            // upload's landing (where the plate used to arrive) is filmed.
            await expect.poll(() => painted(page), { timeout: 1_500, intervals: [50] }).toBeGreaterThan(300);
            // Held until the picture has stood for 30 frames of one stage size,
            // whatever the host's frame rate (a slow raster at a desk paints
            // fewer frames in a fixed wait, and the aside's spring resizes the
            // stage for the first of them).
            await page.waitForFunction(() => {
                const f = (window as unknown as { __box: { frames: { w: number; h: number; box: unknown }[] } }).__box.frames;
                let run = 0;
                for (let i = f.length - 1; i > 0 && f[i]!.box && f[i]!.w === f[i - 1]!.w && f[i]!.h === f[i - 1]!.h; i--) run++;
                return run >= 30;
            }, null, { timeout: 30_000, polling: 50 });
            release();
            await page.waitForURL(/\/w\//, { timeout: 20_000 });
            await page.waitForFunction(() => (window as unknown as { __box: { done: boolean } }).__box.done, null, { timeout: 60_000 });
            const frames = (await page.evaluate(() => (window as unknown as { __box: { frames: BoxFrame[] } }).__box.frames)) as BoxFrame[];

            let pairs = 0;
            let worst = { d: 0, i: -1 };
            for (let i = 1; i < frames.length; i++) {
                const a = frames[i - 1]!;
                const b = frames[i]!;
                // The stage's own resize carries the picture with it (the aside's spring at a desk).
                if (!a.box || !b.box || a.w !== b.w || a.h !== b.h) continue;
                pairs++;
                const d = Math.max(
                    Math.abs(b.box.top - a.box.top),
                    Math.abs(b.box.bottom - a.box.bottom),
                    Math.abs(b.box.left - a.box.left),
                    Math.abs(b.box.right - a.box.right),
                );
                if (d > worst.d) worst = { d, i };
            }
            const shown = frames.filter((f) => f.box).length;
            test.info().annotations.push({ type: "picture-box-film", description: JSON.stringify({ frames: frames.length, shown, pairs, worst }) });
            expect(shown, "frames with the picture on the stage before the first drawing").toBeGreaterThan(20);
            expect(pairs, "frame pairs compared").toBeGreaterThan(20);
            const around = frames.slice(Math.max(0, worst.i - 2), worst.i + 2);
            expect(worst.d, `the picture's largest move between two frames ${JSON.stringify(around)}`).toBeLessThanOrEqual(2);
        });
    });
}
