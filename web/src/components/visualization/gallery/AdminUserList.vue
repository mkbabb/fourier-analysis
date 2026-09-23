<script setup lang="ts">
import { ref, computed, watch, onScopeDispose } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { Input } from "@mkbabb/glass-ui/input";
import { Badge } from "@mkbabb/glass-ui/badge";
import { Card } from "@mkbabb/glass-ui/card";
import { Checkbox } from "@mkbabb/glass-ui";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@mkbabb/glass-ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@mkbabb/glass-ui/select";
import { useOffsetPagination } from "@/composables/useOffsetPagination";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/composables/useToast";
import * as api from "@/lib/api";
import { useRelativeTime } from "@/lib/time";
import BatchActionBar from "./BatchActionBar.vue";
import type { AdminUserInfo } from "@/lib/types";
import { problemMessage } from "./adminError";
import {
    Search,
    Trash2,
    Ban,
    UserCheck,
    Users,
    ChevronLeft,
    ChevronRight,
} from "@lucide/vue";

const auth = useAuthStore();
const { toast } = useToast();

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
});

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
const pending = ref<PendingAction | null>(null);
const dialogOpen = ref(false);

function askDelete(slug: string) {
    pending.value = { kind: "delete", slug };
    dialogOpen.value = true;
}

function askPrune() {
    pending.value = { kind: "prune" };
    dialogOpen.value = true;
}

function askBatch(action: BatchKind) {
    if (!selected.value.size) return;
    pending.value = {
        kind: "batch",
        action,
        slugs: Array.from(selected.value),
    };
    dialogOpen.value = true;
}

/**
 * FR-AUL-32: an in-flight guard on the eight mutation controls. There was none —
 * and `confirmPending` nulled `pending` AFTER its await, so a dialog re-opened
 * during a slow mutation had its action destroyed under it and the second
 * confirm silently no-opped. The flag is read by every control's `:disabled`, so
 * the window closes at the affordance rather than behind it.
 */
const busy = ref(false);

async function confirmPending() {
    const action = pending.value;
    dialogOpen.value = false;
    // Released at the ask, not after the await: the action is already in hand.
    pending.value = null;
    if (!action || busy.value) return;
    busy.value = true;
    try {
        if (action.kind === "delete") await performDelete(action.slug);
        else if (action.kind === "prune") await performPrune();
        else await performBatch(action.action, action.slugs);
    } finally {
        busy.value = false;
    }
}

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
        toast(`${verb} ${n} ${n === 1 ? "user" : "users"}`, "success");
        if (result.errors?.length) {
            for (const err of result.errors) toast(err, "error");
        }
        clearSelection();
        await loadPage();
    } catch (e: unknown) {
        if (!api.isAbortError(e)) {
            toast(problemMessage(e, "Batch action failed"), "error");
        }
    }
}

