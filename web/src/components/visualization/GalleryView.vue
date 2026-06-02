<script setup lang="ts">
import { ref, computed, defineAsyncComponent, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useWorkspaceStore } from "@/stores/workspace";
import { useGalleryStore } from "@/stores/gallery";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/composables/useToast";
import * as api from "@/lib/api";
import type { Visualization, WorkspaceDraft } from "@/lib/types";
import { Layers, Trash2, Crown, X } from "lucide-vue-next";

import { UnderlineTabs } from "@mkbabb/glass-ui/tabs";
import { Button } from "@mkbabb/glass-ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@mkbabb/glass-ui/dialog";
import GallerySearchBar from "./gallery/GallerySearchBar.vue";
import GalleryFeaturedCarousel from "./gallery/GalleryFeaturedCarousel.vue";
import GalleryInfiniteGrid from "./gallery/GalleryInfiniteGrid.vue";
import GalleryMarquee from "./gallery/GalleryMarquee.vue";
import GalleryCardModal from "./gallery/GalleryCardModal.vue";
import GalleryAdminBanner from "./gallery/GalleryAdminBanner.vue";
import GalleryDraftsSection from "./gallery/GalleryDraftsSection.vue";

const AdminUserList = defineAsyncComponent(() => import("./gallery/AdminUserList.vue"));
const AdminFlaggedPanel = defineAsyncComponent(() => import("./gallery/AdminFlaggedPanel.vue"));
const AdminAuditLog = defineAsyncComponent(() => import("./gallery/AdminAuditLog.vue"));

const route = useRoute();
const router = useRouter();
const workspace = useWorkspaceStore();
const gallery = useGalleryStore();
const auth = useAuthStore();
const { isLoggedIn } = storeToRefs(auth);
const { toast } = useToast();

const activeTab = ref<"gallery" | "drafts" | "users" | "flagged" | "audit">("gallery");
const selectedEntry = ref<Visualization | null>(null);
const likedHashes = ref(new Set<string>());
const viewedHashes = ref(new Set<string>());
const publishing = ref(false);

const tabOptions = computed(() => {
    const tabs = [
        { label: "Gallery", value: "gallery" },
        { label: "Drafts", value: "drafts" },
    ];
    if (gallery.adminMode) {
        tabs.push(
            { label: "Users", value: "users" },
            { label: "Flagged", value: "flagged" },
            { label: "Audit Log", value: "audit" },
        );
    }
    return tabs;
});

const featuredEntries = computed(() =>
    gallery.entries.filter((e) => e.tier === "featured"),
);

const nonFeaturedEntries = computed(() =>
    gallery.entries.filter((e) => e.tier !== "featured"),
);

// Filter out drafts whose snapshots are already published
const publishedHashes = computed(() =>
    new Set(gallery.entries.map((e) => e.slug)),
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
    await gallery.resetAndFetch();
});

// Debounced search
let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(() => gallery.searchQuery, () => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => gallery.resetAndFetch(), 300);
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
    () => gallery.resetAndFetch(),
);

