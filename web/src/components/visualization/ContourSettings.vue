<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { watchDebounced } from "@vueuse/core";
import { useWorkspaceStore } from "@/stores/workspace";
import { VIZ_COLORS } from "@/lib/colors";
import { CONTOUR_DEFAULTS } from "@/lib/defaults";
import { Button } from "@mkbabb/glass-ui/button";
// `./alert` has no subpath export at the 8.0.0 pin; the root barrel carries it.
import { Alert, AlertDescription } from "@mkbabb/glass-ui";
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
import { Wand2, ChevronRight, RotateCcw, RefreshCw, CircleAlert } from "@lucide/vue";
import { Tooltip } from "@/components/ui/tooltip";
import SliderControl from "@/components/ui/SliderControl.vue";

const advancedOpen = ref(false);
/** X.F.W14U.c1 — addendum (g) reverses UIA-F-172's colour limb: the contour
 *  rows set contour-owned quantities and wear the contour's hue from the one
 *  palette (`VIZ_COLORS.amber`, the ink the contour stroke paints with). */
const CONTOUR_HUE = computed(() => VIZ_COLORS.amber);

/**
 * X.F.W3 `.d` — `fr-ContourSettings M-16` (≡ `C-9` / `L-M3`(contract) / `D-i2`),
 * the panel half of §5a split (4). THE CONTRACT IS INBOUND-ONLY, AND SAYS SO HERE.
 *
 * Both mount sites bound `v-model:n-harmonics` / `v-model:n-points` over a
 * component that declares props and nothing else — zero `defineEmits`, zero
 * `emit(` in the whole file — so the binding advertised a writeback this panel
 * structurally cannot perform, while the sibling six lines away
 * (`BasisSelector`) declares and emits the identical pair. The reader cannot
 * tell from either end which child owns the two scalars.
 *
 * M-16 offered two cures: props-only at the call sites, or real emits here. The
 * bytes decide it: every use of the pair in this file is a READ
 * (`currentComputeKey`, `runCompute`'s settings write, the two watch sources) —
 * the panel consumes the harmonic budget to key and trigger a recompute and
 * never authors it. Minting emits to honour a contract nothing would ever fire
 * is a second fiction, so the contract is declared INBOUND and the two
 * `v-model:` call sites drop to `:` bindings at the host.
 *
 * ⊘ The host half is `VisualizationView.vue`'s, which is `.e`'s file (§5a split
 * (4)): `.e` opens only after this commit lands, and until it does the call
 * sites are unchanged and inert — exactly as they have shipped. Nothing
 * regresses in the interval, because the writeback never worked.
 */
