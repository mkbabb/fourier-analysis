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
taken, so part boundaries come out smooth and sub-pixel placed.  The large
materials (neck, cloth, hair) are then re-voted with the image's own colours
(``material_revote``: a braid over a sweater is hair, though it lies where
cloth usually is), and a band of any part thinner than a line's cell is
drawn as the one line along its middle (``thin_to_line``).

**Everything else** has no parts here.  A subject with no face (an animal, a
cartoon, a robot) is one part, so only its silhouette is drawn from labels;
its interior lines, and those of the hair, clothes and body around a face,
come from the learned line drawing (``contours.lines``, composed by
``contours.drawing``).  Each parsed eye is split into its iris and white
(``irises``: an anatomical disc clipped by the lids), and each open mouth
into its teeth and the dark around them (``teeth``).  The nose and the skin
are one material (``FORM``): their shared outline is a line only where the
image marks it (``PartLabels.marked``).

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
from fourier_analysis.contours.person import person_cut

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
BROWS = (2, 3)
"""A brow is a band of hair on the skin: drawn by its spine, one stroke along
its length (``PartLabels.spined``), never by its outline (a closed box whose
end runs into the hairline)."""
LIPS = (12, 13)
MOUTH = 11
UNPARSED = N_FACE_CLASSES  # on the subject, no parser label
IRIS = UNPARSED + 1  # the dark of an eye (not a parser class; see ``irises``)
TEETH = IRIS + 1  # the bright of an open mouth (not a parser class; see ``teeth``)
N_LABELS = TEETH + 1
FORM = (SKIN, NOSE)
"""Parts of one material whose shared boundary is a line only where the
image marks it: the nose is skin, and its parser outline runs over the front
of the bridge where nothing is drawn, while its shadowed side and its base
are drawn.  Their form inside (the nose's wings and nostrils, the creases
from it into the cheeks) is the learned line drawing's."""
FACE_CORE = (*(k for k in FEATURES if k != NOSE), IRIS, TEETH)
"""The labels the face parser draws in full (a material against the skin:
brows, eyes, lips, the mouth): no other line source inks them."""

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

FACE_MIN_SCORE = 0.9
"""YuNet confidence for a face to be parsed: the detector's own published
operating point.  Below it the detector also fires on animal faces (a dog at
0.88), which the face parser and the person segmenter then both accept."""
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



@dataclass(frozen=True)
class Face:
    score: float
    box: tuple[float, float, float, float]  # x, y, w, h in pipeline pixels
    landmarks: tuple[tuple[float, float], ...] = ()
    """YuNet's five points (x, y pipeline pixels): the two eye centres, the
    nose tip and the two mouth corners."""


