"""Semantic parts: the regions whose shared boundaries are a drawing's lines.

An artist does not draw where brightness crosses a level; they draw where one
part of the subject meets another: the jaw against the neck, the lips against
the skin, the hair against the forehead, the subject against the world.  This
module labels every pixel of the pipeline grid with the part it belongs to, and
``contours.strokes`` draws the boundaries between parts.

Two sources of parts:

**Faces.**  YuNet (OpenCV zoo, 2023mar) finds the faces; each is parsed by a
BiSeNet (ResNet-34) trained on CelebAMask-HQ's 19 classes (skin, brows, eyes,
glasses, ears, earring, nose, mouth, lips, neck, necklace, cloth, hair, hat).
The parser sees a square crop ``FACE_CROP_SCALE`` times the detection's
larger side, centred on it, which is the framing its training faces have.  Its
per-class probabilities are resampled onto the pipeline grid and the argmax
taken, so part boundaries come out smooth and sub-pixel placed.

**Everything else.**  A subject with no face (an animal, a cartoon, a robot) is
split into colour parts: SLIC superpixels in CIELAB, merged weakest border
first (a border is weak when both its colour step and its edge strength are
small; ``_merge_parts``) until at most ``MAX_COLOUR_PARTS`` remain and every
border is a real one.  The merged parts' cores then seed a watershed over the
colour gradient, so each border settles on the image's strongest edge between
its two parts, and a part thinner than ``THIN_FRACTION`` of the image diagonal
(a cartoon's outline, an engraving's hatch) keeps no core: it is flooded from
both sides and becomes the single border between its neighbours.  A face
image's clothing (one parser class) is split into colour parts the same way,
and each parsed eye into its iris and white (``irises``).

The subject mask has the last word on the silhouette: off the mask is
``BACKGROUND``; on the mask where no parser speaks (outside every face crop, or
where the parser sees background) is ``UNPARSED``, whose boundaries with parsed
parts are not drawn (they are where the parser's view ends, not a line on the
subject).  Model files are sha-pinned and cached like ``contours.ml``'s, never
committed.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray
from PIL import Image
from scipy import ndimage as ndi

from fourier_analysis.contours.image import LoadedImage
from fourier_analysis.contours.ml import SubjectModelSpec, _get_session, _source_rgb

# ---------------------------------------------------------------------------
# Label space
# ---------------------------------------------------------------------------

BACKGROUND = 0
# CelebAMask-HQ classes 1..18, as the parser emits them.
FACE_CLASSES = (
    "background", "skin", "l_brow", "r_brow", "l_eye", "r_eye", "eye_g", "l_ear",
    "r_ear", "ear_r", "nose", "mouth", "u_lip", "l_lip", "neck", "neck_l", "cloth",
    "hair", "hat",
)
N_FACE_CLASSES = len(FACE_CLASSES)
SKIN, NOSE, NECK, CLOTH, HAIR, HAT = 1, 10, 14, 16, 17, 18
FEATURES = (2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15)  # the small parts
EYES = (4, 5)
UNPARSED = N_FACE_CLASSES  # on the subject, no parser label
IRIS = UNPARSED + 1  # the dark of an eye (not a parser class; see ``irises``)
FIRST_COLOUR_PART = IRIS + 1

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

FACE_DETECTOR = SubjectModelSpec(
    name="face-detection-yunet-2023mar",
    url=(
        "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/"
        "face_detection_yunet_2023mar.onnx"
    ),
    sha256="8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4",
    input_size=640,
)

FACE_PARSER = SubjectModelSpec(
    name="face-parsing-bisenet-resnet34",
    url="https://github.com/yakhyo/face-parsing/releases/download/weights/resnet34.onnx",
    sha256="5b805bba7b5660ab7070b5a381dcf75e5b3e04199f1e9387232a77a00095102e",
    input_size=512,
)

FACE_MIN_SCORE = 0.8
"""YuNet confidence for a face to be parsed (its own default is 0.9)."""
FACE_NMS_IOU = 0.3
FACE_MIN_SIDE_PX = 24
"""Faces smaller than this (pipeline pixels) are too small to parse."""
FACE_CROP_SCALE = 2.2
"""Parser crop side, in detection sides (the CelebAMask-HQ framing)."""
MAX_FACES = 4

FEATURE_MIN_SIDE = 0.03
"""A face part smaller than (this x face side)^2 is noise, absorbed."""
REGION_MIN_FRACTION = 0.002
"""Any other part below this fraction of the subject's area is absorbed."""

