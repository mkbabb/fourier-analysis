/**
 * Web Worker for precomputing traces.
 * Receives BasisDecomposition + evaluation params, returns Float64Array traces.
 */

import type { BasisDecomposition } from "./types";
import { evaluateFourier, evaluateChebyshev, evaluateLegendre } from "./evaluators";

interface WorkerMessage {
    id: string;
    decomposition: BasisDecomposition;
    nEval: number;
    levels?: number[];
}

interface WorkerResult {
    id: string;
    traces: Record<number, { x: Float64Array; y: Float64Array }>;
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const { id, decomposition, nEval, levels } = e.data;
    const traces: Record<number, { x: Float64Array; y: Float64Array }> = {};

    const computeLevels = levels ?? [decomposition.components.length];

    for (const level of computeLevels) {
        const x = new Float64Array(nEval);
        const y = new Float64Array(nEval);
        const subset = decomposition.components.slice(0, level);

        for (let i = 0; i < nEval; i++) {
            const t = i / nEval;
            if (decomposition.basis === "fourier") {
                const [re, im] = evaluateFourier(subset, t);
                x[i] = re;
                y[i] = im;
            } else {
                const s = -1 + 2 * t;
                const evalFn =
                    decomposition.basis === "chebyshev" ? evaluateChebyshev : evaluateLegendre;
                x[i] = evalFn(subset, s);
                y[i] = t; // Placeholder; real use has separate x/y decompositions
            }
        }
        traces[level] = { x, y };
    }

    const transferables: ArrayBuffer[] = [];
    for (const trace of Object.values(traces)) {
        transferables.push(trace.x.buffer as ArrayBuffer, trace.y.buffer as ArrayBuffer);
    }

    self.postMessage({ id, traces } satisfies WorkerResult, { transfer: transferables });
};
