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


DETAIL_SHARE = 1.0 / 3.0
"""The share of the samples spent in proportion to the path's turning; the
rest are spent in proportion to its length.  Measured on the bench's
drawings at 1024 samples: a third leaves the least of the drawing uncovered
by its 100- and 200-harmonic traces (about a sixth and a tenth less than
even sampling) and as much at 50; from a half up the smooth outline starves."""
DETAIL_OVERSAMPLE = 8
"""The path's turning is read on this many fine steps per output sample."""


def resample_arc_length(
    contour: NDArray[np.complex128],
    n_points: int,
    detail: float = DETAIL_SHARE,
) -> NDArray[np.complex128]:
    """Resample a path to ``n_points`` samples that keep its features: its
    corners are sampled exactly, and between them the samples lie closer
    where the path turns.

    A pen slows where a drawing is detailed and stops at a stroke's end.  A
    Fourier series resolves its signal in time, not in length, so a path
    sampled evenly in length spends an eye's worth of harmonics on an eye's
    length of smooth outline, and every dead end, where the pen turns back
    at full speed, is a kink in the signal that the series rings on (the
    return splits from the stroke).  Here the sample density along the path
    is ``(1 - detail) / L + detail * |turning| / total turning``: ``detail``
    of the samples go where the path turns (an iris, a mouth's corner, a
    stroke's end), the rest evenly along its length ``L``.  The turning is
    read on the path smoothed over one sample's length (``L / n_points``),
    so a wiggle finer than the samples can carry draws none of them.  A
    path that turns evenly (a circle) or not at all is sampled evenly in
    length, and so is any path with ``detail=0``.

    The path is cut at its corners (vertices turning at least
    ``CORNER_TURN_DEG``; the sharpest ``MAX_CORNER_FRACTION * n_points`` of
    them) and each piece gets samples in proportion to its share of the
    density, the first on its starting corner.  Between samples the path is
    linear, so a corner is never rounded off or overshot and a retrace stays
    on its stroke.  A closed path (last point equal to the first) is sampled
    once around, the seam not repeated; an open one from its start, its end
    excluded, as before.
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
    grid, mass = _detail_mass(z, arc, closed, n_points, detail)
    at = np.interp(bounds, grid, mass)
    counts = _allocate(np.diff(at), n_points)
    # Each piece's samples at equal steps of its mass, the first on its corner.
    m = np.concatenate([a + np.arange(c) * ((b - a) / c) for a, b, c in zip(at[:-1], at[1:], counts) if c > 0])
    t = np.interp(m, mass, grid)
    return np.interp(t, arc, z.real) + 1j * np.interp(t, arc, z.imag)


def _detail_mass(
    z: NDArray[np.complex128], arc: NDArray[np.float64], closed: bool, n_points: int, detail: float
) -> tuple[NDArray[np.float64], NDArray[np.float64]]:
    """The cumulative sample density of ``resample_arc_length`` on a fine
    arc-length grid: ``(grid, mass)``, ``mass`` rising strictly from 0 to 1."""
    from scipy.ndimage import gaussian_filter1d

    total = float(arc[-1])
    m = max(16, DETAIL_OVERSAMPLE * n_points)
    grid = np.linspace(0.0, total, m + 1)
    length = grid / total
    if detail <= 0.0:
        return grid, length
    fine = np.interp(grid, arc, z.real) + 1j * np.interp(grid, arc, z.imag)
    body = fine[:-1] if closed else fine
    q = np.column_stack([body.real, body.imag])
    sigma = float(DETAIL_OVERSAMPLE)
    if closed:
        q = gaussian_filter1d(q, sigma, axis=0, mode="wrap")
    else:
        # An open path's ends are point-reflected, so it runs on through
        # them at its own curvature and the ends draw no samples of their own.
        k = min(len(q) - 1, int(np.ceil(4 * sigma)))
        padded = np.vstack([2 * q[0] - q[k:0:-1], q, 2 * q[-1] - q[-2 : -k - 2 : -1]])
        q = gaussian_filter1d(padded, sigma, axis=0, mode="nearest")[k : k + len(q)]
    s = q[:, 0] + 1j * q[:, 1]
    d = np.diff(np.append(s, s[0]) if closed else s)
    moving = np.abs(d) > 1e-12 * max(1.0, total)
    heading = np.where(moving, d, 1.0)
    nxt = np.roll(heading, -1) if closed else np.append(heading[1:], heading[-1])
    turn = np.abs(np.angle(nxt * np.conj(heading)))
    turn[~moving | ~(np.roll(moving, -1) if closed else np.append(moving[1:], True))] = 0.0
    # ``turn[i]`` is the turning at fine vertex i + 1; spread to the grid's steps.
    per_step = np.zeros(m)
    idx = (np.arange(len(turn)) + 1) % m if closed else np.minimum(np.arange(len(turn)) + 1, m - 1)
    np.add.at(per_step, idx, turn)
    if not closed:
        # Past an open path's ends there is nothing to read its turning
        # against: the ends carry on as the path turns just inside them.
        k = min(int(np.ceil(3 * sigma)), (m - 1) // 2)
        per_step[:k], per_step[m - k :] = per_step[k], per_step[m - k - 1]
    turning = float(per_step.sum())
    if turning <= 1e-9:
        return grid, length
    density = (1.0 - detail) / m + detail * per_step / turning
    mass = np.concatenate([[0.0], np.cumsum(density)])
    return grid, mass / mass[-1]


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
