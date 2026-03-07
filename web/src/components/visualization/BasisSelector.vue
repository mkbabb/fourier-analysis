<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { Collapsible } from "@/components/ui/collapsible";

const basisDisplay: Record<string, { icon: string; label: string; color: string }> = {
    fourier: { icon: "\u2131", label: "Fourier", color: "#ff3412" },
    chebyshev: { icon: "T\u2099", label: "Chebyshev", color: "#3b82f6" },
    legendre: { icon: "P\u2099", label: "Legendre", color: "#a855f7" },
};

const fourierModes = ["fourier-epicycles", "fourier-series"] as const;

const props = defineProps<{
    activeBases?: string[];
}>();

const emit = defineEmits<{
    (e: "update:activeBases", bases: string[]): void;
}>();

const selected = ref<string[]>(props.activeBases ?? ["fourier-epicycles"]);

watch(() => props.activeBases, (v) => { if (v) selected.value = [...v]; });

const fourierMode = computed(() => {
    if (selected.value.includes("fourier-epicycles")) return "fourier-epicycles";
    if (selected.value.includes("fourier-series")) return "fourier-series";
    return null;
});

const fourierLabel = computed(() => {
    if (fourierMode.value === "fourier-epicycles") return "Epicycles";
    if (fourierMode.value === "fourier-series") return "Series";
    return "Fourier";
});

function isBasisActive(key: string): boolean {
    if (key === "fourier") return fourierMode.value !== null;
    return selected.value.includes(key);
}

function getBasisLabel(key: string, info: { label: string }): string {
    if (key === "fourier") return fourierLabel.value;
    return info.label;
}

function toggleBasis(key: string) {
    if (key === "fourier") {
        // Cycle: epicycles -> series -> off -> epicycles
        const hasEpi = selected.value.includes("fourier-epicycles");
        const hasSeries = selected.value.includes("fourier-series");
        const otherBases = selected.value.filter(b => !b.startsWith("fourier"));
        selected.value = [...otherBases];
        if (hasEpi) {
            selected.value.push("fourier-series");
        } else if (hasSeries) {
            // Go to "off" only if other bases keep the selection non-empty
            if (otherBases.length === 0) {
                // Can't be empty — cycle back to epicycles
                selected.value.push("fourier-epicycles");
            }
            // else: fourier is off, other bases remain
        } else {
            selected.value.push("fourier-epicycles");
        }
    } else {
        const idx = selected.value.indexOf(key);
        if (idx >= 0) {
            if (selected.value.length <= 1) return;
            selected.value.splice(idx, 1);
        } else {
            selected.value.push(key);
        }
    }
    emit("update:activeBases", [...selected.value]);
}
</script>

<template>
    <div class="cartoon-card p-3">
        <Collapsible title="Basis" :default-open="true">
            <div class="flex flex-nowrap gap-1.5 overflow-x-auto pt-1">
                <button v-for="(info, key) in basisDisplay" :key="key"
                    class="basis-pill"
                    :class="{ active: isBasisActive(key as string) }"
                    :style="isBasisActive(key as string) ? { '--pill-color': info.color } : {}"
                    @click="toggleBasis(key as string)"
                >
                    <span class="basis-icon cm-serif font-semibold">{{ info.icon }}</span>
                    {{ getBasisLabel(key as string, info) }}
                </button>
            </div>
        </Collapsible>
    </div>
</template>

<style scoped>
.basis-icon {
    display: inline-flex;
    align-items: center;
    font-size: 1.3em;
    line-height: 1;
    min-width: 1.2em;
    justify-content: center;
}
.basis-pill {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.375rem 0.625rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    border: 1.5px solid hsl(var(--foreground) / 0.12);
    background: transparent;
    color: hsl(var(--muted-foreground));
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    flex-shrink: 0;
}
.basis-pill:hover {
    border-color: hsl(var(--foreground) / 0.25);
}
.basis-pill.active {
    background: color-mix(in srgb, var(--pill-color) 12%, transparent);
    border-color: color-mix(in srgb, var(--pill-color) 40%, transparent);
    color: var(--pill-color);
}
</style>
