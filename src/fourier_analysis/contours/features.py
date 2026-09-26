"""Stage 3: subject-local ridge features (eyes, brows, nose, mouth, necklines).

A feature is an edge, so it is extracted as a ridge, not as an iso-loop of a
blurred edge density (which draws every edge twice, once on each side, and
rings smooth patches with blobs):

1. **Ridges.**  Non-maximum-suppressed edges inside the subject band, kept
   by hysteresis on their *local contrast* (``ridge_contrast``: the gradient
   over its own surround, thresholds at the subject's percentiles), or the
   skeleton of a pinned learned edge map (``edge_model``).  The background
   can neither enter nor set the scale, and neither can the subject's busiest
   texture: an eyelid in smooth skin stands above its surround as a coat's
   hatching does not.
2. **Linking.**  Ridge pixels are walked into polylines: open where the ridge
   ends or branches, closed where it returns to its start.  Pieces whose ends
   face each other across a gap under half the band are one edge the
   gradient dipped along, and are joined (``join_ridges``).  A stroke is kept
   from two band half-widths long (a small face's eyelid is shorter than the
   configured trace minimum).
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
from skimage import filters, morphology

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
    normalise_to_subject,
    structure_edge_field,
    structure_gradient,
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
RIDGE_SMOOTH_PX = 3.0
# Ridge pieces whose ends face each other across at most half the subject band
# are one edge (see ``join_ridges``); the join may turn this much.
JOIN_GAP_BANDS = 0.5
# Ridge strength is local contrast: the magnitude over its Gaussian surround
# of this many band widths, the surround floored at this fraction of the
# subject scale (see ``ridge_contrast``).
SURROUND_BANDS = 4.0
RIDGE_CONTRAST_FLOOR = 0.1
JOIN_MAX_TURN_DEG = 30.0
# The shortest feature stroke, in subject-band half-widths.
FEATURE_MIN_BANDS = 2.0

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
    gr, gc = ndi.sobel(smoothed, axis=0), ndi.sobel(smoothed, axis=1)
    magnitude = np.hypot(gr, gc)
    region = isolation.subject_mask if isolation.subject_mask is not None else band
    strength = ridge_contrast(magnitude, region, band_px(magnitude.shape))
    pixels = strength[region] if region.any() else strength.ravel()
    low, high = np.percentile(pixels, [RIDGE_LOW_PERCENTILE, RIDGE_HIGH_PERCENTILE])
    if high <= 0:
        return np.zeros_like(band, dtype=bool)
    peaks = _non_maximum(magnitude, gr, gc) & band
    ridges = filters.apply_hysteresis_threshold(np.where(peaks, strength, 0.0), low, high)
    return np.asarray(morphology.skeletonize(ridges), dtype=bool)


def structure_ridge_map(
    image: LoadedImage,
    isolation: SubjectIsolation,
) -> NDArray[np.bool_]:
    """The one-pixel crests of the structure-scale edge (``structure_gradient``)
    inside the subject band, kept by hysteresis at the same subject
    percentiles as the fine ridges.  These are the region boundaries texture
    hides at the pixel scale: a face's outline against hair, a hairline, a
    brow, a jaw's shadow, a collar."""
    band = isolation.subject_band
    if band is None:
        band = np.ones(image.grayscale.shape, dtype=bool)
    magnitude, gr, gc = structure_gradient(image)
    region = isolation.subject_mask if isolation.subject_mask is not None else band
    strength = normalise_to_subject(magnitude, region)
    pixels = strength[region] if region.any() else strength.ravel()
    low, high = np.percentile(pixels, [RIDGE_LOW_PERCENTILE, RIDGE_HIGH_PERCENTILE])
    if high <= 0:
        return np.zeros_like(band, dtype=bool)
    peaks = _non_maximum(magnitude, gr, gc) & band
    ridges = filters.apply_hysteresis_threshold(np.where(peaks, strength, 0.0), low, high)
    return np.asarray(morphology.skeletonize(ridges), dtype=bool)


