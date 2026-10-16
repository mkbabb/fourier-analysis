"""X.F.W14V.r3 — F-81 (i): one easing catalogue, migrated at the root.

The animation store's six easing keys (``linear``, ``sine``, ``quad``,
``cubic``, ``circ``, ``expo``) were a second catalogue beside the morph
catalogue (``ease-in-out-sine`` …, ``web/src/lib/easings.ts``). Addendum (h)
item 3(i) (COHESION §0eb) rules ONE catalogue with no alias layer: stored
visualization documents are rewritten once, server-side, and the model takes
the catalogue's ``Literal`` so a legacy key is refused, never aliased.

These tests seed legacy rows, run the migration, and read the row back through
the real ASGI stack — the legacy document reads migrated.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any

import pytest
from bson import ObjectId
from pydantic import ValidationError

from api.models.shared import AnimationSettings

from conftest import asgi, requires_mongo, run_db

# One row per legacy key, plus a row already on the catalogue and a row whose
# easing is off every catalogue (a hand-edited or drifted record).
LEGACY_TO_CATALOGUE = {
    "linear": "linear",
    "sine": "ease-in-out-sine",
    "quad": "ease-in-out-quad",
    "cubic": "ease-in-out-cubic",
    "circ": "ease-in-out-circ",
    "expo": "ease-in-out-expo",
}
SLUGS = {
    "linear": "amber-brave-calm-lark",
    "sine": "azure-bold-cool-wren",
    "quad": "ashen-bright-crisp-kite",
    "cubic": "ample-busy-clear-crow",
    "circ": "agile-deep-fair-swan",
    "expo": "alert-eager-fine-hawk",
}
ON_CATALOGUE_SLUG = "amber-calm-fresh-owl"
OFF_CATALOGUE_SLUG = "azure-cool-grand-ibis"


def _legacy_row(slug: str, easing: str) -> dict[str, Any]:
    now = datetime(2026, 1, 1, tzinfo=UTC)
    return {
        "_id": ObjectId(),
        "slug": slug,
        "owner_slug": "owner-quiet-grey-heron",
        "visibility": "public",
        "content_hash": "h" * 64,
        "image_slug": "img-shared",
        "contour_hash": "c" * 64,
        "active_bases": ["fourier-epicycles"],
        "n_harmonics": 64,
        "contour_settings": {"blur_sigma": 0.5, "n_harmonics": 200},
        "animation_settings": {
            "fps": 30,
            "duration": 30.0,
            "max_circles": 80,
            "easing": easing,
            "speed": 1.0,
            "active_bases": ["fourier-epicycles"],
        },
        "set_hash": "s" * 64,
        "likes": 0,
        "views": 0,
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
    }


async def _seed(db: Any) -> None:
    from api.services import database

    database._db = db
    rows = [_legacy_row(SLUGS[k], k) for k in LEGACY_TO_CATALOGUE]
    rows.append(_legacy_row(ON_CATALOGUE_SLUG, "ease-in-out-cubic"))
    rows.append(_legacy_row(OFF_CATALOGUE_SLUG, "bounce"))
    await db.visualizations.insert_many(rows)


async def _read_easing(slug: str) -> tuple[int, str | None]:
    status, raw = await asgi("GET", f"/api/visualizations/{slug}")
    body = json.loads(raw)
    return status, (body.get("animation_settings") or {}).get("easing")


@requires_mongo
def test_legacy_visualization_reads_migrated():
    from api.scripts.migrate_animation_easing import run_migration

    async def body(db: Any) -> tuple[Any, dict[str, tuple[int, str | None]]]:
        await _seed(db)
        report = await run_migration(db)
        slugs = [*SLUGS.values(), ON_CATALOGUE_SLUG, OFF_CATALOGUE_SLUG]
        return report, {s: await _read_easing(s) for s in slugs}

    report, got = run_db(body)
    for key, catalogue_name in LEGACY_TO_CATALOGUE.items():
        assert got[SLUGS[key]] == (200, catalogue_name), key
    assert got[ON_CATALOGUE_SLUG] == (200, "ease-in-out-cubic")
    # Off every catalogue: discarded to the catalogue default, never aliased.
    assert got[OFF_CATALOGUE_SLUG] == (200, "ease-in-out-sine")
    assert report.scanned == 8
    # ``linear`` already carries its catalogue name, so five legacy rows move.
    assert report.rewritten == 5
    assert report.reset_off_catalogue == 1
    assert report.already_on_catalogue == 2


@requires_mongo
def test_migration_is_idempotent():
    from api.scripts.migrate_animation_easing import run_migration

    async def body(db: Any) -> tuple[Any, Any, Any]:
        await _seed(db)
        dry = await run_migration(db, dry_run=True)
        first = await run_migration(db)
        second = await run_migration(db)
        return dry, first, second

    dry, first, second = run_db(body)
    assert (dry.rewritten, dry.reset_off_catalogue) == (5, 1)
    assert (first.rewritten, first.reset_off_catalogue) == (5, 1)
    assert (second.rewritten, second.reset_off_catalogue) == (0, 0)
    assert second.already_on_catalogue == 8


@pytest.mark.parametrize("legacy", ["sine", "quad", "cubic", "circ", "expo"])
def test_model_refuses_a_legacy_key(legacy: str):
    """No alias layer: a legacy key is outside the catalogue ``Literal``."""
    with pytest.raises(ValidationError):
        AnimationSettings(easing=legacy)


def test_model_default_is_the_catalogue_default():
    assert AnimationSettings().easing == "ease-in-out-sine"
