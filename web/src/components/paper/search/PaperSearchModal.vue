<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { Search, X, Minimize2 } from "@lucide/vue";
import type { PaperSearchState } from "./usePaperSearch";
import PaperSearchResultRow from "./PaperSearchResultRow.vue";

const props = defineProps<{
    search: PaperSearchState;
}>();

const modalInputRef = ref<HTMLInputElement | null>(null);
const resultsRef = ref<HTMLElement | null>(null);

// Focus modal input when expanded
watch(
    () => props.search.isExpanded.value,
    (expanded) => {
        if (expanded) nextTick(() => modalInputRef.value?.focus());
    },
);

// Scroll selected result into view inside the modal.
// `PSM-15`: this read `document.querySelector(".search-modal-results")` — a
// document-global reach that, with two instances mounted, deterministically
// found the OTHER one's panel. The template ref is the sibling's own idiom and
// the in-file disproof was three lines up (`modalInputRef` crosses the same
// Teleport).
watch(
    () => props.search.selectedIndex.value,
    () => {
        if (!props.search.isExpanded.value) return;
        nextTick(() => {
            resultsRef.value?.querySelector(".is-selected")?.scrollIntoView({
                block: "nearest",
            });
        });
    },
);
</script>

<template>
    <Teleport to="body">
        <Transition name="search-modal">
            <div
                v-if="search.isExpanded.value"
                class="search-modal-overlay"
                @click.self="search.toggleExpanded()"
            >
                <div class="search-modal">
                    <!-- Modal header with input -->
                    <div class="search-modal-header">
                        <Search class="search-modal-icon" />
                        <input
                            ref="modalInputRef"
                            type="text"
                            class="search-modal-input"
                            placeholder="Search paper..."
                            :value="search.query.value"
                            @input="search.query.value = ($event.target as HTMLInputElement).value"
                            @keydown="search.onKeydown"
                        />
                        <Button
                            emphasis="quiet"
                            size="md" icon-only
                            type="button"
                            class="paper-search-action-btn"
                            @click="search.toggleExpanded()"
                            aria-label="Collapse to the inline results"
                        >
                            <Minimize2 class="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            emphasis="quiet"
                            size="md" icon-only
                            type="button"
                            class="paper-search-action-btn"
                            @click="search.close()"
                            aria-label="Close search and clear the query"
                        >
                            <X class="h-3.5 w-3.5" />
                        </Button>
                    </div>

                    <!-- Modal results -->
                    <div ref="resultsRef" class="search-modal-results" v-if="search.results.value.length > 0">
                        <PaperSearchResultRow
                            v-for="(r, i) in search.results.value"
                            :key="`modal-${r.id}-${r.type}-${i}`"
                            dense
                            :result="r"
                            :query="search.query.value"
                            :selected="i === search.selectedIndex.value"
                            @select="search.selectResult(r)"
                            @hover="search.selectedIndex.value = i"
                        />
                    </div>
                    <div v-else class="search-modal-empty">
                        No results
                    </div>

                    <!-- Modal footer -->
                    <div class="search-modal-footer">
                        <span class="search-modal-hint fira-code">
                            <kbd class="kbd">&uarr;</kbd><kbd class="kbd">&darr;</kbd> navigate
                        </span>
                        <span class="search-modal-hint fira-code">
                            <kbd class="kbd">&crarr;</kbd> select
                        </span>
                        <!-- `PSM-26`: the legend used to read "esc close". Escape
                             COLLAPSES when expanded and keeps the query; only the
                             ✕ destroys it. The legend now says what the key
                             does. -->
                        <span class="search-modal-hint fira-code">
                            <kbd class="kbd">esc</kbd> collapse
                        </span>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
@reference "tailwindcss";
/* X·F F.W4 `.e` — `PSM-1`: the modal's rules lived in `PaperSearch.vue` and
   reached NOTHING here: this component's subTree is the `<Teleport>` vnode, so
   the single-root scope-id inheritance rule cannot fire, and the panel shipped
   as an unstyled block appended to `<body>`. They live in their own SFC now —
   a component's own elements carry its scope id through a Teleport. */
.search-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: min(12vh, 6rem);
    /* `PSM-12`: the scrim was `--background` at 55% OVER `--background` — no
       scrim at all in either arm. The producer ships one. */
    background: var(--overlay-scrim);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
}

