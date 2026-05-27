# CA5 — Storage + Infra Audit (tranche-C DEVELOPMENT, planning lane)

**Lane**: CA5 · **Date**: 2026-05-27 · **Mode**: READ-ONLY ground-truth +
ONE deliverable. No source edits, no commits.
**Charter**: validate + refine C's existing infra + image-blob storage scope
against live code; correct `C.md`'s anchors; settle the storage-backend
verdict; confirm the infra hygiene reality; locate the `--reload` chronic item.

All `file:line` citations below are verified against the live tree at audit
time (not against `C.md` or the 60-day-old `project_infra_plan.md`).

---

## §1 — `C.md` anchor-reconciliation table

| `C.md` claim | Actual live state | Verdict |
|---|---|---|
| `image_storage.py:97` writes `Binary(content)` to the doc (`§1`, `§5`, `§6 gate`) | The inline-blob write is at **`api/services/image_storage.py:104`** (`"blob": Binary(content)`). Line 97 is now a `logger.warning` inside the thumbnail-generation `except`. | **DRIFT** (line number; the write still exists) |
| `image_storage.py` slug issuance via a check-then-insert TOCTOU loop | Already lifted to **`slug_with_retry`** (insert-then-catch `DuplicateKeyError`) at `image_storage.py:24,118-135`; the carve note (B.W3.3) documents it. The `R-lifecycle-spec.md §5.3` template's "unique-slug retry (matches `image_storage.py:76` idiom)" comment is itself stale. | **DRIFT** (already converged at B; C.W4 builds on `slug_with_retry`, not a TOCTOU loop) |
| `janitor.py:84-119` is the `storage_budget_gb` eviction band-aid (`§1`, `§6 gate`, `§7`) | The eviction **pass is GONE**. `janitor.py` has no `storage_budget_gb` reference at all — only the **docstring NOTE** at `janitor.py:28-34` records the retirement. Lines 84-119 are now the pin-recompute (`_recompute_pin_flags`) + the recency prune + session/user cleanup. | **DRIFT** (band-aid retired at B.W3; CA2 confirmed; C.md citation points at unrelated code) |
| `storage_budget_gb` config field is NOT retired by B (`§7`: "B did **not** retire `storage_budget_gb` config — only the eviction *pass*") | **WRONG.** The config **FIELD is retired** — `api/config.py:19-24` is a NOTE comment, not a field. `grep storage_budget_gb api/config.py` returns only the comment. The hard gate "`api/config.py` does not define `storage_budget_gb`" (`§6`) is **already satisfied**. | **DRIFT — load-bearing.** Changes C.W4's gate (see §2) |
| `docker-compose.prod.yml:8` `tlsAllowInvalidCertificates=true` (`§1`, `§2`, goal-criterion) | **CONFIRMED at line 8** — inside the backend `MONGO_URI`: `...&tls=true&tlsAllowInvalidCertificates=true`. Also present in the mongo healthcheck (`:53`) and the server runs `--tlsAllowConnectionsWithoutCertificates` (`:48`). | **CONFIRMED** (and broader than the single line C.md cites — see §3) |
| `scripts/deploy.sh` is the manual SSH push (`§1`, goal-criterion, `§5`, `§6 gate`) | **CONFIRMED.** 42-line bash; `ssh -p 1022 mbabb@mbabb.fridayinstitute.net`; `git push origin master` → remote `git reset --hard origin/master` → `docker compose build` → `up -d` → health check. | **CONFIRMED** (plus a stale-port bug — see §3) |
| prod port 8100, SSH-tunnel 1022, "host-bound prod gateway at port 8100" (`§1`) | **CONFIRMED.** `docker-compose.prod.yml:72` binds `127.0.0.1:${HTTP_PORT:-8100}:80`. SSH 1022 confirmed in `deploy.sh:8`. Matches `project_infra_plan.md` 10-port block (fourier 8100). | **CONFIRMED** |
| `pinned`/`last_accessed_at` recency prune is the storage bound (`§2 inv 18`) | **CONFIRMED.** `janitor.py:99-102` deletes `{"pinned": False, "last_accessed_at": {"$lt": cutoff}}` via `_delete_images_and_cascade`; the `(pinned, last_accessed_at)` compound index exists at `database.py:57`. | **CONFIRMED** |
| `R-lifecycle-spec.md §6.3` candidate set (filesystem+nginx > GridFS > MinIO > S3) (`§1`, `§3`, `Wα-R1`) | **CONFIRMED** present in the cited section, KISS-ordered. | **CONFIRMED** |
| `database.py` still creates `snapshots`/`gallery` indexes (legacy collections) | **CONFIRMED.** `database.py:67-69` (`snapshots`) and `:82-93` (`gallery`) still build indexes; the janitor still cascades to `db.gallery` (`janitor.py:139,265`) and the migration still reads `snapshots`/`gallery`. Legacy collections are **retained until B.W5 close** as the migration rollback substrate. | **CONFIRMED** (and a residual — see §4) |

