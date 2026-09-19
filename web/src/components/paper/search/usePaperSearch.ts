/**
 * Vue composable for paper search — manages reactive state, debouncing,
 * keyboard navigation, modal expand, and result selection.
 */
import { ref, watch, computed, useId, type ComputedRef } from "vue";
import type { PaperSectionData } from "@mkbabb/latex-paper";
import { buildSearchIndex, searchIndex, type SearchResult } from "./paperSearchIndex";

export function usePaperSearch(options: {
    sections: PaperSectionData[];
    navigateTo: (id: string) => void;
}) {
    const index = buildSearchIndex(options.sections);

    // ── `PV ★MF-2` — the ARIA wiring for a combobox that had none ──────────
    // The surface implements a full combobox/listbox keyboard model and shipped
    // one `aria-` attribute in the whole directory. Ids minted here because the
    // input, the listbox and the rows live in three different components and
    // must agree on them.
    const uid = useId();
    const listboxId = `paper-search-listbox-${uid}`;
    const optionId = (i: number) => `paper-search-option-${uid}-${i}`;

    const query = ref("");
    const isOpen = ref(false);
    const isExpanded = ref(false);
    const selectedIndex = ref(0);
    const debouncedQuery = ref("");

    // Inline debounce
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    watch(query, (val) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            debouncedQuery.value = val;
        }, 120);
    });

    const results: ComputedRef<SearchResult[]> = computed(() =>
        searchIndex(index, debouncedQuery.value, 30),
    );

    watch(results, () => {
        selectedIndex.value = 0;
    });

    function selectResult(r: SearchResult) {
        options.navigateTo(r.id);
        close();
    }

    function close() {
        isOpen.value = false;
        isExpanded.value = false;
        query.value = "";
        selectedIndex.value = 0;
    }

    function open() {
        isOpen.value = true;
    }

    function toggleExpanded() {
        isExpanded.value = !isExpanded.value;
    }

    function onKeydown(e: KeyboardEvent) {
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                if (selectedIndex.value < results.value.length - 1) {
                    selectedIndex.value++;
                }
                break;
            case "ArrowUp":
                e.preventDefault();
                if (selectedIndex.value > 0) {
                    selectedIndex.value--;
                }
                break;
            case "Enter":
                e.preventDefault();
                if (results.value[selectedIndex.value]) {
                    selectResult(results.value[selectedIndex.value]);
                }
                break;
            case "Escape":
                e.preventDefault();
                if (isExpanded.value) {
                    isExpanded.value = false;
                } else {
                    close();
                }
                break;
        }
    }

    return {
        query,
        results,
        isOpen,
        isExpanded,
        selectedIndex,
        selectResult,
        close,
        open,
        toggleExpanded,
        onKeydown,
        listboxId,
        optionId,
    };
}

export type PaperSearchState = ReturnType<typeof usePaperSearch>;
