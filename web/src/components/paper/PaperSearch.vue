<script setup lang="ts">
import PaperSearchInput from "./search/PaperSearchInput.vue";
import PaperSearchDropdown from "./search/PaperSearchDropdown.vue";
import type { PaperSearchState } from "./search/usePaperSearch";
import { ref } from "vue";

defineProps<{
    search: PaperSearchState;
    variant: "sidebar" | "floating";
    /**
     * X.F.W14.u — UIA-F-23: the element whose pointer-downs are NOT "outside"
     * the search. Defaults to this component's root. A host that renders the
     * search's own controls beside it (the floating ToC's Close button) passes
     * the whole bar, so pressing Close is not an outside press that closes the
     * search, swaps the bar, and lands the click on the Search button that the
     * swap just rendered under the finger (which reopened it).
     */
    boundary?: HTMLElement | null;
    /**
     * X.F.W14V.r4 — A2-FO-X-7 x UIA-F-59: the column the results plate lives
     * in. The sidebar passes its `.sidebar-nav`, so the plate takes that
     * column's inline size and never breaks out over the article; titles wrap
     * inside it instead. The floating bar passes none and hangs from its field.
     */
    column?: HTMLElement | null;
}>();

const searchInputRef = ref<InstanceType<typeof PaperSearchInput> | null>(null);

/**
 * X·F F.W3 `.c` — `FR-PS-CLIP`/`FR-PS-BDT`: the results panel is portalled to
 * `<body>` to escape `.sidebar-nav`'s clip and the floating bar's
 * `contain: paint`, so it needs the field's own box to hang from. This root IS
 * that box — the element the panel used to be positioned against when it was
 * still a descendant.
 */
const rootRef = ref<HTMLElement | null>(null);

function focus() {
    searchInputRef.value?.focus();
}

defineExpose({ focus });
</script>

<template>
    <div ref="rootRef" class="paper-search" :class="`paper-search--${variant}`">
        <!-- UIA-F-159: one inline surface plus ⌘K. The Expand control was a
             third way into the same query (and the palette's ✕ meant the
             opposite of this field's); ⌘K from this field now carries the
             query into the palette. -->
        <PaperSearchInput ref="searchInputRef" :search="search" :variant="variant" />
        <PaperSearchDropdown
            :search="search"
            :variant="variant"
            :anchor="boundary ?? rootRef"
            :column="column ?? null"
        />
    </div>
</template>

<style scoped>
/* X·F F.W4 `.e` — `PSM-1` (= PV `D/B-1` = `C-01b`), the colocation repair.
 *
 * What this block used to be: 48 rule blocks, of which the record counted
 * FIVE live and 43 dead. Vue's scope id reaches a child component's ROOT
 * element and nothing below it; it never reaches a fragment-rooted child at
 * all, and it never crosses a Teleport. So every rule naming the input chrome,
 * the dropdown subtree or the modal was orphaned, and the search UI shipped
 * unstyled — a refactor casualty from the commit that split the monolith and
 * left the styles behind.
 *
 * What remains here is exactly what this component actually renders: its own
 * root and that root's two variants. Everything else moved into the SFC that
 * owns the element — `PaperSearchInput.vue`, `PaperSearchDropdown.vue`,
 * `PaperSearchResultRow.vue` (new, and the end of `PSM-18`'s duplicated row)
 * and `PaperSearchModal.vue`.
 */
.paper-search {
    position: relative;
}

.paper-search--sidebar {
    margin-bottom: 0.5rem;
}
</style>
