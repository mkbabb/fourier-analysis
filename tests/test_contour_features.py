"""Subject-local ridge features (F.CT CT-6)."""

from __future__ import annotations

from dataclasses import replace
from pathlib import Path

import numpy as np
import pytest
from scipy import ndimage as ndi

pytest.importorskip("onnxruntime")

from fourier_analysis.contours.extraction import extract_contours_result  # noqa: E402
from fourier_analysis.contours.features import (  # noqa: E402
    extract_feature_contours,
    link_ridges,
    ridge_map,
)
from fourier_analysis.contours.image import load_image_inputs  # noqa: E402
from fourier_analysis.contours.isolation import isolate_subject  # noqa: E402
from fourier_analysis.contours.ml import pidinet_available  # noqa: E402
from fourier_analysis.contours.models import ContourConfig, FeatureConfig  # noqa: E402
from fourier_analysis.contours.support import complex_to_rc, is_closed_trace  # noqa: E402

ASSETS = Path(__file__).resolve().parents[1] / "assets"
PUBLIC = ["portraits/daraksha.jpg", "portraits/cauchy.png", "animals/sponge-happy.JPG"]


class TestLinkRidges:
    def test_a_ring_links_into_one_closed_polyline(self):
        yy, xx = np.mgrid[:80, :80]
        r = np.hypot(yy - 40, xx - 40)
        ring = np.abs(r - 25) < 0.5
        from skimage.morphology import skeletonize

        (line,) = link_ridges(skeletonize(ring), min_points=10)

        assert is_closed_trace(line)
        assert np.all(np.abs(np.hypot(line[:, 0] - 40, line[:, 1] - 40) - 25) < 1.5)

    def test_a_segment_links_into_one_open_polyline_end_to_end(self):
        ridges = np.zeros((20, 60), dtype=bool)
        ridges[10, 5:55] = True

        (line,) = link_ridges(ridges)

        assert not is_closed_trace(line)
        assert len(line) == 50
        assert {line[0, 1], line[-1, 1]} == {5.0, 54.0}

    def test_a_branch_becomes_its_own_polyline(self):
        ridges = np.zeros((40, 60), dtype=bool)
        ridges[20, 5:55] = True
        ridges[5:20, 30] = True

        lines = link_ridges(ridges)

        assert sum(len(l) for l in lines) == ridges.sum()
        assert len(lines) == 2


@pytest.fixture(scope="module", params=PUBLIC)
def isolated(request):
    config = ContourConfig().normalized()
    image = load_image_inputs(ASSETS / request.param, config)
    return request.param, image, isolate_subject(image, config), config


def test_features_are_polylines_on_the_ridge_inside_the_dilated_mask(isolated):
    name, image, isolation, config = isolated
    shape = image.grayscale.shape
    off_ridge = ndi.distance_transform_edt(~ridge_map(image, isolation, config))

    features = extract_feature_contours(image, isolation, [], 24, config)

    assert features, name
    for z, area in features:
        rc = complex_to_rc(z, shape)
        assert len(rc) >= 2
        assert (area > 0) == (abs(z[0] - z[-1]) <= 1e-9)  # closed exactly when it has area
        r = np.clip(np.rint(rc[:, 0]).astype(int), 0, shape[0] - 1)
        c = np.clip(np.rint(rc[:, 1]).astype(int), 0, shape[1] - 1)
        assert isolation.subject_band[r, c].all(), name
        # Within 1 px of the NMS ridge (the nearest-pixel rounding adds up to
        # half a pixel on each axis).
        assert off_ridge[r, c].max() <= 1.0 + np.sqrt(0.5), name


def test_background_does_not_set_the_ridge_scale(isolated):
    name, image, isolation, config = isolated
    ridges = ridge_map(image, isolation, config)
    assert not (ridges & ~isolation.subject_band).any(), name


def test_edge_model_defaults_to_canny_and_a_fallback_is_declared():
    assert ContourConfig().feature.edge_model == "canny"
    assert ContourConfig.from_dict({}).feature.edge_model == "canny"
    if pidinet_available():
        pytest.skip("pinned PiDiNet weights are cached")
    config = replace(ContourConfig(), feature=FeatureConfig(edge_model="auto"))
    result = extract_contours_result(ASSETS / "animals" / "sun.png", config)
    assert any("edge_model=auto" in n for n in result.diagnostics.notes)
