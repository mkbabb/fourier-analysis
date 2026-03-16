<script setup lang="ts">
import type { EquationDisplayMode } from "@/lib/equation/types";

const model = defineModel<EquationDisplayMode>({ required: true });
</script>

<template>
    <div class="eq-toggle">
        <button
            class="eq-toggle-btn"
            :class="{ 'is-active': model === 'sigma' }"
            title="Sigma notation (compact)"
            @click="model = 'sigma'"
        >
            <span class="eq-toggle-icon">&Sigma;</span>
        </button>
        <button
            class="eq-toggle-btn"
            :class="{ 'is-active': model === 'expanded' }"
            title="Expanded terms"
            @click="model = 'expanded'"
        >
            <span class="eq-toggle-icon eq-toggle-icon--mono">a + b</span>
        </button>
    </div>
</template>

<style scoped>
.eq-toggle {
    display: flex;
    border-radius: 9999px;
    border: 1.5px solid hsl(var(--foreground) / 0.1);
    background: hsl(var(--background) / 0.6);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
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
    color: hsl(var(--muted-foreground));
    cursor: pointer;
    transition: all 0.15s ease;
    border: none;
    background: transparent;
    position: relative;
}

.eq-toggle-btn:hover {
    color: hsl(var(--foreground));
}

/* Active: golden accent */
.eq-toggle-btn.is-active {
    color: #f0b632;
    background: hsl(var(--foreground) / 0.08);
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
