/**
 * Vue composable for paper search — manages reactive state, debouncing,
 * keyboard navigation, modal expand, and result selection.
 */
import {
    ref,
    watch,
    computed,
    onScopeDispose,
    useId,
    type ComputedRef,
} from "vue";
import type { PaperSectionData } from "@mkbabb/latex-paper";
import {
    buildSearchIndex,
    clearSearchCache,
    searchIndex,
    type SearchEntry,
    type SearchResult,
} from "./paperSearchIndex";

export function usePaperSearch(options: {
    sections: PaperSectionData[];
    navigateTo: (id: string) => void;
}) {
    /**
     * `PSM-31`: the index was built eagerly in the setup body on EVERY
     * `PaperView` mount — five `toLowerCase()` per entry over ≤500-char slices,
     * search opened or not, on a route that carries its own performance spec.
     * It is built on first use and then kept.
     */
    let _index: SearchEntry[] | null = null;
    function index(): SearchEntry[] {
        _index ??= buildSearchIndex(options.sections);
        return _index;
    }

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
        debouncedQuery.value ? searchIndex(index(), debouncedQuery.value, 30) : [],
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
        // `PSM-27`: `close()` was not synchronous. It cleared `query`, but
        // `debouncedQuery` — and therefore `results` — lagged 120ms, and the
        // memo only cleared on the next empty-query call, so reopening inside
        // that window painted the PREVIOUS search's rows under an empty input.
        // Everything the close claims to clear is cleared in this tick.
        clearTimeout(debounceTimer);
        debouncedQuery.value = "";
        if (_index) clearSearchCache(_index);
    }

    function open() {
        isOpen.value = true;
    }

    /** `PSM-42` / `L/D27`: ⌘K opens the palette, not just the dropdown. */
    function openPalette() {
        isOpen.value = true;
        isExpanded.value = true;
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

    // `PSM-22` / `C-18` = `L/D18`: the debounce timer was never cleared on
    // scope disposal and the memo was module-global. Both are owned here now,
    // and the composable reaps them when its scope ends.
    onScopeDispose(() => {
        clearTimeout(debounceTimer);
        if (_index) clearSearchCache(_index);
    });

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
        openPalette,
        onKeydown,
        listboxId,
        optionId,
    };
}

export type PaperSearchState = ReturnType<typeof usePaperSearch>;
