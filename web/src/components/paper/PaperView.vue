<script setup lang="ts">
import {
    useKatex,
    PAPER_CONTEXT,
    type PaperContext,
    flattenPaperSections,
    useClickDelegate,
    useSidebarFollow,
    useTreeIndex,
    useVirtualSectionWindow,
} from "@mkbabb/latex-paper/vue";
import "@mkbabb/latex-paper/theme";
import PaperSidebar from "./PaperSidebar.vue";
import MobileFloatingToc from "./MobileFloatingToc.vue";
import PaperArticleWindow from "./PaperArticleWindow.vue";
import { getPaperPreview, paperSectionToTreeNode } from "./paperTree";
import { useScrollNavigation } from "./useScrollNavigation";
import { usePaperSearch } from "./search/usePaperSearch";
import { paperSections, labelMap, totalPages, pageMap, extractedMacros } from "@/lib/paperContent";
import type { PaperSectionData } from "@/lib/paperContent";
import { ref, computed, provide, onMounted, onUnmounted, nextTick, watch } from "vue";
import { Button } from "@mkbabb/glass-ui";
import { Undo2 } from "lucide-vue-next";

// ── KaTeX with app-specific macros ─────────────────────────
const macros: Record<string, string> = {
    ...extractedMacros,
    "\\deriv": "\\mathrm{d}",
    "\\ihat": "\\boldsymbol{\\hat{\\imath}}",
    "\\jhat": "\\boldsymbol{\\hat{\\jmath}}",
    "\\khat": "\\boldsymbol{\\hat{k}}",
    "\\ehat": "\\boldsymbol{\\hat{e}}",
    "\\dott": "\\boldsymbol{\\cdot}",
    "\\leftrightarrow": "\\longleftrightarrow",
    "\\Leftrightarrow": "\\Longleftrightarrow",
};

const { renderInline, renderDisplay, renderTitle } = useKatex(macros);

const scrollContainer = ref<HTMLElement | null>(null);
const sectionWindowRoot = ref<HTMLElement | null>(null);
const sectionStartOffsetPx = ref(0);
const scrollViewportHeightPx = ref(0);
const sidebarRef = ref<InstanceType<typeof PaperSidebar> | null>(null);
const baseUrl = import.meta.env.BASE_URL;
const flatSections = flattenPaperSections(paperSections);
const treeNodes = paperSections.map(paperSectionToTreeNode);
const { index: treeIndex, isActive, isInActiveChain } = useTreeIndex(treeNodes);

// ── Build PaperContext and wire up tracking ────────────────
let _scrollTo: (id: string) => void = () => {};

const paperContext: PaperContext = {
    sections: paperSections,
    labelMap,
    renderInline,
    renderDisplay,
    renderTitle,
    assetBase: `${baseUrl}assets/`,
    scrollToId: (id) => _scrollTo(id),
};

provide(PAPER_CONTEXT, paperContext);

const SCROLL_POS_KEY = "paper-active-section";

const {
    visibleItems,
    topSpacerPx,
    bottomSpacerPx,
    measureSection,
    ensureTargetWindow,
    getOffsetFor,
    activeId,
    activeRootId,
    recalculate,
} = useVirtualSectionWindow({
    items: flatSections,
    scrollContainer,
    overscanBeforePx: 240,
    overscanAfterPx: 720,
    leadingOffsetPx: sectionStartOffsetPx,
    warmTargetBefore: 2,
    warmTargetAfter: 3,
});

useClickDelegate({
    container: scrollContainer,
    selector: ".paper-ref",
    attribute: "data-ref",
    resolve: (refKey) => {
        const info = labelMap[refKey];
        if (!info) return null;
        return info.anchorId ?? info.elementId ?? info.sectionId;
    },
    scrollTo: (id) => _scrollTo(id),
});

const { navigateTo, navigateBack, scrollToTop, performScroll, navStack } = useScrollNavigation({
    scrollContainer,
    contentStartOffsetPx: sectionStartOffsetPx,
    activeId,
    ensureTargetWindow,
    getOffsetFor,
    recalculate,
});

// Wire all navigation (TOC clicks, cross-references) through navigateTo
_scrollTo = navigateTo;

const search = usePaperSearch({ sections: paperSections, navigateTo });

function handleGlobalKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        search.open();
    }
}

