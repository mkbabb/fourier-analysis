import { expect, test, type Page } from "@playwright/test";
import { SAMPLE_IMAGE } from "./fixtures/sample";

/**
 * The first compute, cut where the site can (PR 33 review, should-fix 10: the
 * picture came at 1.1 to 1.4 s, and "Uploading…" showed under the button for
 * the first second). The file is already in the browser: from the drop the
 * stage shows its own picture, while it uploads, with one wordless bar where
 * the dock will stand; when the server's overlay lands it takes the picture's
 * place with no blank frame between.
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
            expect(film.frames).toBeGreaterThan(10);
            expect(film.low, `the picture's middle never blanks (at release ${atRelease})`).toBeGreaterThan(atRelease * 0.5);
        });
    });
}
