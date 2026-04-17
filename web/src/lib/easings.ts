/**
 * Shared easing catalogs and utility functions.
 *
 * Two catalogs:
 *  - EASING_PRESETS: comprehensive list used by the morph subsystem (in/out/in-out variants)
 *  - ANIMATION_EASINGS: compact subset used by the animation store (in-out only)
 */

import { timingFunctions } from "@mkbabb/value.js";
import {
    easeInOutSine,
    easeInOutCubic,
    easeInOutQuad,
    easeInOutExpo,
    easeInOutCirc,
} from "@mkbabb/value.js";

// ── Types ───────────────────────────────────────────────────────────

export type EasingFn = (t: number) => number;

export interface EasingPreset {
    label: string;
    fn: EasingFn;
}

// ── Morph easing presets (comprehensive) ────────────────────────────

const EASING_LABELS: Record<string, string> = {
    linear: "Linear",
    "ease-in": "Ease In",
    "ease-out": "Ease Out",
    "ease-in-out": "Ease In-Out",
    "ease-in-back": "Back In",
    "ease-out-back": "Back Out",
    "ease-in-out-back": "Back In-Out",
    "ease-in-quad": "Ease In Quad",
    "ease-out-quad": "Ease Out Quad",
    "ease-in-out-quad": "Ease In-Out Quad",
    "ease-in-cubic": "Ease In Cubic",
    "ease-out-cubic": "Ease Out Cubic",
    "ease-in-out-cubic": "Ease In-Out Cubic",
    "ease-in-sine": "Ease In Sine",
    "ease-out-sine": "Ease Out Sine",
    "ease-in-out-sine": "Ease In-Out Sine",
    "ease-in-expo": "Ease In Expo",
    "ease-out-expo": "Ease Out Expo",
    "ease-in-out-expo": "Ease In-Out Expo",
    "ease-in-circ": "Ease In Circ",
    "ease-out-circ": "Ease Out Circ",
    "ease-in-out-circ": "Ease In-Out Circ",
};

/** All available easing presets, backed by value.js timing functions. */
export const EASING_PRESETS: Record<string, EasingPreset> = Object.fromEntries(
    Object.entries(EASING_LABELS).map(([name, label]) => [
        name,
        { label, fn: timingFunctions[name as keyof typeof timingFunctions] as EasingFn },
    ]),
);

export const EASING_PRESET_NAMES = Object.keys(EASING_PRESETS);

/** Resolve an easing function by preset name, falling back to linear. */
export function getEasingFn(name: string): EasingFn {
    return EASING_PRESETS[name]?.fn ?? EASING_PRESETS.linear.fn;
}

// ── Animation easing options (compact in-out subset) ────────────────

export type AnimationEasingName = "linear" | "sine" | "quad" | "cubic" | "circ" | "expo";

export const ANIMATION_EASINGS: Record<AnimationEasingName, {
    label: string;
    fn: EasingFn;
    description: string;
}> = {
    linear:  { label: "Linear",      fn: (t) => t,          description: "Constant rate" },
    sine:    { label: "Sine",        fn: easeInOutSine,     description: "Gentle ebb and flow" },
    quad:    { label: "Quadratic",   fn: easeInOutQuad,     description: "Smooth acceleration" },
    cubic:   { label: "Cubic",       fn: easeInOutCubic,    description: "Pronounced ease" },
    circ:    { label: "Circular",    fn: easeInOutCirc,     description: "Snappy midpoint" },
    expo:    { label: "Exponential", fn: easeInOutExpo,     description: "Dramatic slow-fast-slow" },
};

// ── SVG path utilities ──────────────────────────────────────────────

/** Generate an SVG path `d` attribute by sampling an easing function (normalized 0-1 coords). */
export function generateCurveSVGPath(fn: EasingFn, n = 32): string {
    const pts: string[] = [];
    for (let i = 0; i <= n; i++) {
        const t = i / n;
        const v = fn(t);
        pts.push(`${t.toFixed(3)},${(1 - v).toFixed(3)}`);
    }
    return `M ${pts.join(" L ")}`;
}

const _svgCache = new Map<AnimationEasingName, string>();

/** Get the cached SVG path for an animation easing curve. */
export function getEasingSVGPath(name: AnimationEasingName): string {
    let p = _svgCache.get(name);
    if (!p) {
        p = generateCurveSVGPath(ANIMATION_EASINGS[name].fn);
        _svgCache.set(name, p);
    }
    return p;
}

/**
 * Generate an SVG path `d` string for a morph easing curve preview.
 * Draws the easing function as a polyline in a 40x20 viewBox.
 */
export function easingCurvePath(name: string): string {
    const fn = EASING_PRESETS[name]?.fn ?? ((t: number) => t);
    const steps = 24;
    let d = "";
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const v = fn(t);
        const x = 2 + t * 36;
        const y = 18 - v * 16;
        d += i === 0 ? `M${x},${y}` : ` L${x},${y}`;
    }
    return d;
}
