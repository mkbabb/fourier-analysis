# F-development synthesis (2026-05-28; post-E close)

**Status**: AUTHORED 2026-05-28 — the 6-lane F-development audit closes; tranche-F charter folds the findings. **Authority**: this doc consolidates the 6 lanes (`FA1–FA6.md`) and binds the tranche-F thread set + wave shape + must-NOT list + cohort framing. **Mode**: tranche development only — NOT an implementation phase. **Predecessors**: fourier-E + value.js-I, both CLOSED 2026-05-28 Scenario A.

## §0 — Headline verdict

**E close HOLDS post-audit.** FA3 reproduced 12/12 of the live-probable gates (T7 conformance probe, W1 CORS, W4 SOTA envelopes, W5 `as unknown as` zero, W6 demo URL); the single doc-trusted gate (W11 host cron) carries a TRUST-DELTA discharged by manual probe re-run from any cwd. No silent overclaim invalidates the cohort.

**Net delta surfaced by FA1-FA6:**

- FA1 surfaced one HIGH-severity prod regression: `api.fourier.babb.dev/{/, /health, /docs}` serves a stale 28-May SPA index.html (nginx try_files fallback misconfig on the API vhost) — load-bearing because it hides the canonical FastAPI surface behind a 200-with-wrong-content-type.
- FA1 surfaced rate-limit headers returning static constants (`Remaining: 10` after 25-burst on `/api/visualizations`) — middleware wiring gap.
- FA1 surfaced LCP 7.2–8.1 s on 20 ms-server pages: 110 kB unused JS shipped to first paint despite W7 T-P1's 6-chunk split.
- FA2 reframed the E.W6 csp-solver ASK as a **sudoku-repo route-registration regression**, not infra; STAYS-OUT of F source.
- FA4 deduped 33 unique residuals down to a 5-item load-bearing F surface (4 ssh-session-sized + 1 doc-PR).
- FA5 found the highest-leverage transposition (compute_cache parametric collapse + bases wiring) AND rejected the seductive "katex lazy on `/paper`" as manufactured elegance (EquationPanel mounts on `/visualize`).
- FA6 identified ONE systemic slip: fix-at-ROOT clustering at operator-window deferrals.

**F is needed for**: (a) the FA1 nginx API-vhost fallback regression (real prod bug, not hygiene); (b) operator-window consolidation of named-residuals (T-S3 host-flip + value.js dispatcher arm + :8140 vhost + dangling-image discipline); (c) the compute_cache parametric collapse from FA5; (d) Lighthouse / UX polish from EE3 + a11y `button-name` fixes; (e) auto-migration GREEN-verified via real migration trigger.

## §1 — F thread set (5 threads; KISS-honest)

**F-α (API-vhost-correctness)** — Fix the `api.fourier.babb.dev` nginx fallback so non-`/api/*` paths return 404/JSON (or expose `/docs` honestly), eliminating the stale-SPA-bleed regression. Binding: FA1 §2 row 6 + §5 F-API-1. Pairs with FA1 F-API-2 (rate-limit middleware wiring).

**F-β (compute-cache-symmetry)** — Land FA5's F-T-S1: collapse `compute_cache.py` from 3-field positional contract to `params: dict` (canonical-JSON sorted), wire `compute_bases` through the same cache, rename `db.epicycle_cache` → `db.compute_cache`. Binding: FA5 §2 F-T-S1 + W7 named asymmetry.

**F-γ (operator-window-consolidation)** — Single SSH session that discharges N1 (value.js dispatcher arm delete) + E1 (T-S3 host-flip via `update-webhook-urls.sh --apply`) + C8-host-subset (`:8140` speedtest vhost teardown + dangling-image discipline check) + the host-cron evidence capture (FA3 F-FA3-1 / F-FA3-3: `crontab -l | grep conformance` + `tail conformance-probe.log`). Binding: FA4 §5 items #2-#3 + FA3 §6 F-FA3-1/F-FA3-3 + FA5 F-T-S3.

