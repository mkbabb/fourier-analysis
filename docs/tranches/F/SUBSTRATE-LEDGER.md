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

## §2 — F.W0.e: the three tables, the Codex dispositions and the four rulings

**Unit F.W0.e · 2026-09-17 · seat model `claude-opus-5[1m]`.**

**Authority**: F-W0 §4 G-11 · G-12 · G-13 + addendum + drift receipt · G-14 · G-15(a)–(d) · §5 owner
rulings · §1d · §3 rows 5 · 6 · 13 · 17 · 20 · 21 · 22 · 23 · 27 · 28 · 29 · 33 · 36 · 37 · §6a locks
3 · 8 · 10. Owner rulings: `value.js/docs/tranches/X/COHESION.md` **§0j.D**, taken **as ruled** —
never presumed, never re-opened.

### 2.0 The substrate this section is measured at, and the locks it stands on

Every figure below is read from the **settled tree**, ⟨cmd⟩ `git rev-parse --short HEAD` → **`8bc7736`**,
branch `m/w1-bump-migration`, ⟨cmd⟩ `git status --porcelain | wc -l` → **0** (double-run: 0, 0). Every
count is **double-run** and both passes agreed; where they could not agree the figure is not published.

- **§6a lock 3 is satisfied at its first edge**: G-1 closed its porcelain limb at unit *b* (28 → 0), so
  anchors are re-resolved against **a tree a commit holds**. §2.1 publishes before unit *f* touches a
  line number, which is the lock's second edge.
- **§6a lock 10 is satisfied**: G-15(a)'s tree-touching leg runs here, after G-1, on the settled tree.
  **No `git stash` was taken by this seat, and none exists in this wave** — so there is no stash
  artefact to reconcile, exactly as the lock promises.
- **§6a lock 8 (E-3) governs every value.js write this unit makes**: `CENSUS-2026-08-03.md` and
  `lane-frontend.md` take **DATED ERRATA ADDENDA, never in-place patches**; `COHESION.md` takes an
  **append-only addendum**; the 66 `registry/adjudicated/fr-*.md` records and
  `INTAKE-ADJUDICATION-2026-08-03.md` are **E-1 immutable and were not touched** — this seat read them
  and wrote none.

**OG-F1 as ruled (§0j.D) is the frame for §2.1 and §2.5**: FREEZE-WITH-ADOPTION AND
WORKTREE-AS-BASELINE ⇒ *"G-11 narrows to drift-correction; G-14's R-coordinate rows become records."*
Both narrowings are taken, and each is stated at its site rather than assumed.

---

### 2.1 G-11 — THE CORRECTED ANCHOR TABLE

**Dated 2026-09-17. Substrate: fourier `8bc7736`; producer glass-ui read at `v8.0.0^{commit}` =
`17a11bc5`.** This is the ONE table; every later X·F wave **quotes** it and re-performs no
re-resolution of its own (F-W7 §7c consumes it by name).

#### 2.1.0 The standing rule this wave mints (P-4)

> **Producer-side evidence carries the producer COMMIT HASH, never the version string.**

The rule's own warrant is in this file: §2.3.7 records the producer HEAD moving **twice more** during
F.W0's own sitting. A version label (`7.0.0`, `8.0.0`, `9.0.0`) names a moving target; a commit names
bytes. Every producer coordinate in §2.1 and §2.3 is therefore pinned to `17a11bc5` — a **tag-resolved
commit**, stable by construction — and never to the string `8.0.0`.

#### 2.1.1 COUNTING UNITS — stated beside every pattern (pt-leaf K7's law)

**Byte-offset, occurrence and line are ANCHOR/UNIT differences, not errors.** Four units are used in
this ledger and each appears beside the figure it produces, never alone:

| unit | command shape | what it counts |
|---|---|---|
| **raw grep-lines** | `grep -rn <pat> src \| wc -l` | lines containing ≥1 match — **prose and code alike** |
| **occurrences** | `grep -ro <pat> src \| wc -l` | matches, so a twice-on-one-line pattern counts twice |
| **files** | `grep -rl <pat> src \| wc -l` | distinct files, whatever the per-file multiplicity |
| **live application sites** | raw grep-lines **minus** prose/comment residents **minus** sites in unreachable files | what a migration budget must actually pay for |

**A figure without its unit is not a denominator, it is a number.** The single largest defect class
this table corrects is *raw grep lines published as site counts* — fr-CanvasOverlayButton K-12's own
words, and §2.2 measures its cost exactly.

#### 2.1.2 THE ACCURACY BENCHMARKS — L-18 runs in BOTH directions

A drift table that names only one axis's failures is an indictment, not an instrument. Both directions
are named, and both are re-measured by this seat:

| direction | benchmark | this seat's re-measurement at `8bc7736` |
|---|---|---|
| **L is the accuracy benchmark** | fr-ContourPreview 31: *"L-axis cites are byte-exact throughout"* while the C axis drifts on five of five enumerated cells | **CONFIRMED.** All five C-lane corrections reproduce exactly — §2.1.3 row 1 |
| **L is the failure benchmark** | fr-CanvasOverlayButton superlative 3: *"Every D/C 7.0.0 claim reproduces at `git show v7.0.0:` four days and two working-tree drifts later; L's working-tree citations are 76 lines adrift (K-8)"* | **CARRIED as a register row** — the drifted 7.0.0 working-tree citations are not re-resolvable at this substrate, and OG-F1 does not ask them to be (§2.1.4) |

**The law the pair yields, and it is the one this wave exports:** *cite the epoch or the cite rots.*
Neither axis is reliable per se; the axis that **pinned its epoch** (`git show v7.0.0:`) reproduced and
the axis that cited a **working tree** did not — across the same four days and the same two drifts.
That is a property of the citation form, not of the seat.

#### 2.1.3 THE DRIFT REGISTER — eleven rows, each re-resolved or explicitly recorded

`cited` is the corpus coordinate; `true at 8bc7736` is this seat's re-resolution. **A row marked
RECORD is one OG-F1 removes from the work-set; it stays in the table because a later wave must still
not follow the stale coordinate.**

