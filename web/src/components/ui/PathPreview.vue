<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
    defineProps<{
        pathX: number[];
        pathY: number[];
        size?: number;
        strokeWidth?: number;
        strokeColor?: string;
        padding?: number;
    }>(),
    {
        size: 64,
        strokeWidth: 1.5,
        strokeColor: "currentColor",
        padding: 0.1,
    },
);

const svgPath = computed(() => {
    const { pathX, pathY, padding } = props;
    if (!pathX.length || !pathY.length) return "";

    const minX = Math.min(...pathX);
    const maxX = Math.max(...pathX);
    const minY = Math.min(...pathY);
    const maxY = Math.max(...pathY);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    // Fit into [0, 1] with uniform scale + padding
    const scale = 1 / (Math.max(rangeX, rangeY) * (1 + padding * 2));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const pts = pathX.map((x, i) => {
        const sx = 0.5 + (x - cx) * scale;
        const sy = 0.5 - (pathY[i] - cy) * scale; // flip Y
        return `${sx.toFixed(4)},${sy.toFixed(4)}`;
    });

    return `M${pts.join("L")}Z`;
});
</script>

<template>
    <svg
        class="path-preview"
        :width="size"
        :height="size"
        viewBox="0 0 1 1"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        :stroke="strokeColor"
        :stroke-width="strokeWidth / size"
        stroke-linejoin="round"
        stroke-linecap="round"
    >
        <path v-if="svgPath" :d="svgPath" />
    </svg>
</template>

<style scoped>
.path-preview {
    display: block;
    flex-shrink: 0;
}
</style>
