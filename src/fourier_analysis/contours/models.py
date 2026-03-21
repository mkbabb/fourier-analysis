"""Shared contour models and defaults."""

from __future__ import annotations

from dataclasses import dataclass, field, fields, replace
from enum import Enum
from typing import Any

import numpy as np
from numpy.typing import NDArray


def _enum_value(value: Enum | str) -> str:
    return value.value if isinstance(value, Enum) else value


class ContourStrategy(Enum):
    """Strategy for contour extraction."""

    THRESHOLD = "threshold"
    ADAPTIVE_THRESHOLD = "adaptive_threshold"
    MULTI_THRESHOLD = "multi_threshold"
    CANNY = "canny"
    EDGE_AWARE = "edge_aware"
    ML = "ml"
    AUTO = "auto"


class AlphaMode(Enum):
    """How AUTO and explicit strategies should treat alpha masks."""

    AUTO = "auto"
    IGNORE = "ignore"
    PREFER = "prefer"
    ONLY = "only"


# ---------------------------------------------------------------------------
# Strategy-specific configuration groups
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class CannyConfig:
    """Parameters for Canny/edge-based extraction (CANNY, EDGE_AWARE strategies).

    Also used internally by the AUTO pipeline for mask generation.
    """

    sigma: float = 1.5
    """Gaussian sigma for the Canny edge detector."""

    low: float | None = None
    """Low hysteresis threshold (None = auto)."""

    high: float | None = None
    """High hysteresis threshold (None = auto)."""

    closing_radius: int = 1
    """Morphological closing disk radius for edge mask cleanup."""

    def normalized(self) -> CannyConfig:
        return CannyConfig(
            sigma=max(0.0, float(self.sigma)),
            low=None if self.low is None else max(0.0, float(self.low)),
            high=None if self.high is None else max(0.0, float(self.high)),
            closing_radius=max(1, int(self.closing_radius)),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "sigma": self.sigma,
            "low": self.low,
            "high": self.high,
            "closing_radius": self.closing_radius,
        }


@dataclass(frozen=True)
class ThresholdConfig:
    """Parameters for threshold-based strategies (MULTI_THRESHOLD)."""

    n_classes: int = 3
    """Number of Otsu classes for multi-threshold segmentation."""

    def normalized(self) -> ThresholdConfig:
        return ThresholdConfig(n_classes=max(2, int(self.n_classes)))

    def to_dict(self) -> dict[str, Any]:
        return {"n_classes": self.n_classes}


@dataclass(frozen=True)
class MLConfig:
    """Parameters for ML-based subject isolation (U²-Net saliency).

    Used by the ML strategy and the AUTO pipeline's isolation stage.
    """

    threshold: float = 0.5
    """Primary saliency cutoff — pixels above this form the subject mask."""

    detail_threshold: float = 0.3
    """Lower cutoff capturing peripheral detail in nested saliency masks."""

    def normalized(self) -> MLConfig:
        return MLConfig(
            threshold=max(0.0, min(1.0, float(self.threshold))),
            detail_threshold=max(0.0, min(1.0, float(self.detail_threshold))),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "threshold": self.threshold,
            "detail_threshold": self.detail_threshold,
        }


@dataclass(frozen=True)
class FeatureConfig:
    """Parameters for the AUTO pipeline's edge-feature extraction stage.

    Controls how the density field is built and how feature contours
    are selected — only meaningful when strategy=AUTO.
    """

    density_sigma: float = 1.0
    """Gaussian sigma applied to the Canny edge density field.
    Lower values preserve finer edges (eyelids, lip lines)."""

    spatial_diversity_fraction: float = 0.02
    """Minimum spacing between picked features as a fraction of
    the image diagonal (0.02 = 2%).  Prevents near-duplicate features
    while allowing clustered facial geometry."""

    edge_model: str = "auto"
    """Edge detector backend: 'auto' (use PiDiNet if cached),
    'pidinet' (require learned edges), or 'canny' (classic only)."""

    def normalized(self) -> FeatureConfig:
        edge_model = self.edge_model if self.edge_model in ("auto", "pidinet", "canny") else "auto"
        return FeatureConfig(
            density_sigma=max(0.1, float(self.density_sigma)),
            spatial_diversity_fraction=max(0.0, min(0.2, float(self.spatial_diversity_fraction))),
            edge_model=edge_model,
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "density_sigma": self.density_sigma,
            "spatial_diversity_fraction": self.spatial_diversity_fraction,
            "edge_model": self.edge_model,
        }


