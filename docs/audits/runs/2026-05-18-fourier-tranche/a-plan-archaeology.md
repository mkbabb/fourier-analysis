# Audit A — Plan & Prompt Archaeology — fourier-analysis

**Date:** 2026-05-18
**Agent:** A (Plan & Prompt Archaeology)
**Mode:** READ-ONLY. No edits, no commits.
**Repo HEAD:** `4df1a06` (`feat(p.w5-b): glass-ui CR-2 cross-walk`), working tree DIRTY (107 changed paths).
**Constellation reference:** glass-ui tranches M → N → O → P → Q (`/Users/mkbabb/Programming/glass-ui/docs/tranches/`).

fourier-analysis is a **consumer node** in the `@mkbabb/*` constellation. It has never run a tranche of its own — it has only `docs/precepts/` (submodule) and `docs/instructions/`. Every plan item to date was authored by glass-ui's orchestrator and dispatched to fourier as a cross-repo lane.

---

## §1 — Constellation Map

### 1.1 Per-tranche fourier-analysis row

| Tranche | fourier role | Wave / Lane / CR | What fourier was asked to do | Status |
|---|---|---|---|---|
| **M** (open 2026-05-12) | BROKEN against glass-ui v1.0; M.W0 must fix (`M/coordination/CONSTELLATION.md:76`) | **M.W0** N-fourier (P0) | Fix v1.0 retired-subpath drift: 2 `useOffsetPagination` imports + 1 `useGlobalDark` migrated; local 60-LOC `useOffsetPagination` fork from v0.9.3 (`M/.../CONSTELLATION.md:132`) | **LANDED** — commit `301a95e` on master + pushed (`M/.../CONSTELLATION.md:19`) |
| **M** | — | **M.W1 Lane C** (HEADLINE per-consumer v1.0 sweep) | `DockPopover` → `HoverPopover` rename in `CanvasControlsDock.vue` + `EditorControlsDock.vue`; full v1.0 absorb; `/dark` subpath (`M/.../CONSTELLATION.md:91,151`) | **LANDED** — folded into commit `301a95e` (M.W1 Lane C CLOSED) |
| **N** (2026-05-12) | READER-ONLY (audit only at N.W4 N11) (`N/.../CONSTELLATION.md:61`) | — | No new work. Audited at N11 Lane b; grade B+ stable. | **N/A** |
| **O** (2026-05-14) | READER-ONLY at open; WRITER on glass-ui side if `GlassScrubber` union absorbs (`O/.../CONSTELLATION.md:61`) | **O-N-5** GlassScrubber union candidate flagged at 3 consumer sites | Surface `<GlassScrubber>` / `Slider variant="timeline-glass"` substrate proposal; consumer-side adoption deferred to "a consumer wave" (`O/.../CONSTELLATION.md:80`) | **DEFERRED** — substrate decision pushed to P |
| **AB** / **AB+1** | reader-only; not participating (`AB/.../CONSTELLATION.md:66`, `AB+1/.../CONSTELLATION.md:53`) | — | None. Sat unmodified at O-pin throughout. | **N/A** |
| **P** (2026-05-14) | mid-migration; WRITER permitted at **P CR-2** (`P/.../CONSTELLATION.md:69,88`) | **P.W5 Lane B** (the CR-2 P-wave) | **B.1** dock typed-context migration (2 sites); **B.2** `useClipboard` adoption (3 sites); **B.3** reka-ui HoverCard → glass-ui canonical (`EquationView.vue`); **B.4** `<Slider variant="glass-scrubber">` adoption (3 sites) | **LANDED** — commit `4df1a06` on master + pushed; verified CLEAN at `P/audit/W6-P11-Lane-ab-rerun.md:177` |
| **Q** (2026-05-18, open) | Q round-2 re-audit; READER, WRITER permitted if remediation surfaces cross-repo fix (`Q/.../CONSTELLATION.md:15,52`) | **Q.R11** consumer resolver sweep | Re-audited only. | **BROKEN** — see §1.3 |

### 1.2 CR-2 — the P-wave fourier owed (the only substantive consumer plan)

