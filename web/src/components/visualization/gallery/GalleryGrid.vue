<script setup lang="ts">
import { Button } from "@mkbabb/glass-ui";
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
            <Button
                variant="outline"
                size="icon"
                class="page-btn h-8 w-8"
                :disabled="page <= 1"
                @click="emit('page-change', page - 1)"
            >
                <ChevronLeft :size="16" />
            </Button>
            <span class="text-sm text-muted-foreground fira-code">
                {{ page }} / {{ pages }}
            </span>
            <Button
                variant="outline"
                size="icon"
                class="page-btn h-8 w-8"
                :disabled="page >= pages"
                @click="emit('page-change', page + 1)"
            >
                <ChevronRight :size="16" />
            </Button>
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
    border: 2.5px solid color-mix(in srgb, var(--foreground) 10%, transparent);
    border-top-color: color-mix(in srgb, var(--foreground) 50%, transparent);
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
</style>
