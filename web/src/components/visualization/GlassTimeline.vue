<script setup lang="ts">
/**
 * Timeline scrub bar — animation `t` ∈ [0, 1] with caret-label readout.
 *
 * P.W5 Lane B.4 + B.1 — migrated from the 175 LOC shadow recipe (manual
 * pointer-state-machine + `glass-track`/`glass-fill`/`glass-thumb` paints +
 * legacy string-key dock injects) to `<Slider variant="glass-scrubber">`.
 * The variant ships the 3-layer track + thumb + halo paints, the dock
 * keep-open contract (via `useOptionalDockContext()` internally), focus
 * ring, ARIA wiring, and keyboard step. We retain the caret-label which is
 * the only divergent surface vs the canonical variant.
 *
 * Dock-keep-open: the v1.8.x `<Slider>` acquires the typed `DockContext`
 * token internally, so we no longer inject `dockKeepOpen`/`dockRelease`
 * by string-key (CR-2 silent regression at v1.7.0 — keys retired at O.W2).
 * The store's `startScrub`/`endScrub`/`seek` axis is fed via a `valueCommit`
 * trio on `<Slider>`: pointerdown opens scrub, drag emits seek, pointerup
 * closes scrub.
 */
import { computed, ref } from "vue";
import { Slider } from "@mkbabb/glass-ui/slider";
import { useAnimationStore } from "@/stores/animation";

defineProps<{
    label: string;
}>();

const anim = useAnimationStore();

const scrubbing = ref(false);

/* Slider models `t` as a single-element `[0..100]` int array (reka-ui's
   SliderRoot uses integers; we scale by 100 to give 1 % granularity).
   Two-way binding adapts the store's `[0..1]` t-axis to the slider scale. */
const tArr = computed<number[]>({
    get: () => [Math.round(anim.t * 100)],
    set: (arr) => {
        const next = Math.max(0, Math.min(1, (arr[0] ?? 0) / 100));
        anim.seek(next);
    },
});

function onValueCommitStart() {
    if (scrubbing.value) return;
    scrubbing.value = true;
    anim.startScrub();
}

function onPointerDown() {
    onValueCommitStart();
}

function onValueCommit() {
    if (!scrubbing.value) return;
    scrubbing.value = false;
    anim.endScrub();
}
</script>

<template>
    <div class="timeline-row">
        <div class="timeline-caret" :style="{ left: (anim.t * 100) + '%' }">
            <span class="caret-value fira-code">{{ label }}</span>
        </div>
        <Slider
            v-model="tArr"
            variant="glass-scrubber"
            :min="0"
            :max="100"
            :step="1"
            aria-label="Timeline"
            class="timeline-slider"
            @pointerdown="onPointerDown"
            @value-commit="onValueCommit"
        />
    </div>
</template>

<style scoped>
@reference "tailwindcss";
.timeline-row {
    flex: 1 1 0;
    min-width: 0;
    padding: 0 0.25rem;
    position: relative;
    display: flex;
    align-items: center;
}

.timeline-caret {
    position: absolute;
    bottom: calc(100% + 6px);
    transform: translateX(-50%);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: var(--z-popover);
    user-select: none;
    -webkit-user-select: none;
}

.timeline-row:hover .timeline-caret,
.timeline-row:has(.glass-slider[data-held]) .timeline-caret {
    opacity: 1;
}

.caret-value {
    display: block;
    padding: 0.125rem 0.375rem;
    @apply text-base;
    font-weight: 500;
    color: var(--popover-foreground);
    background: var(--popover);
    border: 1px solid var(--border);
    border-radius: 0.25rem;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    white-space: nowrap;
}

/* Retint the glass-scrubber variant tokens to match HEAD's foreground-tinted
   recipe (the variant defaults compose `--surface-tint-*`; HEAD used
   `color-mix(in srgb, var(--foreground) N%, transparent)` which is
   equivalent to surface-tint at the same N%). */
.timeline-slider {
    --slider-scrub-track-height: 24px;
}
</style>
