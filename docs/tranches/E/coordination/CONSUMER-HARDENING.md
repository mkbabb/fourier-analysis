# E — consumer hardening (the "include ALL consumers" mandate)

**Status**: authored 2026-05-28. **Source**: EA3 §3 (the 6-consumer-surface enumeration + 10 brittlenesses B1–B10). **Authority**: this doc binds E.β scope; β waves W5 (fourier) + W6 (value.js demo + csp-solver coordination).

## §1 — The user's binding directive (2026-05-28)

> "Including ALL consumers."

EA3 enumerated 6 consumer surfaces; 4 are real consumers; 2 are confirmed non-consumers (recorded for completeness — value.js `src/` is a math library not a palette-api client; fourier `web/vendor/*.tgz` is the sibling-repo vendor pattern not a runtime consumer).

## §2 — The 6 consumer surfaces

### Real consumers (4)

1. **Fourier SPA** — `fourier-analysis/web/src/lib/api.ts` (708 LoC) + ancillary `web/src/lib/equation/api.ts` (the 2 `as unknown as` survivors). Brittlenesses **B1–B5** (per EA3).
2. **Fourier CF-Pages deploy** — the built artefact of #1; deployed as `fourier-682.pages.dev` ← `https://fourier.babb.dev`. No separate consumer code; bundles #1.
3. **Value.js demo** — `value.js/demo/@/lib/palette/api/*` (9 files). Brittlenesses **B6–B10**.
4. **color.babb.dev deploy** — the built artefact of #3; deployed as `color-enw.pages.dev` ← `https://color.babb.dev`. Bundles #3.
5. **csp-solver `useApi.ts`** — runtime hardcodes `api/v1` relative; same-origin assumption breaks under CF Pages (no backend on `sudoku.babb.dev`). Cross-repo residual. One-line fix.

### Non-consumers (confirmed; recorded)

6. **Value.js `src/`** (the npm library `@mkbabb/value.js`) — confirmed colour-math only; no palette-api HTTP calls.
7. **Fourier `web/vendor/*.tgz`** — confirmed the sibling-repo vendor pattern; tarballs are build-time, not runtime.

## §3 — The 11 brittlenesses (per EA3 §3 + Wχ-P5)

### B0 — palette-envelope field stability (added at Wχ close 2026-05-28)

Per Wχ-P5: each value.js-I wave that mutates the palette response (I.W1 visibility split, I.W2 soft-delete `deletedAt` add, I.W4 SOTA envelopes) audits whether any known consumer reads a deprecated field. The audit set is:
- **Fourier SPA** — `web/src/lib/api.ts` (the `palette_slug` round-trip; currently reads only `palette.slug` per EA3 §5)
- **Value.js demo** — `demo/@/lib/palette/api/*` (10 files; the BX brittlenesses below)
- **csp-solver** — the cross-repo coord at §6 (no palette consumption today)
- **Third-party** — any documented consumer in CRUD-CONTRACT.md should be enumerated

The cross-repo conformance probe T7 at E.W10 carries a **field-presence assertion** (§7 below) so field deletions surface at probe-time, not at consumer-breakage-time. If a wave drops a field, the consumer audit must coordinate the removal BEFORE the wave ships.

### Fourier SPA (B1–B5)

- **B1**: structured-error envelope swallow — `apiFetch` catches non-2xx and returns `null` without surfacing the problem+json body the v2.0.0 contract defines. Loss of error fidelity for the UI.
- **B2**: no `ETag`/`If-Match` round-trip — `PUT`/`PATCH` requests don't carry `If-Match`; concurrent edits silently overwrite.
- **B3**: no `Idempotency-Key` on `POST` — duplicate submission (browser back/forward navigation) creates duplicate resources.
- **B4**: no RateLimit-aware backoff — 429 responses cascade as failures; the `RateLimit-*` headers carry the wait time but the client doesn't read them.
- **B5**: two `as unknown as` casts at `web/src/lib/equation/api.ts:36,53` — the only NO-legacy debt remaining post-D; structural shim for the eqFetch helper.

### Value.js demo (B6–B10)

- **B6**: structured-error envelope swallow — same as B1 (mirror across the two consumers).
- **B7**: typed error class absent — the client renders generic "Something went wrong" instead of the problem+json `detail` + `type`.
- **B8**: no `If-Match` on palette updates — same hazard as B2.
- **B9**: vote/fork mutations not Idempotency-Key'd — duplicate votes on browser refresh.
- **B10**: no RateLimit-aware backoff — same as B4.

## §4 — The T8 typed `ApiProblem` class (the canonical fix)

Per EA5 T8 + EA3 §3. **Independently** authored in each consumer (inv-16: no shared TypeScript types package). The shape:

```typescript
// web/src/lib/api-problem.ts (fourier-E.W5)
// value.js/demo/@/lib/api-problem.ts (value.js-I.W4 or E.W6 cross-repo coord)
export class ApiProblem extends Error {
    constructor(
        public type: string,        // problem-type URL
        public title: string,        // human-readable
        public status: number,       // HTTP status code
        public detail?: string,      // longer explanation
        public instance?: string,    // URI to the specific occurrence
        public [key: string]: unknown // extension members
    ) {
        super(title);
        this.name = 'ApiProblem';
    }

    static async from(response: Response): Promise<ApiProblem> {
        const body = await response.json().catch(() => ({}));
        return new ApiProblem(
            body.type ?? 'about:blank',
            body.title ?? response.statusText,
            response.status,
            body.detail,
            body.instance,
            ...body,
        );
    }
}
```

