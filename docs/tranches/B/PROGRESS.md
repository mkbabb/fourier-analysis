# Tranche B — progress log

Updated at every wave boundary. Reconciled against reality at the W5 — close ceremony.

A *wave* (per `docs/precepts/instructions/TRANCHE-AND-WAVE-SPEC.md §"Wave"`) is a sub-unit of the tranche bounded by a shared hard gate; each row of the status board below carries a name as well as a position. Bare positional references (`W<N>` alone) are insufficient for any wave that has a name.

## Status board

| Wave | Title | Status | Closed at | Notes |
|---|---|---|---|---|
| W0 | open · research dispatch | planned | — | dispatch readiness after fourier-A close |
| Wα | research wave (six read-only lanes) | planned | — | six parallel lanes scoped in `research/README.md` |
| Wχ | challenge wave (three+1 adversarial probes) | planned | — | P1 / P2 / P3 / **P4 (Wave-1 binding)** probes adversarially review the Wα findings + the new invariants 18-20; the plan hardens at close |
| W1 | CRUD-contract ratification | provisional | — | shared written contract, fourier-only ratification under the orphan verdict; **scope items 8–12 added 2026-05-26 — `partial_sums` typing + 4 SCHEMA addenda + 5 MATRIX reconciliations + test-surface skeleton authoring + §0 binding-force clause** (Wave-1 + Wave-2) |
| **W2 (reactivated)** | **UX coherence (dock idiom + a11y + Configurator adoption)** | **provisional** | — | **authored 2026-05-26 — Wave-1 audit synthesis; 5 parallel agents; scope items 16–17 added 2026-05-26 — @axe-core/playwright forward + auto-recompute regression-guard** (Wave-2) |
| W2-tracking | value.js palette facility (cross-repo, orphaned) | tracking · orphaned | — | latent dependency-legibility sub-section under W2-tracking; value.js-C never opened |
| W3 | fourier `visualization` entity + migration + utility-module landing | provisional | — | converged entity + `api/lib/crud/` helper substrate; **scope items 14–24 added — levels-derivation lift + auto-recompute seam (Wave-1) + 9 migration-story gaps W3.16–W3.24 + image-blob Option B reaffirmed** (Wave-2) |
| W4 | fourier convergence wiring (orphan-verdict fallback primary) | provisional | — | consumer re-pointing; the `colors.ts` gut becomes a named B-residual; **scope items 10–15 augmented — axe-core (Wave-1) + session TTL bump + RateLimit middleware + ETag/If-Match consumer adoption** (Wave-2) |
| W5 | close | provisional | — | tranche close ceremony; **helper-adoption carry-forward assertion bound 2026-05-26 per W4 hard-gate item 11** (Wave-2) |

## Log

### 2026-05-18 — tranche authored (opening plan)

- Extracted from fourier tranche A at A's authoring on 2026-05-18, after the six-agent parallel audit (`docs/audits/runs/2026-05-18-fourier-tranche/`) and the user's follow-up directive to plan CRUD for both apps and split it into its own tranche.
- `B.md`, `research/README.md`, and `coordination/CRUD-CONSTELLATION.md` authored.
- Tranche B is research-first: the implementation waves W1 — CRUD-contract ratification through W5 — close are *provisional*. They harden into `waves/W*.md` specs at the Wχ — challenge wave's close, exactly as value.js's own tranche A was hardened 6 → 8 waves by its hardening pass.
- B does not open until fourier-A closes (the A.W6 close-ceremony wave).
- B's W2 — value.js palette facility tracking row lane (cross-repo substrate) does not unblock until value.js-B closes *and* value.js opens its CRUD peer tranche **C**. B.W1 + B.W3 proceed independently.

### 2026-05-18 — value.js peer corrected to tranche C

- Discovered that value.js already had its own tranche B in flight ("Close A, simplify, complete the AND") with a non-CRUD thesis. The cohort CRUD peer is therefore **value.js-C** (close lineage A → B → C). value.js-C authored same day at `~/Programming/value.js/docs/tranches/C/` (the C.md plan, PROGRESS.md log, the `coordination/CRUD-CONSTELLATION.md` mirror, and the `research/README.md` cross-reference).
- Corrected the references in `B.md` and `coordination/CRUD-CONSTELLATION.md`.
- The cross-repo dependency is now: **fourier-B.W4 → value.js-C.W1 published**.
- Next action: none until the A.W6 close. At that point, dispatch the W0 — open · research dispatch and the Wα — research wave.

