# R3 — Shared optimum for the CRUD facility (architecture-decision lane)

**Lane**: R3 (fourier-analysis tranche-B research wave Wα) — the
architecture-decision lane whose disposition table seeds
`coordination/CRUD-CONTRACT.md §9` and the §10 conformance matrix.
**Question**: across a Python/FastAPI backend (fourier) and a Node/Hono
backend (value.js), what is the *shared optimum* for the CRUD facility, with
KISS load-bearing?
**Status**: research-only. This document is verified against the live code at
HEAD on both repos (2026-05-26) and refines the prior R3 disposition at
`research/R-identity-spec.md §5f`.

This artefact is the substrate that `Wχ.P1` (the "framework-in-disguise"
adversarial probe) tests against. It says, in one sentence: **the shared
optimum is a written contract (the default) plus exactly one shared-data file
(the slug word-list); no shared code, no codegen, no coordinating service.**

---

## §1 — Decision tree applied (the four-tier survey, KISS as the rule)

The four tiers, in escalating cost, with the admit-bar each must clear:

1. **Pure contract** — a written spec both backends implement; no shared
   code, no shared runtime artefact. **DEFAULT.** Admitted for any concern
   that is *logic / rule*, where the cost of specifying the behaviour in text
   is lower than the cost of shipping a code package, and where per-language
   idiom (FastAPI `Depends` vs Hono middleware; `secrets.choice` vs
   `crypto.randomInt`) makes a literal shared implementation a poorer fit than
   two faithful realisations of one named behaviour. **11 of 11 cross-cutting
   targets land here** save one.
2. **Shared data** — a language-agnostic data file (the slug word-list).
   Admitted *only* when the three-test admit-rule (§3) passes: ≤ 10 KB single
   file (or zero-runtime-dep package), drift-is-correctness, language-agnostic
   JSON/YAML/TSV. Sufficient for anything that is *data, not code*. **Exactly
   one target lands here: the slug word-list.**
3. **Shared library** — a third package both repos consume. Rejected by
   invariant 16 unless tiers (1) and (2) both fail *and* the duplication is
   large, behaviour-load-bearing, and stable. **Rejected for every CRUD
   target.** (Note: the 2026-05-19 `utility-extraction/DECISION.md` revision
   admits a *sixth* in-repo disposition — `utility` — for per-language utility
   modules at ≤ 525 LOC Python that are *called by* the application and never
   invert control. That is **not** tier 3: a `utility` module is per-repo code,
   not a shared package. The two are kept distinct below.)
4. **Shared service** — a third coordinating process (Redis for rate-limit
   state, NATS for cron fanout, a `crud-coordinator` daemon). Rejected by
   invariant 16 as superfluous cloud. **No target lands here.** §4 certifies
   the rejection structurally.

**KISS verdict.** The bare contract is the cheapest artefact that retires the
five-identity-scheme incoherence (`R-identity-spec §1b`). It ships as text,
versions as text, and imposes zero build/publish/runtime coupling between two
repos written in two languages. Tier 2 is admitted exactly once, for the only
target that is *pure data whose divergence is a slug-collision bug*. Tiers 3–4
buy coupling the cohort does not need.

---

## §2 — The disposition table (LOAD-BEARING)

One row per cross-cutting target. Each row carries the rationale, the
admit-rule outcome (only the shared-data rows run the three-test admit-rule;
contract rows are admitted by being *rule, not data*), the disposition ∈
{`contract`, `data`, `library`, `service`}, and the conformance assertion that
indexes into `CONFORMANCE-MATRIX.md`. This table is the verbatim substrate for
`CRUD-CONTRACT §9` and the §10 conformance matrix.

