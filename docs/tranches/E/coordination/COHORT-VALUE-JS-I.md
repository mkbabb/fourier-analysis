# E — cohort coordination with value.js-I

**Status**: authored 2026-05-28. **Authority**: the user's 2026-05-28 directive ("fix our cross repos") IS the value.js-I re-mandate D.W5 + `VALUE-JS-ASK.md` held conditional. **Predecessor**: `docs/tranches/D/coordination/VALUE-JS-ASK.md` (the original ask).

## §1 — The cohort re-mandate

D.W5's CONFORMANCE-MATRIX flipped 87 cells: 27 ADDRESSED, 53 DEFERRED-TO-VALUE.JS, 7 RETIRED-AS-OVER-SPEC. The 53 cells were named-residuals **gated on the user re-mandating value.js's side**. The 2026-05-28 directive is unambiguous:

> "Fix our cross repos. Refine, test, CRUD, our two palette apis and fourier viz apis."

The cohort opens. fourier-E + value.js-I run together; the cross-repo source boundary preserved.

## §2 — value.js HEAD at audit-time

```
value.js HEAD: 16129e012ef6d4ac08420d55518de986850b190f
value.js tag : v0.10.0 (Tranche H close, 2026-05-26)
value.js NPM : v0.10.0 published (audit-confirmed)
palette-api  : v2.0.0 (in-repo at value.js/api/)
deployed     : palette-api-api-1 on prod host (rsync target /home/mbabb/Programming/palette-api/)
```

The `value.js-I` tranche has NOT been opened. The cohort opens it at fourier-E.W2.

## §3 — Cross-repo source boundary (binding)

| Constraint | Rationale |
|---|---|
| fourier-E commits never touch `value.js/**` | inv-16 + Wχ-P3.C4 binding (inherited from D) |
| value.js-I commits never touch fourier | inv-16 + cohort symmetry |
| No shared TypeScript types package | inv-16 (no shared framework/codegen consumed by both repos) |
| No shared HTTP client library | inv-16 |
| Each repo runs `openapi-typescript` on its OWN `/openapi.json` | per-repo independence; matching contract behaviour, not sharing code |
| The `palette_slug` FK contract clause (`research/README.md §R1`) | shared documentation; not shared code |

## §4 — value.js-I shape (binding sketch from EA3 + D.W5)

This is the **fourier-side view** of the value.js-I sketch. The value.js maintainer (the same user) authors `value.js/docs/tranches/I/I.md` per its own KISS-and-scope discipline; the seed below mirrors `CRUD-COHESION-E.md §3` for cohort coordination clarity.

### I.W0 — open + baseline
- value.js-side baseline of the palette-api at v2.0.0 + the 53 DEFERRED-TO-VALUE.JS cells.
- Confirms cohort with fourier-E.

### I.Wα — research wave (3 lanes)
- **R1**: visibility-state-machine design (4-state `status` → 3-state `visibility` + `tier`).
- **R2**: soft-delete + grace + restore semantics (per CRUD-CONTRACT v2.0.0 §4).
- **R3**: SOTA envelope shape (problem+json/ETag/RateLimit/Idempotency-Key per §5).

### I.Wχ — adversarial probes (5)
- **P1**: inv-16 preserved (no shared framework/codegen).
- **P2**: visibility transition semantics (denied vs missing indistinguishable; the C4.5/C4.6 guard).
- **P3**: soft-delete + grace window correctness (cascade discipline + reaper timing).
- **P4**: ETag/If-Match concurrency (no lost updates).
- **P5**: problem+json shape (RFC 7807 conformance).

