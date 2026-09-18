/**
 * Composable for animated Fourier morphing between two shapes.
 *
 * Animation phases:
 * 1. settle-out:  Current shape degrades from full harmonics → low harmonics
 * 2. morph:       Cross-fade point arrays from shape A (low) → shape B (low)
 * 3. settle-in:   New shape resolves from low harmonics → full harmonics
 *
 * All transitions are driven by keyframes.js `KeyframesAnimation` instances
 * with easing functions (from value.js) applied to the interpolation t.
 */

import { ref, computed, onUnmounted, type Ref } from "vue";
import { loadAnimationEngine, type KeyframesAnimation } from "@mkbabb/keyframes.js";
import {
    interpolateAtHarmonicLevel,
    lerpPoints,
    pointsToSvgPath,
    type FourierShape,
} from "@/lib/svg-fourier";

/**
 * X.F.W4 · FR-AH-7 ⊕ FR-AH-24 · L-14 — THE EAGER value.js EDGE, CUT, AND THE
 * BARREL RE-EXPORT WITH IT.
 *
 * The static edge that used to sit here — `import { … } from "@/lib/easings"` —
 * was the whole reason `vendor-math` rode the eager bundle on EVERY route:
 * `main.ts → App → AppHeader → DarkModeToggle → useFourierMorph → @/lib/easings
 * → @mkbabb/value.js`. The header mounts on every route, so every visitor paid
 * for the easing library whether or not they ever morphed anything.
 *
 * ⊘ CURE-COMPLETENESS (FR-AH-7's own lock): striking the import alone is HALF
 * the cure. The colocation re-export beneath it — `export { EASING_PRESETS,
 * EASING_PRESET_NAMES, type EasingFn, type EasingPreset }` — re-created the
 * same static edge for anyone importing it from here, so the eager chain would
 * have survived the deletion that was supposed to kill it. Both go. The
 * re-export had zero consumers in any case (⟨cmd⟩ the tree: every reader of
 * those four names imports them from `@/lib/easings` directly or through
 * `useMorphConfig`, never from this module), which is FR-AH-24 · L-14's
 * independent leg — the mechanism was carried by FR-AH-7, the ID was not, and
 * it is named here so the cure is traceable to the row that bought it.
 * ⊘ The re-export surface is `EASING_PRESETS` / `EASING_PRESET_NAMES` plus the
 * two types — NOT `getEasingFn`, which was imported and used but never
 * re-exported. The deletion is exactly that surface.
 *
 * `getEasingFn` is still needed, inside `morphTo` alone, which is already
 * behind `await getAnimationCtor()`'s dynamic boundary — so it is resolved by a
 * dynamic import in the same await window. No new round trip on any path that
 * was not already waiting, and nothing on the boot path at all.
 */
type EasingFn = (t: number) => number;

export type MorphPhase = "idle" | "settle-out" | "morph" | "settle-in";

/**
 * X.F.W4 · SP-4 — `prefers-reduced-motion`, read LIVE at every call.
 *
 * ⊘ FR-AH-6 (*"one predicate, one home"*) — the app carries a second copy of
 * this predicate at `router/index.ts`, for the View-Transitions gate. WHICH of
 * the two homes survives is F.W5's rider to decide, so this seat does not
 * pre-empt it: the predicate lives with the clock it gates, both sites carry
 * this note, and the collapse is one move whenever the ruling lands.
 *
 * It is a function and not a captured boolean because the preference can change
 * mid-session; a value read once at module scope is a gate that silently stops
 * being one.
 */
function prefersReducedMotion(): boolean {
    return (
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
    );
}

