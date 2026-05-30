<script setup lang="ts">
import type { Visualization } from "@/lib/types";
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

const emit = defineEmits<{
    "load-more": [];
    "card-click": [entry: Visualization];
    like: [hash: string];
    "set-tier": [hash: string, tier: "featured" | "saved" | "normal"];
    delete: [hash: string];
    "toggle-select": [hash: string, checked: boolean];
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
                    @set-tier="(hash, tier) => emit('set-tier', hash, tier)"
                    @delete="emit('delete', $event)"
                    @toggle-select="(hash, checked) => emit('toggle-select', hash, checked)"
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