Usage in `apiFetch`:

```typescript
const r = await fetch(url, init);
if (!r.ok) {
    if (r.headers.get('content-type')?.includes('application/problem+json')) {
        throw await ApiProblem.from(r);
    }
    throw new ApiProblem('about:blank', r.statusText, r.status);
}
```

**Each consumer authors its own.** Same shape, independent files. Inv-16 holds.

## §5 — The fetch-helper collapse (T-E1 + T-S5; closes B5 structurally)

Fourier's `web/src/lib/` currently has **four fetch helpers** with overlapping responsibilities:
- `apiFetch` (general)
- `apiFetchWithETag` (ETag handling)
- `adminFetch` (admin routes; auth header)
- `eqFetch` (equation routes; THIS is where the 2 `as unknown as` survive)

E.W5 collapses to **one parametric core**:

```typescript
// web/src/lib/api.ts (rewrite)
export interface FetchOptions {
    auth?: 'session' | 'admin' | 'none'
    etag?: string | null              // for If-Match
    idempotencyKey?: string | null    // for POST/PUT
    retryOn429?: boolean              // RateLimit-aware backoff
    parser?: 'json' | 'blob' | 'text'
}

export async function apiFetch<T>(
    url: string,
    init: RequestInit,
    options: FetchOptions = {},
): Promise<T> { /* ... */ }
```

All callers move to `apiFetch` with options; `eqFetch` retires; the 2 `as unknown as` retire structurally.

**Acceptance gate**: `git grep -nE "as unknown as" web/src/` returns zero post-E.W5.

## §6 — The csp-solver runtime fix (cross-repo coord)

`csp-solver/web/src/useApi.ts` currently:

```typescript
const baseUrl = new URL('api/v1', document.baseURI);  // same-origin assumption
```

Fails under CF Pages (`document.baseURI = https://sudoku.babb.dev` → resolves `https://sudoku.babb.dev/api/v1/` which does NOT exist; the backend is at `https://api.sudoku.babb.dev/api/v1/` per D.W10).

**Fix** (one line):

```typescript
const baseUrl = new URL(import.meta.env.VITE_API_URL ?? 'api/v1', document.baseURI);
```

+ `wrangler pages deploy` with `VITE_API_URL=https://api.sudoku.babb.dev/api/v1` build-time env.

**E.W6 disposition**: cross-repo coordination ask. The csp-solver maintainer commits the fix; fourier-E records the ask + the cutover commit SHA when it lands.

## §7 — Acceptance gates per consumer

| Consumer | E.W5/W6 gate |
|---|---|
| Fourier SPA | `as unknown as` count zero; `ApiProblem` class lands; `apiFetch` is the sole fetch core; retry-on-429 wired |
| Value.js demo | `ApiProblem` class lands (per-repo independent); If-Match on palette updates; Idempotency-Key on votes/forks |
| csp-solver | `useApi.ts` reads `VITE_API_URL`; the `https://api.sudoku.babb.dev/api/v1/` round-trip works from `https://sudoku.babb.dev` (live CORS preflight + GET) |
| Cross-repo T7 (E.W10) | `scripts/conformance-probe.sh` asserts: `GET /palettes/{slug}` → 200 + envelope carries `{slug, name, colors, currentHash, ...}` per CRUD-CONTRACT §1.3 (NOT `id`); ETag header present (per §5); error responses are `application/problem+json` (per §5); `GET /palettes/{slug}` of soft-deleted palette returns 410 Gone if I.W2 has landed (per §4); CORS preflight from `Origin: https://fourier.babb.dev` returns `acao: https://fourier.babb.dev` |

## §8 — What this doc IS and IS NOT

**IS**: the binding consumer-hardening scope for E.β; the typed `ApiProblem` shape; the fetch-helper collapse blueprint; the csp-solver cross-repo ask.

**IS NOT**: a shared types package; a shared HTTP client; a codegen tool both repos consume. Each consumer authors its own `ApiProblem` (same shape, independent files) — inv-16 holds.

## §9 — Files this doc seeds

- `web/src/lib/api-problem.ts` (NEW at E.W5)
- `web/src/lib/api.ts` (REWRITE at E.W5 — parametric core)
- `web/src/lib/equation/api.ts` (DELETE or absorb into `api.ts` at E.W5)
- `value.js/demo/@/lib/api-problem.ts` (NEW at value.js-I.W4 or E.W6 cross-repo coord)
- `value.js/demo/@/lib/palette/api/*` (REFACTOR per-file at value.js-I.W4)
- `csp-solver/web/src/useApi.ts` (PATCH — one-line; cross-repo coord at E.W6)
- `docs/tranches/E/audit/W5-fourier-consumer-hardening.md` (close record)
- `docs/tranches/E/audit/W6-valuejs-csp-consumer-hardening.md` (close record + cross-repo coord ledger)
