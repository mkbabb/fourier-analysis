<script setup lang="ts">
import { computed } from "vue";
import { type Point2D, closedSplinePath } from "@/lib/contourEditing";
import { Collapsible } from "@/components/ui/collapsible";

const props = defineProps<{
    points: Point2D[] | undefined;
}>();

const previewPath = computed(() => {
    const pts = props.points;
    if (!pts || pts.length < 3) return "";
    return closedSplinePath(pts);
});

const previewViewBox = computed(() => {
    const pts = props.points;
    if (!pts || pts.length < 2) return "0 0 1 1";
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of pts) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    }
    const pad = (maxX - minX) * 0.1;
    // Flip Y: SVG viewBox uses negative Y since we scale(1,-1) inside
    return `${minX - pad} ${-(maxY + pad)} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
});
</script>

<template>
    <div class="cartoon-card px-3 py-2">
        <Collapsible title="Preview" subtitle="live contour shape" :default-open="true">
            <div class="flex items-center justify-center p-2">
                <svg
                    :viewBox="previewViewBox"
                    preserveAspectRatio="xMidYMid meet"
                    class="preview-svg"
                >
                    <g transform="scale(1,-1)">
                        <path
                            :d="previewPath"
                            fill="none"
                            stroke="hsl(40 90% 55% / 0.85)"
                            stroke-width="2"
                            vector-effect="non-scaling-stroke"
                        />
                    </g>
                </svg>
            </div>
        </Collapsible>
    </div>
</template>

<style scoped>
.preview-svg {
    width: 160px;
    height: 160px;
    display: block;
}
</style>
