# R4-scaling-bounds — the persistence story that scales without contrivance (invariant 12)

**Lane**: B / Wα — research wave / R4 — scaling-bounds deep-research.
**Mode**: READ-ONLY. The deliverable is this single file. No source/spec/coordination file edited; nothing committed.
**Scope**: fourier-analysis, the converged `visualization` entity. Cohort identity is *fourier ⇄ value.js*, single-host deploy. Invariant 12 (scale without contrivance) and invariant 14 (typed non-null owner) are load-bearing throughout.
**Date**: 2026-05-26.

This document records findings as of authoring time. Every claim traces to a live `file:line` citation read in full. Where a sibling-lane claim is verified against the live tree, the verdict is marked **CONFIRMED** / **STALE** in §5. The substance ratified by `R-lifecycle-spec.md` and `R-auth-spec.md` is not re-decided here; this lane explicates the *scaling-bounds* surface and reconciles two stale spec claims against the live janitor.

---

## §1 Soft-delete + cron policy

### 1.1 The ratified grace window (unchanged; restated for closure)

`R-lifecycle-spec.md §3.2` ratifies the `deleted_at: datetime | null` soft-delete pattern (NOT a tombstone collection), a **30-day grace** default (config `settings.soft_delete_grace_days`, mirroring the existing `session_ttl_days` rhythm), owner-only restore via `POST /api/visualizations/{slug}/restore` (410 Gone past grace), and the hard-delete invariant — **only the janitor and admin actions** call `delete_*`. The owner path never hard-deletes. R4 adopts this verbatim; the entity needs no scaling-bounds revision to it.

The `deleted_at` janitor hard-delete pass is **new work the W3 wave lands** — it does not exist today (there is no `deleted_at` field anywhere in `api/models/**`, and no soft-delete pass in `api/services/janitor.py`). Its query shape is bounded by construction:

```python
# W3-new pass, added to api/services/janitor.py:
grace_cutoff = now - timedelta(days=settings.soft_delete_grace_days)
soft_deleted = await db.visualizations.find(
    {"deleted_at": {"$lt": grace_cutoff}}, {"slug": 1, "snapshot_hash": 1}
)
# ... hard-delete + cascade votes/likes/flags, then delete_many the same predicate.
```

Backed by the sparse index `db.visualizations.create_index("deleted_at", sparse=True)` (`R-lifecycle-spec.md §2.4`). `$lt` on a sparse-indexed timestamp is range-bounded — no `$nin`, no in-memory id set. Invariant 12 held.

### 1.2 The live cron query — VERIFIED, R1's STALE finding CONFIRMED

**R1 is correct.** The unbounded `$nin` cron query that `R-lifecycle-spec.md §1.1`, `§4.2`, and `§8` cite at `janitor.py:60-65` / `:60-78` **no longer exists in the live tree.** I read `api/services/janitor.py` in full (305 lines). Tranche A already landed the canonical `pinned`-flag pattern. The actual live shapes:

- The module docstring (`janitor.py:1-24`) documents the replacement explicitly: "Janitor uses a per-document `pinned` boolean flag on `contours` and `images` rather than constructing an in-memory pinned-id set and passing it as a `{"$nin": [...]}` predicate (the prior shape … would have eventually exceeded the 16 MB BSON document limit — see `docs/tranches/A/waves/W4.md` … and `h3-A-W4-W5-W6.md`)."
- The contour deletion query (`janitor.py:66-68`): `{"pinned": False, "last_accessed_at": {"$lt": cutoff}}`.
- The image deletion query (`janitor.py:72-75`): `_delete_images_and_cascade(db, {"pinned": False, "last_accessed_at": {"$lt": cutoff}})`.
- The pin recompute (`janitor.py:181-276`, `_recompute_pin_flags`): an **idempotent server-side `$merge` aggregation** that resets every `contours`/`images` doc to `pinned=False`, then `$unionWith`-merges `pinned=True` from `snapshots` ∪ `gallery WHERE tier IN {featured, saved}`. All id-set construction is server-side inside the pipeline — never an in-memory list bounded by pinned cardinality. The recompute IS the migration (backfills legacy docs lacking the field).
- The supporting compound indexes are live (`api/services/database.py:49` `images (pinned, last_accessed_at)`; `:57` `contours (pinned, last_accessed_at)`), each documented as "replaces the legacy unbounded `$nin` scan flagged by the W4.a (Tranche A) audit."

