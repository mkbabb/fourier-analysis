<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useWorkspaceStore } from "@/stores/workspace";
import { saveDraft } from "@/lib/draftStorage";
import { getEasingSVGPath, EASING_OPTIONS, type EasingName } from "@/stores/animation";
import { basisDisplay } from "./lib/basis-display";
import { VIZ_COLORS } from "@/lib/colors";
import { thumbnailUrl, overlayUrl } from "@/lib/api";
import type { WorkspaceDraft, ImageBounds } from "@/lib/types";
import PathPreview from "@/components/ui/PathPreview.vue";
import EasingCurvePreview from "./EasingCurvePreview.vue";
import {
    X,
    ArrowRight,
    Copy,
    Check,
    Layers,
    Image as ImageIcon,
    Spline,
    Waves,
} from "lucide-vue-next";

// ── Stores & router ──

const router = useRouter();
const store = useWorkspaceStore();
const selectedItem = ref<WorkspaceDraft | null>(null);
const copiedSlug = ref<string | null>(null);

// ── Modal layer toggles ──

const showImage = ref(false);
const showContour = ref(false);
const showPath = ref(true);

// ── Gallery container ref for intersection observer ──

const galleryRef = ref<HTMLElement | null>(null);
const visibleTrackIndices = ref<Set<number>>(new Set());

// ── Lifecycle ──

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
    await nextTick();
    setupIntersectionObserver();
});

onUnmounted(() => {
    observer?.disconnect();
});

// ── Gallery items ──

const galleryItems = computed(() => {
    const all = store.drafts
        .slice()
        .sort((a, b) => (b.lastOpenedAt ?? "").localeCompare(a.lastOpenedAt ?? ""));
    const seen = new Set<string>();
    return all.filter((d) => {
        if (seen.has(d.imageSlug)) return false;
        seen.add(d.imageSlug);
        return true;
    });
});

// ── Marquee track distribution ──

const trackCount = computed(() =>
    Math.max(1, Math.min(Math.ceil(galleryItems.value.length / 4), 6)),
);

interface MarqueeTrack {
    index: number;
    items: WorkspaceDraft[];
    direction: "left" | "right";
    speed: number; // px/sec
}

const tracks = computed<MarqueeTrack[]>(() => {
    const items = galleryItems.value;
    const n = trackCount.value;
    const buckets: WorkspaceDraft[][] = Array.from({ length: n }, () => []);

    // Round-robin distribution
    for (let i = 0; i < items.length; i++) {
        buckets[i % n].push(items[i]);
    }

    return buckets.map((bucket, idx) => ({
        index: idx,
        items: bucket,
        direction: idx % 2 === 0 ? ("left" as const) : ("right" as const),
        speed: 25 + (idx * 15) / Math.max(n - 1, 1), // 25-40 px/sec range
    }));
});

/**
 * Compute the CSS animation duration for a track.
 * Each card is 16rem (256px) wide + 1.25rem (20px) gap.
 * The strip contains 2 copies, so total strip width = 2 * items * (256 + 20).
 * The animation translates by 50% (one copy length), so the distance
 * covered is items * (256 + 20) px.
 */
function trackDuration(track: MarqueeTrack): string {
    const cardWidth = 256 + 20; // 16rem + gap
    const oneSetWidth = track.items.length * cardWidth;
    const seconds = oneSetWidth / track.speed;
    return `${seconds.toFixed(1)}s`;
}

// ── Intersection observer for track virtualization ──

let observer: IntersectionObserver | null = null;

