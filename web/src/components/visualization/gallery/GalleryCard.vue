<script setup lang="ts">
import { computed } from "vue";
import type { GalleryEntry } from "@/lib/types";
import { thumbnailUrl } from "@/lib/api";
import { basisDisplay } from "../lib/basis-display";
import { VIZ_COLORS } from "@/lib/colors";
import PathPreview from "@/components/ui/PathPreview.vue";
import {
    Eye,
    Heart,
    Crown,
    Bookmark,
    Trash2,
} from "lucide-vue-next";

const props = defineProps<{
    entry: GalleryEntry;
    adminMode?: boolean;
    likedHashes?: Set<string>;
}>();

const emit = defineEmits<{
    click: [];
    like: [hash: string];
    "set-tier": [hash: string, tier: "featured" | "saved" | "normal"];
    delete: [hash: string];
}>();

const isLiked = computed(() => props.likedHashes?.has(props.entry.snapshot_hash) ?? false);

const basisLabels = computed(() =>
    (props.entry.active_bases ?? [])
        .map((b) => {
            const key = b.startsWith("fourier") ? "fourier" : b;
            const cfg = basisDisplay[key];
            if (!cfg) return null;
            const label =
                b === "fourier-epicycles"
                    ? "Epicycles"
                    : b === "fourier-series"
                      ? "Series"
                      : cfg.label;
            return { icon: cfg.icon, label, color: cfg.color };
        })
        .filter(Boolean) as { icon: string; label: string; color: string }[],
);

