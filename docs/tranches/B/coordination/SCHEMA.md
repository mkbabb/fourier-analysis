# SCHEMA — canonical types for the CRUD contract

**Companion to**: `CRUD-CONTRACT.md` (this file authors §1–§9 and §11 type-level; §10 is `CONFORMANCE-MATRIX.md`).
**Status**: drafted at fourier-B.W1; per the orphan-verdict at `coordination/CRUD-CONSTELLATION.md`, joint ratification with value.js-C did not land in the original window.
**Format**: OpenAPI 3.1 fragments with embedded JSON Schema 2020-12. The canonical schema is language-agnostic; each repo's wave spec maps it onto its native types (Pydantic / TypeScript). Divergence of *representation* is permitted; divergence of *shape* is a contract violation.

The two cohort entities are `visualization` (fourier) and `palette` (value.js). Five shared types (`Slug`, `OwnerSlug`, `Timestamp`, `ContentHash`, `Cursor`, `Problem`) underwrite both.

## Goal criterion (document-level)

Author the canonical machine-readable types that realise CRUD-CONTRACT
§1–§9's prose in a form a generator, a validator, or a documentation
renderer can consume. A reader who needs the literal field shapes,
patterns, and constraints should be able to pull them from this file
without re-reading CRUD-CONTRACT.md.

## Completion criterion (document-level)

The OpenAPI 3.1 + JSON Schema 2020-12 fragments are preserved verbatim
(they are the load-bearing machine-readable artefact); every numbered
section carries a one-paragraph goal+completion block at its head; the
shared-type definitions (`Slug`, `OwnerSlug`, `Timestamp`, `ContentHash`,
`Cursor`, `Problem`) and the two entity definitions (`Visualization`,
`Palette`) are byte-identical to their drafted state, and the §8
native-type cross-reference table maps each canonical type to its
per-repo realisation.

---

## §1 — Conventions

**Goal.** Pin the cross-cutting conventions every later section assumes —
schema version, error envelope (RFC 9457 problem+json), cursor format
(base64url-opaque), ETag form (strong validator over canonical JSON),
`Idempotency-Key` semantics, rate-limit headers, `Link` header — so
those conventions are cited once and reused everywhere.

**Completion.** Each convention block names its load-bearing artefact
(the YAML fragment for the schema version; the precedent file:line for
cursor encode/decode; the RFC citation for headers) and is itself the
substrate the §S* conformance rows in `CONFORMANCE-MATRIX.md` pin.

### Schema version

```yaml
openapi: 3.1.0
info:
  title: CRUD Contract — fourier-B ⇄ value.js-C
  version: 1.0.0          # bumped at ratification; semver
  x-contract-version: 1   # major-only; the conformance matrix pins this
```

The `x-contract-version` integer is the **only** version both backends inspect at runtime. Patch and minor bumps are documentation; a major bump is a coordinated migration in both repos.

### Error envelope — RFC 9457 (Problem Details for HTTP APIs)

Every non-2xx response carries `application/problem+json` per RFC 9457. The `type` URI is opaque to clients but matches §5's catalog. Status, title, and `detail` are stable.

```yaml
ErrorEnvelope:
  description: RFC 9457 problem details
  content:
    application/problem+json:
      schema:
        $ref: '#/components/schemas/Problem'
```

### Pagination cursor — base64url-encoded opaque JSON

Cursor format: `base64url(JSON.stringify({ id, sort_key, sort_value }))` per **RFC 4648 §5** (base64url alphabet — `[A-Za-z0-9_-]+`, no padding `=`). Clients **must not** decode. Servers reject cursors that:
- fail base64url decoding,
- fail JSON parsing,
- fail the cursor JSON Schema (`#/components/schemas/CursorPayload`),
- decode to a stale sort_key (i.e. user mid-paginate switched `sort=newest` to `sort=popular`).

Precedent: `~/Programming/value.js/api/src/routes/palettes.ts:30-42` (`encodeCursor` / `decodeCursor`); `api/routers/gallery.py:57-71` (`_encode_cursor` / `_decode_cursor`). Both forms are aligned by this contract.

The RFC 4648 §5 citation is added 2026-05-26 per the Wave-2 audit synthesis C4 §6 #1 (a) (the citation was implicit at the original authoring; this revision pins it explicitly).

### ETag — strong validators

`ETag: "<hex>"` where `<hex>` is the lowercase hex digest of `sha256(json.dumps(canonical_doc))`. Conditional updates require `If-Match: "<etag>"`; mismatch yields 412 with problem type `urn:contract:etag-mismatch`.

### Idempotency-Key — RFC draft `httpapi-idempotency-key-header`

