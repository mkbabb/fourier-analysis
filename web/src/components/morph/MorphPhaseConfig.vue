<template>
    <div
        class="cartoon-card config-card"
        role="group"
        :aria-labelledby="titleId"
        :style="{ '--track-color': sliderColor ?? 'var(--accent-red)' }"
    >
        <h3 class="config-card-title" :id="titleId">{{ title }}</h3>
        <p class="config-card-desc">{{ description }}</p>

        <!-- SP-7 · FMD-14 ⊕ FMD-15 — this card is mounted THREE times (Settle
             Out / Morph / Settle In) and every control inside it carried the
             same name as its two twins, or no name at all:

              · FMD-14 — the `<label>` elements have no `for`, no wrapping and
                no `aria-*`, so they named nothing. `for`/`id` is the cure, and
                the ids are `useId()`-derived precisely because there are three
                instances: a literal id would collide three ways and hand every
                label to the first card.
              · FMD-15 — `aria-label="Duration (ms)"` was hard-coded, so all
                three sliders announced one byte-identical name and a
                screen-reader user could not tell which phase they were
                dragging. The name now carries the card's own `title`, which is
                the only thing that distinguishes the three instances.
              · FMD-15's second leg — the card was a bare `<div>` with no
                grouping semantics, so the three fieldsets read as one flat run
                of six controls. `role="group"` + `aria-labelledby` on the title
                gives each card its own boundary and its own name.

             ⊘ The `MPC-*` rows F.W4 named here and did not take — `MPC-31`'s ONE
             CUT and the `--track-color` writer that fed a dead retint block —
             are LANDED at X.F.W3 `.a`, in this file's share of that one cut.
             The writer is hoisted to the card root above, because `MPC-22`'s
             focus tint has to read the same colour the slider does and a
             per-element binding could not reach it. -->
        <div class="config-field">
            <div class="duration-row">
                <label class="config-label" :for="durationId">Duration</label>
                <div class="input-with-unit">
                    <NumberField
                        :model-value="duration"
                        :min="50"
                        :max="800"
                        :step="10"
                        :format-options="{ maximumFractionDigits: 0, useGrouping: false }"
                        size="sm"
                        class="num-field"
                        @update:model-value="emitDuration"
                    >
                        <NumberFieldInput :id="durationId" />
                    </NumberField>
                    <span class="input-unit fira-code">ms</span>
                </div>
                <!--
                    `MPC-8` — this card boots AT the domain floor (`morphMs`
                    defaults to 50 = `min`), so the range had zero extent, the
                    scrubber's thumb is invisible by contract, and the control
                    read as an empty grey capsule with no position indicator at
                    all. `MPC-31` makes that the WITNESSABILITY PRECONDITION for
                    the colour cure landing beside it: a fill nobody can see is a
                    fill nobody can grade.

                    The row offers two cures and this takes the second. Marks
                    give the capsule a scale, and the boot state a checkpoint the
                    thumb sits on; re-domaining was refused because the numeric
                    input beside it still accepts the whole 50–800 band, so
                    narrowing the track would silently make reachable durations
                    unreachable by drag — a capability change no row grants.
                -->
                <Slider
                    v-model="durationModel"
                    :min="50"
                    :max="800"
                    :step="10"
                    :marks="DURATION_MARKS"
                    :aria-label="`${title} duration (ms)`"
                    class="duration-slider-track"
                />
            </div>
        </div>

        <div class="config-field">
            <label class="config-label" :id="easingLabelId">Easing</label>
            <Select :model-value="easing" @update:model-value="$emit('update:easing', String($event))">
                <!--
                    The trigger names the selection ITSELF rather than through
                    `<SelectValue />`, and that is forced by a producer contract
                    two layers down: reka's `SelectItemText` publishes the
                    selected option's `textContent` as the displayed value
                    (`SelectItemText.vue` → `onOptionAdd({ textContent })`), and
                    `<EasingCurve>` draws its "0"/"1" axis captions as HTML
                    spans INSIDE the plot. Embed the plot in an option and the
                    trigger reads "01 Ease In-Out" — measured at this seat before
                    this cure. `text-value` on the item repairs TYPEAHEAD (reka
                    reads the prop in preference to the node's text) but not the
                    display, which never consults it. The label is known here, so
                    it is written here; the producer-side row — captions as
                    `aria-hidden` HTML text rather than SVG `<text>`, or a
                    caption opt-out — rides the SS-6 relay, never a local hack.
                -->
                <SelectTrigger class="w-full" :aria-labelledby="`${easingLabelId} ${titleId}`">
                    <span class="truncate">{{ presets[easing]?.label ?? easing }}</span>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem
                        v-for="name in easingNames"
                        :key="name"
                        :value="name"
                        :text-value="presets[name].label"
                    >
                        <!--
                            `fr-EasingCurvePreview FORK` ⊕ `MPC-17` ⊕ `MPC-23`
                            (X.F.W3 `.b`, ROUTE 1) — the fifth fork's inline
                            40×20 sampler is GONE. This row previously baked its
                            own box (`x = 2 + t*36`, `y = 18 - v*16`), which is
                            a 2.25× anisotropy applied to a curve whose whole
                            meaning is its slope; the producer's `<EasingCurve>`
                            is a constant SQUARE frame, so the anisotropy dies
                            by construction rather than by re-tuning.

                            The curve is DECORATIVE here and says so: the option
                            row carries its own visible text name, so an
                            announced `role="img"` beside it would be the same
                            name twice. `aria-hidden` on the plot wrapper, not
                            `opacity`/`pointer-events` — those remove nothing
                            from the a11y tree (rK-21).
                        -->
                        <span class="flex items-center gap-2">
                            <EasingCurve
                                :strokes="[{ d: easingCurvePath(name) }]"
                                class="w-5 shrink-0"
                                aria-hidden="true"
                            />
                            {{ presets[name].label }}
                        </span>
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";
import { EasingCurve } from "@mkbabb/glass-ui/easing";
import { NumberField, NumberFieldInput } from "@mkbabb/glass-ui/number-field";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
} from "@mkbabb/glass-ui/select";
import { Slider } from "@mkbabb/glass-ui/slider";
import {
    EASING_PRESETS,
    EASING_PRESET_NAMES,
    easingCurvePath,
} from "@/composables/useMorphConfig";

