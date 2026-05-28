# E — architectural transpositions ledger

**Status**: authored 2026-05-28. **Source**: EA5 (17 transpositions across elegance/simplicity/performance/NO-legacy lenses). **Authority**: this doc binds E.γ scope; γ waves W7 (performance — T-P1 + T-P3) + W8 (elegance — T-E2 + T-S3 + fetch-helper T-E1+T-S5).

## §1 — The user's binding directive (2026-05-28)

> "Architectural transpositions in the sake of elegance, simplicity, and performance above all are both necessary and desirable. NO legacy code."

EA5 identified 17 transpositions. **5 are RECOMMENDED-for-E** (the high-value, KISS-honest ones). The rest split: 2 verifications (no E action), 1 user-adjudication ask, 9 DEFER-to-successor or REJECT.

## §2 — RECOMMENDED-for-E (the 5)

### T-P1 — Vite `manualChunks` bundle split (W7)

**Class**: PERFORMANCE.
**Subject**: the 854.40 kB `index-*.js` bundle. Currently one monolithic chunk; long initial LCP.
**Transposition**: configure Vite's `build.rollupOptions.output.manualChunks` to split into:
- `vendor-vue` (Vue + Pinia + Vue Router) — long-lived, cache-friendly
- `vendor-ui` (glass-ui + reka-ui + lucide + tailwind primitives)
- `vendor-math` (KaTeX + value.js + math chunks)
- `vendor-paper` (the paper compile/render path; only loaded on `/paper` routes)
- `index` (the app shell + page entries)

**Acceptance gate**: `npm run build` produces ≥4 chunks each <300 kB; LCP measured at `/` is <2.5 s on a 3G profile.
**Risk**: chunk-splitting can over-fragment if naive; the splits must align with actual route boundaries.
**Reversibility**: revert the `manualChunks` config; the build returns to monolithic.
**KISS-score**: positive (a config addition that REPLACES the implicit "everything in one chunk" with explicit boundaries).

### T-E1 + T-S5 — Four fetch helpers → one parametric core (W5 — β thread; the γ transposition rides along)

**Class**: ELEGANCE + SIMPLICITY (combined; the same code change discharges both).
**Subject**: `web/src/lib/api.ts`'s 4 helpers (`apiFetch`/`apiFetchWithETag`/`adminFetch`/`eqFetch`) with overlapping responsibilities; the 2 `as unknown as` casts at `web/src/lib/equation/api.ts:36,53` survive as the NO-legacy debt remnant post-D.
**Transposition**: collapse to one parametric `apiFetch<T>` with an options object (`auth`/`etag`/`idempotencyKey`/`retryOn429`/`parser`); per `CONSUMER-HARDENING.md §5`.
**Acceptance gate**: `git grep -nE "as unknown as" web/src/` returns zero; `git grep -nE "function (apiFetchWithETag|adminFetch|eqFetch)" web/src/` returns zero.
**Risk**: per-callsite refactor; bounded by `git grep`.
**Reversibility**: per-callsite revert.
**KISS-score**: positive (4 → 1; retires structural cast workaround).

### T-E2 — `openapi-typescript` codegen for `web/src/lib/types.ts` (W8)

**Class**: ELEGANCE (closes the hand-mirror class of bug).
**Subject**: `web/src/lib/types.ts` currently hand-mirrors `api/models/*.py` Pydantic models. A bug in any model risks bypassing TypeScript when the hand-mirror drifts.
**Transposition**: add `openapi-typescript` dev dependency; author `web/scripts/gen-types.sh` that fetches FastAPI's `/openapi.json` (from local dev backend or CI) and generates `types.ts`. Run in CI via the `web-build` job.
**Acceptance gate**: `web/src/lib/types.ts` carries a "GENERATED — do not edit" header; CI fails if `types.ts` drifts from the live schema.
**Risk**: code-generation can over-produce; the generated file should be small + focused.
**Reversibility**: revert the generation; types.ts becomes hand-edited again.
**KISS-score**: positive (replaces hand-mirror, retires drift class).
**Inv-16 verdict**: each repo's `openapi-typescript` generates its OWN types from its OWN `/openapi.json`. NOT shared. Per-repo independent; inv-16 holds.

### T-S3 — Retire `/opt/deploy/scripts/dispatch.sh` (W8)

