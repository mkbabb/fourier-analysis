# C1 — fourier CRUD substrate audit (Wave 2)

*Agent C1 · Tranche B · Wave 2 · 2026-05-26 · HEAD `f8db2c6` · READ-ONLY*

## §0 — Goal + completion criterion

**Goal.** Capture the substrate-of-record against which B.W1's CRUD-CONTRACT ratification, B.W3's `visualization` migration, and B.W4's wiring may be validated; enumerate every collection, router, model, identifier, and lifecycle in fourier's present CRUD surface; score alignment against `docs/tranches/B/coordination/CRUD-CONTRACT.md`.

**Completion.** §1 enumerates the eight Mongo collections, eight routers, and the five identity schemes; §2 walks the seven nouns end-to-end; §3 lays the identity matrix; §4 lays the session/auth/admin shape; §5 scores §1–§9 of the contract; §6 ranks defects by B-wave destination; §7 names the W1 ratification actions.

## §1 — Substrate observed

**Mongo collections** (per `api/services/database.py:41–96`): `images`, `contours`, `snapshots`, `users`, `sessions`, `gallery`, `flags`, `admin_audit`. No `visualizations` collection exists; no `palette_versions`; no `deleted_at` field on any collection.

**Routers** (mounted in `api/main.py:96–102`):

- `images.py` — `POST /api/images`, `GET /by-hash/{sha}`, `GET /{slug}`, `/blob`, `/thumbnail`, `/overlay`, `POST /{slug}/extract-contour`.
- `contours.py` — `POST /api/contours`, `GET /{hash}`, two `/compute/*` subpaths.
- `snapshots.py` — `POST /api/images/{slug}/snapshots`, `GET /{slug}/snapshots/{hash}` (no list, no delete).
- `equations.py` — `/compute`, `/simplify` (stateless).
- `sessions.py` — `POST /api/sessions`, `/login`, `GET /me`, `DELETE /api/sessions`.
- `gallery.py` — `GET /cursor`, `GET /{hash}`, `POST`, `+view`/`+like`/`+flag`/`DELETE`/`PUT`.
- `admin.py` — `/verify`, `/stats`, `/gallery/{hash}/tier`, `DELETE /gallery/{hash}`, `/users` CRUD, `/users/prune-empty`, `/gallery/batch`, `/users/batch`, `/flagged`, `/flags/{hash}`, `/audit`.

**Pydantic models**: `api/models/{admin,assets,computation,equations,gallery,session,shared}.py`. No `Visualization` model yet (per `B.md §3`, B.W3 mints it).

## §2 — Per-noun lifecycle

| Noun | C | R | U | D | List | Owner | Janitor | Slug discipline |
|---|---|---|---|---|---|---|---|---|
| **image** | `POST /api/images` upsert by `sha256` (`image_storage.py:45`) | `GET /{slug}`/`/by-hash`/`/blob`/`/thumbnail`/`/overlay` | — (immutable; thumbnail re-gen) | janitor only | — | none | `pinned`-flag indexed delete (`janitor.py:66–77`) | TOCTOU check-then-insert `image_storage.py:75–77` |
| **contour** | `POST /api/contours` ∨ `extract-contour` upsert by `contour_hash` | `GET /{hash}` (+ lazy `image_bounds` backfill `dependencies.py:76–117`) | backfill only | janitor only | — | none | `pinned`-flag (`janitor.py:66–70`) | content hash; no slug |
| **snapshot** | `POST` upsert by deterministic `snapshot_hash` (`snapshots.py:38–47`) | `GET /{slug}/snapshots/{hash}` | — | — | — | none | indirectly pinned only | `_setOnInsert` idempotent; no slug |
| **gallery_entry** | `POST /api/gallery` (`gallery.py:155–200`) | `GET /cursor` + `GET /{hash}` | `PUT /{hash}` owner-bound | `DELETE /{hash}` owner ∨ admin | cursor pagination `gallery.py:77–142` | `user_slug` *nullable* — `gallery.py:162` allows `resolve_session` → `None` | cascade on user/image delete | identity *borrowed* from `snapshot_hash` (no own slug) |
| **user** | `POST /api/sessions` (`sessions.py:36–54`) | `GET /sessions/me` | touch `last_seen_at` | admin cascade `admin.py:283–319` | admin list `admin.py:171–255` | `user_max_age_days` cascade `janitor.py:131–172` | 4-word slug; **no retry on `DuplicateKeyError`** `sessions.py:47` |
| **session** | `POST /api/sessions` ∨ `/login` | `resolve_session` `dependencies.py:144–179` | touch `last_seen_at` | `DELETE /api/sessions` | — | bearer | `expires_at < now` `janitor.py:127` | UUIDv4 token |
| **flag** | `POST /gallery/{hash}/flag` (`gallery.py:295–324`) | admin `/flagged` | — | admin `/flags/{hash}` ∨ cascade | grouped aggregation | `reporter_slug` required | cascades with gallery/user delete | `(snapshot_hash, reporter_slug)` unique |
| **draft** *(frontend-only)* | `saveDraft` `web/src/lib/draftStorage.ts:22` | `loadDraft`/`listDrafts` | overwrite | `deleteDraft` | local IDB | none (browser-local) | n/a | keyed by `imageSlug` |

