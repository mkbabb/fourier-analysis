<script setup lang="ts">
import { ref } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@mkbabb/glass-ui/dialog";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/composables/useToast";
import * as api from "@/lib/api";
import type { FlaggedVisualization, GalleryTier } from "@/lib/types";
import { problemMessage } from "./adminError";
import { Flag, Trash2, XCircle, RotateCw, Star } from "@lucide/vue";

// B.W4.c — the flagged panel re-points onto the converged `visualization`
// entity (CRUD-CONTRACT §7). The single user-facing identity is the
// visualization `slug`. The listing rides the cursor envelope
// `{items, next_cursor, has_more}` returned by `GET /api/admin/flagged`
// (`listFlaggedVisualizations`), so the offset `page`/`total` pagination is
// replaced with cursor "load more".

const auth = useAuthStore();
const { toast } = useToast();

// Cursor-paginated flagged stream (CRUD-CONTRACT §6/§7). `flaggedEntries`
// accumulates across "load more"; `nextCursor`/`hasMore` drive the affordance.
const flaggedEntries = ref<FlaggedVisualization[]>([]);
const nextCursor = ref<string | null>(null);
const hasMore = ref(false);
const loading = ref(false);
const loadingMore = ref(false);
/**
 * X·F F.W4 `.d` — FR-AFP-6: the error state IS the empty state.
 *
 * A failed load showed a transient toast and then "No flagged content" — a false
 * all-clear on a safety surface, whose only retry control was gated on
 * `hasMore`, which is false after a failed first load. The queue now says which
 * of the two it means, and offers the retry in the state that needs it.
 */
const error = ref<string | null>(null);

/**
 * FR-AFP-25 (SP-12, the AA-28 idiom at this file): four `getAdminToken()!`
 * assertions over a `string | null`. On the null path `coreFetch` threw its own
 * developer string, which four catches rendered verbatim into an admin toast.
 */
function requireAdminToken(): string {
    const token = auth.getAdminToken();
    if (!token) throw new Error("Admin session has expired — re-enter admin mode.");
    return token;
}

async function fetchFlagged(cursor: string | null) {
    const token = requireAdminToken();
    return api.listFlaggedVisualizations(token, {
        limit: 20,
        cursor: cursor ?? undefined,
    });
}

/**
 * FR-AFP-67: `reload()` used to handle AND discard every error and never
 * rethrow, so `await reload()` could not reject and the three mutation handlers'
 * catches were structurally dead for refresh failures — each of which toasts
 * SUCCESS before reloading. A delete that succeeded and a refresh that 500'd
 * left the deleted row rendered, with live buttons, under a success toast.
 * `reload` now reports through its RETURN VALUE: one error channel per action.
 */
async function reload(): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
        const result = await fetchFlagged(null);
        flaggedEntries.value = result.items;
        nextCursor.value = result.next_cursor;
        hasMore.value = result.has_more;
        return true;
    } catch (e: unknown) {
        if (api.isAbortError(e)) return false;
        error.value = problemMessage(e, "Failed to load flagged entries");
        return false;
    } finally {
        loading.value = false;
    }
}

async function loadMore() {
    if (!hasMore.value || loading.value || loadingMore.value) return;
    loadingMore.value = true;
    try {
        const result = await fetchFlagged(nextCursor.value);
        flaggedEntries.value.push(...result.items);
        nextCursor.value = result.next_cursor;
        hasMore.value = result.has_more;
    } catch (e: unknown) {
        if (api.isAbortError(e)) return;
        toast(problemMessage(e, "Failed to load flagged entries"), "error");
    } finally {
        loadingMore.value = false;
    }
}

reload();

// Destructive-confirm dialog state — supplants native `confirm()`.
const pendingDelete = ref<{ slug: string; label: string } | null>(null);
const dialogOpen = ref(false);

function askDelete(slug: string, label: string) {
    pendingDelete.value = { slug, label };
    dialogOpen.value = true;
}

