# E.Wα — Research wave (ratification + narrowed dispatch)

**Wave**: Wα — Research wave (ratification + narrowed dispatch).
**Closed**: 2026-05-28 (post-W0).
**Status**: GREEN — 3 RATIFIED-WITH-DELTA, zero NEEDS-NARROWED-FOLLOWUP.
**Authority**: `E.md §3` row Wα.
**Lanes**: R1 (cross-repo cohesion + cohort closure); R2 (consumer brittleness + T8 ApiProblem + openapi-codegen flow); R3 (transposition risk-assessment for the 5 RECOMMENDED-for-E).

## §1 — R1 verdict — cross-repo cohesion ratification

**Verdict**: RATIFIED-WITH-DELTA.

**Deltas:**
- **Δ-EA3.1** (load-bearing): CORS preflight from `Origin: https://fourier.babb.dev` still returns `access-control-allow-origin: https://color.babb.dev` only. Live spot-check confirms EA3 §5 finding stands. **Binding fix**: one env var on host palette-api compose (`ALLOWED_ORIGINS=https://color.babb.dev,https://fourier.babb.dev`). **Owner**: E.W1.
- **Δ-EA3.2** (sequencing constraint, non-load-bearing): the 410-Gone-for-soft-deleted-palettes clause implementable only after I.W2 soft-delete lands. Cohort-sequencing, not a delta.

**Cell spot-check (5 sampled from the 53 DEFERRED-TO-VALUE.JS):**

| Cell | Subject | Verdict |
|---|---|---|
| §1.3 | top-level `id` field (`format/palette.ts:59`) | PASS-AS-IS (unchanged) |
| §3 | 4-state `status` (`models.ts:29` `PALETTE_STATUSES`) | PASS-AS-IS (unchanged) |
| §4 | `deletedAt` field absence | PASS-AS-IS (zero matches) |
| §5 | problem+json envelope absence | PASS-AS-IS (zero matches; still `{error: {code, message, detail}}`) |
| §5 | ETag/If-Match absence | PASS-AS-IS (zero matches) |

**Live envelope spot-check on `GET /palettes/<slug>`**: NO ETag; NO RateLimit-*; error envelope is `{error: {code, message, detail}}` (NOT problem+json). SOTA-envelopes-needed confirmed.

**value.js-I open-state**: `value.js/docs/tranches/I/` does NOT yet exist. Tranche opens at E.W2 dispatch.

## §2 — R2 verdict — consumer hardening ratification

**Verdict**: RATIFIED-WITH-DELTA.

**Deltas:**
- **Δ-R2.1**: `value.js/demo/@/lib/palette/api/` has **10 files** (not the 9 EA3 claimed) — minor count delta, not load-bearing. The 5 brittlenesses B6–B10 hold across the 10 files.
- **Δ-R2.2** (operationally live): value.js demo `client.ts:15` default URL `DEFAULT_REMOTE_API_URL = "https://mbabb.fi.ncsu.edu/colors"` is the **pre-D.W10/W11 VPN host**. Post-rename, the live backend is `https://api.color.babb.dev`. A demo build without `VITE_API_URL` env will fail at runtime. **Owner**: E.W6.
- **Δ-R2.3** (T-E2 build dependency): the FastAPI `/openapi.json` endpoint is served via nginx static-file fallback (not the FastAPI dynamic route at audit-time). Build context may not reach it directly. **Mitigation**: pre-build snapshot to `api/openapi.json` committed to repo OR a Python pre-build step `python -c "import json; from api.main import app; print(json.dumps(app.openapi()))" > api/openapi.json`. **Owner**: E.W8.

**Fourier SPA spot-check confirms:**
- `git grep -nE "as unknown as" web/src/` returns 2 hits at `web/src/lib/equation/api.ts:36,53` (EA3 count exact).
- 4 fetch helpers exist: `apiFetch` (api.ts:130), `apiFetchWithETag` (api.ts:188), `adminFetch` (api.ts:243), `eqFetch` (equation/api.ts:21).
- Two independent inflight registries: `api.ts:105` + `equation/api.ts:12`. Consolidation to one module-level registry is a natural T-E1+T-S5 sub-item.

**T8 ApiProblem shape**: RATIFIED-AS-IS. Code shape in `CONSUMER-HARDENING.md §4` is RFC 7807 conformant and KISS-honest.