**Class**: SIMPLICITY.
**Subject**: the host dispatcher with per-repo arms (5 arms) + a shared `deploy()` body. The W11 close found the `mkbabb/value.js)` arm latent-broken (calls `git fetch` on a non-git rsync dir; never fires).
**Transposition**: retire the dispatcher; use **per-repo webhook URLs** at `deploy.babb.dev/hooks/<repo>` where `<repo>` ∈ `{fourier-analysis, words, speedtest, value.js, csp-solver}`. Each repo's `hooks.json` entry directly invokes the repo's own `scripts/deploy-hook.sh` with the right working_dir.
**Acceptance gate**: `/opt/deploy/scripts/dispatch.sh` is GONE; `/opt/deploy/hooks.json` carries 5 independent entries; the `mkbabb/value.js)` latent-broken arm dies with the file.
**Risk**: cross-repo (touches the host's webhook receiver config + 5 GitHub repo webhook URLs).
**Reversibility**: restore the file + revert the webhook URLs.
**KISS-score**: positive (one layer fewer; the dispatcher's only value was per-arm config which `hooks.json` already supports per-entry).

### T-P3 — Mongo content-addressable compute cache (W7)

**Class**: PERFORMANCE.
**Subject**: `api/services/computation.py`'s `compute_epicycles` + `api/services/contour_extractor.py`'s `extract_contour` run per-request; identical inputs produce identical outputs but no caching. The `extraction_cache_key` Mongo index ALREADY EXISTS (dormant; never queried at hot path).
**Transposition**: hash the inputs (image hash + parameters) → cache key; persist `{cache_key, result_bytes, created_at}` in `images` (or a dedicated `compute_cache` collection); query before recomputing; record cache hit-rate.
**Acceptance gate**: a measurable cache hit-rate >50% on the e2e harness (re-compute the same contour twice; second is cache-hit); LCP on contour-extracted visualizations measurably faster.
**Risk**: cache invalidation if compute logic changes (must include code version in cache key).
**Reversibility**: bypass the cache check; recompute every time.
**KISS-score**: positive (unlocks dormant infrastructure; the index is already there).

## §3 — DEFER-to-successor or REJECT

### REJECTED

- **T-S2 — Consolidate 3 MongoDBs to 1**. Blast-radius coupling NET-NEGATIVE on the shared host (W1 just proved per-app isolation is load-bearing — closing fourier's bind does NOT affect floridify/palette mongos). Per-app Mongo stays. REJECTED.
- **A shared TypeScript types package** spanning fourier + value.js — inv-16 violation. REJECTED at all altitudes.
- **Switch Vue → React (or similar mass-rewrite)** — inv-12 violation; no measurable benefit. REJECTED.
- **k8s / docker swarm / multi-replica** — inv-19 violation. REJECTED.

### FLAGGED for user adjudication (Wα-research)

- **T-S1 — `pnpm workspace` replacing `web/vendor/*.tgz`**. The vendoring works in Docker; pnpm workspaces would simplify dev. But: inv-16 holds for the production build (no shared workspace dependency tree); needs Wα adjudication on whether the workspace coupling is acceptable for dev-only. **Default: REJECT** unless Wα ratifies.

### Verifications (no E action needed — recorded for completeness)

- **T-E5 — dead `gallery` indexes** at HEAD — verified by EA1 + EA5: `git grep -nE "db\.gallery" api/` returns only the migration script + test fixtures (deleted in D.W3). No transposition needed.
- **T-N1 — `snapshot_hash` test-fixture survivors** — verified load-bearing (migration regression-guards). Not legacy.
- **T-N2 — `--tlsAllowConnectionsWithoutCertificates` mongod flag** — verified architecturally correct under server-only TLS + SCRAM auth (D.W2 honesty pivot recorded in promoted `tls.md §1.1`). Not legacy.

### DEFERRED to successor

- **Job queue (Celery / RQ / arq)** — fourier-F if a real async workload surfaces.
- **CDN for the API** — fourier-F if global latency becomes load-bearing.
- **Sentry / error monitoring** — fourier-F if production error rates require visibility.

## §4 — Per-transposition wave-fit

| Transposition | Wave | Thread | Disposition |
|---|---|---|---|
| T-P1 (Vite manualChunks) | W7 | γ.1 | RECOMMENDED |
| T-P3 (compute cache) | W7 | γ.1 | RECOMMENDED |
| T-E1+T-S5 (fetch-helper collapse + cast retire) | W5 | β.1 | RECOMMENDED (β + γ overlap) |
| T-E2 (openapi-typescript codegen) | W8 | γ.2 | RECOMMENDED |
| T-S3 (dispatcher retire + per-repo webhook URLs) | W8 | γ.2 | RECOMMENDED |
| T-S1 (pnpm workspace) | Wα-research | γ | FLAGGED |
| T-S2 (Mongo consolidation) | — | — | REJECTED |
| Shared types package | — | — | REJECTED |
| T-E5/T-N1/T-N2 | — | — | VERIFIED (no action) |

## §5 — Acceptance gates summary

| Gate | Probe | Wave |
|---|---|---|
| Bundle split | `npm run build` produces ≥4 chunks <300 kB | W7 |
| Compute cache | hit-rate >50% on e2e harness | W7 |
| Cast survivors | `git grep "as unknown as" web/src/` returns zero | W5 |
| Codegen flow | `web/src/lib/types.ts` carries GENERATED header; CI fails on drift | W8 |
| Dispatcher retired | `/opt/deploy/scripts/dispatch.sh` GONE; hooks.json has 5 entries; latent-broken arm dies | W8 |

## §6 — What this doc IS and IS NOT

**IS**: the binding γ-thread scope; per-transposition wave-fit + acceptance gate + KISS-score; the rejection ledger.

**IS NOT**: a manufactured-transposition list. The user's binding constraint ("NO manufactured transpositions" per E.md §2 invariant + EA6 §5 #15): every transposition REDUCES moving parts; none add accidental complexity disguised as elegance.
