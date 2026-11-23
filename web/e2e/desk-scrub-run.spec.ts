import { expect, test, type Page } from "@playwright/test";
import { seededViz } from "./fixtures/seed";

/**
 * The desk's scrub, given back its run (PR 33 review: 790 px before the stage
 * had one dock, 350 px after, the seats taking the row). The stage keeps one
 * dock, and at a desk it is the phone's plate made long: the scrub alone on
 * its row, as long as the stage allows up to 52rem, and the seats under it in
 * four groups (Play | the four layers | the rate, the easing, More | Edit),
 * gathered at its two ends.
 * The plate stands open: a fold would have to morph its height, and the
 * scrub is pressed from rest.
 */

const LOAD = 60_000;

async function openViz(page: Page): Promise<void> {
    await page.goto(`/v/${seededViz().slug}?t=0.5`);
    await expect(page.locator(".animation-dock")).toBeVisible({ timeout: LOAD });
    await expect(page.getByRole("button", { name: "Play animation" }).first()).toBeEnabled({ timeout: LOAD });
}

for (const scheme of ["dark", "light"] as const) {
    test.describe(`the desk's scrub (1440, ${scheme})`, () => {
        test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme });
        test.setTimeout(90_000);

        test("the scrub has its own row, 780 px or longer, inside one plate", async ({ page }) => {
            await openViz(page);
            const dock = page.locator(".animation-dock");
            await expect(page.locator(".canvas-stage .glass-dock")).toHaveCount(1);
            const read = await dock.evaluate((d) => {
                const box = (e: Element) => e.getBoundingClientRect();
                const scrubRow = d.querySelector(".card-scrub")!;
                const slider = scrubRow.querySelector('[role="slider"]')!.closest(".timeline-slider") ?? scrubRow;
                const seats = [...d.querySelectorAll<HTMLElement>(".card-seats button")].filter((b) => b.getClientRects().length);
                const p = box(d);
                return {
                    run: box(slider).width,
                    buttonsOnScrubRow: scrubRow.querySelectorAll("button").length,
                    scrubBottom: box(scrubRow).bottom,
                    seatsTop: Math.min(...seats.map((b) => box(b).top)),
                    names: seats.map((b) => b.getAttribute("aria-label")),
                    edges: seats.map((b) => ({ l: box(b).left, r: box(b).right })),
                    outside: seats
                        .map((b) => ({ n: b.getAttribute("aria-label"), r: box(b) }))
                        .filter(({ r }) => r.left < p.left - 0.5 || r.right > p.right + 0.5 || r.top < p.top - 0.5 || r.bottom > p.bottom + 0.5)
                        .map(({ n }) => n),
                };
            });
            expect(read.run, "the scrub's run").toBeGreaterThanOrEqual(780);
            expect(read.buttonsOnScrubRow, "no seat on the scrub's row").toBe(0);
            expect(read.seatsTop, "the seats stand under the scrub").toBeGreaterThanOrEqual(read.scrubBottom - 0.5);
            expect(read.names[0]).toMatch(/^(Play|Pause) animation$/);
            expect(read.names.slice(1)).toEqual(["Picture", "Outline", "Line", "Circles", "Playback speed", "Easing", "More", "Edit contour"]);
            expect(read.outside, "seats outside the plate").toEqual([]);
            // The seats gather at the plate's two ends, as a media bar's do: Play
            // and the four layers at the start, the rate, the easing, More and
            // Edit at the end; inside each end no gap is wider than a group's.
            const gaps = read.edges.slice(1).map((e, i) => e.l - read.edges[i]!.r);
            expect(gaps.slice(0, 4).every((g) => g <= 12), `the start's gaps ${JSON.stringify(gaps)}`).toBe(true);
            expect(gaps.slice(5).every((g) => g <= 12), `the end's gaps ${JSON.stringify(gaps)}`).toBe(true);
            expect(gaps[4], "the one open stretch, between the layers and the rate").toBeGreaterThan(200);
            const stage = (await page.locator(".canvas-stage").boundingBox())!;
            const plate = (await dock.boundingBox())!;
            expect(plate.x).toBeGreaterThanOrEqual(stage.x);
            expect(plate.x + plate.width).toBeLessThanOrEqual(stage.x + stage.width);
        });

        test("the plate stands open with the pointer away, and the scrub is dragged from rest", async ({ page }) => {
            await openViz(page);
            const dock = page.locator(".animation-dock");
            await page.mouse.move(2, 450);
            await page.waitForTimeout(3500);
            await expect(dock).toHaveClass(/\bexpanded\b/);
            await expect(dock.getByRole("button", { name: "Expand dock" })).toHaveCount(0);
            const slider = dock.getByRole("slider", { name: "Timeline" });
            const before = Number(await slider.getAttribute("aria-valuenow"));
            const track = (await dock.locator(".card-scrub").boundingBox())!;
            const y = track.y + track.height / 2;
            await page.mouse.move(track.x + track.width * 0.9, y);
            await page.mouse.down();
            // In moves of about 20 px, as a hand drags. Glass's Slider measures the
            // drag from the first move after the press, so the thumb trails the
            // pointer by that move (an 80 px first step left it 0.1 short; base
            // and head alike, relayed to glass).
            await page.mouse.move(track.x + track.width * 0.1, y, { steps: 32 });
            await page.mouse.up();
            const after = Number(await slider.getAttribute("aria-valuenow"));
            expect(Math.abs(after - before), "the drag moved the position").toBeGreaterThan(0.3);
        });
    });
}

