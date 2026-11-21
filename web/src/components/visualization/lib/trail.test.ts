/**
 * The drawn line is the curve up to t, in both directions of the ping-pong.
 */
import { describe, expect, it } from "vitest";
import { evaluateAt, fromComponents } from "@mkbabb/fourier";

import { TRAIL_RESOLUTION, TrailManager } from "./canvas-drawing/trail";

const spectrum = fromComponents([
    { index: 1, coefficient: [1, 0], amplitude: 1, phase: 0 },
    { index: -2, coefficient: [0.3, 0.1], amplitude: Math.hypot(0.3, 0.1), phase: 0 },
    { index: 3, coefficient: [0.1, -0.05], amplitude: Math.hypot(0.1, 0.05), phase: 0 },
]);

/** Played ticks from `from` to `to` in steps of `step`, ending exactly at `to`. */
function play(trail: TrailManager, from: number, to: number, step: number): void {
    const dir = Math.sign(to - from);
    for (let t = from; dir * (to - t) > 1e-12; t += dir * step) {
        const [x, y] = evaluateAt(spectrum, t);
        trail.update(t, x, y, false, spectrum);
    }
    const [x, y] = evaluateAt(spectrum, to);
    trail.update(to, x, y, false, spectrum);
}

describe("TrailManager with the precomputed path", () => {
    it("writes the line forward", () => {
        const trail = new TrailManager();
        trail.precompute(spectrum);
        play(trail, 0, 0.3, 0.003);
        expect(trail.end).toBe(Math.floor(0.3 * TRAIL_RESOLUTION));
    });

    it("un-writes the line on the reverse leg", () => {
        const trail = new TrailManager();
        trail.precompute(spectrum);
        play(trail, 0, 1, 0.003);
        expect(trail.end).toBe(TRAIL_RESOLUTION);
        play(trail, 1, 0.5, 0.003);
        expect(trail.end).toBe(Math.floor(0.5 * TRAIL_RESOLUTION));
    });

    it("follows t through a long frame and on, never sticking at a stale prefix", () => {
        const trail = new TrailManager();
        trail.precompute(spectrum);
        play(trail, 0, 1, 0.003);
        play(trail, 0.6, 0.4, 0.003);
        expect(trail.end).toBe(Math.floor(0.4 * TRAIL_RESOLUTION));
        play(trail, 0.4, 0.45, 0.003);
        expect(trail.end).toBe(Math.floor(0.45 * TRAIL_RESOLUTION));
    });
});

describe("TrailManager without the precomputed path", () => {
    it("un-writes the line on the reverse leg", () => {
        const trail = new TrailManager();
        play(trail, 0, 1, 0.003);
        play(trail, 1, 0.5, 0.003);
        // The line is the curve sampled on [0, 0.5] and nothing past it.
        const [ex, ey] = evaluateAt(spectrum, 0.5);
        expect(trail.x.at(-1)).toBeCloseTo(ex, 9);
        expect(trail.y.at(-1)).toBeCloseTo(ey, 9);
        expect(trail.x.length).toBe(Math.ceil(0.5 * 600) + 1);
    });
});
