import { expect, test, type Page } from "@playwright/test";
import { seededViz } from "./fixtures/seed";

/**
 * The desk's scrub, given back its run (PR 33 review: 790 px before the stage
 * had one dock, 350 px after, the seats taking the row). The stage keeps one
 * dock, and at a desk it is the phone's plate made long: the scrub alone on
 * its row, as long as the stage allows up to 52rem, and the seats under it in
 * four groups (Play | the four layers | the rate, the easing, More | Edit).
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
            await page.mouse.move(track.x + track.width * 0.1, y, { steps: 8 });
            await page.mouse.up();
            const after = Number(await slider.getAttribute("aria-valuenow"));
            expect(Math.abs(after - before), "the drag moved the position").toBeGreaterThan(0.3);
        });
    });
}