| # | register | class | cited | true at `8bc7736` | state |
|---|---|---|---|---|---|
| 1 | **fr-ContourPreview 31** (C-lane provenance drift) | axis line-drift | `stroke :44` · `cartoon-card :32` · `preserveAspectRatio :53` · `flip :55` · `vector-effect :48` | `stroke` **:45** · `cartoon-card` **:33** · `preserveAspectRatio` **:38** · flip (`transform="scale(1,-1)"`) **:41** · `vector-effect` **:47** — `ContourPreview.vue` is **62** lines | **RE-RESOLVED, 5/5 exact** |
| 2 | **fr-CollapsibleSection K-11** (six +1 slips) | axis line-drift, *systematic but inconsistent* — script-block cites slip +1 while other cites in the same document are exact | `scrollIntoView :27` · `open :15` · `rootEl :16` · `<Collapsible :33` · actions slot `:44` · PRM `:65-70` | **:26** · **:14** · **:15** · **:34** · **:43** · **:66**-71 — `CollapsibleSection.vue` is **72** lines | **RE-RESOLVED, 6/6 exact** |
| 3 | **fr-CanvasOverlayButton K-10** (line/count drift bundle) | axis line-drift + count drift | `tsconfig include :20` (L-2) · `vendor-ui :53-57` (C) · `iconOnly doc :26` (D-5) · `type` cure `:54` (D-9) · *"all 8 `.is-active` rules"* (D-3) · *"10 selectors"* (DU) · *"12 CSS / 11 bindings"* (LC) | `tsconfig.json` `"include"` **:19** · `vendor-ui` **:52** in `vite.config.ts` · the count limbs re-adjudicated to **11** by the record | **RE-RESOLVED at the two structural anchors; the count limbs RECORD** |
| 4 | **fr-App K-14** (provenance-drift bundle) | axis line-drift + arithmetic drift | `colors.ts:68-72` · `App.vue:29` · SvgFilters *"168 LOC"* · `index.html` *"39"* · amber `#a3702f` (D/L) and `#9d6415` (C) · `text-admin-label` *"8 sites"* (DU) · `DarkModeToggle.vue:19` (LC) | `:68-72` holds `hslToHex`/`rgbToHex` (the content is at `:90-96`/`:91-95`) · SvgFilters **178** lines — **and at `src/components/decorative/`, not `layout/`** · `index.html` **38** lines · amber **`#9d6515`** light / **`#e8b96d`** dark · `text-admin-label` **7** sites / 4 files | **RE-RESOLVED, 5/5 re-measurable limbs exact** |
| 5 | **fr-AdminAuditLog K-13** (provenance cluster) | mixed: anchors, arity, a self-stale comment | `error :74`/`:71` · destructure *"11 of 13"* · `admin.py:637-638`/`:640-643` · `api.ts:229` · aliases in `light-dark.css` · the shim comment's *"14 application sites (13 files)"* | `error` **:75** · destructure **10** · `admin.py:631-632` · `api.ts:250` · aliases in `color-radius.css:84/:85/:95` · the shim comment is **stale in the SITE count and right in the FILE count** — §2.2.2 row 3 reconciles all four readings | **RECORD (api/py coordinates are outside F.W0's bounds) + RE-RESOLVED for the shim** |
| 6 | **fr-DarkModeToggle I-3** (provenance-hygiene note) | **selective** drift — *self-repo* cites drift ~10–11 lines while *node_modules* cites are byte-exact | `vite.config.ts:47` | the `vendor-ui` chunk key is at **:52** (row 3's independent re-resolution agrees) | **RE-RESOLVED.** The selectivity is the finding: an agent following a self-repo cite lands in the wrong block while the producer cites in the same document hold |
| 7 | **fr-CoefficientsSpectrum K-11** (dead producer-path cites) | **producer-path death** | `semantic.css:238` · 7.0.0 `scale.css:86` as the admin token | **NOT RE-RESOLVABLE AND MUST NOT BE**: the paths are keyed to a producer generation the lane does not adopt. `text-admin-label` **is live at the installed 4.0.0 pin** — L's runtime conclusion right, its citation pointing at a tree where the opposite holds | **RECORD** — the archetype the P-4 rule exists for |
| 8 | **fr-EditorControlsDock K-9** (the corpus-wide producer pin) | **version-string-instead-of-commit-hash provenance** | every producer `file:line` keyed to the string `7.0.0` | **ALL STALE BY CONSTRUCTION.** The pin cell is `v8.0.0^{commit}` = **`17a11bc5`** (§2.3.1); the hop is **4→8**, not 4→7; every producer anchor re-resolves at the hash, and §2.3 re-derives the delta table | **RECORD + SUPERSEDED by §2.3** |
| 9 | **fr-EasingCurvePreview CITE** (≡ DU M-6 ≡ LC K-CITE) | **cites past EOF** — one citation past EOF *inside its highest-severity carry*; L and C drift by a line or a path; reader-LC drifts once itself (UserSlugBar) | the D-axis provenance whole | the two subject files re-measured: `EasingPicker.vue` = **98** lines, `EasingCurvePreview.vue` = **41** lines — the exact pair the producer's own v8 header names (§2.3.4) | **RECORD; subject extents RE-MEASURED** |
| 10 | **fr-GalleryDraftsSection m-18** (dirty-tree attribution) | *"every verdict is a working-tree verdict wearing a HEAD label — right for the tree that will be committed, unreproducible from the commit named"* | *"26 modified files"* under the label `cd26c65` | **DISCHARGED BY G-1.** The audited tree **is** the committed tree as of `1193003`; ⟨cmd⟩ `git diff --name-only HEAD \| grep -c .` → **0**. The count itself also drifted — G-1 measured **27** ` M` + 1 `??`, not 26 | **CURED — the only row this wave closes rather than corrects** |
| 11 | **BASELINE D-1** (this record's open) | **dead comparison operand** | G-4's `(src is 15/6)` parenthetical, implying `web/src/styles/index.css` | ⟨cmd⟩ `ls web/src/styles/index.css` → *No such file or directory*; the **directory** is absent. The gate's own operand — the installed producer dist — is unaffected at **17/8** (§2.8) | **RECORDED as a drift-correction row; NOT a gate flip** |

**One drift this seat found in its own instrument, disclosed rather than absorbed.** Probing
`lucide-vue-next` importers with `grep -rn 'from "lucide-vue-next"' src` returned **34** against a raw
line count of **35**. The missing site is not a prose hit — it is
`src/components/ui/CollapsibleSection.vue:4`, `import { ChevronRight } from 'lucide-vue-next'`, a
**single-quoted** import in a double-quoted codebase. **The probe, not the tree, produced the 34.**
This is the PASS-4 D-5 class exactly (a quote-restricted probe standing in for a census) and it is
recorded here because a table that convicts other seats' instruments owes the same audit of its own.
The published figure is **35 import sites / 35 files** and `lane-frontend.md:478`'s 35 is **RIGHT**.
It is also an `fr-CollapsibleSection i-3` instance: formatting diverges intra-file and no formatter
exists — **do not fix by hand; land the gate (G-7, unit *c*) and let it drive.**

#### 2.1.4 What OG-F1 narrows away, stated so no later wave mistakes it for an omission

Under **FREEZE-WITH-ADOPTION AND WORKTREE-AS-BASELINE**, G-11 is **drift-correction only**. It does
**not** re-root the R-coordinates, and it does **not** re-derive the corpus's producer citations at a
new epoch: rows 7 · 8 · 9 above are **RECORDS**, and the re-derivation they would need is **F.W1's, at
the ADOPTED hash** (FR-EQR-33(a); §2.3.1's PROSPECTIVE cell). The re-root branch would have put that
work in front of every G-11 publication and F.W1 sizing behind it. **The ruling is taken; the cost of
the branch not taken is stated here so the choice stays legible.**

---

### 2.2 G-12 — THE CORRECTED-DENOMINATOR TABLE

**Dated 2026-09-17, substrate `8bc7736`.** Every later X·F wave **cites this table** and never a
challenge file. Every row states its **denominator DEFINITION**, not just its integer.

#### 2.2.0 REGISTRY-FIRST IS A PRECONDITION, NOT A COURTESY

Bound here, in the form the bank demands (row 23, P-5):

> **Before any seat files a finding, counts a budget or grades a severity, it sweeps the adjudicated
> registry for the identity. A reader's missed-find cell needs a registry sweep before it needs a
> proof. A reader return SHOULD carry a "registry collisions checked" cell.**

The measured cost of treating it as courtesy is on the record and is not restated as an estimate:
`fr-ImageUpload` — **zero** `registry/adjudicated|fr-*` citations across all three axes (0/0/0), ≥7
headline rows that were re-books, two of six filed BLOCKERs graded against banked DEMOTIONS;
`fr-DarkModeToggle` — **14** banked-row rediscoveries by two independent readers on one component;
`FR-EQC` — two BLOCKER confirmations re-argued from scratch for rows banked a day earlier. The failure
mode is symmetric: inflated ledgers, mis-graded severities, off-component bookings, cures pointing at
dead lines, **and banked counts wrong in both directions**.

#### 2.2.1 The three denominator definitions, fixed once

1. **raw-grep-lines** — every line matching, prose included. Honest, and **never a migration budget**.
2. **application-occurrences** — matches in live template/style/script positions, prose subtracted.
3. **live application sites** — application-occurrences minus sites in files that no resolution
   channel reaches (today: `CanvasOverlayButton.vue`, `InfoCard.vue` — F8-REACH-02/01, deleted at
   G-10 by unit *f* under §0j.D).

fr-ContourPreview 27's **both-right** reading is the governing idiom: two seats reporting 21 and 25
are not in conflict when each states its unit; they are in conflict only when neither does.

#### 2.2.2 THE TABLE — every contradiction RECONCILED, never averaged

| # | quantity | the contradicting figures, at their homes | **RECONCILED at `8bc7736`** | how the reconciliation works |
|---|---|---|---|---|
| 1 | `variant="glass"` | **9 live / 7 files** (FR-COB-2 / K-12) **vs** *"12 sites / 8 files"* (D-1/C-10/C-12) | raw-grep-lines **12** / files **8** · prose-resident **2** · dead-file site **1** ⇒ **9 LIVE / 7 FILES** | 12 − 2 prose (`CanvasOverlayButton.vue:5`, `GalleryCard.vue:253`) − 1 dead (`CanvasOverlayButton.vue:18`) = **9**; 8 − 1 file (CanvasOverlayButton) = **7**. **Both figures were right under their own unit**; only one is a budget |
| 2 | `size="icon"` | **36 real (35 live)** (K-12) **vs** *"38 sites … floor dropped on all 38"* (D/C) **vs** *"36 icon"* (fr-PaperSearchInput D-M3) | raw-occurrences **38** / files **21** · prose-resident **2** ⇒ **36 REAL** · dead-file site **1** ⇒ **35 LIVE** | 38 − 2 prose (`CanvasOverlayButton.vue:5`, `GalleryCard.vue:254`) = **36**; − 1 dead (`CanvasOverlayButton.vue:19`) = **35**. **The WCAG 2.5.5 floor-drop denominator is 35** — K-12's own clause, re-measured exact |
| 3 | `.cartoon-card` | **21 sites / 14 files** (fr-AdminAuditLog K-13, re-confirmed FR-EQC-3) **vs** the shim's own comment *"14 application sites (13 files; one uses it 5 times)"* **vs** lane-frontend's raw **25** | raw-grep-lines **25** / files **15** · minus the shim's own definition+comment block in `style.css` (4 lines: `:98` `:99` `:101` `:107`) ⇒ **21 / 14** · minus 2 comment-resident in components (`GalleryCardModal.vue:247`, `VisualizationView.vue:192`) ⇒ **19 LIVE APPLICATION SITES / 13 FILES** | **Three denominators, three right answers.** lane-frontend counted raw (**25**); K-13 counted everything outside the shim's own block (**21/14**); the strict application reading is **19/13**. The shim comment's **FILE** count (13) is **EXACT at the strict reading**; its **SITE** count is stale by **5** against 19 and by **7** against 21. Its parenthetical *"one uses it 5 times"* still holds — `EquationView.vue` at `:230/:239/:243/:251/:308` |
| 4 | `text-admin-label` | **7 / 4 files** (fr-App K-14, fr-AdminAuditLog concurring) **vs** *"8 sites"* (reader-DU) | raw-grep-lines **7** / files **4** ⇒ **7 / 4** | DU's 8 *"inherited its own first enumeration rather than a recount"* (K-14). **Corrected figure confirmed live** |
| 5 | route records | **9 records = 7 lazy + 2 redirects + 1 alias over 6 distinct view modules** (= intake **X-2**) **vs** the census's *"8 routes, all lazy"* | **9 path records** in `src/router/index.ts:38-121`: lazy `/paper` `/v/:visualizationSlug` `/w/:imageSlug?` `/gallery` `/equation` `/morph` `/demo/shape-extractor` = **7**; redirects `/` and `/s/:slug` = **2**; alias `["/visualize"]` on `/w/` = **1**; distinct modules = **6** | `/v/` and `/w/` both resolve `VisualizationView.vue` — **7 lazy records over 6 modules**. The census's "8, all lazy" is wrong in **both** limbs: it counts one record short and calls two redirects lazy. **X-2 is CONFIRMED and is the figure of record** |
| 6 | `<Teleport>` sites | **2** | **2** | unit: raw-grep-lines; no prose residents |
| 7 | `<CollapsibleSection>` usages | **4 usages / 3 files** | **4 / 3** | unit: raw-grep-lines / files |
| 8 | `v-html` (L·§3c) | **10 sites / 8 files** (fr-EquationPanel, AMENDED) **vs** the challenge's *"6 files"* headline | **10 / 8** — `PaperView` · `PaperSidebar` · `PaperSearchDropdown` · `PaperSearchModal` · `EquationPanel` · `ConvergencePlot` · `EquationResult` · `EquationView` | **The eight files are exactly the eight the challenge's own same-paragraph enumeration names under a "6 files" headline** — an internal contradiction neither axis nor r1 caught. Confirmed live, file for file. **The SS-3/SS-4 spec authoring must not inherit the 6** |
| 9 | `--viz-amber` | **`#9d6515` light / `#e8b96d` dark** (K-14) — kills D/L's `#a3702f` and C's `#9d6415` | live tokens `style.css:120` = `hsl(35 76% 35%)` and `:125` = `hsl(37 73% 67%)`; converted by this seat: **`#9D6515`** / **`#E8B96D`** | **Re-derived from the tokens, not adopted from the record, and both land byte-exact.** C's `#9d6415` is a transposition of the correct value — *"reproduced unre-derived"* by a reader (K-14), the citation-inheritance class caught arithmetically |
| 10 | Button `variant` members | **13, not 14; `link` carries no `aria-pressed` leg** (K-5) | installed 4.0.0 `dist/button-BNDWhAZb.js`, CVA block extracted by node: **13** — `default · solid · primary-audacious · gold-audacious · destructive · outline · secondary · accent · ghost · glass · glass-wash · ai · link`; the **only** member with no `aria-pressed:` leg is **`link`** | **K-5 confirmed on both limbs at the bytes.** Sizes, for the same instrument: **6** — `default · xs · sm · lg · icon · icon-sm` |
| 11 | `e2e/*.spec.ts` | **8** — banked ×3 (`fr-AdminFlaggedPanel.md:110` · `fr-CollapsibleSection.md:65` · `fr-CanvasOverlayButton.md:74`) | **8**: contour-extraction · gallery · paper-performance · settings-persistence · visual-baseline · visualization-crud · visualization-ux · workspace-flow | **ANY 7-SPEC FIGURE IS A SUPERSEDED DENOMINATOR AND IS FORBIDDEN DOWNSTREAM** (§1d.2). Banked thrice, live-measured at the fold seat, at this record's open, and here — four independent readings, one answer |
| 12 | `lucide-vue-next` | *"35 import sites"* (lane-frontend `:478`) | raw-grep-lines **35** / files **35** / `from "…"` double-quoted probe **34** | **lane-frontend's 35 is RIGHT.** The 34 is this seat's own quote-restricted probe missing a single-quoted import — disclosed at §2.1.3's closing note. The rename to `@lucide/vue` is **F.W1's**, one of 35 censused sites |
| 13 | `MetricBadge` importers | *"7 imports / 6 files"* (lane-frontend) **vs** *"5 live files + 1 unmountable"* (FR-COB-10 / FR-IC-8) | **7 import statements / 7 files** — one import per file; `InfoCard.vue` is the unmountable one ⇒ **6 LIVE FILES**; identical at `cd26c65`, so **not a landing artefact** | **Both prior figures are one short on the FILE count.** After G-10's DELETE (unit *f*) the budget is **6 imports / 6 files, all live**. This supersedes the lane-frontend row and the FR-COB-10 restatement alike |
| 14 | every `tsconfig.app.json` citation | **DEAD** (row 14, FR-EQR-30) | ⟨cmd⟩ `ls tsconfig*.json` in `web/` → **`tsconfig.json` and nothing else**; **13** compilerOptions | **Confirmed.** Any corpus citation of `tsconfig.app.json` resolves nowhere and is forbidden downstream |
| 15 | the *"dead devDeps"* set | `lane-frontend.md:70` + `:645` + `web/DESIGN.md:33` book `class-variance-authority` · `clsx` · `reka-ui` · `tailwind-merge` as dead **vs** FR-AH-33: cva/clsx/reka-ui are **LIVE runtime peers** | **the denominator was wrong, and §2.2.3 proves it at the bytes** | see §2.2.3 — this is the row that would have made F.W1 **delete live peers** |

#### 2.2.3 The dead-devDeps row, decided at the bytes — the denominator, not the integer

`lane-frontend.md:70`'s probe is `grep -rn "from \"<pkg>\"" src/ | wc -l`. Re-run by this seat at
`8bc7736`, it returns **0** for all four packages — **the figure is reproducible and the conclusion
drawn from it is wrong**, because a **PEER's liveness is a property of the INSTALLED PRODUCER's import
graph, not of the consumer's `src/`.** Measured over the right denominator (double-run):

| package | fourier `src/` import sites | **installed glass-ui 4.0.0 `dist/` files importing it** | verdict |
|---|---|---|---|
| `reka-ui` | 0 | **40** | **LIVE required peer** |
| `class-variance-authority` | 0 | **11** | **LIVE required peer** |
| `clsx` | 0 | **2** (via `dist/cn-DJXf4yaB.js:1` — the `cn` chain) | **LIVE required peer** |
| `tailwind-merge` | 0 | **0** | **GENUINELY DEAD** — doc-comment-only, exactly C-5's narrowing |

All three live packages are in glass-ui 4.0.0's **REQUIRED** peer set (§2.3.3), and all five of
FR-AH-33's runtime-reached packages sit in `devDependencies` with `"dev": true` in the lock — so
**`npm ci --omit=dev` fails TODAY**, and vite's production `vendor-ui` chunk (`vite.config.ts:52`,
keyed on the package root) names lucide, so the manifest misdescribes the graph the build config
asserts.

> **THE MANDATORY SAME-ACT CORRECTION (ruling 6) IS DISCHARGED HERE**, as §6a lock 5 requires, in the
> form E-3 permits: a **DATED ERRATA ADDENDUM** beside `lane-frontend.md` and beside
> `CENSUS-2026-08-03.md` — never an in-place patch, and never a byte of `web/DESIGN.md`, which is
> `fourier/web/`'s own file and not in this unit's writable set. **`tailwind-merge` alone may be
> deleted. `class-variance-authority`, `clsx` and `reka-ui` must be MOVED to `dependencies`, not
> removed.** The manifest act itself is **F.W1's** (R-4a), authored at G-6 by unit *d*.

The three sites inheriting the stale `web/DESIGN.md:32` coordinate are corrected in the same addendum:
`lane-frontend.md:70` and `:645` both cite `:32` for the CVA row, and `:32` is
*"Replace `.gallery-card`/`.modal-card` divs with glass-ui Card"* — **the CVA row is at `:33`**
(⟨cmd⟩ `grep -n 'CVA dependency' web/DESIGN.md` → `33:`). **This is a D-19 instance inside a gate
condition**, and G-11's re-resolution law reaches gate conditions too, not only §3 record quotes.

#### 2.2.4 THE ` M` SFC DENOMINATOR — published ONCE, here, and nowhere else (R-9.4)

> **27** ` M` rows ⇒ **24** SFCs (`RUN-BOARD.md`, `package.json`, `package-lock.json` are not SFCs)
> ⇒ **21** remaining after the three named individually in F-W0 §2a (`InfoCard` · `EquationModeToggle`
> · `PaperSearchDropdown`) ⇒ **19** genuinely untouched after the two named below that row
> (`EditorControlsDock`, `ConvergenceTimeline` — G-10 lift sites).

**The "22 remaining" figure §2a formerly carried is SUPERSEDED and FORBIDDEN.** The chain is
27 ⇒ 24 ⇒ 21 ⇒ 19 and it is stated in exactly one place in the programme, which is this paragraph.

#### 2.2.5 The two rows that are NOT re-derivable, and must never be quoted as if they were

- **Array-literal `loops[].cardinality` is FABRICATED** (row 5, `FR-NP-2` ≡ `L·D-1`). R6's `loops` row
  ships `cardinality: 18` for a **3-element array** under the label `FINITE_ARRAY_LITERAL_SOURCE_DERIVED`;
  the comma-counter reconstruction predicts 18/15/7 across all three array rows — *a source-derived
  label over a fabricated number.* **BINDING RIDER: every F.W4 consumer treats array-literal
  `loops[].cardinality` as FABRICATED, and no later wave may quote a Codex/deriver cardinality without
  re-deriving it.** The deriver artefact is a Codex residue and §2.5 disposes of the class.
- **Deriver coverage is 89/89 on Button but 396/512 leaves unresolved** (row 6, `FR-NP-4` ≡ `L·D-2`).
  **Publish the split, never the ratio**: a 512-denominator percentage over a 396-resolved numerator
  is a fabrication by arithmetic. This discharges intake **X-9** (*"publish ONE member-scope law
  before any percentage"*) at F.W0, and **F.W4 consumes it**. The law, in one line:
  **a percentage whose numerator and denominator come from different resolution states is forbidden;
  publish `resolved/attempted` and `attempted/total` separately.**

#### 2.2.6 THE FORBIDDEN-FIGURE REGISTER — superseded denominators, named

Quoting any of these downstream is a defect against G-12 on sight:

`7 e2e specs` · `22 remaining ` M` SFCs` · `8 routes, all lazy` · `12 sites / 8 files` for
`variant="glass"` as a **budget** · `38 sites` for `size="icon"` as a **budget** · the
floor-drop denominator `38` (it is **35**) · `text-admin-label` `8` · `v-html` `6 files` ·
`--viz-amber` `#a3702f` or `#9d6415` · `14` Button variant members · `MetricBadge` `6 files` ·
any `tsconfig.app.json` coordinate · any producer coordinate keyed to the **string** `7.0.0` ·
any array-literal `loops[].cardinality`.

---

### 2.3 G-13 — THE PRODUCER PIN TABLE, THE LATTICE, AND THE ASYMMETRY

#### 2.3.1 THE PIN TABLE — the producer cell is a COMMIT HASH (P-4), measured at wave open

| cell | value | provenance |
|---|---|---|
| **producer pin (MEASURE-AT-OPEN)** | **`17a11bc5`** = `v8.0.0^{commit}` | ⟨cmd⟩ `git -C ../glass-ui rev-parse --short=8 'v8.0.0^{commit}'` → `17a11bc5`, this seat, 2026-09-17. **A TAG-RESOLVED COMMIT, stable by construction** — this is why the cell is satisfiable at all (§2.3.7) |
| **the ESC-1 election** | glass **8.0.0**, `v8.0.0` @ `17a11bc5` | `COHESION.md` §0i.3 — **taken as ruled, not re-elected here** |
| **producer HEAD (a DATED READING, NEVER A LIVE FACT)** | `887a0db9`, this seat, 2026-09-17 | banked as a reading only; see §2.3.7 |
| **producer `package.json` version string** | `9.0.0` | **A LABEL, NOT A PIN.** Recorded to show the string has moved past the elected tag; the elected bytes are `17a11bc5` and no later tag alters them |
| **consumer declared pin** | `^4.0.0` (`web/package.json`, committed at `1193003`) | ⟨cmd⟩ `git show HEAD:web/package.json \| grep glass-ui` |
| **consumer installed** | **4.0.0** | ⟨cmd⟩ `grep -m1 '"version"' web/node_modules/@mkbabb/glass-ui/package.json` |
| **ADOPTED pin** | **PROSPECTIVE — F.W1 fills this cell at adoption** | §6b: F.W0 does not execute the bump; FR-EQR-33(a) gives the re-derivation to F.W1. **F.W0 is never red for a hash only F.W1 can name** |

**The obligation F.W0 STATES and F.W1 DISCHARGES**, written once: *every producer `file:line` in the
F.W1 budget is re-resolved at the ADOPTED hash before it is scheduled.* §2.1.3 rows 7 · 8 · 9 are the
inventory that obligation consumes.

**FR-EQR-33(b) named, as G-13's asymmetry clause demands** — verbatim from `fr-EquationResult.md:74`:
*"The `CopyFailureReason` narrowing + `timeoutMs` are **v7.0.0 facts** (K-12), so they bind at ANY ≥7
target"* — i.e. they survive the 4→8 hop and are **not** re-derivation work.

#### 2.3.2 THE PIN LATTICE — who holds whom, in which direction

Measured by `node` over the installed manifests, this seat, 2026-09-17:

| holder | holds | kind | direction |
|---|---|---|---|
| `@mkbabb/keyframes.js@4.3.0` | `@mkbabb/value.js ^0.13.0` | **`dependencies` — HARD** | **BACKWARD (upward-binding)** |
| `@mkbabb/keyframes.js@4.3.0` | `@mkbabb/parse-that ^0.9.0` | `dependencies` — HARD | backward |
| `@mkbabb/keyframes.js@4.3.0` | `@mkbabb/glass-ui ~4.0.0` | `optionalDependencies` — **TILDE** | backward |
| `@mkbabb/glass-ui@4.0.0` | `@mkbabb/value.js ^0.10.0 \|\| ^0.11.0` | peer (optional) | forward |
| `@mkbabb/glass-ui@4.0.0` | `@mkbabb/keyframes.js` | peer (optional) | forward |
| fourier `web/` | glass-ui `^4.0.0` · keyframes `^4.3.0` · value.js `^0.13.0` | direct deps, committed at `1193003` | — |

> **THE BACKWARD PIN IS THE GENUINE INCREMENT, AND IT IS WHAT MAKES F.W2 UN-LANDABLE ALONE**
> (row 13, `C·D-11`). `keyframes.js@4.3.0` **hard-deps** `value.js ^0.13.0`, so value.js cannot be
> moved beneath it; and its `optionalDependencies` pin on glass-ui is a **TILDE — `~4.0.0` admits
> `4.0.x` and nothing else**, so adopting glass-ui at `17a11bc5` breaks keyframes' own optional pin
> unless keyframes moves in the same transaction. **This is the atomicity argument F.W1 needs, stated
> as a measured lattice rather than an assertion, and F.W2 INHERITS it rather than re-deriving it.**

The EBADPEER reproduction folds to **census risk-1** (banked ×3) and the `npm ls` ELSPROBLEMS identity
to **fr-AnimationControls C-1 ≡ fr-BasisCanvas C-8** — **cited, not re-booked**, per the dedupe law.

#### 2.3.3 THE TRUE PEER START STATE — the "clean pin" premise is false (row 12, FR-AFP-55)

glass-ui **4.0.0** declares **14 peers, 7 optional and 7 required** (node read, double-run):

- **OPTIONAL (7)**: `@vueuse/core` · `embla-carousel-vue` · `@mkbabb/keyframes.js` ·
  `@mkbabb/pencil-boil` · `@mkbabb/value.js` · `perfect-freehand` · `tw-animate-css`
- **REQUIRED (7)**: `@lucide/vue` · `class-variance-authority` · `clsx` · `reka-ui` · `tailwindcss` ·
  `vaul-vue` · **`vue`**

**Mismatches at the start state, enumerated as an F.W1 sizing input:**

| peer | declared by glass-ui 4.0.0 | actual | consequence |
|---|---|---|---|
| `@mkbabb/value.js` | `^0.10.0 \|\| ^0.11.0` (optional) | app pins **`^0.13.0`**, installed 0.13.0 | EBADPEER **warning**, not failure — but the tri-bump "clean pin" premise **understates the start state** |
| `@lucide/vue` | `^1.16.0` (**required**) | on disk **1.20.0**; **0** `node_modules/@lucide/vue` entries in the committed lock at HEAD; in neither dep block | **MISS-LC2** — *the audited tree is not reproducible from its own lockfile*. `createLucideIcon` is reached from dock/select/configurator/dropdown-menu/collapsible/tabs, so a faithful `npm ci` yields module-eval throws |
| `vaul-vue` | required | **0** `"node_modules/vaul-vue"` entries in the committed lock at HEAD; present in `web/node_modules` | **FR-EQC-7** — fires the day the bump lands, inside F.W1's transaction |
| `embla-carousel-vue` | **optional** | undeclared; the peer trio hoisted in `web/node_modules` | **cannot fail `npm ci --omit=dev`** ⇒ **REMOVED from G-6's land-together set**; a one-line convenience limb riding the F.W3 `.d` adoption |

The four rows above are **G-6's operands and this table's measured facts**; the gate text and its
branch-conditioned measurements are **unit *d*'s** (G-6, stamped `BRANCH = LAND` by unit *a*), and the
declare+lock landing is **F.W1's** (R-4a). **F.W0 states them; it writes no manifest byte.**

#### 2.3.4 THE 4→8 DELTA TABLE, RE-DERIVED — and `EasingCurve` RE-HOMED (row 21, MISSED-D)

**The census's 4→7 delta table is one major stale.** Re-derived at `v8.0.0^{commit}` = `17a11bc5`,
this seat, read-only:

| fact | at `v4.0.0^{commit}` (the adopted pin) | at `v8.0.0^{commit}` = `17a11bc5` | consequence |
|---|---|---|---|
| `EasingCurve` | **ABSENT** — ⟨cmd⟩ `git ls-tree -r --name-only 'v4.0.0^{commit}' \| grep -i easing` returns docs and `goo-blob/composables/easing.ts` only | **PRESENT** at `src/components/easing/EasingCurve.vue` | the extraction commit is **`1bc09dde`**, 2026-08-08, *"refactor(easing): land BK #85 W-EASING — EasingCurve extracted, the frame made constant, the staircase bound"* |
| its shape | — | **zero-state**; `strokes: EasingStroke[]` at `:44`, where **`d: string` is a PATH, not a callable** (`:35-39`) | the analytic catalogue drives it directly; the README's *"declines analytic catalogues"* objection **binds only the math** |
| its header names fourier's fork **by exact line count** | — | *"a 98-line name-colliding copy plus a 41-line preview in one repo alone"* | measured live: `EasingPicker.vue` = **98** lines, `EasingCurvePreview.vue` = **41** lines. **Byte-exact, both** |
| `Card`'s surface register | `cartoon` is a **Card-LOCAL superset member** (`src/components/ui/card/Card.vue`) | **STRUCK** — `src/components/card/Card.vue` header, verbatim: *"`cartoon` / `grid` / `metal` / `variant` / `dataHue` / `dataHueStrength` are struck: three of them wrote a class a consumer can write (`cartoon-surface`, `paper-grid`)"* | see §2.3.5 — **and the FILE MOVED** (`components/ui/card/` → `components/card/`), an independent P-4 instance |

**Consequences carried verbatim from the record, and NOT ruled here:**

> *"D-3 dies by construction on adoption; EasingCurvePreview.vue becomes a DELETION not a re-style;
> MorphPhaseConfig's twin re-homes onto the same unit; the accent gets both arms free; BUT the line
> re-enters the tri-package deadlock (glass 4→8) whereas DU's ToggleChip route was landable at the old
> pin — that trade-off is the ruling the forming F.W3 spec actually owes."*

**F.W0 re-derives the delta table and STATES the trade-off. F.W3 owes the ruling. F.W0 MUST NOT
pre-decide it**, and does not.

#### 2.3.5 THE ASYMMETRY — at `17a11bc5` every load-bearing 7.0.0 FINDING survives, but CURES die

This is the clause G-13 requires the table to **say which**, so a later seat cannot infer it:

| class | what happens across 4 → `17a11bc5` | named instances |
|---|---|---|
| **FINDINGS survive** | a defect proven against the consumer's own bytes does not move when the producer does | FR-COB-2's two limbs (the silent `variant` fall-through under a `strictTemplates`-less vue-tsc; the WCAG 2.5.5 coarse-floor re-key) · FR-EQR-33(b)'s `CopyFailureReason` narrowing + `timeoutMs` (v7.0.0 facts, binding at **any ≥7** target) · MISS-LC2 · FR-EQC-7 · FR-AH-33 |
| **CURES die** | a cure spelled in the producer's 4.0.0/7.0.0 vocabulary may be **unspellable** at the elected pin | **`<Card tier="opaque" surface="cartoon">` is UNSPELLABLE at `17a11bc5`** (FR-EQC-16 K-7) — the surviving form is **`<Card class="cartoon-surface">`**, because the prop was struck in favour of the class a consumer can write. Any cure routed through `surface="cartoon"` must be respelled before F.W1 schedules it |
| **ANCHORS die wholesale** | every producer `file:line` keyed to the string `7.0.0` | §2.1.3 rows 7 · 8; plus the `Card.vue` **path** move measured in §2.3.4 — a cure that survives as a spelling can still be unreachable by its cite |

**The migration cost is therefore asymmetric between axes**: the 4→8 hop costs **re-spelling and
re-anchoring**, not re-proving. *The pin correction kills CURES, not FINDINGS* — and the three rows
above are which.

#### 2.3.6 THE MIGRATION BUDGET IS CALLSITES, NOT IMPORTS (L-7's correction)

Measured at `web/src/components/visualization/EditorControlsDock.vue`, double-run:

| callsite | count |
|---|---|
| `<DockIconButton` | **12** |
| `<HoverPopover` | **2** |
| `<MetricBadge` | **1** |

**Counting unit, stated because the banked figure and the live figure differ by one and neither is
wrong**: the banked denominator is *"118 template lines"*; ⟨cmd⟩ awk over the `<template>` block
returns **119** lines **inclusive of both `<template>` and `</template>`**, **117** strictly between
them, and **118** inclusive of exactly one boundary. **This is a pt-leaf K7 anchor/unit difference,
not an error** — it is recorded rather than silently conformed, because a table that publishes
counting units owes one for its own headline.

An **import**-denominated budget would read 3 and understate the transaction by an order of magnitude.
Carried with it: fr-ContourEditorCanvas **MM-11** (cures that render the dock elsewhere ENLARGE the
transaction) and fr-CanvasControlsDock **D-12**.

#### 2.3.7 THE DRIFT, RE-MEASURED AT THIS SEAT — the eleven are now THIRTEEN

F-W0 §4 G-13's receipt records the producer HEAD drifting **eleven** times, the eleventh accruing
inside the act of writing the receipt. **Two more accrued during F.W0's own execution sitting**, and
this ledger states them as what they are — dated readings, banked nowhere else:

| # | reading | when |
|---|---|---|
| 12 | `e91b7b7e` | this wave's record, at F.W0's open, 2026-09-17 |
| 13 | `887a0db9` | this seat, hours later, same day |

**Neither is banked as current, and neither needs to be.** The pin cell (§2.3.1) is
`v8.0.0^{commit}` = **`17a11bc5`** — a tag-resolved commit, which is exactly why it does not move
while HEAD does. **The MEASURE-AT-OPEN clause is the cure and the drift is its evidence, not its
refutation.** A later seat that finds `887a0db9` stale has confirmed the rule; the defect would be a
ledger that claimed otherwise, and this one does not.

---

### 2.4 THE STALE-DIST ADMISSIBILITY RULE (row 27)

`web/dist` is present on disk, ⟨cmd⟩ `ls -ld web/dist` → **`Jun 12 18:13`**, and
⟨cmd⟩ `git ls-files web/dist \| wc -l` → **0** — **untracked and gitignored twice**
(`.gitignore:6` `dist/`, `:42` `web/dist/`). §1d.1's correction stands: **a `git rm` would target
nothing.** It is a **3.1.0-era artifact built BEFORE the 4.0.0 install and unrebuildable today**
(G-4 RED ⇒ G-5 RED), and *every "what the installed 4.0.0 emits" argument in the corpus reasoned about
it.*

> **THE RULE, published once and binding on every later X·F wave.**
> **An emission artefact is admissible evidence about a subject file if and only if
> `artifact_date > subject_mtime` AND `artifact_date > install_date` of every producer whose output
> the claim depends on. Otherwise it is INADMISSIBLE, and its silence is not evidence of absence.**
>
> - **`web/dist` (2026-06-12) is ADMISSIBLE** for git-clean subjects older than it and independent of
>   the 4.0.0 install — which is precisely why FR-MSP-12's byte-position extraction at 1955/1327 is
>   **sound**: its subject is Mar 30 and clean.
> - **`web/dist` is INADMISSIBLE for ANYTHING THE 4.0.0 INSTALL TOUCHED** — which includes every
>   Button/Card/size-token claim, and therefore the entire G-15(d) emission question (§2.6.4).
> - **THE QUARANTINE DOES NOT RUN THIS WAVE** (§6a lock 2). `web/dist` is not touched until G-4 **and**
>   G-5 are green, because **delete-before-rebuild destroys the only emission evidence the corpus
>   has.** No unit of F.W0 owns it, and a seat that deletes it to make a gate read tidy has destroyed
>   the decider for a ruling this wave was unable to make.

---

### 2.5 G-14 — CODEX RESIDUES, WORKTREES, THE M BOARD, AND THE PIN-HYGIENE RULE

**Under §0j.D's OG-F2 / OG-V2 ruling — *"CODEX-ERA-SPECIFIC … the Codex-authored prohibitions died
with M-15's abrogation (2026-07-27); the finding under OG-F2 (the absence, TRUE) stays adopted; the
`FOURIER-R*` value-side files are RECORDS"* — the R-coordinate rows below are RECORDS, not work.**
That ruling is taken, not presumed, and it is what makes this section a disposition rather than a
re-derivation.

#### 2.5.1 The Codex-provenance residues — five rows, each dispositioned

| row | claim | **DISPOSITION** | warrant |
|---|---|---|---|
| **R3-9** | *"No authored auditor, product module, API, service, Browser, Safari, Simulator, Docker, package, or parser code was imported or executed."* | **RECORDED as an UNVERIFIABLE PROVENANCE ASSERTION. NEVER CITE AS A METHOD GUARANTEE.** | an unfalsifiable negative from a frozen artifact; *consistent with* the packet's shape (`REVIEW.md` + `FINDINGS.json` + `checksums.sha256`, no runner, no execution receipts) — **but absence of a receipt is not proof of non-execution** |
| **R3-16 + R4-11 + R5-9 + R6-10** | *"14 waves / 72 units / 158 terminal rows; P29 0/137; passes 0/3; cleans 0/2; slots 0/5"*, four times | **THE 14-WAVE M BOARD IS THE REAL OBJECT, AND IT IS DISPOSITIONED. THE 72/158/P29/SLOT SUPERSTRUCTURE IS EXPLICITLY NOT TRANSFERRED.** | *"14 waves"* is **TRUE and maps to a real board**: `fourier/docs/tranches/M/M.md` runs **M.W0 → M.W13 = 14 waves** (`:91` is the `M.W13` close row, read by this seat). The rest is Codex-internal decomposition with **no counterpart in the fourier tree or the value.js megatranche**, and is **superseded in form** by the census §4 F.W0–W10 sketch. **Four rows, one object, one disposition — booked once and not re-booked three times** |
| **R4-12** | `/tmp/fourier-r4-files.sha256`, 74,507 B / 339 lines / SHA `e7054390…`, *"preserved without cleanup"* | **EVAPORATED — CONSUME NOTHING. Date of the absence: 2026-09-17.** | ⟨cmd⟩ `ls /tmp/fourier-r4-files.sha256` → *No such file or directory*, this seat. **The disposition is "evaporated", NOT "delete"** — there is nothing to delete, and a wave that booked a deletion would be claiming an act it did not perform. Its last-recorded size is attributed to the two in-tree documents that hold it: `HANDOFF.md:306` and `CENSUS-2026-08-03.md:360` |
| **R5-3** | *"Terminal receipt SHA is `7c1b1d59…`. No regular-file mtime follows it."* | **DROPPED.** | the intake's own disposition is *"re-hash if the coordinate is ever cited, or drop it."* **No F.W0 artefact cites the coordinate, and none will** — so the cheap and correct branch is to drop it. A pin nobody consumes needs no hash |
| **X-7** | the Codex chain violated its own prohibitions | **REGISTERED** as a carry, and **discharged in substance by §0j.D's OG-F2/OG-V2 ruling**: Codex-authored prohibitions do not bind the Claude-owned formation after M-15 | recorded so the register is complete; **not re-litigated here** |

#### 2.5.2 The three Codex worktrees — dispositioned by name

⟨cmd⟩ `ls ~/.codex/worktrees` → **`7e28` · `9167` · `d0be`** — **three, not one**, unchanged since the
fold. And the decisive reading, which no prior seat had taken:

⟨cmd⟩ `git -C /Users/mkbabb/Programming/fourier-analysis worktree list` →

```
/Users/mkbabb/Programming/fourier-analysis            8bc7736 [m/w1-bump-migration]
/Users/mkbabb/.codex/worktrees/d0be/fourier-analysis  cd26c65 (detached HEAD)
```

| worktree | holds | **DISPOSITION** | reason |
|---|---|---|---|
| **`d0be`** | `fourier-analysis` — **the only one registered against THIS repo**, detached at **`cd26c65`** | **RULED RETIRE; the tree-act is ROUTED, not performed here.** The exact act, stated so it is executable without re-derivation: `git -C /Users/mkbabb/Programming/fourier-analysis worktree remove ~/.codex/worktrees/d0be/fourier-analysis` (or `worktree prune` once the directory is gone) | **It is a live git registration pinned at the PRE-G-1 HEAD** — the very tree whose *"no commit holds it"* problem G-1 just cured, still addressable as a rival substrate. That is exactly the confusion §2c refused to manufacture with a fresh worktree, sitting in the tree already. **Nothing is lost by retiring it**: `cd26c65` is an ancestor of `8bc7736` and the repo holds it. **This unit does not run the command**, because `.git/worktrees/**` is outside its writable set and a seat that writes outside its bound to tidy its own gate is the defect class this programme exists to stop |
| **`7e28`** | **`value.js`**, not fourier | **NOT X·F's TO DISPOSITION MECHANICALLY — RECORDED AND ROUTED.** | it owns a formation census in the value.js tree, `formation/codex-worktree-7e28/CENSUS.md` (**92,254 B**, read by this seat), so *"its disposition is not purely mechanical"* — the census's own words. It is **not** a fourier registration (absent from `git worktree list` above) and X·F may not retire another lane's evidence |
| **`9167`** | **`keyframes.js`**, not fourier | **NOT X·F's — RECORDED AND ROUTED to X·KF.** | same ground: a sibling repo's worktree, absent from fourier's registration list. Sibling trees are READ-ONLY until their own wave opens |

**The census observation that named only `d0be` is CORRECTED here in substance**: it is right that
`d0be` is the fourier one, and right that it is still registered — and this ledger adds the reading
that makes it actionable (detached at `cd26c65`, visible in `worktree list`, retirable in one
command).

#### 2.5.3 `RUN-BOARD.md` — the content-claims, dispositioned (routed here by unit *a*)

Unit *a*'s §1.4 row 1 landed the **commit object** and routed the **content-claims** here. Both are
now dispositioned, and both die the same way.

⟨cmd⟩ reads of `docs/constellation/tri-tranche-run/RUN-BOARD.md` (114 lines), this seat:

| claim | live text | **DISPOSITION** |
|---|---|---|
| **the J / K-deploy / M tri-tranche interlock** | §2's dependency-edge table: **E1** *"ROOT HINGE … **glass-ui `3.3.0` on npm** … `npm view @mkbabb/glass-ui version` ≥ 3.3.0 … **BLOCKED** (published 3.2.0)"*; **E1b** BLOCKED; **E2** BLOCKED (gates on E1); **E3** already **RESOLVED-FALSE** | **DEAD BY SUPERSESSION.** The root hinge's own falsifier — *"≥ 3.3.0"* — was satisfied **six majors ago**: the producer's version string reads **9.0.0** and X·F's elected pin is `v8.0.0^{commit}` = `17a11bc5`. E1, E1b and E2 are **unblocked by arithmetic**, not by work; the board's BLOCKED cells describe a world that ended. **Nothing is re-planned here** — the interlock is closed as an object, and any surviving fourier obligation rides the X·F wave that owns it |
| **the dead M.W1b glass-`^4.1.0` gate** | `CENSUS-2026-08-03.md:152`: *"**M.W1b's gate (glass `^4.1.0`) is dead-by-supersession** (glass shipped 7.0.0) — M.W5–W9, then W10→W13, all blocked behind a cut that will never arrive in that form; unblocking is a re-grounding of the gate, not a bump"* | **DEAD BY SUPERSESSION, AND NOW DOUBLY SO.** The census called it dead at 7.0.0; at `17a11bc5` (8.0.0) it is dead twice over. **CENSUS §5 [P1]'s consequence is the load-bearing half — *"the dead M.W1b gate holds fourier's entire design surface"* — and the unblocking act is the RE-GROUNDING, which is this wave.** F.W0's substrate settle + these three tables **are** that re-grounding; the 14-wave M board (§2.5.1) is superseded in form by the X·F F.W0–W10 board |

#### 2.5.4 THE PIN-HYGIENE RULE — published, and binding from here

> **UNVERIFIED CODEX PINS ARE RE-HASHED AT USE OR DROPPED.**
>
> A hash, SHA, byte-count or mtime inherited from a Codex-era artifact may be **cited** only after
> being re-computed at the coordinate it names. If the coordinate is unreachable, the pin is
> **DROPPED** — it is never carried forward as a bare figure, and it is never used to certify an
> identity. **A pin that nothing consumes needs no hash** (which is why R5-3 is dropped rather than
> chased), **and a pin something consumes needs a fresh one** (which is why R4-12's 74,507 B is
> attributed to its two in-tree holders and not re-asserted as a live fact).
>
> The rule generalises P-4 one step: **P-4 says cite the commit, not the version; pin-hygiene says
> re-take the measurement, or don't cite it.** Both exist because the same thing kept happening —
> §2.3.7's thirteen drifts, `FR-NP-2`'s fabricated cardinality, `residue 12`'s invented identity, and
> R4-12's evaporation are four faces of one failure: **a figure frozen at read-time presented as a
> fact at use-time.**

---

### 2.6 G-15 — THE FOUR CONTRADICTIONS, RULED IN WRITING, EACH WITH ITS FALSIFIER

**All four rulings are taken AS RULED at `COHESION.md` §0j.D. None is re-opened, none is presumed, and
the falsifier is stated for each so a later seat can overturn it with evidence rather than opinion.**

#### 2.6.1 G-15(a) — THE VUE-TSC RED ⇒ **LAND** (row 37: `M-15 ⊗ PP-REDGATE`)

**THE RULING** (§0j.D, verbatim): *"the vue-tsc RED → **LAND**: the settled tree is the committed
substrate; the RED is the uplift's, its cure owned by F.W1/W2 (the pre-ruled green form; the forbidden
exit-criterion shape avoided)."*

**THE CONTRADICTION IT SETTLES.** Banked `M-15` (`fr-AnimationControls.md:69`) + `fr-PaperView`
(LC's fourth reproduction) + reader-A route the RED **to F.W0**; `fr-PathPreview` K7 / `PP-REDGATE`
**kills all three routings together**. Both could not stand.

**THE FALSIFIER, RUN — and it settles the question by measurement, not by prediction.** §6a lock 10 is
satisfied (G-1 green, settled tree, no stash). All four legs, this seat, 2026-09-17:

| leg | command | result |
|---|---|---|
| **(1) read-only, pre-bump substrate** | `git show cd26c65:web/package-lock.json` | typescript **5.9.3** · vue-tsc **2.2.12** ⇒ the compiler default for `noUncheckedSideEffectImports` is **false** |
| **(2) read-only, settled substrate** | `git show HEAD:web/package-lock.json` | typescript **6.0.3** · vue-tsc **3.3.5** ⇒ the default is **true**. **G-1's LANDING MOVED THIS OPERAND**, and this ledger says so rather than re-quoting the pre-bump figure |
| **(3) the gate, on the settled tree** | `(cd web && npx vue-tsc -b --force)` | **exit 1, ONE diagnostic, double-run identical**: `src/components/paper/PaperView.vue(12,8): error TS2882: Cannot find module or type declarations for side-effect import of '@mkbabb/latex-paper/theme'.` |
| **(4) flag isolation, OFF** | `npx vue-tsc --noEmit --noUncheckedSideEffectImports false -p tsconfig.json` | **exit 0 — ZERO diagnostics** |
| **(5) flag isolation, ON** | `npx vue-tsc --noEmit --noUncheckedSideEffectImports true -p tsconfig.json` | exit 2 — the **same single** diagnostic |

> **THE RULING, WRITTEN.** The RED is **entirely and only** attributable to
> `noUncheckedSideEffectImports`, whose compiler default flips **false → true** at typescript 6.0.3.
> Leg (4) proves it: with the flag off, the settled tree emits **zero** diagnostics. **`PP-REDGATE`'s
> conclusion is CONFIRMED BY MEASUREMENT and is no longer a prediction: the RED IS THE UPLIFT'S.**
> The `M-15` + `fr-PaperView` + reader-A routing of the RED to F.W0 **DIES**; `fr-PathPreview` K7's
> kill of all three is **SUSTAINED**.
>
> **AND THE HONEST HALF, WHICH THE PRE-RULED FORM DID NOT ANTICIPATE.** Under **LAND**, the settled
> tree's committed lock **is** the uplifted toolchain — so the RED is **no longer prospective. CI's
> `npx vue-tsc -b --force` (`ci.yml:95`, `deploy-pages.yml:114`, both read live) is RED at
> `8bc7736` today.** That is a fact F.W1 inherits, and it is **precisely the born-RED witness §4
> G-15(a)(3) reserved for F.W1 at the adopted toolchain** — measured here and handed over, not
> re-manufactured. **It does NOT become F.W0's cure**: the ruling names the owner, and an F.W0 exit
> criterion of *"vue-tsc green"* is the forbidden shape (unsatisfiable on one branch, gated on a later
> wave on the other). **The offending import is COMMITTED and four months old.**
>
> **CURE, ROUTED VERBATIM**: *"The cure (ambient `declare module \"@mkbabb/latex-paper/theme\"` in
> env.d.ts, or a latex-paper types fix) lands WITH the toolchain bump, owned by F.W1/W2 — NOT as an
> F.W0 precondition."* The latex-paper types arm rides the **P-6** relay, sent by unit *b*.
>
> **ERRATA INSTRUCTION, DISCHARGED**: banked `fr-AnimationControls.md:69` `M-15`'s F.W0 routing is
> **SUPERSEDED by this dated ruling**. Per **E-1**, the record is **NOT edited** — the addendum lands
> beside, here, and the dated evidence stays unaltered.
>
> **FALSIFIER THAT WOULD OVERTURN THIS RULING**: a run of leg (4) that emits a non-zero diagnostic
> count, or a diagnostic at the settled tree that survives the flag being forced off. Either would
> show the RED is a substrate defect rather than a flag default, and would re-open the F.W0 routing.
> **Neither holds today.**

**No tsconfig byte was written by this unit.** The flag isolation was done on the command line; the
`tsconfig.json` flags act is **unit *c*'s** (G-7/G-8). The run wrote `web/tsconfig.tsbuildinfo`, which
is gitignored at `.gitignore:43-44` and left porcelain at **0** — verified after the run.

#### 2.6.2 G-15(b) — THE ROOT-SIZE FORK ⇒ **THE 1.125rem ROOT GOES** (row 33: `FR-AUL-58 ≡ FR-COB-24`)

**THE RULING** (§0j.D, verbatim): *"the root-size fork → **`html{font-size:1.125rem}` under 768px
GOES**: the 12.5% inflation compounds with `--ui-scale` (67.5px against the token author's 60px);
F.W1's token-parity re-tune absorbs it, F.W4 executes per component."*

**THE WITNESS, LIVE** — `web/src/style.css:40-50`, read at `8bc7736`:

```css
html {
    font-size: 1.125rem;
    line-height: 1.75rem;
}

@media (min-width: 768px) {
    html {
        font-size: 1rem;
        line-height: 1.5rem;
    }
}
```

**THE INVERSION, STATED**: **18px mobile / 16px desktop** — the root is LARGER on the SMALLER
viewport. Consequences, carried: the 10px `text-admin-label` rung renders **smallest on the densest
context**; every rem-denominated glass-ui control token inflates **12.5%** and **compounds with the
coarse `--ui-scale: 1.5` → 67.5px against the token author's computed 60px**; the two micro scales
**CROSS** (13.5px mobile `text-xs` against a fixed 10px `text-admin-label`); PaperSearchInput's
40–67.5px controls sit beside a 20px hand-corrected twin.

> **THE RULING, WRITTEN. The `html { font-size: 1.125rem }` fork under 768px GOES.** The root returns
> to `1rem` in both arms and the app-wide scaling authority is **`--ui-scale`**, which is the token
> system's own instrument and the one the producer's coarse-pointer lift already keys. Two scaling
> systems multiplying is not a design, it is an accident with a media query.
>
> **THE SPLIT, and each half's owner — neither is taken by F.W0.**
> **F.W0 POSES AND RULES THE FORK. F.W1 RE-TUNES token parity against a 16px root. F.W4 EXECUTES
> per component**, within the partition `F-W3.md` §X.1-v4 publishes.
>
> **THE DIVERGENCE MINUTE IS RE-AFFIRMED, NOT QUIETLY INHERITED.** `FM-21` reads
> *"which scaling system owns control sizes is an F.W0-adjacent question the F.W4 ticket should pose,
> not answer."* **F.W0 takes the POSE knowingly**, on the stated ground that the answer **is** the
> root-fork decision and F.W1's re-tune consumes it before F.W4 opens. **The bank's *"not answer"*
> half is untouched and binds F.W4's per-component execution.** `fr-FourierMorphSvg` is **not** on
> v4's F.W4 default arm precisely because FM-21 is homed at row 33 — **F.W4 inherits the ruled fork,
> not the question.**
>
> **FALSIFIER**: a measurement showing the 12.5% inflation does **not** compound with `--ui-scale`
> (i.e. that the coarse lift is computed against a fixed base rather than the root), or a token-parity
> pass at a 16px root that produces a control smaller than the coarse-pointer 44px WCAG 2.5.5 floor.
> The first would dissolve the 67.5-vs-60 arithmetic; the second would show the fork was load-bearing.
> **Either re-opens the fork; neither is true at the tokens measured in §2.2.2 and §2.3.3.**

#### 2.6.3 G-15(c) — FM-19 ⇒ **FROZEN-FOREVER, WITH A GOLDEN-FILE DIFF** (row 36)

**THE RULING** (§0j.D, verbatim): *"FM-19 → **FROZEN-FOREVER with a golden-file diff** (no
regeneration pipeline exists; building one is unsized work)."*

**THE WITNESS, LIVE.** Seven assets under `web/src/assets/fourier-paths/`; ⟨cmd⟩ grep for
`fourier-paths` outside the asset directory returns **four** import lines in **two** files
(`FourierMorphDemo.vue:95-96`, `DarkModeToggle.vue:23-24`), naming **`sun.json` and `moon.json`
only** ⇒ **5 ORPHAN JSONs**, exactly as banked.

> **THE RULING, WRITTEN. The morph assets are FROZEN FOREVER.** No regeneration pipeline exists, none
> is built here, and none is scheduled: building one is unsized work against a surface with two live
> consumers. **The freeze is made safe by a GOLDEN-FILE BASELINE**, which is this table — published
> in the wave's single durable artefact because that is where §2a puts it.

**THE GOLDEN-FILE BASELINE — `web/src/assets/fourier-paths/`, measured at `8bc7736`, double-run:**

| asset | sha256 (first 16) | bytes | levels | points per level | consumer |
|---|---|---|---|---|---|
| `sun.json` | `625bb4afa49093cb` | 225,687 | 10 — `[1,2,3,5,8,12,18,25,35,50]` | **512, uniform** | `FourierMorphDemo.vue:95` · `DarkModeToggle.vue:23` |
| `moon.json` | `5bafda28dcdbdb53` | 224,944 | 10 — `[1,2,3,5,8,12,18,25,35,50]` | **512, uniform** | `FourierMorphDemo.vue:96` · `DarkModeToggle.vue:24` |
| `equation.json` | `1ac2252f8dcff1e9` | 271,065 | 12 — `[…,65,80]` | **512, uniform** | **ORPHAN** |
| `gallery.json` | `132171f6d0b6d800` | 271,058 | 12 | **512, uniform** | **ORPHAN** |
| `morph.json` | `e06beab56ad2ff5a` | 271,678 | 12 | **512, uniform** | **ORPHAN** |
| `paper.json` | `81af4f77fa85960f` | 272,551 | 12 | **512, uniform** | **ORPHAN** |
| `visualize.json` | `23a168bb13a5ad8e` | 271,797 | 12 | **512, uniform** | **ORPHAN** |

**The diff is the whole of the guarantee**: any later wave re-runs `shasum -a 256` over these seven
paths and compares to this table. A changed hash on a frozen asset is a defect by definition, because
nothing is authorised to write one.

**FM-23's REACHABILITY FRAME, and why the freeze is currently safe.** `lerpPoints`
(`src/lib/svg-fourier.ts:94-107`) opens with `const n = Math.min(a.length, b.length);` under a
docstring that reads *"Linearly interpolate between two **same-length** point arrays"* — **an
assumption the code states and never asserts.** A length-mismatched-but-non-empty pair cross-fades
only the common prefix, is closed by `" Z"` (`:72`), and renders a **chord across the figure**: no
throw, no warn, a syntactically perfect and silently mis-framed path. **It is LATENT TODAY and the
table above is why** — every level of every asset is 512 points, so `Math.min` is currently the
identity. **The freeze is what keeps it latent; the golden-file diff is what detects the day it
stops.**

> **RIDERS CARRIED, both EXCLUDED from F.W0 and routed:** **FM-23's cure is a rider ON banked `N-15`
> — a UNIFORM-LENGTH ASSERTION at `prepareFourierShape` (`svg-fourier.ts:76`), NOT an emptiness
> check** — paired with FM-19's golden-file diff. **FM-20's cure must not silently inherit the freeze
> assumption.** Both land at **F.W4**. **F.W0 owns only the regeneration/freeze ruling and the
> baseline they depend on**, and takes neither cure.
>
> **FALSIFIER**: a `shasum -a 256` over any of the seven paths that differs from this table, **or** a
> level whose `partial_sums[k].x.length` is not 512. The first falsifies the freeze; the second
> falsifies the latency claim and makes FM-23 live. **Neither holds at `8bc7736`.**

#### 2.6.4 G-15(d) — THE EMISSION CONTRADICTION ⇒ **UNDECIDABLE ON TODAY'S EVIDENCE** (row 7)

**THE RULING** (§0j.D, verbatim): *"the emission contradiction → **ruled UNDECIDABLE on today's
evidence**: the written ruling that the two cells are mutually exclusive, plus its falsifier — the
spec's honest-RED relief, by name."*

**(i) THE TWO COORDINATES, MEASURED AT THE BYTES BY THIS SEAT.** Both registries are E-1 immutable and
neither was touched:

- **`fr-PaperSearch.md:28` — K1, books the guard dead ON EMISSION.** ⟨cmd⟩
  `grep -o "the fleet.s registries currently DISAGREE[^.]*\." fr-PaperSearch.md` →
  *"the fleet's registries currently DISAGREE: fr-PaperSearchModal **PSM-24/R-3** books the same guard
  LATENT-on-next-build"* … against this registry's K1, which kills it on emission. *"Both cannot
  survive the first real 4.0.0 build."*
- **`fr-PaperSearchModal.md:63` — PSM-24/R-3, books it LATENT-on-next-build.** ⟨cmd⟩ `sed -n '63p'` →
  *"**PSM-24 = D-14 (LATENT-at-the-adopted-pin, R-3).** `h-3.5 w-3.5` inert against the button chunk's
  `[&_svg:not([class*=size-])]:size-(--ui-glyph)` guard (byte-extracted; producer prose in
  `offsets-sizing.css:172-178` names `size-*` as the only escape) — both intended icon registers
  (:68/:77 vs Input's `h-3 w-3`) collapse to one output on the first 4.0.0 build."*

**Two adjudicated registry cells, mutually exclusive, both present.** The guard itself is confirmed
live in the installed dist by this seat: the Button CVA base string carries
`[&_svg:not([class*=size-])]:size-(--ui-glyph)` byte-exact.

**(ii) THE DECIDER**: a **4.0.0-emitted stylesheet** — the CSS the app actually ships after a real
build at the adopted pin. Nothing else can settle it. *"It needs the build, not a browser"*
(fr-PaperSearch D-24) — which is why this is **F.W0's** question and **not** SS-13's.

**(iii) WHY THE DECIDER IS UNAVAILABLE TODAY, both arms:**

- **No 4.0.0 build can run.** **G-4 is RED** — the adopted producer stylesheet does not parse
  (17 `/*` against 8 `*/`, §2.8) — and **G-5 is gated behind it** (§6a lock 2), with `MISS-A7`'s
  vite-8/`manualChunks` break a **second, independent** blocker (row 7).
- **`web/dist` is INADMISSIBLE.** It is a 3.1.0-era artifact dated `Jun 12 18:13`, built **before**
  the 4.0.0 install, and §2.4's rule excludes it **by name** for anything the 4.0.0 install touched —
  which is exactly this claim. **Reading it would be the masking fallback this programme forbids: a
  stale artefact answering a question about bytes it predates.**

> **THE RULING, WRITTEN. `fr-PaperSearch` K1 and `fr-PaperSearchModal` PSM-24/R-3 are MUTUALLY
> EXCLUSIVE and UNDECIDABLE ON TODAY'S EVIDENCE.** Exactly one is right; **this wave cannot say which,
> and says so rather than electing one.** Neither cell is superseded, neither is graded down, and
> **neither registry byte is touched.**
>
> **THE FALSIFIER THAT SETTLES IT WHENEVER IT BECOMES RUNNABLE**, stated so no later seat re-derives
> it: **after G-5 goes green, run `/usr/bin/grep 'class\*=size-'` over the emitted CSS.** A hit means
> the guard survived emission ⇒ **PSM-24/R-3 (LATENT) wins and K1 loses**. No hit means the guard was
> compiled away ⇒ **K1 (dead on emission) wins and PSM-24/R-3 loses.** **The losing cell is then
> superseded by a DATED E-3 ADDENDUM — NEVER an in-place patch of a `registry/adjudicated/**`
> record**, which §2a declares E-1/E-3 immutable and §7a lists verbatim as wave-invalidating.
>
> **THE SAME E-3 RE-ROUTE BINDS RULING-6's RIDER** (row 7), quoted forward from a frozen record:
> *"when MISS-A7's build unblock lands, run the build, grep the emitted CSS for `class*=size-`, and
> correct whichever banked cell lost — booked here so the contradiction cannot outlive the evidence."*
> Taken literally that asks for an edit to an immutable record. **The instruction is honoured in
> substance and the immutability law is not bent to do it: the correction lands as a DATED ADDENDUM
> naming the losing cell and its superseding measurement.**
>
> **§7a's HONEST-RED RELIEF IS EXTENDED TO G-15(d) BY NAME**, on the identical ground it was granted
> to G-4 and G-5: **an exit criterion no act of this wave can satisfy is not a gate, it is a trap.**
> **G-15(d)'s honest-RED close is THIS WRITTEN RULING PLUS ITS FALSIFIER — never the emission.**
> F.W0 rules the contradiction; **it does not manufacture the build that would end it.**

---

### 2.7 OPTIONS RECORDED, NOT TAKEN

An option recorded is an option a later wave can take without re-discovering it. **An option taken
silently is a decision nobody reviewed.** Each row below states the option, the reason it is **not**
taken here, and its terminal home.

| # | option | why NOT taken at F.W0 | home |
|---|---|---|---|
| 1 | **`FR-AUL-23` — a base-layer `border-color: var(--border)` rule.** The record: the search field's border renders in `currentColor` (a near-black hairline in light mode) because Tailwind v4 preflight resets `border: 0 solid` with no colour, the `.border` utility carries none, and **no base `border-color` rule exists anywhere in the stack**; the record names *"a base-layer border-color rule is an F.W0 substrate option"* | **Three reasons, each sufficient.** (a) **BOUNDS**: it is a `web/src/style.css` write, and this unit's writable set holds no `web/src/**` path — the execution gate stands over app source at F.W0. (b) **BLAST RADIUS**: a base-layer rule repaints **every** unpainted border in the app, and F.W0 owns no visual review to catch what it changes — the wave that owns per-component visual execution is F.W4. (c) **IT IS CURED FOR FREE DOWNSTREAM**: `FR-AUL-6`'s `Input` swap fixes the actual defect at no extra cost. **The substrate option is real and is recorded so F.W4 may still elect it as the systemic cure rather than the local one** | **F.W4** (the defect) · the substrate option recorded here |
| 2 | **`FR-GFC-7` — declare `embla-carousel-vue` now.** | it is an **OPTIONAL** peer (§2.3.3), so it **cannot** fail `npm ci --omit=dev`; folding it into G-6's all-or-nothing land-together set with two **required** peers **over-binds** the transaction, and declaring a dependency with **zero importers** is what row 11's own *"do NOT pull the adoption forward"* forbids | a **one-line convenience limb** riding the **F.W3 `.d`** adoption |
| 3 | **Retire the `d0be` worktree registration in this wave.** | the tree-act writes `.git/worktrees/**`, outside this unit's writable set (§2.5.2). **The disposition is ruled here; the command is published; the act is routed** | the wave seat / a later X·F wave — one command, stated in §2.5.2 |
| 4 | **Quarantine `web/dist` now.** | **§6a lock 2 forbids it** while G-4/G-5 are RED: delete-before-rebuild destroys the only emission evidence the corpus has, including the decider FR-MSP-12 legitimately uses | **does not run this wave**; no unit owns it |
| 5 | **Extend `tsconfig.json` `include` to cover `vite.config.ts` / `playwright.config.ts` / `e2e/*.spec.ts`** (row 17, `PP-TSSCOPE`: *"the only type gate never checks its own test suite or build config"* — all **8** specs sit outside `vue-tsc -b` entirely) | **not this unit's gate.** The tsconfig act is **G-8, unit *c***, which may extend `include`, add a second project, **or minute the exclusion as a ruling**. Recorded here because the **denominator** (8 specs) is G-12's and is published at §2.2.2 row 11 | **G-8, unit *c*** |

---

### 2.8 THE HONEST-RED MINUTE — G-4 · G-5 · G-15(d)

**§7a grants honest-RED-close relief to these three BY NAME. The wave closes with them RED and SAYS
SO.** This is the minute that says so.

| gate | state at this unit's close | measured | why no act of this wave can turn it |
|---|---|---|---|
| **G-4** — the adopted producer stylesheet PARSES | **RED** | installed `@mkbabb/glass-ui` **4.0.0**; ⟨cmd⟩ `grep -o '/\*' web/node_modules/@mkbabb/glass-ui/dist/styles/index.css \| wc -l` → **17**, `grep -o '\*/' …` → **8** (double-run: 17/8, 17/8). `web/src/style.css:3` = `@import "@mkbabb/glass-ui/styles";` — the live import, re-confirmed | **PRODUCER-OWNED.** The emitter injected the AN.W1 fold-block at the first *literal* `@source` occurrence — a prose mention inside a comment — so the comment terminates early and un-commented prose follows with an unterminated string. **`../glass-ui` is READ-ONLY, ALWAYS. A consumer-side patch is a GATE FAILURE, not a gate pass** (FR-COB-8 S-4). The ASK was sent and is **ANSWERED** (O-20 §A-1, INBOX **I-30**) — *"discharges the ask, not the pre-gate"* (SEAMS S-11/S-23): **G-4 is measured at the ADOPTED 4.0.0 bytes, and neither a producer acceptance nor any later tag (8.0.0, 9.0.0) alters those bytes.** `FR-NP-32 (≡ fr-PaperSidebar M1)` — cite both, never substitute |
| **G-5** — `npm ci && npm run build` completes | **RED** | ⟨cmd⟩ `git ls-files web/dist \| wc -l` → **0**; `ls -ld web/dist` → **`Jun 12 18:13`**. Build act-half **UNRUN** | **GATED BEHIND G-4** (§6a lock 2 — *"no build can run while the stylesheet does not parse"*), with **`MISS-A7`** a second independent blocker: `npm run build` is unrunnable at the pin (vite-8/`manualChunks`), *silently disabling every build-based falsifier in all three challenge files across the whole family*. **Method note (K12), carried so F.W1 does not repeat it: the correct manifest probe is `npm ci --omit=dev`, NOT `npm rm X && npm run build`** — npm ≥11 re-satisfies the peer on install |
| **G-15(d)** — the emission contradiction | **RED**, and **CLOSED HONEST-RED with its ruling written** | §2.6.4 | its GREEN would chain G-15(d) ⇒ G-5 ⇒ G-4, i.e. through a **producer-owned** gate — **unreachable on the branch this spec declares likely**, which is the shape G-15(a) forbids in its own words. **The relief is granted on that ground and the close is the RULING plus the FALSIFIER, never the emission** |

**What this wave does NOT do to make these read tidy, stated as commitments:** no consumer-side patch
of the producer stylesheet · no local patch of `node_modules` · no `web/dist` quarantine · **no
stale-dist admission** — §2.4's rule excludes it and no figure in this ledger rests on it · no
build forced past a known-unparseable sheet · no gate re-scoped to a condition it can meet.

**Consequence for the lane, stated once**: **G-4 RED ⇒ G-5 RED ⇒ the quarantine and F.W1 SIZING stay
blocked on the producer**, exactly as §7a prescribes. **F.W1 waits on nothing else from F.W0** — the
three tables, the pin, the lattice, the dispositions and the four rulings are all published and
citable as of this section.

---

### 2.9 This unit's gate reading, and what it routes

| gate | BEFORE (this unit's open) | AFTER (this unit's close) |
|---|---|---|
| **G-11** | **RED** — no anchor table; ten drift registers NO-WAVE-OWNER with no terminal home | **GREEN.** §2.1 — dated, counting units beside every pattern, benchmarks in **both** directions, the P-4 standing rule, **11 register rows** (7 re-resolved at the settled tree, 3 recorded per OG-F1, 1 discharged by G-1), baseline **D-1** carried as a drift-correction row. **The registers have their terminal home** (COHESION §3.3) |
| **G-12** | **RED** — no denominator table; the contradictions live | **GREEN.** §2.2 — **15 reconciled rows**, three denominator DEFINITIONS fixed, **8 e2e** (7 FORBIDDEN), the ` M` SFC denominator published **ONCE** (27⇒24⇒21⇒19), **REGISTRY-FIRST bound as a PRECONDITION**, a forbidden-figure register, and the dead-devDeps contradiction decided at the bytes |
| **G-13** | **RED** — no pin table; corpus, CENSUS, lane-frontend and the apotheosis all keyed to a version string | **GREEN.** §2.3 — producer cell = **`17a11bc5`** (`v8.0.0^{commit}`, measured at open), **ADOPTED cell PROSPECTIVE**, the **lattice** with the backward pin and the TILDE, the **true peer start state** (14/7/7), the **4→8** delta table with `EasingCurve` re-homed, **the asymmetry said** (findings survive, cures die, which), and the budget in **CALLSITES** (12/2/1) |
| **G-14** | **RED** — `RUN-BOARD.md` undispositioned; three worktrees; five residues | **GREEN.** §2.5 — five residues dispositioned, **three** worktrees dispositioned by name, the **14-wave M board** disposed with the 72/158/P29/slot superstructure **explicitly NOT transferred**, **R4-12 evaporated/consume-nothing with its date**, **R5-3 dropped**, **X-7 registered**, the **pin-hygiene rule** published, and **both** RUN-BOARD content-claims declared **dead-by-supersession** |
| **G-15(a)** | **RED** — ruling unwritten; the contradiction live | **GREEN.** §2.6.1 — ruled **LAND** as §0j.D rules it, with the falsifier **RUN** (5 legs) and the conclusion **confirmed by measurement**, not predicted |
| **G-15(b)** | **RED** | **GREEN.** §2.6.2 — ruled **the 1.125rem root GOES**, with the split (F.W0 rules · F.W1 re-tunes · F.W4 executes) and its falsifier |
| **G-15(c)** | **RED** | **GREEN.** §2.6.3 — ruled **FROZEN-FOREVER**, **and the golden-file baseline EXISTS** (7 assets, sha256 + bytes + levels + uniform 512), with its falsifier |
| **G-15(d)** | **RED** | **RED — HONEST-RED CLOSE, and it says so.** §2.6.4 — the written ruling (mutually exclusive, undecidable), the two measured coordinates, the decider, why it is unavailable, and the falsifier. §7a relief held **by name** |

**Routing — nothing dropped:**

| item | routed to |
|---|---|
| Anchors re-resolved ⇒ **unit *f* may now touch line numbers** (§6a lock 3's second edge) | **G-10, unit *f*** — and **note D-3's count-word divergence stands unaltered**: §2.1 supplies anchors, it does not re-open the seven-vs-eight question |
| The four G-6 peer facts (`@lucide/vue` · `vaul-vue` · the five runtime devDeps · embla as an optional non-operand) | **G-6, unit *d*** — measured here as G-13 start-state rows, **authored** there |
| The `tsconfig` `include` scope option + the **8**-spec denominator | **G-8, unit *c*** |
| The **dead-devDeps** correction (`cva`/`clsx`/`reka-ui` MOVE, `tailwind-merge` DELETE) | **F.W1** for the manifest act (R-4a); the **doc half is discharged here** as dated errata addenda |
| Producer `file:line` re-resolution **at the ADOPTED hash** | **F.W1** (FR-EQR-33(a)) — F.W0 states the obligation, F.W1 discharges it |
| The `EasingCurve` 4→8 **trade-off ruling** | **F.W3** — stated here, **not pre-decided** |
| FM-20 / FM-23 cures (FM-23 as a rider ON banked `N-15`: a uniform-length assertion at `prepareFourierShape`) | **F.W4** |
| The token-parity re-tune at a 16px root | **F.W1**; per-component execution **F.W4** |
| The vue-tsc RED's cure (ambient `declare module`, or a latex-paper types fix riding P-6) | **F.W1/W2** — with the **live** CI RED at `8bc7736` handed over as F.W1's born-RED witness |
| `d0be` worktree retirement (one command, published) | the wave seat / a later X·F wave |
| G-15(d)'s falsifier, after G-5 | whichever wave first gets a green build; the losing cell takes a **dated E-3 addendum** |

**Escalations: none.** No §7a trigger fired: no bounds expansion, no unrulable per-path disposition,
no ruling returned empty, and no diagnostic loop reached a third iteration — the denominator table
reconciled the 21-vs-25 and 9-vs-87 pairs on the **first** pass (§2.2.2 rows 3 and 1), and no anchor
file needed a second re-resolution.

**Law compliance at this seat**: no write outside the writable set (this file; and on the value.js
side, two **dated errata addenda** and one **append-only** COHESION addendum) · **no
`registry/adjudicated/**` byte, no intake-adjudication byte, no dated-spec byte patched** — E-1/E-3
held, and the one instruction that asked for a registry edit (ruling-6's rider) was **re-routed to an
addendum, not obeyed literally** · no `git add -A`, no `git stash`, no `reset --hard`, no `checkout --`,
no force-push · `value.js/scripts/dev/dev.sh` never touched, never staged · `glass-ui` and every other
sibling tree **read-only** · no `node_modules` patched · no cron created · pathspec commits only ·
`execution/LEDGER.md` untouched (its F.W0 row is the wave seat's) · **every published figure
double-run at the settled bytes, and the three that this seat's own instruments got wrong are
disclosed at §2.1.3, §2.2.2 row 12 and §2.3.6 rather than quietly conformed.**

---
