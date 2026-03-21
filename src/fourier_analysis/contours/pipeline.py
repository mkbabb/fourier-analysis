"""Stage 5: Orchestrator tying isolation, structure, features, and assembly together."""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from skimage import feature as skfeature

from fourier_analysis.contours.assembly import assemble_contours
from fourier_analysis.contours.features import extract_feature_contours
from fourier_analysis.contours.geometry import _polygon_area
from fourier_analysis.contours.image import LoadedImage, load_image_inputs
from fourier_analysis.contours.isolation import SubjectIsolation, isolate_subject
from fourier_analysis.contours.models import (
    ContourConfig,
    ContourDiagnostics,
    ContourExtractionResult,
)
from fourier_analysis.contours.structure import extract_structure_contours
from fourier_analysis.shortest_tour import build_contour_tour


def _compute_structure_fraction(
    image: LoadedImage,
    isolation: SubjectIsolation,
) -> float:
    """Determine structure/feature budget split based on edge density within subject.

    High edge density (faces, detailed subjects) → more feature budget.
    Low edge density (simple shapes) → more structure budget.
    """
    subject_edges = skfeature.canny(image.detail_grayscale, sigma=0.8)
    if isolation.subject_mask is not None and np.any(isolation.subject_mask):
        edge_density = float(np.mean(subject_edges[isolation.subject_mask]))
    else:
        edge_density = float(np.mean(subject_edges))

    if edge_density > 0.08:
        return 0.15  # Face-like: 15% structure / 85% features
    elif edge_density > 0.04:
        return 0.25  # Moderate detail: 25/75
    else:
        return 0.35  # Simple subjects: 35/65


def extract_contours_pipeline(
    image: LoadedImage,
    config: ContourConfig,
) -> ContourExtractionResult:
    """Run the deterministic 5-stage contour extraction pipeline.

    Image -> Isolate Subject -> Extract Structure -> Extract Features -> Assemble -> Tour
    """
    max_contours = config.max_contours or 24

    # Stage 1: Subject isolation.
    isolation = isolate_subject(image, config)

    # A7: Content-adaptive budget split based on edge density.
    structure_fraction = _compute_structure_fraction(image, isolation)
    structure_budget = max(1, int(max_contours * structure_fraction))
    feature_budget = max(1, max_contours - structure_budget)

    # Stage 2: Structure contours (iso-intensity).
    structure = extract_structure_contours(image, isolation, structure_budget, config)

    # Dynamic reallocation: if structure yields fewer than budgeted,
    # redirect surplus to features (helps uniform-color subjects).
    structure_surplus = structure_budget - len(structure)
    if structure_surplus > 0:
        feature_budget += structure_surplus

    # Stage 3: Feature contours (edge density).
    features = extract_feature_contours(image, isolation, structure, feature_budget, config)

    # Stage 4: Assembly.
    contours = assemble_contours(isolation, structure, features, max_contours, image)

    if not contours:
        return _empty_result(config)

    # Build tour.
    tour = build_contour_tour(contours, method=config.tour_method)

    # Compute diagnostics.
    areas = [_polygon_area(c) for c in contours]
    total_points = sum(len(c) for c in contours)
    total_area = sum(areas)
    retained_area_fraction = min(1.0, total_area / image.image_area) if image.image_area > 0 else 0.0

    gap_lengths = np.array(tour.gap_lengths, dtype=np.float64)
    max_jump = float(gap_lengths.max()) if gap_lengths.size else 0.0
    mean_jump = float(gap_lengths.mean()) if gap_lengths.size else 0.0

    notes: list[str] = []
    if isolation.subject_mask is None:
        notes.append("ML subject isolation coverage below threshold; mask disabled")

    diagnostics = ContourDiagnostics(
        requested_strategy="auto",
        selected_strategy="auto",
        selected_candidate="pipeline",
        alpha_mode="auto",
        used_alpha=False,
        contour_count=len(contours),
        total_points=total_points,
        retained_area_fraction=retained_area_fraction,
        secondary_area_fraction=(
            sum(areas[1:]) / total_area if total_area > 0 and len(areas) > 1 else 0.0
        ),
        primary_span_fraction=_primary_span_fraction(contours, image),
        max_jump=max_jump,
        mean_jump=mean_jump,
        score=0.0,  # No scoring competition.
        notes=tuple(notes),
        candidates=(),  # No per-candidate diagnostics.
    )

    return ContourExtractionResult(
        config=config,
        contours=contours,
        ordered_path=tour.path.copy(),
        diagnostics=diagnostics,
    )


def _primary_span_fraction(
    contours: list[NDArray[np.complex128]],
    image: LoadedImage,
) -> float:
    """Fraction of the image spanned by the largest contour (min of x/y spans)."""
    if not contours:
        return 0.0
    best = 0.0
    for c in contours:
        x_span = float(c.real.max() - c.real.min()) / max(1.0, image.grayscale.shape[1])
        y_span = float(c.imag.max() - c.imag.min()) / max(1.0, image.grayscale.shape[0])
        best = max(best, min(1.0, max(0.0, min(x_span, y_span))))
    return best


def _empty_result(config: ContourConfig) -> ContourExtractionResult:
    """Return an empty extraction result."""
    diagnostics = ContourDiagnostics(
        requested_strategy="auto",
        selected_strategy="none",
        selected_candidate="none",
        alpha_mode="auto",
        used_alpha=False,
        contour_count=0,
        total_points=0,
        retained_area_fraction=0.0,
        secondary_area_fraction=0.0,
        primary_span_fraction=0.0,
        max_jump=0.0,
        mean_jump=0.0,
        score=-1e9,
        notes=("no contours extracted",),
        candidates=(),
    )
    return ContourExtractionResult(
        config=config,
        contours=[],
        ordered_path=np.array([], dtype=np.complex128),
        diagnostics=diagnostics,
    )
