"""Stage 2: Iso-intensity contours for overall subject structure."""

from __future__ import annotations

from dataclasses import replace

import numpy as np
from numpy.typing import NDArray
from skimage import measure

from fourier_analysis.contours.geometry import _bbox_iou, _contour_bbox, _polygon_area
from fourier_analysis.contours.image import LoadedImage
from fourier_analysis.contours.isolation import SubjectIsolation
from fourier_analysis.contours.models import ContourConfig
from fourier_analysis.contours.processing import _postprocess_raw_contours
from fourier_analysis.contours.support import (
    REDUNDANT_OVERLAP,
    InkCoverage,
    arc_support,
    band_px,
    band_window,
    clip_to_subject,
    complex_to_rc,
    normalise_to_subject,
)


# A structure run whose median subject-normalised colour gradient is below this
# follows no edge: it is an iso-line across a smooth region.
MIN_ARC_SUPPORT = 0.1


def extract_structure_contours(
    image: LoadedImage,
    isolation: SubjectIsolation,
    budget: int,
    config: ContourConfig,
) -> list[tuple[NDArray[np.complex128], float]]:
    """Extract iso-intensity contours within the subject region.

    Computes 16 quantile thresholds from subject pixels on detail_grayscale,
    extracts contours at each level via marching squares, clips each to the
    subject band (its in-subject runs survive as open strokes), deduplicates,
    drops runs no edge supports (``MIN_ARC_SUPPORT``), and returns up to
    *budget* contours by size that do not repeat the silhouette or each other.
    """
    source = image.detail_grayscale
    n_levels = 16
    percentiles = np.linspace(5, 95, n_levels)

    # Focus quantile levels on subject pixels if we have a mask.
    if isolation.subject_mask is not None and np.any(isolation.subject_mask):
        subject_pixels = source[isolation.subject_mask]
        levels = np.percentile(subject_pixels, percentiles)
    else:
        levels = np.percentile(source, percentiles)

    # Deduplicate near-identical thresholds.
    levels = sorted(set(round(float(v), 4) for v in levels))

    min_length = config.min_contour_length
    min_area = config.min_contour_area * image.image_area

    window = band_window(isolation.subject_band, source.shape)
    offset = np.array([window[0].start, window[1].start], dtype=np.float64)
    raw_contours: list[NDArray[np.floating]] = []
    for level in levels:
        contours = [c + offset for c in measure.find_contours(source[window], level=level)]
        for c in contours:
            if len(c) < min_length:
                continue
            # Keep only the in-subject runs: never a whole-contour vote.
            if isolation.subject_band is not None:
                raw_contours.extend(clip_to_subject(c, isolation.subject_band, min_length))
            else:
                raw_contours.append(c)

    # Postprocess: convert to complex, smooth, simplify, dedup (uncapped:
    # the ranking below picks the budget).
    processed, areas = _postprocess_raw_contours(
        raw_contours, image, replace(config, max_contours=None)
    )

    # Closed loops keep the area floor; open runs were length-filtered.
    result: list[tuple[NDArray[np.complex128], float]] = [
        (c, a) for c, a in zip(processed, areas) if a >= min_area or a == 0.0
    ]

    # Collapse nested near-concentric blobs (e.g. iso-levels of a uniform body).
    result = _deduplicate_nested(result)

    # Drop runs no edge backs (an iso-line across smooth skin or shading), then
    # rank by size: a loop by its area, an open run by the area its path spans.
    shape = image.grayscale.shape
    field = normalise_to_subject(image.color_gradient, isolation.subject_mask)
    result = [
        (c, a) for c, a in result
        if arc_support(complex_to_rc(c, shape), field) >= MIN_ARC_SUPPORT
    ]
    result.sort(key=lambda p: p[1] if p[1] > 0 else _polygon_area(p[0]), reverse=True)

    # Greedy: skip a run that mostly repeats the silhouette or a picked run.
    coverage = InkCoverage(band_px(shape))
    for silhouette in isolation.silhouettes:
        coverage.add(silhouette)
    picked: list[tuple[NDArray[np.complex128], float]] = []
    for c, a in result:
        if len(picked) >= budget:
            break
        if coverage.overlap(c) > REDUNDANT_OVERLAP:
            continue
        picked.append((c, a))
        coverage.add(c)
    return picked


def _deduplicate_nested(
    contours: list[tuple[NDArray[np.complex128], float]],
) -> list[tuple[NDArray[np.complex128], float]]:
    """Remove redundant structure contours that trace near-identical shapes.

    Two contours are redundant if they have similar area (ratio 0.65–1.55)
    and high bbox overlap (IoU >= 0.55). The kept contour is the one seen
    first (i.e. the larger, since we iterate area-descending).

    This catches iso-level duplicates: e.g. porthole rings or body blobs
    traced at adjacent intensity thresholds, which have nearly the same shape
    and position but slightly different areas.
    """
    if len(contours) <= 1:
        return contours

    # Sort by area descending so we keep the larger of any redundant pair.
    sorted_contours = sorted(contours, key=lambda p: p[1], reverse=True)
    keep: list[tuple[NDArray[np.complex128], float]] = []

    for c, a in sorted_contours:
        is_redundant = False
        c_bbox = _contour_bbox(c)

        for kc, ka in keep:
            area_ratio = a / ka if ka > 0 else 0.0
            if not (0.65 <= area_ratio <= 1.55):
                continue
            if _bbox_iou(c_bbox, _contour_bbox(kc)) >= 0.55:
                is_redundant = True
                break

        if not is_redundant:
            keep.append((c, a))

    return keep
