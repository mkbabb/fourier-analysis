# E — progress log

Updated at every wave boundary. Reconciled against reality at W12 close.

## Goal of this log

Record what *actually happened* at each wave of fourier-tranche-E — the cross-repo
cohesion completion, consumer hardening, architectural transposition, test
integrity completion, and operational hygiene tranche — so the close ceremony can
reconcile claim against artefact without archaeology.

## Completion criterion

Every wave's row carries (a) a status word from the canonical set, (b) a close
timestamp once it closes, and (c) a notes cell naming the binding deliverable.
At W12 close every row reconciles against `FINAL.md`'s gate table. The cohort
peer value.js-I closes together or names a successor.

## Status board

| Wave | Status | Closed at | Notes |
|---|---|---|---|
| W0 — *Open · baseline · research dispatch* | **GREEN** | 2026-05-28 | D confirmed closed CLEAN (host HEAD `6039e95`); E-development audit binding baseline (6 lanes + SYNTHESIS at `docs/audits/runs/2026-05-28-E-audit/`); cohort coordination opened with value.js-I authorial seed; α + γ research dispatched; live cross-repo CORS FAIL reproduced (preflight returns `acao: color.babb.dev` only — T4 binding); close record at `audit/W0-open.md` |
| Wα — *Research wave (ratification + narrowed dispatch)* | **GREEN** | 2026-05-28 | 3 lanes all RATIFIED-WITH-DELTA, zero narrowed follow-up. Deltas folded into wave-execution: Δ-EA3.1 CORS env var → W1 (T4); Δ-R2.2 value.js demo default URL stale → W6; Δ-R2.3+Δ-R3.2 openapi.json snapshot → W8; **Δ-R3.1 T-P3 scope collapses to compute_epicycles only** (extract_contour cache ALREADY WIRED at `images.py:220-227`); Δ-R3.3 T-S3 constellation webhook coord script → W8. Close record at `audit/Walpha-research-ratification.md` |
| Wχ — *Challenge* | **GREEN** | 2026-05-28 | 5 probes complete: P1 PASS (boundary holds); P2 PASS (T-P1/T-P3 KISS-honest at runtime-altitude not code-line-count); P3 PASS (9/10 REAL-BUG; B4+B10 RateLimit hygiene retained as defensive polish); P4 PASS w/ W9 design substrate (Variant C: empty-DB safe + sequential per-migration tracking + `migrations` collection unique (name,version) + post-up post-health-gate placement); P5 PASS w/ 3 binding-doc refinements folded (B0 palette-envelope field stability; T7 field-presence assertion; 30-day named-successor stale-watch). Close record at `audit/Wchi-challenge.md` |
| W1 — *α.1 — Cross-repo CORS fix + FK live + dispatcher arm* | **GREEN** | 2026-05-28T04:53:59Z | T4 host `.env` env var updated (`ALLOWED_ORIGINS=https://color.babb.dev,https://fourier.babb.dev`); `palette-api-api-1` container recreated via `docker compose up -d api` (recreate, not restart — `${ALLOWED_ORIGINS:-}` interpolation only fires at create-time); 4-curl probe verified: baseline ACAO color OK; **fourier preflight ACAO echoes `https://fourier.babb.dev`** ✓; negative control rejects evil.example (browser-level enforcement); live FK round-trip GET 200 + envelope; T-S3 dispatcher arm decision RETIRE at W8 (latent-broken `mkbabb/value.js)` arm dies with the file). Close record at `audit/W1-cors-fk-live.md` |
| W2 — *α.2 (cohort) — value.js-I open + I.W1 visibility split* | **GREEN** | 2026-05-28 | value.js-I.W0 + I.W1 LIVE at value.js commit `f3a67a9`; (visibility × tier) 9-tuple state-machine; migration ran 10/10; smoke probe extended; **operational sub-deliverable**: 8 pre-D.W2-vintage seed palettes backfilled (chronic-deferred fields tags/forkCount/currentHash/userSlug/etc. + visibility/tier); live GET /palettes/<slug> envelope carries visibility + tier alongside legacy status; CORS regression-free; 115/115 tests pass; tsc clean; cross-repo source boundary upheld (zero fourier-paths in I commit, zero value.js-paths in this E commit). Close record at `audit/W2-cohort-i-w1.md` |
| W3 — *α.3 (cohort) — value.js-I.W2 soft-delete + grace + restore* | **GREEN** | 2026-05-28 | value.js-I.W2 LIVE at value.js commit `d22a9d1`; palettes.deletedAt + GoneError (410); soft DELETE; restore endpoint; reaper cron with PALETTE_GRACE_MS (30d default); listings filter deletedAt:null; admin delete unified; backfill migration 10/10; deploy GREEN; live envelope carries deletedAt:null; CORS regression-free; 115/115 tests + tsc clean. Close record at `audit/W3-cohort-i-w2.md` |
| W4 — *α.4 (cohort) — value.js-I.W3 + I.W4 SOTA envelopes* | **GREEN** | 2026-05-28 | value.js-I.W3+W4 LIVE at value.js commit `23a7b27`; idempotent `setFeatured(featured: boolean)` (replaces toggle); 4 SOTA envelopes verified live — application/problem+json (RFC 7807; URN type scheme); ETag on GET; If-Match required on PATCH (428/412); RateLimit-* response headers (success + denial); 119/119 value.js api tests pass; CORS regression-free; **deferrals folded to E.W10 δ**: Idempotency-Key middleware + per-repo conformance suite. Close record at `audit/W4-cohort-i-w3-w4.md` |
| W5 — *β.1 — fourier consumer hardening* | **GREEN** | 2026-05-28 | `web/src/lib/api-problem.ts` (T8 RFC 7807 ApiProblem class); `web/src/lib/api.ts` introduces parametric `coreFetch<T>` (T-E1+T-S5 collapse); 3 named wrappers (apiFetch/apiFetchWithETag/adminFetch) become thin pass-throughs preserving caller signatures; `eqFetch` retires; the 2 `as unknown as` survivors retire structurally (body type widened from Record<string, unknown> to BodyInit∪object); retry-on-429 with RateLimit-Reset backoff (B4); If-Match + Idempotency-Key plumbed; single inflight registry (was 2); vue-tsc clean; npm run build OK; zero `as unknown as` in web/src/. Close record at `audit/W5-fourier-consumer-hardening.md` |
| W6 — *β.2 — value.js demo + csp-solver consumer hardening* | **GREEN** | 2026-05-28 | value.js demo `demo/@/lib/palette/api/api-problem.ts` (T8 ApiProblem; per-repo per inv-16); `client.ts` refactored — throws ApiProblem on non-2xx; plumbs `ifMatch` + `idempotencyKey` options; fetchWithRateLimitRetry wraps fetch for B10; **Δ-R2.2 baseline fix**: `DEFAULT_REMOTE_API_URL` from `mbabb.fi.ncsu.edu/colors` (pre-D.W10 VPN) → `api.color.babb.dev` (live); zero new tsc errors in touched files; csp-solver one-line ASK recorded for W11 cross-repo ledger. Close record at `audit/W6-demo-csp-consumer-hardening.md` |
| W7 — *γ.1 — performance transpositions T-P1 + T-P3* | **GREEN** | 2026-05-28 | **T-P1** `web/vite.config.ts` manualChunks split — pre-W7 index 854 kB → 6 chunks: vendor-paper (3 kB), vendor-keyframes (24 kB), vendor-vue (123 kB), vendor-ui (225 kB), vendor-math (348 kB), index (488 kB; -43%); vendor chunks cacheable across deploys. **T-P3** (compute_epicycles only; Wα-R3 Δ-R3.1 scope) — NEW `api/services/compute_cache.py` (SHA256 cache key with COMPUTE_VERSION; Mongo `epicycle_cache` collection + 7-day TTL index; fail-open); router wires lookup-before-compute + store-after; `database.py` adds the TTL index init. 211/212 pytest pass (1 chronic pre-existing failure scheduled for E.W10 δ). Close record at `audit/W7-perf-transpositions.md` |
| W8 — *γ.2 — elegance transpositions T-E2 + T-S3* | **GREEN-partial** | 2026-05-28 | **T-E2** `api/openapi.json` snapshot committed; `web/scripts/gen-types.sh` codegen runner; `web/src/lib/api-schema.d.ts` GENERATED (2287 lines); `openapi-typescript ^7.13.0` devDep + `gen-types` npm script. **T-S3** `scripts/update-webhook-urls.sh` constellation-coord (DRY-RUN + APPLY; pre-flight gh auth check); host-flip dispatcher retire **deferred to W11 ε.2** (requires SSH + gh re-auth in a coordinated operational window). Close record at `audit/W8-elegance-transpositions.md` |
| W9 — *ε.1 — deploy-hook auto-migration* | **GREEN-pending-real-test** | 2026-05-28 | Per Wχ-P4 §8 Variant C: NEW `api/scripts/run_pending_migrations.py` (idempotent runner; inventory MIGRATIONS list with name+version; unique-index migrations collection on (name,version); _record_start/success/failed lifecycle; --dry-run; deploy_run_id audit trail); `scripts/deploy-hook.sh` invokes the runner POST-UP POST-HEALTH-GATE (Variant C) via `compose exec -T api python -m api.scripts.run_pending_migrations`; migration failure does NOT abort deploy (live container proved boot on at-rest schema; convergence on next deploy attempt). 211/212 tests pass. End-to-end proof gates on the next prod migration deploy. Close record at `audit/W9-auto-migration.md` |
| W10 — *δ — test integrity completion* | **GREEN** | 2026-05-28T05:55Z | **Pre-existing pytest residual CLOSED** — `api/dependencies.py:124` projection added `sha256: 1` (the typed `ImageAsset` shim requires it; pre-W10 it was silently rejected on every migrated image → bounds backfill no-op). **212/212 pytest PASS**. **T7 conformance probe LIVE** — NEW `scripts/conformance-probe.sh` with 12 typed assertions across palette API + fourier API + envelope-field-presence (slug/visibility/tier/deletedAt) + ETag/RateLimit headers + problem+json + cross-repo CORS. Live verdict: **12/12 PASS**. Cross-env Playwright matrix deferred to W12 close ceremony. Close record at `audit/W10-test-integrity.md` |
| W11 — *ε.2 — operational hygiene + cross-repo upstream commits + W11 FULL rename* | **GREEN-with-named-residuals** | 2026-05-28 | **LANDED**: T7 conformance probe cron-installed on host (every 6h; first run 12/12 PASS); host docker image prune (-1.208 GB dangling); palette-api compose upstream LANDED at value.js commit `f3a67a9`. **NAMED-RESIDUALS** (explicit owners + runbooks): T-S3 host-flip dispatcher retire (operator-coord; gh re-auth + scheduled deploy window); W11 FULL palette-api → color rename (cosmetic-only at the host-dir layer; api.color.babb.dev already serves cleanly; operator scheduled-downtime window); floridify cross-repo upstream (no local clone; cross-repo ask recorded); dead :8140 speedtest vhost (low-impact; already 404; operator); C9 invariant numbering (doc-tail; zero behavioral impact). Close record at `audit/W11-operational-hygiene.md` |
| W12 — *Close + cohort close* | **GREEN** | 2026-05-28 | E/FINAL.md authored (15 fourier commits W0→W11 cited + cohort 5 value.js-I commits); **Scenario A paired close** with `value.js/docs/tranches/I/FINAL.md` (same ceremony); T7 12/12 PASS verifies cross-repo conformance; CANONICAL-ORDERING advances to ordering η (post-E-close + post-I-close); all named-residuals carry explicit owners; zero half-state at FK seam. Close record at `FINAL.md` |

