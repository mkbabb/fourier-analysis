<script setup lang="ts">
import { computed } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { Input } from "@mkbabb/glass-ui/input";
import { PRESETS } from "@/lib/equation/presets";
import type { NotationMode, PresetFunction } from "@/lib/equation/types";
import { Wand2, Play } from "@lucide/vue";
import CollapsibleSection from "@/components/ui/CollapsibleSection.vue";
import SliderControl from "@/components/ui/SliderControl.vue";
import { Tooltip } from "@/components/ui/tooltip";
import NotationPills from "./NotationPills.vue";

const props = defineProps<{
    effectiveN?: number;
    energyCaptured?: number;
    autoHarmonics?: boolean;
    /** The actual number of harmonics being visualized (may differ from nHarmonics when auto is on) */
    vizHarmonics?: number;
}>();

const emit = defineEmits<{
    "update:autoHarmonics": [value: boolean];
    compute: [];
}>();

const expression = defineModel<string>("expression", { default: "" });
const domainStart = defineModel<number>("domainStart", { default: 0 });
const domainEnd = defineModel<number>("domainEnd", { default: 2 * Math.PI });
const nHarmonics = defineModel<number>("nHarmonics", { default: 20 });
const budget = defineModel<number>("budget", { default: 10 });
const notation = defineModel<NotationMode>("notation", { default: "trig" });

function toggleAuto() {
    emit("update:autoHarmonics", !props.autoHarmonics);
}

function applyPreset(preset: PresetFunction) {
    expression.value = preset.expression;
    domainStart.value = preset.domain[0];
    domainEnd.value = preset.domain[1];
    emit("compute");
}

/** Parse domain strings like "pi", "π", "2π", "-pi/2", "3.14". */
function parseDomainValue(raw: string): number | null {
    const s = raw.trim().replace(/π/g, "pi").replace(/\s+/g, "");
    if (!s) return null;
    const m = s.match(/^([+-]?\d*\.?\d*)\*?pi(?:\/(\d+))?$/);
    if (m) {
        const coeff = m[1] === "" || m[1] === "+" ? 1 : m[1] === "-" ? -1 : parseFloat(m[1]);
        const denom = m[2] ? parseInt(m[2]) : 1;
        return (coeff * Math.PI) / denom;
    }
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
}

function onDomainInput(e: Event, setter: (v: number) => void) {
    const val = parseDomainValue((e.target as HTMLInputElement).value);
    if (val !== null) setter(val);
}

function formatDomain(val: number): string {
    const r = val / Math.PI;
    if (Math.abs(r) < 1e-10) return "0";
    if (Math.abs(r - 1) < 1e-10) return "π";
    if (Math.abs(r + 1) < 1e-10) return "-π";
    if (Math.abs(r - 2) < 1e-10) return "2π";
    if (Math.abs(r + 2) < 1e-10) return "-2π";
    for (const d of [2, 3, 4, 6]) {
        const n = Math.round(r * d);
        if (Math.abs(r - n / d) < 1e-10 && n !== 0) {
            const sign = n < 0 ? "-" : "";
            const abs = Math.abs(n);
            return abs === 1 ? `${sign}π/${d}` : `${sign}${abs}π/${d}`;
        }
    }
    return val.toFixed(4).replace(/\.?0+$/, "");
}

/**
 * `FI-N-5` — the Display-terms control clamped on READ and not on WRITE, so it
 * DISPLAYED a number the component would not SEND. The two now agree: one bound,
 * used by the model, the slider's `:max`, and the write.
 */
const displayTermsMax = computed(() => Math.max(2, props.vizHarmonics ?? nHarmonics.value));
const displayTerms = computed(() => Math.min(budget.value, displayTermsMax.value));

function onDisplayTerms(v: number) {
    budget.value = Math.max(2, Math.min(displayTermsMax.value, v));
}

const activePreset = computed(() =>
    PRESETS.find(
        (p) =>
            p.expression === expression.value &&
            Math.abs(p.domain[0] - domainStart.value) < 1e-6 &&
            Math.abs(p.domain[1] - domainEnd.value) < 1e-6,
    ),
);
</script>

