<script setup lang="ts">
/**
 * The ⌘K search palette.
 *
 * X.F.W14U.paper — UIA-F-64 (⊕ F-160, F-235 on this surface): every control is
 * a glass primitive. The palette was hand-built from a Dialog, a raw `<input>`
 * with a local focus ring, `Button role="option"` rows (thirty tab stops) and
 * an inline-style plate geometry; it is now glass `Command`: `CommandInput`
 * (the combobox), `CommandList` (the listbox, the producer's scroll fade),
 * one `CommandGroup` per result type, `CommandItem` rows on the producer's
 * row register with one highlighted descendant, and `CommandEmpty`.
 *
 * Why `Dialog` + `Command` and not `CommandDialog`: the paper ranks its own
 * results (`usePaperSearch`, word-start matching, UIA-F-161), so the list must
 * not be re-filtered by reka's substring `contains`. `Command` forwards root
 * props (`ignore-filter`); `CommandDialog` at glass 10.1.0 drops its
 * attributes (`inheritAttrs: false`, only `modelValue`/`open` reach its
 * `Command`), so a consumer-ranked list cannot be hosted in it. That is a
 * glass half (relayed by id in the unit's receipt); this composition is
 * `CommandDialog`'s own (Dialog → DialogContent `dismiss="deliberate"` →
 * Command, with Command's `open` driving the dialog's) and is replaced by it
 * when the producer forwards the prop.
 *
 * The query is the paper's (`usePaperSearch`), so reka's own search-term
 * resets are off: `reset-search-term-on-select` runs once at mount (an
 * immediate watcher) and emptied the query the palette was opened with (⌘K
 * from the field, UIA-F-159); `reset-search-term-on-blur` would empty it on
 * the Esc collapse that UIA-F-25 keeps it through.
 *
 * Kept: UIA-F-25 (one dismissal owner — `deliberate`, Esc collapses and keeps
 * the query), UIA-F-63 (an empty query is not a miss), UIA-F-65 (Clear empties
 * and keeps focus), `C-7` (the field's name is its `aria-label`).
 */
import { computed, nextTick, ref } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@mkbabb/glass-ui/dialog";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@mkbabb/glass-ui/command";
import type { PaperSearchState } from "./usePaperSearch";
import PaperSearchResultRow from "./PaperSearchResultRow.vue";
import { TYPE_GROUPS, groupByType } from "./searchHelpers";

const props = defineProps<{
    search: PaperSearchState;
}>();

const groups = computed(() => groupByType(props.search.results.value));

const inputRef = ref<InstanceType<typeof CommandInput> | null>(null);

function focusInput() {
    (inputRef.value?.$el as HTMLElement | undefined)?.querySelector("input")?.focus();
}

function clearQuery() {
    props.search.clear();
    nextTick(focusInput);
}

function setOpen(open: boolean) {
    props.search.isExpanded.value = open;
}
</script>

<template>
    <Dialog modal :open="search.isExpanded.value" @update:open="setOpen">
        <DialogContent class="search-palette" dismiss="deliberate">
            <DialogTitle class="sr-only">Search the paper</DialogTitle>
            <DialogDescription class="sr-only">
                Type to search sections, theorems, equations and figures. Use the up and
                down arrows to move through the results and Enter to go to one.
            </DialogDescription>
            <Command
                ignore-filter
                :reset-search-term-on-blur="false"
                :reset-search-term-on-select="false"
                :open="search.isExpanded.value"
                @update:open="setOpen"
            >
                <div class="search-palette-field">
                    <CommandInput
                        ref="inputRef"
                        auto-focus
                        placeholder="Search paper..."
                        aria-label="Search the paper"
                        spellcheck="false"
                        :model-value="search.query.value"
                        @update:model-value="(q: string) => (search.query.value = q)"
                    />
                    <!-- UIA-F-25 / F-65: Clear shows only with a query, and it
                         clears; dismissal is the dialog's (Esc, outside). -->
                    <Button
                        v-if="search.query.value"
                        emphasis="quiet"
                        size="sm"
                        type="button"
                        class="search-palette-clear"
                        @click="clearQuery"
                    >
                        Clear
                    </Button>
                </div>
                <CommandList>
                    <CommandEmpty>
                        {{
                            search.debouncedQuery.value
                                ? "No results"
                                : "Search theorems, equations, figures and sections"
                        }}
                    </CommandEmpty>
                    <CommandGroup
                        v-for="group in groups"
                        :key="group.type"
                        :heading="TYPE_GROUPS[group.type] ?? group.type"
                    >
                        <CommandItem
                            v-for="r in group.items"
                            :key="r.key"
                            :value="r.key"
                            @select="search.selectResult(r)"
                        >
                            <PaperSearchResultRow :result="r" :query="search.debouncedQuery.value" />
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </Command>
            <!-- UIA-F-235: the keyboard legend is for a keyboard; a touch
                 reader never sees it (`(hover: hover)` below). -->
            <div class="search-palette-legend" aria-hidden="true">
                <span class="search-palette-hint fira-code">
                    <kbd class="kbd">&uarr;</kbd><kbd class="kbd">&darr;</kbd> navigate
                </span>
                <span class="search-palette-hint fira-code">
                    <kbd class="kbd">&crarr;</kbd> select
                </span>
                <span class="search-palette-hint fira-code">
                    <kbd class="kbd">esc</kbd> collapse
                </span>
            </div>
        </DialogContent>
    </Dialog>
</template>

<style scoped>
/* What is left here is layout only: the palette's column, the Clear beside the
   producer's input, and the legend row. Plate, scrim, input, rows, groups,
   empty state and scroll fade are the producer's (`DialogContent`, `Command*`).
   The inline-style geometry (`top`/`translate`/`inline-size`/`max-block-size`,
   UIA-F-64) is gone: the palette sits where glass's dialog sits. */
.search-palette {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.search-palette-field {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.search-palette-field > :first-child {
    flex: 1;
    min-width: 0;
}

.search-palette-legend {
    display: none;
    align-items: center;
    gap: 1rem;
    padding-inline: 0.75rem;
}

/* UIA-F-235: a keyboard legend on a keyboard-and-pointer device only. */
@media (hover: hover) and (pointer: fine) {
    .search-palette-legend {
        display: flex;
    }
}

.search-palette-hint {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--type-caption);
    /* `PSM-4`: the strong rung on the producer's translucent plate. */
    color: var(--muted-foreground-strong);
}
</style>
