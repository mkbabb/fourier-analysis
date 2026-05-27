# fourier-analysis API

FastAPI + Motor (MongoDB) backend for the Fourier-analysis web companion.
The slug-addressed CRUD surface conforms to
`docs/tranches/B/coordination/CRUD-CONTRACT.md`; the per-language utility
helpers live under `api/lib/crud/`.

## Single-replica constraint

This backend carries **process-local state** in two places and therefore
**MUST run with `replicas: 1`** in production (R3 refinement assay §6 /
R-auth-spec §6; the fourier-A.W4 close note):

- **The rate-limiter** (`api/services/rate_limiter.py`) holds its sliding
  windows in an in-process dictionary. With more than one replica each
  replica enforces its own window independently, so the effective limit is
  `replicas × budget` and a client routed across replicas evades the cap.
- **The suspension cache** (`api/dependencies.py`, the `_suspended_cache`
  with a 60-second TTL — CRUD-CONTRACT §6 "Suspension cache") is per-process.
  With more than one replica, an admin suspension takes up to 60 seconds to
  propagate to each replica, so enforcement is racy for that window per
  replica.

Neither structure is backed by a shared store (no Redis, no DB-backed
rate-limit table) — that is a deliberate KISS choice under invariant 12
("scale without contrivance"; CRUD-CONTRACT §0 rejects a third coordinating
service). The single-replica posture is the contract; a future tranche that
needs horizontal scale lands a shared rate-limit/suspension substrate first.

The production compose / orchestration manifests therefore pin the API
service to a single replica.
