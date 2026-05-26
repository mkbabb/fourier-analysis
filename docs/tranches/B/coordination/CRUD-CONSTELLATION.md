# B — CRUD constellation: fourier-analysis ⇄ value.js

> **Status: HISTORICAL / PARTIALLY-DISCHARGED-AND-ORPHANED.**
>
> This binding records the cohort as it was *intended* to discharge — paired
> tranches in two repos, ratified contract at fourier-B.W1, value.js
> consuming the artefact at value.js-C. The cohort partially discharged
> against that intent. value.js raced past the rendezvous: value.js's own
> close (the cohort-anchor refinement assay catalogued at
> `docs/audits/runs/2026-05-26-refinement-assay/r1-assay.md` and
> `r4-valuejs-C-refinement.md`) landed before fourier-B could ratify the
> contract jointly. The cohort is therefore neither fully landed nor
> formally retired; it is left as an *orphan binding* — substance preserved
> below for archaeological honesty, future-discharge route named at the
> end.
>
> The document remains the substrate for B's close discipline (the 13
> sections of CRUD-CONTRACT outlined at the bottom remain authoritative for
> any successor tranche that picks up the cohort), but the *joint
> ratification* clauses (signature lines, value.js-C sign-off, the
> §10-close-rule's "both columns PASS" gate) are now historical artefacts.
> The constellation does not bind work after 2026-05-26.

## Goal of this document (historical aim)

The document was authored to bind two repos to one cohort — to be the
substrate for everything fourier-B did and the closure record fourier-B
cited at close. That aim is now superseded: the cohort discharged
asymmetrically (value.js advanced; fourier-B held), and the binding now
serves as a record-of-intent and a hand-off pointer to whoever picks up
the orphaned half.

## Completion criterion (historical)

At authoring, completion meant: every convergence target either *landed*,
*discharged with rationale*, or *named for a successor tranche*. Per the
orphan verdict the actual completion is: targets that landed are
preserved here verbatim; targets that did not land are now classified
under the orphan-discharge note in the §Authority block at the foot of
this document.

## Cohort identity

| Field | Value |
|---|---|
| Cohort | CRUD facility convergence + identity-model consolidation |
| Repos | `fourier-analysis` (Python/FastAPI), `value.js` (Node/Express + Vue library) |
| Cross-repo relationship | **peer** — not substrate/consumer. Each repo authors its own tranche side; both conform to one shared contract. |
| fourier tranche | **B** — fourier-analysis's identity-and-CRUD convergence tranche; this document set lives at `/Users/mkbabb/Programming/fourier-analysis/docs/tranches/B/` |
| value.js tranche | **C** of the value.js sequence (`~/Programming/value.js/docs/tranches/C/`) — the value.js-side CRUD convergence tranche. value.js-B was already in flight with a non-CRUD thesis ("Close A, simplify, complete the AND"); the CRUD peer is therefore C. |
| Shared contract artefact | `coordination/CRUD-CONTRACT.md` — drafted in fourier-B.W1; *not* jointly ratified (see orphan verdict above) |

## Structural twins

Both repos run a Vue demo over a MongoDB-backed API with the same facility
shape, in two languages:

| Facility | fourier | value.js |
|---|---|---|
| API stack | Python/FastAPI (`api/main.py`) | Node/Express + TypeScript (`api/src/index.ts`, `package.json` "palette-api") |
| User-named noun | `visualization` (target — today: `snapshot` + `gallery` + `draft`) | `palette` |
| Slug system | `api/slugs.py` (adjective-noun-noun) | `api/src/slugWords.ts` + `migrate-slugs.ts` |
| Sessions | `api/routers/sessions.py` | `api/src/routes/sessions.ts` |
| Admin moderation | `api/routers/admin.py` | `api/src/routes/admin.ts` |
| Cleanup | `api/services/janitor.py` | `api/src/cron.ts` |
| Database | MongoDB | MongoDB |
| Hash / content-addressing | `api/services/image_storage.py` | `api/src/hash.ts` |
| Database wiring | `api/services/database.py` | `api/src/db.ts` |
| Types/models | `api/models/**` | `api/src/types.ts` |
| Middleware | `api/dependencies.py` | `api/src/middleware.ts` |

The duplication is exact in shape, in two languages. B was authored as
the convergence — by *contract*, not by framework (per invariant 16 of
fourier-B's plan).

## Convergence targets (provisional at authoring, hardened at Wχ)

### One — the shared contract (B.W1)

**Goal.** A written specification both backends conform to.

**Completion (at original authoring).** The default contents:

- **Slug algorithm** — adjective-noun-noun, the word-lists, collision-handling, the length and shape rules.
- **Identity** — one slug per user-named noun (invariant 11/14). Content hashes are dedup keys, not identity.
- **Ownership** — every persisted noun has a required owner; anonymous publish is explicitly admitted or explicitly forbidden, never silently producing orphans.
- **Visibility** — draft / unlisted / public lifecycle.
- **Soft-delete** — `deleted_at` field; cron grace period; restoration.
- **Sessions** — the user/session contract both APIs honour.
- **Admin moderation shape** — flag/dismiss/suspend/audit, the actions and their idempotency.
- **Cron policy** — what is pruned, when, with what query shape (never an unbounded `$nin`).

What this document does *not* contain: a shared CRUD framework, a code-generation step, a third coordinating service. Invariant 16 forbids them.

### Two — shared data (B.W1, conditional on Wα-R3)

**Goal.** Language-agnostic slug word-lists, located so both repos consume one source.

**Completion.** If research-lane R3 confirms KISS warrants it, the word-lists are extracted to a shared location (the most plausible: the precepts repo, or a small `@mkbabb/slug-words` data package) and both repos consume them. If R3 finds the lists are small enough that two copies cost less than one shared package, the default is two copies, kept in sync by the contract.

### Three — domain model in the library (B.W2)

**Goal.** value.js the library owns the colour/palette domain type and its pure operations; both demos consume it without re-implementing.

**Completion.** value.js the library hosts the colour/palette **domain type and pure operations** — `Palette` (ordered colour stops with named ramps), `colorScale(stops, t)`, `sampleToSVGPath(fn, n)`, palette serialize/deserialize, gamut-safe operations. Storage, ownership, slug-addressing stay in the consuming app (invariant 15). Both fourier and value.js's `palette-api` consume the same library type; neither re-implements it.

### Four — fourier `visualization` entity (B.W3)

**Goal.** One converged noun (`visualization`) replaces the three legacy collections (`snapshot` + `gallery` + `draft`).

**Completion.** Collapse snapshots + gallery + draft into one `visualization` collection. One slug; required owner; visibility; soft-delete. A migration script (per Wα-R5) moves existing data with a verified backfill.

### Five — convergence wiring (B.W4)

**Goal.** fourier consumers re-point at the new entity and the value.js facility; the admin surface lifted in A.W5 acquires the new data layer.

**Completion.** fourier consumers re-point at the new entity and the value.js facility; `web/src/lib/colors.ts` is gutted onto value.js's surface.

## Timing (historical — see orphan verdict)

```
2026-05-18    fourier-A planning            value.js-A planning, value.js-B planning
              ▼                             ▼
              fourier-A execution           value.js-A execution
              ▼                             ▼
              fourier-A close               value.js-A close (inside value.js-B.W0)
              ▼                             ▼
              fourier-B open                value.js-B execution (close-A + simplify)
              ▼                             ▼
              fourier-B.W0 → Wα → Wχ        value.js-B close
              (joint research+challenge;
               covers value.js too)
              ▼                                       ▼
              fourier-B.W1 (CRUD-CONTRACT.md          (waits)
               drafted — joint ratification
               not reached: see orphan verdict)
                                                      ▼
                                                      value.js-C open (had required
                                                      value.js-B close AND
                                                      fourier-B.W1 ratify — second
                                                      precondition was not met
                                                      before value.js raced ahead)
                                                      ▼
                                                      value.js-C ran its own course
              fourier-B.W3      [orphaned]            value.js-C.W1 ... close
              (fourier entity —
               did not consume the
               joint ratification)
              ▼                                       ▼
              fourier-B paused at the                 value.js's refinement assay
              rendezvous it had bound                 (r1, r4) crossed the gate
              jointly                                 without fourier-B's signature
```

The intended rendezvous was the joint ratification of `CRUD-CONTRACT.md`
at fourier-B.W1, with value.js-C consuming the ratified artefact and
the two tranches running their later waves in parallel. The actual
sequence diverged: value.js's refinement work (catalogued in r1-assay
and r4-valuejs-C-refinement) advanced past the gate while fourier-B
held; **fourier-B.W4 → value.js-C.W1 published** was the single hard
cross-repo dependency and that dependency was not consumed in the
shape the document anticipated.

`research/R6-timing.md` (cited at original authoring) produced the
intended firm sequence; the actual sequence is the one above.

## Authority — orphan verdict

This document was owned by fourier-B and was mirrored in citation by
value.js-C. The intent: edits at any wave boundary would be reflected in
both repos' `PROGRESS.md` at the same boundary, and at B close
(fourier-B.W5) this document would record the final disposition of every
convergence target — landed, discharged, or named for a successor
tranche.

**Per the 2026-05-26 refinement assay verdict, the cohort is now
partially-discharged-and-orphaned:**

- value.js's side advanced and closed under its own discipline (r1-assay
  records the assay; r4-valuejs-C-refinement records the refinement). The
  value.js half of the binding therefore has a real disposition.
