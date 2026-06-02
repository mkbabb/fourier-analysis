<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { watchDebounced } from "@vueuse/core";
import { useWorkspaceStore } from "@/stores/workspace";
import { VIZ_COLORS } from "@/lib/colors";
import { CONTOUR_DEFAULTS } from "@/lib/defaults";
import { Button } from "@mkbabb/glass-ui/button";
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
} from "@mkbabb/glass-ui/collapsible";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@mkbabb/glass-ui/select";
import { ConfiguratorLayer, ConfiguratorRow } from "@mkbabb/glass-ui/configurator";
import { Wand2, ChevronRight, RotateCcw, RefreshCw } from "lucide-vue-next";
import { Tooltip } from "@/components/ui/tooltip";
import SliderControl from "@/components/ui/SliderControl.vue";

const advancedOpen = ref(false);

const props = defineProps<{
    nHarmonics: number;
    nPoints: number;
}>();

const store = useWorkspaceStore();

const strategy = ref(store.contourSettings?.strategy ?? CONTOUR_DEFAULTS.strategy);
const blurSigma = ref(store.contourSettings?.blur_sigma ?? CONTOUR_DEFAULTS.blur_sigma);
const minContourArea = ref(store.contourSettings?.min_contour_area ?? CONTOUR_DEFAULTS.min_contour_area);
const maxContours = ref<number>(store.contourSettings?.max_contours ?? CONTOUR_DEFAULTS.max_contours ?? 16);
const smoothContours = ref(store.contourSettings?.smooth_contours ?? CONTOUR_DEFAULTS.smooth_contours);

const mlThreshold = ref(store.contourSettings?.ml_threshold ?? CONTOUR_DEFAULTS.ml_threshold);

const strategyLabels: Record<string, string> = {
    auto: "Auto",
    threshold: "Otsu Threshold",
    multi_threshold: "Multi-threshold",
    canny: "Canny Edges",
    edge_aware: "Edge-aware",
    ml: "ML (Neural Net)",
};

const strategyDescriptions: Record<string, string> = {
    auto: "Automatically selects the best contour extraction method based on the image",
    threshold: "Otsu's method — optimal single-threshold binary segmentation",
    multi_threshold: "Multiple thresholds for complex images with many intensity levels",
    canny: "Edge detection — best for line drawings and high-contrast boundaries",
    edge_aware: "Hull + interior regions — captures facial features like eyes, nose, chin",
    ml: "U²-Net saliency model for subject isolation — best when subject blends with background",
};

const strategyLabel = computed(() => strategyLabels[strategy.value] ?? strategy.value);

const isDefault = computed(() =>
    strategy.value === CONTOUR_DEFAULTS.strategy
    && blurSigma.value === CONTOUR_DEFAULTS.blur_sigma
    && minContourArea.value === CONTOUR_DEFAULTS.min_contour_area
    && maxContours.value === (CONTOUR_DEFAULTS.max_contours ?? 16)
    && smoothContours.value === CONTOUR_DEFAULTS.smooth_contours
    && mlThreshold.value === CONTOUR_DEFAULTS.ml_threshold,
);

function resetDefaults() {
    strategy.value = CONTOUR_DEFAULTS.strategy;
    blurSigma.value = CONTOUR_DEFAULTS.blur_sigma;
    minContourArea.value = CONTOUR_DEFAULTS.min_contour_area;
    maxContours.value = CONTOUR_DEFAULTS.max_contours ?? 16;
    smoothContours.value = CONTOUR_DEFAULTS.smooth_contours;
    mlThreshold.value = CONTOUR_DEFAULTS.ml_threshold;
}

const shortError = computed(() => {
    const msg = store.error ?? "";
    if (msg.includes("503")) return "Server busy — try again";
    if (msg.includes("fetch")) return "Network error";
    return msg.length > 60 ? msg.slice(0, 60) + "…" : msg;
});

function currentComputeKey(): string {
    const maxContoursValue = maxContours.value === 0 ? null : maxContours.value;
    return JSON.stringify({
        imageSlug: store.imageSlug,
        strategy: strategy.value,
        blurSigma: blurSigma.value,
        minContourArea: minContourArea.value,
        maxContours: maxContoursValue,
        smoothContours: smoothContours.value,
        mlThreshold: mlThreshold.value,
        nHarmonics: props.nHarmonics,
        nPoints: props.nPoints,
    });
}

let suppressSettingsRecompute = true;
let lastComputedKey: string | null = null;

async function runCompute() {
    if (!store.imageMeta) return;

    store.beginCompute();
    store.error = null;

    try {
        // Update contour settings with ML params
        store.contourSettings = {
            ...store.contourSettings,
            strategy: strategy.value,
            blur_sigma: blurSigma.value,
            min_contour_area: minContourArea.value,
            max_contours: maxContours.value === 0 ? null : maxContours.value,
            smooth_contours: smoothContours.value as any,
            n_harmonics: props.nHarmonics,
            n_points: props.nPoints,
            ml_threshold: mlThreshold.value,
            ml_detail_threshold: mlThreshold.value * 0.6,
        };

        // Extract contour first, then compute in parallel
        await store.extractContour();

        await Promise.allSettled([
            store.computeEpicycles(),
            store.computeBases(),
        ]);

        lastComputedKey = currentComputeKey();
    } finally {
        store.endCompute();
    }
}

