# F — post-cohort hygiene — API-vhost-correctness + compute-cache-symmetry + operator-window + UX-polish + chronic discharge

**Tranche letter**: F — fourier-analysis's post-cohort hygiene tranche; successor to E (CRUD cohesion completion + consumer hardening + arch transpositions + test integrity + ops hygiene) which closed Scenario A paired with value.js-I.
**Predecessor close**: E — `docs/tranches/E/FINAL.md` at fourier HEAD `f422b52`; value.js-I — `value.js/docs/tranches/I/FINAL.md` at value.js HEAD `2fefe5e`. T7 12/12 PASS reproducible.
**Cohort**: **single repo.** value.js-I closed Scenario A; the cohort handshake is discharged. No peer repo required for F.
**Mode**: **research-first** for α (nginx vhost archaeology before touching live config) and γ (host-side capture-before-mutate); **direct** for β (compute-cache-symmetry — diff is mechanical), δ (UX polish — observation-bounded), ε (chronic + transpositions — surgical).
**Open**: TBD (after user authorises F.W0).
**Authored**: 2026-05-28 (the 6-lane F-development audit — `FA1-FA6.md` + `SYNTHESIS.md` — `docs/audits/runs/2026-05-28-F-audit/`).

## §0 — Goal criterion and completion criterion (paired)

**Goal criterion (the aim).** Land five threads honestly to discharge the post-cohort hygiene surface E left + the load-bearing prod regression FA1 surfaced:

- **α — API-vhost-correctness**: `api.fourier.babb.dev/{/, /health, /docs, /openapi.json}` returns JSON (problem+json on error) — never an SPA index.html; rate-limit middleware emits dynamic `RateLimit-*` headers, not static constants.
- **β — compute-cache-symmetry**: `compute_cache.py` keys on `params: dict` (canonical-JSON sorted) instead of the 3-field positional contract; `compute_bases` wires through the same cache; `db.epicycle_cache` renames to `db.compute_cache`; hit-rate logging emits on cache-hit (closes E3 instrumentation residual).
- **γ — operator-window-consolidation**: single SSH session discharges N1 (value.js dispatcher arm DELETE) + E1 (T-S3 host-flip via `scripts/update-webhook-urls.sh --apply`) + dead `:8140` speedtest vhost teardown + host-cron evidence capture (FA3 F-FA3-1 / F-FA3-3) — receipt JSON persisted under `docs/tranches/F/receipts/`.
- **δ — UX + a11y + perf polish**: `button-name` failures on AppHeader Reka dropdown + `.btn-pill` (FA1 F-A11Y-1); `label-content-name-mismatch` on `/visualize`; missing `meta-description` + `robots.txt` (F-SEO-1); per-route lazy-load deeper than W7 reached (F-PERF-1); self-host CM fonts under `/assets/fonts/` with `Cache-Control: immutable` (F-PERF-2).
- **ε — chronic discharge + auto-migration GREEN-verified + transpositions**: C4 `ORT_LOGGING_LEVEL=3` 1-liner (kills a 4-gate chronic); C9 invariant numbering reconciliation across A-E + precepts; N2 CF wildcard narrow; FA5 F-T-N1 (drop legacy `status` from `FormattedPalette` — paired demo PR); FA5 F-T-E1 (auto-discover `migrate_*.py`); FA5 F-T-S2 (inline `apiFetchWithETag` / `adminFetch`); trigger one real migration to upgrade W9 from GREEN-pending-real-test to GREEN-verified.

**Completion criterion (the evidence).** The close holds when:

