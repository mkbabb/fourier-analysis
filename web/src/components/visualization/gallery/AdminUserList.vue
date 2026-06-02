<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
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
import type { AdminUserInfo } from "@/lib/types";
import {
    Search,
    Trash2,
    Ban,
    UserCheck,
    Users,
    ChevronLeft,
    ChevronRight,
    X,
} from "lucide-vue-next";

const auth = useAuthStore();
const { toast } = useToast();

const searchQuery = ref("");
const sortMode = ref<"newest" | "last_seen" | "entries">("newest");
let searchTimer: ReturnType<typeof setTimeout> | null = null;

const {
    items: users,
    total,
    page,
    pageCount,
    loading,
    hasNext,
    hasPrev,
    loadPage,
    nextPage,
    prevPage,
} = useOffsetPagination<AdminUserInfo>({
    fetchFn: async (limit, offset) => {
        const token = auth.getAdminToken()!;
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

async function confirmPending() {
    const action = pending.value;
    dialogOpen.value = false;
    if (!action) return;
    if (action.kind === "delete") await performDelete(action.slug);
    else if (action.kind === "prune") await performPrune();
    else await performBatch(action.action, action.slugs);
    pending.value = null;
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

watch(page, () => clearSelection());

async function performBatch(action: BatchKind, slugs: string[]) {
    const token = auth.getAdminToken()!;
    try {
        const result = await api.batchUsers(token, action, slugs);
        const verb =
            action === "suspend"
                ? "Suspended"
                : action === "unsuspend"
                  ? "Unsuspended"
                  : "Deleted";
        toast(`${verb} ${result.affected} user(s)`, "success");
        if (result.errors?.length) {
            for (const err of result.errors) toast(err, "error");
        }
        clearSelection();
        loadPage();
    } catch (e: any) {
        toast(e.message ?? "Batch action failed", "error");
    }
}

async function handleSuspend(slug: string) {
    const token = auth.getAdminToken()!;
    try {
        await api.setAdminUserStatus(token, slug, "suspended");
        toast("User suspended", "success");
        loadPage();
    } catch (e: any) {
        toast(e.message ?? "Failed to suspend", "error");
    }
}

async function handleUnsuspend(slug: string) {
    const token = auth.getAdminToken()!;
    try {
        await api.setAdminUserStatus(token, slug, "active");
        toast("User unsuspended", "success");
        loadPage();
    } catch (e: any) {
        toast(e.message ?? "Failed to unsuspend", "error");
    }
}

async function performDelete(slug: string) {
    const token = auth.getAdminToken()!;
    try {
        await api.deleteAdminUser(token, slug);
        toast("User deleted", "success");
        loadPage();
    } catch (e: any) {
        toast(e.message ?? "Failed to delete", "error");
    }
}

async function performPrune() {
    const token = auth.getAdminToken()!;
    try {
        const result = await api.pruneEmptyUsers(token);
        toast(`Pruned ${result.pruned} empty users`, "success");
        loadPage(1);
    } catch (e: any) {
        toast(e.message ?? "Failed to prune", "error");
    }
}

function timeAgo(iso: string): string {
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
        <!-- Search + sort + prune -->
        <div class="flex items-center gap-2">
            <div class="relative flex-1">
                <Search
                    class="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"
                    aria-hidden="true"
                />
                <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search users..."
                    aria-label="Search users"
                    class="w-full rounded-md border bg-background/50 py-1.5 pl-7 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
            </div>
            <Select v-model="sortMode">
                <SelectTrigger
                    class="h-8 w-[10rem] text-sm"
                    aria-label="Sort users"
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="last_seen">Last seen</SelectItem>
                    <SelectItem value="entries">Most entries</SelectItem>
                </SelectContent>
            </Select>
            <Button
                variant="outline"
                size="sm"
                class="border-amber-500/30 bg-amber-500/10 text-xs text-amber-300 hover:bg-amber-500/20"
                aria-label="Prune users with zero entries"
                title="Remove users with 0 entries"
                @click="askPrune"
            >
                Prune empty
            </Button>
        </div>

        <!-- Loading overlay -->
        <div v-if="loading" class="flex justify-center py-8" role="status" aria-live="polite">
            <div class="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            <span class="sr-only">Loading users</span>
        </div>

        <!-- Select-all-on-page affordance. The indeterminate visual state is
             carried by the `data-some` attribute on the row so the checkbox
             reflects partial selection in CSS. -->
        <div
            v-if="users.length"
            class="flex items-center gap-2 px-1 text-xs text-muted-foreground"
            :data-some="someOnPageSelected && !allOnPageSelected || undefined"
        >
            <Checkbox
                :model-value="allOnPageSelected"
                aria-label="Select all users on this page"
                class="h-4 w-4"
                @update:model-value="(v) => toggleSelectAllOnPage(v)"
            />
            <span>
                {{ selected.size > 0 ? `${selected.size} selected` : "Select all on page" }}
            </span>
        </div>

        <!-- Floating batch-action toolbar. Renders when the selection set is
             non-empty; routes through the destructive-confirm dialog before
             firing `batchUsers` against `{ok, affected, errors?}`. -->
        <div
            v-if="selected.size > 0"
            role="toolbar"
            aria-label="Batch user actions"
            class="cartoon-card sticky top-2 z-10 flex items-center gap-2 rounded-lg px-3 py-2 text-sm shadow-cartoon"
        >
            <span class="flex-1 text-xs text-muted-foreground">
                {{ selected.size }} user(s) selected
            </span>
            <Button
                variant="outline"
                size="sm"
                class="text-xs"
                @click="askBatch('suspend')"
            >
                <Ban class="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                Suspend
            </Button>
            <Button
                variant="outline"
                size="sm"
                class="text-xs"
                @click="askBatch('unsuspend')"
            >
                <UserCheck class="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                Unsuspend
            </Button>
            <Button
                variant="destructive"
                size="sm"
                class="text-xs"
                @click="askBatch('delete')"
            >
                <Trash2 class="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                Delete
            </Button>
            <Button
                variant="ghost"
                size="icon"
                class="h-7 w-7"
                aria-label="Clear selection"
                @click="clearSelection"
            >
                <X class="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
        </div>

        <!-- User list -->
        <div
            v-if="!loading"
            class="flex flex-col gap-1.5"
            role="list"
            aria-label="Admin user list"
        >
            <div
                v-for="user in users"
                :key="user.user_slug"
                role="listitem"
                class="cartoon-card flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
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
                        <span
                            v-if="user.status === 'suspended'"
                            class="rounded-full bg-red-500/20 px-1.5 py-0.5 text-admin-label text-red-400"
                        >suspended</span>
                    </div>
                    <div class="flex gap-3 text-admin-label text-muted-foreground mt-0.5">
                        <span>{{ user.entry_count }} entries</span>
                        <span>joined {{ timeAgo(user.created_at) }}</span>
                        <span>seen {{ timeAgo(user.last_seen_at) }}</span>
                    </div>
                </div>
                <div class="flex items-center gap-1">
                    <Button
                        v-if="user.status !== 'suspended'"
                        variant="ghost"
                        size="icon"
                        class="h-6 w-6 text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
                        :aria-label="`Suspend user ${user.user_slug}`"
                        title="Suspend"
                        @click="handleSuspend(user.user_slug)"
                    >
                        <Ban class="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                        v-else
                        variant="ghost"
                        size="icon"
                        class="h-6 w-6 text-muted-foreground hover:text-green-400 hover:bg-green-500/10"
                        :aria-label="`Unsuspend user ${user.user_slug}`"
                        title="Unsuspend"
                        @click="handleUnsuspend(user.user_slug)"
                    >
                        <UserCheck class="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        class="h-6 w-6 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                        :aria-label="`Delete user ${user.user_slug}`"
                        title="Delete"
                        @click="askDelete(user.user_slug)"
                    >
                        <Trash2 class="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                </div>
            </div>

            <!-- Empty state -->
            <div v-if="!users.length" class="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <Users class="h-8 w-8 opacity-30" aria-hidden="true" />
                <p class="text-sm">No users found</p>
            </div>
        </div>

        <!-- Pagination — minimal local Button-based control;
             a canonical glass-ui `<Pagination>` primitive is the named carry. -->
        <nav
            v-if="pageCount > 1"
            class="flex items-center justify-center gap-2 text-xs text-muted-foreground"
            aria-label="User list pagination"
        >
            <Button
                variant="ghost"
                size="icon"
                class="h-7 w-7"
                :disabled="!hasPrev"
                aria-label="Previous page"
                @click="prevPage()"
            >
                <ChevronLeft class="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <span aria-live="polite">{{ page }} / {{ pageCount }}</span>
            <Button
                variant="ghost"
                size="icon"
                class="h-7 w-7"
                :disabled="!hasNext"
                aria-label="Next page"
                @click="nextPage()"
            >
                <ChevronRight class="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <span class="ml-2">{{ total }} total</span>
        </nav>

        <!-- Destructive-confirm dialog — replaces native `confirm()`. -->
        <Dialog v-model:open="dialogOpen">
            <DialogContent variant="opaque" class="max-w-sm">
                <DialogHeader>
                    <DialogTitle>
                        <template v-if="pending?.kind === 'prune'">Prune empty users?</template>
                        <template v-else-if="pending?.kind === 'batch'">
                            {{
                                pending.action === "delete"
                                    ? `Delete ${pending.slugs.length} user(s)?`
                                    : pending.action === "suspend"
                                      ? `Suspend ${pending.slugs.length} user(s)?`
                                      : `Unsuspend ${pending.slugs.length} user(s)?`
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
                        <template v-else-if="pending?.kind === 'prune'">
                            This shall permanently delete every user with zero gallery
                            entries. The action is irrevocable.
                        </template>
                        <template v-else-if="pending?.kind === 'batch' && pending.action === 'delete'">
                            This shall permanently delete the selected users and all their
                            gallery entries. The action is irrevocable.
                        </template>
                        <template v-else-if="pending?.kind === 'batch' && pending.action === 'suspend'">
                            The selected users shall be suspended; their active sessions
                            shall be revoked.
                        </template>
                        <template v-else-if="pending?.kind === 'batch' && pending.action === 'unsuspend'">
                            The selected users shall be reinstated to active status.
                        </template>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="ghost" @click="dialogOpen = false">Cancel</Button>
                    <Button
                        :variant="
                            pending?.kind === 'batch' && pending.action !== 'delete'
                                ? 'default'
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
                                      : "Unsuspend"
                            }}
                        </template>
                        <template v-else>Delete</template>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>

<style scoped>
@reference "tailwindcss";
</style>
