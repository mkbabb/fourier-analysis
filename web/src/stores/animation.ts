import { defineStore } from "pinia";
import { ref, computed, watch, onScopeDispose } from "vue";
import {
    ANIMATION_EASINGS,
    getEasingSVGPath,
    type AnimationEasingName,
} from "@/lib/easings";
import { coerceAnimationSpeed, type AnimationSpeed } from "@/lib/defaults";

// Re-export for consumers that import from this module
export { ANIMATION_EASINGS as EASING_OPTIONS, getEasingSVGPath };
export type { AnimationEasingName as EasingName };

// B.W4 — re-point disposition. The animation store holds only ephemeral
// playback state (rAF clock, easing, scrub, ping-pong cycle); it never read or
// wrote a snapshot identity. The precomputed partial-sum trajectories the
// renderer consumes ride the `Visualization.animation_data` on the converged
// entity (SCHEMA.md §8) and reach the canvas through the workspace store keyed
// by `visualizationSlug` — there is no snapshot-keyed lookup here to migrate.
/**
 * X.F.W4 · SP-4 — `prefers-reduced-motion`, read LIVE at every decision point.
 *
 * Read at the moment of use rather than captured once: the preference can flip
 * mid-session (OS setting, or a devtools emulation), and a captured boolean
 * would keep answering for the session it was captured in. The same posture the
 * `/visualize` loader and the `/equation` plot already take.
 */
function prefersReducedMotion(): boolean {
    return (
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
    );
}

/**
 * The frame a stopped instrument should be showing.
 *
 * `M-D1`'s terminal-frame law, in one name: for an epicycle drawing t = 1 is
 * the FULLY TRACED curve and t = 0 is the state in which nothing has been drawn
 * yet — so an accommodation that parks the clock at 0 hands a reduced-motion
 * reader a blank canvas and calls it accessibility.
 */
const TERMINAL_T = 1;

