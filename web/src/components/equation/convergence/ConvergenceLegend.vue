<script setup lang="ts">
import { FadingScroll } from "@mkbabb/glass-ui/fading-scroll";
import { spectrumColor, type TrigHarmonic } from "@/lib/equation/harmonics";

defineProps<{
    harmonics: TrigHarmonic[];
    hoveredCurve: string | null;
    /** UIA-F-201 — the series' variable (the equation's), one across the page. */
    variable?: string;
}>();

const emit = defineEmits<{
    hover: [key: string];
    leave: [];
}>();
</script>

<template>
    <!-- `D-7` ⊕ `FR-EQR-23` — ONE adoption, two records. `scrollbar-width: thin`
         was the ENTIRE overflow affordance on a column that routinely overflows
         (one entry per harmonic, up to the UI's 100), and `M-R2`'s ordering lock
         is discharged by the same edit: the producer's port ships `tabindex="0"`
         and `role="region"` when named, so the `scrollable-region-focusable`
         finding cannot fire ahead of the hover findings on this route. -->
    <FadingScroll
        v-if="harmonics.length"
        axis="y"
        aria-label="Curve legend"
        class="legend-overlay glass-wash"
    >
        <div class="legend-entry" :class="{ 'is-hovered': hoveredCurve === 'sum' }"
            @pointerenter="emit('hover', 'sum')" @pointerleave="emit('leave')">
            <span class="legend-dot legend-dot--golden" />
            <span class="legend-label legend-label--golden">Sum</span>
        </div>
        <div class="legend-entry" :class="{ 'is-hovered': hoveredCurve === 'original' }"
            @pointerenter="emit('hover', 'original')" @pointerleave="emit('leave')">
            <span class="legend-dot legend-dot--dashed" />
            <span class="legend-label">f({{ variable ?? "x" }})</span>
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
    </FadingScroll>
</template>

<style scoped>
@reference "tailwindcss";

/* The port's own `overflow-y` / `scrollbar-width` belong to `<FadingScroll>`
   now; what stays here is placement, plate and rhythm. */
/* X.F.W14U.eq — UIA-F-205: the legend is the plot's second cell (its own
   gutter), never an overlay on the curves. */
.legend-overlay {
    @apply pointer-events-auto;
    flex: none;
    align-self: flex-start;
    max-height: 100%;
    padding: 0.5rem;
    min-width: 5.5rem;
}
.legend-entry + .legend-entry {
    margin-top: 2px;
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
    background: var(--viz-amber);
    box-shadow: 0 0 4px color-mix(in srgb, var(--viz-amber) 40%, transparent);
}
.legend-dot--dashed {
    background: transparent;
    border: 2px dashed rgba(180, 180, 180, 0.6);
}

.legend-label {
    @apply select-none;
    font-family: "Fira Code", monospace;
    color: var(--muted-foreground);
    font-size: var(--type-caption);
    line-height: var(--type-leading-caption);
}
.legend-label--golden {
    color: var(--viz-amber);
    font-weight: 600;
}
</style>
