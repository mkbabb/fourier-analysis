# Audit E — CRUD / Slug / value.js / Scaling

Repo: `fourier-analysis` · Date: 2026-05-18 · Scope: READ-ONLY

---

## 1. CRUD Matrix

Entities, their identity scheme, and CRUD coverage. "—" = not implemented.

| Entity | Identity | Create | Read | Update | Delete | Ownership/Auth | Janitor TTL |
|---|---|---|---|---|---|---|---|
| **Image** | `image_slug` (4-word slug) + `sha256` | `POST /api/images` `images.py:88` → `store_image_asset` `image_storage.py:41` | `GET /{slug}`, `/by-hash`, `/blob`, `/thumbnail`, `/overlay` `images.py:120-181` | — (immutable; thumbnail re-gen on re-upload `image_storage.py:55`) | — (only via janitor) | none (public) | yes — `last_accessed_at` < `asset_max_age_days` `janitor.py:62` |
| **Contour** | `contour_hash` (sha256 of sorted points) | `POST /api/contours` `contours.py:23`; `POST /images/{slug}/extract-contour` `images.py:184` → `store_contour_asset` `image_storage.py:159` | `GET /api/contours/{hash}` `contours.py:30`; `get_contour` `dependencies.py:55` | lazy backfill of `image_bounds` only `dependencies.py:78` | — (only via janitor) | none (public) | yes — `last_accessed_at` cutoff `janitor.py:57` |
| **Snapshot** | `snapshot_hash` (sha256 of slug+contour+settings) | `POST /images/{slug}/snapshots` `snapshots.py:30` (upsert, `$setOnInsert`) | `GET /images/{slug}/snapshots/{hash}` `snapshots.py:69` | — | — | none (public) | **no direct TTL** — pinned only if referenced by gallery; otherwise orphaned forever |
| **Gallery entry** | `snapshot_hash` (reuses snapshot id, no own slug) | `POST /api/gallery` `gallery.py:189` | `GET /api/gallery`, `/cursor`, `/{hash}` `gallery.py:78,124,182` | `PUT /api/gallery/{hash}` `gallery.py:295`; `+view`/`+like`/`+flag` counters | `DELETE /api/gallery/{hash}` `gallery.py:280` (owner); admin delete `admin.py` | `require_session` + `user_slug` match `gallery.py:283-292`; publish allows anonymous (`resolve_session` may return `None` `gallery.py:196`) | indirect — cascade-deleted when image/user pruned `janitor.py:73,136` |
| **User** | `_id = user_slug` (4-word slug) | `POST /api/sessions` `sessions.py:39` | `GET /api/sessions/me` `sessions.py:84` | touch `last_seen_at` only | — | self via session | yes — `user_max_age_days` cascade `janitor.py:131` |
| **Session** | `_id = uuid4` (NOT a slug) | `POST /api/sessions`, `/login` `sessions.py:39,58` | `resolve_session` `dependencies.py:135` | touch `last_seen_at` | `DELETE /api/sessions` `sessions.py:91` | token-bearer | yes — `expires_at` cutoff `janitor.py:122` |
| **Draft (workspace)** | `imageSlug` (IndexedDB keyPath) | `saveDraft` `draftStorage.ts:21` | `loadDraft`/`listDrafts` `draftStorage.ts:32,55` | `saveDraft` overwrite | `deleteDraft` `draftStorage.ts:44` | client-local (no server) | none — browser-local, never synced |
| **Flag** | `(snapshot_hash, reporter_slug)` unique | `POST /gallery/{hash}/flag` `gallery.py:325` | admin list | — | cascade `gallery.py:289`, `janitor.py:148` | `require_session` | indirect cascade |

### Key inconsistencies (these matter most)

1. **Identity schemes are non-uniform across five styles.** Images/users use a *human slug*; contours/snapshots/gallery use a *content hash*; sessions use a *uuid4*; drafts key on `imageSlug`. A "saved visualization" therefore has no stable, shareable, human-readable handle of its own — the gallery entry borrows `snapshot_hash` (a 64-char sha256), so gallery URLs are opaque hashes while workspace URLs are pretty slugs (`/w/{image_slug}`, `workspace.ts:99`). This is the central CRUD incoherence.
2. **Snapshots have no Update, no Delete, no list, and no owner.** `snapshots.py` exposes only create + get-by-id. An orphan snapshot (created, never published) is unreachable and un-prunable — the janitor only pins snapshots, never deletes them (`janitor.py:46`). Unbounded growth.
3. **Soft-delete vs hard-delete.** *Nothing* is soft-deleted. Every delete is a hard `delete_one`/`delete_many` (`gallery.py:288`, `janitor.py` throughout). No `deleted_at`, no recovery, no audit of cascades except admin actions.
4. **Ownership is inconsistent.** Gallery entries are owned (`user_slug`), but publish accepts an anonymous session (`gallery.py:196` `resolve_session` → `None`), producing `user_slug: None` entries that can never be updated or deleted by anyone except the janitor or an admin. Images, contours and snapshots have *no* owner at all — any user can publish any image's snapshot.
5. **Draft is a parallel, divergent CRUD universe.** The "saved visualization" the user actually iterates on lives only in IndexedDB (`draftStorage.ts`), keyed by `imageSlug`, with a hand-rolled IDB wrapper. It never reaches the server. `WorkspaceDraft.savedSnapshots` is always written as `[]` (`workspace.ts:84`) — a dead field. There is no server-side "my visualizations" list; `listDrafts()` is the only enumeration and it is per-browser.

