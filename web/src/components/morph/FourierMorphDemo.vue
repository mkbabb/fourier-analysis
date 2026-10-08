<template>
    <div class="demo-page">
        <!-- ── Header ──────────────────────────────────────────── -->
        <div class="demo-header">
            <h1 class="demo-title">Fourier Morph</h1>
            <p class="demo-subtitle">
                Tune the morph transition between sun and moon shapes.
            </p>
        </div>

        <!-- X.F.W14U.misc — UIA-F-115: the morph is the page's dominant
             content. At >=1024px the stage takes the wider column (about 55%)
             and stays in view while the controls beside it scroll; below, the
             stage band is sticky at the top of the scroller, so tuning a
             control never scrolls the thing it tunes away. UIA-F-254: Export
             and Reset sit under the stage they act on, at secondary weight. -->
        <div class="demo-layout">
            <section class="stage-column paper-texture" aria-label="Morph stage">
                <div class="band-grid paper-grid" aria-hidden="true" />
                <MorphShapePreview
                    :current-path="morph.currentPath.value"
                    :phase="morph.phase.value"
                    :harmonic-level="Math.round(morph.harmonicLevel.value)"
                    :shape-name="currentShapeName"
                    :total-ms="morphConfig.totalMs.value"
                    :disabled="isAnimating"
                    @toggle="handleToggle"
                />
                <div class="stage-actions">
                    <Button emphasis="secondary" size="sm" @click="morphConfig.copyToClipboard()">
                        <component :is="morphConfig.status.value === 'success' ? Check : ClipboardCopy" />
                        {{ morphConfig.status.value === 'success' ? 'Copied' : 'Export' }}
                    </Button>
                    <Button emphasis="quiet" size="sm" :disabled="isAnimating" @click="handleReset">
                        <RotateCcw />
                        Reset
                    </Button>
                </div>
            </section>

            <div class="controls-column">
                <MorphPhaseConfig
                    title="Settle Out"
                    description="Shape degrades to low harmonics"
                    :duration="morphConfig.config.settleOutMs"
                    :easing="morphConfig.config.settleOutEasing"
                    slider-color="var(--accent-red)"
                    @update:duration="morphConfig.config.settleOutMs = $event"
                    @update:easing="morphConfig.config.settleOutEasing = $event"
                />

                <MorphPhaseConfig
                    title="Morph"
                    description="Cross-fade at low harmonics"
                    :duration="morphConfig.config.morphMs"
                    :easing="morphConfig.config.morphEasing"
                    slider-color="var(--accent-pink)"
                    @update:duration="morphConfig.config.morphMs = $event"
                    @update:easing="morphConfig.config.morphEasing = $event"
                />

                <MorphPhaseConfig
                    title="Settle In"
                    description="Resolves to full fidelity"
                    :duration="morphConfig.config.settleInMs"
                    :easing="morphConfig.config.settleInEasing"
                    slider-color="var(--accent-red)"
                    @update:duration="morphConfig.config.settleInMs = $event"
                    @update:easing="morphConfig.config.settleInEasing = $event"
                />

                <!-- UIA-F-208: mid-morph the tiles are disabled (they were
                     silently dropped); UIA-F-210: a tile previews its level and
                     never rewrites the Low/High range. -->
                <HarmonicLevelGrid
                    :shape="currentShape"
                    :levels="morphConfig.previewLevels.value"
                    :active-level="nearestActiveLevel"
                    :low-level="morphConfig.config.lowLevel"
                    :high-level="morphConfig.config.highLevel"
                    :max-level="morphConfig.maxLevel.value"
                    :disabled="isAnimating"
                    @update:low-level="morphConfig.config.lowLevel = $event"
                    @update:high-level="morphConfig.config.highLevel = $event"
                    @select="handlePreviewClick"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { ClipboardCopy, Check, RotateCcw } from "@lucide/vue";
import MorphShapePreview from "@/components/morph/MorphShapePreview.vue";
import MorphPhaseConfig from "@/components/morph/MorphPhaseConfig.vue";
import HarmonicLevelGrid from "@/components/morph/HarmonicLevelGrid.vue";
import { useFourierMorph, DEFAULT_MORPH_CONFIG } from "@/composables/useFourierMorph";
import { useMorphConfig } from "@/composables/useMorphConfig";
import { prepareFourierShape, nearestLevel } from "@/lib/svg-fourier";

