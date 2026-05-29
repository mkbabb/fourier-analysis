# F research-first audit — SYNTHESIS — hardened wave specs

**Lane**: SYNTHESIS of the F research-first workflow `w0ma5070c` (Wα 3 research lanes → Wχ 4 challenge probes → synthesis).
**Mode**: research-first; READ-ONLY (live probes + host SSH capture + source reads; no mutation). Tranche-development only.

---

I have the F.md charter context and all research inputs. Producing the binding synthesis.

```
## §0 — Headline: does the F charter SURVIVE the research?
**RATIFIED-WITH-DELTA.** The charter's five-thread structure, sequencing, and goal/completion criteria all hold. No thread is invalidated; the substrate forces five bounded deltas:

- **NO F.W1 thread-shape pivot.** P2 §4 is decisive: api.fourier.babb.dev/ returns `Server: nginx/1.29.5`, NO `cf-ray` → served DIRECT from ORIGIN (host Apache → Docker nginx → SPA). The stale 28-May SPA is the ORIGIN container nginx `location /` catch-all, NOT CF Pages. Only the apex `fourier.babb.dev` is CF-Pages-served (separate surface). F.W1 STAYS an origin `nginx/fourier.conf` edit + container recreate. CF config is irrelevant.
- **inv-21 DELTA (P1):** γ (W3) BUSTS the single-SSH-session bound — the gh token is INVALID, so the 5 webhook URLs cannot be flipped this session. SPLIT W3 → W3a (now, no operator) + W3b (operator-gated). α/β/δ PASS; ε is bounded-but-watch.
- **inv-22 DELTA (P2):** the `/docs`-returns-JSON sub-clause is wrong-shaped — `/docs` is a real Swagger-UI route (HTML by design). Revise the invariant to "no SPA-index served at API paths" (byte-identical-HTML-across-paths is the tell); add `/` → 404-JSON and `/openapi.json` → `.info.title` to the testable gate; scope enforced surface to {fourier, color}, NOT api.sudoku (external repo).
- **F-δ.b perf DELTA (P3):** NARROW to font-URL-pin-only; DEFER route-lazy + self-host as manufactured.
- **ε transposition DELTA (P4):** F-T-S2 REJECT (inverts E.W5); F-T-E1 reclassify ADD→keep static `(name,version)` list; F-T-N1 RATIFIED as doc-only ASK.

Net: **RATIFIED-WITH-DELTA** — five edits, no thread killed, no pivot of F.W1.

## §1 — Wα ratification verdicts
- **R1 vhost — RATIFIED. ORIGIN, not CF.** Fix = surgical `location =` exact-match blocks in `nginx/fourier.conf` (the TRACKED, full file; live container config is DRIFTED/stripped — predates it), routing `/openapi.json`, `/docs`, `/redoc`, `/health` to `$backend_upstream` BEFORE the SPA catch-all, PLUS a `location = /` → 404 problem+json to satisfy inv-22 check #1. Redeploy = bind-mounted config picked up by `docker compose -f docker-compose.prod.yml up -d --force-recreate nginx`. Host Apache vhost is NOT the fault. The same drift (zero `limit_req` in live nginx) is the F-API-2 secondary root cause.
- **R2 host-state — RATIFIED with split.** Ready NOW (no operator): hooks.json backup + 5 per-repo entry authoring + receiver reload (staged, NOT activated); speedtest teardown (vhost enabled, :8140 ProxyPass confirmed, live already 404); cron evidence (running, fired 12:00:01 UTC, gate met, capture-only); dangling images = 0 (capture-only). GATED on operator `gh auth login -h github.com`: gh re-auth → dry-run → `--apply` URL flip → per-repo hook tests → dispatcher `rm` + value.js arm retirement. Binding rollback anchor: dispatcher = 5-arm latent-broken value.js arm; hooks.json single multiplex `deploy` (HMAC `89eadc1d…a5c070`).
- **R3 rate-limit + cache — RATIFIED. W1 needs ONE design call; W2 mechanical.** F-API-2 root cause is finer than the charter's "static constant" framing: it is an enforce/report SPLIT — `RateLimitHeaderMiddleware` calls read-only `snapshot()`, while recording `check()` is wired only on POST/PATCH/DELETE via `Depends(require_*_limit)`. Read routes have NO limiter dependency → bucket never incremented → honest empty-bucket report (Remaining=10, Reset=0). Fix shape (a) [RECOMMENDED]: fuse recording into the middleware (value.js `rate-limit.ts:91-116` parity) — the single enforce+report path. F.W2 cache is fully mechanical; FA5 §2 diff confirmed correct.

## §2 — Wχ probe verdicts + folded refinements
- **P1 inv-21 — SPLIT at γ (W3).** Single-session bust (INVALID gh token forces a second operator-gated window). Fold: W3 → **W3a** (host-ops single-window, no operator: backup/author/reload + speedtest teardown + cron/dangling capture) + **W3b** (operator-gated cutover: re-auth → URL flip → hook tests → dispatcher `rm` + value.js arm retire). α/β/δ PASS; ε watch (F-T-N1 paired demo must stay minimal, not a co-refactor).
- **P2 inv-22 — NEEDS-REVISION, no F.W1 thread-pivot.** Relax `/docs` to Swagger-HTML-OR-404-JSON; real invariant = "no SPA-index at API paths." Add `/` → 404/JSON + `/openapi.json` → `.info.title` to the gate. Scope to {fourier, color}; sudoku is documentary precedent only. Stale SPA is ORIGIN-served — F.W1 holds.
- **P3 perf — NARROW to font-pin-only; DEFER the rest.** Route-lazy pass is manufactured (app already fully lazy `() => import()`; the 85 kB is irreducible shell/bootstrap; LCP 7-8s is a CF cold-edge/font-fetch ARTIFACT, not bundle). Self-host is net ADD (3 git binaries + cache config + no FOUT win). The ONE defensible action: pin `cm-web-fonts@latest` → `@<sha>`, keep preconnect. KISS sign-off WITHHELD for W5-as-scoped; APPROVE only the one-liner.
- **P4 transpositions — 2 of 3 NEED REVISION.** F-T-N1 RATIFIED (doc-only ASK; inv-16 preserved; no fourier-F commit touches `value.js/**`). F-T-E1 reclassify ADD → KEEP the static `(name, version)` list (the version column is load-bearing idempotency; `MIGRATION_VERSION` does not exist in any module — auto-discover would destroy version-bump intent). F-T-S2 REJECT (not `export`ed but E.W5 ALREADY collapsed the 4 helpers into one `coreFetch` core, retaining `apiFetchWithETag`/`adminFetch` as deliberate named pass-throughs; inlining fans 2 helpers into 20 sites = net +LOC, lost signatures, reverses a shipped REDUCE).

## §3 — HARDENED wave specs (W1-W8)

**W1 (α — API-vhost + rate-limit) — GREEN-to-execute.** Two surfaces, one PR.
1. *vhost* — Edit `nginx/fourier.conf`. Add BEFORE the `location /` SPA catch-all:
   `location = /openapi.json { proxy_pass http://$backend_upstream; proxy_set_header Host $host; }`, same for `= /docs`, `= /redoc`; `location = /health { default_type application/json; return 200 '{"status":"ok"}'; }`; AND `location = / { default_type application/problem+json; return 404 '{"type":"about:blank","title":"Not Found","status":404}'; }` (REQUIRED for inv-22 check #1). Redeploy: `cd /var/www/fourier-analysis && git pull && docker compose -f docker-compose.prod.yml up -d --force-recreate nginx`.
2. *rate-limit* — shape (a): make `RateLimitHeaderMiddleware.dispatch` (rate_limiter.py:204-214) call `limiter.check()` (record+enforce, catch 429 → Retry-After) instead of read-only `snapshot()`; reference `value.js/api/src/.../rate-limit.ts:91-116`. ~15 LOC.
3. Gate: the 5 inv-22 curls (per R1 §6, INCLUDING the `location = /` 404-JSON); 25-burst on `/api/visualizations` returns ≥1 429 with `RateLimit-Remaining: 0`. Rollback: `git revert <sha> && docker compose ... up -d --force-recreate nginx` (container-local, sub-second, no host-Apache/TLS touch).

**W2 (β — compute-cache-symmetry) — GREEN-to-execute. Mechanical.** Per R3 §2: (1) `cache_key(contour_hash, params: dict)` → payload `f"{contour_hash}|{json.dumps(params, sort_keys=True, separators=(',',':'))}|{COMPUTE_VERSION}"` (COMPUTE_VERSION stays appended → cache-bust intact); (2) `lookup`/`store` take same dict; (3) epicycles route `params={"n_harmonics":..,"n_points":..}`; (4) `compute_bases` (contours.py:56-67) wire lookup/store with `params={"max_degree":..,"n_points":..,"levels":..,"n_eval":..}` (all JSON-serializable; collision-free); (5) rename `_CACHE_COLL` + database.py:70-76 `epicycle_cache` → `compute_cache` TTL-index block — **add a one-line cell note: bare rename abandons old docs intentionally (TTL ≤7d + fail-open absorbs gap, no migration)**; (6) add `logger.info("compute_cache HIT/MISS ...")`. Gate: `db.compute_cache.countDocuments() > 0`; 2× CACHE_HIT lines on repeated identical `compute_bases`; old 3-field signature gone.

**W3 (γ) — SPLIT. W3a GREEN-to-execute; W3b OPERATOR-GATED.**
- **W3a (now, no operator):** backup `dispatch.sh.f-w3.bak` + `hooks.json.f-w3.bak`; author 5 per-repo `hooks.json` entries (HMAC-gated, `ref==refs/heads/master`); reload receiver — STAGED, NOT activated (dispatcher NOT deleted). `a2dissite speedtest.conf` (:8140 ProxyPass confirmed dead, live 404). Capture `crontab -l | grep conformance` + `conformance-probe.log` tail (running, 12/12 PASS, fired 12:00:01 UTC). Capture dangling images = 0. Persist `receipts/F-W3a.json`. Single-SSH receipt → inv-21 PASS.
- **W3b (gated on `gh auth login -h github.com`):** re-auth → `update-webhook-urls.sh` dry-run → `--apply` flip 5 URLs to `deploy.babb.dev/hooks/<repo>` → per-repo hook tests → THEN `rm /opt/deploy/scripts/dispatch.sh` + value.js latent-broken arm dies with it. Persist `receipts/F-W3b.json`. inv-21 PASS (own single-window).
- HARD ordering: dispatcher MUST NOT be deleted until 5 URLs flipped (else webhooks 404).

**W4 (δ — a11y/SEO) — GREEN-to-execute.** `button-name` on AppHeader Reka dropdown + `.btn-pill` (add `aria-label`); `label-content-name-mismatch` on `/visualize`; add `meta-description` + `robots.txt`. Gate: axe-core/Lighthouse `button-name: 0` across `/`, `/visualize`, `/paper`, `/gallery`, `/equation`; meta + robots present. ~150-300 LOC frontend-only, watch sprawl. inv-21 PASS.

**W5 (δ — perf) — NARROWED. GREEN only as font-pin.** Pin `cm-web-fonts@latest` → `@<immutable-sha>` in index.html (lines 12,15-17,31), keep preconnect, NO new files. DEFER route-lazy (manufactured) + self-host (net ADD). REVISE the completion gate (F.md L25): drop "`unused-javascript` < 50 kB" — it chases a metric artifact; replace with "font URL pinned to immutable ref + preconnect retained."

**W6/W7/W8 (ε) — partially GREEN.**
- **C4** `ORT_LOGGING_LEVEL=3` 1-liner — GREEN. **C9** invariant numbering reconciliation A-E + precepts — GREEN. **N2** CF wildcard narrow — GREEN.
- **F-T-N1** (drop legacy `status` from `FormattedPalette`) — RATIFIED as **doc-only ASK**: fourier-F authors the coordination note citing `rate-limit.ts` reference; value.js maintainer commits the source. NO fourier-F commit touches `value.js/**` (inv-16). Keep minimal — do NOT co-refactor.
- **F-T-E1** (auto-discover `migrate_*.py`) — **REVISED to ADD → REJECT the auto-discover; KEEP the explicit static `MIGRATIONS` list** with `(name, version)`. The version column is load-bearing idempotency (unique index + `_is_completed` key on both). `MIGRATION_VERSION` does not exist in any module — glob+introspect would destroy version-bump intent. NO-OP on the list.
- **F-T-S2** (inline `apiFetchWithETag`/`adminFetch`) — **REJECT.** E.W5 already collapsed to `coreFetch`; the pass-throughs are deliberate. Inlining = +LOC, reverses shipped REDUCE. Retain as-is.
- **W9 migration GREEN-verified** — trigger one real migration → `migrations` collection ≥1 entry `result: SUCCESS`.

## §4 — Charter revisions to fold
1. **F.md §3 wave schedule** — split W3 → W3a (now) + W3b (operator-gated); record the hard ordering (no dispatcher delete pre-URL-flip).
2. **F.md L57 inv-22** — (a) relax `/docs` to "Swagger-HTML-OR-404-JSON; the real invariant is no SPA-index at API paths — byte-identical-HTML-across-paths is the tell"; (b) testable gate adds `curl -sI <host>/ → 404/problem+json` and `curl <host>/openapi.json | jq .info.title`; (c) scope enforced surface to {fourier, color}; api.sudoku is documentary precedent ONLY (external repo, no fourier lever).
3. **F.md L14 α** — correct "static constants" → "read-path uncounted (enforce/report split)"; cite `rate-limit.ts:91-116` as reference impl.
4. **F.md L25 δ completion gate** — drop the `unused-javascript < 50 kB` clause; replace with "CM font URL pinned to immutable ref, preconnect retained." DEFER F-PERF-1 (route-lazy) + F-PERF-2 (self-host) as manufactured.
5. **F.md L18 ε** — reclassify F-T-E1 as KEEP-static-list (auto-discover REJECTED); F-T-S2 as REJECT/retain-pass-throughs; F-T-N1 confirmed doc-only ASK. Add the W2 collection-rename intentional-abandon note.
6. **PROGRESS.md** — register the W3 split and the four ε transposition dispositions so the ledger matches reality before execution.

## §5 — Execution readiness verdict
- **GREEN-to-execute on user authorization:** W1 (α, origin nginx + rate-limit fuse), W2 (β, mechanical cache refactor), **W3a** (host-ops single window), W4 (δ a11y/SEO), W5 (NARROWED to font-pin), W6/W7/W8-ε minus the rejected transpositions (C4/C9/N2 + F-T-N1 doc-ASK + W9 real-migration trigger).
- **GATED:** **W3b** — blocked on out-of-band operator `gh auth login -h github.com`; cannot be scripted away. Until then the dispatcher MUST remain and the value.js arm stays latent-broken-but-present (deleting it 404s webhooks).
- **REJECTED (do not execute):** F-T-E1 auto-discover (keep static list), F-T-S2 inline (retain pass-throughs), F-PERF-1 route-lazy, F-PERF-2 self-host.

## §6 — Headline
The F charter SURVIVES research as RATIFIED-WITH-DELTA: no thread is killed and F.W1 does NOT pivot — P2 proved the stale SPA is ORIGIN-served (`nginx/1.29.5`, no `cf-ray`), not CF Pages, so the surgical `location =` fix in the tracked `nginx/fourier.conf` plus a `location = /` 404-JSON block holds, and the rate-limit defect is a finer enforce/report split (read routes uncounted) fixed by fusing `check()` into the header middleware à la value.js. Five deltas bind: W3 SPLITS at the INVALID-gh-token operator boundary into W3a (executable now) + W3b (gated on re-auth, dispatcher must not be deleted until the 5 webhook URLs flip); inv-22 relaxes `/docs` to Swagger-HTML-OR-404-JSON and scopes to {fourier, color}; F-δ.b NARROWS to a single font-URL pin (route-lazy + self-host are manufactured against an already-lazy app and an artifact LCP); and two of three transpositions are rejected (F-T-E1 auto-discover destroys load-bearing version idempotency, F-T-S2 inline reverses E.W5's shipped collapse) leaving only F-T-N1 as a clean doc-only ASK. Net: W1/W2/W3a/W4/W5(narrowed)/W6-W8(minus rejects) are GREEN-to-execute on authorization; W3b alone remains operator-gated.
```