// Auto-compute on settings change (debounced 1s to reduce request volume)
watchDebounced(
    () => [strategy.value, blurSigma.value, minContourArea.value, maxContours.value, smoothContours.value, mlThreshold.value, props.nHarmonics, props.nPoints],
    () => {
        if (suppressSettingsRecompute || !store.imageMeta) return;
        const nextKey = currentComputeKey();
        if (nextKey === lastComputedKey) return;
        runCompute();
    },
    { debounce: 1000, immediate: false },
);

// Compute when imageMeta arrives (handles both initial mount and subsequent uploads)
watch(
    () => store.imageMeta,
    (meta) => {
        if (!meta) {
            suppressSettingsRecompute = true;
            lastComputedKey = null;
            return;
        }

        lastComputedKey = null;
        suppressSettingsRecompute = true;

        if (!store.epicycleData && !store.basesData && !store.computing) {
            runCompute();
        }
    },
    { immediate: true },
);

watch(
    () => store.imageSlug,
    () => {
        suppressSettingsRecompute = true;
        lastComputedKey = null;
    },
);

watch(
    () => [strategy.value, blurSigma.value, minContourArea.value, maxContours.value, smoothContours.value, mlThreshold.value, props.nHarmonics, props.nPoints, store.imageSlug],
    () => {
        queueMicrotask(() => {
            suppressSettingsRecompute = false;
        });
    },
);
</script>

<template>
    <ConfiguratorLayer label="Contour" sub="edge extraction settings" :default-open="false">
        <!-- Panel-wide reset: ConfiguratorLayer has no header-actions slot, so
             the affordance lives at the top of the layer body. -->
        <div class="flex items-center justify-end -mt-1 -mb-1">
            <Tooltip text="Reset to defaults">
                <Button
                    variant="ghost"
                    size="icon"
                    class="reset-icon-btn"
                    :class="{ 'is-default': isDefault }"
                    aria-label="Reset to defaults"
                    @click.stop="resetDefaults"
                >
                    <RotateCcw class="h-3.5 w-3.5" />
                </Button>
            </Tooltip>
        </div>

        <!-- Strategy -->
        <ConfiguratorRow label="Strategy">
            <Select v-model="strategy" class="w-full">
                <SelectTrigger aria-label="Contour extraction strategy" class="w-full h-10 text-sm border-2 border-foreground/15 rounded-lg">
                    <div class="inline-flex items-center gap-1.5">
                        <Wand2 v-if="strategy === 'auto'" class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {{ strategyLabel }}
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem v-for="(desc, key) in strategyDescriptions" :key="key" :value="key">
                        <div>
                            <div class="font-medium">{{ strategyLabels[key] }}</div>
                            <div class="text-xs text-muted-foreground max-w-[280px]">{{ desc }}</div>
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>
        </ConfiguratorRow>

        <!-- ML Threshold (visible for ml or auto) -->
        <Tooltip v-if="strategy === 'ml' || strategy === 'auto'" text="Saliency cutoff — lower values capture more background detail">
            <SliderControl
                v-model="mlThreshold"
                label="ML Threshold"
                :min="0.1"
                :max="0.9"
                :step="0.05"
                :color="VIZ_COLORS.amber"
                :format-value="(v: number) => v.toFixed(2)"
            />
        </Tooltip>

        <!-- Blur Sigma -->
        <Tooltip text="Soften before tracing — crank it up for furry subjects or noisy backgrounds">
            <SliderControl
                v-model="blurSigma"
                label="Blur Sigma"
                :min="0"
                :max="5"
                :step="0.1"
                :color="VIZ_COLORS.amber"
                :format-value="(v: number) => v.toFixed(1)"
            />
        </Tooltip>

        <!-- Advanced divider + collapsible -->
        <Collapsible v-model:open="advancedOpen">
            <div class="advanced-divider">
                <div class="divider-line" />
                <CollapsibleTrigger class="advanced-trigger">
                    <span>Advanced</span>
                    <ChevronRight class="h-3 w-3 text-muted-foreground transition-transform duration-200" :class="{ 'rotate-90': advancedOpen }" />
                </CollapsibleTrigger>
                <div class="divider-line" />
            </div>

            <CollapsibleContent class="advanced-content">
                <div class="advanced-grid">
                    <!-- Min Area % -->
                    <Tooltip text="Ignore tiny contours — raise to drop grass, fences, and stray edges">
                        <SliderControl
                            v-model="minContourArea"
                            label="Min Area %"
                            :min="0"
                            :max="20"
                            :step="0.5"
                            :color="VIZ_COLORS.amber"
                            :format-value="(v: number) => v.toFixed(1)"
                        />
                    </Tooltip>

                    <!-- Max Contours -->
                    <Tooltip text="How many outlines to keep — 1 for a clean silhouette, more for interior detail">
                        <SliderControl
                            v-model="maxContours"
                            label="Max Contours"
                            :min="0"
                            :max="50"
                            :step="1"
                            :color="VIZ_COLORS.amber"
                            :format-value="(v: number) => v === 0 ? 'All' : String(v)"
                        />
                    </Tooltip>

                    <!-- Smoothing -->
                    <Tooltip text="Iron out jagged edges — tame fur, leaves, and pixelated boundaries">
                        <SliderControl
                            v-model="smoothContours"
                            label="Smoothing"
                            :min="0"
                            :max="1"
                            :step="0.05"
                            :color="VIZ_COLORS.amber"
                            :format-value="(v: number) => v.toFixed(2)"
                        />
                    </Tooltip>
                </div>
            </CollapsibleContent>
        </Collapsible>

        <!-- Retry banner for transient errors -->
        <Transition name="slide-down">
            <div v-if="store.error" class="retry-banner">
                <span class="retry-msg fira-code">{{ shortError }}</span>
                <Button variant="destructive" size="sm" class="retry-btn" @click="runCompute" :disabled="store.computing">
                    <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': store.computing }" />
                    Retry
                </Button>
            </div>
        </Transition>
    </ConfiguratorLayer>
