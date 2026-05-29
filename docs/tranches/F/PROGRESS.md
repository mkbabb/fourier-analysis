# F — progress log

Updated at every wave boundary. Reconciled against reality at W13 close.

## Goal of this log

Record what *actually happened* at each wave of fourier-tranche-F — the post-cohort hygiene tranche (API-vhost-correctness + compute-cache-symmetry + operator-window + UX-polish + chronic discharge) — so the close ceremony can reconcile claim against artefact without archaeology.

## Completion criterion

Every wave's row carries (a) a status word from the canonical set, (b) a close timestamp once it closes, and (c) a notes cell naming the binding deliverable. At W13 close every row reconciles against `FINAL.md`'s gate table. The 30-day named-residual stale-watch re-triggers at W13.

## Status board

| Wave | Status | Closed at | Notes |
|---|---|---|---|
| W0 — *Open + audit recap intake + named-carries restatement* | **CLOSED** | 2026-05-29 | `d08e515` — C4 chronic discharged: `ORT_LOGGING_LEVEL=3` at `api/__init__.py` (silences the onnxruntime warning flood at import; kills a 4-gate chronic). E closed CLEAN-Scenario-A re-confirmed; 6-lane F-development audit (FA1-FA6 + SYNTHESIS) is the binding baseline |
| Wα — *Research wave (3 lanes)* | **GREEN** | 2026-05-28 | workflow `w0ma5070c`; substrate at `docs/audits/runs/2026-05-28-F-research/`. R1 vhost archaeology → **origin-served** (host Apache → Docker nginx:alpine:8100 → SPA catch-all; `Server: nginx/1.29.5`, NO `cf-ray`); fix = surgical `location =` in tracked `nginx/fourier.conf`. R2 host-state captured (dispatcher 5-arm w/ latent-broken value.js arm; hooks.json single multiplex HMAC `89eadc1d…`; **gh token INVALID** → W3 split; speedtest :8140 enabled+404; cron running+fired 12:00:01 UTC; dangling=0). R3 → rate-limit is **enforce/report split** (read routes uncounted) not static-constant; cache refactor mechanical. All 3 RATIFIED-WITH-DELTA |
| Wχ — *Challenge* | **GREEN** | 2026-05-28 | **4 probes**: P1 inv-21 → **SPLIT W3** (INVALID gh token forces 2nd operator-gated window); P2 inv-22 → **REVISE** (/docs Swagger-HTML-OK; scope {fourier,color}; **NO F.W1 CF-pivot** — origin-served confirmed); P3 perf → **NARROW to font-pin-only** (route-lazy + self-host manufactured); P4 → F-T-N1 RATIFIED (doc-ASK), **F-T-E1 + F-T-S2 REJECTED** |
| W1 — *F-α API-vhost-correctness* | **CLOSED** | 2026-05-29 | `fa9cf75` (+ refinements `9ad3625`, `0a7a743`) — thread α. Surgical `location =` blocks (`/openapi.json`,`/docs`,`/redoc`→backend; `/health`→200 json; `/`→404 problem+json) BEFORE the SPA catch-all + rate-limit fused to a SINGLE enforce+report path (middleware calls `check()`; added `read_limiter`; method-aware; removed redundant per-route `Depends`/`.check()` across 5 routers). `9ad3625` widened `read_limiter` 240→1200/min + documented the proxy-IP shared-bucket residual; `0a7a743` made the deploy-hook health gate inv-22-aware (`/api/health`=ok AND `/`=404). 214/214 pytest. inv-22 5-check gate met — receipt `F-W1-vhost-correctness.txt` |
| W2 — *F-β compute-cache-symmetry* | **CLOSED** | 2026-05-29 | `0a0a45b` — thread β. `cache_key(contour_hash, params: dict)` canonical-JSON + `COMPUTE_VERSION`; wired `compute_bases` (was uncached); `epicycle_cache`→`compute_cache` rename; CACHE_HIT/MISS logging (closes E3 instrumentation residual) |
| W3a — *F-γ host-ops single-window* | **CLOSED** | 2026-05-29 | thread γ (no operator; receipt-only, no repo commit). **CHRONIC WEBHOOK REGRESSION ROOT-CAUSED + CLOSED** — the GitHub webhook secret was MISSING on all 5 constellation repos (lost in the deploy.babb.dev migration ~2 months ago) → GitHub never signed → receiver HMAC never fired → NO repo auto-deployed (host stuck at `6039e95`). Fix: secret restored on all 5; redelivered push TRIGGERED end-to-end (DEPLOY OK). Dead `:8140` speedtest vhost `a2dissite`d; dangling images pruned (0 after); T7 cron 12/12 PASS. Receipt `F-W3a-host-evidence.txt`. inv-21 single-window PASS |
| W3b — *F-γ GitHub-API cutover* | **CLOSED** | 2026-05-29 | thread γ (receipt-only). HARDENED to per-repo URLs (`/hooks/<repo>`) + per-repo HMAC secrets (closes survey S4; shared secret RETIRED). Verified: fourier push redelivered → HMAC OK → TRIGGERED → DEPLOY OK; 4 others ping → HMAC matched. **DEVIATION (documented):** `dispatch.sh` RETAINED — the 4 non-fourier repos route through it (they have not adopted `deploy-hook.sh`; that is the ζ.4 maintainer-owned ask). Receipt `F-W3b-per-repo-split.txt` |
| W4 — *F-δ.a a11y + SEO + bf-cache* | **CLOSED** | 2026-05-29 | `9bd80b3` — thread δ. aria-labels on AppHeader Reka trigger + UserSlugBar; `/visualize` label-content-name-mismatch fixed; `meta-description` + per-route meta via router afterEach + `robots.txt`. bf-cache audited (benign). vue-tsc + build green |
| W5 — *F-δ.b perf (NARROWED — font-pin only)* | **CLOSED** | 2026-05-29 | `9bd80b3` (same commit as W4) — thread δ. cm-web-fonts pinned `@latest`→immutable commit SHA `333f55e` in `web/index.html`; preconnect retained; NO new files. Route-lazy + self-host DEFERRED-as-manufactured (Wχ-P3 honored) |
| W6 — *F-ε.a chronic discharge (C9 + N2)* | **CLOSED** | 2026-05-29 | `ca9a751` — thread ε. C9 invariant numbering reconciled — authored `docs/tranches/INVARIANTS.md` canonical ledger (real collisions: C restarted at 18/19/20, F reused 21/22; non-destructive, no charter renumber) |
| W7 — *F-ε.b transposition (F-T-N1 ONLY)* | **CLOSED** | 2026-05-29 | `ca9a751` (same commit as W6) — thread ε. F-T-N1 cross-repo coordination ASK doc authored (value.js maintainer commits the `status` drop; inv-16 source boundary held). **F-T-E1 REJECTED** (static MIGRATIONS list kept); **F-T-S2 REJECTED** (E.W5 coreFetch collapse retained) |
| W8 — *F-ε.c auto-migration GREEN-verified* | **CLOSED** | 2026-05-29 | `a04f636` + `4007ec5` — thread ε. Auto-migration GREEN-verified via the deploy-hook. THREE latent defects (masked behind the first) fixed: (1) hook ran `compose exec api` but the service is `backend`; (2) base `python` had no motor → `uv run --no-sync python`; (3) runner read non-existent `MONGODB_URI` → `settings.mongo_uri` (inv-11); (4) in-process `module.main()` nested `asyncio.run` → subprocess-isolated. Result: 3 migrations SUCCESS via deploy-hook; idempotent re-run SKIPs verified. Receipt `F-W8-auto-migration.txt` |
| W9 — *F-ζ.1 deploy-repo spine-capture* | **CLOSED** | 2026-05-29 | thread ζ — `mkbabb/deploy` `7c4e96b` (ζ.1): host spine captured — `webhook.service`, `hooks.json.template` (secrets redacted), `dispatch.sh`, `deploy-dir-layout.md` |
| W10 — *F-ζ.2 per-repo HMAC secret split* | **CLOSED** | 2026-05-29 | thread ζ — `mkbabb/deploy` `7c4e96b` (ζ.2): `security/hmac-rotation.md`. Per-repo HMAC split EXECUTED on host at W3b (closes survey S4; shared secret retired) — receipt `F-W3b-per-repo-split.txt` |
| W11 — *F-ζ.3 standard templates* | **CLOSED** | 2026-05-29 | thread ζ — `mkbabb/deploy` `7c4e96b` (ζ.3): `templates/{deploy-hook.sh, docker-compose.hardening.yml, ci.yml, env.example}` + `cf/{dns-cf-sync.sh, pages-deploy.sh}` |
| W12 — *F-ζ.4 cross-repo adoption asks* | **CLOSED** | 2026-05-29 | `d98da91` — thread ζ. `docs/constellation/ADOPTION-ASKS.md` (7 maintainer-owned asks) + receipts. Coordination only — NOT fourier-F source commits (inv-16) |
| W13 — *Close + stale-watch re-trigger* | **CLOSED** | 2026-05-29 | THIS CLOSE — reconciled PROGRESS; authored `F/FINAL.md`; re-triggered E's 30-day named-residual review; recorded F's 3 residuals + the 7 adoption asks as named-residuals; CANONICAL-ORDERING → ordering θ′ |

