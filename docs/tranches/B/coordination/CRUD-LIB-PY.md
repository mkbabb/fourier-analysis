# CRUD-LIB-PY — `api/lib/crud/` Python utility module spec

**Author**: U3 (fourier-B.W1 utility-spec lane).
**Companion**: `coordination/CRUD-CONTRACT.md` §1–§9 (binding behaviour);
`coordination/SCHEMA.md` (canonical types). This document is the
implementation surface fourier-B.W3 was to ship at `api/lib/crud/`.
value.js-C was to ship an analogous TypeScript module; the binding is at
the *contract*, not the code. Per the orphan verdict at
`coordination/CRUD-CONSTELLATION.md`, the U3 surface is preserved here as
the substrate for any successor tranche.

## Goal criterion (document-level)

Author the Python-side utility module — eight sub-modules at
`api/lib/crud/{slugs,cursors,errors,etag,idempotency,softdelete,pinned_cron}.py`
plus `__init__.py` — that realises CRUD-CONTRACT §1–§9 + SCHEMA.md §1
SOTA conventions as small, framework-free helpers each router calls
explicitly. The Wχ-P1 "framework-in-disguise" probe is the test this
design is built against; a successful design lets a hand-rolled FastAPI
route invoke any helper in three lines, with no `BaseCRUDRouter`,
`CRUDMixin`, or `@crud_endpoint` decorator owning the request
lifecycle.

## Completion criterion (document-level)

The eight sub-module sections below each carry a goal+completion block,
an API-signature block, an integration example, and a test-surface
enumeration. The aggregate LOC ceiling is **~500** (excluding tests);
sub-module budgets sum to **~535**; the integration cost shaves that
through helper-sharing (the canonical-JSON helper is shared by `etag.py`
and `idempotency.py` — counted once).

**Shape invariant** (load-bearing): pure utilities. Small functions,
small classes. **No** `BaseCRUDRouter`, **no** `CRUDMixin`, **no**
`@crud_endpoint` decorator that owns the request lifecycle.

**Dependency surface**: stdlib + Pydantic v2 + Motor + FastAPI primitives
(`Request`, `Response`, `HTTPException`, `Depends`). No new heavy deps.

## Module layout

```
api/lib/crud/
├── __init__.py        (~20 LOC) — public re-exports + contract section index
├── slugs.py           (~70 LOC) — generation, validation, insert-retry loop
├── cursors.py         (~80 LOC) — opaque base64url cursor encode/decode/paginate
├── errors.py          (~90 LOC) — RFC 9457 problem+json envelope + helpers
├── etag.py            (~70 LOC) — compute_etag + If-Match Depends
├── idempotency.py     (~110 LOC) — Mongo-backed 24h replay store
├── softdelete.py      (~50 LOC) — deleted_at mixin + helpers
└── pinned_cron.py     (~45 LOC) — mark_pinned + bounded cron_prune
```

Tests at `api/tests/lib/crud/test_{slugs,cursors,errors,etag,idempotency,softdelete,pinned_cron}.py`.

---

## §1 — `slugs.py` (~70 LOC budget)

**Goal.** A 70-LOC module that owns slug generation, validation, and
the insert-then-catch retry loop for CRUD-CONTRACT §2 — replacing the
two-line `coolname`-delegate at `api/slugs.py:8-10` and retiring the
TOCTOU pre-check at `api/services/image_storage.py:74-77`.

**What.** Three public symbols: `generate_slug()`, `validate_slug(s)`,
`slug_with_retry(insert_fn, max_attempts=10)`; one constant
`SLUG_PATTERN`. Module-init loads the word-lists once from
`PRECEPTS_DIR/slug-words.json` (per U2) and validates counts, pattern,
non-empty, no-duplicates.

**Why.** Centralises the slug-generation surface so the C2.1, C2.2,
C2.3, C2.4 conformance rows have one implementation to bind against;
retires the build-phase race condition before it can leak into the
converged `visualization` collection.

**Completion.** All seven `test_slugs.py` rows PASS (pattern match on
1,000 generated slugs; validate-slug negatives; retry on
`DuplicateKeyError`; 503 on exhaustion; word-list-loader smoke;
words-in-list).

Implements **CRUD-CONTRACT §2** (slug algorithm + collision retry).

### Internal types

```python
SlugWordLists = TypedDict("SlugWordLists", {
    "adjectives": list[str],
    "verbs": list[str],
    "color_terms": list[str],
    "animals": list[str],
})
```

### Module-init

Word lists loaded **once** at module import via the U2-spec'd loader from
`precepts/<path>`. Resolution order (U2 binds the literal):

1. `PRECEPTS_DIR` env var → `<dir>/slug-words.json`.
2. Submodule fallback: `<repo>/precepts/data/slug-words.json`.

Validates: each list ≥ 64 entries; each entry matches `^[a-z]+$`;
deterministic hash logged at import (matches §2 word-list `data`
disposition, R3 outcome).

