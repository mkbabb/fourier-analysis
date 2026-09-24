<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { ConfiguratorLayer } from "@mkbabb/glass-ui/configurator";
import SliderControl from "@/components/ui/SliderControl.vue";
import { Tooltip } from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@mkbabb/glass-ui/toggle-group";
import { ANIMATION_DEFAULTS, CONTOUR_DEFAULTS } from "@/lib/defaults";
import { normalizeBasisKey } from "@/lib/basis";
import { basisDisplay } from "./lib/basis-display";
import { RotateCcw } from "@lucide/vue";

/* X.F.W14U.vstage — UIA-F-172: the aside's sliders wore one hue each (Harmonics
   the Fourier red, Sample Points the Chebyshev blue, the contour rows amber), a
   code that meant nothing. Controls take the one accent (`style.css`
   `--control-accent`); the basis hues stay on the canvas, where they name a curve. */
const CONTROL_ACCENT = "var(--control-accent)";


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

/* X.F.W14.h · OA-45 — the two resolution rows are the app's one control-row
   idiom (`ui/SliderControl.vue`): label and value field on one line, the slider
   beneath. The frame's three-line row (label; the field alone on a right-aligned
   line; a thumbless bar) retires with the local ConfiguratorRow + NumberField +
   Slider composition. The clamps stay here, the range authority; a cleared
   field commits `NaN`, folded to the floor by `|| min`. */
function emitHarmonics(v: number) {
    emit("update:nHarmonics", Math.max(1, Math.min(500, Math.round(v) || 1)));
}
function emitPoints(v: number) {
    emit("update:nPoints", Math.max(128, Math.min(4096, Math.round(v) || 128)));
}

const selected = ref<string[]>(props.activeBases ?? ["fourier-epicycles"]);

watch(() => props.activeBases, (v) => { if (v) selected.value = [...v]; });

/*
 * X.F.W14U.vstage — UIA-F-170 ⊕ F-238: the Fourier pill hid a three-state cycle
 * (epicycles → series → off) behind a binary `aria-pressed`, and the three
 * stadium pills wrapped into a 2+1 orphan in the aside. The mode is a one-of-
 * three chooser and the polynomial bases are N independent toggles: glass's
 * `ToggleGroup` in its two selection modes, each on one row.
 */
type FourierMode = "fourier-epicycles" | "fourier-series" | "off";
const FOURIER_MODES: { value: FourierMode; label: string }[] = [
    { value: "fourier-epicycles", label: "Epicycles" },
    { value: "fourier-series", label: "Series" },
    { value: "off", label: "Off" },
];
const POLYNOMIAL_BASES = ["chebyshev", "legendre"] as const;

const fourierMode = computed<FourierMode>(() => {
    if (selected.value.includes("fourier-epicycles")) return "fourier-epicycles";
    if (selected.value.includes("fourier-series")) return "fourier-series";
    return "off";
});
const polynomialBases = computed(() =>
    selected.value.filter((b) => normalizeBasisKey(b) !== "fourier"),
);

function commit(next: string[]) {
    selected.value = next;
    emit("update:activeBases", [...next]);
}

/** A single-mode group emits `undefined` when its pressed item is pressed
 *  again; the mode is always one of three, so that is not a change. */
function setFourierMode(mode: unknown) {
    if (typeof mode !== "string") return;
    const fourier = mode === "off" ? [] : [mode];
    commit([...fourier, ...polynomialBases.value]);
}

function setPolynomialBases(bases: unknown) {
    const next = Array.isArray(bases) ? bases.map(String) : [];
    const fourier = fourierMode.value === "off" ? [] : [fourierMode.value];
    commit([...fourier, ...next]);
}

/**
 * X.F.W13.b — the reset read a private copy of the defaults that had drifted
 * from the app's one spelling (`nHarmonics: 50` here, `n_harmonics: 200` in
 * `lib/defaults.ts`, which is what a fresh workspace actually loads). Measured
 * on the served page: a fresh upload read N = 200 with the reset LIT, and
 * pressing it moved N to 50 — "reset" left the defaults. It now reads the one
 * owner, so it restores what a fresh workspace shows and is disabled there.
 */
const DEFAULTS = {
    activeBases: ANIMATION_DEFAULTS.active_bases,
    nHarmonics: CONTOUR_DEFAULTS.n_harmonics,
    nPoints: CONTOUR_DEFAULTS.n_points,
} as const;

const isDefault = computed(() =>
    (props.nHarmonics ?? DEFAULTS.nHarmonics) === DEFAULTS.nHarmonics
    && (props.nPoints ?? DEFAULTS.nPoints) === DEFAULTS.nPoints
    && selected.value.length === DEFAULTS.activeBases.length
    && DEFAULTS.activeBases.every((b) => selected.value.includes(b)),
);

function resetDefaults() {
    selected.value = [...DEFAULTS.activeBases];
    emit("update:activeBases", [...DEFAULTS.activeBases]);
    emit("update:nHarmonics", DEFAULTS.nHarmonics);
    emit("update:nPoints", DEFAULTS.nPoints);
}

</script>

<template>
    <ConfiguratorLayer label="Decomposition" sub="basis &amp; resolution" :default-open="true">
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

        <div class="basis-groups">
            <ToggleGroup type="single" size="sm" aria-label="Fourier mode"
                :model-value="fourierMode" @update:model-value="setFourierMode">
                <ToggleGroupItem v-for="m in FOURIER_MODES" :key="m.value" :value="m.value">{{ m.label }}</ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup type="multiple" size="sm" aria-label="Polynomial bases"
                :model-value="polynomialBases" @update:model-value="setPolynomialBases">
                <ToggleGroupItem v-for="key in POLYNOMIAL_BASES" :key="key" :value="key">
                    <span class="basis-icon font-serif-math" aria-hidden="true">{{ basisDisplay[key].icon }}</span>
                    {{ basisDisplay[key].label }}
                </ToggleGroupItem>
            </ToggleGroup>
        </div>

        <SliderControl
            label="Harmonics"
            token="N"
            :model-value="nHarmonics ?? 50"
            :min="1"
            :max="500"
            :step="1"
            :color="CONTROL_ACCENT"
            @update:model-value="emitHarmonics"
        />
        <SliderControl
            label="Sample Points"
            :model-value="nPoints ?? 1024"
            :min="128"
            :max="4096"
            :step="128"
            :color="CONTROL_ACCENT"
            @update:model-value="emitPoints"
        />
    </ConfiguratorLayer>
</template>

<style scoped>
@reference "tailwindcss";
.basis-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25em;
    line-height: 1;
    min-width: 1em;
    height: 1em;
}
/* X.F.W14U.vstage — the two choosers stack, each one row; the local pill
   retint (`.basis-toggle`: a 2px border, a per-basis tint) retired with the
   pills — the ToggleGroup's pressed state is glass's own. */
.basis-groups {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding-bottom: 0.25rem;
}

/* X.F.W13.b — the `.reset-icon-btn` block retires: it restated the glass Button's
   geometry (a 4px corner on the 40x40 icon-only square, measured) and faked the
   disabled state with `pointer-events: none` on a control that stayed focusable
   and keyboard-live. The Button owns both: `icon-only` is the circle, and
   `:disabled` is the one disabled channel. */

</style>
