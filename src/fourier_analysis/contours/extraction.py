from __future__ import annotations

from enum import Enum
from pathlib import Path

import numpy as np
from numpy.typing import NDArray

from fourier_analysis.contours.image import LoadedImage, load_image_inputs
from fourier_analysis.contours.models import (
    AlphaMode,
    ContourConfig,
    ContourDiagnostics,
    ContourExtractionResult,
    ContourStrategy,
    DEFAULT_CONTOUR_CONFIG,
)
from fourier_analysis.contours.pipeline import extract_contours_pipeline


def _enum_value(value: Enum | str) -> str:
    return value.value if isinstance(value, Enum) else value


def _select_explicit_candidate(
    image: LoadedImage,
    config: ContourConfig,
) -> ContourExtractionResult:
    """Handle non-AUTO strategies via simple mask-based extraction."""
    from fourier_analysis.contours.masks import (
        adaptive_threshold_masks,
        alpha_masks,
        canny_masks,
        edge_aware_masks,
        multi_threshold_masks,
        threshold_masks,
    )
    from fourier_analysis.contours.ml import ml_masks
    from fourier_analysis.contours.processing import _contours_from_masks, _postprocess_raw_contours
    from fourier_analysis.shortest_tour import build_contour_tour

    if config.alpha_mode == AlphaMode.ONLY:
        if image.alpha is None:
            return _empty_result(config, notes=("alpha_mode=only requested, but the image has no usable alpha mask",))
        masks = alpha_masks(image)
        strategy_name = "alpha"
    elif config.strategy == ContourStrategy.THRESHOLD:
        masks = threshold_masks(image, config, light_foreground=False)
        strategy_name = ContourStrategy.THRESHOLD.value
    elif config.strategy == ContourStrategy.ADAPTIVE_THRESHOLD:
        # Try both dark and light, pick the one with more contours.
        dark = adaptive_threshold_masks(image, config, light_foreground=False)
        light = adaptive_threshold_masks(image, config, light_foreground=True)
        dark_raw = _contours_from_masks(dark)
        light_raw = _contours_from_masks(light)
        masks = dark if len(dark_raw) >= len(light_raw) else light
        strategy_name = ContourStrategy.ADAPTIVE_THRESHOLD.value
    elif config.strategy == ContourStrategy.MULTI_THRESHOLD:
        masks = multi_threshold_masks(image, config)
        strategy_name = ContourStrategy.MULTI_THRESHOLD.value
    elif config.strategy == ContourStrategy.EDGE_AWARE:
        masks = edge_aware_masks(image, config)
        strategy_name = ContourStrategy.EDGE_AWARE.value
    elif config.strategy == ContourStrategy.ML:
        masks = ml_masks(image, config)
        strategy_name = ContourStrategy.ML.value
    else:  # CANNY or fallback
        masks = canny_masks(image, config)
        strategy_name = ContourStrategy.CANNY.value

    raw_contours = _contours_from_masks(masks)
    contours, areas = _postprocess_raw_contours(raw_contours, image, config)

    if not contours:
        return _empty_result(config, strategy=strategy_name)

    tour = build_contour_tour(contours, method=config.tour_method)
    gap_lengths = np.array(tour.gap_lengths, dtype=np.float64)
    total_area = sum(areas)

    diagnostics = ContourDiagnostics(
        requested_strategy=_enum_value(config.strategy),
        selected_strategy=strategy_name,
        selected_candidate=strategy_name,
        alpha_mode=_enum_value(config.alpha_mode),
        used_alpha=(strategy_name == "alpha"),
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
        notes=(),
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
    if not contours:
        return 0.0
    best = 0.0
    for c in contours:
        x_span = float(c.real.max() - c.real.min()) / max(1.0, image.grayscale.shape[1])
        y_span = float(c.imag.max() - c.imag.min()) / max(1.0, image.grayscale.shape[0])
        best = max(best, min(1.0, max(0.0, min(x_span, y_span))))
    return best


def _empty_result(
    config: ContourConfig,
    strategy: str = "none",
    notes: tuple[str, ...] = (),
) -> ContourExtractionResult:
    diagnostics = ContourDiagnostics(
        requested_strategy=_enum_value(config.strategy),
        selected_strategy=strategy,
        selected_candidate="none",
        alpha_mode=_enum_value(config.alpha_mode),
        used_alpha=False,
        contour_count=0,
        total_points=0,
        retained_area_fraction=0.0,
        secondary_area_fraction=0.0,
        primary_span_fraction=0.0,
        max_jump=0.0,
        mean_jump=0.0,
        score=-1e9,
        notes=notes,
        candidates=(),
    )
    return ContourExtractionResult(
        config=config,
        contours=[],
        ordered_path=np.array([], dtype=np.complex128),
        diagnostics=diagnostics,
    )


def extract_contours_result(
    image_path: str | Path,
    config: ContourConfig = DEFAULT_CONTOUR_CONFIG,
) -> ContourExtractionResult:
    """Extract contours from an image, returning the full result with diagnostics."""
    config = config.normalized()
    image = load_image_inputs(image_path, config)

    if config.strategy == ContourStrategy.AUTO and config.alpha_mode != AlphaMode.ONLY:
        return extract_contours_pipeline(image, config)
    else:
        return _select_explicit_candidate(image, config)


def extract_contours(
    image_path: str | Path,
    config: ContourConfig = DEFAULT_CONTOUR_CONFIG,
) -> list[NDArray[np.complex128]]:
    """Extract contours from an image, returning only the contour list."""
    return extract_contours_result(image_path, config).contours
