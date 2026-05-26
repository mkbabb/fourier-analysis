# R3 — fourier-B refinement assay

**Authored**: 2026-05-26.
**Mode**: read-only refinement. Emit binding decisions and disposition;
do not edit the artefacts themselves.
**Scope**: fourier-B's contract corpus after the U1–U6 round
(`CRUD-CONTRACT.md`, `SCHEMA.md`, `CONFORMANCE-MATRIX.md`,
`CRUD-LIB-{PY,TS}.md`, `SLUG-WORDS.md`, `CRUD-CONSTELLATION.md`,
`R-{identity,auth,lifecycle}-spec.md`, `waves/W{1,3,4}.md`,
`PROGRESS.md`). Cross-repo spot-check: value.js's current `api/src/`
layout (now a structured tree under `routes/palettes/{crud,flags,
forks,index,versions,votes}.ts` + `middleware/*.ts` + `repositories/`,
not the monolithic `palettes.ts` the contract cites).

---

## 1 — CRUD-CONTRACT internal-consistency findings

### 1.1 Three different ETag shapes ratified across four documents (**load-bearing**)

The strongest contradiction in the corpus. The contract names the
strong validator; the schema and Python lib agree on one shape; the TS
lib and the contract itself name a different shape.

| Document | ETag shape | Strong/weak | Body |
|---|---|---|---|
| `CRUD-CONTRACT.md:115` | `W/"<content_hash>-<version_count>"` | mixed (`W/` is weak; "strong validator" claim in same paragraph) | full content_hash + version |
| `SCHEMA.md:50` | `ETag: "<hex>"` (lowercase sha256 hex of canonical doc) | strong | sha256(canonical_doc), no version |
| `CRUD-LIB-PY.md:344-354` | `"<lowercase-hex>"` (no `W/`); SHA256 over mutable fields | strong | sha256(canonical mutable subset) |
| `CRUD-LIB-TS.md:268,278,303` | `W/"<content_hash[:16]>-<versionCount>"` (16-hex truncate) | weak | truncated content_hash + versionCount |
| `CONFORMANCE-MATRIX.md:197` (CS2.1) | `ETag: "<sha256-hex>"` (full hex) | strong | sha256(doc) |
| `CONFORMANCE-MATRIX.md:304` (U-etag-3) | `^"[0-9a-f]{64}"$` (full sha256, quoted) | strong | full sha256 |

The TS side reads `currentHash`/`versionCount` off the doc and bolts
them together; the Python side hashes a canonical projection over
mutable fields. Both will return *different* ETag values for the
*same* logical document — so `If-Match` from a fourier client will not
match an ETag emitted by a value.js server (or vice versa) the moment
either crosses a `currentHash`/`content_hash` field-name boundary.
This is not a portability concern (clients never cross repos), but
it is a **conformance** concern: `U-etag-3` and CS2.1 would fail on
the TS side as written (the U-etag-3 regex is full 64-hex; the TS
lib truncates to 16).

