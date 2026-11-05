"""C31 — the two-sided reproduction instrument (X·F F-D12 · F.W8 G3 limb (i)).

Specified by value.js ``docs/tranches/X/fourier/conformance/C31-two-sided-reproduction.md``
§4–§6: two controls, ``F8-C31A`` (the client method) and ``F8-C31B`` (the
operation method), each run three times — baseline, normal (one mutation of its
sole target), and an owner-only bypass — through ONE validator, the same one
that gates the real tree here (``test_the_tree_satisfies_the_contract``).

The leaves are derived each from its own source and nothing else (P-1, P-2):
the client leaf from ``web/src/lib/api.ts`` (``updateVisualization``'s request
method), the operation leaf from ``api/routers/visualizations.py`` (the
decorator on ``update_visualization``, read by ``ast``). The R6 registry
derived the operation leaf from the client (``CLIENT_MATCH_SOURCE_DERIVED``), so
a client edit failed both leaves (the adopted receipt: ``control.wrong-reason``,
both leaves in ``errors``, ``R4.C31``). ``test_the_wrong_reason_control_is_seen``
re-builds that registry on purpose and asserts the instrument rejects it: the
control arm that proves the instrument can see.

Mutations are applied to the source TEXT in memory, addressed by string, never
by line (§4.1), and nothing is written. No expected code is supplied (§4.2
constraint 5): acceptance compares the validator's own ``errors`` with the
declared target, as a set of leaf identities. Each run's plan, raw output and
receipt are content-addressed (constraint 1) and banked under ``C31_RECEIPTS``
when that is set.
"""

from __future__ import annotations

import ast
import hashlib
import json
import os
import re
from collections.abc import Callable
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[3]
CLIENT_SRC = ROOT / "web/src/lib/api.ts"
OPERATION_SRC = ROOT / "api/routers/visualizations.py"

# The contract the leaves answer to (CRUD-CONTRACT §0: update is a PATCH).
CONTRACT = {"visualization-update": "PATCH", "visualization-delete": "DELETE"}
CLIENT_FN = {"visualization-update": "updateVisualization", "visualization-delete": "deleteVisualization"}
OPERATION_FN = {"visualization-update": "update_visualization", "visualization-delete": "delete_visualization"}

CLIENT_TARGET = '{ method: "PATCH", body: { ...patch }, headers }'
OPERATION_TARGET = '@router.patch("/{slug}")\nasync def update_visualization('


# --- leaf derivations: each from its own source only ------------------------


def client_method(client_src: str, name: str) -> str | None:
    """The method literal in the named client function's request options."""
    m = re.search(rf"export async function {name}\(.*?\n}}\n", client_src, re.S)
    if m is None:
        return None
    found = re.search(r'method:\s*"([A-Z]+)"', m.group(0))
    return found.group(1) if found else None


def operation_method(operation_src: str, name: str) -> str | None:
    """The HTTP verb of the ``router.<verb>`` decorator on the named handler."""
    for node in ast.walk(ast.parse(operation_src)):
        if isinstance(node, ast.AsyncFunctionDef) and node.name == name:
            for dec in node.decorator_list:
                if isinstance(dec, ast.Call) and isinstance(dec.func, ast.Attribute):
                    return dec.func.attr.upper()
    return None


Registry = Callable[[str, str], dict[str, str | None]]


def registry(client_src: str, operation_src: str) -> dict[str, str | None]:
    """The derived leaves: ``client.method.<op>`` and ``operation.method.<op>``."""
    leaves: dict[str, str | None] = {}
    for op in CONTRACT:
        leaves[f"client.method.{op}"] = client_method(client_src, CLIENT_FN[op])
        leaves[f"operation.method.{op}"] = operation_method(operation_src, OPERATION_FN[op])
    return leaves


def r6_registry(client_src: str, operation_src: str) -> dict[str, str | None]:
    """The R6 shape, rebuilt for the wrong-reason control: the operation leaf is
    CLIENT_MATCH_SOURCE_DERIVED (read from the client), so it cannot be independent."""
    leaves = registry(client_src, operation_src)
    for op in CONTRACT:
        leaves[f"operation.method.{op}"] = leaves[f"client.method.{op}"]
    return leaves


# --- the one validator ------------------------------------------------------


def validate(leaves: dict[str, str | None], *, suppress: frozenset[str] = frozenset()) -> dict:
    """Each leaf passes when it carries its operation's contract method. Emits
    its own verdict; nothing here knows which control is running."""
    errors = sorted(
        leaf for leaf, value in leaves.items()
        if leaf not in suppress and value != CONTRACT[leaf.rsplit(".", 1)[1]]
    )
    return {"errors": errors, "closure": not errors, "verdict": "ACCEPT" if not errors else "REJECT"}


