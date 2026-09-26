"""Faces as an artist draws them: landmark feature lines and the person parse.

Approach A of the F.CT tournament.  Where the subject has a human face, the
lines that make it a face (brows, eyelids, irises, the nose, the lips, the jaw
and chin) are not luminance edges to be found: a face-landmark model places
them directly.  The hairline, the braid and the neckline are the boundaries
between a person parser's regions (hair, face skin, body skin, clothes).

- :func:`find_faces` -- BlazeFace detections (run at several scales, so a
  small engraved face and a close-up are both found) that are confidently
  human and centred on the subject; each is cropped and passed to the
  MediaPipe Face Landmarker (FaceMesh v2, 478 points with irises).
- :func:`feature_lines` -- the named, ordered polylines of one face.
- :func:`person_labels` -- the multiclass selfie parser's label map.

All coordinates are ``(row, col)`` pixels of the pipeline image.  MediaPipe is
imported lazily; without it (or its pinned weights) no face is found and the
pipeline falls back to the learned line drawing.
"""

from __future__ import annotations

import logging
import threading
from dataclasses import dataclass
from typing import Any

import numpy as np
from numpy.typing import NDArray
from PIL import Image
from scipy import ndimage as ndi

from fourier_analysis.contours.ml import (
    FACE_DETECTOR,
    FACE_LANDMARKER,
    PERSON_PARSER,
    ensure_asset,
)

logger = logging.getLogger(__name__)

# A detection is a human face at this BlazeFace score.  BlazeFace is trained
# on people: photographed and engraved human faces score 0.89-0.96 on the
# bench set, while animal and cartoon faces it half-recognises (a dog's
# muzzle, a sponge's eyes) stay below 0.8.  Drawing FaceMesh lines on those
# would draw a human face on an animal.
HUMAN_FACE_SCORE = 0.85
# BlazeFace (short range) sees faces that fill a good part of its 128 px
# input: the image is also searched at these longest sides, each downscale
# making a small face relatively larger.
DETECT_SIDES = (1024, 512, 256)
# The landmarker is run on a square crop of this many detection-box sides
# around the face, so its own detector sees a large face.
CROP_BOXES = 2.4
# A face is the subject's when its centre lies on the subject mask.

# Person-parser classes (MediaPipe selfie_multiclass_256x256).
BACKGROUND, HAIR, BODY_SKIN, FACE_SKIN, CLOTHES, OTHER = range(6)


@dataclass(frozen=True)
class FaceLines:
    """One face's feature lines, ``name -> (N, 2) (row, col)`` polylines.  A
    closed line repeats its first point last."""

    lines: dict[str, NDArray[np.float64]]
    box: tuple[float, float, float, float]  # row, col, height, width
    oval: NDArray[np.float64]  # the face outline (forehead to chin), closed


_lock = threading.Lock()
_tasks: dict[str, Any] = {}


def _mediapipe():
    try:
        import mediapipe as mp
        from mediapipe.tasks.python import BaseOptions, vision
    except ImportError:  # pragma: no cover - optional at import time
        return None
    return mp, BaseOptions, vision


def _task(kind: str):
    """Lazy, cached MediaPipe task (CPU delegate)."""
    task = _tasks.get(kind)
    if task is not None:
        return task
    mods = _mediapipe()
    if mods is None:
        return None
    mp, BaseOptions, vision = mods
    with _lock:
        task = _tasks.get(kind)
        if task is not None:
            return task
        cpu = BaseOptions.Delegate.CPU
        if kind == "detector":
            opts = vision.FaceDetectorOptions(
                base_options=BaseOptions(
                    model_asset_path=str(ensure_asset(FACE_DETECTOR)), delegate=cpu
                ),
                min_detection_confidence=0.5,
            )
            task = vision.FaceDetector.create_from_options(opts)
        elif kind == "landmarker":
            opts = vision.FaceLandmarkerOptions(
                base_options=BaseOptions(
                    model_asset_path=str(ensure_asset(FACE_LANDMARKER)), delegate=cpu
                ),
                num_faces=1,
                min_face_detection_confidence=0.3,
                min_face_presence_confidence=0.5,
            )
            task = vision.FaceLandmarker.create_from_options(opts)
        else:
            opts = vision.ImageSegmenterOptions(
                base_options=BaseOptions(
                    model_asset_path=str(ensure_asset(PERSON_PARSER)), delegate=cpu
                ),
                output_confidence_masks=True,
                output_category_mask=False,
            )
            task = vision.ImageSegmenter.create_from_options(opts)
        _tasks[kind] = task
        return task


def load_face_sessions() -> None:
    """Open the MediaPipe tasks now (a long-lived process pays this once)."""
    for kind in ("detector", "landmarker", "parser"):
        _task(kind)


