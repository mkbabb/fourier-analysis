<template>
    <div class="cartoon-card levels-card">
        <h3 class="card-title">Harmonic Levels</h3>

        <div class="levels-controls">
            <div class="level-row">
                <label class="level-label">Low</label>
                <input
                    type="number"
                    :value="lowLevel"
                    @change="emitLow(($event.target as HTMLInputElement).value)"
                    min="1"
                    :max="highLevel - 1"
                    step="1"
                    class="level-input fira-code"
                />
                <Slider
                    v-model="lowModel"
                    :min="1"
                    :max="highLevel - 1"
                    :step="1"
                    aria-label="Low harmonic level"
                    class="level-slider-track"
                />
            </div>

            <div class="level-row">
                <label class="level-label">High</label>
                <input
                    type="number"
                    :value="highLevel"
                    @change="emitHigh(($event.target as HTMLInputElement).value)"
                    :min="lowLevel + 1"
                    max="100"
                    step="1"
                    class="level-input fira-code"
                />
                <Slider
                    v-model="highModel"
                    :min="lowLevel + 1"
                    :max="100"
                    :step="1"
                    aria-label="High harmonic level"
                    class="level-slider-track"
                />
            </div>
        </div>

        <div class="grid">
            <Button
                v-for="level in levels"
                :key="level"
                emphasis="secondary"
                class="grid-cell"
                :class="{
                    active: level === activeLevel,
                    'is-bound': level === lowLevel || level === highLevel,
                }"
                @click="$emit('select', level)"
            >
                <svg viewBox="0 0 200 200" class="grid-svg">
                    <path
                        :d="getPath(level)"
                        fill="none"
                        stroke="var(--accent-red)"
                        stroke-width="4"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
                <span
                    class="grid-label"
                    :class="{ 'grid-label-active': level === activeLevel }"
                >
                    n={{ level }}
                </span>
            </Button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { Slider } from "@mkbabb/glass-ui/slider";
import type { FourierShape } from "@/lib/svg-fourier";
import { interpolateAtHarmonicLevel, pointsToSvgPath } from "@/lib/svg-fourier";

const props = defineProps<{
    shape: FourierShape;
    levels: number[];
    activeLevel: number;
    lowLevel: number;
    highLevel: number;
}>();

const emit = defineEmits<{
    "update:lowLevel": [value: number];
    "update:highLevel": [value: number];
    select: [level: number];
}>();

function emitLow(raw: string) {
    const v = Math.max(1, Math.min(props.highLevel - 1, Number(raw) || 1));
    emit("update:lowLevel", v);
}

function emitHigh(raw: string) {
    const v = Math.max(props.lowLevel + 1, Math.min(100, Number(raw) || 1));
    emit("update:highLevel", v);
}

/* A.W2.c — adapt the scalar level bounds to glass-scrubber's array model. */
const lowModel = computed<number[]>({
    get: () => [props.lowLevel],
    set: (arr) => emitLow(String(arr[0] ?? 1)),
});
const highModel = computed<number[]>({
    get: () => [props.highLevel],
    set: (arr) => emitHigh(String(arr[0] ?? 1)),
});

function getPath(level: number): string {
    const points = interpolateAtHarmonicLevel(props.shape, level);
    return pointsToSvgPath(points);
}
</script>

<style scoped>
@reference "tailwindcss";
.levels-card {
    padding: 0.75rem;
    margin-bottom: 0;
}

@media (min-width: 640px) {
    .levels-card {
        padding: 1rem 1.25rem;
        margin-bottom: 1rem;
    }
}

.card-title {
    font-family: var(--font-serif);
    @apply text-lg;
    font-weight: 400;
    color: var(--foreground);
    margin-bottom: 0.75rem;
}

/* ── Level controls ──────────────────────────── */

.levels-controls {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
}

.level-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.level-label {
    @apply text-base;
    font-weight: 500;
    color: var(--muted-foreground);
    white-space: nowrap;
    min-width: 2.5rem;
}

.level-input {
    width: 3.5rem;
    padding: 0.125rem 0.375rem;
    /* SP-3 · HLG-37 — 15% over `--background` measured 1.361 L / 1.400 D
       (the banked figures, reproduced); 50% measures 3.322 L / 4.486 D. */
    border: 1.5px solid color-mix(in srgb, var(--foreground) 50%, transparent);
    border-radius: 0.375rem;
    background: var(--background);
    color: var(--foreground);
    @apply text-base;
    font-weight: 600;
    text-align: center;
    outline: none;
    flex-shrink: 0;
    /* SP-5 · HLG-40 — the focus indicator animated incoherently: this list
       carried `border-color` alone while `:focus` changes border-color AND
       box-shadow, so the ring popped in and out against an easing border. Both
       changed properties are listed, on the producer's own registers. */
    transition: border-color var(--duration-fast) var(--ease-standard),
        box-shadow var(--duration-fast) var(--ease-standard);
    -moz-appearance: textfield;
}

.level-input::-webkit-inner-spin-button,
.level-input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

/* SP-3 · FMD-18 ⊕ FMD-19 — the bound/focus blue is TOKENISED. `#60a5fa`
   measured 2.446:1 against the page (the banked 2.45, reproduced) and 2.354:1
   against `--card`, so it failed 1.4.11 in the light arm at both of its sites,
   while the byte-identical input in the sibling card focused on a conformant
   `var(--accent-red)`. `--viz-legendre` is this app's own blue-violet basis
   token and measures 5.541 L / 8.080 D against the page. */
.level-input:focus {
    border-color: var(--viz-legendre);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--viz-legendre) 20%, transparent);
}

