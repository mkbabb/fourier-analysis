<script setup lang="ts">
/**
 * X.F.W3 `.d` — `fr-EquationModeToggle FR-EMT-7` (⊕ `FR-EMT-4`, `FR-EMT-9`,
 * `FR-EMT-12`, `K-7`). An 80-line hand-rolled binary segmented control sat
 * EIGHTY-TWO LINES BELOW its own parent's import and mount of `SegmentedTabs`
 * (`EquationView.vue`). The parent had already chosen the primitive; this file
 * re-implemented it.
 *
 * `K-7` KILLED the routing hedge that had this waiting on an uplift: the
 * `"option"` scoped slot compiles into BOTH render branches at the installed
 * pin — verified here in the producer's own compiled template, where the option
 * button emits `j(n.$slots, "option", { option, active }, () => [label])`. So
 * the glyph treatment this control exists for survives the adoption, and the
 * adoption was always landable.
 *
 * WHAT THE PRIMITIVE BRINGS THAT THE HAND-ROLL DID NOT: roving `tabindex` and
 * arrow-key traversal across the pair, `aria-pressed` emitted by the chassis
 * rather than hand-bound, the indicator's reduced-motion arm, and the
 * coarse-pointer size clamp. `FR-EMT-4`/`FR-EMT-9`/`FR-EMT-12` dissolve in the
 * fold — there is no bespoke active-paint, no bespoke hover and no bespoke
 * focus recipe left to diverge.
 *
 * THE NAME CHANNEL, stated because the slot moves it: providing `#option`
 * REPLACES the button's text, so the label can no longer be the accessible
 * name by default. The glyphs are decorative (`aria-hidden`) and each button
 * carries its option's `label` as visually-hidden text — ONE label source. The
 * old `title=` duplicates are deleted rather than ported: `title` on these
 * triggers was a second announcement of the same string and reached no touch
 * user at all (the `R3-7a` / `FR-AFP-34` discipline, applied here).
 *
 * ⊘ `FR-EMT-2` — the `overflow: hidden` that clipped the producer's OUTSET
 * focus ring — is discharged HERE by construction, because the hand-rolled
 * clipping frame is deleted with the control. Its ESCALATION is carried
 * unchanged and un-claimed: at ≥7.0.0 `.glass-wash` gained `contain: paint`,
 * so "delete the `overflow`" stops being a sufficient cure wherever that class
 * still wraps a focusable descendant. This file no longer uses `.glass-wash`;
 * the escalation belongs to whoever still does.
 */
import { computed } from "vue";
import { SegmentedTabs } from "@mkbabb/glass-ui/tabs";
import type { EquationDisplayMode } from "@/lib/equation/types";

const model = defineModel<EquationDisplayMode>({ required: true });

const options = [
    { value: "sigma", label: "Sigma notation (compact)" },
    { value: "expanded", label: "Expanded terms" },
];

const value = computed({
    get: () => model.value as string,
    set: (v: string) => {
        model.value = v as EquationDisplayMode;
    },
});
</script>

<template>
    <SegmentedTabs
        v-model="value"
        :options="options"
        semantics="toggle"
        aria-label="Equation display mode"
        class="eq-toggle"
    >
        <template #option="{ option }">
            <span
                class="eq-toggle-icon"
                :class="{ 'eq-toggle-icon--mono': option.value === 'expanded' }"
                aria-hidden="true"
            >{{ option.value === "sigma" ? "Σ" : "a + b" }}</span>
            <span class="sr-only">{{ option.label }}</span>
        </template>
    </SegmentedTabs>
</template>

<style scoped>
/* The two glyph treatments are the only thing this file ever had that the
   primitive does not: a Computer Modern italic sigma and a Fira Code operand
   pair. Everything else — the track, the indicator, the active paint, the
   hover, the focus ring, the clipping frame that broke it — retires with the
   hand-roll. */
/* X.F.W14U.eq — UIA-F-206: both glyphs on glass's named rungs (the operand
   pair was an 11 px literal under the caption rung). */
.eq-toggle-icon {
    font-size: var(--type-small);
    font-family: "Computer Modern Serif", Georgia, serif;
    font-style: italic;
}

.eq-toggle-icon--mono {
    font-family: "Fira Code", monospace;
    font-size: var(--type-caption);
    font-style: normal;
    letter-spacing: -0.5px;
}
</style>
