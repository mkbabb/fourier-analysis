# H1 — A.W0 + A.W1 + Precepts Compliance Hardening

**Repo:** `/Users/mkbabb/Programming/fourier-analysis`
**Date:** 2026-05-18
**Agent:** H1 (hardening pass on Tranche A W0 + W1)
**Mode:** READ-ONLY. No edits, no commits.
**Inputs:** `docs/tranches/A/A.md`, `docs/tranches/A/waves/W1.md`, `docs/tranches/A/PROGRESS.md`,
`docs/tranches/A/coordination/CONSTELLATION.md`, `docs/precepts/instructions/tranche/{SPEC,WAVE_SPEC,RESEARCH,CHALLENGE,START,DOC_UPDATE_WAVE,AGENT_DISPATCH_TEMPLATE}.md`,
`docs/precepts/instructions/{README,ORCHESTRATION,LESSONS-LEARNED}.md`,
`docs/audits/runs/2026-05-18-fourier-tranche/{a-plan-archaeology,b-precepts-compliance}.md`.

---

## §1 — Build state verification

### 1.1 Uncommitted-file count

`git status --porcelain | wc -l` → **109** (not 107). Decomposition:

| Status | Count | Source |
|---|---|---|
| ` M` modified (tracked) | 62 | `git status --porcelain \| grep -cE '^ M'` |
| ` D` deleted (tracked) | 31 | `git status --porcelain \| grep -cE '^ D'` |
| `??` untracked | 16 | `git status --porcelain \| grep -cE '^\?\?'` |
| **Total** | **109** | — |

`A.md:13`, `A.md:79`, `A.md:104` and `coordination/CONSTELLATION.md:20`, `PROGRESS.md:21`,
`W1.md:7,12` all state "107". The figure is off by **+2**. Likely cause: the
predecessor audit `a-plan-archaeology.md:6,69` originally said
"93 tracked + 14 untracked = 107" (still wrong arithmetic: 93+14=107 only if
deletions are counted inside the 93 — `git diff --stat HEAD` reports 93 "tracked
files changed" which includes deletions). The current worktree has accumulated 2
more changes (most likely the `docs/audits/` and `docs/tranches/` untracked
additions authored *after* audit-a closed). **Recommendation:** update A.md /
W1.md / PROGRESS.md / CONSTELLATION.md to "≈109 paths (62 M, 31 D, 16 ??)"
and pin the exact number at the W1 commit boundary, not at plan authoring time.
This is a §6 hard-gate honesty issue: A.md §6 says "PROGRESS.md matches
reality" — the cited figure must be re-pinned at W1 open.

### 1.2 vue-tsc

`cd web && npx vue-tsc -b --force` → **exit 0**, no output. **Green.**
Matches A.md §2 ("the build is green at open"), `b-precepts-compliance.md:301-303`
("`npx vue-tsc -b --force` → EXIT 0"). The W0 hard-gate condition on this
command holds at HEAD-of-worktree.

### 1.3 pytest

`uv run pytest -q` → **2 failed, 87 passed in 69.90s**:

- `tests/test_bases.py::TestEvaluatePartialSum::test_chebyshev_partial_sum`
- `tests/test_bases.py::TestEvaluatePartialSum::test_legendre_partial_sum`

Failure mode (Legendre): "Mismatched elements: 196 / 200 (98%) … Max relative
difference 14.19". This is **not** a near-tolerance edge case — it is a real
numerical failure across virtually every sample. The `MEMORY.md` claim "59 tests
total … all passing" is stale (the current count is 89, so 30 more tests
have been added since that note, and the suite is no longer green).

**This contradicts the tranche plan in three places:**

1. **A.md §2:** "A introduces ZERO brittleness windows — the build is green at
   open (W0 re-verifies) and every wave closes green." Green-at-open is
   currently false on the Python surface.
2. **A.md §6:** Tranche close gate `uv run pytest green`. Cannot pass W6 without
   resolving the bases failures.
3. **A.md §9:** "Brittleness window — None." The plan declares no window, but
   the pytest gate is already red at open. By precept (`SPEC.md:69-79`) a
   brittleness window must be declared *before* dispatch, with
   `suspended_gates: [uv run pytest]` and a `restoration_wave`.
4. **W1.md hard gate (3):** "`uv run pytest` green — output captured." W1
   cannot legitimately close on this gate at present.

**Required plan amendments:**

- Add a W0 sub-task: **investigate the two `test_bases.py` failures.** Three
  possible dispositions (decide at W0 challenge, not later):
  (a) the tests are correct and the implementation regressed → fix at W0 (the
  C1 cohort touches `api/` but not `bases.py`; the regression likely landed
  outside the dirty tree, in a prior commit);
  (b) the tests are wrong and the implementation is correct → fix the tests at
  W0;
  (c) the failures are pre-existing and not addressable inside A → declare a
  brittleness window in `A.md §9` with `suspended_gates: [test_bases.py::*]`
  and a named restoration wave (most likely W4 or a tranche-B sibling).
