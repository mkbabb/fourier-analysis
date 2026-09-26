"""Part boundaries as a stroke graph (``contours.strokes``) and the part map."""

from pathlib import Path

import numpy as np

from fourier_analysis.contours.strokes import boundary_strokes
from fourier_analysis.shortest_tour import build_contour_tour


def _all_drawn(n: int) -> np.ndarray:
    return ~np.eye(n, dtype=bool)


def test_shared_boundary_is_one_stroke():
    """Two parts side by side on a background: their shared border is drawn
    once, not as two parallel traces."""
    lab = np.zeros((200, 300), np.int32)
    lab[50:150, 50:150] = 1
    lab[50:150, 150:250] = 2
    strokes = boundary_strokes(lab, _all_drawn(3))
    # The middle border x = 150 (pipeline x = 0) is covered by exactly one stroke.
    near_mid = [s for s in strokes if np.mean(np.abs(s.real - (150 - 0.5 - 150))) < 2]
    assert len(near_mid) == 1
    ends = np.array([[s[0], s[-1]] for s in strokes]).ravel()
    # Three-part junctions are shared stroke ends.
    uniq = np.unique(np.round(ends, 6))
    assert len(uniq) < len(ends)


def test_junction_graph_walks_without_jumps():
    lab = np.zeros((200, 300), np.int32)
    lab[50:150, 50:150] = 1
    lab[50:150, 150:250] = 2
    tour = build_contour_tour(boundary_strokes(lab, _all_drawn(3)))
    assert tour.gap_lengths == ()
    assert tour.path[0] == tour.path[-1]


def test_undrawn_pairs_are_not_strokes():
    lab = np.zeros((100, 100), np.int32)
    lab[20:80, 20:80] = 1
    drawn = np.zeros((2, 2), bool)
    assert boundary_strokes(lab, drawn) == []


def test_boundaries_never_run_along_the_frame():
    """A part cropped by the frame gives open strokes that meet it square-on."""
    lab = np.zeros((100, 100), np.int32)
    lab[40:, 30:70] = 1  # runs off the bottom edge
    strokes = boundary_strokes(lab, _all_drawn(2))
    pts = np.concatenate(strokes)
    assert np.max(-pts.imag) < 50  # no ink beyond the bottom frame
    on_bottom = np.abs(pts.imag + 50) < 1.0
    assert on_bottom.sum() <= 4  # only the two stroke ends touch it


def test_portrait_parts_come_from_the_face_parser():
    from fourier_analysis.contours.image import load_image_inputs
    from fourier_analysis.contours.isolation import subject_mask
    from fourier_analysis.contours.models import ContourConfig
    from fourier_analysis.contours.parts import EYES, NOSE, part_labels

    path = Path(__file__).resolve().parents[1] / "assets" / "portraits" / "daraksha.jpg"
    config = ContourConfig().normalized()
    image = load_image_inputs(path, config)
    mask, _ = subject_mask(image, config)
    parts = part_labels(image, mask)
    assert parts.source == "face-parsing"
    assert len(parts.faces) == 1
    present = set(np.unique(parts.labels).tolist())
    assert NOSE in present and present & set(EYES)
