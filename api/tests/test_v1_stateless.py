"""F-L1-5 — the /api/v1 routes store nothing: no blob, no image, no contour, no cache row."""

from __future__ import annotations

import json
import os

import pytest

import api.services.database as database
from api.config import settings

from _v1 import ADMIN, bearer, contour_body, disk_png, mint, multipart
from conftest import asgi_full, requires_mongo, run_db


@pytest.fixture(autouse=True)
def _env(monkeypatch, tmp_path):
    monkeypatch.setattr(settings, "admin_token", ADMIN)
    monkeypatch.setattr(settings, "blob_dir", str(tmp_path))


COLLECTIONS = ("images", "contours", "compute_cache", "sessions", "users", "visualizations")


@requires_mongo
def test_v1_routes_persist_nothing(tmp_path):
    async def body(db):
        database._db = db
        _s, minted = await mint("stateless", rate=100)
        token = minted["token"]
        before = {c: await db[c].count_documents({}) for c in COLLECTIONS}
        blobs_before = sorted(os.listdir(tmp_path))

        form, ctype = multipart(disk_png(), {"strategy": "threshold", "resize": 128, "n_points": 512, "n_harmonics": 24})
        img_status, _h, img_raw = await asgi_full("POST", "/api/v1/spectrum/image", form, bearer(token, ctype))
        c_status, _h, _c_raw = await asgi_full("POST", "/api/v1/spectrum/contour", contour_body(), bearer(token))

        after = {c: await db[c].count_documents({}) for c in COLLECTIONS}
        return img_status, json.loads(img_raw), c_status, before, after, blobs_before, sorted(os.listdir(tmp_path))

    img_status, img, c_status, before, after, blobs_before, blobs_after = run_db(body)
    assert img_status == 200, img
    assert set(img) == {"contour", "spectrum", "image_bounds"}
    assert len(img["contour"]["x"]) == 512
    assert len(img["spectrum"]["c"]) == 2 * (2 * 24 + 1)
    assert 1 <= img["spectrum"]["n"] <= 24
    assert c_status == 200
    assert after == before
    assert blobs_after == blobs_before


@requires_mongo
def test_v1_image_rejects_a_non_image():
    async def body(db):
        database._db = db
        _s, minted = await mint("magic", rate=100)
        form, ctype = multipart(b"not an image at all", {})
        status, _h, raw = await asgi_full("POST", "/api/v1/spectrum/image", form, bearer(minted["token"], ctype))
        return status, raw

    status, _raw = run_db(body)
    assert status == 400
