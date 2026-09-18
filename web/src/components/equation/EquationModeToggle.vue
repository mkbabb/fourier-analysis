<script setup lang="ts">
import { Button } from "@mkbabb/glass-ui/button";
import type { EquationDisplayMode } from "@/lib/equation/types";

const model = defineModel<EquationDisplayMode>({ required: true });
</script>

<template>
    <!-- `D·D-M12` — the two states were signalled by COLOUR ALONE
         (`is-active` → amber + an 8% wash), with `title=` as the only label, on a
         primitive whose CVA already ships `aria-pressed:` arms and whose house
         pattern is documented three files away. `aria-pressed` is the one
         attribute the sanctioned mechanism needs, and it gives AT the state the
         paint was carrying by itself. -->
    <div class="eq-toggle-frame">
        <div class="eq-toggle glass-wash" role="group" aria-label="Equation display mode">
            <Button
                emphasis="quiet"
                size="sm"
                class="eq-toggle-btn"
                :class="{ 'is-active': model === 'sigma' }"
                :aria-pressed="model === 'sigma'"
                aria-label="Sigma notation (compact)"
                title="Sigma notation (compact)"
                @click="model = 'sigma'"
            >
                <span class="eq-toggle-icon" aria-hidden="true">&Sigma;</span>
            </Button>
            <Button
                emphasis="quiet"
                size="sm"
                class="eq-toggle-btn"
                :class="{ 'is-active': model === 'expanded' }"
                :aria-pressed="model === 'expanded'"
                aria-label="Expanded terms"
                title="Expanded terms"
                @click="model = 'expanded'"
            >
                <span class="eq-toggle-icon eq-toggle-icon--mono" aria-hidden="true">a + b</span>
            </Button>
        </div>
    </div>
</template>

<style scoped>
/* `M-FR` — the focus ring was CLIPPED off both buttons. glass-ui's Button CVA
   carries `focus-ring`, whose recipe is `outline: none` plus a purely OUTSET
   `box-shadow` (2px ring + 8px glow), and an `overflow: hidden` ancestor clips a
   descendant's box-shadow while the native outline fallback is already deleted —
   so keyboard focus on Σ / a+b was invisible at the outer boundary. `overflow:
   clip` does not help. The pill's rounded clip is kept; the ring now has a frame
   to land in. */
.eq-toggle-frame {
    padding: 4px;
    display: inline-flex;
}

.eq-toggle {
    display: flex;
    border-radius: 9999px;
    overflow: hidden;
    transition:
        border-color 0.15s ease;
}

.eq-toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 0.6rem;
    height: 2.25rem;
    font-weight: 600;
    color: var(--muted-foreground);
    cursor: pointer;
    /* A.W3.d — named properties + canonical token, no `transition: all`. */
    transition: color 0.15s var(--ease-standard), background-color 0.15s var(--ease-standard);
    border: none;
    background: transparent;
    position: relative;
}

.eq-toggle-btn:hover {
    color: var(--foreground);
}

/* Active: golden accent */
.eq-toggle-btn.is-active {
    color: var(--viz-amber);
    background: color-mix(in srgb, var(--foreground) 8%, transparent);
}

.eq-toggle-icon {
    font-size: 16px;
    font-family: "Computer Modern Serif", Georgia, serif;
    font-style: italic;
}

.eq-toggle-icon--mono {
    font-family: "Fira Code", monospace;
    font-size: 11px;
    font-style: normal;
    letter-spacing: -0.5px;
}
</style>
