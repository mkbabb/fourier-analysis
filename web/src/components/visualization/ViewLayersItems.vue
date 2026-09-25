<script setup lang="ts">
/**
 * X.F.W14V.r1 — F-W14V.md addendum (h) item 1 (COHESION §0eb): the view-layer
 * ROWS, lifted out of `ViewLayersMenu.vue` so that one set of rows serves both
 * of its mounts: the View options menu on each dock (≥ sm on the editor dock,
 * every width on the canvas dock) and, below sm, the View options submenu
 * inside the editor dock's More editor tools menu. One state, one set of rows,
 * one order (UIA-F-79 standing). A row toggles without closing the menu.
 */
import { DropdownMenuCheckboxItem, DropdownMenuLabel } from "@mkbabb/glass-ui/menu";

defineProps<{
    showImageOverlay: boolean;
    showGhost: boolean;
}>();

const emit = defineEmits<{
    toggleImageOverlay: [];
    toggleGhost: [];
}>();

/** A row toggles its layer and keeps the menu open. */
function keepOpen(e: Event) {
    e.preventDefault();
}
</script>

<template>
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
</template>
