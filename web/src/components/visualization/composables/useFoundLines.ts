import { onScopeDispose, watch } from "vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAnimationStore } from "@/stores/animation";
import { VIZ_COLORS } from "@/lib/colors";
import type { CanvasSurface } from "@/components/shared/canvas/useCanvasSetup";
import { chainGrowth, drawSketch, grownCircles, type ChainGrowth, type ViewTransform } from "../lib/canvas-drawing";

/*
 * FORTY-SIXTH G (FORTY-EIGHTH: "a better way to display partial progress"):
 * the first compute shown as it arrives, on the stage canvas.
 *
 * While it runs, each `sketch` the job streams (the subject's outline at the
 * mask, then the strokes found) writes itself in over the picture along its
 * own length, the one before giving way under it, and the whole picture gives
 * way a step with the first, so the lines read on any photograph (coral on a
 * giraffe's patches was all but lost). When the drawing lands the found lines
 * stay as a faint guide that fades as the line writes itself over it (gone
 * when its first pass is done, or at once with the Outline layer on, which
 * draws the same outline), the picture crosses on from where it had given way
 * to its wash, and the chain's circles grow in term by term, the largest
 * first. Under reduced motion every step is a fade: the lines fade in whole,
 * nothing grows, and the guide crosses out with the intro.
 */
const SKETCH_TRACE_MS = 600;
const SKETCH_FADE_REDUCED_MS = 150;
/** How long a superseded sketch takes to recede once its successor is written (an exit, quicker than the entrance). */
const SKETCH_RECEDE_MS = 240;
const SKETCH_ALPHA = 0.9;
/** The found lines' share of their strength under a landed drawing. */
const GUIDE_SHARE = 0.35;
/** How long the landing chain takes to grow in, term by term. */
const GROW_MS = 1200;
/** The whole picture's share once the first found lines stand on it. */
const PICTURE_GIVE = 0.6;

interface Traced {
    lines: Float64Array[];
    /** Its first painted frame (NaN until then). */
    t0: number;
}