@dataclass(frozen=True)
class PartLabels:
    """A part label per pipeline pixel, and which label pairs are drawn."""

    labels: NDArray[np.int32]
    drawn: NDArray[np.bool_]  # (n_labels, n_labels): is the boundary a line
    marked: NDArray[np.bool_]  # (n_labels, n_labels): a line only where the image marks it
    faces: tuple[Face, ...]
    source: str  # "face-parsing" or "silhouette"
    spined: tuple[int, ...] = ()  # labels drawn by their spine, not their outline
    missed: NDArray[np.bool_] | None = None  # an eye the detector sees and the parser does not
    feature_lines: tuple[NDArray[np.float64], ...] = ()  # (row, col) lines of eyes and mouths the parser missed

    @property
    def subject(self) -> NDArray[np.bool_]:
        """The subject the labels were drawn on (cut to the person on a face)."""
        return self.labels != BACKGROUND

    @property
    def form(self) -> NDArray[np.bool_]:
        """The face's skin and nose (``FORM``): one surface, drawn by its form."""
        return np.isin(self.labels, FORM)

    @property
    def nose(self) -> NDArray[np.bool_]:
        return self.labels == NOSE

    @property
    def eyes(self) -> NDArray[np.bool_]:
        """The eyes and brows (``EYES``, ``IRIS``, ``BROWS``)."""
        return np.isin(self.labels, (*EYES, IRIS, *BROWS))

    @property
    def face_core(self) -> NDArray[np.bool_]:
        """Where the face parser owns the drawing (``FACE_CORE``)."""
        return np.isin(self.labels, FACE_CORE)


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
    cands: list[tuple[float, float, float, float, float, tuple[tuple[float, float], ...]]] = []
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
            kp = out[f"kps_{stride}"][0, i]
            marks = tuple(
                (float((c + kp[2 * j]) * stride * k), float((r + kp[2 * j + 1]) * stride * k)) for j in range(5)
            )
            cands.append((float(score[i]), (cx - bw / 2) * k, (cy - bh / 2) * k, bw * k, bh * k, marks))
    cands.sort(key=lambda t: t[0], reverse=True)
    kept: list[Face] = []
    for sc, x, y, bw, bh, marks in cands:
        if max(bw, bh) < FACE_MIN_SIDE_PX:
            continue
        if all(_iou((x, y, bw, bh), f.box) < FACE_NMS_IOU for f in kept):
            kept.append(Face(sc, (x, y, bw, bh), marks))
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
    return face_part_probs(parses, shape, on_subject)[0]


def face_part_probs(
    parses: list[tuple[NDArray[np.float32], tuple[int, int, int]]],
    shape: tuple[int, int],
    on_subject: bool = False,
) -> tuple[NDArray[np.int32], NDArray[np.float32]]:
    """``face_part_labels`` and, per pixel, the winning crop's class
    probabilities (``(H, W, N_FACE_CLASSES)``, zero outside every crop; with
    ``on_subject`` renormalised over the part classes, background zero)."""
    labels = np.zeros(shape, np.int32)
    conf = np.zeros(shape, np.float32)
    probs_out = np.zeros((*shape, N_FACE_CLASSES), np.float32)
    for probs, (r0, c0, s) in parses:
        rs, cs = max(0, r0), max(0, c0)
        re, ce = min(shape[0], r0 + s), min(shape[1], c0 + s)
        if re <= rs or ce <= cs:
            continue
        sub = probs[rs - r0 : re - r0, cs - c0 : ce - c0]
        if on_subject:
            sub = np.concatenate(
                [np.zeros_like(sub[..., :1]), sub[..., 1:] / np.maximum(1e-6, 1.0 - sub[..., :1])], axis=-1
            )
        lab = sub.argmax(axis=-1).astype(np.int32)
        p = sub.max(axis=-1)
        win = p > conf[rs:re, cs:ce]
        labels[rs:re, cs:ce][win] = lab[win]
        conf[rs:re, cs:ce][win] = p[win]
        probs_out[rs:re, cs:ce][win] = sub[win]
    return labels, probs_out


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
    if parses:
        parsed, probs = face_part_probs([p for _, p in parses], shape, on_subject=True)
        # A confirmed face makes the subject a person: what the saliency kept
        # beside them (a plant, a chair) is cut away (``contours.person``).
        subject = person_cut(rgb, subject)
        subject_area = float(subject.sum())
        labels = np.where(subject, np.where(parsed > BACKGROUND, parsed, UNPARSED), BACKGROUND)
        labels = material_revote(labels, probs, image.lab, REGION_MIN_FRACTION * subject_area)
        side = max(max(f.box[2], f.box[3]) for f in faces)
        feature_floor = (FEATURE_MIN_SIDE * side) ** 2
        labels = absorb_small(
            labels.astype(np.int32),
            {k: feature_floor for k in FEATURES},
            REGION_MIN_FRACTION * subject_area,
        )
        diag = float(np.hypot(*shape))
        for classes in (LIPS, *((k,) for k in MATERIALS)):
            labels = thin_to_line(labels, classes, THIN_FRACTION * diag)
        labels = teeth(irises(labels, image.lab), image.lab, feature_floor)
        # The dark of a smile between a lip and the teeth is a sliver (the
        # gum line): one line, where the lip meets the teeth.
        labels = thin_to_line(labels, (MOUTH,), THIN_FRACTION * diag)
        drawn = ~np.eye(N_LABELS, dtype=bool)
        drawn[UNPARSED, :] = False
        drawn[:, UNPARSED] = False
        drawn[BACKGROUND, UNPARSED] = drawn[UNPARSED, BACKGROUND] = True
        drawn[np.ix_(FORM, FORM)] = False
        drawn[BROWS, :] = drawn[:, BROWS] = False
        marked = np.zeros_like(drawn)
        marked[np.ix_(FORM, FORM)] = True
        marked &= ~np.eye(N_LABELS, dtype=bool)
        labels = _frame_band(labels)
        missed, lines = missed_features(labels, faces, image.lab)
        return PartLabels(labels, drawn, marked, tuple(faces), "face-parsing", BROWS, missed, lines)

    labels = np.where(subject, UNPARSED, BACKGROUND).astype(np.int32)
    drawn = np.zeros((UNPARSED + 1, UNPARSED + 1), dtype=bool)
    drawn[BACKGROUND, UNPARSED] = drawn[UNPARSED, BACKGROUND] = True
    return PartLabels(_frame_band(labels), drawn, np.zeros_like(drawn), (), "silhouette")


