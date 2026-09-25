<script setup lang="ts">
import { ref, computed, watch, onScopeDispose, useTemplateRef } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { Card } from "@mkbabb/glass-ui/card";
import { Alert, AlertDescription, AlertTitle, Checkbox, Skeleton } from "@mkbabb/glass-ui";
import { useOffsetPagination } from "@/composables/useOffsetPagination";
import { useAuthStore } from "@/stores/auth";
import { toast } from "@mkbabb/glass-ui/toast";
import { ERROR_TOAST } from "@/lib/toast-policy";
import { useDestructiveConfirm } from "@/composables/useDestructiveConfirm";
import ConfirmDialog from "@/components/shared/ConfirmDialog.vue";
import * as api from "@/lib/api";
import BatchActionBar from "./BatchActionBar.vue";
import AdminUserToolbar from "./AdminUserToolbar.vue";
import AdminUserTable from "./AdminUserTable.vue";
import Pager from "@/components/shared/Pager.vue";
import type { AdminUserInfo } from "@/lib/types";
import { problemDetail } from "@/lib/api-problem";
import { Trash2, Ban, UserCheck, Users, CircleAlert } from "@lucide/vue";

const auth = useAuthStore();

const searchQuery = ref("");
const sortMode = ref<"newest" | "last_seen" | "entries">("newest");
let searchTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * X·F F.W4 `.d` — FR-AUL-30 / AA-28 (SP-12, the `getAdminToken()!` type-lie).
 *
 * Six call sites asserted a `string | null` non-null. On the null path
 * `coreFetch` throws its own developer string — *"coreFetch: auth='admin'
 * requires adminToken"* — which five catches rendered verbatim into an
 * operator-facing toast. The assertion is replaced by the guard the type always
 * demanded, and the message says what an admin can act on.
 *
 * ⊘ The 11-site sweep across the other two panels and the store is SP-12's lane
 * carry; this is its AdminUserList member.
 */
function requireAdminToken(): string {
    const token = auth.getAdminToken();
    if (!token) throw new Error("Admin session has expired — re-enter admin mode.");
    return token;
}

const {
    items: users,
    total,
    page,
    pageCount,
    loading,
    error,
    hasNext,
    hasPrev,
    pageSize,
    loadPage,
    nextPage,
    prevPage,
} = useOffsetPagination<AdminUserInfo>({
    fetchFn: async (limit, offset) => {
        const token = requireAdminToken();
        const result = await api.listAdminUsers(token, {
            page: Math.floor(offset / limit) + 1,
            limit,
            sort: sortMode.value,
            q: searchQuery.value || undefined,
        });
        return { data: result.items, total: result.total };
    },
    pageSize: 20,
    // UIA-F-195: a page turn lands on the list's head, not its old scroll offset.
    scrollTarget: useTemplateRef<HTMLElement>("listHead"),
});

/** UIA-F-250: the pager's rows-per-page; a new size re-reads from page 1. */
const PAGE_SIZES = ["20", "50", "100"] as const;
const pageSizeModel = computed({
    get: () => String(pageSize.value),
    set: (v: string) => {
        pageSize.value = Number(v);
        loadPage(1);
    },
});

/** UIA-F-193 / UIA-F-250: the list's one count, pluralised. */
const totalLabel = computed(() => `${total.value} ${total.value === 1 ? "user" : "users"}`);

// Load first page on mount.
loadPage(1);

// Debounced search.
watch(searchQuery, () => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => loadPage(1), 300);
});

// Reload on sort change.
watch(sortMode, () => loadPage(1));

/**
 * X·F F.W4 `.d` — FR-AUL-1 (BLOCKER): selection survives a refilter.
 *
 * `watch(page, clearSelection)` was the SOLE invalidation edge, and both
 * refilters call `loadPage(1)` — which, from page 1, is an `Object.is`-guarded
 * identity write that never fires the watcher. So a search or a sort left the
 * ticked slugs in the set while the rows carrying them left the screen, and the
 * batch cascade then fired at users the operator could not see, behind a confirm
 * that named none of them. The backend is a HARD cascade with no restore (flags
 * → visualizations → sessions → `users.delete_one`), unlike the visualizations
 * batch, which soft-deletes.
 *
 * The repo convicts itself here: the sibling gallery toolbar
 * (`GalleryView.vue`) clears its selection on BOTH of its invalidating events.
 *
 * ⊘ The snapshot-at-ask discipline is PRESERVED (superlative S-row): `askBatch`
 * still freezes the set at the moment of asking. It froze a set that was already
 * wrong; it was never the defect.
 */
