<script setup lang="ts">
import { ref, computed, defineAsyncComponent, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useWorkspaceStore } from "@/stores/workspace";
import { useGalleryStore } from "@/stores/gallery";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";
import { toast } from "@mkbabb/glass-ui/toast";
import { ERROR_TOAST } from "@/lib/toast-policy";
import { useDestructiveConfirm } from "@/composables/useDestructiveConfirm";
import { problemDetail } from "@/lib/api-problem";
import * as api from "@/lib/api";
import type { GalleryTier, Visualization, WorkspaceDraft } from "@/lib/types";
import { Layers, Trash2, Crown, StarOff } from "@lucide/vue";

import { SegmentedTabs, type SegmentedTabOption } from "@mkbabb/glass-ui/tabs";
import { Button } from "@mkbabb/glass-ui/button";
import GallerySearchBar from "./gallery/GallerySearchBar.vue";
import GalleryFeaturedCarousel from "./gallery/GalleryFeaturedCarousel.vue";
import GalleryInfiniteGrid from "./gallery/GalleryInfiniteGrid.vue";
import GalleryCardModal from "./gallery/GalleryCardModal.vue";
import GalleryAdminBanner from "./gallery/GalleryAdminBanner.vue";
import GalleryDraftsSection from "./gallery/GalleryDraftsSection.vue";
import BatchActionBar from "./gallery/BatchActionBar.vue";
import ConfirmDialog from "@/components/shared/ConfirmDialog.vue";

const AdminUserList = defineAsyncComponent(() => import("./gallery/AdminUserList.vue"));
const AdminFlaggedPanel = defineAsyncComponent(() => import("./gallery/AdminFlaggedPanel.vue"));
const AdminAuditLog = defineAsyncComponent(() => import("./gallery/AdminAuditLog.vue"));

const route = useRoute();
const router = useRouter();
const workspace = useWorkspaceStore();
const gallery = useGalleryStore();
const auth = useAuthStore();
const { isLoggedIn } = storeToRefs(auth);

type GalleryTab = "gallery" | "drafts" | "users" | "flagged" | "audit";
const activeTab = ref<GalleryTab>("gallery");
/**
 * X·F F.W4 `.d` — GCM-3 (the GCM restore family's core): the modal held a
 * SNAPSHOT.
 *
 * `selectedEntry` was a `ref<Visualization>` assigned the object the card
 * emitted, so once the modal was open nothing the store learned could reach it:
 * the like count was frozen at its open-time value (which is why GCM-2's
 * "mutation" looks fictional and why GCM-36 cannot be certified against it), and
 * a tier set from inside the modal re-rendered the tier chip from the stale copy.
 * Keying on the SLUG and resolving through the store makes the modal a view of
 * the entity rather than a photograph of it — and it is what makes GCM-24's
 * in-place `patchEntry` visible where the user performed the action.
 *
 * ⊘ The sibling half of this repair unit — GCM-1 / GCM-25 / VV-BLK-1 — lives in
 * `VisualizationView.vue` and `stores/workspace.ts`, outside this unit's writable
 * set. Escalated whole rather than half-landed; see the unit receipt.
 */
const selectedSlug = ref<string | null>(null);
const selectedEntry = computed<Visualization | null>(
    () => gallery.entries.find((e) => e.slug === selectedSlug.value) ?? null,
);
const viewedHashes = ref(new Set<string>());
/** UIA-F-103: the ONE draft being published; the others stay live. */
const publishingSlug = ref<string | null>(null);

