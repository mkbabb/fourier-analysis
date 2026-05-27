# Challenge P1 — "is filesystem+nginx the smallest *honest* mechanism?" (invariant 12 / 18)

**Probe**: Wχ-P1, fourier-analysis tranche-C challenge wave.
**Verdict under attack**: `C/research/R1-storage-backend.md §5` +
`R-storage-spec.md` — *filesystem + nginx static serve, app-served variant*;
atomic per-document cutover; the §8 brittleness window REMOVED; "zero new
container, zero dependency, zero credential, zero ongoing cost."
**Mandate (`C.md §3`)**: reject any new container / dependency / cost without
per-line invariant-12 justification; attack the choice — do not confirm it.
**Method**: READ-ONLY. The "0 cost" decomposition is re-derived against the
live tree, not taken on faith; the path-traversal claim is attacked as a
security probe against the *actual* slug validator; the backup / volume-wipe /
permission / orphan-file failure modes are each tested against the live
topology. No source touched.
**Verdict (TL;DR)**: **PASS-WITH-CONDITIONS.** The backend *choice* is correct
and survives every reasonable refutation — GridFS/MinIO/S3 are honestly
dismissed, the atomicity proof holds, the "smallest mechanism" claim is sound.
But the verdict's **"0 cost" decomposition is incomplete**: it accounts for the
infra surface (volume + config field) and misses **three operational costs the
relocation incurs that inline-Mongo did not** — a root-owned-volume permission
break, an orphan-file footprint leak that *breaks invariant 18 itself*, and a
disaster-recovery surface with no runbook. Four W5 conditions enumerated in §6.

---

## §1 — The "0 cost" decomposition, re-derived (the per-line attack)

The verdict's invariant-12 ledger (`R1 §5`) claims five zeroes. I re-derive
each against the live tree.

| Verdict claim | Re-derivation | Holds? |
|---|---|---|
| **+1 named volume `image_blobs`, no other infra** | `docker-compose.prod.yml` `backend` block (`:2-19`) declares **no** `volumes:` today; the sole stateful volume is `mongo_data` (`prod.yml:56`). The volume IS the whole *infra* delta. | **YES** (infra) |
| **NO new container** | nginx is already the gateway (`prod.yml:70-71`); the backend already runs and serves (`Dockerfile:25`). The app-served variant adds no service. The nginx-direct variant (rejected, `R1 §2.1b`) WOULD need the volume mounted into nginx (`prod.yml:73-74` mounts only the conf) — the verdict correctly defers it. | **YES** |
| **NO new dependency** | `FileResponse` is `starlette.responses` (already a transitive dep via FastAPI); `pathlib`/`os` are stdlib. `pyproject.toml [web]` gains nothing. | **YES** |
| **NO new credential** | No secret enters compose. Correct — contrast MinIO's `+2` (`R1 §2.3`). | **YES** |
| **NO ongoing cost** | No `$/mo`. Correct — contrast managed-S3 (`R1 §2.4`). | **YES** (monetary) |

**The five infra zeroes are honest.** The choice is not strawmanning its own
cost on the *infrastructure* axis. **But the ledger stops at infrastructure.**
The relocation moves bytes from a substrate (the Mongo document) that three
*existing operational mechanisms* already governed — the container's write
permissions, the janitor's delete cascade, and whatever covers `mongo_data` —
onto a substrate that **none of those three mechanisms reach**. Each is a
non-infra cost the verdict's per-line justification (`R1 §5`) does not itemise.
§2–§4 itemise them.

---

## §2 — The sharpest flaw: the orphan-file footprint leak BREAKS invariant 18

This is the finding that downgrades the verdict from PASS to
PASS-WITH-CONDITIONS. It is not a quibble — it is the relocation defeating the
very invariant it is enacted to satisfy.

