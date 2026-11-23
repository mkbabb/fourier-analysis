import { expect, test, type Page } from "@playwright/test";

/**
 * FORTY-SIXTH B (owner, 23 Nov, of the visualizer's resting stage: "this should
 * be a procedural animation of different curves, shapes, and be interactive").
 * It drew one shape, the sun, wrote it in over a turn, faded it out to a blank
 * stage and wrote it again, and answered no hand. It is one canvas now that
 * moves through a family of curves by morphing their circles, never blank; a
 * click deals the next at once, the wheel sets the terms, a drag pulls the
 * point under the hand, the keyboard does all of it, Space pauses; under
 * reduced motion it is still and changes by a short fade.
 */

const CANVAS = ".drop-target .rest-drawing canvas";

async function open(page: Page): Promise<void> {
    await page.goto("/visualize");
    await expect(page.locator(CANVAS)).toBeVisible({ timeout: 30_000 });
}

/** Samples the canvas every few frames for `ms`: its shape key, what it draws and its summed ink. */
async function sample(page: Page, ms: number, every = 3): Promise<{ t: number; shape: string; drawing: string; ink: number }[]> {
    return page.evaluate(
        async ([sel, ms, every]) => {
            const c = document.querySelector<HTMLCanvasElement>(sel)!;
            const ctx = c.getContext("2d")!;
            const out: { t: number; shape: string; drawing: string; ink: number }[] = [];
            const t0 = performance.now();
            let f = 0;
            while (performance.now() - t0 < ms) {
                await new Promise(requestAnimationFrame);
                if (f++ % every) continue;
                const d = ctx.getImageData(0, 0, c.width, c.height).data;
                let ink = 0;
                for (let i = 3; i < d.length; i += 4) ink += d[i]!;
                out.push({ t: performance.now() - t0, shape: c.dataset.shape!, drawing: c.dataset.drawing!, ink });
            }
            return out;
        },
        [CANVAS, ms, every] as const,
    );
}

/** A cheap fingerprint of the canvas's pixels. */
async function print(page: Page): Promise<number> {
    return page.evaluate((sel) => {
        const c = document.querySelector<HTMLCanvasElement>(sel)!;
        const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
        let h = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i]) h = (h * 31 + i * d[i]!) % 2147483647;
        return h;
    }, CANVAS);
}

