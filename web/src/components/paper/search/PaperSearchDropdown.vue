<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import type { PaperSearchState } from "./usePaperSearch";
import { TYPE_LABELS, resultLabel, highlightFuzzy } from "./searchHelpers";

const props = defineProps<{
    search: PaperSearchState;
    variant: "sidebar" | "floating";
}>();

const emit = defineEmits<{
    select: [id: string];
}>();

const resultsRef = ref<HTMLElement | null>(null);

// Scroll selected result into view (only when not expanded / modal)
watch(
    () => props.search.selectedIndex.value,
    () => {
        if (props.search.isExpanded.value) return;
        nextTick(() => {
            const el = resultsRef.value?.querySelector(".is-selected");
            el?.scrollIntoView({ block: "nearest" });
        });
    },
);

defineExpose({ resultsRef });
</script>

<template>
    <!-- Inline dropdown (non-expanded) -->
    <Transition name="search-dropdown">
        <div
            v-if="search.isOpen.value && !search.isExpanded.value && search.results.value.length > 0"
            ref="resultsRef"
            class="paper-search-results glass-elevated"
        >
            <button
                v-for="(r, i) in search.results.value"
                :key="`${r.id}-${r.type}-${i}`"
                class="paper-search-result"
                :class="{ 'is-selected': i === search.selectedIndex.value }"
                @click="search.selectResult(r)"
                @mouseenter="search.selectedIndex.value = i"
            >
                <span class="paper-search-badge" :data-type="r.type">
                    {{ TYPE_LABELS[r.type] ?? r.type }}
                </span>
                <span v-if="r.number" class="paper-search-number fira-code">
                    {{ r.number }}
                </span>
                <span
                    class="paper-search-label"
                    v-html="highlightFuzzy(resultLabel(r), search.query.value)"
                />
            </button>
        </div>
    </Transition>

    <!-- Backdrop for inline dropdown (floating variant only) -->
    <div
        v-if="variant === 'floating' && search.isOpen.value && !search.isExpanded.value && search.results.value.length > 0"
        class="paper-search-backdrop"
        @click="search.close()"
    />
</template>