async function handleSuspend(slug: string) {
    if (busy.value) return;
    busy.value = true;
    try {
        const token = requireAdminToken();
        await api.setAdminUserStatus(token, slug, "suspended");
        toast("User suspended — their active sessions have been revoked", "success");
        forgetSelected(slug);
        await loadPage();
    } catch (e: unknown) {
        if (!api.isAbortError(e)) {
            toast(problemMessage(e, "Failed to suspend"), "error");
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
        toast("User reinstated", "success");
        forgetSelected(slug);
        await loadPage();
    } catch (e: unknown) {
        if (!api.isAbortError(e)) {
            toast(problemMessage(e, "Failed to unsuspend"), "error");
        }
    } finally {
        busy.value = false;
    }
}

async function performDelete(slug: string) {
    try {
        const token = requireAdminToken();
        await api.deleteAdminUser(token, slug);
        toast("User deleted", "success");
        forgetSelected(slug);
        await loadPage();
    } catch (e: unknown) {
        if (!api.isAbortError(e)) {
            toast(problemMessage(e, "Failed to delete"), "error");
        }
    }
}

async function performPrune() {
    try {
        const token = requireAdminToken();
        const result = await api.pruneEmptyUsers(token);
        const n = result.pruned;
        toast(`Pruned ${n} empty ${n === 1 ? "user" : "users"}`, "success");
        clearSelection();
        // ⊘ S-7: prune's deliberate `loadPage(1)` reset is PRESERVED — the whole
        // population may have moved, so page 1 is the only honest destination.
        await loadPage(1);
    } catch (e: unknown) {
        if (!api.isAbortError(e)) {
            toast(problemMessage(e, "Failed to prune"), "error");
        }
    }
}

/**
 * X.F.W3 `.e` / `fr-AdminUserList FR-AUL-17` — the fourth of five copies
 * retires onto `lib/time.ts`, and the list maps itself ONCE per tick.
 *
 * The copy this replaces was the no-floor dialect: a three-second-old account
 * read "0m ago" here and "just now" in the gallery card beside it. It also
 * sampled `Date.now()` during render, so on an admin page left open the two
 * columns froze. `useRelativeTime` binds the app's ONE shared clock, and the
 * mapping lives in a computed so a row costs one `relativeTime` call per field
 * per tick rather than one per template read.
 */
const relative = useRelativeTime();

const userRows = computed(() =>
    users.value.map((user) => ({
        user,
        joined: relative(user.created_at),
        seen: relative(user.last_seen_at),
    })),
);
</script>

<template>
    <div class="flex flex-col gap-3 px-4 py-2">
        <!-- Search + sort + prune. X.F.W14.u — UIA-F-37: below `sm` the toolbar
             wraps and the search takes the full row (it was crushed to 68 px,
             "Se", beside a fixed 160 px Select); the Select's `h-8 w-[10rem]
             text-sm` literals are gone, so its rung and type come from the
             producer (the AA-22 note forbids the `h-*` literal). -->
        <div class="flex flex-wrap items-center gap-2">
            <div class="relative basis-full sm:basis-0 sm:flex-1">
                <Search
                    class="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"
                    aria-hidden="true"
                />
                <!-- FR-AUL-6 ⊕ FR-AUL-23 ⊕ FR-AUL-40 — one swap, three cures.
                     The raw `<input>` carried `outline-none` + `focus:ring-1`,
                     which annihilates the focus indicator under forced-colors:
                     the v4 forced-colors escape `.outline-hidden` is absent from
                     the build (unused), and the producer's restore block is a
                     CLOSED selector list this element was not in — while the
                     Checkbox two elements away carries `focus-ring` natively. Its
                     bare `border` drew in `currentColor` (v4 preflight resets
                     `border: 0 solid` with no colour, `.border` carries none, and
                     no base `border-color` rule exists in the stack): a near-black
                     hairline in light mode on the one field surrounded by muted
                     token edges — the classic v3→v4 casualty. And `type="text"`
                     on a machine-generated lowercase-slug datum hand-waved the
                     clear control the UA supplies for free.
                     ⊘ Census correction: the ruled cure named `./forms` → `Input`.
                     `./forms` does NOT exist at the adopted glass-ui 8.0.0 pin —
                     the export map carries `./input`, `./label`, `./labeled-field`,
                     `./search`, `./textarea`, `./number-field` in its place, and
                     the base class is `field-control glass-control-edge`, not
                     `input-pill`. Same primitive, relocated; booked in the
                     addendum. -->
                <Input
                    v-model="searchQuery"
                    type="search"
                    size="sm"
                    placeholder="Search users..."
                    aria-label="Search users"
                    autocapitalize="none"
                    autocorrect="off"
                    spellcheck="false"
                    enterkeyhint="search"
                    class="w-full pl-7"
                />
            </div>
            <Select v-model="sortMode">
                <SelectTrigger class="shrink-0" aria-label="Sort users">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="last_seen">Last seen</SelectItem>
                    <SelectItem value="entries">Most entries</SelectItem>
                </SelectContent>
            </Select>
            <!-- FR-AUL-7 (prune arm) ⊕ FR-AUL-26 ⊕ FR-AUL-41.
                 The control read ≈1.3:1 in the light arm — `amber-300` ink on a
                 10 %-alpha `amber-500` plate, a third hand-rolled palette literal
                 on the panel's most consequential global operation.
                 The producer's `ButtonTone` is `neutral | destructive` by the
                 sub-range law ("a command is neutral or it is destructive;
                 success/warning/info are MESSAGE tones and live on Alert/Toast"),
                 so the amber the literals were reaching for has no command
                 register — and the honest one is `destructive`: prune deletes
                 users. `emphasis="secondary"` keeps it out of the primary slot.
                 FR-AUL-26 (WCAG 2.5.3, Level A): the visible string "Prune empty",
                 the `aria-label` "Prune users with zero entries" and the `title`
                 "Remove users with 0 entries" were three MUTUALLY EXCLUSIVE names
                 for one irrevocable operation — a speech-input user reading the
                 button aloud could not activate it. The accessible name now
                 CONTAINS the visible string, and FR-AUL-41's divergent `title` is
                 gone rather than made to disagree more quietly. -->
            <Button
                emphasis="secondary"
                tone="destructive"
                size="sm"
                aria-label="Prune empty users — removes every user with zero entries"
                @click="askPrune"
            >
                Prune empty
            </Button>
        </div>

        <!-- Failure. FR-AUL-2: the composable produced `error` and nothing ever
             consumed it, so a failed list load rendered the PREVIOUS page's rows
             under the new page number — or, on first load, "No users found". The
             read path was the only one of six that could not speak. -->
        <div
            v-if="error"
            role="alert"
            class="flex flex-col items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 py-8 text-center"
        >
            <Users class="h-8 w-8 text-destructive opacity-70" aria-hidden="true" />
            <p class="text-sm font-medium">The user list could not be loaded.</p>
            <p class="max-w-prose text-xs text-muted-foreground">{{ error }}</p>
            <Button emphasis="secondary" size="sm" @click="loadPage()">Try again</Button>
        </div>

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
            class="flex items-center gap-2 px-1 text-xs text-muted-foreground"
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
            <label for="admin-select-all" class="cursor-pointer select-none">
                Select all on page
                <span v-if="selected.size > 0">({{ selected.size }} selected)</span>
            </label>
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
        <Card v-show="userRows.length" size="sm" :class="loading && 'opacity-60'">
            <div
                class="flex flex-col"
                role="list"
                aria-label="Admin user list"
                :aria-busy="loading || undefined"
            >
                <div
                    v-for="{ user, joined, seen } in userRows"
                    :key="user.user_slug"
                    role="listitem"
                    class="flex items-center gap-3 border-b border-border px-3 py-2 text-sm last:border-b-0"
                    :data-selected="selected.has(user.user_slug) || undefined"
                >
                    <Checkbox
                        :model-value="selected.has(user.user_slug)"
                        :aria-label="`Select user ${user.user_slug}`"
                        class="h-4 w-4 shrink-0"
                        @update:model-value="(v) => toggleSelected(user.user_slug, v)"
                    />
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <span class="font-mono text-xs truncate">{{ user.user_slug }}</span>
                            <!-- FR-AUL-7: the SOLE "suspended" signifier was
                                 `bg-red-500/20` + `text-red-400` over light
                                 `--card: hsl(36 48% 97%)` ≈ 2.0:1 at the 10 px micro
                                 rung — a hand-rolled palette literal reaching past the
                                 repo's own ratified axe-contrast carry to a value ~2.5×
                                 worse than the one the project had already rejected.
                                 `Badge tone="destructive"` is the producer's paired
                                 `--destructive` / `--destructive-foreground` register,
                                 which is calibrated in both arms. -->
                            <Badge
                                v-if="user.status === 'suspended'"
                                tone="destructive"
                                size="sm"
                                class="uppercase"
                            >suspended</Badge>
                        </div>
                        <div class="flex gap-3 text-mono-micro uppercase font-medium text-muted-foreground mt-0.5">
                            <span>{{ user.entry_count }} entries</span>
                            <span>joined <time :datetime="joined.datetime" :title="joined.absolute">{{ joined.text }}</time></span>
                            <span>seen <time :datetime="seen.datetime" :title="seen.absolute">{{ seen.text }}</time></span>
                        </div>
                    </div>
                    <div class="flex items-center gap-1">
                        <!-- FR-AUL-44: the risk ladder was INVERTED. Reversible batch
                             reinstatement got the destructive modal while the singular
                             suspend fired from a 24px icon with no confirmation — and
                             `set_user_status` runs `sessions.delete_many` on suspend,
                             an irreversible act the batch copy states and this path
                             stated nowhere. The label now carries the consequence.
                             FR-AUL-19 / AA-22 (SP-9): the `h-6 w-6` literals are gone.
                             `cn`'s height bucket is last-write-wins, so they pinned
                             24px on EVERY pointer and deleted the producer's
                             coarse-pointer clamp; the `xs` rung is 28px fine and lifts
                             to the 44px touch target on coarse, which is the contract
                             those literals were negating. -->
                        <Button
                            v-if="user.status !== 'suspended'"
                            emphasis="quiet"
                            size="xs" icon-only
                            class="text-muted-foreground hover:text-warning"
                            :aria-label="`Suspend user ${user.user_slug} and revoke their sessions`"
                            :disabled="busy"
                            @click="handleSuspend(user.user_slug)"
                        >
                            <Ban class="size-3.5" aria-hidden="true" />
                        </Button>
                        <Button
                            v-else
                            emphasis="quiet"
                            size="xs" icon-only
                            class="text-muted-foreground hover:text-success"
                            :aria-label="`Reinstate user ${user.user_slug}`"
                            :disabled="busy"
                            @click="handleUnsuspend(user.user_slug)"
                        >
                            <UserCheck class="size-3.5" aria-hidden="true" />
                        </Button>
                        <Button
                            emphasis="quiet"
                            size="xs" icon-only
                            class="text-muted-foreground hover:text-destructive"
                            :aria-label="`Delete user ${user.user_slug}`"
                            :disabled="busy"
                            @click="askDelete(user.user_slug)"
                        >
                            <Trash2 class="size-3.5" aria-hidden="true" />
                        </Button>
                    </div>
                </div>

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
                class="text-xs"
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
                class="text-xs"
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
                class="text-xs"
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
            <p class="text-sm">
                {{ searchQuery ? "No users match this search" : "No users found" }}
            </p>
        </div>
        <div
            v-else-if="!users.length && loading"
            class="py-8 text-center text-sm text-muted-foreground"
        >
            Loading users…
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

        <nav
            v-if="pageCount > 1"
            class="flex items-center justify-center gap-2 text-xs text-muted-foreground"
            aria-label="User list pagination"
        >
            <Button
                emphasis="quiet"
                size="sm"
                icon-only
                :disabled="!hasPrev"
                aria-label="Previous page"
                @click="prevPage()"
            >
                <ChevronLeft class="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <span aria-live="polite">{{ page }} / {{ pageCount }}</span>
            <Button
                emphasis="quiet"
                size="sm"
                icon-only
                :disabled="!hasNext"
                aria-label="Next page"
                @click="nextPage()"
            >
                <ChevronRight class="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <span class="ml-2">{{ total }} total</span>
        </nav>
        </template>

        <!-- Destructive-confirm dialog — replaces native `confirm()`. -->
        <Dialog v-model:open="dialogOpen">
            <DialogContent surface="opaque" class="max-w-sm">
                <DialogHeader>
                    <DialogTitle>
                        <template v-if="pending?.kind === 'prune'">Prune empty users?</template>
                        <template v-else-if="pending?.kind === 'batch'">
                            {{
                                pending.action === "delete"
                                    ? `Delete ${pending.slugs.length} ${pending.slugs.length === 1 ? "user" : "users"}?`
                                    : pending.action === "suspend"
                                      ? `Suspend ${pending.slugs.length} ${pending.slugs.length === 1 ? "user" : "users"}?`
                                      : `Reinstate ${pending.slugs.length} ${pending.slugs.length === 1 ? "user" : "users"}?`
                            }}
                        </template>
                        <template v-else>Delete user?</template>
                    </DialogTitle>
                    <DialogDescription>
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
                                class="mt-2 block max-h-32 overflow-y-auto rounded border border-border/60 px-2 py-1 font-mono text-xs"
                            >
                                <span
                                    v-for="slug in pending.slugs"
                                    :key="slug"
                                    class="block truncate"
                                >{{ slug }}</span>
                            </span>
                        </template>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button emphasis="quiet" @click="dialogOpen = false">Cancel</Button>
                    <Button
                        emphasis="primary"
                        :tone="
                            pending?.kind === 'batch' && pending.action !== 'delete'
                                ? 'neutral'
                                : 'destructive'
                        "
                        @click="confirmPending"
                    >
                        <template v-if="pending?.kind === 'prune'">Prune</template>
                        <template v-else-if="pending?.kind === 'batch'">
                            {{
                                pending.action === "delete"
                                    ? "Delete"
                                    : pending.action === "suspend"
                                      ? "Suspend"
                                      : "Reinstate"
                            }}
                        </template>
                        <template v-else>Delete</template>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>
