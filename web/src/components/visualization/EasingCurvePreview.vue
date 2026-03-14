<script setup lang="ts">
import { getEasingSVGPath, type EasingName } from "@/stores/animation";

withDefaults(
    defineProps<{
        easing: EasingName;
        size?: number;
        color?: string;
    }>(),
    {
        size: 28,
        color: "hsl(248 88% 71%)",
    },
);
</script>

<template>
    <svg
        viewBox="-0.05 -0.3 1.1 1.6"
        preserveAspectRatio="xMidYMid meet"
        :width="size"
        :height="size * 0.7"
        class="easing-preview"
    >
        <path
            :d="getEasingSVGPath(easing)"
            fill="none"
            :stroke="color"
            stroke-width="0.15"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
    </svg>
</template>

<style scoped>
.easing-preview {
    display: block;
    flex-shrink: 0;
}
</style>
