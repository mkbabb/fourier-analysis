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
 * The line's value: a fraction for a stage that reports one, `null`
 * (indeterminate) for a stage that cannot. Image extraction is one library
 * call that reports only its start and end, so while it runs the line breathes
 * rather than inventing motion.
 */
export function jobProgressValue(s: JobStage | null): number | null {
    if (!s || s.stage === "extract" || s.stage === "queued") return null;
    return Math.max(0, Math.min(1, s.fraction));
}