watch([searchQuery, sortMode], () => clearSelection());

/**
 * FR-AUL-15: no unmount teardown under a mount pattern that GUARANTEES unmount
 * (`defineAsyncComponent` + a bare `v-if`, no KeepAlive). The raw `searchTimer`
 * outlived the component and fired `loadPage(1)` against a dead scope — and
 * `deactivateAdmin()` both unmounts this panel and clears the token, so the
 * orphan ran its admin fetch with no credential.
 */
onScopeDispose(() => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = null;
});

// Destructive-confirm dialog state — supplants native `confirm()`.
// `batch` actions ride the same dialog as the singular destructive flow; the
// CRUD CONTRACT `BatchResponse` lands at the wrapper-call site.
type BatchKind = "suspend" | "unsuspend" | "delete";
type PendingAction =
    | { kind: "delete"; slug: string }
    | { kind: "prune" }
    | { kind: "batch"; action: BatchKind; slugs: string[] };

/**
 * FR-AUL-32: an in-flight guard on the eight mutation controls, read by every
 * control's `:disabled`, so the window closes at the affordance rather than
 * behind it. X.F.W14V.au4 — A2-FO-L1-9: it is also the confirm's lock
 * (`useDestructiveConfirm`), so the row menus and the dialog read one flag, and
 * the dialog closes after the act settles.
 */
const busy = ref(false);
const confirmation = useDestructiveConfirm<PendingAction>({ busy });
const pending = confirmation.pending;

function askDelete(slug: string) {
    confirmation.ask({ kind: "delete", slug });
}

function askPrune() {
    confirmation.ask({ kind: "prune" });
}

function askBatch(action: BatchKind) {
    if (!selected.value.size) return;
    confirmation.ask({ kind: "batch", action, slugs: Array.from(selected.value) });
}

function confirmPending() {
    return confirmation.confirm(async (action) => {
        if (action.kind === "delete") await performDelete(action.slug);
        else if (action.kind === "prune") await performPrune();
        else await performBatch(action.action, action.slugs);
    });
}

const confirmTitle = computed(() => {
    const p = pending.value;
    if (!p) return "";
    if (p.kind === "prune") return "Prune empty users?";
    if (p.kind === "delete") return "Delete user?";
    const n = p.slugs.length;
    const noun = n === 1 ? "user" : "users";
    return p.action === "delete" ? `Delete ${n} ${noun}?` : p.action === "suspend" ? `Suspend ${n} ${noun}?` : `Reinstate ${n} ${noun}?`;
});
const confirmLabel = computed(() => {
    const p = pending.value;
    if (p?.kind === "prune") return "Prune";
    if (p?.kind === "batch") return p.action === "delete" ? "Delete" : p.action === "suspend" ? "Suspend" : "Reinstate";
    return "Delete";
});

// ── Multi-select state ─────────────────────────────────────────────────
// `selected` holds the user-slugs currently checked; `selected.size`
// gates the floating batch toolbar. Page changes clear the selection
// to prevent stale slugs persisting across views.
const selected = ref<Set<string>>(new Set());

function toggleSelected(slug: string, checked: boolean | "indeterminate") {
    const next = new Set(selected.value);
    if (checked === true) next.add(slug);
    else next.delete(slug);
    selected.value = next;
}

const allOnPageSelected = computed(() =>
    users.value.length > 0 && users.value.every((u) => selected.value.has(u.user_slug)),
);

const someOnPageSelected = computed(() =>
    users.value.some((u) => selected.value.has(u.user_slug)),
);

function toggleSelectAllOnPage(checked: boolean | "indeterminate") {
    const next = new Set(selected.value);
    if (checked === true) {
        for (const u of users.value) next.add(u.user_slug);
    } else {
        for (const u of users.value) next.delete(u.user_slug);
    }
    selected.value = next;
}

function clearSelection() {
    selected.value = new Set();
}

/**
 * FR-AUL-22: a single-row delete or suspend never evicted that slug from
 * `selected` — only the batch path and the X cleared anything — so the toolbar
 * reported a selection with no ticked box on screen and a later batch shipped the
 * dead slug, whose `deleted_count` of 0 came back as a green "Deleted 0 user(s)".
 * ⊘ Booked SEPARATELY from FR-AUL-1: no filter change is involved, so the
 * watch-cure does not close it.
 */
