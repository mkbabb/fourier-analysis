// SERVED MODEL: claude-opus-5[1m]
/**
 * X.F.W4 `.c` — `contourBounds`, the framing cluster's single cure
 * (`fr-ContourPreview` row 40), under `.g`'s ruled unit floor.
 *
 * D6 ruled a vitest runner in `web/` and `G-F4-VITEST` names `contourBounds`
 * by name as one of the four subjects the floor must execute. Every assertion
 * below is a BOOKED ROW, not a paraphrase of the implementation: rows 7
 * (per-axis pad), 17 (degenerate-extent floor), 28-client (finite screen) and
 * 33 (the byte-identical clone the extraction dissolves). The point of writing
 * them here rather than trusting the diff is that all three callsites drifted
 * silently once already; a test is the only thing that notices the fourth time.
 */
import { describe, expect, it } from "vitest";

import { contourBounds, type Point2D } from "@/lib/contourEditing";

/** Parse the four numbers out of a viewBox string. */
function viewBoxNumbers(viewBox: string): number[] {
    return viewBox.split(/\s+/).map(Number);
}

describe("contourBounds", () => {
    it("returns null below two points (nothing renderable to frame)", () => {
        expect(contourBounds(undefined, 0.1)).toBeNull();
        expect(contourBounds([], 0.1)).toBeNull();
        expect(contourBounds([{ x: 1, y: 1 }], 0.1)).toBeNull();
    });

    it("row 7 — the pad is PER AXIS, so a tall contour keeps its vertical gutter", () => {
        // h = 100·w, comfortably past the h ≳ 15.8·w clipping threshold the row
        // derives for the old X-derived pad.
        const tall: Point2D[] = [
            { x: 0, y: 0 },
            { x: 1, y: 100 },
        ];
        const b = contourBounds(tall, 0.1);
        expect(b).not.toBeNull();
        expect(b!.padX).toBeCloseTo(0.1, 12);
        expect(b!.padY).toBeCloseTo(10, 12);
        // The defect being asserted against: one shared, X-derived pad.
        expect(b!.padY).not.toBeCloseTo(b!.padX, 6);

        const [, , , h] = viewBoxNumbers(b!.viewBox);
        // Extent + both pads — the vertical gutter actually exists.
        expect(h).toBeCloseTo(120, 10);
    });

    it("row 17 — a degenerate axis is floored at 1, never emitted as extent 0", () => {
        // Zero X extent: a viewBox of width 0 DISABLES rendering of the element.
        const vertical: Point2D[] = [
            { x: 5, y: 0 },
            { x: 5, y: 4 },
        ];
        const b = contourBounds(vertical, 0.1);
        expect(b!.width).toBe(1);
        expect(b!.height).toBe(4);

        const [, , w] = viewBoxNumbers(b!.viewBox);
        expect(w).toBeGreaterThan(0);

        // And the mirror case, which only one of the three siblings guarded.
        const horizontal = contourBounds(
            [
                { x: 0, y: 7 },
                { x: 3, y: 7 },
            ],
            0.1,
        );
        expect(horizontal!.height).toBe(1);
    });

    it("row 28-client — one non-finite coordinate is screened, not rendered blank", () => {
        const poisoned: Point2D[] = [
            { x: 0, y: 0 },
            { x: Number.NaN, y: 3 },
            { x: 2, y: 4 },
        ];
        expect(contourBounds(poisoned, 0.1)).toBeNull();
        expect(
            contourBounds(
                [
                    { x: 0, y: 0 },
                    { x: 1, y: Number.POSITIVE_INFINITY },
                ],
                0.1,
            ),
        ).toBeNull();
    });

    it("the viewBox flips Y, because every consumer draws inside scale(1,-1)", () => {
        const square: Point2D[] = [
            { x: 0, y: 0 },
            { x: 10, y: 20 },
        ];
        const b = contourBounds(square, 0.1);
        const [minX, minYFlipped, w, h] = viewBoxNumbers(b!.viewBox);
        expect(minX).toBeCloseTo(-1, 10); // 0 − padX
        expect(minYFlipped).toBeCloseTo(-22, 10); // −(maxY + padY)
        expect(w).toBeCloseTo(12, 10); // 10 + 2·1
        expect(h).toBeCloseTo(24, 10); // 20 + 2·2
    });

    it("row 33 — the two clone callsites now agree BY CONSTRUCTION", () => {
        // The preview's authored framing is 0.1 and the editor's 0.15; the
        // extraction unifies the ALGORITHM and leaves the margin to the caller,
        // because unifying the framing is a design change no row asked for.
        const pts: Point2D[] = [
            { x: -3, y: 1 },
            { x: 4, y: 9 },
            { x: 0, y: -2 },
        ];
        const preview = contourBounds(pts, 0.1);
        const editor = contourBounds(pts, 0.15);

        for (const key of ["minX", "maxX", "minY", "maxY", "width", "height"] as const) {
            expect(preview![key]).toBe(editor![key]);
        }
        expect(editor!.padX).toBeCloseTo(preview!.padX * 1.5, 12);
        expect(editor!.padY).toBeCloseTo(preview!.padY * 1.5, 12);
    });

    it("a zero margin frames tightly rather than throwing the box away", () => {
        const b = contourBounds(
            [
                { x: 1, y: 2 },
                { x: 5, y: 8 },
            ],
            0,
        );
        expect(b!.padX).toBe(0);
        expect(b!.padY).toBe(0);
        expect(b!.viewBox).toBe("1 -8 4 6");
    });
});
