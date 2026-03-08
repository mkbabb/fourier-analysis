/**
 * Utilities for working with pre-computed Fourier path data.
 *
 * All Fourier decompositions are pre-computed in Python and shipped as
 * static JSON. This module handles:
 * - Converting partial-sum point arrays to SVG path `d` strings
 * - Interpolating between two same-length point arrays
 * - Selecting the right harmonic level for a given animation t
 */

import { catmullRomToBezier } from "@mkbabb/pencil-boil";
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

/** Convert {x[], y[]} to [[x,y], ...] point array. */
export function xyToPoints(xy: { x: number[]; y: number[] }): [number, number][] {
    const points: [number, number][] = new Array(xy.x.length);
    for (let i = 0; i < xy.x.length; i++) {
        points[i] = [xy.x[i], xy.y[i]];
    }
    return points;
}

/** Convert a point array to an SVG path `d` string using Catmull-Rom smoothing. */
export function pointsToSvgPath(
    points: [number, number][],
    closed: boolean = true,
): string {
    if (points.length < 2) return "";
    if (!closed) return catmullRomToBezier(points);

    // For closed paths, use modular indexing so tangents wrap at the seam
    const n = points.length;
    let d = `M${points[0][0]},${points[0][1]}`;

    for (let i = 0; i < n; i++) {
        const p0 = points[(i - 1 + n) % n];
        const p1 = points[i];
        const p2 = points[(i + 1) % n];
        const p3 = points[(i + 2) % n];

        const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
        const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
        const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
        const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

        d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
    }

    return d + " Z";
}

/** Pre-process a FourierPathData into a FourierShape with cached point arrays. */
export function prepareFourierShape(data: FourierPathData): FourierShape {
    const pointsByLevel = new Map<number, [number, number][]>();

    for (const level of data.levels) {
        const key = String(level);
        const ps = data.partial_sums[key];
        if (ps) {
            pointsByLevel.set(level, xyToPoints(ps));
        }
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
    const n = Math.min(a.length, b.length);
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