/**
 * The epicycle inset stands on the plate (PR 35 review, should-fix 1). The
 * plate is two rows at a desk now, and the inset's reserve was one dock row
 * (about 79 px at 1440 against the plate's top at about 106): its chain could
 * pass under the glass. The inset stands on the dock's measured foot.
 *
 * The inset is the only figure drawn under its own fit's scale; its circles
 * and arms are recorded where the stage canvas draws them, in the canvas's
 * CSS px, while the scrub steps through a whole cycle with the pointer away.
 */
function recordInsetInk(): void {
    const rec = { bottom: -Infinity, n: 0 };
    (window as unknown as { __inset: typeof rec }).__inset = rec;
    const proto = CanvasRenderingContext2D.prototype;
    const note = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
        if (!ctx.canvas.classList.contains("canvas-el")) return;
        const dpr = devicePixelRatio || 1;
        const m = ctx.getTransform();
        const k = Math.hypot(m.c, m.d);
        if (Math.abs(k / dpr - 1) < 0.02) return;
        const p = m.transformPoint(new DOMPoint(x, y));
        if (p.x / dpr > ctx.canvas.clientWidth / 2) return;
        rec.bottom = Math.max(rec.bottom, (p.y + r * k) / dpr);
        rec.n++;
    };
    const arc = proto.arc;
    proto.arc = function (this: CanvasRenderingContext2D, x: number, y: number, r: number, ...rest: [number, number, boolean?]) {
        note(this, x, y, r);
        return arc.call(this, x, y, r, ...rest);
    };
    const moveTo = proto.moveTo;
    proto.moveTo = function (this: CanvasRenderingContext2D, x: number, y: number) {
        note(this, x, y, 0);
        return moveTo.call(this, x, y);
    };
    const lineTo = proto.lineTo;
    proto.lineTo = function (this: CanvasRenderingContext2D, x: number, y: number) {
        note(this, x, y, 0);
        return lineTo.call(this, x, y);
    };
}

for (const vp of [
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
]) {
    test.describe(`the epicycle inset stands on the plate (${vp.width})`, () => {
        test.use({ viewport: vp, colorScheme: "dark" });
        test.setTimeout(120_000);

        test("across a cycle the inset's circles and arms stay 8 px or more above the plate's top", async ({ page }) => {
            await page.addInitScript(recordInsetInk);
            await page.goto(`/v/${seededViz().slug}`);
            await expect(page.locator(".animation-dock")).toBeVisible({ timeout: LOAD });
            await expect(page.getByRole("button", { name: /^(Play|Pause) animation$/ }).first()).toBeEnabled({ timeout: LOAD });
            const pause = page.getByRole("button", { name: "Pause animation" });
            if (await pause.isVisible()) await pause.click();
            // The pointer off the stage: the inset at its resting size.
            await page.mouse.move(vp.width - 4, 4);
            await page.waitForTimeout(400);
            const slider = page.locator(".animation-dock [role=slider]").first();
            await slider.focus();
            await page.keyboard.press("Home");
            await page.waitForTimeout(200);
            await page.evaluate(() => {
                const r = (window as unknown as { __inset: { bottom: number; n: number } }).__inset;
                r.bottom = -Infinity;
                r.n = 0;
            });
            // t from 0 to 1 in steps of 0.01, each step drawn.
            for (let step = 0; step < 100; step++) {
                await page.keyboard.press("ArrowRight");
                await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
            }
            expect(Number(await slider.getAttribute("aria-valuenow")), "the scrub reached the cycle's end").toBeGreaterThanOrEqual(0.99);
            const read = await page.evaluate(() => {
                const c = document.querySelector(".canvas-stage canvas.canvas-el")!.getBoundingClientRect();
                const plate = document.querySelector(".controls-overlay > *")!.getBoundingClientRect();
                const r = (window as unknown as { __inset: { bottom: number; n: number } }).__inset;
                return { inkBottom: r.bottom, drawn: r.n, plateTop: plate.top - c.top };
            });
            test.info().annotations.push({ type: "inset-vs-plate", description: JSON.stringify(read) });
            expect(read.drawn, "the inset was drawn across the cycle").toBeGreaterThan(0);
            // The fit keeps 12 px of air over the plate (BasisCanvas INSET_GAP).
            // PR 35 review: the fit sampled the cycle at 33 moments and missed
            // the chain's lowest reach, so the lowest ink came 3.2 px over the
            // plate at 1440 and 4.3 at 1280. Sampled finely, it keeps 13 px.
            expect(read.inkBottom, `the inset's lowest ink against the plate's top ${JSON.stringify(read)}`).toBeLessThanOrEqual(read.plateTop - 8);
        });
    });
}
