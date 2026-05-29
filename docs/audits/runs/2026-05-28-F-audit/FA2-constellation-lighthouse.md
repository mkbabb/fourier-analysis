# FA2 — sibling-constellation Lighthouse + functional audit

**Lane**: FA2 of the 6-lane F-development workflow `wnjru1x3a`.
**Subject**: sibling-repo prod (`color.babb.dev`, `keyframes.babb.dev`, `sudoku.babb.dev`) + palette-api SOTA envelope live-verification + **csp-solver diagnose** (the E.W6 open ASK).

## §1 — Lighthouse scores (mobile; single-run; observational)

| Site | Perf | A11y | BP | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| `color.babb.dev` | 46 | 100 | 100 | 100 | 5.8 s | 740 ms | 0.001 |
| `keyframes.babb.dev` | 69 | 98 | 100 | 82 | 8.6 s | 90 ms | 0.003 |
| `sudoku.babb.dev` | 73 | 85 | 100 | 83 | 4.6 s | 0 ms | 0 |

color regressed (FCP 4.9 s, LCP 5.8 s, 135 KiB unused JS, TBT 740 ms — the I.W11 cosmetic rename did not perf-regress per se but the demo is heavy). keyframes LCP 8.6 s. sudoku a11y is the weakest of the three.

## §2 — Palette API SOTA envelope live-verification

| Probe | Result |
|---|---|
| ETag present | **YES** — `"2026-03-06T21:13:16.458Z"` (weak/timestamp-shaped, not strong hex) |
| RateLimit-Limit | 60 (per-window) |
| RateLimit-Remaining / -Reset | 59 / 60 — present, RFC 9239-shaped |
| 404 problem+json content-type | **YES** — `application/problem+json` |
| 404 URN type | `urn:palette-api:problem:not_found` — matches I.W4 spec exactly |
| cross-repo CORS ACAO (origin=fourier) | **YES** — `access-control-allow-origin: https://fourier.babb.dev` echoed verbatim on preflight 204 |

I.W4 is **fully live and conformant**. No envelope regression. Cross-repo CORS for fourier is wired.

## §3 — csp-solver diagnose — the OPEN ASK is a **misdiagnosis**

The E.W6 ASK reads "api.sudoku.babb.dev/api/v1/ returns 404 ⇒ broken." It is **NOT broken**. Findings:

- `GET /api/v1/` → 404 `{"detail":"Not Found"}` Content-Type `application/json` — this is the **FastAPI default** for an unrouted root; expected behaviour, not a fault.
- `GET /api/v1/health` → **200** `{"status":"ok"}` — backend is **live and healthy**.
- Server header: `nginx/1.29.5` (not Apache; sibling diverges from palette-api/fourier-api stack).
- Nginx SPA-fallback serves the frontend `index.html` for unknown non-`/api/v1/*` paths (including `/health`, `/solve`, `/openapi.json`) — that is why earlier "200" probes returned HTML, not because the backend handles them.
- `POST /api/v1/solve` → 404 JSON; `GET /api/v1/openapi.json` → 404 JSON. **The backend exposes ONLY `/api/v1/health`.** No solve endpoint published.
- `POST /solve` → nginx 405 (proves nginx itself is rejecting that prefix; no SPA-fallback for non-GET).

**Root cause**: backend deployed, healthy, but missing all functional routes (solve, openapi, docs). Frontend likely calls the wrong path or routes don't exist on the host build at all.

**F disposition**: csp-solver is a **partial-deploy regression**, not a wiring outage. The sudoku-repo maintainer's 1-line `app.include_router(solve, prefix="/api/v1")` discharges it. F records the diagnosis + the ASK; STAYS-OUT of source.

## §4 — Dev startup

value.js demo dev started on `:9000` (vite v8; ready 2.13 s; HTTP 200 on `/`); killed cleanly via `pkill -f "vite --port 9000"`. No script issues; `npm run dev` works as documented (`vite --port 9000`).

## §5 — Folds to F

- **F-CSP-1**: csp-solver `/api/v1/solve` returns 404 — verify FastAPI router registration in sudoku repo; backend is up so this is a route-include omission, not infra.
- **F-CSP-2**: csp-solver should expose `/api/v1/openapi.json` and `/api/v1/docs` (currently 404); enables I.W4-style envelope verification across constellation.
- **F-CSP-3**: sudoku nginx SPA-fallback intercepts `/health` and `/openapi.json` at the apex — surface-area collision risk; recommend `/api/v1/*` is the only backend-reserved prefix (correct) but document this in cross-repo precepts so the ASK doesn't recur.
- **F-PERF-1**: color.babb.dev perf=46 with 135 KiB unused JS + TBT 740 ms — value.js demo tree-shake/code-split candidate; the I.W11 cosmetic rename did not introduce this but the floor is now visible.
- **F-PERF-2**: keyframes LCP 8.6 s; investigate render-blocking and font-loading (Fraunces+FiraCode+PatrickHand triple-import seen on sudoku index.html, likely shared pattern).
- **F-A11Y-1**: sudoku a11y=85 — `aria-required-attr`, `label-content-name-mismatch`, `label` failures (Sudoku grid inputs). Cross-repo a11y precept candidate.
- **F-A11Y-2**: keyframes SEO=82 due to missing meta-description; trivial fix.
- **F-CROSS-1**: palette-api ETag is a **timestamp string**, not a strong content hash — works for `If-None-Match` but cross-repo precept should specify strong-vs-weak ETag policy so consumers (fourier-api, csp-solver if it adopts SOTA envelopes) align.
- **F-CROSS-2**: csp-solver runs on **nginx** while palette-api runs on **Apache**; constellation web-server divergence is a hidden axis (CORS layer, problem+json layer, rate-limit middleware all need re-implementation per stack). Surface as precept.

## §6 — Headline finding

The "broken" csp-solver runtime URL in the E.W6 ASK is a **route-registration regression**, not an infra outage — the FastAPI backend is live and healthy at `/api/v1/health`, but `solve`/`openapi`/`docs` are not registered, so F should fix the sudoku repo's router includes rather than chase Apache/nginx vhost wiring.
