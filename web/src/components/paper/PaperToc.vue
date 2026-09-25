<script setup lang="ts">
/**
 * X.F.W14U.t — OA-60: THE ONE TABLE OF CONTENTS, two presentations.
 *
 * `PaperSidebar.vue` (the desktop rail) and `MobileFloatingToc.vue` (the bar
 * below lg) were two components over the one injected model (`paperToc.ts`),
 * each re-deriving the same navigation helpers. They are this one component
 * now; `presentation` picks the form and nothing else is duplicated.
 *
 *   `rail`      the desktop ToC — and, per the owner (2026-09-24), a drawer:
 *               "it should slide under the paper and become a drawer that
 *               expands out to where it is now." The toggle collapses the
 *               paper grid's ToC column; the paper slides over the ToC, which
 *               is clipped at the column's inline end and goes under it, and a
 *               drawer tab stays at the paper's edge. Expanding returns the
 *               column to its width, so the ToC is exactly where it was (its
 *               own scroll kept — it never unmounts). The state persists per
 *               viewer (storage through `useSafeStorage`'s try/catch).
 *   `floating`  the mobile bar + dropdown, unchanged in behaviour.
 *
 * P-2 (COHESION §0cr): glass has no edge-drawer-under-content primitive, so
 * the drawer is fourier's layout, and ALL of its motion lives in this file's
 * one `.paper-sidebar` rule block (width + the clip + the end-delayed
 * `visibility`), so one glass primitive can replace it at the landing repin
 * (P-2-ADOPT). The visible surfaces are glass's (`Button`, `Collapsible`,
 * `Tooltip`); none is copied or restyled.
 */
// X.F.W3 repair 1 / `FR-TT-20` — THE ONE IMPORT IDENTITY: the tooltip barrel.
import { Tooltip } from "@/components/ui/tooltip";
import PaperSearch from "./PaperSearch.vue";
import type { PaperSectionData } from "@/lib/paperContent";
import type { PaperSearchState } from "./search/usePaperSearch";
import { injectPaperToc, sectionColorVar } from "./paperToc";
import { safeGetItem, safeSetItem } from "@/composables/useSafeStorage";
import { Button } from "@mkbabb/glass-ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@mkbabb/glass-ui/popover";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@mkbabb/glass-ui/collapsible";
import {
    ArrowUpToLine,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    PanelLeftClose,
    PanelLeftOpen,
    Search,
    X,
} from "@lucide/vue";
import { computed, nextTick, onBeforeUnmount, ref, useId, useTemplateRef, watch } from "vue";

const props = defineProps<{
    presentation: "rail" | "floating";
    renderTitle: (title: string) => string;
    search: PaperSearchState;
    /** `floating` only: the section the bar names. */
    currentSection?: PaperSectionData | null;
}>();

// ── The ONE ToC model, injected (COHESION §0o ESC-2 / §3 D9) ───────────────
// `PaperView` owns the model and provides it on a typed key; both
// presentations read it, so "expanded here" and "expanded there" are one fact.
const toc = injectPaperToc();
const {
    sections,
    activeRootId,
    isActive,
    isInActiveChain,
    isExpanded,
    toggleSection,
    navigateTo,
    scrollToTop,
    activeId,
    treeIndex,
} = toc;

// X·F F.W4 `.e` — `fr-PaperSidebar D-M11`: `v-if="section.subsections"` is
// truthy for `[]`; the contract hole is closed at the predicate.
function hasChildren(section: PaperSectionData): boolean {
    return (section.subsections?.length ?? 0) > 0;
}

/**
 * X·F F.W4 `.e` — the disclosure control's accessible name: `renderTitle`
 * returns KaTeX HTML, which cannot be an `aria-label`, so the math and markup
 * are stripped to a plain string (SP-7: a description is never a name).
 */
