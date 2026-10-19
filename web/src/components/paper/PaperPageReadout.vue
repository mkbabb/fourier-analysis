<script setup lang="ts">
/**
 * X-DS pass 1 · F1-09 — the reading-location readout ("pg 4/110"), homed in
 * the ToC hosts (the desktop drawer, the phone bar). It was a glass chip
 * pinned to the viewport's bottom-left corner, unanchored to the article and,
 * at 390, over the running text. It is the hosts' own caption line now: no
 * plate, no overlay.
 *
 * `D/M-8` + `★MF-8` stay true: `role="status"` announces the page politely as
 * it changes, the ink is the strong muted rung, and the text is selectable.
 */
import { totalPages } from "@/lib/paperContent";

defineProps<{ currentPage: number }>();

/** X-DS fourier pass 7 · DS-F7C-T1: the widest string the readout can show. */
const widestChars = `pg ${totalPages}/${totalPages}`.length;
</script>

<template>
    <span class="page-readout fira-code" role="status" aria-live="polite" :style="{ '--readout-chars': widestChars }">
        pg {{ currentPage }}<span class="page-readout-sep">/</span>{{ totalPages }}
    </span>
</template>

<style scoped>
.page-readout {
    flex: none;
    font-size: var(--type-caption);
    line-height: var(--type-leading-caption);
    letter-spacing: 0.02em;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    /* X-DS fourier pass 7 · DS-F7C-T1: the readout reserves its widest string
       (a mono figure is 1ch, plus the tracking and the separator's 2px), so its
       neighbours hold still while the page count grows. */
    min-inline-size: calc(var(--readout-chars) * (1ch + 0.02em) + 2px);
    color: var(--muted-foreground-strong);
}

.page-readout-sep {
    opacity: 0.4;
    margin: 0 1px;
}
</style>