import sunData from "@/assets/fourier-paths/sun.json";
import moonData from "@/assets/fourier-paths/moon.json";

// ── Shapes ───────────────────────────────────────────────────────
const sunShape = prepareFourierShape(sunData as any);
const moonShape = prepareFourierShape(moonData as any);

const isMoon = ref(false);
const currentShapeName = computed(() => (isMoon.value ? "Moon" : "Sun"));
const currentShape = computed(() => (isMoon.value ? moonShape : sunShape));

// ── Config + morph composables ───────────────────────────────────
/* FM-20 — the source-of-truth shape is named HERE, at the only place that knows
   which shape the strip is previewing, rather than guessed inside the config. */
const shapeMaxLevel = computed(() => {
    const levels = currentShape.value.data.levels;
    return levels[levels.length - 1] ?? DEFAULT_MORPH_CONFIG.highLevel;
});
const morphConfig = useMorphConfig(undefined, shapeMaxLevel);
const morph = useFourierMorph({ config: { ...morphConfig.config } });

// Sync live config changes into the morph composable
morphConfig.syncWith(morph);

const isAnimating = computed(() => morph.phase.value !== "idle");

const nearestActiveLevel = computed(() =>
    nearestLevel(
        currentShape.value.data.levels,
        Math.round(morph.harmonicLevel.value),
    ),
);

// ── Handlers ─────────────────────────────────────────────────────
onMounted(() => {
    morph.setShape(sunShape);
});

async function handleToggle() {
    if (isAnimating.value) return;

    const from = isMoon.value ? moonShape : sunShape;
    const to = isMoon.value ? sunShape : moonShape;
    isMoon.value = !isMoon.value;

    try {
        await morph.morphTo(from, to);
    } catch (err) {
        /* FMD-9's consumer half — see DarkModeToggle for the reasoning. The
           shape state has already advanced, so the destination IS the truthful
           frame; the failure is reported, not swallowed. */
        morph.setShape(to);
        console.error("[FourierMorphDemo] morph engine unavailable; snapped to the destination shape", err);
    }
}

/* X.F.W14U.misc — UIA-F-210: a preview tile PREVIEWS. It used to snap the
   nearer of Low/High to the clicked level, silently rewriting the morph's
   range; the range is the two sliders' alone now. */
function handlePreviewClick(level: number) {
    if (isAnimating.value) return;
    morph.setLevel(currentShape.value, level);
}

function handleReset() {
    /* FMD-5 — Reset was UNGUARDED: pressed mid-morph it called `setShape`,
       whose `stopAnim` resolved the pending `play()` and so ADVANCED the very
       coroutine it meant to kill. The epoch token now makes that resumption a
       no-op, and the guard keeps the config from moving under a live morph in
       the first place. */
    if (isAnimating.value) return;
    morphConfig.reset();
    morph.setShape(currentShape.value);
}
</script>

<style scoped>
@reference "tailwindcss";
/* X.F.W14U.misc — UIA-F-254: `.demo-page` was its own scroll container
   (`overflow-x: hidden` computes `overflow-y: auto`), a second scroller with a
   rail mid-page inside `<main>`, the app's one scroller. `clip` keeps the
   horizontal guard without minting a scroll container, which is also what
   lets the stage stick to `<main>` (UIA-F-115). */
.demo-page {
    width: 100%;
    max-width: 72rem;
    min-width: 0;
    margin: 0 auto;
    /* X-DS pass 2 · DS-F2-C5: the side gutter is the app's `--page-gutter`
       at every width (the page sat on an 8 px gutter at 390, where the dock,
       /paper and /gallery hold 16 px). */
    padding: var(--space-body) var(--page-gutter) var(--space-section);
    font-family: var(--font-serif);
    overflow-x: clip;
    box-sizing: border-box;
}

/* ── Header ─────────────────────────────────── */

.demo-header {
    margin-bottom: var(--space-family);
}

/* X.F.W14.h · OA-45 — the page title and lede on glass's type scale
   (`--type-display-1`, fluid; `--type-body` for the lede). Below them every
   card title sits on `--type-heading` (MorphPhaseConfig, HarmonicLevelGrid). */
