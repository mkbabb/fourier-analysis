# Wχ — P2: migration-with-deploy atomic + rollback-safe on real prod data

**Probe**: P2 (one of five). **Authored**: 2026-05-27 (Wχ, Batch 1, agent Wχ-P2). **Charter**: `docs/tranches/D/waves/Wchi.md §3.2` (verbatim) + `docs/tranches/D/waves/W0.md §6.2` + `§7` + `docs/tranches/D/research/README.md` R2 (the ratified host state). **Mode**: read-only adversarial — host probes via passwordless SSH (`mbabb@mbabb.fridayinstitute.net:1022`), repo probes against the live tree at HEAD. **Zero mutation; zero source touch.**

**Subject under attack**: the W1 plan to run `api/scripts/migrate_image_blobs.py` as part of the cutover that ships master's code — the C.W5 deletion-proof subscripts `doc["storage_uri"]` with no dual-read (`api/routers/images.py:140,159`), so the migration must precede or co-deploy with the serving code. The Wα-R2 ratification confirmed the C.W5 atomicity proof (`docs/tranches/C/audit/challenge-P3.md` "C.Wχ-P3"). P2 interrogates whether this holds on **real prod data**, on the **shared multi-app host**, with the **deploy-hook rollback chain**.

---

## §0 — Adversarial check ledger (Wchi.md §3.2 list 1–7)

### Check 1 — Empty-DB at first deploy ⇒ migration is no-op

**Probe** (read-only SSH, executed 2026-05-27):

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "docker exec fourier-analysis-mongo-1 sh -c \
  'mongosh --quiet --tls --tlsAllowInvalidCertificates -u fourier-admin -p <REDACTED> \
   --authenticationDatabase admin --eval \"db = db.getSiblingDB(\\\"fourier\\\"); \
   print(\\\"images:\\\" + db.images.countDocuments({}) + \\\" \
   visualizations:\\\" + db.visualizations.countDocuments({}))\"'"
images:0 visualizations:0
```

**Result**: `images.countDocuments({}) = 0` + `visualizations.countDocuments({}) = 0`. The pre-A `8818ae5` baseline has **zero inline blobs** because it has zero image documents.

**Implication**: `api/scripts/migrate_image_blobs.py` against this DB is a **structural no-op** — its main loop iterates over `db.images.find({"blob": {"$exists": True}})` which returns an empty cursor; the script exits clean with `relocated=0`, `thumbnails_relocated=0`, audit report recorded. **No file written, no Mongo write executed.** The cutover therefore inherits zero migration risk against the first-deploy substrate.

**Sub-verdict**: PASS. Cross-cited to `W0.md §1` row "Blob migration: never run (and prod `images` collection has 0 documents)" + DA4 §4.1.

---

### Check 2 — `image_blobs` volume MUST exist before first compose `up -d`

**Probe 2.a** (read-only SSH):

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "docker volume ls | grep image_blobs; \
  echo '---END---'; docker volume inspect image_blobs 2>&1 | head -5"
---END---
[]
Error response from daemon: get image_blobs: no such volume
```

Volume **absent** — `docker volume ls` returns no `image_blobs` row; `docker volume inspect` errors with "no such volume".

**Probe 2.b** (repo at HEAD, `docker-compose.prod.yml:101-103`):

```yaml
volumes:
  image_blobs:
    external: true
```

`external: true` confirmed — Docker requires the volume to pre-exist before `up -d` will start the backend (the backend mounts `- image_blobs:/data/blobs` at `docker-compose.prod.yml:14`).

**Probe 2.c** (`scripts/deploy-hook.sh`):

```
$ grep -n "docker volume create\|migrate_image_blobs" scripts/deploy-hook.sh
---END---
```

`scripts/deploy-hook.sh` contains **zero `docker volume create`** and **zero `migrate_image_blobs` invocation**. The hook's responsibilities are: `assert_clean_tree` → `git fetch / reset --hard origin/master` → `build_and_up` → `health_gate` → record-green-or-rollback. **It assumes the volume exists** (and assumes the cutover migration runs out-of-band).

