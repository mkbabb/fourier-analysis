<script setup lang="ts">
import type { GalleryTier, Visualization } from "@/lib/types";
import { InfiniteScroll } from "@mkbabb/glass-ui/infinite-scroll";
import { Skeleton } from "@mkbabb/glass-ui";
import GalleryCard from "./GalleryCard.vue";

defineProps<{
    entries: Visualization[];
    loading: boolean;
    hasMore: boolean;
    adminMode: boolean;
    likedHashes: Set<string>;
    selectedHashes?: Set<string>;
}>();

/**
 * X.F.W3 `.e` / `fr-GalleryCardModal GCM-47` ⊕ `GCM-39` — the union is
 * imported, and the relayed payload is named for what the card sends: a slug.
 */
const emit = defineEmits<{
    "load-more": [];
    "card-click": [entry: Visualization];
    like: [slug: string];
    "set-tier": [slug: string, tier: GalleryTier];
    delete: [slug: string];
    "toggle-select": [slug: string, checked: boolean];
}>();
</script>

<template>
    <div class="gallery-grid-host flex flex-col gap-2 px-[var(--page-gutter)]">
        <InfiniteScroll :has-more="hasMore" :is-loading="loading" @load-more="emit('load-more')">
            <div
                class="gallery-grid grid gap-3"
                :data-admin="adminMode || undefined"
                :style="{ '--gallery-count': entries.length }"
            >
                <GalleryCard
                    v-for="entry in entries"
                    :key="entry.slug"
                    :entry="entry"
                    :admin-mode="adminMode"
                    :liked-hashes="likedHashes"
                    :selected="selectedHashes?.has(entry.slug) ?? false"
                    @click="emit('card-click', entry)"
                    @like="emit('like', $event)"
                    @set-tier="(slug, tier) => emit('set-tier', slug, tier)"
                    @delete="emit('delete', $event)"
                    @toggle-select="(slug, checked) => emit('toggle-select', slug, checked)"
                />
            </div>
            <!-- X.F.W14U.gallery — UIA-F-184 ⊕ UIA-F-247: loading is glass
                 Skeleton cards in the grid's own measure (the hand-rolled
                 transparent-topped ring is retired, F-71's carry), and the "N
                 loaded" / "No more entries" chatter is gone. -->
            <template #loading>
                <div
                    class="gallery-grid grid gap-3 pt-3"
                    role="status"
                    aria-label="Loading visualizations"
                >
                    <Skeleton v-for="i in 3" :key="i" class="aspect-[4/3] rounded-card" />
                </div>
            </template>
        </InfiniteScroll>
    </div>
</template>

<style scoped>
/* X.F.W14V.au4 — A2-FO-L3-4: the grid's measure, named once (it was spelled
   twice, inline). `minmax(14rem, 1fr)` cannot fit two columns in a 358 px
   phone column, so auto-fill fell to one card per row (358×390, about 1.5
   pieces a screen). Below 30rem of its own width the grid is two equal
   columns, and the card takes its compact arm (GalleryCard.vue). Admin mode
   keeps one column: a card's select box, its three-state tier control and its
   Delete need 44 px touch targets each, which a 171 px card cannot seat. */
.gallery-grid-host {
    container-type: inline-size;
}
/* X-DS DS-F5-C8: the track floor fits a four-word slug and its date
   (16rem); at 14rem a 1408 px field made six tracks, so a short result set
   left empty tracks and cut the slugs.
   X-DS pass 4 · DS-F4-C4: auto-fit, so a short set collapses its empty
   tracks and the cards run to the gutter the toolbar runs to (auto-fill left
   a dead third of the row under the search). A long gallery is unchanged:
   the two are the same once the items fill the row. The grid's measure is
   capped at 24rem a card for the set it holds, so one or two results stay
   card-sized instead of stretching across the row. */
.gallery-grid {
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
    max-inline-size: calc(var(--gallery-count) * 24rem + (var(--gallery-count) - 1) * 0.75rem);
}
@container (width < 30rem) {
    .gallery-grid:not([data-admin]) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}
</style>
