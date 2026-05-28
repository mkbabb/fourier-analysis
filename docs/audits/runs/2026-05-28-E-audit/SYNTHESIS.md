# E-development synthesis (2026-05-28)

**Status**: AUTHORED 2026-05-28 — the 6-lane E-development audit closes; tranche-E charter folds the findings. **Authority**: this doc consolidates the 6 lanes (`EA1-EA6.md`) and binds the tranche-E thread set + wave shape + must-NOT list + cohort framing. **Mode**: tranche development only — NOT an implementation phase. **Predecessor**: fourier-D, closed CLEAN 2026-05-28 (`docs/tranches/D/FINAL.md`, host HEAD `6039e95`).

## §0 — Headline verdict

D's CLEAN-close framing **HOLDS UNDER FALSIFICATION** (EA1). Zero LOAD-BEARING silent misses; zero CHRONIC new (the three carried items — pre-existing pytest failure, sibling Mongo dirty edits, dispatcher arm — are explicitly disclosed in `D/FINAL.md §6.2/§6.3`). Two DOCUMENTATION sharpenings: §5 stale HEAD SHA citation; §0(e) mypy phrasing imprecise relative to W3 audit §6 G5. Neither is load-bearing.

**Tranche E exists** because of three forces the user's mandate surfaces (2026-05-28 directive):

1. **The cross-repo cohesion ask** — the 53 DEFERRED-TO-VALUE.JS cells D.W5 recorded are still load-bearing on value.js's side (EA3); the user explicitly mandated "fix our cross repos" which **IS the value.js-I re-mandate** (EA6 §4) the D close held conditional.
2. **The "include ALL consumers" mandate** — every consumer of either palette/visualization API must be hardened against the v2.0.0 envelope semantics; EA3 enumerated 6 consumer surfaces with 10 brittlenesses; EA5 surfaced 9 transpositions (T-E1..T-E6, T-S1..T-S6, T-P1..T-P3).
3. **The chronic + new-in-D residuals** — EA2's 35-item ledger (9 chronic ≥2-tranches + 11 new-in-D + 9 cross-repo) folds into E; the headline operational gap (N11: deploy-hook NOT auto-invoking migrations across both W1 + W3) is the highest-leverage α-thread item.

This is a **research-first cohort tranche**: fourier-E + value.js-I run together; the cross-repo source boundary preserved (Wχ-P3.C4 binding inherited); the contract v2.0.0 stays the documentation seam (no shared types/framework/codegen per inv-16).

## §1 — Findings rolled up

### From EA1 (execution fidelity)

D's 10 sweep targets all RATIFIED (8) or RATIFIED-WITH-MINOR-DELTA (2 documentation sharpenings). The DOCUMENTATION sharpenings flow into E.W12's close-record hygiene; not load-bearing for the thread shape. Production state at audit-time is exactly what the D close claimed — verified by SSH + CF API + live URL probes.

### From EA2 (deferred + chronic inventory — 35 items + 53 cells)

**Class distribution:**
- 15 DISCHARGED-by-D (recorded; out of E scope)
- **9 CHRONIC (≥2 tranches)** — the user's "chronically deferred" target; load-bearing for E
- **11 NEW-IN-D** — fold into E
- 6 OUT-OF-SCOPE-explicit (kept out per `D.md §7` + invariants)
- 9 CROSS-REPO (value.js, palette-api, csp-solver, keyframes.js, floridify, glass-ui maintainer scope)
- 53 DEFERRED-TO-VALUE.JS conformance cells (collectively X1, opens with value.js-I re-mandate)

**Top 5 chronic (binding into E):**
1. **C1** — Colour-lift `sampleToSVGPath` consume (4 gates: A.W2.b → B.W4 → C.W4-δ → D.W5). Awaits value.js publish; rides E.α as a bounded sub-item — fires iff value.js-I publishes.
2. **C5** — glass-ui substrate carries (4 gates). Cross-repo (glass-ui maintainer); E ratifies the asks not the discharge.
3. **C6** — glass-ui `style.css:3` cold-boot race (4 gates). Cross-repo.
4. **C8** — Cross-cohort infra standardisation plan (4 gates; 63 days stale). Out-of-E-scope; promote to `docs/precepts/infra/` archive.
5. **C2** — value.js `Palette`/`colorScale` domain model (3 gates). Held latent per inv-15 unless a real consumer surfaces (conditional E.ζ thread).

**Headline new-in-D — N11 deploy-hook auto-migration**: both `migrate_image_blobs.py` (W1) and `migrate_flags_field.py` (W3) ran manually because the deploy-hook does NOT invoke migrations. The `code-and-migration-together` invariant held by operator-discipline only. **Highest-leverage E.α item** — bind into E.W1 or E.W2.

