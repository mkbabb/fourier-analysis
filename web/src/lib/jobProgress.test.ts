import { describe, expect, it } from "vitest";
import { MEASURE_CREEP_SHARE, MEASURE_RUN_OUT_MS, jobProgressValue, jobStageLabel, measureTarget, runOut, stepMeasure } from "./jobProgress";

/**
 * FORTY-FIRST F: an image job's extraction reports the drawing's four
 * checkpoints, so the stage's measure moves through it in real steps instead
 * of breathing for most of the job.
 */
describe("jobProgressValue", () => {
    it("moves through extraction on its checkpoints", () => {
        const steps = [0, 0.4, 0.68, 0.714, 0.833, 0.85].map((fraction) =>
            jobProgressValue({ stage: "extract", fraction }),
        );
        expect(steps).toEqual([0, 0.4, 0.68, 0.714, 0.833, 0.85]);
    });

    it("gives no measure while the job waits for a worker, or before it has a stage", () => {
        expect(jobProgressValue({ stage: "queued", fraction: 0 })).toBeNull();
        expect(jobProgressValue(null)).toBeNull();
    });

    it("keeps the measure inside 0..1", () => {
        expect(jobProgressValue({ stage: "bases", fraction: 1.2 })).toBe(1);
        expect(jobProgressValue({ stage: "parse", fraction: -0.1 })).toBe(0);
    });
});

describe("jobStageLabel", () => {
    it("names the stage for the stage's accessible label", () => {
        expect(jobStageLabel({ stage: "extract", fraction: 0.4 })).toBe("Finding the outline");
        expect(jobStageLabel(null)).toBe("Computing");
    });
});

/**
 * FORTY-SIXTH G: the timeline's measure while a picture computes never stands
 * still between the job's reports, never overtakes the ceiling the last report
 * allows, and never moves back.
 */
describe("the timeline's measure", () => {
    /** Run the bar at 60 Hz over a schedule of reports `[at ms, fraction]` for `ms`. */
    function run(reports: [number, number][], ms: number): number[] {
        const out: number[] = [];
        let shown = 0;
        let reported = 0;
        let since = 0;
        for (let t = 0; t <= ms; t += 1000 / 60) {
            const due = reports.filter(([at]) => at <= t).pop();
            if (due && due[1] !== reported) {
                reported = due[1];
                since = 0;
            }
            shown = stepMeasure(shown, measureTarget(reported, since), 1000 / 60);
            since += 1000 / 60;
            out.push(shown);
        }
        return out;
    }

    it("moves on every stretch of a second while the job is quiet", () => {
        // The giraffe here: the mask at 3.0 s, the line maps at 4.7 s, the vectors at 5.0 s.
        const bar = run([[0, 0], [3000, 0.4], [4670, 0.68], [5020, 0.714]], 6000);
        for (let i = 60; i < bar.length; i += 60) expect(bar[i]! - bar[i - 60]!).toBeGreaterThan(0.004);
    });

    it("never moves back and never passes halfway from the last report to the end", () => {
        const bar = run([[0, 0], [3000, 0.4], [4670, 0.68], [5020, 0.714]], 9000);
        for (let i = 1; i < bar.length; i++) expect(bar[i]!).toBeGreaterThanOrEqual(bar[i - 1]!);
        expect(Math.max(...bar.slice(0, 179))).toBeLessThan(0.5);
        expect(bar.at(-1)!).toBeLessThan(0.714 + MEASURE_CREEP_SHARE * (1 - 0.714));
    });

    it("closes 95 % of a step to a report within half a second", () => {
        const bar = run([[0, 0], [1000, 0.4]], 1500);
        expect(bar.at(-1)!).toBeGreaterThan(0.385);
    });

    it("holds when a report lands under what the creep has shown", () => {
        expect(stepMeasure(0.5, measureTarget(0.45, 0), 16)).toBe(0.5);
    });

    it("runs on to full when the drawing lands, done in under 300 ms, rising every frame and never back", () => {
        expect(MEASURE_RUN_OUT_MS).toBeLessThanOrEqual(300);
        expect(runOut(0.76, 0)).toBe(0.76);
        expect(runOut(0.76, MEASURE_RUN_OUT_MS)).toBe(1);
        expect(runOut(0.76, 10_000)).toBe(1);
        let last = 0.76;
        for (let t = 1000 / 60; t < MEASURE_RUN_OUT_MS; t += 1000 / 60) {
            const v = runOut(0.76, t);
            expect(v).toBeGreaterThan(last);
            last = v;
        }
        // Most of the way in its first half (cubic out): it reads as done at once.
        expect(runOut(0.76, MEASURE_RUN_OUT_MS / 2)).toBeGreaterThan(0.96);
    });
});
