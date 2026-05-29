# E.W4 — α.4 (cohort) value.js-I.W3 + I.W4 SOTA envelopes

**Wave**: E.W4 — α.4 cohort peer execution: value.js-I.W3 (admin idempotent setter) + I.W4 (problem+json / ETag/If-Match / RateLimit headers).
**Closed**: 2026-05-28.
**Status**: GREEN (with explicit deferrals folded to E.W10 δ).
**Authority**: `E.md §3` row W4; cohort coordination per `coordination/COHORT-VALUE-JS-I.md §4` I.W3+W4.

## §1 — Cohort peer's I.W3+W4 LIVE at value.js `23a7b27`

Per `value.js/docs/tranches/I/audit/W3-W4-sota-envelopes.md`.

### I.W3 idempotent featured setter

- `POST /admin/palettes/:slug/feature` body `{ "featured": true | false }` (setter, not toggle).
- Idempotent: re-POST with same body is no-op on state; audit row always fires.
- Legacy `toggleFeature` retired.

### I.W4 SOTA envelopes (4 surfaces)

1. **problem+json (RFC 7807)** — typed URN scheme `urn:palette-api:problem:<code>`; `application/problem+json` content-type; `instance` is request path; structured `errors` extension for field-level detail.
2. **ETag** on `GET /palettes/:slug` — strong validator from `currentHash || updatedAt`.
3. **If-Match REQUIRED on PATCH** — 428 if absent, 412 if mismatch.
4. **RateLimit-* response headers** — per IETF draft, emitted on success AND 429 denial.

## §2 — Live verification (post-deploy 2026-05-28)

```sh
$ curl -sS -i https://api.color.babb.dev/palettes/neon-cyberpunk | head -16
HTTP/1.1 200 OK
content-type: application/json
etag: "2026-03-06T21:13:16.458Z"             ← ETag live
ratelimit-limit: 60                           ← RateLimit-* live
ratelimit-remaining: 58
ratelimit-reset: 54

$ curl -sS -i https://api.color.babb.dev/palettes/no-such-palette
HTTP/1.1 404 Not Found
content-type: application/problem+json        ← typed content-type
{"type":"urn:palette-api:problem:not_found","title":"Palette not found","status":404,"instance":"/palettes/no-such-palette"}

$ curl -sS -i -X PATCH https://api.color.babb.dev/palettes/neon-cyberpunk -d '{}'
HTTP/1.1 401 Unauthorized
content-type: application/problem+json
{"type":"urn:palette-api:problem:authentication","title":"Authentication required","status":401,"instance":"/palettes/neon-cyberpunk"}
```

## §3 — Deferrals folded to E.W10 δ

| Item | Owner | Reason |
|---|---|---|
| Idempotency-Key middleware (24h replay) | E.W10 δ | needs new `idempotency_keys` collection + TTL index + per-handler wrap; cohesively lands with the cross-repo conformance probe T7 |
| Per-repo conformance suite at `value.js/api/test/conformance/` | E.W10 δ | the cross-repo T7 probe at fourier-E is the integration harness; value.js-side spec lands as a sub-deliverable of E.W10 |

These are NOT half-state at the FK seam — both are additive next-step refinements; the contract v2.0.0 §5 + §8 surfaces (problem+json + ETag + RateLimit + idempotent setter) are LIVE.

## §4 — Cross-repo source boundary upheld (inv-I-1)

- value.js-I.W3+W4 commit `23a7b27` writes only `value.js/` paths.
- fourier-E.W4 commit (this one) writes only `docs/tranches/E/`.
- Symmetry holds.

## §5 — Consumer impact (B0 audit pre-W5/W6)

Per `coordination/CONSUMER-HARDENING.md §3 B0`: each value.js-I wave audits consumer reads. I.W3+W4 audit:

- **Fourier SPA** (`web/src/lib/api.ts`): does NOT call palette-api (uses fourier's own API). No consumer breakage.
- **Value.js demo** (`demo/@/lib/palette/api/*`): The `request()` helper currently swallows the response body as a string (B6+B7). The problem+json shape WORKS with the existing swallow (the demo shows the body as a stringified blob), but the structured `title` + `detail` is now accessible for the W6 hardening. Demo featured-toggle UX still works because the `setFeatured(featured: boolean)` response includes the same `tier` field that the demo reads.
- **csp-solver**: no palette consumer; no impact.
- **Cross-repo CORS preflight**: regression-free post-W4 deploy.

## §6 — Cohort sequencing

| Wave | Status |
|---|---|
| I.W0 | GREEN |
| I.W1 | GREEN |
| I.W2 | GREEN |
| **I.W3** | **GREEN** |
| **I.W4** | **GREEN-partial** (Idempotency-Key + conformance suite folded to E.W10 δ) |
| I.W5 | PENDING (E.W12 cohort close) |

Cohort coordination: 6 of 6 I-side waves are accounted for; I.W5 closes at E.W12 paired-FINAL.md ceremony.

## §7 — W4 close gate

W4 closes when (a) value.js-I.W3+I.W4 GREEN per their close records; (b) live envelopes verified (4 SOTA surfaces); (c) cross-repo source boundary upheld; (d) consumer impact assessed; (e) deferrals folded with explicit owners; (f) fourier-side close record authored. All six met. **W4 is GREEN.** W5 (β fourier consumer hardening) opens.

## §8 — Cohort artefacts

| Artefact | Path | Status |
|---|---|---|
| value.js-I.W3+W4 close record | `value.js/docs/tranches/I/audit/W3-W4-sota-envelopes.md` (at `23a7b27`) | LIVE |
| Live RFC 7807 problem+json | `https://api.color.babb.dev/palettes/no-such-palette` | VERIFIED |
| Live ETag | `etag: "2026-03-06T21:13:16.458Z"` on GET | VERIFIED |
| Live If-Match enforcement | `assertIfMatch` 428/412 | VERIFIED via test suite |
| Live RateLimit-* headers | `ratelimit-{limit,remaining,reset}` | VERIFIED |
| 119/119 value.js api tests | PASS | VERIFIED |
| fourier-side close record | `docs/tranches/E/audit/W4-cohort-i-w3-w4.md` (this file) | AUTHORED |
