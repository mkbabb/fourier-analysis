# CRUD-CONTRACT — fourier-analysis ⇄ value.js

**Version: 2.0.0** (fourier-D.W5, 2026-05-27 — supersedes v1.0.0 by
re-authoring per §12 changelog).

The canonical specification both backends conform to for their slug-addressed
CRUD entities. fourier owns the `visualization` noun; value.js owns the
`palette` noun. This document binds *observable CRUD behaviour at the HTTP
boundary*, **not module layout**. Where the two diverge in language-specific
shape (FastAPI vs Hono, Motor query syntax vs node-mongodb), the contract
names the behaviour and each repo's wave specs carry the literal code.

> **Version succession (2026-05-27).** This document is **v2.0.0**, authored
> at fourier-D.W5. v2.0.0 supersedes v1.0.0 (`4626d4c`, fourier-B.W1 close,
> 2026-05-26) by **re-authoring binding clauses**, not by amendment. The
> v1.0.0 substrate is preserved in git history; v2.0.0 differs in §0, §2,
> §10, and adds §13 (cross-repo `palette_slug` FK). The KISS-reject list,
> SOTA-convention table, identity/ownership/visibility/soft-delete/sessions/
> admin/cron clauses (§1, §3–§9), and migration discipline (§11) all
> survive verbatim from v1.0.0 modulo wave-citation updates.

## Goal criterion (document-level)

The aim: a single text both repos can point at as the binding behavioural
spec for their shared slug-addressed CRUD surface. Read after the cohort
authoring, a fresh engineer should be able to answer "what does both
backends agree to do at the wire?" from this document alone, without
reading either repo's source.

## Completion criterion (document-level)

The evidence: every numbered section §1–§13 carries (a) a goal+completion
block at its head, (b) the technical prose verbatim, and (c) a
conformance-assertion block whose rows index into `CONFORMANCE-MATRIX.md`.
The load-bearing close gate is §10's **three-way disposition close-rule**
(re-interpreted in v2.0.0 from v1.0.0's binary "both columns PASS").

Sibling artefacts (authored by A2–A6 at B.W1, hardened at D.W5; referenced
by path):

- `coordination/R-identity-spec.md` — identity/slug/hash separation (long
  form). §1 of this contract is the binding summary.
- `coordination/R-auth-spec.md` — session/ownership/admin auth (long form).
  §3, §6, §7 of this contract are the binding summary.
- `coordination/R-lifecycle-spec.md` — visibility transitions and
  soft-delete state machine (long form). §4, §5 are the binding summary.
- `coordination/SCHEMA.md` — per-repo MongoDB schemas (the language-specific
  realisation of the contract entities; not load-bearing here).
- `coordination/CONFORMANCE-MATRIX.md` — the fleshed-out §10 matrix with
  one row per assertion × repo × test name × run command × expected output.
  §10 of this contract is the index; CONFORMANCE-MATRIX.md is the table.
- `../../D/coordination/CRUD-COHESION.md` — the cross-repo ask doc;
  records the two KISS relaxations and the §10 three-way close-rule
  reinterpretation that motivate v2.0.0.
- `../../D/coordination/VALUE-JS-ASK.md` — the candidate hand-off brief
  for the value.js-side execution (user-re-mandate-gated).

---

## §0 — Status, authority, scope (v2.0.0)

**Goal.** Fix the contract's metadata — version, authority lineage,
in-scope boundary, the KISS-rejection list, the **module-layout neutrality**
preamble — before any behavioural rule appears, so later sections do not
re-litigate the framework-vs-utility decision or the SOTA citations.

**Completion.** The §0 block names (a) the v2.0.0 version + supersession
lineage, (b) the binding/consuming tranches, (c) the in-scope and
out-of-scope itemisation, (d) the **§0.4 module-layout neutrality clause
re-certifying invariant 16**, (e) the rejected SOTA candidates with
rationale, and (f) the adopted SOTA conventions with their citations. A
reader who wants to know "what frame does this contract sit inside?" gets
the answer from this section alone.

### Status

- **Version**: 2.0.0 (semver major — the two relaxations of §2 and §0.4 are
  *contract-shape* changes, not patches; see §12 changelog).
- **Ratification status**: **DRAFTED v2.0.0 at fourier-D.W5 dispatch;
  RATIFIED jointly at fourier-D.W5 close** (the matrix-flip evidence in
  `CONFORMANCE-MATRIX.md` records value.js's deployed conformance against
  v2.0.0 today); **the value.js side remains user-re-mandate-gated for the
  DEFERRED-TO-VALUE.JS cells** per `D/coordination/CRUD-COHESION.md §6`.
  Joint ratification under v2.0.0 is *evidence-based* (matrix citation),
  not *signature-based*.
- **Supersedes**: v1.0.0 (`4626d4c`, fourier-B.W1 close, 2026-05-26 —
  RATIFIED fourier-unilateral under the orphan verdict, value.js-C
  RETIRED). v2.0.0 re-authors §0, §2, §10, and adds §13; §1, §3–§9, §11,
  §12 carry over verbatim with citation updates only.
- **Cohort**: CRUD facility convergence + identity-model consolidation
  (`coordination/CRUD-CONSTELLATION.md`).
- **Authoring tranches**: fourier-B (v1.0.0 substrate); fourier-D.W5
  (v2.0.0 re-authoring).
- **Consuming tranches**: fourier (`api/lib/crud/` lands at B.W3, conforms
  today); value.js's `palette-api` v2.0.0 (deployed `palette-api-api-1`,
  HTTP 200, 2 months live — conforms partially today, the residual cohort
  is recorded as `DEFERRED-TO-VALUE.JS` cells routed to a value.js
  alignment-tranche per `D/coordination/VALUE-JS-ASK.md`).

### Authority

This document is binding on both repos at the **observable HTTP boundary**.
Edits propagate via both repos' `PROGRESS.md` at the same wave boundary
(`coordination/CRUD-CONSTELLATION.md:108-109`). The change log (§12)
records every amendment with the wave boundary that authored it.

### Scope

In scope:

- The two slug-addressed user-named nouns — fourier's `visualization` and
  value.js's `palette` — and their CRUD contract.
- The shared user/session/admin substrate both nouns sit on.
- The slug *identity* (uniqueness + shape-floor + insert-then-catch), the
  ownership contract, visibility lifecycle, soft-delete semantics, admin
  moderation shape, cron/TTL policy, and the cross-repo `palette_slug` FK
  shape (new in §13).

Out of scope:

- The storage layer (each repo owns its MongoDB schema; see SCHEMA.md).
- The language/framework (Python/FastAPI vs Node/Hono; per-repo wave specs).
- **The per-language module layout that produces the wire behaviour** —
  see §0.4 binding clause below. fourier's `api/lib/crud/` and value.js's
  `api/src/{services, repositories, errors, events, middleware}` are
  **both valid implementations**; neither is normative.
- The UI (each repo owns its consumer surface).
- Entities that are not user-named slug-addressed nouns (fourier's `image`,
  `contour`, `session`, `flag` are shaped by this contract but are
  documented per-repo; this contract names them only where they touch the
  visualization/palette CRUD).
- Image blob storage redesign (deferred to fourier tranche C per
  `B.md §7`; orthogonal to identity convergence).
