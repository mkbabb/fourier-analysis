# H4 — Hardening Audit: fourier-B (CRUD convergence)

**Agent**: H4 (fourier-B hardening) · **Date**: 2026-05-18 · **Scope**: READ-ONLY.

Audits `docs/tranches/B/{B.md, research/README.md, coordination/CRUD-CONSTELLATION.md, PROGRESS.md}` against the precept `tranche/{SPEC,RESEARCH,CHALLENGE,WAVE_SPEC,AGENT_DISPATCH_TEMPLATE}.md`, audit `e-crud-slug-valuejs.md`, the live fourier API/web source, and value.js's `~/Programming/value.js/docs/tranches/{A,B,C}/` plus `api/src/**`.

---

## §1 — Invariant coherence audit (B.md §2, invariants 14–17)

B inherits A's invariants 1–13 (`docs/tranches/A/A.md:33-46`) unchanged and adds four CRUD-specific invariants (`docs/tranches/B/B.md:31-34`).

### Invariant 14 — One converged entity per user-named noun

> The noun a user saves and navigates to (fourier: `visualization`; value.js: `palette`) is one collection, one slug, one lifecycle. No parallel noun for the "published" vs "draft" state of the same thing.

- **(a) Actionable** — yes. The fourier-side end state is fully specified: collapse `snapshots` (`api/routers/snapshots.py:15`) + `gallery` (`api/routers/gallery.py:38`) + IndexedDB drafts (`web/src/lib/draftStorage.ts:14`) into one `visualization` collection (`docs/audits/runs/2026-05-18-fourier-tranche/e-crud-slug-valuejs.md:87-101`).
- **(b) Testable** — yes, by hard gate: "`git grep` finds no surviving `snapshot`/`gallery` *identity* scheme" (`B.md:83`).
- **(c) Conflict scan** — none with A's 1–13. Direct **extension** of A.11 ("one human-readable slug per user-named CRUD entity"; `A.md:42`); A held the line, B converges. **Strengthens A.4** (substrate lands with its consumer) by collapsing parallel substrates.
- **Verdict**: **coherent**. Recommend the phrase "one lifecycle" be defined concretely in `CRUD-CONTRACT.md` (visibility states + soft-delete + restoration form the lifecycle) — currently underspecified.

### Invariant 15 — Domain model in the library, persistence in the app

> value.js owns the colour and palette *domain type* and its pure operations (construct, validate, interpolate, serialize). Storage, ownership, and slug-addressing stay in the consuming app. No persistence, no database, no HTTP enters value.js the library.

- **(a) Actionable** — yes. The "library" boundary is `~/Programming/value.js/src/**` (vs `~/Programming/value.js/api/src/**`); the invariant moves `Palette` to `src/`, keeps the existing `palette-api/` storage where it is.
- **(b) Testable** — yes, structurally: a `grep -r "mongodb\|express\|hono\|fetch(" ~/Programming/value.js/src/` must return zero. (Recommend adding this as an explicit hard gate.) Likewise `grep "import.*persistence\|import.*storage" ~/Programming/value.js/src/` zero.
- **(c) Conflict scan** — none with A's 1–13. Codifies the library/app split the precept already implies via A.1 (KISS) and A.5 (no overfitting).
- **Verdict**: **coherent**. **Sharpening recommendation**: add the explicit testable gate above to B.md §6.

### Invariant 16 — Shared by contract before shared by code

> Convergence across a Python and a Node backend is a written contract and shared conventions. Shared runtime *code* is extracted only for language-agnostic data (the slug word-list) and only where KISS demonstrably warrants it. A shared CRUD framework, a code-generation step, or a third coordinating service is overengineering and is rejected by invariant.

- **(a) Actionable** — yes; rejects three concrete anti-patterns by name.
- **(b) Testable** — partially. "No shared framework" is a deletion-style gate (`B.md:86`: "No shared CRUD framework, no codegen step, no third service introduced — the challenge close certifies this"). The Wχ certification is *narrative* unless probed adversarially.
- **(c) Conflict scan** — none with A.1, A.2, A.3, A.12. Strongly reinforces A.12 ("scale without contrivance").
- **Verdict**: **coherent but Wχ-load-bearing**. The invariant is only as strong as the challenge probes that test it. See §6 for the required Wχ probes.

### Invariant 17 — Migration is verified, not hoped

> A data migration ships with a backfill that is verified by count and spot-check, and is either reversible or accompanied by a completeness proof. No lossy cutover; no "the old docs are probably fine".

- **(a) Actionable** — yes; hard gate is named (`B.md:84`: "document counts before/after, spot-check diff").
- **(b) Testable** — yes; the artefact is a count-diff document.
- **(c) Conflict scan** — none. Codifies precept SPEC.md "deletion proof" (`tranche/SPEC.md:55`) for the migration case.
- **Verdict**: **coherent**. Note that the value.js side already has a precedent migration idiom — `~/Programming/value.js/api/src/migrate-slugs.ts:25-67` iterates, idempotent-skips, then reports counts. Recommend explicitly citing this as the @mkbabb migration idiom that fourier's `api/scripts/` migration should mirror.

### Cross-invariant ambiguities and recommendations

1. **Owner contract** is not pinned by invariants 14–17. Audit E (`e-crud-slug-valuejs.md:27`) finds today's gallery silently produces `user_slug: None` rows when `resolve_session()` returns `None` (`api/routers/gallery.py:206`, `api/dependencies.py:144-149`). B.md §1 names this an "incoherence" but does not bind by invariant. **Recommendation**: add invariant 18, or fold into 14: "every visualization has a required `owner_slug`; anonymous publish is rejected by 401, not silently orphaned."
2. **Identity-vs-hash separation** is mentioned only in prose (`B.md:21`: "Content hashes survive only as a deduplication key"). A.11 says "Content hashes are content-addressing for deduplication, never user-facing identity"; B inherits this. Confirm that B.W1 contract explicitly enumerates which hashes survive (`contour_hash` for dedup; `sha256` for image dedup), and which retire (`snapshot_hash` as user-facing handle).
3. **Visibility states** are listed three different ways across the docs: `B.md:21` "draft / unlisted / public"; audit E `e-…md:94` "private / public"; coordination doc `CRUD-CONSTELLATION.md:46` "draft / unlisted / public". **Recommendation**: ratify the 3-state form in CRUD-CONTRACT.md; B.md §1 is canonical.

