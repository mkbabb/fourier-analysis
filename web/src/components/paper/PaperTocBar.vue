<script setup lang="ts">
/**
 * X.F.W14V.au5 — A2-FO-L1-1: the PHONE host of the one ToC tree
 * (`PaperTocTree`), split out of the 909-line `PaperToc.vue`. Below lg the
 * paper carries a compact bar that names the chapter and the section being
 * read (UIA-F-236); the bar opens the tree in a glass `Popover` (UIA-F-67:
 * dismissal, focus and Esc are the producer's) and swaps to the paper's
 * search field (one `PaperSearch` per breakpoint, UIA-F-22).
 */
import PaperSearch from "./PaperSearch.vue";
import PaperTocTree from "./PaperTocTree.vue";
import type { PaperSectionData } from "@/lib/paperContent";
import type { PaperSearchState } from "./search/usePaperSearch";
import { injectPaperToc } from "./paperToc";
import { Button } from "@mkbabb/glass-ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@mkbabb/glass-ui/popover";
import { ChevronDown, ChevronUp, Search, X } from "@lucide/vue";
import { computed, nextTick, ref, useId, watch } from "vue";

const props = defineProps<{
    renderTitle: (title: string) => string;
    search: PaperSearchState;
    /** The chapter the bar names. */
    currentSection?: PaperSectionData | null;
}>();

// The ONE ToC model, injected (COHESION §0o ESC-2 / §3 D9).
const { sections, activeId, activeRootId, treeIndex, scrollToTop } = injectPaperToc();

const dropdownId = `floating-toc-${useId()}`;
const floatingTocOpen = ref(false);
const searchActive = ref(false);
const mobileSearchRef = ref<InstanceType<typeof PaperSearch> | null>(null);
/** UIA-F-23: the whole search bar is the search's dismissal boundary. */
const searchBarRef = ref<HTMLElement | null>(null);
// UIA-F-67: dismissal (Esc, outside), focus into the panel and back to the
// trigger are glass Popover's. The hand-rolled `dismissDropdown`, the focus
// hand-off and the inline `overflow: hidden` write on `.paper-scroll` (a scroll
// lock the non-modal popover does not need) are gone.

/**
 * UIA-F-236: the bar reports the chapter AND the section being read. The
 * active entry of the one model, when it is not the chapter itself.
 */
const activeLeaf = computed<PaperSectionData | null>(() => {
    const id = activeId.value;
    if (!id || id === activeRootId.value) return null;
    return treeIndex.get(id)?.node ?? null;
});

function handleScrollToTop() {
    floatingTocOpen.value = false;
    scrollToTop();
}

function openMobileSearch() {
    floatingTocOpen.value = false;
    searchActive.value = true;
    props.search.open();
    nextTick(() => mobileSearchRef.value?.focus());
}

function closeMobileSearch() {
    searchActive.value = false;
    props.search.close();
}

// Close search when a result is selected (navigateTo triggers).
watch(
    () => props.search.isOpen.value,
    (open) => {
        if (!open && searchActive.value) {
            searchActive.value = false;
        }
    },
);
</script>

<template>
    <!-- X.F.W14U.paper — UIA-F-67: the phone ToC is glass Popover anchored to
         the bar (dismissal, focus, Esc and focus return are the producer's; the
         hand-rolled plate, backdrop, focus trap and the inline `overflow` write
         on `.paper-scroll` are gone), and its tree is the one `PaperTocTree`
         (X.F.W14V.au5), every level reachable. UIA-F-162/F-236: a compact
         bar inset from the viewport edges, reporting chapter and section. -->
    <div class="floating-toc lg:hidden">
        <div class="floating-toc-anchor">
            <!-- Search mode: input replaces section title -->
            <div v-if="searchActive" ref="searchBarRef" class="floating-toc-bar floating-toc-bar--search glass-resting">
                <PaperSearch ref="mobileSearchRef" :search="search" variant="floating" :boundary="searchBarRef" />
                <Button emphasis="quiet" size="sm" icon-only type="button" class="floating-toc-search-close" @click="closeMobileSearch" aria-label="Close search">
                    <X class="floating-toc-icon" />
                </Button>
            </div>
            <!-- Normal mode: section title + search icon. `D/B-4`: the search
                 control is a real sibling `<Button>`, outside the trigger. -->
            <div v-else class="floating-toc-bar floating-toc-bar--trigger glass-resting">
                <Popover v-model:open="floatingTocOpen">
                    <PopoverTrigger as-child>
                        <Button
                            emphasis="quiet"
                            size="sm"
                            type="button"
                            class="floating-toc-title-btn"
                        >
                            <span class="floating-toc-section font-serif-math">
                                <span class="floating-toc-crumb">
                                    <span v-if="currentSection?.number" class="floating-toc-number fira-code">{{ currentSection.number }}.</span>
                                    <span v-if="currentSection" v-html="renderTitle(currentSection.title)" />
                                </span>
                                <span v-if="activeLeaf" class="floating-toc-crumb floating-toc-crumb--leaf">
                                    <span v-if="activeLeaf.number" class="floating-toc-number fira-code">{{ activeLeaf.number }}.</span>
                                    <span v-html="renderTitle(activeLeaf.title)" />
                                </span>
                            </span>
                            <ChevronDown class="floating-toc-chevron" />
                        </Button>
                    </PopoverTrigger>
                    <!-- X.F.W14V.au1 — A2-FO-L2-16 ⊕ L2-3: the plate is inset from
                         the landscape notch sides (it was full-bleed [0..844]) and
                         its block size is what the popper says is left below the
                         bar, less the home-indicator inset (it ended 3 px from the
                         edge, inside the 21 px zone, at 844×390). -->
                    <PopoverContent
                        :id="dropdownId"
                        class="floating-toc-dropdown scrollbar-thin w-[calc(100vw_-_1rem_-_env(safe-area-inset-left,0px)_-_env(safe-area-inset-right,0px))] max-h-[min(70dvh,32rem,calc(var(--reka-popover-content-available-height,70dvh)_-_env(safe-area-inset-bottom,0px)_-_0.5rem))] overflow-y-auto overscroll-contain"
                        align="start"
                        :side-offset="6"
                        aria-label="Table of contents"
                    >
                        <Button
                            emphasis="quiet"
                            size="sm"
                            class="floating-toc-top font-serif-math"
                            @click="handleScrollToTop"
                        >
                            <ChevronUp class="floating-toc-icon" />
                            <span>Scroll to top</span>
                        </Button>
                        <div class="floating-toc-divider" />
                        <!-- X.F.W14V.au5 — A2-FO-L1-1: the one tree; a chosen row
                             closes the popover (the model has navigated). -->
                        <PaperTocTree
                            :nodes="sections"
                            :render-title="renderTitle"
                            @navigate="floatingTocOpen = false"
                        />
                    </PopoverContent>
                </Popover>
                <Button
                    emphasis="quiet"
                    size="sm"
                    icon-only
                    type="button"
                    class="floating-toc-search-btn"
                    aria-label="Search paper"
                    @click="openMobileSearch"
                >
                    <Search class="floating-toc-icon" />
                </Button>
            </div>
        </div>
    </div>
