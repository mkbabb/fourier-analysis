<script setup lang="ts">
/**
 * The equation explorer's tool set: the page's own acts on the series it
 * shows, Copy LaTeX and About this approximation. The plot's tools (its
 * layers, Export plot) are the stage dock's; each tool has one home.
 *
 * The seats are declared with the page (`providePageTools`), so they are
 * there from its first frame and wait disabled for the series. From 40rem
 * they stand in the app dock's centre; under 40rem in the stage dock's column
 * beside the plot's tools (`PlotToolsDock`), their tooltips to the side.
 *
 * Kept from the series card's former dock: FR-EQR-1 (the clipboard's status
 * by name), FR-EQR-5 (the outcome announced, not colour alone), FR-EQR-25
 * (no copy of nothing), FR-COB-19 (the info card is the Popover's hover arm,
 * the icon-only trigger named; on a touch screen glass opens it on a press),
 * UIA-F-253 (glass Badge and Metric). About this approximation wears a gauge,
 * so the dock's About "i" is the page's only "i".
 */
import { computed } from "vue";
import { Check, Copy, Gauge } from "@lucide/vue";
import { DockControl } from "@mkbabb/glass-ui/dock";
import { Badge } from "@mkbabb/glass-ui/badge";
import { Metric } from "@mkbabb/glass-ui/metric";
import { Popover, PopoverContent, PopoverTrigger } from "@mkbabb/glass-ui/popover";
import { useClipboard } from "@mkbabb/glass-ui";
import { Tooltip } from "@/components/ui/tooltip";
import { plainLatex } from "@/lib/equation/render";
import { formatNumber } from "@/lib/format";

const { tooltipSide = "bottom", ...props } = defineProps<{
    latex: string;
    tier: { label: string; description: string } | null;
    tierTone: "success" | "warning" | "info";
    energy: number;
    /** Where a seat's tooltip opens (a column's seats open theirs to the side). */
    tooltipSide?: "bottom" | "left";
}>();

const { status, copy } = useClipboard({ resetMs: 2000 });

const copyAnnouncement = computed(() => {
    if (status.value === "success") return "LaTeX copied to the clipboard";
    if (status.value === "failure") return "Could not copy — the clipboard refused the write";
    return "";
});

async function copyLatex() {
    await copy(plainLatex(props.latex));
}
</script>

<template>
    <Tooltip text="Copy LaTeX" :side="tooltipSide">
        <DockControl aria-label="Copy LaTeX" :disabled="!latex" @click="copyLatex">
            <Transition name="icon-swap" mode="out-in">
                <Check v-if="status === 'success'" class="copy-ok" />
                <Copy v-else />
            </Transition>
        </DockControl>
    </Tooltip>
    <!-- Until the series lands the seat is here, waiting: present, disabled,
         with no card to open. -->
    <Popover keep-dock-open trigger="hover" :open-delay="200" :close-delay="150">
        <PopoverTrigger as-child>
            <DockControl aria-label="About this approximation" :disabled="!tier">
                <Gauge />
            </DockControl>
        </PopoverTrigger>
        <PopoverContent v-if="tier" class="info-hovercard" :side="tooltipSide" :side-offset="6" align="end"
            aria-label="About this approximation">
            <div class="flex items-center gap-2 flex-wrap">
                <Badge :tone="tierTone">{{ tier.label }}</Badge>
                <Metric :value="formatNumber(energy * 100, 3)" unit="% energy" size="sm" />
            </div>
            <p class="text-small text-muted-foreground mt-2">{{ tier.description }}</p>
        </PopoverContent>
    </Popover>
    <p class="sr-only" role="status">{{ copyAnnouncement }}</p>
</template>

<style scoped>
.copy-ok {
    color: var(--section-color-4);
}

.icon-swap-enter-active,
.icon-swap-leave-active {
    transition: opacity var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard);
}
.icon-swap-enter-from,
.icon-swap-leave-to {
    opacity: 0;
    transform: scale(0.7);
}
</style>
