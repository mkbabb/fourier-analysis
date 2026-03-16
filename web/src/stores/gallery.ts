import { defineStore } from "pinia";
import { ref } from "vue";
import type { GalleryEntry, GalleryTier, AdminStats, WorkspaceDraft } from "@/lib/types";
import * as api from "@/lib/api";
import { useUserAuth } from "@/composables/useUserAuth";
import { useAdminAuth } from "@/composables/useAdminAuth";
import { useToast } from "@/composables/useToast";

export const useGalleryStore = defineStore("gallery", () => {
    const { toast } = useToast();

    // State
    const entries = ref<GalleryEntry[]>([]);
    const total = ref(0);
    const page = ref(1);
    const pages = ref(1);
    const loading = ref(false);
    const sort = ref<"newest" | "views" | "likes">("newest");
    const tierFilter = ref<"all" | "featured" | "saved" | "normal">("all");
    const searchQuery = ref("");
    const basisFilter = ref("");
    const adminMode = ref(false);
    const adminStats = ref<AdminStats | null>(null);
    const adminStatsLoading = ref(false);

    // Actions

    async function fetchPage(n?: number) {
        if (n !== undefined) page.value = n;
        loading.value = true;
        try {
            const result = await api.listGallery({
                page: page.value,
                sort: sort.value,
                tier: tierFilter.value === "all" ? undefined : tierFilter.value,
                q: searchQuery.value || undefined,
                basis: basisFilter.value || undefined,
            });
            entries.value = result.items;
            total.value = result.total;
            page.value = result.page;
            pages.value = result.pages;
        } catch (e: any) {
            toast(e.message ?? "Failed to load gallery", "error");
        } finally {
            loading.value = false;
        }
    }

    async function activateAdmin(token: string) {
        try {
            await api.verifyAdmin(token);
            useAdminAuth().login(token);
            adminMode.value = true;
            toast("Admin mode activated", "success");
            await refreshAdminStats();
        } catch (e: any) {
            toast(e.message ?? "Invalid admin token", "error");
        }
    }

    function deactivateAdmin() {
        useAdminAuth().logout();
        adminMode.value = false;
        adminStats.value = null;
    }

    async function refreshAdminStats() {
        const token = useAdminAuth().getToken();
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
        const token = useAdminAuth().getToken();
        if (!token) return;
        try {
            await api.setGalleryTier(token, hash, tier);
            await fetchPage();
            toast(`Tier set to ${tier}`, "success");
        } catch (e: any) {
            toast(e.message ?? "Failed to set tier", "error");
        }
    }

    async function deleteEntry(hash: string) {
        const token = useAdminAuth().getToken();
        if (!token) return;
        try {
            await api.deleteGalleryEntry(token, hash);
            await fetchPage();
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
            const userAuth = useUserAuth();
            const slug = await userAuth.ensureUser();
            await api.publishToGallery(snapshotHash, imageSlug);
            toast("Published!", "success", { slug });
            await fetchPage();
        } catch (e: any) {
            toast(e.message ?? "Failed to publish", "error");
        }
    }

    async function publishDraft(draft: WorkspaceDraft) {
        if (!draft.contour) throw new Error("Draft has no contour");
        try {
            const userAuth = useUserAuth();
            const slug = await userAuth.ensureUser();
            const snapshot = await api.saveSnapshot(draft.imageSlug, {
                contour_hash: draft.contour.contour_hash,
                contour_settings: draft.contourSettings,
                animation_settings: draft.animationSettings,
            });
            await api.publishToGallery(snapshot.snapshot_hash, draft.imageSlug);
            toast("Published!", "success", { slug });
            await fetchPage();
        } catch (e: any) {
            toast(e.message ?? "Publish failed", "error");
        }
    }

    return {
        entries,
        total,
        page,
        pages,
        loading,
        sort,
        tierFilter,
        searchQuery,
        basisFilter,
        adminMode,
        adminStats,
        adminStatsLoading,
        fetchPage,
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
