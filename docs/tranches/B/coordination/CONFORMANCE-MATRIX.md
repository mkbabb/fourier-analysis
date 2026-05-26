# CONFORMANCE-MATRIX — CRUD-CONTRACT §10 broken out

**Companion to**: `CRUD-CONTRACT.md` (this document is the table behind §10's index).
**Status**: drafted at fourier-B.W1; per the orphan verdict at `coordination/CRUD-CONSTELLATION.md`, the rows below remain the substrate template for any successor tranche that reopens the cohort. Rows were to turn from `TBD` → `PASS` at B.W3 (fourier column) and value.js-C.W2 (value.js column).
**Format**: one row per assertion × repo. Columns: `Assertion ID | Contract § | Assertion | Repo | Test name | Run command | Expected output / fixture`.

This is the **literal close-on artefact** for fourier-B.W1's ratification
discipline and the conformance gate for both peer tranches.

## Goal criterion (document-level)

The aim: convert every prose rule of CRUD-CONTRACT.md §1–§9, §11 and every
machine-readable convention of SCHEMA.md §1 into a runnable test row in
both repos. A reviewer asking "does this contract bind anything testable?"
should be able to point at one row per rule and one test command per row.

## Completion criterion (document-level)

The 176 rows below — 88 assertions × 2 repos — are the binding ledger.
Every row carries a non-empty test name, run command, and expected
output / fixture. The §U amendment (utility-module rows per the
2026-05-19 DECISION) is folded into the same close gate. The §U closure
rule (every row PASS in both columns, including the utility-module
rows) is reaffirmed here as the binding closure discipline.

A row's two repo entries must both pass for the contract section it
indexes to be considered ratified. The historical close gate was: fourier-B.W1
could not close while any §1–§9 / §11 row had a `TBD` fourier cell with no
named test path; the W3 / value.js-C.W2 close gate was every cell `PASS`.

Aggregate run commands per repo (a row's `Run command` cell calls the single test; these run the whole suite):

- **fourier**: `uv run pytest -k 'conformance' -v` from the repo root.
- **value.js**: `npm run test:conformance` from `~/Programming/value.js/api/` (vitest harness — added at C.W0).

Source-grep assertions are scripted in `scripts/conformance/` (created at B.W3 in fourier; mirrored at C.W2 in value.js). They are invoked by the test suite via subprocess so a single run-command surface holds.

---

## §1 — Identity (3 assertions × 2 repos = 6 rows)

**Goal / Completion.** Bind the three identity-shape rules (no hash in
URL, slug-shape on read, no `_id` in response) into runnable tests per
repo. All 6 rows must PASS at B.W3 / value.js-C.W2 to ratify CRUD-CONTRACT §1.

| Assertion ID | Contract § | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| C1.1 | §1 | No content hash appears in any client-side URL pattern under `web/src/`, `~/Programming/value.js/api/src/`, or value.js web sources. | fourier | `test_identity_no_hash_in_url` | `uv run pytest api/tests/conformance/test_identity.py::test_no_hash_in_url -v` | subprocess `scripts/conformance/grep-no-hash-in-url.sh` exits 0; stdout `OK: no hash-shaped URL fragments`. Fixture: grep over `web/src/` + `api/`. |
| C1.1 | §1 | No content hash appears in any client-side URL pattern under `web/src/`, `~/Programming/value.js/api/src/`, or value.js web sources. | value.js | `test/conformance/identity/no-hash-in-url.test.ts` | `npx vitest run test/conformance/identity/no-hash-in-url.test.ts` | subprocess `scripts/conformance/grep-no-hash-in-url.sh` exits 0; stdout `OK: no hash-shaped URL fragments`. Fixture: grep over `api/src/` + `demo/`. |
| C1.2 | §1 | `GET /{entity}/{slug}` returns 200 for slugs matching `^[a-z]+(-[a-z]+){3}$`; requests matching `^[0-9a-f]{40,}$` return 400 problem+json `urn:contract:slug-invalid`. | fourier | `test_identity_slug_read_shape` | `uv run pytest api/tests/conformance/test_identity.py::test_slug_read_shape -v` | 200 with body conforming to `Visualization`; 400 with `Content-Type: application/problem+json` and `{type: "urn:contract:slug-invalid", status: 400}`. Fixture: seed one `quiet-blue-morning-fox` row + one read with 64-hex string. |
| C1.2 | §1 | `GET /{entity}/{slug}` returns 200 for slugs matching `^[a-z]+(-[a-z]+){3}$`; requests matching `^[0-9a-f]{40,}$` return 400 problem+json `urn:contract:slug-invalid`. | value.js | `test/conformance/identity/slug-read-shape.test.ts` | `npx vitest run test/conformance/identity/slug-read-shape.test.ts` | 200 with body conforming to `Palette`; 400 problem+json `urn:contract:slug-invalid`. Fixture: seed `warm-blue-quiet-fox` + read with hex string. |
| C1.3 | §1 | `GET /{entity}/{slug}` response body does not contain a top-level `_id` field. | fourier | `test_identity_no_id_field` | `uv run pytest api/tests/conformance/test_identity.py::test_no_id_field -v` | `"_id" not in response.json().keys()` for 100 random seeded visualizations. |
| C1.3 | §1 | `GET /{entity}/{slug}` response body does not contain a top-level `_id` field. | value.js | `test/conformance/identity/no-id-field.test.ts` | `npx vitest run test/conformance/identity/no-id-field.test.ts` | `expect(body).not.toHaveProperty("_id")` for 100 random seeded palettes. |

## §2 — Slug algorithm (4 assertions × 2 repos = 8 rows)

**Goal / Completion.** Bind the four slug-algorithm rules (generated
shape, collision retry, no check-then-insert, word-list membership) into
tests; 8 rows must PASS.

| Assertion ID | Contract § | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| C2.1 | §2 | 1,000 generated slugs all match `^[a-z]+(-[a-z]+){3}$`. | fourier | `test_slug_format_shape` | `uv run pytest api/tests/conformance/test_slug_format.py::test_slug_shape -v` | `assert all(SLUG_RE.match(s) for s in (generate_slug() for _ in range(1000)))`. |
| C2.1 | §2 | 1,000 generated slugs all match `^[a-z]+(-[a-z]+){3}$`. | value.js | `test/conformance/slug/format-shape.test.ts` | `npx vitest run test/conformance/slug/format-shape.test.ts` | `expect(generated.every(s => SLUG_RE.test(s))).toBe(true)` over 1,000 calls to `generateSlug()`. |
| C2.2 | §2 | Forced slug collision triggers retry with fresh slug; succeeds within 10 attempts. | fourier | `test_slug_collision_dup_key_retry` | `uv run pytest api/tests/conformance/test_slug_collision.py::test_duplicate_key_retry -v` | Pre-insert known slug; monkeypatch `secrets.choice` to emit it once; assert second insert succeeds and emits warning `slug-retry attempt=2`. |
| C2.2 | §2 | Forced slug collision triggers retry with fresh slug; succeeds within 10 attempts. | value.js | `test/conformance/slug/dup-key-retry.test.ts` | `npx vitest run test/conformance/slug/dup-key-retry.test.ts` | Pre-insert known slug; mock RNG to emit collision once; assert `generateUniqueSlug` returns a fresh slug on retry. |
| C2.3 | §2 | No `find_one(...slug...) && generate_slug` check-then-insert pattern exists; collision handled by `DuplicateKeyError` only. | fourier | `test_slug_no_check_then_insert` | `uv run pytest api/tests/conformance/test_slug_format.py::test_no_check_then_insert -v` | subprocess `scripts/conformance/grep-no-check-then-insert.sh` exits 0; stdout `OK: 0 matches in api/`. |
| C2.3 | §2 | No `findOne({slug}) && generateSlug` check-then-insert pattern exists; collision handled by `MongoServerError code=11000` only. | value.js | `test/conformance/slug/no-check-then-insert.test.ts` | `npx vitest run test/conformance/slug/no-check-then-insert.test.ts` | subprocess `scripts/conformance/grep-no-check-then-insert.sh` exits 0; stdout `OK: 0 matches in api/src/`. |
| C2.4 | §2, §9 | Every emitted slug belongs to the contract-binding word lists (R3 disposition). | fourier | `test_slug_words_in_list` | `uv run pytest api/tests/conformance/test_slug_format.py::test_words_in_list -v` | For 1,000 generated slugs, every word ∈ {adjectives ∪ verbs ∪ colors ∪ animals} of the shared list (file location per R3). |
| C2.4 | §2, §9 | Every emitted slug belongs to the contract-binding word lists (R3 disposition). | value.js | `test/conformance/slug/words-in-list.test.ts` | `npx vitest run test/conformance/slug/words-in-list.test.ts` | For 1,000 generated slugs, every word ∈ shared list. |

## §3 — Ownership (4 assertions × 2 repos = 8 rows)

**Goal / Completion.** Bind the four ownership rules (anonymous-create
401, wrong-owner 403, schema rejects null owner, zero null-owner rows
post-migration); 8 rows must PASS.

| Assertion ID | Contract § | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| C3.1 | §3 | `POST /visualizations` (resp. `/palettes`) without `X-Session-Token` returns 401 problem+json `urn:contract:owner-required` (or `session-invalid`). | fourier | `test_ownership_anonymous_create_401` | `uv run pytest api/tests/conformance/test_ownership.py::test_anonymous_create_401 -v` | `POST /visualizations` body=valid; no `X-Session-Token` header. Response: 401 + `{"type": "urn:contract:owner-required", "status": 401, "title": "Owner required"}`. |
| C3.1 | §3 | `POST /palettes` without `X-Session-Token` returns 401 problem+json `urn:contract:owner-required`. | value.js | `test/conformance/ownership/anonymous-create-401.test.ts` | `npx vitest run test/conformance/ownership/anonymous-create-401.test.ts` | `POST /palettes` body=valid; no token. Response: 401 problem+json with matching shape. |
| C3.2 | §3 | `PATCH /{entity}/{slug}` with a session for a different user returns 403 problem+json `urn:contract:not-owner`. | fourier | `test_ownership_wrong_owner_403` | `uv run pytest api/tests/conformance/test_ownership.py::test_wrong_owner_403 -v` | Seed viz owned by user A; PATCH with session for user B → 403 + `urn:contract:not-owner`. |
| C3.2 | §3 | `PATCH /palettes/{slug}` with a session for a different user returns 403 problem+json `urn:contract:not-owner`. | value.js | `test/conformance/ownership/wrong-owner-403.test.ts` | `npx vitest run test/conformance/ownership/wrong-owner-403.test.ts` | Seed palette owned by user A; PATCH with token B → 403 + `urn:contract:not-owner`. |
| C3.3 | §3 | Direct DB insert of an entity with `owner_slug: null` is rejected by MongoDB schema validation. | fourier | `test_ownership_schema_null_owner` | `uv run pytest api/tests/conformance/test_ownership.py::test_schema_null_owner -v` | `await db.visualizations.insert_one({"slug": "x-y-z-w", "owner_slug": None, ...})` raises `pymongo.errors.WriteError` with code 121 (`DocumentValidationFailure`). |
| C3.3 | §3 | Direct DB insert of a palette with `userSlug: null` is rejected by MongoDB schema validation. | value.js | `test/conformance/ownership/schema-null-owner.test.ts` | `npx vitest run test/conformance/ownership/schema-null-owner.test.ts` | `db.palettes.insertOne({slug: "x-y-z-w", userSlug: null, ...})` rejects with `MongoServerError code=121`. |
| C3.4 | §3, §11 | `countDocuments({owner_slug: null})` is 0 post-migration. | fourier | `test_migration_no_null_owner` | `uv run pytest api/tests/conformance/test_migration.py::test_no_null_owner -v` | After running `api/scripts/migrate_visualization.py`, `db.visualizations.count_documents({"owner_slug": None}) == 0`. |
| C3.4 | §3, §11 | `countDocuments({userSlug: null})` is 0 post-migration. | value.js | `test/conformance/migration/no-null-owner.test.ts` | `npx vitest run test/conformance/migration/no-null-owner.test.ts` | After `migrate-palette-schema.ts`, `db.palettes.countDocuments({userSlug: null}) === 0`. |

## §4 — Visibility (4 assertions × 2 repos = 8 rows)

**Goal / Completion.** Bind the four visibility rules (enum validation,
anonymous-list-only-public, draft-404-to-non-owner, owner-sees-all);
8 rows must PASS.

| Assertion ID | Contract § | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| C4.1 | §4 | `visibility` field rejects values outside `{draft, unlisted, public}` via schema validation. | fourier | `test_visibility_enum_validation` | `uv run pytest api/tests/conformance/test_visibility.py::test_enum_validation -v` | `POST /visualizations` with `visibility="private"` → 422 problem+json `urn:contract:validation-failed` with `errors[0].path == "/visibility"`. |
| C4.1 | §4 | `visibility` field rejects values outside `{draft, unlisted, public}` via schema validation. | value.js | `test/conformance/visibility/enum-validation.test.ts` | `npx vitest run test/conformance/visibility/enum-validation.test.ts` | `POST /palettes` with `visibility="private"` → 422 problem+json `urn:contract:validation-failed`. |
| C4.2 | §4 | Anonymous `GET /{entity}` over a fixture with one of each of `{draft, unlisted, public}` returns only the `public` row. | fourier | `test_visibility_anonymous_list_public_only` | `uv run pytest api/tests/conformance/test_visibility.py::test_anonymous_list_public_only -v` | Seed 3 viz; anonymous `GET /visualizations` → `{data: [<public row>], next_cursor: null, prev_cursor: null, has_more: false}`. |
| C4.2 | §4 | Anonymous `GET /palettes` over fixture returns only the `public` row. | value.js | `test/conformance/visibility/anonymous-list-public-only.test.ts` | `npx vitest run test/conformance/visibility/anonymous-list-public-only.test.ts` | Seed 3 palettes; anonymous list → only the public row. |
| C4.3 | §4 | Anonymous `GET /{entity}/{slug}` for a `draft` row returns 404 (not 403, refuses to confirm existence); `unlisted` and `public` return 200. | fourier | `test_visibility_draft_404_anonymous` | `uv run pytest api/tests/conformance/test_visibility.py::test_draft_404_anonymous -v` | Seed three rows; anonymous reads: draft → 404 `urn:contract:not-found`; unlisted → 200; public → 200. |
| C4.3 | §4 | Anonymous `GET /palettes/{slug}` for a `draft` returns 404; `unlisted` and `public` return 200. | value.js | `test/conformance/visibility/draft-404-anonymous.test.ts` | `npx vitest run test/conformance/visibility/draft-404-anonymous.test.ts` | Same matrix on palette fixture. |
| C4.4 | §4 | `GET /{entity}?owner=me` with the owner's session returns all three visibility states. | fourier | `test_visibility_owner_sees_all` | `uv run pytest api/tests/conformance/test_visibility.py::test_owner_sees_all -v` | `GET /visualizations?owner=me` with owner session → `data.length == 3` covering `{draft, unlisted, public}`. |
| C4.4 | §4 | `GET /palettes?owner=me` returns all three states. | value.js | `test/conformance/visibility/owner-sees-all.test.ts` | `npx vitest run test/conformance/visibility/owner-sees-all.test.ts` | `data.length === 3`. |

## §4-extra — Visibility transition rules (3 assertions × 2 repos = 6 rows)

**Goal / Completion.** Bind the transition guards (public→draft rejected;
two-step via unlisted permitted; default-to-draft on create); 6 rows
must PASS.

| Assertion ID | Contract § | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| C4.5 | §4 | `PATCH visibility: public → draft` is rejected with 409 `urn:contract:visibility-illegal-transition` (must transit `unlisted`). | fourier | `test_visibility_public_to_draft_rejected` | `uv run pytest api/tests/conformance/test_visibility.py::test_public_to_draft_rejected -v` | Seed `public`; PATCH `{visibility: "draft"}` → 409 + `urn:contract:visibility-illegal-transition`. |
| C4.5 | §4 | `PATCH visibility: public → draft` is rejected. | value.js | `test/conformance/visibility/public-to-draft-rejected.test.ts` | `npx vitest run test/conformance/visibility/public-to-draft-rejected.test.ts` | 409 problem+json. |
| C4.6 | §4 | `PATCH visibility: public → unlisted → draft` is permitted in two steps. | fourier | `test_visibility_transition_via_unlisted` | `uv run pytest api/tests/conformance/test_visibility.py::test_transition_via_unlisted -v` | Two PATCH calls each return 200; final read shows `visibility == "draft"`. |
| C4.6 | §4 | Same on palette. | value.js | `test/conformance/visibility/transition-via-unlisted.test.ts` | `npx vitest run test/conformance/visibility/transition-via-unlisted.test.ts` | Same. |
| C4.7 | §4 | New `POST /{entity}` defaults to `visibility = "draft"` when field is omitted. | fourier | `test_visibility_default_draft` | `uv run pytest api/tests/conformance/test_visibility.py::test_default_draft -v` | POST without `visibility` → response body has `visibility: "draft"`. |
| C4.7 | §4 | New `POST /palettes` defaults to `draft`. | value.js | `test/conformance/visibility/default-draft.test.ts` | `npx vitest run test/conformance/visibility/default-draft.test.ts` | Default field is `"draft"`. |

## §5 — Soft-delete (4 assertions × 2 repos = 8 rows)

**Goal / Completion.** Bind the four soft-delete rules (anonymous 404
after delete; restore-in-grace 200; cron hard-deletes past grace; no
unbounded `$nin`); 8 rows must PASS.

| Assertion ID | Contract § | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| C5.1 | §5 | `DELETE /{entity}/{slug}` followed by anonymous `GET` returns 404; owner with `include_deleted=true` sees the row. | fourier | `test_soft_delete_anonymous_404` | `uv run pytest api/tests/conformance/test_soft_delete.py::test_anonymous_404_after_delete -v` | Sequence: POST owner viz; DELETE with owner session; GET anonymous → 404; GET `?owner=me&include_deleted=true` → row present with `deleted_at != null`. |
| C5.1 | §5 | Same on palette. | value.js | `test/conformance/soft-delete/anonymous-404.test.ts` | `npx vitest run test/conformance/soft-delete/anonymous-404.test.ts` | Same. |
| C5.2 | §5 | `POST /{entity}/{slug}/restore` within grace window returns 200; the row appears in public lists again. | fourier | `test_soft_delete_restore_in_grace` | `uv run pytest api/tests/conformance/test_soft_delete.py::test_restore_in_grace -v` | Soft-delete 1h ago; POST restore → 200 with `deleted_at: null, restored_at: <now>`; subsequent list contains row. |
| C5.2 | §5 | Same on palette. | value.js | `test/conformance/soft-delete/restore-in-grace.test.ts` | `npx vitest run test/conformance/soft-delete/restore-in-grace.test.ts` | Same. |
| C5.3 | §5 | A fixture row with `deleted_at = now - (grace_days + 1)` is hard-removed by one cron tick. | fourier | `test_soft_delete_cron_hard_deletes` | `uv run pytest api/tests/conformance/test_soft_delete.py::test_cron_hard_deletes_past_grace -v` | Seed row; freeze time; run `janitor.run_once()`; `db.visualizations.find_one({slug: ...})` is None; subsequent GET → 404 even with `include_deleted=true`. |
| C5.3 | §5 | Same on palette via `cron.ts:runOnce()`. | value.js | `test/conformance/soft-delete/cron-hard-deletes.test.ts` | `npx vitest run test/conformance/soft-delete/cron-hard-deletes.test.ts` | Same. |
| C5.4 | §5, §8 | No unbounded `$nin` query in janitor / cron code; bounded `distinct()` predicates only or `pinned: false` indexed predicate. | fourier | `test_no_unbounded_nin` | `uv run pytest api/tests/conformance/test_soft_delete.py::test_no_unbounded_nin -v` | subprocess `scripts/conformance/grep-no-unbounded-nin.sh api/services/janitor.py` exits 0; stdout `OK: every $nin bounded`. |
| C5.4 | §5, §8 | Same on `api/src/cron.ts`. | value.js | `test/conformance/soft-delete/no-unbounded-nin.test.ts` | `npx vitest run test/conformance/soft-delete/no-unbounded-nin.test.ts` | subprocess `scripts/conformance/grep-no-unbounded-nin.sh api/src/cron.ts` exits 0. |

## §5-extra — Soft-delete grace period boundary (1 assertion × 2 repos = 2 rows)

**Goal / Completion.** Bind the grace-boundary rule (inside-grace
survives one cron tick); 2 rows must PASS.

| Assertion ID | Contract § | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| C5.5 | §5 | A row with `deleted_at = now - (grace_days - 1)` (1 day inside grace) survives cron tick; restoration still 200. | fourier | `test_soft_delete_inside_grace_survives` | `uv run pytest api/tests/conformance/test_soft_delete.py::test_inside_grace_survives -v` | Cron `run_once()` leaves row; POST restore → 200. |
| C5.5 | §5 | Same on palette. | value.js | `test/conformance/soft-delete/inside-grace-survives.test.ts` | `npx vitest run test/conformance/soft-delete/inside-grace-survives.test.ts` | Same. |

## §6 — Sessions (4 assertions × 2 repos = 8 rows)

**Goal / Completion.** Bind the four session rules (register/me
round-trip; logout invalidates; login timing-safe; suspended account 403
after cache TTL); 8 rows must PASS.

| Assertion ID | Contract § | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| C6.1 | §6 | `POST /sessions` returns 201 `{token, user_slug}`; `GET /sessions/me` with the token returns the same `user_slug`. | fourier | `test_sessions_register_and_me` | `uv run pytest api/tests/conformance/test_sessions.py::test_register_and_me -v` | 201 body matches `{token: UUIDv4, user_slug: <Slug>}`; subsequent GET returns same `user_slug`. |
| C6.1 | §6 | Same on palette-api `/sessions`. | value.js | `test/conformance/sessions/register-and-me.test.ts` | `npx vitest run test/conformance/sessions/register-and-me.test.ts` | Same shape. |
| C6.2 | §6 | `DELETE /sessions` then `GET /sessions/me` with the revoked token → 401. | fourier | `test_sessions_logout` | `uv run pytest api/tests/conformance/test_sessions.py::test_logout -v` | DELETE → 200 `{ok: true}`; GET → 401 `urn:contract:session-invalid`. |
| C6.2 | §6 | Same. | value.js | `test/conformance/sessions/logout.test.ts` | `npx vitest run test/conformance/sessions/logout.test.ts` | Same. |
| C6.3 | §6 | `POST /sessions/login` timing-safe: existing vs non-existent slug differs by < 50ms over 100 trials; both ≥ 200ms. | fourier | `test_sessions_login_timing` | `uv run pytest api/tests/conformance/test_sessions.py::test_login_timing -v` | `abs(mean(existing) - mean(missing)) < 0.050`; `min(both) >= 0.200`. |
| C6.3 | §6 | Same on palette-api. | value.js | `test/conformance/sessions/login-timing.test.ts` | `npx vitest run test/conformance/sessions/login-timing.test.ts` | Same. |
| C6.4 | §6 | Suspended-user request returns 403 `urn:contract:account-suspended` after cache TTL elapses or on fresh process. | fourier | `test_sessions_suspended_403` | `uv run pytest api/tests/conformance/test_sessions.py::test_suspended_403 -v` | Admin suspend; sleep > 60s OR restart in-memory cache; GET with token → 403. |
| C6.4 | §6 | Same on palette-api. | value.js | `test/conformance/sessions/suspended-403.test.ts` | `npx vitest run test/conformance/sessions/suspended-403.test.ts` | Same. |

## §7 — Admin moderation (5 assertions × 2 repos = 10 rows)

**Goal / Completion.** Bind the five admin rules (audit row per action;
idempotent suspend; non-admin rejected; flag uniqueness; admin delete
bypasses grace); 10 rows must PASS.

| Assertion ID | Contract § | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| C7.1 | §7 | Every admin mutation writes one row to `admin_audit` with matching `action` and `target`. | fourier | `test_admin_audit_row_per_action` | `uv run pytest api/tests/conformance/test_admin.py::test_audit_row_per_action -v` | Run admin `feature(slug)`; `db.admin_audit.find_one({action: "feature", target: slug})` is not None. |
| C7.1 | §7 | Same on palette-api. | value.js | `test/conformance/admin/audit-row-per-action.test.ts` | `npx vitest run test/conformance/admin/audit-row-per-action.test.ts` | Same. |
| C7.2 | §7 | Applying `suspend_user` twice yields 200 + 200 (idempotent); audit log has both rows; second annotated `noop: true`. | fourier | `test_admin_idempotent_suspend` | `uv run pytest api/tests/conformance/test_admin.py::test_idempotent_suspend -v` | Two POSTs; both return 200; `db.admin_audit.count_documents({action: "suspend_user", target: user_slug}) == 2`; second has `noop: true`. |
| C7.2 | §7 | Same on palette-api. | value.js | `test/conformance/admin/idempotent-suspend.test.ts` | `npx vitest run test/conformance/admin/idempotent-suspend.test.ts` | Same. |
| C7.3 | §7 | Non-admin request to any admin endpoint returns 401 (no auth) or 403 (wrong token); never 200. | fourier | `test_admin_non_admin_rejected` | `uv run pytest api/tests/conformance/test_admin.py::test_non_admin_rejected -v` | Sweep over admin routes; no-auth → 401; wrong bearer → 403; never 200. |
| C7.3 | §7 | Same. | value.js | `test/conformance/admin/non-admin-rejected.test.ts` | `npx vitest run test/conformance/admin/non-admin-rejected.test.ts` | Same. |
| C7.4 | §7 | `(entity_slug, reporter_slug)` is a unique index; double-flag by same reporter raises `DuplicateKeyError`. | fourier | `test_admin_flag_uniqueness` | `uv run pytest api/tests/conformance/test_admin.py::test_flag_uniqueness -v` | First flag 201; second flag by same reporter → 409 `urn:contract:flag-duplicate`. |
| C7.4 | §7 | Same on palette-api. | value.js | `test/conformance/admin/flag-uniqueness.test.ts` | `npx vitest run test/conformance/admin/flag-uniqueness.test.ts` | Same. |
| C7.5 | §7 | Admin `delete` on a live entity bypasses the §5 grace window; row hard-deleted in one operation; audit row written. | fourier | `test_admin_hard_delete_bypasses_grace` | `uv run pytest api/tests/conformance/test_admin.py::test_hard_delete_bypasses_grace -v` | POST admin delete → 200; `db.visualizations.find_one({slug})` is None; `db.admin_audit.find_one({action: "delete", target: slug})` exists. |
| C7.5 | §7 | Same on palette-api. | value.js | `test/conformance/admin/hard-delete-bypasses-grace.test.ts` | `npx vitest run test/conformance/admin/hard-delete-bypasses-grace.test.ts` | Same. |

## §7-extra — Admin batch return shape (1 assertion × 2 repos = 2 rows)

**Goal / Completion.** Bind the batch-return-shape rule (partial 207 +
`{processed, errors[]}`); 2 rows must PASS.

| Assertion ID | Contract § | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| C7.6 | §7 | Batch action with partial success returns 207 + `{processed: <int>, errors: [{slug, code, detail}]}`. | fourier | `test_admin_batch_return_shape` | `uv run pytest api/tests/conformance/test_admin.py::test_batch_return_shape -v` | Seed 3 slugs (2 valid, 1 nonexistent); POST batch delete → 207 + `{processed: 2, errors: [{slug: "missing-x-y-z", code: "not-found", detail: "..."}]}`. |
| C7.6 | §7 | Same on palette-api. | value.js | `test/conformance/admin/batch-return-shape.test.ts` | `npx vitest run test/conformance/admin/batch-return-shape.test.ts` | Same. |

## §8 — Cron / TTL (4 assertions × 2 repos = 8 rows)

**Goal / Completion.** Bind the four cron rules (no unbounded `$nin`;
one tick clears fixture; required indexes exist; second tick no-op);
8 rows must PASS.

| Assertion ID | Contract § | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| C8.1 | §8 | Zero unbounded `$nin` predicates in janitor / cron — every occurrence is over a bounded `distinct()` (≤10k rows) or a `pinned: false` indexed predicate. | fourier | `test_cron_no_unbounded_nin` | `uv run pytest api/tests/conformance/test_janitor.py::test_no_unbounded_nin -v` | subprocess `scripts/conformance/grep-no-unbounded-nin.sh api/services/janitor.py` exits 0. |
| C8.1 | §8 | Same on `api/src/cron.ts`. | value.js | `test/conformance/cron/no-unbounded-nin.test.ts` | `npx vitest run test/conformance/cron/no-unbounded-nin.test.ts` | `scripts/conformance/grep-no-unbounded-nin.sh api/src/cron.ts` exits 0. |
| C8.2 | §8 | One cron tick clears a fixture with one each of {expired session, soft-deleted-past-grace entity, stale user + 3 entities + 2 sessions, orphan flag}. | fourier | `test_janitor_one_tick_clears_fixture` | `uv run pytest api/tests/conformance/test_janitor.py::test_one_tick_clears_fixture -v` | After `janitor.run_once()`, each collection's count of the seeded rows is 0. |
| C8.2 | §8 | Same on cron.ts. | value.js | `test/conformance/cron/one-tick-clears.test.ts` | `npx vitest run test/conformance/cron/one-tick-clears.test.ts` | Same. |
| C8.3 | §8 | Required indexes (`deleted_at`, `last_accessed_at`) exist on the entity collection. | fourier | `test_database_required_indexes` | `uv run pytest api/tests/conformance/test_database.py::test_required_indexes -v` | `db.visualizations.index_information()` contains `deleted_at_1` and `last_accessed_at_1`. |
| C8.3 | §8 | Same on palette-api. | value.js | `test/conformance/db/required-indexes.test.ts` | `npx vitest run test/conformance/db/required-indexes.test.ts` | `db.palettes.listIndexes()` includes `deleted_at_1` and `lastAccessedAt_1`. |
| C8.4 | §8 | Cron is idempotent: second tick immediately after first is a no-op (`deleted_count == 0` on every category). | fourier | `test_janitor_second_tick_noop` | `uv run pytest api/tests/conformance/test_janitor.py::test_second_tick_noop -v` | Run `janitor.run_once()` twice; second invocation returns category counts all 0. |
| C8.4 | §8 | Same on cron.ts. | value.js | `test/conformance/cron/second-tick-noop.test.ts` | `npx vitest run test/conformance/cron/second-tick-noop.test.ts` | Same. |

## §8-extra — Cron pinned-flag behaviour (1 assertion × 2 repos = 2 rows)

**Goal / Completion.** Bind the pinned-flag rule (a `pinned: true` row
with stale `last_accessed_at` survives); 2 rows must PASS.

| Assertion ID | Contract § | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| C8.5 | §8 | A `pinned: true` row whose `last_accessed_at` is past the TTL cutoff is **not** hard-deleted by the cron. | fourier | `test_janitor_pinned_survives_ttl` | `uv run pytest api/tests/conformance/test_janitor.py::test_pinned_survives_ttl -v` | Seed pinned row with stale `last_accessed_at`; `janitor.run_once()`; row still exists. |
| C8.5 | §8 | Same on palette-api. | value.js | `test/conformance/cron/pinned-survives-ttl.test.ts` | `npx vitest run test/conformance/cron/pinned-survives-ttl.test.ts` | Same. |

## §9 — Shared data vs code (3 assertions × 2 repos = 6 rows)

**Goal / Completion.** Bind the three shared-vs-code rules (shared word
list present if R3 disposed as `data`; rate-limiter process-local; no
shared framework / codegen / third service); 6 rows must PASS.

| Assertion ID | Contract § | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| C9.1 | §9 | If R3 dispositions slug word-lists as `data`, the shared data file (location TBD) exists and is consumed by both repos. | fourier | `test_shared_slug_words_present` | `uv run pytest api/tests/conformance/test_shared_data.py::test_slug_words_present -v` | `import slug_words; assert len(slug_words.ADJECTIVES) > 0` (or file-grep that the wordlist hash matches the contract appendix hash). Conditional on R3. |
| C9.1 | §9 | Same on palette-api. | value.js | `test/conformance/shared/slug-words-present.test.ts` | `npx vitest run test/conformance/shared/slug-words-present.test.ts` | `import {ADJECTIVES} from '<location>'; expect(ADJECTIVES.length).toBeGreaterThan(0)`. Conditional on R3. |
| C9.2 | §9 | Rate-limiter state is process-local — two processes each get full budget independently. | fourier | `test_rate_limiter_cross_process` | `uv run pytest api/tests/conformance/test_rate_limiter.py::test_cross_process -v` | Spawn second `uvicorn` worker; exhaust budget on worker A; assert worker B accepts at full budget. |
| C9.2 | §9 | Same. | value.js | `test/conformance/rate-limiter/cross-process.test.ts` | `npx vitest run test/conformance/rate-limiter/cross-process.test.ts` | Same. |
| C9.3 | §9 | No shared CRUD framework / codegen step / third coordinating service in either repo or its compose files. | fourier | `test_no_shared_framework` | `uv run pytest api/tests/conformance/test_no_shared_framework.py -v` | subprocess `scripts/conformance/grep-no-shared-framework.sh` exits 0; stdout `OK: 0 shared-crud / codegen / third-service references`. |
| C9.3 | §9 | Same. | value.js | `test/conformance/shared/no-shared-framework.test.ts` | `npx vitest run test/conformance/shared/no-shared-framework.test.ts` | Same. |

## §11 — Migration (3 assertions × 2 repos = 6 rows)

**Goal / Completion.** Bind the three migration rules (idempotent on
second run; `--verify` produces count artefact; 10-row spot-check); 6
rows must PASS.

| Assertion ID | Contract § | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| C11.1 | §11 | Second run of the migration produces zero writes (idempotent). | fourier | `test_migration_idempotent` | `uv run pytest api/tests/conformance/test_migration.py::test_idempotent -v` | First run reports `inserted/modified` > 0; second run reports `inserted: 0, modified: 0`. |
| C11.1 | §11 | Same on palette-api `migrate-palette-schema.ts`. | value.js | `test/conformance/migration/idempotent.test.ts` | `npx vitest run test/conformance/migration/idempotent.test.ts` | Same. |
| C11.2 | §11 | `--verify` flag produces `docs/tranches/B/audit/migration-counts.md` with pre/post counts matching expected derivation. | fourier | `test_migration_count_verify` | `uv run python api/scripts/migrate_visualization.py --verify` | Stdout contains `pre_count=<N>` + `post_count=<M>` matching union(gallery, snapshot-resolved); markdown artefact present in `docs/tranches/B/audit/`. |
| C11.2 | §11 | Same. | value.js | `npm run migrate:verify` | `npx tsx api/src/migrate-palette-schema.ts --verify` | Stdout + markdown count artefact. |
| C11.3 | §11 | 10 random `snapshot_hash` values (sampled with seed=42 pre-migration) appear post-migration as `visualization` rows with the expected fields. | fourier | `test_migration_spot_check_10_rows` | `uv run pytest api/tests/conformance/test_migration.py::test_spot_check_10_rows -v` | For each sampled hash: post-migration viz with same `content_hash`, non-null `owner_slug`, valid `slug`, copied `active_bases / n_harmonics / contour_settings / animation_settings`. |
| C11.3 | §11 | Same on palette-api (10 random `currentHash` values pre-migration). | value.js | `test/conformance/migration/spot-check-10-rows.test.ts` | `npx vitest run test/conformance/migration/spot-check-10-rows.test.ts` | For each sampled hash: post-migration palette with matching `content_hash`, non-null `owner_slug`, valid `slug`, split `visibility/tier`. |

---

## SCHEMA-derived rows (SOTA conventions in SCHEMA.md §1)

**Goal / Completion.** Convert SCHEMA.md §1's SOTA-convention block into
testable rows — cursor pagination, ETag concurrency, Idempotency-Key
replay, rate-limit headers, problem+json envelope, URL-shape secrecy,
CRUD identity-stability. These rows are not in CRUD-CONTRACT.md §1–§9
but bind the same close gate. They close on B.W3 (fourier) and
value.js-C.W2 (value.js).

### §S1 — Cursor pagination roundtrip (3 assertions × 2 repos = 6 rows)

| Assertion ID | Contract § | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| CS1.1 | SCHEMA §1, §6 | Cursor is base64url-encoded JSON conforming to `CursorPayload`; clients receive an opaque string. | fourier | `test_pagination_cursor_opaque` | `uv run pytest api/tests/conformance/test_pagination.py::test_cursor_opaque -v` | `GET /visualizations?limit=2` over 5 seeded rows → response `next_cursor` decodes to `{id, sort_key, sort_value}` matching `CursorPayload` schema. |
| CS1.1 | SCHEMA §1, §6 | Same. | value.js | `test/conformance/pagination/cursor-opaque.test.ts` | `npx vitest run test/conformance/pagination/cursor-opaque.test.ts` | Same. |
| CS1.2 | SCHEMA §1 | Round-trip: paging forward then back yields the original page. | fourier | `test_pagination_roundtrip` | `uv run pytest api/tests/conformance/test_pagination.py::test_roundtrip -v` | Seed 10 rows; GET page 1 (cursor null); GET page 2 with next; GET page 1 with prev. Page-1 results identical across both fetches. |
| CS1.2 | SCHEMA §1 | Same. | value.js | `test/conformance/pagination/roundtrip.test.ts` | `npx vitest run test/conformance/pagination/roundtrip.test.ts` | Same. |
| CS1.3 | SCHEMA §1 | Invalid cursor (bad base64, bad JSON, bad schema, stale sort_key) returns 400 `urn:contract:cursor-invalid`. | fourier | `test_pagination_invalid_cursor` | `uv run pytest api/tests/conformance/test_pagination.py::test_invalid_cursor -v` | 4 sub-cases (`cursor=!!!`, `cursor=eyJiYWQi`, valid b64 of `{}`, valid cursor under sort=newest reused with sort=popular). All 400 + `urn:contract:cursor-invalid`. |
| CS1.3 | SCHEMA §1 | Same. | value.js | `test/conformance/pagination/invalid-cursor.test.ts` | `npx vitest run test/conformance/pagination/invalid-cursor.test.ts` | Same. |

### §S2 — ETag / If-Match concurrency (2 assertions × 2 repos = 4 rows)

| Assertion ID | Contract § | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| CS2.1 | SCHEMA §1 | `GET /{entity}/{slug}` returns `ETag: "<sha256-hex>"`; `PATCH` with matching `If-Match` returns 200; mismatch returns 412 `urn:contract:etag-mismatch`. | fourier | `test_etag_concurrency` | `uv run pytest api/tests/conformance/test_etag.py::test_concurrency -v` | GET → `ETag: "abc..."`. PATCH with `If-Match: "abc..."` → 200. PATCH with `If-Match: "stale"` → 412 + problem+json. |
| CS2.1 | SCHEMA §1 | Same on palette-api. | value.js | `test/conformance/etag/concurrency.test.ts` | `npx vitest run test/conformance/etag/concurrency.test.ts` | Same. |
| CS2.2 | SCHEMA §1 | `DELETE /{entity}/{slug}` without `If-Match` returns 428 `urn:contract:precondition-required` (or 412 if header sent but stale). | fourier | `test_etag_delete_requires_match` | `uv run pytest api/tests/conformance/test_etag.py::test_delete_requires_match -v` | DELETE w/o If-Match → 428; DELETE with stale If-Match → 412. |
| CS2.2 | SCHEMA §1 | Same. | value.js | `test/conformance/etag/delete-requires-match.test.ts` | `npx vitest run test/conformance/etag/delete-requires-match.test.ts` | Same. |

### §S3 — Idempotency-Key replay (2 assertions × 2 repos = 4 rows)

| Assertion ID | Contract § | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| CS3.1 | SCHEMA §1 | Two `POST /{entity}` with the same `Idempotency-Key` + same body return identical responses (same slug, same `created_at`). | fourier | `test_idempotency_replay_same_body` | `uv run pytest api/tests/conformance/test_idempotency.py::test_replay_same_body -v` | First POST → 201 with slug=X, created_at=T. Second POST with same header + body → 201 with slug=X, created_at=T (verbatim replay). Only one row in DB. |
| CS3.1 | SCHEMA §1 | Same on palette-api. | value.js | `test/conformance/idempotency/replay-same-body.test.ts` | `npx vitest run test/conformance/idempotency/replay-same-body.test.ts` | Same. |
| CS3.2 | SCHEMA §1 | Same `Idempotency-Key`, different body within 24h → 409 `urn:contract:idempotency-replay-conflict`. | fourier | `test_idempotency_replay_conflict` | `uv run pytest api/tests/conformance/test_idempotency.py::test_replay_conflict -v` | First POST body A → 201; second POST body B with same key → 409 problem+json. |
| CS3.2 | SCHEMA §1 | Same. | value.js | `test/conformance/idempotency/replay-conflict.test.ts` | `npx vitest run test/conformance/idempotency/replay-conflict.test.ts` | Same. |

### §S4 — Rate-limit headers (2 assertions × 2 repos = 4 rows)

| Assertion ID | Contract § | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| CS4.1 | SCHEMA §1 | Every response carries `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` headers; values bounded `0 ≤ remaining ≤ limit`. | fourier | `test_rate_limit_headers_present` | `uv run pytest api/tests/conformance/test_rate_limit.py::test_headers_present -v` | Sweep 5 endpoints; every response includes all three headers; assertion `0 <= int(remaining) <= int(limit)`. |
| CS4.1 | SCHEMA §1 | Same on palette-api. | value.js | `test/conformance/rate-limit/headers-present.test.ts` | `npx vitest run test/conformance/rate-limit/headers-present.test.ts` | Same. |
| CS4.2 | SCHEMA §1 | 429 response carries `Retry-After: <seconds>` (integer ≥ 1) **and** `RateLimit-Reset`. | fourier | `test_rate_limit_429_headers` | `uv run pytest api/tests/conformance/test_rate_limit.py::test_429_headers -v` | Exhaust budget; final request returns 429 + `Retry-After: ≥1`. Body is problem+json `urn:contract:rate-limited`. |
| CS4.2 | SCHEMA §1 | Same. | value.js | `test/conformance/rate-limit/429-headers.test.ts` | `npx vitest run test/conformance/rate-limit/429-headers.test.ts` | Same. |

### §S5 — Problem+json envelope (2 assertions × 2 repos = 4 rows)

| Assertion ID | Contract § | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| CS5.1 | SCHEMA §1, §5 | Every non-2xx response sets `Content-Type: application/problem+json` and conforms to `Problem` schema. | fourier | `test_problem_json_envelope` | `uv run pytest api/tests/conformance/test_problem.py::test_envelope -v` | Sweep over each catalogued error path; assert `response.headers["content-type"].startswith("application/problem+json")` and `Problem.model_validate(body)` succeeds. |
| CS5.1 | SCHEMA §1, §5 | Same. | value.js | `test/conformance/problem/envelope.test.ts` | `npx vitest run test/conformance/problem/envelope.test.ts` | Same. |
| CS5.2 | SCHEMA §5 | Each of the **21** catalogued `type` URIs is emitted by at least one code path (registry-style check). Count reconciled 2026-05-26 per Wave-2 audit C4 §6 #2 — drifted from "18" to the 20-row table at SCHEMA §5; further updated to **21** with the Wave-2 `urn:contract:slug-exhausted` row addition per C4 §6 #1 (d). | fourier | `test_problem_catalog_coverage` | `uv run pytest api/tests/conformance/test_problem.py::test_catalog_coverage -v` | For each `type` in catalog: a recorded request produces that `type`. `grep -rE 'urn:contract:<type>' api/` is non-zero for each. The catalog count assertion: `assert len(PROBLEM_CATALOG) == 21`. |
| CS5.2 | SCHEMA §5 | Same. | value.js | `test/conformance/problem/catalog-coverage.test.ts` | `npx vitest run test/conformance/problem/catalog-coverage.test.ts` | Same. |
| CS5.3 | SCHEMA §5 | The `urn:contract:slug-exhausted` 503 is emitted by `api/lib/crud/slugs.py::slug_with_retry` after 10 consecutive collisions (Wave-2 catalog row addition; C4 §6 #1 (d)). | fourier | `test_problem_slug_exhausted_503` | `uv run pytest api/tests/conformance/test_problem.py::test_slug_exhausted_503 -v` | Monkeypatch RNG to always emit a pre-seeded slug; POST `/visualizations` → 503 + `{"type": "urn:contract:slug-exhausted", "status": 503}`. |
| CS5.3 | SCHEMA §5 | Same. | value.js | `test/conformance/problem/slug-exhausted.test.ts` | `npx vitest run test/conformance/problem/slug-exhausted.test.ts` | Same. |
| CS5.4 | SCHEMA §3 | The `Problem` Python class realisation lives at `api/lib/crud/errors.py` (per `CRUD-LIB-PY.md §3`); the `Problem.model_validate(body)` assertion at CS5.1 resolves at this import path post-W3. Wave-2 amendment per C4 §4 gap (b) — the matrix references the class but the substrate has no `Problem` extant at HEAD; the realisation note pins the destination. | fourier | (covered by CS5.1; meta-row) | (no separate run) | `from api.lib.crud.errors import Problem; assert Problem.__name__ == "Problem"`. |

### §S6 — URL shape / `Link` header (2 assertions × 2 repos = 4 rows)

| Assertion ID | Contract § | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| CS6.1 | SCHEMA §1, §6 | List response with `next_cursor != null` includes a `Link: <…>; rel="next"` header per RFC 8288. | fourier | `test_link_header_next` | `uv run pytest api/tests/conformance/test_pagination.py::test_link_header_next -v` | `GET /visualizations?limit=2` over 5 rows → `Link` header contains `rel="next"` and the URL embeds the `next_cursor` value. |
| CS6.1 | SCHEMA §1, §6 | Same. | value.js | `test/conformance/pagination/link-header-next.test.ts` | `npx vitest run test/conformance/pagination/link-header-next.test.ts` | Same. |
| CS6.2 | SCHEMA §1 | `_id` (Mongo ObjectId), session tokens, and content hashes never appear in URL paths or query strings on any endpoint. | fourier | `test_url_shape_no_secrets` | `uv run pytest api/tests/conformance/test_url_shape.py::test_no_secrets -v` | `scripts/conformance/grep-no-internal-id-in-url.sh` exits 0 over `api/routers/` and `web/src/`. |
| CS6.2 | SCHEMA §1 | Same. | value.js | `test/conformance/url-shape/no-secrets.test.ts` | `npx vitest run test/conformance/url-shape/no-secrets.test.ts` | `scripts/conformance/grep-no-internal-id-in-url.sh` exits 0 over `api/src/routes/`. |

### §S7 — CRUD identity-stability (2 assertions × 2 repos = 4 rows)

| Assertion ID | Contract § | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| CS7.1 | §1, SCHEMA §3 | Slug is stable across CRUD: create → read → patch → read; slug field is byte-identical at every step; `slug` is rejected as a PATCH field. | fourier | `test_identity_slug_stable_across_crud` | `uv run pytest api/tests/conformance/test_identity.py::test_slug_stable_across_crud -v` | POST → slug=X. GET → slug=X. PATCH `{visibility: "public"}` → slug=X. PATCH `{slug: "y-y-y-y"}` → 422 (slug not in `VisualizationUpdate`). |
| CS7.1 | §1, SCHEMA §3 | Same on palette. | value.js | `test/conformance/identity/slug-stable-across-crud.test.ts` | `npx vitest run test/conformance/identity/slug-stable-across-crud.test.ts` | Same. |
| CS7.2 | §1, §3 | Owner-required rejection: POST with valid body but no session → 401 `urn:contract:owner-required`; identical body with valid session → 201. | fourier | `test_identity_owner_required` | `uv run pytest api/tests/conformance/test_identity.py::test_owner_required -v` | Same body, two requests; first w/o token → 401; second with token → 201. |
| CS7.2 | §1, §3 | Same. | value.js | `test/conformance/identity/owner-required.test.ts` | `npx vitest run test/conformance/identity/owner-required.test.ts` | Same. |

---

## §U — Utility module conformance (U3 Python / U4 TS surface — 29 assertions × 2 repos = 58 rows)

**Goal.** Ratify the per-language utility-module surfaces (`api/lib/crud/`
for fourier per U3; `api/src/lib/crud/` for value.js per U4) admitted as
the `utility` disposition under the 2026-05-19 DECISION.md amendment to
CRUD-CONTRACT §9. Every exported symbol of the utility surface gets a
unit-level conformance row, distinct from the endpoint-integration rows
of §1–§9.

**Completion.** All 58 rows below (29 assertions × 2 repos) must PASS by
B.W3 (fourier) / value.js-C.W2 (value.js); the §U closure rule mirrors
the §10 closure rule and is folded into the same close gate. §U is not
a separate gate.

These rows ratify the per-module **utility surfaces** introduced by U3 (`api/lib/crud/`) and U4 (`api/src/lib/crud/`). They are unit-tests against the utility modules themselves, distinct from the §1–§9 endpoint conformance rows above — a slug-collision-retry row in §2 exercises `POST /visualizations`; the corresponding `U-slugs-*` row exercises `generate_unique_slug()` in isolation. Each utility surface (slugs, cursors, errors, etag, idempotency, soft-delete, cron-prune, slug-words init) gets dedicated rows. Source spec: `coordination/CRUD-LIB-PY.md` (U3) and `coordination/CRUD-LIB-TS.md` (U4); slug-word disposition in `coordination/SLUG-WORDS.md` (U2). Close-rule: every row PASS in both columns by B.W3 / value.js-C.W2 (mirrors §10).

### §U.1 — Slug generator + word-list init (7 assertions × 2 repos = 14 rows)

| Assertion ID | Contract Section | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| U-slugs-1 | §2, U3/U4 §slugs | `generate_slug()` produces strings matching `^[a-z]+(-[a-z]+){3}$` over 10,000 calls (unit-level; isolated from DB). | fourier | `test_generate_slug_pattern` | `uv run pytest api/tests/lib/crud/test_slugs.py::test_generate_slug_pattern -v` | exit 0; 1 test passed; `assert all(SLUG_RE.match(s) for s in (generate_slug() for _ in range(10000)))`. |
| U-slugs-1 | §2, U3/U4 §slugs | Same on value.js `generateSlug()`. | value.js | `test_generate_slug_pattern` | `npx vitest run api/test/crud/slugs.test.ts -t test_generate_slug_pattern` | exit 0; 1 test passed; `expect(Array.from({length:10000},generateSlug).every(s=>SLUG_RE.test(s))).toBe(true)`. |
| U-slugs-2 | §2, U3/U4 §slugs | `generate_unique_slug(coll)` retries on `DuplicateKeyError` (E11000) and succeeds on a fresh slug. | fourier | `test_slug_with_retry_on_collision` | `uv run pytest api/tests/lib/crud/test_slugs.py::test_slug_with_retry_on_collision -v` | Fixture: pre-populated 10 existing slugs in test collection; monkeypatch `secrets.choice` to emit a known-existing slug once then a fresh slug. Generator returns slug not in fixture; emits `slug-retry attempt=2` warning. |
| U-slugs-2 | §2, U3/U4 §slugs | Same on value.js `generateUniqueSlug(coll)` with `MongoServerError code=11000`. | value.js | `test_slug_with_retry_on_collision` | `npx vitest run api/test/crud/slugs.test.ts -t test_slug_with_retry_on_collision` | Fixture: 10 pre-seeded slugs; mock RNG to emit collision then fresh. Returns fresh slug; logs `slug-retry attempt=2`. |
| U-slugs-3 | §2, U3/U4 §slugs | After 10 consecutive collisions, `generate_unique_slug` raises `SlugExhausted` mapped to 503 `urn:contract:slug-exhausted`. | fourier | `test_slug_with_retry_503_on_exhaust` | `uv run pytest api/tests/lib/crud/test_slugs.py::test_slug_with_retry_503_on_exhaust -v` | Monkeypatch RNG to always emit a pre-seeded slug; call raises `SlugExhausted`; FastAPI handler maps to 503 + `{"type":"urn:contract:slug-exhausted","status":503}`. |
| U-slugs-3 | §2, U3/U4 §slugs | Same on value.js. | value.js | `test_slug_with_retry_503_on_exhaust` | `npx vitest run api/test/crud/slugs.test.ts -t test_slug_with_retry_503_on_exhaust` | Same; throws `SlugExhaustedError`; Hono error handler emits 503 problem+json. |
| U-slugs-4 | §2, §9, U2 §SLUG-WORDS | `slug_words` module init-time validates word-list counts: every list (`ADJECTIVES`, `VERBS`, `COLORS`, `ANIMALS`) has length ≥ 64 and ≤ 1024. | fourier | `test_slug_words_init_validates_counts` | `uv run pytest api/tests/lib/crud/test_slug_words.py::test_slug_words_init_validates_counts -v` | `import slug_words; assert 64 <= len(slug_words.ADJECTIVES) <= 1024` for each list; counts logged at INFO once at import. |
| U-slugs-4 | §2, §9, U2 §SLUG-WORDS | Same on value.js `slugWords.ts`. | value.js | `test_slug_words_init_validates_counts` | `npx vitest run api/test/crud/slug-words.test.ts -t test_slug_words_init_validates_counts` | `import {ADJECTIVES,...} from '...'; expect(ADJECTIVES.length).toBeGreaterThanOrEqual(64); ...toBeLessThanOrEqual(1024)`. |
| U-slugs-5 | §2, §9, U2 §SLUG-WORDS | `slug_words` init rejects any word violating `^[a-z]+$`; load raises at import time, halts process. | fourier | `test_slug_words_init_rejects_pattern_violation` | `uv run pytest api/tests/lib/crud/test_slug_words.py::test_slug_words_init_rejects_pattern_violation -v` | Fixture: monkeypatch loader to inject `"Bad-Word"` into adjective list; reimport raises `SlugWordsInvalid` with message naming the offending word; uvicorn boot would exit 1. |
| U-slugs-5 | §2, §9, U2 §SLUG-WORDS | Same on value.js. | value.js | `test_slug_words_init_rejects_pattern_violation` | `npx vitest run api/test/crud/slug-words.test.ts -t test_slug_words_init_rejects_pattern_violation` | Mocked loader emits `"Bad-Word"`; module init throws `SlugWordsInvalidError`; node boot exits 1. |
| U-slugs-6 | §9, U2 §SLUG-WORDS | `slug_words` loader returns an **immutable view** — mutating the returned list does not mutate the module's canonical list. | fourier | `test_slug_words_loader_returns_immutable_view` | `uv run pytest api/tests/lib/crud/test_slug_words.py::test_slug_words_loader_returns_immutable_view -v` | `lst = get_adjectives(); with pytest.raises(TypeError): lst.append("x")`; or `lst[0] = "x"` raises (returned as `tuple` or `MappingProxyType`). |
| U-slugs-6 | §9, U2 §SLUG-WORDS | Same on value.js — returned `readonly` array; mutation guarded by `Object.freeze`. | value.js | `test_slug_words_loader_returns_immutable_view` | `npx vitest run api/test/crud/slug-words.test.ts -t test_slug_words_loader_returns_immutable_view` | `expect(Object.isFrozen(getAdjectives())).toBe(true); expect(() => getAdjectives().push('x')).toThrow(TypeError)`. |
| U-slugs-7 | §2, U3/U4 §slugs | `generate_unique_slug` source contains **no** `find_one({slug}) && insert` adjacency — collision is detected purely via `DuplicateKeyError`. | fourier | `test_slugs_no_check_then_insert` | `uv run pytest api/tests/lib/crud/test_slugs.py::test_slugs_no_check_then_insert -v` | subprocess `scripts/conformance/grep-no-check-then-insert.sh api/lib/crud/slugs.py` exits 0; stdout `OK: 0 matches`. |
| U-slugs-7 | §2, U3/U4 §slugs | Same on value.js `lib/crud/slugs.ts`. | value.js | `test_slugs_no_check_then_insert` | `npx vitest run api/test/crud/slugs.test.ts -t test_slugs_no_check_then_insert` | subprocess `scripts/conformance/grep-no-check-then-insert.sh api/src/lib/crud/slugs.ts` exits 0. |

### §U.2 — Cursor encode/decode (4 assertions × 2 repos = 8 rows)

| Assertion ID | Contract Section | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| U-cursors-1 | SCHEMA §1, U3/U4 §cursors | `encode_cursor(payload)` then `decode_cursor(s)` returns a payload byte-identical to the input across 100 random payloads. | fourier | `test_cursor_roundtrip_preserves_payload` | `uv run pytest api/tests/lib/crud/test_cursors.py::test_cursor_roundtrip_preserves_payload -v` | `for _ in range(100): p = random_payload(); assert decode_cursor(encode_cursor(p)) == p`. exit 0; 1 test passed. |
| U-cursors-1 | SCHEMA §1, U3/U4 §cursors | Same on value.js. | value.js | `test_cursor_roundtrip_preserves_payload` | `npx vitest run api/test/crud/cursors.test.ts -t test_cursor_roundtrip_preserves_payload` | `expect(decodeCursor(encodeCursor(p))).toEqual(p)` over 100 random payloads. |
| U-cursors-2 | SCHEMA §1, §6, U3/U4 §cursors | `decode_cursor(s)` returns `None` (not raises) on invalid input: bad base64, bad JSON, missing required field, wrong schema. | fourier | `test_decode_cursor_invalid_returns_null` | `uv run pytest api/tests/lib/crud/test_cursors.py::test_decode_cursor_invalid_returns_null -v` | 4 sub-cases (`"!!!"`, valid b64 of `{}` (missing fields), valid b64 of `{"id":1,"sort_key":"x","sort_value":"y","extra":"foo"}` (unknown field), `""`). All return `None`. |
| U-cursors-2 | SCHEMA §1, §6, U3/U4 §cursors | Same on value.js — `decodeCursor` returns `null` (not throws). | value.js | `test_decode_cursor_invalid_returns_null` | `npx vitest run api/test/crud/cursors.test.ts -t test_decode_cursor_invalid_returns_null` | All 4 sub-cases → `expect(decodeCursor(s)).toBeNull()`. |
| U-cursors-3 | SCHEMA §1, U3/U4 §cursors | Tampered HMAC (modify one byte of payload after encoding) → `decode_cursor` returns `None`. | fourier | `test_decode_cursor_tampered_returns_null` | `uv run pytest api/tests/lib/crud/test_cursors.py::test_decode_cursor_tampered_returns_null -v` | `c = encode_cursor(p); c2 = c[:10] + ('A' if c[10] != 'A' else 'B') + c[11:]; assert decode_cursor(c2) is None`. |
| U-cursors-3 | SCHEMA §1, U3/U4 §cursors | Same on value.js. | value.js | `test_decode_cursor_tampered_returns_null` | `npx vitest run api/test/crud/cursors.test.ts -t test_decode_cursor_tampered_returns_null` | Same; `expect(decodeCursor(tampered)).toBeNull()`. |
| U-cursors-4 | SCHEMA §1, U3/U4 §cursors | `encode_cursor(p)` output is base64url alphabet only (`[A-Za-z0-9_-]+`), contains no padding `=`, and does not include plaintext field names from `p`. | fourier | `test_encode_cursor_opaque_no_plaintext_leak` | `uv run pytest api/tests/lib/crud/test_cursors.py::test_encode_cursor_opaque_no_plaintext_leak -v` | `c = encode_cursor({"id":"alpha-bravo-charlie-delta","sort_key":"newest","sort_value":"2026-05-19"}); assert re.fullmatch(r"[A-Za-z0-9_-]+", c); assert "alpha" not in c; assert "newest" not in c`. |
| U-cursors-4 | SCHEMA §1, U3/U4 §cursors | Same on value.js. | value.js | `test_encode_cursor_opaque_no_plaintext_leak` | `npx vitest run api/test/crud/cursors.test.ts -t test_encode_cursor_opaque_no_plaintext_leak` | `expect(c).toMatch(/^[A-Za-z0-9_-]+$/); expect(c).not.toContain("alpha"); expect(c).not.toContain("newest")`. |

### §U.3 — Problem+json envelope (3 assertions × 2 repos = 6 rows)

| Assertion ID | Contract Section | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| U-errors-1 | SCHEMA §1, §5, U3/U4 §errors | `problem(type, status, title, detail)` returns a JSONResponse with `Content-Type: application/problem+json` and a body that schema-validates as `Problem`. | fourier | `test_problem_envelope_is_application_problem_json` | `uv run pytest api/tests/lib/crud/test_errors.py::test_problem_envelope_is_application_problem_json -v` | `r = problem("urn:contract:not-found", 404, "Not found", "..."); assert r.headers["content-type"] == "application/problem+json"; assert Problem.model_validate(json.loads(r.body))`. |
| U-errors-1 | SCHEMA §1, §5, U3/U4 §errors | Same on value.js — `problem()` returns a `Response` with same Content-Type. | value.js | `test_problem_envelope_is_application_problem_json` | `npx vitest run api/test/crud/errors.test.ts -t test_problem_envelope_is_application_problem_json` | `expect(r.headers.get("content-type")).toBe("application/problem+json"); expect(ProblemSchema.parse(await r.json())).toBeTruthy()`. |
| U-errors-2 | SCHEMA §1, §5 | `problem()` rejects a `type` not in the catalogued set; raises `ValueError("unknown problem type")` at construction. | fourier | `test_problem_rejects_uncatalogued_type` | `uv run pytest api/tests/lib/crud/test_errors.py::test_problem_rejects_uncatalogued_type -v` | `with pytest.raises(ValueError, match="unknown problem type"): problem("urn:contract:made-up", 400, "x", "y")`. |
| U-errors-2 | SCHEMA §1, §5 | Same on value.js. | value.js | `test_problem_rejects_uncatalogued_type` | `npx vitest run api/test/crud/errors.test.ts -t test_problem_rejects_uncatalogued_type` | `expect(() => problem("urn:contract:made-up", 400, "x", "y")).toThrow(/unknown problem type/)`. |
| U-errors-3 | SCHEMA §5, U3/U4 §errors | All emitted `type` URIs are in `urn:contract:<kebab-name>` form (no `https://`, no `about:blank`, no bare identifiers). | fourier | `test_problem_type_uri_namespace_only_urn_contract` | `uv run pytest api/tests/lib/crud/test_errors.py::test_problem_type_uri_namespace_only_urn_contract -v` | For each entry in `PROBLEM_CATALOG.keys()`: `assert k.startswith("urn:contract:") and re.fullmatch(r"urn:contract:[a-z]+(-[a-z]+)*", k)`. |
| U-errors-3 | SCHEMA §5, U3/U4 §errors | Same on value.js. | value.js | `test_problem_type_uri_namespace_only_urn_contract` | `npx vitest run api/test/crud/errors.test.ts -t test_problem_type_uri_namespace_only_urn_contract` | `for (const k of Object.keys(PROBLEM_CATALOG)) expect(k).toMatch(/^urn:contract:[a-z]+(-[a-z]+)*$/)`. |

### §U.4 — ETag compute + If-Match enforcement (5 assertions × 2 repos = 10 rows)

| Assertion ID | Contract Section | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| U-etag-1 | SCHEMA §1, U3/U4 §etag | `compute_etag(doc)` returns a value that **changes** when any mutable field (`visibility`, `title`, `updated_at`, etc.) changes. | fourier | `test_etag_changes_on_mutable_field_change` | `uv run pytest api/tests/lib/crud/test_etag.py::test_etag_changes_on_mutable_field_change -v` | `a = compute_etag({"slug":"a-b-c-d","visibility":"draft","updated_at":t1}); b = compute_etag({"slug":"a-b-c-d","visibility":"public","updated_at":t1}); assert a != b`. |
| U-etag-1 | SCHEMA §1, U3/U4 §etag | Same on value.js. | value.js | `test_etag_changes_on_mutable_field_change` | `npx vitest run api/test/crud/etag.test.ts -t test_etag_changes_on_mutable_field_change` | `expect(computeEtag(a)).not.toEqual(computeEtag(b))`. |
| U-etag-2 | SCHEMA §1, U3/U4 §etag | `compute_etag(doc)` is **stable** when an immutable / non-etag-relevant field (e.g. `last_accessed_at`, `view_count`) changes. | fourier | `test_etag_stable_on_immutable_field_change` | `uv run pytest api/tests/lib/crud/test_etag.py::test_etag_stable_on_immutable_field_change -v` | `a = compute_etag({"slug":"a-b-c-d","visibility":"draft","updated_at":t1,"view_count":0}); b = compute_etag({...,"view_count":1}); assert a == b`. |
| U-etag-2 | SCHEMA §1, U3/U4 §etag | Same on value.js. | value.js | `test_etag_stable_on_immutable_field_change` | `npx vitest run api/test/crud/etag.test.ts -t test_etag_stable_on_immutable_field_change` | `expect(computeEtag(a)).toEqual(computeEtag(b))`. |
| U-etag-3 | SCHEMA §1, U3/U4 §etag | `compute_etag` is deterministic — same canonical input → same output across 1000 calls; output matches `^"[0-9a-f]{64}"$` (quoted sha256 hex per RFC 7232). | fourier | `test_etag_deterministic_sha256_hex_format` | `uv run pytest api/tests/lib/crud/test_etag.py::test_etag_deterministic_sha256_hex_format -v` | `e = compute_etag(doc); assert all(compute_etag(doc) == e for _ in range(1000)); assert re.fullmatch(r'"[0-9a-f]{64}"', e)`. |
| U-etag-3 | SCHEMA §1, U3/U4 §etag | Same on value.js. | value.js | `test_etag_deterministic_sha256_hex_format` | `npx vitest run api/test/crud/etag.test.ts -t test_etag_deterministic_sha256_hex_format` | `expect(computeEtag(doc)).toMatch(/^"[0-9a-f]{64}"$/)`; 1000 iterations all equal. |
| U-etag-4 | SCHEMA §1, U3/U4 §etag | `require_if_match(headers, etag)` raises 428 `urn:contract:precondition-required` when `If-Match` header is absent (mutating method). | fourier | `test_require_if_match_428_missing` | `uv run pytest api/tests/lib/crud/test_etag.py::test_require_if_match_428_missing -v` | `with pytest.raises(HTTPException) as e: require_if_match({}, current_etag); assert e.value.status_code == 428; assert e.value.detail["type"] == "urn:contract:precondition-required"`. |
| U-etag-4 | SCHEMA §1, U3/U4 §etag | Same on value.js. | value.js | `test_require_if_match_428_missing` | `npx vitest run api/test/crud/etag.test.ts -t test_require_if_match_428_missing` | `expect(() => requireIfMatch(new Headers(), etag)).toThrow(); /* HTTPError 428 urn:contract:precondition-required */`. |
| U-etag-5 | SCHEMA §1, U3/U4 §etag | `require_if_match` raises 412 `urn:contract:etag-mismatch` when `If-Match` is present but does not equal current ETag. | fourier | `test_require_if_match_412_mismatch` | `uv run pytest api/tests/lib/crud/test_etag.py::test_require_if_match_412_mismatch -v` | `headers={"if-match":'"deadbeef..."'}; with pytest.raises(HTTPException) as e: require_if_match(headers, '"cafef00d..."'); assert e.value.status_code == 412`. |
| U-etag-5 | SCHEMA §1, U3/U4 §etag | Same on value.js. | value.js | `test_require_if_match_412_mismatch` | `npx vitest run api/test/crud/etag.test.ts -t test_require_if_match_412_mismatch` | `expect(() => requireIfMatch(headers, currentEtag)).toThrow(); /* status 412 */`. |

### §U.5 — Idempotency-Key store + replay (3 assertions × 2 repos = 6 rows)

| Assertion ID | Contract Section | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| U-idem-1 | SCHEMA §1, U3/U4 §idem | `idempotent_replay(key, body_hash)` for a previously-seen `(key, body_hash)` returns the **stored** response verbatim (same status, body, headers minus date/etag refresh). | fourier | `test_idempotent_replay_returns_stored` | `uv run pytest api/tests/lib/crud/test_idempotency.py::test_idempotent_replay_returns_stored -v` | Pre-seed `idempotency_keys` with key=`K`, body_hash=`H`, response={status:201, body:{slug:"a-b-c-d"}}. Call `idempotent_replay("K","H")` → returns `(201, {"slug":"a-b-c-d"})`; no new write to `visualizations`. |
| U-idem-1 | SCHEMA §1, U3/U4 §idem | Same on value.js. | value.js | `test_idempotent_replay_returns_stored` | `npx vitest run api/test/crud/idempotency.test.ts -t test_idempotent_replay_returns_stored` | Pre-seed `idempotency_keys`; `await idempotentReplay("K","H")` returns stored response; no new palette inserted. |
| U-idem-2 | SCHEMA §1, U3/U4 §idem | Same key, different body_hash → raises 409 `urn:contract:idempotency-replay-conflict`. | fourier | `test_idempotent_409_on_key_collision_different_hash` | `uv run pytest api/tests/lib/crud/test_idempotency.py::test_idempotent_409_on_key_collision_different_hash -v` | Pre-seed key=`K`, hash=`H1`; call `idempotent_replay("K","H2")` raises HTTPException 409 with `type="urn:contract:idempotency-replay-conflict"`. |
| U-idem-2 | SCHEMA §1, U3/U4 §idem | Same on value.js. | value.js | `test_idempotent_409_on_key_collision_different_hash` | `npx vitest run api/test/crud/idempotency.test.ts -t test_idempotent_409_on_key_collision_different_hash` | `await expect(idempotentReplay("K","H2")).rejects.toThrow(/idempotency-replay-conflict/)`. |
| U-idem-3 | SCHEMA §1, U3/U4 §idem | Idempotency-Key TTL is 24h — a key whose `stored_at = now - 25h` is treated as absent; new POST with same key + new body succeeds (200/201, not 409). | fourier | `test_idempotent_key_ttl_24h_stale_key_passes` | `uv run pytest api/tests/lib/crud/test_idempotency.py::test_idempotent_key_ttl_24h_stale_key_passes -v` | Freeze time; pre-seed key with `stored_at = now - timedelta(hours=25)`; `idempotent_replay("K","H_NEW")` returns `None` (cache miss); caller proceeds with create. |
| U-idem-3 | SCHEMA §1, U3/U4 §idem | Same on value.js. | value.js | `test_idempotent_key_ttl_24h_stale_key_passes` | `npx vitest run api/test/crud/idempotency.test.ts -t test_idempotent_key_ttl_24h_stale_key_passes` | Pre-seed stale key; `await idempotentReplay("K","H_NEW")` returns `null`. |

### §U.6 — Soft-delete query filter (3 assertions × 2 repos = 6 rows)

| Assertion ID | Contract Section | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| U-soft-1 | §5, U3/U4 §soft-delete | `soft_delete(coll, slug)` sets `deleted_at = <now>` and `deleted_by = <session.user_slug>`; does **not** remove the document. | fourier | `test_soft_delete_sets_deleted_at` | `uv run pytest api/tests/lib/crud/test_soft_delete.py::test_soft_delete_sets_deleted_at -v` | Insert `{slug:"a-b-c-d"}`; call `soft_delete(coll, "a-b-c-d", user="u-1")`; `db.viz.find_one({slug:"a-b-c-d"})` has `deleted_at` ≈ now (within 5s) and `deleted_by == "u-1"`; document still exists. |
| U-soft-1 | §5, U3/U4 §soft-delete | Same on value.js. | value.js | `test_soft_delete_sets_deleted_at` | `npx vitest run api/test/crud/soft-delete.test.ts -t test_soft_delete_sets_deleted_at` | After `softDelete(coll, slug, "u-1")`: `findOne({slug})` has `deletedAt` ≈ now; doc not removed. |
| U-soft-2 | §5, U3/U4 §soft-delete | `not_deleted_filter()` returns a query predicate `{deleted_at: null}` (or equivalent); applied to a collection seeded with 1 live + 1 soft-deleted row, returns only the live row. | fourier | `test_not_deleted_filter_excludes_soft_deleted` | `uv run pytest api/tests/lib/crud/test_soft_delete.py::test_not_deleted_filter_excludes_soft_deleted -v` | Seed `{slug:"live", deleted_at:None}` + `{slug:"gone", deleted_at:now}`; `list(coll.find(not_deleted_filter()))` has length 1, slug=`live`. |
| U-soft-2 | §5, U3/U4 §soft-delete | Same on value.js. | value.js | `test_not_deleted_filter_excludes_soft_deleted` | `npx vitest run api/test/crud/soft-delete.test.ts -t test_not_deleted_filter_excludes_soft_deleted` | `await coll.find(notDeletedFilter()).toArray()` length 1, slug=`live`. |
| U-soft-3 | §5, U3/U4 §soft-delete | `include_deleted_filter()` returns `{}` (no constraint on `deleted_at`); seeded with both rows, returns both. | fourier | `test_include_deleted_filter_returns_all` | `uv run pytest api/tests/lib/crud/test_soft_delete.py::test_include_deleted_filter_returns_all -v` | Same seed as U-soft-2; `list(coll.find(include_deleted_filter()))` has length 2; slugs `{"live","gone"}`. |
| U-soft-3 | §5, U3/U4 §soft-delete | Same on value.js. | value.js | `test_include_deleted_filter_returns_all` | `npx vitest run api/test/crud/soft-delete.test.ts -t test_include_deleted_filter_returns_all` | Length 2; slug set `{"live","gone"}`. |

### §U.7 — Cron prune bounded query (3 assertions × 2 repos = 6 rows)

| Assertion ID | Contract Section | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| U-cron-1 | §8, U3/U4 §cron | `build_prune_query(cutoff)` produces a query whose `explain()` plan reports `nReturned ≤ 10000` and uses index `deleted_at_1` (bounded). | fourier | `test_cron_prune_query_is_bounded` | `uv run pytest api/tests/lib/crud/test_cron.py::test_cron_prune_query_is_bounded -v` | Seed 12k rows (1k expired, 11k live); `q = build_prune_query(cutoff); plan = coll.find(q).explain(); assert plan["executionStats"]["nReturned"] == 1000; assert plan["queryPlanner"]["winningPlan"]["inputStage"]["indexName"] == "deleted_at_1"`. |
| U-cron-1 | §8, U3/U4 §cron | Same on value.js. | value.js | `test_cron_prune_query_is_bounded` | `npx vitest run api/test/crud/cron.test.ts -t test_cron_prune_query_is_bounded` | Same; `expect(plan.queryPlanner.winningPlan.inputStage.indexName).toBe("deleted_at_1")`. |
| U-cron-2 | §8, U3/U4 §cron | `build_prune_query` source contains no `$nin` operator; assertion is a recursive AST walk of the returned query dict (not a textual grep). | fourier | `test_cron_prune_no_nin_operator` | `uv run pytest api/tests/lib/crud/test_cron.py::test_cron_prune_no_nin_operator -v` | `q = build_prune_query(cutoff); assert _walk_no_nin(q)`. Helper `_walk_no_nin` recurses through dict/list and asserts no key equals `"$nin"`. Exit 0; 1 test passed. |
| U-cron-2 | §8, U3/U4 §cron | Same on value.js. | value.js | `test_cron_prune_no_nin_operator` | `npx vitest run api/test/crud/cron.test.ts -t test_cron_prune_no_nin_operator` | `expect(walkNoNin(buildPruneQuery(cutoff))).toBe(true)`. |
| U-cron-3 | §8, U3/U4 §cron | `prune_expired(coll, cutoff)` performs at most one `deleteMany` per invocation and the query equals `build_prune_query(cutoff)` byte-for-byte (factoring through a single predicate builder). | fourier | `test_cron_prune_uses_single_predicate_builder` | `uv run pytest api/tests/lib/crud/test_cron.py::test_cron_prune_uses_single_predicate_builder -v` | Spy on `coll.delete_many`; call `prune_expired(coll, cutoff)`; assert `coll.delete_many.call_count == 1` and `coll.delete_many.call_args.args[0] == build_prune_query(cutoff)`. |
| U-cron-3 | §8, U3/U4 §cron | Same on value.js. | value.js | `test_cron_prune_uses_single_predicate_builder` | `npx vitest run api/test/crud/cron.test.ts -t test_cron_prune_uses_single_predicate_builder` | `expect(spy).toHaveBeenCalledTimes(1); expect(spy.mock.calls[0][0]).toEqual(buildPruneQuery(cutoff))`. |

### §U.8 — Module surface untestability disclosure (1 assertion × 2 repos = 2 rows)

| Assertion ID | Contract Section | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| U-meta-1 | U3/U4 §close | The utility module's public surface (exports from `api/lib/crud/__init__.py` resp. `api/src/lib/crud/index.ts`) matches the surface enumerated in the U3 / U4 spec — every exported symbol has at least one §U row. | fourier | `test_utility_surface_complete_coverage` | `uv run pytest api/tests/lib/crud/test_surface.py::test_utility_surface_complete_coverage -v` | `from api.lib import crud; assert set(crud.__all__) == EXPECTED_SURFACE`; further, each symbol appears in at least one assertion-id from the §U rows above (cross-referenced via `docs/tranches/B/coordination/CONFORMANCE-MATRIX.md`). |
| U-meta-1 | U3/U4 §close | Same on value.js — `api/src/lib/crud/index.ts` exports match U4 spec. | value.js | `test_utility_surface_complete_coverage` | `npx vitest run api/test/crud/surface.test.ts -t test_utility_surface_complete_coverage` | `import * as crud from '../../src/lib/crud'; expect(new Set(Object.keys(crud))).toEqual(EXPECTED_SURFACE)`; each symbol cross-referenced to a §U row. |

---

## Aggregate row count (176 rows)

| Section | Assertions | Rows (× 2 repos) |
|---|---|---|
| §1 Identity | 3 | 6 |
| §2 Slug algorithm | 4 | 8 |
| §3 Ownership | 4 | 8 |
| §4 Visibility (core) | 4 | 8 |
| §4 Visibility (transitions) | 3 | 6 |
| §5 Soft-delete (core) | 4 | 8 |
| §5 Soft-delete (grace boundary) | 1 | 2 |
| §6 Sessions | 4 | 8 |
| §7 Admin (core) | 5 | 10 |
| §7 Admin (batch return) | 1 | 2 |
| §8 Cron (core) | 4 | 8 |
| §8 Cron (pinned flag) | 1 | 2 |
| §9 Shared-vs-code | 3 | 6 |
| §11 Migration | 3 | 6 |
| **CRUD-CONTRACT subtotal** | **44 assertions** | **88 rows** |
| §S1 Cursor pagination | 3 | 6 |
| §S2 ETag concurrency | 2 | 4 |
| §S3 Idempotency-Key | 2 | 4 |
| §S4 Rate-limit headers | 2 | 4 |
| §S5 Problem+json envelope | 2 | 4 |
| §S6 URL shape / Link | 2 | 4 |
| §S7 CRUD identity-stability | 2 | 4 |
| **SCHEMA-derived subtotal** | **15 assertions** | **30 rows** |
| §U.1 Slug generator + word-list init | 7 | 14 |
| §U.2 Cursor encode/decode | 4 | 8 |
| §U.3 Problem+json envelope | 3 | 6 |
| §U.4 ETag compute + If-Match | 5 | 10 |
| §U.5 Idempotency-Key store + replay | 3 | 6 |
| §U.6 Soft-delete query filter | 3 | 6 |
| §U.7 Cron prune bounded query | 3 | 6 |
| §U.8 Module surface coverage | 1 | 2 |
| **Utility-module subtotal** | **29 assertions** | **58 rows** |
| **Grand total** | **88 assertions** | **176 rows** |

---

## §F — Fourier-side coherence rows (Invariants 18–20, added 2026-05-26 — Wave-1 audit synthesis)

The rows below bind the fourier-specific invariants codified at B.md §2 invariants 18–20 from the Wave-1 audit synthesis. They are **fourier-only** (no value.js column — the value.js side is governed by value.js's own tranche invariants). The §F rows close at B.W2 (UI surface conventions + auto-recompute test wiring) and B.W3 (the entity-side auto-recompute seam binding) and B.W4.d (the axe-core harness binding).

| Assertion ID | Invariant | Assertion | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|
| F18.1 | Inv 18 | `ExportModal.vue` and all modal surfaces carry `role="dialog"` + `aria-modal="true"` + Esc handler + focus trap. | `e2e/visualization-ux.spec.ts::export_modal_a11y_contract` | `npx playwright test e2e/visualization-ux.spec.ts -g 'export_modal'` | Dialog opens on trigger; tab cycle stays within Dialog; Esc closes; focus returns to trigger. axe-core reports zero serious / critical violations on the open state. |
| F18.2 | Inv 18 | No literal `z-[N]` in dock / overlay / modal surfaces — z-index routes through the `--z-*` token ladder. | grep assertion `scripts/conformance/grep-no-zindex-literal.sh` | `bash scripts/conformance/grep-no-zindex-literal.sh` | `git grep -nE 'z-\\[[0-9]+\\]' web/src/components/visualization/` returns zero. |
| F18.3 | Inv 18 | Dock-shaped surfaces follow the naming convention — `*Dock.vue` for floating; `*Panel.vue` for in-flow; `*Modal.vue` for blocking. | grep assertion `scripts/conformance/grep-dock-naming.sh` | `bash scripts/conformance/grep-dock-naming.sh` | Every `web/src/components/visualization/*Dock.vue` consumes `GlassDock`; every `*Panel.vue` is in-flow; every `*Modal.vue` is `Teleport`-mounted. |
| F19.1 | Inv 19 | After `workspace.saveContourPoints` mutates `store.contour`, the auto-compute fires within one rAF frame (no perturbation of a control required). | `e2e/visualization-ux.spec.ts::save_contour_then_recompute` | `npx playwright test e2e/visualization-ux.spec.ts -g 'save_contour'` | Edit a contour point → click Save → canvas re-renders within 100 ms (well above one rAF frame); no manual setting touch required. |
| F19.2 | Inv 19 | The `levels` derivation lives in `ComputeBasesRequest` Pydantic model (single seam); `web/src/stores/workspace.ts:runComputeBases` consumes the model, not the inline `Array.from({length: min(N,50)}, …)` construction. | `api/tests/test_compute_request.py::test_levels_derivation_in_model` + grep | `uv run pytest api/tests/test_compute_request.py -v` + `git grep -E 'Array\\.from.*length.*min.*50' web/src/stores/workspace.ts` | Pydantic test asserts the model's levels derivation matches `min(n_harmonics, 50)`; grep returns zero. |
| F20.1 | Inv 20 | `useViewTransform` does not call `Math.min(...xs)` or `Math.max(...xs)` per rAF frame; the bbox is memoized on `epicycleData` / `basesData` identity. | grep assertion `scripts/conformance/grep-no-perframe-spread.sh` + benchmark | `bash scripts/conformance/grep-no-perframe-spread.sh` + `npx playwright test e2e/perf.spec.ts -g 'view_transform_budget'` | grep over `useViewTransform.ts` finds the `Math.min/max` call only inside a `computed` block keyed on path identity; benchmark asserts < 0.5 ms per frame at n=10 000. |
| F-partial-sums | Inv 19 / SCHEMA §3 AnimationData | `AnimationData.partial_sums` JSON round-trips through `BasisCanvas.vue`'s consumer as `Record<string, {x,y}>` — backend serialises stringified-int keys; frontend looks them up via typed bracket access (no `as any` cast). Added 2026-05-26 per Wave-2 audit C4 §6 #1 (b) / #3. | `e2e/visualization-ux.spec.ts::partial_sums_roundtrip` + `web/tests/basis-canvas.spec.ts::partial_sums_type_check` | `npx playwright test e2e/visualization-ux.spec.ts -g 'partial_sums'` + `cd web && npx vue-tsc -b --force` (the typed lookup eliminates `as any`; `vue-tsc` fails if the cast remains) | The Playwright spec exercises a multi-basis state, captures `epicycleData.bases[k].partial_sums`, asserts the JSON-emitted form has stringified-int keys and the consumer resolves them; `vue-tsc` confirms zero `as any` over `partial_sums` in `BasisCanvas.vue`. |

**§F subtotal:** 7 fourier-only assertions × 1 column = 7 rows (added F-partial-sums per Wave-2; aggregate grand total now 183).

## Aggregate (post-§F addition; Wave-2 amendment 2026-05-26)

- §1–§9 + §11 + §S* + §U — 88 cross-repo assertions × 2 = 176 rows; with the Wave-2 additions (CS5.3 slug-exhausted × 2 + CS5.4 Problem-class realisation × 1 fourier-only meta-row) the cross-repo subtotal grows to **180 rows** (90 cross-repo assertions × 2, minus 1 fourier-only meta).
- §F — 7 fourier-only assertions × 1 = **7 rows** (added F-partial-sums per Wave-2 C4 §6 #3).
- **Grand total**: **187 rows** (180 cross-repo + 7 fourier-side coherence). Wave-2 amendment 2026-05-26 added the +5 rows (CS5.3 × 2 + CS5.4 × 1 + F-partial-sums + RFC-4648 admission note bundled into CS6.1).

## Status legend

Each row carries a status that is updated at the close of B.W3 (fourier column) and value.js-C.W2 (value.js column):

- `TBD` — test file does not yet exist at the named path. Default at B.W1 close.
- `WIP` — test file exists; the test is failing or not yet asserted complete.
- `PASS` — test passes in CI; the conformance assertion is binding evidence.
- `WAIVED` — explicit, justified deviation; references a §12 change-log entry.

fourier-B.W1's gate: every row has a non-empty `Run command` cell. fourier-B.W3 close gate: every fourier row is `PASS`. value.js-C.W2 close gate: every value.js row is `PASS`. The cohort-level CRUD-CONTRACT.md ratifies on the moment all 176 cross-repo rows are `PASS` (88 fourier + 88 value.js) **and** the 6 §F fourier-side coherence rows are `PASS` (the §F rows added 2026-05-26 per the Wave-1 audit synthesis at `docs/audits/runs/2026-05-26-B-audit-wave-1/SYNTHESIS.md §4`). Under the orphan verdict the 88 value.js cross-repo cells hold at `DEFERRED` (the fifth status alongside `TBD`/`WIP`/`PASS`/`WAIVED` introduced by the R3 refinement assay §9); the §F rows have no value.js column and ratify on the fourier-only path.

## Source-grep scripts

Created at B.W3 in `scripts/conformance/`; mirrored at C.W2 in `~/Programming/value.js/api/scripts/conformance/`.

| Script | Used by | Behaviour |
|---|---|---|
| `grep-no-hash-in-url.sh` | C1.1 | Greps `web/src/`, `api/src/`, `demo/` for path/route patterns containing `[0-9a-f]{32,}`. Exits 0 iff zero matches. |
| `grep-no-check-then-insert.sh` | C2.3 | Greps `api/routers/` (fourier) / `api/src/routes/` (value.js) for `find_one.*slug.*generate_slug` or `findOne.*slug.*generateSlug` adjacency. Exits 0 iff zero matches. |
| `grep-no-unbounded-nin.sh <path>` | C5.4, C8.1 | Greps the given file for `$nin` over a list built from a non-bounded `distinct()`. Whitelists comments that mark the predicate as bounded. Exits 0 iff every `$nin` is annotated bounded. |
| `grep-no-shared-framework.sh` | C9.3 | Greps both repos for `shared_crud`, `shared-crud`, `crud-framework`, `codegen` imports; greps `docker-compose*.yml` and value.js `Caddyfile` for Redis / NATS / Kafka services. Exits 0 iff zero matches. |
| `grep-no-internal-id-in-url.sh` | CS6.2 | Greps router/route declarations for `ObjectId` or content-hash patterns in path arguments. Exits 0 iff zero matches. |

Each script is committed at B.W3 (fourier) / C.W2 (value.js) and is itself part of the conformance suite: a missing script is a failed row.
