<script setup lang="ts">
/**
 * X.F.W14V.u1 — UIA-F-79 ⊕ F-77 (consumer half) ⊕ F-173: the ONE view-layers
 * control, mounted by both docks over the same canvas.
 *
 * The canvas dock carried a "View options" popover (Image overlay → Contour
 * trace as two unlabelled 40 px icons on a 336×118 plate, labels only in
 * tooltips, an amber dot), while the editor dock carried the same two layers
 * under another name and order. One state, one control: a glass DropdownMenu of
 * labelled CheckboxItems behind a DockTrigger, the same name, rows and order on
 * both docks. A row toggles without closing the menu.
 *
 * The mark (F-173) says only what is off the default (`VIEW_DEFAULTS`), and it
 * is glass's StatusDot on this control, not a hand-rolled literal. The anchor
 * itself is glass's DockTrigger (O-59 standing).
 */
import { computed } from "vue";
import { Eye } from "@lucide/vue";
import { DockTrigger } from "@mkbabb/glass-ui/dock";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
} from "@mkbabb/glass-ui/menu";
import { StatusDot } from "@mkbabb/glass-ui/status-dot";
import { isViewOffDefault } from "./composables/useViewState";

const props = defineProps<{
    showImageOverlay: boolean;
    showGhost: boolean;
    /** The dock's edge: a top dock opens down into the canvas, a bottom dock up. */
    side: "top" | "bottom";
}>();

const emit = defineEmits<{
    toggleImageOverlay: [];
    toggleGhost: [];
}>();

const offDefault = computed(() =>
    isViewOffDefault({ overlay: props.showImageOverlay, ghost: props.showGhost }),
);

/** A row toggles its layer and keeps the menu open. */
function keepOpen(e: Event) {
    e.preventDefault();
}
</script>

<template>
    <DropdownMenu :modal="false">
        <DockTrigger for="dropdown" class="view-layers-trigger" aria-label="View options">
            <!-- X.F.W14V.u4 — UIA-F-146: no Tooltip around the bare SVG glyph (never
                 focusable); the trigger's aria-label names it. -->
            <Eye />
            <StatusDot v-if="offDefault" class="view-dot" state="active" size="sm" motion="off" />
        </DockTrigger>
        <DropdownMenuContent :side="side" align="end" :side-offset="8">
            <DropdownMenuLabel>View layers</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
                :model-value="showImageOverlay"
                @select="keepOpen"
                @update:model-value="emit('toggleImageOverlay')"
            >
                Image overlay
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
                :model-value="showGhost"
                @select="keepOpen"
                @update:model-value="emit('toggleGhost')"
            >
                Contour trace
            </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>

<style scoped>
/* Placement only: the mark sits on the control's corner, clear of its glyph. */
.view-layers-trigger {
    position: relative;
}

.view-dot {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    pointer-events: none;
}
</style>
