"""Stage 3: subject-local ridge features (eyes, brows, nose, mouth, necklines).

A feature is an edge, so it is extracted as a ridge, not as an iso-loop of a
blurred edge density (which draws every edge twice, once on each side, and
rings smooth patches with blobs):

1. **Ridges.**  Non-maximum-suppressed edges inside the subject band: Canny on
   the CLAHE grey with hysteresis thresholds taken from the *subject's* own
   gradient percentiles, or the skeleton of a pinned learned edge map
   (``edge_model``).  The background can neither enter nor set the scale.
2. **Linking.**  Ridge pixels are walked into polylines: open where the ridge
   ends or branches, closed where it returns to its start.
3. **Support.**  Each polyline is split into the spans the saliency-weighted,
   subject-normalised edge field (``subject_edge_field``) supports at the
   relative floor (``support_floor``), as the structure stage is.
4. **Ranking.**  By support x arc length x on-subject share; a stroke that
   repeats drawn ink (silhouette, structure, a picked feature) is skipped.
"""

from __future__ import annotations

from dataclasses import replace

import numpy as np
from numpy.typing import NDArray
from scipy import ndimage as ndi
from skimage import feature, filters, morphology

from fourier_analysis.contours.image import LoadedImage
from fourier_analysis.contours.isolation import SubjectIsolation
from fourier_analysis.contours.models import ContourConfig
from fourier_analysis.contours.processing import _postprocess_raw_contours
from fourier_analysis.contours.support import (
    REDUNDANT_OVERLAP,
    InkCoverage,
    _sample,
    arc_support,
    band_px,
    complex_to_rc,
    is_closed_trace,
    subject_edge_field,
    support_floor,
    supported_runs,
)

# Canny hysteresis on the subject's gradient-magnitude percentiles: a ridge
# must reach the high percentile somewhere and stays linked above the low one.
RIDGE_HIGH_PERCENTILE = 85.0
RIDGE_LOW_PERCENTILE = 60.0
# Ridge polylines are smoothed along their length by a Gaussian of this many
# px before postprocessing: it removes the pixel staircase and stays well
# within a pixel of the ridge on any curve a feature can have.
RIDGE_SMOOTH_PX = 1.5

_NEIGHBOURS = (
    (0, 1), (1, 0), (0, -1), (-1, 0),  # 4-neighbours first: no corner cutting
    (1, 1), (1, -1), (-1, 1), (-1, -1),
)


def ridge_map(
    image: LoadedImage,
    isolation: SubjectIsolation,
    config: ContourConfig,
) -> NDArray[np.bool_]:
    """The one-pixel ridges features are drawn from, inside the subject band."""
    band = isolation.subject_band
    if band is None:
        band = np.ones(image.grayscale.shape, dtype=bool)

    learned = None
    if config.feature.edge_model != "canny":
        from fourier_analysis.contours.ml import predict_edge_map

        learned = predict_edge_map(image)
    if learned is not None:
        pixels = learned[band] if band.any() else learned.ravel()
        high = float(np.percentile(pixels, RIDGE_HIGH_PERCENTILE))
        ridges = morphology.skeletonize(
            filters.apply_hysteresis_threshold(learned, 0.5 * high, high) & band
        )
        return np.asarray(ridges, dtype=bool)

    source = image.detail_grayscale
    sigma = config.feature.density_sigma
    smoothed = filters.gaussian(source, sigma=sigma)
    magnitude = np.hypot(ndi.sobel(smoothed, axis=0), ndi.sobel(smoothed, axis=1))
    region = isolation.subject_mask if isolation.subject_mask is not None else band
    pixels = magnitude[region] if region.any() else magnitude.ravel()
    low, high = np.percentile(pixels, [RIDGE_LOW_PERCENTILE, RIDGE_HIGH_PERCENTILE])
    if high <= 0:
        return np.zeros_like(band, dtype=bool)
    return np.asarray(
        feature.canny(source, sigma=sigma, low_threshold=low, high_threshold=high, mask=band),
        dtype=bool,
    )


