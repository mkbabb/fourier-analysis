# E — cross-repo CRUD cohesion completion (extends D's CRUD-COHESION.md)

**Status**: authored 2026-05-28; supersedes `docs/tranches/D/coordination/CRUD-COHESION.md` for the E + value.js-I cohort. **Predecessor**: D.W5 — `CRUD-CONTRACT v2.0.0` ratified; CONFORMANCE-MATRIX flipped 27 ADDRESSED / 53 DEFERRED-TO-VALUE.JS / 7 RETIRED-AS-OVER-SPEC; `VALUE-JS-ASK.md` recorded the cohort ask user-re-mandate-gated.

## §1 — The user re-mandate (2026-05-28)

> "Fix our cross repos. Refine, test, CRUD, our two palette apis and fourier viz apis. Including ALL consumers."

This **IS** the value.js-I re-mandate. D.W5's `VALUE-JS-ASK.md §1` named the 53 DEFERRED-TO-VALUE.JS cells + the I.W1-W4 sketch as user-re-mandate-gated. The 2026-05-28 directive opens that mandate.

## §2 — Cohort shape

| Repo | Tranche | Owns | Closes when |
|---|---|---|---|
| fourier-analysis | **E** | `api/**`, `web/**`, `scripts/**`, `docs/tranches/E/**`, `infra/**`, `.github/workflows/**`, host-side ingress coordination | per `E.md §0` close gates |
| value.js | **I** | `value.js/api/src/**` (palette-api backend), `value.js/api/test/conformance/**`, `value.js/docs/tranches/I/**` | per `value.js/docs/tranches/I/I.md §0` close gates (authored at I.W0) |

**Shared (documentation seam — inv-16 binding):**
- `docs/tranches/B/coordination/CRUD-CONTRACT.md` (v2.0.0)
- `docs/tranches/B/coordination/CONFORMANCE-MATRIX.md` (the 87-cell three-way disposition)
- `docs/tranches/D/research/README.md §R1` (the `palette_slug` FK contract clause)

**Cross-repo source boundary (binding):**
- fourier-E commits never write to `value.js/**`
- value.js-I commits never write to fourier
- No shared TypeScript types package; no shared HTTP client; no shared codegen consumed by both repos
- Each repo's `openapi-typescript` generates its own types from its own `/openapi.json` (the contract is documentation, not generated code)

## §3 — The value.js-I sketch (binding shape from D.W5 + EA3)

| Wave | Subject | Source |
|---|---|---|
| **I.W0** | open + baseline (I-specific; value.js HEAD `16129e0` at audit-time) | value.js maintainer authors |
| **I.Wα** | research wave (3 lanes): visibility-state-machine; soft-delete semantics; SOTA envelope shape | per CRUD-CONTRACT v2.0.0 |
| **I.Wχ** | adversarial probes (5): inv-16 preserved; visibility transition semantics; soft-delete + grace window correctness; ETag/If-Match concurrency; problem+json shape | per `docs/tranches/D/audit/challenge-P3.md` cohesion-KISS findings |
| **I.W1** | visibility split: `status` (4-state) → `visibility` (3-state) + `tier`; transition guard (denied vs missing indistinguishable); migration cutover on host palette-api | per CRUD-CONTRACT v2.0.0 §3 |
| **I.W2** | soft-delete + grace + restore: `deletedAt` field; soft DELETE (sets deletedAt); RESTORE endpoint; cascade-delete-with-grace for versions/forks/votes/proposed_names; grace window expiry → hard delete | per CRUD-CONTRACT v2.0.0 §4 |
| **I.W3** | admin idempotency: `feature`/`unfeature` toggle → `featured: true/false` idempotent setter; admin audit row per op | per CRUD-CONTRACT v2.0.0 §8 |
| **I.W4** | SOTA envelopes: problem+json error envelope (RFC 7807); ETag on resource GETs; If-Match on PUT/PATCH; RateLimit-* response headers; Idempotency-Key on POST + PUT; per-repo conformance suite at `value.js/api/test/conformance/` | per CRUD-CONTRACT v2.0.0 §5 |
| **I.W5** | close + cohort coordination | per cohort-closure §5 below |

