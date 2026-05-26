<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { Slider, Button } from "@mkbabb/glass-ui";
import CollapsibleSection from "@/components/ui/CollapsibleSection.vue";
import { Tooltip } from "@/components/ui/tooltip";
import { VIZ_COLORS } from "@/lib/colors";
import { basisDisplay } from "./lib/basis-display";
import { RotateCcw } from "lucide-vue-next";

const fourierModes = ["fourier-epicycles", "fourier-series"] as const;

const props = defineProps<{
    activeBases?: string[];
    nHarmonics?: number;
    nPoints?: number;
}>();

const emit = defineEmits<{
    (e: "update:activeBases", bases: string[]): void;
    (e: "update:nHarmonics", v: number): void;
    (e: "update:nPoints", v: number): void;
}>();

/* A.W2.c — `<Slider variant="glass-scrubber">` accepts an array model; the
   parent's scalar `nHarmonics` / `nPoints` are adapted via paired computed
   getters/setters that wrap the emit. */
const harmonicsModel = computed<number[]>({
    get: () => [props.nHarmonics ?? 50],
    set: (arr) => emit("update:nHarmonics", Math.max(1, Math.min(500, arr[0] ?? 50))),
});
const pointsModel = computed<number[]>({
    get: () => [props.nPoints ?? 1024],
    set: (arr) => emit("update:nPoints", Math.max(128, Math.min(4096, arr[0] ?? 1024))),
});

const selected = ref<string[]>(props.activeBases ?? ["fourier-epicycles"]);

watch(() => props.activeBases, (v) => { if (v) selected.value = [...v]; });

const fourierMode = computed(() => {
    if (selected.value.includes("fourier-epicycles")) return "fourier-epicycles";
    if (selected.value.includes("fourier-series")) return "fourier-series";
    return null;
});

const fourierLabel = computed(() => {
    if (fourierMode.value === "fourier-epicycles") return "Epicycles";
    if (fourierMode.value === "fourier-series") return "Series";
    return "Fourier";
});

function isBasisActive(key: string): boolean {
    if (key === "fourier") return fourierMode.value !== null;
    return selected.value.includes(key);
}

function getBasisLabel(key: string, info: { label: string }): string {
    if (key === "fourier") return fourierLabel.value;
    return info.label;
}

const basisTooltips: Record<string, string> = {
    fourier: "Fourier series — click to cycle: epicycles \u2192 series \u2192 off",
    chebyshev: "Chebyshev polynomial approximation",
    legendre: "Legendre polynomial approximation",
};

function getBasisTooltip(key: string): string {
    return basisTooltips[key] ?? key;
}

const DEFAULTS = {
    activeBases: ["fourier-epicycles"],
    nHarmonics: 50,
    nPoints: 1024,
} as const;

const isDefault = computed(() =>
    (props.nHarmonics ?? 50) === DEFAULTS.nHarmonics
    && (props.nPoints ?? 1024) === DEFAULTS.nPoints
    && selected.value.length === 1
    && selected.value[0] === "fourier-epicycles",
);

function resetDefaults() {
    selected.value = [...DEFAULTS.activeBases];
    emit("update:activeBases", [...DEFAULTS.activeBases]);
    emit("update:nHarmonics", DEFAULTS.nHarmonics);
    emit("update:nPoints", DEFAULTS.nPoints);
}

function toggleBasis(key: string) {
    if (key === "fourier") {
        // Cycle: epicycles -> series -> off -> epicycles
        const hasEpi = selected.value.includes("fourier-epicycles");
        const hasSeries = selected.value.includes("fourier-series");
        const otherBases = selected.value.filter(b => !b.startsWith("fourier"));
        selected.value = [...otherBases];
        if (hasEpi) {
            selected.value.push("fourier-series");
        } else if (hasSeries) {
            // Go to "off" — allow empty selection (canvas handles it gracefully)
        } else {
            selected.value.push("fourier-epicycles");
        }
    } else {
        const idx = selected.value.indexOf(key);
        if (idx >= 0) {
            selected.value.splice(idx, 1);
        } else {
            selected.value.push(key);
        }
    }
    emit("update:activeBases", [...selected.value]);
}
</script>