- Re-state W1.md hard gate (3) as "`uv run pytest` green *modulo any A.md §9
  suspended tests*" so the gate is honest.

### 1.4 `.gitmodules`, `docs/precepts/`, `docs/instructions/`, `tsbuildinfo`

| Item | Observed | Plan claim | Verdict |
|---|---|---|---|
| `.gitmodules` | untracked (`git status` `??`); contains a single submodule for `docs/precepts` | A.md §5 "W0 owns" | matches — W0 commits it |
| `docs/precepts/` | untracked directory; on-disk submodule pointer file `.git` present (`ls -la docs/precepts/` shows `.git` 41-byte file dated Apr 29); `git submodule status` returns *empty* because `.gitmodules` isn't tracked yet | A.md §5 W0 commit | matches — W0 commits the submodule registration |
| `docs/instructions/` | untracked; contains `README.md` + sub-dirs (precept-compliant repo-local rules) | A.md §5 W0 commit | matches |
| `web/tsconfig.tsbuildinfo` | **tracked** (`git ls-files \| grep tsbuildinfo` → present), modified in the dirty tree; **not** in `.gitignore` (`.gitignore:1-` has `__pycache__/` and `web/dist/` but nothing matching `tsbuildinfo`) | A.md §5 W0: "`tsbuildinfo` untracked + gitignored" | matches — W0 has to (a) untrack via `git rm --cached`, (b) add to `.gitignore` |
| `__pycache__/` | `.gitignore:2` excludes; `git ls-files \| grep pycache` → 0 | b-precepts-compliance.md F-2 | already compliant — F-2 is over-flagged; no action needed at W0 beyond confirming |

**§1 verdict:** vue-tsc green; pytest **red (2 failures)**; submodule/wiring
state matches what A.md §5 / W0 was scoped to commit. The single load-bearing
defect in A.md is **the un-declared red pytest state** — this must be addressed
in W0 or by a declared brittleness window.

---

## §2 — W0 challenge probe additions (concrete)

A.md §3 wave-table for W0 lists three stated challenge items (re-derive every
audit `file:line`; reconcile the C-vs-D slider-gap contradiction; decide the
rate-limiter replica strategy). Cross-checking against the 14 chronic/deferred
items in `a-plan-archaeology.md` §5–§6 and the 7 violations in
`b-precepts-compliance.md` §3, the following additional probes are mandatory
before W1 dispatches.

### 2.1 Probes that close honesty gaps in A.md itself

| # | Probe | Why it's mandatory | Plan consequence |
|---|---|---|---|
| **P1** (HIGH) | **Re-derive the uncommitted file count at W0 open and rewrite every A-folder citation that says "107"** (`A.md:13`, `A.md:79`, `A.md:104`, `coordination/CONSTELLATION.md:20`, `PROGRESS.md:21`, `W1.md:7,12`). The current count is 109; the figure may drift again before W1 commit boundary. | A §6 hard gate "PROGRESS.md matches reality" — but A.md's own §1 thesis lies about reality. | Pin the count at the W1 commit boundary, not authoring time. |
| **P2** (HIGH) | **Run `uv run pytest` and surface the test_bases failures.** Currently 2 failures on `test_chebyshev_partial_sum` + `test_legendre_partial_sum` (98% mismatch each). Determine origin (regression vs. test-error vs. pre-existing). | A.md §2 declares green-at-open; A.md §9 declares no brittleness window; W1.md gate (3) requires pytest green. All three are currently inconsistent with reality. | Either fix in W0, OR add explicit brittleness window per `SPEC.md:69-79` with named restoration wave. |
| **P3** (HIGH) | **Verify the npm `keyframes.js` Q-tranche fix is live.** `a-plan-archaeology.md:40` records that fourier was build-broken at Q11 audit because `@mkbabb/keyframes.js` `dist/` was missing; the audit says the dist has since been rebuilt but flags fourier should "re-verify its own build". W0 must re-run `npm install && vue-tsc -b --force` from a clean node_modules to confirm no latent Q-tranche fallout. | vue-tsc exit-0 was observed *with current node_modules*; a fresh install may still fail if package resolution is fragile. | Either confirm clean or capture as a fourier-local carry. |
| **P4** (HIGH) | **Confirm every "verified clean" claim about the 31 deletions in `a-plan-archaeology.md §3.1`.** That audit flagged `BouncyToggle.vue` as ⚠️ "no direct replacement import found — verify no orphaned `<BouncyToggle>` refs". W0 must `git grep` for `BouncyToggle` (and every other deleted symbol) before W1's per-file deletion ledger is authored, not after. | `a-plan-archaeology.md §5 D9` lists this as an open verification, not a verified-clean. W1's deletion-ledger gate (`W1.md:51`) assumes the verification can be done file-by-file, but D9 is an *unresolved* item — it must be discharged at W0 or its destination wave named. | Either fold D9's verification into W0 (the right call — W0 is hygiene), or W1.a's mechanism explicitly absorbs it. |
| **P5** (HIGH) | **Audit `style.css`'s already-committed `8-line` state.** `b-precepts-compliance.md:292-294` says `style.css` reduced 721 → 6 lines but `c-style-consumer.md:8,20` says it is 8 lines and lists 4 active `@import` lines. The 1-line discrepancy is small but indicative — W0 must verify which line count is current and reconcile. | The W1 commit must match what W2 expects to delete (the `fourier-overrides.css` / `ios-fixes.css` imports). If W0 didn't verify, W2 dispatches against unknown state. | Re-state W1 file bounds and W2 file bounds against the *measured* current `style.css`. |

