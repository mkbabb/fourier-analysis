<script setup lang="ts">
/**
 * Convergence timeline scrubber — play button + scrub track + N=… count.
 *
 * P.W5 Lane B.4 — migrated from the 166 LOC shadow recipe (manual
 * pointer-state-machine + `glass-track`/`glass-fill`/`glass-thumb` paints)
 * to `<Slider variant="glass-scrubber">`. The play button + harmonics
 * count column remain consumer-owned (chassis-level concerns; not the
 * slider scrubber proper). Dock-keep-open isn't directly wired here —
 * this site isn't a `<GlassDock>` descendant — but the variant's internal
 * `useOptionalDockContext()` resolves to `null` and the behavior is a
 * no-op, matching the surrounding consumer pattern.
 *
 * Scrub events are emitted to the parent as before (toggle-play +
 * scrub-start + scrub-move + scrub-end); we adapt the `[0..1]` `t` axis
 * to reka-ui's integer slider model by scaling by 100.
 */
import { computed, ref } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { Slider } from "@mkbabb/glass-ui/slider";

const props = defineProps<{
    t: number;
    playing: boolean;
    activeCount: number;
    totalHarmonics: number;
}>();

const emit = defineEmits<{
    "toggle-play": [];
    "scrub-start": [];
    "scrub-move": [t: number];
    "scrub-end": [];
}>();

const scrubbing = ref(false);

const tArr = computed<number[]>({
    get: () => [Math.round(props.t * 100)],
    set: (arr) => {
        const next = Math.max(0, Math.min(1, (arr[0] ?? 0) / 100));
        emit("scrub-move", next);
    },
});

function onPointerDown() {
    if (scrubbing.value) return;
    scrubbing.value = true;
    emit("scrub-start");
}

function onValueCommit() {
    if (!scrubbing.value) return;
    scrubbing.value = false;
    emit("scrub-end");
}
</script>

<template>
    <div class="timeline-dock">
        <Button variant="glass" size="icon" class="play-btn" :class="{ 'is-playing': playing }" @click="emit('toggle-play')">
            <Transition name="icon-swap" mode="out-in">
                <svg v-if="playing" class="size-3" viewBox="0 0 320 512" fill="currentColor"><path d="M48 64C21.5 64 0 85.5 0 112L0 400c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48L48 64zm192 0c-26.5 0-48 21.5-48 48l0 288c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48l-32 0z"/></svg>
                <svg v-else class="size-3" viewBox="0 0 384 512" fill="currentColor"><path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80L0 432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/></svg>
            </Transition>
        </Button>

        <div class="timeline-track-wrap">
            <Slider
                v-model="tArr"
                variant="glass-scrubber"
                :min="0"
                :max="100"
                :step="1"
                :aria-valuenow="activeCount"
                aria-valuemin="0"
                :aria-valuemax="totalHarmonics"
                aria-label="Harmonics timeline"
                class="convergence-slider"
                @pointerdown="onPointerDown"
                @value-commit="onValueCommit"
            />
        </div>

        <span class="timeline-count">N={{ activeCount }}/{{ totalHarmonics }}</span>
    </div>
</template>

<style scoped>
@reference "tailwindcss";

.timeline-dock {
    @apply flex items-center gap-2 mt-2;
}

.timeline-count {
    font-family: "Fira Code", monospace;
    font-size: 12px;
    color: var(--muted-foreground);
    width: 3.5rem;
    text-align: right;
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
}

.play-btn {
    @apply flex items-center justify-center shrink-0 rounded-full cursor-pointer;
    width: 1.75rem;
    height: 1.75rem;
    border: 1.5px solid color-mix(in srgb, var(--foreground) 10%, transparent);
    background: color-mix(in srgb, var(--background) 60%, transparent);
    backdrop-filter: blur(8px);
    color: var(--muted-foreground);
    /* A.W3.d — named properties + canonical token, no `transition: all`. */
    transition:
        color 0.15s var(--ease-standard),
        background-color 0.15s var(--ease-standard),
        border-color 0.15s var(--ease-standard);
}
.play-btn:hover {
    background: color-mix(in srgb, var(--background) 85%, transparent);
    color: var(--foreground);
}
.play-btn.is-playing {
    background: color-mix(in srgb, var(--foreground) 8%, transparent);
    border-color: color-mix(in srgb, var(--foreground) 20%, transparent);
    color: var(--foreground);
}

.timeline-track-wrap {
    @apply flex-1 min-w-0 relative flex items-center;
    padding: 0 0.125rem;
}

.convergence-slider {
    --slider-scrub-track-height: 20px;
}

/* ── Transitions ── */
.icon-swap-enter-active,
.icon-swap-leave-active {
    transition: opacity 0.1s ease, transform 0.1s ease;
}
.icon-swap-enter-from { opacity: 0; transform: scale(0.7); }
.icon-swap-leave-to   { opacity: 0; transform: scale(0.7); }
</style>
