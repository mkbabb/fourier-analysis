<script setup lang="ts">
import { ref, watch } from "vue";
import {
    Maximize2, Pencil, Sigma, Upload, Eye, ImageIcon, Spline, } from "@lucide/vue";
import { Tooltip } from "@/components/ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@mkbabb/glass-ui/popover";
import { GlassDock, DockControl, DockSeparator } from "@mkbabb/glass-ui/dock";

defineProps<{
    isEditing: boolean;
    showImageOverlay: boolean;
    showGhost: boolean;
    showEquation: boolean;
    hasData: boolean;
    hasContour: boolean;
    publishing: boolean;
}>();

const emit = defineEmits<{
    toggleEdit: [];
    toggleFullscreen: [];
    toggleEquation: [];
    toggleImageOverlay: [];
    toggleGhost: [];
    publish: [];
    "update:expanded": [value: boolean];
}>();

const dockRef = ref<InstanceType<typeof GlassDock>>();

// In-band coupling (W2.E): surface the dock's expanded state to the parent
// (VisualizationView, which centres the anchor on expand) via a typed event
// rather than an out-of-band `defineExpose` the parent reaches into.
watch(
    () => dockRef.value?.expanded,
    (value) => emit("update:expanded", value ?? false),
);
</script>

<template>
    <GlassDock ref="dockRef" fit-content :start-collapsed="true">
        <!--
          X.F.W4 · SP-9 — `fr-CanvasControlsDock D-5 / L-7 / C-7` (+D-13/D-14) ⊕
          `fr-EditorControlsDock D-10 / L-4`: BOTH icon-size idioms are deleted,
          in both docks, in one edit — because they are inverse failures of the
          same cascade and curing one alone re-states the divergence.

          This file pinned its glyphs with utility CLASSES (`h-4.5 w-4.5`),
          which live in `@layer utilities` and therefore BEAT the producer's
          `@layer components` rule `.dock-icon-button > svg { width:
          var(--dock-icon-glyph) }`. The pin was real, and it froze the glyph
          out of the `--dock-scale` ladder — including the coarse-pointer
          re-declaration of `--dock-scale` AND `--dock-icon-glyph` on
          `.glass-dock[data-size]`, so on touch the glyph-to-plate ratio sat at
          0.385 against the system's 0.50. The sibling used `:size="20"`
          presentation attributes, which LOSE to the same rule and did nothing
          at 14 of 15 sites. Two docks over one canvas, four unrelated glyph
          sizes, and the author demonstrably knew the winning idiom — it is in
          the file next door. Neither idiom survives; the producer's rung
          governs both docks, which is what makes them agree.
        -->
        <template v-if="!isEditing">
            <!-- View options popover (image overlay + contour trace) -->
            <Popover trigger="hover" keep-dock-open>
                <PopoverTrigger as-child>
                    <DockControl class="view-btn-wrap" aria-label="View options">
                        <Eye />
                        <span v-if="showImageOverlay || showGhost" class="view-dot" />
                    </DockControl>
                </PopoverTrigger>
                <PopoverContent side="top" align="center">
                    <div class="flex flex-col gap-1 p-1">
                        <Tooltip text="Image overlay">
                            <DockControl aria-label="Image overlay" :active="showImageOverlay" @click="$emit('toggleImageOverlay')">
                                <ImageIcon />
                            </DockControl>
                        </Tooltip>
                        <Tooltip text="Contour trace">
                            <DockControl aria-label="Contour trace" :active="showGhost" @click="$emit('toggleGhost')">
                                <Spline />
                            </DockControl>
                        </Tooltip>
                    </div>
                </PopoverContent>
            </Popover>

            <DockSeparator />

            <!-- Publish -->
            <Tooltip v-if="hasContour" text="Publish to Gallery" side="bottom">
                <DockControl aria-label="Publish to Gallery" :active="publishing" @click="$emit('publish')">
                    <Upload :class="{ 'animate-pulse': publishing }" />
                </DockControl>
            </Tooltip>
            <!-- Equation -->
            <Tooltip v-if="hasData" text="Equation" side="bottom">
                <DockControl aria-label="Equation" :active="showEquation" @click="$emit('toggleEquation')">
                    <Sigma />
                </DockControl>
            </Tooltip>

            <DockSeparator />
        </template>

        <!-- Edit (always visible when contour exists) -->
        <Tooltip v-if="hasContour" text="Edit contour" side="bottom">
            <DockControl aria-label="Edit contour" :active="isEditing" @click="$emit('toggleEdit')">
                <Pencil />
            </DockControl>
        </Tooltip>
        <!-- Fullscreen -->
        <Tooltip text="Fullscreen" side="bottom">
            <DockControl aria-label="Fullscreen" @click="$emit('toggleFullscreen')">
                <Maximize2 />
            </DockControl>
        </Tooltip>

        <!--
          X.F.W4 · SP-5 — `fr-CanvasControlsDock M-2` ⊕ `fr-EditorControlsDock B-2`,
          THE INVERSION LOCK. M-2's booked consumer cure was "focusable summary
          content"; at 8.0.0 that would now be the WRONG edit, and the sibling
          record proves why — it is exactly the shape that destroys focus there.
          glass-ui 8.0.0 makes the summary layer itself the disclosure
          (`role="button"` + `tabindex="0"` + `aria-label="Expand dock"` +
          `aria-expanded`/`aria-controls`, Enter/Space expanding and handing
          focus into the full layer), so the keyboard entry M-2 filed as absent
          now exists and this slot's correct content is precisely what it
          already is: NON-interactive. The consumer arm is therefore the OTHER
          half of the row pair — D-9/C-15 ⊕ L-22: the summary must stop lying.

          It advertised a fixed Pencil while Edit is `v-if="hasContour"` and the
          dock mounts during compute-before-contour (`hasData ∋ computing`), so
          `:start-collapsed="true"` made an over-promising pill the first-time
          user's first state, and none of the seven reactive props reached the
          resting face — which is also why the view-dot vanished in the dock's
          second state. Each glyph is now conditioned on the state it stands
          for, and the view-dot rides the summary too. M-7's token leg rides
          here: the two hard-coded opacity utilities (the file's only opacities,
          over live-canvas glass) become the substrate's muted-glyph dial.
        -->
        <template #collapsed>
            <span class="summary-glyph-wrap">
                <Maximize2 class="dock-summary-glyph" aria-hidden="true" />
                <span v-if="showImageOverlay || showGhost" class="view-dot" />
            </span>
            <Pencil
                v-if="hasContour"
                class="dock-summary-glyph"
                :class="{ 'is-editing': isEditing }"
                aria-hidden="true"
            />
        </template>
    </GlassDock>