**Implication**: `docker volume create image_blobs` is a **W1 pre-deploy host-ops step**, not in-tree, not in the hook. If W1 invokes the hook without first running `docker volume create image_blobs`, `docker compose up -d` will fail to start the backend (the named external volume does not exist) → `health_gate` will not turn green within 30×2s → the hook will `rollback` by `reset --hard ${prev}` (= pre-A `8818ae5`) + rebuild + re-gate; the pre-A backend does not mount `image_blobs` (it predates C.W5), so it restarts clean; **the volume is still uncreated**, the cutover is rejected, the site stays on `8818ae5`. Safe failure mode — site continuous, no data loss, but the W1 cutover never completes.

**Sub-verdict**: PASS-WITH-CONDITION. The W1 plan MUST execute `docker volume create image_blobs` BEFORE first webhook-fired deploy. Cross-cited to `W0.md §8` "C.W5 — `docker volume create image_blobs` precondition (`docker-compose.prod.yml:101-103` `external: true`) … lands at **W1**".

---

### Check 3 — Health gate runs BEFORE migration (boot path has no image-doc subscript)

**Probe 3.a** (`api/main.py` startup `lifespan`, lines 27-46):

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ENV validation + admin token check
    await connect_db()
    janitor_task = asyncio.create_task(run_janitor())
    yield
    janitor_task.cancel()
    await close_db()