test.describe("the resting stage at a desk", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("it moves through shapes by their circles, and the stage is never blank", async ({ page }) => {
        await open(page);
        // The first turn writes the sun in (7 s); then it stays 1.25 turns and morphs.
        await page.waitForTimeout(7_200);
        const frames = await sample(page, 5_000);
        const shapes = new Set(frames.map((f) => f.shape));
        expect(shapes.size, `the shapes drawn: ${[...shapes].join(", ")}`).toBeGreaterThanOrEqual(2);
        expect(frames.some((f) => f.drawing === "morph"), "a morph was drawn").toBe(true);
        const mean = frames.reduce((a, f) => a + f.ink, 0) / frames.length;
        const least = frames.reduce((a, f) => Math.min(a, f.ink), Infinity);
        expect(least, `the least ink (${least.toFixed(0)}) against the mean (${mean.toFixed(0)})`).toBeGreaterThanOrEqual(mean / 5);
    });

    test("a click deals the next shape, its first changed frame at once", async ({ page }) => {
        await open(page);
        await page.waitForTimeout(800);
        const canvas = page.locator(CANVAS);
        const before = await canvas.getAttribute("data-shape");
        await page.evaluate((sel) => {
            const c = document.querySelector<HTMLCanvasElement>(sel)!;
            const w = window as unknown as { __press: number; __morph: number };
            w.__press = 0;
            w.__morph = 0;
            c.addEventListener("pointerup", () => (w.__press = performance.now()), { capture: true, once: true });
            new MutationObserver(() => {
                if (c.dataset.drawing === "morph" && !w.__morph) w.__morph = performance.now();
            }).observe(c, { attributes: true, attributeFilter: ["data-drawing"] });
        }, CANVAS);
        const box = (await canvas.boundingBox())!;
        await page.mouse.click(box.x + 12, box.y + 12);
        await expect(canvas).not.toHaveAttribute("data-shape", before!);
        await expect.poll(() => page.evaluate(() => (window as unknown as { __morph: number }).__morph)).toBeGreaterThan(0);
        const lag = await page.evaluate(() => {
            const w = window as unknown as { __press: number; __morph: number };
            return w.__morph - w.__press;
        });
        expect(lag, `from the release to the first morph frame: ${lag.toFixed(0)} ms`).toBeLessThanOrEqual(100);
    });

    test("the wheel sets the number of terms and says it", async ({ page }) => {
        await open(page);
        const canvas = page.locator(CANVAS);
        const box = (await canvas.boundingBox())!;
        await page.mouse.move(box.x + 20, box.y + box.height / 2);
        const readout = page.locator(".rest-drawing .rest-terms");
        await expect(readout).toHaveCSS("opacity", "0");
        await page.mouse.wheel(0, -400);
        await expect(readout).toHaveText(/^n = \d+$/);
        const up = Number((await readout.textContent())!.slice(4));
        await expect(readout).toHaveCSS("opacity", "1");
        await page.mouse.wheel(0, 900);
        await expect.poll(async () => Number((await readout.textContent())!.slice(4))).toBeLessThan(up);
        // It fades once the hand stops.
        await expect(readout).toHaveCSS("opacity", "0", { timeout: 4_000 });
    });

    test("a drag pulls the point under the hand, and it springs back", async ({ page }) => {
        await open(page);
        const canvas = page.locator(CANVAS);
        await page.waitForTimeout(7_200); // the whole line written
        await canvas.focus();
        await page.keyboard.press(" ");
        await expect(canvas).toHaveAttribute("data-paused", /.*/);
        await page.waitForTimeout(300);
        const box = (await canvas.boundingBox())!;
        // A point of the line (amber, well inked), away from the pen.
        const at = await page.evaluate((sel) => {
            const c = document.querySelector<HTMLCanvasElement>(sel)!;
            const k = c.width / c.getBoundingClientRect().width;
            const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
            const solid: [number, number][] = [];
            const line: [number, number][] = [];
            for (let y = 0; y < c.height; y++)
                for (let x = 0; x < c.width; x++) {
                    const i = 4 * (y * c.width + x);
                    const [r, g, b, a] = [d[i]!, d[i + 1]!, d[i + 2]!, d[i + 3]!];
                    if (!(r > g && g > b)) continue;
                    if (a >= 250) solid.push([x, y]);
                    else if (a >= 150) line.push([x, y]);
                }
            const far = line.filter(([x, y]) => solid.every(([u, v]) => Math.hypot(u - x, v - y) > 40 * k));
            const [x, y] = far[Math.floor(far.length / 2)]!;
            return { x: x / k, y: y / k, k, solid };
        }, CANVAS);
        const px = box.x + at.x;
        const py = box.y + at.y;
        await page.mouse.move(px, py);
        await page.mouse.down();
        await page.mouse.move(px + 30, py + 20, { steps: 8 });
        await page.waitForTimeout(150);
        const held = await page.evaluate(
            ([sel, tx, ty, before]) => {
                const c = document.querySelector<HTMLCanvasElement>(sel)!;
                const k = c.width / c.getBoundingClientRect().width;
                const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
                let sx = 0, sy = 0, n = 0;
                for (let y = Math.floor((ty - 12) * k); y <= (ty + 12) * k; y++)
                    for (let x = Math.floor((tx - 12) * k); x <= (tx + 12) * k; x++) {
                        const i = 4 * (y * c.width + x);
                        if (d[i + 3]! < 250 || !(d[i]! > d[i + 1]! && d[i + 1]! > d[i + 2]!)) continue;
                        if ((before as [number, number][]).some(([u, v]) => u === x && v === y)) continue;
                        sx += x;
                        sy += y;
                        n++;
                    }
                return n ? { x: sx / n / k, y: sy / n / k, n } : null;
            },
            [CANVAS, at.x + 30, at.y + 20, at.solid] as const,
        );
        expect(held, "the held point is drawn under the hand").not.toBeNull();
        const off = Math.hypot(held!.x - (at.x + 30), held!.y - (at.y + 20));
        expect(off, `the held point is ${off.toFixed(2)} px from the hand`).toBeLessThanOrEqual(2);
        await page.mouse.up();
        await page.waitForTimeout(1_500);
        // Back at rest: the line is where it was, and nothing is held.
        const back = await page.evaluate(
            ([sel, x, y]) => {
                const c = document.querySelector<HTMLCanvasElement>(sel)!;
                const k = c.width / c.getBoundingClientRect().width;
                const d = c.getContext("2d")!.getImageData(Math.round(x * k) - 1, Math.round(y * k) - 1, 3, 3).data;
                let a = 0;
                for (let i = 3; i < d.length; i += 4) a = Math.max(a, d[i]!);
                return a;
            },
            [CANVAS, at.x, at.y] as const,
        );
        expect(back, "the line is back where it was").toBeGreaterThanOrEqual(120);
    });

    test("the keyboard deals, steps back, sets the terms and pauses", async ({ page }) => {
        await open(page);
        const canvas = page.locator(CANVAS);
        await canvas.focus();
        const first = (await canvas.getAttribute("data-shape"))!;
        await expect(canvas).toHaveAttribute("aria-label", /^A drawing in circles: the sun/);
        await page.keyboard.press("ArrowRight");
        await expect(canvas).not.toHaveAttribute("data-shape", first);
        const second = (await canvas.getAttribute("data-shape"))!;
        await expect(canvas).not.toHaveAttribute("aria-label", /the sun/);
        await page.keyboard.press("ArrowLeft");
        await expect(canvas).toHaveAttribute("data-shape", first);
        await page.keyboard.press("ArrowRight");
        await expect(canvas).toHaveAttribute("data-shape", second);

        await page.waitForTimeout(2_000); // the morph done: the shape's own terms
        const readout = page.locator(".rest-drawing .rest-terms");
        await page.keyboard.press("ArrowUp");
        const n = Number((await readout.textContent())!.slice(4));
        await page.keyboard.press("ArrowUp");
        await expect(readout).toHaveText(`n = ${n + 1}`);
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("ArrowDown");
        await expect(readout).toHaveText(`n = ${n - 1}`);

        await page.keyboard.press(" ");
        await expect(canvas).toHaveAttribute("data-paused", /.*/);
        await page.waitForTimeout(500);
        const still = await print(page);
        await page.waitForTimeout(400);
        expect(await print(page), "paused, it holds still").toBe(still);
        await page.keyboard.press(" ");
        await expect(canvas).not.toHaveAttribute("data-paused", /.*/);
        await page.waitForTimeout(300);
        expect(await print(page), "played, it moves").not.toBe(still);
    });
});

