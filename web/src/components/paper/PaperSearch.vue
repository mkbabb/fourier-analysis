<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { Search, X, Maximize2, Minimize2 } from "lucide-vue-next";
import { fuzzyMatch } from "./paperSearchIndex";
import type { PaperSearchState } from "./usePaperSearch";
import type { SearchResult } from "./paperSearchIndex";

const props = defineProps<{
    search: PaperSearchState;
    variant: "sidebar" | "floating";
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const resultsRef = ref<HTMLElement | null>(null);
const modalInputRef = ref<HTMLInputElement | null>(null);

// Scroll selected result into view
watch(
    () => props.search.selectedIndex.value,
    () => {
        nextTick(() => {
            // Scroll in whichever container is active
            const container = props.search.isExpanded.value
                ? document.querySelector(".search-modal-results")
                : resultsRef.value;
            const el = container?.querySelector(".is-selected");
            el?.scrollIntoView({ block: "nearest" });
        });
    },
);

// Auto-focus input when opened
watch(
    () => props.search.isOpen.value,
    (open) => {
        if (open) nextTick(() => inputRef.value?.focus());
    },
);

// Focus modal input when expanded
watch(
    () => props.search.isExpanded.value,
    (expanded) => {
        if (expanded) nextTick(() => modalInputRef.value?.focus());
    },
);

function focus() {
    inputRef.value?.focus();
}

defineExpose({ focus });

const TYPE_LABELS: Record<string, string> = {
    section: "Sec",
    theorem: "Thm",
    definition: "Def",
    lemma: "Lem",
    proposition: "Prop",
    corollary: "Cor",
    equation: "Eq",
    figure: "Fig",
    code: "Code",
    proof: "Prf",
    bibliography: "Bib",
    aside: "Note",
    example: "Ex",
};

function resultLabel(r: SearchResult): string {
    if (r.label) return r.label;
    if (r.rawTex) return r.rawTex.slice(0, 120);
    return r.plainText.slice(0, 120);
}

/**
 * Highlight matched characters using the fuzzy match indices.
 * Falls back to re-running fuzzyMatch on the display label.
 */
function highlightFuzzy(text: string, query: string): string {
    if (!query.trim() || !text) return escapeHtml(text);

    // Re-run fuzzy match on the display text to get precise indices
    const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const textLc = text.toLowerCase();
    const matchSet = new Set<number>();

    for (const token of tokens) {
        const m = fuzzyMatch(token, textLc);
        if (m) {
            for (const idx of m.matches) matchSet.add(idx);
        }
    }

    if (matchSet.size === 0) return escapeHtml(text);

    // Build highlighted string, grouping consecutive matches into single <mark> tags
    const chars = [...text];
    const parts: string[] = [];
    let i = 0;

    while (i < chars.length) {
        if (matchSet.has(i)) {
            // Collect consecutive matched chars
            let j = i;
            while (j < chars.length && matchSet.has(j)) j++;
            parts.push(`<mark>${escapeHtml(chars.slice(i, j).join(""))}</mark>`);
            i = j;
        } else {
            parts.push(escapeHtml(chars[i]));
            i++;
        }
    }

    return parts.join("");
}

function escapeHtml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
</script>

<template>
    <div class="paper-search" :class="`paper-search--${variant}`">
        <!-- Inline input -->
        <div class="paper-search-input-wrap">
            <Search class="paper-search-icon" />
            <input
                ref="inputRef"
                type="text"
                class="paper-search-input"
                placeholder="Search paper…"
                :value="search.query.value"
                @input="search.query.value = ($event.target as HTMLInputElement).value"
                @keydown="search.onKeydown"
                @focus="search.isOpen.value = true"
            />
            <button
                v-if="search.query.value && search.results.value.length > 0"
                class="paper-search-action-btn"
                @click="search.toggleExpanded()"
                :title="search.isExpanded.value ? 'Collapse' : 'Expand'"
            >
                <Maximize2 v-if="!search.isExpanded.value" class="h-3 w-3" />
                <Minimize2 v-else class="h-3 w-3" />
            </button>
            <button
                v-if="search.query.value"
                class="paper-search-action-btn"
                @click="search.close()"
                title="Clear search"
            >
                <X class="h-3 w-3" />
            </button>
        </div>

        <!-- Inline dropdown (non-expanded) -->
        <Transition name="search-dropdown">
            <div
                v-if="search.isOpen.value && !search.isExpanded.value && search.results.value.length > 0"
                ref="resultsRef"
                class="paper-search-results"
            >
                <button
                    v-for="(r, i) in search.results.value"
                    :key="`${r.id}-${r.type}-${i}`"
                    class="paper-search-result"
                    :class="{ 'is-selected': i === search.selectedIndex.value }"
                    @click="search.selectResult(r)"
                    @mouseenter="search.selectedIndex.value = i"
                >
                    <span class="paper-search-badge" :data-type="r.type">
                        {{ TYPE_LABELS[r.type] ?? r.type }}
                    </span>
                    <span v-if="r.number" class="paper-search-number fira-code">
                        {{ r.number }}
                    </span>
                    <span
                        class="paper-search-label"
                        v-html="highlightFuzzy(resultLabel(r), search.query.value)"
                    />
                </button>
            </div>
        </Transition>

        <!-- Backdrop for inline dropdown (floating variant only) -->
        <div
            v-if="variant === 'floating' && search.isOpen.value && !search.isExpanded.value && search.results.value.length > 0"
            class="paper-search-backdrop"
            @click="search.close()"
        />

        <!-- Expanded modal -->
        <Teleport to="body">
            <Transition name="search-modal">
                <div
                    v-if="search.isExpanded.value"
                    class="search-modal-overlay"
                    @click.self="search.toggleExpanded()"
                >
                    <div class="search-modal" @click.stop>
                        <!-- Modal header with input -->
                        <div class="search-modal-header">
                            <Search class="search-modal-icon" />
                            <input
                                ref="modalInputRef"
                                type="text"
                                class="search-modal-input"
                                placeholder="Search paper…"
                                :value="search.query.value"
                                @input="search.query.value = ($event.target as HTMLInputElement).value"
                                @keydown="search.onKeydown"
                            />
                            <button
                                class="paper-search-action-btn"
                                @click="search.toggleExpanded()"
                                title="Collapse"
                            >
                                <Minimize2 class="h-3.5 w-3.5" />
                            </button>
                            <button
                                class="paper-search-action-btn"
                                @click="search.close()"
                                title="Close"
                            >
                                <X class="h-3.5 w-3.5" />
                            </button>
                        </div>

                        <!-- Modal results -->
                        <div class="search-modal-results" v-if="search.results.value.length > 0">
                            <button
                                v-for="(r, i) in search.results.value"
                                :key="`modal-${r.id}-${r.type}-${i}`"
                                class="paper-search-result search-modal-result"
                                :class="{ 'is-selected': i === search.selectedIndex.value }"
                                @click="search.selectResult(r)"
                                @mouseenter="search.selectedIndex.value = i"
                            >
                                <span class="paper-search-badge" :data-type="r.type">
                                    {{ TYPE_LABELS[r.type] ?? r.type }}
                                </span>
                                <span v-if="r.number" class="paper-search-number fira-code">
                                    {{ r.number }}
                                </span>
                                <span
                                    class="paper-search-label"
                                    v-html="highlightFuzzy(resultLabel(r), search.query.value)"
                                />
                            </button>
                        </div>
                        <div v-else class="search-modal-empty">
                            No results
                        </div>

                        <!-- Modal footer -->
                        <div class="search-modal-footer">
                            <span class="search-modal-hint fira-code">
                                <kbd>&uarr;</kbd><kbd>&darr;</kbd> navigate
                            </span>
                            <span class="search-modal-hint fira-code">
                                <kbd>&crarr;</kbd> select
                            </span>
                            <span class="search-modal-hint fira-code">
                                <kbd>esc</kbd> close
                            </span>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<style scoped>
.paper-search {
    position: relative;
}

.paper-search-input-wrap {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    border: 1.5px solid hsl(var(--border));
    border-radius: calc(var(--radius) - 2px);
    background: hsl(var(--background));
    padding: 0.3rem 0.5rem;
    transition: border-color 0.15s ease;
}

.paper-search-input-wrap:focus-within {
    border-color: hsl(var(--primary) / 0.5);
}

.paper-search-icon {
    width: 0.8rem;
    height: 0.8rem;
    flex-shrink: 0;
    color: hsl(var(--muted-foreground) / 0.5);
}

.paper-search-input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    font-size: 0.78rem;
    color: hsl(var(--foreground));
    font-family: inherit;
}

