"""J.W2 unit spec — the atom-diff PATTERN + the canonical_digest primitive.

Pure (no Mongo): the five-atom bag, per-atom + set-hash, the set-difference
diff, and the §12 one-serializer transposition. The cross-repo wire envelope is
asserted against ``docs/tranches/J/design/J-diff-shape.md`` in the conformance
suite; this file proves the algorithm.
"""

from __future__ import annotations

from datetime import UTC, datetime

from api.lib.crud import atomdiff
from api.lib.crud.atomdiff import diff_atoms, enumerate_atoms, set_hash
from api.lib.crud.canonical_digest import canonical_digest, canonical_json

# A canonical 5-atom source bag (palette bound).
_BASE = {
    "active_bases": ["fourier-epicycles"],
    "n_harmonics": 64,
    "contour_settings": {"blur_sigma": 0.5, "n_harmonics": 200},
    "animation_settings": {"fps": 30, "speed": 1.0},
    "palette_slug": "aurora-dusk-fold",
}


# ---------------------------------------------------------------------------
# canonical_digest (§12)
# ---------------------------------------------------------------------------


def test_canonical_digest_is_deterministic_and_order_independent():
    a = canonical_digest({"b": 2, "a": 1})
    b = canonical_digest({"a": 1, "b": 2})
    assert a == b
    assert len(a) == 64  # sha256 hex


def test_canonical_digest_handles_datetime():
    # The §1.2 sketch's json.dumps would crash on a datetime; the one primitive
    # serialises it to ISO-8601 (the elegance-headline fix).
    dt = datetime(2026, 6, 3, 12, 0, 0, tzinfo=UTC)
    digest = canonical_digest({"created_at": dt})
    assert isinstance(digest, str) and len(digest) == 64
    assert b"2026-06-03T12:00:00+00:00" in canonical_json({"created_at": dt})


def test_content_hash_byte_stability():
    # The transposed content-hash is byte-identical to the prior ad-hoc form.
    material = {"image_slug": "i", "contour_hash": "c", "active_bases": ["a"], "n_harmonics": 8}
    assert canonical_digest(material) == canonical_digest(dict(material))


# ---------------------------------------------------------------------------
# atom_hash / set_hash
# ---------------------------------------------------------------------------


def test_atom_hash_is_16_hex_and_stable():
    h = atomdiff.atom_hash("n_harmonics", 64)
    assert len(h) == 16
    assert h == atomdiff.atom_hash("n_harmonics", 64)
    assert h != atomdiff.atom_hash("n_harmonics", 128)


def test_set_hash_order_independent_over_active_bases():
    # [a,b] and [b,a] are the SAME basis set → same set_hash (the dedup property).
    left = enumerate_atoms({**_BASE, "active_bases": ["alpha", "beta"]})
    right = enumerate_atoms({**_BASE, "active_bases": ["beta", "alpha"]})
    assert set_hash(left) == set_hash(right)


def test_set_hash_distinguishes_a_changed_atom():
    a = enumerate_atoms(_BASE)
    b = enumerate_atoms({**_BASE, "n_harmonics": 128})
    assert set_hash(a) != set_hash(b)


def test_enumerate_omits_null_palette():
    # palette_slug is the one nullable atom: null → atom-absent from the bag.
    without = enumerate_atoms({**_BASE, "palette_slug": None})
    assert "palette_slug" not in without
    with_p = enumerate_atoms(_BASE)
    assert with_p["palette_slug"] == "aurora-dusk-fold"


# ---------------------------------------------------------------------------
# diff_atoms — the op vocabulary (added / removed / changed)
# ---------------------------------------------------------------------------


def test_diff_changed_scalar_atom():
    ops = diff_atoms(enumerate_atoms(_BASE), enumerate_atoms({**_BASE, "n_harmonics": 256}))
    assert [(o.op, o.atom_key) for o in ops] == [("changed", "n_harmonics")]
    assert ops[0].before == 64 and ops[0].after == 256


def test_diff_changed_sub_object_is_whole_atom_replace():
    # F-06: a settings sub-object diffs as ONE atom (whole-replace), not field-level.
    after = {**_BASE, "contour_settings": {"blur_sigma": 1.5, "n_harmonics": 200}}
    ops = diff_atoms(enumerate_atoms(_BASE), enumerate_atoms(after))
    assert [(o.op, o.atom_key) for o in ops] == [("changed", "contour_settings")]


def test_diff_added_and_removed_palette():
    base_no_p = enumerate_atoms({**_BASE, "palette_slug": None})
    base_p = enumerate_atoms(_BASE)
    added = diff_atoms(base_no_p, base_p)
    assert [(o.op, o.atom_key) for o in added] == [("added", "palette_slug")]
    assert added[0].before is None and added[0].after == "aurora-dusk-fold"
    removed = diff_atoms(base_p, base_no_p)
    assert [(o.op, o.atom_key) for o in removed] == [("removed", "palette_slug")]
    assert removed[0].after is None


def test_diff_identical_is_empty():
    assert diff_atoms(enumerate_atoms(_BASE), enumerate_atoms(_BASE)) == []


def test_diff_is_canonical_order_not_set_order():
    # Multiple changes emit in ATOM_KEY_ORDER, deterministically (ETag-able).
    after = {**_BASE, "palette_slug": None, "n_harmonics": 8, "active_bases": ["x"]}
    ops = diff_atoms(enumerate_atoms(_BASE), enumerate_atoms(after))
    keys = [o.atom_key for o in ops]
    assert keys == sorted(keys, key=atomdiff.ATOM_KEY_ORDER.index)