.search-modal {
    /* `PSM-21`: `dvh` for the panel's own cap, so the mobile keyboard's
       viewport inset is accounted for on the axis that was measured in `vh`. */
    width: min(36rem, calc(100dvw - 2rem));
    max-height: 70dvh;
    display: flex;
    flex-direction: column;
    border-radius: 0.75rem;
    /* `PSM-12`: the plate was the PAGE token, so in dark mode the modal and the
       page behind it were the same colour and the only remaining boundary was a
       1.5px hairline at 2.82:1 — under the 3:1 SC 1.4.11 floor. `--card` is a
       distinct surface in BOTH arms, and the boundary is now a token shadow
       rather than hardcoded black over near-black. */
    border: 1.5px solid var(--border);
    background: var(--card);
    box-shadow: var(--shadow-modal);
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
    color: var(--muted-foreground);
}

.search-modal-input {
    flex: 1;
    min-width: 0;
    border: none;
    /* `PSM-13` — THE REPAIR ARMS THE DEFECT, so the replacement lands in the
       same commit. This `outline: none` was inert only because `PSM-1` kept the
       whole block from reaching the element; colocating it makes the modal's
       primary control the one ringless thing on the surface (the result rows
       keep glass `Button`'s ring). The app's global allowlist names four
       classes and not this one, so the ring is declared here. */
    outline: none;
    background: transparent;
    @apply text-base;
    color: var(--foreground);
    font-family: inherit;
}

.search-modal-input:focus-visible {
    outline: var(--focus-ring-width) solid var(--focus-ring-color);
    outline-offset: 2px;
    border-radius: calc(var(--radius) - 4px);
}

.search-modal-input::placeholder {
    /* `PSM-4`: 1.739:1 at the authored 40% dilution (harness reading). */
    color: var(--muted-foreground);
}

/* The colocated twin of `PaperSearchInput`'s rule: each SFC owns the chrome it
   renders, which is what `PSM-1`'s cure means. */
.paper-search-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.15rem;
    border: none;
    background: none;
    color: var(--muted-foreground);
    cursor: pointer;
    border-radius: 3px;
    transition:
        color 0.12s var(--ease-standard),
        background-color 0.12s var(--ease-standard);
}

.paper-search-action-btn:hover {
    color: var(--foreground);
    background: color-mix(in srgb, var(--muted) 50%, transparent);
}

.search-modal-results {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 0.375rem;
}

.search-modal-empty {
    padding: 2rem 1rem;
    text-align: center;
    /* `PSM-4`: 2.042:1 at the authored 50% dilution. */
    color: var(--muted-foreground);
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
    /* `PSM-4`: 1.888:1 at the authored 45% dilution — the pair the registry
       banked at 1.88 and the harness reproduces. */
    color: var(--muted-foreground);
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

/* `PSM-25`: glass-ui ships a `.kbd` atom as a global utility — 11px type, a
   1.5rem box, `--radius-sm` — and the producer's own search legend puts it on
   these exact four keycaps. The hand-rolled block was strictly worse on every
   axis it touched (9.6px in a 1.125rem box at 3px radius) and is deleted, not
   re-tuned. */

/* ── Modal transition ────────────────────────────────────── */
/* `PSM-40`: the enter pair disagreed — overlay 0.2s, child 0.25s — so Vue's
   `whenTransitionEnds` timed out on the overlay and cancelled the child's
   transform near its end. The leave pair already matched, which is how we know
   the author meant them to. */
.search-modal-enter-active,
.search-modal-enter-active .search-modal {
    transition:
        opacity 0.2s var(--ease-standard),
        transform 0.2s var(--ease-out-expo);
}

.search-modal-leave-active,
.search-modal-leave-active .search-modal {
    transition:
        opacity 0.15s var(--ease-standard),
        transform 0.15s var(--ease-in);
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

/* `PSM-32`: under PRM the producer's universal reset drops `transform` from the
   transitioned set, so the enter-from frame applied statically and then
   snapped. Reduced motion gets a plain cross-fade with no spatial offset. */
@media (prefers-reduced-motion: reduce) {
    .search-modal-enter-from .search-modal,
    .search-modal-leave-to .search-modal {
        transform: none;
    }
}
</style>
