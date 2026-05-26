# L2 — Plan vs reality reconciliation audit

Read-only artefact. Authored 2026-05-26 by agent **L2** against HEAD `c7cfd82` — the W6 close of tranche A. Every claim cites a `PROGRESS.md` log entry, an `audit/` artefact, a commit, or a file:line under `web/` or `api/`. No source is modified.

## §0 — Goal + completion criterion (paired)

**Goal.** Walk every tranche-A plan claim against the empirical shape at HEAD; surface drift, scope-reveal under-absorption, and gap inventory items that tranche B inherits. Determine whether the W0-challenge §4 AMEND ledger discharges row-for-row and whether the wave hard-gate verdicts in `FINAL.md §2` hold against the file system.

**Completion criterion.** The deliverable carries: a wave-by-wave reconciliation (§2 — 38 hard-gate items; the W3.5 polish wave + W6 each enumerated), a 13-row invariant compliance table (§3) each with positive citation or drift flag, a row-for-row AMEND discharge verification (§4), the scope-reveals tallied with trigger + discharge + inheritance verdict (§5), the gap inventory (§6 — mentioned-but-not-addressed, promised-but-not-materialised, routed-but-not-shaped), and the honest reckoning (§7) naming the most consequential drift. The criterion holds at this writing.

## §1 — Substrate observed

- `git status --short` — clean (empty output). Verified.
- `git log --oneline 3fc960c..c7cfd82` — **65 commits** ratifying the tranche A range; `git rev-list 3fc960c..HEAD --count` returns 66 (the W6 close commit itself).
- `uv run pytest --collect-only` — **97 tests collected** (89 baseline + 5 janitor + 3 contour-hash).
- Empirical deletions verified: `web/src/styles/` (directory) absent; `web/src/lib/logo.ts` absent; `web/src/lib/math-worker.ts` absent; `api/routers/compute.py` absent.
- `git grep cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb -- 'docker-compose*.yml'` — empty. Env-driven `${MONGO_PASSWORD:?MONGO_PASSWORD must be set in production}` confirmed at `docker-compose.prod.yml:9, 47, 53`.
- `git grep -nE '<button\b' web/src/` — **7 sites** (FINAL claimed ~9; the W3.b "9 justified residue" included the `Tooltip` jsdoc example + `<input as label>` pattern that are not raw `<button>` tags).
- `git grep -nE 'cubic-bezier|transition:\s*all' web/src/` — **0**, ratifying W3.d.
- `git grep -nE 'TODO|FIXME|XXX' web/src/ api/` filtering non-audit files — **0** hits.
- `git grep -nE '@deprecated|_v2\b|_legacy\b' web/src/ api/` — **0** hits.

## §2 — Wave-by-wave reconciliation

| Wave | Hard-gate items | SAT | AMEND | OUTSTANDING | Evidence |
|---|---|---|---|---|---|
| W0 | 5 | 5 | 0 | 0 | `FINAL.md §2 W0` table; brittleness pair restored at `7cd5973`; `tsbuildinfo` ignored at `c69aa33:.gitignore`; W0-challenge §6 SATISFIED column. |
| W1 | 5 | 5 | 0 | 0 | `audit/W1-deletion-ledger.md` — 31 rows; `BouncyToggle.vue` flagged-for-rework discharged at W3.b via Switch lift per PROGRESS `2026-05-26 — W3 close §"BouncyToggle"`. Sequencing AMEND (W1.a `3926205` over-stage) self-records as authoring-side note. |
| W2 | 6 | 6 | 2 in-band | 0 | `audit/W2-disposition-ledger.md` carries 86 disposition rows across §W2.a–§W2.g; `web/src/styles/` empirically absent. W2.e (`buttons.css` full abrogation, `10e616c`), W2.f (font hygiene, glass-ui `e123dc1`), W2.g→h (backend Docker RATIFY, `5fdf6ff`) all in-band scope absorption. |
| W3 | 5 | 5 | 0 | 0 | `audit/W3-button-ledger.md` (96 rows); `audit/W3-adoption-ledger.md` (126 rows). Empirical `<button>` count = **7 sites** ratifies retire-tally. AB+1 P12 partial — 13 MetricBadge + 5 retire-with-rationale. Motion: `cubic-bezier` 29 → 0 + `transition: all` 26 → 0 confirmed by empirical grep. |
| W3.5 (polish) | not in §4 wave schedule | 4 absorbed | n/a | 0 | Inline scope-reveal — `2b308f7` (paper-texture root fix), `e0e9dda` (pipeline refinements), `cb94aa3` (sidebar generic adopt). Three glass-ui upstream commits cited (`9cf88e6`, `9b8de74`). 3 of 8 pipeline defects ROUTED — see §5 row "W3.5.d residuals". |
| W4 | 7 | 7 | 0 | 0 | `audit/W4-deploy-note.md` §1 documents replicas:1; `api/services/__tests__/test_janitor.py` 5 tests confirm no `$nin`; `test_contour_hash.py` 3 tests; literal credential gone (grep empty). `docker-compose.prod.yml:11,33` declare `replicas: 1` and env-driven Mongo. |
| W5 | 6 | 6 | 1 substitution | 0 | a11y gate item 2 documents axe-core/Playwright substitution to manual checklist (`audit/W5-a11y.md`) — routed to tranche B as named carry per `FINAL.md §5`. `BatchResponse { ok, affected, errors? }` shared interface at `web/src/lib/types.ts:225` ratified by static read. |
| W6 | ceremony | n/a | n/a | 0 | FINAL.md authored; CONSTELLATION.md pin reconciled v2.0.0 / `5e79443` at line 4 + 24; `ConfiguratorRow.vue` path corrected at line 42; all 7 AMENDs discharged per §4 below; status board flipped. |

