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

import { useGlobalDark } from "@mkbabb/glass-ui/dark";
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
 *
 * THE DECLARED HEX RESIDUAL (W.L5 ACT(2) · RD-6/RD-7), with this file and
 * `withAlpha` below its only two lines of hand-rolled color math. It is not a
 * missing value.js verb: `parseCssColor` + `toRgba8` read this same hex, but
 * the callers below run inside a rAF frame callback and a full CSS parse per
 * tick is the wrong instrument for a string this file authored itself. It is
 * declared rather than kept: DELETION DATE = fourier's 4.1 adoption of
 * value.js, at which point the palette hands its consumers a resolved color
 * object and the hex hop disappears with it.
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

/**
 * The `--viz-*` custom properties this palette tracks, by `VIZ_COLORS` key.
 *
 * X.F.W4 / `fr-ConvergencePlot D-1`, the `golden` limb (the finding is unit
 * `.b`'s; this resolver is `.f`'s file). `golden` was absent from this list —
 * theme-blind BY ENUMERATION — so the one entry the sum curve, the hover trail
 * and the shimmer all paint with stayed frozen at the authored `#f0b632` in
 * both arms. In the light arm that hex reads **1.766:1** against
 * `--background`: not a near miss on the 3:1 graphical-object floor, roughly
 * half of it, on the curve the instrument exists to show.
 *
 * ⊘ The token it resolves to is `--viz-amber`, and NOT a newly minted
 * `--viz-golden`. Both were offered by the declaring unit, and this one claims
 * no colour authority: `--viz-amber` is already forked by this app in BOTH arms
 * for exactly this reason (`style.css`, D.W4.d), and it measures **4.709:1**
 * against `--background` / **4.532:1** against `--card` in light and
 * **10.940:1** in dark. Minting a second gold would be this seat inventing a
 * brand colour, which is a design decision no row grants it. ⊘ The tree already
 * treats the two as one ink where it has to — `useCoeffHover.ts:75` reads
 * `VIZ_COLORS.amber || VIZ_COLORS.golden` — so the alias makes an existing
 * fallback honest rather than introducing a collision.
 */
const VIZ_TOKENS = [
    ["fourier", "--viz-fourier"],
    ["chebyshev", "--viz-chebyshev"],
    ["legendre", "--viz-legendre"],
    ["amber", "--viz-amber"],
    ["golden", "--viz-amber"],
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
 * Resolve the palette once, and seed the app's single dark-mode owner.
 *
 * Called from `main.ts` BEFORE `app.mount()` for two reasons, both load-bearing:
 * a root `onMounted` fires after every child's, so a child that reads the
 * palette while it mounts would win the race and keep the authored fallback for
 * the session; and this is the app's FIRST `useGlobalDark()` call, so it is the
 * one that gets to seed the singleton.
 *
 * X.F.W3 `.e` / `fr-App MG-γ` ⊕ `m-2`/`L-3`/`C-7` ⊕ `L-6` ⊕ `R-8` — THE ONE
 * DARK-MODE OWNER, RUNTIME HALF.
 *
 * The seed is `"auto"` and it is passed EXPLICITLY even though it is vueuse's
 * default, because the producer's own contract asks for it: `useGlobalDark`'s
 * `initialValue` is ONE-SHOT, and pairing it with `darkModeSyncScript()` is
 * what makes the parse-time answer in `index.html` and the runtime answer the
 * SAME answer. Owning the seed here, at the shell's first call, also means no
 * component can accidentally become the seeder by mounting first.
 *
 * ⊘ THE LOCAL `prefers-color-scheme` LISTENER IS DELETED, not moved. It was a
 * second, permanent, never-removed authority on a question the singleton
 * already answers: with an `"auto"` seed, vueuse's `useDark` tracks the OS
 * query itself, and the producer's watcher writes `color-scheme` on every flip
 * (R-8's coupling). Two listeners for one event is the same defect shape as the
 * MutationObserver this row retires, one layer down.
 */
export function installVizColors(): void {
    resolveVizColors();
    useGlobalDark({ initialValue: "auto" });
}

/**
 * Keep the palette in step with the theme, and hand back the way to stop.
 *
 * `L-6`'s shape, and it costs no new dependency edge: the app already imports
 * `@mkbabb/glass-ui/dark` at `DarkModeToggle.vue`, so the adoption is free.
 *
 * ⊘ WHY `onFlipSettled` AND NOT `installDarkModeSync`. Both live on the same
 * subpath and fire on the same event — each watches the singleton's `isDark`,
 * so neither can miss a flip the other catches. They differ in exactly one
 * respect, and it is the one `L-6` names: `installDarkModeSync` returns
 * `void`, while `onFlipSettled` returns its own unsubscribe function. A
 * composable that cannot be stopped is how the defect this replaces got
 * written. `onFlipSettled` is also the hook the producer documents FOR this
 * job — it drains every registered callback in ONE coalesced post-flip task,
 * which is what a palette memo wants: the re-resolve costs a forced synchronous
 * reflow per token, and doing it in the flip's own frame is how a theme toggle
 * turns into a jank spike.
 *
 * ⊘ WHAT THIS REPLACES. `App.vue` hand-rolled a `MutationObserver` on
 * `documentElement`'s class list, NEVER disconnected it, and re-read five
 * computed properties per firing. It observed the wrong thing besides: an
 * OS-level scheme change is not a class mutation at all.
 */
export function useVizColorSync(): () => void {
    return useGlobalDark().onFlipSettled(() => resolveVizColors());
}

/**
 * A palette entry at a given alpha, as a Canvas2D paint string.
 *
 * The one surviving arm of the hex residual above: a canvas context takes a CSS
 * color STRING and has no cascade to resolve `var(--token)` against, so this is
 * the single place the palette's hex is composited with an alpha. Every canvas
 * consumer routes through here rather than composing its own — `alpha` is the
 * caller's, the color is the palette's, and neither is re-authored downstream.
 *
 * Dies with `hexChannels` at fourier's 4.1 adoption (RD-6/RD-7).
 */
export function withAlpha(hex: string, alpha: number): string {
    const [r, g, b] = hexChannels(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
