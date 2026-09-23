<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted, useId, useTemplateRef } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { ChevronDown, ChevronRight, ChevronUp, Search, X } from "@lucide/vue";
import PaperSearch from "./PaperSearch.vue";
import { injectPaperToc, sectionColorVar } from "./paperToc";
import type { PaperSectionData } from "@/lib/paperContent";
import type { PaperSearchState } from "./search/usePaperSearch";

const props = defineProps<{
    currentSection: PaperSectionData | null;
    renderTitle: (title: string) => string;
    scrollContainer: HTMLElement | null;
    search: PaperSearchState;
}>();

// ── The ONE ToC model, injected (COHESION §0o ESC-2 / §3 D9) ───────────────
// This host built the THIRD parallel derivation of the paper tree — its own
// `useSidebarState` over the same sections, with `activeRootId` passed twice
// because it had no use for the leaf id. It now reads the view's model, so
// "expanded here" and "expanded there" are the same fact.
const { sections, activeRootId, isExpanded, toggleSection, navigateTo, scrollToTop } =
    injectPaperToc();

const dropdownId = `floating-toc-${useId()}`;
const floatingTocOpen = ref(false);
const searchActive = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const mobileSearchRef = ref<InstanceType<typeof PaperSearch> | null>(null);
// Trigger element — focus returns here after the dropdown is dismissed
// (A4 MED a11y discharge). glass-ui `Button` forwards its root element ref;
// fall back to querying the focusable child if the instance exposes `$el`.
const tocTriggerRef = useTemplateRef<HTMLElement | { $el?: HTMLElement }>("tocTrigger");

function triggerEl(): HTMLElement | null {
    const r = tocTriggerRef.value as HTMLElement | { $el?: HTMLElement } | null;
    if (!r) return null;
    return r instanceof HTMLElement ? r : (r.$el ?? null);
}

// Dismiss the dropdown and return focus to the trigger button (A4 MED).
function dismissDropdown() {
    floatingTocOpen.value = false;
    nextTick(() => triggerEl()?.focus());
}

// Lock scroll container when dropdown is open (critical for iOS WebKit).
// Also move focus into the dropdown on open so the `@keydown.esc` handler
// receives the key event (A4 MED a11y discharge).
watch(floatingTocOpen, (open) => {
    if (props.scrollContainer) {
        props.scrollContainer.style.overflow = open ? 'hidden' : '';
    }
    if (open) {
        nextTick(() => dropdownRef.value?.focus());
    }
});

// Cleanup: restore scroll if component unmounts while open
onUnmounted(() => {
    if (props.scrollContainer) {
        props.scrollContainer.style.overflow = '';
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

// Close search when a result is selected (navigateTo triggers)
watch(() => props.search.isOpen.value, (open) => {
    if (!open && searchActive.value) {
        searchActive.value = false;
    }
});
</script>

<template>
    <div class="floating-toc lg:hidden">
        <div class="floating-toc-anchor">
            <!-- Search mode: input replaces section title -->
            <div v-if="searchActive" class="floating-toc-bar floating-toc-bar--search glass-resting">
                <PaperSearch ref="mobileSearchRef" :search="search" variant="floating" />
                <Button emphasis="quiet" size="md" icon-only type="button" class="floating-toc-search-close" @click="closeMobileSearch" aria-label="Close search">
                    <X class="h-4 w-4" />
                </Button>
            </div>
            <!-- Normal mode: section title + search icon.
                 `D/B-4`: the search control was a click-only `<span>` NESTED
                 INSIDE this button — no keyboard path, no role, no name, and
                 Enter on the focused parent toggled the ToC instead. It is a
                 real sibling `<Button>` now, outside the trigger.
                 `D/M-13`: the trigger announces its disclosure state and the
                 panel it controls. -->
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
                    <!-- Scroll to top -->
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
                        <Button
                            emphasis="quiet"
                            class="floating-toc-item floating-toc-root font-serif-math"
                            :aria-current="activeRootId === section.id ? 'location' : undefined"
                            :style="activeRootId === section.id ? { color: sectionColorVar(si) } : {}"
                            @click="toggleSection(section.id)"
                        >
                            <component
                                :is="isExpanded(section.id) ? ChevronDown : ChevronRight"
                                v-if="section.subsections?.length"
                                class="floating-toc-collapse-icon"
                            />
                            <span class="fira-code text-xs opacity-50">{{ section.number }}.</span>
                            {{ section.title }}
                        </Button>
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
