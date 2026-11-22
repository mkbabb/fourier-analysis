import { expect, test, type Page } from "@playwright/test";
import { openCanvasDock } from "./fixtures/canvas-dock";
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
 * glyph, and it stays on the plate. FORTY-FIRST H: the canvas dock is gone; the
 * stage has one dock, whose folded face is the readout alone, with no dot and
 * no glyph on it.
 *
 * d3 — a phone's stage dock is one plate that never folds (FORTY-FIRST H), so
 * it has no collapsed face to crowd: it keeps its open face at rest, inside
 * the viewport. Since the desk's scrub took back its run on a row of its own,
 * the desk's stage dock is the same plate, so d1's and d2's folded face is
 * gone at every width, and d3 holds at the desk too.
 */
const PHASE = process.env.FW14U_PHASE ?? "after";
const FRAMES = "e2e/screenshots/f-w14u/d";

async function loadAtRest(page: Page, mobile: boolean, setup?: (page: Page) => Promise<void>): Promise<void> {
    await page.goto("/visualize");
    await expect(page.locator(".drop-target")).toBeVisible({ timeout: 60_000 });
    await page.getByTestId("image-file-input").setInputFiles(SAMPLE_IMAGE);
    await page.waitForURL(/\/w\//, { timeout: 30_000 });
    // X.F.W14V.u4 — UIA-F-74: below lg the finished upload already shows the
    // canvas (the controls are the other pane), so the mobile cell asserts that
    // front instead of choosing it. FORTY-SECOND D: the switch is the top dock's
    // Controls seat, unlit while the canvas shows.
    if (mobile) {
        await expect(page.locator(".app-dock .pane-seat")).toHaveAttribute("aria-pressed", "false", { timeout: 60_000 });
        await expect(page.locator(".animation-dock")).toBeVisible({ timeout: 60_000 });
    } else {
        await expect(page.getByRole("button", { name: /Replace image/ })).toBeVisible({ timeout: 60_000 });
    }
    if (setup) await setup(page);
    await page.mouse.move(5, 5);
    // The stage's plate never folds (d3), at any width.
    await expect(page.locator(".animation-dock")).toBeVisible({ timeout: 60_000 });
    // Every time-based animation on both docks has ended.
    await page.waitForFunction(() =>
        [".animation-dock", ".controls-overlay .glass-dock"].every((s) =>
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

/** Leave the stage with the outline off (FORTY-FIRST K: it is off by default)
 *  and the stage dock at rest. */
async function traceOff(page: Page): Promise<void> {
    await openCanvasDock(page);
    const outline = page.locator(".controls-overlay [aria-label='Outline']");
    if ((await outline.getAttribute("aria-pressed")) === "true") await outline.click();
    await page.mouse.click(5, 5);
    // Wait until the dock's box holds still.
    const dock = page.locator(".controls-overlay .glass-dock");
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

        test("d3 — the stage's plate never folds: no summary face, open at rest, in view", async ({ page }) => {
            await loadAtRest(page, mobile, traceOff);
            await page.waitForTimeout(1200);
            const dock = page.locator(".controls-overlay .glass-dock");
            await expect(dock).toHaveCount(1);
            await expect(dock).toHaveClass(/animation-dock--card/);
            await expect(dock).not.toHaveClass(/\bcollapsed\b/);
            await expect(dock.locator(".dock-layer--summary.is-active")).toHaveCount(0);
            await expect(dock.locator(".dock-layer--summary > *")).toHaveCount(0);
            await expect(dock.locator(".view-dot, .status-dot")).toHaveCount(0);
            const box = (await dock.boundingBox())!;
            await page.screenshot({
                path: `${FRAMES}/${PHASE}-${c.width}-${c.scheme}-stage-dock.png`,
                clip: { x: Math.max(0, box.x - 12), y: box.y - 12, width: Math.min(c.width, box.width + 24), height: box.height + 24 },
            });
            expect(box.x).toBeGreaterThanOrEqual(0);
            expect(box.x + box.width).toBeLessThanOrEqual(c.width);
            expect(box.y + box.height).toBeLessThanOrEqual(c.height);
        });
    });
}
