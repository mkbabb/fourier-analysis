<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useWorkspaceStore } from "@/stores/workspace";
import { saveDraft } from "@/lib/draftStorage";
import { getEasingSVGPath, EASING_OPTIONS, type EasingName } from "@/stores/animation";
import { basisDisplay } from "./lib/basis-display";
import { VIZ_COLORS } from "@/lib/colors";
import * as api from "@/lib/api";
import type { WorkspaceDraft } from "@/lib/types";
import PathPreview from "@/components/ui/PathPreview.vue";
import EasingCurvePreview from "./EasingCurvePreview.vue";
import { X, ArrowRight, Copy, Check, Layers } from "lucide-vue-next";

const router = useRouter();
const store = useWorkspaceStore();
const selectedItem = ref<WorkspaceDraft | null>(null);
const copiedSlug = ref<string | null>(null);

onMounted(async () => {
    if (store.imageSlug) {
        const draft: WorkspaceDraft = {
            imageSlug: store.imageSlug,
            contour: store.contour,
            contourSettings: store.contourSettings,
            animationSettings: store.animationSettings,
            epicycleData: store.epicycleData,
            basesData: store.basesData,
            savedSnapshots: [],
            lastOpenedAt: new Date().toISOString(),
        };
        await saveDraft(draft).catch(() => {});
    }
    await store.refreshDrafts();
});

const galleryItems = computed(() => {
    const all = store.drafts.slice()
        .sort((a, b) => (b.lastOpenedAt ?? "").localeCompare(a.lastOpenedAt ?? ""));
    const seen = new Set<string>();
    return all.filter((d) => {
        if (seen.has(d.imageSlug)) return false;
        seen.add(d.imageSlug);
        return true;
    });
});

function openItem(item: WorkspaceDraft) { selectedItem.value = item; }
function closeModal() { selectedItem.value = null; }
function goToVisualizer(item: WorkspaceDraft) {
    selectedItem.value = null;
    router.push(`/w/${item.imageSlug}`);
}

async function copySlug(slug: string, e: Event) {
    e.stopPropagation();
    await navigator.clipboard.writeText(`${window.location.origin}/w/${slug}`);
    copiedSlug.value = slug;
    setTimeout(() => { copiedSlug.value = null; }, 1500);
}

function activeBasisLabels(item: WorkspaceDraft): { icon: string; label: string; color: string }[] {
    const bases = item.animationSettings?.active_bases ?? [];
    return bases.map((b) => {
        const key = b.startsWith("fourier") ? "fourier" : b;
        const cfg = basisDisplay[key];
        if (!cfg) return null;
        const label = b === "fourier-epicycles" ? "Epicycles" : b === "fourier-series" ? "Series" : cfg.label;
        return { icon: cfg.icon, label, color: cfg.color };
    }).filter(Boolean) as { icon: string; label: string; color: string }[];
}

