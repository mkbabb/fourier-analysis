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
            readDetail(detail),
            typeof instance === "string" ? instance : undefined,
            // The ARRAY arm's raw value is kept addressable: `readDetail` renders
            // it for humans, and a caller that wants the per-field structure
            // (`loc`/`msg`/`type`) reads it back here rather than re-parsing prose.
            typeof detail === "string" || detail === undefined
                ? extensions
                : { ...extensions, detail },
        );
    }

    /** Convenience: is this problem of a specific type URN/URL? */
    is(typeUrn: string): boolean {
        return this.type === typeUrn;
    }
}

/**
 * X.F.W14V.p — the server's typed answer to a publish sent with no session
 * (401 `urn:contract:owner-required`, `api/routers/visualizations.py`): the
 * caller asks for the sign-in, it does not report an error.
 */
export function isOwnerRequired(e: unknown): e is ApiProblem {
    return e instanceof ApiProblem && e.is("urn:contract:owner-required");
}

/**
 * `C·D-02`'s envelope half (X·F F.W4 `.f`; the consumer half landed at `.b`).
 *
 * RFC 7807 types `detail` as a string, and FastAPI does not: a `HTTPException`
 * emits `{"detail": "…"}` while a request-validation failure emits
 * `{"detail": [{loc, msg, type}, …]}`. The prior reader tested
 * `typeof detail === "string"` and DROPPED everything else — and because the
 * destructure had already removed `detail` from `...extensions`, the array form
 * survived nowhere at all: the sole actionable half of a 422 was parsed and then
 * discarded on the way to the caller.
 */
function readDetail(detail: unknown): string | undefined {
    if (typeof detail === "string") return detail.trim() || undefined;
    if (!Array.isArray(detail)) return undefined;
    const lines = detail
        .map((entry) => {
            if (typeof entry === "string") return entry;
            if (entry === null || typeof entry !== "object") return "";
            const { loc, msg } = entry as { loc?: unknown; msg?: unknown };
            const message = typeof msg === "string" ? msg : "";
            const field = Array.isArray(loc)
                ? loc.filter((p) => typeof p === "string" || typeof p === "number").join(".")
                : "";
            if (!message) return field;
            return field ? `${field}: ${message}` : message;
        })
        .filter((line) => line.length > 0);
    return lines.length > 0 ? lines.join("; ") : undefined;
}

/**
 * SP-12's RFC-7807 discard row, at the seam (`FR-AFP-22` = `FR-AUL-50` =
 * `FR-USB-9` = the `EV-C·D-02` cohort).
 *
 * Every catch in this app was `catch (e: any)` reading `e.message`, and
 * `ApiProblem`'s constructor calls `super(title)` — so `.message` carries the
 * TITLE only and `detail`, the sole actionable half of the server's answer, was
 * stored and never read. Three further holes close with it: `e.message ??
 * fallback` never fires for an EMPTY message (`"" ?? x` is `""`, and
 * `statusText` is empty under HTTP/2); a non-`Error` throw rendered
 * `undefined`; and an aborted request's `DOMException` was reported as a
 * failure at sites that had cancelled it themselves.
 *
 * This is the ONE reader: the gallery route's duplicate
 * (`components/visualization/gallery/adminError.ts`) is deleted and its
 * importers read here (X.F.W14U.shell, UIA-F-121).
 */
export function problemMessage(e: unknown, fallback: string): string {
    return problemDetail(e) ?? fallback;
}

/**
 * The actionable text a failure carries, or `undefined` when it carries none
 * (a bare reason phrase, an empty message, a non-`Error` throw). A toast shows
 * it as its description under the act's own title (X.F.W14V.au6, A2-FO-L1-21).
 */
export function problemDetail(e: unknown): string | undefined {
    if (e instanceof ApiProblem) {
        const detail = e.detail?.trim();
        if (detail && !isReasonPhrase(detail, e.status)) return detail;
        const title = e.title?.trim();
        if (title && !isReasonPhrase(title, e.status)) return title;
        return undefined;
    }
    if (e instanceof Error) {
        const message = e.message?.trim();
        if (message) return message;
    }
    return undefined;
}

/**
 * X.F.W14U.shell — UIA-F-121: a bare `HTTPException(403, "Forbidden")` (the
 * server's `admin_required`) and every non-problem body reach the consumer as
 * the HTTP reason phrase alone — "Forbidden", "Not Found" — which says neither
 * what happened nor what to do. Such text is not a message: the caller's
 * specific fallback is. (The server half — raising the typed `admin_forbidden`
 * — is not this consumer's to write.)
 */
const REASON_PHRASES: Record<number, string> = {
    400: "bad request",
    401: "unauthorized",
    403: "forbidden",
    404: "not found",
    405: "method not allowed",
    409: "conflict",
    410: "gone",
    413: "payload too large",
    415: "unsupported media type",
    422: "unprocessable entity",
    429: "too many requests",
    500: "internal server error",
    502: "bad gateway",
    503: "service unavailable",
    504: "gateway timeout",
};

function isReasonPhrase(text: string, status: number): boolean {
    return text.toLowerCase() === REASON_PHRASES[status];
}

/** Read a `RateLimit-Reset` header (seconds) for 429 backoff. */
export function readRateLimitResetSeconds(response: Response): number | null {
    const raw = response.headers.get("RateLimit-Reset");
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
}
