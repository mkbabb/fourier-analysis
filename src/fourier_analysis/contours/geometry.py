from __future__ import annotations

import numpy as np
from numpy.typing import NDArray
from scipy.interpolate import CubicSpline, interp1d

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


def resample_arc_length(
    contour: NDArray[np.complex128],
    n_points: int,
) -> NDArray[np.complex128]:
    """Resample a contour to uniform arc-length spacing."""
    if len(contour) < 2:
        return contour

    diffs = np.abs(np.diff(contour))
    arc = np.concatenate([[0.0], np.cumsum(diffs)])
    total_length = arc[-1]
    if total_length < 1e-12:
        return contour[:n_points] if len(contour) >= n_points else contour

    arc_norm = arc / total_length
    # Remove duplicate arc-length positions (zero-length segments)
    unique_mask = np.concatenate([[True], np.diff(arc_norm) > 0])
    arc_norm = arc_norm[unique_mask]
    contour_clean = contour[unique_mask]
    if len(arc_norm) < 2:
        return contour[:n_points] if len(contour) >= n_points else contour

    step = total_length / n_points
    seg = np.diff(arc)
    if len(contour_clean) >= 4 and float(np.median(seg[seg > 0])) <= 0.5 * step:
        # A dense polyline (a stroke drawing's tour): sample it where it is,
        # with its corners, junction turns and stroke tips kept exactly.
        return _resample_keeping_corners(contour_clean, arc_norm * total_length, n_points)

    t_uniform = np.linspace(0, 1, n_points, endpoint=False)
    if len(arc_norm) >= 4 and contour_clean[0] == contour_clean[-1]:
        # A closed path (a spliced tour) is periodic: a not-a-knot end
        # condition would overshoot wherever the seam sits beside a long segment.
        xy = np.column_stack([contour_clean.real, contour_clean.imag])
        spline = CubicSpline(arc_norm, xy, bc_type="periodic")
        out = spline(t_uniform)
        return out[:, 0] + 1j * out[:, 1]

    interp_re = interp1d(arc_norm, contour_clean.real, kind="cubic")
    interp_im = interp1d(arc_norm, contour_clean.imag, kind="cubic")
    return interp_re(t_uniform) + 1j * interp_im(t_uniform)


# A vertex turning more than this (degrees), read over half a sample step
# either side, is a corner: a stroke's tip where the pen turns back, a
# junction where it leaves by another stroke, or a drawn corner.
CORNER_DEGREES = 60.0


def _resample_keeping_corners(
    z: NDArray[np.complex128],
    s: NDArray[np.float64],
    n_points: int,
) -> NDArray[np.complex128]:
    """``n_points`` samples by arc length on the polyline (linear, so nothing
    overshoots), with every corner among them.

    Corners (``CORNER_DEGREES``, the sharpest in each half-step window) and
    the start are fixed samples; the others are shared among the runs
    between them in proportion to length (largest remainder) and spaced
    evenly within each run, so the spacing stays within a sample of uniform.
    """
    total = float(s[-1])
    step = total / n_points
    reach = 0.5 * step
    before = np.interp(s - reach, s, z.real) + 1j * np.interp(s - reach, s, z.imag)
    after = np.interp(s + reach, s, z.real) + 1j * np.interp(s + reach, s, z.imag)
    closed = z[0] == z[-1]
    if closed:
        wrap = lambda t: np.mod(t, total)  # noqa: E731
        before = np.interp(wrap(s - reach), s, z.real) + 1j * np.interp(wrap(s - reach), s, z.imag)
        after = np.interp(wrap(s + reach), s, z.real) + 1j * np.interp(wrap(s + reach), s, z.imag)
    u, v = z - before, after - z
    ok = (np.abs(u) > 1e-12) & (np.abs(v) > 1e-12)
    turn = np.zeros(len(z))
    turn[ok] = np.degrees(np.abs(np.angle(v[ok] / u[ok])))
    # Non-maximum suppression over the half-step window, sharpest first; on
    # a near-tie the vertex furthest off its chord is the corner (a tip's apex).
    deviation = np.abs(z - 0.5 * (before + after))
    corners: list[float] = []
    for i in np.lexsort((-deviation, -np.round(turn))):
        if turn[i] < CORNER_DEGREES:
            break
        if 0.0 < s[i] < total and all(abs(s[i] - c) > reach for c in corners):
            corners.append(float(s[i]))
        if len(corners) >= n_points // 4:
            break
    fixed = np.array(sorted({0.0, *corners}))
    ends = np.append(fixed[1:], total)
    lengths = ends - fixed
    free = n_points - len(fixed)
    share = free * lengths / total
    counts = np.floor(share).astype(int)
    for i in np.argsort(-(share - counts))[: free - int(counts.sum())]:
        counts[i] += 1
    t = np.concatenate(
        [
            np.concatenate([[a], a + (b - a) * np.arange(1, m + 1) / (m + 1)])
            for a, b, m in zip(fixed, ends, counts)
        ]
    )
    return np.interp(t, s, z.real) + 1j * np.interp(t, s, z.imag)
