<script setup lang="ts">
import Tooltip from "@/components/ui/tooltip/Tooltip.vue";
import PaperSearch from "./PaperSearch.vue";
import type { PaperSectionData } from "@/lib/paperContent";
import type { PaperSearchState } from "./usePaperSearch";
import { ChevronUp } from "lucide-vue-next";

import { ref, reactive } from "vue";

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

// Tracks user overrides for section expand/collapse state
const userExpanded = reactive(new Set<string>());
const userCollapsed = reactive(new Set<string>());

function isSectionExpanded(sectionId: string): boolean {
    if (userCollapsed.has(sectionId)) return false;
    if (userExpanded.has(sectionId)) return true;
    return props.activeRootId === sectionId;
}

function handleSectionClick(sectionId: string) {
    if (isSectionExpanded(sectionId)) {
        // Currently expanded → collapse
        userExpanded.delete(sectionId);
        userCollapsed.add(sectionId);
    } else {
        // Currently collapsed → expand
        userCollapsed.delete(sectionId);
        userExpanded.add(sectionId);
    }
}
</script>

<template>
    <aside class="paper-sidebar">
        <nav ref="sidebarNav" class="sidebar-nav scrollbar-thin">
            <PaperSearch :search="search" variant="sidebar" />
            <div class="sidebar-header">
                <p class="sidebar-label cm-serif">Contents</p>
                <button
                    class="sidebar-top-btn"
                    @click="scrollToTop"
                    title="Scroll to top"
                >
                    <ChevronUp class="h-3 w-3" />
                </button>
            </div>
            <ol class="sidebar-list">
                <li v-for="(section, si) in sections" :key="section.id">
                    <Tooltip :text="getPreview(section)" side="right">
                        <button
                            :data-toc-id="section.id"
                            @click="handleSectionClick(section.id)"
                            class="sidebar-link cm-serif"
                            :class="{ 'is-active': activeRootId === section.id }"
                            :style="activeRootId === section.id ? { color: `var(--section-color-${si})` } : {}"
                        >
                            <span v-if="section.number" class="sidebar-number fira-code">{{ section.number }}.</span>
                            <span v-html="renderTitle(section.title)" />
                        </button>
                    </Tooltip>
                    <!-- Subsections (animated expand) -->
                    <div
                        v-if="section.subsections"
                        class="sidebar-sublist-wrapper"
                        :class="{ 'is-expanded': isSectionExpanded(section.id) }"
                    >
                        <ol class="sidebar-sublist">
                            <li v-for="sub in section.subsections" :key="sub.id">
                                <Tooltip :text="getPreview(sub)" side="right">
                                    <button
                                        :data-toc-id="sub.id"
                                        @click="scrollTo(sub.id)"
                                        class="sidebar-link sidebar-sublink cm-serif"
                                        :class="{ 'is-active-sub': isActive(sub.id, activeId) || isInActiveChain(sub.id, activeId) }"
                                            :style="isActive(sub.id, activeId)
                                                ? { color: `var(--section-color-${si})`, fontWeight: '600', background: 'hsl(var(--muted) / 0.4)' }
                                                : {}"
                                    >
                                        <span v-if="sub.number" class="sidebar-number fira-code">{{ sub.number }}.</span>
                                        <span v-html="renderTitle(sub.title)" />
                                    </button>
                                </Tooltip>
                                <!-- Sub-subsections -->
                                <ol v-if="sub.subsections && isInActiveChain(sub.id, activeId)" class="sidebar-subsublist">
                                    <li v-for="subsub in sub.subsections" :key="subsub.id">
                                        <button
                                            :data-toc-id="subsub.id"
                                            @click="scrollTo(subsub.id)"
                                            class="sidebar-link sidebar-subsublink cm-serif"
                                            :style="isActive(subsub.id, activeId)
                                                ? { color: `var(--section-color-${si})`, fontWeight: '600', background: 'hsl(var(--muted) / 0.4)' }
                                                : {}"
                                        >
                                            <span v-if="subsub.number" class="sidebar-number fira-code">{{ subsub.number }}.</span>
                                            <span v-html="renderTitle(subsub.title)" />
                                        </button>
                                    </li>
                                </ol>
                            </li>
                        </ol>
                    </div>
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
    border: 2px solid hsl(var(--foreground) / 0.15);
    background: hsl(var(--card));
    box-shadow: 3px 3px 0px 0px hsl(var(--foreground) / 0.08);
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
    color: hsl(var(--muted-foreground) / 0.6);
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
    border: 1px solid hsl(var(--border) / 0.4);
    background: none;
    color: hsl(var(--muted-foreground) / 0.45);
    cursor: pointer;
    transition: all 0.15s ease;
}

.sidebar-top-btn:hover {
    color: hsl(var(--foreground));
    border-color: hsl(var(--border));
    background: hsl(var(--muted) / 0.5);
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
    color: hsl(var(--muted-foreground));
    transition: color 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                background-color 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                font-weight 0.15s ease;
}

.sidebar-link:hover {
    color: hsl(var(--foreground));
    background: hsl(var(--muted) / 0.5);
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

/* Animated subsection expand/collapse */
.sidebar-sublist-wrapper {
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    transition: grid-template-rows 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.sidebar-sublist-wrapper.is-expanded {
    grid-template-rows: 1fr;
    opacity: 1;
}

.sidebar-sublist-wrapper > .sidebar-sublist {
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
