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
import { nextTick, onBeforeUnmount, onUnmounted, ref, useId, useTemplateRef, watch } from "vue";

const props = defineProps<{
    presentation: "rail" | "floating";
    renderTitle: (title: string) => string;
    search: PaperSearchState;
    /** `floating` only: the section the bar names. */
    currentSection?: PaperSectionData | null;
    /** `floating` only: locked while the dropdown is open (iOS WebKit). */
    scrollContainer?: HTMLElement | null;
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
    getPreview,
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
const dropdownRef = ref<HTMLElement | null>(null);
const mobileSearchRef = ref<InstanceType<typeof PaperSearch> | null>(null);
/** UIA-F-23: the whole search bar is the search's dismissal boundary. */
const searchBarRef = ref<HTMLElement | null>(null);
// Focus returns to the trigger after the dropdown is dismissed (A4 MED).
const tocTriggerRef = useTemplateRef<unknown>("tocTrigger");

function dismissDropdown() {
    floatingTocOpen.value = false;
    nextTick(() => elementOf(tocTriggerRef.value)?.focus());
}

// Lock the scroll container while the dropdown is open (iOS WebKit), and move
// focus into the dropdown so its `@keydown.esc` receives the key (A4 MED).
watch(floatingTocOpen, (open) => {
    if (props.scrollContainer) {
        props.scrollContainer.style.overflow = open ? "hidden" : "";
    }
    if (open) {
        nextTick(() => dropdownRef.value?.focus());
    }
});

// Restore scroll if the component unmounts while open.
onUnmounted(() => {
    if (props.scrollContainer) {
        props.scrollContainer.style.overflow = "";
    }
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
                class="sidebar-nav scrollbar-thin"
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
                            <li v-for="(section, si) in sections" :key="section.id">
                                <!-- X·F F.W4 `.e` — L-5(a) + L-1: navigate and toggle
                                     are two controls; `@update:open` is reached by
                                     exactly one path, the trigger. -->
                                <Collapsible
                                    :open="isExpanded(section.id)"
                                    @update:open="toggleSection(section.id)"
                                >
                                    <div class="sidebar-row">
                                        <Tooltip :text="getPreview(section)" side="right">
                                            <Button
                                                emphasis="quiet"
                                                :data-toc-id="section.id"
                                                @click="navigateAndReveal(section.id)"
                                                class="sidebar-link font-serif-math"
                                                :aria-current="activeRootId === section.id ? 'location' : undefined"
                                                :style="activeRootId === section.id ? { color: sectionColorVar(si) } : {}"
                                            >
                                                <span v-if="section.number" class="sidebar-number fira-code">{{ section.number }}.</span>
                                                <span v-html="renderTitle(section.title)" />
                                            </Button>
                                        </Tooltip>
                                        <CollapsibleTrigger v-if="hasChildren(section)" as-child>
                                            <Button
                                                emphasis="quiet"
                                                size="md" icon-only
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
                                                <Tooltip :text="getPreview(sub)" side="right">
                                                    <Button
                                                        emphasis="quiet"
                                                        :data-toc-id="sub.id"
                                                        @click="navigateTo(sub.id)"
                                                        class="sidebar-link sidebar-sublink font-serif-math"
                                                        :aria-current="isActive(sub.id) ? 'location' : undefined"
                                                        :style="isActive(sub.id)
                                                            ? { color: sectionColorVar(si), fontWeight: '600', background: 'color-mix(in srgb, var(--muted) 40%, transparent)' }
                                                            : {}"
                                                    >
                                                        <span v-if="sub.number" class="sidebar-number fira-code">{{ sub.number }}.</span>
                                                        <span v-html="renderTitle(sub.title)" />
                                                    </Button>
                                                </Tooltip>
                                                <ol v-if="sub.subsections && isInActiveChain(sub.id)" class="sidebar-subsublist">
                                                    <li v-for="subsub in sub.subsections" :key="subsub.id">
                                                        <Button
                                                            emphasis="quiet"
                                                            :data-toc-id="subsub.id"
                                                            @click="navigateTo(subsub.id)"
                                                            class="sidebar-link sidebar-subsublink font-serif-math"
                                                            :aria-current="isActive(subsub.id) ? 'location' : undefined"
                                                            :style="isActive(subsub.id)
                                                                ? { color: sectionColorVar(si), fontWeight: '600', background: 'color-mix(in srgb, var(--muted) 40%, transparent)' }
                                                                : {}"
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

    <!-- ── floating: the bar + dropdown below lg ─────────────────────────── -->
    <div v-else class="floating-toc lg:hidden">
        <div class="floating-toc-anchor">
            <!-- Search mode: input replaces section title -->
            <div v-if="searchActive" ref="searchBarRef" class="floating-toc-bar floating-toc-bar--search glass-resting">
                <PaperSearch ref="mobileSearchRef" :search="search" variant="floating" :boundary="searchBarRef" />
                <Button emphasis="quiet" size="md" icon-only type="button" class="floating-toc-search-close" @click="closeMobileSearch" aria-label="Close search">
                    <X class="h-4 w-4" />
                </Button>
            </div>
            <!-- Normal mode: section title + search icon. `D/B-4`: the search
                 control is a real sibling `<Button>`, outside the trigger.
                 `D/M-13`: the trigger announces its state and its panel. -->
            <div v-else class="floating-toc-bar floating-toc-bar--trigger glass-resting">
                <Button
                    ref="tocTrigger"
                    emphasis="quiet"
                    type="button"
                    class="floating-toc-title-btn"
                    :aria-expanded="floatingTocOpen"
                    :aria-controls="dropdownId"
                    @click="floatingTocOpen = !floatingTocOpen"
                >
                    <span class="floating-toc-section font-serif-math">
                        <span class="fira-code text-xs opacity-50">{{ currentSection?.number }}.</span>
                        {{ currentSection?.title }}
                    </span>
                    <ChevronDown class="floating-toc-chevron" :class="{ 'rotate-180': floatingTocOpen }" />
                </Button>
                <Button
                    emphasis="quiet"
                    size="md" icon-only
                    type="button"
                    class="floating-toc-search-btn"
                    aria-label="Search paper"
                    @click="openMobileSearch"
                >
                    <Search class="h-3.5 w-3.5" />
                </Button>
            </div>
            <Transition name="toc-expand">
                <div
                    v-if="floatingTocOpen"
                    :id="dropdownId"
                    ref="dropdownRef"
                    class="floating-toc-dropdown glass-floating"
                    role="group"
                    aria-label="Table of contents"
                    tabindex="-1"
                    @keydown.esc="dismissDropdown"
                >
                    <Button
                        emphasis="quiet"
                        class="floating-toc-item floating-toc-top font-serif-math"
                        @click="handleScrollToTop"
                    >
                        <ChevronUp class="floating-toc-top-icon" />
                        Scroll to top
                    </Button>

                    <div class="floating-toc-divider" />

                    <template v-for="(section, si) in sections" :key="section.id">
                        <!-- X.F.W14.u — UIA-F-24: navigate and toggle are two
                             controls, as in the rail (L-5(a)). -->
                        <div class="floating-toc-row">
                            <Button
                                emphasis="quiet"
                                class="floating-toc-item floating-toc-root font-serif-math"
                                :aria-current="activeRootId === section.id ? 'location' : undefined"
                                :style="activeRootId === section.id ? { color: sectionColorVar(si) } : {}"
                                @click="selectSection(section.id)"
                            >
                                <span class="fira-code text-xs opacity-50">{{ section.number }}.</span>
                                {{ section.title }}
                            </Button>
                            <Button
                                v-if="hasChildren(section)"
                                emphasis="quiet"
                                size="md"
                                icon-only
                                class="floating-toc-disclosure"
                                :aria-label="`Subsections of ${plainTitle(section)}`"
                                :aria-expanded="isExpanded(section.id)"
                                @click="toggleSection(section.id)"
                            >
                                <component
                                    :is="isExpanded(section.id) ? ChevronDown : ChevronRight"
                                    class="floating-toc-collapse-icon"
                                />
                            </Button>
                        </div>
                        <template v-if="isExpanded(section.id)">
                            <Button
                                v-for="sub in section.subsections"
                                :key="sub.id"
                                emphasis="quiet"
                                class="floating-toc-item floating-toc-sub font-serif-math"
                                @click="selectSection(sub.id)"
                            >
                                <span class="fira-code text-xs opacity-40">{{ sub.number }}.</span>
                                {{ sub.title }}
                            </Button>
                        </template>
                    </template>
                </div>
            </Transition>

            <!-- Backdrop to close dropdown on outside tap -->
            <div
                v-if="floatingTocOpen"
                class="floating-toc-backdrop"
                aria-hidden="true"
                @click="dismissDropdown"
            />
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
    --sidebar-top-inset: 1rem;
    --sidebar-bottom-inset: 1.5rem;
    --paper-toc-width: 220px;
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
    border-radius: var(--radius-panel);
    border: 2px solid color-mix(in srgb, var(--foreground) 15%, transparent);
    background: var(--card);
    box-shadow: 3px 3px 0px 0px color-mix(in srgb, var(--foreground) 8%, transparent);
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

.sidebar-link {
    display: block;
    width: 100%;
    text-align: left;
    /* `D-M10` = `C-M1(a)`: the Button base ships `whitespace-nowrap`, which
       nothing here reset — so ToC titles could not wrap in a 220px rail and
       minted a horizontal scroll axis instead. The authored `line-height:
       1.35` below is the tell that these rows were meant to wrap. */
    white-space: normal;
    background: none;
    border: none;
    cursor: pointer;
    @apply text-base;
    font-weight: 500;
    line-height: 1.35;
    padding: 0.28rem 0.625rem;
    /* X.F.W14.r — F.W13 `.a` residual (r2): the row's corner is the glass
       row canon, the `--radius-lg` its own `.interactive-item` / menu-row
       idiom carries, not a hand-derived `calc(var(--radius) - 2px)`. */
    border-radius: var(--radius-lg);
    color: var(--muted-foreground);
    /* `PV ★MF-6`: `font-weight` was in the transitioned set — a reflow per
       frame plus synthesized-weight snapping against the remapped serif, and
       only for full-motion users. Deleted, not re-tuned.
       `D-M6`: the durations are the canonical registers now, and a colour
       cross-fade gets the standard curve rather than the expo one the
       producer's own doctrine reserves for movement. */
    transition:
        color var(--duration-fast) var(--ease-standard),
        background-color var(--duration-fast) var(--ease-standard);
}

.sidebar-link:hover {
    color: var(--foreground);
    background: color-mix(in srgb, var(--muted) 70%, transparent);
}

/* `D-M3`: the hover plate measured 1.022:1 light / 1.08 dark — a response the
   eye cannot see — and the ACTIVE row, the likeliest pointer target, had none
   at all because `background: none` won by source order over the hover rule.
   The plate is a real one now and the active row keeps it. */
/* X.F.W3 repair 1 — the published active-state vocabulary, applied
   (`FR-COB-3` ⊕ `fr-App MG-η`). Two spellings died here, not one. `.is-active`
   on the section row was the state itself on a control that announced nothing;
   `.is-active-sub` on the subsection row was the vocabulary's DEAD spelling —
   no `.is-active-sub` rule exists in this file or anywhere in the tree (⟨cmd⟩
   `grep -rn 'is-active-sub' src` → that one binding), so it painted nothing
   while teaching the next reader a channel that does nothing. Both are now
   `aria-current`, the channel the vocabulary gives a nav item marking the
   current location; `location` and not `page`, because these rows address
   SECTIONS INSIDE one document rather than sibling routes, and the hook
   `[aria-current]` is value-agnostic by construction. The sub-subsection row
   gains the same attribute: it could already be the current location and was
   the one rank that announced it by neither class nor attribute. The
   conditional `:style` beside each stays — a per-section colour the cascade
   cannot express without a variable, not a state spelling. Note the ROW
   SEMANTICS the attribute fixes: the old sub binding was `isActive(sub.id) ||
   isInActiveChain(sub.id)`, which would have marked an ANCESTOR of the current
   section as current; `aria-current` is bound to `isActive` alone. */
.sidebar-link[aria-current] {
    font-weight: 600;
}

.sidebar-link[aria-current]:hover {
    background: color-mix(in srgb, var(--muted) 70%, transparent);
}

.sidebar-number {
    font-size: 0.72rem;
    margin-right: 0.22rem;
    opacity: 0.5;
}

.sidebar-link[aria-current] .sidebar-number {
    opacity: 0.8;
}

/* W3.5.c — Collapsible animation driven by glass-ui `CollapsibleContent`
   (reka-ui's `--reka-collapsible-content-height` CSS var).
   X·F F.W4 `.e` — `fr-PaperSidebar D-B1` re-measured at the ADOPTED pin: the
   recipe `.disclosure-content{animation-name:disclosure-open|close;
   animation-duration:var(--spring-present-duration); overflow:hidden}` is
   emitted by `dist/glass-ui.css`, which `dist/styles/index.css` imports at its
   tail — so the comment above is TRUE at 8.0.0 and was false only at the 4.0.0
   pin the record was taken against (root cause `M1`). `C-m8`: the local
   `.sidebar-sublist-wrapper{overflow:hidden}` restated that producer invariant
   verbatim and is deleted rather than doubled. */
.sidebar-sublist {
    list-style: none;
    padding: 0 0 0 0.625rem;
    margin: 0.0625rem 0 0.125rem;
}

.sidebar-sublink {
    font-size: 0.78rem;
    padding: 0.2rem 0.45rem;
}

.sidebar-subsublist {
    list-style: none;
    padding: 0 0 0 0.5rem;
    margin: 0.03125rem 0 0.0625rem;
}

.sidebar-subsublink {
    font-size: 0.72rem;
    padding: 0.15rem 0.32rem;
}

/* ── floating ───────────────────────────────────────────────────────────── */
.floating-toc {
    position: sticky;
    top: 0;
    z-index: var(--z-controls);
    height: 0;
    overflow: visible;
}

.floating-toc-anchor {
    position: relative;
}

.floating-toc-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    width: 100%;
    padding: 0.625rem 1rem;
    border: none;
    border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
    cursor: pointer;
    text-align: left;
    @apply text-base;
    font-weight: 500;
    color: var(--foreground);
    position: relative;
    z-index: 2;
}

.floating-toc-section {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
}

.floating-toc-title-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    color: inherit;
    padding: 0;
}

.floating-toc-search-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 0.25rem;
    border-radius: var(--radius-sm);
    background: none;
    border: none;
    cursor: pointer;
    /* `PV D/M-9`: the 50% dilution measured 2.x:1 against the bar. */
    color: var(--muted-foreground);
    /* A.W3.d — named properties + canonical token, no `transition: all`. */
    transition: color 0.15s var(--ease-standard), background-color 0.15s var(--ease-standard);
}

