# CRUD-CONTRACT — fourier-analysis ⇄ value.js

The canonical specification both backends conform to for their slug-addressed
CRUD entities. fourier owns the `visualization` noun; value.js owns the
`palette` noun. This document binds *behaviour*, not implementation. Where
the two diverge in language-specific shape (FastAPI vs Hono, Motor query
syntax vs node-mongodb), the contract names the behaviour and the wave
spec in each repo carries the literal code.

> **Cohort-status note (2026-05-26).** Per the orphan-verdict recorded at
> `coordination/CRUD-CONSTELLATION.md`, this contract reached *drafted*
> state at fourier-B.W1 but did not reach joint ratification with
> value.js-C in the shape originally intended. The spec text below is
> the substrate of record; the joint-ratification close-rule remains
> the binding closure path for any successor tranche that reopens the
> cohort.

## Goal criterion (document-level)

The aim: a single text both repos can point at as the binding behavioural
spec for their shared slug-addressed CRUD surface. Read after the cohort
authoring, a fresh engineer should be able to answer "what does both
backends agree to do?" from this document alone, without reading either
repo's source.

## Completion criterion (document-level)

The evidence: every numbered section §1–§12 carries (a) a goal+completion
block at its head, (b) the technical prose verbatim, and (c) a
conformance-assertion block whose rows index into `CONFORMANCE-MATRIX.md`.
The load-bearing close gate is §10's matrix-closure rule — historically
binding at fourier-B.W1 ratification; per the orphan verdict above, the
gate is preserved here as the substrate for a successor close.

> **Hard rule (historical close-rule).** A section of this contract was
> to be *ratified* only when its conformance assertions appeared as
> passing rows in §10 for **both** repos. A section without a passing
> §10 row was *drafted*, not ratified. fourier-B.W1 was not to close
> while any §1–§9 section lacked a §10 row. The rule remains the
> binding-discipline template for any successor tranche.

Sibling artefacts (authored by A2–A6 in parallel; this document references
them by path):

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

---

## §0 — Status, authority, scope

**Goal.** Fix the contract's metadata — version, authority lineage, in-scope
boundary, the KISS-rejection list — before any behavioural rule appears, so
later sections do not re-litigate the framework-vs-utility decision or the
SOTA citations.

**Completion.** The §0 block names (a) the ratification version + commit
lineage, (b) the binding/consuming tranches, (c) the in-scope and
out-of-scope itemisation, (d) the rejected SOTA candidates with rationale,
and (e) the adopted SOTA conventions with their citations. A reader who
wants to know "what frame does this contract sit inside?" gets the answer
from this section alone.

### Status

- **Version**: 1.0.0 (semver; see §12 change-log policy).
- **Ratification status**: *drafted* at authoring; ratified at fourier-B.W1
  close (commit hash TBD) with value.js-C.W0 sign-off (commit hash TBD).
- **Cohort**: CRUD facility convergence + identity-model consolidation
  (`coordination/CRUD-CONSTELLATION.md`).
- **Authoring tranche**: fourier-B (this repo, this tranche).
- **Consuming tranche**: value.js-C (`~/Programming/value.js/docs/tranches/C/`).

### Authority

This document is binding on both repos. Edits propagate via both repos'
`PROGRESS.md` at the same wave boundary
(`coordination/CRUD-CONSTELLATION.md:108-109`). The change log (§12) records
every amendment with the wave boundary that authored it.

### Scope

In scope:

- The two slug-addressed user-named nouns — fourier's `visualization` and
  value.js's `palette` — and their CRUD contract.
- The shared user/session/admin substrate both nouns sit on.
- The slug algorithm, ownership contract, visibility lifecycle, soft-delete
  semantics, admin moderation shape, and cron/TTL policy.

Out of scope:

- The storage layer (each repo owns its MongoDB schema; see SCHEMA.md).
- The language/framework (Python/FastAPI vs Node/Hono; per-repo wave specs).
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

### Binding force (added 2026-05-26 — Wave-2 audit synthesis C3 §6 recommendation 1)

This contract's binding force, under the orphan verdict recorded at
`coordination/CRUD-CONSTELLATION.md`, is:

- **Mandatory fourier-side**. The §1–§9 + §S* sections bind fourier at
  B.W1 ratification; the fourier-side conformance-matrix rows close at
  B.W3 / W4 / W5 execution per `CONFORMANCE-MATRIX.md:515`.
- **Advisory both-sides on cohort-reopening**. The 88 value.js
  cross-repo conformance-matrix cells hold at `DEFERRED` (the fifth
  status alongside `TBD`/`WIP`/`PASS`/`WAIVED` introduced by the R3
  refinement assay §9). The cohort-level "all 176 cells PASS" gate is
  structurally unmeetable under the orphan verdict; any successor
  tranche that reopens the cohort consumes this contract as the latent
  affordance and ratifies via the original §10 close-rule.

The Wave-2 audit synthesis at
`docs/audits/runs/2026-05-26-B-audit-wave-2/SYNTHESIS.md §2 theme β`
empirically verifies that C2 (value.js substrate scoring) + C3
(convergence shape) + C6 (orphan-resurgence preventer audit) converge
on this binding force. The four new fourier-side invariants 21–24
(slug-mint cryptographic RNG; RFC 9457 problem+json envelope;
RFC 9110 ETag/If-Match; RFC 9239 RateLimit headers) added at B.md §2
under this revision bind **fourier-side** under the same authority:
they ratify at B.W1 (contract-text) and bind empirically at
B.W3 / W4 / W5 execution.

### SOTA conventions cross-reference (Invariants 22–24 binding)

The B.md §2 invariants 22 / 23 / 24 added 2026-05-26 bind to the
SOTA-conventions-adopted block below by §-reference:

- **Invariant 22 — RFC 9457 problem+json envelope** binds to the
  §3 ("Problem+json error format") SOTA convention above. Catalog at
  `SCHEMA.md §5`; helper at `CRUD-LIB-PY.md §3` (`errors.py`).
- **Invariant 23 — RFC 9110 ETag + If-Match** binds to the §2
  ("ETag + `If-Match` optimistic concurrency") SOTA convention above.
  Strong validator at `SCHEMA.md §1`; helper at `CRUD-LIB-PY.md §4`
  (`etag.py`).
- **Invariant 24 — RFC 9239 RateLimit headers** binds to the §6
  ("Standard rate-limit headers") SOTA convention above. No new helper
  module — the headers ride existing `api/services/rate_limiter.py`
  middleware.

The three invariants ratify at B.W1 (contract-text) and bind
empirically at B.W3 (helper landing) / B.W4 (consumer adoption /
middleware emission).

### KISS guards (rejected by invariant)

The following SOTA candidates were considered and **rejected** as
overengineering under invariant 16 (`B.md:34`); see §9 for the disposition
rationale. The revised invariant 16 (per
`docs/audits/runs/2026-05-19-utility-extraction/DECISION.md`) rejects
**shared *frameworks*** while admitting **per-language utility modules**
under §9; the rejections below name the framework-class anti-patterns
specifically, not the utility-module form:

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
  contract is text.
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
   `W/"<content_hash>-<version_count>"`; mutations require a matching
   `If-Match`. (RFC 9110 §8.8, §13.1.1.)
