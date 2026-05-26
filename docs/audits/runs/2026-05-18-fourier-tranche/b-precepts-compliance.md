# Audit B — Precepts & Tranche-Format Compliance

**Repo**: `/Users/mkbabb/Programming/fourier-analysis`
**Date**: 2026-05-18
**Mode**: read-only. No edits, no commits.
**Scope**: internalize the precepts submodule, derive the tranche document
skeleton from glass-ui exemplars, audit the 107-file uncommitted state against
the Core Rules, and recommend the layout for fourier's first own tranche.

---

## 1. Precepts digest (the binding rules, terse)

Read order is fixed: `docs/precepts/instructions/**` → `docs/instructions/**` →
`docs/tranches/{LETTER}/{LETTER}.md` → `docs/tranches/{LETTER}/waves/*.md`.
The submodule is pinned by SHA and not edited from a consumer tranche.

### Core Rules (`docs/precepts/README.md`)

1. **KISS / DRY.** Smallest complete mechanism; remove duplication before adding
   policy.
2. **Execute the plan.** No stubs, shadow APIs, `*_v2`, fallback paths, or
   "temporary" compatibility layers routing around the plan.
3. **Substrate lands with consumer.** A primitive with no runtime caller, test,
   or benchmark is unfinished work.
4. **No overfitting.** A public surface / helper / token / component / parser
   branch / process rule needs a current consumer and evidence; otherwise
   delete. Single-use private helpers inline.
5. **Gates close on evidence.** Build/lint/test output, runtime observation,
   benchmark artefact, generated diff, deletion proof, or explicit doc
   reconciliation. "API exists" / "grep found a string" / "wired later" are
   invalid gates for runtime behaviour.
6. **Research is not a plan until challenged.** Open design space → research
   wave → challenge wave → synthesis.
7. **Wave close updates docs before the next wave opens.** `PROGRESS.md`, wave
   status line, parent wave table, `FINAL.md` on close.
8. **Repo-specific stays repo-specific.** `docs/instructions/README.md` holds
   only fourier rules; do not restate shared precepts.

### Operational corollaries (`instructions/README.md`, `ORCHESTRATION.md`)

- **No legacy code.** Delete dead code; do not rename, flag-hide, or comment it
  out.
- **No silent deferrals.** Planned work lands, formally retires, or moves to a
  *named* destination with rationale.
- **Indefatigability is the orchestrator's.** A stuck sub-agent halts and
  reports; orchestrator replans.
- **Wave model.** ≤ 10 agents/wave hard ceiling; default to the smallest count
  preserving disjoint write bounds; sequence by dependency, not ceremony;
  collapse waves that share one activation path.
- **Scope reveal.** When file bounds / hard gate / substrate-with-consumer
  wiring no longer describes the real work: pause, absorb or amend the spec,
  then redeploy. Never answer with shadow APIs or unconsumed scaffolding.
- **Triumvirate** (research + plan-augment + redress) is the default recovery
  for non-environmental stalls.
- **Brittleness window** must be declared *before* dispatch (YAML block:
  `breaking_changes_during_wave`, `suspended_gates`, `restoration_wave`,
  `reason`); the close ceremony cannot run while one is open.

### Local fourier rules (`docs/instructions/README.md`)

- Python: `uv sync --extra dev`, `uv run pytest`, `uv run ruff check`,
  `uv run mypy`. Web/API: `uv sync --extra web`, Docker compose, the `web/`
  Vite app — record which surface a gate exercises.
- Figure/reconstruction changes compare generated artefacts or tests, not
  source formulas. Web visual/interaction changes need browser evidence; API
  changes need focused endpoint/service tests.
- Production deploy files (`docker-compose.prod.yml`, nginx, env examples) are
  local operational surfaces — edit only in waves that own deployment.

---

## 2. Tranche document skeleton (copy-pasteable templates)

Derived from `tranche/SPEC.md` + `tranche/WAVE_SPEC.md` and cross-checked
against glass-ui `P/` (canonical forward-looking tranche) and `AB+1/`
(retrospective form — section order and prose register only). The numbered
section anchors in the live exemplars use `§N`; the templates below follow that
convention.

### 2.1 `{LETTER}.md` — the plan (9 parts per SPEC.md §"Plan Shape")

