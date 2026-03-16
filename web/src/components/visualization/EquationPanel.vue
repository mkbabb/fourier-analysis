<script setup lang="ts">
import { ref, computed } from "vue";
import { watchDebounced } from "@vueuse/core";
import { useWorkspaceStore } from "@/stores/workspace";
import { simplifyCoefficients, isAbortError } from "@/lib/equation/api";
import { energyColor } from "@/lib/equation/notation";
import type { NotationMode } from "@/lib/equation/types";
import SliderControl from "@/components/ui/SliderControl.vue";
import NotationPills from "@/components/equation/NotationPills.vue";
import { X } from "lucide-vue-next";
import katex from "katex";

const emit = defineEmits<{ close: [] }>();

const store = useWorkspaceStore();
const notation = ref<NotationMode>("trig");
const budget = ref(6);
const latex = ref("");
const energy = ref(1);
const loading = ref(false);
const error = ref<string | null>(null);

const renderedHtml = computed(() => {
    if (!latex.value) return "";
    try {
        return katex.renderToString(latex.value, {
            displayMode: true,
            throwOnError: false,
            trust: true,
        });
    } catch {
        return `<span class="text-red-400">${latex.value}</span>`;
    }
});

const eColor = computed(() => energyColor(energy.value));

async function fetchSimplified() {
    if (!store.epicycleData?.components.length) return;
    loading.value = true;
    error.value = null;
    try {
        const resp = await simplifyCoefficients(
            store.epicycleData.components,
            budget.value,
            notation.value,
        );
        latex.value = resp.latex;
        energy.value = resp.energy_captured;
    } catch (e) {
        if (!isAbortError(e)) {
            error.value = e instanceof Error ? e.message : "Failed";
        }
    } finally {
        loading.value = false;
    }
}

watchDebounced(
    () => [store.epicycleData, budget.value, notation.value] as const,
    () => fetchSimplified(),
    { debounce: 300, immediate: true },
);
</script>

<template>
    <div class="eq-panel">
        <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-medium text-foreground">Equation</span>
            <div class="flex items-center gap-2">
                <span class="fira-code text-sm" :style="{ color: eColor }">
                    {{ (energy * 100).toFixed(1) }}%
                </span>
                <button
                    class="flex items-center justify-center w-6 h-6 rounded-full
                           text-muted-foreground hover:bg-muted hover:text-foreground
                           transition-all duration-150 cursor-pointer"
                    @click="emit('close')"
                >
                    <X class="h-3.5 w-3.5" />
                </button>
            </div>
        </div>

        <div class="flex flex-col gap-1.5">
            <NotationPills v-model="notation" />
            <SliderControl
                label="Terms"
                :model-value="budget"
                :min="2" :max="20" :step="1"
                color="hsl(var(--viz-fourier))"
                @update:model-value="budget = $event"
            />
        </div>

        <div class="max-h-32 overflow-x-auto overflow-y-auto" style="scrollbar-width: thin;">
            <div v-if="loading" class="flex justify-center py-3">
                <div class="h-4 w-4 animate-spin rounded-full border-[1.5px] border-border border-t-primary" />
            </div>
            <div v-else-if="error" class="text-sm text-red-400 fira-code">{{ error }}</div>
            <div v-else v-html="renderedHtml" class="eq-katex" />
        </div>
    </div>
</template>

<style scoped>
@reference "tailwindcss";
.eq-panel {
    @apply absolute z-[15] flex flex-col gap-2 p-2.5 rounded-xl;
    top: 3.5rem;
    left: 0.5rem;
    max-width: min(28rem, calc(100% - 1rem));
    background: color-mix(in srgb, hsl(var(--background)) 75%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1.5px solid hsl(var(--border) / 0.3);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.eq-katex :deep(.katex-display) {
    @apply my-1 py-1;
}

.eq-katex :deep(.katex) {
    font-size: 0.9em;
}
</style>