.floating-toc-search-btn:hover {
    color: var(--foreground);
    background: color-mix(in srgb, var(--muted) 50%, transparent);
}

.floating-toc-bar--search {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: default;
}

.floating-toc-bar--search > :first-child {
    flex: 1;
    min-width: 0;
}

.floating-toc-search-close {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    border: none;
    background: none;
    /* `D/M-9`: the 60% dilution is below the floor; the plain rung measures
       5.197:1 light / 7.716:1 dark against the page. */
    color: var(--muted-foreground);
    cursor: pointer;
    flex-shrink: 0;
}

.floating-toc-search-close:hover {
    color: var(--foreground);
}

.floating-toc-chevron {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    opacity: 0.6;
    /* A.W3.d — the file's last untokenised easing. */
    transition: transform var(--duration-fast) var(--ease-standard);
}
.floating-toc-chevron.rotate-180 {
    opacity: 0.8;
}

.floating-toc-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 2;
    border-bottom: 1px solid var(--border);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    max-height: 60vh;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
    padding: 0.5rem;
}

.floating-toc-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1;
}

.floating-toc-top {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    color: var(--muted-foreground);
    font-size: 0.75rem;
    line-height: 1rem;
}

.floating-toc-top-icon {
    width: 0.875rem;
    height: 0.875rem;
    opacity: 0.6;
}

