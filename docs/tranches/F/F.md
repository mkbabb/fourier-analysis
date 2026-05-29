# F — post-cohort hygiene — API-vhost-correctness + compute-cache-symmetry + operator-window + UX-polish + chronic discharge

**Tranche letter**: F — fourier-analysis's post-cohort hygiene tranche; successor to E (CRUD cohesion completion + consumer hardening + arch transpositions + test integrity + ops hygiene) which closed Scenario A paired with value.js-I.
**Predecessor close**: E — `docs/tranches/E/FINAL.md` at fourier HEAD `f422b52`; value.js-I — `value.js/docs/tranches/I/FINAL.md` at value.js HEAD `2fefe5e`. T7 12/12 PASS reproducible.
**Cohort**: **single repo.** value.js-I closed Scenario A; the cohort handshake is discharged. No peer repo required for F.
**Mode**: **research-first** for α (nginx vhost archaeology before touching live config) and γ (host-side capture-before-mutate); **direct** for β (compute-cache-symmetry — diff is mechanical), δ (UX polish — observation-bounded), ε (chronic + transpositions — surgical).
**Open**: TBD (after user authorises F.W0).
**Authored**: 2026-05-28 (the 6-lane F-development audit — `FA1-FA6.md` + `SYNTHESIS.md` — `docs/audits/runs/2026-05-28-F-audit/`).

## §0 — Goal criterion and completion criterion (paired)

**Goal criterion (the aim).** Land **six threads** honestly to discharge the post-cohort hygiene surface E left + the load-bearing prod regression FA1 surfaced + the constellation deploy-process normalization (the 2026-05-28 directive). *(α–ε were the original five; ζ added 2026-05-28.)*