- **α**: `curl -sI https://api.fourier.babb.dev/` → `Content-Type: application/json`; `curl https://api.fourier.babb.dev/health | jq .status` → `"ok"`; a 25-burst on `/api/visualizations` returns at least one 429 with `RateLimit-Remaining: 0` (or the limit is observably non-static); inv-22 gate emits the same shape on `api.color.babb.dev`.
- **β**: `db.compute_cache.countDocuments()` > 0; `CACHE_HIT compute_bases` log line emits on second identical-params call; `compute_cache.py` no longer carries the 3-field positional signature.
- **γ**: `receipts/F-W3.json` exists with dry-run + apply + verification captures; `/opt/deploy/scripts/dispatch.sh` is GONE on host; 5 GitHub repo webhooks point to per-repo `deploy.babb.dev/hooks/<repo>` URLs; `speedtest.conf` is `a2dissite`d; `crontab -l | grep conformance` captured + `conformance-probe.log tail` captured.
- **δ**: `axe-core/playwright` (or Lighthouse re-run) shows `button-name: 0` failures across `/`, `/visualize`, `/paper`, `/gallery`, `/equation`; `meta-description` + `robots.txt` present; CM fonts served from self-host with `Cache-Control: immutable`; Lighthouse `unused-javascript` for `index-*.js` < 50 kB or evidence of deeper route lazy-load.
- **ε**: `migrations` collection holds ≥1 entry with `result: SUCCESS`; FA5 transpositions land with their stated acceptance gates; `ORT_LOGGING_LEVEL=3` set; C9 numbering reconciled across A.md/B.md/C.md/D.md/E.md + precepts.
- T7 conformance probe still 12/12 PASS (no regression).
- `uv run pytest api/tests/` green (212/212 maintained or higher).
- `vue-tsc -b` green; `npm run build` succeeds.
- `PROGRESS.md` matches reality; `FINAL.md` cites every commit + gate.

The §6 hard-gate list is the binding ledger.

## §1 — Thesis

E (and cohort I) closed Scenario A: every load-bearing CRUD/cohesion surface across both repos verified by T7 12/12. **What E could not land** (and explicitly recorded as named-residual): the operator-coordinated work (T-S3 host-flip; value.js dispatcher arm delete; cron evidence capture); the LCP / a11y floor on the SPA (perf 59–64 across 3 audited routes); the chronic-but-cheap items (C4 onnxruntime suppression; C9 numbering; N2 CF wildcard); the compute_cache asymmetry (W7 epicycles-only; bases unwired); the auto-migration GREEN-verified upgrade (W9 was GREEN-pending-real-test).

FA1 ALSO surfaced one HIGH-severity regression that is NOT hygiene: `api.fourier.babb.dev` non-`/api/*` paths serve a stale 28-May SPA index.html via nginx try_files fallback. The canonical FastAPI surface (`/`, `/health`, `/docs`, `/openapi.json`) is HIDDEN behind a 200 with wrong content-type. This is a real prod bug requiring research-first remediation (nginx archaeology before mutation).

F exists to close all five threads — bounded, KISS-honest, single-repo, no cohort partner. The user's 2026-05-28 directive ("Deploy 6 agents in parallel to lighthouse test each page… DEEPLY audit… NO legacy code… fold into a new tranche… NOT an implementation phase. Tranche development only.") IS the F authoring substrate.

F is composed of **5 intentionally separable threads** sequenced so the load-bearing prod regression (α) and the architectural transposition (β) land before the operator window (γ), the polish surfaces (δ), and the chronic-sweep (ε):

- **α API-vhost-correctness** — research-first (nginx archaeology); direct execution.
- **β compute-cache-symmetry** — direct; mechanical refactor with strong gates.
- **γ operator-window-consolidation** — research-first (state capture); single SSH session.
- **δ UX + a11y + perf polish** — direct; observation-bounded.
- **ε chronic + transpositions + auto-migration GREEN-verified** — direct; surgical.

KISS (inv-12), NO-legacy (inv-20), inv-16 (no cross-repo source mixing), and the new inv-21 (post-cohort-hygiene-bounded) + inv-22 (vhost-correctness-symmetric) are load-bearing.

## §2 — Invariants

F inherits all prior invariants (`A.md §2` through `E.md §2`) unchanged. F adds **two new invariants by name**:

