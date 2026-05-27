# R1 — fourier CRUD surface, deeply (ground-truthed against HEAD)

**Lane**: B / Wα — research wave / R1.
**Mode**: read-only. Every claim below cites a live `file:line` verified against the working tree at the time of authoring (master, post-`926ca6a`). Where a downstream-spec anchor has drifted, the corrected line is recorded in §5.
**Method**: read all of `api/routers/*`, `api/services/*`, `api/models/*`, `api/{slugs,dependencies,main,config,responses}.py`, and `web/src/stores/{gallery,workspace,auth}.ts`, `web/src/lib/{api,draftStorage}.ts`. The `value.js` side is out of scope for this lane (R2 owns it); cross-repo claims in `R-identity-spec.md` are crosswalked in §6 only insofar as they touch fourier code.

A note before the tables: **the lane charter and `R-identity-spec.md` both name a `compute.py` router. It does not exist.** Compute endpoints live in `api/routers/contours.py` (`/api/contours/{hash}/compute/{epicycles,bases}`) and `api/routers/equations.py` (`/api/equations/{compute,simplify}`). There is no `api/routers/compute.py` (verified: `ls api/routers/` returns `admin, contours, equations, gallery, images, sessions, snapshots`). This is recorded as STALE in §5.

---

## §1 — Entity inventory

Eight persisted entities (seven server-side collections + one client-only store). The charter's seven nouns (image, contour, snapshot, gallery entry, session, draft, user) map to these; `flags` and `admin_audit` are additional server collections that the convergence must account for because the janitor and admin cascades touch them.

