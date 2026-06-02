# A2 — fourier CRUD/REMIX spec-completeness audit

**Auditor**: A2 (FOURIER CRUD/REMIX SPEC-COMPLETENESS).
**Scope**: `docs/tranches/J/design/J.W1-crud-remix.md` against the real API surface (`api/routers/visualizations.py`, `api/models/visualization.py`, `api/lib/crud/*`, `api/services/database.py`, `api/scripts/migrate_visualization.py`, `api/scripts/run_pending_migrations.py`, `.github/workflows/ci.yml`, `api/tests/conftest.py`).
**Date**: 2026-06-02.
**Verdict**: **SOUND-WITH-REFINEMENTS** — the atom-bag / set-hash / per-atom-diff core is genuinely KISS, git-like, single-parent-linear, and idiomatic to the existing `lib/crud` composition discipline. But the spec has **one P0 infrastructure contradiction** (it leans the whole remix on a Mongo *transaction* mechanism the codebase has zero precedent for and the CI/prod topology cannot run), **two P1 contract gaps** (the string-`_id` version collection breaks the existing cursor `ObjectId` cast; `palette_slug` is admitted as an atom but never FK-validated), and several P2 under-specifications. None are fatal to the design; all are bookable into W2 with named fixes.

---

## §A — Completeness checklist (the spec, gate by gate)

| # | Required by J.md §7 / the audit | Spec status | Evidence |
|---|---|---|---|
| 1 | The 5 atoms = exactly the remixable state | **MOSTLY** — set is right; `palette_slug` FK unvalidated; `n_harmonics` bound mismatch vs `AnimationSettings.n_harmonics` (`le=256`) | spec §1.1; `visualization.py:109-119`, `shared.py:60` |
| 2 | Per-atom + set-hash deterministic (canonical JSON, key order) | **MOSTLY** — sub-object `model_dump()` is NOT `sort_keys`-canonicalised in `enumerate_atoms`; only `diff_atoms`/`atom_hash` re-canonicalise | spec §1.2 line 58 vs §3 line 179 |
| 3 | AtomOp[] = complete git-like diff | **YES (coarse-by-design)** — whole-atom replace for sub-objects; acceptable at this cardinality, but sub-object diff granularity is declared nowhere | spec §2.2 `AtomOp`, §3 |
| 4 | Remix = fork + recorded diff, ONE transaction, delete-race-closed, no-op→422, owner inv-14 | **BLOCKED** — transaction mechanism has no codebase precedent and the topology is standalone Mongo; `owner_slug` sourcing under-specified for the version `author_slug` | spec §4.1; `database.py:28`, `ci.yml:41-49`, `conftest.py:29` |
| 5 | Provenance ≤50, cycle-guarded, single-parent linear | **YES** — walk fully lifted from value.js; edge record minimal + correct | spec §4.3, §2.2 |
| 6 | 5 endpoints fully specified (req/resp/status/ETag/If-Match/idempotency/problem+json/off-chain 404) | **MOSTLY** — response *bodies* under-typed (no Pydantic response models named); `/forks`/`/versions` cursor mechanics collide with string `_id` | spec §4.1-§4.6 |
| 7 | KISS guardrails §9 self-consistent, no re-admitted complexity | **YES** — declines are clean and complete; one latent re-admission risk (the `?from=&to=` arbitrary-pair diff is fine, but "diff against HEAD" + "diff arbitrary pair" should share one path) | spec §9 |
| 8 | atomdiff.py the right home; one content-addressable primitive | **REFINE** — three hash mechanisms (`content_hash`, `set_hash`, ETag) coexist; the elegant transposition is one canonical-serialization primitive, named below | spec §1.3 line 73; `etag.py:21-33` |
| 9 | Migration additive + idempotent, gated | **YES** — correctly routed through `run_pending_migrations` + `migrated_from` discipline; one omission (no `MIGRATION_VERSION`/registry entry named) | spec §7; `run_pending_migrations.py:58-62` |
| 10 | ≥2-consumer per atom/endpoint (inv-15) | **YES** — every atom + endpoint names a real reader; WebMCP booked-not-built | spec §5 |
| 11 | Shared PATTERN not package (inv-16/inv-26) | **YES** — `atomdiff.{py,ts}` authored-once-adopted-twice, no binary, no codegen | spec §0, §6 |

