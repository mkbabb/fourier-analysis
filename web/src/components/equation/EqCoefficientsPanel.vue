<script setup lang="ts">
import CollapsibleSection from "@/components/ui/CollapsibleSection.vue";
import CoefficientsSpectrum from "@/components/shared/CoefficientsSpectrum.vue";
import type { BasisComponent } from "@/lib/types";

defineProps<{
    components: BasisComponent[];
}>();
</script>

<template>
    <div class="cartoon-card px-3 py-2">
        <CollapsibleSection title="Coefficients" subtitle="Fourier spectrum" :default-open="false">
            <CoefficientsSpectrum :components="components" empty-text="Compute to see coefficients" />
        </CollapsibleSection>
    </div>
</template>