CR-2 is the carry-forward ledger row for fourier-analysis (`P/.../CONSTELLATION.md:88`, carried from `O` per `P/.../CONSTELLATION.md:53`). Authoritative scoping doc: `P/audit/P11-Lane-b-fourier-analysis.md`. It was authored against glass-ui v1.7.0 and escalated a **silent functional regression**: glass-ui's O.W2 retired the legacy string-key dock provides (`"dockKeepOpen"`/`"dockRelease"`), so fourier's `inject<...>("dockKeepOpen", null)` resolved to `null` at v1.7.0 and idle-collapsed the dock mid-scrub (`P11-Lane-b...:34-57`).

CR-2 had 4 sub-tasks; all 4 LANDED at P.W5 Lane B (proof: `P/audit/W5-Lane-B-fourier-analysis.md` + rerun `P/audit/W6-P11-Lane-ab-rerun.md:90-188`):

- **B.1** dock typed-context — folded into B.4 (`<Slider variant="glass-scrubber">` acquires `useOptionalDockContext()` internally); 0 functional string-key injects remain.
- **B.2** `useClipboard` — 3 sites (`useMorphConfig.ts`, `EquationResult.vue`, `UserSlugBar.vue`).
- **B.3** HoverCard — `EquationView.vue:8` reka-ui → `@mkbabb/glass-ui`.
- **B.4** GlassScrubber — 3 sites (`SliderControl.vue`, `GlassTimeline.vue`, `ConvergenceTimeline.vue`); 562 → 348 LOC.

### 1.3 Q-open headline — fourier is currently BROKEN

`Q/audit/Q11-consumer-resolver-sweep.md:47-53,132` records fourier-analysis/web's **production build + typecheck FAIL**: `vue-tsc -b` errors `TS2307: Cannot find module '@mkbabb/keyframes.js'` at `src/composables/useFourierMorph.ts:14` and `src/stores/animation.ts:3`. Root cause is **not** a fourier defect — keyframes.js (AD.W4) deleted its `dist/` while leaving `package.json` `exports.import`/`types` pointing at the deleted artefacts. The fix (Q R-A) is a keyframes.js `package.json` change. Dev server still boots (the `development` export condition routes to `src/`). NOTE: as of this audit `keyframes.js/dist/` has been rebuilt (`keyframes.d.ts` + `keyframes.js` present, dated 2026-05-18 12:35) — the Q R-A band-aid path appears taken; **fourier should re-verify its own build**.

### 1.4 Constellation letter scheme

glass-ui's stream is single-letter, monotonic: C → ... → L → M → N → O → P → Q (plus side-tranches D-II, AB, AB+1, V). speedtest runs a parallel stream: A → Y → Z → AA → AB → AC → AD. **No consumer repo has ever opened its own tranche** — fourier, words, bbnf-buddy have only ever been cross-repo lanes inside glass-ui's letters. fourier-analysis opening its own tranche stream is a constellation first.

---

## §2 — Git / Commit Map

`git log --oneline -60`. Commits citing constellation identifiers or glass-ui surface:

| Commit | Subject | Plan item satisfied |
|---|---|---|
| `4df1a06` | `feat(p.w5-b): glass-ui CR-2 cross-walk — dock typed-context migration + useClipboard + HoverCard + GlassScrubber adoption` | **P CR-2 / P.W5 Lane B** — B.1–B.4 (§1.2). The only commit explicitly tagged with a constellation identifier. |
| `301a95e` | `feat(web/glass-ui): migrate to v1.0 subpath surface (constellation M.W0 Lane IV + M.W1 Lane C)` | **M.W0** retired-subpath drift fix + **M.W1 Lane C** v1.0 absorb + DockPopover→HoverPopover (§1.1). |
| `fae704d` | `refactor: import easings from @mkbabb/value.js` | value.js consumer adoption — not a tranche lane; ad-hoc. |
| `8818ae5` | `refactor(contours): restructure config hierarchy, improve pipeline detail extraction` | Domain (contour pipeline). Not constellation. |
| `a17356c`, `8ce3586`, `208eaf1` | `fix(web): trail reset / suppress auto-recompute / upload lifecycle` | Domain bug-fixes (epicycle viz). Not constellation. |
| `f6aa52f` | `fix(api): EXIF orientation consistency` | Domain (API image processing). |
| `bd78e3f` | `feat(web): design token system, a11y fixes, dev infra` | Local design-token work — predates DESIGN.md migration tasks (§3). |
| `9e5ba74`, `4809804` | mobile UX, collapsible TOC, scroll persistence | Domain UX. |

