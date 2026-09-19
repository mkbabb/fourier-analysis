<script setup lang="ts">
/**
 * Labeled slider chassis — label + inline numeric input + the producer's track.
 *
 * P.W5 Lane B.4 + B.1 — migrated from the 221 LOC shadow recipe to `<Slider>`
 * with the canonical label + numeric-input chassis preserved as the wrapper.
 *
 * ⊘ X.F.W3 `.a` · `fr-SliderControl R-21` — the docblock is corrected in the
 * same edit as the `R-1` cure below, because a stale comment is how a cured bug
 * gets re-derived. Four drifts, each named:
 *
 *   · The shadow relation was INVERTED (`fr-AnimationControls M-4`).
 *     `glass-track` / `glass-fill` / `glass-thumb` are the PRODUCER's own live
 *     class literals, not a hand-rolled recipe this wrapper escaped — so the
 *     old sentence credited the migration with leaving the very surface it
 *     migrated ONTO.
 *   · `v1.8.x` was pinned against an installed 4.0.0 and the tree now resolves
 *     8.0.0; the version is dropped rather than re-spelled, because the
 *     producer fact that matters here is a CONTRACT (`<Slider>` acquires the
 *     typed dock context itself, so no `dockKeepOpen`/`dockRelease` string-key
 *     inject — CR-2's regression at v1.7.0, keys retired at O.W2), and a
 *     contract does not need a version label to be true.
 *   · The retired `variant?: "timeline" | "default"` prop (A.W3.b D5 fold,
 *     retirement disposition (b)) is kept as history; the claim that the
 *     wrapper "commits to the glass-scrubber surface" is not, since that
 *     vocabulary is two majors dead — at the adopted pin the variants are
 *     `"scrubber" | "spectrum"` and `scrubber` is already the default.
 *   · The projection the old `:140-142` asserted did not occur — see the rule
 *     at the foot of this file.
 */
import { computed } from "vue";
import { Slider } from "@mkbabb/glass-ui/slider";

const props = defineProps<{
    label: string;
    subtitle?: string;
    modelValue: number;
    min: number;
    max: number;
    step: number;
    color: string;
    formatValue?: (v: number) => string;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", v: number): void;
}>();

function clamp(v: number, lo: number, hi: number): number {
    return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : lo;
}

function onInput(e: Event) {
    emit(
        "update:modelValue",
        clamp(parseFloat((e.target as HTMLInputElement).value), props.min, props.max),
    );
}

/* reka-ui's SliderRoot accepts an array model; we adapt the scalar binding
   here so the surrounding API surface (scalar `modelValue`) is preserved. */
const sliderModel = computed<number[]>({
    get: () => [props.modelValue],
    set: (arr) => emit("update:modelValue", clamp(arr[0] ?? props.min, props.min, props.max)),
});

const displayValue = computed(() =>
    props.formatValue ? props.formatValue(props.modelValue) : String(props.modelValue),
);
const isNumericDisplay = computed(() => !Number.isNaN(Number(displayValue.value)));
</script>

<template>
    <div class="slider-control">
        <label class="slider-label">
            <span>
                <slot>{{ label }}</slot>
                <span v-if="subtitle" class="slider-subtitle"> — {{ subtitle }}</span>
            </span>
            <input
                :type="isNumericDisplay ? 'number' : 'text'"
                class="inline-number fira-code"
                :value="displayValue"
                :min="isNumericDisplay ? min : undefined"
                :max="isNumericDisplay ? max : undefined"
                :step="isNumericDisplay ? step : undefined"
                @input="onInput"
            />
        </label>
        <Slider
            v-model="sliderModel"
            :min="min"
            :max="max"
            :step="step"
            :aria-label="label"
            class="slider-track-host"
            :style="{ '--track-color': color }"
        />
    </div>
</template>

<style scoped>
@reference "tailwindcss";
.slider-control {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.slider-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    @apply text-sm;
    font-weight: 500;
    color: var(--muted-foreground);
}

.slider-subtitle {
    font-weight: 400;
    font-size: 0.75em;
    opacity: 0.7;
}

.inline-number {
    width: 2.75rem;
    text-align: right;
    background: transparent;
    border: none;
    border-bottom: 1px solid transparent;
    color: var(--foreground);
    font-size: inherit;
    padding: 0;
    outline: none;
    -moz-appearance: textfield;
    transition: border-color 0.15s;
}
.inline-number:hover,
.inline-number:focus {
    border-bottom-color: color-mix(in srgb, var(--foreground) 30%, transparent);
}
.inline-number::-webkit-inner-spin-button,
.inline-number::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

/*
   X.F.W3 `.a` · `fr-SliderControl R-1` (⊕ `B-2` / `MPC-3`) — THE PER-INSTANCE
   RETINT, LANDED, and the `R-21` drift it was the evidence for.

   The five declarations this replaces named a namespace the producer defines at
   NO pin this tree has installed, so the `color` prop — which every one of this
   wrapper's callsites is required to pass — delivered zero pixels and every
   track painted the stock capsule. That is the projection the old comment
   asserted and that never occurred.

   The cure is the banked shape and not a bare rename:
     · the range pair collapses to the producer's real `--slider-range-bg`, at
       FULL STRENGTH — the producer already dilutes the tint to 88%, so keeping
       the `25%`/`35%` wrappers would have shipped net α 0.22 and put the fill
       below its own track's 1.4.11 floor under a green sweep (`MPC-10`);
     · the thumb pair is DELETED, not renamed — the scrubber thumb is
       `width: 0; opacity: 0` by contract, its leading edge IS the handle;
     · the height rides the producer's own token inline, since no `size` step is
       16px (sm 12 · md 20 · lg 28).
   `D-14`: the fallback is explicit, so an empty `color` degrades to the
   producer's capsule instead of to an invalid value.
*/
.slider-track-host {
    --slider-track-height: 16px;
    --slider-range-bg: var(--track-color, var(--glass-capsule-warm));
}
</style>
