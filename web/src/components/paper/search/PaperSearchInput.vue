<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { Search, X, Maximize2, Minimize2 } from "@lucide/vue";
import type { PaperSearchState } from "./usePaperSearch";

const props = defineProps<{
    search: PaperSearchState;
    variant: "sidebar" | "floating";
    canExpand: boolean;
}>();

const emit = defineEmits<{
    expand: [];
}>();

const inputRef = ref<HTMLInputElement | null>(null);

// Auto-focus input when opened
watch(
    () => props.search.isOpen.value,
    (open) => {
        if (open) nextTick(() => inputRef.value?.focus());
    },
);

function focus() {
    inputRef.value?.focus();
}

defineExpose({ focus });
</script>

<template>
    <!-- X·F F.W3 `.c` — `MISS-DU4`: the field's chrome was pointer-dead. The
         24px glyph is the largest mark in the field and all of the wrap's
         padding is hit area, and none of it did anything — while the `focus()`
         this component already exposes was exactly what a click on it should
         run. A wrapping `<label>` is the whole cure and it is free: the
         `<input>` is its only labelable descendant, so the association is
         implicit, and label activation is NOT forwarded when the click lands on
         an interactive descendant, so the two action Buttons keep their own
         behaviour. The accessible NAME stays the input's `aria-label` (`C-7`'s
         naming half, already landed) — this label carries no text and is not
         competing for it. -->
    <label class="paper-search-input-wrap" :class="`paper-search-input-wrap--${variant}`">
        <Search class="paper-search-icon" />
        <!-- `★MF-2`: the inline arm is the same combobox as the palette's and
             had the same nothing — a placeholder standing in for a name, no
             `role`, and arrows that moved a selection no reader could observe. -->
        <input
            ref="inputRef"
            type="text"
            class="paper-search-input"
            placeholder="Search paper..."
            aria-label="Search the paper"
            role="combobox"
            aria-autocomplete="list"
            :aria-expanded="search.isOpen.value && search.results.value.length > 0"
            :aria-controls="search.listboxId"
            :aria-activedescendant="
                search.isOpen.value && search.results.value.length > 0
                    ? search.optionId(search.selectedIndex.value)
                    : undefined
            "
            :value="search.query.value"
            @input="search.query.value = ($event.target as HTMLInputElement).value"
            @keydown="search.onKeydown"
            @focus="search.isOpen.value = true"
        />
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
        <Button
            v-if="canExpand"
            emphasis="quiet"
            size="xs" icon-only
            type="button"
            class="paper-search-action-btn"
            @click="emit('expand')"
            :aria-label="search.isExpanded.value ? 'Collapse the search palette' : 'Expand the search palette'"
        >
            <Maximize2 v-if="!search.isExpanded.value" class="h-3 w-3" />
            <Minimize2 v-else class="h-3 w-3" />
        </Button>
        <Button
            v-if="search.query.value"
            emphasis="quiet"
            size="xs" icon-only
            type="button"
            class="paper-search-action-btn"
            @click="search.close()"
            aria-label="Clear search"
        >
            <X class="h-3 w-3" />
        </Button>
    </label>
</template>

<style scoped>
@reference "tailwindcss";
/* X·F F.W4 `.e` — `PSM-1` (= PV `D/B-1` = `C-01b`): THESE RULES NOW REACH THE
   ELEMENTS THEY NAME. They were authored in `PaperSearch.vue`'s single scoped
   block, where the parent's scope id reaches this component's ROOT and nothing
   below it — so every rule below the wrap was orphaned and the search chrome
   shipped unstyled. Colocation in the owning SFC is the cure (E-2 KISS: no new
   layer, no `:deep`, no global escape). */
.paper-search-input-wrap {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    /* `MISS-DU1` — THE FIELD'S HEIGHT STOPS BEING A FUNCTION OF WHICH OPTIONAL
       CHILDREN ARE MOUNTED. It used to be derived: `align-items: center` over
       0.3rem block padding and a 1.5px border, so the box was as tall as its
       tallest child and the first keystroke mounted a 40px one. A field IS a
       control, so it takes the design system's own control rung and keeps it
       empty or full. Both arms of the arithmetic, at the compiled tokens:
       fine  → 40px box − 3px border = 37px content ≥ 28px (`xs` button);
       coarse→ 60px box − 3px border = 57px content ≥ 44px (`xs` clamped to
       `--control-floor` = `--touch-target`). Nothing can grow it. */
    block-size: var(--control-h-md);
    box-sizing: border-box;
    border: 1.5px solid var(--border);
    border-radius: calc(var(--radius) - 2px);
    background: var(--background);
    padding: 0 0.5rem;
    /* `MISS-DU4`: the wrap is a `<label>` now, so it is hit area for the field
       it labels — and it says so. */
    cursor: text;
    transition: border-color 0.15s var(--ease-standard);
}

/* `PSM-13`'s class, one file over: the input declares `outline: none`, and the
   app's focus-ring allowlist (`style.css`) names four classes, none of them
   this one. The wrap carries the ring for the control inside it — landing WITH
   the colocation that makes the `outline: none` live, never after. */
.paper-search-input-wrap:focus-within {
    border-color: var(--focus-ring-color);
    outline: var(--focus-ring-width) solid var(--focus-ring-color);
    outline-offset: 2px;
}

.paper-search-icon {
    width: 0.8rem;
    height: 0.8rem;
    flex-shrink: 0;
    /* `PSM-4`: the authored `color-mix(…, transparent)` dilutions composited to
       1.74–2.04:1 against the plate. Full-strength is 5.197:1 light /
       7.716:1 dark (this seat's re-derivation, cross-checked against the
       `G-F4-CONTRAST-FLOOR` harness's own reading of the diluted pairs). */
    color: var(--muted-foreground);
}

.paper-search-input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    /* `PV ★MF-5` / `SP-14`: 0.78rem is ~12.5px, and iOS Safari zooms any input
       under 16px on focus. The substrate's `.ios` guard never fires here —
       fourier sets no `.ios` class anywhere — so the floor is declared at the
       control, where no class bookkeeping can lose it. Desktop keeps the small
       register through the `lg` arm below. */
    font-size: max(1rem, 0.78rem);
    color: var(--foreground);
    font-family: inherit;
}

@media (min-width: 1024px) and (pointer: fine) {
    .paper-search-input {
        font-size: 0.78rem;
    }
}

.paper-search-input::placeholder {
    color: var(--muted-foreground);
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
    border-radius: 3px;
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
   receives. */
.paper-search-input-wrap--floating {
    border: none;
    border-radius: 0;
    background: transparent;
    padding: 0;
    /* The bar supplies its own padding; the field keeps the control rung so the
       search arm of `.floating-toc-bar` is exactly as tall as its trigger arm,
       which is a `md` Button. Before `MISS-DU1` the bar itself jumped between
       the two states. */
}

.paper-search-input-wrap--floating .paper-search-input {
    @apply text-base;
}
</style>
