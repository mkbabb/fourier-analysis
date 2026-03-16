<script setup lang="ts">
import type { GalleryEntry } from "@/lib/types";
import GalleryCard from "./GalleryCard.vue";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";

const props = defineProps<{
    entries: GalleryEntry[];
    page: number;
    pages: number;
    total: number;
    loading: boolean;
    adminMode?: boolean;
    likedHashes?: Set<string>;
}>();

const emit = defineEmits<{
    "card-click": [entry: GalleryEntry];
    like: [hash: string];
    "set-tier": [hash: string, tier: "featured" | "saved" | "normal"];
    delete: [hash: string];
    "page-change": [page: number];
}>();
</script>

<template>
    <div class="relative min-h-48">
        <!-- Loading overlay -->
        <div v-if="loading" class="absolute inset-0 z-5 flex items-center justify-center bg-background/50 backdrop-blur-[2px] rounded-lg">
            <div class="loading-spinner" />
        </div>

        <!-- Grid -->
        <div v-if="entries.length > 0" class="gallery-grid">
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

        <!-- Empty state -->
        <div v-else-if="!loading" class="flex flex-col items-center justify-center py-12 px-4 gap-1">
            <p class="text-base font-medium text-muted-foreground">No entries found.</p>
            <p class="text-sm text-muted-foreground/70">Try adjusting your filters.</p>
        </div>

        <!-- Pagination -->
        <div v-if="pages > 1" class="flex items-center justify-center gap-3 py-4">
            <button
                class="page-btn flex items-center justify-center w-8 h-8 rounded-md border-[1.5px] border-foreground/12 bg-card text-foreground cursor-pointer transition-all duration-150 hover:not-disabled:border-foreground/25 hover:not-disabled:bg-foreground/5 disabled:opacity-30 disabled:cursor-not-allowed"
                :disabled="page <= 1"
                @click="emit('page-change', page - 1)"
            >
                <ChevronLeft :size="16" />
            </button>
            <span class="text-sm text-muted-foreground fira-code">
                {{ page }} / {{ pages }}
            </span>
            <button
                class="page-btn flex items-center justify-center w-8 h-8 rounded-md border-[1.5px] border-foreground/12 bg-card text-foreground cursor-pointer transition-all duration-150 hover:not-disabled:border-foreground/25 hover:not-disabled:bg-foreground/5 disabled:opacity-30 disabled:cursor-not-allowed"
                :disabled="page >= pages"
                @click="emit('page-change', page + 1)"
            >
                <ChevronRight :size="16" />
            </button>
            <span class="text-sm text-muted-foreground/50 ml-1">
                {{ total }} total
            </span>
        </div>
    </div>
</template>

<style scoped>
@reference "tailwindcss";

.gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
    gap: 1rem;
    padding: 0 1rem;
}

@media (min-width: 640px) {
    .gallery-grid {
        grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    }
}

@media (min-width: 1024px) {
    .gallery-grid {
        grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
    }
}

.loading-spinner {
    width: 2rem;
    height: 2rem;
    border: 2.5px solid hsl(var(--foreground) / 0.1);
    border-top-color: hsl(var(--foreground) / 0.5);
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
</style>