| Entity (collection) | Identity scheme | Slug? | Ownership | Delete semantics | Readers / writers | Janitor touch |
|---|---|---|---|---|---|---|
| **image** (`images`) | Human slug `image_slug` = `coolname.generate_slug(4)` (`api/slugs.py:8-10`, called `api/services/image_storage.py:74`); unique index (`api/services/database.py:42`). Content hash `sha256` of bytes, unique index (`database.py:43`). Mongo ObjectId `_id` (default). | Yes — `image_slug`, 4-word, server-generated | **None.** No `owner_slug`/`user_slug` field on the doc (`store_image_asset` doc, `image_storage.py:91-101`). Anonymous, shared by `sha256` dedup across all users. | **Hard delete only**, and only via the janitor (`janitor.py:72-77` time-based; `janitor.py:101-118` budget eviction). No user/admin delete route. `_delete_images_and_cascade` (`janitor.py:279-304`) cascades to `gallery`. | Readers: `get_image_meta`/`get_image_asset`/blob/thumbnail/overlay (`api/routers/images.py:117-200`); `extract-contour` (`images.py:203-256`); lazy `_backfill_image_bounds` (`dependencies.py:80`). Writers: `upload_image` → `store_image_asset` (`images.py:93-114`). | Sets `pinned` flag (`janitor.py:209`, repinned `265-273`); time-deletes unpinned (`janitor.py:72-77`); budget-evicts unpinned oldest (`janitor.py:101-118`); touches `last_accessed_at` on read (`dependencies.py:43`). |
| **contour** (`contours`) | Content hash `contour_hash` = `sha256(json.dumps({"pairs":[[x,y],…]},sort_keys=True))` (`image_storage.py:165-178,197`); unique index (`database.py:52`). Optional `extraction_cache_key` sparse index (`database.py:53`). Mongo ObjectId `_id`. | No slug. | **None** directly. Carries `image_slug` as a foreign key (`image_storage.py:209`), nullable in the response model (`api/models/assets.py:34`). Inherits image's owner-less posture. | **Hard delete only**, via janitor (`janitor.py:66-68`). No user/admin route. Not cascaded from image deletes (images cascade to gallery, not to contours — see §3). | Readers: `get_contour` (`dependencies.py:57-73`) used by snapshots create (`snapshots.py:35`), contour GET + both compute endpoints (`contours.py:31,38,49`); extraction cache hit (`images.py:211`). Writers: `store_contour_asset` upsert (`image_storage.py:224-228`) from `save_contour` (`contours.py:26`) and `extract_contour` (`images.py:252`). | Sets `pinned` (`janitor.py:208`, repinned `231-239`); time-deletes unpinned (`janitor.py:66-68`); touches `last_accessed_at` on read (`dependencies.py:68`) and on cache hit (`images.py:215`). |
| **snapshot** (`snapshots`) | Content hash `snapshot_hash` = `sha256(json.dumps({image_slug,contour_hash,contour_settings,animation_settings},sort_keys=True))` (`snapshots.py:38-47`); unique index `snapshot_hash` + compound `(image_slug,snapshot_hash)` (`database.py:60-61`). Mongo ObjectId `_id`. | No slug. **`snapshot_hash` leaks into user-facing gallery URLs** (see §3). | **None.** No owner field on the snapshot doc (`snapshots.py:50-57`). | **No delete path at all** — no user route, no admin route, **and the janitor never deletes snapshots** (verified: `janitor.py` only ever *reads* `snapshots` in the pin pipelines `243,275`; never `db.snapshots.delete_*`). Snapshots are immortal once written. | Readers: `get_snapshot` (`snapshots.py:69-78`); publish reads it (`gallery.py:167`); janitor pin pipelines read it (`janitor.py:243,275`). Writers: `create_snapshot` upsert (`snapshots.py:59-63`). | **Read-only for the janitor** — snapshots are the *source* of pin truth (every snapshot pins its `contour_hash` + `image_slug`, `janitor.py:212-244,251-276`) but are themselves never pinned, never deleted. This is the orphan-snapshot accumulation hazard (§3). |
| **gallery entry** (`gallery`) | Borrows `snapshot_hash` as its identity/handle; unique index on `snapshot_hash` (`database.py:75`). Mongo ObjectId `_id`. | No slug of its own — **the 64-char `snapshot_hash` IS the share URL** (`web/src/lib/api.ts:328-358`, `web/src/stores/gallery.ts:133,147`). | `user_slug: str \| None` (`gallery.py:188`; model `api/models/gallery.py:25`). **Nullable owner** — anonymous publish writes `None` (§3). | **Hard delete.** Owner self-delete (`gallery.py:255-269`, requires `user_slug` match), admin delete (`admin.py:149-163`), admin batch delete (`admin.py:371-377`). Janitor cascade-deletes on stale-user prune (`janitor.py:141-143`) and on image delete (`janitor.py:293-295`). Each delete also `delete_many` on `flags` (`gallery.py:268`, `admin.py:304,373`). | Readers: cursor list (`gallery.py:77-142`), single GET (`gallery.py:145-152`), admin stats/flagged/lookups, `_entry_from_doc` (`gallery.py:49-52`). Writers: publish (`gallery.py:155-200`), view-inc (`gallery.py:203-215`), like-toggle (`gallery.py:218-247`), owner update (`gallery.py:272-292`), admin set-tier/batch (`admin.py:124-146,378-389`). | Cascade-deleted only — when a referenced image is deleted (`janitor.py:293-295`) or its owner is pruned (`janitor.py:141-143`). `tier IN (featured,saved)` entries *pin* their contour+image (`janitor.py:224,257`). |
| **session** (`sessions`) | `_id = str(uuid.uuid4())` token (`sessions.py:27`). Foreign key `user_slug`. | No slug (token only, server-internal). | Owns `user_slug` (`sessions.py:28`). | **Hard delete.** Logout (`sessions.py:99`), suspend (`admin.py:273`), user-delete cascade (`admin.py:306,421`), expiry janitor (`janitor.py:127`), stale-user cascade (`janitor.py:161-163`). | Readers: `resolve_session` `find_one_and_update` (`dependencies.py:151-155`). Writers: register (`sessions.py:52`), login (`sessions.py:81`), all the deletes above. Token TTL refreshed on every resolve (`dependencies.py:153`). | Time-deletes expired (`janitor.py:127`); cascade-deletes for stale users (`janitor.py:161-163`). Indexed on `expires_at` as a **plain (non-TTL) index** (`database.py:67-72`) — note: expiry is enforced by the janitor cron, not by a Mongo TTL index. |
| **user** (`users`) | `_id = user_slug` — the slug **is** the internal id (`sessions.py:47-48`). Slug from `coolname.generate_slug(4)` (`sessions.py:44`). No content hash. | Yes — `user_slug`, 4-word, server-generated, **= `_id`**. | Self-owning. Optional `status: active\|suspended` (`admin.py:267`). | **Hard delete.** Admin single (`admin.py:307`), admin batch (`admin.py:422`), prune-empty (`admin.py:348`), stale-user janitor (`janitor.py:171`). Cascades to gallery+flags+sessions. | Readers: `resolve_session` suspension check + touch (`dependencies.py:167,175`), `me` (`sessions.py:89`), admin list (`admin.py:171-255`). Writers: register (`sessions.py:47`), status set (`admin.py:265`), all deletes. `last_seen_at` touched on every authed request (`dependencies.py:175-178`). | Time-deletes users unseen > `user_max_age_days` (`janitor.py:132-172`), cascading gallery/flags/sessions. Indexed `last_seen_at` (`database.py:64`). |
| **flag** (`flags`) | Mongo ObjectId `_id`; unique compound `(snapshot_hash, reporter_slug)` (`database.py:88-90`). | No slug. | `reporter_slug` (`gallery.py:313`). | **Hard delete.** Dismiss (`admin.py:530`), cascade with gallery delete (`gallery.py:268`, `admin.py:304,373,419`), stale-user cascade (`janitor.py:151-153`). | Readers: admin flagged list aggregation (`admin.py:459-520`). Writers: `flag_entry` insert (`gallery.py:320`); cannot flag own entry (`gallery.py:308-309`). | Cascade-deleted for stale users (`janitor.py:151-153`). No time-based janitor of its own. |
| **draft** (IndexedDB `fourier-drafts/drafts`) | Client-only. keyPath = `imageSlug` (`web/src/lib/draftStorage.ts:14`) — a *derived* string borrowed from the image entity's slug. No server persistence. | Borrows `image_slug`. | Implicitly the browser/device; never sent to the server as an owned entity. | **Hard delete**, client-only (`draftStorage.ts:44-52`). No server lifecycle. | Readers/writers: `web/src/stores/workspace.ts` `_saveDraftNow` (`workspace.ts:74-87`), `loadWorkspace`/`loadDraft` (`workspace.ts:124-160`), `refreshDrafts`→`listDrafts` (`workspace.ts:320-322`). Never touches the API. | **Never** — janitor is server-side; drafts live only in the browser's IndexedDB and are GC'd by the device/user. |
| **(audit log)** (`admin_audit`) | Mongo ObjectId `_id`. Not user-named. | No. | None (system). | **Hard delete**, 90-day retention by janitor (`janitor.py:174-178`). | Writers: `log_audit` (`admin.py:50-59`). Readers: admin audit list (`admin.py:542-579`). | Time-deletes entries older than 90 days (`janitor.py:175-176`). |