- fourier-B's side held — its W1 contract drafting reached the contract
  artefacts (CRUD-CONTRACT, SCHEMA, CONFORMANCE-MATRIX, the U3/U4 utility
  specs, SLUG-WORDS) but did not reach joint ratification with value.js,
  because value.js had already raced past the rendezvous.
- The binding is therefore neither fully ratified nor formally retired —
  it is *orphaned*. Future picking-up of the cohort either (a) reopens
  the binding with a new value.js peer tranche on its own clock, or
  (b) accepts the value.js side as fait-accompli and rewrites the
  fourier-B side to consume rather than ratify.

The historical-status banner at the head of this document is the
authoritative current state. The 13-section CRUD-CONTRACT outline below
remains the substrate for any future binding (whether reopened jointly
or unwound to one-sided consumption).

## CRUD-CONTRACT.md outline (drafted at fourier-B.W1; section substance preserved verbatim)

The shared contract document was drafted at fourier-B.W1 with the
intention of joint value.js sign-off, lives in this folder as
`CRUD-CONTRACT.md`, and was to be read-only-referenced by value.js-C. The
13-section outline (per H4 hardening — §10 is load-bearing; without it
"ratified by contract" would be narrative) follows. Per the orphan
verdict, the *outline* remains the substrate of record; the *ratification
discipline* (the close-rule that fourier-B.W1 cannot close until every
section has a passing test row in both columns) is historical.

