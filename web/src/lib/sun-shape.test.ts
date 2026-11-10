import { describe, expect, it } from "vitest";
import sun from "@/assets/fourier-paths/sun.json";

/**
 * Canon F11: the Sun the theme toggle and /morph draw at rest is one outline,
 * not the stitched strokes of an icon. A closed curve that crosses itself reads
 * as a scribble, so every level the morph can rest on is checked.
 */
type XY = { x: number[]; y: number[] };

function crossings({ x, y }: XY): number {
    const n = x.length;
    const side = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) =>
        (cy - ay) * (bx - ax) - (by - ay) * (cx - ax) > 0;
    let count = 0;
    for (let i = 0; i < n; i++) {
        const [ax, ay, bx, by] = [x[i], y[i], x[(i + 1) % n], y[(i + 1) % n]];
        for (let j = i + 2; j < n; j++) {
            if (i === 0 && j === n - 1) continue;
            const [cx, cy, dx, dy] = [x[j], y[j], x[(j + 1) % n], y[(j + 1) % n]];
            if (side(ax, ay, cx, cy, dx, dy) !== side(bx, by, cx, cy, dx, dy) &&
                side(ax, ay, bx, by, cx, cy) !== side(ax, ay, bx, by, dx, dy)) count++;
        }
    }
    return count;
}

describe("the Sun shape", () => {
    it("never crosses itself, at rest or at any morph level", () => {
        const paths = sun as unknown as { original: XY; partial_sums: Record<string, XY> };
        const counts = Object.fromEntries([
            ["original", crossings(paths.original)],
            ...Object.entries(paths.partial_sums).map(([k, v]) => [k, crossings(v)]),
        ]);
        expect(counts).toEqual(Object.fromEntries(Object.keys(counts).map((k) => [k, 0])));
    });
});
