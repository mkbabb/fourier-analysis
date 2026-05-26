# 2026-05-19 — CRUD-deepen round synthesis (fourier-B + value.js-C cohort spec authoring)

This is the synthesis lane (→ `glossary/meta-terms.md §"Synthesis lane"`) for the six-agent CRUD-deepen round. Six SOTA-grade parallel agents authored the cross-repo CRUD spec corpus directly into the tranche folders — the cohort binding fourier-B (the **CRUD convergence ⇄ value.js (research-first)** tranche) ⇄ value.js-C (the **Palette CRUD facility (peer to fourier-B)** tranche). **4,200+ lines** across 12 new files. The cohort is now bound by a written specification, a machine-readable schema, a conformance matrix, three deep research documents, and six WAVE_SPEC-compliant wave specs (each conforming to `tranche/WAVE_SPEC.md` — the per-wave document format).

---

## §0 — Goal criterion and completion criterion (paired) for the CRUD-deepen round

Per the project's paired-criterion discipline (→ `docs/precepts/instructions/TRANCHE-AND-WAVE-SPEC.md §"Goal criterion + completion criterion (paired)"`), the round declares both.

**Goal criterion.** Land the spec substrate the cohort needs to dispatch implementation without further design rounds. The aim is spec-completeness: a written contract precise enough that fourier-B.W1 (the **Shared CRUD contract** wave) and value.js-C.W2 (the **palette-api alignment** wave) can each close on evidence rather than narrative; a machine-readable schema that both repos consume; a conformance matrix that gates fourier-B.W1's close at row-level evidence; deep research documents that close the design space across identity, auth, and lifecycle; six wave specs that match the per-wave document format.

**Completion criterion.** Six artefact files plus six wave specs landed under the named paths in §"Files written" below (total 4,241 lines); nine architectural decisions ratified with single binding criteria (no OR-paths — the keystone-discipline → `glossary/meta-terms.md §"OR-path discipline"`); nine KISS rejections recorded with rationale; three bonus findings filed to named destinations; the §10 conformance matrix carries 118 rows × 2 repos. The round closes when this synthesis cites each artefact and PROGRESS entries land in fourier-A, fourier-B, and value.js-C.

Both criteria hold at this writing.

---

## §1 — Agents and artifacts

Six parallel agent units (→ `glossary/meta-terms.md §"Agent unit"`), each carrying a numbered index and a noun-phrase title naming the slice it authored. Per the agent-unit discipline, bare positional refs are invalid in plan tables and dispatch packets; the table below names what each unit produced.

| Agent | Slice | Artifact | Lines |
|---|---|---|---|
| **A1 — CRUD-CONTRACT central spec** | the 13-section written contract that binds both repos | `docs/tranches/B/coordination/CRUD-CONTRACT.md` | 973 |
| **A2 — Identity, slug, hash deep-research** | the keyspace, slug pattern, collision handling, internal ID, content hash, URL shape decisions | `docs/tranches/B/research/R-identity-spec.md` | 665 |
| **A3 — Auth, sessions, admin deep-research** | the session token, anonymous publish, authorization policy, batch return shape, rate limit decisions | `docs/tranches/B/research/R-auth-spec.md` | 473 |
| **A4 — Visibility, soft-delete, cron, migration deep-research** | the visibility states, soft-delete grace, cron cadence, migration contract decisions | `docs/tranches/B/research/R-lifecycle-spec.md` | 544 |
| **A5 — Six wave specs (B.W1/W3/W4 + C.W1/W2/W3)** | the WAVE_SPEC-compliant wave docs covering both repos | `docs/tranches/B/waves/W{1,3,4}.md` + `value.js/docs/tranches/C/waves/W{1,2,3}.md` | 529 total |
| **A6 — Schema + conformance matrix** | the OpenAPI 3.1 + JSON Schema 2020-12 substrate plus the 118-row gate matrix | `docs/tranches/B/coordination/SCHEMA.md` + `CONFORMANCE-MATRIX.md` | 754 + 303 |

---

## §2 — Ratified decisions

