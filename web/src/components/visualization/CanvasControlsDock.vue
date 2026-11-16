<script setup lang="ts">
/**
 * The workspace stage's floating dock (owner, 2026-11-15: "pages like the
 * quaran reader and fourier should have an additional floating bar ... which
 * is a collapsible glass-ui dock"): the canvas's own tools at the stage card's
 * top-right corner, folded to one glyph and opened by a press (`StageDock`),
 * a downward column on a phone.
 *
 * It holds the tools that act on the canvas, each in this one home: the view
 * layers (the background image, the original outline), Reset view (while the
 * drawing is zoomed or panned), Export frame, Fullscreen and the contour
 * editor. The page's own acts (Publish, the series panel) are the app dock's
 * (`WorkspaceTools.vue`); the editor's tools are the editor dock's, which no
 * longer carries a second copy of the view layers.
 *
 * Kept from the prior dock: UIA-F-79 (one labelled view-layers menu),
 * UIA-F-173 (the folded face marks only a view off the default), UIA-F-182
 * (one Export, which opens the export dialog), UIA-F-93 ⊕ F-244 (in the
 * takeover this dock is hosted there and Fullscreen is the way out), UIA-F-94
 * (the folded face is a neutral glyph that names no action).
 *
 * In the takeover it also hosts the page's own tools (`page-tools` slot),
 * outside the fold: the takeover covers the app dock that holds them.
 */
import { computed } from "vue";
import { Download, Ellipsis, Maximize2, Minimize2, Pencil, ScanSearch } from "@lucide/vue";
import { Tooltip } from "@/components/ui/tooltip";
import { DockControl, DockSeparator } from "@mkbabb/glass-ui/dock";
import { StatusDot } from "@mkbabb/glass-ui/status-dot";
import StageDock from "@/components/shared/StageDock.vue";
import ViewLayersMenu from "./ViewLayersMenu.vue";
import { isViewOffDefault } from "./composables/useViewState";

const props = defineProps<{
    isEditing: boolean;
    /** The stage is hosted in the fullscreen takeover (X.F.W14V.u1). */
    isFullscreen: boolean;
    showImageOverlay: boolean;
    showGhost: boolean;
    hasData: boolean;
    hasContour: boolean;
    /** The drawing is zoomed or panned off its fit. */
    viewMoved: boolean;
}>();

const emit = defineEmits<{
    toggleEdit: [];
    /** The control sets the state it shows (idempotent under a replayed click). */
    "update:isFullscreen": [value: boolean];
    toggleImageOverlay: [];
    toggleGhost: [];
    exportFrame: [];
    resetView: [];
}>();

const viewOffDefault = computed(() =>
    isViewOffDefault({ overlay: props.showImageOverlay, ghost: props.showGhost }),
);
</script>

<template>
    <StageDock label="Canvas tools">
        <template #collapsed>
            <span class="summary-glyph-wrap">
                <Ellipsis class="dock-summary-glyph" aria-hidden="true" />
                <StatusDot v-if="viewOffDefault" class="view-dot" state="active" size="sm" motion="off" />
            </span>
        </template>

        <template #default="{ hold, column }">
            <!-- UIA-F-76 (kept): the menu opens below its trigger, into the canvas. -->
            <ViewLayersMenu
                side="bottom"
                :show-image-overlay="showImageOverlay"
                :show-ghost="showGhost"
                @toggle-image-overlay="emit('toggleImageOverlay')"
                @toggle-ghost="emit('toggleGhost')"
                @update:open="hold"
            />
            <Tooltip v-if="!isEditing && hasData && viewMoved" text="Reset view" :side="column ? 'left' : 'bottom'">
                <DockControl aria-label="Reset view" @click="emit('resetView')">
                    <ScanSearch />
                </DockControl>
            </Tooltip>
            <Tooltip v-if="!isEditing && hasData" text="Export frame" :side="column ? 'left' : 'bottom'">
                <DockControl aria-label="Export frame" @click="emit('exportFrame')">
                    <Download />
                </DockControl>
            </Tooltip>
            <Tooltip :text="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'" :side="column ? 'left' : 'bottom'">
                <DockControl :aria-label="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'" @click="emit('update:isFullscreen', !isFullscreen)">
                    <Minimize2 v-if="isFullscreen" />
                    <Maximize2 v-else />
                </DockControl>
            </Tooltip>
        </template>

        <!-- X.F.W11 R-close-1 (kept): Edit contour is the editor's one door in
             AND out, so it stands outside the fold, present folded and open. -->
        <!-- In the fullscreen takeover the app dock is covered, so the page's
             own tools (Publish, the series panel; the host's `page-tools` slot)
             stand outside the fold here, before the editor's door: reachable
             folded and open, without leaving the takeover. -->
        <template #persistent-end="{ column }">
            <template v-if="isFullscreen && $slots['page-tools']">
                <slot name="page-tools" :column="column" />
                <DockSeparator />
            </template>
            <Tooltip v-if="hasContour" text="Edit contour" :side="column ? 'left' : 'bottom'">
                <DockControl aria-label="Edit contour" :active="isEditing" @click="emit('toggleEdit')">
                    <Pencil />
                </DockControl>
            </Tooltip>
        </template>
    </StageDock>
</template>

<style scoped>
.summary-glyph-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

/* X.F.W14U.d — OA-68: the dot sits just outside the glyph's top-right corner,
   on the plate, never on the glyph. */
.summary-glyph-wrap > .view-dot {
    position: absolute;
    bottom: 100%;
    left: 100%;
    pointer-events: none;
}

/* X.F.W4 — the folded face's glyph reads the dock's glyph rung and the
   substrate's muted-glyph dial. */
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
