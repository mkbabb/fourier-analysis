<script setup lang="ts">
import { computed } from "vue";
import { Slider } from "@mkbabb/glass-ui/slider";
import { Popover, PopoverTrigger, PopoverContent } from "@mkbabb/glass-ui/popover";
import { Metric } from "@mkbabb/glass-ui/metric";
import { GlassDock, DockControl } from "@mkbabb/glass-ui/dock";
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
} from "@lucide/vue";

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
        <!--
          X.F.W4 · SP-5 — `fr-EditorControlsDock B-2` ⊕ `fr-CanvasControlsDock M-2`,
          THE INVERSION LOCK, cured on both faces in one edit.

          At 4.0.0 the two docks failed inversely: this one put a real focusable
          Save inside `#collapsed`, so keyboard entry expanded the dock, which
          stamped `inert` on the summary layer out from under the focused button
          and threw focus to the body (B-2); the sibling put only glyphs there,
          so a keyboard user could never open it at all (M-2). The sibling's
          booked cure — "focusable summary content" — would have MANUFACTURED
          B-2 there, which is why the two rows are one object.

          glass-ui 8.0.0 ships the producer half both relay letters asked for:
          the summary layer is itself the disclosure (`role="button"`,
          `tabindex="0"`, `aria-label="Expand dock"`, `aria-expanded`,
          `aria-controls`), its `focusin` is `.stop`-modified so focus into the
          summary no longer triggers the expand-flip, and its Enter/Space
          handler expands and then MOVES focus into the full layer. The
          destruction chain is gone at the producer.

          What that leaves is a consumer defect the producer's cure creates
          here and nowhere else: a `role="button"` host may not contain
          interactive content, and this file's `#collapsed` did. So the Save
          leaves the summary for `#persistent` — the never-inert region the
          producer renders OUTSIDE `.dock-layers`, present at both poles. The
          collapsed summary keeps a non-interactive identity glyph, the
          disclosure semantics stay valid, and S-4/M-9's design fact — the one
          action that persists work survives the auto-collapse — is not merely
          preserved but strengthened: Save is now reachable in EVERY state.
          The expanded row's duplicate Save and badge go with it (one action,
          one control).
        -->
        <template #persistent>
            <span class="dock-badge">{{ pointCount }} pts</span>
            <Tooltip text="Save contour">
                <DockControl
                    class="is-save"
                    :class="{ saved: isSaved }"
                    :aria-label="isSaved ? 'Contour saved' : 'Save contour'"
                    @click.stop="emit('save')"
                >
                    <Check v-if="isSaved" />
                    <Save v-else />
                </DockControl>
            </Tooltip>
        </template>

        <!-- Collapsed summary — identity mark only; NO interactive content. -->
        <template #collapsed>
            <Wand2 class="shrink-0 dock-summary-glyph" aria-hidden="true" />
        </template>

        <!-- Expanded controls -->
        <div class="flex items-center gap-2 w-full">
            <Tooltip text="Undo">
                <DockControl :disabled="!canUndo" @click="emit('undo')">
                    <Undo2 />
                </DockControl>
            </Tooltip>
            <Tooltip text="Redo">
                <DockControl :disabled="!canRedo" @click="emit('redo')">
                    <Redo2 />
                </DockControl>
            </Tooltip>

            <span class="dock-separator" />

            <Tooltip text="Smooth">
                <DockControl class="is-amber" @click="emit('smooth')">
                    <Wand2 />
                </DockControl>
            </Tooltip>
            <Tooltip text="Simplify">
                <DockControl class="is-sky" @click="emit('simplify')">
                    <Minimize2 />
                </DockControl>
            </Tooltip>
            <Tooltip text="Delete point">
                <DockControl class="is-rose" :disabled="!canDelete" @click="emit('delete')">
                    <Trash2 />
                </DockControl>
            </Tooltip>

            <!-- Magnet popover with slider -->
            <Popover trigger="hover" keep-dock-open>
                <PopoverTrigger as-child>
                    <DockControl aria-label="Magnet radius">
                        <Magnet :class="magnetRadius > 0 ? 'text-viz-fourier' : ''" />
                    </DockControl>
                </PopoverTrigger>
                <PopoverContent side="top" align="center">
                    <div class="magnet-popover-content">
                        <div class="flex items-center justify-between gap-3 px-1">
                            <span class="text-xs font-medium text-foreground whitespace-nowrap">Magnet</span>
                            <Metric :value="magnetRadius" size="sm" />
                        </div>
                        <Slider
                            v-model="magnetModel"
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
                </PopoverContent>
            </Popover>

            <span class="dock-separator" />

            <!-- Overlay stack (ghost + image) -->
            <Popover trigger="hover" keep-dock-open>
                <PopoverTrigger as-child>
                    <DockControl aria-label="Overlay options">
                        <Eye />
                    </DockControl>
                </PopoverTrigger>
                <PopoverContent side="top" align="center">
                    <div class="flex flex-col gap-1 p-1">
                        <Tooltip text="Contour trace">
                            <DockControl :active="showGhost" @click="emit('toggleGhost')">
                                <component :is="showGhost ? Eye : EyeOff" />
                            </DockControl>
                        </Tooltip>
                        <Tooltip text="Image overlay">
                            <DockControl :active="showImageOverlay" @click="emit('toggleOverlay')">
                                <Image />
                            </DockControl>
                        </Tooltip>
                    </div>
                </PopoverContent>
            </Popover>

            <Tooltip text="Reset to extraction">
                <DockControl @click="emit('reset')">
                    <RotateCcw />
                </DockControl>
            </Tooltip>

            <span class="dock-spacer" />
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

/* X.F.W4 · SP-5 (B-2) + `fr-CanvasControlsDock M-7`'s token leg — the collapsed
   identity glyph reads the dock's own glyph rung and the substrate's muted-glyph
   dial instead of a literal size and an ad-hoc `/50` alpha, so it tracks the
   `--dock-scale` ladder (including the coarse-pointer re-declaration) the way
   every other glyph in the dock does. */
.dock-summary-glyph {
    width: var(--dock-icon-glyph);
    height: var(--dock-icon-glyph);
    color: color-mix(
        in srgb,
        var(--foreground) calc(var(--opacity-icon-muted) * 100%),
        transparent
    );
}

.dock-badge {
    @apply text-base;
    color: color-mix(in srgb, var(--foreground) 50%, transparent);
    font-variant-numeric: tabular-nums;
    padding: 0 0.375rem;
    white-space: nowrap;
}

/* ── Accent variants for DockControl (hover tint + state) ── */
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
