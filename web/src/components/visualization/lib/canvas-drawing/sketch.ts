import type { CanvasSurface } from "@/components/shared/canvas/useCanvasSetup";
import type { ViewTransform } from "./types";

/*
 * FORTY-SIXTH G: the drawing as it is found, on the stage while the first
 * compute runs. The job streams it (the subject's outline at the mask, then the
 * strokes found), and each line writes itself in along its own length; the
 * whole picture stays under it. Lines are flat `[x0, y0, x1, y1, ...]` in the
 * contour's frame, so they lie on the picture where they were found.
 */

/** A line's cumulative length at each of its points (cached per line). */
const arcs = new WeakMap<Float64Array, Float64Array>();

export function arcOf(line: Float64Array): Float64Array {
    let arc = arcs.get(line);
    if (arc) return arc;
    const n = line.length >> 1;
    arc = new Float64Array(n);
    for (let i = 1; i < n; i++) {
        arc[i] = arc[i - 1]! + Math.hypot(line[2 * i]! - line[2 * i - 2]!, line[2 * i + 1]! - line[2 * i - 1]!);
    }
    arcs.set(line, arc);
    return arc;
}

/**
 * The prefix of a line `trace` (0..1) of the way along its length: the index
 * of the last whole point, and the point where the prefix ends (between it and
 * the next), in the line's own units.
 */
export function prefixOf(line: Float64Array, trace: number): { last: number; x: number; y: number } {
    const arc = arcOf(line);
    const n = arc.length;
    const total = n ? arc[n - 1]! : 0;
    const at = Math.min(1, Math.max(0, trace)) * total;
    let last = 0;
    while (last + 1 < n && arc[last + 1]! <= at) last++;
    if (last + 1 >= n) return { last: n - 1, x: line[2 * (n - 1)]!, y: line[2 * n - 1]! };
    const seg = arc[last + 1]! - arc[last]!;
    const f = seg > 0 ? (at - arc[last]!) / seg : 0;
    return {
        last,
        x: line[2 * last]! + (line[2 * last + 2]! - line[2 * last]!) * f,
        y: line[2 * last + 1]! + (line[2 * last + 3]! - line[2 * last + 1]!) * f,
    };
}

/** Draw each line written `trace` of the way along its length, at `alpha`, in the drawing's line hue. */
export function drawSketch(
    s: CanvasSurface,
    view: ViewTransform,
    lines: readonly Float64Array[],
    trace: number,
    alpha: number,
    color: string,
): void {
    if (alpha <= 0 || trace <= 0 || !lines.length) return;
    const { ctx } = s;
    ctx.save();
    ctx.beginPath();
    for (const line of lines) {
        if (line.length < 4) continue;
        const end = prefixOf(line, trace);
        const [x0, y0] = view.toScreen(line[0]!, line[1]!);
        ctx.moveTo(x0, y0);
        for (let i = 1; i <= end.last; i++) {
            const [x, y] = view.toScreen(line[2 * i]!, line[2 * i + 1]!);
            ctx.lineTo(x, y);
        }
        const [ex, ey] = view.toScreen(end.x, end.y);
        ctx.lineTo(ex, ey);
    }
    ctx.strokeStyle = color;
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();
}
