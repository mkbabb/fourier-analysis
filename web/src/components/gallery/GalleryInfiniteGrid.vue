<script setup lang="ts">
import type { GalleryTier, Visualization } from "@/lib/types";
import { InfiniteScroll } from "@mkbabb/glass-ui/infinite-scroll";
import { Skeleton } from "@mkbabb/glass-ui";
import { Card } from "@mkbabb/glass-ui/card";
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
            <div class="gallery-grid grid gap-3" :data-admin="adminMode || undefined">
                <!-- LAST-TEN F-02: the FIRST page's placeholders are in the grid
                     itself, card-shaped, in the columns the cards will take
                     (they were a single centred 16rem column in the loader's
                     flex row, and the cards landed 557 px from them). The
                     cards replace them in place. -->
                <template v-if="loading && !entries.length">
                    <Card
                        v-for="i in 6"
                        :key="`placeholder-${i}`"
                        size="md"
                        surface="opaque"
                        class="gallery-card-placeholder"
                        aria-hidden="true"
                    >
                        <Skeleton class="aspect-[4/3] rounded-media" />
                        <Skeleton class="placeholder-line w-2/3" />
                        <Skeleton class="placeholder-line placeholder-line--meta w-1/2" />
                        <Skeleton class="placeholder-line placeholder-line--badges w-2/5" />
                        <Skeleton class="placeholder-line placeholder-line--meta w-1/3" />
                    </Card>
                </template>
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
                 loaded" / "No more entries" chatter is gone. LAST-TEN F-02:
                 the next page's row spans the grid's width (`w-full`; in the
                 loader's centring row it shrank to one column), and the first
                 page announces itself from the grid above. -->
            <template #loading>
                <div
                    v-if="entries.length"
                    class="gallery-grid grid w-full gap-3 pt-3"
                    role="status"
                    aria-label="Loading more visualizations"
                >
                    <Skeleton v-for="i in 3" :key="i" class="aspect-[4/3] rounded-card" />
                </div>
                <span v-else class="sr-only" role="status">Loading visualizations</span>
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
   X-DS fourier pass 5 · DS-F5-C6 (reverses pass 4's DS-F4-C4): auto-fill.
   The track count follows the field's width alone, so a card is one size
   whatever the result count (under auto-fit 4 results made 343 px cards,
   5 made 270 px, and typing in search re-sized them); a full row ends on
   the gutter the toolbar runs to. */
.gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
}
/* A first-page placeholder in the card's own measures (GalleryCard: the
   md pad and gap, the 4:3 media, then the title, meta, basis and stats
   rows). */
.gallery-card-placeholder {
    display: flex;
    flex-direction: column;
    gap: var(--card-gap);
    padding: var(--card-pad);
}
.placeholder-line {
    block-size: 1.3rem;
    border-radius: var(--radius-floor, 0.25rem);
}
.placeholder-line--meta {
    block-size: 1.2rem;
}
.placeholder-line--badges {
    block-size: 1.375rem;
}
@container (width < 30rem) {
    .gallery-grid:not([data-admin]) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}
</style>
