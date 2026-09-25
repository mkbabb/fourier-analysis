<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { X } from "@lucide/vue";
import SearchField from "@/components/shared/SearchField.vue";
import type { PaperSearchState } from "./usePaperSearch";

const props = defineProps<{
    search: PaperSearchState;
    variant: "sidebar" | "floating";
}>();

/* The field is the shared `SearchField` (glass `Input` + the leading glyph,
   X.F.W14V.au6), which exposes `focus()`. */
const fieldRef = ref<InstanceType<typeof SearchField> | null>(null);

function focus() {
    fieldRef.value?.focus();
}

watch(
    () => props.search.isOpen.value,
    (open) => {
        if (open) nextTick(focus);
    },
);

/**
 * UIA-F-62 — the in-field ✕ is labelled "Clear search" and it CLEARS: it used
 * to call `close()`, which also closed the search (on the floating bar, the
 * whole bar), so two ✕ ninety pixels apart did the same thing. Dismissal is
 * the surface's own close; this empties the field and keeps focus in it.
 */
function clearQuery() {
    props.search.clear();
    focus();
}

defineExpose({ focus });
</script>

<template>
    <!-- X·F F.W3 `.c` — `MISS-DU4`: the field's chrome was pointer-dead. The
         24px glyph is the largest mark in the field and all of the wrap's
         padding is hit area, and none of it did anything — while the `focus()`
         this component already exposes was exactly what a click on it should
         run. A wrapping `<label>` (now `SearchField`'s own root) is the whole cure and it is free: the
         `<input>` is its only labelable descendant, so the association is
         implicit, and label activation is NOT forwarded when the click lands on
         an interactive descendant, so the two action Buttons keep their own
         behaviour. The accessible NAME stays the input's `aria-label` (`C-7`'s
         naming half, already landed) — this label carries no text and is not
         competing for it. -->
    <!-- `★MF-2`: the inline arm is the same combobox as the palette's and had
         the same nothing — a placeholder standing in for a name, no `role`,
         and arrows that moved a selection no reader could observe. -->
    <SearchField
        ref="fieldRef"
        class="paper-search-input-wrap"
        :class="`paper-search-input-wrap--${variant}`"
        type="text"
        placeholder="Search paper..."
        aria-label="Search the paper"
        role="combobox"
        aria-autocomplete="list"
        spellcheck="false"
        autocomplete="off"
        :aria-expanded="search.panelOpen.value"
        :aria-controls="search.listboxId"
        :aria-activedescendant="
            search.panelOpen.value && search.results.value.length > 0
                ? search.optionId(search.selectedIndex.value)
                : undefined
        "
        :model-value="search.query.value"
        @input="search.query.value = ($event.target as HTMLInputElement).value"
        @keydown="search.onKeydown"
        @focus="search.isOpen.value = true"
    >
        <!-- `MISS-DU1`: both action Buttons shipped at the default `md` rung,
             which is `--control-h-md` = `max(2.5rem * --ui-scale,
             --control-floor)` = 40px fine / 60px coarse (measured at the
             compiled bytes: `.button{--button-size:var(--control-h-md)}` +
             `.button[data-icon-only]{block-size:var(--button-size)}`). They
             mount on the FIRST keystroke, so the wrap — which sized to its
             tallest child — grew ~16px and translated the whole Contents tree
             down with it. `xs` is `--control-h-xs` = `max(1.75rem * --ui-scale,
             --control-floor)` = 28px fine / 44px coarse, which fits inside the
             wrap's fixed box below, and `--control-floor` is `--touch-target`
             — so the WCAG 2.5.8 floor is supplied EXPLICITLY by the token
             rather than inherited from an un-overridden height
             (`FR-PSD-BASE`'s inversion lock, honoured at the one place this
             unit changes a control's geometry). -->
        <template #actions>
            <Button
                v-if="search.query.value"
                emphasis="quiet"
                size="xs" icon-only
                type="button"
                class="paper-search-action-btn"
                @click="clearQuery"
                aria-label="Clear search"
            >
                <X class="h-3 w-3" />
            </Button>
        </template>
    </SearchField>
</template>

<style scoped>
@reference "tailwindcss";
/* X·F F.W4 `.e` — `PSM-1` (= PV `D/B-1` = `C-01b`): THESE RULES NOW REACH THE
   ELEMENTS THEY NAME. They were authored in `PaperSearch.vue`'s single scoped
   block, where the parent's scope id reaches this component's ROOT and nothing
   below it — so every rule below the wrap was orphaned and the search chrome
   shipped unstyled. Colocation in the owning SFC is the cure. Since
   X.F.W14V.au6 the field is `SearchField`'s element, so the one rule that
   keeps this host's type register names it through `:deep`. */
/* X.F.W11 `.e` — R-d-1 (COHESION §0aq, ESC-F11d-1): THE FIELD IS THE
   PRODUCER'S `Input`, AND THE WRAP STOPS PAINTING ONE. The wrap drew a whole
   field around a chromeless `<input>` — its own 1.5px boundary, fill, radius
   and a `:focus-within` ring standing in for the one `outline: none` killed —
   which is exactly the surface `@mkbabb/glass-ui/input` ships. Spec `.a`:
   "where a component is one that glass-ui ships (input …), the local styling
   yields to the producer's surface". So the `field-control` now owns the
   boundary, fill, pill radius and the `:focus-visible` ring, and the wrap is
   layout only: a positioning context that seats the glyph and the actions
   INSIDE the producer's field.
   `MISS-DU1` holds structurally, not by arithmetic: the field's block size is
   the producer's `--field-control-height` (`md` → `--control-h-md`, the same
   rung the wrap declared), and the actions are positioned, so no optional
   child can grow the box. `MISS-DU4` holds: the wrap is still the `<label>`,
   so the glyph and the gutter stay hit area for the field. */
/* X.F.W14V.au6 — F-W14U (e): the wrap, the glyph and the actions' seat are
   the shared `SearchField`'s (one anatomy with the gallery bar and the admin
   toolbar). What stays here is this field's own: the actions' run it reserves
   (the one `xs` action, Clear; UIA-F-159 retired Expand; `--control-h-xs` is
   the producer's token, clamped to `--control-floor` on coarse pointers) and
   its type register. */
.paper-search-input-wrap {
    --search-field-end: calc(var(--control-h-xs) + 0.5rem);
}

/* `PV ★MF-5` / `SP-14`: 0.78rem is ~12.5px, and iOS Safari zooms any input
   under 16px on focus. The substrate's `.ios` guard never fires here —
   fourier sets no `.ios` class anywhere — so the floor is declared at the
   control, where no class bookkeeping can lose it. Desktop keeps the small
   register through the `lg` arm below. (`:deep`: the field is SearchField's
   element; this host keeps the register.) */
.paper-search-input-wrap :deep(.search-field-input) {
    font-size: max(1rem, 0.78rem);
}

@media (min-width: 1024px) and (pointer: fine) {
    .paper-search-input-wrap :deep(.search-field-input) {
        font-size: 0.78rem;
    }
}

.paper-search-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.15rem;
    border: none;
    background: none;
    color: var(--muted-foreground);
    cursor: pointer;
    border-radius: var(--radius-xs);
    /* A.W3.d — named properties + canonical tokens, no bare `transition`. */
    transition:
        color 0.12s var(--ease-standard),
        background-color 0.12s var(--ease-standard);
}

.paper-search-action-btn:hover {
    color: var(--foreground);
    background: color-mix(in srgb, var(--muted) 50%, transparent);
}

/* ── Floating (mobile bar) variant ───────────────────────────────────────
   Authored in the parent as `.paper-search--floating .paper-search-input-wrap`,
   a descendant selector that scoping could never resolve. It is now a state of
   the element itself, driven by the `variant` prop this component already
   receives. X.F.W11 `.e`: the variant's `border: none; background:
   transparent; padding: 0` retire with the wrap's chrome — there is nothing
   left on the wrap to strip, and the field inside the bar is the producer's
   one surface. The field keeps the `md` control rung, so the search arm of
   `.floating-toc-bar` is still exactly as tall as its trigger arm (a `md`
   Button). */

.paper-search-input-wrap--floating :deep(.search-field-input) {
    @apply text-base;
}
</style>