# ---------------------------------------------------------------------------
# Main configuration
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class ContourConfig:
    """Canonical contour configuration shared across all surfaces.

    Core fields apply to every strategy.  Strategy-specific parameters
    live in nested config objects (canny, threshold, ml, feature) so
    each group is self-documenting and independently extensible.
    """

    # ── Routing ───────────────────────────────────────────────────────
    strategy: ContourStrategy | str = ContourStrategy.AUTO
    """Which extraction pipeline to run."""

    alpha_mode: AlphaMode | str = AlphaMode.AUTO
    """How to handle the image's alpha channel (if present)."""

    tour_method: str = "nearest_2opt"
    """Algorithm for ordering contours into a continuous path."""

    # ── Preprocessing ─────────────────────────────────────────────────
    resize: int | None = 1024
    """Resize longest image dimension before extraction (None = no resize)."""

    blur_sigma: float = 0.5
    """Gaussian pre-blur sigma applied to the grayscale image."""

    contrast_enhance: bool = True
    """Apply CLAHE contrast enhancement to the edge-detection path."""

    # ── Postprocessing (all strategies) ───────────────────────────────
    min_contour_length: int = 40
    """Discard contours with fewer than this many points."""

    min_contour_area: float = 0.001
    """Minimum contour area as a fraction of total image area."""

    max_contours: int | None = 24
    """Maximum number of contours to keep (None = unlimited)."""

    smooth_contours: float = 0.03
    """Savitzky-Golay smoothing window as a fraction of contour length."""

    # ── Strategy-specific groups ──────────────────────────────────────
    canny: CannyConfig = field(default_factory=CannyConfig)
    """Canny/edge detection parameters (CANNY, EDGE_AWARE strategies)."""

    threshold: ThresholdConfig = field(default_factory=ThresholdConfig)
    """Multi-threshold segmentation parameters."""

    ml: MLConfig = field(default_factory=MLConfig)
    """ML saliency model parameters (ML strategy, AUTO isolation)."""

    feature: FeatureConfig = field(default_factory=FeatureConfig)
    """Feature contour extraction parameters (AUTO pipeline only)."""

    def normalized(self) -> ContourConfig:
        """Return a copy with all fields validated and coerced."""
        strategy = self.strategy
        if isinstance(strategy, str):
            strategy = ContourStrategy(strategy.lower())

        alpha_mode = self.alpha_mode
        if isinstance(alpha_mode, str):
            alpha_mode = AlphaMode(alpha_mode.lower())

        resize = None
        if self.resize is not None:
            resize_int = int(self.resize)
            if resize_int > 0:
                resize = max(32, resize_int)

        max_contours = self.max_contours
        if max_contours is not None:
            max_contours = max(0, int(max_contours)) or None

        return ContourConfig(
            strategy=strategy,
            alpha_mode=alpha_mode,
            tour_method=self.tour_method,
            resize=resize,
            blur_sigma=max(0.0, float(self.blur_sigma)),
            contrast_enhance=bool(self.contrast_enhance),
            min_contour_length=max(3, int(self.min_contour_length)),
            min_contour_area=max(0.0, min(1.0, float(self.min_contour_area))),
            max_contours=max_contours,
            smooth_contours=max(0.0, min(1.0, float(self.smooth_contours))),
            canny=self.canny.normalized(),
            threshold=self.threshold.normalized(),
            ml=self.ml.normalized(),
            feature=self.feature.normalized(),
        )

    def to_dict(self) -> dict[str, Any]:
        """Serialize to a flat JSON-friendly dict (backward-compatible keys)."""
        return {
            "strategy": _enum_value(self.strategy),
            "resize": self.resize,
            "blur_sigma": self.blur_sigma,
            "contrast_enhance": self.contrast_enhance,
            "alpha_mode": _enum_value(self.alpha_mode),
            "tour_method": self.tour_method,
            "min_contour_length": self.min_contour_length,
            "min_contour_area": self.min_contour_area,
            "max_contours": self.max_contours,
            "smooth_contours": self.smooth_contours,
            # Canny
            "canny_sigma": self.canny.sigma,
            "closing_radius": self.canny.closing_radius,
            "canny_low": self.canny.low,
            "canny_high": self.canny.high,
            # Threshold
            "n_classes": self.threshold.n_classes,
            # ML
            "ml_threshold": self.ml.threshold,
            "ml_detail_threshold": self.ml.detail_threshold,
            # Feature
            "feature_density_sigma": self.feature.density_sigma,
            "spatial_diversity_fraction": self.feature.spatial_diversity_fraction,
            "edge_model": self.feature.edge_model,
        }

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> ContourConfig:
        """Construct from a flat dict (inverse of to_dict).

        Accepts both nested keys (canny.sigma) and legacy flat keys
        (canny_sigma) for backward compatibility with the API layer.
        """
        return cls(
            strategy=d.get("strategy", ContourStrategy.AUTO),
            resize=d.get("resize", 1024),
            blur_sigma=d.get("blur_sigma", 0.5),
            contrast_enhance=d.get("contrast_enhance", True),
            alpha_mode=d.get("alpha_mode", AlphaMode.AUTO),
            tour_method=d.get("tour_method", "nearest_2opt"),
            min_contour_length=d.get("min_contour_length", 40),
            min_contour_area=d.get("min_contour_area", 0.001),
            max_contours=d.get("max_contours", 24),
            smooth_contours=d.get("smooth_contours", 0.03),
            canny=CannyConfig(
                sigma=d.get("canny_sigma", 1.5),
                low=d.get("canny_low"),
                high=d.get("canny_high"),
                closing_radius=d.get("closing_radius", 1),
            ),
            threshold=ThresholdConfig(
                n_classes=d.get("n_classes", 3),
            ),
            ml=MLConfig(
                threshold=d.get("ml_threshold", 0.5),
                detail_threshold=d.get("ml_detail_threshold", 0.3),
            ),
            feature=FeatureConfig(
                density_sigma=d.get("feature_density_sigma", 1.0),
                spatial_diversity_fraction=d.get("spatial_diversity_fraction", 0.02),
                edge_model=d.get("edge_model", "auto"),
            ),
        ).normalized()


