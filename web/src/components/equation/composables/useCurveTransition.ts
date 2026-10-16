/**
 * Smooth lerp transition between old and new curve data.
 *
 * When the function changes, snapshots the old state (Y-values, harmonics,
 * DC, Y-bounds) and drives a 500ms eased interpolation to the new state.
 */

import { easeInOutSine } from "@mkbabb/value.js/easing";

export interface TrigHarmonic {
    k: number;
    a_n: number;
    b_n: number;
    amplitude: number;
}

export interface TransitionState {
    progress: number; // 0→1
    prevOrigY: number[];
    prevHarmonics: TrigHarmonic[];
    prevDcRe: number;
    prevMinY: number;
    prevMaxY: number;
}

const DURATION = 500;

export function createTransitionState(): TransitionState {
    return { progress: 1, prevOrigY: [], prevHarmonics: [], prevDcRe: 0, prevMinY: 0, prevMaxY: 1 };
}

/**
 * Start a lerp transition. Calls `onFrame` each rAF tick until complete.
 * Returns a cancel function.
 *
 * `D-9 + C-2` — this is the second of the plot's three JS clocks, and
 * `prefers-reduced-motion` reaches it as an ARGUMENT rather than a media query:
 * the module is pure and node-assertable (`G-F4-VITEST`), and a `matchMedia`
 * call inside it would end that. ⊘ `M-D1`'s law holds here too — the reduced arm
 * settles at the TERMINAL frame (`progress = 1`, the NEW curve) and paints once,
 * never at `progress = 0`, which is the old curve the transition exists to leave.
 */
export function startTransition(
    state: TransitionState,
    onFrame: () => void,
    reducedMotion = false,
): () => void {
    if (reducedMotion) {
        state.progress = 1;
        onFrame();
        return () => {};
    }
    state.progress = 0;
    const start = performance.now();
    let rafId: number | null = null;

    function tick(now: number) {
        const elapsed = now - start;
        state.progress = easeInOutSine(Math.min(1, elapsed / DURATION));
        onFrame();
        if (state.progress < 1) rafId = requestAnimationFrame(tick);
        else rafId = null;
    }
    rafId = requestAnimationFrame(tick);

    return () => { if (rafId !== null) cancelAnimationFrame(rafId); };
}

/** Snapshot current curve state into the transition for lerping FROM. */
export function snapshotForTransition(
    state: TransitionState,
    origY: number[],
    harmonics: TrigHarmonic[],
    dcRe: number,
    origX: number[],
    domain: [number, number],
): void {
    state.prevOrigY = [...origY];
    state.prevHarmonics = harmonics.map((h) => ({ ...h }));
    state.prevDcRe = dcRe;

    // Compute current Y-bounds for smooth lerp
    const omega = (2 * Math.PI) / (domain[1] - domain[0]);
    const fullSum = origY.map((_, i) => {
        const x = origX[i] ?? domain[0];
        let v = dcRe;
        for (const h of harmonics) v += h.a_n * Math.cos(h.k * omega * x) + h.b_n * Math.sin(h.k * omega * x);
        return v;
    });
    const all = [...origY, ...fullSum];
    const rawMin = Math.min(...all), rawMax = Math.max(...all);
    const pad = (rawMax - rawMin) * 0.08 || 1;
    state.prevMinY = rawMin - pad;
    state.prevMaxY = rawMax + pad;
}
