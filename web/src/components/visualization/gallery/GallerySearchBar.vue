<script setup lang="ts">
import { ref, computed } from "vue";
import { Search, X, SlidersHorizontal } from "lucide-vue-next";
import { basisDisplay } from "../lib/basis-display";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";

const props = defineProps<{
    searchQuery: string;
    sort: "newest" | "views" | "likes";
    tierFilter: "all" | "featured" | "saved" | "normal";
    basisFilter: string;
}>();

const emit = defineEmits<{
    "update:searchQuery": [value: string];
    "update:sort": [value: "newest" | "views" | "likes"];
    "update:tierFilter": [value: "all" | "featured" | "saved" | "normal"];
    "update:basisFilter": [value: string];
}>();

const showFilters = ref(false);

const basisOptions = computed(() =>
    Object.entries(basisDisplay).map(([key, cfg]) => ({
        key,
        icon: cfg.icon,
        label: cfg.label,
        color: cfg.color,
    })),
);

const hasActiveFilters = computed(() =>
    props.tierFilter !== "all" || props.sort !== "newest" || props.basisFilter !== "",
);
</script>

<template>
    <div class="search-bar-root">
        <div class="search-pill">
            <Search class="text-muted-foreground shrink-0" :size="16" />
            <input
                type="text"
                :value="searchQuery"
                placeholder="Search by slug..."
                class="search-input fira-code flex-1 min-w-0 bg-transparent border-none text-foreground text-sm outline-none placeholder:text-muted-foreground/50"
                @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
            />
            <button
                v-if="searchQuery"
                class="flex items-center justify-center w-6 h-6 border-none bg-transparent text-muted-foreground cursor-pointer rounded-full transition-all duration-150 hover:text-foreground hover:bg-foreground/6"
                @click="emit('update:searchQuery', '')"
            >
                <X :size="14" />
            </button>
            <div class="w-px h-5 bg-foreground/10 shrink-0" />
            <button
                class="filter-toggle flex items-center justify-center w-7 h-7 rounded-full border-none bg-transparent text-muted-foreground cursor-pointer transition-all duration-150 hover:text-foreground hover:bg-foreground/6 shrink-0"
                :class="{ 'is-active': showFilters || hasActiveFilters }"
                @click.stop="showFilters = !showFilters"
            >
                <SlidersHorizontal :size="15" />
            </button>
        </div>

        <!-- Filter drawer (overlaid, does not affect flow) -->
        <Transition name="filter-drawer">
            <div v-if="showFilters" class="filter-anchor">
                <div class="filter-panel">
                    <div class="flex items-center gap-2">
                        <Select
                            :model-value="tierFilter"
                            @update:model-value="emit('update:tierFilter', $event as any)"
                        >
                            <SelectTrigger class="w-full h-8 text-sm border border-foreground/12 rounded-lg">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All tiers</SelectItem>
                                <SelectItem value="featured">Featured</SelectItem>
                                <SelectItem value="saved">Saved</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            :model-value="sort"
                            @update:model-value="emit('update:sort', $event as any)"
                        >
                            <SelectTrigger class="w-full h-8 text-sm border border-foreground/12 rounded-lg">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Newest</SelectItem>
                                <SelectItem value="views">Most Viewed</SelectItem>
                                <SelectItem value="likes">Most Liked</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div class="flex gap-1 flex-wrap">
                        <button
                            v-for="b in basisOptions"
                            :key="b.key"
                            class="basis-pill-btn inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-sm font-medium bg-transparent border border-foreground/12 text-muted-foreground cursor-pointer transition-all duration-150"
                            :class="{ active: basisFilter === b.key }"
                            :style="{ '--pill-c': b.color }"
                            @click="emit('update:basisFilter', basisFilter === b.key ? '' : b.key)"
                        >
                            <span class="cm-serif font-semibold text-[1.1em]">{{ b.icon }}</span>
                            {{ b.label }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
@reference "tailwindcss";

.search-bar-root {
    position: relative;
    display: flex;
    justify-content: flex-start;
}

.search-pill {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    max-width: 32rem;
    padding: 0.375rem 0.75rem;
    border-radius: 0.5rem;
    background: hsl(var(--muted) / 0.5);
    border: 1px solid hsl(var(--border) / 0.35);
}

.search-input::placeholder {
    color: hsl(var(--muted-foreground) / 0.5);
}

.filter-toggle.is-active {
    color: hsl(var(--foreground));
    background: hsl(var(--foreground) / 0.08);
}

/* Filter drawer — absolutely positioned overlay */
.filter-anchor {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 30;
    width: 100%;
    max-width: 32rem;
    padding-top: 0.5rem;
}

.filter-panel {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem;
    border-radius: 0.75rem;
    border: 1px solid hsl(var(--border) / 0.5);
    background: hsl(var(--card) / 0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 8px 24px hsl(var(--foreground) / 0.08);
}

/* Filter drawer transition */
.filter-drawer-enter-active {
    transition: all 0.3s cubic-bezier(0.22, 1.6, 0.36, 1);
}
.filter-drawer-leave-active {
    transition: all 0.2s ease;
}
.filter-drawer-enter-from {
    opacity: 0;
    transform: translateY(-8px) scale(0.97);
}
.filter-drawer-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}

.basis-pill-btn:hover {
    border-color: color-mix(in srgb, var(--pill-c) 40%, transparent);
    color: var(--pill-c);
}

.basis-pill-btn.active {
    background: color-mix(in srgb, var(--pill-c) 12%, transparent);
    border-color: color-mix(in srgb, var(--pill-c) 30%, transparent);
    color: var(--pill-c);
}
</style>
