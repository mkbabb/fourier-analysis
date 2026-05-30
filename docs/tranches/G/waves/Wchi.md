# G.Wχ — Challenge (3 READ-ONLY probes)

**Status**: CLOSED
**Agents**: 3 (parallel, READ-ONLY; mutated nothing)

## P1 — inv-26 single-contract-source → **RATIFIED: (B) hand-types-canonical**

- `web/src/lib/api-schema.d.ts` (2287 lines / 65 KB, openapi-typescript generated) — imported by **ZERO** files (`grep -rn "from .*api-schema" web/src/` → empty; the only 2 string hits are inside its own header). The literal inv-15 "library nobody calls."
- `web/src/lib/types.ts` (hand-written) — imported by **30** files. The real source.
- `web/src/lib/api.ts` — inline-declares 6 contract types (`Visibility`, `Visualization`, `VisualizationCreate`, `VisualizationPatch`, `VisualizationListResponse`, `WithETag`; lines 27/29/53/68/77/88), consumed at `gallery.ts:4`.
- Generator `web/scripts/gen-types.sh` runs from a **committed snapshot** `api/openapi.json` (frozen at E.W8 `667f677`), NOT wired into `build`/`dev`/Docker/CI → permanently stale.
- **Killer**: the generated schema has `VisualizationCreate`/`VisualizationUpdate` but **NO `Visualization` response schema** — every visualization route is typed `-> Response` with no `response_model=`, so FastAPI emits request-body schemas only. Codegen literally cannot produce the type consumers most need. (A) codegen-canonical would force a 7-route backend refactor purely to feed a regen step nobody runs — opposite of the mandate.
- **Migration (W2)**: delete `api-schema.d.ts` + `gen-types.sh` + the `openapi-typescript` devDep (+ orphan `api/openapi.json`); lift the 6 types into `types.ts`; `api.ts` re-exports them (the 14 `@/lib/api` consumers stay unchanged). Proof-grep: no `api-schema` import, no `openapi-typescript`/`gen-types` reference, no shadow inline decls. `vue-tsc -b` stays green (no import edge severed).
- **Flagged (non-blocking)**: a 4th hand-type island `web/src/lib/equation/types.ts` (10 importers) — a separate parallel hand-source; note in the close, do not fold (out of the 3 named sources).

## P2 — β.2 one-IP-identity → **FINALIZED: nginx sole rewriter, X-Real-IP canonical, budget 180/min**

