<script setup lang="ts">
import { ref, computed } from "vue";
import { Search, X, SlidersHorizontal } from "@lucide/vue";
import { basisChips } from "../lib/basis-display";
import type { BasisKey } from "@/lib/basis";
import type { GallerySort, GalleryTierFilter } from "@/lib/types";
import { Button } from "@mkbabb/glass-ui/button";
import { Input } from "@mkbabb/glass-ui/input";
import { Separator } from "@mkbabb/glass-ui/separator";
import { Popover, PopoverTrigger, PopoverContent } from "@mkbabb/glass-ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@mkbabb/glass-ui/toggle-group";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@mkbabb/glass-ui/select";

/**
 * X.F.W3 `.e` / `fr-GalleryCardModal GCM-47` ⊕ `fr-GallerySearchBar FR-GSB-30`.
 *
 * Four hand-written prop/emit pairs collapse into four `defineModel`s — the
 * external contract is UNCHANGED (`v-model:x` and the `update:x` events it
 * compiles to are exactly what the host already binds), so no call site moves
 * and thirteen lines leave this file.
 *
 * The two unions stop being re-declared. `tierFilter` was a HAND-WIDENED copy
 * of the closed `GalleryTier` union, which is the direction a closed union
 * stops being closed in, so the widening is named once in `lib/types.ts` and
 * imported here.
 */
const searchQuery = defineModel<string>("searchQuery", { required: true });
const sort = defineModel<GallerySort>("sort", { required: true });
const tierFilter = defineModel<GalleryTierFilter>("tierFilter", { required: true });
const basisFilter = defineModel<string>("basisFilter", { required: true });

const showFilters = ref(false);

/**
 * X.F.W14U.gallery — UIA-F-187 ⊕ UIA-F-39: ONE basis vocabulary. The filter
 * offered three FAMILY pills ("Fourier") while the cards named the MODE
 * ("Epicycles") for the same ∮ basis, and a family key matches no
 * `active_bases` entry on the server. The options are now the four keys
 * `active_bases` stores, labelled by the card's own chip builder.
 */
const BASIS_KEYS: BasisKey[] = ["fourier-epicycles", "fourier-series", "chebyshev", "legendre"];
const basisOptions = computed(() =>
    BASIS_KEYS.flatMap((key) => basisChips([key]).map((chip) => ({ key, ...chip }))),
);

/**
 * `FR-GSB-30` — the predicate now answers the question its name asks.
 *
 * It folded `sort !== "newest"` into something called "filters" (a sort order
 * filters nothing) and omitted `searchQuery` (which filters more than anything
 * else on the bar). Both are corrected: sort leaves, the query joins, and the
 * query is compared TRIMMED because that is what the bar emits.
 */
const hasActiveFilters = computed(
    () =>
        tierFilter.value !== "all" ||
        basisFilter.value !== "" ||
        searchQuery.value.trim() !== "",
);
</script>

<template>
    <!-- FR-GSB-30 — the bar had no landmark at all: `role="search"` is what
         makes it reachable by landmark navigation, and the label is what tells
         a second search on the page apart from this one. -->
    <div class="search-bar-root" role="search" aria-label="Gallery search and filters">
        <div class="search-pill">
            <!-- FR-GSB-11: FIVE controls on this bar had no accessible name, not
                 the three every axis enumerated. The input was named by
                 `placeholder` alone — a name that vanishes on the first keystroke.
                 The clear and filter buttons are icon-only, and lucide spreads
                 `aria-hidden` onto every glyph by default, so neither Button had
                 anything left to synthesise a name from: axe reads them as
                 `button-name` CRITICAL. Both `<SelectTrigger>`s fall to their
                 SELECTED VALUE ("Newest, combobox, collapsed" — nothing in that
                 utterance says it sorts), because reka renders `role="combobox"`
                 with no name and auto-hides the chevron.
                 The filter toggle also carries `aria-expanded`/`aria-controls`: it
                 is a disclosure, and `aria-pressed` alone described a state the
                 drawer's existence, not the button's, actually holds. -->
            <label class="sr-only" for="gallery-search-input">Search gallery</label>
            <Input
                id="gallery-search-input"
                type="search"
                :model-value="searchQuery"
                placeholder="Search titles and tags…"
                autocapitalize="none"
                autocorrect="off"
                spellcheck="false"
                enterkeyhint="search"
                class="search-input"
                @input="searchQuery = ($event.target as HTMLInputElement).value.trimStart()"
            />
            <!-- X.F.W11 `.e` — the glyph follows the field in tree order: the
                 producer's field is its own stacking context (glass backdrop),
                 so a positioned glyph BEFORE it is painted under it. -->
            <Search class="search-icon text-muted-foreground shrink-0" :size="16" aria-hidden="true" />
            <span class="search-actions">
                <!-- UIA-F-184: ONE clear control — this one; the engine's own
                     `type=search` cancel glyph is withdrawn in the style block. -->
                <Button
                    v-if="searchQuery"
                    emphasis="quiet"
                    size="xs"
                    icon-only
                    class="rounded-full text-muted-foreground"
                    aria-label="Clear search"
                    @click="searchQuery = ''"
                >
                    <X :size="14" aria-hidden="true" />
                </Button>
                <Separator orientation="vertical" decorative class="h-5 shrink-0" />
                <!-- X.F.W14U.gallery — UIA-F-97: the filter drawer is glass
                     Popover (modal): Escape and an outside press dismiss it,
                     focus returns to this trigger, and the outside press is
                     taken by the dismissal — on touch it used to fall through
                     and open the card underneath. The trigger's disclosure
                     state (`aria-expanded`, `aria-controls`) is the Popover's.
                     UIA-F-185: the panel is PopoverContent's plate, and the
                     Selects wear the producer's own sizing. -->
                <Popover v-model:open="showFilters" modal>
                    <PopoverTrigger as-child>
                        <Button
                            emphasis="quiet"
                            size="xs"
                            icon-only
                            class="filter-toggle rounded-full shrink-0 text-muted-foreground"
                            :data-active="hasActiveFilters || undefined"
                            aria-label="Filters and sorting"
                        >
                            <SlidersHorizontal :size="15" aria-hidden="true" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" :side-offset="8" aria-label="Filters and sorting">
                        <div id="gallery-filter-drawer" class="filter-panel">
                            <div class="filter-row">
                                <Select
                                    :model-value="tierFilter"
                                    @update:model-value="tierFilter = $event as GalleryTierFilter"
                                >
                                    <SelectTrigger class="w-full" aria-label="Filter by tier">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All tiers</SelectItem>
                                        <SelectItem value="featured">Featured</SelectItem>
                                        <SelectItem value="saved">Saved</SelectItem>
                                        <SelectItem value="normal">Normal</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select
                                    :model-value="sort"
                                    @update:model-value="sort = $event as GallerySort"
                                >
                                    <SelectTrigger class="w-full" aria-label="Sort order">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="newest">Newest</SelectItem>
                                        <SelectItem value="views">Most Viewed</SelectItem>
                                        <SelectItem value="likes">Most Liked</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <!-- One basis at a time (the server narrows by one
                                 `active_bases` key); pressing the pressed item
                                 clears it. -->
                            <ToggleGroup
                                type="single"
                                size="sm"
                                aria-label="Filter by basis"
                                class="flex-wrap"
                                :model-value="basisFilter"
                                @update:model-value="basisFilter = typeof $event === 'string' ? $event : ''"
                            >
                                <ToggleGroupItem
                                    v-for="b in basisOptions"
                                    :key="b.key"
                                    :value="b.key"
                                    class="basis-chip"
                                    :style="{ '--basis-hue': b.color }"
                                >
                                    <span class="font-serif-math font-semibold" aria-hidden="true">{{ b.icon }}</span>
                                    {{ b.label }}
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                    </PopoverContent>
                </Popover>
            </span>
        </div>
    </div>
