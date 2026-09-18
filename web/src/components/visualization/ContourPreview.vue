<script setup lang="ts">
import { computed } from "vue";
import { type Point2D, closedSplinePath, contourBounds } from "@/lib/contourEditing";
import CollapsibleSection from "@/components/ui/CollapsibleSection.vue";

/** The authored framing of this preview; the editor's is its own. */
const PREVIEW_MARGIN = 0.1;

const props = defineProps<{
    points: Point2D[] | undefined;
}>();

const previewPath = computed(() => {
    const pts = props.points;
    if (!pts || pts.length < 3) return "";
    return closedSplinePath(pts);
});

/**
 * X.F.W4 · `fr-ContourPreview` row 40 — the bounding-box loop that used to sit
 * here was a byte-identical clone of `ContourEditorCanvas.vue:60-66` (row 33),
 * and it carried three defects the clone's twin did not: an X-derived pad spent
 * on both axes (row 7), no degenerate-extent floor (row 17) and no finite
 * screen (row 28-client). All three die with the extraction.
 */
const bounds = computed(() => contourBounds(props.points, PREVIEW_MARGIN));

/**
 * `null` bounds are UNRENDERABLE, and the component now says so instead of
 * emitting a viewBox the UA silently ignores — the whole of row 28-client's
 * "blanks in silence" mechanism.
 */
const previewViewBox = computed(() => bounds.value?.viewBox ?? "0 0 1 1");
</script>

<template>
    <div class="cartoon-card px-3 py-2">
        <CollapsibleSection title="Preview" subtitle="live contour shape" :default-open="true">
            <div class="flex items-center justify-center p-2">
                <!-- Row 28-client: an unrenderable point set used to emit an
                     invalid viewBox and blank the surface with no explanation.
                     It now says what it knows. -->
                <p v-if="!bounds" class="preview-empty">No contour to preview yet</p>
                <svg
                    v-else
                    :viewBox="previewViewBox"
                    preserveAspectRatio="xMidYMid meet"
                    class="preview-svg"
                >
                    <g transform="scale(1,-1)">
                        <path
                            :d="previewPath"
                            fill="none"
                            stroke="var(--contour-stroke)"
                            stroke-opacity="0.85"
                            stroke-width="2"
                            vector-effect="non-scaling-stroke"
                        />
                    </g>
                </svg>
            </div>
        </CollapsibleSection>
    </div>
</template>

<style scoped>
/* The contour stroke is the brand amber, taken from the semantic token rather
   than re-authored as a literal: the retired inline amber (hue 40, 90%, 55%)
   composited to 1.660:1 against light `--card`, while `--viz-amber` clears AA
   at both pins. The alpha stays on `stroke-opacity`, where the cascade — and a
   token audit — can still see the hue.

   The token is declared at each of the two contour surfaces' own roots because
   `ContourPreview` and `ContourEditorCanvas` have no shared ancestor — the
   editor mounts standalone under `FullscreenViewer` as well as beside this
   preview under `VisualizationView`. */
.preview-svg {
    --contour-stroke: var(--viz-amber);
    width: 160px;
    height: 160px;
    display: block;
}

.preview-empty {
    min-height: 160px;
    display: flex;
    align-items: center;
    color: var(--muted-foreground);
}
</style>