**Consequence for W3's janitor scope (material):** the contour/image `$nin` retirement is **already done** — it landed in tranche A, not B. W3 must NOT re-implement it. W3's janitor work reduces to (a) **adding** the new `deleted_at`-grace hard-delete pass for the `visualization` entity (§1.1), (b) wiring the entity's pin-source into `_recompute_pin_flags` once `gallery`/`snapshots` collapse into `visualizations` (the `$unionWith` source collections change), and (c) the §4 band-aid retirement. The `test_no_nin_in_janitor_source` grep gate (`R-lifecycle-spec.md §4.6`) **already passes** against the live source.

### 1.3 The pin-source migration W3 must perform

`_recompute_pin_flags` (`janitor.py:217-276`) reads two source collections — `snapshots` (the pipeline root) and `gallery` (the `$unionWith` coll). When W3 collapses both into the single `visualizations` collection (`R-lifecycle-spec.md §5.3`), the pin pipelines must re-root on `visualizations` and the pin policy becomes: a contour/image is pinned iff referenced by any `visualization` whose `visibility != "draft"` and `deleted_at == null`, OR whose `tier IN {featured, saved}`. This is a same-shape edit (swap collection names + adjust the `$match`), not a new pattern — the bounded-aggregation mechanism is preserved.

---

## §2 Ownership / anonymous publish

### 2.1 The live orphan path — VERIFIED present, unchanged

The anonymous-publish orphan path is **live and unmitigated**. I read `api/routers/gallery.py:155-201` (`publish_to_gallery`) and `api/models/gallery.py`:

- `gallery.py:156` — `publish_to_gallery(body, request)` has **no `Depends(require_session)`**; it is reachable anonymously.
- `gallery.py:162` — `user_slug = await resolve_session(request)`. Per `api/dependencies.py:144-149`, `resolve_session` returns `None` when the `X-Session-Token` header is absent (it only raises 401 if a header is present but invalid/expired).
- `gallery.py:188` — `"user_slug": user_slug` written directly into `gallery_doc` (can be `None`).
- `gallery.py:199` — `db.gallery.insert_one(gallery_doc)` persists the orphan.
- `api/models/gallery.py:25` — `user_slug: str | None = None` in `GalleryEntryResponse` tolerates the orphan at the type boundary.

This exactly matches `R-auth-spec.md §1a` / `§3a` (cited there as `gallery.py:206, :233` — line-drifted but substantively identical; see §5). Cohort invariant 14 is violated today.

### 2.2 The decided contract

`R-auth-spec.md §3c` ratifies and R4 reaffirms: **admit the publish, reject the orphan path.** The converged `POST /api/visualizations` and `POST /api/visualizations/{slug}/publish` **require** a session (401 to anonymous callers). The frontend mediates transparently via the existing `ensureUser()` pattern (`web/src/stores/auth.ts`) — the human sees no login wall (slug minted on demand, no email/password), the system never sees a null owner. The `visualization.owner_slug` is **NOT NULL** (`R-lifecycle-spec.md §2.4` enforces via no nullable owner in the entity; `R-auth-spec.md §3b` table marks it required).

**Rejected** (restated for closure): synthesising an `anon-NNN` owner class for *new* posts (a new identity class with no `last_seen_at`, no janitor membership, no claim path — solves an invariant we already satisfy by enforcing `ensureUser`); and continuing to admit `user_slug: None`. The **only** place an `anon-*` slug appears is the W3 migration's legacy backfill: existing orphan rows get a deterministic `anon-migrated-NNN` slug bound to a real (admin-managed) `users` doc with `status: 'orphan-migrated'` and the original `created_at`. The migration's post-condition (`R-lifecycle-spec.md §5.3`: `count_documents({"owner_slug": None}) == 0` else `RuntimeError`) is the gate. New orphans cannot exist post-cutover because the route requires the session.

This lane **confirms R-auth-spec's anon-orphan rejection against the live tree**: the orphan path is still present (so the work is real, not already done), and the rejection is the correct contract.

---

## §3 Single-replica honesty

Both process-local state stores are **CONFIRMED process-local** in the live tree, and the entity needs **nothing different** — it inherits the fourier-A.W4 "Option A" single-replica posture verbatim.

### 3.1 Rate-limiter — `api/services/rate_limiter.py`

