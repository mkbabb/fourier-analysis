# E — cross-repo CRUD cohesion completion, consumer hardening, architectural transpositions

**Tranche letter**: E — fourier-analysis's cross-repo cohesion completion, consumer hardening, architectural transposition, test integrity completion, and operational hygiene tranche; successor to D (production integration, design refinement, NO-legacy convergence, CRUD-CONTRACT v2.0.0, constellation normalization).
**Predecessor close**: D — `docs/tranches/D/FINAL.md` (close commit `342a078` + post-close `6039e95`); D closed CLEAN 2026-05-28 (all six threads GREEN).
**Cohort**: **cross-repo, cohort-anchored.** Thread α is the value.js-I re-mandate (the cohort peer the D close held conditional); E and value.js-I close together OR named successor. The user's 2026-05-28 directive ("fix our cross repos") IS the I re-mandate.
**Mode**: **research-first** for α (the value.js alignment design — the 53 DEFERRED-TO-VALUE.JS cells) and γ (architectural transpositions need adversarial review at Wχ); **direct** for β (consumer hardening — findings concrete), δ (test integrity — the W6 AMBER cells named), ε (operational hygiene — the named residuals).
**Open**: TBD (after the user authorises E.W0).
**Authored**: 2026-05-28 (the 6-lane E-development audit — `EA1-EA6.md` + `SYNTHESIS.md` — `docs/audits/runs/2026-05-28-E-audit/`).

## §0 — Goal criterion and completion criterion (paired)

**Goal criterion (the aim).** Land six threads honestly to close the cross-repo + consumer + transposition arc D opened:

- **α — cross-repo CRUD cohesion completion**: the `palette_slug` FK CORS gap closes (one-line env var T4); the cohort peer value.js-I opens (I.W1 visibility split → I.W2 soft-delete/grace/restore → I.W3 idempotent admin setter → I.W4 SOTA envelopes: problem+json/ETag/If-Match/RateLimit/Idempotency-Key); the cross-repo `palette_slug` FK contract proves binding from both sides via live + a conformance probe (T7).
- **β — ALL consumers hardened**: `web/src/lib/api.ts` typed retry + ETag + Idempotency-Key + the `ApiProblem` class T8 (closes the structured-error swallow surfaced by EA3 B1–B5); value.js `demo/@/lib/palette/api/*` (B6–B10) get the same `ApiProblem` typed surface; csp-solver runtime `VITE_API_URL` fix lands (cross-repo coordination).
- **γ — architectural transpositions**: T-P1 Vite `manualChunks` (854 kB bundle → split); T-E1+T-S5 four-fetch-helpers → one parametric core (retires the 2 `as unknown as` survivors in `web/src/lib/equation/api.ts:36,53`); T-E2 `openapi-typescript` for `web/src/lib/types.ts` (retires hand-mirror); T-S3 `/opt/deploy/scripts/dispatch.sh` retired in favour of per-repo webhook URLs at `deploy.babb.dev/hooks/<repo>` (the latent-broken `mkbabb/value.js` arm dies with it); T-P3 content-addressable Mongo cache for `extract_contour` + `compute_epicycles`.
- **δ — test integrity completion**: the D.W6 AMBER cells go GREEN (the cross-env Playwright matrix passes — the pre-existing UI drift addressed); the cross-repo conformance probe T7 + cron (runs the v2.0.0 conformance against both APIs continuously); the pre-existing `test_backfill_image_bounds_on_migrated_image` pytest failure resolved.
- **ε — operational hygiene**: the deploy-hook **auto-invokes pending migrations** (closes the chronic N11 gap surfaced in W1 + W3 where both migrations ran manually); the cross-repo upstream commits land (floridify Mongo bind + palette compose ports → committed in those repos by their maintainers, fourier-coordinated); dangling Docker images cleaned; W11 FULL palette-api → color rename executed in a scheduled-downtime window (per `PALETTE-API-PROVENANCE.md §4` recipe); the C9 invariant numbering inconsistency reconciled.
- **(conditional) ζ — value.js `Palette`/`colorScale` domain model**: held latent per inv-15 unless a named, real consumer surfaces during E. Default: STAYS OUT.

