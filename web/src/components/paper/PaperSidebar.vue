<script setup lang="ts">
import Tooltip from "@/components/ui/tooltip/Tooltip.vue";
import PaperSearch from "./PaperSearch.vue";
import type { PaperSectionData } from "@/lib/paperContent";
import type { PaperSearchState } from "./search/usePaperSearch";
import { Button, Collapsible, CollapsibleContent } from "@mkbabb/glass-ui";
import { useSidebarState } from "@mkbabb/glass-ui/sidebar";
import { ChevronUp } from "lucide-vue-next";

import { ref } from "vue";

const props = defineProps<{
    sections: PaperSectionData[];
    activeRootId: string | null;
    activeId: string | null;
    scrollTo: (id: string) => void;
    scrollToTop: () => void;
    renderTitle: (title: string) => string;
    treeIndex: Map<string, any>;
    isActive: (id: string, activeId: string | null) => boolean;
    isInActiveChain: (id: string, activeId: string | null) => boolean;
    getPreview: (section: PaperSectionData) => string;
    search: PaperSearchState;
}>();

const sidebarNav = ref<HTMLElement | null>(null);
defineExpose({ sidebarNav });

// ── Section expand/collapse — delegated to glass-ui's `useSidebarState`
//    (W3.5.c). The composable encapsulates the userExpanded/userCollapsed
//    reactive Sets + isExpanded/toggleSection logic that previously lived
//    in both `PaperSidebar.vue` and `MobileFloatingToc.vue`. We supply
//    `getChildren` because `PaperSectionData` stores children under
//    `subsections` rather than the canonical `children` key — glass-ui's
//    composable was augmented (same commit) to accept this override,
//    symmetric with `useTreeIndex` / `useScrollTracker`.
const sidebarState = useSidebarState<PaperSectionData>({
    sections: props.sections,
    activeId: () => props.activeId,
    activeRootId: () => props.activeRootId,
    scrollTo: (id) => props.scrollTo(id),
    scrollToTop: () => props.scrollToTop(),
    getChildren: (n) => n.subsections,
});
</script>

<template>
    <aside class="paper-sidebar">
        <nav ref="sidebarNav" class="sidebar-nav scrollbar-thin" aria-label="Table of contents">
            <PaperSearch :search="search" variant="sidebar" />
            <div class="sidebar-header">
                <p class="sidebar-label cm-serif">Contents</p>
                <Button
                    variant="ghost"
                    size="icon"
                    class="sidebar-top-btn"
                    @click="scrollToTop"
                    title="Scroll to top"
                >
                    <ChevronUp class="h-3 w-3" />
                </Button>
            </div>
            <ol class="sidebar-list">
                <li v-for="(section, si) in sections" :key="section.id">
                    <Collapsible
                        :open="sidebarState.isExpanded(section.id)"
                        @update:open="sidebarState.toggleSection(section.id)"
                    >
                        <Tooltip :text="getPreview(section)" side="right">
                            <Button
                                variant="ghost"
                                :data-toc-id="section.id"
                                @click="sidebarState.toggleSection(section.id)"
                                class="sidebar-link cm-serif"
                                :class="{ 'is-active': activeRootId === section.id }"
                                :style="activeRootId === section.id ? { color: `var(--section-color-${si})` } : {}"
                            >
                                <span v-if="section.number" class="sidebar-number fira-code">{{ section.number }}.</span>
                                <span v-html="renderTitle(section.title)" />
                            </Button>
                        </Tooltip>
                        <!-- Subsections — glass-ui Collapsible drives the
                             expand/collapse animation via `data-state`. -->
                        <CollapsibleContent v-if="section.subsections" class="sidebar-sublist-wrapper">
                            <ol class="sidebar-sublist">
                                <li v-for="sub in section.subsections" :key="sub.id">
                                    <Tooltip :text="getPreview(sub)" side="right">
                                        <Button
                                            variant="ghost"
                                            :data-toc-id="sub.id"
                                            @click="scrollTo(sub.id)"
                                            class="sidebar-link sidebar-sublink cm-serif"
                                            :class="{ 'is-active-sub': isActive(sub.id, activeId) || isInActiveChain(sub.id, activeId) }"
                                                :style="isActive(sub.id, activeId)
                                                    ? { color: `var(--section-color-${si})`, fontWeight: '600', background: 'color-mix(in srgb, var(--muted) 40%, transparent)' }
                                                    : {}"
                                        >
                                            <span v-if="sub.number" class="sidebar-number fira-code">{{ sub.number }}.</span>
                                            <span v-html="renderTitle(sub.title)" />
                                        </Button>
                                    </Tooltip>
                                    <!-- Sub-subsections -->
                                    <ol v-if="sub.subsections && isInActiveChain(sub.id, activeId)" class="sidebar-subsublist">
                                        <li v-for="subsub in sub.subsections" :key="subsub.id">
                                            <Button
                                                variant="ghost"
                                                :data-toc-id="subsub.id"
                                                @click="scrollTo(subsub.id)"
                                                class="sidebar-link sidebar-subsublink cm-serif"
                                                :style="isActive(subsub.id, activeId)
                                                    ? { color: `var(--section-color-${si})`, fontWeight: '600', background: 'color-mix(in srgb, var(--muted) 40%, transparent)' }
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
        </nav>
    </aside>
