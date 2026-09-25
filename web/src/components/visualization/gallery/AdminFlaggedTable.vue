<script setup lang="ts">
import { computed, defineComponent, h, ref, type HTMLAttributes, type PropType } from "vue";
import { Badge } from "@mkbabb/glass-ui/badge";
import { DataTable, type DataTableColumn } from "@mkbabb/glass-ui/data-table";
import { Flag, ImageOff } from "@lucide/vue";
import { thumbnailUrl } from "@/lib/api";
import { useRelativeTime } from "@/lib/time";
import type { FlaggedVisualization } from "@/lib/types";
import TierMark from "./TierMark.vue";
import AdminFlaggedActions from "./AdminFlaggedActions.vue";

/**
 * X.F.W14V.au4 — A2-FO-L1-27: the moderation queue on glass DataTable, with its
 * media column — one ledger idiom with the users list and the audit log. The
 * hand-rolled `admin-row.css` grid it shared with the users list is deleted,
 * and with it A2-FO-L3-2's narrow arm (the action group placed beside the
 * thumbnail).
 *
 * What each row carried stays whole (X.F.W14 `.h` OA-50, X.F.W14U.admin):
 * - Entry (the card projection's title below 640 px): the media inset by the
 *   cell's own padding on `--radius-media`, with the UIA-F-198 fallback tile;
 *   the slug on the admin title rung; the neutral flag count (UIA-F-197); every
 *   flag listed (FR-AFP-63: reporter text clamped and wrapped), and a note when
 *   the queue carries fewer flag records than its count.
 * - Owner · Posted as columns on the admin meta rung, labelled by their
 *   headers (or the card's `dt`). The tier rides the entry, named by the one
 *   TierMark (A2-FO-L1-10) and shown only when notable (UIA-F-197): as a
 *   column it left an empty labelled field on every normal row's card.
 * - The row actions (UIA-F-110) are the last column (`AdminFlaggedActions`).
 */
const props = defineProps<{
    entries: FlaggedVisualization[];
    busySlug: string | null;
    loading: boolean;
}>();

const emit = defineEmits<{
    dismiss: [slug: string];
    keep: [slug: string];
    delete: [slug: string];
}>();

const busy = computed(() => props.busySlug !== null);

/** UIA-F-198: thumbnails that failed to load fall back to a media tile. */
const brokenThumbs = ref<Set<string>>(new Set());
function thumbFailed(slug: string) {
    brokenThumbs.value = new Set(brokenThumbs.value).add(slug);
}

const REASONS: Record<string, string> = {
    inappropriate: "Inappropriate",
    spam: "Spam",
    copyright: "Copyright",
    other: "Other",
};

/** X.F.W3 repair 1 (g15): the app's one relative clock, list form. */
const relativeTimeOf = useRelativeTime();

function timeEl(iso: string) {
    const t = relativeTimeOf(iso);
    return h("time", { datetime: t.datetime, title: t.absolute }, t.text);
}

const cellProps = {
    value: { type: null as unknown as PropType<unknown>, default: undefined },
    row: { type: Object as PropType<FlaggedVisualization>, required: true },
} as const;

const EntryCell = defineComponent({
    name: "AdminFlaggedEntryCell",
    props: cellProps,
    setup: (p) => () => {
        const item = p.row;
        const media = !item.image_slug
            ? null
            : brokenThumbs.value.has(item.slug)
              ? h(
                    "span",
                    {
                        "data-admin-media": "",
                        class: "flagged-media flex items-center justify-center bg-muted text-muted-foreground",
                        role: "img",
                        "aria-label": `Reported image ${item.image_slug} (unavailable)`,
                    },
                    [h(ImageOff, { class: "size-5", "aria-hidden": "true" })],
                )
              : h("img", {
                    "data-admin-media": "",
                    src: thumbnailUrl(item.image_slug),
                    alt: `Reported image ${item.image_slug}`,
                    class: "flagged-media",
                    loading: "lazy",
                    onError: () => thumbFailed(item.slug),
                });
        return h("div", { class: "flagged-entry" }, [
            media,
            h("div", { class: "flex min-w-0 flex-col gap-1 font-normal" }, [
                h("div", { class: "flex min-w-0 items-center gap-1", "data-admin-title": "" }, [
                    h(Flag, { class: "size-3.5 shrink-0 text-muted-foreground", "aria-hidden": "true" }),
                    h("span", { class: "min-w-0 truncate text-mono-small text-foreground" }, item.slug),
                    h(Badge, { variant: "outline", size: "sm", class: "shrink-0" }, () =>
                        `${item.flag_count} ${item.flag_count === 1 ? "flag" : "flags"}`,
                    ),
                ]),
                // The tier, when notable (UIA-F-197), named by the one readout.
                item.tier && item.tier !== "normal"
                    ? h("span", { class: "text-mono-micro", "data-admin-meta": "", "data-tier": item.tier }, [
                          h(TierMark, { tier: item.tier, labelled: true, size: 12 }),
                      ])
                    : null,
                h(
                    "ul",
                    { class: "flagged-flags", "aria-label": `Flags on ${item.slug}` },
                    item.flags.map((flag) =>
                        h("li", { key: `${item.slug}:${flag.reporter_slug}`, class: "flagged-flag", "data-admin-flag": "" }, [
                            h(
                                "span",
                                { class: "text-caption font-medium text-foreground", "data-admin-detail": "" },
                                REASONS[flag.reason] ?? flag.reason,
                            ),
                            flag.detail
                                ? h(
                                      "span",
                                      { class: "text-caption line-clamp-3 text-muted-foreground [overflow-wrap:anywhere]", "data-admin-detail": "" },
                                      flag.detail,
                                  )
                                : null,
                            h("span", { class: "text-mono-micro text-muted-foreground", "data-admin-meta": "" }, [
                                `${flag.reporter_slug} · `,
                                timeEl(flag.created_at),
                            ]),
                        ]),
                    ),
                ),
                item.flags.length < item.flag_count
                    ? h(
                          "p",
                          { class: "text-mono-micro text-muted-foreground", "data-admin-meta": "", "data-admin-flag-note": "" },
                          `Showing ${item.flags.length} of ${item.flag_count} flags`,
                      )
                    : null,
            ]),
        ]);
    },
});

