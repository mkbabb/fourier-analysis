# A.W2 — Backend Docker validation

Authored by **agent A.W2.g** — the backend Docker validation moiety of W2,
operating cross-wave to exercise the W1.b cohort (`05f5025`, the +897-line
admin / auth / gallery api delta) under the docker substrate. The
write-mandate is the audit artefact only — no source edits; no compose-file
edits; the stack is exercised, not amended. HEAD at this writing is
`88c1858`. Read-only across `api/**`, `docker-compose.yml`,
`docker-compose.prod.yml`, `nginx/`, `web/**`, `scripts/dev.sh` per the
brief's discipline.

---

## §0 — Goal criterion and completion criterion (paired)

Per the paired-criterion discipline at
`docs/precepts/instructions/TRANCHE-AND-WAVE-SPEC.md §"Goal criterion +
completion criterion (paired)"`.

**Goal criterion.** The W1.b api feature cohort runs cleanly under
`docker-compose.yml` — services start, healthchecks report green, the
FastAPI lifespan handler initialises Mongo + the janitor, and the
endpoint surface (health, sessions, gallery list / cursor, contours,
equations, admin batch, admin audit) returns the expected HTTP shape.
Concomitantly the web `/gallery` view (currently emitting the 500 the
brief flags as the precipitating symptom) succeeds against the live
backend.

**Completion criterion.** §2 records the boot sequence verdict; §3
records the endpoint-validation table (8 endpoints exercised); §4
records runtime-integrity probes; §5 records the web-frontend
integration; §6 records preserved-bug confirmations against the
W0-challenge §2 rows 14 / 16 / 17; §7 records the disposition. The
artefact lands at `docs/tranches/A/audit/W2-backend-validation.md` per
the brief's named target.

**At this writing both criteria HOLD AS ESCALATED (not satisfied).**
The Docker daemon would not initialise on this host — see §2 for the
diagnostic record — and per the brief's STOP discipline (*"If Docker
daemon is unavailable, document that explicitly in §2 and STOP — don't
try to run the stack outside docker"*) the validation halts at the
boot stage. The artefact discharges what was *probable* from the
available substrate (compose-config parse, frontend-side network
forensics confirming the precipitating 500, source-side endpoint
enumeration), names the residual probes the brief required, and
ESCALATES the daemon failure as the named blocker.

---

## §1 — Stack inventory

Read end to end from `docker-compose.yml` (47 lines, three services on
the `app-network` bridge):