The decisions below each carry a single binding criterion (the OR-path discipline; → `glossary/meta-terms.md §"OR-path discipline"`). A keystone's measured gate has exactly one binding criterion; the wave does not declare a fallback that lets it pass under a weaker condition.

### Identity (R-identity-spec + CRUD-CONTRACT §1 + §2)

- **Slug pattern**: `^[a-z]+(-[a-z]+){3}$` — exactly 4 words, length 7-60.
- **Keyspace**: 120 × 120 × 128 × 128 ≈ 2.36 × 10⁸ — birthday-safe through ~10⁵ entities.
- **Collision handling**: insert-then-catch `DuplicateKeyError`, 10 retries, 503 on exhaustion.
- **Internal ID**: Mongo `ObjectId` (sufficient monotonicity for cursor pagination) — ULID / UUIDv7 / KSUID / snowflake rejected.
- **Content hash**: SHA-256 — BLAKE3 rejected by KISS (BLAKE3 saves ~25 μs per hash but adds a Rust build dep to fourier).
- **URL shape**: `/visualizations/{slug}` (API canonical) + `/v/{slug}` (short web).
- **Shared word-list**: **admitted** via R3 admit-rule (size ~6 KB ≤ 10 KB; drift = correctness bug; pure JSON). Form: `@mkbabb/slug-words` npm + PyPI mirror.

### Auth (R-auth-spec + CRUD-CONTRACT §3 + §6 + §7)

- **Session token**: opaque UUIDv4 in `X-Session-Token` header; Mongo session store; 7d absolute TTL; no refresh. **JWT and PASETO rejected** — JWT brings revocation pain for zero gain; both repos already converge on opaque tokens.
- **Anonymous publish**: **rejected**. `POST /visualizations` and `/publish` require a session; frontend `ensureUser()` mediates so the user never sees a login wall. Synthesised `anon-NNN` owners rejected (new identity class to satisfy an invariant we can already enforce). One-time `anon-migrated-NNN` backfill for legacy `user_slug: None` rows.
- **Authorization**: 8-row policy table, five-actor model (`public / session / owner / admin`), closed-by-default, middleware-enforced.
- **Batch return shape**: `{ok: true, affected: N, errors: []}` — fourier's `affected` verb wins over value.js's `processed`; `errors[]` always-present, forcing partial-failure handling. Resolves the H3 contract bug (the `web/src/lib/api.ts:526,537` shape mismatch surfaced at the 2026-05-18 hardening pass).
- **Rate limit**: A.W4 Option A inherited (the single-replica, process-local sliding-window approach landed in fourier-A.W4 — the **Scaling, KISS & correctness pass** wave); SHA-256-hashed-IP keyed. `X-RateLimit-*` headers + `Retry-After` on 429.

### Lifecycle (R-lifecycle-spec + CRUD-CONTRACT §4 + §5 + §8 + §11)

- **Visibility**: 3-state `draft / unlisted / public`, NOT NULL default `draft`. Draft returns 404 to non-owners.
- **Soft-delete**: `deleted_at` timestamp field (NOT tombstone-collection). 30-day grace, matching existing `session_ttl_days`. Owner-restore endpoint; cron hard-delete after grace; hard-delete prohibited outside admin/cron.
- **Cron**: in-process asyncio / setInterval retained at 6h cadence. **Load-bearing pattern: per-doc `pinned: bool` flag** replacing both repos' unbounded `$nin` queries. Janitor query becomes `{pinned: false, last_accessed_at: {$lt: cutoff}}` — bounded, index-friendly. Storage-budget eviction retired.
- **Migration**: three-artefact contract per invariant 17 (the cohort invariant that migration is verified, not hoped) — idempotent backfill + post-condition verification + (reversible OR completeness-proof). Single-file scripts, query-filter idempotency, no transactions.
- **Image-blob**: **deferred to fourier tranche C** (the **Infra + image-blob-out-of-Mongo** tranche per R6 scoping). Rationale: B's thesis is identity convergence, not storage architecture. value.js has no peer image-blob story (no cohort symmetry). Candidate set ordered (KISS): filesystem+nginx > GridFS > MinIO > managed S3.

