<script setup lang="ts">
import { computed } from "vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { ConfiguratorLayer } from "@mkbabb/glass-ui/configurator";
import FrequencyGraph from "@/components/equation/FrequencyGraph.vue";
import CoefficientsSpectrum from "@/components/shared/CoefficientsSpectrum.vue";

const store = useWorkspaceStore();

const components = computed(() => store.epicycleData?.components ?? []);
</script>

<template>
    <ConfiguratorLayer label="Coefficients" sub="Fourier spectrum" :default-open="false">
        <CoefficientsSpectrum :components="components" empty-text="Compute epicycles to see coefficients">
            <template #graph>
                <FrequencyGraph
                    v-if="components.length"
                    :components="components"
                    :max-bars="40"
                    class="mb-2"
                />
            </template>
        </CoefficientsSpectrum>
    </ConfiguratorLayer>
</template>