/* X.F.W4 / SP-6 · HLG-3 ⊕ FMD-3 — the dead per-slider retint hook is DELETED.
   The four `--slider-scrub-*` declarations had ZERO readers at the adopted
   8.0.0 pin (⟨cmd⟩ `grep -roh -- '--slider-scrub[a-z-]*' dist | sort -u` → ∅),
   and this file's copy was dead a SECOND way the record could not see: the
   `:style="{'--track-color': …}"` binding that fed them was removed from this
   component before the uplift, so every operand resolved `var(--track-color)`
   → invalid-at-computed-value-time. Two sliders, zero tint delivered.
   ⊘ The sibling declarations at `MorphPhaseConfig.vue` and `SliderControl.vue`
   still have their `--track-color` writer and are NOT this unit's rows
   (`MPC-*` is `.c`'s section) — named in this unit's receipt, not touched. */
.level-slider-track {
    flex: 1;
}

/* ── Preview grid ────────────────────────────── */

.grid {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    overflow-y: hidden;
    /* FMD-18 — the top gutter. `overflow-y: hidden` plus a one-sided
       `padding-bottom` clipped this strip's own outward decorations (ring,
       lift, focus) at the TOP edge only. The gutter is two-sided now, so the
       affordances the cells paint are the affordances the user sees. */
    padding-top: 0.375rem;
    padding-bottom: 0.375rem;
    scrollbar-width: thin;
}

/* X.F.W4 / SP-6 · FMD-13 — the `.grid-cell` re-skin is DELETED down to the
   divergence the producer ships no variant for.

   Gone (the recipe owns them, in `@layer components`, and unlayered scoped CSS
   was silently beating it): `display` / `align-items` / `gap` / `padding` /
   `border-radius` / `cursor` / the three-leg `transition` shorthand (HLG-6 —
   it truncated the producer's six-leg tokenised list) / `background`
   (it replaced the `glass-capsule` plate `emphasis="secondary"` selects).
   Kept, and LAYERED: the column stack and the no-shrink, which is what makes a
   horizontally-scrolling strip of shape tiles out of a row of buttons.

   ⊘ TWO BANKED MECHANISMS DIED AT THE ADOPTED PIN — recorded, not smoothed.
   (i) `FMD-16`/`HLG-2` (*"`.grid-cell` keeps the recipe's fixed
   `h-(--control-h-md)` while stacking ~2× that in content"*) was measured at
   4.0.0. At 8.0.0 the recipe declares `min-block-size: var(--button-size)` — a
   FLOOR — and a fixed `block-size` only under `[data-icon-only]`, which these
   cells are not. There is no overflow to cure; the `--ui-scale` coarse-growth
   residue is real and is routed, not booked here.
   (ii) `HLG-7` (*"the state box-shadows replace `.focus-ring:focus-visible`'s
   entire focus paint"*) was measured against 4.0.0's `outline:none` + shadow
   recipe. At 8.0.0 the paint is `outline: var(--focus-ring-width) solid …;
   outline-offset: 2px` — a DIFFERENT property, so a `box-shadow` state cannot
   replace it and the ring survives both states. */
@layer glass-overrides {
    .grid-cell {
        flex-direction: column;
        flex-shrink: 0;
        /* SP-3 · HLG-37 — the control boundary, raised to the 1.4.11 floor.
           `--foreground` at 12% over `--card` measured 1.275 L / 1.395 D: the
           cell's entire boundary vocabulary was sub-3:1 in BOTH arms, which is
           what made a grid of twelve controls read as one undifferentiated
           strip. At 50% it measures 3.291 L / 3.984 D. (Re-derived from the
           token values; the 12% reading reproduces the banked 1.275/1.398 to
           the thousandth, which is what validates the model.) */
        border: 1.5px solid color-mix(in srgb, var(--foreground) 50%, transparent);
        /* ⊘ NOT cured here, and not smoothed: `--card` and `--background` are
           the SAME luminance in the light arm (1.000:1), so the cell's FILL
           carries no separation from the page whatever the consumer does. That
           is a producer palette fact, so it rides the SS-6 relay as a
           GLASS-RELAY ask and stays honestly RED in the pair registry — it is
           not re-minted here as a frontend hack. */
        background: var(--card);
    }

    /* SP-15 / DMT N-16 — ungated `:hover` latched on touch UAs after a tap and
       read as *selected* beside the real `.active` state. */
    @media (hover: hover) {
        .grid-cell:hover {
            border-color: color-mix(in srgb, var(--accent-red) 50%, transparent);
            transform: scale(1.04);
        }
    }

    .grid-cell:active {
        transform: scale(0.96);
    }

    /* FMD-18 — the state classes are ORDERED and SCOPED. `.is-bound` and
       `.active` are both (0,2,0); source order decided the paint, and the boot
       state (highLevel = 50) is always a bound tile, so the *selected* tile was
       overpainted by *bound* at every idle rest. `.active` is now declared last
       and `.is-bound` is qualified `:not(.active)`: the two states are
       independent facts and the selection is the one that wins. */
    .grid-cell.is-bound:not(.active) {
        border-color: var(--viz-legendre);
        box-shadow: 0 0 0 1.5px color-mix(in srgb, var(--viz-legendre) 25%, transparent);
    }

    .grid-cell.active {
        border-color: var(--accent-red);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-red) 15%, transparent);
    }
}

.grid-svg {
    width: 48px;
    height: 48px;
    overflow: visible;
}

@media (min-width: 640px) {
    .grid-svg {
        width: 64px;
        height: 64px;
    }
}

.grid-label {
    font-family: var(--font-mono);
    @apply text-sm;
    color: var(--muted-foreground);
    transition: color 0.15s;
}

.grid-label-active {
    color: var(--accent-red);
    font-weight: 600;
}

</style>