```

The boot path is: env-validate → `connect_db()` → spawn janitor → `yield`. `connect_db` only creates indexes (`api/services/database.py:24-` only `create_index` calls; no `find_one`/`find` on `images` at boot).

**Probe 3.b** (subscript-site grep, `grep -nE "doc\[.storage_uri.\]|asset\[.storage_uri.\]" api/main.py api/routers/images.py`):

```
api/routers/images.py:140:    path = _resolve(doc["storage_uri"])
api/routers/images.py:159:        path = _resolve(doc["storage_uri"])
```

**Zero hits on `api/main.py`** — boot does NOT subscript `storage_uri` on any document. The two hits in `api/routers/images.py` are inside `get_image_blob` (line 132 `@router.get("/{imageSlug}/blob")`) and `get_image_thumbnail` (line 148 `@router.get("/{imageSlug}/thumbnail")`) — both are **request-time** handlers, not boot-time.

**Implication**: `/api/health` returning `{"status":"ok"}` requires only that ASGI is reachable + (transitively) the DB connection is open; it does NOT exercise any `images` document subscript. On an **empty** `images` collection (Check 1), no request can ever land on lines 140/159 because no `imageSlug` would resolve via `get_image_asset` (line 47, `find_one` returns None → 404 raised in `get_image_asset` at the missing path). **The health gate is safe against the empty-DB-pre-migration condition.**

**Sub-verdict**: PASS. The boot path is migration-agnostic; the route subscripts are request-time and gated upstream by `get_image_asset`'s 404. Cross-cited to `Wchi.md §3.2` list item 3.

---

### Check 4 — Migration shape selection (A/B/C per Wchi.md §3.2 list item 4)

**The three candidate shapes** (verbatim from `Wchi.md §3.2`):

- **(A)** Pre-deploy: `scripts/deploy-hook.sh` runs `python -m api.scripts.migrate_image_blobs` BEFORE the health gate, against the *old* image (pre-A SHA `8818ae5`'s `api/`) — wrong code under a fresh DB shape.
- **(B)** Post-build, pre-up: `deploy-hook.sh` runs `docker compose run --rm backend python -m api.scripts.migrate_image_blobs` AFTER `build` but BEFORE `up -d`. The script runs in the new image against the live DB.
- **(C)** Post-up, gate-then-migrate: `up -d` first → gate passes (the empty DB is gate-safe — Check 3) → then `docker compose exec backend python -m api.scripts.migrate_image_blobs`. The migration is idempotent + a no-op against empty DB → no risk.

**For first deploy (empty DB)**: shape **(C)** is chosen. Rationale: Check 1 proves the prod DB is empty, so the migration is a structural no-op (`relocated=0`); Check 3 proves the boot path + the health-gate path do not subscript `storage_uri`, so the gate can pass safely before the migration runs; therefore the simplest, lowest-risk sequence is `up -d → gate → migrate` (the migration is verified after the gate is green, against a populated container, with the audit report captured in the live container).

**For subsequent deploys (data present)**: shape **(B)** is chosen. Rationale: when `images` collection has docs with inline `blob`, the C.W5 serving code (already deployed at first cutover) reads via `storage_uri` only and would 404/500 on unmigrated docs; the migration MUST precede the new code being live. Shape (B) runs the migration via `docker compose run --rm backend` (transient container in the new image, with the new migration script, against the live mongo network) AFTER `build` but BEFORE `up -d` brings up the live backend container. This honours D.md invariant 2 ("code and migration cut over together").

**Probe 4.a** (`scripts/deploy-hook.sh` body, lines 113-159):

The current `deploy()` body does NOT invoke the migration — `build_and_up` → `health_gate` only. **The migration invocation is therefore a W1 deliverable** (either as a hook extension or as a wrapping host-ops step around the webhook trigger; the Wχ-harden coordination doc + `D.md §3` W1 row point to (C) for first deploy because the empty DB makes pre-migration safe, and to (B) for the future-state pattern that must hold on subsequent deploys with data).

**Implication**: the W1 plan must (a) for the first deploy: invoke the existing `scripts/deploy-hook.sh` (which currently lacks any migration step), then immediately follow with `docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend python -m api.scripts.migrate_image_blobs` (shape C, host-ops); (b) for the subsequent-deploy pattern: extend the hook to wrap a `docker compose run --rm backend python -m api.scripts.migrate_image_blobs` after the build, before `up -d` (shape B), so future deploys ride the migration in-cutover automatically.

**Sub-verdict**: PASS-WITH-CONDITION. **(C) for first deploy, (B) for subsequent** is the binding shape — name + bind into W1.

---

### Check 5 — Rollback target constraint

**The rule** (from `Wchi.md §3.2` list item 5): the migration's per-doc updates are NOT auto-reverted by `git reset --hard $PREV`. For the **empty-DB first deploy**, the rule is moot (no updates were made — Check 1). For **subsequent deploys with data**, the rollback target must be **≥ W5 SHA** (any earlier code expects the inline `blob` and would 500 on a migrated doc).

**Probe 5.a** (`scripts/deploy-hook.sh:120-128`):

```bash
local prev
if [[ -r "${GREEN_MARKER}" ]] && prev="$(cat "${GREEN_MARKER}")" && [[ -n "${prev}" ]]; then
    log "rollback target = last-known-green ${prev} (from ${GREEN_MARKER})"
else
    prev="$(git rev-parse HEAD)"
    log "rollback target = current HEAD ${prev} (no green marker yet — first deploy)"