- **Fourier-specific UI / pipeline coherence rules** (Invariants 18–20
  added at B.md §2 on 2026-05-26 per the Wave-1 audit synthesis at
  `docs/audits/runs/2026-05-26-B-audit-wave-1/SYNTHESIS.md`). Those
  three invariants — Invariant 18 (UI surface conventions: dock-shape
  naming + a11y modal contract + z-token ladder), Invariant 19
  (auto-recompute discipline on the visualization pipeline), Invariant 20
  (Visvalingam-Whyatt + epicycle-render performance budget) — are
  **fourier-side coherence rules** binding fourier's consumer surface.
  They are *not* cross-repo contract clauses; value.js's `palette`
  surface is governed by value.js's own tranche invariants. The
  contract scope is unchanged.

### Binding force (v2.0.0)

Under the v2.0.0 §10 three-way disposition close-rule (see §10 below
and `D/coordination/CRUD-COHESION.md §6.1`), the contract's binding force
is:

- **Mandatory fourier-side**. The §1–§9 + §13 + §S* sections bind fourier
  at v2.0.0 ratification; fourier's `api/lib/crud/` already conforms today
  (W3 landed the helpers; `api/tests/conformance/` carries the runners).
- **Mandatory value.js-side at the observable HTTP boundary**. The same
  sections bind value.js's `palette-api` v2.0.0 — but the per-cell
  conformance is **three-way dispositioned** at §10: cells where value.js
  conforms today are ADDRESSED (PASS); cells where value.js diverges are
  DEFERRED-TO-VALUE.JS (the cohort-reopen path, routed to a value.js
  alignment-tranche per `D/coordination/VALUE-JS-ASK.md`); cells whose
  v1.0.0 clause was over-specified to fourier's accident are
  RETIRED-AS-OVER-SPEC (the v2.0.0 relaxations make them obsolete).
- **No shared framework / codegen / coordinator** (§0.4 below; invariant
  16; Wχ-P3 binding). The two repos meet *at the wire*, not *in the code*.

### §0.4 — Module-layout neutrality (v2.0.0 — invariant 16 re-certification)

> **Binding clause (v2.0.0).** This contract binds the observable CRUD
> behaviour **at the HTTP boundary** — wire shapes, header semantics, error
> envelopes, idempotency semantics, status codes, URL shapes. It does
> **NOT** bind the per-language module layout that produces them.
> fourier's `api/lib/crud/` utility-module layout is one valid
> implementation; value.js's `api/src/{services, repositories, errors,
> events, middleware}` is another. Both conform when their wire-level
> behaviour matches §1–§8 + §13.
>
> **Invariant 16 (no shared framework, no codegen, no coordinator) holds.**
> No `@mkbabb/crud-types` npm or PyPI package emerges from this contract;
> no shared OpenAPI codegen step; no third coordinating service (Redis for
> rate-limit state, NATS for cron fanout, etc.). Conformance is per-repo:
> fourier flips its column on its own conformance suite
> (`api/tests/conformance/`); value.js flips its column on its own future
> conformance suite (a value.js-tranche deliverable, user-re-mandate-gated).
> Cohesion-as-contract, not cohesion-as-shared-code.

The §0.4 clause discharges P3.C1 of Wχ-P3 (the KISS-cohesion adversarial
certification). It is **load-bearing** in v2.0.0: any subsequent amendment
that prescribes a shared module / shared library / cross-repo type import
is a re-litigation of invariant 16 and requires re-opening the tranche
that ratifies the amendment.

### KISS guards (rejected by invariant 16)

The following SOTA candidates were considered and **rejected** as
overengineering under invariant 16 (`B.md:34`); see §9 for the disposition
rationale.

- HATEOAS / hypermedia controls. Reject: KISS, single-purpose JSON.
- JSON:API envelope. Reject: the bare `data + nextCursor + hasMore` shape
  precedent already in value.js (`api/src/routes/palettes.ts:277-290`)
  is two-thirds the spec at one-tenth the ceremony.
- GraphQL. Reject: no client demands query shape variability.
- Webhooks / event sourcing / CQRS. Reject: no second consumer for a
  notification stream; no append-only history requirement.
- **Shared CRUD framework** (BaseCRUDRouter, CRUDMixin, lifecycle
  inversion, "register-your-entity" patterns). Reject: control inversion
  is the rot pattern invariant 16 was always aimed at; ossifies
  legitimate per-repo divergence (palette versioning, visualization
  contour storage). **Per-language utility modules** (slug generation,
  cursor encode/decode, problem+json envelope, ETag middleware,
  Idempotency-Key middleware, soft-delete helpers, pinned-cron pattern)
  are *admitted* under §9 as the honest middle position; they are
  *called by* the application rather than inverting control.
- Codegen (OpenAPI → client SDK; a `crud-types` shared package compiled
  to both Python and TS). Reject: invariant 16 explicit prohibition; the
  contract is text. **v2.0.0 §0.4 makes this rejection load-bearing.**
- A third coordinating service (Redis for rate-limit state, NATS for cron
  fanout, etc.). Reject: invariant 16, "no superfluous-cloud systems".

### SOTA conventions adopted

Where SOTA pays for itself without conjuring complexity:

1. **Cursor pagination with base64url-encoded opaque cursors** (RFC 4648
   §5 base64url alphabet; payload is a JSON object encoding the sort
   key tuple). Precedent: `~/Programming/value.js/api/src/routes/palettes.ts:29-41`
   and `api/routers/gallery.py:57-71`.
2. **ETag + `If-Match` optimistic concurrency** on UPDATE/DELETE of the
   visualization/palette entity. The ETag is the strong validator
   `"<sha256-hex>"`; mutations require a matching `If-Match`. (RFC 9110
   §8.8, §13.1.1.)
3. **Problem+json error format** (RFC 9457): error responses are
   `application/problem+json` with `{type, title, status, detail, instance}`.
   The existing per-repo `{error: "..."}` shape is migrated under §11
   (fourier already conforms; value.js's `{error:{code,message,detail}}`
   shape at `value.js/api/src/errors/index.ts:7` is a DEFERRED-TO-VALUE.JS
   cell per §10).
4. **`Idempotency-Key` header on POST** (Stripe / IETF
   draft-ietf-httpapi-idempotency-key-header) for visualization/palette
   creation and votes/likes. Server keeps a 24-hour replay map of
   `(idempotency_key, user_slug) → response_body, status`.
5. **`Link` header for pagination** (RFC 8288): `rel="next"` and
   `rel="prev"`; first/last omitted (offset-style; cursor pagination
   has no cheap last).
6. **Standard rate-limit headers** (RFC 9239 draft / "RateLimit Fields for
   HTTP"): `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
   on every response; `Retry-After` on 429.
7. **URL shape `/{entity}/{slug}`**, where `entity` is the noun and `slug`
   is a human-readable phrase conforming to the §2 shape-floor. Mongo `_id`
   is never exposed in URLs.

---

## §1 — Identity

**Goal.** Establish that every user-named persisted noun (fourier:
`visualization`; value.js: `palette`) has exactly one user-facing handle —
the slug — and that the two non-user-facing identifiers (content hash and
Mongo `_id`) are never confused with identity.