const props = defineProps<{
    /** Inbound only — the harmonic budget the recompute is keyed on. */
    nHarmonics: number;
    /** Inbound only — the resample resolution the recompute is keyed on. */
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
    <!-- X.F.W3 `.d` — `fr-ContourSettings i-3`, the default-collapsed IA, is
         RECORDED HERE AND EXECUTED NOWHERE. COHESION §0x `S-6b` ruled it
         2026-09-19: "Contour settings are secondary to the canvas; progressive
         disclosure is the audit's own posture. No per-viewer persistence is
         minted for it in this wave." The ruling AGREES with the shipped byte —
         `:default-open="false"` below is what i-3 measured and what S-6b
         affirms — so the correct act is to leave it untouched and say why, and
         `.d`'s spec order ("i-3's ruling is RECORDED, not executed") is
         satisfied by exactly that. No `open`/persistence prop is added. -->
    <ConfiguratorLayer label="Contour" sub="edge extraction settings" :default-open="false">
        <!-- Panel-wide reset: ConfiguratorLayer has no header-actions slot, so
             the affordance lives at the top of the layer body. -->
        <div class="flex items-center justify-end -mt-1 -mb-1">
            <Tooltip text="Reset to defaults">
                <Button
                    emphasis="quiet"
                    size="md" icon-only
                    :disabled="isDefault"
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
                <SelectTrigger aria-label="Contour extraction strategy" class="w-full">
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
        <SliderControl v-if="strategy === 'ml' || strategy === 'auto'"
            v-model="mlThreshold"
            label="ML Threshold"
            :min="0.1"
            :max="0.9"
            :step="0.05"
            :color="CONTOUR_HUE"
            :format-value="(v: number) => v.toFixed(2)"
            subtitle="saliency cutoff"
        />

        <!-- Blur Sigma -->
        <SliderControl
            v-model="blurSigma"
            label="Blur Sigma"
            :min="0"
            :max="5"
            :step="0.1"
            :color="CONTOUR_HUE"
            :format-value="(v: number) => v.toFixed(1)"
            subtitle="softens noisy edges"
        />

        <!-- X.F.W14U.vstage — UIA-F-171: the Advanced disclosure was a hand-rolled
             divider trigger (two hairlines around a bare text trigger), a second
             disclosure idiom in an aside whose layers use glass's. The trigger is
             glass's Button through the Collapsible's own `as-child` seat, so it
             carries `aria-expanded` and the Button's focus ring and press. -->
        <Collapsible v-model:open="advancedOpen">
            <CollapsibleTrigger as-child>
                <Button emphasis="quiet" size="sm" class="advanced-trigger">
                    Advanced
                    <ChevronRight class="transition-transform duration-200" :class="{ 'rotate-90': advancedOpen }" />
                </Button>
            </CollapsibleTrigger>

            <CollapsibleContent class="advanced-content">
                <div class="advanced-grid">
                    <!-- Min Area % -->
                    <SliderControl
                        v-model="minContourArea"
                        label="Min Area %"
                        :min="0"
                        :max="20"
                        :step="0.5"
                        :color="CONTOUR_HUE"
                        :format-value="(v: number) => v.toFixed(1)"
                        subtitle="drops stray specks"
                    />

                    <!-- Max Contours -->
                    <SliderControl
                        v-model="maxContours"
                        label="Max Contours"
                        :min="0"
                        :max="50"
                        :step="1"
                        :color="CONTOUR_HUE"
                        :format-value="(v: number) => v === 0 ? 'All' : String(v)"
                        subtitle="1 = one silhouette"
                    />

                    <!-- Smoothing -->
                    <SliderControl
                        v-model="smoothContours"
                        label="Smoothing"
                        :min="0"
                        :max="1"
                        :step="0.05"
                        :color="CONTOUR_HUE"
                        :format-value="(v: number) => v.toFixed(2)"
                        subtitle="irons jagged edges"
                    />
                </div>
            </CollapsibleContent>
        </Collapsible>

        <!-- Retry banner for transient errors -->
        <Transition name="slide-down">
            <!-- X.F.W13.b — the hand-rolled banner (its own border, tint and radius) and
                 the per-instance `.retry-btn` restyle of the glass Button retire onto the
                 producer's pair: `Alert tone="destructive"` owns the surface, the tone
                 and the announcement; the Button owns the command. -->
            <Alert v-if="store.error" tone="destructive" announce="polite" class="mt-2">
                <CircleAlert />
                <AlertDescription>
                    <span class="retry-msg fira-code">{{ shortError }}</span>
                    <Button emphasis="primary" tone="destructive" size="sm" :loading="store.computing" @click="runCompute">
                        <RefreshCw />
                        Retry
                    </Button>
                </AlertDescription>
            </Alert>
        </Transition>
    </ConfiguratorLayer>
</template>

<style scoped>
@reference "tailwindcss";
/* Advanced section — the trigger is glass's Button (X.F.W14U.vstage, F-171);
   the host only seats it at the start of its row. */
.advanced-trigger {
    align-self: flex-start;
    margin-top: 0.25rem;
}

/* B.W2.d retired the hand-rolled `adv-open` / `adv-close` keyframes in favour
   of the canonical glass-ui `collapsible-open` / `collapsible-close` pair. At
   the F.W1 pin the producer ships neither, and the consumer-side shorthands
   that named them are deleted below (G10). */
.advanced-content {
    overflow: hidden;
}
/* F.W1 / B-1 / G10 — deleted symmetrically with `CollapsibleSection`'s twin:
   the two `[data-state]` `animation` shorthands and the
   `prefers-reduced-motion` arm both name keyframes glass-ui ≥7 no longer
   ships, and a shorthand naming an absent keyframe hangs reka's `usePresence`
   on an `animationend` that never fires. `overflow: hidden` above STAYS on
   both twins. */

/* X.F.W14U.vstage — one column, like every other row in the aside: at half
   the aside's width each row's hint (F-146's cure: the tooltip text became the
   row's own subtitle) and its value field could not share one line. */
.advanced-grid {
    display: grid;
    gap: 0.625rem;
    padding-top: 0.625rem;
}

/* X.F.W13.b — the `.reset-icon-btn` block retires: it restated the glass Button's
   geometry (a 4px corner on the 40x40 icon-only square, measured) and faked the
   disabled state with `pointer-events: none` on a control that stayed focusable
   and keyboard-live. The Button owns both: `icon-only` is the circle, and
   `:disabled` is the one disabled channel. */

/* Retry banner — the surface, tone and radius are the glass Alert's; the message
   only truncates to one line. */
.retry-msg {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