---

## 2. Slug Audit

`api/slugs.py` is 10 lines: `generate_slug()` → `coolname.generate_slug(4)` (e.g. `big-red-angry-python`).

**Findings:**

- **Generation is random, not deterministic** — fine for opaque identifiers, but it means slugs cannot be derived/recomputed. Contrast with content-hash entities which *are* deterministic. Two parallel philosophies.
- **Collision handling is duplicated and asymmetric.**
  - `image_storage.py:71-73`: bounded retry loop `while await db.images.find_one({"image_slug": slug})`. This is a check-then-insert race (TOCTOU); the real safety net is the `unique` index `database.py:42` + `DuplicateKeyError` catch — but that catch (`image_storage.py:106`) only handles the `sha256` dup, **not** an `image_slug` collision. A slug collision on insert would 500.
  - `sessions.py:48`: user slug from `generate_slug()` is inserted **with no uniqueness check and no retry** (`db.users.insert_one`). `users` has *no unique index on `_id`*... actually `_id` is unique by Mongo default, so a collision raises `DuplicateKeyError` → unhandled 500. coolname's 4-word space is ~10^10 so collisions are rare, but the handling is inconsistent: images retry, users crash.
- **Scalability:** coolname 4-word slug space is large enough for this scale; the linear `find_one` retry in `image_storage.py` is O(1) amortized. No real scaling concern, but the retry should be deleted in favor of relying solely on the unique index + `DuplicateKeyError` (KISS).
- **Slug↔id mapping is consistent only within an entity.** There is no central "slug → entity" resolver; each router re-implements `find_one({"<entity>_slug": ...})`. `SLUG_PATTERN` (`dependencies.py:25`) validates only *image* slugs; `validate_image_slug` is misnamed-as-general and is applied to `imageSlug` path params in `snapshots.py:31`. User slugs are never pattern-validated on `/login` (`sessions.py:67` only `.strip().lower()`), so an arbitrary string hits the DB. Minor, but divergent.
- **Recommendation:** one `slug.py` module owning (a) `generate_slug()`, (b) `validate_slug()` (single pattern, entity-agnostic), (c) `ensure_unique_slug(collection, field)` helper that wraps insert + `DuplicateKeyError` retry once. Apply uniformly to users and images.

---

## 3. value.js Surface & Alignment Gaps

`@mkbabb/value.js` 0.4.6 (`web/node_modules/@mkbabb/value.js/dist/value.d.ts`). Real surface:

**Color (rich, complete):**
- Full color-space class hierarchy: `Color`, `RGBColor`, `HSLColor`, `HSVColor`, `OKLABColor`, `OKLCHColor`, `LABColor`, `LCHColor`, `XYZColor`, `KelvinColor`, P3/Adobe/Rec2020 (`units/color/index.d.ts`).
- Conversions: `hex2rgb`, `rgb2hex`, `rgb2hsl`/`hsl2rgb`, and `color2(color, space)` — universal space conversion (`units/color/utils.d.ts`).
- **`mixColors(c1, c2, p1, p2, space, hueMethod)`** — CSS `color-mix()` semantics, any space.
- **`interpolateHue`**, `gamutMap`, `gamutMapOKLab`, `deltaEOK` (perceptual distance), `isInSRGBGamut`.
- Parsing: `parseCSSColor`, `CSSColor`; named colors via `registerColorNames`.
- Filters: `rgb2ColorFilter` (hex → CSS `filter` chain).

**Math / interpolation:** `lerp`, `logerp`, `clamp`, `scale`, `deCasteljau`, `cubicBezier`, `interpBezier`, `cubicBezierToSVG`.

**Easing:** `timingFunctions` map, all `easeIn/Out*` fns, `cssLinear`/`CSSCubicBezier`, `bezierPresets`, `cubicBezierToSVG`.

### What fourier hand-rolls that value.js already owns