</template>

<style scoped>
@reference "tailwindcss";
.paper-sidebar {
    --sidebar-top-inset: 1rem;
    --sidebar-bottom-inset: 1.5rem;
    display: none;
}

@media (min-width: 1024px) {
    .paper-sidebar {
        display: block;
        position: sticky;
        top: var(--sidebar-top-inset);
        align-self: start;
        min-height: 0;
        max-height: calc(
            var(--paper-scroll-viewport-height, 100dvh) - var(--sidebar-top-inset) - var(--sidebar-bottom-inset)
        );
    }
}

.sidebar-nav {
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
    border-radius: 0.75rem;
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

.sidebar-label {
    @apply text-sm;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: color-mix(in srgb, var(--muted-foreground) 60%, transparent);
    margin: 0;
}

.sidebar-top-btn {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 0.25rem;
    border: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
    background: none;
    color: color-mix(in srgb, var(--muted-foreground) 45%, transparent);
    cursor: pointer;
    /* A.W3.d — named properties + canonical token, no `transition: all`. */
    transition: color 0.15s var(--ease-standard), border-color 0.15s var(--ease-standard), background-color 0.15s var(--ease-standard);
}

.sidebar-top-btn:hover {
    color: var(--foreground);
    border-color: var(--border);
    background: color-mix(in srgb, var(--muted) 50%, transparent);
}

.sidebar-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.0625rem;
}

.sidebar-link {
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
    @apply text-base;
    font-weight: 500;
    line-height: 1.35;
    padding: 0.28rem 0.625rem;
    border-radius: calc(var(--radius) - 2px);
    color: var(--muted-foreground);
    /* A.W3.d — bezier→`--ease-out-expo`. */
    transition: color 0.25s var(--ease-out-expo),
                background-color 0.25s var(--ease-out-expo),
                font-weight 0.15s var(--ease-standard);
}

.sidebar-link:hover {
    color: var(--foreground);
    background: color-mix(in srgb, var(--muted) 50%, transparent);
}

.sidebar-link.is-active {
    background: none;
    font-weight: 600;
}

.sidebar-number {
    font-size: 0.72rem;
    margin-right: 0.22rem;
    opacity: 0.5;
}

.sidebar-link.is-active .sidebar-number {
    opacity: 0.8;
}

/* W3.5.c — Collapsible animation driven by glass-ui `CollapsibleContent`
   (reka-ui's `--reka-collapsible-content-height` CSS var). The previous
   hand-rolled `grid-template-rows: 0fr → 1fr` shim is retired. */
.sidebar-sublist-wrapper {
    overflow: hidden;
}

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
</style>