- **α — API-vhost-correctness**: `api.fourier.babb.dev/{/, /health, /docs, /openapi.json}` returns JSON (problem+json on error) — never an SPA index.html; rate-limit middleware emits dynamic `RateLimit-*` headers. **[Wα-DELTA per Wα-R1+R3]** the regression is ORIGIN-served (host Apache → Docker `nginx:alpine` gateway → SPA catch-all; `Server: nginx/1.29.5`, no `cf-ray`), NOT CF Pages — the fix is a surgical `location =` exact-match set in the tracked `nginx/fourier.conf` + container recreate. The rate-limit defect is NOT "static constants" but an **enforce/report split** (read routes carry no limiter dependency → bucket uncounted → `snapshot()` honestly reports the empty bucket); the fix fuses `check()` into the header middleware à la value.js `rate-limit.ts:91-116`.
- **β — compute-cache-symmetry**: `compute_cache.py` keys on `params: dict` (canonical-JSON sorted) instead of the 3-field positional contract; `compute_bases` wires through the same cache; `db.epicycle_cache` renames to `db.compute_cache`; hit-rate logging emits on cache-hit (closes E3 instrumentation residual).
- **γ — operator-window-consolidation**: single SSH session discharges N1 (value.js dispatcher arm DELETE) + E1 (T-S3 host-flip via `scripts/update-webhook-urls.sh --apply`) + dead `:8140` speedtest vhost teardown + host-cron evidence capture (FA3 F-FA3-1 / F-FA3-3) — receipt JSON persisted under `docs/tranches/F/receipts/`.
- **δ — UX + a11y + perf polish**: `button-name` failures on AppHeader Reka dropdown + `.btn-pill` (FA1 F-A11Y-1); `label-content-name-mismatch` on `/visualize`; missing `meta-description` + `robots.txt` (F-SEO-1); per-route lazy-load deeper than W7 reached (F-PERF-1); self-host CM fonts under `/assets/fonts/` with `Cache-Control: immutable` (F-PERF-2).
- **ε — chronic discharge + auto-migration GREEN-verified + transpositions**: C4 `ORT_LOGGING_LEVEL=3` 1-liner (kills a 4-gate chronic); C9 invariant numbering reconciliation across A-E + precepts; N2 CF wildcard narrow; FA5 F-T-N1 (drop legacy `status` from `FormattedPalette` — paired demo PR); ~~FA5 F-T-E1~~ (REJECTED per Wχ-P4); ~~FA5 F-T-S2~~ (REJECTED per Wχ-P4); trigger one real migration to upgrade W9 from GREEN-pending-real-test to GREEN-verified.
- **ζ — constellation deploy standardization** *(ADDED 2026-05-28 per "normalize CI + webhook + ensure security; create a repo; standardize across the constellation")*: author `mkbabb/deploy` (PRIVATE, created `e3b16d8`) as the versioned home of the deploy spine + standard templates (deploy-hook / docker-hardening / CI / .env); split the shared webhook HMAC into per-repo secrets (rides γ's per-repo-URL retire; closes survey S4); promote `dns-cf-sync.sh` to constellation-wide; coordinate maintainer-owned adoption asks for the other 5 app repos. Substrate: `docs/constellation/DEPLOY-STANDARDIZATION-DESIGN.md` + `docs/audits/runs/2026-05-28-constellation-survey/`. **inv-16 preserved**: fourier-F commits touch only `fourier-analysis/**` + `deploy/**` — never the other app repos (they adopt via maintainer-owned PRs). The 2 HIGH committed-secret exposures (S1 floridify `pk_live_*`; S2 speedtest `cfat_*`) are **operator-out-of-band**, NOT F scope.

**Completion criterion (the evidence).** The close holds when:

- **α**: `curl -sI https://api.fourier.babb.dev/` → `Content-Type: application/json`; `curl https://api.fourier.babb.dev/health | jq .status` → `"ok"`; a 25-burst on `/api/visualizations` returns at least one 429 with `RateLimit-Remaining: 0` (or the limit is observably non-static); inv-22 gate emits the same shape on `api.color.babb.dev`.
- **β**: `db.compute_cache.countDocuments()` > 0; `CACHE_HIT compute_bases` log line emits on second identical-params call; `compute_cache.py` no longer carries the 3-field positional signature.
- **γ**: `receipts/F-W3.json` exists with dry-run + apply + verification captures; `/opt/deploy/scripts/dispatch.sh` is GONE on host; 5 GitHub repo webhooks point to per-repo `deploy.babb.dev/hooks/<repo>` URLs; `speedtest.conf` is `a2dissite`d; `crontab -l | grep conformance` captured + `conformance-probe.log tail` captured.
- **δ**: `axe-core/playwright` (or Lighthouse re-run) shows `button-name: 0` failures across `/`, `/visualize`, `/paper`, `/gallery`, `/equation`; `meta-description` + `robots.txt` present. **[Wα-DELTA per Wχ-P3]** the perf gate is REVISED: drop the `unused-javascript < 50 kB` clause (it chases a CF-cold-edge/font-fetch LCP artifact against an already-fully-lazy app); replace with "CM font URL pinned to an immutable ref + preconnect retained." Route-lazy + self-host are DEFERRED-as-manufactured.
- **ε**: `migrations` collection holds ≥1 entry with `result: SUCCESS`; `ORT_LOGGING_LEVEL=3` set; C9 numbering reconciled across A.md/B.md/C.md/D.md/E.md + precepts; F-T-N1 lands as a doc-only ASK (value.js maintainer commits the source). **[Wα-DELTA per Wχ-P4]** F-T-E1 (auto-discover `migrate_*.py`) is REJECTED — the explicit static `MIGRATIONS` `(name, version)` list is KEPT (the version column is load-bearing idempotency; `MIGRATION_VERSION` exists in no module). F-T-S2 (inline `apiFetchWithETag`/`adminFetch`) is REJECTED — E.W5 already collapsed the 4 helpers into `coreFetch`; the pass-throughs are deliberate; inlining would fan 2 helpers into 20 sites (net +LOC).
- T7 conformance probe still 12/12 PASS (no regression).
- `uv run pytest api/tests/` green (212/212 maintained or higher).
- `vue-tsc -b` green; `npm run build` succeeds.
- `PROGRESS.md` matches reality; `FINAL.md` cites every commit + gate.

The §6 hard-gate list is the binding ledger.

## §1 — Thesis

E (and cohort I) closed Scenario A: every load-bearing CRUD/cohesion surface across both repos verified by T7 12/12. **What E could not land** (and explicitly recorded as named-residual): the operator-coordinated work (T-S3 host-flip; value.js dispatcher arm delete; cron evidence capture); the LCP / a11y floor on the SPA (perf 59–64 across 3 audited routes); the chronic-but-cheap items (C4 onnxruntime suppression; C9 numbering; N2 CF wildcard); the compute_cache asymmetry (W7 epicycles-only; bases unwired); the auto-migration GREEN-verified upgrade (W9 was GREEN-pending-real-test).

FA1 ALSO surfaced one HIGH-severity regression that is NOT hygiene: `api.fourier.babb.dev` non-`/api/*` paths serve a stale 28-May SPA index.html via nginx try_files fallback. The canonical FastAPI surface (`/`, `/health`, `/docs`, `/openapi.json`) is HIDDEN behind a 200 with wrong content-type. This is a real prod bug requiring research-first remediation (nginx archaeology before mutation).

F exists to close all five threads — bounded, KISS-honest, single-repo, no cohort partner. The user's 2026-05-28 directive ("Deploy 6 agents in parallel to lighthouse test each page… DEEPLY audit… NO legacy code… fold into a new tranche… NOT an implementation phase. Tranche development only.") IS the F authoring substrate.

F is composed of **6 intentionally separable threads** sequenced so the load-bearing prod regression (α) and the architectural transposition (β) land before the operator window (γ), the polish surfaces (δ), the chronic-sweep (ε), and the constellation deploy standardization (ζ — which builds on γ's per-repo-webhook retire):

- **α API-vhost-correctness** — research-first (nginx archaeology); direct execution.
- **β compute-cache-symmetry** — direct; mechanical refactor with strong gates.
- **γ operator-window-consolidation** — research-first (state capture); single SSH session.
- **δ UX + a11y + perf polish** — direct; observation-bounded.
- **ε chronic + transpositions + auto-migration GREEN-verified** — direct; surgical.

KISS (inv-12), NO-legacy (inv-20), inv-16 (no cross-repo source mixing), and the new inv-21 (post-cohort-hygiene-bounded) + inv-22 (vhost-correctness-symmetric) are load-bearing.

## §2 — Invariants

F inherits all prior invariants (`A.md §2` through `E.md §2`) unchanged. F adds **two new invariants by name**:

- **inv-21 — post-cohort-hygiene-bounded**: each F thread holds a single-PR or single-SSH-session bound. Threads exceeding one session without a wave split are evidence of manufactured scope and must be re-decomposed. Rationale: F is post-cohort hygiene; the 5-item load-bearing surface from FA4 §6 is the binding ceiling. Testable gate: each thread's W-close requires < 800 LOC delta OR documented host-ops single-window receipt.
- **inv-22 — vhost-correctness-symmetric** *(REVISED per Wχ-P2)*: no API vhost serves an **SPA index** at API paths. The real invariant is "no SPA-fallback HTML masquerading as every path" — the discriminating tell is **byte-identical HTML across distinct paths** (the SPA `index.html` is the same 2759 B on `/`, `/health`, `/docs`). `/docs` returning **Swagger-UI HTML is conformant** (a real FastAPI UI route, HTML by design); `/docs` returning **404 problem+json is also conformant** (palette-api mounts no Swagger). What is NON-conformant is the SPA index. **Enforced surface: {`api.fourier.babb.dev`, `api.color.babb.dev`} only** — `api.sudoku.babb.dev` is documentary precedent (external repo; no fourier lever reaches it). Rationale: FA1 §5 F-API-1 (fourier regression) + FA2 §3 (sudoku nginx SPA-fallback pattern). Testable gate (5 checks): (1) `curl -sI <host>/` → `application/json` OR `404` (NOT SPA index — add a `location = /` → 404 problem+json block); (2) `curl <host>/health | jq .status` → `"ok"`; (3) `curl -sI <host>/docs` → Swagger-HTML OR 404-JSON (NOT the 2759 B SPA index); (4) `curl <host>/openapi.json | jq .info.title` → the API title (NOT SPA HTML); (5) symmetric on `api.color.babb.dev`.

## §3 — Wave schedule (provisional — hardened at Wχ close)

| Wave | Title | Thread | Agents | Closes on (completion) | Status |
|---|---|---|---|---|---|
| W0 — *Open + audit recap intake + named-carries restatement* | — | 1 | E closed CLEAN-CLOSE re-confirmed; the 6-lane F-development audit (FA1-FA6 + SYNTHESIS) committed as the binding baseline; C4 `ORT_LOGGING_LEVEL=3` 1-liner LANDS as the cheapest chronic-discharge | planned |
| Wα — *Research wave (3 lanes)* | α/γ | 3 parallel | **DONE 2026-05-28** (workflow `w0ma5070c`; substrate at `docs/audits/runs/2026-05-28-F-research/`). R1 vhost archaeology — origin-served (host Apache → Docker `nginx:alpine`:8100 → SPA catch-all); fix = surgical `location =` in tracked `nginx/fourier.conf`. R2 host-state — captured; gh token INVALID (forces W3 split). R3 — rate-limit is enforce/report split (read routes uncounted); cache refactor mechanical. All 3 RATIFIED-WITH-DELTA. | **GREEN** |
| Wχ — *Challenge wave (4 probes)* | — | 4 parallel | **DONE 2026-05-28**. P1 inv-21 → SPLIT W3 (INVALID gh token). P2 inv-22 → REVISE (/docs Swagger-OK; scope {fourier,color}; NO F.W1 CF-pivot — origin-served). P3 perf → NARROW to font-pin-only (route-lazy + self-host manufactured). P4 transpositions → F-T-N1 RATIFIED (doc-ASK); F-T-E1 + F-T-S2 REJECTED. | **GREEN** |
| W1 — *F-α API-vhost-correctness (nginx + rate-limit middleware)* | α | 1-2 | **[hardened]** Edit tracked `nginx/fourier.conf`: add BEFORE the SPA `location /` catch-all — `location = /openapi.json|/docs|/redoc { proxy_pass $backend_upstream }`; `location = /health { return 200 '{"status":"ok"}' }`; `location = / { return 404 problem+json }` (inv-22 check #1). Container recreate. Rate-limit: fuse `check()` into `RateLimitHeaderMiddleware` (rate_limiter.py:204-214) à la value.js `rate-limit.ts:91-116`. inv-22 5-check gate. | provisional |
| W2 — *F-β compute-cache-symmetry (FA5 F-T-S1)* | β | 1-2 | **[hardened; mechanical]** `cache_key(contour_hash, params: dict)` w/ canonical-JSON sorted + appended `COMPUTE_VERSION`; wire `compute_bases` (contours.py:56-67); `_CACHE_COLL` + database.py:70-76 `epicycle_cache` → `compute_cache` (bare rename intentionally abandons old docs — TTL ≤7d + fail-open absorbs gap); HIT/MISS logging | provisional |
| W3a — *F-γ host-ops single-window (no operator)* | γ | 1 | **[SPLIT per Wχ-P1]** backup `dispatch.sh` + `hooks.json`; author 5 per-repo `hooks.json` entries + reload receiver (STAGED, NOT activated — dispatcher NOT deleted); `a2dissite speedtest.conf`; capture cron evidence (running, fired 12:00:01 UTC, 12/12) + dangling-images (=0); `receipts/F-W3a.json` | provisional |
| W3b — *F-γ operator-gated cutover* | γ | 1 (operator-gated) | **[GATED on `gh auth login -h github.com`]** gh re-auth → `update-webhook-urls.sh` dry-run → `--apply` (5 URLs → `deploy.babb.dev/hooks/<repo>`) → per-repo hook tests → THEN `rm /opt/deploy/scripts/dispatch.sh` (value.js latent-broken arm dies with it); `receipts/F-W3b.json`. HARD ordering: dispatcher MUST NOT delete until 5 URLs flipped | provisional |
| W4 — *F-δ.a a11y + SEO + bf-cache* | δ | 1-2 | `button-name` aria-labels on AppHeader Reka dropdown + `.btn-pill`; `meta-description` + `robots.txt`; `label-content-name-mismatch` on `/visualize`; bf-cache audit (`beforeunload` / MathJax listener review) | provisional |
| W5 — *F-δ.b perf (NARROWED — font-pin only)* | δ | 1 | **[NARROWED per Wχ-P3]** pin `cm-web-fonts@latest` → `@<immutable-sha>` in `web/index.html` (lines 12,15-17,31); keep preconnect; NO new files. DEFER-as-manufactured: route-lazy (app already fully `() => import()` lazy; 85 kB is irreducible shell; LCP 7-8s is CF-cold-edge artifact) + self-host (net ADD: 3 git binaries + no FOUT win) | provisional |
| W6 — *F-ε.a chronic discharge (C9 + N2)* | ε | 1 | C9 invariant numbering reconciliation across A.md/B.md/C.md/D.md/E.md + precepts (single doc-PR); N2 CF wildcard narrow (`dns-cf-sync.sh` re-run) | provisional |
| W7 — *F-ε.b transpositions (F-T-N1 ONLY)* | ε | 1 | **[REVISED per Wχ-P4]** F-T-N1 doc-only ASK: fourier-F authors the coordination note; value.js maintainer commits the `status`-field drop in value.js (inv-16: no fourier-F commit touches `value.js/**`). **F-T-E1 REJECTED** (keep static `MIGRATIONS` (name,version) list); **F-T-S2 REJECTED** (E.W5 already collapsed to `coreFetch`; retain pass-throughs) | provisional |
| W8 — *F-ε.c auto-migration GREEN-verified* | ε | 1 | trigger one real (or no-op) migration deploy; capture `migrations` collection write; W9-from-E upgrades to GREEN-verified | provisional |
| W9 — *F-ζ.1 deploy-repo spine-capture* | ζ | 1-2 | version the host spine into `mkbabb/deploy`: `webhook.service` (systemd unit) + `hooks.json.template` (per-repo entries, `${HMAC_<REPO>}` interpolation) + `deploy-dir-layout.md`; the multiplex `dispatch.sh` is retired (its function moves to per-repo `hooks.json` entries, completing γ's T-S3) | provisional |
| W10 — *F-ζ.2 per-repo HMAC secret split* | ζ | 1 | each `deploy.babb.dev/hooks/<repo>` gets its OWN HMAC secret (closes survey S4 — one repo's compromise no longer re-signs all 5); rotation runbook (`deploy/security/hmac-rotation.md`, dual-key blue-green); rides γ/W3b's per-repo-URL flip | provisional (host-coordinated) |
| W11 — *F-ζ.3 standard templates* | ζ | 2-3 parallel | author `deploy/templates/{deploy-hook.sh, docker-compose.hardening.yml, ci.yml, env.example}` from the fourier (hardened hook) + value.js/api (docker-hardening floor) + speedtest (CF Pages recipe) reference shapes; `deploy/cf/{dns-cf-sync.sh (promoted), pages-deploy.sh}` | provisional |
| W12 — *F-ζ.4 cross-repo adoption asks (coordination)* | ζ | 1 | author the per-repo-maintainer adoption asks (CI template → words + speedtest + csp-solver; docker-hardening level-up; frontend-hosting drift resolution — CF Pages convergence for value.js + keyframes; palette-api rsync→git). Coordinated from the design doc as cross-repo asks; NOT fourier-F commits (inv-16) | provisional |
| W13 — *Close + stale-watch re-trigger* | — | 1 | reconcile PROGRESS; author `F/FINAL.md`; re-trigger E's 30-day named-residual review; record the ζ cross-repo asks as named-residuals (maintainer-owned); CANONICAL-ORDERING → ordering θ′ | provisional |

Hard ceiling 4 agents/wave (DA6/NA6/EA6 inherited). Research-first gate (W0 → Wα → Wχ) GREEN as of 2026-05-28 (substrate hardened the specs above). W1 (α) precedes W2 (β); both must close before W3a (γ host-ops). **W3b is GREEN-pending-W3a** (gh auth now valid; W3a stages host entries first). δ (W4/W5) and ε (W6/W7/W8) follow with relaxed ordering. **ζ (W9-W12) follows γ** — ζ.1 spine-capture + ζ.2 per-repo-HMAC complete the per-repo-webhook retire γ/T-S3 began; ζ.3 templates + ζ.4 asks are coordination. W13 closes. **17 wave slots** (W3 split W3a/W3b; ζ added W9-W12; old W12 close → W13). Granularity expands as needed per the user's "more waves with better granularity."

## §4 — Phases

**Phase 0 — research + challenge (W0–Wχ).** nginx archaeology + host-state capture + rate-limit diagnosis; challenge KISS-honesty of each thread.

**Phase I — load-bearing prod regression + transposition (W1–W2).** F-α nginx vhost correctness + rate-limit middleware wiring; F-β compute-cache-symmetry.

**Phase II — operator window (W3).** Single SSH session: dispatcher retire + `:8140` vhost + cron evidence.

**Phase III — UX polish (W4–W5).** a11y + SEO + perf.

**Phase IV — chronic + transpositions + GREEN-verified (W6–W8).**

**Phase V — close (W12).**

## §5 — Critical files and ownership

| Surface | Files | Owning wave |
|---|---|---|
| F-α nginx vhost | host `/etc/apache2/sites-enabled/api-fourier.babb.dev.conf` (or nginx equivalent — research at Wα to determine actual server) | W1 |
| F-α rate-limit middleware | `api/services/rate_limiter.py` + `api/main.py` middleware wiring | W1 |
| F-β compute cache | `api/services/compute_cache.py` (params: dict refactor); `api/routers/contours.py` (wire compute_bases); `api/services/database.py` (collection rename) | W2 |
| F-γ host ops | host `/opt/deploy/{scripts/dispatch.sh, hooks.json}` + 5 GitHub webhook URLs + Apache `speedtest.conf`; receipts under `docs/tranches/F/receipts/` | W3 |
| F-δ.a a11y + SEO | `web/src/components/AppHeader.vue` (aria-labels); `web/index.html` (meta-description); `web/public/robots.txt` (NEW); per-route meta via Vue Router | W4 |
| F-δ.b perf | `web/vite.config.ts` (deeper chunk split); `web/public/assets/fonts/` (NEW — CM woffs); HTTP cache headers | W5 |
| F-ε.a doc reconcile | `docs/tranches/{A,B,C,D,E}/*.md` (C9 numbering); `scripts/dns-cf-sync.sh` (N2 wildcard narrow) | W6 |
| F-ε.b transposition | `value.js/api/src/format/palette.ts` (cross-repo coord; F-T-N1 doc-ASK only — value.js maintainer commits); F-T-E1 + F-T-S2 REJECTED (no fourier edits) | W7 |
| F-ε.c auto-migration | introduce a no-op migration; deploy; capture `migrations` collection write | W8 |
| F-ζ.1 deploy-repo spine | `deploy/host/{webhook.service, hooks.json.template, deploy-dir-layout.md}` (the NEW `mkbabb/deploy` repo; fourier-F owns it) | W9 |
| F-ζ.2 per-repo HMAC | `deploy/host/hooks.json.template` (per-repo `${HMAC_<REPO>}`); host `/opt/deploy/hooks.json` (5 per-repo secrets); `deploy/security/hmac-rotation.md` (NEW) | W10 |
| F-ζ.3 templates | `deploy/templates/{deploy-hook.sh, docker-compose.hardening.yml, ci.yml, env.example}`; `deploy/cf/{dns-cf-sync.sh, pages-deploy.sh}` (all NEW in the deploy repo) | W11 |
| F-ζ.4 adoption asks | `docs/constellation/DEPLOY-STANDARDIZATION-DESIGN.md §4` adoption-ask ledger (coordination doc; the per-repo PRs are maintainer-owned, NOT fourier-F commits) | W12 |
| C4 onnxruntime | `api/__init__.py` (1-line env var) | W0 |

No two waves hold overlapping write bounds. α (host nginx + api middleware) ∥ β (api services + routers) ∥ δ (web components + assets). γ is host-only. ε is doc + cross-repo-ASK + web/api. **ζ writes only `deploy/**` (the new fourier-F-owned repo) + host `/opt/deploy/` + the fourier-side coordination doc — never the other app repos (inv-16; they adopt via maintainer-owned PRs).**

## §6 — Hard gates (completion criterion)

Per-wave gates set in the hardened `waves/W*.md` after Wχ. Tranche-level close gates:

- **inv-22 vhost-correctness lives**: `curl -sI https://api.fourier.babb.dev/` → `Content-Type: application/json`; `curl https://api.fourier.babb.dev/health | jq .status` → `"ok"`; same shape on `api.color.babb.dev`.
- **F-α rate-limit dynamic**: 25-burst on `/api/visualizations` returns ≥1 429 with `RateLimit-Remaining: 0` (or limiter behaviour is observably non-static).
- **F-β compute cache symmetric**: `CACHE_HIT compute_bases` log line emits on second identical-params call; `compute_cache.py` no longer carries the 3-field positional signature.
- **F-γ receipts** *(SPLIT per Wχ-P1; W3b UNBLOCKED 2026-05-28)*: `receipts/F-W3a.json` (host-ops single-window: staged hooks.json + speedtest teardown + cron/dangling capture) AND `receipts/F-W3b.json` (5-URL flip + hook tests + dispatcher `rm`). **gh auth is now VALID** (operator logged in; dry-run passes; pre-flight anchor `receipts/F-W3-preflight.json`) — W3b is no longer operator-gated; it is GREEN-pending-W3a (host entries staged first; dispatcher `rm` only after all 5 URLs flip — deleting earlier 404s webhooks).
- **F-δ a11y + SEO**: Lighthouse re-run shows `button-name: 0` failures; `meta-description` + `robots.txt` present on every route.
- **F-δ perf** *(NARROWED per Wχ-P3)*: `cm-web-fonts` URL pinned to an immutable ref (not `@latest`) in `web/index.html`; preconnect retained. (The `unused-javascript < 50 kB` gate is STRUCK — it chased a CF-cold-edge LCP artifact; route-lazy + self-host DEFERRED-as-manufactured.)
- **F-ε transpositions** *(REVISED per Wχ-P4)*: F-T-N1 — `value.js/api/src/format/palette.ts` `status` drop committed by the value.js maintainer (fourier-F authors the doc-ASK only; inv-16 holds). F-T-E1 REJECTED — `MIGRATIONS` static `(name, version)` list KEPT. F-T-S2 REJECTED — `coreFetch` collapse from E.W5 retained; pass-throughs kept.
- **F-ε auto-migration GREEN-verified**: `migrations` collection holds ≥1 entry with `result: SUCCESS` from a deploy-hook trigger (not manual SSH).
- **C4 chronic discharge**: `os.environ['ORT_LOGGING_LEVEL'] = '3'` set at `api/__init__.py`; ONNX warning flood gone.
- **C9 numbering reconciled**: A/B/C/D/E charters carry consistent invariant numbering.
- **T7 conformance probe**: still 12/12 PASS at F close (no regression).
- `uv run pytest api/tests/` green (212/212 maintained); `vue-tsc -b` green; `npm run build` succeeds.
- `PROGRESS.md` matches reality; `FINAL.md` cites every commit + gate.
- 30-day named-residual stale-watch re-triggered at W12 (inherits E/FINAL §5).

**Invalid hard gates** (rejected per §7 must-NOT list): manufactured perf transpositions (F-T-P1 katex lazy on `/paper`); per-call-site `types.ts` migration (F-T-E2); Idempotency-Key API-side middleware (E5; routed to I-tail); Playwright cross-env matrix expansion (E2; single CI-config delta only).

## §7 — Cross-tranche debt and explicit deferrals

**Inherited from E (named-residuals folded):**
- T-S3 host-flip dispatcher retire (operator-coord) → **W3**.
- Value.js dispatcher arm latent-broken → **W3** (dies with T-S3).
- Dead `:8140` speedtest vhost → **W3**.
- Host-cron evidence capture (FA3 trust-delta) → **W3**.
- Cross-env Playwright matrix (D.W6 AMBER) → **STAYS-OUT** unless single CI-config delta suffices.
- Compute cache hit-rate instrumentation → **W2** (rides F-β).
- Per-call-site adoption If-Match/Idempotency-Key → **W7** (targeted ~5 sites; FA5 §4).
- Auto-migration GREEN-verified → **W8**.
- C4 onnxruntime → **W0** (1-liner; cheapest discharge).
- C9 invariant numbering → **W6** (single doc-PR).
- N2 CF wildcard narrow → **W6**.

**Inherited from B/C/D (chronic ≥2 tranches; STAYS-OUT-with-rationale per FA4 §4):**
- **C1** colour-lift `sampleToSVGPath` — value.js publish-bound; STAYS-OUT.
- **C2** Palette/colorScale domain model — inv-15 binding; STAYS-OUT.
- **C5** glass-ui substrate carries — inv-16 cross-repo; STAYS-OUT.
- **C6** glass-ui cold-boot race — same; STAYS-OUT.
- **C7** §U conformance strikes — never-built-by-design; STAYS-OUT.
- **C8** cross-cohort infra plan (constellation-wide) — **RECLASSIFIED 2026-05-28: the 5-gate chronic NOW DISCHARGES via thread ζ** (the `mkbabb/deploy` repo + standard templates + the constellation survey). The user's "normalize across the constellation" directive is the C8 re-mandate. fourier-relevant subset → F-γ + F-ζ.1/ζ.2; constellation-wide → F-ζ.3/ζ.4 (templates + maintainer-owned adoption asks).
- **N3** W11 FULL palette-api → color rename — cosmetic; URL-layer GREEN; STAYS-OUT (not a deploy-process item; orthogonal to ζ).
- **N4** csp-solver runtime URL — external repo (per FA2 §3 reframe: route-registration regression at sudoku-repo; ASK only) → folds into the **F-ζ.4 cross-repo adoption-ask ledger** (coordinated, maintainer-owned).
- **N7** floridify Mongo-bind upstream — external repo → **F-ζ.4 adoption-ask ledger** (maintainer-owned).
- **S1/S2** committed-secret exposures (floridify `pk_live_*`; speedtest `cfat_*`) — **operator-out-of-band** (user decision); recorded in `SURVEY-FINDINGS.md §3`; NOT F scope.

**Deferred out of F (potential successors):**
- **E5** Idempotency-Key API-side replay store — value.js-J or I-tail.
- **E6** per-repo conformance suite (value.js side) — value.js-J.
- **E7** `id` field hard-removal from palette envelope — value.js-J.
- **F-T-P1** katex lazy-load on `/paper` — REJECTED-as-manufactured.
- **F-T-E2** per-call-site `types.ts` migration — REJECTED-as-decorative.
- Cross-env Playwright matrix expansion — fourier-G if real UX regression evidence surfaces.

## §8 — Brittleness window (provisional)

F plans NO brittleness window. Each wave is reversible at its own boundary:
- α (W1) nginx config: revertible by host config rollback (capture state at Wα-R1).
- β (W2) compute cache: collection rename is one-way but the old name is empty (fresh schema); fail-open property preserves correctness.
- γ (W3) host ops: dry-run + apply pattern; webhook URLs revertible via `gh api -X PATCH`; dispatcher file backup capture at Wα-R2.
- δ (W4/W5) UX: client-side only; failures contained by deploy gate.
- ε (W6/W7/W8): each item bounded; transpositions reversible per FA5 acceptance gates.

```yaml
breaking_changes_during_wave: NO
suspended_gates: none
restoration_wave: N/A — F plans no brittleness window
reason: every wave's scope is reversible at its own boundary; the host
        operator window (W3) requires dry-run + receipt capture per inv-21;
        no host-disruptive operations beyond the documented operator
        window which is a single SSH session per binding.
```

## §9 — Cross-repo coordination (post-cohort; ASK-only)

The cohort closed Scenario A at E.W12. F is single-repo with **ASK-only** cross-repo touchpoints:

- **csp-solver** (per FA2 §3): backend live at `/api/v1/health`; missing `solve`/`openapi`/`docs` routes. F records the ASK to the sudoku-repo maintainer (1-line `app.include_router`); STAYS-OUT of fourier source.
- **value.js** (per FA5 F-T-N1): drop legacy `status` field from `FormattedPalette` is a paired demo PR; the value.js maintainer (same user) commits the value.js side; fourier-F documents the coordination. inv-16 cross-repo source boundary preserved.
- **floridify** (N7): Mongo-bind upstream; STAYS-OUT.
- **glass-ui** (C5/C6): STAYS-OUT.

## §X — Congruence findings (for team-lead reconcile)

The 6 FA lanes + SYNTHESIS surface the binding scope. No `E.md` reconcile required — E is closed CLEAN at Scenario A. The 12 REJECTED items (FA4 §4 + SYNTHESIS §6) carry explicit STAYS-OUT-with-rationale; the 5 RECOMMENDED transpositions (FA5 §2) ride F-ε.

End of F.md.
