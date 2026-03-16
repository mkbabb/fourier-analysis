<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useWorkspaceStore } from "@/stores/workspace";
import { useGalleryStore } from "@/stores/gallery";
import { useUserAuth } from "@/composables/useUserAuth";
import { useToast } from "@/composables/useToast";
import type { GalleryEntry, WorkspaceDraft } from "@/lib/types";
import { Layers } from "lucide-vue-next";

import UnderlineTabs from "@/components/ui/UnderlineTabs.vue";
import GallerySearchBar from "./gallery/GallerySearchBar.vue";
import GalleryFeaturedCarousel from "./gallery/GalleryFeaturedCarousel.vue";
import GalleryMarquee from "./gallery/GalleryMarquee.vue";
import GalleryGrid from "./gallery/GalleryGrid.vue";
import GalleryCardModal from "./gallery/GalleryCardModal.vue";
import GalleryAdminBanner from "./gallery/GalleryAdminBanner.vue";
import GalleryDraftsSection from "./gallery/GalleryDraftsSection.vue";

const route = useRoute();
const router = useRouter();
const workspace = useWorkspaceStore();
const gallery = useGalleryStore();
const { isLoggedIn } = useUserAuth();
const { toast } = useToast();

const activeTab = ref<"gallery" | "drafts">("gallery");
const selectedEntry = ref<GalleryEntry | null>(null);
const likedHashes = ref(new Set<string>());
const viewedHashes = ref(new Set<string>());
const publishing = ref(false);

const tabOptions = [
    { label: "Gallery", value: "gallery" },
    { label: "Drafts", value: "drafts" },
];

const featuredEntries = computed(() =>
    gallery.entries.filter((e) => e.tier === "featured"),
);

const nonFeaturedEntries = computed(() =>
    gallery.entries.filter((e) => e.tier !== "featured"),
);

// Filter out drafts whose snapshots are already published
const publishedHashes = computed(() =>
    new Set(gallery.entries.map((e) => e.snapshot_hash)),
);
const unpublishedDrafts = computed(() =>
    workspace.drafts.filter((d) =>
        !d.savedSnapshots?.length ||
        !d.savedSnapshots.every((h) => publishedHashes.value.has(h)),
    ),
);

onMounted(async () => {
    const adminToken = route.query.admin as string | undefined;
    if (adminToken) {
        await gallery.activateAdmin(adminToken);
        router.replace({ query: {} });
    }
    await workspace.refreshDrafts();
    await gallery.fetchPage(1);
});

// Debounced search
let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(() => gallery.searchQuery, () => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => gallery.fetchPage(1), 300);
});

// Clear drafts and switch tab on logout
watch(isLoggedIn, (loggedIn) => {
    if (!loggedIn) {
        workspace.drafts = [];
        if (activeTab.value === "drafts") activeTab.value = "gallery";
    } else {
        workspace.refreshDrafts();
    }
});

// Immediate refetch on filter/sort change
watch(
    [() => gallery.sort, () => gallery.tierFilter, () => gallery.basisFilter],
    () => gallery.fetchPage(1),
);

function openModal(entry: GalleryEntry) {
    selectedEntry.value = entry;
    if (!viewedHashes.value.has(entry.snapshot_hash)) {
        viewedHashes.value.add(entry.snapshot_hash);
        gallery.recordView(entry.snapshot_hash);
    }
}

async function handleLike(hash: string) {
    const result = await gallery.like(hash);
    if (!result) return;
    const s = new Set(likedHashes.value);
    result.liked ? s.add(hash) : s.delete(hash);
    likedHashes.value = s;
}

async function handleSetTier(hash: string, tier: "featured" | "saved" | "normal") {
    await gallery.setTier(hash, tier);
    if (gallery.adminMode) gallery.refreshAdminStats();
}

async function handleDelete(hash: string) {
    if (!confirm("Delete this gallery entry?")) return;
    await gallery.deleteEntry(hash);
    if (selectedEntry.value?.snapshot_hash === hash) selectedEntry.value = null;
}