<template>
    <div class="cartoon-card px-3 py-2">
        <CollapsibleSection title="Decomposition" subtitle="basis & resolution" :default-open="true">
            <template #actions>
                <Button
                    variant="ghost"
                    size="icon"
                    class="reset-icon-btn"
                    :class="{ 'is-default': isDefault }"
                    title="Reset to defaults"
                    @click.stop="resetDefaults"
                >
                    <RotateCcw class="h-3.5 w-3.5" />
                </Button>
            </template>
            <div class="flex flex-wrap justify-center gap-1.5 pt-1 pb-1">
                <Tooltip v-for="(info, key) in basisDisplay" :key="key" :text="getBasisTooltip(key as string)">
                    <Button
                        variant="outline"
                        size="sm"
                        class="basis-toggle"
                        :aria-pressed="isBasisActive(key as string)"
                        :style="isBasisActive(key as string) ? { '--pill-color': info.color } : {}"
                        @click="toggleBasis(key as string)"
                    >
                        <span class="basis-icon cm-serif font-semibold" :class="{ 'basis-icon--fourier': key === 'fourier' }">{{ info.icon }}</span>
                        {{ getBasisLabel(key as string, info) }}
                    </Button>
                </Tooltip>
            </div>

            <div class="space-y-3 pt-2">
                <!-- Harmonics -->
                <div>
                    <label class="mb-1.5 flex items-center justify-between text-sm font-medium text-muted-foreground">
                        <span>Harmonics (N)</span>
                        <input
                            type="number"
                            class="inline-number fira-code"
                            :value="nHarmonics"
                            min="1"
                            max="500"
                            step="1"
                            @input="emit('update:nHarmonics', Math.max(1, Math.min(500, parseInt(($event.target as HTMLInputElement).value) || 1)))"
                        />
                    </label>
                    <Slider
                        v-model="harmonicsModel"
                        variant="glass-scrubber"
                        :min="1"
                        :max="500"
                        :step="1"
                        aria-label="Harmonics"
                        class="basis-slider-track"
                        :style="{ '--track-color': VIZ_COLORS.fourier }"
                    />
                </div>

                <!-- Sample Points -->
                <div>
                    <label class="mb-1.5 flex items-center justify-between text-sm font-medium text-muted-foreground">
                        <span>Sample Points</span>
                        <input
                            type="number"
                            class="inline-number fira-code"
                            :value="nPoints"
                            min="128"
                            max="4096"
                            step="128"
                            @input="emit('update:nPoints', Math.max(128, Math.min(4096, parseInt(($event.target as HTMLInputElement).value) || 128)))"
                        />
                    </label>
                    <Slider
                        v-model="pointsModel"
                        variant="glass-scrubber"
                        :min="128"
                        :max="4096"
                        :step="128"
                        aria-label="Sample Points"
                        class="basis-slider-track"
                        :style="{ '--track-color': VIZ_COLORS.chebyshev }"
                    />
                </div>
            </div>
        </CollapsibleSection>
    </div>
</template>

<style scoped>
@reference "tailwindcss";
.inline-number {
    width: 2.75rem;
    text-align: right;
    background: transparent;
    border: none;
    border-bottom: 1px solid transparent;
    color: var(--foreground);
    font-size: inherit;
    padding: 0;
    outline: none;
    -moz-appearance: textfield;
    transition: border-color 0.15s;
}
.inline-number:hover,
.inline-number:focus {
    border-bottom-color: color-mix(in srgb, var(--foreground) 30%, transparent);
}
.inline-number::-webkit-inner-spin-button,
.inline-number::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.basis-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5em;
    line-height: 1;
    min-width: 1.2em;
    height: 1em;
}
.basis-icon--fourier {
    font-size: 2.2em;
    margin: -0.35em -0.1em;
    transform: translateY(0.06em);
}
/* A.W2.e — `.basis-toggle` is the per-instance retint hook over
   `<Button variant="outline" size="sm">`. The variant already ships the
   focus-ring, the press-scale, the rounded-pill shape, and the disabled
   geometry; the toggle layer adds the basis-specific tint (driven by
   `aria-pressed`), the 5.5 rem min-width that keeps all three pills
   uniform-width, the 2 px border weight the outline variant ships at 1 px,
   and the mobile-compact rules. The `:where()` selector ensures these
   override the variant's `h-9 px-3` defaults without raising specificity
   beyond a single class. */
.basis-toggle {
    @apply gap-1 min-w-[5.5rem] justify-center font-medium;
    border-width: 2px;
    border-color: color-mix(in srgb, var(--foreground) 12%, transparent);
    color: var(--muted-foreground);
}
.basis-toggle:hover {
    border-color: color-mix(in srgb, var(--foreground) 25%, transparent);
    background: transparent;
    color: var(--muted-foreground);
}
.basis-toggle[aria-pressed="true"] {
    background: color-mix(in srgb, var(--pill-color) 12%, transparent);
    border-color: color-mix(in srgb, var(--pill-color) 40%, transparent);
    color: var(--pill-color);
}
.basis-toggle[aria-pressed="true"]:hover {
    background: color-mix(in srgb, var(--pill-color) 16%, transparent);
    color: var(--pill-color);
}

/* Compact pills on mobile so all three fit on one line */
@media (max-width: 639px) {
    .basis-toggle {
        @apply px-2 gap-0.5;
        border-width: 1.5px;
    }
    .basis-icon {
        font-size: 1.25em;
        min-width: 1em;
    }
    .basis-icon--fourier {
        font-size: 1.75em;
        margin: -0.3em -0.05em;
    }
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

/* A.W2.c — glass-scrubber per-instance retint hook. The variant ships
   neutral defaults; we project `--track-color` onto the range fill + thumb
   so each slider inherits its corresponding `VIZ_COLORS` palette entry. */
.basis-slider-track {
    --slider-scrub-range-bg: color-mix(in srgb, var(--track-color) 30%, transparent);
    --slider-scrub-range-bg-hover: color-mix(in srgb, var(--track-color) 45%, transparent);
    --slider-scrub-thumb-bg: var(--track-color);
    --slider-scrub-thumb-bg-hover: var(--track-color);
}
</style>
