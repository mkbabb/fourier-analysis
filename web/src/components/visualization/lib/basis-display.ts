import { computed, reactive } from "vue";
import { VIZ_COLORS } from "@/lib/colors";

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