function plainTitle(section: PaperSectionData): string {
    return section.title
        .replace(/\$[^$]*\$/g, "")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

/** A glass `Button` ref is the component instance; its root is `$el`. */
function elementOf(r: unknown): HTMLElement | null {
    if (!r) return null;
    return r instanceof HTMLElement ? r : ((r as { $el?: HTMLElement }).$el ?? null);
}

// ── `rail` ─────────────────────────────────────────────────────────────────

/** X.F.W13.a — the CONTENTS disclosure's state; the list opens on arrival. */
const contentsOpen = ref(true);

// Only the rail's list is scroll-followed (`useSidebarFollow`); the floating
// dropdown never registers, so its mount/unmount cannot clear the rail's.
const sidebarNav = ref<HTMLElement | null>(null);
if (props.presentation === "rail") {
    watch(sidebarNav, (el) => toc.registerNavEl(el), { immediate: true });
    onBeforeUnmount(() => toc.registerNavEl(null));
}

/**
 * X·F F.W4 `.e` — `L-1`: the row EXPANDS and never collapses (monotone); the
 * two-way control is the disclosure trigger beside it, where `aria-expanded`
 * says so.
 */
function navigateAndReveal(id: string) {
    if (!isExpanded(id)) toggleSection(id);
    navigateTo(id);
}

/**
 * X.F.W14U.t — the drawer. Persisted per viewer (localStorage: the viewer's
 * choice, not the session's), read synchronously so a returning reader's
 * closed drawer paints closed with no slide on arrival.
 */
const DRAWER_KEY = "fourier:paper-toc-open";
const drawerId = `paper-toc-${useId()}`;
const drawerOpen = ref(safeGetItem(localStorage, DRAWER_KEY) !== "0");
const drawerTabRef = useTemplateRef<unknown>("drawerTab");

function toggleDrawer() {
    drawerOpen.value = !drawerOpen.value;
    safeSetItem(localStorage, DRAWER_KEY, drawerOpen.value ? "1" : "0");
    // Focus returns to the toggle: the ToC it controls goes inert when shut, so
    // focus is never left inside a hidden region.
    nextTick(() => elementOf(drawerTabRef.value)?.focus());
}

// ── `floating` ─────────────────────────────────────────────────────────────

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

function selectSection(id: string) {
    floatingTocOpen.value = false;
    navigateTo(id);
}

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
    <!-- ── rail: the desktop ToC, a drawer that goes under the paper ───────── -->
    <aside v-if="presentation === 'rail'" class="paper-sidebar" :data-state="drawerOpen ? 'open' : 'closed'">
        <div class="paper-toc-drawer">
            <nav
                :id="drawerId"
                ref="sidebarNav"
                class="sidebar-nav glass-quiet scrollbar-thin"
                :data-contents="contentsOpen ? 'open' : 'closed'"
                aria-label="Table of contents"
                :inert="!drawerOpen"
            >
                <PaperSearch :search="search" variant="sidebar" />
                <!-- X.F.W13.a — OA-13: the CONTENTS disclosure is the producer's
                     `Collapsible` (it owns `aria-expanded` and the motion) on a
                     glass `Button icon-only` whose own circle is not overwritten. -->
                <Collapsible v-model:open="contentsOpen">
                    <div class="sidebar-header">
                        <p class="sidebar-label font-serif-math">Contents</p>
                        <!-- X.F.W14.r — r1: the scroll-to-top sits BESIDE the
                             disclosure on the same glass primitive. -->
                        <div class="sidebar-header-actions">
                            <Tooltip text="Scroll to top" side="right">
                                <Button
                                    emphasis="quiet"
                                    size="md" icon-only
                                    class="sidebar-scroll-top"
                                    aria-label="Scroll to top"
                                    @click="scrollToTop()"
                                >
                                    <ArrowUpToLine class="sidebar-contents-icon" />
                                </Button>
                            </Tooltip>
                            <Tooltip :text="contentsOpen ? 'Collapse contents' : 'Expand contents'" side="right">
                                <CollapsibleTrigger as-child>
                                    <Button
                                        emphasis="quiet"
                                        size="md" icon-only
                                        class="sidebar-contents-toggle"
                                        aria-label="Contents"
                                    >
                                        <ChevronUp class="sidebar-contents-icon" />
                                    </Button>
                                </CollapsibleTrigger>
                            </Tooltip>
                        </div>
                    </div>
                    <CollapsibleContent>
                        <ol class="sidebar-list">
                            <li
                                v-for="(section, si) in sections"
                                :key="section.id"
                                :style="{ '--toc-accent': sectionColorVar(si) }"
                            >
                                <!-- X·F F.W4 `.e` — L-5(a) + L-1: navigate and toggle
                                     are two controls; `@update:open` is reached by
                                     exactly one path, the trigger. -->
                                <!-- X.F.W14U.paper — UIA-F-156: ONE active treatment
                                     (`.sidebar-link[aria-current]`) at every rank, in
                                     the chapter's hue through `--toc-accent` on its
                                     `<li>`, where each rank used to carry its own
                                     inline `:style` literal. UIA-F-164/F-234: the
                                     per-row statistics tooltip is gone (it covered
                                     the article heading and collided with the search
                                     panel). UIA-F-147 (consumer half): the rows ride
                                     Button's own `sm` rung; the start alignment is
                                     glass's row arm (O-59), the rest is Button's. -->
                                <Collapsible
                                    :open="isExpanded(section.id)"
                                    @update:open="toggleSection(section.id)"
                                >
                                    <div class="sidebar-row">
                                        <Button
                                            emphasis="quiet"
                                            size="sm"
                                            :data-toc-id="section.id"
                                            @click="navigateAndReveal(section.id)"
                                            class="sidebar-link font-serif-math"
                                            :aria-current="activeRootId === section.id ? 'location' : undefined"
                                        >
                                            <span v-if="section.number" class="sidebar-number fira-code">{{ section.number }}.</span>
                                            <span v-html="renderTitle(section.title)" />
                                        </Button>
                                        <!-- UIA-F-156: a compact disclosure (the `xs` rung;
                                             the touch floor is the producer's). -->
                                        <CollapsibleTrigger v-if="hasChildren(section)" as-child>
                                            <Button
                                                emphasis="quiet"
                                                size="xs" icon-only
                                                class="sidebar-disclosure"
                                                :aria-label="`Subsections of ${plainTitle(section)}`"
                                            >
                                                <ChevronRight class="sidebar-disclosure-icon" />
                                            </Button>
                                        </CollapsibleTrigger>
                                    </div>
                                    <CollapsibleContent v-if="hasChildren(section)">
                                        <ol class="sidebar-sublist">
                                            <li v-for="sub in section.subsections" :key="sub.id">
                                                <Button
                                                    emphasis="quiet"
                                                    size="sm"
                                                    :data-toc-id="sub.id"
                                                    @click="navigateTo(sub.id)"
                                                    class="sidebar-link sidebar-sublink font-serif-math"
                                                    :aria-current="isActive(sub.id) ? 'location' : undefined"
                                                >
                                                    <span v-if="sub.number" class="sidebar-number fira-code">{{ sub.number }}.</span>
                                                    <span v-html="renderTitle(sub.title)" />
                                                </Button>
                                                <ol v-if="sub.subsections && isInActiveChain(sub.id)" class="sidebar-subsublist">
                                                    <li v-for="subsub in sub.subsections" :key="subsub.id">
                                                        <Button
                                                            emphasis="quiet"
                                                            size="sm"
                                                            :data-toc-id="subsub.id"
                                                            @click="navigateTo(subsub.id)"
                                                            class="sidebar-link sidebar-subsublink font-serif-math"
                                                            :aria-current="isActive(subsub.id) ? 'location' : undefined"
                                                        >
                                                            <span v-if="subsub.number" class="sidebar-number fira-code">{{ subsub.number }}.</span>
                                                            <span v-html="renderTitle(subsub.title)" />
                                                        </Button>
                                                    </li>
                                                </ol>
                                            </li>
                                        </ol>
                                    </CollapsibleContent>
                                </Collapsible>
                            </li>
                        </ol>
                    </CollapsibleContent>
                </Collapsible>
            </nav>
        </div>
        <!-- The drawer tab: one control in both states, so focus never moves
             off it. It rides the column's inline end — beside the ToC when
             open, at the paper's edge when shut. -->
        <div class="paper-toc-tab-rail">
            <Tooltip :text="drawerOpen ? 'Hide contents' : 'Show contents'" side="right">
                <Button
                    ref="drawerTab"
                    emphasis="quiet"
                    size="sm" icon-only
                    type="button"
                    class="paper-toc-tab"
                    :aria-label="drawerOpen ? 'Hide contents' : 'Show contents'"
                    :aria-expanded="drawerOpen"
                    :aria-controls="drawerId"
                    @click="toggleDrawer"
                >
                    <PanelLeftClose v-if="drawerOpen" class="sidebar-contents-icon" />
                    <PanelLeftOpen v-else class="sidebar-contents-icon" />
                </Button>
            </Tooltip>
        </div>
    </aside>

    <!-- ── floating: the bar + its ToC popover below lg ──────────────────── -->
    <!-- X.F.W14U.paper — UIA-F-67: the phone ToC is glass Popover anchored to
         the bar (dismissal, focus, Esc and focus return are the producer's; the
         hand-rolled plate, backdrop, focus trap and the inline `overflow` write
         on `.paper-scroll` are gone), and its tree is the rail's ONE model on
         glass Collapsible, every level reachable. UIA-F-162/F-236: a compact
         bar inset from the viewport edges, reporting chapter and section. -->
    <div v-else class="floating-toc lg:hidden">
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
                            class="floating-toc-item floating-toc-top font-serif-math"
                            @click="handleScrollToTop"
                        >
                            <ChevronUp class="floating-toc-icon" />
                            <span>Scroll to top</span>
                        </Button>
                        <div class="floating-toc-divider" />
                        <ol class="floating-toc-list">
                            <li
                                v-for="(section, si) in sections"
                                :key="section.id"
                                :style="{ '--toc-accent': sectionColorVar(si) }"
                            >
                                <Collapsible
                                    :open="isExpanded(section.id)"
                                    @update:open="toggleSection(section.id)"
                                >
                                    <div class="floating-toc-row">
                                        <Button
                                            emphasis="quiet"
                                            size="sm"
                                            class="floating-toc-item floating-toc-root font-serif-math"
                                            :aria-current="activeRootId === section.id ? 'location' : undefined"
                                            @click="selectSection(section.id)"
                                        >
                                            <span class="floating-toc-number fira-code">{{ section.number }}.</span>
                                            <span v-html="renderTitle(section.title)" />
                                        </Button>
                                        <CollapsibleTrigger v-if="hasChildren(section)" as-child>
                                            <Button
                                                emphasis="quiet"
                                                size="sm"
                                                icon-only
                                                class="floating-toc-disclosure"
                                                :aria-label="`Subsections of ${plainTitle(section)}`"
                                            >
                                                <ChevronRight class="floating-toc-collapse-icon" />
                                            </Button>
                                        </CollapsibleTrigger>
                                    </div>
                                    <CollapsibleContent v-if="hasChildren(section)">
                                        <ol class="floating-toc-sublist">
                                            <li v-for="sub in section.subsections" :key="sub.id">
                                                <Button
                                                    emphasis="quiet"
                                                    size="sm"
                                                    class="floating-toc-item floating-toc-sub font-serif-math"
                                                    :aria-current="isActive(sub.id) ? 'location' : undefined"
                                                    @click="selectSection(sub.id)"
                                                >
                                                    <span class="floating-toc-number fira-code">{{ sub.number }}.</span>
                                                    <span v-html="renderTitle(sub.title)" />
                                                </Button>
                                                <ol v-if="sub.subsections?.length" class="floating-toc-sublist">
                                                    <li v-for="subsub in sub.subsections" :key="subsub.id">
                                                        <Button
                                                            emphasis="quiet"
                                                            size="sm"
                                                            class="floating-toc-item floating-toc-subsub font-serif-math"
                                                            :aria-current="isActive(subsub.id) ? 'location' : undefined"
                                                            @click="selectSection(subsub.id)"
                                                        >
                                                            <span class="floating-toc-number fira-code">{{ subsub.number }}.</span>
                                                            <span v-html="renderTitle(subsub.title)" />
                                                        </Button>
                                                    </li>
                                                </ol>
                                            </li>
                                        </ol>
                                    </CollapsibleContent>
                                </Collapsible>
                            </li>
                        </ol>
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

/* ── rail ───────────────────────────────────────────────────────────────────
   X.F.W14U.t — THE DRAWER'S MOTION, IN ONE PLACE (P-2: the rule block a glass
   edge-drawer primitive replaces at the landing repin). The rail IS the paper
   grid's ToC column (`PaperView` sizes that track `auto`), so its width is the
   column's: open = the ToC + the tab rail, shut = the tab rail alone. The paper
   slides over as the column narrows; the ToC stays put and is clipped at the
   drawer's inline end — it goes under the paper — and turns `hidden` only once
   the slide has ended (out of the tab order and the a11y tree; `inert` already
   holds it from the first frame). Expanding reverses the same width, so the
   ToC returns exactly to its place. */
.paper-sidebar {
    --sidebar-top-inset: 0.5rem;
    --sidebar-bottom-inset: 1.5rem;
    --paper-toc-width: 17rem;
    /* The tab rail is the gutter between the ToC and the paper. */
    --paper-toc-tab: var(--control-h-sm);
    --paper-toc-motion: var(--duration-slow) var(--ease-out-expo);
    display: none;
}

@media (min-width: 1024px) {
    .paper-sidebar {
        display: flex;
        position: sticky;
        top: var(--sidebar-top-inset);
        align-self: start;
        min-height: 0;
        width: calc(var(--paper-toc-width) + var(--paper-toc-tab));
        transition: width var(--paper-toc-motion);
    }

    .paper-sidebar[data-state="closed"] {
        width: var(--paper-toc-tab);
    }

    .paper-toc-drawer {
        flex: 1 1 0;
        min-width: 0;
        /* `clip`, not `hidden`: no scroll container, so nothing inside becomes
           scrollable sideways; the margin keeps the nav's own offset shadow. */
        overflow: clip;
        overflow-clip-margin: 4px;
    }

    .paper-sidebar[data-state="closed"] .sidebar-nav {
        visibility: hidden;
        transition: visibility 0s linear var(--duration-slow);
    }

    .paper-toc-tab-rail {
        flex: none;
        width: var(--paper-toc-tab);
        display: flex;
        justify-content: center;
        padding-top: 0.625rem;
    }
}

@media (prefers-reduced-motion: reduce) {
    .paper-sidebar,
    .paper-sidebar[data-state="closed"] .sidebar-nav {
        transition: none;
    }
}

.sidebar-nav {
    width: var(--paper-toc-width);
    max-height: calc(
        var(--paper-scroll-viewport-height, 100dvh) - var(--sidebar-top-inset) - var(--sidebar-bottom-inset)
    );
    overflow-y: auto;
    overscroll-behavior-y: contain;
    overscroll-behavior-x: contain;
    scrollbar-gutter: stable;
    scroll-padding-bottom: var(--sidebar-bottom-inset);
    touch-action: pan-y;
    padding: 0.625rem 0.625rem var(--sidebar-bottom-inset);
    /* X.F.W14U.paper — UIA-F-61: the rail is `.glass-quiet` (DESIGN.md:47),
       not a hand-rolled cartoon card whose +3px cast fell against the
       article's −3px (two light sources). Border, fill and cast are the quiet
       tier's; the panel radius (F.W13 frame 1) reaches it through the tier's
       own contextual radius. */
    --radius-ctx: var(--radius-panel);
}

/* UIA-F-234: a collapsed CONTENTS reclaims its space — the card hugs its
   header instead of keeping the list's bottom inset as an empty band. */
.sidebar-nav[data-contents="closed"] {
    padding-bottom: 0.625rem;
}

.sidebar-nav[data-contents="closed"] .sidebar-header {
    margin-bottom: 0;
}

.sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0.625rem;
    margin-bottom: 0.5rem;
}

.sidebar-header-actions {
    display: flex;
    align-items: center;
    gap: 0.125rem;
}

.sidebar-label {
    @apply text-sm;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    /* `D-B2`: full strength is 5.021:1 light / 5.440:1 dark over `--card`
       (the 60% dilution measured 2.39:1 / 3.00:1 against a 4.5:1 floor). */
    color: var(--muted-foreground);
    margin: 0;
}

/* X.F.W13.a — OA-13: the glass `Button icon-only` owns its geometry and ink;
   the glyph is sized by a `size-*`-free class the producer's
   `svg:not([class*=size-])` guard leaves to us. */
.sidebar-contents-icon {
    width: 0.875rem;
    height: 0.875rem;
    transition: transform var(--duration-fast) var(--ease-standard);
}

/* Keyed on `aria-expanded`, not `data-state`: the Tooltip's own trigger
   stamps `data-state` (its open/closed) on this same node and wins it. */
.sidebar-contents-toggle[aria-expanded="false"] .sidebar-contents-icon {
    transform: rotate(180deg);
}

.sidebar-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.0625rem;
}

