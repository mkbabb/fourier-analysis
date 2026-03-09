<template>
    <div class="demo-page">
        <h1 class="demo-title">Fourier Morph Demo</h1>
        <p class="demo-subtitle">
            Tune the morph transition between sun and moon shapes. Click the
            shape or use the controls below.
        </p>

        <!-- ── Preview stage ──────────────────────────────────── -->
        <div class="demo-stage">
            <button class="morph-button cartoon-card" @click="handleToggle" :disabled="isAnimating">
                <FourierMorphSvg
                    :path="morph.currentPath.value"
                    :stroke-width="4.5"
                    view-box="0 0 200 200"
                />
            </button>

            <div class="demo-info">
                <div class="info-row">
                    <span class="info-label">Phase:</span>
                    <span class="info-value" :class="morph.phase.value">{{
                        morph.phase.value
                    }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Harmonics:</span>
                    <span class="info-value">{{
                        Math.round(morph.harmonicLevel.value)
                    }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Shape:</span>
                    <span class="info-value">{{ currentShapeName }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Total:</span>
                    <span class="info-value">{{ morphConfig.totalMs.value }}ms</span>
                </div>
            </div>
        </div>

        <!-- ── Phase config cards ─────────────────────────────── -->
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

        <!-- ── Harmonic level grid ────────────────────────────── -->
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

        <!-- ── Export / Reset ─────────────────────────────────── -->
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
        // Find the index of the clicked level, and of low/high in the grid.
        const idx = levels.indexOf(level);
        const lowIdx = levels.indexOf(lowLevel);
        const highIdx = levels.indexOf(highLevel);

        if (idx !== -1 && lowIdx !== -1 && highIdx !== -1) {
            const framesToLow = idx - lowIdx;
            const framesToHigh = highIdx - idx;
            // Tie goes to low
            if (framesToLow <= framesToHigh) {
                morphConfig.config.lowLevel = level;
            } else {
                morphConfig.config.highLevel = level;
            }
        } else {
            // Fallback: pure number distance, tie → low
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
    margin: 0 auto;
    padding: 2rem;
    padding-bottom: 4rem;
    font-family: var(--font-serif);
}

.demo-title {
    font-family: var(--font-serif);
    font-size: 2rem;
    font-weight: 400;
    margin-bottom: 0.5rem;
    color: hsl(var(--foreground));
}

.demo-subtitle {
    color: hsl(var(--muted-foreground));
    margin-bottom: 2rem;
    max-width: 36rem;
}

/* ── Preview stage ───────────────────────────── */

.demo-stage {
    display: flex;
    align-items: center;
    gap: 2rem;
    margin-bottom: 2rem;
}

.morph-button {
    width: 180px;
    height: 180px;
    cursor: pointer;
    padding: 1rem;
    flex-shrink: 0;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
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

.demo-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.info-row {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
}

.info-label {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: hsl(var(--muted-foreground));
    min-width: 6.5rem;
}

.info-value {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    font-weight: 600;
    color: hsl(var(--foreground));
}

.info-value.settle-out {
    color: hsl(var(--accent-red));
}
.info-value.morph {
    color: hsl(var(--accent-pink));
}
.info-value.settle-in {
    color: hsl(var(--accent-red));
}

/* ── Config grid ─────────────────────────────── */

.config-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 1rem;
}

@media (max-width: 768px) {
    .config-grid {
        grid-template-columns: 1fr;
    }
}

/* ── Export row ───────────────────────────────── */

.export-row {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
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
