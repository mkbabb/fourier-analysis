<template>
    <div class="demo-stage">
        <div class="stage-row">
            <button class="morph-button cartoon-card" @click="$emit('toggle')" :disabled="disabled">
                <FourierMorphSvg
                    :path="currentPath"
                    :stroke-width="4.5"
                    view-box="0 0 200 200"
                />
            </button>

            <!-- Desktop: info chips stacked beside button -->
            <div class="demo-info desktop-info">
                <div class="info-chip" :class="phase">
                    {{ phase }}
                </div>
                <div class="info-chip">
                    n={{ harmonicLevel }}
                </div>
                <div class="info-chip">
                    {{ shapeName }}
                </div>
                <div class="info-chip">
                    {{ totalMs }}ms
                </div>
            </div>
        </div>

        <!-- Mobile: info chips inline below button -->
        <div class="demo-info mobile-info">
            <div class="info-chip" :class="phase">
                {{ phase }}
            </div>
            <div class="info-chip">
                n={{ harmonicLevel }}
            </div>
            <div class="info-chip">
                {{ shapeName }}
            </div>
            <div class="info-chip">
                {{ totalMs }}ms
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import FourierMorphSvg from "@/components/decorative/FourierMorphSvg.vue";

defineProps<{
    currentPath: string;
    phase: string;
    harmonicLevel: number;
    shapeName: string;
    totalMs: number;
    disabled: boolean;
}>();

defineEmits<{
    toggle: [];
}>();
</script>

<style scoped>
@reference "tailwindcss";

/* ── Preview stage ──────────────────────────── */

.demo-stage {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

@media (min-width: 640px) {
    .demo-stage {
        align-items: flex-start;
        margin-bottom: 2rem;
    }
}

.stage-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
}

.morph-button {
    width: 120px;
    height: 120px;
    cursor: pointer;
    padding: 0.625rem;
    flex-shrink: 0;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
}

@media (min-width: 640px) {
    .morph-button {
        width: 180px;
        height: 180px;
        padding: 1rem;
    }
}

.morph-button:hover:not(:disabled) {
    border-color: var(--accent-red);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-red) 15%, transparent);
    transform: scale(1.02);
}

.morph-button:active:not(:disabled) {
    transform: scale(0.98);
}

.morph-button:disabled {
    cursor: wait;
}

/* ── Info chips ─────────────────────────────── */

.desktop-info {
    display: none;
}

.mobile-info {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    justify-content: center;
}

@media (min-width: 640px) {
    .desktop-info {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .mobile-info {
        display: none;
    }
}

.info-chip {
    font-family: var(--font-mono);
    @apply text-sm;
    font-weight: 500;
    padding: 0.1875rem 0.5rem;
    border-radius: 0.375rem;
    background: color-mix(in srgb, var(--muted) 60%, transparent);
    color: var(--foreground);
    white-space: nowrap;
}

@media (min-width: 640px) {
    .info-chip {
        @apply text-base;
        padding: 0.25rem 0.625rem;
    }
}

.info-chip.settle-out,
.info-chip.settle-in {
    background: color-mix(in srgb, var(--accent-red) 12%, transparent);
    color: var(--accent-red);
}

.info-chip.morph {
    background: color-mix(in srgb, var(--accent-pink) 12%, transparent);
    color: var(--accent-pink);
}
</style>
