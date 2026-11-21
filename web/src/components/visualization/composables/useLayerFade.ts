import { onUnmounted, watch } from "vue";

/** A layer's fade in and out, in ms: the stage's standard, and a shorter one under reduced motion. */
export const LAYER_FADE_MS = 280;
export const LAYER_FADE_REDUCED_MS = 120;

/**
 * A stage layer's strength, 0 (gone) to 1 (shown), tweened whenever `shown`
 * changes (cubic-out; a fade under reduced motion too, never a cut). A toggle
 * that lands mid-fade turns back from where the layer stands. `onStep`
 * repaints the stage on each step, so the change reads while the animation
 * clock is parked.
 */
export function useLayerFade(shown: () => boolean, onStep: () => void): { strength: () => number } {
    let value = shown() ? 1 : 0;
    let raf = 0;

    watch(shown, (on) => {
        cancelAnimationFrame(raf);
        const from = value;
        const to = on ? 1 : 0;
        const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        const dur = reduce ? LAYER_FADE_REDUCED_MS : LAYER_FADE_MS;
        const t0 = performance.now();
        const step = (now: number) => {
            const k = Math.min(1, (now - t0) / dur);
            value = from + (to - from) * (1 - (1 - k) ** 3);
            onStep();
            if (k < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
    });

    onUnmounted(() => cancelAnimationFrame(raf));

    return { strength: () => value };
}