fi
```

The hook reads `$PREV` from `/opt/deploy/fourier-last-green` if present, else falls back to current HEAD.

**For first deploy on prod (today, 2026-05-27)**:
- `/opt/deploy/fourier-last-green` does NOT exist (the fourier arm has never fired — `W0.md §1` row "Fourier deploys ever: zero").
- `git rev-parse HEAD` in `/var/www/fourier-analysis` returns **`8818ae5`** (pre-A; `W0.md §1` + `R2` live probe).
- `$PREV = 8818ae5` (pre-W5).

**Why this is safe** despite being "rollback past the W5 SHA": the prod DB at `8818ae5` has **zero image documents** (Check 1). The W5-vs-pre-W5 code divergence (one reads `storage_uri`, the other reads inline `blob`) is **invisible** when there are no documents to read. Rollback to `8818ae5` restores the pre-A code AND the prod DB is still in the pre-A shape (empty) AND the volume `image_blobs` is still uncreated (it was never created — Check 2) AND the migration never ran (a no-op even if it had — Check 1). **All four substrates align at the pre-A baseline**; rollback is fully reversible.

**For any subsequent deploy** (post-first-W1, with data accumulating): the migration's `update_one` calls (Check 6) convert each doc from `{"blob": <bytes>, ...}` to `{"storage_uri": "fs:<slug>", ...}` irreversibly. Rolling back the *code* to pre-W5 with the *data* in post-W5 shape would 500 on every blob fetch. So the rollback target MUST be ≥ W5 SHA — the `GREEN_MARKER` SHA recorded after the first W1 deploy is W5-or-later by construction (the first green-marker is the first W1 cutover, which IS the W5 deploy). The hook's "use the green marker" branch enforces this for every subsequent deploy.

**Implication**: the first deploy's `$PREV = 8818ae5` is constraint-satisfying (rollback target = pre-A, no inline blobs in DB ⇒ safe); subsequent deploys' `$PREV ≥ W5 SHA` (the green marker) is constraint-satisfying by the hook's existing logic. **No hook modification needed for the constraint itself** — the constraint is property of the data substrate, not the hook. But the W1 plan must record this constraint explicitly so any operator-initiated rollback (manual `git reset --hard <some-sha>` outside the hook) honours it.

**Sub-verdict**: PASS. `$PREV = 8818ae5` is the rollback target for the first deploy, and it is safe because the prod DB at `8818ae5` had no inline blobs (it had no images at all). Bind the constraint into W1 for documentation discipline.

---

### Check 6 — C.Wχ-P3 atomicity proof holds on prod

The C.Wχ-P3 proof reduces to three load-bearing properties.

**6.a — `replicas: 1` in `docker-compose.prod.yml`**:

```
$ grep -n "replicas\|replSet" docker-compose.prod.yml docker-compose.yml
docker-compose.prod.yml:16:      replicas: 1
```

`docker-compose.prod.yml:16` declares `replicas: 1`. **No `replSet`** anywhere (the mongo `command:` at lines 50-54 does not pass `--replSet`). The prod mongo is a single standalone mongod — there is no replication lag, no readPreference quirk, no causal-consistency gap. Per-doc writes are immediately visible to subsequent reads from the same process.

**6.b — No app-side image cache**:

```
$ git grep -nE "_image_cache|images_cache" api/
---END---
```

Zero hits — no `_image_cache`, no `images_cache` anywhere under `api/`. `api/dependencies.py:47-55` (`get_image_asset`) issues a **fresh** `await db.images.find_one(...)` per request; there is no app-side document cache that could serve a stale (pre-migration) view after the migration completes.

(There IS a `_suspended_cache` at `api/dependencies.py:24,180-189` — but it caches *user suspension status*, not image documents, and is explicitly orthogonal to the migration concern. Cross-checked: `grep -n "find_one\|cache\|_image" api/dependencies.py` returns no `_image*` cache token.)

**6.c — Migration update semantics**:

```
$ git grep -nE "update_one\(|update_many\(" api/scripts/migrate_image_blobs.py
api/scripts/migrate_image_blobs.py:8:``<slug>.thumb``); (3) ONE atomic ``update_one($set storage_uri/thumbnail_uri,
api/scripts/migrate_image_blobs.py:148:            await db.images.update_one(
```

One `update_one` site (line 148). Inspection (lines 141-151):

```python
if not dry_run:
    # 1. write file(s) — a pure function of the existing Mongo bytes,
    #    retryable; truncate-and-overwrite (no skip-if-exists, C11).
    (blob_dir / slug).write_bytes(data)
    if tdata is not None:
        (blob_dir / f"{slug}.thumb").write_bytes(tdata)
    # 2 & 3. ATOMIC per-doc flip: $set uri + $unset inline in ONE op.
    await db.images.update_one(
        {"_id": doc["_id"]},
        {"$set": update_set, "$unset": update_unset},
    )
```

The per-doc cutover is: file write → ONE `update_one` that BOTH `$set`s `storage_uri` (+ `thumbnail_uri`) AND `$unset`s `blob` (+ `thumbnail`). Mongo's per-document atomicity guarantees `blob` XOR `storage_uri` holds for that document at every observable instant. No update_many; no partial-state window per document.

**Net for Check 6**: the C.Wχ-P3 proof holds on prod data:
- single standalone mongod (no replication-quirk window),
- no app-side image cache (no stale-view window),
- per-doc atomic flip (no within-doc partial-state window).

The "atomic cutover" property is structural; it does not depend on the size of the dataset (one doc or one million). It does depend on the C.W5 serving code being co-deployed with the migration — which Check 4 binds via shape (C)/(B).

**Sub-verdict**: PASS. The atomicity proof is reproducible against the live prod tree + the live mongo container substrate.

---

### Check 7 — §8 brittleness window finalisation

**The framing** (`W0.md §7` + `D.md §8`): the window is the W1 deploy-chain span (build → health-gate → migration-cutover → cut). The question is whether to **strike** it (no body — atomicity proof holds + no dual-read + rollback restores prior build) or **hold provisional** with W1 owning restoration.

**Synthesis of Checks 1-6**:
- Check 1: prod DB is empty → migration is a structural no-op → no per-doc atomicity hazard exists to begin with on the first deploy.
- Check 2: volume create is a W1 pre-deploy host-ops step; if missed, the gate fails and the hook rolls back to `8818ae5` cleanly.
- Check 3: the health gate's boot path does not subscript `storage_uri`; the empty DB cannot land on the request-time route handlers; the gate is safe.
- Check 4: shape (C) for first deploy, (B) for subsequent — both honour D.md invariant 2.
- Check 5: rollback target = `8818ae5` for first deploy, safe (no inline blobs in DB); rollback target ≥ W5 SHA for subsequent, enforced by the hook's `GREEN_MARKER`.
- Check 6: the atomicity proof is structural — single mongod, no app-side cache, per-doc atomic flip — and holds against any data volume.

**Verdict on §8**: **STRIKE the brittleness window (no body)**. The atomicity proof holds on real data; the empty-DB-at-first-deploy substrate strips even the migration concern to a structural no-op; the deploy-hook's existing rollback chain (reset → rebuild → re-gate) restores `8818ae5` cleanly with all four substrates (code/data/volume/migration-status) aligned at the pre-A baseline. There is no observable suspended-gate interval for which the window would need a body.

W1 owns the volume-create pre-deploy step (Check 2) and the migration invocation (Check 4 shape C) — but neither suspends a live-site gate; both are operator-side-of-the-trigger acts. The deploy-hook's atomicity + the empty-DB first-deploy structure together leave no window for the live site to be observably broken under either commit or rollback.

**Sub-verdict**: STRIKE. The `D.md §8` text is reconciled centrally by team-lead.

---

## §1 — Honesty discipline log

- **Zero host mutation**. All probes are read-only: `mongosh --eval "countDocuments({})"` (count-only), `docker volume ls / inspect` (read-only), `git grep` + `grep` on the local repo at HEAD.
- **Zero source touch**. No file under `api/**`, `web/**`, `scripts/**`, `docker-compose*.yml` modified.
- **No new wave / no new probe.** P2 scope is bounded by `Wchi.md §3.2` checks 1-7.
- **No CF token usage.** Not relevant to P2 (DNS/TLS is P5's domain).
- **No `D.md` / `PROGRESS.md` / `coordination/*.md` edit.** §8 finalisation is surfaced to team-lead reconcile; this deliverable carries the verdict, not the edit.

---

## §2 — Evidence summary table

| Check | Question | Evidence | Verdict |
|---|---|---|---|
| 1 | Empty DB ⇒ migration no-op? | SSH `mongosh` → `images:0 visualizations:0` | PASS |
| 2 | Volume must exist; hook does not create it? | `docker volume ls / inspect` → absent; `docker-compose.prod.yml:101-103` `external: true`; `grep deploy-hook.sh` → 0 hits | PASS-WITH-CONDITION (W1 host-ops) |
| 3 | Health-gate boot path subscript-free? | `api/main.py` lifespan = connect_db + janitor only; `grep "doc\[.storage_uri.\]" api/main.py` → 0 hits; `api/routers/images.py:140,159` are request-time | PASS |
| 4 | Migration shape A/B/C? | First deploy = (C) (empty DB makes pre-migration safe); subsequent = (B) | PASS-WITH-CONDITION |
| 5 | Rollback-target constraint? | `$PREV = 8818ae5` for first (safe: no inline blobs in DB); `$PREV ≥ W5 SHA` for subsequent (enforced by `GREEN_MARKER`) | PASS |
| 6 | C.Wχ-P3 atomicity proof on prod? | `docker-compose.prod.yml:16 replicas: 1`, no `replSet`; `git grep _image_cache` → 0; one `update_one` per doc with `$set` + `$unset` in same op | PASS |
| 7 | §8 brittleness window? | Synthesis of 1-6 → no observable suspended-gate interval; structural | STRIKE |

---

## Verdict

**PASS-WITH-CONDITIONS**: the migration-with-deploy is atomic + rollback-safe on real prod data. The atomicity proof from C.Wχ-P3 is reproducible against the live mongo container (single standalone mongod, no replSet, `replicas: 1`); the prod DB is empty at first deploy (Check 1) so the migration is a structural no-op; the boot path does not subscript `storage_uri` (Check 3) so the health gate is safe before the migration runs; rollback to `8818ae5` is safe because the pre-A baseline aligns code/data/volume-status (Check 5); the per-doc cutover is one `update_one` with `$set` + `$unset` in the same op (Check 6). The conditions name the W1 pre-deploy host-ops (volume create), the migration shape (C-then-B), the rollback constraint (≥ W5 SHA for subsequent), and the post-deploy probe.

## Conditions to bind

- **P2.C1** (migration shape: **C for first deploy** — `up -d → gate → docker compose exec backend python -m api.scripts.migrate_image_blobs`; **B for subsequent** — `build → docker compose run --rm backend python -m api.scripts.migrate_image_blobs → up -d`) → **W1.G_migration-shape**
- **P2.C2** (rollback target ≥ W5 SHA for subsequent deploys; first-deploy `$PREV = 8818ae5` is safe by virtue of the empty-DB substrate; `GREEN_MARKER` enforces this for all subsequent deploys automatically; document the constraint for any manual rollback path) → **W1.G_rollback-target** + coordination note
- **P2.C3** (post-deploy migration probe: `mongosh --eval "db.images.countDocuments({storage_uri: {\$exists: false}})"` returns **0**; this gates the W1 close — "no environment runs code ahead of its migration", D.md §2 invariant 2 testable gate) → **W1.G_post-deploy-migration-probe**
- **P2.C4** (the W1 pre-deploy host-ops: `docker volume create image_blobs` BEFORE first webhook-fired deploy; if missed, the gate fails and the hook rolls back to `8818ae5` cleanly, but the cutover is rejected until the volume is created) → **W1.G_volume-create-prereq**
- **P2.C5** (§8 window verdict — STRIKE) → **D.md §8 reconcile** (team-lead)

## §8 window verdict

**STRIKE.** The brittleness window has no body. The atomicity proof from C.Wχ-P3 is reproducible on the live prod substrate (Check 6); the empty-DB-at-first-deploy condition reduces the migration to a structural no-op (Check 1); the boot path is subscript-free so the health gate is migration-agnostic (Check 3); rollback to `8818ae5` aligns all four substrates (code/data/volume/migration-status) at the pre-A baseline with no observable broken-site interval (Check 5). There is no live-site gate to suspend for the duration of the W1 cutover. W1 owns the pre-deploy host-ops (volume create) + the migration invocation (shape C) + the post-deploy probe — but none of these acts suspends a live-site gate; they are operator-side-of-the-trigger acts whose failure mode is a clean rollback to `8818ae5`.

**File created**: `/Users/mkbabb/Programming/fourier-analysis/docs/tranches/D/audit/challenge-P2.md`
