# E.Wχ — Challenge wave

**Wave**: Wχ — Challenge wave (5 probes in 4+1 batches; 4-agent ceiling).
**Closed**: 2026-05-28 (post-Wα).
**Status**: GREEN with design refinements folded.
**Authority**: `E.md §3` row Wχ.

## §1 — Probe set + verdicts

| # | Probe | Verdict | Finding |
|---|---|---|---|
| **P1** | cross-repo source boundary holds (no value.js source touches from fourier-E; per-repo conformance flip discipline) | **PASS** | boundary unambiguously named; no overlap; per-repo `ApiProblem` enforced; honest path for half-state via named-successor exists; shared seam is documentation only |
| **P2** | transpositions are *transpositions* not additions (each reduces moving parts) | **PASS (with KISS-honest framing recorded)** | T-E1+T-S5 / T-E2 / T-S3 unambiguously REDUCE; T-P1 + T-P3 framing examined (see §3) |
| **P3** | consumer hardening is real-bug + contract-proof, not hygiene | **PASS** | **9/10 REAL-BUG** (B1, B2, B3, B5, B6, B7, B8, B9 active or latent contract violations); B4 + B10 (RateLimit-aware backoff) are HYGIENE — both retained as defensive polish, not mass-test-add |
| **P4** | deploy-hook auto-migration idempotent + safe (no double-run hazard; rollback restores migration metadata) | **PASS (with W9 design substrate)** | current state: zero migration step in `deploy-hook.sh`; no `migrations` collection; no per-run tracking. **W9 design substrate (Variant C)**: empty-DB safe + sequential per-migration tracking + `migrations` collection with unique key on `(name, version)` + post-up post-build placement (see §4) |
| **P5** | cohort closure discipline (fourier-E + value.js-I close together OR named successor; no half-state) | **PASS (with binding-doc refinements)** | closure scenarios A + B unambiguous; fourier `ApiProblem` static factory forward-compat with non-problem+json responses; one half-state surfaced: I.W1 field-deletion scenario (see §5); 3 binding-doc refinements folded |

## §2 — P1 detail (boundary holds)

The cross-repo source boundary is enforced by 5 documents at rest (`E.md §2`, `CRUD-COHESION-E.md §2`, `COHORT-VALUE-JS-I.md §3`, `EA6 §5 #9`, `Wχ-P3.C4` inherited). The probe found ZERO wave-write overlap. One recorded exception: `openapi-typescript` is a shared build-time tool (NOT shared code output); explicitly anticipated by `ARCH-TRANSPOSITIONS-E.md T-E2 §4`. Boundary intent is **no-shared-code-output**, not no-shared-build-tools.

## §3 — P2 detail (transpositions REDUCE at the right altitude)

The probe surfaced two framing questions:

- **T-P1 Vite manualChunks**: 15-line config addition to `vite.config.ts` (a code-level ADD). But the **runtime** moving parts REDUCE: one monolithic chunk (834 kB) → ≥4 cacheable chunks (each <300 kB) → parallel parse, route-boundary cache hits across deploys, reduced LCP. The KISS-honest altitude is **runtime moving parts**, not code-line count. T-P1 retained as RECOMMENDED.
- **T-P3 compute content cache (now compute_epicycles-only per Wα-R3 Δ-R3.1)**: adds a new cache code path (cache key + code-version hash + lookup + store). But leverages the already-present `extraction_cache_key` Mongo index pattern (per `database.py:60`). The "code-version hash" is 4 lines. Real-world replication rate: high (the demo is a learning tool — users iterate on `n_harmonics`/`n_points` repeatedly). T-P3 retained as RECOMMENDED (compute_epicycles-only scope).

T-E1+T-S5 / T-E2 / T-S3 all unambiguously REDUCE (4 helpers → 1; hand-mirror class of bug → codegen; one indirection layer gone). No transpositions DOWNGRADED.

## §4 — P4 detail (W9 design substrate — Variant C)

Current deploy state (verified at HEAD):
- `scripts/deploy-hook.sh` has zero migration step (build → up → health_gate, lines 106-141).
- `api/services/database.py` does NOT initialize a `migrations` collection.
- Existing migrations (`migrate_image_blobs`, `migrate_flags_field`, `migrate_visualization`) encode **document-level** idempotency (field-existence selector) but NOT **run-level** tracking.
- `deploy-hook.sh` rollback (lines 147-158) git-resets the code; does NOT restore migration metadata.

**W9 binding design (Variant C — empty-DB safe + sequential per-migration tracking):**

1. **Create `migrations` collection** at `api/services/database.py:_init_indexes()` with unique index on `(name, version)` and TTL-free retention; schema:
   ```python
   {
     "_id": ObjectId,
     "name": str,            # e.g. "migrate_flags_field"
     "version": int,          # monotonic per migration
     "started_at": datetime,
     "completed_at": datetime | None,
     "deploy_run_id": str,   # idempotency key = host + commit_sha + timestamp
     "result": "SUCCESS" | "FAILED" | "IN_PROGRESS",
     "error": str | None,
   }
   ```