function reducedMotion(): boolean {
    return !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** How far a step that began at `t0` (its first painted frame; NaN: not yet painted) has come, eased 0..1. */
function arrived(t0: number, now: number): number {
    if (Number.isNaN(t0)) return 0;
    const k = Math.min(1, (now - t0) / (reducedMotion() ? SKETCH_FADE_REDUCED_MS : SKETCH_TRACE_MS));
    return 1 - (1 - k) ** 3;
}

/**
 * How far the sketch `latest` supersedes has receded (0..1): it holds whole
 * while `latest` writes itself in over it, then fades. A successor that
 * repeats a line (the outline again, with the parts' borders) so never dims
 * it mid-way, and a new set of strokes is written before the old gives way.
 */
function receded(latest: Traced, now: number): number {
    if (Number.isNaN(latest.t0)) return 0;
    const written = latest.t0 + (reducedMotion() ? SKETCH_FADE_REDUCED_MS : SKETCH_TRACE_MS);
    const k = Math.min(1, Math.max(0, (now - written) / SKETCH_RECEDE_MS));
    return 1 - (1 - k) ** 3;
}

export function useFoundLines(opts: {
    /** Paint the stage once (its parked frames). */
    repaint: () => void;
    /** The drawing's intro (BasisCanvas), 0..1; 1 when there is none. */
    introProgress: () => number;
    /** The Outline layer's strength (it draws the same outline the guide does). */
    outlineShown: () => number;
}) {
    const store = useWorkspaceStore();
    const anim = useAnimationStore();

    /** The latest sketch, tracing in, and the one it supersedes, giving way. */
    let sketchNow: Traced | null = null;
    let sketchBefore: Traced | null = null;
    /** The found lines under the landed drawing (still tracing in, if the drawing landed mid-trace), and the furthest the line has written over them. */
    let guide: { now: Traced; before: Traced | null; peak: number } | null = null;
    /** The landing chain's growth: its first painted frame (NaN until then), or -1 for none. */
    let growT0 = -1;
    /** The first sketch's first painted frame (NaN until then), or -1 for none. */
    let giveT0 = -1;
    /** How far the picture had given way when the drawing landed. */
    let givenAtLanding = 1;
    let raf = 0;

    /** The whole picture's share while the found lines stand on it. */
    function pictureGive(now: number): number {
        if (giveT0 === -1) return 1;
        return 1 - (1 - PICTURE_GIVE) * arrived(giveT0, now);
    }
    /** The whole picture's share under a landing drawing: from where it had given way, back to whole as the intro ends. */
    function wholeShare(): number {
        return givenAtLanding + (1 - givenAtLanding) * opts.introProgress();
    }

    /** One sketch as far as it has come: written along its length (faded in whole under reduced motion), at `alpha`. */
    function drawArrived(s: CanvasSurface, view: ViewTransform, sketch: Traced, alpha: number, now: number): void {
        const e = arrived(sketch.t0, now);
        const reduce = reducedMotion();
        drawSketch(s, view, sketch.lines, reduce ? 1 : e, alpha * (reduce ? e : 1), VIZ_COLORS.fourier);
    }

    /** The latest sketch writing itself in, over the one before (still finishing its own trace), which then recedes. */
    function drawTracing(s: CanvasSurface, view: ViewTransform, latest: Traced, before: Traced | null, alpha: number, now: number): void {
        if (before) {
            const r = receded(latest, now);
            if (r < 1) drawArrived(s, view, before, alpha * (1 - r), now);
        }
        drawArrived(s, view, latest, alpha, now);
    }

    /** The found lines over the picture while the first compute runs. */
    function drawFoundLines(s: CanvasSurface, fit: ViewTransform, now: number): void {
        if (!sketchNow) return;
        drawTracing(s, fit, sketchNow, sketchBefore, SKETCH_ALPHA, now);
        if (receded(sketchNow, now) >= 1) sketchBefore = null;
    }

    /** The guide under a landed drawing (drawn under its layers): dims with the intro, fades as the line writes over it. */
    function drawGuide(s: CanvasSurface, view: ViewTransform): void {
        if (!guide) return;
        const arriving = opts.introProgress();
        const reduce = reducedMotion();
        if (!reduce) guide.peak = Math.max(guide.peak, anim.t);
        const a = reduce
            ? SKETCH_ALPHA * (1 - arriving)
            : SKETCH_ALPHA * (1 - (1 - GUIDE_SHARE) * arriving) * (1 - guide.peak) * (1 - opts.outlineShown());
        if (a <= 0.002 && arriving >= 1) {
            guide = null;
            return;
        }
        const now = performance.now();
        drawTracing(s, view, guide.now, guide.before, a, now);
        if (receded(guide.now, now) >= 1) guide.before = null;
    }

    /** How many of `nVis` circles the landing chain shows now, or null once it has grown. */
    function growthOf(nVis: number): ChainGrowth | null {
        if (growT0 === -1) return null;
        if (Number.isNaN(growT0)) return chainGrowth(0);
        const k = (performance.now() - growT0) / GROW_MS;
        return k >= 1 ? null : chainGrowth(grownCircles(nVis, k));
    }

    /** The grown chain's end: where its last drawn arm stops (the tether's start at a desk). */
    function grownEnd(positions: Float64Array, growth: ChainGrowth | null, nVis: number): Float64Array {
        if (!growth) return positions.subarray(0, 2 * (nVis + 1));
        const d = Math.max(1, growth.drawn);
        const f = growth.share;
        const ax = positions[2 * (d - 1)]!;
        const ay = positions[2 * (d - 1) + 1]!;
        return Float64Array.of(ax + (positions[2 * d]! - ax) * f, ay + (positions[2 * d + 1]! - ay) * f);
    }

    /** Something here moves on the stage's own frames (the clock may be parked). */
    function moving(now: number): boolean {
        const settling = (latest: Traced, before: Traced | null) =>
            Number.isNaN(latest.t0) || arrived(latest.t0, now) < 1 || (!!before && receded(latest, now) < 1);
        const tracing = !!sketchNow && settling(sketchNow, sketchBefore);
        const guideTracing = !!guide && settling(guide.now, guide.before);
        return tracing || guideTracing || growT0 !== -1;
    }
    function wake(): void {
        if (raf) return;
        const step = () => {
            raf = 0;
            const now = performance.now();
            // Each step's clock starts on its first painted frame.
            if (sketchNow && Number.isNaN(sketchNow.t0)) sketchNow.t0 = now;
            if (guide && Number.isNaN(guide.now.t0)) guide.now.t0 = now;
            if (Number.isNaN(giveT0)) giveT0 = now;
            if (Number.isNaN(growT0)) growT0 = now;
            else if (growT0 !== -1 && now - growT0 >= GROW_MS) growT0 = -1;
            // A playing clock repaints every frame itself.
            if (!anim.playing) opts.repaint();
            if (moving(now)) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
    }

    watch(() => store.sketch, (sketch) => {
        if (!sketch) {
            sketchNow = sketchBefore = null;
            giveT0 = -1;
            return;
        }
        // Over a drawing already standing (a recompute) the found lines are not shown.
        if (store.epicycleData || store.basesData) return;
        if (giveT0 === -1) giveT0 = NaN;
        sketchBefore = sketchNow;
        sketchNow = { lines: sketch.lines, t0: NaN };
        wake();
    });

    // The drawing lands: the found lines become its guide, and the chain grows
    // in. (Sync, beside the intro's watcher, so the landing's first frame is
    // already theirs.)
    watch(() => store.epicycleData, (data, before) => {
        if (!data) {
            guide = null;
            growT0 = -1;
            givenAtLanding = 1;
            return;
        }
        if (before) return;
        if (sketchNow) guide = { now: sketchNow, before: sketchBefore, peak: 0 };
        givenAtLanding = pictureGive(performance.now());
        giveT0 = -1;
        sketchNow = sketchBefore = null;
        if (!reducedMotion()) {
            growT0 = NaN;
            wake();
        }
    }, { flush: "sync" });

    onScopeDispose(() => cancelAnimationFrame(raf));

    return {
        drawFoundLines,
        drawGuide,
        pictureGive,
        wholeShare,
        /** How far the picture had given way when the drawing landed. */
        giveAtLanding: () => givenAtLanding,
        growthOf,
        grownEnd,
    };
}
