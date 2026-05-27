# Challenge P1 — framework-in-disguise probe (invariant 16)

**Probe**: Wχ-P1, fourier-analysis tranche-B challenge wave.
**Invariant under test**: B.md §2 invariant 16 — "Shared by contract;
per-language utility modules admitted; frameworks rejected."
**Method**: research-only. Adversarial re-classification of
`coordination/CRUD-CONTRACT.md` §0–§12, an independent framework-smell
audit of `coordination/CRUD-LIB-PY.md`'s 8 modules, a LOC-ceiling stress,
and an anti-pattern grep. R3's claim (10 contract / 1 data / 0 library /
0 service) is **not** taken on faith; it is re-derived below.
**Verdict (TL;DR)**: shared-code share = **0 %** of sections;
utility-module framework-smell = **NONE**; disposition = **ACCEPTED** —
invariant 16 HOLDS.

---

## §1 — Section classification table

Each CRUD-CONTRACT section is classified by the *strongest* artefact it
forces. The question is not "does the section mention code?" (most do, as
*per-repo* realisations) but "does conforming to this section require a
**third package both repos import**?" That is the only thing that breaks
invariant 16. A per-repo utility module (`api/lib/crud/`) is *in-repo
code the app calls* — it is **not** "shared code" in the invariant's
sense (the invariant explicitly admits it). So a section is `code` here
**only** if it forces a *cross-repo shared* package / codegen / service.

| Section | spec / data / code | rationale |
|---|---|---|
| §0 — Status, authority, scope | **spec** | Metadata + KISS-reject list + SOTA-adopted list. Pure prose both repos point at. The reject list *names* the framework anti-patterns to forbid them — prohibition, not prescription. |
| §1 — Identity | **spec** | Three-identifier role table + URL-shape rule + hash policy. Pure rule; each repo realises in its own router/schema. No shared artefact. |
| §2 — Slug algorithm | **spec** (+ leans on the §9 `data` row) | Shape regex, length, cryptographic-RNG rule, insert-then-catch collision policy. Logic, not data. The *word-list* it references is the one `data` row (counted under §9), but the §2 *algorithm* is text. |
| §3 — Ownership | **spec** | Required non-null owner, 401-on-anonymous, 403-on-cross-owner, admin-override-logged. Pure rule. |
| §4 — Visibility | **spec** | 3-state enum + transition graph + list-filter semantics + draft-404 rule. Pure rule + enum. |
| §5 — Soft-delete | **spec** | `deleted_at` single-field write, 30-day grace, restore endpoint, slug-non-release, bounded cron query. Pure rule. |
| §6 — Sessions | **spec** | UUIDv4 token shape, header-not-cookie, 30-day TTL, suspension-cache (named single-replica constraint), timing-safe login. Pure rule + shape. |
| §7 — Admin moderation | **spec** | Bearer auth, 8-action table, idempotency rule, batch 207/200/400 shape, flag-uniqueness, audit-row rule. Pure rule + action-shape table; paths are per-repo. |
| §8 — Cron / TTL policy | **spec** | 6-hour tick, bounded-queries-only, cleanup ordering, `pinned: bool` *pattern* (named in text, realised per-repo). Pure rule. |
| §9 — Shared data vs shared code (R3) | **data** (1 file) + spec | The disposition table itself is prose. It admits exactly ONE shared artefact: the slug word-list JSON at `docs/precepts/data/slug-words.json`. Everything else is `contract`, `per-repo`, or in-repo `utility`. This is the only non-spec, non-per-repo artefact in the whole contract — and it is **data, not code**. |
| §10 — Conformance matrix | **spec** | An index/ledger of per-repo test paths + run commands. Each repo authors its own tests; the matrix is a shared *table of pointers*, not shared executable code. The three source-grep scripts (`grep-no-*.sh`) are per-repo scripts, not a shared package. |
| §11 — Migration disposition | **spec** | Idempotent/dry-run/count-verify discipline + per-repo backfill tables. Each repo ships its own migration script. Pure rule + precedent. |
| §12 — Open items & change log | **spec** | Open-item destinations + semver change log. Pure metadata. |

**Tally**: spec = **12** (§0–§8, §10–§12), data = **1** (§9's word-list),
code = **0**.

### Why §9 and §10 do NOT count as `code`

These are the two sections most tempting to score as `code`; both fail:

- **§9** disposes the seven cross-cutting helpers as `utility` — *per-repo
  in-repo* modules (`api/lib/crud/` Python; `api/src/crud/` TS), each
  imported only within its own repo. The invariant's own text (B.md:43)
  admits these by name. They are categorically distinct from a *shared
  package both repos import*. The single cross-repo artefact §9 admits is
  the word-list, which is **data** (≤6.8 KB JSON, zero runtime dep), not
  code. R3 §3's three-test admit-rule (size / drift-is-correctness /
  language-agnostic) is independently sound: a JSON array of `^[a-z]+$`
  strings carries no behaviour.
- **§10** is a ledger of *pointers* to per-repo tests. No repo imports
  another repo's test code; the matrix coordinates by *naming* paths, not
  by sharing a runtime. This is the "written contract" form, not a
  coordinating service.