| Target | Rationale | Admit-rule passed? | Disposition | Conformance assertion |
|---|---|---|---|---|
| **Slug algorithm** (shape, length, RNG, collision policy) | Logic, not data. `^[a-z]+(-[a-z]+){3}$`, length 7–60, cryptographic RNG, insert-then-catch `DuplicateKeyError` retry ×10 → 503. Per-language idiom (`secrets.choice` vs `crypto.randomInt`); a shared code package would force one language's idiom on the other. Cheaper as text. | n/a (rule, not data) → **fails "language-agnostic" if forced to data** | **contract** (§2) | C2.1–C2.4 |
| **Slug word-list** | Data, not code. Four fixed lists of lowercase ASCII strings. Drift between repos changes *which slugs are minted* — a birthday-bound/dictionary-membership correctness bug, not a style choice. Lives at `docs/precepts/data/slug-words.json`; both repos already pin the `precepts` submodule. | **YES** — all 3 tests pass (size ~6.8 KB ≤ 10 KB; drift = correctness; pure JSON). See §3. | **data** (precepts submodule) | C9.1, C2.4, C-words.1–3 |
| **Identity** (slug ↔ `_id` ↔ content-hash separation) | Pure rule: three orthogonal identifiers, one user-facing (slug), two never URL-exposed. | n/a (rule) | **contract** (§1) | C1.1–C1.3 |
| **Ownership rules** (required non-null owner, 401-on-anonymous, 403-on-cross-owner) | Pure rule. | n/a (rule) | **contract** (§3) | C3.1–C3.4 |
| **Visibility states** (`draft`/`unlisted`/`public` + transitions, draft-404-to-non-owner) | Pure rule + enum. | n/a (rule) | **contract** (§4) | C4.1–C4.4 |
| **Soft-delete semantics** (`deleted_at` single-field write, 30-day grace, restore, slug-non-release) | Pure rule. | n/a (rule) | **contract** (§5) | C5.1–C5.4 |
| **Session model** (opaque UUIDv4 in `X-Session-Token`, 30-day TTL, suspension cache, timing-safe login) | Pure rule + shape. Single-replica suspension-cache constraint is per-repo process-local state, named in the rule. | n/a (rule) | **contract** (§6) | C6.1–C6.4 |
| **Admin actions** (8 named actions, idempotent, audit-row-per-action, batch 207/200/400) | Pure rule + action-shape table (paths are per-repo). | n/a (rule) | **contract** (§7) | C7.1–C7.5 |
| **Cron/TTL policy** (6-hour tick, bounded queries only, no unbounded `$nin`, cleanup ordering) | Pure rule. The `pinned: bool` bounded-prune *pattern* is named in text; its per-repo realisation is per-language code. | n/a (rule) | **contract** (§8) | C8.1–C8.4 |
| **Hash policy** (which content hashes survive + their non-user-facing role) | Pure rule (a per-hash disposition list). | n/a (rule) | **contract** (§1 hash block) | within C1.1 (no-hash-in-URL) |
| **Migration discipline** (idempotent, dry-run, count-verify, crash-safe, reversible-or-complete) | Pure rule + precedent (value.js `migrate-slugs.ts`). | n/a (rule) | **contract** (§11) | C11.1–C11.3 |

**Disposition counts: contract = 10, data = 1, library = 0, service = 0.**

Two non-target rows recorded in `CRUD-CONTRACT §9` are *not* among the 11
cross-cutting targets this lane disposes and are noted only for crosswalk
completeness:

- **Rate-limiter** → `per-repo` (process-local state; single-replica
  invariant 12). Not shared.
- **Slug uniqueness retry loop** + the seven named helpers (cursor codec,
  problem+json envelope, ETag, Idempotency-Key, soft-delete, pinned-cron)
  → `utility` (in-repo, per-language; ≤ 525 LOC; admitted by the 2026-05-19
  DECISION.md as called-by-the-app, never control-inverting). **This is not a
  shared package; it is two parallel in-repo modules** (`api/lib/crud/` in
  fourier, `api/src/crud/` in value.js). It does **not** count toward `library`.

The value.js-`C`-specific `library` rows that previously appeared in
`CRUD-CONTRACT §9` — the `Palette` domain type, `colorScale`, `sampleToSVGPath`
— were value.js's *own internal* library refactor (`src/palette/`), not a
*shared* package across the two backends. They are now moot: value.js-C is
RETIRED and `src/palette/` was never built (§6). **No row in the
cross-backend CRUD facility is disposed `library`.**

---

## §3 — Slug-words admit-rule verdict (the 3-test result, grounded in live code)

The slug word-list is the **single** target admitted to the *data* tier. The
three-test admit-rule, run against what actually exists at HEAD:

**Test 1 — Size (≤ 10 KB single file, or zero-runtime-dep package).**
The live source of truth is value.js's `~/Programming/value.js/api/src/slugWords.ts`
(6,498 bytes of TS source). Wrapped in the §1.2 JSON shape
(`{_version, adjective, verb, color, animal}`) it serialises to **≈ 6.8 KB** of
JSON. Well under 10 KB. **PASSES.**

**Test 2 — Drift-correctness.** If fourier and value.js draw from different
lists, the cohort cannot honestly state "one slug regex, one keyspace, one
birthday-bound." A slug minted on one side (`multitudinous-fox-cat` from
`coolname`) fails the other side's dictionary-membership assertion (C2.4).
Divergence is a slug-generation correctness bug, not a style preference.
**PASSES.**

