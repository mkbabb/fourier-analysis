<template>
    <!-- X.F.W14V.au3 — A2-FO-L1-13: the plate is glass's Card (the local
         `.cartoon-card` stamp retires app-wide); the inset stays this card's
         family rhythm. The title rung is A2-FO-L1-12's, ESCALATED (ESC-au3-1:
         glass CardTitle's rung is off glass's own type scale). -->
    <Card class="levels-card">
        <h3 class="card-title" data-card-title>Harmonic Levels</h3>

        <div class="levels-controls">
            <SliderControl
                label="Low"
                :model-value="lowLevel"
                :min="1"
                :max="highLevel - 1"
                :step="1"
                color="var(--viz-fourier)"
                aria-label="Low harmonic level"
                @update:model-value="emitLow"
            />
            <SliderControl
                label="High"
                :model-value="highLevel"
                :min="lowLevel + 1"
                :max="maxLevel"
                :step="1"
                color="var(--viz-fourier)"
                aria-label="High harmonic level"
                @update:model-value="emitHigh"
            />
        </div>

        <!-- X.F.W14U.misc — UIA-F-210: the strip says where it continues (a
             fading edge on each side that has more), and a chosen tile is
             scrolled into view. UIA-F-208: mid-morph the tiles are disabled,
             not silently dropped. -->
        <div
            ref="stripRef"
            class="grid"
            :data-more-start="moreStart || undefined"
            :data-more-end="moreEnd || undefined"
            @scroll.passive="measureStrip"
        >
            <Button
                v-for="level in levels"
                :key="level"
                emphasis="secondary"
                class="grid-cell"
                :class="{
                    active: level === activeLevel,
                    'is-bound': level === lowLevel || level === highLevel,
                }"
                :disabled="disabled"
                @click="onSelect(level, $event)"
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
    </Card>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useResizeObserver } from "@vueuse/core";
import { Button } from "@mkbabb/glass-ui/button";
import { Card } from "@mkbabb/glass-ui/card";
import SliderControl from "@/components/ui/SliderControl.vue";
import {
    interpolateAtHarmonicLevel,
    pointsToSvgPath,
    type FourierShape,
} from "@/lib/svg-fourier";

const props = defineProps<{
    shape: FourierShape;
    levels: number[];
    activeLevel: number;
    lowLevel: number;
    highLevel: number;
    /**
     * FM-20 — the previewed asset's own ceiling. The `100` this component used
     * to hard-code at three sites (`max` attribute, slider `:max`, `emitHigh`'s
     * clamp) was a literal that no shipped shape could honour.
     */
    maxLevel: number;
    /** UIA-F-208: true while a morph runs; the tiles cannot act then. */
    disabled?: boolean;
}>();


const emit = defineEmits<{
    "update:lowLevel": [value: number];
    "update:highLevel": [value: number];
    select: [level: number];
}>();

/*
 * X.F.W14.h · OA-45 — the two bounds are the app's one control-row idiom
 * (`ui/SliderControl.vue`: label + value field on one line, the slider beneath;
 * the field's `for`/`id` pairing, HLG-8's cure, is the idiom's own). The clamps
 * stay here, the range authority; a cleared field commits `NaN`, folded to the
 * floor by `|| 1`.
 */
function emitLow(raw: number) {
    const v = Math.max(1, Math.min(props.highLevel - 1, raw || 1));
    emit("update:lowLevel", v);
}

function emitHigh(raw: number) {
    const v = Math.max(props.lowLevel + 1, Math.min(props.maxLevel, raw || 1));
    emit("update:highLevel", v);
}

/* X.F.W14U.misc — UIA-F-210: which edges of the strip hide tiles (the fading
   edge is painted only there), and a chosen tile is centred in the strip. */
const stripRef = ref<HTMLElement | null>(null);
const moreStart = ref(false);
const moreEnd = ref(false);

function measureStrip() {
    const el = stripRef.value;
    if (!el) return;
    moreStart.value = el.scrollLeft > 1;
    moreEnd.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
}

onMounted(measureStrip);
useResizeObserver(stripRef, measureStrip);
watch(() => props.levels, measureStrip, { flush: "post" });

function onSelect(level: number, event: MouseEvent) {
    (event.currentTarget as HTMLElement).scrollIntoView({ inline: "center", block: "nearest" });
    emit("select", level);
}


