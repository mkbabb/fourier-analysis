<script setup lang="ts">
import { computed } from "vue";
import { Slider } from "@mkbabb/glass-ui";
import { GlassDock, DockIconButton } from "@mkbabb/glass-ui/dock";
import { HoverPopover } from "@mkbabb/glass-ui/hover-popover";
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

/* A.W2.c — adapt the scalar `magnetRadius` to glass-scrubber's array model. */
const magnetModel = computed<number[]>({
    get: () => [props.magnetRadius],
    set: (arr) => emit("update:magnetRadius", Math.max(0, Math.min(10, arr[0] ?? 0))),
});
</script>

<template>
    <GlassDock :collapse-delay="2000" :start-collapsed="true" fit-content>
        <!-- Collapsed summary -->
        <template #collapsed>
            <div class="flex items-center gap-2">
                <Wand2 :size="18" class="shrink-0 text-foreground/50" />
                <span class="dock-badge">{{ pointCount }} pts</span>
                <Tooltip text="Save contour">
                    <DockIconButton class="is-save" :class="{ saved: isSaved }" @click.stop="emit('save')">
                        <Check v-if="isSaved" :size="18" />
                        <Save v-else :size="18" />
                    </DockIconButton>
                </Tooltip>
            </div>
        </template>

        <!-- Expanded controls -->
        <div class="flex items-center gap-2 w-full">
            <Tooltip text="Undo">
                <DockIconButton :disabled="!canUndo" @click="emit('undo')">
                    <Undo2 :size="20" />
                </DockIconButton>
            </Tooltip>
            <Tooltip text="Redo">
                <DockIconButton :disabled="!canRedo" @click="emit('redo')">
                    <Redo2 :size="20" />
                </DockIconButton>
            </Tooltip>

            <span class="dock-separator" />

            <Tooltip text="Smooth">
                <DockIconButton class="is-amber" @click="emit('smooth')">
                    <Wand2 :size="20" />
                </DockIconButton>
            </Tooltip>
            <Tooltip text="Simplify">
                <DockIconButton class="is-sky" @click="emit('simplify')">
                    <Minimize2 :size="20" />
                </DockIconButton>
            </Tooltip>
            <Tooltip text="Delete point">
                <DockIconButton class="is-rose" :disabled="!canDelete" @click="emit('delete')">
                    <Trash2 :size="20" />
                </DockIconButton>
            </Tooltip>

            <!-- Magnet popover with slider -->
            <HoverPopover side="top" align="center" keep-dock-open>
                <template #trigger>
                    <DockIconButton aria-label="Magnet radius">
                        <Magnet :size="20" :class="magnetRadius > 0 ? 'text-viz-fourier' : ''" />
                    </DockIconButton>
                </template>
                <template #content>
                    <div class="magnet-popover-content">
                        <div class="flex items-center justify-between gap-3 px-1">
                            <span class="text-xs font-medium text-foreground whitespace-nowrap">Magnet</span>
                            <span class="text-xs fira-code text-muted-foreground tabular-nums">{{ magnetRadius }}</span>
                        </div>
                        <Slider
                            v-model="magnetModel"
                            variant="glass-scrubber"
                            :min="0"
                            :max="10"
                            :step="1"
                            aria-label="Magnet radius"
                            class="magnet-slider-track"
                            :style="{ '--track-color': VIZ_COLORS.fourier }"
                            @mousedown.stop
                            @pointerdown.stop
                        />
                    </div>
                </template>
            </HoverPopover>

            <span class="dock-separator" />

            <!-- Overlay stack (ghost + image) -->
            <HoverPopover side="top" align="center" keep-dock-open>
                <template #trigger>
                    <DockIconButton aria-label="Overlay options">
                        <Eye :size="20" />
                    </DockIconButton>
                </template>
                <template #content>
                    <div class="flex flex-col gap-1 p-1">
                        <Tooltip text="Contour trace">
                            <DockIconButton :class="{ 'is-active': showGhost }" @click="emit('toggleGhost')">
                                <component :is="showGhost ? Eye : EyeOff" :size="20" />
                            </DockIconButton>
                        </Tooltip>
                        <Tooltip text="Image overlay">
                            <DockIconButton :class="{ 'is-active': showImageOverlay }" @click="emit('toggleOverlay')">
                                <Image :size="20" />
                            </DockIconButton>
                        </Tooltip>
                    </div>
                </template>
            </HoverPopover>

            <Tooltip text="Reset to extraction">
                <DockIconButton @click="emit('reset')">
                    <RotateCcw :size="20" />
                </DockIconButton>
            </Tooltip>

            <span class="dock-spacer" />
            <span class="dock-badge">{{ pointCount }} pts</span>

            <Tooltip text="Save contour">
                <DockIconButton class="is-save" :class="{ saved: isSaved }" @click="emit('save')">
                    <Check v-if="isSaved" :size="20" />
                    <Save v-else :size="20" />
                </DockIconButton>
            </Tooltip>
        </div>
    </GlassDock>
</template>

<style scoped>
@reference "tailwindcss";

/* ── Dock layout helpers ── */
.dock-separator {
    width: 1px;
    height: 1.5rem;
    background: color-mix(in srgb, var(--foreground) 20%, transparent);
    flex-shrink: 0;
}

.dock-spacer {
    flex: 1;
}

.dock-badge {
    @apply text-base;
    color: color-mix(in srgb, var(--foreground) 50%, transparent);
    font-variant-numeric: tabular-nums;
    padding: 0 0.375rem;
    white-space: nowrap;
}

/* ── Accent variants for DockIconButton (hover tint + state) ── */
.is-amber { --btn-hover-color: var(--viz-amber); }
.is-sky { --btn-hover-color: var(--viz-chebyshev); }
.is-rose { --btn-hover-color: var(--accent-pink); }

.is-save {
    background: color-mix(in srgb, var(--foreground) 6%, transparent);
    --btn-hover-color: var(--viz-fourier);
}
.is-save:hover:not(:disabled) {
    background: color-mix(in srgb, var(--viz-fourier) 15%, transparent);
}
.is-save.saved {
    color: var(--success);
}

.magnet-popover-content {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    width: 9rem;
    padding: 0.375rem 0.5rem;
}

/* A.W2.c — glass-scrubber per-instance retint hook + full-width sizing. */
.magnet-slider-track {
    width: 100%;
    --slider-scrub-range-bg: color-mix(in srgb, var(--track-color) 30%, transparent);
    --slider-scrub-range-bg-hover: color-mix(in srgb, var(--track-color) 45%, transparent);
    --slider-scrub-thumb-bg: var(--track-color);
    --slider-scrub-thumb-bg-hover: var(--track-color);
}
</style>
