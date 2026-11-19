import { evaluateAt, type Spectrum } from "@mkbabb/fourier";
import type { CanvasSurface } from "@/components/shared/canvas/useCanvasSetup";
import type { ViewTransform } from "./types";

export const TRAIL_RESOLUTION = 1200;
/** The largest advance of t one played tick makes; a larger jump is a seek. */
const MAX_TICK_STEP = 0.05;

/** A key for a view's screen mapping: the cached paths are valid while it holds. */
export function viewKey(view: ViewTransform): string {
    const [x0, y0] = view.toScreen(0, 0);
    const [x1, y1] = view.toScreen(1, 1);
    return `${x0},${y0},${x1},${y1}`;
}

export class TrailManager {
    /** The fallback trail (no precomputed path): the tips as they were played. */
    x: number[] = [];
    y: number[] = [];
    lastT = -1;

    private preX: Float64Array | null = null;
    private preY: Float64Array | null = null;
    /**
     * LAST-TEN F-04: with the path precomputed, the trail is a PREFIX of it,
     * so no array grows while the page stays open. `hi` is the index the
     * prefix reaches: the sample at or before t on every tick, so the line
     * writes itself on the forward leg and un-writes on the reverse one.
     */
    private hi = -1;
    /** The tip, drawn as the trail's last point while it leads the prefix. */
    private tip: [number, number] = [0, 0];
    private tipLeads = false;
    /** The prefix in screen space, extended as `hi` grows, rebuilt when the view changes. */
    private path: Path2D | null = null;
    private pathKey = "";
    private pathHi = -1;

    /** The last index of the precomputed path the drawn line reaches. */
    get end(): number {
        return this.hi;
    }

    precompute(spectrum: Spectrum): void {
        const n = TRAIL_RESOLUTION;
        this.preX = new Float64Array(n + 1);
        this.preY = new Float64Array(n + 1);
        for (let i = 0; i <= n; i++) {
            const [re, im] = evaluateAt(spectrum, i / n);
            this.preX[i] = re;
            this.preY[i] = im;
        }
    }

    reset(): void {
        this.clearTrail();
        this.preX = null;
        this.preY = null;
    }

    clearTrail(): void {
        this.x.length = 0;
        this.y.length = 0;
        this.lastT = -1;
        this.hi = -1;
        this.tipLeads = false;
        this.path = null;
        this.pathHi = -1;
    }

    /**
     * Update the trail with the current tip position: the line is the curve
     * up to t. With the precomputed path that is its prefix to t, closed by
     * the tip, whichever way t moved. Without it, a played forward tick
     * appends the tip; anything else (a reverse tick, a scrub, a loop back,
     * the first frame, a seek such as the reduced-motion terminal frame)
     * rebuilds the trail as the whole path up to t.
     */
    update(
        t: number,
        tipX: number,
        tipY: number,
        scrubbing: boolean,
        spectrum: Spectrum,
    ): void {
        if (this.preX && this.preY) {
            const idx = Math.min(Math.floor(t * TRAIL_RESOLUTION), TRAIL_RESOLUTION);
            this.hi = idx;
            this.tip = [tipX, tipY];
            this.tipLeads = idx < TRAIL_RESOLUTION;
            this.lastT = t;
            return;
        }
        const forward =
            this.lastT >= 0 &&
            t >= this.lastT &&
            t - this.lastT <= MAX_TICK_STEP;
        if (scrubbing || !forward) {
            this.x.length = 0;
            this.y.length = 0;
            const nPts = Math.max(2, Math.ceil(t * 600));
            for (let i = 0; i <= nPts; i++) {
                const tEval = (i / nPts) * t;
                const [re, im] = evaluateAt(spectrum, tEval);
                this.x.push(re);
                this.y.push(im);
            }
        } else if (t !== this.lastT) {
            // A redraw at the same t (a hover, a resize) adds no point.
            this.x.push(tipX);
            this.y.push(tipY);
        }
        this.lastT = t;
    }

    /** The precomputed prefix [0, hi] in screen space, cached across frames. */
    private prefixPath(view: ViewTransform): Path2D {
        const preX = this.preX!, preY = this.preY!;
        const key = viewKey(view);
        if (!this.path || key !== this.pathKey || this.hi < this.pathHi) {
            this.path = new Path2D();
            this.pathKey = key;
            this.pathHi = -1;
        }
        for (let i = this.pathHi + 1; i <= this.hi; i++) {
            const [sx, sy] = view.toScreen(preX[i], preY[i]);
            if (i === 0) this.path.moveTo(sx, sy);
            else this.path.lineTo(sx, sy);
        }
        this.pathHi = Math.max(this.pathHi, this.hi);
        return this.path;
    }

    /** Stroke the line at `alpha` (0..1, the layer's fade). */
    draw(surface: CanvasSurface, view: ViewTransform, color: string, alpha = 1): void {
        if (alpha <= 0) return;
        const { ctx } = surface;
        const { toScreen } = view;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3.5;
        ctx.globalAlpha = 0.9 * Math.min(1, alpha);
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        if (this.preX && this.preY) {
            if (this.hi < 1 && !this.tipLeads) { ctx.globalAlpha = 1; return; }
            let path = this.prefixPath(view);
            if (this.tipLeads) {
                path = new Path2D(path);
                const [tx, ty] = toScreen(this.tip[0], this.tip[1]);
                path.lineTo(tx, ty);
            }
            ctx.stroke(path);
            ctx.globalAlpha = 1;
            return;
        }

        if (this.x.length <= 1) { ctx.globalAlpha = 1; return; }
        ctx.beginPath();
        const [sx0, sy0] = toScreen(this.x[0], this.y[0]);
        ctx.moveTo(sx0, sy0);
        for (let i = 1; i < this.x.length; i++) {
            const [sx, sy] = toScreen(this.x[i], this.y[i]);
            ctx.lineTo(sx, sy);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}