**Net**: of C.md's load-bearing anchors, **two file:line citations drifted**
(`image_storage.py:97`→`:104`; `janitor.py:84-119` no longer the band-aid),
and **one factual claim is wrong** (`§7`: "B did not retire `storage_budget_gb`
config" — it did). The wrong claim is the consequential one: it inflates
C.W4's gate.

---

## §2 — Image-blob storage-architecture refinement

### 2.1 Candidate backends, KISS-ranked (invariant 12)

`R-lifecycle-spec.md §6.3`'s ordering holds against live code; CA5 ratifies it
with the live-infra evidence:

| Rank | Backend | New infra? | Why (invariant 12) |
|---|---|---|---|
| **1 (default verdict)** | **Filesystem + nginx static serve** | **None.** nginx is already deployed (`nginx/fourier.conf`); a `location /blobs/` alias + a Docker volume is the entire delta. | Zero new container, zero external dependency, zero ongoing cost. The enumeration query (invariant 18) is `du -sb` on the volume OR a bounded `count + sum(bytes)` over `images` (the `bytes` field already survives "for observability" per `config.py:23` + `janitor.py` NOTE). Atomic cutover possible (see 2.2). |
| 2 | GridFS | None (still Mongo). | Native binary chunked store; but keeps the bytes in Mongo (the very thing C exists to relocate) and loses the projection-leakage benefit. Only a half-move. |
| 3 | MinIO | **One new container.** | S3-API forward-compat, self-hosted. Challenge probe P1 must reject unless per-line justified — it introduces operational surface for a single-replica host. Forces a dual-read window (non-atomic backfill). |
| 4 | Managed S3 (R2/B2/AWS) | External dependency + **ongoing cost**. | `C.md §7` already names this as an emitted cost concern; invariant 12's "no superfluous cloud" gate. Default-reject. |

**Verdict: filesystem + nginx static serve.** It is the only candidate that
introduces neither a container nor an external dependency, and it is the only
one that admits an atomic cutover (which removes C's sole brittleness window).
Wα-R1 should confirm, not re-open.

### 2.2 Migration shape per backend (atomic vs dual-read)

- **Filesystem (chosen)** — **ATOMIC.** Same idiom as
  `api/scripts/migrate_visualization.py`: idempotent, standalone, run against
  a backend-stopped (or non-`--reload`) process. Per blob: write
  `<volume>/<image_slug>` from the Mongo `Binary`, set `storage_uri` on the
  doc, `$unset` the `blob` field — all in one `update_one`. Re-run no-ops on
  docs that already carry `storage_uri`. Because the file write is a pure
  function of the existing Mongo bytes and the field flip is per-document,
  **no dual-read layer is needed** — the `§8` brittleness window is removed at
  Wχ close (matching the prose at `C.md:269-271`).
- **GridFS** — atomic-ish (still inside Mongo's transactional reach on a
  single replica); same per-doc flip.
- **MinIO / S3** — **dual-read REQUIRED** during backfill (network backfill is
  not atomic per-doc); the `§8` window opens with a named restoration commit.

The migration MUST follow the three-artefact discipline (`R-lifecycle-spec.md
§5.1`): backfill + verification harness (count parity: pre = post + skipped;
spot-check 10 byte-identical) + completeness proof. The Mongo `blob` field is
the rollback substrate, kept until C close.

### 2.3 `storage_uri` field design (invariant 18)

- Field: `storage_uri: str` on the `images` document — backend-relative, not
  absolute (e.g. `"fs:<image_slug>"` or just `<image_slug>`), so the backend
  identity is recordable without leaking host paths.
- **Mutual exclusion invariant**: a doc has `blob` XOR `storage_uri` (the
  verification harness asserts "never both" per `R-lifecycle-spec.md §6.3`).
  During an atomic FS migration the window where both exist is a single
  `update_one`, so the post-condition holds doc-by-doc.
- The thumbnail (`thumbnail: Binary` at `image_storage.py:77,92`) is a
  **second blob** C.md does not name — the migration must relocate it too (or
  explicitly scope it as Mongo-resident). CA5 flags this for Wα-R1: the
  `_generate_thumbnail` path and `thumbnail`/`thumbnail_content_type` fields
  are co-located with the primary blob and share its storage problem.
- `image_bytes(asset)` (`image_storage.py:139-143`) is the **migration
  boundary** — it becomes the read-from-backend shim;
  `GET /api/images/{slug}/blob` serves from there.

### 2.4 Does the recency-prune already provide the bound C.W4 claims?

**Yes, for the *count* of unreferenced blobs.** The
`{pinned: False, last_accessed_at: {$lt: cutoff}}` prune (`janitor.py:99-102`,
indexed at `database.py:57`) already bounds how long an unreferenced image
lives. **But it does not bound total footprint** — pinned images
(referenced by a live visualization) are never pruned, so a large corpus of
pinned blobs grows unbounded inside Mongo. That is precisely what relocation
(invariant 18's "enumerable by a single bounded query") fixes: the recency
prune bounds *staleness*, relocation bounds *Mongo document size*. They are
complementary, not redundant. C.W4's relocation is still justified; the
`storage_budget_gb` eviction it replaces is already gone, so W4 is
"relocate + drop the inline write," not "relocate + retire eviction."

---

## §3 — Infra hygiene reality

### 3.1 `deploy.sh` shape (CONFIRMED + a bug)

42-line bash, `set -euo pipefail`. `git push origin master` →
`ssh -p 1022 mbabb@mbabb.fridayinstitute.net` → remote
`git fetch && git reset --hard origin/master` →
`docker compose -f docker-compose.yml -f docker-compose.prod.yml build --parallel`
→ `up -d` → `sleep 5` → `ps` → health check.

**Bug (C.W0/W1 should note):** the health check curls
**`http://localhost:8091`** (`deploy.sh:38-39`), but prod nginx binds
**8100** (`docker-compose.prod.yml:72`). The health check is checking a dead
port — it "passes" via the `|| echo` fallback regardless. `project_infra_plan.md`
is also 60 days stale (CA2 §1 flags this; the plan predates the 8100 binding).
**C.W0 must re-baseline against live `docker-compose*.yml`, not the memory
file.** C.W1/W2 scope (retire `deploy.sh`, webhook receiver, secret
extraction) is **still valid as scoped** — the file exists and is the manual
push C.md describes.

### 3.2 TLS posture (CONFIRMED — broader than C.md's one line)

The unfaithful TLS is **three sites**, not one:
1. `docker-compose.prod.yml:8` — backend `MONGO_URI` has
   `tls=true&tlsAllowInvalidCertificates=true` (the line C.md cites).
2. `docker-compose.prod.yml:53` — the mongo **healthcheck** also passes
   `--tlsAllowInvalidCertificates`.
3. `docker-compose.prod.yml:48` — mongod runs
   `--tlsAllowConnectionsWithoutCertificates` (server-side laxity).

**Plaintext-secret posture**: prod uses `${MONGO_PASSWORD:?...}` (refuses to
start if unset) — **no committed literal**; the prod compose is clean. The
**dev** compose (`docker-compose.yml`) and `.env.example` carry the
`fourier-dev-only` sentinel (intentional dev default, not a prod leak). So
C.W2's "secrets out of compose" gate is largely **already met for prod** — the
real W2 work is the three `tlsAllowInvalid*` flags + a verified cert issuer.
The SSL material is bind-mounted (`./ssl/mongo.pem`, `./ssl/mongo-ca.pem` at
`:57-58`), so a CA + cert provisioning story (Wα-R3) is the substrate.
C.W2 scope is **still valid**, with the cited anchor widened from one line to
three.

### 3.3 Port map (CONFIRMED)

| Surface | Port | Source |
|---|---|---|
| Prod nginx gateway | `127.0.0.1:8100:80` | `docker-compose.prod.yml:72` |
| Prod mongo | `27017:27017` | `docker-compose.prod.yml:41` |
| Dev backend | `${API_PORT:-8000}:8000` | `docker-compose.yml` |
| Dev frontend | `${WEB_PORT:-3000}:3000` | `docker-compose.yml` |
| SSH deploy tunnel | `1022` | `deploy.sh:8` |
| Stale health-check port (BUG) | `8091` | `deploy.sh:38-39` |

Matches `project_infra_plan.md`'s fourier 8100 block. The 8091 reference is
the lone drift; `.env.example:40` correctly documents 8100.

### 3.4 Janitor audit-log gap (CONFIRMED — C.W3 valid)

The janitor's `delete_many` calls **do not emit `admin_audit` rows**. It
`logger.info`s counts (`janitor.py:74,97,103,115,...`) but writes nothing to
the `admin_audit` collection — it only *prunes* that collection at
`janitor.py:166-170`. The `admin_audit` substrate + indexes exist
(`database.py:130-131`), and admin actions DO log there (per
`R-lifecycle-spec.md §3.2`). So C.W3's gate — "every janitor `delete_many`
writes an `admin_audit` row with category, count, cutoff" — addresses a **real
gap**. C.W3 scope is **still valid as scoped**. (Recovery hardening: the
6-hour `asyncio.sleep` loop at `janitor.py:50-57` has no checkpoint; a mid-cycle
death re-runs the whole pass next wake — idempotent today, but C.W3's
recovery-test claim is honest.)

---

## §4 — What B already did that shrinks C's scope

1. **`storage_budget_gb` config FIELD retired** (`config.py:19-24` is a NOTE).
   → C.W4's hard gate "`api/config.py` does not define `storage_budget_gb`" is
   **already satisfied**. C.W4 retires only the *inline blob write*
   (`image_storage.py:104`) + the surviving comment, not the field. The
   `C.md §7` claim "B did not retire the config" is **factually wrong** and
   must be corrected at charter harden.
2. **The eviction PASS is gone** (`janitor.py` carries no eviction logic).
   → C.W4 is "relocate + drop inline write," not "relocate + retire eviction."
3. **The unbounded `$nin` retired; `pinned` flag landed** (A.W4 retired `$nin`;
   B.W3 re-rooted the pin recompute onto `visualizations`,
   `janitor.py:173-248`). The `(pinned, last_accessed_at)` indexes exist for
   `images`/`contours`/`visualizations` (`database.py:57,65,122`).
   → C.W4 inherits a `pinned`/`last_accessed_at`-bearing `images` collection;
   it does **not** re-introduce a `$nin` query, and the recency prune is the
   already-shipped storage bound (it bounds staleness; relocation bounds size —
   §2.4).
4. **Slug TOCTOU retired** — `slug_with_retry` (`image_storage.py:24,118-135`).
   → C.W4's `image_storage.py` touch is the blob-write site only; the slug
   path is settled.
5. **Prod secrets already env-only** (`${MONGO_PASSWORD:?...}`) — no committed
   literal in prod compose. → C.W1/W2's "secrets out of compose" is largely
   met for prod; the residual is the TLS flags, not the password.

**Residual B left for C (not a shrink):** the legacy `snapshots`/`gallery`
collections + their indexes (`database.py:67-69,82-93`) and janitor cascades
(`janitor.py:139,265`) are **retained until B.W5 close** as the migration
rollback substrate. If B.W5 has closed (per the recent
`docs(B.W5): close tranche B` commit), C.W0 should confirm whether the legacy
collections were dropped at close or carried into C; the gallery-cascade code
in the janitor is dead weight once they're gone.

---

## §5 — The `--reload`-aborts-compute chronic item (CA2's missing-from-C item)

**Located + confirmed.** `uvicorn --reload` runs in the **development** Docker
stage: `api/Dockerfile:16`
`CMD ["uv","run","uvicorn","api.main:app",...,"--reload"]` and in
`scripts/dev.sh:74-76` (`--reload --reload-dir api --reload-dir src`). The
**production** stage (`api/Dockerfile:25`) correctly uses `--workers` with no
`--reload`, so this is a **dev-ergonomics** chronic, not a prod outage.

The failure mode is documented in-tree at
`api/scripts/migrate_visualization.py:21-33` ("`--reload` constraint (W3.24)"):
embedding a long backfill in a `--reload` process gets interrupted mid-pass on
every file-watch reload, named there as **"L6 chronic-residual #5."** Generalised:
any in-flight compute (extract-contour / epicycles / bases — the
`nginx/fourier.conf:19` compute routes, `proxy_read_timeout 120s`) is aborted
when a source edit triggers a reload, surfacing to the browser as
`ERR_EMPTY_RESPONSE`. CA2 §3 confirms this is the **one CHRONIC item C's stub
never mentions** (A.W3.5 → routed-C across 2 gates, kept open).

### Proposed C destination

**Fold into C.W0 (infra-baseline) as a recorded finding + a C.W3 sub-task.**
Rationale:
- It is an **infra/deploy** concern (the run command + dev container shape),
  so it is legitimately C-bound, matching CA2 §2's disposition.
- It does NOT fit W4 (storage) and is too small for its own wave.
- W3 ("recovery hardening") is the natural home — the same wave that gives the
  janitor recovery semantics can harden the dev-compute lifecycle.
- **Two honest remedies** (per `L6 §5` / CA2 §3 thread γ): (a) the minimal
  fix — narrow/disable `--reload` on the compute path or scope `--reload-dir`
  to exclude long-compute modules; (b) the principled fix — move compute to a
  background task/queue so a reload does not sever an in-flight request.
  C.W0 records it; C.W3 lands remedy (a) as the KISS default (invariant 12),
  naming (b) as deferred-if-needed.

This is the single chronic item C silently dropped; folding it discharges the
DEVELOPMENT directive's "chronically deferred" clause for the dev-ergonomics
axis. **C.W3 scope should be amended to include it.**

---

## Appendix — verified citation index (live tree, audit time)

- `api/services/image_storage.py:104` — `"blob": Binary(content)` (was `:97`).
- `api/services/image_storage.py:77,92` — thumbnail `Binary` (second blob).
- `api/services/image_storage.py:24,118-135` — `slug_with_retry`.
- `api/services/image_storage.py:139-143` — `image_bytes` (migration boundary).
- `api/services/janitor.py:28-34` — `storage_budget_gb` retirement NOTE.
- `api/services/janitor.py:99-102` — recency prune (the bound).
- `api/services/janitor.py:50-57` — 6h loop, no checkpoint.
- `api/services/janitor.py:139,265` — legacy `db.gallery` cascade.
- `api/config.py:19-24` — `storage_budget_gb` NOTE (field gone).
- `api/services/database.py:57,65,122` — `(pinned, last_accessed_at)` indexes.
- `api/services/database.py:67-69,82-93` — legacy `snapshots`/`gallery` indexes.
- `api/services/database.py:130-131` — `admin_audit` indexes.
- `docker-compose.prod.yml:8,48,53` — three TLS-laxity sites.
- `docker-compose.prod.yml:72` — `127.0.0.1:8100:80` gateway.
- `scripts/deploy.sh:8` — SSH 1022; `:38-39` — stale 8091 health check.
- `api/Dockerfile:16` — dev `--reload`; `:25` — prod `--workers` (no reload).
- `scripts/dev.sh:74-76` — dev `--reload`.
- `api/scripts/migrate_visualization.py:21-33` — L6 chronic-residual #5 note.
