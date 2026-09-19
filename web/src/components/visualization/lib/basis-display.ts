import { computed, reactive } from "vue";
import { VIZ_COLORS } from "@/lib/colors";
import { basisModeLabel, normalizeBasisKey } from "@/lib/basis";

export interface BasisDisplay {
    icon: string;
    label: string;
    color: string;
}

/**
 * Per-basis chrome for the visualization surfaces.
 *
 * The colour is DERIVED from `VIZ_COLORS`, never copied out of it: this module
 * is evaluated the moment any `components/visualization/` file is imported, and
 * a value copy taken at module-evaluation time freezes whatever the palette held
 * at that instant. That froze the entry route into the record — a route that
 * evaluates this module before the cascade is read pins the fallback for the
 * session, while every consumer that reads `VIZ_COLORS` directly moves on, so
 * one basis paints in two colours in the same frame.
 */
export const basisDisplay: Record<string, BasisDisplay> = reactive({
    fourier: {
        icon: "ℱ",
        label: "Fourier",
        color: computed(() => VIZ_COLORS.fourier),
    },
    chebyshev: {
        icon: "Tₙ",
        label: "Chebyshev",
        color: computed(() => VIZ_COLORS.chebyshev),
    },
    legendre: {
        icon: "Pₙ",
        label: "Legendre",
        color: computed(() => VIZ_COLORS.legendre),
    },
});

/** One rendered basis chip: the icon, the mode label and the family colour. */
export interface BasisChip {
    icon: string;
    label: string;
    color: string;
}

/**
 * X.F.W3 `.e` / `fr-BasisSelector M-10` — the gallery pair's BYTE-IDENTICAL
 * 15-line `basisLabels` clone, authored once.
 *
 * `GalleryCard.vue` and `GalleryCardModal.vue` held the same function twice,
 * character for character, and `labels.ts` held its canvas twin — three
 * spellings of "turn `active_bases` into chips". The key→family bridge and the
 * mode-label ladder now come from `lib/basis.ts`; what remains here is the part
 * that genuinely belongs to the display table, which is why it lives beside the
 * table rather than in `lib/`. A `lib/` module must not learn about a
 * `components/` one (FR-CP-28's direction), and this is the seam where that
 * stays true.
 *
 * An unknown key is DROPPED rather than rendered blank — the behaviour all
 * three copies already had, preserved on purpose.
 */
export function basisChips(activeBases: readonly string[] | null | undefined): BasisChip[] {
    const chips: BasisChip[] = [];
    for (const key of activeBases ?? []) {
        const cfg = basisDisplay[normalizeBasisKey(key)];
        if (!cfg) continue;
        chips.push({
            icon: cfg.icon,
            label: basisModeLabel(key, cfg.label),
            color: cfg.color,
        });
    }
    return chips;
}
