<script setup lang="ts">
/**
 * Convergence transport — play control, the one scrub composition, N=… count.
 *
 * X.F.W3 `.a` — `fr-AnimationControls C-4 / M-1 / M-14` ⊕ `fr-ConvergenceTimeline
 * L·D-7`. This file WAS a verbatim fork of `visualization/GlassTimeline.vue` (renamed `FourierTimeline.vue` at X.F.W14V.u4, UIA-F-239):
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
import { Pause, Play } from "@lucide/vue";
import FourierTimeline from "@/components/shared/FourierTimeline.vue";

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
            <!-- X.F.W14U.eq — UIA-F-253: the app's glyph set (lucide), not two
                 inline Font Awesome paths. -->
            <Transition name="icon-swap" mode="out-in">
                <Pause v-if="playing" class="size-3.5" />
                <Play v-else class="size-3.5" />
            </Transition>
        </Button>

        <div class="timeline-track-wrap">
            <FourierTimeline
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
    font-size: var(--type-caption);
    color: var(--muted-foreground);
    width: 3.5rem;
    text-align: right;
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
}

/* `D·D-5` + `C·C-5` (SP-9) — the literal box is gone, so the primitive's own
   `icon-only` geometry governs on the comfort axis.
   X.F.W14U.eq — UIA-F-253: the rest of the local repaint (border, plate,
   backdrop, ink, hover and pressed fills over glass's Button) is deleted with
   the Font Awesome paths: the Button's `emphasis` owns its surface, and its
   `aria-pressed` state is the producer's to paint. */
.play-btn {
    flex-shrink: 0;
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
