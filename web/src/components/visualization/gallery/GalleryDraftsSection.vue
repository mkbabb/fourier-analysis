<script setup lang="ts">
import { ref, computed } from "vue";
import type { WorkspaceDraft } from "@/lib/types";
import { thumbnailUrl } from "@/lib/api";
import { basisDisplay } from "../lib/basis-display";
import { ChevronDown, Upload } from "lucide-vue-next";

const props = defineProps<{
    drafts: WorkspaceDraft[];
    publishing: boolean;
}>();

const emit = defineEmits<{
    publish: [draft: WorkspaceDraft];
    open: [imageSlug: string];
}>();

const collapsed = ref(false);

const sortedDrafts = computed(() =>
    props.drafts
        .slice()
        .sort((a, b) => (b.lastOpenedAt ?? "").localeCompare(a.lastOpenedAt ?? "")),
);

function timeAgo(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const m = Math.floor(ms / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function getBasisLabel(item: WorkspaceDraft): string {
    const bases = item.animationSettings?.active_bases ?? [];
    if (bases.length === 0) return "";
    return bases
        .map((b) => {
            const key = b.startsWith("fourier") ? "fourier" : b;
            return basisDisplay[key]?.label ?? b;
        })
        .join(", ");
}
</script>

<template>
    <div v-if="sortedDrafts.length > 0" class="mx-4 rounded-lg border-[1.5px] border-foreground/8 overflow-hidden">
        <button
            class="drafts-header flex items-center gap-1.5 w-full py-2 px-3 border-none bg-muted/30 text-foreground cursor-pointer transition-colors duration-150 hover:bg-muted/50"
            @click="collapsed = !collapsed"
        >
            <span class="cm-serif text-sm font-semibold tracking-tight">My Drafts</span>
            <span class="text-sm text-muted-foreground/60 fira-code">{{ sortedDrafts.length }}</span>
            <ChevronDown
                :size="16"
                class="ml-auto text-muted-foreground transition-transform duration-200 ease-in-out"
                :class="{ '-rotate-90': collapsed }"
            />
        </button>

        <div v-if="!collapsed" class="flex flex-col">
            <div
                v-for="draft in sortedDrafts"
                :key="draft.imageSlug"
                class="draft-item flex items-center gap-2.5 py-2 px-3 border-t border-foreground/5 transition-colors duration-150 hover:bg-foreground/[0.02]"
            >
                <div
                    class="w-12 h-12 rounded-md overflow-hidden shrink-0 cursor-pointer bg-muted"
                    @click="emit('open', draft.imageSlug)"
                >
                    <img
                        :src="thumbnailUrl(draft.imageSlug)"
                        :alt="draft.imageSlug"
                        class="w-full h-full object-cover"
                        loading="lazy"
                    />
                </div>
                <div class="flex-1 min-w-0 cursor-pointer flex flex-col gap-0.5" @click="emit('open', draft.imageSlug)">
                    <span class="text-sm text-foreground truncate fira-code">{{ draft.imageSlug }}</span>
                    <span class="text-sm text-muted-foreground/60">
                        {{ getBasisLabel(draft) }}
                        <span v-if="getBasisLabel(draft)"> &middot; </span>
                        {{ timeAgo(draft.lastOpenedAt) }}
                    </span>
                </div>
                <button
                    class="inline-flex items-center gap-1 py-1 px-2.5 rounded-md border-[1.5px] border-foreground/12 bg-transparent text-muted-foreground text-sm font-medium cursor-pointer shrink-0 transition-all duration-150 hover:not-disabled:text-foreground hover:not-disabled:border-foreground/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="publishing"
                    @click="emit('publish', draft)"
                >
                    <Upload :size="14" />
                    Publish
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
@reference "tailwindcss";
</style>
