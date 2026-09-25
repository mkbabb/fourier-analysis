<script setup lang="ts">
import { ref, computed } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { Card } from "@mkbabb/glass-ui/card";
import { Alert, AlertDescription, AlertTitle, Skeleton } from "@mkbabb/glass-ui";
import { useAuthStore } from "@/stores/auth";
import { useGalleryStore } from "@/stores/gallery";
import { useToast } from "@/composables/useToast";
import { useDestructiveConfirm } from "@/composables/useDestructiveConfirm";
import ConfirmDialog from "@/components/shared/ConfirmDialog.vue";
import * as api from "@/lib/api";
import type { FlaggedVisualization } from "@/lib/types";
import AdminFlaggedTable from "./AdminFlaggedTable.vue";
import { problemMessage } from "@/lib/api-problem";
import { ChevronDown, CircleAlert, Flag } from "@lucide/vue";

// B.W4.c — the flagged panel re-points onto the converged `visualization`
// entity (CRUD-CONTRACT §7). The single user-facing identity is the
// visualization `slug`. The listing rides the cursor envelope
// `{items, next_cursor, has_more}` returned by `GET /api/admin/flagged`
// (`listFlaggedVisualizations`), so the offset `page`/`total` pagination is
// replaced with cursor "load more".

const auth = useAuthStore();
const gallery = useGalleryStore();
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
/**
 * FR-AFP-14 (+FR-AFP-48): `reload()` and `loadMore()` carry DIFFERENT abort keys
 * — the cursor sits in the query and `adminFetch` keys on the path — so nothing
 * cancelled anything and a stale page-2 `push` could land on a fresh page-1
 * array, clobbering the cursor and minting a duplicate `:key`. The race is
 * reachable by ordinary clicking because the load-more `<nav>` was a SIBLING of
 * the v-if/v-else pair, so an ENABLED Load-more carrying the pre-mutation cursor
 * rendered beside the spinner during every mutation reload. One generation token
 * for the stream; the interim `hasMore && !loading` gate is the template's.
 */
let streamRun = 0;

async function reload(): Promise<boolean> {
    const ticket = ++streamRun;
    loading.value = true;
    error.value = null;
    try {
        const result = await fetchFlagged(null);
        if (ticket !== streamRun) return false;
        flaggedEntries.value = result.items;
        nextCursor.value = result.next_cursor;
        hasMore.value = result.has_more;
        return true;
    } catch (e: unknown) {
        if (api.isAbortError(e) || ticket !== streamRun) return false;
        error.value = problemMessage(e, "Failed to load flagged entries");
        return false;
    } finally {
        if (ticket === streamRun) loading.value = false;
    }
}

async function loadMore() {
    if (!hasMore.value || loading.value || loadingMore.value) return;
    const ticket = ++streamRun;
    loadingMore.value = true;
    try {
        const result = await fetchFlagged(nextCursor.value);
        if (ticket !== streamRun) return;
        flaggedEntries.value.push(...result.items);
        nextCursor.value = result.next_cursor;
        hasMore.value = result.has_more;
    } catch (e: unknown) {
        if (api.isAbortError(e) || ticket !== streamRun) return;
        toast(problemMessage(e, "Failed to load flagged entries"), "error");
    } finally {
        if (ticket === streamRun) loadingMore.value = false;
    }
}

/**
 * FR-AFP-15 ⇢ FR-AFP-56, ONE change as the lock requires.
 *
 * Every mutation discarded all accumulated cursor pages — `reload()` reassigns
 * after `fetchFlagged(null)` — contradicting this file's own header, on a stream
 * whose only pagination is forward-only. The splice model already existed in
 * `stores/gallery.ts` (`entries.splice(idx, 1)`), so a moderation act that
 * REMOVES a row from the queue removes that row, and the pages the operator has
 * already paid for stay paid for.
 *
 * The rider lands in the same change: `:key="i"` on the flag sub-loop was benign
 * only under wholesale remount, and this edit ENDS wholesale remount — so it must
 * land here or not at all.
 *
 * ⊘ The banked natural key is `(content_hash, reporter_slug)`, and `content_hash`
 * IS NOT ON THE CLIENT TYPE: `admin.py` emits it and `FlaggedVisualization`
 * omits it, which is FR-AFP-36's "the actual join key invisible to the
 * component", routed F.W5-W8 with `lib/types.ts` outside this unit's bounds. The
 * discriminator available at these bytes is `(slug, reporter_slug)`, which is
 * unique across the RENDERED set — `slug` disambiguates the rows that
 * `content_hash` fans out (FR-AFP-7). Stated rather than silently substituted.
 */
