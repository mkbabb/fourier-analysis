/**
 * Utilities for working with pre-computed Fourier path data.
 *
 * All Fourier decompositions are pre-computed in Python and shipped as
 * static JSON. This module handles:
 * - Interpolating between two same-length point arrays
 * - Selecting the right harmonic level for a given animation t
 */

import type { BasisComponent } from "./types";

/** Pre-computed Fourier path data (matches Python script output). */
export interface FourierPathData {
    original: { x: number[]; y: number[] };
    decomposition: {
        basis: string;
        domain: [number, number];
        components: BasisComponent[];
    };
    partial_sums: Record<string, { x: number[]; y: number[] }>;
    eval_points: number[];
    levels: number[];
    n_harmonics: number;
    n_samples: number;
    n_eval: number;
}

/** A pre-processed shape ready for morphing. */
export interface FourierShape {
    data: FourierPathData;
    /** Pre-converted point arrays for each level: level → [x,y][] */
    pointsByLevel: Map<number, [number, number][]>;
}

/**
 * Convert {x[], y[]} to [[x,y], ...] point array.
 *
 * FR-AH-37 — module-private. It was exported and had exactly one caller, in
 * this file: a public surface with no public consumer, which a dead-code sweep
 * cannot see because the export IS the reference.
 */
function xyToPoints(xy: { x: number[]; y: number[] }): [number, number][] {
    return xy.x.map((x, i): [number, number] => [x, xy.y[i]]);
}

// The SVG emission (Catmull-Rom through every point, 2dp at emission: X.F.W4
// SP-19 / DMT N-14) is `svgPathOf` in @mkbabb/fourier, byte-identical to the
// `pointsToSvgPath` it replaces.

/**
 * Pre-process a FourierPathData into a FourierShape with cached point arrays.
 *
 * X.F.W4 · SP-19 — DMT N-15, THE THROW AT PREPARE.
 *
 * This module's error posture was uniformly silent, and the silence compounded:
 * a renamed or dropped `partial_sums` key was swallowed by `if (ps)`, bracketing
 * degraded through `loPoints ?? hiPoints ?? []`, an empty array became `d=""`,
 * and the result was an INVISIBLE GLYPH with no diagnostic anywhere — a data
 * contract break that renders as a design choice. The asset is a build input,
 * so an empty map can only mean the shipped JSON and this code disagree about
 * its shape, and that is worth failing loudly at prepare rather than silently at
 * paint.
 */
export function prepareFourierShape(data: FourierPathData): FourierShape {
    const pointsByLevel = new Map<number, [number, number][]>();

    for (const level of data.levels) {
        const key = String(level);
        const ps = data.partial_sums[key];
        if (ps) {
            pointsByLevel.set(level, xyToPoints(ps));
        }
    }

    if (pointsByLevel.size === 0) {
        throw new Error(
            `prepareFourierShape: no usable levels — ${data.levels.length} declared in \`levels\`, ` +
                `none present in \`partial_sums\` (keys: ${Object.keys(data.partial_sums).join(", ") || "none"}). ` +
                `The shape asset and this reader disagree about its shape.`,
        );
    }

    return { data, pointsByLevel };
}

/**
 * Linearly interpolate between two same-length point arrays.
 * t=0 returns `a`, t=1 returns `b`.
 */
export function lerpPoints(
    a: [number, number][],
    b: [number, number][],
    t: number,
): [number, number][] {
    /**
     * X.F.W4 · SP-19 — FM-23, the UNIFORM-LENGTH assertion, and the one link
     * DMT N-15's emptiness check does NOT catch.
     *
     * `Math.min(a.length, b.length)` silently truncated to the shorter array, so
     * two shapes sampled at different resolutions cross-faded into a partial
     * path that closed early — geometrically wrong, entirely silent, and
     * INVISIBLE to an emptiness check because both operands are non-empty. The
     * two assertions are a pair by construction: one catches nothing present,
     * the other catches present-but-mismatched.
     */
    if (a.length !== b.length) {
        throw new Error(
            `lerpPoints: point arrays must be the same length (got ${a.length} and ${b.length}). ` +
                `Truncating to the shorter one produces a silently incomplete path.`,
        );
    }

    const t1 = 1 - t;
    return a.map(([ax, ay], i): [number, number] => [ax * t1 + b[i][0] * t, ay * t1 + b[i][1] * t]);
}

/**
 * Get the nearest pre-computed level for a given harmonic count.
 * Returns the largest level ≤ target (or the smallest available).
 */
export function nearestLevel(levels: number[], target: number): number {
    let best = levels[0];
    for (const l of levels) {
        if (l <= target) best = l;
        else break;
    }
    return best;
}

/**
 * Interpolate between two bracketing levels for smooth harmonic animation.
 * Returns a point array blended between the two nearest pre-computed levels.
 */
export function interpolateAtHarmonicLevel(
    shape: FourierShape,
    harmonicLevel: number,
): [number, number][] {
    const levels = shape.data.levels;
    const maxLevel = levels[levels.length - 1];
    const clamped = Math.max(levels[0], Math.min(maxLevel, harmonicLevel));

    // Find bracketing levels
    let lo = levels[0];
    let hi = levels[levels.length - 1];
    for (let i = 0; i < levels.length - 1; i++) {
        if (levels[i] <= clamped && levels[i + 1] >= clamped) {
            lo = levels[i];
            hi = levels[i + 1];
            break;
        }
    }

    const loPoints = shape.pointsByLevel.get(lo);
    const hiPoints = shape.pointsByLevel.get(hi);
    if (!loPoints || !hiPoints) {
        return loPoints ?? hiPoints ?? [];
    }

    if (lo === hi) return loPoints;

    const t = (clamped - lo) / (hi - lo);
    return lerpPoints(loPoints, hiPoints, t);
}
