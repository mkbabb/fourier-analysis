<script setup lang="ts">
import { computed } from "vue";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const props = withDefaults(
    defineProps<{
        modelValue: number;
        compact?: boolean;
    }>(),
    { compact: false },
);

const emit = defineEmits<{
    (e: "update:modelValue", v: number): void;
}>();

const speedStr = computed({
    get: () => String(props.modelValue),
    set: (v: string) => emit("update:modelValue", parseFloat(v)),
});
</script>

<template>
    <Select v-model="speedStr">
        <SelectTrigger :class="compact ? 'speed-trigger-compact' : 'speed-trigger'">
            <SelectValue />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="0.25">0.25&times;</SelectItem>
            <SelectItem value="0.5">0.5&times;</SelectItem>
            <SelectItem value="1">1&times;</SelectItem>
            <SelectItem value="2">2&times;</SelectItem>
            <SelectItem value="4">4&times;</SelectItem>
        </SelectContent>
    </Select>
</template>

<style scoped>
.speed-trigger {
    height: 1.75rem;
    width: 3.5rem;
    flex-shrink: 0;
    font-family: "Fira Code", monospace;
    font-size: 0.75rem;
    border: none;
    background: none;
    border-radius: 0.375rem;
    color: hsl(var(--muted-foreground));
}

.speed-trigger-compact {
    height: 2rem;
    width: 4rem;
    flex-shrink: 0;
    font-family: "Fira Code", monospace;
    font-size: 0.75rem;
    border: 1.5px solid hsl(var(--foreground) / 0.15);
    border-radius: 0.375rem;
}
</style>