**Binding disposition**: standardise on the strong validator form
`ETag: "<sha256-hex>"` with the **full** 64-char lowercase hex
digest of canonical-JSON over the mutable-field projection
(CRUD-LIB-PY's form; matches SCHEMA §1, CS2.1, U-etag-3). Edit:

- `CRUD-CONTRACT.md:115` — drop `W/` and `version_count`. Replace
  `W/"<content_hash>-<version_count>"` with `"<sha256-hex>"`.
- `CRUD-LIB-TS.md:268,278,303` — drop the truncate and the `W/`
  weak prefix; align signature to full sha256.
- Drop `version_count`/`versionCount` from `ETagDoc` (CRUD-LIB-TS:262);
  keep `content_hash` only.
- `CRUD-LIB-PY.md` already correct; `CONFORMANCE-MATRIX` rows already
  correct.

W3 / value.js-C.W2 cannot land until one ETag shape is binding.

### 1.2 value.js utility module path: `api/src/crud/` vs `api/src/lib/crud/` (resolved one way; cite trails the other)

The post-U1 corpus pins the value.js utility path twice, inconsistently:

- Primary form (`api/src/crud/`): `B.md:33,71`,
  `CRUD-CONTRACT.md:748,762,786,789,791,792`, `CRUD-LIB-TS.md:5,14`,
  `~/Programming/value.js/docs/tranches/C/C.md:53,62,90,92`,
  `~/Programming/value.js/docs/tranches/C/waves/W2.md:1,4,5,28,46-50`.
- Stray form (`api/src/lib/crud/`): `CRUD-CONTRACT.md:818` (inside
  the §10 close-rule §U-inclusion note), `CONFORMANCE-MATRIX.md:251,
  270,348,349`.

Five `api/src/lib/crud/` sites; ~12 `api/src/crud/` sites. The
canonical form per the U4 spec (`CRUD-LIB-TS.md §0`) is
`api/src/crud/`. **Binding disposition**: replace every
`api/src/lib/crud/` with `api/src/crud/` in `CRUD-CONTRACT.md:818`
and in `CONFORMANCE-MATRIX.md` §U.1 / §U.8 (4 rows). The Python
form stays `api/lib/crud/` (matches U3 spec, W3.md).

### 1.3 §9 row "Slug uniqueness retry loop" cites `slug.py` / `slug.ts` (singular); spec is `slugs.py` / `slugs.ts` (plural)

`CRUD-CONTRACT.md:762` says the retry loop is "Realised in
`api/lib/crud/slug.py` and `api/src/crud/slug.ts`". Every other
reference uses plural — `CRUD-LIB-PY.md:30,43,120,701,746`,
`CRUD-LIB-TS.md:15,52,538`. Bind the plural form; correct the §9 row.

### 1.4 W3/W2 cite `hard_delete_past_grace` / `hardDeletePastGrace`; neither U3 nor U4 spec exports it

`waves/W3.md:5,20` requires `visualizations.py` to USE
`softdelete.soft_delete/restore/hard_delete_past_grace`;
`~/Programming/value.js/docs/tranches/C/waves/W2.md:28` mirrors with
`softdelete.softDelete, restore, hardDeletePastGrace`. The published
specs only enumerate two helpers:

- `CRUD-LIB-PY.md:511-547` exports `soft_delete`, `restore`,
  `not_deleted_filter`, `with_not_deleted`. No `hard_delete_past_grace`.
- `CRUD-LIB-TS.md:387-410` exports `softDelete`, `restore`,
  `notDeletedFilter`. No `hardDeletePastGrace`.

The hard-delete-past-grace work is actually done by
`pinned_cron.cron_prune` / `pinnedCron.cronPrune` (replacing the
`$nin` pattern). Two options, pick one:

**Option A (binding)**: drop `hard_delete_past_grace` from the W3
hard-gate and from `W3.md:20` / value.js `W2.md:28`. The cron
prune helper already covers it; the W3 router does not need to call a
softdelete helper that doesn't exist. The grep proof at W3 close
becomes `from api.lib.crud` returns ≥ 6 (not ≥ 7) imports.

**Option B**: add `hard_delete_past_grace` to U3/U4 specs as a thin
wrapper around `pinned_cron.cron_prune` filtered to soft-deleted-past-grace;
~6 LOC; bumps the LOC budget by ~12 each side.

Recommend **A** (the softdelete sub-module's job is the *grace
window state machine*; the cron's job is the bounded delete; the
seam belongs to cron-prune already).

### 1.5 §10 close-rule names §S* but `CRUD-CONTRACT.md` defines no §S

`CRUD-CONTRACT.md:822` reads: "§U is **not** a separate gate: it is
folded into the same B.W3 / value.js-C.W2 close gate as §1–§9 and §S\*."
§S exists only in `CONFORMANCE-MATRIX.md:178` ("SCHEMA-derived rows
(SOTA conventions in SCHEMA.md §1)") as §S1–§S7. The contract never
introduces §S; the close-rule references rows that have no
contract-section index back-reference. (CONFORMANCE-MATRIX §S rows
do back-reference SCHEMA §1, but the contract-level close-rule
treats §S as if it were a contract §; it is not.)

**Binding disposition**: add a one-paragraph §S preamble to
`CRUD-CONTRACT.md` just before §10 (or as a §10 sub-section) that
ratifies the SCHEMA-derived assertions as in-scope for the close-rule:
"Conformance rows derived from SCHEMA.md §1 SOTA conventions
(cursor pagination, ETag, Idempotency-Key, rate-limit headers,
problem+json envelope, URL shape, CRUD identity-stability) live as
§S1–§S7 in CONFORMANCE-MATRIX.md and are folded into the close-rule
on the same footing as §1–§9 and §U."

---

## 2 — CONFORMANCE-MATRIX gap audit

### 2.1 Row counts reconcile

`CONFORMANCE-MATRIX.md:353-389` reports: 44 contract assertions × 2
(=88) + 15 schema-derived × 2 (=30) + 29 utility-module × 2 (=58) =
**88 assertions × 2 repos = 176 rows**. Math checks; subtotal rows
sum cleanly. The brief's "88 assertions × 2 = 176 rows" matches.

Note: `PROGRESS.md:88` records the obsolete 2026-05-19 mid-flight
count "**118 rows / 59 unique assertions**" from the CRUD-deepen
round; the matrix has since grown to 176/88 in the utility-extraction
round. Recommend updating `PROGRESS.md` row 2026-05-19 CRUD-deepen
entry's parenthetical to "176 rows / 88 assertions (final after U6
extension)" for honesty.

### 2.2 Sections without §10 representation

Every CRUD-CONTRACT § with conformance assertions C\*.\* is
represented; §0 (Status), §9 (Shared data vs code — *partially*
represented; only C9.1/C9.2/C9.3 are in the matrix, not C9.4 — see
below), §12 (Open items) carry no conformance rows by design.

### 2.3 The C9.4 orphan

`CRUD-CONTRACT.md:788-795` defines C9.4 (the utility-module
admit-criteria assertion: LOC ≤ 500, no `class .*Router`, etc.).
**Search `CONFORMANCE-MATRIX.md` for `C9.4` returns zero** — the
matrix never carries a C9.4 row. The U-meta-1 row (§U.8) covers the
"exported surface matches spec" assertion but does not cover the
three admit-criteria (a) total LOC ≤ 500 per repo; (b) no control
inversion (`grep class .*Router|Mixin|register_entity|@register`
returns zero); (c) each utility is imported by routers, not the
inverse.

**Binding addition** (small, lands at the CONFORMANCE-MATRIX
amendment): add a `§U.9 — C9.4 admit-criteria` row group with three
assertions × 2 repos = 6 rows:

- `C9.4.a` LOC bound: `wc -l api/lib/crud/*.py` / `wc -l api/src/crud/*.ts`
  ≤ 500. Test name `test_utility_module_loc_bound` (both repos).
- `C9.4.b` no control inversion: source-grep returns zero.
  `scripts/conformance/grep-no-control-inversion.sh` per repo.
- `C9.4.c` import direction: `grep -E "from .*lib/crud|from .*src/crud" api/routers/|api/src/routes/` ≥ 1; reverse direction returns zero.

Aggregate updates from 88 → 91 unique assertions, 176 → 182 rows.

### 2.4 Sections re-counted

§9 has rows for C9.1/C9.2/C9.3 but the C9.3 row's `scripts/grep-no-shared-framework.sh`
no longer admits `api/lib/crud/` / `api/src/crud/` — per the
CRUD-CONTRACT.md:785-787 amendment, the grep **explicitly permits**
those paths. **Binding edit to the grep**: `grep-no-shared-framework.sh`
must whitelist `api/lib/crud/` (fourier) and `api/src/crud/` (value.js)
in the source/import allowlist; without the whitelist, C9.3 false-fails
the moment the utility module lands.

### 2.5 SCHEMA shared-type orphans

SCHEMA §2 names 6 shared types (`Slug`, `OwnerSlug`, `Timestamp`,
`ContentHash`, `Cursor`, `Problem`). The matrix covers `Slug` (C2.1,
CS2 via `validate_slug`), `Cursor` (CS1, §U.2), `Problem` (CS5,
§U.3). `OwnerSlug` (string-shape inheritance from Slug), `Timestamp`
(format-only), `ContentHash` (sha256 hex) carry no dedicated rows —
they are validated transitively by entity-level assertions. Not a
gap (over-test would be ceremony) but should be noted in §10 prose:
"shared types with no dedicated row are validated transitively
through the entity-level assertion that consumes them."

---

## 3 — LOC overshoot decisions (BINDING)

### 3.1 CRUD-LIB-PY (~535 LOC against 500 ceiling): **compress, do not raise**

Per `CRUD-LIB-PY.md §11`, the overage is +35 LOC (7%). Two named
compressions:

(a) `errors.py` partial-eta one-liner generation:
`partial(problem, type_=..., status=...)` cuts ~20 LOC.

(b) `idempotency.py` defer response-headers preservation: cuts
~15 LOC.

**Binding decision**: apply **(a)** — `functools.partial` over the
20 helpers. (a) is mechanical, low-risk, no behaviour change.
(b) loses behaviour (response-header preservation matters for
`RateLimit-*` echo through replay); defer (b).

Outcome: budget rolls to ~515 LOC; **raise the ceiling from 500 to
525** with explicit rationale in §11 of CRUD-LIB-PY. 525 sits
inside the U1 "≤ 500 LOC / repo" intent because the +25 is
documented one-time slack absorbed by the `_canonical_json` shared
helper (counted once but used twice). The C9.4 test must change to
`<= 525` (or, cleaner, `<= 500 + 25 documented exception`).

Reasoning for not raising to 600: U1 set 500 as the
framework-in-disguise guard. The narrative justification for 600
would be "we needed more space for the framework"; that is
precisely the failure mode. Keep the ceiling at 525 with the
explicit one-line exception, not 600 without one.

### 3.2 CRUD-LIB-TS (~670 LOC against 750 ceiling, ~500 target): **compress to ~600 by sub-module**

`CRUD-LIB-TS.md §12` reports ~670 LOC target ~500, ceiling 750. The
spec's per-module budgets are softer than the Python side
(`errors.ts` at 140, `idempotency.ts` at 110, `slugs.ts` at 120 —
all wider than the Python equivalents). The TS overshoot is
real: ~170 LOC over target.

**Binding compressions, by sub-module**:

- `slugs.ts`: 120 → 90. Drop the redundant
  `validateSlug` accepts-input section; the regex pattern is one
  line. ~30 LOC.
- `errors.ts`: 140 → 110. Per-helper one-liners as
  `const sessionRequired = (c) => problem(c, CATALOG.sessionRequired);`
  pattern (table-driven over the catalog). The 20 helpers collapse
  to ~25 LOC of catalog table + 5 LOC of one-liner generator. ~30 LOC.
- `idempotency.ts`: 110 → 90. The `IdempotencyStore` interface +
  static factory + `idempotent` middleware can collapse the
  factory's index-creation idempotency into `db.ts` init code;
  cuts ~20 LOC.

Outcome: ~590 LOC (670 − 30 − 30 − 20). **Set ceiling at 600**;
raise from 500 (target) with named rationale: "TS strictness
(`strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes`)
costs roughly 20% more LOC than the Python equivalent for the same
public surface; the ~600 ceiling reflects per-language overhead
rather than over-engineering."

The 750 "ceiling" in §12 was a placeholder; **delete the 750 line**
and pin 600. C9.4 LOC test for value.js becomes `wc -l api/src/crud/*.ts`
≤ 600.

### 3.3 Asymmetry rationale (binding for both)

Python ceiling 525; TS ceiling 600. The asymmetry is *documented*
(TS type-strictness overhead), not arbitrary. Both ceilings are <
the U1 framework-in-disguise predicate's spirit (≤ 500 LOC) by
< 20%; the rationale is explicit in the contract and replicable.

---

## 4 — Wave spec hardening additions

### 4.1 W1.md does not cite CONFORMANCE-MATRIX rows in its hard gate

`waves/W1.md` hard gate sub-bullets check shape ("13 sections present",
"every §10 row has a non-empty cell in both columns") but do not
require that **the §U or §S\* sub-sections are present in
CONFORMANCE-MATRIX.md before W1 close**. Today, the matrix file
already carries §U and §S\* rows, but a future amendment that
drops them would not trip W1's gate.

**Binding addition** to W1.md Hard Gate (new item 9):
`grep -c "^## §U\." coordination/CONFORMANCE-MATRIX.md` returns ≥ 8
(for §U.1 … §U.8); `grep -c "^### §S" coordination/CONFORMANCE-MATRIX.md`
returns ≥ 7.

### 4.2 W3.md utility-module file bounds list omits `slug_words.py`

`waves/W3.md:45-52` lists 8 utility module files (`__init__`, `slugs`,
`cursors`, `errors`, `etag`, `idempotency`, `softdelete`, `pinned_cron`).
But CONFORMANCE-MATRIX §U.1 includes 4 rows (`U-slugs-4`, `-5`, `-6`)
that target a `slug_words.py` module distinct from `slugs.py`
(`api/tests/lib/crud/test_slug_words.py` is the named test file at
line 263-268). The W3 file bounds do not enumerate `slug_words.py`,
and the U3 spec at `CRUD-LIB-PY.md §1` rolls slug-words loading into
`slugs.py` module-init. **Two ways to resolve**:

- **Path A (recommended, binding)**: keep slug-word loading inside
  `slugs.py` module-init per the U3 spec; rewrite CONFORMANCE-MATRIX
  §U.1 to point at `test_slugs.py` (not `test_slug_words.py`).
  Rows U-slugs-4/-5/-6 retest the loader behaviour against
  `api.lib.crud.slugs` module symbols.

- Path B: split slug-words loading into its own
  `api/lib/crud/slug_words.py` (~30 LOC) sub-module; bumps W3 file
  bounds to 9 files; bumps LOC budget by ~25.

Path A retires the contradiction at no LOC cost.

### 4.3 W3 hard gate 10 LOC bound: `≤ 500` ⇒ change to `≤ 525` per §3.1

Per §3.1 above, the bound moves to 525; W3.md:95 must update.

### 4.4 W3 hard gate 11 "helper consumption proof" misses two utilities

`W3.md:96` requires ≥ 6 imports of `api.lib.crud` from
`visualizations.py`, plus `cron_prune` in `janitor.py` and
`slug_with_retry` in `slugs.py`. **Missing checks**: `errors.problem`
must reach **every** non-2xx router site (the migrated
`/visualizations` endpoints); `etag.require_if_match` must reach
PATCH and DELETE both. Add to gate:
`grep -cE "errors\.(problem|.*)" api/routers/visualizations.py` ≥ 5;
`grep -cE "etag\.require_if_match" api/routers/visualizations.py` ≥ 2.

### 4.5 W4 hard gate omits the §S* and §U conformance round on the migrated callers

`waves/W4.md` requires `colors.ts` gut + Playwright. Does not
require that the migrated callers (admin router; gallery store-backed
endpoints; draftStorage backend endpoints) have their §S* and §U
matrix rows promoted from `WIP` to `PASS`. Implicitly, this is
B.W3's job (the entity tests close those rows). But W4 *adds*
helper consumption sites; the matrix rows that test against the
admin / draft-storage routes only acquire `PASS` once W4 lands.

**Binding addition** to W4 Hard Gate (new item 10): all
CONFORMANCE-MATRIX rows whose `Run command` targets a router file
touched in W4 read `PASS`. Recommend a small `scripts/check-w4-matrix-rows.sh`
that queries `CONFORMANCE-MATRIX.md` for rows whose test path
intersects W4's file-bounds list and asserts status=PASS in both
columns.

---

## 5 — Migration plan instantiation

### 5.1 R-lifecycle-spec §5.3 concretely instantiates the script

The 142-line Python migration script template at
`R-lifecycle-spec.md:288-432` is the most concrete artefact in the
corpus. It names:

- exact `Report` dataclass (snapshots_seen, gallery_seen,
  visualizations_written, per_field_backfilled, spot_check[10],
  skipped_already_migrated);
- idempotency by `db.visualizations.find_one({source_snapshot_hash: ...})`
  pre-check;
- orphan-owner resolution: `gallery.user_slug is None` → assign
  `"orphan-archive"` synthetic owner (with TODO admin-managed
  assignment);
- post-condition assertions raising RuntimeError on:
  null `owner_slug` count > 0, invalid `visibility` count > 0,
  count parity `pre_snapshots != written + skipped`.

**Gap 1**: the script template uses `db.visualizations.find_one({slug})`
in a while loop to retry on collision (`R-lifecycle-spec.md:355-356`).
This is the TOCTOU pre-check the contract retires. Bind:
**rewrite the script's slug-retry segment to use
`api.lib.crud.slugs.slug_with_retry`** (the W3-landed utility).
The script is a W3 deliverable; it lands *after* the utility module;
it must consume the utility.

**Gap 2**: the script never names a `--dry-run` flag. The contract
§11.2 (`R-lifecycle-spec.md §5.1`) requires "Dry-run flag
(`--dry-run` / `DRY_RUN=1`)". Add to template signature and `main()`.

**Gap 3**: the script never names the rollback substrate. R-lifecycle
§5.5 says "Reversible via the source collections (snapshots + gallery
are kept during the brittleness window)". The script's `main()` does
not document the source-collection retention; a future operator
running the migration without reading R-lifecycle-spec would not
know the rollback affordance exists. Bind: add a top-of-file
docstring block citing "Rollback: source collections (`snapshots`,
`gallery`) are retained until B.W5 close; revert to old reads by
restoring the W3-pre commit and the `snapshots_collection`/`gallery_collection`
constants. After W5, the migration is one-way and the completeness
proof in `docs/tranches/B/audit/migration-counts.md` is the
discharge of invariant 17."