function setupIntersectionObserver() {
    if (!galleryRef.value) return;

    observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                const idx = Number(
                    (entry.target as HTMLElement).dataset.trackIndex,
                );
                if (Number.isNaN(idx)) continue;
                if (entry.isIntersecting) {
                    visibleTrackIndices.value.add(idx);
                } else {
                    visibleTrackIndices.value.delete(idx);
                }
            }
            // Force reactivity update
            visibleTrackIndices.value = new Set(visibleTrackIndices.value);
        },
        {
            root: galleryRef.value,
            rootMargin: "200px 0px",
            threshold: 0,
        },
    );

    // Observe all track sentinel elements
    const trackEls = galleryRef.value.querySelectorAll("[data-track-index]");
    trackEls.forEach((el) => observer!.observe(el));
}

// Re-setup observer when tracks change
watch(
    () => tracks.value.length,
    async () => {
        observer?.disconnect();
        await nextTick();
        setupIntersectionObserver();
    },
);

// ── Card helpers ──

function getPathData(
    item: WorkspaceDraft,
): { x: number[]; y: number[] } | null {
    return item.epicycleData?.path ?? item.basesData?.original ?? null;
}

function getPathColor(item: WorkspaceDraft): string {
    const bases = item.animationSettings?.active_bases ?? [];
    if (bases.length === 0) return VIZ_COLORS.fourier;
    const first = bases[0];
    const key = first.startsWith("fourier") ? "fourier" : first;
    const cfg = basisDisplay[key];
    return cfg?.color ?? VIZ_COLORS.fourier;
}

function activeBasisLabels(
    item: WorkspaceDraft,
): { icon: string; label: string; color: string }[] {
    const bases = item.animationSettings?.active_bases ?? [];
    return bases
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
        .filter(Boolean) as { icon: string; label: string; color: string }[];
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

async function copySlug(slug: string, e: Event) {
    e.stopPropagation();
    await navigator.clipboard.writeText(`${window.location.origin}/w/${slug}`);
    copiedSlug.value = slug;
    setTimeout(() => {
        copiedSlug.value = null;
    }, 1500);
}

function openItem(item: WorkspaceDraft) {
    selectedItem.value = item;
    showImage.value = true;
    showContour.value = true;
    showPath.value = true;
    window.addEventListener("keydown", onModalKeydown);
}

function closeModal() {
    selectedItem.value = null;
    window.removeEventListener("keydown", onModalKeydown);
}

function onModalKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
    }
}

function goToVisualizer(item: WorkspaceDraft) {
    selectedItem.value = null;
    router.push(`/w/${item.imageSlug}`);
}

// ── Modal SVG helpers ──

function pointsToSVGPath(pts: { x: number[]; y: number[] }): string {
    if (!pts.x.length) return "";
    const segs = pts.x.map((x, i) => `${x.toFixed(2)},${pts.y[i].toFixed(2)}`);
    return `M${segs.join("L")}Z`;
}

function computeBounds(pts: { x: number[]; y: number[] }): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
} {
    const minX = Math.min(...pts.x);
    const maxX = Math.max(...pts.x);
    const minY = Math.min(...pts.y);
    const maxY = Math.max(...pts.y);
    return { minX, maxX, minY, maxY };
}

const modalPathData = computed(() => {
    if (!selectedItem.value) return null;
    return getPathData(selectedItem.value);
});

const modalContourData = computed(() => {
    if (!selectedItem.value?.contour?.points) return null;
    return selectedItem.value.contour.points;
});

const modalReconPath = computed(() => {
    if (!modalPathData.value) return "";
    return pointsToSVGPath(modalPathData.value);
});

const modalContourPath = computed(() => {
    if (!modalContourData.value) return "";
    return pointsToSVGPath(modalContourData.value);
});

const modalPathColor = computed(() => {
    if (!selectedItem.value) return VIZ_COLORS.fourier;
    return getPathColor(selectedItem.value);
});

const modalImageBounds = computed((): ImageBounds | null => {
    if (!selectedItem.value?.contour?.image_bounds) return null;
    return selectedItem.value.contour.image_bounds;
});

const modalResize = computed(() => {
    return selectedItem.value?.contourSettings?.resize ?? 768;
});