MATERIALS = (NECK, CLOTH, HAIR)
"""The parser's large material parts, told apart by their colour as well as
their place (``material_revote``)."""
MATERIAL_SEPARATION = 1.0
"""Two materials' colour models are told apart when their Bhattacharyya
distance is at least this (the Bayes error between them under ``exp(-1) / 2``,
about 0.18): a black braid on a beige sweater, not a white cravat on a white
neck in an engraving."""
MATERIAL_CORE_PX = 3
"""A material's colour is learned on its label eroded this far, off the
boundaries the parser is least sure of."""
MATERIAL_SIGMA_PX = 2.0
"""The fused evidence is read over this neighbourhood (pixels), so a
material's region is coherent, not pixel noise."""
MATERIAL_MAX_SIGMAS = 5.0
"""A colour this many standard deviations off a material's model is simply
not that material: the likelihood is capped there, so one far colour (a
beige pixel against a black model) does not outweigh its neighbours when the
evidence is read over a neighbourhood."""
MATERIAL_COLOUR_FLOOR = 4.0
"""Added to each colour covariance's diagonal (CIELAB units squared): the
colour noise of a flat region."""


def material_revote(
    labels: NDArray[np.int32],
    probs: NDArray[np.float32],
    lab_norm: NDArray[np.float64] | None,
    min_area: float,
) -> NDArray[np.int32]:
    """Re-vote the parser's large materials (``MATERIALS``: neck, cloth, hair)
    with the image's own colours.

    The parser places a material by where it usually lies around a face: a
    braid falling over a sweater lies where cloth usually is, and is labelled
    cloth, though it is the black of the hair.  Here each material's colour is
    modelled (a Gaussian in CIELAB, learned on the parser's own core of it,
    ``MATERIAL_CORE_PX`` in from its edges), and each pixel's material is
    the one with the most posterior evidence: the parser's probability (the
    prior) times the colour's likelihood, read over ``MATERIAL_SIGMA_PX``.
    A pixel moves only between two materials whose colours tell them apart
    (``MATERIAL_SEPARATION``), and a moved region smaller than ``min_area``
    (the part floor) goes back: it is a fleck or a rim of blended pixels,
    not a misplaced part."""
    if lab_norm is None:
        return labels
    lab = np.empty_like(lab_norm)
    lab[..., 0] = lab_norm[..., 0] * 100.0
    lab[..., 1:] = lab_norm[..., 1:] * 256.0 - 128.0
    lab = ndi.gaussian_filter(lab, (1.0, 1.0, 0.0))
    models: dict[int, tuple[NDArray[np.float64], NDArray[np.float64]]] = {}
    for k in MATERIALS:
        core = ndi.binary_erosion(labels == k, iterations=MATERIAL_CORE_PX)
        if core.sum() < max(16.0, min_area):
            continue
        x = lab[core]
        models[k] = (x.mean(axis=0), np.cov(x.T) + MATERIAL_COLOUR_FLOOR * np.eye(3))
    ks = list(models)
    if len(ks) < 2:
        return labels
    region = np.isin(labels, ks)
    post = {}
    for k in ks:
        mu, cov = models[k]
        d = lab - mu
        m2 = np.minimum(np.einsum("...i,ij,...j->...", d, np.linalg.inv(cov), d), MATERIAL_MAX_SIGMAS**2)
        ll = -0.5 * m2 - 0.5 * np.log(np.linalg.det(cov))
        post[k] = ndi.gaussian_filter(np.where(region, ll + np.log(np.maximum(probs[..., k], 1e-6)), 0.0), MATERIAL_SIGMA_PX)
    out = labels.copy()
    for a in ks:
        best = post[a].copy()
        choice = np.full(labels.shape, a, np.int32)
        for b in ks:
            if b == a or _bhattacharyya(models[a], models[b]) < MATERIAL_SEPARATION:
                continue
            better = post[b] > best
            best = np.where(better, post[b], best)
            choice = np.where(better, b, choice)
        moved = (labels == a) & (choice != a)
        out[moved] = choice[moved]
    moved = out != labels
    if moved.any():
        pieces, n = ndi.label(moved)
        sizes = ndi.sum(moved, pieces, np.arange(1, n + 1))
        back = np.isin(pieces, np.flatnonzero(sizes < min_area) + 1)
        out[back] = labels[back]
    return out


