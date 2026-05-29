# F — vhost-correctness spec (inv-22 binding; F.α first land)

**Status**: authored 2026-05-28; **HARDENED 2026-05-28 per F research workflow `w0ma5070c`** (Wα-R1 + Wχ-P2). **Source**: FA1 §5 F-API-1 + F-API-2 + FA2 §3 + the Wα-R1 vhost archaeology (`docs/audits/runs/2026-05-28-F-research/Walpha-R1-vhost-archaeology.md`). **Authority**: this doc binds F.α scope + the inv-22 acceptance shape.

## §0 — Wα-R1 + Wχ-P2 resolution (the hardened diagnosis)

**The stale SPA is ORIGIN-served, NOT CF Pages.** `api.fourier.babb.dev/` returns `Server: nginx/1.29.5` with NO `cf-ray` header. The serving chain: **host Apache (`ProxyPass / → localhost:8100`) → Docker `nginx:alpine` gateway container (`fourier-analysis-nginx-1`) → SPA frontend OR FastAPI backend**. The `Server: nginx/1.29.5` header is emitted by the INNER Docker nginx, transparently proxied by host Apache.

**The offending directive** (live container `/etc/nginx/conf.d/default.conf` — a DRIFTED/stripped form that predates the tracked `nginx/fourier.conf`):
```nginx
location /api/ { proxy_pass http://$backend_upstream; }   # → FastAPI :8000
location /     { proxy_pass http://$frontend_upstream; }  # → SPA :80 (catch-all)
```
The `location /` catch-all swallows `/`, `/health`, `/docs`, `/openapi.json` → SPA index.html (2759 B). Only `/api/*` reaches FastAPI. (This same drift — zero `limit_req` in the live container — is the F-API-2 secondary root cause.)

**No CF pivot** (Wχ-P2 §4): the apex `fourier.babb.dev` is CF-Pages-served (`server: cloudflare`), but the API subdomain is a separate origin-direct path. F.W1 stays an origin `nginx/fourier.conf` edit.

## §1 — The regression (FA1 §2 row 6)

```sh
curl -sI https://api.fourier.babb.dev/health
# HTTP/1.1 200 OK
# Content-Type: text/html             ← BUG
# Last-Modified: 28 May 2026 01:46     ← stale SPA from CF Pages
# Content-Length: 2759 B
```

Expected: `200 OK` with `Content-Type: application/json` and body `{"status":"ok"}` (the FastAPI `/api/health` route already produces this; but the *vhost-root* `/health` falls through to a stale SPA index).

Root cause hypothesis (validated at Wα-R1 nginx archaeology): the api vhost has an nginx try_files fallback that serves a static `index.html` for non-`/api/*` paths. This is the wrong shape for an API vhost.

## §2 — inv-22 binding gate

Both `api.fourier.babb.dev` and `api.color.babb.dev` (and any future constellation API vhost) must satisfy:

```sh
# 1. Root returns JSON (or 404; never SPA HTML)
curl -sI https://api.fourier.babb.dev/ | grep -i 'content-type: application/json' || \
curl -sI https://api.fourier.babb.dev/ | grep -i '^HTTP.* 404'

# 2. /health returns JSON
curl -sS https://api.fourier.babb.dev/health | jq .status   # → "ok"

# 3. /docs returns JSON spec OR FastAPI's Swagger UI (HTML is OK here because it's a real UI route, not a fallback)
curl -sI https://api.fourier.babb.dev/docs | grep -iE 'content-type: (text/html|application/json)'

# 4. /openapi.json returns JSON
curl -sS https://api.fourier.babb.dev/openapi.json | jq .info.title   # → "Fourier Analysis API" (or equivalent)

# 5. Symmetric on palette-api
curl -sI https://api.color.babb.dev/ | grep -iE 'application/json|^HTTP.* 404'
```

If ANY of the 5 checks fail, the vhost is non-conformant and W1 close blocks.

## §3 — F-α land plan (W1)

### α.1 — nginx vhost diagnosis (Wα-R1 substrate)

At Wα close, R1 produces:
- Current `api.fourier.babb.dev` vhost config (capture).
- Identification of the offending fallback rule (`try_files`, `error_page`, or directive equivalent).
- The desired post-state config + diff.

### α.2 — vhost fix (W1) — HARDENED per Wα-R1 §6

Edit the TRACKED `nginx/fourier.conf` (the live container config is drifted — bind-mounted `:ro`, so a container recreate picks up the tracked file). Add BEFORE the `location /` SPA catch-all:

```nginx
# F.W1 — route FastAPI's root-served doc endpoints to the backend, not the SPA.
location = /openapi.json { proxy_pass http://$backend_upstream; proxy_set_header Host $host; }
location = /docs         { proxy_pass http://$backend_upstream; proxy_set_header Host $host; }
location = /redoc        { proxy_pass http://$backend_upstream; proxy_set_header Host $host; }
location = /health       { default_type application/json; return 200 '{"status":"ok"}'; }
# inv-22 check #1: the bare root must NOT serve the SPA index on the API host.
location = /             { default_type application/problem+json; return 404 '{"type":"about:blank","title":"Not Found","status":404}'; }
# everything else non-/api/* still falls to the SPA:
location /               { proxy_pass http://$frontend_upstream; }
```

**Why surgical, not proxy-all** (Wχ-P2 §2): FastAPI serves `/docs` + `/openapi.json` at root but functional routes under `/api/*` (`/api/health` → `{"status":"ok"}`; `/api/docs` → 404). A blanket proxy-all `location /` → FastAPI would break browser SPA routes on the shared container. The `location =` exact-match blocks are the minimal correct fix. (Cleaner long-term: split the API onto a dedicated subdomain with no co-located SPA — deferred; out of F scope.)

Redeploy:
```sh
cd /var/www/fourier-analysis && git pull && \
  docker compose -f docker-compose.prod.yml up -d --force-recreate nginx
```
Blast radius: container-local sub-second swap; does not touch backend/mongo/frontend or host Apache/TLS. Rollback: `git revert <F.W1 sha> && docker compose ... up -d --force-recreate nginx`.

### α.3 — verify (W1 close gate)

Run the §2 inv-22 binding gate against `api.fourier.babb.dev`; capture output to `docs/tranches/F/receipts/F-W1-vhost-correctness.txt`. All 5 checks PASS.

### α.4 — rate-limit middleware diagnosis (rides W1)

FA1 §4: 25-burst on `/api/visualizations` returned 25× 200 with static `RateLimit-Remaining: 10` and `Reset: 0`. Either SlowAPI isn't wired to list endpoints OR the limiter emits constants.

At Wα-R3 substrate:
- Identify the limiter wiring at `api/services/rate_limiter.py` + `api/main.py`.
- Verify whether `RateLimit-*` headers are emitted dynamically per-request or as static defaults.
- Identify the fix (likely: ensure the limiter middleware is registered before the routes; ensure the headers are derived from the per-IP counter, not a constant).

At W1.α.4: apply the fix; re-run the 25-burst probe; expect ≥1 429 with `RateLimit-Remaining: 0` and a non-zero `Reset` (or document why the read tier doesn't 429 in production conditions).

**Wα-R3 hardened root cause**: NOT a static constant. The limiter is a custom `SlidingWindowLimiter` (`api/services/rate_limiter.py`). The defect is an **enforce/report split**: `RateLimitHeaderMiddleware.dispatch` (lines 204-214) calls read-only `snapshot()`, while the recording `check()` is wired ONLY on POST/PATCH/DELETE via `Depends(require_*_limit)`. Read routes (`GET /api/visualizations`, `GET /{slug}`) carry NO limiter dependency → the bucket is never incremented → `snapshot()` honestly reports the empty write_limiter fallback bucket (Remaining=10, Reset=0). **Fix shape (a) [RECOMMENDED]**: make `RateLimitHeaderMiddleware` call `check()` (record + enforce, catch 429 → Retry-After) instead of read-only `snapshot()` — the single enforce+report path, exactly the value.js palette-api pattern at `value.js/api/src/middleware/rate-limit.ts:91-116`. ~15 LOC. This makes F.W1 a transposition of the already-shipped I.W4 unified middleware (strengthens the cross-repo-cohesion thesis).

## §4 — Cross-constellation symmetry

inv-22 is **cross-constellation**, not fourier-only. The same shape applies to `api.color.babb.dev` (already passing per FA2 §2 — palette-api's I.W4 SOTA envelopes serve JSON on the root path; preflight echoes ACAO correctly). The inv-22 gate at W1 close verifies BOTH vhosts.

Future constellation API vhosts (csp-solver `api.sudoku.babb.dev` if it adopts SOTA envelopes; any future addition) inherit inv-22 automatically.

## §5 — What this doc IS and IS NOT

**IS**: the binding α-thread spec; the inv-22 acceptance shape; the nginx fix + rate-limit fix plan; the cross-constellation symmetry binding.

**IS NOT**: an nginx rewrite; a CF Workers/Pages reconfig; a FastAPI router restructure (the framework's existing routes are correct; only the vhost fallback is wrong).

End.
