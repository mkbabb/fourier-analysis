# C4 — Schema + Conformance Matrix audit (Wave 2)

*Agent C4 · Tranche B · Wave 2 · 2026-05-26 · HEAD `f8db2c6` · READ-ONLY*

## §0 — Goal + completion criterion

**Goal.** Validate the OpenAPI 3.1 / JSON-Schema 2020-12 corpus at `docs/tranches/B/coordination/SCHEMA.md:1–864` and the empirical-conformance ledger at `docs/tranches/B/coordination/CONFORMANCE-MATRIX.md:1–530` against the post-Wave-1 substrate; pin the gate-or-bind threshold for B.W1.

**Completion.** §1 enumerates substrate observed; §2 verdicts the nine schema sections; §3 verdicts the twenty-six matrix sub-sections; §4 inventories the gaps; §5 renders the gate-or-bind verdict; §6 binds B.W1 recommendations.

## §1 — Substrate observed

Per C1 (`docs/audits/runs/2026-05-26-B-audit-wave-2/C1-fourier-crud-substrate.md:11–24,62–83`): eight Mongo collections, eight routers, no `visualizations` collection, no `deleted_at`, no `visibility`, no `If-Match`, no `application/problem+json`, no `RateLimit-*` headers, no `Idempotency-Key` middleware. The slug pattern at `api/dependencies.py:27` is the loose `^[a-zA-Z0-9][-a-zA-Z0-9]{2,80}$`. C2 (value.js alignment) was not authored in time for cross-referencing herein; the orphan-verdict at `coordination/CRUD-CONSTELLATION.md` holds value.js rows as `DEFERRED`. The Wave-1 §F addition at `CONFORMANCE-MATRIX.md:485–498` and the `AnimationData.partial_sums` row at `SCHEMA.md:837` are present and consistent with `BasisCanvas.vue:268–273`'s `(sumsForBasis as any)` cast.

## §2 — Schema validation (nine sections)

| § | Section | Validity | RFC alignment | Verdict |
|---|---|---|---|---|
| §1 | Conventions (`SCHEMA.md:30–104`) | YAML fragments syntactically valid; one fragment per convention. | RFC 9457, RFC 9110 §8.8, RFC 8288, IETF httpapi-ratelimit + httpapi-idempotency-key drafts cited verbatim. RFC 4648 base64url citation **omitted** (cursor block names base64url but does not cite the RFC). | **CONFORMS, minor.** Add RFC 4648 citation at line 68 to the cursor convention. |
| §2 | Shared types (`SCHEMA.md:107–258`) | All six schemas (`Slug`, `OwnerSlug`, `Timestamp`, `ContentHash`, `CursorPayload`/`Cursor`, `Problem`) JSON-Schema 2020-12 valid. | `Slug` pattern `^[a-z]+(-[a-z]+){3}$` (`SCHEMA.md:138`) is the Wave-1-ratified shape. `ContentHash` SHA-256 pattern (`:176`) confirmed. `Problem` matches RFC 9457 §3 (members `type/title/status/detail/instance`). | **CONFORMS.** |
| §3 | `Visualization` (`SCHEMA.md:262–448`) | `Visualization`, `VisualizationCreate`, `VisualizationUpdate` valid. Required-field list and 3-state `visibility` enum match `CRUD-CONTRACT.md §4`. | The `palette_slug` cross-reference (`:369`) is sound per invariant 15. | **CONFORMS.** Note: no `Visualization` row in substrate yet (C1 §1); the schema is forward-binding, B.W3 mints it. |
| §4 | `Palette` (`SCHEMA.md:452–661`) | Five schemas valid. `OKLab`/`OKLCh` ranges (`:574–592`) sound (L∈[0,1]; a,b∈[-0.5,0.5]; h∈[0,360)). | Per invariant 15 the domain ops are deferred to value.js library, schema is storage-only — correct. | **CONFORMS** (consumer-only for fourier). |
| §5 | Error catalog (`SCHEMA.md:665–703`) | 20-row table; every `(type, status, title)` triple is unique. | `urn:contract:<slug>` namespace adheres to URN syntax (RFC 8141). | **CONFORMS, minor.** The text at `:306` of `CONFORMANCE-MATRIX.md` says "18 catalogued `type` URIs" — drift from the 20-row catalog. Reconcile to 20. |
| §6 | Pagination envelope (`SCHEMA.md:707–792`) | Request params and `PaginationEnvelope` valid. | RFC 8288 `Link` header example correct. `limit ∈ [1,100]` and `sort` enum match cursor `sort_key` enum (`:199`). | **CONFORMS.** |
| §7 | Webhook / SSE (`SCHEMA.md:796–809`) | KISS-rejection recorded as a testable absence. | n/a (no transport admitted). | **CONFORMS.** |
| §8 | Native types (`SCHEMA.md:813–839`) | 9-row table plus the post-Wave-1 `AnimationData.partial_sums` addendum (`:837`). | The addendum names the consumer-side cast removal in `BasisCanvas.vue:271–274` (substrate cast present today, confirms drift to resolve at B.W2). | **CONFORMS.** |
| §9 | SOTA citations (`SCHEMA.md:843–864`) | 8-row table. | RFC 4648 still absent from the standalone table (only implicitly via "opaque base64url"). | **CONFORMS, minor.** Mirror the §1 RFC-4648 fix here. |

