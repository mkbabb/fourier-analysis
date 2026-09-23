<script setup lang="ts">
import { ref, computed } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { Badge } from "@mkbabb/glass-ui/badge";
import { Card } from "@mkbabb/glass-ui/card";
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
import { problemMessage } from "./adminError";
import { Flag, Trash2, CheckCircle2, RotateCw, Crown, Bookmark } from "@lucide/vue";

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
        toast(`Tier set to ${tier}`, "success");
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
        <div
            v-if="error"
            role="alert"
            class="flex flex-col items-center gap-2 rounded-card border border-destructive/40 bg-destructive/5 py-8 text-center"
        >
            <Flag class="h-8 w-8 text-destructive opacity-70" aria-hidden="true" />
            <p class="text-sm font-medium">The moderation queue could not be loaded.</p>
            <p class="max-w-prose text-xs text-muted-foreground">{{ error }}</p>
            <p class="text-xs text-muted-foreground">
                This is not an all-clear — the queue is unread, not empty.
            </p>
            <Button emphasis="secondary" size="sm" @click="reload()">Try again</Button>
        </div>

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
            class="flagged-queue"
            :class="loading && 'opacity-60'"
        >
            <div
                class="flex flex-col"
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
                <div
                    v-for="item in flaggedEntries"
                    :key="item.slug"
                    role="listitem"
                    class="flagged-row border-b border-border p-3 last:border-b-0"
                    :aria-busy="busySlug === item.slug || undefined"
                >
                    <div class="flex items-start gap-3">
                        <!-- FR-AFP-21: the panel that moderates IMAGES rendered no
                             image. It is the only gallery surface holding
                             `image_slug` that printed it as text, while
                             `thumbnailUrl` takes exactly the field in hand and five
                             sibling surfaces render the asset. An adjudicator was
                             asked to rule on evidence they could not see. -->
                        <img
                            v-if="item.image_slug"
                            :src="thumbnailUrl(item.image_slug)"
                            :alt="`Reported image ${item.image_slug}`"
                            class="size-16 shrink-0 rounded-md border border-border/60 bg-muted object-cover"
                            loading="lazy"
                        />
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 text-sm">
                                <Flag
                                    class="size-3.5 shrink-0 text-destructive"
                                    aria-hidden="true"
                                />
                                <span class="font-mono text-xs truncate">{{ item.slug }}</span>
                                <!-- FR-AFP-61: the flag pill is `./badge`, exported at
                                     the pin, in the tone the producer owns. The
                                     bespoke `bg-red-500/20` + `text-red-300` pill was
                                     the queue's RANKING datum at ≈1.3–1.4:1 light. -->
                                <Badge tone="destructive" size="sm">
                                    {{ item.flag_count }} {{ item.flag_count === 1 ? "flag" : "flags" }}
                                </Badge>
                            </div>
                            <!-- ⊘ X·F F.W4 `.d` — census correction, AA-15's premise.
                                 `text-admin-label` is NOT emitted at the adopted
                                 glass-ui 8.0.0 pin: `grep -ro 'text-admin-label'
                                 node_modules/@mkbabb/glass-ui/dist` returns EMPTY, and
                                 no `--text-admin-label` theme key exists either — the
                                 string survives only inside `cn`'s class-name bucket
                                 regex. `text-mono-micro` IS emitted and is the rung
                                 the sibling admin surface already uses for this exact
                                 job. Booked as a falsified census cell in
                                 `F-W4-ADDENDA-d-2026-09-18.md`. -->
                            <div class="mt-1 text-mono-micro text-muted-foreground">
                                by {{ item.owner_slug ?? "anonymous" }}
                                <span v-if="item.created_at"> &middot;
                                    <time
                                        :datetime="relativeTimeOf(item.created_at).datetime"
                                        :title="relativeTimeOf(item.created_at).absolute"
                                    >{{ relativeTimeOf(item.created_at).text }}</time>
                                </span>
                            </div>
                            <!-- FR-AFP-59: the tier — the exact state the Save button
                                 mutates — rendered as a raw lowercase wire token in
                                 the 10px muted meta line, bypassing the product's real
                                 tier design language. Composed with FR-AFP-10 (Save
                                 does not dequeue), that word was the ONLY visible
                                 change after this panel's sole non-destructive remedy.
                                 ⊘ The closed-domain TYPE narrows with FR-AFP-31; the
                                 tier↔flag semantics are F.W5-W8's. -->
                            <div class="mt-1 flex items-center gap-1 text-xs capitalize" :data-tier="item.tier ?? 'normal'">
                                <Crown
                                    v-if="item.tier === 'featured'"
                                    :size="13"
                                    class="text-tier-featured"
                                    aria-hidden="true"
                                />
                                <Bookmark
                                    v-else-if="item.tier === 'saved'"
                                    :size="13"
                                    class="text-tier-saved"
                                    aria-hidden="true"
                                />
                                <span>{{ item.tier ?? "normal" }}</span>
                            </div>
                            <!-- Flag details -->
                            <div class="mt-2 flex flex-col gap-1">
                                <!-- FR-AFP-63: reporter free text is adversarially
                                     controlled and rendered unbounded inside the one
                                     flex child explicitly allowed to shrink. The file
                                     was careful about exactly this one element short.
                                     FR-AFP-20-adjacent: the provenance line stops
                                     being an alpha-mute of an already-muted ink. -->
                                <div
                                    v-for="flag in item.flags"
                                    :key="flagKey(item, flag)"
                                    class="border-l border-border/70 pl-2 text-xs text-muted-foreground"
                                >
                                    <span class="font-medium text-destructive">{{ reasonLabel(flag.reason) }}</span>
                                    <span v-if="flag.detail" class="line-clamp-3 break-words">
                                        {{ flag.detail }}
                                    </span>
                                    <span class="block font-mono">
                                        {{ flag.reporter_slug }} &middot;
                                        <time
                                            :datetime="relativeTimeOf(flag.created_at).datetime"
                                            :title="relativeTimeOf(flag.created_at).absolute"
                                        >{{ relativeTimeOf(flag.created_at).text }}</time>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <!-- FR-AFP-45: the glyphs contradicted their effects —
                             `XCircle`, a REJECT mark, was the benign dismiss tinted
                             green, and `Star`, a promotion, was tinted blue. Each
                             control now carries a visible word beside a glyph that
                             means what the act does. FR-AFP-34 / FR-AFP-19: ONE label
                             source (no `title` duplicating the accessible name into a
                             second SR announcement), the wire vocabulary "(save
                             tier)" is out of the accessible name, and the labels name
                             the ENTITY (`slug`), not the shared asset FK.
                             FR-AFP-8 (one-token rider): `item.slug` is what gets
                             deleted, so `item.slug` is what the confirm names —
                             `image_slug` is an asset FK every remix shares.
                             FR-AFP-16: every control is disabled while this row's own
                             act is in flight. -->
                        <div class="flex shrink-0 flex-col items-stretch gap-1">
                            <Button
                                emphasis="secondary"
                                size="xs"
                                class="gap-1 text-xs"
                                :disabled="busy"
                                :aria-label="`Mark ${item.slug} acceptable`"
                                @click="handleSetTier(item.slug, 'saved')"
                            >
                                <Bookmark class="size-3.5" aria-hidden="true" />
                                Keep
                            </Button>
                            <Button
                                emphasis="secondary"
                                size="xs"
                                class="gap-1 text-xs"
                                :disabled="busy"
                                :aria-label="`Dismiss flags on ${item.slug}`"
                                @click="handleDismiss(item.slug)"
                            >
                                <CheckCircle2 class="size-3.5" aria-hidden="true" />
                                Dismiss
                            </Button>
                            <Button
                                emphasis="secondary"
                                tone="destructive"
                                size="xs"
                                class="gap-1 text-xs"
                                :disabled="busy"
                                :aria-label="`Delete entry ${item.slug}`"
                                @click="askDelete(item.slug, item.slug)"
                            >
                                <Trash2 class="size-3.5" aria-hidden="true" />
                                Delete
                            </Button>
                        </div>
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
            v-if="hasMore && !loading"
            class="flex items-center justify-center text-xs text-muted-foreground"
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
                <RotateCw
                    class="h-3.5 w-3.5"
                    :class="loadingMore && 'animate-spin'"
                    aria-hidden="true"
                />
                {{ loadingMore ? "Loading…" : "Load more" }}
            </Button>
        </nav>

        <!-- Destructive-confirm dialog — replaces native `confirm()`. -->
        <Dialog :open="dialogOpen" @update:open="onDialogOpenChange">
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

<style scoped>
/* FR-AFP-3 / FR-AFP-61: the card was drawn in hard-coded Tailwind reds with zero
   `dark:` and zero tokens — ≈1.3–2.6:1 against the resolved light tokens, and the
   outline failed SC 1.4.11 in BOTH themes (1.33 light / 1.20 dark). The plate is
   the destructive TOKEN, so it moves with the theme instead of against it.

   X.F.W3 `.d` — and it now says so through the CARD'S OWN ACCENT REGISTER
   rather than over the top of it. `--glass-accent` is the producer's documented
   per-instance rim hue (the axis `CardProps` struck `variant` and `dataHue` to
   consolidate into), so one declaration re-tints the primitive's edge instead of
   a scoped `border` shorthand racing its layered one. The fill stays an explicit
   wash because "this row is a moderation target" is a semantic this surface
   owns, not an elevation the card grammar has a name for.

   X.F.W14.t: the queue is now one Card with a row per entry. The accent sits
   on that one plate, and the wash sits on each row it marks. */
.flagged-queue {
    --glass-accent: var(--destructive);
}
.flagged-row {
    background: color-mix(in oklab, var(--destructive) 6%, transparent);
}
</style>