## Log

### 2026-05-28 — tranche authored (6-lane E-development audit + SYNTHESIS)

**WHAT.** Following the D close (CLEAN), the user directed a deep 6-agent
parallel audit of the original plan + all changes herein, devising the path
forward, with: NO quick solutions / NO workarounds / idiomatic-gestalt /
architectural-transpositions DESIRABLE / NO legacy code; fold deferred + chronic
items; recap ALL prompts; **tranche development only**; **include ALL consumers**;
**fix our cross repos**; **refine, test, CRUD, our two palette apis and fourier
viz apis**.

The audit ran as 6 lanes `EA1`–`EA6` + a SYNTHESIS at
`docs/audits/runs/2026-05-28-E-audit/`.

**Verdict (EA1):** D's CLEAN-close framing HOLDS UNDER FALSIFICATION. Zero
LOAD-BEARING silent misses; zero CHRONIC new; 2 DOCUMENTATION sharpenings
(non-load-bearing). Production state at audit-time matches the D close claims.

**Folded findings — six threads:**

- **α cross-repo cohesion completion** — the value.js-I re-mandate (the
  user's "fix our cross repos" IS this); 53 DEFERRED-TO-VALUE.JS cells; the
  `palette_slug` FK live CORS gap (one env-var fix T4); cohort peer value.js-I
  opens at E.W2.
- **β consumer hardening** — 6 surfaces enumerated (EA3); 10 brittlenesses
  B1-B10; the 2 `as unknown as` survivors at `web/src/lib/equation/api.ts`
  retire structurally via T-E1+T-S5 fetch-helper collapse; typed `ApiProblem`
  class T8 lands in both consumers.
- **γ architectural transpositions** — 17 identified (EA5); top 5 RECOMMENDED:
  T-P1 (Vite manualChunks; 854 kB → split), T-E1+T-S5 (fetch-helper collapse),
  T-E2 (openapi-typescript codegen), T-S3 (dispatcher retire), T-P3 (compute
  content cache). T-S1 (pnpm workspace) flagged for Wα adjudication. T-S2
  (Mongo consolidation) REJECTED.
- **δ test integrity completion** — D.W6 AMBER cells go GREEN; cross-repo
  conformance probe T7 + cron; pytest residual resolved.
- **ε operational hygiene** — deploy-hook auto-migration (N11 chronic from
  W1+W3 manual runs); cross-repo upstream commits (floridify + palette);
  dangling images + dead vhosts; W11 FULL rename; C9 invariant numbering.
- **(conditional) ζ** — value.js `Palette`/`colorScale` domain model; default
  OUT per inv-15.

**Two new E invariants (by name):** auto-migration discipline (deploy chain
idempotently invokes pending migrations); cross-repo source boundary (fourier-E
commits don't touch value.js/**; value.js-I commits don't touch fourier).

**Prompts ledger (EA4):** 55 prompts across A/B/C/D + execution + E-development;
53 ADDRESSED-COMPLETELY, 0 PARTIAL, 2 ROUTED-TO-E (the E directives themselves),
0 OUTSTANDING. 10/10 precepts holding.

**Wave set:** 5 + 1 conditional threads across W0 → Wα → Wχ → W1-W11 → W12. The
research-first gate (W0 → Wα → Wχ) governs α + γ; β/δ/ε direct but still pass
Wχ for inv-16/inv-12 re-cert. Cohort peer value.js-I opens at W2.

**The 15-item must-NOT list** caps inv-12 + inv-15 + inv-16; new items: no
value.js source mods from fourier commits (#9); no manufactured transpositions
(#15); no Mongo consolidation (T-S2 rejected, #12).

**Cohort framing:** fourier-E + value.js-I run together. Cohort closes via
paired FINAL.md or named successor. Cross-repo source boundary preserved.

### 2026-05-28 — E.W0 GREEN

**WHAT.** User authorised "Begin and continue the current tranche... deep
parallelization... no quick solutions, no workarounds, idiomatic gestalt
approaches." Team-lead dispatch opens.

Confirmed:
- D closed CLEAN at `342a078` (post-D HEAD `6039e95`); production live across all
  5 hostnames; the 6-lane audit + SYNTHESIS + the E charter are at `56082c2`
  pushed to origin/master.
- The cross-repo CORS FAIL (EA3 §3 finding) is REPRODUCIBLE at audit-time —
  `OPTIONS /palettes/<slug>` with `Origin: https://fourier.babb.dev` returns
  `access-control-allow-origin: https://color.babb.dev` (NOT echoing fourier).
  The W1 T4 fix is a single host-side env-var edit.
- Sibling state mapped: value.js HEAD `f895048` (post-H release-readiness);
  csp-solver no local clone — W6 cross-repo coord ASK only; floridify dirty
  Mongo bind edit owed upstream at E.W11.

W0 close record: `audit/W0-open.md`.

**Next**: dispatch Wα (3 ratification lanes, parallel agents) → Wχ (5 probes in
4+1 batches) → W1 (α.1 CORS + FK + dispatcher arm).
