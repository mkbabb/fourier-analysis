"""One-shot live-session TTL extension: 7 → 30 days (fourier-B.W4 scope 13).

CRUD-CONTRACT §6 binds ``session_ttl_days = 30``; the config default already
mints new sessions with the 30-day window (``api/config.py:session_ttl_days``).
This script extends the ``expires_at`` of sessions minted under the old 7-day
window so an already-active session is not truncated by the config bump.

The extension adds the 23-day delta (30 − 7) to every still-live session's
``expires_at`` (a Mongo aggregation-pipeline ``updateMany`` — server-side, no
read-modify-write round trip)::

    db.sessions.updateMany(
        {expires_at: {$gt: now}},
        [{$set: {expires_at: {$add: ["$expires_at", 23 * 86400 * 1000]}}}],
    )

Idempotency caveat
------------------
This one-shot is NOT idempotent — a second run shifts the same rows another
23 days. It is meant to run exactly once at the W4 deploy boundary, against a
backend that is stopped or running without ``--reload`` (the same constraint as
``migrate_visualization.py``). Already-expired sessions (``expires_at <= now``)
are left untouched — they are cron-reaped on the next janitor tick.

Run::

    python -m api.scripts.extend_session_ttl            # apply
    python -m api.scripts.extend_session_ttl --dry-run  # count only, no write
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from datetime import UTC, datetime, timedelta

from api.services.database import close_db, connect_db, get_db

# The delta between the old (7-day) and the contract (30-day) session TTL.
_OLD_TTL_DAYS = 7
_NEW_TTL_DAYS = 30
_DELTA = timedelta(days=_NEW_TTL_DAYS - _OLD_TTL_DAYS)


async def extend_live_sessions(db, *, dry_run: bool = False) -> dict:
    """Add the 23-day delta to every still-live session's ``expires_at``.

    Returns ``{matched, modified}``. A dry run reports the candidate count and
    writes nothing.
    """
    now = datetime.now(UTC)
    query = {"expires_at": {"$gt": now}}

    if dry_run:
        matched = await db.sessions.count_documents(query)
        return {"matched": matched, "modified": 0, "dry_run": True}

    # Aggregation-pipeline update: ``$add`` an aware timedelta server-side. Motor
    # serialises the timedelta as a duration delta against the BSON datetime.
    result = await db.sessions.update_many(
        query,
        [{"$set": {"expires_at": {"$add": ["$expires_at", _DELTA]}}}],
    )
    return {
        "matched": result.matched_count,
        "modified": result.modified_count,
        "dry_run": False,
    }


async def _amain(dry_run: bool) -> int:
    await connect_db()
    try:
        db = get_db()
        report = await extend_live_sessions(db, dry_run=dry_run)
        mode = "DRY-RUN" if report["dry_run"] else "APPLIED"
        print(
            f"[{mode}] session-TTL extension (+{(_NEW_TTL_DAYS - _OLD_TTL_DAYS)}d): "
            f"matched={report['matched']} modified={report['modified']}"
        )
        return 0
    finally:
        await close_db()


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="extend_session_ttl",
        description="One-shot: extend live sessions' expires_at by 23 days (7→30d TTL).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="count candidate live sessions without writing.",
    )
    args = parser.parse_args()
    return asyncio.run(_amain(args.dry_run))


if __name__ == "__main__":
    sys.exit(main())