---

## §2 — Shared-code percentage

```
code sections / total sections = 0 / 13 = 0.0 %
```

The probe's rejection threshold is **> 20 %** of sections requiring
shared code. Observed: **0 %**. Even under the *most* adversarial reading
— scoring §9 as the closest thing to shared (it admits the one shared
*data* file) — that artefact is data, not code, so it still does not count
toward the shared-code numerator. If one perversely counted the word-list
as "shared" anyway, the figure would be 1/13 = 7.7 %, still well under 20 %.

**Verdict on the >20 % gate: PASS.** No section forces a third package
both repos import. R3's "10 contract / 1 data / 0 library / 0 service" is
**independently confirmed** (my count reshapes it as 12 spec / 1 data
because I score §0/§10/§12 as full spec sections that R3's 11-target
disposition table folds into the behavioural rows; the substantive
conclusion — zero `library`, zero `service` — is identical).

---

## §3 — Utility-module framework audit (`api/lib/crud/`)

A framework *owns the request loop*; a utility is *called from it*. The
test per helper: does the application call the helper (utility), or does
the helper own the request lifecycle (framework)? The CRUD-LIB-PY spec is
built explicitly against this probe — every module section carries the
"NOT a decorator / NOT a Router / NOT a Mixin" discipline.

| Helper | app-calls-it OR it-owns-loop | framework-smell |
|---|---|---|
| `slugs.generate_slug` / `validate_slug` | app-calls-it — pure functions returning a string / bool | **no** |
| `slugs.slug_with_retry(insert_fn, ...)` | app-calls-it — takes the app's `insert_fn` *as an argument* and loops over it; the app owns the route, the helper owns only the retry loop. This is a higher-order function, **not** control inversion (the helper does not register a route or dispatch the request). | **no** |
| `cursors.encode_cursor / decode_cursor / paginate / next_cursor_from_last` | app-calls-it — the list endpoint decodes the cursor, builds the query, runs the find itself, then asks the helper for the next cursor. The helper never touches the request/response. | **no** |
| `errors.problem(...)` + 20 one-line helpers | app-calls-it — each returns a `JSONResponse` the route `return`s. The route decides *when* to emit; the helper only shapes the body. | **no** |
| `etag.compute_etag` | app-calls-it — pure hash over a dict. | **no** |
| `etag.require_if_match(request, expected_etag)` **(danger zone)** | app-calls-it — see §4. It is a `Depends`-able callable, but the *route* both declares the dependency AND passes `expected_etag` (computed from the doc the route already fetched). The helper raises 428/412; it does not own routing, dispatch, or the success path. FastAPI `Depends` is consumer-side wiring, not framework control inversion. | **no** |
| `etag.set_etag_header(response, doc)` | app-calls-it — mutates a `response` the route already owns. | **no** |
| `idempotency.IdempotencyStore` (+ `ensure_indexes`/`lookup`/`store`) | app-calls-it — a thin Mongo-collection wrapper; methods are invoked explicitly. | **no** |
| `idempotency.replay_or_record(request, store, scope, handler)` **(danger zone)** | app-calls-it — spec is **emphatic** (lines 518, 585): "**Not** a decorator; invoked explicitly." The route passes its *own* `handler` closure as an argument; the helper calls it back. Higher-order function, not a `@crud_endpoint` that wraps and registers the route. The route remains a hand-rolled `@router.post("")`. See §4. | **no** |
| `softdelete.*` (mixin + `not_deleted_filter`/`with_not_deleted`/`soft_delete`/`restore`) | app-calls-it — filter builders + two async ops on a collection the route hands in. Returns a bool / enum the route turns into a response. | **no** |
| `pinned_cron.mark_pinned / cron_prune` | app-calls-it — the janitor (`_cleanup_cycle`) invokes them; they don't own the cron loop, only one bounded query each. | **no** |
| `__init__.py` | re-exports only — and pins the no-Router/no-Mixin/no-`@crud_endpoint` discipline in its docstring at the surface. | **no** |

**Smell count: 0 / 12 helpers.** Every helper is *called by* a
hand-rolled router; none registers routes, owns dispatch, or inverts the
request lifecycle. There is no `BaseCRUDRouter`, no `CRUDMixin`, no
`@crud_endpoint`, no metaclass, no registry, no codegen step. The only
`inspect.getsource` appearance is in a **test** (`test_no_nin_in_query`),
not in the library — so even the one reflective construct is a test
assertion, not runtime introspection.

**Verdict: genuine utility library, NOT a framework in disguise.**

---

## §4 — LOC-ceiling stress

**Budget reality (CRUD-LIB-PY §11)**: 8 modules sum to **~535 LOC**;
sharing `_canonical_json` between `etag.py` and `idempotency.py` (counted
once) nets **~525**; the stated ceiling is **~500** ("5 % over", absorbed
by collapsing the 20 `errors` helpers to `partial(problem, ...)`
one-liners, or deferring idempotency response-header preservation). B.md
itself states the cap as **≤ 525 LOC** for the Python module.

