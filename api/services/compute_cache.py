"""E.W7 T-P3 — Content-addressable compute cache for `compute_epicycles`.

Per Wα-R3 Δ-R3.1: the `extract_contour` cache is ALREADY WIRED at HEAD
(see `api/routers/images.py:220-227` + `database.py:60` extraction_cache_key
index). T-P3 here covers ONLY the second compute path — `compute_epicycles`
— which currently runs per-request with no caching.

Why cache: the demo iterates on `n_harmonics` + `n_points` repeatedly
(it's a learning tool). Identical contour + parameter combinations recompute
the FFT chain from scratch. The cache:

- Key: SHA256(contour_hash + n_harmonics + n_points + COMPUTE_VERSION).
- COMPUTE_VERSION: bump when the algorithm changes (cache-busts stale entries).
- Storage: `epicycle_cache` collection with a 7-day TTL index on `created_at`
  (auto-eviction; bounded storage cost).
- Hit: returns cached `dict`; skips the EpicycleChain computation entirely.
- Miss: caller computes, then `store(...)` writes the result.

The cache is fail-open: a Mongo failure during `lookup` or `store` does NOT
break the request — the route falls through to compute as if the cache
weren't there. The compute is the source-of-truth; the cache is an accelerator.
"""

from __future__ import annotations

import hashlib
import logging
from datetime import datetime
from typing import Any

from api.services.database import get_db

# Bump when the `compute_epicycles` algorithm changes (signature, sampling,
# basis function — anything affecting the output). Cache hits whose entries
# carry a different version are ignored (they get re-computed and overwrite).
COMPUTE_VERSION = "v1"

_CACHE_COLL = "epicycle_cache"
_TTL_SECONDS = 7 * 24 * 60 * 60  # 7 days

logger = logging.getLogger(__name__)


def cache_key(contour_hash: str, n_harmonics: int, n_points: int) -> str:
    """SHA256 of the canonicalised input tuple + code version."""
    payload = f"{contour_hash}|{n_harmonics}|{n_points}|{COMPUTE_VERSION}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


async def lookup(contour_hash: str, n_harmonics: int, n_points: int) -> dict[str, Any] | None:
    """Cache lookup. Returns the cached payload on hit; None on miss (or error)."""
    try:
        db = get_db()
        key = cache_key(contour_hash, n_harmonics, n_points)
        doc = await db[_CACHE_COLL].find_one({"_id": key})
        if doc is None:
            return None
        return doc.get("result")
    except Exception:
        # Fail-open: cache misses are silent; the route falls through to compute.
        logger.warning("compute_cache.lookup failed", exc_info=True)
        return None


async def store(
    contour_hash: str,
    n_harmonics: int,
    n_points: int,
    result: dict[str, Any],
) -> None:
    """Cache store. Upsert via `_id` so duplicate keys are deterministic."""
    try:
        db = get_db()
        key = cache_key(contour_hash, n_harmonics, n_points)
        await db[_CACHE_COLL].update_one(
            {"_id": key},
            {
                "$set": {
                    "result": result,
                    "compute_version": COMPUTE_VERSION,
                    "contour_hash": contour_hash,
                    "n_harmonics": n_harmonics,
                    "n_points": n_points,
                    "created_at": datetime.utcnow(),
                }
            },
            upsert=True,
        )
    except Exception:
        # Fail-open: a store-side failure does NOT break the request.
        logger.warning("compute_cache.store failed", exc_info=True)
