"""Structure selected by edge support (F.CT CT-5)."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest

pytest.importorskip("onnxruntime")

from fourier_analysis.contours.image import load_image_inputs  # noqa: E402
from fourier_analysis.contours.isolation import isolate_subject  # noqa: E402
from fourier_analysis.contours.models import ContourConfig  # noqa: E402
from fourier_analysis.contours.structure import extract_structure_contours  # noqa: E402
from fourier_analysis.contours.support import (  # noqa: E402
    RELATIVE_SUPPORT,
    arc_support,
    complex_to_rc,
    normalise_to_subject,
    silhouette_support,
    support_floor,
    supported_runs,
)

ASSETS = Path(__file__).resolve().parents[1] / "assets"
PUBLIC = ["portraits/daraksha.jpg", "portraits/euler.jpg", "animals/llama-2.jpg"]


class TestSupportedRuns:
    def test_a_line_crossing_an_edge_then_a_flat_region_keeps_only_the_edge_span(self):
        field = np.zeros((100, 300))
        field[50, :150] = 2.0  # an edge under the first half of the row
        line = np.column_stack([np.full(300, 50.0), np.arange(300.0)])

        runs = supported_runs(line, field, floor=1.0, min_run_px=20, window_px=5)

        assert len(runs) == 1
        assert runs[0][:, 1].max() <= 150
        assert runs[0][:, 1].min() == 0
        assert arc_support(runs[0], field) >= 1.0

    def test_a_fully_supported_loop_stays_closed(self):
        field = np.ones((64, 64))
        t = np.linspace(0, 2 * np.pi, 200)
        loop = np.column_stack([32 + 20 * np.sin(t), 32 + 20 * np.cos(t)])
        loop[-1] = loop[0]

        (run,) = supported_runs(loop, field, floor=0.5, min_run_px=10)

        assert np.array_equal(run[0], run[-1])

    def test_an_unsupported_trace_vanishes(self):
        field = np.full((64, 64), 0.1)
        line = np.column_stack([np.full(60, 10.0), np.arange(60.0)])
        assert supported_runs(line, field, floor=0.5, min_run_px=10) == []

    def test_the_floor_is_relative_to_the_silhouette(self):
        field = np.zeros((64, 64))
        field[10, :] = 3.0
        sil = (np.arange(60) - 32.0) + 1j * (32.0 - 10.0)  # along row 10
        assert silhouette_support((sil,), field) == pytest.approx(3.0)
        assert support_floor((sil,), field) == pytest.approx(RELATIVE_SUPPORT * 3.0)
        assert support_floor((sil,), 2 * field) == pytest.approx(2 * RELATIVE_SUPPORT * 3.0)


@pytest.fixture(scope="module", params=PUBLIC)
def isolated(request):
    config = ContourConfig().normalized()
    image = load_image_inputs(ASSETS / request.param, config)
    return request.param, image, isolate_subject(image, config), config


def test_no_kept_structure_run_falls_below_the_relative_floor(isolated):
    name, image, isolation, config = isolated
    field = normalise_to_subject(image.color_gradient, isolation.subject_mask)
    floor = support_floor(isolation.silhouettes, field)
    shape = image.grayscale.shape

    runs = extract_structure_contours(image, isolation, 24, config)

    for z, _ in runs:
        assert arc_support(complex_to_rc(z, shape), field) >= floor, name



def _disc_scene(fringe_px: float, seed: int = 7):
    """A dark disc (radius 150, a soft 2 px rim) on a light ground, 512 px
    square, its rim jittered per pixel by ``fringe_px`` (hair-like texture along the
    boundary); the subject is the disc grown by 40 px, no silhouette drawn."""
    from scipy import ndimage as ndi

    from fourier_analysis.contours.image import LoadedImage
    from fourier_analysis.contours.isolation import SubjectIsolation
    from fourier_analysis.contours.support import subject_band

    h = w = 512
    yy, xx = np.mgrid[:h, :w]
    r = np.hypot(yy - h / 2, xx - w / 2)
    jitter = np.random.default_rng(seed).normal(0.0, fringe_px, (h, w)) if fringe_px else 0.0
    # A soft edge (a photograph's rim is a few px wide), then hard hairs.
    grey = 0.2 + 0.6 / (1.0 + np.exp(-(r - 150.0 - jitter) / 2.0))
    image = LoadedImage(
        grayscale=grey,
        detail_grayscale=grey,
        edge_grayscale=grey,
        color_gradient=np.hypot(ndi.sobel(grey, 0), ndi.sobel(grey, 1)),
        alpha=None,
        alpha_subject_std=None,
        image_area=float(h * w),
        diagonal=float(np.hypot(h, w)),
        source_path=Path("synthetic.png"),
    )
    mask = r < 190.0
    isolation = SubjectIsolation(
        subject_mask=mask,
        saliency_map=np.ones((h, w)),
        silhouettes=(),
        silhouette_area=float(mask.sum()),
        subject_band=subject_band(mask),
    )
    return image, isolation


@pytest.mark.parametrize("fringe_px", [1.5, 2.5])
def test_a_furred_boundary_never_yields_a_zigzag_run(fringe_px):
    """F.CT r7: iso-lines are traced at the structure scale, where a rim's
    pixel-scale fringe (fur, strands) averages away.  Traced on the raw
    pixels, runs along the furred rim zig-zag round the hairs; now none
    does."""
    from fourier_analysis.contours.assembly import stroke_wiggle

    image, isolation = _disc_scene(fringe_px)
    runs = extract_structure_contours(image, isolation, None, ContourConfig().normalized())
    assert all(stroke_wiggle(c) < 0.02 for c, _ in runs)


def test_a_clean_boundary_is_still_traced_at_the_structure_scale():
    """The structure-scale iso-line of a clean region boundary is the
    boundary: one run, the whole rim, within the band of it."""
    from fourier_analysis.contours.assembly import stroke_wiggle
    from fourier_analysis.contours.support import band_px

    image, isolation = _disc_scene(0.0)
    runs = extract_structure_contours(image, isolation, None, ContourConfig().normalized())
    longest = max((c for c, _ in runs), key=lambda c: np.abs(np.diff(c)).sum())
    assert np.abs(np.diff(longest)).sum() > 0.9 * 2 * np.pi * 150.0
    assert np.all(np.abs(np.abs(longest) - 150.0) < band_px((512, 512)))
    assert stroke_wiggle(longest) < 0.01
