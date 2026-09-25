"""Stage 3: Edge feature contours for facial/detail features."""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray
from skimage import feature, filters, measure, morphology

from fourier_analysis.contours.geometry import (
    _compactness,
    _contours_are_near_duplicates,
    _polygon_area,
)
from fourier_analysis.contours.image import LoadedImage
from fourier_analysis.contours.isolation import SubjectIsolation
from fourier_analysis.contours.models import ContourConfig
from fourier_analysis.contours.processing import _postprocess_raw_contours
from fourier_analysis.contours.support import band_window, clip_to_subject, subject_edge_field


def extract_feature_contours(
    image: LoadedImage,
    isolation: SubjectIsolation,
    structure_contours: list[tuple[NDArray[np.complex128], float]],
    budget: int,
    config: ContourConfig,
) -> list[tuple[NDArray[np.complex128], float]]:
    """Extract edge-density contours that trace facial features.

    Builds a density field from max(gaussian(color_gradient), gaussian(canny)),
    weighted by soft saliency and scaled to the subject (``subject_edge_field``),
    extracts iso-contours at 13 levels, clips each to the subject band (its
    in-subject runs survive as open strokes), filters to feature-scale band,
    deduplicates against structure contours, sorts by compactness,
    enforces spatial diversity, and returns up to *budget* contours.
    """
    # Build density field: color gradient + learned/Canny edges.
    color_grad = image.color_gradient

    # Try learned edge detector first (B3 integration).
    learned_edges = None
    if config.feature.edge_model != "canny":
        from fourier_analysis.contours.ml import predict_edge_map
        learned_edges = predict_edge_map(image)

    if learned_edges is not None:
        density = filters.gaussian(learned_edges, sigma=0.5)
        color_density = filters.gaussian(color_grad, sigma=1.0)
        density = np.maximum(density, color_density * 0.5)
    else:
        # Canny path with configurable sigma (A3).
        gray_edges = feature.canny(image.detail_grayscale, sigma=0.8)
        density = filters.gaussian(color_grad, sigma=1.5)
        canny_density = filters.gaussian(
            gray_edges.astype(np.float64), sigma=config.feature.density_sigma,
        )
        density = np.maximum(density, canny_density)

    # Scale to the subject, not the global maximum: a bright background edge
    # must not set the levels, and saliency fades background edges out.
    density = subject_edge_field(density, isolation.saliency_map, isolation.subject_mask)

    # Extract contours at multiple density levels (A3: 13 levels).
    levels = [0.04, 0.07, 0.10, 0.15, 0.20, 0.27, 0.35, 0.44, 0.54, 0.64, 0.74, 0.84, 0.92]

    min_length = max(config.min_contour_length, 60)
    min_bbox_area = image.image_area * 0.0005
    # Feature-scale band (A4): hard floor at 0.01% with compactness guard.
    min_feature_area_hard = image.image_area * 0.0001
    min_feature_area_soft = image.image_area * 0.0003
    # Cap at 40% of silhouette area (if known) to allow large features
    # like mouths and eyes while excluding near-silhouette duplicates.
    if isolation.silhouette_area > 0:
        max_feature_area = isolation.silhouette_area * 0.40
    else:
        max_feature_area = image.image_area * 0.15

    window = band_window(isolation.subject_band, density.shape)
    offset = np.array([window[0].start, window[1].start], dtype=np.float64)
    raw_contours: list[NDArray[np.floating]] = []
    for level in levels:
        contours = [c + offset for c in measure.find_contours(density[window], level=level)]
        for c in contours:
            if len(c) < min_length:
                continue
            # Filter by bbox area.
            rows, cols = c[:, 0], c[:, 1]
            bbox_area = (rows.max() - rows.min()) * (cols.max() - cols.min())
            if bbox_area < min_bbox_area:
                continue
            # Keep only the in-subject runs: never a whole-contour vote.
            if isolation.subject_band is not None:
                raw_contours.extend(clip_to_subject(c, isolation.subject_band, min_length))
            else:
                raw_contours.append(c)

    # Postprocess: convert to complex, smooth, resample, simplify, dedup.
    # Use uncapped max_contours so small features survive.
    from dataclasses import replace as _replace
    uncapped_config = _replace(config, max_contours=None)
    processed, areas = _postprocess_raw_contours(raw_contours, image, uncapped_config)

    candidates = _feature_scale(processed, areas, min_feature_area_hard,
                                min_feature_area_soft, max_feature_area)

    # Merge in region-based feature candidates (dark/light patches).
    region_candidates = _extract_region_features(image, isolation, config)
    for rc, ra in region_candidates:
        # Dedup region candidates against edge candidates.
        is_dup = any(
            _contours_are_near_duplicates(rc, ra, ec, ea, image)
            for ec, ea in candidates
        )
        if not is_dup:
            candidates.append((rc, ra))

    # Deduplicate against structure contours.
    if structure_contours:
        deduped: list[tuple[NDArray[np.complex128], float]] = []
        for c, a in candidates:
            is_dup = any(
                _contours_are_near_duplicates(c, a, sc, sa, image)
                for sc, sa in structure_contours
            )
            if not is_dup:
                deduped.append((c, a))
        candidates = deduped

    # Sort by compactness × proximity to subject center.
    # Features near the subject centroid (face area) rank higher than
    # peripheral features (background objects, ground).
    if isolation.subject_mask is not None and isolation.silhouette_area > 0:
        rows, cols = np.nonzero(isolation.subject_mask)
        h, w = isolation.subject_mask.shape
        ref_center = complex(float(cols.mean()) - w / 2, h / 2 - float(rows.mean()))
        subject_radius = max(1.0, (isolation.silhouette_area / np.pi) ** 0.5)
    else:
        ref_center = 0j
        subject_radius = image.diagonal * 0.5

    def _compactness_key(pair: tuple[NDArray[np.complex128], float]) -> float:
        # An open stroke has no area, so no compactness: closed features
        # (eyes, nostrils, mouths) rank first, open runs after them.
        contour, area = pair
        comp = _compactness(contour, area) if area > 0 else 0.0
        center = complex(float(contour.real.mean()), float(contour.imag.mean()))
        dist = abs(center - ref_center)
        proximity = max(0.5, 1.0 - 0.5 * (dist / subject_radius))
        return comp * proximity

    candidates.sort(key=_compactness_key, reverse=True)

    # Enforce spatial diversity (A2: configurable + adaptive relaxation).
    min_spacing = image.diagonal * config.feature.spatial_diversity_fraction
    picked: list[tuple[NDArray[np.complex128], float]] = []
    picked_centers: list[complex] = []
    skipped: list[tuple[NDArray[np.complex128], float]] = []

    for c, a in candidates:
        if len(picked) >= budget:
            break
        center = complex(float(c.real.mean()), float(c.imag.mean()))
        if any(abs(center - pc) < min_spacing for pc in picked_centers):
            skipped.append((c, a))
            continue
        picked.append((c, a))
        picked_centers.append(center)

    # Second-pass relaxation: if first pass picked < 60% of budget,
    # re-scan skipped candidates at half spacing (allows clustered features).
    if len(picked) < budget * 0.6 and skipped:
        relaxed_spacing = min_spacing * 0.5
        for c, a in skipped:
            if len(picked) >= budget:
                break
            center = complex(float(c.real.mean()), float(c.imag.mean()))
            if any(abs(center - pc) < relaxed_spacing for pc in picked_centers):
                continue
            picked.append((c, a))
            picked_centers.append(center)

    return picked


