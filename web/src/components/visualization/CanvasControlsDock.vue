<script setup lang="ts">
import { ref, watch } from "vue";
import {
    Maximize2, Pencil, Sigma, Upload, Eye, ImageIcon, Spline, } from "@lucide/vue";
import { Tooltip } from "@/components/ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@mkbabb/glass-ui/popover";
import { GlassDock, DockControl } from "@mkbabb/glass-ui/dock";

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
        <template v-if="!isEditing">
            <!-- View options popover (image overlay + contour trace) -->
            <Popover trigger="hover" keep-dock-open>
                <PopoverTrigger as-child>
                    <DockControl class="view-btn-wrap" aria-label="View options">
                        <Eye class="h-4.5 w-4.5" />
                        <span v-if="showImageOverlay || showGhost" class="view-dot" />
                    </DockControl>
                </PopoverTrigger>
                <PopoverContent side="top" align="center">
                    <div class="flex flex-col gap-1 p-1">
                        <Tooltip text="Image overlay">
                            <DockControl :active="showImageOverlay" @click="$emit('toggleImageOverlay')">
                                <ImageIcon :size="20" />
                            </DockControl>
                        </Tooltip>
                        <Tooltip text="Contour trace">
                            <DockControl :active="showGhost" @click="$emit('toggleGhost')">
                                <Spline :size="20" />
                            </DockControl>
                        </Tooltip>
                    </div>
                </PopoverContent>
            </Popover>

            <div class="dock-separator" />

            <!-- Publish -->
            <Tooltip v-if="hasContour" text="Publish to Gallery" side="bottom">
                <DockControl :active="publishing" @click="$emit('publish')">
                    <Upload class="h-4.5 w-4.5" :class="{ 'animate-pulse': publishing }" />
                </DockControl>
            </Tooltip>
            <!-- Equation -->
            <Tooltip v-if="hasData" text="Equation" side="bottom">
                <DockControl :active="showEquation" @click="$emit('toggleEquation')">
                    <Sigma class="h-4.5 w-4.5" />
                </DockControl>
            </Tooltip>

            <div class="dock-separator" />
        </template>

        <!-- Edit (always visible when contour exists) -->
        <Tooltip v-if="hasContour" text="Edit contour" side="bottom">
            <DockControl :active="isEditing" @click="$emit('toggleEdit')">
                <Pencil class="h-4.5 w-4.5" />
            </DockControl>
        </Tooltip>
        <!-- Fullscreen -->
        <Tooltip text="Fullscreen" side="bottom">
            <DockControl @click="$emit('toggleFullscreen')">
                <Maximize2 class="h-4.5 w-4.5" />
            </DockControl>
        </Tooltip>

        <template #collapsed>
            <Maximize2 class="h-4 w-4 opacity-70" />
            <Pencil class="h-3.5 w-3.5 opacity-40" />
        </template>
    </GlassDock>
</template>

<style scoped>
.dock-separator {
    width: 1px;
    height: 1.5rem;
    margin: 0 0.125rem;
    background: color-mix(in srgb, var(--foreground) 20%, transparent);
    flex-shrink: 0;
}

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
</style>