```markdown
# {LETTER} — <one-line cohort identity>

**Tranche letter**: {LETTER}.
**Successor to**: <prior tranche/commit, or "first fourier tranche">.
**Cohort identity**: <what this tranche closes / completes>.
**Mode**: <planning-only | implementation>.
**Open**: YYYY-MM-DD.

## §1 — Thesis
<what this tranche completes and why the change composes — 1-3 paragraphs.
No motivational prose.>

## §2 — Invariants
<numbered, binding rules specific to this repo/tranche. Do not restate
shared precepts. fourier has none codified yet; this tranche may open the
ledger at 1.>

## §3 — Wave schedule
| Wave | Opens after | Agents/Lanes | Hard gate (TL;DR) | Status |
|---|---|---|---|---|
| W1  | open        | <n>          | <evidence summary> | planned |

## §4 — Phases / links to wave specs
<inline phase detail, OR a pointer to waves/W<N>.md when a wave is broad.>

## §5 — Critical files and ownership
<the load-bearing files and which wave owns each.>

## §6 — Hard gates
<numbered, each closing on an artefact: build/test output, runtime
observation, benchmark, generated diff, deletion proof, doc reconciliation.>

## §7 — Cross-tranche debt and explicit deferrals
<every carry-forward with a NAMED destination wave/tranche, or
formal retirement with rationale. No generic "future work".>

## §8 — Brittleness window (if any)
breaking_changes_during_wave: <yes|no>
suspended_gates: [...]
restoration_wave: W<N>
reason: <why simpler than a false-compatible bridge>

## §9 — Authority
<this file, wave specs, FINAL.md, PROGRESS.md, research/, coordination/.>
```

### 2.2 `waves/W<N>.md` — per-wave spec (9 sections per WAVE_SPEC.md)

Use a separate wave spec when a wave has broad scope, ≥ 4 agents, or file
bounds that would clutter the parent plan.

```markdown
# {LETTER}.W<N> — <Title>

**Opens after**: <prior wave or tranche open>
**Agents**: <count> <serial|parallel>
**Hard gate**: <one-line evidence summary>
**Status**: <planned|in_progress|complete|complete_with_misses|blocked|superseded>

## Scope
<numbered bullets; each a concrete change or deletion. No "if time allows".>

## File Bounds
| File | Access |
|---|---|
| `path` | create|modify|modify-carve|delete |

Do NOT touch: <paths>

## Agent Units
### {LETTER}.W<N>.<x> <Title>
- Mechanism:
- Files:
- Sub-gate:

## Hard Gate
<numbered evidence-backed conditions; each names the command, runtime check,
benchmark, diff, or deletion proof that closes it.>

## Verification Artefacts
<concrete output paths, screenshots, logs, benchmark files, commit hashes.>

## Dependencies
- **Depends on**:
- **Blocks**:

## Archaeology
<only when revisiting a prior attempt: prior tranche, commit, failure mode,
new guardrail.>
```

### 2.3 `PROGRESS.md` — execution log (updated at every wave boundary)

```markdown
# {LETTER} — PROGRESS

## Timeline
<chronological per-wave entries: open/close timestamps, commits with
file-level deltas, gate results, test counts.>

## Per-wave summary
| Wave | Commits | Duration | Gate | Status |
|---|---|---|---|---|

## Process observations
<reusable incidents; fold into LESSONS-LEARNED only if cross-repo.>
```

### 2.4 `FINAL.md` — close report

```markdown
# {LETTER} — FINAL

**Tranche letter / Predecessor / This close / Span / Close commit**

## §1 — Thesis recap
## §2 — Per-wave landing summary    (table: wave | commits | headline)
## §3 — Hard-gate evidence          (each gate → resolving artefact path)
## §4 — Audit verdict matrix        (per audit lane: verdict + notes)
## §5 — Carry-forward               (every residual → NAMED destination)
## §6 — Net substrate delta         (what was added / retired)
## §7 — Close honesty checklist     (every claim grounded in a hash/artefact)
## §8 — Authority
## §9 — Final disposition
```

