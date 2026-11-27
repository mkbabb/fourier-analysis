import { onScopeDispose, shallowRef, watch, type Ref } from "vue";
import type { JobStage } from "@/lib/api";
import { jobProgressValue, measureTarget, MEASURE_RUN_OUT_MS, runOut, stepMeasure } from "@/lib/jobProgress";

/**
 * FORTY-SIXTH G: the job's measure as the stage's timeline shows it while a
 * picture's first compute runs (`lib/jobProgress`): `null` while there is none
 * (the upload, the wait for a worker: the bar is indeterminate), else 0..1, the
 * job's reports eased and the stretches between them crept over. When the
 * drawing lands (`landed`) the measure runs on to full (`runOut`) as the row
 * gives way to the scrub, never dropping back to indeterminate on its way out.
 * It runs on the display's frames only while it moves.
 */
export function useJobMeasure(
    job: () => JobStage | null,
    active: () => boolean,
    landed: () => boolean,
): Readonly<Ref<number | null>> {
    const shown = shallowRef<number | null>(null);
    let reported = 0;
    let reportedAt = 0;
    /** The drawing landed while measured: the run-on's start value and its first painted frame (NaN until then). */
    let finish: { from: number; t0: number } | null = null;
    let last = 0;
    let raf = 0;

    function halt(): void {
        cancelAnimationFrame(raf);
        raf = 0;
    }

    function tick(now: number): void {
        raf = 0;
        if (finish) {
            // The run-on's clock starts on its first painted frame, read in
            // that frame's callback: the drawing lands inside a long task, and
            // a clock started before it had run on unseen (the stage's intro).
            const t = performance.now();
            if (Number.isNaN(finish.t0)) finish.t0 = t;
            shown.value = runOut(finish.from, t - finish.t0);
            if (t - finish.t0 < MEASURE_RUN_OUT_MS) raf = requestAnimationFrame(tick);
            return;
        }
        shown.value = stepMeasure(shown.value ?? 0, measureTarget(reported, now - reportedAt), now - last);
        last = now;
        raf = requestAnimationFrame(tick);
    }
    function run(): void {
        if (raf) return;
        last = performance.now();
        raf = requestAnimationFrame(tick);
    }

    watch(
        () => [active() ? jobProgressValue(job()) : null, landed()] as const,
        ([value, isLanded]) => {
            if (value === null) {
                if (isLanded && shown.value !== null) {
                    finish ??= { from: shown.value, t0: NaN };
                    return run();
                }
                finish = null;
                halt();
                shown.value = null;
                return;
            }
            finish = null;
            if (value !== reported || shown.value === null) {
                reported = value;
                reportedAt = performance.now();
            }
            if (shown.value === null) shown.value = 0;
            run();
        },
        { immediate: true },
    );
    onScopeDispose(halt);
    return shown;
}
