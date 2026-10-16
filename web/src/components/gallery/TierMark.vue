<script setup lang="ts">
import { Bookmark, Crown } from "@lucide/vue";
import type { GalleryTier } from "@/lib/types";

/**
 * X.F.W14V.au4 — A2-FO-L1-10: the tier readout, written once (the card, the
 * card modal and the flagged row each drew Crown/Bookmark by tier). A notable
 * tier paints its glyph in its tier token; `normal` paints nothing (UIA-F-197:
 * the bare "Normal" was noise). `labelled` shows the name; otherwise the name
 * is for a screen reader only.
 */
withDefaults(defineProps<{ tier?: GalleryTier | null; labelled?: boolean; size?: number }>(), {
    tier: "normal",
    labelled: false,
    size: 14,
});
</script>

<template>
    <span v-if="tier === 'featured' || tier === 'saved'" data-slot="tier-mark" class="tier-mark" :data-tier="tier">
        <Crown v-if="tier === 'featured'" :size="size" aria-hidden="true" />
        <Bookmark v-else :size="size" aria-hidden="true" />
        <span :class="labelled ? 'capitalize' : 'sr-only'">{{ tier }}</span>
    </span>
</template>

<style scoped>
.tier-mark {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
}
.tier-mark[data-tier="featured"] { color: var(--tier-featured); }
.tier-mark[data-tier="saved"] { color: var(--tier-saved); }
</style>
