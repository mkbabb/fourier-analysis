# E.W5 — β.1 Fourier consumer hardening

**Wave**: E.W5 — β.1 fourier consumer hardening (T8 ApiProblem + T-E1+T-S5 fetch-helper collapse + retire 2 `as unknown as` survivors).
**Closed**: 2026-05-28.
**Status**: GREEN.
**Authority**: `E.md §3` row W5; `coordination/CONSUMER-HARDENING.md §4-§5`; ARCH-TRANSPOSITIONS-E.md T-E1/T-E2.

## §1 — The T8 typed `ApiProblem` class

NEW at `web/src/lib/api-problem.ts` — RFC 7807 typed error class. Per-repo authored (inv-16; value.js side authors its own copy at value.js-side scope, NOT shared).

```typescript
export class ApiProblem extends Error {
    constructor(
        public readonly type: string,
        public readonly title: string,
        public readonly status: number,
        public readonly detail?: string,
        public readonly instance?: string,
        public readonly extensions: Record<string, unknown> = {},
    ) { super(title); this.name = "ApiProblem"; }
    static async from(response: Response): Promise<ApiProblem> { /* ... */ }
    is(typeUrn: string): boolean { return this.type === typeUrn; }
}
```

The `from(response)` static factory tolerates non-problem+json bodies (falls back to `about:blank` + `statusText`). Callers can `instanceof ApiProblem` + `apiProblem.is("urn:...:not_found")` for typed branching.

## §2 — T-E1 + T-S5 fetch-helper collapse

Pre-W5: **4 fetch helpers** with overlapping responsibilities:
- `apiFetch` (general; session auth) — `web/src/lib/api.ts`
- `apiFetchWithETag` (general + ETag capture) — `web/src/lib/api.ts`
- `adminFetch` (Bearer + session) — `web/src/lib/api.ts`
- `eqFetch` (POST-only; tighter body type forcing `as unknown as` casts) — `web/src/lib/equation/api.ts`

Two independent inflight registries (`api.ts:105` + `equation/api.ts:12`).

Post-W5: **One parametric `coreFetch<T>`** at `web/src/lib/api.ts:130`. The 3 named exports (`apiFetch`, `apiFetchWithETag`, `adminFetch`) become **thin pass-throughs** preserving caller signatures; `eqFetch` retires entirely. The equation/api.ts file (was 58 LoC) is now 54 LoC, with `computeEquation` + `simplifyCoefficients` calling `apiFetch` directly.