DEFAULT_CONTOUR_CONFIG = ContourConfig().normalized()


@dataclass(frozen=True)
class ContourCandidateDiagnostics:
    """Diagnostics for one candidate extraction path."""

    candidate: str
    strategy: str
    used_alpha: bool
    contour_count: int
    total_points: int
    retained_area_fraction: float
    secondary_area_fraction: float
    primary_span_fraction: float
    weighted_compactness: float
    max_jump: float
    mean_jump: float
    score: float
    pruned_large_jump: bool = False

    def to_dict(self) -> dict[str, Any]:
        return {
            "candidate": self.candidate,
            "strategy": self.strategy,
            "used_alpha": self.used_alpha,
            "contour_count": self.contour_count,
            "total_points": self.total_points,
            "retained_area_fraction": self.retained_area_fraction,
            "secondary_area_fraction": self.secondary_area_fraction,
            "primary_span_fraction": self.primary_span_fraction,
            "weighted_compactness": self.weighted_compactness,
            "max_jump": self.max_jump,
            "mean_jump": self.mean_jump,
            "score": self.score,
            "pruned_large_jump": self.pruned_large_jump,
        }


@dataclass(frozen=True)
class ContourDiagnostics:
    """Extraction-level diagnostics for the selected contour set."""

    requested_strategy: str
    selected_strategy: str
    selected_candidate: str
    alpha_mode: str
    used_alpha: bool
    contour_count: int
    total_points: int
    retained_area_fraction: float
    secondary_area_fraction: float
    primary_span_fraction: float
    max_jump: float
    mean_jump: float
    score: float
    notes: tuple[str, ...]
    candidates: tuple[ContourCandidateDiagnostics, ...]

    def to_dict(self) -> dict[str, Any]:
        return {
            "requested_strategy": self.requested_strategy,
            "selected_strategy": self.selected_strategy,
            "selected_candidate": self.selected_candidate,
            "alpha_mode": self.alpha_mode,
            "used_alpha": self.used_alpha,
            "contour_count": self.contour_count,
            "total_points": self.total_points,
            "retained_area_fraction": self.retained_area_fraction,
            "secondary_area_fraction": self.secondary_area_fraction,
            "primary_span_fraction": self.primary_span_fraction,
            "max_jump": self.max_jump,
            "mean_jump": self.mean_jump,
            "score": self.score,
            "notes": list(self.notes),
            "candidates": [candidate.to_dict() for candidate in self.candidates],
        }


@dataclass
class ContourExtractionResult:
    """Selected contour set plus diagnostics and ordered path."""

    config: ContourConfig
    contours: list[NDArray[np.complex128]]
    ordered_path: NDArray[np.complex128]
    diagnostics: ContourDiagnostics
