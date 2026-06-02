# J-deep-audit — SYNTHESIS (the merged forward path for tranche J)

**Synthesis lead.** Merges the six deep-audit auditors (A1 plan/waves · A2 fourier-CRUD-spec · A3 value.js-CRUD-symmetry · A4 deferred/chronic-sweep · A5 prompt-coverage · A6 changes/no-legacy) into ONE forward path. **Tranche-development only — no implementation.** Date: 2026-06-02.

Source reports: `A1-plan-waves.md`, `A2-fourier-crud-spec.md`, `A3-valuejs-crud-symmetry.md`, `A4-deferred-chronic-sweep.md`, `A5-prompt-coverage.md`, `A6-changes-nolegacy.md` (this dir).

---

## §1 — Executive verdict

J is the **right tranche**, its CORE (CRUD/REMIX atom-diff) is genuinely KISS, single-parent-linear, content-addressable, git-like, and idiomatic to the existing `lib/crud` compose-don't-frame discipline — every one of the six auditors returns **SOUND-WITH-REFINEMENTS**, none architectural. The 5-atom bag → per-atom-hash → set-hash → per-atom set-difference core is the correct primitive; the no-DAG/no-merge/no-CRDT declines are complete and self-consistent; the phantom `most-forked` sort is a real file-verified gap (`cursors.py:21` is the only `fork_count` reference, never written, not on the model) and the 5 atoms all exist on `visualization.py:109-119`. **The forward work FOLDS INTO J (refined/expanded), it does not warrant a new tranche K** — every finding belongs to the same data-model primitive J already owns. But the spec does not yet end FULLY-FORMED for either repo, and that is what the forward path closes: (1) one **P0** infrastructure contradiction — the remix leans on a Mongo *transaction* the standalone topology cannot run and the codebase has zero precedent for, which must be re-expressed as an ordered idempotent content-addressed write sequence before W2 opens; (2) the cross-repo `/diff` envelope claimed "parity-verified at close" is **not isomorphic** (op vocabulary `modified`/`changed`, field names `atom_diff`/`ops`, four extra value.js body fields) and would FAIL the close-gate probe at the most expensive moment; (3) a **second, uncovered CORE design doc** — `J.W1c-publish-visibility.md` — sits orphaned in `J/design/` (unreferenced by J.md/PROGRESS, no value.js peer), yet it is a genuine CRUD-CORE facet (publish two-ways, no-duplicate, idempotent in-place flag-flip, discharging the dead `visibility_illegal_transition` guard); (4) a dangling A3 seed cited repo-local but living only in glass-ui; (5) the value.js-J `ADOPTION-ASKS` row asserted present-tense but absent; (6) ordering μ′ unwritten; (7) the four `WC-design-*` design-polish docs orphaned in both repos; (8) nine chronics that the user's standing no-perpetual-punt demand requires terminal verdicts on. The CRUD/remix spec ends fully-formed, KISS, git-like, and **symmetric** once the diff envelope is pinned to one canonical shape doc, the publish/visibility facet is symmetrized into value.js, and the transaction P0 is resolved. The forward path is a refinement of J's W0/W1 (close the evidence-chain holes + the spec gaps) plus a sharpened W2 (the P0 + P1 contract gaps), not a re-plan.

---

## §2 — Tranche decision: FOLD into J (refine + expand), no K

The user said "fold them into THIS new tranche" (singular), and J is already the CRUD/remix tranche. Every forward finding is a refinement of the same data-model primitive J owns: spec completeness (transaction shape, response twins, the two provenance walks, the version-cursor collision), cross-repo symmetry (the diff envelope, idempotency parity, the publish/visibility facet), evidence-chain hygiene (A3 seed, μ′, the ADOPTION-ASKS row), and the chronic ledger. **None belongs to a different primitive.** The one genuinely-forward primitive — the WebMCP tool surface — is already correctly booked-not-built as a *named successor K* with a hard external gate (Chromium 146 stable), and the remix/diff endpoints are authored agent-legibly NOW so that K wrapper stays thin; that booking is right and stays. So J expands: W0 grows the evidence-chain + chronic-ledger intake; W1 grows to TWO CORE design docs (remix + publish-visibility) plus the canonical diff-shape doc plus a disposition for the WC design-polish thread; W2 absorbs the P0 + all P1 contract gaps. No new tranche letter.

