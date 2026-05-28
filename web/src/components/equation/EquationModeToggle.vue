<script setup lang="ts">
import { Button } from "@mkbabb/glass-ui";
import type { EquationDisplayMode } from "@/lib/equation/types";

const model = defineModel<EquationDisplayMode>({ required: true });
</script>

<template>
    <div class="eq-toggle glass-subtle">
        <Button
            variant="ghost"
            size="sm"
            class="eq-toggle-btn"
            :class="{ 'is-active': model === 'sigma' }"
            title="Sigma notation (compact)"
            @click="model = 'sigma'"
        >
            <span class="eq-toggle-icon">&Sigma;</span>
        </Button>
        <Button
            variant="ghost"
            size="sm"
            class="eq-toggle-btn"
            :class="{ 'is-active': model === 'expanded' }"
            title="Expanded terms"
            @click="model = 'expanded'"
        >
            <span class="eq-toggle-icon eq-toggle-icon--mono">a + b</span>
        </Button>
    </div>
</template>

<style scoped>
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