/**
 * X.F.W4 · SP-19 — FM-3 (= FMD-10) ⊕ FMD-N6: THE MEMO AND THE PRECISION, which
 * land together or not at all.
 *
 * `getPath` was a bare call inside a twelve-cell `v-for`, so every re-render —
 * every `activeLevel` crossing, every slider tick — rebuilt all twelve
 * 512-point paths from scratch: ~168 identical ~57 K-char rebuilds per toggle.
 * And the strings it rebuilt carried full float64 coordinates, 17 significant
 * digits per point, into a 48-or-64px box: ~667.6 KiB of `d`-attribute text
 * RESIDENT at all times on this route, ~10 cubic segments per rendered pixel.
 *
 * ⊘ CURE-COMPLETENESS (the spec's lock): the memo alone leaves the 667.6 KiB
 * resident — it only stops rebuilding it — and the precision alone leaves the
 * rebuild churn. Both, or the row is half-landed. The precision half lands in
 * `pointsToSvgPath` (2dp at emission — see there for why rounding the INPUT
 * points does not work), so BOTH halves of the lock are in this one commit;
 * `PathPreview.vue:39` is the in-tree precedent for the idiom.
 *
 * The cache is keyed on the shape identity as well as the level, because the
 * two shapes share a level table and a level-keyed cache would hand the moon
 * the sun's path.
 */
const pathCache = new Map<FourierShape, Map<number, string>>();

function getPath(level: number): string {
    let byLevel = pathCache.get(props.shape);
    if (!byLevel) {
        byLevel = new Map();
        pathCache.set(props.shape, byLevel);
    }
    const hit = byLevel.get(level);
    if (hit !== undefined) return hit;

    const points = interpolateAtHarmonicLevel(props.shape, level);
    const path = pointsToSvgPath(points);
    byLevel.set(level, path);
    return path;
}
</script>

<style scoped>
/* X.F.W14.h · OA-45 — the card on the app's one card hierarchy (the same
   rungs as MorphPhaseConfig): inset `--space-family`, the title on
   `--type-heading` serif 600 (glass `ConfiguratorLayer`'s section-header rung), the two control rows (`SliderControl`) spaced by
   `--space-body`. */
.levels-card {
    padding: var(--space-family);
    margin-bottom: 0;
}

@media (min-width: 640px) {
    .levels-card {
        margin-bottom: 1rem;
    }
}

.card-title {
    font-family: var(--font-serif);
    font-size: var(--type-heading);
    line-height: var(--type-leading-heading);
    font-weight: 600;
    color: var(--foreground);
    margin-bottom: var(--space-body);
}

.levels-controls {
    display: flex;
    flex-direction: column;
    gap: var(--space-body);
    margin-bottom: var(--space-family);
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
    /* UIA-F-210 ⊕ UIA-F-254: the fading edge, only on a side that hides tiles
       (no hard cut at the strip's end, and no feather where nothing continues). */
    --strip-fade: var(--space-family);
    --strip-fade-start: 0px;
    --strip-fade-end: 0px;
    mask-image: linear-gradient(
        to right,
        transparent,
        #000 var(--strip-fade-start),
        #000 calc(100% - var(--strip-fade-end)),
        transparent
    );
}

.grid[data-more-start] {
    --strip-fade-start: var(--strip-fade);
}

.grid[data-more-end] {
    --strip-fade-end: var(--strip-fade);
}

@media (prefers-reduced-motion: no-preference) {
    .grid {
        scroll-behavior: smooth;
    }
}

/* X.F.W4 / SP-6 · FMD-13 — the `.grid-cell` re-skin is DELETED down to the
   divergence the producer ships no variant for.

   Gone (the recipe owns them, in `@layer components`, and unlayered scoped CSS
   was silently beating it): `display` / `align-items` / `gap` / `padding` /
   the corner radius / `cursor` / the three-leg `transition` shorthand (HLG-6 —
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
    /* X.F.W14U.misc — UIA-F-254: a bound tile (a Low/High endpoint) wore the
       Legendre basis hue, a colour that says "Legendre" on a page with no
       Legendre in it. An endpoint is a neutral full-strength edge (the resting
       edge is a 50% mix), without the selection's red ring. */
    .grid-cell.is-bound:not(.active) {
        border-color: var(--foreground);
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

/* X.F.W14U.misc — UIA-F-57 (the morph remainder, `.shell` R-1): `text-sm` is
   a dead utility under glass's bridge (`--text-sm: initial`); the label takes
   the caption rung by name. */
.grid-label {
    font-family: var(--font-mono);
    font-size: var(--type-caption);
    line-height: var(--type-leading-caption);
    color: var(--muted-foreground);
    transition: color 0.15s;
}

.grid-label-active {
    color: var(--accent-red);
    font-weight: 600;
}

</style>
