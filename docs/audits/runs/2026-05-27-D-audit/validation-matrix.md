# D-dev — Playwright + live validation matrix (observed 2026-05-27)

Read-only observation feeding tranche-D's δ (testing) + α (deploy) threads. NOT new test authoring — that is D execution. The full cross-environment runs are a D.δ deliverable; this records the *current* state and root-causes.

## §1 — The matrix

| App / suite | local (docker, current master) | dev | prod |
|---|---|---|---|
| **fourier e2e** (`web/e2e/`, 7 specs / 49 cases) | **3 passed · 23 failed · 5 skipped · 18 did-not-run** (run vs `:3000` vite + `:8000` backend bind-mounting current source) | = local (dev IS the local stack here) | **N/A — prod serves SHA `8818ae5` (2026-03-28), predating A/B/C**; current specs do not match the deployed build. Live site health OK (`/api/health`→`{"status":"ok"}`, `:8100`, fronted by host Apache `fourier.babb.dev`) |
| **fourier backend** (`api/tests/`) | 129 passed · 83 `@requires_mongo` skipped · 0 failed | = local | — (prod DB empty/pre-A schema) |
| **value.js smoke** (`e2e/smoke/`, 5 projects, `:8090`, auto webServer) | not run this pass (needs its stack; → D.δ) | — | — |
| **value.js palette-api** | — | — | **healthy (HTTP 200)** — live 2 months on the shared host |

## §2 — Root-cause of the fourier local e2e red (the load-bearing finding)

The 23 failures are NOT a current-code render regression (the screens load clean, 0 console errors, `vue-tsc`/`build` green). They are two environment/integration causes:

1. **Compute rate-limiting (429).** The e2e fires extract-contour across 49 cases faster than the compute limiter (5/60s, B.W4) allows; the run did not raise `COMPUTE_RATE_LIMIT`. Most contour/workspace/gallery failures cascade from this + the canvas-never-appears timeout it produces. → A test-harness env (`COMPUTE_RATE_LIMIT`) the δ thread sets; not a product bug.
2. **`KeyError: 'storage_uri'` on an unmigrated doc (the real integration finding).** The current W5 serving routes subscript `doc["storage_uri"]` (`api/routers/images.py:140,159`) rather than the `.get()` shim (`image_storage.py:198`). The deletion-proof removed dual-read by design (NO legacy), so the code is correct **only against a migrated DB**. The local Mongo carries pre-W5 docs (inline `blob`, no `storage_uri`) — and a dedup-hit upload (`store_image_asset`) can return such a doc — so the route KeyErrors. **The W5 migration (`migrate_image_blobs.py`) has never run in any environment.** This is DA1's "migrations unexercised on real data" made concrete: **code + migration must cut over together, in every environment (local, dev, prod)** — D.α runs the migration as part of the atomic deploy, and local dev must run it too. (A secondary hardening: `images.py:140,159` should resolve through the shim so a not-yet-migrated doc degrades to a clean 404/410, not a 500 — but the gestalt fix is migration-with-deploy, per the NO-dual-read invariant.)

## §3 — Prod reality (from DA4, confirmed)

Prod fourier is a **pre-A build** (`8818ae5`, 2026-03-28) with a dirty host tree (hand-edited compose carrying an inline plaintext Mongo password) and an empty/pre-A DB; it has **never deployed through the webhook chain**. The `image_blobs` `external:true` volume does not exist, so a naive `git push` deploy of current master **would fail** on the missing volume. value.js's `palette-api` co-tenants the host, healthy. → D.α is, first and foremost, **the first real deploy of A/B/C to prod**, sequenced safely on a shared multi-app host.

## §4 — Disposition

- fourier local e2e red → D.δ (set `COMPUTE_RATE_LIMIT` for the harness) + D.α (run the migration so the DB matches the code) + a D hardening item (`images.py` shim-resolve for a clean not-migrated degrade).
- fourier prod stale → D.α (the headline: deploy A/B/C for the first time, migration-with-deploy, on the shared host).
- value.js smoke + palette-api → D.δ (run the suite across envs) + D.γ (CRUD cohesion — `palette-api` is the live cohesion target).
