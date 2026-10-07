"""The stroke graph (``contours.strokes``), the layers composed into it
(``contours.drawing``) and the part map (``contours.parts``).

``portraits/daraksha.jpg`` is the primary sample (F.CT addendum (b))."""

from pathlib import Path

import numpy as np

import pytest

from fourier_analysis.contours.strokes import (
    LINES,
    PARTS,
    SILHOUETTE,
    Edge,
    StrokeGraph,
    boundary_graph,
    prune_to_budget,
    smooth_edges,
)
from fourier_analysis.shortest_tour import build_contour_tour

ASSETS = Path(__file__).resolve().parents[1] / "assets"


def boundary_strokes(labels: np.ndarray, drawn: np.ndarray) -> list[np.ndarray]:
    return boundary_graph(labels, drawn).polylines(labels.shape)


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


# ---------------------------------------------------------------------------
# Smoothing, pruning, dedupe
# ---------------------------------------------------------------------------


def _three_parts() -> np.ndarray:
    """Two parts on a background, split by a diagonal: a crack staircase."""
    lab = np.zeros((200, 200), np.int32)
    yy, xx = np.mgrid[:200, :200]
    box = (yy >= 40) & (yy < 160) & (xx >= 40) & (xx < 160)
    lab[box & (yy > xx)] = 1
    lab[box & (yy <= xx)] = 2
    return lab


def test_crack_boundaries_are_smoothed_with_junctions_pinned():
    """The diagonal between two parts is traced on pixel cracks (a staircase
    half a pixel deep) and comes out as a straight stroke; every stroke still
    starts and ends exactly on its junction node, so the graph stays exact."""
    graph = boundary_graph(_three_parts(), _all_drawn(3))
    for e in graph.edges:
        assert np.array_equal(e.pts[0], graph.nodes[e.u])
        assert np.array_equal(e.pts[-1], graph.nodes[e.v])
    diagonal = [e for e in graph.edges if e.layer == PARTS]
    assert len(diagonal) == 1
    pts = diagonal[0].pts[5:-5]  # clear of the junction corners
    off_line = np.abs(pts[:, 0] - pts[:, 1]) / np.sqrt(2.0)
    assert off_line.max() < 0.75  # the raw staircase swings a full pixel
    heading = np.unwrap(np.arctan2(*np.diff(pts, axis=0).T))
    assert np.abs(np.diff(heading)).max() < np.deg2rad(20)  # no 90-degree steps
    # Junctions are shared: three strokes meet at each end of the diagonal.
    assert sorted(graph.degree().tolist()) == [3, 3]
    assert {e.layer for e in graph.edges} == {SILHOUETTE, PARTS}


def test_smooth_edges_keeps_stroke_ends_on_their_nodes():
    t = np.linspace(0, 1, 120)
    zig = np.column_stack([100 * t, 3.0 * np.sign(np.sin(40 * np.pi * t))])
    graph = StrokeGraph([zig[0].copy(), zig[-1].copy()], [Edge(0, 1, zig, LINES)])
    out = smooth_edges(graph, 4.0)
    (e,) = out.edges
    assert np.array_equal(e.pts[0], graph.nodes[0]) and np.array_equal(e.pts[-1], graph.nodes[1])
    assert np.abs(e.pts[10:-10, 1]).max() < 1.0  # the zigzag is gone


def _line(a, b, n=50) -> np.ndarray:
    return np.linspace(np.asarray(a, float), np.asarray(b, float), n)