3. **Problem+json error format** (RFC 9457): error responses are
   `application/problem+json` with `{type, title, status, detail, instance}`.
   The existing per-repo `{error: "..."}` shape is migrated under §11.
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
   is a human-readable adjective-noun-noun (-noun) phrase. Mongo `_id` is
   never exposed in URLs.

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
| **Slug** | The one human-readable handle. URL, share link, copy-target. | `^[a-z]+(-[a-z]+){3}$` per §2 | **Yes** — the only user-facing identifier |
| **Content hash** | Deduplication / cache key / ETag substrate. | sha256 hex (64 chars) | **No** — never appears in a URL or share link |
| **Mongo `_id`** | Internal pointer; cursor substrate. | ObjectId or slug-string | **No** — never exposed in API or URL |

### The single-slug rule

- Every user-named persisted noun (fourier: `visualization`; value.js:
  `palette`) has **exactly one** slug, generated at creation per §2,
  unique within its collection, immutable for the lifetime of the doc.
- The slug is the canonical addressing handle.
  `GET /visualizations/{slug}`, `GET /palettes/{slug}`.
- Today's incoherence (`docs/audits/runs/2026-05-18-fourier-tranche/e-crud-slug-valuejs.md:24`):
  fourier's gallery URL is the 64-character `snapshot_hash` rather than a
  slug; this is the *exact* incoherence the contract retires. The migration
  in §11 generates a slug for every surviving gallery row.

### Hash policy

Content hashes that *survive* the convergence (with their role):

- **fourier**: `sha256` on `images` (dedup; one image per byte-identical
  upload) — survives; `contour_hash` on `contours` (dedup; computed from
  the sorted point set per `api/services/image_storage.py:159` — bug
  retired in A.W4, hash now over the as-ordered path) — survives;
  `snapshot_hash` on `snapshots` (today user-facing via the gallery URL)
  — **retired** as user-facing identity; if the converged `visualization`
  collection keeps a content hash at all (for ETag and for the
  `Idempotency-Key` replay map), it is named `content_hash` and is
  documented as never user-facing.
- **value.js**: `currentHash` on `palettes` (content-addresses the head
  version; substrate for the `palette_versions` history table at
  `~/Programming/value.js/api/src/routes/palettes.ts:108-149`) — survives.

### URL shape (binding)

| Pattern | Meaning |
|---|---|
| `GET /{entity}/{slug}` | Read by slug |
| `GET /{entity}?cursor=...` | List (cursor pagination per §0) |
| `POST /{entity}` | Create (slug generated server-side per §2) |
| `PATCH /{entity}/{slug}` | Update (requires `If-Match` ETag per §0) |
| `DELETE /{entity}/{slug}` | Soft-delete (requires `If-Match` ETag) |
| `POST /{entity}/{slug}/restore` | Restore from soft-delete (within grace) |

Mongo `_id`, content hashes, and session tokens **never** appear in a URL
path or query string.

### Conformance assertions (indexed by §10)

- **C1.1** — `grep -rE '/(visualizations|palettes|gallery|snapshots)/[0-9a-f]{32,}'`
  over `web/src/`, `~/Programming/value.js/api/src/`, and value.js web
  sources returns zero. No content hash in any client-side URL pattern.
- **C1.2** — every `GET /{entity}/{slug}` for a slug matching `^[a-z]+(-[a-z]+){3}$`
  returns 200; every request matching `^[0-9a-f]{40,}$` returns 400 with
  problem+json `type=invalid-slug`.
- **C1.3** — the response body of `GET /{entity}/{slug}` does **not**
  contain a `_id` field at the top level.

---

## §2 — Slug algorithm

**Goal.** One slug shape across both repos — four lowercase hyphenated
words, cryptographic-RNG selection, insert-then-catch collision handling
(no check-then-insert TOCTOU race) — with the word-list disposition
deferred to R3 (`research/R3-shared-optimum.md`).

**Completion.** The shape rule (`^[a-z]+(-[a-z]+){3}$`, length 7–60),
the generation rule (server-side, cryptographic RNG), the collision
rule (`DuplicateKeyError`-catch retry up to 10 times → 503), and the
word-list-membership rule (per the R3 disposition recorded in §9) are
each pinned by a C2.1–C2.4 row in §10.

### Shape

- **Word count**: 4 words for users; 4 words for entities. (fourier
  today uses 4 via `coolname.generate_slug(4)` at `api/slugs.py:10`;
  value.js uses 4 via `generateSlug()` at
  `~/Programming/value.js/api/src/slugWords.ts:84-90`. Both agree on 4.)
- **Pattern**: `^[a-z]+(-[a-z]+){3}$` — lowercase, hyphen-separated,
  exactly 4 words. The contract *tightens* fourier's
  `^[a-zA-Z0-9][-a-zA-Z0-9]{2,80}$` (`api/dependencies.py:27`) and
  value.js's `^[a-z0-9][a-z0-9-]*$` (≤120 chars,
  `~/Programming/value.js/api/src/routes/palettes.ts:362,424,697`).
- **Length**: minimum 7 (4 one-letter words plus 3 hyphens); maximum 60
  (sufficient for the longest known coolname/value.js word combinations).
- **Lowercase normalisation**: incoming slug query params are lowercased
  before comparison; case-mismatched URLs 301 to canonical lowercase.

### Word list disposition (per R3)

R3's disposition is binding here. The contract records the chosen
disposition in §9 as one of:

- **(a) Shared data package** `@mkbabb/slug-words` (npm + PyPI mirror via
  JSON). Both repos load the same word lists; drift is impossible.