**Single inflight registry** at `api.ts:105` (eqFetch's separate Map gone). Abort keys remain caller-controlled strings.

## §3 — The 2 `as unknown as` survivors retired STRUCTURALLY

Pre-W5: `web/src/lib/equation/api.ts:36,53` forced `req as unknown as Record<string, unknown>` because eqFetch's body parameter was typed as `Record<string, unknown>` — too strict to accept typed Zod-derived interfaces (`ComputeEquationRequest`, `SimplifyRequest`).

Post-W5: the new `coreFetch` body type is `FormData | BodyInit | object`. The `object` widening accepts any non-primitive (typed interfaces, plain literals, arrays) without a cast. The 2 cast survivors retired NOT by removing them in place but by widening the parameter type at the boundary — a structural retirement consistent with the binding doc `CONSUMER-HARDENING.md §5`.

**Verification**: `git grep -nE "as unknown as" web/src/` returns ZERO source matches (one doc-comment mention in equation/api.ts referencing the retirement is intentional).

## §4 — coreFetch capabilities (the parametric core)

| Capability | Wire-level | API |
|---|---|---|
| Auth: session | `X-Session-Token: <sessionToken>` | `auth: "session"` (default) |
| Auth: admin | `Authorization: Bearer <adminToken>` + session token | `auth: "admin", adminToken: "..."` |
| Auth: none | no auth headers | `auth: "none"` |
| Body: JSON | `Content-Type: application/json` + `JSON.stringify(body)` | `body: anyObject` |
| Body: multipart | `Content-Type` set by browser | `body: aFormData` |
| Body: raw | passthrough | `body: Blob | ArrayBuffer | ReadableStream | string` |
| If-Match | `If-Match: <etag>` | `ifMatch: "<etag>"` |
| Idempotency-Key | `Idempotency-Key: <uuid>` | `idempotencyKey: "<uuid>"` |
| Retry on 429 | reads `RateLimit-Reset` header, waits N seconds, up to 2 retries | `retryOn429: true` (default) |
| ApiProblem error | parses problem+json bodies; falls back for non-problem+json | always-on; throws typed `ApiProblem` |
| ETag capture | reads `ETag` response header into result | exposed via `coreFetch` (used by `apiFetchWithETag`) |
| 204 No Content | returns `data: undefined` | always-on |

## §5 — Retry-on-429 with RateLimit-Reset backoff (B4 hardening)

Per `CONSUMER-HARDENING.md §3 B4`: 429 responses cascaded as failures. Now:
- Reads `RateLimit-Reset` header (in seconds).
- Waits the indicated seconds (capped at 30s; falls back to exponential `2^attempt` if header absent).
- Retries up to 2 times before throwing.

Wχ-P3 classified B4 as HYGIENE (no live 429s observed). The retry is opt-out via `retryOn429: false`. Implementation cost was negligible since it lives in `coreFetch` (one capability among many).

## §6 — ETag + If-Match (B2 + B8 hardening)

- **B2**: the existing `apiFetchWithETag` wrapper preserves the named-export shape; the underlying `coreFetch` now exposes `ifMatch` as a typed option so callers can replay captured ETags as `If-Match`.
- **B8 cohort symmetry**: the value.js demo's own ApiProblem + If-Match work lands at E.W6 (cross-repo coord).

## §7 — Idempotency-Key (B3 + B9 hardening)

The `idempotencyKey` option is plumbed through `coreFetch` and exposed in `ApiFetchOptions`. Callers can pass a UUID for POST + PUT to make duplicate-submission a no-op at the API side. The full Idempotency-Key middleware on the value.js side is folded into E.W10 δ (per W4 close); the fourier-side plumbing is ready when the server-side replay lands.

## §8 — Verification

| Probe | Result |
|---|---|
| `vue-tsc --noEmit` | **0 errors** ✓ |
| `git grep -nE "as unknown as" web/src/` | 0 source matches; 1 doc-comment mention (intentional) ✓ |
| `npm run build` | **built in 2.60s** ✓ (bundle: index 854 kB; will split at W7 T-P1) |
| Named-export count in `api.ts` | preserved (44 exports; zero removed) ✓ |
| `apiFetch` / `apiFetchWithETag` / `adminFetch` signatures | preserved (callers unchanged) ✓ |
| `inflight` Map count | 1 (was 2) ✓ |

## §9 — What this wave IS and IS NOT

**IS**: T8 typed `ApiProblem` class (RFC 7807); T-E1+T-S5 fetch-helper collapse (4 → 1 core; the 3 named wrappers preserve caller compatibility); 2 `as unknown as` cast survivors retired structurally; ApiProblem error path on every fetch; retry-on-429 with RateLimit-aware backoff (B4); If-Match + Idempotency-Key plumbed in `coreFetch`.

**IS NOT**: a rewrite of the 44 caller business-functions (`createVisualization`, `getMe`, etc.) — those are untouched. The collapse touches only the fetch substrate (`api.ts:130-310` + `equation/api.ts`).

## §10 — W5 close gate

W5 closes when (a) `web/src/lib/api-problem.ts` lands with the T8 class; (b) the 4-helper collapse retires the 2 `as unknown as` survivors structurally; (c) `vue-tsc --noEmit` is clean; (d) `npm run build` succeeds; (e) all 44 api.ts named-exports preserved. All five met. **W5 is GREEN.** W6 (β.2 value.js demo + csp-solver consumer hardening) opens.

## §11 — Carry-forward

- **csp-solver `useApi.ts` `VITE_API_URL` fix**: cross-repo coord ASK at W6 (no local clone; one-line PATCH at the maintainer).
- **value.js demo `ApiProblem` + If-Match + Idempotency-Key**: lands at W6 in the value.js repo (per-repo author per inv-16).
- **Idempotency-Key API-side middleware** (24h replay): folded to E.W10 δ per W4 close.