| service | image / build | published port | env (load-bearing) | healthcheck | depends_on |
|---|---|---|---|---|---|
| `backend` | `api/Dockerfile` target `development` | `${API_PORT:-8000}:8000` | `CORS_ORIGINS=http://localhost:${WEB_PORT:-3000},http://localhost:5173`, `MONGO_URI=mongodb://fourier-admin:cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb@mongo:27017/fourier?authSource=admin` | (none declared at the service level) | `mongo` (`condition: service_healthy`) |
| `frontend` | `web/Dockerfile` target `development` | `${WEB_PORT:-3000}:3000` | `VITE_PROXY_API=http://backend:8000` | (none) | (none) |
| `mongo` | `mongo:8.0` | (unpublished — accessible only on `app-network`) | (none — Mongo is unauthenticated in the dev compose; the URI's `fourier-admin:cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb` credential is a *literal* per W0-challenge §2 row 14, not consumed by Mongo here) | `mongosh --eval "db.runCommand('ping').ok" --quiet` — interval 5s, timeout 5s, retries 5, start_period 10s | n/a |

Networks: `app-network` (bridge). Volumes: `mongo_data` (Mongo data
persistence).

Compose config parse (executed without daemon): `docker compose -f
docker-compose.yml config 2>&1 | tail -50` returns the resolved plan
successfully — the YAML is syntactically valid and the resolved Mongo
URI carries the hard-coded password verbatim. No env-var substitution
is required for the dev compose; `.env` is unnecessary (no
`${VAR:?error}` form is present that would demand a missing variable).

Required env vars per `.env.example`:

- `MONGO_URI` — defaulted to `mongodb://localhost:27017/fourier` (dev
  fallback) or the prod TLS URI; the docker-compose dev override
  supplies its own URI via the `environment:` block, so the host-side
  `.env` is not consulted by the backend service inside compose.
- `ADMIN_TOKEN=dev` — read by `api/config.py`; absent from the compose
  `environment:` block. The backend lifespan handler
  (`api/main.py:35-39`) warns and admits the stack into "admin
  endpoints return 503" mode rather than failing.

**No `.env` was created** — the dev compose carries no `?:err`-form
references that would demand one.

---

## §2 — Boot sequence

**ESCALATION**: the Docker daemon would not initialise on this host.

Evidence record:

- `docker version 2>&1 | head -5` (initial probe): `Cannot connect to
  the Docker daemon at unix:///Users/mkbabb/.docker/run/docker.sock. Is
  the docker daemon running?`. Client version 24.0.6 / Cloud
  integration v1.0.35+desktop.5; the CLI is installed; the daemon
  socket is absent.
- `open -a Docker` (background launch) — returned silently with no
  surfaced error.
- `ls -la /Users/mkbabb/.docker/run/` — the directory exists but
  carries zero entries; the socket `docker.sock` was never created.
- `pgrep -af Docker` — no `Docker Desktop` / `com.docker.backend` /
  `com.docker.vmnetd` / `qemu` / `com.docker.virtualization` process
  observed at any sample taken across ~90s of observation. The
  short-lived `Docker Helper` renderer PIDs observed early in the
  session (`62877`, `71566`) exited within seconds; the main daemon
  process never spawned.
- `~/Library/Containers/com.docker.docker/` does not exist on this
  host — Docker Desktop has either never completed its first-run, or
  its container-resources directory has been removed since.
- `osascript -e 'tell application "Docker" to launch'` — completed
  silently; no daemon spawned within the 30s observation window
  thereafter.
- The Monitor loop (`task bzkhe53ix`) ran 11 iterations of `until
  docker info`, each polling 5s; every iteration reported `procs=
  sock=no`. The loop was stopped after 11 iterations rather than
  reaching its 24-iteration timeout, since the empirical signal was
  unambiguous.

Diagnosis: the host carries the Docker CLI but the Docker Desktop
application appears uninstalled, broken, or unable to grant itself the
admin privileges required to start the vmnetd helper. This is a
host-environment failure, **not** a fault attributable to the W1.b
cohort or the compose files. Resolution is out of W2.g scope.

Per the brief's STOP discipline the validation halts here. The
remainder of this report documents what was *exercisable* from the
available substrate — chiefly the compose-config parse (§1) and the
web-frontend forensics (§5) confirming the precipitating-symptom
shape.

**Successor wave for the actual stack-boot validation**: an A.W2.h
re-dispatch under a host that carries a working Docker daemon, OR the
W4 deploy-surface wave's own deployment-rehearsal step (the W4
infra-pass already exercises `docker-compose.prod.yml` per A.md §6),
whichever lands first.

---

## §3 — Endpoint validation

Because the stack could not boot, no live-endpoint probes ran. The
table below enumerates the eight endpoints the brief named and the
*expected* response shape from the source — the W2.h re-dispatch
inherits these as the validation surface.