### 5.2 Verification queries — concretely named

The migration spec names three count-based verification queries:

```python
db.visualizations.count_documents({"owner_slug": None})           # → 0
db.visualizations.count_documents({"visibility": {"$nin": [...]}}) # → 0
# count parity:
report.visualizations_written + report.skipped_already_migrated == pre_snapshots
```

These are the only post-condition queries. **Missing**:

- `db.visualizations.count_documents({"slug": None})` (per
  `CRUD-CONTRACT.md:936`'s "After migration" block which expects
  `count == 0`). Bind: add.
- `db.visualizations.count_documents({"slug": {"$regex": "^[a-z]+(-[a-z]+){3}$"}, "$not": ...})`
  — i.e., every slug matches the tightened pattern. Bind: add.
- `db.visualizations.aggregate([{"$group": {"_id": "$slug", "n": {"$sum": 1}}}, {"$match": {"n": {"$gt": 1}}}])`
  — slug uniqueness post-migration. Bind: add (or rely on the unique
  index throwing during the insert loop; document which).

### 5.3 Spot-check seed is named but seed value is hard-coded inconsistently

`CONFORMANCE-MATRIX.md:173` (C11.3) names "10 random `snapshot_hash`
values (sampled with seed=42 pre-migration)". The migration script
template at `R-lifecycle-spec.md:384-390` populates `report.spot_check`
deterministically from the first 10 rows encountered (not
seed-random). **Bind**: rewrite the script's spot_check sampling to
use `random.seed(42); random.sample(all_snapshot_hashes, 10)`
matching the conformance assertion. Otherwise C11.3 fails as written.

