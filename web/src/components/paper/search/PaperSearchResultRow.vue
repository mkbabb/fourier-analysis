<script setup lang="ts">
/**
 * X·F F.W4 `.e` — ONE result row, and the one home for its rules.
 *
 * `PSM-18`: the twenty lines of row markup were duplicated verbatim between the
 * dropdown and the modal and had already drifted through the modal's re-tunes.
 * `PSM-1`: the rules that painted them lived in a third file, orphaned by
 * scoping. Both dissolve the same way — the row is a component, and its markup
 * and its styles are in it.
 *
 * X.F.W14U.paper — UIA-F-160 / UIA-F-64 / UIA-F-235: this is the row's CONTENT
 * (type, number, label) and nothing else. The option that holds it belongs to
 * its host: the palette's is glass `CommandItem` (the producer's row register,
 * one highlighted descendant, never a tab stop), the inline panel's is a
 * `role="option"` element in `PaperSearchDropdown`. The row used to be a
 * `Button role="option"` — thirty tab stops appended to `<body>` — and a
 * `dense` prop switched the modal to a `--roomy` register; both are gone.
 * The type is glass `Badge` (the canon chip, not a 9.6px local one).
 */
import { inject } from "vue";
import { PAPER_CONTEXT } from "@mkbabb/latex-paper/vue";
import { Badge } from "@mkbabb/glass-ui/badge";
import type { PaperSearchResult } from "./paperSearchIndex";
import { TYPE_LABELS, highlightLabel } from "./searchHelpers";

// UIA-F-21: the label's math is typeset by the paper's own KaTeX (its macros).
const paper = inject(PAPER_CONTEXT);
if (!paper) throw new Error("PaperSearchResultRow renders inside PaperView's PAPER_CONTEXT");
const renderMath = paper.renderInline;

defineProps<{
    result: PaperSearchResult;
    query: string;
}>();
</script>

<template>
    <span class="paper-search-row">
        <Badge
            variant="secondary"
            size="sm"
            class="paper-search-badge"
            :data-type="result.type"
        >
            {{ TYPE_LABELS[result.type] ?? result.type }}
        </Badge>
        <span v-if="result.number" class="paper-search-number fira-code">
            {{ result.number }}
        </span>
        <span
            class="paper-search-label"
            v-html="highlightLabel(result, query, renderMath)"
        />
    </span>
</template>

<style scoped>
@reference "tailwindcss";
.paper-search-row {
    display: flex;
    align-items: baseline;
    gap: 0.375rem;
    width: 100%;
    min-width: 0;
    text-align: start;
}

.paper-search-badge {
    flex-shrink: 0;
    text-transform: uppercase;
}

.paper-search-number {
    flex-shrink: 0;
    font-size: var(--type-caption);
    color: var(--muted-foreground);
}

.paper-search-label {
    flex: 1;
    min-width: 0;
    @apply text-sm;
    color: var(--foreground);
    /* X.F.W14V.r4 — A2-FO-X-7 x UIA-F-59, §0dy (no ellipsis): the full title,
       wrapped, never cut — the balanced last line of `pretty`, and a long
       unbroken token breaks rather than overflowing the plate. */
    text-wrap: pretty;
    overflow-wrap: anywhere;
    line-height: 1.4;
}

.paper-search-label :deep(mark) {
    background: color-mix(in srgb, var(--warning) 35%, transparent);
    color: inherit;
    border-radius: var(--radius-floor);
    padding: 0 1px;
}
</style>
