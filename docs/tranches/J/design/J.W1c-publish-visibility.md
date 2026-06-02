# J.W1c — the publish/visibility OPERATION spec (CRUD-CORE sibling of J.W1-remix)

**Wave**: J.W1c (the CORE; a design sibling of `J.W1-crud-remix.md`; lands its IMPL in constellation **WAVE D / J.W2**, both repos).
**Disposition**: DEV (design doc; the IMPL boundary opens at J.W2, exactly as J.W1-remix).
**Author**: fourier-tranche-J (publish-visibility facet).
**Substrate read**: two grounding auditors mapped both repos' visibility models file:line — fourier's flat 3-state enum (`api/models/visualization.py:33`) + its two public-view consumers + the dead `visibility_illegal_transition` guard (`api/lib/crud/errors.py:59`); value.js's `(visibility, tier)` 9-tuple split (`api/src/models.ts:32-40`) + its **missing** public-view visibility filter (`api/src/services/palette/crud-list.ts:85`) + its absent visibility-mutation path.

This is the **publish OPERATION contract over the existing 3-state model** — NOT a new state machine. The load-bearing requirement, verbatim: *publish two ways — private (not in public view) and public (in public view); re-publishing an EXTANT private item must NOT duplicate it — switch the flag to public on the SAME row; publish is an idempotent in-place visibility mutation; it is categorically NOT a remix/fork/duplicate.* Everything below reads against that one sentence.

---

## §0 — The KISS line (what this is NOT)

Stated first so every downstream decision reads against it:

- **NO new visibility state.** Both repos already ship a 3-state enum. Publish is a *binary operation* over those existing states — `publish` flips to `public`, `unpublish` flips to the contract-legal not-public state (fourier `unlisted`, value.js `private` — §5.1), and the `unlisted` middle state is otherwise the **preserved untouched** middle. We do not add a `published: bool` *column*; `published` is a **derived convenience** on the response (`visibility == public`), never a persisted second source of truth (that would re-conflate the very thing the 3-state enum already encodes).
- **NO new row, ever, from publish.** Publish is a pure in-place `$set` on the SAME `{slug}` document — same slug, same `_id`, same content-hash, same provenance, same version chain. The categorical anti-duplication guarantee (§3, §4) is the spine. Remix is the ONLY new-row operation and it lives in a different doc (`J.W1-crud-remix.md`).
- **NO bypass of the transition guard.** value.js carries inv-I-2 "visibility transition guard discipline"; fourier carries the same guard as **dead code** (`visibility_illegal_transition`, `errors.py:59` — defined, shape-tested, NEVER called). The publish/unpublish handlers MUST be the guard's **first live callers** (the twice-struck chronic, finally discharged). Publish composes the guard; it does not route around it.
- **NO new authz path.** The owner-gate is the existing create/PATCH/delete idiom: owner sourced from the **session**, never the body (inv-14); anonymous → 401; non-owner → 403; every error RFC 9457 problem+json (inv-26 single-contract-source, no codegen).
- **NO new storage, NO migration.** The operation writes the existing `visibility` field. There is zero schema change in fourier; in value.js the only *additive* change is wiring the **missing** public-view filter clause (§5.2) so the publish op has a real consumer (inv-15).

If a future need wants per-audience ACLs, share-tokens, or scheduled publishing, that is a DIFFERENT primitive in a DIFFERENT tranche — explicitly out of scope here and named in §9.

---

## §1 — The model mapping (binary publish/unpublish onto each repo's 3-state enum)

Both repos ship a **3-state visibility enum**. The user's binary "private vs public" maps onto the two endpoints of each enum; the middle state is preserved and untouched.

### §1.1 — fourier (flat 3-state, NO tier)

`Visibility = Literal["draft", "unlisted", "public"]` (`api/models/visualization.py:33`). Default `"draft"` (`:104` persisted, `:153` create body, `:173` patch body). There is **no tier** — fourier's model is a flat enum (grep confirms zero `tier` in the model/router); the `(visibility, tier)` 9-tuple machine is value.js's alone (§1.2). The proven semantics (conformance test `api/tests/conformance/test_visibility.py`):

| State | Semantics | Public list | Gallery | Direct slug read (non-owner) | Maps to |
|---|---|---|---|---|---|
| `draft` | OWNER-ONLY; not in public view (the DEFAULT) | excluded (`visualizations.py:239`) | excluded (`gallery.py:53`) | **404** — refuses to confirm existence (`visualizations.py:192-193`) | **"private"** |
| `unlisted` | LINK-REACHABLE but NOT LISTED | excluded (`:239`) | excluded (`gallery.py:53`) | **200** (only `draft` 404s; `test_visibility.py:93-95`) | **middle — untouched** |
| `public` | LISTED + link-reachable; in public view | included | included | **200** | **"public"** |