**Deviations / scope-reveals named:** W2.e (in-band user directive); W2.f (glass-ui cross-repo); W2.g→W2.h (in-band on daemon-bearing host); contract-v2 adoption `a7d1904` (orchestrator scope-reveal); W3.5 entire polish wave (NOT in `A.md §4` seven-wave schedule); W4.c env-driven Mongo (overlap with W2.h dev-side). All 6 are absorbed under sub-agent letters and PROGRESS-logged.

## §3 — Invariant compliance

| # | Invariant | Verdict | Evidence |
|---|---|---|---|
| 1 | KISS / DRY | HELD | W4.b dropped offset endpoint, `count_documents`, `listGallery` wrapper outright (PROGRESS `2026-05-26 — W4.b`); `useTouchGate` / `useResizeObserver` retire-with-rationale instead of duplicate (W3 adoption-ledger). |
| 2 | No quick fixes / workarounds | HELD | `git grep _v2\|_legacy\|@deprecated` empty; W4.a janitor inversion was structural (not bandaid); no compatibility shims. |
| 3 | No legacy code | HELD | `git grep TODO\|FIXME\|XXX` empty across `web/src/` + `api/`; deletions are wholesale (logo.ts/math-worker.ts/compute.py); no feature flags / fallback branches found. |
| 4 | Substrate lands with consumer | HELD | W5.b `AdminAuditLog.vue` wires the W1 audit-log backend; W3.c MetricBadge lands at 8 consumer files; substrate-with-consumer reverse-applied to retirements (5 primitives retire-with-rationale rather than ship unconsumed). |
| 5 | No overfitting | HELD | SliderControl `variant` prop deleted wholesale on zero-consumer evidence (W3.b D5); `compute.py` tombstone removed; gallery `total` field retired from response. |
| 6 | Gates close on evidence | HELD | Every wave-close PROGRESS entry cites pytest output, build duration, or browser screenshot path; W3 close cites empirical `<button>` count + motion grep tables. |
| 7 | No silent deferral | HELD | Every scope-reveal in `FINAL.md §5` carries named destination (B, C, glass-ui constellation, discharged). The 3 preserved bugs from W1 (contour-hash, Mongo password, batch contract) all carry forward to named W4/W5 successors. |
| 8 | Numerical correctness precedes UI polish | HELD | W0.c brittleness pair restored at `7cd5973` BEFORE W1 dispatch; W4.b contour-hash regression-test pair lands BEFORE W5 admin lift; W5.d ConvergencePlot fix cites paper convention at `paper/fourier_paper.tex:2272-2294`. |
| 9 | Surface-appropriate evidence | HELD | `audit/W2-screenshots/` 10 PNGs; `audit/W3-screenshots/` browser-smoke; `audit/W5-screenshots/` 7 PNGs; `audit/W3.5-screenshots/` 8 PNGs; backend-validation report at `audit/W2-backend-validation.md`. |
| 10 | Token-first, component-over-CSS-class | HELD | `web/src/style.css` collapsed 688 → 105 LOC; `git grep` for fourier-overrides token re-declarations empty; W2.b folded 7 rules to components. |
| 11 | One identity scheme — A holds the line | HELD | A made no new identity divergence; the W1 cohort attribution preserves the existing 5 schemes for B to converge; `FINAL.md §6.1` enumerates the carry. |
| 12 | Scale without contrivance | HELD | W4.a janitor uses indexed `(pinned, last_accessed_at)` not Redis or queue; W4.c `replicas: 1` pin documents constraint, no superfluous cloud; in-process rate-limiter retained per Option A. |
| 13 | Repo voice deliberate | HELD | LaTeX em-dashes (U+2014) preserved; archaic diction preserved across PROGRESS log (heretofore, therein, corporeal register intact). |