function forgetSelected(slug: string) {
    if (!selected.value.has(slug)) return;
    const next = new Set(selected.value);
    next.delete(slug);
    selected.value = next;
}

/**
 * FR-AUL-47: the toolbar offered actions provably inapplicable to the current
 * selection — 20 active users plus Unsuspend gave a full destructive modal and
 * then a green "Unsuspended 0 user(s)". `status` is in hand per row, so the
 * affordance can tell the truth before the counting defect (FR-AUL-13) has to.
 */
const selectedUsers = computed(() =>
    users.value.filter((u) => selected.value.has(u.user_slug)),
);
const suspendableCount = computed(
    () => selectedUsers.value.filter((u) => u.status !== "suspended").length,
);
const unsuspendableCount = computed(
    () => selectedUsers.value.filter((u) => u.status === "suspended").length,
);

watch(page, () => clearSelection());

async function performBatch(action: BatchKind, slugs: string[]) {
    try {
        const token = requireAdminToken();
        const result = await api.batchUsers(token, action, slugs);
        const verb =
            action === "suspend"
                ? "Suspended"
                : action === "unsuspend"
                  ? "Unsuspended"
                  : "Deleted";
        const n = result.affected;
        toast({ title: `${verb} ${n} ${n === 1 ? "user" : "users"}`, tone: "success" });
        if (result.errors?.length) {
            for (const err of result.errors) toast({ ...ERROR_TOAST, title: err });
        }
        clearSelection();
        await loadPage();
    } catch (e: unknown) {
        if (!api.isAbortError(e)) {
            toast({ ...ERROR_TOAST, title: "Batch action failed", description: problemDetail(e) });
        }
    }
}

async function handleSuspend(slug: string) {
    if (busy.value) return;
    busy.value = true;
    try {
        const token = requireAdminToken();
        await api.setAdminUserStatus(token, slug, "suspended");
        toast({ title: "User suspended — their active sessions have been revoked", tone: "success" });
        forgetSelected(slug);
        await loadPage();
    } catch (e: unknown) {
        if (!api.isAbortError(e)) {
            toast({ ...ERROR_TOAST, title: "Failed to suspend", description: problemDetail(e) });
        }
    } finally {
        busy.value = false;
    }
}

async function handleUnsuspend(slug: string) {
    if (busy.value) return;
    busy.value = true;
    try {
        const token = requireAdminToken();
        await api.setAdminUserStatus(token, slug, "active");
        toast({ title: "User reinstated", tone: "success" });
        forgetSelected(slug);
        await loadPage();
    } catch (e: unknown) {
        if (!api.isAbortError(e)) {
            toast({ ...ERROR_TOAST, title: "Failed to unsuspend", description: problemDetail(e) });
        }
    } finally {
        busy.value = false;
    }
}

async function performDelete(slug: string) {
    try {
        const token = requireAdminToken();
        await api.deleteAdminUser(token, slug);
        toast({ title: "User deleted", tone: "success" });
        forgetSelected(slug);
        await loadPage();
    } catch (e: unknown) {
        if (!api.isAbortError(e)) {
            toast({ ...ERROR_TOAST, title: "Failed to delete", description: problemDetail(e) });
        }
    }
}

async function performPrune() {
    try {
        const token = requireAdminToken();
        const result = await api.pruneEmptyUsers(token);
        const n = result.pruned;
        toast({ title: `Pruned ${n} empty ${n === 1 ? "user" : "users"}`, tone: "success" });
        clearSelection();
        // ⊘ S-7: prune's deliberate `loadPage(1)` reset is PRESERVED — the whole
        // population may have moved, so page 1 is the only honest destination.
        await loadPage(1);
    } catch (e: unknown) {
        if (!api.isAbortError(e)) {
            toast({ ...ERROR_TOAST, title: "Failed to prune", description: problemDetail(e) });
        }
    }
}

</script>

