<script setup lang="ts">
/**
 * The scrub-timeline composition — ONE session source for every `t ∈ [0, 1]`
 * axis in this app.
 *
 * X.F.W14V.au2 — A2-FO-L1-16, the consumer half: the component lives in
 * `components/shared/` (its hosts are /visualize's playback dock and
 * /equation's convergence timeline; it sat in `visualization/`, so equation
 * imported across). Its name left glass's namespace at UIA-F-239. glass 11.1.0
 * publishes the scrub session (the L1-16 glass ask, O-74): `Slider` emits
 * `grab` and `release`, so the re-derived session is retired and this file is
 * the axis and the readout.
 *
 * X.F.W3 `.a` — `fr-AnimationControls C-4 / M-1 / M-14` ⊕ `fr-GlassTimeline
 * C-9 / L-m3 / L-i4`. This file and `equation/convergence/ConvergenceTimeline.vue`
 * were name-identical forks of one another — same latch, same `[0..1] → [0..100]`
 * adapter, same dead token block, 300 lines between them. They are ONE
 * composition now: this component owns the axis, the session and the readout,
 * and `ConvergenceTimeline.vue` is a host that composes it beside a play control
 * and a harmonic count.
 *
 * ⊘ NOT the producer's `ScrubberTimeline` (`SR-1`, and the rejection is measured
 * rather than preferred): the prescribed 4.0.0 adoption is unexported at both
 * layers, the `SliderVariant` vocabulary at the adopted pin is
 * `"scrubber" | "spectrum"`, and the adoption regresses the accessible name to a
 * hardcoded "Timeline". What is re-derived here is the SESSION, over the
 * producer's own `<Slider>`.
 *
 * ── THE SESSION (`fr-GlassTimeline D-11 / L-m2` ⊕ `L-m6`) ──
 * The session is glass's own since 11.1.0. `grab` opens it when a primary
 * pointer takes the slider, before reka seeks (glass listens in the capture
 * phase), so the host pauses its clock first and the seek reaches it on the
 * next frame. `release` closes it on `pointerup`, `pointercancel` or
 * `lostpointercapture`, unconditionally, so a gesture that moved nothing (reka
 * emits no `valueCommit` for it) or a pointer the UA cancelled can no longer
 * leave it half-open. While the hand holds the slider, glass keeps the thumb
 * under the pointer and ignores the clock's writes to `modelValue`; after the
 * release it follows the model again from where the hand left it. The native
 * listeners on the resolved host, and the window `blur` closer, are retired
 * with the re-derivation.
 *
 * ── THE AXIS (`fr-ConvergenceTimeline C·C-7`, decided here, inside the
 * re-derivation, which is where the row says the decision belongs) ──
 * The forks modelled `t` as an integer `[0..100]` array and scaled by 100. On
 * the convergence host that under-resolved the quantity the control moves: the
 * minimum gap between two adjacent harmonics is 0.004823 in `t`, so 99 of 99
 * pairs fell inside one step. The obvious repair — `:max="1000"` on the integer
 * axis — is named as an ANTI-CURE because it multiplies the announcement rate
 * tenfold.
 *
 * Both halves dissolve on the producer's own `[0..1]` float contract (`C·C-13`),
 * which is what this composition takes: the domain IS the axis, `step` is the
 * host's to choose for what its own axis must resolve, and the announcement
 * rides `valueText` — a FUNCTION of the value, so a host announces
 * "12 of 99 harmonics" and re-announces when the HARMONIC changes, not when the
 * float does. The announcement rate is bounded by the quantity, never by the
 * step, which is the whole of the anti-cure's objection.
 */
import { computed, onMounted, ref, shallowRef, useTemplateRef } from "vue";
import { Slider } from "@mkbabb/glass-ui/slider";
import { Tooltip, TooltipContent } from "@mkbabb/glass-ui/tooltip";

