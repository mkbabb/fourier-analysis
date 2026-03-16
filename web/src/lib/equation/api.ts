import type {
    ComputeEquationRequest,
    ComputeEquationResponse,
    SimplifyRequest,
    SimplifyResponse,
    FourierTermDTO,
} from "./types";
import type { BasisComponent } from "@/lib/types";

const BASE = import.meta.env.VITE_API_URL || "";

const inflight = new Map<string, AbortController>();

function abortable(key: string): AbortSignal {
    inflight.get(key)?.abort();
    const ac = new AbortController();
    inflight.set(key, ac);
    return ac.signal;
}

async function eqFetch<T>(path: string, key: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortable(key),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "(no body)");
        throw new Error(`API ${res.status}: ${text}`);
    }
    return res.json();
}

export async function computeEquation(req: ComputeEquationRequest): Promise<ComputeEquationResponse> {
    return eqFetch<ComputeEquationResponse>("/api/equations/compute", "eq-compute", req as unknown as Record<string, unknown>);
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

    const req: SimplifyRequest = { coefficients, budget, notation: notation as SimplifyRequest["notation"] };
    return eqFetch<SimplifyResponse>("/api/equations/simplify", "eq-simplify", req as unknown as Record<string, unknown>);
}

export function isAbortError(e: unknown): boolean {
    return e instanceof DOMException && e.name === "AbortError";
}
