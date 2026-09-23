<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { Slider } from "@mkbabb/glass-ui/slider";
import { NumberField, NumberFieldInput } from "@mkbabb/glass-ui/number-field";
import { Button } from "@mkbabb/glass-ui/button";
import { ConfiguratorLayer, ConfiguratorRow } from "@mkbabb/glass-ui/configurator";
import { Tooltip } from "@/components/ui/tooltip";
import { VIZ_COLORS } from "@/lib/colors";
import { ANIMATION_DEFAULTS, CONTOUR_DEFAULTS } from "@/lib/defaults";
import { normalizeBasisKey } from "@/lib/basis";
import { basisDisplay } from "./lib/basis-display";
import { RotateCcw } from "@lucide/vue";


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

/* A.W2.c — `<Slider>` accepts an array model; the
   parent's scalar `nHarmonics` / `nPoints` are adapted via paired computed
   getters/setters that wrap the emit. */
/*
 * X.F.W12 `.a` — R-e-1 (COHESION §0as): the two readouts are the producer's
 * `NumberField`, so ArrowUp/ArrowDown step by the Slider's own `:step` and the
 * field commits a number. A cleared field commits `NaN`, folded to the floor by
 * `|| min` exactly as the old `parseInt("") || min` did; the clamp stays the
 * range authority. No grouping: `4096` must read and round-trip as `4096`.
 */
const INTEGER_FORMAT: Intl.NumberFormatOptions = {
    maximumFractionDigits: 0,
    useGrouping: false,
};
function emitHarmonics(v: number) {
    emit("update:nHarmonics", Math.max(1, Math.min(500, Math.round(v) || 1)));
}
function emitPoints(v: number) {
    emit("update:nPoints", Math.max(128, Math.min(4096, Math.round(v) || 128)));
}

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
    fourier: "Fourier series — click to cycle: epicycles → series → off",
    chebyshev: "Chebyshev polynomial approximation",
    legendre: "Legendre polynomial approximation",
};

function getBasisTooltip(key: string): string {
    return basisTooltips[key] ?? key;
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

function toggleBasis(key: string) {
    if (key === "fourier") {
        // Cycle: epicycles -> series -> off -> epicycles
        const hasEpi = selected.value.includes("fourier-epicycles");
        const hasSeries = selected.value.includes("fourier-series");
        // X.F.W3 repair 1 (g15, leg 2) — the inline family test retires onto
        // `normalizeBasisKey`, the domain's one owner. The predicate here is
        // "not in the fourier family", and spelling it as a `startsWith` was
        // one of seven copies of the same bridge between the FOUR keys
        // `active_bases` emits and the THREE families `basisDisplay` is keyed
        // by — the bridge the canon exists to hold.
        const otherBases = selected.value.filter(b => normalizeBasisKey(b) !== "fourier");
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

        <div class="flex flex-wrap justify-center gap-1.5 pb-1">
            <Tooltip v-for="(info, key) in basisDisplay" :key="key" :text="getBasisTooltip(key as string)">
                <Button
                    emphasis="secondary"
                    size="sm"
                    class="basis-toggle"
                    :aria-pressed="isBasisActive(key as string)"
                    :style="isBasisActive(key as string) ? { '--pill-color': info.color } : {}"
                    @click="toggleBasis(key as string)"
                >
                    <span class="basis-icon font-serif-math font-semibold" :class="{ 'basis-icon--fourier': key === 'fourier' }">{{ info.icon }}</span>
                    {{ getBasisLabel(key as string, info) }}
                </Button>
            </Tooltip>
        </div>

        <ConfiguratorRow label="Harmonics" name="N">
            <div class="w-full">
                <div class="mb-1.5 flex items-center justify-end">
                    <NumberField
                        :model-value="nHarmonics"
                        :min="1"
                        :max="500"
                        :step="1"
                        :format-options="INTEGER_FORMAT"
                        size="sm"
                        class="inline-number"
                        @update:model-value="emitHarmonics"
                    >
                        <NumberFieldInput aria-label="Harmonics" />
                    </NumberField>
                </div>
                <Slider
                    v-model="harmonicsModel"
                    :min="1"
                    :max="500"
                    :step="1"
                    aria-label="Harmonics"
                    class="basis-slider-track"
                    :style="{ '--track-color': VIZ_COLORS.fourier }"
                />
            </div>
        </ConfiguratorRow>

        <ConfiguratorRow label="Sample Points">
            <div class="w-full">
                <div class="mb-1.5 flex items-center justify-end">
                    <NumberField
                        :model-value="nPoints"
                        :min="128"
                        :max="4096"
                        :step="128"
                        :format-options="INTEGER_FORMAT"
                        size="sm"
                        class="inline-number"
                        @update:model-value="emitPoints"
                    >
                        <NumberFieldInput aria-label="Sample Points" />
                    </NumberField>
                </div>
                <Slider
                    v-model="pointsModel"
                    :min="128"
                    :max="4096"
                    :step="128"
                    aria-label="Sample Points"
                    class="basis-slider-track"
                    :style="{ '--track-color': VIZ_COLORS.chebyshev }"
                />
            </div>
        </ConfiguratorRow>
    </ConfiguratorLayer>
</template>

<style scoped>
@reference "tailwindcss";
/* X.F.W12 `.a` — R-e-1 (COHESION §0as): the two readouts moved off a native
   `type="number"` re-skinned as a bare underline onto the producer's
   `NumberField`; the local chrome retired with it (the transparent fill, the
   underline border and its hover/focus paint, `outline: none`, the inherited
   font size, the zero padding and the spin-button suppression) — the
   producer's `field-control` owns boundary, focus ring, radius, fill and the
   mono tabular numerals. What stays is layout only: the measure, wide enough
   for the four-digit `4096`. */
.inline-number {
    width: 4.5rem;
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

/* X.F.W13.b — the `.reset-icon-btn` block retires: it restated the glass Button's
   geometry (a 4px corner on the 40x40 icon-only square, measured) and faked the
   disabled state with `pointer-events: none` on a control that stayed focusable
   and keyboard-live. The Button owns both: `icon-only` is the circle, and
   `:disabled` is the one disabled channel. */

/*
   X.F.W3 `.a` · `fr-BasisSelector B-2` — THE PER-INSTANCE RETINT, LANDED.

   The four declarations this replaces named a namespace the producer has never
   defined at any pin this tree has installed, so the declared per-basis colour
   has never painted: both sliders rendered the stock capsule. The producer's
   real knob is `--slider-range-bg`, read by `.slider-range`'s own
   `--liquid-fill-tint`.

   ⊘ `MPC-10`, the cure-rider, is why this is ONE declaration and not a rename of
   four. The thumb pair is DELETED rather than renamed: the scrubber recipe's
   thumb is `width: 0; opacity: 0` by contract — its leading edge IS the handle —
   so a thumb colour is uncolourable by construction. And the range pair loses
   its `30%`/`45%` wrappers: the producer already dilutes the tint to 88%
   (`--liquid-fill-strength`), so a rename-only cure would have shipped net
   α 0.264 and dropped the fill from 11.51:1 to 1.51:1 against its own track —
   a 1.4.11 regression landed under a green token-sweep gate. Full strength is
   the corrected cure and it is asserted, both arms, at
   `e2e/slider-scrub-contrast.spec.ts`.

   ⊘ `R-1`'s `D-14` rider: the fallback is explicit, so an unset `--track-color`
   degrades to the producer's own capsule instead of to an invalid value.
*/
.basis-slider-track {
    --slider-range-bg: var(--track-color, var(--glass-capsule-warm));
}
</style>