Write endpoints accept `Idempotency-Key: <uuid-or-token, max 255 chars>`. Server stores `(key, user_or_session, status, body_hash, response_body)` for 24h; a replay returns the original response verbatim. Mismatched body for same key yields 409 with `urn:contract:idempotency-replay-conflict`.

The OpenAPI parameter definition (added 2026-05-26 per the Wave-2 audit synthesis C4 §6 #1 (c) — the header was cited at §1 and §9 but never defined as an OpenAPI `components.parameters` entry):

```yaml
components:
  parameters:
    IdempotencyKey:
      name: Idempotency-Key
      in: header
      required: false
      description: |
        RFC draft `httpapi-idempotency-key-header`. Opaque client-chosen
        token; server stores `(key, user_or_session, status, body_hash,
        response_body)` for 24h. Replay returns the stored response
        verbatim; mismatched body for same key yields 409
        `urn:contract:idempotency-replay-conflict`.
      schema:
        type: string
        minLength: 1
        maxLength: 255
        pattern: '^[A-Za-z0-9._~-]+$'
```

The parameter is consumed by every write endpoint on the `visualization` / `palette` entities; the conformance assertions at `CONFORMANCE-MATRIX.md §S3` ratify the shape.

### Rate limit headers — IETF httpapi-ratelimit-headers (draft)

Every response carries:
- `RateLimit-Limit: <window-budget>`
- `RateLimit-Remaining: <remaining>`
- `RateLimit-Reset: <delta-seconds>`

A 429 response also carries `Retry-After: <delta-seconds>`. Precedent: both repos already implement the window; the headers are the contractual surface.

### Web Linking — RFC 8288

List responses emit a `Link` header in addition to JSON `next_cursor`/`prev_cursor` fields:

```
Link: </api/visualizations?cursor=…>; rel="next", </api/visualizations?cursor=…>; rel="prev"
```

JSON fields are canonical; `Link` is convenience for cURL/`HEAD` consumers.

---

## §2 — Shared types

**Goal.** Define the six shared types that both entities depend on —
`Slug`, `OwnerSlug`, `Timestamp`, `ContentHash`, `CursorPayload` /
`Cursor`, `Problem` — so the per-entity schemas (§3, §4) reference them
by `$ref` instead of inlining.

**Completion.** The schemas below are preserved verbatim as the
machine-readable artefact. Every shared type carries (a) a JSON-Schema
fragment, (b) the prose definition referencing the CRUD-CONTRACT clause
that motivates it, and (c) an example.

```yaml
components:
  schemas:

    # --- Slug -------------------------------------------------------------

    Slug:
      type: string
      title: Slug
      description: |
        Human-readable URL-safe identifier. The exact 4-word adjective-noun-noun-noun
        shape produced by `api/slugs.py` (Python: coolname-wrapped wordlist + secrets.choice)
        and `api/src/slugWords.ts` (Node: wordlist + crypto.randomInt). Lowercase ASCII
        letters and hyphens — no digits, no leading/trailing hyphen. Exactly 4 words
        separated by 3 hyphens; minimum length 7 (4 one-letter words + 3 hyphens),
        maximum length 60.

        Per CRUD-CONTRACT §2 the slug algorithm is the *same* on both backends;
        the wordlists are the only shared *data* artefact (per Wα-R3 disposition).
      pattern: '^[a-z]+(-[a-z]+){3}$'
      minLength: 7
      maxLength: 60
      examples:
        - "big-red-angry-python"
        - "quiet-blue-morning-fox"

    # --- OwnerSlug --------------------------------------------------------

    OwnerSlug:
      $ref: '#/components/schemas/Slug'
      description: |
        Slug of the owning user. Required, non-null on every persisted noun
        (invariant 14). The orphan path (`user_slug: None`) currently produced
        by `api/routers/gallery.py:206` is forbidden under this contract.

    # --- Timestamp --------------------------------------------------------

    Timestamp:
      type: string
      format: date-time
      title: Timestamp
      description: |
        ISO 8601 / RFC 3339 timestamp. Always UTC. Always with timezone offset.
        Backends serialize as `2026-05-19T14:23:00.123Z` (Z, not +00:00).
      examples:
        - "2026-05-19T14:23:00.123Z"

    # --- ContentHash ------------------------------------------------------

    ContentHash:
      type: string
      title: ContentHash
      description: |
        SHA-256 hex digest of a canonical JSON serialization of an entity's
        content fields (visualization: contour + harmonics; palette: name +
        colors). 64 lowercase hex chars. **Not** an identifier — it is a
        deduplication key. Identity is the slug (CRUD-CONTRACT §1).
      pattern: '^[0-9a-f]{64}$'
      minLength: 64
      maxLength: 64
      examples:
        - "3a7b9c1d4e6f0a2b8c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b"

    # --- CursorPayload (internal — base64url-wrapped) ---------------------

    CursorPayload:
      type: object
      title: CursorPayload
      description: |
        The decoded shape of an opaque pagination cursor. Clients never see
        this — they round-trip the base64url-encoded form. Servers validate
        every field on decode.
      required: [id, sort_key, sort_value]
      additionalProperties: false
      properties:
        id:
          type: string
          description: Tie-breaker — the document _id of the last item returned.
        sort_key:
          type: string
          enum: [newest, popular, most-forked, views, likes]
          description: Must match the request's current sort parameter, else 400.
        sort_value:
          oneOf:
            - { type: string, format: date-time }   # newest
            - { type: integer, minimum: 0 }         # popular, views, likes, most-forked

    Cursor:
      type: string
      title: Cursor
      description: |
        Base64url-encoded `CursorPayload`. Opaque to clients. Maximum decoded
        length 512 bytes.
      maxLength: 1024  # base64url overhead
      pattern: '^[A-Za-z0-9_-]+={0,2}$'
      examples:
        - "eyJpZCI6IjY1ZjEyM2FiNGM1NjA4OWQ3ZTBmMTIzNCIsInNvcnRfa2V5IjoibmV3ZXN0Iiwic29ydF92YWx1ZSI6IjIwMjYtMDUtMTlUMTQ6MjM6MDAuMTIzWiJ9"

    # --- Problem (RFC 9457) ----------------------------------------------

    Problem:
      type: object
      title: Problem
      description: RFC 9457 Problem Details for HTTP APIs.
      required: [type, title, status]
      additionalProperties: true
      properties:
        type:
          type: string
          format: uri
          description: |
            URI reference identifying the problem type. URN shape: `urn:contract:<slug>`.
            Stable across versions; see §5 error catalog.
          examples: ["urn:contract:slug-invalid"]
        title:
          type: string
          description: Short, human-readable summary. Stable across versions.
          examples: ["Invalid slug shape"]
        status:
          type: integer
          minimum: 400
          maximum: 599
          description: HTTP status code (duplicate of response status).
        detail:
          type: string
          description: Human-readable explanation specific to this occurrence.
        instance:
          type: string
          format: uri-reference
          description: URI identifying the specific occurrence (request path).
        errors:
          type: array
          description: Field-level validation failures (optional).
          items:
            type: object
            required: [path, message]
            properties:
              path: { type: string }     # JSON Pointer to the offending field
              message: { type: string }
```

---

## §3 — `Visualization` entity (fourier)

**Goal.** The canonical shape of the fourier-converged noun — slug,
required owner, 3-state visibility, content-hash, image-and-contour
references, harmonic count, active basis decompositions, soft-delete,
optional palette cross-reference to value.js.

**Completion.** The `Visualization` schema (the persisted shape),
`VisualizationCreate` (the POST request body), and `VisualizationUpdate`
(the PATCH request body — partial, slug-immutable, content-hash
server-recomputed) are preserved verbatim. Examples illustrate the
canonical JSON serialisation.

The fourier-side converged noun. Collapses `snapshot` + `gallery_entry` + `draft` (invariant 14). One slug, required owner, 3-state visibility, soft-delete.

```yaml
    Visualization:
      type: object
      title: Visualization
      description: |
        A saved Fourier-analysis result. One row per user-named noun. The slug
        is the public handle; the content hash is a dedup key, not identity.
      required:
        - slug
        - owner_slug
        - visibility
        - content_hash
        - image_slug
        - contour_hash
        - active_bases
        - n_harmonics
        - created_at
        - updated_at
      additionalProperties: false
      properties:
        slug:
          $ref: '#/components/schemas/Slug'
          description: Public identifier. Unique across the collection.
        owner_slug:
          $ref: '#/components/schemas/OwnerSlug'
        visibility:
          type: string
          enum: [draft, unlisted, public]
          description: |
            3-state lifecycle (invariant 14). `draft` is owner-only; `unlisted`
            is link-shareable but not listed; `public` is listed in the gallery.
            Legal transitions: draft→unlisted, draft→public, unlisted→public,
            unlisted→draft, public→unlisted. Forbidden: public→draft (must pass
            through unlisted) — per CRUD-CONTRACT §4.
        content_hash:
          $ref: '#/components/schemas/ContentHash'
          description: |
            Deduplication key over (contour_hash, n_harmonics, active_bases,
            harmonic_coefficients). Two visualizations with the same content
            hash are byte-identical computations.
        image_slug:
          $ref: '#/components/schemas/Slug'
          description: Slug of the source image asset.
        contour_hash:
          $ref: '#/components/schemas/ContentHash'
          description: Hash of the extracted contour data.
        active_bases:
          type: array
          description: Which basis decompositions were computed (e.g. ["fourier-epicycles", "chebyshev"]).
          items: { type: string }
          minItems: 1
          maxItems: 16
          uniqueItems: true
        n_harmonics:
          type: integer
          minimum: 1
          maximum: 4096
        title:
          type: string
          description: User-provided display title (optional; falls back to slug).
          maxLength: 200
        description:
          type: string
          description: User-provided description (optional).
          maxLength: 2000
        tags:
          type: array
          items: { type: string, maxLength: 30 }
          maxItems: 10
        views:
          type: integer
          minimum: 0
          default: 0
        likes:
          type: integer
          minimum: 0
          default: 0
        pinned:
          type: boolean
          default: false
          description: |
            Admin-set sticky flag. Cron skips pinned docs even if they would
            otherwise be pruned (CRUD-CONTRACT §8). Never set by end users.
        created_at: { $ref: '#/components/schemas/Timestamp' }
        updated_at: { $ref: '#/components/schemas/Timestamp' }
        deleted_at:
          oneOf:
            - { $ref: '#/components/schemas/Timestamp' }
            - { type: 'null' }
          description: |
            Soft-delete timestamp. `null` for live documents. Set by DELETE.
            Hard-deletion happens via cron after the grace period (CRUD-CONTRACT §5).
        palette_slug:
          oneOf:
            - { $ref: '#/components/schemas/Slug' }
            - { type: 'null' }
          description: |
            Optional reference to a palette in value.js. Stored as a slug, not
            an embedded object — the palette is the property of value.js (invariant 15).
      examples:
        - slug: "quiet-blue-morning-fox"
          owner_slug: "wise-orange-quiet-otter"
          visibility: "public"
          content_hash: "3a7b9c1d4e6f0a2b8c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b"
          image_slug: "lone-red-cypress-3a7b"
          contour_hash: "1f3e5d7c9b1a3f5e7d9c1b3a5f7e9d1c3b5a7f9e1d3c5b7a9f1e3d5c7b9a1f3e"
          active_bases: ["fourier-epicycles", "chebyshev"]
          n_harmonics: 200
          tags: ["lighthouse", "demo"]
          views: 42
          likes: 7
          pinned: false
          created_at: "2026-05-19T14:23:00.123Z"
          updated_at: "2026-05-19T14:25:11.005Z"
          deleted_at: null
          palette_slug: "ocean-grove-quiet-dawn"
```

### Visualization request shapes

```yaml
    VisualizationCreate:
      type: object
      required: [image_slug, contour_hash, active_bases, n_harmonics]
      additionalProperties: false
      properties:
        slug:
          $ref: '#/components/schemas/Slug'
          description: Optional client-supplied slug. Server generates if absent.
        visibility:
          type: string
          enum: [draft, unlisted, public]
          default: draft
        image_slug: { $ref: '#/components/schemas/Slug' }
        contour_hash: { $ref: '#/components/schemas/ContentHash' }
        active_bases:
          type: array
          items: { type: string }
          minItems: 1
          maxItems: 16
          uniqueItems: true
        n_harmonics: { type: integer, minimum: 1, maximum: 4096 }
        title: { type: string, maxLength: 200 }
        description: { type: string, maxLength: 2000 }
        tags:
          type: array
          items: { type: string, maxLength: 30 }
          maxItems: 10
        palette_slug:
          oneOf:
            - { $ref: '#/components/schemas/Slug' }
            - { type: 'null' }

    VisualizationUpdate:
      type: object
      additionalProperties: false
      description: |
        Partial update. Only the listed fields are mutable post-create.
        `slug` is immutable. `content_hash` is recomputed server-side.
      properties:
        visibility: { type: string, enum: [draft, unlisted, public] }
        title: { type: string, maxLength: 200 }
        description: { type: string, maxLength: 2000 }
        tags:
          type: array
          items: { type: string, maxLength: 30 }
          maxItems: 10
        palette_slug:
          oneOf:
            - { $ref: '#/components/schemas/Slug' }
            - { type: 'null' }
```

---

## §4 — `Palette` entity (value.js)

**Goal.** The canonical shape of the value.js-converged noun — slug,
required owner, 3-state visibility, content-hash, ordered colour stops,
optional named ramps, vote/fork counters, fork lineage. The colour
*domain operations* (interpolate, gamut-clamp, serialize) live in the
value.js library, not in this schema (per invariant 15).

**Completion.** `Palette`, `ColorStop`, `OKLab`, `OKLCh`, `Ramp`,
`PaletteCreate`, and `PaletteUpdate` schemas are preserved verbatim.
OKLCh is included as a view-only form (storage normalises to OKLab).

The value.js-side converged noun. The colour/palette **domain type** is hosted in the value.js library (invariant 15); this schema describes the *persisted* shape stored by `palette-api`. The domain operations (interpolate, gamut-clamp, serialize) live in the library and are not part of this contract.

```yaml
    Palette:
      type: object
      title: Palette
      description: |
        A named, ordered set of colour stops with optional ramps. Authored in
        OKLCh / OKLab; rendered to whatever CSS the consumer wants.
      required:
        - slug
        - owner_slug
        - visibility
        - content_hash
        - name
        - colors
        - created_at
        - updated_at
      additionalProperties: false
      properties:
        slug: { $ref: '#/components/schemas/Slug' }
        owner_slug: { $ref: '#/components/schemas/OwnerSlug' }
        visibility:
          type: string
          enum: [draft, unlisted, public]
        content_hash: { $ref: '#/components/schemas/ContentHash' }
        name:
          type: string
          minLength: 1
          maxLength: 100
        colors:
          type: array
          minItems: 1
          maxItems: 50
          description: Ordered colour stops. Position is canonical, not array index.
          items: { $ref: '#/components/schemas/ColorStop' }
        ramps:
          type: array
          description: |
            Optional named ramps over the stops. Each ramp is a smooth path
            through a subset of stops, named (e.g. "warm", "neutral", "cool").
          items: { $ref: '#/components/schemas/Ramp' }
          maxItems: 16
        tags:
          type: array
          items: { type: string, maxLength: 30 }
          maxItems: 10
        vote_count:
          type: integer
          minimum: 0
          default: 0
        fork_count:
          type: integer
          minimum: 0
          default: 0
        fork_of:
          oneOf:
            - { $ref: '#/components/schemas/Slug' }
            - { type: 'null' }
          description: Parent palette slug (if forked).
        version_count:
          type: integer
          minimum: 1
          default: 1
        pinned:
          type: boolean
          default: false
        created_at: { $ref: '#/components/schemas/Timestamp' }
        updated_at: { $ref: '#/components/schemas/Timestamp' }
        deleted_at:
          oneOf:
            - { $ref: '#/components/schemas/Timestamp' }
            - { type: 'null' }

    ColorStop:
      type: object
      title: ColorStop
      required: [css, position]
      additionalProperties: false
      description: |
        One colour stop. Authored as a CSS colour string; server computes the
        OKLab triple for distance search (value.js's `oklabColors` precedent).
      properties:
        css:
          type: string
          minLength: 1
          maxLength: 200
          description: CSS colour string — hex, rgb(), oklch(), oklab(), etc.
        name:
          type: string
          maxLength: 60
        position:
          type: number
          minimum: 0
          maximum: 1
          description: Stop position in [0, 1]. Canonical ordering, not array index.
        oklab:
          $ref: '#/components/schemas/OKLab'
          description: |
            Server-computed. Clients may send it; servers always recompute on
            POST/PATCH to prevent spoofing.

    OKLab:
      type: object
      title: OKLab
      description: |
        OKLab triple. Computed server-side from `css` for indexing and search.
        See `~/Programming/value.js/api/src/routes/palettes.ts:48-94` for the
        canonical sRGB → OKLab conversion both backends use.
      required: [L, a, b]
      additionalProperties: false
      properties:
        L: { type: number, minimum: 0, maximum: 1 }
        a: { type: number, minimum: -0.5, maximum: 0.5 }
        b: { type: number, minimum: -0.5, maximum: 0.5 }

    OKLCh:
      type: object
      title: OKLCh
      description: |
        OKLCh form — present in the library's domain type. The persisted entity
        normalises to OKLab; OKLCh is a view, not a storage format. Included
        here so the schema can describe library responses (e.g. `colorScale`).
      required: [L, C, h]
      additionalProperties: false
      properties:
        L: { type: number, minimum: 0, maximum: 1 }
        C: { type: number, minimum: 0, maximum: 0.5 }
        h: { type: number, minimum: 0, exclusiveMaximum: 360 }

    Ramp:
      type: object
      title: Ramp
      required: [name, stops]
      additionalProperties: false
      description: |
        A named ramp over a subset of the palette's stops. The library computes
        smooth interpolation; storage is only the membership and name.
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 60
        stops:
          type: array
          description: Indices into the parent palette's `colors` array.
          items:
            type: integer
            minimum: 0
          minItems: 2
          maxItems: 50
          uniqueItems: true

    PaletteCreate:
      type: object
      required: [name, colors]
      additionalProperties: false
      properties:
        slug: { $ref: '#/components/schemas/Slug' }
        visibility:
          type: string
          enum: [draft, unlisted, public]
          default: draft
        name: { type: string, minLength: 1, maxLength: 100 }
        colors:
          type: array
          items: { $ref: '#/components/schemas/ColorStop' }
          minItems: 1
          maxItems: 50
        ramps:
          type: array
          items: { $ref: '#/components/schemas/Ramp' }
          maxItems: 16
        tags:
          type: array
          items: { type: string, maxLength: 30 }
          maxItems: 10

    PaletteUpdate:
      type: object
      additionalProperties: false
      properties:
        visibility: { type: string, enum: [draft, unlisted, public] }
        name: { type: string, minLength: 1, maxLength: 100 }
        colors:
          type: array
          items: { $ref: '#/components/schemas/ColorStop' }
          minItems: 1
          maxItems: 50
        ramps:
          type: array
          items: { $ref: '#/components/schemas/Ramp' }
          maxItems: 16
        tags:
          type: array
          items: { type: string, maxLength: 30 }
          maxItems: 10
```

---

## §5 — Error catalog

**Goal.** Enumerate every problem `type` URI both backends emit, with
its bound HTTP status, title, and semantics; the catalog is the source
of truth the `errors.py` / `errors.ts` utility modules generate
one-line helpers against.

**Completion.** The 20-row table below is the binding ledger. The
`urn:contract:<slug>` namespace is the only namespace either backend
emits (`urn:contract:made-up` is rejected at construction by the
U-errors-2 conformance row). Catalog coverage (every URI is emitted by
at least one code path) is pinned by CS5.2.

Every problem `type` URI defined by this contract, with its bound status, title, and semantics. Both repos emit identical `(type, status, title)` triples for the same logical error.

| `type` (URI)                              | Status | Title                          | Semantics                                                                 |
|-------------------------------------------|--------|--------------------------------|---------------------------------------------------------------------------|
| `urn:contract:slug-invalid`               | 400    | Invalid slug shape             | Slug fails the `Slug` pattern.                                            |
| `urn:contract:slug-conflict`              | 409    | Slug already in use            | Unique-key violation on `slug`.                                           |
| `urn:contract:owner-required`             | 401    | Owner required                 | Anonymous publish forbidden (invariant 14).                               |
| `urn:contract:not-owner`                  | 403    | Not the owner                  | Caller is authenticated but does not own the resource.                    |
| `urn:contract:not-found`                  | 404    | Resource not found             | Slug does not exist, or document is soft-deleted past grace.              |
| `urn:contract:visibility-illegal-transition` | 409 | Illegal visibility transition | E.g. `public → draft` (must pass through `unlisted`).                     |
| `urn:contract:soft-deleted`               | 410    | Resource soft-deleted          | Document exists with `deleted_at != null`; PATCH/DELETE rejected.         |
| `urn:contract:etag-mismatch`              | 412    | ETag precondition failed       | `If-Match` does not equal current strong validator.                       |
| `urn:contract:precondition-required`      | 428    | Precondition required          | Mutation arrived without an `If-Match` header on an ETag-guarded route.   |
| `urn:contract:idempotency-replay-conflict`| 409    | Idempotency-Key body mismatch  | Same key, different request body within 24h window.                       |
| `urn:contract:cursor-invalid`             | 400    | Invalid pagination cursor      | Base64url decode failed, JSON parse failed, schema invalid, or stale sort.|
| `urn:contract:rate-limited`               | 429    | Rate limit exceeded            | Window budget exhausted. `Retry-After` and `RateLimit-Reset` populated.   |
| `urn:contract:validation-failed`          | 422    | Request validation failed      | Field-level violations; `errors[]` is populated.                          |
| `urn:contract:session-invalid`            | 401    | Session invalid or expired     | `X-Session-Token` missing, malformed, or past `expires_at`.               |
| `urn:contract:account-suspended`          | 403    | Account suspended              | Owner exists but `status == "suspended"`.                                 |
| `urn:contract:payload-too-large`          | 413    | Payload too large              | Request body exceeds the contract's per-endpoint cap.                     |
| `urn:contract:admin-not-configured`       | 503    | Admin not configured           | `ADMIN_TOKEN` unset; admin surface unavailable.                           |
| `urn:contract:admin-forbidden`            | 403    | Admin token invalid            | Bearer token mismatch (timing-safe).                                      |
| `urn:contract:flag-self`                  | 400    | Cannot flag own resource       | Owner attempted to flag own document.                                     |
| `urn:contract:flag-duplicate`             | 409    | Already flagged                | Reporter already has an open flag on this resource.                       |
| `urn:contract:slug-exhausted`             | 503    | Slug-mint retry exhausted      | 10 consecutive collisions on `generate_unique_slug`; service-side hint. Wave-2 addendum per C4 §6 #1 (d). |

Backends **must** emit problem+json for every row above. The conformance matrix (§10 of CRUD-CONTRACT.md) asserts one row per error.

**Catalog table grows from 20 → 21 rows at the 2026-05-26 Wave-2 amendment** (the `urn:contract:slug-exhausted` row referenced by `CONFORMANCE-MATRIX.md` U-slugs-3 was missing from the catalog per C4 §6 #1 (d)). The `CONFORMANCE-MATRIX.md` CS5.2 row updates from "18 URIs" to **21 URIs** at the same revision.

---

## §6 — Pagination envelope

**Goal.** A single pagination shape both backends emit — opaque
base64url cursors (clients never decode), bounded `limit ∈ [1, 100]` per
request, fixed `sort` enumeration, and a `PaginationEnvelope` response
body augmented by the `Link` header per RFC 8288.

**Completion.** The request-parameter block (`cursor`, `limit`, `sort`)
and the response-envelope schema (`data`, `next_cursor`, `prev_cursor`,
`has_more`, optional `total`) are preserved verbatim. The `Link`-header
form is illustrated; the JSON fields are canonical when the two
disagree.

### Request

```yaml
parameters:
  - name: cursor
    in: query
    required: false
    schema: { $ref: '#/components/schemas/Cursor' }
  - name: limit
    in: query
    required: false
    schema:
      type: integer
      minimum: 1
      maximum: 100
      default: 20
  - name: sort
    in: query
    required: false
    schema:
      type: string
      enum: [newest, popular, most-forked, views, likes]
      default: newest
```

### Response

```yaml
PaginationEnvelope:
  type: object
  required: [data, next_cursor, prev_cursor, has_more]
  additionalProperties: false
  properties:
    data:
      type: array
      description: The page of results. Empty array iff no rows match.
      items:
        oneOf:
          - { $ref: '#/components/schemas/Visualization' }
          - { $ref: '#/components/schemas/Palette' }
    next_cursor:
      oneOf:
        - { $ref: '#/components/schemas/Cursor' }
        - { type: 'null' }
      description: Cursor for the next page; `null` iff `has_more` is false.
    prev_cursor:
      oneOf:
        - { $ref: '#/components/schemas/Cursor' }
        - { type: 'null' }
      description: |
        Cursor for the previous page; `null` on the first page. Optional —
        backends that don't support backward paging set this to `null` always
        and document it on the operation.
    has_more:
      type: boolean
      description: True iff `next_cursor` is non-null.
    total:
      type: integer
      minimum: 0
      description: |
        Optional total count. Present only for offset-mode requests
        (cursor absent). Omitted in cursor mode — counting is too expensive
        on large collections and is not part of the cursor contract.
```

### `Link` header (RFC 8288)

```
Link: </api/visualizations?cursor=eyJp…&limit=20>; rel="next",
      </api/visualizations?cursor=eyJw…&limit=20>; rel="prev"
```

Emitted when the corresponding `next_cursor` / `prev_cursor` field is non-null. Clients **may** prefer the JSON fields.

---

## §7 — Webhook / SSE

**Goal.** Make the absence of any push transport (SSE, webhook, WebSocket)
an explicit, testable invariant — not a silent omission.

**Completion.** The KISS-rejection rationale is recorded; the
conformance assertion is a grep over both repos for `EventSource`,
`text/event-stream`, and `/webhook` paths returning zero outside test
fixtures. A future tranche that admits push transport would land its
dispatch shape in a successor version of this section.

**N/A.** KISS-rejected per CRUD-CONTRACT §0. Neither repo ships push transports; clients poll. The matrix asserts no SSE/webhook endpoint exists in either repo (`grep -rE "EventSource|text/event-stream|/webhook" api/ ~/Programming/value.js/api/src/` returns zero outside of test fixtures).

Rationale: a push transport across two backends in two languages with two deploy substrates is "a contrivance" by the user's brief (§1 of B.md). The convergence target is shape, not throughput. If a future tranche admits push, this section becomes its dispatch point.

---

## §8 — Cross-reference to native types

**Goal.** Map every canonical schema type to its per-repo native
realisation — Pydantic models in fourier, TypeScript interfaces in
value.js — so a reader can locate the concrete code a schema clause
generates.

**Completion.** The 9-row table below is the binding map. A divergence
between any row and the canonical schema is a conformance violation;
the matrix catches it.

The canonical schema above is language-agnostic. Each repo maps it onto its native types:

| Canonical            | fourier (Pydantic, `api/models/`)            | value.js (TypeScript, `api/src/types.ts`) |
|----------------------|----------------------------------------------|-------------------------------------------|
| `Visualization`      | `models/visualization.py` (new at B.W3)      | — (consumer-only)                         |
| `Palette`            | — (consumer-only — `palette_slug` reference) | `models/palette.ts` (new at value.js-C.W2)|
| `Slug`               | `dependencies.py:SLUG_PATTERN`               | `routes/palettes.ts:362` regex            |
| `OwnerSlug`          | `models/session.py` user_slug                | `types.ts:AppEnv.userSlug`                |
| `Timestamp`          | `datetime` with `tzinfo=UTC`                 | `Date` (ISO-string serialized)            |
| `ContentHash`        | `services/image_storage.py` SHA-256          | `hash.ts:computeContentHash`              |
| `Cursor`             | `routers/gallery.py:_encode_cursor`          | `routes/palettes.ts:encodeCursor`         |
| `Problem`            | (new at W3 — replace `HTTPException(detail)`)| (new at value.js-C.W2)                    |
| `PaginationEnvelope` | `models/gallery.py:GalleryListResponse` (rename) | inline `{ data, nextCursor, hasMore }`|
| **`AnimationData.partial_sums`** (added 2026-05-26 per Wave-1 audit L3 §3.6 D7) | `models/visualization.py`: `partial_sums: dict[str, dict[Literal["x","y"], float]]` (stringified-int keys — JSON-serialised form) | — (fourier-only; the consumer-side `BasisCanvas.vue:271-274` drops the `(sumsForBasis as any)?.[level]` cast in favour of `Record<string, {x: number; y: number}>`; the W2 — UX coherence wave lands the cast removal) |
| **`AnimationData`** (added 2026-05-26 per Wave-2 audit C4 §6 #1 (b)) | see schema body below | — (fourier-only) |

A divergence between any row of this table and the canonical schema is a conformance violation, caught by the matrix.

### `AnimationData` schema body (added 2026-05-26 — Wave-2 audit synthesis C4 §6 #1 (b))

The §8 native-types row above cross-references `AnimationData.partial_sums` but the schema body itself was undefined at HEAD per C4 §4 gap (b). The OpenAPI / JSON-Schema 2020-12 body:

```yaml
components:
  schemas:
    AnimationData:
      type: object
      description: |
        Embedded animation state on a visualization. Carries the
        precomputed partial-sum trajectories the BasisCanvas renderer
        consumes per rAF frame. The `partial_sums` keys are
        stringified ints (the JSON serialisation form — JSON keys are
        always strings, the underlying domain is the basis level
        ordinal ∈ ℕ).
      required: [active_bases, n_harmonics, partial_sums]
      additionalProperties: false
      properties:
        active_bases:
          type: array
          items: { type: string }
          description: Basis-set identifiers; subset of the supported bases.
        n_harmonics:
          type: integer
          minimum: 1
          maximum: 256
          description: Harmonic-truncation count; bounded by the contract.
        partial_sums:
          type: object
          description: |
            Stringified-int keys (the JSON serialisation form); values
            are `{x, y}` floating-point coordinates of the partial-sum
            trajectory tail at the named basis level.
          additionalProperties:
            type: object
            required: [x, y]
            additionalProperties: false
            properties:
              x: { type: number }
              y: { type: number }
```

The `F.partial-sums-roundtrip` conformance row at `CONFORMANCE-MATRIX.md §F` ratifies the JSON round-trip shape; the fourier-side consumer at `BasisCanvas.vue:271-274` drops the `(sumsForBasis as any)?.[level]` cast in favour of typed bracket access (the W2 — UX coherence wave lands the cast removal per scope item 15).

---

## §9 — SOTA conventions cited (not re-derived)

**Goal.** Name every standards-of-the-trade convention this schema
adopts, with the exact RFC or specification reference; the contract
*cites*, never *re-implements*.

**Completion.** The 8-row table below pins each citation; any deviation
must be motivated in CRUD-CONTRACT §12 (change log) with a one-line
rationale.

| Convention                    | Reference                                                                 |
|-------------------------------|---------------------------------------------------------------------------|
| OpenAPI 3.1                   | https://spec.openapis.org/oas/v3.1.0                                      |
| JSON Schema 2020-12           | https://json-schema.org/draft/2020-12                                     |
| Problem Details (envelope)    | RFC 9457 — https://www.rfc-editor.org/rfc/rfc9457                         |
| Web Linking (`Link` header)   | RFC 8288 — https://www.rfc-editor.org/rfc/rfc8288                         |
| **base64url alphabet (cursors)** | **RFC 4648 §5 — https://www.rfc-editor.org/rfc/rfc4648#section-5** (added 2026-05-26 per Wave-2 audit C4 §6 #1 (a)) |
| RateLimit headers             | IETF httpapi-ratelimit-headers (draft); RFC 9239-track                    |
| Cursor pagination shape       | GitHub REST, Stripe API, Slack API (opaque base64url; never decoded by client) |
| Idempotency-Key header        | IETF httpapi-idempotency-key-header (draft)                               |
| ETag / If-Match               | RFC 9110 §8.8 / §13.1.1                                                   |

This contract **cites** these; it does not reimplement them. Any deviation must be motivated in CRUD-CONTRACT §12 (change log).