</template>

<style scoped>
/* X.F.W4 · SP-6 / `fr-EditorControlsDock D-9 · L-8` — this dock's copy of the
   shadowing `.dock-separator` rule, deleted with its twin. Its `0 0.125rem`
   margin against the sibling's `0` was the drift that made two docks on one
   canvas paint two different hairline rhythms; `<DockSeparator>` supplies one
   rhythm, one tint and `role="separator"` to both. */

.view-btn-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.view-dot {
    position: absolute;
    top: -1px;
    right: -3px;
    width: 6px;
    height: 6px;
    border-radius: 9999px;
    background: var(--viz-amber);
    box-shadow: 0 0 4px color-mix(in srgb, var(--viz-amber) 60%, transparent);
}

/* X.F.W4 · `fr-CanvasControlsDock` L-22 + M-7 — the resting face's glyphs read
   the dock's own glyph rung and the substrate's muted-glyph dial. The two
   literal opacity utilities they replace (`opacity-70`/`opacity-40`, the file's
   only opacities) put a 14px 40%-opacity glyph over live-canvas glass; the dial
   is one authority for every muted glyph in the system, and the size now tracks
   `--dock-scale` — including its coarse-pointer re-declaration, which the
   utilities froze out. */
.summary-glyph-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.dock-summary-glyph {
    width: var(--dock-icon-glyph);
    height: var(--dock-icon-glyph);
    color: color-mix(
        in srgb,
        var(--foreground) calc(var(--opacity-icon-muted) * 100%),
        transparent
    );
}

/* The resting face tells the truth about the state it is resting in: an
   in-progress edit reads at full strength, not as a muted affordance. */
.dock-summary-glyph.is-editing {
    color: var(--foreground);
}
</style>

