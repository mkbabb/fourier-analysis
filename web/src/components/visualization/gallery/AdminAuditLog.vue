<script setup lang="ts">
import { ref, computed } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { Badge } from "@mkbabb/glass-ui/badge";
import { Input } from "@mkbabb/glass-ui/input";
import { useOffsetPagination } from "@/composables/useOffsetPagination";
import { useAuthStore } from "@/stores/auth";
import * as api from "@/lib/api";
import type { AuditEntry } from "@/lib/types";
import {
    ScrollText,
    Filter as FilterIcon,
    X,
    ChevronLeft,
    ChevronRight,
} from "@lucide/vue";

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

// AA-34: the clear affordance is permanently mounted (it may not reflow the bar
// it sits in), so its ENABLED state — unlike the empty-state headline's, which
// must read the applied snapshot — covers the draft too: there is something to
// clear the moment the operator has typed it.
const canClear = computed(
    () => hasFilters.value || !!(actionFilter.value || targetFilter.value),
);

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

/**
 * X·F F.W4 `.d` — AA-3 (BLOCKER) ⊕ AA-19 ⊕ AA-20 ⊕ AA-24 ⊕ AA-5's display arm.
 *
 * The map this replaces was five single-theme raw palette triples — the file's
 * only hand-rolled colour authority — whose five inks read 1.36–1.81:1 in the
 * DEFAULT light arm (dark passed at 7.6–10.1:1: authored dark-only), on the ink
 * that IS the action string. It returned class names, so no primitive could ever
 * own the chip.
 *
 * Two ruled defects were structural, not chromatic, and they decide the shape:
 *
 *   AA-24 — `startsWith` in AUTHORING order, not severity order, so
 *   `batch_users:delete` (the vocabulary's most destructive verb, `admin.py:497`)
 *   fell past the `delete` arm into violet, pixel-identical to
 *   `batch_users:unsuspend`. A severity inversion inside the map itself.
 *
 *   AA-5 — the collection's SECOND writer (`janitor.py:59-99`, which inserts
 *   into `db.admin_audit` without calling `log_audit`) emits nine `janitor:*`
 *   actions; not one matched any arm, so `janitor:hard_delete_visualizations`
 *   and `janitor:prune_audit` — the audit log pruning its own history — rendered
 *   in the benign sky DEFAULT.
 *
 * Both die at the same point: classify on the action's VERB tokens rather than
 * on its leading namespace, so severity survives any prefix (`batch_users:`,
 * `janitor:`) and an action nobody has classified renders NEUTRAL rather than
 * wearing a tint that asserts it was.
 *
 * ⊘ The violet `batch` register is NOT carried forward as a relay ask. AA-3's
 * ruling offered one because 5-member TONES has no violet home; AA-24 then ruled
 * the batch arm's OWN existence the defect — `batch` is a severity question, not
 * a hue. Asking the producer for a violet tone would ship the inversion into the
 * design system. Recorded as a relay NOTE (not an ask) in
 * `F-W4-ADDENDA-d-2026-09-18.md` for `.z`'s letter.
 *
 * ⊘ The SHARED taxonomy — one enumerated vocabulary both writers and this
 * display agree on — is the seam cure AA-5/AA-6/AA-24 all point at, and it is
 * F.W5–W8's cross-tier work. This is the display arm only, which is what F.W4
 * was given.
 */
type ActionTone = "destructive" | "warning" | "success" | "neutral";

const DESTRUCTIVE_VERBS = ["delete", "prune", "purge", "reap"];
const STATUS_VERBS = ["suspend", "suspended", "unsuspend", "status", "ban"];
const CURATION_VERBS = ["tier", "dismiss", "feature", "featured", "save", "saved"];

