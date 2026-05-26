# C3 — Convergence shape audit (Wave 2)

**Agent**: C3 (READ-ONLY; tranche development only). **HEAD**: `f8db2c6`.

## §0 — Goal + completion criterion (paired)

**Goal.** Re-read `CRUD-CONTRACT.md` against fourier's and value.js's current substrates; identify the *shape* of convergence (shared data vs per-language utility vs design-only spec); re-validate the three-tier disposition under the orphan verdict; recommend the binding-force the contract should carry going forward.

**Completion.** This document carries: §1 substrate observed; §2 thirteen-section contract re-validation; §3 three-tier re-validation; §4 Wχ probe re-validation; §5 orphan-verdict effect on binding force; §6 recommendations; §7 risks. All seven sections land at this writing.

## §1 — Substrate observed

Read in full: `B.md` (155L); `CRUD-CONTRACT.md` (1197L; 13 §-blocks); `CRUD-CONSTELLATION.md` (270L; orphan banner head); `SCHEMA.md` (864L); `CONFORMANCE-MATRIX.md` (529L; 176 cross-repo rows + 6 §F fourier-only rows = 182); `CRUD-LIB-PY.md` (958L); `CRUD-LIB-TS.md` (759L); `SLUG-WORDS.md` (508L); `R-{identity,auth,lifecycle}-spec.md`; `2026-05-19-crud-deepen/SYNTHESIS.md`; `2026-05-26-B-audit-wave-1/{L6,SYNTHESIS}.md`.

Empirical disposition at HEAD `f8db2c6`: `api/lib/crud/` does **not** exist on disk (`ls api/lib/` returns ENOENT); `docs/precepts/data/slug-words.json` does **not** exist (`ls docs/precepts/data/` returns ENOENT). The contract corpus is **spec-only** at this boundary — every conformance row is `TBD` in fourier's column and `DEFERRED` in value.js's column per the orphan banner at `CRUD-CONSTELLATION.md:3-22`. C1's substrate audit (concurrent) confirms fourier-side NOT-YET across the 13 sections; C2 records value.js-side incidental landings on 6 of 13 surfaces.

## §2 — Section-by-section contract re-validation

For each of CRUD-CONTRACT's 13 §-blocks (§0–§12), the convergence verdict (B = both bound; F = fourier-only binding; A = advisory):

| § | Prescription | fourier state | value.js state | Convergence verdict |
|---|---|---|---|---|
| §0 Status/scope | metadata, KISS-reject list, SOTA-adopt list | NOT-YET (no impl); contract drafted | incidental SOTA partial (cursor pagination, problem+json absent) | **F** — meta-block; advisory across repos |
| §1 Identity | 3-row id table, single-slug rule, URL shape (no hash in URL) | DRIFT (`gallery.py` snapshot_hash URL still live); NOT-YET converged | DRIFT-discharged at D.W2 (formatPalette `??` excised) | **B** — load-bearing both sides; pure rule |
| §2 Slug algorithm | `^[a-z]+(-[a-z]+){3}$`; cryptographic RNG; insert-then-catch | NOT-YET (coolname delegate at `api/slugs.py:10` still uses Mersenne) | CONFORMS-incidentally (`slugWords.ts:80-82`, crypto.randomInt) | **B** — both sides; data shared (§9) |
| §3 Ownership | non-null owner; 401 anonymous; 403 wrong-owner | DRIFT (`gallery.py:206` orphan path live) | CONFORMS (D.W2 `userSlug` required) | **B** — both sides; pure rule |
| §4 Visibility | 3-state `draft\|unlisted\|public` | NOT-YET (`tier` conflation persists) | DRIFT (`status: published\|featured` conflation; never split) | **B** — both sides; pure rule |
| §5 Soft-delete | `deleted_at` + 30d grace + restore + bounded cron | NOT-YET | DRIFT-partial (E.W2 retired `$nin`; no `deleted_at` field) | **B** — both sides; pure rule |
| §6 Sessions | UUIDv4 in header; 30d TTL; suspension cache | CONFORMS (header + UUID); DRIFT (TTL question moot fourier-side) | DRIFT (TTL was 7d; never migrated to 30d) | **B** — both sides; rule + data (`SOFT_DELETE_GRACE_DAYS`) |
| §7 Admin | bearer + 8 actions + idempotency + batch shape `{ok,affected,errors[]}` | DRIFT (`affected` vs `processed` mismatch at `web/src/lib/api.ts:526,537`) | DRIFT (palette-api split landed, batch shape unmodified) | **B** — both sides; rule |
| §8 Cron | `pinned: bool` flag; no unbounded `$nin` | NOT-YET (`janitor.py:60-65` still uses pinned-set scan) | CONFORMS at E.W2 (cron.ts `$nin` retirement) | **B** — both sides; rule |
| §9 Disposition table | 5+1-tier shared/data/library/utility/per-repo/service | NOT-YET (slug-words.json not landed; utility modules absent) | NOT-YET (api/src/crud/ never authored) | **B** — meta-rule that *binds the rest*; ratifying-act |
| §10 Conformance matrix | 182-row ledger; close-rule "both PASS" | TBD on every fourier cell | DEFERRED on every value.js cell per orphan banner | **F-effective** — ratifies fourier alone post-orphan |
| §11 Migration | idempotent, dry-run, count-verify, reversible-or-proof | NOT-YET (no migration script extant) | NOT-YET (palette-schema migration never authored) | **B** — both sides; rule |
| §12 Open items + change log | destination per row; no silent deferral | sat (TBDs all routed) | sat (per orphan-banner) | **A** — bookkeeping |

