import { expect, test, type Page } from "@playwright/test";
import { SAMPLE_IMAGE } from "./fixtures/sample";

/**
 * X.F.W14U.d — OA-57 (the collapsed dock, fourier's consumer half) and OA-68
 * (SIDE-DOCK-EDGE, the consumer's own crowding), spec `F-W14U.md` §0cq `.d`,
 * §0cs, §0ct. Owner frames: value.js `docs/tranches/X/audit/owner-2026-09-24-
 * collapsed-dock.png` (this app's animation dock, collapsed) and
 * `owner-2026-09-24-side-dock-edge.png` (this app's canvas dock, collapsed).
 *
 * Only the consumer causes are asserted here. The producer halves stay honest-RED
 * at glass: DOCK-COLLAPSED-FORM (O-65: the collapsed summary is a fixed circle,
 * so the plate does not wrap a wider summary) and SIDE-DOCK-EDGE (O-67: the rim
 * and a reserved badge seat).
 *
 * d1 — the speed reading in the collapsed animation dock is glass's Metric as
 * glass paints it: the value is never dimmer than its own unit (a consumer class
 * inked the value at 35% while the unit kept its muted ink, so the "×" read as a
 * loose glyph beside the plate), and the Metric keeps the font size of the dock
 * it sits in (a consumer `text-base` re-based it, and with it the reading's em gap).
 *
 * d2 — the canvas dock's amber view dot never covers the collapsed face's
 * glyph, and it stays on the plate.
 */
const PHASE = process.env.FW14U_PHASE ?? "after";
const FRAMES = "e2e/screenshots/f-w14u/d";