def _mp_image(rgb: NDArray[np.uint8]):
    mp = _mediapipe()[0]  # type: ignore[index]
    return mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(rgb))


def _detections(rgb: NDArray[np.uint8]) -> list[tuple[float, float, float, float, float]]:
    """``(score, row, col, height, width)`` over ``DETECT_SIDES``, in ``rgb`` pixels;
    overlapping detections keep the best score."""
    detector = _task("detector")
    if detector is None:
        return []
    h, w = rgb.shape[:2]
    pil = Image.fromarray(rgb)
    found: list[tuple[float, float, float, float, float]] = []
    for side in DETECT_SIDES:
        scale = min(1.0, side / max(h, w))
        small = pil if scale == 1.0 else pil.resize(
            (max(1, round(w * scale)), max(1, round(h * scale))), Image.Resampling.LANCZOS
        )
        for d in detector.detect(_mp_image(np.asarray(small))).detections:
            b = d.bounding_box
            found.append((
                float(d.categories[0].score),
                b.origin_y / scale, b.origin_x / scale, b.height / scale, b.width / scale,
            ))
    found.sort(reverse=True)
    kept: list[tuple[float, float, float, float, float]] = []
    for f in found:
        cy, cx = f[1] + f[3] / 2, f[2] + f[4] / 2
        if all(abs(cy - (k[1] + k[3] / 2)) > k[3] / 2 or abs(cx - (k[2] + k[4] / 2)) > k[4] / 2
               for k in kept):
            kept.append(f)
    return kept


def find_faces(
    rgb: NDArray[np.uint8],
    subject_mask: NDArray[np.bool_] | None,
) -> list[FaceLines]:
    """Every confidently human face centred on the subject, with its lines."""
    try:
        detections = _detections(rgb)
        landmarker = _task("landmarker")
    except Exception:  # noqa: BLE001 - a missing model must not break extraction
        logger.warning("face models unavailable; no landmark lines", exc_info=True)
        return []
    if landmarker is None:
        return []
    h, w = rgb.shape[:2]
    faces: list[FaceLines] = []
    for score, r0, c0, bh, bw in detections:
        if score < HUMAN_FACE_SCORE:
            continue
        cy, cx = r0 + bh / 2, c0 + bw / 2
        if subject_mask is not None and subject_mask.any():
            if not subject_mask[int(np.clip(cy, 0, h - 1)), int(np.clip(cx, 0, w - 1))]:
                continue
        half = CROP_BOXES * max(bh, bw) / 2
        top, left = int(max(0, cy - half)), int(max(0, cx - half))
        bottom, right = int(min(h, cy + half)), int(min(w, cx + half))
        crop = rgb[top:bottom, left:right]
        if crop.size == 0:
            continue
        result = landmarker.detect(_mp_image(crop))
        if not result.face_landmarks:
            continue
        ch, cw = crop.shape[:2]
        pts = np.array(
            [(top + p.y * ch, left + p.x * cw) for p in result.face_landmarks[0]],
            dtype=np.float64,
        )
        faces.append(FaceLines(feature_lines(pts), (r0, c0, bh, bw), _chain(pts, _OVAL)))
    return faces


# ---------------------------------------------------------------------------
# FaceMesh topology: the ordered index chains of each feature line.
# ---------------------------------------------------------------------------

_JAW = (234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152,
        377, 400, 378, 379, 365, 397, 288, 361, 323, 454)
_OVAL = (10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
         400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
         54, 103, 67, 109, 10)
_BROWS = (
    (46, 53, 52, 65, 55, 107, 66, 105, 63, 70, 46),
    (276, 283, 282, 295, 285, 336, 296, 334, 293, 300, 276),
)
_EYES = (
    (33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7, 33),
    (263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249, 263),
)
_IRISES = ((468, (469, 470, 471, 472)), (473, (474, 475, 476, 477)))
# The bridge runs from between the eyes to above the tip; the base is the
# alar wings and the columella, an open curve under the tip.
_NOSE_BRIDGE = (6, 197, 195, 5)
_NOSE_BASE = (48, 64, 98, 97, 2, 326, 327, 294, 278)
_LIPS_OUTER = (61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291,
               375, 321, 405, 314, 17, 84, 181, 91, 146, 61)
_LIPS_INNER = (78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308,
               324, 318, 402, 317, 14, 87, 178, 88, 95, 78)


