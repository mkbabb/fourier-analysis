import type { JobStage } from "./api";

/**
 * O16 (owner frame 50): the caption under a compute job's progress line, one
 * short phrase per stage of docs/api/compute-jobs.md. It names what the job is
 * doing; the line beside it says how far along.
 */
export function jobStageLabel(s: JobStage | null): string {
    if (!s) return "Computing";
    const count = s.total ? ` ${Math.min(s.done ?? 0, s.total)} of ${s.total}` : "";
    switch (s.stage) {
        case "queued":
            return "Waiting for a free worker";
        case "parse":
            return "Reading the function";
        case "integrate":
            return `Integrating coefficients${count}`;
        case "identify":
            return "Identifying the coefficients";
        case "spline":
            return "Fitting the coefficients";
        case "render":
            return "Writing the series";
        case "extract":
            return "Finding the outline";
        case "epicycles":
            return "Fitting the epicycles";
        case "bases":
            return `Fitting the bases, level${count}`;
        default:
            return "Computing";
    }
}

/**
 * The measure's value: the job's fraction, or `null` (none) while it waits
 * for a worker. Image extraction reports the drawing's checkpoints, so
 * it moves in real steps too (docs/api/compute-jobs.md).
 */
export function jobProgressValue(s: JobStage | null): number | null {
    if (!s || s.stage === "queued") return null;
    return Math.max(0, Math.min(1, s.fraction));
}

/*
 * FORTY-SIXTH G (FORTY-EIGHTH: "a better way to display partial progress"):
 * the measure the stage's timeline shows while a picture's first compute runs.
 * The job reports real checkpoints, seconds apart (the subject mask alone is
 * 2.5 to 4 s here, about twice that in production), so the bar shown is the
 * reported fraction eased to each report and creeping between reports: from
 * each report it closes, ever more slowly, on a point `MEASURE_CREEP_SHARE` of
 * the way from the report to the end. It never stands still, never passes that
 * point, and never moves back: a report under what the creep has already shown
 * (an early one, such as the first subject model's) is a new start from where
 * the bar stands (`creepBase`), never a hold until a creep from below catches up.
 */

/** How quickly the bar closes on its target (ms, an exponential's time constant). */
export const MEASURE_EASE_MS = 160;
/** How slowly the creep after a report runs (ms, its time constant). */
export const MEASURE_CREEP_MS = 4000;
/** The creep's ceiling: this share of the room left above the report. */
export const MEASURE_CREEP_SHARE = 0.5;

/** Where a report of `reported` starts the creep from, with the bar at `shown`: the higher of the two. */
export function creepBase(reported: number, shown: number): number {
    return Math.max(reported, shown);
}

/** Where the bar is heading `since` ms after a creep's start at `reported` (`creepBase`). */
export function measureTarget(reported: number, since: number): number {
    const room = MEASURE_CREEP_SHARE * (1 - reported);
    return reported + room * (1 - Math.exp(-Math.max(0, since) / MEASURE_CREEP_MS));
}

/** The bar after `dt` ms from `shown`, heading for `target`: eased, never back. */
export function stepMeasure(shown: number, target: number, dt: number): number {
    const to = Math.max(shown, target);
    return shown + (to - shown) * (1 - Math.exp(-Math.max(0, dt) / MEASURE_EASE_MS));
}

/** How long the bar takes to run on to full when the drawing lands (ms). */
export const MEASURE_RUN_OUT_MS = 280;
/**
 * The fewest painted frames the run-on takes (the motion canon: a leg is at
 * least five frames long, and no frame lands more than two fifths of it; a cut
 * given two frames is still a cut). On a busy phone the landing's frames come
 * slowly, and 280 ms was two or three of them. Seven keeps the cubic's first
 * frame at 37 % of the travel.
 */
export const MEASURE_RUN_OUT_FRAMES = 7;

/**
 * The bar `elapsed` ms and `frames` painted frames into its run-on to full
 * from `from` (the drawing has landed): cubic out over `MEASURE_RUN_OUT_MS`
 * and never fewer than `MEASURE_RUN_OUT_FRAMES` frames, so it reads as done at
 * once and never crawls through its last few per cent while the drawing
 * already plays, nor jumps to full on a slow display.
 */
export function runOut(from: number, elapsed: number, frames = Infinity): number {
    const k = Math.min(1, Math.max(0, elapsed) / MEASURE_RUN_OUT_MS, Math.max(0, frames) / MEASURE_RUN_OUT_FRAMES);
    return from + (1 - from) * (1 - (1 - k) ** 3);
}