async function loadCollapsed(page: Page, mobile: boolean, setup?: (page: Page) => Promise<void>): Promise<void> {
    await page.goto("/visualize");
    await expect(page.locator(".drop-target")).toBeVisible({ timeout: 60_000 });
    await page.getByTestId("image-file-input").setInputFiles(SAMPLE_IMAGE);
    await page.waitForURL(/\/w\//, { timeout: 30_000 });
    // X.F.W14V.u4 — UIA-F-74: below lg the finished upload already shows the
    // canvas (the sheet, with Replace image, is the other tab), so the mobile
    // cell asserts that front instead of selecting it.
    if (mobile) {
        await expect(page.getByRole("tab", { name: "Canvas" })).toHaveAttribute("aria-selected", "true", { timeout: 60_000 });
        await expect(page.locator(".animation-dock")).toBeVisible({ timeout: 60_000 });
    } else {
        await expect(page.getByRole("button", { name: /Replace image/ })).toBeVisible({ timeout: 60_000 });
    }
    if (setup) await setup(page);
    await page.mouse.move(5, 5);
    await expect(page.locator(".animation-dock")).toHaveClass(/\bcollapsed\b/, { timeout: 30_000 });
    await expect(page.locator(".controls-dock-anchor .glass-dock")).toHaveClass(/\bcollapsed\b/, {
        timeout: 30_000,
    });
    // Every time-based animation on both docks has ended.
    await page.waitForFunction(() =>
        [".animation-dock", ".controls-dock-anchor .glass-dock"].every((s) =>
            [...document.querySelectorAll(s)].every((d) =>
                d
                    .getAnimations({ subtree: true })
                    .every(
                        (a) =>
                            a.playState !== "running" ||
                            !(a.timeline instanceof DocumentTimeline) ||
                            a.effect?.getTiming().iterations === Infinity,
                    ),
            ),
        ),
    );
}

/** Switch the contour trace off through the canvas dock's View options menu. */
async function traceOff(page: Page): Promise<void> {
    await page.getByRole("button", { name: "Edit contour" }).first().hover();
    await page.locator(".controls-dock-anchor [aria-label='View options']").click();
    await page.getByRole("menuitemcheckbox", { name: "Contour trace" }).click();
    await page.mouse.click(5, 5);
    // The dock's collapse after an expansion settles in stages (its anchor
    // re-seats after the layer swap); wait until its box holds still.
    const dock = page.locator(".controls-dock-anchor .glass-dock");
    await expect(dock).toHaveClass(/\bcollapsed\b/, { timeout: 30_000 });
    let last = "";
    await expect
        .poll(async () => {
            const b = JSON.stringify(await dock.boundingBox());
            const still = b === last;
            last = b;
            return still;
        }, { intervals: [500], timeout: 15_000 })
        .toBe(true);
}

const CASES = [
    { width: 1440, height: 900, scheme: "light" as const },
    { width: 1440, height: 900, scheme: "dark" as const },
    { width: 390, height: 844, scheme: "dark" as const },
];

for (const c of CASES) {
    const mobile = c.width < 500;
    test.describe(`F.W14U.d — collapsed docks, consumer half (${c.width} ${c.scheme})`, () => {
        test.use({
            viewport: { width: c.width, height: c.height },
            colorScheme: c.scheme,
            ...(mobile ? { isMobile: true, hasTouch: true } : {}),
        });
        test.setTimeout(120_000);

        test("d1 — the collapsed speed reading is glass's Metric: value never dimmer than its unit, the dock's own size", async ({
            page,
        }) => {
            await loadCollapsed(page, mobile);
            const dock = page.locator(".animation-dock");
            const box = (await dock.boundingBox())!;
            await page.screenshot({
                path: `${FRAMES}/${PHASE}-${c.width}-${c.scheme}-animation-dock.png`,
                clip: { x: Math.max(0, box.x - 40), y: box.y - 20, width: box.width + 120, height: box.height + 40 },
            });
            const m = await page.evaluate(() => {
                const alpha = (color: string): number => {
                    const cv = document.createElement("canvas");
                    cv.width = cv.height = 1;
                    const ctx = cv.getContext("2d")!;
                    ctx.fillStyle = color;
                    ctx.fillRect(0, 0, 1, 1);
                    return ctx.getImageData(0, 0, 1, 1).data[3] / 255;
                };
                const summary = document.querySelector(".animation-dock .dock-layer--summary")!;
                const metric = summary.querySelector(".metric")!;
                const value = metric.querySelector(".metric__value")!;
                const unit = metric.querySelector(".metric__unit")!;
                return {
                    valueAlpha: alpha(getComputedStyle(value).color),
                    unitAlpha: alpha(getComputedStyle(unit).color),
                    metricPx: parseFloat(getComputedStyle(metric).fontSize),
                    hostPx: parseFloat(getComputedStyle(summary).fontSize),
                };
            });
            expect(m.valueAlpha).toBeGreaterThanOrEqual(m.unitAlpha);
            expect(m.metricPx).toBe(m.hostPx);
        });

        test("d2 — the canvas dock's view dot never covers the collapsed face's glyph and stays on the plate", async ({
            page,
        }) => {
            // X.F.W14V.u1 (UIA-F-173, §0bt setup only): the dot now shows only off the
            // default view, so the trace is switched off before the collapsed dot is read.
            await loadCollapsed(page, mobile, traceOff);
            const dock = page.locator(".controls-dock-anchor .glass-dock");
            const box = (await dock.boundingBox())!;
            await page.screenshot({
                path: `${FRAMES}/${PHASE}-${c.width}-${c.scheme}-canvas-dock.png`,
                clip: { x: box.x - 20, y: Math.max(0, box.y - 20), width: box.width + 40, height: box.height + 40 },
            });
            const m = await page.evaluate(() => {
                const d = document.querySelector(".controls-dock-anchor .glass-dock")!;
                const r = (e: Element) => e.getBoundingClientRect();
                return {
                    dot: r(d.querySelector(".dock-layer--summary .view-dot")!).toJSON(),
                    glyph: r(d.querySelector(".dock-layer--summary .dock-summary-glyph")!).toJSON(),
                    plate: r(d).toJSON(),
                };
            });
            const overlapX = Math.min(m.dot.right, m.glyph.right) - Math.max(m.dot.left, m.glyph.left);
            const overlapY = Math.min(m.dot.bottom, m.glyph.bottom) - Math.max(m.dot.top, m.glyph.top);
            expect(overlapX <= 0 || overlapY <= 0, `dot ${JSON.stringify(m.dot)} glyph ${JSON.stringify(m.glyph)}`).toBe(
                true,
            );
            expect(m.dot.left).toBeGreaterThanOrEqual(m.plate.left);
            expect(m.dot.right).toBeLessThanOrEqual(m.plate.right);
            expect(m.dot.top).toBeGreaterThanOrEqual(m.plate.top);
            expect(m.dot.bottom).toBeLessThanOrEqual(m.plate.bottom);
        });
    });
}
