import { defineStore } from "pinia";
import { ref } from "vue";
import type { GalleryEntry, GalleryTier, AdminStats, WorkspaceDraft } from "@/lib/types";
import type { Visibility, Visualization } from "@/lib/api";
import * as api from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/composables/useToast";

// B.W4 — the gallery store re-points onto the converged `visualization`
// entity (CRUD-CONTRACT §1). The retired `snapshot_hash`-keyed identity
// collapses onto the 4-word `slug`; the public gallery is `visibility=public`
// (§4); soft-delete + restore round-trip the §5 lifecycle. The image/contour
// asset FKs (`image_slug`, `contour_hash`) are KEPT and rendered unchanged.
//
// The gallery presentation components still consume the `GalleryEntry` view
// shape; the store projects each `Visualization` onto it, putting the
// visualization `slug` in the `snapshot_hash` slot so the components' card
// identity (`:key`, like/view/delete handlers) routes through the slug — the
// single user-facing handle — rather than the retired content hash.

// The gallery presentation components key cards off the `GalleryEntry`
// view-model's legacy identity field. Under the converged identity that field
// carries the visualization `slug` — the single user-facing handle (§1). These
// two helpers confine the legacy field name to one read site and one write
// site so the store's own navigation/lookup is expressed purely in `slug`.

/** The view-model's identity slot value (the visualization slug). */
function entrySlug(e: GalleryEntry): string {
    return e.snapshot_hash;
}

/** Project a converged `Visualization` onto the legacy gallery view shape. */
function toGalleryEntry(v: Visualization): GalleryEntry {
    return {
        // Legacy view-slot — carries the visualization slug under §1, NOT a
        // surviving content-hash identity. The single write of the alias.
        snapshot_hash: v.slug,
        image_slug: v.image_slug,
        contour_hash: v.contour_hash,
        user_slug: v.owner_slug,
        tier: v.tier ?? "normal",
        views: v.views ?? 0,
        likes: v.likes ?? 0,
        active_bases: v.active_bases ?? [],
        n_harmonics: v.n_harmonics ?? 1,
        created_at: v.created_at,
        updated_at: v.updated_at,
    };
}