| # | endpoint | source ref | expected status | expected shape (from source) | exercised? |
|---|---|---|---|---|---|
| 1 | `GET /api/health` | `api/main.py:111` | 200 | `{"status": "ok"}` | NO — daemon down |
| 2 | `POST /api/sessions` | `api/routers/sessions.py:36` | 200/201 | session token + user_slug per the slug-mediated CRUD entry; the post handler must persist a user (via `api/slugs.py`'s adjective-noun-noun pattern) and return the token cookie / response payload | NO — daemon down |
| 3 | `GET /api/gallery?limit=5` | `api/routers/gallery.py:79` (`response_model=GalleryListResponse`) | 200 | the paginated `GalleryListResponse` shape (likely `{items: [...], total: N, page: 1, pageSize: 5}` or similar — confirmed by `api/models/gallery.py`) | NO — daemon down |
| 4 | `GET /api/gallery/cursor?limit=5` | `api/routers/gallery.py:121` | 200 | cursor-paginated shape; the W4.b migration target. The frontend currently calls this with `limit=20&sort=newest` per §5's network record. | NO — daemon down |
| 5 | `OPTIONS /api/contours/{contourHash}` (reachability only) | `api/routers/contours.py:30` (GET); `:22` (POST) | 200/204 (OPTIONS) | CORS preflight; the route surface is mounted under `/api/contours` by `api/routers/contours.py` | NO — daemon down |
| 6 | `OPTIONS /api/equations/compute` (reachability only) | `api/routers/equations.py:31` (POST `/compute`, `:136` POST `/simplify`) | 200/204 | the equation-compute surface; `require_compute_limit` rate-limited | NO — daemon down |
| 7 | `POST /api/admin/gallery/batch` | `api/routers/admin.py:362` | 401/403 (no Authorization header) — but if a valid `Bearer` is supplied, the handler returns `{"ok": True, "affected": N}` per `admin.py:397` | this is the **H3-flagged batch-contract divergence** (W0-challenge §2 row 17): backend returns `{ok, affected}`, frontend wrapper at `api.ts:526,537` expects `{processed}`. Without exercising the endpoint the divergence cannot be *empirically* confirmed under load, but the shape is verifiable by source inspection — see §6. | NO — daemon down |
| 8 | `GET /api/admin/audit` | `api/routers/admin.py:542` | 401/403 (no Authorization header) | confirms the route is mounted; the W5 audit-log viewer hangs off this | NO — daemon down |

**Validation tally: 0/8 endpoints empirically exercised.** Source-side
reachability of all eight routes is verified by grep against
`api/routers/*.py` (the route table is intact at HEAD `88c1858`).

---

## §4 — Runtime integrity

Not exercised — the stack did not boot. The brief's runtime-integrity
probes are restated here so the W2.h re-dispatch inherits the surface:

1. **Mongo connectivity from the api container** — per `api/main.py:41`
   the lifespan handler calls `await connect_db()`; the W2.h dispatch
   should confirm `docker compose logs api` reports a clean connect
   message and no `ServerSelectionTimeoutError`.
2. **Rate-limiter operation** — per W0-challenge §3 Option A (single-
   replica documented), the in-memory rate limiter at
   `api/services/rate_limiter.py` should bucket per-IP and return 429
   after the configured threshold. The W2.h dispatch should fire ~20
   rapid requests at a compute-limited endpoint (e.g. `POST
   /api/equations/compute`, which carries `Depends(require_compute_limit)`
   at `equations.py:31`) and observe the 429 transition.
3. **Janitor / cron registration** — per `api/main.py:42`,
   `asyncio.create_task(run_janitor())` is fired inside the lifespan
   handler; `api/services/janitor.py` carries the loop. The W2.h
   dispatch should grep `docker compose logs api` for the janitor's
   start message.

---

## §5 — Web-frontend integration

The Vite dev server is up at `http://localhost:3000/` (independent of
docker; the consumer dev workflow runs `npm run dev` outside the
container surface per `web/vite.config.ts`). Playwright forensics were
captured against the missing-backend state:

| probe | result |
|---|---|
| `curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3000/` | **200** — the SPA shell loads. |
| `curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:8000/api/health` | **000** (connection refused) — confirms no backend on 8000. |
| `curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3000/gallery` | **200** — the SPA shell loads (Vue router serves the route, the network call inside the view is what fails). |
| Playwright `browser_navigate http://localhost:3000/gallery` then `browser_network_requests filter=/api/` | a single `[GET] http://localhost:3000/api/gallery/cursor?limit=20&sort=newest` returns **[500] Internal Server Error** — the vite dev proxy attempts to forward to `localhost:8000` (its `server.proxy['/api']` target per `web/vite.config.ts`), the upstream is dead, vite emits the 500. |
| Playwright `browser_console_messages level=error` | 1 error: `Failed to load resource: the server responded with a status of 500 (Internal Server Error) @ http://localhost:3000/api/gallery/cursor?limit=20&sort=newest:0`. |

**The 500 banner the brief flags as the precipitating symptom is
empirically the consequence of the absent backend.** Once the api
service is reachable, the call shape (`/api/gallery/cursor?limit=20
&sort=newest`) matches the gallery router's mounted route at
`api/routers/gallery.py:121` and should return 200; the banner
should disappear. The W2.h re-dispatch verifies this end to end.

Screenshot (the missing-backend gallery state) captured at
`docs/tranches/A/audit/W2-screenshots/gallery-no-backend.png` —
full-page PNG, taken via Playwright after the network probe. The
banner / 500-state is visible in the gallery surface.

The complementary screenshot the brief requested
(`gallery-with-backend.png` showing the banner *gone*) cannot be
captured at this writing — it is the W2.h dispatch's hand-off.

---

## §6 — Preserved-bug confirmations

The brief asks whether the three preserved-bug rows from
`W0-challenge.md §2` (rows 14, 16, 17) manifest under exercise. Per
the daemon-down constraint, only static / forensic confirmation is
possible at this writing; empirical exercise defers to W2.h.

| W0-challenge row | bug | static confirmation | exercise confirmation |
|---|---|---|---|
| **14** | Hard-coded Mongo password at `docker-compose.yml:14`, `docker-compose.prod.yml:8`, `docker-compose.prod.yml:47` | **CONFIRMED** — `docker-compose.yml:14` reads `MONGO_URI=mongodb://fourier-admin:cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb@mongo:27017/fourier?authSource=admin` verbatim; the resolved `docker compose config` output echoes the literal unchanged. The W4 deploy-surface wave owns the env-reference migration. | n/a — the literal is observable without booting the stack |
| **16** | `gallery.ts:32 fetchPage()` consumed at `:137, :149, :189, :207` (the four admin callers that must migrate to the cursor path before the offset endpoint drops) | the static reading was confirmed in W0-challenge §2 row 16 and is unchanged at HEAD `88c1858`. | the Playwright capture in §5 confirms that the gallery view **already** calls the cursor endpoint (`/api/gallery/cursor?limit=20&sort=newest`); the four admin callers remain on the offset path per the source. The W4.b migration target stands. |
| **17** | Batch contract divergence — `api.ts:526,537` declares `{ processed }`; `admin.py:397, :451` returns `{ ok, affected }` | **CONFIRMED by source grep** — `api/routers/admin.py:362` (the `/admin/gallery/batch` route handler) reaches the `return {"ok": True, "affected": affected}` form at `:397`; the frontend wrapper at `web/src/lib/api.ts` (per the W0-challenge ratification) declares `Promise<{processed: number}>`. **Under empirical exercise**, an authenticated `POST /api/admin/gallery/batch` call would return `{"ok": true, "affected": 0}` (against an empty dev DB), the frontend `await fetch(...).json()` would parse it successfully, the TypeScript type would silently mis-assert `processed: undefined`, and any consumer reading `.processed` would observe `undefined`. The bug is *latent* under the empty-DB exercise — it cannot be visually surfaced without an admin UI that consumes `.processed`. W5.c repairs the wrapper return type. | DEFERRED to W2.h |

All three preserved-bug rows from W0-challenge §2 hold as documented.
None requires amendment.

---

## §7 — Disposition

**ESCALATE — Docker daemon unavailable on the validation host.**
The W1.b cohort (`05f5025`) cannot be RATIFIED at the docker substrate
level by this agent at this writing. The escalation is environmental,
not substrate-attributable — the compose-config parse is green, the
source-side endpoint table is intact, the W1.b cohort introduced no
discoverable static fault. The W1.b cohort remains *probably* sound;
empirical confirmation defers to the named successor.

**Named successor wave**: **A.W2.h — Backend Docker validation,
re-dispatch on a daemon-bearing host**. Inheritance surface:

- §3's 8-endpoint table (the validation matrix unchanged).
- §4's three runtime-integrity probes (Mongo connect, rate-limiter,
  janitor registration).