def _bhattacharyya(
    a: tuple[NDArray[np.float64], NDArray[np.float64]], b: tuple[NDArray[np.float64], NDArray[np.float64]]
) -> float:
    (m1, c1), (m2, c2) = a, b
    c = 0.5 * (c1 + c2)
    d = m1 - m2
    return float(
        d @ np.linalg.solve(c, d) / 8.0 + 0.5 * np.log(np.linalg.det(c) / np.sqrt(np.linalg.det(c1) * np.linalg.det(c2)))
    )


THIN_FRACTION = 0.015
"""A part band narrower than this (of the diagonal) is one line: its two
outlines run within one cell of the drawing's stroke-density scale
(``drawing.DENSITY_FRACTION``), where strokes side by side read as one
doubled strand, not two lines."""


EYE_ZONE_IOD = 0.25
"""An eye lies within this many inter-ocular distances of its landmark (an
eye opening is about half the inter-ocular distance across)."""
EYE_LINE_ZONE = (0.32, 0.16)
"""A missed eye's lid line lies within an ellipse on its landmark, these many
inter-ocular distances along and across the line of the eyes."""
MOUTH_ZONE = (0.6, 0.35)
"""A mouth lies within an ellipse on its corners' midpoint, these many mouth
widths along and across the line of the corners."""


