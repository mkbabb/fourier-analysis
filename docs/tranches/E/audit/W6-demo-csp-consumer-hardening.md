# E.W6 — β.2 value.js demo + csp-solver consumer hardening

**Wave**: E.W6 — β.2 value.js demo (typed ApiProblem; If-Match + Idempotency-Key plumbed; RateLimit retry; Δ-R2.2 default URL fix) + csp-solver cross-repo ASK.
**Closed**: 2026-05-28.
**Status**: GREEN (value.js demo LIVE; csp-solver recorded as cross-repo ASK at E.W11).
**Authority**: `E.md §3` row W6; `coordination/CONSUMER-HARDENING.md §6`.

## §1 — value.js demo (LIVE at value.js commit X)

Author: value.js maintainer (the same user) per inv-16 (each consumer authors its own ApiProblem; no shared package).

### NEW `demo/@/lib/palette/api/api-problem.ts`

Mirror of fourier's `web/src/lib/api-problem.ts` (T8 RFC 7807) — same shape, independent file. inv-16 holds.

### REFACTOR `demo/@/lib/palette/api/client.ts`

- `request<T>(path, init)` + `adminRequest<T>(path, token, init)` now throw typed `ApiProblem` (RFC 7807) parsed from `application/problem+json` responses (post-I.W4 SOTA envelopes).
- `RequestOptions` extends `RequestInit` with `ifMatch?: string | null` + `idempotencyKey?: string | null`.
- New `fetchWithRateLimitRetry(input, init)` wraps `fetch` with retry-on-429 + RateLimit-Reset backoff (up to 2 retries; 30s cap; B10 hardening).
- **Δ-R2.2 baseline fix**: `DEFAULT_REMOTE_API_URL` updated from `https://mbabb.fi.ncsu.edu/colors` (pre-D.W10 VPN host) → `https://api.color.babb.dev` (live constellation endpoint). Demo builds without `VITE_API_URL` env now point at the correct backend.

### B6-B10 disposition

| Brittleness | Hardening |
|---|---|
| B6 structured-error swallow | **CLOSED** — `request` + `adminRequest` throw typed `ApiProblem` instead of stringified `Error` |
| B7 typed error class absent | **CLOSED** — `ApiProblem` class lands per-repo |
| B8 no If-Match on palette updates | **PLUMBED** — `ifMatch` option on `request`/`adminRequest`; per-call-site adoption tracked at I.W5 |
| B9 vote/fork mutations not Idempotency-Key'd | **PLUMBED** — `idempotencyKey` option exposed; per-call-site adoption tracked at I.W5 |
| B10 RateLimit-aware backoff | **CLOSED** — `fetchWithRateLimitRetry` reads RateLimit-Reset, retries up to 2× |

**Plumbed but not yet wired-per-site**: the option is exposed for callers; per-call-site adoption (e.g. `updatePalette(... { ifMatch: lastEtag })`) is a low-risk follow-up at I.W5 — preserves the inv-16 boundary (the call-sites stay in value.js).

## §2 — csp-solver cross-repo ASK

Per `CONSUMER-HARDENING.md §6`. The csp-solver repo is **not present locally** at audit-time (no `/Users/mkbabb/Programming/csp-solver` clone); the cross-repo ASK is recorded for the maintainer to action upstream.

### The one-line fix

`csp-solver/web/src/useApi.ts` (line referenced in CONSUMER-HARDENING.md §6):

```diff
-const baseUrl = new URL('api/v1', document.baseURI);
+const baseUrl = new URL(import.meta.env.VITE_API_URL ?? 'api/v1', document.baseURI);
```

Plus build-time env: `VITE_API_URL=https://api.sudoku.babb.dev/api/v1` (the live constellation endpoint per D.W10).

### Verification (when committed)

```sh
curl -sS -X OPTIONS https://api.sudoku.babb.dev/api/v1/some/path \
    -H "Origin: https://sudoku.babb.dev"
# Expected: 200 + access-control-allow-origin: https://sudoku.babb.dev
```

### Disposition

**OPEN cross-repo residual** — recorded for the csp-solver maintainer; tracked at E.W11 cross-repo upstream commits ledger.

## §3 — Cross-repo source boundary upheld

- value.js-side work writes only `value.js/` paths (api-problem.ts; client.ts).
- fourier-E.W6 commit (this one) writes only `docs/tranches/E/`.
- csp-solver ASK is NOT a value.js or fourier write — recorded as documentation; tracked at W11 for the csp-solver maintainer.

## §4 — Verification

| Probe | Result |
|---|---|
| value.js root `npx tsc --noEmit` (my files) | 0 errors ✓ |
| value.js demo `api-problem.ts` exports | `ApiProblem`, `readRateLimitResetSeconds` ✓ |
| `client.ts` throws `ApiProblem` on non-2xx | refactored ✓ |
| `DEFAULT_REMOTE_API_URL` matches live constellation | `https://api.color.babb.dev` ✓ |
| csp-solver ASK documented | this file §2 + W11 residual ledger |

Pre-existing tsc errors in `demo/@/components/.../glass-ui.d.ts` paths are the C5/C6 chronic cross-repo residual (glass-ui maintainer scope per EA2 §3); NOT introduced by this wave; OUT OF SCOPE.

## §5 — W6 close gate

W6 closes when (a) value.js demo `api-problem.ts` lands; (b) `client.ts` refactored to throw ApiProblem + handle RateLimit retry + plumb If-Match/Idempotency-Key; (c) Δ-R2.2 baseline URL fixed; (d) zero NEW tsc errors in the touched files; (e) csp-solver ASK recorded for W11. All five met. **W6 is GREEN.** W7 (γ.1 performance T-P1 manualChunks + T-P3 compute_epicycles cache) opens.

## §6 — What this wave IS and IS NOT

**IS**: per-repo ApiProblem at value.js demo (inv-16 honored); RateLimit-aware retry; plumbed If-Match + Idempotency-Key; live default URL pointing at the constellation; csp-solver ASK recorded.

**IS NOT**: a shared types package; a shared HTTP client; per-call-site adoption of If-Match/Idempotency-Key (deferred to I.W5; per-call-site is a low-risk follow-up that preserves the boundary). The csp-solver write is NOT in this commit (cross-repo coord).
