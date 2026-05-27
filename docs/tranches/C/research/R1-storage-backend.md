# R1 — storage-backend survey (tranche C, wave Wα, thread β)

Repo: `fourier-analysis` · Date: 2026-05-27 · Mode: **READ-ONLY research** — this lane produces a written survey + verdict + binding contract; it touches NO source files. The deliverable pair is this document (the survey) and `R-storage-spec.md` (the chosen backend's contract). The implementation is W5's.

Measures against: `C/W0-baseline.md §1.5` (image-blob storage) + `§4` (the brittleness window) — the *binding baseline*, read fresh from the tree on 2026-05-27. Where this lane and `C.md` disagree on a `file:line`, the W0 baseline governs (it already corrected `CA5`'s anchor drift: the inline-blob write moved `:97`→`:104`).

Charter: `C/W0-baseline.md §5` (the R1 row) + `C.md §2` (invariant 18) + `C.md §8` (the window) + `B/research/R-lifecycle-spec.md §6` (the prior storage-redesign deferral that named this work).

## Research-artefact discipline

Every claim traces to a `file:line` citation against the live tree at authoring time. This document does not re-open settled facts (the `pinned`/`last_accessed_at` substrate, the `storage_budget_gb` retirement, the slug TOCTOU lift) — those stand as `CA5`/W0 verified. The substance it adds is the per-backend *atomic-cutover* finding and the KISS-ordered verdict, each grounded in the deployment topology the tree actually carries.

---

## 1. Current state — the inline-Binary-blob substrate (verified)

### 1.1 The two blobs per `images` document

Each `images` document carries **two** inline `bson.Binary` blobs, sha256-deduped:

| Blob | Field | Write site | Read sites | Notes |
|---|---|---|---|---|
| **primary** | `blob: Binary(content)` | `image_storage.py:104` | `image_bytes()` `:141`; `dependencies.py:99` (compute backfill, projected `{blob:1}`) | the original upload bytes; the W5 relocation target named at `C.md §6 gate` |
| **thumbnail** | `thumbnail: Binary(thumb_bytes)` (+ `thumbnail_content_type`) | `image_storage.py:77` (regen on dedup hit), `:92` (fresh insert) | `images.py:148` (`get_image_thumbnail`) | AVIF, `_THUMBNAIL_MAX_DIM=1024` bounded (`:36,:48`); the **second blob** `C.md` invariant 18 now names — W5 must relocate **both** |

The dedup key is `sha256` (a unique index, `database.py:51`); identity is `image_slug` (a unique index, `:50`). Neither is touched by relocation — invariant 18 binds only *where the bytes live*, not *how the row is identified* (`R-lifecycle-spec.md §6.4`: "storage location, not storage identity or referencing").

### 1.2 The retention substrate (already landed — W5 builds on it, does not author it)

- `images` already carries `pinned: bool` + `last_accessed_at` (the B.W3 substrate; `database.py:50-57` builds the `(pinned, last_accessed_at)` compound index at `:57`).
- The janitor recency prune `db.images.delete_many({"pinned": False, "last_accessed_at": {"$lt": cutoff}})` runs against that index (`janitor.py:99-102`, per `CA5 §2.4`). This bounds *staleness*.
- `storage_budget_gb` — both the **config field** and the **eviction pass** — were retired at B.W3 (`config.py:19-24` is a NOTE, not a field; `janitor.py` carries no eviction logic; `CA5 §4.1-4.2`, `W0-baseline.md §1.5`). The W5 gate is the **inline-write relocation + `storage_uri` recording**, never config retirement.
- The per-doc `bytes` field survives "for observability, not eviction" (`config.py:23`). It is the cheap enumeration substrate for invariant 18 (a `count + $sum(bytes)` aggregation over `images` is the bounded total-footprint query — no `du` walk required).

**`CA5 §2.4`'s open caveat, confirmed:** the recency prune bounds *staleness* but **not total footprint** — pinned blobs (referenced by a live visualization) are never pruned, so a large pinned corpus grows the Mongo collection unbounded. That is exactly what relocation fixes: relocation bounds *Mongo document size*; the prune bounds *unreferenced lifetime*. Complementary, not redundant. The relocation is still justified post-B.

### 1.3 The deployment topology (the surface a backend lives in)

This is the load-bearing context for the serving-path question — verified against the live compose + nginx + Dockerfile:

| Surface | Fact | Source |
|---|---|---|
| prod gateway | `nginx:alpine`, `127.0.0.1:8100:80`, loopback-only | `docker-compose.prod.yml:70-72` |
| prod nginx mounts | **only** `./nginx/fourier.conf` (read-only); **no app volume, no shared bytes** | `docker-compose.prod.yml:73-74` |
| backend prod run | `uvicorn --workers ${WORKERS}` (NO `--reload`); runs as unprivileged `app` user | `Dockerfile:18-25` |
| backend dev mounts | `./src`, `./api`, `./assets` bind-mounts; `--reload` | `docker-compose.yml:8-11`, `Dockerfile:16` |
| only named volume today | `mongo_data:/data/db` (Mongo only) | `docker-compose.yml:34,50-51`; `prod.yml:56` |
| nginx → backend | `proxy_pass http://backend:8000` for `/api/`; `→ frontend:80` for `/` | `nginx/fourier.conf:30-44` |
| serving path today | `GET /api/images/{slug}/blob` → `get_image_asset` (`dependencies.py:47`) → `image_bytes` (`image_storage.py:141`) → `StreamingResponse(io.BytesIO(data))` | `images.py:132-140` |

**The single most consequential topology fact:** the prod `nginx` container shares **no filesystem volume** with the `backend` container (`prod.yml:73-74` mounts only the conf). A filesystem backend's bytes would live on a Docker volume mounted into `backend`; for nginx to serve them *directly* (bypassing the app), that **same volume must also be mounted read-only into the `nginx` container** — a one-line compose addition, but it must be named explicitly or the "nginx serves directly" claim is false. This is the per-line cost the verdict must own.

### 1.4 The migration idiom already in the tree (the shape W5's script mirrors)

`api/scripts/migrate_visualization.py` (B.W3.c, 20.8 KB) is the canonical in-repo migration. It is the binding precedent for W5's script shape, verified in full:

- `argparse` `--dry-run` (report-only, no writes) — `:61,:27,:474`.
- `Report` dataclass with counts + a `seed=42` deterministic 10-row spot-check (`:72,:125,:418`).
- `_assert_post_conditions(db)` raising `RuntimeError` on any violation (`:263-271`), live-mode only.
- `assert_count_parity(report)` — `written + skipped == before` (`:447-469`).
- `connect_db()` / `close_db()` bracket; `python -m api.scripts.migrate_visualization` entry (`:70,:474-479`).
- **Idempotency by marker query** — selects only docs lacking the migration marker, so a re-run is a total no-op (`:381` and the header's "first action selects only snapshots whose `_id` does not already carry a marker").
- **One-way clean cutover, NO dual-read layer** — the header states it explicitly: "every `visualizations` row is a pure, offline-computable function of the `(snapshot, gallery?)` pair … so no dual-read layer is needed (forbidden legacy code)." This is the precedent the §4 atomic-cutover finding leans on.
- **`--reload` constraint (L6 chronic #5)** — the header mandates the backfill run STANDALONE against a non-`--reload` backend (`:21-33`). W5's script inherits this constraint verbatim.

---

## 2. Candidate survey (KISS order: filesystem+nginx ⊳ GridFS ⊳ MinIO ⊳ managed-S3)

For each: the new operational surface (invariant-12 cost), the migration shape (both blobs; what `storage_uri` records), the atomic-per-doc-cutover finding (the §4-window determinant), and the serving path.

### 2.1 Candidate 1 — Filesystem + nginx static serve

**New operational surface (invariant-12 cost):**
- **No new container.** nginx is already the prod gateway (`prod.yml:70`); the backend already runs as the `app` user with a writable `/app` (`Dockerfile:18-25`).
- **One new named Docker volume** — e.g. `image_blobs:/data/blobs`, mounted into `backend` (read-write) and, **if nginx serves directly**, into `nginx` read-only (`prod.yml:73-74` today mounts only the conf — this is the one explicit addition). This is the entire infra delta.
- **One new config field** — `blob_dir: str = "/data/blobs"` on `Settings` (`config.py`), mirroring `max_upload_mb` (`:11`). No credential, no external dependency, no ongoing cost.
- **Backup surface:** the volume joins `mongo_data` as a thing to back up. Today the only stateful volume is `mongo_data` (`prod.yml:56`); a second is a documented, not hidden, cost.

**Migration shape (both blobs):**
- Per `images` doc, write the primary bytes to `<blob_dir>/<image_slug>` and the thumbnail to `<blob_dir>/<image_slug>.thumb` (or a `thumb/` subdir), `$set` `storage_uri` + `thumbnail_uri`, `$unset` `blob` + `thumbnail` — all in **one `update_one`** per document.
- `storage_uri` records a **backend-relative** key, not a host path: `storage_uri: "fs:<image_slug>"` (and `thumbnail_uri: "fs:<image_slug>.thumb"`). Backend-relative keys keep the host path out of the database (per `CA5 §2.3`) and survive a volume remount.
- The file write is a **pure function of the existing Mongo `Binary`** (read bytes → write file). The thumbnail relocates alongside the primary in the same per-doc update — invariant 18's "thumbnail is a second blob" is satisfied.
- Re-run no-ops on docs that already carry `storage_uri` (the idempotency-by-marker idiom, `migrate_visualization.py:381`).

**Atomic per-document cutover — YES.** This is the key finding. Per document the cutover is:
1. read `blob` (+ `thumbnail`) from Mongo,
2. write file(s) to the volume (a pure, retryable function of the bytes),
3. `update_one` that **atomically** `$set`s `storage_uri`/`thumbnail_uri` and `$unset`s `blob`/`thumbnail`.

Mongo guarantees the single-document `update_one` is atomic. The window in which a document holds both `blob` and `storage_uri` is exactly the duration of one `update_one` — sub-millisecond, doc-by-doc — so the **`blob` XOR `storage_uri` post-condition holds document-by-document** at all times. There is no span where a *reader* must consult two backends: the read shim resolves by presence (`storage_uri` present → file; else `blob`; never a fork that outlives the cutover). **No dual-read compatibility layer is required**, hence none is left past cutover — which is what invariant 3 (no legacy code) and `C.md §6` ("a dual-read compatibility layer left in place 'for safety'" is an invalid gate) demand. The §8 brittleness window is **removed**.

This confirms `CA5 §2.1-2.2`'s ranking with concrete evidence, not a rubber-stamp: the atomicity rests on (a) Mongo single-doc atomic `update_one`, (b) the file write being a pure function of bytes that already exist, and (c) the backend being volume-local so the write cannot partially fail across a network. All three are verifiable in the tree topology (§1.3).

**Serving path:** Two honest variants, in KISS order:
- **(a) App-served (DEFAULT).** `GET /api/images/{slug}/blob` resolves `storage_uri` → reads `<blob_dir>/<image_slug>` → `FileResponse` (FastAPI's `starlette.responses.FileResponse`, which streams and sets `Content-Length`/conditional headers) replacing today's `StreamingResponse(io.BytesIO(...))` (`images.py:136`). The route, auth (`get_image_asset` 404 + `touch_document`, `dependencies.py:47-55`), and `Cache-Control` (`images.py:139`) are **unchanged** — only the byte source moves from `asset["blob"]` to the file. This is the smallest delta and keeps the `last_accessed_at` touch + slug validation on the request path.
- **(b) nginx-direct (offered, NOT defaulted).** A `location /blobs/ { alias /data/blobs/; }` in `fourier.conf` serving the volume directly bypasses the Python app for the bytes. This requires the volume mounted into the nginx container (§1.3) AND surrenders the per-request `last_accessed_at` touch + the 404-on-missing-row check + slug validation (the bytes become reachable by guessing the path). Per invariant 12 and the single-replica posture, the app-served path (a) is sufficient — the bytes are already `Cache-Control: public, max-age=86400` (`images.py:139`), so the upstream host reverse proxy caches them; bypassing FastAPI saves a negligible amount on a single-replica host while losing the access-time touch the retention prune depends on. **Verdict defers (b)** to a future wave only if blob-serving throughput is ever measured to be a bottleneck (it is not today — there is no benchmark in the tree showing the StreamingResponse is hot). The spec contracts (a).

### 2.2 Candidate 2 — GridFS

**New operational surface:** None new — GridFS is native Mongo (chunked binary store in `fs.files` + `fs.chunks` collections). No container, no dependency, no credential.

**Migration shape (both blobs):** Per doc, `GridFSBucket.upload_from_stream(image_slug, blob)` → `storage_uri: "gridfs:<file_id>"`; same for the thumbnail. `$unset` the inline `blob`/`thumbnail`.

**Atomic per-document cutover — NO (and this is the disqualifier).** GridFS upload writes to *other collections* (`fs.files`, `fs.chunks`) in a separate operation from the `images.update_one` that flips the field. On a single-replica deployment **without a transaction wrapping the two**, there is a window per document where the upload landed but the field flip has not — recoverable, but not the single-atomic-`update_one` the filesystem path gives. More fundamentally, **GridFS keeps the bytes in Mongo** — the very thing C exists to relocate (`C.md §1`, `R-lifecycle-spec.md §6.3` calls it "only a half-move"). It does not satisfy invariant 18's intent (bytes out of inline-Mongo into a *bounded, observable* backend); it just moves them from one Mongo collection to two. The total-footprint bound (§1.2) is no better than the inline case — the bytes still inflate Mongo's `mongo_data` volume. **Rejected: solves none of the problem at a non-zero migration cost.**

**Serving path:** `GET …/blob` → `GridFSBucket.open_download_stream` → `StreamingResponse`. Roughly the current shape with a different source. nginx cannot serve GridFS directly (it is not a file).

### 2.3 Candidate 3 — MinIO (self-hosted S3-compatible)

**New operational surface (invariant-12 cost — must be per-line justified; there is no justification):**
- **+1 container** — a `minio` service in `docker-compose.prod.yml`, on `app-network`, with its own resource limits + restart policy + logging block (mirroring the four services there today).
- **+1 named volume** — MinIO's object store (`minio_data:/data`), in addition to `mongo_data`.
- **+2 credentials** — `MINIO_ROOT_USER` + `MINIO_ROOT_PASSWORD` (or access/secret keys), each entering the compose env as `${…:?}` — re-opening the secrets surface W1/W2 just closed (`W0-baseline.md §1.3`).
- **+1 SDK dependency** — `boto3`/`minio` Python client in `pyproject.toml [web]`.
- **+memory budget** on a single-replica 2 GB-backend / 512 MB-mongo / 128 MB-nginx host (`prod.yml:14,63,81`) — MinIO's resident footprint competes with the compute workers.

**Migration shape:** `put_object(bucket, image_slug, blob)` per doc; `storage_uri: "s3://fourier-images/<image_slug>"`; same for thumbnail. `$unset` inline fields.

**Atomic per-document cutover — NO.** The object PUT is a **network call to a separate service**; it completes seconds before (and independently of) the `images.update_one` field flip. A backfill of N objects is N network round-trips, not N atomic per-doc updates — the cutover spans the whole backfill, during which a reader could hit a doc whose object landed but whose field has not flipped (or vice-versa on partial failure). This **requires the §8 dual-read window** (`CA5 §2.2`: "MinIO / S3 — dual-read REQUIRED during backfill"). And a dual-read layer left past cutover is the legacy code invariant 3 forbids — so MinIO forces exactly the brittleness the filesystem path avoids.

**Serving path:** `GET …/blob` → presigned URL redirect OR proxy-stream from MinIO. nginx cannot serve it directly without a proxy_pass to the MinIO service (another upstream).

**Verdict: rejected.** S3-API forward-compatibility is a benefit *only if a multi-replica or multi-host future is real* — and invariant 19 explicitly preserves the single-replica posture and forbids horizontal scaling in C (`C.md §2 inv 19`; "Multi-replica fourier deployment — out of scope," `§7`). There is no consumer for the forward-compat. This is the "library/infra nobody calls" anti-pattern. Wχ-P1 must reject it absent per-line justification; this survey finds none.

### 2.4 Candidate 4 — Managed S3 (Cloudflare R2 / AWS S3 / Backblaze B2)

**New operational surface:** an **external dependency + ongoing monetary cost** + a credential pair + an SDK. `C.md §7` already pre-names this as an emitted cost concern ("If Wα-R1 selects a managed-S3 backend, C emits an ongoing-cost concern"). Invariant 12's "no superfluous cloud" gate (`R-lifecycle-spec.md §4.1 option C` rationale) default-rejects it.

**Migration shape / atomic cutover / serving:** identical non-atomic shape to MinIO (§2.3) — network PUT decoupled from the field flip → **dual-read REQUIRED** → the §8 window opens. Plus the cost.

**Verdict: rejected.** The single-replica host has no scaling pressure that a CDN-backed object store relieves; the upload corpus is bounded by the recency prune + (now) relocation; the bytes are already cacheable at the host's outer reverse proxy (`Cache-Control: public, max-age=86400`, `images.py:139`). Managed S3 buys nothing the host does not already have, at recurring cost. Default-reject per invariant 12.

---

## 3. Decision matrix

| Backend | New container | New dependency | New credential | Ongoing cost | Atomic per-doc cutover | §8 window | Relocates bytes out of Mongo | Verdict |
|---|---|---|---|---|---|---|---|---|
| **Filesystem + nginx** | none | none | none | none | **YES** | **removed** | **yes** | **CHOSEN** |
| GridFS | none | none | none | none | no (cross-collection) | required | **no (half-move)** | rejected — solves nothing |
| MinIO | +1 | +1 SDK | +2 | host memory | no (network) | required | yes | rejected — surface inflation, no consumer |
| Managed S3 | none | +1 SDK | +2 | **$/mo** | no (network) | required | yes | rejected — superfluous cloud |

---

## 4. The atomic-cutover finding (the key question) — confirmed

**The §4/§8 brittleness window is determined entirely by the backend's cutover atomicity, and only filesystem+nginx admits an atomic per-document cutover.**

The proof rests on three tree-grounded facts:

1. **Mongo single-document `update_one` is atomic** — the field flip `{$set: {storage_uri}, $unset: {blob}}` either fully applies or does not. (Mongo's documented single-document atomicity guarantee; no multi-doc transaction needed, consistent with the migration idiom `migrate_visualization.py` header's "one `$set`-shaped document — H-W3-1(c)" atomic-marker discipline.)
2. **The file write is a pure, retryable function of bytes that already exist in Mongo** — relocation reads `asset["blob"]` (the bytes are present pre-cutover) and writes them to a volume-local path. No new information is synthesised; a crash mid-backfill re-runs the unconverted docs with no data loss (the bytes remain in Mongo until the per-doc flip). This is exactly the "pure, offline-computable function … no dual-read layer needed" property `migrate_visualization.py`'s header establishes as the clean-cutover bar.
3. **The backend is volume-local, not networked** (§1.3) — the write cannot partially fail across a network boundary the way a MinIO/S3 PUT can. The file is on the same host the `update_one` runs against.

Therefore: write file → set `storage_uri` → unset `blob`, **per document, atomically**, with the read shim resolving by `storage_uri`-presence. The corpus converges document-by-document; at no instant does a reader need both backends; no compatibility layer outlives the cutover. **The window is removed**, matching the prose at `C.md §8` ("If Wα-R1 selects the filesystem backend … the window is removed at Wχ close") and `W0-baseline.md §4`.

**Refutation attempt (the honest adversarial check, NOT a rubber-stamp):** could the filesystem cutover *fail* to be atomic? The only failure mode is a crash *between* the file write (step 2) and the field flip (step 3): a file exists on disk but the doc still carries `blob`. This is **not** a dual-read hazard — it is a harmless orphan file (the doc still serves from `blob`; the re-run overwrites the orphan file deterministically since the path is `image_slug`-keyed and the bytes are identical). The post-condition `blob XOR storage_uri` is never violated *in the database* (the field flip is atomic); only an idempotent, self-healing disk orphan can occur. The verification harness's count-parity + the idempotent re-run discharge it. **The atomicity claim survives the refutation.** Wχ-P3 tests this directly; this lane confirms the claim is sound.

---

## 5. KISS-ordered verdict

**Chosen backend: Filesystem + nginx static serve, app-served variant (§2.1a).**

Per-line invariant-12 justification for the chosen surface (every new surface line accounted for):

- **+1 named Docker volume `image_blobs`** — justified: bytes must live somewhere off the Mongo document; a host-local volume is the smallest store that is not Mongo. It joins `mongo_data` as a backup surface (one added line in any backup runbook).
- **+1 config field `blob_dir`** — justified: the write path must be configurable per environment (dev bind-mount vs prod volume), mirroring `max_upload_mb` (`config.py:11`). No secret.
- **NO new container** — the backend writes the files; the app serves them. nginx is untouched in the default variant.
- **NO new dependency** — `pathlib`/`os` + `FileResponse` are stdlib/FastAPI-native.
- **NO new credential, NO ongoing cost** — the disqualifying surfaces of MinIO/S3 are entirely absent.

Anything above filesystem (GridFS, MinIO, S3) is rejected with the per-line cost itemised in §2.2–2.4: GridFS solves none of the problem (half-move, still in Mongo); MinIO inflates the operational surface (+container, +2 credentials, +SDK, +memory) for a forward-compat no consumer needs and forces the dual-read window; managed S3 adds recurring cost and the same forced window. The single-replica posture (invariant 19) removes every benefit the heavier backends offer.

**The verdict confirms `CA5`'s ranking by independent evidence** — the atomic cutover is real (§4 proof), the topology supports the app-served path with zero new container (§1.3), and the brittleness window is genuinely removable. It is not a rubber-stamp: the survey separately establishes (a) GridFS's non-atomicity from its cross-collection write, (b) the nginx-direct variant's loss of the `last_accessed_at` touch (so the spec contracts the app-served variant, refining `CA5`'s "nginx static serve" headline), and (c) the explicit per-line volume-mount cost `CA5` glossed.

**The binding contract for W5 is in `R-storage-spec.md`.**

---

## 6. Citation summary (load-bearing)

- `api/services/image_storage.py:104` — `"blob": Binary(content)` (the primary-blob write; the W5 deletion-proof target).
- `api/services/image_storage.py:77,92` — `thumbnail: Binary(...)` (the second blob; relocate both).
- `api/services/image_storage.py:36,48` — `_THUMBNAIL_MAX_DIM=1024`; thumbnail is AVIF.
- `api/services/image_storage.py:139-143` — `image_bytes(asset)` — the read shim / migration boundary.
- `api/routers/images.py:132-140` — `GET /{imageSlug}/blob` → `StreamingResponse(io.BytesIO(data))`.
- `api/routers/images.py:143-156` — `GET /{imageSlug}/thumbnail` (serves `doc["thumbnail"]`, falls back to blob).
- `api/dependencies.py:47-55` — `get_image_asset` (404 + `touch_document` access-time touch).
- `api/dependencies.py:91-100` — compute backfill reads `{blob:1}` (a second blob consumer).
- `api/services/database.py:50-57` — `images` indexes incl. `(pinned, last_accessed_at)` at `:57`.
- `api/services/janitor.py:99-102` — recency prune (the staleness bound; `CA5 §2.4`).
- `api/config.py:11` — `max_upload_mb` (config-field precedent); `:19-24` — `storage_budget_gb` retirement NOTE.
- `docker-compose.prod.yml:70-74` — nginx mounts only the conf (no shared blob volume); `:14,63,81` — memory limits; `:56` — `mongo_data` the sole stateful volume.
- `docker-compose.yml:8-11,34,50-51` — dev bind-mounts; `mongo_data` named volume.
- `api/Dockerfile:16,18-25` — dev `--reload`; prod `--workers`, unprivileged `app` user.
- `nginx/fourier.conf:30-44` — `proxy_pass` blocks (no static-asset location today).
- `api/scripts/migrate_visualization.py:21-33,61,72,263-271,381,447-479` — the in-tree migration idiom (dry-run, spot-check, post-conditions, count-parity, idempotent-by-marker, standalone-non-reload, no-dual-read).
- `docs/tranches/C/W0-baseline.md §1.5,§4` — binding baseline (image-blob storage + window).
- `docs/tranches/C/C.md §2 (inv 18,19), §6, §7, §8` — invariants + gates + window.
- `docs/tranches/B/research/R-lifecycle-spec.md §5.1,§6.3,§6.4` — migration discipline + the named deferral.
- `docs/audits/runs/2026-05-27-C-audit/CA5-storage-infra-audit.md §2.1-2.4,§4` — the prior ranking this lane confirms.
