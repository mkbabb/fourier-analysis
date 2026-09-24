<script setup lang="ts">
import { computed } from "vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { ConfiguratorLayer } from "@mkbabb/glass-ui/configurator";
import CoefficientsSpectrum from "@/components/shared/CoefficientsSpectrum.vue";

const store = useWorkspaceStore();

const components = computed(() => store.epicycleData?.components ?? []);
</script>

<template>
    <!-- X.F.W14U.vstage — UIA-F-169: the layer drew the same top amplitudes
         twice (a FrequencyGraph bar chart above the spectrum rows, both sorted
         by amplitude), pushing the layer below the fold. The spectrum rows are
         the one amplitude view: they carry the value, the phase and the share
         the chart only drew. -->
    <ConfiguratorLayer label="Coefficients" sub="Fourier spectrum" :default-open="false">
        <CoefficientsSpectrum :components="components" empty-text="Compute epicycles to see coefficients" />
    </ConfiguratorLayer>
</template>