const modalViewBox = computed(() => {
    // Combine all visible path data to compute the viewBox
    const allX: number[] = [];
    const allY: number[] = [];

    if (modalPathData.value) {
        allX.push(...modalPathData.value.x);
        allY.push(...modalPathData.value.y);
    }
    if (modalContourData.value) {
        allX.push(...modalContourData.value.x);
        allY.push(...modalContourData.value.y);
    }
    if (modalImageBounds.value) {
        allX.push(modalImageBounds.value.minX, modalImageBounds.value.maxX);
        allY.push(modalImageBounds.value.minY, modalImageBounds.value.maxY);
    }

    if (allX.length === 0) return "0 0 100 100";

    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const margin = Math.max(rangeX, rangeY) * 0.08;

    return `${(minX - margin).toFixed(2)} ${(minY - margin).toFixed(2)} ${(rangeX + margin * 2).toFixed(2)} ${(rangeY + margin * 2).toFixed(2)}`;
});
</script>

<template>
    <div ref="galleryRef" class="gallery-view">
        <div
            v-if="galleryItems.length === 0"
            class="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground"
        >
            <Layers class="h-12 w-12 opacity-30" />
            <p class="text-base font-medium">No saved visualizations yet.</p>
            <p class="text-sm opacity-70">
                Upload an image in the Visualizer to get started.
            </p>
        </div>

        <!-- Marquee tracks -->
        <div v-else class="marquee-gallery">
            <div
                v-for="track in tracks"
                :key="track.index"
                :data-track-index="track.index"
                class="marquee-track"
            >
                <template
                    v-if="
                        visibleTrackIndices.has(track.index) ||
                        visibleTrackIndices.size === 0
                    "
                >
                    <div
                        class="marquee-strip"
                        :data-dir="track.direction"
                        :style="{
                            '--duration': trackDuration(track),
                        }"
                    >
                        <!-- Two copies for seamless loop -->
                        <template v-for="copy in 2" :key="copy">
                            <div
                                v-for="item in track.items"
                                :key="`${copy}-${item.imageSlug}`"
                                class="pokemon-card"
                                @click="openItem(item)"
                            >
                                <div class="card-inner">
                                    <!-- Image frame: PathPreview is primary -->
                                    <div class="card-image-frame">
                                        <PathPreview
                                            v-if="getPathData(item)"
                                            :path-x="getPathData(item)!.x"
                                            :path-y="getPathData(item)!.y"
                                            :size="240"
                                            :stroke-width="2.5"
                                            :stroke-color="getPathColor(item)"
                                            class="card-path-primary"
                                        />
                                    </div>

                                    <!-- Header: slug + copy + time -->
                                    <div class="card-header">
                                        <span class="card-slug fira-code">{{
                                            item.imageSlug
                                        }}</span>
                                        <button
                                            class="card-copy"
                                            @click="
                                                copySlug(
                                                    item.imageSlug,
                                                    $event,
                                                )
                                            "
                                        >
                                            <Check
                                                v-if="
                                                    copiedSlug ===
                                                    item.imageSlug
                                                "
                                                :size="12"
                                                class="text-green-500"
                                            />
                                            <Copy v-else :size="12" />
                                        </button>
                                        <span class="card-time">{{
                                            timeAgo(item.lastOpenedAt)
                                        }}</span>
                                    </div>

                                    <!-- Basis pills -->
                                    <div class="card-bases">
                                        <span
                                            v-for="b in activeBasisLabels(item)"
                                            :key="b.label"
                                            class="basis-pill"
                                            :style="{ '--pill-c': b.color }"
                                        >
                                            <span
                                                class="cm-serif font-semibold text-[1.1em]"
                                                >{{ b.icon }}</span
                                            >
                                            {{ b.label }}
                                        </span>
                                    </div>

                                    <!-- Meta + easing curve -->
                                    <div class="card-footer">
                                        <div class="card-meta">
                                            <span
                                                class="fira-code"
                                                :style="{
                                                    color: VIZ_COLORS.fourier,
                                                }"
                                                >N={{
                                                    item.contourSettings
                                                        ?.n_harmonics ?? "?"
                                                }}</span
                                            >
                                            <span class="meta-dot">&middot;</span>
                                            <span>{{
                                                EASING_OPTIONS[easingName(item)]
                                                    ?.label
                                            }}</span>
                                            <span class="meta-dot">&middot;</span>
                                            <span class="fira-code"
                                                >{{
                                                    item.animationSettings
                                                        ?.speed ?? 1
                                                }}&times;</span
                                            >
                                        </div>
                                        <EasingCurvePreview
                                            :easing="easingName(item)"
                                            :size="48"
                                            color="hsl(var(--easing-accent) / 0.5)"
                                        />
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                </template>

                <!-- Placeholder when track is not visible -->
                <div v-else class="marquee-track-placeholder" />
            </div>
        </div>

        <!-- ═══ Modal ═══ -->
        <Teleport to="body">
            <Transition name="modal">
                <div
                    v-if="selectedItem"
                    class="modal-backdrop"
                    @click="closeModal"
                >
                    <div class="modal-card" @click.stop>
                        <button class="modal-close" @click="closeModal">
                            <X :size="18" />
                        </button>

                        <!-- SVG image frame with layer toggles -->
                        <div class="modal-image-frame">
                            <!-- Layer toggle buttons -->
                            <div class="modal-layer-toggles">
                                <button
                                    class="layer-toggle-btn"
                                    :class="{ active: showImage }"
                                    title="Toggle source image"
                                    @click="showImage = !showImage"
                                >
                                    <ImageIcon :size="14" />
                                </button>
                                <button
                                    class="layer-toggle-btn"
                                    :class="{ active: showContour }"
                                    title="Toggle contour outline"
                                    @click="showContour = !showContour"
                                >
                                    <Spline :size="14" />
                                </button>
                                <button
                                    class="layer-toggle-btn"
                                    :class="{ active: showPath }"
                                    title="Toggle reconstructed path"
                                    @click="showPath = !showPath"
                                >
                                    <Waves :size="14" />
                                </button>
                            </div>

                            <!-- Composited SVG -->
                            <svg
                                :viewBox="modalViewBox"
                                preserveAspectRatio="xMidYMid meet"
                                class="w-full h-full"
                            >
                                <g transform="scale(1,-1)">
                                    <!-- Image overlay when toggled on -->
                                    <image
                                        v-if="showImage && modalImageBounds"
                                        :href="
                                            overlayUrl(
                                                selectedItem.imageSlug,
                                                modalResize,
                                            )
                                        "
                                        :x="modalImageBounds.minX"
                                        :y="modalImageBounds.minY"
                                        :width="
                                            modalImageBounds.maxX -
                                            modalImageBounds.minX
                                        "
                                        :height="
                                            modalImageBounds.maxY -
                                            modalImageBounds.minY
                                        "
                                        :transform="`translate(0, ${modalImageBounds.minY * 2 + (modalImageBounds.maxY - modalImageBounds.minY)}) scale(1, -1)`"
                                        style="opacity: 0.3"
                                        preserveAspectRatio="xMidYMid meet"
                                    />
                                    <!-- Contour path -->
                                    <path
                                        v-if="showContour && modalContourPath"
                                        :d="modalContourPath"
                                        fill="none"
                                        stroke="hsl(var(--muted-foreground))"
                                        :stroke-width="2"
                                        vector-effect="non-scaling-stroke"
                                        opacity="0.5"
                                    />
                                    <!-- Reconstructed path -->
                                    <path
                                        v-if="showPath && modalReconPath"
                                        :d="modalReconPath"
                                        fill="none"
                                        :stroke="modalPathColor"
                                        :stroke-width="2.5"
                                        vector-effect="non-scaling-stroke"
                                    />
                                </g>
                            </svg>
                        </div>

                        <div class="modal-body">
                            <!-- Slug row -->
                            <div class="modal-slug-row">
                                <span class="modal-slug fira-code">{{
                                    selectedItem.imageSlug
                                }}</span>
                                <button
                                    class="card-copy"
                                    @click="
                                        copySlug(
                                            selectedItem.imageSlug,
                                            $event,
                                        )
                                    "
                                >
                                    <Check
                                        v-if="
                                            copiedSlug ===
                                            selectedItem.imageSlug
                                        "
                                        :size="12"
                                        class="text-green-500"
                                    />
                                    <Copy v-else :size="12" />
                                </button>
                                <span class="card-time">{{
                                    timeAgo(selectedItem.lastOpenedAt)
                                }}</span>
                            </div>

                            <!-- Decomposition card -->
                            <div class="modal-info-card">
                                <div class="modal-section-header">
                                    <span
                                        class="cm-serif text-sm font-semibold tracking-tight"
                                        >Decomposition</span
                                    >
                                    <span
                                        class="ml-1.5 text-xs font-normal text-muted-foreground/70"
                                        >&mdash; active bases</span
                                    >
                                </div>
                                <div class="modal-bases">
                                    <span
                                        v-for="b in activeBasisLabels(
                                            selectedItem,
                                        )"
                                        :key="b.label"
                                        class="basis-pill"
                                        :style="{ '--pill-c': b.color }"
                                    >
                                        <span
                                            class="cm-serif font-semibold text-[1.1em]"
                                            >{{ b.icon }}</span
                                        >
                                        {{ b.label }}
                                    </span>
                                </div>
                            </div>

                            <!-- Parameters card -->
                            <div class="modal-info-card">
                                <div class="modal-section-header">
                                    <span
                                        class="cm-serif text-sm font-semibold tracking-tight"
                                        >Parameters</span
                                    >
                                    <span
                                        class="ml-1.5 text-xs font-normal text-muted-foreground/70"
                                        >&mdash; resolution & playback</span
                                    >
                                </div>
                                <div class="modal-params">
                                    <div class="param-row">
                                        <span class="param-label"
                                            >Harmonics</span
                                        >
                                        <span
                                            class="param-value fira-code"
                                            :style="{
                                                color: VIZ_COLORS.fourier,
                                            }"
                                            >N={{
                                                selectedItem.contourSettings
                                                    ?.n_harmonics ?? "?"
                                            }}</span
                                        >
                                    </div>
                                    <div class="param-row">
                                        <span class="param-label">Points</span>
                                        <span
                                            class="param-value fira-code"
                                            :style="{
                                                color: VIZ_COLORS.chebyshev,
                                            }"
                                            >{{
                                                selectedItem.contourSettings
                                                    ?.n_points ?? "?"
                                            }}</span
                                        >
                                    </div>
                                    <div class="param-row">
                                        <span class="param-label">Speed</span>
                                        <span class="param-value fira-code"
                                            >{{
                                                selectedItem.animationSettings
                                                    ?.speed ?? 1
                                            }}&times;</span
                                        >
                                    </div>
                                    <div class="param-row">
                                        <span class="param-label">Easing</span>
                                        <span
                                            class="param-value inline-flex items-center gap-1"
                                        >
                                            <EasingCurvePreview
                                                :easing="
                                                    easingName(selectedItem)
                                                "
                                                :size="18"
                                                color="hsl(var(--easing-accent))"
                                            />
                                            {{
                                                EASING_OPTIONS[
                                                    easingName(selectedItem)
                                                ]?.label
                                            }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- CTA -->
                            <button
                                class="callout-btn"
                                @click="goToVisualizer(selectedItem)"
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
    </div>
</template>

<style scoped>
@reference "tailwindcss";

.gallery-view {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    height: 100%;
}

/* ── Marquee gallery ── */
.marquee-gallery {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.5rem 0;
}

.marquee-track {
    overflow: hidden;
    flex-shrink: 0;
}

.marquee-track-placeholder {
    height: 19rem;
}

/* ── Marquee animation ── */
@keyframes marquee-left {
    0% {
        transform: translateX(0);
    }
    100% {
        transform: translateX(-50%);
    }
}
@keyframes marquee-right {
    0% {
        transform: translateX(-50%);
    }
    100% {
        transform: translateX(0);
    }
}

.marquee-strip {
    display: flex;
    gap: 1.25rem;
    width: max-content;
    padding: 0.5rem 0 1rem;
}

.marquee-strip[data-dir="left"] {
    animation: marquee-left var(--duration) linear infinite;
}
.marquee-strip[data-dir="right"] {
    animation: marquee-right var(--duration) linear infinite;
}

.marquee-track:hover .marquee-strip {
    animation-play-state: paused;
}

/* ── Card (cartoon-card style) ── */
.pokemon-card {
    cursor: pointer;
    border-radius: 0.75rem;
    border: 2px solid hsl(var(--foreground) / 0.15);
    background: hsl(var(--card));
    box-shadow: 3px 3px 0px 0px hsl(var(--foreground) / 0.08);
    overflow: hidden;
    width: 16rem;
    flex-shrink: 0;
    transition:
        transform 0.25s cubic-bezier(0.22, 1.6, 0.36, 1),
        box-shadow 0.2s ease,
        border-color 0.2s ease;
}
:deep(.dark) .pokemon-card,
:root.dark .pokemon-card {
    border-color: hsl(var(--foreground) / 0.12);
    box-shadow: 3px 3px 0px 0px hsl(var(--foreground) / 0.06);
}
.pokemon-card:hover {
    transform: translateY(-4px) scale(1.02);
    border-color: hsl(var(--foreground) / 0.25);
    box-shadow: 4px 4px 0px 0px hsl(var(--foreground) / 0.1);
}
.pokemon-card:active {
    transform: scale(0.99);
}

.card-inner {
    display: flex;
    flex-direction: column;
}

.card-image-frame {
    position: relative;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
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
    border-bottom: 1px solid hsl(var(--foreground) / 0.08);
}

.card-path-primary {
    width: 100%;
    height: 100%;
    opacity: 0.8;
    pointer-events: none;
}

/* ── Header ── */
.card-header {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem 0.25rem;
}
.card-slug {
    @apply text-sm;
    color: hsl(var(--muted-foreground));
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
}
.card-copy {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 0.25rem;
    border: none;
    background: none;
    color: hsl(var(--muted-foreground));
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.15s;
}
.card-copy:hover {
    color: hsl(var(--foreground));
    background: hsl(var(--foreground) / 0.06);
}
.card-time {
    @apply text-sm;
    color: hsl(var(--foreground) / 0.35);
    white-space: nowrap;
    flex-shrink: 0;
}

/* ── Basis pills (shared card + modal) ── */
.card-bases {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    padding: 0.125rem 0.75rem;
}
.basis-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    @apply text-sm;
    font-weight: 500;
    background: color-mix(in srgb, var(--pill-c) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--pill-c) 30%, transparent);
    color: var(--pill-c);
    white-space: nowrap;
}

