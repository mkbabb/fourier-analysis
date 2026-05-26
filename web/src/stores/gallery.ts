import { defineStore } from "pinia";
import { ref } from "vue";
import type { GalleryEntry, GalleryTier, AdminStats, WorkspaceDraft } from "@/lib/types";
import * as api from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/composables/useToast";

export const useGalleryStore = defineStore("gallery", () => {
    const { toast } = useToast();

    // State
    const entries = ref<GalleryEntry[]>([]);
    const loading = ref(false);
    const sort = ref<"newest" | "views" | "likes">("newest");
    const tierFilter = ref<"all" | "featured" | "saved" | "normal">("all");
    const searchQuery = ref("");
    const basisFilter = ref("");
    const adminMode = ref(false);
    const adminStats = ref<AdminStats | null>(null);
    const adminStatsLoading = ref(false);

    // Cursor pagination state — the only paginated path through gallery.
    const nextCursor = ref<string | null>(null);
    const hasMore = ref(true);
    const loadingMore = ref(false);

    // Actions

    async function fetchNextPage() {
        if (!hasMore.value || loadingMore.value) return;
        loadingMore.value = true;
        try {
            const result = await api.listGalleryCursor({
                limit: 20,
                sort: sort.value,
                cursor: nextCursor.value || undefined,
                tier: tierFilter.value === "all" ? undefined : tierFilter.value,
                q: searchQuery.value || undefined,
                basis: basisFilter.value || undefined,
            });
            entries.value = [...entries.value, ...result.items];
            nextCursor.value = result.cursor.next_cursor;
            hasMore.value = result.cursor.has_more;
        } catch (e: any) {
            if (!api.isAbortError(e)) toast(e.message ?? "Failed to load gallery", "error");
        } finally {
            loadingMore.value = false;
        }
    }

    async function resetAndFetch() {
        entries.value = [];
        nextCursor.value = null;
        hasMore.value = true;
        loading.value = true;
        try {
            const result = await api.listGalleryCursor({
                limit: 20,
                sort: sort.value,
                tier: tierFilter.value === "all" ? undefined : tierFilter.value,
                q: searchQuery.value || undefined,
                basis: basisFilter.value || undefined,
            });
            entries.value = result.items;
            nextCursor.value = result.cursor.next_cursor;
            hasMore.value = result.cursor.has_more;
        } catch (e: any) {
            if (!api.isAbortError(e)) toast(e.message ?? "Failed to load gallery", "error");
        } finally {
            loading.value = false;
        }
    }

    async function activateAdmin(token: string) {
        try {
            await api.verifyAdmin(token);
            useAuthStore().adminLogin(token);
            adminMode.value = true;
            toast("Admin mode activated", "success");
            await refreshAdminStats();
        } catch (e: any) {
            toast(e.message ?? "Invalid admin token", "error");
        }
    }

    function deactivateAdmin() {
        useAuthStore().adminLogout();
        adminMode.value = false;
        adminStats.value = null;
    }

    async function refreshAdminStats() {
        const token = useAuthStore().getAdminToken();
        if (!token) return;
        adminStatsLoading.value = true;
        try {
            adminStats.value = await api.getAdminStats(token);
        } catch {
            // ignore
        } finally {
            adminStatsLoading.value = false;
        }
    }

    async function setTier(hash: string, tier: GalleryTier) {
        const token = useAuthStore().getAdminToken();
        if (!token) return;
        try {
            await api.setGalleryTier(token, hash, tier);
            await resetAndFetch();
            toast(`Tier set to ${tier}`, "success");
        } catch (e: any) {
            toast(e.message ?? "Failed to set tier", "error");
        }
    }

    async function deleteEntry(hash: string) {
        const token = useAuthStore().getAdminToken();
        if (!token) return;
        try {
            await api.deleteGalleryEntry(token, hash);
            await resetAndFetch();
            toast("Entry deleted", "success");
        } catch (e: any) {
            toast(e.message ?? "Failed to delete entry", "error");
        }
    }

    async function like(hash: string): Promise<{ liked: boolean; likes: number } | null> {
        try {
            const result = await api.toggleLike(hash);
            // Update entry in-place
            const idx = entries.value.findIndex((e) => e.snapshot_hash === hash);
            if (idx !== -1) {
                entries.value[idx] = { ...entries.value[idx], likes: result.likes };
            }
            return result;
        } catch (e: any) {
            toast(e.message ?? "Failed to toggle like", "error");
            return null;
        }
    }

    async function recordView(hash: string) {
        try {
            const result = await api.recordView(hash);
            const idx = entries.value.findIndex((e) => e.snapshot_hash === hash);
            if (idx !== -1) {
                entries.value[idx] = { ...entries.value[idx], views: result.views };
            }
        } catch {
            // Silently ignore view tracking errors
        }
    }

    async function publish(snapshotHash: string, imageSlug: string) {
        try {
            const auth = useAuthStore();
            const slug = await auth.ensureUser();
            await api.publishToGallery(snapshotHash, imageSlug);
            toast("Published!", "success", { slug });
            await resetAndFetch();
        } catch (e: any) {
            toast(e.message ?? "Failed to publish", "error");
        }
    }

    async function publishDraft(draft: WorkspaceDraft) {
        if (!draft.contour) throw new Error("Draft has no contour");
        try {
            const auth = useAuthStore();
            const slug = await auth.ensureUser();
            const snapshot = await api.saveSnapshot(draft.imageSlug, {
                contour_hash: draft.contour.contour_hash,
                contour_settings: draft.contourSettings,
                animation_settings: draft.animationSettings,
            });
            await api.publishToGallery(snapshot.snapshot_hash, draft.imageSlug);
            toast("Published!", "success", { slug });
            await resetAndFetch();
        } catch (e: any) {
            toast(e.message ?? "Publish failed", "error");
        }
    }

    return {
        entries,
        loading,
        sort,
        tierFilter,
        searchQuery,
        basisFilter,
        adminMode,
        adminStats,
        adminStatsLoading,
        nextCursor,
        hasMore,
        loadingMore,
        fetchNextPage,
        resetAndFetch,
        activateAdmin,
        deactivateAdmin,
        refreshAdminStats,
        setTier,
        deleteEntry,
        like,
        recordView,
        publish,
        publishDraft,
    };
});