def ridge_contrast(
    magnitude: NDArray[np.floating],
    region: NDArray[np.bool_],
    radius: float,
) -> NDArray[np.float64]:
    """Gradient magnitude over its own surround: the local contrast of an edge.

    The magnitude is scaled by its subject percentile (``normalise_to_subject``)
    and divided by its Gaussian average over ``SURROUND_BANDS`` band widths,
    floored at ``RIDGE_CONTRAST_FLOOR`` of the subject scale so a flat patch's
    noise is not amplified.  An eye in smooth skin stands far above its
    surround; a hatching or fur line in a field of equal lines does not, so
    the subject's busiest texture cannot set the scale for its quiet features.
    """
    scaled = normalise_to_subject(magnitude, region)
    surround = ndi.gaussian_filter(scaled, SURROUND_BANDS * radius)
    return scaled / np.maximum(surround, RIDGE_CONTRAST_FLOOR)


def _non_maximum(
    magnitude: NDArray[np.floating],
    gr: NDArray[np.floating],
    gc: NDArray[np.floating],
) -> NDArray[np.bool_]:
    """Pixels at a local maximum of ``magnitude`` across the edge (the gradient
    direction, quantised to 45 degrees): the one-pixel crest of every edge."""
    angle = np.mod(np.rad2deg(np.arctan2(gr, gc)), 180.0)
    sector = (np.floor((angle + 22.5) / 45.0).astype(int)) % 4
    padded = np.pad(magnitude, 1, mode="edge")
    h, w = magnitude.shape
    # (drow, dcol) along the gradient for sectors 0, 45, 90, 135 degrees.
    steps = ((0, 1), (1, 1), (1, 0), (1, -1))
    keep = np.zeros((h, w), dtype=bool)
    for k, (dr, dc) in enumerate(steps):
        fwd = padded[1 + dr : 1 + dr + h, 1 + dc : 1 + dc + w]
        bwd = padded[1 - dr : 1 - dr + h, 1 - dc : 1 - dc + w]
        keep |= (sector == k) & (magnitude >= fwd) & (magnitude > bwd)
    return keep & (magnitude > 0)


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


def _end_direction(rc: NDArray[np.float64], at_start: bool, span: int) -> NDArray[np.float64]:
    """Unit vector pointing out of a polyline's end, from its last ``span`` px."""
    pts = rc if not at_start else rc[::-1]
    k = min(span, len(pts) - 1)
    d = pts[-1] - pts[-1 - k]
    n = float(np.hypot(*d))
    return d / n if n > 1e-9 else np.zeros(2)