**Test 3 — Language-agnostic.** Plain JSON arrays of `^[a-z]+$` ASCII strings.
Loadable from Python (`json.load`) and Node (`JSON.parse(readFileSync(...))`)
with no parser, transpiler, or encoding ceremony beyond stdlib JSON.
**PASSES.**

**All three pass. The slug word-list lands in the *data* tier.** Where it
lands: `docs/precepts/data/slug-words.json` (the precepts-submodule form), per
`SLUG-WORDS.md`, which superseded `R-identity-spec §5c`'s preferred
`@mkbabb/slug-words` npm+PyPI package (form a) with the submodule (form b),
promoted to default *because both repos already pin the `precepts` submodule* —
no new package, no new publish pipeline, no new pin. This is the strict-KISS
form of the same admitted disposition.

**Actual word-list sizes (live, verified — and a drift the spec must
reconcile).** The deliverable is required to ground the counts in live code.
`slugWords.ts` at HEAD contains:

| List | Live count (`slugWords.ts`) | Spec-asserted count (`SLUG-WORDS.md §1.5`, `CRUD-CONTRACT §2`) |
|---|---|---|
| `ADJECTIVES` | **128** | 120 |
| `VERBS` | **128** | 120 |
| `COLOR_TERMS` | **128** | 128 |
| `ANIMALS` | **128** | 128 |
| product (keyspace) | **128⁴ = 268,435,456 ≈ 2.68 × 10⁸** | 120·120·128·128 = 235,929,600 ≈ 2.36 × 10⁸ |

**Finding (NEW, drift between spec and live code):** the live `adjective` and
`verb` lists are **128**, not the **120** asserted by `SLUG-WORDS.md §1.5`, the
`slug-words.schema.json` fragment (`wordList120`), and the
`_EXPECTED_COUNTS = {"adjective": 120, "verb": 120, ...}` in the spec's
reference loaders. The schema's `minItems/maxItems == 120` would **reject the
live data**. This does not change the *disposition* (still `data`, still
admitted — 6.8 KB ≤ 10 KB regardless), but it is a load-bearing reconciliation
the W1 contract authoring must resolve at seed time: either (a) trim the live
lists to 120/120 before they become v1.0.0, or (b) bump the schema and counts
to 128/128/128/128 (a larger, strictly-safer keyspace; per the §3e
birthday-bound, 2.68×10⁸ is *more* collision-safe than 2.36×10⁸). The **W1
contract must not assert 120/120 against 128/128 live data** — that is a
guaranteed conformance failure on C-words.3 at the seed commit. Recommendation:
**adopt the live 128/128/128/128 verbatim** (the migration verdict in
`SLUG-WORDS.md §5` is "adopt value.js's existing lists verbatim, no curation
churn"; honouring that verdict literally means 128/128, and the counts table +
schema follow the data, not the reverse).

