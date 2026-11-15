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

function setup(magnet = 0) {
    const points = ref<Point2D[]>([
        { x: 100, y: 100 },
        { x: 675, y: 441 },
        { x: 700, y: 500 },
        { x: 300, y: 300 },
    ]);
    let ended = 0;
    const drag = usePointDrag(points, ref(magnet), svgPoint, () => ended++, () => BOUNDS);
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
        const { points, drag } = setup(1);
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
});
