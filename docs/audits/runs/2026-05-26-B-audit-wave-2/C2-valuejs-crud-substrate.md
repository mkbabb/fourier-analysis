# C2 — value.js CRUD substrate audit (Wave 2)

## §0 — Goal + completion criterion

**Goal.** Audit value.js's current CRUD substrate at HEAD (v0.10.0) — the parallel facility raced from C → H without ever opening C — and produce the substrate-of-record that fourier-B's convergence plan validates against. Distinguish what value.js empirically ships from what the cross-repo CRUD-CONTRACT presumes.

**Completion.** (a) all nine `palette-api` Mongo collections enumerated with file:line citations; (b) per-noun lifecycle table for `palette`, `palette_version`, `session`, `user`, `vote`, `flag`, `tag`, `proposed_name`, `admin_audit`; (c) the 13 CRUD-CONTRACT sections each scored CONFORMS / DRIFT / NOT-YET with the tranche-of-landing recorded; (d) the six incidental landings identified by name; (e) gap count for B convergence enumerated; (f) implication paragraph for fourier-B's plan rendered.

## §1 — Substrate observed

HEAD: value.js v0.10.0 (`package.json:3`). Stack: Hono + `@hono/node-server` + MongoDB driver + `node-cron`; entry at `api/src/index.ts:22-83`. Nine collections, indexes declared idempotently at `api/src/db.ts:40-93`. The library proper (`src/`) exports zero palette domain types; `find ~/Programming/value.js/src -name 'palette*'` returns empty (FINAL.md Axis 2 deletion-proof). The api service-layer wears the D.W2 pipeline shape: `validate (zod) → authn → authz → service → repository → format → response`. Errors carry typed `ApiError` subclasses (`api/src/errors/index.ts:23-83`) mapped to `{ error: { code, message, detail? } }` envelope by `toResponseEnvelope` (`errors/index.ts:106-121`).

## §2 — Per-noun lifecycle

| Noun | C / R / U / D / List | Slug | Ownership | Cron | Landed in |
|---|---|---|---|---|---|
| **palette** | POST `/palettes`, GET `/:slug`, PATCH (owner-gated), DELETE (owner-gated; hard), GET `/` (offset+cursor); `routes/palettes/crud.ts:33-127` | user-supplied client-side; validation `^[a-z0-9][a-z0-9-]*$` `validation/palette.ts:23` | `userSlug` required via `requireOwnership` middleware (`middleware/require-ownership.ts`) | none (no soft-delete reaper) | A (legacy) / D (split) |
| **palette_version** | implicit on palette create+patch via `services/palette/versions.ts`; `currentHash`+`parentHash` Merkle chain | `_id = sha256` content hash (`hash.ts:8-17`) | inherits palette's `authorSlug` | none | A / D |
| **session** | POST `/sessions` (register), POST `/sessions/login`, DELETE, GET `/me` (`routes/sessions.ts`); 7d TTL (`services/session/auth.ts:35`) | UUID v4 (`crypto.randomUUID()` `auth.ts:63`); `X-Session-Token` header (`middleware/resolve-session.ts:29`) | n/a (is the owner) | `cron.ts:20-34` sweeps expired + 30d-stale | A / E (pipeline) |
| **user** | created with first session via `withTransaction` (`auth.ts:74-94`); GET `/me`; admin: list/suspend/delete | `_id = adjective-verb-color-animal` (`slugWords.ts:85-89`) | n/a | none (deletion cascades sessions) | A / D / G (transactions) |
| **vote** | POST `/:slug/vote`; unique `(userSlug, paletteSlug)` (`db.ts:61`) | ObjectId | `userSlug` required | orphaned sweep `cron.ts:28-29` | A / E |
| **flag** | POST `/:slug/flag`; unique `(paletteSlug, reporterSlug)` (`db.ts:84-86`) | ObjectId | `reporterSlug` required | none | A / D |
| **tag** | admin CRUD `/admin/tags`; cascade-removes from palettes | ObjectId; `name` unique | admin-only | none | D |
| **proposed_name** | community-named CSS colours (`services/color/proposals.ts`) | ObjectId; `name` unique | optional `contributor` | none | A |
| **admin_audit** | append-only via `events/auditLog.ts:emitAuditEvent` | ObjectId | admin actor | none | D (typed events) |

