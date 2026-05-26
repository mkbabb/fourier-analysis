<script setup lang="ts">
import { ref } from "vue";
import { Button } from "@mkbabb/glass-ui";
import { useOffsetPagination } from "@/composables/useOffsetPagination";
import { useAuthStore } from "@/stores/auth";
import { useGalleryStore } from "@/stores/gallery";
import { useToast } from "@/composables/useToast";
import * as api from "@/lib/api";
import type { FlaggedEntryInfo } from "@/lib/types";
import { Flag, Trash2, XCircle } from "lucide-vue-next";

const auth = useAuthStore();
const gallery = useGalleryStore();
const { toast } = useToast();

const {
    items: flaggedEntries,
    total,
    page,
    pageCount,
    loading,
    hasNext,
    hasPrev,
    loadPage,
    nextPage,
    prevPage,
} = useOffsetPagination<FlaggedEntryInfo>({
    fetchFn: async (limit, offset) => {
        const token = auth.getAdminToken()!;
        const result = await api.listFlaggedEntries(token, {
            page: Math.floor(offset / limit) + 1,
            limit,
        });
        return { data: result.items, total: result.total };
    },
    pageSize: 20,
});

loadPage(1);

async function handleDismiss(hash: string) {
    const token = auth.getAdminToken()!;
    try {
        const result = await api.dismissFlags(token, hash);
        toast(`Dismissed ${result.dismissed} flags`, "success");
        loadPage();
    } catch (e: any) {
        toast(e.message ?? "Failed to dismiss", "error");
    }
}

async function handleDelete(hash: string) {
    if (!confirm("Delete this gallery entry?")) return;
    await gallery.deleteEntry(hash);
    loadPage();
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

function timeAgo(iso: string | null): string {
    if (!iso) return "";
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
        <div v-if="loading" class="flex justify-center py-8">
            <div class="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        </div>

        <div v-else class="flex flex-col gap-2">
            <div
                v-for="item in flaggedEntries"
                :key="item.snapshot_hash"
                class="rounded-lg border border-red-500/20 bg-red-500/5 p-3"
            >
                <div class="flex items-start justify-between gap-2">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 text-sm">
                            <Flag class="h-3.5 w-3.5 text-red-400 shrink-0" />
                            <span class="font-mono text-xs truncate">{{ item.image_slug ?? item.snapshot_hash.slice(0, 12) }}</span>
                            <span class="rounded-full bg-red-500/20 px-1.5 py-0.5 text-admin-label text-red-300">
                                {{ item.flag_count }} {{ item.flag_count === 1 ? "flag" : "flags" }}
                            </span>
                        </div>
                        <div class="text-admin-label text-muted-foreground mt-1">
                            by {{ item.user_slug ?? "anonymous" }} &middot; {{ item.tier ?? "normal" }}
                            <span v-if="item.created_at"> &middot; {{ timeAgo(item.created_at) }}</span>
                        </div>
                        <!-- Flag details -->
                        <div class="mt-2 flex flex-col gap-1">
                            <div
                                v-for="(flag, i) in item.flags"
                                :key="i"
                                class="text-admin-label text-muted-foreground pl-2 border-l border-muted"
                            >
                                <span class="text-red-300">{{ reasonLabel(flag.reason) }}</span>
                                <span v-if="flag.detail"> — {{ flag.detail }}</span>
                                <span class="opacity-60"> ({{ flag.reporter_slug }}, {{ timeAgo(flag.created_at) }})</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            class="h-7 w-7 text-muted-foreground hover:text-green-400 hover:bg-green-500/10"
                            title="Dismiss flags"
                            @click="handleDismiss(item.snapshot_hash)"
                        >
                            <XCircle class="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            class="h-7 w-7 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                            title="Delete entry"
                            @click="handleDelete(item.snapshot_hash)"
                        >
                            <Trash2 class="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div v-if="!flaggedEntries.length" class="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <Flag class="h-8 w-8 opacity-30" />
                <p class="text-sm">No flagged content</p>
            </div>
        </div>

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