**Tally**: 9 B (both-bound load-bearing) / 2 F (fourier-only effective) / 2 A (advisory bookkeeping).

## §3 — Three-tier disposition re-validation

**Tier 1 — Shared data (admit, ≤1 item).** `docs/precepts/data/slug-words.json` per `SLUG-WORDS.md` is still the *only* shared-data artefact. Wave-1 surfaced no new candidates: error-code enums and problem+json `type` URIs are *string constants reproduced in both repos* (per `SCHEMA.md §F-error-catalog`), not data-files — they live in the contract text and each repo's `errors.py`/`errors.ts` carries verbatim copies. **Admit unchanged**: one data file at `docs/precepts/data/slug-words.json`, consumed by both `api/lib/crud/slugs.py` (fourier) and `api/src/crud/slugs.ts` (value.js, latent).

**Tier 2 — Per-language utility modules (admit, ≤500 LOC).** The 8-sub-module decomposition (`slugs / cursors / errors / etag / idempotency / softdelete / pinned_cron / __init__`) per `CRUD-LIB-PY.md:42-52` (~535 LOC) and `CRUD-LIB-TS.md` (~600 LOC) is still the right shape — each sub-module realises **exactly one contract §**, cross-cuts ≥2 router consumers, is framework-free (no `BaseCRUDRouter`, no `@crud_endpoint`). No Wave-1 finding pressures the decomposition. **Admit unchanged**.

**Tier 3 — Frameworks (reject).** The §0 KISS-reject list at `CRUD-CONTRACT.md:125-153` survives Wave-1 unscathed. No Wave-1 row argues for re-admitting HATEOAS, JSON:API, GraphQL, codegen, JWT/PASETO, BLAKE3, tombstone, or a third coordinating service. **Reject unchanged**.

## §4 — Wχ probe re-validation

- **P1 framework-in-disguise**: §2 tally counts 9/13 sections as pure-rule (text-only); 1/13 (§9) admits ≤500 LOC of in-repo utility per repo; 0/13 demands shared code. Code-fraction = 0 / 13 = **0%**, well under the 20% threshold. **PASSES** (the framework-in-disguise classifier is satisfied; the rejected-list is empirically the right discipline).
- **P2 migration data-preservation**: with value.js orphaned, the cross-repo migration column collapses to fourier-only. `§11` discipline (idempotent + dry-run + count-verify) binds fourier alone; the value.js palette-schema migration is **structurally never owed**. P2 reduces to fourier's snapshots+gallery → visualization backfill (B.W3). **HOLDS as fourier-only**.
- **P3 image-blob deferral**: ratified at C-scope per `R-lifecycle-spec.md §6` and `r6-fourier-C-scope.md:43-45`; `B.md §7` reaffirms. Invariant 12 violation is *documented* at `§8 "No storage-budget eviction"` rather than discharged — honest deferral. **HOLDS**.
- **P4 Wave-1 binding**: Invariants 18–20 are **correctly scoped out** of `CRUD-CONTRACT` per `§0 Scope` (the 2026-05-26 amendment at lines 111-121 explicitly fenced them as fourier-side coherence rules). The §F rows in `CONFORMANCE-MATRIX.md:515` carry them on a fourier-only ratification path, *not* on the cross-repo path. **HOLDS** — no leakage into cross-repo contract scope.

