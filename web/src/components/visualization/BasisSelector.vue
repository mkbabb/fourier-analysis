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

/* X.F.W14U.c1 — addendum (g), COHESION §0da: the owner reverses UIA-F-172's
   colour limb. The basis hues are fourier's visual language on the controls as
   on the canvas, so every control that sets a basis-owned quantity wears that
   basis's hue from the one palette (`basisDisplay`, derived from `VIZ_COLORS`):
   Harmonics the Fourier red, Sample Points the Chebyshev blue, and the pressed
   basis chip its own basis tint. The one-accent token `--control-accent` is
   deleted. */
const FOURIER_HUE = computed(() => basisDisplay.fourier.color);

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
        <!-- X.F.W14U.a2 — O-68 CONFIGURATOR-HEADER-ACTIONS (glass 10.1.0,
             COHESION §0dd). The owner: "the refresh button should be inline in
             the section when expanded too". The layer-wide reset sits in the
             layer's `#actions` header slot, on the label's row while the layer
             is open (glass's default `actionsWhen="open"`); the body row it held
             is deleted. -->
        <template #actions>
            <Tooltip text="Reset to defaults">
                <Button
                    emphasis="quiet"
                    size="sm" icon-only
                    :disabled="isDefault"
                    aria-label="Reset to defaults"
                    @click.stop="resetDefaults"
                >
                    <RotateCcw class="h-3.5 w-3.5" />
                </Button>
            </Tooltip>
        </template>

        <div class="basis-groups">
            <ToggleGroup type="single" size="sm" aria-label="Fourier mode"
                :model-value="fourierMode" @update:model-value="setFourierMode">
                <ToggleGroupItem v-for="m in FOURIER_MODES" :key="m.value" :value="m.value"
                    :class="{ 'basis-chip': m.value !== 'off' }"
                    :style="m.value !== 'off' ? { '--basis-hue': FOURIER_HUE } : undefined">
                    <span v-if="m.value !== 'off'" class="basis-icon basis-icon--fourier font-serif-math" aria-hidden="true">{{ basisDisplay.fourier.icon }}</span>
                    {{ m.label }}
                </ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup type="multiple" size="sm" aria-label="Polynomial bases"
                :model-value="polynomialBases" @update:model-value="setPolynomialBases">
                <ToggleGroupItem v-for="key in POLYNOMIAL_BASES" :key="key" :value="key"
                    class="basis-chip" :style="{ '--basis-hue': basisDisplay[key].color }">
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
            :color="FOURIER_HUE"
            @update:model-value="emitHarmonics"
        />
        <SliderControl
            label="Sample Points"
            :model-value="nPoints ?? 1024"
            :min="128"
            :max="4096"
            :step="128"
            :color="basisDisplay.chebyshev.color"
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
/* X.F.W14U.c2 — §0db: the Fourier modes wear ℱ again, as the Fourier pill did
   before `.vstage`'s restructure. The script F sits small in its em box, so it
   is set larger and pulled into the line (the pre-`.vstage` compact rule). */
.basis-icon--fourier {
    font-size: 1.75em;
    margin: -0.3em -0.05em;
}
/* X.F.W14U.vstage — the two choosers stack, each one row. */
.basis-groups {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding-bottom: 0.25rem;
}

/* X.F.W14U.c1 — addendum (g): the pressed basis chip carries its basis tint.
   The item is glass's ToggleGroupItem as published; this is the per-instance
   retint of its own pressed state through its `class` prop, keyed on the
   `data-state` it ships (the `.basis-toggle` recipe of X.F.W14.g, OA-43, on the
   new item). The ink is the hue carried a quarter toward `--foreground` in
   OKLab, which keeps the hue and clears AA on the tint in both arms (measured in
   the c1 record). "Off" is not a basis and keeps glass's neutral pressed state. */
.basis-chip[data-state="on"] {
    background-color: color-mix(in srgb, var(--basis-hue) 12%, transparent);
    color: color-mix(in oklab, var(--basis-hue) 75%, var(--foreground));
}
.basis-chip[data-state="on"]:hover:not(:disabled) {
    background-color: color-mix(in srgb, var(--basis-hue) 16%, transparent);
}

/* X.F.W13.b — the `.reset-icon-btn` block retires: it restated the glass Button's
   geometry (a 4px corner on the 40x40 icon-only square, measured) and faked the
   disabled state with `pointer-events: none` on a control that stayed focusable
   and keyboard-live. The Button owns both: `icon-only` is the circle, and
   `:disabled` is the one disabled channel. */

</style>
