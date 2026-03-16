/**
 * Session-storage cache for equation tab state and results.
 */

import type { NotationMode, ComputeEquationResponse } from "@/lib/equation/types";

const STATE_KEY = "eq-tab-state-v2";
const RESULT_KEY = "eq-tab-result-v2";

export interface CachedInputState {
    expression: string;
    domainStart: number;
    domainEnd: number;
    nHarmonics: number;
    budget: number;
    notation: NotationMode;
}

export interface CachedResult {
    result: ComputeEquationResponse;
    latex: string;
    energy: number;
}

export function loadCachedInputState(): CachedInputState | null {
    try {
        const raw = sessionStorage.getItem(STATE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

export function saveCachedInputState(s: CachedInputState): void {
    try { sessionStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch {}
}

export function loadCachedResult(): CachedResult | null {
    try {
        const raw = sessionStorage.getItem(RESULT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

export function saveCachedResult(
    r: ComputeEquationResponse,
    latex: string,
    energy: number,
): void {
    try { sessionStorage.setItem(RESULT_KEY, JSON.stringify({ result: r, latex, energy })); } catch {}
}
