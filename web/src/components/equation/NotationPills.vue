<script setup lang="ts">
import { Button } from "@mkbabb/glass-ui/button";
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
        <Button
            v-for="opt in NOTATION_OPTIONS"
            :key="opt.value"
            variant="outline"
            size="sm"
            class="notation-pill"
            :class="{ 'notation-active': modelValue === opt.value }"
            :style="modelValue === opt.value ? { '--pill-color': opt.color } : {}"
            @click="emit('update:modelValue', opt.value)"
        >
            <span class="cm-serif font-semibold text-[1.3em] leading-none min-w-[1.2em] h-[1em]
                         inline-flex items-center justify-center">
                {{ opt.icon }}
            </span>
            {{ opt.label }}
        </Button>
    </div>
</template>

<style scoped>
.notation-pill {
    border-radius: 9999px;
    min-width: 4.5rem;
    justify-content: center;
}
.notation-active {
    background: color-mix(in srgb, var(--pill-color) 12%, transparent);
    border-color: color-mix(in srgb, var(--pill-color) 40%, transparent);
    color: var(--pill-color);
}
</style>
