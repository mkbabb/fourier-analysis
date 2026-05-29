# F — vhost-correctness spec (inv-22 binding; F.α first land)

**Status**: authored 2026-05-28. **Source**: FA1 §5 F-API-1 + F-API-2 + FA2 §3 nginx SPA-fallback pattern. **Authority**: this doc binds F.α scope + the inv-22 acceptance shape.

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

### α.2 — vhost fix (W1)

Apply the diff:
- Remove the SPA-style `try_files` fallback for non-`/api/*` paths.
- Either return 404 directly (`return 404 '{"type":"about:blank","title":"Not Found","status":404}'; default_type application/problem+json;`) OR proxy all paths to FastAPI (recommended; let the framework handle `/`, `/health`, `/docs`, `/openapi.json` natively).
- Reload nginx.

### α.3 — verify (W1 close gate)

Run the §2 inv-22 binding gate against `api.fourier.babb.dev`; capture output to `docs/tranches/F/receipts/F-W1-vhost-correctness.txt`. All 5 checks PASS.

### α.4 — rate-limit middleware diagnosis (rides W1)

FA1 §4: 25-burst on `/api/visualizations` returned 25× 200 with static `RateLimit-Remaining: 10` and `Reset: 0`. Either SlowAPI isn't wired to list endpoints OR the limiter emits constants.

At Wα-R3 substrate:
- Identify the limiter wiring at `api/services/rate_limiter.py` + `api/main.py`.
- Verify whether `RateLimit-*` headers are emitted dynamically per-request or as static defaults.
- Identify the fix (likely: ensure the limiter middleware is registered before the routes; ensure the headers are derived from the per-IP counter, not a constant).

At W1.α.4: apply the fix; re-run the 25-burst probe; expect ≥1 429 with `RateLimit-Remaining: 0` and a non-zero `Reset` (or document why the read tier doesn't 429 in production conditions).

## §4 — Cross-constellation symmetry

inv-22 is **cross-constellation**, not fourier-only. The same shape applies to `api.color.babb.dev` (already passing per FA2 §2 — palette-api's I.W4 SOTA envelopes serve JSON on the root path; preflight echoes ACAO correctly). The inv-22 gate at W1 close verifies BOTH vhosts.

Future constellation API vhosts (csp-solver `api.sudoku.babb.dev` if it adopts SOTA envelopes; any future addition) inherit inv-22 automatically.

## §5 — What this doc IS and IS NOT

**IS**: the binding α-thread spec; the inv-22 acceptance shape; the nginx fix + rate-limit fix plan; the cross-constellation symmetry binding.

**IS NOT**: an nginx rewrite; a CF Workers/Pages reconfig; a FastAPI router restructure (the framework's existing routes are correct; only the vhost fallback is wrong).

End.