function openModal(entry: Visualization) {
    selectedEntry.value = entry;
    if (!viewedHashes.value.has(entry.slug)) {
        viewedHashes.value.add(entry.slug);
        gallery.recordView(entry.slug);
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
    if (selectedEntry.value?.slug === hash) selectedEntry.value = null;
}

// ── A.W5.c: gallery multi-select + batch ─────────────────────────────────
// `selectedHashes` carries the visualization slugs currently checked in admin
// mode. The batch toolbar surfaces when the set is non-empty; the action
// routes through the destructive-confirm dialog before calling
// `batchGallery` against the CRUD CONTRACT `BatchResponse` shape.
type GalleryBatchAction = "delete" | "feature" | "unfeature";

const selectedHashes = ref<Set<string>>(new Set());
const batchDialogOpen = ref(false);
const pendingBatch = ref<{ action: GalleryBatchAction; hashes: string[] } | null>(null);

function toggleEntrySelected(hash: string, checked: boolean) {
    const next = new Set(selectedHashes.value);
    if (checked) next.add(hash);
    else next.delete(hash);
    selectedHashes.value = next;
}

function clearGallerySelection() {
    selectedHashes.value = new Set();
}

function askBatchGallery(action: GalleryBatchAction) {
    if (!selectedHashes.value.size) return;
    pendingBatch.value = { action, hashes: Array.from(selectedHashes.value) };
    batchDialogOpen.value = true;
}

async function performBatchGallery() {
    const pending = pendingBatch.value;
    batchDialogOpen.value = false;
    if (!pending) return;
    const token = auth.getAdminToken();
    if (!token) {
        toast("Admin token missing", "error");
        return;
    }
    try {
        const result = await api.batchGallery(token, pending.action, pending.hashes);
        const verb =
            pending.action === "delete"
                ? "Deleted"
                : pending.action === "feature"
                  ? "Featured"
                  : "Unfeatured";
        toast(`${verb} ${result.affected} entr(ies)`, "success");
        if (result.errors?.length) {
            for (const err of result.errors) toast(err, "error");
        }
        clearGallerySelection();
        await gallery.resetAndFetch();
        if (gallery.adminMode) gallery.refreshAdminStats();
    } catch (e: any) {
        toast(e.message ?? "Batch action failed", "error");
    } finally {
        pendingBatch.value = null;
    }
}

// Clear selection when the user leaves admin mode or switches tabs away
// from the gallery (selections should not persist into another view).
watch(() => gallery.adminMode, (on) => { if (!on) clearGallerySelection(); });
watch(activeTab, (tab) => { if (tab !== "gallery") clearGallerySelection(); });

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
                @update:model-value="activeTab = $event as typeof activeTab"
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
            <!-- Empty state (D.W4.c — option A: the GalleryMarquee earns
                 the empty state as a living preview band; a CTA Button
                 routes to /visualize so the empty surface becomes
                 actionable rather than inert. The marquee gracefully
                 hides itself when entries.length < 4 (its own template
                 guard), so a true cold-empty DB renders the CTA alone. -->
            <div
                v-if="!gallery.entries.length && !gallery.loading"
                class="flex flex-col items-center justify-center flex-1 gap-4 text-muted-foreground py-6"
            >
                <GalleryMarquee
                    v-if="featuredEntries.length >= 4"
                    :entries="featuredEntries"
                    :admin-mode="gallery.adminMode"
                    :liked-hashes="likedHashes"
                    @card-click="openModal"
                    @like="handleLike"
                    @set-tier="handleSetTier"
                    @delete="handleDelete"
                />
                <div class="flex flex-col items-center gap-3">
                    <Layers class="h-12 w-12 opacity-30" />
                    <p class="text-base font-medium">No visualizations yet.</p>
                    <Button variant="outline" @click="router.push('/visualize')">
                        Open the Visualizer →
                    </Button>
                </div>
            </div>

            <!-- Infinite scroll grid -->
            <GalleryInfiniteGrid
                v-if="gallery.entries.length || gallery.loading"
                :entries="nonFeaturedEntries"
                :loading="gallery.loading || gallery.loadingMore"
                :has-more="gallery.hasMore"
                :admin-mode="gallery.adminMode"
                :liked-hashes="likedHashes"
                :selected-hashes="selectedHashes"
                @load-more="gallery.fetchNextPage()"
                @card-click="openModal"
                @like="handleLike"
                @set-tier="handleSetTier"
                @delete="handleDelete"
                @toggle-select="toggleEntrySelected"
            />

            <!-- A.W5.c — gallery batch-action toolbar. Surfaces in admin mode
                 when one or more cards are selected; routes through the
                 destructive-confirm dialog before calling `batchGallery`. -->
            <div
                v-if="gallery.adminMode && selectedHashes.size > 0"
                role="toolbar"
                aria-label="Batch gallery actions"
                class="cartoon-card sticky bottom-2 z-20 mx-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
            >
                <span class="flex-1 text-xs text-muted-foreground">
                    {{ selectedHashes.size }} entr(ies) selected
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    class="text-xs"
                    @click="askBatchGallery('feature')"
                >
                    <Crown class="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                    Feature
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    class="text-xs"
                    @click="askBatchGallery('unfeature')"
                >
                    Unfeature
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    class="text-xs"
                    @click="askBatchGallery('delete')"
                >
                    <Trash2 class="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                    Delete
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7"
                    aria-label="Clear selection"
                    @click="clearGallerySelection"
                >
                    <X class="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
            </div>
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

        <!-- Users tab (admin-only) -->
        <template v-if="activeTab === 'users' && gallery.adminMode">
            <AdminUserList />
        </template>

        <!-- Flagged tab (admin-only) -->
        <template v-if="activeTab === 'flagged' && gallery.adminMode">
            <AdminFlaggedPanel />
        </template>

        <!-- Audit Log tab (admin-only) -->
        <template v-if="activeTab === 'audit' && gallery.adminMode">
            <AdminAuditLog />
        </template>

        <GalleryCardModal
            v-if="selectedEntry"
            :entry="selectedEntry"
            :admin-mode="gallery.adminMode"
            :is-liked="likedHashes.has(selectedEntry.slug)"
            @close="selectedEntry = null"
            @like="handleLike"
            @open-visualizer="(slug) => { selectedEntry = null; router.push(`/w/${slug}`); }"
            @set-tier="handleSetTier"
        />

        <!-- A.W5.c — gallery batch-confirm dialog. -->
        <Dialog v-model:open="batchDialogOpen">
            <DialogContent variant="opaque" class="max-w-sm">
                <DialogHeader>
                    <DialogTitle>
                        <template v-if="pendingBatch?.action === 'delete'">
                            Delete {{ pendingBatch.hashes.length }} entr(ies)?
                        </template>
                        <template v-else-if="pendingBatch?.action === 'feature'">
                            Feature {{ pendingBatch.hashes.length }} entr(ies)?
                        </template>
                        <template v-else-if="pendingBatch?.action === 'unfeature'">
                            Unfeature {{ pendingBatch.hashes.length }} entr(ies)?
                        </template>
                    </DialogTitle>
                    <DialogDescription>
                        <template v-if="pendingBatch?.action === 'delete'">
                            This shall permanently delete the selected gallery entries.
                            The action is irrevocable.
                        </template>
                        <template v-else-if="pendingBatch?.action === 'feature'">
                            The selected entries shall be promoted to the featured tier.
                        </template>
                        <template v-else-if="pendingBatch?.action === 'unfeature'">
                            The selected entries shall be returned to the normal tier.
                        </template>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="ghost" @click="batchDialogOpen = false">Cancel</Button>
                    <Button
                        :variant="pendingBatch?.action === 'delete' ? 'destructive' : 'default'"
                        @click="performBatchGallery"
                    >
                        <template v-if="pendingBatch?.action === 'delete'">Delete</template>
                        <template v-else-if="pendingBatch?.action === 'feature'">Feature</template>
                        <template v-else-if="pendingBatch?.action === 'unfeature'">Unfeature</template>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>
