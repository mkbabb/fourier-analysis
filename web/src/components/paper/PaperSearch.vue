<script setup lang="ts">
import PaperSearchInput from "./search/PaperSearchInput.vue";
import PaperSearchDropdown from "./search/PaperSearchDropdown.vue";
import PaperSearchModal from "./search/PaperSearchModal.vue";
import type { PaperSearchState } from "./search/usePaperSearch";
import { ref } from "vue";

const props = defineProps<{
    search: PaperSearchState;
    variant: "sidebar" | "floating";
}>();

const searchInputRef = ref<InstanceType<typeof PaperSearchInput> | null>(null);

function focus() {
    searchInputRef.value?.focus();
}

defineExpose({ focus });
</script>

<template>
    <div class="paper-search" :class="`paper-search--${variant}`">
        <PaperSearchInput
            ref="searchInputRef"
            :search="search"
            :variant="variant"
            :can-expand="!!search.query.value && search.results.value.length > 0"
            @expand="search.toggleExpanded()"
        />
        <PaperSearchDropdown
            :search="search"
            :variant="variant"
        />
        <PaperSearchModal
            :search="search"
        />
    </div>
</template>

<style scoped>
@reference "tailwindcss";
.paper-search {
    position: relative;
}

.paper-search-input-wrap {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    border: 1.5px solid var(--border);
    border-radius: calc(var(--radius) - 2px);
    background: var(--background);
    padding: 0.3rem 0.5rem;
    transition: border-color 0.15s ease;
}

.paper-search-input-wrap:focus-within {
    border-color: color-mix(in srgb, var(--primary) 50%, transparent);
}

.paper-search-icon {
    width: 0.8rem;
    height: 0.8rem;
    flex-shrink: 0;
    color: color-mix(in srgb, var(--muted-foreground) 50%, transparent);
}

.paper-search-input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    font-size: 0.78rem;
    color: var(--foreground);
    font-family: inherit;
}

.paper-search-input::placeholder {
    color: color-mix(in srgb, var(--muted-foreground) 45%, transparent);
}

.paper-search-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.15rem;
    border: none;
    background: none;
    color: color-mix(in srgb, var(--muted-foreground) 45%, transparent);
    cursor: pointer;
    border-radius: 3px;
    transition: color 0.12s, background 0.12s;
}

.paper-search-action-btn:hover {
    color: var(--foreground);
    background: color-mix(in srgb, var(--muted) 50%, transparent);
}

/* ── Inline dropdown ─────────────────────────────────────── */
.paper-search-results {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: var(--z-bar);
    max-height: 50vh;
    overflow-y: auto;
    overscroll-behavior: contain;
    border: 1.5px solid var(--border);
    border-radius: calc(var(--radius) - 2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    padding: 0.25rem;
}

.paper-search-result {
    display: flex;
    align-items: baseline;
    gap: 0.375rem;
    width: 100%;
    padding: 0.35rem 0.5rem;
    border: none;
    background: none;
    cursor: pointer;
    text-align: left;
    border-radius: calc(var(--radius) - 4px);
    transition: background 0.1s ease;
}

.paper-search-result:hover,
.paper-search-result.is-selected {
    background: color-mix(in srgb, var(--muted) 50%, transparent);
}

.paper-search-badge {
    flex-shrink: 0;
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
    background: var(--muted);
    color: color-mix(in srgb, var(--muted-foreground) 70%, transparent);
    line-height: 1;
}

.paper-search-badge[data-type="theorem"],
.paper-search-badge[data-type="lemma"],
.paper-search-badge[data-type="proposition"],
.paper-search-badge[data-type="corollary"] {
    background: color-mix(in srgb, var(--primary) 12%, transparent);
    color: var(--primary);
}

.paper-search-badge[data-type="definition"] {
    background: hsl(210 80% 55% / 0.12);
    color: hsl(210 80% 45%);
}

.paper-search-badge[data-type="equation"] {
    background: hsl(280 60% 55% / 0.12);
    color: hsl(280 60% 45%);
}

.paper-search-number {
    flex-shrink: 0;
    font-size: 0.68rem;
    color: color-mix(in srgb, var(--muted-foreground) 60%, transparent);
}

.paper-search-label {
    flex: 1;
    min-width: 0;
    @apply text-sm;
    color: color-mix(in srgb, var(--foreground) 85%, transparent);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.4;
}

.paper-search-label :deep(mark) {
    background: hsl(50 100% 60% / 0.35);
    color: inherit;
    border-radius: 1px;
    padding: 0 1px;
}

.paper-search-backdrop {
    position: fixed;
    inset: 0;
    z-index: var(--z-bar);
}

/* ── Sidebar variant ─────────────────────────────────────── */
.paper-search--sidebar {
    margin-bottom: 0.5rem;
}

/* ── Floating variant ────────────────────────────────────── */
.paper-search--floating .paper-search-input-wrap {
    border: none;
    border-radius: 0;
    background: transparent;
    padding: 0;
}

.paper-search--floating .paper-search-input {
    @apply text-base;
}

.paper-search--floating .paper-search-results {
    border-radius: 0;
    border-left: none;
    border-right: none;
    top: 100%;
    max-height: 60vh;
}

/* ── Inline dropdown transition ──────────────────────────── */
.search-dropdown-enter-active,
.search-dropdown-leave-active {
    transition:
        opacity 0.15s ease,
        transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.search-dropdown-enter-from,
.search-dropdown-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}

/* ── Modal overlay + panel ───────────────────────────────── */
.search-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: min(12vh, 6rem);
    background: color-mix(in srgb, var(--background) 55%, transparent);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
}

