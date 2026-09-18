<script setup lang="ts">
/**
 * Convergence timeline scrubber — play button + scrub track + N=… count.
 *
 * P.W5 Lane B.4 — migrated from the 166 LOC shadow recipe (manual
 * pointer-state-machine + `glass-track`/`glass-fill`/`glass-thumb` paints)
 * to `<Slider>`. The play button + harmonics
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
        <!-- `D·D-3` / `C·C-2` (SP-7) — the play control was named by nothing at
             all: an icon-only Button over two inline SVGs. The label carries the
             ACTION, and `aria-pressed` already carried the state. -->
        <Button
            emphasis="primary"
            size="md" icon-only
            class="play-btn"
            :aria-label="playing ? 'Pause the convergence sweep' : 'Play the convergence sweep'"
            :aria-pressed="playing"
            :class="{ 'is-playing': playing }"
            @click="emit('toggle-play')"
        >
            <Transition name="icon-swap" mode="out-in">
                <svg v-if="playing" class="size-3" viewBox="0 0 320 512" fill="currentColor"><path d="M48 64C21.5 64 0 85.5 0 112L0 400c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48L48 64zm192 0c-26.5 0-48 21.5-48 48l0 288c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48l-32 0z"/></svg>
                <svg v-else class="size-3" viewBox="0 0 384 512" fill="currentColor"><path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80L0 432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/></svg>
            </Transition>
        </Button>

        <div class="timeline-track-wrap">
            <!-- `D·D-4` / `C·C-3` / `D·D-3` — the `aria-valuenow`/`-valuemin`/
                 `-valuemax` trio was a FALLTHROUGH: it landed on the component's
                 root while the primitive computes its own range attributes from
                 the model, so the three either did nothing or announced a
                 different quantity (the harmonic COUNT) than the control moves
                 (the sweep position). They are deleted, and the count gets the
                 live region it always needed — see the span below. -->
            <Slider
                v-model="tArr"
                :min="0"
                :max="100"
                :step="1"
                :aria-valuetext="`${activeCount} of ${totalHarmonics} harmonics`"
                aria-label="Convergence sweep position"
                class="convergence-slider"
                @pointerdown="onPointerDown"
                @value-commit="onValueCommit"
            />
        </div>

        <span class="timeline-count" role="status" aria-live="polite">N={{ activeCount }}/{{ totalHarmonics }}</span>
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

/* `D·D-5` + `C·C-5` (SP-9) — the literal `1.75rem` box defeated BOTH producer
   knobs: the coarse `--ui-scale` ×1.5 and the `--control-floor` → `--touch-target`
   44px clamp. At fourier's root the rendered phone figure was 31.5px against a
   49.5px floor. The delete is the half that holds under either producer branch,
   and it is the only leg schedulable today: with the literals gone the primitive's
   own `icon-only` geometry governs and rides the comfort axis it was written for. */
.play-btn {
    @apply flex items-center justify-center shrink-0 rounded-full cursor-pointer;
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