### 2.2 Probes that bind chronic items C1–C5 to A

`a-plan-archaeology.md §6` lists 5 chronic items. A.md folds them (§7, §8) but
the chronic *recurrence pattern* is not itself a probe target. The challenge
wave should test the folding.

| # | Probe | Chronic item | Plan consequence |
|---|---|---|---|
| **P6** (MED) | **Cite the audit `file:line` for every C1–C5 mention.** A.md §1.4–§8 references "chronic item C1", "C4", but does not cite `a-plan-archaeology.md:164-168` (the chronic ledger lines). The challenge wave should require A.md to footnote-cite the audit lines that justify each chronic-item claim. | Audit traceability — invariant 6 (gates close on evidence) applied to plan claims. | Add a footnote-citation pass to A.md (or a checked checklist). |
| **P7** (MED) | **Verify C5 ("fourier never gets its own tranche") is structurally remedied — not just nominally.** The chronic was that fourier ran as a consumer of glass-ui's letter stream. A.md opens its own stream and binds the constellation to it (§coordination). Challenge: does the constellation document the *binding direction* clearly? Specifically, is fourier still permitted to receive glass-ui dispatch into the same tree, or does A "fence" the repo to its own letter for the duration of A? | A invariant 7 (no silent deferral) and the constellation co-protocol need an explicit forbid/permit on inbound dispatch during A. | Add a clause to `coordination/CONSTELLATION.md` "Coordination protocol" naming whether inbound CR-N from glass-ui is *suspended* for A's duration, or *permitted* with a specific carry mechanism. |
| **P8** (MED) | **Verify the C4 cohort (P12 + un-wired substrate D3) is fully absorbed.** A.md §8 names P12 → W3 but `a-plan-archaeology.md §6 C4` is *two* items: P12 (`AnimatedDigit`/`Metric*`) **and** P13 (`MetricBadge`/`MetricPill`/`StatusDot`/`Skeleton`/`useTouchGate`/`useResizeObserver`). W3.md §scope (3) covers `AnimatedDigit`/`MetricRow`/`MetricStack`/`MetricCell`/`StatusDot`/`Skeleton` (6 items), but `useTouchGate` and `useResizeObserver` are not in W3's scope or W3's archaeology. | Two specific glass-ui substrates flagged at O11/b and P11/b have no destination wave. By invariant 7, they must be landed, retired, or named-destinationed. | Either add `useTouchGate`/`useResizeObserver` to W3 scope, OR formally retire them in A's §debt (W6 FINAL.md). |
| **P9** (MED) | **Confirm D5 (`SliderControl.vue` cosmetic `variant` prop) is named.** `a-plan-archaeology.md §5 D5` and `b-precepts-compliance.md` flag this as a deferred item from `W5-Lane-B`. A.md does not name it in §3 wave-table, §5 file ownership, §7 recap, or §8 carry-forward. By invariant 7 it is silently deferred. | Plan-archaeology invariant — every deferred item gets a named wave or formal retirement. | Add D5 explicitly to W3 (it's an interactive-primitive vocabulary issue, fits W3) or formally retire it as a no-op (the prop is harmless cosmetic). |

### 2.3 Probes that close audit-b precept-compliance violations

`b-precepts-compliance.md §3` lists 7 violations F-1 through F-7. A.md addresses
some inline but does not document the closing condition for each.

| # | Probe | Violation | Plan consequence |
|---|---|---|---|
| **P10** (HIGH) | **F-1 closure: `web/tsconfig.tsbuildinfo` must be (a) `git rm --cached`'d and (b) added to `.gitignore`.** A.md §5 names W0 ownership but doesn't list the *.gitignore* edit. Verify both halves land at W0. | F-1 (HIGH). | Add `.gitignore` to W0's modify list in A.md §5; record the `git rm --cached` command in PROGRESS.md when W0 runs. |
| **P11** (LOW) | **F-2 reaffirmation: `__pycache__/` is already in `.gitignore:2`.** Audit-b says "confirm `.gitignore` excludes `__pycache__/`." Verified clean. No further action — record this as discharged so W0 doesn't re-investigate. | F-2 (MED). | Mark F-2 as discharged in W0 challenge output; no edit needed. |
| **P12** (HIGH) | **F-3 — the 107 (now 109) cohort needs a recorded *deletion-replacement* mapping committed alongside the W1 cohort.** A.md §1 ¶1 (footnote: "every deletion has a wired replacement") and W1.md §4 (deletion proof) state the verification will happen, but the verification *evidence* lives only in `a-plan-archaeology.md §3.1`. W1.md should require the deletion-ledger to *copy* (not just reference) the audit findings into a tranche-committed artefact. | F-3 (HIGH). | W1's deletion-ledger is the audit-committed evidence. See §3 below for the exact column set. |
| **P13** (HIGH) | **F-4 and F-5 — `lib/logo.ts` and `lib/math-worker.ts` deletion.** A.md §5 names W4 ownership (correct). Challenge: the deletion *must* be a `git grep` deletion proof; the W4 hard-gate `git grep` clause is listed at A.md §6 bullet 7 and W4.md hard-gate (4). Verify both grep targets cover *every* exported symbol (not just the file path). | F-4, F-5 (HIGH). | W4.md sub-gate must enumerate the exported symbols (`Harmonic`, `DEFAULT_HARMONICS`, `generateEpicycleLogoPath`, plus math-worker's exports) so the grep is exhaustive. |
| **P14** (LOW) | **F-6 — `docs/tranches/` exists now; discharged by tranche author.** Discharged. | F-6 (MED). | Mark discharged. |
| **P15** (LOW) | **F-7 — `docs/instructions/`, `docs/precepts/`, `.gitmodules` untracked.** W0 owns. Discharged at W0 commit. | F-7 (LOW). | Already in W0 scope. |

### 2.4 The three highest-impact additions (TL;DR)

Of the 15 probes added above, three are critically load-bearing:

1. **P2 — resolve or declare-brittleness the 2 failing `test_bases.py` tests.** Without this, A.md §2/§6/§9 are dishonest at open.
2. **P9 (and friends P7, P8) — name the silently-deferred items D5, `useTouchGate`, `useResizeObserver`.** A invariant 7 violation; cheap to fix in W0 challenge output.
3. **P12 — make the W1 deletion-ledger a committed artefact, not a reference to an audit doc.** Audit docs are not under version-controlled invariant; tranche docs are.

---

## §3 — W1 deletion-ledger format proposal

### 3.1 The exact column set

`W1.md:51` requires "the commit message or a `W1-deletion-ledger.md` entry
names the glass-ui (or new-path) replacement and the browser route confirming
it renders". This is the minimum; per invariants 4 + 6 (substrate with consumer,
gates close on evidence) the ledger should carry strictly more.

Proposed columns (one row per deleted file, 31 rows):

| Column | Source | Why |
|---|---|---|
| 1. `path` | `git status --porcelain \| grep '^ D'` | the file being deleted |
| 2. `kind` | inspect (.vue / .ts / .css / .py / index-barrel) | tells the reviewer what to verify (visual render vs. type import vs. style cascade) |
| 3. `category` | derived: `glass-ui-shadow-copy` / `directory-relocation` / `auth-store-replacement` / `module-fold` / `dead-code` | groups the 31 deletions into the 3 substantive sub-cohorts the W1 commit splits into |
| 4. `replacement_path` | source-grep | the glass-ui subpath, new in-tree path, or store path |
| 5. `replacement_kind` | `npm-package-subpath` / `relocated-file` / `pinia-store` / `inlined-into-component` | makes the wired-substrate verifiable, not assumed |
| 6. `consumer_import_site(s)` | `git grep` after change | invariant 4 — substrate without consumer is unfinished; this is the *consumer-side proof* |
| 7. `confirming_route(s)` | manual / browser | the route or component where a human-observable render proves the swap is live |
| 8. `verification_command` | grep / route URL / a test | the literal command/URL to reproduce the verification |
| 9. `disposition` | `verified-clean` / `verified-with-route-evidence` / `flagged-for-rework` / `flagged-for-retire` | a typed disposition, not a free-text comment |
| 10. `audit_source` | `a-plan-archaeology.md §3.1`, `f-design-math-functionality.md §3d`, etc. | cites the prior-audit row that already verified this deletion (P12 in §2 above) |
| 11. `commit_chunk` | one of W1's commits | maps each deletion to which of the W1 commits it landed in |

11 columns; each populated before the W1 commit, not after.

### 3.2 The 31 deletions — pre-populated category breakdown (audit baseline)

From `git status --porcelain | grep '^ D'`:

| Category | Count | Files |
|---|---|---|
| `glass-ui-shadow-copy` (subpath-published primitives) | 18 | `ui/select/*` (12), `ui/slider/*` (2), `ui/collapsible/*` (2), `ui/GlassDock.vue`, `ui/UnderlineTabs.vue` |
| `glass-ui-shadow-copy` (root-barrel published) | 2 | `ui/BouncyToggle.vue`, `ui/ToastContainer.vue` |
| `directory-relocation` | 4 | `components/{FourierMorphDemo,FourierShapeExtractor}.vue`, `paper/{paperSearchIndex,usePaperSearch}.ts` |
| `module-fold` (into owning component / store) | 4 | `visualization/DockPopover.vue`, `composables/useDockState.ts`, `visualization/lib/dock-buttons.css`, `lib/utils.ts` |
| `auth-store-replacement` | 3 | `composables/{useAdminAuth,useUserAuth,useSession}.ts` |
| `composable-fold` | 1 | `layout/composables/useHoverCard.ts` |
| **Total** | **31** | |

This map should be a sub-table inside the ledger; the per-file columns above
fill in the row detail. The `BouncyToggle` row is the one `a-plan-archaeology.md`
flagged for re-verification (no direct replacement import surfaced) — its
ledger entry needs explicit `verification_command` evidence.

### 3.3 Is the 4-chunk commit split optimal?

W1.md §scope (3) says "Commit in coherent reviewable chunks by surface (web
component migration; `style.css` decomposition; api admin/auth/gallery feature;
Docker/nginx infra), each with a conventional-commit subject citing `A.W1`."
That is **4 chunks**.