`SlidingWindowLimiter` (`rate_limiter.py:36-103`) holds an in-process `OrderedDict[str, _BucketEntry]` (`:51`) with LRU eviction at `MAX_ENTRIES = 50_000` (`:16, :57-69`). Eight module-level singletons (`:110-113, :132`: `login=5`, `like=10`, `write=10`, `admin=30`, `compute=5` per minute) live in the worker process. Keying is `SHA-256(ip)` (`:19-21`), applied at the usage site. **No shared store, no Mongo/Redis backing.** Budgets are strictly per-replica: at N replicas the global budget is N× the configured tier. Correct and honest at `replicas: 1`.

### 3.2 Suspension cache — `api/dependencies.py`

`_suspended_cache: dict[str, float]` (`dependencies.py:24`) is a module-level in-process dict, TTL `_SUSPENSION_CACHE_TTL = 60.0` (`:25`). `resolve_session` (`:144-179`) checks it post-resolve (`:162-172`); `mark_suspended_in_cache` (`:187-189`) and `invalidate_suspension_cache` (`:182-184`) mutate it eagerly on admin status change. **Process-local, not shared.** On >1 replica, suspension propagation lags up to 60 s on the replica that did not handle the admin action — same-replica is immediate via the eager mark.

### 3.3 Assessment for the entity

The `visualization` entity introduces no new in-process state. It rides the existing `write`/`like`/`compute` tiers (the converged tier table at `R-auth-spec.md §6b` adds `register=3`, `flag=5` — a config edit to the limiter singletons, not a substrate change). The honest minimum is the **declared-in-code single-replica block** (`R-auth-spec.md §6e`): a top-of-file comment in `rate_limiter.py` + the existing `dependencies.py:24` `_suspended_cache` block, with the `grep -n 'single-replica' …` acceptance gate. **Live gap noted:** neither `rate_limiter.py` nor `dependencies.py:22-25` currently carries the literal `single-replica` token — the comment at `dependencies.py:22-25` documents the 60 s TTL rationale but does not name the multi-replica posture. W3/W4 must land the declared-in-code block to pass the `R-auth-spec §6e` grep gate. This is the only single-replica delta. No Mongo-backed limiter/cache is built (filed as successor-tranche scope, not pre-built — invariant 12).

---

## §4 Image-blob decision

### 4.1 Option B CONFIRMED — defer to tranche C; do not admit to B

R4 confirms the **default and Wave-2-reaffirmed Option B**: the image-blob-out-of-Mongo redesign is **deferred to fourier tranche C**, NOT admitted to B's scope. This matches `R-lifecycle-spec.md §6.1` ("This research confirms the default is correct: defer"). Rationale (KISS, invariant 12):

- B's thesis is **identity convergence, not storage architecture.** The blob redesign is orthogonal — it neither requires nor blocks the visibility/soft-delete/cron/ownership convergence. Admitting it doubles B's scope.
- **value.js has no image-blob peer to converge with** — palettes are ≤ 50 colours, no blobs. The blob question is fourier-internal; including it under the cohort banner is scope inflation.
- The band-aid still operates at the deployed scale; retiring it is honest, relocating the bytes is C's problem.

### 4.2 `image_slug` is a stable FK; blobs are NOT migrated

The deferral is **precisely scoped to storage *location***, not storage *identity* or *referencing*. `image_slug` is the **stable foreign key** and is settled in B:

- It is generated once with collision-retry (`image_storage.py:74-77`) and uniquely indexed (`database.py:42`).
- It is the dedup/lookup key throughout (`store_contour_asset` references it at `image_storage.py:209`; the janitor pins and evicts by it at `janitor.py:103, 109, 252, 265`; contours index it at `database.py:54`).
- The converged `visualization` carries `image_slug` as its FK (`R-lifecycle-spec.md §5.3` viz_doc, `§6.4`); images remain owner-less but the referencing `visualization` carries the owner.

The inline blobs live at `image_storage.py:97` (`"blob": Binary(content)`) and `:98` (`"thumbnail": Binary(thumb_bytes)`) in the `images` document. **These blobs are NOT migrated in B.** In tranche C the migration adds a `storage_uri: str` field and moves bytes out (candidate backends KISS-ordered: filesystem + nginx static serve > GridFS > MinIO > managed S3, per `R-lifecycle-spec.md §6.3`). The `image_bytes(asset)` helper (`image_storage.py:113-117`) is the future migration boundary. None of that is B.

### 4.3 The band-aid — live location + retire-without-move plan