| fourier code | value.js equivalent | Verdict |
|---|---|---|
| `colors.ts:53 hslToHex` | `hsl2rgb` + `rgb2hex` | duplicate — delete |
| `colors.ts:69 rgbToHex` | `rgb2hex` | duplicate — delete |
| `colors.ts:102 hexToRgb` | `hex2rgb` | duplicate — delete |
| `colors.ts:111 hexToRgba` | `hex2rgb` then format (alpha is on `RGBColor`) | thin wrapper acceptable, but build on `hex2rgb` |
| `colors.ts:25 cssVarToHex` hand-parses `hsl()`/bare-triplet/`rgb()` regex | `parseCSSColor` handles all CSS color syntaxes incl. Tailwind | replace the regex bramble with `parseCSSColor` |
| CSS `color-mix(in srgb, …)` literals in `.vue`/CSS (e.g. `EasingPicker.vue:33,65`) | `mixColors` (only needed if computing in JS — CSS literal is fine) | leave CSS as-is |
| `easings.ts` re-derives `EASING_PRESETS` from `timingFunctions` | already delegates ✔ | aligned |
| `easings.ts:91 generateCurveSVGPath`, `:117 easingCurvePath` sample fns into SVG | value.js has `cubicBezierToSVG` but **not** a generic "sample fn → polyline" | **gap in value.js** |

### Gaps *in value.js* that block fuller delegation

1. **No palette/color-scale primitive.** value.js models a single color and mixes *two*. fourier's `VIZ_COLORS.rainbow` (6-stop array) and per-basis color assignment have no value.js home. A `colorScale(stops, t)` / `palette` type is missing.
2. **No "sample easing fn → SVG path / point list"** helper. `cubicBezierToSVG` only covers cubic-bezier; fourier needs it for arbitrary `EasingFn`.
3. **No reactive/theme binding.** `colors.ts` couples color resolution to Vue `reactive` + CSS custom properties. value.js is framework-agnostic (correctly) — so the *reactive shell* legitimately stays in fourier; only the *parsing/conversion* moves.

---

## 4. Convergent CRUD Model — proposal

### 4a. Visualizations as a first-class entity

Today a "visualization" is smeared across: a draft (IDB), a snapshot (server, no slug, no owner, no delete), and a gallery entry (server, owner, slug-borrowed). **Unify into one server entity:** `visualization`.

- `visualization_slug` — its **own** 4-word slug (the shareable handle; `/v/{slug}` replaces both `/w/{image_slug}` and `/gallery/{hash}`).
- `owner_slug` — required (force `ensureUser()` before any save; remove the anonymous-publish path `gallery.py:196`).
- `contour_hash`, `image_slug`, `contour_settings`, `animation_settings` (the snapshot payload).
- `visibility: "private" | "public"` — replaces the publish/gallery split. "Gallery" becomes `find({visibility: "public"})`. Eliminates the duplicate snapshot↔gallery documents and the `_setOnInsert` snapshot dance.
- `views`, `likes`, `liked_ips`, `tier` — move onto this doc.
- `deleted_at: datetime | None` — introduce soft-delete; janitor hard-purges after a grace window.
- TTL: janitor prunes `visibility=private && deleted_at` or stale-by-`last_accessed_at`, unless `tier in {featured, saved}`.

Drafts (`draftStorage.ts`) stay as a *local autosave buffer* only — fine, KISS — but `saveDraft`'s dead `savedSnapshots: []` field (`workspace.ts:84`) should be removed, and an explicit "Save" action should POST a `visualization`. This gives a real server-side "my visualizations" list (`GET /api/visualizations?owner=me`), which the app currently lacks.

This collapses `snapshots` + `gallery` collections into one, gives every saved viz a slug, makes ownership uniform, and adds the missing Update/Delete/List ops — net *less* code.

### 4b. Palettes / colors as a first-class entity (lightweight)

A "palette" is just `{ slug, name, owner_slug, stops: string[], space: ColorSpace }`. Two viable tiers:

- **KISS / recommended now:** keep palettes *client-side and declarative*. Define a `Palette` type in `colors.ts`, store the active palette name inside `AnimationSettings` (add `palette: str` next to `easing: str` in `shared.py:69`). Persisted free with the visualization. No new collection, no new endpoints. value.js does the color math (`mixColors`, `color2`, `interpolateHue`).
- **Only if user-authored palettes are a product requirement:** a `palettes` collection mirroring the `visualization` shape (slug + owner + soft-delete). Do **not** build this speculatively.

### 4c. value.js convergence — 3 concrete moves

