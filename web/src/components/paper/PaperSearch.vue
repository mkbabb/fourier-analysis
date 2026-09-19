<script setup lang="ts">
import PaperSearchInput from "./search/PaperSearchInput.vue";
import PaperSearchDropdown from "./search/PaperSearchDropdown.vue";
import PaperSearchModal from "./search/PaperSearchModal.vue";
import type { PaperSearchState } from "./search/usePaperSearch";
import { ref } from "vue";

defineProps<{
    search: PaperSearchState;
    variant: "sidebar" | "floating";
}>();

const searchInputRef = ref<InstanceType<typeof PaperSearchInput> | null>(null);

function focus() {
    searchInputRef.value?.focus();
}

defineExpose({ focus });
</script>

<template>
    <div class="paper-search" :class="`paper-search--${variant}`">
        <PaperSearchInput
            ref="searchInputRef"
            :search="search"
            :variant="variant"
            :can-expand="!!search.query.value && search.results.value.length > 0"
            @expand="search.toggleExpanded()"
        />
        <PaperSearchDropdown
            :search="search"
            :variant="variant"
        />
        <PaperSearchModal
            :search="search"
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
