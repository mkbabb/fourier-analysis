"""The AUTO pipeline: semantic part boundaries, walked as one stroke graph.

Image -> subject mask -> part labels -> part boundaries -> minimum-retrace tour

1. The subject mask (``isolation.subject_mask``: the saliency ensemble, grown
   by hysteresis, alpha-intersected, significant components).
2. Part labels (``parts.part_labels``): a face parser's 19 classes where the
   subject has a face, colour parts elsewhere; off the mask is background.
3. The boundaries between parts (``strokes.boundary_strokes``): one stroke per
   shared boundary, meeting at junctions.
4. The tour (``shortest_tour.build_contour_tour``): a Chinese-postman walk.

``config.max_contours`` does not cut strokes here: dropping an edge of the
stroke graph drops a part boundary (an eye, a lip line).  The number of parts
is bounded instead (``parts.MAX_COLOUR_PARTS``; the parser's 19 classes).
"""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from fourier_analysis.contours.geometry import _polygon_area
from fourier_analysis.contours.image import LoadedImage
from fourier_analysis.contours.isolation import subject_mask
from fourier_analysis.contours.models import (
    ContourConfig,
    ContourDiagnostics,
    ContourExtractionResult,
)
from fourier_analysis.contours.parts import part_labels
from fourier_analysis.contours.strokes import boundary_strokes
from fourier_analysis.shortest_tour import build_contour_tour


def extract_contours_pipeline(
    image: LoadedImage,
    config: ContourConfig,
) -> ContourExtractionResult:
    """Run the part-boundary pipeline (module docstring)."""
    mask, _ = subject_mask(image, config)
    if not mask.any():
        return _empty_result(config)
    parts = part_labels(image, mask)
    contours = boundary_strokes(parts.labels, parts.drawn)
    if not contours:
        return _empty_result(config)

    tour = build_contour_tour(contours, method=config.tour_method)

    areas = [_polygon_area(c) for c in contours]
    total_area = sum(areas)
    gap_lengths = np.array(tour.gap_lengths, dtype=np.float64)
    notes = [
        f"parts={parts.source}",
        f"faces={len(parts.faces)}",
        f"retrace_px={tour.retrace_length:.0f}",
    ]
    diagnostics = ContourDiagnostics(
        requested_strategy="auto",
        selected_strategy="auto",
        selected_candidate=parts.source,
        alpha_mode="auto",
        used_alpha=False,
        contour_count=len(contours),
        total_points=sum(len(c) for c in contours),
        retained_area_fraction=min(1.0, total_area / image.image_area) if image.image_area > 0 else 0.0,
        secondary_area_fraction=(
            sum(areas[1:]) / total_area if total_area > 0 and len(areas) > 1 else 0.0
        ),
        primary_span_fraction=_primary_span_fraction(contours, image),
        max_jump=float(gap_lengths.max()) if gap_lengths.size else 0.0,
        mean_jump=float(gap_lengths.mean()) if gap_lengths.size else 0.0,
        score=0.0,
        notes=tuple(notes),
        candidates=(),
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
    """Fraction of the image spanned (min of the x/y spans) by the largest
    connected figure of the stroke graph: strokes meet at junctions, so the
    figure, not any one stroke between two junctions, is what spans the
    subject."""
    from fourier_analysis.shortest_tour import _StrokeGraph

    g = _StrokeGraph.from_strokes(contours)
    if not g.edges:
        return 0.0
    comp = g.components()
    h, w = image.grayscale.shape
    best = 0.0
    for c in set(comp.tolist()) - {-1}:
        pts = np.concatenate([e.poly for e in g.edges if comp[e.u] == c])
        x_span = float(pts.real.max() - pts.real.min()) / max(1.0, w)
        y_span = float(pts.imag.max() - pts.imag.min()) / max(1.0, h)
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
