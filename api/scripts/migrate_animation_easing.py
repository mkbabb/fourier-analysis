"""Idempotent rewrite: stored animation easings onto the ONE catalogue's names.

X.F.W14V.r3 — F-81 (i), F-W14V addendum (h) item 3(i), COHESION §0eb. The
animation store kept a six-key catalogue (``linear``, ``sine``, ``quad``,
``cubic``, ``circ``, ``expo``) beside the morph catalogue whose names are
``ease-in-out-sine`` … (``web/src/lib/easings.ts``). The ruling is one
catalogue, migrated at the root with no alias layer: every stored
``visualizations.animation_settings.easing`` is rewritten ONCE to its catalogue
name, and ``api.models.shared.AnimationSettings.easing`` takes the catalogue
``Literal`` so a legacy key is refused thereafter. The legacy map below lives in
this one-time script only; no runtime path reads it.

    python -m api.scripts.migrate_animation_easing            # live rewrite
    python -m api.scripts.migrate_animation_easing --dry-run  # report only

Idempotency
-----------
The selectors are the legacy VALUES: a converged row carries a catalogue name,
matches no selector and is bypassed, so a second run modifies zero documents.
A row whose easing is off every catalogue (a hand-edited or drifted record) is
DISCARDED to the catalogue default — reset, never mapped — and counted apart.

Out of scope, by design
-----------------------
- ``set_hash`` is not recomputed. It is the version key stamped at create or
  remix time; an in-place update (``PUT``) already changes ``animation_settings``
  without re-keying, and this rewrite is the same kind of in-place edit.
- ``visualization_versions`` rows are content-addressed history (``_id =
  f"{viz_slug}:{set_hash}"``) and are never read back through
  ``AnimationSettings``; they are left as recorded.
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import sys
from dataclasses import dataclass
from typing import Any, get_args

from api.models.shared import DEFAULT_ANIMATION_EASING, AnimationEasing
from api.services.database import close_db, connect_db, get_db

logger = logging.getLogger("migrate_animation_easing")

# The one-time map, legacy key → catalogue name. ``linear`` is already the
# catalogue's name and so needs no entry.
LEGACY_EASING: dict[str, AnimationEasing] = {
    "sine": "ease-in-out-sine",
    "quad": "ease-in-out-quad",
    "cubic": "ease-in-out-cubic",
    "circ": "ease-in-out-circ",
    "expo": "ease-in-out-expo",
}
CATALOGUE: tuple[str, ...] = get_args(AnimationEasing)
_FIELD = "animation_settings.easing"


@dataclass
class Report:
    scanned: int = 0
    rewritten: int = 0
    reset_off_catalogue: int = 0
    already_on_catalogue: int = 0
    dry_run: bool = False

    def summary(self) -> str:
        mode = "DRY-RUN (no writes)" if self.dry_run else "LIVE"
        return (
            f"migrate_animation_easing [{mode}]\n"
            f"  scanned               = {self.scanned}\n"
            f"  rewritten             = {self.rewritten}\n"
            f"  reset_off_catalogue   = {self.reset_off_catalogue}\n"
            f"  already_on_catalogue  = {self.already_on_catalogue}"
        )


def _off_catalogue() -> dict[str, Any]:
    """A stored easing that is neither a catalogue name nor a legacy key."""
    return {_FIELD: {"$exists": True, "$nin": [*CATALOGUE, *LEGACY_EASING]}}


async def run_migration(db: Any, *, dry_run: bool = False) -> Report:
    """One idempotent pass over ``visualizations``."""
    report = Report(dry_run=dry_run)
    report.scanned = await db.visualizations.count_documents({_FIELD: {"$exists": True}})

    if dry_run:
        report.rewritten = await db.visualizations.count_documents(
            {_FIELD: {"$in": list(LEGACY_EASING)}}
        )
        report.reset_off_catalogue = await db.visualizations.count_documents(_off_catalogue())
    else:
        for legacy, name in LEGACY_EASING.items():
            result = await db.visualizations.update_many({_FIELD: legacy}, {"$set": {_FIELD: name}})
            report.rewritten += result.modified_count
        result = await db.visualizations.update_many(
            _off_catalogue(), {"$set": {_FIELD: DEFAULT_ANIMATION_EASING}}
        )
        report.reset_off_catalogue = result.modified_count

    report.already_on_catalogue = report.scanned - report.rewritten - report.reset_off_catalogue
    if not dry_run:
        await _assert_post_conditions(db)
    return report


async def _assert_post_conditions(db: Any) -> None:
    """Completeness: no stored easing is outside the catalogue."""
    stray = await db.visualizations.count_documents(
        {_FIELD: {"$exists": True, "$nin": list(CATALOGUE)}}
    )
    if stray > 0:
        raise RuntimeError(f"post-condition: {stray} visualization(s) carry an off-catalogue easing")


async def _amain(dry_run: bool) -> int:
    await connect_db()
    try:
        report = await run_migration(get_db(), dry_run=dry_run)
        print(report.summary())
        return 0
    finally:
        await close_db()


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="migrate_animation_easing",
        description="Rewrite stored animation easings onto the one catalogue (idempotent).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="report counts without rewriting any document.",
    )
    args = parser.parse_args()
    return asyncio.run(_amain(args.dry_run))


if __name__ == "__main__":
    sys.exit(main())