<template>
    <div class="flex flex-col gap-3 px-[var(--page-gutter)] py-2">
        <!-- X.F.W14V.au4 — A2-FO-L1-27: the toolbar is its own file. -->
        <AdminUserToolbar v-model:query="searchQuery" v-model:sort="sortMode" @prune="askPrune" />

        <!-- Failure. FR-AUL-2: the composable produced `error` and nothing ever
             consumed it, so a failed list load rendered the PREVIOUS page's rows
             under the new page number — or, on first load, "No users found". The
             read path was the only one of six that could not speak. -->
        <!-- X.F.W14U.admin — UIA-F-199: the failure is glass Alert (the
             destructive feedback tone, an alert glyph — not the list's own
             icon), its description the problem's detail (`problemMessage` in
             the composable), and one retry. -->
        <Alert v-if="error" tone="destructive" announce="assertive">
            <CircleAlert aria-hidden="true" />
            <AlertTitle>The user list could not be loaded.</AlertTitle>
            <AlertDescription class="flex flex-col items-start gap-2">
                <span>{{ error }}</span>
                <Button emphasis="secondary" size="sm" @click="loadPage()">Try again</Button>
            </AlertDescription>
        </Alert>

        <template v-else>
        <!-- FR-AUL-5: the documented `data-some` indeterminate mechanism DID NOT
             EXIST — two hits in the tree, the comment and the binding, and no
             selector anywhere consuming it. At 5-of-20 the gate to a hard cascade
             therefore rendered fully UNCHECKED, and clicking it added the other
             15. The primitive ships indeterminate whole (fill + glyph swap + a
             `boolean | "indeterminate"` contract), so the state is passed, not
             painted. FR-AUL-36: the label is a real `<label>` with a hit area,
             and it stops being overwritten by a count rendered fourteen lines
             below the moment the affordance becomes useful. -->
        <div
            v-if="users.length"
            class="flex items-center gap-2 px-1 text-caption text-muted-foreground"
        >
            <Checkbox
                id="admin-select-all"
                :model-value="
                    someOnPageSelected && !allOnPageSelected
                        ? 'indeterminate'
                        : allOnPageSelected
                "
                :disabled="busy"
                @update:model-value="(v) => toggleSelectAllOnPage(v)"
            />
            <!-- UIA-F-193: the selection count is the batch bar's alone (it was
                 printed twice); the list's own count heads the list. -->
            <label for="admin-select-all" class="cursor-pointer select-none">
                Select all on page
            </label>
            <h2 class="ml-auto text-caption font-medium text-foreground">{{ totalLabel }}</h2>
        </div>


        <!-- User list. FR-AUL-8: the old `v-if="loading"`/`v-if="!loading"` pair
             were exact complements, so every 300 ms typing pause and every
             mutation swapped the whole list for a ~56px spinner while the
             select-all header and the batch toolbar kept rendering stale chrome
             over the blank. The rows now dim in place and announce busy.
             X.F.W14.t, OA-42 swept (COHESION §0bu). Each row was its own
             `cartoon-card`, so two adjacent rows painted three rules between
             them: a 2px bottom border, the offset stamp, and the next row's 2px
             top border. This was measured at 1440 and 390 in both themes, and it
             is the same doubled rule the owner's frame shows in the audit log.
             The rows now sit on one glass `Card` plate and use the producer's
             table-row rule: one bottom border per row, none after the last
             (glass `TableRow` + `TableBody`). The rule is coloured with the
             `--border` token. The `role="list"` sits on an inner element
             because the glass Card drops a consumer's `role` (UIA-F-43). -->
        <!-- X.F.W14V.au4 — A2-FO-L1-27: the rows are glass DataTable
             (`AdminUserTable`), one idiom with the audit log. The ledger's name
             rides a region around it (glass names only the table projection),
             and the region sets the admin rung the card projection inherits. -->
        <div ref="listHead" class="scroll-mt-4" />
        <Card v-show="users.length" size="sm" :class="loading && 'opacity-60'">
            <div role="region" aria-label="Admin user list" class="text-small" :aria-busy="loading || undefined">
                <AdminUserTable
                    :users="users"
                    :selected="selected"
                    :busy="busy"
                    :loading="loading"
                    @toggle="toggleSelected"
                    @suspend="handleSuspend"
                    @unsuspend="handleUnsuspend"
                    @delete="askDelete"
                />
            </div>
        </Card>

        <!-- X.F.W14.u — UIA-F-36: the bar is mounted AFTER the list it acts on.
             Mounted before it, its sticky seat resolved against the top of the
             scroller (top −591 px desktop, −771 px mobile) and its first tick
             inserted 56–68 px above the rows — the FR-AUL-51 displacement the
             note below says the bottom seat cures. GalleryView mounts its bar
             after the grid for the same reason. -->
        <!-- Floating batch-action toolbar. Renders when the selection set is
             non-empty; routes through the destructive-confirm dialog before
             firing `batchUsers` against `{ok, affected, errors?}`. -->
        <!-- X.F.W3 `.e` — the HOST half of section-5a split (5). The toolbar
             chrome was authored TWICE, divergent on six positioning decisions;
             `.d` settled all six once in `BatchActionBar.vue` at `aa9e12c`, and
             this call site adopts it rather than re-deciding any of them. What
             this surface keeps is what is actually its own: its verbs, their
             counts, and the `aria-describedby` sentences that explain why a
             control is unavailable.

             Two of the six change behaviour HERE and both are `.d`'s decisions,
             not this seat's: the bar seats at the BOTTOM edge (FR-AUL-51 — a
             `sticky top-2` bar inside the scroller it shares with the list
             displaces every row downward at the first tick, so the pointer that
             ticked row n is then over row n−1), and the plate takes the single
             z-tier. The inline inset is the host's, supplied through `class`,
             because the two hosts' padding contexts differ. -->
        <BatchActionBar
            :count="selected.size"
            noun="user"
            label="Batch user actions"
            :busy="busy"
            @clear="clearSelection"
        >
            <!-- FR-AUL-41: `title` was carrying the ONLY explanation of why a
                 control is unavailable — and `title` on a DISABLED element is
                 reachable by no one: not the pointer (no hover target), not the
                 keyboard (not focusable), not a screen reader. Tooltip cannot take
                 it either, for the same reason. A described-by sentence is exposed
                 on a disabled button in the accessibility tree, which is where the
                 reason has to live. -->
            <Button
                emphasis="secondary"
                size="sm"
                :disabled="busy || suspendableCount === 0"
                :aria-describedby="suspendableCount === 0 ? 'batch-suspend-why' : undefined"
                @click="askBatch('suspend')"
            >
                <Ban class="mr-1 size-3.5" aria-hidden="true" />
                Suspend<span v-if="suspendableCount">&nbsp;({{ suspendableCount }})</span>
            </Button>
            <span id="batch-suspend-why" class="sr-only">
                Every selected user is already suspended.
            </span>
            <Button
                emphasis="secondary"
                size="sm"
                :disabled="busy || unsuspendableCount === 0"
                :aria-describedby="unsuspendableCount === 0 ? 'batch-reinstate-why' : undefined"
                @click="askBatch('unsuspend')"
            >
                <UserCheck class="mr-1 size-3.5" aria-hidden="true" />
                Reinstate<span v-if="unsuspendableCount">&nbsp;({{ unsuspendableCount }})</span>
            </Button>
            <span id="batch-reinstate-why" class="sr-only">
                No selected user is suspended.
            </span>
            <Button
                emphasis="primary" tone="destructive"
                size="sm"
                :disabled="busy"
                @click="askBatch('delete')"
            >
                <Trash2 class="mr-1 size-3.5" aria-hidden="true" />
                Delete
            </Button>
        </BatchActionBar>

        <!-- FR-AUL-34: these two blocks were INSIDE the `role="list"` container
             and carry no `listitem` role — axe `aria-required-children`, manifest
             exactly when the list is empty, which is the only moment they render.
             Hoisted to siblings; the list keeps only its rows. -->
        <div
            v-if="!users.length && !loading"
            class="flex flex-col items-center gap-2 py-8 text-muted-foreground"
        >
            <Users class="h-8 w-8 opacity-30" aria-hidden="true" />
            <p class="text-small">
                {{ searchQuery ? "No users match this search" : "No users found" }}
            </p>
        </div>
        <!-- UIA-F-250 / UIA-F-199: loading is the list's own shape in glass
             Skeleton rows, not a bare "Loading users…" line. -->
        <div
            v-else-if="!users.length && loading"
            class="flex flex-col gap-2"
            aria-hidden="true"
        >
            <Skeleton v-for="i in 3" :key="i" class="h-12 rounded-card" />
        </div>

        <!-- FR-AUL-9: search results were never announced, and BOTH of this
             panel's live regions were conditionally mounted WITH their content —
             the spinner's `role="status"` sat inside `v-if="loading"`, and the
             pager's `aria-live` span inside `<nav v-if="pageCount > 1">`, which
             unmounts precisely when a search narrows the result set. That is the
             announcement pattern least likely to ever fire: a region born at the
             same instant as its message has nothing to change. `{{ total }}` — the
             one datum that answers "did my search work?" — was behind the same
             gate. One region, mounted always, outside every gate. -->
        <p class="sr-only" role="status" aria-live="polite">
            {{
                error
                    ? "The user list could not be loaded."
                    : loading
                      ? "Loading users."
                      : users.length
                        ? `Showing ${users.length} users, page ${page} of ${pageCount}, ${total} total.`
                        : searchQuery
                          ? "No users match this search."
                          : "No users found."
            }}
        </p>

        <!-- Pagination — minimal local Button-based control;
             a canonical glass-ui `<Pagination>` primitive is the named carry.
             AA-22 (family arm): the two `h-7 w-7` literals are gone. `cn`'s
             `["height", /^h-/]` bucket is last-write-wins, so a consumer literal
             overwrites the cva's `h-(--control-h-*)` rung — and that rung is a
             `max(scaled, --control-floor)` clamp whose coarse-pointer block is the
             producer's whole WCAG-2.5.5 mechanism. `h-7` pinned 28 px on touch. -->

        <!-- X.F.W14U.admin — UIA-F-250 ⊕ UIA-F-194 ⊕ UIA-F-252: the admin
             pager, one composition for the offset ledgers (users, audit):
             first · previous · "Page n of m" · next · last, the rows-per-page
             size, and the total — one voice, no "1 / 3 … total" run. -->
        <!-- X.F.W14V.au4 — A2-FO-L1-27: the one offset pager (`shared/Pager`),
             shared with the audit log; glass Pagination is ADOPT-AT-LANDING
             (UIA-F-145). -->
        <Pager
            v-if="users.length"
            v-model:page-size="pageSizeModel"
            label="User list pagination"
            :page="page"
            :page-count="pageCount"
            :has-prev="hasPrev"
            :has-next="hasNext"
            :sizes="PAGE_SIZES"
            :total-label="totalLabel"
            @go="loadPage"
            @prev="prevPage()"
            @next="nextPage()"
        />
        </template>

        <!-- Destructive-confirm dialog — replaces native `confirm()`. -->
        <ConfirmDialog
            :open="confirmation.open.value"
            :busy="busy"
            :title="confirmTitle"
            :confirm-label="confirmLabel"
            :tone="pending?.kind === 'batch' && pending.action !== 'delete' ? 'neutral' : 'destructive'"
            @update:open="confirmation.setOpen"
            @confirm="confirmPending"
        >
            <template v-if="pending?.kind === 'delete'">
                This shall permanently delete user
                <span class="font-mono">{{ pending.slug }}</span>
                and all their gallery entries. The action is irrevocable.
            </template>
            <!-- FR-AUL-25 (copy leg): the highest-blast-radius control
                 announced an unbounded permanent deletion with NO
                 number and no preview, while both of its dialog
                 neighbours named a victim or a count. The magnitude is
                 knowable before the act — the router computes
                 `empty_slugs` and then deletes — so the copy says that
                 the count is owed. ⊘ The count/dry-run ENDPOINT is
                 F.W5's; this is the F.W4 copy it carries. -->
            <template v-else-if="pending?.kind === 'prune'">
                This permanently deletes every user who currently has zero
                gallery entries. It cannot be undone, and the number of
                users affected is not shown until afterwards.
            </template>
            <!-- FR-AUL-1: the batch confirm ENUMERATES its targets.
                 The singular path named its exact victim in font-mono
                 while the cascade — the more dangerous action — said
                 only "the selected users", so an operator could not
                 see what a leaked selection had added. -->
            <template v-else-if="pending?.kind === 'batch'">
                <span v-if="pending.action === 'delete'">
                    This permanently deletes the users below and all their
                    gallery entries. It cannot be undone.
                </span>
                <span v-else-if="pending.action === 'suspend'">
                    The users below are suspended and their active sessions
                    are revoked — they are signed out everywhere.
                </span>
                <span v-else>
                    The users below are reinstated to active status.
                </span>
                <span
                    class="mt-2 block max-h-32 overflow-y-auto rounded border border-border/60 px-2 py-1 font-mono text-caption"
                >
                    <span
                        v-for="slug in pending.slugs"
                        :key="slug"
                        class="block truncate"
                    >{{ slug }}</span>
                </span>
            </template>
        </ConfirmDialog>
    </div>
</template>
