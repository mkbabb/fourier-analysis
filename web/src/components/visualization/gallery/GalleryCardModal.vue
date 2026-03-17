<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import type { GalleryEntry } from "@/lib/types";
import { overlayUrl } from "@/lib/api";
import { basisDisplay } from "../lib/basis-display";
import { VIZ_COLORS } from "@/lib/colors";
import {
    X,
    ArrowRight,
    Eye,
    Heart,
    Crown,
    Bookmark,
} from "lucide-vue-next";

const props = defineProps<{
    entry: GalleryEntry;
    adminMode?: boolean;
    isLiked?: boolean;
}>();

const emit = defineEmits<{
    close: [];
    like: [hash: string];
    "open-visualizer": [imageSlug: string];
    "set-tier": [hash: string, tier: "featured" | "saved" | "normal"];
}>();

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

function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
        e.preventDefault();
        emit("close");
    }
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
    <Teleport to="body">
        <Transition name="modal">
            <div
                class="fixed inset-0 z-[var(--z-modal)] p-4 bg-background/70 backdrop-blur-sm flex items-center justify-center"
                @click="emit('close')"
            >
                <div class="modal-card relative bg-card rounded-xl border-2 border-foreground/15 overflow-hidden max-w-[28rem] w-full max-h-[90vh] overflow-y-auto" @click.stop>
                    <button
                        class="glass-btn w-8 h-8 absolute top-2.5 right-2.5 z-10"
                        @click="emit('close')"
                    >
                        <X :size="18" />
                    </button>

                    <!-- Image frame -->
                    <div class="relative aspect-[16/10] border-b border-foreground/8 bg-muted overflow-hidden">
                        <img
                            :src="overlayUrl(entry.image_slug)"
                            :alt="entry.image_slug"
                            class="w-full h-full object-contain"
                        />
                        <!-- Tier badge -->
                        <div
                            v-if="entry.tier !== 'normal'"
                            class="modal-tier-badge absolute top-2 left-2 flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold capitalize backdrop-blur-sm bg-background/70"
                            :data-tier="entry.tier"
                        >
                            <Crown v-if="entry.tier === 'featured'" :size="16" />
                            <Bookmark v-else :size="16" />
                            <span>{{ entry.tier }}</span>
                        </div>
                    </div>

                    <div class="flex flex-col gap-2 px-3.5 pt-2.5 pb-3.5">
                        <!-- Slug + stats row -->
                        <div class="flex items-center gap-1.5">
                            <span class="text-sm text-muted-foreground font-mono flex-1 min-w-0 truncate">{{ entry.image_slug }}</span>
                            <span class="text-sm text-foreground/35 shrink-0">{{ timeAgo(entry.created_at) }}</span>
                        </div>

                        <!-- Stats row -->
                        <div class="flex items-center gap-4 py-1">
                            <span class="inline-flex items-center gap-[0.3rem] text-sm text-muted-foreground">
                                <Eye :size="16" />
                                <span class="font-mono">{{ entry.views }}</span>
                                <span class="text-muted-foreground/60">views</span>
                            </span>
                            <button
                                class="like-btn inline-flex items-center gap-[0.3rem] text-sm text-muted-foreground border-none bg-transparent cursor-pointer p-0 transition-all duration-150"
                                :class="{ liked: isLiked }"
                                @click="emit('like', entry.snapshot_hash)"
                            >
                                <Heart :size="16" :fill="isLiked ? 'currentColor' : 'none'" />
                                <span class="font-mono">{{ entry.likes }}</span>
                                <span class="text-muted-foreground/60">likes</span>
                            </button>
                        </div>

                        <!-- Decomposition -->
                        <div class="bg-muted/30 rounded-lg px-3 py-2">
                            <div class="pb-1">
                                <span class="cm-serif text-sm font-semibold tracking-tight">Decomposition</span>
                            </div>
                            <div class="flex flex-wrap gap-1">
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
                        </div>

                        <!-- Parameters -->
                        <div class="bg-muted/30 rounded-lg px-3 py-2">
                            <div class="pb-1">
                                <span class="cm-serif text-sm font-semibold tracking-tight">Parameters</span>
                            </div>
                            <div class="flex items-center justify-between py-1">
                                <span class="text-sm text-muted-foreground">Harmonics</span>
                                <span class="text-base font-semibold font-mono" :style="{ color: VIZ_COLORS.fourier }">
                                    N={{ entry.n_harmonics }}
                                </span>
                            </div>
                        </div>

                        <!-- Admin tier controls -->
                        <div v-if="adminMode" class="flex gap-2">
                            <button
                                class="tier-btn inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground cursor-pointer transition-all duration-150 bg-transparent"
                                :class="{ active: entry.tier === 'featured' }"
                                @click="emit('set-tier', entry.snapshot_hash, entry.tier === 'featured' ? 'normal' : 'featured')"
                            >
                                <Crown :size="14" /> Featured
                            </button>
                            <button
                                class="tier-btn inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground cursor-pointer transition-all duration-150 bg-transparent"
                                :class="{ active: entry.tier === 'saved' }"
                                @click="emit('set-tier', entry.snapshot_hash, entry.tier === 'saved' ? 'normal' : 'saved')"
                            >
                                <Bookmark :size="14" /> Saved
                            </button>
                        </div>

                        <!-- CTA -->
                        <button
                            class="callout-btn inline-flex items-center justify-center gap-1.5 mt-2.5 px-5 py-2 rounded-[0.625rem] border-2 border-foreground/12 text-base font-semibold text-foreground bg-foreground/3 cursor-pointer transition-all duration-150 hover:bg-foreground/7 hover:border-foreground/20 active:scale-[0.98]"
                            @click="emit('open-visualizer', entry.image_slug)"
                        >
                            <span class="fourier-f">&Fscr;</span>
                            <span>Open Visualizer</span>
                            <ArrowRight class="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
@reference "tailwindcss";

/* Card shadow */
.modal-card {
    box-shadow: var(--shadow-modal);
}

/* Tier badge colors */
.modal-tier-badge[data-tier="featured"] { color: hsl(var(--tier-featured)); }
.modal-tier-badge[data-tier="saved"] { color: hsl(var(--tier-saved)); }

/* Like button */
.like-btn:hover,
.like-btn.liked {
    color: hsl(var(--like));
}

/* Tier button */
.tier-btn {
    border: 1.5px solid hsl(var(--foreground) / 0.12);
}
.tier-btn:hover { border-color: hsl(var(--foreground) / 0.25); }
.tier-btn.active { background: hsl(var(--foreground) / 0.06); color: hsl(var(--foreground)); }

/* Transitions */
.modal-enter-active {
    transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}
.modal-enter-from { opacity: 0; transform: scale(0.92); }
.modal-leave-to { opacity: 0; transform: scale(0.95); }
</style>