/* X·F F.W4 `.e` — `L-5(a)`/`L-1`: navigate + disclosure, side by side. */
.sidebar-row {
    display: flex;
    align-items: center;
    gap: 0.125rem;
}

.sidebar-row > :first-child {
    flex: 1;
    min-width: 0;
}

.sidebar-disclosure {
    flex-shrink: 0;
}

.sidebar-disclosure-icon {
    width: 0.875rem;
    height: 0.875rem;
    transition: transform 0.15s var(--ease-standard);
}

.sidebar-disclosure[data-state="open"] .sidebar-disclosure-icon {
    transform: rotate(90deg);
}

/* X.F.W14U.paper — UIA-F-147 (consumer half) + UIA-F-156: the rows are glass
   Button at its own `sm` rung (`min-block-size: --control-h-sm`; a wrapped
   title grows the row, nothing fights the rung). The local padding, fill,
   border and hover paint are gone — Button's quiet emphasis owns them. What
   stays is the row canon the F.W14.r ruling names (`--radius-lg`, G-r2), the
   start alignment glass's list-row arm will own (O-59: `variant="row"`), and
   the rank typography that is the ToC's hierarchy. */
.sidebar-link {
    inline-size: 100%;
    justify-content: flex-start;
    text-align: start;
    white-space: normal;
    @apply text-base;
    line-height: 1.35;
    border-radius: var(--radius-lg);
}

