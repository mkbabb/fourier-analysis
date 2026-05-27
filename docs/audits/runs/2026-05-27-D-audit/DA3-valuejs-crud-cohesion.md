# DA3 — value.js audit + cross-repo palette/visualization CRUD cohesion

**Audit lane**: DA3 (fourier-analysis tranche-D DEVELOPMENT phase, Wave-1 6-agent audit).
**Authored**: 2026-05-27.
**Mode**: READ-ONLY. One deliverable; no source edits, no commits, no writes to `~/Programming/value.js`.
**Subject repos**: `~/Programming/fourier-analysis` (Python/FastAPI; owns `visualization`) AND `~/Programming/value.js` (Node/Hono; owns `palette`, ships the deployed `palette-api`).
**Charter**: "Recap our original palette/visualization CRUD API for both herein and value.js — we must get both repos up to a cohesive spec. Audit value.js, too." KEY FACT: a live `palette-api` service runs on prod (`palette-api-api-1`, `palette-api-backup-1`, healthy ~2 months); value.js's palette backend is DEPLOYED.

**One-line answer**: value.js ships a **mature, idiomatic, deployed palette-CRUD backend** — `palette-api` v2.0.0 (Hono + MongoDB + Zod, ~70 source files), source resident **in-repo at `value.js/api/`** — but it conforms to the fourier-ratified `CRUD-CONTRACT` **at most partially (≈ 3 of 11 sections)**: it shares the slug/session/admin/cron *substrate* and the cursor-pagination + ownership *behaviour*, but it diverges hard on **identity exposure** (`id` is a top-level response field — direct C1.3 violation), **visibility** (4-state `status` enum, no 3-state `visibility`), **soft-delete** (hard-delete-with-cascade, no `deleted_at`/grace/restore), and **every SOTA convention** (no problem+json, no ETag/If-Match, no RateLimit headers, no Idempotency-Key) — all of which fourier *fully implemented*. The cohesion gap is therefore **asymmetric**: fourier conformed; value.js evolved its own idiom independently. The recommended D thread is a **two-sided cohesion tranche** — value.js authors a contract-alignment wave-set (rename `status`→`visibility`+`tier`, add soft-delete, adopt the three SOTA envelopes, hide `id`) gated on user re-mandate; fourier holds the contract stable + consumes the inverted-δ `sampleToSVGPath` lift; the shared artefact is a re-ratified `CRUD-CONTRACT v2.0.0` whose value.js conformance cells flip `DEFERRED → PASS`.

---

## §1 — value.js audit: the palette-api is deployed, in-repo, and idiomatically mature

### Where the `palette-api` lives + its source

| Fact | Value | Source |
|---|---|---|
| Service identity | `palette-api` (the prod containers `palette-api-api-1` / `palette-api-backup-1`) | `value.js/api/package.json:2` (`"name": "palette-api"`) |
| Source home | **In-repo**, `value.js/api/` — NOT a separate repo | `value.js/api/src/**` (~70 `.ts` files); `value.js/api/Dockerfile`, `value.js/api/compose.yaml` |
| Backend version | **2.0.0** (distinct from the library `@mkbabb/value.js` at 0.10.0) | `value.js/api/package.json:3`; `value.js/package.json:4` |
| Stack | Hono ^4.7 + `@hono/node-server` + `mongodb` ^6.12 + `zod` ^4.4 + `node-cron`; Node ≥ 22 | `value.js/api/package.json:13-22` |
| Architecture | `routes/ → services/ → repositories/` 3-layer + `middleware/` + `validation/` (zod) + `errors/` (typed `ApiError`) + DI via `inject-services.ts` | `value.js/api/src/{routes,services,repositories,middleware,validation,errors}/**` |

The backend is a real, deployed three-tier application — not a thin shim. The CRUD entry point is `value.js/api/src/routes/palettes/index.ts:30-36`, mounting 5 concern-routers (`crud`, `versions`, `forks`, `votes`, `flags`) under `/palettes`. This is materially **richer** than fourier's single `visualizations.py` router: value.js has a full content-addressed **version history** (`palette_versions` collection, `paletteVersion.ts` repo), **fork provenance** (`forkOf`/`forkOfHash`/`forkCount`, `forks.ts`), **voting** (`votes.ts`, `voteCount`), **proposed colour names** (`proposed_names`), and an **8-route admin tree** (`routes/admin/{audit,batch,colors,flagged,impersonate,palettes,tags,users}.ts`).