**Overall invariant verdict**: **coherent, ratify with three sharpenings**: (a) bind owner contract by invariant; (b) add the library-no-persistence gate to §6; (c) reconcile visibility-state enumeration in CRUD-CONTRACT.md.

---

## §2 — Per-lane research-prompt hardening (R1–R6)

The lanes in `research/README.md` are read against `tranche/RESEARCH.md` (`docs/precepts/instructions/tranche/RESEARCH.md:6-19`): "Give each agent a distinct angle … Require artefacts: file references, command output, runtime observations, benchmark data, prior-tranche citations, or concrete sketches."

### R1 — fourier CRUD surface, deeply (`research/README.md:10-17`)

- **Deliverable concrete?** Yes (per-entity row in a table; the starting hypothesis is named).
- **Disjoint from siblings?** Almost. R1 explicitly says "propose the precise shape of the converged `visualization` entity (fields, indexes, slug derivation, owner contract, visibility states)" — this *overlaps R3*'s "the items that go in `coordination/CRUD-CONTRACT.md`". **Sharpening**: R1 owns the **fourier-side artefact map and the as-is/to-be entity sketch**; R3 owns the **decision tree about how the sketch is shared with value.js**. Currently R1's "proposed shape" leaks into R3's lane.
- **Measurable output?** Partial — "one row per entity" is measurable; "proposed shape" is narrative.
- **Key questions to add**: (a) explicit per-entity migration target (delete / rename / merge / preserve); (b) for the surviving content hashes (`sha256`, `contour_hash`), confirm they remain dedup-only with explicit "not user-facing" assertion; (c) enumerate the indexes on the new `visualization` collection (today `gallery` has 7 indexes incl. compound, `database.py:68-78`; the migration must specify the union).
- **Key questions to remove/move**: the "owner contract" decision belongs in R3 (it is a cross-repo shared rule), not in R1.

### R2 — value.js CRUD surface, library and api (`research/README.md:18-26`)

- **Deliverable concrete?** Yes.
- **Disjoint from siblings?** Yes — R2 is read-only against `~/Programming/value.js/{src,api/src}`; no overlap with fourier-side R1.
- **Measurable output?** Yes — palette-CRUD-lifecycle map + named gaps (`colorScale`, `sampleToSVGPath`) confirmed/refuted against source.
- **Key questions to add**: (a) **`formatPalette` `??` defaulting verbatim** (`~/Programming/value.js/api/src/routes/palettes.ts:11-27`) is the value.js-side analogue of fourier's `user_slug: None` orphans — both repos are silently masking pre-migration data; R2 must surface this as the parallel finding, so the contract treats them symmetrically; (b) confirm the `slugWords.ts` is 99 lines (verified: `wc -l` = 99) and contains 3 word-lists — this is the seed for R3's "shared data" decision; (c) confirm `cron.ts` is 30 lines and does **not** use `$nin` over an unbounded set — it uses `distinct` + `$nin` over a *bounded* `palettes.distinct("slug")` (`api/src/cron.ts:19-24`). This is the precedent that retires fourier's unbounded `$nin` pattern.
- **Sharpening**: name the **comparison shape** explicitly — R2 must end with a "what value.js does that fourier does not, and vice versa" table, because R3 builds its decision tree off this comparison.

### R3 — the shared optimum (architecture-decision lane) (`research/README.md:28-39`)

This is the load-bearing lane. The decision tree (`research/README.md:33-37`) is correct in shape — Pure contract / Shared data / Shared library / Shared service — but **the gating predicates are not tight**.

- **Tight predicates required**:
  - **(1) Pure contract** "default position" needs a falsifier: *when does pure contract fail?* Proposed: when the data shapes must be byte-identical for an interop test that both backends must pass. Today no such test exists; contract suffices.
  - **(2) Shared data** admit predicate is "anything that is data, not code." Sharpen: admit when (i) the data is non-trivial in size (>50 lines or >1KB), (ii) drift between copies would be a correctness bug, (iii) the data is genuinely language-agnostic (no code embedded). `slugWords.ts` is 99 lines × 3 lists = ~300 lines of pure strings; drift would mean different slug spaces; passes all three. fourier's `slugs.py` is 10 lines (delegates to `coolname`) — **the two sides do not even use the same word-list today**. The contract must decide: does fourier swap to value.js's lists, or does value.js swap to coolname? Or do both swap to a shared `@mkbabb/slug-words` data package?
  - **(3) Shared library** must be rejected by R3 with one explicit named "duplication is large, behaviour-load-bearing, and stable" item it *almost* satisfies — for honesty. Candidate: the slug uniqueness retry loop. Today fourier checks-then-inserts (`image_storage.py:76-77`) which is racy; value.js's `generateUniqueSlug` (`api/src/slugWords.ts`) has a different shape. R3 must say: "this is logic, not data; logic at this size is cheaper to specify in the contract than to share via a package."
  - **(4) Shared service** must be rejected with the explicit named user invariant ("no superfluous cloud").
- **Output sharpening**: the deliverable says "Output: a recommendation with explicit justification for each row above (admit / reject)". Add: **a single-page contract specification table that becomes the substrate for B.W1's CRUD-CONTRACT.md**. Without this, R3 hands off narrative and B.W1 redoes the work.
- **Sharpening recommendation**: rename "the architecture-decision lane" subtitle to "*the* binding decision: where does each convergence target sit (contract / data / library / service)?" — and require the deliverable to end with a 1-row-per-target table whose rightmost column is the disposition.

