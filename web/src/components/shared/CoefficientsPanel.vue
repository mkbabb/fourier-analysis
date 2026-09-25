<script setup lang="ts">
import { computed } from "vue";
import { ConfiguratorLayer } from "@mkbabb/glass-ui/configurator";
import CoefficientsSpectrum from "@/components/shared/CoefficientsSpectrum.vue";
import type { BasisComponent } from "@/lib/types";

/**
 * X.F.W14V.au3 — A2-FO-L1-6: the one Coefficients layer. /visualize's sidebar
 * and /equation's aside each kept a twin file around `CoefficientsSpectrum`
 * after both converged on `ConfiguratorLayer` (X.F.W3 `.d`, `FR-CP-33`: the
 * layer keeps its body mounted when collapsed, so the "Show more" latch lives
 * through a collapse on both routes). The twins differed only in their
 * subtitle, their empty text and the "rendered N of M" note; those are props.
 *
 * `FR-EQC-12` / D3 (/equation): the subtitle names the list's size rather than
 * promising a spectrum graph the route declines, so it defaults to the harmonic
 * count; /visualize passes its own. `FR-EQC-1` ⊕ UIA-F-35 / F-201: when the
 * rendered formula keeps fewer harmonics than the list shows, the note says
 * so with the two real numbers, counted in one unit (harmonics, DC as one).
 */
const props = defineProps<{
    components: BasisComponent[];
    /** The layer's subtitle; the harmonic count when absent. */
    sub?: string;
    /** The harmonic count the rendered formula keeps (`budget`, DC as one). */
    renderedTerms?: number;
    emptyText?: string;
}>();

const total = computed(() => new Set(props.components.map((c) => Math.abs(c.index))).size);
const truncated = computed(
    () => props.renderedTerms !== undefined && props.renderedTerms < total.value,
);
</script>

<template>
    <ConfiguratorLayer label="Coefficients" :sub="sub ?? `all ${total} harmonics`" :default-open="false">
        <p v-if="truncated" class="reconcile-note">
            The expanded equation keeps the {{ renderedTerms }} strongest harmonics
            (DC counts as one); this list is the full set.
        </p>
        <CoefficientsSpectrum :components="components" :empty-text="emptyText">
            <template v-if="$slots.graph" #graph><slot name="graph" /></template>
        </CoefficientsSpectrum>
    </ConfiguratorLayer>
</template>

<style scoped>
.reconcile-note {
    font-size: var(--type-caption);
    line-height: var(--type-leading-caption);
    color: var(--muted-foreground);
    margin-bottom: 0.5rem;
}
</style>