- **(b) Two copies kept in sync by this contract** (this document is the
  source of truth; the lists are reproduced verbatim in §2 appendix; each
  repo's tests assert their local list matches the contract list by hash).
- **(c) One source of truth in one repo** (e.g. value.js's `slugWords.ts`);
  the other repo consumes it via a code-import or generated data file.

The fourier side today delegates to `coolname` (a third-party package);
value.js maintains its own lists at `~/Programming/value.js/api/src/slugWords.ts`
(120 adjectives, 120 verbs, 128 color terms, 128 animals). Drift is not
zero: a slug generated on one side may not validate as "in the dictionary"
on the other. R3 decides; §9 records the binding outcome.

### Generation

- Server-side only. The slug is generated by the backend, not supplied by
  the client.
- 4 words chosen with a cryptographic RNG
  (`crypto.randomInt` / `secrets.choice`). Today value.js uses
  `crypto.randomInt` (`slugWords.ts:80-82`); fourier delegates to
  `coolname` which uses `random.choice` (CPython default Mersenne).
  The contract requires **cryptographic** generation; fourier swaps in
  `secrets.choice` at W3.

### Collision handling

- **Rely on the unique index + `DuplicateKeyError` catch.** No
  check-then-insert pre-flight. This retires the TOCTOU race at
  `api/services/image_storage.py:71-77` and the inconsistent handling at
  `api/routers/sessions.py:47-49` (today: no retry, would 500 on
  collision).
- On `DuplicateKeyError`, retry up to **10** times with fresh slugs;
  after 10 failures, return 503 with problem+json
  `type=slug-pool-exhausted` (an exceptional path; the
  ~10^10 keyspace of 4-word slugs makes this effectively impossible in
  practice — the matrix asserts it).
- value.js's `generateUniqueSlug` (`slugWords.ts:92-99`) already follows
  this pattern; fourier adopts it at W3.

### Conformance assertions

- **C2.1** — `pytest api/tests/test_slug_format.py::test_slug_shape` and
  `npx vitest run test/slug-format.test.ts` both validate
  `^[a-z]+(-[a-z]+){3}$` against 1,000 generated slugs.
- **C2.2** — `pytest .../test_slug_collision.py::test_duplicate_key_retry`
  and `vitest .../slug-collision.test.ts` simulate a forced collision
  (pre-insert a known slug, mock the RNG once) and assert the retry path
  succeeds.
- **C2.3** — `grep -E 'find_one.*slug.*:.*generate_slug|findOne.*slug.*generateSlug'`
  in each repo's router code returns zero (no check-then-insert).
- **C2.4** — every slug emitted by `generate_slug()` / `generateSlug()`
  belongs to the contract-binding word lists; this is the R3-disposition
  assertion (per §9).

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
  field. The field is non-null at creation; the database has a `NOT NULL`
  (i.e. a `partialFilterExpression: {owner_slug: {$exists: true}}` plus
  schema validation) constraint.
- fourier: `owner_slug` (the converged `visualization` field; replaces
  today's nullable `user_slug` at `api/routers/gallery.py:232`).
- value.js: `userSlug` (already required at creation per
  `~/Programming/value.js/api/src/routes/palettes.ts:394,411`; the
  contract codifies that the `?? null` defaulting at `formatPalette`
  `:21-26` is a *read-side* migration helper and no new row may be
  written with a null owner).

### Anonymous publish is forbidden

- `resolve_session()` returning `None` on a `POST` / `PATCH` / `DELETE` to
  the entity collection raises **401**, not produce a `user_slug: None`
  row. This retires the orphan path at
  `api/routers/gallery.py:206` (`user_slug = await resolve_session(request)`
  without a `require_session`).
- The frontend obtains a session before the first save (the existing
  `ensureUser()` substrate); the backend never auto-registers on save.
- Read endpoints (`GET`) remain anonymous-permissible.

### Ownership-bound endpoints

Every mutation on an existing entity requires both:

1. `require_session` (a valid `X-Session-Token` per §6).
2. `doc.owner_slug == user_slug` — otherwise **403** with problem+json
   `type=not-owner`.

This is today's `api/routers/gallery.py:308-309` and value.js's
`~/Programming/value.js/api/src/routes/palettes.ts:485-489`. The contract
makes it universal across the converged entity.

### Session-to-owner mapping

- One user → many sessions (each device gets its own session token; user
  slug is the stable handle).
- A session always carries a `user_slug` (this is invariant 14's "required
  non-null owner" projected onto sessions). value.js's pre-migration
  sessions had `userSlug: null`; the migration at `migrate-slugs.ts`
  fixed this. fourier creates sessions with `user_slug` from the
  outset (`api/routers/sessions.py:47-54`).

### Admin override

Admins may mutate or delete any entity regardless of ownership; the action
is recorded in `admin_audit` (§7).

### Conformance assertions

- **C3.1** — `POST /visualizations` without `X-Session-Token` returns 401
  with problem+json `type=session-required`; `POST /palettes` likewise.
- **C3.2** — `PATCH /visualizations/{slug}` with a session for a
  *different* user returns 403 with problem+json `type=not-owner`.
- **C3.3** — schema validation: insert of a `visualization` doc with
  `owner_slug: null` rejected by MongoDB (`failCommandWithError` test on
  the validator).
- **C3.4** — `db.visualizations.countDocuments({owner_slug: null})` is
  **0** after migration (per §11); same for `db.palettes.countDocuments({userSlug: null})`.

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
by C4.1–C4.4 in §10. The migration in §11 splits value.js's `status`
field into `visibility + tier`.

### Three states

`visibility ∈ {"draft", "unlisted", "public"}`. The 3-state enumeration
ratifies `B.md:31`'s normalisation (which supersedes audit E's two-state
`private/public` proposal at `e-crud-slug-valuejs.md:94`).

| State | Meaning |
|---|---|
| **draft** | Private to the owner. Not listed; not accessible by slug to non-owners (404). |
| **unlisted** | Accessible by slug to anyone with the link; not in any public list. |
| **public** | Accessible by slug; included in `GET /{entity}` (the gallery). |

### State transitions

```
                  publish
                ┌─────────────►
   draft        │   unlist        public
   │  ┌─────────┴─►  unlisted  ◄──────┐
   │  │             ▲  │              │
   │  │             │  │ publish      │ unlist
   │  │  publish    │  ▼              │
   └──┴──────────── │── (transition allowed any → any)
                    │
   any state ──── soft-delete ──► soft-deleted (§5)
                    │
                  restore
                    ▼
                  previous state
```

All three forward transitions and all three reverse transitions are
permitted to the owner. A soft-delete (§5) is reversible to the
*previous* visibility within the grace window; a hard-delete is
irreversible.

### List filter semantics (binding)

- `GET /{entity}` (no auth, anonymous): returns **only** rows with
  `visibility == "public" AND deleted_at == null`. Drafts and unlisted
  rows are never enumerated.
- `GET /{entity}?owner=me` (requires session): returns the caller's
  own rows in **all** three visibility states (drafts + unlisted +
  public) where `deleted_at == null`.
- `GET /{entity}/{slug}`:
  - `visibility == "public"`: returns to anyone.
  - `visibility == "unlisted"`: returns to anyone with the slug; the
    response does not include the slug in any enumeration.
  - `visibility == "draft"`: returns to the owner only; non-owners get
    **404** (not 403 — refuses to confirm existence).

### Field name binding

- The contract field is `visibility`.
- fourier's existing `tier` field (`featured | saved | normal` —
  `api/routers/gallery.py:233`) is an **admin-only** concern (§7), not
  user-controlled visibility. The migration in §11 retires `tier` as a
  visibility synonym and reserves it for admin curation.
- value.js's existing `status` field (`published | featured` —
  `~/Programming/value.js/api/src/routes/palettes.ts:412,498-505`) is a
  conflation: `published` is "user visibility public" and `featured` is
  "admin tier". The migration in §11 splits this into `visibility +
  tier`.

### Conformance assertions

- **C4.1** — schema validation: `visibility` is enumerated to
  `{draft, unlisted, public}`; other values rejected.
- **C4.2** — anonymous `GET /visualizations` over a fixture seeded with
  one of each state returns only the `public` row.
- **C4.3** — anonymous `GET /visualizations/{slug}` for a `draft` row
  returns 404; for an `unlisted` row returns 200; for a `public` row
  returns 200.
- **C4.4** — `GET /visualizations?owner=me` with the owner's session
  returns all three.

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

- Default **30 days**. Configurable per repo via env var
  (`SOFT_DELETE_GRACE_DAYS` in fourier; `SOFT_DELETE_GRACE_DAYS` in value.js).
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

### Hard-delete prohibition

- Outside admin (§7) and the cron (§8), **no endpoint hard-deletes**.
  `DELETE /{entity}/{slug}` is a soft-delete.
- Admin's hard-delete bypasses the grace window for moderation
  (e.g. illegal content). It is logged in `admin_audit`.

### Cron interaction (cross-ref §8)

- The cron query is bounded:
  `db.collection.deleteMany({deleted_at: {$lt: grace_cutoff}})`. This is
  an indexed range scan over a bounded set; it retires the unbounded
  `$nin` pattern at `api/services/janitor.py:60-65`.
- A B-tree index on `deleted_at` is required.

### Conformance assertions

- **C5.1** — `DELETE /visualizations/{slug}` followed by
  `GET /visualizations/{slug}` returns 404 (anonymous) and 200 to the
  owner with `include_deleted=true`.
- **C5.2** — `POST /visualizations/{slug}/restore` within the grace
  window returns 200; the row appears in lists again.
- **C5.3** — a fixture row with
  `deleted_at = now() - (grace_days + 1)` is removed by one cron tick;
  the next `GET` returns 404 even with `include_deleted=true`.
- **C5.4** — every `delete_many` / `deleteMany` call in
  `api/services/janitor.py` and `~/Programming/value.js/api/src/cron.ts`
  uses a bounded query (no `$nin` over a `distinct()` result greater than
  10,000 rows). Source-grep assertion.

---

## §6 — Sessions

**Goal.** One session contract both APIs honour — opaque UUIDv4 token in
`X-Session-Token` (never a cookie), 30-day TTL, suspension cache with
explicit single-replica constraint, timing-safe login that masks user
enumeration by a ≥200 ms constant delay.

**Completion.** The token-shape rule, the header-not-cookie rule, the
30-day TTL, the suspension-cache 60-second-TTL pattern, and the
timing-safe login are pinned by C6.1–C6.4 in §10. value.js's TTL
migrates from 7 to 30 days at the C.W2 migration row.

### Token shape

- Opaque UUIDv4 (RFC 4122). Not a slug, not derivable from the user_slug.
- Today: fourier `api/routers/sessions.py:27` (`str(uuid.uuid4())`);
  value.js `~/Programming/value.js/api/src/routes/sessions.ts:13`
  (`crypto.randomUUID()`). Both agree.
- Length: 36 chars (8-4-4-4-12 hex with dashes).

### Header

- **`X-Session-Token: <uuid>`** on every authenticated request.
- Both repos already use this exact header
  (`api/dependencies.py:147`, `~/Programming/value.js/api/src/middleware.ts:141`).
- The contract forbids cookies for session transport (no `Set-Cookie`
  on `POST /sessions`); the token is returned in the response body and
  the client stores it.

### TTL

- **`session_ttl_days = 30`** at registration (fourier
  `api/routers/sessions.py:32` matches; value.js currently 7 at
  `~/Programming/value.js/api/src/routes/sessions.ts:35` — the contract
  binds 30 and the migration in §11 updates value.js).
- Every authenticated request touches `last_seen_at` (both repos).
- The cron (§8) hard-deletes sessions where `expires_at < now()`.

### User document

- Keyed by `_id = user_slug` (both repos:
  `api/routers/sessions.py:47-49`,
  `~/Programming/value.js/api/src/routes/sessions.ts:22-26`).
- Fields: `created_at`, `last_seen_at`, optional `status: "suspended"`.
- Admin suspension sets `status = "suspended"` and invalidates the
  user's sessions (§7).

### Suspension cache

- 60-second TTL in-memory cache of suspended `user_slug`s; the contract
  documents this as a **single-replica constraint** per invariant 12
  (`A.md:44`). With >1 replica, suspension enforcement is racy for up to
  60 s per replica.
- fourier: `api/dependencies.py:23-25, 161-173`.
- value.js: `~/Programming/value.js/api/src/middleware.ts:137-178`.

### Endpoints (binding shape)

| Method | Path | Body | Returns |
|---|---|---|---|
| `POST` | `/sessions` | (none) | `{token, user_slug}` (201) |
| `POST` | `/sessions/login` | `{slug}` | `{token, user_slug}` (200), 404 if no such user |
| `GET` | `/sessions/me` | — | `{user_slug, created_at}` (requires session) |
| `DELETE` | `/sessions` | — | `{ok: true}` (revokes current) |

`POST /sessions` and `POST /sessions/login` are subject to the
registration / login rate-limit (§8).

### Login timing-safety

`POST /sessions/login` returns after a constant ≥200 ms delay regardless
of whether the slug exists, to prevent user-enumeration timing attacks.
Both repos already do this
(`api/routers/sessions.py:68,75`,
`~/Programming/value.js/api/src/routes/sessions.ts:47,54,62`).

### Conformance assertions

- **C6.1** — `POST /sessions` returns 201 with `{token, user_slug}`;
  `GET /sessions/me` with the returned token returns the same user_slug.
- **C6.2** — `DELETE /sessions` followed by `GET /sessions/me` with the
  revoked token returns 401.
- **C6.3** — `POST /sessions/login` with a non-existent slug returns 404
  after ≥200 ms; with an existing slug returns 200 after ≥200 ms; the
  difference is < 50 ms over 100 trials (timing-safe).
- **C6.4** — a request with `X-Session-Token: <suspended-user-token>`
  returns 403 with problem+json `type=account-suspended` after the
  60-second cache TTL elapses or on first access from a fresh process.

---

## §7 — Admin moderation

**Goal.** Bearer-token admin auth with timing-safe comparison; eight
named actions (flag / dismiss / feature / delete / suspend / unsuspend /
delete-user / batch-*); every action is idempotent and writes an
`admin_audit` row; toggle endpoints are renamed to explicit setters to
preserve idempotency.

**Completion.** The action-table contract, the idempotency rule, the
batch-return-shape (207 partial / 200 full / 400 none), the flag
`(entity_slug, reporter_slug)` uniqueness index, and the
admin-hard-delete-bypasses-grace rule are pinned by C7.1–C7.5 in §10.

### Auth

- Bearer-token admin auth: `Authorization: Bearer <ADMIN_TOKEN>` where
  `ADMIN_TOKEN` is a static env var.
- Timing-safe comparison (`hmac.compare_digest` /
  `crypto.timingSafeEqual`).
- fourier: `api/dependencies.py:200-208`; value.js:
  `~/Programming/value.js/api/src/middleware.ts:235-254`.
- If `ADMIN_TOKEN` is unset, all admin endpoints return **503** with
  problem+json `type=admin-not-configured`.

### Actions

The contract binds the **action shape**, not the exact endpoint paths
(each repo's wave spec carries the paths). Every admin action is one of:

| Action | Target | Semantics | Idempotent? |
|---|---|---|---|
| `flag` | entity slug | non-admin: register a complaint | yes (per `(target, reporter)` unique) |
| `dismiss_flags` | entity slug | clear all flags on the entity | yes |
| `feature` | entity slug | set `tier = featured` | yes (toggle is **not** — see below) |
| `delete` | entity slug | hard-delete (bypasses grace) | yes (post-state) |
| `suspend_user` | user slug | set `users.status = suspended` | yes |
| `unsuspend_user` | user slug | clear `users.status` | yes |
| `delete_user` | user slug | hard-delete user + cascade | yes (post-state) |
| `batch_*` | array of slugs | apply action to each | yes per-element |

### Idempotency

Re-applying an action that has already happened is a **no-op with 200**,
not a 409. Toggle-style endpoints (today value.js's "feature" toggles at
`~/Programming/value.js/api/src/routes/admin.ts:166-181`) are renamed to
explicit `set_tier` actions to preserve idempotency.

### Audit log

- Every admin mutation writes one row to `admin_audit`:
  `{timestamp, ip_hash, action, target}` (both repos already do this:
  fourier `api/services/database.py:88-89`,
  value.js `~/Programming/value.js/api/src/routes/admin.ts:11-26`).
- Audit row writes that themselves fail must not leak error detail
  (value.js precedent at `admin.ts:23-25`: silently swallow).
- Audit retention: **90 days** (fourier `api/services/janitor.py:176-179`).

### Batch return shape

A batch action returns:

```json
{
  "processed": <int>,
  "errors": [{"slug": "...", "code": "...", "detail": "..."}]
}
```

Partial success returns 207 with this body; full success 200; full failure
400. value.js's `processed` shape at
`~/Programming/value.js/api/src/routes/admin.ts:476-560` is the precedent.

### Flag uniqueness

- `(entity_slug, reporter_slug)` is unique. Double-flagging by the same
  reporter returns 409 (today's `api/routers/gallery.py:363-366`).
- Self-flagging is rejected with 400 (today's `gallery.py:352-353`,
  `palettes.ts:826-828`).

### Tier (per-repo extension)

- fourier: `tier ∈ {featured, saved, normal}` (existing).
- value.js: `tier ∈ {featured, normal}` (renamed from `status` per §4).
- The tier vocabulary is per-repo; the contract binds only that tier is
  admin-controlled and orthogonal to user-controlled `visibility`.

### Conformance assertions

- **C7.1** — every admin mutation produces one new row in `admin_audit`
  with matching `action` and `target`.
- **C7.2** — applying `suspend_user` twice yields 200 + 200 (idempotent);
  the audit log has two rows, the second annotated `noop: true` or
  similar.
- **C7.3** — a non-admin request to any admin endpoint returns 401
  (no `Authorization`) or 403 (wrong token); never 200.
- **C7.4** — `(entity_slug, reporter_slug)` is a unique index;
  double-insert by the same reporter raises `DuplicateKeyError`
  (source-grep + insert assertion).
- **C7.5** — admin `delete` on an entity bypasses the §5 grace window;
  the row is hard-deleted in one operation, audit row written.

---

## §8 — Cron / TTL policy

**Goal.** A 6-hour cron tick that makes only bounded queries — every
`$nin` is over a known-small `distinct()` set, or replaced by the
indexed `pinned: bool` flag. The unbounded `$nin` over a
`pinned_contours` set built from a full collection scan (the prior
janitor pattern) retires.

**Completion.** The bounded-query rule, the cleanup-category ordering
(expired sessions → soft-deleted-past-grace → stale users → orphan
children → audit retention), the storage-budget-eviction retirement
(the band-aid pre-condition discharged by B; the eviction *pass* itself
retires at fourier-tranche-C), and the cron idempotency are pinned by
C8.1–C8.4 in §10.

### Tick

- Cron tick interval: **6 hours** (fourier
  `api/services/janitor.py:22`; value.js scheduled out-of-band but
  matches behaviourally).
- Idempotent: a missed tick (process restart) is recovered on the next
  scheduled tick; no work is lost.

### Bounded queries only

The cron makes **no unbounded `$nin`** query. The pattern at
`api/services/janitor.py:60-65` —
`{"contour_hash": {"$nin": list(pinned_contours)}}` where
`pinned_contours` is built from a full collection scan — is **retired**.
Replacement:

- **Option A (binding default): `pinned: bool` flag on the child doc.**
  Updated on publish/unpublish. Cron query is then
  `{pinned: false, last_accessed_at: {$lt: cutoff}}` — indexed,
  bounded.
- **Option B (per-repo, where bounded sets exist): `distinct()` + `$nin`
  over a known-small bounded set.** Precedent: value.js's cleanup uses
  `db.collection("palettes").distinct("slug")` over the live palette
  set (`~/Programming/value.js/api/src/cron.ts:19-24`); this is bounded
  by the palette count and is acceptable.

### Cleanup categories (binding order)

The cron passes traverse, in this order (parents after children):

1. **Expired sessions**: `{expires_at: {$lt: now}}` — both repos already.
2. **Soft-deleted entities past grace** (§5):
   `{deleted_at: {$lt: now - grace}}`.
3. **Stale users**: `{last_seen_at: {$lt: now - user_ttl_days}}` →
   cascade-delete the user's sessions, flags, and entities (the entities
   are themselves cascade-soft-deleted; the next cron pass hard-deletes
   them via category 2).
4. **Orphan children** (sessions for deleted users; flags for deleted
   entities; votes for deleted palettes): `$nin` over a *bounded*
   `distinct()` of live parent slugs.
5. **Audit retention**: `admin_audit` rows older than 90 days.

### No storage-budget eviction

The contract **retires** fourier's storage-budget eviction at
`api/services/janitor.py:84-119`. It is a band-aid for the inline-blob
problem and violates invariant 12 ("scale without contrivance"). The
deferred destination is fourier tranche C (image-blob redesign;
`B.md §7`); until then, the storage-budget eviction may remain
operationally but is documented as a known violation in §12, not as
contract-binding behaviour.

### Conformance assertions

- **C8.1** — `grep -E '\$nin' api/services/janitor.py ~/Programming/value.js/api/src/cron.ts`
  shows zero unbounded `$nin` (every occurrence is over a bounded
  `distinct()` of ≤10,000 rows, or over an indexed `pinned: false`
  predicate).
- **C8.2** — a fixture with one each of (expired session, soft-deleted
  entity past grace, stale user with 3 entities + 2 sessions, orphan
  flag) is reduced to zero rows in one cron tick.
- **C8.3** — `last_accessed_at` and `deleted_at` indexes exist on the
  visualization / palette collection (source-grep
  `database.py` / `db.ts` index declarations).
- **C8.4** — the cron is idempotent: a second tick immediately after the
  first is a no-op (`deleted_count == 0` on every category).

---

## §9 — Shared data vs shared code (R3 disposition)

**Goal.** Sort every cross-cutting concern into exactly one of five
dispositions — `contract` (text-only), `data` (a shared JSON file),
`library` (a published code package), `service` (a coordinating
runtime), or `per-repo` (intentional duplication) — and reject the
shared-CRUD-framework anti-pattern (the rot pattern invariant 16 was
always aimed at).

**Completion.** The 1-row-per-target table is binding; the 2026-05-19
DECISION.md amendment admits a sixth disposition `utility` (per-language
in-repo utility modules); the §0 KISS-reject list and the Wχ-P1
"framework-in-disguise" probe enforce the no-shared-framework rule; and
the C9.1–C9.4 rows pin (a) the shared word-list-data file, (b) the
process-local rate-limiter, (c) the absence of a shared framework, and
(d) the utility-module admit-criteria conformance.

R3's 1-row-per-target disposition table (`research/R3-shared-optimum.md`)
is the substrate; this section binds the dispositions for B.W1 and
B.W3/B.W4. Every row has a disposition ∈ {`contract`, `data`, `library`,
`service`, `per-repo`}, a rationale, and a conformance assertion (indexed
by §10).

| Target | Disposition | Rationale | Conformance |
|---|---|---|---|
| Slug algorithm (shape, length, collision policy) | **contract** | Logic, not data; cheaper to specify in text than ship a code package. | §2 C2.1-C2.4 |
| Slug word lists | **data** (R3 disposed; precepts submodule) | Drift between fourier and value.js word lists changes which slugs are generated. R3 admit-rule: size ≤10 KB, drift-is-correctness, language-agnostic JSON. Lives at `docs/precepts/data/slug-words.json`; U2 authors. | C9.1 below |
| **Per-language utility module** (new disposition, per 2026-05-19 DECISION.md) | **utility** (in-repo; `api/lib/crud/` for fourier, `api/src/crud/` for value.js) | Cross-cutting concerns that duplicate *and drift* (H3 batch-shape; R-identity TOCTOU; janitor `$nin`). Admit criteria: size ≤ 500 LOC/repo; cross-cutting concern (≥2 in-repo or both repos); framework-free (no control inversion, no codegen, no lifecycle ownership); in-repo first (standalone-package extraction deferred until a *third* consumer materialises). Named utilities: slug generator, cursor encode/decode, problem+json envelope, ETag middleware, Idempotency-Key middleware, soft-delete helpers, pinned-cron pattern. **U2** authors the slug-words data file; **U3** authors `api/lib/crud/` (fourier); **U4** authors `api/src/crud/` (value.js). | C9.4 below |
| Identity model (slug ↔ id ↔ hash separation) | **contract** | Pure rule. | §1 C1.1-C1.3 |
| Ownership rules (required owner, 401-on-anonymous) | **contract** | Pure rule. | §3 C3.1-C3.4 |
| Visibility states + transitions | **contract** | Pure rule. | §4 C4.1-C4.4 |
| Soft-delete semantics + grace window | **contract** | Pure rule. | §5 C5.1-C5.4 |
| Session shape + TTL | **contract** | Pure rule. | §6 C6.1-C6.4 |
| Admin actions + audit shape | **contract** | Pure rule. | §7 C7.1-C7.5 |
| Cron/TTL policy + bounded-query rule | **contract** | Pure rule. | §8 C8.1-C8.4 |
| Hash policy (which hashes survive, role) | **contract** | Pure rule. | §1 hash policy block |
| Migration discipline (idempotent, dry-run, count-verify) | **contract** | Pure rule + precedent (value.js `migrate-slugs.ts`). | §11 C11.1-C11.3 |
| Rate-limiter (in-memory, per-process) | **per-repo** | Process-local state; single-replica constraint per invariant 12. | C9.2 below |
| MongoDB driver / framework | **per-repo** | Out of scope by invariant 16. | — |
| `Palette` domain type | **library** | value.js the library; consumed by both demos. Lands in value.js-C.W1. | per value.js-C.W1 conformance |
| `colorScale`, `sampleToSVGPath` helpers | **library** | Same. | per value.js-C.W1 |
| Slug uniqueness retry loop (logic) | **utility** (per 2026-05-19 revision; previously "contract") | The DECISION.md revision re-classifies this as the canonical tier-2 utility-module instance: ~30 LOC/repo of insert-then-catch-`DuplicateKeyError` logic; cross-cutting (both repos); framework-free. Realised in `api/lib/crud/slug.py` and `api/src/crud/slug.ts`. | §2 C2.2-C2.3 + C9.4 |

### Rejected: shared CRUD framework / codegen / coordinating service

The three named anti-patterns of invariant 16 (`B.md:34`) are rejected
by §0 KISS guards and Wχ probe P1's "framework-in-disguise" classification.
No section above is disposed as `service`. The conformance assertion C9.3
below tests this structurally. Per the 2026-05-19 DECISION.md, the
rejection is scoped to **frameworks** (control inversion, codegen,
third coordinating service) — *not* to the tier-2 utility-module form,
which is admitted in the new `utility` disposition row above.

### Conformance assertions

- **C9.1** — the word-list data file at `docs/precepts/data/slug-words.json`
  (R3-disposed; U2 authors) exists and is consumed by both repos
  (grep/`require`/import assertion).
- **C9.2** — rate-limiter state is process-local in both repos; a
  fixture proves cross-process budget non-sharing (start two processes,
  observe each gets full budget).
- **C9.3** — `grep -rE "from .* import shared_crud|require\(.*shared-crud" {fourier,value.js}`
  returns zero. `docker-compose.{yml,prod.yml}` and value.js's `Caddyfile`
  contain no third coordinating service (Redis, NATS, Kafka, etc.).
  *Amended per DECISION.md*: the grep explicitly permits `api/lib/crud/`
  (fourier) and `api/src/crud/` (value.js) — these are tier-2 in-repo
  utility modules, not a shared framework.
- **C9.4** (per 2026-05-19 DECISION.md) — the per-language utility
  modules at `api/lib/crud/` (fourier) and `api/src/crud/` (value.js)
  conform to the admit criteria: (a) total LOC ≤ 500 per repo
  (`wc -l api/lib/crud/*.py` and `wc -l api/src/crud/*.ts` both
  ≤ 500); (b) no control inversion — `grep -rE 'class .*Router|class .*Mixin|register_entity|@register' api/lib/crud/ api/src/crud/`
  returns zero; (c) each utility is `called by` router code, never the
  inverse — source-grep assertion that `api/lib/crud/*` is imported
  *by* `api/routers/*`, never the other direction; same for value.js.

---

## §10 — Conformance test matrix (LOAD-BEARING)

**Goal.** Index every conformance assertion C\*.\* named in §1–§9 into a
testable artefact at a named path in each repo; the matrix is the
literal close-on substrate that converts "the contract says X" into "a
test run in CI fails if X regresses".

**Completion.** Every row carries a non-empty test name + run command +
expected output in both repos; the §U amendment (per the 2026-05-19
DECISION) extends the matrix with utility-module rows (`U-slugs-*` etc.);
the close-rule (every row PASS in both columns) is binding at fourier-B.W3
and value.js-C.W2.

This section is the gate. A row appears here for every conformance
assertion C\*.\* named in §1–§9. The full fleshed-out table (with test
file paths, run commands, expected outputs) lives in
`coordination/CONFORMANCE-MATRIX.md` (authored by A5); this section is
the **index** and the **ratification ledger** — when every row's
fourier-column and value.js-column both check **PASS**, the contract is
ratified.

> The §10 close-rule. fourier-B.W1 cannot close while any row's two
> columns are not both PASS. If a row cannot be made testable, the
> contract section it indexes is *too soft* and must be re-written.
>
> **§U inclusion (per 2026-05-19 amendment)**. The close-rule extends
> to the utility-module conformance rows in `CONFORMANCE-MATRIX.md` §U
> (`U-slugs-*`, `U-cursors-*`, `U-errors-*`, `U-etag-*`, `U-idem-*`,
> `U-soft-*`, `U-cron-*`, `U-meta-*`). Every §U row must also read
> PASS in both columns. The §U section ratifies the tier-2 in-repo
> utility modules (`api/lib/crud/` in fourier; `api/src/lib/crud/` in
> value.js) admitted by C9.4 — it is the testable bridge between the
> §9 admit criteria and the unit-level surface enumerated in U3/U4.
> §U is **not** a separate gate: it is folded into the same B.W3 /
> value.js-C.W2 close gate as §1–§9 and §S\*. A §U row reaching
> `WAIVED` requires the same §12 change-log discipline as a §1–§11
> row.

### Matrix shape (one row per assertion × two columns)

| Assertion | Section | fourier evidence | fourier status | value.js evidence | value.js status |
|---|---|---|---|---|---|
| C1.1 (no hash in URL) | §1 | `pytest api/tests/test_identity::test_no_hash_in_url` | TBD | `vitest test/identity/no-hash-in-url` | TBD |
| C1.2 (slug shape on read) | §1 | `pytest test_identity::test_slug_read_shape` | TBD | `vitest test/identity/slug-read-shape` | TBD |
| C1.3 (no `_id` in response) | §1 | `pytest test_identity::test_no_id_field` | TBD | `vitest test/identity/no-id-field` | TBD |
| C2.1 (slug shape on generate) | §2 | `pytest test_slug_format` | TBD | `vitest test/slug/format` | TBD |
| C2.2 (collision retry) | §2 | `pytest test_slug_collision::test_dup_key_retry` | TBD | `vitest test/slug/dup-key-retry` | TBD |
| C2.3 (no check-then-insert) | §2 | `scripts/grep-no-check-then-insert.sh` | TBD | same (per-repo) | TBD |
| C2.4 (word-list membership) | §2,§9 | `pytest test_slug_format::test_words_in_list` | TBD | `vitest test/slug/words-in-list` | TBD |
| C3.1 (anonymous 401) | §3 | `pytest test_ownership::test_anonymous_create_401` | TBD | `vitest test/ownership/anonymous-create-401` | TBD |
| C3.2 (wrong-owner 403) | §3 | `pytest test_ownership::test_wrong_owner_403` | TBD | `vitest test/ownership/wrong-owner-403` | TBD |
| C3.3 (schema rejects null owner) | §3 | `pytest test_ownership::test_schema_null_owner` | TBD | `vitest test/ownership/schema-null-owner` | TBD |
| C3.4 (zero null-owner rows post-migration) | §3,§11 | `pytest test_migration::test_no_null_owner` | TBD | `vitest test/migration/no-null-owner` | TBD |
| C4.1 (visibility enum) | §4 | `pytest test_visibility::test_enum_validation` | TBD | `vitest test/visibility/enum-validation` | TBD |
| C4.2 (anonymous list only public) | §4 | `pytest test_visibility::test_anonymous_list_public_only` | TBD | `vitest test/visibility/anonymous-list-public-only` | TBD |
| C4.3 (draft 404 to non-owner) | §4 | `pytest test_visibility::test_draft_404_anonymous` | TBD | `vitest test/visibility/draft-404-anonymous` | TBD |
| C4.4 (owner sees all three) | §4 | `pytest test_visibility::test_owner_sees_all` | TBD | `vitest test/visibility/owner-sees-all` | TBD |
| C5.1 (soft-delete hides) | §5 | `pytest test_soft_delete::test_anonymous_404_after_delete` | TBD | `vitest test/soft-delete/anonymous-404` | TBD |
| C5.2 (restore within grace) | §5 | `pytest test_soft_delete::test_restore_in_grace` | TBD | `vitest test/soft-delete/restore-in-grace` | TBD |
| C5.3 (hard-delete past grace) | §5 | `pytest test_soft_delete::test_cron_hard_deletes_past_grace` | TBD | `vitest test/soft-delete/cron-hard-deletes` | TBD |
| C5.4 (no unbounded `$nin`) | §5,§8 | `scripts/grep-no-unbounded-nin.sh` | TBD | same (per-repo) | TBD |
| C6.1 (session round-trip) | §6 | `pytest test_sessions::test_register_and_me` | TBD | `vitest test/sessions/register-and-me` | TBD |
| C6.2 (logout invalidates) | §6 | `pytest test_sessions::test_logout` | TBD | `vitest test/sessions/logout` | TBD |
| C6.3 (login timing-safe) | §6 | `pytest test_sessions::test_login_timing` | TBD | `vitest test/sessions/login-timing` | TBD |
| C6.4 (suspended 403) | §6 | `pytest test_sessions::test_suspended_403` | TBD | `vitest test/sessions/suspended-403` | TBD |
| C7.1 (audit row per action) | §7 | `pytest test_admin::test_audit_row_per_action` | TBD | `vitest test/admin/audit-row-per-action` | TBD |
| C7.2 (idempotent suspend) | §7 | `pytest test_admin::test_idempotent_suspend` | TBD | `vitest test/admin/idempotent-suspend` | TBD |
| C7.3 (non-admin 401/403) | §7 | `pytest test_admin::test_non_admin_rejected` | TBD | `vitest test/admin/non-admin-rejected` | TBD |
| C7.4 (flag uniqueness) | §7 | `pytest test_admin::test_flag_uniqueness` | TBD | `vitest test/admin/flag-uniqueness` | TBD |
| C7.5 (admin hard-delete bypasses grace) | §7 | `pytest test_admin::test_hard_delete_bypasses_grace` | TBD | `vitest test/admin/hard-delete-bypasses-grace` | TBD |
| C8.1 (no unbounded `$nin`) | §8 | `scripts/grep-no-unbounded-nin.sh` | TBD | same (per-repo) | TBD |
| C8.2 (cron clears fixture) | §8 | `pytest test_janitor::test_one_tick_clears_fixture` | TBD | `vitest test/cron/one-tick-clears` | TBD |
| C8.3 (indexes exist) | §8 | `pytest test_database::test_required_indexes` | TBD | `vitest test/db/required-indexes` | TBD |
| C8.4 (cron idempotent) | §8 | `pytest test_janitor::test_second_tick_noop` | TBD | `vitest test/cron/second-tick-noop` | TBD |
| C9.1 (shared data exists if `data`) | §9 | conditional on R3 | TBD | conditional on R3 | TBD |
| C9.2 (rate-limiter process-local) | §9 | `pytest test_rate_limiter::test_cross_process` | TBD | `vitest test/rate-limiter/cross-process` | TBD |
| C9.3 (no shared CRUD framework) | §9 | `scripts/grep-no-shared-framework.sh` | TBD | same | TBD |
| C11.1 (migration idempotent) | §11 | `pytest test_migration::test_idempotent` | TBD | `vitest test/migration/idempotent` | TBD |
| C11.2 (count-verify) | §11 | `api/scripts/migrate_visualization.py --verify` | TBD | `src/migrate-palette-schema.ts --verify` | TBD |
| C11.3 (spot-check) | §11 | `pytest test_migration::test_spot_check_10_rows` | TBD | `vitest test/migration/spot-check-10-rows` | TBD |

The `TBD` cells become `PASS` at B.W3 close (fourier rows) and at
value.js-C.W2 close (value.js rows). fourier-B.W1's ratification gate is
that **every cell has a named test path with a non-empty expected
output**; the W3 / value.js-C.W2 close gate is that every cell is
`PASS`.

### Run-command index

Aggregate run commands per repo (the matrix entries name individual
tests; these run the entire conformance suite):

- fourier: `uv run pytest -k 'conformance'` from the repo root.
- value.js: `npm run test:conformance` from `~/Programming/value.js/api/`.

### Out-of-tree assertions (source-grep)

Three assertions are source-grep, not runtime tests; they are scripted in
`scripts/conformance/` (created at B.W3) and invoked by the suite:

- `scripts/grep-no-check-then-insert.sh` (C2.3)
- `scripts/grep-no-unbounded-nin.sh` (C5.4, C8.1)
- `scripts/grep-no-shared-framework.sh` (C9.3)

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

1. **Idempotent.** Re-running yields zero additional writes. Precedent:
   `~/Programming/value.js/api/src/migrate-slugs.ts:31-36` (skip-if-set).
2. **Dry-run flag** (`--dry-run` / `DRY_RUN=1`). Prints the plan and
   counts without writing.
3. **Count-verify**. Pre-flight count, post-flight count, and a spot-check
   of N random rows (default 10). Output as a markdown artefact in
   `docs/tranches/B/audit/migration-counts.md` (fourier) / equivalent
   (value.js).
4. **Failure recovery**. A crash at 50% leaves the database in a
   consistent state (idempotent re-run completes). No half-written
   intermediate states (use `find_one_and_update` or transactions where
   strictly necessary).
5. **Reversible OR completeness-proven.** Either a rollback script
   exists, or the count-verify artefact proves completeness (the
   irreversible path is admitted only when the rollback is itself a
   contrivance worse than the forward migration).

### Per-collection migration plan

#### fourier (W3)

| Source collection | Source field | Destination | Action |
|---|---|---|---|
| `snapshots` | `snapshot_hash` | `visualization.content_hash` | move; **not user-facing** |
| `snapshots` | (all snapshot rows) | `visualization` (new) | each snapshot becomes a `visualization` row |
| `gallery` | `snapshot_hash` | `visualization._id` is the join key; `visualization.slug` is **generated** | for each gallery row, locate the snapshot via `snapshot_hash`, generate a fresh slug, set `visibility = "public"`, copy `user_slug → owner_slug`, `views`, `likes`, `liked_ips`, `tier` |
| `snapshots` (no gallery row) | — | `visualization` with `visibility = "draft"`, `owner_slug = ?` | orphan-snapshot resolution: assign to a single synthetic "legacy" owner OR drop (per Wχ P2 disposition; default: drop, since no user navigated to them) |
| `gallery` | `user_slug == null` | reject | every such row produced by `api/routers/gallery.py:206` is either reassigned (if a matching `liked_ips` hash maps to a known user — unlikely) or dropped. Wχ P2 disposes. |
| `gallery` | (rest of fields) | `visualization` | direct copy |

After migration:

- `db.visualizations.countDocuments({}) == ` union of
  (gallery rows with `user_slug != null`) +
  (snapshot rows resolved per orphan rule).
- `db.visualizations.countDocuments({owner_slug: null}) == 0`.
- `db.visualizations.countDocuments({slug: null}) == 0`.
- The old `snapshots` and `gallery` collections are renamed to
  `_snapshots_legacy` and `_gallery_legacy` (not dropped) until B.W5
  close; B.W5 drops them.

#### value.js (value.js-C.W2)

| Source field | Destination | Action |
|---|---|---|
| `palettes.status: "published" | "featured"` | `palettes.visibility, palettes.tier` | split: `published → visibility=public, tier=normal`; `featured → visibility=public, tier=featured` |
| `palettes.userSlug` | unchanged (already required) | confirm post-`migrate-slugs.ts` state has zero nulls |
| (none) | `palettes.deleted_at` | add column (null for all existing) |
| (none) | `palettes.unlisted` semantics | new state; no rows migrated into it (existing rows default to `public`) |
| sessions.expires_at — none | sessions with `lastSeenAt < now - 7d` keep their TTL; new sessions get 30d | not a data migration; cutover at code deploy |

### Brittleness window (per `B.md §8`)

W3 may need a brittleness window — a span where the old `snapshots` /
`gallery` collections and the new `visualization` collection coexist, or
where reads are briefly dual-pathed. The default disposition is **clean
cutover** (the dual-read path is the legacy code the invariants forbid).
Wχ P2 confirms.

### Conformance assertions

- **C11.1** — second run of the migration produces zero writes
  (`updateMany.modifiedCount == 0`, `insertMany.insertedCount == 0`).
- **C11.2** — `api/scripts/migrate_visualization.py --verify` produces
  `docs/tranches/B/audit/migration-counts.md` with pre/post counts that
  match the expected derivation; equivalent for value.js.
- **C11.3** — 10 random `snapshot_hash` values (sampled with seed=42
  pre-migration) appear post-migration as `visualization` rows with the
  expected `(slug, owner_slug, visibility, content_hash, contour_settings,
  animation_settings)`.

---

## §12 — Open items & change log

**Goal.** No silent deferral — every open question at ratification
carries a named destination; every amendment carries a wave-boundary
attribution and a one-line summary.

**Completion.** The open-items table names a destination per row; the
change-log table records the version, date, wave, and change for every
contract revision; subsequent amendments record one row per amendment
with the authoring wave boundary.

### Open items (each with a destination)

| Item | Discussion | Destination |
|---|---|---|
| Word-list disposition (data vs contract) | R3's admit-rule outcome | §9 row + §2 word-list block, finalised at Wχ close |
| Orphan-snapshot resolution (drop vs synthetic owner) | Wχ P2 | §11 fourier table, finalised at Wχ close |
| value.js session TTL (7d → 30d) | this contract binds 30d; value.js-C.W2 lands | value.js-C.W2 |
| `colorScale`, `sampleToSVGPath`, `Palette` library shape | value.js-C.W1 | value.js-C.W1 |
| Image-blob inline storage (band-aid `storage_budget_gb`) | invariant 12 honesty | fourier tranche C (named) |
| Rate-limiter single-replica documentation | invariant 12 | per-repo `README` or `ARCHITECTURE.md`; named here, landed at W3 |
| `Idempotency-Key` server replay storage | §0 SOTA convention adopted | per-repo decision: in-memory 24h vs Mongo TTL collection. Decide at W3. |
| problem+json migration of existing error shapes | §0 SOTA convention adopted | W3/W4 in fourier; value.js-C.W2 |

### Change log

| Version | Date | Wave | Change |
|---|---|---|---|
| 0.1.0-draft | 2026-05-19 | B.W1 (in flight) | initial authoring by A1 (this document); not yet ratified |
| 1.0.0 | TBD | B.W1 close | ratified by fourier-B.W1 + value.js-C.W0 sign-off |

Subsequent amendments record one row per amendment with the authoring wave
boundary and a one-line summary.

---

## Appendix — Cross-reference table

| Contract section | fourier code touched (W3/W4) | value.js code touched (C.W2) |
|---|---|---|
| §1 Identity | `api/routers/visualizations.py` (new), `api/models/visualization.py` (new) | `api/src/routes/palettes.ts` |
| §2 Slug algorithm | `api/slugs.py`, `api/services/image_storage.py:71-77` (retire pre-flight) | `api/src/slugWords.ts`, `routes/palettes.ts:362,424,697` |
| §3 Ownership | `api/dependencies.py` (`require_session`), `api/routers/visualizations.py` | `api/src/routes/palettes.ts:343-435`, `middleware.ts` |
| §4 Visibility | `api/models/visualization.py`, `api/routers/visualizations.py` (list filter) | `api/src/routes/palettes.ts:158-291` (list filter), schema validator |
| §5 Soft-delete | `api/routers/visualizations.py` (DELETE), `api/services/janitor.py:25-67` | `api/src/routes/palettes.ts:473-504`, `cron.ts` |
| §6 Sessions | `api/routers/sessions.py`, `api/dependencies.py:144-179` | `api/src/routes/sessions.ts`, `middleware.ts:140-181` |
| §7 Admin moderation | `api/routers/admin.py`, `api/services/database.py:88-89` | `api/src/routes/admin.ts`, `middleware.ts:235-254` |
| §8 Cron/TTL | `api/services/janitor.py:25-208` | `api/src/cron.ts` |
| §9 Shared-data-vs-code | (R3 decides location) | (R3 decides location) |
| §10 Conformance | `api/tests/conformance/**`, `scripts/conformance/**` | `api/test/conformance/**`, `scripts/conformance/**` |
| §11 Migration | `api/scripts/migrate_visualization.py` (new) | `api/src/migrate-palette-schema.ts` (new) |
