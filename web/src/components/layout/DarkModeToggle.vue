<template>
    <button
        class="sun-moon-toggle"
        @click="handleToggle"
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    >
        <FourierMorphSvg
            :path="morph.currentPath.value"
            :stroke-width="14"
            :stroke-color="strokeColor"
            view-box="0 0 200 200"
        />
    </button>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useGlobalDark } from "@mkbabb/glass-ui/dark";
import FourierMorphSvg from "@/components/decorative/FourierMorphSvg.vue";
import { useFourierMorph } from "@/composables/useFourierMorph";
import { prepareFourierShape } from "@/lib/svg-fourier";

import sunData from "@/assets/fourier-paths/sun.json";
import moonData from "@/assets/fourier-paths/moon.json";

const sunShape = prepareFourierShape(sunData as any);
const moonShape = prepareFourierShape(moonData as any);

// Sun: warm orange   Moon: legendre purple
const SUN_COLOR = [232, 136, 69] as const;   // #E88845
const MOON_COLOR = [192, 132, 252] as const; // #c084fc — matches VIZ_COLORS.legendre

const { isDark, toggleDark } = useGlobalDark();
/** true when morphing toward dark (moon), false when morphing toward light (sun) */
const morphingToDark = ref(false);

const morph = useFourierMorph();

function lerpColor(a: readonly number[], b: readonly number[], t: number): string {
    const r = Math.round(a[0] + (b[0] - a[0]) * t);
    const g = Math.round(a[1] + (b[1] - a[1]) * t);
    const bl = Math.round(a[2] + (b[2] - a[2]) * t);
    return `rgb(${r},${g},${bl})`;
}

const strokeColor = computed(() => {
    if (morph.phase.value === "idle") {
        return isDark.value
            ? lerpColor(SUN_COLOR, MOON_COLOR, 1)
            : lerpColor(SUN_COLOR, MOON_COLOR, 0);
    }
    const [from, to] = morphingToDark.value
        ? [SUN_COLOR, MOON_COLOR]
        : [MOON_COLOR, SUN_COLOR];
    return lerpColor(from, to, morph.morphProgress.value);
});

onMounted(() => {
    morph.setShape(isDark.value ? moonShape : sunShape);
});

async function handleToggle() {
    if (morph.phase.value !== "idle") return;

    const from = isDark.value ? moonShape : sunShape;
    const to = isDark.value ? sunShape : moonShape;

    morphingToDark.value = !isDark.value;
    toggleDark();

    await morph.morphTo(from, to);
}
</script>

<style scoped>
.sun-moon-toggle {
    position: relative;
    width: var(--toggle-size, 5rem);
    height: var(--toggle-size, 5rem);
    cursor: pointer;
    border: 0;
    padding: 0;
    border-radius: 50%;
    background: transparent;
    /* DMT N-5 — the literals restated the producer's own registers exactly
       (`--duration-fast: 0.2s`, `--ease-standard`); they are read from them. */
    transition: transform var(--duration-fast) var(--ease-standard);
    flex-shrink: 0;
}

/* SP-15 · DMT N-16 — hover is gated on a real hover pointer. This file owned
   the tree's largest hover transform, and on touch UAs that latch `:hover` it
   stayed latched after a tap. DMT N-7: the 1.12 scale was the tree's largest,
   untokenized, on the control with the smallest ink tolerance — it takes the
   producer's `--scale-hover` register (1.08 at the adopted pin) instead.
   DMT N-9 (rescoped per K-8): the `outline: none` inside `:hover` was a DEAD
   declaration — the base rule declares no outline, so it duplicated nothing
   and only made the ring look like it was being suppressed. Deleted. */
@media (hover: hover) {
    .sun-moon-toggle:hover {
        transform: scale(var(--scale-hover));
    }
}

/* FM-2 rider ⊕ DMT N-6 — `--color-ring` was the tree's ONLY reference to that
   name and glass-ui 8.0.0 declares neither it nor `--ring`, so this outline was
   invalid at computed-value time and dropped: the header's dark-mode control
   had no focus ring. Decided by one build, no browser, exactly as banked. */
.sun-moon-toggle:focus-visible {
    outline: var(--focus-ring-width) solid var(--focus-ring-color);
    outline-offset: 2px;
}

/* SP-4 · DMT N-8 — the reduced arm nulled `transition` only, so the hover
   transform survived as an INSTANTANEOUS snap: motion reduction inverted into
   motion sharpening. The transform is removed with the transition. */
@media (prefers-reduced-motion: reduce) {
    .sun-moon-toggle {
        transition: none;
    }

    .sun-moon-toggle:hover {
        transform: none;
    }
}
</style>
