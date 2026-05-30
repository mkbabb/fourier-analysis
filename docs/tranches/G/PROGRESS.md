# G — progress log

Updated at every wave boundary. Reconciled against reality at W9 close.

## Goal of this log

Record what *actually happened* at each wave of fourier-tranche-G — the elegance/simplicity/performance transposition tranche (correctness-honesty + one-identity convergence + legacy excision + performance transposition + deploy-spine completion) — so the close can reconcile claim against artefact without archaeology. G is born correcting an honesty gap (F's δ never reached prod); its own close is bound by inv-25 (automated deploy-of-record).

## Completion criterion

Every wave's row carries (a) a status word, (b) a close timestamp, (c) a notes cell naming the binding deliverable. At W9 close every row reconciles against `FINAL.md`'s gate table; `FINAL.md` cites an automated `deploy_run_id` for BOTH API and SPA (inv-25). The 30-day stale-watch re-triggers at W9.

## Status board

| Wave | Status | Closed at | Notes |
|---|---|---|---|
| W0 — Open + audit intake + cheapest γ | **CLOSED** | 2026-05-30 | `compute_cache.py:105` `datetime.utcnow`→`now(tz=UTC)` landed (`waves/W0.md`). **Schedule refinement**: the misleading `rate_limiter.py:143` comment is the rationale block for `read_limiter=1200` — entangled with the β.2 (W3) convergence that rewrites it wholesale; correcting it twice is churn, so it is **folded into W3** (recorded). F baseline survives falsification (GA3); 6-lane G-audit committed as binding baseline (`a2e05ea`) |
| Wα — Research-light (2 lanes) | **CLOSED** | 2026-05-30 | `waves/Walpha.md`. Lane A: CF project `fourier-682` direct-upload; host has no CF token/wrangler → ratified **Arch (b) GH Actions deploy** under `fourier-analysis/.github/`; δ-not-live confirmed. Lane B: chain mapped + spoof-proven; CF does NOT front the API origin; exact `real_ip` block derived; surfaced the double-rewriter (nginx + uvicorn) + `get_client_ip` XFF[-1] bug |
| Wχ — Challenge (3 probes) | **CLOSED** | 2026-05-30 | `waves/Wchi.md`. P1 → **(B) hand-types-canonical** (codegen can't even produce `Visualization`; delete it). P2 → drop uvicorn `--proxy-headers`, nginx sole rewriter, X-Real-IP canonical, budget **180/min**, `api_compute` burst 3→5, WORKERS=4 residual booked. P3 → KaTeX bundler-import + commit CM/Google woff2, no vite change, Lighthouse dev-now/prod-after-publish |
| W1 — G.α deploy-of-record + δ ships | provisional | — | **TOP PRIORITY — F's δ is NOT live in prod.** Wire `pages-deploy.sh` into fourier's tracked deploy path; re-ship δ; live-verify (font SHA + robots.txt + meta-description + a11y); author inv-25 precept; FINAL cites automated `deploy_run_id` |
| W2 — G.β.1 one contract source (T1) | provisional | — | collapse the 3 api↔web type sources (unused generated `api-schema.d.ts` + `types.ts` + inline `api.ts` decls) → ONE; inv-26 gate |
| W3 — G.β.2 one IP identity (T2) | provisional | — | rate_limiter → `get_client_ip` + nginx `real_ip`; per-client budget; **retire the `read_limiter=1200` workaround** |
| W4 — G.γ legacy excision | provisional | — | dead `like_limiter`/`/like`; 6 dead `types.ts` exports; `GalleryEntry`/`toGalleryEntry` vestige |
| W5 — G.δ perf + Lighthouse | provisional | — | self-host CM fonts + KaTeX CSS same-origin (kill 3 LCP-path third-party origins); **real Lighthouse prod AND dev** artefacts (honors the lip-service theme) |
| W6 — G.ε.1 secret-model + deploy CI | provisional | — | reconcile the doc↔host secret-model lie → executable rotation runbook; `deploy/` self-CI/shellcheck |
| W7 — G.ε.2 hook convergence + hardening + hygiene | provisional | — | converge `deploy-hook.sh` (T3); fourier `docker-compose.prod.yml` hardening floor; prune stale host backups (receipt) |
| W8 — G.ζ honesty + chronic + coordination | provisional | — | inv-22 reconcile (color honest); C1/C5/C6 6-gate STAYS-OUT re-affirm; 7-ask + dispatcher-retirement stale-watch; E2 single CI-delta |
| W9 — Close | provisional | — | reconcile PROGRESS; `FINAL.md` (automated `deploy_run_id`); CANONICAL-ORDERING → ordering ι′ |

## Log

### 2026-05-29 — tranche authored (6-lane G-audit + SYNTHESIS)

**WHAT.** Following F's close, the user directed: "DEEPLY audit with 6 agents in parallel our original plan and waves thereof, alongside all changes made herein. Devise a path forward… architectural transpositions in the sake of elegance, simplicity, and performance above all… NO legacy code… delineate chronic + deferred and fold them… recap ALL prompts… NOT an implementation phase. Tranche development only."

Six parallel READ-ONLY Agent lanes ran (GA1-GA6 + SYNTHESIS at `docs/audits/runs/2026-05-29-G-audit/`).

**Verdict (GA3):** F's close SURVIVES gate-falsification — all 13 §6 gates reproduce independently. But three honest overstatements surfaced:
1. **δ never shipped to prod (GA1/GA6)** — the restored auto-deploy drives only the API; the CF Pages SPA deploy is a separate un-automated `wrangler` step nobody ran. Prod serves `cm-web-fonts@latest`, Cloudflare's auto `robots.txt`, no `meta-description`. δ gates are PASS-in-source, NOT live.
2. **rate-limit residual under-scoped (GA1/GA3/GA5)** — an inv-11 one-identity violation (rate_limiter ignores the existing `get_client_ip`), "fixed" by *widening* read_limiter to 1200 to mask a shared-global-bucket. The genuine fix is convergence, not a future wave.
3. **inv-22 symmetric overstated (GA3)** — `api.color.babb.dev` is not JSON on /health,/docs,/openapi.json.

**Transpositions (GA5):** T1 three api↔web type sources → one (the generated 65 KB `api-schema.d.ts` is imported by NOTHING); T2 one IP identity; T5(1) self-host fonts + KaTeX (3 LCP-path origins → 0); T4 GalleryEntry vestige; T3 deploy-hook convergence.

**Legacy (GA1/GA5):** dead `like_limiter`, 6 dead type exports, naive `datetime.utcnow`, misleading comment.

**Chronic/deferred (GA4):** 18 open of 41; fold R1/ASK-4-fourier-half/E2; STAYS-OUT re-affirm C1/C5/C6 (6-gate cross-repo).

**Precepts (GA6):** "Lighthouse in dev" was lip-service across 3 audits; NEW precept inv-25 (deploy-of-record must be automated-path-backed — the auto-deploy was silently dead ~2 months while everyone closed "LIVE").

**Shape:** 6 threads (α deploy-of-record/δ-ships, β one-identity convergence, γ legacy excision, δ perf+Lighthouse, ε deploy-spine completion, ζ honesty+chronic+coordination); 11 wave slots; 2 new invariants (inv-25 deploy-of-record-automated, inv-26 single-contract-source).

### Next action

Await user authorization for **G.W0** (or W1 directly). This was tranche development only — no implementation ran; the 6 lanes were READ-ONLY. At authorization, W1 (α — ship δ to prod for real + inv-25) is the top-priority correctness fix.
