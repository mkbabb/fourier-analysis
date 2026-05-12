import { ref, computed, type Ref } from "vue";

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

    async function loadPage(p?: number) {
        if (p != null) page.value = Math.max(1, Math.min(p, pageCount.value || 1));
        loading.value = true;
        error.value = null;

        try {
            const res = await options.fetchFn(pageSize.value, offset.value);
            items.value = res.data;
            total.value = res.total;
        } catch (e) {
            error.value = e instanceof Error ? e.message : "Failed to load";
        } finally {
            loading.value = false;
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
