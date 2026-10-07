import { evaluateFourier } from "@/lib/evaluators";
import type { BasisComponent } from "@/lib/types";
import type { CanvasSurface } from "@/components/shared/canvas/useCanvasSetup";
import type { ViewTransform } from "./types";

const TRAIL_RESOLUTION = 1200;
/** The largest advance of t one played tick makes; a larger jump is a seek. */
const MAX_TICK_STEP = 0.05;

export class TrailManager {
    x: number[] = [];
    y: number[] = [];
    lastT = -1;

    private preX: Float64Array | null = null;
    private preY: Float64Array | null = null;

    precompute(components: BasisComponent[]): void {
        const n = TRAIL_RESOLUTION;
        this.preX = new Float64Array(n + 1);
        this.preY = new Float64Array(n + 1);
        for (let i = 0; i <= n; i++) {
            const [re, im] = evaluateFourier(components, i / n);
            this.preX[i] = re;
            this.preY[i] = im;
        }
    }

    reset(): void {
        this.x.length = 0;
        this.y.length = 0;
        this.lastT = -1;
        this.preX = null;
        this.preY = null;
    }

    clearTrail(): void {
        this.x.length = 0;
        this.y.length = 0;
        this.lastT = -1;
    }

    /**
     * Update trail with the current tip position. A played tick appends the
     * tip; anything else (a scrub, a loop back, the first frame, a seek such as
     * the reduced-motion terminal frame) rebuilds the trail as the whole path
     * up to t, so a still frame carries the same curve a played one does.
     */
    update(
        t: number,
        tipX: number,
        tipY: number,
        scrubbing: boolean,
        components: BasisComponent[],
    ): void {
        const continuous =
            this.lastT >= 0 &&
            t >= this.lastT - 0.01 &&
            t - this.lastT <= MAX_TICK_STEP;
        if (scrubbing || !continuous) {
            this.x.length = 0;
            this.y.length = 0;
            if (this.preX && this.preY) {
                const endIdx = Math.min(
                    Math.ceil(t * TRAIL_RESOLUTION),
                    TRAIL_RESOLUTION,
                );
                for (let i = 0; i <= endIdx; i++) {
                    this.x.push(this.preX[i]);
                    this.y.push(this.preY[i]);
                }
            } else {
                const nPts = Math.max(2, Math.ceil(t * 600));
                for (let i = 0; i <= nPts; i++) {
                    const tEval = (i / nPts) * t;
                    const [re, im] = evaluateFourier(components, tEval);
                    this.x.push(re);
                    this.y.push(im);
                }
            }
        } else if (t !== this.lastT) {
            // A redraw at the same t (a hover, a resize) adds no point.
            this.x.push(tipX);
            this.y.push(tipY);
        }
        this.lastT = t;
    }

    draw(surface: CanvasSurface, view: ViewTransform, color: string): void {
        if (this.x.length <= 1) return;
        const { ctx } = surface;
        const { toScreen } = view;

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3.5;
        ctx.globalAlpha = 0.9;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
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