### 5.4 The migration's brittleness window is named but its restoration gate is implicit

`R-lifecycle-spec.md §5.5` and `B.md:107-119` agree the brittleness
window is "within W3 — the migration completes within it". W3 hard
gate item 9 cites the migration commit; item 4 cites
`audit/migration-counts.md`. **Missing**: a hard gate that asserts
the old `snapshots`/`gallery` collections still exist
post-migration (since rollback depends on them). Add to W3 hard gate
item 13: `mongosh --eval "db.getCollectionNames()"` returns
`snapshots` AND `gallery` AND `visualizations` (all three present).
At B.W5 close, the gate inverts: the legacy two are renamed to
`_snapshots_legacy` / `_gallery_legacy` per CRUD-CONTRACT §11
(`CRUD-CONTRACT.md:937-939`), and B.W5 gate asserts the renamed
form.

---

## 6 — §12 open-items disposition

CRUD-CONTRACT §12 (`:976-986`) lists 8 open items, each with a
named destination. Per-item audit:

| Item | Destination | Honest? | Refinement |
|---|---|---|---|
| Word-list disposition (data vs contract) | §9 row + §2 word-list block, finalised at Wχ close | **No** — Wχ never ran; SLUG-WORDS.md and R-identity-spec §5 have already finalised the disposition (data; precepts submodule; verbatim from value.js). | Update §12: "Resolved by `SLUG-WORDS.md` (precepts submodule) + `R-identity-spec.md §5f`; superseded post-U1 round." |
| Orphan-snapshot resolution | §11 fourier table, finalised at Wχ close | **No** — same; R-lifecycle-spec §5.3 binds `orphan-archive` synthetic owner. | Update §12: "Resolved by `R-lifecycle-spec.md §5.3` (synthetic `orphan-archive` owner). Wχ disposition unblocked." |
| value.js session TTL (7d → 30d) | value.js-C.W2 | **Yes** (named, cross-repo) | keep |
| `colorScale`, `sampleToSVGPath`, `Palette` library shape | value.js-C.W1 | **Yes** (named) | keep |
| Image-blob inline storage | fourier tranche C (named) | **Yes** (R-lifecycle §6 explicitly defers with rationale) | keep |
| Rate-limiter single-replica documentation | per-repo README/ARCHITECTURE.md; landed at W3 | **Yes** (named, but W3.md does not include a sub-task to add the README block). | **Bind**: add W3 scope item 13 — "Append `## Single-replica constraint` block to `api/README.md` per `R-auth-spec.md §6`." |
| `Idempotency-Key` server replay storage | per-repo decision: in-memory 24h vs Mongo TTL collection. Decide at W3 | **Resolved** — `CRUD-LIB-PY.md §5` (line 411-413) and `CRUD-LIB-TS.md §5` (line 317) both bind **Mongo TTL collection**. | Update §12: "Resolved at U3/U4: Mongo TTL collection (single-replica friendly; survives restart; no in-process memory growth)." |
| problem+json migration of existing error shapes | W3/W4 in fourier; value.js-C.W2 | **Yes** (named per wave) | keep |

