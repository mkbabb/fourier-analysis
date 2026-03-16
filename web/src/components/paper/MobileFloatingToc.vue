<script setup lang="ts">
import { ref, reactive, watch, nextTick, onUnmounted } from "vue";
import { ChevronDown, ChevronRight, ChevronUp, Search, X } from "lucide-vue-next";
import PaperSearch from "./PaperSearch.vue";
import type { PaperSectionData } from "@/lib/paperContent";
import type { PaperSearchState } from "./usePaperSearch";

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

// Lock scroll container when dropdown is open (critical for iOS WebKit)
watch(floatingTocOpen, (open) => {
    if (props.scrollContainer) {
        props.scrollContainer.style.overflow = open ? 'hidden' : '';
    }
});

// Cleanup: restore scroll if component unmounts while open
onUnmounted(() => {
    if (props.scrollContainer) {
        props.scrollContainer.style.overflow = '';
    }
});

// Tracks user overrides for section expand/collapse state
const userExpanded = reactive(new Set<string>());
const userCollapsed = reactive(new Set<string>());

function isSectionExpanded(sectionId: string): boolean {
    if (userCollapsed.has(sectionId)) return false;
    if (userExpanded.has(sectionId)) return true;
    return props.activeRootId === sectionId;
}

function selectRootSection(sectionId: string) {
    if (isSectionExpanded(sectionId)) {
        // Currently expanded → collapse, stay in dropdown
        userExpanded.delete(sectionId);
        userCollapsed.add(sectionId);
    } else {
        // Currently collapsed → expand, stay in dropdown
        userCollapsed.delete(sectionId);
        userExpanded.add(sectionId);
    }
}

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
            <div v-if="searchActive" class="floating-toc-bar floating-toc-bar--search">
                <PaperSearch ref="mobileSearchRef" :search="search" variant="floating" />
                <button class="floating-toc-search-close" @click="closeMobileSearch" title="Close search">
                    <X class="h-4 w-4" />
                </button>
            </div>
            <!-- Normal mode: section title + search icon -->
            <button v-else class="floating-toc-bar" @click="floatingTocOpen = !floatingTocOpen">
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
            </button>
            <Transition name="toc-expand">
                <div
                    v-if="floatingTocOpen"
                    ref="dropdownRef"
                    class="floating-toc-dropdown"
                >
                    <!-- Scroll to top -->
                    <button
                        class="floating-toc-item floating-toc-top cm-serif"
                        @click="handleScrollToTop"
                    >
                        <ChevronUp class="floating-toc-top-icon" />
                        Scroll to top
                    </button>

                    <div class="floating-toc-divider" />

                    <template v-for="(section, si) in sections" :key="section.id">
                        <button
                            class="floating-toc-item floating-toc-root cm-serif"
                            :class="{ 'is-active': activeRootId === section.id }"
                            :style="activeRootId === section.id ? { color: `var(--section-color-${si})` } : {}"
                            @click="selectRootSection(section.id)"
                        >
                            <component
                                :is="isSectionExpanded(section.id) ? ChevronDown : ChevronRight"
                                v-if="section.subsections?.length"
                                class="floating-toc-collapse-icon"
                            />
                            <span class="fira-code text-xs opacity-50">{{ section.number }}.</span>
                            {{ section.title }}
                        </button>
                        <template v-if="isSectionExpanded(section.id)">
                            <button
                                v-for="sub in section.subsections"
                                :key="sub.id"
                                class="floating-toc-item floating-toc-sub cm-serif"
                                @click="selectSection(sub.id)"
                            >
                                <span class="fira-code text-xs opacity-40">{{ sub.number }}.</span>
                                {{ sub.title }}
                            </button>
                        </template>
                    </template>
                </div>
            </Transition>

            <!-- Backdrop to close dropdown on outside tap -->
            <div
                v-if="floatingTocOpen"
                class="floating-toc-backdrop"
                @click="floatingTocOpen = false"
            />
        </div>
    </div>
</template>

<style scoped>
@reference "tailwindcss";
.floating-toc {
    position: sticky;
    top: 0;
    z-index: 20;
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
    background: hsl(var(--background) / 0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: none;
    border-bottom: 1px solid hsl(var(--border) / 0.5);
    cursor: pointer;
    text-align: left;
    @apply text-base;
    font-weight: 500;
    color: hsl(var(--foreground));
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
    color: hsl(var(--muted-foreground) / 0.5);
    transition: all 0.15s;
}

.floating-toc-search-btn:hover {
    color: hsl(var(--foreground));
    background: hsl(var(--muted) / 0.5);
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
    color: hsl(var(--muted-foreground) / 0.6);
    cursor: pointer;
    flex-shrink: 0;
}

.floating-toc-search-close:hover {
    color: hsl(var(--foreground));
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
    background: hsl(var(--background) / 0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid hsl(var(--border));
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
    display: flex !important;
    align-items: center;
    gap: 0.375rem;
    color: hsl(var(--muted-foreground) / 0.7) !important;
    font-size: 0.75rem !important;
    line-height: 1rem !important;
}

.floating-toc-top-icon {
    width: 0.875rem;
    height: 0.875rem;
    opacity: 0.6;
}

.floating-toc-divider {
    height: 1px;
    background: hsl(var(--border) / 0.5);
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
    color: hsl(var(--muted-foreground));
    transition: all 0.15s;
}

.floating-toc-root {
    display: flex !important;
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
    color: hsl(var(--muted-foreground) / 0.7);
}

.floating-toc-item:hover,
.floating-toc-item.is-active {
    background: hsl(var(--muted) / 0.5);
    color: hsl(var(--foreground));
}

.floating-toc-item.is-active {
    font-weight: 600;
}

/* ── Transition: toc-expand ──────────────────────────────── */
.toc-expand-enter-active,
.toc-expand-leave-active {
    transition: opacity 0.2s ease,
                transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
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