const props = withDefaults(
    defineProps<{
        /** Position on the canonical `[0, 1]` axis. */
        modelValue: number;
        /**
         * The control's accessible name. Required — an unnamed slider is a
         * defect, and a default would hide one.
         *
         * ⊘ Deliberately NOT called `ariaLabel`. That spelling is shadowed by
         * the native `aria-label` attribute: a host writing `aria-label="…"`
         * would set a fallthrough ATTRIBUTE, which lands on this component's
         * root `<div>` — a div, with no role — while the thumb that carries
         * `role="slider"` stays unnamed. The prop is named for what it is, so
         * the wrong spelling cannot quietly half-work.
         */
        accessibleName: string;
        /** Caret readout text. Omitted ⇒ no caret. */
        label?: string;
        /** What one arrow key moves, in axis units. The host's decision. */
        step?: number;
        /** Humane readout, announced on the thumb through the producer's own prop. */
        valueText?: (t: number) => string;
        /** No drawing to scrub yet: the slider stands, and takes no input. */
        disabled?: boolean;
    }>(),
    { step: 0.01, disabled: false },
);

const emit = defineEmits<{
    "update:modelValue": [t: number];
    "scrub-start": [];
    "scrub-end": [];
}>();

const clamp01 = (v: number): number =>
    Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;

/**
 * `fr-GlassTimeline DT-1` — the fresh-array-per-rAF hole. The forks' getter
 * rebuilt a one-element array on every read of a clock that ticks sixty times a
 * second, so reka's deep watcher re-ran sixty times for the handful of value
 * changes the axis could actually hold. Quantising to a PRIMITIVE first means
 * the array is rebuilt only when the value it carries has moved.
 */
const quantised = computed(() => {
    const step = props.step > 0 ? props.step : 1;
    return Math.round(clamp01(props.modelValue) / step) * step;
});

const sliderModel = computed<number[]>({
    get: () => [quantised.value],
    /**
     * `fr-ConvergenceTimeline L·D-13` — the `number[] | undefined` adapter hole.
     * The producer's emit is typed `(value: number[] | undefined)`; the forks
     * read `arr[0] ?? 0`, which turned "no value" into a seek to the start.
     */
    set: (next) => {
        const raw = next?.[0];
        if (raw === undefined || !Number.isFinite(raw)) return;
        emit("update:modelValue", clamp01(raw));
    },
});

const thumbValueText = computed(() => {
    const fn = props.valueText;
    return fn ? (value: number) => fn(value) : undefined;
});

// ── The session (glass's `grab` / `release`) ─────────────────────────────
const sliderHost = useTemplateRef<{ $el?: unknown } | HTMLElement | null>("sliderHost");

/** True from glass's `grab` to its `release`: the caret's scrub reader and `data-scrubbing`. */
const scrubbing = ref(false);

function resolveHost(): HTMLElement | null {
    const held = sliderHost.value as { $el?: unknown } | HTMLElement | null;
    if (!held) return null;
    if (held instanceof HTMLElement) return held;
    const el = held.$el;
    return el instanceof HTMLElement ? el : null;
}

function onGrab(): void {
    if (scrubbing.value) return;
    scrubbing.value = true;
    emit("scrub-start");
}

function onRelease(): void {
    if (!scrubbing.value) return;
    scrubbing.value = false;
    emit("scrub-end");
}

/**
 * X·OD19-F8 (owner, 2026-10-19, frame-12.51.30.png: "The time popover in the
 * dock is clipped") — the caret is glass's portaled `Tooltip`, anchored to the
 * slider THUMB. It was an absolute box at `bottom: calc(100% + 6px)` inside the
 * dock's run, which glass has made a scroll container since 10.x (G-3), so the
 * run clipped all but a sliver of it. The portal leaves the scroll port; the
 * thumb (`role="slider"`, the element reka places at the value) is the anchor,
 * and glass's floating placement re-reads it every frame while the caret is
 * open: the thumb travels with the quantised value (the old `--caret-t`)
 * without resizing, so no resize or intersection observer would see it move.
 *
 * Open on the three readers the at-rest decision below names: hover, focus,
 * scrub. The touch reader's at-rest arm (`M-3`) does not survive the portal: a
 * top-layer plate open at rest would float over every sheet that covers the
 * dock. A touch reader opens it by scrubbing, which is the session's own arm.
 */
const thumbEl = shallowRef<HTMLElement | null>(null);
const hovered = ref(false);
const focused = ref(false);
const caretOpen = computed(() => !!thumbEl.value && (hovered.value || focused.value || scrubbing.value));

onMounted(() => {
    thumbEl.value = resolveHost()?.querySelector<HTMLElement>('[role="slider"]') ?? null;
});

defineExpose({ scrubbing });
</script>