def _catmull_rom(p: NDArray[np.float64], closed: bool, per_seg: int = 8) -> NDArray[np.float64]:
    """A centripetal-free (uniform) Catmull-Rom curve through ``p``: the
    landmarks are ordered samples of a smooth line, not a polygon."""
    if closed:
        q = p[:-1]
        ext = np.vstack([q[-1:], q, q[:2]])
    else:
        ext = np.vstack([2 * p[0] - p[1], p, 2 * p[-1] - p[-2]])
    t = np.linspace(0.0, 1.0, per_seg, endpoint=False)[:, None]
    out = []
    for i in range(1, len(ext) - 2):
        p0, p1, p2, p3 = ext[i - 1], ext[i], ext[i + 1], ext[i + 2]
        out.append(0.5 * (
            2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t**2
            + (-p0 + 3 * p1 - 3 * p2 + p3) * t**3
        ))
    curve = np.vstack(out + [ext[-2][None]])
    if closed:
        curve[-1] = curve[0]
    return curve


def _chain(pts: NDArray[np.float64], idx: tuple[int, ...]) -> NDArray[np.float64]:
    return _catmull_rom(pts[list(idx)], closed=idx[0] == idx[-1])


def _inside(poly: NDArray[np.float64], q: NDArray[np.float64]) -> NDArray[np.bool_]:
    """Even-odd point-in-polygon for ``(row, col)`` points."""
    from matplotlib.path import Path as MplPath

    return MplPath(poly[:, ::-1]).contains_points(q[:, ::-1])


def _iris_arcs(pts: NDArray[np.float64], eye: NDArray[np.float64],
               centre: int, ring: tuple[int, ...]) -> list[NDArray[np.float64]]:
    """The visible iris: its circle clipped to the eye opening (lids cover the
    rest), as arcs whose ends meet the lids."""
    c = pts[centre]
    r = float(np.mean(np.hypot(*(pts[list(ring)] - c).T)))
    if r < 1.0:
        return []
    t = np.linspace(0, 2 * np.pi, max(24, int(2 * np.pi * r)), endpoint=False)
    circle = np.column_stack([c[0] + r * np.sin(t), c[1] + r * np.cos(t)])
    vis = _inside(eye, circle)
    if vis.all():
        return [np.vstack([circle, circle[:1]])]
    if not vis.any():
        return []
    start = int(np.flatnonzero(~vis)[0])
    circle, vis = np.roll(circle, -start, axis=0), np.roll(vis, -start)
    edges = np.diff(np.concatenate([[0], vis.astype(np.int8), [0]]))
    return [circle[s:e] for s, e in zip(np.flatnonzero(edges == 1), np.flatnonzero(edges == -1))
            if e - s >= 3]


def feature_lines(pts: NDArray[np.float64]) -> dict[str, NDArray[np.float64]]:
    """The named feature lines of one face from its 478 FaceMesh points."""
    lines: dict[str, NDArray[np.float64]] = {"jaw": _chain(pts, _JAW)}
    for side, idx in zip(("r", "l"), _BROWS):
        lines[f"brow_{side}"] = _chain(pts, idx)
    for side, idx, (centre, ring) in zip(("r", "l"), _EYES, _IRISES):
        eye = _chain(pts, idx)
        lines[f"eye_{side}"] = eye
        if len(pts) > max(ring):
            for k, arc in enumerate(_iris_arcs(pts, eye, centre, ring)):
                lines[f"iris_{side}{k}"] = arc
    lines["nose_bridge"] = _chain(pts, _NOSE_BRIDGE)
    lines["nose_base"] = _chain(pts, _NOSE_BASE)
    lines["lips_outer"] = _chain(pts, _LIPS_OUTER)
    lines["lips_inner"] = _chain(pts, _LIPS_INNER)
    return lines


# ---------------------------------------------------------------------------
# Person parse
# ---------------------------------------------------------------------------

# The parser's confidences are smoothed over this fraction of the image
# diagonal before the arg-max, so region boundaries are the regions' shapes
# and not single-pixel speckle.
PARSE_SMOOTH_FRACTION = 0.003


def person_labels(rgb: NDArray[np.uint8]) -> NDArray[np.int8] | None:
    """The parser's per-pixel class (``BACKGROUND`` ... ``OTHER``) at ``rgb``'s size."""
    try:
        parser = _task("parser")
    except Exception:  # noqa: BLE001
        logger.warning("person parser unavailable", exc_info=True)
        return None
    if parser is None:
        return None
    result = parser.segment(_mp_image(rgb))
    h, w = rgb.shape[:2]
    sigma = PARSE_SMOOTH_FRACTION * float(np.hypot(h, w))
    conf = np.stack([
        ndi.gaussian_filter(np.asarray(m.numpy_view(), dtype=np.float32).reshape(h, w), sigma)
        for m in result.confidence_masks
    ])
    return np.argmax(conf, axis=0).astype(np.int8)
