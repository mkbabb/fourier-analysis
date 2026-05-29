# E.W0 — Open · baseline · research dispatch

**Wave**: W0 — Open · baseline · research dispatch.
**Closed**: 2026-05-28 (the open ceremony).
**Status**: GREEN.
**Authority**: `E.md §3` row W0; `SYNTHESIS.md §3` Phase 0.

## §1 — What W0 confirms

| Subject | Verdict | Evidence |
|---|---|---|
| D closed CLEAN | **CONFIRMED** | `docs/tranches/D/FINAL.md` (commit `342a078`); host HEAD `6039e95`; production live (`fourier.babb.dev` 200; `api.fourier.babb.dev/health` 200; `deploy.babb.dev` 200; `color.babb.dev` 200; `api.color.babb.dev/palettes` 200) |
| 6-lane E-development audit + SYNTHESIS binding | **CONFIRMED** | `docs/audits/runs/2026-05-28-E-audit/{EA1..EA6.md,SYNTHESIS.md}` (commit `56082c2`) |
| Tranche-E charter authored | **CONFIRMED** | `docs/tranches/E/E.md` + `PROGRESS.md` + 4 coordination docs (commit `56082c2`) |
| Cohort coordination opened | **CONFIRMED** | `coordination/CRUD-COHESION-E.md` + `COHORT-VALUE-JS-I.md` |
| `value.js` HEAD audit-time | `f895048` (G.W5 release-readiness baseline) | `git log -1 value.js/`; tags `v0.10.0` (H close at `074df9c`); the `docs/tranches/C/` is the orphan/peer-to-B C tranche, untracked since 2026-05-26 |
| `value.js` palette-api source provenance | git-tracked at `value.js/api/`; host-deployed via rsync from `/home/mbabb/Programming/palette-api/` per `D/coordination/PALETTE-API-PROVENANCE.md` | the host's `palette-api-api-1` container builds from the rsync-target path; the git source path is the canonical authorial seat |

## §2 — The cross-repo CORS FAIL is reproducible at audit-time

```sh
curl -sS -X OPTIONS https://api.color.babb.dev/palettes/hey-v2-cd3e1e3b-remix-fecce815 \
    -H "Origin: https://fourier.babb.dev" \
    -H "Access-Control-Request-Method: GET" \
    -D - -o /dev/null
```

Response (2026-05-28T04:38:39Z, audit-time):

```
HTTP/1.1 204 No Content
access-control-allow-credentials: true
access-control-allow-headers: Content-Type, X-Session-Token, Authorization
access-control-allow-methods: GET, POST, PATCH, DELETE, OPTIONS
access-control-allow-origin: https://color.babb.dev    ← NOT fourier.babb.dev (FAIL)
```

Expected post-W1: `access-control-allow-origin: https://fourier.babb.dev`. Fix is a single line on the host's palette-api `.env`: `ALLOWED_ORIGINS=https://color.babb.dev,https://fourier.babb.dev` (per `coordination/CRUD-COHESION-E.md §4`). The compose forwards this via `${ALLOWED_ORIGINS:-}` (verified at `value.js/api/compose.yaml:7`).

## §3 — Wα research dispatch ratified

Per `E.md §3 Wα`: 3 ratification lanes against live state (R1 cross-repo cohesion + cohort closure; R2 consumer brittleness + T8 ApiProblem + openapi-codegen flow; R3 transposition risk-assessment T-P1/T-E1+T-S5/T-E2/T-S3/T-P3). Each lane returns RATIFIED-AS-IS or RATIFIED-WITH-DELTA; if a delta surfaces, at-most-one narrowed follow-up lane is dispatched.

The dev-era 6-lane audit (EA1-EA6) did the substantive work — Wα is **ratification not greenfield research**. Expected verdict: 3× RATIFIED-AS-IS, zero narrowed follow-up.

## §4 — Wχ probe set ratified

Per `E.md §3 Wχ`: 5 probes in 4+1 batches (4-agent ceiling): P1 cross-repo source boundary holds; P2 transpositions reduce moving parts; P3 consumer hardening real-bug not hygiene; P4 deploy-hook auto-migration idempotent + safe; P5 cohort closure discipline.

## §5 — Cohort coordination open with value.js-I

The user's 2026-05-28 directive ("fix our cross repos") IS the value.js-I re-mandate per `CRUD-COHESION-E.md §1` + `COHORT-VALUE-JS-I.md §1`. The cohort opens; value.js-I.W0 will land when fourier-E.W2 fires.

## §6 — Sibling repo state at audit-time

| Repo | Path | Status |
|---|---|---|
| fourier-analysis | `/Users/mkbabb/Programming/fourier-analysis` | branch `master` HEAD `163ca47` (post-D + E-dev authoring) |
| value.js | `/Users/mkbabb/Programming/value.js` | branch `master` HEAD `f895048` (post-H close `v0.10.0` at `074df9c`) |
| palette-api | host-deployed via rsync from value.js maintainer's local path (the value.js maintainer is the same user); git provenance via `value.js/api/` | host container `palette-api-api-1` live on `api.color.babb.dev` |
| csp-solver | github.com/mkbabb/csp-solver | no local clone at audit-time; deploys on `sudoku.babb.dev` per D.W10; W6 cross-repo coord ASK only |
| floridify | github.com/mkbabb/floridify | dirty Mongo bind edit on host (per D.W11); upstream commit owed at E.W11 |

## §7 — Commits referenced

| Repo | Commit | Subject |
|---|---|---|
| fourier-analysis | `342a078` | D close (CLEAN) |
| fourier-analysis | `6039e95` | D.W8 `set -u` guard for empty SUMMARY arrays |
| fourier-analysis | `56082c2` | E-dev tranche authoring (6 audits + SYNTHESIS + charter + coordination) |
| fourier-analysis | `163ca47` | post-D vendor → published @mkbabb/* migration |
| value.js | `074df9c` | H close `v0.10.0` |
| value.js | `f895048` | post-H release-readiness baseline |

## §8 — W0 close gate

W0 closes when (a) D is confirmed closed and production is live; (b) the 6-lane audit binding baseline is on `master`; (c) the cohort coordination doc is on `master`; (d) the Wα dispatch substrate is named.

All four conditions met. W0 is GREEN. Wα opens.
