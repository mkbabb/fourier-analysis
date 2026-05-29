# F research-first audit — Wα-R1 vhost archaeology

**Lane**: F.Wα-R1 of the F research-first workflow `w0ma5070c` (Wα 3 research lanes → Wχ 4 challenge probes → synthesis).
**Mode**: research-first; READ-ONLY (live probes + host SSH capture + source reads; no mutation). Tranche-development only.

---

I have the complete archaeology. The backend serves `/docs` + `/openapi.json` at root (Swagger UI), but functional routes under `/api/*`, with `/api/health` returning the JSON. The vhost root catch-all sends everything non-`/api/` to the SPA frontend. Final verdict below.

## F.Wα-R1 — vhost archaeology verdict

### §1 — Live probe matrix
| host | path | code | content-type | len | server |
|---|---|---|---|---|---|
| api.fourier.babb.dev | / | 200 | text/html | 2759 | nginx/1.29.5 |
| api.fourier.babb.dev | /health | 200 | text/html | 2759 | nginx/1.29.5 |
| api.fourier.babb.dev | /api/health | 200 | application/json | 31 | nginx/1.29.5 |
| api.fourier.babb.dev | /docs | 200 | text/html | 2759 | nginx/1.29.5 |
| api.fourier.babb.dev | /openapi.json | 200 | text/html | 2759 | nginx/1.29.5 |
| api.fourier.babb.dev | /api/visualizations | 200 | application/json | 31 | nginx/1.29.5 |
| api.color.babb.dev | / | 200 | application/json | — | Apache |
| api.color.babb.dev | /health | 404 | application/problem+json | — | Apache |
| api.color.babb.dev | /api/health | 404 | application/problem+json | — | Apache |
| api.color.babb.dev | /docs | 404 | application/problem+json | — | Apache |
| api.color.babb.dev | /openapi.json | 404 | application/problem+json | — | Apache |
| api.color.babb.dev | /palettes | 200 | application/json | — | Apache |

### §2 — The actual web server
- api.fourier.babb.dev served by: **host Apache → Docker `nginx:alpine` gateway (`fourier-analysis-nginx-1`, 127.0.0.1:8100) → SPA frontend OR FastAPI backend**. The contradiction resolves: host Apache is active (nginx host pkg is inactive); the `Server: nginx/1.29.5` header is emitted by the *inner Docker nginx container*, which host Apache transparently proxies via `ProxyPass / → localhost:8100`.
- evidence: `systemctl is-active apache2 nginx` → `active`/`inactive`; `/etc/apache2/sites-enabled/api-fourier.babb.dev.conf` does `ProxyPass / http://localhost:8100/`; `docker ps` shows `fourier-analysis-nginx-1 127.0.0.1:8100->80` (nginx:alpine).

### §3 — The offending config (verbatim, the relevant lines)
Inside the container at `/etc/nginx/conf.d/default.conf` (the live, drifted form):
```nginx
location /api/ {
    proxy_pass http://$backend_upstream;   # backend:8000
}
# Frontend SPA
location / {
    proxy_pass http://$frontend_upstream;  # frontend:80 — catch-all SPA
}
```
The `location /` catch-all sends `/`, `/health`, `/docs`, `/openapi.json` to the **frontend SPA**, which returns its 2759 B `index.html` for any unknown path. Only `/api/*` reaches FastAPI.

### §4 — Why color works + fourier doesn't (the diff)
color (`localhost:8130`) proxies straight to the **palette-api Hono container** — a pure API with NO co-located SPA, so `/` → JSON, unknown → its own `application/problem+json` 404. fourier's gateway is a **dual-purpose** nginx that fronts BOTH the SPA frontend AND the API; its `location /` → SPA is the SPA-fallback that swallows API root paths. The single differing directive: fourier has `location / → frontend SPA`; color has no SPA, only the API upstream.

