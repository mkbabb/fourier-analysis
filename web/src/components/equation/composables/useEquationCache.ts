/**
 * Session-storage cache for equation tab state and results.
 *
 * X·F F.W4 `.b` — two rows land here:
 *
 *  `L·M-3 / C·C-29` — the result record carried NO statement of the request that
 *  produced it, while the input record rewrote on every keystroke. On restore
 *  the keys were re-seeded from the NEW inputs against an OLD result, `:174`
 *  tested nullity only, and so no corrective recompute could ever fire: three
 *  provenances on one screen. `CachedResult.key` is now that statement, and the
 *  view compares it instead of assuming it.
 *
 *  `C·D-04` — both loaders parsed untrusted JSON under a non-null type
 *  annotation and handed back whatever came out. A shape check now stands
 *  between `JSON.parse` and the caller, so a truncated or hand-edited record
 *  restores as `null` (a cold start) rather than as an object whose fields are
 *  dereferenced three lines later.
 */

import type { NotationMode, ComputeEquationResponse } from "@/lib/equation/types";

const STATE_KEY = "eq-tab-state-v2";
const RESULT_KEY = "eq-tab-result-v3";

const NOTATIONS: readonly NotationMode[] = ["trig", "exponential", "polar"];

export interface CachedInputState {
    expression: string;
    domainStart: number;
    domainEnd: number;
    nHarmonics: number;
    budget: number;
    notation: NotationMode;
}

export interface CachedResult {
    /** The compute key that produced `result` — see `L·M-3`. */
    key: string;
    result: ComputeEquationResponse;
    latex: string;
    energy: number;
}

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
}

function num(v: unknown): v is number {
    return typeof v === "number" && Number.isFinite(v);
}

function readJson(key: string): unknown {
    try {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function isCachedInputState(v: unknown): v is CachedInputState {
    return (
        isRecord(v) &&
        typeof v.expression === "string" &&
        num(v.domainStart) &&
        num(v.domainEnd) &&
        num(v.nHarmonics) &&
        num(v.budget) &&
        NOTATIONS.includes(v.notation as NotationMode)
    );
}

/**
 * The fields the view actually dereferences on restore — `coefficients` is
 * `.map`ped, `latex_sigma` is rendered, `effective_n` seeds a slider bound. A
 * deeper walk would buy nothing: the threat model is a truncated or stale
 * record, not an adversarial one (`fr-ConvergencePlot RD-3`), and every field
 * below is one the very next tick reads.
 */
function isCachedResult(v: unknown): v is CachedResult {
    if (!isRecord(v) || typeof v.key !== "string" || typeof v.latex !== "string") return false;
    if (!num(v.energy)) return false;
    const r = v.result;
    return (
        isRecord(r) &&
        Array.isArray(r.coefficients) &&
        typeof r.latex === "string" &&
        typeof r.latex_sigma === "string" &&
        num(r.effective_n) &&
        isRecord(r.original_points)
    );
}

export function loadCachedInputState(): CachedInputState | null {
    const parsed = readJson(STATE_KEY);
    return isCachedInputState(parsed) ? parsed : null;
}

export function saveCachedInputState(s: CachedInputState): void {
    try { sessionStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch {}
}

export function loadCachedResult(): CachedResult | null {
    const parsed = readJson(RESULT_KEY);
    return isCachedResult(parsed) ? parsed : null;
}

export function saveCachedResult(
    key: string,
    r: ComputeEquationResponse,
    latex: string,
    energy: number,
): void {
    try {
        sessionStorage.setItem(RESULT_KEY, JSON.stringify({ key, result: r, latex, energy }));
    } catch {}
}