async function handlePublishDraft(draft: WorkspaceDraft) {
    publishing.value = true;
    try {
        await gallery.publishDraft(draft);
    } catch (e: any) {
        toast(e.message ?? "Publish failed", "error");
    } finally {
        publishing.value = false;
    }
}
</script>

<template>
    <div class="flex flex-col gap-4 overflow-y-auto h-full py-4">
        <!-- Tab toggle + search (tight grouping) -->
        <div class="flex flex-col gap-1.5 px-4">
            <UnderlineTabs
                :options="tabOptions"
                :model-value="activeTab"
                @update:model-value="activeTab = $event as 'gallery' | 'drafts'"
            />
            <GallerySearchBar
                v-if="activeTab === 'gallery'"
                :search-query="gallery.searchQuery"
                :sort="gallery.sort"
                :tier-filter="gallery.tierFilter"
                :basis-filter="gallery.basisFilter"
                @update:search-query="gallery.searchQuery = $event"
                @update:sort="gallery.sort = $event"
                @update:tier-filter="gallery.tierFilter = $event"
                @update:basis-filter="gallery.basisFilter = $event"
            />
        </div>

        <!-- Gallery tab -->
        <template v-if="activeTab === 'gallery'">
            <GalleryAdminBanner
                v-if="gallery.adminMode"
                :stats="gallery.adminStats"
                :loading="gallery.adminStatsLoading"
                @logout="gallery.deactivateAdmin()"
            />
            <GalleryFeaturedCarousel
                v-if="featuredEntries.length"
                :entries="featuredEntries"
                :admin-mode="gallery.adminMode"
                :liked-hashes="likedHashes"
                @card-click="openModal"
                @like="handleLike"
                @set-tier="handleSetTier"
                @delete="handleDelete"
            />
            <!-- Marquee (shown when ≥ 4 non-featured entries) -->
            <GalleryMarquee
                v-if="nonFeaturedEntries.length >= 4"
                :entries="nonFeaturedEntries"
                :admin-mode="gallery.adminMode"
                :liked-hashes="likedHashes"
                @card-click="openModal"
                @like="handleLike"
                @set-tier="handleSetTier"
                @delete="handleDelete"
            />

            <!-- Grid fallback (shown when < 4 non-featured entries, or no entries) -->
            <template v-else>
                <div
                    v-if="!gallery.entries.length && !gallery.loading"
                    class="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground"
                >
                    <Layers class="h-12 w-12 opacity-30" />
                    <p class="text-base font-medium">No visualizations yet.</p>
                    <p class="text-sm opacity-70">Upload an image in the Visualizer to get started.</p>
                </div>

                <GalleryGrid
                    v-else
                    :entries="nonFeaturedEntries"
                    :page="gallery.page"
                    :pages="gallery.pages"
                    :total="gallery.total"
                    :loading="gallery.loading"
                    :admin-mode="gallery.adminMode"
                    :liked-hashes="likedHashes"
                    @card-click="openModal"
                    @like="handleLike"
                    @set-tier="handleSetTier"
                    @delete="handleDelete"
                    @page-change="gallery.fetchPage($event)"
                />
            </template>
        </template>

        <!-- Drafts tab -->
        <template v-if="activeTab === 'drafts'">
            <div
                v-if="!unpublishedDrafts.length"
                class="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground"
            >
                <Layers class="h-12 w-12 opacity-30" />
                <p class="text-base font-medium">No drafts yet.</p>
                <p class="text-sm opacity-70">Upload an image in the Visualizer to create a draft.</p>
            </div>
            <GalleryDraftsSection
                v-else
                :drafts="unpublishedDrafts"
                :publishing="publishing"
                @publish="handlePublishDraft"
                @open="router.push(`/w/${$event}`)"
            />
        </template>

        <GalleryCardModal
            v-if="selectedEntry"
            :entry="selectedEntry"
            :admin-mode="gallery.adminMode"
            :is-liked="likedHashes.has(selectedEntry.snapshot_hash)"
            @close="selectedEntry = null"
            @like="handleLike"
            @open-visualizer="(slug) => { selectedEntry = null; router.push(`/w/${slug}`); }"
            @set-tier="handleSetTier"
        />
    </div>
</template>