### §5 — Repo template drift
- Host Apache vhost: **matches** `infra/apache/api-vhosts.conf.template` (concrete instantiation, port 8100). Not the fault site.
- Container nginx: **DRIFTED**. Live `default.conf` is a *stripped* version missing the rate-limit zones (`limit_req_zone`), the `api_compute` compute-location, and the security headers present in the tracked `/Users/mkbabb/Programming/fourier-analysis/nginx/fourier.conf`. The live container predates the tracked file. (This drift is ALSO the F-API-2 root cause: live nginx has zero `limit_req`, so rate headers are whatever FastAPI emits statically.)

### §6 — The exact F.W1 fix (the diff to apply)
Backend probes prove FastAPI serves `/docs` + `/openapi.json` at root but functional routes under `/api/*` (`/api/health` = `{"status":"ok"}`; `/api/docs` = 404). So a blanket proxy-all would break the SPA. The correct fix is **surgical**: add explicit API-doc location blocks BEFORE the SPA catch-all, in `/Users/mkbabb/Programming/fourier-analysis/nginx/fourier.conf`, then redeploy the container so the tracked file lands.

```nginx
# F.W1 — route FastAPI's root-served doc endpoints to the backend, not the SPA.
location = /openapi.json { proxy_pass http://$backend_upstream; proxy_set_header Host $host; }
location = /docs         { proxy_pass http://$backend_upstream; proxy_set_header Host $host; }
location = /redoc        { proxy_pass http://$backend_upstream; proxy_set_header Host $host; }
location = /health {
    default_type application/json;
    return 200 '{"status":"ok"}';
}
# everything else non-/api/* still falls to the SPA:
location / { proxy_pass http://$frontend_upstream; }
```
NOTE: this is an `api.`-hostname vhost; ideally the SPA catch-all should not exist on the API subdomain at all, but since one container serves both names, the `location =` exact-match blocks are the minimal correct fix. (A cleaner long-term option: split the API onto a dedicated upstream with `location / → 404 problem+json`.)

Redeploy (the tracked `fourier.conf` is bind-mounted `:ro`, so a container recreate picks it up):
```sh
cd /var/www/fourier-analysis && git pull && docker compose -f docker-compose.prod.yml up -d --force-recreate nginx
```

inv-22 verification (the 5 checks):
```sh
curl -sI https://api.fourier.babb.dev/ | grep -iE 'application/json|^HTTP.* 404'
curl -sS https://api.fourier.babb.dev/health | jq .status                  # "ok"
curl -sI https://api.fourier.babb.dev/docs | grep -iE 'content-type: (text/html|application/json)'
curl -sS https://api.fourier.babb.dev/openapi.json | jq .info.title        # "Fourier Analysis API"
curl -sI https://api.color.babb.dev/ | grep -iE 'application/json|^HTTP.* 404'
```
Caveat: check #1 — root `/` will STILL serve the SPA unless a `location = /` → 404/JSON block is also added; recommend adding `location = / { return 404 '{"type":"about:blank","title":"Not Found","status":404}'; default_type application/problem+json; }` to satisfy inv-22 check #1.

### §7 — Risk + rollback
- backup path: `sudo cp /etc/apache2/sites-enabled/api-fourier.babb.dev.conf{,.pre-FW1}` (host, unchanged by this fix); the container config is bind-mounted from git so rollback = `git revert` the `nginx/fourier.conf` change + `docker compose up -d --force-recreate nginx`.
- rollback command: `git revert <F.W1 sha> && docker compose -f docker-compose.prod.yml up -d --force-recreate nginx`.
- blast radius: container-local; recreating only the `nginx` service is a sub-second swap and does not touch backend/mongo/frontend. The SPA `/` path is unaffected for browser routes (the new exact-match blocks only intercept `/openapi.json`, `/docs`, `/redoc`, `/health`). Worst case (config typo): `docker compose` won't start nginx → host Apache 502s on 8100 → revert. No host-Apache or TLS change required.

Relevant files: `/Users/mkbabb/Programming/fourier-analysis/nginx/fourier.conf` (the fix target), `/Users/mkbabb/Programming/fourier-analysis/docker-compose.prod.yml` (bind mount, lines 96-100), `/Users/mkbabb/Programming/fourier-analysis/infra/apache/api-vhosts.conf.template` (host vhost, NOT the fault).