**Completion.** The three-row identifier table is binding; the hash-policy
sub-block enumerates every surviving content hash with its role; the URL
shape sub-block forbids hash and `_id` exposure in any path or query; and
the C1.1–C1.3 conformance assertions index into the §10 matrix to verify
the three rules by build artefact.

Three orthogonal identifiers; each entity has all three, and each has
exactly one role:

| Identifier | Role | Shape | User-facing? |
|---|---|---|---|
| **Slug** | The one human-readable handle. URL, share link, copy-target. | `^[a-z0-9][a-z0-9-]*$ ≤ 120 chars` per §2 (v2.0.0 shape-floor) | **Yes** — the only user-facing identifier |
| **Content hash** | Deduplication / cache key / ETag substrate. | sha256 hex (64 chars) | **No** — never appears in a URL or share link |
| **Mongo `_id`** | Internal pointer; cursor substrate. | ObjectId or slug-string | **No** — never exposed in API or URL |

### The single-slug rule

- Every user-named persisted noun (fourier: `visualization`; value.js:
  `palette`) has **exactly one** slug, generated or validated server-side
  per §2, unique within its collection, immutable for the lifetime of the
  doc.
- The slug is the canonical addressing handle.
  `GET /visualizations/{slug}`, `GET /palettes/{slug}`.
- Today's incoherence (`docs/audits/runs/2026-05-18-fourier-tranche/e-crud-slug-valuejs.md:24`):
  fourier's gallery URL is the 64-character `snapshot_hash` rather than a
  slug; this is the *exact* incoherence the contract retires. The migration
  in §11 generated a slug for every surviving gallery row at B.W3.

### Hash policy

Content hashes that *survive* the convergence (with their role):

- **fourier**: `sha256` on `images` (dedup; one image per byte-identical
  upload) — survives; `contour_hash` on `contours` (dedup; computed from
  the as-ordered path post-A.W4) — survives; `content_hash` on
  `visualizations` (ETag substrate + `Idempotency-Key` replay map) —
  survives, documented as never user-facing.
- **value.js**: `currentHash` on `palettes` (content-addresses the head
  version; substrate for the `palette_versions` history table at
  `~/Programming/value.js/api/src/routes/palettes.ts:108-149`) — survives.

### URL shape (binding)

| Pattern | Meaning |
|---|---|
| `GET /{entity}/{slug}` | Read by slug |
| `GET /{entity}?cursor=...` | List (cursor pagination per §0) |
| `POST /{entity}` | Create (slug generated server-side OR validated server-side per §2) |
| `PATCH /{entity}/{slug}` | Update (requires `If-Match` ETag per §0) |
| `DELETE /{entity}/{slug}` | Soft-delete (requires `If-Match` ETag) |
| `POST /{entity}/{slug}/restore` | Restore from soft-delete (within grace) |

Mongo `_id`, content hashes, and session tokens **never** appear in a URL
path or query string.

### Conformance assertions (indexed by §10)

- **C1.1** — `grep -rE '/(visualizations|palettes|gallery|snapshots)/[0-9a-f]{32,}'`
  over `web/src/`, `~/Programming/value.js/api/src/`, and value.js web
  sources returns zero. No content hash in any client-side URL pattern.
- **C1.2** — every `GET /{entity}/{slug}` for a slug matching the §2
  shape-floor returns 200; every request matching `^[0-9a-f]{40,}$`
  returns 400 with problem+json `type=urn:contract:slug-invalid`.
- **C1.3** — the response body of `GET /{entity}/{slug}` does **not**
  contain a `_id` field at the top level. (value.js's
  `format/palette.ts:59` emits `id: String(_id)` today — a
  DEFERRED-TO-VALUE.JS cell per §10.)

---

## §2 — Slug identity (v2.0.0 — relaxed)

**Goal.** One slug *identity* across both repos — uniqueness within the
entity's collection, a permissive shape-floor accepting both
server-generated and server-validated-user-supplied modes, and
insert-then-catch collision handling (no check-then-insert TOCTOU race).
v2.0.0 **relaxes** v1.0.0's `^[a-z]+(-[a-z]+){3}$` 4-word constraint —
that shape was a fourier-specific accident (the `coolname` library's
default); the binding identity is *uniqueness*, *shape-floor*, and
*insert-then-catch*, **not word-count**.

**Completion.** The shape-floor rule (`^[a-z0-9][a-z0-9-]*$ ≤ 120 chars`,
the v2.0.0 permissive form; either repo MAY enforce a tighter local
shape), the **dual-mode generation rule** (server-generated OR
server-validated-user-supplied), the collision rule (`DuplicateKeyError`
catch retry up to 10 times for server-generated, single-attempt with
`409 Conflict` for user-supplied), and the per-repo word-list dispositions
are each pinned by a C2.1–C2.4 row in §10.

### Slug identity binding (v2.0.0)

> **§2 — Slug identity (v2.0.0).** Each entity is identified by exactly
> one user-facing handle, the *slug*. The slug satisfies the **shape-floor**
> `^[a-z0-9][a-z0-9-]*$`, length ≤ 120 chars; both repos MAY enforce a
> tighter local shape (fourier's `^[a-z]+(-[a-z]+){3}$` 4-word form is one
> valid tightening — the contract permits it but does not require it; the
> shape-floor is the cross-repo binding). The slug is generated by ONE of
> two modes:
>
> **(a) Server-generated** — cryptographic-RNG. e.g. fourier's `coolname`
> 4-word form (the anonymous/auto-creation paths: visualization
> create-from-extracted-contour flow — no human is naming it); value.js's
> `generateSlug` adjective-verb-color-animal form for unnamed user
> creations.
>
> **(b) Server-validated-user-supplied** — explicit-naming flows. e.g.
> value.js's "name your palette" UX where the create body carries the user's
> chosen slug (`value.js/api/src/validation/palette.ts:43` — `slug:
> slugSchema` in `createPaletteBody`). The slug passes the shape-floor
> check before write.
>
> Both modes MUST handle collision via **insert-then-catch**:
> - Mode (a): `DuplicateKeyError`/`MongoServerError code=11000` retry ≤ 10
>   attempts with fresh slugs; after 10 failures, return 503 with
>   problem+json `urn:contract:slug-exhausted`.
> - Mode (b): single-attempt insert; on collision return `409 Conflict`
>   with problem+json `urn:contract:slug-conflict`.
>
> No check-then-insert TOCTOU pattern. The content-hash and Mongo `_id`
> are NEVER user-facing identity (§1.3).

### Per-repo realisations (informative, not binding)

- **fourier**: server-generated only (the visualization noun is created
  from an extracted contour; no naming UX). `api/lib/crud/slugs.py`
  `slug_with_retry`. The shape happens to be `^[a-z]+(-[a-z]+){3}$` (a
  tightening of the v2.0.0 shape-floor) — the contract permits this
  tightening.
- **value.js**: server-generated for the unnamed creation path; user-supplied
  for the explicit-naming path (`palette-api` admits both). The shape is the
  v2.0.0 shape-floor verbatim (`value.js/api/src/validation/palette.ts:19-23`
  `slugSchema = z.string().min(1).max(120).regex(/^[a-z0-9][a-z0-9-]*$/)`).
  Insert-then-catch via `MongoServerError code=11000`.

