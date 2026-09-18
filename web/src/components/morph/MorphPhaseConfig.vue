<template>
    <div class="cartoon-card config-card" role="group" :aria-labelledby="titleId">
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

             ⊘ NOT touched here: the `MPC-*` rows on this same file (the
             SelectTrigger's missing name, `MPC-31`'s ONE CUT, the `--track-color`
             writer feeding the dead `--slider-scrub-*` block). They belong to a
             different unit's sections while this path belongs to this unit's
             writable set — the seam is raised in this unit's addenda §4 rather
             than crossed. The three `button-name` findings axe reports on this
             route are those rows, and they are named, not silently left. -->
        <div class="config-field">
            <div class="duration-row">
                <label class="config-label" :for="durationId">Duration</label>
                <div class="input-with-unit">
                    <input
                        :id="durationId"
                        type="number"
                        :value="duration"
                        @change="emitDuration(($event.target as HTMLInputElement).value)"
                        min="50"
                        max="800"
                        step="10"
                        class="num-input fira-code tabular-nums"
                    />
                    <span class="input-unit fira-code">ms</span>
                </div>
                <Slider
                    v-model="durationModel"
                    :min="50"
                    :max="800"
                    :step="10"
                    :aria-label="`${title} duration (ms)`"
                    class="duration-slider-track"
                    :style="{ '--track-color': sliderColor ?? 'var(--accent-red)' }"
                />
            </div>
        </div>

        <div class="config-field">
            <label class="config-label" :id="easingLabelId">Easing</label>
            <Select :model-value="easing" @update:model-value="$emit('update:easing', String($event))">
                <SelectTrigger class="w-full" :aria-labelledby="`${easingLabelId} ${titleId}`">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem
                        v-for="name in easingNames"
                        :key="name"
                        :value="name"
                    >
                        <span class="flex items-center gap-2">
                            <svg class="easing-preview" viewBox="0 0 40 20">
                                <path
                                    :d="easingCurvePath(name)"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                />
                            </svg>
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
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
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

function emitDuration(raw: string) {
    const v = Math.max(50, Math.min(800, Math.round(Number(raw) || 50)));
    emit("update:duration", v);
}

/* A.W2.c — adapt the scalar `duration` to glass-scrubber's array model. */
const durationModel = computed<number[]>({
    get: () => [props.duration],
    set: (arr) => emitDuration(String(arr[0] ?? 50)),
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

.num-input {
    width: 3.5rem;
    padding: 0.125rem 0.375rem;
    border: 1.5px solid color-mix(in srgb, var(--foreground) 15%, transparent);
    border-radius: 0.375rem;
    background: var(--background);
    color: var(--foreground);
    @apply text-base;
    font-weight: 600;
    text-align: right;
    outline: none;
    transition: border-color 0.15s ease;
    -moz-appearance: textfield;
}

.num-input::-webkit-inner-spin-button,
.num-input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.num-input:focus {
    border-color: var(--accent-red);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-red) 12%, transparent);
}

.input-unit {
    @apply text-sm;
    color: var(--muted-foreground);
}

.easing-preview {
    width: 40px;
    height: 20px;
    flex-shrink: 0;
}

/* A.W2.c — glass-scrubber per-instance retint hook + flex stretch. */
.duration-slider-track {
    flex: 1;
    --slider-scrub-range-bg: color-mix(in srgb, var(--track-color) 30%, transparent);
    --slider-scrub-range-bg-hover: color-mix(in srgb, var(--track-color) 45%, transparent);
    --slider-scrub-thumb-bg: var(--track-color);
    --slider-scrub-thumb-bg-hover: var(--track-color);
}
</style>