**Observation:** only 2 of the last 60 commits (`4df1a06`, `301a95e`) carry constellation identifiers. The constellation footprint in committed history is exactly **M.W0 + M.W1 Lane C** and **P CR-2 / P.W5 Lane B**. O contributed nothing committed (O was reader-only for fourier). Everything else is fourier's own domain work (paper, contours, epicycles, gallery, API).

---

## §3 — Uncommitted-Work Analysis

`git diff --stat HEAD`: **93 tracked files changed (1757 insertions / 4668 deletions)** + 14 untracked paths = the 107-path in-flight body. Split: `web/src/` 73 files (857 ins / 4555 del), `api/` 12 files (778 ins / 21 del), root/infra ~8 files.

This is a **single coherent, half-done body of work: the glass-ui v1.x migration completion + a backend admin/auth build-out + an infra pass.** Categorized:

### 3.1 glass-ui-migration deletions — shadow-copy retirement (VERIFIED)

The deleted files are consumer-owned shadow copies of glass-ui primitives. Each has a verified glass-ui replacement wired:

| Deleted file | glass-ui replacement | Wired? |
|---|---|---|
| `ui/select/*` (12 files) | `Select`/`SelectTrigger`/`SelectContent`/`SelectItem` from `@mkbabb/glass-ui` | ✅ `ContourSettings.vue:12-16` imports from `@mkbabb/glass-ui` |
| `ui/slider/Slider.vue` + `index.ts` | `Slider` from `@mkbabb/glass-ui` | ✅ 7 import sites resolve to `@mkbabb/glass-ui` (`ContourSettings`, `EquationPanel`, `GlassTimeline`, `GallerySearchBar`, `SliderControl`, `FunctionInput`, `ConvergenceTimeline`) |
| `ui/collapsible/*` | `Collapsible*` from `@mkbabb/glass-ui` | ✅ root-barrel import present |
| `ui/UnderlineTabs.vue` | `UnderlineTabs` from `@mkbabb/glass-ui/tabs` | ✅ 3 import sites on `/tabs` subpath |
| `ui/GlassDock.vue` | `GlassDock` from `@mkbabb/glass-ui/dock` | ✅ 2 import sites on `/dock` subpath |
| `ui/ToastContainer.vue` | `Toaster` from `@mkbabb/glass-ui` + `useToast.ts` adapter | ✅ App-root `Toaster`; `useToast.ts` modified (adapter) |
| `ui/BouncyToggle.vue` | (glass-ui toggle / native) | ⚠️ no direct replacement import found — verify no orphaned `<BouncyToggle>` refs |
| `visualization/DockPopover.vue` | `HoverPopover` from `@mkbabb/glass-ui/hover-popover` | ✅ `EditorControlsDock.vue:3`, `CanvasControlsDock.vue:7` |
| `paper/usePaperSearch.ts` + `paperSearchIndex.ts` | new `paper/search/` module (`usePaperSearch.ts`, `paperSearchIndex.ts`, `PaperSearch{Dropdown,Input,Modal}.vue`, `searchHelpers.ts`) | ✅ relocated/decomposed, not glass-ui |
| `composables/useDockState.ts` | glass-ui dock owns state internally | ✅ consistent with B.1 |
| `composables/{useAdminAuth,useUserAuth,useSession}.ts` | new `stores/auth.ts` (Pinia) | ✅ store-ification, not glass-ui |
| `layout/composables/useHoverCard.ts`, `visualization/lib/dock-buttons.css`, `lib/utils.ts` | glass-ui substrate | ✅ |

**`style.css` collapsed from 727 → 8 lines** — the monolithic stylesheet was decomposed into `web/src/styles/` (`buttons.css`, `fourier-overrides.css`, `ios-fixes.css`). This directly satisfies the `feedback_no_monoliths.md` precept.

### 3.2 Component relocations (not deletions)

`FourierMorphDemo.vue` + `FourierShapeExtractor.vue` deleted from `components/` and recreated under `components/morph/` (untracked) — a directory-hygiene move, plus new `MorphShapePreview.vue`, `ConvergenceLegend.vue`, `GalleryInfiniteGrid.vue`, `CollapsibleSection.vue`.

### 3.3 Backend build-out (api/, +778 lines)

