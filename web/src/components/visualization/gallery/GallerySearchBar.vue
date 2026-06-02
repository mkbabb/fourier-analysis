<script setup lang="ts">
import { ref, computed } from "vue";
import { Search, X, SlidersHorizontal } from "lucide-vue-next";
import { basisDisplay } from "../lib/basis-display";
import { Button } from "@mkbabb/glass-ui/button";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@mkbabb/glass-ui/select";

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
            <Button
                v-if="searchQuery"
                variant="ghost"
                size="icon"
                class="h-6 w-6 rounded-full text-muted-foreground"
                @click="emit('update:searchQuery', '')"
            >
                <X :size="14" />
            </Button>
            <div class="w-px h-5 bg-foreground/10 shrink-0" />
            <Button
                variant="ghost"
                size="icon"
                class="filter-toggle h-7 w-7 rounded-full shrink-0 text-muted-foreground"
                :class="{ 'is-active': showFilters || hasActiveFilters }"
                :aria-pressed="showFilters || hasActiveFilters"
                @click.stop="showFilters = !showFilters"
            >
                <SlidersHorizontal :size="15" />
            </Button>
        </div>

        <!-- Filter drawer (overlaid, does not affect flow) -->
        <Transition name="filter-drawer">
            <div v-if="showFilters" class="filter-anchor">
                <div class="filter-panel glass-medium">
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
                        <Button
                            v-for="b in basisOptions"
                            :key="b.key"
                            variant="outline"
                            size="sm"
                            class="basis-pill-btn rounded-full font-medium"
                            :class="{ active: basisFilter === b.key }"
                            :aria-pressed="basisFilter === b.key"
                            :style="{ '--pill-c': b.color }"
                            @click="emit('update:basisFilter', basisFilter === b.key ? '' : b.key)"
                        >
                            <span class="cm-serif font-semibold text-[1.1em]">{{ b.icon }}</span>
                            {{ b.label }}
                        </Button>
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
    background: color-mix(in srgb, var(--muted) 50%, transparent);
    border: 1px solid color-mix(in srgb, var(--border) 35%, transparent);
}

.search-input::placeholder {
    color: color-mix(in srgb, var(--muted-foreground) 50%, transparent);
}

.filter-toggle.is-active {
    color: var(--foreground);
    background: color-mix(in srgb, var(--foreground) 8%, transparent);
}

/* Filter drawer — absolutely positioned overlay */
.filter-anchor {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: var(--z-bar);
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
    box-shadow: 0 8px 24px color-mix(in srgb, var(--foreground) 8%, transparent);
}

/* Filter drawer transition (A.W3.d — named properties + canonical tokens) */
.filter-drawer-enter-active {
    transition:
        opacity 0.3s var(--ease-apple-spring),
        transform 0.3s var(--ease-apple-spring);
}
.filter-drawer-leave-active {
    transition:
        opacity 0.2s var(--ease-standard),
        transform 0.2s var(--ease-standard);
}
.filter-drawer-enter-from {
    opacity: 0;
    transform: translateY(-8px) scale(0.97);
}
.filter-drawer-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}

/* `<Button variant="outline" size="sm">` ships the focus-ring + press-scale +
   rounded-pill chassis; the `.basis-pill-btn` hook projects the per-instance
   `--pill-c` colour onto border + tint + text, matching BasisSelector's
   `.basis-toggle` recipe. */
.basis-pill-btn {
    @apply gap-0.5 px-2;
    color: var(--muted-foreground);
}
.basis-pill-btn:hover {
    border-color: color-mix(in srgb, var(--pill-c) 40%, transparent);
    color: var(--pill-c);
    background: transparent;
}
.basis-pill-btn[aria-pressed="true"] {
    background: color-mix(in srgb, var(--pill-c) 12%, transparent);
    border-color: color-mix(in srgb, var(--pill-c) 30%, transparent);
    color: var(--pill-c);
}
</style>