def link_ridges(ridges: NDArray[np.bool_], min_points: int = 2) -> list[NDArray[np.float64]]:
    """Walk ridge pixels into ``(row, col)`` polylines.

    Each walk starts at a ridge end (a pixel with one ridge neighbour) when one
    is left, and follows unvisited neighbours (4-neighbours first) until none
    remains; a branch becomes its own polyline, walked from its own end.  What
    is left after the ends are exhausted are loops: a walk that finishes next
    to its start is closed (its first point repeated last).
    """
    ridges = np.asarray(ridges, dtype=bool)
    if not ridges.any():
        return []
    h, w = ridges.shape
    degree = ndi.convolve(ridges.astype(np.int8), np.ones((3, 3), np.int8), mode="constant") - 1
    visited = np.zeros_like(ridges)
    ends = [tuple(p) for p in np.argwhere(ridges & (degree == 1))]
    rest = [tuple(p) for p in np.argwhere(ridges)]

    def walk(start: tuple[int, int]) -> list[tuple[int, int]]:
        path = [start]
        visited[start] = True
        r, c = start
        while True:
            for dr, dc in _NEIGHBOURS:
                rr, cc = r + dr, c + dc
                if 0 <= rr < h and 0 <= cc < w and ridges[rr, cc] and not visited[rr, cc]:
                    visited[rr, cc] = True
                    path.append((rr, cc))
                    r, c = rr, cc
                    break
            else:
                return path

    lines: list[NDArray[np.float64]] = []
    for start in ends + rest:
        if visited[start]:
            continue
        path = walk(start)
        if len(path) < min_points:
            continue
        rc = np.asarray(path, dtype=np.float64)
        (r0, c0), (r1, c1) = path[0], path[-1]
        if len(path) > 3 and max(abs(r0 - r1), abs(c0 - c1)) <= 1:
            rc = np.vstack([rc, rc[:1]])
        lines.append(rc)
    return lines


def _smooth_polyline(rc: NDArray[np.float64], sigma: float) -> NDArray[np.float64]:
    """Gaussian smoothing along a 1 px-spaced polyline (periodic when closed;
    an open stroke keeps its endpoints)."""
    if len(rc) < 5 or sigma <= 0:
        return rc
    if is_closed_trace(rc):
        pts = ndi.gaussian_filter1d(rc[:-1], sigma, axis=0, mode="wrap")
        return np.vstack([pts, pts[:1]])
    out = ndi.gaussian_filter1d(rc, sigma, axis=0, mode="nearest")
    out[0], out[-1] = rc[0], rc[-1]
    return out


def extract_feature_contours(
    image: LoadedImage,
    isolation: SubjectIsolation,
    structure_contours: list[tuple[NDArray[np.complex128], float]],
    budget: int,
    config: ContourConfig,
) -> list[tuple[NDArray[np.complex128], float]]:
    """Up to *budget* edge-supported ridge polylines inside the subject.

    See the module docstring.  Returns ``(contour, area)`` pairs in centred
    complex coordinates: ``area`` is the polygon area of a closed ridge and 0.0
    for an open one.
    """
    shape = image.grayscale.shape
    field = subject_edge_field(image.color_gradient, isolation.saliency_map, isolation.subject_mask)
    floor = support_floor(isolation.silhouettes, field)
    min_length = config.min_contour_length

    raw: list[NDArray[np.floating]] = []
    for line in link_ridges(ridge_map(image, isolation, config), min_points=min_length):
        for run in supported_runs(line, field, floor, min_length):
            raw.append(_smooth_polyline(run, RIDGE_SMOOTH_PX))

    # Postprocess (centred complex, light smoothing, simplification, dedup),
    # uncapped and without the loop-area floor: the ranking picks the budget,
    # and a small closed ridge (a nostril) is a feature, not noise.
    processed, areas = _postprocess_raw_contours(
        raw, image, replace(config, max_contours=None, min_contour_area=0.0)
    )

    mask = isolation.subject_mask
    member = mask if mask is not None and mask.any() else np.ones(shape, dtype=bool)

    ranked: list[tuple[float, NDArray[np.complex128], float]] = []
    for c, a in zip(processed, areas):
        rc = complex_to_rc(c, shape)
        support = arc_support(rc, field)
        if support < floor:
            continue
        length = float(np.abs(np.diff(c)).sum())
        share = float(np.mean(_sample(member, rc)))
        ranked.append((support * length * share, c, a))
    ranked.sort(key=lambda t: t[0], reverse=True)

    coverage = InkCoverage(band_px(shape))
    for silhouette in isolation.silhouettes:
        coverage.add(silhouette)
    for c, _ in structure_contours:
        coverage.add(c)
    picked: list[tuple[NDArray[np.complex128], float]] = []
    for _, c, a in ranked:
        if len(picked) >= budget:
            break
        if coverage.overlap(c) > REDUNDANT_OVERLAP:
            continue
        picked.append((c, a))
        coverage.add(c)
    return picked
