<script setup lang="ts">
import { ref, computed } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { Badge } from "@mkbabb/glass-ui/badge";
import { Card } from "@mkbabb/glass-ui/card";
import { Alert, AlertDescription, AlertTitle, Skeleton } from "@mkbabb/glass-ui";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@mkbabb/glass-ui/menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@mkbabb/glass-ui/dialog";
import { useAuthStore } from "@/stores/auth";
import { useGalleryStore } from "@/stores/gallery";
import { useToast } from "@/composables/useToast";
import * as api from "@/lib/api";
import { thumbnailUrl } from "@/lib/api";
import { useRelativeTime } from "@/lib/time";
import type { FlaggedVisualization, FlagInfo, GalleryTier } from "@/lib/types";
import { problemMessage } from "@/lib/api-problem";
import "./admin-row.css";
import {
    Flag,
    Trash2,
    CheckCircle2,
    ChevronDown,
    CircleAlert,
    Crown,
    Bookmark,
    EllipsisVertical,
    ImageOff,
} from "@lucide/vue";

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

function flagKey(item: FlaggedVisualization, flag: FlagInfo): string {
    return `${item.slug}:${flag.reporter_slug}`;
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

/** UIA-F-198: thumbnails that failed to load fall back to a media tile. */
const brokenThumbs = ref<Set<string>>(new Set());
function thumbFailed(slug: string) {
    brokenThumbs.value = new Set(brokenThumbs.value).add(slug);
}

reload();

// Destructive-confirm dialog state — supplants native `confirm()`.
const pendingDelete = ref<{ slug: string; label: string } | null>(null);
const dialogOpen = ref(false);

function askDelete(slug: string, label: string) {
    pendingDelete.value = { slug, label };
    dialogOpen.value = true;
}

/**
 * FR-AFP-41 (+FR-AFP-68): `pendingDelete` was not cleared on Cancel or Escape,
 * and the leak was REACHABLE — open a second row's confirm during an in-flight
 * delete (the list stayed mounted, nothing was disabled) and the first handler's
 * late null landed under the open dialog, giving an empty entity name and a
 * Delete button that silently did nothing through `confirmDelete`'s own early
 * return. Closing clears; a null target now SAYS so instead of no-opping.
 */
function onDialogOpenChange(open: boolean) {
    dialogOpen.value = open;
    if (!open) pendingDelete.value = null;
}

async function confirmDelete() {
    const target = pendingDelete.value;
    if (!target) {
        toast("Nothing to delete — the target was cleared. Try again.", "error");
        return;
    }
    if (busy.value) return;
    busySlug.value = target.slug;
    try {
        // Moderate-delete the converged entity by slug (CRUD-CONTRACT §7); the
        // admin client carries `If-Match: *` server-side (admin override, §3).
        const token = requireAdminToken();
        await api.adminDeleteVisualization(token, target.slug);
        // FR-AFP-67: the success toast fires only once the act has settled.
        // Toasting first and reloading after is what left a deleted row rendered,
        // with live buttons, under a success toast.
        // FR-AFP-15: the row is SPLICED out; the accumulated pages survive.
        dropEntry(target.slug);
        gallery.removeEntry(target.slug);
        toast("Entry deleted", "success");
        // FR-AFP-23: the dialog closes AFTER the request settles, so a slow delete
        // cannot invite a second Delete on the same row.
        onDialogOpenChange(false);
    } catch (e: unknown) {
        if (!api.isAbortError(e)) {
            toast(problemMessage(e, "Failed to delete entry"), "error");
        }
    } finally {
        busySlug.value = null;
    }
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
// reviewer who deems flagged content acceptable may "save" it (clearing the
// flag pressure while keeping it live), resolving against the converged entity
// by slug via `setVisualizationTier`.
async function handleSetTier(slug: string, tier: GalleryTier) {
    if (busy.value) return;
    busySlug.value = slug;
    try {
        const token = requireAdminToken();
        const updated = await api.setVisualizationTier(token, slug, tier);
        // FR-AFP-11 (+FR-AFP-57) / GCM-24's shape: the operation ALREADY RETURNS
        // the fresh entity (`admin.py` re-reads and returns `_public_doc(updated)`;
        // `api.ts` types it `Promise<Visualization>`), so the row is patched in
        // place at zero network cost instead of being paid for with a full reset.
        // ⊘ The cross-surface half — this panel duplicated the gallery store's
        // `setTier`/`deleteEntry` verbatim MINUS `resetAndFetch`, so
        // `gallery.entries` kept the stale tier after moderation — is the store's
        // shared-invalidation cure, landed beside this one.
        const idx = flaggedEntries.value.findIndex((e) => e.slug === slug);
        if (idx !== -1) {
            flaggedEntries.value[idx] = {
                ...flaggedEntries.value[idx],
                tier: updated?.tier ?? tier,
            };
        }
        gallery.patchEntry(slug, { tier });
        // UIA-F-197: one word for the act — the menu says Keep, so does this.
        toast(tier === "saved" ? `Kept ${slug}` : `Tier set to ${tier}`, "success");
    } catch (e: unknown) {
        if (!api.isAbortError(e)) {
            toast(problemMessage(e, "Failed to set tier"), "error");
        }
    } finally {
        busySlug.value = null;
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

/**
 * X.F.W3 repair 1 (g15, leg 1) — the fifth local relative-time copy retires
 * onto `lib/time.ts`, the one the wave created.
 *
 * This was the ADMIN dialect, and its disagreement with the gallery dialect was
 * visible in the product: with no sub-minute floor it printed "0m ago" for a
 * three-second-old flag while the card beside it said "just now". It also
 * sampled `Date.now()` during render — on a moderation queue, where the age of
 * a report is the operator's whole ordering signal — and shipped neither a cap,
 * nor a negative guard for clock skew, nor a NaN guard. `useRelativeTime` is
 * the list form of the app's one shared clock, taken once here because a
 * composable cannot be called per row of a `v-for`.
 */
const relativeTimeOf = useRelativeTime();
</script>

<template>
    <div class="flex flex-col gap-3 px-4 py-2">
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
        <Card
            v-else
            v-show="flaggedEntries.length"
            size="sm"
            :class="loading && 'opacity-60'"
        >
            <div
                class="admin-list flex flex-col"
                role="list"
                aria-label="Flagged gallery entries"
                :aria-busy="loading || undefined"
            >
                <!-- X.F.W3 `.d` — `FR-AFP-61`'s second limb (⊕ `AA-19`). The flag
                     pill became `<Badge>` at F.W4; the moderation CARD was the other
                     half of the same row and stayed a bespoke `./card`
                     re-implementation while `./card` shipped at the pin. It adopts
                     the primitive now.

                     The destructive plate is NOT re-authored in the swap: the
                     producer's own documented mechanism for a per-instance rim hue
                     is `--glass-accent`, "written by the consumer on the element"
                     (`CardProps`' docblock, which struck `variant`/`dataHue`
                     precisely so this would be one knob). So the queue keeps the
                     semantic destructive edge F.W4 measured into it, and it keeps it
                     through the design system rather than beside it.

                     `AA-19`'s census amendment rides here as a receipt rather than a
                     cure: the file-granular shadow table cannot see FRAGMENT shadows
                     — this chip, the spinner, the raw footer — which is why the
                     aggregate it feeds is not quotable, and why `g17` closes
                     honest-RED in this unit rather than on a number. -->
                <!-- X.F.W14 `.h` OA-50: the entry is the admin row idiom
                     (`admin-row.css`). Media inset by the row's own padding;
                     the title one mono `--type-small` line; Owner · Posted · Tier
                     a labelled `dl` on `--type-micro` (the bare "Normal" was the
                     tier with no name); every flag listed, and when the queue
                     carries fewer flag records than its count the list says so;
                     Keep · Dismiss · Delete one horizontal group that never
                     overruns the row (it was a stacked column whose Delete ran
                     past the card edge). FR-AFP-21 (the image rendered),
                     FR-AFP-45 / -34 / -19 / -8 / -16 (glyphs, names, disable
                     while in flight) are kept whole. -->
                <div
                    v-for="item in flaggedEntries"
                    :key="item.slug"
                    role="listitem"
                    data-admin-row
                    class="admin-row border-b border-border last:border-b-0"
                    :aria-busy="busySlug === item.slug || undefined"
                >
                    <!-- UIA-F-198: a failed thumbnail falls back to a media tile
                         (the engine's broken-image glyph and its spilled alt text
                         are gone); both are the row's media on `--radius-media`. -->
                    <img
                        v-if="item.image_slug && !brokenThumbs.has(item.slug)"
                        data-admin-media
                        :src="thumbnailUrl(item.image_slug)"
                        :alt="`Reported image ${item.image_slug}`"
                        class="admin-row__media"
                        loading="lazy"
                        @error="thumbFailed(item.slug)"
                    />
                    <span
                        v-else-if="item.image_slug"
                        data-admin-media
                        class="admin-row__media flex items-center justify-center bg-muted text-muted-foreground"
                        role="img"
                        :aria-label="`Reported image ${item.image_slug} (unavailable)`"
                    >
                        <ImageOff class="size-5" aria-hidden="true" />
                    </span>
                    <div class="admin-row__body">
                        <div class="admin-row__title" data-admin-title>
                            <!-- UIA-F-197: one destructive signal per row (Delete, in
                                 the row menu); the flag glyph and count are neutral. -->
                            <Flag class="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <span class="admin-row__title-text">{{ item.slug }}</span>
                            <Badge variant="outline" size="sm">
                                {{ item.flag_count }} {{ item.flag_count === 1 ? "flag" : "flags" }}
                            </Badge>
                        </div>
                        <dl class="admin-row__meta" data-admin-meta>
                            <div class="admin-row__field" data-admin-field>
                                <dt>Owner</dt>
                                <dd>{{ item.owner_slug ?? "anonymous" }}</dd>
                            </div>
                            <div v-if="item.created_at" class="admin-row__field" data-admin-field>
                                <dt>Posted</dt>
                                <dd>
                                    <time
                                        :datetime="relativeTimeOf(item.created_at).datetime"
                                        :title="relativeTimeOf(item.created_at).absolute"
                                    >{{ relativeTimeOf(item.created_at).text }}</time>
                                </dd>
                            </div>
                            <!-- UIA-F-197: the tier shows only when it is notable. -->
                            <div
                                v-if="item.tier && item.tier !== 'normal'"
                                class="admin-row__field"
                                data-admin-field
                                :data-tier="item.tier"
                            >
                                <dt>Tier</dt>
                                <dd class="inline-flex items-center gap-1 capitalize">
                                    <Crown
                                        v-if="item.tier === 'featured'"
                                        :size="12"
                                        class="text-tier-featured"
                                        aria-hidden="true"
                                    />
                                    <Bookmark
                                        v-else-if="item.tier === 'saved'"
                                        :size="12"
                                        class="text-tier-saved"
                                        aria-hidden="true"
                                    />
                                    {{ item.tier }}
                                </dd>
                            </div>
                        </dl>
                        <!-- FR-AFP-63: reporter free text is adversarial — clamped
                             and wrapped inside the one shrinking column. -->
                        <ul class="admin-row__flags" :aria-label="`Flags on ${item.slug}`">
                            <li
                                v-for="flag in item.flags"
                                :key="flagKey(item, flag)"
                                class="admin-row__flag"
                                data-admin-flag
                            >
                                <span class="admin-row__detail admin-row__detail--reason" data-admin-detail>{{
                                    reasonLabel(flag.reason)
                                }}</span>
                                <span
                                    v-if="flag.detail"
                                    class="admin-row__detail line-clamp-3"
                                    data-admin-detail
                                >{{ flag.detail }}</span>
                                <span class="admin-row__meta" data-admin-meta>
                                    {{ flag.reporter_slug }} &middot;
                                    <time
                                        :datetime="relativeTimeOf(flag.created_at).datetime"
                                        :title="relativeTimeOf(flag.created_at).absolute"
                                    >{{ relativeTimeOf(flag.created_at).text }}</time>
                                </span>
                            </li>
                        </ul>
                        <p
                            v-if="item.flags.length < item.flag_count"
                            class="admin-row__meta"
                            data-admin-flag-note
                        >
                            Showing {{ item.flags.length }} of {{ item.flag_count }} flags
                        </p>
                    </div>
                    <!-- X.F.W14U.admin — UIA-F-110: ONE visible action per row
                         (Dismiss, the common act) and the rest in the row's menu:
                         Keep, gated (UIA-F-197: disabled on a row already Saved),
                         and Delete apart, in the destructive ink, through its
                         confirm. Three stadiums took half a phone card. -->
                    <div class="admin-row__actions" data-admin-actions>
                        <Button
                            emphasis="secondary"
                            size="xs"
                            class="gap-1"
                            :disabled="busy"
                            :aria-label="`Dismiss flags on ${item.slug}`"
                            @click="handleDismiss(item.slug)"
                        >
                            <CheckCircle2 class="size-3.5" aria-hidden="true" />
                            Dismiss
                        </Button>
                        <DropdownMenu :modal="false">
                            <DropdownMenuTrigger as-child>
                                <Button
                                    emphasis="quiet"
                                    size="xs"
                                    icon-only
                                    :disabled="busy"
                                    :aria-label="`More actions for ${item.slug}`"
                                >
                                    <EllipsisVertical class="size-3.5" aria-hidden="true" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" :side-offset="6">
                                <DropdownMenuItem
                                    :disabled="item.tier === 'saved'"
                                    @select="handleSetTier(item.slug, 'saved')"
                                >
                                    <Bookmark class="size-3.5" aria-hidden="true" />
                                    Keep
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem class="text-destructive" @select="askDelete(item.slug, item.slug)">
                                    <Trash2 class="size-3.5" aria-hidden="true" />
                                    Delete entry…
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

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

        <!-- Destructive-confirm dialog — replaces native `confirm()`. -->
        <Dialog :open="dialogOpen" @update:open="onDialogOpenChange">
            <!-- UIA-F-251: while the delete is in flight Cancel is disabled, so
                 the dialog is `locked` (no ✕; Escape and outside rebuffed) — one
                 lock, not three answers; otherwise a `deliberate` confirm. -->
            <DialogContent surface="opaque" class="max-w-sm" :dismiss="busy ? 'locked' : 'deliberate'">
                <DialogHeader>
                    <DialogTitle>Delete gallery entry?</DialogTitle>
                    <DialogDescription>
                        This shall permanently delete the flagged entry
                        <span class="font-mono">{{ pendingDelete?.label }}</span>.
                        The action is irrevocable.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button emphasis="quiet" :disabled="busy" @click="onDialogOpenChange(false)">
                        Cancel
                    </Button>
                    <Button
                        emphasis="primary"
                        tone="destructive"
                        :loading="busy"
                        :disabled="busy"
                        @click="confirmDelete"
                    >Delete</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>
