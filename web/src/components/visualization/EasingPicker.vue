<script setup lang="ts">
import { useAnimationStore, EASING_OPTIONS, getEasingSVGPath, type EasingName } from "@/stores/animation";

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
                <svg viewBox="-0.05 -0.3 1.1 1.6" class="easing-curve-svg">
                    <path
                        :d="getEasingSVGPath(key as EasingName)"
                        fill="none"
                        class="easing-curve-path"
                        stroke-width="0.15"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
                <span class="easing-chip-label">{{ opt.label }}</span>
            </button>
        </div>
    </div>
</template>

<style scoped>
.easing-section {
    padding: 0.375rem 0.5rem;
    border-bottom: 1px solid hsl(var(--border) / 0.5);
    margin-bottom: 0.125rem;
    padding-bottom: 0.5rem;
}
.easing-heading {
    display: block;
    font-size: 0.6875rem;
    font-weight: 500;
    color: hsl(var(--muted-foreground));
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
    background: hsl(var(--muted));
}
.easing-chip.is-active {
    border-color: hsl(248 88% 71% / 0.6);
    background: hsl(248 88% 71% / 0.08);
}
.easing-curve-svg {
    width: 1.75rem;
    height: 1.25rem;
    flex-shrink: 0;
}
.easing-curve-path {
    stroke: hsl(var(--muted-foreground));
    transition: stroke 0.15s;
}
.easing-chip:hover .easing-curve-path,
.easing-chip.is-active .easing-curve-path {
    stroke: hsl(248 88% 71%);
}
.easing-chip-label {
    font-size: 0.5625rem;
    font-weight: 500;
    color: hsl(var(--muted-foreground));
    line-height: 1;
    transition: color 0.15s;
}
.easing-chip.is-active .easing-chip-label {
    color: hsl(248 88% 71%);
}
</style>