</template>

<style scoped>
@reference "tailwindcss";
/* ── the bar (below lg) ─────────────────────────────────────────────────────
   X.F.W14U.paper — UIA-F-162: the bar is in flow at the top of the paper and
   sticks there (content first: the first screen is the paper, not a centred
   chapter list); it is compact (the `sm` rung, `text-sm` title) and inset from
   the viewport edges, so the glass-resting corners never meet the screen's
   (UIA-F-236). */
.floating-toc {
    position: sticky;
    top: 0;
    z-index: var(--z-controls);
    padding: 0.5rem 0.5rem 0;
}
/* X.F.W14V.au1 — A2-FO-L2-16: short landscape (844×390) spent 153 of 390 px on
   chrome, the floating band 81 of it. There the band is one title rung: the
   gap above the bar drops to the residue rung (the inline inset stays, so the
   glass corners still clear the screen's, UIA-F-236). */
@media (orientation: landscape) and (max-height: 500px) {
    .floating-toc {
        padding-top: var(--space-residue);
    }
}

.floating-toc-bar {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem;
}

.floating-toc-bar--search > :first-child {
    flex: 1;
    min-width: 0;
}

.floating-toc-title-btn {
    flex: 1;
    min-width: 0;
    justify-content: flex-start;
    text-align: start;
}

.floating-toc-section {
    display: flex;
    align-items: baseline;
    gap: 0.375rem;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    @apply text-sm;
    color: var(--foreground);
}

.floating-toc-crumb {
    flex: none;
    max-width: 55%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* UIA-F-236: the section being read, after its chapter. */
.floating-toc-crumb--leaf {
    flex: 1 1 0;
    max-width: none;
    color: var(--muted-foreground);
}

.floating-toc-crumb--leaf::before {
    content: "›";
    margin-inline-end: 0.375rem;
}

/* UIA-F-236: the numerals' own size (a `text-xs` that lost to the row's type
   had no effect). */
.floating-toc-number {
    font-size: var(--type-caption);
    color: var(--muted-foreground);
    margin-inline-end: 0.25rem;
}

.floating-toc-icon,
.floating-toc-chevron {
    width: 0.875rem;
    height: 0.875rem;
    flex: none;
}

.floating-toc-chevron {
    color: var(--muted-foreground);
    transition: transform var(--duration-fast) var(--ease-standard);
}

.floating-toc-title-btn[data-state="open"] .floating-toc-chevron {
    transform: rotate(180deg);
}

/* The popover's list — the width of the phone less the bar's inset, its own
   scroll (the producer's thin scrollbar), under the viewport's height — is
   sized by utilities on `PopoverContent` in the template: the content element
   is glass's (portalled, not this component's root), so no scoped rule here
   reaches it. */

.floating-toc-divider {
    height: 1px;
    margin: 0.25rem 0;
    background: color-mix(in srgb, var(--border) 60%, transparent);
}

/* UIA-F-66: Scroll to top is a start-aligned row with its glyph on its
   label's line (glass Button centres its content; the row arm is glass's,
   O-59 / UIA-F-147). The ToC rows themselves are `PaperTocTree`'s. */
.floating-toc-top {
    inline-size: 100%;
    justify-content: flex-start;
    text-align: start;
    white-space: normal;
    line-height: 1.35;
    border-radius: var(--radius-lg);
}
</style>