Cross-checking against the agent unit structure (W1.md §Agent Units defines 3
agents: a/b/c = web / api / infra), the natural commit shape is:

| Agent | Commits | Rationale |
|---|---|---|
| A.W1.a (web) | 2 commits | (i) glass-ui shadow-copy retirement (18+2+4+4+1 = 29 deletions + ~62 modified web files) **OR** split into (i.a) deletions + their consumer rewrites and (i.b) `style.css` decomposition + the 3 styles/ untracked files. The plan's 4-chunk split assumes (i.a) and (i.b) are different commits, which is correct — they're different surfaces. So: web-deletions-and-rewires + style-decomposition = 2 commits. |
| A.W1.b (api) | 1 commit | The +778-line admin/auth/gallery cohort is one feature. Splitting it further loses coherence. |
| A.W1.c (infra) | 1 commit | docker-compose / nginx / .env.example / dev.sh / `.gitignore` — one infra commit. |
| **Total** | **4 commits** | matches the W1.md plan. |

**Verdict: the 4-chunk split is the right shape.** No additional split is
warranted; collapsing further would lose surface-coherence. One nuance: the
W0-owned `.gitmodules` + `docs/precepts/` + `docs/instructions/` should *not*
be in the W1 infra commit (it's W0's commit per A.md §5). Verify this
boundary is preserved.

