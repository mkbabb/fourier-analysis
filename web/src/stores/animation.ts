import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import {
    ANIMATION_EASINGS,
    getEasingSVGPath,
    type AnimationEasingName,
} from "@/lib/easings";

// Re-export for consumers that import from this module
export { ANIMATION_EASINGS as EASING_OPTIONS, getEasingSVGPath };
export type { AnimationEasingName as EasingName };

export const useAnimationStore = defineStore("animation", () => {
    const t = ref(0);
    const playing = ref(false);
    const speed = ref(1);
    const duration = ref(20000); // ms per full cycle
    const easing = ref<AnimationEasingName>("sine");

    // Globally eased t — one smooth curve, no per-segment stutter
    const easedT = computed(() => {
        const fn = ANIMATION_EASINGS[easing.value]?.fn ?? ((x: number) => x);
        return fn(t.value);
    });

    let rafId: number | null = null;

    // Manual rAF loop with alternate (ping-pong).
    // The previous incarnation imported `Animation` from `@mkbabb/keyframes.js`
    // and constructed a parallel `createAnim()` graph that was never invoked
    // — the rAF loop below has been the sole driver since the auto-play
    // migration. Dead substrate excised.
    function startLoop() {
        let startTime: number | null = null;
        const dur = duration.value / speed.value;

        function tick(now: number) {
            if (!playing.value) return;
            if (startTime === null) startTime = now - t.value * dur;

            const elapsed = now - startTime;
            // Which cycle are we in? Even = forward, odd = reverse
            const cycle = Math.floor(elapsed / dur);
            const frac = (elapsed % dur) / dur;
            t.value = cycle % 2 === 0 ? frac : 1 - frac;

            rafId = requestAnimationFrame(tick);
        }

        rafId = requestAnimationFrame(tick);
    }

    function stopRAF() {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    function play() {
        if (playing.value) return;
        playing.value = true;
        startLoop();
    }

    function pause() {
        if (!playing.value) return;
        playing.value = false;
        stopRAF();
    }

    function toggle() {
        if (playing.value) pause();
        else play();
    }

    // Scrubbing state — pauses the rAF loop while the user drags
    const scrubbing = ref(false);

    function startScrub() {
        scrubbing.value = true;
        stopRAF();
    }

    function endScrub() {
        scrubbing.value = false;
        if (playing.value) {
            startLoop();
        }
    }

    function seek(normalizedT: number) {
        t.value = Math.max(0, Math.min(1, normalizedT));
    }

    function reset() {
        pause();
        t.value = 0;
    }

    // Restart loop when speed changes mid-play
    watch(speed, () => {
        if (playing.value) {
            stopRAF();
            startLoop();
        }
    });

    return { t, easedT, playing, speed, duration, easing, scrubbing, play, pause, toggle, seek, startScrub, endScrub, reset };
});