Cryptographic RNG: `secrets.choice` per CRUD-CONTRACT §2 "Generation"
(supersedes today's `coolname` → `random.choice` at `api/slugs.py:10`).
**Wave-2 amendment (2026-05-26 per C1 §6 #4 HIGH and B.md §2 Invariant
21 — Slug-mint cryptographic RNG)**: the substrate at HEAD `f8db2c6`
empirically uses Mersenne (CPython `random.choice` via `coolname`); the
W3 landing of this module discharges Invariant 21 by using
`secrets.choice` throughout. The U-slugs-1 conformance row at
`CONFORMANCE-MATRIX.md §U.1` ratifies the pattern-conformance; the
cryptographic-RNG discipline is bound by the invariant.

### API signatures

```python
def generate_slug() -> str:
    """4-word adjective-verb-color-animal slug. Cryptographic RNG.

    Returns a string matching ``^[a-z]+(-[a-z]+){3}$`` (CRUD-CONTRACT §2).
    """

SLUG_PATTERN: Final[re.Pattern] = re.compile(r"^[a-z]+(-[a-z]+){3}$")

def validate_slug(s: str) -> bool:
    """Pure predicate. Does *not* check word-list membership."""

async def slug_with_retry(
    insert_fn: Callable[[str], Awaitable[Any]],
    *,
    max_attempts: int = 10,
) -> str:
    """Generate-then-insert-then-catch-DuplicateKeyError loop.

    ``insert_fn`` is an async callable receiving the candidate slug; it
    must perform the unique-index insert. On ``pymongo.errors.DuplicateKeyError``
    the loop retries with a fresh slug. After ``max_attempts`` failures
    raises ``HTTPException(503, ...)`` with the problem+json
    ``urn:contract:slug-pool-exhausted`` per CRUD-CONTRACT §2.

    Retires the TOCTOU pre-check at ``api/services/image_storage.py:75-77``.
    """
```

### Integration example

```python
# api/routers/visualizations.py
from api.lib.crud import slugs, errors

@router.post("")
async def create_visualization(body: VisualizationCreate, ...):
    async def _insert(candidate: str) -> None:
        doc = body.model_dump() | {"slug": candidate, "owner_slug": owner, ...}
        await db.visualizations.insert_one(doc)

    slug = await slugs.slug_with_retry(_insert, max_attempts=10)
    return {"slug": slug, ...}
```

### Test surface (`test_slugs.py`)

- `test_generate_slug_matches_pattern` — 1,000 generated slugs all match `SLUG_PATTERN` (CRUD-CONTRACT C2.1).
- `test_validate_slug_negatives` — rejects: empty, single word, mixed case, digits, leading/trailing hyphen, 3 or 5 words.
- `test_slug_with_retry_succeeds_first_try` — `insert_fn` no-raise → 1 invocation; returned slug matches the inserted one.
- `test_slug_with_retry_recovers_from_dup_key` — `insert_fn` raises `DuplicateKeyError` twice then succeeds; assertion: 3 invocations, terminal slug returned (CRUD-CONTRACT C2.2).
- `test_slug_with_retry_exhausts` — `insert_fn` always raises; asserts `HTTPException.status_code == 503` after 10 attempts.
- `test_slug_words_load_from_precepts` — monkeypatch `PRECEPTS_DIR`; assert lists loaded match the fixture file.
- `test_words_in_list` — every generated slug's four tokens belong to the loaded word lists (CRUD-CONTRACT C2.4).

---

## §2 — `cursors.py` (~80 LOC budget)

**Goal.** An 80-LOC module that owns the opaque-base64url-cursor
encode/decode/paginate primitives — unifying the existing
`api/routers/gallery.py:57-71` helpers and value.js's
`palettes.ts:29-41` helpers into one Python form (and a parallel TS
form in CRUD-LIB-TS).

**What.** Four public symbols: `encode_cursor`, `decode_cursor`,
`paginate`, `next_cursor_from_last`; one model `CursorPayload`. The
algorithm is a direct port — `base64url(JSON.stringify({id, sort_key,
sort_value}))` — with stale-sort detection (cursor.sort_key !=
request.sort_key → 400).

**Why.** Cursors are the canonical pagination shape (per SCHEMA §1 and
CRUD-CONTRACT §0 SOTA-1); a single helper collapses two near-identical
implementations and binds the CS1.1–CS1.3 + U-cursors-1–4 conformance
rows to one source.

**Completion.** Seven `test_cursors.py` rows PASS (round-trip; None
input; garbage 400; stale sort 400; first-page query; subsequent-page
`$or` tie-breaker; next_cursor round-trip).

Implements **CRUD-CONTRACT §0 SOTA-1** + **SCHEMA §1 cursor block**.
Direct port of value.js's `~/Programming/value.js/api/src/routes/palettes.ts:29-41`
(`decodeCursor` / `encodeCursor`) and fourier's
`api/routers/gallery.py:57-71` (`_encode_cursor` / `_decode_cursor`).
Both forms collapse to one helper.

### Internal types

```python
class CursorPayload(BaseModel):
    """Decoded shape of an opaque pagination cursor (SCHEMA §2 `CursorPayload`)."""
    id: str                                    # ObjectId-as-string, tie-breaker
    sort_key: Literal["newest", "popular", "most-forked", "views", "likes"]
    sort_value: str | int                      # ISO timestamp or non-negative integer

Sort = list[tuple[str, int]]                   # Motor sort spec
```

### API signatures

```python
def encode_cursor(payload: CursorPayload | dict) -> str:
    """Base64url-encode a CursorPayload. URL-safe; no '=' padding."""

def decode_cursor(raw: str | None) -> CursorPayload | None:
    """Decode + validate. Returns None for None input.

    Raises ``HTTPException(400, problem='urn:contract:cursor-invalid')`` on:
    base64url decode failure, JSON parse failure, schema validation failure.
    Returning *None* (vs raising) is reserved for "no cursor supplied".
    """

def paginate(
    base_query: dict,
    cursor: CursorPayload | None,
    *,
    sort_key: str,
    sort_dir: int = -1,
) -> tuple[dict, Sort]:
    """Combine ``base_query`` with cursor predicates; return (query, sort).

    Algorithm (ported from ``palettes.ts:208-224`` and ``gallery.py:155-163``):
        sort_field, _ = SORT_KEYS[sort_key]
        if cursor:
            base_query["$or"] = [
                {sort_field: {sort_dir_op: cursor.sort_value}},
                {sort_field: cursor.sort_value, "_id": {sort_dir_op: ObjectId(cursor.id)}},
            ]
        return base_query, [(sort_field, sort_dir), ("_id", sort_dir)]

    Stale-sort detection (cursor.sort_key != sort_key) raises
    ``HTTPException(400, problem='urn:contract:cursor-invalid')``.
    """

def next_cursor_from_last(doc: dict, *, sort_key: str) -> str:
    """Build the next-page cursor from the last item of a `limit+1` query.

    Mirrors ``palettes.ts:247-256``.
    """
```

### Integration example

```python
# api/routers/visualizations.py — list endpoint
from api.lib.crud import cursors

@router.get("")
async def list_visualizations(cursor: str | None = None, sort: str = "newest", limit: int = 20):
    decoded = cursors.decode_cursor(cursor)
    query, sort_spec = cursors.paginate(
        {"visibility": "public", "deleted_at": None},
        decoded,
        sort_key=sort,
    )
    results = await db.visualizations.find(query).sort(sort_spec).limit(limit + 1).to_list(None)
    has_more = len(results) > limit
    results = results[:limit]
    next_c = cursors.next_cursor_from_last(results[-1], sort_key=sort) if has_more else None
    return {"data": results, "next_cursor": next_c, "has_more": has_more}
```

### Test surface (`test_cursors.py`)

- `test_encode_round_trip` — `decode_cursor(encode_cursor(payload)) == payload` for 100 randomised payloads.
- `test_decode_none_returns_none` — `decode_cursor(None) is None`.
- `test_decode_garbage_400` — input `"not-base64!!"` raises `HTTPException(400)` with body matching `urn:contract:cursor-invalid`.
- `test_decode_stale_sort_400` — cursor with `sort_key='newest'`, request says `sort='popular'` → 400.
- `test_paginate_first_page` — `cursor=None` returns base query unchanged plus sort spec.
- `test_paginate_subsequent_page` — query has the `$or` tie-breaker matching `palettes.ts:208-224`.
- `test_next_cursor_from_last` — round-trips through `decode_cursor` to recover the same `sort_value` and `id`.

---

## §3 — `errors.py` (~90 LOC budget)

**Goal.** A 90-LOC module that owns the RFC 9457 problem+json envelope
plus one one-line helper per row of SCHEMA §5 — replacing the bare
`HTTPException(detail="…")` calls across `api/routers/*.py` site by
site.

**What.** One model `ProblemDetails`, one builder `problem(...)`, and
twenty one-line helpers (`slug_invalid`, `slug_conflict`,
`owner_required`, …) — one per row of the SCHEMA §5 catalog.

**Why.** The contract requires `application/problem+json` per
CRUD-CONTRACT §0 SOTA-3; emitting consistent `(type, status, title)`
triples across both repos requires one helper per catalog row that the
matrix can pin (CS5.1, CS5.2, U-errors-1–3).

**Completion.** Six `test_errors.py` rows PASS (content-type;
schema-validates; status-codes-match-catalog parametrised over 20
helpers; extras flow through; rate_limited sets Retry-After; 428 for
precondition-required).

Implements **CRUD-CONTRACT §0 SOTA-3** + **SCHEMA §5 error catalog**
(RFC 9457). Replaces the bare `HTTPException(detail="…")` calls across
`api/routers/*.py` with `application/problem+json` envelopes.

### Internal types

```python
class ProblemDetails(BaseModel):
    """RFC 9457 Problem Details for HTTP APIs (SCHEMA §2)."""
    type: str                       # URN: 'urn:contract:<slug>'
    title: str
    status: int
    detail: str | None = None
    instance: str | None = None
    errors: list[FieldError] | None = None
    model_config = ConfigDict(extra="allow")  # extras flow through

class FieldError(BaseModel):
    path: str                       # JSON pointer to offending field
    message: str
```

### API signatures

```python
def problem(
    type_: str,
    status: int,
    title: str,
    *,
    detail: str | None = None,
    instance: str | None = None,
    headers: dict[str, str] | None = None,
    **extras: Any,
) -> JSONResponse:
    """Return a JSONResponse with media_type='application/problem+json'.

    The ``extras`` are merged into the body verbatim (per RFC 9457 ``additionalProperties: true``).
    """

# Per-error helpers — one per row of SCHEMA §5 (20 helpers, 1 line each):

def slug_invalid(detail: str | None = None) -> JSONResponse: ...
def slug_conflict(slug: str) -> JSONResponse: ...
def owner_required() -> JSONResponse: ...
def not_owner() -> JSONResponse: ...
def not_found(resource: str, slug: str | None = None) -> JSONResponse: ...
def visibility_illegal_transition(from_: str, to: str) -> JSONResponse: ...
def soft_deleted() -> JSONResponse: ...
def etag_mismatch(expected: str, received: str) -> JSONResponse: ...
def precondition_required() -> JSONResponse: ...
def idempotency_replay_conflict() -> JSONResponse: ...
def cursor_invalid(reason: str) -> JSONResponse: ...
def rate_limited(retry_after: int) -> JSONResponse: ...  # sets Retry-After header
def validation_failed(errors: list[FieldError]) -> JSONResponse: ...
def session_invalid() -> JSONResponse: ...
def account_suspended() -> JSONResponse: ...
def payload_too_large(limit_bytes: int) -> JSONResponse: ...
def admin_not_configured() -> JSONResponse: ...
def admin_forbidden() -> JSONResponse: ...
def flag_self() -> JSONResponse: ...
def flag_duplicate() -> JSONResponse: ...
def slug_pool_exhausted() -> JSONResponse: ...   # 503; consumed by slugs.slug_with_retry
```

### Integration example

```python
# api/routers/visualizations.py
from api.lib.crud import errors

@router.get("/{slug}")
async def get_visualization(slug: str):
    if not validate_slug(slug):
        return errors.slug_invalid(detail=f"slug={slug!r} does not match contract pattern")
    doc = await db.visualizations.find_one({"slug": slug, "deleted_at": None})
    if not doc:
        return errors.not_found("visualization", slug)
    return doc
```

### Test surface (`test_errors.py`)

- `test_problem_content_type` — every helper returns `media_type == "application/problem+json"`.
- `test_problem_schema_validates` — body JSON validates against the `ProblemDetails` Pydantic model.
- `test_status_codes_match_catalog` — assert each helper's status equals the SCHEMA §5 row (parametrised over the 20 helpers).
- `test_extras_flow_through` — `problem(..., custom_field="x")` → response body contains `custom_field: "x"`.
- `test_rate_limited_sets_retry_after` — `rate_limited(30)` → `headers["Retry-After"] == "30"`.
- `test_precondition_required_status_428` — explicit (CRUD-CONTRACT §0 SOTA-2 cross-check).

---

## §4 — `etag.py` (~70 LOC budget)

**Goal.** A 70-LOC module that owns the strong-validator ETag
computation and the `If-Match` FastAPI dependency — adding optimistic
concurrency to PATCH/DELETE on a surface that today is last-write-wins.

**What.** Three public symbols: `compute_etag(doc, fields=...)`,
`require_if_match(request, expected_etag)` (a FastAPI `Depends`-able
callable), `set_etag_header(response, doc)`. A private
`_canonical_json` helper is shared with `idempotency.py`.

**Why.** RFC 9110 §13.1.1 / §8.8 prescribe the shape; CRUD-CONTRACT §0
SOTA-2 binds it. CS2.1, CS2.2, and U-etag-1–5 conformance rows verify
that two concurrent PATCHes do not silently lose-update one another.

**Completion.** Seven `test_etag.py` rows PASS (stable for same doc;
differs on field change; field-order-independent; missing If-Match 428;
mismatched If-Match 412; wildcard accepted; set_etag_header format).

Implements **CRUD-CONTRACT §0 SOTA-2** + **SCHEMA §1 ETag block**.
Optimistic concurrency on UPDATE/DELETE.

### Internal types

```python
_MUTABLE_FIELDS_KEY = "_content"   # marker for canonical-JSON projection
```

A small canonical-JSON helper:

```python
def _canonical_json(obj: Any) -> bytes:
    """Stable serialisation: sort_keys=True, no whitespace, UTC ISO timestamps."""
```

Shared with `idempotency.py` (counted once toward LOC budget).

### API signatures

```python
def compute_etag(doc: dict, *, fields: Iterable[str] | None = None) -> str:
    """Strong ETag from canonical JSON over mutable fields.

    Algorithm: ``sha256(canonical_json({k: doc[k] for k in fields or doc}))``,
    wrapped as ``"<lowercase-hex>"`` (quotes included, no ``W/`` weak prefix
    — SCHEMA §1 ETag block says strong validator).

    Default ``fields`` for a visualization (per SCHEMA §3 mutable shape):
    ``("visibility", "title", "description", "tags", "palette_slug", "updated_at")``.
    """

async def require_if_match(
    request: Request,
    expected_etag: str,
) -> None:
    """FastAPI dependency. Compatible with ``Depends``.

    - Missing ``If-Match`` header → ``HTTPException(428, problem='urn:contract:precondition-required')``.
    - Header value ``!= expected_etag`` → ``HTTPException(412, problem='urn:contract:etag-mismatch')``.
    - Wildcard ``If-Match: *`` is accepted (means "match any current state").
    """

def set_etag_header(response: Response, doc: dict, **kwargs) -> str:
    """Compute the ETag, set ``response.headers["ETag"]``, return the value.

    Convenience for read endpoints that want clients to send the ETag back on PATCH.
    """
```

### Integration example

```python
# api/routers/visualizations.py
from api.lib.crud import etag, errors

@router.get("/{slug}")
async def get_visualization(slug: str, response: Response):
    doc = await db.visualizations.find_one({"slug": slug})
    if not doc: return errors.not_found("visualization", slug)
    etag.set_etag_header(response, doc)
    return doc

@router.patch("/{slug}")
async def update_visualization(slug: str, request: Request, body: VisualizationUpdate):
    doc = await db.visualizations.find_one({"slug": slug})
    if not doc: return errors.not_found("visualization", slug)
    await etag.require_if_match(request, etag.compute_etag(doc))
    # safe to apply mutation; recompute ETag for the response
    ...
```

### Test surface (`test_etag.py`)

- `test_etag_stable_for_same_doc` — `compute_etag(doc) == compute_etag(doc)` over 100 randomised docs.
- `test_etag_differs_on_field_change` — changing any mutable field yields a different ETag.
- `test_etag_field_order_independent` — `compute_etag({"a":1,"b":2}) == compute_etag({"b":2,"a":1})`.
- `test_require_if_match_missing_428` — request without `If-Match` raises 428 (CRUD-CONTRACT §0 SOTA-2 + SCHEMA §5 `urn:contract:precondition-required`).
- `test_require_if_match_mismatch_412` — different ETag value raises 412.
- `test_require_if_match_wildcard` — `If-Match: *` accepted without comparison.
- `test_set_etag_header` — `response.headers["ETag"]` equals the returned value, format `"<hex>"`.

---

## §5 — `idempotency.py` (~110 LOC budget)

**Goal.** A 110-LOC module that owns the Mongo-backed
`Idempotency-Key` replay store with 24-hour TTL — the longest of the
seven sub-modules because it carries a model, an index lifecycle, and
the explicit replay-or-record envelope.

**What.** One model `_IdempotencyRecord`; one class `IdempotencyStore`
with `ensure_indexes` / `lookup` / `store` methods; one function
`replay_or_record(request, store, scope, handler)` that wraps the write
handler. **Not** a decorator; invoked explicitly to preserve the
no-framework-in-disguise discipline.

**Why.** CRUD-CONTRACT §0 SOTA-4 + §12 open-item "Decide at W3" between
in-memory and Mongo-TTL — this spec binds Mongo-TTL (single-replica
friendly, survives restart, no in-process memory growth). The CS3.1,
CS3.2, and U-idem-1–3 rows verify the replay semantics.

**Completion.** Seven `test_idempotency.py` rows PASS (no-header
pass-through; first-request records; replay returns stored; different
body 409; scope isolation; TTL index; upsert-store idempotency).

Implements **CRUD-CONTRACT §0 SOTA-4** (`Idempotency-Key` header,
Stripe / IETF draft). Mongo-backed 24h replay store. Per
CRUD-CONTRACT §12 open-items: "Decide at W3" between in-memory and
Mongo-TTL; this spec binds **Mongo TTL** (single-replica friendly,
survives restart, no in-process memory growth).

### Internal types

```python
class _IdempotencyRecord(BaseModel):
    """One row of the ``idempotency`` Mongo collection."""
    key: str                          # Idempotency-Key header value, ≤255 chars
    scope: str                        # user_slug OR session token (for anonymous)
    request_hash: str                 # sha256(canonical body + path + method)
    status: int
    response_body: bytes              # serialised JSON
    response_headers: dict[str, str]
    created_at: datetime              # TTL index target; 24h expiry

class IdempotencyStore:
    """Wraps the Mongo collection with insert + lookup primitives.

    The collection is created at startup with a TTL index on
    ``created_at`` (expireAfterSeconds=86400). Mirrors the
    ``sessions.expires_at`` TTL idiom at ``api/services/database.py:60-65``.
    """
    def __init__(self, db: AsyncIOMotorDatabase, collection: str = "idempotency"): ...
    async def ensure_indexes(self) -> None: ...
    async def lookup(self, key: str, scope: str, request_hash: str) -> _IdempotencyRecord | None: ...
    async def store(self, record: _IdempotencyRecord) -> None: ...
```

### API signatures

```python
async def replay_or_record(
    request: Request,
    store: IdempotencyStore,
    scope: str,
    handler: Callable[[], Awaitable[Response]],
) -> Response:
    """Idempotency-Key envelope around a write handler.

    Semantics (RFC draft + Stripe behaviour):
      - No ``Idempotency-Key`` header → call ``handler()`` directly.
      - Key present, no record → call ``handler()``, store the response, return.
      - Key present, record exists, request_hash matches → return stored response.
      - Key present, record exists, request_hash differs → 409
        ``urn:contract:idempotency-replay-conflict``.

    ``scope`` is the user_slug for authenticated writes, the session
    token for anonymous, or a fixed string for IP-scoped endpoints (login).
    """
```

The function is **not** a decorator. It is invoked explicitly:

### Integration example

```python
# api/routers/visualizations.py
from api.lib.crud import idempotency

idem_store = IdempotencyStore(db)  # initialised at startup

@router.post("")
async def create_visualization(request: Request, body: VisualizationCreate, owner: str = Depends(require_session)):
    async def _do_create() -> Response:
        slug = await slugs.slug_with_retry(...)
        return JSONResponse({"slug": slug, ...}, status_code=201)
    return await idempotency.replay_or_record(request, idem_store, scope=owner, handler=_do_create)
```

### Test surface (`test_idempotency.py`)

- `test_no_header_passthrough` — no `Idempotency-Key` header → handler invoked, no store write.
- `test_first_request_records` — key present → handler invoked once; one row in store.
- `test_replay_returns_stored` — same key + same body → handler invoked **once across both**; second call returns stored body byte-equal.
- `test_replay_different_body_409` — same key + different canonical body → 409 with `urn:contract:idempotency-replay-conflict`.
- `test_scope_isolation` — same key, different scopes → both handlers invoked (no cross-user replay leak).
- `test_ttl_index_created` — `ensure_indexes()` creates exactly one index, on `created_at`, with `expireAfterSeconds == 86400`.
- `test_store_idempotent` — `store()` of an existing `(key, scope)` is a no-op (upsert semantics; protects against concurrent writes).

---

## §6 — `softdelete.py` (~50 LOC budget)

**Goal.** A 50-LOC module that owns the `deleted_at: datetime | None`
soft-delete primitives — one mixin and four functions, no cascade (per
R-lifecycle-spec §3.2: "nothing cascades on soft-delete itself"; the
cron handles cascade on hard-delete).

**What.** One Pydantic mixin `SoftDeleteMixin`; four functions
`not_deleted_filter`, `with_not_deleted`, `soft_delete`, `restore`.

**Why.** CRUD-CONTRACT §5 binds the single-field-write soft-delete
shape; centralising the helpers prevents drift between routes that
each could otherwise spell the filter slightly differently. C5.1,
C5.2, U-soft-1–3 verify the field semantics and the restore path.

**Completion.** Seven `test_softdelete.py` rows PASS (filter value;
non-mutation; field-set; owner-mismatch False; restore within grace;
restore past grace; restore-not-found).

Implements **CRUD-CONTRACT §5** soft-delete primitives. The whole
module is helpers around a single `deleted_at: datetime | None` field
per R-lifecycle-spec §3.

### Internal types

```python
class SoftDeleteMixin(BaseModel):
    """Pydantic mixin: every persisted entity inherits this."""
    deleted_at: datetime | None = None
```

### API signatures

```python
def not_deleted_filter() -> dict:
    """Returns ``{"deleted_at": None}``. Use in every list/read query."""

def with_not_deleted(query: dict) -> dict:
    """Returns ``query | {"deleted_at": None}`` (does not mutate input)."""

async def soft_delete(
    collection: AsyncIOMotorCollection,
    slug: str,
    *,
    owner_slug: str | None = None,
) -> bool:
    """Set ``deleted_at = now()`` on the document matching ``slug``.

    If ``owner_slug`` is supplied, the filter includes ``owner_slug``
    (owner-bound soft-delete). Returns True on a modification; False
    if no matching row (already deleted or never existed).

    Does NOT cascade — per R-lifecycle-spec §3.2 "nothing cascades on
    soft-delete itself". Cron (§7) handles cascade on hard-delete.
    """

async def restore(
    collection: AsyncIOMotorCollection,
    slug: str,
    *,
    owner_slug: str | None = None,
    grace_days: int = 30,
) -> Literal["restored", "not_found", "expired"]:
    """Clear ``deleted_at`` if within grace; refuse past grace.

    Returns the enum literal; callers turn it into the appropriate
    response (200, 404, 410 — SCHEMA §5 ``urn:contract:not-found`` /
    ``urn:contract:soft-deleted``).
    """
```

### Integration example

```python
# api/routers/visualizations.py
from api.lib.crud import softdelete, errors

@router.delete("/{slug}")
async def delete_visualization(slug: str, owner: str = Depends(require_session)):
    ok = await softdelete.soft_delete(db.visualizations, slug, owner_slug=owner)
    if not ok: return errors.not_found("visualization", slug)
    return Response(status_code=204)

@router.post("/{slug}/restore")
async def restore_visualization(slug: str, owner: str = Depends(require_session)):
    result = await softdelete.restore(db.visualizations, slug, owner_slug=owner)
    if result == "not_found": return errors.not_found("visualization", slug)
    if result == "expired": return errors.problem("urn:contract:soft-deleted", 410, "Restore window expired")
    return {"ok": True}
```

### Test surface (`test_softdelete.py`)

- `test_not_deleted_filter_value` — exact dict equality.
- `test_with_not_deleted_does_not_mutate` — input dict unchanged.
- `test_soft_delete_sets_field` — Mongo row has `deleted_at` populated post-call (CRUD-CONTRACT C5.1).
- `test_soft_delete_owner_mismatch_returns_false` — different `owner_slug` → False, no DB modification.
- `test_restore_within_grace_returns_restored` — `deleted_at` cleared, return value `"restored"` (CRUD-CONTRACT C5.2).
- `test_restore_past_grace_returns_expired` — fixture with `deleted_at` 31 days ago → `"expired"` (CRUD-CONTRACT C5.3).
- `test_restore_not_found` — slug never deleted → `"restored"` (idempotent no-op); slug never existed → `"not_found"`.

---

## §7 — `pinned_cron.py` (~45 LOC budget)

**Goal.** A 45-LOC module — the smallest of the seven — that owns the
`pinned: bool` flag pattern and the bounded cron prune. Retires
fourier's unbounded `$nin` at `api/services/janitor.py:60-65`.

**What.** Two functions: `mark_pinned(coll, query, pinned)` (called on
publish/unpublish), `cron_prune(coll, cutoff, batch_size=1000)`
(invoked by the janitor's `_cleanup_cycle`).

**Why.** The unbounded-`$nin`-over-`distinct()` pattern is the
load-bearing janitor anti-pattern this whole library exists in part to
retire (CRUD-CONTRACT §8 + the C5.4, C8.1, C8.2, C8.3, C8.4,
U-cron-1–3 rows). The compound `(pinned, last_accessed_at)` index makes
the prune query plan bounded.

**Completion.** Seven `test_pinned_cron.py` rows PASS (mark_pinned
sets field; no-match returns 0; cron_prune deletes unpinned-old; skips
pinned; idempotent; no-`$nin` source-grep; compound-index existence).

Implements **CRUD-CONTRACT §8** + **R-lifecycle-spec §4.2** (the
`pinned: bool` flag pattern). Retires fourier's unbounded `$nin` at
`api/services/janitor.py:60-65`.

### API signatures

```python
async def mark_pinned(
    collection: AsyncIOMotorCollection,
    query: dict,
    pinned: bool,
) -> int:
    """Set ``pinned`` on every doc matching ``query``. Returns matched count.

    Called on entity publish (pin children) / unpublish (recompute pin
    from remaining references). Implementation: ``update_many(query, {"$set": {"pinned": pinned}})``.
    """

async def cron_prune(
    collection: AsyncIOMotorCollection,
    *,
    cutoff: datetime,
    batch_size: int = 1000,
) -> int:
    """Bounded prune. Returns deleted count.

    Query (per R-lifecycle-spec §4.2):
        {"pinned": False, "last_accessed_at": {"$lt": cutoff}}

    No ``$nin``. No collection-scan-to-build-pin-set. Index required:
        (pinned, last_accessed_at)

    ``batch_size`` chunks the delete via repeated bounded queries with
    ``limit`` + projection; protects against a runaway delete on a
    pathological cutoff. Each batch is one ``delete_many`` call; the
    function returns the sum.
    """
```

### Integration example

```python
# api/services/janitor.py (post-W3)
from api.lib.crud import pinned_cron

# At visualization publish:
await pinned_cron.mark_pinned(db.contours, {"contour_hash": h}, True)
await pinned_cron.mark_pinned(db.images,   {"image_slug": s},   True)

# In _cleanup_cycle:
cutoff = datetime.now(UTC) - timedelta(days=settings.asset_max_age_days)
deleted = await pinned_cron.cron_prune(db.contours, cutoff=cutoff)
logger.info("Janitor pruned %d unpinned contours", deleted)
```

### Test surface (`test_pinned_cron.py`)

- `test_mark_pinned_sets_field` — `update_many` modifies the matched docs; returns matched count.
- `test_mark_pinned_no_match_returns_zero` — empty filter result → 0; no error.
- `test_cron_prune_deletes_unpinned_old` — fixture: 3 unpinned old, 2 pinned old, 2 unpinned new. `cron_prune` returns 3 (CRUD-CONTRACT C8.2).
- `test_cron_prune_skips_pinned` — pinned doc with `last_accessed_at` 100 days ago survives (R-lifecycle-spec §4.6 `test_pinned_flag_prevents_pruning`).
- `test_cron_prune_idempotent` — second invocation returns 0 (CRUD-CONTRACT C8.4).
- `test_no_nin_in_query` — source-grep `"$nin" not in inspect.getsource(cron_prune)` (CRUD-CONTRACT C8.1).
- `test_cron_prune_uses_compound_index` — `db.contours.index_information()` includes `(pinned, last_accessed_at)`.

---

## §8 — `__init__.py` (~20 LOC budget)

**Goal.** A 20-LOC surface file that re-exports every public symbol
from the seven sub-modules and names — in the module docstring — which
CRUD-CONTRACT section each sub-module implements.

**What.** Sub-module re-exports + symbol-level re-exports + a docstring
that maps each sub-module to its contract section.

**Why.** A single import surface (`from api.lib.crud import ...`) lets
router code stay terse; the docstring is the entry-point for a fresh
reader. The "NOT included" note pins the no-`BaseCRUDRouter` /
no-`CRUDMixin` / no-`@crud_endpoint` discipline at the module surface
itself.

**Completion.** Module imports without error; `__all__` lists every
public symbol; U-meta-1 conformance row passes (the exported surface
matches the spec's enumerated surface).

```python
"""api.lib.crud — utilities for the slug-addressed CRUD contract.

Each sub-module is a pure utility for one section of
``docs/tranches/B/coordination/CRUD-CONTRACT.md``:

- ``slugs``       → §2 (slug algorithm, collision retry)
- ``cursors``     → §0 SOTA-1 + SCHEMA §1 (cursor pagination)
- ``errors``      → §0 SOTA-3 + SCHEMA §5 (RFC 9457 problem+json)
- ``etag``        → §0 SOTA-2 + SCHEMA §1 (ETag + If-Match)
- ``idempotency`` → §0 SOTA-4 (Idempotency-Key replay)
- ``softdelete``  → §5 (deleted_at + grace + restore)
- ``pinned_cron`` → §8 (bounded cron, no $nin)

NOT included: a ``BaseCRUDRouter`` / ``CRUDMixin`` / ``@crud_endpoint``
decorator. The Wχ.P1 ``framework-in-disguise`` probe rejects any
helper that owns the request lifecycle. Each router composes the
helpers explicitly; see the per-module integration examples.
"""

from . import slugs, cursors, errors, etag, idempotency, softdelete, pinned_cron

from .slugs import generate_slug, validate_slug, slug_with_retry, SLUG_PATTERN
from .cursors import encode_cursor, decode_cursor, paginate, next_cursor_from_last, CursorPayload
from .errors import ProblemDetails, problem  # specific helpers imported as needed
from .etag import compute_etag, require_if_match, set_etag_header
from .idempotency import IdempotencyStore, replay_or_record
from .softdelete import SoftDeleteMixin, not_deleted_filter, with_not_deleted, soft_delete, restore
from .pinned_cron import mark_pinned, cron_prune

__all__ = [
    "slugs", "cursors", "errors", "etag", "idempotency", "softdelete", "pinned_cron",
    # ... see body
]
```

---

## §9 — Cross-references to ported code

**Goal.** Map every helper in this module to the existing fourier or
value.js source line it ports from — discharging the §0 KISS guard "no
re-implementation".

**Completion.** The 13-row table below is the binding map; any helper
authored from scratch (not ported) carries a `new` cell and a citation
to the SCHEMA / RFC that motivates its algorithm.

The following table maps every helper to the existing fourier or value.js
source line it ports from (CRUD-CONTRACT §0 KISS guard "no
re-implementation"):

| Helper | Source | Disposition |
|---|---|---|
| `slugs.generate_slug` | `api/slugs.py:8-10` | swap `coolname` → `secrets.choice` over precepts wordlist; same shape |
| `slugs.slug_with_retry` | `api/services/image_storage.py:74-77` (TOCTOU pre-check) + `~/Programming/value.js/api/src/slugWords.ts:92-99` (proper retry) | port value.js's retry idiom; retire fourier's pre-check |
| `cursors.encode_cursor` | `api/routers/gallery.py:57-63` + `~/Programming/value.js/api/src/routes/palettes.ts:40-42` | unify; identical algorithm |
| `cursors.decode_cursor` | `api/routers/gallery.py:66-71` + `~/Programming/value.js/api/src/routes/palettes.ts:30-39` | unify; tighten error path to problem+json |
| `cursors.paginate` | `~/Programming/value.js/api/src/routes/palettes.ts:208-224` | direct port (Python equivalent) |
| `errors.*` | new (the existing `HTTPException(detail=...)` calls are replaced site-by-site at B.W3) | SCHEMA §5 is the catalog; one helper per row |
| `etag.compute_etag` | new; canonical-JSON helper shared with `idempotency.py` | SCHEMA §1 ETag block; algorithm spec'd, not copied |
| `etag.require_if_match` | new | RFC 9110 §13.1.1 (cited, not implemented elsewhere) |
| `idempotency.IdempotencyStore` | TTL idiom from `api/services/database.py:60-65` (sessions) | reuse the index pattern; per-record collection is new |
| `softdelete.soft_delete` | new; today's `api/routers/gallery.py:311` is the hard-delete that this replaces | R-lifecycle-spec §3.2 |
| `softdelete.restore` | new | R-lifecycle-spec §3.2 |
| `pinned_cron.mark_pinned` | new — write-time hook | R-lifecycle-spec §4.2 |
| `pinned_cron.cron_prune` | replaces `api/services/janitor.py:60-78` | R-lifecycle-spec §4.2 (the canonical pattern) |
| `_canonical_json` (private) | new; shared by `etag.py` + `idempotency.py` | one helper, two consumers — counted once |
| rate-limiter logic | **not ported here** — `api/services/rate_limiter.py:36-103` is already correct (CRUD-CONTRACT §9 row "rate-limiter: per-repo"); the lib does not duplicate it |

---

## §10 — Conformance cross-reference

**Goal.** Index every CRUD-CONTRACT §10 conformance row that this
utility module touches — so a row's "fourier-side test path" cell in
`CONFORMANCE-MATRIX.md` resolves to a concrete test file under
`api/tests/lib/crud/`.

**Completion.** The 14-row table below names test paths for every
contract row this module owns; bidirectional traceability holds (every
test path also appears in `CONFORMANCE-MATRIX.md`).

Every CRUD-CONTRACT §10 row touched by this module:

| Row | Sub-module(s) | Test path |
|---|---|---|
| C1.2 (slug-shape on read) | `slugs` | `test_slugs.py::test_validate_slug_negatives` |
| C2.1 (slug shape on generate) | `slugs` | `test_slugs.py::test_generate_slug_matches_pattern` |
| C2.2 (collision retry) | `slugs` | `test_slugs.py::test_slug_with_retry_recovers_from_dup_key` |
| C2.4 (word-list membership) | `slugs` | `test_slugs.py::test_words_in_list` |
| C5.1 (soft-delete hides) | `softdelete` | `test_softdelete.py::test_soft_delete_sets_field` |
| C5.2 (restore within grace) | `softdelete` | `test_softdelete.py::test_restore_within_grace_returns_restored` |
| C5.3 (hard-delete past grace) | `softdelete` + `pinned_cron` | `test_softdelete.py::test_restore_past_grace_returns_expired` |
| C5.4 / C8.1 (no unbounded `$nin`) | `pinned_cron` | `test_pinned_cron.py::test_no_nin_in_query` |
| C8.2 (cron clears fixture) | `pinned_cron` | `test_pinned_cron.py::test_cron_prune_deletes_unpinned_old` |
| C8.3 (indexes exist) | `pinned_cron`, `idempotency` | `test_pinned_cron.py::test_cron_prune_uses_compound_index`, `test_idempotency.py::test_ttl_index_created` |
| C8.4 (cron idempotent) | `pinned_cron` | `test_pinned_cron.py::test_cron_prune_idempotent` |
| ETag + If-Match (SOTA-2) | `etag` | `test_etag.py::test_require_if_match_*` |
| Cursor invalid (SCHEMA §5) | `cursors` | `test_cursors.py::test_decode_garbage_400` |
| Idempotency replay (SOTA-4) | `idempotency` | `test_idempotency.py::test_replay_*` |

---

## §11 — LOC roll-up

**Goal / Completion.** Reconcile the 8 sub-module budgets against the
500-LOC ceiling for the module as a whole; the 25-LOC overage is
absorbed by named compressions in `errors.py` or `idempotency.py`.

| Sub-module | Budget | Notes |
|---|---:|---|
| `slugs.py` | ~70 | 4 public symbols; loader is the bulk |
| `cursors.py` | ~80 | 4 public symbols; `paginate` is the densest |
| `errors.py` | ~90 | 1 model + 1 builder + 20 one-line helpers |
| `etag.py` | ~70 | 3 public symbols + private canonical-json helper (shared with idempotency) |
| `idempotency.py` | ~110 | the longest — TTL collection, model, replay_or_record |
| `softdelete.py` | ~50 | 1 mixin + 4 helpers |
| `pinned_cron.py` | ~45 | 2 helpers |
| `__init__.py` | ~20 | re-exports + contract index docstring |
| **Total** | **~535** | sub-shared `_canonical_json` deducts ~10 → effective ~525 |

The ceiling is **~500 LOC**. The ~525 estimate is **5% over**; the
overage is absorbed by (a) `errors.py` collapsing the 20 helpers to
generated one-liners (each is a `partial(problem, type_=..., status=...)`)
which cuts ~20 LOC, or (b) `idempotency.py` deferring response-headers
preservation to a follow-up if memory becomes the dominant LOC cost.
Either compresses the module under the ceiling without removing surface.

---

## §12 — Open items (this spec only)

**Goal / Completion.** Enumerate the spec-local open questions (U2
loader contract; `_canonical_json` placement; `IdempotencyStore`
collection name; per-helper rate-limit envelope); each carries a
named destination or a "trivial refactor" classification.

1. **U2 loader contract** — this spec assumes a `precepts/data/slug-words.json` resolved via `PRECEPTS_DIR`. If U2's final disposition is a different file format (YAML, TS source via `dotenv`, etc.) `slugs.py:module-init` adapts; the public API does not change.
2. **`_canonical_json` placement** — currently a private helper in `etag.py` re-exported to `idempotency.py`. If `softdelete.py` ever needs it (e.g. for a content-hash recompute on restore) we lift it to `_internal.py`; trivial refactor, not a contract change.
3. **`IdempotencyStore` collection name** — defaults to `idempotency`. If the database service (`api/services/database.py`) wants it namespaced differently (e.g. `_idempotency` to match the `_snapshots_legacy` convention) the constructor takes `collection`.
4. **Per-helper rate-limit envelope** — not in this module. Rate-limit headers (`RateLimit-Limit/Remaining/Reset`, `Retry-After`) are emitted by middleware over `api/services/rate_limiter.py`; CRUD-CONTRACT §9 keeps that surface per-repo.
