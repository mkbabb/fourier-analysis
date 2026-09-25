import type { EquationTier, NotationMode } from "./types";

/**
 * The notation choices: a KaTeX glyph and each notation's hue.
 *
 * X.F.W14V `.u2` — UIA-F-85 / F-241 (glyph and ink limbs, F-W14U.md addendum
 * (h)). The inks were three hsl literals, blind to the theme (a blue "Exp" on
 * the dark brown ground). They are now the ONE palette's tokens (`--viz-*` and
 * glass's `--section-color-*`, both `light-dark()` pairs), and fourier's hues
 * are KEPT, per §0da's identity law: Trig is the Fourier red (`--viz-fourier`,
 * the basis it names), Exp the blue rung (`--section-color-2`, hue 265 in
 * oklch, the authored hsl 224), Polar the violet rung (`--section-color-7`,
 * hue 318 in oklch, the authored hsl 286). The glyphs are TeX, rendered by
 * KaTeX: the Unicode superscript `eⁱ` sat at its own odd baseline.
 */
export const NOTATION_OPTIONS: {
    label: string;
    value: NotationMode;
    /** TeX source, rendered inline by KaTeX. */
    glyph: string;
    color: string;
}[] = [
    { label: "Trig", value: "trig", glyph: String.raw`\sin`, color: "var(--viz-fourier)" },
    { label: "Exp", value: "exponential", glyph: String.raw`e^{i}`, color: "var(--section-color-2)" },
    { label: "Polar", value: "polar", glyph: "Ae", color: "var(--section-color-7)" },
];

/**
 * `D·D-B3` — the three tier inks were hard-coded sRGB triples that BYPASSED the
 * token layer entirely, and all three failed WCAG AA in the LIGHT arm against
 * the popover ground at 14px/600: green 2.13:1 · amber 1.98:1 · red 3.50:1 (this
 * seat's arithmetic; the axes' own record banked 2.17 / 2.02 / 3.57 against a
 * marginally different ground and the two agree to the conclusion). The
 * aggravation was in-tree: `style.css:204-217` had already measured 3.54:1 as a
 * failure and shipped a darkening override for exactly this reason — and this
 * module shipped 1.98:1 one import away from it.
 *
 * Routed through the app's own meaning-bearing ramp, the same inks measure
 * 4.27 / 4.53 / 4.53 on `--popover`, and they follow the theme instead of
 * pretending there is only one.
 *
 * ⊘ RESIDUAL, NAMED NOT SMOOTHED: the `symbolic` stop lands at **4.27:1**, which
 * is 0.23 short of 1.4.3's 4.5:1 floor, and NO stop in the producer's light-arm
 * ramp clears it — the nearest, `--section-color-10`, is 4.24. That is the same
 * shape as `FR-EQR-7`'s `--success` (2.18:1 at the producer): a rung that does
 * not exist cannot be adopted by a consumer, and inventing a local hex here is
 * precisely the defect this row is about. The ask — a light-arm status ramp that
 * clears 4.5:1 — rides the GLASS-RELAY letter.
 */
export interface TierInfo {
    label: string;
    color: string;
    description: string;
}

export const TIER_INFO: Record<EquationTier, TierInfo> = {
    symbolic: {
        label: "Exact",
        color: "var(--section-color-4)",
        description:
            "Coefficients computed symbolically — the closed-form is exact.",
    },
    identified: {
        label: "Conjectured",
        color: "var(--viz-amber)",
        description:
            "A closed-form pattern was detected by fitting numerical coefficients to rational functions of n. The formula matches but is not proven.",
    },
    spline: {
        label: "Approximate",
        color: "var(--destructive)",
        description:
            "Coefficients computed numerically via cubic-spline integration, truncated to the top terms by amplitude.",
    },
};

/**
 * `L·m-7` — the table is keyed by `EquationTier` now, so a typo is a compile
 * error. The fallback survives as a FUNCTION rather than a `??` the type system
 * had proved dead: the backend types `tier` as a bare `str`, so the guard is
 * runtime-live even where TypeScript can no longer see why.
 */
export function tierInfo(tier: string): TierInfo {
    return TIER_INFO[tier as EquationTier] ?? TIER_INFO.spline;
}

export function energyColor(e: number): string {
    if (e >= 0.99) return TIER_INFO.symbolic.color;
    if (e >= 0.95) return TIER_INFO.identified.color;
    return TIER_INFO.spline.color;
}