### I.W1 — visibility split
- `palettes.status` (4-state) → `palettes.visibility` (3-state: `public`/`unlisted`/`private`) + `palettes.tier` (`standard`/`featured`/`archived`).
- Transition guard helper (`visibility_illegal_transition`).
- Migration cutover on the standalone-rsync host path (per `PALETTE-API-PROVENANCE.md §1.3` — the value.js/api/ source is git-tracked but the host deploys via rsync; migration runs on the host's running container).

### I.W2 — soft-delete + grace + restore
- `palettes.deletedAt: timestamp | null` field; default null.
- `DELETE /palettes/{slug}` sets `deletedAt = now()`; soft.
- `POST /palettes/{slug}/restore` clears `deletedAt`; gracefully unconnects from cascades.
- Grace window (configurable; default 30 days) before hard delete.
- Cascade-delete-with-grace for `palette_versions`/`palette_forks`/`palette_votes`/`palette_proposed_names`.

### I.W3 — admin idempotency
- `feature`/`unfeature` toggle endpoints → single idempotent `POST /palettes/{slug}/feature` with `{ "featured": true | false }` body.
- Admin audit row per op (`palette_admin_audit` collection).

### I.W4 — SOTA envelopes + conformance suite
- problem+json (RFC 7807) error envelope across all routes.
- ETag header on GETs; If-Match required on PUT/PATCH (returns 412 on mismatch).
- RateLimit-Limit / RateLimit-Remaining / RateLimit-Reset response headers.
- Idempotency-Key on POST + PUT (24-hour window; replay-safe).
- Per-repo conformance suite at `value.js/api/test/conformance/` — 87 cell assertions (or a subset covering the I-deliverables).

### I.W5 — close + cohort coordination
- `value.js/docs/tranches/I/FINAL.md` authored.
- Cohort closure with fourier-E.W12.

## §5 — The handover seams

### Seam 1 — the contract v2.0.0
- Shared documentation: `docs/tranches/B/coordination/CRUD-CONTRACT.md`.
- Both repos verify their own conformance independently.
- The conformance probe T7 (cron-runnable harness at `scripts/conformance-probe.sh`) probes both APIs + the `palette_slug` FK.

### Seam 2 — the `palette_slug` FK
- fourier-E.W1 lands the CORS fix (one env var; one cross-app edit; operator-coordinated mirroring D.W10).
- The FK live verification runs end-to-end (fetch a real palette from fourier's frontend; render).
- The FK live probe lives in fourier-E (per-repo); value.js-I doesn't need to author the same probe (its conformance suite covers the GET /palettes/{slug} side).

### Seam 3 — the build/deploy artefacts
- fourier's CF Pages deploy and value.js's palette-api docker deploy are independent.
- The cross-repo CORS + FK don't introduce a build-time coupling.
- Each repo's CI is independent; the conformance probe runs against the deployed live URLs.

### Seam 4 — cohort closure
- Paired close OR named successor (per CRUD-COHESION-E §5).
- Half-state at the FK seam is rejected.

## §6 — What fourier-E owes value.js-I

- **The cross-repo CORS fix** at E.W1 (palette-api `ALLOWED_ORIGINS` adds `fourier.babb.dev`) — fourier-side cross-app edit (mirroring D.W10's palette-api CORS fix). Recorded as cross-repo residual at E.W11 if not committed upstream by the palette-api maintainer.
- **The conformance probe T7** at E.W10 — fourier-E authors; value.js-I consumes.
- **The cohort coordination doc** (this doc) — kept in sync as I waves close.

## §7 — What value.js-I owes fourier-E

- **The contract v2.0.0 conformance** (the 53 cells → ADDRESSED) — value.js-side.
- **The palette-API GET /palettes/{slug} stability** — for the `palette_slug` FK contract clause.
- **The conformance suite** at `value.js/api/test/conformance/` — value.js-side.

## §8 — Cohort timeline (fourier-E perspective)

| When | fourier-E | value.js-I |
|---|---|---|
| 2026-05-28 (today) | E.W0 + the 6-lane audit + SYNTHESIS authored | NOT OPENED |
| (user authorises) | E.W0 baseline commit + Wα dispatch | I.W0 opens (cohort) |
| Wα → Wχ | research-first gate | (cohort I.Wα + I.Wχ run parallel) |
| W1 | CORS fix + FK live + dispatcher arm (T-S3 starts) | (cohort prep — I.Wα/Wχ if not closed) |
| W2 | (β starts) | I.W1 visibility split |
| W3 | (β/γ) | I.W2 soft-delete + grace + restore |
| W4 | (γ) | I.W3 + I.W4 SOTA envelopes |
| W5-W11 | β/γ/δ/ε threads | I.W5 cohort close (if I.W1-W4 green) |
| W12 | E close + cohort close | I close (or named successor) |

## §9 — What this doc IS and IS NOT

**IS**: the binding cohort coordination spec; the fourier-side view of value.js-I; the handover seams; the cohort closure discipline.

**IS NOT**: the I tranche's own charter. value.js-I's charter lives at `value.js/docs/tranches/I/I.md`, authored by the value.js maintainer per its own KISS-and-scope discipline; this fourier-side doc records the seam.

## §10 — Files this doc seeds

- `value.js/docs/tranches/I/I.md` (NEW; value.js maintainer)
- `value.js/docs/tranches/I/PROGRESS.md` (NEW; value.js maintainer)
- `scripts/conformance-probe.sh` (NEW at E.W10; cross-repo T7 harness — fourier-side)
- `docs/tranches/E/audit/W11-cohort-coordination.md` (close record at E.W11; the cohort-closure verdict)