def missed_features(
    labels: NDArray[np.int32], faces: list[Face], lab_norm: NDArray[np.float64] | None
) -> tuple[NDArray[np.bool_], tuple[NDArray[np.float64], ...]]:
    """The features the detector's landmarks place and the parser did not
    label (a painted eye in shadow, a closed mouth in an engraving), drawn
    as an artist draws a feature in shadow: by its one dark line.

    - An eye, when no eye label lies within ``EYE_ZONE_IOD`` of its
      landmark: its lid line, the dark valley of lashes and lid across the
      eye from corner to corner (the corners ``EYE_ZONE_IOD`` either side of
      the landmark along the line of the eyes: an eye opening is about half
      the inter-ocular distance across), inside ``EYE_LINE_ZONE``.
    - A mouth, when no mouth, lip or teeth label lies in its zone
      (``MOUTH_ZONE``): the dark valley between the lips, from one landmark
      corner to the other.

    The learned line drawing does not speak there: on the skin it draws a
    socket's shading as a box, not the eye.

    Returns the missed eyes' zones and the feature lines (``(row, col)``
    points)."""
    h, w = labels.shape
    yy, xx = np.mgrid[:h, :w]
    eyes_out = np.zeros(labels.shape, bool)
    lines: list[NDArray[np.float64]] = []
    for f in faces:
        if len(f.landmarks) < 5:
            continue
        eyes, mouth = np.asarray(f.landmarks[:2]), np.asarray(f.landmarks[3:5])
        iod = float(np.hypot(*(eyes[0] - eyes[1])))
        if iod < 4.0:
            continue
        axis = (eyes[1] - eyes[0]) / iod
        for e in eyes:
            zone = (xx - e[0]) ** 2 + (yy - e[1]) ** 2 <= (EYE_ZONE_IOD * iod) ** 2
            if np.isin(labels[zone], (*EYES, IRIS)).any():
                continue
            eyes_out |= zone
            corners = (e - EYE_ZONE_IOD * iod * axis, e + EYE_ZONE_IOD * iod * axis)
            line = _valley(lab_norm, _ellipse(xx, yy, e, axis, EYE_LINE_ZONE[0] * iod, EYE_LINE_ZONE[1] * iod), corners)
            if line is not None:
                lines.append(line)
        mw = float(np.hypot(*(mouth[0] - mouth[1])))
        if mw < 4.0:
            continue
        u = (mouth[1] - mouth[0]) / mw
        zone = _ellipse(xx, yy, mouth.mean(axis=0), u, MOUTH_ZONE[0] * mw, MOUTH_ZONE[1] * mw)
        if np.isin(labels[zone], (MOUTH, *LIPS, TEETH)).any():
            continue
        line = _valley(lab_norm, zone, (mouth[0], mouth[1]))
        if line is not None:
            lines.append(line)
    return eyes_out & (labels != BACKGROUND), tuple(lines)


def _ellipse(
    xx: NDArray[np.int_], yy: NDArray[np.int_], centre: NDArray[np.float64], u: NDArray[np.float64], a: float, b: float
) -> NDArray[np.bool_]:
    """The ellipse on ``centre`` with semi-axes ``a`` along the unit ``u``
    (x, y) and ``b`` across it."""
    dx, dy = xx - centre[0], yy - centre[1]
    along, across = dx * u[0] + dy * u[1], -dx * u[1] + dy * u[0]
    return (along / max(a, 1e-9)) ** 2 + (across / max(b, 1e-9)) ** 2 <= 1.0


def _valley(
    lab_norm: NDArray[np.float64] | None, zone: NDArray[np.bool_], ends: tuple[NDArray[np.float64], ...]
) -> NDArray[np.float64] | None:
    """The least-luminance path inside ``zone`` between two (x, y) ``ends``
    (a step costs ``MOUTH_VALLEY_FLOOR`` plus its luminance, 0 to 1 over the
    zone), as ``(row, col)`` points; ``None`` when an end lies off the zone."""
    from skimage.graph import route_through_array

    if lab_norm is None or not zone.any():
        return None
    h, w = zone.shape
    lum = lab_norm[..., 0]
    lo, hi = np.percentile(lum[zone], (1, 99))
    dark = np.clip((lum - lo) / max(hi - lo, 1e-6), 0.0, 1.0)
    cost = np.where(zone, MOUTH_VALLEY_FLOOR + dark, np.inf)
    rc = [(int(round(y)), int(round(x))) for x, y in ends]
    if not all(0 <= r < h and 0 <= c < w and zone[r, c] for r, c in rc):
        return None
    path, _ = route_through_array(cost, rc[0], rc[1], fully_connected=True, geometric=True)
    return np.asarray(path, dtype=np.float64)


