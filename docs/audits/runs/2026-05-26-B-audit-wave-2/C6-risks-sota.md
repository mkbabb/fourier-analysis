# C6 — Risks + SOTA opportunities (Wave 2)

*Agent C6 · Tranche B · Wave 2 · 2026-05-26 · HEAD `f8db2c6` · READ-ONLY*

## §0 — Goal + completion criterion

**Goal.** Final Wave-2 audit pass: catalogue execution risks per B wave; re-examine the five chronic-deferral items L6 ratified; score SOTA candidates ADMIT / REJECT / DEFER under KISS; re-validate the nine 2026-05-19 KISS rejections; verify orphan-verdict-resurgence preventers; and emit a severity-classified risk matrix.

**Completion.** §1 substrate observed; §2 per-wave risks (W0–W5); §3 chronic-deferral resurgence; §4 SOTA opportunities; §5 KISS rejections re-validation; §6 orphan-verdict preventers; §7 high-confidence ADMITs + routing; §8 final risk matrix.

## §1 — Substrate observed

`B.md` (155 L); `CRUD-CONTRACT.md` (1197 L, 13 §-blocks); `waves/W3.md`, `waves/W4.md`; C1 (fourier substrate, 10 non-conforming clauses); C2 (value.js substrate, 6 of 13 incidental landings); C3 (convergence shape — 9 B / 2 F / 2 A; tier disposition unchanged); L6 (5 chronic items already routed). Empirical: `api/lib/crud/` and `docs/precepts/data/slug-words.json` do not exist on disk at `f8db2c6` — the corpus is spec-only.

## §2 — Per-wave risks

| Wave | Schedule | Scope | Data-loss | Cross-repo | Brittleness | Notes |
|---|---|---|---|---|---|---|
| W0 dispatch | LOW | LOW | — | LOW (orphan ratified) | — | Predecessor close-gate confirmed. |
| Wα research | LOW | MEDIUM | — | LOW | — | R3 disposition already extant; six lanes' deliverables landed. |
| Wχ challenge | LOW | **HIGH** | — | LOW | — | P1 framework-in-disguise is the *only* gate against §9 utility-tier drift (C3 §4 reports 0 % code-fraction — passes). P4 binding-test against Invariants 18–20 still owes axe-core wiring (B-scope-gap). |
| W1 ratification | LOW | LOW | — | LOW (fourier-only ratification) | — | C3 §5: amended §10 close-rule is met-able. |
| W2 UX coherence | MEDIUM | **HIGH** | — | — | LOW | Five parallel agents on the visualization-route left-panel + Configurator adoption — the largest concurrent surface in B. Risk: invariant-18 a11y gates slip past initial pass without axe-core (L6 §4 FLAG-GAP, not yet folded into W2). |
| W2-tracking | — | — | — | tracked-orphan | — | Latent affordance; not load-bearing. |
| W3 entity + migration | MEDIUM | **HIGH** | **HIGH** | — | **HIGH** (within-wave) | Brittleness window per `B.md §8` is within-wave-only — five-identity → one-entity carve crosses 8 collections; the migration `audit/migration-counts.md` discipline (seed=42, dry-run, post-condition stragglers) is the only data-loss guard. Rollback substrate (legacy `snapshots`/`gallery` survive to W5) is the restoration mechanism. |
| W4 wiring | MEDIUM | MEDIUM | LOW | orphan-default-primary | LOW | The `colors.ts` / `easings.ts` / `@mkbabb/value.js` bump becomes named-residual; no silent decay. Helper-adoption hard-gate (≥ 3 `from api.lib.crud` imports in `admin.py`; ≥ 10 helper sites across migrated routers) prevents framework-in-disguise from accreting at adoption boundary. |
| W5 close | LOW | LOW | — | DEFERRED rows persist | — | Legacy collection rename `_snapshots_legacy` / `_gallery_legacy` is the only irreversible step; gated by W3 close. |