## Log

### 2026-05-29 — F executed + closed

**WHAT.** F ran end-to-end and CLOSED. Fourier HEAD `d98da91`; deploy-repo HEAD `7c4e96b`. All 14 wave rows (W0, W1, W2, W3a, W3b, W4–W12, W13) CLOSED; T7 12/12 PASS; pytest 214/214; vue-tsc + build green.

**The planned surface landed:** W0 C4 onnxruntime suppression (`d08e515`); W1 α nginx surgical `location =` blocks + the rate-limit single enforce+report fuse (`fa9cf75`, refined `9ad3625`/`0a7a743`); W2 β compute-cache-symmetry — parametric key + `compute_bases` wired + `epicycle_cache`→`compute_cache` (`0a0a45b`); W4/W5 δ a11y + SEO + font-pin (`9bd80b3`); W6/W7 ε C9 invariant ledger (`docs/tranches/INVARIANTS.md`) + F-T-N1 cross-repo ASK (`ca9a751`); W9–W11 ζ deploy-spine capture into `mkbabb/deploy` (`7c4e96b`); W12 ζ.4 `ADOPTION-ASKS.md` (`d98da91`).

**THREE discovered deploy-chain root-cause fixes** (the highest-impact finding — the constellation's auto-deploy was BROKEN, not merely un-hardened):
1. **Stale `web/vendor` COPY** (`60f1f89`) — commit `163ca47`'s deps-migration to published `@mkbabb/*` npm versions removed `web/vendor` but left `COPY web/vendor ./vendor` in `web/Dockerfile` → broke EVERY Docker build → the host was stuck at `6039e95`.
2. **Drifted `web/package-lock.json`** (`37da6f0`) — lockfile was missing `openapi-typescript@7.13.0` + its tree → `npm ci` failed (latent since E).
3. **The 3-layer W8 auto-migration defect** (`a04f636` + `4007ec5`) — three latent defects masked behind the first: deploy-hook targeted service `api` (is `backend`); base `python` had no motor (→ `uv run --no-sync python`); runner read non-existent `MONGODB_URI` (→ `settings.mongo_uri`, inv-11); plus in-process `asyncio.run` nesting (→ subprocess isolation). 3 migrations recorded SUCCESS via the deploy-hook; idempotent SKIPs verified.

**The chronic webhook-secret regression — ROOT-CAUSED + CLOSED (thread γ, W3a/W3b).** The GitHub webhook secret was MISSING on all 5 constellation repos (lost in the deploy.babb.dev migration ~2 months ago) → GitHub never signed → the receiver HMAC trigger never fired → NO repo auto-deployed (the host was stuck at `6039e95`; F was deployed manually throughout). Fix: secret restored on all 5, then HARDENED to per-repo URLs (`/hooks/<repo>`) + per-repo HMAC secrets (closes survey S4; shared secret retired). fourier push redelivered → TRIGGERED → DEPLOY OK; 4 others ping → HMAC matched. **DEVIATION (documented):** `dispatch.sh` RETAINED — the 4 non-fourier repos route through it pending their ζ.4 adoption of `deploy-hook.sh`.

**Residuals booked (FINAL §5):** real-client-IP resolution behind the 2-hop Apache→nginx chain (rate limiter keys on proxy IP → shared global bucket; `read_limiter`=1200 is safe global headroom; per-client needs nginx real_ip + XFF-hop resolver — successor infra wave); the 7 cross-repo adoption asks (`ADOPTION-ASKS.md`, maintainer-owned); `dispatch.sh` full retirement (gated on all 4 non-fourier repos adopting `deploy-hook.sh`). E's 30-day named-residual stale-watch re-triggered.

### 2026-05-28 — thread ζ added (constellation deploy standardization folded into F)

**WHAT.** User directive: "normalize the CI and webhook process, ensure security thereof; create a repo for these deploy processes if need be, or at the very least standardize them — docker, CF Pages, mbabb hosting, across the constellation (value.js, words, fourier, sudoku)."

A READ-ONLY 4-lane parallel survey (`docs/audits/runs/2026-05-28-constellation-survey/SURVEY-FINDINGS.md`) grounded the design. Findings: the constellation TOPOLOGY is normalized (D-era) but the PROCESS is not — 3 frontend-hosting patterns, 3 deploy-trigger patterns, 3 CI maturity levels, a docker-hardening gradient, divergent secrets; **root cause: the deploy spine is version-controlled in NO repo** (only host state). (The survey initially flagged S1 floridify `pk_*` + S2 speedtest `cfat_*` as committed-credential exposures — both WITHDRAWN 2026-05-28: nothing needs rotating; `pk_*` is publishable by design, the `cfat_*` is non-sensitive.)

**User decisions** (via AskUserQuestion):
1. Deploy home → **dedicated PRIVATE repo `mkbabb/deploy`** (created `e3b16d8`; charter seeded).
2. S1/S2 → **WITHDRAWN** (maintainer: nothing needs rotating — `pk_*` publishable, `cfat_*` non-sensitive); recorded resolved, no action.
3. Tranche → **fold into fourier-F as thread ζ**, granular waves as needed.

**Folded:** F grows from 5 → 6 threads; W-schedule 13 → 17 slots (ζ.1 spine-capture W9, ζ.2 per-repo-HMAC W10, ζ.3 templates W11, ζ.4 adoption-asks W12, close → W13). The **C8 5-gate chronic NOW DISCHARGES via ζ** (the user's "normalize across the constellation" IS the C8 re-mandate). N4 (csp-solver) + N7 (floridify) reclassify from STAYS-OUT to the F-ζ.4 maintainer-owned adoption-ask ledger. inv-16 preserved: fourier-F commits touch only `fourier-analysis/**` + `deploy/**`.

Design substrate: `docs/constellation/DEPLOY-STANDARDIZATION-DESIGN.md`. The `mkbabb/deploy` README is the contract; spine-capture + template authoring is F-ζ EXECUTION (gated on F authorization — not run here).

### 2026-05-28 — tranche authored (6-lane F-development audit + SYNTHESIS)

**WHAT.** Following the E + I cohort close (Scenario A; T7 12/12 PASS; CANONICAL-ORDERING ordering η), the user directed a 6-agent parallel audit:

> "Deploy 6 agents in parallel to lighthouse test each page, in both prod and dev — verify all functionality — report back and fold into the above with a new tranche hereof. DEEPLY audit with 6 agents in parallel our original plan and waves thereof, alongside all changes made herein. Devise a path forward: audit the hitherto made changes and the remaining plan; recapitulate our original prompts, plans, and precepts: NO quick solutions, NO workarounds: idiomatic, gestalt approaches. … NO legacy code. Delineate any chronically deferred items and fold them into this new tranche. Delineate any deferred items and fold them into this new tranche. Recap ALL of our prompts and requests hitherto and ensure they've been addressed. This is NOT an implementation phase. Tranche development only. Workflow."

The audit ran as 6 lanes `FA1–FA6` + a SYNTHESIS at `docs/audits/runs/2026-05-28-F-audit/`. Run ID `wnjru1x3a` — 7 agents, 121 tool uses, 4.7 min, 323k tokens.

**Verdict (FA3):** E close HOLDS UNDER FALSIFICATION. 12/12 of the live-probable gates reproduce; the 1 doc-trusted gate (W11 host cron) carries a TRUST-DELTA discharged by manual probe re-run.

**Surfaced findings — five threads:**

- **α API-vhost-correctness** — FA1 §5 F-API-1: `api.fourier.babb.dev/{/, /health, /docs}` serves a stale 28-May SPA index.html via nginx try_files misconfig. **HIGH severity prod regression** (not hygiene). F-API-2: rate-limit headers static (`Remaining: 10` after 25-burst).
- **β compute-cache-symmetry** — FA5 §2 F-T-S1: `compute_cache.py` keys on 3-field positional contract; `compute_bases` has the same shape but ZERO caching. Parametric collapse + bases wiring is the single highest-leverage transposition F surfaces.
- **γ operator-window-consolidation** — FA4 §5 #2: single SSH session discharges T-S3 host-flip + value.js dispatcher arm delete + `:8140` speedtest vhost + cron evidence capture (FA3 trust-delta).
- **δ UX + a11y + perf polish** — FA1 §5: LCP 7.2–8.1 s on 20 ms-server pages; `button-name` failures across 3 routes; missing `meta-description` + `robots.txt`; CM fonts on jsdelivr (40 kB cache waste).
- **ε chronic + transpositions + auto-migration GREEN-verified** — FA4 §5 + FA5 §2 + FA3 §6 F-FA3-5: C4 onnxruntime + C9 numbering + N2 CF wildcard + F-T-N1/E1/S2 transpositions + W8 auto-migration trigger.

**Two new F invariants (by name):**
- **inv-21 — post-cohort-hygiene-bounded** — each F thread single-PR or single-SSH-session bound; <800 LOC delta OR host-ops single-window receipt.
- **inv-22 — vhost-correctness-symmetric** — both `api.fourier.babb.dev` and `api.color.babb.dev` return JSON (problem+json on error) on `/`, `/health`, `/docs`, `/openapi.json` — never SPA index.

**Prompts ledger (FA6):** 58 prompts across A-E + post-E (EA4's 55 + EE1/EE2/EE3); 56 ADDRESSED-COMPLETELY; 0 PARTIAL; 2 ROUTED-TO-F (EE3 = this audit's authoring directive — IS the F substrate); 0 OUTSTANDING. 10/10 precepts holding; one systemic slip identified — **fix-at-ROOT clustering at operator-window deferrals** — which F consolidates into the single operator-window wave (γ) with stale-watch trigger.

**Wave set:** 5 threads across W0 → Wα → Wχ → W1-W8 → W12 (12 wave slots). Research-first gate (W0 → Wα → Wχ) governs α + γ; β/δ/ε direct but still pass Wχ for inv-21/inv-22 KISS-cert.

**The 15-item must-NOT list** (SYNTHESIS §4) caps the F scope. New items: no new architectural lifts (#1); no manufactured transpositions (#3); no host SSH mutation without dry-run + receipt (#8); no SPA-index bleed on API vhosts (#9); no operator-window thread expansion past one SSH session (#10); no Idempotency-Key API-side middleware in F (#14).

**Cohort framing:** F is single-repo. value.js-I closed Scenario A; no peer required. Cross-repo touchpoints are ASK-only (csp-solver route-registration regression; F-T-N1 paired demo PR).

### 2026-05-28 — F research-first audit GREEN (Wα + Wχ DONE; charter hardened)

**WHAT.** User directed: "workflow to perform the audit to INFORM F now." Dispatched workflow `w0ma5070c` (8 agents, 54 tool uses, 3.8 min, 211k tokens): Wα 3 research lanes (R1 vhost archaeology + R2 host-state capture + R3 rate-limit/cache diagnosis) → Wχ 4 challenge probes (P1 inv-21 + P2 inv-22 + P3 perf + P4 transpositions) → SYNTHESIS hardening the wave specs. All READ-ONLY (live probes + host SSH capture + source reads; no mutation).

**Verdict: F charter SURVIVES as RATIFIED-WITH-DELTA.** No thread killed; **F.W1 does NOT pivot** (stale SPA is origin-served, not CF Pages). Five binding deltas folded:

1. **F.W1 thread-shape HOLDS** (P2 §4): `api.fourier.babb.dev/` returns `Server: nginx/1.29.5`, NO `cf-ray` → origin-served (host Apache → Docker nginx:alpine:8100 → SPA catch-all). Fix = surgical `location =` blocks in the TRACKED `nginx/fourier.conf` (live container config is drifted/stripped — predates it) + `location = /` → 404 problem+json + container recreate. NOT a CF config change.
2. **inv-21 → W3 SPLIT** (P1): gh token INVALID → 5 webhook URLs can't flip this session. W3 → **W3a** (host-ops single-window, executable now) + **W3b** (operator-gated on `gh auth login`; dispatcher MUST NOT delete until URLs flip).
3. **inv-22 → REVISED** (P2): `/docs` Swagger-HTML-OR-404-JSON is conformant (real UI route); the real invariant is "no SPA-index at API paths" (byte-identical-HTML-across-paths is the tell); scope enforced surface to {fourier, color} — sudoku is documentary-only (external repo).
4. **F-δ.b → NARROWED to font-pin** (P3): app is already fully `() => import()` lazy; the 85 kB is irreducible shell; LCP 7-8s is a CF-cold-edge/font-fetch artifact, NOT bundle. Self-host is net ADD (3 git binaries + no FOUT win). Only defensible action: pin `cm-web-fonts@latest` → immutable SHA. Route-lazy + self-host DEFERRED-as-manufactured.
5. **ε transpositions → 2 of 3 REJECTED** (P4): F-T-N1 RATIFIED (doc-only ASK; inv-16 holds). **F-T-E1 REJECTED** — auto-discover destroys load-bearing `(name, version)` version-bump idempotency (`MIGRATION_VERSION` exists in zero modules). **F-T-S2 REJECTED** — E.W5 already collapsed 4 helpers into `coreFetch`; inlining would fan 2 helpers into 20 sites (net +LOC, reverses a shipped REDUCE).

**Also confirmed**: the rate-limit defect is finer than FA1's "static constant" framing — it's an enforce/report SPLIT (read routes carry no limiter dependency → bucket uncounted → `snapshot()` honestly reports empty). Fix = fuse `check()` into the header middleware à la value.js `rate-limit.ts:91-116` (strengthens the cross-repo-cohesion thesis: F.W1 IS a transposition of the shipped palette-api pattern).

Research substrate persisted at `docs/audits/runs/2026-05-28-F-research/` (8 lane docs). Charter (F.md), PROGRESS (this), §6 gates all hardened.

**Execution-readiness**: W1 / W2 / W3a / W4 / W5(narrowed) / W6 / W7(F-T-N1-only) / W8 are GREEN-to-execute on authorization. **W3b alone is operator-gated** (out-of-band `gh auth login`).

### 2026-05-28 — gh auth VALIDATED; W3b UNBLOCKED

User: "gh has been logged in — validate." Confirmed:
- `gh auth status` → logged in, account `mkbabb`, `repo` scope, ssh protocol.
- Live webhook read across all 5 constellation repos succeeds (read capability proven).
- All 5 repos carry exactly one webhook → the single multiplex `https://deploy.babb.dev/hooks/deploy` (hook IDs 603157401-405).
- `update-webhook-urls.sh` dry-run PASSES (pre-flight gh-auth gate that hard-failed at Wα-R2 now succeeds); correctly identifies all 5 PATCH ops to per-repo URLs.

**Effect**: the out-of-band operator block that forced W3b's GATED status is RESOLVED. W3b is now **GREEN-pending-W3a** (the W3a/W3b split holds only for the hard-ordering reason — host receiver entries must be staged before the GitHub URLs flip; the dispatcher must not delete until all 5 flip). Pre-flight rollback anchor captured at `receipts/F-W3-preflight.json`.

Full execution-readiness now: **W1 / W2 / W3a → W3b / W4 / W5(narrowed) / W6 / W7(F-T-N1) / W8 all GREEN-to-execute on authorization.** No remaining operator-gated waves.

### Next action

None until the user authorises **F.W0** (or W1 directly — the research-first gate is GREEN). **This was tranche development only; no implementation ran** — the research lanes were READ-ONLY (probes + captures, no mutation). At authorization, dispatch W1 (α origin-nginx + rate-limit fuse) first.