## §3 — Identity-scheme matrix (the five)

| # | Scheme | Locus | Surface |
|---|---|---|---|
| 1 | **Human slug** (`coolname.generate_slug(4)`) | `api/slugs.py:8–10`; pattern `^[a-zA-Z0-9][-a-zA-Z0-9]{2,80}$` `dependencies.py:27` | `image_slug`, `user_slug` (`_id`) |
| 2 | **Content hash** (SHA-256, ordered pairs post-W4.b) | `image_storage.py:165–178` (`compute_contour_hash`); `snapshots.py:47` | `contour_hash`, `snapshot_hash`, `images.sha256`, `extraction_cache_key` |
| 3 | **UUIDv4** | `sessions.py:27` (`str(uuid.uuid4())`) | `sessions._id` |
| 4 | **MongoDB ObjectId** | implicit `_id` on `gallery`, `flags`, `admin_audit`, `images`, `contours`, `snapshots` | cursor substrate `gallery.py:114`; never exposed in URL |
| 5 | **IndexedDB `imageSlug` key** | `draftStorage.ts:14` (`keyPath: "imageSlug"`) | client-only; never reaches server |

No newer divergence beyond the audit-E corpus: no `tier_id`, no `featured_at`, no `deleted_at`. `pinned: bool` (`janitor.py` post-W4.a) is a per-doc flag, not an identifier.

## §4 — Session + auth + admin shape

**Session.** `X-Session-Token: <uuid4>` header (`dependencies.py:147`); 7-day TTL (`settings.session_ttl_days`, `sessions.py:32`); `find_one_and_update` returns `ReturnDocument.AFTER` touching `last_seen_at`. Suspension is gated by an in-memory 60 s cache (`dependencies.py:24,162–172`) — single-replica constraint per invariant 12. Login is constant-delay 200 ms (`sessions.py:68,75`).

**User auth.** Anonymous-only registration; `user_slug` is the immutable PK; no password, no email. `login` accepts a slug and mints a fresh session.

**Admin auth.** `Authorization: Bearer $ADMIN_TOKEN`, `hmac.compare_digest` (`dependencies.py:200–208`). Unset token → 503 (`api/main.py:30–39`). Audit row written via `log_audit` (`admin.py:50–59`) keyed by `(timestamp, ip_hash, action, target)`; 90-day retention `janitor.py:175–178`.

**Batch endpoints** (`admin.py:362–451`) return `{ok, affected}` — **not** the contract's `{processed, errors[]}` shape.

## §5 — Divergence inventory + alignment score (vs CRUD-CONTRACT §1–§9)

