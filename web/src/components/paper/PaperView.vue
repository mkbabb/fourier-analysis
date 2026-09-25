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
import { useMediaQuery } from "@vueuse/core";
import PaperToc from "./PaperToc.vue";
import PaperArticleWindow from "./PaperArticleWindow.vue";
import PaperSearchModal from "./search/PaperSearchModal.vue";
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
import { Card } from "@mkbabb/glass-ui/card";
import { ScrollProgressRim } from "@mkbabb/glass-ui/scroll-progress-rim";
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
/** The lg breakpoint the sidebar and the floating ToC split on (UIA-F-22). */
const isDesktop = useMediaQuery("(min-width: 1024px)");

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

/**
 * X·F F.W3 `.c` — `★NAV-1`: the map from a NON-section destination back to the
 * flat section that holds it.
 *
 * `labelMap` already knows this — every entry carries `sectionId` beside its
 * `anchorId`/`elementId` — and the app threw it away at exactly the moment it
 * was needed: `useClickDelegate`'s `resolve` above returns
 * `anchorId ?? elementId ?? sectionId`, i.e. it hands the navigator the precise
 * target and drops the only thing that could mount it. The virtual window is
 * keyed on sections, so without the owner an element id reached a `getOffsetFor`
 * that returned null and an `ensureTargetWindow` that returned immediately —
 * the silent no-op the row measured at 71/164 `\ref`-family uses and 66/374
 * search entries.
 *
 * Built once, over every spelling a destination can arrive as: the label key
 * itself (search entries take `thm.label`/`fig.label` as their id), the anchor
 * and the element id. Section destinations never reach here — they resolve in
 * the layout, which is path (1) of `performScroll`.
 */
const ownerSectionByTargetId = (() => {
    const map = new Map<string, string>();
    for (const [key, info] of Object.entries(labelMap)) {
        if (!info?.sectionId) continue;
        for (const spelling of [key, info.anchorId, info.elementId]) {
            if (spelling && !map.has(spelling)) map.set(spelling, info.sectionId);
        }
    }
    return map;
})();

const { navigateTo, navigateBack, scrollToTop, performScroll, navStack } = useScrollNavigation({
    scrollContainer,
    contentStartOffsetPx: sectionStartOffsetPx,
    activeId,
    ensureTargetWindow,
    getOffsetFor,
    recalculate,
    resolveOwningSection: (id) => ownerSectionByTargetId.get(id) ?? null,
});

// Wire all navigation (TOC clicks, cross-references) through navigateTo
_scrollTo = navigateTo;

const search = usePaperSearch({ sections: paperSections, labelMap, navigateTo });

/**
 * `L/D27` — ⌘K, as four separate defects.
 *
 * It tested `e.key === "k"`, so Shift or a caps-lock user missed it entirely;
 * it opened only the inline dropdown (`isOpen`), which below 1024px lives in
 * the `display:none` sidebar instance where a `focus()` on a boxless input is a
 * no-op — undiscoverable everywhere; it had no dismiss path of its own; and it
 * fired while the user was typing into any other field on the page.
 *
 * `PSM-42`: the footer advertises ↑↓/⏎/esc and omitted the key that got the
 * user there — it does not any more, because the key now lands on the palette
 * whose footer that is.
 */
function isTypingTarget(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    if (!el) return false;
    const tag = el.tagName;
    return (
        tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable
    );
}

function handleGlobalKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.code === "KeyK") {
        // UIA-F-159: ⌘K from the paper's own search field opens the palette
        // with the field's query (the retired Expand control's one job). Any
        // other typing target keeps its keys.
        const fromSearch = (e.target as Element | null)?.closest?.(".paper-search") != null;
        if (isTypingTarget(e.target) && !search.isExpanded.value && !fromSearch) return;
        e.preventDefault();
        search.openPalette();
    }
    // X.F.W14U.paper — the palette's Escape is the dialog's (UIA-F-25: one
    // dismissal owner; Esc collapses and KEEPS the query). A window-level
    // Escape that called `close()` here cleared the query whenever it ran
    // before the palette's own layer (glass `Command`'s, UIA-F-64).
}

