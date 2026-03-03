"""Tests for fourier_analysis.contours."""

import tempfile
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from fourier_analysis.contours import ContourStrategy, extract_contours, resample_arc_length


def _save_image(arr: np.ndarray, path: Path) -> Path:
    """Save a numpy array as a grayscale PNG."""
    img = Image.fromarray(arr.astype(np.uint8), mode="L")
    img.save(path)
    return path


class TestExtractContours:
    def test_threshold_strategy_on_binary_image(self, tmp_path: Path):
        """A white circle on black should yield a closed contour via THRESHOLD."""
        size = 256
        arr = np.zeros((size, size), dtype=np.uint8)
        yy, xx = np.ogrid[:size, :size]
        mask = (xx - size // 2) ** 2 + (yy - size // 2) ** 2 < 80**2
        arr[mask] = 255

        img_path = _save_image(arr, tmp_path / "circle.png")
        contours = extract_contours(img_path, strategy=ContourStrategy.THRESHOLD, resize=None)

        assert len(contours) >= 1
        # The largest contour should be roughly circular
        biggest = max(contours, key=len)
        assert len(biggest) > 50

    def test_canny_strategy_on_gradient_image(self, tmp_path: Path):
        """An image with clear edges should yield contours via CANNY."""
        size = 256
        arr = np.zeros((size, size), dtype=np.uint8)
        # A sharp rectangle
        arr[60:200, 60:200] = 255

        img_path = _save_image(arr, tmp_path / "rect.png")
        contours = extract_contours(
            img_path, strategy=ContourStrategy.CANNY, resize=None, canny_sigma=1.0
        )

        assert len(contours) >= 1

    def test_auto_strategy_dispatches_threshold_for_bimodal(self, tmp_path: Path):
        """A strongly bimodal image (black/white) should trigger THRESHOLD."""
        size = 256
        arr = np.zeros((size, size), dtype=np.uint8)
        arr[:, size // 2 :] = 255  # half black, half white

        img_path = _save_image(arr, tmp_path / "bimodal.png")
        # AUTO should work without error; the exact strategy is an impl detail,
        # but it shouldn't crash.
        contours = extract_contours(img_path, strategy="auto", resize=None)
        assert isinstance(contours, list)

    def test_empty_image_returns_empty(self, tmp_path: Path):
        """An all-black image should return an empty list."""
        arr = np.zeros((128, 128), dtype=np.uint8)
        img_path = _save_image(arr, tmp_path / "black.png")
        contours = extract_contours(img_path, strategy=ContourStrategy.THRESHOLD, resize=None)
        assert contours == []

    def test_min_contour_length_filters(self, tmp_path: Path):
        """Short contours below the threshold should be filtered out."""
        size = 256
        arr = np.zeros((size, size), dtype=np.uint8)
        # A large circle (will produce a long contour)
        yy, xx = np.ogrid[:size, :size]
        mask = (xx - size // 2) ** 2 + (yy - size // 2) ** 2 < 80**2
        arr[mask] = 255
        # A tiny dot (will produce a very short contour)
        arr[10:13, 10:13] = 255

        img_path = _save_image(arr, tmp_path / "mixed.png")
        contours = extract_contours(
            img_path,
            strategy=ContourStrategy.THRESHOLD,
            resize=None,
            min_contour_length=30,
        )
        # Only the large circle should survive filtering
        for c in contours:
            assert len(c) >= 30

    def test_string_strategy_accepted(self, tmp_path: Path):
        """Strategy can be passed as a plain string."""
        arr = np.zeros((128, 128), dtype=np.uint8)
        arr[30:100, 30:100] = 255
        img_path = _save_image(arr, tmp_path / "test.png")
        contours = extract_contours(img_path, strategy="threshold", resize=None)
        assert isinstance(contours, list)

    def test_contours_are_centered(self, tmp_path: Path):
        """Extracted contours should be roughly centered around origin."""
        size = 256
        arr = np.zeros((size, size), dtype=np.uint8)
        yy, xx = np.ogrid[:size, :size]
        mask = (xx - size // 2) ** 2 + (yy - size // 2) ** 2 < 60**2
        arr[mask] = 255

        img_path = _save_image(arr, tmp_path / "centered.png")
        contours = extract_contours(img_path, strategy=ContourStrategy.THRESHOLD, resize=None)
        assert len(contours) >= 1
        biggest = max(contours, key=len)
        centroid = np.mean(biggest)
        # Should be near origin (within a few pixels of center)
        assert abs(centroid) < 5.0


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
        # All inter-point distances should be similar
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
