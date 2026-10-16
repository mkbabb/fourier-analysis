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
</script>

<template>
    <span class="page-readout fira-code" role="status" aria-live="polite">
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
    color: var(--muted-foreground-strong);
}

.page-readout-sep {
    opacity: 0.4;
    margin: 0 1px;
}
</style>