.search-modal {
    width: min(36rem, calc(100dvw - 2rem));
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    border-radius: 0.75rem;
    border: 1.5px solid var(--border);
    background: var(--background);
    box-shadow:
        0 8px 40px rgba(0, 0, 0, 0.14),
        0 2px 8px rgba(0, 0, 0, 0.06);
    overflow: hidden;
}

.search-modal-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 0.875rem;
    border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
}

.search-modal-icon {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    color: color-mix(in srgb, var(--muted-foreground) 50%, transparent);
}

.search-modal-input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    @apply text-base;
    color: var(--foreground);
    font-family: inherit;
}

.search-modal-input::placeholder {
    color: color-mix(in srgb, var(--muted-foreground) 40%, transparent);
}

.search-modal-results {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 0.375rem;
}

.search-modal-result {
    padding: 0.5rem 0.625rem;
}

.search-modal-result .paper-search-badge {
    font-size: 0.65rem;
    padding: 0.125rem 0.375rem;
}

.search-modal-result .paper-search-number {
    font-size: 0.72rem;
}

.search-modal-result .paper-search-label {
    @apply text-base;
}

.search-modal-empty {
    padding: 2rem 1rem;
    text-align: center;
    color: color-mix(in srgb, var(--muted-foreground) 50%, transparent);
    @apply text-base;
}

.search-modal-footer {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 0.875rem;
    border-top: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
}

.search-modal-hint {
    @apply text-sm;
    color: color-mix(in srgb, var(--muted-foreground) 45%, transparent);
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.search-modal-hint kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.25rem;
    height: 1.125rem;
    padding: 0 0.25rem;
    border-radius: 3px;
    border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
    background: color-mix(in srgb, var(--muted) 40%, transparent);
    font-size: 0.6rem;
    line-height: 1;
}

/* ── Modal transition ────────────────────────────────────── */
.search-modal-enter-active {
    transition: opacity 0.2s ease;
}

.search-modal-enter-active .search-modal {
    transition:
        opacity 0.2s ease,
        transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.search-modal-leave-active {
    transition: opacity 0.15s ease;
}

.search-modal-leave-active .search-modal {
    transition:
        opacity 0.15s ease,
        transform 0.15s cubic-bezier(0.4, 0, 1, 1);
}

.search-modal-enter-from {
    opacity: 0;
}

.search-modal-enter-from .search-modal {
    opacity: 0;
    transform: scale(0.96) translateY(-8px);
}

.search-modal-leave-to {
    opacity: 0;
}

.search-modal-leave-to .search-modal {
    opacity: 0;
    transform: scale(0.97) translateY(-4px);
}
</style>
