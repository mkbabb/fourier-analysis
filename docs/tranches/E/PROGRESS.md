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
| W3 — *α.3 (cohort) — value.js-I.W2 soft-delete + grace + restore* | provisional | — | thread α (cohort peer) — `palettes` `deletedAt` + grace window; soft DELETE; RESTORE endpoint; cascade-delete-with-grace |
| W4 — *α.4 (cohort) — value.js-I.W3 + I.W4 SOTA envelopes* | provisional | — | thread α (cohort peer) — idempotent `featured: true/false` setter (was toggle); problem+json + ETag/If-Match + RateLimit + Idempotency-Key envelopes; conformance suite at `value.js/api/test/conformance/` |
| W5 — *β.1 — fourier consumer hardening* | provisional | — | thread β — `web/src/lib/api.ts` one parametric fetch core (T-E1+T-S5 collapse); typed `ApiProblem` class T8; retry + ETag + Idempotency; the 2 `as unknown as` survivors at `web/src/lib/equation/api.ts:36,53` retire structurally |
| W6 — *β.2 — value.js demo + csp-solver consumer hardening* | provisional | — | thread β — value.js demo `demo/@/lib/palette/api/*` gets typed `ApiProblem`; csp-solver `useApi.ts` cross-repo coordination |
| W7 — *γ.1 — performance transpositions T-P1 + T-P3* | provisional | — | thread γ — Vite `manualChunks` (854 kB → ≥4 chunks <300 kB); Mongo content-addressable cache for compute paths via existing `extraction_cache_key` index |
| W8 — *γ.2 — elegance transpositions T-E2 + T-S3* | provisional | — | thread γ — `openapi-typescript` generates `web/src/lib/types.ts`; `/opt/deploy/scripts/dispatch.sh` retired in favour of per-repo webhook URLs at `deploy.babb.dev/hooks/<repo>` |
| W9 — *ε.1 — deploy-hook auto-migration* | provisional | — | thread ε — `scripts/deploy-hook.sh` invokes `python -m api.scripts.run_pending_migrations`; idempotent runner with per-migration tracking; rollback restores migration metadata |
| W10 — *δ — test integrity completion* | provisional | — | thread δ — cross-env Playwright matrix green (close D.W6 AMBER); cross-repo conformance probe T7 + cron; the `test_backfill_image_bounds_on_migrated_image` pytest failure resolved |
| W11 — *ε.2 — operational hygiene + cross-repo upstream commits + W11 FULL rename* | provisional | — | thread ε — cross-repo upstream commits (floridify + palette maintainers commit dirty edits); `docker image prune` (dangling images); dead `:8140` speedtest vhost cleanup; W11 FULL palette-api → color rename (scheduled-downtime window per PROVENANCE.md §4); C9 invariant numbering reconciled |
| W12 — *Close + cohort close* | provisional | — | reconcile PROGRESS; `E/FINAL.md` (§0→§9); cohort close discipline (fourier-E + value.js-I close together OR named successor); CANONICAL-ORDERING → ordering ζ; EA1 documentation sharpenings discharged at close |

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
