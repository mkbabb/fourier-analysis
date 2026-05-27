# R4 — janitor audit-log + `--reload` compute-abort fix spec

**Lane**: Wα-R4 (research only — no source files touched). **Authored**: 2026-05-27.
**Measures against**: `W0-baseline.md §3` (the `--reload` finding) and §2-adjacent (the janitor `delete_many` catalogue); `C.md §3` (W3 row) + §5 (the thread-α charter row); invariant 12 (KISS, the load-bearing constraint).

This artefact specifies two W3 deliverables that share no files at the source level but share a wave: **Part A** — the `admin_audit` row each janitor sweep emits, the re-run idempotence guarantee, and the integration-test shape; **Part B** — the precise diagnosis of why a `src/` write mid-compute aborts the in-flight computation, and the smallest fix per the KISS order `(a) narrow watch ⊳ (b) scope off the reloaded process ⊳ (c) background queue`.

Every claim is grounded `file:line` against the tree read fresh on 2026-05-27.

---

## Part A — janitor audit-log + recovery

### A.0 — The substrate the janitor already has

`api/services/janitor.py` runs `_cleanup_cycle` (`janitor.py:60`) on startup and every six hours (`janitor.py:51-57`). The cycle performs **nine `delete_many` deletions** and **one `update_many` cascade-soft-delete** (`janitor.py:127` — counted alongside the nine because it is a destructive lifecycle transition the audit trail must record), and emits **eleven `logger.info` lines** but **zero audit rows**. The deletions are catalogued at `W0-baseline.md §3` / the `C.md §3` W3 row.

An `admin_audit` collection **already exists** and is the canonical destination: the janitor itself prunes it (`janitor.py:168`), the admin router writes it on every moderation action (`admin.py:72-81` `log_audit`), and the admin audit-viewer reads it (`admin.py:617-651`). The audit-row schema is therefore **not novel** — it is fixed by what is already written and what the viewer already deserialises. The W3 work is to make the janitor a *peer writer* into this same collection, keeping the collection homogeneous.

### A.1 — The canonical `admin_audit` row shape (mirror, do not invent)

The existing writer `log_audit` (`admin.py:72-81`) inserts exactly four fields:

```python
{
    "timestamp": datetime.now(UTC),   # tz-aware UTC
    "ip_hash":   ip_hash,             # the admin actor's hashed IP
    "action":    action,             # e.g. "set_tier:featured", "delete_user"
    "target":    target,             # e.g. the slug, or "count=12"
}
```

The audit-viewer model `AuditEntry` (`api/models/admin.py`, the `class AuditEntry`) declares **all four required**: `timestamp`, `action`, `target`, `ip_hash`. The viewer filters on `action` (exact, `admin.py:630-631`), `target` (regex, `admin.py:632-633`), and `timestamp` range (`admin.py:634-640`), and sorts on `timestamp` descending (`admin.py:646`).

**Homogeneity constraint (binding).** The janitor's rows MUST satisfy `AuditEntry` — i.e. carry all four fields with the same types — or the `/api/admin/audit` viewer will fail to deserialise a mixed collection. This drives three reconciliations:

1. **`ip_hash` has no meaning for an autonomous sweep.** The janitor is not an actor with an IP. Rather than (a) omit the field — which breaks `AuditEntry`'s required `ip_hash: str` — or (b) widen the model to `ip_hash: str | None` (a schema loosening that weakens the admin-action contract for the janitor's sake), the smallest faithful choice is a **sentinel constant**: `ip_hash = "system:janitor"`. It is a string, it satisfies the model, it is self-documenting in the viewer, and it is trivially filterable (`?target=` or a future actor facet). This keeps the collection homogeneous without loosening the type.
2. **The structured payload (count, cutoff) lives in `target`.** `target` is already an opaque human-readable string carrying structured-ish payloads in the admin surface (`admin.py:366` `f"{slug} (entries={...})"`; `:401` `f"count={...}"`; `:444` `f"slugs={...}, affected={...}"`). The janitor follows the **same convention** rather than introducing new top-level columns — that is the homogeneity-preserving choice. `target = f"count={n}, cutoff={iso}"` (cutoff omitted where the sweep has no cutoff, e.g. expired-sessions uses `now`).
3. **The sweep identity lives in `action`.** `action` is the categorical filter facet (`admin.py:630-631` filters it exactly). Each sweep gets a stable, namespaced action string under a `janitor:` prefix so the whole janitor trail is one `?action`-prefix family, disjoint from the admin actions.

