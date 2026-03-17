<script setup lang="ts">
import { ref, watch, computed } from "vue";
import {
    Maximize2,
    Pencil,
    Sigma,
    Upload,
    Eye,
    ImageIcon,
    Check,
    Spline,
} from "lucide-vue-next";
import { Tooltip } from "@/components/ui/tooltip";
import GlassDock from "@/components/ui/GlassDock.vue";
import {
    DropdownMenuRoot,
    DropdownMenuTrigger,
    DropdownMenuPortal,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuItemIndicator,
} from "reka-ui";

const props = defineProps<{
    isEditing: boolean;
    showImageOverlay: boolean;
    showGhost: boolean;
    showEquation: boolean;
    hasData: boolean;
    hasContour: boolean;
    publishing: boolean;
}>();

defineEmits<{
    toggleEdit: [];
    toggleFullscreen: [];
    toggleEquation: [];
    toggleImageOverlay: [];
    toggleGhost: [];
    publish: [];
}>();

const dockRef = ref<InstanceType<typeof GlassDock>>();
const overlayMenuOpen = ref(false);

// Keep the GlassDock open while the portaled dropdown is visible
watch(overlayMenuOpen, (open) => {
    if (open) dockRef.value?.keepOpen();
    else dockRef.value?.release();
});

const dockExpanded = computed(() => dockRef.value?.expanded ?? false);
defineExpose({ dockExpanded });
</script>

<template>
    <GlassDock ref="dockRef" fit-content :start-collapsed="true">
        <template v-if="!isEditing">
            <!-- View options dropdown (image overlay + contour trace) -->
            <DropdownMenuRoot v-model:open="overlayMenuOpen">
                <DropdownMenuTrigger as-child>
                    <Tooltip text="View options" side="bottom">
                        <button
                            class="dock-icon-btn"
                            :class="{ 'is-active': showImageOverlay || showGhost }"
                        >
                            <span class="view-btn-wrap">
                                <Eye class="h-4.5 w-4.5" />
                                <span
                                    v-if="showImageOverlay || showGhost"
                                    class="view-dot"
                                />
                            </span>
                        </button>
                    </Tooltip>
                </DropdownMenuTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuContent
                        class="overlay-dropdown"
                        :side-offset="8"
                        align="center"
                    >
                        <DropdownMenuCheckboxItem
                            class="overlay-dropdown-item"
                            :checked="showImageOverlay"
                            @select.prevent="$emit('toggleImageOverlay')"
                        >
                            <ImageIcon class="overlay-item-icon" />
                            <span>Image Overlay</span>
                            <DropdownMenuItemIndicator class="overlay-check">
                                <Check class="h-3.5 w-3.5" />
                            </DropdownMenuItemIndicator>
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            class="overlay-dropdown-item"
                            :checked="showGhost"
                            @select.prevent="$emit('toggleGhost')"
                        >
                            <Spline class="overlay-item-icon" />
                            <span>Contour Trace</span>
                            <DropdownMenuItemIndicator class="overlay-check">
                                <Check class="h-3.5 w-3.5" />
                            </DropdownMenuItemIndicator>
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenuPortal>
            </DropdownMenuRoot>

            <div class="dock-separator" />

            <!-- Publish -->
            <Tooltip v-if="hasContour" text="Publish to Gallery" side="bottom">
                <button class="dock-icon-btn" :class="{ 'is-active': publishing }" @click="$emit('publish')">
                    <Upload class="h-4.5 w-4.5" :class="{ 'animate-pulse': publishing }" />
                </button>
            </Tooltip>
            <!-- Equation -->
            <Tooltip v-if="hasData" text="Equation" side="bottom">
                <button class="dock-icon-btn" :class="{ 'is-active': showEquation }" @click="$emit('toggleEquation')">
                    <Sigma class="h-4.5 w-4.5" />
                </button>
            </Tooltip>

            <div class="dock-separator" />
        </template>

        <!-- Edit (always visible when contour exists) -->
        <Tooltip v-if="hasContour" text="Edit contour" side="bottom">
            <button class="dock-icon-btn" :class="{ 'is-active': isEditing }" @click="$emit('toggleEdit')">
                <Pencil class="h-4.5 w-4.5" />
            </button>
        </Tooltip>
        <!-- Fullscreen -->
        <Tooltip text="Fullscreen" side="bottom">
            <button class="dock-icon-btn" @click="$emit('toggleFullscreen')">
                <Maximize2 class="h-4.5 w-4.5" />
            </button>
        </Tooltip>

        <template #collapsed>
            <Maximize2 class="h-4 w-4 opacity-70" />
            <Pencil class="h-3.5 w-3.5 opacity-40" />
        </template>
    </GlassDock>
</template>

<style>
@import "./lib/dock-buttons.css";
</style>

<style scoped>
.dock-icon-btn {
    width: 2.5rem;
    height: 2.5rem;
}

.dock-separator {
    height: 1.5rem;
    margin: 0 0.125rem;
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

<!-- Global style for portaled overlay dropdown -->
<style>
.overlay-dropdown {
    z-index: 100;
    min-width: 10rem;
    padding: 0.375rem;
    background: color-mix(in srgb, hsl(var(--popover)) 85%, transparent);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1.5px solid hsl(var(--border) / 0.4);
    border-radius: 0.625rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    animation: nav-dropdown-in 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.overlay-dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4375rem 0.625rem;
    border-radius: 0.4375rem;
    border: none;
    background: none;
    color: hsl(var(--foreground) / 0.65);
    font-family: var(--font-serif);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.12s ease, color 0.12s ease;
    outline: none;
}

.overlay-dropdown-item:hover,
.overlay-dropdown-item[data-highlighted] {
    background: hsl(var(--foreground) / 0.06);
    color: hsl(var(--foreground));
}

.overlay-dropdown-item[data-state="checked"] {
    color: hsl(var(--foreground));
}

.overlay-item-icon {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
}

.overlay-check {
    margin-left: auto;
    color: var(--viz-amber);
    display: inline-flex;
    align-items: center;
}
</style>
