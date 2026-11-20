/**
 * LAST-TEN F-03: a contour point dragged past the stage edge was dropped
 * outside the image ((675, 441) -> (-673, -362) on an 0-800 image). The drag
 * now holds the point inside the stage's rectangle; it slides along the edge
 * and follows the pointer again, at the press's offset, once it comes back.
 */
import { describe, expect, it } from "vitest";
import { ref } from "vue";

import type { Point2D } from "@/lib/contourEditing";
import { clampToBounds, usePointDrag } from "./usePointDrag";

const BOUNDS = { minX: 0, maxX: 800, minY: 0, maxY: 800 };

/** A pointer event stand-in: the drag reads only the data point `svgPoint` returns. */
function ev(x: number, y: number): PointerEvent {
    return {
        x,
        y,
        pointerId: 1,
        preventDefault() {},
        stopPropagation() {},
        currentTarget: { setPointerCapture() {} },
    } as unknown as PointerEvent;
}
const svgPoint = (e: PointerEvent): Point2D => ({ x: (e as unknown as Point2D).x, y: (e as unknown as Point2D).y });

function setup(reach = 0, snap = 0) {
    const points = ref<Point2D[]>([
        { x: 100, y: 100 },
        { x: 675, y: 441 },
        { x: 700, y: 500 },
        { x: 300, y: 300 },
    ]);
    let ended = 0;
    const drag = usePointDrag(points, () => reach, svgPoint, () => ended++, () => BOUNDS, () => snap);
    return { points, drag, ended: () => ended };
}

describe("clampToBounds", () => {
    it("holds each axis inside the rectangle on its own", () => {
        expect(clampToBounds({ x: -673, y: -362 }, BOUNDS)).toEqual({ x: 0, y: 0 });
        expect(clampToBounds({ x: 900, y: 400 }, BOUNDS)).toEqual({ x: 800, y: 400 });
        expect(clampToBounds({ x: 10, y: 20 }, null)).toEqual({ x: 10, y: 20 });
    });
});

describe("usePointDrag", () => {
    it("stops a point at the stage edge instead of dropping it outside", () => {
        const { points, drag, ended } = setup();
        drag.onPointPointerDown(1, ev(675, 441));
        drag.onPointerMove(ev(-825, 1341));
        drag.onPointerUp();
        expect(points.value[1]).toEqual({ x: 0, y: 800 });
        expect(ended()).toBe(1);
    });

    it("keeps the press offset and re-syncs with the pointer after the edge", () => {
        const { points, drag } = setup();
        // Pressed 5 units left of the point.
        drag.onPointPointerDown(1, ev(670, 441));
        drag.onPointerMove(ev(2000, 441));
        expect(points.value[1].x).toBe(800);
        drag.onPointerMove(ev(500, 441));
        expect(points.value[1]).toEqual({ x: 505, y: 441 });
    });

    it("clamps the magnet's neighbours too", () => {
        const { points, drag } = setup(2000);
        drag.onPointPointerDown(1, ev(675, 441));
        drag.onPointerMove(ev(5000, 441));
        for (const p of points.value) {
            expect(p.x).toBeLessThanOrEqual(800);
            expect(p.x).toBeGreaterThanOrEqual(0);
        }
    });

    it("a press that never moves is not an edit", () => {
        const { drag, ended } = setup();
        drag.onPointPointerDown(1, ev(675, 441));
        drag.onPointerUp();
        expect(ended()).toBe(0);
    });

    it("carries its neighbours by distance along the curve, most at the point, none at the reach", () => {
        // A straight run of samples 10 apart; the reach is 35 along it.
        const points = ref<Point2D[]>(Array.from({ length: 12 }, (_, i) => ({ x: 100 + i * 10, y: 400 })));
        const drag = usePointDrag(points, () => 35, svgPoint, () => {}, () => BOUNDS);
        drag.onPointPointerDown(5, ev(150, 400));
        drag.onPointerMove(ev(150, 300));
        const lift = points.value.map((p) => 400 - p.y);
        expect(lift[5]).toBe(100);
        // Raised cosine: 0.5 * (1 + cos(pi * d / 35)) at d = 10, 20, 30.
        expect(lift[4]).toBeCloseTo(50 * (1 + Math.cos((Math.PI * 10) / 35)), 6);
        expect(lift[6]).toBeCloseTo(lift[4], 6);
        expect(lift[3]).toBeCloseTo(50 * (1 + Math.cos((Math.PI * 20) / 35)), 6);
        expect(lift[2]).toBeCloseTo(50 * (1 + Math.cos((Math.PI * 30) / 35)), 6);
        expect(lift[1]).toBe(0);
        expect(lift[9]).toBe(0);
        // The bend is monotone from the point outward: no tooth.
        expect(lift[4]).toBeGreaterThan(lift[3]);
        expect(lift[3]).toBeGreaterThan(lift[2]);
    });

    it("is the pointer's travel from the press, not a sum of steps", () => {
        const { points, drag } = setup(2000);
        const before = points.value.map((p) => ({ ...p }));
        drag.onPointPointerDown(1, ev(675, 441));
        for (const x of [600, 520, 610, 675]) drag.onPointerMove(ev(x, 441));
        // Back where it started: every carried neighbour is back too.
        expect(points.value).toEqual(before);
    });

    it("snaps back to where it was grabbed, and that is not an edit", () => {
        const { points, drag, ended } = setup(0, 6);
        drag.onPointPointerDown(1, ev(675, 441));
        // The first pixels are never swallowed by the snap.
        drag.onPointerMove(ev(672, 441));
        expect(points.value[1]).toEqual({ x: 672, y: 441 });
        drag.onPointerMove(ev(600, 441));
        expect(drag.atHome.value).toBe(false);
        drag.onPointerMove(ev(671, 444));
        expect(drag.atHome.value).toBe(true);
        expect(points.value[1]).toEqual({ x: 675, y: 441 });
        drag.onPointerUp();
        expect(ended()).toBe(0);
    });

    it("hands the curve back untouched to a second finger", () => {
        const { points, drag, ended } = setup(2000);
        const before = points.value;
        drag.onPointPointerDown(1, ev(675, 441));
        drag.onPointerMove(ev(660, 441));
        drag.handBack(false);
        expect(points.value).toBe(before);
        expect(ended()).toBe(0);
        expect(drag.dragging.value).toBe(false);
    });
});
