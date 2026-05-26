<script setup lang="ts">
import type { AdminStats } from "@/lib/types";
import { Shield, LogOut } from "lucide-vue-next";
import { Button } from "@mkbabb/glass-ui";
import { MetricBadge } from "@mkbabb/glass-ui/metric-badge";

defineProps<{
    stats: AdminStats | null;
    loading: boolean;
}>();

const emit = defineEmits<{
    logout: [];
}>();

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
</script>

<template>
    <section
        class="mx-4 px-3 py-2.5 rounded-lg border-[1.5px] border-amber-500/30 bg-amber-500/[0.04]"
        aria-label="Admin mode banner"
    >
        <div class="flex items-center gap-1.5 mb-2">
            <Shield :size="16" class="text-amber-400" aria-hidden="true" />
            <span class="cm-serif text-sm font-semibold tracking-tight">Admin Mode</span>
            <Button
                variant="outline"
                size="sm"
                class="ml-auto gap-1 text-muted-foreground"
                aria-label="Log out of admin mode"
                @click="emit('logout')"
            >
                <LogOut :size="14" aria-hidden="true" />
                Logout
            </Button>
        </div>

        <div v-if="stats && !loading" class="grid grid-cols-[repeat(auto-fit,minmax(5rem,1fr))] gap-2">
            <MetricBadge
                :amount="stats.total_entries"
                label="entries"
                label-position="stacked"
                size="md"
                class="admin-stat"
            />
            <MetricBadge
                :amount="stats.featured"
                label="featured"
                label-position="stacked"
                size="md"
                color="var(--tier-featured, #fbbf24)"
                class="admin-stat"
            />
            <MetricBadge
                :amount="stats.saved"
                label="saved"
                label-position="stacked"
                size="md"
                color="var(--tier-saved, #60a5fa)"
                class="admin-stat"
            />
            <MetricBadge
                :amount="stats.total_views"
                label="views"
                label-position="stacked"
                size="md"
                class="admin-stat"
            />
            <MetricBadge
                :amount="stats.total_likes"
                label="likes"
                label-position="stacked"
                size="md"
                class="admin-stat"
            />
            <MetricBadge
                :amount="formatBytes(stats.storage_bytes)"
                label="storage"
                label-position="stacked"
                size="md"
                class="admin-stat"
            />
        </div>
    </section>
</template>

<style scoped>
@reference "tailwindcss";

/* A.W3.c — `<MetricBadge>` ships its own tabular-nums + stacked geometry;
   we project the surrounding "p-1.5 rounded bg-foreground/[0.03]" tile via
   the consumer-side host class so the cluster keeps its visual register. */
.admin-stat {
    padding: 0.375rem;
    border-radius: 0.375rem;
    background: color-mix(in srgb, var(--foreground) 3%, transparent);
    display: flex;
    flex-direction: column;
    align-items: center;
}
</style>