**Is ≤525 achievable framework-free?** **Yes — and crucially, hitting the
budget does NOT force control-inversion shortcuts.** The opposite is true:
the cheapest way to *exceed* the budget would be to build a Router/Mixin
abstraction layer; the spec stays under budget precisely *because* it
ships flat free functions. The 20 `errors` helpers compress to
`functools.partial` one-liners — a *functional* compression, not a
decorator/registry that owns control. No metaclass, registry, or
route-owning decorator is needed to land at 525; none is proposed.

### Danger-zone verdicts

- **`idempotency.replay_or_record` — does it invert control?** **No.** A
  framework form would be `@idempotent` wrapping the route at definition
  time, owning the request before the handler runs. This spec instead
  takes the handler *as a runtime argument* (`handler: Callable[[],
  Awaitable[Response]]`) and the route calls `replay_or_record(...,
  handler=_do_create)` from *inside* its own body. The route is still a
  plain `@router.post("")` the engineer wrote by hand. Control flows
  app → helper → app's-own-closure. That is a callback, not inversion.
  The spec flags this distinction explicitly twice (lines 518, 585).
  Verdict: **utility**.

- **`etag.require_if_match` — does the dependency own the loop?** **No.**
  It is `Depends`-able, but (a) the *route* declares the dependency, (b)
  the route computes and passes `expected_etag` from a doc it already
  fetched, (c) the helper's only authority is to raise 428/412 — it
  cannot dispatch, route, or alter the success path. A FastAPI dependency
  is consumer-declared wiring (the route opts in), categorically unlike a
  framework that *registers* the route on the app. Verdict: **utility**.

**Verdict: ≤525 LOC is achievable framework-free; the two danger-zone
helpers are callbacks/dependencies, not control inversion.** The budget
does not pressure the design toward a framework — it pressures it toward
*smaller flat functions*, which is the utility form.

### Anti-pattern grep (probe step 4)

```
git grep -E "shared-crud-framework|codegen-crud|coordinator-service|BaseCRUDRouter|CRUDMixin" docs/tranches/B/ api/
```

returns matches ONLY in **prohibitive / prose** contexts:

- `B.md:43`, `R3 §4`, `CRUD-CONTRACT §0` reject-list, `CRUD-LIB-PY`
  §0/§8 "**NO** BaseCRUDRouter / **NOT** included", `CRUD-LIB-TS` "no
  framework-in-disguise", `W1.md:79` (the deletion-style grep gate itself),
  `PROGRESS.md:201` (records the disposition).
- **Zero** prescriptive occurrences: no spec section *defines*,
  *requires*, or *ships* a `BaseCRUDRouter`, `CRUDMixin`,
  `shared-crud-framework`, `codegen-crud`, or `coordinator-service`.
- `git grep "@mkbabb|shared-crud|crud-coordinator|crud-types" api/`
  returns **zero** — no shared backend dep exists in live code.
- `api/lib/crud/` and `docs/precepts/data/` are both **ENOENT** at HEAD
  (spec'd, owed at B.W3 — honest deferral, consistent with R3 §3/§6).

**Verdict: the three named anti-patterns are absent in any prescriptive
sense.** Every occurrence forbids them.

---

## §5 — DISPOSITION

**ACCEPTED. Invariant 16 HOLDS.**

The adversarial re-derivation independently confirms R3's substrate:

1. **Shared-code share = 0 %** (0 of 13 sections force a third package
   both repos import; the single shared *artefact* is data, not code).
   Well under the 20 % rejection threshold.
2. **The utility module is a genuine utility library, not a framework in
   disguise.** All 12 helpers are *called by* hand-rolled routers; none
   owns the request lifecycle. The two danger-zone helpers —
   `idempotency.replay_or_record` (a higher-order callback, emphatically
   "not a decorator") and `etag.require_if_match` (a consumer-declared
   `Depends`, not a route registrar) — are callbacks/dependencies, not
   control inversion.
3. **The ≤525 LOC ceiling is achievable framework-free** and, far from
   forcing control-inversion shortcuts, actively *rewards* flat free
   functions over any Router/Mixin abstraction (which would only add LOC).
4. **The three named anti-patterns are prescriptively absent** — every
   grep hit is a prohibition, a reject-list entry, or the grep gate itself.

No narrowing is required. The invariant's distinction — *contract* (spec)
+ *language-agnostic data* (the word-list) + *per-language utility
modules* (called, never inverting) ADMITTED; *shared framework / codegen /
coordinating service* REJECTED — is internally coherent and matches both
the spec corpus and the live code (where the only cross-repo shared
substrate is `precepts`, a spec/data submodule, and there is no shared
backend package). I could not break it.

**One non-blocking observation** (does not affect the disposition): the
probe brief frames the cap as "≤525 LOC"; CRUD-LIB-PY §11 states the
sub-module budgets sum to ~535 and reach ~525 only after the shared
`_canonical_json` deduction, against a stated "~500" ceiling. The module
is therefore 5 % over its own tightest target and relies on the named
`errors`-helper / idempotency-header compressions to land. This is a
*budget-tightness* note, not a framework-smell finding — the compressions
are functional (smaller flat functions), never control-inverting.
