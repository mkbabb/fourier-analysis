<script setup lang="ts">
import GlassDock from "@/components/ui/GlassDock.vue";
import DockPopover from "./DockPopover.vue";
import { Tooltip } from "@/components/ui/tooltip";
import { VIZ_COLORS } from "@/lib/colors";
import {
    Undo2,
    Redo2,
    Wand2,
    Minimize2,
    Trash2,
    Image,
    Eye,
    EyeOff,
    Magnet,
    RotateCcw,
    Save,
    Check,
} from "lucide-vue-next";

const props = defineProps<{
    canUndo: boolean;
    canRedo: boolean;
    canDelete: boolean;
    pointCount: number;
    showImageOverlay: boolean;
    showGhost?: boolean;
    magnetRadius: number;
    isSaved: boolean;
}>();

const emit = defineEmits<{
    undo: [];
    redo: [];
    smooth: [];
    simplify: [];
    delete: [];
    toggleOverlay: [];
    toggleGhost: [];
    "update:magnetRadius": [value: number];
    reset: [];
    save: [];
}>();
</script>

<template>
    <GlassDock :collapse-delay="2000" :start-collapsed="true" fit-content>
        <!-- Collapsed summary -->
        <template #collapsed>
            <div class="flex items-center gap-2">
                <Wand2 :size="18" class="shrink-0 text-foreground/50" />
                <span class="dock-badge">{{ pointCount }} pts</span>
                <Tooltip text="Save contour">
                    <button class="dock-icon-btn is-save" :class="{ saved: isSaved }" @click.stop="emit('save')">
                        <Check v-if="isSaved" :size="18" />
                        <Save v-else :size="18" />
                    </button>
                </Tooltip>
            </div>
        </template>

        <!-- Expanded controls -->
        <div class="flex items-center gap-2 w-full">
            <Tooltip text="Undo">
                <button class="dock-icon-btn" :disabled="!canUndo" @click="emit('undo')">
                    <Undo2 :size="20" />
                </button>
            </Tooltip>
            <Tooltip text="Redo">
                <button class="dock-icon-btn" :disabled="!canRedo" @click="emit('redo')">
                    <Redo2 :size="20" />
                </button>
            </Tooltip>

            <span class="dock-separator" />

            <Tooltip text="Smooth">
                <button class="dock-icon-btn is-amber" @click="emit('smooth')">
                    <Wand2 :size="20" />
                </button>
            </Tooltip>
            <Tooltip text="Simplify">
                <button class="dock-icon-btn is-sky" @click="emit('simplify')">
                    <Minimize2 :size="20" />
                </button>
            </Tooltip>
            <Tooltip text="Delete point">
                <button class="dock-icon-btn is-rose" :disabled="!canDelete" @click="emit('delete')">
                    <Trash2 :size="20" />
                </button>
            </Tooltip>

            <!-- Magnet popover with slider -->
            <DockPopover direction="up">
                <template #trigger>
                    <Magnet :size="20" :class="magnetRadius > 0 ? 'text-[hsl(var(--viz-fourier))]' : ''" />
                </template>
                <div class="magnet-popover-content">
                    <div class="flex items-center justify-between gap-3 px-1">
                        <span class="text-xs font-medium text-foreground whitespace-nowrap">Magnet</span>
                        <span class="text-xs fira-code text-muted-foreground tabular-nums">{{ magnetRadius }}</span>
                    </div>
                    <input
                        type="range" min="0" max="10" step="1"
                        :value="magnetRadius"
                        class="styled-slider w-full"
                        :style="{ '--progress': (magnetRadius / 10 * 100) + '%', '--slider-color': VIZ_COLORS.fourier }"
                        @input.stop="emit('update:magnetRadius', parseInt(($event.target as HTMLInputElement).value))"
                        @mousedown.stop
                        @pointerdown.stop
                        @change.stop
                    />
                </div>
            </DockPopover>

            <span class="dock-separator" />

            <!-- Overlay stack (ghost + image) -->
            <DockPopover direction="up">
                <template #trigger>
                    <Eye :size="20" />
                </template>
                <Tooltip text="Contour trace">
                    <button class="dock-icon-btn" :class="{ 'is-active': showGhost }" @click="emit('toggleGhost')">
                        <component :is="showGhost ? Eye : EyeOff" :size="20" />
                    </button>
                </Tooltip>
                <Tooltip text="Image overlay">
                    <button class="dock-icon-btn" :class="{ 'is-active': showImageOverlay }" @click="emit('toggleOverlay')">
                        <Image :size="20" />
                    </button>
                </Tooltip>
            </DockPopover>

            <Tooltip text="Reset to extraction">
                <button class="dock-icon-btn" @click="emit('reset')">
                    <RotateCcw :size="20" />
                </button>
            </Tooltip>

            <span class="dock-spacer" />
            <span class="dock-badge">{{ pointCount }} pts</span>

            <Tooltip text="Save contour">
                <button class="dock-icon-btn is-save" :class="{ saved: isSaved }" @click="emit('save')">
                    <Check v-if="isSaved" :size="20" />
                    <Save v-else :size="20" />
                </button>
            </Tooltip>
        </div>
    </GlassDock>
</template>

<style>
@import "./lib/dock-buttons.css";
</style>

<style scoped>
.magnet-popover-content {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    width: 9rem;
    padding: 0.375rem 0.5rem;
}
/* Force the range input to render at full width with visible height */
.magnet-popover-content :deep(input[type="range"]) {
    width: 100%;
    display: block;
    height: 16px;
    margin: 0;
}
</style>