function actionTone(action: string): ActionTone {
    const verbs = new Set(action.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
    if (DESTRUCTIVE_VERBS.some((v) => verbs.has(v))) return "destructive";
    if (STATUS_VERBS.some((v) => verbs.has(v))) return "warning";
    if (CURATION_VERBS.some((v) => verbs.has(v))) return "success";
    return "neutral";
}
</script>

<template>
    <div class="flex flex-col gap-3 px-4 py-2">
        <!-- Filter bar. AA-4: the whole chassis was drawn with the FILL token
             `--muted` used as a border at 30–40 % alpha — 1.01–1.07:1 in BOTH
             arms, against a 3:1 non-text floor, at four sites. `border-border` is
             not the cure either (1.90:1, still under the floor): the house
             `@utility cartoon-card` is, and the sibling admin surface already
             applies it to the identical row and toolbar surfaces. One class
             restores plate + 2px border + offset stamp together. -->
        <!-- AA-35: the panel mounts inside GalleryView's own scroller with no
             `max-h`/`overflow` of its own, so ~25 rows scrolled the filter bar off
             the viewport entirely — the operator could no longer see, let alone
             change, the query whose results they were reading (and with AA-17 cured
             the rows now persist across page turns, so the bar is needed MORE). The
             sibling's control surface is already `sticky top-2 z-10`; this is the
             same seat, not a new mechanism. -->
        <div class="cartoon-card sticky top-2 z-10 flex flex-wrap items-center gap-2 p-2">
            <FilterIcon class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <!-- AA-6: the placeholder advertised prefixes the server does not
                 honour. `admin.py:631-632` is BARE EQUALITY on `action` (only the
                 TARGET clause, `:633-634`, is a regex), and the placeholder's own
                 example `set_tier` matches zero rows forever, because every writer
                 emits `set_tier:{tier}` (verified `:185,:444,:497`). Composed with
                 AA-1, "your filter matched nothing" and "the request never
                 completed" were pixel-identical — so the operator's only feedback
                 about an impossible query was a screen that also meant failure.
                 ⊘ The `$in`-over-a-generated-taxonomy cure is the F.W5 seam
                 co-sign; the placeholder telling the truth is F.W4's, and it is
                 what stops the operator writing a query that cannot match. -->
            <!-- AA-13: both fields were labelled by `placeholder` ALONE — the
                 accessible name vanishes on the first keystroke, and the
                 placeholder was also the field's only syntax documentation. A real
                 `<label for>` survives typing; the sr-only seat keeps the bar's
                 geometry.

                 AA-21: iOS sentence-autocapitalisation silently defeats the
                 exact-match action filter. The server's action clause carries no
                 `$options:"i"` (only the immune target clause does), so `delete`
                 typed on a phone arrives as `Delete`, matches zero rows, and — with
                 AA-6 and AA-33 — renders as "no entries" plus counsel to widen a
                 search that was never wrong. A silent false negative on a
                 compliance surface. `enterkeyhint` names the Enter handler this
                 input already has. -->
            <!-- X.F.W3 `.d` — `FR-AUL-6`'s RECIPE CORE, found at a fourth
                 consumer. The row's ⟨…⟩ names three (AdminUserList,
                 FunctionInput, GallerySearchBar) and its ratified reading is
                 that "the RECIPE CORE is what triplicates, not bytes" — these
                 two fields carry it exactly: a raw `<input>` with
                 `focus:outline-none` and a hand-rolled border swap, so the
                 focus indicator is annihilated under forced-colors and the
                 `focus:`-not-`focus-visible:` arm fires on pointer focus too.
                 One repair unit per consumer; this is this file's.

                 ⊘ `./forms` is NOT an export of the adopted pin; `X-EXT-2`
                 re-seats the target to `./input`, which ships the `input-pill`
                 recipe and the restored forced-colors selector.

                 The `<label class="sr-only" for>` pairs STAY (AA-13: a real
                 label survives typing where a placeholder does not), and so do
                 `autocapitalize`/`autocorrect`/`enterkeyhint` — they ride
                 `$attrs` to the element, which is the producer's documented
                 mechanism, and AA-21's iOS false-negative depends on them. -->
            <label class="sr-only" for="audit-action-filter">Action (exact match)</label>
            <Input
                id="audit-action-filter"
                v-model="actionFilter"
                type="text"
                size="sm"
                placeholder="action (exact, e.g. set_tier:featured)"
                autocapitalize="none"
                autocorrect="off"
                spellcheck="false"
                enterkeyhint="search"
                class="flex-1 min-w-[10rem] text-xs"
                @keyup.enter="applyFilters"
            />
            <label class="sr-only" for="audit-target-filter">Target (substring match)</label>
            <Input
                id="audit-target-filter"
                v-model="targetFilter"
                type="text"
                size="sm"
                placeholder="target (substring match)"
                autocapitalize="none"
                autocorrect="off"
                spellcheck="false"
                enterkeyhint="search"
                class="flex-1 min-w-[10rem] text-xs"
                @keyup.enter="applyFilters"
            />
            <!-- AA-22: `h-7` / `h-7 w-7` on 100 % of this file's Button sites
                 MECHANICALLY deleted the producer's WCAG-2.5.5 clamp. The cva emits
                 token rungs — `h-(--control-h-sm)` is `max(scaled, --control-floor)`
                 and the coarse-pointer block lifts scale to 1.5 and the floor to
                 44 px — but `cn`'s `["height", /^h-/]` bucket is last-write-wins, so
                 a consumer literal pins 28 px on every pointer. The rung is the
                 size prop; there is nothing left for the class to say.

                 AA-34 ⊕ AA-39: the clear affordance was `v-if`'d into a
                 `flex-wrap` bar of two `flex-1 min-w-[10rem]` fields, so applying a
                 filter shrank (and could wrap) the very fields in play. It now
                 holds its seat and disables, and it is named by `aria-label` — the
                 house idiom — not by `title`, which no touch user and no screen
                 reader reliably receives. -->
            <Button emphasis="secondary" size="sm" @click="applyFilters">Apply</Button>
            <Button
                emphasis="quiet"
                size="sm"
                icon-only
                :disabled="!canClear"
                class="text-muted-foreground"
                aria-label="Clear filters"
                @click="clearFilters"
            >
                <X class="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
        </div>

        <!-- Failure. AA-1: a fetch that failed is NOT an empty ledger. The audit
             log is a system of record, so the one thing it may never do is
             answer a question it could not ask. -->
        <div
            v-if="error"
            role="alert"
            class="flex flex-col items-center gap-2 rounded-card border border-destructive/40 bg-destructive/5 py-8 text-center"
        >
            <ScrollText class="h-8 w-8 text-destructive opacity-70" aria-hidden="true" />
            <p class="text-sm font-medium">The audit log could not be loaded.</p>
            <p class="max-w-prose text-xs text-muted-foreground">{{ error }}</p>
            <Button emphasis="secondary" size="sm" @click="loadPage()">Try again</Button>
        </div>

        <!-- Log rows. AA-17: the rows are no longer unmounted into a spinner on
             every page turn — they dim in place and announce themselves busy, so
             the scroll position, the focus and ~25 rows of layout survive. -->
        <!-- AA-9: four unlabeled columns in a wrapper that is `flex`, so every
             row's `grid-cols-[auto_auto_1fr_auto]` is its OWN formatting context
             and the column edges step row to row; the file carried zero `role` and
             zero `aria-*`. Both siblings already label this exact shape with the
             same three attributes (`role="list"` + `aria-label` + `role="listitem"`),
             so the house cure is in the tree — it does not compete with the fuller
             `DataTable` seat, which is a later wave's question. -->
        <div v-else class="flex flex-col gap-1.5" :aria-busy="loading || undefined"
             role="list" aria-label="Admin audit entries"
             :class="loading && 'opacity-60'">
            <div
                v-for="(entry, i) in entries"
                :key="`${entry.timestamp}-${i}`"
                role="listitem"
                class="cartoon-card grid grid-cols-[auto_auto_1fr_auto] items-center gap-2 px-3 py-1.5 text-xs"
            >
                <span class="font-mono text-muted-foreground tabular-nums">
                    {{ formatTimestamp(entry.timestamp) }}
                </span>
                <Badge
                    variant="secondary"
                    :tone="actionTone(entry.action)"
                    size="sm"
                    class="font-mono uppercase"
                >
                    {{ entry.action }}
                </Badge>
                <!-- AA-40: the truncated target and the sliced hash disclosed on
                     `title` hover ALONE — mouse-privileged, and unreachable by
                     keyboard or touch. `HoverCard` is removed at the adopted pin,
                     so the ruled route is Tooltip-or-copy. The assistive half
                     lands here as real text: the full value is in the DOM,
                     visually hidden, so a screen reader and a touch user receive
                     it while the row keeps its density. ⊘ The SIGHTED-keyboard
                     half is a design ruling this unit was not given — a per-cell
                     Tooltip trigger adds two tab stops to each of 25 rows (a
                     2.4.3 cost) and a per-row disclosure is a new control. Named
                     as a residual to F.W5–W8 in this unit's receipt; `title` is
                     kept meanwhile, so nothing regresses for the pointer. -->
                <span class="font-mono text-foreground/80 truncate" :title="entry.target">
                    {{ entry.target || "—" }}
                </span>
                <!-- AA-15: `text-[0.65rem]` was an off-scale magic 10.4 px desktop
                     / 11.7 px mobile (the root inverts on small viewports) on the
                     two least-legible columns. The ruled cure named
                     `@utility text-admin-label`; that utility is NOT emitted at
                     the adopted 8.0.0 pin (census cell falsified — see the
                     addendum). `text-mono-micro` IS, and it carries the same
                     mono + micro-rung + caps-tracking recipe off `--type-micro`. -->
                <span
                    class="text-mono-micro text-muted-foreground"
                    :title="entry.ip_hash"
                >
                    <span aria-hidden="true">{{ entry.ip_hash.slice(0, 10) }}</span>
                    <span class="sr-only">IP hash {{ entry.ip_hash }}</span>
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

        <!-- AA-12: this file's loading block was the siblings' block with
             `role="status"` / `aria-live` / the sr-only sentence DELETED — a
             byte-identical spinner, 2-of-2 siblings carrying the full treatment,
             and zero a11y attributes anywhere in this file. Mounted permanently
             and outside every gate, because a region that appears at the same
             moment as its message is the shape that does not fire. -->
        <p class="sr-only" role="status" aria-live="polite">
            {{
                error
                    ? "The audit log could not be loaded."
                    : loading
                      ? "Loading audit entries."
                      : entries.length
                        ? `Showing ${entries.length} audit entries, page ${page} of ${pageCount}, ${total} total.`
                        : hasFilters
                          ? "No audit entries match these filters."
                          : "No audit entries."
            }}
        </p>

        <!-- AA-11: this footer was a degraded copy of the sibling's — a `<div>`
             holding two RAW `<button>`s and a plain `<span>`, where the sibling
             holds `<nav aria-label>` + producer Buttons + per-control
             `aria-label`s + an `aria-live` counter. Same composable, same shape,
             two different answers; the raw buttons also opted out of every
             producer affordance including the coarse-pointer clamp (AA-22).
             ⊘ The carry the sibling recorded stands and is re-recorded here: a
             canonical glass-ui `<Pagination>` is ABSENT from the export map at
             the adopted pin (as it was at 4.0.0 and 7.0.0 — the retirement has
             now held across three majors), so this local control is the seat, not
             a substitute for one. -->
        <nav
            v-if="pageCount > 1"
            class="flex items-center justify-center gap-2 text-xs text-muted-foreground"
            aria-label="Audit log pagination"
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
    </div>
</template>