def test_budget_pruning_drops_twigs_first_and_never_the_protected():
    """A protected loop with a long line and a short twig on it: over budget,
    the twig goes first; the loop is never dropped, whatever the budget."""
    ring_t = np.linspace(0, 2 * np.pi, 200)
    ring = np.column_stack([100 + 50 * np.sin(ring_t), 100 + 50 * np.cos(ring_t)])
    ring[-1] = ring[0]
    nodes = [ring[0].copy(), np.array([100.0, 300.0]), np.array([130.0, 150.0])]
    twig_base = ring[0]
    graph = StrokeGraph(
        nodes,
        [
            Edge(0, 0, ring, SILHOUETTE),
            Edge(0, 1, _line(twig_base, nodes[1]), LINES),  # 150 px
            Edge(0, 2, _line(twig_base, nodes[2]), LINES),  # 30 px
        ],
    )

    def salience(e: Edge) -> float:
        return np.inf if e.layer != LINES else e.length

    total = sum(e.length for e in graph.edges)
    one_gone = prune_to_budget(graph, total - 10.0, salience)
    assert sorted(round(e.length) for e in one_gone.edges if e.layer == LINES) == [150]
    all_gone = prune_to_budget(graph, 1.0, salience)
    assert [e.layer for e in all_gone.edges] == [SILHOUETTE]
    assert all_gone.edges[0].length == pytest.approx(graph.edges[0].length)


def test_pruning_floor_drops_weak_strokes_even_under_budget():
    nodes = [np.array([0.0, 0.0]), np.array([0.0, 200.0]), np.array([20.0, 100.0])]
    graph = StrokeGraph(
        nodes,
        [
            Edge(0, 1, _line(nodes[0], nodes[1]), LINES),
            Edge(2, 2, np.array([[20.0, 100.0], [25.0, 105.0], [20.0, 110.0], [20.0, 100.0]]), LINES),
        ],
    )
    kept = prune_to_budget(graph, 1e9, lambda e: e.length, floor=50.0)
    assert [round(e.length) for e in kept.edges] == [200]
    assert len(prune_to_budget(graph, 1e9, lambda e: e.length).edges) == 2


def test_pruning_never_disconnects_a_component():
    """A stroke whose removal would split its component (a cut edge that is
    not a twig) stays, however weak: two loops joined by a short link."""
    t = np.linspace(0, 2 * np.pi, 100)

    def ring(cx: float) -> np.ndarray:
        r = np.column_stack([50 + 30 * np.sin(t), cx + 30 * np.cos(t)])
        r[-1] = r[0]
        return r

    a, b = ring(50.0), ring(150.0)
    link = _line(a[0], b[50], 10)
    link[0], link[-1] = a[0], b[50]
    graph = StrokeGraph(
        [a[0].copy(), b[50].copy()],
        [Edge(0, 0, a, SILHOUETTE), Edge(1, 1, b, SILHOUETTE), Edge(0, 1, link, LINES)],
    )
    out = prune_to_budget(graph, 1.0, lambda e: np.inf if e.layer != LINES else e.length, floor=1e9)
    assert len(out.edges) == 3


def test_a_line_that_doubles_earlier_ink_gives_way():
    """Layer dedupe: a learned line running beside the silhouette along its
    length is the same edge drawn twice and is dropped; one crossing it is not."""
    from fourier_analysis.contours.drawing import drop_doubles
    from fourier_analysis.contours.strokes import rasterize

    outline = StrokeGraph(
        [np.array([100.0, 20.0]), np.array([100.0, 280.0])],
        [Edge(0, 1, _line([100, 20], [100, 280], 300), SILHOUETTE)],
    )
    earlier = rasterize(outline, (200, 300))
    lines = StrokeGraph(
        [np.array([104.0, 40.0]), np.array([104.0, 260.0]), np.array([20.0, 150.0]), np.array([180.0, 150.0])],
        [
            Edge(0, 1, _line([104, 40], [104, 260], 250), LINES),  # 4 px beside the outline
            Edge(2, 3, _line([20, 150], [180, 150], 200), LINES),  # crosses it
        ],
    )
    kept = drop_doubles(lines, earlier, reach=6.0)
    assert len(kept.edges) == 1
    assert abs(kept.edges[0].pts[0, 1] - 150.0) < 1e-9


def test_a_stroke_is_not_counted_as_its_own_neighbour():
    """``self_density`` is a stroke's own share of the stroke density along
    it: 1 for a straight stroke, about 2 where it runs back beside itself (a
    hairpin, the two sides of a narrow loop), so that share can be taken off
    and only *other* strokes make a mesh."""
    from fourier_analysis.contours.drawing import self_density

    straight = _line([0, 0], [0, 400], 400)
    assert self_density(straight, 10.0) == pytest.approx(1.0, abs=0.1)
    hairpin = np.vstack([_line([0, 0], [0, 400], 400), _line([4, 400], [4, 0], 400)])
    assert self_density(hairpin, 10.0) == pytest.approx(2.0, abs=0.25)


