import { describe, expect, it } from "vitest";
import { jobProgressValue, jobStageLabel } from "./jobProgress";

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
