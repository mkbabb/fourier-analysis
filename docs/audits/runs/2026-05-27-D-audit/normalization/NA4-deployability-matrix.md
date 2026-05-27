# NA4 — per-repo deployability matrix + the all-mbabb-vs-split decision per app

**Lane**: NA4 (tranche-D constellation normalization) · **Date**: 2026-05-27 ·
**Mode**: READ-ONLY ground-truth — local repo build configs + read-only SSH
(`ssh -p 1022 mbabb@mbabb.fridayinstitute.net`, `docker ps`, `cat`/`ls` on
`/etc/apache2/sites-enabled/`, `getent hosts`) + DNS resolution. No source
edits, no host mutation, no CF token used. ONE deliverable (this doc).

**The convention being normalized to** (`DOMAIN-NAMING.md §2`): **`<app>.babb.dev`
= frontend, `api.<app>.babb.dev` = backend** (the `api.` subdomain exists only
where there is a backend). The user's per-app preferences and the KISS heuristic
("same-origin simplicity unless a CDN/free-CI win justifies the CORS + public
api-subdomain cost") drive the all-mbabb-vs-split call.

**Citations** are `file:line` against the live local trees + pasted SSH output.

---

## §0 — Headline matrix (the one-screen answer)

| App | Repo | Has backend? | Current FE | Current BE | Target FE | Target BE | Verdict | Effort/Risk |
|---|---|---|---|---|---|---|---|---|
| **speedtest** | `speedtest` | **yes** (Node/EC2) | **CF Pages** (live) | EC2 Docker | CF Pages (ratify) | mbabb docker | **already split — REFERENCE** | none (model) |
| **keyframes.js** | `keyframes.js` | **no** (static demo) | GH Pages | — | **CF Pages** | — | **CF Pages (user-mandated)** | LOW |
| **color** | `value.js/api` (palette-api) | **yes** (Node/TS) | CF/GH Pages (`color.babb.dev`) | mbabb docker `:8130` | CF Pages (ratify) | mbabb docker | **split (user-mandated)** | MED (rename + vhost + CORS) |
| **value.js** (library) | `value.js` | **no** (npm pkg + demo) | GH Pages (`color.babb.dev`) | — | CF Pages (demo) | — | **CF Pages (demo follows color)** | LOW |
| **fourier** | `fourier-analysis` | **yes** (FastAPI) | mbabb nginx `:8100` | mbabb docker | **CF Pages** | mbabb docker | **SPLIT** (recommended) | MED |
| **sudoku** | `csp-solver` | **yes** (FastAPI) | mbabb nginx `:8120` | mbabb docker | **CF Pages** | mbabb docker | **SPLIT** (recommended) | MED |
| **words** | `words` (= floridify) | **yes** (FastAPI + notif) | mbabb nginx `:8110` | mbabb docker | **all-mbabb** | mbabb docker | **ALL-MBABB** (recommended) | LOW (no change) |
| **grammar** | `bbnf-lang` | **no** (WASM playground; LSP ≠ web API) | mbabb Apache static `/var/www/grammar` | — | **CF Pages** | — | **CF Pages — but DEFERRED** (active dev) | LOW-build / HIGH-timing |
| **floridify** | = `words` | (see words) | | | | | **(alias of words; one row)** | — |

**Constellation split headline**: **CF-Pages-frontend + mbabb-docker-backend**
for **speedtest (done), color, fourier, sudoku**; **all-mbabb** for **words**;
**CF-Pages static (no backend)** for **keyframes.js, value.js demo, grammar**.
Only **words** stays fully on mbabb; only **grammar** is timing-gated.

**The DNS is already provisioned for the split** (read-only `getent`, below): the
`api.*.babb.dev` records already resolve to Cloudflare anycast for fourier,
color, sudoku, words — so the split target's hardest infra precondition is
**already in place**. This materially lowers the split cost vs. what
`DOMAIN-NAMING.md §5` assumed ("DNS record needed").

---

## §1 — Live ground-truth (read-only SSH + DNS), shared host

### 1.1 — Apache ingress (the real reverse proxy; `/etc/apache2/sites-enabled/`)

```
$ ls /etc/apache2/sites-enabled/
000-default.conf  babb-dev.conf  default-ssl.conf  default-ssl.conf.bak
grammar.babb.dev-le-ssl.conf  grammar.babb.dev.conf
mbabb-friday-institute-ssl.conf  speedtest.conf
```

`babb-dev.conf` (the clean per-app subdomain vhost — the normalization target):

```
ServerName sudoku.babb.dev          ProxyPass / http://localhost:8120/
ServerName fourier.babb.dev         ProxyPass / http://localhost:8100/
ServerName words.babb.dev           ProxyPass / http://localhost:8110/
(ServerAlias fourier.babb.dev words.babb.dev on the shared cert vhost)
```

`grammar.babb.dev{,.conf,-le-ssl.conf}` — **separate vhost**, `DocumentRoot
/var/www/grammar` (**static-served**, NOT a docker `ProxyPass`).

`default-ssl.conf` carries the **legacy `mbabb.fi.ncsu.edu` path-proxies** still
live (to retire): `/colors/`→`:3100` **and** `/colors/`→`:8130` (two stanzas,
stale), `/fourier/`→`:8100`, `/csp-solver/`→`:8090`, `/words/`→`:8001|:3001`.
`speedtest.conf` → `ServerName speedtest.mbabb.friday.institute`,
`ProxyPass / http://127.0.0.1:8140/` (the legacy on-host arm; CF Pages is now
the live front — see §2.1).

**No `api.*.babb.dev` Apache vhost exists yet** — the split's server-side
routing is unbuilt (DNS resolves, but Apache has no vhost to terminate it).

### 1.2 — DNS reality (`getent hosts`, read-only) — the split is pre-wired

```
fourier.babb.dev     -> 2606:4700:3031::6815:3816   (Cloudflare)
api.fourier.babb.dev -> 2606:4700:3031::ac43:affc   (Cloudflare)  ← already resolves
color.babb.dev       -> 2606:50c0:8002::153          (GitHub Pages / Fastly)
api.color.babb.dev   -> 2606:4700:3031::ac43:affc   (Cloudflare)  ← already resolves
sudoku.babb.dev      -> 2606:4700:3031::6815:3816   (Cloudflare)
api.sudoku.babb.dev  -> 2606:4700:3031::ac43:affc   (Cloudflare)  ← already resolves
words.babb.dev       -> 2606:4700:3031::6815:3816   (Cloudflare)
api.words.babb.dev   -> 2606:4700:3031::ac43:affc   (Cloudflare)  ← already resolves
grammar.babb.dev     -> 172.67.175.252               (Cloudflare)
api.grammar.babb.dev -> 104.21.56.22                 (Cloudflare)  ← resolves (no backend yet)
keyframes.babb.dev   -> 2606:4700:3031::ac43:affc    (Cloudflare)
speedtest.babb.dev   -> 2606:4700:3031::6815:3816    (Cloudflare)
```

**All `babb.dev` traffic is already fronted by Cloudflare** (proxied/orange-cloud
anycast). The `<app>.babb.dev` records front the origin (the host); the
`api.<app>.babb.dev` records all already resolve to CF — meaning the DNS for the
backend split is **provisioned and waiting on the Apache vhost + CORS flip**, not
a fresh DNS create.

### 1.3 — Running compose projects (`docker ps`, from DA4 §1.1, re-confirmed)

`fourier-analysis-*` (nginx `:8100`), `floridify-*` (= words, nginx `:8110`),
`palette-api-*` (= color backend, api `:8130`), `csp-solver-*` (= sudoku, nginx
`:8120`), `speedtest` (`:8140`, legacy arm). Grammar has **no docker container**
(`docker ps | grep grammar` → none; it is the static `/var/www/grammar`).

---

## §2 — Per-app rows (detailed)

### 2.1 — speedtest — **already split; the REFERENCE implementation**

- **Repo**: `~/Programming/speedtest`. **Backend**: YES — Node/Express
  (`server/`, `server/Dockerfile`) + a Cloudflare Worker edge
  (`workers/speedtest-edge/wrangler.toml:1` `name = "speedtest-edge"`,
  `compatibility_date = "2025-09-01"`).
- **Current** (per `scripts/deploy.sh:5-7` header — the canonical topology):
  - Frontend → **Cloudflare Pages** (project `speedtest`, `setup-pages-env.sh:33`
    `PAGES_PROJECT=speedtest`, account `076959a77e08…`).
  - Edge → **CF Workers** (`speedtest-edge.fridayinstitute.workers.dev`).
  - API + DB → **EC2 via Docker** at `api.speedtest.friday.institute`.
  - The Apache `speedtest.conf` `:8140` proxy is the **legacy** on-host arm;
    the live front is CF Pages.
- **Build/CI shape**: frontend `vite build --mode production` (`package.json`
  `"build"`), then `npx wrangler pages deploy` (`deploy.sh:296-301` pre-flights
  the project slug with `wrangler pages project list`, fails fast if absent).
  Pages env vars synced via `setup-pages-env.sh` (CF API token, Pages:Edit).
  Worker via `wrangler deploy`. Backend via SSH + `docker compose` (rsync to
  EC2). Rollback documented (`deploy.sh:231-233`): `wrangler pages deployment
  rollback`, `wrangler rollback` for the worker.
- **Target**: ratify as-is (already conforms to the split pattern). The only
  normalization nit: it uses `*.friday.institute`, not `*.babb.dev` — out of
  NA4 scope but flagged. **`speedtest.babb.dev` already resolves to Cloudflare**
  (§1.2) so an alias is trivial if the user wants the `babb.dev` namespace.
- **Verdict**: **NO CHANGE — it is the template every other split should copy.**
  `scripts/deploy.sh` is the concrete realization of "the NA2 recipe": three
  components, CF-Pages frontend, CF-Workers edge, mbabb/EC2 docker backend, with
  pre-flight + rollback. **Effort: none. Risk: none.**

### 2.2 — keyframes.js — **CF Pages (user-mandated), no backend**

- **Repo**: `~/Programming/keyframes.js`. **Backend**: **NO** — it is an npm
  library (`package.json:2` `@mkbabb/keyframes.js`) with a static demo
  (`demo/{playground,cube,spring,easing,…}`). No `api/`, `server/`, `backend/`,
  no docker compose, no wrangler.
- **Current**: GitHub Pages. `CNAME` = `keyframes.babb.dev`; CI
  `.github/workflows/node.js.yml:23-43` has a `deploy` job → `npm run gh-pages`
  → `cp CNAME dist/gh-pages/` → `peaceiris/actions-gh-pages@v4`
  (`publish_dir: ./dist/gh-pages`). So it is on GH Pages today, fronted by CF DNS
  (§1.2 — `keyframes.babb.dev` → Cloudflare).
- **Target**: **CF Pages** (frontend only; no api subdomain — there is no
  backend). Domain stays `keyframes.babb.dev`.
- **Build/CI shape**: replace the `peaceiris/actions-gh-pages` step with a
  Cloudflare-Pages deploy — either CF's GitHub-integration (auto-build on push:
  build command `npm run gh-pages`, output dir `dist/gh-pages`) or a CI step
  `npx wrangler pages deploy dist/gh-pages --project-name keyframes` (the
  speedtest recipe, §2.1). The `CNAME` file becomes a CF Pages **custom domain**
  binding instead of a GH-Pages artifact.
