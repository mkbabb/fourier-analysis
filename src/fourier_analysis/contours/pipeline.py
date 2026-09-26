"""Stage 5: Orchestrator tying isolation, structure, features, and assembly together."""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from fourier_analysis.contours.assembly import select_strokes
from fourier_analysis.contours.bridges import CHAIN_GAP_BANDS, chain_strokes, route_connectors
from fourier_analysis.contours.features import extract_feature_contours
from fourier_analysis.contours.geometry import _polygon_area
from fourier_analysis.contours.image import LoadedImage, load_image_inputs
from fourier_analysis.contours.isolation import SubjectIsolation, isolate_subject
from fourier_analysis.contours.models import (
    ContourConfig,
    ContourDiagnostics,
    ContourExtractionResult,
)
from fourier_analysis.contours.support import band_px
from fourier_analysis.contours.structure import extract_structure_contours
from fourier_analysis.shortest_tour import build_contour_tour


def extract_contours_pipeline(
    image: LoadedImage,
    config: ContourConfig,
) -> ContourExtractionResult:
    """Run the deterministic 5-stage contour extraction pipeline.

    Image -> Isolate Subject -> Structure + Feature candidates -> Select -> Tour
    """
    # Stage 1: Subject isolation.
    isolation = isolate_subject(image, config)

    # Stages 2-3: every edge-supported structure run and feature ridge is a
    # candidate (each stage only drops what repeats the silhouette or itself).
    structure = extract_structure_contours(image, isolation, None, config)
    features = extract_feature_contours(image, isolation, [], None, config)

    # Stage 4: greedy marginal-value selection.  The greedy order is the
    # same with or without a ceiling (a ceiling truncates it), so the whole
    # order is taken and the ceiling applied to what is drawn: pen strokes.
    selection = select_strokes(isolation, structure + features, None, image)

    if not selection.contours:
        return _empty_result(config)

    # Stage 4b: strokes whose ends meet are chained into one pen stroke, and
    # long joins follow the subject's edges instead of jumping.  The ceiling
    # counts the contours drawn (chains, and routed joins that are their own
    # stroke): the longest prefix of the greedy order that fits is kept.
    gap = CHAIN_GAP_BANDS * band_px(image.grayscale.shape)
    picks = selection.contours
    ceiling = config.max_contours
    kept = len(picks)
    if ceiling is not None:
        kept = min(kept, max(ceiling, selection.silhouette_count))
        while kept < len(picks) and len(chain_strokes(picks[: kept + 1], gap)) <= ceiling:
            kept += 1
    contours = route_connectors(chain_strokes(picks[:kept], gap), isolation, image)
    while ceiling is not None and len(contours) > ceiling and kept > selection.silhouette_count:
        kept -= 1
        contours = route_connectors(chain_strokes(picks[:kept], gap), isolation, image)
    if ceiling is not None and len(contours) > ceiling:
        contours = chain_strokes(picks[:kept], gap)

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
    note = _edge_model_note(config)
    if note:
        notes.append(note)

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


def _edge_model_note(config: ContourConfig) -> str | None:
    """Say so when a learned edge model was asked for but Canny ridges ran."""
    requested = config.feature.edge_model
    if requested == "canny":
        return None
    from fourier_analysis.contours.ml import pidinet_available

    if pidinet_available():
        return None
    return f"edge_model={requested}: no pinned PiDiNet weights cached; feature ridges used Canny"


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
