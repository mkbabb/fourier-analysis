<script setup lang="ts">
import type { GalleryEntry } from "@/lib/types";
import GalleryCard from "./GalleryCard.vue";
import { Crown } from "lucide-vue-next";

defineProps<{
    entries: GalleryEntry[];
    adminMode?: boolean;
    likedHashes?: Set<string>;
}>();

const emit = defineEmits<{
    "card-click": [entry: GalleryEntry];
    like: [hash: string];
    "set-tier": [hash: string, tier: "featured" | "saved" | "normal"];
    delete: [hash: string];
}>();
</script>

<template>
    <div v-if="entries.length > 0" class="featured-section">
        <div class="featured-header">
            <Crown :size="16" class="text-amber-400" />
            <span class="cm-serif text-sm font-semibold tracking-tight">Featured</span>
        </div>
        <div class="featured-scroll">
            <div
                v-for="entry in entries"
                :key="entry.snapshot_hash"
                class="featured-card-wrapper"
            >
                <GalleryCard
                    :entry="entry"
                    :admin-mode="adminMode"
                    :liked-hashes="likedHashes"
                    @click="emit('card-click', entry)"
                    @like="emit('like', $event)"
                    @set-tier="emit('set-tier', $event, $event)"
                    @delete="emit('delete', $event)"
                />
            </div>
        </div>
    </div>
</template>

<style scoped>
@reference "tailwindcss";

.featured-section {
    padding: 0 1rem;
}

.featured-header {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    margin-bottom: 0.5rem;
    padding-left: 0.25rem;
}

.featured-scroll {
    display: flex;
    gap: 1rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
    scrollbar-width: thin;
    scroll-snap-type: x mandatory;
    mask-image: linear-gradient(
        to right,
        transparent,
        black 0.5rem,
        black calc(100% - 0.5rem),
        transparent
    );
}

.featured-scroll::-webkit-scrollbar {
    height: 4px;
}

.featured-scroll::-webkit-scrollbar-thumb {
    background: hsl(var(--foreground) / 0.15);
    border-radius: 2px;
}

.featured-card-wrapper {
    flex-shrink: 0;
    width: 16rem;
    scroll-snap-align: start;
}
</style>
