<script setup lang="ts">
import { computed, defineComponent, h, type HTMLAttributes, type PropType } from "vue";
import { Badge } from "@mkbabb/glass-ui/badge";
import { Button } from "@mkbabb/glass-ui/button";
import { Checkbox } from "@mkbabb/glass-ui";
import { DataTable, type DataTableColumn } from "@mkbabb/glass-ui/data-table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@mkbabb/glass-ui/menu";
import { Ban, EllipsisVertical, Trash2, UserCheck } from "@lucide/vue";
import { useRelativeTime } from "@/lib/time";
import type { AdminUserInfo } from "@/lib/types";

/**
 * X.F.W14V.au4 — A2-FO-L1-27: the users ledger on glass DataTable, split out of
 * the AdminUserList god module (the list keeps the fetch, the selection, the
 * batch bar, the pager and the confirm). The admin ledgers now have one idiom:
 * the audit log moved at X.F.W14.t, and the users and flagged rows leave the
 * hand-rolled `admin-row.css` grid, which is deleted.
 *
 * - The User column leads (it is the card projection's title below 640 px): the
 *   row's select box, the slug on the admin title rung (`text-mono-small`), and
 *   the suspended badge (FR-AUL-7's paired destructive register).
 * - Entries · Joined · Seen are columns on the admin meta rung
 *   (`text-mono-micro`), labelled by their headers, or by the card's `dt`.
 * - The row menu (UIA-F-193: Suspend or Reinstate, and Delete apart in the
 *   destructive ink) is the DataTable's row actions.
 * - `responsive`: the phone reads cards, never a sideways pan (L2-11's rule).
 * - A2-FO-L2-10: the box is glass Checkbox at its own size; the `h-4 w-4`
 *   literal that collapsed its 44 px coarse-pointer seat to 16 px is gone.
 * - The rows keep the admin hooks the gates read (`data-admin-row`,
 *   `data-admin-title`, `data-admin-field`, `data-admin-meta`, `data-admin-actions`) and
 *   `data-selected` for the selected fill (UIA-F-193).
 */
const props = defineProps<{
    users: AdminUserInfo[];
    selected: Set<string>;
    busy: boolean;
    loading: boolean;
}>();

const emit = defineEmits<{
    toggle: [slug: string, checked: boolean | "indeterminate"];
    suspend: [slug: string];
    unsuspend: [slug: string];
    delete: [slug: string];
}>();

/**
 * X.F.W3 `.e` / FR-AUL-17: the app's one relative clock (`lib/time.ts`),
 * mapped once per tick.
 */
const relative = useRelativeTime();

type UserRow = AdminUserInfo & { joined: ReturnType<typeof relative>; seen: ReturnType<typeof relative> };

const rows = computed<UserRow[]>(() =>
    props.users.map((user) => ({ ...user, joined: relative(user.created_at), seen: relative(user.last_seen_at) })),
);

const cellProps = {
    value: { type: null as unknown as PropType<unknown>, default: undefined },
    row: { type: Object as PropType<UserRow>, required: true },
} as const;

const UserCell = defineComponent({
    name: "AdminUserCell",
    props: cellProps,
    setup: (p) => () =>
        h("div", { class: "flex min-w-0 items-center gap-2", "data-admin-title": "" }, [
            h(Checkbox, {
                modelValue: props.selected.has(p.row.user_slug),
                "aria-label": `Select user ${p.row.user_slug}`,
                disabled: props.busy,
                class: "shrink-0",
                "onUpdate:modelValue": (v: boolean | "indeterminate") => emit("toggle", p.row.user_slug, v),
            }),
            h("span", { class: "min-w-0 truncate text-mono-small text-foreground" }, p.row.user_slug),
            p.row.status === "suspended"
                ? h(Badge, { tone: "destructive", size: "sm", class: "uppercase" }, () => "suspended")
                : null,
        ]),
});

const EntriesCell = defineComponent({
    name: "AdminUserEntriesCell",
    props: cellProps,
    setup: (p) => () =>
        h("span", { class: "text-mono-micro tabular-nums whitespace-nowrap text-foreground", "data-admin-field": "", "data-admin-meta": "" }, String(p.row.entry_count)),
});

function timeCell(name: string, key: "joined" | "seen") {
    return defineComponent({
        name,
        props: cellProps,
        setup: (p) => () =>
            h(
                "time",
                {
                    datetime: p.row[key].datetime,
                    title: p.row[key].absolute,
                    class: "text-mono-micro whitespace-nowrap text-foreground",
                    "data-admin-field": "",
                    "data-admin-meta": "",
                },
                p.row[key].text,
            ),
    });
}

const columns: DataTableColumn<UserRow>[] = [
    { key: "user_slug", label: "User", component: UserCell, class: "w-full [td&]:max-w-0" },
    { key: "entry_count", label: "Entries", component: EntriesCell, align: "right", headerClass: "whitespace-nowrap" },
    { key: "created_at", label: "Joined", component: timeCell("AdminUserJoinedCell", "joined"), headerClass: "whitespace-nowrap" },
    { key: "last_seen_at", label: "Seen", component: timeCell("AdminUserSeenCell", "seen"), headerClass: "whitespace-nowrap" },
];

/** The admin hooks ride each row (the table's `tr`, or the card below 640 px). */
function rowAttrs(row: UserRow): HTMLAttributes & Record<`data-${string}`, string | undefined> {
    return { "data-admin-row": "", "data-selected": props.selected.has(row.user_slug) ? "" : undefined };
}
</script>

<template>
    <DataTable
        :columns="columns"
        :rows="rows"
        row-key="user_slug"
        :status="loading && !rows.length ? 'loading' : 'ready'"
        :get-row-attrs="rowAttrs"
        responsive
        class="admin-users-table [--table-cell-px:--spacing(3)] [--table-cell-py:--spacing(2)]"
    >
        <template #row-actions="{ row }">
            <div class="flex flex-none items-center gap-1" data-admin-actions>
                <DropdownMenu :modal="false">
                    <DropdownMenuTrigger as-child>
                        <Button
                            emphasis="quiet"
                            size="xs"
                            icon-only
                            :disabled="busy"
                            :aria-label="`Actions for user ${row.user_slug}`"
                        >
                            <EllipsisVertical class="size-3.5" aria-hidden="true" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" :side-offset="6">
                        <DropdownMenuItem v-if="row.status !== 'suspended'" @select="emit('suspend', row.user_slug)">
                            <Ban class="size-3.5" aria-hidden="true" />
                            Suspend and revoke sessions
                        </DropdownMenuItem>
                        <DropdownMenuItem v-else @select="emit('unsuspend', row.user_slug)">
                            <UserCheck class="size-3.5" aria-hidden="true" />
                            Reinstate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem class="text-destructive" @select="emit('delete', row.user_slug)">
                            <Trash2 class="size-3.5" aria-hidden="true" />
                            Delete user…
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </template>
    </DataTable>
</template>

<style scoped>
/* UIA-F-193: the selected row's fill on glass's own selection rung. */
.admin-users-table :deep([data-admin-row][data-selected]) {
    background-image: linear-gradient(
        oklch(from var(--foreground) l c h / var(--fill-selected)),
        oklch(from var(--foreground) l c h / var(--fill-selected))
    );
}
</style>
