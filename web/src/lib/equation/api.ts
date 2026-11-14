/**
 * Equation API surface.
 *
 * E.W5: the local `eqFetch` + the 2 `as unknown as` casts retire. Equation
 * routes now share the canonical fetch core (`apiFetch` in `web/src/lib/api.ts`)
 * — one inflight registry, one error-handling path, one place to wire
 * ApiProblem + RateLimit retry. The pre-W5 `eqFetch` was a 4th fetch helper
 * with its own AbortController registry that duplicated `apiFetch`'s body
 * branching while forcing object→Record<string, unknown> casts to satisfy
 * its tighter parameter type. The cast retires structurally because the new
 * core types `body` as `FormData | Record<string, unknown> | BodyInit | undefined`.
 */

import type {
    ComputeEquationRequest,
    ComputeEquationResponse,
    SimplifyRequest,
    SimplifyResponse,
    FourierTermDTO,
} from "./types";
import type { BasisComponent } from "@/lib/types";
import { apiFetch, runJob, type JobHandlers } from "../api";

/**
 * O16 (owner frame 50): the series is a compute job (`/api/equations/jobs`,
 * docs/api/compute-jobs.md). `on` receives its stages (`integrate` with
 * `done`/`total`, ...) and partials (`samples`: f(x) on the grid, first;
 * `coefficient`: one term at a time, 0, +1, -1, +2, ...), so the page can draw
 * the function at once and the series sharpening as the terms land. The
 * answer is the synchronous route's response, field for field.
 */
export async function computeEquation(
    req: ComputeEquationRequest,
    on: JobHandlers = {},
): Promise<ComputeEquationResponse> {
    return runJob<ComputeEquationResponse>("/api/equations/jobs", req, "eq-compute", on);
}

export async function simplifyCoefficients(
    components: BasisComponent[],
    budget: number,
    notation: string,
    autoHarmonics = false,
): Promise<SimplifyResponse> {
    const coefficients: FourierTermDTO[] = components.map((c) => ({
        n: c.index,
        coefficient_re: c.coefficient[0],
        coefficient_im: c.coefficient[1],
        amplitude: c.amplitude,
        phase: c.phase,
    }));

    const req: SimplifyRequest = {
        coefficients,
        budget,
        notation: notation as SimplifyRequest["notation"],
        auto_harmonics: autoHarmonics,
    };
    return apiFetch<SimplifyResponse>("/api/equations/simplify", "eq-simplify", {
        method: "POST",
        body: req,
    });
}

/**
 * The two abort keys this route owns. Named here so the teardown that cancels
 * them cannot drift from the calls that register them (`L·M-7`).
 */
export const EQUATION_ABORT_KEYS = ["eq-compute", "eq-simplify"] as const;

export { isAbortError, abortInflight } from "../api";