def _extract_region_features(
    image: LoadedImage,
    isolation: SubjectIsolation,
    config: ContourConfig,
) -> list[tuple[NDArray[np.complex128], float]]:
    """Find dark/light patches within the subject that deviate from the subject median.

    Detects filled regions (eyes, mouths) as connected components where pixel
    intensity deviates from the subject median by >= 1 std. Morphological
    opening removes noise fragments from textured subjects.
    """
    source = image.detail_grayscale
    if isolation.subject_mask is None or not np.any(isolation.subject_mask):
        return []

    subject_pixels = source[isolation.subject_mask]
    median = float(np.median(subject_pixels))
    std = float(np.std(subject_pixels))
    if std < 1e-6:
        return []

    # Dark and light masks within the subject.
    dark_mask = (source < median - std) & isolation.subject_mask
    light_mask = (source > median + std) & isolation.subject_mask

    # Morphological cleanup (A5: disk(1) preserves thin features like eyebrows/lips).
    selem = morphology.disk(1)
    dark_mask = morphology.opening(dark_mask, selem)
    light_mask = morphology.opening(light_mask, selem)

    # Feature-scale bounds (A4: lowered hard floor with compactness guard).
    min_feature_area_hard = image.image_area * 0.0001
    min_feature_area_soft = image.image_area * 0.0003
    if isolation.silhouette_area > 0:
        max_feature_area = isolation.silhouette_area * 0.40
    else:
        max_feature_area = image.image_area * 0.15

    min_length = max(config.min_contour_length, 60)

    raw_contours: list[NDArray[np.floating]] = []
    for mask in (dark_mask, light_mask):
        contours = measure.find_contours(mask.astype(np.float64), level=0.5)
        for c in contours:
            if len(c) < min_length:
                continue
            raw_contours.append(c)

    if not raw_contours:
        return []

    from dataclasses import replace as _replace
    uncapped_config = _replace(config, max_contours=None)
    processed, areas = _postprocess_raw_contours(raw_contours, image, uncapped_config)

    return _feature_scale(processed, areas, min_feature_area_hard,
                          min_feature_area_soft, max_feature_area)


def _feature_scale(
    processed: list[NDArray[np.complex128]],
    areas: list[float],
    min_area_hard: float,
    min_area_soft: float,
    max_area: float,
) -> list[tuple[NDArray[np.complex128], float]]:
    """The feature-scale band (A4: compactness guard for small loops).

    A closed loop is judged by its area.  An open stroke (area 0.0, already
    length-filtered) is judged by the loop its length could enclose, so a stroke
    too long to be a feature is rejected like a loop too large to be one.
    """
    out: list[tuple[NDArray[np.complex128], float]] = []
    for c, a in zip(processed, areas):
        if a == 0.0:
            length = float(np.abs(np.diff(c)).sum())
            if length**2 / (4 * np.pi) > max_area:
                continue
            out.append((c, a))
            continue
        if a > max_area or a < min_area_hard:
            continue
        if a < min_area_soft and _compactness(c, a) < 0.15:
            continue
        out.append((c, a))
    return out