1. **Gut `colors.ts` conversion code.** Delete `hslToHex`, `rgbToHex`, `hexToRgb`; reimplement `cssVarToHex` on `parseCSSColor`; reimplement `hexToRgba` on `hex2rgb`. ~60 lines deleted, all CSS-syntax edge cases covered by value.js.
2. **Route all JS-side color blending through `mixColors`/`color2`** in `oklab` space — basis-color tints, the golden-shimmer alpha math (`golden-shimmer.ts:55`), gallery-card gradients. Perceptually-correct, single source of truth.
3. **Upstream two helpers into value.js** (the genuine gaps): `sampleToSVGPath(fn, n)` (generalises `cubicBezierToSVG`; lets fourier delete `generateCurveSVGPath`/`easingCurvePath` from `easings.ts`) and a `colorScale(stops[], t, space)` palette-interpolation primitive. After those land, fourier's `colors.ts`/`easings.ts` shrink to thin re-export + Vue-reactive shells.

---

## 5. Scaling & KISS Findings

### Will not scale as written

1. **In-memory state breaks under >1 replica.** `rate_limiter.py` `SlidingWindowLimiter._buckets` (per-process `OrderedDict`) and `dependencies.py:22` `_suspended_cache` are process-local. With two backend replicas a client gets 2× the rate budget and suspension enforcement is racy for up to 60s per replica. `docker-compose.prod.yml` runs one replica today, so this is *latent*, not live — but it is the first thing that breaks on horizontal scale. KISS fix when needed: a Mongo-backed counter with a TTL index, or accept single-replica and document it. Do **not** add Redis preemptively.
2. **Janitor `$nin` over an unbounded pinned set.** `janitor.py:62,70` build `pinned_contours`/`pinned_images` by scanning *all* snapshots and *all* gallery docs into Python sets, then pass them as `{"$nin": list(...)}`. As snapshots grow, the `$nin` list grows unboundedly — Mongo cannot use an index efficiently for large `$nin`, and the query document itself can blow past the 16 MB BSON limit. Fix: invert the logic — iterate stale candidates and check pin status per-doc, or maintain a `pinned: bool` flag updated on publish/unpublish.
3. **Image blobs stored inline in MongoDB documents** (`image_storage.py:96` `"blob": Binary(content)`, plus a second `thumbnail` Binary). Every image *and* its thumbnail live in the `images` collection. `max_upload_mb` images bloat the working set and every `find_one` without a projection drags the blob into RAM (`get_image_asset` `dependencies.py:33` deliberately, but easy to forget). At scale this is the dominant memory cost. The `storage_budget_gb` eviction (`janitor.py:84`) is a band-aid. KISS-correct fix: GridFS, or filesystem + path — but only when blob volume actually warrants it; flag, don't pre-optimize.
4. **`count_documents` on every gallery list call** (`gallery.py:108`, `gallery.py:170`, even the cursor endpoint). On large collections `count_documents` is O(n). The cursor endpoint shouldn't need a total at all — drop it there.

### Over-engineering / contrivance to trim

- **`compute.py` is a tombstone** — a single comment line `# Compute router removed`. Delete the file.
- **Two gallery pagination endpoints** — offset `GET /api/gallery` (`gallery.py:78`) *and* cursor `GET /api/gallery/cursor` (`gallery.py:124`), with duplicated filter-building logic. The frontend (`gallery.ts`) uses only the cursor variant for infinite scroll; `fetchPage` (offset) is still called by admin actions (`gallery.ts:setTier/deleteEntry`). Consolidate on cursor; the offset endpoint and its 3 compound indexes (`database.py:60-62`) for `views`/`likes` sort can largely go.
- **`extraction_cache_key` `_v: 3`** versioned cache key (`image_storage.py:130`) — fine, but the contour `extraction_cache_key` index is `sparse` while plain editor-saved contours never get one; acceptable, just note it.
- **`store_contour_asset` hashes `sorted(xs), sorted(ys)`** (`image_storage.py:165`) — sorting the coordinate arrays independently means two *different* curves with the same multiset of x's and y's collide to one `contour_hash`. This is a **correctness bug**, not just scaling: hash the path as-ordered (`json.dumps({"x": xs, "y": ys})`).
- **`reject_dollar_keys` middleware re-reads and re-parses the entire body** (`main.py:73`) on every POST/PUT. For small JSON this is fine; for the largest payloads (contour with 1024 points, equation compute) it doubles parse cost. Acceptable at current scale — flag only.

### Genuinely KISS-aligned (no change needed)

- No superfluous cloud services — single MongoDB, single nginx, in-process janitor `asyncio` task (`main.py:42`). Good.
- `docker-compose.prod.yml` has sane memory limits and log rotation.
- MongoDB TLS + auth in prod (`docker-compose.prod.yml`).

### Hard-coded credential — call out

`docker-compose.yml` and `docker-compose.prod.yml` embed the literal MongoDB password (`cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb`) in `MONGO_URI` and the healthcheck. Move to an env var / `.env` (`.env.example` exists). Not a scaling issue but a standing security finding.