### Schema (SCHEMA.md)

- OpenAPI 3.1 + JSON Schema 2020-12.
- 2 entities (`Visualization`, `Palette`) + 4 request shapes + 4 palette building blocks.
- 6 shared types (`Slug`, `OwnerSlug`, `Timestamp`, `ContentHash`, `Cursor`, `Problem`).
- Error catalog: full `urn:contract:*` problem-type URIs with status + title + semantics. Added 428 `precondition-required` for ETag-no-If-Match.

### Conformance (CONFORMANCE-MATRIX.md)

- **118 rows / 59 unique assertions × 2 repos** = the §10 gate for fourier-B.W1 — the **Shared CRUD contract** wave.
- Distribution by contract section: §1 Identity (6); §2 Slug (8); §3 Ownership (8); §4 Visibility (14); §5 Soft-delete (10); §6 Sessions (8); §7 Admin (12); §8 Cron (10); §9 Shared-vs-code (6); §11 Migration (6). Plus 30 schema-derived rows (§S1–§S7).
- **Close-rule**: every row reads `PASS` in both `fourier evidence` and `value.js evidence` columns or the section is "drafted, not ratified". fourier-B.W1 cannot close otherwise.

### Wave specs (A5)

- All six WAVE_SPEC-compliant (9 sections each).
- Hard gates close on evidence (the discipline that a hard gate is verifiable by an artefact; → `glossary/meta-terms.md §"Hard gate"`): test names + run commands, `git grep` deletion proofs, `npm view` / `npm dist-tag` publication checks, Playwright spec + viewports, build outputs.
- B.W4 (the **fourier convergence wiring** wave) fallback contract explicit: if value.js-C.W1 — the **library Palette** wave — is not published at dispatch, land everything except `colors.ts` gut; residual becomes named B-residual.

---

## §3 — SOTA conventions adopted

1. **problem+json error envelope** (RFC 9457).
2. **Cursor pagination** with base64url-encoded opaque payloads (RFC 4648 §5; precedent at `~/Programming/value.js/api/src/routes/palettes.ts:29-41` and `api/routers/gallery.py:57-71`).
3. **ETag + `If-Match`** optimistic concurrency (RFC 9110 §8.8, §13.1.1).
4. **`Idempotency-Key`** header for POST.
5. **`Link` header** (RFC 8288) for pagination.
6. **`RateLimit-*` headers** (RFC 9239 draft) + `Retry-After`.
7. **Slug-only URLs** — Mongo `_id` never exposed.

---

## §4 — KISS rejections

Nine architectural shapes the round considered and rejected. Each rejection carries a rationale; the discipline forbids carrying forward over-spec scaffolding (per cohort invariant 16 — the framework-rejected clause).

1. **HATEOAS / hypermedia controls** — over-spec for two-language convergence.
2. **JSON:API envelope** — bare `{data, next_cursor, prev_cursor, has_more}` already at `palettes.ts:277-290` is two-thirds the spec at one-tenth the ceremony.
3. **Codegen / shared `crud-types` package** compiled to both languages — invariant 16 prohibits.
4. **GraphQL, webhooks, event sourcing, CQRS.**
5. **Third coordinating service** (Redis / NATS / Kafka) — invariant 12 prohibits superfluous cloud.
6. **JWT / PASETO** — opaque tokens + Mongo session store wins on revocation + simplicity.
7. **ULID / UUIDv7 / KSUID / snowflake** — Mongo ObjectId sufficient.
8. **BLAKE3** — SHA-256 already shipped both sides; perf delta immaterial.
9. **Tombstone collection** — `deleted_at` field is simpler at this scale.

---

## §5 — Bonus findings (filed, not in B scope)

- **value.js impersonation endpoint missing `expiresAt`** — un-expiring session, correctness bug. Filed to value.js-B `FINAL.md §debt` or a value.js follow-up.
- **fourier `SLUG_PATTERN` at `api/dependencies.py:27` misnamed** — validates only image slugs with the lax `^[a-zA-Z0-9][-a-zA-Z0-9]{2,80}$`. CRUD-CONTRACT §2 unifies under the 4-word pattern.
- **Anonymous orphan migration loophole** — `anon-migrated-NNN` owner-slug class deliberately violates the 4-word pattern; flagged for fourier-B.Wχ — the **Challenge wave** — as the only contract exception.

