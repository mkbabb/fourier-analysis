import { defineStore } from "pinia";
import { ref, toRaw } from "vue";
import type { GalleryTier, GalleryTierFilter, GallerySort, AdminStats, WorkspaceDraft } from "@/lib/types";
import type { Visibility, Visualization } from "@/lib/api";
import * as api from "@/lib/api";
import { processInChunks } from "@/lib/scheduler";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/composables/useToast";
import { saveDraft } from "@/lib/draftStorage";
import { problemMessage } from "@/lib/api-problem";

// B.W4 — the gallery store re-points onto the converged `visualization`
// entity (CRUD-CONTRACT §1). Identity is the 4-word `slug`; the public gallery
// is `visibility=public` (§4); soft-delete + restore round-trip the §5
// lifecycle. The image/contour asset FKs (`image_slug`, `contour_hash`) are
// KEPT and rendered unchanged.
//
// The gallery presentation components consume the converged `Visualization`
// entity directly — no projection. Card identity (`:key`, like/view/delete
// handlers) routes through `slug` — the single user-facing handle (§1); the
// owner is `owner_slug`.

/** The view-model's identity (the visualization slug). */
function entrySlug(e: Visualization): string {
    return e.slug;
}

export const useGalleryStore = defineStore("gallery", () => {
    const { toast } = useToast();

    // State
    const entries = ref<Visualization[]>([]);
    const loading = ref(false);
    const sort = ref<GallerySort>("newest");
    const tierFilter = ref<GalleryTierFilter>("all");
    // The 3-state visibility filter (CRUD-CONTRACT §4). Default `public` is the
    // anonymous gallery view; `me` lists the caller's own rows in all states.
    const visibilityFilter = ref<Visibility | "public" | "me">("public");
    const searchQuery = ref("");
    /** One `active_bases` key (`lib/basis.ts` `BasisKey`), or "" for any. */
    const basisFilter = ref("");
    /**
     * UIA-F-46: the slugs the session user likes, as the server last answered
     * (`PUT`/`GET /api/visualizations/{slug}/like`). The heart's `aria-pressed`
     * reads this one set on the card and in the modal.
     */
    const likedSlugs = ref(new Set<string>());
    const adminMode = ref(false);
    const adminStats = ref<AdminStats | null>(null);
    const adminStatsLoading = ref(false);
    /**
     * X·F F.W4 `.d` — GAB-3: the store stops swallowing.
     *
     * `refreshAdminStats`'s `catch { // ignore }` was the only silent action in
     * the admin store (`activateAdmin` toasts). Loading, failed and
     * loaded-but-never-arrived therefore rendered identically as NOTHING, and
     * the failure image was an amber box reading "Admin Mode" with the whole
     * downstream admin surface still enabled against a dead credential.
     *
     * ⊘ The leaf arm is INLINE, not a toast (the spine's own ⊘ and GAB-3's
     * wording): the toast adapter is F.W1's and `.f`'s.
     */
    const adminStatsError = ref<string | null>(null);

    /**
     * GAB-20: the stats request shares an abort key with ITSELF. `adminFetch`
     * keys the registry on the path and `/api/admin/stats` is constant, so a
     * second refresh aborts the first — and the loser's `finally` cleared the
     * `adminStatsLoading` flag the WINNER owned, so `loading` read false
     * mid-flight and the grid remounted on stale data. GAB-21: `deactivateAdmin`
     * neither aborted nor guarded an in-flight stats request, so an
     * already-dispatched `getAdminStats` re-seeded `adminStats` AFTER an explicit
     * logout — the Logout control sits outside the gate that would have hidden
     * the result. One generation token answers both.
     */
    const ADMIN_STATS_KEY = "/api/admin/stats";
    let statsRun = 0;

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

    /**
     * X.F.W14U.gallery — UIA-F-39 (BROKEN, consumer half): the query every
     * listing sends. Search, tier and basis used to stop at the store — the
     * watchers refetched with `sort` and `owner` alone, so no control narrowed
     * anything. The first page and every later page send the same filters.
     */
    function listQuery() {
        return {
            limit: 20,
            sort: sort.value,
            owner: ownerParam(),
            q: searchQuery.value.trim() || undefined,
            tier: tierFilter.value,
            basis: basisFilter.value || undefined,
        };
    }

    /** The newest listing wins: an older response never lands after it. */
    let listRun = 0;

    // Actions

    async function fetchNextPage() {
        if (!hasMore.value || loadingMore.value) return;
        loadingMore.value = true;
        try {
            const run = listRun;
            const result = await api.listVisualizations({
                ...listQuery(),
                cursor: nextCursor.value || undefined,
            });
            if (run !== listRun) return;
            // J.W3 — accumulate the page in main-thread-yielding chunks so a
            // long infinite-scroll never monopolises the thread (the gallery is
            // the named consumer of the scheduler.yield floor; inv-15/inv-29).
            const fresh = result.items.filter((v) => v.deleted_at == null);
            await processInChunks(fresh, (v) => entries.value.push(v), { chunkSize: 24 });
            nextCursor.value = result.next_cursor;
            hasMore.value = result.has_more;
        } catch (e: any) {
            if (!api.isAbortError(e)) toast(problemMessage(e, "The gallery could not be loaded — try again."), "error");
        } finally {
            loadingMore.value = false;
        }
    }

    async function resetAndFetch() {
        entries.value = [];
        nextCursor.value = null;
        hasMore.value = true;
        loading.value = true;
        const run = ++listRun;
        try {
            const result = await api.listVisualizations(listQuery());
            if (run !== listRun) return;
            entries.value = result.items.filter((v) => v.deleted_at == null);
            nextCursor.value = result.next_cursor;
            hasMore.value = result.has_more;
        } catch (e: any) {
            if (!api.isAbortError(e)) toast(problemMessage(e, "The gallery could not be loaded — try again."), "error");
        } finally {
            if (run === listRun) loading.value = false;
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
            toast(problemMessage(e, "That admin token was not accepted — check it and try again."), "error");
        }
    }

    function deactivateAdmin() {
        // GAB-21: cancel the in-flight stats read before the credential goes, or
        // it lands after logout and re-seeds the panel it was logging out of.
        // The house cure sat one module away, exported and called at four
        // workspace transition sites and zero admin ones.
        api.abortInflight([ADMIN_STATS_KEY]);
        statsRun++;
        useAuthStore().adminLogout();
        adminMode.value = false;
        adminStats.value = null;
        adminStatsError.value = null;
        adminStatsLoading.value = false;
    }

    async function refreshAdminStats() {
        const token = useAuthStore().getAdminToken();
        if (!token) {
            adminStatsError.value = "Admin session has expired — re-enter admin mode.";
            return;
        }
        const ticket = ++statsRun;
        const current = () => ticket === statsRun;
        adminStatsLoading.value = true;
        adminStatsError.value = null;
        try {
            const stats = await api.getAdminStats(token);
            if (!current()) return;
            adminStats.value = stats;
        } catch (e: unknown) {
            if (api.isAbortError(e) || !current()) return;
            adminStatsError.value = problemMessage(e, "Failed to load admin statistics");
        } finally {
            if (current()) adminStatsLoading.value = false;
        }
    }

    /**
     * X·F F.W4 `.d` — the SHARED INVALIDATION CHANNEL (GCM-24 · FR-GFC-1 ·
     * FR-AFP-11 (+FR-AFP-57) · FR-GFC-20).
     *
     * Two opposite defects meet here. `setTier`/`deleteEntry` DISCARDED the fresh
     * entity the operation already returns and paid `resetAndFetch()` for it —
     * destroying accumulated infinite-scroll state, the featured strip, the scroll
     * offset and focus on EVERY tier toggle (and, through the public search and
     * filter watchers, on every anonymous visitor's search pause, which refetched
     * a provably identical page). Meanwhile `AdminFlaggedPanel` duplicated these
     * two methods verbatim MINUS `resetAndFetch`, so the gallery kept the deleted
     * row and the stale tier after moderation. One channel answers both: the
     * in-place patch the store's OWN `recordView`/`restore` idiom already used,
     * exposed so every surface that mutates an entry can invalidate it.
     */
    function patchEntry(slug: string, patch: Partial<Visualization>) {
        const idx = entries.value.findIndex((e) => entrySlug(e) === slug);
        if (idx === -1) return;
        entries.value[idx] = { ...entries.value[idx], ...patch };
    }

    function removeEntry(slug: string) {
        const idx = entries.value.findIndex((e) => entrySlug(e) === slug);
        if (idx !== -1) entries.value.splice(idx, 1);
    }

    // `slug` is the converged visualization identity (the value the gallery
    // cards emit from their `:key`).
    async function setTier(slug: string, tier: GalleryTier) {
        const token = useAuthStore().getAdminToken();
        if (!token) {
            toast("Admin session has expired — re-enter admin mode.", "error");
            return;
        }
        try {
            // `admin.py` re-reads and returns `_public_doc(updated)` with a fresh
            // ETag, and `api.ts` types it `Promise<Visualization>` — the correct
            // effect was on the wire, unclaimed, at zero network cost.
            const updated = await api.setVisualizationTier(token, slug, tier);
            if (updated && typeof updated === "object" && "slug" in updated) {
                patchEntry(slug, updated);
            } else {
                patchEntry(slug, { tier });
            }
            toast(`Tier set to ${tier}`, "success");
        } catch (e: unknown) {
            if (!api.isAbortError(e)) {
                toast(problemMessage(e, "Failed to set tier"), "error");
            }
        }
    }

    async function deleteEntry(slug: string) {
        const token = useAuthStore().getAdminToken();
        if (!token) {
            toast("Admin session has expired — re-enter admin mode.", "error");
            return;
        }
        try {
            await api.adminDeleteVisualization(token, slug);
            removeEntry(slug);
            toast("Entry deleted", "success");
        } catch (e: unknown) {
            if (!api.isAbortError(e)) {
                toast(problemMessage(e, "Failed to delete entry"), "error");
            }
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
            if (!api.isAbortError(e)) toast(problemMessage(e, "Failed to delete"), "error");
        }
    }

    async function restore(slug: string) {
        try {
            const { data, etag } = await api.restoreVisualization(slug);
            if (etag) etags.set(slug, etag);
            if (data.visibility === "public") entries.value.unshift(data);
            toast("Restored", "success");
        } catch (e: any) {
            if (!api.isAbortError(e)) toast(problemMessage(e, "Failed to restore"), "error");
        }
    }

    function markLiked(slug: string, liked: boolean) {
        const next = new Set(likedSlugs.value);
        if (liked) next.add(slug);
        else next.delete(slug);
        likedSlugs.value = next;
    }

    function applyLike(result: api.VisualizationLike) {
        markLiked(result.slug, result.liked);
        const idx = entries.value.findIndex((e) => entrySlug(e) === result.slug);
        if (idx !== -1) entries.value[idx] = { ...entries.value[idx], likes: result.likes };
    }

    /**
     * X.F.W14U.gallery — UIA-F-46 (BROKEN, consumer half): Like is a persisted
     * TOGGLE. The press asks for the opposite of the state the server last
     * answered, through `PUT /api/visualizations/{slug}/like` (`.srv`), and the
     * heart and the count take the server's answer — never a local +1. A like
     * needs a session user, so the first like mints the anonymous session
     * (`ensureUser`, as publishing does).
     */
    async function toggleLike(slug: string) {
        try {
            await useAuthStore().ensureUser();
            applyLike(await api.setVisualizationLike(slug, !likedSlugs.value.has(slug)));
        } catch (e: any) {
            if (!api.isAbortError(e)) toast(problemMessage(e, "Could not save the like"), "error");
        }
    }

    /** Seed one visualization's like state after a reload (logged in only). */
    async function readLike(slug: string) {
        if (!useAuthStore().isLoggedIn) return;
        try {
            applyLike(await api.getVisualizationLike(slug));
        } catch {
            // The heart stays unpressed: reading the state is advisory, and a
            // failed read leaves the press itself (the PUT) authoritative.
        }
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

    // `slug` is the visualization identity (the workspace's
    // `createVisualization` returns it). The optional second arg is the legacy
    // `imageSlug` positional — unused under the converged identity (the slug
    // alone addresses the entity), kept so the pre-existing call site need not
    // change.
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
            toast(`Published ${slug}`, "success", { action: { label: "View", to: `/v/${slug}` } });
            await resetAndFetch();
        } catch (e: any) {
            toast(problemMessage(e, "Publish failed"), "error");
        }
    }

    /**
     * X.F.W14U.gallery — UIA-F-248: the toast names the PIECE that was
     * published (the new visualization's slug), not the session user it was
     * published as; and the refetch that follows is outside the publish's
     * error channel, so a failed refresh reads as a failed load (its own
     * toast), never as "Publish failed" after "Published!".
     * UIA-F-190: a draft without a contour is not publishable, and the Drafts
     * card says so before the press; this guard is the contract's floor.
     */
    async function publishDraft(draft: WorkspaceDraft): Promise<boolean> {
        if (!draft.contour) {
            toast("This draft has no contour to publish yet", "error");
            return false;
        }
        try {
            await useAuthStore().ensureUser();
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
            // X.F.W14.u — UIA-F-47: the draft records the entity it became, so
            // the Drafts list can drop it. `savedSnapshots` was written `[]` on
            // every save and never filled, so a published draft stayed listed
            // with Publish enabled and could be published again and again.
            const raw = toRaw(draft);
            await saveDraft({ ...raw, savedSnapshots: [...(raw.savedSnapshots ?? []), data.slug] });
            toast(`Published ${data.title?.trim() || data.slug}`, "success", { action: { label: "View", to: `/v/${data.slug}` } });
        } catch (e: any) {
            toast(problemMessage(e, "Publish failed"), "error");
            return false;
        }
        await resetAndFetch();
        return true;
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
        adminStatsError,
        nextCursor,
        hasMore,
        loadingMore,
        fetchNextPage,
        resetAndFetch,
        activateAdmin,
        deactivateAdmin,
        refreshAdminStats,
        patchEntry,
        removeEntry,
        setTier,
        deleteEntry,
        softDelete,
        restore,
        likedSlugs,
        toggleLike,
        readLike,
        recordView,
        publish,
        publishDraft,
    };
});