function dropEntry(slug: string) {
    const idx = flaggedEntries.value.findIndex((e) => e.slug === slug);
    if (idx !== -1) flaggedEntries.value.splice(idx, 1);
}

/**
 * FR-AFP-16 ⊕ FR-AFP-23: three of four mutations had no in-flight guard and no
 * `:disabled` while the correct pattern sat ten lines above in `loadingMore`, and
 * the confirm dialog closed BEFORE the request — so a slow delete invited a
 * second Delete on the same row and a failed one toasted against nothing. One
 * busy flag, read by every control, released only once the act has settled.
 */
const busySlug = ref<string | null>(null);
const busy = computed(() => busySlug.value !== null);

reload();

/**
 * X.F.W14V.au4 — A2-FO-L1-9: the destructive-confirm machine is
 * `useDestructiveConfirm`'s, and the dialog is `shared/ConfirmDialog`. The
 * rules this panel wrote for itself are the machine's now: closing clears the
 * intent (FR-AFP-41 / -68), the dialog closes only after the delete settles
 * (FR-AFP-23), and it is locked while the delete is in flight (UIA-F-251).
 */
const confirmation = useDestructiveConfirm<{ slug: string; label: string }>();
const pendingDelete = confirmation.pending;

function askDelete(slug: string, label: string) {
    if (busy.value) return;
    confirmation.ask({ slug, label });
}

function confirmDelete() {
    return confirmation.confirm(async (target) => {
        busySlug.value = target.slug;
        try {
            // Moderate-delete the converged entity by slug (CRUD-CONTRACT §7); the
            // admin client carries `If-Match: *` server-side (admin override, §3).
            const token = requireAdminToken();
            await api.adminDeleteVisualization(token, target.slug);
            // FR-AFP-67: the success toast fires only once the act has settled.
            // FR-AFP-15: the row is SPLICED out; the accumulated pages survive.
            dropEntry(target.slug);
            gallery.removeEntry(target.slug);
            toast("Entry deleted", "success");
        } catch (e: unknown) {
            if (!api.isAbortError(e)) {
                toast(problemMessage(e, "Failed to delete entry"), "error");
            }
        } finally {
            busySlug.value = null;
        }
    });
}

async function handleDismiss(slug: string) {
    if (busy.value) return;
    busySlug.value = slug;
    try {
        const token = requireAdminToken();
        const result = await api.dismissVisualizationFlags(token, slug);
        // FR-AFP-35: the count agrees with itself. "Dismissed 1 flags" and a
        // reachable "Dismissed 0 flags" both shipped eleven lines from a row that
        // pluralises correctly.
        const n = result.dismissed;
        // Dismissing every flag takes the row out of the queue; splicing keeps
        // the accumulated pages (FR-AFP-15).
        dropEntry(slug);
        toast(
            n === 0
                ? "No flags left to dismiss"
                : `Dismissed ${n} ${n === 1 ? "flag" : "flags"}`,
            "success",
        );
    } catch (e: unknown) {
        if (!api.isAbortError(e)) {
            toast(problemMessage(e, "Failed to dismiss"), "error");
        }
    } finally {
        busySlug.value = null;
    }
}

// Moderation: lift the flagged entity's curation tier (CRUD-CONTRACT §7). A
// reviewer who deems flagged content acceptable may "keep" it (the saved tier:
// clearing the flag pressure while keeping it live).
//
// X.F.W14V.au4 — A2-FO-L1-10: the fork is deleted. The PUT, the gallery patch,
// the toast and the failure are the store's one `setTier`; this row patches
// only its own copy from the settled tier the store answers.
async function handleKeep(slug: string) {
    if (busy.value) return;
    busySlug.value = slug;
    try {
        const settled = await gallery.setTier(slug, "saved");
        const idx = flaggedEntries.value.findIndex((e) => e.slug === slug);
        if (settled && idx !== -1) {
            flaggedEntries.value[idx] = { ...flaggedEntries.value[idx], tier: settled };
        }
    } finally {
        busySlug.value = null;
    }
}

</script>