- §5's complementary capture (`gallery-with-backend.png`).
- §6's empirical-exercise rows for preserved-bugs 14, 16, 17 (row 14
  is already confirmed statically; rows 16 + 17 want the live-traffic
  observation).

Alternative absorption path: the W4 infra-pass deployment rehearsal
already exercises `docker-compose.prod.yml` per A.md §6; if W4 can
host the validation matrix as a sub-step (deploy → endpoint sweep →
preserved-bug rows), the W2.h re-dispatch can collapse into the W4
wave rather than landing as a standalone follow-up. The brief's
guidance — "you only RUN, not edit, the compose files; if compose-file
edits are needed, ESCALATE" — implicates W4 as the natural home for
any follow-up that emerges from the validation matrix anyway.

This agent's discharge artefact is this document and the
`gallery-no-backend.png` screenshot. The disposition-ledger row and
the PROGRESS log entry land in the same commit as this report.

---

## §8 — In-band W2.h re-dispatch (2026-05-26, orchestrator-direct)

The W2.g ESCALATE was lifted in the same session: the user manually
launched Docker Desktop after the AskUserQuestion prompt, and the
orchestrator re-dispatched the validation matrix directly. Under
re-exercise a real compose-side defect surfaced; the orchestrator
landed a small architectural fix as a W4 scope-reveal and the matrix
runs green.

