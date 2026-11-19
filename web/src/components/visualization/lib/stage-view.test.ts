/**
 * LAST-TEN F-01: the stage's view geometry (pinch, wheel, pan, limits).
 */
import { describe, expect, it } from "vitest";

import {
    IDENTITY_VIEW,
    ZOOM_MAX,
    applyView,
    approach,
    clampView,
    composeView,
    isAtRest,
    linkOfView,
    overshoot,
    viewOfLink,
    resistance,
    zoomAbout,
} from "./stage-view";

const W = 800, H = 600;

describe("zoomAbout", () => {
    it("keeps the focal point under the fingers", () => {
        const v = zoomAbout(IDENTITY_VIEW, 2, 300, 200);
        expect(applyView(v, 300, 200)).toEqual([300, 200]);
        expect(v.k).toBe(2);
    });
});

describe("clampView", () => {
    it("the fit is the only resting view at k = 1", () => {
        expect(clampView({ k: 1, x: 40, y: -30 }, W, H)).toEqual({ k: 1, x: 0, y: 0 });
    });
    it("a zoomed drawing keeps covering the stage", () => {
        const c = clampView({ k: 2, x: 100, y: -2000 }, W, H);
        expect(c).toEqual({ k: 2, x: 0, y: H * (1 - 2) });
    });
    it("zoom is held in [1, ZOOM_MAX]", () => {
        expect(clampView({ k: 0.5, x: 0, y: 0 }, W, H).k).toBe(1);
        expect(clampView({ k: 40, x: 0, y: 0 }, W, H).k).toBe(ZOOM_MAX);
    });
});

describe("rubber band", () => {
    it("resists more the further past the limit", () => {
        expect(resistance(0, 100)).toBe(1);
        expect(resistance(50, 100)).toBeLessThan(1);
        expect(resistance(200, 100)).toBeLessThan(resistance(50, 100));
    });
    it("measures the overshoot per channel", () => {
        const o = overshoot({ k: 1, x: 30, y: 0 }, W, H);
        expect(o.x).toBe(30);
        expect(o.y).toBe(0);
        expect(isAtRest({ k: 1, x: 30, y: 0 }, W, H)).toBe(false);
        expect(isAtRest(IDENTITY_VIEW, W, H)).toBe(true);
    });
    it("settles toward the target frame-rate independently", () => {
        const a = approach({ k: 1, x: 100, y: 0 }, IDENTITY_VIEW, 16, 70);
        const b = approach(approach({ k: 1, x: 100, y: 0 }, IDENTITY_VIEW, 8, 70), IDENTITY_VIEW, 8, 70);
        expect(a.x).toBeCloseTo(b.x, 6);
        expect(a.x).toBeLessThan(100);
    });
});

describe("composeView", () => {
    const base = { cx: 0, cy: 0, scale: 10, toScreen: (x: number, y: number): [number, number] => [W / 2 + x * 10, H / 2 - y * 10] };
    it("returns the fitted transform at the identity", () => {
        expect(composeView(base, IDENTITY_VIEW, W, H)).toBe(base);
    });
    it("maps the stage centre back to the data point under it", () => {
        const v = zoomAbout(IDENTITY_VIEW, 2, 600, 300);
        const c = composeView(base, v, W, H);
        const [sx, sy] = c.toScreen(c.cx, c.cy);
        expect(sx).toBeCloseTo(W / 2, 6);
        expect(sy).toBeCloseTo(H / 2, 6);
        expect(c.scale).toBe(20);
    });
});

describe("the view in a link", () => {
    it("the fit is no link", () => {
        expect(linkOfView(IDENTITY_VIEW, W, H, 2, 300)).toBeNull();
    });

    it("a zoomed view round-trips through its link", () => {
        const v = clampView(zoomAbout(IDENTITY_VIEW, 3, 500, 200), W, H);
        const link = linkOfView(v, W, H, 2, 300)!;
        expect(link.z).toBeCloseTo(3, 9);
        const back = viewOfLink(link, W, H, 2, 300);
        expect(back.k).toBeCloseTo(v.k, 9);
        expect(back.x).toBeCloseTo(v.x, 6);
        expect(back.y).toBeCloseTo(v.y, 6);
    });

    it("names the same point of the drawing on a stage of another size", () => {
        // The point at the stage's centre, in the drawing's units, is the same on both stages.
        const link = { z: 2, c: [0.1, -0.05] as [number, number] };
        for (const [w, h, scale] of [[800, 600, 2], [390, 700, 1.2]] as const) {
            const v = viewOfLink(link, w, h, scale, 300);
            const px = (w / 2 - v.x) / v.k;
            const py = (h / 2 - v.y) / v.k;
            expect((px - w / 2) / scale / 300).toBeCloseTo(0.1, 9);
            expect(-(py - h / 2) / scale / 300).toBeCloseTo(-0.05, 9);
        }
    });
});