**Do NOT add new columns** (`category`, `count`, `cutoff` as separate fields). The charter's phrase "category / action, count deleted, cutoff used, timestamp" maps onto the *existing* four-field shape: **category ≡ the `janitor:` action namespace**, **count + cutoff ≡ the `target` payload**, **timestamp ≡ `timestamp`**. Adding columns would make the janitor rows structurally divergent from the admin rows and is the rejected over-engineering (invariant 12). This is the per-line justification the charter requires.

### A.2 — The per-site audit-row table

One row is emitted **per sweep that deleted ≥ 1 document** — mirroring the existing `if result.deleted_count:` log guard (`janitor.py:74,96,103,114,131,140,148,156,169,266` — the cascade-soft-delete guards on `modified_count`). A zero-effect sweep writes **no row** (no audit noise; matches the existing log discipline and keeps re-run idempotence trivial — see §A.3).

`action` strings are namespaced `janitor:<sweep>`. `target` carries `count=<deleted_count>` and, where a cutoff bounds the sweep, `cutoff=<iso8601>`.

| `janitor.py` line | Collection / op | `action` (category) | `target` payload | cutoff variable (source) |
|---|---|---|---|---|
| `:73` | `visualizations.delete_many` — soft-delete grace hard-delete | `janitor:hard_delete_visualizations` | `count={n}, cutoff={iso}` | `grace_cutoff` (`:72`, `soft_delete_grace_days`) |
| `:113` | `sessions.delete_many` — expired sessions | `janitor:delete_expired_sessions` | `count={n}, cutoff={iso}` | `now` (`:110`; the `expires_at < now` boundary) |
| `:127` | `visualizations.update_many` — stale-user cascade **soft-delete** | `janitor:cascade_soft_delete_visualizations` | `count={n}, users={len(stale_slugs)}, cutoff={iso}` | `user_cutoff` (`:118`, `user_max_age_days`) |
| `:139` | `gallery.delete_many` — stale-user gallery cascade | `janitor:cascade_delete_gallery` | `count={n}, users={len(stale_slugs)}` | `user_cutoff` (the `stale_slugs` derivation, `:118-121`) |
| `:147` | `flags.delete_many` — stale-user flags cascade | `janitor:cascade_delete_flags` | `count={n}, users={len(stale_slugs)}` | `user_cutoff` (derived) |
| `:155` | `sessions.delete_many` — stale-user sessions cascade | `janitor:cascade_delete_sessions` | `count={n}, users={len(stale_slugs)}` | `user_cutoff` (derived) |
| `:163` | `users.delete_many` — stale users themselves | `janitor:delete_stale_users` | `count={n}, cutoff={iso}` | `user_cutoff` (`:118`) |
| `:168` | `admin_audit.delete_many` — audit-row retention prune | `janitor:prune_audit` | `count={n}, cutoff={iso}` | `audit_cutoff` (`:167`, 90 days) |
| `:265` | `gallery.delete_many` — image-cascade (inside `_delete_images_and_cascade`) | `janitor:cascade_delete_gallery_for_images` | `count={n}, images={len(slugs_to_delete)}` | the image filter cutoff (`:101`, `asset_max_age_days`) |
| `:273` | `images.delete_many` — recency-prune image delete | `janitor:prune_images` | `count={n}, cutoff={iso}` | `cutoff` (`:63`, `asset_max_age_days`) |

