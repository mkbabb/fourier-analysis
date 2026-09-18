/**
 * Shared easing catalogs and utility functions.
 *
 * Two catalogs:
 *  - EASING_PRESETS: comprehensive list used by the morph subsystem (in/out/in-out variants)
 *  - ANIMATION_EASINGS: compact subset used by the animation store (in-out only)
 *
 * ESC-4 (COHESION §0o, 2026-09-18) — DRIFT REFUSED. value.js 4.0.0 deletes
 * `timingFunctions` and ships no `"."` export, so the catalogue no longer
 * resolves 22 keys through one producer map. The eight keys the producer still
 * publishes analytically are imported from `@mkbabb/value.js/easing`; the other
 * fourteen are DEFINED HERE, each reproducing the pre-bump 0.13.0 function
 * EXACTLY (MPC-5's sampler asserts Δ = 0 at every sample point, all 22 keys).
 *
 * Six of the fourteen — `ease-in`/`ease-out`/`ease-in-out` and the three `back`
 * arms — were CSS cubic-bézier curves at 0.13.0 too, never analytic closed
 * forms, so their zero-drift definition is the bézier ITSELF, evaluated by the
 * solver this file now owns (`cssCubicBezier` below, the 0.13.0 algorithm to
 * the iteration count and epsilon). That is not the "CubicBezier approximation"
 * ESC-4 refuses: substituting an analytic curve with a bézier fit is the drift;
 * re-deriving a bézier key's own bézier is the identity. Routing those six
 * through the producer's 4.0.0 `CubicBezier` instead measures Δ ≈ 1.4e-6 — a
 * different solver, therefore a different function, therefore refused.
 */

import {
    linear,
    easeInOutQuad,
    easeOutCubic,
    easeInOutCubic,
    easeInOutSine,
    easeOutExpo,
    easeInOutExpo,
    easeInOutCirc,
} from "@mkbabb/value.js/easing";

// ── Types ───────────────────────────────────────────────────────────

export type EasingFn = (t: number) => number;

export interface EasingPreset {
    label: string;
    fn: EasingFn;
}

// ── The bézier seat (ESC-4): the corpus's own closed form ────────────

/** Linear interpolation — the de Casteljau step. */
const lerp = (start: number, end: number, t: number): number => (1 - t) * start + t * end;

/** de Casteljau evaluation of a 1-D Bézier control polygon. */
function deCasteljau(t: number, points: number[]): number {
    const n = points.length - 1;
    const b = [...points];
    for (let i = 1; i <= n; i++) {
        for (let j = 0; j <= n - i; j++) {
            b[j] = lerp(b[j]!, b[j + 1]!, t);
        }
    }
    return b[0]!;
}

/**
 * Solve X(t) = x for t — Newton-Raphson (8 iterations) with a 64-step
 * bisection fallback, epsilon 1e-6.
 */
function solveCubicBezierX(x: number, x1: number, x2: number, epsilon = 1e-6): number {
    let t = x;
    for (let i = 0; i < 8; i++) {
        const t2 = t * t;
        const t3 = t2 * t;
        const mt = 1 - t;
        const mt2 = mt * mt;
        const xt = 3 * mt2 * t * x1 + 3 * mt * t2 * x2 + t3 - x;
        if (Math.abs(xt) < epsilon) return t;
        const dxt = 3 * mt2 * x1 + 6 * mt * t * (x2 - x1) + 3 * t2 * (1 - x2);
        if (Math.abs(dxt) < 1e-12) break;
        t -= xt / dxt;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 64; i++) {
        const mt = 1 - t;
        const xt = 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t;
        if (Math.abs(xt - x) < epsilon) return t;
        if (x > xt) lo = t;
        else hi = t;
        t = (lo + hi) / 2;
    }
    return t;
}

/** A CSS `cubic-bezier(x1, y1, x2, y2)` timing function. */
const cssCubicBezier =
    (x1: number, y1: number, x2: number, y2: number): EasingFn =>
    (x: number) => {
        if (x <= 0) return 0;
        if (x >= 1) return 1;
        const t = solveCubicBezierX(x, x1, x2);
        return deCasteljau(t, [0, y1, y2, 1]);
    };

// ── The fourteen orphans, defined here (ESC-4) ──────────────────────

/** CSS `ease-in` — cubic-bezier(0.42, 0, 1, 1). */
const easeIn = cssCubicBezier(0.42, 0, 1, 1);
/** CSS `ease-out` — cubic-bezier(0, 0, 0.58, 1). */
const easeOut = cssCubicBezier(0, 0, 0.58, 1);
/** CSS `ease-in-out` — cubic-bezier(0.42, 0, 0.58, 1). */
const easeInOut = cssCubicBezier(0.42, 0, 0.58, 1);
/** The `back` arms — anticipation/overshoot, bézier-authored at 0.13.0. */
const easeInBack = cssCubicBezier(0.6, -0.28, 0.735, 0.045);
const easeOutBack = cssCubicBezier(0.175, 0.885, 0.32, 1.275);
const easeInOutBack = cssCubicBezier(0.68, -0.55, 0.265, 1.55);

const easeInQuad: EasingFn = (t) => t * t;
const easeOutQuad: EasingFn = (t) => -t * (t - 2);
const easeInCubic: EasingFn = (t) => t * t * t;
const easeInSine: EasingFn = (t) => 1 - Math.cos((t * Math.PI) / 2);
const easeOutSine: EasingFn = (t) => Math.sin((t * Math.PI) / 2);
const easeInExpo: EasingFn = (t) => (t === 0 ? 0 : 2 ** (10 * (t - 1)));
const easeInCirc: EasingFn = (t) => 1 - Math.sqrt(1 - t * t);
const easeOutCirc: EasingFn = (t) => Math.sqrt(1 - --t * t);

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

/**
 * The easing function for every catalogue key — eight from value.js 4.0.0's
 * `./easing`, fourteen owned here. One entry per `EASING_LABELS` key; the map
 * is exhaustive by construction, so no lookup can fall through (the deleted
 * `timingFunctions[name] as EasingFn` cast typechecked a miss and threw on the
 * first rAF tick).
 */
const EASING_FNS: Record<keyof typeof EASING_LABELS, EasingFn> = {
    linear,
    "ease-in": easeIn,
    "ease-out": easeOut,
    "ease-in-out": easeInOut,
    "ease-in-back": easeInBack,
    "ease-out-back": easeOutBack,
    "ease-in-out-back": easeInOutBack,
    "ease-in-quad": easeInQuad,
    "ease-out-quad": easeOutQuad,
    "ease-in-out-quad": easeInOutQuad,
    "ease-in-cubic": easeInCubic,
    "ease-out-cubic": easeOutCubic,
    "ease-in-out-cubic": easeInOutCubic,
    "ease-in-sine": easeInSine,
    "ease-out-sine": easeOutSine,
    "ease-in-out-sine": easeInOutSine,
    "ease-in-expo": easeInExpo,
    "ease-out-expo": easeOutExpo,
    "ease-in-out-expo": easeInOutExpo,
    "ease-in-circ": easeInCirc,
    "ease-out-circ": easeOutCirc,
    "ease-in-out-circ": easeInOutCirc,
};

/** All available easing presets. */
export const EASING_PRESETS: Record<string, EasingPreset> = Object.fromEntries(
    Object.entries(EASING_LABELS).map(([name, label]) => [
        name,
        { label, fn: EASING_FNS[name]! },
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
