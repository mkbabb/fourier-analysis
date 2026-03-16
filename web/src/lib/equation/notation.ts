import type { NotationMode } from "./types";

/**
 * Notation pill definitions with LaTeX-style icons and colors,
 * matching the basis-pill pattern from BasisSelector.
 */
export const NOTATION_OPTIONS: {
    label: string;
    value: NotationMode;
    icon: string;
    color: string;
}[] = [
    { label: "Trig", value: "trig", icon: "sin", color: "hsl(6, 72%, 49%)" },
    { label: "Exp", value: "exponential", icon: "eⁱ", color: "hsl(224, 58%, 46%)" },
    { label: "Polar", value: "polar", icon: "Ae", color: "hsl(286, 46%, 47%)" },
];

export const TIER_INFO: Record<
    string,
    { label: string; color: string; description: string }
> = {
    symbolic: {
        label: "Exact",
        color: "hsl(142, 71%, 45%)",
        description:
            "Coefficients computed symbolically — the closed-form is exact.",
    },
    identified: {
        label: "Conjectured",
        color: "hsl(38, 92%, 50%)",
        description:
            "A closed-form pattern was detected by fitting numerical coefficients to rational functions of n. The formula matches but is not proven.",
    },
    spline: {
        label: "Approximate",
        color: "hsl(0, 84%, 60%)",
        description:
            "Coefficients computed numerically via cubic-spline integration, truncated to the top terms by amplitude.",
    },
};

export function energyColor(e: number): string {
    if (e >= 0.99) return "hsl(142, 71%, 45%)";
    if (e >= 0.95) return "hsl(38, 92%, 50%)";
    return "hsl(0, 84%, 60%)";
}
