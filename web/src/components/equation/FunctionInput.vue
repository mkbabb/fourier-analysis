<script setup lang="ts">
import { computed } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { Input } from "@mkbabb/glass-ui/input";
import { LabeledField } from "@mkbabb/glass-ui/labeled-field";
import { ConfiguratorLayer } from "@mkbabb/glass-ui/configurator";
import { ToggleGroup, ToggleGroupItem } from "@mkbabb/glass-ui/toggle-group";
import { PRESETS } from "@/lib/equation/presets";
import type { NotationMode, PresetFunction } from "@/lib/equation/types";
import { Wand2, Play } from "@lucide/vue";
import SliderControl from "@/components/ui/SliderControl.vue";
import { Tooltip } from "@/components/ui/tooltip";
import NotationPills from "@/components/shared/NotationPills.vue";

const props = defineProps<{
    effectiveN?: number;
    energyCaptured?: number;
    autoHarmonics?: boolean;
    /** The actual number of harmonics being visualized (may differ from nHarmonics when auto is on) */
    vizHarmonics?: number;
    /**
     * X.F.W14U.eq — UIA-F-112 / F-113: the server's typed 4xx `detail` for the
     * current expression (a parse failure, an unknown function, a free symbol, a
     * non-finite constant), shown under the field that caused it.
     */
    expressionError?: string | null;
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
/*
 * X.F.W14U.eq — UIA-F-35, the consumer half. The server's budget counts
 * HARMONICS (whole ±n groups, DC as one; `.srv` `798c98f`), so showing every
 * harmonic the plot draws plus the DC term takes N + 1, and the control is
 * named for the unit it moves.
 */
const displayTermsMax = computed(() => Math.max(2, (props.vizHarmonics ?? nHarmonics.value) + 1));
const displayTerms = computed(() => Math.min(budget.value, displayTermsMax.value));

function onDisplayTerms(v: number) {
    budget.value = Math.max(2, Math.min(displayTermsMax.value, v));
}

/** UIA-F-204 — Presets are a one-of-N ToggleGroup; choosing one applies it. */
function onPreset(name: unknown) {
    const preset = PRESETS.find((p) => p.name === name);
    if (preset) applyPreset(preset);
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
    <!-- X.F.W14U.eq — UIA-F-114 ⊕ F-207: the column's sections are glass
         `ConfiguratorLayer`s, the idiom the Coefficients layer below already
         wears (and `/w`'s controls wear), so the three siblings stack as one
         group in one register. The local `CollapsibleSection` (a cartoon-card
         fork of the layer's header whose `overflow: hidden` cut every button's
         shadow into a hard rectangle) is deleted. Two roots, no wrapper: the
         layers must be adjacent siblings of the Coefficients layer for glass's
         stacked-group rule (`.configurator-layer + .configurator-layer`). -->
    <ConfiguratorLayer label="Function" sub="f(x)" :default-open="true">
        <div class="space-y-body py-1">
            <!-- UIA-F-112 / F-113 — the field carries the server's typed 4xx: glass
                 `LabeledField`'s `invalid` + error slot (aria-invalid, the detail
                 wired into aria-describedby, a polite live region). The field is
                 where the user types at every width, so a failure is visible from
                 the Controls pane at 390 as well. -->
            <LabeledField label="Expression" :invalid="!!expressionError">
                <template #default="{ controlId, describedBy, invalid }">
                    <Input
                        :id="controlId"
                        type="text"
                        v-model="expression"
                        class="w-full fira-code"
                        placeholder="e.g. x*(pi - x)  or  sin(2*x) + cos(3*x)"
                        spellcheck="false"
                        autocomplete="off"
                        :invalid="invalid"
                        :aria-invalid="invalid || undefined"
                        :aria-describedby="describedBy"
                        @keydown.enter="emit('compute')"
                    />
                </template>
                <template #error>{{ expressionError }}</template>
            </LabeledField>
            <div class="flex items-center gap-2">
                <label for="fn-domain-start" class="text-small font-medium text-foreground shrink-0">Domain</label>
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
                <span class="text-small text-muted-foreground">to</span>
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
            <!-- `D·D-m6` — Compute with an empty expression is disabled, not dead. -->
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
            <!-- UIA-F-204 — a one-of-N set is glass's `ToggleGroup type="single"`
                 (a radiogroup of radios), the chooser its neighbours use, not
                 Buttons carrying `aria-pressed`. -->
            <div class="border-t border-border/40 pt-3">
                <p id="fn-presets-label" class="text-small font-medium text-foreground mb-atom">Presets</p>
                <!-- The per-preset hover Tooltip is not layered on the radios (a
                     TooltipTrigger stamps its own `data-state` over the item's);
                     the chosen preset's description is the group's caption. -->
                <ToggleGroup type="single" size="sm" aria-labelledby="fn-presets-label"
                    :aria-describedby="activePreset ? 'fn-preset-description' : undefined"
                    class="preset-group" :model-value="activePreset?.name" @update:model-value="onPreset">
                    <ToggleGroupItem v-for="preset in PRESETS" :key="preset.name" :value="preset.name"
                        class="preset-item">{{ preset.name }}</ToggleGroupItem>
                </ToggleGroup>
                <p v-if="activePreset" id="fn-preset-description" class="preset-caption text-caption text-muted-foreground">
                    {{ activePreset.description }}
                </p>
            </div>
        </div>
    </ConfiguratorLayer>
    <ConfiguratorLayer label="Controls" sub="harmonics & display" :default-open="true">
        <div class="space-y-body py-1">
            <div class="harmonics-row">
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
                    <!-- `D·D-B2` — the Tooltip is a description, never a name. -->
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
                            <p v-if="effectiveN" class="mt-1 fira-code">
                                N<sub>eff</sub> = {{ effectiveN }}
                                <span v-if="energyCaptured"> · {{ (energyCaptured * 100).toFixed(1) }}% energy</span>
                            </p>
                        </div>
                    </template>
                </Tooltip>
            </div>
            <!-- UIA-F-35 (consumer) — the budget counts harmonics, DC as one. -->
            <SliderControl
                label="Displayed harmonics"
                subtitle="in the a + b view · DC counts as one"
                :model-value="displayTerms"
                :min="2" :max="displayTermsMax" :step="1"
                color="var(--viz-fourier)"
                @update:model-value="onDisplayTerms"
            />
            <div>
                <p class="text-small font-medium text-foreground mb-atom">Notation</p>
                <NotationPills v-model="notation" />
            </div>
        </div>
    </ConfiguratorLayer>
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
.preset-group {
    flex-wrap: wrap;
}
.preset-caption {
    margin-top: var(--space-atom);
}
/* The pressed preset keeps the Fourier hue (addendum (g)): glass's own
   `data-state`, retinted per instance as `BasisSelector`'s `.basis-chip`. */
.preset-item[data-state="on"] {
    background-color: color-mix(in srgb, var(--viz-fourier) 12%, transparent);
    color: color-mix(in oklab, var(--viz-fourier) 75%, var(--foreground));
}
/* UIA-F-206 — the Parseval button belongs to the Harmonics row: beside the
   field while the row has room, wrapped below it (never out of the row) when
   it has not. */
.harmonics-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--space-atom) 0.5rem;
}
.harmonics-row > :first-child {
    min-width: min(15rem, 100%);
}
.is-auto-active {
    color: var(--viz-amber) !important;
    border-color: color-mix(in srgb, var(--viz-amber) 40%, transparent) !important;
    background: color-mix(in srgb, var(--viz-amber) 8%, transparent) !important;
}
.auto-calc-tip {
    max-width: 220px;
    font-size: var(--type-caption);
    line-height: var(--type-leading-caption);
}
</style>
