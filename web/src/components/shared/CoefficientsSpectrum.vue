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
 * B.W2.c — per-component amplitude readouts are damped numerals and the
 * bespoke `:hover` CSS tooltip lifts to the glass-ui `Tooltip` primitive
 * (the local shim wraps `Tooltip` + `TooltipTrigger` + `TooltipContent`),
 * discharging the L5 §5 A8 LOW a11y gap.
 *
 * F.W1 / B-4 — `@mkbabb/glass-ui/animated-digit` is definition-absent at the
 * adopted pin and this file was its only consumer repo-wide. The cure is NOT a
 * rename: the damping composable `useAnimatedNumber` is published on `./motion`
 * at BOTH pins, so the readout is hand-wired below onto the producer's own
 * smoother, with the tabular-numeral font features owned here (`fira-code
 * tabular-nums`) rather than inherited from a deleted component. `initial`
 * seeds the smoother at the first amplitude, so a freshly mounted row does not
 * animate up from zero.
 */
import { computed, defineComponent, h, ref, toRef } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { FadingScroll } from "@mkbabb/glass-ui/fading-scroll";
import { useAnimatedNumber } from "@mkbabb/glass-ui/motion";
import { ChevronDown, ChevronUp } from "@lucide/vue";
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

/**
 * The per-row damped amplitude readout (B-4's hand-wire). One `useAnimatedNumber`
 * per row, owned by the row, because the smoother is a per-value scope and the
 * rows live in a `v-for`.
 */
const AmplitudeReadout = defineComponent({
    name: "AmplitudeReadout",
    props: {
        value: { type: Number, required: true },
        format: { type: Function as unknown as () => (v: number) => string, required: true },
    },
    setup(props) {
        const { current } = useAnimatedNumber(toRef(props, "value"), {
            initial: props.value,
        });
        return () =>
            h(
                "span",
                { class: "w-16 text-right fira-code text-muted-foreground tabular-nums" },
                props.format(current.value),
            );
    },
});
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

        <div v-if="topComponents.length">
            <!-- X.F.W3 `.d` — `fr-CoefficientsSpectrum M-6`, THE FadingScroll
                 ADOPTION FAMILY. This was an unnamed 300px scroll port with no
                 `tabindex`, no `role` and no name, and the consequence is the
                 row's own sentence: a keyboard user presses "Show more", the
                 list grows from 12 rows to 40, and they reach nothing — the
                 port that now overflows is not in the tab order and announces
                 itself to nobody. The producer's own note is the same finding
                 from the other side: "Unnamed ports remain ordinary focusable
                 scroll containers."

                 `./fading-scroll` ships at the pin and IS the port: one div
                 carrying `role="region"`, the name, `tabindex="0"` and
                 state-aware edge feathering. The `max-h` rung and the row
                 spacing stay here — they are this readout's, not the port's.

                 "Show more" is deliberately OUTSIDE the port: it is the control
                 that changes what the port holds, so it may not scroll out of
                 reach of the person operating it.

                 ⊘ `overscroll-behavior` on the port is SS-13's, not this
                 edit's, and is carried named rather than smuggled in. -->
            <FadingScroll
                axis="y"
                aria-label="Fourier coefficient spectrum"
                class="max-h-[300px]"
            >
                <!-- X.F.W14V.u4 — UIA-F-146: the TransitionGroup's children were the
                     Tooltips themselves (a fragment root, so nothing could animate
                     and every load warned), and each tooltip wrapped a row no
                     keyboard could reach. Each row is now a list item the group
                     animates, and the row the tooltip describes takes focus. -->
                <TransitionGroup name="coeff-list" tag="ul" class="space-y-1">
                    <li
                        v-for="(comp, i) in topComponents"
                        :key="`${comp.index}-${i}`"
                    >
                    <Tooltip side="bottom">
                        <div class="coeff-row flex items-center gap-2 text-xs" tabindex="0">
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
                            <AmplitudeReadout :value="comp.amplitude" :format="fmtAmplitude" />
                        </div>
                        <template #content>
                            <div class="flex items-center gap-1.5 mb-1">
                                <span class="inline-block w-2 h-2 rounded-full" :style="{ backgroundColor: spectrumColor(i, topComponents.length) }" />
                                <span class="font-semibold">n = {{ comp.index }}</span>
                            </div>
                            <div class="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-mono-micro uppercase font-medium">
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
                    </li>
                </TransitionGroup>
            </FadingScroll>

            <!-- UIA-F-146: the condition sits on the Tooltip, so its trigger is always
                 the Button and never an empty comment node. -->
            <Tooltip v-if="totalComponents > 12" :text="expanded ? 'Collapse to top 12 coefficients' : `Show top 40 of ${totalComponents} coefficients`">
                <Button
                    emphasis="quiet"
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