MAX_COLOUR_PARTS = 16
MIN_PART_DELTA_E = 14.0
COLOUR_SUPERPIXELS = 240
COLOUR_COMPACTNESS = 12.0
THIN_FRACTION = 0.006
EDGE_CONTRAST = 2.5
MODAL_FRACTION = 0.0025


@dataclass(frozen=True)
class Face:
    score: float
    box: tuple[float, float, float, float]  # x, y, w, h in pipeline pixels


@dataclass(frozen=True)
class PartLabels:
    """A part label per pipeline pixel, and which label pairs are drawn."""

    labels: NDArray[np.int32]
    drawn: NDArray[np.bool_]  # (n_labels, n_labels): is the boundary a line
    faces: tuple[Face, ...]
    source: str  # "face-parsing" or "colour-parts"


def load_part_sessions() -> None:
    """Open the face models' sessions now (a long-lived process pays once)."""
    _get_session(FACE_DETECTOR)
    _get_session(FACE_PARSER)


# ---------------------------------------------------------------------------
# Face detection (YuNet)
# ---------------------------------------------------------------------------


def detect_faces(rgb: Image.Image, shape: tuple[int, int]) -> list[Face]:
    """YuNet faces on the source image, boxes scaled to the pipeline ``shape``."""
    session = _get_session(FACE_DETECTOR)
    size = FACE_DETECTOR.input_size
    w, h = rgb.size
    s = size / max(w, h)
    small = rgb.resize((max(1, round(w * s)), max(1, round(h * s))), Image.Resampling.BILINEAR)
    canvas = np.zeros((size, size, 3), np.float32)
    a = np.asarray(small, np.float32)[:, :, ::-1]  # the model reads BGR, 0..255
    canvas[: a.shape[0], : a.shape[1]] = a
    names = [o.name for o in session.get_outputs()]
    out = dict(zip(names, session.run(None, {session.get_inputs()[0].name: canvas.transpose(2, 0, 1)[None]})))

    to_pipe = shape[1] / w  # source px -> pipeline px
    cands: list[tuple[float, float, float, float, float]] = []
    for stride in (8, 16, 32):
        n = size // stride
        cls = out[f"cls_{stride}"][0, :, 0]
        obj = out[f"obj_{stride}"][0, :, 0]
        score = np.sqrt(np.clip(cls, 0, 1) * np.clip(obj, 0, 1))
        for i in np.flatnonzero(score >= FACE_MIN_SCORE):
            r, c = divmod(int(i), n)
            b = out[f"bbox_{stride}"][0, i]
            cx, cy = (c + b[0]) * stride, (r + b[1]) * stride
            bw, bh = np.exp(b[2]) * stride, np.exp(b[3]) * stride
            k = to_pipe / s
            cands.append((float(score[i]), (cx - bw / 2) * k, (cy - bh / 2) * k, bw * k, bh * k))
    cands.sort(reverse=True)
    kept: list[Face] = []
    for sc, x, y, bw, bh in cands:
        if max(bw, bh) < FACE_MIN_SIDE_PX:
            continue
        if all(_iou((x, y, bw, bh), f.box) < FACE_NMS_IOU for f in kept):
            kept.append(Face(sc, (x, y, bw, bh)))
        if len(kept) == MAX_FACES:
            break
    return kept


def _iou(a: tuple[float, ...], b: tuple[float, ...]) -> float:
    x0, y0 = max(a[0], b[0]), max(a[1], b[1])
    x1, y1 = min(a[0] + a[2], b[0] + b[2]), min(a[1] + a[3], b[1] + b[3])
    inter = max(0.0, x1 - x0) * max(0.0, y1 - y0)
    return inter / max(1e-9, a[2] * a[3] + b[2] * b[3] - inter)


# ---------------------------------------------------------------------------
# Face parsing (BiSeNet, CelebAMask-HQ)
# ---------------------------------------------------------------------------


