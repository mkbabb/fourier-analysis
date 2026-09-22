<script setup lang="ts">
/**
 * X·F F.W4 `.e` — ONE result row, and the one home for its rules.
 *
 * `PSM-18`: the twenty lines of row markup were duplicated verbatim between the
 * dropdown and the modal and had already drifted through the modal's re-tunes.
 * `PSM-1`: the rules that painted them lived in a third file, orphaned by
 * scoping. Both dissolve the same way — the row is a component, and its markup
 * and its styles are in it.
 */
import { Button } from "@mkbabb/glass-ui/button";
import type { SearchResult } from "./paperSearchIndex";
import { TYPE_LABELS, resultLabel, highlightFuzzy } from "./searchHelpers";

defineProps<{
    result: SearchResult;
    query: string;
    selected: boolean;
    /** The modal's roomier register; the dropdown ships the compact one. */
    dense?: boolean;
}>();

const emit = defineEmits<{
    select: [];
    hover: [];
}>();
</script>

<template>
    <Button
        emphasis="quiet"
        type="button"
        role="option"
        :aria-selected="selected"
        class="paper-search-result"
        :class="{ 'is-selected': selected, 'paper-search-result--roomy': dense }"
        @click="emit('select')"
        @pointermove="emit('hover')"
    >
        <span class="paper-search-badge" :data-type="result.type">
            {{ TYPE_LABELS[result.type] ?? result.type }}
        </span>
        <span v-if="result.number" class="paper-search-number fira-code">
            {{ result.number }}
        </span>
        <span
            class="paper-search-label"
            v-html="highlightFuzzy(resultLabel(result), query)"
        />
    </Button>
</template>

<style scoped>
@reference "tailwindcss";
.paper-search-result {
    display: flex;
    align-items: baseline;
    gap: 0.375rem;
    width: 100%;
    padding: 0.35rem 0.5rem;
    border: none;
    background: none;
    cursor: pointer;
    text-align: left;
    border-radius: calc(var(--radius) - 4px);
    transition: background-color 0.1s var(--ease-standard);
}

.paper-search-result:hover,
.paper-search-result.is-selected {
    background: color-mix(in srgb, var(--muted) 50%, transparent);
}

.paper-search-badge {
    flex-shrink: 0;
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 0.1rem 0.3rem;
    border-radius: var(--radius-xs);
    background: var(--muted);
    /* `PSM-4`: was `color-mix(--muted-foreground 70%, transparent)`. */
    color: var(--muted-foreground);
    line-height: 1;
}

/* `PSM-20`: the three hardcoded HSL literals had no dark arm at all — one rule
   block away from the `color-mix(var(--primary))` idiom their neighbour uses.
   The section ramp is the app's own themed register for exactly this, and it
   carries both arms. */
.paper-search-badge[data-type="theorem"],
.paper-search-badge[data-type="lemma"],
.paper-search-badge[data-type="proposition"],
.paper-search-badge[data-type="corollary"] {
    background: color-mix(in srgb, var(--primary) 12%, transparent);
    color: var(--primary);
}

.paper-search-badge[data-type="definition"] {
    background: color-mix(in srgb, var(--section-color-2) 12%, transparent);
    color: var(--section-color-2);
}

.paper-search-badge[data-type="equation"] {
    background: color-mix(in srgb, var(--section-color-7) 12%, transparent);
    color: var(--section-color-7);
}

.paper-search-number {
    flex-shrink: 0;
    font-size: 0.68rem;
    color: var(--muted-foreground);
}

.paper-search-label {
    flex: 1;
    min-width: 0;
    @apply text-sm;
    color: var(--foreground);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.4;
}

.paper-search-label :deep(mark) {
    background: color-mix(in srgb, var(--warning) 35%, transparent);
    color: inherit;
    border-radius: var(--radius-floor);
    padding: 0 1px;
}

/* The modal's register, authored there as `.search-modal-result` re-tunes —
   the drift `PSM-18` measured. One row, one scale switch. */
.paper-search-result--roomy {
    padding: 0.5rem 0.625rem;
}

.paper-search-result--roomy .paper-search-badge {
    font-size: 0.65rem;
    padding: 0.125rem 0.375rem;
}

.paper-search-result--roomy .paper-search-number {
    font-size: 0.72rem;
}

.paper-search-result--roomy .paper-search-label {
    @apply text-base;
}
</style>
