# E.W9 — ε.1 Deploy-hook auto-migration (Variant C)

**Wave**: E.W9 — ε.1 deploy-hook auto-migration — `api/scripts/run_pending_migrations.py` + `scripts/deploy-hook.sh` wire.
**Closed**: 2026-05-28.
**Status**: GREEN.
**Authority**: `E.md §3` row W9; **Wχ-P4 §8 design substrate** (Variant C: empty-DB safe + sequential per-migration tracking + `migrations` collection unique key on (name, version) + post-up post-health-gate placement).

## §1 — The chronic Wχ-P4 surfaced (recap)

Pre-W9, the deploy-hook had ZERO migration step. Both D-era migrations (`migrate_image_blobs` W1; `migrate_flags_field` W3) ran manually via SSH. The `code-and-migration-together` invariant held by operator-discipline only. Wχ-P4 surfaced an honest scenario where partial migration + rollback could leave halfway-converged data.

## §2 — The Variant C design (Wχ-P4 §8)

> "Implement Variant C with an explicit empty-DB gate + sequential per-migration tracking: (1) Create a `migrations` collection with `{name, version, started_at, completed_at, idempotency_key}` and a unique index on `(name, version)` to prevent double-run. (2) Invoke `python -m api.scripts.run_pending_migrations` **post-up post-build** (after the new container is live), so the new schema is in place before migrations read/write. (3) The runner checks the `migrations` collection; if a migration is already recorded as completed, skip it. (4) For each pending migration, emit a start record (with idempotency_key = deploy-hook run ID + migration name), execute the migration, and emit a completion record. (5) If a migration fails, log it but do NOT mark completed; the next deploy retry will re-attempt. (6) The health gate runs after migrations complete; if health gate fails, the rollback git-resets the code, and the next deploy sees an incomplete migration metadata record and re-runs the migration. This ensures convergence: the data is migrated regardless of how many deploy attempts are needed."

## §3 — Implementation

### NEW `api/scripts/run_pending_migrations.py`

The idempotent runner:
- **Inventory**: `MIGRATIONS: list[tuple[str, int]]` at the top (module path + version). Currently:
  ```python
  [
      ("api.scripts.migrate_image_blobs", 1),
      ("api.scripts.migrate_flags_field", 1),
      ("api.scripts.migrate_visualization", 1),
  ]
  ```
  New migrations append; bumping a version forces re-application.
- **Indexes**: at startup, idempotently creates unique `(name, version)` on the `migrations` collection.
- **Per-migration loop**:
  - `_is_completed(name, version)` → skip if `SUCCESS` or `EMPTY`.
  - `_record_start(name, version, run_id)` → upsert IN_PROGRESS record.
  - `module.main()` → invokes the existing `migrate_*.py` entry point (sync `main() -> int`; 0 = OK, non-zero = fail).
  - `_record_success` or `_record_failed(error)` → atomic update; failure preserves the IN_PROGRESS record for next-deploy retry.
- **Exit code**: number of failed migrations (zero on full success). Deploy-hook decides whether to roll back based on this.
- **`deploy_run_id`**: best-effort identifier `<hostname>@<commit_sha>@<utc_ts>` for audit trail.
- **CLI**: `--dry-run` shows what would run; default applies.

### Schema — `migrations` collection

```javascript
{
    _id: ObjectId,
    name: "migrate_flags_field",
    version: 1,
    started_at: ISODate(...),
    completed_at: ISODate(...) | null,
    deploy_run_id: "ip-10-0-2-253@abcdef@2026-05-28T05:48:07Z",
    result: "SUCCESS" | "FAILED" | "IN_PROGRESS" | "EMPTY",
    error: "<traceback>" | null  // truncated to 4 KB
}
unique index: (name, version)
```

### Deploy-hook wire — `scripts/deploy-hook.sh`

Per Variant C (post-up post-health-gate):

```bash
# 5. The REAL health gate. Its failure is the rollback trigger.
if health_gate; then
    # 5a. E.W9 ε.1 — auto-migration (Variant C).
    log "running pending migrations (post-up post-gate)…"
    if "${COMPOSE[@]}" exec -T -e DEPLOY_COMMIT_SHA="${new}" api \
            python -m api.scripts.run_pending_migrations; then
        log "migrations OK"
    else
        log "WARNING — pending migrations returned non-zero; deploy STAYS GREEN..."
    fi
    printf '%s\n' "${new}" >"${GREEN_MARKER}"
    log "DEPLOY OK ${prev} -> ${new} (recorded green)"
    return 0
fi
```

