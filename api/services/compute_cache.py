"""F.W2 T-β — Content-addressable compute cache for both compute paths.

Per Wα-R3 Δ-R3.1: the `extract_contour` cache is ALREADY WIRED at HEAD
(see `api/routers/images.py:220-227` + `database.py:60` extraction_cache_key
index). This module covers the two parametric compute paths — `compute_epicycles`
AND `compute_bases` — both of which share the identical compute shape (a
contour hash + a parameter set → a result dict). F-β collapses the former
3-field positional key into one parametric `params: dict` contract so a single
cache serves both routes symmetrically.

Why cache: the demo iterates on the compute parameters repeatedly (it's a
learning tool). Identical contour + parameter combinations recompute the FFT /
basis-projection chain from scratch. The cache:

- Key: SHA256(contour_hash + canonical-JSON(params) + COMPUTE_VERSION).
  `params` is canonicalised via `json.dumps(..., sort_keys=True,
  separators=(",", ":"))` so key/value ordering is irrelevant.
- COMPUTE_VERSION: bump when an algorithm changes (cache-busts stale entries).
- Storage: `compute_cache` collection with a 7-day TTL index on `created_at`
  (auto-eviction; bounded storage cost). The bare rename from the old
  `epicycle_cache` collection intentionally abandons the old documents — the
  ≤7-day TTL plus the fail-open property absorb the gap (a one-time empty-cache
  warm-up, never an incorrect result).
- Hit: returns the cached `dict`; skips the compute chain entirely; emits a
  `CACHE_HIT <label>` log line.
- Miss: caller computes, then `store(...)` writes the result; emits
  `CACHE_MISS <label>`.

The cache is fail-open: a Mongo failure during `lookup` or `store` does NOT
break the request — the route falls through to compute as if the cache
weren't there. The compute is the source-of-truth; the cache is an accelerator.
"""

from __future__ import annotations

import hashlib
import json
import logging
from datetime import UTC, datetime
from typing import Any

from api.services.database import get_db

# Bump when a compute algorithm changes (signature, sampling, basis function —
# anything affecting the output). Cache hits whose entries carry a different
# version are ignored (they get re-computed and overwrite).
COMPUTE_VERSION = "v1"

_CACHE_COLL = "compute_cache"
_TTL_SECONDS = 7 * 24 * 60 * 60  # 7 days

logger = logging.getLogger(__name__)


def cache_key(contour_hash: str, params: dict[str, Any]) -> str:
    """SHA256 of the contour hash + canonical-JSON params + code version.

    `params` is serialised with `sort_keys=True` and compact separators so the
    key is invariant to dict ordering and whitespace.
    """
    canonical = json.dumps(params, sort_keys=True, separators=(",", ":"))
    payload = f"{contour_hash}|{canonical}|{COMPUTE_VERSION}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


async def lookup(
    contour_hash: str, params: dict[str, Any], *, label: str
) -> dict[str, Any] | None:
    """Cache lookup. Returns the cached payload on hit; None on miss (or error)."""
    try:
        db = get_db()
        key = cache_key(contour_hash, params)
        doc = await db[_CACHE_COLL].find_one({"_id": key})
        if doc is None:
            logger.info("CACHE_MISS %s %s", label, key[:12])
            return None
        logger.info("CACHE_HIT %s %s", label, key[:12])
        return doc.get("result")
    except Exception:
        # Fail-open: cache misses are silent; the route falls through to compute.
        logger.warning("compute_cache.lookup failed", exc_info=True)
        return None


async def store(
    contour_hash: str,
    params: dict[str, Any],
    result: dict[str, Any],
    *,
    label: str,
) -> None:
    """Cache store. Upsert via `_id` so duplicate keys are deterministic."""
    try:
        db = get_db()
        key = cache_key(contour_hash, params)
        await db[_CACHE_COLL].update_one(
            {"_id": key},
            {
                "$set": {
                    "result": result,
                    "compute_version": COMPUTE_VERSION,
                    "label": label,
                    "contour_hash": contour_hash,
                    "params": params,
                    "created_at": datetime.now(tz=UTC),
                }
            },
            upsert=True,
        )
    except Exception:
        # Fail-open: a store-side failure does NOT break the request.
        logger.warning("compute_cache.store failed", exc_info=True)
