<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import { Badge, Button } from "@mkbabb/glass-ui";
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
                    <Button
                        variant="glass"
                        size="icon"
                        class="absolute top-2.5 right-2.5 z-[var(--z-content)] h-8 w-8"
                        @click="emit('close')"
                    >
                        <X :size="18" />
                    </Button>

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
                            <Button
                                variant="ghost"
                                size="sm"
                                class="like-btn"
                                :class="{ liked: isLiked }"
                                :aria-pressed="isLiked"
                                @click="emit('like', entry.snapshot_hash)"
                            >
                                <Heart :size="16" :fill="isLiked ? 'currentColor' : 'none'" />
                                <span class="font-mono">{{ entry.likes }}</span>
                                <span class="text-muted-foreground/60">likes</span>
                            </Button>
                        </div>

                        <!-- Decomposition -->
                        <div class="bg-muted/30 rounded-lg px-3 py-2">
                            <div class="pb-1">
                                <span class="cm-serif text-sm font-semibold tracking-tight">Decomposition</span>
                            </div>
                            <div class="flex flex-wrap gap-1">
                                <Badge
                                    v-for="b in basisLabels"
                                    :key="b.label"
                                    variant="outline"
                                    size="sm"
                                    class="basis-tint inline-flex items-center gap-[0.2rem] rounded-full font-medium whitespace-nowrap"
                                    :style="{ '--pill-c': b.color }"
                                >
                                    <span class="cm-serif font-semibold text-[1.1em]">{{ b.icon }}</span>
                                    {{ b.label }}
                                </Badge>
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
                            <Button
                                variant="outline"
                                size="sm"
                                class="tier-btn"
                                :class="{ active: entry.tier === 'featured' }"
                                :aria-pressed="entry.tier === 'featured'"
                                @click="emit('set-tier', entry.snapshot_hash, entry.tier === 'featured' ? 'normal' : 'featured')"
                            >
                                <Crown :size="14" /> Featured
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                class="tier-btn"
                                :class="{ active: entry.tier === 'saved' }"
                                :aria-pressed="entry.tier === 'saved'"
                                @click="emit('set-tier', entry.snapshot_hash, entry.tier === 'saved' ? 'normal' : 'saved')"
                            >
                                <Bookmark :size="14" /> Saved
                            </Button>
                        </div>

                        <!-- CTA -->
                        <Button
                            variant="outline"
                            size="lg"
                            class="callout-btn mt-2.5 gap-1.5 text-base font-semibold"
                            @click="emit('open-visualizer', entry.image_slug)"
                        >
                            <span class="fourier-f">&Fscr;</span>
                            <span>Open Visualizer</span>
                            <ArrowRight class="h-4 w-4" />
                        </Button>
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

/* A.W2.e — basis-tint colour projection over `<Badge variant="outline">`,
   identical to the GalleryCard recipe; the badge is decorative read-only
   here (no click handler), so `<Badge>` is the precise primitive. */
.basis-tint {
    background: color-mix(in srgb, var(--pill-c) 12%, transparent);
    border-color: color-mix(in srgb, var(--pill-c) 30%, transparent);
    color: var(--pill-c);
}

/* Tier badge colors */
.modal-tier-badge[data-tier="featured"] { color: var(--tier-featured); }
.modal-tier-badge[data-tier="saved"] { color: var(--tier-saved); }

/* `<Button variant="ghost" size="sm">` chassis; `.like-btn` narrows to a
   stat-counter row, mirroring GalleryCard's recipe. */
.like-btn {
    height: auto;
    padding: 0;
    gap: 0.3rem;
    font-size: 0.875rem;
    color: var(--muted-foreground);
}
.like-btn:hover,
.like-btn.liked {
    color: var(--like);
    background: transparent;
}

/* `<Button variant="outline" size="sm">` chassis; `.tier-btn` softens the
   border weight and projects the `active` state as a foreground-tint plate. */
.tier-btn {
    border-width: 1.5px;
    border-color: color-mix(in srgb, var(--foreground) 12%, transparent);
    color: var(--muted-foreground);
}
.tier-btn:hover { border-color: color-mix(in srgb, var(--foreground) 25%, transparent); }
.tier-btn[aria-pressed="true"] {
    background: color-mix(in srgb, var(--foreground) 6%, transparent);
    color: var(--foreground);
}

/* `<Button variant="outline" size="lg">` chassis; `.callout-btn` thickens
   the border and adds the cartoon-card foreground/3 plate. */
.callout-btn {
    border-width: 2px;
    border-color: color-mix(in srgb, var(--foreground) 12%, transparent);
    background: color-mix(in srgb, var(--foreground) 3%, transparent);
}
.callout-btn:hover {
    background: color-mix(in srgb, var(--foreground) 7%, transparent);
    border-color: color-mix(in srgb, var(--foreground) 20%, transparent);
}

/* Transitions (A.W3.d — bezier→`--ease-apple-spring`) */
.modal-enter-active {
    transition: opacity 0.25s var(--ease-standard), transform 0.3s var(--ease-apple-spring);
}
.modal-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}
.modal-enter-from { opacity: 0; transform: scale(0.92); }
.modal-leave-to { opacity: 0; transform: scale(0.95); }
</style>