const currentPage = ref(pageMap[flatSections[0]?.id] ?? 1);
const paperRootStyle = computed(() =>
    scrollViewportHeightPx.value > 0
        ? { "--paper-scroll-viewport-height": `${scrollViewportHeightPx.value}px` }
        : {},
);
let scrollContainerResizeObserver: ResizeObserver | null = null;

// X.F.W14.u — UIA-F-20: the section to restore is read HERE, synchronously in
// setup, before the persisting watcher below runs. That watcher is `immediate`
// and the first section is active at mount, so it removed the saved key ~40 ms
// before `onMounted`'s restore read it back — the restore always read `null`
// and the paper reopened at the top. The watcher keeps persisting as the
// reader scrolls; the restore consumes the value it had at entry.
let restoreSectionId: string | null = null;
try {
    restoreSectionId = sessionStorage.getItem(SCROLL_POS_KEY);
} catch {}

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


// ── Reading progress (glass ScrollProgressRim) ───────────────
// X.F.W14U.paper — UIA-F-157: the hand-rolled 2px hairline (a local
// `.paper-progress-track` running full-bleed under the dock, on the
// `.scroll-progress` recipe plus a JS floor) is glass `ScrollProgressRim`.
// The rim takes its aggregate as a value, so this is the one writer: one rAF
// coalesces a scroll burst into one write of the position the reader
// produced. It owns no clock and no easing of its own (the rim's fill
// transition is the producer's, and its PRM arm zeroes it) — `G-F4-PRM-CLOCK`
// holds: under reduced motion the rim still reads the true position.
const readingProgress = ref(0);
let progressRaf = 0;
function writeProgress() {
    progressRaf = 0;
    const s = scrollContainer.value;
    if (!s) return;
    const max = s.scrollHeight - s.clientHeight;
    readingProgress.value = max > 0 ? Math.min(1, Math.max(0, s.scrollTop / max)) : 0;
}
function onProgressScroll() {
    if (progressRaf) return;
    progressRaf = requestAnimationFrame(writeProgress);
}
function armProgress() {
    const s = scrollContainer.value;
    if (!s) return;
    s.addEventListener("scroll", onProgressScroll, { passive: true });
    writeProgress();
}
function disarmProgress() {
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
    nextTick(() => {
        updateScrollViewportHeight();
        updateSectionStartOffset();
        recalculate();
        queueSidebarFollow(true);
        armProgress();

        // Restore scroll position from session (skip first section — that's the top)
        const saved = restoreSectionId;
        if (saved && saved !== flatSections[0]?.id && flatSections.some((s) => s.id === saved)) {
            performScroll(saved);
        }
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
    scrollContainerResizeObserver?.disconnect();
    disarmProgress();
    window.removeEventListener("resize", handleWindowResize);
    window.removeEventListener("keydown", handleGlobalKeydown);
});
</script>

<template>
    <div class="paper-root" :style="paperRootStyle">
        <ScrollProgressRim :value="readingProgress" class="paper-progress-rim" />
        <div ref="scrollContainer" class="paper-scroll">
            <div class="teleport-overlay" />
            <!-- Mobile floating TOC bar -->
            <!-- UIA-F-162: content first. The floating bar is the phone's one
                 ToC from the top of the paper (the inline chapter list it used
                 to wait behind pushed the text off the first screen). -->
            <Transition name="slide-down">
                <PaperToc
                    v-if="!isDesktop"
                    presentation="floating"
                    :current-section="currentSection"
                    :render-title="renderTitle"
                    :search="search"
                />
            </Transition>

            <!-- `PSM-3`: ONE modal, owned by the ancestor both ToC hosts share.
                 It used to be rendered inside `PaperSearch`, which mounts twice
                 below 1024px — two overlays, two inputs racing focus, and one
                 shared `isExpanded` driving both. -->
            <PaperSearchModal :search="search" />

            <div class="paper-layout mx-auto max-w-6xl px-2 pt-2 pb-0 sm:pt-2 sm:pb-0 sm:px-6">
                <div class="paper-columns">
                    <!-- Desktop sidebar TOC. X.F.W14.u — UIA-F-22: ONE PaperSearch
                         per breakpoint. The sidebar was only CSS-hidden below lg,
                         so on mobile two PaperSearch instances shared one state:
                         two listboxes with the same 30 option ids
                         (`aria-activedescendant` resolved to the hidden list), and
                         the hidden instance's capture-phase outside-pointerdown
                         closed the search before a tapped result could navigate.
                         Each host now mounts only at its own breakpoint. -->
                    <PaperToc v-if="isDesktop" presentation="rail" :render-title="renderTitle" :search="search" />

                    <!-- Main article -->
                    <!-- UIA-F-61: the reading surface is glass Card (opaque: the ToC
                         drawer slides UNDER it, X.F.W14U.t), not a hand-rolled
                         cartoon card casting against the rail's shadow. -->
                    <Card as="article" surface="opaque" shadow class="paper-article leading-relaxed">
                        <header class="mb-10 lg:mb-20 text-center">
                            <h1
                                class="font-serif-math text-display-2 font-bold tracking-tight leading-display"
                            >
                                An Introduction to<br /><span class="fourier-f">ℱ</span>ourier Analysis
                            </h1>
                        </header>


                        <PaperArticleWindow
                            :visible-items="visibleItems"
                            :top-spacer-px="topSpacerPx"
                            :bottom-spacer-px="bottomSpacerPx"
                            :register-root="registerWindowRoot"
                            :measure-section="measureSection"
                        />
                    </Card>
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
            <div class="overlay-page glass-quiet fira-code" role="status" aria-live="polite">
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
    /* UIA-F-61: radius, border, fill and cast are glass Card's (`--radius-card`,
       the opaque plate, the one light source). The padding is the page's. */
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

.paper-columns {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    min-width: 0;
}

/* X.F.W14U.t — OA-60: the ToC track is `auto`, sized by the one ToC's own
   drawer width (`PaperToc.vue`, which carries the gutter as its tab rail), so
   hiding the ToC collapses the column and the paper slides over it. `center`
   keeps the paper centred in the room the collapsed column gives back; `start`
   would leave it flush left, and the default would stretch the auto track. */
@media (min-width: 1024px) {
    .paper-columns {
        grid-template-columns: auto minmax(0, 48rem);
        column-gap: 0;
        justify-content: center;
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

/* X.F.W13.a — OA-14 (owner frame 2: "this is not a circle"). The history
   control measured 32×40 with `border-radius: 9999px` on the served page — a
   stadium, not a circle. Cause at the bytes: this block pinned `width/height:
   2rem` UNLAYERED while the glass Button's layered `min-block-size:
   var(--button-size)` (40px at `md`) still won the block axis, so only the
   inline axis shrank. It also restated the producer's border, fill, blur,
   shadow, hover lift and press scale per instance (and then had to re-add a
   focus outline its own shadow had erased, `★MF-1`). All of it retires: the
   glass `Button icon-only` is a `--button-size` square with half-size
   corners — a true circle — and owns its ink, press and focus ring. What
   remains is layout only: the overlay row is `pointer-events: none`, and the
   count badge is positioned against the button. */
.overlay-btn {
    pointer-events: auto;
    position: relative;
}

.overlay-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 16px;
    height: 16px;
    border-radius: var(--radius-badge);
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
    /* UIA-F-234: on glass-quiet, at the control radius (the Back button's
       pill beside it) through the quiet tier's own contextual radius. */
    --radius-ctx: var(--radius-control);
    padding: 0.25rem 0.75rem;
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
