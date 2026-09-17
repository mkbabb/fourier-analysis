SERVED MODEL: claude-opus-5[1m]

# F — SUBSTRATE LEDGER (tranche X, sub-tranche X·F, wave F.W0)

**Repo**: `/Users/mkbabb/Programming/fourier-analysis` · **branch** `m/w1-bump-migration` · **HEAD at open** `cd26c65`.

**Authority**: `value.js/docs/tranches/X/fourier/waves/F-W0.md` — §2a File bounds · §2a-i the 28 paths ·
§2b Disjointness · §2c Worktree plan · §3 rows 2 · 3 · 4 · 24 · 25 · §4 G-1 · §5 OG-F1 · §6a locks 1 · 9 · 10 ·
§7b commit plan. Owner rulings: `value.js/docs/tranches/X/COHESION.md` §0j.D. Wave record:
`value.js/docs/tranches/X/execution/C/F-W0.md`.

**This file is the wave's SINGLE durable artefact** (F-W0 §2a). Each F.W0 unit appends its own section
below; **nothing here is rewritten in place** — corrections land as dated addenda-beside (E-3).

---

## §1 — G-1: the 28-path land-or-abandon minute

**Unit F.W0.a · 2026-09-17 · seat model `claude-opus-5[1m]`.**

### 1.0 The ruling this minute executes

**OG-F1 is RULED**, at `COHESION.md` §0j.D, and this minute does not re-open it. Quoted at the bytes —
⟨cmd⟩ `/usr/bin/awk 'NR>=599 && NR<=603' docs/tranches/X/COHESION.md` (value.js):

> **OG-F1** — **FREEZE-WITH-ADOPTION AND WORKTREE-AS-BASELINE** (the lane's own evidence; measurements
> live-reproduced; R6 `NO_SUCCESSOR`). Consequences as the spec states them: G-1's minute becomes a
> disclosure + the LAND set; G-11 narrows to drift-correction; G-14's R-coordinate rows become records;
> GAB-13 discharges to a disclosure line.

So G-1's minute has exactly two limbs, and this section is both of them: **§1.1 the DISCLOSURE** and
**§1.4 the LAND set**. `L-1`'s preserved conditional (F-W0 §3 row 3 — *"if F.W0 rules ABANDON on the
M.W1a tree wholesale, the governance limb falls to MAJOR; the deadness does not"*) **does not fire**:
the ruling is not ABANDON, and no limb falls.

### 1.1 DISCLOSURE — what adopting the worktree as baseline makes true

The M.W1a working tree **is** the audited substrate, and this wave commits it so that it is also a tree a
commit holds. Measured at this seat, 2026-09-17:

| fact | at HEAD `cd26c65` | in the adopted worktree | receipt |
|---|---|---|---|
| `@mkbabb/glass-ui` declared | `^3.1.0` | `^4.0.0` | ⟨cmd⟩ `git show HEAD:web/package.json \| /usr/bin/grep glass-ui` vs `/usr/bin/grep glass-ui web/package.json` |
| `@mkbabb/keyframes.js` declared | `^2.2.0` | `^4.3.0` | same pair |
| `@mkbabb/value.js` declared | `^0.10.0` | `^0.13.0` | same pair |
| `@mkbabb/glass-ui` **installed** | — | **4.0.0** | ⟨cmd⟩ `/usr/bin/grep -m1 '"version"' web/node_modules/@mkbabb/glass-ui/package.json` → `"version": "4.0.0",` |

**The consequence, stated plainly.** Before this minute, every `fr-*` record's *"working tree at `cd26c65`"*
anchor named a tree **no commit held**, and the lane's *"the resolved producer is 4.0.0"* premise rested on
bytes a `git stash` would have erased. After it, both rest on a commit. The 66 adjudicated records are
**unchanged and immutable** (E-1) — what changed is that their substrate is now addressable.

**Corollaries carried, not re-derived:**

