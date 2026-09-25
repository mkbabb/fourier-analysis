<script setup lang="ts">
import { ref, computed, defineComponent, h, onMounted, useTemplateRef, type PropType } from "vue";
import { createReusableTemplate, unrefElement, useMediaQuery } from "@vueuse/core";
import { Button } from "@mkbabb/glass-ui/button";
import { Badge } from "@mkbabb/glass-ui/badge";
import { Card } from "@mkbabb/glass-ui/card";
import { DataTable, type DataTableColumn } from "@mkbabb/glass-ui/data-table";
import { Input } from "@mkbabb/glass-ui/input";
import { Alert, AlertDescription, AlertTitle } from "@mkbabb/glass-ui";
import { Popover, PopoverContent, PopoverTrigger } from "@mkbabb/glass-ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@mkbabb/glass-ui/select";
import { useRelativeTime } from "@/lib/time";
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
    ChevronsLeft,
    ChevronsRight,
    CircleAlert,
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
    pageSize,
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
    // UIA-F-195: a page turn lands on the ledger's head.
    scrollTarget: useTemplateRef<HTMLElement>("ledgerHead"),
});

/** UIA-F-252 ⊕ UIA-F-194: the admin pager's rows-per-page and total. */
const PAGE_SIZES = ["25", "50", "100"] as const;
const pageSizeModel = computed({
    get: () => String(pageSize.value),
    set: (v: string) => {
        pageSize.value = Number(v);
        loadPage(1);
    },
});
const totalLabel = computed(() => `${total.value} ${total.value === 1 ? "entry" : "entries"}`);

/** UIA-F-200: below `sm` the two filters fold into one Popover trigger. */
const wide = useMediaQuery("(min-width: 640px)");
const filtersOpen = ref(false);
const [DefineFilters, ReuseFilters] = createReusableTemplate();

/**
 * UIA-F-200: the bar sticks at the scroller's own top edge. A sticky box is
 * offset from its scroller's CONTENT edge, so the host column's padding-top
 * (the gallery's `py-4`) left a band under the dock where rows scrolled into
 * view above the bar; the offset is that measured padding, negated.
 */
const bar = useTemplateRef("bar");
const barTop = ref("0px");
onMounted(() => {
    let el = unrefElement(bar) as HTMLElement | null | undefined;
    for (el = el?.parentElement; el; el = el.parentElement) {
        if (/(auto|scroll)/.test(getComputedStyle(el).overflowY)) break;
    }
    if (el) barTop.value = `-${getComputedStyle(el).paddingTop}`;
});

/** Apply the drafted filters; on a phone the popover closes with it. */
function apply() {
    applyFilters();
    filtersOpen.value = false;
}

loadPage(1);

