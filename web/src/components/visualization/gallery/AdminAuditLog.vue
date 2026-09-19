<script setup lang="ts">
import { ref, computed } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { useOffsetPagination } from "@/composables/useOffsetPagination";
import { useAuthStore } from "@/stores/auth";
import * as api from "@/lib/api";
import type { AuditEntry } from "@/lib/types";
import { ScrollText, Filter as FilterIcon, X } from "@lucide/vue";

const auth = useAuthStore();

// The DRAFT filters — what the operator is typing.
const actionFilter = ref<string>("");
const targetFilter = ref<string>("");

// X·F F.W4 `.d` — AA-7: the APPLIED snapshot.
//
// `fetchFn` used to dereference the live v-model refs at request time and
// `applyFilters` snapshotted nothing, so Next shipped unapplied filter text
// against a page number already advanced past a stale `pageCount`. The request
// now reads only what Apply committed, and every "did my query match?" surface
// (the empty-state headline AA-33, the clear affordance AA-34) reads the same
// applied state rather than the draft.
const appliedAction = ref<string>("");
const appliedTarget = ref<string>("");

const {
    items: entries,
    total,
    page,
    pageCount,
    loading,
    error,
    hasNext,
    hasPrev,
    loadPage,
    nextPage,
    prevPage,
} = useOffsetPagination<AuditEntry>({
    fetchFn: async (limit, offset) => {
        const token = auth.getAdminToken();
        if (!token) throw new Error("Admin session has expired — re-enter admin mode.");
        const result = await api.listAuditLog(token, {
            page: Math.floor(offset / limit) + 1,
            limit,
            action: appliedAction.value || undefined,
            target: appliedTarget.value || undefined,
        });
        return { data: result.items, total: result.total };
    },
    pageSize: 25,
});

loadPage(1);

function applyFilters() {
    appliedAction.value = actionFilter.value.trim();
    appliedTarget.value = targetFilter.value.trim();
    loadPage(1);
}

function clearFilters() {
    actionFilter.value = "";
    targetFilter.value = "";
    applyFilters();
}

const hasFilters = computed(() => !!(appliedAction.value || appliedTarget.value));

function formatTimestamp(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

function actionTone(action: string): string {
    if (action.startsWith("delete") || action === "prune_empty_users") {
        return "text-red-300 bg-red-500/10 border-red-500/20";
    }
    if (action.startsWith("set_user_status")) {
        return "text-amber-300 bg-amber-500/10 border-amber-500/20";
    }
    if (action.startsWith("set_tier") || action.startsWith("dismiss")) {
        return "text-emerald-300 bg-emerald-500/10 border-emerald-500/20";
    }
    if (action.startsWith("batch")) {
        return "text-violet-300 bg-violet-500/10 border-violet-500/20";
    }
    return "text-sky-300 bg-sky-500/10 border-sky-500/20";
}
</script>

<template>
    <div class="flex flex-col gap-3 px-4 py-2">
        <!-- Filter bar -->
        <div class="flex flex-wrap items-center gap-2 rounded-lg border border-muted/40 bg-muted/5 p-2">
            <FilterIcon class="h-3.5 w-3.5 text-muted-foreground" />
            <input
                v-model="actionFilter"
                type="text"
                placeholder="action (e.g. delete, set_tier)"
                class="flex-1 min-w-[10rem] rounded border border-muted/30 bg-transparent px-2 py-1 text-xs focus:border-muted-foreground/60 focus:outline-none"
                @keyup.enter="applyFilters"
            />
            <input
                v-model="targetFilter"
                type="text"
                placeholder="target (substring match)"
                class="flex-1 min-w-[10rem] rounded border border-muted/30 bg-transparent px-2 py-1 text-xs focus:border-muted-foreground/60 focus:outline-none"
                @keyup.enter="applyFilters"
            />
            <Button emphasis="secondary" size="sm" class="h-7 text-xs" @click="applyFilters">
                Apply
            </Button>
            <Button
                v-if="hasFilters"
                emphasis="quiet"
                size="md" icon-only
                class="h-7 w-7 text-muted-foreground"
                title="Clear filters"
                @click="clearFilters"
            >
                <X class="h-3.5 w-3.5" />
            </Button>
        </div>

        <!-- Failure. AA-1: a fetch that failed is NOT an empty ledger. The audit
             log is a system of record, so the one thing it may never do is
             answer a question it could not ask. -->
        <div
            v-if="error"
            role="alert"
            class="flex flex-col items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 py-8 text-center"
        >
            <ScrollText class="h-8 w-8 text-destructive opacity-70" aria-hidden="true" />
            <p class="text-sm font-medium">The audit log could not be loaded.</p>
            <p class="max-w-prose text-xs text-muted-foreground">{{ error }}</p>
            <Button emphasis="secondary" size="sm" @click="loadPage()">Try again</Button>
        </div>

        <!-- Log rows. AA-17: the rows are no longer unmounted into a spinner on
             every page turn — they dim in place and announce themselves busy, so
             the scroll position, the focus and ~25 rows of layout survive. -->
        <div v-else class="flex flex-col gap-1.5" :aria-busy="loading || undefined"
             :class="loading && 'opacity-60'">
            <div
                v-for="(entry, i) in entries"
                :key="`${entry.timestamp}-${i}`"
                class="grid grid-cols-[auto_auto_1fr_auto] items-center gap-2 rounded-md border border-muted/30 bg-muted/5 px-3 py-1.5 text-xs"
            >
                <span class="font-mono text-muted-foreground tabular-nums">
                    {{ formatTimestamp(entry.timestamp) }}
                </span>
                <span
                    class="rounded border px-1.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-wide"
                    :class="actionTone(entry.action)"
                >
                    {{ entry.action }}
                </span>
                <span class="font-mono text-foreground/80 truncate" :title="entry.target">
                    {{ entry.target || "—" }}
                </span>
                <span
                    class="font-mono text-[0.65rem] text-muted-foreground"
                    :title="entry.ip_hash"
                >
                    {{ entry.ip_hash.slice(0, 10) }}
                </span>
            </div>

            <!-- Empty state. AA-33: the HEADLINE branches on the applied-filter
                 state. Unconditional, it asserted "No audit entries" — a claim
                 about the system of record — for a query that simply matched
                 nothing, and then counselled widening the search it had just
                 denied existed. -->
            <div
                v-if="!entries.length && !loading"
                class="flex flex-col items-center gap-2 py-10 text-muted-foreground"
            >
                <ScrollText class="h-8 w-8 opacity-30" aria-hidden="true" />
                <p class="text-sm">
                    {{ hasFilters ? "No entries match these filters" : "No audit entries" }}
                </p>
                <p v-if="hasFilters" class="text-xs opacity-70">
                    Try clearing filters to widen the search.
                </p>
            </div>
            <div
                v-else-if="!entries.length && loading"
                class="py-10 text-center text-sm text-muted-foreground"
            >
                Loading audit entries…
            </div>
        </div>

        <!-- Pagination -->
        <div
            v-if="pageCount > 1"
            class="flex items-center justify-center gap-2 text-xs text-muted-foreground"
        >
            <button
                :disabled="!hasPrev"
                class="rounded border px-2 py-1 disabled:opacity-30"
                @click="prevPage()"
            >
                Prev
            </button>
            <span>{{ page }} / {{ pageCount }}</span>
            <button
                :disabled="!hasNext"
                class="rounded border px-2 py-1 disabled:opacity-30"
                @click="nextPage()"
            >
                Next
            </button>
            <span class="ml-2">{{ total }} total</span>
        </div>
    </div>
</template>

<style scoped>
@reference "tailwindcss";
</style>
