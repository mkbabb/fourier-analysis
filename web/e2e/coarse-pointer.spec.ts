// SERVED MODEL: claude-opus-5[1m]
import { test, expect, type Locator } from "@playwright/test";

/**
 * X·F F.W9 `.b` — `G-F9-13`'s witnesses (`FR-USB-16`, the matrix half).
 *
 * THE BORN-RED THIS ANSWERS
 * -------------------------
 * `playwright.config.ts` declared ONE project, `Desktop Chrome`. Chromium
 * emulates `pointer: fine` there, so every `@media (pointer: coarse)` rule in
 * the app AND in glass-ui was unreachable in CI **by construction**. The rows
 * that ride those rules — `FR-USB-1`/`-3`, the `[data-size]` touch floor,
 * PaperSidebar's `--ui-scale: 1.5` / `--control-floor: 2.75rem` pair, `FV-11`'s
 * 44-vs-60px discordance, `fr-ImageUpload L:L-i2`'s drag path — had no witness
 * that *could* exist. The matrix cell landed first (§4a-8 MATRIX-BEFORE-COARSE)
 * and these are the assertions it makes possible.
 *
 * WHY THE FIRST TEST ASSERTS THE EMULATION ITSELF
 * -----------------------------------------------
 * Every assertion below is conditional on the pointer actually being coarse. If
 * the device descriptor is ever changed to one without `isMobile`, the media
 * queries stop matching and these tests would go green for the wrong reason —
 * the exact green-by-unreachability this file exists to end. So the emulation
 * is asserted before anything is read from it.
 *
 * ⊘ CHROMIUM UNDER MOBILE EMULATION. No Safari row is discharged here
 * (`X-W11 G8`).
 *
 * ⊘ F.W9 OWNS GATES AND NO CURE. Where an assertion below is RED, the repair is
 * a `web/src/**` or producer act owned elsewhere (glass rows ride SS-6); this
 * file's whole claim is that the drift is now falsifiable.
 */

/** The producer's own coarse contract, read from its shipped stylesheet. */
const COARSE_UI_SCALE = 1.5; // `:root{--ui-scale: var(--ui-coarse-scale,1.5)}`
const TOUCH_TARGET_PX = 44; // `--touch-target: 2.75rem` at the 16px root

/** The smaller of a box's two axes, or null when the element has no box. */
async function minAxis(locator: Locator): Promise<number | null> {
    const box = await locator.boundingBox();
    return box ? Math.min(box.width, box.height) : null;
}