/* ── Footer: meta + easing ── */
.card-footer {
    padding: 0.375rem 0.75rem 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.card-meta {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    @apply text-sm;
    color: hsl(var(--muted-foreground));
    flex: 1;
}
.meta-dot {
    color: hsl(var(--foreground) / 0.15);
}

/* ═══ Modal (cartoon-card style) ═══ */
.modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal);
    padding: 1rem;
    background: hsl(var(--background) / 0.7);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
}
.modal-card {
    position: relative;
    background: hsl(var(--card));
    border-radius: 0.75rem;
    border: 2px solid hsl(var(--foreground) / 0.15);
    overflow: hidden;
    max-width: 28rem;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow:
        4px 4px 0px 0px hsl(var(--foreground) / 0.08),
        0 24px 64px hsl(var(--foreground) / 0.12);
}
.modal-close {
    position: absolute;
    top: 0.625rem;
    right: 0.625rem;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 9999px;
    border: none;
    background: hsl(var(--background) / 0.7);
    backdrop-filter: blur(8px);
    color: hsl(var(--foreground));
    cursor: pointer;
    transition: all 0.15s;
}
.modal-close:hover {
    background: hsl(var(--background) / 0.9);
}

.modal-image-frame {
    position: relative;
    aspect-ratio: 16 / 10;
    border-bottom: 1px solid hsl(var(--foreground) / 0.08);
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

/* Layer toggle buttons */
.modal-layer-toggles {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    z-index: 5;
    display: flex;
    gap: 0.25rem;
}
.layer-toggle-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 9999px;
    border: 1.5px solid hsl(var(--foreground) / 0.1);
    background: hsl(var(--background) / 0.6);
    backdrop-filter: blur(8px);
    color: hsl(var(--muted-foreground));
    cursor: pointer;
    padding: 0;
    transition: all 0.15s ease;
}
.layer-toggle-btn:hover {
    background: hsl(var(--background) / 0.85);
    border-color: hsl(var(--foreground) / 0.2);
    color: hsl(var(--foreground));
    transform: scale(1.08);
}
.layer-toggle-btn:active {
    transform: scale(0.92);
}
.layer-toggle-btn.active {
    background: hsl(var(--foreground) / 0.1);
    border-color: hsl(var(--foreground) / 0.25);
    color: hsl(var(--foreground));
}

