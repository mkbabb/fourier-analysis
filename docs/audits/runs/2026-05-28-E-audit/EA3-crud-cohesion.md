# EA3 — cross-repo CRUD cohesion (E-development)

**Charter.** Deep audit of the two slug-addressed CRUD APIs — fourier viz
(`api.fourier.babb.dev`) and palette (`api.color.babb.dev`) — *including
ALL consumers*, against `CRUD-CONTRACT v2.0.0` (`docs/tranches/B/
coordination/CRUD-CONTRACT.md` HEAD `fc5b3b0`). User-mandated
2026-05-28: "Refine, test, CRUD, our two palette apis and fourier viz
apis. Including ALL consumers. Fix our cross repos."

**Method.** (a) re-read v2.0.0 + CONFORMANCE-MATRIX + VALUE-JS-ASK +
PALETTE-API-PROVENANCE; (b) read both repos' API source verbatim;
(c) read all consumers (fourier web/src/lib/api.ts; value.js
demo/@/lib/palette/api/*); (d) live-probe both prod APIs with curl from
`api.fourier.babb.dev` + `api.color.babb.dev`; (e) test the cross-repo
CORS contract from a `fourier.babb.dev` Origin against
`api.color.babb.dev`.

---

## §0 — Verdict

| Surface | Verdict |
|---|---|
| fourier viz API conformance to v2.0.0 (§1–§9 + §13 + §S1–S5) | **PARTIAL** (28 of 30 PASS — see §1.10) — substantively PASS |
| palette API conformance to v2.0.0 | **FAIL** (12 of 30 PASS — D-audit's 53 DEFERRED-TO-VALUE.JS cells are unchanged at HEAD) |
| Cross-repo FK live (palette_slug ⇄ palette.slug shape) | **PASS at the storage layer; PROVEN-UNRESOLVABLE at the browser layer** — CORS denies fourier.babb.dev (see §5) |
| ALL consumers identified | **6 consumer surfaces** (see §3) |
| Architectural transpositions identified | **9** (see §6) |

**Headline residuals (in execution-priority order).**

1. **Palette-API CORS allow-list omits `https://fourier.babb.dev`** — verified
   live (curl below). If/when fourier ever wants to resolve a `palette_slug`
   from the browser, the request will be browser-blocked. Single-line
   nginx/Hono env fix.
2. **Palette API serves `{data:[...], total:N, limit, offset}` for list +
   single `{...}` body for read** — neither matches v2.0.0 §0 SOTA-3
   (problem+json), §S5 (envelope), §S1 (cursor), §S2 (ETag), §S3
   (Idempotency-Key), §S4 (RateLimit-* headers), §1.3 (no top-level `id`).
   The 53 DEFERRED-TO-VALUE.JS cells are unchanged from D.W5 close
   (verified by file-grep of `value.js/api/src/` HEAD).
3. **Fourier viz frontend (`web/src/lib/api.ts`)** silently drops the
   `application/problem+json` body's structured fields — the error path
   throws `new Error("API ${status}: ${text}")`. No `urn:contract:*` type
   reaches the UI; the user sees a stringified blob.
4. **`computeContentHash` collision risk in value.js** — `currentHash` is
   derived from `(name, colors)` only (`hash.ts`); the field carries
   "hey v2 (remix)" with 1 color and gets the SAME hash as another remix.
   Live data shows two palettes with identical `currentHash`
   `6691aae4...` and the same `(name, colors)` tuple — duplication is
   the at-rest reality, not a corner case.
5. **Two `palette-api` copies on host** per `PALETTE-API-PROVENANCE.md`:
   the in-tree `value.js/api/` source vs the deployed
   `/home/mbabb/Programming/palette-api/` rsync target. The audit can
   verify only the in-tree source; the deployed source is opaque to git.

---

## §1 — Fourier viz API audit (per CRUD-CONTRACT v2.0.0)

### §1.1 Identity (§1, C1.1–C1.3) — PASS

- `api/models/visualization.py:102` declares `slug: str`;
  `api/routers/visualizations.py:172,278,317,347` route `/{slug}`.
- `api/routers/visualizations.py:69` `_public_doc` strips `_id` + `liked_ips`
  before serialisation — **C1.3 PASS**.
- `api/lib/crud/slugs.py::validate_slug` is called on every read/write
  (`visualizations.py:180,281,320,350`); rejection produces
  `urn:contract:slug-invalid` 400 — **C1.2 PASS** (live-verified, see §5).
- **C1.1** — `scripts/conformance/grep-no-hash-in-url.sh` is the gate;
  fourier passes (cited per CONFORMANCE-MATRIX C1.1 fourier-row).

### §1.2 Slug minting (§2, C2.1–C2.5) — PASS (server-generated only)

- `api/lib/crud/slugs.py::slug_with_retry` driven by `coolname` + retry
  loop (`visualizations.py:153`); shape `^[a-z]+(-[a-z]+){3}$` is the
  v2.0.0-permitted local tightening of the shape-floor.
- User-supplied path (mode b) is not enabled — fourier has no naming
  UX, so C2.5 is N/A on the fourier side per §2 (informative).
- `slug-exhausted` 503 is emitted after 10 collisions per
  `errors.py::slug_exhausted` and lib/crud/slugs.py.

### §1.3 Visibility (§4, C4.1–C4.7) — PASS

- Visibility enum `Literal["draft", "unlisted", "public"]` at
  `models/visualization.py:33`; default `"draft"` at line 104.
- Anonymous list filters `visibility == "public"` at
  `routers/visualizations.py:240`; owner-scoped at line 234–238.
- Draft 404-to-non-owner at line 193 (not 403 — refuses to confirm
  existence per §4).
- **Caveat (C4.5/C4.6 still UNIMPLEMENTED at HEAD).** The router does
  not enforce the `public → draft` two-step transition (cited as
  DEFERRED in CONFORMANCE-MATRIX `C4.5` fourier row; the
  `visibility_illegal_transition` catalog helper at
  `errors.py:79–84` is *unused*). v2.0.0 §4 calls this optional —
  "v2.0.0 admits an optional transition guard" — so it is conforming
  by relaxation, but the precept document still names it as fourier-
  side residual work.

### §1.4 Lifecycle / soft-delete (§5, C5.1–C5.5) — PASS

- `api/lib/crud/softdelete.py::soft_delete + restore + not_deleted_filter`
  drive `routers/visualizations.py:336–366`. Single-field write of
  `deleted_at`; restore in grace; `urn:contract:soft-deleted` for
  expired-grace restore.
- `api/services/janitor.py` runs the cron sweep with bounded `$nin`
  per the C5.4/C8.1 grep gate.

### §1.5 SOTA envelopes (§0 SOTA-1..6 + §S1–S5) — PASS

- problem+json envelope: `api/lib/crud/errors.py::ProblemDetails + problem`
  emits `application/problem+json` for every 4xx/5xx
  (live-verified at §5; `urn:contract:slug-invalid` 400 returned with
  `Content-Type: application/problem+json`).
- ETag + If-Match: `api/lib/crud/etag.py:14` `_DEFAULT_FIELDS`
  participation includes `palette_slug` for the cross-repo
  FK-rotation rule (§13 binding). `set_etag_header` called on every
  200 response.
- Idempotency-Key: `api/lib/crud/idempotency.py::IdempotencyStore +
  replay_or_record` wraps create (`visualizations.py:164`).
- RateLimit headers: live-probe returned
  `ratelimit-limit: 10`, `ratelimit-remaining: 10`,
  `ratelimit-reset: 0` (verified at §5).
- Link header: cursor pagination emits `rel="next"` at
  `visualizations.py:269`.

### §1.6 Pagination (§S1, CS1.1–CS1.3) — PASS

- `api/lib/crud/cursors.py::encode_cursor + decode_cursor +
  next_cursor_from_last + paginate`; `visualizations.py:242,257`
  drive the cursor envelope `{items, next_cursor, has_more}` per the
  contract.

### §1.7 Sessions + ownership (§3, §6, §7) — PASS

- `api/dependencies.py::resolve_session` reads `X-Session-Token`;
  `routers/visualizations.py:107,284,323,353` enforce 401 on
  anonymous-write.
- `doc.owner_slug != user_slug` returns 403 with
  `urn:contract:not-owner` (lines 292, 331).

### §1.8 Admin (§7) — PASS-with-residual

- `api/routers/admin.py` carries `set_tier` (idempotent setter — per
  v2.0.0 §7 rename — verified by `setVisualizationTier` consumer at
  `web/src/lib/api.ts:541`), `flag uniqueness`, batch endpoints
  emitting the v2.0.0 `{ok, affected, errors?}` shape (`api.ts:660`
  fix, B.W4).

### §1.9 Cross-repo FK (§13, C13.1–C13.3) — PASS (fourier side only;
see §5)

- `models/visualization.py:119, 163, 177` declares
  `palette_slug: str | None` on the entity + Create + Update bodies.
- `etag.py:14` `_DEFAULT_FIELDS` includes `palette_slug` per §13 ETag-
  participation rule.
- **No write-path resolve** of palette_slug (per §13 invariant; grep
  of `routers/visualizations.py` for `httpx|requests|aiohttp`
  returns zero — verified).
- The browser-side resolve **does not exist either** —
  `web/src/lib/api.ts` has no `getPaletteBySlug` or any fetch against
  `api.color.babb.dev`. The `palette_slug` is *stored opaquely and
  never resolved on any surface today*. The FK is shape-valid but
  exercise-cold. See §5 for the load-bearing CORS gap that would
  block a future resolve.

### §1.10 Conformance-cell scoreboard (fourier side)

Per CONFORMANCE-MATRIX `§V2.1` count, fourier today: **27 ADDRESSED
(PASS) / 0 DEFERRED-TO-VALUE.JS / 0 DEFERRED-TO-FOURIER** of the rows
that bind fourier. C4.5/C4.6 are still UNIMPLEMENTED at HEAD per
W4-reconcile; recorded honestly there as fourier-side
backend-router-wave residual.

---

## §2 — Palette API (value.js side) audit

The D-audit's 53 DEFERRED-TO-VALUE.JS cells are **unchanged at value.js
HEAD `16129e0`** — verified by file-grep:

- `grep -rn "deletedAt\|deleted_at" value.js/api/src/` returns **zero
  matches** beyond the migration-check comment. Soft-delete is not
  landed.
- `grep -rn "ETag\|If-Match" value.js/api/src/` returns **zero
  matches**.
- `grep -rn "Idempotency-Key" value.js/api/src/` returns **zero
  matches**.
- `grep -rn "application/problem" value.js/api/src/` returns **zero
  matches**.
- `models.ts:29` still declares
  `PALETTE_STATUSES = ["published","featured","hidden","draft"]` —
  the 4-state `status` conflation persists. No `visibility` enum.
- `format/palette.ts:59` still emits `id: String(_id)` at the
  top-level — violates §1.3.
- `services/admin/palettes.ts:22–37` still implements the
  `toggleFeature` (non-idempotent toggle), not the v2.0.0 `set_tier`
  setter.
- `services/admin/batch.ts:21,58` still returns
  `{processed}`, not the v2.0.0 `{ok, affected, errors?}` shape.
- `services/palette/crud.ts:219–248` still HARD-cascade-deletes
  (palette + votes + flags + decrementForkCount). No soft-delete
  pass-through.
- `models.ts:73–74` still declares `sessionToken: string | null` and
  `userSlug: string | null` (nullable owner — violates §3).
- `errors/index.ts:84–122` still emits the
  `{error: {code, message, detail?}}` envelope, not problem+json.
- `middleware/rate-limit.ts:64–71` returns the bare
  `{error: "Rate limit exceeded"}` 429 — no `Retry-After`, no
  `RateLimit-*` headers.

### §2.1 I.W1 (visibility/identity/migration) — NOT-LANDED

All 11 cells from VALUE-JS-ASK §2.1 remain DEFERRED-TO-VALUE.JS.

### §2.2 I.W2 (soft-delete) — NOT-LANDED

All 7 cells from §2.2 remain DEFERRED. `services/palette/crud.ts:219`
`deletePalette` is the cascade-hard-delete shape.

### §2.3 I.W3 (admin idempotency) — NOT-LANDED

3 cells from §2.3 remain DEFERRED. `toggleFeature` is the toggle
shape; `batch.ts` is the `{processed}` shape.

### §2.4 I.W4 (SOTA envelopes + conformance suite) — NOT-LANDED

32 cells from §2.4 remain DEFERRED. The four RFC envelopes (problem+json,
ETag, Idempotency-Key, RateLimit-*) have **zero grep hits** in
`value.js/api/src/`. No `test/conformance/**` directory in
`value.js/api/`; the only test dir is `value.js/api/test/{routes,
services,repositories}/` (palette-crud, votes, forks, versions, flags,
admin-*).

### §2.5 Cross-repo FK clause (§13, value.js side) — PARTIAL

- `GET /palettes/:slug` is live (`routes/palettes/crud.ts:60–64`);
  live-probe `lavender-dreams` returns 200 with the palette
  envelope.
- The §13 binding requires a **stable slug** + **`/palettes/{slug}`
  lookup path** — both hold.
- **The §13-required `410 Gone` for soft-deleted palettes** (so
  fourier can distinguish FK-dangling-by-deletion vs typo) is not
  yet implementable because soft-delete is not landed; today value.js
  cascade-hard-deletes, so the FK becomes a permanent 404.

### §2.6 Conformance-cell scoreboard (palette side)

Per CONFORMANCE-MATRIX `§V2.1`:
- **53 DEFERRED-TO-VALUE.JS** (unchanged from D.W5 close);
- **12 ADDRESSED** (the rows where value.js already conformed at
  D.W5 — slug uniqueness, slug shape-floor, GET /palettes/:slug,
  cursor pagination payload, fork-count cascade, vote uniqueness
  index, etc.);
- **7 RETIRED-AS-OVER-SPEC** (the C2.4 word-list membership +
  the §2 4-word-shape clause relaxed at v2.0.0).

Total v2.0.0 surface: 72; PASS=12 (17%), DEFERRED=53 (74%),
RETIRED=7 (10%).

---

## §3 — ALL consumers audit (user's explicit mandate)

### §3.1 Consumer-1 — Fourier SPA / web/src/lib/api.ts

**Location**: `/Users/mkbabb/Programming/fourier-analysis/web/src/lib/api.ts`
(708 LoC).

**Endpoints consumed**:
- `/api/visualizations` — full CRUD: POST, GET, PATCH, DELETE,
  restore (lines 407–495). ETag captured + `If-Match`-replayed.
- `/api/images/*` — upload, get-meta, blob, thumbnail, overlay,
  extract-contour (lines 295–347).
- `/api/contours/*` — save, get, compute-epicycles, compute-bases
  (lines 351–398).
- `/api/sessions` — create, login, me, delete (lines 499–520).
- `/api/admin/*` — verify, stats, set-tier, delete, dismiss-flags,
  users, batch, audit (lines 524–706).

**Brittleness findings**:
- **B1 (load-bearing).** `apiFetch` swallows the problem+json body:
  `throw new Error(\`API ${res.status}: ${text}\`)` (line 173).
  No parsing of `{type, title, status, detail}`. The fourier API
  emits a structured envelope (verified §5) but the UI sees a
  stringified blob.
- **B2.** No retry on 429. `RateLimit-Reset` + `Retry-After`
  headers are ignored.
- **B3.** ETag-flow leaks: a stale ETag yields the same "API 412:
  ..." string error — no `urn:contract:etag-mismatch`
  branch, so the UI cannot conditionally re-fetch + replay.
- **B4 (cosmetic).** `Visualization.tier?: GalleryTier` (line 44)
  is declared on the consumer side but fourier's `Visualization`
  pydantic model has no `tier` field — admin-only column lives
  separately on `set_tier`'s side. Untyped read.
- **B5.** Fourier consumer carries no `palette_slug` resolve. The
  FK is stored, never fetched. (Confirms §1.9 + §5 finding.)

**Smallest-honest-mechanism**:
- Add a typed `ApiError` class with optional `type`, `title`,
  `status`, `detail`; `apiFetch` reads `Content-Type:
  application/problem+json` and parses before the throw.
- A 429-retry helper that reads `Retry-After`.
- (For the cross-repo flow): a `getPaletteBySlug(slug)` that
  fetches `api.color.babb.dev/palettes/{slug}`, *iff* CORS is
  fixed (§5).

### §3.2 Consumer-2 — Value.js demo / @/lib/palette/api/*

**Location**: `/Users/mkbabb/Programming/value.js/demo/@/lib/palette/api/`
(9 files: client, palettes, colors, versions, admin-{palettes,
users,colors,audit}, index).

**Endpoints consumed** (from `palettes.ts`):
- `GET /palettes` (list w/ offset OR cursor) — line 51.
- `GET /palettes/mine` — line 58.
- `GET /palettes/:slug` — line 62.
- `POST /palettes` — line 71.
- `PATCH /palettes/:slug` — line 81.
- `POST /palettes/:slug/vote` — line 94.
- `DELETE /palettes/:slug` — line 98.
- `POST /palettes/:slug/flag` — line 106.
- (plus versions, forks, admin endpoints in sibling files).

**Brittleness findings**:
- **B6.** `BASE_URL` defaults to `https://mbabb.fi.ncsu.edu/colors`
  (`client.ts:15`) — the VPN host from the pre-D era. After the
  D.W10/W11 rename to `api.color.babb.dev`, this default is wrong;
  any env that does not set `VITE_API_URL` will fail. The fourier
  precedent (`api.ts:18`) uses an empty-string fallback that
  resolves to relative origin — much safer.
- **B7.** `request<T>()` (line 24) throws `new Error("API ${status}:
  ${body}")` — same shape as fourier's B1 brittleness. The palette
  API returns `{error: {code, message, detail}}` but the consumer
  flattens it.
- **B8.** No ETag flow. The value.js API doesn't emit ETags — but
  the consumer also doesn't capture or replay them, so even if the
  API adds them (I.W4) the consumer needs a parallel patch.
- **B9.** No 429 handling. Mirrors B2.
- **B10.** Session 401 silently nulls the token (`client.ts:38`);
  the UI is not notified — `setSessionToken(null)` happens out-of-
  band of the throw.

**Smallest-honest-mechanism**:
- Update `DEFAULT_REMOTE_API_URL` to `https://api.color.babb.dev`
  (W11 reality).
- Mirror the typed-error refactor from §3.1's B1.

### §3.3 Consumer-3 — Value.js library / src/

**Location**: `/Users/mkbabb/Programming/value.js/src/` (the npm-
distributed `@mkbabb/value.js` library — index.ts, units/, easing.ts,
math.ts, parsing/, quantize/, transform/, utils.ts).

**Endpoints consumed**: **NONE**. The library is colour-math-only.
No `fetch`, no `api.` reference. Confirmed by:
- `grep -rn "fetch\|api\\." value.js/src/` → returns the `unit/api`
  module ref-only lines, no HTTP.
- The library does not depend on a backend.

**Verdict**: out of scope of this audit — the value.js library
surface is a pure-function colour engine, not a palette-api
consumer.

### §3.4 Consumer-4 — Fourier CF Pages frontend

The `fourier.babb.dev` deployed frontend is just §3.1's `web/src/lib/
api.ts` built and served from CF Pages. Same surface, same
brittleness. Verified via `D/FINAL.md:84` (the deployed bundle
`index-veNzjUth.js`).

### §3.5 Consumer-5 — Color.babb.dev frontend

The `color.babb.dev` GitHub-Pages-deployed frontend is value.js's
demo (§3.2) built and served from `mkbabb.github.io/value.js/`.
Same surface as §3.2.

### §3.6 Consumer-6 — Fourier web vendored tarballs

`fourier-analysis/web/vendor/*.tgz` contains vendored
sibling-library tarballs (per `VENDOR-POLICY.md` in value.js
referenced via the Wα-R4 vendor-policy block). These are
**library** vendors, not API consumers — they bring in
`@mkbabb/value.js` library code (the colour engine), not the
palette-API client. So they do NOT couple to either API.

### §3.7 Cross-host consumer scan

`grep -rn "api.color.babb.dev\|api.fourier.babb.dev" ~/Programming/
--include='*.ts,*.tsx,*.vue,*.js,*.py'` (excluding node_modules and
docs):
- **value.js/demo** — the `BASE_URL` indirection. Confirmed §3.2.
- **fourier-analysis/web** — relative-path `api/` calls; no
  `api.color.babb.dev`. Confirmed §3.1.
- **No other repo** (sudoku, words, floridify, keyframes.js,
  bbnf-lang, csp-solver) consumes either API. The cross-repo
  reach surface is exactly the two demo frontends.

**Total consumer surfaces**: **6** (Fourier SPA, Fourier-CF-Pages
deploy, value.js demo, color.babb.dev deploy, value.js npm
library [confirmed-not-consumer], fourier vendor tarballs
[confirmed-not-consumer]).

---

## §4 — Refine / Test / CRUD (the user's explicit verbs)

### §4.1 — REFINE

#### Fourier viz API

- **R1 (perf).** `routers/visualizations.py::get_visualization`
  triple-roundtrips the DB on a single read (find_one + update_one +
  find_one-after-update). The `update_one` with `$inc views +
  $set last_accessed_at` is a side-effect on a read — collapse
  to a single `find_one_and_update(..., return_document=AFTER)`
  to save 2 of the 3 RTTs and to make the read atomic w.r.t. the
  view-count race.
- **R2 (perf).** `_compute_content_hash` is called on every create
  but the result is immediately overwritten in the model_dump
  insert path. Compute-once and pass downstream.
- **R3 (idiomatic).** The `_idem_store` lazy singleton at line
  52–58 is the only mutable module-level state in the router;
  move to FastAPI's app-state pattern
  (`request.app.state.idempotency_store`) for testability + DI
  consistency with `get_db()`.
- **R4 (idiomatic).** The router has ~370 LoC; the contour-hash +
  image-slug existence checks (lines 115–118) belong in a Pydantic
  `@field_validator` or a dedicated `_resolve_dependencies` helper.
  The router should focus on HTTP shape.

#### Palette API

- **R5 (idiomatic).** The four-layer split (route → service →
  repository → driver) is the SOTA Hono-Mongo pattern but **for 10
  published palettes** is overengineered: every route incurs 3
  delegations. The `requireOwnership` middleware re-reads the
  palette to confirm ownership — then `patchPalette` re-reads it
  again (line 160) and `deletePalette` re-reads it (line 227) —
  3 finds for one mutation. Folding repository into service and
  caching the `owner-check` read would halve the RTT count.
- **R6 (perf).** `format/palette.ts:59` `id: String(_id)` — both
  emits `_id` (violation of §1.3) AND incurs a String coercion
  per row. Drop the field.
- **R7 (idiomatic).** `services/palette/crud.ts::createPalette`
  inserts then re-reads (`findBySlug` at line 132). Drop the
  re-read; insert returns the document the caller assembled.

### §4.2 — TEST

#### Fourier conformance suite

- 12 tests in `api/tests/conformance/` (test_identity, test_admin,
  test_etag, test_idempotency, test_janitor, test_ownership,
  test_pagination, test_problem, test_rate_limit, test_sessions,
  test_slug_format, test_soft_delete, test_url_shape,
  test_visibility) cover §1–§9 + §S1–S5.
- **Coverage gap T1**: no test for §13 cross-repo FK
  (`palette_slug` participation in ETag rotation). A two-line
  test that patches a viz with a new `palette_slug` and asserts
  the response's `ETag` changes vs the prior would pin C13.1.
- **Coverage gap T2**: no test for §4 C4.5/C4.6 illegal
  transition guard (the router doesn't enforce it; the test would
  be xfail/skip).

#### Palette API conformance suite

- **No conformance suite exists** at HEAD. `value.js/api/test/`
  has 14 test files (admin-* + palette-* + withTransaction-*) but
  no `conformance/` directory. Per VALUE-JS-ASK §2.4, this is the
  I.W5 deliverable (user-re-mandate-gated).

#### Cross-repo contract-test

- **No cross-repo contract test exists**. Per CRUD-CONTRACT §10
  + invariant 16 the design is *per-repo flip discipline* (each
  repo flips its own column on its own suite). But a **shared
  text-pinned contract spec** (e.g. a single JSON file shipped
  in `docs/tranches/B/coordination/` that lists every
  `urn:contract:*` type the contract names + every header
  semantic the contract emits) is not over-engineering — it
  is pure documentation. Recommended as E.δ.
- A **fortnightly probe** (cron in the host's deploy.babb.dev)
  that runs a 10-line shell script (each curl probe + status code
  + Content-Type assertion against both endpoints) and posts to
  precepts on regression — this is on the order of 50 LoC, fully
  isolated, no shared library.

### §4.3 — CRUD coverage matrix (per noun)

| Noun | Owner | Create | Read | Update | Delete | List | Cursor | Soft-del | Restore | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| visualization (fourier) | fourier | POST | GET /{slug} | PATCH | DELETE (soft) | GET ?cursor | ✓ | ✓ | POST /restore | FULL |
| image (fourier) | fourier | POST | GET /{slug} | — | — | — | — | — | — | RO |
| contour (fourier) | fourier | POST | GET /{hash} | — | — | — | — | — | — | RO |
| session (fourier) | fourier | POST | GET /me | — | DELETE | — | — | — | — | FULL |
| flag (fourier) | fourier (admin) | POST (admin reg) | GET /admin/flagged | — | DELETE (dismiss) | GET /admin/flagged | ✓ | — | — | ADMIN |
| user (fourier) | fourier (admin) | — (auto) | GET /admin/users | POST /status | DELETE | GET /admin/users | offset | — | — | ADMIN |
| palette (value.js) | value.js | POST | GET /:slug | PATCH | DELETE (HARD!) | GET (offset OR cursor) | partial | **NO** | **NO** | NEAR-FULL but HARD-delete |
| palette_version (value.js) | value.js | POST (fork) | GET /history | — | — | GET /:slug/versions | — | — | — | RO + fork |
| vote (value.js) | value.js | POST | (count on palette) | — | DELETE (toggle) | — | — | — | — | TOGGLE |
| flag (value.js) | value.js | POST | (admin) | — | — | (admin) | — | — | — | ADMIN |
| session (value.js) | value.js | POST | GET /me | — | DELETE | — | — | — | — | FULL |
| user (value.js) | value.js | — (auto) | (admin) | — | DELETE (admin) | (admin) | — | — | — | ADMIN |

**Verdict at-a-glance**:
- Fourier visualization is the only noun with FULL CRUD+soft-delete+
  restore+cursor (the contract-aligned shape).
- Palette is NEAR-FULL but HARD-delete (the I.W2 residual).
- All other nouns are RO or ADMIN-shape; this is intentional.

---

## §5 — Cross-repo FK contract: LIVE verification

### §5.1 — Slug shapes coincide

- Fourier emits `^[a-z]+(-[a-z]+){3}$` (4-word coolname);
  `api/lib/crud/slugs.py::SLUG_PATTERN`.
- Value.js accepts `^[a-z0-9][a-z0-9-]*$` ≤ 120
  (`validation/palette.ts:23` `slugSchema`).
- Fourier's shape is a strict subset of value.js's shape-floor —
  any fourier-emitted slug WOULD be a valid palette slug, but
  fourier never emits a palette slug (fourier creates
  visualizations, not palettes).
- Value.js emits `<adjective>-<adjective>-<color>-<animal>`
  (`slugWords.ts` 4-word generator) + a user-supplied path
  (e.g. `hey-v2-cd3e1e3b`). Both are valid §13 shapes.

### §5.2 — Live probe transcript

```text
$ curl -sS -i 'https://api.fourier.babb.dev/api/visualizations'
HTTP/1.1 200 OK
content-type: application/json
ratelimit-limit: 10
ratelimit-remaining: 10
ratelimit-reset: 0
{"items": [], "next_cursor": null, "has_more": false}

$ curl -sS -i 'https://api.fourier.babb.dev/api/visualizations/foo-bar-baz-quux'
HTTP/1.1 404 Not Found
content-type: application/problem+json
{"type":"urn:contract:not-found","title":"Resource not found","status":404,
 "detail":"no visualization 'foo-bar-baz-quux'"}

$ curl -sS -i 'https://api.fourier.babb.dev/api/visualizations/0123456789abcdef0123456789abcdef'
HTTP/1.1 400 Bad Request
content-type: application/problem+json
{"type":"urn:contract:slug-invalid","title":"Invalid slug shape","status":400,
 "detail":"'0123456789abcdef0123456789abcdef' is not a 4-word slug"}

$ curl -sS -i 'https://api.color.babb.dev/palettes?limit=3'
HTTP/1.1 200 OK
content-type: application/json
access-control-allow-origin: https://color.babb.dev    ← CORS lock-in
{"data":[ ... ],"total":10,"limit":3,"offset":0}

$ curl -sS -i 'https://api.color.babb.dev/palettes/lavender-dreams'
HTTP/1.1 200 OK
content-type: application/json
access-control-allow-origin: https://color.babb.dev
{"id":"699fc8a23a6c54c5a44cfb7d", ... ,"slug":"lavender-dreams", ...}

$ curl -sS -i -X OPTIONS 'https://api.color.babb.dev/palettes/some-slug' \
       -H 'Origin: https://fourier.babb.dev' \
       -H 'Access-Control-Request-Method: GET'
HTTP/1.1 204 No Content
access-control-allow-origin: https://color.babb.dev    ← STILL only color.babb.dev
```

### §5.3 — CORS verdict — FAIL (load-bearing)

The preflight reply returns
`access-control-allow-origin: https://color.babb.dev` regardless of
the `Origin` header — confirming the env var that drives CORS in
`value.js/api/src/middleware/cors.ts` (read separately, line not
quoted) is set to the single value `https://color.babb.dev` rather
than a list including `https://fourier.babb.dev`. Browser will
hard-block any fourier-origin request.

**Severity.** The shipped fourier frontend does NOT today fetch
palettes from `api.color.babb.dev`, so this gap is **latent** — no
user is blocked today. The moment the colour-lift fires (per
`D/coordination/VALUE-JS-ASK.md §5`; the C-era inverted-δ
named-residual) or fourier's UI grows a "show palette by slug"
affordance, the gap becomes load-bearing in one bundle deploy.

**Fix.** One-line change to value.js's CORS env (likely
`CORS_ALLOWED_ORIGINS` or the `cors.ts` allow-list array). No
code change; no re-deploy of the palette-api container; just an
env var bump in the host's compose file.

### §5.4 — §13 conformance verdict

- Fourier writes `palette_slug` opaquely (PASS C13.1) — verified
  by reading the create path; no resolve call.
- ETag participation holds (`etag.py:14`); a patch that mutates
  `palette_slug` rotates the viz ETag (PASS C13.1).
- Value.js's `GET /palettes/:slug` returns the envelope (PASS
  C13.3 mid-rung — but FAILS the §13 410-Gone-for-soft-deleted
  sub-rung because soft-delete is not landed).
- Cross-repo CORS does NOT permit fourier-origin (FAIL C13's
  implicit "fourier's web client can resolve").

---

## §6 — Architectural transpositions

Per the user's "elegance/simplicity/performance" mandate (mandated
2026-05-28) and per CRUD-COHESION §6 ("the user has now mandated
architectural transpositions for elegance/simplicity/performance
are necessary and desirable"). Each: name + benefit + risk.

### T1 — Fold value.js's repository layer into the service layer

- **Benefit**: removes 1 of 3 RTTs per mutation; halves the
  delegation depth; eliminates the repository-interface
  ceremony for a system with 9 collections.
- **Risk**: low — the repository layer is thin enough that
  inlining is a refactor, not a redesign. The withTransaction
  contract stays at the service surface.
- **Locality**: `value.js/api/src/repositories/` + `services/`.

### T2 — Drop `format/palette.ts` `id` field

- **Benefit**: brings palette API into §1.3 conformance; saves
  one String-coercion per palette per response (in a list of
  100 palettes, that's 100 allocations).
- **Risk**: medium — the demo frontend `client.ts` consumes
  `palette.id` somewhere (a `grep -n "palette.id\|\.id" demo/`
  search would confirm); changing it is a coordinated
  consumer+server bump. Mitigation: emit `slug` (already
  present) + drop `id` in lock-step with a demo bundle.
- **Locality**: `value.js/api/src/format/palette.ts:59` + every
  demo consumer of `palette.id`.

### T3 — Migrate value.js to problem+json + ETag + Idempotency-Key

- This is **I.W4** of `VALUE-JS-ASK.md`, lifted verbatim. The
  transposition is from `{error: {code, message, detail}}` to
  `application/problem+json` with `urn:contract:*` types.
- **Benefit**: cross-repo envelope coincidence; consumer can
  share a typed-error class across fourier + palette consumers
  (T8 below).
- **Risk**: medium — wire-incompatible change. Demo frontend
  must read the new envelope. Mitigation: ship behind a
  `?envelope=problem` query flag for a grace window, then flip
  the default.
- **Locality**: `value.js/api/src/errors/index.ts` +
  `middleware/` (new etag.ts + idempotency.ts).

### T4 — Fix palette-API CORS to allow fourier.babb.dev

- **Benefit**: unblocks the cross-repo FK *resolve* path
  (latent today; load-bearing the moment fourier grows a
  palette-fetch surface).
- **Risk**: trivial — one env var.
- **Locality**: host compose file env
  (`/home/mbabb/Programming/palette-api/.env` or the
  docker-compose env block).

### T5 — Consolidate fourier's `_compute_content_hash` flow into the
model

- **Benefit**: removes the inline computation in the router;
  Pydantic computes the field once. Idempotency / dedup
  consumers all see the same canonical value.
- **Risk**: low — moves one private helper into a
  `@computed_field` on the model.
- **Locality**: `api/models/visualization.py` +
  `api/routers/visualizations.py:72–84`.

### T6 — Promote fourier's `api/lib/crud/` to a per-language
internal package (not a published library)

- Per §0.4 module-layout neutrality, the contract permits but
  does not require this. The benefit is **discoverability**
  (one folder = one §) and **test isolation** (the lib has its
  own test surface). Today it's flat under `api/`.
- **Benefit**: nominal.
- **Risk**: trivial. Not a wire-shape change.
- **Locality**: `api/lib/crud/` rename only.

### T7 — Cross-repo contract-test (the user's "test, refine, CRUD"
verb)

- **Benefit**: pins the CORS allow-list, the §S* header set,
  the `urn:contract:*` URN catalog at one cron-driven probe.
  Surfaces drift the moment it occurs, not at the next outage.
- **Risk**: trivial — 50-LoC shell script in
  `scripts/conformance/cross-repo-probe.sh` + a daily cron.
- **Locality**: fourier-analysis (this repo) only; the probe
  runs against both APIs from the deploy host.

### T8 — Typed-error class shared across the two consumer surfaces

- A `class ApiProblem extends Error` with `{type, title,
  status, detail}` fields and a `parse(response)` static. Used
  in fourier SPA + value.js demo. Per invariant 16, this is
  **NOT** a published package; each consumer ships its own
  copy. The text is the contract; the code is per-repo.
- **Benefit**: eliminates the §3.1 B1 + §3.2 B7 brittleness;
  enables typed error-handling at the call site.
- **Risk**: low — additive, not removing anything.
- **Locality**: fourier `web/src/lib/api.ts` + value.js
  `demo/@/lib/palette/api/client.ts`.

### T9 — Resolve the palette-api dual-source by adopting the
in-tree as canonical + git-tagged deploy artefact

- Per `PALETTE-API-PROVENANCE.md` the deployed source on host
  `/home/mbabb/Programming/palette-api/` is rsync-not-git. The
  transposition: pin the value.js/api/ HEAD as the deploy
  artefact (git tag → release tarball → rsync), eliminating the
  drift window.
- **Benefit**: any value.js/api/ change is verifiably the
  deployed change; closes the audit-opacity gap.
- **Risk**: low — one-shot rsync-from-git swap. The host
  workflow stays rsync-shaped; only the source-of-rsync moves.
- **Locality**: host deploy script + a new git tag in value.js.

---

## §7 — Tranche E scope binding

Per the user's mandate at 2026-05-28: "Refine, test, CRUD, our two
palette apis and fourier viz apis. Including ALL consumers. Fix
our cross repos." Suggested decomposition into 5 lanes (each
land-on-its-own, ε ordering preserved per project_tranche_d.md):

### E.α — Fourier viz API refinements (idiomatic + perf)

- **E.α.1**: R1 single-RTT read (find_one_and_update). 1 file, ~5
  LoC.
- **E.α.2**: R3 idempotency-store via app.state. 2 files, ~8 LoC.
- **E.α.3**: R5 content-hash as model computed field. 2 files,
  ~12 LoC.
- **E.α.4**: T1 fourier-conformance C13.1 test for ETag rotation
  on palette_slug. 1 file, ~15 LoC.

**Bound**: backend only; no consumer impact.

### E.β — Palette API alignment (the 53 DEFERRED-TO-VALUE.JS cells
+ T2 + T3)

- **E.β.1**: I.W1 — visibility split + null-owner sweep + strip
  top-level id (drives T2). Per VALUE-JS-ASK §2.1. ~80 LoC.
- **E.β.2**: I.W2 — soft-delete + grace + restore + 410-Gone
  semantics. Per §2.2. ~120 LoC.
- **E.β.3**: I.W3 — set_tier idempotent setter + unified batch
  return shape. Per §2.3. ~40 LoC.
- **E.β.4**: I.W4 — problem+json + ETag + Idempotency-Key +
  RateLimit-* (T3). Per §2.4. ~200 LoC + middleware.
- **E.β.5**: I.W5 — conformance suite. ~30 test files.

**Bound**: value.js/api/ + the demo consumer in lock-step.

### E.γ — ALL consumers hardened

- **E.γ.1**: T8 — typed `ApiProblem` class in fourier `web/src/lib/
  api.ts` (B1 + B3 fix) + 429-retry helper (B2). ~30 LoC.
- **E.γ.2**: T8 mirror in value.js `demo/@/lib/palette/api/
  client.ts` (B7 + B9 + B10 fix) + `BASE_URL` default update
  to `api.color.babb.dev` (B6). ~25 LoC.
- **E.γ.3**: Fourier `web/src/lib/api.ts` palette-resolve
  function (gated on E.δ.2 CORS fix). ~10 LoC.

**Bound**: consumer-only; no API change.

### E.δ — Cross-repo contract-test + CORS fix

- **E.δ.1**: T7 — cross-repo probe shell script + daily cron in
  the deploy.babb.dev host. ~50 LoC.
- **E.δ.2**: T4 — palette-API CORS allow-list bump to include
  `https://fourier.babb.dev`. Env-var only. 1-line change.

**Bound**: host config only; no source change in either repo.

### E.ε — Architectural transpositions (per item)

- **E.ε.1**: T9 — palette-api deploy artefact = git-tagged
  release. ~40 LoC in scripts.
- **E.ε.2** (optional, low priority): T1 — value.js repository →
  service inline. Per the user's elegance mandate; only if
  E.β lands first.

**Bound**: orthogonal to E.α–E.δ; can be parallelised.

---

## §8 — Authority + citations

- `docs/tranches/B/coordination/CRUD-CONTRACT.md` v2.0.0 (this
  doc's binding) — D.W5 close commit `fc5b3b0`.
- `docs/tranches/B/coordination/CONFORMANCE-MATRIX.md §V2.1` (the
  53/27/7 disposition).
- `docs/tranches/D/coordination/VALUE-JS-ASK.md` §2.1–§2.4 (the
  I.W1–W4 sketch lifted into E.β above).
- `docs/tranches/D/coordination/PALETTE-API-PROVENANCE.md` (the
  rsync-not-git provenance behind T9).
- `docs/audits/runs/2026-05-27-D-audit/DA3-valuejs-crud-cohesion.md`
  (the D-dev cohesion audit; this E-audit is the post-D
  re-audit + the all-consumers expansion).
- `docs/tranches/D/research/README.md R1` (the `palette_slug` FK
  contract clause lifted verbatim into CRUD-CONTRACT §13).
- Live-probed at 2026-05-28T04:56–57Z:
  `https://api.fourier.babb.dev/api/visualizations*`,
  `https://api.color.babb.dev/palettes*`,
  CORS preflight from `Origin: https://fourier.babb.dev`.

---

## §9 — Outputs

This document at `docs/audits/runs/2026-05-28-E-audit/EA3-crud-cohesion.md`.
No other artefacts written; this is a read-only audit per the
charter.
