"""Seed the gallery's demo pieces (FORTY-SIXTH C: "we should have a few demo images here, too").

The pieces are named in ``api/seeds/gallery.json``: the paper's three mathematicians, in
public-domain portraits (``api/seeds/SOURCES.md``), and the site's own sun and moon. Each is
stored through the routes' own services, so a seed is the row a visitor's publish would make:

* the picture: ``image_storage.store_image_asset`` (a drawing's picture is the drawing itself,
  rendered here as an amber line on a transparent ground, which reads on both themes);
* the outline: ``images.extract_contour_doc`` for a portrait (a non-ML strategy, so this process
  never loads the ONNX models beside the API's own worker), or the drawing's own points through
  ``image_storage.store_contour_asset`` (source ``seed``);
* the series, once, so the first visitor's open is answered from the cache
  (``contours.epicycles_data`` and ``contours.bases_data``, at the web's own parameters);
* the visualization and its first version: ``visualizations.create_visualization``, as the site's
  own account, ``visibility: public``.

Computes go through the API's one bounded pool, one at a time (run it with
``COMPUTE_CONCURRENCY=1``). The account is the site's own: its slug is a deployment secret
(``FOURIER_SITE_OWNER``, or ``--owner``), never printed, and the account is ``pinned`` so the
janitor's stale-user pass keeps it (a live visualization pins its picture and outline already).

Idempotent: a piece the account already holds (by title) whose content matches is left alone;
``--update`` rewrites its description and tags. Run it by hand per environment, like the
migration scripts::

    docker compose exec api python -m api.scripts.seed_gallery --dry-run
    docker compose exec api python -m api.scripts.seed_gallery
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import io
import json
import os
import secrets
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, ImageDraw
from starlette.requests import Request

from api.models.computation import ComputeBasesRequest, ComputeEpicyclesRequest
from api.models.shared import AnimationSettings, ContourSettings
from api.models.visualization import VisualizationCreate, VisualizationUpdate
from api.services.computation import shutdown_process_pool
from api.services.database import close_db, connect_db, get_db
from api.services.image_storage import store_contour_asset, store_image_asset

REPO = Path(__file__).resolve().parents[2]
MANIFEST = REPO / "api" / "seeds" / "gallery.json"

#: A drawing's picture: this many pixels on a side, its line this wide, inset by this much.
DRAWING_PX = 1024
DRAWING_LINE = 12
DRAWING_MARGIN = 0.12
#: An amber between the light and dark theme's own (`--viz-amber`), opaque on transparent.
DRAWING_INK = (196, 132, 48, 255)


def _request(token: str, method: str, path: str, body: bytes = b"") -> Request:
    """A request as the site's account (the routes read their session from it)."""
    scope = {
        "type": "http",
        "method": method,
        "path": path,
        "raw_path": path.encode(),
        "query_string": b"",
        "headers": [(b"x-session-token", token.encode()), (b"if-match", b"*")],
        "client": ("127.0.0.1", 0),
        "scheme": "http",
        "server": ("seed", 80),
    }
    sent = {"done": False}

    async def receive() -> dict[str, Any]:
        if sent["done"]:
            return {"type": "http.disconnect"}
        sent["done"] = True
        return {"type": "http.request", "body": body, "more_body": False}

    return Request(scope, receive)


def _resample(xs: np.ndarray, ys: np.ndarray, n: int) -> tuple[np.ndarray, np.ndarray]:
    """A closed outline resampled to ``n`` points evenly along its length."""
    px, py = np.append(xs, xs[0]), np.append(ys, ys[0])
    seg = np.hypot(np.diff(px), np.diff(py))
    cum = np.concatenate([[0.0], np.cumsum(seg)])
    at = np.linspace(0.0, cum[-1], n, endpoint=False)
    return np.interp(at, cum, px), np.interp(at, cum, py)


def drawing_assets(
    points: dict[str, list[float]], n_points: int
) -> tuple[bytes, list[float], list[float], dict[str, float]]:
    """A drawing's picture (PNG bytes) and its outline in the picture's own frame.

    The outline is fitted into the square picture with a margin; its coordinates are the
    picture's pixels about its centre, y up, which is what an extraction's ``image_bounds``
    says of a picture, so the stage registers the line on the drawing exactly.
    """
    xs = np.asarray(points["x"], dtype=float)
    ys = np.asarray(points["y"], dtype=float)
    cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
    scale = DRAWING_PX * (1 - 2 * DRAWING_MARGIN) / max(xs.max() - xs.min(), ys.max() - ys.min())
    half = DRAWING_PX / 2
    px = (xs - cx) * scale + half
    py = (ys - cy) * scale + half
    img = Image.new("RGBA", (DRAWING_PX, DRAWING_PX), (0, 0, 0, 0))
    ImageDraw.Draw(img).line(
        [*zip(px.tolist(), py.tolist(), strict=True), (float(px[0]), float(py[0]))],
        fill=DRAWING_INK,
        width=DRAWING_LINE,
        joint="curve",
    )
    out = io.BytesIO()
    img.save(out, format="PNG", optimize=True)
    rx, ry = _resample(px - half, half - py, n_points)
    bounds = {"minX": -half, "maxX": half, "minY": -half, "maxY": half}
    return (
        out.getvalue(),
        [round(v, 4) for v in rx.tolist()],
        [round(v, 4) for v in ry.tolist()],
        bounds,
    )


def _owner() -> str | None:
    return os.environ.get("FOURIER_SITE_OWNER") or None


