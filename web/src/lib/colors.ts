/**
 * Centralized color palette for the visualization UI.
 *
 * Primary viz colors are derived from CSS custom properties (--viz-*)
 * so they automatically adapt to light/dark mode via section-color aliases.
 */

import { reactive } from "vue";

/** Static accent colors (not section-derived) */
const STATIC = {
    golden: "#f0b632",
    rainbow: [
        "#f87171", "#fbbf24", "#34d399",
        "#60a5fa", "#c084fc", "#f472b6",
    ] as const,
    pink: "#f472b6",
    emerald: "#34d399",
};

/** Resolve a CSS custom property to a hex string. */
function cssVarToHex(varName: string): string {
    const raw = getComputedStyle(document.documentElement)
        .getPropertyValue(varName)
        .trim();
    if (!raw) return "#888888";

    // If already hex
    if (raw.startsWith("#")) return raw;

    // Parse hsl(...) or raw "h s% l%" from computed style
    const hslMatch = raw.match(
        /hsl\(\s*([\d.]+)\s*[ ,]\s*([\d.]+)%?\s*[ ,]\s*([\d.]+)%?\s*\)/,
    );
    if (hslMatch) {
        return hslToHex(+hslMatch[1], +hslMatch[2], +hslMatch[3]);
    }

    // Parse rgb(...)
    const rgbMatch = raw.match(
        /rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/,
    );
    if (rgbMatch) {
        return rgbToHex(+rgbMatch[1], +rgbMatch[2], +rgbMatch[3]);
    }

    return "#888888";
}

function hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color)
            .toString(16)
            .padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function rgbToHex(r: number, g: number, b: number): string {
    const hex = (v: number) =>
        Math.round(v).toString(16).padStart(2, "0");
    return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/** Reactive VIZ_COLORS — same API as before (VIZ_COLORS.fourier etc.) */
export const VIZ_COLORS = reactive({
    fourier: "#bf4040",
    chebyshev: "#3d72b8",
    legendre: "#9545b8",
    amber: "#b37a2d",
    green: "#4d8f66",
    golden: STATIC.golden,
    rainbow: STATIC.rainbow,
    pink: STATIC.pink,
    emerald: STATIC.emerald,
});

/** Read --viz-* CSS vars and update VIZ_COLORS. Call on mount + theme toggle. */
export function resolveVizColors(): void {
    VIZ_COLORS.fourier = cssVarToHex("--viz-fourier");
    VIZ_COLORS.chebyshev = cssVarToHex("--viz-chebyshev");
    VIZ_COLORS.legendre = cssVarToHex("--viz-legendre");
    VIZ_COLORS.amber = cssVarToHex("--viz-amber");
    VIZ_COLORS.green = cssVarToHex("--viz-green");
}

/**
 * Return an rgba() string from a hex color + alpha.
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
