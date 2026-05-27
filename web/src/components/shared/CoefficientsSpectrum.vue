<script setup lang="ts">
/**
 * CoefficientsSpectrum — the shared Fourier-spectrum readout extracted from
 * the visualization route's `CoefficientsPanel` (D7) and the equation route's
 * `EqCoefficientsPanel` (D11). The two consumers were ~95% identical: the
 * amplitude-bar `TransitionGroup`, the per-component hover tooltip, and the
 * count/expand readout. The sole structural divergence — the visualization
 * route's `FrequencyGraph` — is hoisted to the `#graph` slot; the equation
 * route passes nothing.
 *
 * B.W2.c — per-component amplitude readouts route through glass-ui's
 * `AnimatedDigit` (damped numerals + tabular/ss01/lnum font features) and the
 * bespoke `:hover` CSS tooltip lifts to the glass-ui `Tooltip` primitive
 * (the local shim wraps `Tooltip` + `TooltipTrigger` + `TooltipContent`),
 * discharging the L5 §5 A8 LOW a11y gap.
 */
import { computed, ref } from "vue";
import { Button } from "@mkbabb/glass-ui";
import { AnimatedDigit } from "@mkbabb/glass-ui/animated-digit";
import { ChevronDown, ChevronUp } from "lucide-vue-next";
import { Tooltip } from "@/components/ui/tooltip";
import type { BasisComponent } from "@/lib/types";

const props = withDefaults(
    defineProps<{
        components: BasisComponent[];
        /** Copy shown when there are no components to plot. */
        emptyText?: string;
    }>(),
    {
        emptyText: "Compute to see coefficients",
    },
);

const expanded = ref(false);

const topComponents = computed(() =>
    props.components.slice(0, expanded.value ? 40 : 12),
);

const totalComponents = computed(() => props.components.length);

const maxAmplitude = computed(() =>
    topComponents.value.length ? topComponents.value[0].amplitude : 1,
);

function spectrumColor(i: number, total: number): string {
    const hue = (1 - i / Math.max(total - 1, 1)) * 300;
    return `hsl(${hue}, 85%, 55%)`;
}

function formatPhase(phase: number): string {
    return `${((phase * 180) / Math.PI).toFixed(1)}°`;
}

function formatPercent(amplitude: number): string {
    if (!maxAmplitude.value) return "0%";
    return `${((amplitude / maxAmplitude.value) * 100).toFixed(1)}%`;
}

function fmtAmplitude(v: number): string {
    return v.toFixed(2);
}
</script>

<template>
    <div class="pt-1">
        <!-- Divergent slot: the visualization route passes <FrequencyGraph>;
             the equation route passes nothing. -->
        <slot name="graph" />

        <div class="flex items-center justify-end mb-2">
            <span class="fira-code text-xs text-muted-foreground">
                {{ topComponents.length }} / {{ totalComponents }}
            </span>
        </div>

        <div v-if="topComponents.length" class="space-y-1 max-h-[300px] overflow-y-auto">
            <TransitionGroup name="coeff-list">
                <Tooltip
                    v-for="(comp, i) in topComponents"
                    :key="`${comp.index}-${i}`"
                    side="bottom"
                >
                    <div class="coeff-row flex items-center gap-2 text-xs">
                        <span class="w-8 text-right fira-code text-muted-foreground tabular-nums">
                            {{ comp.index >= 0 ? "+" : "" }}{{ comp.index }}
                        </span>
                        <div class="flex-1 h-3 rounded-full bg-muted/50 overflow-hidden">
                            <div
                                class="h-full rounded-full transition-all duration-500 ease-out"
                                :style="{
                                    width: `${(comp.amplitude / maxAmplitude) * 100}%`,
                                    backgroundColor: spectrumColor(i, topComponents.length),
                                    minWidth: '2px',
                                }"
                            />
                        </div>
                        <AnimatedDigit
                            :value="comp.amplitude"
                            :format="fmtAmplitude"
                            class="w-16 text-right fira-code text-muted-foreground tabular-nums"
                        />
                    </div>
                    <template #content>
                        <div class="flex items-center gap-1.5 mb-1">
                            <span class="inline-block w-2 h-2 rounded-full" :style="{ backgroundColor: spectrumColor(i, topComponents.length) }" />
                            <span class="font-semibold">n = {{ comp.index }}</span>
                        </div>
                        <div class="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-admin-label">
                            <span class="text-muted-foreground">Amplitude</span>
                            <span class="fira-code">{{ comp.amplitude.toFixed(4) }}</span>
                            <span class="text-muted-foreground">Phase</span>
                            <span class="fira-code">{{ formatPhase(comp.phase) }}</span>
                            <span class="text-muted-foreground">Relative</span>
                            <span class="fira-code">{{ formatPercent(comp.amplitude) }}</span>
                            <span class="text-muted-foreground">Re / Im</span>
                            <span class="fira-code">{{ comp.coefficient[0].toFixed(3) }} / {{ comp.coefficient[1].toFixed(3) }}</span>
                        </div>
                    </template>
                </Tooltip>
            </TransitionGroup>

            <Tooltip :text="expanded ? 'Collapse to top 12 coefficients' : `Show top 40 of ${totalComponents} coefficients`">
                <Button
                    v-if="totalComponents > 12"
                    variant="ghost"
                    size="sm"
                    class="mt-2 w-full gap-1 text-xs text-muted-foreground"
                    @click="expanded = !expanded"
                >
                    <component :is="expanded ? ChevronUp : ChevronDown" class="h-3.5 w-3.5" />
                    {{ expanded ? "Show less" : `Show more (${totalComponents} total)` }}
                </Button>
            </Tooltip>
        </div>

        <p v-else class="text-xs text-muted-foreground py-3 text-center">
            {{ emptyText }}
        </p>
    </div>
</template>

<style scoped>
@reference "tailwindcss";
/* A.W3.d — named properties + canonical tokens, no `transition: all`. */
.coeff-list-enter-active {
    transition: opacity 0.3s var(--ease-standard), transform 0.3s var(--ease-standard);
}
.coeff-list-leave-active {
    transition: opacity 0.2s var(--ease-standard), transform 0.2s var(--ease-standard);
}
.coeff-list-enter-from {
    opacity: 0;
    transform: translateX(-8px);
}
.coeff-list-leave-to {
    opacity: 0;
    transform: translateX(8px);
}
.coeff-list-move {
    transition: transform 0.3s ease;
}

.coeff-row {
    cursor: default;
}
</style>
