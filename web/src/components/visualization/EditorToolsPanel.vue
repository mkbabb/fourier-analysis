<script setup lang="ts">
import { computed } from "vue";
import { Slider } from "@mkbabb/glass-ui";
import { Wand2, Minimize2, Magnet } from "lucide-vue-next";
import { VIZ_COLORS } from "@/lib/colors";
import CollapsibleSection from "@/components/ui/CollapsibleSection.vue";

const props = defineProps<{
    magnetRadius: number;
}>();

const emit = defineEmits<{
    smooth: [];
    simplify: [];
    "update:magnetRadius": [value: number];
}>();

/* A.W2.c — adapt the scalar `magnetRadius` to glass-scrubber's array model. */
const magnetModel = computed<number[]>({
    get: () => [props.magnetRadius],
    set: (arr) => emit("update:magnetRadius", Math.max(0, Math.min(10, arr[0] ?? 0))),
});
</script>

<template>
    <div class="cartoon-card px-3 py-2">
        <CollapsibleSection title="Tools" subtitle="contour refinement" :default-open="true">
            <div class="flex flex-col gap-2 pt-1">
                <button class="tool-btn" @click="emit('smooth')"
                    style="--tool-color: var(--viz-chebyshev)">
                    <Wand2 class="w-5 h-5 shrink-0" style="color: var(--viz-chebyshev)" />
                    <div class="flex flex-col gap-0.5 min-w-0">
                        <span class="text-sm font-semibold text-foreground">Smooth</span>
                        <span class="text-micro text-muted-foreground whitespace-normal">Laplacian filter removes noise while preserving shape</span>
                    </div>
                </button>
                <button class="tool-btn" @click="emit('simplify')"
                    style="--tool-color: var(--viz-legendre)">
                    <Minimize2 class="w-5 h-5 shrink-0" style="color: var(--viz-legendre)" />
                    <div class="flex flex-col gap-0.5 min-w-0">
                        <span class="text-sm font-semibold text-foreground">Simplify</span>
                        <span class="text-micro text-muted-foreground whitespace-normal">Reduce point count while preserving curvature</span>
                    </div>
                </button>
                <!-- Magnet mode -->
                <div class="tool-btn tool-btn--static"
                    :style="magnetRadius > 0 ? { '--tool-color': 'var(--viz-fourier)' } : {}">
                    <div class="flex items-center gap-3">
                        <Magnet class="w-5 h-5 shrink-0" :style="magnetRadius > 0 ? { color: 'var(--viz-fourier)' } : {}" :class="magnetRadius > 0 ? '' : 'text-muted-foreground'" />
                        <div class="flex flex-col gap-0.5 min-w-0 flex-1">
                            <div class="flex items-center justify-between">
                                <span class="text-sm font-semibold text-foreground">Magnet</span>
                                <span class="text-xs fira-code text-muted-foreground tabular-nums">{{ magnetRadius }}</span>
                            </div>
                            <span class="text-micro text-muted-foreground whitespace-normal">Drag adjacent points together with falloff</span>
                            <Slider
                                v-model="magnetModel"
                                variant="glass-scrubber"
                                :min="0"
                                :max="10"
                                :step="1"
                                aria-label="Magnet radius"
                                class="magnet-slider-track mt-1"
                                :style="{ '--track-color': VIZ_COLORS.fourier }"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </CollapsibleSection>
    </div>
</template>

<style scoped>
.tool-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    border-radius: 0.75rem;
    border: 1.5px solid var(--border);
    background: var(--card);
    padding: 0.625rem 0.75rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
}
.tool-btn:hover {
    border-color: color-mix(in srgb, var(--tool-color, var(--foreground)) 40%, transparent);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px color-mix(in srgb, var(--tool-color, var(--foreground)) 12%, transparent);
}
.tool-btn:active {
    transform: scale(0.98);
}
.tool-btn--static {
    cursor: default;
}
.tool-btn--static:hover {
    transform: none;
    box-shadow: none;
}

/* A.W2.c — glass-scrubber per-instance retint hook. */
.magnet-slider-track {
    --slider-scrub-range-bg: color-mix(in srgb, var(--track-color) 30%, transparent);
    --slider-scrub-range-bg-hover: color-mix(in srgb, var(--track-color) 45%, transparent);
    --slider-scrub-thumb-bg: var(--track-color);
    --slider-scrub-thumb-bg-hover: var(--track-color);
}
</style>
