<script setup lang="ts">
/**
 * Labeled slider chassis — label + inline numeric input + glass-scrubber track.
 *
 * P.W5 Lane B.4 + B.1 — migrated from the 221 LOC shadow recipe (manual
 * pointer-state-machine + `glass-track`/`glass-fill`/`glass-thumb` paints +
 * legacy string-key dock injects) to `<Slider variant="glass-scrubber">`
 * with the canonical label + numeric-input chassis preserved as the wrapper.
 *
 * A.W3.b D5 fold — the legacy `variant?: "timeline" | "default"` prop is
 * retired here. The two branches were already cosmetically identical (both
 * mapped to `<Slider variant="glass-scrubber">`) and no consumer in the
 * tree passes the prop explicitly (verified via `git grep '<SliderControl'
 * | xargs grep variant`). Retirement disposition (b) per `audit/W3-adoption-
 * ledger.md`; the wrapper now commits unconditionally to the canonical
 * glass-scrubber surface, discharging the H1-hardening flag.
 *
 * Dock-keep-open: the v1.8.x `<Slider>` acquires the typed `DockContext`
 * token internally, so we no longer inject `dockKeepOpen`/`dockRelease`
 * by string-key (CR-2 silent regression at v1.7.0 — keys retired at O.W2).
 */
import { computed } from "vue";
import { Slider } from "@mkbabb/glass-ui";

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
            variant="glass-scrubber"
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

/* Retint the glass-scrubber variant tokens for the per-instance color hook
   (`--track-color`). The variant defaults compose `--surface-tint-*`; we
   project the per-color tint onto the range + thumb. */
.slider-track-host {
    --slider-scrub-track-height: 16px;
    --slider-scrub-range-bg: color-mix(in srgb, var(--track-color) 25%, transparent);
    --slider-scrub-range-bg-hover: color-mix(in srgb, var(--track-color) 35%, transparent);
    --slider-scrub-thumb-bg: var(--track-color);
    --slider-scrub-thumb-bg-hover: var(--track-color);
}
</style>