## §5 — Orphan-verdict effect on binding force

The contract is now a **one-sided design document for fourier** with value.js's incidental landings recorded as CONFORMS/DRIFT against the ratified spec but binding nothing on the value.js side. The §10 close-rule's "both columns PASS" gate is structurally unmeetable. Under the orphan verdict, B.W1 ratifies the contract with **fourier-only authority**: the contract becomes fourier's internal coherence spec + a *latent cohort affordance* for any future value.js re-engagement.

Practical effect: the §10 matrix's value.js column holds at `DEFERRED` (the fifth status introduced at the R3 refinement assay §9, alongside `TBD`/`WIP`/`PASS`/`WAIVED`). The 88 cross-repo value.js cells never block fourier's close. The 6 §F fourier-only rows ratify on the fourier-only path. The contract's identity shifts from *binding* to *prescriptive-internal + advisory-external*.

## §6 — Convergence-shape recommendations

1. **Binding force**: **mandatory-fourier-side-only; advisory both-sides on cohort-reopening**. The contract text remains verbatim; the §10 close-rule is amended (already amended at `CONFORMANCE-MATRIX.md:515`) so the cohort-level "all 176 cells PASS" gate becomes "all 88 fourier cells PASS + all 6 §F cells PASS; the 88 value.js cells DEFERRED". B.W1 ratifies on this amended close-rule.
2. **Slug-words location**: stay with `docs/precepts/data/slug-words.json` per `SLUG-WORDS.md §1` — the precepts submodule is the right home (both repos already pin precepts, no new package, no publish pipeline). **Do not** create a new shared-data repo; do not adopt per-repo copies (drift would not be detected).
3. **Utility-module authoring path**: B.W3 authors `api/lib/crud/` for fourier (8 sub-modules, ≤535 LOC budget) as the substrate landing alongside the `visualizations` router consumer; `api/src/crud/` (value.js) is held DEFERRED with `CRUD-LIB-TS.md` preserved as the substrate for a future value.js re-engagement. **The contract binds the *shape* of the TS module; not its existence.**
4. **Conformance-matrix discipline**: fourier-side rows close at B.W3 (`uv run pytest -k conformance` + `scripts/conformance/grep-*.sh`); the §F rows close at B.W2 (the new UX-coherence wave); the value.js column is frozen at DEFERRED. CI gates on the fourier suite only.

## §7 — Risks + chronic items

**Chronic intersection.** Of L6's 5 chronic items (`L6-deferred-chronic.md §3`): items 1 (value.js `colorScale`/`sampleToSVGPath`) and 4 (image-blob redesign) sit in the contract's penumbra — neither requires a contract clause; both are correctly named-destination-routed (orphan-verdict / fourier-C). No chronic intersects the *binding shape* of the contract.

**Decay risk.** Contract sections at risk of decay if value.js never re-engages: §6 (sessions TTL 7→30d delta becomes academic), §7 (batch shape `{ok,affected,errors[]}` — fourier's batch endpoints are the live consumer); §11 (the palette-schema migration table). Mitigation: the orphan banner at the head of `CRUD-CONSTELLATION.md` makes the latent-affordance honest; no silent decay. **Risk count: 3 sections at latent-decay, 0 at silent-decay**.

**Final summary**. Convergence verdicts: **9 B / 2 F / 2 A** of 13 sections. Three-tier disposition holds unchanged (1 shared-data item; 8 per-language sub-modules per repo; framework class rejected). Binding-force recommendation: **mandatory-fourier-side; advisory cross-repo; ratifies on fourier-only close-rule per the amended §10**. Risks: **3 latent-decay sections; 0 silent**.
