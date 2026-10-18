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
import PaperPageReadout from "./PaperPageReadout.vue";
import { Button } from "@mkbabb/glass-ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@mkbabb/glass-ui/popover";
import { ChevronDown, ChevronUp, Search, X } from "@lucide/vue";
import { computed, nextTick, ref, useId, watch } from "vue";

const props = defineProps<{
    renderTitle: (title: string) => string;
    search: PaperSearchState;
    /** The chapter the bar names. */
    currentSection?: PaperSectionData | null;
    /** The page being read (X-DS pass 1 · F1-09: the readout's phone home). */
    currentPage: number;
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
    <div class="floating-toc paper-texture lg:hidden">
        <div class="floating-toc-grid paper-grid" aria-hidden="true" />
        <div class="floating-toc-anchor">
            <!-- X-DS pass 7 · DS-F7X-C1: the bar is glass's OPAQUE surface
                 (`data-surface="opaque"`: solid `--card`, no backdrop filter),
                 the mechanism glass Card's `surface="opaque"` plates take; the
                 `.glass-opaque` class kept the tier's blur (DS-F7X-G1, O-87). -->
            <!-- Search mode: input replaces section title -->
            <div v-if="searchActive" ref="searchBarRef" class="floating-toc-bar floating-toc-bar--search glass-resting" data-surface="opaque">
                <PaperSearch ref="mobileSearchRef" :search="search" variant="floating" :boundary="searchBarRef" />
                <Button emphasis="quiet" size="sm" icon-only type="button" class="floating-toc-search-close" @click="closeMobileSearch" aria-label="Close search">
                    <X class="floating-toc-icon" />
                </Button>
            </div>
            <!-- Normal mode: section title + search icon. `D/B-4`: the search
                 control is a real sibling `<Button>`, outside the trigger. -->
            <div v-else class="floating-toc-bar floating-toc-bar--trigger glass-resting" data-surface="opaque">
                <Popover v-model:open="floatingTocOpen">
                    <PopoverTrigger as-child>
                        <Button
                            emphasis="quiet"
                            size="sm"
                            type="button"
                            class="floating-toc-title-btn"
                        >
                            <span class="floating-toc-section font-serif-math">
                                <!-- X-DS pass 6 · DS-F8-C4: one crumb. The leaf's own
                                     number names its chapter ("1.2."), so with a leaf
                                     active the bar shows it alone; else the chapter. -->
                                <span v-if="activeLeaf" class="floating-toc-crumb">
                                    <span v-if="activeLeaf.number" class="floating-toc-number fira-code">{{ activeLeaf.number }}.</span>
                                    <span v-html="renderTitle(activeLeaf.title)" />
                                </span>
                                <span v-else-if="currentSection" class="floating-toc-crumb">
                                    <span v-if="currentSection.number" class="floating-toc-number fira-code">{{ currentSection.number }}.</span>
                                    <span v-html="renderTitle(currentSection.title)" />
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
                        class="floating-toc-dropdown scrollbar-thin w-[calc(100vw_-_2*var(--page-gutter)_-_env(safe-area-inset-left,0px)_-_env(safe-area-inset-right,0px))] max-h-[min(70dvh,32rem,calc(var(--reka-popover-content-available-height,70dvh)_-_env(safe-area-inset-bottom,0px)_-_0.5rem))] overflow-y-auto overscroll-contain"
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
                <PaperPageReadout :current-page="currentPage" class="floating-toc-page" />
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
   chapter list); it is compact (the `sm` rung, `text-small` title) and inset from
   the viewport edges, so the glass-resting corners never meet the screen's
   (UIA-F-236). */
/* X-DS pass 3 · DS-F3-C11: the band is the page's own ground. Its gap above
   the bar was transparent, so the paper slid through it between the dock and
   the bar (a figure rule sliced by the bar). It repaints glass's `.paper-grid`
   over the page tone, fixed to the viewport like the app's grid layer (the
   morph stage band's recipe, DS-F-C6), so the lines run through unbroken.
   X-DS pass 4 · DS-F4-C2: the band carries all of the shell's layers (App.vue):
   the page tone with the `.paper-texture` ground, and the grid as its own
   layer above it, both fixed, so the band is the page's tone, not a slab. */
