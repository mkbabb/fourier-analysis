<template>
    <!--
        X.F.W4 · SP-7 — DMT N-2 ⊕ N-3 ⊕ N-17.

        N-2: a toggle announces its STATE through `aria-pressed`, and its NAME
        stays constant — which is the project's own `DESIGN.md:25` rule and what
        the producer's toggle does at 8.0.0. The old label described the ACTION
        and carried the state inside the name, so AT users heard the name change
        under them on every activation and never heard a pressed state at all.
        ⊘ RIDER LOCK discharged: that label was a load-bearing e2e locator. It is
        the tree's ONLY one — ⟨cmd⟩ `grep -rn -i 'switch to dark\|switch to
        light\|sun-moon-toggle' e2e/` → exactly `paper-performance.spec.ts:328`,
        the single line this unit is granted — and it moves in the SAME commit,
        to the stronger `{ name, pressed: false }` form.

        N-3: `type="button"`. A bare `<button>` defaults to `type="submit"`;
        latent today with no form ancestor, and the producer sets it.

        N-17: the control had no sighted affordance beyond its position — no
        title, no tooltip — for an abstract morphing glyph. `title` carries the
        ACTION for sighted users while `aria-label` keeps the stable name (an
        `aria-label` always wins the accessible name, so the two do not fight).
    -->
    <button
        type="button"
        class="sun-moon-toggle"
        aria-label="Dark mode"
        :aria-pressed="isDark"
        :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="handleToggle"
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

const { isDark, toggleDark } = useGlobalDark();
/** true when morphing toward dark (moon), false when morphing toward light (sun) */
const morphingToDark = ref(false);

const morph = useFourierMorph();

/**
 * X.F.W4 · FR-AH-23 ⊕ DMT M-2 ⊕ DMT N-13 — the glyph's colour, in one
 * expression, through the resolved palette.
 *
 * Three banked rows died together here, and the cure is smaller than any one of
 * them:
 *
 *  · **FR-AH-23** — the two endpoints were hard-coded sRGB triples (`#E88845`,
 *    `#c084fc`) with a comment claiming the second "matches VIZ_COLORS.legendre".
 *    They are now the palette tokens themselves, so the glyph follows the
 *    cascade — including this app's own light-arm `--viz-amber` darkening — and
 *    there is nothing left to drift out of match. The row's precondition is met:
 *    `fr-BasisCanvas D-1`'s resolver cure landed at F.W2, so the `#888888`
 *    fallback the routing had to wait for no longer exists in `lib/colors.ts`.
 *  · **DMT M-2** — the light-mode glyph is the button's ONLY visual content and
 *    its only sighted state channel, and it measured **2.513:1** against the
 *    page (`#E88845`; WCAG 1.4.11 wants 3:1). `--viz-amber` measures
 *    **4.709:1** light / **10.940:1** dark; `--viz-legendre` **5.541:1** light /
 *    **8.080:1** dark. Every resting state now clears the floor in both arms,
 *    and it clears 1.4.3's 4.5:1 as well.
 *  · **DMT N-13** — the channel-wise sRGB lerp collapsed chroma ~37% at t=0.5
 *    between two hues ~250° apart and passed through a dusty rose belonging to
 *    neither state. `color-mix(in oklab, …)` interpolates perceptually, in the
 *    space the substrate already declares as its standard, with the engine
 *    doing the work — no colour maths, no second palette import, and nothing
 *    added to this component's eager boundary.
 *
 * The idle branch also loses its dead arithmetic: it used to call the lerp with
 * t=1 and t=0 to recompute two constants.
 */
/** 0 = fully sun, 1 = fully moon. */
const morphT = computed(() => {
    if (morph.phase.value !== "idle") {
        const p = morph.morphProgress.value;
        return morphingToDark.value ? p : 1 - p;
    }
    return isDark.value ? 1 : 0;
});

const strokeColor = computed(
    () =>
        `color-mix(in oklab, var(--viz-amber) ${((1 - morphT.value) * 100).toFixed(1)}%, var(--viz-legendre))`,
);

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