def join_ridges(
    lines: list[NDArray[np.float64]],
    gap_px: float,
    max_turn_deg: float = JOIN_MAX_TURN_DEG,
) -> list[NDArray[np.float64]]:
    """Join open polylines whose ends face each other across a small gap.

    Canny breaks one edge into pieces wherever its gradient dips (a jaw under
    soft light, a brow, a hairline).  Two open ends are joined when they lie
    within ``gap_px`` of each other and the join continues both: each end's
    outward direction is within ``max_turn_deg`` of the join, and the two
    directions within ``max_turn_deg`` of opposite.  Pairs are taken nearest
    (by gap plus a turn penalty) first; each end joins at most once; a chain
    that returns to itself closes.  Closed polylines pass through unchanged.
    """
    if gap_px <= 0 or len(lines) < 2:
        return list(lines)
    closed = [is_closed_trace(ln) for ln in lines]
    span = max(2, int(round(gap_px)))
    ends: list[tuple[int, bool]] = []
    pts: list[NDArray[np.float64]] = []
    dirs: list[NDArray[np.float64]] = []
    for i, ln in enumerate(lines):
        if closed[i] or len(ln) < 2:
            continue
        for at_start in (True, False):
            ends.append((i, at_start))
            pts.append(ln[0] if at_start else ln[-1])
            dirs.append(_end_direction(ln, at_start, span))
    if len(ends) < 2:
        return list(lines)
    from scipy.spatial import cKDTree

    P, D = np.asarray(pts), np.asarray(dirs)
    # At 180 degrees any angle joins (a corner): no rounding may refuse one.
    cos_turn = -np.inf if max_turn_deg >= 180.0 else float(np.cos(np.deg2rad(max_turn_deg)))
    pairs = []
    for a, b in cKDTree(P).query_pairs(gap_px):
        if ends[a][0] == ends[b][0]:
            continue
        v = P[b] - P[a]
        dist = float(np.hypot(*v))
        if dist > 1e-9:
            u = v / dist
            if D[a] @ u < cos_turn or -(D[b] @ u) < cos_turn:
                continue
        if -(D[a] @ D[b]) < cos_turn:
            continue
        turn = 1.0 - float(-(D[a] @ D[b]))
        pairs.append((dist + gap_px * turn, a, b))
    pairs.sort()
    partner: dict[int, int] = {}
    for _, a, b in pairs:
        if a in partner or b in partner:
            continue
        partner[a], partner[b] = b, a
    if not partner:
        return list(lines)

    index = {e: k for k, e in enumerate(ends)}
    used = [False] * len(lines)
    out: list[NDArray[np.float64]] = []

    def chain(first: int, entry_start: bool) -> tuple[list[NDArray[np.float64]], bool]:
        """Walk from line ``first`` entered at its start (or end)."""
        parts: list[NDArray[np.float64]] = []
        i, at_start = first, entry_start
        while True:
            used[i] = True
            ln = lines[i]
            parts.append(ln if at_start else ln[::-1])
            exit_end = index[(i, not at_start)]
            nxt = partner.get(exit_end)
            if nxt is None:
                return parts, False
            j, j_start = ends[nxt]
            if used[j]:
                return parts, j == first
            i, at_start = j, j_start

    for i, ln in enumerate(lines):
        if used[i] or closed[i] or len(ln) < 2:
            continue
        # Start from a free end so the whole chain is walked.
        if partner.get(index[(i, True)]) is None:
            parts, _ = chain(i, True)
        elif partner.get(index[(i, False)]) is None:
            parts, _ = chain(i, False)
        else:
            continue  # inside a chain; reached from its free end or as a cycle
        out.append(np.vstack(parts))
    for i, ln in enumerate(lines):
        if used[i] or closed[i] or len(ln) < 2:
            continue
        parts, cyc = chain(i, True)
        merged = np.vstack(parts)
        out.append(np.vstack([merged, merged[:1]]) if cyc else merged)
    out.extend(ln for i, ln in enumerate(lines) if closed[i] or (len(ln) < 2 and not used[i]))
    return out


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
    budget: int | None,
    config: ContourConfig,
) -> list[tuple[NDArray[np.complex128], float]]:
    """Up to *budget* (``None``: all) edge-supported ridge polylines inside the subject.

    See the module docstring.  Returns ``(contour, area)`` pairs in centred
    complex coordinates: ``area`` is the polygon area of a closed ridge and 0.0
    for an open one.
    """
    shape = image.grayscale.shape
    fine = subject_edge_field(image.color_gradient, isolation.saliency_map, isolation.subject_mask)
    coarse = structure_edge_field(image, isolation.saliency_map, isolation.subject_mask)
    # A feature is a stroke once it is longer than the band is wide (twice the
    # band's half-width): an eyelid of a small face is shorter than the
    # configured trace minimum, which is sized for marching-squares loops.
    min_length = min(config.min_contour_length, int(np.ceil(FEATURE_MIN_BANDS * band_px(shape))))
    post = replace(config, max_contours=None, min_contour_area=0.0, min_contour_length=min_length)
    mask = isolation.subject_mask
    member = mask if mask is not None and mask.any() else np.ones(shape, dtype=bool)

    # Two scales, each judged in its own field against its own floor: the
    # pixel-scale ridges (eyelids, teeth, nostrils) and the structure-scale
    # ones (outline, hairline, brows, jaw, collar).  A stroke both scales
    # find is kept once (the coverage pass below).
    ranked: list[tuple[float, NDArray[np.complex128], float]] = []
    for ridges, field in (
        (ridge_map(image, isolation, config), fine),
        (structure_ridge_map(image, isolation), coarse),
    ):
        floor = support_floor(isolation.silhouettes, field)
        raw: list[NDArray[np.floating]] = []
        pieces = link_ridges(ridges, min_points=2)
        for line in join_ridges(pieces, JOIN_GAP_BANDS * band_px(shape)):
            if len(line) < min_length:
                continue
            for run in supported_runs(line, field, floor, min_length):
                raw.append(_smooth_polyline(run, RIDGE_SMOOTH_PX))

        # Postprocess (centred complex, light smoothing, simplification,
        # dedup), uncapped and without the loop-area floor: the ranking picks
        # the budget, and a small closed ridge (a nostril) is a feature.
        processed, areas = _postprocess_raw_contours(raw, image, post)
        for c, a in zip(processed, areas):
            rc = complex_to_rc(c, shape)
            support = arc_support(rc, field) / max(floor, 1e-12)
            if support < 1.0:
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
        if budget is not None and len(picked) >= budget:
            break
        if coverage.overlap(c) > REDUNDANT_OVERLAP:
            continue
        picked.append((c, a))
        coverage.add(c)
    return picked
