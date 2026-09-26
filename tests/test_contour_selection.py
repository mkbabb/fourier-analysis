"""Greedy marginal-value stroke selection (F.CT CT-7). Public set only."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest

pytest.importorskip("onnxruntime")

from fourier_analysis.contours.assembly import (  # noqa: E402
    STOP_FRACTION,
    select_strokes,
    stroke_wiggle,
)
from fourier_analysis.contours.features import extract_feature_contours  # noqa: E402
from fourier_analysis.contours.image import load_image_inputs  # noqa: E402
from fourier_analysis.contours.isolation import isolate_subject  # noqa: E402
from fourier_analysis.contours.models import ContourConfig  # noqa: E402
from fourier_analysis.contours.structure import extract_structure_contours  # noqa: E402

ASSETS = Path(__file__).resolve().parents[1] / "assets"
PUBLIC = ["portraits/daraksha.jpg", "portraits/euler.jpg", "animals/sun.png"]


def _selection(rel: str, max_contours: int | None = 24):
    config = ContourConfig().normalized()
    image = load_image_inputs(ASSETS / rel, config)
    isolation = isolate_subject(image, config)
    candidates = extract_structure_contours(image, isolation, None, config) + (
        extract_feature_contours(image, isolation, [], None, config)
    )
    return isolation, candidates, select_strokes(isolation, candidates, max_contours, image)


@pytest.fixture(scope="module", params=PUBLIC)
def selected(request):
    return (request.param, *_selection(request.param))


def test_gains_are_positive_and_non_increasing(selected):
    name, _, _, sel = selected
    gains = np.asarray(sel.gains)
    assert gains.size > 0, name
    assert np.all(gains > 0), name
    assert np.all(np.diff(gains) <= 1e-9), (name, gains)
    assert gains[-1] >= STOP_FRACTION * gains[0], name


def test_silhouettes_come_first_and_the_ceiling_holds(selected):
    name, isolation, _, sel = selected
    assert sel.silhouette_count == len(isolation.silhouettes)
    for drawn, sil in zip(sel.contours, isolation.silhouettes):
        assert np.array_equal(drawn, sil), name
    assert len(sel.contours) <= 24
    assert len(sel.contours) == sel.silhouette_count + len(sel.gains)


def test_a_sparse_subject_stops_below_the_ceiling():
    """The sponge-flower is a few bold outlines: with no ceiling at all,
    selection stops on marginal value below the 24-stroke default and well
    before its candidates run out (it never fills a budget)."""
    _, candidates, sel = _selection("animals/sponge-flower.JPG", max_contours=None)
    assert len(candidates) > 24
    assert len(sel.contours) < 24
    assert len(sel.contours) < 0.75 * len(candidates)


def test_the_ceiling_caps_the_count():
    _, _, sel = _selection("portraits/daraksha.jpg", max_contours=5)
    assert len(sel.contours) <= 5
    assert len(sel.gains) == len(sel.contours) - sel.silhouette_count


def test_stroke_wiggle_separates_a_clean_curve_from_scribble():
    t = np.linspace(0, np.pi, 400)
    arc = 100 * np.cos(t) + 1j * 100 * np.sin(t)
    rng = np.random.default_rng(0)
    scribble = arc + 3 * (rng.standard_normal(400) + 1j * rng.standard_normal(400))
    assert stroke_wiggle(arc) < 0.02
    assert stroke_wiggle(scribble) > 5 * stroke_wiggle(arc) + 0.05