---

## §B — Audit-question answers (file:line evidence)

### Q1 — Are the 5 atoms exactly the remixable state?

**The set is correct and the NOT-atom rationale is sound.** Cross-checking `Visualization` (`visualization.py:102-137`): the 5 atoms (`active_bases`, `n_harmonics`, `contour_settings`, `animation_settings`, `palette_slug`) are exactly the user-tunable config that a remix would change. The excluded fields are correctly excluded:

- `image_slug`/`contour_hash` — subject, FK-validated at create (`visualizations.py:114-117`), correctly pinned through the fork (§1.1).
- `title`/`description`/`tags` — editorial, already on `VisualizationUpdate` (`visualization.py:173-176`), correctly ride the create body not the diff.
- `views`/`likes`/`pinned`/`bytes`/`owner_slug`/`visibility`/`animation_data`/`migrated_from` — counters/lifecycle/derived, correctly never atoms.

**One field the spec does not address: `animation_data`** (`visualization.py:114`). It is a *derived* precomputed-trajectory cache (`AnimationData`), not a remix lever — correctly NOT an atom — but the spec never names it in the NOT-atoms list, and a remix MUST decide what happens to it (it is stale the instant `active_bases`/`n_harmonics` change). The spec is silent: does the child inherit the parent's `animation_data` (now wrong), or `None` (recompute on demand)? This is a real gap — see F-04.

**Hashing determinism — a real bug.** The spec gives two different canonical serializations for the sub-objects:
- §1.2 line 58: `json.dumps(model_dump(), sort_keys=True, separators=(",",":"))` — canonical.
- §3 line 179 `enumerate_atoms`: `viz_or_payload.contour_settings.model_dump()` — a **plain dict, not sorted, not serialized**.

`diff_atoms` then calls `atom_hash(key, b)` on that raw dict, and `atom_hash` (§1.2 line 52) does `canonical_json(value)`. So the canonicalization happens inside `atom_hash`, which is fine for the hash — BUT the *`AtomOp.before`/`after` payloads* carry the raw un-canonicalized dict, and `set_hash` (§1.3) is computed over `atom_hash(k, v)` which re-canonicalizes. The two code paths must be reconciled: `enumerate_atoms` should return the *canonical* atom values (or `atom_hash` must own ALL canonicalization and `enumerate_atoms` must never feed un-normalized dicts into anything that compares by identity). As written, an equal-content sub-object that differs only in Python dict insertion order would still hash equal (good, because `atom_hash` sorts) but the persisted `AtomOp.before`/`after` would be non-deterministic across runs (bad for ETag immutability claims in §4.4). See F-05.

**`palette_slug` is admitted as an atom but never FK-validated** (`visualizations.py` never validates `palette_slug` — grep confirms the only reference is the passthrough at `:143`). The other subject FKs ARE validated (`:114-117`). If `palette_slug` is a real binding (the spec calls it "the palette binding; a remix re-skins"), a remix that sets a dangling `palette_slug` produces a broken child silently. The spec must either (a) FK-validate it on remix (and retroactively on create), or (b) explicitly declare it a soft/optional reference. See F-02.

**`n_harmonics` bound mismatch.** `Visualization.n_harmonics` is `ge=1, le=4096` (`visualization.py:110`) and `VisualizationCreate`/`VisualizationRemix` agree (`le=4096`). But `AnimationSettings.n_harmonics` is `ge=1, le=256` (`shared.py:60`) and `AnimationData.n_harmonics` is `le=256` (`visualization.py:60`). The spec's atom is the top-level `n_harmonics` (correct), but a reviewer will note the two `n_harmonics` fields in the same model with divergent bounds — the spec should state which is authoritative for the atom (it is the top-level one). NIT-level but worth a sentence. See F-09.

