<script setup lang="ts">
import { computed } from "vue";
import { Button } from "@mkbabb/glass-ui";
import { PRESETS } from "@/lib/equation/presets";
import type { NotationMode, PresetFunction } from "@/lib/equation/types";
import { Wand2, Play } from "lucide-vue-next";
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
                        <input
                            id="fn-expression"
                            type="text"
                            v-model="expression"
                            @keydown.enter="emit('compute')"
                            class="w-full px-2.5 py-2 rounded-lg text-sm
                                   fira-code bg-muted/40 border-[1.5px] border-border/50
                                   text-foreground outline-none
                                   transition-colors focus:border-primary/50
                                   placeholder:text-muted-foreground/50"
                            placeholder='e.g. x*(pi - x)  or  sin(2*x) + cos(3*x)'
                            spellcheck="false"
                            autocomplete="off"
                        />
                    </div>

                    <div class="flex items-center gap-2">
                        <label for="fn-domain-start" class="text-sm font-medium text-muted-foreground shrink-0">Domain</label>
                        <input
                            id="fn-domain-start"
                            type="text"
                            aria-label="Domain start"
                            :value="formatDomain(domainStart)"
                            @change="onDomainInput($event, (v) => domainStart = v)"
                            class="w-20 px-1.5 py-1 rounded-md text-sm text-center
                                   fira-code bg-muted/40 border-[1.5px] border-border/50
                                   text-foreground outline-none
                                   transition-colors focus:border-primary/50"
                            placeholder="0"
                        />
                        <span class="text-sm text-muted-foreground">to</span>
                        <input
                            type="text"
                            aria-label="Domain end"
                            :value="formatDomain(domainEnd)"
                            @change="onDomainInput($event, (v) => domainEnd = v)"
                            class="w-20 px-1.5 py-1 rounded-md text-sm text-center
                                   fira-code bg-muted/40 border-[1.5px] border-border/50
                                   text-foreground outline-none
                                   transition-colors focus:border-primary/50"
                            placeholder="2π"
                        />
                    </div>

                    <!-- Compute button -->
                    <Button
                        variant="default"
                        size="sm"
                        class="compute-btn"
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
                                    variant="outline"
                                    size="sm"
                                    class="preset-pill"
                                    :class="{ 'is-active': activePreset?.name === preset.name }"
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
                            <Button
                                variant="glass"
                                size="icon"
                                :class="{ 'is-auto-active': autoHarmonics }"
                                :disabled="!effectiveN"
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
                        :model-value="Math.min(budget, vizHarmonics ?? nHarmonics)"
                        :min="2" :max="Math.max(2, vizHarmonics ?? nHarmonics)" :step="1"
                        color="var(--viz-fourier)"
                        @update:model-value="budget = $event"
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
.preset-pill.is-active {
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
