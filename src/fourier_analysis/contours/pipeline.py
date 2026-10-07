"""The AUTO pipeline: the subject's drawing, walked as one stroke graph.

Image -> subject mask -> silhouette + part boundaries + learned lines ->
minimum-retrace tour

1. The drawing (``drawing.draw_subject``): the subject mask's silhouette, the
   face parser's part boundaries, and the persistent learned line drawing,
   composed in that priority order into one stroke graph.
2. The tour (``shortest_tour.build_contour_tour``): a Chinese-postman walk.

``config.max_contours`` does not cut strokes here: dropping an edge of the
stroke graph drops a line (an eye, a lip line); the drawing is bounded by its
ink budget instead (``drawing.INK_BUDGET_DIAGONALS``).
"""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from fourier_analysis.contours.geometry import _polygon_area
from fourier_analysis.contours.image import LoadedImage
from fourier_analysis.contours.drawing import draw_subject
from fourier_analysis.contours.models import (
    ContourConfig,
    ContourDiagnostics,
    ContourExtractionResult,
)
from fourier_analysis.shortest_tour import build_contour_tour


def extract_contours_pipeline(
    image: LoadedImage,
    config: ContourConfig,
) -> ContourExtractionResult:
    """Run the drawing pipeline (module docstring)."""
    drawing = draw_subject(image, config)
    contours = drawing.strokes if drawing is not None else []
    if drawing is None or not contours:
        return _empty_result(config)

    tour = build_contour_tour(contours, method=config.tour_method)

    areas = [_polygon_area(c) for c in contours]
    total_area = sum(areas)
    gap_lengths = np.array(tour.gap_lengths, dtype=np.float64)
    notes = [
        f"parts={drawing.source}",
        f"faces={len(drawing.faces)}",
        f"retrace_px={tour.retrace_length:.0f}",
    ]
    diagnostics = ContourDiagnostics(
        requested_strategy="auto",
        selected_strategy="auto",
        selected_candidate=drawing.source,
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