---

## §6 — What is now harder

- **fourier-B.W1 — Shared CRUD contract close = 118 conformance rows × 2 repos must read PASS**. The §10 matrix is the gate.
- **No silent narrative gates**. Every wave spec hard gate has a named test, command, or grep.
- **value.js-C.W2 — palette-api alignment** close requires retiring the `formatPalette ??` fallback on 7 fields (not 4, per R-identity-spec re-count).
- **Cron must implement the per-doc `pinned` flag in both repos before close**. value.js inherits the A.W4 invert (the **Scaling, KISS & correctness pass** wave's janitor work).

## §7 — What is now softer

Nothing. Every change tightened or specified — no relaxation. The round holds the line per the OR-path discipline.

## §8 — Files written

| Path | Lines |
|---|---|
| `docs/tranches/B/coordination/CRUD-CONTRACT.md` | 973 |
| `docs/tranches/B/coordination/SCHEMA.md` | 754 |
| `docs/tranches/B/coordination/CONFORMANCE-MATRIX.md` | 303 |
| `docs/tranches/B/research/R-identity-spec.md` | 665 |
| `docs/tranches/B/research/R-auth-spec.md` | 473 |
| `docs/tranches/B/research/R-lifecycle-spec.md` | 544 |
| `docs/tranches/B/waves/W1.md` (the **Shared CRUD contract** wave spec) | 71 |
| `docs/tranches/B/waves/W3.md` (the **fourier `visualization` entity + migration + `api/lib/crud/` utility module landing** wave spec) | 94 |
| `docs/tranches/B/waves/W4.md` (the **fourier convergence wiring** wave spec) | 97 |
| `~/Programming/value.js/docs/tranches/C/waves/W1.md` (the **library `Palette` + `colorScale` + `sampleToSVGPath`** wave spec) | 94 |
| `~/Programming/value.js/docs/tranches/C/waves/W2.md` (the **palette-api alignment + `api/src/crud/` utility module landing** wave spec) | 97 |
| `~/Programming/value.js/docs/tranches/C/waves/W3.md` (the **Demo native Palette consumption** wave spec) | 76 |
| **Total new lines** | **4,241** |

Plus PROGRESS log entries in fourier-A (the **Cohort attribution, style abrogation, admin parity** tranche), fourier-B (the **CRUD convergence ⇄ value.js** tranche), value.js-C (the **Palette CRUD facility** tranche), and this synthesis.

---

## §9 — Closing tally

Twelve new files; 4,241 lines; nine ratified architectural decisions; nine KISS rejections; three bonus findings filed; six wave specs hardened to WAVE_SPEC compliance with evidence-form hard gates. Tranche B (the **CRUD convergence** tranche) and value.js-C (the **Palette CRUD facility** tranche) are now spec-complete pending joint Wχ — the **Challenge wave**. The cohort can dispatch implementation as soon as the predecessor tranches (fourier-A — the **Cohort attribution, style abrogation, admin parity** tranche; value.js-B — the **Close A, simplify, complete the AND** tranche) close.

> **Forward note (2026-05-26):** the CRUD-deepen spec corpus survived into the R4 refinement-assay round, but its ratification by value.js side never executed — D, E, F, G shipped under different theses, value.js-C never opened, and the cohort dissolved. The contract document remains a fourier-internal coherence artefact; the conformance matrix's §10 close-gate is structurally unmeetable absent a value.js sign-off that did not land. See `~/Programming/value.js/docs/tranches/C/FINAL.md §2 Axis 3` for the dissolution record and `~/Programming/fourier-analysis/docs/audits/runs/2026-05-19-refinement-assay/r4-valuejs-C-refinement.md` for the R4 verdict. This forward note preserves the *outcome* of the present round (spec-complete) while recording its later disposition; the present synthesis's findings are unchanged.