async function confirmDelete() {
    const target = pendingDelete.value;
    dialogOpen.value = false;
    if (!target) return;
    try {
        // Moderate-delete the converged entity by slug (CRUD-CONTRACT §7); the
        // admin client carries `If-Match: *` server-side (admin override, §3).
        const token = requireAdminToken();
        await api.adminDeleteVisualization(token, target.slug);
        // FR-AFP-67: the success toast fires only once the refresh that proves it
        // has landed. Toasting first and reloading after is what left a deleted
        // row rendered, with live buttons, under a success toast.
        if (await reload()) toast("Entry deleted", "success");
    } catch (e: unknown) {
        if (!api.isAbortError(e)) {
            toast(problemMessage(e, "Failed to delete entry"), "error");
        }
    }
    pendingDelete.value = null;
}

async function handleDismiss(slug: string) {
    try {
        const token = requireAdminToken();
        const result = await api.dismissVisualizationFlags(token, slug);
        // FR-AFP-35: the count agrees with itself. "Dismissed 1 flags" and a
        // reachable "Dismissed 0 flags" both shipped eleven lines from a row that
        // pluralises correctly.
        const n = result.dismissed;
        if (await reload()) {
            toast(
                n === 0
                    ? "No flags left to dismiss"
                    : `Dismissed ${n} ${n === 1 ? "flag" : "flags"}`,
                "success",
            );
        }
    } catch (e: unknown) {
        if (!api.isAbortError(e)) {
            toast(problemMessage(e, "Failed to dismiss"), "error");
        }
    }
}

// Moderation: lift the flagged entity's curation tier (CRUD-CONTRACT §7). A
// reviewer who deems flagged content acceptable may "save" it (clearing the
// flag pressure while keeping it live), resolving against the converged entity
// by slug via `setVisualizationTier`.
async function handleSetTier(slug: string, tier: GalleryTier) {
    try {
        const token = requireAdminToken();
        await api.setVisualizationTier(token, slug, tier);
        if (await reload()) toast(`Tier set to ${tier}`, "success");
    } catch (e: unknown) {
        if (!api.isAbortError(e)) {
            toast(problemMessage(e, "Failed to set tier"), "error");
        }
    }
}

function reasonLabel(reason: string): string {
    const labels: Record<string, string> = {
        inappropriate: "Inappropriate",
        spam: "Spam",
        copyright: "Copyright",
        other: "Other",
    };
    return labels[reason] ?? reason;
}