**Invariant 18** (`C.md:40`): "Storage location is **bounded and observable** —
… whose total footprint is a single bounded query, whose per-object retention
is governed by the same `pinned` / `last_accessed_at` pattern B.W3 landed."

**The live retention mechanism** is the janitor recency prune. Tracing it:
`janitor.py:99-102` calls `_delete_images_and_cascade(db, {"pinned": False,
"last_accessed_at": {"$lt": cutoff}})`. That function (`janitor.py:251-274`)
collects the matching `image_slug`s (`:257-259`), cascades to `db.gallery`
(`:265`), then `await db.images.delete_many(filter_)` (`:273`). **It deletes
Mongo documents and nothing else.** It has no filesystem awareness — it cannot,
today, because the bytes ARE the document.

**Post-W5 the bytes are NOT the document.** A pruned image's doc (carrying
`storage_uri = "fs:<slug>"`, `thumbnail_uri = "fs:<slug>.thumb"`) is
`delete_many`'d out of Mongo, but the files at `<blob_dir>/<slug>` and
`<blob_dir>/<slug>.thumb` are **never unlinked**. The relocation severs the
bytes from the *only* deletion path that bounded them. Consequence:

1. **The volume grows monotonically.** Every unpinned image the janitor prunes
   (the staleness bound `CA5 §2.4` / `R1 §1.2` rely on) leaves two orphan files
   forever. The recency prune that "bounds staleness" now decrements only the
   Mongo side; the filesystem side is unbounded — the exact failure invariant
   18 exists to prevent, reintroduced by the fix.
