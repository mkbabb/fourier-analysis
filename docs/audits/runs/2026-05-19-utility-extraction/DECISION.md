# DECISION — Invariant 16 revised: three-tier disposition

**Tranche**: B (fourier-analysis) ⇄ C (value.js).
**Authoring date**: 2026-05-19.
**Status**: load-bearing; supersedes the prior "shared by contract before shared by code" wording of cohort invariant 16.
**Authors**: U1 (this document) under the U2/U3/U4 utility-extraction sub-cohort.
**Affected documents**:
- `docs/tranches/B/B.md §2` (invariant 16 wording)
- `docs/tranches/B/coordination/CRUD-CONTRACT.md §0` (KISS rejections list)
- `docs/tranches/B/coordination/CRUD-CONTRACT.md §9` (shared-data-vs-code disposition table)
- `~/Programming/value.js/docs/tranches/C/C.md §2` (mirror of cohort invariant 16)

---

## §1 — Context

### 1a. The question the user posed

The user's brief — heretofore the load-bearing sentence of the entire CRUD cohort — asked for "a shared optimum for CRUD of visualizations herein, and CRUD of palettes/colors thereof — these services should scale with no contrivance, no overengineering, no superfluous-cloud systems. KISS." The naive reading was rejected immediately (a Python and a Node backend cannot share runtime code without a third service or a codegen step); the contract-first reading was adopted as cohort invariant 16.

### 1b. The prior position

Tranche B opened with invariant 16 phrased as a single binary disposition:

> **Shared by contract before shared by code** — convergence across a Python and a Node backend is a written contract and shared conventions. Shared runtime *code* is extracted only for language-agnostic data (the slug word-list) and only where KISS demonstrably warrants it. A shared CRUD framework, a code-generation step, or a third coordinating service is overengineering and is rejected by invariant.

The shape of this rule conflated three architecturally distinct things into one rejection:

1. **Shared data** (word-lists, schema, error catalog) — language-agnostic JSON.
2. **Per-language utility modules** (slug generation, cursor encode/decode, ETag middleware, Idempotency-Key middleware, soft-delete helpers, pinned-cron pattern) — small, cross-cutting, framework-free code.
3. **Shared frameworks** (BaseCRUDRouter, CRUDMixin, lifecycle inversion, codegen across languages, third coordinating service) — control-inverting, ossifying machinery.

The prior wording admitted (1), prohibited (3), and was silent on (2). The CRUD-CONTRACT §0 KISS-rejections list operationalised the silence as **rejection of all shared code that was not "language-agnostic data"** — i.e. it implicitly prohibited (2) along with (3). That conflation is what this decision revises.

### 1c. Why now

Audit evidence at the W1 close threshold shows that the cross-cutting utility code (tier 2 above) **is duplicating *and* drifting** in both repos. The drift is not theoretical — it is producing live correctness divergences:

- **H3 batch-shape divergence** (`docs/audits/runs/2026-05-18-tranche-harden/h3-A-W4-W5-W6.md §3` claim row "No frontend caller of the batch endpoints"). The fourier batch endpoint returns `{ok: true, affected: <int>}` (`api/routers/admin.py:397,451`); the frontend type declares `{processed: number}` (`web/src/lib/types.ts`). The CRUD-CONTRACT §7 binding batch return shape (`{processed: <int>, errors: [...]}`) was authored without enforcing that any single piece of code produces it, so each repo realised a different shape and neither matched the contract.
- **R-identity TOCTOU on fourier `images` vs clean duplicate-key catch on value.js** (`docs/tranches/B/research/R-identity-spec.md §1c` headline 5; `docs/audits/runs/2026-05-18-fourier-tranche/e-crud-slug-valuejs.md §2`). fourier's `image_storage.py:75-77` pre-checks `find_one` then inserts (TOCTOU race); value.js's `slugWords.ts:92-99` does the same (also TOCTOU); the contract specifies "rely on the unique index + `DuplicateKeyError` catch" but two independent implementations of the same retry loop must be authored and maintained, and either may drift from the contract.
- **Janitor `$nin` pattern** (`h3` W4-1, `e-crud-slug-valuejs.md §5`). fourier's janitor builds an unbounded pinned-id `set` and passes it as `{"$nin": [...]}` — past 16 MB BSON limit, defeats indexes. value.js's `cron.ts:19-24` has the same pattern, smaller scale. The contract §8 specifies "Option A: `pinned: bool` flag on the child doc" — but each repo must implement the inversion separately.

