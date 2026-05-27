# NA2 — Cloudflare Pages deployment recipe + GitHub-Pages → CF-Pages migration

**Lane**: NA2 (tranche-D constellation normalization)
**Posture**: READ-ONLY. No Cloudflare API token used or requested — grounded entirely
in repo CI config + public DNS state. The token is named, never printed; it is an
execution-wave input only.
**Date**: 2026-05-27
**Working dir**: `/Users/mkbabb/Programming/fourier-analysis`

---

## 0. TL;DR

- The **speedtest repo already runs CF Pages in production** (`speedtest.friday.institute`).
  Its recipe is operator-driven (no `.github/workflows`): `vite build → dist/ →
  npx wrangler pages deploy dist --project-name speedtest`, with a `public/_redirects`
  SPA fallback and a `public/_headers` CSP manifest, fronted by a `functions/api/[[path]].ts`
  Pages Function reverse-proxy. The build is `wrangler`-driven from `scripts/deploy.sh`.
- **`keyframes.babb.dev` and `color.babb.dev` are TODAY on GitHub Pages** — both resolve to
  the GH-Pages anycast block `185.199.108–111.153` (confirmed via public `dig`). Each ships
  a `peaceiris/actions-gh-pages@v4` workflow + a `CNAME` file. `color.babb.dev` is the
  **value.js** frontend (not the `colors` math library). The migration flips both to CF Pages.
- The KISS heuristic: **static SPA + CDN + free → CF Pages; needs same-origin server / DB /
  server-side compute → stays on the mbabb host (Apache vhost → Docker stack)**. Fourier's
  `web/` is currently the latter (it proxies `/api` to a MongoDB-backed backend) — see §6.

---

## 1. The speedtest CF-Pages recipe (reverse-engineered)

Speedtest is the **reference implementation** — it is the only repo in the constellation that
already ships a frontend to Cloudflare Pages in production. Everything below is grounded in its
tracked config.

### 1.1 Architecture (the four layers)

`~/Programming/speedtest/docs/DEPLOYMENT.md:3-12` and `scripts/deploy.sh:4-7`:

| Layer | Host | Tech |
|---|---|---|
| **Frontend** | `speedtest.friday.institute` | **Cloudflare Pages** (static SPA, branch `master`) |
| Frontend (dpi variant) | `dpi.speedtest.friday.institute` | Same Pages project, alternate hostname |
| Edge worker | `speedtest-edge.fridayinstitute.workers.dev` | Cloudflare **Workers** (LibreSpeed garbage/upload) |
| Origin API | `api.speedtest.friday.institute` | EC2 Docker (Hono + MongoDB) behind nginx + CF Origin CA |

Only the **Frontend** layer is the CF-Pages recipe the normalization needs. The Workers edge
and EC2 origin are speedtest-specific and do not generalize to the static frontends.

### 1.2 Build command + output dir

- **Build**: `npm run build` → `vite build --mode production` (`package.json:23`).
- **Output dir**: `dist/` (`vite.config.mjs:516` — `outDir: path.resolve(ROOT, "./dist/")`).
- **Base path**: `base: "/"` (`vite.config.mjs:38`) — root-mounted, because the app owns its
  own apex hostname (not a subpath like GH-Pages project sites).
- The build emits `dist/index.html`, `dist/assets/`, a PWA service worker (`dist/sw.js`,
  `workbox-*.js`), plus the two manifests copied verbatim from `public/` (next section).

### 1.3 The `_redirects` SPA fallback

`~/Programming/speedtest/public/_redirects` (one line, copied into `dist/` by Vite):

```
/*  /index.html  200
```

This is the **canonical CF-Pages SPA fallback**: any path that is not a real static file is
internally rewritten (HTTP 200, not a 30x) to `index.html`, so the client-side router
(`createWebHistory`) owns the route. Without it, a deep-link reload (e.g. `/dashboard`) 404s.

### 1.4 The `_headers` CSP manifest

`~/Programming/speedtest/public/_headers` (also copied verbatim into `dist/`). CF Pages serves
every file under the output dir and layers these response headers on top. The speedtest file is
a fully-commented CSP (header comment, `public/_headers:1-37`):

