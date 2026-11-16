<script setup lang="ts">
/**
 * The equation explorer's tool set in the app dock (owner, 2026-11-15: "Each
 * page should have a tool set in the main dock"): the page's own acts on the
 * series it shows, Copy LaTeX and About this approximation. The plot's tools
 * (its layers, Export plot) are the stage dock's; each tool has one home.
 *
 * Kept from the series card's former dock: FR-EQR-1 (the clipboard's status
 * by name), FR-EQR-5 (the outcome announced, not colour alone), FR-EQR-25
 * (no copy of nothing), FR-COB-19 (the info card is the Popover's hover arm,
 * the icon-only trigger named), UIA-F-253 (glass Badge and Metric).
 *
 * Two forms (`usePageTools`): `seats`, dock controls (the app dock from
 * 40rem); `items`, under 40rem, where the app dock's sections menu absorbs
 * them: Copy LaTeX is an item, and the approximation's facts (the tier, the
 * energy, what the tier means) are read in the menu itself, since a touch has
 * no hover to open the card.
 */
import { computed } from "vue";
import { Check, Copy, Info } from "@lucide/vue";
import { DockControl } from "@mkbabb/glass-ui/dock";
import {
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@mkbabb/glass-ui/menu";
import { Badge } from "@mkbabb/glass-ui/badge";
import { Metric } from "@mkbabb/glass-ui/metric";
import { Popover, PopoverContent, PopoverTrigger } from "@mkbabb/glass-ui/popover";
import { useClipboard } from "@mkbabb/glass-ui";
import { Tooltip } from "@/components/ui/tooltip";
import { plainLatex } from "@/lib/equation/render";
import { formatNumber } from "@/lib/format";
import type { PageToolsForm } from "@/composables/usePageTools";

const props = defineProps<{
    form: PageToolsForm;
    latex: string;
    tier: { label: string; description: string } | null;
    tierTone: "success" | "warning" | "info";
    energy: number;
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

function onCopyItem(e: Event) {
    e.preventDefault();
    void copyLatex();
}
</script>

<template>
    <template v-if="form === 'items'">
        <!-- The menu stays open on Copy, so its check and the status line
             below (inside the menu here) are seen and heard. -->
        <DropdownMenuItem :disabled="!latex" @select="onCopyItem">
            <Transition name="icon-swap" mode="out-in">
                <Check v-if="status === 'success'" class="copy-ok" aria-hidden="true" />
                <Copy v-else aria-hidden="true" />
            </Transition>
            <span>Copy LaTeX</span>
        </DropdownMenuItem>
        <template v-if="tier">
            <DropdownMenuSeparator />
            <DropdownMenuLabel>About this approximation</DropdownMenuLabel>
            <div class="equation-tools-facts">
                <div class="flex items-center gap-2 flex-wrap">
                    <Badge :tone="tierTone">{{ tier.label }}</Badge>
                    <Metric :value="formatNumber(energy * 100, 3)" unit="% energy" size="sm" />
                </div>
                <p class="text-small text-muted-foreground mt-2">{{ tier.description }}</p>
            </div>
        </template>
    </template>
    <template v-else>
        <Tooltip text="Copy LaTeX" side="bottom">
            <DockControl aria-label="Copy LaTeX" :disabled="!latex" @click="copyLatex">
                <Transition name="icon-swap" mode="out-in">
                    <Check v-if="status === 'success'" class="copy-ok" />
                    <Copy v-else />
                </Transition>
            </DockControl>
        </Tooltip>
        <Popover v-if="tier" keep-dock-open trigger="hover" :open-delay="200" :close-delay="150">
            <PopoverTrigger as-child>
                <DockControl aria-label="About this approximation">
                    <Info />
                </DockControl>
            </PopoverTrigger>
            <PopoverContent class="info-hovercard" side="bottom" :side-offset="6" align="end"
                aria-label="About this approximation">
                <div class="flex items-center gap-2 flex-wrap">
                    <Badge :tone="tierTone">{{ tier.label }}</Badge>
                    <Metric :value="formatNumber(energy * 100, 3)" unit="% energy" size="sm" />
                </div>
                <div class="flex gap-1.5 items-start text-small text-muted-foreground mt-2">
                    <Info class="size-3.5 shrink-0 mt-0.5" />
                    <p>{{ tier.description }}</p>
                </div>
            </PopoverContent>
        </Popover>
    </template>
    <p class="sr-only" role="status">{{ copyAnnouncement }}</p>
</template>

<style scoped>
/* The facts read as the menu's own text, at its inset and measure. */
.equation-tools-facts {
    padding: var(--space-residue) var(--space-atom) var(--space-atom);
    max-inline-size: 16rem;
}

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