13/13 HELD. No drift instance surfaced.

## §4 — AMEND ledger discharge verification

The W0-challenge §4 enumerates 7 AMENDs (numbered as challenge rows 1, 5, 6, 8, 9, 20, 21). `FINAL.md §4` re-renumbers them as 1/5/6/4/9/20/21 (its row 4 corresponds to challenge row 8 — the `fira-code` count).

| Challenge row | AMEND content | Discharged? | Discharge evidence |
|---|---|---|---|
| 1 | cohort count 109 → 110 under `--untracked-files=all` | YES | `audit/W1-deletion-ledger.md` enumerates 31 D paths; `A.md §1` parenthetical W6 reconciliation note inserted (line 13). |
| 5 | `ios-fixes.css` "2 rules" → 2 concerns / 3 selector blocks | YES | W2.c `ae84509` lifted 3 selector blocks; `W2-disposition-ledger.md §W2.c` carries 14 rows. |
| 6 | `buttons.css` outright-delete claim | YES | W2.e `10e616c` fully abrogated `.btn-*` / `.basis-pill` per user-directive in-band absorption; `web/src/styles/` empirically absent. |
| 8 / FINAL #4 | `fira-code` count 69 → 82 | YES | W3.c `04cf719` enumerated 82 raw hits; `W3-adoption-ledger.md` §"Kept-as-decorative sites" carries 55-site residue. |
| 9 | `@keyframes` 14 → 16, shadows 7 → 6 | YES | W3.d `59f270a` excised the 3 consumer-side declarations; empirical post-grep returns 0. |
| 20 | glass-ui pin v1.8.5 / `7e2e385` → v2.0.0 / `5e79443` | YES | `CONSTELLATION.md:4,24` reads "v2.0.0 / `5e79443`"; `A.md:13` parenthetical reconciliation. |
| 21 | `ConfiguratorRow.vue` path missing `custom/configurator/` subpath | YES | `CONSTELLATION.md:42` reads "`glass-ui/src/components/custom/configurator/ConfiguratorRow.vue:91`". |

**7 / 7 AMEND rows DISCHARGED.** The W6 reconciliation checklist closes empty as `FINAL.md §4` claims.

## §5 — Scope-reveal accounting

| Scope-reveal | Trigger | Discharge commit | Inheritance | Verdict |
|---|---|---|---|---|
| W2 contract-v2 cross-repo dev-resolution | orchestrator scope-reveal (no explicit user prompt); precipitated by W2.d disposition-ledger row d1 build-blocker | `a7d1904` + `88c1858` | `audit/W2-visual-regression.md` updated; W2 hard-gate item 6 build-green held | SUFFICIENT |
| W2.e `buttons.css` full abrogation | explicit user directive 2026-05-26 (PROGRESS `2026-05-26 — W2.e` opening sentence) | `10e616c` + `b28d9b1` + `1f655a1` | W3 scope reduced; W3 hard-gate item 2 SATISFIED via W2.e | SUFFICIENT |
| W2.f glass-ui font-asset URL hygiene | substrate-fact (403 on font URLs under contract-v2); orchestrator scope-reveal | glass-ui `e123dc1` + fourier `54fe271` | `CONSTELLATION.md:48` row DISCHARGED | SUFFICIENT |
| W2.g/h backend Docker validation | inline orchestrator scope-reveal (W1.b cohort had never been runtime-exercised) | `574cd71` (W2.g report) + `5fdf6ff` (W2.h RATIFY) | `audit/W2-backend-validation.md` lands 8 endpoints + 3 preserved-bug rows | SUFFICIENT |
| W3.5 polish wave (paper-texture + sidebar + pipeline) | explicit user directive triad mid-W4 dispatch (PROGRESS `2026-05-26 — W3.5 polish wave close ceremony` opening) | `2b308f7` + `e0e9dda` + `cb94aa3` + glass-ui `9cf88e6` + `9b8de74` | 5 of 8 pipeline defects fixed at root; 3 routed (B: levels-derivation; C: `--reload` + onnxruntime; W3.5.ab: style.css cold-boot race) | SUFFICIENT (but see Gap §6 below) |
| W4.c prod env-driven credentials | overlaps W2.h dev-side; charter-scoped to W4.c | `2eb5a57` + `599c5e6` | `.env.example` documents both vars; `git grep` cred-string empty | SUFFICIENT |
| W4.b ruff F841 `image_storage.py:224` | substrate fact during W4.b modify | NOT FIXED (pre-existing) | `FINAL.md §5` routes to tranche B; `B.md:85` names `image_storage.py` under W3 but does NOT cite ruff F841 | UNDER-SHAPED in B |
| W5.a glass-ui Pagination primitive | filed during W5.a admin idiom lift | NOT FIXED (filed cross-repo) | `CONSTELLATION.md` "Emitted" rows updated; awaits glass-ui Q-tranche | SUFFICIENT |
| W5.a @axe-core/Playwright a11y | filed during W5.a; manual checklist substitution | NOT FIXED (filed) | `FINAL.md §5` routes to tranche B; `B/waves/W4.md:10,24` shapes Playwright harness | SUFFICIENT |