def parse_face(
    rgb: Image.Image, face: Face, shape: tuple[int, int]
) -> tuple[NDArray[np.float32], tuple[int, int, int]]:
    """The parser's class probabilities over the face's crop, on the pipeline
    grid: ``(probs[S, S, 19], (row0, col0, S))`` with the crop's top-left
    corner in pipeline pixels (it may lie off the image)."""
    session = _get_session(FACE_PARSER)
    size = FACE_PARSER.input_size
    x, y, w, h = face.box
    side = FACE_CROP_SCALE * max(w, h)
    cx, cy = x + w / 2, y + h / 2
    col0, row0 = cx - side / 2, cy - side / 2

    to_src = rgb.size[0] / shape[1]
    box_src = tuple(round(v * to_src) for v in (col0, row0, col0 + side, row0 + side))
    crop = rgb.crop(box_src).resize((size, size), Image.Resampling.BILINEAR)
    xin = np.asarray(crop, np.float32) / 255.0
    xin = (xin - np.asarray(FACE_PARSER.mean, np.float32)) / np.asarray(FACE_PARSER.std, np.float32)
    logits = session.run(None, {session.get_inputs()[0].name: xin.transpose(2, 0, 1)[None].astype(np.float32)})[0][0]
    logits = logits - logits.max(axis=0, keepdims=True)
    prob = np.exp(logits)
    prob /= prob.sum(axis=0, keepdims=True)

    s_px = max(2, round(side))
    probs = np.stack(
        [
            np.asarray(
                Image.fromarray(p.astype(np.float32), mode="F").resize((s_px, s_px), Image.Resampling.BILINEAR)
            )
            for p in prob
        ],
        axis=-1,
    )
    return probs, (round(row0), round(col0), s_px)


def face_part_labels(
    parses: list[tuple[NDArray[np.float32], tuple[int, int, int]]],
    shape: tuple[int, int],
    on_subject: bool = False,
) -> NDArray[np.int32]:
    """The argmax parse over every face crop (the most confident crop wins where
    they overlap), ``BACKGROUND`` outside every crop.

    ``on_subject``: the pixel is known to be on the subject (the subject mask
    decides the silhouette), so background is not a choice and the argmax runs
    over the 18 part classes: a braid or a shoulder the parser half-dismissed
    as background takes its most likely part."""
    labels = np.zeros(shape, np.int32)
    conf = np.zeros(shape, np.float32)
    for probs, (r0, c0, s) in parses:
        rs, cs = max(0, r0), max(0, c0)
        re, ce = min(shape[0], r0 + s), min(shape[1], c0 + s)
        if re <= rs or ce <= cs:
            continue
        sub = probs[rs - r0 : re - r0, cs - c0 : ce - c0]
        if on_subject:
            sub = sub[..., 1:] / np.maximum(1e-6, 1.0 - sub[..., :1])
            lab = sub.argmax(axis=-1).astype(np.int32) + 1
        else:
            lab = sub.argmax(axis=-1).astype(np.int32)
        p = sub.max(axis=-1)
        win = p > conf[rs:re, cs:ce]
        labels[rs:re, cs:ce][win] = lab[win]
        conf[rs:re, cs:ce][win] = p[win]
    return labels


def confirms_face(labels: NDArray[np.int32], face: Face) -> bool:
    """The parse sees a face in the detection box: skin covers a third of it,
    with a nose and at least one eye or brow on the skin."""
    x, y, w, h = (round(v) for v in face.box)
    box = labels[max(0, y) : max(0, y + h), max(0, x) : max(0, x + w)]
    if box.size == 0:
        return False
    skin = float(np.mean(box == SKIN))
    has_nose = bool(np.any(box == NOSE))
    has_eye = bool(np.any(np.isin(box, (2, 3, 4, 5, 6))))
    return skin >= 1 / 3 and has_nose and has_eye


# ---------------------------------------------------------------------------
# Colour parts
# ---------------------------------------------------------------------------