### 2026-05-18 — six-agent hardening pass (the H4 / H6 round)

A second six-agent parallel pass refined B. The artefacts live at `docs/audits/runs/2026-05-18-tranche-harden/{h4,h6}.md` — H4 owned the B-specific hardening; H6 owned cross-cutting compliance.

- **Invariant 14 sharpened**: required non-null owner plus the 3-state visibility enumeration `draft | unlisted | public` (rejecting the `gallery.py:206` `user_slug: None` orphan path).
- **Invariant 15 testable gate added**: `grep -rE "mongodb|express|hono|fetch\(" ~/Programming/value.js/src/` returns zero — the close ceremony enforces.
- **B.W2 — value.js palette facility row reclassified** as a cross-repo *tracking row*, not an executable wave; the work lands in value.js-C.
- **W4 fallback contract named**: if `value.js-C.W1` is not published at B.W4 dispatch, B.W4 lands everything *except* the `colors.ts` gut; the residual becomes a named B-residual, never silent.
- **Wχ probe spec added** — three probes: P1 framework-in-disguise; P2 migration-preserves-data; P3 cross-repo-timing-real and image-blob-deferral honesty.
- **CRUD-CONTRACT outline added to `coordination/CRUD-CONSTELLATION.md`** — 13 sections; the §10 conformance-test matrix is the load-bearing gate.
- **R3 deliverable shape mandated**: a 1-row-per-target disposition table with the 3-test "shared data" admit-rule (size ≤ 10 KB, drift-correctness, language-agnostic).
- Citation fixes: `value.js-B → value.js-C` at the coordination doc; the timing-diagram arrow `C.W3 → C.W1` (now showing the W1-published consumption explicitly).

### 2026-05-19 — six-agent CRUD-deepen round (SOTA spec authoring)

Six parallel agents (A1–A6) authored the cohort's spec corpus directly into the tranche folders. Across CRUD-CONTRACT, schemas, research, and wave specs the round landed 4,200+ lines.

**Authored:**

