from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from fourier_analysis.contours.image import LoadedImage


def _polygon_area(z: NDArray[np.complex128]) -> float:
    return float(
        0.5
        * abs(
            np.sum(
                z.real * np.roll(z.imag, -1)
                - np.roll(z.real, -1) * z.imag
            )
        )
    )


def _compactness(z: NDArray[np.complex128], area: float) -> float:
    perimeter = float(np.sum(np.abs(np.diff(z))))
    if perimeter <= 1e-12:
        return 0.0
    return float(4 * np.pi * area / (perimeter**2))


def _contour_bbox(contour: NDArray[np.complex128]) -> tuple[float, float, float, float]:
    return (
        float(contour.real.min()),
        float(contour.imag.min()),
        float(contour.real.max()),
        float(contour.imag.max()),
    )


def _bbox_iou(
    first: tuple[float, float, float, float],
    second: tuple[float, float, float, float],
) -> float:
    left = max(first[0], second[0])
    bottom = max(first[1], second[1])
    right = min(first[2], second[2])
    top = min(first[3], second[3])
    if right <= left or top <= bottom:
        return 0.0

    intersection = (right - left) * (top - bottom)
    first_area = max(1e-9, (first[2] - first[0]) * (first[3] - first[1]))
    second_area = max(1e-9, (second[2] - second[0]) * (second[3] - second[1]))
    union = first_area + second_area - intersection
    return float(intersection / max(union, 1e-9))


def _contours_are_near_duplicates(
    contour: NDArray[np.complex128],
    area: float,
    other: NDArray[np.complex128],
    other_area: float,
    image: LoadedImage,
) -> bool:
    if area < 0.02 * image.image_area or other_area < 0.02 * image.image_area:
        return False

    area_ratio = min(area, other_area) / max(area, other_area)
    if area_ratio < 0.88:
        return False

    centroid_distance = abs(np.mean(contour) - np.mean(other)) / max(image.diagonal, 1.0)
    if centroid_distance > 0.035:
        return False

    return _bbox_iou(_contour_bbox(contour), _contour_bbox(other)) > 0.9


def _deduplicate_contours(
    candidates: list[tuple[NDArray[np.complex128], float]],
    image: LoadedImage,
) -> list[tuple[NDArray[np.complex128], float]]:
    deduped: list[tuple[NDArray[np.complex128], float]] = []
    for contour, area in candidates:
        if any(
            _contours_are_near_duplicates(contour, area, kept_contour, kept_area, image)
            for kept_contour, kept_area in deduped
        ):
            continue
        deduped.append((contour, area))
    return deduped


# A vertex is a corner to keep when the path turns by more than this over one
# output step either side of it (a dead end's reversal turns 180 degrees).
CORNER_TURN_DEG = 50.0
# At most this fraction of the output samples are pinned to corners.
MAX_CORNER_FRACTION = 0.25


def _corner_vertices(z: NDArray[np.complex128], arc: NDArray[np.float64], window: float,
                     closed: bool) -> NDArray[np.int64]:
    """Vertices where the path turns by more than ``CORNER_TURN_DEG`` over
    ``window`` of arc either side, each the sharpest within that window."""
    total = arc[-1]
    if closed:
        ext_arc = np.concatenate([arc[:-1] - total, arc, arc[1:] + total])
        ext_z = np.concatenate([z[:-1], z, z[1:]])
    else:
        ext_arc, ext_z = arc, z
    def at(t: NDArray[np.float64]) -> NDArray[np.complex128]:
        t = t if closed else np.clip(t, 0.0, total)
        return np.interp(t, ext_arc, ext_z.real) + 1j * np.interp(t, ext_arc, ext_z.imag)
    def turning(w: float) -> NDArray[np.float64]:
        before = z - at(arc - w)
        after = at(arc + w) - z
        ok = (np.abs(before) > 1e-9) & (np.abs(after) > 1e-9)
        t = np.zeros(len(z))
        t[ok] = np.abs(np.angle(after[ok] / before[ok]))
        return t

    turn = turning(window)
    # Within a corner's window every vertex turns alike; the corner itself is
    # where the turn is also sharpest up close.
    sharp = turn + turning(window / 8.0)
    cand = np.flatnonzero(turn > np.radians(CORNER_TURN_DEG))
    keep: list[int] = []
    for i in cand[np.argsort(-sharp[cand], kind="stable")]:
        if all(abs(arc[i] - arc[j]) > window and (not closed or total - abs(arc[i] - arc[j]) > window)
               for j in keep):
            keep.append(int(i))
    return np.array(sorted(keep), dtype=np.int64)


def resample_arc_length(
    contour: NDArray[np.complex128],
    n_points: int,
) -> NDArray[np.complex128]:
    """Resample a path to ``n_points`` samples spaced evenly by arc length,
    keeping its corners.

    The path is read as the polyline it is (linear between vertices: the
    stages upstream already smooth their strokes, so a spline here would only
    overshoot at corners).  Its corners -- where it turns sharply within one
    output step, above all a dead end the tour reverses at -- are pinned as
    samples (at most ``MAX_CORNER_FRACTION`` of them, sharpest first), and the
    remaining samples are spread evenly by arc length between them, so a
    drawn corner or a stroke's tip is never cut by the sampling grid.  The
    first sample is the path's first point; a closed path (first point
    repeated last) is sampled around once without repeating it.
    """
    if len(contour) < 2:
        return contour
    contour = np.asarray(contour, dtype=np.complex128)
    keep = np.concatenate([[True], np.abs(np.diff(contour)) > 1e-12])
    z = contour[keep]
    if len(z) < 2:
        return contour[:n_points] if len(contour) >= n_points else contour
    arc = np.concatenate([[0.0], np.cumsum(np.abs(np.diff(z)))])
    total = float(arc[-1])
    closed = bool(abs(z[0] - z[-1]) < 1e-9)

    step = total / n_points
    corners = _corner_vertices(z, arc, step, closed)
    if len(corners) > MAX_CORNER_FRACTION * n_points:
        corners = np.sort(corners[: int(MAX_CORNER_FRACTION * n_points)])
    anchors = np.unique(np.concatenate([[0.0], arc[corners]]))
    anchors = anchors[anchors < total - 1e-9]
    spans = np.diff(np.append(anchors, total))
    # Largest-remainder allocation, one sample at least per anchor.
    ideal = spans / total * n_points
    counts = np.maximum(1, np.floor(ideal).astype(np.int64))
    short = n_points - int(counts.sum())
    if short > 0:
        counts[np.argsort(-(ideal - np.floor(ideal)), kind="stable")[:short]] += 1
    while counts.sum() > n_points:  # more anchors than floor allows: trim the densest
        i = int(np.argmax(counts - ideal))
        counts[i] -= 1
    t = np.concatenate([
        a + span * np.arange(c) / c for a, span, c in zip(anchors, spans, counts) if c > 0
    ])
    return np.interp(t, arc, z.real) + 1j * np.interp(t, arc, z.imag)