<template>
    <div class="flex flex-col gap-3 px-[var(--page-gutter)] py-2">
        <!-- Failure ≠ all-clear. FR-AFP-6: a failed load rendered the transient
             toast and then "No flagged content" — a false all-clear on the
             surface whose whole purpose is telling an operator that something is
             wrong. FR-AFP-58: the busy state is TEXT, not the spinner the PRM
             blanket freezes into a static three-quarter ring. -->
        <!-- X.F.W14U.admin — UIA-F-199: glass Alert, an alert glyph (the flag
             glyph said "flagged", not "failed"), the problem's detail. -->
        <Alert v-if="error" tone="destructive" announce="assertive">
            <CircleAlert aria-hidden="true" />
            <AlertTitle>The moderation queue could not be loaded.</AlertTitle>
            <AlertDescription class="flex flex-col items-start gap-2">
                <span>{{ error }}</span>
                <span>This is not an all-clear — the queue is unread, not empty.</span>
                <Button emphasis="secondary" size="sm" @click="reload()">Try again</Button>
            </AlertDescription>
        </Alert>

        <!-- X.F.W14.t, OA-42 swept (COHESION §0bu). Each queue entry was its
             own glass `Card`. Two adjacent entries therefore painted two rules
             with an 8px gap between them (the upper card's 1px bottom border and
             the lower card's 1px top border), measured at 1440 and 390. The
             Card also dropped the `role="listitem"` it was given, so the list
             held no listitems (UIA-F-43). The entries are now rows on ONE Card
             plate, using the producer's table-row rule (one bottom border per
             row, none after the last), coloured with the `--border` token. The
             list roles sit on plain elements that keep them. -->
        <!-- X.F.W14V.au4 — A2-FO-L1-27: the queue is glass DataTable
             (`AdminFlaggedTable`, with its media column), one idiom with the
             users list and the audit log; its name rides a region (glass names
             only the table projection), which also sets the admin rung the card
             projection inherits. -->
        <Card
            v-else
            v-show="flaggedEntries.length"
            size="sm"
            :class="loading && 'opacity-60'"
        >
            <div role="region" aria-label="Flagged gallery entries" class="text-small" :aria-busy="loading || undefined">
                <AdminFlaggedTable
                    :entries="flaggedEntries"
                    :busy-slug="busySlug"
                    :loading="loading"
                    @dismiss="handleDismiss"
                    @keep="handleKeep"
                    @delete="(slug) => askDelete(slug, slug)"
                />
            </div>
        </Card>

        <!-- FR-AFP-30: the empty state is a SIBLING of the `role="list"`
             container, not a non-`listitem` child of it — and per FR-AFP-1 it is
             the only child production ever renders, so the illegal nesting was
             not an edge case but the shipped shape. -->
        <div
            v-if="!error && !loading && !flaggedEntries.length"
            class="flex flex-col items-center gap-2 py-8 text-muted-foreground"
        >
            <Flag class="h-8 w-8 opacity-30" aria-hidden="true" />
            <p class="text-small">No flagged content</p>
        </div>
        <!-- UIA-F-199: loading is Skeleton rows in the queue's shape. -->
        <div
            v-else-if="!error && loading && !flaggedEntries.length"
            class="flex flex-col gap-2"
            aria-hidden="true"
        >
            <Skeleton v-for="i in 3" :key="i" class="h-16 rounded-card" />
        </div>

        <!-- Cursor "load more" — the converged flagged stream is cursor-paginated
             (CRUD-CONTRACT §6); there is no total/page count, so the offset
             nav is replaced by an opaque-cursor incremental loader. -->
        <nav
            v-if="hasMore && !loading"
            class="flex items-center justify-center text-caption text-muted-foreground"
            aria-label="Flagged entries pagination"
        >
            <Button
                emphasis="quiet"
                size="sm"
                class="gap-1.5"
                :disabled="loadingMore || busy"
                aria-label="Load more flagged entries"
                @click="loadMore()"
            >
                <!-- UIA-F-251: "more below" is a chevron, not a refresh glyph. -->
                <ChevronDown class="h-3.5 w-3.5" aria-hidden="true" />
                {{ loadingMore ? "Loading…" : "Load more" }}
            </Button>
        </nav>

        <ConfirmDialog
            :open="confirmation.open.value"
            :busy="confirmation.busy.value"
            title="Delete gallery entry?"
            confirm-label="Delete"
            @update:open="confirmation.setOpen"
            @confirm="confirmDelete"
        >
            This shall permanently delete the flagged entry
            <span class="font-mono">{{ pendingDelete?.label }}</span>.
            The action is irrevocable.
        </ConfirmDialog>
    </div>
</template>
