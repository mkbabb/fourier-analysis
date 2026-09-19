<script setup lang="ts">
import type { GalleryTier, Visualization } from "@/lib/types";
import { InfiniteScroll } from "@mkbabb/glass-ui/infinite-scroll";
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
    <div class="flex flex-col gap-2 px-4">
        <p class="text-xs text-muted-foreground">{{ entries.length }} loaded</p>
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
            <template #loading>
                <div class="flex justify-center py-4">
                    <div class="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                </div>
            </template>
            <template #end>
                <p v-if="entries.length" class="text-center text-xs text-muted-foreground py-4">No more entries</p>
            </template>
        </InfiniteScroll>
    </div>
</template>