This shape is **authoritative for the value.js side**. The value.js maintainer (the same user) opens value.js-I when ready; fourier-E proceeds in parallel on threads β/γ/δ/ε that don't depend on I's completion.

## §4 — The `palette_slug` FK live verification (E.W1 binding gate)

The cross-repo `palette_slug` FK contract (`research/README.md §R1`) is:
- **Fourier guarantees**: stores `[a-z0-9][a-z0-9-]*` ≤ 120; ETag-participating; resolve-only (no write-path round-trip); exposes verbatim on `GET /visualizations/{slug}`.
- **Value.js guarantees**: `GET /palettes/{slug}` returns 200 if visible, 404 otherwise; slug is stable identity; immutable for the palette's lifetime.

**E.W1 verification (live + automated):**

```bash
# Live CORS preflight from fourier origin
curl -X OPTIONS https://api.color.babb.dev/palettes/<known-slug> \
    -H "Origin: https://fourier.babb.dev" \
    -H "Access-Control-Request-Method: GET" \
    -D - -o /dev/null

# Expected:
# HTTP/1.1 200 OK
# Access-Control-Allow-Origin: https://fourier.babb.dev    ← the fix
# Access-Control-Allow-Credentials: true

# Live GET round-trip
curl -sS https://api.color.babb.dev/palettes/<known-slug> \
    -H "Origin: https://fourier.babb.dev" \
    -H "Accept: application/json"

# Expected: 200 + palette envelope JSON; CORS headers echo fourier origin
```

The fix is **one env var** on the host palette-api compose: `ALLOWED_ORIGINS=https://color.babb.dev,https://fourier.babb.dev`. Operator-coordinated cross-app edit (mirroring D.W10's CORS fixes); recorded as cross-repo residual at E.W11 if not committed upstream.

## §5 — Cohort closure discipline

The cohort closes when:

**Scenario A — paired close:**
- `docs/tranches/E/FINAL.md` lands at fourier-E close.
- `value.js/docs/tranches/I/FINAL.md` lands at value.js-I close.
- The cross-repo conformance probe T7 returns green against both APIs + the `palette_slug` FK.
- CANONICAL-ORDERING reconciled to ordering ζ.

**Scenario B — named successor:**
- fourier-E closes; one or more I waves remain.
- E.FINAL records the I-residual + the named successor (value.js-I.W<n> → value.js-J or later).
- The cross-repo FK contract remains binding (no half-state allowed at the FK seam).

Either scenario is honest. Half-state at the FK seam (one side breaks, the other doesn't know) is rejected: if value.js-I.W1 visibility split lands without I.W2 soft-delete, the conformance probe records the partial state explicitly, the close names it, and the next tranche carries it.

## §6 — What this doc IS and IS NOT

**IS**: the binding cohort coordination spec; the `palette_slug` FK live verification; the I.W0-I.W5 binding shape for value.js-I; the cohort closure discipline.

**IS NOT**: the I tranche's own charter. The value.js maintainer authors `value.js/docs/tranches/I/I.md` per its own KISS-and-scope discipline; this fourier-side doc records the cross-repo ask + the seam.

## §7 — Files this doc seeds

- `value.js/docs/tranches/I/I.md` (NEW, value.js maintainer authors)
- `value.js/docs/tranches/I/PROGRESS.md` (NEW, value.js maintainer authors)
- `docs/tranches/E/audit/W1-cors-fk-live.md` (E.W1 close record; covers the CORS fix + the FK live verification + the conformance probe round-trip)
- `scripts/conformance-probe.sh` (NEW at E.W10; the cross-repo T7 harness)
