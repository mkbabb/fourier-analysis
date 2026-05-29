# GA1 — F-execution correctness + prod/dev functional audit

**Lane**: GA1 (of 6). **Mode**: READ-ONLY audit + live probes. **Repo HEAD**: `d34d21b`.
**Date**: 2026-05-29. **Mandate**: gestalt transpositions for elegance/simplicity/perf; NO legacy; NO workarounds.

Probed: source diffs of all 12 F commits; live `fourier.babb.dev` + `api.fourier.babb.dev`; `pytest` (214/214); `vue-tsc -b` (green); `npm run build` (green); T7 conformance probe (12/12 PASS).

---

## TOP-LINE: the headline finding GA1 surfaces

**F's δ thread (a11y + SEO + perf) is GREEN-in-source but STALE-on-prod. The entire frontend surface of F never deployed.** The webhook auto-deploy F heroically restored drives ONLY the API (origin Apache→nginx→FastAPI Docker). The SPA lives on **CF Pages**, deployed by a **separate manual `wrangler pages deploy`** that fourier does not even carry in its own `scripts/` (it exists only as a template in `mkbabb/deploy:cf/pages-deploy.sh`). Nobody ran it after `9bd80b3`. F/FINAL §1 marks the δ a11y/SEO + font-pin gates **PASS** — they are PASS-in-source, NOT PASS-live. This is a structural deploy gap, not a typo.

---

## Findings

### 1. [REGRESSION] Prod SPA is stale — F's entire δ surface never shipped
**Evidence (live probes vs source):**
- Font pin: source `web/index.html:18` = `cm-web-fonts@333f55ec…` (immutable SHA, the F-δ perf gate). **Prod serves `cm-web-fonts@latest`** (`curl https://fourier.babb.dev | grep cm-web-fonts` → `@latest`). The pin gate is NOT live.
- `robots.txt`: source `web/public/robots.txt` is 103 B (`User-agent: * / Allow: /`). **Prod `/robots.txt` is 4497 B** — Cloudflare's auto-injected content-signals file, i.e. CF Pages has NO deployed `robots.txt`. F's robots.txt never shipped.
- `<meta name="description">`: present at `web/index.html` source; **absent on prod** (`curl … | grep 'meta name="description"'` → empty). The SEO gate is NOT live.
- Bundle hash: prod entry `index-veNzjUth.js` ≠ fresh-build `index-BpY4ol9I.js`. Prod is built from a pre-`9bd80b3` SHA.

**Gestalt recommendation (G scope)**: the API auto-deploy and the SPA deploy are two disjoint paths; F closed one and left the other manual+undeployed. G must adopt `cf/pages-deploy.sh` into fourier's `scripts/` and wire it to the **same webhook trigger** (or a CF Pages Git-integration build) so a `git push` ships BOTH halves atomically. Until then every "frontend" gate in every tranche is unverifiable against prod. This is the single most important G item.

### 2. [LEGACY] `like_limiter` + `"/like" in path` matcher is dead code
**Evidence**: `api/services/rate_limiter.py:155` (`like_limiter`) and `:184` (`if "/like" in path: return like_limiter`). There is **no like route anywhere in the live API** — `grep -rn '/like'` across `api/` returns only this matcher line. The like endpoint existed in B (`a5da046`/`7315ba6`) but was removed in the B-convergence to the unified visualization entity. F's `fa9cf75` carried the limiter + matcher forward against a route that no longer exists.
**Gestalt recommendation**: delete `like_limiter` and the `/like` branch. This violates the mandate's NO-legacy invariant (inv-20) — F's own §6 claims the refactor "REDUCED moving parts," yet it preserved a dead budget. Trivial, high-confidence cleanup for G.

