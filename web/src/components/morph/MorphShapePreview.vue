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
    /* FMD-28 — tokenised: the literals restated the producer's own registers. */
    transition: border-color var(--duration-fast) var(--ease-standard),
        box-shadow var(--duration-fast) var(--ease-standard),
        transform var(--duration-fast) var(--ease-standard);
}

@media (min-width: 640px) {
    .morph-button {
        width: 180px;
        height: 180px;
        padding: 1rem;
    }
}

/* X.F.W4 / SP-6 · FMD-N3 (⊕ FMD-27) — the shadow COMPOSES, it does not replace.
   `box-shadow` is a single property: the halo alone DELETED `cartoon-surface`'s
   signature offset stamp for the whole hover, on the route's primary control.
   The stamp is restated first and grows md→lg, which is the design the two
   sibling `.cartoon-card` hosts read as.
   ⊘ MECHANISM CORRECTED AT THE ADOPTED PIN (recorded, not smoothed): both rows
   were banked against glass-ui 4.0.0's `cards.css:33-49`, which shipped a
   `:hover` arm carrying the md→lg growth and a `-1px` lift. At 8.0.0 the whole
   recipe is `@utility cartoon-surface{position:relative;border-width:2px;
   box-shadow:var(--shadow-cartoon-md)}` — no hover arm, no lift. So FMD-27's
   "the cartoon lift snaps" premise is DEAD (there is no producer lift to snap)
   and FMD-N3's replaced-stamp is the BASE stamp, not a hover stamp. The defect
   and its cure survive on the base stamp; the grade is unmoved.
   SP-15 / DMT N-16 — hover is gated on a real hover pointer, so touch UAs stop
   latching the state after a tap. */
@media (hover: hover) {
    .morph-button:hover:not(:disabled) {
        border-color: var(--accent-red);
        box-shadow: var(--shadow-cartoon-lg),
            0 0 0 3px color-mix(in srgb, var(--accent-red) 15%, transparent);
        transform: scale(1.02);
    }
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
