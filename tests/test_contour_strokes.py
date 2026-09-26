"""The stroke graph (contours.strokes), corner-keeping resampling, and the
landmark stage on the primary sample."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest

from fourier_analysis.contours.geometry import resample_arc_length
from fourier_analysis.contours.strokes import (
    Layer,
    compose_layers,
    graph_trails,
    prune_spurs,
    rasterize,
    skeleton_graph,
    smooth_graph,
    snap_ends,
)
from fourier_analysis.shortest_tour import build_contour_tour

ASSETS = Path(__file__).resolve().parents[1] / "assets"


def _t_shape(shape=(120, 120)):
    bar = np.array([[30.0, 10.0], [30.0, 110.0]])
    stem = np.array([[30.0, 60.0], [100.0, 60.0]])
    return rasterize([bar, stem], shape)


def test_skeleton_graph_reads_a_t_as_one_junction_three_ends():
    canvas = compose_layers([Layer("t", _t_shape())], (120, 120), 2.0)
    g = prune_spurs(skeleton_graph(canvas), 3.0)
    deg = sorted(g.degrees().tolist())
    assert deg == [1, 1, 1, 3]
    assert len(g.edges) == 3


def test_trails_share_junctions_exactly_so_the_tour_needs_no_jump():
    canvas = compose_layers([Layer("t", _t_shape())], (120, 120), 2.0)
    g = smooth_graph(prune_spurs(skeleton_graph(canvas), 3.0), 1.5)
    trails = graph_trails(g)
    contours = [t.pts[:, 1] + 1j * t.pts[:, 0] for t in trails]
    tour = build_contour_tour(contours)
    assert tour.gap_lengths == ()
    assert tour.path[0] == tour.path[-1]


def test_later_layers_do_not_repeat_earlier_ink():
    line = rasterize([np.array([[50.0, 10.0], [50.0, 110.0]])], (120, 120))
    near = rasterize([np.array([[53.0, 10.0], [53.0, 110.0]])], (120, 120))
    canvas = compose_layers([Layer("a", line), Layer("b", near)], (120, 120), 5.0)
    assert (canvas == 1).sum() == 0


def test_a_free_end_short_of_a_line_is_joined_to_it():
    bar = np.array([[30.0, 10.0], [30.0, 110.0]])
    stem = np.array([[38.0, 60.0], [100.0, 60.0]])  # stops 8 px short
    canvas = compose_layers([Layer("t", rasterize([bar, stem], (120, 120)))], (120, 120), 2.0)
    g = snap_ends(prune_spurs(skeleton_graph(canvas), 3.0), 12.0)
    lab = set()
    parent = list(range(len(g.nodes)))

    def find(x):
        while parent[x] != x:
            x = parent[x]
        return x

    for e in g.edges:
        parent[find(e.u)] = find(e.v)
    lab = {find(n) for n in range(len(g.nodes))}
    assert len(lab) == 1


def test_resampling_keeps_a_dead_end_tip():
    """An out-and-back stroke's tip is a sample, not cut by the grid."""
    out = np.linspace(0, 100, 101)
    path = np.concatenate([out, out[-2::-1]]).astype(np.complex128)
    r = resample_arc_length(path, 37)  # a grid that does not land on 100
    assert len(r) == 37
    assert np.abs(r).max() == pytest.approx(100.0)


def test_resampling_keeps_a_square_corner():
    sq = np.array([0, 10, 10 + 10j, 10j, 0], dtype=np.complex128)
    r = resample_arc_length(sq, 23)
    for corner in (10, 10 + 10j, 10j):
        assert np.min(np.abs(r - corner)) < 1e-9


def test_primary_sample_face_lines():
    """The landmark stage draws the named feature lines on daraksha."""
    pytest.importorskip("mediapipe")
    from PIL import Image

    from fourier_analysis.contours.landmarks import find_faces

    img = Image.open(ASSETS / "portraits" / "daraksha.jpg").convert("RGB")
    img.thumbnail((1024, 1024))
    faces = find_faces(np.asarray(img), None)
    assert len(faces) == 1
    lines = faces[0].lines
    for name in ("jaw", "brow_l", "brow_r", "eye_l", "eye_r", "nose_bridge",
                 "nose_base", "lips_outer", "lips_inner"):
        assert name in lines and len(lines[name]) > 4
    # Eyes and lips are closed lines.
    for name in ("eye_l", "eye_r", "lips_outer", "lips_inner"):
        assert np.allclose(lines[name][0], lines[name][-1])


@pytest.mark.parametrize("name", ["animals/golden-retriever.webp", "animals/sponge-happy.JPG"])
def test_no_human_face_on_animals_or_cartoons(name):
    pytest.importorskip("mediapipe")
    from PIL import Image

    from fourier_analysis.contours.landmarks import find_faces

    img = Image.open(ASSETS / name).convert("RGB")
    img.thumbnail((1024, 1024))
    assert find_faces(np.asarray(img), None) == []
