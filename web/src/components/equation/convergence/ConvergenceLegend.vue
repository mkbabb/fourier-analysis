<script setup lang="ts">
import type { TrigHarmonic } from "../lib/harmonics";
import { spectrumColor } from "../lib/harmonics";

defineProps<{
    harmonics: TrigHarmonic[];
    hoveredCurve: string | null;
}>();

const emit = defineEmits<{
    hover: [key: string];
    leave: [];
}>();
</script>

<template>
    <div v-if="harmonics.length" class="legend-overlay glass-subtle">
        <div class="legend-entry" :class="{ 'is-hovered': hoveredCurve === 'sum' }"
            @pointerenter="emit('hover', 'sum')" @pointerleave="emit('leave')">
            <span class="legend-dot legend-dot--golden" />
            <span class="legend-label legend-label--golden">Sum</span>
        </div>
        <div class="legend-entry" :class="{ 'is-hovered': hoveredCurve === 'original' }"
            @pointerenter="emit('hover', 'original')" @pointerleave="emit('leave')">
            <span class="legend-dot legend-dot--dashed" />
            <span class="legend-label">f(x)</span>
        </div>
        <div class="legend-divider" />
        <div
            v-for="(h, i) in harmonics" :key="h.k"
            class="legend-entry"
            :class="{ 'is-hovered': hoveredCurve === `h-${i}` }"
            @pointerenter="emit('hover', `h-${i}`)"
            @pointerleave="emit('leave')"
        >
            <span class="legend-dot" :style="{ background: spectrumColor(i, harmonics.length) }" />
            <span class="legend-label">n={{ h.k }}</span>
        </div>
    </div>
</template>

<style scoped>
@reference "tailwindcss";

.legend-overlay {
    @apply absolute top-2 right-2 flex flex-col gap-0.5 pointer-events-auto;
    max-height: calc(100% - 16px);
    overflow-y: auto;
    overflow-x: hidden;
    padding: 8px 12px;
    border-radius: 8px;
    scrollbar-width: thin;
    z-index: var(--z-content);
    min-width: 100px;
}

.legend-entry {
    @apply flex items-center gap-2.5 px-2 py-1 rounded cursor-default;
    transition: background 0.1s;
}
.legend-entry:hover,
.legend-entry.is-hovered {
    background: color-mix(in srgb, var(--foreground) 6%, transparent);
}

.legend-divider {
    height: 1px;
    margin: 3px 0;
    background: color-mix(in srgb, var(--foreground) 6%, transparent);
}

.legend-dot {
    @apply shrink-0 rounded-full;
    width: 10px;
    height: 10px;
}
.legend-dot--golden {
    background: #f0b632;
    box-shadow: 0 0 4px rgba(240, 182, 50, 0.4);
}
.legend-dot--dashed {
    background: transparent;
    border: 2px dashed rgba(180, 180, 180, 0.6);
}

.legend-label {
    @apply select-none;
    font-family: "Fira Code", monospace;
    color: var(--muted-foreground);
    font-size: 13px;
    line-height: 1.3;
}
.legend-label--golden {
    color: #f0b632;
    font-weight: 600;
}
</style>
