/**
 * Composable for managing Fourier morph configuration state.
 *
 * Provides reactive config, serialization to JSON, reset to defaults,
 * and syncing with a useFourierMorph instance.
 */

import { reactive, computed, watch, type Ref } from "vue";
import { useClipboard } from "@mkbabb/glass-ui";
import { useToast } from "@/composables/useToast";
import {
    DEFAULT_MORPH_CONFIG,
    type MorphConfig,
} from "@/composables/useFourierMorph";
import {
    EASING_PRESETS,
    EASING_PRESET_NAMES,
    easingCurvePath,
} from "@/lib/easings";

export { EASING_PRESETS, EASING_PRESET_NAMES, DEFAULT_MORPH_CONFIG, easingCurvePath };
export type { MorphConfig };

/**
 * X.F.W4 · SP-19 — FM-20 (= FMD-1), THE LEVEL-TABLE LIE, lifted whole.
 *
 * The preview domain was decoupled from the asset it previews. The candidate
 * ladder hard-coded 75 and 100 and took NO shape argument, while both shipped
 * assets top out at 50 (⟨cmd⟩ this seat, over `sun.json`/`moon.json`:
 * `levels = [1,2,3,5,8,12,18,25,35,50]`, `n_harmonics: 50`, every
 * `partial_sums` entry 512 points) — so `/morph` lied in four places at once:
 *
 *   (a) the n=75 and n=100 cells painted BYTE-IDENTICAL paths to n=50 (clamp to
 *       `maxLevel` then bracket at t=1), so the strip taught that harmonics
 *       above 50 change nothing;
 *   (b) one click produced two answers — `active` landed on n=50 while
 *       `is-bound` marked the clicked 75 or 100;
 *   (c) the `n=` readout reported 75/100 over a frozen glyph for the whole
 *       >50 span of both settle phases;
 *   (d) Export serialised `{"highLevel": 100}` — a config unhonourable by
 *       construction.
 *
 * The cure is the shape's own table as the source of truth. The ladder is
 * FILTERED by the asset's maximum rather than invented, so a regenerated asset
 * re-derives the UI domain for free — which is the pairing FM-19's
 * golden-file ask asks for, and the reason this is not fixed by editing the
 * literal to 50.
 *
 * ⊘ `maxLevel` is a parameter and not a second hard-coded constant: the two
 * shipped assets agree today, and a reader that assumed they always will is the
 * defect this row is about.
 */
export function computePreviewLevels(
    lowLevel: number,
    highLevel: number,
    maxLevel: number,
): number[] {
    const levels = new Set<number>();

    const candidates = [1, 2, 3, 5, 8, 12, 18, 25, 35, 50, 75, 100];
    for (const c of candidates) {
        if (c <= maxLevel) levels.add(c);
    }

    if (lowLevel > 1) levels.add(Math.min(lowLevel, maxLevel));
    levels.add(Math.min(highLevel, maxLevel));

    return Array.from(levels).sort((a, b) => a - b);
}

export function useMorphConfig(
    initialConfig?: Partial<MorphConfig>,
    /**
     * FM-20 — the level ceiling the previewed asset actually carries. Named as a
     * parameter so the caller states WHICH shape is the source of truth (the
     * mid-transit ambiguity rider), rather than this module guessing.
     */
    maxLevel: Ref<number> | (() => number) = () => DEFAULT_MORPH_CONFIG.highLevel,
) {
    const resolveMax = typeof maxLevel === "function" ? maxLevel : () => maxLevel.value;

    const config = reactive<MorphConfig>({
        ...DEFAULT_MORPH_CONFIG,
        ...initialConfig,
    });

    const totalMs = computed(
        () => config.settleOutMs + config.morphMs + config.settleInMs,
    );

    const previewLevels = computed(() =>
        computePreviewLevels(config.lowLevel, config.highLevel, resolveMax()),
    );

    /* P.W5 Lane B.2 — replaced manual `copied` ref + 2s timeout + onUnmounted
       cleanup with glass-ui's `useClipboard` composable (it owns the reset and
       the timer-cleanup discipline). F.W1 / FR-EQR-1: at glass-ui ≥7 that
       composable returns `status` (`idle | pending | success | failure`), never
       a `copied` boolean, and the state travels to consumers by that name. */
    const { status, copy } = useClipboard({ resetMs: 2000 });
    const { toast } = useToast();

    function reset() {
        Object.assign(config, DEFAULT_MORPH_CONFIG);
    }

    function toJSON(): string {
        return JSON.stringify(config, null, 2);
    }

    /** X.F.W14U.shell — UIA-F-214: every clipboard path reports its failure
     *  (the discarded `CopyResult` left a failed Export silent). */
    async function copyToClipboard() {
        const result = await copy(toJSON());
        if (!result.ok) toast("Copying the configuration failed — this browser did not allow clipboard access.", "error");
    }

    /** Create a watcher that syncs config changes into a morph composable. */
    function syncWith(morph: { updateConfig: (cfg: Partial<MorphConfig>) => void }) {
        watch(
            () => ({ ...config }),
            (cfg) => morph.updateConfig(cfg),
            { deep: true },
        );
    }

    return {
        config,
        totalMs,
        previewLevels,
        /** FM-20 — the asset's own ceiling, for the controls that bound against it. */
        maxLevel: computed(resolveMax),
        status,
        reset,
        toJSON,
        copyToClipboard,
        syncWith,
    };
}