const sections = computed(() => paperSections);
const currentPage = ref(pageMap[flatSections[0]?.id] ?? 1);
const paperRootStyle = computed(() =>
    scrollViewportHeightPx.value > 0
        ? { "--paper-scroll-viewport-height": `${scrollViewportHeightPx.value}px` }
        : {},
);
let scrollContainerResizeObserver: ResizeObserver | null = null;

watch(
    activeId,
    (id) => {
        if (!id) return;
        const page = pageMap[id];
        if (page !== undefined) currentPage.value = page;
        // Don't persist the first section — it's the top of the page
        try {
            if (id === flatSections[0]?.id) sessionStorage.removeItem(SCROLL_POS_KEY);
            else sessionStorage.setItem(SCROLL_POS_KEY, id);
        } catch {}
    },
    { immediate: true },
);

// ── Mobile floating TOC visibility ───────────────────────────
const mobileNavRef = ref<HTMLElement | null>(null);
const mobileTocVisible = ref(true);
let mobileTocObserver: IntersectionObserver | null = null;

function updateSectionStartOffset() {
    const root = sectionWindowRoot.value;
    const scroller = scrollContainer.value;
    if (!root || !scroller) return;
    sectionStartOffsetPx.value =
        root.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top +
        scroller.scrollTop;
}

function updateScrollViewportHeight() {
    const scroller = scrollContainer.value;
    scrollViewportHeightPx.value = scroller?.clientHeight ?? 0;
}

function registerWindowRoot(el: HTMLElement | null) {
    if (sectionWindowRoot.value === el) return;
    sectionWindowRoot.value = el;
    if (!el) return;
    nextTick(() => {
        updateSectionStartOffset();
        recalculate();
    });
}

function handleWindowResize() {
    updateScrollViewportHeight();
    updateSectionStartOffset();
    recalculate();
}

function bindScrollContainerObserver(scroller: HTMLElement | null) {
    scrollContainerResizeObserver?.disconnect();
    scrollContainerResizeObserver = null;
    if (!scroller || typeof ResizeObserver === "undefined") return;
    scrollContainerResizeObserver = new ResizeObserver(() => {
        updateScrollViewportHeight();
        updateSectionStartOffset();
        recalculate();
    });
    scrollContainerResizeObserver.observe(scroller);
}

const sidebarNavEl = computed(() => sidebarRef.value?.sidebarNav ?? null);
const { queueSidebarFollow } = useSidebarFollow({
    sidebarEl: sidebarNavEl,
    activeId,
    activeRootId,
    scrollSource: scrollContainer,
});

const currentSection = computed(() => {
    if (!activeRootId.value) return null;
    const entry = treeIndex.get(activeRootId.value);
    if (!entry) return null;
    return paperSections.find((s) => s.id === entry.node.id) ?? null;
});

onMounted(() => {
    mobileTocObserver = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                mobileTocVisible.value = entry.isIntersecting;
            }
        },
        { threshold: 0 },
    );
    nextTick(() => {
        if (mobileNavRef.value) mobileTocObserver!.observe(mobileNavRef.value);
        updateScrollViewportHeight();
        updateSectionStartOffset();
        recalculate();
        queueSidebarFollow(true);

        // Restore scroll position from session (skip first section — that's the top)
        try {
            const saved = sessionStorage.getItem(SCROLL_POS_KEY);
            if (saved && saved !== flatSections[0]?.id && flatSections.some((s) => s.id === saved)) {
                performScroll(saved);
            }
        } catch {}
    });
    window.addEventListener("resize", handleWindowResize);
    window.addEventListener("keydown", handleGlobalKeydown);
});

watch([scrollContainer, sectionWindowRoot], ([scroller, root]) => {
    bindScrollContainerObserver(scroller);
    if (!scroller || !root) {
        updateScrollViewportHeight();
        updateSectionStartOffset();
        return;
    }
    updateScrollViewportHeight();
    updateSectionStartOffset();
    nextTick(() => {
        recalculate();
        queueSidebarFollow(true);
    });
});

onUnmounted(() => {
    mobileTocObserver?.disconnect();
    scrollContainerResizeObserver?.disconnect();
    window.removeEventListener("resize", handleWindowResize);
    window.removeEventListener("keydown", handleGlobalKeydown);
});
</script>