function easingName(item: WorkspaceDraft): EasingName {
    return (item.animationSettings?.easing ?? "sine") as EasingName;
}

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
    <div class="gallery-view">
        <div v-if="galleryItems.length === 0" class="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground">
            <Layers class="h-12 w-12 opacity-30" />
            <p class="text-base font-medium">No saved visualizations yet.</p>
            <p class="text-sm opacity-70">Upload an image in the Visualizer to get started.</p>
        </div>

        <!-- Card grid -->
        <div v-else class="card-grid">
            <div v-for="item in galleryItems" :key="item.imageSlug"
                class="pokemon-card" @click="openItem(item)">
                <div class="card-inner">
                    <!-- Image frame -->
                    <div class="card-image-frame">
                        <img :src="api.imageUrl(item.imageSlug)" :alt="item.imageSlug"
                            class="card-image" loading="lazy"
                            @error="(e: Event) => (e.target as HTMLImageElement).style.opacity = '0'" />
                        <PathPreview v-if="item.epicycleData?.path"
                            :path-x="item.epicycleData.path.x" :path-y="item.epicycleData.path.y"
                            :size="160" :stroke-width="2" :stroke-color="VIZ_COLORS.fourier"
                            class="absolute inset-0 w-full h-full opacity-40 pointer-events-none" />
                    </div>

                    <!-- Header: slug + copy + time -->
                    <div class="card-header">
                        <span class="card-slug fira-code">{{ item.imageSlug }}</span>
                        <button class="card-copy" @click="copySlug(item.imageSlug, $event)">
                            <Check v-if="copiedSlug === item.imageSlug" :size="12" class="text-green-500" />
                            <Copy v-else :size="12" />
                        </button>
                        <span class="card-time">{{ timeAgo(item.lastOpenedAt) }}</span>
                    </div>

                    <!-- Basis pills -->
                    <div class="card-bases">
                        <span v-for="b in activeBasisLabels(item)" :key="b.label"
                            class="basis-pill" :style="{ '--pill-c': b.color }">
                            <span class="cm-serif font-semibold text-[1.1em]">{{ b.icon }}</span>
                            {{ b.label }}
                        </span>
                    </div>

                    <!-- Meta + easing curve -->
                    <div class="card-footer">
                        <div class="card-meta">
                            <span class="fira-code" :style="{ color: VIZ_COLORS.fourier }">N={{ item.contourSettings?.n_harmonics ?? '?' }}</span>
                            <span class="meta-dot">·</span>
                            <span>{{ EASING_OPTIONS[easingName(item)]?.label }}</span>
                            <span class="meta-dot">·</span>
                            <span class="fira-code">{{ item.animationSettings?.speed ?? 1 }}×</span>
                        </div>
                        <EasingCurvePreview :easing="easingName(item)" :size="28" color="hsl(var(--easing-accent) / 0.5)" />
                    </div>
                </div>
            </div>
        </div>

        <!-- ═══ Modal ═══ -->
        <Teleport to="body">
            <Transition name="modal">
                <div v-if="selectedItem" class="modal-backdrop" @click="closeModal">
                    <div class="modal-card" @click.stop>
                        <button class="modal-close" @click="closeModal"><X :size="18" /></button>

                        <!-- Image -->
                        <div class="modal-image-frame">
                            <img :src="api.imageUrl(selectedItem.imageSlug)" :alt="selectedItem.imageSlug" class="modal-image" />
                            <PathPreview v-if="selectedItem.epicycleData?.path"
                                :path-x="selectedItem.epicycleData.path.x" :path-y="selectedItem.epicycleData.path.y"
                                :size="280" :stroke-width="2.5" :stroke-color="VIZ_COLORS.fourier"
                                class="absolute inset-0 w-full h-full opacity-35 pointer-events-none" />
                        </div>

                        <div class="modal-body">
                            <!-- Header: slug + time + copy -->
                            <div class="modal-header">
                                <span class="modal-slug fira-code">{{ selectedItem.imageSlug }}</span>
                                <span class="card-time">{{ timeAgo(selectedItem.lastOpenedAt) }}</span>
                                <button class="card-copy" @click="copySlug(selectedItem.imageSlug, $event)">
                                    <Check v-if="copiedSlug === selectedItem.imageSlug" :size="14" class="text-green-500" />
                                    <Copy v-else :size="14" />
                                </button>
                            </div>

                            <!-- Basis pills -->
                            <div class="card-bases">
                                <span v-for="b in activeBasisLabels(selectedItem)" :key="b.label"
                                    class="basis-pill basis-pill--lg" :style="{ '--pill-c': b.color }">
                                    <span class="cm-serif font-semibold text-[1.3em]">{{ b.icon }}</span>
                                    {{ b.label }}
                                </span>
                            </div>

                            <!-- Stats grid -->
                            <div class="modal-stats">
                                <div class="stat-cell">
                                    <span class="stat-label">Harmonics</span>
                                    <span class="stat-value fira-code" :style="{ color: VIZ_COLORS.fourier }">N={{ selectedItem.contourSettings?.n_harmonics ?? '?' }}</span>
                                </div>
                                <div class="stat-cell">
                                    <span class="stat-label">Points</span>
                                    <span class="stat-value fira-code" :style="{ color: VIZ_COLORS.chebyshev }">{{ selectedItem.contourSettings?.n_points ?? '?' }}</span>
                                </div>
                                <div class="stat-cell">
                                    <span class="stat-label">Speed</span>
                                    <span class="stat-value fira-code">{{ selectedItem.animationSettings?.speed ?? 1 }}×</span>
                                </div>
                                <div class="stat-cell">
                                    <span class="stat-label">Easing</span>
                                    <div class="flex items-center gap-1.5">
                                        <EasingCurvePreview :easing="easingName(selectedItem)" :size="22" color="hsl(var(--easing-accent))" />
                                        <span class="stat-value">{{ EASING_OPTIONS[easingName(selectedItem)]?.label }}</span>
                                    </div>
                                </div>
                            </div>

                            <button class="callout-btn" @click="goToVisualizer(selectedItem)">
                                <span class="fourier-f">ℱ</span>
                                <span>Open Visualizer</span>
                                <ArrowRight class="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<style scoped>
.gallery-view { display: flex; flex-direction: column; padding: 1.5rem; overflow-y: auto; height: 100%; }

/* ── Grid ── */
.card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
    gap: 1.25rem;
    padding-bottom: 2rem;
}

/* ── Card ── */
.pokemon-card {
    cursor: pointer;
    border-radius: 1rem;
    padding: 3px;
    background: linear-gradient(135deg, hsl(var(--foreground) / 0.08), hsl(var(--foreground) / 0.02), hsl(var(--foreground) / 0.08));
    background-size: 200% 200%;
    transition: transform 0.25s cubic-bezier(0.22, 1.6, 0.36, 1), box-shadow 0.2s ease;
}
.pokemon-card:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 8px 32px hsl(var(--foreground) / 0.12);
}
.pokemon-card:active { transform: scale(0.99); }