### Q2 — Is AtomOp[] a complete git-like diff? Granularity?

**Yes, and the coarseness is the right KISS call — but it is undeclared.** For fourier's *fixed* 5-atom bag, `active_bases`/`n_harmonics`/`contour_settings`/`animation_settings` always exist, so they only ever `modified`; `palette_slug` is the one nullable atom that can `added`/`removed` (§3 line 205). This is correct.

The granularity question the audit asks — for `active_bases` (array) and the sub-objects — the diff **degrades to whole-atom replace**. `AtomOp.before`/`after` carry the *entire* old/new array or sub-object, not a per-element or per-field delta. **This is the correct KISS choice** (matching §0's "per-atom set-difference, no three-way anything") and it matches value.js's per-`PaletteColor` granularity only because value.js keys colors by `position` (§6). For fourier the atom *is* the whole array/object — there is no sub-key.

**But the spec never states this explicitly**, and a diff-viewer consumer (§5 consumer 2, the CSS Custom Highlight render) will need to know it must re-diff the sub-object *client-side* to highlight which contour param changed. The "these 2 atoms changed" claim (§5 line 291) is honest at atom granularity but the highlight-ranges consumer implies field granularity. Either the spec declares atom-granularity-only (and the viewer diffs sub-objects itself), or it owes a `contour_settings.blur_sigma`-level sub-diff (which would break the flat-bag KISS line — do NOT do this). Recommend: declare atom-granularity explicitly, push sub-object field-diffing to the viewer. See F-06.

### Q3 — Remix transaction / delete-race / no-op-422 / owner inv-14 / fork_count write-back

**This is the P0.** The spec's §4.1 step 5 says "**One transaction** (Mongo session, the `forks.ts:83-126` shape)" and §0 line 18 says "written under the existing `withTransaction`-equivalent cross-collection discipline (Mongo session)." **There is no such existing discipline in the codebase.** Grep across all of `api/` for `start_session`/`with_transaction`/`start_transaction` returns **zero** matches. Every existing multi-collection mutation (create at `visualizations.py:122-163`, soft-delete cascade deliberately avoided in `softdelete.py:1-6`) is written *without* a transaction — the codebase is single-document-atomic by design.

Worse, the topology cannot support it:
- `database.py:28` connects to `settings.mongo_uri`, default `mongodb://localhost:27017/fourier` (`config.py:9`) — a **standalone** mongod.
- CI's Mongo service is `mongo:8.0` with **no `--replSet`** (`ci.yml:41-49`, `:104-109`).
- The CI header explicitly records that `@requires_mongo` tests "require replica-set topology" are an accepted *skip* residual (`ci.yml:11-12`, `:73-74`).
- `conftest.py:29,86` connects to standalone localhost.

MongoDB multi-document transactions REQUIRE a replica set (or sharded cluster). A `session.start_transaction()` against standalone mongod raises `OperationFailure: Transaction numbers are only allowed on a replica set member or mongos`. So **the spec's central remix mechanism cannot run green under inv-27** on the actual infrastructure — it would either skip (no coverage, violating the J.md §7 CORE gate "in one transaction … fourier CI green") or fail.

This is a design-level contradiction, not a typo. The fix is one of:
- **(a) idiomatic, recommended)** Make the remix **not** require a transaction. Order the writes so a crash leaves no lie: (1) insert the child `VisualizationVersion` (content-addressed `_id = set_hash` → idempotent re-insert is a no-op), (2) insert the child `Visualization` (slug-unique → idempotent via the existing `slug_with_retry`), (3) `$inc` the parent `fork_count` **last** and **conditionally** (only if the child insert succeeded; an orphaned over-count is the only failure mode and is self-healing / cosmetically bounded). The `fork_count` is already declared "a seed, never authoritative" elsewhere in the codebase (`migrate_visualization.py:222`) — an eventually-consistent counter matches the existing posture. The delete-race "re-verify source exists" becomes a `find_one` guard before step 1, accepting the small TOCTOU window (the same window the existing create accepts). This is the KISS, topology-honest, precedent-matching path.
- **(b)** Require a replica set in dev+CI+prod (change the compose, the CI service `--replSet rs0` + `rs.initiate()`, the default URI). This is a real infra change with its own wave; it contradicts "no new storage engine" only in spirit, but it is heavier and touches deploy.

