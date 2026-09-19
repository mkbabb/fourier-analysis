<script setup lang="ts">
/**
 * X·F F.W4 `.e` — `PSM-2 ⊕ PSM-6 ⊕ PSM-3`, cured as ONE thing.
 *
 * `PSM-3`: this component used to mount TWICE below 1024px — once inside the
 * CSS-hidden desktop sidebar, once inside the mobile bar — against ONE shared
 * `isExpanded`. Both teleported to `<body>`, both raced `nextTick` focus, and a
 * document-global query for the results panel deterministically found the
 * invisible one. It is now mounted ONCE, by `PaperView`, the ancestor both
 * hosts share; the hosts keep only their triggers.
 *
 * `PSM-2`: it was not a dialog — no role, no name, no focus trap, no focus
 * restore, no background inert, no scroll lock, Escape bound to the input
 * alone. The producer ships all of that: `Dialog` + `DialogContent` at the
 * installed 8.0.0 (the dismissal grammar's `free` rung = ✕ · Esc · outside).
 * Adopting it is the cure, not a hand-rolled trap.
 *
 * `PSM-6`: `@keydown` was on the input, while every result row and both header
 * actions are native tabbable buttons — the moment focus left the input, ↑/↓/
 * Enter/Escape died while the footer kept advertising them. The handler is on
 * the dialog content now, so the model follows the focus.
 */
import { ref, watch, nextTick } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@mkbabb/glass-ui/dialog";
import { Search } from "@lucide/vue";
import type { PaperSearchState } from "./usePaperSearch";
import PaperSearchResultRow from "./PaperSearchResultRow.vue";

const props = defineProps<{
    search: PaperSearchState;
}>();

const modalInputRef = ref<HTMLInputElement | null>(null);
const resultsRef = ref<HTMLElement | null>(null);

/**
 * The palette geometry, bound INLINE — and the reason is `PSM-1`'s own
 * mechanism read once more at the bytes.
 *
 * Everything this component renders (header, listbox, footer) carries this
 * SFC's scope id and is styled by the block below, portal or no portal. The
 * `DialogContent` ROOT is a child component's root inside reka's portal, and a
 * scope id does not cross that — the identical rule that orphaned 43 blocks
 * here in the first place. Measured, not assumed: with the geometry authored as
 * a scoped `.search-modal` class the panel computed `top: 450px` from the
 * producer's own centred-plate rule, i.e. the class matched nothing.
 *
 * So the four declarations that must beat a producer default are bound as
 * inline style, where no scoping question exists; the producer keeps the
 * surface, the scrim, the shadow and the entrance (`PSM-38`/`PSM-12`).
 */