- **Verdict**: **CF Pages.** Directly user-mandated ("fully Cloudflare Pages, off
  GitHub Pages"). Static + CDN is the ideal CF Pages fit. **Effort: LOW** (swap
  one CI deploy step + add a CF Pages project + custom-domain). **Risk: LOW** —
  no backend, no CORS, no data. The only care item: GH-Pages and CF-Pages must
  not both claim `keyframes.babb.dev` (retire the GH-Pages deploy job in the same
  PR).

### 2.3 — color (palette-api) — **split (user-mandated): CF/GH Pages FE + mbabb docker BE**

- **Repo provenance** (a reconcile item flagged by `DOMAIN-NAMING.md §3` +
  `DA3`): the **frontend** is `value.js` (the library + its demo); the
  **backend** source lives at `value.js/api/` locally (`api/package.json:2`
  `"name": "palette-api"`, Node/TS: `dev: tsx watch src/index.ts`, `build: tsc`,
  `start: node dist/index.js`), **but prod runs from a standalone
  `/home/mbabb/Programming/palette-api`** (DA4 §1.1). **Discrepancy unresolved**:
  is prod palette-api a divergent copy or a checkout of `value.js/api/`? A Wα
  recon prerequisite (out of NA4's read-only scope to resolve; flagged).
- **Backend**: **YES** — `value.js/api/compose.yaml`: `api` service, port
  `127.0.0.1:8130:3000`, `MONGODB_URI`, `ALLOWED_ORIGINS` env, hardened
  (`read_only: true`, `cap_drop: ALL`, `no-new-privileges`), + a `mongo:8`
  service. This is the live `palette-api-api-1` container.
- **Current**: frontend on **`color.babb.dev`** (GH Pages — `value.js/CNAME` =
  `color.babb.dev`, deployed by `value.js/.github/workflows/node.js.yml:280-304`
  `npm run gh-pages` → `peaceiris/actions-gh-pages@v4`; DNS §1.2 →
  GitHub/Fastly). Backend at loopback `:8130`, **no clean public vhost** — only
  the stale `mbabb.fi.ncsu.edu` `/colors/` path-proxies (§1.1), and
  `api/apache-vhost.conf` is itself stale (proxies `/colors/`→`:3100`, not
  `:8130`).
- **Target**: frontend **CF Pages** (or stay GH Pages — the user's stated
  preference is "frontend on Cloudflare Pages") at `color.babb.dev`; backend
  **mbabb docker** at **`api.color.babb.dev`** (`DOMAIN-NAMING.md §2` — the
  recommended resolution of the user's "either/or").
- **Build/CI shape**: FE — `value.js` builds the demo via `npm run gh-pages`
  (`vite build --mode gh-pages` → `dist/gh-pages`, `vite.config.ts:166-172`);
  move that artifact to CF Pages (`wrangler pages deploy dist/gh-pages
  --project-name color`). BE — rename the compose project/container/repo
  `palette-api` → `color`(`-api`); add a host Apache vhost `api.color.babb.dev`
  → `localhost:8130`; set `ALLOWED_ORIGINS=https://color.babb.dev` (the env hook
  already exists in `compose.yaml`). Bind `palette-api-mongo` `0.0.0.0:27020` →
  loopback (`DOMAIN-NAMING.md §4` security finding).
- **Verdict**: **SPLIT (user-mandated).** This split is the user's explicit
  preference and is already half-built (FE static off-host; BE docker on-host).
  **Effort: MED** — the rename touches container/project/repo names + the
  provenance reconcile; the CORS hook + DNS already exist. **Risk: MED** —
  cross-repo (value.js / standalone palette-api), **user-re-mandate-gated** per
  `DOMAIN-NAMING.md §6`, and the shared-Apache vhost edit co-resides with
  fourier's vhosts (coordinate, don't unilaterally impose).

### 2.4 — value.js (the library) — **CF Pages demo (follows color), no backend**

- **Repo**: `~/Programming/value.js`. **Backend**: **NO** — it is the npm
  package `@mkbabb/value.js` (`package.json:2`, `main: ./dist/value.js`). Its
  *demo* (`demo/{color-picker,hero-lab}`) is the deployable static frontend, and
  that demo **IS the `color.babb.dev` site** (shares the `CNAME`). The
  "backend" associated with value.js is palette-api (§2.3) — a *separate* concern.
- **Current**: GH Pages at `color.babb.dev` (same workflow + CNAME as §2.3 —
  they are one repo).
- **Target**: **CF Pages** static (demo), no api subdomain of its own (the
  library has no server; the `api.color.babb.dev` belongs to palette-api). Folds
  into the §2.3 color FE migration — **not an independent deployable**.
- **Build/CI shape**: `vite build --mode gh-pages` (`vite.config.ts:166`,
  `base: "./"`, `outDir: dist/gh-pages`); ship `dist/gh-pages` to CF Pages.
- **Verdict**: **CF Pages (with color).** The library qua library is published to
  npm, not a host; the only deployable surface is the demo, which is the color
  frontend. **Effort: LOW** (rides the color FE migration). **Risk: LOW.** Listed
  as its own matrix row only because the task enumerates it; operationally it is
  the color frontend.

### 2.5 — fourier — **SPLIT recommended (CF Pages FE + mbabb docker BE)**

- **Repo**: `fourier-analysis` (this repo). **Backend**: **YES** — FastAPI
  (`api/main.py`), Mongo, blob backend. Five-service compose (`backend`,
  `frontend`, `mongo`, `nginx`).
- **Current**: **all-mbabb, single-origin.** Frontend + backend behind one nginx
  (`docker-compose.prod.yml:75-81`, `nginx/fourier.conf`): `location /api/`
  → backend, `location /` → frontend. Apache `fourier.babb.dev` → `:8100` →
  that nginx (§1.1). Prod is ~3 tranches stale at SHA `8818ae5` (DA4 §0) — a
  *deploy* gap, orthogonal to the split decision.
- **Split-readiness (the load-bearing finding)**: fourier's frontend is
  **already split-capable with zero code change**:
  - API base is env-driven: `web/src/lib/api.ts:18` —
    `const BASE = import.meta.env.VITE_API_URL || ""`.
  - The build threads it: `web/Dockerfile:13-16` `ARG VITE_API_URL=/api` /
    `VITE_BASE_URL=/fourier/`; `docker-compose.prod.yml:29-31` passes
    `VITE_API_URL` + `VITE_BASE_URL` as build args.
  - CORS is env-driven + already credential-aware:
    `api/main.py:55` `origins = [o.strip() for o in settings.cors_origins.split(",") …]`,
    `allow_credentials=True`; `docker-compose.prod.yml:7`
    `CORS_ORIGINS=${CORS_ORIGINS:-https://fourier.babb.dev}` (the live backend
    env already carries `CORS_ORIGINS=https://fourier.babb.dev`, DA4 §1.2).
  - A static-only frontend artifact already exists: `web/Dockerfile:26-38`
    (`production` stage) emits a pure-nginx SPA (`try_files … /index.html`) — the
    exact `dist/` that CF Pages would serve.
  - **DNS**: `api.fourier.babb.dev` already resolves to Cloudflare (§1.2).
- **Target**: frontend → **CF Pages** at `fourier.babb.dev`; backend → **mbabb
  docker** at **`api.fourier.babb.dev`** (`DOMAIN-NAMING.md §2/§5`).
- **Build/CI shape**: FE — `npm run build` in `web/` (`vue-tsc -b && vite build`,
  `package.json`) with build env `VITE_API_URL=https://api.fourier.babb.dev` +
  `VITE_BASE_URL=/` (CF Pages serves at root, so drop the `/fourier/` base) →
  `wrangler pages deploy dist --project-name fourier`. BE — keep the existing
  compose minus the `frontend`+`nginx` services (or keep nginx as a slim API
  gateway); add an Apache `api.fourier.babb.dev` vhost → `:8100/` (or a new
  backend host-port); set `CORS_ORIGINS=https://fourier.babb.dev` (already set).
- **Verdict**: **SPLIT (recommended), but the all-mbabb fallback is genuinely
  viable** — the user's words: "fully on mbabb, UNLESS splitting befits."
  - **Why split befits here**: (1) the heavy paper assets (`assets/`, the
    compiled LaTeX, KaTeX) + the SPA are pure static — exactly CF Pages' CDN
    sweet spot; (2) the split is **near-free**: API base + CORS + DNS are
    *already* in place (above), so the marginal cost is one Apache vhost + a CF
    Pages project + the `VITE_API_URL` flip — no app-code change; (3) it offloads
    static serving from the EC2 host (frees the `frontend`+`nginx` containers,
    DA4 §1.1); (4) it matches the constellation pattern (speedtest) + the user's
    `DOMAIN-NAMING.md §1` explicit directive ("split fourier's API to
    `api.fourier.babb.dev`"). The `DOMAIN-NAMING.md` already commits fourier to
    the split at **D.W1/W2 (thread α)**.
  - **Cost of split** (the honest tradeoff): a cross-origin hop (CF Pages → EC2
    API) needs the public `api.` subdomain + CORS (`allow_credentials=True`
    means the backend must echo the exact origin, not `*` — already handled by
    the comma-split list) + the auth cookie/token must be cross-site-safe
    (fourier uses `X-Session-Token` header, `api/main.py` `allow_headers`, NOT a
    cookie — so SameSite is a non-issue; this *favors* the split). The
    same-origin `nginx /api` rate-limit zones (`nginx/fourier.conf:3-5,19-20`)
    must move to the API-side vhost or be re-expressed at the backend.
  - **Recommendation: SPLIT.** The readiness + DNS + the user directive + the
    constellation pattern all point one way; the only real work is ingress
    plumbing, not application surgery.
- **Effort: MED. Risk: MED** — the rate-limit relocation + retiring the
  single-origin `/api` path-proxy are the substantive bits; everything else is
  config. (Note: fourier's prod-deploy reconcile — DA4 — is a *separate*
  prerequisite; do not couple the split to it.)

### 2.6 — sudoku (csp-solver) — **SPLIT recommended (CF Pages FE + mbabb docker BE)**

- **Repo**: `mkbabb/csp-solver` — source at
  `~/Programming/csc411/CSC411_HW2_ProgrammingQuestion` (git remote
  `git@github.com:mkbabb/csp-solver.git`; prod `/var/www/csp-solver`).
  **Backend**: **YES** — FastAPI (`web/api/pyproject.toml:8-9` `fastapi`,
  `uvicorn`) + a Rust/WASM solver core (`csp-solver/`, `Cargo.toml`,
  `wasm/`, `wasm-morph/`). Compose: `backend` + `frontend` + `nginx`
  (`docker-compose.prod.yml`), live as `csp-solver-*` nginx `:8120`.
- **Current**: **all-mbabb, single-origin.** Apache `sudoku.babb.dev` → `:8120`
  → nginx → frontend + `/api`→backend (§1.1). Domain `sudoku.babb.dev`
  (`README.md:7` "Demo: sudoku.babb.dev").
- **Split-readiness**: like fourier, **already split-capable**:
  - FE API base env-driven: `web/frontend/vite.config.*:8` `base:
    process.env.VITE_BASE_URL || '/'`; proxy target
    `process.env.VITE_API_URL || http://localhost:${VITE_API_PORT||8000}`.
  - Build threads it: `docker-compose.prod.yml:25-26` `VITE_API_URL`,
    `VITE_BASE_URL: ${…:-/csp-solver/}`.
  - CORS env-driven: `docker-compose.prod.yml:8`
    `CORS_ORIGINS=${CORS_ORIGINS:-https://mbabb.fi.ncsu.edu}` — **stale default**
    (still the NCSU origin, not `sudoku.babb.dev`); a flip needed regardless.
  - DNS: `api.sudoku.babb.dev` already resolves to Cloudflare (§1.2).
  - CI is **disabled**: `.github/workflows/deploy.yml.disabled` — so there is no
    current CI deploy to perturb; the CF-Pages CI is greenfield.
- **Target**: FE → **CF Pages** at `sudoku.babb.dev`; BE → **mbabb docker** at
  **`api.sudoku.babb.dev`**.
- **Build/CI shape**: FE — `vue-tsc -b && vite build` (`web/frontend/package.json`)
  with `VITE_API_URL=https://api.sudoku.babb.dev` + `VITE_BASE_URL=/` →
  `wrangler pages deploy dist --project-name sudoku`. BE — Apache
  `api.sudoku.babb.dev` → `:8120`; set `CORS_ORIGINS=https://sudoku.babb.dev`.
- **Verdict**: **SPLIT (recommended).** Same rationale as fourier: the WASM
  solver + Vue SPA are static-CDN-ideal, the readiness is in place, DNS resolves,
  and the user gave it "fourier-route OR split." Splitting *also* fixes the stale
  `mbabb.fi.ncsu.edu` CORS default in passing. The KISS counter-argument
  (all-mbabb) is weaker here than for words because csp-solver's frontend is a
  heavy WASM/Vue bundle that benefits from CDN edge-caching. **Effort: MED. Risk:
  LOW-MED** — CI is already disabled (no live pipeline to break); the rate-limit
  relocation is lighter than fourier's. A secondary cleanup: retire the legacy
  `/csp-solver/`→`:8090` path-proxy in `default-ssl.conf`.

### 2.7 — words (floridify) — **ALL-MBABB recommended (no change)**

- **Repo**: `~/Programming/words` (= prod `floridify`, `/home/mbabb/floridify`,
  containers `floridify-*` nginx `:8110`). **Backend**: **YES, and the heaviest**
  — `floridify-backend` (FastAPI) **plus** a `floridify-notification-server`
  (`docker-compose.prod.yml:42-45`) plus mongo plus nginx — a 5-service stack
  with **SSE/streaming** (`frontend/vite.config.*:44-76` a custom `sse-proxy`
  plugin that bypasses http-proxy buffering for streamed lookups).
- **Current**: **all-mbabb, single-origin.** Apache `words.babb.dev` → `:8110`
  (§1.1). FE env-ready (`vite.config.*:10` `VITE_API_URL`, `:16`
  `VITE_BASE_PATH`). No GH workflow (`.github/` has only `.DS_Store`) — deploy is
  via the host webhook/dispatcher (DA4 §2.3 `mkbabb/words` arm → `$HOME/floridify`).
- **Target**: **all-mbabb, unchanged.** `words.babb.dev` FE + backend both on
  mbabb docker behind the one nginx.
- **Verdict**: **ALL-MBABB (recommended).** The user gave words "fourier-route OR
  split." Here the **same-origin simplicity wins decisively**:
  - The app's defining feature is **server-sent-events streaming** that the
    frontend reaches via a *custom buffering-bypass proxy* (`sse-proxy`,
    `vite.config.*`). Same-origin keeps SSE trivial; a CF-Pages → EC2 split would
    force SSE *across* CORS + the CF edge — CF Pages does not proxy long-lived
    SSE to an arbitrary origin without an explicit Worker/Functions shim, adding
    real complexity for no CDN payoff (the value is the *live lookup stream*, not
    static assets).
  - The notification-server is a third stateful service — more cross-origin
    surface to expose publicly for no benefit.
  - There is no CI pipeline to "upgrade" — it already deploys cleanly via the
    host webhook.
- **Effort: NONE (keep current). Risk: NONE.** Splitting would be *net-negative*
  here (introduce CORS + SSE-over-edge complexity to a working same-origin app).
  The only normalization touch (optional): bind `floridify-mongo` `:27018` to
  loopback for parity with the §1.2/`DOMAIN-NAMING.md §4` Mongo-exposure finding.

### 2.8 — grammar (bbnf-lang) — **CF Pages static — but DEFERRED (active dev)**

- **Repo**: `~/Programming/bbnf-lang` (prod `grammar.babb.dev`, `README.md:144`).
  **Backend**: **NO web backend.** It is a Rust crate workspace
  (`Cargo.toml`, `crates/`) with a **WASM playground** frontend
  (`playground/package.json:2` `@mkbabb/bbnf-playground`, Vite, `dist/`,
  `wasm/`). The `server/` directory is **`bbnf-lsp`** — a *Language Server
  Protocol* server (editor tooling), **not** a web API. The playground fetches
  **nothing** (grep for `fetch(`/`VITE_API`/`localhost:NNNN` in `playground/src`
  → **zero hits**); the grammar engine runs in-browser via WASM. So `grammar` is
  **static-only**, like keyframes.
- **Current**: mbabb Apache **static** — `grammar.babb.dev` vhost,
  `DocumentRoot /var/www/grammar` (§1.1), fronted by Cloudflare DNS (§1.2).
  **No docker container, no `/var/www/grammar` git repo on host** (SSH:
  `cd /var/www/grammar … git rev-parse` → "no /var/www/grammar" as a repo — it is
  a plain static doc-root, populated by `make deploy` → `scripts/deploy.sh`,
  `Makefile:236-237`, which rsyncs the built WASM playground). CI
  (`.github/workflows/{ci,release,bench-iai}.yml`) has **no deploy job** — deploy
  is the local `make deploy`.
- **Target**: **CF Pages** (frontend only; `api.grammar.babb.dev` resolves but
  there is **no backend to put behind it** — leave it unbound). Domain
  `grammar.babb.dev`.
- **Build/CI shape**: `make build-wasm` + `playground` `vite build` → a static
  `dist/`; ship to CF Pages (`wrangler pages deploy <playground-dist>
  --project-name grammar`), replacing the `make deploy` rsync-to-`/var/www`.
- **THE ACTIVE-DEV CAVEAT (load-bearing)**: bbnf-lang is in **extreme active
  development** — `git log --since="14 days ago" | wc -l` = **1009 commits in 14
  days** (~72/day), and the working tree is **dirty right now** (5 modified
  `crates/core/src/runtime/bbnf/*.rs` files on `master`). The repo also carries
  `restart/`, `restart-archive-2026-05-04/`, `skinny/`, `.profiles/` — an active
  experimentation footprint.
- **Verdict**: **CF Pages (apply the pattern) — but DEFER the cutover.** The
  migration *itself* is LOW effort (static, no backend, no CORS — identical shape
  to keyframes). The **risk is purely timing/disruption**: swapping the deploy
  mechanism (`make deploy` rsync → CF Pages) mid-flight on a repo landing ~70
  commits/day risks (a) a half-migrated deploy path during a hot push window, and
  (b) contention with the author's in-flight work. **Recommendation: stage the CF
  Pages project + custom-domain binding now (non-disruptive — CF Pages can build
  from a branch without touching `make deploy`), but do NOT retire the rsync
  deploy or cut `grammar.babb.dev` over to the CF-Pages origin until an
  author-coordinated quiet window.** Treat exactly like the shared-dispatcher /
  shared-Apache moves: proposed + coordinated, never unilaterally imposed.
- **Effort: LOW (build/mechanics). Risk: HIGH on timing** (active dev =
  non-disruptive constraint, per the charter). The cutover is a coordinated,
  windowed act — not a tranche-D drive-by.

---

## §3 — Cross-cutting findings (for the D synthesis)

1. **The split is cheaper than `DOMAIN-NAMING.md §5` assumed** — every
   `api.*.babb.dev` record **already resolves to Cloudflare** (§1.2). The DNS
   create is *done*; the remaining work is the Apache `api.` vhost + a CORS
   origin flip + the `VITE_API_URL` build flip. fourier + sudoku frontends are
   **already env-driven** for the API base (no code change).
2. **speedtest is the working reference** for "the NA2 recipe": `scripts/deploy.sh`
   already does CF-Pages-frontend + CF-Workers-edge + mbabb/EC2-docker-backend
   with a Pages-project pre-flight (`deploy.sh:296-301`), env sync
   (`setup-pages-env.sh`), and documented rollback. Copy its shape for color /
   fourier / sudoku.
3. **Mongo public exposure** (`0.0.0.0:27017/27020`, and `:27018` floridify) is a
   live finding (`DOMAIN-NAMING.md §4`, DA4) orthogonal to the split — bind to
   loopback during whichever wave touches each app's compose.
4. **Stale ingress to retire** as the splits land: the `mbabb.fi.ncsu.edu`
   `/colors/`→`:3100`+`:8130`, `/fourier/`, `/csp-solver/`→`:8090`, `/words/`
   path-proxies in `default-ssl.conf` (§1.1); the csp-solver
   `CORS_ORIGINS` default `mbabb.fi.ncsu.edu`; the palette-api
   `apache-vhost.conf` `:3100` mismatch.
5. **value.js library vs. color**: not two deployables — value.js's only host
   surface is its demo, which *is* the `color.babb.dev` frontend (shared CNAME +
   workflow). The palette-api backend is the separable piece.
6. **palette-api provenance** (`value.js/api/` vs standalone
   `/home/mbabb/Programming/palette-api`) is an unresolved Wα reconcile
   prerequisite for the color rename (`DOMAIN-NAMING.md §3`) — out of NA4's
   read-only scope to settle; flagged.

---

## Appendix — evidence index

**Local repos (build configs):**
- fourier: `web/src/lib/api.ts:18` (env API base); `web/Dockerfile:13-16,26-38`
  (build args + static prod stage); `docker-compose.prod.yml:7,29-31`;
  `api/main.py:55-62` (env CORS, `allow_credentials`); `nginx/fourier.conf:3-5,19-20,30,42`.
- sudoku: `csc411/CSC411_HW2_ProgrammingQuestion/web/frontend/vite.config.ts:8,27-29`;
  `…/docker-compose.prod.yml:8,25-26`; `…/web/api/pyproject.toml:8-9`;
  `…/.github/workflows/deploy.yml.disabled`; `…/README.md:7`.
- words/floridify: `words/frontend/vite.config.ts:10,16,44-76` (env base +
  sse-proxy); `words/docker-compose.prod.yml:4,28,42-45,91`; `words/.github` (no
  workflow).
- keyframes.js: `CNAME`; `.github/workflows/node.js.yml:23-43` (gh-pages deploy);
  `package.json:2` (no backend).
- value.js + palette-api: `value.js/CNAME` (`color.babb.dev`);
  `value.js/vite.config.ts:141,166-172` (gh-pages mode); `value.js/package.json:42`
  (`gh-pages` script); `value.js/.github/workflows/node.js.yml:280-304`;
  `value.js/api/compose.yaml` (port 8130, hardened); `value.js/api/package.json:2`
  (`palette-api`); `value.js/api/apache-vhost.conf:8` (stale `:3100`).
- speedtest: `scripts/deploy.sh:5-7,43-48,231-233,296-301`;
  `scripts/setup-pages-env.sh:32-33`; `workers/speedtest-edge/wrangler.toml:1`;
  `server/Dockerfile`; `docker-compose.prod.yml`.
- grammar/bbnf-lang: `README.md:144`; `playground/package.json:2` (no fetch in
  `playground/src`); `server/` = `bbnf-lsp`; `Makefile:236-237` (`make deploy`);
  `git log --since="14 days ago"` = 1009; dirty `crates/core/src/runtime/bbnf/*.rs`.

**Host (read-only SSH `mbabb@mbabb.fridayinstitute.net:1022`):**
- `/etc/apache2/sites-enabled/`: `babb-dev.conf` (fourier/sudoku/words clean
  subdomain proxies), `grammar.babb.dev{,-le-ssl}.conf` (static DocumentRoot),
  `speedtest.conf` (`:8140` legacy), `default-ssl.conf` (legacy NCSU path-proxies).
- `getent hosts`: all `api.*.babb.dev` resolve to Cloudflare anycast (§1.2).
- `docker ps`: fourier `:8100`, floridify `:8110`, csp-solver `:8120`, palette
  `:8130`, speedtest `:8140`; **no grammar container**.
- `cd /var/www/grammar … git rev-parse` → not a repo (plain static doc-root).