function timeAgo(iso: string | null): string {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
</script>

<template>
    <div class="flex flex-col gap-3 px-4 py-2">
        <!-- Failure ≠ all-clear. FR-AFP-6: a failed load rendered the transient
             toast and then "No flagged content" — a false all-clear on the
             surface whose whole purpose is telling an operator that something is
             wrong. FR-AFP-58: the busy state is TEXT, not the spinner the PRM
             blanket freezes into a static three-quarter ring. -->
        <div
            v-if="error"
            role="alert"
            class="flex flex-col items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 py-8 text-center"
        >
            <Flag class="h-8 w-8 text-destructive opacity-70" aria-hidden="true" />
            <p class="text-sm font-medium">The moderation queue could not be loaded.</p>
            <p class="max-w-prose text-xs text-muted-foreground">{{ error }}</p>
            <p class="text-xs text-muted-foreground">
                This is not an all-clear — the queue is unread, not empty.
            </p>
            <Button emphasis="secondary" size="sm" @click="reload()">Try again</Button>
        </div>

        <div
            v-else
            class="flex flex-col gap-2"
            role="list"
            aria-label="Flagged gallery entries"
            :aria-busy="loading || undefined"
            :class="loading && 'opacity-60'"
        >
            <div
                v-for="item in flaggedEntries"
                :key="item.slug"
                role="listitem"
                class="rounded-lg border border-red-500/20 bg-red-500/5 p-3"
            >
                <div class="flex items-start justify-between gap-2">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 text-sm">
                            <Flag
                                class="h-3.5 w-3.5 text-red-400 shrink-0"
                                aria-hidden="true"
                            />
                            <span class="font-mono text-xs truncate">{{ item.image_slug ?? item.slug }}</span>
                            <span class="rounded-full bg-red-500/20 px-1.5 py-0.5 text-mono-micro uppercase font-medium text-red-300">
                                {{ item.flag_count }} {{ item.flag_count === 1 ? "flag" : "flags" }}
                            </span>
                        </div>
                        <div class="text-mono-micro uppercase font-medium text-muted-foreground mt-1">
                            by {{ item.owner_slug ?? "anonymous" }} &middot; {{ item.tier ?? "normal" }}
                            <span v-if="item.created_at"> &middot; {{ timeAgo(item.created_at) }}</span>
                        </div>
                        <!-- Flag details -->
                        <div class="mt-2 flex flex-col gap-1">
                            <div
                                v-for="(flag, i) in item.flags"
                                :key="i"
                                class="text-mono-micro uppercase font-medium text-muted-foreground pl-2 border-l border-muted"
                            >
                                <span class="text-red-300">{{ reasonLabel(flag.reason) }}</span>
                                <span v-if="flag.detail"> — {{ flag.detail }}</span>
                                <span class="opacity-60"> ({{ flag.reporter_slug }}, {{ timeAgo(flag.created_at) }})</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                        <Button
                            emphasis="quiet"
                            size="md" icon-only
                            class="h-7 w-7 text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10"
                            :aria-label="`Mark ${item.image_slug ?? item.slug} acceptable (save tier)`"
                            title="Mark acceptable (save)"
                            @click="handleSetTier(item.slug, 'saved')"
                        >
                            <Star class="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                            emphasis="quiet"
                            size="md" icon-only
                            class="h-7 w-7 text-muted-foreground hover:text-green-400 hover:bg-green-500/10"
                            :aria-label="`Dismiss flags on ${item.image_slug ?? item.slug}`"
                            title="Dismiss flags"
                            @click="handleDismiss(item.slug)"
                        >
                            <XCircle class="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                            emphasis="quiet"
                            size="md" icon-only
                            class="h-7 w-7 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                            :aria-label="`Delete entry ${item.image_slug ?? item.slug}`"
                            title="Delete entry"
                            @click="askDelete(item.slug, item.image_slug ?? item.slug)"
                        >
                            <Trash2 class="h-4 w-4" aria-hidden="true" />
                        </Button>
                    </div>
                </div>
            </div>

        </div>

        <!-- FR-AFP-30: the empty state is a SIBLING of the `role="list"`
             container, not a non-`listitem` child of it — and per FR-AFP-1 it is
             the only child production ever renders, so the illegal nesting was
             not an edge case but the shipped shape. -->
        <div
            v-if="!error && !loading && !flaggedEntries.length"
            class="flex flex-col items-center gap-2 py-8 text-muted-foreground"
        >
            <Flag class="h-8 w-8 opacity-30" aria-hidden="true" />
            <p class="text-sm">No flagged content</p>
        </div>
        <div
            v-else-if="!error && loading && !flaggedEntries.length"
            class="py-8 text-center text-sm text-muted-foreground"
        >
            Loading flagged entries…
        </div>

        <!-- Cursor "load more" — the converged flagged stream is cursor-paginated
             (CRUD-CONTRACT §6); there is no total/page count, so the offset
             nav is replaced by an opaque-cursor incremental loader. -->
        <nav
            v-if="hasMore"
            class="flex items-center justify-center text-xs text-muted-foreground"
            aria-label="Flagged entries pagination"
        >
            <Button
                emphasis="quiet"
                size="sm"
                class="gap-1.5"
                :disabled="loadingMore"
                aria-label="Load more flagged entries"
                @click="loadMore()"
            >
                <RotateCw
                    class="h-3.5 w-3.5"
                    :class="loadingMore && 'animate-spin'"
                    aria-hidden="true"
                />
                {{ loadingMore ? "Loading…" : "Load more" }}
            </Button>
        </nav>

        <!-- Destructive-confirm dialog — replaces native `confirm()`. -->
        <Dialog v-model:open="dialogOpen">
            <DialogContent surface="opaque" class="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Delete gallery entry?</DialogTitle>
                    <DialogDescription>
                        This shall permanently delete the flagged entry
                        <span class="font-mono">{{ pendingDelete?.label }}</span>.
                        The action is irrevocable.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button emphasis="quiet" @click="dialogOpen = false">Cancel</Button>
                    <Button emphasis="primary" tone="destructive" @click="confirmDelete">Delete</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>

<style scoped>
@reference "tailwindcss";
</style>
