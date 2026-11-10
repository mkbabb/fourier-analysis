<script setup lang="ts">
import { ConfiguratorLayer } from "@mkbabb/glass-ui/configurator";
import CoefficientsSpectrum from "@/components/shared/CoefficientsSpectrum.vue";
import type { BasisComponent } from "@/lib/types";

/**
 * X.F.W14V.au3 — A2-FO-L1-6: the one Coefficients layer, on /visualize's
 * sidebar and /equation's aside.
 *
 * Canon F7 (restraint, C-8): the layer carries no caption. Its count
 * ("21 harmonics · n = ±20") restated the list below it and a third count of
 * the series, and the note that reconciled it with the formula went when the
 * formula and the list began to follow one count (canon F3).
 */
defineProps<{
    components: BasisComponent[];
    emptyText?: string;
    /** A real series: c₋ₙ mirrors cₙ, so the list is one row per ±n pair. */
    paired?: boolean;
}>();
</script>

<template>
    <ConfiguratorLayer label="Coefficients" :default-open="false">
        <CoefficientsSpectrum :components="components" :empty-text="emptyText" :paired="paired" />
    </ConfiguratorLayer>
</template>