| § | Section | Content |
|---|---|---|
| 0 | Status | version, ratification commit hash (both repos), sign-off signatures |
| 1 | Identity | the single-slug rule (invariant 11/14); slug ↔ id ↔ content-hash separation; URL shape |
| 2 | Slug algorithm | the adjective-noun-noun rule; word-list location (per R3 admit decision); collision-handling; length/shape |
| 3 | Ownership | required non-null owner; anonymous-publish prohibition (or its explicit admission); session-to-owner mapping |
| 4 | Visibility | the 3-state enumeration `draft / unlisted / public`; lifecycle transitions |
| 5 | Soft-delete | `deleted_at` field; cron grace period; restoration path; hard-delete prohibition outside admin |
| 6 | Sessions | the user/session contract both APIs honour; session-token shape; expiry |
| 7 | Admin moderation | flag / dismiss / suspend / audit actions; idempotency; batch return shape |
| 8 | Cron / TTL | what is pruned, when, with what query shape — no unbounded `$nin`; per-doc `pinned` flag pattern |
| 9 | Shared-data-vs-code | R3's disposition table (per section: contract / data / library / service); the slug word-list disposition |
| 10 | **Conformance test matrix** (load-bearing) | one row per contract assertion × {fourier, value.js} × {test name, run command, expected output} — the literal close-on artefact for both peer tranches |
| 11 | Migration disposition | per legacy field/collection: backfill plan, verification, reversibility (invariant 17) |
| 12 | Open items / change log | post-ratification deltas, with destination per item (no silent deferral) |

§10's conformance matrix was the gate: a contract section without a
passing row in the matrix would have been drafted, not ratified.
fourier-B.W1 was intended not to close until every contract section had a
passing test row in both columns. Per the orphan verdict, this gate held
fourier-B at the W1 rendezvous while value.js advanced.

## Authority for the value.js side (historical)

value.js's peer tranche **C** was authored at
`~/Programming/value.js/docs/tranches/C/` (2026-05-18, alongside this
fourier-B authoring). value.js-C's `C.md`, `PROGRESS.md`,
`coordination/CRUD-CONSTELLATION.md` (mirror of this file), and
`research/README.md` were in place at the rendezvous-attempted date.
value.js-C was not to open until value.js-B closed (close lineage
A → B → C was canonical for value.js) AND fourier-B.W1 ratified
`CRUD-CONTRACT.md`. The same user owns both repos; the constellation
document was the only shared substrate at the contract layer, and each
repo authored its own tranche docs in its own sequence.