MOUTH_VALLEY_FLOOR = 0.05
"""A step's cost is this plus its luminance (0 to 1 over the feature's zone):
the darkest pixel costs this little, so the path keeps to the valley."""


SIDE_SHARE = 0.2
"""A part lies between two others when each holds this share of its rim."""


def thin_to_line(labels: NDArray[np.int32], classes: tuple[int, ...], max_width: float) -> NDArray[np.int32]:
    """Where a part of ``classes`` is thinner than ``max_width`` it is drawn
    as one line.

    An upper lip stretched by a broad smile is a sliver, and so is the strip
    of cloth the parser leaves along a braid's lit edge, or the band of hair
    over a bald crown: drawn by its two outlines each is a doubled strand.
    The part's width at each pixel is twice the distance from its nearest
    skeleton point to the part's edge.  Each thin run of the part (a
    connected piece of its pixels where it is thinner than ``max_width``)
    gives its pixels to the nearest other part, so the parts on its two
    sides meet along its medial line, and their boundary, drawn there, is
    the one line.  Only a run between two other parts is (each holding
    ``SIDE_SHARE`` of its rim off ``classes``): a closed mouth's thin lips lie on
    the skin all round, their line is where they meet each other, and they
    keep their labels."""
    from skimage.morphology import skeletonize

    thin = np.zeros(labels.shape, bool)
    for k in classes:
        comp, n = ndi.label(labels == k)
        for i, sl in enumerate(ndi.find_objects(comp), start=1):
            if sl is None:
                continue
            sl = tuple(slice(max(0, a.start - 1), a.stop + 1) for a in sl)
            m = comp[sl] == i
            skel = skeletonize(m)
            if not skel.any():
                continue
            dt = ndi.distance_transform_edt(m)
            _, (ri, ci) = ndi.distance_transform_edt(~skel, return_indices=True)
            narrow = m & (2.0 * dt[ri, ci] < max_width)
            runs, n_runs = ndi.label(narrow)
            for j in range(1, n_runs + 1):
                run = runs == j
                ring = labels[sl][ndi.binary_dilation(run) & ~run]
                ring = ring[~np.isin(ring, classes)]
                sides = np.bincount(ring, minlength=1)
                if np.count_nonzero(sides >= SIDE_SHARE * max(1, ring.size)) >= 2:
                    thin[sl] |= run
    if not thin.any():
        return labels
    _, (ri, ci) = ndi.distance_transform_edt(thin, return_indices=True)
    out = labels.copy()
    out[thin] = labels[ri[thin], ci[thin]]
    return out


FRAME_BAND_PX = 3
IRIS_EYE_RATIO = 0.4
"""The visible iris's diameter over the eye opening's width (about 12 mm over
30 mm in an adult eye)."""
IRIS_MIN_DELTA_L = 10.0
"""The iris must be this much darker (CIELAB L) than the rest of the eye."""


