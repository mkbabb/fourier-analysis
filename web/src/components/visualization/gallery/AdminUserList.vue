<script setup lang="ts">
import { ref, watch } from "vue";
import { Button } from "@mkbabb/glass-ui";
import { useOffsetPagination } from "@/composables/useOffsetPagination";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/composables/useToast";
import * as api from "@/lib/api";
import type { AdminUserInfo } from "@/lib/types";
import { Search, Trash2, Ban, UserCheck, Users } from "lucide-vue-next";

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

// Load first page on mount
loadPage(1);

// Debounced search
watch(searchQuery, () => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => loadPage(1), 300);
});

// Reload on sort change
watch(sortMode, () => loadPage(1));

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

async function handleDelete(slug: string) {
    if (!confirm(`Delete user "${slug}" and all their entries?`)) return;
    const token = auth.getAdminToken()!;
    try {
        await api.deleteAdminUser(token, slug);
        toast("User deleted", "success");
        loadPage();
    } catch (e: any) {
        toast(e.message ?? "Failed to delete", "error");
    }
}

async function handlePrune() {
    if (!confirm("Delete all users with 0 gallery entries?")) return;
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
                <Search class="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search users..."
                    class="w-full rounded-md border bg-background/50 py-1.5 pl-7 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
            </div>
            <select
                v-model="sortMode"
                class="rounded-md border bg-background/50 py-1.5 px-2 text-sm outline-none"
            >
                <option value="newest">Newest</option>
                <option value="last_seen">Last seen</option>
                <option value="entries">Most entries</option>
            </select>
            <Button
                variant="outline"
                size="sm"
                class="border-amber-500/30 bg-amber-500/10 text-xs text-amber-300 hover:bg-amber-500/20"
                title="Remove users with 0 entries"
                @click="handlePrune"
            >
                Prune empty
            </Button>
        </div>

        <!-- Loading overlay -->
        <div v-if="loading" class="flex justify-center py-8">
            <div class="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        </div>

        <!-- User list -->
        <div v-else class="flex flex-col gap-1.5">
            <div
                v-for="user in users"
                :key="user.user_slug"
                class="flex items-center gap-3 rounded-lg border bg-card/50 px-3 py-2 text-sm"
            >
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
                        title="Suspend"
                        @click="handleSuspend(user.user_slug)"
                    >
                        <Ban class="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        v-else
                        variant="ghost"
                        size="icon"
                        class="h-6 w-6 text-muted-foreground hover:text-green-400 hover:bg-green-500/10"
                        title="Unsuspend"
                        @click="handleUnsuspend(user.user_slug)"
                    >
                        <UserCheck class="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        class="h-6 w-6 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                        title="Delete"
                        @click="handleDelete(user.user_slug)"
                    >
                        <Trash2 class="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            <!-- Empty state -->
            <div v-if="!users.length" class="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <Users class="h-8 w-8 opacity-30" />
                <p class="text-sm">No users found</p>
            </div>
        </div>

        <!-- Pagination -->
        <div v-if="pageCount > 1" class="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <button :disabled="!hasPrev" @click="prevPage()" class="rounded border px-2 py-1 disabled:opacity-30">Prev</button>
            <span>{{ page }} / {{ pageCount }}</span>
            <button :disabled="!hasNext" @click="nextPage()" class="rounded border px-2 py-1 disabled:opacity-30">Next</button>
            <span class="ml-2">{{ total }} total</span>
        </div>
    </div>
</template>

<style scoped>
@reference "tailwindcss";
</style>