# --- a control: baseline · normal · owner-only bypass -----------------------


def _sha(obj: object) -> str:
    return hashlib.sha256(json.dumps(obj, sort_keys=True).encode()).hexdigest()


def run_control(control_id: str, target: str, mutate: Callable[[str, str], tuple[str, str]],
                derive: Registry = registry) -> dict:
    client, operation = CLIENT_SRC.read_text(), OPERATION_SRC.read_text()
    plan = {"controlId": control_id, "target": target}  # no expected code (constraint 5)
    base_leaves = derive(client, operation)
    mut_leaves = derive(*mutate(client, operation))
    runs = {
        "baseline": validate(base_leaves),
        "normal": validate(mut_leaves),
        "bypass": validate(mut_leaves, suppress=frozenset({target})),
    }
    raw = {"leaves": {"baseline": base_leaves, "mutated": mut_leaves}, "runs": runs}
    isolated = set(runs["normal"]["errors"]) == {target}
    retained = all(mut_leaves[k] == base_leaves[k] for k in base_leaves if k != target)
    receipt = {
        "controlId": control_id,
        "runs": runs,
        "owningLeaf": target,
        "isolated": isolated,
        "retained": retained,
        "closure": runs["bypass"]["closure"],
        "verdict": "ACCEPT" if (isolated and retained and runs["bypass"]["closure"]) else "REJECT",
        "code": None if (isolated and retained) else "control.wrong-reason",
    }
    shas = {"plan": _sha(plan), "raw": _sha(raw), "receipt": _sha(receipt)}
    if out := os.environ.get("C31_RECEIPTS"):
        d = Path(out) / control_id
        d.mkdir(parents=True, exist_ok=True)
        for name, obj in (("plan", plan), ("raw", raw), ("receipt", receipt)):
            (d / f"{name}.json").write_text(json.dumps(obj, sort_keys=True, indent=2))
        (d / "checksums.sha256").write_text("".join(f"{v}  {k}.json\n" for k, v in shas.items()))
    print(json.dumps({"receipt": receipt, "sha256": shas}, sort_keys=True))
    return receipt


def _client_put(client: str, operation: str) -> tuple[str, str]:
    assert client.count(CLIENT_TARGET) == 1, "P-4: the client target string is present exactly once"
    return client.replace(CLIENT_TARGET, CLIENT_TARGET.replace('"PATCH"', '"PUT"')), operation


def _operation_put(client: str, operation: str) -> tuple[str, str]:
    assert operation.count(OPERATION_TARGET) == 1, "the operation target string is present exactly once"
    return client, operation.replace(OPERATION_TARGET, OPERATION_TARGET.replace("router.patch", "router.put"))


# --- the gates --------------------------------------------------------------


def test_the_tree_satisfies_the_contract():
    """The validator over the real tree: every leaf present and passing."""
    leaves = registry(CLIENT_SRC.read_text(), OPERATION_SRC.read_text())
    assert None not in leaves.values(), leaves
    assert validate(leaves) == {"errors": [], "closure": True, "verdict": "ACCEPT"}


@pytest.mark.parametrize(
    ("control_id", "target", "mutate"),
    [
        ("F8-C31A", "client.method.visualization-update", _client_put),
        ("F8-C31B", "operation.method.visualization-update", _operation_put),
    ],
)
def test_each_control_isolates_its_leaf(control_id, target, mutate):
    """§6: owning-leaf isolation, all-non-owner retention, and bypass closure — for each of the pair."""
    receipt = run_control(control_id, target, mutate)
    assert receipt["runs"]["baseline"]["closure"] is True
    assert receipt["isolated"], receipt["runs"]["normal"]
    assert receipt["retained"]
    assert receipt["closure"]
    assert receipt["verdict"] == "ACCEPT"


def test_the_wrong_reason_control_is_seen():
    """The control arm: under the R6 derivation a client edit fails BOTH leaves,
    and the instrument must say so (the adopted R4.C31 receipt's shape)."""
    receipt = run_control("R4.C31", "client.method.visualization-update", _client_put, derive=r6_registry)
    assert receipt["verdict"] == "REJECT"
    assert receipt["code"] == "control.wrong-reason"
    assert set(receipt["runs"]["normal"]["errors"]) == {
        "client.method.visualization-update",
        "operation.method.visualization-update",
    }
    assert receipt["closure"] is False  # owner suppression retains the operation leaf