.paper-search-input::placeholder {
    color: hsl(var(--muted-foreground) / 0.45);
}

.paper-search-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.15rem;
    border: none;
    background: none;
    color: hsl(var(--muted-foreground) / 0.45);
    cursor: pointer;
    border-radius: 3px;
    transition: color 0.12s, background 0.12s;
}

.paper-search-action-btn:hover {
    color: hsl(var(--foreground));
    background: hsl(var(--muted) / 0.5);
}

/* ── Inline dropdown ─────────────────────────────────────── */
.paper-search-results {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 30;
    max-height: 50vh;
    overflow-y: auto;
    overscroll-behavior: contain;
    background: hsl(var(--background) / 0.97);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1.5px solid hsl(var(--border));
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
    background: hsl(var(--muted) / 0.5);
}

.paper-search-badge {
    flex-shrink: 0;
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
    background: hsl(var(--muted));
    color: hsl(var(--muted-foreground) / 0.7);
    line-height: 1;
}

.paper-search-badge[data-type="theorem"],
.paper-search-badge[data-type="lemma"],
.paper-search-badge[data-type="proposition"],
.paper-search-badge[data-type="corollary"] {
    background: hsl(var(--primary) / 0.12);
    color: hsl(var(--primary));
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
    color: hsl(var(--muted-foreground) / 0.6);
}

.paper-search-label {
    flex: 1;
    min-width: 0;
    font-size: 0.75rem;
    color: hsl(var(--foreground) / 0.85);
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
    z-index: 25;
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
    font-size: 0.8125rem;
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
    z-index: 100;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: min(12vh, 6rem);
    background: hsl(var(--background) / 0.55);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
}

.search-modal {
    width: min(36rem, calc(100vw - 2rem));
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    border-radius: 0.75rem;
    border: 1.5px solid hsl(var(--border));
    background: hsl(var(--background));
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
    border-bottom: 1px solid hsl(var(--border) / 0.5);
}

.search-modal-icon {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    color: hsl(var(--muted-foreground) / 0.5);
}

.search-modal-input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    font-size: 0.9375rem;
    color: hsl(var(--foreground));
    font-family: inherit;
}

.search-modal-input::placeholder {
    color: hsl(var(--muted-foreground) / 0.4);
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
    font-size: 0.8125rem;
}

.search-modal-empty {
    padding: 2rem 1rem;
    text-align: center;
    color: hsl(var(--muted-foreground) / 0.5);
    font-size: 0.8125rem;
}

.search-modal-footer {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 0.875rem;
    border-top: 1px solid hsl(var(--border) / 0.5);
}

.search-modal-hint {
    font-size: 0.625rem;
    color: hsl(var(--muted-foreground) / 0.45);
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
    border: 1px solid hsl(var(--border) / 0.6);
    background: hsl(var(--muted) / 0.4);
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