.modal-body {
    padding: 0.625rem 0.875rem 0.875rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

/* Slug row */
.modal-slug-row {
    display: flex;
    align-items: center;
    gap: 0.375rem;
}

/* Info cards for decomp & params */
.modal-info-card {
    background: hsl(var(--muted) / 0.3);
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
}
.modal-slug {
    @apply text-sm;
    color: hsl(var(--muted-foreground));
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.modal-section-header {
    padding-bottom: 0.25rem;
}

.modal-bases {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
}

/* Parameter rows */
.modal-params {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 1rem;
}
.param-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.25rem 0;
    border-bottom: 1px solid hsl(var(--foreground) / 0.04);
}
.param-row:nth-last-child(-n + 2) {
    border-bottom: none;
}
.param-label {
    @apply text-sm;
    color: hsl(var(--muted-foreground));
}
.param-value {
    @apply text-base;
    font-weight: 600;
    color: hsl(var(--foreground));
}

.callout-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    margin-top: 0.625rem;
    padding: 0.5rem 1.25rem;
    border-radius: 0.625rem;
    border: 2px solid hsl(var(--foreground) / 0.12);
    @apply text-base;
    font-weight: 600;
    color: hsl(var(--foreground));
    background: hsl(var(--foreground) / 0.03);
    cursor: pointer;
    text-decoration: none;
    transition: all 0.15s ease;
}
.callout-btn:hover {
    background: hsl(var(--foreground) / 0.07);
    border-color: hsl(var(--foreground) / 0.2);
}
.callout-btn:active {
    transform: scale(0.98);
}
.callout-btn .fourier-f {
    font-size: 1.1em;
    opacity: 0.7;
}

/* ── Global focus ring removal for icon buttons ── */
.layer-toggle-btn:focus,
.layer-toggle-btn:focus-visible,
.modal-close:focus,
.modal-close:focus-visible,
.card-copy:focus,
.card-copy:focus-visible {
    outline: none;
    box-shadow: none;
}

/* ── Transitions ── */
.modal-enter-active {
    transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}
.modal-enter-from {
    opacity: 0;
    transform: scale(0.92);
}
.modal-leave-to {
    opacity: 0;
    transform: scale(0.95);
}
</style>
