<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { Search, X, Minimize2 } from "lucide-vue-next";
import type { PaperSearchState } from "./usePaperSearch";
import { TYPE_LABELS, resultLabel, highlightFuzzy } from "./searchHelpers";

const props = defineProps<{
    search: PaperSearchState;
}>();

const emit = defineEmits<{
    select: [id: string];
}>();

const modalInputRef = ref<HTMLInputElement | null>(null);

// Focus modal input when expanded
watch(
    () => props.search.isExpanded.value,
    (expanded) => {
        if (expanded) nextTick(() => modalInputRef.value?.focus());
    },
);

// Scroll selected result into view inside the modal
watch(
    () => props.search.selectedIndex.value,
    () => {
        if (!props.search.isExpanded.value) return;
        nextTick(() => {
            const container = document.querySelector(".search-modal-results");
            const el = container?.querySelector(".is-selected");
            el?.scrollIntoView({ block: "nearest" });
        });
    },
);
</script>

<template>
    <Teleport to="body">
        <Transition name="search-modal">
            <div
                v-if="search.isExpanded.value"
                class="search-modal-overlay"
                @click.self="search.toggleExpanded()"
            >
                <div class="search-modal" @click.stop>
                    <!-- Modal header with input -->
                    <div class="search-modal-header">
                        <Search class="search-modal-icon" />
                        <input
                            ref="modalInputRef"
                            type="text"
                            class="search-modal-input"
                            placeholder="Search paper..."
                            :value="search.query.value"
                            @input="search.query.value = ($event.target as HTMLInputElement).value"
                            @keydown="search.onKeydown"
                        />
                        <button
                            class="paper-search-action-btn"
                            @click="search.toggleExpanded()"
                            title="Collapse"
                        >
                            <Minimize2 class="h-3.5 w-3.5" />
                        </button>
                        <button
                            class="paper-search-action-btn"
                            @click="search.close()"
                            title="Close"
                        >
                            <X class="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <!-- Modal results -->
                    <div class="search-modal-results" v-if="search.results.value.length > 0">
                        <button
                            v-for="(r, i) in search.results.value"
                            :key="`modal-${r.id}-${r.type}-${i}`"
                            class="paper-search-result search-modal-result"
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
                    <div v-else class="search-modal-empty">
                        No results
                    </div>

                    <!-- Modal footer -->
                    <div class="search-modal-footer">
                        <span class="search-modal-hint fira-code">
                            <kbd>&uarr;</kbd><kbd>&darr;</kbd> navigate
                        </span>
                        <span class="search-modal-hint fira-code">
                            <kbd>&crarr;</kbd> select
                        </span>
                        <span class="search-modal-hint fira-code">
                            <kbd>esc</kbd> close
                        </span>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
