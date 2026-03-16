<script setup lang="ts">
import { computed, ref } from "vue";
import { Check, Copy } from "lucide-vue-next";
import katex from "katex";

const props = defineProps<{
    latex: string;
}>();

const copied = ref(false);

const renderedHtml = computed(() => {
    if (!props.latex) return "";
    try {
        return katex.renderToString(props.latex, {
            displayMode: true,
            throwOnError: false,
            trust: true,
        });
    } catch {
        return `<code>${props.latex}</code>`;
    }
});

async function copyLatex() {
    await navigator.clipboard.writeText(props.latex);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
}
</script>

<template>
    <div class="eq-result-root">
        <div class="eq-scroll-region" v-html="renderedHtml" />
        <button
            class="glass-btn copy-pos"
            title="Copy LaTeX"
            @click="copyLatex"
        >
            <Transition name="icon-swap" mode="out-in">
                <Check v-if="copied" class="h-4.5 w-4.5 text-green-500" />
                <Copy v-else class="h-4.5 w-4.5" />
            </Transition>
        </button>
    </div>
</template>

<style scoped>
@reference "tailwindcss";

.eq-result-root {
    position: relative;
}

/* Scrollable equation region — horizontal scroll, no vertical clip */
.eq-scroll-region {
    width: 100%;
    text-align: center;
    padding: 2rem 1rem 1rem;
    min-height: 4.5rem;
    overflow-x: auto;
    scrollbar-width: thin;
}

/* Override global katex-display to prevent clipping fractions */
.eq-scroll-region :deep(.katex-display) {
    margin: 0;
    padding: 0.5rem 0;
    overflow: visible !important;
}

.eq-scroll-region :deep(.katex) {
    font-size: 1.4em;
    overflow: visible;
}

@media (min-width: 768px) {
    .eq-scroll-region :deep(.katex) {
        font-size: 1.8em;
    }
}

.copy-pos {
    position: absolute;
    z-index: 20;
    top: 0.5rem;
    right: 0.5rem;
}

.icon-swap-enter-active,
.icon-swap-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}
.icon-swap-enter-from { opacity: 0; transform: scale(0.8); }
.icon-swap-leave-to { opacity: 0; transform: scale(0.8); }
</style>