Per the 2026-05-26 verdict, value.js advanced under its own discipline
without consuming the joint ratification fourier-B was preparing. The
value.js half is closed; the fourier half is orphaned. Successor
disposition (reopen, retire, or unwind) is named for the next
fourier-side tranche that revisits the cohort.

## Wave-1 audit substrate (2026-05-26)

Authored after the orphan verdict but before any B implementation wave
dispatches, the six-agent Wave-1 audit corpus at
`docs/audits/runs/2026-05-26-B-audit-wave-1/{L1..L6,SYNTHESIS}.md` is
B's substrate-of-record at the B-development boundary. The synthesis
confirms — empirically, against HEAD `c7cfd82` — that the orphan-verdict
absorption across B's plan documents has held without drift: B.md §0 /
§3 / §6 / §7 carry the orphan overlay; the W4 fallback contract is
preserved verbatim; the value.js-side CONFORMANCE-MATRIX cells held at
DEFERRED have not silently mutated. The synthesis additionally surfaces
22 LOAD-BEARING rows that fold into the B amendments applied at this
revision — three new fourier-specific invariants (18 — UI surface
conventions; 19 — auto-recompute discipline; 20 — render-path
performance budget), one new wave (W2 — UX coherence; reactivating the
W2 slot whilst preserving the orphaned cross-repo tracking row as a
sub-section), and scope-item augmentations to W1 / W3 / W4. The new
invariants are **fourier-side coherence rules**, not cross-repo
contract clauses — they bind fourier's consumer surface; the
constellation's cross-repo contract surface is unchanged. The orphan
verdict's authority over the joint-ratification clauses is preserved.

## Wave-2 audit substrate (2026-05-26)

The B-development authoring round closes with the six-agent Wave-2
audit corpus at
`docs/audits/runs/2026-05-26-B-audit-wave-2/{C1..C6,SYNTHESIS}.md`.
Authored against HEAD `f8db2c6` (post-Wave-1 synthesis), the Wave-2
substrate empirically scores fourier's CRUD surface (C1 — 4 HIGH
defects + 10 non-conforming clauses), value.js's substrate at v0.10.0
(C2 — 6 of 13 incidental landings), the convergence shape under the
orphan verdict (C3 — 9 both-bound / 2 fourier-only / 2 advisory; the
contract's binding force is mandatory-fourier-side + advisory-both-sides
on cohort-reopening), the schema + conformance-matrix corpus
(C4 — 0 of 182 rows PASS at HEAD; paper-binding PASS / empirical-binding
FAIL; 12 gaps), the migration story (C5 — 9 entities × 9
transformations × 10 risks × 9 W3 scope-item gaps W3.16–W3.24;
image-blob Option B; defer entirely), and the risks-and-SOTA
opportunities (C6 — 5 + 4 HIGH/MED risks; 8 SOTA ADMITs; top-3 RFC 9457
problem+json / RFC 9110 ETag/If-Match / RFC 9239 RateLimit headers; 9 /
9 KISS rejections HOLD).

Four new fourier-side invariants (21 — slug-mint cryptographic RNG;
22 — RFC 9457 problem+json envelope; 23 — RFC 9110 ETag/If-Match
optimistic concurrency; 24 — RFC 9239 RateLimit header transparency)
fold into B.md §2 at this revision. The contract gains a binding-force
clause at §0 (mandatory-fourier-side; advisory-both-sides on
cohort-reopening) per C3 §6 recommendation 1; SCHEMA.md gains four
addenda (RFC 4648 citation; AnimationData schema body; Idempotency-Key
parameter; slug-exhausted catalog row); CONFORMANCE-MATRIX.md gains
five row additions (CS5.2 reconciliation to 21; CS5.3 slug-exhausted
assertion; CS5.4 Problem-class realisation; F-partial-sums round-trip;
aggregate grand total 182 → 187). Five existing waves receive scope
augmentations (W1 / W2 / W3 / W4 / W5).

The cohort-orphan absorption is **empirically confirmed** at the
Wave-2 boundary (C2 + C3 + C6 converge). The orphan verdict's
authority over the joint-ratification clauses is preserved verbatim;
no Wave-2 amendment perturbs the cross-repo contract scope; the
4 new fourier-side invariants are explicitly scoped as fourier-side
coherence rules under the CRUD-CONTRACT §0 "Out of scope" clause
extension (binding-force clause). The B-development phase closes at
this revision; B's wave execution remains future work.
