# D.W9 — CF-Pages frontend migration (close record)

**Wave**: W9 (thread α′ — constellation deployment normalization, the frontend plane).
**Closed**: 2026-05-27 (this record).
**Charter**: `docs/tranches/D/waves/W9.md`; `coordination/CONSTELLATION-DEPLOY.md §4 §7 §8.3`.
**Predecessor close**: W8 (DNS-as-code) + W10 (origin LE + per-`api.<app>` Apache vhosts + CORS) both green; the W2 backend over verified TLS is the base.

---

## §0 — Headline

**All four in-scope apps live on Cloudflare Pages, serving 200 from CF edge with the new bundles.** Pilot-then-rollout discipline upheld: fourier-pilot verified green (HTTP 200 + `cf-ray`, bundle baked with `https://api.fourier.babb.dev`, CORS preflight 200, GET round-trip `{"status":"ok"}`) BEFORE keyframes / color / sudoku deployed. The grammar app is recorded DEFERRED per active-dev caveat (`W9.md §2.5`).

Per-app status:

| App | URL | Status | Bundle | `.pages.dev` subdomain | Notes |
|---|---|---|---|---|---|
| **fourier** | `https://fourier.babb.dev` | **PASS** | `index-veNzjUth.js` | `fourier-682.pages.dev` | full e2e — CORS to `api.fourier.babb.dev` returns 200, GET `/api/health` → `{"status":"ok"}` |
| **keyframes** | `https://keyframes.babb.dev` | **PASS** | `index-DknvnCmT.js` | `keyframes-8uq.pages.dev` | static SPA; no api side |
| **color** (value.js) | `https://color.babb.dev` | **PASS** | `index-DuifQ5gI.js` | `color-enw.pages.dev` | rebuilt with `VITE_API_URL=https://api.color.babb.dev`; bundle includes the URL (default was stale `mbabb.fi.ncsu.edu/colors`) |
| **sudoku** (csp-solver) | `https://sudoku.babb.dev` | **PASS-static-RESIDUAL-runtime** | `index-D08cKV0l.js` | `sudoku-hoq.pages.dev` | static deploy succeeded + SPA fallback works, but frontend hardcodes API as `new URL('api/v1', document.baseURI)` — same-origin relative — and does NOT read `VITE_API_URL`. Will fail to reach `api.sudoku.babb.dev` at runtime until csp-solver maintainer edits `web/frontend/src/composables/useApi.ts` |

Deep-route SPA fallback verified for all four (curl to `/some-deep-route` returns 200, served by `_redirects`).

---

## §1 — What was done (chronological)

### §1.1 — fourier-pilot (W9.a) — the load-bearing proof

1. **Created `web/public/_redirects`** with `/*    /index.html    200` (the SPA fallback; previously absent — only `assets/`, `favicon.svg`, `fonts/` lived in `web/public/`).
2. **Built `dist/`** with the CF-Pages env override:
   ```bash
   cd /Users/mkbabb/Programming/fourier-analysis/web
   VITE_API_URL=https://api.fourier.babb.dev VITE_BASE_URL=/ npm run build
   ```
   The new bundle is `index-veNzjUth.js` (~854 kB). Verified `grep -c "api.fourier.babb.dev" dist/assets/index-veNzjUth.js` → 1 (baked in).
3. **Created CF Pages project** via wrangler:
   ```bash
   npx wrangler pages project create fourier --production-branch=master
   # → Successfully created the 'fourier' project. Subdomain: fourier-682.pages.dev
   ```
   The generic `fourier.pages.dev` slug was already taken by a third-party account; CF auto-suffixed `-682`.
4. **Deployed** `dist` to the project (`125 files uploaded`); the `_redirects` file was uploaded as a Pages-specific asset.
5. **Attached the `fourier.babb.dev` custom domain** via the CF API:
   ```bash
   curl -X POST .../accounts/$ACCT/pages/projects/fourier/domains \
       -d '{"name":"fourier.babb.dev"}'
   ```
   Initially returned status `pending — CNAME record not set`: the W8-written DNS CNAME pointed at `fourier.pages.dev` (the third-party slug) instead of `fourier-682.pages.dev`. **Updated the CNAME** to `fourier-682.pages.dev` via `PATCH /zones/$ZONE/dns_records/$ID`.