> `publish` ≡ set `visibility = "public"` in-place (`draft→public` and `unlisted→public` are both contract-legal, SCHEMA.md:334). `unpublish` ≡ flip OUT of the public view — **and here the contract is binding**: SCHEMA.md:335-336 / CRUD-CONTRACT.md:526 FORBID `public → draft` (must pass through `unlisted`); the legal `public→*` move is `public→unlisted` (SCHEMA.md:335). So fourier `unpublish` targets **`unlisted`**, not `draft` — see §5.1 for the full guard reconciliation. `unlisted` is not a *publish* target the owner picks blind; an owner who wants link-without-listing also reaches it via PATCH-visibility directly (§4.5).

### §1.2 — value.js (`(visibility, tier)` 9-tuple, tier ORTHOGONAL)

`PALETTE_VISIBILITIES = ["public", "unlisted", "private"]` (`api/src/models.ts:36-37`); `PALETTE_TIERS = ["standard", "featured", "archived"]` (`:39-40`). The split is documented at `models.ts:32-35`: `visibility` carries **WHO-can-see**, `tier` carries **WHAT-position-in-curation** — orthogonal axes, a 9-tuple of valid resting states. The migration map confirms `private` IS the "not in public view" state: `draft → private/standard` (`migrate-visibility-tier.ts:38`).

| State | Semantics | Maps to |
|---|---|---|
| `public` | in public view (once the §5.2 filter lands) | **"public"** |
| `unlisted` | link-reachable, not-listed | **middle — untouched** |
| `private` | not in public view | **"private"** |

> `publish` ≡ set `visibility = "public"` in-place. `unpublish` ≡ set `visibility = "private"` (migration-confirmed not-in-public-view, `migrate-visibility-tier.ts:38`). `unlisted` untouched. **Publish touches `visibility` + `updatedAt` ONLY — never `tier`, never `status`, never `deletedAt`** (§5.4 orthogonality). A `featured` palette stays `tier = featured` across a publish.

### §1.3 — The one legitimate per-repo difference (named, verified-at-close)

The ONLY difference between the two repos is the **name of the private state**: fourier `draft`, value.js `private`. Everything else — the binary operation, the in-place `$set`, the idempotency, the guard composition, the owner-gate, the response envelope, the soft-delete interaction — is **symmetric**. The `unlisted` middle state is identically named and identically untouched in both. This single difference is the verified-at-close parity point (§6).

---

## §2 — The endpoint(s) (dedicated verb-routes, NOT PATCH-overload)

### §2.1 — The decision: dedicated `POST /:slug/publish` + `POST /:slug/unpublish`

Fold publish into a **dedicated, intention-revealing pair** — `POST /:slug/publish` and `POST /:slug/unpublish` — NOT a PATCH-visibility overload. Justification:

1. **Agent-legible for the WebMCP surface.** J's CORE is designed agent-legibly (`J.W1-crud-remix.md §4`); the dedicated verb-routes join the existing `POST /:slug/restore` (`visualizations.py:346`) + the designed `POST /:slug/remix` (`J.W1-crud-remix.md §4.1`) family. A future `registerTool("publish-visualization")` is a thin wrapper over a named verb; it cannot cleanly wrap "PATCH with a magic visibility key."
2. **Naturally idempotent + audit-friendly.** A verb-route gives a clean idempotent 200-no-op contract (§3) and an obvious audit point (the guard's first caller, §5.1) — uncoupled from PATCH's content-diff/ETag-recompute path.
3. **Binary intent ≠ arbitrary visibility edit.** PATCH-visibility STAYS for arbitrary owner-driven visibility edits (e.g. setting `unlisted` directly, §4.5). The publish PAIR is the binary public-membership toggle. They are different intents; one route each.
4. **value.js parity.** This mirrors value.js's idiomatic Hono surface — `POST /:slug/restore` (`routes/palettes/crud.ts:153-161`) + the admin idempotent `setFeatured` (`admin/palettes.ts:32`). The publish pair is the visibility-axis sibling of restore (the liveness-axis verb).

**Rejected: overloading PATCH.** In value.js, PATCH *categorically cannot* change visibility today — `updatePaletteBody` accepts only `{name, colors, tags}` (`validation/palette.ts:48-57`); widening it would couple the pure flag-flip to the versioning/content-diff path. In fourier, PATCH *can* set visibility (`VisualizationUpdate.visibility`, `visualization.py:173`) and STAYS the path for arbitrary edits — but the BINARY publish intent earns its own legible verb. We keep both: dedicated verbs for the binary, PATCH for the free-form edit.

### §2.2 — Request / response / status — fourier

```
POST /api/visualizations/{slug}/publish
POST /api/visualizations/{slug}/unpublish

Headers:  X-Session-Token: <token>        (owner; inv-14 — NEVER from the body)
          If-Match: "<etag>"              (optimistic concurrency; the PATCH precedent)
          Idempotency-Key: <uuid>         (optional; the create/remix precedent)
Body:     <empty>                          (the intent is the verb; no body fields — owner from session)

200 OK    — the visibility was flipped, OR was already at target (idempotent no-op).
            Body: the public visualization doc (the `_public_doc` shape, visualizations.py:199)
                  with `visibility` reflecting the new state + a derived `published: bool`.
            ETag: the recomputed entity ETag (etag.set_etag_header, :205).
```

Status table (fourier):

| Condition | Status | problem+json `type` (errors.py) | Source precedent |
|---|---|---|---|
| anonymous (no session) | **401** | `urn:contract:owner-required` | `visualizations.py:284-285` |
| session ≠ owner | **403** | `urn:contract:not-owner` | `:291-292` |
| slug malformed | **400** | `urn:contract:slug-invalid` | `:280-281` |
| no row / soft-deleted row | **404** | `urn:contract:not-found` | `:289-290` (non-live) |
| `If-Match` absent | **428** | `urn:contract:precondition-required` | `etag.require_if_match` |
| `If-Match` stale | **412** | `urn:contract:etag-mismatch` | `:295` |
| forbidden transition (guard) | **409** | `urn:contract:visibility-illegal-transition` | `errors.py:59` (FIRST live caller) |
| success (flip OR already-at-target) | **200** | — | `:300-308` $set + ETag envelope |

### §2.3 — Request / response / status — value.js

```
POST /palettes/:slug/publish
POST /palettes/:slug/unpublish

Middleware: requireOwnership(paletteOwnerExtractor)   (routes/palettes/crud.ts:94-101)
            — owner from c.var.userSlug (session), NEVER the body (inv-14)
Headers:    If-Match: "<etag>"                          (I.W4 REQUIRED; the PATCH precedent, crud.ts:104,115)
Body:       <empty>

200 OK    — visibility flipped or already-at-target (idempotent). Body: formatPalette(updated).
            ETag: paletteETag(...) (crud.ts:129-132 precedent).
```

Status table (value.js):

| Condition | Status | problem `type` (`errors/index.ts`) | Source precedent |
|---|---|---|---|
| anonymous | **401** | owner-required | `requireOwnership` middleware |
| non-owner | **403** | not-owner | `requireOwnership` (`paletteOwnerExtractor` → mismatch) |
| missing row | **404** | not-found | `paletteOwnerExtractor` returns `null` → 404 |
| soft-deleted (within grace) | **410** | gone | `GoneError`, `crud.ts:56-58` |
| `If-Match` absent / stale | **428 / 412** | precondition | `assertIfMatch`, `crud.ts:115` |
| forbidden transition (guard) | **422** | `urn:palette-api:problem:validation` | `ValidationError`, `errors/index.ts:36` (FIRST consumer of inv-I-2) |
| success | **200** | — | `palettes.update(slug, {$set}, session)`, `crud.ts:214` |

> **The one legitimate status divergence**: fourier returns **404** for a non-live row (its PATCH precedent refuses to distinguish deleted-from-absent, `:289`); value.js returns **410 Gone** within grace (its `GoneError` precedent, `crud.ts:56-58`). Both REJECT publishing a soft-deleted row (§5.3) — the status *code* differs because the two repos already ship different not-live conventions. This is a pre-existing per-repo convention, not a publish-introduced divergence; it is named and accepted at close. Likewise the guard status differs (fourier **409** `visibility_illegal_transition` vs value.js **422** `ValidationError`) — each composes its OWN already-shipped guard error, not a grafted one (§5.1).

---

## §3 — The idempotency rule (the load-bearing requirement)

**Publish is an idempotent in-place visibility mutation on the SAME row. No new document is EVER created by publish.**

### §3.1 — Exact pre/post state — `publish`

```
PRE:   row{ slug: S, _id: X, visibility: "draft"|"unlisted", content_hash: H, set_hash: K,
            fork_of: …, version_count: V, created_at: C, deleted_at: null, … }
OP:    db.visualizations.update_one({"slug": S}, {"$set": {"visibility": "public",
                                                           "updated_at": now}})
POST:  row{ slug: S, _id: X, visibility: "public",        content_hash: H, set_hash: K,
            fork_of: …, version_count: V, created_at: C, deleted_at: null, updated_at: now }
```

Identical `slug`, `_id`, `content_hash`, `set_hash`, `fork_of`, `version_count`, `created_at`, provenance. ONLY `visibility` (+ `updated_at`) change. Flipping `visibility` to `"public"` is **SUFFICIENT** to add the row to public view — the gallery (`gallery.py:53`) and list (`visualizations.py:239`) filters key on `visibility == "public"`, so no second mutation is needed.

### §3.2 — The no-op (idempotent re-publish)

- **Publishing an already-`public` row → 200 no-op.** The `$set` writes the literal value it already holds (a harmless idempotent write); the guard sees `public → public` (a same-state transition, always legal, §5.1); the response is the unchanged doc + a fresh ETag. **NOT a 409, NOT a duplicate.** This is the verbatim requirement: *re-publishing an extant item must NOT duplicate it.*
- **Re-publishing an EXTANT private item** (the load-bearing case): `draft → public` (fourier) / `private → public` (value.js) flips the flag **on the SAME `{slug}` row** — same slug, no new slug, no new version, no new `set_hash`, provenance untouched. The pre/post above is literally this case.
- value.js mirrors `restorePalette`'s already-live short-circuit (`crud.ts:279-282`): an already-at-target publish is a no-op-200.

### §3.3 — `unpublish` (the symmetric flip — contract-honest target)

```
publish:    draft|unlisted (fourier) / private|unlisted (value.js)  → public
unpublish — fourier:    public → unlisted   (the contract-LEGAL public→* move, SCHEMA.md:335)
unpublish — value.js:   public → private    (all 9 tuples legal; private is the not-in-public state)
```

The unpublish *target* differs by repo because the two repos ship different transition contracts (§5.1):
- **fourier**: the contract FORBIDS `public→draft` (SCHEMA.md:335-336 — must pass through `unlisted`); the legal `public→*` exit is `public→unlisted`. So fourier `unpublish` lands the row in **`unlisted`** — out of the public view (gallery + list both exclude `unlisted`, §1.1), link still reachable, contract honored. This is NOT clobbering: it is the legal de-publication state.
- **value.js**: all 9 `(visibility, tier)` tuples are valid resting states, so `public→private` is permitted; value.js `unpublish` lands in **`private`**.

- `unpublish` of an already-not-public row → 200 no-op (symmetric to §3.2): fourier an already-`draft` OR already-`unlisted` row stays put (both are already out of the public view — the op's post-condition holds); value.js an already-`private` OR already-`unlisted` row stays put.
- **`unpublish` NEVER collapses the `unlisted` link-shareable state** ([P1] warning): an `unlisted` row is already not-in-public-view, so unpublish is a no-op that leaves it `unlisted`. Only `public → {unlisted|private}` is a real flip; every other start state already satisfies "not in public view" and stays put. **publish/unpublish toggle the public-membership dimension; they never destroy link-shareability.**

### §3.4 — NO new document, structurally

Publish reuses the in-place `{slug}` `$set` shape verbatim:
- fourier: `db.visualizations.update_one({"slug": slug}, {"$set": updates})` — the PATCH precedent (`visualizations.py:299`).
- value.js: `palettes.update(slug, { $set }, session)` — the patch precedent (`crud.ts:214`).

It NEVER calls the remix/fork insert path (fourier: the designed remix insert, `J.W1-crud-remix.md:240-249`; value.js: `forks.ts:97` `insertOne`). There is no save-as / publish-as-copy path anywhere in either codebase, and this spec forbids inventing one. **The anti-duplication guarantee is structural: publish's only write verb is `$set` on `{slug}`.**

---

## §4 — The bright line vs REMIX (the anti-duplication guarantee made structural)

Publish and remix share NOTHING but the owner-gate + ETag envelope. They are categorically distinct operations.

| Axis | **publish / unpublish** (this doc) | **remix** (`J.W1-crud-remix.md`) |
|---|---|---|
| Write verb | in-place `$set` on the SAME row | `insertOne` — a NEW child row |
| `slug` | unchanged | server-generated child slug |
| `_id` | unchanged | new `_id` |
| `set_hash` / `content_hash` | unchanged | new (child's own atoms) |
| `fork_of` | unchanged (untouched) | set to `source.slug` (provenance edge) |
| `version_count` / version chain | unchanged | new root version (`depth=0`) |
| Provenance | untouched | a new edge is recorded |
| What changes | `visibility` (+ `updated_at`) ONLY | the atom-bag; born at private default (`visibility="draft"`, `J.W1-crud-remix.md:224`) |
| Cardinality effect | 0 new rows | +1 row (the child) |
| Idempotency mechanism | same-row no-op (target already set) | `Idempotency-Key` replay → same child, never double-fork (`J.W1-crud-remix.md:251`) |
| Source semantics | mutates the source's own visibility | NEVER mutates the source (only bumps `fork_count`) |

A remix child is **born private** (`visibility = "draft"` default, `J.W1-crud-remix.md:224`; value.js fork child default is `"public"` at `forks.ts:65` — a deliberate per-repo product choice the remix doc owns, [P1] in the value.js grounding). The user then **publishes** that child — which is THIS doc's in-place flip on the child's own row. **Remix creates the row; publish flips its flag.** The two compose (remix-then-publish) but never conflate. Routing a publish through the fork machinery would create a second row — exactly the categorical error the requirement forbids ([P2] in both groundings); this spec's structural guarantee (§3.4: publish's only verb is `$set` on `{slug}`) makes that error impossible.

---

## §5 — Interactions

### §5.1 — inv-I-2 / the dead guard: publish is the guard's FIRST live caller

The visibility transition guard is **dead code** in both repos:
- fourier: `visibility_illegal_transition` (`errors.py:59`) is defined + shape-tested but **never called** in any router; `update_visualization` `$set`s visibility with **zero** guard (`visualizations.py:297-299`). The intended rule (`CRUD-CONTRACT.md:526`, `SCHEMA.md:335-336`) — `public → draft` rejected, must transit `unlisted` — is unenforced at HEAD despite the contract claiming it landed ([P1] fourier grounding, the twice-struck chronic).
- value.js: inv-I-2 is **authored only** (`I.md:39`, re-named `J.md:47`); there is no guard service, no allowed-transitions table, no 422-on-invalid-transition anywhere in `api/src` ([P1] value.js grounding).

**The publish/unpublish handlers MUST be the guard's first live consumers — compose it, do not bypass it.** The guard validates `(currentVisibility → targetVisibility)` against the contract's legal-transition set and rejects a forbidden move (fourier 409 `visibility_illegal_transition`; value.js 422 `ValidationError`).

**The contract's binding legal-transition set (fourier, SCHEMA.md:334-336):** `draft→unlisted`, `draft→public`, `unlisted→public`, `unlisted→draft`, `public→unlisted`. **FORBIDDEN: `public→draft`** (must pass through `unlisted`). This is the decision the [P1] finding demands be *stated*, because a naive `unpublish: public → draft` is the EXACT move the guard forbids — so the publish op MUST NOT choose that target.

**The enumerated transitions for the binary publish op (fourier), every one contract-legal:**

| From | `publish` → | `unpublish` → | Guard verdict (SCHEMA.md:334-336) |
|---|---|---|---|
| `draft` | `public` | (no-op, stays `draft`) | `draft→public` LEGAL |
| `unlisted` | `public` | (no-op, stays `unlisted`) | `unlisted→public` LEGAL |
| `public` | (no-op, stays `public`) | **`unlisted`** | `public→unlisted` LEGAL (the only legal `public→*` exit) |

**Decision — fourier `unpublish` targets `unlisted`, NOT `draft`.** Rationale: the contract forbids `public→draft` (it must transit `unlisted`), and `unlisted` is ALREADY out of the public view (excluded from gallery + list, §1.1) — so a single legal `public→unlisted` move fully satisfies "not in public view" WITHOUT bypassing the guard and WITHOUT the awkward two-hop `public→unlisted→draft`. The de-published row lands link-reachable-but-unlisted, which is the correct "I took it out of the gallery" semantic. This **composes the guard honestly**: the publish op's two moves (`{draft|unlisted}→public` and `public→unlisted`) are ALL members of the contract's legal set; the guard rejects only genuinely-forbidden targets (e.g. a direct `public→draft` arriving via *arbitrary PATCH*, which keeps its stricter discipline). An owner who specifically wants a published row pulled all the way to owner-only `draft` does it in two deliberate steps (`unpublish` → then PATCH `unlisted→draft`), each legal — the verb never makes the forbidden jump.

**value.js** has no forbidden-pair table — all 9 `(visibility, tier)` tuples are valid resting states (the migration explicitly produces `public`, `unlisted`, AND `private`), so `public→private` IS permitted; value.js `unpublish` targets `private`. There the guard's job is to reject *malformed* targets (outside the enum) and preserve `(visibility, tier)` orthogonality (the move must produce a valid 9-tuple, leaving `tier` untouched, §5.4) — it validates the target-tuple shape, not a forbidden-pairs table.

**This is the explicit resolution of the [P1] guard tension**, per-repo: fourier `unpublish` lands `unlisted` (the contract-legal exit; never the forbidden `public→draft`); value.js `unpublish` lands `private` (all tuples legal). Both compose their OWN already-shipped guard, neither bypasses it. Stated here so a successor does not re-litigate it.

### §5.2 — The public-view consumer (inv-15): the named consumer

inv-15 requires the publish facility name a real consumer (substrate-without-consumer is binary). The consumer is **the public-view filter**:

- **fourier — the consumer ALREADY EXISTS** (two filters, both keying `visibility == "public"`): the gallery alias `with_not_deleted({"visibility": "public"})` (`gallery.py:53`) + the canonical anonymous list `base_query["visibility"] = "public"` (`visualizations.py:239`). Flipping `visibility` is sufficient to add/remove the row from public view — no extra work. fourier's publish op is consumer-backed at HEAD.
- **value.js — the consumer is MISSING and must land in the SAME change** ([P0] value.js grounding): `listPalettes` filters ONLY `f.deletedAt = null` (`crud-list.ts:85`); there is **no** `f.visibility = "public"` clause anywhere. Today `private`/`unlisted` palettes ARE returned in the public browse list. **The publish op is meaningless until this filter lands.** value.js-J MUST add `f.visibility = "public"` so the conjoined public-view predicate is `{ deletedAt: null, visibility: "public" }`. This is the inv-15 "name the consumer" requirement made executable: ship the filter clause in the same change as the publish verb, or the operation is substrate without a consumer.

### §5.3 — Soft-delete: a soft-deleted item CANNOT be published (no resurrect)

Soft-delete and visibility are **orthogonal** filters, ANDed in every public-view query (`{deleted_at: null}` AND `{visibility: "public"}`):
- fourier: `not_deleted_filter()` = `{"deleted_at": None}` (`softdelete.py:21-23`); the public list ANDs it with `visibility="public"` (`visualizations.py:232,239`); the gallery `with_not_deleted({"visibility": "public"})` (`gallery.py:53`).
- value.js: `f.deletedAt = null` (`crud-list.ts:85`), to be ANDed with the new `f.visibility = "public"` (§5.2).

**Publish must be a LIVE-ROW op** — it rejects a soft-deleted row (the PATCH precedent: fourier 404 on `doc.get("deleted_at") is not None`, `visualizations.py:289`; value.js 410 Gone within grace, `crud.ts:56-58`). **Publish NEVER touches `deleted_at`/`deletedAt`, and NEVER resurrects.** A soft-deleted row is already invisible via the orthogonal `deleted_at` filter independent of visibility, so publish never needs to touch liveness. **Restore** (`POST /:slug/restore`, fourier `visualizations.py:346`; value.js `crud.ts:153-161`) is the separate liveness op — it revives a row at WHATEVER visibility it held, and a publish AFTER restore is the normal flip. Publish changes visibility; soft-delete changes liveness; they never overlap.

### §5.4 — value.js (visibility, tier) orthogonality: publish touches visibility ONLY

Publish is the **visibility-axis mirror** of `setFeatured` (the curation-axis op, `admin/palettes.ts:41-50`, which mutates only `tier` + `status`). Publish mutates **only `visibility` (+ `updatedAt`)** — never `tier`, never `status`, never `deletedAt` ([NIT] both groundings). A published palette that is also `featured` keeps `tier = featured`; publish never resets curation. The three axes — visibility (who-can-see), tier (curation), deletedAt (lifecycle) — stay orthogonal. (fourier has NO tier — the 9-tuple machine is value.js's alone; fourier composes its OWN flat 3-state discipline. The shared concept is the guard DISCIPLINE, not the 9-tuple shape, [NIT] fourier grounding.)

### §5.5 — Idempotency-Key / ETag / If-Match on the mutation

Publish reuses the **full PATCH mutation envelope verbatim**:
- **If-Match ETag guard** — required; `428` if absent, `412` if stale (fourier `etag.require_if_match`, `visualizations.py:295`; value.js `assertIfMatch`, `crud.ts:115`). Optimistic concurrency holds: a publish races a concurrent edit safely.
- **Idempotency-Key** (optional) — the create/remix replay store (fourier `idempotency.replay_or_record`, `visualizations.py:163`); a retried publish replays the same 200. Combined with the same-row no-op (§3.2), publish is doubly idempotent (key-level AND state-level).
- **ETag on the 200** — the recomputed entity ETag (`etag.set_etag_header`, `:205`; value.js `paletteETag`, `crud.ts:129`).
- **RFC 9457 problem+json on EVERY error** (inv-26 single-contract-source, hand-typed, no codegen). The publish handlers add `urn:contract:visibility-illegal-transition` consumption to the contract WITHOUT a second contract source (inv-26 held).

---

## §6 — Cross-repo parity (the symmetric envelope)

The publish facility is **symmetric across both repos** except for one legitimate difference (§1.3, the private-state name). Verified at the J close.

| Concern | fourier-J | value.js-J | Symmetric? |
|---|---|---|---|
| endpoint pair | `POST /:slug/{publish,unpublish}` | `POST /:slug/{publish,unpublish}` | ✅ identical |
| operation | in-place `$set` on `{slug}` | in-place `update(slug,{$set})` | ✅ identical |
| public state | `public` | `public` | ✅ identical |
| **owner-only private state** | **`draft`** | **`private`** | ⚠️ **legitimate difference** (§1.3) — the enum name |
| **`unpublish` target** | **`unlisted`** (contract forbids `public→draft`, SCHEMA.md:335) | **`private`** (all 9 tuples legal) | ⚠️ **per-repo contract** (§5.1) — both are "not in public view" |
| middle state | `unlisted` (untouched by op) | `unlisted` (untouched by op) | ✅ identical |
| owner-gate | session → 401/403 (inv-14) | `requireOwnership` → 401/403 (inv-14) | ✅ identical discipline |
| guard | `visibility_illegal_transition` 409 | `ValidationError` 422 (inv-I-2) | ⚠️ per-repo error (each its own) |
| not-live reject | 404 (PATCH precedent) | 410 Gone (within grace) | ⚠️ per-repo convention (pre-existing) |
| public-view consumer | EXISTS (`gallery.py:53` + `:239`) | LANDS NOW (`crud-list.ts:85` + filter) | ✅ both consumer-backed at close |
| response | `_public_doc` + `published: bool` | `formatPalette` + `published: bool` | ✅ symmetric envelope |
| idempotency | same-row no-op + Idempotency-Key | same-row no-op + If-Match | ✅ identical |

**The symmetric response envelope.** Both repos expose the same publish result shape: the standard public entity doc with `visibility` reflecting the new state, PLUS a **derived convenience** `published: bool` (= `visibility == "public"`). `published` is computed on the response, never a persisted column — it is a read-time convenience for clients (and the future WebMCP tool) that want a binary without re-deriving the enum. The envelope is identical; the `visibility` *value* differs by two legitimate per-repo facts (§1.3, §5.1): the owner-only private state's NAME (`draft` vs `private`) and the `unpublish` LANDING state (fourier `unlisted`, forced by its `public→draft`-forbidden contract; value.js `private`). Both landings satisfy "not in public view"; the `published: bool` is identically `false` for either. **Verified at close**: a cross-repo publish/unpublish round-trip asserting identical envelope shape + the `published` boolean + the in-place-no-new-row guarantee (mirroring the `J.W1-crud-remix.md §6` `/diff` shape-parity check).

---

## §7 — Test surface + the J wave/board placement

### §7.1 — Wave placement

J.W1c is a **CRUD-CORE sibling of `J.W1-crud-remix.md`** — both are W1 DESIGN deliverables whose IMPL lands in **W2** (constellation WAVE D), both repos. It rides the same DEV/IMPL boundary (`J.md §4`: W0+W1 plan, W2+ implement). The publish op and the remix op are the two halves of the CRUD CORE: remix = the new-row half; publish = the in-place-flag half. They land together in W2.

**Migration impact: NONE.** Publish writes the EXISTING `visibility` field — zero schema change in fourier; in value.js the only additive change is the §5.2 public-view filter clause (a query-filter line, not a data migration; existing rows are untouched). No backfill, no new collection, no field addition. (Contrast `J.W1-crud-remix.md §7`, which DOES add fork fields + a version collection — publish adds nothing.)

### §7.2 — Test surface (the close evidence; every "green" cites a CI run id, inv-27)

**fourier** (`api/tests/conformance/test_publish.py`, extending `test_visibility.py`):
- `publish` of a `draft` row → 200, `visibility == "public"`, SAME slug/`_id`/`content_hash`, now in the public list (`visualizations.py:239`) + gallery (`gallery.py:53`); row count unchanged (anti-duplication).
- `publish` of an already-`public` row → 200 no-op, no duplicate.
- `unpublish` of a `public` row → 200, `visibility == "unlisted"` (the contract-legal `public→unlisted` exit, SCHEMA.md:335; NOT the forbidden `public→draft`), removed from public view.
- `unpublish` of an `unlisted` row → 200 no-op, **stays `unlisted`** (already out of public view, §3.3).
- the guard is honored: a direct `public→draft` via arbitrary PATCH → 409 `visibility_illegal_transition` (the dead guard's first live rejection, SCHEMA.md:335-336).
- anonymous publish/unpublish → 401 (`owner_required`); non-owner → 403 (`not_owner`).
- publish of a soft-deleted row → 404 (`not_found`), `deleted_at` untouched, NOT resurrected (§5.3).
- `If-Match` absent → 428; stale → 412; success carries a fresh ETag.
- **the guard's first live call**: assert `visibility_illegal_transition` is REACHABLE (a malformed-target path → 409) — closing the twice-struck dead-code chronic (`errors.py:59`).
- the symmetric envelope: response carries `published: bool` derived from `visibility`.

**value.js** (`api/test/palette-publish.test.ts`):
- the symmetric set, with `private` in place of `draft` and 410 in place of 404 for soft-deleted.
- **the §5.2 consumer test**: a `private` palette is NOT in `listPalettes`; `publish` adds it; `unpublish` removes it (proving the filter clause landed — without this the publish op is substrate without a consumer).
- publish touches `visibility` + `updatedAt` ONLY; a `featured` palette keeps `tier === "featured"` across publish (§5.4 orthogonality).
- the guard's first consumer: a malformed target → 422 `ValidationError` (inv-I-2 materialized).

**Cross-repo (J close)**: the §6 envelope-parity round-trip (identical shape + `published` boolean + no-new-row) verified between both repos (the `J.W1-crud-remix.md §6` parity-check sibling).

---

## §8 — Summary (the spec in one paragraph)

Publish is a binary OPERATION over each repo's existing 3-state visibility enum — NOT a new state. `publish` flips `visibility` to `public` in-place on the SAME `{slug}` row (fourier `$set`, `visualizations.py:299`; value.js `update(slug,{$set})`, `crud.ts:214`); `unpublish` flips OUT of the public view to the contract-legal not-public state (fourier `unlisted` — because the contract FORBIDS `public→draft`, SCHEMA.md:335-336; value.js `private` — all 9 tuples legal); the `unlisted` middle state is preserved and never destroyed. It is exposed as a dedicated agent-legible verb pair `POST /:slug/{publish,unpublish}` (the `restore`/`remix` family), owner-gated from the session (inv-14, anon → 401, non-owner → 403), If-Match ETag-guarded, RFC 9457 problem+json on every error (inv-26). It is idempotent two ways — a same-row no-op when already at target, and an Idempotency-Key replay — and creates NO new document EVER, the structural anti-duplication guarantee that draws the bright line against remix (which inserts a new child row, `J.W1-crud-remix.md:240-249`). The publish handlers are the FIRST live callers of the twice-dead visibility transition guard (fourier `errors.py:59`; value.js inv-I-2), composing it (allowing the binary publish/unpublish as owner-driven moves, rejecting malformed targets). The named public-view consumer (inv-15) is fourier's existing `visibility=="public"` filters (`gallery.py:53` + `:239`) and value.js's **missing** filter clause, which lands in the same change (`crud-list.ts:85`). Soft-delete is orthogonal — a soft-deleted row cannot be published (404/410, no resurrect); in value.js publish touches `visibility` only, never `tier`/`status`/`deletedAt`. The facility is symmetric across both repos save two legitimate per-repo facts (the private-state enum NAME `draft` vs `private`, and the `unpublish` LANDING state — fourier `unlisted` because its contract forbids `public→draft`, value.js `private` — both "not in public view"), verified at close via the response-envelope-parity round-trip; it lands its IMPL in W2 as the in-place-flag half of the CRUD CORE, sibling to the new-row remix half, with ZERO migration.

---

## §9 — Explicitly out of scope (the KISS guardrails, named)

Recorded so a successor does not re-litigate them:
- **No new visibility state** — the 3-state enum is the model; publish is an operation over it.
- **No persisted `published` column** — `published` is a derived read-time convenience; the enum is the single source.
- **No per-audience ACLs / share-tokens / scheduled publishing** — a DIFFERENT primitive in a DIFFERENT tranche.
- **No save-as / publish-as-copy** — publish is in-place only; duplication is remix's job (the bright line, §4).
- **No guard bypass for the unpublish verb** — fourier `unpublish` lands the contract-legal `public→unlisted` in ONE move (never the forbidden `public→draft`); pulling a row all the way to owner-only `draft` is a separate deliberate PATCH step. The verb never makes a forbidden jump (§5.1).
- **No tier touch from publish** (value.js) — curation stays orthogonal (§5.4).
- **WebMCP `publish-visualization` tool surface is BOOKED, not built** (Early-Preview; the `J.W1-crud-remix.md §5` consumer-4 posture) — the verb is authored agent-legibly NOW so the tool wrapper is thin LATER.
