from __future__ import annotations

import numpy as np
from numpy.typing import NDArray
from scipy.signal import savgol_filter
from skimage import measure

from fourier_analysis.contours.geometry import _polygon_area, _deduplicate_contours
from fourier_analysis.contours.image import LoadedImage
from fourier_analysis.contours.models import ContourConfig
from fourier_analysis.contours.support import is_closed_trace

# Douglas-Peucker tolerance (px): no simplified point strays further than this
# from the smoothed trace.
SIMPLIFY_TOLERANCE_PX = 0.5


def _douglas_peucker(z: NDArray[np.complex128], tolerance: float) -> NDArray[np.bool_]:
    """Keep-mask of the Douglas-Peucker simplification of an open polyline."""
    n = len(z)
    keep = np.zeros(n, dtype=bool)
    keep[0] = keep[-1] = True
    stack = [(0, n - 1)]
    while stack:
        i, j = stack.pop()
        if j - i < 2:
            continue
        a, b = z[i], z[j]
        seg = z[i + 1 : j]
        ab = b - a
        if abs(ab) < 1e-12:
            dist = np.abs(seg - a)
        else:
            dist = np.abs(((seg - a) * np.conj(ab)).imag) / abs(ab)
        k = int(np.argmax(dist))
        if dist[k] > tolerance:
            m = i + 1 + k
            keep[m] = True
            stack.append((i, m))
            stack.append((m, j))
    return keep


def _simplify_contour(
    z: NDArray[np.complex128],
    tolerance: float = SIMPLIFY_TOLERANCE_PX,
) -> NDArray[np.complex128]:
    """Douglas-Peucker simplification with a pixel tolerance.

    Every dropped point lies within *tolerance* px of the simplified polyline,
    so the deviation is bounded however gently a curve bends (a per-step angle
    test is not: many sub-threshold turns accumulate into an unbounded drift).
    A closed contour (first point repeated last) stays closed: it is split at
    the vertex farthest from its start and each half is simplified.
    """
    if len(z) < 4:
        return z
    if abs(z[0] - z[-1]) <= 1e-9:
        far = int(np.argmax(np.abs(z - z[0])))
        if far == 0:
            return z
        keep = np.zeros(len(z), dtype=bool)
        keep[: far + 1] |= _douglas_peucker(z[: far + 1], tolerance)
        keep[far:] |= _douglas_peucker(z[far:], tolerance)
    else:
        keep = _douglas_peucker(z, tolerance)
    return z[keep]


def _find_contours_padded(
    binary: NDArray[np.bool_],
    pad: int = 1,
) -> list[NDArray[np.floating]]:
    """Pad masks so border-touching shapes produce closed contours."""
    padded = np.pad(binary, pad, mode="constant", constant_values=False)
    raw = measure.find_contours(padded.astype(float), level=0.5)
    return [rc - pad for rc in raw]


def _contours_from_masks(
    masks: tuple[NDArray[np.bool_], ...],
) -> list[NDArray[np.floating]]:
    raw_contours: list[NDArray[np.floating]] = []
    for mask in masks:
        raw_contours.extend(_find_contours_padded(mask))
    return raw_contours


def _smooth(z: NDArray[np.complex128], fraction: float, closed: bool) -> NDArray[np.complex128]:
    """Savitzky-Golay smoothing over ``fraction`` of the trace's points.

    A closed loop is smoothed periodically (no seam artefact); an open stroke
    with polynomial end fitting, so its endpoints stay put.
    """
    pts = z[:-1] if closed else z
    if fraction <= 0 or len(pts) < 5:
        return z
    window = max(5, int(fraction * len(pts)))
    window = min(window, len(pts))
    if window % 2 == 0:
        window -= 1
    if window < 5:
        return z
    mode = "wrap" if closed else "interp"
    out = savgol_filter(pts.real, window, 3, mode=mode) + 1j * savgol_filter(
        pts.imag, window, 3, mode=mode
    )
    return np.append(out, out[0]) if closed else out


def _postprocess_raw_contours(
    raw_contours: list[NDArray[np.floating]],
    image: LoadedImage,
    config: ContourConfig,
) -> tuple[list[NDArray[np.complex128]], list[float]]:
    """Raw ``(row, col)`` traces -> centred complex contours, with their areas.

    A contour is closed only when marching squares closed it; nothing is
    force-closed, so a stroke cut at the frame or the subject edge stays open
    and never grows a chord.  Area and the area filters apply to closed loops
    only (an open stroke's area is 0.0 and it is filtered by length).  Closed
    loops come first by area, then open strokes by length.
    """
    cy, cx = image.grayscale.shape[0] / 2, image.grayscale.shape[1] / 2
    area_threshold = config.min_contour_area * image.image_area

    candidates: list[tuple[NDArray[np.complex128], float, float]] = []
    for rc in raw_contours:
        if len(rc) < config.min_contour_length:
            continue
        closed = is_closed_trace(rc)
        rows, cols = rc[:, 0], rc[:, 1]
        z = (cols - cx) + 1j * (cy - rows)

        area = 0.0
        if closed:
            area = _polygon_area(z)
            row_min, row_max = float(rows.min()), float(rows.max())
            col_min, col_max = float(cols.min()), float(cols.max())
            x_span = (col_max - col_min) / max(1.0, image.grayscale.shape[1] - 1.0)
            y_span = (row_max - row_min) / max(1.0, image.grayscale.shape[0] - 1.0)
            bbox_area = max(1.0, (row_max - row_min) * (col_max - col_min))
            frame_touching = (
                row_min <= 1.0
                and col_min <= 1.0
                and row_max >= image.grayscale.shape[0] - 2.0
                and col_max >= image.grayscale.shape[1] - 2.0
            )
            if area_threshold > 0 and area < area_threshold:
                continue
            if area > 0.92 * image.image_area:
                continue
            if (
                frame_touching
                and x_span > 0.97
                and y_span > 0.97
                and area / bbox_area > 0.78
                and area > 0.45 * image.image_area
            ):
                continue

        # A6: area-aware smoothing — small loops get a halved window.  An open
        # stroke is small when it is shorter than a 1%-of-image loop's perimeter.
        if closed:
            is_small = area < 0.01 * image.image_area
        else:
            is_small = float(np.abs(np.diff(z)).sum()) < 2 * np.sqrt(0.01 * np.pi * image.image_area)
        z = _smooth(z, config.smooth_contours * (0.5 if is_small else 1.0), closed)
        z = _simplify_contour(z)

        length = float(np.abs(np.diff(z)).sum())
        candidates.append((z, area, length))

    candidates.sort(key=lambda t: (t[1], t[2]), reverse=True)
    deduped = _deduplicate_contours([(z, a) for z, a, _ in candidates], image)
    if config.max_contours is not None and config.max_contours > 0:
        deduped = deduped[: config.max_contours]

    return [z for z, _ in deduped], [area for _, area in deduped]
