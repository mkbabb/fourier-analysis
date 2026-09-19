import { test, expect, type Page } from "@playwright/test";

/**
 * X·F F.W3 `.a` — `g4` (SCRUB SESSION — freeze unreachable) and `g5`'s live
 * half, over the SHIPPED composition in a real browser.
 *
 * `g4`'s born-RED witness names two gestures, narrowed by `K-4`:
 *   (a) press and release inside the ±0.5-step band at the playhead, and
 *   (b) `pointercancel`.
 * Both left the rAF cancelled with `playing === true`, the pause glyph and
 * `.is-playing` asserting motion over a clock that had stopped, and a latch
 * suppressing every subsequent `scrub-start` for the life of the page. The
 * mechanism was one conditional: the session OPENED on an unconditional
 * `pointerdown` and CLOSED only on reka's `hasChanged`-gated `valueCommit`, an
 * emit that a gesture which moves nothing does not produce and that a cancelled
 * pointer never reaches.
 *
 * This must be a browser and not a stub, because the thing under test is
 * exactly what a stub would have to assume: that reka's own pointer handling,
 * its pointer capture, and the `pointercancel` a UA emits all behave as
 * described. `e2e/unit/animation-clock.vitest.ts` holds the half a browser is
 * bad at — the frame boundary — and this holds the half only a browser has.
 *
 * ⊘ THE ROUTE'S COMPUTE IS STUBBED, and that is not a stub of the subject.
 * `/equation` is the lightest route that mounts this composition, and it mounts
 * it behind one POST to the API. The stub supplies a Fourier series so the plot
 * renders; nothing it returns touches the session, the axis or the keyboard
 * path, all of which are consumer code running for real. The alternative — the
 * `/visualize` route — needs an image upload AND a compute round trip, which
 * would make a session test depend on a backend.
 */

const HARMONICS = 12;

/** A real square-wave series: odd harmonics, amplitude 1/n. Enough to plot. */
function squareWaveResponse() {
    const coefficients = [{ n: 0, coefficient_re: 0, coefficient_im: 0, amplitude: 0, phase: 0 }];
    for (let n = 1; n <= HARMONICS; n++) {
        const amp = n % 2 === 1 ? (4 / (Math.PI * n)) : 0;
        coefficients.push({
            n,
            coefficient_re: 0,
            coefficient_im: -amp / 2,
            amplitude: amp,
            phase: -Math.PI / 2,
        });
    }

    const POINTS = 200;
    const x: number[] = [];
    const y: number[] = [];
    const yr: number[] = [];
    for (let i = 0; i < POINTS; i++) {
        const xi = (i / (POINTS - 1)) * 2 * Math.PI;
        x.push(xi);
        y.push(xi < Math.PI ? 1 : -1);
        let sum = 0;
        for (let n = 1; n <= HARMONICS; n += 2) sum += (4 / (Math.PI * n)) * Math.sin(n * xi);
        yr.push(sum);
    }

    return {
        status: "ok",
        tier: "symbolic",
        latex: "\\operatorname{sgn}(\\sin x)",
        latex_sigma: "\\sum_{n \\text{ odd}} \\frac{4}{\\pi n} \\sin(nx)",
        coefficients,
        original_points: { x, y },
        reconstructed_points: { x, y: yr },
        energy_captured: 0.97,
        effective_n: HARMONICS,
    };
}

async function openTimeline(page: Page) {
    await page.route("**/api/equations/compute", async (route) => {
        await route.fulfill({ json: squareWaveResponse() });
    });
    await page.route("**/api/equations/simplify", async (route) => {
        await route.fulfill({
            json: { latex: "\\sum", energy_captured: 0.97, term_count: HARMONICS },
        });
    });

    await page.goto("/equation");

    const row = page.locator(".timeline-row");
    await expect(row).toBeVisible({ timeout: 30_000 });

    // ⊘ ATTACHED, not visible. The scrubber thumb is `width: 0; opacity: 0` by
    // the producer's own contract — its leading edge IS the handle — so
    // `toBeVisible()` is the wrong question to ask of it, and asking it would
    // fail on a component that is working exactly as designed.
    const thumb = row.locator('[role="slider"]');
    await expect(thumb).toBeAttached();
    return {
        row,
        thumb,
        track: row.locator(".slider-track"),
        play: page.getByRole("button", { name: /the convergence sweep/i }),
    };
}

/** The value the control reports, which is the only position a reader can read. */
async function valueNow(thumb: ReturnType<Page["locator"]>): Promise<number> {
    return Number(await thumb.getAttribute("aria-valuenow"));
}

/**
 * Put the transport in a KNOWN state rather than assume one.
 *
 * The plot auto-plays on mount (`ConvergencePlot.vue`'s `onMounted`, unless the
 * reader prefers reduced motion), so a blind click on the play control toggles
 * whichever state the run happened to start in — which is how a session test
 * ends up measuring an animation instead.
 */
async function setPlaying(play: ReturnType<Page["locator"]>, on: boolean): Promise<void> {
    if (((await play.getAttribute("aria-pressed")) === "true") !== on) await play.click();
    await expect(play).toHaveAttribute("aria-pressed", String(on));
}