# ---------------------------------------------------------------------------
# Parts
# ---------------------------------------------------------------------------


def test_iris_is_a_disc_clipped_by_the_lids():
    """A synthetic eye: an almond opening with a dark disc in it.  The iris is
    labelled on the disc, inside the eye; a uniformly lit eye has none."""
    from fourier_analysis.contours.parts import EYES, IRIS, SKIN, irises

    h, w = 80, 160
    yy, xx = np.mgrid[:h, :w]
    eye = ((xx - 80) / 50.0) ** 2 + ((yy - 40) / 14.0) ** 2 <= 1.0
    labels = np.where(eye, EYES[0], SKIN).astype(np.int32)
    lab = np.full((h, w, 3), 0.5)
    lab[..., 0] = np.where(eye, 0.9, 0.6)
    disc = (xx - 95) ** 2 + (yy - 40) ** 2 <= 18**2
    lab[..., 0][eye & disc] = 0.15

    out = irises(labels, lab)
    iris = out == IRIS
    assert iris.any() and not (iris & ~eye).any()  # clipped by the lids
    cy, cx = np.argwhere(iris).mean(axis=0)
    assert abs(cx - 95) < 5 and abs(cy - 40) < 4
    assert (iris & disc).sum() >= 0.8 * iris.sum()
    assert (out[eye & ~iris] == EYES[0]).all()

    flat = lab.copy()
    flat[..., 0] = np.where(eye, 0.9, 0.6)
    assert not (irises(labels, flat) == IRIS).any()


@pytest.fixture(scope="module")
def daraksha():
    from fourier_analysis.contours.drawing import draw_subject
    from fourier_analysis.contours.image import load_image_inputs
    from fourier_analysis.contours.isolation import subject_mask
    from fourier_analysis.contours.models import ContourConfig
    from fourier_analysis.contours.parts import part_labels

    config = ContourConfig().normalized()
    image = load_image_inputs(ASSETS / "portraits" / "daraksha.jpg", config)
    mask, _ = subject_mask(image, config)
    return part_labels(image, mask), draw_subject(image, config)


def test_daraksha_has_her_named_face_parts(daraksha):
    """The primary sample: one confirmed face with skin, both brows, both
    eyes, the nose, both lips and the hair, and an iris in each eye."""
    from scipy import ndimage as ndi

    from fourier_analysis.contours.parts import EYES, FACE_CLASSES, HAIR, IRIS, NOSE, SKIN

    parts, _ = daraksha
    assert parts.source == "face-parsing"
    assert len(parts.faces) == 1
    present = set(np.unique(parts.labels).tolist())
    name = {n: i for i, n in enumerate(FACE_CLASSES)}
    wanted = {SKIN, NOSE, HAIR, IRIS, name["l_brow"], name["r_brow"], name["u_lip"], name["l_lip"], *EYES}
    assert wanted <= present, {FACE_CLASSES[i] if i < len(FACE_CLASSES) else i for i in wanted - present}
    irises, n_irises = ndi.label(parts.labels == IRIS)
    assert n_irises == 2
    beside_eye = ndi.binary_dilation(np.isin(parts.labels, EYES), iterations=2)
    for k in (1, 2):  # each iris sits in an eye, with white left beside it
        assert (beside_eye & (irises == k)).any()


