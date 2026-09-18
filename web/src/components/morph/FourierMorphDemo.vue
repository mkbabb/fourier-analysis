<template>
    <div class="demo-page">
        <!-- ── Header ──────────────────────────────────────────── -->
        <div class="demo-header">
            <h1 class="demo-title">Fourier Morph</h1>
            <p class="demo-subtitle">
                Tune the morph transition between sun and moon shapes.
            </p>
        </div>

        <!-- ── Preview stage ──────────────────────────────────── -->
        <MorphShapePreview
            :current-path="morph.currentPath.value"
            :phase="morph.phase.value"
            :harmonic-level="Math.round(morph.harmonicLevel.value)"
            :shape-name="currentShapeName"
            :total-ms="morphConfig.totalMs.value"
            :disabled="isAnimating"
            @toggle="handleToggle"
        />

        <!-- ── Controls section ────────────────────────────────── -->
        <div class="controls-section">
            <!-- Phase config cards -->
            <div class="config-grid">
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
            </div>

            <!-- Harmonic level grid -->
            <HarmonicLevelGrid
                :shape="currentShape"
                :levels="morphConfig.previewLevels.value"
                :active-level="nearestActiveLevel"
                :low-level="morphConfig.config.lowLevel"
                :high-level="morphConfig.config.highLevel"
                :max-level="morphConfig.maxLevel.value"
                @update:low-level="morphConfig.config.lowLevel = $event"
                @update:high-level="morphConfig.config.highLevel = $event"
                @select="handlePreviewClick"
            />

            <!-- Export / Reset -->
            <div class="export-row">
                <Button emphasis="primary" @click="morphConfig.copyToClipboard()">
                    <component :is="morphConfig.status.value === 'success' ? Check : ClipboardCopy" />
                    {{ morphConfig.status.value === 'success' ? 'Copied' : 'Export' }}
                </Button>
                <Button emphasis="secondary" :disabled="isAnimating" @click="handleReset">
                    <RotateCcw />
                    Reset
                </Button>
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
import { useFourierMorph } from "@/composables/useFourierMorph";
import { useMorphConfig } from "@/composables/useMorphConfig";
import { DEFAULT_MORPH_CONFIG } from "@/composables/useFourierMorph";
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

function handlePreviewClick(level: number) {
    if (isAnimating.value) return;

    const { lowLevel, highLevel } = morphConfig.config;
    const levels = morphConfig.previewLevels.value;

    if (level < lowLevel) {
        morphConfig.config.lowLevel = level;
    } else if (level > highLevel) {
        morphConfig.config.highLevel = level;
    } else {
        // Snap based on grid frame adjacency, not pure number distance.
        const idx = levels.indexOf(level);
        const lowIdx = levels.indexOf(lowLevel);
        const highIdx = levels.indexOf(highLevel);

        if (idx !== -1 && lowIdx !== -1 && highIdx !== -1) {
            const framesToLow = idx - lowIdx;
            const framesToHigh = highIdx - idx;
            if (framesToLow <= framesToHigh) {
                morphConfig.config.lowLevel = level;
            } else {
                morphConfig.config.highLevel = level;
            }
        } else {
            const distToLow = level - lowLevel;
            const distToHigh = highLevel - level;
            if (distToLow <= distToHigh) {
                morphConfig.config.lowLevel = level;
            } else {
                morphConfig.config.highLevel = level;
            }
        }
    }

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
.demo-page {
    max-width: 960px;
    width: 100%;
    min-width: 0;
    margin: 0 auto;
    padding: 0.75rem;
    padding-bottom: 2rem;
    font-family: var(--font-serif);
    overflow-x: hidden;
    box-sizing: border-box;
}

@media (min-width: 640px) {
    .demo-page {
        padding: 2rem;
        padding-bottom: 4rem;
    }
}

/* ── Header ─────────────────────────────────── */

.demo-header {
    margin-bottom: 1rem;
}

@media (min-width: 640px) {
    .demo-header {
        margin-bottom: 2rem;
    }
}

.demo-title {
    font-family: var(--font-serif);
    @apply text-2xl;
    font-weight: 400;
    margin-bottom: 0.25rem;
    color: var(--foreground);
}

@media (min-width: 640px) {
    .demo-title {
        font-size: 2rem;
        margin-bottom: 0.5rem;
    }
}

.demo-subtitle {
    color: var(--muted-foreground);
    @apply text-base;
    max-width: 36rem;
}

@media (min-width: 640px) {
    .demo-subtitle {
        @apply text-lg;
        margin-bottom: 0;
    }
}

/* ── Controls section ───────────────────────── */

.controls-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

@media (min-width: 640px) {
    .controls-section {
        gap: 1rem;
    }
}

/* ── Config grid ────────────────────────────── */

.config-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.625rem;
}

@media (min-width: 640px) {
    .config-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
    }
}

/* ── Export row ──────────────────────────────── */

.export-row {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    padding-top: 0.5rem;
}

/* X.F.W4 / SP-6 · FMD-13 (⊕ FMD-28 ⊕ FMD-35) — the two Button re-skins are
   DELETED, not layered.

   `.btn-export` and `.btn-reset` restated, in unlayered scoped CSS, every
   declaration the producer's `.button` recipe already carries in
   `@layer components` — display / min-block-size (the coarse-pointer floor via
   `--control-h-md`) / align-items / justify-content / gap / padding-inline /
   border / border-radius / colour / font / font-size / font-weight / the
   six-leg tokenised transition — and then overrode the plate, so the emitted
   `data-emphasis="primary"`/`"secondary"` was a lie: it selected a recipe the
   consumer had already erased. `emphasis` now governs both controls, which is
   also what restores their press, hover and focus paint.

   `.btn-icon` pinned the lucide glyphs at a bare 15px against a button that
   obeys the coarse-pointer floor; the recipe's
   `.button > svg:not([class*="size-"]) { inline-size: var(--ui-glyph) }` owns
   glyph sizing and the class name does not opt out of it. Deleted; the class
   stays on the markup only where it is a hook, and here it was not. */
</style>