**Prose register** (from both exemplars): terse, declarative, evidence-first.
Every claim cites a commit hash, file:line, command, or artefact path. Tables
over prose for any enumerable set. No motivational language, no duplicated
shared precepts, no "should/could" hedging. Status words are a closed
vocabulary: `planned / in_progress / complete / complete_with_misses /
blocked / superseded` for waves; `LANDED / RETIRED / CARRIED / DEFERRED /
ARCHIVE` for ledger items.

---

## 3. Precept-violation findings

The current uncommitted state is a large glass-ui-migration cohort (93 files in
`git diff --stat`: +1,757 / −4,668; plus untracked additions). It is being
audited as the *input* to fourier's first tranche, so most findings are
"surface this in the tranche plan", not "stop work".

### Rule 2 — Execute the plan / no legacy, no silent deferral

- **F-1 (HIGH) — `web/tsconfig.tsbuildinfo` is a tracked build artefact.**
  `git ls-files` confirms it is committed; the diff churns it (`2` lines).
  Build output must not be version-controlled. It belongs in `.gitignore` and
  should be removed from the index. This is a DRY/no-cruft violation.
- **F-2 (MED) — `api/**/__pycache__/` directories exist on disk.** Not tracked
  (`git ls-files | grep pycache` → 0), so not a commit violation, but they are
  not gitignored either (`git check-ignore` returns nothing for `docs/`; verify
  `api/`). Confirm `.gitignore` excludes `__pycache__/` to prevent accidental
  staging.
- **F-3 (MED) — 107 uncommitted files with no plan folder.** The entire
  glass-ui v1.8.5 migration cohort (`ui/select/*`, `ui/slider/*`,
  `ui/collapsible/*`, `GlassDock`, `BouncyToggle`, `ToastContainer`,
  `UnderlineTabs`, `DockPopover`, dock composables, `lib/utils.ts` all deleted;
  `stores/auth.ts`, `web/DESIGN.md`, `web/src/styles/`, `paper/search/`,
  `morph/` all added) is mid-flight with no `docs/tranches/` attribution. This
  is precisely the **K-invariant-3 shadow-execution anti-pattern** that
  glass-ui's `AB+1` retrospective documents (LESSONS-LEARNED 2026-04-29 family).
  fourier has not codified that invariant, but the precepts bind it via the
  "no silent deferrals / execute the plan" rules. **The tranche being scaffolded
  is the correct remedy** — it must attribute this cohort, not leave it as a
  shadow commit.

### Rule 4 — No overfitting (substrate without a current consumer)

- **F-4 (HIGH) — `web/src/lib/logo.ts` has zero consumers.** 100 lines;
  exports `Harmonic`, `DEFAULT_HARMONICS`, `DEFAULT_CX/CY/BASE_RADIUS/
  NUM_POINTS`, `generateEpicycleLogoPath`. `grep -rn "lib/logo"` across
  `*.ts`/`*.vue` returns no import site. Delete-unused.