### §1 sub-findings

- **`animation.ts` is not a CRUD entity.** The charter lists it; verified it has no API call, no `localStorage`, no IndexedDB (grep returned nothing). It is a pure rAF playback store. No identity, no persistence. Recorded so the convergence does not chase a phantom entity.
- **`equations` is not an entity.** `api/routers/equations.py` is pure compute (`/compute`, `/simplify`); it persists nothing, holds no identity, has no collection. Compute-only.
- **Compute endpoints are stateless** — `compute_epicycles`/`compute_bases` (`contours.py:36-59`) read a contour and return a transient result; they write nothing.

---

## §2 — Five-identity-scheme verdict

**CONFIRMED.** All five schemes resolve to live code. The audit count of five **stands**. Named with verified live anchors:

1. **Human slug** — `image_slug` and `user_slug`, both from `coolname.generate_slug(4)` (`api/slugs.py:8-10`; minted at `image_storage.py:74` and `sessions.py:44`). Random (Mersenne-Twister via coolname). Validated by `SLUG_PATTERN` (`dependencies.py:27`).
2. **Content hash** — `contour_hash` (`image_storage.py:197`), `snapshot_hash` (`snapshots.py:47`), image `sha256` (raw bytes, `images.py:110`), and the `extraction_cache_key` (`image_storage.py:144-162`). All SHA-256 hex, deterministic from content.
3. **uuid4 token** — `sessions._id = str(uuid.uuid4())` (`sessions.py:27`). Opaque, non-cryptographic-but-random.
4. **Mongo ObjectId** — the auto `_id` on `images`, `contours`, `snapshots`, `gallery`, `flags`, `admin_audit`. Opaque, embeds a timestamp. Exploited as the cursor tie-breaker (`gallery.py:118,123`).
5. **Client-supplied path-keyed string** — `imageSlug` as the IndexedDB keyPath (`draftStorage.ts:14`). Derived from the image entity's slug; client-only.