</template>

<style scoped>
@reference "tailwindcss";

/* FR-GSB-30 — ONE measure, named once.
   `32rem` was authored twice with no shared property, on the pill and on the
   drawer that must line up with it, so the two could drift apart silently.
   `justify-content: flex-start` is DELETED on corrected grounds (K-10): it is
   live whenever the root exceeds 32rem and dead only because `normal` already
   behaves as `flex-start` for a flex container — so it was restating the
   initial value, not holding a layout. */
.search-bar-root {
    --search-measure: 32rem;
    position: relative;
    display: flex;
}

/* X.F.W11 `.e` — R-d-1 (COHESION §0aq, ESC-F11d-1): THE PILL IS THE
   PRODUCER'S `Input`. `.search-pill` painted a whole field — its own muted
   fill, a 35% border and `--radius-field` — around a chromeless `<input>`
   (`bg-transparent border-none outline-none`), which is exactly the surface
   `@mkbabb/glass-ui/input` ships. Spec `.a`: "where a component is one that
   glass-ui ships (input …), the local styling yields to the producer's
   surface". The `field-control` now owns boundary, fill, pill radius and the
   `:focus-visible` ring (the input's `outline-none` had left the bar with no
   focus paint at all), and `.search-pill` is layout only: a positioning
   context that seats the glyph and the actions INSIDE the producer's field.
   The measure is still named once (`--search-measure`, FR-GSB-30). */
.search-pill {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    max-width: var(--search-measure);
}

.search-icon {
    position: absolute;
    inset-inline-start: 0.75rem;
    pointer-events: none;
}

/* Layout, not chrome: the inline padding clears the glyph at the start and
   reserves the actions' run at the end — two `xs` rungs (`--control-h-xs`,
   the producer's token, floored on coarse pointers) plus the separator. */
.search-input {
    flex: 1;
    min-width: 0;
    padding-inline-start: 2.25rem;
    padding-inline-end: calc(2 * var(--control-h-xs) + 1.25rem);
}

.search-actions {
    position: absolute;
    inset-inline-end: 0.375rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

/* FR-GSB-30 ⊕ FR-GSB-12 — ONE placeholder authority, and it is now the
   producer's (`.field-control::placeholder` → `--muted-foreground`). The
   local 50% dilution retires with the rest of the field chrome, as
   `FunctionInput`'s bespoke placeholder mute did (measured there at 2.02:1). */

/* UIA-F-184: one clear control. The engine paints its own cancel glyph on a
   `type=search` field beside the Clear button; it is withdrawn here, on the
   one field this bar owns. */
.search-input::-webkit-search-cancel-button {
    appearance: none;
}

/* The filter trigger shows that filters are narrowing the grid; its
   disclosure state is the Popover's own `aria-expanded`. */
.filter-toggle[data-active] {
    color: var(--foreground);
    background: color-mix(in srgb, var(--foreground) 8%, transparent);
}

/* The panel is PopoverContent's plate (UIA-F-185); this is its layout. */
.filter-panel {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 20rem;
    max-width: 100%;
}
.filter-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
}

/* The pressed basis wears its own hue (addendum (g), the c1 recipe on glass's
   published ToggleGroupItem via its class prop). */
.basis-chip[data-state="on"] {
    background-color: color-mix(in srgb, var(--basis-hue) 12%, transparent);
    color: color-mix(in oklab, var(--basis-hue) 75%, var(--foreground));
}
</style>
