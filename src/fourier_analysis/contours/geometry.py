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


CORNER_TURN_DEG = 50.0
"""A vertex turning at least this much is a corner (a junction, a cusp where a
walk turns back along its stroke, a jump's end): resampling lands on it."""

MAX_CORNER_FRACTION = 0.25
"""At most this fraction of the samples is pinned to corners (the sharpest)."""


def resample_arc_length(
    contour: NDArray[np.complex128],
    n_points: int,
) -> NDArray[np.complex128]:
    """Resample a path to ``n_points`` samples, uniform in arc length between
    its corners, which are sampled exactly.

    The path is cut at its corners (vertices turning at least
    ``CORNER_TURN_DEG``; the sharpest ``MAX_CORNER_FRACTION * n_points`` of
    them) and each piece gets samples in proportion to its length, the first
    on its starting corner.  Between samples the path is linear, so a corner is
    never rounded off or overshot and a retrace stays on its stroke.  A closed
    path (last point equal to the first) is sampled once around, the seam not
    repeated; an open one from its start, its end excluded, as before.
    """
    if len(contour) < 2:
        return contour

    z = np.asarray(contour, dtype=np.complex128)
    steps = np.abs(np.diff(z))
    keep = np.concatenate([[True], steps > 1e-12])
    z = z[keep]
    if len(z) < 2:
        return contour[:n_points] if len(contour) >= n_points else contour
    arc = np.concatenate([[0.0], np.cumsum(np.abs(np.diff(z)))])
    total = float(arc[-1])
    if total < 1e-12:
        return contour[:n_points] if len(contour) >= n_points else contour

    closed = abs(z[0] - z[-1]) <= 1e-9 * max(1.0, total)
    corners = _corner_arcs(z, arc, closed, max(0, int(MAX_CORNER_FRACTION * n_points)))
    bounds = np.concatenate([[0.0], corners, [total]])
    lengths = np.diff(bounds)
    counts = _allocate(lengths, n_points)
    t = np.concatenate(
        [b + np.arange(c) * (length / c) for b, length, c in zip(bounds[:-1], lengths, counts) if c > 0]
    )
    return np.interp(t, arc, z.real) + 1j * np.interp(t, arc, z.imag)


def _corner_arcs(
    z: NDArray[np.complex128], arc: NDArray[np.float64], closed: bool, limit: int
) -> NDArray[np.float64]:
    """Arc positions of the corners (strictly inside (0, total)), sharpest first
    up to ``limit``, returned in arc order."""
    if len(z) < 3 or limit <= 0:
        return np.array([], dtype=np.float64)
    d = np.diff(z)
    d_in, d_out = d[:-1], d[1:]
    turn = np.abs(np.angle(d_out * np.conj(d_in)))
    idx = np.arange(1, len(z) - 1)
    if closed:
        seam = abs(float(np.angle(d[0] * np.conj(d[-1]))))
        turn = np.append(turn, seam)
        idx = np.append(idx, 0)
    sharp = turn >= np.deg2rad(CORNER_TURN_DEG)
    idx, turn = idx[sharp], turn[sharp]
    if idx.size > limit:
        top = np.argsort(-turn, kind="stable")[:limit]
        idx = idx[top]
    at = np.unique(arc[idx])
    return at[(at > 0) & (at < arc[-1])]


def _allocate(lengths: NDArray[np.float64], n: int) -> NDArray[np.int_]:
    """Split ``n`` samples over pieces in proportion to length (largest
    remainder), every piece of positive length getting at least one while
    samples last."""
    total = float(lengths.sum())
    share = lengths / total * n
    counts = np.floor(share).astype(int)
    need = (lengths > 0) & (counts == 0)
    counts[need] = 1
    surplus = int(counts.sum()) - n
    if surplus > 0:  # the minimum of one overspent: take back from the largest
        for i in np.argsort(-(counts - share)):
            if surplus == 0:
                break
            if counts[i] > 1:
                counts[i] -= 1
                surplus -= 1
    elif surplus < 0:
        for i in np.argsort(-(share - counts))[: -surplus]:
            counts[i] += 1
    return counts
