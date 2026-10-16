<template>
    <!-- X.F.W14V.au3 — A2-FO-L1-13: the plate is glass's Card (the local
         `.cartoon-card` stamp retires app-wide); the inset stays this card's
         family rhythm. The title rung is A2-FO-L1-12's, ESCALATED (ESC-au3-1:
         glass CardTitle's rung is off glass's own type scale). -->
    <Card surface="opaque" class="levels-card">
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

        <!-- X-DS pass 9 · DS-F9X-C2 ⊕ C3: the levels lie in two even rows at
             every width, so the whole range the card names (both bounds among
             it) is in view; there is no scroller, so no fading edge.
             UIA-F-208: mid-morph the tiles are disabled, not silently dropped. -->
        <div
            class="grid"
            :style="{ '--levels-per-row': Math.ceil(levels.length / 2) }"
        >
            <Button
                v-for="level in levels"
                :key="level"
                emphasis="quiet"
                class="grid-cell"
                :class="{
                    active: level === activeLevel,
                    'is-bound': level === lowLevel || level === highLevel,
                }"
                :disabled="disabled"
                @click="onSelect(level)"
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
                <span class="grid-label">
                    n={{ level }}
                </span>
            </Button>
        </div>
    </Card>
</template>

<script setup lang="ts">
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

function onSelect(level: number) {
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
   `--type-heading` serif 500 (glass `ConfiguratorLayer`'s section-header rung), the two control rows (`SliderControl`) spaced by
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
    /* X-DS pass 14 · DS-F16-C1: the phase cards' rung (MorphPhaseConfig). */
    font-size: var(--type-subheading);
    line-height: var(--type-leading-heading);
    /* X-DS DS-F4R-C3: the card voice, under the page's display title. */
    font-weight: 500;
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

/* X-DS pass 9 · DS-F9X-C2 ⊕ DS-F9X-C3: one grid at every width and pointer.
   The column count follows the level count (`--levels-per-row`, half of it
   rounded up, set on the element), so the levels lie in two even rows. Pass 8
   (DS-F8X-C1) wrapped them only at a fine pointer, with `auto-fill`, which
   took its count from the strip's width (6 + 4 at 1440, a two-cell hole after
   the High tile); the phone and coarse pointers kept a scroller whose 118 px
   tiles left 2 of 10 whole and both bounds out of view. The scroller, its
   fading edges (UIA-F-210), its snap and its scroll-into-view are deleted:
   nothing is hidden, so nothing has to say it continues. */
.grid {
    display: grid;
    grid-template-columns: repeat(var(--levels-per-row), minmax(0, 1fr));
    gap: 0.5rem;
}

/* X.F.W4 / SP-6 · FMD-13 — the `.grid-cell` re-skin is DELETED down to the
   divergence the producer ships no variant for.

   Gone (the recipe owns them, in `@layer components`, and unlayered scoped CSS
   was silently beating it): `display` / `align-items` / `gap` / `padding` /
   the corner radius / `cursor` / the three-leg `transition` shorthand (HLG-6 —
   it truncated the producer's six-leg tokenised list) / `background`
   (it replaced the `glass-capsule` plate `emphasis="secondary"` selects).
   Kept, and LAYERED: the column stack (shape over label). The no-shrink and
   the snap went with the scroller (X-DS pass 9 · DS-F9X-C3).

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
/* X-DS pass 7 · DS-F9-C1 — the tile is `emphasis="quiet"`: its own 1.5px
   border and `--card` fill define it, so it takes no capsule cast or bevel
   (the strip's block-axis clip cut seven casts into one hard band). Hover is
   the border tone step alone; the scale(1.04) lift carried no state. */
@layer glass-overrides {
    .grid-cell {
        flex-direction: column;
        /* DS-F5-C3: the label clears the tile's foot by a block pad (the
           recipe's block padding is 0, so "n=1" sat ~1 px off the border),
           and the tile is never wider than tall: on the coarse ramp the
           recipe's wider inline pad made a 118 x 94 capsule at 390. The
           automatic minimum (in place of the recipe's control-height floor)
           lets the content hold the tile open where it is the taller side. */
        padding-block: var(--space-atom);
        /* DS-F9X-C3: the tile's content is the shape, so it takes the same
           atom pad inline as on its block axis; the coarse recipe's 26 px
           control pad is what held the phone tile at 118 px. */
        padding-inline: var(--space-atom);
        aspect-ratio: 1;
        min-block-size: auto;
        /* X-DS pass 10 · DS-F10X-C1: the tile's corner is the card radius at
           every pointer. The recipe derives its corner from the control height
           (`--button-size / 2`), which the coarse ramp grows to 30 px; on a
           60 px phone track that rounded the tile into a stadium. */
        border-radius: var(--radius-card);
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
    /* X-DS fourier pass 11 · DS-F11X-C2: the edge belongs to ONE state. The
       bound edge (full ink, `:not(.active)`) and the selection edge (red, with
       its ring) competed for the same property, so at rest the High bound
       (also the active tile) lost its bound mark and the Low bound read as a
       second, uncaptioned selection. Selection keeps the edge and its ring;
       the bounds are marked on the caption (below), which composes with it. */
    .grid-cell.active {
        border-color: var(--accent-red);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-red) 15%, transparent);
    }
}

/* X-DS fourier pass 5 · DS-F5-C3: one tile form at every width. The 48 px
   phone thumbnail sat in a button whose inline size does not shrink, so the
   tile fell to ~1.5:1 and the coarse radius rounded it into a pill; the
   64 px shape keeps the 1440 tile's near-square at 390 too. */
/* X-DS pass 9 · DS-F9X-C3: the shape fills its track up to that 64 px, so a
   phone's five columns (~60 px tracks) hold it whole. */
/* X-DS pass 10 · DS-F10X-C1: and to 65 % of the tile's content box, so the
   shape, the gap and the caption label fit inside the square (at 390 the
   full-track shape stood the tile 60 x 80; at 1024, 96 x 108). */
.grid-svg {
    inline-size: 100%;
    max-inline-size: min(64px, 65%);
    aspect-ratio: 1;
    block-size: auto;
    overflow: visible;
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

/* DS-F11X-C2: the bounds' mark — both of them, the active one included —
   is the caption at foreground ink and weight; the pair reads as a pair. */
.grid-cell.is-bound .grid-label {
    color: var(--foreground);
    font-weight: 600;
}

</style>