.floating-toc {
    position: sticky;
    top: 0;
    z-index: var(--z-controls);
    background-color: var(--background);
    background-attachment: fixed;
    /* X-DS pass 2 · DS-F2-C6: the bar sits on the article's own gutter, so
       their edges line up (it was inset 8 px over a 16 px article). */
    padding: 0.5rem var(--page-gutter) 0;
    /* X-DS fourier pass 7 · DS-F7C-C1: the band's foot is where the scrolled
       paper is cut, one atom under the bar, as /morph's band (DS-F5-C4). */
    padding-block-end: var(--space-atom);
}

/* DS-F7C-C1: the cut's rule, the app's one hairline, hung just under the band's
   foot so it adds nothing to the band's height. PaperView sets
   `--floating-toc-rule` once the port has scrolled; transparent at rest. */
.floating-toc::after {
    content: "";
    position: absolute;
    inset-inline: 0;
    inset-block-end: -1px;
    block-size: 1px;
    background: var(--floating-toc-rule, transparent);
    pointer-events: none;
}

.floating-toc-grid {
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background-attachment: fixed;
}
/* X.F.W14V.au1 — A2-FO-L2-16: short landscape (844×390) spent 153 of 390 px on
   chrome, the floating band 81 of it. There the band is one title rung: the
   gap above the bar drops to the residue rung (the inline inset stays, so the
   glass corners still clear the screen's, UIA-F-236). */
@media (orientation: landscape) and (max-height: 500px) {
    .floating-toc {
        padding-top: var(--space-residue);
        /* DS-F7C-C1: one title rung; the rule hangs at the bar's foot. */
        padding-block-end: 0;
    }
}

.floating-toc-bar {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem;
}

/* X-DS fourier pass 9 (critic F9C) · DS-F9C-L2: in short landscape the plate
   hugs the one coarse row. Its block padding goes, and the icon buttons take
   glass's `xs` rung, which the coarse floor holds at the 44px touch target (the
   `sm` rung grew them to 54, so the plate stood 64 around a 44 row). */
@media (orientation: landscape) and (max-height: 500px) {
    .floating-toc-bar {
        padding-block: 0;
    }
    .floating-toc-search-btn,
    .floating-toc-search-close {
        --button-size: var(--control-h-xs);
    }
}

.floating-toc-bar--search > :first-child {
    flex: 1;
    min-width: 0;
}

/* X-DS fourier pass 7 · DS-F7C-T1: the readout holds its widest measure
   (PaperPageReadout), so the title button, and its chevron, keep one place as
   the page count grows; the figures sit against the search button. */
.floating-toc-page {
    text-align: end;
}

.floating-toc-title-btn {
    flex: 1;
    min-width: 0;
    justify-content: flex-start;
    text-align: start;
}

/* X-DS fourier pass 8 (critic F8C) · DS-F8C-T2: on a wide bar (landscape
   844x390, a tablet below lg) the button took all the free space, so its
   chevron stood ~400px from the label it opens. There the button is its
   content's width, the chevron follows the label, and the readout and search
   keep the bar's end. On the phone the button still fills the bar, so the
   chevron holds one place (DS-F7C-T1). */
@media (min-width: 40rem) {
    .floating-toc-title-btn {
        flex: 0 1 auto;
        max-inline-size: 100%;
    }
    .floating-toc-page {
        margin-inline-start: auto;
    }
}

.floating-toc-section {
    display: flex;
    align-items: baseline;
    gap: 0.375rem;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    font-size: var(--type-small);
    color: var(--foreground);
}

/* X-DS pass 2 · DS-F2-C6: the crumb takes the bar's measure.
   X-DS pass 6 · DS-F8-C4: one crumb, the section being read (its number names
   the chapter), so the chapter numeral and the '›' between them are gone. */
.floating-toc-crumb {
    flex: 0 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
