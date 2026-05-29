# F research-first audit — Wχ-P2 inv-22 correctness probe

**Lane**: F.Wχ-P2 of the F research-first workflow `w0ma5070c` (Wα 3 research lanes → Wχ 4 challenge probes → synthesis).
**Mode**: research-first; READ-ONLY (live probes + host SSH capture + source reads; no mutation). Tranche-development only.

---

I have everything I need. Key findings:

- api.fourier.babb.dev: `Server: nginx/1.29.5`, NO `cf-ray` → origin direct, NOT behind CF Pages. The stale SPA is served by the origin nginx, confirming R1's §2/§3 archaeology and the F.W1 thread shape.
- fourier.babb.dev (frontend apex): `server: cloudflare` → that's the CF Pages SPA. The API subdomain is a separate origin path.
- inv-22 wording (F.md L57): "return JSON (problem+json on error) for `/`, `/health`, `/docs`, `/openapi.json` — never an SPA index." But the testable gate (L57, L113) only checks `/` content-type + `/health` `.status` — it does NOT actually test `/docs`/`/openapi.json` content-type.
- color `/docs` returns 404 problem+json (it has no Swagger UI). So inv-22's "JSON for /docs" is satisfiable by 404-JSON, not Swagger HTML — but FastAPI's native `/docs` is Swagger HTML by design.

## F.Wχ-P2 — inv-22 correctness probe

### §1 — Is /docs-returns-JSON the right gate? {relax-to-HTML-OK}
NEEDS-REVISION. The strict reading ("`/docs` must return JSON") is wrong-shaped. `/docs` is a **real Swagger-UI route**, not an SPA fallback. FastAPI serves `text/html` Swagger there by design; that is correct, not a regression. The pathology inv-22 actually targets is *the SPA index masquerading as every path*. The discriminating signal is `/openapi.json` (must be `application/json` with `.info.title`) and `/health` (must be `.status`), NOT `/docs` content-type. The gate should read: `/docs` → either Swagger HTML **or** 404-JSON is conformant; an SPA `index.html` (2759 B, identical across all paths) is NOT. Recommend inv-22 distinguish "API-owned HTML (Swagger)" from "SPA-fallback HTML" — byte-identical-across-paths is the real tell. Note color returns 404-JSON at `/docs` (no Swagger mounted); fourier *would* serve Swagger — both conformant under the relaxed gate, divergent under the strict one. inv-22 over-specifies symmetry it cannot hold.

### §2 — Does proxy-all over-constrain?
YES, blanket proxy-all breaks the SPA AND is unnecessary. FastAPI mounts functional routes under `/api/*`; its bare `/` is unowned (would 404). color's root `/` returns `{"status":"ok","service":"palette-api"}` — an explicit health-ish root. fourier FastAPI has no such root route, so proxy-all `/` → FastAPI 404-JSON IS inv-22-conformant (404 problem+json ≠ SPA index), but it would also route browser SPA traffic to the API on the shared container. R1's surgical `location =` blocks are correct: only `/openapi.json`, `/docs`, `/redoc`, `/health` need redirect. R1's own §6 caveat is right — check #1 (`/`) still serves SPA unless `location = /` returns 404-JSON. inv-22 check #1 as written (`/` → application/json) cannot pass without that added block.

### §3 — Cross-constellation binding scope (sudoku OUT)
OUT. F.md L187 already records the disposition: csp-solver is an **external repo**; F files the 1-line `app.include_router` ASK to the maintainer and STAYS-OUT of source. inv-22 may *describe* the cross-constellation pattern (rationale cites FA2 sudoku), but the **testable gate must not bind api.sudoku.babb.dev** in this tranche — no fourier-repo lever reaches it. Binding it would make inv-22 unsatisfiable from this repo. Scope inv-22's enforced surface to {fourier, color}; sudoku is documentary precedent only.

### §4 — CF-Pages-vs-origin: WHO serves the stale SPA? (ORIGIN)
**ORIGIN, not CF Pages.** `api.fourier.babb.dev/` returns `Server: nginx/1.29.5`, NO `cf-ray`, NO `cf-cache` → the API subdomain is served direct from origin (host Apache → Docker nginx → SPA). Only the apex `fourier.babb.dev` shows `server: cloudflare` (that is the CF Pages SPA, a separate surface). Therefore the stale 28-May SPA on the API host is emitted by the **origin container nginx `location /` catch-all**, exactly as R1 §3 found. The F.W1 thread shape does NOT pivot — it remains an origin `nginx/fourier.conf` edit + container recreate. CF config is irrelevant to inv-22.

### §5 — Verdict: inv-22 NEEDS-REVISION at the /docs sub-clause + testable-gate
inv-22 NEEDS-REVISION: (a) `/docs` must accept Swagger-HTML-or-404-JSON, not require JSON — the real invariant is "no SPA-index served at API paths" (byte-identical-HTML-across-paths is the tell), not "JSON everywhere"; (b) the testable gate must add `/` → 404/JSON and `/openapi.json` → `.info.title` checks (currently only `/` ct + `/health` tested), and must NOT bind api.sudoku (external repo). F.W1 thread-shape HOLDS: origin nginx fix, no CF pivot.

Files: `/Users/mkbabb/Programming/fourier-analysis/nginx/fourier.conf` (fix target, confirmed tracked+full), `/Users/mkbabb/Programming/fourier-analysis/docs/tranches/F/F.md` (inv-22 L57, gate L22/L113 — revision target).
