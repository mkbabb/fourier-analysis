<script setup lang="ts">
import { computed } from "vue";
import { ConfiguratorLayer } from "@mkbabb/glass-ui/configurator";
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
    /** The harmonic count the rendered formula keeps (`budget`, DC as one). */
    renderedTerms?: number;
}>();

/*
 * X.F.W14U.eq — UIA-F-35 (consumer) ⊕ F-201: the list and the formula count in
 * ONE unit. The server's budget keeps whole harmonics (the ±n pair together,
 * DC as one; `.srv` `798c98f`), so the list names its size in harmonics too —
 * n = 0..20 is 41 exponential terms but 21 harmonics — and the note compares
 * like with like.
 */
const total = computed(() => new Set(props.components.map((c) => Math.abs(c.index))).size);
const truncated = computed(
    () => props.renderedTerms !== undefined && props.renderedTerms < total.value,
);
</script>

<template>
    <!-- X.F.W3 `.d` — `fr-CoefficientsPanel FR-CP-33` (⊕ `FR-EQC-11`,
         `fr-CoefficientsSpectrum m-11`): ONE shared body, TWO disclosure
         chassis, and the asymmetry between them is what the row demands be
         recorded rather than discovered.

         THE ASYMMETRY, MEASURED AT THE BYTES: the visualization twin
         (`CoefficientsPanel.vue`) mounts `ConfiguratorLayer`, which keeps its
         body MOUNTED when collapsed and marks the region `aria-hidden` +
         `inert` over a `0fr` grid row; this twin mounted `CollapsibleSection`,
         whose reka `Presence` UNMOUNTS the body. Both twins render the same
         `CoefficientsSpectrum`, so `expanded` — the "Show more" latch — died on
         every collapse HERE and survived every collapse THERE. Same component,
         same user gesture, two different memories.

         The twins converge on `ConfiguratorLayer`, and the direction is not a
         coin toss: `fr-GalleryDraftsSection M-2`'s cure law governs the whole
         wave — "the cure is the PRIMITIVE, never the wrapper" — and the local
         wrapper is banked-defective across exactly the axes a convergence would
         buy (`K-6`: the `B-1` hang at the uplift target, `M-2`'s unmountOnHide
         teardown, `M-3`'s ungated `scrollIntoView`, `M-6`'s absent controlled
         open). Mounted-collapsed is also the arm that KEEPS the latch, which is
         the behaviour a reader would predict from the shared body.

         ⊘ `FR-EQC-11` ("neither register because it is neither") dies inside
         this convergence: the panel now wears the sanctioned layer register its
         twin wears, so there is no third register left to be neither.
         ⊘ The import-hygiene arm — the root-barrel `@mkbabb/glass-ui` import
         that defeats the ~60-subpath split — rides F.W1 by the row's own
         routing; its last consumer in this file leaves with the wrapper, and
         the surviving one is named in this unit's receipt.
         ⊘ `FR-CP-35`/`M-15` and where the `expanded` latch persists are decided
         BY this convergence and are recorded, not re-opened here. -->
    <ConfiguratorLayer
        label="Coefficients"
        :sub="`all ${total} harmonics`"
        :default-open="false"
    >
        <p v-if="truncated" class="reconcile-note">
            The expanded equation keeps the {{ renderedTerms }} strongest harmonics
            (DC counts as one); this list is the full set.
        </p>
        <CoefficientsSpectrum :components="components" empty-text="Compute to see coefficients" />
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
