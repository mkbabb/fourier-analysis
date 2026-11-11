/**
 * One animation frame loop for an element: it runs only while the page is
 * visible and the element is on screen, and a step never exceeds `maxStepMs`,
 * so a tab that comes back resumes where it was instead of jumping.
 */
export interface FrameLoop {
    /** Run (or resume) the loop. */
    start(): void;
    /** Stop until the next `start`. */
    stop(): void;
    /** Stop and release the observers. */
    dispose(): void;
}

/**
 * `tick(dtMs, nowMs)` runs once per frame with the capped step; it returns
 * whether to keep going, and a `false` stops the loop (zero callbacks after).
 */
export function frameLoop(
    el: Element,
    tick: (dtMs: number, nowMs: number) => boolean,
    opts: { maxStepMs?: number } = {},
): FrameLoop {
    const maxStep = opts.maxStepMs ?? 50;
    let wanted = false;
    let onScreen = true;
    let raf = 0;
    let last = -1;

    const runnable = () => wanted && onScreen && document.visibilityState === "visible";
    const frame = (now: number) => {
        raf = 0;
        const dt = last < 0 ? 0 : Math.min(maxStep, Math.max(0, now - last));
        last = now;
        if (!tick(dt, now)) {
            wanted = false;
            last = -1;
            return;
        }
        if (runnable()) raf = requestAnimationFrame(frame);
    };
    const sync = () => {
        if (runnable()) {
            if (!raf) raf = requestAnimationFrame(frame);
        } else {
            if (raf) cancelAnimationFrame(raf);
            raf = 0;
            last = -1;
        }
    };

    const io =
        typeof IntersectionObserver === "undefined"
            ? null
            : new IntersectionObserver((entries) => {
                  onScreen = entries[entries.length - 1]!.isIntersecting;
                  sync();
              });
    io?.observe(el);
    document.addEventListener("visibilitychange", sync);

    return {
        start() {
            wanted = true;
            sync();
        },
        stop() {
            wanted = false;
            sync();
        },
        dispose() {
            wanted = false;
            sync();
            io?.disconnect();
            document.removeEventListener("visibilitychange", sync);
        },
    };
}