A correction to the *framing* (not the count): scheme 1 (human slug) is internally *two* sub-uses — `user_slug` is used as a Mongo `_id` directly (`sessions.py:47-48`), whereas `image_slug` is a *secondary* unique-indexed field with an ObjectId `_id` (`database.py:42`). The convergence must treat these distinctly (users keep slug-as-`_id`; the new `visualizations` entity gets ObjectId `_id` + slug field — see §4). This does not change the scheme count; it clarifies that "human slug" spans both id-as-slug and slug-as-secondary-field.

---

## §3 — Collisions and owner-less paths

Every one, with live anchors:

### 3a. Owner-less / nullable-owner paths

1. **Anonymous gallery publish → `user_slug: None` orphan.** `publish_to_gallery` calls `resolve_session(request)` which **returns `None` when no `X-Session-Token` header is present** (`dependencies.py:147-149`), then writes that `None` straight into `gallery_doc["user_slug"]` (`gallery.py:162,188`). The doc is published with `user_slug=None`. **This is the spec's claimed `gallery.py:206` anonymous-orphan path; the actual write is `gallery.py:188`, the resolve is `gallery.py:162`** (DRIFTED — see §5). The owner-less entry can never be self-deleted (`delete_own_entry` requires `doc["user_slug"] != user_slug` to *not* hold, but `None != <any slug>` is always true → 403; `gallery.py:264-265`) and can never be self-updated or flagged-as-other. It is reachable only by admin delete or by the image/owner janitor cascade — and since `user_slug=None` is never `$in stale_slugs`, the stale-user cascade (`janitor.py:141-143`) never reaps it. **Owner-less gallery rows are effectively immortal unless their image is evicted.** This is the load-bearing finding for W3.
   - Note the frontend *tries* to avoid this: `useGalleryStore.publish`/`publishDraft` call `auth.ensureUser()` first (`web/src/stores/gallery.ts:159,171`), which registers a session. But the backend does **not** require a session on publish (`gallery.py:155-160` only rate-limits by IP; no `Depends(require_session)`), so a direct API call or a client with a cleared token still mints an orphan.

2. **Images and contours have no owner at all.** `store_image_asset` (`image_storage.py:91-101`) and `store_contour_asset` (`image_storage.py:207-218`) write no owner field. They are shared-by-dedup across all users (`sha256` / `contour_hash` unique). This is by-design dedup, but it means image/contour deletion can only ever be a global janitor decision, never a user action — and a user "deleting" their gallery entry leaves the underlying image/contour for other referrers.

3. **Snapshots have no owner and no delete path.** A snapshot created via `POST /api/images/{slug}/snapshots` (`snapshots.py:29-66`) but never published to the gallery is **un-prunable**: no owner to cascade from, no janitor rule, no TTL. Orphan snapshots accumulate forever. (The contour+image it references stay pinned only if *some* snapshot or featured/saved gallery row references them — an un-published snapshot *does* keep its contour/image pinned via `janitor.py:212-244,251-276`, so a single orphan snapshot can hold an image alive indefinitely.)

### 3b. Collision / race paths

4. **TOCTOU on `image_slug` issuance.** `store_image_asset` pre-checks `while await db.images.find_one({"image_slug": slug})` then inserts (`image_storage.py:74,76-77,103`). The `DuplicateKeyError` catch at `image_storage.py:104-109` **only handles a `sha256` collision** (it re-fetches by `sha256`), not a slug collision — a slug race that slips past the pre-check loop would re-fetch by `sha256`, find nothing, and re-`raise` → 500. **This is the spec's claimed `image_storage.py:76-77` race; verified at those exact lines** (VERIFIED — see §5).

5. **No collision handling on `user_slug`.** `register` does `db.users.insert_one({"_id": slug, …})` (`sessions.py:47-48`) with **no pre-check, no retry, no `DuplicateKeyError` catch**. A `coolname` collision on the slug-as-`_id` would raise a `DuplicateKeyError` that propagates to the global handler → 500 (`main.py:105-108`). Low-probability (4-word keyspace) but unhandled.

