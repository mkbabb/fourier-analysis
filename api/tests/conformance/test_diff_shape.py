"""J.W2 conformance — the canonical ``/diff`` envelope (J-diff-shape.md §3/§4).

The cross-repo parity verdict at the J close is "both probes pass against §3/§4"
— NOT one repo's output asserted against the other's. THIS probe asserts
fourier's ``/diff`` envelope + ``AtomOp`` shape against the shape doc directly:
the four-field body ``{from_hash, to_hash, ops, identical}`` (snake — fourier's
Python wire; the §4 camelCase column is value.js's), the closed past-tense op
triple, the presence rule, and the WIRE (``ops``) vs STORED (``atom_diff``) split.
"""

from __future__ import annotations

import json

import api.routers.visualizations as viz
from api.models.visualization import VisualizationCreate, VisualizationRemix

from conftest import requires_mongo, run_db

from ._harness import bind, create_body, make_request, seed_fixtures

_TOK = {"X-Session-Token": "tok-alpha"}

# The canonical op vocabulary (J-diff-shape §2.1) — closed, past-tense.
_OP_VOCAB = {"added", "removed", "changed"}
# The canonical envelope fields (§3.2) — exactly four, snake on fourier's wire.
_ENVELOPE_FIELDS = {"from_hash", "to_hash", "ops", "identical"}
# The canonical AtomOp fields (§3.1) — op + atom_key always; before/after by rule.
_ATOMOP_FIELDS = {"op", "atom_key", "before", "after"}


async def _remix_then_diff(db, **overrides):
    bind(db)
    await seed_fixtures(db)
    raw = create_body()
    created = await viz.create_visualization(
        VisualizationCreate.model_validate_json(raw), make_request("POST", headers=_TOK, body=raw)
    )
    viz._idem_store = None
    slug = json.loads(bytes(created.body))["slug"]

    remix_raw = json.dumps(overrides).encode()
    path = f"/api/visualizations/{slug}/remix"
    resp = await viz.remix_visualization(
        slug, VisualizationRemix.model_validate_json(remix_raw),
        make_request("POST", path=path, headers=_TOK, body=remix_raw),
    )
    child_slug = json.loads(bytes(resp.body))["slug"]
    diff = await viz.get_diff(child_slug, make_request("GET", headers=_TOK), from_="", to="")
    version = await db.visualization_versions.find_one({"viz_slug": child_slug})
    return json.loads(bytes(diff.body)), version


@requires_mongo
def test_envelope_is_exactly_the_canonical_four_fields():
    payload, _ = run_db(lambda db: _remix_then_diff(db, n_harmonics=256))
    assert set(payload.keys()) == _ENVELOPE_FIELDS  # no fromSetHash/toSetHash (§2.4 dropped)
    assert isinstance(payload["ops"], list)  # always present, never null (§3.2)
    assert isinstance(payload["identical"], bool)
    assert payload["identical"] == (len(payload["ops"]) == 0)  # the convenience invariant


@requires_mongo
def test_atomop_shape_and_closed_op_vocabulary():
    payload, _ = run_db(lambda db: _remix_then_diff(db, n_harmonics=256))
    assert payload["ops"], "expected a non-empty diff for a changed atom"
    for op in payload["ops"]:
        assert set(op.keys()) <= _ATOMOP_FIELDS
        assert op["op"] in _OP_VOCAB  # closed, past-tense (no 'modified', no 4th op)
        assert isinstance(op["atom_key"], str)


@requires_mongo
def test_changed_op_carries_before_and_after():
    # Presence rule (§3.1): 'changed' has both before + after.
    payload, _ = run_db(lambda db: _remix_then_diff(db, n_harmonics=256))
    changed = [o for o in payload["ops"] if o["op"] == "changed"]
    assert changed
    assert changed[0]["before"] is not None and changed[0]["after"] is not None


@requires_mongo
def test_added_op_omits_before_present_rule():
    # palette set-from-null → 'added' (before absent/None, after present).
    payload, _ = run_db(lambda db: _remix_then_diff(db, palette_slug="aurora-dusk-fold"))
    added = [o for o in payload["ops"] if o["op"] == "added" and o["atom_key"] == "palette_slug"]
    assert added
    assert added[0]["before"] is None and added[0]["after"] == "aurora-dusk-fold"


@requires_mongo
def test_wire_ops_vs_stored_atom_diff_split():
    # §2.2: the WIRE field is `ops` (response body); the STORED field is
    # `atom_diff` (on the version document). Distinct names, same op shape.
    payload, version = run_db(lambda db: _remix_then_diff(db, n_harmonics=256))
    assert "ops" in payload and "atom_diff" not in payload  # wire body
    assert "atom_diff" in version and "ops" not in version  # stored edge
    # they coincide here (from == parent), same canonical op shape.
    assert payload["ops"] == version["atom_diff"]
