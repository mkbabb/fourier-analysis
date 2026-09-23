<template>
    <div
        class="cartoon-card config-card"
        role="group"
        :aria-labelledby="titleId"
        :style="{ '--track-color': sliderColor ?? 'var(--accent-red)' }"
    >
        <h3 class="config-card-title" :id="titleId" data-card-title>{{ title }}</h3>
        <p class="config-card-desc" data-card-subtitle>{{ description }}</p>

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
        <!-- X.F.W14.h · OA-45 — the duration row is the app's one control-row
             idiom (`ui/SliderControl.vue`): label, value field and unit on one
             line, the slider beneath with a visible thumb (so `MPC-8`'s boot
             state at the domain floor shows a position without relying on the
             fill), the marks still the scale. FMD-14's `for`/`id` pairing is the
             idiom's own; FMD-15's per-card slider name rides `aria-label`. -->
        <SliderControl
            class="config-field"
            label="Duration"
            unit="ms"
            :model-value="duration"
            :min="50"
            :max="800"
            :step="10"
            :marks="DURATION_MARKS"
            :color="sliderColor ?? 'var(--accent-red)'"
            :aria-label="`${title} duration (ms)`"
            @update:model-value="emitDuration"
        />

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
import { useId } from "vue";
import { EasingCurve } from "@mkbabb/glass-ui/easing";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
} from "@mkbabb/glass-ui/select";
import SliderControl from "@/components/ui/SliderControl.vue";
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


const presets = EASING_PRESETS;
const easingNames = EASING_PRESET_NAMES;
</script>

<style scoped>
/*
   X.F.W14.h · OA-45 — the card's hierarchy on glass's scales (the same idiom as
   every control card in the app): the title on `--type-heading` serif 600 (the producer's own section-header rung, glass `ConfiguratorLayer`), the
   description on `--type-caption`, a field label on `--type-small` (the control
   row's label rung); the inset and the rhythm on the spacing scale
   (`--space-family` / `--space-body` / `--space-atom`, each responsive at the
   producer). The `text-lg` / `text-sm` / `text-base` rungs retire: `text-sm`
   resolves to nothing under glass's theme bridge (`--text-sm: initial`), and
   the other two sat between the scale's rungs.
*/
.config-card {
    padding: var(--space-family);
}

.config-card-title {
    font-family: var(--font-serif);
    font-size: var(--type-heading);
    line-height: var(--type-leading-heading);
    font-weight: 600;
    color: var(--foreground);
    margin-bottom: var(--space-residue);
}

.config-card-desc {
    font-size: var(--type-caption);
    line-height: var(--type-leading-caption);
    color: var(--muted-foreground);
    margin-bottom: var(--space-body);
}

.config-field {
    margin-bottom: var(--space-body);
}

.config-field:last-child {
    margin-bottom: 0;
}

.config-label {
    display: block;
    font-size: var(--type-small);
    line-height: var(--type-leading-small);
    font-weight: 500;
    color: var(--foreground);
    margin-bottom: var(--space-atom);
}
</style>