.demo-title {
    font-family: var(--font-serif);
    font-size: var(--type-display-1);
    line-height: var(--type-leading-display);
    font-weight: 400;
    margin-bottom: var(--space-atom);
    color: var(--foreground);
}

.demo-subtitle {
    color: var(--muted-foreground);
    font-size: var(--type-body);
    line-height: var(--type-leading-body);
    max-width: 36rem;
    /* X-DS pass 11 · DS-F13-C3: no orphan last word at 390 (as the /w lede). */
    text-wrap: pretty;
}

/* ── Layout (UIA-F-115) ─────────────────────── */

.demo-layout {
    display: flex;
    flex-direction: column;
    gap: var(--space-family);
}

/* Below 1024px the stage band sticks to the top of `<main>` on the page's own
   ground, so the controls scroll beneath it. X-DS DS-F-C6: that ground is the
   paper grid, not a flat --background slab. X-DS pass 4 · DS-F4-C2: the band
   carries the shell's layers exactly (App.vue): the page tone with the
   `.paper-texture` ground, and glass's `.paper-grid` as its own layer above
   it, both fixed to the viewport, so band and page are one tone and the lines
   run through unbroken. It spans the scroller's full inline size (out over
   `.demo-page`'s gutter), so nothing scrolling under it shows beside it.
   X-DS DS-F5-C4 (folds DS-F4-C2's hunk): it ends on one hairline, so content
   scrolls under a rule, not under a cut. */
.stage-column {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-atom);
    margin-inline: calc(-1 * var(--page-gutter));
    padding: var(--space-atom) var(--page-gutter);
    background-color: var(--background);
    background-attachment: fixed;
    border-block-end: 1px solid var(--border-soft);
}

.band-grid {
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background-attachment: fixed;
}

.controls-column {
    display: flex;
    flex-direction: column;
    gap: var(--space-body);
    min-width: 0;
}

@media (min-width: 1024px) {
    .demo-layout {
        display: grid;
        /* X-DS pass 2 · DS-F2-C4: the stage column is the plate's own
           measure and the cards take the rest; an 11fr column around a 26rem
           plate left ~200 px of dead grid before the cards. */
        grid-template-columns: 26rem minmax(0, 1fr);
        align-items: start;
    }

    /* X-DS DS-F-C6: the stage starts on the title's axis (one left edge); its
       plate, readouts and actions share the plate's measure (26rem, the
       MorphShapePreview bound). DS-F2-C4: the readouts and the actions both
       start on the plate's edge (one axis, as the title above). */
    .stage-column {
        top: var(--space-family);
        margin-inline: 0;
        padding: 0;
        align-items: start;
        background: none;
        border-block-end: 0;
    }

    .band-grid {
        display: none;
    }

    .stage-column > * {
        width: min(100%, 26rem);
    }
}

/* X-DS DS-F4R-C3: where the controls column has the measure for it (from
   1280 px it is ~43 rem, the page's 72 rem cap less the stage), the three
   phases sit side by side as PRE-DOCK set them, one row of peers, and the
   levels card spans the row beneath, so every phase is above the fold. */
@media (min-width: 1280px) {
    .controls-column {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    /* X-DS DS-F5-C3: three across, the peers' rows line up. A subtitle
       that wraps (Settle Out's) pushed that card's Duration and Easing rows
       ~19 px below its two peers'. Each subtitle holds two lines' room here,
       so every card's title, subtitle, field, slider and select sit on one
       baseline. (Shared subgrid rows were the first choice; glass Card's
       `contain: paint` makes a card an independent formatting context, so it
       cannot be a subgrid, and that containment is glass's.) */
    .controls-column :deep([data-card-subtitle]) {
        min-block-size: 2lh;
    }

    .controls-column > :last-child {
        grid-column: 1 / -1;
    }
}

/* X-DS DS-F5-C5: the actions start on the plate's edge at every width; in
   the phone band the plate now starts on the content box's edge (the row is
   bounded by it), so centred actions sat off the plate's axis. */
.stage-actions {
    display: flex;
    gap: var(--space-atom);
    justify-content: flex-start;
}
</style>
