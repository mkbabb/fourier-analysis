"""Tests for fourier_analysis.contours."""

from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from fourier_analysis.contours import (
    AlphaMode,
    CannyConfig,
    ContourConfig,
    ContourStrategy,
    FeatureConfig,
    extract_contours,
    extract_contours_result,
    resample_arc_length,
)


def _save_image(arr: np.ndarray, path: Path) -> Path:
    """Save a numpy array as a grayscale PNG."""
    img = Image.fromarray(arr.astype(np.uint8), mode="L")
    img.save(path)
    return path


def _save_rgba(arr: np.ndarray, path: Path) -> Path:
    """Save a numpy array as an RGBA PNG."""
    img = Image.fromarray(arr.astype(np.uint8), mode="RGBA")
    img.save(path)
    return path


class TestExtractContours:
    def test_extract_contours_result_returns_diagnostics(self, tmp_path: Path):
        size = 128
        arr = np.zeros((size, size), dtype=np.uint8)
        arr[24:104, 24:104] = 255

        img_path = _save_image(arr, tmp_path / "square.png")
        result = extract_contours_result(img_path, ContourConfig(strategy="threshold", resize=None))

        assert result.contours
        assert result.diagnostics.selected_strategy == "threshold"
        assert result.diagnostics.contour_count >= 1

    def test_threshold_strategy_on_binary_image(self, tmp_path: Path):
        """A white circle on black should yield a closed contour via THRESHOLD."""
        size = 256
        arr = np.zeros((size, size), dtype=np.uint8)
        yy, xx = np.ogrid[:size, :size]
        mask = (xx - size // 2) ** 2 + (yy - size // 2) ** 2 < 80**2
        arr[mask] = 255

        img_path = _save_image(arr, tmp_path / "circle.png")
        contours = extract_contours(img_path, ContourConfig(strategy=ContourStrategy.THRESHOLD, resize=None))

        assert len(contours) >= 1
        biggest = max(contours, key=len)
        assert len(biggest) > 50

    def test_canny_strategy_on_gradient_image(self, tmp_path: Path):
        """An image with clear edges should yield contours via CANNY."""
        size = 256
        arr = np.zeros((size, size), dtype=np.uint8)
        arr[60:200, 60:200] = 255

        img_path = _save_image(arr, tmp_path / "rect.png")
        contours = extract_contours(
            img_path,
            ContourConfig(
                strategy=ContourStrategy.CANNY,
                resize=None,
                canny=CannyConfig(sigma=1.0),
                min_contour_area=0.001,
            ),
        )

        assert len(contours) >= 1

    def test_adaptive_threshold_handles_uneven_lighting(self, tmp_path: Path):
        size = 192
        yy, xx = np.mgrid[:size, :size]
        background = 80 + (xx * 120 / size)
        arr = background.astype(np.uint8)
        arr[40:156, 56:136] = np.clip(arr[40:156, 56:136] - 70, 0, 255)

        img_path = _save_image(arr, tmp_path / "adaptive.png")
        result = extract_contours_result(
            img_path,
            ContourConfig(strategy=ContourStrategy.ADAPTIVE_THRESHOLD, resize=None),
        )

        assert result.contours
        assert result.diagnostics.selected_strategy == "adaptive_threshold"

    def test_auto_strategy_dispatches_threshold_for_bimodal(self, tmp_path: Path):
        """A strongly bimodal image (black/white) should trigger THRESHOLD."""
        size = 256
        arr = np.zeros((size, size), dtype=np.uint8)
        arr[:, size // 2 :] = 255

        img_path = _save_image(arr, tmp_path / "bimodal.png")
        contours = extract_contours(img_path, ContourConfig(strategy="auto", resize=None))
        assert isinstance(contours, list)

    def test_empty_image_returns_empty(self, tmp_path: Path):
        """An all-black image should return an empty list."""
        arr = np.zeros((128, 128), dtype=np.uint8)
        img_path = _save_image(arr, tmp_path / "black.png")
        contours = extract_contours(img_path, ContourConfig(strategy=ContourStrategy.THRESHOLD, resize=None))
        assert contours == []

    def test_min_contour_length_filters(self, tmp_path: Path):
        """Short contours below the threshold should be filtered out."""
        size = 256
        arr = np.zeros((size, size), dtype=np.uint8)
        yy, xx = np.ogrid[:size, :size]
        mask = (xx - size // 2) ** 2 + (yy - size // 2) ** 2 < 80**2
        arr[mask] = 255
        arr[10:13, 10:13] = 255

        img_path = _save_image(arr, tmp_path / "mixed.png")
        contours = extract_contours(
            img_path,
            ContourConfig(strategy=ContourStrategy.THRESHOLD, resize=None, min_contour_length=30),
        )
        for c in contours:
            assert len(c) >= 30

    def test_string_strategy_accepted(self, tmp_path: Path):
        """Strategy can be passed as a plain string."""
        arr = np.zeros((128, 128), dtype=np.uint8)
        arr[30:100, 30:100] = 255
        img_path = _save_image(arr, tmp_path / "test.png")
        contours = extract_contours(img_path, ContourConfig(strategy="threshold", resize=None))
        assert isinstance(contours, list)

    def test_contours_are_centered(self, tmp_path: Path):
        """Extracted contours should be roughly centered around origin."""
        size = 256
        arr = np.zeros((size, size), dtype=np.uint8)
        yy, xx = np.ogrid[:size, :size]
        mask = (xx - size // 2) ** 2 + (yy - size // 2) ** 2 < 60**2
        arr[mask] = 255

        img_path = _save_image(arr, tmp_path / "centered.png")
        contours = extract_contours(img_path, ContourConfig(strategy=ContourStrategy.THRESHOLD, resize=None))
        assert len(contours) >= 1
        biggest = max(contours, key=len)
        centroid = np.mean(biggest)
        assert abs(centroid) < 5.0

    def test_auto_prefers_detail_over_alpha_for_rgba_portrait_like_image(self, tmp_path: Path):
        size = 160
        rgba = np.zeros((size, size, 4), dtype=np.uint8)
        rgba[20:140, 28:132, 3] = 255
        rgba[20:140, 28:132, :3] = 230
        rgba[35:125, 45:115, :3] = 180
        rgba[48:110, 60:100, :3] = 255
        rgba[58:68, 70:80, :3] = 20
        rgba[58:68, 90:100, :3] = 20
        rgba[92:98, 68:102, :3] = 30
        rgba[100:116, 64:106, :3] = 40

        img_path = _save_rgba(rgba, tmp_path / "portrait-like.png")
        result = extract_contours_result(img_path, ContourConfig(resize=None))

        assert result.contours
        assert result.diagnostics.used_alpha is False

    def test_alpha_mode_only_forces_alpha_candidate(self, tmp_path: Path):
        rgba = np.zeros((128, 128, 4), dtype=np.uint8)
        rgba[20:108, 20:108, 3] = 255
        rgba[20:108, 20:108, :3] = 255

        img_path = _save_rgba(rgba, tmp_path / "alpha-only.png")
        result = extract_contours_result(
            img_path,
            ContourConfig(alpha_mode=AlphaMode.ONLY, resize=None),
        )

        assert result.contours
        assert result.diagnostics.used_alpha is True
        assert result.diagnostics.selected_strategy == "alpha"

    def test_auto_prunes_large_inter_contour_jumps(self, tmp_path: Path):
        arr = np.full((192, 192), 255, dtype=np.uint8)
        arr[24:64, 24:64] = 0
        arr[128:168, 128:168] = 0

        img_path = _save_image(arr, tmp_path / "two-islands.png")
        result = extract_contours_result(
            img_path,
            ContourConfig(
                resize=None,
                blur_sigma=0,
                min_contour_area=0,
                max_contours=None,
                alpha_mode="ignore",
            ),
        )

        assert result.diagnostics.max_jump < 200

    def test_joseph_fourier_regression_prefers_detail(self):
        portrait = Path(__file__).resolve().parents[1] / "assets" / "portraits" / "joseph-fourier.png"
        result = extract_contours_result(portrait)

        assert result.contours
        assert result.diagnostics.used_alpha is False
        assert result.diagnostics.total_points > 1500
        assert result.diagnostics.primary_span_fraction > 0.7
        assert result.diagnostics.secondary_area_fraction > 0.05
        assert result.diagnostics.max_jump < 400

    def test_portrait_corpus_keeps_enclosing_boundary_and_internal_detail(self):
        portraits_dir = Path(__file__).resolve().parents[1] / "assets" / "portraits"

        for name in ["joseph-fourier.png", "cauchy.png", "NES-ROB.png"]:
            result = extract_contours_result(portraits_dir / name)

            assert result.contours
            assert result.diagnostics.used_alpha is False
            assert result.diagnostics.primary_span_fraction > 0.7
            assert result.diagnostics.secondary_area_fraction > 0.05

    def test_full_bundled_corpus_stays_bounded_and_connected(self):
        root = Path(__file__).resolve().parents[1] / "assets"
        images = sorted((root / "portraits").glob("*")) + sorted((root / "animals").glob("*"))

        for image_path in images:
            result = extract_contours_result(image_path)

            assert result.contours, image_path.name
            assert 0.05 < result.diagnostics.retained_area_fraction <= 1.0, image_path.name
            assert result.diagnostics.max_jump < 1000, image_path.name
            assert result.diagnostics.total_points > 400, image_path.name

    def test_animal_corpus_preserves_subject_extent_or_internal_structure(self):
        animals_dir = Path(__file__).resolve().parents[1] / "assets" / "animals"

        for name in ["golden-retriever.webp", "giraffe.webp", "llama-1.webp", "sun.png"]:
            result = extract_contours_result(animals_dir / name)

            assert result.contours
            assert (
                result.diagnostics.primary_span_fraction > 0.55
                or result.diagnostics.secondary_area_fraction > 0.15
            )

    def test_euler_portrait_does_not_collapse_to_local_edge_cluster(self):
        portrait = Path(__file__).resolve().parents[1] / "assets" / "portraits" / "euler.jpg"
        result = extract_contours_result(portrait)

        assert result.contours
        assert result.diagnostics.selected_candidate != "canny"
        assert result.diagnostics.primary_span_fraction > 0.45
        assert result.diagnostics.max_jump < 500


class TestEdgeAwareStrategy:
    def test_edge_aware_produces_contours_on_synthetic(self, tmp_path: Path):
        """EDGE_AWARE should extract closed contours from a sharp-edged shape."""
        size = 256
        arr = np.zeros((size, size), dtype=np.uint8)
        arr[50:200, 50:200] = 255

        img_path = _save_image(arr, tmp_path / "square.png")
        result = extract_contours_result(
            img_path, ContourConfig(strategy=ContourStrategy.EDGE_AWARE, resize=None)
        )

        assert result.contours
        assert result.diagnostics.selected_strategy == "edge_aware"
        assert result.diagnostics.contour_count >= 1

    def test_auto_produces_contours_on_synthetic(self, tmp_path: Path):
        """AUTO should produce contours from a simple shape."""
        size = 256
        arr = np.zeros((size, size), dtype=np.uint8)
        yy, xx = np.ogrid[:size, :size]
        mask = (xx - size // 2) ** 2 + (yy - size // 2) ** 2 < 80**2
        arr[mask] = 255

        img_path = _save_image(arr, tmp_path / "circle.png")
        result = extract_contours_result(img_path, ContourConfig(strategy="auto", resize=None))

        assert result.contours
        assert result.diagnostics.contour_count >= 1

    def test_contrast_enhance_false_still_works(self, tmp_path: Path):
        """Disabling contrast enhance should not crash."""
        size = 256
        arr = np.zeros((size, size), dtype=np.uint8)
        arr[50:200, 50:200] = 255

        img_path = _save_image(arr, tmp_path / "square.png")
        result = extract_contours_result(
            img_path,
            ContourConfig(strategy=ContourStrategy.EDGE_AWARE, resize=None, contrast_enhance=False),
        )

        assert result.contours
        assert result.diagnostics.selected_strategy == "edge_aware"

    def test_canny_hysteresis_params_pass_through(self, tmp_path: Path):
        """Custom canny low/high should not crash."""
        size = 256
        arr = np.zeros((size, size), dtype=np.uint8)
        arr[50:200, 50:200] = 255

        img_path = _save_image(arr, tmp_path / "square.png")
        result = extract_contours_result(
            img_path,
            ContourConfig(
                strategy=ContourStrategy.EDGE_AWARE,
                resize=None,
                canny=CannyConfig(low=0.05, high=0.15),
            ),
        )

        assert isinstance(result.contours, list)

    def test_string_edge_aware_accepted(self, tmp_path: Path):
        """Strategy can be passed as the string 'edge_aware'."""
        arr = np.zeros((128, 128), dtype=np.uint8)
        arr[30:100, 30:100] = 255
        img_path = _save_image(arr, tmp_path / "test.png")
        contours = extract_contours(img_path, ContourConfig(strategy="edge_aware", resize=None))
        assert isinstance(contours, list)


class TestResampleArcLength:
    def test_preserves_shape_circle(self):
        """Resampling a circle should keep all points on the circle."""
        t = np.linspace(0, 2 * np.pi, 500, endpoint=False)
        circle = np.exp(1j * t)

        resampled = resample_arc_length(circle, 200)
        radii = np.abs(resampled)
        np.testing.assert_allclose(radii, 1.0, atol=0.02)

    def test_uniform_spacing(self):
        """Output points should be approximately equally spaced."""
        t = np.linspace(0, 2 * np.pi, 500, endpoint=False)
        circle = np.exp(1j * t)

        resampled = resample_arc_length(circle, 200)
        dists = np.abs(np.diff(resampled))
        np.testing.assert_allclose(dists, np.mean(dists), rtol=0.05)

    def test_output_length(self):
        """Output should have exactly n_points points."""
        contour = np.array([0, 1, 1 + 1j, 1j], dtype=np.complex128)
        resampled = resample_arc_length(contour, 50)
        assert len(resampled) == 50

    def test_short_contour_returned(self):
        """A contour with < 2 points should be returned as-is."""
        contour = np.array([1 + 2j], dtype=np.complex128)
        result = resample_arc_length(contour, 100)
        assert len(result) == 1


class TestPipelineRefinements:
    """Tests for Track A contour pipeline improvements."""

    def test_spatial_diversity_allows_clustered_features(self, tmp_path: Path):
        """Two nearby circular features should both be extracted."""
        size = 256
        arr = np.full((size, size), 200, dtype=np.uint8)
        yy, xx = np.ogrid[:size, :size]
        circle1 = (xx - 100) ** 2 + (yy - 128) ** 2 < 20 ** 2
        circle2 = (xx - 150) ** 2 + (yy - 128) ** 2 < 20 ** 2
        arr[circle1] = 30
        arr[circle2] = 30
        arr[40:220, 50:210] = np.minimum(arr[40:220, 50:210], 180)

        img_path = _save_image(arr, tmp_path / "clustered.png")
        result = extract_contours_result(img_path, ContourConfig(strategy="auto", resize=None))

        assert result.contours
        assert result.diagnostics.contour_count >= 2, (
            f"Expected >= 2 contours for clustered features, got {result.diagnostics.contour_count}"
        )

    def test_small_feature_passes_compactness_guard(self, tmp_path: Path):
        """A compact small feature (circle r=15px) should survive min area filtering."""
        size = 256
        arr = np.full((size, size), 200, dtype=np.uint8)
        yy, xx = np.ogrid[:size, :size]
        small_circle = (xx - 128) ** 2 + (yy - 128) ** 2 < 15 ** 2
        arr[small_circle] = 20
        outer = (xx - 128) ** 2 + (yy - 128) ** 2 < 100 ** 2
        arr[~outer] = 240

        img_path = _save_image(arr, tmp_path / "small_feature.png")
        result = extract_contours_result(img_path, ContourConfig(strategy="auto", resize=None))

        assert result.contours
        assert result.diagnostics.contour_count >= 2

    def test_feature_budget_adapts_to_edge_density(self, tmp_path: Path):
        """A high-edge-density image should allocate more budget to features."""
        from fourier_analysis.contours.image import load_image_inputs
        from fourier_analysis.contours.isolation import isolate_subject
        from fourier_analysis.contours.pipeline import _compute_structure_fraction

        size = 256
        arr = np.zeros((size, size), dtype=np.uint8)
        for i in range(0, size, 4):
            arr[i:i+2, :] = 255
        img_path = _save_image(arr, tmp_path / "dense_edges.png")

        config = ContourConfig(resize=None).normalized()
        image = load_image_inputs(img_path, config)
        isolation = isolate_subject(image, config)

        frac = _compute_structure_fraction(image, isolation)
        assert frac <= 0.25, f"Expected <= 0.25 structure fraction for dense edges, got {frac}"

    def test_nested_config_round_trip(self):
        """Nested config fields should survive normalized() and to_dict()."""
        config = ContourConfig(
            feature=FeatureConfig(density_sigma=0.8, spatial_diversity_fraction=0.03, edge_model="canny"),
        ).normalized()

        assert config.feature.density_sigma == 0.8
        assert config.feature.spatial_diversity_fraction == 0.03
        assert config.feature.edge_model == "canny"

        d = config.to_dict()
        assert d["feature_density_sigma"] == 0.8
        assert d["spatial_diversity_fraction"] == 0.03
        assert d["edge_model"] == "canny"

    def test_from_dict_round_trip(self):
        """from_dict should reconstruct config from flat dict."""
        original = ContourConfig(
            strategy="canny",
            resize=512,
            canny=CannyConfig(sigma=2.0, low=0.1),
            feature=FeatureConfig(density_sigma=0.5),
        ).normalized()

        d = original.to_dict()
        restored = ContourConfig.from_dict(d)

        assert restored.strategy == original.strategy
        assert restored.resize == original.resize
        assert restored.canny.sigma == original.canny.sigma
        assert restored.canny.low == original.canny.low
        assert restored.feature.density_sigma == original.feature.density_sigma

    def test_default_max_contours_is_24(self):
        """Default max_contours should now be 24."""
        config = ContourConfig().normalized()
        assert config.max_contours == 24

    def test_default_resize_is_1024(self):
        """Default resize should now be 1024."""
        config = ContourConfig().normalized()
        assert config.resize == 1024