## §3 — Session + auth + admin

Sessions: opaque UUID v4, header `X-Session-Token`, Mongo `sessions._id = token`, sliding `lastSeenAt` touch on every authenticated request (`resolve-session.ts:34-38`), 7d explicit `expiresAt` (`auth.ts:35`). 60s LRU cache on suspended-user lookups (`resolve-session.ts:24-26`). Login carries a 200ms constant-time padding to flatten user-existence timing (`auth.ts:38,117`). Admin auth: `ADMIN_TOKEN` bearer; `adminAuth` middleware bound once at `routes/admin/index.ts:35`; 8 concern sub-routers (colors, palettes, users, impersonate, batch, tags, flagged, audit). Audit log present and structured: `AdminAuditEvent { timestamp, action, ipHash?, target?, actorSlug?, payload? }` (`models.ts:174-186`).

## §4 — CRUD-CONTRACT alignment (13 sections)

| § | Topic | Verdict | Evidence | Landed |
|---|---|---|---|---|
| 1 | Slug pattern `^[a-z]+(-[a-z]+){3}$` | **CONFORMS** (users) / **DRIFT** (palettes) | user slugs match exactly (`slugWords.ts:85-89`); palette slugs accept any `[a-z0-9-]` (`validation/palette.ts:23`) | A |
| 2 | Content hash SHA-256 over (name, colors) | **CONFORMS** | `hash.ts:8-17` canonicalises name-lowercase + position-quantised colors | A |
| 3 | Session: UUID4 + `X-Session-Token` + Mongo + 7d TTL | **CONFORMS** | `auth.ts:35,63`; `resolve-session.ts:29` | A / E |
| 4 | Required owner, no anonymous publish | **DRIFT** | `createPalette` accepts `userSlug: null` (`services/palette/crud.ts:69-90`); legacy `sessionToken` shim still in document model (`models.ts:74`) | A |
| 5 | Batch return `{ok, affected, errors}` | **DRIFT** | returns `{ processed: number }` only (`services/admin/batch.ts:20-22`) | D |
| 6 | Visibility 3-state `draft\|unlisted\|public` | **DRIFT** | 4-state `published\|featured\|hidden\|draft` (`models.ts:29`); no `unlisted` state | A |
| 7 | Soft-delete `deleted_at` + 30d grace | **NOT-YET** | zero hits for `deleted_at` across `api/src/`; `deletePalette` is hard delete inside a transaction with vote/flag cascade | — |
| 8 | Cron: bounded pinned-flag predicate, no `$nin` | **CONFORMS-IN-SPIRIT** | `cron.ts:20-34` rewritten in E.W2 Lane A; orphan-vote sweep bounded by positive `palettes.listAllSlugs()` (`cron.ts:28-29`); no `$nin` | E |
| 9 | Request envelope conventions | **CONFORMS** | typed `ApiError` → `{ error: { code, message, detail? } }` (`errors/index.ts:106-121`) | D |
| 10 | Pagination (cursor vs offset) | **CONFORMS** | both supported; cursor via `findManyForCursor(limit+1)` (`repositories/palette.ts:43-49`); validation `listPalettesQuery` (`validation/palette.ts:79-92`) | D |
| 11 | Error contract RFC 9457 problem+json | **NOT-YET** | envelope is custom `{ error: {...} }`, not `application/problem+json` (zero hits for `problem+json` across `api/src/`) | — |
| 12 | Versioning / ETag (`If-Match`) | **NOT-YET** | zero hits for `etag`/`If-Match`; palette versions exist as a separate collection but no HTTP-level ETag | — |
| 13 | Idempotency-Key replay map | **NOT-YET** | zero hits for `Idempotency` across `api/src/` | — |

