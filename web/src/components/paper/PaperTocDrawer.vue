<script setup lang="ts">
/**
 * X.F.W14V.au5 — A2-FO-L1-1: the DESKTOP host of the one ToC tree
 * (`PaperTocTree`), split out of the 909-line `PaperToc.vue` (two hosts, two
 * hand-rolled trees, both search variants). This file is the drawer and
 * nothing else; the rows are the tree's.
 *
 * X.F.W14U.t — per the owner (2026-09-24), the ToC is a drawer: "it should
 * slide under the paper and become a drawer that expands out to where it is
 * now." The toggle collapses the paper grid's ToC column; the paper slides
 * over the ToC, which is clipped at the column's inline end and goes under
 * it, and a drawer tab stays at the paper's edge. Expanding returns the column
 * to its width, so the ToC is exactly where it was (its own scroll kept — it
 * never unmounts). The state persists per viewer (`useSafeStorage`).
 *
 * P-2 (COHESION §0cr): glass has no edge-drawer-under-content primitive, so
 * the drawer is fourier's layout, and ALL of its motion lives in this file's
 * one `.paper-sidebar` rule block, so one glass primitive can replace it at
 * the landing repin (P-2-ADOPT). The visible surfaces are glass's (`Button`,
 * `Collapsible`, `Tooltip`); none is copied or restyled.
 */
// X.F.W3 repair 1 / `FR-TT-20` — THE ONE IMPORT IDENTITY: the tooltip barrel.
import { Tooltip } from "@/components/ui/tooltip";
import PaperSearch from "./PaperSearch.vue";
import PaperTocTree from "./PaperTocTree.vue";
import type { PaperSearchState } from "./search/usePaperSearch";
import { injectPaperToc } from "./paperToc";
import { safeGetItem, safeSetItem } from "@/composables/useSafeStorage";
import { Button } from "@mkbabb/glass-ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@mkbabb/glass-ui/collapsible";
import { ArrowUpToLine, ChevronUp, PanelLeftClose, PanelLeftOpen } from "@lucide/vue";
import { nextTick, onBeforeUnmount, ref, useId, useTemplateRef, watch } from "vue";

defineProps<{
    renderTitle: (title: string) => string;
    search: PaperSearchState;
}>();

// The ONE ToC model, injected (COHESION §0o ESC-2 / §3 D9).
const toc = injectPaperToc();
const { sections, scrollToTop } = toc;

/** A glass `Button` ref is the component instance; its root is `$el`. */
function elementOf(r: unknown): HTMLElement | null {
    if (!r) return null;
    return r instanceof HTMLElement ? r : ((r as { $el?: HTMLElement }).$el ?? null);
}

/** X.F.W13.a — the CONTENTS disclosure's state; the list opens on arrival. */
const contentsOpen = ref(true);

// Only the drawer's list is scroll-followed (`useSidebarFollow`); the phone
// bar never registers, so its mount/unmount cannot clear the drawer's.
const sidebarNav = ref<HTMLElement | null>(null);
watch(sidebarNav, (el) => toc.registerNavEl(el), { immediate: true });
onBeforeUnmount(() => toc.registerNavEl(null));

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
</script>

<template>
    <aside class="paper-sidebar" :data-state="drawerOpen ? 'open' : 'closed'">
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
                        <!-- X.F.W14V.au5 — A2-FO-L1-1: the one tree. -->
                        <PaperTocTree :nodes="sections" :render-title="renderTitle" />
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
</template>

<style scoped>
@reference "tailwindcss";

/* ── the drawer ───────────────────────────────────────────────────────────────────
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

</style>
