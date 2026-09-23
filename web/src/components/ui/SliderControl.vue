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
 *
 * ⊘ X.F.W14.h · OA-45 (owner frame `owner-2026-09-23-hierarchy.png`) — THE ONE
 * CONTROL-ROW IDIOM. Every labelled slider in the app is this component; no
 * page composes its own row. The row is two lines and only two:
 *
 *   line 1 — the label (glass `Label`, `--type-small`), an optional mono token
 *            (`N`) or muted subtitle (ellipsised, never wrapping), and the value
 *            field (glass `NumberField`) at the line's end, with an optional unit;
 *   line 2 — the producer's `Slider`, directly beneath, with a VISIBLE thumb and
 *            a track FILL.
 *
 * Rhythm is glass's spacing scale (`--space-atom` inside the row); the row never
 * grows a third line, so every row in the app measures one height.
 *
 * The producer ships no slider that has both a visible thumb and a fill: the
 * `scrubber` variant's thumb is `width: 0; opacity: 0` by contract (its fill's
 * leading edge is the handle — the "thick bar with no visible thumb" of the
 * frame), and the `spectrum` variant's thumb is visible but its range paints
 * nothing. Nor does it ship a labelled slider with an inline value field
 * (`LabeledSlider` carries no value). Both are ROUTED to glass BL by id
 * (`BL-FW14H-1` slider thumb+fill; `BL-FW14H-2` labelled slider with inline
 * value; the O-59 relay line). Meanwhile the row COMPOSES existing primitives
 * through the producer's public surface: the `spectrum` variant (visible thumb)
 * and its documented track token `--glass-slider-track-background`, painted as
 * the fill up to the thumb's centre (reka's `contain` thumb alignment: the
 * centre travels from half a thumb in to half a thumb short of the end).
 */
import { computed, useAttrs, useId } from "vue";
import { Slider } from "@mkbabb/glass-ui/slider";
import { NumberField, NumberFieldInput } from "@mkbabb/glass-ui/number-field";
import { Label } from "@mkbabb/glass-ui/label";

const props = defineProps<{
    label: string;
    /** A muted descriptive secondary label, on the label's line (ellipsised). */
    subtitle?: string;
    /** A mono token or spec reference beside the label (`N`). */
    token?: string;
    /** The value's unit, after the field (`ms`). */
    unit?: string;
    modelValue: number;
    min: number;
    max: number;
    step: number;
    color: string;
    formatValue?: (v: number) => string;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", v: number): void;
    /**
     * X.F.W3 `.a` · `g10` ⊕ `fr-SliderControl R-7` — THE RE-EMITTED SETTLE EVENT.
     *
     * The primitive emits two things, and this wrapper declared one. The one it
     * dropped is the one that says a drag is OVER, so every consumer saw only
     * the per-step stream and had to invent its own coalescing — which produced
     * three different dialects across the tree (1000ms, 300ms, and none at
     * all), and the "none" case is a synchronous `sessionStorage.setItem` per
     * accepted step off a 100-step track.
     *
     * A wrapper earns its existence by ADDING contract the primitive lacks; it
     * never earns it by removing some. Re-emitting is the whole cure: a
     * consumer that wants the settle event can have it, and the debounce
     * dialects become one consumer's choice rather than a forced invention.
     */
    (e: "valueCommit", v: number): void;
}>();

/**
 * `g10`'s WRAPPER LAW, at the one wrapper whose anti-rule is written into the
 * gate: *"NEVER blanket `inheritAttrs: false` on SliderControl — `class`
 * fallthrough is WANTED; cure = explicit passthrough."*
 *
 * Both halves of that are honoured by SPLITTING the fallthrough rather than by
 * disabling it. Before this, every attribute a consumer set landed on the outer
 * `<div>`: `class` and `style` correctly, since the chassis IS the thing being
 * laid out — and `aria-describedby`, `id`, `data-*`, `disabled` and every
 * native listener incorrectly, onto a plain div with no role, while the control
 * that has the role never saw them. The asymmetry was silent in both
 * directions.
 *
 * So the layout attributes go to the chassis and everything else goes to the
 * control, and the split is explicit rather than a blanket switch. The
 * consumer's own bindings are applied AFTER the derived ones on the control, so
 * an explicitly-passed `aria-label` beats the one derived from `label` — stated
 * intent outranks a default.
 */
defineOptions({ inheritAttrs: false });

const attrs = useAttrs();

const chassisAttrs = computed(() => ({ class: attrs.class, style: attrs.style }));

const controlAttrs = computed(() => {
    const { class: _class, style: _style, ...rest } = attrs;
    return rest;
});

function clamp(v: number, lo: number, hi: number): number {
    return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : lo;
}

/**
 * X.F.W13.b — the inline numeric field is the producer's `NumberField`, not a
 * hand-rolled `<input>` (owner frame 3, OA-15: a bare underline field with no
 * name of its own, no corner, and no stepping keys). Its display precision is
 * read from `step` — the digits `formatValue` spelled by hand at every callsite
 * (`toFixed(2)` on a 0.05 step, `toFixed(1)` on 0.1/0.5, integers on 1) — so the
 * field formats, parses and steps in one locale-aware register. A `formatValue`
 * whose reading is NOT a number (Max Contours' `0 → "All"`) is shown as the
 * field's placeholder over an empty value, and clearing the field commits
 * `min`, the value that reading names.
 */
