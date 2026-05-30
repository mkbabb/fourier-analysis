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
import os
import socket
import subprocess
import sys
import textwrap
import traceback
from datetime import UTC, datetime

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from api.config import settings

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
    return f"{host}@{sha[:12]}@{datetime.now(tz=UTC).isoformat()}"


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
                "started_at": datetime.now(tz=UTC),
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
        {"$set": {"completed_at": datetime.now(tz=UTC), "result": "SUCCESS"}},
    )


async def _record_failed(
    db: AsyncIOMotorDatabase, name: str, version: int, error: str
) -> None:
    await db.migrations.update_one(
        {"name": name, "version": version},
        {
            "$set": {
                "completed_at": datetime.now(tz=UTC),
                "result": "FAILED",
                "error": error[:4096],  # truncate to keep the doc bounded
            }
        },
    )


async def run_pending_migrations(dry_run: bool = False) -> int:
    """Returns the number of failed migrations (zero on full success)."""
    # One-identity (inv-11): use the app's canonical Mongo config, NOT a parallel
    # env-var guess. The runner executes inside the backend container as
    # `python -m api.scripts.run_pending_migrations`, so the `api` package is
    # importable; `settings.mongo_uri` carries the exact URI (auth + TLS params +
    # default database) the live app connects with. The prior MONGODB_URI/
    # MONGODB_DB reads matched NO deployed env var (the compose sets MONGO_URI),
    # so the runner aborted before doing anything — masked until F.W8 because the
    # `api` service-name + base-interpreter errors short-circuited it first.
    client = AsyncIOMotorClient(settings.mongo_uri, tz_aware=True)
    try:
        db = client.get_default_database()  # db name is the URI path (…/fourier)
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
            await _record_start(db, name, version, run_id)
            try:
                # Run each migration as its OWN process via its public `main()`
                # entry point (`python -m <module>`) — NOT in-process. Every
                # migrate_*.py main() calls asyncio.run(_amain(...)); invoking
                # that in-process would nest asyncio.run() inside THIS runner's
                # already-running event loop and raise "asyncio.run() cannot be
                # called from a running event loop" (the latent defect that kept
                # E.W9 at GREEN-pending-real-test — it never actually ran). A
                # subprocess gives each migration its own loop + Mongo client
                # (the module contract); an import error surfaces as a non-zero
                # exit captured below. sys.executable is the venv interpreter
                # (the runner itself launches under `uv run`), so deps resolve.
                proc = subprocess.run(
                    [sys.executable, "-m", module_path],
                    capture_output=True,
                    text=True,
                )
                if proc.stdout.strip():
                    print(textwrap.indent(proc.stdout.rstrip(), "    "))
                if proc.returncode != 0:
                    raise RuntimeError(
                        f"migration exited {proc.returncode}: "
                        f"{proc.stderr.strip()[-800:]}"
                    )
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
