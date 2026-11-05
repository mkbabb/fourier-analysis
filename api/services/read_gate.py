"""The one read gate (X·F F-D5 · FW6-G5, G6, G11).

Readability was decided per route: the visualization read had its own copy of
the draft/deleted rule, the fork breadcrumb walked parents with a bare
``find_one`` (and emitted the lineage of private ancestors), and the image
routes had no gate at all. Every read now asks these two predicates, and no
read writes: views ride ``POST /visualizations/{slug}/view`` and recency rides
the write verbs.

An image has no visibility of its own. It inherits one from the live
visualizations that reference it: readable when one of them is readable to the
viewer, or when the viewer uploaded it (a session upload is recorded in the
image's ``uploaders``), or while no live visualization references it at all (a
fresh upload in the editor, addressed by its slug as before). An image that
only drafts reference is therefore the drafts' owner's alone.
"""

from __future__ import annotations

from typing import Any

from api.lib.crud import softdelete


async def readable_visualization(db: Any, slug: str, viewer: str | None) -> dict | None:
    """The live, viewer-visible row for ``slug`` (a draft is owner-only), or None."""
    doc = await db.visualizations.find_one({"slug": slug})
    if doc is None or doc.get("deleted_at") is not None:
        return None
    is_owner = viewer is not None and viewer == doc.get("owner_slug")
    if doc.get("visibility") == "draft" and not is_owner:
        return None
    return doc


async def readable_image(
    db: Any, image_slug: str, viewer: str | None, *, projection: dict | None = None
) -> tuple[dict, bool] | None:
    """``(image_doc, publicly_readable)`` when the viewer may read the image, else None.

    ``publicly_readable`` is True when a public or unlisted live visualization
    references the image, i.e. when any anonymous reader could read it: the
    caller may then let shared caches keep it. Otherwise the read is private.
    """
    doc = await db.images.find_one(
        softdelete.with_not_deleted({"image_slug": image_slug}), projection
    )
    if doc is None:
        return None
    refs = await db.visualizations.find(
        softdelete.with_not_deleted({"image_slug": image_slug}),
        {"visibility": 1, "owner_slug": 1},
    ).to_list(None)
    if any(r.get("visibility") != "draft" for r in refs):
        return doc, True
    if not refs:
        return doc, False
    if viewer is not None and (
        any(r.get("owner_slug") == viewer for r in refs)
        or f"user:{viewer}" in (doc.get("uploaders") or [])
    ):
        return doc, False
    return None


def image_cache_control(publicly_readable: bool) -> str:
    """Shared caches may keep a public image; a private read is never stored."""
    return "public, max-age=86400" if publicly_readable else "private, no-store"