The contract-only approach left these as **two-place fixes**, each authored independently, each tested independently, each at risk of further drift. The audit corpus has caught the divergences this time; nothing in the cohort's structure prevents the *next* such divergence from shipping silently.

The opposite extreme — a shared CRUD framework — was rejected for sound reasons (control inversion, codegen ossifies legitimate per-repo divergences like fourier's contour storage and value.js's palette versioning). But the rejection went too far: it conflated *frameworks* with *all shared code*, which left tier 2 utility modules un-categorised and therefore implicitly forbidden.

The honest middle position — **small, in-repo utility modules with strict scope limits, no framework patterns, no control inversion, extraction to standalone packages deferred until a third consumer materialises** — is what invariant 16 should actually say. This decision authors that revision.

---

## §2 — Decision

Invariant 16 is revised from a binary (contract / framework) disposition to a **three-tier disposition**:

### Tier 1 — Shared data

**Admit.** Word-lists, schema definitions, error catalog, any language-agnostic JSON/YAML/TSV asset. **Single source of truth in the precepts submodule** at `docs/precepts/data/` (admitted form (b) per `R-identity-spec.md §5c`); standalone package extraction (form (a) `@mkbabb/slug-words` npm + PyPI mirror) is the *future* form when a publishing cadence is warranted.

Admit-rule (per R3, `R-identity-spec.md §5a`): size ≤ 10 KB; drift between consumers is a correctness bug (not a stylistic preference); language-agnostic JSON/YAML/TSV loadable from Python and Node without a parser beyond the stdlib.

The slug word-list (`adjective-verb-color-animal`, 120/120/128/128 entries, ~6 KB JSON) is the canonical tier-1 instance. R3-disposed; U2 authors the precepts file.

### Tier 2 — Per-language utility modules

**Admit, with strict scope limit.** Cross-cutting concerns that genuinely duplicate across the cohort — concerns the audit corpus has now demonstrated are duplicating *and drifting* — are extracted into small per-language utility modules.

The admit criteria, all of which must hold:

1. **Cross-cutting concern.** The concern appears in ≥2 places within a single repo *or* in both repos. Single-use code does not graduate to a utility module.
2. **Framework-free.** No `BaseCRUDRouter`, no `CRUDMixin`, no lifecycle inversion (the utility is *called by* router code; it does not *call* router code or own request lifecycle). No "register your entity" pattern. No reflection over Pydantic/Zod schemas to synthesise behaviour. The utility is a function or a small class with a verb, not a noun-shaped framework.
3. **Size cap.** ≤ 500 LOC per repo total for the entire utility module bundle. Beyond that ceiling the cohort re-examines whether the abstraction is honest.
4. **In-repo first.** Lives at `api/lib/crud/` for fourier and `api/src/crud/` for value.js. Not a separate package, not a separate repo, not a workspace dependency.
5. **Standalone-package extraction deferred until a third consumer materialises.** Two consumers (fourier + value.js) is *not yet* extraction-warranted; the precept "extract to a package when a third consumer materialises" governs.

The named tier-2 utilities for B.W1 / value.js-C.W0 are:

| Utility | Concern | Both repos? | Size estimate |
|---|---|---|---|
| **Slug generator** | `^[a-z]+(-[a-z]+){3}$` 4-word slug, structured `adjective-verb-color-animal`, `crypto.randomInt`/`secrets.choice`, insert-then-catch with 10-retry ceiling | yes | ~30 LOC/repo |
| **Cursor encode/decode** | base64url opaque cursor over the sort-key tuple (CRUD-CONTRACT §0 SOTA convention 1) | yes | ~40 LOC/repo |
| **Problem+json envelope** | RFC 9457 error response shape (CRUD-CONTRACT §0 SOTA convention 3) | yes | ~50 LOC/repo |
| **ETag middleware** | `W/"<content_hash>-<version_count>"` + `If-Match` (CRUD-CONTRACT §0 SOTA convention 2) | yes | ~60 LOC/repo |
| **Idempotency-Key middleware** | 24-hour replay map of `(idempotency_key, user_slug) → response_body, status` (CRUD-CONTRACT §0 SOTA convention 4) | yes | ~80 LOC/repo |
| **Soft-delete helpers** | `mark_deleted`, `restore`, list-filter helper (`deleted_at == null`) (CRUD-CONTRACT §5) | yes | ~40 LOC/repo |
| **Pinned-cron pattern** | bounded-query cron with `pinned: bool` flag inversion (CRUD-CONTRACT §8, H3 W4-1) | yes | ~60 LOC/repo |

Total estimated: ~360 LOC/repo — comfortably under the 500-LOC ceiling.

U3 authors the fourier-side spec (`api/lib/crud/`); U4 authors the value.js-side spec (`api/src/crud/`).

### Tier 3 — Frameworks

**Continue to reject.** `BaseCRUDRouter`, `CRUDMixin`, lifecycle inversion, codegen across languages (OpenAPI → client SDK; a `crud-types` shared package compiled to both Python and TS), a third coordinating service (Redis for rate-limit state, NATS for cron fanout, etc.). These are the rot pattern that invariant 16 was always aimed at; that aim is preserved verbatim.