</template>

<style scoped>
@reference "tailwindcss";
/* Advanced section */
.advanced-divider {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.25rem;
}
.divider-line {
    flex: 1;
    height: 1px;
    background: color-mix(in srgb, var(--foreground) 10%, transparent);
}
.advanced-trigger {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    cursor: pointer;
    user-select: none;
    @apply text-sm;
    font-weight: 500;
    letter-spacing: 0.03em;
    color: color-mix(in srgb, var(--foreground) 40%, transparent);
    transition: color 0.15s;
    white-space: nowrap;
    padding: 0.125rem 0;
}
.advanced-trigger:hover {
    color: color-mix(in srgb, var(--foreground) 60%, transparent);
}

/* B.W2.d — the hand-rolled `adv-open` / `adv-close` keyframes retire in
   favour of `CollapsibleContent`'s `data-state` channel driving the
   canonical glass-ui `collapsible-open` / `collapsible-close` keyframes
   (shipped at `@mkbabb/glass-ui/styles/animations.css`, resolved via global
   cascade — the same substrate animation `CollapsibleSection` adopted at
   A.W3.d). The `--reka-collapsible-content-height` channel the substrate
   keyframes read is supplied by the primitive. */
.advanced-content {
    overflow: hidden;
}
.advanced-content[data-state="open"] {
    animation: collapsible-open 0.2s var(--ease-out);
}
.advanced-content[data-state="closed"] {
    animation: collapsible-close 0.2s var(--ease-out);
}
@media (prefers-reduced-motion: reduce) {
    .advanced-content[data-state="open"],
    .advanced-content[data-state="closed"] {
        animation: none;
    }
}

.advanced-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.625rem 0.75rem;
    padding-top: 0.625rem;
}
.advanced-grid > :last-child:nth-child(odd) {
    grid-column: 1 / -1;
}

.reset-icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    border: none;
    background: none;
    color: var(--muted-foreground);
    cursor: pointer;
    border-radius: 0.25rem;
    transition: color 0.15s, opacity 0.2s;
}
.reset-icon-btn.is-default {
    opacity: 0.25;
    pointer-events: none;
}
.reset-icon-btn:hover {
    color: var(--foreground);
}

/* Retry banner */
.retry-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    margin-top: 0.5rem;
    border-radius: 0.5rem;
    background: color-mix(in srgb, var(--destructive) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--destructive) 20%, transparent);
}

.retry-msg {
    @apply text-sm;
    color: var(--destructive);
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.retry-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.625rem;
    border-radius: 0.375rem;
    border: 1px solid color-mix(in srgb, var(--destructive) 30%, transparent);
    background: color-mix(in srgb, var(--destructive) 10%, transparent);
    color: var(--destructive);
    @apply text-sm;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: background 0.15s, border-color 0.15s;
}
.retry-btn:hover {
    background: color-mix(in srgb, var(--destructive) 18%, transparent);
    border-color: color-mix(in srgb, var(--destructive) 40%, transparent);
}
.retry-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* A.W3.d — named properties + canonical tokens, no `transition: all`. */
.slide-down-enter-active {
    transition: opacity 0.25s var(--ease-out), transform 0.25s var(--ease-out);
}
.slide-down-leave-active {
    transition: opacity 0.15s var(--ease-in), transform 0.15s var(--ease-in);
}
.slide-down-enter-from {
    opacity: 0;
    transform: translateY(-4px);
}
.slide-down-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
</style>