**T-E1+T-S5 collapse blueprint**: RATIFIED-AS-IS. The 2 `as unknown as` retire as a structural consequence (unified body parameter types as `BodyInit | object | undefined`).

**csp-solver ASK**: RATIFIED-AS-IS (no local clone; cross-repo ASK at W6).

## §3 — R3 verdict — transposition risk-assessment

**Per-item dispositions:**

| Transposition | Verdict | Delta |
|---|---|---|
| **T-P1** Vite manualChunks | RATIFIED-AS-IS | live bundle confirmed at 834 kB (close to EA5's 854 kB); `web/vite.config.ts` has NO manualChunks |
| **T-E1+T-S5** fetch-helper collapse | RATIFIED-AS-IS | precept-level abort-key namespace coordination is the only sub-concern (resolved by caller-controlled string keys) |
| **T-E2** openapi-typescript codegen | **RATIFIED-WITH-DELTA** | needs `api/openapi.json` snapshot committed + CI integration design (see Δ-R2.3) |
| **T-S3** dispatcher retire | **RATIFIED-WITH-DELTA** | constellation-wide GitHub webhook URL coord (5 repos); risk of one-missed-update breaking deploy; mitigation: `gh api` script registers all 5 atomically |
| **T-P3** compute content cache | **RATIFIED-WITH-DELTA** (scope mismatch) | `extract_contour` cache **already wired** at `api/routers/images.py:220-227` (EA5 mis-claimed "dormant"); only `compute_epicycles` needs new cache. Scope of T-P3 collapses to compute_epicycles only |

**Δ-R3.1 (T-P3 scope collapse)**: the extract_contour cache is ALREADY WIRED at HEAD — `api/services/database.py:60` creates the `extraction_cache_key` sparse index, and `api/routers/images.py:220-227` does the lookup-before-extract. EA5 mis-classified this as "dormant infrastructure." **Revised T-P3 scope**: ONLY the `compute_epicycles` half needs new cache work (schema design: new collection vs inline; cache key inclusion criteria; code-version invalidation). Extract-contour cache is observation-only (record hit-rate at E.W7 close as evidence of pre-existing perf win).

**Δ-R3.2 (T-E2 build dependency)**: see Δ-R2.3 above.

**Δ-R3.3 (T-S3 constellation coord)**: 5 GitHub webhook URLs (fourier-analysis, words, speedtest, value.js, csp-solver) must be updated atomically. Risk mitigation: a single `scripts/update-webhook-urls.sh` driving `gh api -X PATCH repos/<owner>/<repo>/hooks/<id>` per repo, with rollback if any fails.

**No newly-discovered transpositions.** All 5 RECOMMENDED-for-E hold; the rest of the 17-ledger holds (REJECTED/DEFERRED/VERIFIED).

## §4 — Narrowed follow-up dispatch

**Zero narrowed follow-up lanes dispatched.** All three deltas (R1's CORS fix, R2's value.js demo URL + openapi.json snapshot, R3's compute-only cache + constellation coord) are **implementation-specifics for waves W1-W11**, not greenfield research needs. The audit-time substrate holds.

## §5 — Wα close gate

Wα closes when (a) the 3 ratification lanes return verdicts; (b) deltas are documented; (c) no NEEDS-NARROWED-FOLLOWUP surfaces. All three conditions met. Wα is GREEN. Wχ opens.

## §6 — Folded into wave-execution

| Delta | Lands at | Disposition |
|---|---|---|
| Δ-EA3.1 CORS env var | E.W1 | T4 binding |
| Δ-EA3.2 410-Gone sequencing | E.W2 → W3 → E.W6 consumer | cohort-sequencing |
| Δ-R2.1 file-count 10 (not 9) | E.W6 | cosmetic — affects close record only |
| Δ-R2.2 value.js demo default URL | E.W6 | one-line edit |
| Δ-R2.3 + Δ-R3.2 openapi.json snapshot | E.W8 | adds a pre-build snapshot step |
| Δ-R3.1 T-P3 scope collapse to compute_epicycles only | E.W7 | reduces T-P3 to its `compute_epicycles` half; extract_contour cache observed-only |
| Δ-R3.3 T-S3 constellation coord script | E.W8 | adds `scripts/update-webhook-urls.sh` |
