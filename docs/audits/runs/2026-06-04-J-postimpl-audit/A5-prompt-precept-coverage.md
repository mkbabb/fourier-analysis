# A5 — PROMPT & PRECEPT COVERAGE (post-W2–W4 impl, the whole arc)

**Auditor**: A5 (prompt-precept coverage). **Run**: `2026-06-04-J-postimpl-audit`. **Repo HEAD**: `9d7c387` (origin/master, NOT deployed; host stuck at `f2fe447`, 29 commits behind — `git log f2fe447..9d7c387` = 29).
**Method**: reconstruct EVERY user prompt/request across the entire H→I→J arc INCLUDING this session's "Begin" execution requests; verify each against the real repo with `file:line`/run/log evidence; cross-check the 8 invariants for any violation; map the publish "re-publish-no-duplicate" requirement onto the SHIPPED endpoint.
**Read**: `docs/tranches/J/{J.md,PROGRESS.md,design/J.W1c-publish-visibility.md,design/J-diff-shape.md}`, `docs/constellation/{CONSTELLATION.md,ADOPTION-ASKS.md}`, `docs/audits/runs/2026-06-02-J-deep-audit/A5-prompt-coverage.md` (the P1–P8 baseline), `api/routers/visualizations.py`, `api/lib/crud/atomdiff.py`, `web/src/lib/scheduler.ts`, `web/src/stores/gallery.ts`, `web/src/components/visualization/gallery/GalleryCard.vue`, `scripts/{dev.sh,deploy.sh}`, `.gitignore`; CI run `26913592291`.

**Verdict**: **SOUND-WITH-REFINEMENTS.** Every reconstructed prompt is ADDRESSED or honestly DEFERRED-BOOKED; **zero DROPPED or silently-unaddressed requests**. The publish "re-publish-no-duplicate" requirement is **structurally honored** at `visualizations.py:656-659` (the only write verb is `$set` on `{slug}`, guarded by `if target != current`; there is no `insert_one` anywhere on the publish path). No precept is VIOLATED by this session's work; inv-27 is the one invariant whose green-claim is honestly OUTSTANDING (the e2e job is red on a pre-existing, correctly-W6-booked cause) — which is inv-27 working as designed, not a breach. The single material honesty risk to watch: the deploy-of-record never landed (host 29 behind), so any "shipped to prod" reading of J's CORE is false — but the docs do not claim it landed (PROGRESS W2 says "GREEN (local); CI-green pending push"), so this is a correctly-stated gap, not a misrepresentation.

---

## Part 1 — The prior-arc baseline (P1–P8, carried, re-verified at HEAD)

The 2026-06-02 deep-audit A5 (`docs/audits/runs/2026-06-02-J-deep-audit/A5-prompt-coverage.md`) recapped prompts **P1–P8** (H-totality; tranche+sibling+deploy+CRUD recap; left→right + squared-borders 6-agent UI audit; redeploy-workflows; "fully rounded at the root"; modern-web-guidance fold; constellation precept-audit; the DEEP-audit directive). I re-verify its three open NITs are now CLOSED, and carry the rest:

| Prior prompt | Prior status | Status at HEAD `9d7c387` | Evidence |
|---|---|---|---|
| P1 H-totality | FULLY | ADDRESSED (unchanged) | `docs/tranches/H/FINAL.md`; CI `26773946417` |
| P2 recap tranche/siblings/deploy/CRUD | FULLY | ADDRESSED — now CODIFIED durably in `CONSTELLATION.md §1` (the 8-repo roster) | `docs/constellation/CONSTELLATION.md:13-24` |
| P3 left→right + squared + 6-agent UI audit | FULLY (questions) | ADDRESSED; the squared-border FIX is P5's (still glass-ui-owned) | `docs/audits/runs/2026-06-01-constellation-ui/` |
| P4 redeploy workflows/agents | FULLY | ADDRESSED (unchanged) | `2026-06-01-modern-web/`, `-modern-web-audit/` |
| P5 "fully rounded by default, at the root" | PARTIAL (inner-section DEFECT booked-not-shipped) | **DEFERRED-BOOKED, terminal** — now a discrete ledger row `glass-ui-P5-inner-rounding`, "NOT marked satisfied until the inner sections round" | `ADOPTION-ASKS.md:124`, §7 |
| P6 modern-web-guidance fold + dangling A3 ref | FULLY (one dangling ref) | **ADDRESSED — NIT closed**: the A3 seed is now repo-qualified `glass-ui:docs/constellation/next/audit/A3-fourier-valuejs.md` (NOT a broken fourier-relative path) | `J.md:5`; confirmed `docs/constellation/next/audit/A3-fourier-valuejs.md` does NOT exist in fourier (correct — it's repo-qualified, not copied) |
| P7 constellation precept-audit (6 agents) | FULLY | ADDRESSED (unchanged) | `2026-06-01-modern-web-audit/modern-web-audit.md` |
| P8a value.js-J ADOPTION-ASKS booking (was forward-tense prose) | OPEN | **ADDRESSED — NIT closed**: the two rows now EXIST | `ADOPTION-ASKS.md:122-123` (`valuejs-J-atomdiff`, `valuejs-J-publish`), §7 |
| P8b "publish two ways, no-duplicate" facet | (folded post-baseline) | **ADDRESSED + SHIPPED** — see Part 3 | `design/J.W1c-publish-visibility.md`; `visualizations.py:620-678` |

All three prior NITs (A3 dangling path, value.js-J booking, P5 discrete row) are CLOSED. **P5 remains the one prompt whose FIX (not diagnosis) is genuinely incomplete** — correctly carried as a terminal BOOK gated on a glass-ui release, NOT a perpetual punt.

---

## Part 2 — THIS session's prompts (the "Begin" execution arc + the re-issued deep-audit)

This is the new coverage A5 owes. Each row: the request, its status, `file:line`/run evidence, and the disposition.

| # | This-session request (reconstructed) | Status | Evidence | Disposition |
|---|---|---|---|---|
| **S1** | "Begin / execute J in full" | **PARTIAL-by-design** — W0–W4 executed; W5–W7 gated, W8 close pending | PROGRESS log 2026-06-03 (W2 CORE + dev.sh-P0) + 2026-06-03 (W3/W4); commits `7d95af6`, `9d7c387` | ADDRESSED for the authorized scope; the rest correctly DEFERRED-BOOKED (S3) |
| **S2** | "dev.sh-P0 + J.W2 now" | **ADDRESSED** | `scripts/dev.sh` (12752 B, conformance-rewritten, `up\|down\|status\|logs\|build\|test`); `scripts/deploy.sh` (7696 B, confirmation-gated); `.gitignore:55` `!scripts/deploy.sh`; both git-tracked (`git ls-files scripts/`); J.W2 CORE landed (atomdiff/canonical_digest/remix/publish/reads/migration); `pytest api/`=266 | SHIP-as-wave (W2 GREEN-local) |
| **S3** | "W5–W7 after glass-ui 3.2.0" | **DEFERRED-BOOKED** (correct) | PROGRESS W2 close: "W5 … + W6 … + W7 … gate on glass-ui 3.2.0 (the `Configurator asideSide` + `useTextHighlight` ADOPTION-ASKS)"; status board W5/W6/W7 = `planned` | DEFERRED-BOOKED — gated on a NAMED external dependency (glass-ui release), honest |
| **S4** | "you are the W6 pilot" (fourier pilots the instrumented gate) | **DEFERRED-BOOKED** | J.md W6 row + PROGRESS W3/W4: "the measured INP delta is W6 (the instrumented gate)"; W4: "a measured CWV/render delta is W6" | DEFERRED-BOOKED to W6, the wave that exists to discharge it |
| **S5** | "deploy = babb.dev spine (`api.fourier.babb.dev`)" | **PARTIAL — DID NOT LAND** | per the brief's SSH diagnosis: host `f2fe447`, 29 behind; webhook fired (200) + deploy-hook built/up'd OK but the HEALTH GATE failed (`deploy-hook.sh:82-94,175`, 60s gate) → ROLLBACK; the gate failure is the never-deployed 29-commit G/H/I/J jump's nginx/frontend surface, NOT the J backend (`docker compose run backend` connect_db OK; prod viz count = 0) | **FOLD-into-next-tranche** (the BIG chronic — see Chronics) |
| **S6** | "gate on green CI incl. e2e" | **HELD (correctly RED-gated)** | CI run `26913592291` HEAD `9d7c387`: `web ✓`, `api/tests ✓ (266)`, `e2e ✗`. No green claim is asserted over the red e2e. inv-28 SPA deploy `26913966345` = `skipped` (correctly gated on green CI) | ADDRESSED — the gate is doing its job; no false green |
| **S7** | the push/deploy authorization | **ADDRESSED** | the 6 commits `c43042b…9d7c387` are on origin/master (`git log` shows pushed); CI ran against `9d7c387` | ADDRESSED |
| **S8** | the e2e→W6 decision (book the dock VT-name fix to glass-ui 3.2.0, NO `!important` workaround) | **DEFERRED-BOOKED** (honors NO-LEGACY) | e2e fails on `Unexpected duplicate view-transition-name: glass-dock-1` (CI log run `26913592291`); PRE-EXISTING (prior master run `26831216131` failed IDENTICALLY); this session's diff touches no dock/VT code; root = dual-dock mount (`VisualizationView.vue:20,22` import + `:211,239` mount `CanvasControlsDock` + `EditorControlsDock`) colliding on glass-ui's module-counter VT-name | DEFERRED-BOOKED — an inv-16′ glass-ui 3.2.0 ADOPTION-ASK (see Folds) |
| **S9** | the SSH-diagnose decision (diagnose why babb.dev didn't update) | **ADDRESSED** | the brief records the full root-cause: webhook 200 → build OK → health-gate fail → rollback → "[webhook] error … exit status 1"; host restored to found state `f2fe447`, healthy; migrations never ran (post-gate, `deploy-hook.sh:191`) | ADDRESSED — diagnosis complete, repair BOOKED |
| **S10** | THIS re-issued deep-audit ("DEEPLY audit … devise a path forward … recap ALL prompts … tranche development only") | **IN-FLIGHT** (this audit) | the 6-agent post-impl audit run `2026-06-04-J-postimpl-audit/` (this report = A5) | ADDRESSED by construction (the audit is the deliverable) |

**Pre-"Begin" arc prompts also reconstructed and confirmed ADDRESSED** (these predate S1 but the directive asks for ALL prompts hitherto):
- **"author the constellation manifest"** → ADDRESSED: `docs/constellation/CONSTELLATION.md` (commit `36f760e`), the single orchestration manifest — §1 roster, §2 boundary law, §3 cohort, §4 arms, §5 protocol, §7 live tracker.
- **the multi-session command + roster (keyframes/muster/words)** → ADDRESSED: `CONSTELLATION.md §1` rosters all 8 (keyframes `12f8282`, muster `f5d476e`, words `83da49e`) with write-boundaries + per-repo arms (§4) + the per-session re-ground command (§5 Mode A).
- **the constellation status/ordering/orchestration questions** → ADDRESSED: `CONSTELLATION.md §7` live state tracker + `CANONICAL-ORDERING.md §19 = μ′` (J head) + §6 sequencing.
- **the abs-path correction** → ADDRESSED: `CONSTELLATION.md:9` path convention ("References into the fourier hub are absolute under `HUB = /Users/mkbabb/Programming/fourier-analysis/`"); §8 pointers all absolute. This audit itself uses absolute paths per the same correction.
- **"publish two ways private/public, re-publish-no-duplicate"** → ADDRESSED + SHIPPED → Part 3.

**No DROPPED request found. No silently-unaddressed request found.** Every prompt resolves to ADDRESSED, DEFERRED-BOOKED (with a named gate), or IN-FLIGHT (this audit).

---

## Part 3 — The publish "re-publish-no-duplicate" requirement, mapped to the SHIPPED endpoint

The verbatim requirement (`design/J.W1c-publish-visibility.md:8`): *"re-publishing an EXTANT private item must NOT duplicate it — switch the flag to public on the SAME row; publish is an idempotent in-place visibility mutation."*

**Mapped to the shipped code (`api/routers/visualizations.py:620-678`), structurally HONORED:**

1. **The ONLY write verb is `$set` on `{slug}`** — `visualizations.py:656-659`:
   ```
   if target != current:
       await db.visualizations.update_one(
           {"slug": slug}, {"$set": {"visibility": target, "updated_at": datetime.now(UTC)}}
       )
   ```
   No `insert_one` exists anywhere on the publish path (`_visibility_verb`, `publish_visualization`, `unpublish_visualization`). The remix `insert_one` (`:587`) is a categorically separate handler. The anti-duplication guarantee is therefore STRUCTURAL, exactly as `J.W1c §3.4` specifies — not a runtime check that could be bypassed, but the absence of any new-row verb.

2. **Idempotent no-op when already at target** — the `if target != current` guard (`:656`) means re-publishing an already-`public` row writes nothing and returns 200 with the unchanged doc (`:661-666`). This satisfies "re-publishing an extant item must NOT duplicate it" at the strongest level: it does not even re-write.

3. **`unpublish` is contract-honest** — `:646-647`: `target = "unlisted" if current == "public" else current`. This lands the contract-legal `public→unlisted` exit and NEVER the forbidden `public→draft` (`J.W1c §5.1`); a non-public start state is a no-op (stays put). The guard `is_legal_visibility_transition` is COMPOSED (`:651`), the dead `visibility_illegal_transition` predicate's first live wiring (`:50` import; also the PATCH-path first-REJECTION at `:373-378`).

4. **Owner-gated, ETag-guarded** — anon→401 (`:630-631`), non-owner→403 (`:638-639`), `If-Match` required (`:641`), soft-deleted→404 no-resurrect (`:635-637`). Matches `J.W1c §2.2` status table.

5. **`published: bool` is a derived convenience, not a persisted column** — `:663` `body["published"] = updated.get("visibility") == "public"`. Honors `J.W1c §0` ("NO persisted `published` column").

**Confidence: HIGH.** The requirement is honored by construction. The one thing NOT yet proven is the *runtime evidence* (the publish-flow e2e: publish→listed→unpublish→delisted→re-publish-no-duplicate) — that is correctly DEFERRED-BOOKED to W6 (`J.md` W6 row, the publish-flow e2e), under the e2e CI that is currently red on the pre-existing dock cause. So the structure is shipped; the green e2e proof is W6.

---

## Part 4 — Precept / invariant cross-check (any VIOLATED by this session?)

| Invariant | Verdict | Evidence |
|---|---|---|
| **inv-15** substrate-without-consumer-is-binary | **HELD** | publish names its consumer = the existing `visibility=="public"` filters (`gallery.py:53` + `visualizations.py:239`, per `J.W1c §5.2`); `most-forked` is now write-backed (`:599` `$inc fork_count`) → de-phantomed; W3 `yieldToMain` is applied to a REAL consumer (gallery accumulation `gallery.ts:74`) and the un-consumed rAF loop is NAMED-not-forced (PROGRESS W3) — the honest inv-15 posture |
| **inv-16** write-only-own-repo | **HELD** | the 6 commits touch only `fourier-analysis/**`; the value.js arms are ledgered ASKS (`ADOPTION-ASKS.md:122-123`), not writes; `palette_slug` declared a SOFT reference (fourier owns no palettes collection) — a deliberate inv-16 departure from §13 F-02, correctly recorded |
| **inv-16′** authorized-cross-repo-sweep | **HELD** | three NAMED/ledgered/per-repo-green-CI-gated rows exist (`valuejs-J-atomdiff`, `valuejs-J-publish`, `glass-ui-P5-inner-rounding`, `ADOPTION-ASKS.md:122-124` §7); no silent sweep |
| **inv-26** single-contract-source-no-codegen | **HELD** | `DiffResponse`/`ProvenanceResponse`/`VersionsResponse` are hand-typed Pydantic (`visualizations.py:835-839` builds `DiffResponse` by hand); `web/src/lib/types.ts` snake twins; no codegen revived |
| **inv-27** green-means-green | **HONESTLY OUTSTANDING (not violated)** | CI `26913592291`: `web ✓`/`api ✓`/`e2e ✗`. NO green claim is asserted over the red e2e — PROGRESS W2 says "CI-green pending push", W3/W4 say measured deltas are "booked, not asserted here (inv-27)". This is inv-27 WORKING: the absence of a covering green run = the absence of a green claim. The red is a pre-existing, correctly-W6-booked cause |
| **inv-28** verified-deploy-of-record | **HELD (gate did its job)** | the SPA deploy `26913966345` = `skipped` (correctly gated on green CI — the linchpin); the API-arm green-CI gate is BOOKED-not-built (needs a host-only read-only PAT, per the brief). The deploy did NOT land — but inv-28 is precisely the invariant that PREVENTS a red-CI deploy-of-record; the host staying at `f2fe447` is the gate refusing an unverified deploy, plus the separate 29-commit health-gate chronic |
| **inv-29** progressive-enhancement-floor | **HELD** | `scheduler.ts:29-35` `yieldToMain` = `scheduler.yield → postTask → setTimeout(0)` (≤20 LOC, feature-detected floor); W4 `.deferred-section` reverts to normal render where `content-visibility` is absent (`GalleryCard.vue:199-206`) |
| **inv-30** platform-over-library | **HELD** | W3 ships the platform `scheduler.yield()` (no library); W4 ships the CSS `content-visibility` primitive via glass-ui's already-shipped utility (no new dep) |

**No invariant is VIOLATED by this session's work.** inv-27 is OUTSTANDING-by-honesty (red e2e, no false green) and inv-28 is the invariant that correctly BLOCKED the deploy-of-record — both are the precepts working as designed.

**One design-decision smell-tested (the brief flagged it): `Visualization.set_hash` defaults to `""`.** This is additive-migration safety for legacy rows before the backfill runs (PROGRESS W2). It is NOT a fallback/legacy pattern in the prohibited sense (`feedback_no_fallbacks.md`): the empty default is overwritten by the migration's `$set set_hash` (the additive idempotent `migrate_visualization_forks`), and `_head_set_hash` (`:477-480`) computes the real hash on read for any row that still carries `""`. So the default is a transient migration-window value with a deterministic read-time recomputation, not a permanent optional-path. ACCEPTABLE — but it earns a W6 conformance assertion that no post-migration row carries `set_hash==""` (folded below).

---

## Folds (disposition-named)

| Item | Disposition | Rationale |
|---|---|---|
| **The babb.dev API deploy-of-record never landed** (host `f2fe447`, 29 behind; health-gate fail → rollback) | **FOLD-into-next-tranche** | This is the BIG chronic of the session and echoes F's "webhook silently broken ~2 months." The diagnosis is complete (S9); the repair is NOT a J-CORE concern but a deploy-spine concern that must be sequenced and discharged. The next tranche must land the 29-commit G/H/I/J jump with a green health-gate, OR honestly re-scope inv-28's API arm. Until then, NO doc may read J's CORE as "in prod." |
| **The e2e dock VT-name collision** (`glass-dock-1` duplicate; pre-existing; blocks the inv-27 green claim) | **SHIP-as-wave** (W6, via the glass-ui 3.2.0 ASK) | Already booked correctly: an inv-16′ glass-ui 3.2.0 ADOPTION-ASK for unique dock VT-names; NO fourier `!important` workaround (honors NO-LEGACY). The W6 EVIDENCE wave cannot post a green e2e until this lands — so this is the literal blocker on inv-27's green claim and must be the W6 critical-path dependency, NOT a parallel nice-to-have. |
| **The publish-flow + remix-flow e2e (the runtime "no-duplicate" proof)** | **SHIP-as-wave** (W6) | The structure is shipped (Part 3); the green e2e proof is owed. Fold the explicit `publish→list→unpublish→delist→re-publish-no-row-added` assertion into W6 against the green CI. |
| **`set_hash==""` post-migration conformance assertion** | **FOLD-into-next-tranche** (W6 conformance) | The `""` default is acceptable transiently; W6 should assert no live row carries it post-backfill, closing the smell. |
| **W5/W6/W7 (glass-ui-3.2.0-gated)** | **DEFERRED-BOOKED** | Correctly gated on the NAMED glass-ui 3.2.0 release (`Configurator asideSide`, `useTextHighlight`). The next tranche must re-check the gate at W0 and either execute or re-affirm the book — no perpetual punt. |
| **value.js-J arms (`valuejs-J-atomdiff`, `valuejs-J-publish`)** | **DEFERRED-BOOKED** | Ledgered (`ADOPTION-ASKS.md:122-123`), per-repo-green-CI-gated, inv-16 held. The cohort paired-close (`CONSTELLATION.md §6.3`) verifies the `/diff` + publish envelope parity when both arms are green. |

---

## Chronics (TERMINAL verdicts — zero perpetual punts)

| Chronic | History | Terminal verdict |
|---|---|---|
| **The babb.dev deploy chain (health-gate fail → 29-commit rollback)** | F restored a ~2-month dead webhook; G/H/I/J have NEVER deployed; host `f2fe447` | **FOLD-into-next-tranche as a FIRST-CLASS WAVE, with a hard close gate**: the next tranche lands the 29-commit jump with a verified green health-gate (`/api/health`→ok AND `/`→404 inv-22) OR re-scopes inv-28's API arm with a named operator action. This is no longer a "booked residual" — it is the highest-severity forward item and must carry a wave, not a footnote. The diagnosis is done; the repair is owed. |
| **inv-28 API-arm green-CI gate "BOOKED-not-built"** | named at H; still booked (needs a host-only read-only PAT) | **BOOK-with-kill-date**: build the API-arm green-CI deploy gate in the next tranche's deploy wave (same wave as the 29-commit jump), OR explicitly DECLINE-recorded with the manual-deploy procedure as the standing answer. Not a third book. |
| **P5 inner-`ConfiguratorLayer`-rounding** (the literal user defect, byte-identical 2.x↔3.x) | P5→deep-audit→J | **BOOK-with-kill-date** (glass-ui-owned, gated on a glass-ui release): `glass-ui-P5-inner-rounding` (`ADOPTION-ASKS.md:124`); "NOT marked satisfied until the inner sections round," verified by a W5 visual-evidence satisfaction test. fourier holds no lever (inv-16); the kill-date is the W0 re-check of the next tranche — if glass-ui has not shipped it, RE-AFFIRM with the owner or KILL-as-superseded. |
| **e2e/axe inv-27 green proof** (I deferred it to J.W6; J has not yet executed W6) | I→J | **SHIP-as-wave** at W6 (the wave that exists to discharge it), critical-path-blocked on the dock VT-name ASK above. The green claim I and J could not make in-session lands here or J does not close. |

---

## The one honesty flag (P0-adjacent, not a code bug)

**Any prose that reads J's CORE as "deployed / live on babb.dev" would be FALSE.** The host is at `f2fe447` (tranche-H-authoring era); the CORE remix/publish endpoints have NEVER served a request in prod. The docs DO state this correctly (PROGRESS W2: "GREEN (local); CI-green pending push"; the brief's deploy section is explicit), so there is no live misrepresentation in the artefacts I read — but the next tranche's FINAL.md must NOT cite a green-prod claim for J's CORE until the 29-commit jump lands with a green health-gate. This is the single coverage item where a future careless "shipped" assertion would breach inv-27/inv-28 honesty. Flagged so it cannot be written by accident.
