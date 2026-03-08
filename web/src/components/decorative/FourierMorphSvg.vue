<template>
    <svg
        :viewBox="viewBox"
        xmlns="http://www.w3.org/2000/svg"
        class="fourier-morph-svg"
        :style="{ color: strokeColor }"
    >
        <path
            :d="path"
            fill="none"
            stroke="currentColor"
            :stroke-width="strokeWidth"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
    </svg>
</template>

<script setup lang="ts">
withDefaults(
    defineProps<{
        /** Pre-computed SVG path `d` string (from useFourierMorph). */
        path: string;
        viewBox?: string;
        strokeColor?: string;
        strokeWidth?: number;
    }>(),
    {
        viewBox: "0 0 200 200",
        strokeColor: "hsl(var(--accent-red))",
        strokeWidth: 3,
    },
);
</script>

<style scoped>
.fourier-morph-svg {
    display: block;
    overflow: visible;
}
</style>