const tabOptions = computed(() => {
    const tabs: SegmentedTabOption<GalleryTab>[] = [
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

// UIA-F-47: a draft that has become a published entity (its slug recorded in
// `savedSnapshots` by `publishDraft`) leaves the list. The old test read the
// slugs against the first page of the gallery, and nothing ever wrote them.
const unpublishedDrafts = computed(() =>
    workspace.drafts.filter((d) => !d.savedSnapshots?.length),
);

// X.F.W14.u — UIA-F-40: the three loads are independent, so they run in
// parallel. They ran in series behind `activateAdmin`, which awaits the admin
// stats: a slow stats call held back `/api/visualizations` and the drafts, and
// the banner's skeletons sat above the empty-state CTA while entries existed.
// The grid fetch starts first, so its `loading` flag is set before the first
// frame and the empty state waits for a real answer.
onMounted(async () => {
    const adminToken = route.query.admin as string | undefined;
    await Promise.all([
        gallery.resetAndFetch(),
        workspace.refreshDrafts(),
        adminToken
            ? gallery.activateAdmin(adminToken).then(() => router.replace({ query: {} }))
            : undefined,
    ]);
});

// Debounced search
let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(() => gallery.searchQuery, () => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => gallery.resetAndFetch(), 300);
});

// X.F.W14U.gallery — UIA-F-190: ONE rule for the local drafts. They live in
// this browser (IndexedDB), and a fresh load lists them logged in or out; an
// auth change now reloads them the same way the mount does. Logging out used to
// empty the list and throw the viewer off the Drafts tab, so the same drafts
// were visible or not depending on how the page had been reached. The like
// state is the session user's, so it goes with the session.
watch(isLoggedIn, () => {
    gallery.likedSlugs = new Set();
    workspace.refreshDrafts();
});

// Immediate refetch on filter/sort change
watch(
    [() => gallery.sort, () => gallery.tierFilter, () => gallery.basisFilter],
    () => gallery.resetAndFetch(),
);

function openModal(entry: Visualization) {
    selectedSlug.value = entry.slug;
    gallery.readLike(entry.slug);
    if (!viewedHashes.value.has(entry.slug)) {
        viewedHashes.value.add(entry.slug);
        gallery.recordView(entry.slug);
    }
}

/**
 * UIA-F-184: a filtered listing that comes back empty says so and offers the
 * way back; "No visualizations yet." is only true of an unfiltered gallery.
 */
const isFiltered = computed(
    () =>
        gallery.searchQuery.trim() !== "" ||
        gallery.tierFilter !== "all" ||
        gallery.basisFilter !== "",
);

function clearFilters() {
    gallery.searchQuery = "";
    gallery.tierFilter = "all";
    gallery.basisFilter = "";
}

// X.F.W3 repair 1 (g15, leg 3) — the inline union retires onto `GalleryTier`,
// its one canonical home. This is the tier handler the carousel and the grid
// both emit into, so an inline re-declaration here is the copy most likely to
// drift from the type the store actually stores.
async function handleSetTier(hash: string, tier: GalleryTier) {
    await gallery.setTier(hash, tier);
    if (gallery.adminMode) gallery.refreshAdminStats();
}

/**
 * X.F.W3 `.d` — `fr-AdminUserList FR-AUL-28`'s FOURTH consumer, the one the
 * enumeration missed: the frontend's LAST live `window.confirm()`, on the exact
 * verb the batch Dialog twenty lines below already styles.
 *
 * The ratified cure law is the in-file Dialog pattern over `./dialog` — the
 * retired `./confirm-dialog` primitive is ABSENT at the adopted 8.0.0 pin
 * (verified in the export map: 70 keys, no `./confirm-dialog`), so a swap onto
 * it is not available and was never the cure. The two sibling admin surfaces
 * already hold the house shape — ONE dialog over a discriminated `pending`
 * intent — and this file held half of it (`pendingBatch`) beside a native
 * modal. The half becomes the whole: `pending` carries `single` or `batch`, and
 * the native dialog dies.
 *
 * What the native call cost, beyond style: `confirm()` is synchronous and
 * unthemeable, it cannot name what it is about to delete, it is suppressible
 * per-origin by the browser (a suppressed `confirm()` returns `false`, so the
 * delete silently never happens), and it announces nothing an assistive
 * technology can tie back to the row that summoned it.
 */
function handleDelete(hash: string) {
    // FR-AFP-8's one-token rider, applied at this surface too: the confirm
    // names the ENTITY that gets deleted — the visualization `slug` — never a
    // friendlier string that could denote something else.
    confirmation.ask({ kind: "single", slug: hash, label: hash });
}

async function performSingleDelete(hash: string) {
    await gallery.deleteEntry(hash);
    if (selectedSlug.value === hash) selectedSlug.value = null;
    // FR-GFC-20 (= FR-AUL-22's sibling): a mutation evicts its victim from the
    // selection set. A deleted slug that stayed checked kept the batch toolbar
    // claiming a count that included an entity the server no longer has, and the
    // next batch would have issued an operation against it.
    forgetSelected(hash);
}

// ── A.W5.c: gallery multi-select + batch ─────────────────────────────────
// `selectedHashes` carries the visualization slugs currently checked in admin
// mode. The batch toolbar surfaces when the set is non-empty; the action
// routes through the destructive-confirm dialog before calling
// `batchGallery` against the CRUD CONTRACT `BatchResponse` shape.
type GalleryBatchAction = "delete" | "feature" | "unfeature";

/**
 * FR-AUL-28: ONE destructive-confirm intent for this surface, in the shape both
 * admin siblings already use. `single` is the row delete the native
 * `confirm()` used to carry; `batch` is what `pendingBatch` carried before.
 */
type PendingIntent =
    | { kind: "single"; slug: string; label: string }
    | { kind: "batch"; action: GalleryBatchAction; hashes: string[] };

const selectedHashes = ref<Set<string>>(new Set());
/** X.F.W14V.au4 — A2-FO-L1-9: the intent machine is `useDestructiveConfirm`'s. */
const confirmation = useDestructiveConfirm<PendingIntent>();
const pending = confirmation.pending;

function forgetSelected(hash: string) {
    if (!selectedHashes.value.has(hash)) return;
    const next = new Set(selectedHashes.value);
    next.delete(hash);
    selectedHashes.value = next;
}

function toggleEntrySelected(hash: string, checked: boolean) {
    const next = new Set(selectedHashes.value);
    if (checked) next.add(hash);
    else next.delete(hash);
    selectedHashes.value = next;
}

/** UIA-F-249: a batch verb is enabled only when it would change a selected entry. */
const selectedTiers = computed(() => {
    const tiers = new Set<string>();
    for (const e of gallery.entries) if (selectedHashes.value.has(e.slug)) tiers.add(e.tier ?? "normal");
    return tiers;
});
const canFeature = computed(() => [...selectedTiers.value].some((t) => t !== "featured"));
const canUnfeature = computed(() => selectedTiers.value.has("featured"));

function clearGallerySelection() {
    selectedHashes.value = new Set();
}

function askBatchGallery(action: GalleryBatchAction) {
    if (!selectedHashes.value.size) return;
    confirmation.ask({ kind: "batch", action, hashes: Array.from(selectedHashes.value) });
}

async function performBatchGallery(target: Extract<PendingIntent, { kind: "batch" }>) {
    const token = auth.getAdminToken();
    if (!token) {
        toast({ ...ERROR_TOAST, title: "Admin token missing" });
        return;
    }
    const result = await api.batchGallery(token, target.action, target.hashes);
    const verb =
        target.action === "delete"
            ? "Deleted"
            : target.action === "feature"
              ? "Featured"
              : "Unfeatured";
    const n = result.affected;
    toast({ title: `${verb} ${n} ${n === 1 ? "entry" : "entries"}`, tone: "success" });
    if (result.errors?.length) {
        for (const err of result.errors) toast({ ...ERROR_TOAST, title: err });
    }
    clearGallerySelection();
    await gallery.resetAndFetch();
    if (gallery.adminMode) gallery.refreshAdminStats();
}

/**
 * FR-AFP-41's rule stands (closing clears the intent); the dialog now also
 * locks while the act is in flight and closes after it settles.
 */
function performConfirmed() {
    return confirmation.confirm(async (target) => {
        try {
            if (target.kind === "single") await performSingleDelete(target.slug);
            else await performBatchGallery(target);
        } catch (e: unknown) {
            toast({ ...ERROR_TOAST, title: "Action failed", description: problemDetail(e) });
        }
    });
}

const confirmTitle = computed(() => {
    const p = pending.value;
    if (!p) return "";
    if (p.kind === "single") return "Delete this gallery entry?";
    const n = p.hashes.length;
    const noun = n === 1 ? "entry" : "entries";
    return p.action === "delete" ? `Delete ${n} ${noun}?` : p.action === "feature" ? `Feature ${n} ${noun}?` : `Unfeature ${n} ${noun}?`;
});
const confirmLabel = computed(() => {
    const p = pending.value;
    if (!p || p.kind === "single" || p.action === "delete") return "Delete";
    return p.action === "feature" ? "Feature" : "Unfeature";
});

// Clear selection when the user leaves admin mode or switches tabs away
// from the gallery (selections should not persist into another view).
watch(() => gallery.adminMode, (on) => { if (!on) clearGallerySelection(); });
watch(activeTab, (tab) => { if (tab !== "gallery") clearGallerySelection(); });

// UIA-F-103 ⊕ UIA-F-248: the store owns the publish's one error channel; this
// host only marks which draft is busy and reloads the list afterwards.
async function handlePublishDraft(draft: WorkspaceDraft) {
    publishingSlug.value = draft.imageSlug;
    try {
        if (await gallery.publishDraft(draft)) await workspace.refreshDrafts();
    } finally {
        publishingSlug.value = null;
    }
}
</script>

<template>
    <div class="flex flex-col gap-4 overflow-y-auto h-full py-4">
        <!-- Tab toggle + search (tight grouping). X.F.W14V.au4 — A2-FO-L3-3:
             at >= sm one toolbar row — the tabs lead, the search trails at its
             own measure (`--search-measure`); the 512 px field left 896 px of
             its own row empty and the content began a whole row lower. Below sm
             the tabs, then the search (the "N loaded" row left at UIA-F-247). -->
        <div class="flex flex-col gap-1.5 px-[var(--page-gutter)] sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <!-- X.F.W14.u — UIA-F-41 (consumer half): the strip scrolls in its
                 own inline track. The column is `overflow-y: auto`, which makes
                 its `overflow-x` compute to `auto` as well, so at 390 the 5-tab
                 admin strip (456 px in a 358 px column) turned the whole column
                 into a sideways scroller and focusing a tab slid every section
                 ~80 px left. A producer overflow track or compact mode for
                 SegmentedTabs is the glass half, routed under O-59. -->
            <div class="min-w-0 overflow-x-auto [scrollbar-width:none]">
                <SegmentedTabs variant="underline"
                    :options="tabOptions"
                    v-model="activeTab"
                />
            </div>
            <GallerySearchBar
                v-if="activeTab === 'gallery'"
                class="sm:min-w-0 sm:flex-1 sm:justify-end"
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
                :error="gallery.adminStatsError"
                @logout="gallery.deactivateAdmin()"
            />
            <GalleryFeaturedCarousel
                v-if="featuredEntries.length"
                :entries="featuredEntries"
                :admin-mode="gallery.adminMode"
                :liked-hashes="gallery.likedSlugs"
                :selected-hashes="selectedHashes"
                @card-click="openModal"
                @like="gallery.toggleLike"
                @set-tier="handleSetTier"
                @delete="handleDelete"
                @toggle-select="toggleEntrySelected"
            />
            <!-- Empty state. X·F F.W4 §3 D1 — RULED DELETE: the D.W4.c
                 "living preview band" never shipped. The band was mounted on
                 `featuredEntries.length >= 4` INSIDE a block guarded by
                 `!gallery.entries.length`, and `featuredEntries` is a filter OF
                 `gallery.entries` — |filter(S)| ≤ |S|, so the predicate read
                 `0 >= 4` for every input. The CTA is what the empty gallery
                 always rendered, and it is what it renders now. -->
            <div
                v-if="!gallery.entries.length && !gallery.loading"
                class="flex flex-col items-center justify-center flex-1 gap-4 text-muted-foreground py-6"
            >
                <div v-if="isFiltered" class="flex flex-col items-center gap-3" role="status">
                    <Layers class="h-12 w-12 opacity-30" aria-hidden="true" />
                    <p class="text-base font-medium">
                        <template v-if="gallery.searchQuery.trim()">No visualizations match “{{ gallery.searchQuery.trim() }}”.</template>
                        <template v-else>No visualizations match these filters.</template>
                    </p>
                    <Button emphasis="secondary" @click="clearFilters">Clear search and filters</Button>
                </div>
                <div v-else class="flex flex-col items-center gap-3">
                    <Layers class="h-12 w-12 opacity-30" aria-hidden="true" />
                    <p class="text-base font-medium">No visualizations yet.</p>
                    <Button emphasis="secondary" @click="router.push('/visualize')">
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
                :liked-hashes="gallery.likedSlugs"
                :selected-hashes="selectedHashes"
                @load-more="gallery.fetchNextPage()"
                @card-click="openModal"
                @like="gallery.toggleLike"
                @set-tier="handleSetTier"
                @delete="handleDelete"
                @toggle-select="toggleEntrySelected"
            />

            <!-- X.F.W3 `.d` — `FR-AUL-51`/`FR-AUL-52`: the gallery's half of the
                 toolbar authored twice. The chrome — role, sticky edge, z-tier,
                 plate, the clear control's un-clamped size literal, the
                 `entr(ies)` dialect — is now `BatchActionBar`'s, decided once;
                 the inline inset stays here because it is this column's padding
                 context, and the verbs stay here because they are this
                 surface's domain. -->
            <BatchActionBar
                v-if="gallery.adminMode"
                :count="selectedHashes.size"
                noun="entry"
                noun-plural="entries"
                label="Batch gallery actions"
                class="mx-4"
                @clear="clearGallerySelection"
            >
                <Button
                    emphasis="secondary"
                    size="sm"
                    :disabled="!canFeature"
                    @click="askBatchGallery('feature')"
                >
                    <Crown class="mr-1 size-3.5" aria-hidden="true" />
                    Feature
                </Button>
                <Button
                    emphasis="secondary"
                    size="sm"
                    :disabled="!canUnfeature"
                    @click="askBatchGallery('unfeature')"
                >
                    <StarOff class="mr-1 size-3.5" aria-hidden="true" />
                    Unfeature
                </Button>
                <Button
                    emphasis="primary" tone="destructive"
                    size="sm"
                    @click="askBatchGallery('delete')"
                >
                    <Trash2 class="mr-1 size-3.5" aria-hidden="true" />
                    Delete
                </Button>
            </BatchActionBar>
        </template>

        <!-- Drafts tab -->
        <template v-if="activeTab === 'drafts'">
            <div
                v-if="!unpublishedDrafts.length"
                class="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground"
            >
                <Layers class="h-12 w-12 opacity-30" aria-hidden="true" />
                <p class="text-base font-medium">No drafts yet.</p>
                <p class="text-sm">Upload an image in the Visualizer to create a draft.</p>
                <!-- UIA-F-189: the empty Drafts state carries its action. -->
                <Button emphasis="secondary" @click="router.push('/visualize')">
                    Open the Visualizer →
                </Button>
            </div>
            <GalleryDraftsSection
                v-else
                :drafts="unpublishedDrafts"
                :publishing-slug="publishingSlug"
                @publish="handlePublishDraft"
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
            :is-liked="gallery.likedSlugs.has(selectedEntry.slug)"
            @close="selectedSlug = null"
            @like="gallery.toggleLike"
            @open-visualizer="(slug) => { selectedSlug = null; router.push(`/v/${slug}`); }"
            @set-tier="handleSetTier"
        />

        <!-- X.F.W3 `.d` / FR-AUL-28 — ONE destructive-confirm dialog for this
             surface, carrying both intents. The `single` arm is what
             `window.confirm("Delete this gallery entry?")` used to be: it now
             NAMES the entry it is about to delete, which the native modal
             structurally could not. -->
        <ConfirmDialog
            :open="confirmation.open.value"
            :busy="confirmation.busy.value"
            :title="confirmTitle"
            :confirm-label="confirmLabel"
            :tone="pending?.kind === 'single' || pending?.action === 'delete' ? 'destructive' : 'neutral'"
            @update:open="confirmation.setOpen"
            @confirm="performConfirmed"
        >
            <template v-if="pending?.kind === 'single'">
                This shall permanently delete
                <span class="font-mono">{{ pending.label }}</span>.
                The action is irrevocable.
            </template>
            <template v-else-if="pending?.action === 'delete'">
                This shall permanently delete the selected gallery entries.
                The action is irrevocable.
            </template>
            <template v-else-if="pending?.action === 'feature'">
                The selected entries shall be promoted to the featured tier.
            </template>
            <template v-else-if="pending?.action === 'unfeature'">
                The selected entries shall be returned to the normal tier.
            </template>
        </ConfirmDialog>
    </div>
</template>