<template>
    <div class="paper-root" :style="paperRootStyle">
        <div ref="scrollContainer" class="paper-scroll">
            <div class="teleport-overlay" />
            <!-- Mobile floating TOC bar -->
            <Transition name="slide-down">
                <MobileFloatingToc
                    v-if="!mobileTocVisible"
                    :sections="sections"
                    :active-root-id="activeRootId"
                    :current-section="currentSection"
                    :scroll-to="navigateTo"
                    :scroll-to-top="scrollToTop"
                    :render-title="renderTitle"
                    :scroll-container="scrollContainer"
                    :search="search"
                />
            </Transition>

            <div class="paper-layout mx-auto max-w-5xl px-2 pt-2 pb-0 sm:pt-2 sm:pb-0 sm:px-6">
                <div class="paper-grid">
                    <!-- Desktop sidebar TOC -->
                    <PaperSidebar
                        ref="sidebarRef"
                        :sections="sections"
                        :active-root-id="activeRootId"
                        :active-id="activeId"
                        :scroll-to="navigateTo"
                        :scroll-to-top="scrollToTop"
                        :render-title="renderTitle"
                        :tree-index="treeIndex"
                        :is-active="isActive"
                        :is-in-active-chain="isInActiveChain"
                        :get-preview="getPaperPreview"
                        :search="search"
                    />

                    <!-- Main article -->
                    <article class="paper-article leading-relaxed">
                        <header class="mb-10 lg:mb-20 text-center">
                            <h1
                                class="cm-serif text-4xl font-bold tracking-tight sm:text-5xl md:text-[3.25rem] leading-[1.15]"
                            >
                                An Introduction to<br /><span class="fourier-f">ℱ</span>ourier Analysis
                            </h1>
                        </header>

                        <!-- Mobile-only inline TOC -->
                        <nav ref="mobileNavRef" class="mb-14 cm-serif text-sm text-muted-foreground lg:hidden">
                            <ol class="list-none space-y-1.5 pl-0">
                                <li v-for="section in sections" :key="section.id">
                                    <Button
                                        variant="link"
                                        size="sm"
                                        class="mobile-toc-link"
                                        @click="navigateTo(section.id)"
                                    >
                                        <template v-if="section.number">
                                            <span>{{ section.number }}. </span>
                                        </template>
                                        <span v-html="renderTitle(section.title)" />
                                    </Button>
                                </li>
                            </ol>
                        </nav>

                        <PaperArticleWindow
                            :visible-items="visibleItems"
                            :top-spacer-px="topSpacerPx"
                            :bottom-spacer-px="bottomSpacerPx"
                            :register-root="registerWindowRoot"
                            :measure-section="measureSection"
                        />
                    </article>
                </div>
            </div>
        </div>

        <!-- Bottom overlay: page indicator (left) + back button (right) -->
        <div class="paper-bottom-overlay">
            <div class="overlay-page glass-subtle fira-code">
                pg {{ currentPage }}<span class="overlay-page-sep">/</span>{{ totalPages }}
            </div>

            <Transition name="fade-scale">
                <Button
                    v-if="navStack.length > 0"
                    variant="glass"
                    size="icon"
                    class="overlay-btn overlay-back"
                    @click="navigateBack"
                    :title="`Back (${navStack.length} in history)`"
                >
                    <Undo2 class="h-3.5 w-3.5" />
                    <span v-if="navStack.length > 1" class="overlay-badge">{{ navStack.length }}</span>
                </Button>
            </Transition>
        </div>
    </div>
</template>

<style scoped>
@reference "tailwindcss";
.paper-root {
    position: relative;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

/* Subtle top/bottom edge fade when content is clipped */
.paper-root::before,
.paper-root::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    height: 2rem;
    z-index: var(--z-content);
    pointer-events: none;
}

.paper-root::before {
    top: 0;
    background: linear-gradient(
        to bottom,
        color-mix(in srgb, var(--background) 55%, transparent),
        transparent 70%
    );
    mask-image: linear-gradient(to bottom, black, transparent);
    -webkit-mask-image: linear-gradient(to bottom, black, transparent);
}

.paper-root::after {
    bottom: 0;
    background: linear-gradient(
        to top,
        color-mix(in srgb, var(--background) 55%, transparent),
        transparent 70%
    );
    mask-image: linear-gradient(to top, black, transparent);
    -webkit-mask-image: linear-gradient(to top, black, transparent);
}