The `storage_budget_gb` eviction band-aid is **live at `api/services/janitor.py:79-118`** (the budget enforcement block; the eviction loop proper is `:91-118`). R1's "drifted to ~`janitor.py:83-118`" is **CONFIRMED** (the budget-bytes computation starts at `:83`; the section header comment at `:79-81`). Mechanics:

- `:83` — `budget_bytes = int(settings.storage_budget_gb * 1024³)` (config default `5.0`, `api/config.py:15`).
- `:84-89` — aggregate `$sum: "$bytes"` over `images` for `total_bytes`.
- `:91-118` — if over budget, cursor-sort unpinned images by `last_accessed_at` ascending and `_delete_images_and_cascade` oldest-first until `freed >= overage`.

**Retire-without-move is the honest minimum.** Removing the eviction pass (`janitor.py:79-118`) and the `storage_budget_gb` setting (`config.py:15`) does NOT relocate any blob — it merely stops the band-aid from masking the underlying storage question, surfacing it as a clean problem for C. The time-based prune (`pinned=False, last_accessed_at < cutoff`, `janitor.py:66-77`) and the per-doc `bytes` field (kept; it is the C-migration's accounting input) remain. This is exactly `R-lifecycle-spec.md §4.4` ("Storage-budget eviction — **RETIRED**") and `§6.2` ("retirement of the eviction-pass is not the same as relocation of the blobs"). The retirement is W3-scoped janitor work; the relocation is C.

---

## §5 Drift ledger

| Item | Claimed | Actual (live) | Status |
|---|---|---|---|
| Janitor `$nin` cron (contours/images) | `R-lifecycle-spec.md §1.1/§4.2/§8` cite an unbounded `{"$nin": pinned_set}` at `janitor.py:60-65` / `:60-78`, built from a full snapshot+gallery scan at `:39-53` | **No `$nin` anywhere in `janitor.py`.** Replaced by `pinned`-flag predicate `{"pinned": False, "last_accessed_at": {"$lt": cutoff}}` (`janitor.py:66-68, 72-75`) + idempotent server-side `$merge` recompute (`:181-276`). Docstring (`:1-24`) documents the swap; compound indexes live (`database.py:49,57`). | **STALE in spec / ALREADY DONE in tranche A.** R1's STALE finding **CONFIRMED**. Materially shrinks W3 janitor scope. |
| `storage_budget_gb` band-aid location | R1: "drifted to ~`janitor.py:83-118`"; `R-lifecycle-spec.md §1.1/§6.5` say `:84-119` | Live block is `janitor.py:79-118` (header comment `:79-81`, budget compute `:83`, eviction loop `:91-118`). `config.py:15`. | **CONFIRMED** (R1 location right; the spec's `:84-119` is off-by-a-few from line drift). |
| Anonymous-publish orphan | `R-auth-spec.md §1a/§3a` cite `gallery.py:206, :233` writing `user_slug: None` | Live at `gallery.py:162` (`resolve_session` → may be `None`), `:188` (`"user_slug": user_slug`), `:199` (insert); no `require_session`; `models/gallery.py:25` tolerates `str | None`. Line numbers drifted (~44 lines earlier) but path is present and unmitigated. | **CONFIRMED present.** Rejection contract is correct; work is real, not already done. |
| `deleted_at` soft-delete pass | `R-lifecycle-spec.md §4.4` lists "Soft-deleted past grace" as a cron category | **Absent today.** No `deleted_at` field in `api/models/**`; no soft-delete pass in `janitor.py`. | **New W3 work** (not drift; flagged so W3 scopes it as net-new, not a port). |
| Single-replica declared-in-code block | `R-auth-spec.md §6e` mandates a literal `single-replica` comment block in `rate_limiter.py` + `dependencies.py`; grep gate | `dependencies.py:22-25` documents the 60 s TTL but does NOT contain the token `single-replica`; `rate_limiter.py` top-of-file has no such block. | **Live gap.** W3/W4 must land the block to pass the §6e grep gate. |
| Pin-source collections | `_recompute_pin_flags` reads `snapshots` (root) + `gallery` (`$unionWith`) | `janitor.py:217-276` confirmed: roots on `db.snapshots`, unions `gallery WHERE tier IN {featured, saved}`. | **Accurate.** W3 must re-root on `visualizations` when the collections collapse (§1.3) — same-shape edit. |

---

## §6 Crosswalk

### 6.1 To `R-lifecycle-spec.md`

| `R-lifecycle-spec.md` claim | R4 reconciliation |
|---|---|
| §1.1 / §4.2 / §8: janitor `$nin` is live at `:60-78` | **Corrected.** STALE — tranche A already replaced it (§1.2, §5). The spec's "the single load-bearing change" (`§4.2`) for contours/images is **already landed**; W3 inherits, does not re-do. |
| §3 `deleted_at` 30-day grace, restore, hard-delete invariant | **Adopted verbatim.** New W3 pass; bounded `$lt` query on sparse `deleted_at` index (§1.1). |
| §4.4 storage-budget eviction RETIRED | **Confirmed.** Live at `:79-118`; retire-without-move is the honest minimum (§4.3). |
| §4.4 pin-flag prune `{pinned: false, last_accessed_at: {$lt: cutoff}}` | **Already live** at `janitor.py:66-77` — the post-convergence shape the spec prescribes is the current shape. |
| §6 image-blob defer to C; `image_slug` as referencing identity settled in B | **Confirmed Option B.** `image_slug` is the stable FK; blobs not migrated (§4.1–§4.2). |
| §5.3 migration post-condition `owner_slug != None` | **Confirmed** as the orphan-closure gate (§2.2). |

### 6.2 To `R-auth-spec.md`

| `R-auth-spec.md` claim | R4 reconciliation |
|---|---|
| §3c: reject anon-orphan path; require session on publish; `ensureUser()` mediation | **Confirmed against live tree.** Orphan path present at `gallery.py:162/188/199` (§2.1); rejection is the correct contract (§2.2). |
| §2e / §6e: single-replica process-local `_suspended_cache` (60 s) + rate-limiter | **Confirmed process-local** (`dependencies.py:24`, `rate_limiter.py:51`); §3. Entity needs nothing different. **Gap:** the §6e `single-replica` declared-in-code block is not yet present (§5). |
| §6a / §6b: inherit fourier-A.W4 Option A, single-replica, hashed-IP sliding window; converged tier table | **Confirmed.** Entity rides existing tiers; the table delta (`register`, `flag`) is a singleton-config edit, not a substrate change (§3.3). |
| §1b gap 1 (anon orphan) | This lane supplies the scaling-bounds confirmation: the orphan is a live invariant-14 violation, closed by §2.2's contract + the migration's post-condition gate. |

---

## Citation summary (load-bearing, all read in full)

- `api/services/janitor.py:1-24` (docstring documenting the `$nin`→`pinned` swap), `:38-45` (6 h loop), `:66-68` (contour pinned-predicate delete), `:72-77` (image pinned-predicate delete + cascade), `:79-118` (storage-budget band-aid), `:120-178` (session/user/audit cleanup), `:181-276` (`_recompute_pin_flags` server-side `$merge`), `:279-304` (cascade helper).
- `api/services/rate_limiter.py:16` (MAX_ENTRIES), `:36-103` (`SlidingWindowLimiter`, in-process OrderedDict), `:110-113, :132` (tier singletons).
- `api/services/image_storage.py:74-77` (slug collision-retry), `:97-98` (inline blob + thumbnail), `:113-117` (`image_bytes` future migration boundary), `:209` (contour FK to `image_slug`).
- `api/services/database.py:42` (`images.image_slug` unique), `:49` (`images (pinned, last_accessed_at)`), `:54,57` (contours `image_slug` + `(pinned, last_accessed_at)`), `:60-65` (sessions TTL idiom).
- `api/dependencies.py:22-25` (`_suspended_cache` + 60 s TTL), `:144-179` (`resolve_session` returns `None` on no header), `:182-189` (cache mutators), `:192-197` (`require_session`).
- `api/routers/gallery.py:155-201` (`publish_to_gallery` — anonymous-reachable; `:162` resolve, `:188` write, `:199` insert).
- `api/models/gallery.py:14, 21-32` (`GalleryTier`, `user_slug: str | None = None`).
- `api/config.py:14-19` (`asset_max_age_days`, `storage_budget_gb`, `session_ttl_days`, `user_max_age_days`).
- `docs/tranches/B/research/R-lifecycle-spec.md §1.1, §3, §4.2, §4.4, §5.3, §6` — the lifecycle crosswalk target.
- `docs/tranches/B/research/R-auth-spec.md §1a, §1b, §2e, §3a, §3c, §6a, §6b, §6e` — the auth/rate-limit crosswalk target.