### 3. [RESIDUAL] [TRANSPOSITION-CANDIDATE] Rate limiter ignores XFF entirely — the proxy-IP bucket is worse than documented
**Evidence**: the middleware keys on `request.client.host` (`rate_limiter.py:227`) — the raw socket peer. It does **NOT** consult `X-Forwarded-For`/`X-Real-IP`, even though nginx sets both (`nginx/fourier.conf:23-24`) and a fully-correct resolver already exists at `api/dependencies.py:182` (`get_client_ip`, used by sessions/admin/visualizations). So the limiter and the rest of the app disagree on "who the client is." Live proof: `RateLimit-Remaining` was `1196` and `1198` on two *different* endpoints in the same window — one shared global bucket, exactly as feared. F's residual note (`rate_limiter.py:143-152`) frames this as "needs nginx real_ip + XFF resolver" — but the app **already has** the XFF resolver; the middleware simply doesn't call it.
**Gestalt recommendation**: the per-client fix is NOT a future infra wave — it is one line: have the middleware call the existing `get_client_ip(request)` instead of `request.client.host`. The real residual is only the *trust* question (XFF is spoofable if the edge doesn't overwrite it); nginx already overwrites via `proxy_set_header X-Real-IP $remote_addr` + `$proxy_add_x_forwarded_for`, so taking the LAST hop (`get_client_ip` takes `split(",")[-1]`) is the trusted-proxy value. G should reconcile the two IP paths into one — this is the clean transposition that turns the named residual GREEN, and `read_limiter=1200` can then drop back to a real per-client budget. The 1200/min "global headroom" widening (`9ad3625`) is a workaround that this transposition retires.

### 4. [CORRECT] OPTIONS bypass is sound
**Evidence**: `rate_limiter.py:223` returns early for `OPTIONS` before `limiter.check()`. CORS preflights are not user actions; counting them would double-charge the write budget (preflight + POST). The reasoning in the comment is correct and the behavior matches.

### 5. [CORRECT] Middleware-as-single-enforce-point is a genuine gestalt, not a half-measure
**Evidence**: `fa9cf75` removed all per-route `Depends(require_*_limit)` + inline `.check()` across 5 routers; `_limiter_for_path` (`rate_limiter.py:170`) is the single dispatch and `RateLimitHeaderMiddleware.dispatch` is the single record+enforce+report site. Verified no router retains a `.check()`/`require_*_limit` (`grep` clean). Enforce and the RFC-9239 headers are now one honest computation (`snapshot` post-`check`). This is the correct consolidation. Surface coverage verified: admin (`/api/admin` prefix ✓), login (`/api/sessions/login` ✓ — route is `prefix=/api/sessions` + `/login`), compute (matches nginx `api_compute` regex for equations/compute|simplify + `/compute/` + extract-contour ✓), read (GET/HEAD), write (everything else). **No live surface lost its limit** except the now-nonexistent like route (finding 2).

### 6. [CORRECT] inv-22 nginx surgical blocks are live and correct
**Evidence**: `nginx/fourier.conf:42-47` `location =` exact-match blocks precede the SPA catch-all. Live: `/`→404 `application/problem+json`; `/health`→`{"status":"ok"}`; `/docs`→1019 B Swagger (not the 2759 B SPA); `/openapi.json`→`"Fourier Analysis API"` 34 KB; `/api/health`→ok; `/api/visualizations`→200 JSON. All correct.
**[TRANSPOSITION-CANDIDATE]**: F/FINAL itself flags the cleaner long-term — API on a dedicated container with NO co-located SPA — as out-of-scope. The current shape (surgical `location=` + shared SPA catch-all on one container) is correct but *fragile*: it is an allowlist of doc paths that must be maintained by hand as FastAPI's root surface evolves (e.g. a future `/metrics`, `/.well-known/*` would silently fall to the SPA). G should weigh splitting the API host to its own upstream with the SPA fully absent — then the catch-all `/`→404 is the rule, not an exception list. (Note: since the API and SPA already live on *different* origins — `api.fourier.babb.dev` vs `fourier.babb.dev` CF Pages — the co-located `frontend` upstream in this nginx may itself be vestigial; G should verify whether the `location /` SPA proxy on the API vhost serves any live traffic at all, or is dead config.)

### 7. [CORRECT] compute-cache rename + parametric key is clean
**Evidence**: `compute_cache.py` — `cache_key(contour_hash, params: dict)` with canonical JSON (`sort_keys=True`, compact separators) + `COMPUTE_VERSION` (`:55-63`). Both compute paths wired symmetrically (`contours.py:39-52` epicycles, `:59-77` bases — bases was previously uncached). Fail-open on Mongo error (`:79-82`, `:110-113`). The bare `epicycle_cache`→`compute_cache` rename abandoning old docs is sound: 7-day TTL (`database.py:71-78`) + fail-open mean the worst case is one cold warm-up, never a wrong result. The `database.py:74-78` `OperationFailure`→drop+recreate handles a TTL-value change on an existing index idempotently. COMPUTE_VERSION provides correct cache-busting. No legacy left.
**Minor [RESIDUAL]**: `datetime.utcnow()` (`compute_cache.py:105`) is deprecated in 3.12+; cosmetic, project-wide (also in the migration runner). Worth a sweep in G but not load-bearing.

### 8. [CORRECT] W8 migration runner subprocess isolation is the RIGHT call, not a workaround
**Evidence**: `run_pending_migrations.py:169-173` runs each migration as `subprocess.run([sys.executable, "-m", module_path])`. The comment (`:157-168`) is honest: each `migrate_*.py main()` calls `asyncio.run()`, which cannot nest inside the runner's own running loop. A subprocess gives each migration its own event loop + Mongo client (the module contract) AND process-level fault isolation (one migration's import error can't poison the runner). This is idiomatic, not a hack. `settings.mongo_uri` reuse (`:137`) correctly honors inv-11 one-identity. Idempotency via unique `(name, version)` + `_is_completed` SKIP (`:80-82, 148`) is correct. `deploy_run_id` ties runs to deploys.
**[TRANSPOSITION-CANDIDATE]** (mild): the runner is `python -m run_pending_migrations` which itself spawns `python -m migrate_X` — a process that spawns processes. Defensible for isolation, but G could consider whether the `migrate_*.py` modules should expose an async `run(db)` the runner awaits directly (sharing one loop + client), reserving subprocess only if true isolation is required. Lower priority — current form is correct and the cost (a few subprocess spawns once per deploy) is negligible.

### 9. [CORRECT] deploy-hook inv-22-aware gate is sound and self-reinforcing
**Evidence**: `scripts/deploy-hook.sh:74-88` `health_gate` requires BOTH `/api/health`→`"ok"` AND `/`→`404`. The `/`→404 assertion co-enforces inv-22 on every deploy: a stale SPA-fallback regression on the API host now fails the gate and rolls back (`:80`). `backend` service target fix (`:162`) + `uv run --no-sync python` interpreter (`:163`) + `settings.mongo_uri` are all correct. Dirty-tree-fail-loud (`:95-104`), no `|| echo` swallow, flock serialization (`:191-192`), rollback-rebuild-regate (`:177-185`) are all robust. The one soft spot: migration non-zero is logged as WARNING and the deploy STAYS GREEN (`:166`) — defensible (the live container runs the at-rest schema), but a silently-failing migration could accumulate unnoticed across deploys. G should ensure migration failures surface to an alert, not just the deploy log.

### 10. [CORRECT] T7 / pytest / build all green at HEAD
214/214 pytest; `vue-tsc -b` exit 0; `npm run build` exit 0 (PaperView correctly route-lazy as a 471 KB separate chunk, NOT in the entry bundle); T7 conformance probe 12/12 PASS. No regression in the verifiable gates.

### 11. [RESIDUAL] Perf/LCP — font pin is the right call BUT prod can't benefit until finding 1 is fixed; render-blocking Google Fonts remain
**Evidence**: prod TTFB is excellent (HTML ~50-100 ms, font CDN ~65 ms, all assets CF-edge-served). The LCP-7-8s story F narrowed is NOT a server/TTFB problem. Two real signals remain: (a) the font pin that would let the browser cache immutably is **not deployed** (finding 1) — prod still hits `@latest` which jsdelivr may revalidate; (b) `web/index.html:30-31` loads two **render-blocking** Google Fonts `css2` stylesheets (Fraunces + Fira Code) from a 3rd origin, un-pinned, in the critical path. The font-pin-to-SHA was the right *direction*; the self-host option F deferred is actually the cleaner end-state for ALL fonts (eliminates 2 cross-origin round-trips + the render-blocking css2).
**Gestalt recommendation**: G should (1) fix the deploy gap so the pin takes effect, then (2) reconsider self-hosting the CM + Fraunces + Fira subsets into `web/public` (or `@font-face` with `font-display: swap` + a Vite-bundled woff2) — one origin, zero render-block, immutable hashing for free via Vite's content hashing. F's "self-host DEFERRED-as-manufactured" verdict should be revisited once finding 1 unblocks measurement.

---

## Verdict
F's **backend** threads (α enforce-consolidation, β cache, ε migration, γ deploy-hook, inv-22 nginx) are genuinely correct and live — verified by probe and source. F's **frontend** thread (δ) is correct in source but **never reached prod** (finding 1). Two cleanups are mandated by the NO-legacy directive: dead `like_limiter` (finding 2) and the un-reconciled IP path (finding 3). The strongest G transpositions are: **(A) atomic SPA+API deploy** so frontend gates become live-verifiable; **(B) one-line `get_client_ip` reconciliation** that retires the rate-limit residual and the 1200 headroom workaround; **(C)** weigh a dedicated API host to make inv-22 the rule, not a hand-maintained allowlist.
