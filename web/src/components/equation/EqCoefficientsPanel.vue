<script setup lang="ts">
import { computed } from "vue";
import CollapsibleSection from "@/components/ui/CollapsibleSection.vue";
import CoefficientsSpectrum from "@/components/shared/CoefficientsSpectrum.vue";
import type { BasisComponent } from "@/lib/types";

/**
 * `FR-EQC-12` ⊕ `FR-EQC-1` / `DECISIONS-F.W4.md` **D3**, executed as ruled —
 * RE-WORD, do not fill. This seat re-decides nothing.
 *
 * The subtitle read `"Fourier spectrum"` and promised a spectrum this panel
 * declines: the sibling fills `CoefficientsSpectrum`'s `#graph` slot, this one
 * leaves it empty, and the em-dash gloss restated the title while doing no work.
 * The row's own terminal forecloses the do-nothing arm in terms — *"not both, not
 * neither"* — so the promise is withdrawn rather than paid.
 *
 * ⊘ The FEATURE question (should `/equation` render a spectrum graph at all?)
 * routes to SS-3/SS-4 with D3 as its provenance, and carries its consequence:
 * filling `#graph` re-opens the reconciliation below at a FOURTH surface and
 * must be re-priced there.
 *
 * `FR-EQC-1`, the honesty repair, on the three surfaces that exist TODAY: the
 * list enumerates EVERY coefficient while the formula above it is rendered from
 * a budget-truncated subset, and neither surface said so. It says so now, and it
 * says it with the two real numbers rather than a hedge.
 */
const props = defineProps<{
    components: BasisComponent[];
    /** The term count the rendered formula is truncated to (`budget`). */
    renderedTerms?: number;
}>();

const total = computed(() => props.components.length);
const truncated = computed(
    () => props.renderedTerms !== undefined && props.renderedTerms < total.value,
);
</script>

<template>
    <div class="cartoon-card px-3 py-2">
        <CollapsibleSection
            title="Coefficients"
            :subtitle="`all ${total} terms`"
            :default-open="false"
        >
            <p v-if="truncated" class="reconcile-note">
                The equation above renders the {{ renderedTerms }} largest by amplitude;
                this list is the full set.
            </p>
            <CoefficientsSpectrum :components="components" empty-text="Compute to see coefficients" />
        </CollapsibleSection>
    </div>
</template>

<style scoped>
.reconcile-note {
    font-size: 0.8125rem;
    line-height: 1.4;
    color: var(--muted-foreground);
    margin-bottom: 0.5rem;
}
</style>