**Completion criterion (the evidence).** The close holds when:

- **α**: `curl -X OPTIONS https://api.color.babb.dev/palettes/<slug> -H "Origin: https://fourier.babb.dev"` returns `Access-Control-Allow-Origin: https://fourier.babb.dev`; value.js-I.W1-W4 all GREEN per `value.js/docs/tranches/I/FINAL.md`; the cross-repo conformance probe T7 runs clean against both APIs.
- **β**: `web/src/lib/api.ts` is one parametric fetch core (one helper, not four); `git grep -nE "as unknown as" web/src/` returns zero (the 2 survivors retire structurally); the `ApiProblem` class lands in both fourier and value.js consumers; csp-solver's `useApi.ts` reads `VITE_API_URL`.
- **γ**: `npm run build` produces ≥4 chunked vendor bundles each <300 kB (the 854 kB index split); the openapi-codegen produces `web/src/lib/types.ts` from the live `/openapi.json`; `/opt/deploy/scripts/dispatch.sh` is gone OR is a thin pass-through with no per-repo arms; the compute-cache index hits a measurable hit-rate (record at close).
- **δ**: `cd web && BASE_URL=http://localhost:3000 npx playwright test` returns all green; the conformance probe is in CI; the pytest failure is resolved.
- **ε**: `scripts/deploy-hook.sh` invokes `python -m api.scripts.run_pending_migrations` (or equivalent idempotent runner) as part of the cutover; the cross-repo upstream commits are recorded in PROGRESS with their commit SHAs; dangling images gone via `docker image prune -a` host-coordinated.
- `uv run pytest` green (no skipped tests under live-Mongo CI); `vue-tsc -b --force` green; `npm run build` succeeds.
- `PROGRESS.md` matches reality; `FINAL.md` cites every commit + gate.
- The cohort closes: fourier-E green AND value.js-I green (OR named successor).

The §6 hard-gate list is the binding ledger.

## §1 — Thesis

D landed the production deploy + the design refinement + the backend NO-legacy convergence + the CRUD-CONTRACT v2.0.0 + the constellation normalization. **What D could not land** (and explicitly recorded as named-residual): the value.js-side of the cohesion contract (53 DEFERRED-TO-VALUE.JS cells, user-re-mandate-gated); the cross-repo CORS gap (preflight from `fourier.babb.dev → api.color.babb.dev` denied); the deploy-hook auto-migration discipline (both W1 + W3 migrations ran manually); the architectural transposition opportunities the design + execution surfaced (854 kB bundle; four-fetch-helper sprawl; hand-mirrored types; dispatcher indirection; compute paths not cached).

E exists to close all five, **as a cohort with value.js-I**. The user's 2026-05-28 directive is unambiguous: "Fix our cross repos. Refine, test, CRUD, our two palette apis and fourier viz apis. Including ALL consumers." This is the cohort re-mandate.

E is composed of **5 + 1 intentionally separable threads** sequenced so cross-repo cohesion precedes consumer hardening (the consumers depend on the contract being binding from both sides):

- **α cross-repo cohesion completion** — research-first (the value.js-I design); cohort-anchored.
- **β consumer hardening** — direct; per-consumer brittleness fixes catalogued by EA3.
- **γ architectural transpositions** — research-first for the larger items (openapi-codegen + dispatcher retire); direct for the bounded ones (bundle split + fetch-helper collapse + compute cache).
- **δ test integrity completion** — direct; the W6 AMBER cells named and discharged.
- **ε operational hygiene** — direct; the chronic + new-in-D residuals named in EA2 + the W11 FULL rename.
- **(conditional) ζ** — value.js `Palette`/`colorScale` domain model; default OUT.

KISS (invariant 12), NO-legacy (invariant 20), and inv-16 (no shared framework/codegen/coordinator across the cross-repo edge) are load-bearing. The threads share few files; α precedes β (consumers depend on the binding contract); γ runs parallel with β (disjoint files); δ + ε follow.

## §2 — Invariants