// keyframes 2.2.0 moves the value.js-bearing animation engine behind the
// `loadAnimationEngine()` dynamic boundary, so value.js no longer rides the
// eager bundle — it loads on first morph. The browser caches the engine module
// after the first resolve, so this promise is constructed at most once.
// F.W1 — at keyframes 6 the engine class is `KeyframesAnimation` (the bare
// `Animation` name is gone from both the type surface and the engine object);
// the boundary, the lazy promise and the tween shape below are unchanged.
type AnimationCtor = typeof KeyframesAnimation;
let enginePromise: Promise<AnimationCtor> | null = null;
function getAnimationCtor(): Promise<AnimationCtor> {
    if (!enginePromise) {
        /**
         * X.F.W4 · FMD-9 — the memo is POISONED ON EXISTENCE, not on success.
         * It was assigned before the promise settled and carried no `.catch`,
         * so ONE transient chunk-load failure — a deploy mid-session, a flaky
         * network — made every later morph re-await the same rejected promise
         * for the life of the page, and surfaced as an unhandled rejection
         * nobody could act on. Clearing it in the catch makes the next attempt
         * a real retry; re-throwing keeps the failure the caller's to handle
         * rather than swallowing it here.
         */
        enginePromise = loadAnimationEngine()
            .then((engine) => engine.KeyframesAnimation)
            .catch((err: unknown) => {
                enginePromise = null;
                throw err;
            });
    }
    return enginePromise;
}

// ── Config type ─────────────────────────────────────────────────────

export interface MorphConfig {
    settleOutMs: number;
    morphMs: number;
    settleInMs: number;
    lowLevel: number;
    highLevel: number;
    settleOutEasing: string;
    morphEasing: string;
    settleInEasing: string;
}

export const DEFAULT_MORPH_CONFIG: MorphConfig = {
    settleOutMs: 150,
    morphMs: 50,
    settleInMs: 150,
    lowLevel: 5,
    highLevel: 50,
    settleOutEasing: "linear",
    morphEasing: "linear",
    settleInEasing: "linear",
};

// ── Composable ──────────────────────────────────────────────────────

export interface UseFourierMorphOptions {
    config?: MorphConfig;
}