<template>
    <div class="space-y-3">
        <!-- Function definition -->
        <div class="cartoon-card px-3 py-2">
            <CollapsibleSection title="Function" subtitle="f(x)" :default-open="true">
                <div class="space-y-3 pt-1">
                    <div>
                        <label for="fn-expression" class="text-sm font-medium text-muted-foreground mb-1 block">Expression</label>
                        <!-- X.F.W3 `.d` — `fr-AdminUserList FR-AUL-6`'s
                             consumer limb (`fr-FunctionInput D-1` + `C-5`, ⊕
                             `FR-GSB-10`/`FR-GSB-12`). Three raw `<input>`s
                             carrying `outline-none` over a hand-rolled recipe
                             core: the focus indicator was ANNIHILATED under
                             forced-colors — Tailwind v4's `.outline-hidden`
                             (which preserves a forced-colors outline) is absent
                             from this build, so `outline-none` is the v3
                             `outline: 2px solid transparent` and nothing
                             repaints it — and the `focus:`-not-`focus-visible:`
                             border swap fired on pointer focus too.

                             ▲ THE CENSUS TARGET MOVED AND IS RE-SEATED, NOT
                             ASSUMED: the row prescribes `./forms`, and `./forms`
                             is NOT an export of the adopted pin — the 70-key
                             export map has no such key, and `g12`'s own probe
                             over `web/src` returns ZERO importers. (That probe's
                             literal is deliberately NOT written out here: a
                             comment quoting a grep pattern becomes a hit for it,
                             and a detector its own subject can contaminate is
                             the defect `g17` states inline for the forbidden
                             totals. Measured, not quoted.) `X-EXT-2` re-seats
                             the target to `./input`, which IS exported and IS
                             the `input-pill` recipe the row names — one of the
                             nine forced-colors-restored selectors. `g12`'s
                             `./forms` leg can therefore only ever close in state
                             (b), and this unit hands `.f` that row.

                             `FR-GSB-12`'s tokened placeholder rides too: the
                             bespoke `placeholder:text-muted-foreground/50`
                             (an alpha-mute of an already-muted ink, measured at
                             2.02:1) is dropped for the primitive's own. -->
                        <Input
                            id="fn-expression"
                            type="text"
                            v-model="expression"
                            class="w-full fira-code"
                            placeholder="e.g. x*(pi - x)  or  sin(2*x) + cos(3*x)"
                            spellcheck="false"
                            autocomplete="off"
                            @keydown.enter="emit('compute')"
                        />
                    </div>

                    <div class="flex items-center gap-2">
                        <label for="fn-domain-start" class="text-sm font-medium text-muted-foreground shrink-0">Domain</label>
                        <Input
                            id="fn-domain-start"
                            type="text"
                            size="sm"
                            aria-label="Domain start"
                            :model-value="formatDomain(domainStart)"
                            class="w-20 text-center fira-code"
                            placeholder="0"
                            @change="onDomainInput($event, (v) => domainStart = v)"
                        />
                        <span class="text-sm text-muted-foreground">to</span>
                        <Input
                            type="text"
                            size="sm"
                            aria-label="Domain end"
                            :model-value="formatDomain(domainEnd)"
                            class="w-20 text-center fira-code"
                            placeholder="2π"
                            @change="onDomainInput($event, (v) => domainEnd = v)"
                        />
                    </div>

                    <!-- Compute button -->
                    <!-- `D·D-m6` — Compute with an empty expression was a dead
                         button: the handler bare-returns, with no `:disabled` and
                         no message. -->
                    <Button
                        emphasis="primary"
                        size="sm"
                        class="compute-btn"
                        :disabled="!expression.trim()"
                        @click="emit('compute')"
                    >
                        <Play class="h-3.5 w-3.5" />
                        <span>Compute</span>
                    </Button>

                    <!-- Presets -->
                    <div class="border-t border-border/40 pt-3">
                        <label class="text-sm font-medium text-muted-foreground mb-1.5 block">Presets</label>
                        <div class="flex flex-wrap gap-1.5">
                            <Tooltip v-for="preset in PRESETS" :key="preset.name" :text="preset.description">
                                <Button
                                    emphasis="secondary"
                                    size="sm"
                                    class="preset-pill"
                                    :aria-pressed="activePreset?.name === preset.name"
                                    @click="applyPreset(preset)"
                                >
                                    {{ preset.name }}
                                </Button>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            </CollapsibleSection>
        </div>

        <!-- Controls -->
        <div class="cartoon-card px-3 py-2">
            <CollapsibleSection title="Controls" subtitle="harmonics & display" :default-open="true">
                <div class="space-y-3 pt-1">
                    <div class="flex items-end gap-2">
                        <SliderControl
                            class="flex-1"
                            label="Harmonics"
                            subtitle="terms in the Fourier sum"
                            :model-value="autoHarmonics && vizHarmonics ? vizHarmonics : nHarmonics"
                            :min="1" :max="100" :step="1"
                            color="var(--viz-fourier)"
                            @update:model-value="(v: number) => { nHarmonics = v; emit('update:autoHarmonics', false); }"
                        />
                        <Tooltip side="bottom">
                            <!-- `D·D-B2` (second nameless control in the same
                                 subtree) — the Tooltip supplies a DESCRIPTION, and a
                                 description is never a name. `C·D-22`: the old
                                 `:disabled="!effectiveN"` could never fire from
                                 either end — the ref is seeded to 20 and
                                 `compute_effective_n(minimum=3)` returns ≥ 3 on every
                                 server path, including `total_energy <= 0`. -->
                            <Button
                                emphasis="primary"
                                size="md" icon-only
                                aria-label="Auto-select harmonics by Parseval energy"
                                :aria-pressed="autoHarmonics"
                                :class="{ 'is-auto-active': autoHarmonics }"
                                @click="toggleAuto"
                            >
                                <Wand2 class="h-4.5 w-4.5" />
                            </Button>
                            <template #content>
                                <div class="auto-calc-tip">
                                    <p class="font-semibold mb-1">Auto (Parseval's theorem)</p>
                                    <p class="text-muted-foreground">
                                        Sets N to the minimum harmonics capturing
                                        ≥99.99% of total energy ‖f‖².
                                    </p>
                                    <p v-if="effectiveN" class="mt-1 fira-code text-xs">
                                        N<sub>eff</sub> = {{ effectiveN }}
                                        <span v-if="energyCaptured"> · {{ (energyCaptured * 100).toFixed(1) }}% energy</span>
                                    </p>
                                </div>
                            </template>
                        </Tooltip>
                    </div>
                    <SliderControl
                        label="Display terms"
                        subtitle="shown in expanded (a+b) view"
                        :model-value="displayTerms"
                        :min="2" :max="displayTermsMax" :step="1"
                        color="var(--viz-fourier)"
                        @update:model-value="onDisplayTerms"
                    />
                    <div>
                        <label class="text-sm font-medium text-muted-foreground mb-1.5 block">Notation</label>
                        <NotationPills v-model="notation" />
                    </div>
                </div>
            </CollapsibleSection>
        </div>
    </div>
</template>

<style scoped>
.compute-btn {
    width: 100%;
}
.compute-btn:hover {
    border-color: color-mix(in srgb, var(--viz-fourier) 50%, transparent);
    background: color-mix(in srgb, var(--viz-fourier) 8%, transparent);
    color: var(--viz-fourier);
}

.preset-pill {
    border-radius: 9999px;
}
/* X.F.W3 repair 1 — the published active-state vocabulary, applied
   (`FR-COB-3`). A preset pill is a selected option in a set, and this set has no
   primitive under it to lend its own `data-state`: the pills are plain
   `Button`s, and anti-cure 3 kills `role="radiogroup"` (it ships an
   axe-critical `aria-required-children` and announces an APG contract this tree
   does not implement). The channel is therefore `aria-pressed`, exactly as the
   sibling pill sets in `BasisSelector.vue` and `GallerySearchBar.vue` already
   use it, and the paint keys on that same attribute instead of on a class that
   announced nothing. */
.preset-pill[aria-pressed="true"] {
    background: color-mix(in srgb, var(--viz-fourier) 12%, transparent);
    border-color: color-mix(in srgb, var(--viz-fourier) 40%, transparent);
    color: var(--viz-fourier);
}

.is-auto-active {
    color: var(--viz-amber) !important;
    border-color: color-mix(in srgb, var(--viz-amber) 40%, transparent) !important;
    background: color-mix(in srgb, var(--viz-amber) 8%, transparent) !important;
}

.auto-calc-tip {
    max-width: 220px;
    font-size: 12px;
    line-height: 1.4;
}
</style>
