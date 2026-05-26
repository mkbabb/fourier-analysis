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
                @update:low-level="morphConfig.config.lowLevel = $event"
                @update:high-level="morphConfig.config.highLevel = $event"
                @select="handlePreviewClick"
            />

            <!-- Export / Reset -->
            <div class="export-row">
                <Button variant="default" size="default" class="btn-export" @click="morphConfig.copyToClipboard()">
                    <component :is="morphConfig.copied.value ? Check : ClipboardCopy" class="btn-icon" />
                    {{ morphConfig.copied.value ? 'Copied' : 'Export' }}
                </Button>
                <Button variant="outline" size="default" class="btn-reset" @click="handleReset">
                    <RotateCcw class="btn-icon" />
                    Reset
                </Button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Button } from "@mkbabb/glass-ui";
import { ClipboardCopy, Check, RotateCcw } from "lucide-vue-next";
import MorphShapePreview from "@/components/morph/MorphShapePreview.vue";
import MorphPhaseConfig from "@/components/morph/MorphPhaseConfig.vue";
import HarmonicLevelGrid from "@/components/morph/HarmonicLevelGrid.vue";
import { useFourierMorph } from "@/composables/useFourierMorph";
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
const morphConfig = useMorphConfig();
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

    await morph.morphTo(from, to);
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

.btn-icon {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
}

.btn-export {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    border: 0;
    background: var(--foreground);
    color: var(--background);
    font-family: var(--font-mono);
    @apply text-base;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.15s ease, opacity 0.15s ease;
}

.btn-export:hover {
    opacity: 0.85;
}

.btn-export:active {
    transform: scale(0.97);
}

.btn-reset {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    border: 2px solid color-mix(in srgb, var(--foreground) 15%, transparent);
    background: none;
    color: var(--muted-foreground);
    font-family: var(--font-mono);
    @apply text-base;
    font-weight: 500;
    cursor: pointer;
    transition: border-color 0.15s ease, color 0.15s ease;
}

.btn-reset:hover {
    border-color: color-mix(in srgb, var(--foreground) 30%, transparent);
    color: var(--foreground);
}
</style>
