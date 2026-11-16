<script setup lang="ts">
/**
 * The equation stage's floating dock (owner, 2026-11-15: "pages like the
 * quaran reader and fourier should have an additional floating bar ... which
 * is a collapsible glass-ui dock"): the plot's own tools at the stage card's
 * top-right corner, folded to one glyph and opened by a press (`StageDock`),
 * a downward column on a phone. Plot layers (the original curve, the
 * harmonics; the sum is the figure itself) and Export plot. The series' own
 * acts (Copy LaTeX, About this approximation) are the app dock's.
 */
import { Download, Ellipsis, Layers, Spline, Waves } from "@lucide/vue";
import { DockControl } from "@mkbabb/glass-ui/dock";
import { DockTrigger } from "@mkbabb/glass-ui/dock-trigger";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
} from "@mkbabb/glass-ui/menu";
import { StatusDot } from "@mkbabb/glass-ui/status-dot";
import { Tooltip } from "@/components/ui/tooltip";
import StageDock from "@/components/shared/StageDock.vue";

const showOriginal = defineModel<boolean>("showOriginal", { required: true });
const showHarmonics = defineModel<boolean>("showHarmonics", { required: true });

defineProps<{
    /** The plot's variable, for the original curve's row ("Original f(x)"). */
    variable: string;
}>();

const emit = defineEmits<{
    exportPlot: [];
}>();

/** A row toggles its layer and keeps the menu open. */
function keepOpen(e: Event) {
    e.preventDefault();
}
</script>

<template>
    <!-- A fixed seat the size of the folded dock: the dock floats from its
         top-right corner, so the open row (or a phone's column) overlays the
         card instead of growing the header row it sits in. -->
    <div class="plot-tools-seat">
    <StageDock label="Plot tools">
        <template #collapsed>
            <span class="summary-glyph-wrap">
                <Ellipsis class="dock-summary-glyph" aria-hidden="true" />
                <StatusDot v-if="!showOriginal || !showHarmonics" class="view-dot" state="active" size="sm" motion="off" />
            </span>
        </template>
        <template #default="{ hold, column }">
            <DropdownMenu :modal="false" @update:open="hold">
                <DockTrigger for="dropdown" aria-label="Plot layers">
                    <Layers />
                </DockTrigger>
                <DropdownMenuContent side="bottom" align="end" :side-offset="8">
                    <DropdownMenuLabel>Plot layers</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem
                        :model-value="showOriginal"
                        @select="keepOpen"
                        @update:model-value="showOriginal = !showOriginal"
                    >
                        <Spline aria-hidden="true" />
                        <span>Original f({{ variable }})</span>
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                        :model-value="showHarmonics"
                        @select="keepOpen"
                        @update:model-value="showHarmonics = !showHarmonics"
                    >
                        <Waves aria-hidden="true" />
                        <span>Harmonics</span>
                    </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Tooltip text="Export plot" :side="column ? 'left' : 'bottom'">
                <DockControl aria-label="Export plot" @click="emit('exportPlot')">
                    <Download />
                </DockControl>
            </Tooltip>
        </template>
    </StageDock>
    </div>
</template>

<style scoped>
.plot-tools-seat {
    position: relative;
    flex: none;
    inline-size: var(--dock-h);
    block-size: var(--dock-h);
}

.plot-tools-seat > :deep(.stage-dock) {
    position: absolute;
    inset-block-start: 0;
    inset-inline-end: 0;
    /* The seat is the folded glyph's size; the open dock takes its own width. */
    inline-size: max-content;
    z-index: var(--z-controls);
}

.summary-glyph-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.summary-glyph-wrap > .view-dot {
    position: absolute;
    bottom: 100%;
    left: 100%;
    pointer-events: none;
}

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
