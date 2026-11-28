"""FORTY-SIXTH G: the subject's outline the drawing reports at its mask
checkpoint (``drawing.mask_outline``), in the pipeline's frame (centred on the
image, y up), closed even where the subject touches the frame."""

from types import SimpleNamespace

import numpy as np

from fourier_analysis.contours import isolation, ml
from fourier_analysis.contours.drawing import mask_outline
from fourier_analysis.contours.models import ContourConfig


def test_a_disc_is_one_closed_ring_in_the_centred_frame():
    h, w = 120, 200
    rows, cols = np.mgrid[0:h, 0:w]
    # A disc of radius 30 centred at column 140, row 40: x = 140 - 100 = 40, y = 60 - 40 = 20.
    mask = (cols - 140) ** 2 + (rows - 40) ** 2 <= 30**2
    (ring,) = mask_outline(mask)
    assert abs(ring[0] - ring[-1]) < 1e-9
    centre = ring.mean()
    assert abs(centre.real - 40) < 1 and abs(centre.imag - 20) < 1
    assert np.allclose(np.abs(ring - centre), 30, atol=1.0)


def test_a_subject_cut_by_the_frame_still_closes():
    mask = np.zeros((50, 50), bool)
    mask[30:, 10:40] = True  # runs off the bottom edge
    (ring,) = mask_outline(mask)
    assert abs(ring[0] - ring[-1]) < 1e-9
    # Its bottom edge is the frame's: y = 25 - 49.5 = -24.5 in the centred frame.
    assert ring.imag.min() <= -24.0


def test_an_empty_mask_has_no_outline():
    assert mask_outline(np.zeros((10, 10), bool)) == []


def _disc(h: int, w: int, cx: int, cy: int, r: int) -> np.ndarray:
    rows, cols = np.mgrid[0:h, 0:w]
    return (((cols - cx) ** 2 + (rows - cy) ** 2) <= r**2).astype(np.float64)


def test_the_subject_models_are_heard_one_by_one_in_their_order(monkeypatch):
    """Each model's map is handed on as its model finishes, the first first."""
    made = {spec.name: np.full((4, 4), i / 10) for i, spec in enumerate(ml.SUBJECT_MODELS)}
    monkeypatch.setattr(ml, "_source_rgb", lambda image: None)
    monkeypatch.setattr(ml, "_predict_one", lambda spec, rgb, shape: made[spec.name])
    heard: list[float] = []
    maps = ml.subject_maps(SimpleNamespace(grayscale=np.zeros((4, 4))), lambda m: heard.append(float(m[0, 0])))
    assert heard == [i / 10 for i in range(len(ml.SUBJECT_MODELS))]
    assert [float(m[0, 0]) for m in maps] == heard


def test_the_first_models_silhouette_is_heard_before_the_second_model_runs(monkeypatch):
    """FORTY-SIXTH G: an early silhouette, as soon as the first (and quicker)
    subject model has read the picture: its own map grown to the subject,
    heard once, before the second model runs; the mask itself is still the
    ensemble's."""
    h, w = 60, 90
    first = _disc(h, w, 30, 30, 15)
    second = _disc(h, w, 45, 30, 15)
    ran: list[str] = []

    def maps(image, on_map=None):
        out = []
        for name, m in (("first", first), ("second", second)):
            ran.append(name)
            out.append(m)
            if on_map is not None:
                on_map(m)
        return out

    monkeypatch.setattr(isolation, "subject_maps", maps)
    heard: list[tuple[list[str], np.ndarray]] = []
    config = ContourConfig().normalized()
    mask, _ = isolation.subject_mask(SimpleNamespace(alpha=None), config, lambda m: heard.append((list(ran), m)))
    assert len(heard) == 1
    seen_when, silhouette = heard[0]
    assert seen_when == ["first"]
    assert np.array_equal(silhouette, first > 0.5)
    # The mask is the models' agreement, not the first model's silhouette.
    assert not np.array_equal(mask, silhouette)
    assert mask.sum() < silhouette.sum()


def test_no_early_silhouette_is_read_when_nobody_listens(monkeypatch):
    seen: list[object] = []

    def maps(image, on_map=None):
        seen.append(on_map)
        return [_disc(20, 20, 10, 10, 5), _disc(20, 20, 10, 10, 5)]

    monkeypatch.setattr(isolation, "subject_maps", maps)
    isolation.subject_mask(SimpleNamespace(alpha=None), ContourConfig().normalized())
    assert seen == [None]
