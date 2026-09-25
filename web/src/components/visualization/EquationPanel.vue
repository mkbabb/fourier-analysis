<script setup lang="ts">
import { ref, computed, useId } from "vue";
import { useEventListener, watchDebounced } from "@vueuse/core";
import { useWorkspaceStore } from "@/stores/workspace";
import type { NotationMode } from "@/lib/equation/types";
import SliderControl from "@/components/ui/SliderControl.vue";
import NotationPills from "@/components/shared/NotationPills.vue";
import EquationResult from "@/components/equation/EquationResult.vue";
import { useSimplifiedSeries } from "@/components/equation/composables/useSimplifiedSeries";
import { X } from "@lucide/vue";
import { Button } from "@mkbabb/glass-ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@mkbabb/glass-ui/card";
import { Metric } from "@mkbabb/glass-ui/metric";
import { Progress } from "@mkbabb/glass-ui/progress";

const emit = defineEmits<{ close: [] }>();

const store = useWorkspaceStore();
const notation = ref<NotationMode>("trig");
const budget = ref(6);

/* X.F.W14V.au3 — A2-FO-L1-5: the simplify flow is the /equation route's own
   (`useSimplifiedSeries`), and the body is its renderer (`EquationResult`), so
   the panel inherits the Copy, the keyboard-reachable region and the safe-centre
   overflow fix instead of re-implementing them beside the route. */
const series = useSimplifiedSeries(computed(() => store.epicycleData?.components ?? []), { notation, budget });
const { latex, energy, loading, error } = series;

const titleId = useId();

/*
 * X.F.W14U.vedit — UIA-F-177: the panel is a non-modal dialog named by its
 * title. Escape dismissed it only with focus inside; it now dismisses it from
 * anywhere on the page, unless something nearer (a menu, a popover) already
 * took the key.
 */
useEventListener(document, "keydown", (e: KeyboardEvent) => {
    if (e.key === "Escape" && !e.defaultPrevented) emit("close");
});

watchDebounced(
    () => [store.epicycleData, budget.value, notation.value] as const,
    () => series.simplify(),
    { debounce: 300, immediate: true },
);
</script>

<template>
    <!-- X.F.W11.c (COHESION §0ao OA-1) — the panel's plate is the producer's
         `Card` (tier `floating`: it floats over the canvas).
         X.F.W14U.vedit — UIA-F-177: a labelled non-modal dialog; the title is
         glass's CardTitle, the close is glass's icon rung (the class literals
         that made a 24×40 capsule are gone), and a refetch keeps the equation
         on screen under glass's indeterminate Progress (the hand-rolled spinner
         replaced the equation and resized the panel; UIA-F-71's ring).
         UIA-F-178: the fit is a measurement, so its Metric keeps glass's own
         ink (it painted the destructive red below 95%, so the Fourier-red
         Terms track beside it read as an error too); the track keeps the
         Fourier hue, the control's owner (F-W14U addendum (g), §0da). UIA-F-83 ⊕ F-176: every term the
         budget keeps is reachable through glass's FadingScroll, whose edge
         fades say there is more; since X.F.W14V.au3 (A2-FO-L1-5) that scroller
         is EquationResult's, the one series renderer both views mount. -->
    <!-- The dialog role sits on the host: glass Card binds its own `role`
         (`option` when selectable, else none), so a role passed to it is
         dropped. -->
    <section class="eq-panel" role="dialog" :aria-labelledby="titleId" tabindex="-1">
    <Card tier="floating" size="sm" class="eq-card">
        <CardHeader class="flex flex-row items-center justify-between gap-2">
            <CardTitle :id="titleId" as="h2" class="font-serif-math">Equation</CardTitle>
            <div class="flex items-center gap-2">
                <Metric
                    :value="(energy * 100).toFixed(1)"
                    unit="%"
                    size="sm"
                    aria-label="Energy captured"
                />
                <Button
                    emphasis="quiet"
                    size="sm"
                    icon-only
                    aria-label="Close equation panel"
                    @click="emit('close')"
                >
                    <X />
                </Button>
            </div>
        </CardHeader>

        <CardContent class="flex flex-col gap-body">
            <div class="flex flex-col gap-body">
                <NotationPills v-model="notation" />
                <SliderControl
                    label="Terms"
                    :model-value="budget"
                    :min="2" :max="20" :step="1"
                    color="var(--viz-fourier)"
                    @update:model-value="budget = $event"
                />
            </div>

            <div class="eq-body" :aria-busy="loading">
                <div v-if="loading" class="eq-busy" role="status">
                    <Progress :model-value="null" size="sm" aria-label="Simplifying the equation" />
                </div>
                <p v-if="error" role="alert" class="text-caption text-destructive">{{ error }}</p>
                <EquationResult v-else :latex="latex" dense />
            </div>
        </CardContent>
    </Card>
    </section>
</template>

<style scoped>
@reference "tailwindcss";
/* UIA-F-177: the panel opens below the canvas dock, never over it. Its top is
   the dock anchor's own 0.5rem inset plus the producer's dock height
   (`--dock-h`) and one atom of air; the literal 3.5rem sat 8 px inside the
   dock plate, which at 390 spans the stage. */
.eq-panel {
    position: absolute;
    z-index: var(--z-controls);
    top: calc(0.5rem + var(--dock-h) + var(--space-atom));
    left: 0.5rem;
    max-width: min(28rem, calc(100% - 1rem));
}

/* The body holds its height while a refetch runs: the busy bar rides over
   the equation, never in its place (UIA-F-177). */
.eq-body {
    position: relative;
    min-block-size: 2.5rem;
}

.eq-busy {
    position: absolute;
    inset-inline: 0;
    inset-block-start: 0;
}
</style>
