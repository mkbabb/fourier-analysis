"""Idempotent backfill: every ``admin_audit`` row names its ``actor`` (X·F F-D6 · FW6-G9).

Before F-D6 the janitor smuggled its identity into ``ip_hash`` (the sentinel
``"system:janitor"``) and admin rows had no actor at all. ``AuditEntry`` now
requires ``actor: {kind: user | system, id}`` and a nullable ``ip_hash``, so the
stored trail is brought to that one shape (no dual-shape reader):

- a row whose ``ip_hash`` is the janitor sentinel → ``actor {system, janitor}``,
  ``ip_hash`` null;
- any other row without an actor → ``actor {user, admin}`` (admin writes were
  bearer-token requests), ``ip_hash`` kept.

    python -m api.scripts.migrate_audit_actor            # live
    python -m api.scripts.migrate_audit_actor --dry-run  # report only

The selector is the absence of ``actor``, so a re-run touches nothing.
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from typing import Any

from api.services.database import close_db, connect_db, get_db

_SENTINEL = "system:janitor"


async def run_migration(db: Any, *, dry_run: bool = False) -> dict[str, int]:
    pending = {"actor": {"$exists": False}}
    system = {**pending, "ip_hash": _SENTINEL}
    report = {
        "system": await db.admin_audit.count_documents(system),
        "user": await db.admin_audit.count_documents({**pending, "ip_hash": {"$ne": _SENTINEL}}),
    }
    if dry_run:
        return report
    await db.admin_audit.update_many(
        system, {"$set": {"actor": {"kind": "system", "id": "janitor"}, "ip_hash": None}}
    )
    await db.admin_audit.update_many(pending, {"$set": {"actor": {"kind": "user", "id": "admin"}}})
    left = await db.admin_audit.count_documents(pending)
    if left:
        raise RuntimeError(f"post-condition: {left} audit row(s) still lack an actor")
    return report


async def _amain(dry_run: bool) -> int:
    await connect_db()
    try:
        report = await run_migration(get_db(), dry_run=dry_run)
        mode = "DRY-RUN (no writes)" if dry_run else "LIVE"
        print(f"migrate_audit_actor [{mode}] system={report['system']} user={report['user']}")
        return 0
    finally:
        await close_db()


def main() -> int:
    parser = argparse.ArgumentParser(prog="migrate_audit_actor", description=__doc__.splitlines()[0])
    parser.add_argument("--dry-run", action="store_true", help="report counts without writing.")
    return asyncio.run(_amain(parser.parse_args().dry_run))


if __name__ == "__main__":
    sys.exit(main())