### CRUD surface (the `palette` noun)

Single-document CRUD lives in `value.js/api/src/routes/palettes/crud.ts` → `services/palette/crud.ts` (+ `crud-list.ts` for list/mine):

| Verb + path | Handler | Behaviour | Source |
|---|---|---|---|
| `GET /palettes` | `listPalettes` | cursor **or** offset pagination; sort `newest`/`popular`/`most-forked`; `q` text-search; `status`/`tags`/`userSlug`/OKLab-distance filters | `crud.ts:35-42`; `crud-list.ts:62-176` |
| `GET /palettes/mine` | `listMine` | caller's palettes, offset-paged | `crud.ts:45-57`; `crud-list.ts:189-207` |
| `GET /palettes/:slug` | `getPaletteBySlug` | single read; attaches `voted` | `crud.ts:60-64`; `services/palette/crud.ts:44-61` |
| `POST /palettes` | `createPalette` | session-required; **client supplies `slug`**; inserts palette + initial version in a transaction | `crud.ts:67-83`; `services/palette/crud.ts:73-135` |
| `PATCH /palettes/:slug` | `patchPalette` | owner-gated (`requireOwnership` middleware); content-change → new version record | `crud.ts:98-117`; `services/palette/crud.ts:150-209` |
| `DELETE /palettes/:slug` | `deletePalette` | owner-gated; **HARD-delete with cascade** (palette + votes + flags + parent fork-count) in a transaction | `crud.ts:120-128`; `services/palette/crud.ts:219-248` |

### Identity / visibility / soft-delete model (the persisted shape)

The `Palette` persisted document (`value.js/api/src/models.ts:66-86`):

- **Identity**: `slug` (string `_id`-adjacent handle) + `currentHash` (content-hash for version dedup) + Mongo `_id`. Slug is **client-supplied** in the create body (`validation/palette.ts:41-46`, `createPaletteBody.slug = slugSchema`), validated against `^[a-z0-9][a-z0-9-]*$` ≤ 120 chars (`validation/palette.ts:19-23`). A server-side generator `generateSlug()` exists (`slugWords.ts:84-90`: `adjective-verb-color-animal`, `crypto.randomInt`) but is used for **users**, not palettes.
- **Ownership**: `userSlug: string | null` + a **legacy `sessionToken: string | null` shim** still on the model (`models.ts:73-74`). Ownership enforced by `requireOwnership` middleware reading `palette.userSlug` (`crud.ts:88-95`).
- **Visibility**: a single 4-state **`status` enum** — `["published", "featured", "hidden", "draft"]` (`models.ts:29-30`). There is **no `visibility` field and no `tier` field**; `featured` (admin curation) and `published`/`hidden`/`draft` (user visibility) are **conflated into one column**.
- **Soft-delete**: **none.** `DELETE` is a hard cascade delete (`services/palette/crud.ts:219-248`). There is no `deleted_at` field, no grace window, no restore endpoint, and **no `deleted_at` index** (`db.ts:39-93` declares 9 palette indexes — `slug`, `createdAt`, `voteCount`, `status`, `userSlug`, `tags`, `forkOf`, `forkCount`, text — but no `deleted_at`).

### value.js tranche history (A → H; C RETIRED; I unscoped)

| Tranche | Disposition | Source |
|---|---|---|
| A → H | executed lineage; **H CLOSED at v0.10.0** (`16129e0`) | `value.js/docs/tranches/H/FINAL.md`; tag `v0.10.0` |
| **C** | **RETIRED** 2026-05-26 via the AB+1 retrospective pattern — was the cross-repo CRUD/`Palette` peer to fourier-B | `value.js/docs/tranches/C/FINAL.md` |
| I | **SEEDED but unscoped** — `I-SEED.md` is advisory, declares an OPEN thesis, **no palette/colour item among its 8 pointers or 3 postures** | `value.js/docs/tranches/H/I-SEED.md:6-8` (advisory); cf. CA3 §1 |