const props = defineProps<{
    title: string;
    description: string;
    duration: number;
    easing: string;
    sliderColor?: string;
}>();

/* FMD-14 ⊕ FMD-15 — this card mounts three times, so every id must be
   instance-unique or the three copies collide and the first one wins. */
const titleId = useId();
const durationId = useId();
const easingLabelId = useId();

const emit = defineEmits<{
    "update:duration": [value: number];
    "update:easing": [value: string];
}>();

/* X.F.W12 `.a` — R-e-1: the producer's `NumberField` commits a number (a
   cleared field commits `NaN`, folded to the floor by `|| 50` as the text
   path's `Number("")` was); the clamp stays the range authority. */
function emitDuration(raw: number) {
    const v = Math.max(50, Math.min(800, Math.round(raw || 50)));
    emit("update:duration", v);
}

/**
 * `MPC-8` — the decorative checkpoints, a doubling ladder across the domain.
 * They never snap the value (the producer's own contract); they give the
 * 89 % of the track that nothing normally reaches a legible SCALE instead of
 * an empty extent, and they put a checkpoint under the boot position.
 */
const DURATION_MARKS = [50, 100, 200, 400, 800] as const;

/* A.W2.c — adapt the scalar `duration` to the slider's array model. */
const durationModel = computed<number[]>({
    get: () => [props.duration],
    set: (arr) => emitDuration(arr[0] ?? 50),
});

const presets = EASING_PRESETS;
const easingNames = EASING_PRESET_NAMES;
</script>

<style scoped>
@reference "tailwindcss";
.config-card {
    padding: 0.75rem;
}

@media (min-width: 640px) {
    .config-card {
        padding: 1rem 1.25rem;
    }
}

.config-card-title {
    font-family: var(--font-serif);
    @apply text-lg;
    font-weight: 400;
    color: var(--foreground);
    margin-bottom: 0.125rem;
}

.config-card-desc {
    @apply text-sm;
    color: var(--muted-foreground);
    margin-bottom: 0.875rem;
}

.config-field {
    margin-bottom: 0.75rem;
}

.config-field:last-child {
    margin-bottom: 0;
}

.duration-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.config-label {
    display: block;
    @apply text-base;
    font-weight: 500;
    color: var(--muted-foreground);
    margin-bottom: 0.375rem;
}

.duration-row .config-label {
    margin-bottom: 0;
    white-space: nowrap;
}

.input-with-unit {
    display: flex;
    align-items: center;
    gap: 0.125rem;
}

/* X.F.W11 `.e` — R-d-1 (COHESION §0aq, ESC-F11d-1): the duration field's
   local chrome retired onto the producer's surface — the 15% boundary, the
   radius, the fill, `outline: none`, the border-only transition, the
   spin-button suppression and `MPC-22`'s per-card focus tint.
   X.F.W12 `.a` — R-e-1 (COHESION §0as): that move went onto the text-shaped
   `Input` and lost keyboard stepping; the field now rides the producer's
   `NumberField` (`@mkbabb/glass-ui/number-field`), which owns the spinbutton
   role, ArrowUp/ArrowDown by `:step`, the clamp, the mono tabular numerals
   and the `field-control` boundary/focus ring. What stays is layout only:
   the measure beside its `ms` unit. */
.num-field {
    width: 3.5rem;
}

.input-unit {
    @apply text-sm;
    color: var(--muted-foreground);
}

/*
   `MPC-3` (fold → `B-2` / `FMD-3`) amended by `MPC-10` — the per-instance
   retint, landed on the producer's real knob at full strength. The four
   declarations this replaces wrote a namespace the producer defines nowhere, so
   all three cards painted the same stock capsule and the red/pink/red phase
   coding delivered zero pixels.

   `MPC-13`'s vocabulary leg rides here as the row requires — WITH the token
   cure, never before: the `glass-scrubber` spelling this file carried in two
   comments is two majors dead (the variants are `"scrubber" | "spectrum"`, and
   `scrubber` is the default this Slider already takes), and it is gone from the
   file rather than re-spelled.
*/
.duration-slider-track {
    flex: 1;
    --slider-range-bg: var(--track-color, var(--accent-red));
}
</style>
