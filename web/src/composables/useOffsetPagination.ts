import { ref, computed, onScopeDispose, getCurrentScope, type Ref } from "vue";
import { isAbortError } from "@/lib/api";

/**
 * Offset-based pagination with an active fetchFn loader.
 *
 * Suitable for admin views that need jump-to-page + stable positions on
 * a server-backed dataset (filter changes invalidate via `loadPage(1)`).
 *
 * Local consumer-owned composable. Forked verbatim from glass-ui v0.9.3
 * source (`src/composables/pagination/useOffsetPagination.ts`) at glass-ui
 * v1.0 cut — the upstream subpath `@mkbabb/glass-ui/pagination` was retired
 * (zero production consumers across the constellation). Per MIGRATION.md §3.1
 * the canonical migration is "copy from v0.9.3 source."
 *
 * vueuse's `useOffsetPagination` is intentionally NOT a 1:1 swap — it is a
 * passive page-state primitive (external `total` ref, no fetch loader). The
 * admin call sites in this repo are active-loader-shaped, so the v0.9.3
 * shape stays.
 */
interface OffsetPaginationConfig<T> {
    fetchFn: (limit: number, offset: number) => Promise<{ data: T[]; total: number }>;
    pageSize?: number;
}

export function useOffsetPagination<T>(options: OffsetPaginationConfig<T>) {
    const items = ref<T[]>([]) as Ref<T[]>;
    const total = ref(0);
    const page = ref(1);
    const pageSize = ref(options.pageSize ?? 20);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));
    const offset = computed(() => (page.value - 1) * pageSize.value);
    const hasNext = computed(() => page.value < pageCount.value);
    const hasPrev = computed(() => page.value > 1);

    // X·F F.W4 `.d` — AA-8 / AA-18 / AA-27 (SP-1, abort identity).
    //
    // `adminFetch` keys its AbortController registry on the full query-bearing
    // path, so two loads of the SAME page abort each other while two loads of
    // DIFFERENT pages never do. Before this token the composable could not tell
    // the three outcomes apart: an abort was rendered as a failure, a superseded
    // response overwrote a fresher one (last-to-resolve paints), and the loser's
    // `finally` cleared `loading` while the winner was still in flight — the
    // mid-load empty-state flash.
    //
    // `run` is the generation. Every load takes a ticket; only the holder of the
    // current ticket may write ANY of `items`/`total`/`error`/`loading`. A
    // disposed scope revokes every outstanding ticket, so a late resolver writes
    // into a dead scope no more than a superseded one writes over a live page.
    //
    // ⊘ The registry's own reap (`finally { inflight.delete(key) }`, AA-27) and
    // the key SHAPE (per-operation instead of per-URL, FR-AUL-3 / R6-8) live in
    // `lib/api.ts` and are NOT this unit's: SP-1 books component instances only.
    let run = 0;
    let disposed = false;
    if (getCurrentScope()) {
        onScopeDispose(() => {
            disposed = true;
            run++;
            loading.value = false;
        });
    }

    async function loadPage(p?: number) {
        if (p != null) page.value = Math.max(1, Math.min(p, pageCount.value || 1));
        const ticket = ++run;
        const current = () => !disposed && ticket === run;

        loading.value = true;
        error.value = null;

        try {
            const res = await options.fetchFn(pageSize.value, offset.value);
            if (!current()) return;
            items.value = res.data;
            total.value = res.total;
        } catch (e) {
            // An abort is this composable superseding itself, not a failure the
            // operator can act on. The predicate is the repo's own (`api.ts:69`,
            // consumed at 14 sites); its absence here is what made every
            // double-Apply read as an error.
            if (isAbortError(e) || !current()) return;
            error.value = e instanceof Error ? e.message : "Failed to load";
        } finally {
            if (current()) loading.value = false;
        }
    }

    function nextPage() {
        if (hasNext.value) loadPage(page.value + 1);
    }

    function prevPage() {
        if (hasPrev.value) loadPage(page.value - 1);
    }

    function reset() {
        page.value = 1;
        items.value = [];
        total.value = 0;
    }

    return {
        items,
        total,
        page,
        pageSize,
        pageCount,
        loading,
        error,
        hasNext,
        hasPrev,
        loadPage,
        nextPage,
        prevPage,
        reset,
    };
}
