<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Download, Ellipsis, Maximize2, Minimize2, Pencil, Sigma, Upload } from "@lucide/vue";
import { Tooltip } from "@/components/ui/tooltip";
import { GlassDock, DockControl, DockSeparator } from "@mkbabb/glass-ui/dock";
import { StatusDot } from "@mkbabb/glass-ui/status-dot";
import ViewLayersMenu from "./ViewLayersMenu.vue";
import { isViewOffDefault } from "./composables/useViewState";

const props = defineProps<{
    isEditing: boolean;
    /** The stage is hosted in the fullscreen takeover (X.F.W14V.u1). */
    isFullscreen: boolean;
    showImageOverlay: boolean;
    showGhost: boolean;
    showEquation: boolean;
    hasData: boolean;
    hasContour: boolean;
    publishing: boolean;
}>();

const emit = defineEmits<{
    toggleEdit: [];
    /** The control sets the state it shows (idempotent under a replayed click). */
    "update:isFullscreen": [value: boolean];
    toggleEquation: [];
    toggleImageOverlay: [];
    toggleGhost: [];
    publish: [];
    exportFrame: [];
    "update:expanded": [value: boolean];
}>();

const dockRef = ref<InstanceType<typeof GlassDock>>();

// UIA-F-173: the collapsed face carries the view mark only off the default.
const viewOffDefault = computed(() =>
    isViewOffDefault({ overlay: props.showImageOverlay, ghost: props.showGhost }),
);

// In-band coupling (W2.E): surface the dock's expanded state to the parent
// (VisualizationView, which centres the anchor on expand) via a typed event
// rather than an out-of-band `defineExpose` the parent reaches into.
watch(
    () => dockRef.value?.expanded,
    (value) => emit("update:expanded", value ?? false),
);
</script>

<template>
    <GlassDock ref="dockRef" fit-content>
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
            <!-- X.F.W14V.u1 — UIA-F-79 ⊕ F-77 (consumer) ⊕ F-173: the view layers are
                 ONE menu, mounted by both docks (`ViewLayersMenu.vue`): labelled
                 CheckboxItems where a popover held two unlabelled icons. It opens
                 down into the canvas from this top dock (UIA-F-76 kept). -->
            <ViewLayersMenu
                side="bottom"
                :show-image-overlay="showImageOverlay"
                :show-ghost="showGhost"
                @toggle-image-overlay="emit('toggleImageOverlay')"
                @toggle-ghost="emit('toggleGhost')"
            />

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
            <!-- X.F.W14V.u1 — UIA-F-182: the one Export, on the canvas it exports,
                 and it always opens the export dialog (inline and in the
                 fullscreen takeover alike: the takeover hosts this same dock). -->
            <Tooltip v-if="hasData" text="Export frame" side="bottom">
                <DockControl aria-label="Export frame" @click="$emit('exportFrame')">
                    <Download />
                </DockControl>
            </Tooltip>

            <DockSeparator />
        </template>

        <!-- Fullscreen. X.F.W14V.u1 — UIA-F-93 ⊕ F-244: the takeover hosts this
             dock, so in fullscreen this control is the way out (Minimize, "Exit
             fullscreen", with its tooltip); the free-floating Exit Button is gone. -->
        <Tooltip :text="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'" side="bottom">
            <DockControl :aria-label="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'" @click="$emit('update:isFullscreen', !isFullscreen)">
                <Minimize2 v-if="isFullscreen" />
                <Maximize2 v-else />
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
            <!-- X.F.W14U.vdock — UIA-F-94: the resting face wears a neutral glyph.
                 The Maximize arrows it wore are the Fullscreen action's own glyph,
                 so at 390 the face read as "Fullscreen" while a tap on it expanded
                 the dock (or, beside the persistent Edit, toggled editing). A
                 summary names no action it does not perform. -->
            <span class="summary-glyph-wrap">
                <Ellipsis class="dock-summary-glyph" aria-hidden="true" />
                <StatusDot v-if="viewOffDefault" class="view-dot" state="active" size="sm" motion="off" />
            </span>
        </template>

        <!--
          X.F.W11 R-close-1 — Edit contour is the dock's one PERSISTENT control.
          It is the editor's only door in AND out, and the comment it carried
          ("always visible when contour exists") was false: it sat in the
          default slot, which GlassDock hides (`visibility:hidden`) whenever the
          dock rests collapsed, while the summary drew a non-interactive Pencil
          that advertised it. After an in-editor save hands focus to the
          editor's Save, the canvas dock settles collapsed and the pressed
          toggle had no reachable face. The producer's `persistent-end` slot
          (rendered outside both layers, present collapsed and expanded) is the
          idiom for exactly this control; the summary's Pencil retires with it
          (one home per control), and `:active` keeps the pressed paint.
        -->
        <template #persistent-end>
            <Tooltip v-if="hasContour" text="Edit contour" side="bottom">
                <DockControl aria-label="Edit contour" :active="isEditing" @click="$emit('toggleEdit')">
                    <Pencil />
                </DockControl>
            </Tooltip>
        </template>
    </GlassDock>
</template>

<style scoped>
/* X.F.W4 · SP-6 / `fr-EditorControlsDock D-9 · L-8` — this dock's copy of the
   shadowing `.dock-separator` rule, deleted with its twin. Its `0 0.125rem`
   margin against the sibling's `0` was the drift that made two docks on one
   canvas paint two different hairline rhythms; `<DockSeparator>` supplies one
   rhythm, one tint and `role="separator"` to both. */

/* X.F.W14V.u1 — UIA-F-173: the hand-rolled amber literal retired for glass's
   StatusDot (its own size, tone and paint); what stays here is placement. The
   View options control places its own mark (`ViewLayersMenu.vue`). */
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

/* X.F.W14U.d — OA-68, the consumer's crowding. The shared `.view-dot` offsets
   are sized for the 40px control, where they land on the control's corner, clear
   of its glyph. Here the wrap is only the glyph's box, so the same offsets put
   the dot on the Maximize glyph's arrow tip (the owner's side-dock frame). On
   the resting face the dot sits just outside the glyph's top-right corner, and
   it stays on the plate. A reserved badge seat is glass's (SIDE-DOCK-EDGE,
   O-67 R-3), adopted at the landing repin. */
.summary-glyph-wrap > .view-dot {
    position: absolute;
    bottom: 100%;
    left: 100%;
    pointer-events: none;
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
</style>

