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
        <div class="demo-stage">
            <div class="stage-row">
                <button class="morph-button cartoon-card" @click="handleToggle" :disabled="isAnimating">
                    <FourierMorphSvg
                        :path="morph.currentPath.value"
                        :stroke-width="4.5"
                        view-box="0 0 200 200"
                    />
                </button>

                <!-- Desktop: info chips stacked beside button -->
                <div class="demo-info desktop-info">
                    <div class="info-chip" :class="morph.phase.value">
                        {{ morph.phase.value }}
                    </div>
                    <div class="info-chip">
                        n={{ Math.round(morph.harmonicLevel.value) }}
                    </div>
                    <div class="info-chip">
                        {{ currentShapeName }}
                    </div>
                    <div class="info-chip">
                        {{ morphConfig.totalMs.value }}ms
                    </div>
                </div>
            </div>

            <!-- Mobile: info chips inline below button -->
            <div class="demo-info mobile-info">
                <div class="info-chip" :class="morph.phase.value">
                    {{ morph.phase.value }}
                </div>
                <div class="info-chip">
                    n={{ Math.round(morph.harmonicLevel.value) }}
                </div>
                <div class="info-chip">
                    {{ currentShapeName }}
                </div>
                <div class="info-chip">
                    {{ morphConfig.totalMs.value }}ms
                </div>
            </div>
        </div>

        <!-- ── Controls section ────────────────────────────────── -->
        <div class="controls-section">
            <!-- Phase config cards -->
            <div class="config-grid">
                <MorphPhaseConfig
                    title="Settle Out"
                    description="Shape degrades to low harmonics"
                    :duration="morphConfig.config.settleOutMs"
                    :easing="morphConfig.config.settleOutEasing"
                    slider-color="hsl(var(--accent-red))"
                    @update:duration="morphConfig.config.settleOutMs = $event"
                    @update:easing="morphConfig.config.settleOutEasing = $event"
                />

                <MorphPhaseConfig
                    title="Morph"
                    description="Cross-fade at low harmonics"
                    :duration="morphConfig.config.morphMs"
                    :easing="morphConfig.config.morphEasing"
                    slider-color="hsl(var(--accent-pink))"
                    @update:duration="morphConfig.config.morphMs = $event"
                    @update:easing="morphConfig.config.morphEasing = $event"
                />

                <MorphPhaseConfig
                    title="Settle In"
                    description="Resolves to full fidelity"
                    :duration="morphConfig.config.settleInMs"
                    :easing="morphConfig.config.settleInEasing"
                    slider-color="hsl(var(--accent-red))"
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
                <button class="btn-export" @click="morphConfig.copyToClipboard()">
                    <component :is="morphConfig.copied.value ? Check : ClipboardCopy" class="btn-icon" />
                    {{ morphConfig.copied.value ? 'Copied' : 'Export' }}
                </button>
                <button class="btn-reset" @click="handleReset">
                    <RotateCcw class="btn-icon" />
                    Reset
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ClipboardCopy, Check, RotateCcw } from "lucide-vue-next";
import FourierMorphSvg from "@/components/decorative/FourierMorphSvg.vue";
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
    font-size: 1.375rem;
    font-weight: 400;
    margin-bottom: 0.25rem;
    color: hsl(var(--foreground));
}

@media (min-width: 640px) {
    .demo-title {
        font-size: 2rem;
        margin-bottom: 0.5rem;
    }
}

.demo-subtitle {
    color: hsl(var(--muted-foreground));
    font-size: 0.8125rem;
    max-width: 36rem;
}

@media (min-width: 640px) {
    .demo-subtitle {
        font-size: 1rem;
        margin-bottom: 0;
    }
}

/* ── Preview stage ──────────────────────────── */

.demo-stage {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

@media (min-width: 640px) {
    .demo-stage {
        align-items: flex-start;
        margin-bottom: 2rem;
    }
}

.stage-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
}

.morph-button {
    width: 120px;
    height: 120px;
    cursor: pointer;
    padding: 0.625rem;
    flex-shrink: 0;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
}

@media (min-width: 640px) {
    .morph-button {
        width: 180px;
        height: 180px;
        padding: 1rem;
    }
}

.morph-button:hover:not(:disabled) {
    border-color: hsl(var(--accent-red));
    box-shadow: 0 0 0 3px hsl(var(--accent-red) / 0.15);
    transform: scale(1.02);
}

.morph-button:active:not(:disabled) {
    transform: scale(0.98);
}

.morph-button:disabled {
    cursor: wait;
}

/* ── Info chips ─────────────────────────────── */

.desktop-info {
    display: none;
}

.mobile-info {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    justify-content: center;
}

@media (min-width: 640px) {
    .desktop-info {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .mobile-info {
        display: none;
    }
}

.info-chip {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 500;
    padding: 0.1875rem 0.5rem;
    border-radius: 0.375rem;
    background: hsl(var(--muted) / 0.6);
    color: hsl(var(--foreground));
    white-space: nowrap;
}

@media (min-width: 640px) {
    .info-chip {
        font-size: 0.8rem;
        padding: 0.25rem 0.625rem;
    }
}

.info-chip.settle-out,
.info-chip.settle-in {
    background: hsl(var(--accent-red) / 0.12);
    color: hsl(var(--accent-red));
}

.info-chip.morph {
    background: hsl(var(--accent-pink) / 0.12);
    color: hsl(var(--accent-pink));
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
    background: hsl(var(--foreground));
    color: hsl(var(--background));
    font-family: var(--font-mono);
    font-size: 0.8125rem;
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
    border: 2px solid hsl(var(--foreground) / 0.15);
    background: none;
    color: hsl(var(--muted-foreground));
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: border-color 0.15s ease, color 0.15s ease;
}

.btn-reset:hover {
    border-color: hsl(var(--foreground) / 0.3);
    color: hsl(var(--foreground));
}
</style>