test.describe("X·F F.W3 — g4: the scrub session cannot freeze the transport", () => {
    test("K-4 (a) — a press and release that moves NOTHING still closes the session", async ({
        page,
    }) => {
        const { row, thumb, track, play } = await openTimeline(page);
        await setPlaying(play, false);

        // A press is null-delta only if the value it resolves to is the value
        // already held, and at ~0.0025 of the axis per pixel that cannot be
        // arranged by aiming at a moving playhead. It CAN be arranged exactly:
        // seek to the axis floor by keyboard, then press at the track's leading
        // edge, where every x clamps to that same floor.
        await thumb.focus();
        await page.keyboard.press("Home");
        await expect(thumb).toHaveAttribute("aria-valuenow", "0");

        const box = (await track.boundingBox())!;
        await page.mouse.move(box.x, box.y + box.height / 2);
        await page.mouse.down();

        await expect(row).toHaveAttribute("data-scrubbing", "true");
        expect(
            await valueNow(thumb),
            "if the press moved the value this is not the gesture K-4 names",
        ).toBe(0);

        await page.mouse.up();

        // THE ASSERTION THE GATE IS ABOUT. reka emitted no `valueCommit` for
        // this gesture — `hasChanged` is false — so the fork's close never ran
        // and the session stayed open with the clock cancelled underneath it.
        await expect(row).not.toHaveAttribute("data-scrubbing", "true");
    });

    test("K-4 (b) — a CANCELLED pointer closes the session and the clock keeps running", async ({
        page,
    }) => {
        const { row, thumb, track, play } = await openTimeline(page);

        await setPlaying(play, true);
        await page.waitForTimeout(300);
        expect(
            await valueNow(thumb),
            "the sweep has to be running for a freeze to be visible",
        ).toBeGreaterThan(0);

        const box = (await track.boundingBox())!;
        await page.mouse.move(box.x + box.width * 0.4, box.y + box.height / 2);
        await page.mouse.down();
        await expect(row).toHaveAttribute("data-scrubbing", "true");

        // A UA cancels a pointer for reasons the page does not choose — a scroll
        // gesture claiming the touch, a system dialog, the pointer leaving the
        // surface. reka emits nothing at all for it, and the fork handled it
        // nowhere, so this gesture froze the transport outright.
        await row.dispatchEvent("pointercancel", { bubbles: true });
        await expect(row).not.toHaveAttribute("data-scrubbing", "true");

        const afterCancel = await valueNow(thumb);
        await page.waitForTimeout(500);
        expect(
            await valueNow(thumb),
            "the clock must still be advancing after a cancelled pointer",
        ).toBeGreaterThan(afterCancel);

        await page.mouse.up();
    });

    test("the latch is gone — a second scrub opens after the first", async ({ page }) => {
        const { row, track, play } = await openTimeline(page);
        await setPlaying(play, false);
        const box = (await track.boundingBox())!;

        // The fork's `if (scrubbing.value) return` guard was a de-dup latch with
        // no reliable clear, so ONE unclosed session suppressed every later
        // `scrub-start` for the life of the page. Two sessions in a row is the
        // cheapest proof it cannot.
        for (const frac of [0.3, 0.6]) {
            await page.mouse.move(box.x + box.width * frac, box.y + box.height / 2);
            await page.mouse.down();
            await expect(row).toHaveAttribute("data-scrubbing", "true");
            await page.mouse.up();
            await expect(row).not.toHaveAttribute("data-scrubbing", "true");
        }
    });
});

test.describe("X·F F.W3 — g5: a keyboard seek reaches the axis", () => {
    test("an arrow press moves the value and it survives the next frames", async ({ page }) => {
        const { thumb, play } = await openTimeline(page);
        await setPlaying(play, false);

        await thumb.focus();
        const before = await valueNow(thumb);

        await page.keyboard.press("ArrowRight");
        const after = await valueNow(thumb);
        expect(after, "reka routes arrows through a commit with no pointer event").toBeGreaterThan(
            before,
        );

        // "Survives the next frame" — the whole of `L-3`. Several frames, so a
        // pass cannot be one lucky read taken before the clock could overwrite.
        await page.waitForTimeout(300);
        expect(await valueNow(thumb)).toBe(after);
    });

    test("Home and End reach both ends of the axis", async ({ page }) => {
        const { thumb, play } = await openTimeline(page);
        await setPlaying(play, false);
        await thumb.focus();

        await page.keyboard.press("End");
        await expect(thumb).toHaveAttribute("aria-valuenow", "1");

        await page.keyboard.press("Home");
        await expect(thumb).toHaveAttribute("aria-valuenow", "0");

        // And the axis is the float one the re-derivation chose, not the
        // integer `[0..100]` fork: one arrow off Home is a thousandth, which is
        // finer than the tightest harmonic gap (0.004823) `C·C-7` measured.
        await page.keyboard.press("ArrowRight");
        expect(await valueNow(thumb)).toBeCloseTo(0.001, 6);
    });

    test("the thumb announces the harmonic it moved to, not the raw float", async ({ page }) => {
        const { thumb, play } = await openTimeline(page);
        await setPlaying(play, false);
        await thumb.focus();
        await page.keyboard.press("End");

        // `AX-1`'s two-attribute law, at the control half: the announcement is
        // the quantity, authored onto the element that carries `role="slider"`.
        // It is what bounds the announcement rate to the harmonic count rather
        // than to the step count — the anti-cure `C·C-7` named.
        await expect(thumb).toHaveAttribute("aria-valuetext", /of \d+ harmonics$/);
    });
});
