import { describe, expect, it } from "vitest";
import {
    createTransitionState,
    snapshotForTransition,
    type TrigHarmonic,
} from "@/components/equation/composables/useCurveTransition";

/**
 * X·F F.W4 `.g` — `G-F4-VITEST`, assertion subject 1 of the four `D6` names.
 *
 * `snapshotForTransition` is the one of the four that is importable pure TS
 * today (`useCurveTransition.ts:57`, measured by `.i` at the bytes). It is
 * asserted here on the three things it actually promises and that nothing else
 * in this repo can catch — the `PP-LEN` shape, *valid-and-wrong output*:
 *
 *   1. the snapshot is a COPY, not an alias — a caller that mutates its own
 *      arrays after snapshotting must not perturb the frame being lerped FROM
 *      (`FR-CP-LM1`'s neighbourhood: the `old[1]` aliasing class);
 *   2. the Y-bounds are the padded envelope of BOTH the original samples and
 *      the reconstructed partial sum, not of the originals alone — the bound
 *      that makes the 500 ms lerp non-clipping;
 *   3. the `|| 1` degenerate-range guard produces a UNIT pad, not a zero one,
 *      when every sample is equal (a zero pad collapses the plot's y-range to a
 *      single line and the transition renders flat — valid, and wrong).
 *
 * ⊘ These are assertions, not coverage. F.W9's `G-F9-1` owns the floor's
 * population and its thresholds; this file discharges `G-F4-VITEST` only.
 */
describe("snapshotForTransition", () => {
    const domain: [number, number] = [0, 2 * Math.PI];

    it("deep-copies origY and harmonics so later caller mutation cannot reach the snapshot", () => {
        const state = createTransitionState();
        const origY = [1, 2, 3];
        const origX = [0, 1, 2];
        const harmonics: TrigHarmonic[] = [
            { k: 1, a_n: 0.5, b_n: -0.25, amplitude: 0.559 },
        ];

        snapshotForTransition(state, origY, harmonics, 0.75, origX, domain);

        expect(state.prevOrigY).toEqual([1, 2, 3]);
        expect(state.prevOrigY).not.toBe(origY);
        expect(state.prevHarmonics[0]).not.toBe(harmonics[0]);
        expect(state.prevDcRe).toBe(0.75);

        origY[0] = 999;
        harmonics[0]!.a_n = 999;

        expect(state.prevOrigY[0]).toBe(1);
        expect(state.prevHarmonics[0]!.a_n).toBe(0.5);
    });

    it("pads the envelope of BOTH the samples and the reconstruction, not the samples alone", () => {
        const state = createTransitionState();
        // A pure DC signal whose samples sit at 0 while the reconstruction sits
        // at 10: bounds taken from `origY` alone would read [0, 0] and clip the
        // whole transition off-plot.
        const origY = [0, 0, 0, 0];
        const origX = [0, 1, 2, 3];

        snapshotForTransition(state, origY, [], 10, origX, domain);

        const pad = (10 - 0) * 0.08;
        expect(state.prevMinY).toBeCloseTo(0 - pad, 12);
        expect(state.prevMaxY).toBeCloseTo(10 + pad, 12);
        expect(state.prevMaxY - state.prevMinY).toBeGreaterThan(10);
    });

    it("falls back to a UNIT pad (never zero) when the range is degenerate", () => {
        const state = createTransitionState();
        const origY = [4, 4, 4];
        const origX = [0, 1, 2];

        snapshotForTransition(state, origY, [], 4, origX, domain);

        expect(state.prevMinY).toBe(3);
        expect(state.prevMaxY).toBe(5);
        expect(state.prevMaxY - state.prevMinY).toBe(2);
    });

    it("reconstructs a first harmonic at the sampled x, not at the sample index", () => {
        const state = createTransitionState();
        // ω = 2π/(2π) = 1, so a_n·cos(kωx) is sampled at x — feeding indices
        // instead of `origX` would move both bounds.
        const origX = [0, Math.PI / 2, Math.PI];
        const origY = [0, 0, 0];
        const harmonics: TrigHarmonic[] = [
            { k: 1, a_n: 1, b_n: 0, amplitude: 1 },
        ];

        snapshotForTransition(state, origY, harmonics, 0, origX, domain);

        // fullSum = cos(0), cos(π/2), cos(π) = 1, 0, −1 ⇒ raw range [−1, 1].
        const pad = 2 * 0.08;
        expect(state.prevMinY).toBeCloseTo(-1 - pad, 12);
        expect(state.prevMaxY).toBeCloseTo(1 + pad, 12);
    });
});

/**
 * X·F F.W4 `.b` — `fr-ConvergencePlot L-M1`'s rider, landing in the SAME edit as
 * the `old[1]` fix, per the record: *"a 6-line unit test on
 * `snapshotForTransition` rides the same edit"*.
 *
 * RD-8's adopted cell names WHY the identity-lerp survived: *"there is no seam at
 * which the identity-lerp could have been observed"*. This is that seam. The
 * caller used to hand this function the NEW harmonics and call them previous, so
 * every lerp was an identity; what catches that is an assertion that the output
 * DEPENDS on the harmonics argument at all.
 */
describe("snapshotForTransition — the L-M1 seam", () => {
    it("derives the snapshot bounds from the harmonics it is GIVEN", () => {
        const domain: [number, number] = [0, 2 * Math.PI];
        const origX = [0, Math.PI / 2, Math.PI];
        const origY = [0, 0, 0];
        const from = createTransitionState();
        const to = createTransitionState();

        snapshotForTransition(from, origY, [{ k: 1, a_n: 1, b_n: 0, amplitude: 1 }], 0, origX, domain);
        snapshotForTransition(to, origY, [{ k: 1, a_n: 5, b_n: 0, amplitude: 5 }], 0, origX, domain);

        // Identical bounds here would mean the argument was ignored — which is
        // exactly what the caller's bug made true for every real transition.
        expect(from.prevMaxY).not.toBeCloseTo(to.prevMaxY, 6);
        expect(from.prevHarmonics[0]!.a_n).toBe(1);
    });
});
