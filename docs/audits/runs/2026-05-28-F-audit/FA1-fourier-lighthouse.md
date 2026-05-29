# FA1 — fourier-side Lighthouse + functional audit

**Lane**: FA1 of the 6-lane F-development workflow `wnjru1x3a`.
**Subject**: fourier-side production + dev — `fourier.babb.dev` SPA + `api.fourier.babb.dev` API.
**Tool budget**: 3 Lighthouse runs (headless desktop) + curl probes for the rest + 1 dev startup attempt.

## §1 — Lighthouse scores (3 runs, headless desktop)

| Route | perf | acc | bp | seo | top issues |
|---|---|---|---|---|---|
| `/` | 59 | 95 | 100 | 82 | `unused-javascript` (290 ms / 85 kB on index-veNzjUth.js), `button-name`, `bf-cache`, `cache-insight` (jsdelivr CM fonts), LCP=8.0 s, FCP=5.3 s, TTI=8.2 s, server=20 ms |
| `/visualize` | 64 | 95 | 100 | 82 | same + `label-content-name-mismatch`, LCP=7.2 s, FCP=4.8 s, TBT=83 ms |
| `/paper` | 60 | 95 | 100 | 82 | same + `forced-reflow-insight`, LCP=8.1 s, TTI=8.2 s, TBT=161 ms |

Universal misses: `meta-description`, `robots-txt`, `valid-source-maps`.

## §2 — Curl probes (5 prod + 3 api)

| URL | code | time (s) | content-type | key | finding |
|---|---|---|---|---|---|
| `fourier.babb.dev/` | 200 | 0.14 | text/html | CF, `cache-control: must-revalidate` | OK |
| `/visualize` | 200 | 0.12 | text/html | same | SPA fallback OK |
| `/paper` | 200 | 0.12 | text/html | same | SPA fallback OK |
| `/gallery` | 200 | 0.33 | text/html | same | OK (one-off slow) |
| `/equation` | 200 | 0.10 | text/html | same | OK |
| `api…/health` | **200 / text/html / 2759 B** | 0.11 | **text/html** | nginx, `Last-Modified 28 May 2026 01:46` | **BUG: serves SPA index.html, not JSON.** `/api/health` works (`{"status":"ok"}`) |
| `api…/api/visualizations` | 200 | 0.06 | application/json | `RateLimit-Limit: 10` `Remaining: 10` `Reset: 0` | static (see §4) |
| `api…/api/visualizations/__no-such__` | 400 | 0.35 | **application/problem+json** | URN `urn:contract:slug-invalid` | **problem+json envelope PASS** |

## §3 — Dev startup attempt

- Result: **STARTED** (vite 7.3.3; 703 ms boot; :3000 LISTEN).
- Probes: `/` 200 / 2719 B / 19 ms; `/paper` 200 / 2719 B / 69 ms — SPA fallback OK in dev.
- Warnings: `DEP0205 module.register()` deprecation (node 24/25; vite hook layer).
- Killed cleanly.

## §4 — Functional spot-check

- SPA fallback (`/paper`, `/visualize`, `/gallery`, `/equation`): **PASS** (all return index.html via CF Pages).
- 429 rate-limit envelope: **FAIL** — 25-burst on `/api/visualizations` returned 25× 200; `RateLimit-Remaining` stayed at 10; `Reset` stayed at 0. Either the limit is unbound on read endpoints or the header is hard-coded.
- problem+json on 400: **PASS** (correct content-type + URN type field).
- API root and `/health` (no `/api`) bleed through to a stale SPA index (28 May build) — likely an nginx try_files fallback on the api vhost.

## §5 — Folds to F (top items)

- **F-API-1 (HIGH)** — `api.fourier.babb.dev/{/, /health, /docs}` return SPA index.html (text/html, 2759 B) instead of 404/JSON. nginx try_files fallback on the API vhost is misconfigured — strip it; api vhost should 404 on non-`/api/*` paths (or expose `/docs` properly). Evidence: §2 row 6.
- **F-API-2 (HIGH)** — Rate-limit headers static (`RateLimit-Remaining: 10` after 25-burst; `Reset: 0`). Either the SlowAPI limiter isn't wired to list endpoints or it emits constants. Transposition opportunity: align with the per-endpoint limiter pattern.
- **F-A11Y-1 (MED)** — `button-name=0` across all 3 routes — header dropdown trigger (`#reka-dropdown-menu-trigger-v*`) + `.btn-pill` lack accessible names. Fix: `aria-label` on Reka dropdown trigger and theme/profile pill in `AppHeader.vue`. `/visualize` additionally fails `label-content-name-mismatch`.
- **F-PERF-1 (HIGH)** — LCP 7.2–8.1 s; FCP 4.8–5.3 s; server = 20 ms — entirely client-render cost. `unused-javascript` flags **85 kB / 290 ms wasted on `index-veNzjUth.js` (347 kB)** + 25 kB wasted on `Tooltip.vue` chunk. T-P1 split didn't reach far enough; route-level lazy-load for `/paper` and `/gallery` (Tooltip belongs in tooltip-using routes only).
- **F-PERF-2 (MED)** — `cache-insight` flags jsdelivr CM-Web-Fonts (`cmunti.woff`, `cmunrm.woff`, `cmunbx.woff`) — 40 kB wasted via short jsdelivr lifetime. Self-host CM fonts under `/assets/fonts/` + `Cache-Control: immutable`. Also kills the `https://cdn.jsdelivr.net` preconnect.
- **F-SEO-1 (LOW)** — every route lacks `<meta name="description">`; `/robots.txt` 404 or invalid. Add static `robots.txt` + per-route meta-description via Vue Router meta + `useHead`.
- **F-BFCACHE-1 (LOW)** — `bf-cache` fails with "Internal error / IgnoreEventAndEvict" on `/paper` — likely `unload` handler or open WebSocket. Audit for `beforeunload` / MathJax listeners.
- **F-DEV-1 (LOW)** — vite emits `DEP0205 module.register()` on boot — pin compatible `@vitejs/*` hook layer or document the warning is benign.

## §6 — Headline finding

The api vhost serves the **stale 28-May SPA index.html on `/`, `/health`, `/docs`** (text/html, 2759 B) instead of routing to FastAPI — a high-severity nginx fallback misconfig hiding behind a working `/api/*` path — while client-side perf scores 59–64 because route bundles (`index-veNzjUth.js` 347 kB + Tooltip chunk) ship 110 kB of unused JS to first paint, dragging LCP to 7–8 s on 20 ms-server pages.