- **Double-rewriter resolved**: DROP uvicorn `--proxy-headers --forwarded-allow-ips` (`api/Dockerfile:33`); nginx `real_ip` becomes the sole authority. One trust boundary, not two (KISS/inv-12).
- **nginx `nginx/fourier.conf`**: add `set_real_ip_from 172.25.0.0/16; set_real_ip_from 127.0.0.1; real_ip_header X-Forwarded-For; real_ip_recursive on;` before the zones; both `location` blocks keep `X-Real-IP $remote_addr` (now the real client) and change `X-Forwarded-For $proxy_add_x_forwarded_for` → `$remote_addr` (collapse to the single trusted value).
- **`get_client_ip` (`api/dependencies.py:182-193`)**: read `X-Real-IP` FIRST, fall back to `request.client.host`, drop the buggy `XFF.split(",")[-1]` branch (which returned the gateway). All **11 callers verified safe** (each pipes through `hash_ip()` for forensic/idempotency/audit; none parse or CIDR-match the raw IP) — they're all silently mis-keyed to the gateway TODAY and get corrected.
- **rate_limiter.py:227**: `request.client.host` → `get_client_ip(request)` (import from dependencies). Enforcement + forensics now resolve the SAME real client = the one-identity goal.
- **Budget**: `read_limiter` 1200 (global) → **180/min per client** (revised UP from Lane B's 60-120). Evidence: no polling anywhere (rAF animation is client-side, zero server calls); compute debounced 1s; the binding read burst is the gallery render (1 list + ≤20 thumbnail GETs ≈ ~21/burst; a 2-page scroll + a couple modals ≈ 60-80 GET/min) → 180 gives >2× headroom while being a real per-client cap bots can't dodge. Retires the 1200 global-headroom workaround + its DEPLOYMENT NOTE comment (the W0-deferred misleading comment is rewritten HERE).
- **limit_req zones (`fourier.conf:3-5`)**: under `real_ip`, `$binary_remote_addr` flips to real-client → KEEP `api_general` 30r/s burst=50; **REVISE `api_compute` burst 3→5** (one legit compute cycle fires `extract-contour` + `computeBases` in parallel + a 2nd debounced cycle ~1s later → up to 4 near-simultaneous compute hits; burst=3 would 503 a legit user). Keep `api_upload`.
- **Honest residual (book in W3 + close)**: `WORKERS=4` (`api/Dockerfile`) ⇒ the in-memory `SlidingWindowLimiter` is per-process → effective per-client budget is up to 4× the configured number. True single-bucket enforcement needs a shared store (Redis) or `WORKERS=1`; out of β.2 scope, named so the "per-client budget" claim stays honest.

## P3 — δ self-host blast radius → **SCOPED**

- 3 LCP-path render-blocking origins (`web/index.html` head): #1 jsdelivr KaTeX CSS (npm; pinned 0.16.21 while node_modules has 0.16.47 — drift); #2 jsdelivr CM web fonts (gh `cm-web-fonts@333f55e…`, the `--font-sans` body face); #3 Google Fonts (Fraunces display + Fira Code mono). No CSP anywhere; no SRI on any link.
- **KaTeX (#1)** → bundler-native `import "katex/dist/katex.min.css"` in `web/src/main.ts`; Vite fingerprints + emits the 20 woff2 (~286 KB full, ~76 KB first-render subset) same-origin; **fixes the pin drift**; zero git binaries; delete the jsdelivr `<link>`.
- **CM (#2)** → commit ~4-6 woff2 into `web/public/fonts/Serif/` + a local `web/public/fonts.css` (must transcribe the upstream `@font-face` family map EXACTLY at W5 — the one real correctness risk; else `--font-sans` falls back to Georgia). Repoint the 3 preloads, drop the jsdelivr preconnect.
- **Google (#3)** → vendor Fraunces + Fira Code woff2 into `web/public/fonts/` + `@font-face` in `fonts.css`; delete the 2 googleapis stylesheets + both preconnects.
- **`vite.config.ts`: NO change** (public/ copies verbatim; katex already in `manualChunks vendor-math`). No new plugin (`vite-plugin-static-copy` rejected as gold-plating).
- **Lighthouse**: dev via `npm run build && npm run preview` (:4173, production-built assets) + `npx lighthouse http://localhost:4173/ --preset=desktop --output json --output html --output-path docs/tranches/G/receipts/lh-dev-self-host`; prod via the same against `https://fourier.babb.dev/` **only AFTER δ self-host ships + the CF publish is confirmed live** (else it measures the stale CDN SPA). Pass criterion: the prod Lighthouse network trace shows **zero** requests to jsdelivr/googleapis/gstatic.
- **Bonus (book separately, optional)**: a CF `_headers` CSP `font-src 'self'; style-src 'self'` becomes possible once 3→0 third-party font origins — a real hardening win, out of δ's bounded scope.

## Hardened schedule consequences
- **W1↔W5 sequencing**: W1 wires the GH Actions auto-deploy path (inv-25) + ships the current δ source (font SHA, robots, meta, a11y) → live-verify. Subsequent waves auto-deploy on each `web/**` master push. W5's self-host SUPERSEDES the jsdelivr CM pin (final prod state = same-origin); prod Lighthouse + final δ verification happen after W5 auto-ships. The deploy workflow gets a `paths: web/**` filter so backend-only waves (β.2, ε) don't pointlessly redeploy the SPA.
- **W0 misleading-comment**: confirmed folded into W3 (the read_limiter rationale block is rewritten there).
- All decisions inv-21/inv-25/inv-26 KISS-certified.