.floating-toc-divider {
    height: 1px;
    background: color-mix(in srgb, var(--border) 50%, transparent);
    margin: 0.25rem 0.75rem;
}

.floating-toc-item {
    display: block;
    width: 100%;
    padding: 0.5rem 0.75rem;
    border-radius: var(--radius-md);
    border: none;
    background: none;
    cursor: pointer;
    text-align: left;
    @apply text-base;
    color: var(--muted-foreground);
    /* A.W3.d — named properties + canonical token, no `transition: all`. */
    transition: color 0.15s var(--ease-standard), background-color 0.15s var(--ease-standard);
}

.floating-toc-root {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.floating-toc-row {
    display: flex;
    align-items: center;
}

.floating-toc-row > .floating-toc-root {
    flex: 1;
    min-width: 0;
}

.floating-toc-disclosure {
    flex-shrink: 0;
}

.floating-toc-collapse-icon {
    width: 0.875rem;
    height: 0.875rem;
    flex-shrink: 0;
    opacity: 0.45;
}

.floating-toc-sub {
    padding-left: 2.25rem;
    font-size: 0.8125rem;
    /* `D/M-9`: same class of dilution, same cure. */
    color: var(--muted-foreground);
}

/* X.F.W3 repair 1 — the published active-state vocabulary, applied
   (`FR-COB-3` ⊕ `fr-App MG-η`). A toc row is a nav item marking the current
   location, so the channel is `aria-current` and the paint keys on it. The
   value is `location` rather than `page` because these rows address SECTIONS
   INSIDE one document, not sibling routes; the vocabulary's CSS hook is
   `[aria-current]`, value-agnostic by construction, and the AppHeader route
   tabs that do address pages keep `page`. `.is-active` announced nothing, so
   the current section was marked by weight and colour alone and a
   screen-reader user heard an undifferentiated list. The conditional `:style`
   beside it stays: it carries a PER-SECTION colour the cascade cannot express
   without a variable, it is not a state spelling, and the same shape is already
   the tree's idiom at `BasisSelector.vue:144`. */
.floating-toc-item:hover,
.floating-toc-item[aria-current] {
    background: color-mix(in srgb, var(--muted) 50%, transparent);
    color: var(--foreground);
}

.floating-toc-item[aria-current] {
    font-weight: 600;
}

/* ── Transition: toc-expand ──────────────────────────────── */
/* A.W3.d — bezier→`--ease-out-expo`. */
.toc-expand-enter-active,
.toc-expand-leave-active {
    transition: opacity 0.2s var(--ease-standard),
                transform 0.2s var(--ease-out-expo);
}

.toc-expand-enter-from {
    opacity: 0;
    transform: translateY(-0.5rem);
}

.toc-expand-leave-to {
    opacity: 0;
    transform: translateY(-0.5rem);
}
</style>