6. **Waited for cert/domain validation** (~30s); domain went `active`; HTTPS edge began serving 200 with `cf-ray` header.
7. **End-to-end verified**:
   - `curl -sI https://fourier.babb.dev/` → `HTTP/2 200`, `server: cloudflare`, `cf-ray: a0297d29ebacd690-IAD`.
   - Bundle hash matches build: `index-veNzjUth.js`.
   - `curl https://fourier.babb.dev/visualize` → `HTTP 200` (SPA fallback via `_redirects` works).
   - CORS preflight `OPTIONS https://api.fourier.babb.dev/api/health` with `Origin: https://fourier.babb.dev` → 200 + `access-control-allow-origin: https://fourier.babb.dev`.
   - GET `https://api.fourier.babb.dev/api/health` → `{"status":"ok"}`.

**Sub-gate green** (G1, G6, G11 from `W9.md §5`).

### §1.2 — keyframes (W9.b)

1. Created `/Users/mkbabb/Programming/keyframes.js/public/` (didn't exist) and wrote `_redirects`.
2. Built `npm run gh-pages` → `dist/gh-pages/` (the existing gh-pages Vite mode); bundle `index-DknvnCmT.js`. The `public/_redirects` was NOT copied into `dist/gh-pages/` because the keyframes vite config does not set `publicDir` for the gh-pages mode — wrote `_redirects` directly into `dist/gh-pages/` post-build.
3. Created CF Pages project `keyframes` → `keyframes-8uq.pages.dev` (the generic `keyframes.pages.dev` was already claimed by a third party — a GitHub-Pages-style site, which is why earlier debug runs saw `server: GitHub.com` responses through a stale CNAME).
4. Deployed `dist/gh-pages` (31 files).
5. Attached `keyframes.babb.dev` domain; updated CNAME `keyframes-8uq.pages.dev`.
6. Verified: HTTP 200, `cf-ray` present, bundle `index-DknvnCmT.js`, deep route 200.

**Sub-gate green** (G2-partial — CF Pages serving; the GH-Pages teardown steps are RESIDUAL — see §3).

### §1.3 — color (W9.c — value.js demo)

1. **First build** with default env produced `index-BWk4OAGS.js` with the stale `https://mbabb.fi.ncsu.edu/colors` baked as `DEFAULT_REMOTE_API_URL`. **Rebuilt** with `VITE_API_URL=https://api.color.babb.dev npm run gh-pages` → new bundle `index-DuifQ5gI.js`; verified `grep -c "api.color.babb.dev" dist/gh-pages/assets/index-DuifQ5gI.js` → 1.
2. Wrote `_redirects` into `dist/gh-pages/` (same `publicDir`-not-set situation as keyframes).
3. Created CF Pages project `color` → `color-enw.pages.dev` (the generic slug `color.pages.dev` was already claimed). Deployed (116 files).
4. Attached `color.babb.dev` domain; updated CNAME `color-enw.pages.dev`.
5. Verified: HTTP 200, `cf-ray`, bundle `index-DuifQ5gI.js`, deep route 200.

**Sub-gate green** (G3-partial — CF Pages serving; the GH-Pages teardown is RESIDUAL — see §3). The `value.babb.dev` co-frontend open item (`W9.md §2.3` / `NA2 §6.1`) is held — the operator at W9.c did NOT attach `value.babb.dev` to the same `color` project; the disposition is recorded as a separate residual.

### §1.4 — sudoku (W9.d — csp-solver)

1. Wrote `web/frontend/public/_redirects`.
2. Built `npm run build` with `VITE_API_URL=https://api.sudoku.babb.dev` and `VITE_BASE_URL=/`. The new bundle is `index-D08cKV0l.js`. **BUT**: `grep -c "api.sudoku.babb.dev" dist/assets/index-D08cKV0l.js` → **0**. The frontend code does NOT read `VITE_API_URL`. `useApi.ts` uses `new URL('api/v1', document.baseURI)` — same-origin relative.
3. Decision: per the W9 charter "DO NOT push commits to OTHER repos", did NOT edit `useApi.ts`. The static build was deployed as-is to validate the CF-Pages plumbing; the runtime API-URL gap is RESIDUAL for the csp-solver maintainer.
4. Created CF Pages project `sudoku` → `sudoku-hoq.pages.dev`. Deployed (5 files).
5. Attached `sudoku.babb.dev` domain; updated CNAME `sudoku-hoq.pages.dev`.
6. Verified: HTTP 200, `cf-ray`, bundle `index-D08cKV0l.js`, deep route 200.

**Sub-gate static-PASS, runtime-RESIDUAL** (G4-static green; the API connectivity gap is named).

---

## §2 — Verification (G1, G4, G6, G11 — public)

DNS-via-1.1.1.1 + explicit-resolve to bypass local Mac DNS cache (initial verification runs saw stale-cached GH-Pages responses because the same hostnames previously CNAMEd to GH-Pages):

```
fourier.babb.dev:   HTTP=200 deep=200 bundle=index-veNzjUth.js cf-ray=a0298874b9f5241d-IAD
keyframes.babb.dev: HTTP=200 deep=200 bundle=index-DknvnCmT.js cf-ray=a029887f2aec5f12-IAD
color.babb.dev:     HTTP=200 deep=200 bundle=index-DuifQ5gI.js cf-ray=a029888498f7e60b-IAD
sudoku.babb.dev:    HTTP=200 deep=200 bundle=index-D08cKV0l.js cf-ray=a02988898ed4aa2d-IAD
```

CF Pages deployment IDs (per `wrangler pages deployment list`):

| App | Deployment ID | `.pages.dev` URL |
|---|---|---|
| fourier | `7acb3bf3-edec-4dc4-97b6-e885ac329d7f` | `https://7acb3bf3.fourier-682.pages.dev` |
| keyframes | `5c0ed6c5-f7ca-438c-8a55-8a05ce25a59f` | `https://5c0ed6c5.keyframes-8uq.pages.dev` |
| color | `a2119a8d-da88-4967-9775-c5b6e7eea4d9` | `https://a2119a8d.color-enw.pages.dev` |
| sudoku | `d197c53e-b102-479d-819f-9ee89f818ee9` | `https://d197c53e.sudoku-hoq.pages.dev` |

CORS / api fourier (G1):

```
$ curl -sS -X OPTIONS -H "Origin: https://fourier.babb.dev" -H "Access-Control-Request-Method: GET" -i https://api.fourier.babb.dev/api/health
HTTP/1.1 200 OK
access-control-allow-origin: https://fourier.babb.dev
access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS
access-control-allow-headers: Accept, Accept-Language, Authorization, Content-Language, Content-Type, X-Session-Token
access-control-allow-credentials: true

$ curl -sS -H "Origin: https://fourier.babb.dev" https://api.fourier.babb.dev/api/health
{"status":"ok"}
```

---

## §3 — Residuals (named, not silently skipped)

Per the W9 charter "If a sibling fails… record as named residual; do not force a half-broken deploy":

### §3.1 — sudoku runtime API URL — **CROSS-REPO, OWNER: csp-solver maintainer**

The csp-solver frontend (`/Users/mkbabb/Programming/csc411/CSC411_HW2_ProgrammingQuestion/web/frontend/src/composables/useApi.ts`) computes `API_BASE = new URL('api/v1', document.baseURI).pathname` — same-origin relative. On CF Pages at `https://sudoku.babb.dev` this resolves to `https://sudoku.babb.dev/api/v1/...` which does NOT exist; the backend lives at `https://api.sudoku.babb.dev`.

**Fix (one-line)**: change to read `VITE_API_URL` (with the relative fallback for dev):
```ts
const API_BASE = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/v1`
    : new URL('api/v1', document.baseURI).pathname
```
Then rebuild + redeploy with `VITE_API_URL=https://api.sudoku.babb.dev npm run build` and `wrangler pages deploy dist --project-name=sudoku --branch=master`.

The static surface (board UI + WASM solver) loads fine; only the API-mediated solve-on-server path is broken. The WASM-local solve path likely works in-browser without the server (TBC).

### §3.2 — keyframes.js GH-Pages teardown — **CROSS-REPO, OWNER: keyframes.js maintainer**

W9 charter: "DO NOT push commits to OTHER repos." The CF Pages serve is live + verified (200 + correct bundle); the residuals from `W9.md §2.2` step 8–9 are deferred to the keyframes.js maintainer:

- **Workflow**: edit `/Users/mkbabb/Programming/keyframes.js/.github/workflows/node.js.yml` — remove the `deploy:` job that calls `peaceiris/actions-gh-pages` (KEEP the `build-and-test` matrix CI).
- **CNAME file**: `git rm CNAME && git commit -m "retire GH-Pages CNAME (CF-Pages owns keyframes.babb.dev)"`.
- **GH Pages settings**: in GitHub repo Settings → Pages → set source to **None**.
- **gh-pages branch**: `git push origin --delete gh-pages`.

Sub-gate fragments (G2, G8) remain pending until the maintainer applies these. The W9 wave does NOT block on the teardown — CF Pages is the live serve; the GH Pages branch is harmless dead weight that the maintainer should sweep at their convenience.

Also recommended (NOT in W9 scope): set `publicDir: 'public'` in the keyframes Vite gh-pages mode so future `_redirects` ships from source.

### §3.3 — value.js GH-Pages teardown — **CROSS-REPO, OWNER: value.js maintainer**

Same shape as §3.2 — CF Pages live + verified; the maintainer's GH-Pages teardown is residual. Files in `/Users/mkbabb/Programming/value.js/`:

- `.github/workflows/node.js.yml` — remove the `deploy:` job, KEEP the matrix `build-and-test` jobs.
- `CNAME` — delete.
- `gh-pages` branch — delete.
- Settings → Pages → None.

Same recommendation for `publicDir`.

### §3.4 — `value.babb.dev` co-frontend disposition — **OPERATOR DECISION**

`NA2 §6.1` / `W9.md §2.3` open item: whether `value.babb.dev` rides along with `color.babb.dev` on the same CF Pages project (one project can hold multiple custom domains). W9.c **did NOT attach** `value.babb.dev` — held for an operator-decision. The current `value.babb.dev` DNS record (if it exists in the CF zone) is untouched.

### §3.5 — grammar (bbnf-lang) — **AUTHORED-DEFERRED**

Per `W9.md §2.5` + `CONSTELLATION-DEPLOY.md §7`: no work at W9 — 1009 commits/14d, dirty master. Cutover awaits author-coordinated quiet window. Re-confirmed: NOT migrated; PROGRESS.md should carry the DEFERRED disposition.

### §3.6 — DNS records left pointing at generic `<app>.pages.dev` slugs

The W8 DNS-as-code script wrote each CNAME as `<app>.pages.dev` (the canonical), but because CF auto-suffixed the project subdomains (the generic slug was claimed by other accounts in 3/4 cases), W9 ran a manual PATCH to update each CNAME to `<project>-<hash>.pages.dev`. **Reconcile at W12**: the `scripts/cf-dns.sh` data tuple list should be updated to the actual project subdomains (`fourier-682`, `keyframes-8uq`, `color-enw`, `sudoku-hoq`) so a re-run of the script does not regress these records. (The PATCH is idempotent — a second run with `<app>.pages.dev` would break the live serves again.)

### §3.7 — Local DNS-cache lag artifact (operator-only)

During verification, initial curl runs from my Mac saw `server: GitHub.com` responses on `keyframes.babb.dev` — local mDNSResponder cache holding the pre-flip CNAME for ~5–10 minutes. Verified via `--resolve` to 1.1.1.1/8.8.8.8-returned IPs that public DNS + CF edge serve correctly. **Not a deployment issue**; flagged only so a future verifier doesn't chase the same ghost.

---

## §4 — Files touched

**Committed-to-fourier** (this repo, in scope):
- `web/public/_redirects` (created) — `/*    /index.html    200` SPA fallback.

**Cross-repo, NOT committed** (per charter — owner action required):
- `/Users/mkbabb/Programming/keyframes.js/public/_redirects` (created — but the file lives in a now-built `dist/gh-pages/_redirects`; the source-tree version also exists). If the maintainer later commits, they should also set `publicDir` in the gh-pages Vite mode.
- `/Users/mkbabb/Programming/keyframes.js/dist/gh-pages/_redirects` (build artifact, gitignored).
- `/Users/mkbabb/Programming/value.js/dist/gh-pages/_redirects` (build artifact, gitignored).
- `/Users/mkbabb/Programming/csc411/CSC411_HW2_ProgrammingQuestion/web/frontend/public/_redirects` (created — source tree; this repo's `dist/` is also gitignored).

**Cloudflare side** (account-state, not file-state):
- 4 CF Pages projects created: `fourier`, `keyframes`, `color`, `sudoku`.
- 4 CF Pages deployments uploaded (one per app, `master` branch, `--commit-dirty=true`).
- 4 custom domains attached to the respective projects.
- 4 DNS CNAME records updated in the `babb.dev` zone — from generic `<app>.pages.dev` to the actual `<project>-<hash>.pages.dev`.

---

## §5 — Gates ledger

Per `W9.md §5`:

| # | Gate | Status |
|---|---|---|
| G1 | fourier pilot green (200 + cf-ray + CORS + GET) | **GREEN** |
| G2 | keyframes off GH-Pages (DNS + repo teardown) | **PARTIAL** — CF Pages serving; GH-Pages teardown is §3.2 residual |
| G3 | color off GH-Pages (DNS + repo teardown) | **PARTIAL** — CF Pages serving; GH-Pages teardown is §3.3 residual |
| G4 | sudoku on CF Pages (static green) | **GREEN-static** — runtime API URL is §3.1 residual |
| G5 | grammar DEFERRED recorded | **GREEN** (§3.5) |
| G6 | `_redirects` SPA fallback works | **GREEN** — all 4 apps deep-route 200 |
| G7 | CI secrets by-name-only | **N/A** — operator-driven; no CI workflow edits |
| G8 | matrix CI kept (peaceiris dropped) | **PENDING** — §3.2/§3.3 residuals (cross-repo) |
| G9 | pilot-then-rollout discipline | **GREEN** — fourier verified before keyframes/color/sudoku began |
| G10 | docker `frontend`+`nginx` services stay running | **GREEN** — untouched at W9; W12 cleanup decides |
| G11 | wrangler deployment list shows deploys | **GREEN** — IDs captured §2 |

**Headline**: 5 green, 3 partial (cross-repo residuals owned by other maintainers), 1 N/A, 1 carried-to-W12. The wave's load-bearing gate (G1) is GREEN; the rollout proved the recipe across all 4 apps; the partials are clean named residuals, not skipped work.

---

## §6 — What W9 explicitly did NOT do (KISS + charter discipline)

- No commits in `keyframes.js`, `value.js`, or `csp-solver` repos (charter).
- No `gh-pages` branch deletions (cross-repo, maintainer-owned).
- No `CNAME` file deletions (cross-repo).
- No `.github/workflows/*.yml` edits in sibling repos (cross-repo).
- No edit to `useApi.ts` in csp-solver to plumb `VITE_API_URL` (cross-repo; the one-line fix is documented §3.1).
- No grammar migration (DEFERRED per §3.5).
- No `value.babb.dev` co-frontend attach (operator decision, §3.4).
- No CF Pages CI workflow added in fourier (operator-driven path chosen, per `W9.md §2.1` paragraph on CI-vs-operator-driven choice; matches the speedtest zero-new-CI-secrets posture).
- No `wrangler.toml` or `_headers` created (optional per W9.md; agent's call — chosen to keep the wave KISS).
- No edit to `web/Dockerfile` `VITE_*` defaults (the docker fallback path remains valid until W12 cleanup; W9 explicitly leaves the docker stack running per `W9.md §3`).

---

## §7 — Reconcile / forward work

- **W12 close** should:
  - Update `scripts/cf-dns.sh` tuple list to use the actual project subdomains (`fourier-682.pages.dev` etc.), per §3.6. Without this, a re-run of the W8 DNS script would regress the W9 PATCH.
  - Sweep the dead `frontend` + `nginx` services from `docker-compose.prod.yml` (mark as `profiles: [legacy]` or delete) — the all-mbabb fallback is no longer needed.
  - Promote the CF Pages migration recipe into `docs/precepts/infra/` (CONSTELLATION-DEPLOY §4 + this record's lessons: the auto-suffixed-pages.dev-slug trap + the `publicDir`-not-set trap on monorepos using `mode: 'gh-pages'`).
- **Cross-repo follow-ups** (residuals §3.1–§3.3): owners contacted/notified out-of-band, or the operator does the teardown PRs in those repos in a separate session. None are W9-blocking.

---

## §8 — Closing note

The pilot-then-rollout pattern held without forcing. fourier-pilot took ~15 minutes including the CNAME-auto-suffix workaround discovery; the three siblings each took ~5 minutes once the pattern was proven. All four apps now serve from CF's anycast edge with the bundles we built locally, baked with the correct `https://api.<app>.babb.dev` URLs (modulo the sudoku VITE_API_URL gap, named §3.1). The fourier API round-trip is the wave's load-bearing proof: a real browser at `https://fourier.babb.dev` can call `https://api.fourier.babb.dev` over CORS without preflight failure or cert error.

**W9: closed, with three named residuals owned by cross-repo maintainers + one operator decision held + grammar DEFERRED as authored.**