`api/routers/admin.py` +430, `api/routers/gallery.py` +177, new `api/models/admin.py`, `api/dependencies.py` +38, `api/main.py` +40. A substantial **admin + auth + gallery moderation** feature, paired with the frontend `stores/auth.ts` + deleted auth composables. This is a coherent feature, **not** constellation-driven.

### 3.4 Infra pass

`docker-compose.prod.yml` (+55), `nginx/fourier.conf` (+22), `.env.example`, `scripts/dev.sh` (rewritten −99/+ pattern), `api/Dockerfile`. Aligns with `project_infra_plan.md` (port standardization, webhook CI/CD). Half-done.

### 3.5 New artefacts

`web/DESIGN.md` (untracked) — a fourier-side design-language doc that **extends glass-ui's DESIGN.md** and carries an explicit **"Migration Tasks" checklist** (§4). `.gitmodules` (untracked) registers `docs/precepts` as a submodule. `docs/instructions/` + `docs/precepts/` untracked.

### 3.6 Apparent intent & coherence verdict

The in-flight work is **three braided efforts**: (a) finish the glass-ui v1.x migration — retire all remaining shadow copies, decompose `style.css`, adopt subpaths; (b) ship a backend admin/auth/gallery-moderation feature; (c) an infra/Docker standardization pass. (a) is ~90% mechanically complete and the riskiest to leave dangling (deleted files with all replacements wired, but **uncommitted and unverified against a currently-broken build** — §1.3). The whole 107-file body has sat uncommitted across **M, O, P and now Q** — every constellation audit from O11/b onward explicitly notes "working tree DIRTY — same in-flight refactor cluster" (`O11-Lane-b...:13`, `P11-Lane-b...:13`). It is the single largest chronically-deferred item (§6).

---

## §4 — Prompt-and-Precept Recap Table

Sources: `/Users/mkbabb/.claude/projects/.../memory/` (authoritative `feedback_*.md` + `project_*.md`), `docs/instructions/README.md`, `docs/precepts/README.md`, `web/DESIGN.md`, commit messages.

| # | Request / precept | Source | Status |
|---|---|---|---|
| P1 | No fallbacks / legacy patterns — required deps, no `*_AVAILABLE` flags, KISS | `feedback_no_fallbacks.md` | **Addressed** — no optional-dep guards observed; `[web]` extra is a real dep group |
| P2 | No monoliths — small components, composables, idiomatic Tailwind, no big `<style>` blocks, ~200-line cap | `feedback_no_monoliths.md` | **Partial** — `style.css` 727→8 (decomposed ✅); but uncommitted; `api/routers/admin.py` +430 risks a new god-file; `GlassTimeline.vue` historically 1049 LOC (O Rβ split-candidate) |
| P3 | Parallelize implementation with multiple concurrent agents, worktree isolation | `feedback_parallelization.md` | **Process precept** — applies to how the new tranche executes |
| P4 | Archaic diction is intentional — do not reduce (paper-scoped) | `feedback_style_archaic.md` | **Addressed** — paper-only; no web impact |
| P5 | Use Unicode em dash `—` not `---` (LaTeX) | `feedback_em_dashes.md` | **Addressed** — paper-only |
| P6 | Infra standardization — webhook CI/CD, Mongo 8 TLS, VPN removal, port blocks (8100 fourier), 9xxx dev ports | `project_infra_plan.md` | **Partial** — `docker-compose.prod.yml`/`nginx/fourier.conf`/`.env.example`/`dev.sh` all modified uncommitted; plan phases 0→5 not verifiably complete |
| P7 | Numerical correctness before UI polish; figures compared via artefacts/tests | `docs/instructions/README.md` | **Standing rule** — gates for the new tranche |
| P8 | Web changes need browser evidence; API changes need endpoint/service tests | `docs/instructions/README.md` | **Standing rule** — the +778-line admin build-out lacks visible test evidence |
| P9 | Precept core rules — substrate+consumer land together, no shadow APIs, gates close on evidence, wave-close updates docs | `docs/precepts/README.md` | **Standing rule** |
| P10 | DESIGN.md migration tasks: (a) Teleport modals → glass-ui Dialog; (b) `.btn-*` → glass-ui Button variants; (c) `.gallery-card`/`.modal-card` → glass-ui Card; (d) delete duplicate keyframes; (e) remove/adopt CVA | `web/DESIGN.md` | **Unaddressed** — all 5 checkboxes unchecked; this is fourier's own self-authored backlog |
| P11 | CR-2 P-wave (dock context, useClipboard, HoverCard, GlassScrubber) | `P11-Lane-b-fourier-analysis.md` | **Addressed** — landed `4df1a06`, verified CLEAN at W6 rerun |
| P12 | AB+1 primitive adoption — `AnimatedDigit`/`MetricRow`/`MetricStack`/`MetricCell`/`ResponsiveTabs` at 9–12 candidate sites | `P11-Lane-b...:205-236` | **Unaddressed** — 0 adoption (`rg` returns 0 hits); explicitly carried as "consumer P-wave write" never executed |
| P13 | Un-wired glass-ui substrate — `MetricBadge`/`MetricPill`/`StatusDot`/`Skeleton`/`useTouchGate`/`useResizeObserver` at ~5 sites | `O11-Lane-b...:107-122`, `P11-Lane-b...:228-235` | **Unaddressed** — flagged at O, re-flagged at P, never wired |
| P14 | `SliderControl.vue` cosmetic `variant` prop cleanup (both values map to `glass-scrubber`) | `W5-Lane-B...:232-238` | **Deferred** — explicitly "out of scope for P.W5 Lane B; carries forward as known consumer-side cleanup" |
| P15 | Build/typecheck must be green (currently RED — keyframes.js dist) | `Q11-consumer-resolver-sweep.md:47-53` | **Unaddressed at Q open** — possibly resolved by keyframes.js dist rebuild; re-verify |

