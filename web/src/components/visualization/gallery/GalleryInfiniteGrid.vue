<script setup lang="ts">
import type { GalleryEntry } from "@/lib/types";
import { InfiniteScroll } from "@mkbabb/glass-ui/infinite-scroll";
import GalleryCard from "./GalleryCard.vue";

const props = defineProps<{
    entries: GalleryEntry[];
    loading: boolean;
    hasMore: boolean;
    adminMode: boolean;
    likedHashes: Set<string>;
    total: number;
}>();

const emit = defineEmits<{
    "load-more": [];
    "card-click": [entry: GalleryEntry];
    like: [hash: string];
    "set-tier": [hash: string, tier: "featured" | "saved" | "normal"];
    delete: [hash: string];
}>();
</script>

<template>
    <div class="flex flex-col gap-2 px-4">
        <p class="text-xs text-muted-foreground">{{ total }} total</p>
        <InfiniteScroll :has-more="hasMore" :is-loading="loading" @load-more="emit('load-more')">
            <div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr))">
                <GalleryCard
                    v-for="entry in entries"
                    :key="entry.snapshot_hash"
                    :entry="entry"
                    :admin-mode="adminMode"
                    :liked-hashes="likedHashes"
                    @click="emit('card-click', entry)"
                    @like="emit('like', $event)"
                    @set-tier="(hash, tier) => emit('set-tier', hash, tier)"
                    @delete="emit('delete', $event)"
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