**Silent deferrals found**: none. Every §12 item has a named
destination. However, two items (word-list disposition,
orphan-snapshot resolution, `Idempotency-Key` storage) are listed
as "open" when they are in fact closed by the U-round artefacts.
**Bind**: rewrite §12 to move these to a "Resolved in U-round" sub-list
referencing the binding documents. Otherwise a future reader of the
contract will think they are still open and need Wχ to resolve.

---

## 7 — Image-blob deferral honesty (§11 reference)

`CRUD-CONTRACT.md:70-71` (Scope) lists "Image blob storage redesign
(deferred to fourier tranche C per `B.md §7`; orthogonal to
identity convergence)" — clear, scoped, named destination. `B.md:104`
agrees. `R-lifecycle-spec.md §6` provides the full deferral
rationale (high-weight argument: B's thesis is identity convergence;
value.js has no peer side; the band-aid is still operational; tranche
A research already named the candidate set).

**Scope-boundary**:
`R-lifecycle-spec.md §6.4` is the honest sentence — "The image-blob
redesign deferral does **not** mean images are untouched in B:
B.W3 migration script touches `images` to add the `pinned` flag;
B.W3 carve converges `images` ownership onto the `visualization.image_slug`
reference; images themselves remain owner-less but their *referencing*
visualization carries the owner. B.W4 wires the frontend to the
converged `visualization` endpoint; image upload / fetch endpoints
are untouched. The deferral is precisely scoped: **storage location**,
not **storage identity** or **storage referencing**."

