# F — progress log

Updated at every wave boundary. Reconciled against reality at W12 close.

## Goal of this log

Record what *actually happened* at each wave of fourier-tranche-F — the post-cohort hygiene tranche (API-vhost-correctness + compute-cache-symmetry + operator-window + UX-polish + chronic discharge) — so the close ceremony can reconcile claim against artefact without archaeology.

## Completion criterion

Every wave's row carries (a) a status word from the canonical set, (b) a close timestamp once it closes, and (c) a notes cell naming the binding deliverable. At W12 close every row reconciles against `FINAL.md`'s gate table. The 30-day named-residual stale-watch re-triggers at W12.

## Status board

| Wave | Status | Closed at | Notes |
|---|---|---|---|
| W0 — *Open + audit recap intake + named-carries restatement* | planned | — | E closed CLEAN-Scenario-A re-confirmed (T7 12/12 PASS reproducible); 6-lane F-development audit (FA1-FA6 + SYNTHESIS at `docs/audits/runs/2026-05-28-F-audit/`) committed as binding baseline; C4 `ORT_LOGGING_LEVEL=3` 1-liner LANDS as cheapest chronic-discharge |
| Wα — *Research wave (3 lanes)* | **GREEN** | 2026-05-28 | workflow `w0ma5070c`; substrate at `docs/audits/runs/2026-05-28-F-research/`. R1 vhost archaeology → **origin-served** (host Apache → Docker nginx:alpine:8100 → SPA catch-all; `Server: nginx/1.29.5`, NO `cf-ray`); fix = surgical `location =` in tracked `nginx/fourier.conf`. R2 host-state captured (dispatcher 5-arm w/ latent-broken value.js arm; hooks.json single multiplex HMAC `89eadc1d…`; **gh token INVALID** → W3 split; speedtest :8140 enabled+404; cron running+fired 12:00:01 UTC; dangling=0). R3 → rate-limit is **enforce/report split** (read routes uncounted) not static-constant; cache refactor mechanical. All 3 RATIFIED-WITH-DELTA |
| Wχ — *Challenge* | **GREEN** | 2026-05-28 | **4 probes**: P1 inv-21 → **SPLIT W3** (INVALID gh token forces 2nd operator-gated window); P2 inv-22 → **REVISE** (/docs Swagger-HTML-OK; scope {fourier,color}; **NO F.W1 CF-pivot** — origin-served confirmed); P3 perf → **NARROW to font-pin-only** (route-lazy + self-host manufactured); P4 → F-T-N1 RATIFIED (doc-ASK), **F-T-E1 + F-T-S2 REJECTED** |
| W1 — *F-α API-vhost-correctness* | provisional (hardened) | — | thread α — tracked `nginx/fourier.conf` surgical `location =` blocks (`/openapi.json`,`/docs`,`/redoc`,`/health` → backend; `location = /` → 404 problem+json) BEFORE SPA catch-all + container recreate; rate-limit FUSE `check()` into `RateLimitHeaderMiddleware` à la value.js `rate-limit.ts:91-116`; inv-22 5-check gate |
| W2 — *F-β compute-cache-symmetry* | provisional (hardened; mechanical) | — | thread β — `cache_key(contour_hash, params: dict)` canonical-JSON + `COMPUTE_VERSION`; wire `compute_bases`; `epicycle_cache` → `compute_cache` (bare rename intentionally abandons old docs — TTL≤7d + fail-open); HIT/MISS logging |
| W3a — *F-γ host-ops single-window* | provisional | — | thread γ (no operator) — backup + author 5 per-repo hooks.json entries + reload (STAGED not activated); `a2dissite speedtest.conf`; cron + dangling capture; `receipts/F-W3a.json`. inv-21 PASS |
| W3b — *F-γ GitHub-API cutover* | **GREEN-pending-W3a** | — | thread γ — **gh auth NOW VALID** (operator logged in 2026-05-28; dry-run passes; pre-flight receipt `receipts/F-W3-preflight.json`; 5 hooks IDs 603157401-405 → `/hooks/deploy`). `update-webhook-urls.sh --apply` (5 URLs → per-repo) → hook tests → `rm dispatch.sh` (value.js arm dies with it); `receipts/F-W3b.json`. HARD ordering: no dispatcher delete pre-URL-flip; W3a stages host entries first |
| W4 — *F-δ.a a11y + SEO + bf-cache* | provisional | — | thread δ — `button-name` aria-labels on AppHeader Reka dropdown + `.btn-pill`; `meta-description` + `robots.txt`; `label-content-name-mismatch` on `/visualize`; bf-cache audit |
| W5 — *F-δ.b perf (NARROWED — font-pin only)* | provisional (narrowed) | — | thread δ — pin `cm-web-fonts@latest` → `@<immutable-sha>` in `web/index.html`; keep preconnect; NO new files. Route-lazy + self-host DEFERRED-as-manufactured (Wχ-P3 KISS-gate withheld sign-off) |
| W6 — *F-ε.a chronic discharge (C9 + N2)* | provisional | — | thread ε — C9 invariant numbering reconciliation across A.md/B.md/C.md/D.md/E.md + precepts; N2 CF wildcard narrow |
| W7 — *F-ε.b transposition (F-T-N1 ONLY)* | provisional (revised) | — | thread ε — F-T-N1 doc-only ASK (value.js maintainer commits `status` drop; inv-16). **F-T-E1 REJECTED** (keep static MIGRATIONS list); **F-T-S2 REJECTED** (E.W5 coreFetch collapse retained) |
| W8 — *F-ε.c auto-migration GREEN-verified* | provisional | — | thread ε — trigger one real (or no-op) migration deploy; capture `migrations` collection write; upgrade W9-from-E to GREEN-verified |
| W12 — *Close + stale-watch re-trigger* | provisional | — | reconcile PROGRESS; `F/FINAL.md` (§0→§9); re-trigger E's 30-day named-residual review; CANONICAL-ORDERING → ordering θ′ |

## Log

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
