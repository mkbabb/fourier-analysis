# W4 — Deploy-surface note

Wave A.W4 retires three classes of deploy-surface debt: rate-limiter persistence (W4.a), contour-hash + gallery consolidation (W4.b), and dead-code + secrets hygiene (W4.c). This document catalogues the operator-facing consequences thereof.

## §1 — `deploy.replicas: 1` pin (W4.c, Option A per W0-challenge §3)

`docker-compose.prod.yml` now pins the `backend` service to a single replica:

```yaml
backend:
  deploy:
    replicas: 1
    resources:
      limits:
        memory: 2G
```

### Rationale

The W0-challenge §3 decision tree examined the in-process rate-limiter (`api/services/rate_limiter.py`) and concluded that its per-process token-bucket state cannot survive a multi-replica deployment — two instances of the backend would each grant N requests/window, multiplying the effective ceiling by the replica count and breaking the documented contract. Three options were enumerated; Option A (single-replica pin) was ratified as the W4 deliverable on the grounds that

1. the rate-limiter's correctness invariant binds the deploy topology, not merely the code, and
2. the migration to a distributed-store backend (Option B) constitutes its own architectural undertaking, properly scoped to a later tranche.

The `replicas: 1` line is therefore the canonical constraint — not a temporary placeholder, but the active enforcement of the single-process invariant herein required.

### Operators wishing to scale horizontally

Must first migrate the rate-limiter off its in-process token-bucket store. The W0-challenge documents this as the **Option B → fourier tranche C** debt path; until that migration lands, raising `replicas` above 1 silently breaks the per-IP throttle and the documented `/limits` contract.

The single-replica pin is enforced at the compose-config level — `docker compose -f docker-compose.yml -f docker-compose.prod.yml config` will surface the value, and any change must accompany a documented rate-limiter substrate replacement.

### §1a — Rate-limiter implementation contract (W4.a)

The W4.a agent unit owns the source-side half of the rate-limiter decision. The implementation at `api/services/rate_limiter.py` was reviewed against the W0-challenge §3 ratification; the prior shape is preserved verbatim, since Option A is satisfied by *documenting* the constraint rather than mutating the rate-limiter. The contract is therefore:

| Surface | Value |
|---|---|
| Storage | `OrderedDict[str, _BucketEntry]` in process memory (`rate_limiter.py:51`) |
| Bucket eviction | LRU at `MAX_ENTRIES = 50_000` (`rate_limiter.py:16`) |
| Window discipline | Sliding-window timestamp pruning per `check()` call (`rate_limiter.py:71`) |
| Key | SHA-256(IP) (`rate_limiter.py:21`) — no raw IP retention |
| Replica safety | **None** — each replica maintains an independent bucket set |
| Limiter inventory | `login_limiter` (5/60s), `like_limiter` (10/60s), `write_limiter` (10/60s), `admin_limiter` (30/60s), `compute_limiter` (5/60s) (`rate_limiter.py:110-132`) |

The replica-safety entry is the load-bearing constraint herein. No fallback path, no Redis client behind a feature flag, no environment-conditional code switching the limiter substrate — invariant 3 (no legacy code paths kept as fallback) forbids the contrivance. The single-replica invariant is enforced at the compose layer (§1 above), not in source.

### §1b — Janitor pinned-set inversion (W4.a)

The W4.a agent unit additionally inverts the janitor's pinned-set construction from an unbounded in-memory id list passed as `{"$nin": [list]}` to a per-document `pinned: bool` flag queried as `{"pinned": False, ...}`. The new shape:

| Aspect | Prior (defect) | Post-W4.a |
|---|---|---|
| Pin storage | Materialised set in process memory per cycle | `contours.pinned: bool`, `images.pinned: bool` |
| Delete predicate | `{"contour_hash": {"$nin": [list]}, "last_accessed_at": ...}` | `{"pinned": false, "last_accessed_at": ...}` |
| Index | Defeated by `$nin` against large lists | Compound `(pinned, last_accessed_at)` (`database.py:48-49, 55-56`) |
| BSON 16 MB limit | Eventual exceedance under load | Eliminated outright |
| Pin recompute | Two `find()` cursors + Python loop | Two `$merge`-terminated aggregation pipelines (`janitor.py:_recompute_pin_flags`) |
| Migration | n/a | Inline at each cycle — the recompute IS the backfill, idempotent by construction |

The `$merge` pipelines unite `snapshots.{contour_hash, image_slug}` with `gallery.{contour_hash, image_slug}` filtered on `tier ∈ {featured, saved}`; the union is computed server-side via `$unionWith`, so no client-side id list materialises. Operators upgrading across this boundary need no manual migration step — the first cycle backfills any document missing the `pinned` field.