**Section-count: 9. Schema verdict: 9/9 conforming, 3 minor citation/reconciliation deltas.**

## §3 — Conformance-matrix audit (twenty-six sub-sections)

| § | Section | Rows | Mechanism | Balance | Verdict |
|---|---|---|---|---|---|
| §1 | Identity (`MATRIX.md:40–53`) | 6 | curl + pytest + grep | balanced 3×2 | **WELL-FORMED, ALL TBD** (no test file exists at the named path) |
| §2 | Slug algorithm (`:55–70`) | 8 | pytest + grep | balanced | **WELL-FORMED, ALL TBD** |
| §3 | Ownership (`:72–87`) | 8 | pytest + DB-validator | balanced | **WELL-FORMED, ALL TBD.** C1 §6 #1 names the canonical regression case (`gallery.py:162` orphan path). |
| §4-core | Visibility (`:89–104`) | 8 | pytest | balanced | **WELL-FORMED, ALL TBD.** Substrate lacks `visibility` field entirely (C1 §5 §4) — rows unsatisfiable pre-B.W3. |
| §4-extra | Transitions (`:106–119`) | 6 | pytest | balanced | **WELL-FORMED, ALL TBD.** Same unsatisfiability. |
| §5-core | Soft-delete (`:121–136`) | 8 | pytest + grep | balanced | **WELL-FORMED, ALL TBD.** No `deleted_at` field (C1 §5 §5) — pre-B.W3. |
| §5-extra | Grace boundary (`:138–146`) | 2 | pytest | balanced | **WELL-FORMED, ALL TBD.** |
| §6 | Sessions (`:148–163`) | 8 | pytest | balanced | **PARTIAL-SUBSTRATE.** Register/me/logout/timing exist (`api/routers/sessions.py:36–75`); TTL drift = 7d vs contract 30d (C1 §5). |
| §7-core | Admin (`:165–182`) | 10 | pytest | balanced | **PARTIAL-SUBSTRATE.** Audit row + idempotent suspend + flag uniqueness exist (`admin.py`, `database.py:88–90`); `delete-bypasses-grace` unsatisfiable (no grace). |
| §7-extra | Batch return shape (`:184–192`) | 2 | pytest | balanced | **WELL-FORMED, ALL TBD.** Substrate emits `{ok, affected}` (C1 §4) not contract's `{processed, errors[]}`. |
| §8-core | Cron / TTL (`:194–209`) | 8 | grep + pytest | balanced | **PARTIAL-SUBSTRATE.** `pinned: bool` indexed predicate post-W4.a (C1 §5 §8); `grep-no-unbounded-nin.sh` would pass today. |
| §8-extra | Pinned flag (`:211–219`) | 2 | pytest | balanced | **WELL-FORMED.** Substrate supports the assertion (C1 §3). |
| §9 | Shared-vs-code (`:221–234`) | 6 | conditional + grep | balanced | **WELL-FORMED, ALL TBD.** R3 disposition (slug-words shared as data) is the precondition. |
| §11 | Migration (`:236–249`) | 6 | pytest + CLI | balanced | **WELL-FORMED, ALL TBD.** `migrate_visualization.py` is a B.W3 deliverable. |
| §S1 | Cursor pagination (`:262–271`) | 6 | pytest | balanced | **PARTIAL-SUBSTRATE.** Cursor encode/decode exists (`gallery.py:57–71` per `SCHEMA.md:76`); test rows yet to be authored. |
| §S2 | ETag concurrency (`:273–280`) | 4 | pytest | balanced | **NOT-YET-IMPLEMENTED.** No ETag emission in substrate. |
| §S3 | Idempotency-Key (`:282–289`) | 4 | pytest | balanced | **NOT-YET-IMPLEMENTED.** No middleware. |
| §S4 | Rate-limit headers (`:291–298`) | 4 | pytest | balanced | **NOT-YET-IMPLEMENTED.** No `RateLimit-*` headers emitted (`api/services/rate_limiter.py` enforces but doesn't surface). |
| §S5 | Problem+json envelope (`:300–307`) | 4 | pytest + grep | balanced | **NOT-YET-IMPLEMENTED.** Substrate raises `HTTPException(detail=str)` — no `application/problem+json`. Catalog-coverage row mis-numbered (18 vs 20). |
| §S6 | URL shape / Link (`:309–316`) | 4 | pytest + grep | balanced | **PARTIAL-SUBSTRATE.** URL-shape grep passes per C1 §3 #4; `Link` header absent. |
| §S7 | CRUD identity-stability (`:318–325`) | 4 | pytest | balanced | **WELL-FORMED, ALL TBD.** Requires the `Visualization` entity (B.W3). |
| §U.1–§U.8 | Utility modules (`:345–441`) | 58 | pytest + vitest | balanced | **NOT-YET-IMPLEMENTED.** No `api/lib/crud/` directory exists in substrate. |
| §F | Fourier-side coherence (`:485–498`) | 6 (fourier-only) | playwright + grep | n/a (single-column by design) | **WELL-FORMED, ALL TBD.** `e2e/visualization-ux.spec.ts` and `scripts/conformance/grep-*` not yet authored. |

**Section-count: 26. Row-count: 182 (176 cross-repo + 6 fourier-only). Substrate verdict: 0/176 PASS at HEAD; ≈30 partial-substrate rows (§6, §7-core, §8-core, §S1, §S6) could PASS at B.W3 with test authoring alone.**

## §4 — Gap inventory

**SCHEMA gaps (count: 4).** (a) RFC 4648 citation absent (§1, §9). (b) `AnimationData` schema *type* itself not defined — only the §8 cross-reference row exists; the actual `partial_sums: dict[str, dict[Literal["x","y"], float]]` shape has no entry under `components.schemas` (`SCHEMA.md:837`). (c) `Idempotency-Key` header semantics (`SCHEMA.md:82–84`) cite the IETF draft but do not define the request/response header in OpenAPI `parameters`. (d) `image` / `contour` / `session` / `flag` substrate nouns have no SCHEMA section — only `Visualization` and `Palette` do.

**MATRIX gaps (count: 5).** (a) Catalog coverage row CS5.2 says "18 URIs" — actual table is 20 rows (drift). (b) §S5 problem+json rows reference `Problem.model_validate` but no `Problem` Python class exists in substrate (`api/models/` has no `problem.py`). (c) No row asserts the `AnimationData.partial_sums` JSON-serialisation shape (the Wave-1 addendum's *test* surface is unwritten). (d) No row asserts the `urn:contract:slug-exhausted` 503 → its catalog entry is missing from `SCHEMA.md §5` (referenced by U-slugs-3 at `MATRIX.md:353` but not catalogued). (e) §F is fourier-only by design — but its 6 rows are not in the aggregate 176; the new grand total 182 requires the §10-close-gate prose at `MATRIX.md:515` (already amended).

**Test-surface gaps (count: 3).** (a) `api/tests/conformance/` does not exist. (b) `scripts/conformance/` does not exist. (c) `api/lib/crud/` does not exist. All §U.* rows are aspirational pending U3 dispatch.

## §5 — Gate-or-bind audit

**Runnable today: 0 of 182 rows.** No test file at any of the 176 cross-repo named paths exists. No `scripts/conformance/grep-*.sh` script exists. No `api/lib/crud/` surface exists. The matrix is, at HEAD, **entirely aspirational**.

**Partial-substrate (test-authoring would PASS today): ≈30 rows.** Sessions §6 (subject to TTL fix), admin-core §7 (4 of 5 rows), cron-core §8 (3 of 4 rows), cursor §S1 (3 of 3 rows), pinned-flag §8-extra (2 of 2), URL-shape §S6 (1 of 2 rows). All are fourier-column-only; value.js is `DEFERRED` under the orphan verdict.

**Hard-gate recommendation for B.W1:** the W1 ratification gate **shall not** be "every row PASS" — that is a B.W3 close gate per `MATRIX.md:29`. The W1 gate is "every row has a non-empty `Run command` cell." This is satisfied today (every row carries a path). The W1 gate is therefore **PASS** as a paper-binding artefact, **fail-empirical** as a passing-test artefact.

**B.W3 fourier hard-gate threshold:** 88 fourier cross-repo rows + 6 §F rows = **94 fourier rows PASS**; value.js 88 rows hold at `DEFERRED`. The cohort ratification at the §10-close-gate (`MATRIX.md:515`) remains contingent on a successor tranche reopening the value.js column.

## §6 — Recommendations for B.W1

1. **SCHEMA: append the four addenda.** RFC 4648 citation (§1, §9); `AnimationData` type definition under `components.schemas`; `Idempotency-Key` as an OpenAPI parameter; `urn:contract:slug-exhausted` row in §5 catalog (line ~702).
2. **MATRIX: reconcile CS5.2 "18 → 20".** Update the catalog-coverage row (`MATRIX.md:306`) to match `SCHEMA.md §5`'s 20-row table.
3. **MATRIX: add an `AnimationData` row** in §F (fourier-only) asserting the JSON-serialisation shape `dict[str, {x,y}]` round-trips through `BasisCanvas.vue`'s consumer (the cast-removal landing at B.W2).
4. **Author the conformance harness skeletons before B.W3 dispatch:** create empty `api/tests/conformance/test_{identity,slug_format,ownership,visibility,soft_delete,sessions,admin,janitor,pagination,etag,idempotency,rate_limit,problem,url_shape}.py` files (14 files), and the five `scripts/conformance/grep-*.sh` scripts named at `MATRIX.md:522–527`. The skeleton-only authoring closes the "named test path exists" half of the W1 gate today.
5. **B.W3 fourier hard-gate: 94/94 fourier rows PASS.** value.js's 88 rows hold at `DEFERRED` per orphan verdict; the §F's 6 rows ratify on the fourier-only path.

---

**Final tally:** schema sections audited: **9** (9 conforming, 3 minor deltas); matrix sub-sections audited: **26** (182 rows: 0 PASS / ≈30 partial-substrate / ≈152 NOT-YET-IMPLEMENTED); gap count: **12** (4 schema, 5 matrix, 3 test-surface); **gate-or-bind verdict: PAPER-BINDING PASS, EMPIRICAL-BINDING FAIL.** B.W1 closes on the paper binding; B.W3 closes on the empirical binding for fourier-side rows.

— *end C4*