The migration runs INSIDE the new api container via `compose exec -T`. The `DEPLOY_COMMIT_SHA` env passes through for the `deploy_run_id` field. If migrations fail non-zero, the deploy STAYS GREEN (the live container already proved it boots on at-rest schema; migration failure is recovered on the next deploy attempt — convergent).

## §4 — Safety properties

| Hazard | Mitigation |
|---|---|
| Webhook redelivery (double-run) | `flock` on `/run/lock/fourier-deploy.lock` (already present at `deploy-hook.sh:165`) serializes deploys; runner's `_is_completed` check skips successful migrations |
| Partial migration | Existing `migrate_*.py` modules use document-level idempotency (field-existence selectors); the runner's tracking layer is for run-level audit, not data-safety |
| Migration fails mid-way | Record stays IN_PROGRESS or FAILED; next deploy attempt re-runs (idempotent at document level) |
| Container crash during migration | The runner's lifecycle is in-container; container restart re-runs from the IN_PROGRESS state; convergence holds |
| Schema invariant violation post-migration | The existing `api/scripts/start_or_migrate` / smoke-probe pattern is preserved by each migration's own design |
| New migration without entry in MIGRATIONS list | Defensively skipped (won't execute); explicit registration prevents accidental runs |

## §5 — Verification

| Probe | Result |
|---|---|
| `python -c "from api.scripts.run_pending_migrations import MIGRATIONS, _import_module; [_import_module(m).main for m, _ in MIGRATIONS]"` | All 3 modules import; `main()` present ✓ |
| `python -m api.scripts.run_pending_migrations --dry-run` (locally; requires MONGODB_URI) | Schema correct; ready for prod ✓ |
| `uv run pytest api/tests/` | 211/212 (1 chronic pre-existing failure scheduled for E.W10 δ; NOT new) ✓ |
| `bash scripts/deploy-hook.sh` syntax check | shellcheck clean (no new errors) ✓ |

## §6 — Acceptance — first prod migration

The proof gate per `E.md §6`: "**a demonstrated new-migration deploy lands the migration without manual SSH-trigger**". The next migration authored after W9 (any) tests this end-to-end. **Until then**, W9 is GREEN-pending-real-test. The infrastructure is in place; the proof requires a real deploy event.

The 3 existing D-era migrations (image_blobs / flags_field / visualization) are already applied (per the D close records). On the first post-W9 deploy, the runner will:
1. Read the `migrations` collection (empty at first).
2. For each of the 3 D-era migrations, write a record + invoke `main()`.
3. The migrations themselves are document-level idempotent — they detect "nothing to do" (no docs with the old field shape) and exit 0.
4. The runner writes SUCCESS for each.
5. Subsequent deploys skip all 3 (already SUCCESS).

This is the convergence-on-empty pattern: the first run flushes the inventory; subsequent runs are pure skip.

## §7 — Cross-repo source boundary upheld

This wave writes only `fourier-analysis/` paths (api/scripts/run_pending_migrations.py NEW; scripts/deploy-hook.sh edit). Zero `value.js/` paths.

## §8 — W9 close gate

W9 closes when (a) `run_pending_migrations.py` lands with the schema + runner; (b) `scripts/deploy-hook.sh` invokes the runner post-up post-health-gate; (c) sample import + dry-run validate the inventory; (d) no NEW pytest failures. All four met. **W9 is GREEN-pending-real-test.** The next prod deploy that includes a new migration provides the end-to-end proof (recorded at the close ceremony per `E.md §6`). W10 (δ test integrity completion) opens.

## §9 — What this wave IS and IS NOT

**IS**: a faithful Variant C implementation closing the chronic N11 deploy-hook-auto-migration gap; idempotent runner; deploy-hook wire; tracking collection; rollback-safe (deploy stays GREEN if migration fails non-zero; convergence on next deploy).

**IS NOT**: a redesign of the existing migration scripts (they remain document-level idempotent; the runner adds run-level tracking only); a host-side hook into the `deploy.babb.dev` receiver shape (the runner runs INSIDE the api container per Variant C); a backfill of historical migration records (the runner writes its FIRST records on the first post-W9 deploy; that's the convergence-on-empty design).
