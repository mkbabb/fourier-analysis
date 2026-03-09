<script setup lang="ts">
import { ref, onMounted, computed, type WritableComputedRef } from "vue";
import { watchDebounced } from "@vueuse/core";
import { useSessionStore } from "@/stores/session";
import { useAnimationStore } from "@/stores/animation";
import { VIZ_COLORS } from "@/lib/colors";
import { Collapsible } from "@/components/ui/collapsible";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select";
import { Wand2 } from "lucide-vue-next";
import { Tooltip } from "@/components/ui/tooltip";

const props = defineProps<{
    nHarmonics: number;
    nPoints: number;
}>();

const store = useSessionStore();
const anim = useAnimationStore();

const strategy = ref(store.session?.parameters.strategy ?? "auto");
const blurSigma = ref(store.session?.parameters.blur_sigma ?? 1.0);

const computing = computed({
    get: () => store.computing,
    set: (v: boolean) => { store.computing = v; },
});

const strategyLabels: Record<string, string> = {
    auto: "Auto",
    threshold: "Otsu Threshold",
    multi_threshold: "Multi-threshold",
    canny: "Canny Edges",
};

const strategyDescriptions: Record<string, string> = {
    auto: "Automatically selects the best contour extraction method based on the image",
    threshold: "Otsu's method — optimal single-threshold binary segmentation",
    multi_threshold: "Multiple thresholds for complex images with many intensity levels",
    canny: "Edge detection — best for line drawings and high-contrast boundaries",
};

const strategyLabel = computed(() => strategyLabels[strategy.value] ?? strategy.value);

// Slider gradient progress
const blurProgress = computed(() => ((blurSigma.value - 0) / 5) * 100);

async function runCompute() {
    if (!store.hasImage || computing.value) return;
    computing.value = true;
    await store.updateSettings({
        parameters: {
            strategy: strategy.value,
            blur_sigma: blurSigma.value,
            n_harmonics: props.nHarmonics,
            n_points: props.nPoints,
        },
    });
    await Promise.all([
        store.runEpicycles({
            n_harmonics: props.nHarmonics,
            n_points: props.nPoints,
        }),
        store.runBases({
            max_degree: props.nHarmonics,
            n_points: props.nPoints,
        }),
    ]);
    computing.value = false;
    anim.reset();
    anim.play();
}

// Auto-compute on settings change (debounced 800ms)
watchDebounced(
    () => [strategy.value, blurSigma.value, props.nHarmonics, props.nPoints],
    () => runCompute(),
    { debounce: 800, immediate: false },
);

// Compute on mount if image exists but no data
onMounted(() => {
    if (store.hasImage && !store.epicycleData && !store.basesData) {
        runCompute();
    }
});
</script>

<template>
    <div class="cartoon-card px-3 py-2">
        <Collapsible title="Contour" subtitle="edge extraction settings" :default-open="true">
            <div class="space-y-3 pt-1">
                <!-- Strategy -->
                <div>
                    <label class="mb-1.5 block text-sm font-medium text-muted-foreground">Strategy</label>
                    <Select v-model="strategy">
                        <SelectTrigger class="w-full h-10 text-sm border-2 border-foreground/15 rounded-lg">
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
                </div>

                <!-- Blur Sigma -->
                <Tooltip text="Gaussian blur before edge detection — higher = smoother contours">
                    <div>
                        <label class="mb-1.5 flex items-center justify-between text-sm font-medium text-muted-foreground">
                            <span>Blur Sigma</span>
                            <input
                                type="number"
                                class="inline-number fira-code"
                                :value="blurSigma.toFixed(1)"
                                min="0"
                                max="5"
                                step="0.1"
                                @input="blurSigma = Math.max(0, Math.min(5, parseFloat(($event.target as HTMLInputElement).value) || 0))"
                            />
                        </label>
                        <input
                            :value="blurSigma"
                            @input="blurSigma = parseFloat(($event.target as HTMLInputElement).value)"
                            type="range"
                            min="0"
                            max="5"
                            step="0.1"
                            class="styled-slider w-full"
                            :style="{ '--progress': blurProgress + '%', '--slider-color': VIZ_COLORS.amber }"
                        />
                    </div>
                </Tooltip>

            </div>
        </Collapsible>

    </div>
</template>

<style scoped>
.inline-number {
    width: 2.75rem;
    text-align: right;
    background: transparent;
    border: none;
    border-bottom: 1px solid transparent;
    color: hsl(var(--foreground));
    font-size: inherit;
    padding: 0;
    outline: none;
    -moz-appearance: textfield;
    transition: border-color 0.15s;
}
.inline-number:hover,
.inline-number:focus {
    border-bottom-color: hsl(var(--foreground) / 0.3);
}
.inline-number::-webkit-inner-spin-button,
.inline-number::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
</style>
