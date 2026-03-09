import { VIZ_COLORS } from "@/lib/colors";

export const basisDisplay: Record<string, { icon: string; label: string; color: string }> = {
    fourier: { icon: "\u2131", label: "Fourier", color: VIZ_COLORS.fourier },
    chebyshev: { icon: "T\u2099", label: "Chebyshev", color: VIZ_COLORS.chebyshev },
    legendre: { icon: "P\u2099", label: "Legendre", color: VIZ_COLORS.legendre },
};