test.describe("@coarse — the coarse-pointer cell (G-F9-13)", () => {
    test("@coarse the emulation is actually coarse (this cell's own falsifier)", async ({
        page,
    }) => {
        await page.goto("/");

        const pointer = await page.evaluate(() => ({
            coarse: matchMedia("(pointer: coarse)").matches,
            anyCoarse: matchMedia("(any-pointer: coarse)").matches,
            hoverNone: matchMedia("(hover: none)").matches,
        }));

        expect(
            pointer,
            "this project must emulate a touch device, or every assertion below " +
                "passes because no coarse rule matched",
        ).toEqual({ coarse: true, anyCoarse: true, hoverNone: true });
    });

    test("@coarse the producer's coarse token pair is in force on :root", async ({ page }) => {
        // `FR-USB-16`'s matrix half, and the `--ui-scale: 1.5` /
        // `--control-floor: 2.75rem` pair `fr-PaperSidebar` books. glass-ui
        // ships `@media (pointer: coarse){:root{--ui-scale: var(
        // --ui-coarse-scale,1.5); --control-floor: var(--touch-target,2.75rem)}}`
        // — until this project existed, that block could not apply in any run.
        await page.goto("/");

        // ⊘ A CUSTOM PROPERTY IS NOT LENGTH-RESOLVED BY `getComputedStyle`: it
        // comes back as its declared token (`"2.75rem"`), so reading one and
        // calling `parseFloat` measures the NUMBER 2.75 and not the 44px the
        // layout uses. The floor is therefore resolved the way the layout
        // resolves it — through a probe element that consumes the variable —
        // and the raw token is asserted beside it, so a change to either the
        // declaration or its resolution is visible.
        const tokens = await page.evaluate(() => {
            const root = getComputedStyle(document.documentElement);
            const probe = document.createElement("div");
            probe.style.position = "absolute";
            probe.style.visibility = "hidden";
            probe.style.width = "var(--control-floor)";
            probe.style.height = "var(--touch-target)";
            document.body.appendChild(probe);
            const resolved = getComputedStyle(probe);
            const out = {
                uiScale: root.getPropertyValue("--ui-scale").trim(),
                controlFloorToken: root.getPropertyValue("--control-floor").trim(),
                touchTargetToken: root.getPropertyValue("--touch-target").trim(),
                controlFloorPx: parseFloat(resolved.width),
                touchTargetPx: parseFloat(resolved.height),
            };
            probe.remove();
            return out;
        });

        expect(parseFloat(tokens.uiScale)).toBeCloseTo(COARSE_UI_SCALE, 3);
        expect(tokens.controlFloorToken).toBe("2.75rem");
        expect(tokens.touchTargetToken).toBe("2.75rem");
        expect(tokens.controlFloorPx).toBeCloseTo(TOUCH_TARGET_PX, 1);
        expect(tokens.touchTargetPx).toBeCloseTo(TOUCH_TARGET_PX, 1);
    });

    test("@coarse every shell-header control meets the 44px touch floor", async ({ page }) => {
        // `FV-11`'s 44-vs-60px discordance and glass's `[data-size="icon"]`
        // coarse floor, taken where they are always present: the app shell's
        // own header, which mounts on every route.
        //
        // The header is the right surface precisely because it is the one
        // `FR-AH-45` books as contract-less — zero props, zero emits, and until
        // `G-F9-12` no e2e touched its controls at all.
        await page.goto("/");

        const header = page.locator("header.app-header");
        await expect(header).toBeVisible({ timeout: 30_000 });

        const controls = header.locator("button, a[href], [role='button']");
        const count = await controls.count();
        // A header that renders no controls would make this vacuous.
        expect(count, "the shell header renders no controls at all").toBeGreaterThan(0);

        const undersized: string[] = [];
        for (let i = 0; i < count; i++) {
            const control = controls.nth(i);
            if (!(await control.isVisible())) continue;
            const axis = await minAxis(control);
            if (axis === null) continue;
            if (axis + 0.5 < TOUCH_TARGET_PX) {
                const name =
                    (await control.getAttribute("aria-label")) ??
                    (await control.getAttribute("class")) ??
                    (await control.innerText().catch(() => "")) ??
                    "(unnamed)";
                undersized.push(`${name.slice(0, 60)} → ${axis.toFixed(1)}px`);
            }
        }

        expect(
            undersized,
            `shell-header controls below the ${TOUCH_TARGET_PX}px coarse touch floor ` +
                `(FV-11 / glass [data-size] floor). The cure is a web/src or producer ` +
                `act — F.W9 books only the instrument:\n` +
                undersized.map((u) => `  • ${u}`).join("\n"),
        ).toEqual([]);
    });

    test("@coarse the image-upload affordance is reachable on touch", async ({ page }) => {
        // `fr-ImageUpload L:L-i2` — the drag path. A pointer-drag cannot be
        // performed on a touch device at all, so on this cell the upload MUST
        // be reachable by its tap affordance; `setInputFiles` is the only path
        // the suite has ever exercised, which is the record's own finding.
        // This asserts the affordance a touch user actually gets.
        await page.goto("/visualize");

        const fileInput = page.getByTestId("image-file-input");
        await expect(fileInput).toBeAttached({ timeout: 30_000 });

        // The visible tap target that drives the hidden input. A dropzone whose
        // only affordance is a drag is unusable here, and that is the finding.
        const tapTarget = page
            .locator("label, button")
            .filter({ hasText: /upload|choose|browse|image|drop/i })
            .first();
        await expect(
            tapTarget,
            "no tappable upload affordance is exposed — on a touch device the " +
                "drag path does not exist, so this is the only path there is",
        ).toBeVisible({ timeout: 30_000 });

        const axis = await minAxis(tapTarget);
        expect(axis).not.toBeNull();
        expect(
            axis!,
            `the upload tap target measures ${axis?.toFixed(1)}px on its short axis, ` +
                `below the ${TOUCH_TARGET_PX}px coarse floor`,
        ).toBeGreaterThanOrEqual(TOUCH_TARGET_PX - 0.5);
    });
});