## §5 — Orphan-verdict empirical confirmation (the six incidental landings)

`tranches/C/PROGRESS.md` and `tranches/C/FINAL.md §8` confirm: C is RETIRED, zero waves executed, planning artefact only. The six contract surfaces value.js's substrate empirically *fulfils* — regardless of attribution — are:

1. **§2 content hash** — SHA-256 with canonical pre-image (`hash.ts`, A-lineage);
2. **§3 sessions** — UUID4 + `X-Session-Token` + 7d + sliding `lastSeenAt` (A-lineage, pipeline-migrated in E.W2 Lane A);
3. **§8 cron bounded** — D.W2 Lane D `assertMigrationsApplied` smoke probe + E.W2 Lane A repository-pattern cleanup with positive-list `palettes.listAllSlugs()` (commit `417c3a5`);
4. **§9 envelope** — typed `ApiError` subclasses + `toResponseEnvelope` (D.W2 Lane C #3, commit `626b107`);
5. **§10 pagination** — cursor + offset both validated through `zod` (D.W2 Lane A);
6. **§1 slug shape (users only)** — `adj-verb-color-animal` four-token form matches the contract regex exactly (`slugWords.ts:85-89`).

The remaining seven sections (§1 palette-slug drift, §4 required-owner drift, §5 batch-return drift, §6 visibility drift, §7 soft-delete absent, §11 problem+json absent, §12 ETag absent, §13 Idempotency-Key absent) constitute the empirical contract-gap.

## §6 — Gap inventory for B convergence

| B-side assumption | State | Evidence |
|---|---|---|
| Library `Palette` type | **ABSENT** | `find ~/Programming/value.js/src -name 'palette*'` empty; FINAL.md §2 Axis 2 |
| `colorScale(stops, t, opts?)` library export | **ABSENT** | not in `src/index.ts` exports |
| `sampleToSVGPath` library export | **ABSENT** | `src/math.ts:69` `cubicBezierToSVG` un-generalised |
| Shared `slug-words.json` precepts data | **ABSENT** | `api/src/slugWords.ts:4-21` carries hardcoded inline arrays; U2 spec never executed |
| `api/src/crud/` utility module (8 files per U4) | **OBVIATED** | D.W2 Lane C chose service+repository+errors+events+DI+zod (20 files / 1502 LoC, commit `626b107`); architectures not directly mergeable |
| `coordination/CRUD-CONTRACT.md` value.js sign-off | **ABSENT** | `find ~/Programming/value.js -name 'CRUD-CONTRACT.md'` returns nothing; never ratified |
| `deleted_at`/`unlisted`/ETag/Idempotency/problem+json | **ABSENT** | enumerated in §4 above |

Gap count: **seven structural absences** plus **seven contract-§ drifts/not-yets**.

## §7 — Implications for B's plan

The cross-repo cohort dissolved at value.js side; FINAL.md §5 records this and binds fourier-B.W4's fallback contract as the *primary* path (`colors.ts` gut canceled, `easings.ts` workaround permanent). value.js's substrate is structurally complete and pipeline-correct under its own (D / E) theses — but it conforms to **six of thirteen** contract sections, and the seven non-conformances are not random: they cluster on the SOTA-2026 conventions the contract proposes to upgrade *both* repos to (soft-delete grace, RFC 9457, ETag, Idempotency-Key, three-state visibility). Convergence remains warranted only if fourier-B chooses to (a) accept the contract as fourier-internal coherence (per R4 §5 recommendation) and stop requiring value.js sign-off, or (b) propose a narrower contract whose §-shape value.js already obeys (essentially §§ 2, 3, 8, 9, 10, plus the user-slug shape of §1) and treat the remaining seven as fourier-side aspirations. The cohort is no longer load-bearing; it is at most a one-way reference for fourier's own discipline. fourier-B should record this dissolution in `CRUD-CONSTELLATION.md` and proceed under its own primary contract.