The spec must pick (a) or (b) explicitly; lifting value.js's `withTransaction` *shape* without value.js's *topology* is the trap. value.js runs on a topology that supports it; fourier does not, today. See F-01 (P0).

**no-op-remix → 422**: correctly specified (§4.1 step 3, line 242) — `diff_atoms` empty → 422 problem+json. Good. The error catalog (`errors.py`) has `validation_failed` (422) at `:65` which fits, though a dedicated `urn:contract:remix-noop` would be more agent-legible (the §4 agent-legibility constraint). NIT. See F-10.

**owner inv-14**: §4.1 step 1 correctly mandates a 401 for anonymous remix (matching `visualizations.py:106-108`). But the version document's `author_slug` (`VisualizationVersion`, spec §2.2 line 110) sourcing is **unspecified** — is it the remixer (the child's `owner_slug`) or the source author? It must be the remixer (the version belongs to the child's chain). One line fixes it. See F-07.

**`fork_count` write-back**: correct in intent (§4.1 step 5 bump `source.fork_count += 1`), and the spec correctly identifies it as the missing writer for the phantom `cursors.py:21` sort. The `$inc` is the right op. See the transaction caveat above (F-01) — the bump must be the *last, conditional* write under path (a).

### Q4 — Provenance walk + edge record

**Fully specified and correct.** §4.3 lifts value.js's `getProvenance` walk verbatim: single-parent, ≤50 cap, `visited` cycle-guard. The `{parent_hash, set_hash, atom_diff}` edge (§2.2) is the right minimal provenance record — it is 1:1 with the child version (single-parent → no separate `provenance_edges` collection, correctly justified at §2.2 line 150). The walk is over `visualization_versions` `{viz_slug, depth}` (indexed at §2.3). Clean.

One under-specification: the provenance walk **crosses viz boundaries** (a remix child's chain root is its own `depth=0`, but `forked_from_hash` points at the *parent viz's* HEAD — §4.1 step 5). So `GET /:slug/provenance` returns only the child's OWN linear chain, NOT the "remixed from → … → original" cross-viz trail that §5 consumer 3 (the breadcrumb) needs. The breadcrumb wants to walk `fork_of` across visualizations; `provenance` walks `parent_hash` within one viz. These are **two different walks** and the spec conflates them at §4.3 line 259 ("remixed from → … → original" is the `fork_of` walk, not the `parent_hash` walk). See F-03 (P1) — name both walks or the breadcrumb consumer (inv-15 ≥2-consumer) has no endpoint.

### Q5 — Endpoint specification completeness

**Mostly complete; response bodies under-typed and cursor mechanics collide.**

- **`POST /remix`** — request body `VisualizationRemix` is fully typed (§4.1). The `palette_slug: str | None = _UNSET` tri-state (§4.1 line 230) is a nice touch (inherit vs clear vs set) but `_UNSET` is a sentinel that Pydantic does not natively express on a `str | None` field — the spec owes the implementation note (a `model_validator` or a separate `palette_slug_set: bool`, since Pydantic cannot distinguish "absent" from "null" on `str | None` without `model_fields_set`). This is a real impl gap. See F-08. Status 201 + Location + ETag is correct (matches `visualizations.py:154-161`). Idempotency via the existing store (§4.1 line 251) is correct but the scope string must match the existing `f"user:{owner_slug}"` literal (`visualizations.py:163`) — the spec says "scoped to the owner" which is right.
- **`GET /forks`** — cursor-paginated over `{fork_of: slug}` (§4.2). The `visualizations` collection has ObjectId `_id`, so the existing cursor `ObjectId(cursor.id)` cast (`cursors.py:69`) works. But there is **no `SortKey` for fork-children listing** — `cursors.SORT_KEYS` (`cursors.py:20-23`) has `newest/popular/most-forked/views/likes`; `/forks` presumably sorts `newest`, fine, but the spec must name it. Minor.
- **`GET /provenance`** — see Q4; the walk is correct but the cross-viz-vs-within-viz ambiguity (F-03) lands here.
- **`GET /diff?from=`** — fully specified (§4.4): on-chain validation, off-chain → 404 problem+json, default `to`=HEAD, immutable Cache-Control. Good. The `?from=&to=` arbitrary-pair form (§4.4 line 263) and the "diff parent→child persisted edge" (§3 line 207) should be ONE code path (`diff_atoms(enumerate(from), enumerate(to))`) — the spec says this (§3 line 207) but should state that the *persisted* `atom_diff` is never read by `/diff?from=` (it always recomputes), to avoid a reviewer asking "why persist the edge if you recompute". Answer: the persisted edge serves `/versions` (§4.5 line 272), not `/diff`. State it.
- **`GET /versions`** — **cursor collision (P1).** §4.5 paginates over `{viz_slug: slug}` and §2.2 sets `VisualizationVersion._id = set_hash` (a **string**). The existing cursor machinery does `ObjectId(cursor.id)` (`cursors.py:69`) and `str(doc["_id"])` (`cursors.py:79`) — `ObjectId(<64-hex-string>)` raises `bson.errors.InvalidId` for a non-24-hex-char string, and a `set_hash` is 64 hex chars. So the existing `cursors.paginate` **cannot** paginate the version collection as-is. Either the version cursor tie-breaks on `depth` (an int, sortable, no ObjectId needed) with a version-specific cursor, or the spec adds an ObjectId `_id` and demotes `set_hash` to a unique-indexed field (losing the "`_id` = set_hash" elegance from value.js precedent). The cleaner fix: `/versions` is a *bounded* list (a viz has few versions; §2.2 `version_count`), so it does NOT need cursor pagination at all — return the whole `depth`-ordered chain (capped, like `/provenance`'s ≤50). That dissolves the collision and is more KISS. See F-11 (P1).

**No endpoint names a Pydantic *response* model.** `VisualizationRemix` (request) is typed but `/diff`'s `{from, to, atom_diff}`, `/provenance`'s node list, `/versions`'s entries, and `/forks`'s page are described as shapes in prose, not as named Pydantic models. inv-26 (single-contract-source, hand-typed-canonical) *requires* these to be hand-typed twins. The spec should name `DiffResponse`, `ProvenanceNode`, `ProvenanceResponse`, etc., so the TS twin (`web/src/lib/types.ts`, J.md §5 inv-26) has a canonical source. See F-12.

### Q6 — KISS guardrails (§9)

**Sufficient, self-consistent, and complete.** The named declines — no DAG/merge/rebase/CRDT, single-parent linear, no cross-viz subject remix, no `root_hash`/`depth` on the live row, WebMCP booked-not-built — are each correct and each forecloses a real re-litigation. No place re-admits declined complexity. The `?from=&to=` arbitrary-pair diff (§4.4) is the one thing that *looks* like it might re-admit a graph query, but it does not: it is two-snapshot set-difference, not a path-find, and both snapshots are on the same linear chain (validated, §4.4 line 265). Clean.

The one latent inconsistency: §2.2 line 247 says the remix creates the child's root version with `atom_diff=[]` ("the child's OWN chain starts fresh") AND that "the cross-viz edge diff is recorded on the child row's `fork_of_hash`". But `fork_of_hash` (§2.1 line 90) is a *hash string*, not a diff — it cannot "record the diff." The cross-viz diff is *reconstructable* (§2.2 line 247 says so via `?from=`), but the sentence reads as if `fork_of_hash` stores it. Tighten the wording: the cross-viz diff is NOT persisted anywhere; it is recomputed on demand from the two HEAD snapshots. That is the correct KISS choice but the prose is self-contradictory. See F-13 (NIT).

### Q7 — Elegance / transposition: is atomdiff.py the right home? One primitive?

**`lib/crud/atomdiff.py` is the right home** (sits beside `cursors`/`etag`/`errors` as a pure per-section utility, composed explicitly by the router — matches the `lib/crud/__init__.py:9-11` "no BaseCRUDRouter" doctrine). inv-16 satisfied.

**The elegant transposition the audit asks for: there are THREE canonical-serialization-then-hash mechanisms that should be ONE primitive.**
1. `etag.compute_etag` → `_canonical_json` (`sort_keys=True, separators=(",",":")`, ISO datetimes) → sha256 over a field projection (`etag.py:21-33`).
2. `visualizations._compute_content_hash` → `json.dumps(..., sort_keys=True, separators=(",",":"))` → sha256 over the subject+config material (`visualizations.py:72-84`).
3. The spec's new `atom_hash`/`set_hash` → its own `canonical_json` rules (§1.2) → sha256.

All three are "canonicalize a dict the same way, sha256 it." They differ only in *which keys* go in. The transposition: **a single `lib/crud/content_hash.py` (or fold into `atomdiff.py`) exporting one `canonical_digest(obj) -> str`** — the existing `etag._canonical_json` already IS this function (it even handles datetimes, which the spec's `canonical_json` omits and would crash on). Then:
- ETag = `canonical_digest(mutable_projection)`,
- `content_hash` = `canonical_digest(subject_projection)`,
- `atom_hash(k,v)` = `canonical_digest({k: v})[:16]`,
- `set_hash` = `canonical_digest(sorted atom-hashes)`.

This collapses three ad-hoc serializers into one, fixes the spec's datetime gap (its `canonical_json` at §1.2 has no datetime handler — `contour_settings`/`animation_settings` contain no datetimes today so it survives, but the moment an atom gains a datetime it breaks; `etag._canonical_json` already handles it), and makes the "content-addressable" claim literally one function. The spec's §1.3 line 73 correctly keeps `content_hash` and `set_hash` as *distinct identities* (subject-bearing vs subject-free) — that distinction is right and must stay — but they should be computed by the *same primitive* over *different projections*. **Name this as the W2 transposition: one `canonical_digest`, three projections, zero re-implemented serializers.** See F-14 (the headline transposition).

---

## §C — Findings table

| ID | Sev | Title | Location |
|---|---|---|---|
| F-01 | **P0** | Remix transaction mechanism has no codebase precedent and standalone-Mongo topology cannot run it | spec §0:18, §4.1:244; `database.py:28`, `config.py:9`, `ci.yml:41-49,73`, `conftest.py:29` |
| F-02 | P1 | `palette_slug` admitted as an atom but never FK-validated (unlike image/contour) | spec §1.1, §4.1; `visualizations.py:114-117` vs `:143` |
| F-03 | P1 | `/provenance` (within-viz `parent_hash` walk) ≠ the breadcrumb consumer's cross-viz `fork_of` walk; two walks conflated, breadcrumb has no endpoint | spec §4.3:259, §5:292 |
| F-11 | P1 | `/versions` cursor pagination collides with string `set_hash` `_id` (existing cursor casts `ObjectId(cursor.id)`) | spec §4.5; `cursors.py:69,79` vs §2.2:108 |
| F-12 | P1 | No Pydantic *response* models named for `/diff`,`/provenance`,`/versions`,`/forks` — inv-26 needs hand-typed twins | spec §4.2-§4.6 |
| F-04 | P2 | Remix's effect on `animation_data` (stale derived cache) unspecified | spec §1.1; `visualization.py:114` |
| F-05 | P2 | `enumerate_atoms` returns raw un-canonicalized sub-object dicts; persisted `AtomOp.before/after` non-deterministic, undermining `/diff` ETag-immutability claim | spec §1.2:58 vs §3:179, §4.4:268 |
| F-06 | P2 | Sub-object/array diff granularity (whole-atom replace) is correct but undeclared; diff-viewer consumer implies field granularity | spec §2.2, §3, §5:291 |
| F-07 | P2 | `VisualizationVersion.author_slug` sourcing unspecified (remixer vs source author) | spec §2.2:110, §4.1 |
| F-08 | P2 | `palette_slug: str \| None = _UNSET` tri-state not expressible on a Pydantic `str \| None` field without `model_fields_set`; impl note owed | spec §4.1:230 |
| F-14 | P2 | Three canonical-serialize-then-hash mechanisms (`content_hash`, ETag, atom/set hash) should be one `canonical_digest` primitive over three projections (the elegant transposition) | spec §1.2-§1.3; `etag.py:21-33`, `visualizations.py:72-84` |
| F-09 | NIT | Two `n_harmonics` fields with divergent bounds (`le=4096` top-level vs `le=256` in settings); name the authoritative atom | `visualization.py:110,60`, `shared.py:60` |
| F-10 | NIT | no-op-remix 422 reuses generic `validation_failed`; a `urn:contract:remix-noop` is more agent-legible | spec §4.1:242; `errors.py:65` |
| F-13 | NIT | §2.2:247 prose implies `fork_of_hash` "records the diff"; it stores only a hash — cross-viz diff is recomputed, not persisted | spec §2.2:247 |
| F-15 | NIT | spec's §1.2 `canonical_json` has no datetime handler; survives today (atoms carry no datetimes) but brittle — `etag._canonical_json` already handles it (resolved by F-14) | spec §1.2:55-59; `etag.py:17-23` |
| F-16 | NIT | Migration omits the `MIGRATIONS` registry entry + `MIGRATION_VERSION` the runner requires | spec §7; `run_pending_migrations.py:58-62` |

---

## §D — Fold list (into W2)

The spec is W1 (design, DEV). All findings fold forward into **W2 (CORE implementation)** — none require a new wave. The P0 (F-01) is a design decision that must be resolved **before** W2 opens (it changes the remix algorithm shape), so it folds into a **W1 amendment** (or the W2 design-intake gate). Ordering: F-01 (W1-amend) → F-02/F-03/F-11/F-12 (W2 design-complete gate) → F-04..F-14 (W2 impl) → NITs (W2 cleanup). F-14 (the `canonical_digest` transposition) should be the *first* W2 code move because `atom_hash`/`content_hash`/ETag all depend on it.

---

## §E — Verdict

**SOUND-WITH-REFINEMENTS.** The atom-bag → set-hash → per-atom-diff core is genuinely KISS, single-parent-linear, git-like, and idiomatic to the `lib/crud` compose-don't-frame discipline. The 5 atoms are the right set; the provenance edge is minimal and correct; the declines (§9) are complete and self-consistent; the shared-PATTERN (inv-16) and no-codegen (inv-26) postures hold. The design is not over-fit — every atom and endpoint names a real consumer.

The blocker is **F-01**: the spec lifted value.js's `withTransaction` *shape* without value.js's replica-set *topology*. fourier runs standalone Mongo (dev, CI, and per the URI, prod) and has zero transaction precedent. The remix must be re-expressed as an ordered, idempotent, content-addressed write sequence (the recommended path (a)) so it runs green under inv-27 — or the infra must gain a replica set (path (b), a heavier wave). This is resolvable and does not invalidate the design; it sharpens it toward the codebase's existing single-document-atomic posture. With F-01 resolved and the P1 gaps (palette FK, the two provenance walks, the version-cursor collision, the response-model twins) closed, the spec is ready for W2 IMPL.
