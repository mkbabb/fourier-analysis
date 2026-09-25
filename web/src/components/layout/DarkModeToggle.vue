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
    <!-- X.F.W14U.shell — UIA-F-130 (consumer half): the control wears the
         dock's ONE face, `DockControl`, so its hover plate, press spring,
         gleam, focus ring and cell are the dock's; the Fourier morph glyph is
         its content. Glass's own DarkModeToggle still has no glyph seam (the
         glass half, O-59); adopting it would delete the glyph. `aria-pressed`
         is the state (N-2), passed as an attribute: `DockControl`'s `active`
         would also paint the selected seat, which is not what "dark" means. -->
    <DockControl
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
    </DockControl>
</template>

<script setup lang="ts">
/**
 * X.F.W3 `.e` / `fr-AppHeader FR-AH-1`'s F.W3 rider (⊕ `fr-DarkModeToggle I-2`
 * / `SR-2`, `N-10`, `N-11`) — THE SHADOW-RECONCILE, PERFORMED AND RECORDED.
 *
 * The row is explicit that this is a RECONCILE, NOT A REPLACE, and the
 * re-baseline it turns on is now settled rather than pending: `I-2` was written
 * against 4.0.0's `./controls`, `SR-2` moved the target to `./dark-mode-toggle`
 * at 8.0.0, and P-10's re-pin is RULED (`v8.0.0` @ `17a11bc5`, landed at F.W1),
 * so the seat is live today and the comparison can actually be made.
 *
 * MEASURED AT THE ADOPTED PIN, ⟨cmd⟩ this seat, 2026-09-19,
 * `cat node_modules/@mkbabb/glass-ui/dist/components/dark-mode-toggle/DarkModeToggle.vue.d.ts`:
 * the producer's component takes `size` ("sm" | "md" | "lg" | "control" |
 * "dock") and `disableTransitions`. That is the WHOLE surface — no slot, no
 * glyph input, no render override.
 *
 * THE RECONCILE, stated so a later seat does not re-open it as an oversight:
 *
 *  · WHAT IS ALREADY THE PRODUCER'S, and stays: the STATE. This file has held
 *    `useGlobalDark()` since F.W4 and reads the shared singleton's `isDark`
 *    and `toggleDark` — it never duplicated the controller, which is the half
 *    an adoption would otherwise buy. The pre-paint script and the palette
 *    sync now sit on the same singleton (X.F.W3 `.e`'s dark-mode item), so
 *    there is exactly one dark-mode authority in this app and it is the
 *    producer's.
 *  · WHAT IS THIS APP'S, and cannot be handed over: the GLYPH. The control's
 *    entire visual content is a Fourier-series morph between two pre-computed
 *    epicycle paths — the app's own subject, rendered by its own engine,
 *    driven by `useFourierMorph` — and the producer's component exposes no
 *    seam for it. Adopting it would not simplify this file; it would DELETE
 *    the thing the file exists for.
 *  · THEREFORE: no replacement. The divergence is genuine consumer
 *    divergence, not shadow, and it is recorded here rather than re-derived
 *    every time the export map is read. `N-10`/`N-11` resolve inside this
 *    reading: the control's name, pressed state and type are already the
 *    producer's own idiom (F.W4, `SP-7`), so what remained to reconcile was
 *    the CHASSIS question, and the answer is that the chassis is the glyph.
 *
 * ⊘ NOT this unit's, and unmoved: `FR-AH-1`'s 450,631 B eager-payload row is
 * F.W4's and is not touched here.
 */
import { ref, computed, onMounted, watch } from "vue";
import { useGlobalDark } from "@mkbabb/glass-ui/dark";
import { DockControl } from "@mkbabb/glass-ui/dock";
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

/**
 * X.F.W4 · DMT M-1 — the glyph FOLLOWS `isDark`; it does not merely echo this
 * component's own click.
 *
 * `useGlobalDark()` is a global singleton with more than one live writer — the
 * pre-paint script in `index.html`, an OS scheme change, and any other consumer
 * — and the glyph was written exactly twice in this file: once at mount and
 * once in `handleToggle`. Every other path left the header showing a sun on a
 * dark page. The watcher re-seeds whenever the truth moves under an IDLE glyph;
 * a morph this component is itself running owns the glyph until it finishes, so
 * the watcher stands aside rather than fighting it.
 *
 * ⊘ SEQUENCING LOCK: this watcher is only safe ON TOP of FR-AH-8/FR-AH-9's
 * cancellation. `setShape` calls `stopAnim`, and before the epoch token
 * `stopAnim` ADVANCED the running coroutine instead of killing it — so a
 * watcher firing mid-morph would have handed the glyph to two writers. The
 * cancellation lands with-or-before the watcher, as the lock requires, and both
 * are in this one commit.
 */
watch(isDark, (dark) => {
    if (morph.phase.value !== "idle") return;
    morph.setShape(dark ? moonShape : sunShape);
});

async function handleToggle() {
    if (morph.phase.value !== "idle") return;

    const from = isDark.value ? moonShape : sunShape;
    const to = isDark.value ? sunShape : moonShape;

    morphingToDark.value = !isDark.value;
    toggleDark();

    try {
        await morph.morphTo(from, to);
    } catch (err) {
        /**
         * FMD-9's consumer half. The engine lives behind a dynamic import, so
         * this rejects for real when a chunk cannot be fetched. ⊘ This is NOT a
         * catch around a defect: the theme HAS already flipped, so the truthful
         * frame is the DESTINATION — the same terminal-frame answer the reduced
         * arm gives — and leaving the glyph on the departure shape would make
         * the header lie about the page it is sitting on. The failure is
         * reported rather than swallowed; the memo it poisoned is cleared in
         * `getAnimationCtor`, so the next activation is a real retry.
         */
        morph.setShape(to);
        console.error("[DarkModeToggle] morph engine unavailable; snapped to the destination shape", err);
    }
}
</script>