- **inv-21 — post-cohort-hygiene-bounded**: each F thread holds a single-PR or single-SSH-session bound. Threads exceeding one session without a wave split are evidence of manufactured scope and must be re-decomposed. Rationale: F is post-cohort hygiene; the 5-item load-bearing surface from FA4 §6 is the binding ceiling. Testable gate: each thread's W-close requires < 800 LOC delta OR documented host-ops single-window receipt.
- **inv-22 — vhost-correctness-symmetric**: both `api.fourier.babb.dev` and `api.color.babb.dev` (and any future constellation API vhost) must return JSON (problem+json on error) for `/`, `/health`, `/docs`, `/openapi.json` — never an SPA index. Rationale: FA1 §5 F-API-1 found this regression on fourier; FA2 §3 found nginx SPA-fallback on sudoku eating `/health` and `/openapi.json` at the apex. Cross-constellation pattern. Testable gate: each API vhost passes `curl -sI <host>/ -H 'Accept: application/json' | grep -i 'content-type: application/json'` and `curl <host>/health | jq .status`.

## §3 — Wave schedule (provisional — hardened at Wχ close)

| Wave | Title | Thread | Agents | Closes on (completion) | Status |
|---|---|---|---|---|---|
| W0 — *Open + audit recap intake + named-carries restatement* | — | 1 | E closed CLEAN-CLOSE re-confirmed; the 6-lane F-development audit (FA1-FA6 + SYNTHESIS) committed as the binding baseline; C4 `ORT_LOGGING_LEVEL=3` 1-liner LANDS as the cheapest chronic-discharge | planned |
| Wα — *Research wave (3 lanes — α + γ research-first; β light)* | α/γ | 3 parallel | **R1** nginx vhost archaeology (`api.fourier.babb.dev` config; what is the try_files fallback rule; what is the desired post-state per inv-22); **R2** host-state capture (current `/opt/deploy/scripts/dispatch.sh` + `hooks.json` + 5 GitHub webhook URLs + `:8140` speedtest vhost config) BEFORE mutation; **R3** rate-limit-middleware diagnosis (FA1 F-API-2 — is SlowAPI wired? does it emit `RateLimit-*` dynamically?) | planned |
| Wχ — *Challenge wave (4 probes; 4-agent ceiling)* | — | 4 parallel | **P1** inv-21 post-cohort-hygiene-bounded holds per-thread (single SSH-session for γ; <800 LOC for α/β/δ/ε); **P2** inv-22 vhost-correctness-symmetric is the right shape (not just-fourier; cross-constellation pattern); **P3** F-δ.b perf is observational not manufactured (KISS-gate against W7 outcome); **P4** F-T-N1 + F-T-E1 + F-T-S2 are KISS-honest REDUCE (FA5 §2 confirms; re-cert at execution) | planned |
| W1 — *F-α API-vhost-correctness (nginx + rate-limit middleware)* | α | 1-2 | nginx vhost fixed (non-`/api/*` returns 404 JSON or proxies to FastAPI for `/docs` honestly); rate-limit middleware emits dynamic `RateLimit-*`; inv-22 gate first lands here | provisional |
| W2 — *F-β compute-cache-symmetry (FA5 F-T-S1)* | β | 1-2 | `compute_cache.py` params-dict refactor; `compute_bases` wired through cache; `db.epicycle_cache` → `db.compute_cache` rename; hit-rate logging emits on cache-hit (closes E3 residual) | provisional |
| W3 — *F-γ operator-window (single SSH session)* | γ | 1 (operator-coordinated) | dry-run + apply: T-S3 host-flip (5 webhook URLs + dispatcher delete) + `:8140` vhost teardown + cron evidence capture + dangling-image discipline check; `receipts/F-W3.json` persisted | provisional |
| W4 — *F-δ.a a11y + SEO + bf-cache* | δ | 1-2 | `button-name` aria-labels on AppHeader; `meta-description` + `robots.txt`; `label-content-name-mismatch` on `/visualize` fixed; bf-cache audit (`beforeunload` / MathJax listener review) | provisional |
| W5 — *F-δ.b perf (deeper route-lazy + CM font self-host)* | δ | 1-2 | self-host CM fonts under `/assets/fonts/` with `Cache-Control: immutable`; deeper route-level lazy-load (Tooltip chunk on tooltip-using routes only); Lighthouse re-run shows `unused-javascript` < 50 kB on `index-*.js` | provisional |
| W6 — *F-ε.a chronic discharge (C9 + N2)* | ε | 1 | C9 invariant numbering reconciliation across A.md/B.md/C.md/D.md/E.md + precepts (single doc-PR); N2 CF wildcard narrow (`dns-cf-sync.sh` re-run) | provisional |
| W7 — *F-ε.b transpositions (FA5 F-T-N1 + F-T-E1 + F-T-S2)* | ε | 2-3 parallel | drop legacy `status` from `FormattedPalette` + paired demo PR (cross-repo coord); auto-discover `migrate_*.py`; inline `apiFetchWithETag` + `adminFetch` at call-sites | provisional |
| W8 — *F-ε.c auto-migration GREEN-verified* | ε | 1 | trigger one real (or no-op) migration deploy; capture `migrations` collection write; W9-from-E upgrades to GREEN-verified | provisional |
| W12 — *Close + stale-watch re-trigger* | — | 1 | reconcile PROGRESS; author `F/FINAL.md`; re-trigger E's 30-day named-residual review; CANONICAL-ORDERING → ordering θ | provisional |