2. **Author `api/scripts/run_pending_migrations.py`** — the idempotent runner. Discovers all `api/scripts/migrate_*.py` modules; per-module check the `migrations` collection (skip if completed); write `IN_PROGRESS` start record; execute module's `main()`; write `SUCCESS` completion record OR `FAILED` with traceback. Module-level `main()` is itself idempotent (field-selector); the collection record is for run-tracking, not data idempotency.
3. **deploy-hook placement (Variant C)**: post-up + post-health-gate. The new container comes up; health gate passes (proves the code can boot on the OLD schema if the migration is non-breaking, or proves the new code is forward-compat); THEN run migrations. The order is: build → up -d → health_gate → migrate. If the migration fails, the new container is already serving live; rollback git-resets but data is mid-migration. **Mitigation**: each migration is designed to be safe to halt mid-way (document-level idempotency); the next deploy resumes via the field-selector.
4. **Empty-DB shortcut**: the runner skips migrations whose `pre_check()` returns "empty domain" (no documents of the migrated kind exist). This is the (C) shape from D.W3's `migrate_flags_field` rollout.
5. **Webhook redelivery hazard mitigated** by the `flock` on `/run/lock/fourier-deploy.lock` (already present at `deploy-hook.sh:165`) — sequential deploy chain; the runner's first action checks the collection's `IN_PROGRESS` records and either resumes or errors.
6. **Rollback metadata** — when the rollback fires, the runner's `FAILED` record persists; the next deploy sees the failure and either retries (idempotent) or surfaces operator action.

**Hard gate for W9**: a deliberately-introduced new migration deploys through the full chain (push → webhook → deploy-hook → migrate) without manual SSH-trigger AND the `migrations` collection records the run AND a forced re-deploy of the same commit produces zero re-runs (idempotency proof).

## §5 — P5 detail (cohort closure — 3 binding-doc refinements folded)

The probe surfaced an honest half-state scenario:

**Scenario**: value.js-I.W1 visibility split lands (`status` 4-state dropped, `visibility` 3-state added); fourier-E.W1 CORS + FK live verification passes; but I.W2 soft-delete does NOT land. If ANY consumer reads `palette.status`, it breaks silently. The current T7 conformance probe spec is field-name-blind — it would return GREEN on slug + visibility semantics while the wave shipped a breaking field deletion.

**Three binding-doc refinements (folded at Wχ close):**

1. **`coordination/CONSUMER-HARDENING.md` §3 prefix new clause B0** — "palette-envelope field stability"; the value.js-I waves that touch the palette response (I.W1 visibility split, I.W2 soft-delete `deletedAt` add, I.W4 SOTA envelopes) must each audit whether any known consumer (fourier `web/src/lib/api.ts`; value.js `demo/@/lib/palette/api/*`; csp-solver; third-party) reads a deprecated field and coordinate the removal via the conformance suite. The brittleness ledger now reads **B0 + B1–B10** (11 brittlenesses).
2. **`scripts/conformance-probe.sh` (NEW at E.W10) spec** — includes a **palette-envelope field-presence assertion** per the contract v2.0.0 §1 + §3. Probe asserts: GET /palettes/{slug} returns 200 AND envelope carries `{slug, name, colors, currentHash, ...}` per CRUD-CONTRACT §1.3 (NOT `id` per Wα-R1 §1.3); ETag header present (per §5); error responses are `application/problem+json` (per §5). Field-deletion or field-addition surfaces here.
3. **`E.md §6` hard gate addition** — named-successor residuals (e.g., `I.W1 → value.js-J`) carry a target-open date in PROGRESS.md; the E.W12 close ceremony alerts if a residual's successor has not opened within **30 calendar days** of the E close. The named-residual is honest, but a stale-watch prevents indefinite half-state.

## §6 — Wχ close gate

Wχ closes when (a) 5 probes return verdicts; (b) findings folded into binding docs; (c) no NEEDS-NARROWED-FOLLOWUP after refinement. All three conditions met. Wχ is GREEN. W1 opens.

## §7 — Folded into wave-execution

| Refinement | Where | Wave |
|---|---|---|
| B0 palette-envelope field stability | `coordination/CONSUMER-HARDENING.md §3` prefix | folded at Wχ close (this doc) |
| T7 conformance probe field-presence assertion | `scripts/conformance-probe.sh` spec | E.W10 |
| 30-day named-successor stale-watch | `E.md §6` hard gate addition | folded at Wχ close (this doc) |
| W9 Variant C design substrate (migrations collection + runner + post-up placement) | `api/services/database.py` + `api/scripts/run_pending_migrations.py` + `scripts/deploy-hook.sh` | E.W9 |
| T-P3 collapse to compute_epicycles-only | E.W7 | folded at Wα close (Walpha-research-ratification.md) |
