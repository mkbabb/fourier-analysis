/**
 * Composable for managing Fourier morph configuration state.
 *
 * Provides reactive config, serialization to JSON, reset to defaults,
 * and syncing with a useFourierMorph instance.
 */

import { reactive, computed, watch } from "vue";
import { useClipboard } from "@mkbabb/glass-ui";
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
 * Generate a nice spread of preview levels from 1 to highLevel,
 * including the low and high bookends.
 */
export function computePreviewLevels(lowLevel: number, highLevel: number): number[] {
    const levels = new Set<number>();

    const candidates = [1, 2, 3, 5, 8, 12, 18, 25, 35, 50, 75, 100];
    for (const c of candidates) {
        levels.add(c);
    }

    if (lowLevel > 1) levels.add(lowLevel);
    levels.add(highLevel);

    return Array.from(levels).sort((a, b) => a - b);
}

export function useMorphConfig(initialConfig?: Partial<MorphConfig>) {
    const config = reactive<MorphConfig>({
        ...DEFAULT_MORPH_CONFIG,
        ...initialConfig,
    });

    const totalMs = computed(
        () => config.settleOutMs + config.morphMs + config.settleInMs,
    );

    const previewLevels = computed(() =>
        computePreviewLevels(config.lowLevel, config.highLevel),
    );

    /* P.W5 Lane B.2 — replaced manual `copied` ref + 2s timeout + onUnmounted
       cleanup with glass-ui's `useClipboard` composable (auto-resets `copied`
       and owns timer-cleanup discipline). */
    const { copied, copy } = useClipboard({ resetMs: 2000 });

    function reset() {
        Object.assign(config, DEFAULT_MORPH_CONFIG);
    }

    function updateField(field: keyof MorphConfig, event: Event) {
        const target = event.target as HTMLInputElement;
        (config as any)[field] = Number(target.value);
    }

    function toJSON(): string {
        return JSON.stringify(config, null, 2);
    }

    function copyToClipboard() {
        copy(toJSON());
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
        copied,
        reset,
        updateField,
        toJSON,
        copyToClipboard,
        syncWith,
    };
}