export const useAnimationStore = defineStore("animation", () => {
    const t = ref(0);
    const playing = ref(false);
    // Scrubbing state — pauses the rAF loop while the user drags. Declared with
    // the rest of the state because `startLoop()`'s guard reads it (MISS-SCRUB).
    const scrubbing = ref(false);
    /**
     * `SS-L-05 / SS-C-13` ⊕ `SS-L-07 / SS-C-10` — the playback rate, coerced on
     * write into the catalog `lib/defaults.ts` now names.
     *
     * `SpeedSelect` sets this through an unguarded `parseFloat` over reka-ui's
     * five-case `AcceptableValue`, so a non-numeric value rode in as `NaN`,
     * `dur = duration / NaN` made every frame's `elapsed / dur` NaN, and the
     * NaN then survived `structuredClone` into the persisted draft. Coercing at
     * the store's own setter kills that path for every writer at once, and the
     * off-catalog value that produced the banked empty trigger cannot be
     * written at all. The public shape is unchanged: consumers still read and
     * assign `anim.speed`.
     */
    const _speed = ref<AnimationSpeed>(1);
    // ⊘ The PUBLIC type stays `number`, deliberately. Narrowing the store
    // surface to `AnimationSpeed` is the stronger form and it breaks three
    // assignment sites in two files this unit may not write
    // (`AnimationControls.vue` ×2, `useWorkspaceLoader.ts` ×1) — so the
    // narrowing is declared, not half-landed, and what lands here is the
    // RUNTIME guarantee, which holds for every writer whatever its type says.
    const speed = computed<number>({
        get: () => _speed.value,
        set: (v: number) => {
            _speed.value = coerceAnimationSpeed(v);
        },
    });
    const duration = ref(20000); // ms per full cycle
    const easing = ref<AnimationEasingName>("sine");

    // Globally eased t — one smooth curve, no per-segment stutter
    const easedT = computed(() => {
        const fn = ANIMATION_EASINGS[easing.value]?.fn ?? ((x: number) => x);
        return fn(t.value);
    });

    let rafId: number | null = null;

    /**
     * X.F.W3 `.a` · `fr-AnimationControls L-3` — THE CLOCK'S ANCHOR, hoisted out
     * of `startLoop`'s closure so that a seek can invalidate it.
     *
     * `tick` anchors once (`startTime = now - t * dur`) and then derives `t`
     * from elapsed time on every subsequent frame. While the anchor lived
     * inside the loop, nothing outside the loop could reach it — so any seek
     * that did not stop the clock first was overwritten on the very next frame.
     * That is why keyboard seeks did not work: reka routes ←/→/Home/End/Page
     * through `updateValues({ commit: true })` with no pointer event at all, so
     * no scrub session opens, the clock keeps running, and the keystroke was
     * erased ~16ms after it landed. Pointer drags survived only because they
     * PAUSE the clock for the length of the drag.
     *
     * Clearing the anchor is the whole cure: the next tick re-derives it from
     * wherever `t` now is, and the clock continues from the seeked position
     * instead of snapping back to the trajectory it was on.
     */
    let startTime: number | null = null;

    // I.γ — off-screen rAF gating. The epicycle canvas is a 60fps loop that
    // burns CPU/GPU/battery while scrolled off-screen or hidden behind the
    // fullscreen layer. Each mounted `BasisCanvas` registers its on-screen
    // status (via IntersectionObserver) through `setCanvasVisible`; the rAF
    // clock advances only while at least one canvas is visible AND `playing`
    // is set. `playing` stays the user-intent flag — visibility gating parks
    // the *clock*, not the intent, so the loop resumes seamlessly on return.
    // Reference-counted because two canvases (inline + fullscreen) can mount
    // at once: the loop runs while ANY of them is on-screen.
    const visibleCanvases = ref(0);
    const anyCanvasVisible = computed(() => visibleCanvases.value > 0);

    // Manual rAF loop with alternate (ping-pong).
    // The previous incarnation imported `Animation` from `@mkbabb/keyframes.js`
    // and constructed a parallel `createAnim()` graph that was never invoked
    // — the rAF loop below has been the sole driver since the auto-play
    // migration. Dead substrate excised.
    /**
     * Park the clock on the frame a stopped instrument should show.
     *
     * `G-F4-PRM-CLOCK`'s reduced arm, in one place: stop the rAF, drop the
     * playing INTENT (so the transport reports what is true rather than showing
     * a pause button over a clock that is not running), and seed the terminal
     * frame. Every frame stays reachable by hand — the timeline scrub is
     * untouched — so this parks motion the reader did not ask for without
     * removing the instrument's range.
     */
    function parkAtTerminalFrame() {
        stopRAF();
        playing.value = false;
        t.value = TERMINAL_T;
    }

    function startLoop() {
        // X.F.W4 · SP-4 / `fr-AnimationControls D-8 · C-19`, the store half —
        // this was the app's LAST ungated JS clock: eight rAF owners in the
        // repo, seven consulting the preference, and the 60fps epicycle loop
        // the odd one out. `.c` cured the AUTO-START at the loader; the loop
        // itself is gated here, and the gate sits in `startLoop` rather than in
        // `play` because SIX paths re-arm this clock — `play`, `toggle`,
        // `endScrub`, `setCanvasVisible`, the speed watcher and the media-query
        // listener below — and only one of them is a deliberate press.
        if (prefersReducedMotion()) {
            parkAtTerminalFrame();
            return;
        }
        // Gate: only drive the clock when a canvas is actually on-screen.
        // ⊘ MISS-SCRUB: `scrubbing` was absent from this predicate while its
        // sibling park-condition was present, so the speed watcher re-armed the
        // clock against a live drag and the two fought over `t`. One predicate
        // cures it. (The `C-2` direction-state half of that repair lives in
        // `AnimationControls.vue` — unit `.c`'s file — and is cited, not taken.)
        if (!playing.value || !anyCanvasVisible.value || scrubbing.value || rafId !== null) return;

        startTime = null;
        const dur = duration.value / speed.value;

        function tick(now: number) {
            if (!playing.value || !anyCanvasVisible.value) {
                rafId = null;
                return;
            }
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

    // Register/deregister a canvas's on-screen status. When the last visible
    // canvas leaves the viewport the clock parks; when one returns the loop
    // resumes if the user still intends playback.
    function setCanvasVisible(visible: boolean) {
        const next = visible
            ? visibleCanvases.value + 1
            : Math.max(0, visibleCanvases.value - 1);
        visibleCanvases.value = next;
        if (next === 0) stopRAF();
        else if (playing.value) startLoop();
    }

    function toggle() {
        if (playing.value) pause();
        else play();
    }

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
        // `L-3` — every seek re-anchors, whoever made it and whatever the clock
        // is doing. The guarantee this buys is the one the gate asks for: a
        // position the reader chose survives the next frame.
        startTime = null;
    }

    function reset() {
        pause();
        t.value = 0;
        // `fr-AnimationControls L-1b` — `scrubbing` had exactly two writers, and
        // `reset()` was neither: a reset taken mid-drag left the flag stranded
        // true, which forces the trail's full-rebuild branch on every frame and
        // keeps `startLoop`'s own guard closed. The unconditional session pair
        // in the timeline composition means the UI can no longer strand it; this
        // closes the one path that never went through the UI at all.
        scrubbing.value = false;
        startTime = null;
    }

    // Restart loop when speed changes mid-play
    watch(speed, () => {
        if (playing.value) {
            stopRAF();
            startLoop();
        }
    });

    // A preference that flips mid-session parks a clock that is ALREADY
    // running. Event-driven rather than a `matchMedia` read inside `tick` — the
    // alternative the declaring unit named — because a per-frame media query is
    // a style read on the 60fps path, and the browser will tell us for free.
    if (typeof window !== "undefined" && window.matchMedia) {
        const query = window.matchMedia("(prefers-reduced-motion: reduce)");
        const onPreferenceChange = (event: MediaQueryListEvent) => {
            if (event.matches) parkAtTerminalFrame();
        };
        query.addEventListener("change", onPreferenceChange);
        onScopeDispose(() => query.removeEventListener("change", onPreferenceChange));
    }

    return { t, easedT, playing, speed, duration, easing, scrubbing, anyCanvasVisible, play, pause, toggle, seek, startScrub, endScrub, reset, setCanvasVisible };
});
