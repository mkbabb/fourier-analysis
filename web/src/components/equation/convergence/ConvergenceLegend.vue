<script setup lang="ts">
import { FadingScroll } from "@mkbabb/glass-ui/fading-scroll";
import { spectrumColor, type TrigHarmonic } from "@/lib/equation/harmonics";

defineProps<{
    harmonics: TrigHarmonic[];
    hoveredCurve: string | null;
    /** UIA-F-201 — the series' variable (the equation's), one across the page. */
    variable?: string;
    /** X-DS pass 2 · DS-F2-C9: a narrow plot — one wrapped row under the
     *  curves, no plate (the hue dots and labels are kept). */
    wrapped?: boolean;
    /** X-DS pass 4 · DS-F4-C7: how many harmonics the plot has drawn so far
     *  (the timeline's N); entries past it are named but not yet on screen. */
    drawn?: number;
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
        class="legend-overlay"
        :class="wrapped ? 'legend-overlay--wrapped' : 'legend-overlay--column'"
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
        <div v-if="!wrapped" class="legend-divider" />
        <div
            v-for="(h, i) in harmonics" :key="h.k"
            class="legend-entry"
            :class="{ 'is-hovered': hoveredCurve === `h-${i}`, 'is-undrawn': drawn != null && i >= drawn }"
            @pointerenter="emit('hover', `h-${i}`)"
            @pointerleave="emit('leave')"
        >
            <span class="legend-dot legend-dot--harmonic" :style="{ '--legend-hue': spectrumColor(i, harmonics.length) }" />
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
/* X-DS pass 4 · DS-F4-C7: beside the plot the legend is plate-less too (the
   DS-F2-C9 wrapped legend's idiom), set off from the curves by one hairline
   rule, not a glass plate inside the plot's plate. */
.legend-overlay--column {
    border-inline-start: 1px solid var(--border);
}
.legend-overlay--wrapped {
    display: flex;
    flex-wrap: wrap;
    align-self: stretch;
    min-width: 0;
    max-height: 4.5rem;
    padding: 0;
    column-gap: 0.25rem;
}
.legend-overlay--wrapped .legend-entry + .legend-entry {
    margin-top: 0;
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
/* X-DS pass 1 · F1-10 — the flat amber dot; its glow is deleted. */
.legend-dot--golden {
    background: var(--viz-amber);
}
.legend-dot--dashed {
    background: transparent;
    border: 2px dashed rgba(180, 180, 180, 0.6);
}

.legend-label {
    @apply select-none;
    font-family: var(--font-mono);
    color: var(--muted-foreground);
    font-size: var(--type-caption);
    line-height: var(--type-leading-caption);
}
/* DS-F4-C7: a drawn harmonic is named in full ink; one the sweep has not
   reached yet keeps the muted ink and a hollow dot (its hue as a ring). */
.legend-entry:not(.is-undrawn) .legend-label {
    color: var(--foreground);
}
.legend-dot--harmonic {
    background: var(--legend-hue);
}
.legend-entry.is-undrawn .legend-dot--harmonic {
    background: transparent;
    border: 1.5px solid var(--legend-hue);
}
.legend-label--golden {
    color: var(--viz-amber);
    font-weight: 600;
}
</style>