/* UIA-F-156: ONE active treatment at every rank, in the chapter's hue
   (`--toc-accent`, set on the chapter's `<li>`). */
.sidebar-link[aria-current] {
    color: var(--toc-accent);
    font-weight: 600;
    background: color-mix(in srgb, var(--muted) 40%, transparent);
}

.sidebar-number {
    font-size: 0.72rem;
    margin-right: 0.22rem;
    opacity: 0.5;
}

.sidebar-link[aria-current] .sidebar-number {
    opacity: 0.8;
}

.sidebar-sublist {
    list-style: none;
    padding: 0 0 0 0.625rem;
    margin: 0.0625rem 0 0.125rem;
}

.sidebar-sublink {
    font-size: 0.78rem;
}

.sidebar-subsublist {
    list-style: none;
    padding: 0 0 0 0.5rem;
    margin: 0.03125rem 0 0.0625rem;
}

.sidebar-subsublink {
    font-size: 0.72rem;
}

/* ── floating (below lg) ─────────────────────────────────────────────────────
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

.floating-toc-list,
.floating-toc-sublist {
    list-style: none;
    margin: 0;
    padding: 0;
}

.floating-toc-sublist {
    padding-inline-start: 0.75rem;
}

.floating-toc-row {
    display: flex;
    align-items: center;
    gap: 0.125rem;
}

.floating-toc-row > .floating-toc-root {
    flex: 1;
    min-width: 0;
}

/* UIA-F-66: rows are a start-aligned list with a numeral gutter (glass Button
   centres its content; the row arm is glass's, O-59 / UIA-F-147), and the
   Scroll-to-top glyph sits on its label's line. The declarations are on the
   rows' own class, after the producer's in cascade order (scoped, unlayered). */
.floating-toc-item {
    inline-size: 100%;
    justify-content: flex-start;
    text-align: start;
    white-space: normal;
    line-height: 1.35;
    border-radius: var(--radius-lg);
}

.floating-toc-sub,
.floating-toc-subsub {
    @apply text-sm;
}

.floating-toc-disclosure {
    flex: none;
}

.floating-toc-collapse-icon {
    width: 0.875rem;
    height: 0.875rem;
    transition: transform var(--duration-fast) var(--ease-standard);
}

.floating-toc-disclosure[data-state="open"] .floating-toc-collapse-icon {
    transform: rotate(90deg);
}

/* The current entry, in its chapter's hue — the rail's one treatment. A tap
   no longer latches a look-alike: the only consumer hover paint is gated on
   a device that hovers (UIA-F-163). */
.floating-toc-item[aria-current] {
    color: var(--toc-accent);
    font-weight: 600;
    background: color-mix(in srgb, var(--muted) 40%, transparent);
}

@media (hover: hover) {
    .floating-toc-item:not([aria-current]):hover {
        color: var(--foreground);
    }
}
</style>