### R4 — scaling, KISS bounds, and the image-blob question (`research/README.md:41-50`)

- **Deliverable concrete?** Mostly. Four sub-questions named.
- **Disjoint from siblings?** Yes (scaling + image-blob is its own surface; R5 is migration-only).
- **Measurable output?** Two of four bullets are decisions ("recommend with rationale"); two are designs ("decide the contract", "what does the cron query look like"). The latter need worked examples, not narrative.
- **Key questions to add**: (a) **rate-limiter scaling** — `api/services/rate_limiter.py:36-104` (process-local `OrderedDict`) and `api/dependencies.py:24` (`_suspended_cache`, also process-local) need a stance: single-replica documented honestly per A.12, or Mongo-counter + TTL index? value.js has the same pattern (`api/src/middleware.ts:73-89`). Decide once for both repos in the contract; (b) **the `count_documents` overhead** on `list_gallery` (`api/routers/gallery.py:106,180`) — does the converged `visualization` list endpoint also need a total? R4 should kill the cursor-endpoint total or justify it; (c) the recommended cron query shape: today `{"contour_hash": {"$nin": list(pinned_contours)}}` (`api/services/janitor.py:60-65`) over an unbounded set; value.js's solution is a `distinct` over a bounded set (`api/src/cron.ts:19-24`). R4 must propose the converged form (a `pinned: bool` flag was suggested in audit E `e-…md:123`).
- **Sharpening**: split the image-blob recommendation from the rest — make it a **boxed decision** at the bottom (admit to B / defer to C) so the orchestrator does not lose it under the cron/rate-limit discussion.

### R5 — migration safety (`research/README.md:52-61`)

- **Deliverable concrete?** Yes; four sub-questions.
- **Disjoint from siblings?** Yes (migration only; R3 owns the contract, R4 owns the going-forward queries).
- **Measurable output?** Yes — clean-cutover-or-dual-read is a binary decision with named consequences (the brittleness window `B.md §8`).
- **Key questions to add**: (a) **idempotency proof** — `migrate-slugs.ts:31-36` is idempotent by design (skips sessions with `userSlug` already set); fourier's migration must adopt the same pattern explicitly; (b) **dry-run flag** — does the value.js precedent support `--dry-run`? Read both `migrate-slugs.ts` and `migrate-oklab.ts` and confirm; if not, R5 proposes adding it (cheap and safety-critical); (c) **failure mode coverage** — what happens if the migration crashes at 50%? Recovery posture must be in the deliverable.
- **Sharpening**: require R5 to produce a **migration plan stub** (numbered phases: pre-flight count, dual-collection brief, backfill loop, verification queries, finalize, rollback). B.W3 implements against the stub.

### R6 — constellation timing (`research/README.md:63-72`)

- **Deliverable concrete?** Yes.
- **Disjoint from siblings?** Yes — purely a cross-repo timing map.
- **Measurable output?** Yes — a sequence diagram with dates.
- **Key questions to add**: (a) given value.js-B's status (planning-only at 2026-05-18, six waves, lineage A→B→C confirmed at `~/Programming/value.js/docs/tranches/B/B.md:5,29-46`), R6 should produce a **conservative projected close window** for value.js-B (e.g. "minimum 6 waves × estimated wave duration"), so fourier-B.W4 dispatch has an expected wait; (b) name the explicit B.W3-can-proceed-without-value.js cutpoint — confirm by file bounds that **B.W3 touches zero value.js files**; (c) name the B.W4 cutpoint — what is the minimum value.js-C surface (just `Palette` + `colorScale` + `sampleToSVGPath` from C.W1) that unblocks B.W4? confirms `value.js-C.W1 published` is the precise dependency, not the entire C tranche close.
- **Sharpening**: add a fail-soft contingency — *what if value.js-C.W1 stalls?* B.W4 has fallback shapes (e.g. keep `colors.ts` as-is and only re-point storage). Currently B.md §7 says "B.W4 → value.js-C.W1 published" is the single hard cross-repo dependency; R6 must scope the fallback explicitly.

### Highest-impact sharpening (single recommendation if only one)

**R3 must produce a 1-row-per-target disposition table that *is* the substrate for `CRUD-CONTRACT.md`.** R3 is the architecture decision; it cannot ship narrative. Without this, B.W1 either re-runs the research, or ratifies a contract whose dispositions are implicit. (See §3 below for the receiving structure.)

---

## §3 — Hardened `CRUD-CONTRACT.md` outline

The B.md prose names eight items (`B.md:21-23, B.md §5 row "Shared contract"`); the coordination doc names eight (`CRUD-CONSTELLATION.md:42-50`). They overlap but are not identical. The contract document is the substrate for B.W1 and is symbolically cited by value.js-C (`~/Programming/value.js/docs/tranches/C/research/README.md:16-17`). Below is the hardened outline — every section, every must-have field, every conformance assertion.

### Outline structure

```text
CRUD-CONTRACT.md
├── §0 — Status, authority, scope
├── §1 — Identity
├── §2 — Slug algorithm
├── §3 — Ownership
├── §4 — Visibility
├── §5 — Soft-delete
├── §6 — Sessions
├── §7 — Admin moderation shape
├── §8 — Cron / TTL policy
├── §9 — Shared data vs shared code (R3 disposition)
├── §10 — Conformance test matrix
├── §11 — Migration disposition
└── §12 — Open items, change log
```

### §0 — Status, authority, scope

- Ratification status: ratified at fourier-B.W1, value.js-C-W0 sign-off.
- Authority: this document is binding on both repos; edits propagate via both repos' PROGRESS.md at the same wave boundary (`CRUD-CONSTELLATION.md:108`).
- Scope: shared contract only. Does **not** define:
  - the storage layer (each repo owns its own MongoDB schema)
  - the language/framework (Python/FastAPI vs Node/Hono are out of scope)
  - the UI (each repo owns its own consumer surface)

