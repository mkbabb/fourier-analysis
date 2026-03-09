/**
 * Centralized color palette for the visualization UI.
 *
 * All viz-layer colors live here so they're easy to tweak in one place.
 * These are intentionally slightly pastel / muted compared to raw
 * Tailwind defaults — softer on the eyes while still readable.
 */

export const VIZ_COLORS = {
    /** Fourier basis / epicycles — warm coral */
    fourier: "#f87171",
    /** Chebyshev basis — soft blue */
    chebyshev: "#60a5fa",
    /** Legendre basis — soft purple */
    legendre: "#c084fc",
    /** Blur-sigma / contour — muted amber */
    amber: "#e5a820",
    /** Timeline slider (epicycle mode) — muted sage green */
    green: "#6ec89b",
    /** Timeline slider dark-mode (epicycle mode) */
    greenDark: "#4aa878",
    /** Timeline slider (non-epicycle mode) — uses fourier color */
    get red() { return this.fourier; },
    /** Timeline slider dark-mode (non-epicycle mode) */
    redDark: "#ef4444",
    /** Hover / golden shimmer */
    golden: "#f0b632",
    /** Rainbow gradient stops (loading bar, play button, etc.) */
    rainbow: [
        "#f87171",  // red
        "#fbbf24",  // amber
        "#34d399",  // emerald
        "#60a5fa",  // blue
        "#c084fc",  // purple
        "#f472b6",  // pink
    ] as const,
    /** Pink (rainbow accent) */
    pink: "#f472b6",
    /** Emerald (rainbow accent) */
    emerald: "#34d399",
} as const;

/**
 * Return an rgba() string from a hex color + alpha.
 * Useful for canvas drawing where you need transparency variants.
 */
export function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Return the RGB components of a hex color as [r, g, b].
 */
export function hexToRgb(hex: string): [number, number, number] {
    return [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
    ];
}