const META = "text-mono-micro whitespace-nowrap text-foreground";

const OwnerCell = defineComponent({
    name: "AdminFlaggedOwnerCell",
    props: cellProps,
    setup: (p) => () => h("span", { class: META, "data-admin-field": "", "data-admin-meta": "" }, p.row.owner_slug ?? "anonymous"),
});

const PostedCell = defineComponent({
    name: "AdminFlaggedPostedCell",
    props: cellProps,
    setup: (p) => () =>
        p.row.created_at ? h("span", { class: META, "data-admin-field": "", "data-admin-meta": "" }, [timeEl(p.row.created_at)]) : null,
});

const ActionsCell = defineComponent({
    name: "AdminFlaggedActionsCell",
    props: cellProps,
    setup: (p) => () =>
        h(AdminFlaggedActions, {
            row: p.row,
            busy: busy.value,
            onDismiss: (slug: string) => emit("dismiss", slug),
            onKeep: (slug: string) => emit("keep", slug),
            onDelete: (slug: string) => emit("delete", slug),
        }),
});

const columns: DataTableColumn<FlaggedVisualization>[] = [
    { key: "slug", label: "Entry", component: EntryCell, class: "w-full [td&]:max-w-0" },
    { key: "owner_slug", label: "Owner", component: OwnerCell, headerClass: "whitespace-nowrap" },
    { key: "created_at", label: "Posted", component: PostedCell, headerClass: "whitespace-nowrap" },
    { key: "actions", label: "Actions", component: ActionsCell, align: "right", headerClass: "whitespace-nowrap" },
];

/** The admin hooks ride each row (the table's `tr`, or the card below 640 px). */
function rowAttrs(item: FlaggedVisualization): HTMLAttributes & Record<`data-admin-${string}`, string> {
    return { "data-admin-row": "", "aria-busy": props.busySlug === item.slug || undefined };
}
</script>

<template>
    <DataTable
        :columns="columns"
        :rows="entries"
        row-key="slug"
        :status="loading && !entries.length ? 'loading' : 'ready'"
        :get-row-attrs="rowAttrs"
        responsive
        class="admin-flagged-table [--table-cell-px:--spacing(3)] [--table-cell-py:--spacing(2)]"
    >
    </DataTable>
</template>

<style scoped>
.admin-flagged-table :deep(.flagged-entry) {
    display: flex;
    align-items: flex-start;
    gap: var(--space-body);
    min-inline-size: 0;
}
/* UIA-F-251: the media sits on the media radius. */
.admin-flagged-table :deep(.flagged-media) {
    flex: none;
    inline-size: 4rem;
    block-size: 4rem;
    border-radius: var(--radius-media);
    object-fit: cover;
    background: var(--muted);
    border: 1px solid var(--border);
}
.admin-flagged-table :deep(.flagged-flags) {
    display: flex;
    flex-direction: column;
    gap: var(--space-atom);
    margin: 0;
    padding: 0;
    list-style: none;
}
/* UIA-F-197: neutral ink; Delete is the row's one destructive signal. */
.admin-flagged-table :deep(.flagged-flag) {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    padding-inline-start: var(--space-atom);
    border-inline-start: 2px solid var(--border);
}
</style>
