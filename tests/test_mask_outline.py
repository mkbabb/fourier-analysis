"""FORTY-SIXTH G: the subject's outline the drawing reports at its mask
checkpoint (``drawing.mask_outline``), in the pipeline's frame (centred on the
image, y up), closed even where the subject touches the frame."""

import numpy as np

from fourier_analysis.contours.drawing import mask_outline


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
