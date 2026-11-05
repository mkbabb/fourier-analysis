"""One-time backfill of ``contours.image_bounds`` (X·F F-D7 · FW6-G14).

``get_contour`` used to compute and persist a missing ``image_bounds`` on a
GET. A read never writes (F-D5), and every new contour now carries its bounds
from its write (extraction, or the editor's POST), so the legacy rows are
brought forward here once, with the bounds the GET would have written: the
linked image laid out at the default extraction resize. An editor contour is
never given guessed bounds (its points may live in another resize's space), and
a row whose image is gone or pre-migration stays as it is, reported.

    python -m api.scripts.migrate_contour_bounds            # live
    python -m api.scripts.migrate_contour_bounds --dry-run  # report only
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from typing import Any

from pydantic import ValidationError

from api.models.assets import ImageAsset
from api.models.shared import ContourSettings
from api.services.database import close_db, connect_db, get_db
from api.services.image_storage import BlobNotFound, default_image_bounds


async def run_migration(db: Any, *, dry_run: bool = False) -> dict[str, int]:
    report = {"backfilled": 0, "unresolvable": 0}
    pending = {"image_bounds": None, "image_slug": {"$ne": None}, "source": {"$ne": "editor"}}
    async for contour in db.contours.find(pending, {"image_slug": 1}):
        image = await db.images.find_one({"image_slug": contour["image_slug"]}, {"blob": 0})
        try:
            bounds = default_image_bounds(ImageAsset.model_validate(image or {}), ContourSettings().resize)
        except (ValidationError, BlobNotFound, OSError):
            report["unresolvable"] += 1
            continue
        report["backfilled"] += 1
        if not dry_run:
            await db.contours.update_one({"_id": contour["_id"]}, {"$set": {"image_bounds": bounds}})
    return report


async def _amain(dry_run: bool) -> int:
    await connect_db()
    try:
        report = await run_migration(get_db(), dry_run=dry_run)
        mode = "DRY-RUN (no writes)" if dry_run else "LIVE"
        print(f"migrate_contour_bounds [{mode}] backfilled={report['backfilled']} unresolvable={report['unresolvable']}")
        return 0
    finally:
        await close_db()


def main() -> int:
    parser = argparse.ArgumentParser(prog="migrate_contour_bounds", description=__doc__.splitlines()[0])
    parser.add_argument("--dry-run", action="store_true", help="report counts without writing.")
    return asyncio.run(_amain(parser.parse_args().dry_run))


if __name__ == "__main__":
    sys.exit(main())
