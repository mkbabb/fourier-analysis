# D — domain / endpoint naming standardization (constellation ingress)

**Status**: planned (folds into D thread α — ingress — + a cross-repo ask for the color/palette side). **Authored**: 2026-05-27 (user directive + read-only prod ingress recon). **Authority**: this doc records the convention + the current reality + the per-app plan; the disposition is `D.md §3 W1/W2` + `§7`.

## §1 — The directive

The user: rename the `palette-api` endpoint to be simply **color** on the mbabb server (`api.color.babb.dev` or `color.api.babb.dev`), matching the live `color.babb.dev` frontend; and split fourier's API to `api.fourier.babb.dev` with the frontend at `fourier.babb.dev`.

## §2 — The convention (recommended)

**`<app>.babb.dev` = the frontend; `api.<app>.babb.dev` = the backend API.** Uniform across the constellation. The user gave `api.fourier.babb.dev` explicitly; for consistency the color backend is **`api.color.babb.dev`** (the recommended resolution of the user's "either / or" — `color.api.babb.dev` is the rejected alternative, as it would imply a shared `api.babb.dev` gateway namespace fourier's form does not). Overridable at Wα; recorded as the default.

| App | Frontend | Backend API | Current reality |
|---|---|---|---|
| fourier | `fourier.babb.dev` | **`api.fourier.babb.dev`** (new) | both behind `fourier.babb.dev` today (one nginx; `/api`→backend, else frontend) |
| color (was palette) | `color.babb.dev` (GitHub Pages, live) | **`api.color.babb.dev`** (new; renamed from palette-api) | `palette-api` at loopback `:8130`, no public vhost found |

## §3 — The current ingress reality (read-only recon, 2026-05-27)

- **Reverse proxy**: host **Apache2** (`/etc/apache2/sites-enabled/`), not the per-app nginx. `fourier.babb.dev` is a `ServerAlias`/`ServerName` on the shared `babb-dev.conf` multi-domain vhost (co-resident with `sudoku.babb.dev`, `words.babb.dev`, `grammar.babb.dev`, `speedtest`). It proxies to `localhost:8100` → `fourier-analysis-nginx-1` (`127.0.0.1:8100->80`) → frontend + `/api`→`fourier-analysis-backend-1`.
- **color.babb.dev** resolves to `mkbabb.github.io` — **GitHub Pages** (static color frontend, off-host). It is NOT served by the mbabb Apache.
- **palette-api**: container `palette-api-api-1` at `127.0.0.1:8130->3000`, compose dir **`/home/mbabb/Programming/palette-api`** — a **standalone repo on the host**, NOT `value.js/api/` (where `DA3` found palette-api source locally). **Provenance discrepancy to reconcile (Wα):** is prod `palette-api` a separate repo, a checkout of `value.js/api/`, or a divergent copy? This bears on both the rename and the δ CRUD cohesion. No public vhost for it was found — how `color.babb.dev` (GitHub Pages) reaches the API is a Wα recon item (an existing api domain? a path? CORS to :8130 via another vhost?).
- `api.fourier.babb.dev` does not resolve yet (DNS record needed).

## §4 — Security finding (fold into α)

**Both Mongos are published on `0.0.0.0`, not loopback**: `fourier-analysis-mongo-1` → `0.0.0.0:27017`, `palette-api-mongo-1` → `0.0.0.0:27020` — publicly reachable on the host's public interface. This compounds the C-audit TLS finding (the connections also use `tlsAllowInvalidCertificates`). D thread α must bind these to `127.0.0.1` (or the docker network only) as part of the deploy hardening — a real exposure, not cosmetic. (The fourier one is in scope for fourier-D directly; the palette one is the color/value.js side + shared-host, recorded as the cross-repo ask.)

## §5 — The plan (D, tranche-development; not implemented here)

**fourier side (thread α — fourier-D owns this):**
1. **DNS**: add `api.fourier.babb.dev` (A/AAAA or CNAME to the host); keep `fourier.babb.dev`.
2. **Ingress split**: a host Apache vhost for `api.fourier.babb.dev` → the backend (either a new backend host-port, or the existing nginx routing `api.fourier.babb.dev`→backend and `fourier.babb.dev`→frontend). The cleaner shape: `fourier.babb.dev` → frontend only; `api.fourier.babb.dev` → backend only — retiring the single-domain `/api` path-proxy. Decide at Wα (does the per-app `fourier-analysis-nginx` split the two server_names, or does host Apache route them to two upstreams?).
3. **CORS + client base-URL**: the frontend's API base must move from same-origin `/api` to `https://api.fourier.babb.dev`; CORS on the backend must allow `https://fourier.babb.dev`. Touches `web/` (the API base) + `api/config.py` (`CORS_ORIGINS`).
4. Bind `fourier-analysis-mongo` to loopback (§4).

**color side (cross-repo ask — value.js / palette-api, user-re-mandate-gated; shared-ingress is the only fourier-touchable part):**
1. Rename the service/repo/compose project `palette-api` → `color` (or `color-api`) — a value.js-side / standalone-repo rename (the prod compose dir `/home/mbabb/Programming/palette-api`, the package name, container names).
2. **DNS + ingress**: `api.color.babb.dev` → loopback `:8130`; a host Apache vhost (the shared-ingress piece D can reconcile, carefully — it co-resides with fourier's vhosts).
3. CORS: allow `https://color.babb.dev` (the GitHub Pages frontend) on the color API.
4. Bind `palette-api-mongo` to loopback (§4).

## §6 — Disposition

- **fourier domain split + the fourier Mongo bind** → **D.W1/W2 (thread α)** — fourier-D owns it (DNS, the shared Apache vhost for `api.fourier.babb.dev`, the CORS + client base-URL, the loopback bind).
- **The color/palette-api rename + `api.color.babb.dev` + the palette Mongo bind** → a **cross-repo ask** (value.js / the standalone palette-api repo), **user-re-mandate-gated**, recorded here + in [[CRUD-COHESION]]. The shared-host Apache vhost is the one fourier-touchable seam (constellation-flagged, like the `/opt/deploy/` dispatcher — proposed, coordinated, not unilaterally imposed). The palette-api provenance discrepancy (§3) is a Wα recon prerequisite.
- **The naming convention** (`<app>.babb.dev` + `api.<app>.babb.dev`) → a constellation infra precept, promoted into `docs/precepts/infra/` alongside the C TLS + deploy notes (D.W2).
