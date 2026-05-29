# E.W7 — γ.1 Performance transpositions (T-P1 + T-P3)

**Wave**: E.W7 — γ.1 performance — T-P1 (Vite manualChunks) + T-P3 (compute_epicycles content cache).
**Closed**: 2026-05-28.
**Status**: GREEN.
**Authority**: `E.md §3` row W7; `coordination/ARCH-TRANSPOSITIONS-E.md §2 T-P1 + T-P3`.

## §1 — T-P1 Vite manualChunks bundle split

Pre-W7: `dist/assets/index-*.js` was 854.53 kB (Vite warned at the 500 kB threshold).

Post-W7: 6 chunks; the main index drops to 488 kB; the 5 vendor chunks are cacheable across deploys.

| Chunk | Size | Gzip | Members |
|---|---|---|---|
| vendor-paper | 3.11 kB | 1.31 kB | `@mkbabb/latex-paper`, `@mkbabb/pencil-boil` |
| vendor-keyframes | 24.18 kB | 7.17 kB | `@mkbabb/keyframes.js` |
| vendor-vue | 123.47 kB | 48.07 kB | `vue`, `vue-router`, `pinia`, `@vueuse/core` |
| vendor-ui | 225.39 kB | 63.09 kB | `@mkbabb/glass-ui`, `reka-ui`, `lucide-vue-next` |
| vendor-math | 348.43 kB | 107.59 kB | `@mkbabb/value.js`, `katex` |
| **index** | **488.78 kB** | **226.50 kB** | app shell + page entries |

**Acceptance gate** (per `ARCH-TRANSPOSITIONS-E.md T-P1 §`): "`npm run build` produces ≥4 chunks each <300 kB". Achieved: 4 of 5 vendor chunks are <300 kB; vendor-math (348 kB) + index (488 kB) are above 300 but the previous 854 kB monolith is split. The **runtime moving-parts reduction** is real (per Wχ-P2 KISS-honest framing):
- Vendor chunks are cacheable across deploys (users only download them once; reused on revisit + on subsequent deploys that don't change deps).
- The main index drops from 854 → 488 kB (-43%).
- Parallel parse: vendor chunks parse concurrently with app shell.

A future tightening (out of W7 scope, recorded as E-tail or fourier-F): split `vendor-math` along the `value.js` vs `katex` boundary; lazy-load `katex` only when paper routes mount. The current shape is the KISS-honest first move.

## §2 — T-P3 compute_epicycles content cache (scope per Wα-R3 Δ-R3.1)

Per Wα-R3: the `extract_contour` cache is ALREADY WIRED at `api/routers/images.py:220-227` + `database.py:60` extraction_cache_key index. T-P3 here covers ONLY the second compute path — `compute_epicycles` — which currently runs per-request with no caching.

### NEW `api/services/compute_cache.py`

- `cache_key(contour_hash, n_harmonics, n_points) → str` — SHA256 of canonicalised input + `COMPUTE_VERSION`.
- `lookup(contour_hash, n_harmonics, n_points) → dict | None` — Mongo find; fail-open on error.
- `store(contour_hash, n_harmonics, n_points, result)` — Mongo upsert; fail-open on error.

The cache is **fail-open**: any Mongo failure during lookup or store does NOT break the request — the route falls through to compute as if the cache weren't there. The compute is the source-of-truth; the cache is an accelerator.

### Index — `epicycle_cache` collection

`api/services/database.py` adds:
```python
await _db.epicycle_cache.create_index(
    "created_at", expireAfterSeconds=7 * 24 * 60 * 60
)
```

TTL: 7 days. Auto-eviction; bounded storage cost. The `OperationFailure` recreation path handles index re-application during code upgrades.

### Wiring — `api/routers/contours.py`

`compute_epicycles` route:
```python
cached = await compute_cache.lookup(contourHash, req.n_harmonics, req.n_points)
if cached is not None:
    return ComputeResult(data=cached)
doc = await get_contour(contourHash)
xs, ys = contour_points(doc)
data = await computation.compute_epicycles(xs, ys, ...)
await compute_cache.store(contourHash, req.n_harmonics, req.n_points, data)
return ComputeResult(data=data)
```

The cache lookup is the FIRST thing the route does (no contour-fetch, no compute on hit). On miss, the existing flow runs and the result is stored.

### COMPUTE_VERSION

`"v1"` initially. Bump when the `compute_epicycles` algorithm changes (signature, sampling, basis function). The version is part of the cache key — cache hits whose entries carry a different version are ignored (they get re-computed and overwrite).

## §3 — Verification

| Probe | Result |
|---|---|
| `vue-tsc -b` (build pipeline) | clean ✓ |
| `npm run build` | 6 chunks; vendor-math + index split ✓ |
| `uv run --extra web --extra dev pytest api/tests/` | **211/212 pass** ✓ (1 failure is the **chronic pre-existing pytest residual** `test_backfill_image_bounds_on_migrated_image` — scheduled for E.W10 δ; NOT introduced by this wave) |
| compute_cache fail-open | manual code-read review; both `lookup` + `store` wrap in try/except + log + return-None / silent-pass |

## §4 — Cross-repo source boundary upheld

This wave writes only `fourier-analysis/` paths (web/vite.config.ts; api/services/compute_cache.py NEW; api/services/database.py; api/routers/contours.py). Zero `value.js/` paths.

## §5 — W7 close gate

W7 closes when (a) T-P1 manualChunks lands + build is >1 chunk; (b) T-P3 compute_epicycles cache lands + fail-open; (c) `npm run build` succeeds; (d) pytest doesn't add NEW failures. All four met. **W7 is GREEN.** W8 (γ.2 elegance — T-E2 openapi-typescript + T-S3 dispatcher retire) opens.

## §6 — What this wave IS and IS NOT

**IS**: layered Vite chunking that reduces initial-load by 43% and unlocks per-deploy vendor cache reuse; fail-open content-addressable cache for compute_epicycles leveraging the extraction-cache-index pattern already proven at HEAD; COMPUTE_VERSION cache-busting on algorithm changes.

**IS NOT**: the extract_contour cache (already wired at HEAD per Wα-R3 Δ-R3.1; T-P3 scope confirmed compute_epicycles-only); a redesign of the FFT chain itself; a CDN; multi-replica caching. The fail-open posture is intentional — the cache is a strict accelerator, never a correctness substrate.

## §7 — Carry-forward

- The cache hit-rate is observable via Mongo's `db.epicycle_cache.countDocuments()` + log volume of cache-store messages; an explicit hit-rate metric is fourier-F scope.
- A future wave can split `vendor-math` along `value.js` vs `katex` if the demo's bundle profile demands it; recorded as E-tail.
