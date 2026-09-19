<script setup lang="ts">
import type { Visualization } from "@/lib/types";
import GalleryCard from "./GalleryCard.vue";
import { Crown } from "@lucide/vue";

defineProps<{
    entries: Visualization[];
    adminMode?: boolean;
    likedHashes?: Set<string>;
    selectedHashes?: Set<string>;
}>();

const emit = defineEmits<{
    "card-click": [entry: Visualization];
    like: [hash: string];
    "set-tier": [hash: string, tier: "featured" | "saved" | "normal"];
    delete: [hash: string];
    "toggle-select": [hash: string, checked: boolean];
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
                :key="entry.slug"
                class="featured-card-wrapper"
            >
                <!-- FR-GFC-2 ⊕ FR-GFC-23: the card declares `selected` and
                     emits `toggle-select`, the grid host binds both, and THIS
                     host — the other live mount of the same card — bound
                     neither. In admin mode the featured row therefore rendered
                     its checkboxes permanently unchecked and dropped every click
                     on the floor: a selection made there could not join the batch,
                     and a card selected in the grid then appeared UNSELECTED in
                     the carousel above it. Asserted from the props table, not
                     assumed: `selected` is optional with no default, so the
                     unbound prop is `undefined` and the card's `?? false` is what
                     produced the null-target square. -->
                <GalleryCard
                    :entry="entry"
                    :admin-mode="adminMode"
                    :liked-hashes="likedHashes"
                    :selected="selectedHashes?.has(entry.slug) ?? false"
                    @click="emit('card-click', entry)"
                    @like="emit('like', $event)"
                    @set-tier="(h, t) => emit('set-tier', h, t)"
                    @delete="emit('delete', $event)"
                    @toggle-select="(hash, checked) => emit('toggle-select', hash, checked)"
                />
            </div>
        </div>
    </div>
</template>

<style scoped>
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
    background: color-mix(in srgb, var(--foreground) 15%, transparent);
    border-radius: 2px;
}

.featured-card-wrapper {
    flex-shrink: 0;
    width: 16rem;
    scroll-snap-align: start;
}
</style>