- `/*` block sets `Content-Security-Policy`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`.
- The header comment names *why* `_headers` (not a Worker) owns the document's security
  headers: "the Workers edge only fronts the speedtest garbage/upload API, never the HTML
  document, so the document's security headers belong here."

This is the second CF-Pages convention to generalize: **site-wide response headers live in
`public/_headers`, one indented block per path-glob.**

### 1.5 The Pages Function reverse-proxy (`functions/`)

`~/Programming/speedtest/functions/api/[[path]].ts` — a **Pages Function** (file-routed at
`/api/*`). It reverse-proxies `/api/*` to the `API_ORIGIN` env var
(`https://api.speedtest.friday.institute`), so the SPA uses relative `/api/...` URLs with no
CORS. This is **optional** and speedtest-specific (it has a separate origin API). A frontend
with no backend, or one whose backend lives same-origin, does not need a `functions/` dir.

> Note for normalization: the `functions/api/[[path]].ts` proxy is the CF-Pages equivalent of
> nginx's `proxy_pass`. If a frontend genuinely needs a same-origin API, CF Pages *can* do it
> via a Function — but that is exactly the case where the mbabb-host (with a real backend +
> DB) is often the simpler home (§6).

### 1.6 How the CI deploys to CF Pages — `wrangler pages deploy` (direct upload)

There is **no `.github/workflows/` in speedtest** (confirmed: the dir does not exist;
`docs/DEPLOYMENT.md:120-122` states "No `.github/workflows/` exists … CI … is routed to
AC+1"). The "CI" is an **operator-driven script**, `scripts/deploy.sh`, run from the
workstation. The frontend deploy mechanism is the **wrangler direct-upload** path
(`cloudflare/wrangler` from `node_modules`, invoked via `npx`) — **not** `wrangler-action`,
**not** `cloudflare/pages-action`, **not** a git-connected Pages build.

`deploy_frontend()` (`scripts/deploy.sh:291-362`), in order:

1. **Assert the token** — `: "${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN}"` (`:292`).
2. **Pre-flight slug check** — `npx wrangler pages project list | grep -qE …${PAGES_PROJECT}…`
   (`:297-304`). A wrong project name fails fast instead of burning a build on a silent 404.
3. **Record rollback target** — capture the current live deployment ID via
   `npx wrangler pages deployment list --project-name "$PAGES_PROJECT" --json` (`:311-313`)
   before the alias swap.
4. **Sibling-dist freshness gate** — cold-rebuild any `file:`-linked `@mkbabb/*` sibling whose
   `dist/` is stale (`:321`, `ensure_sibling_dist_production`, `:107-219`).
5. **Build** — `npm run build` (`:324`).
6. **Sanitize the commit message** — `iconv -f utf-8 -t ascii//TRANSLIT` because wrangler 4.x
   rejects non-printable ASCII (em-dashes, `≤`) in `--commit-message` (`:341-352`).
7. **Deploy** (`:354-359`):

```bash
npx wrangler pages deploy dist \
  --project-name "$PAGES_PROJECT" \
  --branch master \
  --commit-dirty=true \
  --commit-message "$sanitized_msg"
```

### 1.7 The project-name binding

`PAGES_PROJECT="${PAGES_PROJECT:-speedtest}"` (`scripts/deploy.sh:48`,
`setup-pages-env.sh:46`). **The project NAME is `speedtest`** — verified live via
`wrangler pages project list`. Its `.pages.dev` subdomain is `speedtest-cf1.pages.dev`
(`docs/DEPLOYMENT.md:181`), which a prior revision mistook for the project name. The
`wrangler pages deploy` `--project-name` flag wants the **project name**, not the subdomain;
the pre-flight assertion (`deploy.sh:297-304`) catches the confusion. Custom-domain binding:
the CF DNS table (`docs/DEPLOYMENT.md:179-184`) shows `CNAME speedtest.friday.institute →
speedtest-cf1.pages.dev`, proxied. The custom domain is attached to the Pages project in the
CF dashboard / API; DNS then CNAMEs the public hostname at the project's `.pages.dev` subdomain.

### 1.8 Pages env vars (build-time + runtime)

CF Pages has no file-based env config; `scripts/setup-pages-env.sh` PATCHes them via the CF
API (`api.cloudflare.com/.../pages/projects/$PROJECT`, `:94-98`), for both `production` and
`preview` namespaces. Speedtest's set (`docs/DEPLOYMENT.md:56-65`): `API_ORIGIN` (runtime,
the Function proxy target), `VITE_GOOGLE_MAPS_KEY`, `VITE_MAPTILER_KEY`,
`VITE_CF_ANALYTICS_TOKEN` (all build-time). A generic frontend with no third-party keys can
skip this step entirely.

### 1.9 The CI secrets the recipe needs — NAMES ONLY

From `scripts/deploy.sh:24-31` + `setup-pages-env.sh:26-35` + `docs/DEPLOYMENT.md:86-94`.
**No values are reproduced here. The values are execution-wave inputs.**

| Secret / var | Required for | Scope needed | Source-of-truth |
|---|---|---|---|
| `CLOUDFLARE_API_TOKEN` | **every** CF deploy (Pages, env, Workers) | Pages:Edit (+ Workers Scripts:Edit, DNS:Edit, Analytics for the full speedtest stack) | operator `.env.local` (local) or repo secret (CI) |
| `CLOUDFLARE_ACCOUNT_ID` | every CF deploy | n/a (identifier) | `deploy.sh:40` default (the account id literal; an identifier, not a secret) |
| `PAGES_PROJECT` | the deploy/env target | n/a | `deploy.sh:48` default `speedtest` |
| `VITE_GOOGLE_MAPS_KEY` | speedtest build only | Google Maps API | operator `.env.local` |
| `VITE_MAPTILER_KEY` | speedtest build only | MapTiler tile API | operator `.env.local` |
| `VITE_CF_ANALYTICS_TOKEN` | speedtest build only (optional; empty disables beacon) | CF Web Analytics site tag (safe client-side) | operator `.env.local` |

**Fail-fast contract** (`setup-pages-env.sh:40-42`, `deploy.sh:286,292,365`): every required
key is asserted via `: "${VAR:?msg}"` before any network call. No production-value defaults are
baked into the scripts (a prior revision embedded literal Maps/MapTiler keys; those are flagged
as rotate-on-handover, `DEPLOYMENT.md:107-118`).

**Token-only-when-executing rule**: for the normalization audit and planning waves, the token is
named and never needed. It is only required by the **execution** wave that actually runs
`wrangler pages deploy`.

---

## 2. The generalized per-frontend CF-Pages template

Given any Vite/SPA frontend (fourier's `web/`, value.js's `demo/`, keyframes.js's `demo/app/`),
the steps to put it on CF Pages at `<app>.babb.dev`:

### 2.1 In the repo (one-time)

1. **Confirm the build emits a flat static dir.** Vite default is `dist/`. Speedtest emits
   `dist/`; keyframes' demo emits `dist/gh-pages/` (`vite.config.ts:238`); value.js's demo
   emits `dist/gh-pages/` too; fourier's `web/` emits `dist/` (Vite default). **The CF-Pages
   output dir is whatever the chosen build mode writes** — name it explicitly in the deploy
   command (§2.2 step 4).
2. **Set `base`** to `/` for an apex/subdomain mount (speedtest does; fourier's `web/` reads
   `VITE_BASE_URL || "/"`, `vite.config.ts:23`). GH-Pages project sites used `base: "./"`
   (keyframes `vite.config.ts:225`) because they mounted under a path — on CF Pages with a
   custom subdomain, `/` is correct and cleaner.
3. **Add `public/_redirects`** with the SPA fallback (verbatim from §1.3):
   ```
   /*  /index.html  200
   ```
   Required for any history-mode router (fourier's `web/` uses `createWebHistory`,
   `src/router/index.ts:12` — so it WILL need this). Vite copies `public/*` into the output
   dir, so the file ships automatically.
4. **(Optional) Add `public/_headers`** with site-wide security headers (CSP, nosniff,
   referrer-policy) — pattern in §1.4. Recommended for any public surface.
5. **(Optional) Add `functions/api/[[path]].ts`** only if the SPA needs a same-origin reverse
   proxy to a separate origin (§1.5). Most static frontends do not.

### 2.2 The deploy invocation (per frontend)

Mirror speedtest's `deploy_frontend` (§1.6), parameterized:

```bash
# Required: CLOUDFLARE_API_TOKEN (Pages:Edit). CLOUDFLARE_ACCOUNT_ID for the account.
export CLOUDFLARE_API_TOKEN=…            # never committed; .env.local or CI secret
export CLOUDFLARE_ACCOUNT_ID=…           # account identifier

APP=keyframes                            # → project name + <app>.babb.dev
OUTPUT_DIR=dist/gh-pages                  # whatever the build mode wrote (dist/ for fourier)

# 1. pre-flight: confirm the project slug exists (fail fast, no silent 404)
npx wrangler pages project list | grep -qw "$APP" \
  || npx wrangler pages project create "$APP" --production-branch master

# 2. build
npm run gh-pages          # or `npm run build` — the mode that writes $OUTPUT_DIR

# 3. deploy (direct upload)
npx wrangler pages deploy "$OUTPUT_DIR" \
  --project-name "$APP" \
  --branch master \
  --commit-dirty=true
```

### 2.3 Custom domain `<app>.babb.dev`

`babb.dev` is already on Cloudflare NS (`dig babb.dev NS` → `jillian/maciej.ns.cloudflare.com`),
so the whole flip lives inside one CF account:

1. In the Pages project → **Custom domains → add `<app>.babb.dev`**. CF provisions the edge cert
   automatically.
2. CF writes/expects a `CNAME <app>.babb.dev → <project>.pages.dev` in the `babb.dev` zone
   (proxied). Because the zone is already at CF, this is in-dashboard / one API call — no
   registrar round-trip (parallels speedtest's `CNAME speedtest.friday.institute →
   speedtest-cf1.pages.dev`, `DEPLOYMENT.md:181`).
3. Public TLS is CF-edge, auto-renewed — no certbot, no Origin CA (the Origin CA in speedtest
   exists only for the EC2 *API* origin, not the Pages frontend, `DEPLOYMENT.md:197-203`).

### 2.4 Sibling-dist gotcha (constellation-specific)

Every frontend here `file:`-links `@mkbabb/*` siblings (fourier `web/package.json:14-18` links
glass-ui + keyframes.js + value.js; keyframes links value.js; value.js's deploy workflow
checks out glass-ui). A CF deploy must build against **fresh** sibling `dist/`. Speedtest
codifies this as a pre-build gate (`deploy.sh:107-219`). The per-frontend template should carry
the same gate (or, in CI, an explicit sibling-checkout step as value.js's workflow does,
`node.js.yml` deploy job "Checkout glass-ui").

---

## 3. The GitHub-Pages → CF-Pages migration (color + keyframes)

### 3.1 Current GH-Pages state (grounded)

Both targets are **live on GitHub Pages today**, confirmed by public DNS:

| App | Repo | CNAME file | Live DNS (`dig +short`) |
|---|---|---|---|
| `keyframes.babb.dev` | `github.com/mkbabb/keyframes.js` | `CNAME` = `keyframes.babb.dev` | `185.199.108–111.153` (GH-Pages anycast) |
| `color.babb.dev` | `github.com/mkbabb/value.js` | `CNAME` = `color.babb.dev` | `185.199.108–111.153` (GH-Pages anycast) |

**Correction worth flagging**: `color.babb.dev` is the **value.js** frontend, *not* the
`~/Programming/colors` repo. The `colors` repo (`github.com/mkbabb/colors`) is a 2021-era math
library (`src/colors.ts`, `src/math.ts`) with no frontend build, no CNAME, no `.github/`, and no
gh-pages branch — it is **not** deployed anywhere and is not part of this migration. (value.js
also serves `value.babb.dev` from the same repo — same GH-Pages anycast IPs — though the task
names only `color.babb.dev`; the operator should decide whether `value.babb.dev` flips too.)

Each repo's GH-Pages CI:

- **keyframes.js** — `.github/workflows/node.js.yml`. `deploy` job (on push to `master`):
  `npm ci` → `npm run gh-pages` (`vite build --mode gh-pages` → `dist/gh-pages/`,
  `vite.config.ts:219-267`) → `cp CNAME dist/gh-pages/` → `peaceiris/actions-gh-pages@v4`
  with `github_token: ${{ secrets.GITHUB_TOKEN }}`, `publish_dir: ./dist/gh-pages`. This
  pushes the built site to the `gh-pages` branch (confirmed: `keyframes.js` has a local
  `gh-pages` branch).
- **value.js** — `.github/workflows/node.js.yml`. Same shape: a large `build-and-test` matrix
  (Node 22/24, lint, vue-tsc, bench gates, Playwright), then a `deploy` job (`needs:
  build-and-test`, on push to `master`) that checks out `glass-ui` as a sibling, `npm ci` →
  `npm run gh-pages` (→ `dist/gh-pages/`) → `cp CNAME dist/gh-pages/` →
  `peaceiris/actions-gh-pages@v4`, `publish_dir: ./dist/gh-pages`.

So today: **build artifact → `gh-pages` branch (peaceiris) → GitHub Pages serves it → DNS
CNAME at the `babb.dev` zone (already CF-hosted) points the subdomain at the GH-Pages anycast
IPs via the `CNAME` file's hostname.**

### 3.2 Cutover to CF Pages (per app)

For each of `keyframes.babb.dev` and `color.babb.dev`:

1. **Create the CF Pages project** (direct-upload, not git-connected): `npx wrangler pages
   project create <app> --production-branch master`. Project names: `keyframes`, `color` (or
   `value` — operator's choice for the slug; the custom domain is what matters).
2. **First deploy** via the template (§2.2): `npm run gh-pages` → `npx wrangler pages deploy
   dist/gh-pages --project-name <app>`. Verify on the `<app>.pages.dev` preview URL **before**
   touching DNS — the GH-Pages site stays live untouched throughout.
3. **Add `public/_redirects`** SPA fallback to each repo (both are history-mode SPAs). The
   `CNAME` file becomes unnecessary on CF (CF custom-domains are dashboard/API-bound, not
   file-bound) — but leave it until the GH-Pages teardown so nothing breaks mid-flight.
4. **Flip the DNS record** in the `babb.dev` CF zone: change `<app>.babb.dev` from the
   GH-Pages CNAME target (the `username.github.io` / anycast path) to **`CNAME
   <app>.babb.dev → <app>.pages.dev`, proxied**. This is a single-record edit inside the CF
   dashboard since `babb.dev` is already on CF NS. Attach `<app>.babb.dev` as a custom domain
   on the Pages project (§2.3) so CF issues the edge cert.
5. **Retire the GH Actions deploy job**: delete (or gate off) the `deploy:` job in each
   `.github/workflows/node.js.yml`. **Keep** the `build-and-test` / `test` jobs — they are CI,
   not deploy, and stay valuable. (keyframes' workflow is `test` + `deploy`; value.js's is
   `build-and-test` + `deploy` — in both, only the `deploy` job is removed.) Remove the
   `cp CNAME dist/gh-pages/` line with it.
6. **Tear down GH Pages**: in each GitHub repo Settings → Pages → set source to "None"; delete
   the `gh-pages` branch; remove the repo `CNAME` file. (Do this last, after DNS has propagated
   and the CF-served site is confirmed live.)
7. **Decide the build-mode rename (optional cleanup)**: `gh-pages` is now a misnomer. The mode
   can stay (it is just a Vite mode name) or be renamed to `demo`/`pages`. Out of migration
   scope; flag for a follow-up.

### 3.3 Migration ordering invariant

**Build-and-verify-on-`.pages.dev` BEFORE the DNS flip; tear-down GH-Pages AFTER propagation.**
The GH-Pages site and the CF-Pages site can coexist (different IPs) during steps 2–6; only the
single DNS-record edit (step 4) cuts traffic over. This mirrors speedtest's frontend deploy
discipline (record rollback target, deploy, verify, then trust the alias) and the EC2
operator-cutover pattern in `DEPLOYMENT.md:187-195`.

### 3.4 CI option (vs operator-driven)

Speedtest deploys CF Pages from the operator workstation (`deploy.sh`), no GH Actions. The two
migrating repos *already have* GH Actions runners. Two valid end-states:

- **Operator-driven (speedtest parity)**: drop the `deploy` job entirely; deploy via `npx
  wrangler pages deploy` from the workstation when shipping. Simplest; matches the constellation
  reference. KISS-favoured for low-traffic demo sites.
- **CI-driven CF Pages**: replace the `peaceiris` step with a wrangler step in the same
  workflow — either `cloudflare/wrangler-action@v3` with `command: pages deploy dist/gh-pages
  --project-name <app>`, or a bare `npx wrangler pages deploy` run-step. This needs the repo
  secrets **`CLOUDFLARE_API_TOKEN`** (Pages:Edit) and **`CLOUDFLARE_ACCOUNT_ID`** added to each
  GitHub repo's Actions secrets (names only — set in repo Settings → Secrets). value.js's matrix
  already proves the sibling-checkout pattern (`glass-ui` checkout) the wrangler job would reuse.

Recommendation: **operator-driven first** (zero new CI secrets, matches speedtest), with the
CI-driven path as a documented option once cadence justifies it.

---

## 4. Repo-by-repo target table

| App | Repo | Domain | Today | Build → output | Target |
|---|---|---|---|---|---|
| speedtest | `TheFridayInstitute/speedtest` | `speedtest.friday.institute` | **CF Pages** (reference) | `npm run build` → `dist/` | unchanged (reference recipe) |
| keyframes.js | `mkbabb/keyframes.js` | `keyframes.babb.dev` | GH Pages (peaceiris) | `npm run gh-pages` → `dist/gh-pages/` | **→ CF Pages** (full migration) |
| value.js | `mkbabb/value.js` | `color.babb.dev` (+`value.babb.dev`) | GH Pages (peaceiris) | `npm run gh-pages` → `dist/gh-pages/` | **→ CF Pages** (full migration) |
| fourier `web/` | `mkbabb/fourier-analysis` | `fourier.babb.dev` | **mbabb host** (Apache vhost → Docker `:8100`, MongoDB) | `npm run build` → `dist/` | **stays on host** unless de-coupled from its API (§6) |
| `colors` (lib) | `mkbabb/colors` | (none) | not deployed | n/a (math lib, no frontend) | **not in scope** |

---

## 5. CF Pages vs the mbabb host — the KISS heuristic

The mbabb production host (per the sibling DA4 audit, `../DA4-host-deploy-prod.md`) is **not**
plain nginx — it is **host Apache2** terminating TLS, with vhost `fourier.babb.dev` →
`ProxyPass / http://localhost:8100/` into a per-repo **Docker stack** (nginx + backend +
MongoDB), one 10-port block per app (fourier 8100, floridify 8110, csp 8120, palette 8130,
speedtest 8140). It is the home for **full-stack, stateful, same-origin** apps.

### The decision rule

```
Is the frontend a static SPA whose only runtime dependency is a CDN + (optionally) a
remote API reachable cross-origin or via a thin reverse-proxy?
  YES → Cloudflare Pages.  (free, global CDN, auto-TLS, atomic deploy + 1-click rollback,
        zero host footprint, no port-block, no Docker, no Apache vhost)
  NO  → keep it on the mbabb host (Apache vhost → Docker stack), where it sits same-origin
        with its backend + database.
```

Tie-breakers:

| Signal | → CF Pages | → mbabb host |
|---|---|---|
| Backend / database? | none, or a remote API CORS-or-proxy-reachable | **same-origin** backend + DB (Mongo) in the same stack |
| Server-side compute? | none (pure static + client JS) | SSR, file upload→processing, sessions, cron |
| Traffic / cost | wants free global CDN, bursty/public | already paying for the host; low marginal cost |
| Statefulness | stateless static assets | stateful (uploaded images, sessions, DB) |
| Coupling | decoupled from any host-shared artefact | wants the shared dispatcher / port-block / Apache vhost |

### Applied to the constellation

- **keyframes.js, value.js** — pure static demos (Vite SPA, no backend in the deployed bundle;
  value.js's `api/` is a *separate* dev concern, not part of the `gh-pages` build). **→ CF
  Pages.** They are already on a static host (GH Pages) precisely because they need nothing more.
- **fourier `web/`** — currently a same-origin full-stack app: it proxies `/api` to a
  MongoDB-backed backend (`web/vite.config.ts:45-50` dev proxy; in prod the Docker stack at
  `:8100` with Mongo `:27017`, DA4). It **stays on the mbabb host** as long as the epicycle
  compute + image-upload + session CRUD live behind a same-origin API. It would only become a
  CF-Pages candidate if that API were split out to its own origin (then the SPA could go to CF
  Pages with a `functions/api/[[path]].ts` proxy, exactly the speedtest pattern, §1.5) — that
  is a larger re-architecture, not a normalization step.
- **speedtest** — the proof the split works: static SPA on CF Pages (§1), with its stateful
  API on the EC2 origin reached via a Pages-Function proxy. The frontend is on CF; the
  database-backed part is not. Same rule, applied.

KISS bottom line: **a frontend belongs on CF Pages exactly when moving it there deletes
infrastructure (no Docker, no vhost, no port-block) without losing a same-origin server it
actually needs.** keyframes + value clear that bar; fourier `web/` does not (yet).

---

## 6. Open items for the planning / execution waves

1. **value.babb.dev** — the value.js repo also serves `value.babb.dev` (same GH-Pages IPs).
   The task names only `color.babb.dev`. Confirm whether both hostnames flip together (one
   Pages project can hold multiple custom domains, as speedtest does with `speedtest` +
   `dpi.speedtest`).
2. **Pages project slug naming** — pick canonical slugs (`keyframes`, `color`/`value`) and run
   the pre-flight `wrangler pages project list` assertion (speedtest's hard-won lesson:
   project NAME ≠ `.pages.dev` subdomain, §1.7).
3. **CI vs operator deploy** — decide per §3.4. If CI-driven, add `CLOUDFLARE_API_TOKEN` +
   `CLOUDFLARE_ACCOUNT_ID` as repo Actions secrets (names only).
4. **`gh-pages` build-mode rename** — cosmetic cleanup once off GH Pages (§3.2 step 7).
5. **Sibling-dist freshness in CI** — port speedtest's gate or value.js's sibling-checkout
   step into whatever runs the CF build (§2.4).
6. **Token scope** — execution wave needs a `CLOUDFLARE_API_TOKEN` with **Pages:Edit** (+
   DNS:Edit if the DNS flip is API-driven rather than dashboard). No token is needed before
   execution.

---

## Appendix — grounding index (file:line)

- `~/Programming/speedtest/scripts/deploy.sh:48` — `PAGES_PROJECT=speedtest`
- `~/Programming/speedtest/scripts/deploy.sh:291-362` — `deploy_frontend()` (the recipe)
- `~/Programming/speedtest/scripts/deploy.sh:354-359` — `wrangler pages deploy dist` invocation
- `~/Programming/speedtest/scripts/deploy.sh:24-31` — required-env header (token + account id)
- `~/Programming/speedtest/scripts/setup-pages-env.sh:40-48` — fail-fast keys + Pages env PATCH
- `~/Programming/speedtest/public/_redirects` — SPA fallback `/*  /index.html  200`
- `~/Programming/speedtest/public/_headers:1-39` — CSP / security-header manifest
- `~/Programming/speedtest/functions/api/[[path]].ts` — Pages Function reverse-proxy
- `~/Programming/speedtest/vite.config.mjs:38,516` — `base: "/"`, `outDir: ./dist/`
- `~/Programming/speedtest/package.json:23` — `build: vite build --mode production`
- `~/Programming/speedtest/docs/DEPLOYMENT.md:3-12,56-122,179-195` — architecture, secrets, DNS
- `~/Programming/keyframes.js/CNAME` — `keyframes.babb.dev`
- `~/Programming/keyframes.js/.github/workflows/node.js.yml` — peaceiris gh-pages deploy job
- `~/Programming/keyframes.js/vite.config.ts:219-267` — `gh-pages` mode → `dist/gh-pages/`
- `~/Programming/value.js/CNAME` — `color.babb.dev`
- `~/Programming/value.js/.github/workflows/node.js.yml` — matrix CI + peaceiris deploy job
- `~/Programming/fourier-analysis/web/vite.config.ts:23,45-50` — `base`, dev `/api` proxy
- `~/Programming/fourier-analysis/web/src/router/index.ts:12` — `createWebHistory` (needs `_redirects`)
- public DNS: `dig +short keyframes.babb.dev` / `color.babb.dev` → `185.199.108–111.153` (GH-Pages)
- public DNS: `dig +short babb.dev NS` → `jillian/maciej.ns.cloudflare.com` (CF-hosted zone)
- `../DA4-host-deploy-prod.md:406` — fourier on host Apache vhost → Docker `:8100` (mbabb host)
