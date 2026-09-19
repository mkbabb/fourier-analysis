<script setup lang="ts">
/**
 * Convergence transport — play control, the one scrub composition, N=… count.
 *
 * X.F.W3 `.a` — `fr-AnimationControls C-4 / M-1 / M-14` ⊕ `fr-ConvergenceTimeline
 * L·D-7`. This file WAS a verbatim fork of `visualization/GlassTimeline.vue`:
 * the same latch, the same `[0..1] → [0..100]` adapter, the same dead retint
 * token, re-authored a second time because the original had no `modelValue` and
 * no emits and bound the animation store directly. The composition is
 * parameterised now, so what is left here is what was always genuinely this
 * site's: a play button, a harmonic count, and the wiring between them.
 *
 * The scrub axis, the session pair, the caret and the announcement all live in
 * the composition. This host's own contribution to them is one decision —
 * `step` — and it is the decision `C·C-7` demanded be made inside the
 * re-derivation rather than after it. See below.
 *
 * ⊘ The parent's event surface is UNCHANGED (`toggle-play` · `scrub-start` ·
 * `scrub-move` · `scrub-end` over `t` · `playing` · `activeCount` ·
 * `totalHarmonics`): `ConvergencePlot.vue` is another unit's file, and a fold
 * that re-cut its callsite would be this unit writing outside its bounds.
 */
import { Button } from "@mkbabb/glass-ui/button";
import GlassTimeline from "@/components/visualization/GlassTimeline.vue";

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

/**
 * `fr-ConvergenceTimeline C·C-7`, THE AXIS DECISION.
 *
 * The integer `[0..100]` axis the fork carried under-resolved the quantity this
 * control actually moves: adjacent harmonics are 0.004823 apart at the tightest,
 * and 99 of 99 pairs fell inside a single step — so a third of the sweep
 * addressed positions the reader could not reach. `:max="1000"` was the named
 * ANTI-CURE, on the ground that it multiplies the announcement rate tenfold.
 *
 * On the float axis, step and announcement are no longer the same knob. `0.001`
 * is five times finer than the tightest harmonic gap, so every pair is
 * addressable; and the announcement is `valueText`, keyed on the HARMONIC
 * COUNT, so it changes at most once per harmonic however fine the step is. The
 * anti-cure's objection is answered by arithmetic rather than conceded to.
 */
const STEP = 0.001;

/**
 * `D·D-4` / `C·C-3` / `D·D-3` — the `aria-valuenow`/`-valuemin`/`-valuemax`
 * trio this replaces was a FALLTHROUGH onto the component root, where the
 * primitive's own range attributes already live on the thumb, so the three
 * either did nothing or announced a different quantity (the harmonic COUNT)
 * than the control moves (the sweep position). `aria-valuetext` went the same
 * way. The count is the humane reading of the position, so it is authored ONTO
 * the thumb through the producer's `valueText` prop — and the count also keeps
 * the live region below, which is what a reader not on the control hears.
 */
const harmonicValueText = (): string =>
    `${props.activeCount} of ${props.totalHarmonics} harmonics`;
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
            @click="emit('toggle-play')"
        >
            <Transition name="icon-swap" mode="out-in">
                <svg v-if="playing" class="size-3" viewBox="0 0 320 512" fill="currentColor"><path d="M48 64C21.5 64 0 85.5 0 112L0 400c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48L48 64zm192 0c-26.5 0-48 21.5-48 48l0 288c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48l-32 0z"/></svg>
                <svg v-else class="size-3" viewBox="0 0 384 512" fill="currentColor"><path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80L0 432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/></svg>
            </Transition>
        </Button>

        <div class="timeline-track-wrap">
            <GlassTimeline
                class="convergence-timeline"
                :model-value="t"
                :step="STEP"
                accessible-name="Convergence sweep position"
                :value-text="harmonicValueText"
                @update:model-value="emit('scrub-move', $event)"
                @scrub-start="emit('scrub-start')"
                @scrub-end="emit('scrub-end')"
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
/* X.F.W3 repair 1 — the published active-state vocabulary, applied (`FR-COB-3`).
   This control already SET `aria-pressed` and then painted from a parallel
   `.is-playing` class: two channels for one state, either changeable without
   the other, and only ONE of them visible to the producer's `forced-colors` and
   `prefers-contrast` arms, which key on ARIA exclusively. The class binding is
   deleted and the rule keys on the attribute. */
.play-btn[aria-pressed="true"] {
    background: color-mix(in srgb, var(--foreground) 8%, transparent);
    border-color: color-mix(in srgb, var(--foreground) 20%, transparent);
    color: var(--foreground);
}

.timeline-track-wrap {
    @apply flex-1 min-w-0 relative flex items-center;
    padding: 0 0.125rem;
}

/*
   The composition's track knob, set on ITS root — which is the element this
   scope reaches, since a child component's root carries the parent's scope id.
   `MPC-3`'s height leg gave this site 20px, and the producer's `md` step is
   exactly that; the knob keeps the figure here rather than making the
   composition's default a two-host compromise.
*/
.convergence-timeline {
    --timeline-track-height: 20px;
}

/* ── Transitions ── */
.icon-swap-enter-active,
.icon-swap-leave-active {
    transition: opacity 0.1s ease, transform 0.1s ease;
}
.icon-swap-enter-from { opacity: 0; transform: scale(0.7); }
.icon-swap-leave-to   { opacity: 0; transform: scale(0.7); }
</style>