**F-δ (UX + a11y + perf polish)** — FA1 surfaced floor: `button-name` failures on AppHeader Reka dropdown trigger + `.btn-pill`; `label-content-name-mismatch` on `/visualize`; missing `meta-description` + `robots.txt`; LCP 7.2–8.1 s with 85 kB unused on `index-veNzjUth.js` + 25 kB on Tooltip chunk; CM fonts on jsdelivr (40 kB cache waste). Per-route lazy-load deeper than W7 reached; self-host CM fonts under `/assets/fonts/` with `immutable` cache. Binding: FA1 §5 F-A11Y-1 + F-PERF-1 + F-PERF-2 + F-SEO-1.

**F-ε (auto-migration GREEN-verified + chronic discharge sweep)** — Trigger one real (or no-op) migration to upgrade W9 from GREEN-pending-real-test to GREEN-verified (FA3 F-FA3-5); land C4 `ORT_LOGGING_LEVEL=3` one-liner (FA4 §5 #1); land C9 invariant numbering doc-PR across A-E + precepts (FA4 §5 #5); narrow CF wildcard `*.babb.dev` per N2 (FA4 §5 #4); apply FA5 F-T-N1 (drop legacy `status` from `FormattedPalette` — paired demo PR; the I.W4 deadline already passed); apply FA5 F-T-E1 (auto-discover `migrate_*.py`); apply FA5 F-T-S2 (inline `apiFetchWithETag` / `adminFetch`).

5 threads. NOT 6, NOT 7. F-δ and F-ε are wide threads but each is bounded — they hold no architectural lift, just the polish + chronic-sweep that EE3 mandated and that E left as operator-shaped residue.

## §2 — F invariants (2 new)

**inv-21 (post-cohort-hygiene-bounded)** — Each F thread must have a single-PR or single-SSH-session bound. Threads that exceed one session of work without a wave split are evidence of manufactured scope and must be re-decomposed. Rationale: F is post-cohort hygiene; the 5-item load-bearing surface from FA4 §6 is the binding ceiling. Gate: each thread's W-close requires < 800 LOC delta OR documented host-ops single-window receipt.

**inv-22 (vhost-correctness-symmetric)** — Both `api.fourier.babb.dev` and `api.color.babb.dev` (and any future constellation API vhost) must return JSON (problem+json on error) for `/`, `/health`, `/docs`, `/openapi.json` — never an SPA index. Rationale: FA1 §5 F-API-1 found this regression on fourier; FA2 §3 found nginx SPA-fallback on sudoku eating `/health` and `/openapi.json` at the apex. Cross-constellation pattern. Gate: each API vhost passes `curl -sI <host>/ -H 'Accept: application/json' | grep -i 'content-type: application/json'` and `curl <host>/health | jq .status`.

(No further invariants. The E invariants 1-20 remain binding; F adds the operational-correctness clamp and the bounded-scope clamp.)

## §3 — F wave shape (provisional)

```
W0   — open + audit recap intake (FA1-FA6 fold) + named-carries restatement
Wα   — research-first: nginx vhost diagnosis + auto-migration drill-plan + W11 cron evidence capture
       (research gate REQUIRED for F-α + F-γ host-side per FA3 + FA4)
Wχ   — challenge: KISS-audit the 5 threads; reject any drift into rework
W1   — F-α land (api.fourier.babb.dev vhost correctness + rate-limit middleware wiring) [inv-22 first land]
W2   — F-β land (compute_cache parametric collapse + bases wiring per FA5 F-T-S1)
W3   — F-γ host operator window (T-S3 + value.js arm + :8140 + cron evidence) [single SSH session]
W4   — F-δ.a a11y + SEO + bf-cache (button-name + meta-description + robots.txt)
W5   — F-δ.b perf (deeper route-lazy + CM font self-host) [observational floor; KISS-gated]
W6   — F-ε.a chronic discharge (C4 onnxruntime + C9 numbering + N2 CF wildcard)
W7   — F-ε.b transpositions (F-T-N1 + F-T-E1 + F-T-S2; paired demo PR for F-T-N1)
W8   — F-ε.c auto-migration GREEN-verified (trigger one real migration; capture `migrations` write)
W12  — FINAL.md + close + stale-watch (re-trigger E's 30d named-residual review here)
```

Research-first (Wα) gates F-α (nginx config archaeology before touching live vhost) and F-γ host-side (capture state before mutating). FA5 F-T-S1 (F-β) is research-light — the diff is mechanical once the param-dict shape is fixed. F-δ.b perf is observational — Wχ must KISS-gate it against the W7 outcome (the 854 kB → 6 chunks split already discharged the headline; further perf is decorative unless evidence of regression).

12 wave slots. Shorter than D (12) and E (14); honest given 5 threads with one host-window collapse.

## §4 — Must-NOT list for F (binding; ≥15)

Inheriting E's must-NOTs + F-specific:

1. **NO new architectural lifts.** F is post-cohort hygiene. Re-architecture surfaces require their own tranche.
2. **NO cross-repo source mixing** (inv-16). C5/C6 (glass-ui), N4 (csp-solver), N7 (floridify), E6/E7 (value.js-J) STAY-OUT.
3. **NO manufactured transpositions.** FA5 F-T-P1 (katex lazy on `/paper` only) and F-T-E2 (per-call-site `types.ts` migration) are REJECTED-AS-DECORATIVE — do not revive.
4. **NO chronic-3+ pulls without HARD-discharge or STAYS-OUT-with-rationale.** Every chronic from FA4 §3 has explicit disposition; no silent carry.
5. **NO legacy/fallback re-introduction** (inv-20, NO-fallback). F-T-N1 drops `status`; do not restore a `(tier ?? status)` fallback at any call-site.
6. **NO `as unknown as` re-introduction.** W5 retired both; F-ε must not regress.
7. **NO interactive git commands** (`-i`, `--amend` without reason). Inherit E.
8. **NO host SSH mutation without dry-run + receipt capture.** F-γ requires `--dry-run` first; receipt JSON saved under `docs/tranches/F/receipts/`.
9. **NO SPA-index bleed on API vhosts** (inv-22). Any nginx / Apache config change at F-α must be verified by the §2 inv-22 gate before close.
10. **NO operator-window thread expansion past one SSH session.** If F-γ requires a second window, split into F-γ.a / F-γ.b; do not silently widen the wave.
11. **NO archaic-diction reduction.** Memory feedback explicit; therein/heretofore/corporeal/basal remain.
12. **NO `---` em-dash substitution in LaTeX source.** Memory explicit; `—` U+2014.
13. **NO standalone perf-thread expansion at W5 without Wχ KISS-gate sign-off.** F-δ.b is the manufactured-scope hot spot.
14. **NO Idempotency-Key API-side middleware in F.** Routed to I-tail per E5; F documents the carry only.
15. **NO Playwright cross-env matrix expansion** beyond named DEFERRED hygiene (E2). If matrix lands at all, it's a single CI-config delta, not a test-rewrite.

## §5 — Cohort framing

**Single repo.** value.js-I closed Scenario A paired with E; the cohort handshake is discharged. No peer repo required.

**Cross-repo ASKs (recorded; STAY-OUT of source):**

- **csp-solver**: FA2 §3 found the E.W6 ASK was a misdiagnosis — backend live and healthy at `/api/v1/health` but `solve`/`openapi`/`docs` routes not registered. F surfaces this as an ASK to the sudoku-repo maintainer (1-line `app.include_router`) — NOT F's source work.
- **floridify** (N7): Mongo-bind upstream commit; STAYS-OUT.
- **glass-ui** (C5/C6): 7-item substrate carries + cold-boot race; CONSTELLATION discipline forbids fourier annexation; STAYS-OUT.
- **value.js-J** (E6/E7): per-repo conformance suite + `id` field hard-removal; STAYS-OUT.

**Post-cohort hygiene framing**: F sits in the trough between E (cohort completion) and any future re-architecture (none scheduled). The F-mandate from EE3 ("DEEPLY audit… fold into a new tranche") is satisfied by the 5-thread shape — wider would be manufactured.

## §6 — Folded-OUT items (REJECTED-from-F; ruthless)

- **C1** colour-lift `sampleToSVGPath` — value.js publish-bound; consumer-half latent. STAYS-OUT.
- **C2** Palette/colorScale domain model — inv-15 binding (no library nobody calls); zero consumer surfaced. STAYS-OUT.
- **C5, C6** glass-ui substrate carries + cold-boot race — inv-16 cross-repo. STAYS-OUT.
- **C7** §U conformance strikes — KISS / never-built-by-design. STAYS-OUT.
- **C8** cross-cohort infra plan (constellation-wide) — fourier-relevant subset folds into F-γ; rest STAYS-OUT.
- **N3** W11 FULL palette-api → color rename — purely cosmetic; URL-layer GREEN; data-bearing volume orphan-risk. STAYS-OUT.
- **N4** csp-solver `useApi.ts` — external repo. STAYS-OUT (ASK only).
- **N7** floridify Mongo-bind upstream — external repo. STAYS-OUT.
- **E5** Idempotency-Key API-side middleware — routed to I-tail per E/FINAL §5. STAYS-OUT.
- **E6, E7** value.js-J scope. STAYS-OUT.
- **FA5 F-T-P1** katex lazy on `/paper` — REJECTED-as-manufactured. EquationPanel mounts on `/visualize`; current chunk topology load-bearing.
- **FA5 F-T-E2** per-call-site `types.ts` migration — REJECTED-as-decorative. 23 importer files; hand-mirror is ergonomic-tuned; replace with adapter + drift-detection type-test, not migration.

12 items REJECTED with explicit rationale. The 5-item load-bearing surface from FA4 §6 holds.

## §7 — Files this synthesis seeds

```
docs/tranches/F/
├── F.md                            (charter; written from this synthesis)
├── PROGRESS.md                     (running wave ledger)
├── FINAL.md                        (authored at W12)
├── audit/                          (per-wave close records)
├── coordination/
│   ├── F-OPERATOR-WINDOW.md        (the F.W3 runbook)
│   └── F-VHOST-CORRECTNESS.md      (the inv-22 spec)
├── waves/                          (per-wave specs)
└── receipts/                       (host-window evidence; F-γ)
```

Memory anchor (per pattern): `~/.claude/projects/.../memory/project_tranche_f.md` linked from `MEMORY.md` after charter lands.

## §8 — Headline

fourier-tranche-F exists because of five forces converging: (1) FA1 surfaced a real prod regression where `api.fourier.babb.dev` non-`/api/*` paths serve a stale 28-May SPA index.html via nginx try_files misconfig — load-bearing, not hygiene; (2) FA5 found a load-bearing transposition (compute_cache parametric collapse + bases wiring) that discharges the W7 epicycles/bases asymmetry in one shape-change; (3) FA3 confirmed E close HOLDS but identified host-cron evidence gap + auto-migration GREEN-pending-real-test as honest carries needing one operator window to upgrade; (4) FA4 distilled 33 inventoried items down to a 5-item load-bearing surface against a CHRONIC-5gate residue (C1/C5/C6/C8) that is structurally cross-repo and must STAY-OUT under CONSTELLATION discipline; (5) FA1 + FA6 surfaced the Lighthouse / UX floor (perf 59–64, LCP 7–8 s, `button-name` failures, missing `meta-description` / `robots.txt`, CM fonts on jsdelivr) that EE3's "DEEPLY audit" mandate authoritatively folds here.

F is bounded to 5 threads + 2 new invariants (inv-21 post-cohort-hygiene-bounded; inv-22 vhost-correctness-symmetric); rejects 12 items with explicit rationale; runs a 12-wave shape with research-first gating only where FA evidence demands it; and inherits all 10 E precepts under stricter KISS discipline because the temptation in post-cohort hygiene is exactly the manufactured-scope drift that FA5 caught with F-T-P1.