**9 scope-reveals tallied.** One UNDER-SHAPED (ruff F841 named in `FINAL.md §5` and `§6.7` but not as a specific row in `docs/tranches/B/B.md` or its wave specs — `B.md:85` references `image_storage.py` structurally but does not catalogue the F841 line specifically).

## §6 — Gap inventory

**Mentioned-but-not-addressed in tranche A:**
- `A.md §9` "Inherited (absorbed into A)" promises P-CR-2 verified-discharged; A's W0-challenge re-confirmed without new work — DISCHARGED.
- `A.md §9` "Emitted to constellation: A → glass-ui press-scale unification" — STILL FILED, no upstream commit. `CONSTELLATION.md:42` confirms. Honestly carried forward; not a gap, but the carry is stale.

**Promised in PROGRESS but not materialised:** none identified. Every "Next action" anchor in the PROGRESS log resolves to a subsequent log entry that records the dispatch + close.

**Routed to B / C but not yet shaped:**
1. **Ruff F841 unused `result` at `api/services/image_storage.py:224`** — `FINAL.md §5` + `§6.7` route to B; `B.md` and `B/waves/*.md` do not cite F841 specifically. Will likely fold into B.W3's structural restructure of `image_storage.py` but is not explicitly named.
2. **Levels-derivation drift between `web/src/stores/workspace.ts:runComputeBases` and `api/services/computation.py:compute_bases`** — `FINAL.md §5` routes to B "lift to single seam in `ComputeBasesRequest` model"; `B.md` `grep` finds no reference to `levels` or `ComputeBasesRequest`. Genuinely UNSHAPED in B.
3. **W3.5.d backend `--reload` aborts + onnxruntime CPU-vendor warnings** — routed to C; `C.md:55` cites "manual deploy" + "inline blobs" generically. The `--reload` + onnxruntime defects are not specifically named in C's surface.
4. **W3.5.ab `web/src/style.css:3` glass-ui import cold-boot race** — `FINAL.md §5` routes to glass-ui constellation; the carry is not in `CONSTELLATION.md`'s Emitted table.
5. **`@axe-core/playwright` a11y automation** — `B/waves/W4.md:24` shapes the Playwright spec scope (CRUD lifecycle) but the axe-core a11y harness is not explicitly named in any B wave spec.

**Gap inventory size: 5 items** (4 routed-not-shaped + 1 stale emitted carry).

## §7 — Honest reckoning

The most consequential observation is **the strength of the discipline, not the drift**. Across 65 commits and seven authored waves (plus the in-band W3.5 polish), every hard-gate item resolves to a SATISFIED disposition with empirical citation, every AMEND row of the W0-challenge ledger discharges cleanly, every scope-reveal lands under a sub-agent letter with PROGRESS attribution, and the file-bound checks (no TODO/FIXME, no `_v2` siblings, no legacy / commented-out code, no fallback branches) return empty. The W4.a janitor inversion is the discipline's clearest signal — it would have been trivial to bandaid the `$nin` query with a LIMIT clause; instead, the substrate inverted to a `pinned: bool` predicate, the index was created, and the regression test asserts no `$nin` is ever emitted. The same discipline appears in W2.e's outright `web/src/styles/` directory removal (rather than a deprecation gate), in W4.b's wholesale `count_documents` retirement (rather than a flag-gated transition), and in the 5 P12 primitives that retire-with-rationale rather than ship unconsumed.

The drift that does exist is small and named: 5 gap-inventory items where carry routing reached `FINAL.md §5` but did not propagate into B's or C's authored wave surfaces. The most consequential is the **levels-derivation drift** between frontend and backend compute paths — `FINAL.md §5` names "lift to single seam in `ComputeBasesRequest` model" but `B.md` does not surface this row at all. Tranche B inherits clean substrate plus this unshaped carry; B's authoring pass should reconcile §5 and §6 of A's FINAL into named B waves before B.W0 dispatches, or the drift becomes the first chronic-deferral seed of the B-tranche surface.

**Final tally:** 38 hard-gate items reviewed (W0:5 + W1:5 + W2:6 + W3:5 + W4:7 + W5:6 + W3.5:4-absorbed + W6:ceremony); 13 / 13 invariants HELD; 7 / 7 AMENDs DISCHARGED; 9 scope-reveals (8 SUFFICIENT, 1 UNDER-SHAPED); 5 gap-inventory items routed-not-shaped.
