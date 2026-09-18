<script setup lang="ts">
import { computed } from "vue";
import { contourBounds } from "@/lib/contourEditing";

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

/**
 * X.F.W4 · `fr-ContourPreview` row 40 — the third callsite of the framing
 * cluster's single cure. This one already carried the `|| 1` floor and spread
 * its extents across `Math.min`/`Math.max`; what it did NOT carry is the finite
 * screen, and it is the one surface where that matters most: a single
 * non-finite coordinate poisons `Math.min` to `NaN`, every projected point
 * stringifies as `NaN,NaN`, and the `<path d>` is discarded by the UA — a
 * blank tile, on the gallery's densest surface, with nothing in the console.
 *
 * ⊘ The uniform-scale framing is this component's own contract (it fits into
 * the unit box with ONE scale so a grid of tiles stays comparable) and the
 * extraction does not flatten it into the per-axis form: `contourBounds` is
 * adopted for the box, the floors and the screen — the three facts all three
 * surfaces agree on — and the projection stays local.
 */
const svgPath = computed(() => {
    const { pathX, pathY, padding } = props;
    if (!pathX.length || pathX.length !== pathY.length) return "";

    const b = contourBounds(
        pathX.map((x, i) => ({ x, y: pathY[i] })),
        padding,
    );
    if (!b) return "";

    // Fit into [0, 1] with uniform scale + padding
    const scale = 1 / (Math.max(b.width, b.height) * (1 + padding * 2));
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;

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