---

## §3 — Six-scope synthesis

**A1 (plan/waves) — SOUND-WITH-REFINEMENTS.** The spine is idiomatic-gestalt: CORE leads as the value, decomposed KISS-first, DEV/IMPL boundary correctly between W1 and W2, the no-shared-lib refusal correct (per-language PATTERN, not BaseCRUDRouter). The single most-elegant simplification: **drop the vestigial 6-wave modern-web spine mapping** J inherited from I — it no longer fits a data-model tranche and forces the §4.1 CSS-platform "category-shuffle" (content-visibility IS a CSS-platform lever, re-slotted into the CWV slot then declared empty). Re-present J as **CORE + consumer-backed leaf wins + close**. P1 holes: dangling A3 seed; unwritten μ′.

**A2 (fourier CRUD spec) — SOUND-WITH-REFINEMENTS.** The atom-bag core is KISS and idiomatic. **P0**: the remix's `withTransaction` shape has zero codebase precedent (no `start_session`/`with_transaction` anywhere) and standalone Mongo (default URI, CI `mongo:8.0` no `--replSet`, conftest standalone) cannot run multi-doc transactions — it would skip (no coverage) or fail under inv-27. Fix: re-express as ordered idempotent content-addressed writes (content-addressed `_id=set_hash` → re-insert no-op; slug-unique child; conditional last `fork_count $inc` — matching the codebase's single-document-atomic posture and its own "fork_count is a seed, never authoritative" stance). P1: `palette_slug` never FK-validated; the within-viz `parent_hash` walk conflated with the breadcrumb's cross-viz `fork_of` walk (breadcrumb has no endpoint = inv-15 phantom); `/versions` cursor collides with the 64-hex string `set_hash` `_id` (`ObjectId(cursor.id)` raises `InvalidId`) — drop cursor pagination, return the bounded depth-ordered chain capped ≤50; no Pydantic response models named (inv-26 needs hand-typed twins). **Headline transposition**: three canonical-serialize-then-hash mechanisms (`content_hash`, ETag, atom/set-hash) collapse to ONE `canonical_digest` primitive over three projections — `etag._canonical_json` already IS this function and handles the datetime case the spec's `canonical_json` omits; make it the FIRST W2 code move.

**A3 (value.js symmetry) — SOUND-WITH-REFINEMENTS.** The atom-diff layer is well-formed and the per-stop keying (key=`position`, hash over `(css,name)`, content-equality short-circuit) is the crux done correctly — true git-like per-stop diffing. **P0-class**: the cross-repo `/diff` envelope claimed "parity-verified at close" only RHYMES — op vocabulary `changed`/`modified`, op-array field `ops`/`atom_diff`, from/to field names, and value.js's four extra body fields (`fromSetHash`/`toSetHash`/`identical`) all diverge; a close-gate probe FAILS at the most expensive moment. Fix: pin ONE canonical repo-neutral JSON shape doc both impls bind against (inv-26 spirit; NOT a shared package). P1: value.js remix is structurally un-idempotent in the W2→W4 window (fourier idempotent from day one; value.js has no idempotency store or conformance dir) — pull the Idempotency-Key store forward to W2 or add a KISS in-band same-`(source,child-set-hash,owner)` dedup guard. Terminal-verdict demand: **KILL VAL-9** (the two named consumers already share keyframes.js as the source; lifting to value.js inverts a dependency for no de-dup gain — the ≥2-consumer gate is structurally unmeetable), **BOOK VAL-1 with a hard kill-date** at the W0 re-check. The no-op-remix divergence (fourier 422-refuses, value.js permits as the fork) is a legitimate deliberate fork but must be named in both specs so it doesn't read as a bug at the parity probe.