.paper-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior-y: contain;
    max-width: 100dvw;
}

.teleport-overlay {
    position: fixed;
    inset: 0;
    z-index: var(--z-overlay);
    background:
        radial-gradient(circle at center, color-mix(in srgb, var(--background) 92%, transparent), color-mix(in srgb, var(--background) 98%, transparent) 68%),
        var(--background);
    opacity: 0;
    pointer-events: none;
    /* A.W3.d — bezier→`--ease-out-expo`. */
    transition: opacity 180ms var(--ease-out-expo);
    will-change: opacity;
}

.paper-article {
    font-feature-settings: "liga", "kern";
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    hyphens: auto;
    min-width: 0;
    border-radius: 0.75rem;
    border: 2px solid color-mix(in srgb, var(--foreground) 15%, transparent);
    background: var(--card);
    box-shadow: 3px 3px 0px 0px color-mix(in srgb, var(--foreground) 8%, transparent);
    padding: 1.25rem 1rem;
    overflow-x: hidden;
    box-sizing: border-box;
}

@media (min-width: 640px) {
    .paper-article {
        padding: 2rem 2.5rem;
    }
}

/* A.W2.c — folded from `styles/ios-fixes.css` (deleted): iOS-Safari + small-
   viewport code-block overflow. Co-located with `.paper-article` so the
   element and its mobile fix share an owner. */
@media (max-width: 640px) {
    .paper-article :deep(pre),
    .paper-article :deep(code) {
        font-size: 0.75rem;
        line-height: 1.4;
    }
    .paper-article :deep(pre) {
        max-width: calc(100dvw - 2rem);
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }
}

.paper-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    min-width: 0;
}

@media (min-width: 1024px) {
    .paper-grid {
        grid-template-columns: 220px minmax(0, 48rem);
        gap: 2rem;
    }
}

/* ── Bottom overlay ────────────────────────────────────────── */
.paper-bottom-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: var(--z-controls);
    pointer-events: none;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 0.75rem 1rem;
    padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
}

.overlay-btn {
    pointer-events: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    border: 1.5px solid var(--border);
    background: color-mix(in srgb, var(--background) 92%, transparent);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: color-mix(in srgb, var(--foreground) 70%, transparent);
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    /* A.W3.d — named properties + canonical token, no `transition: all`. */
    transition:
        color 0.2s var(--ease-out-expo),
        border-color 0.2s var(--ease-out-expo),
        background-color 0.2s var(--ease-out-expo),
        box-shadow 0.2s var(--ease-out-expo),
        transform 0.2s var(--ease-out-expo);
}

.overlay-btn:hover {
    color: var(--foreground);
    border-color: color-mix(in srgb, var(--foreground) 25%, transparent);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    transform: scale(1.05);
}

.overlay-btn:active {
    transform: scale(0.95);
}

.overlay-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 16px;
    height: 16px;
    border-radius: 8px;
    background: var(--primary);
    color: var(--primary-foreground);
    @apply text-sm;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 3px;
    line-height: 1;
}

.overlay-page {
    pointer-events: auto;
    @apply text-sm;
    color: color-mix(in srgb, var(--muted-foreground) 70%, transparent);
    border-radius: 0.375rem;
    padding: 0.25rem 0.5rem;
    letter-spacing: 0.02em;
    user-select: none;
}

.overlay-page-sep {
    opacity: 0.4;
    margin: 0 1px;
}

/* ── Transition: slide-down ──────────────────────────────── */
/* A.W3.d — bezier→`--ease-out-expo`. */
.slide-down-enter-active,
.slide-down-leave-active {
    transition: transform 0.25s var(--ease-out-expo),
                opacity 0.25s var(--ease-out-expo);
}

.slide-down-enter-from {
    transform: translateY(-100%);
    opacity: 0;
}

.slide-down-leave-to {
    transform: translateY(-100%);
    opacity: 0;
}

/* ── Transition: fade-scale (back button) ─────────────────── */
/* A.W3.d — bezier→`--ease-out-expo`. */
.fade-scale-enter-active,
.fade-scale-leave-active {
    transition: opacity 0.2s var(--ease-standard), transform 0.2s var(--ease-out-expo);
}

.fade-scale-enter-from {
    opacity: 0;
    transform: scale(0.8);
}

.fade-scale-leave-to {
    opacity: 0;
    transform: scale(0.8);
}
</style>
