<script setup lang="ts">
import { NOTATION_OPTIONS } from "@/lib/equation/notation";
import type { NotationMode } from "@/lib/equation/types";

defineProps<{
    modelValue: NotationMode;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: NotationMode];
}>();
</script>

<template>
    <div class="flex flex-wrap justify-center gap-1.5">
        <button
            v-for="opt in NOTATION_OPTIONS"
            :key="opt.value"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium
                   border-2 whitespace-nowrap cursor-pointer transition-all duration-200
                   min-w-[4.5rem] justify-center"
            :class="modelValue === opt.value
                ? 'notation-active'
                : 'border-foreground/12 bg-transparent text-muted-foreground hover:border-foreground/25'"
            :style="modelValue === opt.value ? { '--pill-color': opt.color } : {}"
            @click="emit('update:modelValue', opt.value)"
        >
            <span class="cm-serif font-semibold text-[1.3em] leading-none min-w-[1.2em] h-[1em]
                         inline-flex items-center justify-center">
                {{ opt.icon }}
            </span>
            {{ opt.label }}
        </button>
    </div>
</template>

<style scoped>
.notation-active {
    background: color-mix(in srgb, var(--pill-color) 12%, transparent);
    border-color: color-mix(in srgb, var(--pill-color) 40%, transparent);
    color: var(--pill-color);
}
</style>
