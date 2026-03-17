<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from "vue";

export interface TabOption {
    label: string;
    value: string;
}

const props = defineProps<{
    options: TabOption[];
    modelValue: string;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: string];
}>();

const containerRef = ref<HTMLElement>();
const buttonRefs = ref<HTMLElement[]>([]);
const underlineStyle = ref({ width: "0px", transform: "translateX(0px)" });

function updateUnderline() {
    const idx = props.options.findIndex((o) => o.value === props.modelValue);
    if (idx < 0 || !buttonRefs.value[idx]) return;
    const btn = buttonRefs.value[idx];
    underlineStyle.value = {
        width: `${btn.offsetWidth}px`,
        transform: `translateX(${btn.offsetLeft}px)`,
    };
}

function select(value: string) {
    emit("update:modelValue", value);
}

let ro: ResizeObserver | null = null;

onMounted(() => {
    updateUnderline();
    if (containerRef.value) {
        ro = new ResizeObserver(() => updateUnderline());
        ro.observe(containerRef.value);
    }
});

onBeforeUnmount(() => {
    ro?.disconnect();
});

watch(() => props.modelValue, () => nextTick(() => updateUnderline()));
</script>

<template>
    <div ref="containerRef" class="underline-tabs">
        <div class="underline-indicator" :style="underlineStyle" />
        <button
            v-for="(option, idx) in options"
            :key="option.value"
            :ref="(el) => { if (el) buttonRefs[idx] = el as HTMLElement }"
            class="underline-tab"
            :class="{ 'is-active': modelValue === option.value }"
            @click="select(option.value)"
        >
            {{ option.label }}
        </button>
    </div>
</template>

<style scoped>
.underline-tabs {
    position: relative;
    display: flex;
    gap: 0.25rem;
}

.underline-indicator {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    background: hsl(var(--foreground));
    border-radius: 1px;
    transition:
        transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
        width 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.underline-tab {
    position: relative;
    padding: 0.25rem 0.75rem;
    border: none;
    background: none;
    font-family: var(--font-serif);
    font-size: 1.125rem;
    font-weight: 500;
    color: hsl(var(--muted-foreground));
    cursor: pointer;
    transition: color 0.2s ease;
    white-space: nowrap;
    -webkit-tap-highlight-color: transparent;
    border-radius: 0.25rem;
}

.underline-tab:hover:not(.is-active) {
    color: hsl(var(--foreground) / 0.7);
}

.underline-tab.is-active {
    color: hsl(var(--foreground));
}

.underline-tab:focus-visible {
    outline: 2px solid hsl(var(--ring));
    outline-offset: 2px;
}
</style>