6. **`snapshot_hash` content-hash leaked into user-facing URLs.** The gallery's entire public surface keys on `snapshot_hash` (`gallery.py:145,203,218,255,272,295`; frontend `api.ts:328-358`, `gallery.ts:133,147`). A 64-char hex string is the share link. This is the central incoherence the convergence retires.

7. **`SLUG_PATTERN` is lax and misnamed.** `^[a-zA-Z0-9][-a-zA-Z0-9]{2,80}$` (`dependencies.py:27`) admits mixed-case, digits, and 3–81 chars — it is **not** a 4-word-slug validator. It is only ever applied to `image_slug` (via `validate_image_slug`, `dependencies.py:30-33`, called from `snapshots.py:31,71`, `images.py` via `get_image_*`). `user_slug` is **never** validated against it on the read path (`resolve_session` trusts the session's stored `user_slug`; login lowercases but does not pattern-check, `sessions.py:65`). `contour_hash`/`snapshot_hash` path params are unvalidated entirely (`contours.py:30`, `snapshots.py:70`, `gallery.py:145`). **This is the spec's claimed `dependencies.py:27`; verified exactly** (VERIFIED — see §5).

### 3c. Cascade gaps

8. **Image delete cascades to gallery but not to contours.** `_delete_images_and_cascade` (`janitor.py:279-304`) deletes the image and any `gallery` rows referencing its `image_slug`, but **does not delete `contours` that reference the same `image_slug`**. Orphan contours (image gone, contour stays) are only reaped later by their own time-based unpinned sweep (`janitor.py:66-68`) — acceptable, but worth noting the cascade is asymmetric.

9. **Owner self-delete cascades flags but not the underlying snapshot.** `delete_own_entry` (`gallery.py:267-268`) deletes the gallery row and its flags, but leaves the `snapshot` (no delete path exists for it — see 3a.3). The snapshot becomes an orphan, keeping its contour/image pinned.

---

## §4 — Converged `visualization` entity proposal

The convergence collapses **snapshot ⇄ gallery** into one user-saved noun, `visualizations`, eliminating the `snapshot_hash`-in-URL leak (§3.6), the owner-less publish (§3.1), and the un-prunable orphan snapshot (§3.3). `images` and `contours` stay as owner-less dedup assets behind it.

### 4a. Fields

```python
{
    "_id": ObjectId,                  # internal pointer + cursor tie-breaker; never user-facing
    "slug": str,                      # the ONE public handle; ^[a-z]+(-[a-z]+){3}$; unique; immutable
    "owner_slug": str,                # NOT NULL (cohort invariant 14); references users._id
    "image_slug": str,                # FK to images
    "contour_hash": str,              # FK to contours
    "contour_settings": dict,         # absorbed from snapshot
    "animation_settings": dict,       # absorbed from snapshot
    "content_hash": str,              # = the old snapshot_hash formula; server-internal ETag/idempotency substrate; NEVER in a URL
    "visibility": str,                # "draft" | "unlisted" | "public"
    "tier": str,                      # "normal" | "saved" | "featured" (admin/moderation, orthogonal to visibility)
    "views": int,
    "likes": int,
    "liked_ips": list[str],           # hashed IPs, kept (matches gallery.py:230-243)
    "active_bases": list[str],        # denormalized for filtering (gallery.py:181,193)
    "n_harmonics": int,               # denormalized (gallery.py:182,194)
    "version_count": int,             # ETag substrate; bumps on metadata-only update
    "created_at": datetime,
    "updated_at": datetime,
    "last_accessed_at": datetime,     # janitor predicate substrate
    "deleted_at": datetime | None,    # SOFT DELETE — null = live
    "pinned": bool,                   # janitor pin flag, same mechanism as contours/images (janitor.py:208-209)
}
```

Rationale for the deltas from today: `content_hash` replaces the user-facing `snapshot_hash` (retired as a URL handle); `owner_slug` is non-null (closes §3.1); `deleted_at` introduces soft-delete (today everything is hard-delete — §1); `visibility` separates draft/unlisted/public (today the only switch is the boolean fact of being in the gallery at all, plus the admin `tier`).

### 4b. Indexes (extends `database.py:74-85`)

```python
await db.visualizations.create_index("slug", unique=True)                       # primary handle
await db.visualizations.create_index("content_hash")                            # dedup + 90-day legacy-URL 301 lookup (§4f)
await db.visualizations.create_index("owner_slug")                              # ownership queries + stale-user cascade
await db.visualizations.create_index([("owner_slug", 1), ("created_at", -1)])   # "my visualizations" cursor list
await db.visualizations.create_index([("visibility", 1), ("created_at", -1), ("_id", -1)])  # public gallery cursor
await db.visualizations.create_index([("visibility", 1), ("views", -1), ("_id", -1)])       # sort=views
await db.visualizations.create_index([("visibility", 1), ("likes", -1), ("_id", -1)])       # sort=likes
await db.visualizations.create_index([("pinned", 1), ("last_accessed_at", 1)])  # janitor indexed predicate (mirror of database.py:49,57)
await db.visualizations.create_index("deleted_at", sparse=True)                 # soft-delete sweep
await db.visualizations.create_index("image_slug")                              # cascade on image delete
```

The cursor-pagination tie-break pattern (`(field, -1), ("_id", -1)`, today `gallery.py:118,123`) carries over unchanged; ObjectId `_id` remains the tie-breaker. No ULID/UUIDv7 needed — single-replica, second-granularity monotonicity suffices (concurs with `R-identity-spec §2b`).

### 4c. Slug derivation

- **Server-side only**, at create, **immutable** for the entity's lifetime.
- Replace `coolname.generate_slug(4)` (`api/slugs.py:8-10`) with a structured `adjective-verb-color-animal` scheme matching the cohort canonical (`R-identity-spec §3b`), drawn from a shared word-list, using `secrets.choice` (cryptographic RNG) rather than coolname's Mersenne-Twister.
- **Insert-then-catch, never check-then-insert.** Retire the TOCTOU loop (`image_storage.py:76-77`) and the no-catch user insert (`sessions.py:47-48`) in favour of: generate → `insert_one` → on `DuplicateKeyError` (code 11000) regenerate, up to 10 retries → 503 `slug-pool-exhausted`. Keyspace (~2.4×10⁸ for the structured scheme) makes exhaustion effectively impossible below 10⁵ entities.
- Validation: one `validate_slug(s) -> str` enforcing `^[a-z]+(-[a-z]+){3}$`, applied at every router boundary that accepts a slug path/body param (today `SLUG_PATTERN` is applied only to `image_slug` — §3.7).

### 4d. Owner contract

- **`owner_slug` is NOT NULL** at every write. Publish/create **must** require a resolved session: add `Depends(require_session)` to the create route (today publish only rate-limits — `gallery.py:155-160`). The frontend already calls `ensureUser()` before publish (`gallery.ts:159,171`); making it a hard backend requirement closes §3.1.
- Ownership checks reuse today's pattern (`doc["owner_slug"] != user_slug` → 403), already correct for owner-delete/update (`gallery.py:264,284`).
- Migration of existing owner-less rows: assign a synthetic `anon-migrated-NNN` owner with `visibility="draft"`, retired one tranche later by the cron (concurs with `R-identity-spec §7c`, `R-lifecycle-spec`). This `anon-migrated-*` slug class is the one admitted exception to the 4-word pattern.

### 4e. Visibility states

| State | Meaning | In public cursor list? | Owner-only? |
|---|---|---|---|
| `draft` | Created/owned, not published. Replaces today's IndexedDB-only draft for *server-persisted* drafts; the client IndexedDB draft (`draftStorage.ts`) stays as the pre-create scratch buffer. | No | Yes |
| `unlisted` | Shareable by direct link, not in the gallery feed. (New capability; no equivalent today.) | No | Link-holders |
| `public` | In the gallery feed. Equivalent to "has a gallery row" today. | Yes | No |

`tier` (`normal`/`saved`/`featured`) stays orthogonal — it is the admin/moderation axis (`gallery.py:189`, `admin.py:124-146`) and continues to drive janitor pinning (`featured`/`saved` pin their assets, `janitor.py:224,257`). `visibility` is the owner-controlled axis.

### 4f. Delete / lifecycle

- **Soft delete**: `DELETE /visualizations/{slug}` sets `deleted_at` (not a `delete_one`). `POST /visualizations/{slug}/restore` clears it. The public cursor list filters `deleted_at: null`.
- **Hard delete (cron)**: janitor sweeps `{deleted_at: {$lt: cutoff}}` after a grace window, and `{pinned: false, last_accessed_at: {$lt: cutoff}}` for never-saved drafts — same indexed-predicate shape as today's contour/image sweep (`janitor.py:66-68`), no `$nin`.
- **Legacy URL grace**: `GET /gallery/{snapshot_hash}` 301s to `/v/{slug}` via a `content_hash` lookup for 90 days, then 410. The `content_hash` index (§4b) backs this.

---

## §5 — Drift ledger

Every anchor the downstream W3 specs depend on, plus the additional anchors `R-identity-spec.md` cites that touch fourier code. `claimed` is from the lane charter / `R-identity-spec.md`; `actual` is HEAD.

| Claimed location | Actual location | Status |
|---|---|---|
| `gallery.py:206` — anonymous-orphan publish (`user_slug: None`) | resolve `gallery.py:162`; write `gallery.py:188`. (`gallery.py:206` is now inside `increment_view`, an unrelated handler.) | **DRIFTED** |
| `janitor.py:60-65` — unbounded `$nin` cron query | **No `$nin` exists.** The `$nin` was *retired*; `janitor.py:60` is `await _recompute_pin_flags(db)` and `66-68` is the indexed `{pinned: False, last_accessed_at: {$lt: cutoff}}` delete. The module docstring (`janitor.py:1-24`) explicitly documents the `$nin` removal. | **STALE** (the hazard the spec names is already fixed) |
| `dependencies.py:27` — `SLUG_PATTERN`, lax/≤80 chars | `dependencies.py:27` exactly: `^[a-zA-Z0-9][-a-zA-Z0-9]{2,80}$`. | **VERIFIED** |
| `image_storage.py:76-77` — race-prone check-then-insert slug issuance | `image_storage.py:76-77` exactly: `while await db.images.find_one({"image_slug": slug}): slug = generate_slug()`. | **VERIFIED** |
| `janitor.py:84-119` — `storage_budget_gb` eviction band-aid | `janitor.py:83-118` (budget block starts at `83` with `budget_bytes = …`; eviction loop `101-118`). One line earlier than claimed. | **DRIFTED** (off-by-one; substance intact) |
| `api/slugs.py:8-10` — `coolname.generate_slug(4)` | `api/slugs.py:8-10` exactly. | **VERIFIED** |
| `database.py:42` (image_slug unique), `:43` (sha256 unique) | `database.py:42`, `:43` exactly. | **VERIFIED** |
| `database.py:47` (contour_hash unique) | Actual: `database.py:52`. | **DRIFTED** |
| `database.py:53` (snapshot_hash unique) | Actual: `database.py:60` (`snapshot_hash` unique); `:61` (compound). | **DRIFTED** |
| `database.py:68` (gallery snapshot_hash unique) | Actual: `database.py:75`. | **DRIFTED** |
| `database.py:81-83` (flags compound unique) | Actual: `database.py:88-90`. | **DRIFTED** |
| `image_storage.py:181` (contour_hash sha256) | Actual: hash computed `image_storage.py:165-178`, invoked `:197`. | **DRIFTED** |
| `snapshots.py:38-47` (snapshot_hash formula) | `snapshots.py:38-47` exactly. | **VERIFIED** |
| `sessions.py:47-48` (users `_id = slug`) | `sessions.py:47-48` exactly. | **VERIFIED** |
| `sessions.py:27` (sessions `_id = uuid4`) | `sessions.py:27` exactly. | **VERIFIED** |
| `draftStorage.ts:14` (IndexedDB keyPath `imageSlug`) | `draftStorage.ts:14` exactly. | **VERIFIED** |
| `dependencies.py:166` (auth keys on `users._id`) | Actual: `dependencies.py:167` (`db.users.find_one({"_id": user_slug}…)`). | **DRIFTED** (off-by-one) |
| `gallery.py:158-163` (cursor `_id` tie-breaker) | Actual: `gallery.py:115-123` (the `$or` cursor filter + `.sort([(sort_field,…),("_id",…)])`). | **DRIFTED** |
| `gallery.py:206-232` (orphan rows from this range) | Spurious — `gallery.py:206-215` is `increment_view`. The orphan write is `gallery.py:188`. | **STALE** |
| `compute.py` (router, cited by charter + spec) | **Does not exist.** Compute lives in `contours.py:36-59` and `equations.py`. | **STALE** |
| `image_storage.py:106` (catches sha256 dup only) | Actual: `image_storage.py:104-109` (catches `DuplicateKeyError`, re-fetches by `sha256` only — confirms the claim's substance). | **DRIFTED** (line) / substance VERIFIED |

Summary: **9 anchors VERIFIED, 10 DRIFTED (line-shift, substance intact), 3 STALE** (the cited hazard/file no longer exists as described). The single most consequential STALE is the `$nin` query (`janitor.py:60-65`) — W3/W4 must not plan to "fix" it; it was already fixed in tranche A.

---

## §6 — Crosswalk to `R-identity-spec.md`

What holds, what needs correction, against the live fourier source:

| `R-identity-spec` claim | Verdict | Evidence |
|---|---|---|
| §1b: five identity schemes, count "stands" | **HOLDS** | §2 above; all five resolve. |
| §1a table: `image_slug` unique `database.py:42`; `sha256` `:43` | **HOLDS** | `database.py:42-43`. |
| §1a table: `contour_hash` unique `database.py:47` | **CORRECT TO `database.py:52`** | drift. |
| §1a table: `snapshot_hash` unique `database.py:53`; gallery `database.py:68`; flags `database.py:81-83` | **CORRECT TO `:60`, `:75`, `:88-90`** | drift. |
| §1b #5 / §3d: TOCTOU loop `image_storage.py:75-77`; sha256-only catch `:106`; no user-slug handler `sessions.py:47-49` | **HOLDS** (substance) | `image_storage.py:76-77,104-109`; `sessions.py:47-48`. Line `75` → loop starts `74` (`slug = generate_slug()`), `while` at `76`. |
| §1c #1 / §2c: gallery URLs carry `snapshot_hash` (the central incoherence) | **HOLDS** | `gallery.py:145…`, `api.ts:328-358`, `gallery.ts:133,147`. |
| §1c #2 / §3f: `SLUG_PATTERN` `dependencies.py:27` lax & misnamed (only ever applied to image slug) | **HOLDS** | `dependencies.py:27,30-33`; never applied to `user_slug`/hashes (§3.7). |
| §1b #2 / §4a: SHA-256 everywhere, JSON-canonical | **HOLDS** | `image_storage.py:165-178`, `snapshots.py:38-47`, `images.py:110`. |
| §4a: contour hash at `image_storage.py:165, 181` | **PARTIAL** — compute fn `165-178`, call site `197`; the `181` anchor lands inside `store_contour_asset`'s signature, not the hash. | drift. |
| §7c / §5d: orphan snapshots + `user_slug: None` rows need an `anon-migrated-NNN` owner | **HOLDS and is load-bearing** | §3.1, §3.3. Confirmed both the nullable-owner gallery row (`gallery.py:188`) and the owner-less, delete-less snapshot (§1, §3.3) exist. |
| §7b Phase 0 step 3: orphans "from `gallery.py:206-232`" | **CORRECT TO `gallery.py:162,188`** | `:206-232` is `increment_view`/`toggle_like`. |
| §8 citation `api/dependencies.py:166` (auth keys on `users._id`) | **CORRECT TO `:167`** | off-by-one. |
| §8 citation: `compute.py` implied by charter | **STALE** — no such file | §5. |
| §2b: ObjectId tie-breaker `gallery.py:158-163` | **CORRECT TO `gallery.py:115-123`** | the `count_documents` was removed (`gallery.py:136`); line range shifted. |
| §7c #5 / §4f: legacy 301 needs a `content_hash` index | **HOLDS as a requirement** | no such index today; §4b adds it. |

**Net:** the spec's *substantive findings are all confirmed* — five schemes, the `snapshot_hash` URL leak, the lax/misnamed `SLUG_PATTERN`, the TOCTOU slug loop, the unhandled user-slug collision, the nullable-owner publish, and the un-prunable orphan snapshot all exist in live code. The spec's *line anchors have drifted* (10 of them) and **one named hazard is already fixed** (the `$nin` cron query — `R-lifecycle-spec`/R4 should treat the janitor's indexed-predicate shape as the *baseline*, not a target). W3 should regenerate all `database.py` and `gallery.py` line citations against HEAD before transcribing them into conformance rows.
