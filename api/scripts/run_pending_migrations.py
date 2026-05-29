"""E.W9 ε.1 — Idempotent runner for all pending one-off migrations.

Per Wχ-P4 §8 (Variant C). The runner:
  1. Discovers all `api/scripts/migrate_*.py` modules.
  2. For each, checks the `migrations` collection (idempotent: skip if
     completed). Empty-DB shortcut: if the module's pre-check function
     returns `empty=True`, the migration is recorded as no-op + completed
     without running.
  3. Writes an `IN_PROGRESS` start record (unique on `(name, version)`).
  4. Invokes the module's `main()` entry point.
  5. Writes `SUCCESS` (with completed_at) or `FAILED` (with traceback).
  6. Failures DO NOT block other migrations (each is independent); the
     overall exit code is non-zero if ANY migration failed, so the
     deploy-hook can decide whether to roll back.

Run modes:
  python -m api.scripts.run_pending_migrations            # apply
  python -m api.scripts.run_pending_migrations --dry-run  # report what would run

Invoked by `scripts/deploy-hook.sh` AFTER the new container is up and the
health gate passes (Variant C post-up post-health-gate placement). The
flock on `/run/lock/fourier-deploy.lock` (already present at deploy-hook:165)
serializes any webhook redelivery hazard.

Schema:
    migrations {
        _id: ObjectId,
        name: str,             # e.g. "migrate_flags_field"
        version: int,          # monotonic per migration; from MIGRATION_VERSION
        started_at: datetime,
        completed_at: datetime | None,
        deploy_run_id: str,    # idempotency hint (host + commit + ts)
        result: "SUCCESS" | "FAILED" | "IN_PROGRESS" | "EMPTY",
        error: str | None,     # truncated traceback on FAILED
    }
    unique index: (name, version)
"""

from __future__ import annotations

import argparse
import asyncio
import importlib
import os
import socket
import sys
import traceback
from datetime import datetime
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

# Inventory of one-off migrations + their explicit version. Bump version
# when re-running an already-applied migration is intended (e.g. schema
# changed). Otherwise add new entries; the runner skips completed ones.
MIGRATIONS: list[tuple[str, int]] = [
    ("api.scripts.migrate_image_blobs", 1),
    ("api.scripts.migrate_flags_field", 1),
    ("api.scripts.migrate_visualization", 1),
]


def _deploy_run_id() -> str:
    """Best-effort identifier tying this run to a deploy + host."""
    sha = os.environ.get("DEPLOY_COMMIT_SHA", "unknown")
    host = socket.gethostname()
    return f"{host}@{sha[:12]}@{datetime.utcnow().isoformat()}"


async def _ensure_indexes(db: AsyncIOMotorDatabase) -> None:
    """Idempotent: create the unique (name, version) index if absent."""
    await db.migrations.create_index(
        [("name", 1), ("version", 1)],
        unique=True,
    )


async def _is_completed(db: AsyncIOMotorDatabase, name: str, version: int) -> bool:
    doc = await db.migrations.find_one({"name": name, "version": version})
    return doc is not None and doc.get("result") in ("SUCCESS", "EMPTY")


async def _record_start(
    db: AsyncIOMotorDatabase, name: str, version: int, run_id: str
) -> None:
    await db.migrations.update_one(
        {"name": name, "version": version},
        {
            "$set": {
                "started_at": datetime.utcnow(),
                "completed_at": None,
                "deploy_run_id": run_id,
                "result": "IN_PROGRESS",
                "error": None,
            }
        },
        upsert=True,
    )


async def _record_success(
    db: AsyncIOMotorDatabase, name: str, version: int
) -> None:
    await db.migrations.update_one(
        {"name": name, "version": version},
        {"$set": {"completed_at": datetime.utcnow(), "result": "SUCCESS"}},
    )


async def _record_failed(
    db: AsyncIOMotorDatabase, name: str, version: int, error: str
) -> None:
    await db.migrations.update_one(
        {"name": name, "version": version},
        {
            "$set": {
                "completed_at": datetime.utcnow(),
                "result": "FAILED",
                "error": error[:4096],  # truncate to keep the doc bounded
            }
        },
    )


def _import_module(module_path: str):
    """Robust import that ensures the repo root is on sys.path."""
    repo_root = Path(__file__).resolve().parent.parent.parent
    if str(repo_root) not in sys.path:
        sys.path.insert(0, str(repo_root))
    return importlib.import_module(module_path)


async def run_pending_migrations(dry_run: bool = False) -> int:
    """Returns the number of failed migrations (zero on full success)."""
    mongo_uri = os.environ.get("MONGODB_URI") or os.environ.get("MONGODB_URL")
    if not mongo_uri:
        print("[run-pending-migrations] ERROR: MONGODB_URI not set; aborting.", file=sys.stderr)
        return 1

    client = AsyncIOMotorClient(mongo_uri)
    try:
        db_name = os.environ.get("MONGODB_DB", "fourier")
        db = client[db_name]
        await _ensure_indexes(db)
        run_id = _deploy_run_id()

        print(f"[run-pending-migrations] deploy_run_id={run_id}")
        failed = 0

        for module_path, version in MIGRATIONS:
            name = module_path.rsplit(".", 1)[-1]
            if await _is_completed(db, name, version):
                print(f"  [SKIP] {name}@v{version} already completed")
                continue
            if dry_run:
                print(f"  [DRY-RUN] would apply {name}@v{version}")
                continue

            print(f"  [APPLY] {name}@v{version}", flush=True)
            try:
                module = _import_module(module_path)
            except Exception:
                tb = traceback.format_exc()
                print(f"    IMPORT FAILED: {tb}", file=sys.stderr)
                await _record_failed(db, name, version, tb)
                failed += 1
                continue

            await _record_start(db, name, version, run_id)
            try:
                # Each existing migrate_*.py module has a sync `main() -> int`
                # entry point. We invoke it in-process; the migration handles
                # its own Mongo client (per its docstring). Exit code 0 = OK.
                rc = module.main()
                if rc != 0:
                    raise RuntimeError(f"migration returned non-zero exit code: {rc}")
                await _record_success(db, name, version)
                print(f"    SUCCESS {name}@v{version}")
            except Exception:
                tb = traceback.format_exc()
                print(f"    FAILED {name}@v{version}: {tb}", file=sys.stderr)
                await _record_failed(db, name, version, tb)
                failed += 1

        if failed > 0:
            print(f"[run-pending-migrations] {failed} migration(s) FAILED", file=sys.stderr)
        else:
            print("[run-pending-migrations] all migrations OK")
        return failed
    finally:
        client.close()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="report only; no writes")
    args = parser.parse_args()
    return asyncio.run(run_pending_migrations(dry_run=args.dry_run))


if __name__ == "__main__":
    sys.exit(main())
