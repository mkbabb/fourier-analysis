/**
 * E.W5 — Typed RFC 7807 problem+json error class (T8 per ARCH-TRANSPOSITIONS-E
 * + CONSUMER-HARDENING.md §4). Independently authored per-repo (inv-16); the
 * value.js side authors its own copy at `value.js/demo/@/lib/api-problem.ts`.
 *
 * Semantics:
 *   - When the API returns `content-type: application/problem+json`, the
 *     fetch helper parses the body and throws an `ApiProblem` instance with
 *     `type`/`title`/`status`/`detail`/`instance` + arbitrary extension
 *     members (e.g. fourier emits `errors` for field-level zod failures).
 *   - When the API returns any other content-type on a non-2xx response, the
 *     fetch helper still throws an `ApiProblem` but with `type =
 *     "about:blank"` (the RFC 7807 default) and `title = statusText`.
 *   - `ApiProblem extends Error` so callers can `try { ... } catch (e) {
 *     if (e instanceof ApiProblem) { ... } }`.
 */

export class ApiProblem extends Error {
    constructor(
        public readonly type: string,
        public readonly title: string,
        public readonly status: number,
        public readonly detail?: string,
        public readonly instance?: string,
        public readonly extensions: Record<string, unknown> = {},
    ) {
        super(title);
        this.name = "ApiProblem";
    }

    /**
     * Parse a problem+json response body into an `ApiProblem`. The static
     * factory tolerates non-problem+json bodies (falls back to
     * `about:blank` + `statusText`).
     */
    static async from(response: Response): Promise<ApiProblem> {
        const body = await response.json().catch(() => ({})) as Record<string, unknown>;
        const { type, title, status, detail, instance, ...extensions } = body;
        return new ApiProblem(
            typeof type === "string" ? type : "about:blank",
            typeof title === "string" ? title : response.statusText,
            typeof status === "number" ? status : response.status,
            typeof detail === "string" ? detail : undefined,
            typeof instance === "string" ? instance : undefined,
            extensions,
        );
    }

    /** Convenience: is this problem of a specific type URN/URL? */
    is(typeUrn: string): boolean {
        return this.type === typeUrn;
    }
}

/** Read a `RateLimit-Reset` header (seconds) for 429 backoff. */
export function readRateLimitResetSeconds(response: Response): number | null {
    const raw = response.headers.get("RateLimit-Reset");
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
}