<template>
    <div
        class="timeline-row"
        :data-scrubbing="scrubbing || undefined"
        @pointerenter="hovered = true"
        @pointerleave="hovered = false"
        @focusin="focused = true"
        @focusout="focused = false"
    >
        <!--
            `fr-GlassTimeline AX-1` ⊕ `D-5` / `D-6`, THE TWO-ATTRIBUTE LAW —
            `aria-hidden` here AND `aria-valuetext` on the control, in one edit.
            Either alone leaves the readout absent or duplicated as ~5×/s noise:
            the caret paints the same quantity the thumb announces.

            The valuetext rides the producer's `valueText` PROP, not a template
            attribute. The producer authors it onto the THUMB, which is the
            element that carries `role="slider"`; an `aria-valuetext` attribute
            lands on the root by fallthrough, where nothing reads it.

            X·OD19-F8 — the caret is glass's Tooltip, portaled out of the dock's
            scroll port and anchored to the thumb (`reference`), open on hover,
            focus or scrub; no local top layer and no local anchor positioning.
        -->
        <Tooltip v-if="label" :open="caretOpen">
            <TooltipContent
                class="timeline-caret"
                side="top"
                :side-offset="6"
                :reference="thumbEl ?? undefined"
                update-position-strategy="always"
                hide-when-detached
                aria-hidden="true"
            >
                <span class="caret-value fira-code">{{ label }}</span>
            </TooltipContent>
        </Tooltip>
        <Slider
            ref="sliderHost"
            v-model="sliderModel"
            :min="0"
            :max="1"
            :step="step"
            :aria-label="accessibleName"
            :value-text="thumbValueText"
            :disabled="disabled"
            class="timeline-slider"
            @grab="onGrab"
            @release="onRelease"
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

/*
   X·OD19-F8 — the caret's plate, placement and reveal are glass's Tooltip
   (`glass-floating glass-overlay-plate`, the tooltip reveal). The absolute box,
   its `--caret-t` inset (the thumb now carries that value), its opacity arms and its hand-rolled fade are deleted:
   the position is the thumb's, and the three readers open it (script). Only
   the readout's type stays here.
*/
.caret-value {
    display: block;
    font-size: var(--type-small);
    font-weight: 500;
    white-space: nowrap;
}

/*
   X.F.W3 `.a` · `fr-BasisSelector B-2` ⊕ `fr-SliderControl R-1` ⊕ `MPC-3` — the
   retint namespace this rule used to write is DEFINITION-ABSENT in the producer
   at every pin the tree has ever installed, so the declaration painted nothing.
   The height leg lands on the producer's real token; `R-1`'s rule is
   *height via `size`/inline*, and no `size` step is 24px (sm 12 · md 20 · lg 28).
   `--timeline-track-height` is the composition's own knob, so a host that needs
   a different track sets ONE property on this
   component's root and the producer token is derived from it — rather than a
   host stylesheet reaching past this scope into a producer class.

   `fr-GlassTimeline CU-1` — the drag surface carried zero `cursor-*` at every
   level, so the one control on the dock that IS draggable read as undraggable.
   The deletion is producer-owned and rides the SS-6 relay; the consumer may not
   ship a cursor-less drag surface while it waits.
*/
/* X-DS pass 3 · DS-F3-C5: the track is a thin rule, not a slab: a 20–24 px
   band of the identity amber was louder than the curve it indexes.
   FORTY-SECOND C and audit 42: the rule is 8 px, and the band that takes a
   press is the dock layer's own height on a fine pointer (on a desk 32 px of
   the 56 px dock no longer sits dead around a 24 px band); on a coarse one it
   is glass's slider touch target at the 44 px cell. The band is block padding,
   which reka's inline-axis pointer mapping never reads. The fill wears the
   site's amber through glass's own `--slider-range-bg`; the thumb, its held
   stretch and the drag's grain are glass's. */
.timeline-slider {
    --slider-track-height: var(--timeline-track-height, 0.5rem);
    --slider-range-bg: var(--viz-amber);
    padding-block: calc((var(--dock-layer-height, 2.5rem) - var(--slider-track-height)) / 2);
    cursor: grab;
}
@media (pointer: coarse) {
    .timeline-slider {
        --slider-touch-target: 2.75rem;
        padding-block: 0;
    }
}
.timeline-slider[data-disabled] {
    cursor: default;
}

.timeline-row[data-scrubbing] .timeline-slider,
.timeline-slider:active {
    cursor: grabbing;
}

</style>