E inherits all prior invariants (`A.md §2`, `B.md §2`, `C.md §2`, `D.md §2`) unchanged. E adds **two new invariants by name** (the C-era 18/19/20 numbering inconsistency stays — a γ sub-item reconciles at execution per `D.md §2`; binding by name not number meanwhile):

- **Auto-migration discipline** — the deploy chain idempotently invokes pending migrations as part of the cutover. Chronic-of-D-execution lesson: both `migrate_image_blobs` (W1) and `migrate_flags_field` (W3) ran manually because the deploy-hook does NOT invoke them. The `code-and-migration-together` invariant (introduced at D) held by operator-discipline only. E binds: `scripts/deploy-hook.sh` invokes `python -m api.scripts.run_pending_migrations` (idempotent runner; per-migration tracking). Testable gate: an intentional new migration deploy lands the migration without manual SSH-trigger; the migration metadata records the run.
- **Cross-repo source boundary** — fourier-E commits do NOT touch `value.js/**`; value.js-I commits do NOT touch fourier. The contract v2.0.0 (documentation seam) + the `palette_slug` FK clause are the only cross-repo coupling. Inv-16 stays intact (no shared framework/codegen). Testable gate: `git log --name-only` on E commits returns zero `value.js/` paths; per-repo conformance suites flip independently.

## §3 — Wave schedule (provisional — hardened at Wχ close)

