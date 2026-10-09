<template>
    <div class="demo-stage">
        <div class="stage-row">
            <!-- SP-7 · FM-1 (= FMD-2), the HOST half. The route's primary and
                 only control had an empty accessible name: a bare `<button>`
                 whose sole child was a bare `<svg>`.
                 ⊘ FR-MSP-10's NAME-CURE LOCK is honoured — the name is derived
                 from TRANSACTION-STABLE state, not from the current shape. A
                 name built from `shapeName` INVERTS the instant the control is
                 activated, which is worse than no name for a screen-reader user
                 mid-gesture. What this button does never changes: it morphs
                 between the two shapes.
                 FMD-6 — `aria-busy` is the state channel the guard already had
                 and never announced: `disabled` alone reads as "broken" during
                 the 350 ms the input is swallowed. -->
            <!-- X.F.W14V.au3 — A2-FO-L1-13: the control's plate is glass's
                 Surface (the local `.cartoon-card` stamp retires app-wide). -->
            <Surface
                as="button"
                type="button"
                surface="opaque"
                class="morph-button"
                aria-label="Morph between the sun and moon shapes"
                :aria-busy="disabled || undefined"
                @click="$emit('toggle')"
                :disabled="disabled"
            >
                <FourierMorphSvg
                    :path="currentPath"
                    :stroke-width="4.5"
                    view-box="0 0 200 200"
                />
            </Surface>

            <!-- X.F.W3 `.d` — `fr-FourierMorphDemo FMD-12`, the info-chip
                 limb, with `fr-MorphShapePreview D-11`’s mapping rider taken as
                 banked: 3 × `Metric` + 1 × `Chip` with a tone.

                 Eight hand-rolled `.info-chip`s (four desktop, four mobile)
                 restated, in scoped CSS, a readout the design system ships. The
                 mapping is not cosmetic — it is the row's own point: THREE of
                 these are labelled readings (`n=` a harmonic level, a shape
                 name, a duration in ms) and ONE is a STATE with a tone
                 (`phase`). `Metric` is the labelled reading; `Chip` with a
                 `tone` is the toned state. The hand-roll spelled all four the
                 same and then re-toned one of them by class, which is why the
                 phase chip and the duration chip were indistinguishable in
                 structure.

                 ▲ THE BANKED TARGET MOVED AND IS RE-SEATED AT THE PIN:
                 `FM-14` warns `./metric-badge` is GONE at 8.0.0 and the census
                 line says target `./chip`. Measured here: the 8.0.0 export map
                 has `./metric` and `./chip`, and neither `./metric-badge` nor
                 `./toggle-chip`. `Metric` comes from `./metric`, `Chip` from
                 `./chip`.

                 ⊘ `L-06`’s API re-shape belongs to the re-basing decision and
                 is NOT taken: KISS. The four readings keep the words they had. -->
        </div>

        <!-- X.F.W14U.misc — UIA-F-117 ⊕ UIA-F-254: ONE readout row (the
             desktop and mobile copies were the same four readings twice). It
             never re-flows (one line; two fixed rows at phone width, X-DS
             F1-14), and the phase chip reserves the measure of its
             longest word ("settle-out"), so a reading that changes at animation
             rate cannot move the controls below it. -->
        <div class="demo-info">
            <!-- X-DS pass 3 · DS-F3-C13: the phase is a reading, not an action.
                 As a filled Chip it wore the Export button's plate, height and
                 width; it is an inline Metric like its neighbours now, with
                 its tone on the value's ink (the hue-chip ink recipe). -->
            <Metric label="phase" :value="phase" size="sm" posture="inline" class="phase-reading">
                <template #value>
                    <span class="phase-value" :style="phaseTone ? { '--phase-tone': phaseTone } : undefined">{{ phase }}</span>
                </template>
            </Metric>
            <Metric label="n" :value="harmonicLevel" size="sm" posture="inline" />
            <!-- X-DS pass 12 · DS-F14-C2: the shape reading reserves its longest
                 word, as the phase does, so "total" holds when Sun turns Moon.
                 X-DS pass 13 · DS-F15-C1: both slot-form readings pass their
                 :value too, so glass Metric does not mark them data-empty (and
                 mute the value to the label's ink). -->
            <Metric label="shape" :value="shapeName" size="sm" posture="inline">
                <template #value>
                    <span class="shape-value">{{ shapeName }}</span>
                </template>
            </Metric>
            <Metric label="total" :value="totalMs" unit="ms" size="sm" posture="inline" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Surface } from "@mkbabb/glass-ui/surface";