- `coordination/CRUD-CONTRACT.md` (973L, 13 sections §0–§12, 59 `file:line` citations). The state-of-the-art conventions adopted: problem+json (RFC 9457), cursor pagination (base64url, RFC 4648), ETag + `If-Match` (RFC 9110), `Idempotency-Key`, `Link` header (RFC 8288), `RateLimit-*` headers (RFC 9239 draft). KISS rejected: HATEOAS, the JSON:API envelope, codegen / shared-types package, GraphQL, webhooks, and a third coordinating service.
- `coordination/SCHEMA.md` (754L). OpenAPI 3.1 + JSON Schema 2020-12 for `Visualization` and `Palette` plus 6 shared types. The slug pattern aligns to the contract: `^[a-z]+(-[a-z]+){3}$`. Added the 428 `precondition-required` error.
- `coordination/CONFORMANCE-MATRIX.md` (303L; **118 rows / 59 unique assertions × 2 repos** at this round's snapshot — the matrix later grew to 176 / 88 in the U6 utility-extraction round per the R3 refinement assay §2.1). §10 of CRUD-CONTRACT broke out for size; one row per `Assertion | Section | Repo | Test name | Run command | Expected output`. The fourier-B.W1 close-rule: every row must read `PASS` in both columns.
- `research/R-identity-spec.md` (665L). The five-identity-scheme verdict was re-confirmed. The converged model: slug `^[a-z]+(-[a-z]+){3}$` (server-generated, immutable, public) + Mongo `_id` (never public) + content-hash SHA-256 (dedup-only). The slug word-list was **admitted as shared-data** (`@mkbabb/slug-words` npm + PyPI). BLAKE3 was rejected by KISS. The birthday-safe keyspace runs 2.36 × 10⁸ through 10⁵ entities. ULID / UUIDv7 / snowflake were rejected — ObjectId already suffices.
- `research/R-auth-spec.md` (473L). Opaque UUIDv4 session tokens (JWT / PASETO rejected). The anonymous-orphan path was **rejected** (the frontend `ensureUser()` pattern mediates; a one-time `anon-migrated-NNN` backfill handles legacy `user_slug: None` rows). An 8-row authorisation policy table with a five-actor model (`public / session / owner / admin`). The batch return shape **converges on `{ok, affected, errors}`** — fourier's verb wins; `errors[]` is always present; partial success returns 207. The rate-limit posture inherits fourier-A.W4 Option A with SHA-256-hashed IP keys.
- `research/R-lifecycle-spec.md` (544L). The 3-state visibility ratified. Soft-delete uses a **`deleted_at` field** (not a tombstone collection); the grace is 30 days. The cron stays in-process at a 6 h cadence with a **per-document `pinned: bool` flag** that replaces both repos' unbounded `$nin`. Migration: idempotent backfill + verification + (reversible OR completeness-proof). The **image-blob redesign deferred to fourier tranche C** — B's thesis is identity convergence, not storage. The candidate-set ordering: filesystem + nginx > GridFS > MinIO > managed S3.
- `waves/W1.md` (71L), `waves/W3.md` (94L), `waves/W4.md` (97L) — the fourier-B implementation waves hardened to WAVE_SPEC compliance with concrete hard gates: test names + run commands + `git grep` deletion proofs + `npm` publish/view + a Playwright spec + viewports. The W4 fallback contract was made explicit.

**Bonus findings:**

- A value.js impersonation endpoint missing `expiresAt` — an un-expiring-session correctness bug (filed to value.js; not in B scope).
- fourier's `SLUG_PATTERN` at `api/dependencies.py:27` is misnamed (it validates only image slugs and uses a lax pattern); CRUD-CONTRACT §2 unifies under the 4-word pattern.
- value.js's `cron.ts:24` `$nin` retires under the per-document `pinned` invert; this formally entered value.js-C.W2's hard gate.

**Status board updated:** the wave specs B.W1 / W3 / W4 now exist as files (not only inline in B.md). The implementation waves remain *provisional* pending the joint Wχ — challenge wave, per B.md §3.

### 2026-05-19 — U1–U6 utility-extraction refinement round (tranche refinement)

A six-agent parallel round — U1 architectural decision, U2 slug-words spec, U3 `api/lib/crud/` Python utility spec, U4 `api/src/crud/` TypeScript utility spec, U5 tranche-spec refinement (this entry), U6 conformance-matrix extension. Substrate from `docs/audits/runs/2026-05-19-utility-extraction/`.

**U1 revision of invariant 16**: per-language utility modules admitted at ≤ 500 LOC per repo; "shared by contract, per-language utility modules admitted, frameworks rejected". `B.md §2` invariant 16 updated; `coordination/CRUD-CONTRACT.md §9` gained new disposition rows from U6.

**U5 surgical edits (this commit):**

- `B.md §3` wave table: the W3 row absorbs `api/lib/crud/` utility-module landing per the U3 spec (`coordination/CRUD-LIB-PY.md`); the W4 row notes the migrated callers (admin, gallery store, draftStorage) consume the utility helpers landed in W3 alongside the `colors.ts` gut.
- `B.md §5` critical files: a new "fourier utility module" row owned by W3 (8 files at `api/lib/crud/`); the shared-contract row now cites `coordination/SLUG-WORDS.md` (the U2 spec) explicitly as the shared-data location.
- `waves/W3.md`: scope items 11–12 added (utility-module landing + 7 named pytest specs); file bounds add 8 utility-module files + 7 test files; agent units A and B re-scoped (A consumes helpers, B lands the module); hard gates 10–12 added (LOC bound, consumption proof, slug-words data resolution).
- `waves/W4.md`: scope item 12 added (migrated callers consume the W3 helpers — no new helpers authored); hard gate 9 added (helper adoption in admin and the migrated routers).

**No sub-wave split, no new brittleness window**: the utility modules land alongside the entity per U1's bounded invariant 16. The wave shape (W3 — entity + utility; W4 — consumer wiring) is preserved.

**Cross-references**: see `~/Programming/value.js/docs/tranches/C/PROGRESS.md` for the symmetric value.js-C.W2 / value.js-C.W3 refinement.

### 2026-05-19 — refinement-assay round (R1–R4 + R6; orphan verdict recorded 2026-05-26)

A read-only refinement-assay round under `docs/audits/runs/2026-05-19-refinement-assay/`:

- **R1 — cross-repo state-of-the-world assay** (`r1-assay.md`). Reconstructed what actually happened in fourier and value.js since the 2026-05-18 cohort plan was authored. Findings: fourier carries 109 uncommitted paths matching A.md §1 + A.W1 deletion-ledger exactly; zero waves executed on A or B. value.js raced through D → E → F → G → H under different theses; value.js-C **never opened**.
- **R3 — fourier-B refinement assay** (`r3-fourier-B-refinement.md`). Recorded 20 binding refinements over the post-U6 corpus: the ETag shape collision across four documents (binding strong sha256 full 64-char hex), the value.js utility path inconsistency (`api/src/crud/` canonical), the `slug.py/slug.ts` → `slugs.py/slugs.ts` plural correction, the `hard_delete_past_grace` wave-gate over-citation (drop from gates), the missing §S preamble in CRUD-CONTRACT, the `§U.9 — C9.4 admit-criteria` row group addition, the LOC ceilings (Python 525, TypeScript 600 per per-language overhead rationale), the migration-script `--dry-run` + seed=42 spot-check + rollback-substrate documentation additions, and §17 of the action list — the cohort-orphan contingency.
- **R4 — value.js-C refinement assay** (`r4-valuejs-C-refinement.md`). Confirmed value.js-C is **partially-discharged and structurally orphaned**: six of thirteen contract surfaces incidentally landed under value.js's D / E / F / G / H theses (the `formatPalette ??` excision at D.W2 Lane D, the `cron.ts` `$nin` retirement at E.W2 Lane A, the `palette-api` god-module split, the service/repository layering, `withTransaction` coverage, the `as any` corpus to zero); seven structural surfaces remain unbuilt (CRUD-CONTRACT ratification, the library `Palette` type at `src/palette/`, the `colorScale` + `sampleToSVGPath` library lifts, the slug word-list extraction, the `api/src/crud/` utility module, the palette-schema migration to required-non-null-owner + 3-state visibility, the `coordination/CRUD-CONSTELLATION.md` mirror).

**Orphan-verdict effect on fourier-B (recorded 2026-05-26):**

- **W2 — value.js palette facility tracking row** ceases to be load-bearing. The row holds at "tracked-as-orphaned, awaits future value.js re-engagement".
- **W4 — fourier convergence wiring** — the named fallback (H4 §4.W4) becomes the primary path: B.W4 lands everything except the `colors.ts` gut; the residual carries the named-successor destination `fourier-tranche-C-or-successor`; the `easings.ts` sampler retirement defers alongside.
- **CRUD-CONTRACT.md** becomes a fourier-only coherence specification. The fourier-side conformance-matrix rows ratify at W1 close; the value.js-side conformance-matrix rows hold **DEFERRED** (a fifth status alongside TBD / WIP / PASS / WAIVED) pending re-engagement. Stale value.js-side file:line citations re-audit against the post-D / E / F / G / H file layout (per the R3 assay §9) before B.W3 dispatches so the contract's grep-gates do not false-pass on phantom lines.
- Past gates that passed stay passed: the U1–U6 round's contract authoring, the H4 / H6 hardening, the SOTA-conventions ratification, the conformance-matrix landing — none retract.

### 2026-05-26 — Wave-1 audit synthesis

The B-development round opens. Six concurrent audit lanes (L1 prompt/precept recap, L2 plan-reality reconciliation, L3 visualization-stack, L4 glass-ui-usage, L5 docks, L6 deferred-chronic) landed against HEAD `c7cfd82` (A.W6 close); the synthesis at `docs/audits/runs/2026-05-26-B-audit-wave-1/SYNTHESIS.md` consolidated the six lanes into a single substrate-of-record and applied the surgical amendments to B's plan documents.

**B-plan amendments applied at this revision:**

- **Three new invariants** (`B.md §2` invariants 18–20):
  - **Invariant 18 — UI surface conventions**: a11y modal contract (`role="dialog"` + `aria-modal` + Esc + focus trap); dock-shape naming convention (Dock / Panel / Modal); z-index routes through `--z-*` token ladder, no literal `z-[N]`. Discharges L5 §5 8 a11y gaps + L5 §4 naming/z-index drifts.
  - **Invariant 19 — Auto-recompute discipline**: `workspace.saveContourPoints` → `store.contour` identity → auto-compute keyed on contour, not settings. Discharges L3 §3.4 D1 HIGH (load-bearing) + L6 §4 levels-derivation FLAG-GAP.
  - **Invariant 20 — VW + epicycle-render performance budget**: no per-frame O(n) spread on render path; memoize on identity. Discharges L3 §3.6 D5 HIGH.
- **One new wave authored**: `docs/tranches/B/waves/W2.md` — **W2 — UX coherence (dock idiom + a11y + Configurator adoption)**. 5 parallel agents (A Configurator adoption sweep; B Dialog substitution + MED a11y discharges; C Coefficients dedup extraction; D EditorTools retire + ContourSettings keyframe retire; E render-path memoize + DC suppression + naming + z-token). Reactivates the W2 slot whilst preserving the value.js-C cross-repo tracking row as a `W2-tracking` sub-section (orphan-verdict-preserved).
- **Three existing-wave scope augmentations**:
  - W1.md scope item 8 — tighten `AnimationData.partial_sums` type to `Record<string, {x,y}>` in `SCHEMA.md` (discharges L3 §3.6 D7).
  - W3.md scope items 14–15 — levels-derivation lift to `ComputeBasesRequest` model (discharges L6 FLAG-GAP); auto-recompute seam (binds Invariant 19).
  - W4.md scope item 10 augmented — `@axe-core/playwright` wired into `e2e/visualization-crud.spec.ts` (discharges L6 FLAG-GAP + L2 §6.5 routed-not-shaped).
- **Wχ probe augmentation**: P4 — Wave-1 invariant 18-20 binding-test added to the challenge wave.
- **Four coordination-doc updates**:
  - `coordination/CRUD-CONSTELLATION.md` — Wave-1 substrate paragraph appended (records the synthesis as the substrate-of-record; orphan-verdict preserved verbatim).
  - `coordination/CRUD-CONTRACT.md` — §0 "Out of scope" extended to note Invariants 18–20 are fourier-side coherence rules (not cross-repo contract clauses); cross-repo contract scope unchanged.
  - `coordination/SCHEMA.md` — §8 native-types table augmented with the `AnimationData.partial_sums` row.
  - `coordination/CONFORMANCE-MATRIX.md` — new §F section with 6 fourier-only rows binding Invariants 18–20 (F18.1–F18.3, F19.1–F19.2, F20.1); aggregate updated to 182 rows (176 cross-repo + 6 fourier-side coherence).

**Status board updates:** W2 reactivated; W2-tracking sub-section preserved orphan tracking. Wχ row updated to "three+1 probes". W1, W3, W4 notes record their respective scope augmentations.

**Inheritance ledger summary (per SYNTHESIS.md §3):** 48 rows total across six lanes. 22 LOAD-BEARING folded into B amendments at this revision; 6 ALREADY-ABSORBED; 7 CONSTELLATION-CARRY (tracking only — value.js press-scale, three local CSS carries, Pagination primitive, Dialog subpath verification, `--reload`/onnxruntime); 10 OUT-OF-B-SCOPE (5 fourier-C named + 5 KEEP-AS-IS); 3 NEW-RESEARCH-ROW (AB+1 root-barrel re-export policy; DataTable adoption survey; StatusDot parity). **Zero silent deferrals.** The orphan-verdict overlay remains unviolated.

**B-plan coherence verdict at this writing:** every Wave-1 load-bearing item has a named B-destination; no B wave or invariant duplicates another; the orphan-verdict context is preserved verbatim across CRUD-CONSTELLATION.md and CRUD-CONTRACT.md; the new fourier-specific invariants (18–20) are explicitly scoped as fourier-side coherence and do not perturb the cross-repo CRUD-CONTRACT.

**Next action**: dispatch W0 — open · research dispatch (the research wave Wα + challenge wave Wχ then proceed); the new Invariant 18–20 binding-test probe (Wχ.P4) lands alongside P1 / P2 / P3.

### 2026-05-26 — Wave-2 audit synthesis + B-development close

The B-development authoring round closes. Six concurrent Wave-2 audit lanes (C1 fourier CRUD substrate; C2 value.js CRUD substrate; C3 convergence shape; C4 schema + matrix; C5 migration story; C6 risks + SOTA) landed against HEAD `f8db2c6` (post-Wave-1 synthesis); the synthesis at `docs/audits/runs/2026-05-26-B-audit-wave-2/SYNTHESIS.md` consolidated the six C-lanes into the substrate-of-record at the B-development close boundary and applied the final amendments to B's plan documents.

**Audit substrate at this revision (12 audit artefacts total):**

- 6 Wave-1 lane reports + Wave-1 SYNTHESIS — `docs/audits/runs/2026-05-26-B-audit-wave-1/{L1..L6,SYNTHESIS}.md` (substrate of the 2026-05-26 Wave-1 entry above).
- 6 Wave-2 lane reports + Wave-2 SYNTHESIS — `docs/audits/runs/2026-05-26-B-audit-wave-2/{C1..C6,SYNTHESIS}.md` (substrate of this entry).
- 2 syntheses (the consolidated artefacts) — Wave-1 SYNTHESIS and Wave-2 SYNTHESIS.

**B-plan amendments applied at this revision (Wave-2):**

- **Four new invariants** (`B.md §2` invariants 21–24):
  - **Invariant 21 — Slug-mint cryptographic RNG**: `secrets.choice` / `crypto.randomInt`; retires CPython Mersenne via `coolname`. Discharges C1 §6 #4 HIGH.
  - **Invariant 22 — RFC 9457 problem+json envelope**: `application/problem+json` on every non-2xx; closed-set `urn:contract:<kebab>` namespace. Discharges C6 §4 ADMIT 1 / §7 #1.
  - **Invariant 23 — RFC 9110 ETag + If-Match optimistic concurrency**: PATCH/DELETE require `If-Match`; 428 / 412 problem+json envelopes. Discharges C6 §4 ADMIT 2 / §7 #2.
  - **Invariant 24 — RFC 9239 RateLimit header transparency**: every response carries `RateLimit-*`; 429 carries `Retry-After`. Discharges C6 §4 ADMIT 3 / §7 #3.
- **Five existing-wave amendments**:
  - W1.md scope items 9–12 — 4 SCHEMA addenda (RFC 4648 citation; `AnimationData` body; `Idempotency-Key` parameter; `slug-exhausted` catalog row); 5 MATRIX reconciliations (CS5.2 → 21 URIs; CS5.3 slug-exhausted assertion; CS5.4 `Problem` realisation; F-partial-sums round-trip; §F-count clarification); test-surface skeleton authoring (14 pytest files + 5 grep scripts); §0 binding-force clause appended to CRUD-CONTRACT.md.
  - W2.md scope items 16–17 — `@axe-core/playwright` folded forward from W4.d into W2's keystone-state spec (binds Invariant 18 measurement at the same wave it lands); auto-recompute regression-guard assertion (binds Invariant 19 cross-wave).
  - W3.md scope items 16–24 (the C5 9-gap set W3.16–W3.24) — orphan-snapshot detection (chunked `$lookup`); `mint_anon_migrated_slug` minting function; dangling contour-hash post-condition; `migrated_from` idempotency marker; epicycle-animation denormalisation canonicalisation; image-blob FK survival (**Option B reaffirmed — defer entirely, `image_slug` FK stable**); IndexedDB `WorkspaceDraft` lift deferral (cross-reference to W4); migration test specs (`test_migrate_transform.py` + `test_migrate_integration.py`); `--reload` interference docstring.
  - W4.md scope items 13–15 + hard-gate items 11–14 — session TTL 7 → 30 d bump + live-session `expires_at` extension; RFC 9239 RateLimit-header middleware emission (Invariant 24 binding); RFC 9110 ETag / If-Match consumer adoption (Invariant 23 consumer half); helper-adoption carry-forward assertion to W5 (preserves the C6 §2 W4-MEDIUM-risk binding across two waves).
  - W5 close — helper-adoption thresholds (≥ 3 `from api.lib.crud` imports in `admin.py`; ≥ 10 helper sites across migrated routers) re-asserted at the W5 close boundary commit.
- **Five coordination updates**:
  - `CRUD-CONTRACT.md §0` — binding-force clause appended (mandatory-fourier-side + advisory-both-sides on cohort-reopen); SOTA-conventions cross-reference for Invariants 22–24.
  - `SCHEMA.md` — RFC 4648 §5 citation in §1 + §9; `AnimationData` schema body under `components.schemas`; `Idempotency-Key` parameter under `components.parameters`; `urn:contract:slug-exhausted` catalog row (table 20 → 21).
  - `CONFORMANCE-MATRIX.md` — CS5.2 row reconciled to "21 URIs"; new CS5.3 slug-exhausted assertion (×2); new CS5.4 `Problem` realisation meta-row; new F-partial-sums row in §F (§F subtotal 6 → 7); grand total 182 → 187.
  - `CRUD-LIB-PY.md §1` — `secrets.choice` citation bound to Invariant 21 (the discipline was already named; the binding makes the invariant authoritative).
  - `SLUG-WORDS.md §1` — empirical-absence note (`docs/precepts/data/slug-words.json` is absent at HEAD; owed at B.W3 close per W3 scope item 12).

**Cross-lane themes ratified at this revision:** (α) orphan-verdict empirically confirmed (C2 + C3 + C6 converge — 6 / 13 incidental landings on the value.js side; cohort dissolved-not-delayed); (β) contract binding-force is fourier-mandatory + advisory-both-sides on cohort-reopen (C3 §6 recommendation 1; CRUD-CONTRACT §0 carries the clause); (γ) migration story is W3-load-bearing (C1 + C5 + C6 converge — 9 scope-item additions W3.16–W3.24 folded); (δ) empirical-binding is FAIL at HEAD (0 / 182 → 0 / 187 rows PASS); B.W1 ratifies on paper-binding, B.W3 / W4 / W5 empirically bind; (ε) SOTA opportunities are standards-compliant projections of existing substrate, NOT framework-in-disguise (8 ADMIT / 6 REJECT / 2 DEFER; every ADMIT is KISS-compatible).

**Empirical-binding gate verdict at this writing:** **PAPER-BINDING PASS** (every matrix row has a non-empty `Run command` cell at the W1 boundary; the test-surface skeleton authoring at W1 close lifts every named test path to *exists* state). **EMPIRICAL-BINDING FAIL** at HEAD `f8db2c6` — 0 / 187 rows PASS, no test file exists at any named path, no `scripts/conformance/`, no `api/lib/crud/`. The gate **fires** at B.W1 (paper-binding ratification) / W3 (entity + utility-module landing — 94 fourier rows transition to PASS) / W4 (consumer adoption — the W3 landings get their consumer surface) / W5 (carry-forward assertion).

**B-plan-coherence verdict at this writing:** **COHERENT.** Every Wave-2 load-bearing item has a named B-destination (B wave / coordination-doc row / new invariant). No B wave duplicates another. The orphan-verdict context is preserved verbatim across `CRUD-CONSTELLATION.md`, `CRUD-CONTRACT.md`, the wave specs, and PROGRESS. The CRUD-CONTRACT remains coherent under the fourier-mandatory + advisory-both-sides binding force. The SOTA ADMITs are KISS-compatible (no framework-in-disguise resurgence); the 8 admitted candidates are standards-compliant projections of existing substrate; the 6 REJECTs (msgpack; Tanstack Query; MongoDB change streams; WebTransport; HTTP/3; Argon2id for env-var ADMIN_TOKEN) stay rejected. The 9 / 9 KISS rejections re-validate HOLD.

**B-development phase closed at this commit.** B's WAVE EXECUTION remains future work — W0 dispatches when the user authorises. The path forward: W0 — open · research dispatch → Wα — research wave (six lanes) → Wχ — challenge wave (P1 / P2 / P3 + P4) → W1 — CRUD-contract ratification → W2 — UX coherence (parallel with W3) → W3 — fourier visualization entity + migration + `api/lib/crud/` landing → W4 — fourier convergence wiring (orphan-verdict fallback primary) → W5 — close.

**Next action**: await user authorisation for W0 dispatch.