test("under reduced motion it is still, and a tap changes it by a short fade", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page);
    await page.waitForTimeout(600);
    const a = await print(page);
    await page.waitForTimeout(500);
    expect(await print(page), "nothing moves on its own").toBe(a);

    const canvas = page.locator(CANVAS);
    const box = (await canvas.boundingBox())!;
    const film = page.evaluate(async (sel) => {
        const c = document.querySelector<HTMLCanvasElement>(sel)!;
        const ctx = c.getContext("2d")!;
        const out: { t: number; h: number }[] = [];
        let t0 = 0;
        c.addEventListener("pointerup", () => (t0 = performance.now()), { capture: true, once: true });
        const start = performance.now();
        while (performance.now() - start < 2_000) {
            await new Promise(requestAnimationFrame);
            if (!t0) continue;
            const d = ctx.getImageData(0, 0, c.width, c.height).data;
            let h = 0;
            for (let i = 3; i < d.length; i += 4) if (d[i]) h = (h * 31 + i * d[i]!) % 2147483647;
            out.push({ t: performance.now() - t0, h });
            if (performance.now() - t0 > 600) break;
        }
        return out;
    }, CANVAS);
    await page.waitForTimeout(100);
    await page.mouse.click(box.x + 12, box.y + 12);
    const frames = await film;
    const last = frames.at(-1)!.h;
    expect(last, "the tap changed the drawing").not.toBe(a);
    const first = frames.find((f) => f.h !== a)!.t;
    const settled = frames.find((f) => f.h === last)!.t;
    const between = new Set(frames.filter((f) => f.t < settled && f.h !== a).map((f) => f.h));
    expect(first, `the first changed frame ${first.toFixed(0)} ms after the tap`).toBeLessThanOrEqual(50);
    // The fade's own length, first changed frame to last, within a frame of 150 ms.
    expect(settled - first, `the fade took ${(settled - first).toFixed(0)} ms`).toBeLessThanOrEqual(150 + 17);
    expect(between.size, "a fade, not a cut").toBeGreaterThanOrEqual(3);
});

test("on a throttled phone no frame through a morph runs past 33 ms @coarse", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "CPU throttling is Chromium's");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
        const longest = { ms: 0 };
        (window as unknown as { __longest: typeof longest }).__longest = longest;
        const raf = window.requestAnimationFrame.bind(window);
        window.requestAnimationFrame = (cb) =>
            raf((t) => {
                const s = performance.now();
                cb(t);
                longest.ms = Math.max(longest.ms, performance.now() - s);
            });
    });
    await open(page);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    try {
        await page.waitForTimeout(1_000);
        await page.evaluate(() => ((window as unknown as { __longest: { ms: number } }).__longest.ms = 0));
        await page.locator(CANVAS).tap();
        await page.waitForTimeout(2_500);
        const ms = await page.evaluate(() => (window as unknown as { __longest: { ms: number } }).__longest.ms);
        expect(ms, `the longest frame callback through a morph: ${ms.toFixed(1)} ms`).toBeLessThan(33);
    } finally {
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    }
});
