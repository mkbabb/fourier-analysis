<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { Search, X, Maximize2, Minimize2 } from "lucide-vue-next";
import type { PaperSearchState } from "./usePaperSearch";

const props = defineProps<{
    search: PaperSearchState;
    variant: "sidebar" | "floating";
    canExpand: boolean;
}>();

const emit = defineEmits<{
    expand: [];
}>();

const inputRef = ref<HTMLInputElement | null>(null);

// Auto-focus input when opened
watch(
    () => props.search.isOpen.value,
    (open) => {
        if (open) nextTick(() => inputRef.value?.focus());
    },
);

function focus() {
    inputRef.value?.focus();
}

defineExpose({ focus });
</script>

<template>
    <div class="paper-search-input-wrap">
        <Search class="paper-search-icon" />
        <input
            ref="inputRef"
            type="text"
            class="paper-search-input"
            placeholder="Search paper..."
            :value="search.query.value"
            @input="search.query.value = ($event.target as HTMLInputElement).value"
            @keydown="search.onKeydown"
            @focus="search.isOpen.value = true"
        />
        <button
            v-if="canExpand"
            class="paper-search-action-btn"
            @click="emit('expand')"
            :title="search.isExpanded.value ? 'Collapse' : 'Expand'"
        >
            <Maximize2 v-if="!search.isExpanded.value" class="h-3 w-3" />
            <Minimize2 v-else class="h-3 w-3" />
        </button>
        <button
            v-if="search.query.value"
            class="paper-search-action-btn"
            @click="search.close()"
            title="Clear search"
        >
            <X class="h-3 w-3" />
        </button>
    </div>
</template>