.card-inner {
    background: hsl(var(--card));
    border-radius: 0.875rem;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.card-image-frame {
    position: relative;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    background:
        linear-gradient(hsl(var(--foreground) / 0.04) 1px, transparent 1px),
        linear-gradient(90deg, hsl(var(--foreground) / 0.04) 1px, transparent 1px),
        hsl(var(--muted));
    background-size: 16px 16px, 16px 16px, auto;
}
.card-image { width: 100%; height: 100%; object-fit: cover; }

/* ── Header ── */
.card-header {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem 0.25rem;
}
.card-slug {
    font-size: 0.6875rem;
    color: hsl(var(--muted-foreground));
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
}
.card-copy {
    display: flex; align-items: center; justify-content: center;
    width: 1.5rem; height: 1.5rem; border-radius: 0.25rem;
    border: none; background: none; color: hsl(var(--muted-foreground));
    cursor: pointer; flex-shrink: 0; transition: all 0.15s;
}
.card-copy:hover { color: hsl(var(--foreground)); background: hsl(var(--foreground) / 0.06); }
.card-time {
    font-size: 0.625rem; color: hsl(var(--foreground) / 0.35);
    white-space: nowrap; flex-shrink: 0;
}

/* ── Basis pills (shared card + modal) ── */
.card-bases { display: flex; flex-wrap: wrap; gap: 0.25rem; padding: 0.125rem 0.75rem; }
.basis-pill {
    display: inline-flex; align-items: center; gap: 0.2rem;
    padding: 0.125rem 0.5rem; border-radius: 9999px;
    font-size: 0.625rem; font-weight: 500;
    background: color-mix(in srgb, var(--pill-c) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--pill-c) 30%, transparent);
    color: var(--pill-c); white-space: nowrap;
}
.basis-pill--lg { font-size: 0.75rem; padding: 0.25rem 0.625rem; }

/* ── Footer: meta + easing ── */
.card-footer { padding: 0.375rem 0.75rem 0.5rem; display: flex; align-items: center; gap: 0.5rem; }
.card-meta { display: flex; align-items: center; gap: 0.3rem; font-size: 0.6875rem; color: hsl(var(--muted-foreground)); flex: 1; }
.meta-dot { color: hsl(var(--foreground) / 0.15); }

/* ═══ Modal ═══ */
.modal-backdrop {
    position: fixed; inset: 0; z-index: var(--z-modal); padding: 1rem;
    background: hsl(var(--background) / 0.7); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
}
.modal-card {
    position: relative; background: hsl(var(--card)); border-radius: 1.25rem;
    overflow: hidden; max-width: 26rem; width: 100%; max-height: 90vh; overflow-y: auto;
    box-shadow: 0 24px 64px hsl(var(--foreground) / 0.2), 0 0 0 1px hsl(var(--border) / 0.5);
}
.modal-close {
    position: absolute; top: 0.625rem; right: 0.625rem; z-index: 10;
    display: flex; align-items: center; justify-content: center;
    width: 2rem; height: 2rem; border-radius: 9999px; border: none;
    background: hsl(var(--background) / 0.7); backdrop-filter: blur(8px);
    color: hsl(var(--foreground)); cursor: pointer; transition: all 0.15s;
}
.modal-close:hover { background: hsl(var(--background) / 0.9); }

.modal-image-frame {
    position: relative; aspect-ratio: 4 / 3;
    background:
        linear-gradient(hsl(var(--foreground) / 0.04) 1px, transparent 1px),
        linear-gradient(90deg, hsl(var(--foreground) / 0.04) 1px, transparent 1px),
        hsl(var(--muted));
    background-size: 16px 16px, 16px 16px, auto;
}
.modal-image { width: 100%; height: 100%; object-fit: cover; }

.modal-body { padding: 1rem 1.25rem 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
.modal-header { display: flex; align-items: center; gap: 0.375rem; }
.modal-slug { font-size: 0.75rem; color: hsl(var(--muted-foreground)); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.modal-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
.stat-cell {
    display: flex; flex-direction: column; gap: 0.125rem;
    padding: 0.5rem 0.625rem; border-radius: 0.625rem;
    background: hsl(var(--foreground) / 0.03); border: 1px solid hsl(var(--border) / 0.4);
}
.stat-label {
    font-size: 0.5625rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.06em; color: hsl(var(--muted-foreground));
}
.stat-value { font-size: 0.8125rem; font-weight: 600; color: hsl(var(--foreground)); }
.modal-easing-svg { width: 1.5rem; height: 1rem; flex-shrink: 0; }

.callout-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
    padding: 0.625rem 1.5rem; border-radius: 9999px; border: none;
    font-size: 0.9375rem; font-weight: 600;
    color: hsl(var(--primary-foreground)); background: hsl(var(--primary));
    cursor: pointer; text-decoration: none;
    box-shadow: 0 2px 8px hsl(var(--primary) / 0.25);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.callout-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px hsl(var(--primary) / 0.35);
}
.callout-btn:active { transform: scale(0.97); }
.callout-btn .fourier-f { font-size: 1.1em; opacity: 0.85; }

/* ── Transitions ── */
.modal-enter-active { transition: opacity 0.2s ease; }
.modal-leave-active { transition: opacity 0.15s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