One amendment: the 4-chunk split should be **renumbered to a fixed commit
sequence** so reviewers can read them in dependency order. Proposed order:

1. (W0) submodule + ignore wiring (`.gitmodules`, `docs/precepts/`, `docs/instructions/`, `.gitignore`, `git rm --cached web/tsconfig.tsbuildinfo`).
2. (W1.a.1) glass-ui shadow-copy retirement + consumer rewires (web/src/components/, web/src/composables/, web/src/lib/, App.vue, router, index.html).
3. (W1.a.2) `style.css` decomposition (`style.css` + `web/src/styles/*`).
4. (W1.b) api admin/auth/gallery feature (+ `api/models/admin.py` untracked).
5. (W1.c) infra (compose, nginx, env.example, dev.sh, Dockerfile).

Each commit's subject line cites `A.W0` or `A.W1.x` per the AGENT_DISPATCH_TEMPLATE.

---

## §4 — SPEC.md / WAVE_SPEC.md compliance diff

### 4.1 A.md against `SPEC.md §Plan Shape` (9 parts)

SPEC.md §"Plan Shape" requires the following 9 numbered parts:

| SPEC § | Required content | A.md location | Divergence |
|---|---|---|---|
| 1 | opening paragraph: what this tranche completes | A.md `# A — fourier-analysis charter tranche…` header + meta block (lines 1–9) | The meta-block (lines 3–9: predecessor, constellation linkage, open commit, close commit, span, mode) is **extra** content that SPEC §1 does not require. Compliant by addition. The "what this tranche completes" line is at line 1 (the title) plus the §1 opening paragraph. Acceptable. |
| 2 | thesis: why the change composes | A.md §1 (lines 11–26) | Present and well-formed. Compliant. |
| 3 | invariants | A.md §2 (lines 28–46) | Present, 13 numbered invariants. Compliant. |
| 4 | wave table: wave, agents, closes-on evidence, status | A.md §3 (lines 48–60) | Present. Compliant. Note: the table has 5 columns (Wave, Title, Agents, Closes on, Status) — SPEC names 4 attributes but adding "Title" is helpful, not a divergence. |
| 5 | phases or links to wave specs | A.md §4 (lines 62–72) | Present. Compliant. |
| 6 | critical files and ownership | A.md §5 (lines 74–85) | Present. Compliant. **Divergence:** Row "Submodule / repo wiring" includes `web/tsconfig.tsbuildinfo` but doesn't include `.gitignore` (which is being modified to *gitignore* tsbuildinfo). Recommended language: append `.gitignore` to the same row's files list, OR add a sub-row for "ignore-file hygiene" pointing at `.gitignore`. |
| 7 | hard gates | A.md §6 (lines 87–100) | Present. Compliant. **Divergence:** the gate "`uv run pytest` green" assumes pytest is green — but it currently isn't (§1.3 above). This gate either needs the brittleness-window framing or a W0 sub-gate "investigate failures" explicitly. |
| 8 | cross-tranche debt and explicit deferrals | A.md §8 (lines 124–146) | Present, well-structured. Compliant. |
| 9 | brittleness window, if any | A.md §9 (lines 148–149) | Present but declares "None". Pytest is red — see §1.3 — so this is in tension with reality. Either fix pytest in W0 or declare a window. |