The regression test at `api/services/__tests__/test_janitor.py` asserts the query shape (no `$nin` anywhere in the cycle), the indexed-predicate use, the pin-policy preservation, and the idempotence of the recompute. The test runs under a hand-rolled async fake DB (motor's surface in the small) — no mongomock dependency is added.

## §2 — Mongo password env-reference (W4.c, W0-challenge §2 row 14)

The literal admin password (`cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb`) is no longer in tracked source. The three sites the W0-challenge ratified as carriers — `docker-compose.yml:14`, `docker-compose.prod.yml:8`, `docker-compose.prod.yml:47` — now each interpolate from the shell environment:

| File | Line (post-W4.c) | Shape |
|---|---|---|
| `docker-compose.yml:14` | dev backend `MONGO_URI` | `${MONGO_USER:-fourier-admin}:${MONGO_PASSWORD:-fourier-dev-only}` — landed at W2.h `5fdf6ff` |
| `docker-compose.yml:38,40` | dev mongo env + healthcheck | same default-pair — landed at W2.h `5fdf6ff` |
| `docker-compose.prod.yml:8` | prod backend `MONGO_URI` | `${MONGO_USER:-fourier-admin}:${MONGO_PASSWORD:?MONGO_PASSWORD must be set in production}` — landed here |
| `docker-compose.prod.yml` (mongo `environment:`) | prod mongo init pair | same fail-loud `:?` form — landed here |
| `docker-compose.prod.yml` (healthcheck `mongosh -p …`) | prod mongo healthcheck | same fail-loud `:?` form — landed here |

### Dev vs prod posture

- **Dev** uses the shell-style `:-` default (`fourier-dev-only`). The default is intentionally unsafe — its presence in `docker-compose.yml` is a signal, not a credential. The `.env.example` documents this explicitly, and operators running the dev stack against any non-loopback Mongo MUST override `MONGO_PASSWORD`.
- **Prod** uses the `:?` form. Compose refuses to render the plan when `MONGO_PASSWORD` is unset:

  ```
  $ docker compose -f docker-compose.yml -f docker-compose.prod.yml config
  error while interpolating services.backend.environment.[]:
  required variable MONGO_PASSWORD is missing a value:
  MONGO_PASSWORD must be set in production
  ```

  This is the canonical fail-loud posture: missing credentials at deploy time surface as a startup error, not as silent fallback to a guessable default.

### Operator action required

Prior to the next prod deploy the operator MUST:

1. Set `MONGO_PASSWORD` in the deploy host's shell environment (or `.env` adjacent to the compose file — `.env.example` documents the variable).
2. Rotate the credential — the literal `cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb` shipped publicly in the repository and must be considered compromised.
3. Verify the new credential at the Mongo init layer (the prod mongo bootstrap uses `MONGO_INITDB_ROOT_PASSWORD`, so the credential is set when the data volume is first created — a credential rotation against an existing data volume requires the standard `db.changeUserPassword` flow inside `mongosh`, not a compose-file edit).

### Verification

```
$ git grep 'cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb' -- docker-compose.yml docker-compose.prod.yml
(no output)
```

The literal survives only in audit ledgers (`docs/tranches/A/audit/W0-challenge.md`, `W2-backend-validation.md`, the `docs/audits/runs/2026-05-18-*` historical witness files); these are intentionally preserved as evidence of the prior state.

## §3 — Dead-code retirement (W4.c)

Three files were retired wholesale as unconsumed substrate per W0-challenge §2 row 15:

| Path | LOC | Disposition |
|---|---|---|
| `web/src/lib/logo.ts` | 100 | Programmatic SVG logo generator; no consumer in `web/src/` (the `AppHeader` logo is a typographic mark, not the harmonic path) |
| `web/src/lib/math-worker.ts` | 55 | Web Worker shim for trace precomputation; never registered via `new Worker()` anywhere |
| `api/routers/compute.py` | 1 | Tombstone comment — `# Compute router removed — merged into api/routers/contours.py`; no inclusion in `api/main.py` |

Verification at the close of W4.c:

```
$ git grep -E 'logo\.ts|math-worker\.ts|routers/compute' -- web/src/ api/
(no output beyond historical doc-comments in evaluators.ts, scrubbed)
```

The `evaluators.ts` doc-comment referencing `math-worker.ts` was scrubbed during the retirement; the remaining `bases.ts` import of `evaluators` survives as the single legitimate consumer.

## §4 — Audit cross-references

- W0-challenge §2 row 14 (Mongo password) — RATIFIED, discharged here.
- W0-challenge §2 row 15 (dead modules) — RATIFIED, discharged here.
- W0-challenge §3 (rate-limiter scaling) — Option A ratified, discharged here (the `replicas: 1` pin in §1, the source-side contract in §1a); Option B path filed forward to tranche C.
- W2.h `5fdf6ff` — dev-side Mongo env-driven credentials landed; the prod-side completion is this document.
- H3 hardening note (`docs/audits/runs/2026-05-18-tranche-harden/h3-A-W4-W5-W6.md`) — the janitor `$nin` unbounded-growth fault recommendation, discharged at §1b above and at `api/services/__tests__/test_janitor.py`.
- E-audit (`docs/audits/runs/2026-05-18-fourier-tranche/e-crud-slug-valuejs.md`) — the original surfacing of both the janitor pinned-set and the rate-limiter replica-safety questions, both discharged here.