The decisive history: value.js-C *planned* the contract alignment (rename `status`→`visibility`+`tier`, add `deleted_at`, ship `api/src/crud/` utility modules per the `CRUD-LIB-TS.md` U4 spec) but **never executed it as such**. Per `value.js/docs/tranches/C/FINAL.md §2 Axis 1`, the D.W2 hardening wave chose a **`service + repository + errors + events + DI + zod`** architecture (20 NEW files / 1502 LoC, commit `626b107`) *instead of* the C-planned `api/src/crud/{slugs,cursors,errors,etag,idempotency,softdelete,pinnedCron}.ts` utility-module shape. The FINAL records this verbatim: "the two architectures are not directly mergeable without a non-trivial mapping exercise; D's vocabulary won by execution." **This is the single deepest cohesion fact**: value.js's backend is contract-*adjacent* by parallel evolution, not contract-*conformant* by adoption.

---

## §2 — Recap of the original palette/visualization CRUD intent

The original B thesis (`fourier-analysis/docs/tranches/B/coordination/CRUD-CONSTELLATION.md:42-51`) was **one identity model across fourier AND value.js** — paired peer tranches (fourier-B ⇄ value.js-C), each authoring its own side, both conforming to one shared `CRUD-CONTRACT.md`. The contract binds *behaviour*, not implementation; fourier owns the `visualization` noun, value.js owns the `palette` noun (`CRUD-CONTRACT.md:3-8`).

The 12 binding sections (`CRUD-CONTRACT.md §1–§12`), with their cross-repo intent:

| § | Clause | Binding intent |
|---|---|---|
| §1 | Identity | exactly one user-facing handle (the slug); content-hash + Mongo `_id` never user-facing; **no `_id` at top level of any response** (C1.3); no hash in any URL (C1.1) |
| §2 | Slug algorithm | `^[a-z]+(-[a-z]+){3}$`, 4 lowercase words, **server-side** cryptographic-RNG generation, insert-then-catch `DuplicateKeyError` retry ≤ 10 (no check-then-insert TOCTOU) |
| §3 | Ownership | required non-null owner; anonymous mutation → 401; cross-owner → 403; admin override logged |
| §4 | Visibility | **3-state `visibility ∈ {draft, unlisted, public}`** + a *separate* admin-only `tier`; anonymous list shows only `public`; draft-to-non-owner → 404 |
| §5 | Soft-delete | `DELETE` writes `deleted_at`; 30-day grace; `POST /{entity}/{slug}/restore`; cron hard-deletes past grace; admin-only grace bypass; slug not released until hard-delete |
| §6 | Sessions | opaque UUIDv4 in `X-Session-Token` (not a cookie); 30-day TTL; timing-safe login |
| §7 | Admin | bearer-token; 8 named idempotent actions; audit row per action; **toggles renamed to explicit setters** (idempotency); flag `(entity,reporter)` unique |
| §8 | Cron/TTL | 6-hour tick; bounded queries only (no unbounded `$nin`); ordered cleanup categories |
| §0/SOTA | envelopes | RFC 9457 problem+json; RFC 9110 ETag/If-Match; RFC 9239 RateLimit headers; Idempotency-Key on POST; RFC 8288 Link pagination |

