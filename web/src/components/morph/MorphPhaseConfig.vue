<template>
    <!-- X.F.W14V.au3 — A2-FO-L1-13: the plate is glass's Card (the local
         `.cartoon-card` stamp retires app-wide); the inset stays this card's
         family rhythm. The title rung is A2-FO-L1-12's, ESCALATED (ESC-au3-1:
         glass CardTitle's rung is off glass's own type scale). -->
    <!-- FMD-15's group rides an inner host: glass Card binds its own `role`
         (`option` when selectable, else none), so a role passed to it is
         dropped. -->
    <Card surface="opaque" class="config-card" :style="{ '--track-color': sliderColor ?? 'var(--accent-red)' }">
    <div role="group" :aria-labelledby="titleId">
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
             fill). FMD-14's `for`/`id` pairing is the idiom's own; FMD-15's
             per-card slider name rides `aria-label`. X-DS pass 2 · DS-F2-C14:
             the unlabelled duration marks are dropped (three grey dots that
             gave no readable scale; the value field is the scale). -->
        <SliderControl
            class="config-field"
            label="Duration"
            unit="ms"
            :model-value="duration"
            :min="50"
            :max="800"
            :step="10"
            :color="sliderColor ?? 'var(--accent-red)'"
            :aria-label="`${title} duration (ms)`"
            @update:model-value="emitDuration"
        />

        <div class="config-field">
            <!-- X-DS DS-F5-C2: glass `Label`, the rung the Duration row's
                 label takes (SliderControl), so the card's two field labels
                 are one size. -->
            <Label :id="easingLabelId" class="config-label">Easing</Label>
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
    </Card>
</template>

<script setup lang="ts">
import { useId } from "vue";
import { EasingCurve } from "@mkbabb/glass-ui/easing";
import { Card } from "@mkbabb/glass-ui/card";
import { Label } from "@mkbabb/glass-ui/label";
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


const presets = EASING_PRESETS;
const easingNames = EASING_PRESET_NAMES;
</script>

<style scoped>
/*
   X.F.W14.h · OA-45 — the card's hierarchy on glass's scales (the same idiom as
   every control card in the app): the title on `--type-heading` serif 500 (the producer's own section-header rung, glass `ConfiguratorLayer`), the
   description on `--type-caption`, a field label on glass `Label`'s rung (the
   control row's label rung, DS-F5-C2); the inset and the rhythm on the spacing scale
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
    /* X-DS pass 14 · DS-F16-C1: one rung under the page title at every
       width. On --type-heading it met display-1's floor (1.618rem) at narrow
       widths, so the 500 card title outranked the 400 page title; the
       subheading rung is also the PRE-DOCK compact card voice. */
    font-size: var(--type-subheading);
    line-height: var(--type-leading-heading);
    /* X-DS DS-F4R-C3: the PRE-DOCK card voice, under the page's 400-weight
       display title (a 600 card title outweighed "Fourier Morph"). */
    font-weight: 500;
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
    margin-bottom: var(--space-atom);
}
</style>
