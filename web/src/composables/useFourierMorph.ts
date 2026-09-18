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
import type { FourierShape } from "@/lib/svg-fourier";
import {
    interpolateAtHarmonicLevel,
    lerpPoints,
    pointsToSvgPath,
} from "@/lib/svg-fourier";
import {
    EASING_PRESETS,
    EASING_PRESET_NAMES,
    getEasingFn,
    type EasingFn,
    type EasingPreset,
} from "@/lib/easings";

export { EASING_PRESETS, EASING_PRESET_NAMES, type EasingFn, type EasingPreset };

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
        enginePromise = loadAnimationEngine().then((engine) => engine.KeyframesAnimation);
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

        // Resolve the value.js-bearing engine lazily (cached after first morph).
        const Animation = await getAnimationCtor();

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

        const easeOut = getEasingFn(settleOutEasing);
        const easeMorph = getEasingFn(morphEasing);
        const easeIn = getEasingFn(settleInEasing);

        const totalMs = settleOutMs + morphMs + settleInMs;

        // Phase 1: Settle out
        phase.value = "settle-out";
        await new Promise<void>((resolve) => {
            currentAnim = createTweenAnimation(Animation, settleOutMs, (tRaw: number) => {
                const t = easeOut(tRaw);
                const level = highLevel + (lowLevel - highLevel) * t;
                harmonicLevel.value = level;
                currentPoints.value = interpolateAtHarmonicLevel(from, Math.max(lowLevel, level));
                morphProgress.value = (tRaw * settleOutMs) / totalMs;
            });
            currentAnim.play().then(() => resolve());
        });

        // Phase 2: Morph
        phase.value = "morph";
        const fromLowPoints = interpolateAtHarmonicLevel(from, lowLevel);
        const toLowPoints = interpolateAtHarmonicLevel(to, lowLevel);

        await new Promise<void>((resolve) => {
            currentAnim = createTweenAnimation(Animation, morphMs, (tRaw: number) => {
                const t = easeMorph(tRaw);
                currentPoints.value = lerpPoints(fromLowPoints, toLowPoints, t);
                morphProgress.value = (settleOutMs + tRaw * morphMs) / totalMs;
            });
            currentAnim.play().then(() => resolve());
        });

        // Phase 3: Settle in
        phase.value = "settle-in";
        activeShape = to;

        await new Promise<void>((resolve) => {
            currentAnim = createTweenAnimation(Animation, settleInMs, (tRaw: number) => {
                const t = easeIn(tRaw);
                const level = lowLevel + (highLevel - lowLevel) * t;
                harmonicLevel.value = level;
                currentPoints.value = interpolateAtHarmonicLevel(to, Math.min(highLevel, level));
                morphProgress.value = (settleOutMs + morphMs + tRaw * settleInMs) / totalMs;
            });
            currentAnim.play().then(() => resolve());
        });

        phase.value = "idle";
        morphProgress.value = 1;
        currentAnim = null;
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
