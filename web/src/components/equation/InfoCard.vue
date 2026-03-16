<script setup lang="ts">
import { computed } from "vue";
import { Info } from "lucide-vue-next";
import { TIER_INFO, energyColor } from "@/lib/equation/notation";
import type { EquationTier } from "@/lib/equation/types";

const props = defineProps<{
    tier: EquationTier;
    energy: number;
}>();

const info = computed(() => TIER_INFO[props.tier] ?? TIER_INFO.spline);
const eColor = computed(() => energyColor(props.energy));
</script>

<template>
    <div class="cartoon-card px-3 py-2 space-y-2">
        <div class="flex items-center gap-2 flex-wrap">
            <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-sm font-semibold
                       border-[1.5px]"
                :style="{
                    background: `color-mix(in srgb, ${info.color} 15%, transparent)`,
                    borderColor: `color-mix(in srgb, ${info.color} 30%, transparent)`,
                    color: info.color,
                }"
            >
                {{ info.label }}
            </span>
            <span class="text-sm font-medium fira-code" :style="{ color: eColor }">
                {{ (energy * 100).toFixed(1) }}% energy captured
            </span>
        </div>
        <div class="flex gap-1.5 items-start text-sm text-muted-foreground">
            <Info class="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <p>{{ info.description }}</p>
        </div>
    </div>
</template>