export const useGalleryStore = defineStore("gallery", () => {
    const { toast } = useToast();

    // State
    const entries = ref<GalleryEntry[]>([]);
    const loading = ref(false);
    const sort = ref<"newest" | "views" | "likes">("newest");
    const tierFilter = ref<"all" | "featured" | "saved" | "normal">("all");
    // The 3-state visibility filter (CRUD-CONTRACT §4). Default `public` is the
    // anonymous gallery view; `me` lists the caller's own rows in all states.
    const visibilityFilter = ref<Visibility | "public" | "me">("public");
    const searchQuery = ref("");
    const basisFilter = ref("");
    const adminMode = ref(false);
    const adminStats = ref<AdminStats | null>(null);
    const adminStatsLoading = ref(false);

    // Cursor pagination state — the only paginated path through the gallery.
    const nextCursor = ref<string | null>(null);
    const hasMore = ref(true);
    const loadingMore = ref(false);

    // ETag cache keyed by visualization slug — captured on load, replayed as
    // `If-Match` on the next PATCH/DELETE (CRUD-CONTRACT §0 SOTA-2).
    const etags = new Map<string, string>();

    // The `owner` query param sent to the list endpoint: `me` lists the
    // caller's drafts/unlisted/public; otherwise the anonymous public gallery.
    function ownerParam(): string | undefined {
        return visibilityFilter.value === "me" ? "me" : undefined;
    }

    // Actions

    async function fetchNextPage() {
        if (!hasMore.value || loadingMore.value) return;
        loadingMore.value = true;
        try {
            const result = await api.listVisualizations({
                limit: 20,
                sort: sort.value,
                cursor: nextCursor.value || undefined,
                owner: ownerParam(),
            });
            for (const v of result.items) if (v.deleted_at == null) {
                entries.value.push(toGalleryEntry(v));
            }
            nextCursor.value = result.next_cursor;
            hasMore.value = result.has_more;
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
            const result = await api.listVisualizations({
                limit: 20,
                sort: sort.value,
                owner: ownerParam(),
            });
            entries.value = result.items
                .filter((v) => v.deleted_at == null)
                .map(toGalleryEntry);
            nextCursor.value = result.next_cursor;
            hasMore.value = result.has_more;
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

    // `slug` is the converged visualization identity (the value the gallery
    // cards emit from their `snapshot_hash`-slot key).
    async function setTier(slug: string, tier: GalleryTier) {
        const token = useAuthStore().getAdminToken();
        if (!token) return;
        try {
            await api.setVisualizationTier(token, slug, tier);
            await resetAndFetch();
            toast(`Tier set to ${tier}`, "success");
        } catch (e: any) {
            toast(e.message ?? "Failed to set tier", "error");
        }
    }

    async function deleteEntry(slug: string) {
        const token = useAuthStore().getAdminToken();
        if (!token) return;
        try {
            await api.adminDeleteVisualization(token, slug);
            await resetAndFetch();
            toast("Entry deleted", "success");
        } catch (e: any) {
            toast(e.message ?? "Failed to delete entry", "error");
        }
    }

    // Soft-delete the caller's own visualization, then restore (CRUD-CONTRACT
    // §5). Both round-trips send `If-Match: <etag>`; the ETag is captured from
    // the prior GET (here, fetched fresh to obtain the current validator).
    async function softDelete(slug: string) {
        try {
            const etag = etags.get(slug) ?? (await api.getVisualization(slug)).etag;
            await api.deleteVisualization(slug, etag);
            etags.delete(slug);
            const idx = entries.value.findIndex((e) => entrySlug(e) === slug);
            if (idx !== -1) entries.value.splice(idx, 1);
            toast("Deleted", "success");
        } catch (e: any) {
            if (!api.isAbortError(e)) toast(e.message ?? "Failed to delete", "error");
        }
    }

    async function restore(slug: string) {
        try {
            const { data, etag } = await api.restoreVisualization(slug);
            if (etag) etags.set(slug, etag);
            if (data.visibility === "public") entries.value.unshift(toGalleryEntry(data));
            toast("Restored", "success");
        } catch (e: any) {
            if (!api.isAbortError(e)) toast(e.message ?? "Failed to restore", "error");
        }
    }

    async function like(slug: string): Promise<{ liked: boolean; likes: number } | null> {
        // Likes ride the read-side view counter on the converged entity; the
        // converged surface exposes likes as a derived counter (no dedicated
        // toggle endpoint under the CRUD shape — optimistic local bump).
        const idx = entries.value.findIndex((e) => entrySlug(e) === slug);
        if (idx === -1) return null;
        const liked = true;
        const likes = (entries.value[idx].likes ?? 0) + 1;
        entries.value[idx] = { ...entries.value[idx], likes };
        return { liked, likes };
    }

    async function recordView(slug: string) {
        // `GET /api/visualizations/{slug}` increments the view counter
        // server-side (visualizations.py); a fire-and-forget read suffices.
        try {
            const { data, etag } = await api.getVisualization(slug);
            if (etag) etags.set(slug, etag);
            const idx = entries.value.findIndex((e) => entrySlug(e) === slug);
            if (idx !== -1) entries.value[idx] = { ...entries.value[idx], views: data.views };
        } catch {
            // Silently ignore view tracking errors.
        }
    }

    // `slug` is the visualization identity (the workspace's `createVisualization`
    // returns it in the `snapshot_hash` view slot for call-site compatibility).
    // The optional second arg is the legacy `imageSlug` positional — unused
    // under the converged identity (the slug alone addresses the entity), kept
    // so the pre-existing call site need not change.
    async function publish(slug: string, _imageSlug?: string) {
        // A previously-created draft transitions to `public` (the visibility
        // lift, §4). PATCH is ETag-guarded (§0 SOTA-2).
        try {
            const etag = etags.get(slug) ?? (await api.getVisualization(slug)).etag;
            const { etag: nextETag } = await api.updateVisualization(
                slug,
                { visibility: "public" },
                etag,
            );
            if (nextETag) etags.set(slug, nextETag);
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
            // Create the visualization directly at `public` visibility — the
            // converged entity collapses the snapshot→gallery two-step into a
            // single POST (CRUD-CONTRACT §1). `image_slug` / `contour_hash`
            // remain the asset FKs.
            const { data, etag } = await api.createVisualization({
                visibility: "public",
                image_slug: draft.imageSlug,
                contour_hash: draft.contour.contour_hash,
                active_bases: draft.animationSettings.active_bases?.length
                    ? draft.animationSettings.active_bases
                    : ["fourier-epicycles"],
                n_harmonics: draft.contourSettings.n_harmonics,
                contour_settings: draft.contourSettings,
                animation_settings: draft.animationSettings,
            });
            if (etag) etags.set(data.slug, etag);
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
        visibilityFilter,
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
        softDelete,
        restore,
        like,
        recordView,
        publish,
        publishDraft,
    };
});
