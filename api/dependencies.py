"""Shared FastAPI dependencies."""

from __future__ import annotations

import re

from fastapi import HTTPException

from api.services.database import get_db, touch_document

SLUG_PATTERN = re.compile(r"^[a-zA-Z0-9][-a-zA-Z0-9]{2,80}$")


def validate_image_slug(slug: str) -> str:
    if not SLUG_PATTERN.match(slug):
        raise HTTPException(status_code=400, detail="Invalid image slug")
    return slug


async def get_image_asset(image_slug: str) -> dict:
    """Fetch full image document (including blob). 404 if not found."""
    image_slug = validate_image_slug(image_slug)
    db = get_db()
    doc = await db.images.find_one({"image_slug": image_slug})
    if doc is None:
        raise HTTPException(status_code=404, detail="Image not found")
    await touch_document("images", {"image_slug": image_slug})
    return doc


async def get_image_meta(image_slug: str) -> dict:
    """Fetch image metadata (excluding blob). 404 if not found."""
    image_slug = validate_image_slug(image_slug)
    db = get_db()
    doc = await db.images.find_one({"image_slug": image_slug}, {"blob": 0})
    if doc is None:
        raise HTTPException(status_code=404, detail="Image not found")
    return doc


async def get_contour(contour_hash: str) -> dict:
    """Fetch contour document. 404 if not found."""
    db = get_db()
    doc = await db.contours.find_one({"contour_hash": contour_hash})
    if doc is None:
        raise HTTPException(status_code=404, detail="Contour not found")
    await touch_document("contours", {"contour_hash": contour_hash})
    return doc