- **G-11 narrows to drift-correction** (unit *e*'s section).
- **G-14's R-coordinate rows become records, not work** (unit *e*'s section), per §0j.D's OG-F2/OG-V2 ruling.
- **G-6 is stamped with G-1's ruled branch = LAND**: its born-RED measurements stand against the **landed
  4.0.0 manifest**, not the committed 3.1.0 one (F-W0 §6a lock 5; unit *d*'s section).

### 1.2 GAB-13 — discharged to a disclosure line

F-W0 §3 row 2 (`GAB-13` ⟨fr-GalleryAdminBanner · FR-COB-10 · fr-GalleryDraftsSection m-18 · FR-EQR-33(c)⟩,
MAJOR): *"The substrate is uncommitted."* Under OG-F1 it discharges here, in one line, exactly as §5's
interaction clause prescribes:

> **GAB-13 is DISCHARGED.** The 28 dirty rows are dispositioned per path at §1.4 and the LAND set is
> committed; the substrate is no longer uncommitted, and no per-file budget rests on bytes a reset would
> erase.

**The carried dissent is recorded, not adjudicated.** Worker-DU, verbatim: *"the fleet has already elected
to treat the working tree as the scope."* Under the ruled branch **DU's INFO grading was right all along**,
and this line says so — the ruling did not overturn the MAJOR grade retroactively, it made the MAJOR moot
by curing it in one act.

### 1.3 The correct-repair dirty lines — enumerated EXPLICITLY, before any ruling on the rest

F-W0 §3 row 25 binds the ordering: *"the F.W0 minute must enumerate the correct-repair dirty lines
**explicitly, before ruling on the rest**."* Both are **NAMED EXCEPTIONS that MUST LAND** (§4 G-1), and both
are re-measured at the bytes by this seat:

**Exception 1 — §3 row 24, `FR-EMT-25` (= `C S-3` / `K-2`) ⟨fr-EquationModeToggle⟩.**
⟨cmd⟩ `git diff -- web/src/components/equation/EquationModeToggle.vue` → **exactly one changed line**:

```
-    <div class="eq-toggle glass-subtle">
+    <div class="eq-toggle glass-wash">
```

Banked mechanism: `glass-subtle` **resolves nowhere** (0 hits, dist + src), so at HEAD the track carried a
dead class and no material at all; the wash rung is the documented tier for a detail tile and carries a real
border (`ladder.css:36-42`) that makes `:39`'s transition leg reachable. **LAND THIS DIFF.** Independent of
F.W1 (the SegmentedTabs fold routes F.W3, *"no F.W1 dependency"*).

**Exception 2 — §3 row 25, `C:S-2` ⟨fr-PaperSearchDropdown⟩.**
⟨cmd⟩ `git diff -- web/src/components/paper/search/PaperSearchDropdown.vue` → **exactly one changed line**:

```
-            class="paper-search-results glass-elevated"
+            class="paper-search-results glass-floating"
```

Banked mechanism: `glass-elevated` has **ZERO occurrences in the installed dist** — HEAD paints a class that
does not exist. **MUST NOT be lost in any tree reset.**

**Both diffs are one line each, as the records state, and both LAND in the LAND-set commit, whose hash is
read from the settled tree and banked at §1.8 — never predicted here.**

### 1.4 The 28-path minute

**Source of the enumeration**: F-W0 §2a-i, which IS the bounds authority, **re-verified item-for-item against
live porcelain at this seat** — ⟨cmd⟩ `git status --porcelain | wc -l` → **28**; `… | /usr/bin/grep -c '^ M'`
→ **27**; `… | /usr/bin/grep -c '^??'` → **1**. Double-run: 28 / 28. The live order is the §2a-i order,
row for row, with no addition and no omission.

**Disambiguation, stated once so no reader collides two numbering systems.** The `#` column below is the
**§2a-i path index (1–28)**. It is **not** the F-W0 §3 carry-row number. §3's row 24 (`FR-EMT-25`) is path
**4** here; §3's row 25 (`C:S-2`) is path **13** here.

| # | path | porcelain | disposition | reason |
|---|---|---|---|---|
| 1 | `docs/constellation/tri-tranche-run/RUN-BOARD.md` | ` M` | **LAND** | M.W1a S1-row status update (`E DEV-AUTHORED [2c9e931]` → `E IMPL+CLOSED [fe9b120]`). Worktree-as-baseline. **Its CONTENT-claims — the J/K-deploy/M interlock and the dead M.W1b glass-4.1.0 gate — are dispositioned separately at G-14 (unit *e*); this row dispositions the COMMIT OBJECT only.** |
| 2 | `web/package-lock.json` | ` M` | **LAND** | The bump-migration lock (1132+/1189−). Worktree-as-baseline. **G-1's per-path act is the land ruling and nothing else** — the manifest DECLARE+LOCK banding is NOT landed here (R-4a; F-W1 §4 Sequencing, intra-wave step 4). |
| 3 | `web/package.json` | ` M` | **LAND** | The bump hunk (25+/25−): producer pins to `^4.0.0` / `^4.3.0` / `^0.13.0` + 22 devDep/dep floor raises. Same R-4a bound as row 2. Lands the premise G-6 is stamped against. |
| 4 | `web/src/components/equation/EquationModeToggle.vue` | ` M` | **LAND — NAMED EXCEPTION** | **§3 row 24 `FR-EMT-25`.** One line, `glass-subtle` → `glass-wash`; see §1.3 exception 1. Must land under any ruling. |
| 5 | `web/src/components/equation/EquationView.vue` | ` M` | **LAND** | 4-line 4.0.0 API migration: `UnderlineTabs` → `SegmentedTabs variant="underline"` (import + tag), `glass-elevated` → `glass-floating`, MetricBadge `:amount` → `:value`. Worktree-as-baseline. |
| 6 | `web/src/components/equation/InfoCard.vue` | ` M` | **LAND** | **§3 row 4 `FR-IC-1` (= `F8-REACH-01`).** One line, MetricBadge `:amount` → `:value` — the *"InfoCard accrues cost now"* edit the record books. It LANDS because the worktree is the baseline; **the file is then DELETED in the same wave at G-10 (unit *f*, `COHESION` §0j.D: DELETE, in one breath)**, and under DELETE `FR-IC-2` retires unmeasured, correctly. Landing before deleting keeps the accrued cost on the record instead of erasing the evidence. |
| 7 | `web/src/components/equation/convergence/ConvergenceLegend.vue` | ` M` | **LAND** | One line, `glass-subtle` → `glass-wash`. Worktree-as-baseline. |
| 8 | `web/src/components/equation/convergence/ConvergenceTimeline.vue` | ` M` | **LAND** | Two lines, `Slider variant="glass-scrubber"` → `variant="standard"` + its doc-comment parity. **Also a G-10 lift site** (`:61`, the eighth, carrying `is-playing`) — landed clean HERE so unit *f* lifts against a committed base. **Path note (record D-4)**: it lives under `equation/convergence/`, NOT `visualization/`; §2a-i lists it by basename. |
| 9 | `web/src/components/morph/HarmonicLevelGrid.vue` | ` M` | **LAND** | Two `variant="glass-scrubber"` → `variant="standard"`. Worktree-as-baseline. |
| 10 | `web/src/components/morph/MorphPhaseConfig.vue` | ` M` | **LAND** | One `variant="glass-scrubber"` → `variant="standard"`. Worktree-as-baseline. |
| 11 | `web/src/components/paper/MobileFloatingToc.vue` | ` M` | **LAND** | Three ladder renames: `glass-medium` → `glass-resting` ×2, `glass-medium` → `glass-floating` ×1 (the dropdown). Worktree-as-baseline. |
| 12 | `web/src/components/paper/PaperView.vue` | ` M` | **LAND** | One line, `glass-subtle` → `glass-wash`. Worktree-as-baseline. **Rider (a) hazard lives in this file** (`:344`, the `is-active` PROP) — untouched by this diff and untouched by this wave. |
| 13 | `web/src/components/paper/search/PaperSearchDropdown.vue` | ` M` | **LAND — NAMED EXCEPTION** | **§3 row 25 `C:S-2`.** One line, `glass-elevated` → `glass-floating`; see §1.3 exception 2. Must not be lost in any tree reset. |
| 14 | `web/src/components/ui/SliderControl.vue` | ` M` | **LAND** | One `variant` rename + two doc-comment parity lines. Worktree-as-baseline. |
| 15 | `web/src/components/visualization/AnimationControls.vue` | ` M` | **LAND** | One MetricBadge `:amount` → `:value`. Worktree-as-baseline. |
| 16 | `web/src/components/visualization/BasisSelector.vue` | ` M` | **LAND** | Two `variant` renames + one doc-comment parity line. Worktree-as-baseline. **Unrelated to §6a lock 7** — `fr-BasisSelector i-3` (`LC-missed-7`, the `basisFilter`/`normalizeBasisKey` WAVE-LOCK) is a rider on `M-10` and is **not** in this diff and **not** landed by this wave. |
| 17 | `web/src/components/visualization/EditorControlsDock.vue` | ` M` | **LAND** | MetricBadge `:amount` → `:value` + one `variant` rename. **Also a G-10 lift site** (`:143`/`:148`) — landed clean HERE so unit *f* lifts against a committed base (§2b: *f* writes paths *a* must release first). |
| 18 | `web/src/components/visualization/EquationPanel.vue` | ` M` | **LAND** | `glass-subtle` → `glass-wash` + MetricBadge `:amount` → `:value`. Worktree-as-baseline. |
| 19 | `web/src/components/visualization/GalleryView.vue` | ` M` | **LAND** | `UnderlineTabs` → `SegmentedTabs variant="underline"` (import + tag) + `DialogContent variant="opaque"` → `surface="opaque"`. Worktree-as-baseline. |
| 20 | `web/src/components/visualization/GlassTimeline.vue` | ` M` | **LAND** | One `variant` rename + its doc-comment parity line. Worktree-as-baseline. |
| 21 | `web/src/components/visualization/VisualizationView.vue` | ` M` | **LAND** | `UnderlineTabs` → `SegmentedTabs variant="underline"` (import + tag). Worktree-as-baseline. |
| 22 | `web/src/components/visualization/gallery/AdminFlaggedPanel.vue` | ` M` | **LAND** | `DialogContent variant="opaque"` → `surface="opaque"`. Worktree-as-baseline. |
| 23 | `web/src/components/visualization/gallery/AdminUserList.vue` | ` M` | **LAND** | `DialogContent variant="opaque"` → `surface="opaque"`. Worktree-as-baseline. |
| 24 | `web/src/components/visualization/gallery/GalleryAdminBanner.vue` | ` M` | **LAND** | Six MetricBadge `:amount` → `:value`. Worktree-as-baseline. **This is `GAB-13`'s own record file**; §1.2 discharges the finding, this row lands the bytes. |
| 25 | `web/src/components/visualization/gallery/GalleryCardModal.vue` | ` M` | **LAND** | `variant="opaque"` → `surface="opaque"`. Worktree-as-baseline. |
| 26 | `web/src/components/visualization/gallery/GalleryDraftsSection.vue` | ` M` | **LAND** | One MetricBadge `:amount` → `:value`. Worktree-as-baseline. |
| 27 | `web/src/components/visualization/gallery/GallerySearchBar.vue` | ` M` | **LAND** | `glass-medium` → `glass-resting`. Worktree-as-baseline. |
| 28 | `docs/tranches/N/valuejs-inbound-2026-07-27-facility19-migration-table.md` | `??` | **LAND — act routed to G-2** | The O-14 letter, the sole `??` row (§2a: access **commit**). Its landing is **G-2's single act, at unit *b***, per F-W0 §7b's commit plan (`chore(F.W0): commit the O-14 letter`). This minute **rules** the disposition; it does not perform another unit's declared gate act. See §1.6. |

**Set summary, over the 28:**

| disposition | count | members |
|---|---|---|
| **LAND** | **28** | all 28 — the 27 ` M` executed in the LAND-set commit (hash banked at §1.8); path 28 routed to G-2 (unit *b*) |
| **LAND-WITH-CORRECTION** | **0** | — see §1.5 |
| **ABANDON** | **0** | — see §1.5 |

### 1.5 The two empty sets, and why each is empty

**ABANDON = ∅.** Not by omission, by ruling. OG-F1 adopts the worktree as baseline, and F-W0 §4 G-1 states
the bar in its own words: ***"A wholesale reset is a gate FAILURE, not a gate pass."*** Two of the 28 rows
(paths 4 and 13) are the **correct repair** of classes HEAD paints that do not exist, and a reset would have
destroyed the tree's only copies of both. **No path was reset, no `git checkout --` was run, no `git stash`
was taken, no `git reset --hard` was run, and no `git add -A` was issued** (§6a lock 10; §2b — a `git add -A`
is a wave abort).

**LAND-WITH-CORRECTION = ∅.** The disposition exists in G-1's vocabulary and this minute found no member for
it, for a bounds reason rather than a quality one: **F.W0 does not edit the contents of the ` M` SFCs.**
§2a's row for the 21 remaining ` M` SFCs reads *"dispositioned by name; contents NOT edited by this wave
(execution gate)"*, and the unit's writable set names the 28 paths **as commit objects only**. A correction
to a landed line is therefore an F.W1 / F.W3 / F.W4 act by construction, not an F.W0 one. **No correction was
suppressed to reach this result** — every one of the 27 diffs was read line-by-line by this seat (§1.4's
reason column is that reading), and all 27 are M.W1a glass-ui-4.0.0 API migration deltas in five classes:
the glass ladder renames (`glass-subtle`→`glass-wash`, `glass-elevated`→`glass-floating`,
`glass-medium`→`glass-resting`|`glass-floating`), `UnderlineTabs`→`SegmentedTabs variant="underline"`,
`Slider variant="glass-scrubber"`→`variant="standard"`, MetricBadge `:amount`→`:value`, and
`DialogContent variant="opaque"`→`surface="opaque"`.

### 1.6 What this minute deliberately does NOT do — routed, not dropped

| item | routed to |
|---|---|
| The O-14 letter's commit (path 28) | **G-2**, unit *b* — one act, `chore(F.W0): commit the O-14 letter` |
| `RUN-BOARD.md`'s content-claims (J/K-deploy/M interlock; dead M.W1b glass-4.1.0 gate) | **G-14**, unit *e* |
| `InfoCard.vue` + `CanvasOverlayButton.vue` DELETE + the 8-site `:aria-pressed` lift | **G-10**, unit *f* (ONE commit; a bare `git rm` is a gate FAILURE) |
| The manifest DECLARE+LOCK transaction | **F.W1** (R-4a) — F.W0 authors the gate only (G-6, unit *d*) |
| Anchor re-resolution before any line-number act | **G-11**, unit *e* (§6a lock 3: G-1 → G-11 → the lift) |
| `web/dist` quarantine | **Does not run this wave** (§6a lock 2 — G-4 and G-5 close honest-RED) |

### 1.7 Verification artefacts — the G-1 porcelain, BEFORE and AFTER

Banked here rather than in a sibling file: §2a declares this ledger **the wave's single durable artefact**,
and the unit's writable set contains no second path.

**BEFORE** — ⟨cmd⟩ `git status --porcelain`, this seat, 2026-09-17, before any staging. **28 lines = 27 ` M`
+ 1 `??`** (double-run: 28, 28):

```
 M docs/constellation/tri-tranche-run/RUN-BOARD.md
 M web/package-lock.json
 M web/package.json
 M web/src/components/equation/EquationModeToggle.vue
 M web/src/components/equation/EquationView.vue
 M web/src/components/equation/InfoCard.vue
 M web/src/components/equation/convergence/ConvergenceLegend.vue
 M web/src/components/equation/convergence/ConvergenceTimeline.vue
 M web/src/components/morph/HarmonicLevelGrid.vue
 M web/src/components/morph/MorphPhaseConfig.vue
 M web/src/components/paper/MobileFloatingToc.vue
 M web/src/components/paper/PaperView.vue
 M web/src/components/paper/search/PaperSearchDropdown.vue
 M web/src/components/ui/SliderControl.vue
 M web/src/components/visualization/AnimationControls.vue
 M web/src/components/visualization/BasisSelector.vue
 M web/src/components/visualization/EditorControlsDock.vue
 M web/src/components/visualization/EquationPanel.vue
 M web/src/components/visualization/GalleryView.vue
 M web/src/components/visualization/GlassTimeline.vue
 M web/src/components/visualization/VisualizationView.vue
 M web/src/components/visualization/gallery/AdminFlaggedPanel.vue
 M web/src/components/visualization/gallery/AdminUserList.vue
 M web/src/components/visualization/gallery/GalleryAdminBanner.vue
 M web/src/components/visualization/gallery/GalleryCardModal.vue
 M web/src/components/visualization/gallery/GalleryDraftsSection.vue
 M web/src/components/visualization/gallery/GallerySearchBar.vue
?? docs/tranches/N/valuejs-inbound-2026-07-27-facility19-migration-table.md
```

**AFTER** — banked at §1.8 below, read from the settled bytes after the LAND set commits (WRITE-THEN-MEASURE:
a figure is read from the tree, never predicted into it).

### 1.8 AFTER — the settled reading

**Read from the settled bytes, 2026-09-17, unit F.W0.a, after the LAND-set commit. Double-run; both
passes agreed.**

**The two commits of this minute:**

| # | hash | meaning |
|---|---|---|
| 1 | **`3079a92`** | `docs(F.W0): substrate ledger + 28-path land-or-abandon minute` — §1.0–§1.7 of this file |
| 2 | **`1193003`** | `chore(F.W0): LAND the 27 M.W1a working-tree paths (G-1, OG-F1 worktree-as-baseline)` — the LAND set, **27 files**, both named exceptions inside it |

**AFTER porcelain** — ⟨cmd⟩ `git status --porcelain` → **1 line** (double-run: 1, 1):

```
?? docs/tranches/N/valuejs-inbound-2026-07-27-facility19-migration-table.md
```

**The settled tree, measured:**

- ⟨cmd⟩ `git rev-parse --short HEAD` → **`1193003`** (was `cd26c65`).
- ⟨cmd⟩ `git diff --name-only HEAD | /usr/bin/grep -c .` → **0** — **no tracked path diverges from HEAD.**
  The audited substrate and the committed substrate are now the same bytes; this is the fact §1.1 promised
  and the whole point of the wave's goal criterion.
- ⟨cmd⟩ `git show HEAD:web/package.json | /usr/bin/grep -E 'glass-ui|keyframes|value\.js'` →
  `"@mkbabb/glass-ui": "^4.0.0",` · `"@mkbabb/keyframes.js": "^4.3.0",` · `"@mkbabb/value.js": "^0.13.0",`.
  **The 4.0.0 premise is now held by a commit.** (At `cd26c65` the same command returned `^3.1.0` / `^2.2.0`
  / `^0.10.0`.)
- ⟨cmd⟩ `git show 1193003 --name-only --format= | /usr/bin/grep -c .` → **27**.
- Both named exceptions verified **inside** commit `1193003` at the bytes — ⟨cmd⟩
  `git show 1193003 -- <the two paths> | /usr/bin/grep -E '^[+-] '` →
  `-    <div class="eq-toggle glass-subtle">` / `+    <div class="eq-toggle glass-wash">` and
  `-            class="paper-search-results glass-elevated"` / `+            class="paper-search-results glass-floating"`.
  **Neither was lost. Rows 24 and 25 landed.**

### 1.9 G-1's reading at this unit's close — stated honestly, not rounded up

G-1's GREEN has two limbs (F-W0 §4 G-1). This unit closes with one **complete** and one **at residue 1**:

| limb | state at close | evidence |
|---|---|---|
| *"every one of the 28 paths carries a named disposition (LAND / ABANDON / LAND-WITH-CORRECTION) in `SUBSTRATE-LEDGER.md`"* | **COMPLETE — 28 of 28** | §1.4's table, one row per §2a-i path, every row carrying a disposition and a reason |
| *"`git status --porcelain` is empty **or** its residue is exactly the ruled-ABANDON set"* | **RESIDUE = 1** | the ruled-ABANDON set is **∅** (§1.5), and the residue is the single `??` O-14 letter — ruled **LAND**, act routed to **G-2** |

**So G-1 is NOT green at this unit's close, and this ledger says so rather than claiming it.** The residue is
one path, its disposition is ruled, and its landing is **G-2's single act at unit *b***, the next unit in the
wave's strictly-serial order (`a → b → e → c → d → f`, §2b). **G-1 turns GREEN at unit *b*'s
`chore(F.W0): commit the O-14 letter` and not before.** Unit *a* did not perform that act, because §2a
assigns the letter's `commit` access and §7b's commit plan assigns the commit itself to unit *b*, and a seat
that absorbs a neighbouring unit's declared gate act to make its own gate read green is doing the thing this
programme exists to stop.

**Nothing in this minute is blocked on that residue.** Every path unit *b*, *c*, *d*, *e* and *f* needs is
**RELEASED** as of `1193003` (§2b: *"unit a holds all 28 paths… and must release them before b..f"*), and
the two G-10 lift sites carried in the ` M` set — `EditorControlsDock.vue` and `ConvergenceTimeline.vue` —
are now committed, so unit *f* lifts against a base a commit holds.

**Downstream stamps this minute authorizes:**

- **G-6 (unit *d*) is stamped `BRANCH = LAND`** — its born-RED facts are measured against the **landed 4.0.0
  manifest** at `1193003`, not the superseded 3.1.0 one. The ABANDON arm of §6a lock 5 **did not fire**.
- **§6a lock 3's first edge is satisfied**: G-1's tree is settled, so G-11 may re-resolve anchors against a
  tree a commit holds, and only then may unit *f* touch a line number.
- **§6a lock 10 is satisfied**: G-15(a)'s tree-touching leg may now run on the settled tree. **No stash
  artefact exists, because no stash was ever taken.**

---