The structural diagnostic: any pattern that **inverts control** (the framework calls the application instead of the application calling the framework) or **ossifies legitimate divergence** (palette versioning, visualization contour storage, fourier's image-blob storage) is a tier-3 framework and remains prohibited.

The CRUD-CONTRACT §9 conformance assertion **C9.3** stays binding: `grep -rE "from .* import shared_crud|require\(.*shared-crud" {fourier,value.js}` returns zero; `docker-compose.{yml,prod.yml}` and value.js's `Caddyfile` contain no third coordinating service. The grep is amended to *also* permit `api/lib/crud/` / `api/src/crud/` (tier-2 in-repo utility modules) — the assertion now reads "no *shared* CRUD framework", not "no CRUD-adjacent code anywhere".

---

## §3 — Rationale

### 3a. Why the binary disposition was wrong

The prior wording forced every CRUD-adjacent concern into one of two buckets: "contract" (text, no code) or "framework" (a shared package, rejected). The audit corpus shows this taxonomy is incomplete: the tier-2 concerns above are *neither* pure contract (they have ~30-80 LOC of executable logic each) *nor* frameworks (no control inversion, no codegen, no third service). They are utility code that happens to be cross-cutting.

Forcing them into "contract" leaves the logic to be re-authored per repo, where it duplicates and drifts (the H3 batch-shape divergence, the duplicate TOCTOU pre-check loops, the duplicate janitor `$nin` pattern — all three are tier-2 concerns that the binary disposition treated as contract-only).

Forcing them into "framework" would invert control, ossify per-repo divergence, and trigger the very rot the invariant exists to prevent.

The honest answer is a third tier: in-repo utility modules with strict admit criteria, extracted to standalone packages only when a third consumer materialises.

### 3b. Why "in-repo first, extract on third consumer"

The CRUD cohort has exactly two consumers today (fourier and value.js). The cost of a standalone package — a new npm + PyPI publication pipeline, version coordination across two consuming repos, a third repo to maintain — is disproportionate at two consumers. The benefit (single source of truth) is available *in-principle* but the per-consumer overhead (one extra dependency, one extra version bump per change) is non-trivial.

At three consumers the calculus inverts: the per-consumer overhead is amortised across three places, and the cost of *not* extracting (three-place drift) exceeds the cost of extracting. The precept "extract on third consumer" is the standard XP/Refactoring guidance ("rule of three") applied to cross-repo utilities.

Concretely: B.W3 (fourier) and value.js-C.W0/W2 (value.js) implement the tier-2 utilities **in-repo** at `api/lib/crud/` and `api/src/crud/` respectively. If a third backend (e.g. a future admin-tools service, or a third demo) ever needs the same utilities, the extraction-to-package work becomes a justified tranche. Until then, the in-repo form is honest.

### 3c. Why the slug facility specifically rolls its own

The audit search (heretofore implicit, recorded here for posterity) confirmed: **no existing library matches the contract's exact 4-word `adjective-verb-color-animal` pattern.**

- `coolname` (CPython) — 2-or-4-word slugs from mixed dictionaries; category sequence not contract-pinnable; uses Mersenne Twister (not cryptographic). fourier uses this today; it is what the contract retires.
- `unique-names-generator` (npm) — configurable, but the configuration is per-import; pinning the cohort to one config requires either monkey-patching or wrapping anyway.
- `human-id` (npm) — 3-word phrases by default; non-cryptographic RNG.
- `python-petname` — animal-adjective; 2-word default; non-cryptographic.

The generator code is ~10-20 LOC per language; the load-bearing asset is the **word-list** (~6 KB JSON, tier-1 shared data). Rolling our own generator that reads from the shared word-list is honest; pulling in a library and then wrapping it to fit the contract's pattern would add a dependency with no leverage.

### 3d. Why frameworks remain rejected verbatim

The rejections list in CRUD-CONTRACT §0 names six framework-class anti-patterns: HATEOAS, JSON:API envelope, GraphQL, webhooks/event-sourcing/CQRS, codegen, third coordinating service. Each was rejected on KISS / invariant 12 grounds; none of those rejections is reconsidered by this decision.

The Wχ probe P1 ("is the contract a framework in disguise?") classifies every contract section as spec/data/code and rejects invariant 16 if >20% need code. Under the revised invariant 16, that probe is sharpened: it classifies as spec/data/utility-code/framework-code, and rejects only if >20% need *framework* code. The tier-2 utility code count does not trigger the rejection; tier-3 framework code does.

---

## §4 — Consequences

### 4a. What changes in B (fourier-analysis)

- **B.md §2 invariant 16** revised from "Shared by contract before shared by code" to "Shared by contract; per-language utility modules admitted; frameworks rejected" (see §6 for exact wording).
- **CRUD-CONTRACT.md §0** KISS-rejections list: the implicit blanket "shared code" rejection is replaced with an explicit "shared *frameworks*" rejection; the tier-2 utility-module admission is cross-referenced to §9.
- **CRUD-CONTRACT.md §9** disposition table gains a `library` (per-language in-repo utility) row with the admit criteria and references to U2/U3/U4 specs.
- **B.W3** (fourier `visualization` entity + migration) ships `api/lib/crud/` alongside the new collection: slug generator, cursor encode/decode, problem+json envelope, ETag middleware, Idempotency-Key middleware, soft-delete helpers, pinned-cron pattern. The seven utilities are implemented as named units within W3's existing scope; no new wave is required.
- **B.W4** (fourier convergence wiring) consumes the W3 utilities; no new utility code is authored.
- The conformance assertion C9.3 grep is amended to permit `api/lib/crud/` (see §2 tier 3).

### 4b. What changes in C (value.js)

- **C.md §2** mirrors the B.md invariant 16 revision verbatim.
- **value.js-C.W2** (palette-api alignment to contract; schema migration) ships `api/src/crud/` with the same seven utilities, in TypeScript. No new wave required.
- value.js-C.W2's existing scope (`formatPalette` fallback retire; cron `$nin` inversion; `migrate-palette-schema.ts`) becomes a *consumer* of the new utilities rather than a re-implementation: e.g. `cron.ts:24` `$nin` inversion uses `api/src/crud/pinned-cron.ts`; the slug generation at `slugWords.ts:84-99` uses `api/src/crud/slug.ts`; the duplicate-key catch in palette creation uses `api/src/crud/slug.ts:insertWithUniqueSlug`.

### 4c. What does not change

- **The contract document remains binding text.** The behaviour every conformance assertion tests is still specified in CRUD-CONTRACT.md §1-§9; the utility modules are *implementations* of contract-specified behaviour, not new behaviour.
- **The seven SOTA conventions in §0 stay verbatim.** Cursor pagination, ETag/If-Match, problem+json, Idempotency-Key, Link header, RateLimit headers, `/{entity}/{slug}` URL shape — every convention's contract-binding text is unchanged; only the *realisation* moves from per-router-handler open-coded logic to per-utility-module code.
- **Tier-3 frameworks remain rejected.** The six anti-patterns named in §0 stay rejected; the Wχ P1 probe stays binding.
- **The contract ratification gate stays.** B.W1 cannot close while any §1-§9 section lacks a §10 row; the tier-2 utility modules are realised in B.W3 / value.js-C.W2, not in B.W1; W1 ratifies the *text* of the contract (including the revised §0 and §9) and the wave-table that names W3 / C.W2 as the realisation wave.
- **Per-repo divergence remains admitted.** Palette versioning (value.js's `palette_versions` collection), visualization contour storage (fourier's `contour_hash` substrate), fourier's image-blob storage (deferred to tranche C) — none of these are absorbed into utility modules; they remain per-repo by design, and the utility modules are scoped to genuinely-duplicating concerns only.

---

## §5 — Alternatives considered and rejected

### 5a. Alternative A: Pure-contract (the prior position)

**Description.** Keep invariant 16 as-written ("shared by contract before shared by code"); all CRUD-adjacent logic stays open-coded in each router; only language-agnostic data is shared.

**Rejected because.** The audit corpus demonstrates this position produces drift in practice: H3 batch-shape divergence, R-identity TOCTOU divergence, janitor `$nin` duplication. The contract caught these *this time*; nothing in the structure prevents the next divergence. Pure-contract is honest about the cost of two implementations (paying it) but dishonest about the cost of drift (ignoring it).

### 5b. Alternative B: Per-language packages now

**Description.** Extract the seven utilities to standalone packages immediately — `@mkbabb/crud-py` on PyPI, `@mkbabb/crud-ts` on npm — published from a new repo, consumed by both fourier and value.js.

**Rejected because.** Two consumers does not justify the extraction overhead (a third repo, two publishing pipelines, version coordination on every change). The "rule of three" governs: extract when the cost of *not* extracting (drift across three consumers) exceeds the cost of extracting (per-consumer dependency overhead). At two consumers, in-repo utility modules are honest; package extraction is premature.

The form is reserved for the third-consumer future: when a third backend joins the cohort, B-or-C-successor tranche extracts to packages with no semantic change.

### 5c. Alternative C: A third coordinating service

**Description.** A shared HTTP/gRPC service that owns the CRUD primitives — slug allocation, idempotency replay map, soft-delete state machine — and the per-repo backends call into it.

**Rejected because.** This is the textbook tier-3 framework pattern: control inversion (the service owns lifecycle), superfluous cloud (an extra deployment unit), and ossification (legitimate per-repo divergence like palette versioning becomes a contract negotiation with the central service). Invariant 12 (no superfluous-cloud) rejects this verbatim; invariant 16's framework prohibition rejects it again. **Stays rejected.**

### 5d. Alternative D: BaseCRUDRouter / CRUDMixin (per-language framework)

**Description.** A framework class within each repo that subclasses to produce a CRUD router — `class VisualizationRouter(BaseCRUDRouter[Visualization])` for fourier; `class PaletteRouter extends CRUDRouter<Palette>` for value.js.

**Rejected because.** Control inversion: the framework owns the request lifecycle and the application registers entities into it. This is the rot pattern invariant 16 was always aimed at: it ossifies per-repo divergence (palette versioning would have to be a framework hook; fourier's image-blob would have to be a framework hook), it inverts the call graph (debugging traces flow through framework internals), and it makes the application's behaviour a function of the framework's hooks rather than the application's code. **Stays rejected.**

The tier-2 utility modules are *functions* (or small classes with verbs) that the application calls; they are not subclassed, not registered with, not inverted.

### 5e. Alternative E: Codegen across languages

**Description.** A schema-first source of truth (OpenAPI, Protobuf, or a custom DSL) compiled to both Python and TypeScript router code, generating CRUD endpoints from declarations.

**Rejected because.** Three independent reasons. (1) Codegen adds a build step and a generated-code review burden; the cohort precept prefers hand-written code with shared *contract* tests over generated code with shared *schema*. (2) Codegen ossifies the schema as a versioning surface: schema changes require coordinated regeneration in two repos, which is slower than the current text-contract amendment process. (3) The seven utilities are small enough (~30-80 LOC each) that hand-rolling is cheaper than the codegen machinery would be; the codegen pays for itself only at much larger surfaces. **Stays rejected.**

### 5f. The load-bearing rejection reason

Across alternatives C/D/E, the load-bearing rejection is **control inversion**. A framework, a coordinating service, or a codegen pipeline all share the property that the shared layer *calls* the application instead of being *called by* it. Control inversion is the structural marker of the rot pattern invariant 16 forbids: it ossifies divergence, it ties debugging traces through framework internals, and it makes the application's behaviour a function of the framework's hooks rather than the application's code.

The tier-2 utility modules pass the inverse test: they are *called by* the application. The application owns the router, the request lifecycle, the response shape, the error handling; the utility provides a function with a verb (`generate_slug`, `encode_cursor`, `to_problem_json`, `assert_if_match`, `check_idempotency_key`, `mark_deleted`, `prune_pinned`) that the application invokes when it wants. No control inversion; no rot.

---

## §6 — The revised invariant 16 (canonical wording)

For mechanical insertion into B.md §2 and (mirror) C.md §2:

> 16. **Shared by contract; per-language utility modules admitted; frameworks rejected.** Convergence across a Python and a Node backend is a *written contract* (CRUD-CONTRACT.md), shared *language-agnostic data* (the slug word-list at `docs/precepts/data/slug-words.json`), and *per-language utility modules* (`api/lib/crud/` for fourier, `api/src/crud/` for value.js) that realise the contract's cross-cutting concerns (slug generation, cursor encoding, problem+json, ETag, Idempotency-Key, soft-delete helpers, pinned-cron pattern). Utility modules are framework-free (no control inversion, no codegen, no lifecycle ownership), size-capped (≤ 500 LOC per repo), and in-repo first (standalone-package extraction is deferred until a third consumer materialises). A shared CRUD *framework* (BaseCRUDRouter, CRUDMixin, lifecycle inversion), a codegen step across languages, or a third coordinating service is overengineering and is rejected by invariant. See `coordination/CRUD-CONTRACT.md §9` for the per-target disposition table.

---

## §7 — Open items

None blocking. The U2/U3/U4 specs (slug-words data file; fourier `api/lib/crud/` shape; value.js `api/src/crud/` shape) author the realisations; this document authors the disposition that admits them.

The Wχ P1 framework-in-disguise probe is sharpened (per §3d): classify as spec/data/utility-code/framework-code, reject only on framework-code; the sharpening is recorded in the Wχ artefact's probe-refinement section, not here.

---

## §8 — Citations

- `docs/tranches/B/B.md §2` (invariant 16, pre-revision wording)
- `docs/tranches/B/coordination/CRUD-CONTRACT.md §0, §9` (KISS rejections list; shared-data-vs-code disposition table)
- `docs/tranches/B/research/R-identity-spec.md §1c, §3d, §5c` (TOCTOU finding; collision handling; word-list disposition forms)
- `docs/audits/runs/2026-05-18-fourier-tranche/e-crud-slug-valuejs.md §2, §5` (slug-audit duplication; janitor `$nin`)
- `docs/audits/runs/2026-05-18-tranche-harden/h3-A-W4-W5-W6.md §1 W4-1, §3` (janitor `$nin` divergence; batch-shape contract bug)
- `~/Programming/value.js/docs/tranches/C/C.md §2` (cohort invariants 14-17 mirror)
- `~/Programming/value.js/api/src/slugWords.ts:84-99` (value.js side TOCTOU pre-check loop)
- `~/Programming/value.js/api/src/cron.ts:19-24` (value.js side `$nin` pattern)