function timeAgo(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const m = Math.floor(ms / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}
</script>

<template>
    <div
        class="gallery-card w-full cursor-pointer overflow-hidden rounded-xl bg-card border-2 border-foreground/15"
        :data-tier="entry.tier"
        @click="emit('click')"
    >
        <div class="relative flex flex-col">
            <!-- Thumbnail -->
            <div class="card-image-frame relative aspect-[4/3] overflow-hidden flex items-center justify-center border-b border-foreground/8">
                <img
                    :src="thumbnailUrl(entry.image_slug)"
                    :alt="entry.image_slug"
                    class="w-full h-full object-cover opacity-85"
                    loading="lazy"
                />
            </div>

            <!-- Header -->
            <div class="flex items-center gap-1.5 px-3 pt-2 pb-1">
                <span class="text-sm text-muted-foreground truncate flex-1 min-w-0 font-mono">{{ entry.image_slug }}</span>
                <span class="text-sm text-foreground/35 whitespace-nowrap shrink-0">{{ timeAgo(entry.created_at) }}</span>
            </div>

            <!-- Basis pills -->
            <div class="flex flex-wrap gap-1 px-3 py-0.5">
                <span
                    v-for="b in basisLabels"
                    :key="b.label"
                    class="basis-pill inline-flex items-center gap-[0.2rem] px-2 py-0.5 rounded-full text-sm font-medium whitespace-nowrap"
                    :style="{ '--pill-c': b.color }"
                >
                    <span class="cm-serif font-semibold text-[1.1em]">{{ b.icon }}</span>
                    {{ b.label }}
                </span>
            </div>

            <!-- Footer: stats -->
            <div class="flex items-center justify-between px-3 pt-1.5 pb-2">
                <div class="flex items-center gap-3">
                    <span class="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Eye :size="14" />
                        <span class="font-mono">{{ entry.views }}</span>
                    </span>
                    <button
                        class="like-btn inline-flex items-center gap-1 text-sm text-muted-foreground border-none bg-transparent cursor-pointer p-0 transition-all duration-150"
                        :class="{ liked: isLiked }"
                        @click.stop="emit('like', entry.snapshot_hash)"
                    >
                        <Heart :size="14" :fill="isLiked ? 'currentColor' : 'none'" />
                        <span class="font-mono">{{ entry.likes }}</span>
                    </button>
                </div>

                <!-- Tier badge -->
                <div v-if="entry.tier !== 'normal'" class="flex items-center justify-center w-6 h-6 rounded-full" :data-tier="entry.tier">
                    <Crown v-if="entry.tier === 'featured'" :size="12" class="text-[hsl(45,100%,50%)]" />
                    <Bookmark v-else-if="entry.tier === 'saved'" :size="12" class="text-[hsl(210,100%,60%)]" />
                </div>
            </div>

            <!-- Admin overlay -->
            <div v-if="adminMode" class="absolute top-1.5 right-1.5 flex gap-1 z-5" @click.stop>
                <button
                    class="admin-btn flex items-center justify-center w-7 h-7 rounded-full p-0 cursor-pointer text-[hsl(45,100%,50%)] border-[1.5px] border-foreground/10 bg-background/80 backdrop-blur-sm transition-all duration-150 hover:scale-110"
                    title="Toggle featured"
                    @click="emit('set-tier', entry.snapshot_hash, entry.tier === 'featured' ? 'normal' : 'featured')"
                >
                    <Crown :size="14" />
                </button>
                <button
                    class="admin-btn flex items-center justify-center w-7 h-7 rounded-full p-0 cursor-pointer text-[hsl(210,100%,60%)] border-[1.5px] border-foreground/10 bg-background/80 backdrop-blur-sm transition-all duration-150 hover:scale-110"
                    title="Toggle saved"
                    @click="emit('set-tier', entry.snapshot_hash, entry.tier === 'saved' ? 'normal' : 'saved')"
                >
                    <Bookmark :size="14" />
                </button>
                <button
                    class="admin-btn flex items-center justify-center w-7 h-7 rounded-full p-0 cursor-pointer text-[hsl(0,70%,55%)] border-[1.5px] border-foreground/10 bg-background/80 backdrop-blur-sm transition-all duration-150 hover:scale-110"
                    title="Delete"
                    @click="emit('delete', entry.snapshot_hash)"
                >
                    <Trash2 :size="14" />
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
@reference "tailwindcss";

.gallery-card {
    box-shadow: 3px 3px 0px 0px hsl(var(--foreground) / 0.08);
    transition:
        transform 0.25s cubic-bezier(0.22, 1.6, 0.36, 1),
        box-shadow 0.2s ease,
        border-color 0.2s ease;
}

.gallery-card:hover {
    transform: translateY(-4px) scale(1.02);
    border-color: hsl(var(--foreground) / 0.25);
    box-shadow: 4px 4px 0px 0px hsl(var(--foreground) / 0.1);
}

.gallery-card:active {
    transform: scale(0.99);
}

/* Tier styling */
.gallery-card[data-tier="featured"] {
    border-color: hsl(45, 100%, 50%);
    box-shadow: 0 0 12px hsla(45, 100%, 50%, 0.3);
}

.gallery-card[data-tier="saved"] {
    border-color: hsl(210, 100%, 60%);
    box-shadow: 0 0 8px hsla(210, 100%, 60%, 0.2);
}

/* Image frame grid background */
.card-image-frame {
    background: linear-gradient(
            hsl(var(--foreground) / 0.04) 1px,
            transparent 1px
        ),
        linear-gradient(
            90deg,
            hsl(var(--foreground) / 0.04) 1px,
            transparent 1px
        ),
        hsl(var(--muted));
    background-size: 16px 16px, 16px 16px, auto;
}

/* Basis pill color-mix */
.basis-pill {
    background: color-mix(in srgb, var(--pill-c) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--pill-c) 30%, transparent);
    color: var(--pill-c);
}

/* Like button */
.like-btn:hover,
.like-btn.liked {
    color: hsl(0, 80%, 60%);
}

.like-btn.liked :deep(svg) {
    animation: like-bounce 0.3s cubic-bezier(0.22, 1.6, 0.36, 1);
}

@keyframes like-bounce {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1); }
}
</style>
