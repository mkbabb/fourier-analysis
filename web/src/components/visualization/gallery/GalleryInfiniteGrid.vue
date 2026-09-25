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
    <div class="flex flex-col gap-2 px-[var(--page-gutter)]">
        <InfiniteScroll :has-more="hasMore" :is-loading="loading" @load-more="emit('load-more')">
            <div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr))">
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
                    class="grid gap-3 pt-3"
                    style="grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr))"
                    role="status"
                    aria-label="Loading visualizations"
                >
                    <Skeleton v-for="i in 3" :key="i" class="aspect-[4/3] rounded-card" />
                </div>
            </template>
        </InfiniteScroll>
    </div>
</template>
