"""Stage 4: Deterministic merge of silhouette, structure, and feature contours."""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from fourier_analysis.contours.geometry import _contours_are_near_duplicates, _polygon_area
from fourier_analysis.contours.image import LoadedImage
from fourier_analysis.contours.isolation import SubjectIsolation
from fourier_analysis.contours.support import REDUNDANT_OVERLAP, InkCoverage, band_px


def assemble_contours(
    isolation: SubjectIsolation,
    structure: list[tuple[NDArray[np.complex128], float]],
    features: list[tuple[NDArray[np.complex128], float]],
    max_contours: int,
    image: LoadedImage,
) -> list[NDArray[np.complex128]]:
    """Deterministically merge silhouette, structure, and feature contours.

    1. Always prepend the silhouettes (the ML mask boundary: every significant
       component, open where the frame crops it).
    2. Add structure contours (their share of the remaining budget), deduped
       against what is already merged.
    3. Add feature contours (remaining budget).
    4. If either pool underflows, surplus goes to the other.

    Structure and features are already clipped to the subject (``support``),
    so there is no centroid pruning pass.
    """
    merged: list[tuple[NDArray[np.complex128], float]] = []
    coverage = InkCoverage(band_px(image.grayscale.shape))

    def is_dup(c: NDArray[np.complex128], a: float) -> bool:
        """A near-duplicate loop, or a stroke that mostly repeats drawn ink."""
        return coverage.overlap(c) > REDUNDANT_OVERLAP or any(
            _contours_are_near_duplicates(c, a, mc, ma, image) for mc, ma in merged
        )

    def take(c: NDArray[np.complex128], a: float) -> None:
        merged.append((c, a))
        coverage.add(c)

    # Always include the silhouettes — they trace the actual subject boundary
    # (including thin features like sun rays, giraffe legs, etc.) that
    # iso-intensity structure contours may smooth over.
    for silhouette in isolation.silhouettes:
        closed = len(silhouette) > 2 and abs(silhouette[0] - silhouette[-1]) <= 1e-9
        take(silhouette, _polygon_area(silhouette) if closed else 0.0)

    # Proportional budget split based on actual yield from each stage.
    # When structure yields many contours, split is ~even.
    # When structure yields few (e.g. post-dedup uniform subjects), features get more.
    remaining = max(0, max_contours - len(merged))
    total_available = len(structure) + len(features)
    if total_available > 0:
        structure_budget = max(1, round(remaining * len(structure) / total_available))
        feature_budget = remaining - structure_budget
    else:
        structure_budget = remaining // 2
        feature_budget = remaining - structure_budget

    # Add structure contours, deduplicating against silhouette.
    structure_added = 0
    for c, a in structure:
        if structure_added >= structure_budget:
            break
        if not is_dup(c, a):
            take(c, a)
            structure_added += 1

    # Surplus from structure underflow goes to features.
    feature_budget += max(0, structure_budget - structure_added)

    # Add feature contours.
    feature_added = 0
    for c, a in features:
        if feature_added >= feature_budget:
            break
        if not is_dup(c, a):
            take(c, a)
            feature_added += 1

    # Surplus from feature underflow goes back to structure.
    extra_structure = max(0, feature_budget - feature_added)
    if extra_structure > 0 and structure_added < len(structure):
        for c, a in structure[structure_added:]:
            if extra_structure <= 0:
                break
            if not is_dup(c, a):
                take(c, a)
                extra_structure -= 1

    return [c for c, _ in merged]

