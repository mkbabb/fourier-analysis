"""F.W14U.b (COHESION §0cv) — blob integrity at the read boundary and on re-upload.

The failure it guards (ESC-C4-1, 2026-09-24): a reboot wiped the blob
directory while Mongo kept its ``images`` rows. Every read of such an image
answered **500** (``_resolve(uri).read_bytes()`` / ``FileResponse`` over a
missing path), and a re-upload of the very same bytes hit the sha256 dedup
branch, whose broad ``except`` swallowed the missing primary — so the file was
never re-stored and the image stayed a 500 forever.

The cure: a missing blob file is a typed not-found (``BlobNotFound``) at the
resolve boundary, which the images router answers as 404; and a dedup-hit
upload whose content-addressed file is missing re-writes the uploaded bytes
(and the thumbnail) to the row's own paths.

The app is driven through its real ASGI stack (routing, middleware and the
global exception handler), so a 500 here is the 500 a browser sees (the
shared raw-ASGI client ``conftest.asgi``).
"""

from __future__ import annotations

import hashlib
import io
import json
from typing import Any

import pytest
from PIL import Image

from api.config import settings

from conftest import asgi as _asgi, requires_mongo, run_db


@pytest.fixture
def blob_dir(tmp_path, monkeypatch):
    """Point the shared ``settings.blob_dir`` at a per-test tmp directory."""
    d = tmp_path / "blobs"
    d.mkdir()
    monkeypatch.setattr(settings, "blob_dir", str(d))
    return d


def _png_bytes(color: tuple[int, int, int] = (40, 120, 200)) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (16, 16), color).save(buf, format="PNG")
    return buf.getvalue()


async def _upload(content: bytes, name: str = "blob.png") -> tuple[int, dict[str, Any]]:
    boundary = "fw14ub-boundary"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{name}"\r\n'
        "Content-Type: image/png\r\n\r\n"
    ).encode() + content + f"\r\n--{boundary}--\r\n".encode()
    status, raw = await _asgi(
        "POST",
        "/api/images",
        body,
        [("content-type", f"multipart/form-data; boundary={boundary}")],
    )
    return status, json.loads(raw) if raw else {}


async def _setup(db: Any) -> None:
    from api.services import database

    database._db = db
    await db.images.create_index("image_slug", unique=True)
    await db.images.create_index("sha256", unique=True)


@requires_mongo
def test_missing_blob_file_reads_as_not_found(blob_dir):
    """G-b: a row whose blob file is gone answers 404, never 500."""
    content = _png_bytes()

    async def body(db: Any) -> dict[str, int]:
        await _setup(db)
        up_status, doc = await _upload(content)
        assert up_status == 200, doc
        slug = doc["image_slug"]
        (blob_dir / slug).unlink()
        (blob_dir / f"{slug}.thumb").unlink(missing_ok=True)
        return {
            route: (await _asgi("GET", f"/api/images/{slug}/{route}"))[0]
            for route in ("blob", "thumbnail", "overlay")
        }

    statuses = run_db(body)
    assert statuses == {"blob": 404, "thumbnail": 404, "overlay": 404}


@requires_mongo
def test_reupload_restores_missing_blob_file(blob_dir):
    """A dedup-hit upload (row exists, file missing) re-stores the bytes; read → 200."""
    content = _png_bytes((220, 60, 20))
    sha = hashlib.sha256(content).hexdigest()

    async def body(db: Any) -> tuple[str, str, int, bytes, int, int]:
        await _setup(db)
        _, first = await _upload(content)
        slug = first["image_slug"]
        (blob_dir / slug).unlink()
        (blob_dir / f"{slug}.thumb").unlink(missing_ok=True)

        re_status, second = await _upload(content)
        assert re_status == 200, second
        blob_status, blob_body = await _asgi("GET", f"/api/images/{slug}/blob")
        thumb_status, _ = await _asgi("GET", f"/api/images/{slug}/thumbnail")
        rows = await db.images.count_documents({"sha256": sha})
        return slug, second["image_slug"], blob_status, blob_body, thumb_status, rows

    slug, reslug, blob_status, blob_body, thumb_status, rows = run_db(body)
    assert reslug == slug  # the dedup hit answered the existing row
    assert rows == 1  # no duplicate row
    assert blob_status == 200
    assert blob_body == content  # the content-addressed file holds the uploaded bytes
    assert thumb_status == 200
