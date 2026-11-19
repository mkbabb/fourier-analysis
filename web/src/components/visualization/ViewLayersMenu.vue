<script setup lang="ts">
/**
 * The layers control: one glass DropdownMenu of labelled CheckboxItems behind
 * a DockTrigger (UIA-F-79: one control, one set of rows, one order). Each
 * row shows its own state, so the trigger carries no mark. Its glyph is the
 * stacked sheets of layers (the eye named no layer).
 */
import { Layers as LayersIcon } from "@lucide/vue";
import { DockTrigger } from "@mkbabb/glass-ui/dock-trigger";
import { DropdownMenu, DropdownMenuContent } from "@mkbabb/glass-ui/menu";
import ViewLayersItems from "./ViewLayersItems.vue";
import type { Layers } from "./lib/layers";

defineProps<{
    layers: Layers;
    justThePicture: boolean;
    /** The dock's edge: a top dock opens down into the canvas, a bottom dock up. */
    side: "top" | "bottom";
}>();

const emit = defineEmits<{
    toggle: [layer: keyof Layers];
    justThePicture: [];
    "update:open": [open: boolean];
}>();
</script>

<template>
    <DropdownMenu :modal="false" @update:open="emit('update:open', $event)">
        <DockTrigger for="dropdown" aria-label="Layers">
            <LayersIcon />
        </DockTrigger>
        <DropdownMenuContent :side="side" align="end" :side-offset="8">
            <ViewLayersItems
                :layers="layers"
                :just-the-picture="justThePicture"
                @toggle="emit('toggle', $event)"
                @just-the-picture="emit('justThePicture')"
            />
        </DropdownMenuContent>
    </DropdownMenu>
</template>