### §1 — Identity

- **Must-have fields**:
  - Canonical entity name per repo (fourier: `visualization`; value.js: `palette`).
  - **One human-readable slug per entity**, generated by the slug algorithm in §2; this is the user-facing handle (URL, share link, copy-target).
  - **Content hashes are non-identity**: enumerate which hashes survive (`sha256` for image dedup, `contour_hash` for contour dedup in fourier; `currentHash` for palette versioning in value.js) and explicitly state they are **never user-facing**.
- **Conformance assertion**: `grep -r 'snapshot_hash\|content_hash' web/src/ | grep -E "/v/|/p/|/g/"` returns zero (no content hash in any client-side URL pattern). Both repos.

### §2 — Slug algorithm

- **Must-have fields**:
  - Word count: 4-word slugs (matches fourier `coolname.generate_slug(4)` per `api/slugs.py:10` and value.js's `slugWords.ts` 3-list selection).
  - Shape rule: `[a-z]+(-[a-z]+){3}` (lowercase, hyphen-separated, exactly 4 words). Today fourier accepts up to 80 chars (`api/dependencies.py:27` `SLUG_PATTERN`) — the contract must tighten this.
  - **Collision-handling rule**: "rely on the unique index + DuplicateKeyError catch; no check-then-insert pre-flight" (retires the race in `image_storage.py:76-77`).
  - **Word-list disposition**: per R3 — either (a) shared `@mkbabb/slug-words` data package; or (b) shared via the precepts submodule; or (c) two copies kept in sync by this contract (which copy is the source of truth?).
- **Conformance assertion**: `pytest tests/test_slug_format.py` and `vitest test/slug-format.test.ts` both validate against `^[a-z]+(-[a-z]+){3}$`.

### §3 — Ownership

- **Must-have fields**:
  - Every persisted entity has a **required** `owner_slug` (fourier) / `userSlug` (value.js). The field is non-null at creation.
  - **Anonymous publish is forbidden** — `resolve_session()` returning `None` causes a 401, not a `user_slug: None` row (retires the orphan path at `api/routers/gallery.py:206`).
  - **Ownership-bound endpoints**: every `PUT`/`PATCH`/`DELETE` on the entity requires `require_session` + `doc.owner_slug == user_slug` (today's pattern at `api/routers/gallery.py:308-309` becomes universal).
  - **`ensureUser()` substrate**: the frontend MUST hold a session before save; an auto-register-on-save flow is permitted but anonymous-publish is not.
- **Conformance assertion**: integration test `test_publish_requires_session` returns 401 with no `X-Session-Token`. Both repos.

### §4 — Visibility

- **Must-have fields**:
  - Three states: **`draft` | `unlisted` | `public`** (ratify on B.md §1's enumeration; supersedes audit E's two-state proposal at `e-…md:94`).
  - **State transitions**: draft → unlisted (anyone with link); draft → public (listed); unlisted → public; public → unlisted (un-list); any → soft-deleted (see §5).
  - **List filter semantics**: `GET /visualizations?visibility=public` is the gallery; `GET /visualizations?owner=me` returns the caller's drafts + unlisted + public (regardless of visibility).
  - **Field name**: `visibility` (not `tier`; fourier's `tier: featured|saved|normal` is a separate admin concern handled in §7).
- **Conformance assertion**: `GET /visualizations` (no auth) returns only `visibility="public"`; `GET /visualizations?owner=me` requires session and includes all three.

### §5 — Soft-delete

- **Must-have fields**:
  - `deleted_at: datetime | null` field; null means alive.
  - **Grace window**: hard-delete after N days (default 30; configurable per repo).
  - **Soft-delete behaviour**: deleted entities are excluded from public lists by index filter; **restorable** by the owner within the grace window (`POST /visualizations/{slug}/restore`).
  - **Cron interaction**: cron query selects `{deleted_at: {$lt: cutoff}}` for hard delete; this is a **bounded** query (no `$nin` over unbounded sets — retires `api/services/janitor.py:60-65` shape).
- **Conformance assertion**: a deleted-then-restored entity returns to public lists; a deleted entity past the grace window is gone (404).

### §6 — Sessions

- **Must-have fields**:
  - Session token format: opaque UUIDv4 (not a slug; matches `api/routers/sessions.py:27`).
  - Header: `X-Session-Token`.
  - TTL: `session_ttl_days` (currently 30 in fourier per `api/routers/sessions.py:32`).
  - **`last_seen_at` touch on every authenticated request** (both repos do this).
  - User document: keyed by `_id = user_slug`; `created_at`, `last_seen_at`, optional `status: "suspended"`.
  - **Suspension cache**: 60s TTL in-memory cache is acceptable for single-replica (`api/dependencies.py:23-25, 162-172`); the contract documents this as a single-replica constraint per A.12.
- **Conformance assertion**: `POST /sessions` followed by `GET /sessions/me` with the returned token returns the new user_slug; `DELETE /sessions` invalidates the token.

### §7 — Admin moderation shape

- **Must-have fields**:
  - Bearer-token admin auth (single static token via `ADMIN_TOKEN` env var; timing-safe compare per `api/dependencies.py:200-208`).
  - **Actions**: `flag` (any user), `dismiss` (admin), `delete` (admin; hard-delete bypasses soft-delete grace), `suspend_user` (admin; sets `users.status = "suspended"`), `unsuspend_user`.
  - **Idempotency**: every action is idempotent (re-suspending a suspended user is a no-op; re-flagging by the same reporter is rejected with 409 per `api/routers/gallery.py:363-366`).
  - **Audit log**: every admin action writes `admin_audit` (matches `api/services/database.py:88-89` index).
  - **Flag uniqueness**: `(entity_slug, reporter_slug)` unique (matches `api/services/database.py:81-83`).
  - **Tier** (fourier-specific): `featured | saved | normal` is **admin-only**, distinct from user-controlled `visibility`. Document this as a per-repo extension; not part of the binding shape.
- **Conformance assertion**: `admin_audit.find({})` is non-empty after each admin action; double-suspend is idempotent (single audit row, or two with `noop: true`).

### §8 — Cron / TTL policy

- **Must-have fields**:
  - Cron tick interval: 6 hours (matches `api/services/janitor.py:22`).
  - **Bounded queries only**: no `$nin` over unbounded sets; rewrite to either (a) `pinned: bool` flag updated on publish/unpublish, or (b) iterate stale candidates and check pin status per-doc.
  - Cleanup categories: (i) expired sessions (`expires_at < now`); (ii) stale users (`last_seen_at < user_cutoff`); (iii) hard-delete past grace (`deleted_at < grace_cutoff`); (iv) orphaned children (cascade — sessions for deleted users, etc.); (v) audit log retention (90 days).
  - **Cascade order**: child collections before parents (sessions before users; flags before entities).
  - **No storage-budget eviction**: retires fourier's `storage_budget_gb` band-aid (`api/services/janitor.py:84-119`); if image-blob volume is a concern, R4's image-blob-out-of-Mongo decision addresses it.
- **Conformance assertion**: a stale user has all child documents (sessions, flags, entities) deleted in one cron pass; no orphans remain.

### §9 — Shared data vs shared code (R3 disposition)

- **Must-have fields** (one row per target):
  - `slugWords.ts` / word-list — disposition: **{shared data | duplicated with contract}** (R3 decides).
  - Slug algorithm logic — disposition: **shared spec** (this document).
  - Soft-delete semantics — disposition: **shared spec**.
  - Cron policy — disposition: **shared spec**.
  - `Palette` type — disposition: **shared library** (`~/Programming/value.js/src/`); fourier consumes via npm.
  - `colorScale`, `sampleToSVGPath` — disposition: **shared library** (same).
  - Rate-limiter — disposition: **per-repo** (process-local; single-replica documented).
  - DB driver / framework — disposition: **per-repo** (out of scope by invariant 16).
- **Conformance assertion**: `grep -r "import .* from.*shared-crud-framework" {fourier,value.js}` returns zero. No third coordinating service in `docker-compose.{yml,prod.yml}`.

### §10 — Conformance test matrix

A table with one row per §1–§9 invariant and two columns (fourier evidence path, value.js evidence path). Each cell cites a specific test file or runtime artefact. **This section is the single most load-bearing one** — without it, the contract is narrative.

Example rows:
- §3 ownership 401: `api/tests/test_visualization_ownership.py::test_anonymous_publish_rejected` ⇄ `api/test/palette-ownership.test.ts::anonymous_publish_rejected`
- §5 soft-delete restore: `test_visualization_restore_within_grace` ⇄ `palette-restore-within-grace.test.ts`
- §8 cron bounded-query: `test_janitor_no_nin_over_unbounded` (greps the source, asserts query shape) ⇄ same on value.js side.

### §11 — Migration disposition

Reference to the per-repo migration scripts and their conformance proofs:
- fourier: `api/scripts/migrate_visualization.py` produces `docs/tranches/B/audit/migration-counts.md` (pre/post counts, spot-check diff).
- value.js: `api/src/migrate-palette-schema.ts` produces equivalent.

### §12 — Open items, change log

- Open items: anything the joint Wχ surfaced but the contract did not land (each with a destination).
- Change log: one row per ratification or amendment; cites the wave boundary that authored each edit.

### Contract section list (summary)

`§0 Status` · `§1 Identity` · `§2 Slug algorithm` · `§3 Ownership` · `§4 Visibility` · `§5 Soft-delete` · `§6 Sessions` · `§7 Admin moderation` · `§8 Cron/TTL` · `§9 Shared-data-vs-code` · `§10 Conformance matrix` · `§11 Migration disposition` · `§12 Open items/change log`.

The most under-specified section in the current B.md prose is **§10 Conformance matrix** — it does not exist in any current planning artefact. Without it, "ratified by contract" is narrative.

---

## §4 — Wave-table dependency audit (`B.md §3`)

The W1–W5 table (`B.md:38-47`) is provisional. Verify each row's dependency, file bound, and brittleness-window status.

### W0 (Open · research dispatch)

- **Depends on**: A.W6 close; value.js-A close state recorded (per `PROGRESS.md:32`).
- **Blocks**: Wα dispatch.
- **File bounds**: none (ceremony).
- **Audit**: correct. Note that fourier-A is at the time of this audit `planned` (`A.md:6` "Open commit: TBD") — B.W0 cannot dispatch until A.W6 closes. **No issue**; this is the design.

### Wα (Research wave — 6 lanes)

- **Depends on**: W0 close.
- **Blocks**: Wχ.
- **File bounds**: `research/R1..R6-*.md` (read-only against the codebase).
- **Audit**: correct. **Concern**: 6 parallel agents is the maximum the precept allows (`tranche/SPEC.md:39`: "Hard ceiling: max 10 parallel agents"). Within budget, but R2 spans both `value.js/src/` and `value.js/api/src/` — that is two distinct surfaces in one lane. **Recommendation**: keep R2 as one lane (the surfaces are conceptually paired) but require its deliverable to have **two clearly-titled halves** (already partially done — `research/README.md:23-26` says "Two halves").

### Wχ (Challenge wave)

- **Depends on**: Wα close.
- **Blocks**: W1 dispatch (the *entire* implementation track).
- **Agents**: 3 parallel (`B.md:42`). Precept (`CHALLENGE.md:14`): "Use half the research-agent count, minimum two; default maximum five". Half of 6 is 3 — **correct**. See §6 for the required probes.
- **File bounds**: `audit/challenge.md` + the §3 table hardened.
- **Audit**: correct.

### W1 (Shared CRUD contract)

- **Depends on**: Wχ close.
- **Blocks**: W3 (fourier entity, which implements against the contract); also blocks **value.js-C.W0** (which carries the value.js sign-off per `~/Programming/value.js/docs/tranches/C/C.md:39`).
- **File bounds**: `coordination/CRUD-CONTRACT.md` (create); slug word-list location (conditional on R3).
- **Audit**: correct. **Note**: W1 is 2 agents (B.md:43). The two agents are presumably (a) draft the contract from R3's output, (b) cross-repo sign-off pass. Confirm in the hardened W1.md spec.

### W2 (value.js palette facility — cross-repo lane)

- **Depends on**: value.js-B close AND value.js-C open AND value.js-C.W1 in progress. Per the constellation diagram (`CRUD-CONSTELLATION.md:72-102`), the actual cross-repo dependency is **fourier-B.W4 → value.js-C.W1 published**, not fourier-B.W2.
- **B.md:44 says**: "value.js palette facility … lands in value.js's own tranche, version bump consumed by fourier". W2 in fourier-B is therefore **a tracking row, not an executable wave** — the actual work happens in value.js-C.W1. The fourier-B.W2 row is misleading.
- **Audit**: **fragile row**. **Recommendation**: rename "W2 value.js palette facility (cross-repo lane)" to "W2 (tracking — value.js-C.W1 published)" or move it to §7 cross-tranche debt and dispatch *zero* fourier agents to it.

### W3 (fourier `visualization` entity + migration)

- **Depends on**: W1 close.
- **Blocks**: W4 (the consumers need the entity).
- **File bounds**: `api/routers/visualizations.py` (create); `api/routers/snapshots.py` + `api/routers/gallery.py` (carve-merge); `api/models/{gallery,session,shared}.py`; `api/services/{database,image_storage}.py`; `api/slugs.py`; `api/dependencies.py`; migration script under `api/scripts/`.
- **Audit**: file bounds correct. **Concern**: 3 parallel agents touching `api/services/database.py` AND `api/dependencies.py` AND `api/services/image_storage.py` simultaneously risks merge conflict. **Recommendation**: in the hardened W3 spec, partition by file: agent A owns `api/routers/visualizations.py` + the snapshots/gallery carve; agent B owns model + database index + dependencies updates; agent C owns the migration script + verification artefact.
- **Brittleness window**: declared at `B.md §8` — *maybe* a dual-read window during cutover; Wχ confirms or removes.

### W4 (fourier convergence wiring)

- **Depends on**: W3 close AND **value.js-C.W1 published** (the hard cross-repo dependency, `B.md:97`, `CRUD-CONSTELLATION.md:104`).
- **Blocks**: W5 close.
- **File bounds**: `web/src/lib/{colors,api,draftStorage,easings}.ts`; `web/src/stores/{gallery,workspace,animation}.ts`; admin components lifted in A.W5.
- **Audit**: file bounds correct. **Most fragile wave dependency**: W4's hard block on value.js-C.W1 is the **single canonical cross-repo dependency** (`B.md:97`, `CRUD-CONSTELLATION.md:104`). value.js-C cannot even *open* until value.js-B closes AND fourier-B.W1 ratifies the contract. The full chain:

  ```
  fourier-A close → fourier-B.W0 → Wα → Wχ → W1 ratifies contract
                                               │
                                               ▼
                  value.js-B close ─────────► value.js-C opens
                                               │
                                               ▼
                          fourier-B.W3 ⟷ value.js-C.W1 published
                                               │
                                               ▼
                          fourier-B.W4 ─consumes─►
  ```

  value.js-B is six waves (`~/Programming/value.js/docs/tranches/B/B.md §3`); each wave is gated linearly. The window from fourier-B.W1 ratification to fourier-B.W4 dispatch could be substantial. **Risk**: B.W3 and B.W4 are sequenced linearly in B.md; if value.js-C.W1 is not published when B.W3 closes, B.W4 stalls.
- **Brittleness window**: does W4 touch a window? **No** — W4 is the *consumer* re-pointing; the entity already exists from W3. No suspended gate is needed. **The brittleness window (`B.md §8`) is W3-only**, confirming the answer to the audit question.
- **Recommendation**: name the fallback shape in §7. If value.js-C.W1 stalls, fourier-B.W4 can land everything **except** the `colors.ts` gut onto value.js (it can still re-point storage and stores). That partial close is honest provided §7 explicitly carries "colors.ts gut → value.js-C.W1" as a named cross-repo debt item with destination.

### W5 (Close)

- **Depends on**: W4 close.
- **Blocks**: nothing in fourier; B FINAL.md cites value.js-C.W4 for the cohort-discharge attestation.
- **File bounds**: `PROGRESS.md`, `FINAL.md`, coordination docs.
- **Audit**: correct.

### File-bound disjointness

W1, W3, W4 have **disjoint write bounds**:
- W1 writes only `coordination/CRUD-CONTRACT.md` (and possibly the shared-data location).
- W3 writes only API/backend (`api/**` + `api/scripts/`).
- W4 writes only web frontend (`web/src/**`).

There is **no overlap**. W1 → W3 → W4 is a strict chain, but the file bounds are isolated. **Verdict: disjoint, no within-wave write conflicts visible**.

### Brittleness window — is W3 the only candidate?

- W0: ceremony, no breakage.
- Wα: read-only, no breakage.
- Wχ: read-only, no breakage.
- W1: writes one new doc, no breakage.
- W3: **the migration cutover** — gallery list/read endpoints may be briefly down during cutover (`B.md §8`). This is the **only** candidate.
- W4: re-points consumers at the new entity that already exists from W3; no breakage if W3 closes clean.
- W5: ceremony.

**Verdict**: W3 is the only candidate brittleness window. W4 does **not** touch a window. B.md §8 is correct on this point.

---

## §5 — Cross-repo timing verification

`docs/tranches/B/B.md:5` claims the close lineage A → B → C is canonical for value.js. Verify against the value.js artefacts.

### Lineage check

- `~/Programming/value.js/docs/tranches/A/PROGRESS.md:5` — "Planning-only at A open per user directive; no implementation commits exist at the time of this entry." — value.js-A is planning-only at 2026-05-18.
- `~/Programming/value.js/docs/tranches/B/B.md:4-5` — "Successor to: A (value.js HEAD `191d66a` at B open; A.W0–W4 closed; A.W5 uncommitted; A.W6/W7 planned-not-run)" and "Cohort identity: close A honestly; … close A and B both on `FINAL.md` artefacts." This **confirms** B closes A as part of its scope.
- `~/Programming/value.js/docs/tranches/B/B.md §3` — B.W0 (HEADLINE): "Close A — commit W5, execute/re-scope W6, A.W7 close ceremony + A's FINAL.md". So value.js-A close lands **inside value.js-B.W0**.
- `~/Programming/value.js/docs/tranches/C/C.md:4` — "Successor to: B — value.js's close-A-and-simplify tranche … C opens only after B close. (A close lands inside B.W0; the close lineage is therefore A → B → C.)"

**Verdict**: lineage A → B → C **confirmed** in value.js's own docs. fourier-B's claim is correct.

### Right-ordering check (fourier-B opens before value.js-C)

- fourier-B opens after fourier-A close (`B.md:7`).
- value.js-C opens after **value.js-B close AND fourier-B.W1 ratify** (`~/Programming/value.js/docs/tranches/C/C.md:7`; `~/Programming/value.js/docs/tranches/C/coordination/CRUD-CONSTELLATION.md:18`).
- The joint research+challenge is dispatched **from fourier-B** (`~/Programming/value.js/docs/tranches/C/research/README.md:3-7`: "value.js-C does **not** dispatch its own research wave. The cohort's research is *joint*, dispatched from fourier-B and scoped to cover both repos.").

So the ordering is **fourier-B opens, runs Wα+Wχ jointly covering both repos, then ratifies CRUD-CONTRACT at W1**; value.js-C then opens (gated also on value.js-B close).

**Verdict**: fourier-B opening *before* value.js-C is **correct**. fourier-B is the cohort's research substrate; value.js-C is its consumer. This is sound architecturally — the contract is authored once, in one repo, with sign-off propagation.

### The single hard cross-repo dependency

`B.md:97`: "fourier-B.W4 → value.js-C.W1 published" — confirmed at `CRUD-CONSTELLATION.md:104`: "fourier-B.W4 → value.js-C.W1 published is the single hard cross-repo dependency."

This is the **most fragile wave dependency** in B (named in §4 above). The fallback shape is essential.

### Joint research wave

Both repos cite the same research artefacts (`~/Programming/value.js/docs/tranches/C/research/README.md:6` references the fourier R README by symbolic citation). **Verdict**: there is **one research wave**, executed from fourier-B, covering both repos. value.js-C does not re-litigate.

### Cross-repo timing — overall verdict

**Confirmed**: lineage A→B→C, ordering fourier-B-before-value.js-C, joint research wave, single hard dependency (fourier-B.W4 → value.js-C.W1). The plan is correct. The fragility — value.js-B is six linear waves — should be acknowledged with an explicit projected close window in R6 and a fallback shape in B.md §7.

---

## §6 — Wχ probe specification (`CHALLENGE.md`)

Per `tranche/CHALLENGE.md:6-10`: "Challenge agents falsify research claims against artefacts. They do not brainstorm. They do not expand scope. They harden the basis for the plan." And `:14-16`: half-of-research-agents minimum two, default max five.

B.md says Wχ is 3 parallel agents (correct: half of 6). Each agent runs adversarial probes against the Wα deliverables.

### Probe-shape requirements (per `CHALLENGE.md`)

Each probe must: (a) quote the claim; (b) cite the artefact that supports/contradicts/leaves unproven; (c) mark disposition (accepted/narrowed/rejected/speculation); (d) state the plan consequence.

### Wχ agent partitioning

- **Wχ.1 — contract-as-framework probe** (challenges R3): is the proposed `CRUD-CONTRACT.md` (R3's output) a framework in disguise?
- **Wχ.2 — migration safety probe** (challenges R5 and R1): does R5's migration plan actually preserve all snapshot+gallery data lossless, and is the brittleness window genuinely required?
- **Wχ.3 — cross-repo timing probe** (challenges R6 and R3 and R4): does the value.js-C close timing actually permit fourier-B.W4 to close on schedule, and is the image-blob deferral honest?

### Three core probes (load-bearing)

Below are the **three core probes** that decide whether B is shippable.

#### Probe P1 — "Is the contract a framework in disguise?"

- **Target claim**: R3 "Pure contract is sufficient" (`research/README.md:34`; `B.md §2 invariant 16`).
- **Probe**:
  1. For each section in the hardened CRUD-CONTRACT.md outline (§1–§9 above), classify the disposition as **spec (text)** vs **shared data** vs **shared code**.
  2. If **>20%** of sections require shared code or a shared service, R3's "pure contract" claim is **rejected** and B's plan shape changes: invariant 16 is wrong, or the convergence target is wrong.
  3. If shared code is needed for **even one** behaviour-load-bearing item (e.g. slug-uniqueness retry logic), the probe surfaces it and the contract names a destination (third package or duplicated implementation per repo).
- **Disposition outcomes**:
  - *accepted* — pure contract suffices; B.W1 proceeds with text-only contract.
  - *narrowed* — pure contract + one named shared-data package (word-list); B.W1 includes the data extraction.
  - *rejected* — invariant 16 falls; B's plan shape changes materially.

#### Probe P2 — "Does the migration actually preserve data?"

- **Target claim**: R5 "verified backfill, no loss" (`research/README.md:58-60`; `B.md §2 invariant 17`).
- **Probe**:
  1. Run R5's proposed migration query shapes against the current MongoDB state (read-only — `find().count()`, no writes).
  2. Count: `snapshots` (today), `gallery` (today), unioned by `snapshot_hash`. The converged `visualization` count must equal `len(gallery) + len(snapshots with no gallery row)`.
  3. Spot-check: 10 random `snapshot_hash` values; for each, verify the proposed migration produces a `visualization` doc with: (a) the snapshot's `contour_settings` and `animation_settings`, (b) the gallery's `user_slug`, `views`, `likes` (if present), (c) the new `visualization_slug` (generated), (d) `visibility` (derived from "is in gallery" → `public`, otherwise `draft`).
  4. **Adversarial case**: a snapshot with `user_slug: None` in the gallery (`api/routers/gallery.py:232`). What happens? If migration drops it, count differs and probe **rejects**. If migration assigns an owner, the assignment rule must be specified.
  5. **Adversarial case**: orphan snapshots (created, never published). Today they are un-prunable. Migration must convert them to `visibility="draft"` with **some** owner — but they have no owner today. Resolution required.
- **Disposition outcomes**:
  - *accepted* — counts match, orphan-snapshot rule is named.
  - *narrowed* — orphan handling requires manual reconciliation; named in the plan.
  - *rejected* — data loss demonstrated; B.W3 cannot proceed as planned.

#### Probe P3 — "Is the cross-repo timing real, and is the image-blob deferral honest?"

- **Target claim**: R6 "value.js-C.W1 published is the single hard cross-repo dependency" (`research/README.md:71-72`; `B.md:97`) AND R4 "image-blob redesign defers to tranche C" (`research/README.md:50`; default position).
- **Probe**:
  1. Read `~/Programming/value.js/docs/tranches/B/B.md` and `waves/B.W0..B.W5.md` (six wave specs); estimate a conservative wave-duration lower-bound. If the projected value.js-B close is *after* fourier-B's likely W3 close, **W4 will stall**, and a fallback must be in place.
  2. Verify the fallback: can fourier-B.W4 land *without* the `colors.ts` gut onto value.js? List the W4 sub-tasks that depend on the value.js library substrate (`colorScale`, `sampleToSVGPath`, `Palette` type) vs the sub-tasks that do not (storage re-pointing, slug-routed URLs, admin re-pointing).
  3. **Image-blob honesty**: today fourier stores blobs inline in MongoDB (`api/services/image_storage.py:97` `"blob": Binary(content)`). The `storage_budget_gb` band-aid (`api/services/janitor.py:84-119`) is itself a contrivance violating A.12. Probe: does deferring this to tranche C honestly close B, or does it leave A.12 in violation? If the latter, R4 must admit it to B's scope with its own sub-research.
  4. **`pinned: bool` retrofit timing**: R4 proposes inverting `$nin` to `pinned: bool`. This requires backfill (writing `pinned` onto every existing doc). Is that backfill in W3's migration scope, or a separate migration?
- **Disposition outcomes**:
  - *accepted* — fallback exists, image-blob defer is honest with named tranche-C destination, pinned-flag backfill folds into W3.
  - *narrowed* — fallback exists but requires explicit naming in B.md §7; pinned-flag backfill is W3.5 (a named sub-wave).
  - *rejected* — image-blob deferral leaves A.12 in violation; R4 must admit it to B's scope, expanding W3 or adding W3.5.

### Other Wχ probes (non-core)

- **P4** — R1's identity-scheme count: is the "five divergent identity schemes" claim exact? Re-derive from `api/routers/**` and `web/src/lib/draftStorage.ts`. *(Wχ.2 task.)*
- **P5** — R2's named gaps: does value.js really not have `colorScale` or `sampleToSVGPath`? `grep -r "colorScale\|sampleToSVGPath" ~/Programming/value.js/src/`. *(Wχ.1 task.)*
- **P6** — R6's joint-research substrate verification: are all six research deliverables citable from value.js-C without re-litigation? *(Wχ.3 task.)*

### Wχ deliverable

`audit/challenge.md` — one section per probe (P1–P6), each with disposition, evidence, plan consequence. The §3 wave table (`B.md:38-47`) is hardened; the brittleness window (`B.md §8`) is confirmed or removed; the §7 cross-repo debt list is updated with any new destinations.

---

## §7 — Summary disposition

| Concern | Verdict | Action |
|---|---|---|
| Invariants 14–17 coherent? | yes, with 3 sharpenings | bind owner-contract by invariant; add library-no-persistence gate; reconcile visibility-state enumeration |
| R1–R6 prompts hardened? | mostly yes | R3 needs a 1-row-per-target disposition table; R5 needs a migration plan stub; R6 needs fallback shapes |
| CRUD-CONTRACT.md outline? | authored above (§3) | 13 sections, §10 conformance matrix is load-bearing |
| Wave-table dependencies? | mostly correct | W2 is a tracking row, not an executable wave; W4 has the single fragile cross-repo dependency |
| Cross-repo timing? | confirmed | lineage A→B→C and ordering fourier-B-before-value.js-C is correct; value.js-B's 6-wave length is the real risk |
| Wχ probe spec? | authored above (§6) | three core probes (P1 framework-in-disguise, P2 migration safety, P3 cross-repo+image-blob honesty) |

**Highest-impact recommendation**: **R3 must produce a 1-row-per-target disposition table that becomes the literal substrate for `CRUD-CONTRACT.md`**. R3 is the architecture decision; if it ships narrative, B.W1 either re-runs the research or ratifies an implicit contract.

**Single most fragile wave dependency**: **fourier-B.W4 → value.js-C.W1 published**, gated by value.js-B's full close (six linear waves) and fourier-B.W1 ratification. Mitigation: name the fallback shape (W4 lands everything except `colors.ts` gut) in B.md §7.

**Three core Wχ probes**: **P1 contract-as-framework-in-disguise**; **P2 migration-actually-preserves-data**; **P3 cross-repo-timing-and-image-blob-honesty**. All three must dispose to accepted or narrowed for W1 to dispatch.
