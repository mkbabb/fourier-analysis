"""X §0hc.1 — the compute cache stores, and returns, the result in its wire form.

``compute_bases`` keys its partial sums by integer truncation level
(``partial_sums[basis][n]``). BSON keys must be strings, so upserting the raw
result raised ``bson.errors.InvalidDocument`` ("documents must have only string
keys, key was 4"); the fail-open store swallowed it, and every such result
recomputed on every request. The cure encodes the result to the response's own
JSON form before storing, so the store succeeds and a cache hit is
byte-identical on the wire to a fresh compute.
"""

from __future__ import annotations

import json
from typing import Any

from conftest import asgi, requires_mongo, run_db

JSON = [("content-type", "application/json")]

# A small closed contour (a square traced at 32 points) and small compute
# params, so the fresh compute is quick and its levels include the integer 4.
_N = 32
_XS = [float(i % 8) for i in range(_N)]
_YS = [float((i * 3) % 8) for i in range(_N)]
_HASH = "wireformtest" + "0" * 52
_BASES = {"max_degree": 8, "n_points": 64, "levels": [2, 4], "n_eval": 40}


def _int_keyed_result() -> dict[str, Any]:
    return {
        "partial_sums": {"fourier": {4: {"x": [0.5, 1.25], "y": [2.0, -3.5]}}},
        "levels": [4],
    }


def _response_data(result: dict[str, Any]) -> dict[str, Any]:
    """What the HTTP body carries for ``data``: the route's response model in JSON mode."""
    from api.models.computation import ComputeResult

    return ComputeResult(data=result).model_dump(mode="json")["data"]


@requires_mongo
def test_store_then_lookup_of_an_int_keyed_result_hits_in_wire_form():
    from api.services import compute_cache, database

    async def body(db: Any) -> None:
        database._db = db
        try:
            params = {"case": "int-keyed"}
            result = _int_keyed_result()
            await compute_cache.store(_HASH, params, result, label="test")
            hit = await compute_cache.lookup(_HASH, params, label="test")
            assert hit is not None, "the int-keyed result was never cached"
            assert hit == _response_data(result)
        finally:
            database._db = None

    run_db(body)


@requires_mongo
def test_bases_cache_hit_body_equals_the_fresh_compute_body(monkeypatch):
    from api.services import computation, database

    async def body(db: Any) -> None:
        database._db = db
        try:
            await db.contours.insert_one(
                {
                    "contour_hash": _HASH,
                    "source": "editor",
                    "points": {"x": _XS, "y": _YS},
                    "image_bounds": {"width": 8, "height": 8},
                }
            )
            path = f"/api/contours/{_HASH}/compute/bases"
            payload = json.dumps(_BASES).encode()

            status, fresh = await asgi("POST", path, payload, JSON)
            assert status == 200, fresh
            assert "4" in json.loads(fresh)["data"]["partial_sums"]["fourier"]
            assert await db.compute_cache.count_documents({}) == 1, (
                "the fresh compute's result was not stored"
            )

            async def _no_recompute(*_a: Any, **_k: Any) -> Any:
                raise AssertionError("cache hit expected; the route recomputed")

            monkeypatch.setattr(computation, "compute_bases", _no_recompute)
            status, hit = await asgi("POST", path, payload, JSON)
            assert status == 200, hit
            assert hit == fresh
        finally:
            database._db = None

    run_db(body)