**The contract is fourier-unilateral today.** It RATIFIED fourier-side at B.W1 (commit `4626d4c`, `CRUD-CONTRACT.md:76-83`); value.js-C sign-off is **DEFERRED** under the orphan verdict (`CRUD-CONSTELLATION.md:176-191`). Binding force (`CRUD-CONTRACT.md:129-145`): **mandatory fourier-side; advisory both-sides on cohort-reopening**. The 88 value.js cross-repo conformance cells in `CONFORMANCE-MATRIX.md` hold at `DEFERRED` (the §10 close-rule's "both columns PASS" gate is structurally unmeetable until value.js re-engages).

**fourier honoured it in full.** Empirically against `fourier-analysis/api/`:
- The converged `visualization` entity exists (`api/models/visualization.py:93-139`): `slug` + `owner_slug` (required non-null) + 3-state `visibility` (`:33`, `Literal["draft","unlisted","public"]`) + `content_hash` (never identity) + soft-delete via `SoftDeleteMixin` (`:93`, `deleted_at`).
- All 6 contract endpoints implemented (`api/routers/visualizations.py:100-375`): create (idempotency + slug-retry + owner-from-session), read (visibility-aware, draft-404-to-non-owner, soft-delete-filtered), list (cursor pagination + `owner=me`), PATCH (If-Match ETag + owner check), DELETE (soft-delete + If-Match), and `POST /{slug}/restore`.
- The `api/lib/crud/` per-language utility module is live and complete (`cursors.py`, `errors.py` [problem+json], `etag.py`, `idempotency.py`, `pinned_cron.py`, `slugs.py`, `softdelete.py`, `slug_words.json`).
- A full conformance suite exists (`api/tests/conformance/test_{identity,ownership,visibility,soft_delete,sessions,admin,etag,idempotency,problem,rate_limit,slug_format,url_shape,pagination}.py`).

---

## §3 — The cohesion gap: clause-by-clause divergence (fourier vs value.js)

Every row cites both repos. Status legend: ALIGNED = both honour; PARTIAL = substrate shared, surface diverges; DIVERGENT = value.js does not honour the contract clause.

| § | Clause | fourier (conforms) | value.js (deployed) | Verdict |
|---|---|---|---|---|
| §1 | **`_id` not at top level (C1.3)** | strips `_id` via `_public_doc` (`visualizations.py:67-69`) | **emits `id: String(_id)` as a top-level field** (`format/palette.ts:59`, `:17`) | **DIVERGENT** — direct contract violation |
| §1 | no hash in URL (C1.1) | slug-only routes (`visualizations.py:172,215,278`) | slug-only routes (`crud.ts:60,98,120`); `currentHash` not in URL | ALIGNED |
| §2 | slug shape `^[a-z]+(-[a-z]+){3}$` | enforced (`lib/crud/slugs.py` `validate_slug`, called `:180,281,320,350`) | **`^[a-z0-9][a-z0-9-]*$` ≤ 120** (`validation/palette.ts:19-23`) — not 4-word-shaped | **DIVERGENT** |
| §2 | server-side slug generation | server generates + retries (`slugs.slug_with_retry`, `visualizations.py:153`) | **client supplies `slug` in POST body** (`validation/palette.ts:45`, `crud.ts:78`); `generateSlug` used for *users* only (`slugWords.ts:84-90`) | **DIVERGENT** |
| §2 | cryptographic RNG; insert-then-catch | `secrets`-class via `lib/crud/slugs.py`; dup-key retry | `crypto.randomInt` (`slugWords.ts:80-82`); `generateUniqueSlug` insert-then-catch retry ≤ 10 (`slugWords.ts:92-99`) — *for users* | PARTIAL (correct mechanism, wrong noun) |
| §3 | required non-null owner | `owner_slug: str` (non-optional) (`visualization.py:103`) | `userSlug: string \| null` + legacy `sessionToken` shim (`models.ts:73-74`) | PARTIAL |
| §3 | anonymous mutation → 401 | `owner_required` 401 on create/patch/delete (`visualizations.py:108,285,324`) | `AuthenticationError` 401 (`crud.ts:69`); owner via `requireOwnership` (`crud.ts:98`) | ALIGNED (behaviour) |
| §3 | cross-owner → 403 | `not_owner` 403 (`visualizations.py:292,331`) | `OwnershipError` 403 (`errors/index.ts:50-54`) | ALIGNED |
| §4 | **3-state `visibility` + separate `tier`** | `Literal["draft","unlisted","public"]` (`visualization.py:33`) + admin `pinned` | **single 4-state `status` `["published","featured","hidden","draft"]`** (`models.ts:29`); user-visibility + admin-curation conflated; **no `unlisted`** | **DIVERGENT** |
| §4 | anon list shows only public | `base_query["visibility"]="public"` (`visualizations.py:240`) | filters by `status` param, not a `public`-only default (`crud-list.ts:85-89`) | **DIVERGENT** |
| §4 | draft → 404 to non-owner | `:193-194` returns 404 | no `draft`-404 semantic (status is a filter, not an access gate) | **DIVERGENT** |
| §5 | **soft-delete + grace + restore** | `softdelete.soft_delete` writes `deleted_at` (`visualizations.py:336`); `POST /{slug}/restore` (`:347`); 30-day grace; cron hard-deletes | **HARD cascade delete** (`services/palette/crud.ts:234-245`); no `deleted_at`, no restore, no grace | **DIVERGENT** |
| §5 | `deleted_at` index | declared (fourier `database.py`) | **absent** — `db.ts:39-93` has no `deleted_at` index | **DIVERGENT** |
| §6 | UUIDv4 in `X-Session-Token` | `:147` (per contract) | `crypto.randomUUID()`; header-based (`middleware/resolve-session.ts`) | ALIGNED |
| §6 | 30-day TTL | 30d | cron sweeps stale at **30d** (`cron.ts:18,26`) — aligned in practice | ALIGNED |
| §7 | admin: explicit setters, not toggles | contract demands setters | **still a toggle** — `feature` flips `featured ⇄ published` (`services/admin/palettes.ts:31-36`) | **DIVERGENT** |
| §7 | flag `(entity,reporter)` unique | per contract | unique index present (`db.ts:83-86`) | ALIGNED |
| §7 | audit row per action | `database.py:88-89` | `emitAuditEvent` (`services/admin/palettes.ts:35`); `admin_audit` collection | ALIGNED |
| §8 | bounded cron, no unbounded `$nin` | `lib/crud/pinned_cron.py` | bounded — orphan votes swept by positive slug list `palettes.listAllSlugs()` (`cron.ts:28-29`), not `$nin` | ALIGNED (per C-FINAL Axis-1 E.W2 discharge) |
| §0 | **RFC 9457 problem+json** | `lib/crud/errors.py` emits `application/problem+json` (`visualizations.py:35,109`) | **`{error:{code,message,detail}}` envelope** (`errors/index.ts:84-121`) — NOT problem+json | **DIVERGENT** |
| §0 | **RFC 9110 ETag/If-Match** | `lib/crud/etag.py`; `If-Match` required on PATCH/DELETE (`visualizations.py:296,334`) | **none** — grep `If-Match\|ETag` in `api/src` → empty | **DIVERGENT** |
| §0 | **RFC 9239 RateLimit headers** | conformance `test_rate_limit.py` | **none** — 429 is bare `{error:"Rate limit exceeded"}` (`rate-limit.ts:75,78`); no `RateLimit-*` headers | **DIVERGENT** |
| §0 | Idempotency-Key on POST | `lib/crud/idempotency.py` (`visualizations.py:164`) | **none** | **DIVERGENT** |
| §0 | RFC 8288 Link pagination | `Link: ...rel="next"` (`visualizations.py:269`) | bare `{data, nextCursor, hasMore}` (`crud-list.ts:169`); no `Link` header | PARTIAL |

**Tally**: of the ~23 testable clause-rows, fourier conforms to **all**; value.js is **ALIGNED on ~8** (no-hash-URL, 401/403 ownership, session shape+TTL, flag-unique, audit-row, bounded-cron), **PARTIAL on ~4** (owner-non-null, slug RNG mechanism, Link), and **DIVERGENT on ~11** (top-level `id`, slug shape, slug server-generation, 3-state visibility + its three list/access semantics, soft-delete + grace + restore + index, admin toggle, problem+json, ETag, RateLimit headers, Idempotency-Key).

### What a cohesive spec across both would look like

A single `CRUD-CONTRACT v2.0.0` both honour, with value.js's divergences closed:

1. **Identity** — value.js stops emitting top-level `id` (rename to nothing, or nest under a non-identity key); keep slug as the only handle. fourier already complies.
2. **Slug** — *the honest reconciliation*: the contract's "server-generated 4-word slug" is a fourier reality but a value.js *break* (value.js palettes are user-named, client-supplied). Two cohesive options: **(a)** the contract relaxes §2 to "server-validated, optionally-user-supplied, unique-within-collection slug" (admitting value.js's named-palette UX as a first-class case) and binds only the *uniqueness + insert-then-catch + shape-floor* rules; or **(b)** value.js moves to server-generated slugs (a UX regression for "name your palette"). **(a) is the KISS, idiomatic-preserving choice** — the contract over-specified §2 to fourier's accident; cohesion does not require value.js to abandon human-named palettes.
3. **Visibility** — value.js splits `status` → `visibility ∈ {draft, unlisted, public}` + `tier ∈ {featured, normal}` (the §11 migration plan already specifies this: `CRUD-CONTRACT.md:1215`). Adds `unlisted`. fourier already complies.
4. **Soft-delete** — value.js adds `deleted_at` + grace + `POST /palettes/:slug/restore` + the `deleted_at` index + the cron grace-sweep. This is the largest single value.js delta. fourier already complies.
5. **SOTA envelopes** — value.js adopts problem+json (replacing `{error:{...}}`), ETag/If-Match on PATCH/DELETE, RateLimit-* headers, Idempotency-Key on POST. Each is a value.js-side `api/src/` utility module (mirroring fourier's `lib/crud/`) — but expressed in **value.js's idiom** (the D.W2 `errors/ + middleware/` shape, not the C-planned `api/src/crud/`). KISS: do not impose fourier's module layout; impose the *behaviour*.
6. **Admin** — value.js renames the `feature` toggle to an idempotent `set_tier` setter (`services/admin/palettes.ts:31-36`).

**Is value.js already aligned?** **Partially — on the substrate, not the surface.** It shares the architectural *shape* (Vue demo + MongoDB API + slug/session/admin/cron) and the *behaviour* of ownership, sessions, cursor pagination, bounded cron, and flag-uniqueness. It diverges on every contract clause that fourier-B *added* as a SOTA hardening (problem+json, ETag, RateLimit, Idempotency) and on the three identity/lifecycle clauses (top-level `id`, visibility-model, soft-delete). The gap is real and roughly half the contract.

---

## §4 — The inverted δ edge (COLOUR-LIFT.md) + the value.js-side tranche shape

`fourier-analysis/docs/tranches/C/coordination/COLOUR-LIFT.md` records the colour-domain lift, resolved much narrower than the original B framing:

- **Original B edge (severed)**: `fourier-B.W4 → value.js-C.W1 published` — fourier was to *consume* a value.js library `Palette`/`colorScale`/`sampleToSVGPath` publish that never came (value.js-C RETIRED) (`COLOUR-LIFT.md:19`).
- **Inverted C/D edge (latent, conditional)**: `value.js-<tranche>.Wx (publishes sampleToSVGPath) → fourier consumes` — value.js *authors*, fourier *consumes* (`COLOUR-LIFT.md:20,26`). The CA4 KISS verdict (`CA4-colour-domain-lift.md §1,§5`) found `web/src/lib/colors.ts` carries **0 domain symbols** (brand tokens + DOM glue) and the **only** genuine lift is `easings.ts`'s `generateCurveSVGPath(fn, n)` → value.js `sampleToSVGPath(fn, n)` in `src/math.ts`, generalising the existing `cubicBezierToSVG` (`value.js/src/math.ts:69`). `Palette`/`colorScale` are **held latent** — "library nobody calls" until a fourier gradient/scale consumer exists.

**Note**: the inverted δ edge is a **library** (`@mkbabb/value.js` at 0.10.0) concern, *orthogonal* to the **palette-api** (v2.0.0) CRUD cohesion this lane audits. They are two distinct value.js surfaces: the npm-published colour library vs the in-repo deployed backend. The δ edge touches `value.js/src/`; the CRUD cohesion touches `value.js/api/src/`. A cohesion D-tranche should keep them as **separate threads** (do not entangle the one-function colour lift with the multi-clause backend alignment).

**Recommended value.js-side tranche shape to reach cohesion** (a forward-themed value.js-I, or a dedicated letter, gated on user re-mandate — value.js-I-SEED carries no palette item, so this cannot side-fold into I as authored: `CA3 §1`, `COLOUR-LIFT.md:24`):

| Wave | Headline | Scope | Repo touched |
|---|---|---|---|
| **I.W0** | open + 6-agent audit + **cohort-reopen ratification** | adopt the fourier-ratified `CRUD-CONTRACT` as the latent affordance (consume, don't re-research); ratify the contract *relaxations* (§2 slug; §0 module-idiom) so value.js's idiom is preserved | docs only |
| **I.W1** | identity + visibility model | `status` → `visibility {draft,unlisted,public}` + `tier {featured,normal}` split (migration per `CRUD-CONTRACT.md:1215`); stop emitting top-level `id` (`format/palette.ts:59`); add `unlisted` semantics | `api/src/{models,format,validation,routes/admin/palettes}.ts`, migration |
| **I.W2** | soft-delete | add `deleted_at` + grace + `POST /palettes/:slug/restore`; `deleted_at` index (`db.ts`); cron grace-sweep (`cron.ts`); convert hard-cascade-delete to soft + admin-grace-bypass | `api/src/{models,services/palette/crud,cron,db}.ts` |
| **I.W3** | SOTA envelopes (value.js idiom) | problem+json (replace `errors/index.ts` envelope), ETag/If-Match middleware, RateLimit-* headers (`rate-limit.ts`), Idempotency-Key — each as an `api/src/middleware/` or `errors/` module in **D.W2's vocabulary**, NOT the C-planned `api/src/crud/` layout | `api/src/{errors,middleware}/**` |
| **I.W4** | conformance + publish | author `api/test/conformance/**` mirroring fourier's; flip the 88 DEFERRED cells → PASS; (separately, if mandated: the δ `sampleToSVGPath` library publish) | `api/test/**`, `CONFORMANCE-MATRIX.md` |
| **I.W5** | close + cohort-discharge | re-ratify `CRUD-CONTRACT v2.0.0`; flip `CRUD-CONSTELLATION` orphan row → DISCHARGED-JOINTLY | docs |

W1/W2/W3 are largely file-disjoint and parallelisable. The δ colour lift (`src/math.ts`) is fully disjoint from all of them and can ride W4 or any value.js tranche touching `src/math.ts`.

---

## §5 — Recommended D thread(s) for cross-repo cohesion

The cohesion is **achievable but asymmetric**: fourier has done its half; value.js has half a tranche of contract-alignment work plus the one-function colour lift. The decision is **user-shaped** — exactly the C-FINAL re-mandate predicate (`value.js/docs/tranches/C/FINAL.md §2 Axis 3`). Recommended thread structure:

### Thread structure (both sides)

| Thread | fourier does | value.js does | Shared artefact |
|---|---|---|---|
| **Thread γ — CRUD-CONTRACT cohesion (the core)** | **Hold the contract stable.** fourier already conforms — no fourier *code* change. fourier *re-authors* `CRUD-CONTRACT v2.0.0` with the two KISS relaxations (§2 user-supplied-slug admit; §0 idiom-not-layout) so value.js's idiom is honoured. Updates `CONFORMANCE-MATRIX` value.js cells from DEFERRED. | **The bulk of the work.** value.js authors I.W1–W4 (§3 above): visibility split, soft-delete, SOTA envelopes, hide `id`, admin setter, conformance suite. | `CRUD-CONTRACT v2.0.0` (re-ratified jointly); `CONFORMANCE-MATRIX` flips value.js DEFERRED → PASS; `CRUD-CONSTELLATION` orphan row → DISCHARGED-JOINTLY |
| **Thread δ — colour lift (the inverted edge)** | consume `sampleToSVGPath` on the next `@mkbabb/value.js` bump; `easings.ts` internal sampler collapses onto it; keep `colors.ts`/easing-presets in fourier (invariant 15) | publish `sampleToSVGPath(fn, n)` in `src/math.ts` (generalise `cubicBezierToSVG`) + vitest + a patch release | published `@mkbabb/value.js` version pin in `fourier/web/package.json` |

### Critical design notes

1. **The contract was over-fit to fourier's accidents.** §2 ("server-generated 4-word slug") encodes fourier's `coolname` heritage, but value.js's palettes are deliberately *user-named* (the create body carries `slug`). Cohesion should **relax §2** to "unique, shape-floored, insert-then-catch-protected slug; server-generated OR server-validated-user-supplied" — not force value.js to abandon human-named palettes. This is the **idiomatic / gestalt** precept in action: cohesion is a *contract*, not a *framework*; value.js keeps its idiom.

2. **Do NOT impose fourier's `api/lib/crud/` module layout on value.js.** value.js's D.W2 architecture (`service + repository + errors + events + DI`, commit `626b107`) won by execution and is idiomatic Hono/TS. The C-planned `api/src/crud/` 8-file shape is dead (`C/FINAL.md §2 Axis-1` row: "ORPHANED-BY-PARALLEL-EVOLUTION"). The contract binds **behaviour** (problem+json *shape*, ETag *semantics*, RateLimit *headers*), not module geometry. KISS: no shared framework, no codegen — `CRUD-CONTRACT.md §9` already certifies this (adversarially, at `audit/challenge.md §1` P1, 0% shared code).

3. **The cross-repo reference is LIVE, not hypothetical.** fourier's `visualization.palette_slug: str | None` (`api/models/visualization.py:119,163,177`; web `lib/api.ts:41,65,73`; ETag field list `lib/crud/etag.py:14`) is a **dangling FK into value.js's palette noun**. A visualization can reference a palette by slug. This is the concrete reason cohesion matters: the two nouns are *already linked by slug* in fourier's schema — the contract's "one identity model" is not academic, it is how a fourier visualization points at a value.js palette. (Today the reference is unvalidated string; a cohesion tranche could optionally make it resolvable.)

4. **The two value.js surfaces are distinct.** `palette-api` (v2.0.0, `api/`, deployed) ≠ `@mkbabb/value.js` (0.10.0, `src/`, npm). Thread γ touches the backend; thread δ touches the library. Keep them unentangled.

5. **CANONICAL-ORDERING is stale and needs a new ordering γ** (per CA3 §5): the original α/β contingency resolved to β-orphan. A reopened cohort needs `value.js-I (CRUD cohesion + optional colour lift)` ⇄ `fourier-D (holds contract, consumes δ)`. The fourier-D coordination doc should supersede the historical `CRUD-CONSTELLATION.md`.

### Net recommendation

**A two-sided cohesion tranche, value.js-heavy, user-gated.** fourier's side is light (re-author the contract to v2.0.0 with two KISS relaxations; consume the δ lift; flip matrix cells) because fourier already conformed. value.js's side is a real ~4-wave tranche (visibility split + soft-delete + SOTA envelopes + conformance) because it evolved its idiomatic backend independently of the contract. The shared artefact is `CRUD-CONTRACT v2.0.0` re-ratified jointly, with value.js's 88 DEFERRED conformance cells flipping to PASS. If the user declines the re-mandate, fourier-D holds the contract as the standing latent affordance (unchanged), value.js's palette-api stays divergent-but-deployed, and the only cross-repo deliverable is the optional thread-δ one-function colour lift.

---

## §6 — Authority and provenance

- **value.js palette-api**: `value.js/api/package.json` (name `palette-api`, v2.0.0); source `value.js/api/src/{models,routes/palettes/*,services/palette/*,validation/palette,errors/index,middleware/rate-limit,cron,db,format/palette,slugWords}.ts`; deploy `value.js/api/{Dockerfile,compose.yaml}`.
- **value.js tranche history**: `value.js/docs/tranches/C/FINAL.md` (RETIRED, AB+1; the D.W2 `626b107` parallel-evolution fact); `value.js/docs/tranches/H/FINAL.md` (H close, v0.10.0); `value.js/docs/tranches/H/I-SEED.md` (I unscoped, no palette item).
- **fourier contract + entity**: `fourier-analysis/docs/tranches/B/coordination/{CRUD-CONTRACT.md (`4626d4c`), CRUD-CONSTELLATION.md, SCHEMA.md, CONFORMANCE-MATRIX.md}`; `api/models/visualization.py`; `api/routers/visualizations.py`; `api/lib/crud/**`; `api/tests/conformance/**`.
- **colour lift**: `fourier-analysis/docs/tranches/C/coordination/COLOUR-LIFT.md`; `value.js/src/math.ts:69` (`cubicBezierToSVG`).
- **live cross-repo FK**: `fourier-analysis/api/models/visualization.py:119` (`palette_slug`); `web/src/lib/api.ts:41,65,73`.
- **prior-art mirrored**: `docs/audits/runs/2026-05-27-C-audit/{CA3-valuejs-state-cohort-reopen.md, CA4-colour-domain-lift.md}`.