**Empirical-absence note, verified.** `docs/precepts/data/` is **ENOENT** at
HEAD (`ls` returns no such directory). The canonical destination is fixed and
the per-language loaders are named (`api/lib/crud/slugs.py`,
`api/src/crud/slugs.ts`), but the data file is **owed at B.W3 close** per
`SLUG-WORDS.md §1` — honest deferral, not a built artefact. fourier's
`api/lib/crud/` is likewise ENOENT (the utility module is spec'd, not built).

**Generator reality, verified.** fourier's `api/slugs.py` is a 2-line delegate
to `coolname.generate_slug(4)` (`coolname>=2.2` in `pyproject.toml`) — **not**
the structured `adjective-verb-color-animal` lists; `coolname` uses CPython
Mersenne `random.choice`, violating the cryptographic-RNG rule (invariant 21).
value.js's `generateSlug()` already uses the structured lists with
`crypto.randomInt`, but its `generateUniqueSlug()` still uses a **check-then-
insert pre-check loop** (`slugWords.ts:102-106`) — the TOCTOU pattern
`CRUD-CONTRACT §2 C2.3` retires. The slug-words disposition is therefore an
*adoption of value.js's lists* + *retirement of fourier's `coolname`* + *both
sides switch to insert-then-catch*; the word-list itself is the only shared
artefact in the move.

---

## §4 — Framework-rejection certification

This section is the substrate `Wχ.P1` adversarially probes. It certifies that
**no shared CRUD framework, no codegen, and no coordinating service is
warranted.**

**No shared CRUD framework (the tier-3 anti-pattern, invariant 16's core
target).** A `BaseCRUDRouter` / `CRUDMixin` / `@crud_endpoint` /
"register-your-entity" pattern would invert control — the framework owns the
request lifecycle and the per-repo route becomes a configuration callback.
Rejected because:
- (a) control inversion is the *exact* rot pattern invariant 16 names;
- (b) it ossifies legitimate per-repo divergence (value.js's `palette_versions`
  history table; fourier's `contour`/`image` blob children) into a shared
  abstraction that fits neither cleanly;
- (c) it spans two languages — a shared framework would require either codegen
  or a lowest-common-denominator runtime, both of which cost more than two
  hand-rolled routers calling small helpers.
The honest middle position — per-language **utility modules** (`api/lib/crud/`,
`api/src/crud/`), *called by* the router, never inverting control, ≤ 525 LOC —
is admitted by the 2026-05-19 DECISION.md and is **not** a framework. Its
admit-criteria (no control inversion; imported-by-routers-never-the-reverse;
≤ 500–525 LOC) are pinned by C9.4.

**No codegen** (OpenAPI → client SDK; a `crud-types` package compiled to both
Python and TS). Rejected by invariant 16's explicit prohibition: the contract
is *text*. No client demands a generated SDK; the two backends do not consume
each other's types.

**No coordinating service** (Redis for rate-limit state, NATS for cron fanout,
a `crud-coordinator` daemon). Rejected by invariant 16 ("no superfluous-cloud
systems"). Verified structurally: there is **no shared `@mkbabb` backend
package** in either repo today (`grep @mkbabb` over fourier `api/` returns
zero; `pyproject.toml` carries no `mkbabb-*` / `shared-crud` / `slug-words`
dep). The only cross-repo shared artefacts that exist are (i) `precepts` (a
spec/data submodule — *not runtime code*) and (ii) glass-ui composables (a
*frontend* shared-code precedent). **No backend code is shared between the two
servers today, and this lane certifies none should be.**

The conformance test C9.3 pins this:
`grep -rE "from .* import shared_crud|require\(.*shared-crud"` returns zero, and
`docker-compose.{yml,prod.yml}` + value.js's `Caddyfile` contain no third
coordinating service. The grep explicitly *permits* `api/lib/crud/` and
`api/src/crud/` (the admitted in-repo utility modules).

**Certification: contract + one data file is the complete shared surface. No
tier-3 (shared library) and no tier-4 (shared service) row is warranted.**

---

## §5 — Crosswalk to `R-identity-spec §5` + `CRUD-CONTRACT §9`

**What holds (this table refines, does not contradict, the prior R3).**

- The slug word-list is `data`, admitted by the identical three-test rule.
  Holds verbatim from `R-identity-spec §5b/§5f`.
- The slug *algorithm*, *identity model*, and *hash policy* are `contract`
  ("shared spec" in `R-identity-spec §5f`'s vocabulary). Holds; this table just
  uses the `CRUD-CONTRACT §9` disposition name `contract` for what §5f called
  "shared spec".
- No shared library, no shared service. Holds.

**What drifts (and is reconciled here).**

1. **Disposition *location* of the word-list.** `R-identity-spec §5c`
   recommended **form (a)** — the `@mkbabb/slug-words` npm + PyPI package — with
   form (b) (precepts submodule) as a fallback. `SLUG-WORDS.md` and
   `CRUD-CONTRACT §9` adopted **form (b)** (precepts submodule) as the *default*,
   on the strict-KISS grounds that both repos already pin precepts → no new
   package, no new publish pipeline. **This R3 refinement ratifies form (b).**
   The disposition tier is unchanged (`data` either way); only the storage
   location moved, toward less infrastructure. Rationale: form (a) ships two
   publishing pipelines for ~6.8 KB of strings; form (b) ships zero. KISS wins.
2. **Word-list counts.** `R-identity-spec §5b` and `SLUG-WORDS.md §1.5` both
   state **120/120/128/128 (≈ 2.36×10⁸)**. The live `slugWords.ts` is
   **128/128/128/128 (≈ 2.68×10⁸)** (§3). The prior specs predate or
   mis-recorded the live adjective/verb counts. **This drift is flagged for W1
   seed-time reconciliation** (recommendation: adopt 128/128 live verbatim, fix
   the counts table + schema to follow). This is the single load-bearing
   correction this lane makes to the existing corpus.
3. **`utility` disposition.** Neither `R-identity-spec §5` nor the original
   `CRUD-CONTRACT §9` carried the `utility` row; it was added by the 2026-05-19
   DECISION.md. This table records it explicitly as a non-target note (it is
   per-repo in-repo code, not a cross-backend shared artefact) so the
   contract/data/library/service counts stay clean: **10 / 1 / 0 / 0**.

`CRUD-CONTRACT §9`'s table is otherwise consistent with this refinement: every
behavioural row is `contract`, the word-list is `data`/precepts, the
rate-limiter is `per-repo`, and the no-shared-framework rejection is pinned by
C9.3.

---

## §6 — Orphan-verdict effect (fourier-mandatory + advisory-both-sides)

**Verified facts.** value.js is at **v0.10.0**; value.js-C is **RETIRED**
(`~/Programming/value.js/docs/tranches/C/FINAL.md`, status RETIRED 2026-05-26);
`~/Programming/value.js/src/palette/` is **ENOENT** and
`~/Programming/value.js/api/src/crud/` is **ENOENT** (both never built). The
convergence is therefore **fourier-mandatory + advisory-both-sides on
cohort-reopen**, per `CRUD-CONTRACT §0 Binding force` and `CRUD-CONSTELLATION`.

**Effect on each disposition — the short answer: the orphan verdict changes
the *binding force*, not the *tier* of any row.**

- **Contract rows (10).** Unchanged in shape. They bind **fourier-side** at
  B.W1 ratification and close empirically at B.W3/W4/W5. The value.js-column
  conformance cells hold at `DEFERRED` (the fifth matrix status). A successor
  tranche that reopens the cohort consumes the same contract text as the
  *latent affordance* and ratifies via the original §10 joint-close-rule. No
  contract row is rewritten, deleted, or down-graded by the orphan verdict —
  the text is the substrate of record.
- **Data row (1).** The slug word-list disposition is **unchanged**: still
  `data`, still `docs/precepts/data/slug-words.json`. The orphan verdict makes
  the *value.js loader* (`api/src/crud/slugs.ts`) a latent affordance rather
  than a built consumer, but **fourier still consumes the same file** at B.W3.
  The precepts submodule is shared substrate independent of value.js's tranche
  state — the file lands for fourier's benefit regardless, and value.js picks
  it up if/when the cohort reopens. The drift-correctness rationale (Test 2)
  weakens *operationally* (there is currently only one live consumer, so there
  is no second copy to drift *from* today), but the disposition stands because
  (i) value.js's `slugWords.ts` is still the live seed and (ii) the cohort-reopen
  affordance requires the shared location to already exist. KISS is unaffected:
  one file, ENOENT today, owed at W3.
- **Library rows (0).** The orphan verdict *retroactively confirms* the
  zero-count. The `Palette`/`colorScale`/`sampleToSVGPath` rows that once read
  `library` in `CRUD-CONTRACT §9` were value.js-*internal* (`src/palette/`),
  never a cross-backend shared package — and they were never built. The
  cross-backend CRUD facility has, and always had, **zero** `library` rows.
- **Service rows (0).** Unaffected. None warranted, none built.

**Net.** The orphan verdict does not move a single row between tiers. It
re-scopes the *enforcement* from "joint cross-repo gate (176 cells PASS)" —
structurally unmeetable now — to "fourier-side mandatory (88 fourier cells) +
value.js advisory (88 cells DEFERRED)." The disposition counts the W1 contract
consumes are **contract = 10, data = 1, library = 0, service = 0**, identical
with or without the orphan verdict.

---

## §7 — Summary for W1 contract authoring

- **Disposition counts: contract = 10, data = 1, library = 0, service = 0.**
- **Slug-words verdict:** admitted to *data* (all three admit-tests pass: ~6.8
  KB ≤ 10 KB, drift-is-correctness, pure JSON); location is the precepts
  submodule `docs/precepts/data/slug-words.json` (form b, ratified over the
  prior `@mkbabb/slug-words` package recommendation on strict-KISS grounds).
- **Does any row need shared CODE?** **No.** Zero rows are `library` and zero
  are `service`. The largest cross-repo duplication (the seven utility helpers)
  is dispositioned `utility` — *per-repo in-repo* modules ≤ 525 LOC, not a
  shared package — which is well below any threshold (the >20% behaviour-
  load-bearing-duplication bar) that would force a tier-3 `library`. Invariant
  16's no-shared-framework / no-codegen / no-coordinating-service rule holds
  intact and is certified in §4.
- **One load-bearing correction the W1 author must apply:** the live word-lists
  are **128/128/128/128**, not the 120/120/128/128 asserted by `SLUG-WORDS.md
  §1.5`, the JSON schema, and the reference loaders. Reconcile at seed time
  (recommend: adopt the live 128/128 verbatim, larger and safer keyspace; fix
  the counts table + schema to follow the data). Asserting 120/120 against
  128/128 live data is a guaranteed C-words.3 conformance failure.