**Per-wave risk count**: 9 waves; 5 HIGH-flag instances (Wχ scope; W2 scope; W3 scope/data-loss/brittleness), 4 MEDIUM-flag instances.

## §3 — Chronic-deferral resurgence

L6's five chronic items re-examined against B's authored scope:

1. **value.js color/path lifts** — CHRONIC-RESIDUAL, already absorbed-as-named-residual (B.W4.b orphan-verdict primary). Resurgence risk: **zero** — the destination `fourier-tranche-C-or-successor` is explicit; PROGRESS row writes are gated by W4 hard-gate item 4.
2. **Infrastructure standardisation** — CHRONIC-LOAD-BEARING (3 gates); routed to fourier-C. B-side absorption inappropriate (scope-incompatible). Resurgence risk: **MEDIUM-DURABLE** — chronicity continues until fourier-C authors. Honest acceptance: not B's load.
3. **Image-blob redesign** — CHRONIC-LOAD-BEARING; ratified-deferred per `R-lifecycle-spec §6` + `r6-fourier-C-scope`. B-side absorption inappropriate. Resurgence risk: same as (2).
4. **Press-scale unification** — CHRONIC-RESIDUAL; glass-ui's next-tranche territory. B should not absorb. Resurgence risk: **zero** at B boundary.
5. **Backend `--reload` aborts compute** — CHRONIC-RESIDUAL; dev-ergonomics; routed to fourier-C. Resurgence risk: low; cosmetic in production.

**Chronic-resurgence risk count**: 0 at B authoring; 2 (items 2, 3) durable until fourier-C opens.

## §4 — SOTA opportunities (ADMIT / REJECT / DEFER)

| Candidate | Spec | Verdict | Rationale |
|---|---|---|---|
| RFC 9457 problem+json | RFC 9457 | **ADMIT** (already in contract §0.3, fourier NOT-YET; C1 §6 defect 6) | Pure-rule SOTA; one-time envelope migration; pays for itself. |
| RFC 9110 ETag + If-Match | RFC 9110 §8.8, §13.1.1 | **ADMIT** (contract §0.2; W3 helper `etag.require_if_match`) | Strong-validator concurrency on `PATCH`/`DELETE`; ~30 LOC helper. |
| RFC 4648 base64url cursors | RFC 4648 §5 | **ADMIT** (contract §0.1; both repos already incidentally — C1 substrate confirms) | Idiomatic; helper exists in spec. |
| RFC 9239 RateLimit headers | RFC 9239 draft | **ADMIT** (contract §0.6) — newly named for W4 admin / list endpoints | Existing rate-limiter is single-replica per invariant 12; SOTA exposes the budget on every response without changing topology. |
| RFC 8288 Link header `rel="next"/"prev"` | RFC 8288 | **ADMIT** (contract §0.5) | Cursor pagination already; the Link header is the standards-compliant projection. |
| Idempotency-Key (draft-ietf-httpapi-idempotency-key-header) | IETF draft | **ADMIT** (contract §0.4; W3 helper `idempotency.idempotent`) | 24-hour replay map; in-process state; KISS-compatible. |
| MongoDB Change Streams (7.0) | MongoDB | **REJECT** | Janitor polls every 6 h on bounded queries (contract §8); change streams would replace a working KISS path with replica-set + resume-token state. Framework-in-spirit. |
| Time-series collections for `admin_audit` | MongoDB | **DEFER** | Pays at >10⁶ rows; current 90-day retention is well bounded. Route to fourier-C if audit volume grows. |
| Pydantic v2 + msgpack on batch endpoints | Pydantic v2 | **REJECT** | Batch shapes are small (≤ 100 slugs per call); JSON is sufficient; msgpack is overengineering for fourier's scale (invariant 16). |
| Tanstack Query / SWR | TC39 + 3p | **REJECT** | Bespoke Pinia gallery store is ≤ 300 lines; a query-cache layer is control-inversion (the rot pattern invariant 16 forbids). |
| TC39 `Iterator.from` + `take`/`drop` (stage-3) | TC39 | **DEFER** | Once Vite/Node baseline lands at stage-4; current cursor pagination is fine. |
| WebTransport / SSE for compute notifications | WHATWG | **REJECT** | No long-running compute over HTTP in fourier; basis-decomposition is < 1 s; polling is invisible. |
| JSON Schema 2020-12 `unevaluatedProperties: false` | JSON Schema | **ADMIT** (already implicit in Pydantic v2 `model_config = {"extra": "forbid"}`) | Free strictness; W3 request models. |
| Argon2id for `ADMIN_TOKEN` | RFC 9106 | **REJECT** (current: bearer + `hmac.compare_digest`) | Static env-var bearer; Argon2 is for user-set passwords, not env vars. Out of scope until ADMIN_TOKEN becomes user-set. |
| pnpm workspaces for dev-resolution | pnpm | **ADMIT** (already on contract-v2 per HEAD `926ca6a`) | Modern shape; already adopted in the consumer half. |
| HTTP/3 / QUIC | RFC 9114 | **REJECT** | Overengineering for fourier's scale; out of scope. |

