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
| Wα — *Research wave (3 lanes)* | planned | — | **R1** nginx vhost archaeology on `api.fourier.babb.dev` (what is the try_files fallback; what is the desired post-state per inv-22); **R2** host-state capture (current `/opt/deploy/scripts/dispatch.sh` + `hooks.json` + 5 GitHub webhook URLs + `:8140` speedtest vhost) BEFORE mutation; **R3** rate-limit-middleware diagnosis (FA1 F-API-2) |
| Wχ — *Challenge* | planned | — | **4 probes** (4-agent ceiling): P1 inv-21 holds per-thread; P2 inv-22 is cross-constellation pattern; P3 F-δ.b perf observational not manufactured; P4 F-T-N1+F-T-E1+F-T-S2 KISS-honest REDUCE |
| W1 — *F-α API-vhost-correctness* | provisional | — | thread α — nginx vhost fix (non-`/api/*` returns 404 JSON or proxies `/docs` honestly); rate-limit middleware emits dynamic `RateLimit-*`; inv-22 gate first lands |
| W2 — *F-β compute-cache-symmetry* | provisional | — | thread β — `compute_cache.py` params-dict refactor; `compute_bases` wired through cache; `db.epicycle_cache` → `db.compute_cache` rename; hit-rate logging emits on cache-hit |
| W3 — *F-γ operator-window* | provisional | — | thread γ — single SSH session: T-S3 host-flip (5 webhook URLs + dispatcher delete) + `:8140` vhost teardown + cron evidence + dangling-image discipline; receipts at `receipts/F-W3.json` |
| W4 — *F-δ.a a11y + SEO + bf-cache* | provisional | — | thread δ — `button-name` aria-labels on AppHeader; `meta-description` + `robots.txt`; bf-cache audit |
| W5 — *F-δ.b perf* | provisional | — | thread δ — self-host CM fonts under `/assets/fonts/` with `Cache-Control: immutable`; deeper route-level lazy-load; Lighthouse `unused-javascript` < 50 kB on `index-*.js` |
| W6 — *F-ε.a chronic discharge (C9 + N2)* | provisional | — | thread ε — C9 invariant numbering reconciliation across A.md/B.md/C.md/D.md/E.md + precepts; N2 CF wildcard narrow |
| W7 — *F-ε.b transpositions* | provisional | — | thread ε — FA5 F-T-N1 (drop legacy `status` from `FormattedPalette`; paired demo PR); F-T-E1 (auto-discover `migrate_*.py`); F-T-S2 (inline `apiFetchWithETag` / `adminFetch`) |
| W8 — *F-ε.c auto-migration GREEN-verified* | provisional | — | thread ε — trigger one real (or no-op) migration deploy; capture `migrations` collection write; upgrade W9-from-E to GREEN-verified |
| W12 — *Close + stale-watch re-trigger* | provisional | — | reconcile PROGRESS; `F/FINAL.md` (§0→§9); re-trigger E's 30-day named-residual review; CANONICAL-ORDERING → ordering θ |

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

### Next action

None until the user authorises **F.W0**. The 6-lane audit + SYNTHESIS + charter + this PROGRESS seed are complete. At that point dispatch F.W0 (baseline + audit intake + C4 1-liner) → Wα (3 research lanes) → Wχ (4 probes) — the research-first gate governs α + γ before any source change. **This was tranche development only; no implementation ran**.
