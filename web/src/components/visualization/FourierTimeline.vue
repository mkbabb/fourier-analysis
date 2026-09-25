<script setup lang="ts">
/**
 * The scrub-timeline composition — ONE session source for every `t ∈ [0, 1]`
 * axis in this app.
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
 * ── THE SESSION CONTRACT (`fr-GlassTimeline D-11 / L-m2` ⊕ `L-m6`) ──
 * The docblock this replaces stated the FREEZE as the file's contract, and it
 * was wrong three ways: there is no `valueCommit` "trio"; pointerup did NOT
 * close the scrub (reka's `valueCommit` is `hasChanged`-gated, so a null-delta
 * press emitted nothing and left the session open forever, the rAF cancelled
 * and the pause glyph asserting motion); and it named an `onValueCommitStart`
 * emit the primitive has never had. The emit surface is exactly
 * `"update:modelValue"` and `valueCommit`.
 *
 * What is true instead, and is the contract this component now keeps:
 *
 *   OPEN   `pointerdown`, primary button only, on the RESOLVED HOST.
 *   CLOSE  `pointerup` · `pointercancel` · `blur` at the window, and
 *          `lostpointercapture` at the host — UNCONDITIONALLY, so the pair can
 *          never be left half-open by a gesture that moved nothing or by a UA
 *          that cancelled the pointer.
 *
 * The listeners are NATIVE and attach to the element `$el` resolves to
 * (`PD-1`'s channel lock: *native-listeners-on-resolved-host or an upstream
 * session-pair prop, never template bindings on the forwarding chain*). A
 * template `@pointerdown` rides attribute fallthrough across four component
 * boundaries — a channel the producer's own `Slider` docblock declares dead,
 * and whose liveness at this pin is an observation, not a contract.
 *
 * ORDER, and it is provable rather than lucky (`C·C-9`, `rK-22`): reka's own
 * `pointerdown` handler is a template binding inside `SliderImpl`, installed
 * when that child mounts; ours is installed in THIS component's `onMounted`,
 * and a child's mounted hook runs before its parent's. Same element, same
 * phase, registration order ⇒ invocation order `[rekaImpl, consumer]`. Reka
 * seeks first; the session opens on the value it seeked to.
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
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue";
import { Slider } from "@mkbabb/glass-ui/slider";

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
    }>(),
    { step: 0.01 },
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

// ── The session ──────────────────────────────────────────────────────────
const sliderHost = useTemplateRef<{ $el?: unknown } | HTMLElement | null>("sliderHost");

/**
 * Session state — NOT the `scrub-start` de-dup latch the forks carried. That
 * latch existed because the close was conditional and could fail to fire, and
 * once it had, a single freeze suppressed every subsequent `scrub-start` for the
 * life of the page. This flag is transient by construction: every open registers
 * its own unconditional closers and every close removes them.
 */
const scrubbing = ref(false);

function resolveHost(): HTMLElement | null {
    const held = sliderHost.value as { $el?: unknown } | HTMLElement | null;
    if (!held) return null;
    if (held instanceof HTMLElement) return held;
    const el = held.$el;
    return el instanceof HTMLElement ? el : null;
}

function endSession(): void {
    if (!scrubbing.value) return;
    scrubbing.value = false;
    detachClosers();
    emit("scrub-end");
}

function attachClosers(): void {
    resolveHost()?.addEventListener("lostpointercapture", endSession);
    window.addEventListener("pointerup", endSession);
    window.addEventListener("pointercancel", endSession);
    window.addEventListener("blur", endSession);
}

function detachClosers(): void {
    resolveHost()?.removeEventListener("lostpointercapture", endSession);
    window.removeEventListener("pointerup", endSession);
    window.removeEventListener("pointercancel", endSession);
    window.removeEventListener("blur", endSession);
}

function beginSession(event: PointerEvent): void {
    // `fr-GlassTimeline DT-1` — there was no `event.button` filter, so a
    // secondary or middle click opened a scrub that no pointerup would close.
    if (event.button !== 0) return;
    if (scrubbing.value) return;
    scrubbing.value = true;
    attachClosers();
    emit("scrub-start");
}

/**
 * `fr-GlassTimeline DT-1` — dual mount, no lifecycle. The forks declared no
 * mounted or unmounted hook at all; the session now owns both ends of its own
 * listeners, which is what makes the pair auditable.
 */
onMounted(() => {
    resolveHost()?.addEventListener("pointerdown", beginSession);
});

onBeforeUnmount(() => {
    resolveHost()?.removeEventListener("pointerdown", beginSession);
    detachClosers();
});

defineExpose({ scrubbing });
</script>

