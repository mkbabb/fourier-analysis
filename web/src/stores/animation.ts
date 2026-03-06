import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { Animation } from "@mkbabb/keyframes.js";

export const useAnimationStore = defineStore("animation", () => {
    const t = ref(0);
    const playing = ref(false);
    const speed = ref(1);
    const duration = ref(30000); // ms per full cycle

    let anim: Animation | null = null;

    function createAnim(): Animation {
        if (anim) {
            anim.stop();
        }

        const a = new Animation({
            duration: duration.value / speed.value,
            iterationCount: "infinite",
            timingFunction: "linear",
            fillMode: "none",
            useWAAPI: false,
        });

        a.addFrame("0%", { t: "0px" }, (_vars: any, time: number) => {
            t.value = time / a.options.duration;
        });
        a.addFrame("100%", { t: "1px" });
        a.parse();

        anim = a;
        return a;
    }

    function play() {
        if (playing.value) return;
        playing.value = true;

        // If paused mid-animation, toggle pause to resume
        if (anim && anim.started && anim.paused) {
            anim.pause(); // toggles: paused → resumed
            return;
        }

        // Create fresh animation starting from current t position
        const a = createAnim();
        // play() starts the rAF loop; we adjust startTime after first tick
        const currentT = t.value;
        const origOnStart = a.onStart.bind(a);
        const patchedOnStart = async function (this: Animation) {
            await origOnStart();
            // Offset startTime so we begin at the current t position
            if (currentT > 0 && a.startTime != null) {
                a.startTime -= currentT * a.options.duration;
            }
        };
        a.onStart = patchedOnStart as any;
        a.play();
    }

    function pause() {
        if (!playing.value) return;
        playing.value = false;
        if (anim && anim.started && !anim.paused) {
            anim.pause(false); // pause without toggle
        }
    }

    function toggle() {
        if (playing.value) pause();
        else play();
    }

    function seek(normalizedT: number) {
        t.value = Math.max(0, Math.min(1, normalizedT));

        if (anim && anim.started) {
            const targetTime = t.value * anim.options.duration;
            anim.t = targetTime;

            const now = performance.now();
            anim.startTime = now - targetTime;
            if (anim.pausedTime > 0) {
                anim.pausedTime = now;
            }

            anim.interpFrames(targetTime, true);
        }
    }

    function reset() {
        playing.value = false;
        t.value = 0;
        if (anim) {
            anim.stop();
            anim = null;
        }
    }

    // Adjust effective duration when speed changes
    watch(speed, (newSpeed) => {
        if (!anim || !anim.started) return;
        const wasPlaying = playing.value;
        const currentT = t.value;

        // Recreate with new duration
        if (wasPlaying) {
            pause();
            createAnim();
            play();
        }
    });

    return { t, playing, speed, duration, play, pause, toggle, seek, reset };
});
