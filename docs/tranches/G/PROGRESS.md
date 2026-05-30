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
| W1 — G.α deploy-of-record + δ ships | **CLOSED** | 2026-05-30 | `waves/W1.md`. SPA deploy-of-record wired (`scripts/pages-deploy.sh` + `.github/workflows/deploy-pages.yml`); first automated deploy SUCCEEDED (GH run `26694289830` → CF deploy `52f90604`). δ LIVE: pinned font SHA ✓, meta-description ✓, a11y ✓; robots.txt honestly reconciled (CF zone-managed = superior, subsumes F's file). inv-25/inv-26 in INVARIANTS.md. **Discharged a CI-red chronic**: dropped `submodules:recursive` (private docs/precepts) from deploy + all 3 CI jobs |
| W2 — G.β.1 one contract source (T1) | **CLOSED** | 2026-05-30 | `waves/W2.md`. 3 sources → 1: deleted `api-schema.d.ts` (0 importers) + `gen-types.sh` + `api/openapi.json` + the `openapi-typescript` toolchain; folded the 6 contract types `api.ts`→`types.ts` (re-exported). vue-tsc + build GREEN. inv-26 proof-greps clean. 4th equation-domain hand-source booked (out of named scope) |
| W3 — G.β.2 one IP identity (T2) | **CLOSED** | 2026-05-30 | `waves/W3.md`. nginx `real_ip` + `get_client_ip` (X-Real-IP) convergence; dropped uvicorn `--proxy-headers`; read budget 1200→180 PER-CLIENT; hash_ip converged. **Verified LIVE**: nginx log `$remote_addr`=real client, spoof-safe (XFF:1.2.3.4 ignored), per-client buckets, inv-22 holds. Booked: WORKERS=4 per-proc residual; nginx bind-mount inode→W7 deploy-hook; run_pending_migrations datetime→W4. pytest 132/83 |
| W4 — G.γ legacy excision | **CLOSED** | 2026-05-30 | `waves/W4.md`. Removed dead `like_limiter`/`/like` arm; 6 dead `types.ts` exports (canonical NotationMode/EquationTier kept in `equation/types.ts`); `GalleryEntry`/`toGalleryEntry` vestige (8 components→`Visualization`, no `.user_slug` reader existed); 4× `datetime.utcnow`→`now(tz=UTC)` in run_pending_migrations (folded W3). vue-tsc + build + pytest 132 GREEN |
| W5 — G.δ perf + Lighthouse | **CLOSED** | 2026-05-30 | `waves/W5.md`. LCP-path third-party origins **3→0**: KaTeX bundler-import (19 woff2 same-origin, fixes pin drift), CM Serif vendored woff (upstream has no woff2), Fraunces+Fira Code woff2. Dev Lighthouse **Perf 94/A11y 100/SEO 100**, network trace 0 third-party (receipts/lh-dev-self-host). Prod Lighthouse **Perf 95/A11y 100/SEO 100**, 0 third-party (receipts/lh-prod-self-host) — LIVE. meta-description preserved. CSP bonus booked |
| W6 — G.ε.1 secret-model + deploy CI | **CLOSED** | 2026-05-30 | `waves/W6.md` (deploy-repo `26e9160`). Secret-model lie reconciled: `host/render-hooks.sh` (envsubst, fail-loud, atomic 0600) + `secrets.env.example` + gitignore; corrected the false `${HMAC}`-interp docs; rewrote hmac-rotation.md executable. Deploy self-CI (shellcheck+bash -n+yamllint); fixed SC2034 in dispatch.sh. No committed secret |
| W7 — G.ε.2 hook convergence + hardening + hygiene | **CLOSED** | 2026-05-30 | `waves/W7.md`. T3: deploy-hook force-recreates nginx on an nginx/ delta (W3 gap) + backported parameterized to the template (deploy `a7b58ab`). Compose: backend FULL floor (read_only+cap_drop ALL+no-new-priv+tmpfs, verified live + functional), others no-new-priv (read_only/cap_drop booked). Host hygiene: 2 stale backups pruned (receipt). Hardened backend deployed GREEN (host `e9faab6`) |
| W8 — G.ζ honesty + chronic + coordination | **CLOSED** | 2026-05-30 | `waves/W8.md`. inv-22 reconciled honestly (INVARIANTS §2.7: fourier-enforced + gate-co-enforced; color partial /→200 only, value.js-owned, booked); C1/C5/C6 STAYS-OUT re-affirmed with gating predicates (not a 7th silent defer); E2 stays out (chromium suffices; matrix triples CI) w/ rationale; ADOPTION-ASKS re-stamped — Ask 4 fourier portion LANDED, new inv-22-color row. inv-16 held |
| W9 — Close | **CLOSED** | 2026-05-30 | `FINAL.md` written (cites automated deploy_run_id for BOTH API + SPA); PROGRESS reconciled; CANONICAL-ORDERING §16.1 → G CLOSED. Gates: pytest 132/83, vue-tsc+build green, T7 12/12, δ prod Lighthouse 95/100/100, β.2 per-client live, backend hardening live |

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

### 2026-05-30 — tranche EXECUTED + CLOSED GREEN

Authorized by the user ("Begin and continue the current tranche… orchestration and deep parallelization… NO quick solutions… idiomatic, gestalt"). Executed W0→W9 in one session, research-first (W0→Wα→Wχ→implementation). 8 implementation waves closed; **all three F overstatements corrected at root**:

1. **δ LIVE** — wired the SPA's standing automated path (`deploy-pages.yml` + `scripts/pages-deploy.sh`); inv-25; prod Lighthouse 95/100/100, 0 third-party origins.
2. **β.2 one-IP-identity** — nginx `real_ip` + `get_client_ip` convergence; budget 1200→180 per-client; spoof-proven LIVE.
3. **inv-22 honestly scoped** (INVARIANTS §2.7).

Plus: inv-26 one contract source (deleted the unused 65 KB codegen); 3→0 LCP third-party origins; legacy excised; deploy spine completed (secret-model reconciled, self-CI, deploy-hook nginx-recreate + template backport, backend hardening floor live, host hygiene).

**Chronic discharged in-flight**: every CI run had been RED for ~months (`submodules: recursive` couldn't clone the private docs-only `docs/precepts`) — removed from CI + deploy workflows. **Operational lesson captured**: a single-file nginx bind-mount keeps a stale inode after git's atomic-rename, so `up -d` never applies config changes — the deploy-hook now force-recreates nginx on an `nginx/` delta.

fourier HEAD `de9a078` (+ this close); deploy-repo `a7b58ab`. A–G all closed. No fourier tranche open.