import { Metric } from "@mkbabb/glass-ui/metric";
import FourierMorphSvg from "@/components/decorative/FourierMorphSvg.vue";

const props = defineProps<{
    currentPath: string;
    phase: string;
    harmonicLevel: number;
    shapeName: string;
    totalMs: number;
    disabled: boolean;
}>();

/**
 * The phase tone the hand-rolled `.info-chip.<phase>` class selectors carried.
 * It is a MAP rather than three class names, because the tone is one fact about
 * the phase and a class per phase is that fact spelled once per rule.
 */
const PHASE_TONE: Record<string, string> = {
    "settle-out": "var(--accent-red)",
    "settle-in": "var(--accent-red)",
    morph: "var(--accent-pink)",
};

const phaseTone = computed(() => PHASE_TONE[props.phase]);

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
    gap: var(--space-atom);
    width: 100%;
}

.stage-row {
    display: flex;
    justify-content: center;
    width: 100%;
}

/* X-DS DS-F4R-C4: below 1024px the stage is the sticky band over the
   controls, and it took ~53% of a 390 × 844 phone (the plate at full measure
   with two rows of readings under it). The readings now stand in one column
   BESIDE the plate, and the plate's block size is capped (22svh, square), so
   the band holds under ~40% of the viewport and the controls get the rest. */
@media (max-width: 1023.98px) {
    .demo-stage {
        flex-direction: row;
        justify-content: center;
        gap: var(--space-body);
    }

    /* X-DS DS-F5-C5: the plate is bounded by the row, not only by the
       viewport's height: 22svh, or what the content box leaves after the
       gap and the readings' measure (9rem holds "total 2400 ms"). */
    .stage-row {
        flex: none;
        width: min(22svh, 100% - var(--space-body) - 9rem);
    }
}

/* X.F.W14U.misc — UIA-F-115: the stage is the page's dominant content. It was
   a fixed 120/180px square; it now takes its column up to a bound — 22svh
   below 1024px (DS-F4R-C4: the band, readings beside the plate, stays under
   ~40% of the viewport), 26rem beside the controls. */
.morph-button {
    width: min(100%, 22svh);
    aspect-ratio: 1;
    cursor: pointer;
    padding: var(--space-body);
    flex-shrink: 0;
    /* FMD-28 — tokenised: the literals restated the producer's own registers. */
    transition: border-color var(--duration-fast) var(--ease-standard),
        transform var(--duration-fast) var(--ease-standard);
}

@media (min-width: 1024px) {
    .morph-button {
        width: min(100%, 26rem);
        padding: var(--space-family);
    }
}