**Tally**: ADMIT = **8**; REJECT = **6**; DEFER = **2**.

## §5 — KISS rejections re-validation

| Rejection | Origin | Status | Notes |
|---|---|---|---|
| HATEOAS / hypermedia | CRUD-CONTRACT §0 | **HOLDS** | No client demands link discovery. |
| JSON:API envelope | §0 | **HOLDS** | `data + nextCursor + hasMore` is two-thirds the spec at one-tenth the ceremony. |
| GraphQL | §0 | **HOLDS** | Single-shape consumer. |
| Webhooks / event-sourcing / CQRS | §0 | **HOLDS** | No second consumer. |
| Codegen (OpenAPI → SDK) | §0 / invariant 16 | **HOLDS** | Contract is text; the Wχ-P1 probe passes at 0 % code-fraction. |
| JWT / PASETO | implicit (contract §6) | **HOLDS** | Opaque UUIDv4 + header is sufficient; no cross-service token validation need. |
| ULID / UUIDv7 | implicit | **HOLDS** | UUIDv4 + slug is the addressing pair; sort-order requirements satisfied by `_id`/`created_at`. |
| BLAKE3 | implicit | **HOLDS** | SHA-256 is the binding hash; BLAKE3 is faster but the hash is not a hot path. |
| Tombstone collection (separate `deleted_*` collection) | §5 | **HOLDS** | Single-field write of `deleted_at` is the contract; separate collection is the rot pattern. |

**KISS-rejection re-validation outcome**: **9 of 9 HOLD**. No re-evaluation warranted.

## §6 — Orphan-verdict-resurgence preventers

| Preventer | Locus | Present? |
|---|---|---|
| CRUD-CONTRACT is a future-cohort affordance (contract text survives orphan) | `CRUD-CONTRACT.md` head note (lines 10–17) | **YES** |
| `slug-words.json` lives at `docs/precepts/data/slug-words.json` (submodule, neutral data) | `SLUG-WORDS.md §1`; C3 §6 recommendation 2 | **YES** (spec); FILE NOT YET LANDED — W3-owed |
| CONFORMANCE-MATRIX value.js rows held DEFERRED (not deleted) | `CONFORMANCE-MATRIX.md:515` amendment | **YES** |
| Orphan-verdict banner at head of `CRUD-CONSTELLATION.md` | lines 3-22 | **YES** |
| Named-residual destination on `colors.ts` / `easings.ts` / value.js bump | B.md §7; W4.b orphan-verdict-primary sub-gate | **YES** |

**Preventer status**: **5 of 5 in place** at spec level; one (slug-words.json data file) is owed at W3 close.

## §7 — High-confidence ADMITs + B-wave routing

The three high-confidence ADMITs from §4, ranked by KISS-fit × paid-for-itself:

1. **RFC 9457 problem+json envelope** → **B.W1 (contract ratification) + B.W3 (`api/lib/crud/errors.py`)**. Helper exists in CRUD-LIB-PY spec; the migration is one envelope change, one helper, one tight grep gate (≥ 5 `errors.problem` sites in `visualizations.py` per W3 hard gate). Discharges contract §11.
2. **RFC 9110 ETag + If-Match** → **B.W3 (`api/lib/crud/etag.py` + `visualizations.py`) + B.W4 (consumer adoption: `gallery.ts`/`workspace.ts` send `If-Match` on `PATCH`/`DELETE`)**. Optimistic concurrency without sessions storage; the helper is ~30 LOC; the W3 hard-gate already binds ≥ 2 `etag.require_if_match` sites.
3. **RFC 9239 RateLimit headers** → **B.W4 (admin router + list endpoints; expose `RateLimit-Limit/Remaining/Reset`)**. The Option A "documented single-replica" rate-limiter exposes its budget over the wire; no topology change; the headers make the single-replica honest at the response boundary. ~15 LOC of middleware.

(Secondary ADMITs — RFC 4648 base64url cursors, RFC 8288 Link header, Idempotency-Key, JSON Schema `extra=forbid`, pnpm workspaces — are already covered by extant spec or extant adoption; they require no new B-wave routing.)

## §8 — Final risk matrix (severity × wave)

| Risk | Wave | Severity | Disposition |
|---|---|---|---|
| Migration data-loss on 5-identity → 1-entity carve | W3 | **HIGH** | Must absorb at W3 — `audit/migration-counts.md` + seed=42 spot-check + legacy-survives-to-W5 rollback substrate are the binding mitigations (already in W3 spec). |
| Within-wave brittleness window on W3 | W3 | **HIGH** | Must restore in same wave (B.md §8); cannot W5-close while open. |
| Wχ-P1 framework-in-disguise (utility-tier drift) | Wχ | **HIGH** | C3 §4 reports 0 % code-fraction; P1 passes — discipline only holds if the W3 / W4 hard-gates fire (helper-adoption proofs; LOC ≤ 525). |
| W2 a11y gates slip past initial pass without axe-core | W2 | **HIGH** | Must absorb — fold axe-core wiring forward from W4.d into W2's hard-gate so invariant-18 lands with measurement (L6 §4 FLAG-GAP). |
| Helper-adoption is shape-only, not actually consumed (framework-in-disguise resurgence at adoption boundary) | W4 | MEDIUM | W4 hard-gate items 9 (≥ 3 imports in `admin.py`; ≥ 10 helper sites) bind this — carry to W5 close. |
| Batch return shape migration (`{ok,affected}` → `{processed,errors[]}`) is a frontend-breaking change | W4 | MEDIUM | Discharge with paired commit on `api.ts` consumer + endpoint; no silent drift. |
| Chronic-resurgence: infrastructure standardisation never lands | fourier-C territory | MEDIUM-DURABLE | Honest acceptance: not B's load. Route to fourier-C. |
| Chronic-resurgence: image-blob redesign never lands | fourier-C territory | MEDIUM-DURABLE | Same. |
| value.js never re-engages → seven contract surfaces stay DEFERRED | cross-repo | LOW (latent) | Preventers in place; no silent decay. |
| Session TTL 7 → 30 days extension on live sessions (W4 one-line bump) | W4 | LOW | Idempotent one-line config + live-session `expires_at` extension. |
| Legacy-collection rename at W5 close is irreversible | W5 | LOW | Single irreversible step; gated by W3-close evidence. |

— *Final report*: per-wave risks = **9 waves / 5 HIGH-instances / 4 MEDIUM-instances**; chronic-resurgence at B authoring = **0**, durable = **2** (fourier-C-bound); ADMIT = **8**; REJECT = **6**; DEFER = **2**; KISS rejections re-validated = **9 of 9 HOLD**. Top-3 ADMITs: **RFC 9457 problem+json → B.W1 + B.W3**; **RFC 9110 ETag + If-Match → B.W3 + B.W4**; **RFC 9239 RateLimit headers → B.W4**.

— *end C6*
