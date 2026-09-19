<script setup lang="ts">
import {
    useKatex,
    PAPER_CONTEXT,
    type PaperContext,
    flattenPaperSections,
    useClickDelegate,
    useSidebarFollow,
    useVirtualSectionWindow,
} from "@mkbabb/latex-paper/vue";
import "@mkbabb/latex-paper/theme";
import { useSidebarState } from "@mkbabb/glass-ui/sidebar";
import PaperSidebar from "./PaperSidebar.vue";
import MobileFloatingToc from "./MobileFloatingToc.vue";
import PaperArticleWindow from "./PaperArticleWindow.vue";
import PaperSearchModal from "./search/PaperSearchModal.vue";
import { createPreviewLookup } from "./paperTree";
import { PAPER_TOC_KEY, assertSectionRampFits, type PaperTocModel } from "./paperToc";
import { useScrollNavigation } from "./useScrollNavigation";
import { usePaperSearch } from "./search/usePaperSearch";
// One specifier, one import — the type used to arrive on a second `import type`
// line from the same module (`no-duplicate-imports`, TS6133 when it fell dead).
import {
    paperSections,
    labelMap,
    totalPages,
    pageMap,
    extractedMacros,
    type PaperSectionData,
} from "@/lib/paperContent";
import { ref, computed, provide, onMounted, onUnmounted, nextTick, watch } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { Undo2 } from "@lucide/vue";

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
const sidebarNavEl = ref<HTMLElement | null>(null);
const baseUrl = import.meta.env.BASE_URL;
const flatSections = flattenPaperSections(paperSections);

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

// ── I.δ — reading-progress bar (native-first, JS floor) ──────
// The native `.scroll-progress` recipe owns the bar on a `scroll()`-timeline
// engine (compositor). This listener is the SOLE writer ONLY when that recipe
// is absent — the dual-path-single-writer discipline (no double-run): if the
// engine supports `scroll()` timelines (or the user requests reduced motion,
// where the native recipe is inert and a JS bar would defeat PRM), it never
// attaches.
const progressBar = ref<HTMLElement | null>(null);
const NATIVE_SCROLL_TIMELINE =
    typeof CSS !== "undefined" && CSS.supports("animation-timeline", "scroll()");
let progressRaf = 0;
function writeProgress() {
    progressRaf = 0;
    const s = scrollContainer.value;
    const bar = progressBar.value;
    if (!s || !bar) return;
    const max = s.scrollHeight - s.clientHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, s.scrollTop / max)) : 0;
    bar.style.transform = `scaleX(${p})`;
}
function onProgressScroll() {
    if (progressRaf) return;
    progressRaf = requestAnimationFrame(writeProgress);
}
function armProgressFallback() {
    const prm =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (NATIVE_SCROLL_TIMELINE || prm) return;
    const s = scrollContainer.value;
    if (!s) return;
    s.addEventListener("scroll", onProgressScroll, { passive: true });
    writeProgress();
}
function disarmProgressFallback() {
    scrollContainer.value?.removeEventListener("scroll", onProgressScroll);
    if (progressRaf) cancelAnimationFrame(progressRaf);
    progressRaf = 0;
}

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

// ── The ONE ToC model (COHESION §0o ESC-2, executing §3 D9) ────────────────
// Ruled: one model, owned by the paper view — the highest common ancestor of
// sidebar and body — and provided through a TYPED `InjectionKey`. Before this,
// the same 98-node tree was derived three times across two producers
// (`useTreeIndex` here + `useSidebarState` in each of the two ToC hosts), and
// the winner was decided by nothing. `useSidebarState` wins on measurement: it
// already returns the index, the active/in-chain predicates AND the expansion
// state, which is the whole model; the losing index and the `paperTree.ts`
// adapter that fed it are deleted.
const sidebarState = useSidebarState<PaperSectionData>({
    sections: paperSections,
    activeId: () => activeId.value,
    activeRootId: () => activeRootId.value,
    scrollTo: (id) => navigateTo(id),
    scrollToTop: () => scrollToTop(),
    getChildren: (n) => n.subsections,
});

const tocModel: PaperTocModel = {
    ...sidebarState,
    // `M6` retired: the view reads the ToC element through the model it
    // provides, never through a child's untyped `defineExpose`.
    registerNavEl: (el) => {
        sidebarNavEl.value = el;
    },
    getPreview: createPreviewLookup(),
};

provide(PAPER_TOC_KEY, tocModel);

// `★MF-10`: the ramp is exactly saturated at this paper's 13 roots.
assertSectionRampFits(paperSections.length);