This is the cleanest deferral in the corpus. No refinement.

**One small honesty patch**: `CRUD-CONTRACT.md §8 (cron) line 713`
says the storage-budget eviction "may remain operationally but is
documented as a known violation in §12, not as contract-binding
behaviour." §12 carries the row but the row reads "Image-blob inline
storage (band-aid `storage_budget_gb`) → fourier tranche C". The §8
forward-reference should be made explicit: "see §12 row 'Image-blob
inline storage'" (currently the §12 row name does not appear in §8).

---

## 8 — R3 disposition table — where does it live?

The brief asks: "Is the table actually emitted in
R-identity-spec / R-auth-spec / R-lifecycle-spec, or only described?"

**Finding**: the README at `research/README.md:43-48` mandates a
"1-row-per-target disposition table" with **11 rows** (slug algorithm,
slug word-list, identity, ownership, visibility, soft-delete, session,
admin, cron, hash, migration). The originally-named lane is
`research/R3-shared-optimum.md`. **That file does not exist.**

Where the table-fragments live:

- `R-identity-spec.md:410-417` carries a 4-row table covering only:
  slug word-list, slug algorithm logic, hash algorithm, canonicalisation.
  (One of the 11 rows the README mandated.)
- `R-auth-spec.md` carries no disposition table (covers session,
  ownership, admin actions, rate-limit; their disposition is "shared
  spec" by silent default).
- `R-lifecycle-spec.md` carries no disposition table (covers
  visibility, soft-delete, cron, migration; same silent default).
- `CRUD-CONTRACT.md §9 (:744-762)` carries the full **14-row**
  disposition table — but as the *contract* not as research. The
  contract synthesized what R3 was supposed to ship.

**Disposition**:

- Either **(A)** retire `research/R3-shared-optimum.md` as a missing
  artefact (mark in `research/README.md`: "The R3 disposition table
  is consolidated into `coordination/CRUD-CONTRACT.md §9`; no
  separate `R3-shared-optimum.md` ships.")
- Or **(B)** author `research/R3-shared-optimum.md` as a thin
  extraction of `CRUD-CONTRACT.md §9` + cross-references to the
  sister specs' rationales — make the table's *origin* visible
  separate from its *ratification*.

Recommend **(A)** — the table is in the contract; surfacing it
elsewhere is ceremony. Update `research/README.md` to acknowledge
the consolidation. (Otherwise a future audit re-asks this exact
question.)

---

## 9 — Cohort-orphan contingency (if value.js shelved the cohort)

R1's cross-repo assay (`r1-assay.md`) confirmed value.js has moved
on through D/E/F/G/H tranches. Spot-check verifies:

- `~/Programming/value.js/api/src/` has been restructured:
  `routes/palettes.ts` → `routes/palettes/{crud,flags,forks,index,
  versions,votes}.ts`; `middleware.ts` → `middleware/{admin-auth,
  cors,inject-services,ip,rate-limit,require-ownership,resolve-session,
  sanitize-body}.ts`; `db.ts` co-exists with a `db/` directory;
  `repositories/` is a new layer.
- Critical contract citations are **stale**: `CRUD-CONTRACT.md`
  references `~/Programming/value.js/api/src/routes/palettes.ts:362,
  411,485-489,491,492-493,697` and `~/Programming/value.js/api/src/middleware.ts:137-178,235-254`.
  The files at those paths **do not exist** any more.
- value.js has **not** added soft-delete (`deleted_at` field) yet —
  `grep -rn "deleted_at\|deletedAt\|softDelete" ~/Programming/value.js/api/src/`
  returns zero matches.
- value.js's `docs/tranches/C/` still exists and still cites the
  fourier-B coordination docs. C has not closed.

**Contingency** (one sentence per the brief): If value.js's tranche
C is effectively shelved as the repo races forward on its own
D/E/F/G/H sequence, **fourier-B.W2 (the cross-repo tracking row)
ceases to be load-bearing and B.W4's primary path collapses to its
fallback: land everything except the `colors.ts` gut, record the
gut as a B-residual with destination `fourier-tranche-C-or-successor`,
and re-author every `value.js/api/src/...` file:line citation in
`CRUD-CONTRACT.md` against the post-refactor paths
(`routes/palettes/crud.ts`, `middleware/*.ts`) before B.W3 dispatches
so contract grep-gates do not false-pass on phantom lines**.

In tandem: the cohort-level CRUD-CONTRACT.md ratification gate
(176 rows = 88 fourier + 88 value.js all PASS) can no longer reach
PASS via value.js-C.W2; the cohort ratifies only on the fourier-side
88 rows, with the 88 value.js-side rows held `DEFERRED` (a fifth
status alongside TBD/WIP/PASS/WAIVED) pending value.js's own
re-engagement. The contract itself remains binding *for fourier*;
the *cross-repo* convergence proof is downgraded from a wave-close
gate to a tranche-debt entry.

---

## Summary of binding refinements (action list)

1. ETag shape: pin strong `"<sha256-hex>"` (full 64-char) across all
   four documents; drop `W/` and `version_count`. (§1.1)
2. value.js utility path: `api/src/crud/` (not `api/src/lib/crud/`)
   in `CRUD-CONTRACT.md:818` and `CONFORMANCE-MATRIX.md` §U rows. (§1.2)
3. CRUD-CONTRACT §9 `slug.py`/`slug.ts` → `slugs.py`/`slugs.ts`. (§1.3)
4. Drop `hard_delete_past_grace` / `hardDeletePastGrace` from
   wave gates; cron_prune already covers it. (§1.4)
5. Add §S preamble to CRUD-CONTRACT before §10. (§1.5)
6. Add `§U.9 — C9.4 admit-criteria` (6 rows) to CONFORMANCE-MATRIX. (§2.3)
7. `grep-no-shared-framework.sh` whitelists `api/lib/crud/` and
   `api/src/crud/`. (§2.4)
8. **LOC ceilings (binding)**: Python 525 (compress errors.py via
   `functools.partial`); TS 600 (table-driven errors.ts +
   trim slugs.ts/idempotency.ts; remove the 750 placeholder). (§3)
9. W1 hard gate: §U / §S\* sections present in matrix. (§4.1)
10. W3: roll slug-words into `slugs.py` (not a separate module);
    update U-slugs-4/-5/-6 to target `test_slugs.py`. (§4.2)
11. W3 hard gate 10: `≤ 525` (Python ceiling). (§4.3)
12. W3 hard gate: errors.problem ≥ 5 sites, etag.require_if_match ≥ 2. (§4.4)
13. W4 hard gate: matrix rows touching W4-files must be PASS. (§4.5)
14. Migration script: consume `slug_with_retry`; add `--dry-run`;
    document rollback; sample with seed=42 to match C11.3. (§5)
15. W3 hard gate: assert legacy collections survive migration
    (rollback substrate). (§5.4)
16. CRUD-CONTRACT §12: move resolved items into "Resolved in
    U-round" sub-list (word-list, orphan-snapshot,
    Idempotency-Key storage). (§6)
17. W3 scope: add single-replica README block per §12 open item. (§6)
18. §8 cron forward-reference: name "see §12 row 'Image-blob inline
    storage'". (§7)
19. Update `research/README.md`: R3 table consolidated into
    `CRUD-CONTRACT.md §9`; no separate `R3-shared-optimum.md`. (§8)
20. Cohort-orphan contingency: re-audit every `~/Programming/value.js/api/src/`
    citation in CRUD-CONTRACT before B.W3; build the
    `DEFERRED` status into CONFORMANCE-MATRIX; declare value.js-C.W2
    rows DEFERRED if value.js has not re-engaged by W3 dispatch. (§9)

---

## ≤450-word summary

**Top 5 internal-consistency findings.**

1. **Three different ETag shapes ratified across four documents.**
   CRUD-CONTRACT.md:115 names `W/"<content_hash>-<version_count>"`
   (weak prefix yet "strong validator" claim in same paragraph);
   SCHEMA.md:50 + CRUD-LIB-PY:344 + CONFORMANCE-MATRIX CS2.1 +
   U-etag-3 all pin strong `"<sha256-hex>"` (full 64-char); CRUD-LIB-TS.md:268
   pins weak truncated `W/"<hash[:16]>-<versionCount>"`. U-etag-3
   regex would false-fail on the TS implementation as written.
   Binding: full strong sha256, drop `W/` and version_count from all
   four documents.

2. **value.js utility path: `api/src/crud/` vs `api/src/lib/crud/`.**
   12 sites use the former (primary, per U4 spec); 5 sites use the
   latter (CRUD-CONTRACT.md:818 §10 close-rule note;
   CONFORMANCE-MATRIX §U.1/§U.8 — 4 rows). Bind the no-`lib` form.

3. **C9.4 has no CONFORMANCE-MATRIX row.** The contract defines C9.4
   (utility-module admit-criteria: LOC ≤ 500; no control-inversion;
   `called by` direction) but the matrix never carries it. The
   `grep-no-shared-framework.sh` script (C9.3) also false-fails the
   moment the utility module lands unless it whitelists
   `api/lib/crud/` and `api/src/crud/`. Add §U.9 (6 rows) + amend
   the grep.

4. **W3 gates `softdelete.hard_delete_past_grace` that no spec
   exports.** U3/U4 only declare `soft_delete`/`restore` and
   `not_deleted_filter`; `hard_delete_past_grace` is conceptually
   `cron_prune`'s job. Drop the W3/W2 reference to the non-existent
   helper.

5. **§12 carries 3 resolved items as "open".** Word-list disposition
   (resolved by SLUG-WORDS.md), orphan-snapshot resolution (resolved
   by R-lifecycle §5.3), and `Idempotency-Key` storage (resolved by
   U3/U4: Mongo TTL) all read as "decide at Wχ close" or "decide at
   W3" when the U-round already bound them. Reclassify as resolved.

**LOC overshoot decisions (binding).**

- **Python**: ceiling **525** (not 600). Apply `functools.partial`
  to errors.py one-liner generation (~20 LOC saved); document the
  one-time 25-LOC slack absorbed by the shared `_canonical_json`
  helper.
- **TS**: ceiling **600** (delete the 750 placeholder; not raise to
  750). Compress slugs.ts (120→90), errors.ts (140→110 via
  table-driven helpers), idempotency.ts (110→90 via db.ts
  initialisation); ~590 LOC. Asymmetry documented as TS-strictness
  overhead.

**Cohort-orphan contingency** (one sentence). If value.js's tranche
C is shelved as the repo races forward on its D/E/F/G/H sequence,
fourier-B.W2 ceases to be load-bearing, B.W4 collapses to its
fallback (no `colors.ts` gut; residual logged with destination), and
every stale `~/Programming/value.js/api/src/...` file:line citation
in `CRUD-CONTRACT.md` must be re-pointed at the post-refactor paths
(`routes/palettes/crud.ts`, `middleware/*.ts`, `repositories/`)
before B.W3 dispatches; the 88 value.js-side conformance rows are
downgraded from a wave-close gate to status `DEFERRED` and the
cohort ratifies on the 88 fourier rows alone.
