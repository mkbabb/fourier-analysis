<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted, useTemplateRef } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { useSidebarState } from "@mkbabb/glass-ui/sidebar";
import { ChevronDown, ChevronRight, ChevronUp, Search, X } from "lucide-vue-next";
import PaperSearch from "./PaperSearch.vue";
import type { PaperSectionData } from "@/lib/paperContent";
import type { PaperSearchState } from "./search/usePaperSearch";

const props = defineProps<{
    sections: PaperSectionData[];
    activeRootId: string | null;
    currentSection: PaperSectionData | null;
    scrollTo: (id: string) => void;
    scrollToTop: () => void;
    renderTitle: (title: string) => string;
    scrollContainer: HTMLElement | null;
    search: PaperSearchState;
}>();

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

// ── Section expand/collapse — delegated to glass-ui's `useSidebarState`
//    (W3.5.c). Discharges the user-expanded/user-collapsed reactive Sets
//    that previously lived locally; symmetric with the desktop sidebar.
//    `activeId` is unused on mobile (no nested highlighting) — pass
//    `activeRootId` as a stand-in so the composable's default-expansion
//    rule still pivots on the user's current section.
const sidebarState = useSidebarState<PaperSectionData>({
    sections: props.sections,
    activeId: () => props.activeRootId,
    activeRootId: () => props.activeRootId,
    scrollTo: (id) => props.scrollTo(id),
    scrollToTop: () => props.scrollToTop(),
    getChildren: (n) => n.subsections,
});

function selectSection(id: string) {
    floatingTocOpen.value = false;
    props.scrollTo(id);
}

function handleScrollToTop() {
    floatingTocOpen.value = false;
    props.scrollToTop();
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
            <div v-if="searchActive" class="floating-toc-bar floating-toc-bar--search glass-medium">
                <PaperSearch ref="mobileSearchRef" :search="search" variant="floating" />
                <Button variant="ghost" size="icon" class="floating-toc-search-close" @click="closeMobileSearch" title="Close search">
                    <X class="h-4 w-4" />
                </Button>
            </div>
            <!-- Normal mode: section title + search icon -->
            <Button v-else ref="tocTrigger" variant="ghost" class="floating-toc-bar glass-medium" @click="floatingTocOpen = !floatingTocOpen">
                <span class="floating-toc-section cm-serif">
                    <span class="fira-code text-xs opacity-50">{{ currentSection?.number }}.</span>
                    {{ currentSection?.title }}
                </span>
                <span class="floating-toc-actions">
                    <span class="floating-toc-search-btn" @click.stop="openMobileSearch" title="Search paper">
                        <Search class="h-3.5 w-3.5" />
                    </span>
                    <ChevronDown class="floating-toc-chevron" :class="{ 'rotate-180': floatingTocOpen }" />
                </span>
            </Button>
            <Transition name="toc-expand">
                <div
                    v-if="floatingTocOpen"
                    ref="dropdownRef"
                    class="floating-toc-dropdown glass-medium"
                    tabindex="-1"
                    @keydown.esc="dismissDropdown"
                >
                    <!-- Scroll to top -->
                    <Button
                        variant="ghost"
                        class="floating-toc-item floating-toc-top cm-serif"
                        @click="handleScrollToTop"
                    >
                        <ChevronUp class="floating-toc-top-icon" />
                        Scroll to top
                    </Button>

                    <div class="floating-toc-divider" />

                    <template v-for="(section, si) in sections" :key="section.id">
                        <Button
                            variant="ghost"
                            class="floating-toc-item floating-toc-root cm-serif"
                            :class="{ 'is-active': activeRootId === section.id }"
                            :style="activeRootId === section.id ? { color: `var(--section-color-${si})` } : {}"
                            @click="sidebarState.toggleSection(section.id)"
                        >
                            <component
                                :is="sidebarState.isExpanded(section.id) ? ChevronDown : ChevronRight"
                                v-if="section.subsections?.length"
                                class="floating-toc-collapse-icon"
                            />
                            <span class="fira-code text-xs opacity-50">{{ section.number }}.</span>
                            {{ section.title }}
                        </Button>
                        <template v-if="sidebarState.isExpanded(section.id)">
                            <Button
                                v-for="sub in section.subsections"
                                :key="sub.id"
                                variant="ghost"
                                class="floating-toc-item floating-toc-sub cm-serif"
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

.floating-toc-actions {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    flex-shrink: 0;
}

.floating-toc-search-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    border-radius: 0.25rem;
    color: color-mix(in srgb, var(--muted-foreground) 50%, transparent);
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
    color: color-mix(in srgb, var(--muted-foreground) 60%, transparent);
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
    transition: transform 0.2s ease;
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
    color: color-mix(in srgb, var(--muted-foreground) 70%, transparent);
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
    border-radius: 0.375rem;
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
    color: color-mix(in srgb, var(--muted-foreground) 70%, transparent);
}

.floating-toc-item:hover,
.floating-toc-item.is-active {
    background: color-mix(in srgb, var(--muted) 50%, transparent);
    color: var(--foreground);
}

.floating-toc-item.is-active {
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
