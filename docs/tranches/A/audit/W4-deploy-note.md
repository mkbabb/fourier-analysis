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
- W0-challenge §3 (rate-limiter scaling) — Option A ratified, discharged here (the `replicas: 1` pin); Option B path filed forward to tranche C.
- W2.h `5fdf6ff` — dev-side Mongo env-driven credentials landed; the prod-side completion is this document.