### From EA3 (cross-repo CRUD cohesion + 6 consumers)

**Conformance state:**
- Fourier viz API: **~95% (100% mandatory)** — partial only on optional C4.5/C4.6 illegal-transition guard.
- Palette API (value.js): **17% (12/72 cells PASS)** — the I.W1-W4 alignment is the bulk of E.

**Cross-repo `palette_slug` FK live verdict:**
- **PASS** at storage + contract layer (slug shape, ETag-participating, opaque FK).
- **FAIL** at browser layer — `api.color.babb.dev` CORS preflight from `Origin: https://fourier.babb.dev` returns `access-control-allow-origin: https://color.babb.dev` ONLY; latent today (fourier doesn't fetch palettes yet) but load-bearing the moment a UI surface lands. **One-line env-var fix** — bind into E.δ.

**6 consumer surfaces enumerated** (10 brittlenesses B1–B10):
1. Fourier SPA `web/src/lib/api.ts` (708 LoC; 5 brittlenesses)
2. Fourier CF-Pages deploy (= #1 built)
3. Value.js demo `demo/@/lib/palette/api/*` (9 files; 5 brittlenesses)
4. color.babb.dev deploy (= #3 built)
5. Value.js `src/` npm library — confirmed NOT a consumer
6. Fourier `web/vendor/*.tgz` — confirmed NOT a consumer

**9 architectural transpositions (T1–T9)** all wave-bound:
- **T1** — value.js fold repository → service (perf; reduce indirection)
- **T2** — drop palette `id` field (§1.3 fix + perf; client memory)
- **T3** — I.W4 SOTA envelopes (problem+json/ETag/Idempotency/RateLimit)
- **T4** — palette-API CORS allow `fourier.babb.dev` ← **load-bearing one-line**
- **T5** — fourier `content_hash` → model computed field (idiomatic Pydantic)
- **T6** — promote `api/lib/crud/` to an internal package
- **T7** — cross-repo conformance probe + cron (E.δ.1)
- **T8** — typed `ApiProblem` class in both consumers (close the structured-error swallow)
- **T9** — git-tagged palette-api deploy artefact (resolves PROVENANCE.md dual-source)

**Headline live data finding:** 2 palettes share `currentHash=6691aae4…` (`hey-v2-cd3e1e3b-remix-fecce815` + `-2a95820d`). Value.js's dedup substrate is colliding on real production data. **E.β consumer-of-Palette-API correctness item**.

### From EA4 (prompts + precepts — 55 prompts)

55 prompts across A/B/C/D + the D-execution + the E-development phase. **53 ADDRESSED/HELD, 0 PARTIAL, 2 ROUTED-TO-E** (the E directives themselves: "fix cross repos" + "refine/test/CRUD palette + viz APIs"). 10/10 precepts holding. The CF token discipline ("do not rotate" + "save in non-pushed .env") HELD VERBATIM across all 14 D commits; unblocker resolved via babb.dev account access grant on 2026-05-28 (NOT rotation).

### From EA5 (architectural transpositions — 17)

17 transpositions identified across 4 lenses (6 elegance + 6 simplicity + 3 performance + 2 NO-legacy verifications). Top 5 RECOMMENDED-for-E:

1. **T-P1** — Vite `manualChunks` split (854 kB index → smaller layers; Vue/UI/math/paper). 30-min config change. **Single biggest user-facing perf win**.
2. **T-E1 + T-S5** — Collapse 4 fetch helpers (`apiFetch`/`apiFetchWithETag`/`adminFetch`/`eqFetch`) to one parametric core. The 2 `as unknown as` survivors at `web/src/lib/equation/api.ts:36,53` (the only NO-legacy debt remaining post-D) retire as a structural consequence.
3. **T-E2** — Generate `web/src/lib/types.ts` from FastAPI's `/openapi.json` via `openapi-typescript`. Retires the hand-mirror class of bug structurally.
4. **T-S3** — Retire `/opt/deploy/scripts/dispatch.sh` indirection; per-repo webhook URLs at `deploy.babb.dev/hooks/<repo>`. The latent-broken `mkbabb/value.js)` arm dies with it. **Closes the chronic dispatcher-fragility surface**.
5. **T-P3** — Cache `extract_contour` + `compute_epicycles` results by content-addressable key in Mongo. The `extraction_cache_key` index already exists — this is unlocking dormant infrastructure.

**Rejected**: T-S2 (consolidate 3 MongoDBs to 1) — blast-radius coupling net-negative on shared host (W1 just proved per-app isolation is load-bearing).

**Flagged for user**: T-S1 (pnpm workspace replacing `web/vendor/*.tgz`) — inv-16 may reject the workspace coupling. Carry as a Wα-research item.

**Verifications (no E action needed)**: T-E5 dead `gallery` indexes verified gone at HEAD; T-N1 `snapshot_hash` test-fixture survivors are load-bearing for migration discipline; T-N2 `--tlsAllowConnectionsWithoutCertificates` is architecturally correct per D.W2's honesty pivot — NOT legacy.

### From EA6 (guard + thread scoping)

**5 threads + 1 conditional** for tranche E:

- **α — Cross-repo CRUD cohesion completion** (the value.js-I re-mandate; the 53 DEFERRED-TO-VALUE.JS cells; the I.W1-W4 sketch; the cross-repo contract-test harness; the `palette_slug` FK CORS fix T4).
- **β — Consumer hardening** (`web/src/lib/api.ts` typed client + retry + ETag + Idempotency-Key; value.js demo client hardening; csp-solver runtime API URL fix; typed `ApiProblem` class T8 in both consumers).
- **γ — Architectural transpositions** (the 5 recommended; per-item smallest-honest-mechanism; T-P1 bundle split, T-E1+T-S5 fetch-helper collapse, T-E2 openapi-codegen, T-S3 dispatcher retire, T-P3 compute cache).
- **δ — Test integrity completion** (cross-env Playwright matrix actually green; cross-repo conformance probe T7 + cron; the pre-existing pytest failure resolved; the dispatcher arm fixed or retired with T-S3).
- **ε — Operational hygiene** (the deploy-hook auto-migration N11; the cross-repo upstream commits — floridify dirty + palette compose; dangling docker images / dead vhosts; W11 FULL rename held for downtime).
- **(conditional) ζ — value.js Palette/colorScale domain model** — held latent per inv-15 unless a named consumer surfaces.

**Wave shape**: ~10-12 waves total (W0 / Wα / Wχ / W1-W7+ / Wclose). 4-agents/wave ceiling holds. α + γ are **research-first** (Wα required); β/δ/ε are direct but still pass Wχ for inv-16/inv-12 re-cert.

**Cohort framing**: fourier-E + value.js-I run together (the user's "fix our cross repos" IS the I re-mandate). Cohort closes together OR named successor. Cross-repo source boundary: fourier-E commits do NOT touch `value.js/**`; value.js-I commits do NOT touch fourier. The contract v2.0.0 is the documentation seam.

## §2 — The binding must-NOT list (15 items)

Inherited from D.W5 (P3 cohesion-KISS) + DA6 + NA6, with E-specific additions:

1. NO shared types package / shared TypeScript types / shared framework (inv-16)
2. NO codegen tool that BOTH repos consume (inv-16) — `openapi-typescript` is per-repo, not shared
3. NO shared HTTP client across repos (inv-16)
4. NO new containers, new services, new databases (inv-12)
5. NO horizontal scaling, multi-replica, k8s, swarm (inv-12 + inv-19)
6. NO library nobody calls (inv-15) — `Palette`/`colorScale` stays out unless consumer lands
7. NO mass-rename for cosmetic reasons
8. NO mass-test-add for hygiene (only for real bugs or contract proofs)
9. **NO value.js source modifications from fourier-E commits** — the cross-repo boundary (Wχ-P3.C4 inherited)
10. NO npm publish without explicit user authorization
11. NO destruction of prod data (no `down -v`, no `db.drop()`, no manual Mongo writes)
12. NO Mongo consolidation (T-S2 REJECTED) — per-app isolation is load-bearing
13. NO design rebrand (β stays refinement only — inherited from W4 + D.md §1)
14. NO Rust rewrite, NO migrating to TypeScript-backend (inv-12)
15. **NO manufactured transpositions** — every E transposition must reduce moving parts; additions disguised as transpositions are rejected

## §3 — Provisional E thread + wave shape

### Phase 0 — research + challenge (W0 → Wα → Wχ)
- **W0**: open + baseline (this audit's findings as the binding baseline)
- **Wα**: ratify the 6 lanes against live state at execution-time; dispatch any narrowed follow-up (max 1 lane)
- **Wχ**: 5 adversarial probes — P1 (cross-repo boundary holds; no value.js source touches), P2 (transpositions are transpositions not additions), P3 (consumer hardening fixes real brittleness not hygiene), P4 (deploy-hook auto-migration is idempotent + safe), P5 (cohort closure shape — fourier+value.js close together OR named successor)

### Phase I — α cross-repo cohesion completion (W1-W4)
- E.W1 — Cross-repo CORS fix (T4) + the `palette_slug` FK live verification + the `mkbabb/value.js` arm fix or retire
- E.W2 — value.js-I open (the cohort peer; user re-mandate confirmed) — I.W1 visibility split (status → visibility + tier)
- E.W3 — value.js-I.W2 soft-delete + grace + restore
- E.W4 — value.js-I.W3 + I.W4 SOTA envelopes (problem+json/ETag/If-Match/RateLimit/Idempotency-Key)

### Phase II — β consumer hardening (W5-W6)
- E.W5 — fourier `web/src/lib/api.ts` typed retry + ETag + Idempotency-Key + `ApiProblem` class (T8)
- E.W6 — value.js demo client hardening + csp-solver runtime API URL fix (cross-repo coord)

### Phase III — γ architectural transpositions (W7-W9)
- E.W7 — T-P1 (Vite manualChunks) + T-P3 (compute content-cache)
- E.W8 — T-E1+T-S5 (fetch-helper collapse retiring 2 `as unknown as`) + T-E2 (openapi-typescript)
- E.W9 — T-S3 (dispatcher retire; per-repo webhook URLs); the deploy-hook auto-migration (N11) sweep

### Phase IV — δ test integrity + ε operational hygiene (W10-W11)
- E.W10 — Cross-env Playwright green (close D.W6 AMBER) + the cross-repo conformance probe T7 + the pytest residual
- E.W11 — Operational sweep: cross-repo upstream commits (floridify + palette); dangling images + dead vhosts; W11 FULL rename held for downtime; the C9 invariant numbering reconcile

### Phase V — close (W12)
- E.W12 — FINAL.md + cohort-close discipline; CANONICAL-ORDERING → ordering ζ

## §4 — Cohort coordination (fourier-E + value.js-I)

The "fix our cross repos" mandate IS the cohort re-mandate D.W5 + `VALUE-JS-ASK.md` held conditional. Cohort discipline:

- **fourier-E** owns: `api/`, `web/`, `scripts/`, `docs/tranches/E/`, `infra/`, `.github/workflows/`
- **value.js-I** owns: `value.js/api/src/` (the palette-api backend), `value.js/api/test/` (conformance suite), `value.js/docs/tranches/I/`
- **Shared**: the contract v2.0.0 documentation seam (`docs/tranches/B/coordination/CRUD-CONTRACT.md` + the cross-repo `palette_slug` FK clause in `research/README.md` R1)
- **Cross-repo conformance probe T7**: a single cron-runnable test harness that probes both APIs and the FK; lives in fourier-E (per-repo) but the value.js side authors its own conformance suite (`value.js/api/test/conformance/`) in I.W4

The cohort closes when:
- fourier-E hits all gates AND value.js-I hits its I.W1-W4 gates
- OR: fourier-E closes; value.js-I residuals are named as `value.js-J or later` successors
- The cross-repo `palette_slug` FK contract is binding from both sides

## §5 — What this synthesis IS and IS NOT

**IS**: the binding charter substrate for `docs/tranches/E/E.md`; the load-bearing finding inventory; the must-NOT list; the thread set; the wave shape; the cohort framing.

**IS NOT**: an implementation phase. Per the user's mandate ("This is NOT an implementation phase. Tranche development only"), no source touches; no host mutations; no `value.js/**` writes; no E wave actually fires. The fields filled at execution: the per-wave hardening, the Wα ratification verdicts, the Wχ probe verdicts, the implementation commits.

**Next user-action**: authorise `E.W0` execution; OR direct revisions to the thread set / wave shape / must-NOT list.

## §6 — Files this synthesis seeds

- `docs/tranches/E/E.md` (NEW — the binding charter, mirroring `D.md` §0-§9 shape)
- `docs/tranches/E/PROGRESS.md` (NEW — initial status board + log seed)
- `docs/tranches/E/coordination/CRUD-COHESION-E.md` (NEW — extends D's `CRUD-COHESION.md` with the cohort framing)
- `docs/tranches/E/coordination/CONSUMER-HARDENING.md` (NEW — the consumer audit findings + T8 binding)
- `docs/tranches/E/coordination/ARCH-TRANSPOSITIONS-E.md` (NEW — the 17 transpositions + per-item disposition)
- `docs/tranches/E/coordination/COHORT-VALUE-JS-I.md` (NEW — the cohort coordination doc)
- `docs/tranches/CANONICAL-ORDERING.md` (UPDATE — §11 ordering ζ seed)

The 6 lane outputs (`EA1-EA6.md`) plus this `SYNTHESIS.md` constitute the E-development audit deliverable.