const fractionDigits = computed(() => String(props.step).split(".")[1]?.length ?? 0);
const numberFormat = computed<Intl.NumberFormatOptions>(() => ({
    minimumFractionDigits: fractionDigits.value,
    maximumFractionDigits: fractionDigits.value,
    useGrouping: false,
}));

function onNumber(v: number) {
    emit("update:modelValue", clamp(v, props.min, props.max));
}

/* reka-ui's SliderRoot accepts an array model; we adapt the scalar binding
   here so the surrounding API surface (scalar `modelValue`) is preserved. */
const sliderModel = computed<number[]>({
    get: () => [props.modelValue],
    set: (arr) => emit("update:modelValue", clamp(arr[0] ?? props.min, props.min, props.max)),
});

function onValueCommit(arr: number[]) {
    const raw = arr?.[0];
    if (raw === undefined || !Number.isFinite(raw)) return;
    emit("valueCommit", clamp(raw, props.min, props.max));
}

/**
 * The chassis's own half of the `disabled` contract. `disabled` reaches the
 * control through the split above, but the inline numeric input is this
 * wrapper's addition and the producer knows nothing about it — so without this
 * a disabled slider still had a live number field beside it, which is the
 * disabled state lying.
 */
const isDisabled = computed(() => attrs.disabled === "" || attrs.disabled === true);

const displayValue = computed(() =>
    props.formatValue ? props.formatValue(props.modelValue) : String(props.modelValue),
);
const isNumericDisplay = computed(() => !Number.isNaN(Number(displayValue.value)));

/** The field's id: the row's visible `Label` names it (`for`). */
const fieldId = useId();

/**
 * The fill's extent, 0…1 — read by the track token in the stylesheet (see the
 * docblock: the composition over `spectrum` until BL ships thumb + fill).
 */
const fillFraction = computed(() => {
    const span = props.max - props.min;
    return span > 0 ? (clamp(props.modelValue, props.min, props.max) - props.min) / span : 0;
});
</script>

<template>
    <div class="control-row" data-control-row v-bind="chassisAttrs">
        <div class="control-row-line">
            <Label :for="fieldId" class="control-row-label" data-row-label :disabled="isDisabled">
                {{ label }}
            </Label>
            <span v-if="token" class="control-row-token fira-code" aria-hidden="true">{{ token }}</span>
            <span v-if="subtitle" class="control-row-sub" data-row-sub :title="subtitle">{{ subtitle }}</span>
            <span class="control-row-value">
                <NumberField
                    :model-value="isNumericDisplay ? modelValue : null"
                    :min="min"
                    :max="max"
                    :step="step"
                    :format-options="numberFormat"
                    :disabled="isDisabled"
                    size="sm"
                    class="control-row-field"
                    @update:model-value="onNumber"
                >
                    <NumberFieldInput
                        :id="fieldId"
                        class="fira-code"
                        :aria-label="label"
                        :placeholder="isNumericDisplay ? undefined : displayValue"
                    />
                </NumberField>
                <span v-if="unit" class="control-row-unit fira-code">{{ unit }}</span>
            </span>
        </div>
        <Slider
            v-model="sliderModel"
            variant="spectrum"
            size="md"
            :min="min"
            :max="max"
            :step="step"
            :aria-label="label"
            class="control-row-track"
            :style="{ '--track-color': color, '--row-fill': fillFraction }"
            v-bind="controlAttrs"
            @value-commit="onValueCommit"
        />
    </div>
</template>

<style scoped>
/*
   X.F.W14.h — the idiom's geometry, on glass's scales only:
   · rhythm: `--space-atom` between the two lines and between the line's parts;
   · type: the label on `--type-small`, the subtitle and unit on `--type-caption`,
     the token on `--type-micro`;
   · the field keeps the producer's `sm` rung; only its measure is ours.
*/
.control-row {
    display: flex;
    flex-direction: column;
    gap: var(--space-atom);
    min-width: 0;
}

.control-row-line {
    display: flex;
    align-items: center;
    gap: var(--space-atom);
    min-width: 0;
}

.control-row-label {
    flex: none;
    font-size: var(--type-small);
    line-height: var(--type-leading-small);
    font-weight: 500;
    color: var(--foreground);
    white-space: nowrap;
}

.control-row-token {
    flex: none;
    font-size: var(--type-micro);
    color: var(--muted-foreground);
}

.control-row-sub {
    flex: 0 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--type-caption);
    color: var(--muted-foreground);
}

.control-row-value {
    display: inline-flex;
    align-items: center;
    gap: var(--space-atom);
    margin-inline-start: auto;
    flex: none;
}

.control-row-field {
    width: 4.5rem;
}

.control-row-unit {
    font-size: var(--type-caption);
    color: var(--muted-foreground);
}

/*
   The fill, composed over the producer's documented track token (see the
   docblock; routed to BL). The stop sits at the thumb's centre under reka's
   `contain` alignment: half a thumb in at the minimum, half a thumb short of the
   end at the maximum. `--slider-thumb-size` is the producer's own size-rung
   token on this same element; the `spectrum` thumb is 0.75 of it wide.
   `D-14`: an empty `color` falls back to the producer's capsule tint.
*/
.control-row-track {
    --row-thumb: calc(var(--slider-thumb-size, 1rem) * 0.75);
    --row-stop: calc(var(--row-thumb) / 2 + (100% - var(--row-thumb)) * var(--row-fill, 0));
    --glass-slider-track-background: linear-gradient(
        to right,
        var(--track-color, var(--glass-capsule-warm)) 0 var(--row-stop),
        var(--muted-medium) var(--row-stop) 100%
    );
}
</style>