function applyFilters() {
    // X.F.W14U.admin — UIA-F-111: actions are stored lower-case and the badge
    // now shows them verbatim; the query is lower-cased so a value typed back
    // in any case matches (the server's action filter is exact-match).
    appliedAction.value = actionFilter.value.trim().toLowerCase();
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

/**
 * X.F.W14U.admin — UIA-F-252: the timestamp was the widest, loudest cell — the
 * year and ":00"-grain seconds on every row. It is the app's one relative
 * clock (`lib/time.ts`, short: "3h ago"), the absolute instant in `title` and
 * `datetime`.
 */
const relativeTimeOf = useRelativeTime();

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

/**
 * X.F.W14.t — OA-42 (COHESION §0bu; owner frame `owner-2026-09-23-malformed.png`).
 *
 * Each entry used to be a `cartoon-card` holding its own
 * `grid-cols-[auto_auto_1fr_auto]`. The frame shows three results of that:
 *
 *   - Two adjacent rows painted three rules between them: the upper card's
 *     2px bottom border, its offset stamp, and the lower card's 2px top border.
 *     Measured at 1440 and 390 in both themes.
 *   - Every row sized its own columns, so at 390 the `auto` tracks shared a
 *     width the `1fr` target had already given up. The action pill was
 *     squeezed under its text (`scrollWidth > clientWidth` for four of the
 *     five fixture actions, `janitor:hard_delete_visualizations` among them),
 *     and the timestamp wrapped into "Sep 17, / 2026, / …".
 *
 * The cure is the producer's `DataTable`. One table means one column model:
 * the header labels the four columns (AA-9's unlabeled-columns row, answered
 * by the seat that comment deferred to), each body row is the producer's
 * `TableRow` with one bottom rule and no rule after the last, and the Badge
 * cell sizes to its content. The timestamp is a `<time>` in tabular figures
 * that never wraps, and the target is the one column that yields: it
 * truncates, with the full value kept in `title`. At 390 the table scrolls
 * inside the producer's own `table-container` instead of crushing a cell.
 */
type AuditRow = AuditEntry & { _id: string };

// Entries carry no id of their own, so the page and position make the key,
// as the list's old `${timestamp}-${i}` key did.
const auditRows = computed<AuditRow[]>(() =>
    entries.value.map((entry, i) => ({ ...entry, _id: `${page.value}-${i}` })),
);

const cellProps = {
    value: { type: String, default: "" },
    row: { type: Object as PropType<AuditRow>, required: true },
} as const;

const TimestampCell = defineComponent({
    name: "AuditTimestampCell",
    props: cellProps,
    setup: (props) => () =>
        h(
            "time",
            {
                datetime: relativeTimeOf(props.value).datetime,
                title: relativeTimeOf(props.value).absolute,
                class: "font-mono tabular-nums whitespace-nowrap text-muted-foreground",
            },
            relativeTimeOf(props.value).text,
        ),
});

const ActionCell = defineComponent({
    name: "AuditActionCell",
    props: cellProps,
    setup: (props) => () =>
        h(
            Badge,
            {
                variant: "secondary",
                tone: actionTone(props.value),
                size: "sm",
                // UIA-F-111: the stored action, verbatim (no `uppercase`).
                class: "font-mono",
            },
            () => props.value,
        ),
});

// AA-40: the full target stays in `title` for the pointer and is the cell's
// own text for a screen reader; only the painted overflow is clipped.
const TargetCell = defineComponent({
    name: "AuditTargetCell",
    props: cellProps,
    setup: (props) => () =>
        h(
            "span",
            { class: "block truncate font-mono text-foreground/80", title: props.value },
            props.value || "—",
        ),
});

// AA-15: `text-mono-micro` is the micro rung for the hash; AA-40: the sliced
// hash is painted, the whole hash is read.
const IpCell = defineComponent({
    name: "AuditIpCell",
    props: cellProps,
    setup: (props) => () =>
        h("span", { class: "text-mono-micro whitespace-nowrap text-muted-foreground", title: props.value }, [
            h("span", { "aria-hidden": "true" }, props.value.slice(0, 10)),
            h("span", { class: "sr-only" }, `IP hash ${props.value}`),
        ]),
});

const auditColumns: DataTableColumn<AuditRow>[] = [
    { key: "timestamp", label: "Time", component: TimestampCell },
    { key: "action", label: "Action", component: ActionCell },
    // `max-w-0` + `w-full` is how a table cell takes the remaining width and
    // still lets its content truncate: the target yields, and no other cell does.
    { key: "target", label: "Target", component: TargetCell, class: "w-full max-w-0" },
    { key: "ip_hash", label: "IP hash", component: IpCell, align: "right" },
];
</script>

<template>
    <div class="flex flex-col gap-3 px-[var(--page-gutter)] py-2">
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
        <!-- X.F.W14U.admin — UIA-F-200: the bar sticks FLUSH with the top of
             the gallery scroller (the dock's lower edge; `top-2` left a band
             where rows scrolled into view above it) on a glass Card plate, and
             below `sm` its two filters fold into one Popover trigger (the phone
             bar was 136 px tall). UIA-F-194: the admin toolbar composition
             (`data-admin-toolbar`), shared with the users list. The filter
             controls are authored once and reused in both presentations. -->
        <DefineFilters>
                <label class="sr-only" for="audit-action-filter">Action (exact match, any case)</label>
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
                    class="flex-1 min-w-[10rem]"
                    @keyup.enter="apply"
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
                    class="flex-1 min-w-[10rem]"
                    @keyup.enter="apply"
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
                <Button emphasis="secondary" size="sm" @click="apply">Apply</Button>
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
        </DefineFilters>
        <Card ref="bar" size="sm" shadow class="sticky z-10" :style="{ top: barTop }" data-admin-toolbar>
            <div class="flex flex-wrap items-center gap-2 p-(--card-pad)">
                <FilterIcon class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <ReuseFilters v-if="wide" />
                <Popover v-else v-model:open="filtersOpen">
                    <PopoverTrigger as-child>
                        <Button emphasis="secondary" size="sm" class="gap-1">
                            Filters
                            <Badge v-if="hasFilters" variant="outline" size="sm">on</Badge>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" :side-offset="6" class="flex w-[min(20rem,calc(100vw-2rem))] flex-wrap items-center gap-2">
                        <ReuseFilters />
                    </PopoverContent>
                </Popover>
            </div>
        </Card>

        <!-- Failure. AA-1: a fetch that failed is NOT an empty ledger. The audit
             log is a system of record, so the one thing it may never do is
             answer a question it could not ask. -->
        <div ref="ledgerHead" class="scroll-mt-20" />
        <!-- X.F.W14U.admin — UIA-F-199: glass Alert with the problem's detail. -->
        <Alert v-if="error" tone="destructive" announce="assertive">
            <CircleAlert aria-hidden="true" />
            <AlertTitle>The audit log could not be loaded.</AlertTitle>
            <AlertDescription class="flex flex-col items-start gap-2">
                <span>{{ error }}</span>
                <Button emphasis="secondary" size="sm" @click="loadPage()">Try again</Button>
            </AlertDescription>
        </Alert>

        <!-- Log rows. AA-17: the rows are not unmounted into a spinner on a
             page turn. They dim in place, and the producer's table marks itself
             `aria-busy` while its status is `loading`. The scroll position, the
             focus and the rows' layout all survive.
             AA-9 ⊕ OA-42 (X.F.W14.t): the four columns had no labels, and each
             row laid out its own. Both are now the producer's `DataTable` (see
             `auditColumns`): one header, one column model, and one rule per row.
             The table sits on the glass `Card` plate that each row used to
             carry separately. The producer's cell padding token is tightened to
             the log's density. -->
        <!-- UIA-F-252: no second dim — the producer's table already marks its
             own `loading` status (the faded rows were dimmed again to 60 %). -->
        <Card v-else size="sm">
            <DataTable
                :columns="auditColumns"
                :rows="auditRows"
                :status="loading ? 'loading' : 'ready'"
                :filtered="hasFilters"
                aria-label="Admin audit entries"
                class="[--table-cell-px:--spacing(3)] [--table-cell-py:--spacing(2)]"
            >
                <!-- Empty state. AA-33: the HEADLINE branches on the
                     applied-filter state. Unconditional, it asserted "No audit
                     entries" (a claim about the system of record) for a query
                     that only matched nothing, and then advised widening the
                     search it had just said did not exist. -->
                <template #filtered-empty>
                    <div class="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                        <ScrollText class="h-8 w-8 opacity-30" aria-hidden="true" />
                        <p class="text-small">No entries match these filters</p>
                        <!-- UIA-F-252: the clear is inline, where the advice is. -->
                        <Button emphasis="secondary" size="sm" @click="clearFilters">Clear filters</Button>
                    </div>
                </template>
                <template #empty>
                    <div class="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                        <ScrollText class="h-8 w-8 opacity-30" aria-hidden="true" />
                        <p class="text-small">No audit entries</p>
                    </div>
                </template>
            </DataTable>
        </Card>

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
        <!-- X.F.W14U.admin — UIA-F-252 ⊕ UIA-F-194: the admin pager, the users
             list's composition — first · previous · "Page n of m" · next · last,
             rows per page, the total — in one voice (it read "1 / 363 total" in
             serif under a mono ledger). -->
        <nav
            v-if="entries.length"
            class="admin-pager flex flex-wrap items-center justify-center gap-1 text-caption text-muted-foreground"
            aria-label="Audit log pagination"
        >
            <Button emphasis="quiet" size="sm" icon-only :disabled="!hasPrev" aria-label="First page" @click="loadPage(1)">
                <ChevronsLeft class="size-4" aria-hidden="true" />
            </Button>
            <Button emphasis="quiet" size="sm" icon-only :disabled="!hasPrev" aria-label="Previous page" @click="prevPage()">
                <ChevronLeft class="size-4" aria-hidden="true" />
            </Button>
            <span class="px-1 tabular-nums">Page {{ page }} of {{ pageCount }}</span>
            <Button emphasis="quiet" size="sm" icon-only :disabled="!hasNext" aria-label="Next page" @click="nextPage()">
                <ChevronRight class="size-4" aria-hidden="true" />
            </Button>
            <Button emphasis="quiet" size="sm" icon-only :disabled="!hasNext" aria-label="Last page" @click="loadPage(pageCount)">
                <ChevronsRight class="size-4" aria-hidden="true" />
            </Button>
            <Select v-model="pageSizeModel">
                <SelectTrigger class="ml-2 w-auto shrink-0" aria-label="Rows per page">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem v-for="n in PAGE_SIZES" :key="n" :value="n">{{ n }} per page</SelectItem>
                </SelectContent>
            </Select>
            <span class="ml-2 tabular-nums">{{ totalLabel }}</span>
        </nav>
    </div>
</template>
