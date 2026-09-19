<script setup lang="ts">
import { ref, computed } from "vue";
import { Search, X, SlidersHorizontal } from "@lucide/vue";
import { basisDisplay } from "../lib/basis-display";
import type { GallerySort, GalleryTierFilter } from "@/lib/types";
import { Button } from "@mkbabb/glass-ui/button";
import { Separator } from "@mkbabb/glass-ui/separator";
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

const basisOptions = computed(() =>
    Object.entries(basisDisplay).map(([key, cfg]) => ({
        key,
        icon: cfg.icon,
        label: cfg.label,
        color: cfg.color,
    })),
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
            <Search class="text-muted-foreground shrink-0" :size="16" aria-hidden="true" />
            <label class="sr-only" for="gallery-search-input">Search gallery by slug</label>
            <input
                id="gallery-search-input"
                type="search"
                :value="searchQuery"
                placeholder="Search by slug..."
                autocapitalize="none"
                autocorrect="off"
                spellcheck="false"
                enterkeyhint="search"
                class="search-input fira-code flex-1 min-w-0 bg-transparent border-none text-foreground text-sm outline-none"
                @input="searchQuery = ($event.target as HTMLInputElement).value.trimStart()"
            />
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
            <!-- FR-GSB-30 — the hand-rolled rule measured 1.22:1 / 1.26:1: a
                 divider nobody could see. `./separator` ships at the adopted pin
                 with the producer's own border register, so this is an ADOPTION,
                 not a contrast nudge — there is no local number left to drift. -->
            <Separator orientation="vertical" decorative class="h-5 shrink-0" />
            <Button
                emphasis="quiet"
                size="xs"
                icon-only
                class="filter-toggle rounded-full shrink-0 text-muted-foreground"
                :aria-pressed="showFilters || hasActiveFilters"
                :aria-expanded="showFilters"
                aria-controls="gallery-filter-drawer"
                aria-label="Filters and sorting"
                @click.stop="showFilters = !showFilters"
            >
                <SlidersHorizontal :size="15" aria-hidden="true" />
            </Button>
        </div>

        <!-- Filter drawer (overlaid, does not affect flow) -->
        <Transition name="filter-drawer">
            <div v-if="showFilters" id="gallery-filter-drawer" class="filter-anchor">
                <div class="filter-panel glass-resting">
                    <div class="flex items-center gap-2">
                        <Select
                            :model-value="tierFilter"
                            @update:model-value="tierFilter = $event as GalleryTierFilter"
                        >
                            <SelectTrigger
                                class="w-full h-8 text-sm border border-foreground/12 rounded-lg"
                                aria-label="Filter by tier"
                            >
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
                            <SelectTrigger
                                class="w-full h-8 text-sm border border-foreground/12 rounded-lg"
                                aria-label="Sort order"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Newest</SelectItem>
                                <SelectItem value="views">Most Viewed</SelectItem>
                                <SelectItem value="likes">Most Liked</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div class="flex gap-1 flex-wrap">
                        <Button
                            v-for="b in basisOptions"
                            :key="b.key"
                            emphasis="secondary"
                            size="sm"
                            class="basis-pill-btn rounded-full font-medium"
                            :aria-pressed="basisFilter === b.key"
                            :style="{ '--pill-c': b.color }"
                            @click="basisFilter = basisFilter === b.key ? '' : b.key"
                        >
                            <span class="cm-serif font-semibold text-[1.1em]">{{ b.icon }}</span>
                            {{ b.label }}
                        </Button>
                    </div>
                </div>
            </div>
        </Transition>
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

.search-pill {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    max-width: var(--search-measure);
    padding: 0.375rem 0.75rem;
    border-radius: 0.5rem;
    background: color-mix(in srgb, var(--muted) 50%, transparent);
    border: 1px solid color-mix(in srgb, var(--border) 35%, transparent);
}

/* FR-GSB-30 ⊕ FR-GSB-12 — ONE placeholder authority.
   A `placeholder:text-muted-foreground/50` utility sat on the input's class
   list AND this rule sat here unlayered, so the utility was dead code that
   read as the live one. The utility is deleted in the same hunk that keeps
   this rule, because leaving either half alone leaves two authorities
   standing — which is the whole of what the row books. */
.search-input::placeholder {
    color: color-mix(in srgb, var(--muted-foreground) 50%, transparent);
}

/* X.F.W3 `.e` — the published active-state vocabulary, applied (`FR-COB-3`).
   The control already SET `aria-pressed` and then painted from a parallel
   `.is-active` class, so the announcement and the paint were two channels for
   one state and either could be changed without the other. The class binding
   is deleted and the rule keys on the attribute — which is also what makes the
   state visible under `forced-colors`, where the producer's arms read ARIA and
   nothing else. The sibling rule twenty lines below has always done this. */
.filter-toggle[aria-pressed="true"] {
    color: var(--foreground);
    background: color-mix(in srgb, var(--foreground) 8%, transparent);
}

/* Filter drawer — absolutely positioned overlay */
.filter-anchor {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: var(--z-bar);
    width: 100%;
    max-width: var(--search-measure);
    padding-top: 0.5rem;
}

.filter-panel {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem;
    border-radius: 0.75rem;
    box-shadow: 0 8px 24px color-mix(in srgb, var(--foreground) 8%, transparent);
}

/* Filter drawer transition (A.W3.d — named properties + canonical tokens) */
.filter-drawer-enter-active {
    transition:
        opacity 0.3s var(--ease-apple-spring),
        transform 0.3s var(--ease-apple-spring);
}
.filter-drawer-leave-active {
    transition:
        opacity 0.2s var(--ease-standard),
        transform 0.2s var(--ease-standard);
}
.filter-drawer-enter-from {
    opacity: 0;
    transform: translateY(-8px) scale(0.97);
}
.filter-drawer-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}

/* `<Button variant="outline" size="sm">` ships the focus-ring + press-scale +
   rounded-pill chassis; the `.basis-pill-btn` hook projects the per-instance
   `--pill-c` colour onto border + tint + text, matching BasisSelector's
   `.basis-toggle` recipe. */
.basis-pill-btn {
    @apply gap-0.5 px-2;
    color: var(--muted-foreground);
}
.basis-pill-btn:hover {
    border-color: color-mix(in srgb, var(--pill-c) 40%, transparent);
    color: var(--pill-c);
    background: transparent;
}
.basis-pill-btn[aria-pressed="true"] {
    background: color-mix(in srgb, var(--pill-c) 12%, transparent);
    border-color: color-mix(in srgb, var(--pill-c) 30%, transparent);
    color: var(--pill-c);
}
</style>