---

## §5 — Deferred-Item Ledger

Named, scoped items that are not yet done:

| ID | Item | Scope | Evidence |
|---|---|---|---|
| D1 | **Commit the 107-file in-flight migration** | finish + commit the glass-ui v1.x migration completion (shadow-copy retirement, `style.css` decompose), the api/ admin build-out, the infra pass | `git status`; `git diff --stat HEAD` |
| D2 | **AB+1 primitive adoption cohort** | wire `AnimatedDigit`/`MetricRow`/`MetricStack`/`MetricCell`/`ResponsiveTabs` at 9–12 sites | `P11-Lane-b...:§5,§9.2.5` — "consumer P-wave write … NOT a library-side action" |
| D3 | **Un-wired substrate cohort** | `MetricBadge`/`MetricPill`/`StatusDot`/`Skeleton`/`useTouchGate`/`useResizeObserver` at ~5 sites | `O11-Lane-b...:§3`, `P11-Lane-b...:§5` |
| D4 | **DESIGN.md migration tasks** | 5 self-authored items: Dialog migration, Button-variant migration, Card migration, duplicate-keyframe deletion, CVA decision | `web/DESIGN.md` "Migration Tasks" |
| D5 | **`SliderControl.vue` cosmetic `variant` prop** | retire the prop (breaking, 7 instantiations) or promote it to a meaningful axis | `W5-Lane-B...:§5.5` |
| D6 | **Build-green verification** | confirm `vue-tsc -b && vite build` passes post-keyframes.js dist rebuild | `Q11...:§3` + observed `keyframes.js/dist/` rebuilt 2026-05-18 |
| D7 | **Infra plan phases 0→5** | webhook CI/CD, Mongo 8 TLS, VPN removal, port standardization | `project_infra_plan.md` |
| D8 | **`docs/precepts`/`docs/instructions` + `.gitmodules` untracked** | commit the submodule registration + instruction docs | `git status` untracked block |
| D9 | **`BouncyToggle.vue` deletion replacement** | verify no orphaned `<BouncyToggle>` references after deletion | §3.1 — no replacement import surfaced |

---

## §6 — Chronically-Deferred Ledger

Items pushed across multiple waves/tranches with explicit evidence of recurrence:

| ID | Chronic item | Recurrence trail | Why chronic |
|---|---|---|---|
| **C1** | **The 107-file in-flight migration sits uncommitted** | O11/b (`...:13` "working tree DIRTY — same in-flight refactor"), P11/b (`...:13` "DIRTY — same in-flight refactor cluster"), W5-Lane-B (`...:6` "working tree DIRTY — pre-existing in-flight refactor cluster"), W6-rerun (`...:98` "dirty on api/ + repo-root"), Q11 — same cluster named at **every constellation audit from O onward** (≥4 tranches). | The migration body has never been committed; every cross-repo lane has had to write *into* a dirty tree and hand the index back to "the orchestrator" who never lands it. The orchestrator is glass-ui's — fourier has no orchestrator of its own to close it. This is the single strongest argument for fourier opening its own tranche. |
| **C2** | **GlassScrubber substrate decision** | Surfaced O11/b §4 (HEADLINE proposal), carried as `O-N-5` (`O/.../CONSTELLATION.md:80` "consumer adoption is consumer wave"), re-raised P11/b §4 ("substrate decision required"), finally landed P.W5 Lane B. | Took **3 tranches** (O→P) from proposal to landing; the consumer-side adoption was repeatedly "a consumer wave" with no consumer wave to host it until P CR-2. NOW RESOLVED — included as a closed chronic for the pattern record. |
| **C3** | **`EquationView.vue:8` reka-ui HoverCard direct import** | O11/b §1.3 ("REGRESSION … one-line rename"), O11/b §6 cross-walk, W7-O11b rerun (UNCHANGED), P11/b §6 ("UNRESOLVED … drift since at least 2026-05-14"). | A literal one-line fix deferred across O → W7 → P. Eventually landed at P.W5 Lane B.3. Closed — but it took 4 audit passes for a 1-line change, the archetype of chronic micro-deferral. |
| **C4** | **AB+1 primitive adoption (D2) + un-wired substrate (D3)** | Un-wired substrate flagged O11/b §3 ("5 zero-consumption opportunities"), re-flagged P11/b §5 ("carry-over from O11/b §3 + W7-rerun"); AB+1 cohort flagged P11/b §5 ("zero adoption currently"). | Adoption opportunities surfaced in **2 consecutive tranches** with the disposition "consumer P-wave write" — and the consumer P-wave (P.W5 Lane B) chose only the 4 CR-2 items and **skipped the adoption cohort entirely**. Still 0 hits at Q. |
| **C5** | **fourier never gets its own tranche** | M/N/O/P/Q constellation rows: fourier is always "consumer", "READER-ONLY", or "WRITER permitted at CR-N". `fourier-animate` was even moved *out* of the constellation (`M/.../CONSTELLATION.md:140`). No `docs/tranches/` folder exists. | Five glass-ui tranches have dispatched lanes into fourier without fourier ever running a planning/wave cycle of its own. Its in-flight work (C1), self-authored backlog (D4), and infra plan (D7) have no tranche vehicle — which is *why* they never close. |

---

## §7 — Synthesis: the new tranche

The constellation has dispatched glass-ui-authored lanes into fourier for five tranches (M–Q) and fourier has dutifully landed every *named* CR. But three coherent bodies of work have **no vehicle**: the 107-file uncommitted migration (C1/D1), fourier's own DESIGN.md backlog (D4) + adoption cohorts (D2/D3), and the infra plan (D7). A fourier-owned tranche is the missing instrument.

**Proposed tranche letter: `R`.**

Justification against the constellation letter scheme: glass-ui's stream is single-letter monotonic and currently at **Q** (open 2026-05-18); **R** is the next free letter. Opening fourier's first tranche as **R** keeps the constellation in one shared, collision-free letter sequence rather than forking a private namespace — consistent with how speedtest, though it runs its own A→AD stream, still shares the alphabet. R cleanly succeeds Q, signals "the tranche that immediately follows the Q consumer-breakage audit" (R should open by verifying D6/P15 first), and avoids the side-tranche suffix forms (D-II, AB+1). It also leaves M.W*/P CR-* identifiers unambiguous in history.

---

## §8 — Verification

- Read: M/N/O/P/Q/AB/AB+1 `coordination/CONSTELLATION.md`; `O11-Lane-b`, `P11-Lane-b`, `W5-Lane-B`, `W6-P11-Lane-ab-rerun`, `Q11-consumer-resolver-sweep` audit docs.
- `git log --oneline -60`; `git status --short`; `git diff --stat HEAD` (split web/src vs api).
- Verified deleted-file → glass-ui-replacement wiring via `grep` on import sites (§3.1).
- Read all 6 memory `feedback_*`/`project_*` files; `docs/instructions/README.md`; `docs/precepts/README.md`; `web/DESIGN.md`.
- `keyframes.js/dist/` inspected — rebuilt 2026-05-18.
- READ-ONLY throughout; no git mutation, no edits.