const { queueSidebarFollow } = useSidebarFollow({
    sidebarEl: sidebarNavEl,
    activeId,
    activeRootId,
    scrollSource: scrollContainer,
});

// `L/D11` — the index round-trip was provably an identity (`entry.node.id`
// found in the very array the entry's node came from); the entry carries the
// node itself.
const currentSection = computed(() =>
    activeRootId.value
        ? (sidebarState.treeIndex.get(activeRootId.value)?.node ?? null)
        : null,
);

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
        armProgressFallback();

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
    disarmProgressFallback();
    window.removeEventListener("resize", handleWindowResize);
    window.removeEventListener("keydown", handleGlobalKeydown);
});
</script>

<template>
    <div class="paper-root" :style="paperRootStyle">
        <div ref="scrollContainer" class="paper-scroll">
            <!-- I.δ — reading-progress bar. Native path: glass-ui's
                 `.scroll-progress` recipe (scroll-driven.css) drives the 0..1
                 `scaleX` on the COMPOSITOR off a `scroll()` timeline
                 (`--scroll-progress-scroller: nearest` → the enclosing
                 `.paper-scroll`, so the bar lives INSIDE the scroller it tracks).
                 Fallback path: when the engine lacks `scroll()` timelines, a tiny
                 feature-detected listener is the SOLE writer of the bar's
                 `scaleX` (inv-29 floor). PRM zeroes the native animation (its
                 `@supports` block sits under `prefers-reduced-motion`); the
                 fallback listener is not armed under PRM either. -->
            <div class="paper-progress-track">
                <div ref="progressBar" class="paper-progress-bar scroll-progress" />
            </div>
            <div class="teleport-overlay" />
            <!-- Mobile floating TOC bar -->
            <Transition name="slide-down">
                <MobileFloatingToc
                    v-if="!mobileTocVisible"
                    :current-section="currentSection"
                    :render-title="renderTitle"
                    :scroll-container="scrollContainer"
                    :search="search"
                />
            </Transition>

            <!-- `PSM-3`: ONE modal, owned by the ancestor both ToC hosts share.
                 It used to be rendered inside `PaperSearch`, which mounts twice
                 below 1024px — two overlays, two inputs racing focus, and one
                 shared `isExpanded` driving both. -->
            <PaperSearchModal :search="search" />

            <div class="paper-layout mx-auto max-w-5xl px-2 pt-2 pb-0 sm:pt-2 sm:pb-0 sm:px-6">
                <div class="paper-grid">
                    <!-- Desktop sidebar TOC -->
                    <PaperSidebar :render-title="renderTitle" :search="search" />

                    <!-- Main article -->
                    <article class="paper-article leading-relaxed">
                        <header class="mb-10 lg:mb-20 text-center">
                            <h1
                                class="cm-serif text-4xl font-bold tracking-tight sm:text-5xl md:text-[3.25rem] leading-[1.15]"
                            >
                                An Introduction to<br /><span class="fourier-f">ℱ</span>ourier Analysis
                            </h1>
                        </header>

                        <!-- Mobile-only inline TOC. `D/m-6`: the landmark had no
                             name, so a reader listing landmarks found two
                             unlabelled navs on one page. `L/D15`: this third ToC
                             is also the IntersectionObserver sentinel for the
                             floating bar — stated, because nothing else said so. -->
                        <nav
                            ref="mobileNavRef"
                            aria-label="Chapters"
                            class="mb-14 cm-serif text-sm text-muted-foreground lg:hidden"
                        >
                            <ol class="list-none space-y-1.5 pl-0">
                                <li v-for="section in paperSections" :key="section.id">
                                    <Button
                                        emphasis="text"
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
            <!-- `D/M-8` + `★MF-8`: the product's only reading-location
                 affordance was excluded three independent ways — 2.88:1 ink, no
                 announcement, and `user-select: none` so it could not even be
                 copied. `role="status"` announces the page politely as it
                 changes; the ink is the strong rung; the text is selectable. -->
            <div class="overlay-page glass-wash fira-code" role="status" aria-live="polite">
                pg {{ currentPage }}<span class="overlay-page-sep">/</span>{{ totalPages }}
            </div>

            <Transition name="fade-scale">
                <!-- `D/M-6`: name-from-content outranks `title`, so once the
                     badge rendered the sole history control announced itself as
                     a NUMBER — "2" — and below two as "Back (1 in history)".
                     The name is fixed and the count is decoration. -->
                <Button
                    v-if="navStack.length > 0"
                    emphasis="primary"
                    size="md" icon-only
                    type="button"
                    class="overlay-btn overlay-back"
                    aria-label="Back"
                    @click="navigateBack"
                >
                    <Undo2 class="h-3.5 w-3.5" />
                    <span v-if="navStack.length > 1" class="overlay-badge" aria-hidden="true">{{ navStack.length }}</span>
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
    /* `D/m-13`: the gradient's own stop already fades to transparent at 70%;
       the mask ramped the same 2rem a second time, so the fade was applied
       twice and read as nothing. One attenuation, the gradient's. */
}

