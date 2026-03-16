<script setup lang="ts">
import type { AdminStats } from "@/lib/types";
import { Shield, LogOut } from "lucide-vue-next";

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
    <div class="mx-4 px-3 py-2.5 rounded-lg border-[1.5px] border-amber-500/30 bg-amber-500/[0.04]">
        <div class="flex items-center gap-1.5 mb-2">
            <Shield :size="16" class="text-amber-400" />
            <span class="cm-serif text-sm font-semibold tracking-tight">Admin Mode</span>
            <button
                class="ml-auto inline-flex items-center gap-1 py-1 px-2 rounded-md border border-foreground/12 bg-transparent text-muted-foreground text-sm cursor-pointer transition-all duration-150 hover:text-foreground hover:border-foreground/25"
                @click="emit('logout')"
            >
                <LogOut :size="14" />
                Logout
            </button>
        </div>

        <div v-if="stats && !loading" class="grid grid-cols-[repeat(auto-fit,minmax(5rem,1fr))] gap-2">
            <div class="flex flex-col items-center p-1.5 rounded-md bg-foreground/[0.03]">
                <span class="text-base font-bold text-foreground fira-code">{{ stats.total_entries }}</span>
                <span class="text-sm text-muted-foreground/60">entries</span>
            </div>
            <div class="flex flex-col items-center p-1.5 rounded-md bg-foreground/[0.03]">
                <span class="text-base font-bold text-amber-400 fira-code">{{ stats.featured }}</span>
                <span class="text-sm text-muted-foreground/60">featured</span>
            </div>
            <div class="flex flex-col items-center p-1.5 rounded-md bg-foreground/[0.03]">
                <span class="text-base font-bold text-blue-400 fira-code">{{ stats.saved }}</span>
                <span class="text-sm text-muted-foreground/60">saved</span>
            </div>
            <div class="flex flex-col items-center p-1.5 rounded-md bg-foreground/[0.03]">
                <span class="text-base font-bold text-foreground fira-code">{{ stats.total_views }}</span>
                <span class="text-sm text-muted-foreground/60">views</span>
            </div>
            <div class="flex flex-col items-center p-1.5 rounded-md bg-foreground/[0.03]">
                <span class="text-base font-bold text-foreground fira-code">{{ stats.total_likes }}</span>
                <span class="text-sm text-muted-foreground/60">likes</span>
            </div>
            <div class="flex flex-col items-center p-1.5 rounded-md bg-foreground/[0.03]">
                <span class="text-base font-bold text-foreground fira-code">{{ formatBytes(stats.storage_bytes) }}</span>
                <span class="text-sm text-muted-foreground/60">storage</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
@reference "tailwindcss";
</style>
