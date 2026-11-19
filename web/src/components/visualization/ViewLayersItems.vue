<script setup lang="ts">
/**
 * The layer rows: Picture, Outline, Line and Circles, each on its own, then
 * "Just the picture" (the drawn layers hidden, pressed again they return).
 * A row toggles its layer and keeps the menu open.
 */
import { CircleDashed, Focus, ImageIcon, Orbit, Spline } from "@lucide/vue";
import { DropdownMenuCheckboxItem, DropdownMenuSeparator } from "@mkbabb/glass-ui/menu";
import type { Layers } from "./lib/layers";

defineProps<{
    layers: Layers;
    justThePicture: boolean;
}>();

const emit = defineEmits<{
    toggle: [layer: keyof Layers];
    justThePicture: [];
}>();

/** A row toggles its layer and keeps the menu open. */
function keepOpen(e: Event) {
    e.preventDefault();
}
</script>

<template>
    <DropdownMenuCheckboxItem :model-value="layers.picture" @select="keepOpen" @update:model-value="emit('toggle', 'picture')">
        <ImageIcon aria-hidden="true" />
        <span>Picture</span>
    </DropdownMenuCheckboxItem>
    <DropdownMenuCheckboxItem :model-value="layers.outline" @select="keepOpen" @update:model-value="emit('toggle', 'outline')">
        <CircleDashed aria-hidden="true" />
        <span>Outline</span>
    </DropdownMenuCheckboxItem>
    <DropdownMenuCheckboxItem :model-value="layers.line" @select="keepOpen" @update:model-value="emit('toggle', 'line')">
        <Spline aria-hidden="true" />
        <span>Line</span>
    </DropdownMenuCheckboxItem>
    <DropdownMenuCheckboxItem :model-value="layers.circles" @select="keepOpen" @update:model-value="emit('toggle', 'circles')">
        <Orbit aria-hidden="true" />
        <span>Circles</span>
    </DropdownMenuCheckboxItem>
    <DropdownMenuSeparator />
    <DropdownMenuCheckboxItem :model-value="justThePicture" @select="keepOpen" @update:model-value="emit('justThePicture')">
        <Focus aria-hidden="true" />
        <span>Just the picture</span>
    </DropdownMenuCheckboxItem>
</template>
