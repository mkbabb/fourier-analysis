"""The atom-diff PATTERN — authored once (fourier), adopted twice (value.js twin).

WAVE-D CORE (J.W1-crud-remix §3). A visualization's *remixable* state is a
small, flat, content-addressable bag of five named config atoms; a diff is a
per-atom set-difference; a remix is a fork plus a recorded atom-diff. This is a
shared-by-contract PATTERN (inv-16), NOT a shared package: the value.js twin
(``lib/crud/atomdiff.ts``) keys over ``PaletteColor[]`` instead of the five
config atoms, but the algorithm + the wire envelope are identical. Both bind to
the canonical repo-neutral shape doc ``docs/tranches/J/design/J-diff-shape.md``
(op vocabulary ``added``/``removed``/``changed`` — NOT ``modified``).

KISS guardrails (J.W1-crud-remix §0/§9): the atoms are a flat BAG (not a tree /
Merkle / document); the diff is a whole-atom replace (the diff-viewer field-diffs
a changed sub-object client-side, F-06); there is no three-way / DAG / merge.
"""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict

from api.lib.crud.canonical_digest import canonical_digest

# The closed, ordered atom set (J.W1-crud-remix §1.1). The order is canonical:
# ``diff_atoms`` iterates it (not set-iteration order) so a diff is deterministic
# and ETag-able. Adding an atom is a deliberate schema decision, never a default.
ATOM_KEY_ORDER: tuple[str, ...] = (
    "active_bases",
    "n_harmonics",
    "contour_settings",
    "animation_settings",
    "palette_slug",
)

AtomKey = Literal[
    "active_bases", "n_harmonics", "contour_settings", "animation_settings", "palette_slug"
]

# Sentinel for "this atom is absent from the bag" — distinct from a present
# ``None`` value (``palette_slug = None`` is a real atom state, §1.2).
_ABSENT: Any = object()


class AtomOp(BaseModel):
    """One atom-level change on a provenance edge (J-diff-shape §3.1).

    ``op`` is the closed past-tense triple ``added``/``removed``/``changed``;
    ``before``/``after`` are the raw (canonicalised) atom values. Presence rule:
    ``added`` has only ``after``; ``removed`` has only ``before``; ``changed``
    has both. The STORED field on the version document is ``atom_diff``; the WIRE
    field in the ``/diff`` response body is ``ops`` (J-diff-shape §2.2).
    """

    op: Literal["added", "removed", "changed"]
    atom_key: AtomKey
    before: Any = None
    after: Any = None

    model_config = ConfigDict(extra="forbid")


def _plain(value: Any) -> Any:
    """Canonicalise an atom value to a JSON-plain, deterministic form (F-05).

    A Pydantic sub-object (``ContourSettings`` / ``AnimationSettings``) → its
    ``model_dump()`` dict; ``active_bases`` is sorted (order-independent — the
    set, not the sequence, is the atom); everything else passes through.
    """
    if isinstance(value, BaseModel):
        return value.model_dump()
    return value


def enumerate_atoms(source: Mapping[str, Any] | Any) -> dict[str, Any]:
    """Name + extract the five config atoms as canonical values (the ONE seam).

    ``source`` is a Mongo document, a ``Visualization``-dumped dict, or a merged
    atom dict — anything mapping the five field names. ``active_bases`` is sorted
    (the basis SET is the atom, J.W1-crud-remix §1.2); the settings sub-objects
    are plain dicts. ``palette_slug`` is the one NULLABLE atom: a null binding is
    OMITTED from the bag (atom-absent), so the diff yields ``added``/``removed``
    when a binding is set-from / cleared-to null — the only two fourier atoms that
    add/remove (§3; J-diff-shape §5.4); the other four are always present and only
    ever ``change``. The value.js twin keys over ``PaletteColor[]`` by position.
    """
    get = source.get if isinstance(source, Mapping) else (lambda k, d=None: getattr(source, k, d))
    bases = get("active_bases", None) or []
    atoms: dict[str, Any] = {
        "active_bases": sorted(bases),
        "n_harmonics": get("n_harmonics", None),
        "contour_settings": _plain(get("contour_settings", None)),
        "animation_settings": _plain(get("animation_settings", None)),
    }
    palette = get("palette_slug", None)
    if palette is not None:
        atoms["palette_slug"] = palette
    return atoms


def atom_hash(key: str, value: Any) -> str:
    """Stable 16-hex (64-bit) digest of one keyed atom (J.W1-crud-remix §1.2).

    64 bits is collision-irrelevant at a five-atom cardinality; the full
    ``content_hash`` / ETag stay sha256. Uses the one ``canonical_digest``
    primitive over the ``{key: value}`` projection (§12).
    """
    return canonical_digest({key: value})[:16]


def set_hash(atoms: Mapping[str, Any]) -> str:
    """The order-independent atom-SET identity — the version's ``set_hash`` (§1.3).

    Two visualizations with the same atoms (regardless of ``active_bases`` array
    order) produce the same ``set_hash`` and dedup. The bag's hashes are sorted
    before digesting so the identity is independent of atom-iteration order.
    """
    hashes = sorted(atom_hash(k, v) for k, v in atoms.items())
    return canonical_digest(hashes)


def diff_atoms(before: Mapping[str, Any], after: Mapping[str, Any]) -> list[AtomOp]:
    """Set-difference two atom bags into per-atom ops (J-diff-shape §3.1).

    Iterates ``ATOM_KEY_ORDER`` (canonical, not set-iteration order) so the diff
    is deterministic + ETag-able. Equal atom-hash → no op (the dedup property).
    Repo-agnostic: works on any ``{key: value}`` bag (the value.js twin reuses
    it over color stops keyed by position).
    """
    ops: list[AtomOp] = []
    keys = set(before.keys()) | set(after.keys())
    for key in ATOM_KEY_ORDER:
        if key not in keys:
            continue
        b = before.get(key, _ABSENT)
        a = after.get(key, _ABSENT)
        if b is _ABSENT:
            ops.append(AtomOp(op="added", atom_key=key, after=a))
        elif a is _ABSENT:
            ops.append(AtomOp(op="removed", atom_key=key, before=b))
        elif atom_hash(key, b) != atom_hash(key, a):
            ops.append(AtomOp(op="changed", atom_key=key, before=b, after=a))
        # equal hash → no op (the dedup property)
    return ops