**Two notes on the table:**

- **The recency contour prune is NOT in the table** because it does not call `delete_many` in `janitor.py` — it delegates to `pinned_cron.cron_prune` (`janitor.py:95`), whose deletion happens inside `api/lib/crud/pinned_cron.py:cron_prune` (`pinned_cron.py:45`, the batched `delete_many` over `{_id: {$in: ...}}`; the bounded predicate `{pinned: False, last_accessed_at: {$lt: cutoff}}` is at `pinned_cron.py:39`). The charter's "9 `delete_many` sites" enumerate the sites **in `janitor.py`**; the contour prune's *outcome* (the returned `deleted_contours` count, `janitor.py:95`) must still be audited because it is a destructive sweep with a count. **Add an eleventh row** keyed on the helper's return:

| `janitor.py:95` | `contours` via `pinned_cron.cron_prune` (helper batched delete) | `janitor:prune_contours` | `count={n}, cutoff={iso}` | `cutoff` (`:63`, `asset_max_age_days`) |

  The contour audit row is emitted in `janitor.py` from the `deleted_contours` return value, **not** inside `pinned_cron.py` — the helper is a generic bounded-prune utility (`pinned_cron.py` `cron_prune` docstring "Bounded prune. Returns the total deleted count.") shared with potential future callers, and must not acquire a janitor-specific audit side-effect. Audit emission stays in the orchestrating cycle. This is the correct seam: the helper returns a count, the cycle decides whether/how to audit it.

- **The image recency prune (`:273`) and its gallery cascade (`:265`)** are likewise *inside* `_delete_images_and_cascade` (`janitor.py:251`). Two faithful options: emit both rows inside that helper, or have the helper return a small struct (`deleted_images`, `cascaded_gallery`) and audit from the cycle. **Prefer returning the counts and auditing from `_cleanup_cycle`** for the same reason as the contour case — keep the audit policy in the orchestrator, not smeared across helpers. The helper currently returns only `int` (`janitor.py:254,274`); W3 widens it to return both counts (a 2-tuple or small dataclass) so the cycle can emit both `:265` and `:273` rows. This is a narrow, justified signature change owned by W3.

**Net audit-row count: eleven** (the ten in-`janitor.py` destructive ops + the delegated contour prune), each gated on `count ≥ 1`.

### A.3 — Partial-failure recovery (re-run idempotence)

**The guarantee to prove:** if the janitor process dies mid-sweep (crash, container kill, the `--reload` respawn of §B, or the `except Exception` swallow at `janitor.py:55`), the **next** `_cleanup_cycle` is safe to re-run and does **not** double-count audit rows for work it already did.

**Why the deletions are already idempotent (confirm, do not re-engineer):**

- Every deletion filter is **time-bounded or flag-bounded against live state**, not against a checkpoint. `visualizations.delete_many({"deleted_at": {"$lt": grace_cutoff}})` (`:73`) deletes whatever currently matches; a re-run after a partial crash simply deletes the remaining matches (the already-deleted rows are gone and no longer match). `cron_prune`'s `{pinned: False, last_accessed_at: {$lt: cutoff}}` (`pinned_cron.py:39`) is identical in character. `sessions` expired (`:113`), stale-user cascades (`:139-163`, all `$in stale_slugs` where `stale_slugs` is re-derived each cycle from `last_seen_at`), audit prune (`:168`), image prune (`:273`) — **all are `delete_many` over a predicate that re-evaluates against present state**. There is no "delete the rows I selected last time" cursor that a crash could leave dangling. **`delete_many` over a state predicate is intrinsically idempotent**: running it twice yields the same end-state. This is confirmed by the existing bounded-query test (`api/tests/test_janitor_bounded_query.py:test_cron_prune_only_removes_unpinned_past_cutoff` and `:test_grace_pass_is_a_bounded_deleted_at_range`).
- The pin recompute (`_recompute_pin_flags`, `janitor.py:173`) is explicitly documented idempotent (`janitor.py:189-191` — reset-then-`$merge`), so a crash between the recompute and the prune leaves the next cycle's recompute to re-establish the correct slate. No special handling.
- The one subtlety: the cascade chain (`:127`→`:139`→`:147`→`:155`→`:163`) is **not transactional** — a crash after the gallery cascade (`:139`) but before the user delete (`:163`) leaves the user document alive. **This is self-healing**: the next cycle re-derives `stale_slugs` (`:120-121`) from `last_seen_at` (which the partial run did not touch), the still-stale user is re-selected, and the remaining cascades re-run against whatever survived. No orphan is created that a later cycle cannot reap. **No saga / no compensation logic is warranted** (invariant 12) — the re-derivation IS the recovery. Confirm this in the test (§A.4).