<template>
    <div class="timeline-row" :data-scrubbing="scrubbing || undefined">
        <!--
            `fr-GlassTimeline AX-1` ⊕ `D-5` / `D-6`, THE TWO-ATTRIBUTE LAW —
            `aria-hidden` here AND `aria-valuetext` on the control, in one edit.
            Either alone leaves the readout absent or duplicated as ~5×/s noise:
            the caret paints the same quantity the thumb announces.

            The valuetext rides the producer's `valueText` PROP, not a template
            attribute. The producer authors it onto the THUMB, which is the
            element that carries `role="slider"`; an `aria-valuetext` attribute
            lands on the root by fallthrough, where nothing reads it.
        -->
        <div
            v-if="label"
            class="timeline-caret"
            aria-hidden="true"
            :style="{ '--caret-t': quantised }"
        >
            <span class="caret-value glass-floating fira-code">{{ label }}</span>
        </div>
        <Slider
            ref="sliderHost"
            v-model="sliderModel"
            :min="0"
            :max="1"
            :step="step"
            :aria-label="accessibleName"
            :value-text="thumbValueText"
            class="timeline-slider"
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
   `fr-GlassTimeline LF-1` — the producer's own rule is "NEVER `style.left`",
   and the forks wrote an inline `left` percentage on every frame of a 60fps
   clock. The position rides the INSET channel through one custom property:
   `--caret-t` is the axis value itself, and the caret is laid out from it.
*/
.timeline-caret {
    position: absolute;
    inset-inline-start: calc(var(--caret-t, 0) * 100%);
    bottom: calc(100% + 6px);
    transform: translateX(-50%);
    pointer-events: none;
    opacity: 0;
    /* X.F.W4 · SP-4 / `fr-AnimationControls M-7` — raw `ease` and a bare
       duration on a surface that is otherwise tokenised; and the caret's fade
       was ungated, one of the two child surfaces that extend D-8's inventory. */
    transition: opacity var(--duration-normal) var(--ease-standard);
    user-select: none;
    -webkit-user-select: none;
}

/*
   `fr-GlassTimeline D-6` ⊕ `fr-AnimationControls M-3` — THE AT-REST DECISION
   the re-derivation owed.

   The readout is the value half of what this component exists to produce, and
   it was revealed by `:hover` alone — so a keyboard user drove an invisible
   value (D-6) and a touch user never saw position at rest in either dock state
   (M-3). Three arms, each naming its reader:

     · `:hover`           — the pointer reader, unchanged.
     · `:focus-within`    — the keyboard reader, which had no arm at all.
     · `[data-scrubbing]` — the drag reader, driven by THIS component's own
                            session. The fork reached into the producer's
                            internals for it (`:has(.glass-slider[data-held])`),
                            an ancestor compound over a class we do not own;
                            `DT-1` deletes that reach.

   The touch reader is served at rest, keyed on pointer CAPABILITY rather than
   on a hover the device cannot produce. `D-7`/`D-23`'s collapsed-summary half
   of the same finding is F.W4's row and is not taken here.
*/
.timeline-row:hover .timeline-caret,
.timeline-row:focus-within .timeline-caret,
.timeline-row[data-scrubbing] .timeline-caret {
    opacity: 1;
}

@media (hover: none) and (pointer: coarse) {
    .timeline-caret {
        opacity: 1;
    }
}

/*
   `fr-GlassTimeline D-8 / D-9 / D-10 / L-m5` — three de-tokenised paints, back
   on the tokens (the fourth leg, the transition, folded to `M-7` and landed at
   F.W4; the fifth, the bare `6px` above, is STRUCK — the producer's own
   `.timeline-caret` carries `bottom: calc(100% + 6px)` bare).
   `S-alpha` — the three scheme-paired declarations stay paired.
*/
/* X.F.W14V.u4 — UIA-F-239: the readout was a hand-rolled plate (its own
   popover fill, border, small shadow and a 4 px corner). It is glass's
   `glass-floating` plate (template) at the popover canon's `--radius-panel`,
   the same floating surface as the convergence plot's readout and the
   coefficient popover. Only the type and the spacing stay here. */
.caret-value {
    display: block;
    padding: 0.125rem 0.375rem;
    font-size: var(--type-small);
    font-weight: 500;
    color: var(--popover-foreground);
    border-radius: var(--radius-panel);
    white-space: nowrap;
}

/*
   X.F.W3 `.a` · `fr-BasisSelector B-2` ⊕ `fr-SliderControl R-1` ⊕ `MPC-3` — the
   retint namespace this rule used to write is DEFINITION-ABSENT in the producer
   at every pin the tree has ever installed, so the declaration painted nothing.
   The height leg lands on the producer's real token; `R-1`'s rule is
   *height via `size`/inline*, and no `size` step is 24px (sm 12 · md 20 · lg 28).
   `--timeline-track-height` is the composition's own knob, so a host that needs
   a different track (the convergence dock takes 20px) sets ONE property on this
   component's root and the producer token is derived from it — rather than a
   host stylesheet reaching past this scope into a producer class.

   `fr-GlassTimeline CU-1` — the drag surface carried zero `cursor-*` at every
   level, so the one control on the dock that IS draggable read as undraggable.
   The deletion is producer-owned and rides the SS-6 relay; the consumer may not
   ship a cursor-less drag surface while it waits.
*/
.timeline-slider {
    --slider-track-height: var(--timeline-track-height, 24px);
    cursor: grab;
}

.timeline-row[data-scrubbing] .timeline-slider,
.timeline-slider:active {
    cursor: grabbing;
}

@media (prefers-reduced-motion: reduce) {
    .timeline-caret {
        transition: none;
    }
}
</style>