def irises(labels: NDArray[np.int32], lab_norm: NDArray[np.float64] | None) -> NDArray[np.int32]:
    """Split each parsed eye into its iris and the white.

    The parser's eye class is the whole opening between the lids; a drawing
    also shows the iris.  The iris is a disc ``IRIS_EYE_RATIO`` of the eye's
    width across (its width read off the eye's principal axis), clipped by the
    lids (the eye region), placed where it covers the most eye darker than
    the eye's mean.  It is drawn only when it is clearly darker than the rest of the eye
    (``IRIS_MIN_DELTA_L``): a closed eye or a lit one has no visible iris."""
    if lab_norm is None:
        return labels
    lum = lab_norm[..., 0] * 100.0
    out = labels.copy()
    comp, n = ndi.label(np.isin(labels, EYES))
    for i, sl in enumerate(ndi.find_objects(comp), start=1):
        if sl is None:
            continue
        rows, cols = sl
        eye = comp[sl] == i
        if eye.sum() < 16:
            continue
        rr, cc = np.nonzero(eye)
        cov = np.cov(np.vstack([rr, cc]).astype(np.float64))
        width = 4.0 * float(np.sqrt(max(np.linalg.eigvalsh(cov)[-1], 0.0)))
        radius = 0.5 * IRIS_EYE_RATIO * width
        if radius < 1.5:
            continue
        k = int(np.ceil(radius))
        yy, xx = np.mgrid[-k : k + 1, -k : k + 1]
        disc = (yy**2 + xx**2 <= radius**2).astype(np.float64)
        # A matched filter: the disc goes where it covers the most eye darker
        # than the eye's mean (a shadowed lid rim covers too little of it).
        excess = np.where(eye, lum[sl][eye].mean() - lum[sl], 0.0)
        score = ndi.convolve(excess, disc, mode="constant")
        score[~eye] = -np.inf
        cy, cx = np.unravel_index(int(np.argmax(score)), eye.shape)
        gy, gx = np.mgrid[: eye.shape[0], : eye.shape[1]]
        iris = eye & ((gy - cy) ** 2 + (gx - cx) ** 2 <= radius**2)
        white = eye & ~iris
        if not white.any():
            continue
        if float(lum[sl][white].mean() - lum[sl][iris].mean()) < IRIS_MIN_DELTA_L:
            continue
        out[sl][iris] = IRIS
    return out


def teeth(
    labels: NDArray[np.int32], lab_norm: NDArray[np.float64] | None, min_area: float
) -> NDArray[np.int32]:
    """Split each parsed open mouth into its teeth and the dark around them.

    The parser's mouth class is everything between the lips; a drawing shows
    the teeth's edge against the dark of the mouth.  The mouth's luminance is
    split in two at Otsu's level; the bright class is the teeth when it is
    clearly brighter than the rest (``IRIS_MIN_DELTA_L``, the iris's test
    turned over) and each of its pieces is a feature, not a glint (``min_area``,
    the feature floor).  The luminance is first averaged over the mouth at
    half the feature floor's side, so the gaps between teeth close and the
    teeth come out as one band, drawn by its edge, not tooth by tooth.  A
    closed mouth, or one with no teeth showing, keeps its one label."""
    if lab_norm is None:
        return labels
    from skimage.filters import threshold_otsu

    lum = lab_norm[..., 0] * 100.0
    out = labels.copy()
    comp, n = ndi.label(labels == MOUTH)
    for i, sl in enumerate(ndi.find_objects(comp), start=1):
        if sl is None:
            continue
        mouth = comp[sl] == i
        if mouth.sum() < max(16.0, 2.0 * min_area):
            continue
        sigma = 0.5 * float(np.sqrt(min_area))
        weight = ndi.gaussian_filter(mouth.astype(np.float64), sigma)
        smooth = ndi.gaussian_filter(np.where(mouth, lum[sl], 0.0), sigma) / np.maximum(weight, 1e-6)
        values = smooth[mouth]
        if np.ptp(values) < IRIS_MIN_DELTA_L:
            continue
        bright = mouth & (smooth > threshold_otsu(values))
        bright = ndi.binary_opening(bright) & mouth
        pieces, m = ndi.label(bright)
        if m == 0:
            continue
        sizes = ndi.sum(bright, pieces, index=np.arange(1, m + 1))
        bright = np.isin(pieces, np.flatnonzero(sizes >= min_area) + 1)
        dark = mouth & ~bright
        if not bright.any() or not dark.any():
            continue
        if float(lum[sl][bright].mean() - lum[sl][dark].mean()) < IRIS_MIN_DELTA_L:
            continue
        out[sl][bright] = TEETH
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