.morph-button :deep(svg) {
    width: 100%;
    height: 100%;
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
/* X.F.W14V.au3 — A2-FO-L1-13: the cartoon stamp this block composed is retired
   with `.cartoon-card`; the plate and its elevation are glass Surface's, so the
   hover keeps only the app's state vocabulary below (the border tone step). */
/* X.F.W3 `.d` — `fr-MorphShapePreview FR-MSP-11`: ONE RING VOCABULARY, chosen
   at the re-basing, which is what the row demands (“the re-basing chooses ONE
   ring vocabulary across both files or the row is not discharged”).

   THE COLLISION, measured at both files: this control’s HOVER was
   `--accent-red` + a flat `0 0 0 3px` 15 %-mix ring; `HarmonicLevelGrid`’s
   `.grid-cell.active` — its SELECTED state — is `--accent-red` + a flat
   `0 0 0 2px` 15 %-mix ring. One pixel of ring apart, on screen simultaneously:
   “the pointer is here” and “this is the current level” wearing one costume.
   The grid itself already distinguishes the two — its `:hover` is a 50 %
   border-mix, no ring — which proves the vocabulary existed and was simply
   never reconciled across components.

   THE CHOICE: A FLAT ACCENT RING MEANS SELECTED. Hover is the border tone
   step alone, as on the harmonic tiles (X-DS pass 9 · DS-F11-C2: the plate's
   `scale(1.02)` hover swell is deleted, as DS-F9-C1 deleted the tiles'
   `scale(1.04)`); `:active` keeps the `scale(0.98)` press, as the tiles do.
   This control is not selectable, so it takes the hover vocabulary and
   surrenders the ring. `HarmonicLevelGrid.vue` needs no edit under this choice
   — it is already the vocabulary’s exemplar — which is why the row discharges
   from one file without a bounds expansion.

   ⊘ `FMD-N3`’s md→lg stamp growth is NOT part of the collision and stays: it
   is elevation, not state. */
@media (hover: hover) {
    .morph-button:hover:not(:disabled) {
        border-color: color-mix(in srgb, var(--accent-red) 50%, transparent);
    }
}

.morph-button:active:not(:disabled) {
    transform: scale(0.98);
}

.morph-button:disabled {
    cursor: wait;
}

/* ── Readouts (UIA-F-117) ───────────────────── */

/* X-DS pass 1 · F1-14 — at phone width the four readings overflowed the
   viewport on one line. They take two fixed rows, so the row still never
   re-flows as a reading changes and the controls below hold. X-DS DS-F-C7: the
   state has the first row to itself and the three readings share the second,
   so no reading floats alone beside it. X-DS pass 3 · DS-F3-C13: with the
   phase a labelled reading too, the four no longer fit the 26rem measure on
   one line at any width, so the two rows are the form everywhere. */
.demo-info {
    display: grid;
    grid-template-columns: repeat(3, auto);
    justify-content: center;
    justify-items: start;
    align-items: center;
    column-gap: var(--space-body, 0.75rem);
    row-gap: var(--space-atom);
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
}
.phase-reading {
    grid-column: 1 / -1;
    justify-self: center;
}

/* The phase reading reserves the measure of its longest word ("settle-out"),
   so the row never moves at animation rate. Its tone is ink only: the hue a
   quarter toward `--foreground`, which clears AA on the page in both arms. */
.phase-value {
    display: inline-block;
    min-inline-size: 10ch;
    color: color-mix(in oklab, var(--phase-tone, var(--foreground)) 75%, var(--foreground));
}
/* X-DS pass 12 · DS-F14-C2: the shape value's guard, its longest word ("Moon"). */
.shape-value {
    display: inline-block;
    min-inline-size: 4.5ch;
}

/* DS-F4R-C4: beside the plate in the phone band, the four readings are one
   column, each on its own line, starting on one edge. X-DS DS-F5-C5: the
   column takes the rest of the row and no more (`flex: 1`, `min-width: 0`),
   so plate and readings are bounded by the content box (the readings ran
   ~6 px into the 16 px gutter), and its width no longer follows its words,
   so nothing moves as the phase changes; the phase value's 10ch reservation
   (the two-row form's guard) is dropped here, where no reading sits beside
   it. */
@media (max-width: 1023.98px) {
    .demo-info {
        flex: 1 1 0;
        min-width: 0;
        grid-template-columns: auto;
        justify-content: start;
    }
    .phase-reading {
        justify-self: start;
    }
    .phase-value,
    .shape-value {
        min-inline-size: 0;
    }
}

/* X-DS pass 2 · DS-F2-C4: beside the controls the readouts start on the
   plate's edge, as the actions under them do (one axis in the column). */
@media (min-width: 1024px) {
    .demo-info {
        align-self: flex-start;
        justify-content: start;
    }
    .phase-reading {
        justify-self: start;
    }
}

/* `FMD-12` — the eight `.info-chip` rules are DELETED with the divs they
   painted: the mono face, the two type rungs, the two pads, the radius, the
   muted plate and the three phase re-tints are all `Metric`’s and `Chip`’s at
   the pin. What survives is the LAYOUT of the two responsive groups, which is
   this stage’s composition and not the readouts’ chrome. */
</style>
