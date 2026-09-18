/**
 * Centralized color palette for the visualization UI.
 *
 * Primary viz colors are derived from CSS custom properties (--viz-*)
 * so they automatically adapt to light/dark mode via section-color aliases.
 *
 * glass-ui authors those properties as `oklch()`, as
 * `light-dark(oklch(), oklch())` and as `var(--section-color-N)` aliases. None
 * of those survive a `getPropertyValue()` read plus a regex, so the palette is
 * resolved THROUGH the cascade instead: glass-ui's own `/dom` `resolveTokenColor`
 * paints `var(--token)` onto a real CSS property and reads the USED value back,
 * which is the only way the `light-dark()` arm and the alias chain are picked by
 * the engine rather than guessed by a string match. value.js then converts that
 * used value — whatever CSS Color 4 form the engine serialises — to hex, which
 * is what the Canvas2D consumers speak (`./css` parses the used value, `./color`
 * clips it into sRGB; both report failure as a Result, never a throw).
 */

import { createTokenColorCache } from "@mkbabb/glass-ui/dom";
import { toRgba8 } from "@mkbabb/value.js/color";
import { parseCssColor } from "@mkbabb/value.js/css";
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

/** The four CSS hex forms: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`. */
const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/**
 * Split a CSS hex color into its 0-255 RGB channels.
 *
 * The callers feed `ctx.strokeStyle` / `ctx.shadowColor`, and Canvas2D drops an
 * `rgba(…, NaN, …)` on the floor without a word — so a malformed hex is raised
 * at the boundary instead of travelling as a channel that silently paints
 * nothing.
 */
function hexChannels(hex: string): [number, number, number] {
    if (!HEX_COLOR.test(hex)) {
        throw new TypeError(`not a CSS hex color: ${JSON.stringify(hex)}`);
    }
    const body = hex.slice(1);
    const short = body.length <= 4;
    const channel = (i: number) =>
        short
            ? parseInt(body.charAt(i) + body.charAt(i), 16)
            : parseInt(body.substring(i * 2, i * 2 + 2), 16);
    return [channel(0), channel(1), channel(2)];
}

/** `#rrggbb` from 0-1 channels, clamped into the sRGB gamut. */
function toHex(r: number, g: number, b: number): string {
    const channel = (v: number) =>
        Math.round(255 * Math.min(1, Math.max(0, v)))
            .toString(16)
            .padStart(2, "0");
    return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/**
 * Convert one resolved CSS color to hex, or `null` when the parser does not
 * recognise it.
 *
 * F.W1 — value.js 4.0.0 retires `parseCSSColor` / `colorUnit2` / `ValueUnit`
 * (and their throw-on-unreadable contract) for a Result-shaped pipeline:
 * `parseCssColor` on `./css` reports an unreadable form as `ok: false` with
 * diagnostics, and `toRgba8` on `./color` clips into the sRGB gamut and hands
 * back 0-255 channels. Both failure branches leave the palette entry alone
 * rather than replacing a brand color with a placeholder — the same contract
 * the throw carried, now stated in the type instead of in a `catch`.
 */
function cssColorToHex(css: string): string | null {
    const parsed = parseCssColor(css);
    if (!parsed.ok) return null;
    const rgba = toRgba8(parsed.value, { gamut: "clip" });
    if (!rgba.ok) return null;
    const [r, g, b] = rgba.value;
    return toHex(r / 255, g / 255, b / 255);
}

/**
 * One cached cascade probe per unique token expression — the un-wrap is a
 * forced synchronous reflow, so it runs once per token and is dropped wholesale
 * when the cascade changes.
 */
const tokenColors = createTokenColorCache();

/** The `--viz-*` custom properties this palette tracks, by `VIZ_COLORS` key. */
const VIZ_TOKENS = [
    ["fourier", "--viz-fourier"],
    ["chebyshev", "--viz-chebyshev"],
    ["legendre", "--viz-legendre"],
    ["amber", "--viz-amber"],
] as const;

/** Reactive VIZ_COLORS — same API as before (VIZ_COLORS.fourier etc.) */
export const VIZ_COLORS = reactive({
    fourier: "#bf4040",
    chebyshev: "#3d72b8",
    legendre: "#9545b8",
    amber: "#b37a2d",
    golden: STATIC.golden,
    rainbow: STATIC.rainbow,
    pink: STATIC.pink,
    emerald: STATIC.emerald,
});

/**
 * Read the `--viz-*` CSS properties and update VIZ_COLORS.
 *
 * A property that is unset, or whose used value the parser cannot read, leaves
 * its VIZ_COLORS entry untouched: the authored brand hex is a better answer
 * than a placeholder, and overwriting the brand hexes on mount and on every
 * root-class flip was half of the original defect.
 */
export function resolveVizColors(): void {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    // One `getComputedStyle` handle and one batched read for the whole pass: the
    // probe below writes inline style, so an interleaved read would force its
    // own style recalculation per token.
    const computed = getComputedStyle(root);
    const declared = VIZ_TOKENS.map(
        ([key, property]) =>
            [key, property, computed.getPropertyValue(property).trim()] as const,
    );

    tokenColors.invalidate();

    for (const [key, property, value] of declared) {
        // `var(--unset)` is guaranteed-invalid at computed-value time, so probing
        // an unset property reads back the inherited `color` — a wrong answer
        // rather than a miss.
        if (!value) continue;
        const hex = cssColorToHex(tokenColors.resolve(`var(${property})`, root));
        if (hex) VIZ_COLORS[key] = hex;
    }
}

/**
 * Resolve the palette and keep it in step with the cascade.
 *
 * Called from `main.ts` BEFORE `app.mount()`: a root `onMounted` fires after
 * every child's, so a child that reads the palette while it mounts would win
 * the race and keep the authored fallback for the session.
 *
 * `.dark` class flips are observed by the app root. An OS-level scheme change
 * is not a class mutation at all — `light-dark()` follows `color-scheme: light
 * dark` — so it is observed here, where the palette lives.
 */
export function installVizColors(): void {
    resolveVizColors();

    if (typeof window === "undefined" || !window.matchMedia) return;
    window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", () => resolveVizColors());
}

/**
 * Return an rgba() string from a hex color + alpha.
 */
export function hexToRgba(hex: string, alpha: number): string {
    const [r, g, b] = hexChannels(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Return the RGB components of a hex color as [r, g, b].
 */
export function hexToRgb(hex: string): [number, number, number] {
    return hexChannels(hex);
}