2. **The enumeration query lies.** R1's bounded-footprint query
   (`R1 §1.2`: `count + $sum(bytes)` over `images`; `CA5 §2.1`: "OR `du -sb` on
   the volume") gives two *divergent* answers post-prune. The Mongo aggregation
   under-reports (it counts only live docs); the `du` walk over-reports (it
   counts orphans). Invariant 18's "total footprint is a single bounded query"
   is **false** the moment the first prune runs — the single query no longer
   describes the real footprint.

**R-storage-spec covers `store`, `read`, `migrate` — never `delete`.** §2.1's
shim resolves bytes; §3 relocates them; §3.3 deletes the *inline write path*.
**No section makes `_delete_images_and_cascade` unlink the relocated files.**
The `R1 §1.2` aside that "the per-doc `bytes` field is the cheap enumeration
substrate" actively *masks* this — it asserts the Mongo aggregation suffices,
which is exactly what stops being true once delete and storage diverge.

This is the dual of the §4-window finding: R1 proved the *write/cutover* is
atomic and bytes never double-live; it never asked whether the *delete* stays
coupled. It does not. **W5 must couple file-unlink to the doc delete, or
invariant 18 regresses.** (Condition C1, §6.)

---

## §3 — The second hidden cost: root-owned-volume permission break

A concrete, deterministic W5 runtime failure the "0 cost" ledger never names.

**The facts.** The prod backend runs as the **unprivileged `app` user**
(`Dockerfile:19` `adduser --disabled-password app`; `:23` `USER app`). The only
`chown` in the image is `:21` `RUN chown -R app:app /app/.venv` — scoped to the
virtualenv, nothing else. A freshly-created named Docker volume
(`image_blobs:/data/blobs`) is created **root-owned (`0755 root:root`)** by the
Docker daemon on first mount.

**The break.** The spec's migration helper `_blob_dir()` (`R-storage-spec.md
§3.1`) runs `Path(settings.blob_dir).mkdir(parents=True, exist_ok=True)` and
then `(blob_dir / slug).write_bytes(data)` (`§3.1 lines 169-171`); the rewritten
`store_image_asset` (`§3.3`) writes files on every upload. **All of these run as
`app` against a `root:root` mount root → `PermissionError: [Errno 13]`.** The
migration aborts on the first `write_bytes`; every subsequent upload 500s.

`mongo_data` never exposed this because **the backend never writes to it** —
only the `mongo` container (running as its own image's user) touches
`/data/db`. `image_blobs` is the *first* volume the unprivileged `app` user must
write to. The verdict inherits `mongo_data` as the volume precedent (`R1 §5`:
"a host-local volume … joins `mongo_data`") but `mongo_data`'s writer-is-root
posture does **not** transfer to a volume the `app` user owns.

R1 §1.3 even *records* the unprivileged-`app` fact ("runs as unprivileged `app`
user", citing `Dockerfile:18-25`) — and then never connects it to the volume it
mandates the same user write to. The fact is in the survey; the implication is
not drawn. **W5 must establish writable ownership** (a compose `user:` directive
matching the volume, an entrypoint `chown`, or an `init`-container `chmod`).
(Condition C2, §6.)

---

## §4 — The third hidden cost: the DR surface inline-Mongo did NOT pay for free

The probe asks whether "0 cost" is honest given the volume needs a
disaster-recovery story that inline-Mongo "got for free (mongodump covered the
blobs)." I attack BOTH sides of this.

**The brief's premise is itself half-wrong — and that makes the finding
sharper, not weaker.** There is **no `mongodump`, no backup, no restore
mechanism anywhere in the tree** (`grep mongodump|backup|mongorestore scripts/
docker-compose*.yml` → empty; the `deploy.sh` push chain has no backup step,
`W0-baseline.md §1.1`). So inline-Mongo did NOT literally get a backup "for
free" — it got *nothing*. But the structural point survives intact and
inverts to a precision claim:

- Inline-Mongo concentrated **all durable state in one volume** (`mongo_data`).
  Whatever backup discipline the *operator* eventually applies (a `mongodump`
  cron, a volume snapshot) is **one surface**.
- Post-W5 there are **two independent durable surfaces** (`mongo_data` +
  `image_blobs`) that **must be backed up consistently** — a `mongo_data`
  snapshot taken at T1 and an `image_blobs` snapshot at T2 can restore a doc
  whose `storage_uri` points at a file that does not exist in the blob
  snapshot, or orphan files whose doc the Mongo snapshot lost. Split-brain on
  restore.

R1's *entire* treatment of this is **one parenthetical** (`R1 §1.2` /
`§5`: the volume "joins `mongo_data` as a backup surface — one added line in any
backup runbook"). **There is no backup runbook in the tree** — `R-storage-spec`
mentions `backup` / `external` / `down -v` **zero times** (verified). So the
"one added line" is a line in a document that does not exist; the
*consistency-on-restore* hazard (the genuinely new cost) is not named at all.

**Coupled volume-wipe sub-case.** Neither `mongo_data` (`docker-compose.yml:51`)
nor the proposed `image_blobs` is declared `external: true`. A `docker compose
down -v` (or `docker volume prune`) destroys both. *In fairness to the verdict*:
this wipe surface is **symmetric** — `down -v` already destroys the inline blobs
inside `mongo_data` today, so `image_blobs` adds no NEW wipe risk that
`mongo_data` doesn't carry. I do **not** weight this as a regression. But it
sharpens C2/C4: a volume holding the *sole* copy of user uploads (the inline
`blob` is `$unset` post-cutover, `R-storage-spec §3.3`) and reachable by no
backup is one `down -v` from total upload loss, and the verdict's "the files are
the new source of truth" (`§3.3`) makes that loss unrecoverable. **W5 must at
minimum document the DR/consistency story; declaring the volume `external: true`
is the cheap mechanical guard against accidental `down -v`.** (Condition C4, §6.)

---

## §5 — Where the verdict is RIGHT (the refutations that failed)

A probe that only confirms is a failed probe; equally, an honest probe records
the attacks that *did not* land. Four did not.

### 5.1 Path traversal via `image_slug` — guard HOLDS at the edge (NOT a finding)

This was the headline security probe; I attacked it hard and it holds. The
attack surface: `storage_uri = "fs:<image_slug>"` → `_resolve()` →
`<blob_dir>/<image_slug>`; if `image_slug` could carry `..` or `/`, a crafted
slug reads outside `blob_dir`.

**The validator blocks it.** `IMAGE_SLUG_PATTERN = re.compile(r"^[a-zA-Z0-9]
[-a-zA-Z0-9]{2,80}$")` (`dependencies.py:38`) — the character class is
`[-a-zA-Z0-9]`: hyphen + alphanumerics **only**. No dot, no slash, no `%`, and
`^…$`-anchored (no newline injection). Verified empirically:

```
'../../etc/passwd' → False   '..' → False   'a/../../etc' → False
'a.b' → False   'a/b' → False   'foo..bar' → False   'a%2e%2e' → False
'aaa\nbbb' → False            # legacy form still admitted:
'statuesque-meteoric-numbat-of-force' → True
```

A traversal payload **cannot become a valid `image_slug`** — so it can never be
stored as a `storage_uri`, and the request-path slug is re-validated on every
read: `get_image_asset` (`images.py:134,145,168,205`) →
`validate_image_slug` (`dependencies.py:49`) BEFORE any byte resolution. The
`.thumb` suffix the spec appends (`fs:<slug>.thumb`) introduces the only dot in
the key, and it is appended by trusted code, not user input — it cannot escape
because the slug component preceding it has no `/`. **The traversal probe does
not land. The slug shape is a sound traversal guard.**

**One defense-in-depth caveat (not a break, folded into C3).** The guard is
*single-layered*: it lives entirely in the request-edge regex. The spec's
`_resolve()` (`R-storage-spec §2.1`) parses the *stored* `storage_uri` and
performs **no independent confinement check** (no `Path.resolve().
is_relative_to(blob_dir)`). Today nothing writes an unvalidated slug into
`storage_uri` (the migration reads `doc["image_slug"]`, itself validated at
upload). So there is no live hole. But a future writer that constructs a
`storage_uri` from any less-validated source would have no second guard. The
cost of the guard is two lines; its absence is a latent single-point-of-failure.
**W5 should add the `_resolve()` confinement assert** — cheap defense-in-depth
on a user-data-derived path. (Condition C3, §6 — hardening, not a blocker.)

### 5.2 Atomic cutover — the proof HOLDS

R1 §4's atomicity rests on three tree-grounded facts I re-verified: (a) Mongo
single-document `update_one` atomicity (the `$set storage_uri` / `$unset blob`
flip is one document op, `R-storage-spec §3.1:172-176`); (b) the file write is a
pure function of bytes already in Mongo (`asset["blob"]` present pre-cutover,
`image_storage.py:104,141`); (c) the backend is volume-local, no network
partial-failure boundary (`prod.yml` backend + volume on one host). The
crash-between-write-and-flip mode yields a **harmless idempotent disk orphan**
(re-run overwrites byte-identically, slug-keyed). **No dual-read layer is
required; none survives cutover** — satisfying `C.md §6`'s invalid-gate
("a dual-read compatibility layer left in place 'for safety'") and invariant 3.
The §8 window is genuinely removable. **This attack failed; the proof is sound.**
(Note: the crash-orphan of §5.2 and the prune-orphan of §2 are *different*
orphans — the former is self-healing on re-run; the latter is permanent and
unbounded. R1 §4 discharges the former and never sees the latter.)

### 5.3 GridFS / MinIO / S3 dismissals — HONEST, not strawmen

- **GridFS** is dismissed for the right reason: it keeps bytes in Mongo (two
  collections instead of one) — a "half-move" (`R1 §2.2`,
  `R-lifecycle-spec §6.3`) that bounds nothing invariant 18 wants. The
  non-atomic cross-collection-vs-`images.update_one` point is real. **Not a
  strawman** — GridFS genuinely solves none of the stated problem.
- **MinIO** is rejected on a correctly-itemised per-line surface: +1 container
  (`prod.yml` would gain a fifth service), +2 credentials (re-opening the
  secret surface W1/W2 close, `W0 §1.3`), +1 SDK, +host memory on a
  2G/512M/128M-budgeted single host (`prod.yml:14,63,81`). The forward-compat
  benefit has **no consumer** — invariant 19 forbids multi-replica
  (`C.md §2`), so the S3-API affordance is the "library nobody calls"
  anti-pattern. **Honest rejection.**
- **Managed S3** adds recurring `$/mo` (pre-named at `C.md §7`) for scaling the
  single-replica host has no pressure for. **Honest rejection.**

The decision matrix (`R1 §3`) is not rigged: filesystem wins on the axes that
actually bind (atomic cutover, zero infra surface, bytes-out-of-Mongo), and the
heavier backends lose on costs that are real, not invented. **Filesystem+nginx
IS the smallest mechanism that satisfies invariant 18's relocation intent.** My
attack on the *choice* failed. My attack on the *cost accounting* succeeded.

### 5.4 FileResponse vs StreamingResponse — a genuine improvement

`R-storage-spec §2.2` replaces `StreamingResponse(io.BytesIO(data))`
(`images.py:136-140`) with `FileResponse(path)`. This is strictly better for
large blobs: `FileResponse` streams from disk with `Content-Length` +
conditional-request (`Range`/`If-Modified-Since`) support, where the current
path loads the whole blob into an in-memory `BytesIO` first. Route, auth
(`get_image_asset` 404 + `touch_document`, `dependencies.py:47-55`),
`Cache-Control` (`images.py:139`), and the `last_accessed_at` touch the prune
depends on (`§2.3`) are all preserved. **No regression; a real win.** The
app-served-over-nginx-direct choice correctly preserves the access-time touch.

---

## §6 — DISPOSITION

**PASS-WITH-CONDITIONS. The backend choice stands; the cost ledger is
incomplete.**

The filesystem+nginx app-served choice is the smallest mechanism that satisfies
invariant 18's *relocation* intent, and it survives every attack on the
*choice*: the atomicity proof holds (§5.2), the alternatives are honestly
dismissed (§5.3), the traversal guard holds at the edge (§5.1), `FileResponse`
is a genuine win (§5.4). The verdict is **not** a rubber-stamp of CA5 — it
independently re-derives the atomicity and the per-line infra surface.

But "smallest *honest* mechanism" requires the cost ledger to be complete, and
it is not: the relocation moves bytes off a substrate that three existing
mechanisms governed (container write-perms, the janitor delete, any backup)
onto one that none reach. **W5 MUST honour these conditions or the regression
lands in the implementation:**

- **C1 (BLOCKER — invariant-18 regression).** `_delete_images_and_cascade`
  (`janitor.py:251-274`) must unlink `<blob_dir>/<slug>` **and**
  `<blob_dir>/<slug>.thumb` for every pruned doc, in the same cascade.
  Otherwise the recency prune bounds only the Mongo side and the volume grows
  unbounded — invariant 18's "total footprint is a single bounded query" is
  false the moment the first prune runs (§2). The cascade-on-delete is part of
  the storage contract, not optional cleanup.
- **C2 (BLOCKER — deterministic runtime break).** The `image_blobs` mount must
  be writable by the unprivileged `app` user (`Dockerfile:23`) — root-owned by
  default, so `_blob_dir().mkdir()` and every `write_bytes` raise `EACCES`
  (§3). Fix via a compose `user:`, an entrypoint `chown`, or volume
  pre-ownership; W5 cannot run the migration without it.
- **C3 (HARDENING — defense-in-depth).** `_resolve()` (`R-storage-spec §2.1`)
  must assert the resolved path is confined to `blob_dir`
  (`Path(...).resolve().is_relative_to(blob_dir)`). The slug regex blocks
  traversal *today* (§5.1), so this is not a live hole — it is the second layer
  that keeps it from becoming one if any future writer feeds `storage_uri` from
  a less-validated source. Two lines.
- **C4 (DOCUMENTED COST — DR honesty).** The "0 cost" claim is honest only with
  the DR cost written down: `image_blobs` is a **second independent durable
  surface** that must be backed up *consistently* with `mongo_data`
  (split-brain-on-restore hazard, §4), and post-cutover the volume holds the
  **sole copy** of user uploads (inline `blob` `$unset`, `R-storage-spec §3.3`).
  At minimum document the consistency story; declaring the volume
  `external: true` is the cheap guard against an accidental `down -v` erasing
  the only copy.

**The single sharpest flaw**: the relocation silently severs the image bytes
from the janitor's delete cascade (`janitor.py:251-274` deletes Mongo docs
only), so the recency prune that bounded staleness now leaves orphan files on
the volume forever — the storage relocation enacted to satisfy invariant 18
("bounded and observable footprint") **defeats invariant 18**, because the one
bounded enumeration query stops describing the real footprint the instant the
first prune runs. R1 proved the *write* is atomic and never asked whether the
*delete* stays coupled; it does not.

---

## §7 — Citation summary (load-bearing)

- `api/dependencies.py:38` — `IMAGE_SLUG_PATTERN` (the traversal guard; class
  `[-a-zA-Z0-9]`, no dot/slash); `:41-44` `validate_image_slug`; `:47-55`
  `get_image_asset` (re-validates every read + 404 + `touch_document`).
- `api/lib/crud/slugs.py:15,40-42` — strict 4-word `SLUG_PATTERN` /
  `generate_slug` (new slugs); the image validator is deliberately laxer for
  legacy `coolname` slugs (`dependencies.py:31-37`).
- `api/services/janitor.py:99-102` — recency prune call; `:251-274`
  `_delete_images_and_cascade` (deletes Mongo docs + gallery cascade; **NO
  filesystem unlink** — the C1 gap).
- `api/services/image_storage.py:104` — `blob: Binary(content)` (relocation
  target); `:139-143` `image_bytes` shim; `:69-80` dedup-hit thumbnail regen
  (reads `existing["blob"]`).
- `api/routers/images.py:132-140` — `…/blob` `StreamingResponse` (the
  `FileResponse` target); `:134,145,168,205` — every byte read passes
  `get_image_asset` (re-validation chokepoint).
- `api/Dockerfile:19,21,23` — `adduser app` / `chown … /app/.venv` (scoped to
  venv only) / `USER app` (the C2 permission break).
- `docker-compose.prod.yml:2-19` — backend block declares no `volumes:`; `:56`
  `mongo_data` sole stateful volume; `:14,63,81` memory budgets; `:70-74` nginx
  mounts only the conf. `docker-compose.yml:51` — `mongo_data` not
  `external: true` (the C4 `down -v` surface).
- `nginx/fourier.conf:30-39` — `/api/` proxy (no static-asset location; the
  app-served path needs none).
- `docs/tranches/C/C.md:40` (inv 18), `:42` (inv 19), `:106` (invalid-gate
  list incl. dual-read), `:126` (managed-S3 cost concern).
- `docs/tranches/C/research/R1-storage-backend.md §1.2,§1.3,§4,§5` — the cost
  ledger + atomicity proof under attack; `R-storage-spec.md §2.1,§3.1,§3.3` —
  the read/migrate/delete-the-write contract (no `delete` of relocated files).
- `docs/audits/runs/2026-05-27-C-audit/CA5-storage-infra-audit.md §2.1-2.4` —
  the prior ranking R1 confirms; the `du -sb`-OR-aggregation enumeration that
  §2 shows diverges post-prune.
- Tree-wide: `mongodump`/`backup`/`mongorestore` → **absent** (no DR mechanism
  exists, §4); `R-storage-spec` `backup`/`external`/`down -v` → **absent**.
