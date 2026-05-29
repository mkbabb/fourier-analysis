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
import { apiFetch } from "../api";

export async function computeEquation(
    req: ComputeEquationRequest,
): Promise<ComputeEquationResponse> {
    return apiFetch<ComputeEquationResponse>("/api/equations/compute", "eq-compute", {
        method: "POST",
        body: req,
    });
}

export async function simplifyCoefficients(
    components: BasisComponent[],
    budget: number,
    notation: string,
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
    };
    return apiFetch<SimplifyResponse>("/api/equations/simplify", "eq-simplify", {
        method: "POST",
        body: req,
    });
}

export { isAbortError } from "../api";