Hard ceiling 4 agents/wave (DA6/NA6/EA6 inherited). Research-first gate (W0 → Wα → Wχ) governs α + γ. W1 (α) precedes W2 (β); both must close before W3 (γ — host mutation). δ (W4/W5) and ε (W6/W7/W8) follow with relaxed ordering. W12 closes.

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
| F-ε.b transpositions | `value.js/api/src/format/palette.ts` (cross-repo coord; F-T-N1); `api/scripts/run_pending_migrations.py` (F-T-E1); `web/src/lib/api.ts` (F-T-S2) | W7 |
| F-ε.c auto-migration | introduce a no-op migration; deploy; capture `migrations` collection write | W8 |
| C4 onnxruntime | `api/__init__.py` (1-line env var) | W0 |

No two waves hold overlapping write bounds. α (host nginx + api middleware) ∥ β (api services + routers) ∥ δ (web components + assets). γ is host-only. ε is doc + cross-repo + web/api.

## §6 — Hard gates (completion criterion)

Per-wave gates set in the hardened `waves/W*.md` after Wχ. Tranche-level close gates:

- **inv-22 vhost-correctness lives**: `curl -sI https://api.fourier.babb.dev/` → `Content-Type: application/json`; `curl https://api.fourier.babb.dev/health | jq .status` → `"ok"`; same shape on `api.color.babb.dev`.
- **F-α rate-limit dynamic**: 25-burst on `/api/visualizations` returns ≥1 429 with `RateLimit-Remaining: 0` (or limiter behaviour is observably non-static).
- **F-β compute cache symmetric**: `CACHE_HIT compute_bases` log line emits on second identical-params call; `compute_cache.py` no longer carries the 3-field positional signature.
- **F-γ receipts**: `docs/tranches/F/receipts/F-W3.json` exists with dry-run + apply + verification captures; `/opt/deploy/scripts/dispatch.sh` is GONE on host; 5 GitHub repo webhooks point to per-repo URLs; `speedtest.conf` is disabled.
- **F-δ a11y + SEO**: Lighthouse re-run shows `button-name: 0` failures; `meta-description` + `robots.txt` present on every route.
- **F-δ perf**: Lighthouse `unused-javascript` for `index-*.js` < 50 kB OR evidence of deeper route lazy-load; CM fonts served from self-host with `Cache-Control: immutable`.
- **F-ε transpositions**: `value.js/api/src/format/palette.ts` no longer carries `status` field (cross-repo paired PR); `api/scripts/run_pending_migrations.py` MIGRATIONS list removed (auto-discover); `web/src/lib/api.ts` `apiFetchWithETag` + `adminFetch` inlined.
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
- **C8** cross-cohort infra plan (constellation-wide) — fourier-relevant subset folds into F-γ; rest STAYS-OUT.
- **N3** W11 FULL palette-api → color rename — cosmetic; URL-layer GREEN; STAYS-OUT.
- **N4** csp-solver runtime URL — external repo (per FA2 §3 reframe: route-registration regression at sudoku-repo; ASK only); STAYS-OUT.
- **N7** floridify Mongo-bind upstream — external repo; STAYS-OUT.

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
