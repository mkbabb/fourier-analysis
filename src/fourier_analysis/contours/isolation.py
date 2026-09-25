"""Stage 1: Subject isolation via ML saliency + optional alpha intersection."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray
from scipy import ndimage as ndi
from skimage import measure

from fourier_analysis.contours.image import LoadedImage
from fourier_analysis.contours.models import ContourConfig
from fourier_analysis.contours.ml import _predict_probability_map
from fourier_analysis.contours.processing import _postprocess_raw_contours


@dataclass(frozen=True)
class SubjectIsolation:
    """Result of subject isolation: mask, saliency, and optional silhouette."""

    subject_mask: NDArray[np.bool_] | None
    saliency_map: NDArray[np.float64]
    silhouette: NDArray[np.complex128] | None
    silhouette_area: float


# Hysteresis seed level: the most salient component above it seeds the subject.
SEED_THRESHOLD = 0.8


def hysteresis_subject_mask(
    saliency: NDArray[np.float64],
    grow_threshold: float,
    seed_threshold: float = SEED_THRESHOLD,
) -> NDArray[np.bool_]:
    """The subject as one hysteresis region of the saliency map.

    The connected components above ``seed_threshold`` are ranked by saliency
    mass and the most salient seeds the subject; the component of
    ``saliency >= grow_threshold`` containing that seed is the mask.  When no
    pixel reaches the seed level, the saliency peak seeds it, so a small or
    faint subject is still isolated rather than disabled into full-image
    extraction.
    """
    seed_threshold = max(seed_threshold, grow_threshold)
    labels, n = ndi.label(saliency >= seed_threshold)
    if n > 0:
        mass = ndi.sum(saliency, labels, index=np.arange(1, n + 1))
        seed = labels == int(np.argmax(mass)) + 1
    else:
        seed = np.zeros(saliency.shape, dtype=bool)
        seed[np.unravel_index(int(np.argmax(saliency)), saliency.shape)] = True
    grown, _ = ndi.label(saliency >= min(grow_threshold, float(saliency[seed].min())))
    keep = np.unique(grown[seed])
    return np.isin(grown, keep[keep > 0])


def isolate_subject(
    image: LoadedImage,
    config: ContourConfig,
) -> SubjectIsolation:
    """Isolate the primary subject using ML saliency and optional alpha.

    1. Run the subject ensemble to get a probability map.
    2. Hysteresis: the most salient component above ``SEED_THRESHOLD`` seeds
       the mask, grown through ``saliency >= config.ml.threshold``.
    3. If alpha exists with 5-98% coverage, intersect with the mask.
    4. Extract the largest contour of the mask as the silhouette.
    """
    saliency = _predict_probability_map(image)
    subject_mask = hysteresis_subject_mask(saliency, config.ml.threshold)

    # Intersect with alpha if available and meaningful.
    if image.alpha is not None:
        alpha_mask = image.alpha > 0.5
        alpha_coverage = float(np.mean(alpha_mask))
        if 0.05 < alpha_coverage < 0.98:
            combined = alpha_mask & subject_mask
            if float(np.mean(combined)) > 0.05:
                subject_mask = combined

    silhouette: NDArray[np.complex128] | None = None
    silhouette_area = 0.0
    raw_contours = measure.find_contours(subject_mask.astype(float), level=0.5)
    if raw_contours:
        processed, areas = _postprocess_raw_contours(raw_contours, image, config)
        if processed:
            silhouette = processed[0]
            silhouette_area = areas[0]

    return SubjectIsolation(
        subject_mask=subject_mask,
        saliency_map=saliency,
        silhouette=silhouette,
        silhouette_area=silhouette_area,
    )