def test_daraksha_drawing_has_the_centre_part(daraksha):
    """The learned line layer draws the hair's centre part: a line in the
    hair, above the face, within the middle third of the face box, running
    more down than across.  The face itself is drawn by the parser alone."""
    from fourier_analysis.contours.parts import HAIR

    parts, drawing = daraksha
    assert drawing is not None and drawing.source == "face-parsing"
    x, y, w, h = parts.faces[0].box
    lines = [e.pts for e in drawing.graph.edges if e.layer == LINES]
    assert lines
    hair = parts.labels == HAIR
    found = False
    for pts in lines:
        r = np.clip(np.rint(pts[:, 0]).astype(int), 0, hair.shape[0] - 1)
        c = np.clip(np.rint(pts[:, 1]).astype(int), 0, hair.shape[1] - 1)
        assert parts.face_core[r, c].mean() < 0.2  # no learned line on the face
        rows, cols = np.ptp(pts[:, 0]), np.ptp(pts[:, 1])
        in_middle = abs(pts[:, 1].mean() - (x + w / 2)) < w / 6
        if hair[r, c].mean() > 0.7 and pts[:, 0].mean() < y + h / 4 and in_middle and rows > cols and rows > 0.05 * h:
            found = True
    assert found
    assert {e.layer for e in drawing.graph.edges} == {SILHOUETTE, PARTS, LINES}


@pytest.mark.parametrize("rel", ["animals/golden-retriever.webp", "animals/sponge-happy.JPG"])
def test_no_face_is_found_on_an_animal_or_a_cartoon(rel: str):
    """A subject with no human face has no parts: its silhouette comes from
    the mask and its interior from the line layer."""
    from fourier_analysis.contours.image import load_image_inputs
    from fourier_analysis.contours.isolation import subject_mask
    from fourier_analysis.contours.models import ContourConfig
    from fourier_analysis.contours.parts import BACKGROUND, UNPARSED, part_labels

    config = ContourConfig().normalized()
    image = load_image_inputs(ASSETS / rel, config)
    mask, _ = subject_mask(image, config)
    parts = part_labels(image, mask)
    assert parts.source == "silhouette" and parts.faces == ()
    assert set(np.unique(parts.labels).tolist()) <= {BACKGROUND, UNPARSED}
    assert not parts.face_core.any()


def test_person_cut_removes_what_stands_beside_the_sitter():
    """``human.png``: the saliency keeps a plant leaf against the sitter's
    cheek; with a confirmed face the subject is cut to the person, so the
    leaf goes and the sitter stays whole."""
    from scipy import ndimage as ndi

    from fourier_analysis.contours.image import load_image_inputs
    from fourier_analysis.contours.isolation import subject_mask
    from fourier_analysis.contours.ml import _source_rgb
    from fourier_analysis.contours.models import ContourConfig
    from fourier_analysis.contours.parts import part_labels
    from fourier_analysis.contours.person import person_probability

    config = ContourConfig().normalized()
    image = load_image_inputs(ASSETS / "portraits" / "human.png", config)
    mask, _ = subject_mask(image, config)
    parts = part_labels(image, mask)
    subject = parts.subject
    assert parts.source == "face-parsing"
    removed = mask & ~subject
    b = 4  # the labels' frame band
    removed[:b] = removed[-b:] = False
    removed[:, :b] = removed[:, -b:] = False
    assert removed.sum() > 0.03 * mask.sum()  # the leaf is a real share of the mask
    labels, n = ndi.label(removed)
    sizes = ndi.sum(removed, labels, index=np.arange(1, n + 1))
    assert sizes.max() > 0.9 * removed.sum()  # one object, not slivers all round
    person = person_probability(_source_rgb(image), mask.shape) >= 0.5
    assert (person & removed).sum() < 0.05 * removed.sum()  # none of it was the person
    assert (person & subject).sum() > 0.95 * (person & mask).sum()  # the sitter is whole


def test_portrait_parts_come_from_the_face_parser():
    from fourier_analysis.contours.image import load_image_inputs
    from fourier_analysis.contours.isolation import subject_mask
    from fourier_analysis.contours.models import ContourConfig
    from fourier_analysis.contours.parts import EYES, NOSE, part_labels

    path = ASSETS / "portraits" / "daraksha.jpg"
    config = ContourConfig().normalized()
    image = load_image_inputs(path, config)
    mask, _ = subject_mask(image, config)
    parts = part_labels(image, mask)
    assert parts.source == "face-parsing"
    assert len(parts.faces) == 1
    present = set(np.unique(parts.labels).tolist())
    assert NOSE in present and present & set(EYES)