**§7 Prompt and precept recap** appears at A.md §7 (lines 102–122) — this is
*extra* content that SPEC.md doesn't require but does not forbid. It's
useful (it discharges the §1 thesis's "demonstrably addresses every request").
The risk: SPEC §"Plan Shape" says "Do not include commentary, motivational
prose, or duplicated shared precepts." The recap table is not motivational, but
some readers could read it as commentary. **Recommendation:** leave §7 as-is
but rename it to "§7 — Request/precept disposition map" to make clear it is
*disposition tracking* (load-bearing), not commentary.

**Overall A.md compliance: 9/9 sections present**. Two real divergences:
- §6 omits `.gitignore` from the W0 file list (cosmetic; fix in §5).
- §9 declares "None" while reality has 2 failing tests (substantive; fix per §1.3 above).

### 4.2 W1.md against `WAVE_SPEC.md` (9 sections)

WAVE_SPEC.md requires the following 9 sections (1. Header, 2. State, 3. Scope,
4. File Bounds, 5. Agent Units, 6. Hard Gate, 7. Verification Artefacts, 8.
Dependencies, 9. Archaeology).

| W-SPEC § | Required content | W1.md location | Divergence |
|---|---|---|---|
| 1 | Header `# {LETTER}.W<N> - <Title>` | W1.md:1 `# A.W1 — Attribute & land the glass-ui migration cohort` | Compliant. (Uses Unicode em dash per memory.) |
| 2 | State block (Opens after / Agents / Hard gate / Status) | W1.md:3–8 `## State` | Compliant — all 4 fields present. |
| 3 | Scope (numbered bullets) | W1.md:10–15 `## Scope` | Present, 4 numbered bullets. Compliant. **Minor divergence:** bullet 2 uses inline citations (`web/src/components/ui/select/*` etc.) which is *evidence-rich* but mixes scope with verification — readable, not a defect. |
| 4 | File Bounds (table + "Do NOT touch") | W1.md:17–24 `## File Bounds` | Compliant. |
| 5 | Agent Units (one subsection per unit with Mechanism / Files / Sub-gate) | W1.md:26–44 `## Agent Units` | Compliant — 3 agents (a, b, c), each with the required triplet. |
| 6 | Hard Gate (numbered, evidence-backed conditions) | W1.md:46–52 `## Hard Gate` | Present, 5 numbered conditions. Compliant. **Divergence:** condition (3) is "`uv run pytest` green — output captured" but pytest is red at HEAD (§1.3). Either fix at W0 or add "modulo A.md §9 suspended tests". Condition (4) requires a deletion-ledger entry but doesn't pin the exact columns — see §3 above for the proposed columns. |
| 7 | Verification Artefacts | W1.md:54–58 `## Verification Artefacts` | Present. Compliant. **Recommendation:** rename `audit/W1-deletion-ledger.md` to follow the audit pattern of the other waves (e.g. `docs/tranches/A/audit/` vs. `docs/tranches/A/audit/W1-deletion-ledger.md` is the path — fine). Recommend listing the 11 ledger columns inline here so the artefact format is part of the spec, not implicit. |
| 8 | Dependencies | W1.md:60–63 `## Dependencies` | Compliant. |
| 9 | Archaeology | W1.md:65–67 `## Archaeology` | Present and well-stated (cites C1 chronic + K-invariant-3 + the new guardrail). Compliant. |

**Overall W1.md compliance: 9/9 sections present**. One substantive
divergence: the pytest-green condition needs reconciliation with the red
worktree state (single root cause shared with A.md §9).

### 4.3 The top SPEC compliance gap

Both A.md §9 and W1.md §6 condition (3) **declare pytest green** while pytest
is red. This is the single load-bearing precept failure across the two
documents: SPEC.md §"Hard Gates" forbids narrative-only proof; gates close on
artefacts. The artefact (`uv run pytest -q`) currently produces 2 failures.
Either the failures resolve at W0 (preferred) or both documents need amendment
to declare a brittleness window per SPEC.md §"Brittleness Window" (lines 69–79):

```yaml
breaking_changes_during_wave: yes
suspended_gates:
  - tests/test_bases.py::TestEvaluatePartialSum::test_chebyshev_partial_sum
  - tests/test_bases.py::TestEvaluatePartialSum::test_legendre_partial_sum
restoration_wave: W<N>
reason: <to be filled in at W0 challenge>
```

---

## §5 — Chronic/deferred item coverage matrix

Cross-checking `a-plan-archaeology.md §5 (Deferred Items D1–D9)` and `§6
(Chronic Items C1–C5)` against A.md's wave table, §5 ownership, §7 recap, §8
cross-tranche debt, and the W1–W5 spec scopes. A invariant 7 (no silent
deferral) requires every item to land in a wave, formally retire, or be named
to a destination tranche.

### 5.1 Chronic items C1–C5

| ID | Item | A disposition | Wave/tranche | Status |
|---|---|---|---|---|
| **C1** | 107-file (now 109) in-flight migration uncommitted across O/P/Q | A.md §1 ¶1, §3 W1, §8 "Inherited" → W1 | A.W1 | **covered**. |
| **C2** | GlassScrubber substrate decision (was chronic; landed at P.W5 Lane B) | A.md does not name C2 by ID; closed at `4df1a06`. A.md §3 W0 has the discharge re-confirmation implicit in "build verified green" + the constellation table at `coordination/CONSTELLATION.md:22-23`. | confirmed at W0; no fresh work | **covered (already discharged)** — but recommend A.md §8 add a one-line "C2 — discharged at `4df1a06`; W0 re-confirms" for paper-trail completeness. |
| **C3** | `EquationView.vue:8` reka-ui HoverCard direct import (was chronic; landed at P.W5 Lane B.3) | Closed at `4df1a06`; coordination doc lists it. | confirmed at W0 | **covered (already discharged)** — same recommendation as C2. |
| **C4** | AB+1 primitive adoption (D2) + un-wired substrate (D3) | A.md §8 "P12 → lands at W3"; W3.md §scope (3) | A.W3 | **partially covered**. W3 scope names `AnimatedDigit`/`MetricRow`/`MetricStack`/`MetricCell`/`StatusDot`/`Skeleton` (6 items) — that's P12 + half of P13. **`useTouchGate` and `useResizeObserver` (from D3) are NOT in W3 scope** — they have no destination. By invariant 7, they must be added to W3 or formally retired. (See §2.4 / P8 above.) |
| **C5** | fourier never gets its own tranche | The act of authoring A.md fixes this; coordination doc binds the constellation | A as a whole | **covered**, but P7 above recommends a binding-direction clause to make permanent. |

### 5.2 Deferred items D1–D9

| ID | Item | A disposition | Wave/tranche | Status |
|---|---|---|---|---|
| **D1** | Commit the 107-file migration | A.md §1, §3 W1 | A.W1 | **covered**. |
| **D2** | AB+1 primitive adoption cohort | A.md §8 P12, W3.md §scope 3 | A.W3 | **covered**. |
| **D3** | Un-wired substrate cohort (`MetricBadge`/`MetricPill`/`StatusDot`/`Skeleton`/`useTouchGate`/`useResizeObserver`) | A.md §8 P13 (folded into W3 implicitly via W3 scope), but W3 scope misses `useTouchGate`/`useResizeObserver` | A.W3 (partial) | **partially covered**. **GAP: `useTouchGate`, `useResizeObserver` lack a named destination.** |
| **D4** | DESIGN.md migration tasks (5 self-authored items: Dialog migration, Button-variant migration, Card migration, duplicate-keyframe deletion, CVA decision) | A.md §7 "glass-ui DESIGN.md migration tasks (constellation P10)" → "W2/W3 fold" | A.W2 + A.W3 | **covered nominally**, but the explicit 5-item DESIGN.md checklist is not enumerated in W2 or W3 — verify each item maps to a wave scope bullet. The Dialog migration lands at W5 (admin lift), the Button-variant migration at W3, Card migration nowhere explicitly named, duplicate keyframes at W3, CVA decision nowhere named. **GAP: Card migration and CVA decision** are not in any wave scope. |
| **D5** | `SliderControl.vue` cosmetic `variant` prop cleanup | A.md does not mention D5 by ID; not in any wave's scope | unnamed | **GAP — silently deferred, A invariant 7 violation.** Recommend folding into W3 (interactive-primitive vocabulary) or formal retirement in §8. |
| **D6** | Build-green verification (post-keyframes.js rebuild) | A.md §3 W0 "build green" hard gate; W0 directly verifies | A.W0 | **covered**. |
| **D7** | Infra plan phases 0→5 (webhook CI/CD, Mongo TLS, VPN removal, port standardization) | A.md §7 "W4 deploy-surface hygiene; remainder → tranche C (§8)" | A.W4 partial + tranche C | **covered** (named to tranche C). |
| **D8** | `docs/precepts`/`docs/instructions` + `.gitmodules` untracked | A.md §3 W0 | A.W0 | **covered**. |
| **D9** | `BouncyToggle.vue` deletion replacement verification | A.md does not mention D9 by ID. The deletion verification mechanism is implicit in W1.md §scope 2 ("verify, before committing, that every deleted file has a wired, rendering glass-ui replacement"), but `BouncyToggle` is the one row `a-plan-archaeology.md §3.1` flagged ⚠️ "no direct replacement import found". Without naming, the at-risk row may not get the extra scrutiny. | A.W1 (implicit) | **covered nominally** — strongly recommend the W1 deletion-ledger row for `BouncyToggle.vue` carry a `flagged-for-rework` disposition until verified, not a `verified-clean`. (See §2 P4.) |

### 5.3 Coverage matrix summary

| Category | Total | Fully covered | Partially / nominally covered | Uncovered (gaps) |
|---|---|---|---|---|
| Chronic items C1–C5 | 5 | 4 (C1, C2, C3, C5) | 1 (C4 — `useTouchGate`/`useResizeObserver` missing) | 0 |
| Deferred items D1–D9 | 9 | 6 (D1, D2, D6, D7, D8 — and D9 nominally) | 1 (D4 — Card + CVA decision missing) | 1 (**D5 — silently deferred**) |

**Items needing explicit attention before W1 dispatch:**

- **D5** — name a destination (W3 or §8 formal retirement). [Invariant-7 violation, must fix.]
- **D4** — name destinations for "Card migration" and "CVA decision" inside W2 or W3 scope.
- **C4** — extend W3 scope to include `useTouchGate` and `useResizeObserver`, or formally retire them.
- **D9** — flag `BouncyToggle.vue` row of the W1 deletion-ledger as `flagged-for-rework` until empirically verified.

These four items are the residual "silent deferral" risk in A.md as currently
written. None is structurally fatal; all are one-line plan amendments.

---

## §6 — Recommendations (consolidated, dispatch-ready)

1. **W0 must investigate and resolve the 2 failing `test_bases.py` tests** before W1 opens (or declare an A.md §9 brittleness window with explicit restoration wave). Update A.md §2/§9 and W1.md §Hard Gate (3) accordingly. [Severity: HIGH.]
2. **Re-pin the cohort count** at W1 commit boundary; A.md §1, §5, §7, W1.md, PROGRESS.md all say 107 — actual is 109; will drift again if W0 takes time. [Severity: MED.]
3. **Add `.gitignore` to W0 file list** in A.md §5 row 1; W0 must `git rm --cached web/tsconfig.tsbuildinfo` and add the corresponding ignore line. [Severity: MED.]
4. **Author the W1 deletion-ledger as a committed artefact** with the 11 columns named in §3.1; flag `BouncyToggle.vue` row as `flagged-for-rework` until verified. [Severity: HIGH.]
5. **Add D5 / `useTouchGate` / `useResizeObserver` / "Card migration" / "CVA decision" to either W3 scope or A.md §8 formal-retirement.** [Severity: MED — A invariant-7 violations.]
6. **Add a clause to `coordination/CONSTELLATION.md` Coordination protocol** stating whether inbound glass-ui dispatch into the fourier tree is permitted or suspended for A's duration. [Severity: LOW — clarity, not correctness.]
7. **Add footnote-citations to A.md §7 / §8** for each `a-plan-archaeology.md` chronic/deferred item (cite the audit `file:line`). [Severity: LOW — traceability.]
8. **The 4-chunk commit split is correct.** Keep as-is; renumber to a fixed sequence per §3.3 above. [Severity: INFO — no change to plan.]

---

## §7 — Verification (this document)

- `git status --porcelain | wc -l` → 109; `git status --porcelain | grep -cE '^ M'` → 62; `grep -cE '^ D'` → 31; `grep -cE '^\?\?'` → 16.
- `cd web && npx vue-tsc -b --force` → exit 0; no output.
- `uv run pytest -q` → `2 failed, 87 passed in 69.90s`; failures in `tests/test_bases.py::TestEvaluatePartialSum::{test_chebyshev_partial_sum,test_legendre_partial_sum}` (98% sample mismatch each).
- `git ls-files | grep tsbuildinfo` → `web/tsconfig.tsbuildinfo` (tracked).
- `.gitignore` does not contain `tsbuildinfo`; does contain `__pycache__/`.
- `git submodule status` → empty (`.gitmodules` untracked).
- All cited `file:line` references re-derived against the live tree.
- Read-only throughout; no edits, no commits.