const panelStyle = {
    /* The producer's plate is a `grid`; a command palette is a column whose
       middle row scrolls, which is why the display mode is declared here too —
       without it the footer is pushed past the cap and clipped. */
    display: "flex",
    flexDirection: "column",
    top: "min(12vh, 6rem)",
    left: "50%",
    translate: "-50% 0",
    /* `PSM-21`: the panel's own cap on the axis the mobile keyboard moves. */
    inlineSize: "min(36rem, calc(100dvw - 2rem))",
    maxBlockSize: "70dvh",
    padding: "0",
    gap: "0",
    overflow: "hidden",
} as const;

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
    <Dialog
        modal
        :open="search.isExpanded.value"
        @update:open="(open: boolean) => (search.isExpanded.value = open)"
    >
        <DialogContent
            class="search-modal"
            dismiss="free"
            :style="panelStyle"
        >
            <DialogTitle class="sr-only">Search the paper</DialogTitle>
            <DialogDescription class="sr-only">
                Type to search sections, theorems, equations and figures. Use the up and
                down arrows to move through the results and Enter to go to one.
            </DialogDescription>

            <!-- `PSM-6`: the key handler is on this shell, not on the input.
                 Every result row and both header actions are native tabbable
                 buttons, so with the handler on the input alone ↑/↓/⏎/esc died
                 the moment focus left it while the footer kept advertising
                 them. Measured this seat: the listener must sit on an element
                 THIS component renders — bound on `<DialogContent>` it lands in
                 a producer component's `$attrs` and never reaches the DOM. -->
            <div class="search-modal-shell" @keydown="search.onKeydown">
            <!-- Modal header with input -->
            <div class="search-modal-header">
                <Search class="search-modal-icon" aria-hidden="true" />
                <input
                    ref="modalInputRef"
                    type="text"
                    class="search-modal-input"
                    placeholder="Search paper..."
                    aria-label="Search the paper"
                    role="combobox"
                    aria-autocomplete="list"
                    :aria-expanded="search.results.value.length > 0"
                    :aria-controls="search.listboxId"
                    :aria-activedescendant="
                        search.results.value.length > 0
                            ? search.optionId(search.selectedIndex.value)
                            : undefined
                    "
                    :value="search.query.value"
                    @input="search.query.value = ($event.target as HTMLInputElement).value"
                />
                <!-- `PSM-26`: Collapse and Close were two visually identical
                     ghost icons with opposite data semantics — one preserved the
                     query, the other destroyed it with no undo — told apart only
                     by a `title` at an icon size that rendered identically. The
                     dialog's own ✕ (and Esc, and outside) now COLLAPSE; the
                     destructive one says what it destroys, in words. -->
                <Button
                    emphasis="quiet"
                    size="sm"
                    type="button"
                    @click="search.close()"
                >
                    Clear
                </Button>
            </div>

            <!-- Modal results -->
            <div
                v-if="search.results.value.length > 0"
                :id="search.listboxId"
                ref="resultsRef"
                class="search-modal-results"
                role="listbox"
                aria-label="Search results"
            >
                <PaperSearchResultRow
                    v-for="(r, i) in search.results.value"
                    :key="r.key"
                    dense
                    :id="search.optionId(i)"
                    :result="r"
                    :query="search.query.value"
                    :selected="i === search.selectedIndex.value"
                    @select="search.selectResult(r)"
                    @hover="search.selectedIndex.value = i"
                />
            </div>
            <div v-else :id="search.listboxId" class="search-modal-empty" role="listbox" aria-label="Search results">
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
                <!-- The legend used to read "esc close". Escape COLLAPSES and
                     keeps the query; only Clear destroys it. -->
                <span class="search-modal-hint fira-code">
                    <kbd class="kbd">esc</kbd> collapse
                </span>
            </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<style scoped>
@reference "tailwindcss";
/* X·F F.W4 `.e` — `PSM-1`: the modal's rules lived in `PaperSearch.vue` and
   reached NOTHING here: this component's subTree is the Teleport the dialog
   mounts, so the single-root scope-id inheritance rule cannot fire, and the
   panel shipped as an unstyled block appended to `<body>`. They live in their
   own SFC now — a component's own elements carry its scope id wherever they are
   portalled.

   `PSM-38`/`PSM-12`: the scrim, the plate and the shadow are the producer's
   (`DialogContent`), not hand-rolled literals. What is left here is the palette
   GEOMETRY — a top-anchored command bar rather than the dialog's centred
   plate — and nothing that a design token already answers. */
.search-modal-shell {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-block-size: 0;
    inline-size: 100%;
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
       banked at 1.88 and the harness reproduces. The STRONG rung, not the
       plain one: this ink sits on the producer's translucent plate, where the
       page behind it is part of the composite, and the strong rung is the
       register the design system declares for exactly that
       (`--muted-foreground-strong: var(--on-glass-muted-strong)`) — 7.882:1
       light / 10.295:1 dark against the page. */
    color: var(--muted-foreground-strong);
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

/* `PSM-25`: glass-ui ships a `.kbd` atom as a global utility — 11px type, a
   1.5rem box, `--radius-sm` — and the producer's own search legend puts it on
   these exact four keycaps. The hand-rolled block was strictly worse on every
   axis it touched (9.6px in a 1.125rem box at 3px radius) and is deleted, not
   re-tuned. */

/* `PSM-32`/`PSM-40`: the hand-rolled enter/leave pair is gone with the
   overlay it animated — `DialogContent`'s `motion` axis owns the entrance now,
   including its reduced-motion arm, so the mismatched 0.2s/0.25s durations and
   the statically-applied enter-from frame have nothing left to disagree about. */
</style>
