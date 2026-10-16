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
import type { PaperLabelInfo, PaperSectionData } from "@mkbabb/latex-paper";
import {
    buildSearchIndex,
    clearPaperSearchCache,
    searchPaper,
    type SearchEntry,
    type PaperSearchResult,
} from "./paperSearchIndex";

export function usePaperSearch(options: {
    sections: PaperSectionData[];
    /** UIA-F-26: resolves a labelled entry's `\label` key to its DOM anchor. */
    labelMap: Record<string, PaperLabelInfo>;
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
        _index ??= buildSearchIndex(options.sections, options.labelMap);
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

    const results: ComputedRef<PaperSearchResult[]> = computed(() =>
        debouncedQuery.value ? searchPaper(index(), debouncedQuery.value, 30) : [],
    );

    /**
     * X.F.W14U.paper — UIA-F-158: the inline panel is open for any settled
     * query, matched or not (a miss says "No results"; it used to vanish, and
     * the field looked exactly as it does with no query). The palette owns the
     * query while it is open (UIA-F-159: one live surface at a time).
     */
    const panelOpen = computed(
        () => isOpen.value && !isExpanded.value && !!debouncedQuery.value,
    );

    watch(results, () => {
        selectedIndex.value = 0;
    });

    function selectResult(r: PaperSearchResult) {
        options.navigateTo(r.id);
        close();
    }

    /**
     * UIA-F-65 — empty the query and nothing else. The palette's Clear called
     * `close()`, which also dismissed the dialog and sent focus to the page;
     * Clear keeps the surface and its focus, and dismissal stays `close()`'s.
     */
    function clear() {
        query.value = "";
        selectedIndex.value = 0;
        // `PSM-27`: `debouncedQuery` — and therefore `results` — lagged 120ms
        // behind `query`, and the memo only cleared on the next empty-query
        // call, so reopening inside that window painted the PREVIOUS search's
        // rows under an empty input. Everything cleared is cleared in this tick.
        clearTimeout(debounceTimer);
        debouncedQuery.value = "";
        if (_index) clearPaperSearchCache(_index);
    }

    function close() {
        isOpen.value = false;
        isExpanded.value = false;
        clear();
    }

    function open() {
        isOpen.value = true;
    }

    /** `PSM-42` / `L/D27`: ⌘K opens the palette, not just the dropdown. */
    function openPalette() {
        isOpen.value = true;
        isExpanded.value = true;
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
        if (_index) clearPaperSearchCache(_index);
    });

    return {
        query,
        /**
         * X·F F.W3 `.c` — `FR-PS-HL`: TWO QUERY SOURCES IN ONE RENDER. The rows
         * are computed from `debouncedQuery` (120ms behind), but their `<mark>`s
         * were computed from the raw `query`, so any keystroke that broke a
         * subsequence blanked EVERY highlight on rows still presented as
         * matches — for 120ms, and then they came back. One source, and it is
         * the one the rows themselves came from.
         */
        debouncedQuery,
        results,
        isOpen,
        isExpanded,
        panelOpen,
        selectedIndex,
        selectResult,
        close,
        clear,
        open,
        openPalette,
        onKeydown,
        listboxId,
        optionId,
    };
}

export type PaperSearchState = ReturnType<typeof usePaperSearch>;