**A4 (deferred/chronic) — SOUND-WITH-REFINEMENTS.** fourier-J's fold of fourier-LOCAL debt is complete and honest; the VAL-1/VAL-9 disclaimer to value.js is legitimate (both artifacts live entirely in value.js source; consumers are value.js↔glass-ui↔keyframes; value.js-J owns them). **9 chronics** identified; enforcing the no-perpetual-punt demand: 3 resolve-now, 1 force-terminal-verdict, 5 justified-gated-book each with a NAMED hard external gate. The one real gap **G-1**: fourier's own 3-tranche chronic **C1** (the colour-lift `sampleToSVGPath` consume-ask, B→C→D→G) is SILENTLY dropped by J — a chronic dropped without a record is the exact anti-pattern; J.W0 must record its KILL (the two-repo deadlock with value.js's parked supply dissolves — nothing is owed). The worst chronic is value.js's **6-tranche** glass-ui-primitive carry (V-6/CH-6), which needs a terminal verdict at value.js-J.W0, not a 7th book.

**A5 (prompt-coverage) — SOUND-WITH-REFINEMENTS.** The work-arc (P1 tranche-H CLOSED GREEN with the first genuinely-green CI run; P2 recap; P3 the constellation-UI 6-agent audit answering both UI questions; P4 redeployed modern-web runs; P6 modern-web-guidance + I/J expansion; P7 conformance audit) is substantially addressed. Surviving gaps are forward-execution: **P5's squared-`ConfiguratorLayer` INNER-section rounding is booked-not-shipped** — the drafted patch + glass-ui `b6d6cf4` fix the OUTER container axis only; the inner `border-b` divider sections (the literal user-reported defect) are byte-identical 2.x↔3.x and have no shipped/confirmed fix, and it is not a discrete ADOPTION-ASKS row. The value.js-J atom-diff arm is spec'd as a parity table but not a discrete ADOPTION-ASKS entry; the A3 seed dangles; P8's forward tranche doc (this synthesis) is the deliverable.

**A6 (changes/no-legacy) — SOUND-WITH-REFINEMENTS.** J is docs-only, no legacy introduced (the 46 "fallback/floor" mentions are all inv-29 progressive-enhancement framing, the correct idiom). Real integrity gaps: dangling A3 seed (lives only in glass-ui `d2aa67f`, cited repo-local in both repos); the four `WC-design-*` orphaned bolt-ons (unreferenced by the plan, orthogonal to the CRUD thesis, asymmetric — value.js's WC threads into J.W1, fourier's declares itself "orthogonal"); the unbacked ADOPTION-ASKS claim; the **three-way pattern-name inconsistency** (`lib/crud/atomdiff` vs `lib/crud/remix` vs `services/palette/diff.ts`) — the `/diff` shape-parity gate is meaningless until the module name parity is fixed; the `cartoon-card` dead-class shim (`web/src/style.css:98-108`, a D.W4 artifact, a genuine no-legacy violation) needs a home.

**Synthesis-lead addition (uncovered by the six): `J.W1c-publish-visibility.md` is an orphaned CORE-CRUD facet.** A second fully-authored design doc sits in `fourier/J/design/` — the publish/visibility OPERATION contract (the verbatim requirement: *publish two ways, private/public; re-publishing an extant private item must NOT duplicate it — flip the flag on the SAME row; publish is an idempotent in-place visibility mutation, categorically NOT a remix/fork*). It also finally discharges the twice-struck chronic of the dead `visibility_illegal_transition` guard (`errors.py:59`, defined+shape-tested+never-called) by making the publish/unpublish handlers its first live callers, and wires value.js's missing public-view visibility filter (`crud-list.ts:85`). This is a CRUD-CORE facet, not a design-polish thread — but it is (a) **unreferenced by J.md/PROGRESS** (same orphan-class as the WC docs) and (b) **has no value.js peer** (asymmetric). Because the user's mandate is a *fully-formed CRUD remix facility for BOTH repos*, this facet must be folded into the W1 CORE wave-set, symmetrized into a value.js peer, and wired into both plans. It is the single largest spec-completeness item the six auditors did not surface.

---

## §4 — Consolidated P0/P1 table (deduped)

| Sev | Finding | Origin | Fix | Wave |
|---|---|---|---|---|
| **P0** | Remix transaction mechanism has no codebase precedent; standalone Mongo cannot run multi-doc transactions → cannot run green under inv-27 | A2 (F-01) | Re-express remix as ordered idempotent content-addressed write sequence (content-addressed `_id=set_hash`; slug-unique child; conditional LAST `fork_count $inc`; `find_one` delete-race guard). Alt path (b) = named replica-set infra wave, explicit not assumed | W1 amendment (resolve BEFORE W2) |
| **P0-class** | Cross-repo `/diff` envelope claimed parity-verified but NOT isomorphic (op vocab `modified`/`changed`; field `atom_diff`/`ops`; from/to names; value.js's 4 extra body fields) — close-gate probe would FAIL | A3 (F1), A6 (A6-4) | Pin ONE canonical repo-neutral diff-shape doc (`J/design/J-diff-shape.md`) both impls bind against + both conformance probes assert against; reconcile op vocabulary first. inv-26 spirit, not inv-16 violation. Pick ONE pattern name (`atomdiff`) across both repos | W1 (author + adopt before either W2) |
| **P1** | `J.W1c-publish-visibility.md` is an orphaned CORE-CRUD facet — unreferenced by the plan, no value.js peer | synthesis | Wire it into J.md/PROGRESS as a CORE-W1 sibling; author the value.js publish-visibility peer; symmetrize (it discharges the dead `visibility_illegal_transition` guard + wires value.js's missing public-view filter) | W1 (both repos) |
| **P1** | Dangling A3 seed — cited repo-local in both repos, exists only in glass-ui (`d2aa67f`) | A1, A3 (F4), A5, A6 (A6-1) | Repo-qualify every citation to `glass-ui:docs/constellation/next/audit/A3-fourier-valuejs.md` (do NOT fork the seed); OR re-anchor to the live-code asymmetry + I/FINAL.md | W0 |
| **P1** | Ordering μ′ unwritten — CANONICAL-ORDERING ends at §18/λ′; J close cites μ′ | A1 (A1-2) | Author §19 / ordering μ′ at W0 open; no J close cites it until it exists (inv-27) | W0 |
| **P1** | value.js-J atom-diff ADOPTION-ASKS entry asserted present-tense but absent from the ledger | A1, A5, A6 (A6-3) | Author the discrete file-verified value.js-J row (forkPalette→remixPalette, PaletteVersion.atom_diff, GET /:slug/diff?from=, atomdiff.ts), its own commit, gated on value.js green CI (inv-16′); OR soften J.md tense to "to be seeded at W0" | W0 |
| **P1** | Chronic C1 (colour-lift `sampleToSVGPath` consume) SILENTLY dropped by J — a chronic dropped without a record | A4 (G-1/CH-3) | KILL the fourier consume-ask and RECORD it in J §8 "Killed/recorded"; value.js supply (V-9) stays PARKED; the two-repo deadlock dissolves | W0 |
| **P1** | VAL-9/VAL-1 perpetual punt (G→H→I→J) — need terminal verdicts | A3 (F3), A4 (CH-1/CH-2) | KILL VAL-9 (consumers already share keyframes.js; lifting inverts a dependency for no de-dup gain); BOOK VAL-1 with HARD kill-date at value.js-J.W0 re-check | value.js-J.W0/W4 |
| **P1** | value.js remix structurally un-idempotent in W2→W4 window; no conformance dir (fourier has both shipped) | A3 (F2) | Pull Idempotency-Key store forward to value.js-J.W2 OR KISS in-band same-`(source,child-set-hash,owner)` dedup guard in remixPalette; stand up `api/test/conformance/` | value.js-J.W2 |
| **P1** | `palette_slug` admitted as atom but never FK-validated | A2 (F-02) | FK-validate on remix + retroactively on create (problem+json not_found), OR declare it a soft/optional reference with rationale | W2 design-complete gate |
| **P1** | `/provenance` within-viz `parent_hash` walk conflated with breadcrumb's cross-viz `fork_of` walk — breadcrumb has no endpoint (inv-15 phantom) | A2 (F-03) | Name both walks distinctly: `/provenance` = within-viz version chain; add cross-viz `fork_of` ancestry walk for the breadcrumb (≤50/cycle-guarded) | W2 design-complete gate |
| **P1** | `/versions` cursor pagination collides with string `set_hash` `_id` (`ObjectId(cursor.id)` raises `InvalidId`) | A2 (F-11) | Drop cursor pagination on `/versions`; return the bounded depth-ordered chain capped ≤50 (more KISS, dissolves the collision) | W2 design-complete gate |
| **P1** | No Pydantic response models named for `/diff`,`/provenance`,`/versions`,`/forks` (inv-26 needs hand-typed twins) | A2 (F-12) | Name DiffResponse, ProvenanceNode/Response, VersionEntry/Response, ForksPage as hand-typed Pydantic, mirrored in TS `types.ts`, no codegen | W2 design-complete gate |
| **P1** | WAVE-C (four WC-design-* docs) orphaned in both repos — unreferenced by any wave, asymmetric | A1 (A1-6), A6 (A6-2/A6-5) | Decide: promote to a sequenced design-refinement wave (symmetric, citing the WC specs as substrate) OR demote out of the active tranche dir with a disposition note; bring `cartoon-card` shim with it if promoted | W1 / charter ratification |
| **P1** | P5 squared-`ConfiguratorLayer` INNER-section rounding booked-not-shipped (literal user defect; not a discrete ADOPTION-ASKS row) | A5 | Book a discrete glass-ui ADOPTION-ASKS entry (round the inner section dividers at the component root); confirm against shipped glass-ui post-`b6d6cf4`; do not mark P5 satisfied until inner sections round | W0 / cross-repo |
| **P1** | value.js 6-tranche glass-ui primitive carry (CH-6) — the worst chronic | A4 (CH-6) | FORCE a terminal verdict per ask at value.js-J.W0 (KILL-AS-MOOT / RE-EXPRESS-AS-inv-16′-ASK-with-hard-gate / SHIP); flag in fourier-J §6 as a cohort-health item | value.js-J.W0 |

---

## §5 — Fold-list (deduped; every deferred/chronic/gap → decision → wave)

See the structured `foldList` for the canonical machine-readable list. Grouped:

**W0 (open + audit intake + evidence-chain hygiene + chronic ledger):**
- A3 seed repo-qualification (dangling → fold-and-resolve)
- ordering μ′ authored into CANONICAL-ORDERING §19 (missing → fold-and-resolve)
- value.js-J atom-diff ADOPTION-ASKS row seeded (booked-in-prose-but-absent → fold-and-resolve)
- C1 colour-lift consume-ask (chronic 3× → KILL + record; supply stays PARKED)
- VAL-9 (chronic 3× → KILL at value.js-J.W0 with recorded rationale; fourier disclaims)
- VAL-1 (chronic 3× → gated-book with hard kill-date at value.js-J.W0 re-check)
- CH-6 value.js 6-tranche glass-ui-primitive carry (chronic 6× → force terminal verdict at value.js-J.W0)
- CH-7 font-asset residual (gated-book, observable gate, re-check stamped at value.js-J.W0)
- P5 inner-section rounding (booked-not-shipped → discrete glass-ui ADOPTION-ASKS entry + confirm-against-shipped)
- F-5 4th hand-type island inv-26 re-confirm (NIT → confirm-once, then drop from ledger)
- CH-4 dispatch.sh retirement + CH-5 the 7 adoption asks (gated-book, inv-16, TRIAGED — escalate Ask 3; cited in J §10 stale-watch via ADOPTION-ASKS §3/§4 as canonical owner)
- CH-8 W11 palette-api→color rename (gated-book → RECLASSIFY out of fourier stale-watch into PALETTE-API-PROVENANCE.md §4 operator runbook)

**W1 (CORE design + charter cleanup):**
- canonical `/diff` shape doc authored (both repos bind to it)
- ONE pattern name (`atomdiff`) reconciled across both repos
- `J.W1c-publish-visibility.md` wired into the plan + symmetrized into a value.js peer (CORE facet)
- WC-design-* disposition (promote-as-wave OR demote-out, symmetric across both repos)
- drop the vestigial 6-wave-spine mapping; re-present J as CORE + leaf wins + close (chronic frame from I)
- no-op-remix divergence named as deliberate in both specs (one sentence each)
- `cartoon-card` dead-class shim home (with WC if promoted, else standalone hygiene residual)
- cursors.py:21 citation fixed (off-by-one NIT)
- 8-vs-6 wave-count asymmetry reconciled (one sentence per repo)
- value.js-J §0 wave-labels fixed to match the §3 table (record-vs-discharge)

**W1-amendment / W2 (CORE impl — the P0 + contract gaps):**
- P0 transaction → ordered idempotent content-addressed writes (resolve before W2)
- `canonical_digest` primitive (one serializer, three projections) — FIRST W2 code move
- palette_slug FK validation; the two provenance walks; /versions cursor collision; Pydantic response twins
- value.js idempotency pulled forward to W2 + conformance dir stood up
- animation_data → NOT-atom + child sets None; canonicalization determinism; diff-granularity declared; author_slug=remixer; _UNSET tri-state via model_fields_set; n_harmonics atom = top-level; urn:contract:remix-noop; fork_of_hash prose; datetime handler (via canonical_digest); migration MIGRATIONS registry entry

**Named-forward (booked, NOT a J wave):**
- WebMCP tool surface (remix/diff registerTool) → K (Chromium 146 stable gate); endpoints authored agent-legibly now
- CSS Custom Highlight diff render → rides the CORE consumer surface, evidenced in W5 axe pass
- passkeys (no credential surface)

**Provisional:**
- inv-31 ("a remix must change ≥1 atom") → record as fresh integer 31 at close IFF W2 surfaces it as a named contract (not pre-emptively)

---

## §6 — Prompt-coverage verdict

The H→I→J arc is **substantially addressed** (A5). P1/P2/P3/P4/P6/P7 FULLY; the surviving items are forward-execution, all folded above:
- **P5** (fully-rounded-at-the-root): the OUTER axis shipped (glass-ui `b6d6cf4`); the INNER `ConfiguratorLayer` section rounding — the literal user defect — is **booked-not-shipped** and must become a discrete glass-ui ADOPTION-ASKS entry, with P5 NOT marked satisfied until the inner sections round. Highest-severity surviving carry.
- **P8** (fully-formed CRUD remix spec for fourier AND value.js): the fourier remix half is authored; the **publish/visibility CORE facet** (`J.W1c`) must be wired-in and symmetrized; the value.js arm must become a real ADOPTION-ASKS booking, not a parity table inside fourier's spec; this synthesis is the forward tranche doc P8 asks for.

---

## §7 — Ordered forward path (tranche-development steps)

1. **Author/repo-qualify the A3 seed + write ordering μ′ + seed the value.js-J ADOPTION-ASKS row** (W0 evidence-chain). The whole plan, refutations, consumer list, and cross-repo parity gate hang on a seed that resolves only in glass-ui; μ′ is cited as a close criterion but unwritten; the cross-repo arm is asserted-booked but absent. Close all three so J opens on a resolvable evidence chain (inv-27).
2. **Record the chronic ledger with terminal verdicts** (W0). KILL C1 (record it — the silent drop is the anti-pattern); KILL VAL-9, BOOK VAL-1 with a hard kill-date, force a terminal verdict on the 6-tranche CH-6 carry (all value.js-J.W0, fourier disclaims correctly); triage CH-4/CH-5 (escalate Ask 3) and cite ADOPTION-ASKS §3/§4 as canonical owner in J §10; reclassify CH-8 to the operator runbook; re-confirm F-5 once. Zero chronics exit without a verdict or a named hard gate.
3. **Pin ONE canonical `/diff` shape doc + ONE pattern name** (W1, both repos bind before either W2). The parity claim is currently false (op vocabulary + envelope diverge before a line of code); the pattern is named three ways. Author `J/design/J-diff-shape.md` (repo-neutral, fixing op vocabulary, op-array field, from/to names, body fields) and rename to `atomdiff` everywhere; make the close parity probe assert against the shape doc, not against the other repo. Name the no-op-remix divergence as deliberate in both specs.
4. **Wire-in and symmetrize the publish/visibility CORE facet** (W1, both repos). `J.W1c-publish-visibility.md` is an orphaned CORE-CRUD doc with no value.js peer; the user's mandate is a fully-formed CRUD facility for BOTH repos. Reference it from J.md/PROGRESS as a W1 CORE sibling, author the value.js peer, and let it discharge the dead `visibility_illegal_transition` guard (fourier) + wire the missing public-view filter (value.js).
5. **Drop the vestigial 6-wave-spine mapping; rule on WAVE-C** (W1 charter cleanup). Re-present J as CORE + consumer-backed leaf wins + close (removes the §4.1 CSS-platform category-shuffle — transpose the scaffolding out, don't add refutations to defend it). Decide WAVE-C: promote to a sequenced symmetric design-refinement wave (citing the WC specs + bringing the `cartoon-card` shim home) OR demote it out of the active tranche dir with a disposition note — it cannot stay an undeclared peer of the binding W1 spec.
6. **Resolve the P0 transaction contradiction as a W1 amendment, BEFORE W2 opens.** Re-express the remix as an ordered, idempotent, content-addressed write sequence (content-addressed `_id=set_hash`; slug-unique child via existing `slug_with_retry`; conditional LAST `fork_count $inc`; `find_one` delete-race guard) — matching the codebase's single-document-atomic posture and standalone topology. This changes the remix algorithm shape, so it is a design decision, not an impl detail.
7. **Close the W2 design-complete gate** (the contract gaps an implementer would otherwise discover at code time). Make `canonical_digest` (one serializer, three projections) the first W2 code move; then palette_slug FK validation, the two named provenance walks, the bounded `/versions` chain (no cursor), the hand-typed response twins (inv-26), value.js idempotency pulled forward to W2 + the conformance dir. After the gate, W2 is a pure implementation wave; the P2/NIT clarifications (animation_data, determinism, diff-granularity, author_slug, _UNSET, n_harmonics, remix-noop code, fork_of_hash prose, migration registry) fold cleanly into W2 cleanup.
8. **Execute the consumer-backed leaf waves behind inv-27 + inv-29** (W3–W6, unchanged in intent). `scheduler.yield()` (W3), gallery `content-visibility` (W4), e2e/axe CI evidence incl. the new remix-flow + publish-flow e2e (W5 — the green claim I could not make in-session), CSP/`fetchLater` tail (W6). Each additive behind a feature-detected floor; the EVIDENCE wave carries the binding inv-27 green run id.
9. **Close paired with value.js-J** (W7). FINAL.md cites every commit + the green CI run ids + the `/diff` shape-parity verdict against the canonical shape doc + the inv-16′ value.js-J ledger + the chronic-resolution block; CANONICAL-ORDERING → μ′ (now written); 30-day stale-watch re-triggered with ADOPTION-ASKS §3/§4 as the canonical owner of the inherited coordination chronics.

---

End of J-deep-audit.md (synthesis).
