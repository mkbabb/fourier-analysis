<script setup lang="ts">
import { ref } from "vue";
import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@mkbabb/glass-ui";
import { useOffsetPagination } from "@/composables/useOffsetPagination";
import { useAuthStore } from "@/stores/auth";
import { useGalleryStore } from "@/stores/gallery";
import { useToast } from "@/composables/useToast";
import * as api from "@/lib/api";
import type { FlaggedEntryInfo } from "@/lib/types";
import { Flag, Trash2, XCircle, ChevronLeft, ChevronRight } from "lucide-vue-next";

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

// Destructive-confirm dialog state — supplants native `confirm()`.
const pendingDelete = ref<{ hash: string; label: string } | null>(null);
const dialogOpen = ref(false);

function askDelete(hash: string, label: string) {
    pendingDelete.value = { hash, label };
    dialogOpen.value = true;
}

async function confirmDelete() {
    const target = pendingDelete.value;
    dialogOpen.value = false;
    if (!target) return;
    await gallery.deleteEntry(target.hash);
    loadPage();
    pendingDelete.value = null;
}

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
        <div v-if="loading" class="flex justify-center py-8" role="status" aria-live="polite">
            <div class="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            <span class="sr-only">Loading flagged entries</span>
        </div>

        <div
            v-else
            class="flex flex-col gap-2"
            role="list"
            aria-label="Flagged gallery entries"
        >
            <div
                v-for="item in flaggedEntries"
                :key="item.snapshot_hash"
                role="listitem"
                class="rounded-lg border border-red-500/20 bg-red-500/5 p-3"
            >
                <div class="flex items-start justify-between gap-2">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 text-sm">
                            <Flag
                                class="h-3.5 w-3.5 text-red-400 shrink-0"
                                aria-hidden="true"
                            />
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
                            :aria-label="`Dismiss flags on ${item.image_slug ?? item.snapshot_hash.slice(0, 12)}`"
                            title="Dismiss flags"
                            @click="handleDismiss(item.snapshot_hash)"
                        >
                            <XCircle class="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            class="h-7 w-7 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                            :aria-label="`Delete entry ${item.image_slug ?? item.snapshot_hash.slice(0, 12)}`"
                            title="Delete entry"
                            @click="askDelete(item.snapshot_hash, item.image_slug ?? item.snapshot_hash.slice(0, 12))"
                        >
                            <Trash2 class="h-4 w-4" aria-hidden="true" />
                        </Button>
                    </div>
                </div>
            </div>

            <div v-if="!flaggedEntries.length" class="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <Flag class="h-8 w-8 opacity-30" aria-hidden="true" />
                <p class="text-sm">No flagged content</p>
            </div>
        </div>

        <!-- Pagination — minimal local Button-based control;
             a canonical glass-ui `<Pagination>` primitive is the named carry. -->
        <nav
            v-if="pageCount > 1"
            class="flex items-center justify-center gap-2 text-xs text-muted-foreground"
            aria-label="Flagged entries pagination"
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
                    <DialogTitle>Delete gallery entry?</DialogTitle>
                    <DialogDescription>
                        This shall permanently delete the flagged entry
                        <span class="font-mono">{{ pendingDelete?.label }}</span>.
                        The action is irrevocable.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="ghost" @click="dialogOpen = false">Cancel</Button>
                    <Button variant="destructive" @click="confirmDelete">Delete</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>

<style scoped>
@reference "tailwindcss";
</style>