| Wave | Title | Thread | Agents | Closes on (completion) | Status |
|---|---|---|---|---|---|
| W0 — *Open · baseline · research dispatch* | — | 1 | D confirmed closed (CLEAN); the E-development audit (6 lanes + SYNTHESIS) committed as the binding baseline; α + γ research dispatched; cohort coordination opened with value.js-I authorial seed | planned |
| Wα — *Research wave (ratification + narrowed dispatch)* | α/γ | 2-3 parallel | The 6-lane E-development audit already executed Wα's substantive work — Wα at execution is **ratification, not greenfield research**: re-verify the audit findings against the live tree + host + value.js at execution-time; dispatch at-most-one narrowed follow-up if a delta surfaces. Three ratification lanes: **R1** cross-repo cohesion contract + the value.js-I shape + the cohort closure discipline; **R2** consumer brittleness map + the T8 `ApiProblem` design + the openapi-codegen flow shape; **R3** transposition risk-assessment (T-P1/T-E1+T-S5/T-E2/T-S3/T-P3 — KISS-score each) | planned |
| Wχ — *Challenge wave* | — | 5 probes in 4+1 batches (4-agent ceiling) | **P1** cross-repo source boundary holds (no value.js source touches from fourier-E; per-repo conformance flip discipline); **P2** transpositions are *transpositions* not additions (each reduces moving parts); **P3** consumer hardening is real-bug + contract-proof not hygiene; **P4** deploy-hook auto-migration idempotent + safe (no double-run hazard; rollback restores migration metadata); **P5** cohort closure discipline (fourier-E + value.js-I close together OR named successor; no half-state) | planned |
| W1 — *Cross-repo cohesion: CORS fix + FK live + dispatcher arm* | α | 1-2 | T4 (palette-api `ALLOWED_ORIGINS` adds `https://fourier.babb.dev`); live cross-repo CORS preflight from fourier → api.color returns 200 with ACAO echo; the `mkbabb/value.js` dispatcher arm fixed OR retired (T-S3 starts here — depends on Wχ-P3 verdict); the `palette_slug` FK live-resolution end-to-end probe (fetch a real palette from fourier's frontend on CF Pages, verify the binding works) | provisional |
| W2 — *value.js-I open + I.W1 visibility split* | α (cohort peer) | 2-3 parallel | value.js-I tranche opened (cohort peer); I.W1 lands the `status` (4-state) → `visibility` (3-state) + `tier` split on value.js's `palette-api`; migration script + cutover on the standalone-rsync host palette-api (W11 PROVENANCE.md §1.3 path) | provisional |
| W3 — *value.js-I.W2 soft-delete + grace + restore* | α (cohort peer) | 2 parallel | `palettes` carries `deletedAt` + grace window; `DELETE` is soft (sets deletedAt); `RESTORE` endpoint; grace window expiry → hard delete; cascade-delete-with-grace for `palette_versions`/`forks`/`votes`/`proposed_names` | provisional |
| W4 — *value.js-I.W3 + I.W4 SOTA envelopes* | α (cohort peer) | 2-3 parallel | `feature`/`unfeature` toggle → idempotent `featured: true/false` setter; problem+json error envelope across all routes; `ETag`/`If-Match` on resource gets + PUT/PATCH; `RateLimit-*` response headers; `Idempotency-Key` on POST + PUT; per-repo conformance suite at `value.js/api/test/conformance/` | provisional |
| W5 — *β.1 — fourier consumer hardening* | β | 2-3 parallel | `web/src/lib/api.ts` rewritten: one parametric fetch core (T-E1+T-S5); typed `ApiProblem` class T8; retry on 429 + RateLimit-aware backoff; ETag/If-Match on PUT; Idempotency-Key on POST; the 2 `as unknown as` survivors at `web/src/lib/equation/api.ts:36,53` retire structurally (`git grep "as unknown as" web/src/` → zero) | provisional |
| W6 — *β.2 — value.js demo + csp-solver consumer hardening* | β | 2 parallel | value.js demo client `demo/@/lib/palette/api/*` gets the same `ApiProblem` typed surface (per-repo independent — inv-16); csp-solver `useApi.ts` cross-repo coordination (a value.js-I sub-item OR a csp-solver maintainer ask) | provisional |
| W7 — *γ.1 — performance transpositions T-P1 + T-P3* | γ | 2 parallel | Vite `manualChunks` config (Vue + UI + math + paper vendor splits) — the 854 kB index becomes ≥4 chunks each <300 kB; Mongo content-addressable cache for `extract_contour` + `compute_epicycles` via the existing `extraction_cache_key` index | provisional |
| W8 — *γ.2 — elegance transpositions T-E2 + T-S3* | γ | 2 parallel | `openapi-typescript` codegen for `web/src/lib/types.ts` from the live `/openapi.json` (retires hand-mirror); the `/opt/deploy/scripts/dispatch.sh` retire — per-repo webhook URLs at `deploy.babb.dev/hooks/<repo>` (the latent-broken `mkbabb/value.js` arm dies with it) | provisional |
| W9 — *ε.1 — deploy-hook auto-migration* | ε | 1-2 | `scripts/deploy-hook.sh` invokes `python -m api.scripts.run_pending_migrations` post-build pre-up (or post-up gate-then-migrate per P2.C1 shape (C) for empty DB / (B) for data); idempotent runner with per-migration tracking (`migrations` collection); rollback restores migration metadata; live cutover demonstrates the discipline | provisional |
| W10 — *δ — test integrity completion* | δ | 2-3 parallel | Cross-env Playwright green (close D.W6 AMBER — fix the pre-existing UI/data drift); the cross-repo conformance probe T7 + cron-runnable harness; the `test_backfill_image_bounds_on_migrated_image` pytest failure resolved; `vue-tsc -b --force` clean | provisional |
| W11 — *ε.2 — operational hygiene + cross-repo upstream commits + W11 FULL rename* | ε | 2 parallel | Cross-repo upstream commits land (floridify maintainer commits the Mongo bind dirty edit upstream; value.js maintainer commits the palette-api compose ports edit); dangling Docker images cleaned (gaggle/server-api/speedtest-* via `docker image prune`); dead `:8140` speedtest vhost cleanup; W11 FULL palette-api → color rename in a scheduled-downtime window (host dir/compose project/container/volume per `PALETTE-API-PROVENANCE.md §4`); the C9 invariant numbering reconciled | provisional |
| W12 — *Close + cohort close* | — | 1 | reconcile PROGRESS; author `E/FINAL.md` (§0→§9 mirroring `D/FINAL.md`); cohort-close discipline: confirm value.js-I close OR name successor; CANONICAL-ORDERING → ordering ζ; the EA1 documentation sharpenings discharged at the close ceremony | provisional |

Hard ceiling 4 agents/wave (DA6/NA6 guard inherited). The W0 → Wα → Wχ research-first gate is binding for α + γ. W1 (α; CORS + FK) precedes W2-W4 (cohort peer value.js-I). β (W5/W6) follows α (consumers depend on the binding contract). γ (W7/W8) runs parallel with β (disjoint files). δ (W10) + ε (W9/W11) follow. W12 closes the cohort.

## §4 — Phases

**Phase 0 — research + challenge (W0–Wχ).** The cohort coordination shape + the consumer brittleness map + the transposition risk are open questions; research surveys, challenge tests no value.js source touch + transpositions are transpositions + consumer hardening is real-bug not hygiene + deploy-hook auto-migration is idempotent + cohort closure discipline holds.

**Phase I — cross-repo cohesion completion (W1–W4).** The CORS fix lands first (one env var; unlocks the cross-repo browser path); the cohort peer value.js-I opens at W2; I.W1–I.W4 lands the 53 DEFERRED-TO-VALUE.JS cells.

**Phase II — consumer hardening (W5–W6).** Parallel with γ. Disjoint files.

**Phase III — architectural transpositions (W7–W8).** The 5 RECOMMENDED-for-E transpositions land in two waves; each demonstrably reduces moving parts.

**Phase IV — operational hygiene + test integrity (W9–W10).** The deploy-hook auto-migration + the cross-repo conformance probe + the W6 AMBER → GREEN.

**Phase V — operational close + cohort coordination (W11).**

**Phase VI — close (W12).**

## §5 — Critical files and ownership

The research wave refines this; the known scope at open:

| Surface | Files | Owning wave |
|---|---|---|
| Cross-repo CORS (α.1) | host-side `palette-api` compose env (cross-app residual — coordinated with value.js maintainer); the `palette_slug` FK live probe | W1 |
| Dispatcher arm fix/retire (α.1 + γ.2) | `/opt/deploy/scripts/dispatch.sh` (host); the GitHub webhook URLs across 5 sibling repos | W1 + W8 |
| value.js-I (α cohort peer) | `value.js/api/src/**` (the cohort peer's own boundary; fourier-E doesn't write here); `value.js/docs/tranches/I/**` | W2 + W3 + W4 |
| Consumer hardening (β) | `web/src/lib/api.ts`, `web/src/lib/equation/api.ts` (the 2 `as unknown as` retire); value.js demo `demo/@/lib/palette/api/*`; csp-solver `useApi.ts` (cross-repo coord) | W5 + W6 |
| Performance transpositions (γ.1) | `web/vite.config.mjs` (manualChunks); `api/services/computation.py` + `api/services/contour_extractor.py` + the `extraction_cache_key` Mongo index path | W7 |
| Elegance transpositions (γ.2) | `web/package.json` (`openapi-typescript` dep); `web/src/lib/types.ts` (generated); `web/scripts/gen-types.sh` (NEW); `/opt/deploy/scripts/dispatch.sh` (retire); GitHub webhook config (5 repos via `gh` cli) | W8 |
| Auto-migration discipline (ε.1) | `scripts/deploy-hook.sh` (add migration invocation); `api/scripts/run_pending_migrations.py` (NEW — idempotent runner); `api/services/database.py` (`migrations` collection schema) | W9 |
| Test integrity (δ) | `web/e2e/**`, `api/tests/**`, `scripts/conformance-probe.sh` (NEW); `.github/workflows/ci.yml` (extend with conformance job) | W10 |
| Operational hygiene (ε.2) | Host-only (cross-repo coord + `docker image prune` + Apache vhost cleanup + W11 FULL rename); the C9 invariant numbering reconcile across `A.md/B.md/C.md/D.md` | W11 |

No two waves hold overlapping write bounds. β (web) ∥ γ.1 (api compute + vite config) ∥ γ.2 (typegen + dispatcher). α.1 (W1) writes nothing in fourier (only host coordination); α.2-α.4 (W2-W4) write only in value.js.

## §6 — Hard gates (completion criterion)

Per-wave gates set in the hardened `waves/W*.md` after Wχ. Tranche-level close gates:

- **Cross-repo CORS lives**: `curl -X OPTIONS https://api.color.babb.dev/palettes/<slug> -H "Origin: https://fourier.babb.dev"` returns 200 with `Access-Control-Allow-Origin: https://fourier.babb.dev`.
- **Cohort peer value.js-I closes**: `value.js/docs/tranches/I/FINAL.md` exists with I.W1-W4 green; cross-repo conformance probe T7 runs against both APIs and the FK passes.
- **`palette_slug` FK live**: a real fourier frontend session fetches a real value.js palette by slug; the response is rendered.
- **Consumer hardening**: `git grep -nE "as unknown as" web/src/` returns zero; the `ApiProblem` class is the typed error surface in both consumers; csp-solver `useApi.ts` reads `VITE_API_URL`.
- **Architectural transpositions land**: index bundle ≥4 chunks each <300 kB (post-T-P1); `web/src/lib/types.ts` is generated from `/openapi.json` (post-T-E2); `/opt/deploy/scripts/dispatch.sh` retired (post-T-S3); compute cache hit-rate recorded (post-T-P3); 4 fetch helpers → 1 parametric core (post-T-E1+T-S5).
- **Auto-migration discipline**: `scripts/deploy-hook.sh` invokes the idempotent migration runner; a demonstrated new-migration deploy lands the migration without manual SSH-trigger.
- **Test integrity**: cross-env Playwright matrix all green; cross-repo conformance probe in CI; pytest failure resolved.
- **Operational hygiene**: cross-repo upstream commits committed by their maintainers (with SHAs recorded in PROGRESS); dangling images gone; W11 FULL rename done; C9 invariant numbering reconciled.
- `uv run pytest` green; `vue-tsc -b --force` green; `npm run build` succeeds.
- `PROGRESS.md` matches reality; `FINAL.md` cites commits + artefacts; cohort closure recorded.
- **Named-successor stale-watch** (added at Wχ close 2026-05-28 per P5 refinement): named-successor residuals (e.g., `I.W1 → value.js-J`) carry a target-open date in PROGRESS.md; the E.W12 close ceremony alerts if a residual's successor has not opened within **30 calendar days** of the E close. Honest named-residual + stale-watch; not indefinite half-state.

**Invalid hard gates** (rejected): a shared TypeScript types package (inv-16); per-app Mongo consolidation (T-S2 rejected); npm publish without authorization; cosmetic mass-rename; transpositions that ADD complexity instead of replacing it.

## §7 — Cross-tranche debt and explicit deferrals

**Inherited from D (the named-residuals fold):**
- The 53 DEFERRED-TO-VALUE.JS conformance cells → **W2-W4** (value.js-I as cohort peer).
- The cross-repo CORS gap (the `palette_slug` FK browser layer) → **W1**.
- The deploy-hook auto-migration chronic gap (N11 from EA2; W1 + W3 manual runs) → **W9**.
- The `mkbabb/value.js` dispatcher arm latent-broken (W11 named) → **W1 or W8** (retire via T-S3).
- The `test_backfill_image_bounds_on_migrated_image` pre-existing pytest failure → **W10**.
- The 854 kB index bundle (deferred-out-of-D per `D.md §7`; EA5 surfaces as T-P1 RECOMMENDED) → **W7**.
- The 2 `as unknown as` survivors at `web/src/lib/equation/api.ts:36,53` → **W5** (retire structurally via T-E1+T-S5).
- The cross-repo upstream commits (floridify Mongo bind dirty edit; palette-api compose ports edit) → **W11** (cross-repo coordination).
- The W11 FULL rename (held cosmetic at D; data-bearing volume orphan risk) → **W11** (scheduled-downtime window).
- The dangling Docker images + dead `:8140` speedtest vhost → **W11**.
- The C9 invariant numbering inconsistency (D held by name not number) → **W11** (γ-sub-item).

**Inherited from B/C (chronic ≥2 tranches):**
- **C1** colour-lift `sampleToSVGPath` (4 gates) — rides E.α as a bounded sub-item; fires iff value.js-I publishes it; else stays named-residual.
- **C5** glass-ui substrate carries (4 gates) — cross-repo (glass-ui maintainer); E records the asks, does not discharge.
- **C6** glass-ui cold-boot race — cross-repo; same.
- **C8** cross-cohort infra standardisation plan (4 gates; 63 days stale) — promote to `docs/precepts/infra/archive/`; named-residual unless real infra need surfaces.
- **C2** value.js `Palette`/`colorScale` domain — held latent per inv-15 unless a consumer surfaces (conditional E.ζ thread).

**Deferred out of E (potential successors):**
- A shared TypeScript types package across repos — REJECTED (inv-16); each repo's `openapi-typescript` generates its own types from the contract.
- Multi-replica fourier deployment — inherited inv-19; a fourier-F if ever needed.
- The full value.js `Palette`/`colorScale` domain model — conditional E.ζ; fires iff a real consumer lands.
- Mongo consolidation to one instance per host — REJECTED (T-S2); per-app isolation is load-bearing.
- pnpm workspace replacing `web/vendor/*.tgz` — Wα-research item; default REJECT unless inv-16 finds workspace acceptable.

## §8 — Brittleness window (provisional)

E does NOT plan a brittleness window. Each wave is reversible at its own boundary:
- α.1 (W1) CORS env var: revertible by removing the env var line.
- α.2-α.4 (W2-W4) value.js-I: cohort peer's own boundary; revertible per its tranche.
- β (W5/W6) consumer: client-side; failures contained by deploy gate.
- γ.1 (W7) perf: chunked bundle is additive; revertible by removing the manualChunks config.
- γ.2 (W8) elegance: codegen + dispatcher retire; revertible by re-instating the dispatcher arm.
- ε.1 (W9) auto-migration: idempotent runner is itself a migration's-worth of discipline; the first time it fires is a demo, not a production cutover.
- δ (W10) test integrity: test-only changes.
- ε.2 (W11) operational: each item bounded; cross-repo commits at their own tranche boundary.

```yaml
breaking_changes_during_wave: NO
suspended_gates: none
restoration_wave: N/A — E plans no brittleness window
reason: every wave's scope is reversible at its own boundary; the deploy chain (now
        live via deploy.babb.dev) handles atomic cutovers; no dual-read; no
        host-disruptive operations except the W11 FULL rename which is itself a
        scheduled-downtime window (operator-coordinated, not a tranche-wave).
```

## §9 — Cohort coordination (fourier-E + value.js-I)

The user's "fix our cross repos" directive is the cohort re-mandate. Coordination discipline:

- **fourier-E** authors: `docs/tranches/E/` + `api/scripts/run_pending_migrations.py` (NEW) + `scripts/deploy-hook.sh` (auto-migration extension) + `web/vite.config.mjs` (manualChunks) + `web/src/lib/{api.ts,types.ts}` + `web/scripts/gen-types.sh` (NEW) + host-side ingress/CORS coordination for the cross-repo CORS fix.
- **value.js-I** authors: `value.js/docs/tranches/I/` + `value.js/api/src/**` (I.W1-W4 + conformance suite) + `value.js/api/test/conformance/**`.
- **Shared (the documentation seam)**: `docs/tranches/B/coordination/CRUD-CONTRACT.md` (v2.0.0 ratified at D.W5) + the `palette_slug` FK clause in `docs/tranches/D/research/README.md` R1.
- **Cohort closure**: E and I close together via paired `FINAL.md` commits OR explicit named successor (e.g. value.js-I.W4 residual flows to value.js-J).

The cross-repo source boundary holds: fourier-E commits never touch `value.js/**`; value.js-I commits never touch fourier.

## §X — Congruence findings (for team-lead reconcile)

The 6 EA lanes + the SYNTHESIS surface the binding scope. No `D.md` reconcile required — D is closed CLEAN. The two EA1 DOCUMENTATION sharpenings flow into E.W12 close-record hygiene.

End of E.md.