Both modes are first-class. v2.0.0 is **not** prescriptive about which mode
a given entity uses — that is a per-app product decision; the contract
binds only the wire-level identity properties (uniqueness, shape-floor,
collision handling).

### Word-list dispositions (informative)

- **fourier**: uses the `coolname` library (third-party, MIT) plus the
  `docs/precepts/data/slug-words.json` precepts-submodule entries (R3
  disposition, B.W3 landed) for the visualization slug pool.
- **value.js**: uses its own `slugWords.ts` (in-repo, 4 lists of 120–128
  words each: adjectives, verbs, colors, animals;
  `value.js/api/src/slugWords.ts`).
- The two lists are **NOT** required to coincide. v1.0.0's "word-list
  membership" assertion (C2.4) is RETIRED-AS-OVER-SPEC under v2.0.0 §2 —
  the slug identity binding does not require a shared word list. Each
  repo's emitted slugs are valid by virtue of conforming to the shape-floor
  and being unique within their collection; their word-list provenance is
  a per-repo concern.

### Conformance assertions

- **C2.1** — every server-generated slug matches the v2.0.0 shape-floor
  `^[a-z0-9][a-z0-9-]*$` (length ≤ 120). Each repo's tighter local shape
  (e.g. fourier's 4-word form) is a valid subset.
- **C2.2** — forced slug collision triggers retry path (server-generated
  mode): `DuplicateKeyError`/`MongoServerError code=11000` raised twice,
  succeeds on third attempt within `max_attempts = 10`.
- **C2.3** — no `find_one(...slug...) && generate_slug` check-then-insert
  pattern in either repo (`scripts/conformance/grep-no-check-then-insert.sh`).
- **C2.4** — *(retired in v2.0.0 — was "word-list membership"; the §2
  relaxation makes this clause obsolete; the matrix row is dispositioned
  RETIRED-AS-OVER-SPEC)*.
- **C2.5** — *(new in v2.0.0)* user-supplied mode: `POST` with a body slug
  that collides returns `409 Conflict` + problem+json
  `urn:contract:slug-conflict`. fourier MAY skip this row (no naming UX);
  value.js binds it.

---

## §3 — Ownership

**Goal.** Every persisted user-named entity carries a required, non-null
owner; anonymous mutation is forbidden; cross-owner mutation is forbidden;
admin override is the only exception and is itself logged.

**Completion.** Owner-required schema validation (`owner_slug` non-null in
the Mongo validator), `require_session` on every mutation, the
`doc.owner_slug == user_slug` check on every PATCH/DELETE, and the
admin-audit row on every override are pinned by C3.1–C3.4 in §10. The
migration in §11 produces zero null-owner rows.

### Required owner

- Every persisted user-named entity has a **required, non-null** owner
  field.
- fourier: `owner_slug` (`api/models/visualization.py:103`).
- value.js: `userSlug` (the value.js `Palette` model carries
  `userSlug: string | null` + legacy `sessionToken` shim at
  `value.js/api/src/models.ts:73-74` — a DEFERRED-TO-VALUE.JS cell per
  §10, awaiting the value.js-side alignment-tranche).

### Anonymous publish is forbidden

- `resolve_session()` returning `None` on a `POST` / `PATCH` / `DELETE` to
  the entity collection raises **401**, not produce a `user_slug: None`
  row.
- The frontend obtains a session before the first save (the existing
  `ensureUser()` substrate); the backend never auto-registers on save.
- Read endpoints (`GET`) remain anonymous-permissible (visibility-aware
  per §4).

### Ownership-bound endpoints

Every mutation on an existing entity requires both:

1. `require_session` (a valid `X-Session-Token` per §6).
2. `doc.owner_slug == user_slug` — otherwise **403** with problem+json
   `type=urn:contract:not-owner`.

This is today's fourier `api/routers/visualizations.py` and value.js's
`~/Programming/value.js/api/src/routes/palettes.ts:485-489`. The contract
makes it universal across the converged entity.

### Admin override

Admins may mutate or delete any entity regardless of ownership; the action
is recorded in `admin_audit` (§7).

### Conformance assertions

- **C3.1** — `POST /visualizations` without `X-Session-Token` returns 401
  with problem+json `urn:contract:owner-required`; `POST /palettes`
  likewise.
- **C3.2** — `PATCH /visualizations/{slug}` with a session for a
  *different* user returns 403 with problem+json `urn:contract:not-owner`.
- **C3.3** — schema validation: insert of an entity doc with
  `owner_slug: null` rejected by MongoDB validator.
- **C3.4** — `db.visualizations.countDocuments({owner_slug: null}) == 0`
  after migration (per §11); same for `db.palettes.countDocuments({userSlug: null})`.

---

## §4 — Visibility

**Goal.** A 3-state visibility lifecycle (`draft`, `unlisted`, `public`)
that supersedes the prior 2-state `private/public` proposal and the
fourier/value.js `tier`/`status` conflations; transitions are unconstrained
to the owner, anonymous reads see only `public`, and draft reads to
non-owners return 404 (not 403).

**Completion.** The 3-state schema enum, the anonymous-list filter
(`visibility == "public" AND deleted_at == null`), the
draft-404-to-non-owner rule, and the owner-can-see-all rule are pinned
by C4.1–C4.4 in §10.

### Three states

`visibility ∈ {"draft", "unlisted", "public"}`.

| State | Meaning |
|---|---|
| **draft** | Private to the owner. Not listed; not accessible by slug to non-owners (404). |
| **unlisted** | Accessible by slug to anyone with the link; not in any public list. |
| **public** | Accessible by slug; included in `GET /{entity}` (the gallery). |

### State transitions

All forward and reverse transitions among the three states are permitted
to the owner. A soft-delete (§5) is reversible to the *previous* visibility
within the grace window; a hard-delete is irreversible. v2.0.0 admits an
optional transition guard (`public → draft` rejected per the
`visibility_illegal_transition` catalog helper; the visibility transition
is two-step via `unlisted`) — fourier landed this at W3 per D.R1's
C4.5/C4.6 disposition; value.js's side is the value.js-tranche's call.

### List filter semantics (binding)

- `GET /{entity}` (no auth, anonymous): returns **only** rows with
  `visibility == "public" AND deleted_at == null`. Drafts and unlisted
  rows are never enumerated.
- `GET /{entity}?owner=me` (requires session): returns the caller's
  own rows in **all** three visibility states.
- `GET /{entity}/{slug}`:
  - `visibility == "public"`: returns to anyone.
  - `visibility == "unlisted"`: returns to anyone with the slug; the
    response does not include the slug in any enumeration.
  - `visibility == "draft"`: returns to the owner only; non-owners get
    **404** (not 403 — refuses to confirm existence).

### Field name binding

- The contract field is `visibility`.
- fourier's existing `tier` field is an **admin-only** concern (§7), not
  user-controlled visibility.
- value.js's existing single 4-state `status` field
  (`published | featured | hidden | draft` at
  `value.js/api/src/models.ts:29`) is a conflation: the value.js-side
  alignment-tranche splits this into `visibility + tier` per §11. A
  DEFERRED-TO-VALUE.JS cell per §10.

### Conformance assertions

- **C4.1** — schema validation: `visibility` is enumerated to
  `{draft, unlisted, public}`; other values rejected.
- **C4.2** — anonymous `GET /visualizations` over a fixture seeded with
  one of each state returns only the `public` row.
- **C4.3** — anonymous `GET /visualizations/{slug}` for a `draft` row
  returns 404.
- **C4.4** — `GET /visualizations?owner=me` with the owner's session
  returns all three states.

---

## §5 — Soft-delete

**Goal.** `DELETE` is a soft-delete (single-field write of `deleted_at`)
with a 30-day grace window; restoration is available within grace; the
cron hard-deletes past grace; admin alone may bypass the grace window;
slugs of soft-deleted rows are not released to the pool until hard-delete.

**Completion.** The `deleted_at` field semantics, the 30-day grace
default, the `POST /{entity}/{slug}/restore` endpoint, the cron's
bounded-query hard-delete (no unbounded `$nin`), and the
slug-non-release rule are pinned by C5.1–C5.4 in §10.

### Field

- `deleted_at: datetime | null`. `null` means alive.
- Soft-delete is a **single field write**; no row is moved to a
  separate collection.
- The cron (§8) hard-deletes rows where
  `deleted_at < now() - grace_window`.

### Grace window

- Default **30 days**. Configurable per repo via env var.
- Within the grace window the owner may restore via
  `POST /{entity}/{slug}/restore`. Restoration sets
  `deleted_at = null` and `restored_at = now()` (audit field).
- After the grace window the row is hard-deleted by the cron; restoration
  returns 404.

### Read behaviour

- All list and slug-read endpoints filter `deleted_at == null` by default.
- An owner-scoped endpoint `GET /{entity}?owner=me&include_deleted=true`
  returns soft-deleted rows so the owner can see and restore them.
- A soft-deleted row's slug is **not** released to the pool. A re-create
  with the same slug returns 409 until hard-delete passes the grace
  window.
- For the cross-repo `palette_slug` FK (§13): a soft-deleted palette
  returns `410 Gone` (distinguishable from 404 never-existed) so fourier
  can distinguish FK-dangling-by-deletion from FK-dangling-by-typo.

### Hard-delete prohibition

- Outside admin (§7) and the cron (§8), **no endpoint hard-deletes**.
- Admin's hard-delete bypasses the grace window for moderation. Logged in
  `admin_audit`.

### Cron interaction (cross-ref §8)

- Bounded query: `db.collection.deleteMany({deleted_at: {$lt: grace_cutoff}})`.
- B-tree index on `deleted_at` required.

### Per-repo status

- **fourier**: conforms today (`api/lib/crud/softdelete.py`,
  `POST /{slug}/restore` endpoint live).
- **value.js**: HARD cascade delete today
  (`value.js/api/src/services/palette/crud.ts:219-247` deletes palette +
  votes + flags in one operation). The largest single delta; a
  DEFERRED-TO-VALUE.JS cell cluster per §10, routed to the value.js
  alignment-tranche's I.W2 wave per `D/coordination/VALUE-JS-ASK.md`.

### Conformance assertions

- **C5.1** — `DELETE /visualizations/{slug}` followed by
  `GET /visualizations/{slug}` returns 404 (anonymous) and 200 to the
  owner with `include_deleted=true`.
- **C5.2** — `POST /visualizations/{slug}/restore` within the grace
  window returns 200.
- **C5.3** — a fixture row with
  `deleted_at = now() - (grace_days + 1)` is removed by one cron tick.
- **C5.4** — every `delete_many` / `deleteMany` call uses a bounded query.

---

## §6 — Sessions

**Goal.** One session contract both APIs honour — opaque UUIDv4 token in
`X-Session-Token` (never a cookie), 30-day TTL, suspension cache with
explicit single-replica constraint, timing-safe login that masks user
enumeration by a ≥200 ms constant delay.

**Completion.** The token-shape rule, the header-not-cookie rule, the
30-day TTL, the suspension-cache 60-second-TTL pattern, and the
timing-safe login are pinned by C6.1–C6.4 in §10.

### Token shape

- Opaque UUIDv4 (RFC 4122). Not a slug, not derivable from the user_slug.
- Length: 36 chars.

### Header

- **`X-Session-Token: <uuid>`** on every authenticated request.
- The contract forbids cookies for session transport.

### TTL

- **`session_ttl_days = 30`** at registration.
- Every authenticated request touches `last_seen_at`.
- The cron (§8) hard-deletes sessions where `expires_at < now()`.

### User document

- Keyed by `_id = user_slug`.
- Fields: `created_at`, `last_seen_at`, optional `status: "suspended"`.

### Suspension cache

- 60-second TTL in-memory cache of suspended `user_slug`s; single-replica
  constraint per invariant 12.

### Endpoints (binding shape)

| Method | Path | Body | Returns |
|---|---|---|---|
| `POST` | `/sessions` | (none) | `{token, user_slug}` (201) |
| `POST` | `/sessions/login` | `{slug}` | `{token, user_slug}` (200), 404 if no such user |
| `GET` | `/sessions/me` | — | `{user_slug, created_at}` (requires session) |
| `DELETE` | `/sessions` | — | `{ok: true}` (revokes current) |

### Login timing-safety

`POST /sessions/login` returns after a constant ≥200 ms delay regardless
of whether the slug exists.

### Conformance assertions

- **C6.1** — `POST /sessions` round-trip.
- **C6.2** — `DELETE /sessions` invalidates the token.
- **C6.3** — login timing-safe (< 50 ms difference over 100 trials).
- **C6.4** — suspended-user 403 with `urn:contract:account-suspended`.

---

## §7 — Admin moderation

**Goal.** Bearer-token admin auth with timing-safe comparison; eight
named actions (flag / dismiss / feature / delete / suspend / unsuspend /
delete-user / batch-*); every action is **idempotent** and writes an
`admin_audit` row; toggle endpoints are renamed to explicit setters to
preserve idempotency.

**Completion.** The action-table contract, the idempotency rule, the
batch-return-shape (207 partial / 200 full / 400 none), the flag
`(entity_slug, reporter_slug)` uniqueness index, and the
admin-hard-delete-bypasses-grace rule are pinned by C7.1–C7.5 in §10.

### Auth

- Bearer-token admin auth: `Authorization: Bearer <ADMIN_TOKEN>`.
- Timing-safe comparison.

### Actions

The contract binds the **action shape**, not the exact endpoint paths.

| Action | Target | Semantics | Idempotent? |
|---|---|---|---|
| `flag` | entity slug | non-admin: register a complaint | yes (per `(target, reporter)` unique) |
| `dismiss_flags` | entity slug | clear all flags on the entity | yes |
| `set_tier` (idempotent setter) | entity slug | set `tier = <value>` | yes (replaces toggle-style `feature` toggles) |
| `delete` | entity slug | hard-delete (bypasses grace) | yes (post-state) |
| `suspend_user` | user slug | set `users.status = suspended` | yes |
| `unsuspend_user` | user slug | clear `users.status` | yes |
| `delete_user` | user slug | hard-delete user + cascade | yes (post-state) |
| `batch_*` | array of slugs | apply action to each | yes per-element |

### Idempotency

Re-applying an action that has already happened is a **no-op with 200**,
not a 409. Toggle-style endpoints (today value.js's "feature" toggles at
`value.js/api/src/routes/admin/palettes.ts:11-15`) are renamed to
explicit `set_tier` actions to preserve idempotency. A DEFERRED-TO-VALUE.JS
cell per §10 — value.js's toggle is currently non-idempotent.

### Audit log

- Every admin mutation writes one row to `admin_audit`.
- Audit retention: 90 days.

### Batch return shape

A batch action returns `{ok, affected, errors?}` (the W5.c contract-bug
fix; the retired `{processed, errors}` offset shape is gone).

### Flag uniqueness

- `(entity_slug, reporter_slug)` is unique. Double-flagging by the same
  reporter returns 409.

### Conformance assertions

- **C7.1** — audit row per action.
- **C7.2** — idempotent suspend.
- **C7.3** — non-admin 401/403.
- **C7.4** — flag uniqueness.
- **C7.5** — admin hard-delete bypasses grace.

---

## §8 — Cron / TTL policy

**Goal.** A 6-hour cron tick that makes only bounded queries — every
`$nin` is over a known-small `distinct()` set, or replaced by the
indexed `pinned: bool` flag.

**Completion.** The bounded-query rule, the cleanup-category ordering
(expired sessions → soft-deleted-past-grace → stale users → orphan
children → audit retention), and the cron idempotency are pinned by
C8.1–C8.4 in §10.

### Tick

- Cron tick interval: **6 hours**.
- Idempotent.

### Bounded queries only

The cron makes **no unbounded `$nin`** query.

### Cleanup categories (binding order)

1. **Expired sessions**: `{expires_at: {$lt: now}}`.
2. **Soft-deleted entities past grace** (§5).
3. **Stale users**: `{last_seen_at: {$lt: now - user_ttl_days}}` → cascade.
4. **Orphan children**: `$nin` over a *bounded* `distinct()` of live parents.
5. **Audit retention**: `admin_audit` rows older than 90 days.

### Conformance assertions

- **C8.1** — no unbounded `$nin`.
- **C8.2** — one tick clears fixture.
- **C8.3** — required indexes exist (compound `(pinned, last_accessed_at)`).
- **C8.4** — cron idempotent.

---

## §9 — Shared data vs shared code (R3 disposition; v2.0.0 inv-16 binding)

**Goal.** Sort every cross-cutting concern into exactly one of five
dispositions — `contract` (text-only), `data` (a shared JSON file),
`library` (a published code package), `service` (a coordinating
runtime), or `per-repo` (intentional duplication), with the sixth
disposition `utility` (per-language in-repo utility modules) admitted
per the 2026-05-19 DECISION.md — and reject the shared-CRUD-framework
anti-pattern (the rot pattern invariant 16 was always aimed at).

**Completion.** The 1-row-per-target table is binding; the §0.4
module-layout-neutrality clause is the v2.0.0 binding restatement; the
§0 KISS-reject list and the Wχ-P3 KISS adversarial certification enforce
the no-shared-framework rule; and the C9.1–C9.4 rows pin (a) the shared
word-list-data file (per-repo today; the cross-repo membership clause
RETIRED per §2 relaxation), (b) the process-local rate-limiter, (c) the
absence of a shared framework, and (d) the utility-module admit-criteria
conformance.

### Disposition table (R3 + 2026-05-19 DECISION.md + v2.0.0)

| Target | Disposition | Rationale | Conformance |
|---|---|---|---|
| Slug algorithm (shape, length, collision policy) | **contract** | Logic, not data; cheaper to specify in text than ship a code package. v2.0.0 §2 relaxed. | §2 C2.1-C2.3, C2.5 |
| Slug word lists | **per-repo** (v2.0.0; v1.0.0's "shared data" RETIRED) | The v2.0.0 §2 relaxation does not require a shared word list; each repo's word list is a local-data concern. fourier uses `coolname` + precepts entries; value.js uses `slugWords.ts`. | C2.4 RETIRED |
| **Per-language utility module** | **utility** (in-repo; `api/lib/crud/` for fourier, `api/src/lib/crud/` for value.js — or value.js's `services+repositories+errors+events` idiom, which is functionally equivalent at the wire) | Per the v2.0.0 §0.4 module-layout-neutrality clause: the contract does not bind which file holds which utility, only that the wire behaviour matches. | C9.4 |
| Identity model (slug ↔ id ↔ hash separation) | **contract** | Pure rule. | §1 C1.1-C1.3 |
| Ownership rules (required owner, 401-on-anonymous) | **contract** | Pure rule. | §3 C3.1-C3.4 |
| Visibility states + transitions | **contract** | Pure rule. | §4 C4.1-C4.4 |
| Soft-delete semantics + grace window | **contract** | Pure rule. | §5 C5.1-C5.4 |
| Session shape + TTL | **contract** | Pure rule. | §6 C6.1-C6.4 |
| Admin actions + audit shape | **contract** | Pure rule. | §7 C7.1-C7.5 |
| Cron/TTL policy + bounded-query rule | **contract** | Pure rule. | §8 C8.1-C8.4 |
| Hash policy (which hashes survive, role) | **contract** | Pure rule. | §1 hash policy block |
| Migration discipline | **contract** | Pure rule + precedent. | §11 C11.1-C11.3 |
| Rate-limiter (in-memory, per-process) | **per-repo** | Process-local state; single-replica constraint per invariant 12. | C9.2 |
| MongoDB driver / framework | **per-repo** | Out of scope by invariant 16. | — |
| **Cross-repo FK shape (`visualization.palette_slug` ⇄ `palette.slug`)** | **contract** (new in v2.0.0 §13) | The one binding cross-repo artefact: shape + existence binding, not code-shared. | §13 (new) |
| `Palette` domain type | **per-repo** (was "library" in v1.0.0; held latent for a value.js re-engagement) | Under the orphan verdict, no cross-repo library artefact ratifies; value.js's npm `@mkbabb/value.js` library is one consumer surface, fourier's pydantic is another. | — |
| `colorScale`, `sampleToSVGPath` helpers | **per-repo or value.js-library iff published** | Colour-lift sub-item from C.coordination/COLOUR-LIFT.md; iff value.js publishes `sampleToSVGPath`, fourier consumes via npm import. v0.10.0 does NOT export it (verified at W5 dispatch); held as named residual. | per `D/coordination/VALUE-JS-ASK.md §colour-lift` |

### Rejected: shared CRUD framework / codegen / coordinating service

Per §0.4 (v2.0.0 binding clause) — **invariant 16 holds**. No shared
package, no codegen, no third coordinating service.

### Conformance assertions

- **C9.1** — *(retired in v2.0.0 — was "shared word-list data file"; the §2
  relaxation makes a cross-repo membership clause obsolete; per-repo
  word-list provenance is the binding form)*. fourier's local conformance:
  every generated slug's words belong to the loaded local list.
- **C9.2** — rate-limiter state process-local in both repos.
- **C9.3** — `grep -rE "from .* import shared_crud|require\(.*shared-crud"`
  returns zero in both repos. No third coordinating service in
  `docker-compose*.yml`.
- **C9.4** — the per-language utility surface admits to the §0.4 binding:
  no `class .*Router|class .*Mixin|register_entity|@register` pattern;
  each utility is *called by* router code, never the inverse.

---

## §10 — Conformance test matrix (LOAD-BEARING — v2.0.0 three-way close-rule)

**Goal.** Index every conformance assertion C\*.\* named in §1–§9 + §13
into a testable artefact at a named path in each repo; the matrix is the
literal close-on substrate that converts "the contract says X" into "a
test run in CI fails if X regresses".

**Completion.** Every row carries a non-empty test name + run command +
expected output in each repo. The §U amendment extends the matrix with
utility-module rows. The v2.0.0 three-way close-rule (below) is binding.

The canonical matrix is `coordination/CONFORMANCE-MATRIX.md`.

### v2.0.0 three-way close-rule (REINTERPRETS v1.0.0's binary close-rule)

> **§10 close-rule (v2.0.0).** Every row of `CONFORMANCE-MATRIX.md` carries
> per-repo cells. v1.0.0's literal "both columns PASS" gate becomes
> v2.0.0's **three-way dispositioning**: every cell is named as one of:
>
> - **ADDRESSED** — the repo conforms to the row's clause today; the cell
>   reads PASS. Citation: a `value.js/api/src/<path>:<line>` (for value.js)
>   or `api/<path>:<line>` (for fourier) verified at the disposition time.
>
> - **DEFERRED-TO-VALUE.JS** — the row's clause is a value.js-side delta;
>   the responsible value.js alignment-tranche wave is named (per the
>   I.W1-W4 sketch in `D/coordination/VALUE-JS-ASK.md`); the cell stays
>   cited but the next responsible actor is recorded.
>   **DEFERRED-TO-VALUE.JS is the cohort-reopen path, not a fail.**
>
> - **RETIRED-AS-OVER-SPEC** — the v1.0.0 clause was an over-specification
>   of fourier's accidents (e.g. the 4-word slug shape; the shared
>   word-list membership). v2.0.0 relaxes; both apps conform to the relaxed
>   form; no value.js delta is needed.
>
> §10 closure under v2.0.0 = "every cell is named with one of the three
> dispositions; no cell is unaddressed/silent". DEFERRED-TO-VALUE.JS cells
> are tagged in `D/coordination/VALUE-JS-ASK.md` as the cohort hand-off
> brief.

**Per-repo matrix flip discipline (P3.C2 binding).** fourier flips its
column on its own conformance suite (`api/tests/conformance/`); value.js's
column is **dispositioned** by fourier reading value.js source as a
read-only audit, NOT flipped on fourier's behalf. value.js's column flips
on its own future conformance suite (a value.js-tranche deliverable). No
shared CI harness, no shared assertion library, no shared mock fixtures.

### Run-command index

Aggregate run commands per repo:

- fourier: `uv run pytest -k 'conformance'` from the repo root.
- value.js: `npm run test:conformance` from `~/Programming/value.js/api/`
  (to be authored by the value.js alignment-tranche per
  `D/coordination/VALUE-JS-ASK.md`).

### Out-of-tree assertions (source-grep)

- `scripts/conformance/grep-no-check-then-insert.sh` (C2.3)
- `scripts/conformance/grep-no-unbounded-nin.sh` (C5.4, C8.1)
- `scripts/conformance/grep-no-shared-framework.sh` (C9.3)

---

## §11 — Migration disposition

**Goal.** Every legacy field-or-collection that this contract supersedes
gets a backfill plan that is idempotent, dry-runnable, count-verified,
crash-safe, and either reversible or completeness-proven.

**Completion.** The fourier per-collection table (snapshots + gallery →
visualization) and the value.js table (`status` split into `visibility +
tier`; null-owner sweep; sessions TTL cutover) are binding. C11.1–C11.3
pin idempotency, count-verify artefacts, and 10-row spot-check.

### Discipline (binding)

Every migration script in either repo conforms to:

1. **Idempotent.** Re-running yields zero additional writes.
2. **Dry-run flag** (`--dry-run` / `DRY_RUN=1`).
3. **Count-verify**. Pre-flight count, post-flight count, spot-check.
4. **Failure recovery**. A crash at 50% leaves the database consistent.
5. **Reversible OR completeness-proven.**

### Per-collection migration plan

#### fourier (B.W3, landed)

| Source collection | Source field | Destination | Action |
|---|---|---|---|
| `snapshots` | `snapshot_hash` | `visualization.content_hash` | move; **not user-facing** |
| `gallery` | (rest) | `visualization` (new) | direct copy + slug-generation |

#### value.js (value.js-I.W2, user-re-mandate-gated)

| Source field | Destination | Action |
|---|---|---|
| `palettes.status: "published" | "featured" | "hidden" | "draft"` | `palettes.visibility, palettes.tier` | split per §4 |
| `palettes.sessionToken` (legacy shim) | strip | confirm all rows carry non-null `userSlug` |
| (none) | `palettes.deletedAt` | add column (null for all existing) per §5 |

### Conformance assertions

- **C11.1** — second run of the migration produces zero writes.
- **C11.2** — `--verify` produces count artefact.
- **C11.3** — 10-row spot-check.

---

## §12 — Open items & change log

### Open items (each with a destination)

| Item | Discussion | Destination |
|---|---|---|
| value.js-side alignment (visibility split, soft-delete, SOTA envelopes, top-level `id` strip) | DEFERRED-TO-VALUE.JS per §10 | value.js alignment-tranche (user-re-mandate-gated) per `D/coordination/VALUE-JS-ASK.md` |
| Image-blob inline storage (band-aid `storage_budget_gb`) | invariant 12 honesty | fourier tranche C (closed) |
| Colour-lift consume (`sampleToSVGPath`) | C.W4 inverted δ edge | named residual at W5 (value.js v0.10.0 does NOT export); fires iff value.js publishes |
| Conformance suite for value.js | a value.js-tranche deliverable | named in `VALUE-JS-ASK.md §conformance-suite` |

### Change log

| Version | Date | Wave | Change |
|---|---|---|---|
| 0.1.0-draft | 2026-05-19 | B.W1 (in flight) | initial authoring by A1 |
| 1.0.0 | 2026-05-26 | B.W1 close | RATIFIED fourier-unilateral (commit `4626d4c`); value.js-C sign-off DEFERRED per orphan verdict |
| **2.0.0** | **2026-05-27** | **D.W5** | **RE-AUTHORED (not amended): §0 supersession + §0.4 module-layout neutrality (inv-16 re-cert per P3.C1); §2 relaxed (admits user-supplied slugs; binds slug-identity not word-count); §10 three-way close-rule (ADDRESSED / DEFERRED-TO-VALUE.JS / RETIRED-AS-OVER-SPEC per P3.C2 + CRUD-COHESION §6.1); §13 new (cross-repo `palette_slug` FK contract — opaque-by-slug, shape + existence, no shared HTTP client). v1.0.0's word-list membership clause (C2.4) RETIRED-AS-OVER-SPEC; v1.0.0's slug shape `^[a-z]+(-[a-z]+){3}$` retained as a valid local tightening but not the cross-repo binding.** |

---

## §13 — Cross-repo FK contract: `visualization.palette_slug` ⇄ `palette.slug` (NEW in v2.0.0)

**Goal.** Bind the one concrete cross-repo coupling — fourier's
`visualization.palette_slug` field at `api/models/visualization.py:119`
that references a value.js palette by slug — as a **shape + existence**
contract, NOT a code-shared coupling. The contract binds the wire-level
shape of the slug fourier stores and the wire-level shape of value.js's
resolution endpoint; it does NOT bind any shared HTTP client, shared
validation library, or shared TypeScript type.

**Completion.** The `palette_slug` field semantics, the resolution
endpoint shape, the opaque-by-slug write-time discipline, and the
soft-delete-distinguishability rule are pinned by C13.1–C13.3 in §10.

### Binding clause (v2.0.0)

> **§13 — Cross-repo FK contract.** fourier's `visualization` entity
> carries an optional `palette_slug: str | None` field
> (`api/models/visualization.py:119`) that references a value.js palette.
> The FK is **opaque-by-slug**: fourier stores a validated slug, never a
> hash, never a URL substring, never the `palette.id` top-level field
> value.js currently emits (which the v2.0.0 §1.3 binding forbids; a
> DEFERRED-TO-VALUE.JS cell). value.js's `GET /palettes/:slug`
> (`value.js/api/src/routes/palettes/crud.ts:60-64`) is the resolution
> path; the slug is the lookup key. fourier does NOT cross-service-validate
> at write-time (no synchronous resolve call) — KISS, invariant 12.
> value.js's soft-delete (when §5 lands on value.js's side per the I.W2
> wave) returns 410 Gone for soft-deleted palettes (distinguishable from
> 404 never-existed); fourier's product surface chooses the
> unresolvable-FK rendering. The contract binds the *shape*; the
> *resolution* policy is per-app.

### Fourier guarantees (the FK holder)

- `Visualization.palette_slug: str | None` — nullable; the visualization
  may carry no palette association (None is the legitimate empty state).
- When non-`None`, the slug conforms to the §2 shape-floor
  (`^[a-z0-9][a-z0-9-]*$`, length ≤ 120).
- Uniqueness is **within the `visualization` document scope only** —
  fourier stores the slug as an *opaque foreign key*; uniqueness within
  the *palette space* is value.js's invariant.
- Fourier does **not** validate that the slug resolves at write time (no
  cross-repo round-trip on `POST /visualizations` or
  `PATCH /visualizations/{slug}`). The slug may become stale if the
  upstream palette is deleted; fourier carries this as
  graceful-degradation.
- The slug is **ETag-participating** (`etag.py:14` `_DEFAULT_FIELDS`
  includes `palette_slug`; a slug change rotates the visualization's
  ETag).
- The slug is **exposed verbatim** on `GET /visualizations/{slug}` (no
  enrichment, no resolve-and-inline of the palette payload) — the client
  fetches the palette separately.

### Value.js guarantees (the palette source-of-truth)

- `GET /palettes/{slug}` returns HTTP 200 with the palette envelope iff
  (a) the palette exists and (b) it is visible to the caller.
- Returns HTTP 404 in all other cases (or 410 for soft-deleted, once §5
  lands on value.js's side — DEFERRED-TO-VALUE.JS).
- The slug in the URL is the **stable identity** — no hash, no version
  suffix, no DB `_id` in the path.
- Slug uniqueness within the palette space is enforced via a Mongo unique
  index on the value.js side.
- Slug **immutability**: once created, the slug does not change for that
  palette's lifetime.

### Cross-repo invariant

The FK is *resolve-only*, not *enforce-at-write*. Fourier never reaches
across to value.js on the write path; value.js never reaches across to
fourier. Only cross-repo traffic is the read-side (fourier's frontend
fetches `GET /palettes/{slug}`). This orthogonality is the load-bearing
KISS property — meet-at-the-wire, not meet-in-the-code (P3.C3 binding).

**No shared HTTP client, no shared validation library, no cross-repo
TypeScript type import.** Fourier validates with its own pydantic regex;
value.js validates with its own zod regex
(`value.js/api/src/validation/palette.ts:19-23`). The two regex strings
coincide by *text* (the v2.0.0 relaxation chose value.js's shape as the
shared shape-floor), not by *code*.

### Conformance assertions

- **C13.1** — `Visualization.palette_slug` field accepts only values
  conforming to the §2 shape-floor; non-conforming values rejected at
  schema validation. Source: `api/models/visualization.py:119` + pydantic
  validator.
- **C13.2** — no cross-repo HTTP call from fourier's write path. Source:
  `grep -rE 'requests\.|httpx\.|aiohttp\.' api/routers/visualizations.py`
  returns zero matches against the value.js palette-api hostname.
- **C13.3** — `GET /palettes/{slug}` (value.js side) returns 404 for
  missing, 410 for soft-deleted (post-§5-landing), 200 for live. value.js
  binds this; fourier consumes via the frontend's `web/src/lib/api.ts`.

---

## Appendix — Cross-reference table

| Contract section | fourier code touched | value.js code touched (when alignment-tranche fires) |
|---|---|---|
| §0.4 Module-layout neutrality | `api/lib/crud/` (one valid implementation) | `api/src/{services, repositories, errors, events, middleware}/` (another valid implementation) |
| §1 Identity | `api/routers/visualizations.py`, `api/models/visualization.py` | `api/src/routes/palettes/crud.ts`, `api/src/format/palette.ts` |
| §2 Slug identity | `api/lib/crud/slugs.py`, `api/slugs.py` | `api/src/slugWords.ts`, `api/src/validation/palette.ts:19-23` |
| §3 Ownership | `api/dependencies.py`, `api/routers/visualizations.py` | `api/src/routes/palettes/crud.ts`, `api/src/middleware/` |
| §4 Visibility | `api/models/visualization.py`, `api/routers/visualizations.py` | `api/src/models.ts:29` (status → visibility+tier split, DEFERRED) |
| §5 Soft-delete | `api/lib/crud/softdelete.py`, `api/routers/visualizations.py` | `api/src/services/palette/crud.ts:219-247` (HARD cascade today; DEFERRED) |
| §6 Sessions | `api/routers/sessions.py`, `api/dependencies.py` | `api/src/routes/sessions.ts`, `api/src/middleware.ts` |
| §7 Admin moderation | `api/routers/admin.py` | `api/src/routes/admin/palettes.ts:11-15` (toggle → setter, DEFERRED) |
| §8 Cron/TTL | `api/services/janitor.py`, `api/lib/crud/pinned_cron.py` | `api/src/cron.ts` |
| §9 Shared-data-vs-code | (per-repo) | (per-repo) |
| §10 Conformance | `api/tests/conformance/**`, `scripts/conformance/**` | `api/test/conformance/**` (alignment-tranche I.W4) |
| §11 Migration | `api/scripts/migrate_visualization.py` (landed) | `api/src/migrate-palette-schema.ts` (DEFERRED) |
| §13 Cross-repo FK | `api/models/visualization.py:119`, `api/lib/crud/etag.py:14` | `api/src/routes/palettes/crud.ts:60-64` (`GET /palettes/:slug`) |
