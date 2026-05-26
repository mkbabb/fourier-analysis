<script setup lang="ts">
import { useAnimationStore, EASING_OPTIONS, type EasingName } from "@/stores/animation";
import EasingCurvePreview from "./EasingCurvePreview.vue";

const anim = useAnimationStore();
</script>

<template>
    <div class="easing-section">
        <span class="easing-heading">Easing</span>
        <div class="easing-grid">
            <button
                v-for="(opt, key) in EASING_OPTIONS"
                :key="key"
                class="easing-chip"
                :class="{ 'is-active': anim.easing === key }"
                @click="anim.easing = key as EasingName"
            >
                <EasingCurvePreview
                    :easing="(key as EasingName)"
                    :size="28"
                    :color="anim.easing === key ? 'var(--easing-accent)' : 'var(--muted-foreground)'"
                />
                <span class="easing-chip-label">{{ opt.label }}</span>
            </button>
        </div>
    </div>
</template>

<style scoped>
@reference "tailwindcss";

/* `--easing-accent` is the viz-easing accent colour. Filed upstream as a
   glass-ui `--viz-easing` token; see `coordination/CONSTELLATION.md`.
   Until that lands, the carry lives here because EasingPicker is the
   sole in-tree consumer. */
.easing-section {
    --easing-accent: hsl(248 88% 71%);
    padding: 0.375rem 0.5rem;
    border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
    margin-bottom: 0.125rem;
    padding-bottom: 0.5rem;
}
.easing-heading {
    display: block;
    @apply text-sm;
    font-weight: 500;
    color: var(--muted-foreground);
    margin-bottom: 0.375rem;
    letter-spacing: 0.02em;
}
.easing-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.25rem;
}
.easing-chip {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.125rem;
    padding: 0.375rem 0.25rem 0.25rem;
    border-radius: 0.5rem;
    border: 1.5px solid transparent;
    background: none;
    cursor: pointer;
    transition: all 0.15s;
}
.easing-chip:hover {
    background: var(--muted);
}
.easing-chip.is-active {
    border-color: color-mix(in srgb, var(--easing-accent) 60%, transparent);
    background: color-mix(in srgb, var(--easing-accent) 8%, transparent);
}
.easing-chip-label {
    font-size: 0.5625rem;
    font-weight: 500;
    color: var(--muted-foreground);
    line-height: 1;
    transition: color 0.15s;
}
.easing-chip.is-active .easing-chip-label {
    color: var(--easing-accent);
}
</style>
