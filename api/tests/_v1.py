"""Shared helpers for the /api/v1 token tests (not a test module)."""

from __future__ import annotations

import io
import json
import uuid

from conftest import asgi_full

ADMIN = "v1-admin-fixture-token"


def admin_headers() -> list[tuple[str, str]]:
    return [("Authorization", f"Bearer {ADMIN}"), ("Content-Type", "application/json")]


def bearer(token: str, content_type: str = "application/json") -> list[tuple[str, str]]:
    return [("Authorization", f"Bearer {token}"), ("Content-Type", content_type)]


async def mint(name: str = "test", scopes: list[str] | None = None, rate: int | None = None) -> tuple[int, dict]:
    body: dict = {"name": name, "scopes": scopes or ["spectrum"]}
    if rate is not None:
        body["rate_per_min"] = rate
    status, _h, raw = await asgi_full("POST", "/api/admin/tokens", json.dumps(body).encode(), admin_headers())
    return status, json.loads(raw)


def circle_points(n: int = 256, r: float = 40.0) -> dict:
    import math

    return {
        "x": [r * math.cos(2 * math.pi * j / n) for j in range(n)],
        "y": [r * math.sin(2 * math.pi * j / n) for j in range(n)],
    }


def contour_body(n_harmonics: int = 16, n_points: int = 256) -> bytes:
    return json.dumps({"points": circle_points(), "n_harmonics": n_harmonics, "n_points": n_points}).encode()


def disk_png(size: int = 128) -> bytes:
    """A synthetic drawing (a dark disk on white): never a photograph."""
    from PIL import Image, ImageDraw

    img = Image.new("L", (size, size), 255)
    ImageDraw.Draw(img).ellipse((size // 4, size // 4, 3 * size // 4, 3 * size // 4), fill=0)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def multipart(image: bytes, settings: dict) -> tuple[bytes, str]:
    boundary = uuid.uuid4().hex
    parts = [
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"image\"; filename=\"image\"\r\n"
        "Content-Type: application/octet-stream\r\n\r\n".encode() + image + b"\r\n",
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"settings\"\r\n\r\n{json.dumps(settings)}\r\n".encode(),
        f"--{boundary}--\r\n".encode(),
    ]
    return b"".join(parts), f"multipart/form-data; boundary={boundary}"
