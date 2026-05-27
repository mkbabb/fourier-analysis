"""W3.12 spec — api/lib/crud/errors.py (CRUD-CONTRACT §0 SOTA-3, SCHEMA §5 / RFC 9457). Pure functions."""

import json

import pytest

from api.lib.crud import errors
from api.lib.crud.errors import ProblemDetails

# (helper-name, expected-status, expected-type-urn) per SCHEMA §5 catalog.
CATALOG = [
    ("slug_invalid", 400, "urn:contract:slug-invalid"),
    ("slug_conflict", 409, "urn:contract:slug-conflict"),
    ("owner_required", 401, "urn:contract:owner-required"),
    ("not_owner", 403, "urn:contract:not-owner"),
    ("not_found", 404, "urn:contract:not-found"),
    ("visibility_illegal_transition", 409, "urn:contract:visibility-illegal-transition"),
    ("soft_deleted", 410, "urn:contract:soft-deleted"),
    ("etag_mismatch", 412, "urn:contract:etag-mismatch"),
    ("precondition_required", 428, "urn:contract:precondition-required"),
    ("idempotency_replay_conflict", 409, "urn:contract:idempotency-replay-conflict"),
    ("cursor_invalid", 400, "urn:contract:cursor-invalid"),
    ("validation_failed", 422, "urn:contract:validation-failed"),
    ("session_invalid", 401, "urn:contract:session-invalid"),
    ("account_suspended", 403, "urn:contract:account-suspended"),
    ("payload_too_large", 413, "urn:contract:payload-too-large"),
    ("admin_not_configured", 503, "urn:contract:admin-not-configured"),
    ("admin_forbidden", 403, "urn:contract:admin-forbidden"),
    ("flag_self", 400, "urn:contract:flag-self"),
    ("flag_duplicate", 409, "urn:contract:flag-duplicate"),
    ("slug_pool_exhausted", 503, "urn:contract:slug-exhausted"),
]


def _body(resp):
    return json.loads(resp.body)


@pytest.mark.parametrize("name,status,type_", CATALOG)
def test_status_codes_match_catalog(name, status, type_):
    resp = getattr(errors, name)()
    assert resp.status_code == status
    assert _body(resp)["type"] == type_


@pytest.mark.parametrize("name,_status,_type", CATALOG)
def test_problem_content_type(name, _status, _type):
    assert getattr(errors, name)().media_type == "application/problem+json"


@pytest.mark.parametrize("name,_status,_type", CATALOG)
def test_problem_schema_validates(name, _status, _type):
    ProblemDetails.model_validate(_body(getattr(errors, name)()))


def test_rate_limited_content_type_and_schema():
    resp = errors.rate_limited(30)
    assert resp.media_type == "application/problem+json"
    body = _body(resp)
    assert body["type"] == "urn:contract:rate-limited" and body["status"] == 429
    ProblemDetails.model_validate(body)


def test_extras_flow_through():
    resp = errors.problem("urn:contract:slug-conflict", 409, "x", custom_field="y", slug="z")
    body = _body(resp)
    assert body["custom_field"] == "y" and body["slug"] == "z"


def test_rate_limited_sets_retry_after():
    assert errors.rate_limited(30).headers["Retry-After"] == "30"


def test_precondition_required_status_428():
    assert errors.precondition_required().status_code == 428


def test_catalog_has_21_rows():
    # 20 helper rows + rate_limited = 21 SCHEMA §5 catalog entries.
    assert len(CATALOG) == 20
    assert errors.rate_limited(1).status_code == 429