async def _account(db: Any, owner: str, *, dry_run: bool) -> str | None:
    """The site's account (kept by the janitor) and a short session to act as it."""
    if dry_run:
        return None
    now = datetime.now(UTC)
    await db.users.update_one(
        {"_id": owner},
        {"$setOnInsert": {"created_at": now}, "$set": {"last_seen_at": now, "pinned": True}},
        upsert=True,
    )
    token = secrets.token_urlsafe(32)
    await db.sessions.insert_one(
        {
            "_id": token,
            "user_slug": owner,
            "created_at": now,
            "last_seen_at": now,
            "expires_at": now + timedelta(hours=1),
        }
    )
    return token


async def _picture(
    seed: dict[str, Any], owner: str
) -> tuple[dict[str, Any], dict[str, Any], ContourSettings]:
    """The seed's image asset and contour document."""
    from api.routers.images import extract_contour_doc

    cs = ContourSettings(**seed["contour_settings"], n_harmonics=seed["n_harmonics"])
    if seed["kind"] == "picture":
        path = MANIFEST.parent / seed["file"]
        content = path.read_bytes()
        ctype = "image/png" if path.suffix == ".png" else "image/jpeg"
        image = await store_image_asset(
            hashlib.sha256(content).hexdigest(), content, path.name, ctype, uploader=owner
        )
        contour = await extract_contour_doc(image["image_slug"], cs)
        return image, contour, cs
    points = json.loads((REPO / seed["drawing"]).read_text())["original"]
    png, xs, ys, bounds = drawing_assets(points, cs.n_points)
    image = await store_image_asset(
        hashlib.sha256(png).hexdigest(), png, f"{seed['key']}.png", "image/png", uploader=owner
    )
    contour = await store_contour_asset(
        xs, ys, image["image_slug"], source="seed", image_bounds=bounds
    )
    return image, contour, cs


async def _warm_series(contour_hash: str, cs: ContourSettings) -> None:
    """The series at the web's own parameters (``stores/workspace.ts``), so the first open is a cache hit."""
    from api.routers.contours import bases_data, epicycles_data

    n = cs.n_harmonics
    steps = min(n, 50)
    await epicycles_data(contour_hash, ComputeEpicyclesRequest(n_harmonics=n, n_points=cs.n_points))
    await bases_data(
        contour_hash,
        ComputeBasesRequest(
            max_degree=n,
            n_points=cs.n_points,
            levels=[max(1, round((i + 1) * n / steps)) for i in range(steps)],
            n_eval=cs.n_points,
        ),
    )


async def seed_gallery(
    *, owner: str, dry_run: bool = False, update: bool = False, only: set[str] | None = None
) -> list[dict[str, Any]]:
    """Seed every piece in the manifest (or the ``only`` keys). Returns one report row per piece."""
    import api.routers.visualizations as viz

    manifest = json.loads(MANIFEST.read_text())
    db = get_db()
    token = await _account(db, owner, dry_run=dry_run)
    report: list[dict[str, Any]] = []
    try:
        for seed in manifest["seeds"]:
            if only and seed["key"] not in only:
                continue
            held = await db.visualizations.find_one(
                {"owner_slug": owner, "title": seed["title"], "deleted_at": None}
            )
            if dry_run:
                report.append({"key": seed["key"], "action": "held" if held else "would seed"})
                continue
            image, contour, cs = await _picture(seed, owner)
            await _warm_series(contour["contour_hash"], cs)
            body = VisualizationCreate(
                visibility="public",
                image_slug=image["image_slug"],
                contour_hash=contour["contour_hash"],
                active_bases=["fourier-epicycles"],
                n_harmonics=seed["n_harmonics"],
                contour_settings=cs,
                animation_settings=AnimationSettings(**manifest["animation_settings"]),
                title=seed["title"],
                description=seed["description"],
                tags=seed["tags"],
            )
            if held is not None:
                same = held["content_hash"] == viz._compute_content_hash(body)
                if update:
                    patch = VisualizationUpdate(description=seed["description"], tags=seed["tags"])
                    await viz.update_visualization(
                        held["slug"],
                        patch,
                        _request(token or "", "PATCH", f"/api/visualizations/{held['slug']}"),
                    )
                report.append(
                    {
                        "key": seed["key"],
                        "slug": held["slug"],
                        "action": "updated"
                        if update
                        else ("held" if same else "held, content differs"),
                    }
                )
                continue
            raw = body.model_dump_json().encode()
            resp = await viz.create_visualization(
                body, _request(token or "", "POST", "/api/visualizations", raw)
            )
            viz._idem_store = None
            created = json.loads(bytes(resp.body))
            if resp.status_code >= 300:
                raise RuntimeError(f"{seed['key']}: {resp.status_code} {created}")
            report.append({"key": seed["key"], "slug": created["slug"], "action": "seeded"})
    finally:
        if token:
            await db.sessions.delete_one({"_id": token})
    return report


async def _main(args: argparse.Namespace) -> int:
    owner = args.owner or _owner()
    if not owner:
        print(
            "seed_gallery: set FOURIER_SITE_OWNER (the site's own account slug) or pass --owner",
            file=sys.stderr,
        )
        return 2
    await connect_db()
    try:
        rows = await seed_gallery(
            owner=owner,
            dry_run=args.dry_run,
            update=args.update,
            only=set(args.only) if args.only else None,
        )
    finally:
        shutdown_process_pool()
        await close_db()
    for row in rows:
        print(f"{row['key']:<24} {row['action']:<24} {row.get('slug', '')}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n", 1)[0])
    parser.add_argument(
        "--owner", help="the site's own account slug (default: $FOURIER_SITE_OWNER)"
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="report what would be seeded; write nothing"
    )
    parser.add_argument(
        "--update", action="store_true", help="rewrite a held piece's description and tags"
    )
    parser.add_argument("--only", nargs="*", help="seed only these keys (the manifest's `key`)")
    return asyncio.run(_main(parser.parse_args()))


if __name__ == "__main__":
    raise SystemExit(main())
