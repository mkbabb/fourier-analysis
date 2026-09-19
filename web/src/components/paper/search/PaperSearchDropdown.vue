<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import type { PaperSearchState } from "./usePaperSearch";
import PaperSearchResultRow from "./PaperSearchResultRow.vue";

const props = defineProps<{
    search: PaperSearchState;
    variant: "sidebar" | "floating";
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
            :id="search.listboxId"
            ref="resultsRef"
            class="paper-search-results glass-floating"
            :class="`paper-search-results--${variant}`"
            role="listbox"
            aria-label="Search results"
        >
            <PaperSearchResultRow
                v-for="(r, i) in search.results.value"
                :key="r.key"
                :id="search.optionId(i)"
                role="option"
                :result="r"
                :query="search.query.value"
                :selected="i === search.selectedIndex.value"
                @select="search.selectResult(r)"
                @hover="search.selectedIndex.value = i"
            />
        </div>
    </Transition>

    <!-- Backdrop for inline dropdown (floating variant only) -->
    <div
        v-if="variant === 'floating' && search.isOpen.value && !search.isExpanded.value && search.results.value.length > 0"
        class="paper-search-backdrop"
        @click="search.close()"
    />
</template>

<style scoped>
@reference "tailwindcss";
/* X·F F.W4 `.e` — `PSM-1`: this component's ENTIRE subtree was orphaned, and
   not by the single-root rule — it has TWO template roots (the Transition and
   the backdrop), so it is a real fragment with no root to inherit the parent's
   scope id at all. Its rules live here now. */
.paper-search-results {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: var(--z-bar);
    max-height: 50vh;
    overflow-y: auto;
    overscroll-behavior: contain;
    border: 1.5px solid var(--border);
    border-radius: calc(var(--radius) - 2px);
    box-shadow: var(--shadow-md);
    padding: 0.25rem;
}

.paper-search-results--floating {
    border-radius: 0;
    border-left: none;
    border-right: none;
    top: 100%;
    max-height: 60vh;
}

.paper-search-backdrop {
    position: fixed;
    inset: 0;
    z-index: var(--z-bar);
}

/* ── Inline dropdown transition ──────────────────────────── */
/* A.W3.d — bezier→`--ease-out-expo`. */
.search-dropdown-enter-active,
.search-dropdown-leave-active {
    transition:
        opacity 0.15s var(--ease-standard),
        transform 0.15s var(--ease-out-expo);
}

.search-dropdown-enter-from,
.search-dropdown-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
</style>
