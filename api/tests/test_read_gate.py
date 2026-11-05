"""X·F F-D5 (FW6-G5, G6, G11) — reads pass one gate and have no side effects.

(a) a fork breadcrumb never names an ancestor the viewer cannot read;
(b) an image is readable only through a visualization the viewer can read (or
    while no live visualization references it: a fresh upload);
(c) GETs never write (views and recency move to ``POST …/view`` and the write
    verbs);
(d) the owner can delete an unreferenced image; a referenced one is a 409.

Driven through the real ASGI stack against a throwaway database.
"""

from __future__ import annotations

import io
import json
from datetime import UTC, datetime, timedelta
from typing import Any

import pytest
from PIL import Image

import api.routers.visualizations as viz
import api.services.database as database
from api.config import settings

from conftest import asgi, requires_mongo, run_db

OWNER, TOKEN = "alpha-beta-gamma-delta", "tok-alpha"
OTHER, OTHER_TOKEN = "omega-psi-chi-phi", "tok-omega"


@pytest.fixture
def blob_dir(tmp_path, monkeypatch):
    d = tmp_path / "blobs"
    d.mkdir()
    monkeypatch.setattr(settings, "blob_dir", str(d))
    return d


def _png(color=(40, 120, 200)) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (16, 16), color).save(buf, format="PNG")
    return buf.getvalue()


def _auth(token: str | None) -> list[tuple[str, str]]:
    return [("X-Session-Token", token)] if token else []


async def _seed(db) -> None:
    database._db = db
    viz._idem_store = None
    await db.images.create_index("image_slug", unique=True)
    await db.images.create_index("sha256", unique=True)
    for user, tok in ((OWNER, TOKEN), (OTHER, OTHER_TOKEN)):
        await db.users.insert_one({"_id": user})
        await db.sessions.insert_one(
            {"_id": tok, "user_slug": user, "expires_at": datetime.now(UTC) + timedelta(days=30)}
        )


async def _upload(token: str | None, color=(40, 120, 200)) -> str:
    boundary = "fd5-boundary"
    body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="file"; filename="a.png"\r\n'
        "Content-Type: image/png\r\n\r\n"
    ).encode() + _png(color) + f"\r\n--{boundary}--\r\n".encode()
    status, raw = await asgi(
        "POST", "/api/images", body,
        [("content-type", f"multipart/form-data; boundary={boundary}"), *_auth(token)],
    )
    assert status == 200, raw
    return json.loads(raw)["image_slug"]


async def _viz(db, image_slug: str, visibility: str, **extra: Any) -> str:
    """A visualization row written directly (the create verb's FK checks need a
    real contour; the gate under test reads only these fields)."""
    from api.lib.crud import slugs

    slug = slugs.generate_slug()
    now = datetime.now(UTC)
    await db.visualizations.insert_one(
        {"slug": slug, "owner_slug": OWNER, "visibility": visibility, "image_slug": image_slug,
         "contour_hash": "c" * 64, "content_hash": "h", "active_bases": ["fourier-epicycles"],
         "n_harmonics": 8, "set_hash": f"s-{slug}", "views": 0, "deleted_at": None,
         "created_at": now, "updated_at": now, "last_accessed_at": now - timedelta(days=3),
         **extra}
    )
    return slug


@requires_mongo
def test_a_private_ancestor_is_an_unavailable_crumb(blob_dir):
    """(a) a draft grandparent is emitted as {kind: unavailable} with no identity."""

    async def body(db):
        await _seed(db)
        img = await _upload(TOKEN)
        root = await _viz(db, img, "draft")
        mid = await _viz(db, img, "public", fork_of=root)
        leaf = await _viz(db, img, "public", fork_of=mid)
        status, raw = await asgi("GET", f"/api/visualizations/{leaf}/provenance", headers=_auth(OTHER_TOKEN))
        return status, json.loads(raw), root

    status, payload, root = run_db(body)
    assert status == 200
    crumbs = payload["fork_breadcrumb"]
    assert [c.get("kind") for c in crumbs] == ["visualization", "visualization", "unavailable"]
    hidden = crumbs[2]
    assert hidden["ordinal"] == 2
    assert not ({"slug", "set_hash", "author_slug", "fork_of"} & hidden.keys())
    assert root not in json.dumps(payload)


@requires_mongo
def test_a_draft_only_image_is_not_readable_by_others(blob_dir):
    """(b) anonymous and non-owner reads of a draft-only image are 404; the owner reads it."""

    async def body(db):
        await _seed(db)
        img = await _upload(TOKEN)
        await _viz(db, img, "draft")
        out = {}
        for who, tok in (("anon", None), ("other", OTHER_TOKEN), ("owner", TOKEN)):
            for route in ("", "/blob", "/thumbnail"):
                out[(who, route)] = (await asgi("GET", f"/api/images/{img}{route}", headers=_auth(tok)))[0]
        return out

    out = run_db(body)
    for route in ("", "/blob", "/thumbnail"):
        assert out[("anon", route)] == 404, route
        assert out[("other", route)] == 404, route
        assert out[("owner", route)] == 200, route


@requires_mongo
def test_reads_never_write(blob_dir):
    """(c) a GET of a visualization or its image leaves views and recency unchanged;
    POST …/view is the one counter."""

    async def body(db):
        await _seed(db)
        img = await _upload(TOKEN)
        slug = await _viz(db, img, "public")
        before = await db.visualizations.find_one({"slug": slug})
        img_before = await db.images.find_one({"image_slug": img})
        await asgi("GET", f"/api/visualizations/{slug}")
        await asgi("GET", f"/api/images/{img}/thumbnail")
        after = await db.visualizations.find_one({"slug": slug})
        img_after = await db.images.find_one({"image_slug": img})
        view_status = (await asgi("POST", f"/api/visualizations/{slug}/view"))[0]
        viewed = await db.visualizations.find_one({"slug": slug})
        return before, after, img_before, img_after, view_status, viewed

    before, after, img_before, img_after, view_status, viewed = run_db(body)
    assert after["views"] == before["views"]
    assert after["last_accessed_at"] == before["last_accessed_at"]
    assert img_after["last_accessed_at"] == img_before["last_accessed_at"]
    assert view_status == 204
    assert viewed["views"] == before["views"] + 1


@requires_mongo
def test_image_delete_is_owner_bound_and_refused_while_referenced(blob_dir):
    """(d) referenced → 409; unreferenced → 204, then the image reads 404."""

    async def body(db):
        await _seed(db)
        used = await _upload(TOKEN, (10, 10, 10))
        free = await _upload(TOKEN, (200, 10, 10))
        await _viz(db, used, "public")
        out = {
            "referenced": (await asgi("DELETE", f"/api/images/{used}", headers=_auth(TOKEN)))[0],
            "not-owner": (await asgi("DELETE", f"/api/images/{free}", headers=_auth(OTHER_TOKEN)))[0],
            "unreferenced": (await asgi("DELETE", f"/api/images/{free}", headers=_auth(TOKEN)))[0],
        }
        out["after"] = (await asgi("GET", f"/api/images/{free}/blob", headers=_auth(TOKEN)))[0]
        return out

    assert run_db(body) == {"referenced": 409, "not-owner": 404, "unreferenced": 204, "after": 404}