| Section | Status | Reason |
|---|---|---|
| §1 Identity / single-slug | **DRIFT** | gallery URL is the 64-char `snapshot_hash`; no `visualization_slug` |
| §1 hash policy | **CONFORMS** (post-W4.b) | `compute_contour_hash` hashes ordered pairs (`image_storage.py:174`); the legacy `sorted(xs)` bug is retired |
| §2 slug shape | **DRIFT** | `^[a-zA-Z0-9][-a-zA-Z0-9]{2,80}$` admits non-4-word, mixed-case, and digit-leading slugs |
| §2 slug RNG | **DRIFT** | `coolname` uses CPython `random.choice` (Mersenne), not `secrets.choice` |
| §2 slug collisions | **DRIFT** | `image_storage.py:75–77` is check-then-insert TOCTOU; `sessions.py:47` has no retry |
| §3 ownership required | **DRIFT** | `gallery.py:162` accepts `resolve_session` → `None`; gallery rows can be inserted with `user_slug: null` (orphan path, audit-E §4 / B.md AMEND #1) |
| §4 visibility 3-state | **NOT-YET-IMPLEMENTED** | only admin `tier` exists (`featured|saved|normal`); no user-controlled `visibility` |
| §5 soft-delete | **NOT-YET-IMPLEMENTED** | every `DELETE` is hard; no `deleted_at`; no `/restore` |
| §6 sessions / TTL | **PARTIAL** | UUID + `X-Session-Token` ✓; TTL is 7 d, contract binds 30 d |
| §6 suspension cache | **CONFORMS** | 60 s monotonic cache (`dependencies.py:24`) |
| §7 admin actions | **CONFORMS** mostly; `feature` is an idempotent setter (`set_tier`) ✓ |
| §7 batch return shape | **DRIFT** | `{ok, affected}` vs contract's `{processed, errors[]}` and 207 partial |
| §7 audit log | **CONFORMS** | row-per-action, 90 d retention |
| §7 flag uniqueness | **CONFORMS** | `(snapshot_hash, reporter_slug)` unique (`database.py:88–90`) |
| §8 cron bounded queries | **CONFORMS** (post-W4.a) | `pinned: bool` indexed predicate; no `$nin` over snapshot scan |
| §8 storage-budget eviction | **KNOWN-VIOLATION** | `janitor.py:84–119` retained operationally; deferred to fourier-C |

**Drift count vs CRUD-CONTRACT: 7 DRIFT + 2 NOT-YET-IMPLEMENTED + 1 PARTIAL = 10 non-conforming clauses.**

## §6 — Defect ledger (severity-classified)

**HIGH (B.W1 ratify, B.W3 entity migration)**

1. *Orphan publish path* — `gallery.py:162` writes `user_slug: null` rows. Destination: **B.W3** (force `require_session`, migrate null rows).
2. *No `visualization` entity / no own slug* — gallery URL = sha256. Destination: **B.W3** mint `visualization_slug`, fold `snapshots` ∪ `gallery`.
3. *Slug pattern admits non-4-word* — `SLUG_PATTERN` (`dependencies.py:27`) is too loose. Destination: **B.W1** ratify `^[a-z]+(-[a-z]+){3}$`.
4. *Slug RNG not cryptographic* — `coolname` → CPython Mersenne. Destination: **B.W3** swap to `secrets.choice` + shared word lists per R3.

**MEDIUM (B.W4 wiring close)**

5. *Slug collision handling asymmetric* — `image_storage.py:75–77` TOCTOU; `sessions.py:47` no retry. Destination: **B.W4** `api/lib/crud/slug.py` insert-then-catch utility.
6. *Batch return shape* — admin returns `{ok, affected}` not contract's `{processed, errors[]}`. Destination: **B.W4** problem+json + 207 partial.
7. *Session TTL = 7 d* (contract: 30 d). Destination: **B.W4** bump `session_ttl_days`.
8. *No soft-delete / no visibility 3-state*. Destination: **B.W3** schema + lifecycle.
9. *Frontend `WorkspaceDraft.savedSnapshots: []` dead field* — `workspace.ts:83`. Destination: **B.W4** delete on `visualization` migration.

**LOW (residual, W5 close ∨ defer)**

10. *`count_documents` on offset gallery endpoint* — only cursor remains in use (`web/src/stores/gallery.ts:33`). Destination: **W5** retire offset endpoint.
11. *Dead `compute.py` tombstone* (audit-E §5). Destination: **W5**.
12. *`reject_dollar_keys` re-parses body* (`main.py:76–93`). Destination: **deferred**, scale-dependent.
13. *Image blobs inline in Mongo* (`storage_budget_gb` band-aid). Destination: **fourier-C** (orthogonal to B per contract §0 scope).

## §7 — Recommendations for B.W1 contract ratification

1. **Ratify §1 identity matrix as-is.** The three-row table is correct; fourier has all three already (slug, content hash, ObjectId). The §1 binding only requires no hash-in-URL.
2. **Tighten §2 slug pattern** to `^[a-z]+(-[a-z]+){3}$` in contract; fourier's `SLUG_PATTERN` migration is a W3 schema-validator update plus a one-shot rewrite of any non-conforming legacy slug.
3. **Pin §3 ownership** with a §10 row that grep-asserts zero `resolve_session` calls on entity-mutation endpoints lacking a paired `require_session` — the orphan path at `gallery.py:162` is the canonical regression case.
4. **Confirm §6 TTL = 30 d** binds fourier (today 7); the migration is a one-line config bump and a one-time `expires_at` extension on live sessions.
5. **§7 batch return shape** needs the matrix row to assert the `{processed, errors[]}` shape; fourier's `{ok, affected}` is the migration target. Pair with problem+json adoption (§S2 of `SCHEMA.md §1`).
6. **§8 cron** is already conforming post-W4.a; the §10 row should source-grep `janitor.py` for `$nin` and assert zero unbounded occurrences — that row passes today.
7. **Defer fourier-specific UI invariants 18–20** (per CRUD-CONTRACT §0 scope note) out of contract scope; carry them as fourier-side coherence rules in `B.md §2`.

— *end C1*
