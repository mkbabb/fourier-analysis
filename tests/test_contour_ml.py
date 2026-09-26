"""Tests for fourier_analysis.contour_ml."""

from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from fourier_analysis.contours import ContourStrategy, ContourConfig, MLConfig


def _save_image(arr: np.ndarray, path: Path) -> Path:
    """Save a numpy array as a grayscale PNG."""
    img = Image.fromarray(arr.astype(np.uint8), mode="L")
    img.save(path)
    return path


class TestContourML:
    def test_ml_enum_exists(self):
        """ContourStrategy.ML should be a valid enum member."""
        assert ContourStrategy.ML.value == "ml"

    def test_config_ml_fields(self):
        """ContourConfig.ml should have threshold and detail_threshold."""
        config = ContourConfig()
        assert config.ml.threshold == 0.5
        assert config.ml.detail_threshold == 0.3

    def test_config_normalized_clamps_ml(self):
        """Normalized config should clamp ML thresholds to [0, 1]."""
        config = ContourConfig(ml=MLConfig(threshold=1.5, detail_threshold=-0.1))
        normed = config.normalized()
        assert normed.ml.threshold == 1.0
        assert normed.ml.detail_threshold == 0.0

    def test_explicit_ml_strategy_import(self):
        """ML strategy should be dispatchable."""
        from fourier_analysis.contours.extraction import _select_explicit_candidate
        assert ContourStrategy.ML.value == "ml"

    def test_auto_uses_ml_isolation(self, tmp_path: Path):
        """AUTO pipeline should use ML for subject isolation."""
        from fourier_analysis.contours import extract_contours_result

        size = 128
        arr = np.zeros((size, size), dtype=np.uint8)
        arr[30:100, 30:100] = 200
        img_path = _save_image(arr, tmp_path / "test.png")

        result = extract_contours_result(img_path, ContourConfig(strategy="auto", resize=None))
        assert isinstance(result.contours, list)
        assert result.diagnostics.selected_candidate in ("face-parsing", "colour-parts")

    def test_ml_masks_returns_multiple_thresholds(self, tmp_path: Path):
        """ml_masks should return multiple nested masks at different thresholds."""
        from fourier_analysis.contours.image import load_image_inputs
        from fourier_analysis.contours.ml import ml_masks

        portraits = Path(__file__).resolve().parents[1] / "assets" / "portraits"
        img_path = portraits / "joseph-fourier.png"
        if not img_path.exists():
            pytest.skip("Portrait assets not available")

        config = ContourConfig().normalized()
        image = load_image_inputs(img_path, config)
        masks = ml_masks(image, config)

        assert len(masks) >= 2, "ML should produce multiple iso-probability masks"
        for i in range(1, len(masks)):
            broader = np.count_nonzero(masks[i - 1])
            tighter = np.count_nonzero(masks[i])
            assert broader >= tighter


class TestSubjectModelSpec:
    """Each subject model is fed exactly the preprocessing it was trained with."""

    @pytest.fixture(scope="class")
    def euler(self):
        from fourier_analysis.contours.image import load_image_inputs

        path = Path(__file__).resolve().parents[1] / "assets" / "portraits" / "euler.jpg"
        if not path.exists():
            pytest.skip("Portrait assets not available")
        return load_image_inputs(path, ContourConfig().normalized())

    def test_specs_are_pinned(self):
        from fourier_analysis.contours.ml import SUBJECT_MODELS

        assert SUBJECT_MODELS
        for spec in SUBJECT_MODELS:
            assert len(spec.sha256) == 64
            assert spec.url.startswith("https://")

    def test_input_tensor_is_imagenet_normalised(self, euler):
        from fourier_analysis.contours.ml import SUBJECT_MODELS, _source_rgb, model_input

        rgb = _source_rgb(euler)
        for spec in SUBJECT_MODELS:
            x = model_input(spec, rgb)
            assert x.shape == (1, 3, spec.input_size, spec.input_size)
            assert x.dtype == np.float32
            mean = x[0].mean(axis=(1, 2))
            std = x[0].std(axis=(1, 2))
            # Not raw [0, 1] pixels (the pre-spec bug): centred, unit-scale channels.
            assert np.all(np.abs(mean) < 1.5), mean
            assert np.all((std > 0.5) & (std < 1.6)), std
            # Exactly x/max then ImageNet mean/std: undoing it gives pixels in [0, 1], max 1.
            pixels = x[0] * np.asarray(spec.std)[:, None, None] + np.asarray(spec.mean)[:, None, None]
            assert pixels.min() >= -1e-5
            assert pixels.max() == pytest.approx(1.0, abs=1e-5)

    def test_output_is_rescaled_to_unit_range(self):
        from fourier_analysis.contours.ml import SUBJECT_MODELS, model_output

        raw = np.linspace(-6.0, 4.0, 64).reshape(1, 1, 8, 8)
        for spec in SUBJECT_MODELS:
            out = model_output(spec, raw)
            assert out.shape == (8, 8)
            assert out.min() == pytest.approx(0.0)
            assert out.max() == pytest.approx(1.0)

    def test_probability_map_range(self, euler):
        from fourier_analysis.contours.ml import _predict_probability_map

        prob = _predict_probability_map(euler)
        assert prob.shape == euler.grayscale.shape
        assert prob.min() >= 0.0 and prob.max() <= 1.0
        assert prob.max() > 0.9  # a portrait has a confident subject


class TestHysteresis:
    def test_most_salient_component_is_kept(self):
        from fourier_analysis.contours.isolation import hysteresis_subject_mask

        sal = np.zeros((100, 100))
        sal[10:60, 10:60] = 0.95  # the subject
        sal[70:90, 70:90] = 0.6  # a distractor that never reaches the seed level
        sal[10:60, 60:65] = 0.55  # a weaker rim attached to the subject grows in
        mask = hysteresis_subject_mask(sal, grow_threshold=0.5)
        assert mask[30, 30] and mask[30, 62]
        assert not mask[80, 80]

    def test_small_subject_is_never_disabled(self):
        from fourier_analysis.contours.isolation import hysteresis_subject_mask

        sal = np.full((200, 200), 0.05)
        sal[90:110, 90:110] = 0.9  # 1% coverage: the old coverage<0.12 rule disabled this
        mask = hysteresis_subject_mask(sal, grow_threshold=0.5)
        assert mask.sum() == 400

    def test_faint_subject_seeds_at_its_peak(self):
        from fourier_analysis.contours.isolation import hysteresis_subject_mask

        sal = np.full((50, 50), 0.1)
        sal[20:30, 20:30] = 0.6  # never reaches the seed level
        mask = hysteresis_subject_mask(sal, grow_threshold=0.5)
        assert mask[25, 25] and not mask[0, 0]

    def test_isolation_mask_is_never_none(self, tmp_path: Path):
        from fourier_analysis.contours.image import load_image_inputs
        from fourier_analysis.contours.isolation import isolate_subject

        arr = np.full((128, 128), 20, dtype=np.uint8)
        arr[56:72, 56:72] = 230  # a small subject
        config = ContourConfig(resize=None).normalized()
        image = load_image_inputs(_save_image(arr, tmp_path / "small.png"), config)
        iso = isolate_subject(image, config)
        assert iso.subject_mask is not None
        assert 0 < iso.subject_mask.mean() < 1