- **F-5 (HIGH) — `web/src/lib/math-worker.ts` is never instantiated.** 55
  lines. No `?worker` import and no `new Worker(...math-worker...)` anywhere;
  the only textual hit is a comment in `lib/evaluators.ts:3`. The web-worker
  offload path it implies is not wired. Either delete it, or the tranche wires
  it to a real consumer with a runtime gate — substrate-without-consumer is
  unfinished work (LESSONS-LEARNED 2026-04-29 "Substrate Without Consumer Is
  Not Progress").

### Rule 7 — Wave close updates docs / repo-specific stays repo-specific

- **F-6 (MED) — No `docs/tranches/` directory exists.** Required by the read
  order in `CONSUMING.md`. Until the tranche folder is authored, no plan exists
  for an orchestrator to execute. This is the deliverable, flagged here for
  completeness.
- **F-7 (LOW) — `docs/instructions/` and `docs/precepts/` are untracked.** The
  submodule is wired (`.gitmodules` present and correct:
  `git@github.com:mkbabb/precepts.git` at `docs/precepts`), and
  `docs/instructions/README.md` correctly holds *only* fourier-local rules with
  no shared-precept restatement (compliant with Rule 8). They simply need to be
  committed. `.gitmodules` itself is also untracked.

### Rule 3 / no-legacy — deleted-but-replaced (NOT violations)

The 31 deletions were cross-checked for dangling references
(`grep` for every deleted module path across `*.ts`/`*.vue`): **all clean**.

- `components/{FourierMorphDemo,FourierShapeExtractor}.vue` → moved to
  `components/morph/` (untracked new copies present).
- `components/paper/{paperSearchIndex,usePaperSearch}.ts` → moved to
  `components/paper/search/` (new folder; all importers updated to
  `./search/usePaperSearch`).
- `components/ui/{select,slider,collapsible}/*`, `GlassDock`, `BouncyToggle`,
  `ToastContainer`, `UnderlineTabs`, `DockPopover`, `lib/utils.ts`,
  `useHoverCard.ts`, `useDockState/useSession/useAdminAuth/useUserAuth.ts` →
  deleted as the glass-ui v1.8.5 subpath migration; no orphan importers.
- `web/src/style.css` reduced 721 → 6 lines; the body moved to
  `web/src/styles/{buttons,fourier-overrides,ios-fixes}.css`, re-imported by
  `style.css` and reachable from `main.ts`. Clean carve.

These are **correct clean breaks** — no shims, no `_legacy` rename, no flag.
They are evidence the migration is precept-shaped; the tranche plan should cite
them as already-landed in its §2/§6.

### Gate state (positive evidence)

- `npx vue-tsc -b --force` → **EXIT 0**. The web surface typechecks clean at
  HEAD-of-worktree. A real, evidence-backed gate for any web wave.

---

## 4. Overfitting candidates

Method per `docs/precepts/audits/overfitting-audit.md`: enumerate modules in
`web/src/lib/` and `web/src/composables/`, count distinct consumer files via
`grep -rl '/<name>['"\"']'` across `*.ts`/`*.vue`, exclude self.

| artefact | kind | definition | usage evidence | count | verdict |
|---|---|---|---|---|---|
| `lib/logo.ts` | module | `web/src/lib/logo.ts` | `grep -rn "lib/logo"` → no import site | 0 | **delete-unused** |
| `lib/math-worker.ts` | module | `web/src/lib/math-worker.ts` | no `?worker`/`new Worker` site; only a comment ref in `evaluators.ts:3` | 0 | **delete-unused** OR wire-with-runtime-gate |
| `lib/draftStorage.ts` | module | `web/src/lib/draftStorage.ts` | `stores/workspace.ts` | 1 | keep-current (1 consumer, semantic boundary) |
| `lib/svg-contours.ts` | module | `web/src/lib/svg-contours.ts` | `components/morph/FourierShapeExtractor.vue` | 1 | keep-current |
| `composables/useSafeStorage.ts` | composable | `web/src/composables/useSafeStorage.ts` | `stores/auth.ts` | 1 | keep-current (storage-failure semantics) |
| `lib/colors.ts` | module | — | 13 consumers | 13 | keep-current |
| `lib/golden-shimmer.ts` | module | — | 3 consumers | 3 | keep-current |
| `lib/{bases,evaluators,contourEditing,svg-fourier}.ts` | module | — | 2-4 consumers each | 2-4 | keep-current |
| `composables/{useFourierMorph,useMorphConfig,useOffsetPagination}.ts` | composable | — | 2-3 consumers each | 2-3 | keep-current |

**Verdict counts**: delete-unused 2, keep-current 13.

**Top deletion candidates**: `web/src/lib/logo.ts` and
`web/src/lib/math-worker.ts` — together ~155 LOC of zero-consumer surface. The
single-use modules (`draftStorage`, `svg-contours`, `useSafeStorage`) are
**not** inline-candidates: each is a coherent named boundary with one legitimate
consumer, not a contrived one-use helper. A deeper sweep of per-symbol exports
(vs. per-module) and of `api/` exports is warranted as a research-wave angle in
the tranche itself (canonical RESEARCH angle 4: dead/underused code).

---

## 5. Recommended tranche scaffolding

### 5.1 Letter

fourier has **no prior tranches**. Glass-ui letters (P, AB+1, …) are a separate
per-repo sequence; fourier starts its own at **`A`**. Recommended:
`docs/tranches/A/`.

### 5.2 Directory layout

```text
docs/tranches/
  A/
    A.md                  Plan (9 §-parts per SPEC.md §"Plan Shape")
    PROGRESS.md           Execution log, updated at wave boundaries
    FINAL.md              Close report
    research/             CONDITIONAL — see below
      A1-plan-vs-actual.md
      A2-overfitting-sweep.md
      ...
    waves/                CONDITIONAL — see below
      W1.md
      W2.md
      ...
    coordination/         CONDITIONAL — see below
      CONSTELLATION.md
```

### 5.3 Which conditional documents are warranted

- **`research/` — YES.** The 107-file cohort is open design space, not
  closed-form: it bundles a glass-ui v1.8.5 migration, a `lib/` overfitting
  cleanup, a `paper/search/` and `morph/` reorganisation, an `auth` store
  rework, and API model additions. Per `tranche/README.md`, research is skipped
  only when the work is closed-form. Dispatch 3-5 read-only research agents on
  the canonical angles: (1) plan-vs-actual diff of the cohort, (3) substrate
  without consumers — `logo.ts`/`math-worker.ts` plus an `api/` export sweep,
  (4) dead/underused/legacy code, (6) documentation drift (`web/DESIGN.md` vs.
  `MEMORY.md` chapter map). Save verbatim outputs under `research/`.
- **`audit/` or `challenge/` — YES, a challenge wave is mandatory.**
  LESSONS-LEARNED "Research Needs Challenge Before Synthesis" and `SPEC.md`
  §"Research And Challenge" bind it: every open-ended research wave is followed
  by a challenge wave before plan synthesis. Use ≥ 2 (half the research count)
  challenge agents. This audit run (`docs/audits/runs/2026-05-18-fourier-tranche/`)
  is itself a pre-research audit and should be cited as input, not as a
  substitute for the challenge wave.
- **`waves/W<N>.md` — YES for the broad waves.** The cohort splits along
  disjoint file bounds — at minimum: (a) glass-ui migration / deletions,
  (b) `lib/` + `composables/` overfitting cleanup, (c) `api/` model + router
  changes, (d) `paper/` + `morph/` reorg, (e) deploy-surface changes
  (`docker-compose*`, `nginx/`, `.env.example`) which `docs/instructions`
  requires be owned by a deployment-specific wave. Any wave with ≥ 4 agents or
  broad bounds gets its own `waves/W<N>.md`; small waves stay inline in `A.md`.
  Collapse waves that activate through the same files (LESSONS-LEARNED
  "Ceremonial Waves Hide Shared Activation Paths").
- **`coordination/CONSTELLATION.md` — YES.** fourier consumes
  `@mkbabb/glass-ui` via `file:../../glass-ui` and is an explicit peer in
  glass-ui's constellation: glass-ui's `P.md` §1/§4 names fourier as the
  destination for **CR-2** (the dock-key injection regression — fourier's
  deleted `useDockState`/`GlassDock` and the silent dock no-op at glass-ui
  v1.7.0) and **P.W5 Lane B** (2 dock-key migrations + 3 `useClipboard` sites +
  a `HoverCard` rename). fourier's tranche must declare the glass-ui pin it
  builds against, its READER-ONLY-vs-WRITER boundary toward glass-ui, and how
  the CR-2 cross-walk lands. A `coordination/CONSTELLATION.md` per glass-ui's
  M.Rδ canonical-multi-peer-manifest shape is the right artefact.

### 5.4 Brittleness window

The glass-ui migration deletes 31 files. If any wave leaves the web build red
between substrate-delete and consumer-rewire, declare the brittleness window
**before dispatch** (YAML block in `A.md` §8 with `suspended_gates` and a named
`restoration_wave`). Current evidence says this is avoidable — `vue-tsc -b`
already passes at the worktree, so the migration appears to land green and **no
brittleness window is needed** if waves are bounded so each closes green.

### 5.5 First actions before any implementation wave

1. Commit the submodule wiring: `.gitmodules`, `docs/precepts/`,
   `docs/instructions/` (F-7).
2. Add `tsconfig.tsbuildinfo` and `__pycache__/` to `.gitignore`; untrack
   `web/tsconfig.tsbuildinfo` (F-1, F-2).
3. Author `docs/tranches/A/A.md` attributing the in-flight 107-file cohort
   (F-3) — this closes the shadow-execution gap before it becomes a fourier
   analogue of glass-ui's AB+1.