**Why the audit rows do not double-count:**

The double-count hazard is *not* in re-running a sweep — it is in **writing an audit row for work a prior crashed run already wrote a row for**. The clean resolution follows directly from the §A.2 gate `count ≥ 1`:

- An audit row is written **immediately after** its `delete_many` returns, gated on `deleted_count ≥ 1`, recording **the count that this invocation deleted**. It is a *factual record of one delete operation*, not a cumulative tally.
- On a re-run after a partial crash, the re-run's `delete_many` deletes only the **residual** matches (the prior run's deletions are gone). So the re-run writes a row with the *residual* count, and the prior run wrote a row with the *partial* count. **The two rows sum to the true total and neither is spurious** — each truthfully records the documents *that invocation* removed. There is no double-count because each row is scoped to a single `delete_many` return, and `delete_many` never re-deletes an already-deleted document.
- The degenerate case — a crash *after* `delete_many` succeeded but *before* the audit `insert_one` — loses exactly one audit row (the operation happened, the record did not). This is an **acceptable, bounded, fail-safe loss** (under-counting the trail, never over-counting; never a false record of a delete that did not occur). To make even this loss vanishingly improbable, **order the audit insert immediately after the delete in the same `await` sequence** (no intervening `await` that could be a cancellation point — relevant under the §B reload-cancellation). Recording the audit row is `O(1)` and adds no failure surface worth a transaction. **A two-phase / outbox pattern is rejected** as gross over-engineering for a 6-hour background sweep (invariant 12).

**Recovery guarantee, stated:** *the janitor cycle is idempotent under arbitrary mid-sweep death — re-running converges to the same end-state because every deletion is a `delete_many` over a live-state predicate, and audit rows never double-count because each row records exactly one `delete_many`'s return and a delete never re-removes a deleted document; the only failure mode is a single lost (never duplicated, never false) audit row when death falls between a delete and its record, which is fail-safe under-counting.*

### A.4 — Integration-test shape (`api/tests/test_janitor_audit.py`)

Mirror the existing janitor test harness (`api/tests/test_janitor_bounded_query.py`): the `@requires_mongo` mark + the `run_db` helper from `conftest.py` (throwaway DB per test, dropped after), setting `database._db = db` so `get_db()` resolves to the throwaway. No Docker required — skips cleanly when no Mongo is reachable (`conftest.py:requires_mongo`).

**Test 1 — `test_each_sweep_writes_its_audit_row`.** Seed one deletable document per sweep (a past-grace `visualizations` row → `:73`; an expired `sessions` row → `:113`; a stale `users` row with a referencing `gallery`/`flags`/`sessions`/live `visualizations` set → the `:127-163` cascade family; an old `admin_audit` row → `:168`; an old-unpinned `images` row with a referencing `gallery` row → `:265,:273`; an old-unpinned `contours` row → the delegated `:95` prune). Run `_cleanup_cycle()` once. Assert `admin_audit` now contains **one row per sweep that deleted ≥ 1**, each with: `action` equal to the expected `janitor:<sweep>` string, `target` matching `count=<expected_n>`, the `cutoff=` substring present where the table specifies a cutoff, `ip_hash == "system:janitor"`, and a tz-aware `timestamp`. Assert the row count equals the number of effective sweeps (no spurious rows).