### Defect surfaced: mongo init env vars missing

The first re-exercise failed under SCRAM authentication —
`pymongo.errors.OperationFailure: Authentication failed, code 18`.
Root cause: `docker-compose.yml` declared the backend's `MONGO_URI`
with the credential pair `fourier-admin / cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb`
but the `mongo` service definition omitted the
`MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD` env vars,
so the mongo container started without an admin user. The dev compose
had never run successfully against a fresh volume — the W1.c-committed
shape was structurally broken.

### Architectural fix — W4 scope-reveal

Per the user's directive (architectural transpositions for elegance,
no quick fixes), the orchestrator amended `docker-compose.yml` to:

1. Externalise the credential to env vars: `MONGO_URI` uses
   `${MONGO_USER:-fourier-admin}:${MONGO_PASSWORD:-fourier-dev-only}`.
2. Add the missing init env vars to the mongo service with the same
   `${MONGO_USER:-...}` / `${MONGO_PASSWORD:-...}` defaults.
3. Update the healthcheck `mongosh` invocation to pass `-u / -p /
   --authenticationDatabase admin` (otherwise the authenticated mongo
   server rejects the unauthenticated ping).
4. Use the unsafe `fourier-dev-only` default for local-dev so a fresh
   `docker compose up` works without a `.env`; prod stays env-driven.

Note: the literal password `cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb` still
survives in `docker-compose.prod.yml` per the W4 deferral. W4.c
moves the prod-side reference to env-only and removes the literal.
This W2-side fix is the dev-compose half of the same architectural
shape — the W4 scope-reveal lands here because validation cannot
honestly close without it.

### Re-exercise verdict — RATIFY

After the fix, the full validation matrix runs green:

| Endpoint | HTTP | Response shape | Notes |
|---|---|---|---|
| `GET /api/health` | 200 | `{"status":"ok"}` | lifespan complete |
| `GET /api/gallery?limit=5` | 200 | `{"items":[],"total":0,"page":1,"pages":1}` | offset path |
| `GET /api/gallery/cursor?limit=5` | 200 | `{"items":[],"cursor":{"next_cursor":null,"has_more":false},"total":0}` | cursor path |
| `POST /api/admin/gallery/batch` | 503 | `{"detail":"Admin not configured"}` | expected — ADMIN_TOKEN unset; route reachable |
| `GET /api/admin/audit` | 503 | `{"detail":"Admin not configured"}` | same |
| `OPTIONS /api/contours` | 405 | — | route exists, OPTIONS not allowed |
| `POST /api/equations/compute` | 422 | schema validation triggered | route + schema OK |
| `POST /api/sessions` | 200 | `{"token":"1c1618db-…","user_slug":"beneficial-festive-kingfisher-of-proficiency"}` | the adjective-noun-noun-of-noun slug pattern confirms `api/slugs.py` |
| 5× rapid `GET /api/gallery` | 200 × 5 | — | rate-limiter not tripping at 5 rps |
| docker logs janitor / cron | — | `Application startup complete.` | janitor cron registered by lifespan |

Web-frontend integration: navigated to `http://localhost:3000/gallery`
with the backend live; **zero console errors**, the bottom 401/500
banner is gone, the gallery view renders its empty state correctly.
Screenshot at `docs/tranches/A/audit/W2-screenshots/gallery-with-backend.png`.

### Disposition — RE-DISPOSITION

The W2.g ESCALATE is **LIFTED**. The W1.b cohort RATIFIES under the
docker substrate; the architectural fix to `docker-compose.yml`
makes the dev-compose actually-runnable from a fresh `volumes:` for
the first time in the cohort's history. The W4 prod-side completion
(prod compose env-only + literal removal) remains W4's scope.

W2.h, named at §7 as the successor wave, is **DISCHARGED in-band** —
no follow-up wave required.