def colour_parts(
    lab_norm: NDArray[np.float64],
    gradient: NDArray[np.float64],
    region: NDArray[np.bool_],
    first_label: int,
) -> NDArray[np.int32]:
    """Split ``region`` into colour parts (module docstring); labels from
    ``first_label`` on, 0 off the region.

    Superpixels decide *which* parts there are; the image decides *where*
    their borders run: each merged part's core (the part eroded by the thin
    radius) seeds a watershed over the colour gradient, so borders settle on
    the strongest edge between two parts, and a part too thin to keep a core
    (a line) is flooded from both sides and becomes the border itself."""
    from skimage.segmentation import slic, watershed

    out = np.zeros(region.shape, np.int32)
    if not region.any():
        return out
    lab = np.empty_like(lab_norm)
    lab[..., 0] = lab_norm[..., 0] * 100.0
    lab[..., 1:] = lab_norm[..., 1:] * 256.0 - 128.0
    area = int(region.sum())
    n_seg = max(8, min(COLOUR_SUPERPIXELS, area // 400))
    seg = slic(
        lab, n_segments=n_seg, compactness=COLOUR_COMPACTNESS, mask=region,
        channel_axis=-1, convert2lab=False, start_label=1, enforce_connectivity=True,
    ).astype(np.int32)
    seg[~region] = 0
    seg = _merge_parts(seg, lab, ndi.gaussian_filter(gradient, 1.0), region, REGION_MIN_FRACTION * area)

    radius = max(1.0, THIN_FRACTION * float(np.hypot(*region.shape)))
    border = np.zeros(region.shape, bool)
    border[:, :-1] |= seg[:, :-1] != seg[:, 1:]
    border[:, 1:] |= seg[:, :-1] != seg[:, 1:]
    border[:-1, :] |= seg[:-1, :] != seg[1:, :]
    border[1:, :] |= seg[:-1, :] != seg[1:, :]
    core = region & (ndi.distance_transform_edt(~border) > radius)
    markers = np.where(core, seg, 0)
    if not markers.any():
        markers = seg
    grad = ndi.gaussian_filter(gradient, radius)  # borders follow structure, not texture
    seg = watershed(grad, markers, mask=region).astype(np.int32)
    seg = _modal(seg, region)
    uniq = np.unique(seg[region])
    uniq = uniq[uniq > 0]
    remap = np.zeros(int(seg.max()) + 1, np.int32)
    remap[uniq] = np.arange(first_label, first_label + len(uniq))
    out[region] = remap[seg[region]]
    return out


def _merge_parts(
    seg: NDArray[np.int32],
    lab: NDArray[np.float64],
    gradient: NDArray[np.float64],
    region: NDArray[np.bool_],
    min_area: float,
) -> NDArray[np.int32]:
    """Merge neighbouring regions, weakest border first, until at most
    ``MAX_COLOUR_PARTS`` remain and every border is a real one.

    A border's weakness is the geometric mean of two ratios: the colour step
    across it (mean-colour delta E over ``MIN_PART_DELTA_E``) and its edge
    strength (mean colour gradient along it over ``EDGE_CONTRAST`` times the
    region's median gradient).  Fur or engraving texture has neither; a
    robot's grey-on-grey panels differ little in colour but are cut by a
    strong edge; a cartoon's parts have both.  A border is real once the mean
    reaches one.  A region below ``min_area`` always merges first."""
    n = int(seg.max()) + 1
    count = np.bincount(seg.ravel(), minlength=n).astype(np.float64)
    sums = np.stack([np.bincount(seg.ravel(), weights=lab[..., k].ravel(), minlength=n) for k in range(3)], 1)
    g_ref = max(1e-9, float(np.median(gradient[region]))) * EDGE_CONTRAST
    border: dict[tuple[int, int], list[float]] = {}
    for (a, b), (ga, gb) in (
        ((seg[:, :-1], seg[:, 1:]), (gradient[:, :-1], gradient[:, 1:])),
        ((seg[:-1, :], seg[1:, :]), (gradient[:-1, :], gradient[1:, :])),
    ):
        m = (a != b) & (a > 0) & (b > 0)
        if not m.any():
            continue
        lo, hi = np.minimum(a[m], b[m]).astype(np.int64), np.maximum(a[m], b[m]).astype(np.int64)
        code = lo * n + hi
        uniq, inv = np.unique(code, return_inverse=True)
        gs = np.bincount(inv, weights=0.5 * (ga[m] + gb[m]))
        cs = np.bincount(inv)
        for c, gsum, cnt in zip(uniq.tolist(), gs.tolist(), cs.tolist()):
            e = border.setdefault(divmod(c, n), [0.0, 0.0])
            e[0] += gsum
            e[1] += cnt
    parent = np.arange(n)
    alive = int(np.count_nonzero(count[1:]))
    while alive > 1 and border:
        keys = list(border)
        pa = np.array(keys, dtype=np.int64)
        val = np.array([border[k] for k in keys])
        means = sums / np.maximum(count, 1)[:, None]
        de = np.linalg.norm(means[pa[:, 0]] - means[pa[:, 1]], axis=1) / MIN_PART_DELTA_E
        edge = val[:, 0] / np.maximum(val[:, 1], 1) / g_ref
        cost = np.sqrt(de * edge)
        small = np.minimum(count[pa[:, 0]], count[pa[:, 1]]) < min_area
        k = int(np.argmin(np.where(small, cost - 1e6, cost)))
        if not small[k] and alive <= MAX_COLOUR_PARTS and cost[k] >= 1.0:
            break
        a, b = int(pa[k, 0]), int(pa[k, 1])
        count[a] += count[b]
        sums[a] += sums[b]
        count[b] = 0
        sums[b] = 0
        parent[b] = a
        alive -= 1
        for key in [x for x in border if b in x]:
            gsum, cnt = border.pop(key)
            other = key[0] if key[1] == b else key[1]
            if other == a:
                continue
            e = border.setdefault((min(a, other), max(a, other)), [0.0, 0.0])
            e[0] += gsum
            e[1] += cnt
    root = parent.copy()
    for i in range(n):
        r = i
        while root[r] != r:
            r = root[r]
        root[i] = r
    return root[seg].astype(np.int32)


def _modal(seg: NDArray[np.int32], region: NDArray[np.bool_]) -> NDArray[np.int32]:
    """A majority filter inside ``region`` (smooths staircase part borders)."""
    from skimage.filters.rank import modal
    from skimage.morphology import disk

    if seg.max() >= 65535:
        return seg
    radius = max(2, round(MODAL_FRACTION * float(np.hypot(*seg.shape))))
    m = modal(seg.astype(np.uint16), disk(radius), mask=region).astype(np.int32)
    out = seg.copy()
    ok = region & (m > 0)
    out[ok] = m[ok]
    return out


def absorb_small(labels: NDArray[np.int32], min_area: dict[int, float], default: float) -> NDArray[np.int32]:
    """Components of a label below its minimum area take the nearest other label."""
    out = labels.copy()
    small = np.zeros(labels.shape, bool)
    for lab in np.unique(labels):
        if lab == BACKGROUND:
            continue
        comp, n = ndi.label(labels == lab)
        if n == 0:
            continue
        sizes = ndi.sum(np.ones(labels.shape), comp, index=np.arange(1, n + 1))
        floor = min_area.get(int(lab), default)
        bad = np.flatnonzero(sizes < floor) + 1
        if bad.size:
            small |= np.isin(comp, bad)
    if not small.any():
        return out
    _, (ri, ci) = ndi.distance_transform_edt(small, return_indices=True)
    out[small] = labels[ri[small], ci[small]]
    return out


# ---------------------------------------------------------------------------
# The part map
# ---------------------------------------------------------------------------


def part_labels(image: LoadedImage, subject: NDArray[np.bool_]) -> PartLabels:
    """Label every pixel of the pipeline grid with its part (module docstring)."""
    shape = image.grayscale.shape
    rgb = _source_rgb(image)
    subject_area = float(subject.sum())

    faces = [
        f for f in detect_faces(rgb, shape)
        if subject[
            min(shape[0] - 1, max(0, round(f.box[1] + f.box[3] / 2))),
            min(shape[1] - 1, max(0, round(f.box[0] + f.box[2] / 2))),
        ]
    ]
    parses = [(f, parse_face(rgb, f, shape)) for f in faces]
    parses = [(f, p) for f, p in parses if confirms_face(face_part_labels([p], shape), f)]
    faces = [f for f, _ in parses]
    parsed = face_part_labels([p for _, p in parses], shape, on_subject=True) if parses else None

    if parsed is not None:
        labels = np.where(subject, np.where(parsed > BACKGROUND, parsed, UNPARSED), BACKGROUND)
        side = max(max(f.box[2], f.box[3]) for f in faces)
        feature_floor = (FEATURE_MIN_SIDE * side) ** 2
        labels = absorb_small(
            labels.astype(np.int32),
            {k: feature_floor for k in FEATURES},
            REGION_MIN_FRACTION * subject_area,
        )
        labels = irises(labels, image.lab)
        # Clothing is one parser class; its own parts (a collar, a lapel, a
        # braid lying on a sweater) are colour parts within it.
        assert image.lab is not None
        cloth = labels == CLOTH
        sub = colour_parts(image.lab, image.color_gradient, cloth, FIRST_COLOUR_PART)
        labels = np.where(cloth & (sub > 0), sub, labels)
        n = max(FIRST_COLOUR_PART, int(labels.max()) + 1)
        drawn = ~np.eye(n, dtype=bool)
        drawn[UNPARSED, :] = False
        drawn[:, UNPARSED] = False
        drawn[BACKGROUND, UNPARSED] = drawn[UNPARSED, BACKGROUND] = True
        return PartLabels(_frame_band(labels), drawn, tuple(faces), "face-parsing")

    assert image.lab is not None
    labels = colour_parts(image.lab, image.color_gradient, subject, FIRST_COLOUR_PART)
    n = int(labels.max()) + 1
    drawn = ~np.eye(max(n, FIRST_COLOUR_PART), dtype=bool)
    return PartLabels(_frame_band(labels), drawn, (), "colour-parts")


FRAME_BAND_PX = 3
IRIS_MIN_FRACTION, IRIS_MAX_FRACTION = 0.12, 0.8
IRIS_MIN_DELTA_L = 10.0


def irises(labels: NDArray[np.int32], lab_norm: NDArray[np.float64] | None) -> NDArray[np.int32]:
    """Split each parsed eye into its dark (iris and pupil) and the white.

    The parser's eye class is the whole opening between the lids; a drawing
    also shows the iris.  Within each eye, the pixels darker than the eye's
    Otsu threshold (their largest component) are the iris when they are a
    plausible share of the eye and clearly darker than the rest of it."""
    from skimage.filters import threshold_otsu

    if lab_norm is None:
        return labels
    lum = lab_norm[..., 0] * 100.0
    out = labels.copy()
    comp, n = ndi.label(np.isin(labels, EYES))
    for i in range(1, n + 1):
        eye = comp == i
        vals = lum[eye]
        if vals.size < 16 or float(vals.max() - vals.min()) < IRIS_MIN_DELTA_L:
            continue
        dark = eye & (lum < threshold_otsu(vals))
        parts, m = ndi.label(dark)
        if m == 0:
            continue
        sizes = ndi.sum(dark, parts, index=np.arange(1, m + 1))
        iris = ndi.binary_fill_holes(parts == int(np.argmax(sizes)) + 1) & eye
        share = float(iris.sum()) / float(eye.sum())
        if not IRIS_MIN_FRACTION <= share <= IRIS_MAX_FRACTION:
            continue
        if float(lum[eye & ~iris].mean() - lum[iris].mean()) < IRIS_MIN_DELTA_L:
            continue
        out[iris] = IRIS
    return out


def _frame_band(labels: NDArray[np.int32]) -> NDArray[np.int32]:
    """Carry the labels ``FRAME_BAND_PX`` in from the frame out to it, so a
    boundary meets the frame square-on and never runs along it (the frame is
    not a line of the subject)."""
    b = FRAME_BAND_PX
    h, w = labels.shape
    if h <= 2 * b + 1 or w <= 2 * b + 1:
        return labels
    out = labels.copy()
    out[:b, :] = out[b, :]
    out[-b:, :] = out[-b - 1, :]
    out[:, :b] = out[:, b : b + 1]
    out[:, -b:] = out[:, -b - 1 : -b]
    return out