**Test 2 — `test_zero_effect_sweep_writes_no_row`.** Run `_cleanup_cycle()` against an **empty** DB (or a DB where nothing matches any cutoff). Assert `admin_audit` gains **zero janitor rows** (`action` `$regex ^janitor:` count == 0). Proves the `count ≥ 1` gate (no audit noise; clean re-run baseline).

**Test 3 — `test_rerun_is_idempotent_and_does_not_double_count`.** Seed the deletable set. Run `_cleanup_cycle()` twice. Assert: (a) after the first run the documents are gone; (b) the second run's `delete_many`s all return 0 and therefore write **no new janitor rows** (the row count after run 2 == the row count after run 1); (c) the end-state is identical. This is the re-run-idempotence proof of §A.3.

**Test 4 — `test_partial_cascade_self_heals`.** Seed a stale user whose cascade is *partially* applied out-of-band (e.g. delete the user's `gallery` rows manually to simulate a crash after `:139` but before `:163`, leaving the user alive). Run `_cleanup_cycle()`. Assert the user is now deleted and the remaining cascades completed — the re-derivation of `stale_slugs` re-selected the survivor. Proves the non-transactional cascade is self-healing (§A.3) with no orphan.

**Test 5 — `test_audit_rows_satisfy_AuditEntry`.** After a cycle, load each janitor row and construct `AuditEntry(**row_without_id)` — asserting the janitor rows are model-valid so the `/api/admin/audit` viewer (`admin.py:617`) renders a mixed admin+janitor collection without error. This is the homogeneity gate of §A.1.

Optionally a **source-grep arm** (mirroring `test_janitor_bounded_query.py`'s unconditional grep): assert `janitor.py` contains an `admin_audit.insert_one`/a shared `_log_janitor_audit` helper invocation for each sweep, so the test fails loudly if a new `delete_many` is added without an audit emission.

**Implementation note for W3 (not this lane's work):** the eleven emissions share one shape, so W3 should factor a single `_log_janitor_audit(db, action, *, count, cutoff=None, **extra)` helper in `janitor.py` (a sibling of `admin.py`'s `log_audit`, with the `"system:janitor"` sentinel baked in and the `target` string assembled from `count`/`cutoff`/`extra`). One helper, eleven call-sites, gated on `count ≥ 1`. This keeps the diff small and the test's source-grep arm simple.

---

## Part B — the `--reload` compute-abort fix

### B.1 — Diagnosis (precise, mechanism-level)

**The invocation.** `scripts/dev.sh:73-76` launches the dev backend:

```bash
uv run uvicorn api.main:app --host 0.0.0.0 --port "$API_PORT" \
    --reload --reload-dir api --reload-dir src
```

uvicorn is **0.41.0** with the `[standard]` extra (`pyproject.toml:21`, `uv.lock:1445-1454`), which pulls **`watchfiles` 1.1.1** (`uv.lock:1464,1516`). With `--reload`, uvicorn runs a *supervisor* process whose `watchfiles` watcher recursively monitors each `--reload-dir`. On a filesystem change event under a watched directory, the supervisor **terminates the worker subprocess and spawns a fresh one** (uvicorn's reload mechanism: signal the server process to shut down, then re-exec). The shutdown is not graceful with respect to in-flight CPU work — the worker process is replaced.

**Why a write under `src/` aborts an in-flight computation — the causal chain:**

1. The compute endpoints (`api/routers/contours.py:36-49` epicycles/bases; `api/routers/equations.py:32`) call into `api/services/computation.py`, which runs the heavy numerics **in a thread of the worker process** via `asyncio.to_thread(fn)` (`computation.py:44`, inside `submit_compute_job`). The thread executes `EpicycleChain.from_signal` / `build_animation_data` / the Chebyshev–Legendre fits (`computation.py:105-148`).
2. That compute code lives in the **`fourier_analysis` package**, which is sourced from **`src/`** — `pyproject.toml:40` declares `packages = ["src/fourier_analysis"]`; the live package directory is `src/fourier_analysis/` (confirmed on disk). `computation.py:12-15` imports `fourier_analysis.bases / .contours / .epicycles / .shortest_tour`.
3. Therefore the watcher's `--reload-dir src` is watching **the exact tree whose code the compute thread is executing**. Any write under `src/` — an editor save, a formatter pass, a `git checkout` touching a `.py` file — fires a `watchfiles` event.
4. The supervisor reacts by **killing the worker process**. Because the compute runs in a **thread of that same process** (not a separate process), killing the worker kills the thread mid-computation. The in-flight `to_thread` job is destroyed; the awaiting request never gets its `ComputeResult`. The client sees a dropped connection / the dev server "restarts" under it.

**This is not a logic bug; it is the reloader working as designed on a watch scope that overlaps the compute library.** The `asyncio.wait_for(..., timeout=compute_timeout_s)` guard (`computation.py:43-46`) does not help — the process is gone before the timeout fires.

**Prod is unaffected — confirmed.** The production image runs `uvicorn … --workers ${WORKERS} --proxy-headers …` with **no `--reload`** (`api/Dockerfile:24-25`, the `production` stage). There is no supervisor/watcher in prod; nothing kills the worker on a file event (the prod filesystem is the immutable image anyway). The `development` Dockerfile stage *does* carry `--reload` (`api/Dockerfile:13-16`) but with **no `--reload-dir` narrowing** — it watches uvicorn's default (the app root), which under that `COPY . .` layout includes `src/`, so the dev *container* has the same hazard as `dev.sh`. The fix must address **both** the `dev.sh` invocation and the `development` Dockerfile stage to be a true root fix (`C.md §5` lists both `scripts/dev.sh` and `Dockerfile` under the W3 surface).

### B.2 — The chosen fix (KISS order (a) ⊳ (b) ⊳ (c))

**Chosen: (a) narrow the reload watch to exclude the compute path — `src/` comes off the watch entirely.**

**Rationale.** The whole point of `--reload-dir src` is to hot-reload the *library* during dev. But the library is the **compute kernel** — the very code whose in-flight execution the reload destroys. There is a genuine tension: watch `src/` and you get hot library reload but you abort compute; don't watch it and compute survives but a library edit needs a manual restart. **KISS resolves this decisively in favour of compute survival**, because:

- The backend's job in the dev loop is to **serve the API** (compute endpoints + CRUD). Edits that the dev tightly iterates on live in `api/` (routers, services, models) — `--reload-dir api` already covers those and is the high-frequency edit surface. The `src/` library (`fourier_analysis`) is the *stable numerical core*; it is edited far less often during API/web iteration, and when it IS edited, a deliberate manual restart (Ctrl-C the dev script and re-run, or touch an `api/` file) is the honest, low-cost signal — you are changing the compute kernel, you expect a restart.
- Watching `src/` actively **harms** the dev loop: a save in the library while an epicycle compute is running silently drops that request. The current default is strictly worse than not watching it.

**The fix, concretely (root, both surfaces):**

- `scripts/dev.sh:76` — drop `--reload-dir src`, keep `--reload --reload-dir api`. The reloader now watches only the API surface; the compute library is stable across a compute run. A library edit is a deliberate manual restart.
- `api/Dockerfile:16` (the `development` stage `CMD`) — change the bare `--reload` (which watches the app root including `src/`) to `--reload --reload-dir api` to match, so the dev *container* has the same scope as `dev.sh`. The `production` stage (`:24-25`) is **untouched** — it has no `--reload` and is already correct.

This is a **one-token deletion** in `dev.sh` and a **one-flag narrowing** in the dev Dockerfile stage. No new process, no new dependency, no queue. It is the smallest mechanism that holds invariant 12.

**Residual it leaves (named, accepted):** a `src/` library edit no longer hot-reloads — it needs a manual dev-server restart. This is the correct trade: the compute kernel is the thing whose edits *should* force a clean restart, and forcing it avoids the silent compute-abort. There is no scenario where dropping `src/` from the watch loses correctness; it only changes which edits trigger an automatic restart.

### B.3 — Rejected alternatives (recorded)

**(b) Scope compute off the reloaded process (run the compute kernel in a separate, unwatched process).** This would move `submit_compute_job`'s thread work into a child process whose lifecycle is independent of the reloader. **Rejected as heavier than the problem.** It is genuine multi-process plumbing (a process pool or a worker subprocess + IPC of numpy arrays), introduces serialization cost across the boundary, and complicates the `asyncio.wait_for` timeout + semaphore bookkeeping (`computation.py:29-53`) that currently lives cleanly in-process. It also does not even solve the stated dev problem better than (a): the dev pain is "my compute died when I saved a file"; (a) eliminates that by not watching the compute path, at zero new infrastructure. (b) would only be warranted if there were a *production* reason to isolate compute (there is none — invariant 19 fixes single-replica, and prod has no reload). **Defer (b) permanently unless a production process-isolation need arises** — it is solving a problem the project does not have.

**(c) Route compute to a background task / queue (Celery, arq, a Mongo-backed job table).** **Rejected outright for this fix.** A background queue is a large operational surface (a broker or a polling worker, a job-state collection, result-fetch polling on the frontend, new failure modes) — exactly the "new container/dependency" that `C.md §3`/Wχ.P1 require per-line justification to admit, and which invariant 12 forbids absent a real need. The dev `--reload` abort is a *developer-ergonomics* finding (`W0-baseline.md §3` is explicit: "developer-ergonomics fix, not a production correctness defect"); answering it with a job queue is the textbook over-engineering the precepts forbid. The current in-process `asyncio.to_thread` + bounded semaphore + timeout (`computation.py:29-53`) is the right scale for a single-replica synchronous-result API where the client awaits its `ComputeResult` inline. **(c) is deferred as a named residual** with a real trigger: *if* a future tranche needs compute that outlives a single request (minutes-long fits, multi-user fairness beyond the current `compute_concurrency` semaphore, or compute results that must survive a deploy), *then* a background queue earns its surface — and that is a fourier-D concern, not C's. It is recorded here so the decision is auditable, not silently dropped.

**Why not "make the reloader graceful" (a non-option, recorded for completeness).** uvicorn's reloader has no "drain in-flight compute before respawn" mode that would help a multi-second CPU thread; even graceful HTTP shutdown does not wait on a detached `to_thread` CPU job. There is no flag to tune here — the only levers are *what to watch* (a) and *where compute runs* (b/c). (a) is the smallest correct lever.

---

## C — Cross-references and gate reconciliation

- **`C.md §3` W3 row** says "every janitor `delete_many` writes an `admin_audit` row (category, count, cutoff)" — §A.1/§A.2 reconcile "category" to the `janitor:` **action namespace** and "count/cutoff" to the **`target` payload**, preserving the four-field `admin_audit`/`AuditEntry` shape (no new columns). The "9 `delete_many` sites" become **eleven audit rows** (the ten in-`janitor.py` destructive ops including the `:127` cascade-soft-delete, plus the delegated `:95` contour prune).
- **`C.md §6` hard gate** "Janitor audit-log + partial-failure-recovery integration tests pass; the `--reload` compute-abort is fixed" — §A.4 specifies the tests (incl. the re-run-idempotence and self-healing proofs); §B.2 fixes the abort at the root on both dev surfaces (`dev.sh:76` + `Dockerfile:16`) with prod (`Dockerfile:24-25`) confirmed untouched.
- **No source files were modified by this lane** (research-only, per the Wα charter `W0-baseline.md §5` "share no write bounds"). W3 implements against this spec.