export function useFourierMorph(options: UseFourierMorphOptions = {}) {
    const config = ref<MorphConfig>({ ...(options.config ?? DEFAULT_MORPH_CONFIG) });

    const phase: Ref<MorphPhase> = ref("idle");
    const currentPoints: Ref<[number, number][]> = ref([]);
    const currentPath = computed(() => pointsToSvgPath(currentPoints.value));
    const harmonicLevel = ref(config.value.highLevel);
    /** 0 = fully "from" shape, 1 = fully "to" shape. Updated during morphTo(). */
    const morphProgress = ref(0);

    let activeShape: FourierShape | null = null;
    let currentAnim: KeyframesAnimation | null = null;

    /**
     * X.F.W4 · FR-AH-9 ⊕ FR-AH-21 ⊕ FMD-5 — THE EPOCH TOKEN.
     *
     * The engine's `stop()` RESOLVES the pending `play()` rather than rejecting
     * it. `morphTo` is a three-await coroutine, so every call that meant to KILL
     * a running morph — `stopAnim`, `setShape`, `setLevel`, a second `morphTo`,
     * `onUnmounted` — instead ADVANCED it: the awaits all fell through and the
     * dead coroutine kept writing `currentPoints`, `harmonicLevel` and `phase`
     * on top of whatever superseded it. Anti-teardown, in the literal sense.
     *
     * A monotonic epoch is the whole cure. Every superseding act bumps it; the
     * coroutine captures its own value and checks it after each await and inside
     * each tick. A superseded run then does nothing at all instead of racing —
     * and, critically, it does not reset `phase`, which is how the old code
     * turned a teardown into a spurious "idle".
     */
    let epoch = 0;

    function setShape(shape: FourierShape) {
        stopAnim();
        activeShape = shape;
        harmonicLevel.value = config.value.highLevel;
        currentPoints.value = interpolateAtHarmonicLevel(shape, config.value.highLevel);
        phase.value = "idle";
    }

    /** Set the displayed harmonic level without animation. */
    function setLevel(shape: FourierShape, level: number) {
        stopAnim();
        activeShape = shape;
        harmonicLevel.value = level;
        currentPoints.value = interpolateAtHarmonicLevel(shape, level);
        phase.value = "idle";
    }

    function updateConfig(newConfig: Partial<MorphConfig>) {
        Object.assign(config.value, newConfig);
    }

    function getIdlePoints(): [number, number][] {
        if (!activeShape) return [];
        return interpolateAtHarmonicLevel(activeShape, config.value.highLevel);
    }

    function stopAnim() {
        // Supersede first: `stop()` resolves the pending `play()`, so the
        // coroutine WILL resume, and the epoch is what makes that resumption a
        // no-op instead of a second writer.
        epoch += 1;
        if (currentAnim) {
            currentAnim.stop();
            currentAnim = null;
        }
    }

    function createTweenAnimation(
        AnimationCtor: AnimationCtor,
        durationMs: number,
        onTick: (t: number) => void,
    ): KeyframesAnimation {
        const a = new AnimationCtor({
            duration: durationMs,
            iterationCount: 1,
            timingFunction: "linear",
            fillMode: "forwards",
            useWAAPI: false,
        });

        a.addFrame("0%", { v: "0px" }, (_vars: any, time: number) => {
            const t = Math.min(time / a.options.duration, 1);
            onTick(t);
        });
        a.addFrame("100%", { v: "1px" });
        a.parse();

        return a;
    }

    async function morphTo(from: FourierShape, to: FourierShape): Promise<void> {
        stopAnim();

        /**
         * X.F.W4 · SP-4 — FMD-22 ⊕ FR-AH-31 ⊕ DMT D-M1/L-7/C-5, ONE gate.
         *
         * This coroutine is the only JS clock on the `/morph` route and the
         * only one behind the header toggle, so both banked rows are the same
         * ungated clock seen from two components and both close here rather
         * than at either consumer.
         *
         * ⊘ THE REDUCED ARM SEEDS THE *TERMINAL* FRAME, never a blank one and
         * never t=0 (SP-4's M-D1 clause, and the census cell's own `proposed`:
         * *"morphTo() should snap directly to the target shape at highLevel
         * (single setShape, phase stays idle, no tween) — a true no-motion
         * path, not a shortened one"*). `setShape(to)` is exactly that: the
         * destination shape at `highLevel`, `phase` back to `idle`, and
         * `morphProgress` at 1 so every consumer reading the progress — the
         * header glyph's colour among them — reads the DESTINATION rather than
         * a frozen departure.
         *
         * ⊘ The early return also skips the dynamic engine import below, so the
         * reduced arm never pays for a chunk it will not tick.
         *
         * ⊘ CENSUS CELL FALSIFIED IN THE SAME ACT (G-F4-CENSUS-CELLS): the
         * 2026-06-16 M-deep-audit run's B5-01 evidence line names
         * `DarkModeToggle` among *"10 components [that] do honour it"*. It did
         * not: its `@media (prefers-reduced-motion: reduce)` block nulled
         * `transition` alone and left the hover transform, and this coroutine —
         * which the toggle drives on every click — consulted the preference
         * nowhere. The correction is dated beside the record at
         * `<vjs>/docs/tranches/X/fourier/F-W4-ADDENDA-a-2026-09-18.md`, landed
         * with this edit (the artefact itself is immutable, E-3).
         */
        if (prefersReducedMotion()) {
            setShape(to);
            morphProgress.value = 1;
            return;
        }

        /**
         * X.F.W4 · DMT M-3 ⊕ FMD-6 — THE GUARD'S HOLE, CLOSED.
         *
         * Both consumers guard re-entry with `phase !== "idle"`, and `phase` was
         * first written AFTER `await getAnimationCtor()` — a genuine dynamic
         * import. Two activations inside that window both read `"idle"`, both
         * passed, and both ran: the guard was exactly as wide as the chunk
         * fetch and widest on the cold path it exists to protect. The phase is
         * claimed BEFORE the await, so the second caller is turned away by the
         * first caller's own write.
         */
        phase.value = "settle-out";

        // FR-AH-9's epoch, captured after `stopAnim()` above bumped it.
        const myEpoch = epoch;
        const superseded = () => epoch !== myEpoch;

        /**
         * X.F.W4 · FR-AH-20 — `try/finally`, because a throw BRICKED the control.
         *
         * Anything that threw past this point — the engine import, a frame
         * callback, a malformed shape — left `phase` on a non-idle value
         * forever, and both consumers' guards read that value. One transient
         * failure and the toggle never worked again for the life of the page,
         * with no visible symptom to explain it. The finally restores idle, and
         * restores it ONLY if this run is still the live one, so a teardown
         * cannot be reported as a completion.
         */
        try {
            // Resolve the value.js-bearing engine and the easing catalog lazily.
            // Both are behind THIS await window, so the cost is paid by the
            // first morph and by no other page view (FR-AH-7).
            const [Animation, { getEasingFn }] = await Promise.all([
                getAnimationCtor(),
                import("@/lib/easings"),
            ]);
            if (superseded()) return;

            const {
                settleOutMs,
                morphMs,
                settleInMs,
                lowLevel,
                highLevel,
                settleOutEasing,
                morphEasing,
                settleInEasing,
            } = config.value;

            const easeOut: EasingFn = getEasingFn(settleOutEasing);
            const easeMorph: EasingFn = getEasingFn(morphEasing);
            const easeIn: EasingFn = getEasingFn(settleInEasing);

            const totalMs = settleOutMs + morphMs + settleInMs;

            // Phase 1: Settle out
            await new Promise<void>((resolve) => {
                currentAnim = createTweenAnimation(Animation, settleOutMs, (tRaw: number) => {
                    if (superseded()) return;
                    const t = easeOut(tRaw);
                    const level = highLevel + (lowLevel - highLevel) * t;
                    harmonicLevel.value = level;
                    currentPoints.value = interpolateAtHarmonicLevel(from, Math.max(lowLevel, level));
                    morphProgress.value = (tRaw * settleOutMs) / totalMs;
                });
                currentAnim.play().then(() => resolve());
            });
            if (superseded()) return;

            // Phase 2: Morph
            phase.value = "morph";
            const fromLowPoints = interpolateAtHarmonicLevel(from, lowLevel);
            const toLowPoints = interpolateAtHarmonicLevel(to, lowLevel);

            await new Promise<void>((resolve) => {
                currentAnim = createTweenAnimation(Animation, morphMs, (tRaw: number) => {
                    if (superseded()) return;
                    const t = easeMorph(tRaw);
                    currentPoints.value = lerpPoints(fromLowPoints, toLowPoints, t);
                    morphProgress.value = (settleOutMs + tRaw * morphMs) / totalMs;
                });
                currentAnim.play().then(() => resolve());
            });
            if (superseded()) return;

            // Phase 3: Settle in
            phase.value = "settle-in";
            activeShape = to;

            await new Promise<void>((resolve) => {
                currentAnim = createTweenAnimation(Animation, settleInMs, (tRaw: number) => {
                    if (superseded()) return;
                    const t = easeIn(tRaw);
                    const level = lowLevel + (highLevel - lowLevel) * t;
                    harmonicLevel.value = level;
                    currentPoints.value = interpolateAtHarmonicLevel(to, Math.min(highLevel, level));
                    morphProgress.value = (settleOutMs + morphMs + tRaw * settleInMs) / totalMs;
                });
                currentAnim.play().then(() => resolve());
            });
            if (superseded()) return;

            morphProgress.value = 1;
        } finally {
            if (!superseded()) {
                phase.value = "idle";
                currentAnim = null;
            }
        }
    }

    onUnmounted(() => stopAnim());

    return {
        phase,
        config,
        currentPath,
        currentPoints,
        harmonicLevel,
        morphProgress,
        setShape,
        setLevel,
        updateConfig,
        getIdlePoints,
        morphTo,
    };
}