.paper-root::after {
    bottom: 0;
    background: linear-gradient(
        to top,
        color-mix(in srgb, var(--background) 55%, transparent),
        transparent 70%
    );

}

.paper-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior-y: contain;
    max-width: 100dvw;
}

/* ── I.δ — reading-progress bar ───────────────────────────────
   The track is sticky at the top of the `.paper-scroll` viewport; the bar
   inside it scales 0→1 across the full read. The native path is glass-ui's
   `.scroll-progress` (composited `scroll()` timeline); `--scroll-progress-
   scroller: nearest` binds it to the enclosing `.paper-scroll` rather than the
   document root. The JS floor writes the same `scaleX` only when `scroll()`
   timelines are absent (and not under PRM). */
.paper-progress-track {
    position: sticky;
    top: 0;
    z-index: var(--z-overlay);
    height: 2px;
    width: 100%;
    pointer-events: none;
    /* Pull the 2px track out of the flow so it does not nudge content down. */
    margin-bottom: -2px;
}

.paper-progress-bar {
    height: 100%;
    width: 100%;
    transform-origin: 0 50%;
    /* Initial/fallback resting state — overwritten by the native recipe's
       `scaleX` keyframe or the JS floor's inline `transform`. */
    transform: scaleX(0);
    background: linear-gradient(
        to right,
        color-mix(in srgb, var(--primary) 70%, transparent),
        var(--primary)
    );
    border-radius: 0 1px 1px 0;
    /* Bind the native `scroll()` timeline to the paper scroller (not root). */
    --scroll-progress-scroller: nearest;
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
}

/* `★MF-7`: `will-change: opacity` stood permanently on a fixed full-viewport
   element for chrome that only appears during a far jump — a compositor layer
   the size of the window, held for the whole session. It is declared only while
   the overlay is actually being shown. */
.teleport-overlay[style*="opacity: 1"] {
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
    box-shadow: var(--shadow-cartoon);
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
    /* `D/M-15`: hand-typed shadows, and the cure table's correction is carried
       — `--shadow-md`, never `--shadow-soft`. */
    box-shadow: var(--shadow-md);
    /* A.W3.d — named properties + canonical token, no `transition: all`. */
    transition:
        color 0.2s var(--ease-out-expo),
        border-color 0.2s var(--ease-out-expo),
        background-color 0.2s var(--ease-out-expo),
        box-shadow 0.2s var(--ease-out-expo),
        transform 0.2s var(--ease-out-expo);
}

/* `★MF-1`: this block is UNLAYERED and the producer's focus ring is a
   `box-shadow` in `@layer components`, so the resting shadow above overwrote
   the ring while the layered `outline: none` survived — no visible focus
   indicator at all on the sole history control (WCAG 2.4.7 AA), and the app's
   own outline allowlist does not name `.overlay-btn`. The ring is restored as
   an OUTLINE, which no `box-shadow` can contest, with the producer's own
   registers. */
.overlay-btn:focus-visible {
    outline: var(--focus-ring-width) solid var(--focus-ring-color);
    outline-offset: 2px;
}

.overlay-btn:hover {
    color: var(--foreground);
    border-color: color-mix(in srgb, var(--foreground) 25%, transparent);
    box-shadow: var(--shadow-lg);
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
    /* `D/M-8`: 2.88:1 at the authored 70% dilution, reproduced to three
       decimals by both readers. `--muted-foreground-strong` — which the record
       notes exists and is unused — measures 7.882:1 light / 10.295:1 dark, and
       it is also the register declared for ink over a glass plate
       (`--on-glass-muted-strong`), which is what `.glass-wash` makes this. */
    color: var(--muted-foreground-strong);
    border-radius: 0.375rem;
    padding: 0.25rem 0.5rem;
    letter-spacing: 0.02em;
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

/* `D/M-5`: `translateY(-100%)` resolved against `.floating-toc`'s own
   `height: 0` root — zero distance, so only the co-declared opacity ever
   showed. A real length is the whole cure. */
.slide-down-enter-from,
.slide-down-leave-to {
    transform: translateY(-2.75rem);
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
