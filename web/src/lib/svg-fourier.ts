/**
 * Utilities for working with pre-computed Fourier path data.
 *
 * All Fourier decompositions are pre-computed in Python and shipped as
 * static JSON. This module handles:
 * - Converting partial-sum point arrays to SVG path `d` strings
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
    const points: [number, number][] = new Array(xy.x.length);
    for (let i = 0; i < xy.x.length; i++) {
        points[i] = [xy.x[i], xy.y[i]];
    }
    return points;
}

/**
 * Convert a point array to a closed SVG path `d` string using Catmull-Rom
 * smoothing, with modular indexing so tangents wrap at the seam.
 *
 * X.F.W4 · FM-22 (= FR-AH-53) — THE `closed = false` BRANCH IS DELETED, and the
 * `catmullRomToBezier` import with it. The parameter defaulted to `true` and
 * the tree-wide caller census is exactly two, both single-argument
 * (`useFourierMorph.ts` and `HarmonicLevelGrid.vue`), so the open branch was
 * unreachable APP-WIDE and the producer edge behind it was dead code riding
 * every bundle that touched this module.
 * ⊘ HLG-43's repair hazard is respected: `@mkbabb/pencil-boil` is NOT removable
 * as a dependency — it keeps two other live consumers
 * (`FourierShapeExtractor.vue`, `SvgFilters.vue`). Only this EDGE dies.
 *
 * X.F.W4 · SP-19 — DMT N-14's 2dp EMISSION ⊕ FMD-N6's precision leg, in the one
 * place that can carry them.
 *
 * Every coordinate was emitted at full float64 — 17 significant digits per
 * number — into a `0 0 200 200` viewBox rendered at ≤180px. That is ~57 K chars
 * per path, rebuilt and re-parsed by the engine on every frame of a morph
 * (~1.2 MB of transient text per toggle) and ~667.6 KiB resident across the
 * twelve-cell strip. Rounding the INPUT points does not fix it: the Catmull-Rom
 * control points are computed from them here, so full precision comes straight
 * back in the arithmetic — the rounding has to happen at EMISSION, which is
 * this function.
 *
 * Two decimals is 0.01 user units, i.e. **0.0022px** at the toggle's 44px box
 * and 0.009px at the strip's 200px — below what any display can resolve, and
 * the figure DMT N-14 names.
 */
const EMIT_DP = 2;

/** Emit a coordinate at the ladder's resolution, without trailing zeros. */
function n(v: number): string {
    return String(Number(v.toFixed(EMIT_DP)));
}

export function pointsToSvgPath(points: [number, number][]): string {
    if (points.length < 2) return "";

    const count = points.length;
    let d = `M${n(points[0][0])},${n(points[0][1])}`;

    for (let i = 0; i < count; i++) {
        const p0 = points[(i - 1 + count) % count];
        const p1 = points[i];
        const p2 = points[(i + 1) % count];
        const p3 = points[(i + 2) % count];

        const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
        const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
        const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
        const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

        d += ` C${n(cp1x)},${n(cp1y)} ${n(cp2x)},${n(cp2y)} ${n(p2[0])},${n(p2[1])}`;
    }

    return d + " Z";
}

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

    const n = a.length;
    const out: [number, number][] = new Array(n);
    const t1 = 1 - t;
    for (let i = 0; i < n; i++) {
        out[i] = [a[i][0] * t1 + b[i][0] * t, a[i][1] * t1 + b[i][1] * t];
    }
    return out;
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
