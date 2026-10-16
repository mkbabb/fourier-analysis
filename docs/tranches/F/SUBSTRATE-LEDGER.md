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

## §3 — F.W0.c: the toolchain gates — the unused-code gate, the lint floor, the scope widening, the seat

**Unit F.W0.c · 2026-09-17 · seat model `claude-opus-5[1m]`.**

**Authority**: F-W0 §4 **G-7** · **G-8** · **G-9** + its F.W9 disjointness clause · §3 rows **15** ·
**16** · **17** · **18** · **19** · **38** · §2a rows for `web/tsconfig.json`, `web/e2e/`,
`ci.yml`/`deploy-pages.yml` · **§6a lock 7** (row 16 is a RIDER on `M-10`, never landed alone;
WAVE-LOCK: no `basisFilter` wiring without `normalizeBasisKey`) · **§6b** the F.W9/F.W10 row ·
**§7b** the format/lint cadence. Wave record: `value.js/docs/tranches/X/execution/C/F-W0.md`.

### 3.0 The substrate this section is measured at, and what this unit may not touch

Every figure below is read from the tree at ⟨cmd⟩ `git rev-parse --short HEAD` → **`9930e80`**
(unit *e*'s close), branch `m/w1-bump-migration`. Every published count is **double-run** and both
passes agreed; where they are counts of a moving file they carry the date they were taken
(§2.5.4 pin-hygiene).

**Writable set, hard**: `web/tsconfig.json` · `.github/workflows/ci.yml` ·
`.github/workflows/deploy-pages.yml` · `web/e2e/**` · this ledger. **NOT writable, and the bound is
load-bearing rather than incidental**: `web/package.json` + `web/package-lock.json` — F-W0 §2b is
categorical (*"unit a holds all 28 paths — including `package.json`/`package-lock.json`, whose only
F.W0 act is a's land-or-abandon ruling"*). **Two of this unit's three gates name an act that would
ordinarily be a manifest byte** (a lint dependency; a unit-runner dependency). **Neither was written.**
§3.1.4 and §3.3.1 record how each gate was met without one, and why that is a cure rather than a
dodge. `web/src/**` is likewise not writable, which is why every deletion the gates surface is
**routed to F.W3/W4 and none is performed here** (§7b: *land the gate, then let it drive*).

### 3.1 G-7 — AN UNUSED-CODE GATE + A LINT FLOOR EXIST AND ARE WIRED

#### 3.1.1 The tsconfig act

`web/tsconfig.json` carried **13** `compilerOptions` and **0** of the three flags `MG-θ` names
(⟨cmd⟩, at open, `/usr/bin/grep -c 'noUnusedLocals\|noUnusedParameters\|noUncheckedIndexedAccess'`
→ **0**). It now carries **16** — ⟨cmd⟩ `node -p "Object.keys(require('./tsconfig.json').compilerOptions).length"`
→ **16** — the three additions being `noUnusedLocals: true`, `noUnusedParameters: true` and
`allowImportingTsExtensions: true` (§3.4: a disclosed consequence of the seat, not a gate flag).

**The gate is wired by construction**: the flags live in the project `vue-tsc` compiles, and
`ci.yml` + `deploy-pages.yml` both run `npx vue-tsc -b --force`. FR-IC-25 is satisfied at the one
place the corpus proves is the true enforcing gate (row 38).

#### 3.1.2 THE FIRST-RUN YIELD — measured 18 findings / 14 files against a predicted 16 / 12. THE DIVERGENCE IS MINUTED, NOT ADOPTED

G-7's GREEN clause banks a **predicted** first-run yield, *"twice-executed independently: 16 findings
/ 12 files"*, with the rider that *"labels.ts rows are destructured locals, not params — the honest
count stays 16/12"*. **Measured at the settled tree, the yield is 18 findings across 14 files.**

⟨cmd⟩ (`web/`, double-run, byte-identical output both passes)
`npx vue-tsc --noEmit -p tsconfig.json --noUnusedLocals --noUnusedParameters`
→ **19** diagnostic lines, of which **one** is the pre-existing `TS2882` that G-15(a) rules is the
uplift's and F.W1/W2's (§2.6.1) and is **excluded from this gate's denominator**. Counting units,
stated beside the pattern (pt-leaf K7): a **finding** = one emitted diagnostic line; a **file** = one
distinct path in column 1.
⟨cmd⟩ `… | /usr/bin/grep -v TS2882 | /usr/bin/grep -c .` → **18**
⟨cmd⟩ `… | /usr/bin/grep -v TS2882 | /usr/bin/sed 's/(.*//' | sort -u | /usr/bin/grep -c .` → **14**
⟨cmd⟩ `/usr/bin/grep -o 'error TS[0-9]*' | sort | uniq -c` → **17 × TS6133** · **1 × TS6196**
(· 1 × TS2882, excluded).

**THE 18, ENUMERATED — so that F.W3/W4 consumes measured rows and never a predicted integer.**

| # | site | diagnostic |
|---|---|---|
| 1 | `src/components/equation/composables/useCoeffHover.ts(22,5)` | TS6133 `notation` |
| 2 | `src/components/equation/EquationView.vue(57,7)` | TS6133 `loading` |
| 3 | `src/components/equation/FrequencyGraph.vue(2,43)` | TS6133 `onUnmounted` |
| 4 | `src/components/layout/AppHeader.vue(49,7)` | TS6133 `workspaceStore` |
| 5 | `src/components/paper/PaperView.vue(20,1)` | TS6133 `PaperSectionData` |
| 6 | `src/components/paper/search/usePaperSearch.ts(10,10)` | TS6133 `SearchEntry` |
| 7 | `src/components/visualization/BasisSelector.vue(11,7)` | TS6133 `fourierModes` |
| 8 | `src/components/visualization/ContourEditorCanvas.vue(42,9)` | TS6133 `dragging` |
| 9 | `src/components/visualization/gallery/GalleryCard.vue(9,1)` | TS6133 `VIZ_COLORS` |
| 10 | `src/components/visualization/gallery/GalleryCard.vue(10,1)` | TS6133 `PathPreview` |
| 11 | `src/components/visualization/ImageUpload.vue(2,15)` | TS6133 `computed` |
| 12 | `src/components/visualization/lib/canvas-drawing/labels.ts(20,18)` | TS6133 `width` |
| 13 | `src/components/visualization/lib/canvas-drawing/labels.ts(20,25)` | TS6133 `height` |
| 14 | `src/components/visualization/lib/canvas-drawing/labels.ts(85,18)` | TS6133 `width` |
| 15 | `src/components/visualization/lib/canvas-drawing/labels.ts(85,25)` | TS6133 `height` |
| 16 | `src/components/visualization/VisualizationView.vue(2,25)` | TS6133 `watch` |
| 17 | `src/lib/api.ts(5,5)` | TS6196 `AnimationSettings` |
| 18 | `src/lib/contourEditing.ts(20,53)` | TS6133 `tension` |

**Rows 9 and 10 are `MG-θ`'s named instances and they resolve exactly**: `GalleryCard`'s two dead
imports, `VIZ_COLORS` at `:9` and `PathPreview` at `:10` — the latter being **`PP-DEAD`'s F.W0
instance**, the `noUnusedLocals` rider named at row 15. The **labels.ts four** (rows 12–15) are
destructured locals, exactly as the prediction's rider says, and they are **counted**, not discounted.

**THE DIVERGENCE, STATED AND NOT RECONCILED AWAY.** Measured **18 / 14**; predicted **16 / 12**;
delta **+2 / +2**. The prediction is a *prediction* — G-7's own clause calls it
"twice-independently-**predicted**" — and this seat did not find a reading of the tree that returns
16, so it **publishes the measurement and leaves the prediction standing as what it was** rather than
trimming two rows to meet it. Two facts bound the possible explanations and neither is asserted as
the cause, because neither was measured by this seat: the predicting seats read the tree **before**
unit *a* landed it (the contents are identical — OG-F1 landed the working tree as baseline — but the
toolchain the predictions were taken under is not knowable from here), and the settled lock now
resolves **typescript 6.0.3 / vue-tsc 3.3.5** (§2.6.1 leg 2) where the pre-bump lock resolved
**5.9.3 / 2.2.12**. **Determining which is a falsifier that needs a second tree, and §2c forbids a
worktree.** Routed below.

**FORBIDDEN-FIGURE ENTRY (joins §2.2.6's register): `16 findings / 12 files` may NOT be quoted
downstream as a measured yield.** It is a prediction of record. The measured yield at the settled
tree, dated 2026-09-17, is **18 / 14**, and it is itself a **dated reading of a moving tree** — F.W3/W4
re-measures before it deletes rather than deleting this list.

#### 3.1.3 `noUncheckedIndexedAccess` — DECIDED: **DEFERRED, as a rider on M-10**, with its consumer named

G-7 requires this flag **decided** — *"set, or minuted as deferred with M-10's `BasisKey` unit named
as its consumer"* (row 16). **It is DEFERRED, and the deferral is compelled rather than chosen**:
§6a **lock 7** states that row 16 (`fr-BasisSelector i-3` = `LC-missed-7`) is *"a **rider on `M-10`**,
never landed alone"*, and carries the **WAVE-LOCK** *"no `basisFilter` wiring without
`normalizeBasisKey` (the store repeats the widening at `gallery.ts:38`)"*. Setting the flag in this
wave **is** landing it alone. **No `basisFilter` byte was written by this unit, and no `gallery.ts`
byte was read into any act.**

**THE CONSUMER, NAMED AS THE GATE REQUIRES**: `M-10`'s repair unit — **`BasisKey` + `normalizeBasisKey`
+ `satisfies`**, at **F.W3/W4**. The flag is what makes that unit *enforceable*; the unit is what makes
the flag *landable*. They land together or neither lands.

**THE SIZING INPUT, MEASURED HERE SO F.W3/W4 NEVER HAS TO GUESS AT IT** — ⟨cmd⟩ (`web/`, read-only,
flag forced on the command line, tsconfig untouched by the probe, double-run identical)
`npx vue-tsc --noEmit -p tsconfig.json --noUncheckedIndexedAccess`
→ **287** diagnostics, **286** excluding the F.W1/W2-owned `TS2882`, across **35** files. That is the
true size of the transaction the flag opens, and it is **sixteen times** the unused-code gate's yield —
which is the whole argument for the rider: landed alone it would bury CI under 286 diagnostics whose
cures belong to a unit two waves away.

**Do not over-credit the flag** (row 16's own rider, carried forward): `PP-LEN`'s asymmetric failure —
X-longer → literal `NaN`; Y-longer → a syntactically perfect, silently mis-framed path — is catchable
**only by a unit test**, which is why G-9's seat exists at all.

#### 3.1.4 THE LINT FLOOR — landed, wired, and GREEN on its first run

**The bounds problem, stated before the cure.** A lint floor ordinarily costs two bytes this unit may
not write: a devDependency in `web/package.json` (reserved to unit *a*) and a config file at `web/`
(outside the writable set entirely). **Neither was written, and nothing was suppressed to avoid
writing them.** The floor is **oxlint**, which is zero-config by design, invoked through `npx` at an
**exact pin** — the idiom this repo already uses for its whole toolchain (`npx vue-tsc`, `npx vite`,
`npx playwright`), and the one the wave record names as the honest default.

**Wired** (FR-IC-25 — an unwired gate is an ornament), at **both** workflows:

| file | step | command |
|---|---|---|
| `ci.yml` | `Lint floor (X·F F.W0, G-7)`, `web-build` job, between Type-check and Build | `npx --yes oxlint@1.42.0 src e2e vite.config.ts playwright.config.ts` |
| `deploy-pages.yml` | `Lint floor (X·F F.W0, G-7)`, `deploy` job, after Type-check | identical |

**Why `deploy-pages.yml` too, and it is not belt-and-braces.** That workflow's `changes` gate admits
`github.event_name == 'workflow_dispatch'` **unconditionally** — a manual re-ship reaches the deploy
job with **no CI run behind it at all**. On that path the mirrored steps are the only place either
gate exists. (`deploy-pages.yml` is in this unit's writable set precisely so this hole could be
closed.)

**FIRST RUN, at the settled tree** — ⟨cmd⟩ (`web/`, double-run, identical both passes)
`npx --yes oxlint@1.42.0 src e2e vite.config.ts playwright.config.ts`
→ **`Found 18 warnings and 0 errors.`**, `141 files`, `90 rules`, **exit 0**.

**FLOOR SEMANTICS, STATED SO NOTHING READS AS MASKED.** The floor fails a job on a
**`correctness`-category ERROR**. It is **GREEN today (0 errors)** and fails the day one lands — which
is what a floor is. The **18 warnings are published in full below and routed**; not one is
suppressed, allowlisted, `eslint-disable`d or excluded by path. **Tightening to `--deny-warnings` is
F.W9/W10's act**, together with the `lint` npm script, per §6b: *"the lint script as a CI gate
(fr-PaperSidebar M7)"* is the W9/W10 half, and a `lint` script is a manifest byte this unit may not
write in any case. The two halves are disjoint by construction, not by convention.

**THE 18, ENUMERATED** (⟨cmd⟩ `… --format=unix`; **9** distinct files):

| rule | sites |
|---|---|
| `eslint(no-unused-vars)` | `labels.ts:20:18` · `:20:25` · `:85:18` · `:85:25` · `usePaperSearch.ts:10:10` · `contourEditing.ts:20:53` · `api.ts:5:5` · `useCoeffHover.ts:22:5` |
| `eslint(no-unused-expressions)` | `GalleryView.vue:128:5` · `ConvergencePlot.vue:197:9` · `:215:13` · `:229:9` |
| `eslint-plugin-unicorn(no-new-array)` | `svg-fourier.ts:39:40` · `:100:37` |
| `typescript-eslint(no-non-null-asserted-optional-chain)` | `e2e/workspace-flow.spec.ts:63:64` · `:107:64` · `:158:64` |
| `eslint-plugin-unicorn(no-useless-fallback-in-spread)` | `api.ts:124:9` |

**The two instruments are NOT the same instrument, and the coincidence of both yielding 18 is an
accident of arithmetic that this ledger refuses to let stand as a correspondence.** They overlap on
**7** rows (the `no-unused-vars` set minus `usePaperSearch`'s import, which both see) and diverge
everywhere else: the flags catch unused *type* imports the linter's default set does not
(`TS6196 AnimationSettings`), and the linter catches **11 rows the type gate cannot see at any flag
setting** — including **three `no-non-null-asserted-optional-chain` in `e2e/workspace-flow.spec.ts`**,
a correctness hazard **inside the e2e suite that no gate in this repo had ever read** until G-8's
widening put it in scope this same act. That is §3.2's thesis arriving as evidence rather than as
argument.

**WHAT THE FLOOR DOES *NOT* CATCH, SAID PLAINLY.** `FR-USB-21`'s `catch (e: any)` class is **not** in
the default `correctness` set. Re-measured here per §2.5.4 rather than inherited: ⟨cmd⟩
`/usr/bin/grep -rn 'catch *([a-zA-Z_]* *: *any)' src | /usr/bin/grep -c .` → **34**, across **7**
files — **the banked 34 is CONFIRMED at the settled tree** (the record's own correction UP from
"≥20" holds). The rule that would catch it is **`typescript/no-explicit-any`**, and ⟨cmd⟩
`npx --yes oxlint@1.42.0 -D typescript/no-explicit-any src e2e` → **49 errors** (the 34 catch-sites
plus 15 other `any` annotations). **It is deliberately NOT wired**: wiring it would land the floor
born-RED with 49 errors whose cures are F.W3/W4 deletions, and a floor that is red on the day it
lands blocks F.W1 for work that is not F.W1's. **Routed: cures F.W3/W4, tightening F.W9/W10.** The
gap is named here so no later wave mistakes the floor's green for coverage of the `: any` family.

### 3.2 G-8 — THE TYPE GATE NOW COVERS ITS OWN BUILD CONFIG AND ITS OWN SPECS

#### 3.2.1 The widening

`include` carried **4** entries and reached neither the build config nor the test suite (`PP-TSSCOPE`:
*"the only type gate never checks its own test suite or build config"*). It now carries **7** —
⟨cmd⟩ `node -p "JSON.stringify(require('./tsconfig.json').include)"` →
`["src/**/*.ts","src/**/*.d.ts","src/**/*.vue","env.d.ts","vite.config.ts","playwright.config.ts","e2e/**/*.ts"]`.
**One project, not a second**: a second project would need a second tsconfig, and `FR-EQR-30` books
that *"every `tsconfig.app.json` citation in the corpus is DEAD — web/ holds exactly one tsconfig"*.
Re-verified at this act: ⟨cmd⟩ `ls web/tsconfig*.json` → `tsconfig.json` alone. **Minting a second one
to satisfy a gate about scope would re-open the very citation class the corpus just closed.**

**The denominator is preserved.** ⟨cmd⟩ `ls e2e/*.spec.ts | /usr/bin/grep -c .` → **8**, unchanged by
this unit: G-9's keystone-route extension was authored **into an existing spec** rather than as a
ninth file, precisely so §2.2's **8**-spec denominator survives the act that touches the directory.
**A 7-spec figure remains FORBIDDEN** (§2.2.6), and a 9-spec figure is not created here.

#### 3.2.2 THE DELTA THE WIDENING EXPOSED — and it is the find, not the cost

⟨cmd⟩ `npx vue-tsc -b --force` at the widened scope (double-run, identical) → **20** diagnostics.
Decomposed by owner:

| # | origin | diagnostic | owner |
|---|---|---|---|
| 18 | `src/**` | the unused-code yield of §3.1.2 | **F.W3/W4** (deletions) |
| 1 | `src/components/paper/PaperView.vue(12,8)` | `TS2882` side-effect import of `@mkbabb/latex-paper/theme` | **F.W1/W2** — ruled at §2.6.1, pre-existing, **not** this unit's |
| 1 | `vite.config.ts(51,21)` | `TS2769` No overload matches this call | **F.W1** — see below |

**The `e2e` half is CLEAN: all 8 specs and `playwright.config.ts` type-check with ZERO diagnostics**,
and so do the two files this unit authored (§3.3). **The entire delta of the widening is one
diagnostic, and it is a real defect the scope gap had been hiding for the life of the repo.**

**AND IT IS `MISS-A7`, CONFIRMED AT THE TYPE LEVEL FOR THE FIRST TIME.** Row 7 books
*"`npm run build` is unrunnable at the pin (vite-8/manualChunks) — silently disabling every
build-based falsifier in all three challenge files across the whole family"*. The widened gate now
prints the mechanism verbatim:

> `Type '{ manualChunks: { "vendor-vue": string[]; … } }' is not assignable to type
> 'OutputOptions | OutputOptions[] | undefined'. … Object literal may only specify known properties,
> and '"vendor-vue"' does not exist in type 'ManualChunksFunction'.`

At the landed vite 8 pin, `output.manualChunks` accepts **a function only**; `vite.config.ts:50-59`
passes the record form (`vendor-vue` · `vendor-ui` · `vendor-math` · `vendor-paper` ·
`vendor-keyframes`). **`MISS-A7` was a build-time claim resting on an unrunnable build; it is now a
compile-time fact that any seat can reproduce in two seconds without a build.**

#### 3.2.3 THE RULING — the exclusion arm is DECLINED, with its reason

G-8 offers two arms: *"`vue-tsc -b` is green over the widened scope, **or** the exclusion is recorded
as a ruling with its reason."*

> **RULED: `vite.config.ts` IS NOT EXCLUDED.** Excluding the one file the widening found a defect in
> is an **allowlist** — it would make the gate green by deleting its only finding, which is the
> masking-fallback class this programme forbids outright and which `PP-TSSCOPE` exists to convict.
> The exclusion arm is for a scope that **cannot** be reached; this one was reached, and what it
> returned is evidence. **The file stays in scope and the diagnostic is ROUTED to its owner.**
>
> **The cure is `MISS-A7`'s and it is not writable from here**: `vite.config.ts` is not in this
> unit's writable set, the cure is the record-form → function-form migration of `manualChunks`, and
> it lands with **F.W1**'s build unblock, where the emitted-CSS falsifier the ruling-6 rider owes
> (§2.6.4) also lands. **No consumer-side patch, no `@ts-expect-error`, no narrowing cast was
> applied** — the diagnostic stands, visible, in CI.
>
> **FALSIFIER**: a vite 8 release whose `OutputOptions.manualChunks` accepts the record form again,
> or a measured run in which the widened scope emits this diagnostic for a reason other than the
> record/function shape. Neither holds at the settled tree.

**THE HONEST COMPILE READING, so no later wave reads a false green.** `npx vue-tsc -b --force` exits
**1** at the settled tree with the **20** diagnostics above. **It exited 1 before this unit ran too**
(§2.6.1 leg 3: one diagnostic, `TS2882`), and G-15(a) has already ruled that RED F.W1/W2's and handed
it over as F.W1's born-RED witness. **This unit did not inherit a green gate and does not hand one
on.** What it hands on is a gate that now **sees** three classes it was blind to — unused code, the
build config, the test suite — with every finding enumerated and owned. **G-8's SCOPE limb is
discharged; its compile limb is RED with two externally-owned diagnostics, and this ledger says so
rather than choosing the reading that flatters the seat.**

### 3.3 G-9 — THE UNIT-RUNNER SEAT (and the FLOOR is F.W9's, not this wave's)

**R-5, declared identically at both ends**: **F.W0's G-9 owns the SEAT** — a runner installed, wired
into `ci.yml`, inside G-8's type scope, with **ONE asserting spec** proving it live — and **F.W9's
`G-F9-1` owns the FLOOR** (the spec population and its thresholds). *The seat is a precondition of
the floor, never a down payment on it, and neither gate may be discharged by the other's evidence.*
**This section claims the seat and nothing else. It is explicitly NOT green-by-coverage, and the one
spec below may not be cited as coverage by any wave.**

#### 3.3.1 The declared bounds question, ANSWERED — a runner that needs no manifest byte

The wave record raises this at open rather than leaving it to an implementer: G-9's word is *"a runner
is **installed**"*, and a vitest devDependency is a `web/package.json` byte reserved to unit *a*.
**The answer is a runner that is already installed: Node's built-in test runner.**

| G-9 clause | how it is met | receipt |
|---|---|---|
| *a runner is installed* | it ships with the Node both workflows already provision (`actions/setup-node@v4`, `node-version: "22"`) — nothing to add to any manifest | `node --test`, core since Node 18; `--experimental-strip-types` since 22.6 |
| *wired into `ci.yml`* | step **`Unit-runner seat (X·F F.W0, G-9)`** in `web-build`, and mirrored in `deploy-pages.yml` for the `workflow_dispatch` hole (§3.1.4) | `run: node --test --experimental-strip-types e2e/unit/figure-dimensions.unit.ts` |
| *inside G-8's type scope* | the spec is `.ts` under `e2e/**/*.ts`, which §3.2.1 put in `include`; its only imports are `node:test` + `node:assert/strict`, typed by `@types/node` — **already in the lock**, so the scope resolves with zero installs | ⟨cmd⟩ `npx vue-tsc -b --force` → the spec contributes **0** of the 20 diagnostics |
| *ONE asserting spec* | one file, one `test()` | `web/e2e/unit/figure-dimensions.unit.ts` |

**ZERO manifest bytes were written, and no escalation was needed.** ⟨cmd⟩ `git status --porcelain`
shows `web/package.json` and `web/package-lock.json` **absent from this unit's diff** at every commit.

**ROUTED, not concealed**: when **F.W9** lands the floor it lands a manifest transaction with it and
may re-home these assertions onto vitest plus a component harness — which is the runner the floor
will want, since `R-20` proves the `SliderControl` class needs a *component* test. **The seat proved
the ground; it does not pick the floor's runner**, and F.W9 is free to replace it wholesale without
re-arguing whether a unit runner can exist here.

#### 3.3.2 The ONE asserting spec — what it asserts, and where it lives

`web/e2e/unit/figure-dimensions.unit.ts`. Subject: `src/lib/figureDimensions.ts`, a leaf module with
no imports whose exported table is a **`Record<string, readonly [number, number]>`** — the exact
loose-`Record` shape row 16 names, where an index read type-checks as non-optional because
`noUncheckedIndexedAccess` is unset. **The flag that would express the invariant is deferred by §3.1.3,
so the invariant is asserted instead** — which is the seat earning its place on its first day rather
than asserting `true === true`.

⟨cmd⟩ (double-run, `web/`) `node --test --experimental-strip-types e2e/unit/figure-dimensions.unit.ts`
→ `✔ figure dimensions are well formed and hasModernVariants answers the map` · `pass 1` · `fail 0` ·
**exit 0**, both passes.

**WHY IT LIVES UNDER `e2e/`, disclosed rather than rationalised**: `web/e2e/` is the **only writable
source directory** in this unit's bounds. It is a home of convenience, and F.W9 should move it.
**It does not disturb the e2e suite**: Playwright's default `testMatch` is
`**/*.@(spec|test).?(c|m)[jt]s?(x)` and the file is `.unit.ts`. Proved, not assumed —
⟨cmd⟩ `npx playwright test --list | /usr/bin/grep -c 'figure-dimensions'` → **0**, and
⟨cmd⟩ `npx playwright test --list | tail -1` → **`Total: 69 tests in 8 files`** (68 before this unit;
**+1 is the keystone of §3.3.3, and the file count stays 8** — §3.2.1's denominator survives).

#### 3.3.3 The axe keystone-route extension — AUTHORED, not run

Row 19 (`R-3` axe-keystone rider, `fr-SliderControl` = D-4, ⊕ `D-i1`): the axe keystone set does not
reach the equation route — *"the only route where SliderControl's `subtitle` renders"* — and F.W0
lands **only** the keystone-route extension plus the corrected justification text.

**THE ROUTE-SPELLING DRIFT, RECORDED AND NOT SILENTLY ADOPTED (a D-19 instance inside a gate
clause).** Row 19 and §4 G-9 both spell the route **`/equations`**. The live router declares
⟨cmd⟩ `/usr/bin/grep -n 'path: "/equation"' web/src/router/index.ts` → **`92:            path: "/equation",`**
(name `equation`), and there is **no `/equations` record**. **The INTENT is taken at the true bytes**:
the keystone addresses **`/equation`**. Per §2.1's law the divergence is minuted here rather than
followed raw — a seat following the banked spelling would have authored a keystone against a route
that 404s, which is exactly the *"lands OUTSIDE the file"* failure the anchor table exists to prevent.

**The gap is re-verified, not inherited.** ⟨cmd⟩ `/usr/bin/grep -rn 'subtitle'
src/components/equation/FunctionInput.vue` → **`:182`** *"terms in the Fourier sum"* and **`:215`**
*"shown in expanded (a+b) view"*, both on `<SliderControl>`; `SliderControl.vue:69` renders
`<span class="slider-subtitle">` only when that prop is passed; nothing on `/visualize` passes it.
**The banked gap holds at the settled tree.**

**LANDED**: `web/e2e/visualization-ux.spec.ts` — **Keystone 5, `keystone: /equation is a11y-clean`**,
armed (`test(...)`), settling on `networkidle` plus the rendered `.slider-subtitle` rather than a
blind timeout, then the file's existing `checkA11y` helper (zero serious/critical axe violations
across `wcag2a/2aa/21a/21aa`).

- **ARMED, NOT `fixme`.** A brand-new gate born `test.fixme` is the defect row 19 books, and a
  `skip`/`fixme` around an unmeasured surface is a masking fallback. It is armed.
- **AUTHORED, NOT RUN — as the spec directs**, and the residual is stated rather than hidden: this
  seat did **not** execute it (it needs a live backend + vite server, and row 19 forbids landing work
  on a tree F.W1 is about to move). **Its first execution is CI's, and its outcome is UNMEASURED at
  this seat.** If it fails there, the finding is a real `/equation` a11y defect and is F.W3/W4's — the
  gate will have done its job on its first outing. **Routed as such.**
- **Un-`fixme`-ing `fr-BasisSelector` B-3 at `:133` is NOT performed here** — row 19 routes that
  four-test operation to F.W3/W4, and no existing `test.fixme` state was changed by this unit.

#### 3.3.4 THE CORRECTED JUSTIFICATION TEXT — the 4.0.0 `inert` truth, measured

Row 19 requires the keystone prose *"corrected to the **4.0.0 `inert`** truth"*; the banked complaint
is that *"the only a11y gate over ContourSettings is a `test.fixme` resting on a premise FALSE at the
installed pin."* The stale premise appeared at **four** sites — ⟨cmd⟩ (at open)
`/usr/bin/grep -rn '\^2\.0\.0\|\^2→\^3' e2e/` → `visualization-ux.spec.ts:104` · `:105` · `:131` ·
`:190` and `visualization-crud.spec.ts:623` · `:625` — all reading, in substance, *"the app consumes
the PUBLISHED `@mkbabb/glass-ui@^2.0.0`, so the fix is a glass-ui release (`inert` on the collapsed
layer) + a guarded `^2→^3` bump."*

**THE MEASURED TRUTH, this seat, 2026-09-17, at the ADOPTED bytes** (producer tree never touched;
`glass-ui` is READ-ONLY always):

| fact | ⟨cmd⟩ | value |
|---|---|---|
| declared consumer pin | `web/package.json` at the settled tree | **`^4.0.0`** |
| installed producer | `node -p "require('./node_modules/@mkbabb/glass-ui/package.json').version"` | **4.0.0** |
| `inert` in the adopted dist | `/usr/bin/grep -c 'inert' node_modules/@mkbabb/glass-ui/dist/glass-ui.js` | **0** |

**Both halves of the old premise are false, and the second is the interesting one: the bump the prose
was waiting for ALREADY HAPPENED, and it did not carry the fix.** The collapsed layer still omits
`inert` at 4.0.0, so the unblock condition is **a producer release that actually ships it** — a
glass-ui BH relay item — **never another bump, and never a consumer-side patch (SS-6)**. All four
sites now say that, with the `grep -c … → 0` receipt inline at two of them. **No `test.fixme` state
was touched**: the prose is corrected so that when F.W3/W4 re-arms, the justification it re-arms
against is true.

### 3.4 `allowImportingTsExtensions` — a disclosed consequence of the seat, not a smuggled flag

The seat spec imports `../../src/lib/figureDimensions.ts` **with its extension**, because Node's ESM
loader resolves no extensions and TypeScript's `bundler` resolution rejects a `.ts` specifier without
this flag. **It is a permission, not a requirement**: it forbids nothing that was previously legal, no
existing import was rewritten, and Vite resolves explicit `.ts` specifiers natively. It is disclosed
here because it is the **third** new `compilerOptions` key (§3.1.1) and a later seat counting
"G-7 added two flags" against a 16-key file would otherwise find an unexplained third. **The
alternative was a seat spec that imports nothing and asserts nothing real, which is an ornament.**

### 3.5 This unit's gate reading, and what it routes

| gate | BEFORE (open baseline) | AFTER (this unit's close) |
|---|---|---|
| **G-7** | **RED** — 13 compilerOptions, **0-of-3** flags; `scripts` has no `lint`; no eslint/prettier in either dep block | **GREEN.** `noUnusedLocals` + `noUnusedParameters` set and wired by construction into both workflows' `vue-tsc`; `noUncheckedIndexedAccess` **DECIDED — deferred as an `M-10` rider with `BasisKey`/`normalizeBasisKey` named as its consumer** (§6a lock 7 honoured; the 286/35 sizing measured and published); a **lint floor landed, wired into `ci.yml` AND `deploy-pages.yml`, first run 0 errors / 18 warnings / 141 files, exit 0**. First-run yield of the unused-code gate **measured 18/14 against the predicted 16/12 — divergence MINUTED, not adopted**, with all 18 enumerated and routed |
| **G-8** | **RED** — `include` 4 entries; `vite.config.ts`, `playwright.config.ts` and all 8 specs outside `vue-tsc -b` entirely | **GREEN on the scope limb, with the compile residue RULED and ROUTED.** `include` 4 → 7; all 8 specs + `playwright.config.ts` type-check **CLEAN**; the widening's entire delta is **one** diagnostic, `vite.config.ts(51,21) TS2769`, which is **`MISS-A7` confirmed at the type level**. **The exclusion arm is DECLINED with its reason** (excluding the only finding is an allowlist). **Compile limb RED with 20 diagnostics, every one externally owned**: 18 → F.W3/W4, `TS2882` → F.W1/W2 (already ruled at §2.6.1), `TS2769` → F.W1. The 8-spec denominator is preserved |
| **G-9** | **RED** — no unit runner in `scripts`, `vitest` in neither dep block; axe keystone set never reaches the equation route | **GREEN.** The **SEAT** stands: Node's built-in runner (installed by construction, **zero manifest bytes**), wired into both workflows, **inside G-8's type scope** (contributes 0 diagnostics), **ONE asserting spec** passing double-run at exit 0 and **not collected by Playwright** (69 tests / **8** files). The axe keystone-route extension is **AUTHORED (not run)** against **`/equation`** — the banked `/equations` spelling is a recorded drift, INTENT taken at the true bytes — and the justification prose at **all four stale sites** is corrected to the measured 4.0.0 `inert` truth (**`grep -c 'inert' … → 0`**). **Explicitly NOT green-by-coverage; F.W9's `G-F9-1` FLOOR is untouched and undischarged** |

**Routing — nothing dropped:**

| item | routed to |
|---|---|
| The **18** unused-code findings (enumerated, §3.1.2) — deletions | **F.W3/W4** (§7b: land the gate, let it drive; no hand-fix here) |
| `noUncheckedIndexedAccess` + its **286/35** transaction | **F.W3/W4**, as the `M-10` `BasisKey` + `normalizeBasisKey` + `satisfies` unit; **WAVE-LOCK carried**: no `basisFilter` wiring without the normaliser (`gallery.ts:38` repeats the widening) |
| `vite.config.ts(51,21) TS2769` — the record→function `manualChunks` migration | **F.W1**, with the `MISS-A7` build unblock (and the ruling-6 emitted-CSS falsifier it gates, §2.6.4) |
| `PaperView.vue(12,8) TS2882` | **F.W1/W2** — already ruled and handed over at §2.6.1; **re-stated, not re-booked** |
| The **18** lint-floor warnings (enumerated, §3.1.4) | **F.W3/W4** for the cures; **F.W9/W10** for `--deny-warnings` + the `lint` npm script (§6b) |
| `FR-USB-21`'s `catch (e: any)` — **34** sites / **7** files, re-measured and confirmed; `-D typescript/no-explicit-any` → **49** errors | **F.W3/W4** cures · **F.W9/W10** tightening. **Deliberately NOT wired now**, reason at §3.1.4 |
| The **seat's home** (`web/e2e/unit/`) and its runner choice | **F.W9** — free to re-home onto vitest + a component harness with the manifest transaction the floor needs |
| **Keystone 5's first execution** (authored, not run — outcome UNMEASURED here) | **CI**, then **F.W3/W4** if it surfaces an `/equation` a11y defect |
| The glass-ui `inert` absence at the adopted 4.0.0 dist (`grep -c` → **0**) | **glass-ui BH relay** — a producer act. **No consumer patch** (SS-6); the three `fixme` keystones stay booked with corrected prose |
| Un-`fixme`-ing `fr-BasisSelector` B-3 `:133` (four-test operation) | **F.W3/W4** — row 19; not performed here |
| The **16/12 vs 18/14** divergence's cause (pre-land toolchain vs post-land) | **unresolved by design** — its falsifier needs a second tree and §2c forbids a worktree; the measurement stands, the prediction is retired to the forbidden-figure register |

**Escalations: none.** No §7a trigger fired. In particular **the declared bounds question did not
become one**: all three of G-9's clauses were met without a `web/package.json` or `package-lock.json`
byte, so the ESCALATE-rather-than-expand branch never opened.

**Law compliance at this seat**: **no write outside the writable set** — ⟨cmd⟩ `git status --porcelain`,
taken immediately before this unit's commit, listed exactly `web/tsconfig.json` · `.github/workflows/ci.yml` ·
`.github/workflows/deploy-pages.yml` · `web/e2e/visualization-ux.spec.ts` ·
`web/e2e/visualization-crud.spec.ts` · `web/e2e/unit/` · this ledger, and nothing else ·
**`web/package.json` and `web/package-lock.json` untouched** (§2b) · **no `web/src/**` byte written** —
every deletion the gates found is routed, none performed · **no `node_modules` patched**, `glass-ui`
read **only** to measure `inert` · **no masking**: no `test.skip`/`test.fixme` added, no
`eslint-disable`, no `@ts-expect-error`, no `try/catch` around a defect, no path allowlisted out of a
gate — the exclusion arm G-8 offers was **declined in writing** · **no hand-formatting** (§7b): the
only edits to existing files are the mandated comment-prose corrections and the two workflow steps ·
**no `git add -A`, no `git stash`, no `reset --hard`, no `checkout --`, no force-push** ·
`value.js/scripts/dev/dev.sh` never touched, never staged · pathspec commits only · no cron ·
`execution/LEDGER.md` untouched (its F.W0 row is the wave seat's) · **every published figure
double-run at the settled bytes**, and the one figure this seat could not make agree with the record
(16/12) is **published as a divergence rather than conformed to**.

---

### 3.6 Addendum-beside — the one published §3 figure that does not reproduce (dated 2026-09-17)

**SERVED MODEL: claude-opus-5[1m]** · second F.W0.c seat · re-verification pass over §3's own bytes,
run at `b3b736c` with ⟨cmd⟩ `git status --porcelain | wc -l` → **0**.

**E-3: §3.1.4 and §3.5 are NOT patched.** They stand exactly as the first seat wrote them. This
section is beside them, and it is the correction of record for the one figure below.

#### What was re-measured, and what held

Every load-bearing §3 figure was re-run at the settled bytes, on the pinned toolchain, double-run:

| §3 claim | published | re-measured 2026-09-17 | verdict |
|---|---|---|---|
| `compilerOptions` / `include` entries | 16 / 7 | 16 / 7 | **EXACT** |
| `noUnusedLocals` · `noUnusedParameters` | set | `true` · `true` | **EXACT** |
| `noUncheckedIndexedAccess` | DEFERRED (absent) | absent from the 16 | **EXACT** |
| lint floor result | `18 warnings, 0 errors`, exit 0 | `Found 18 warnings and 0 errors.`, exit **0** | **EXACT** |
| lint floor **file count** | **`141 files`** | **`142 files`** | **DIVERGENT — corrected below** |
| widened `vue-tsc -b --force` | 20 diagnostics | **20** | **EXACT** |
| unused-code first-run yield | 18 findings / 14 files | **18 / 14** (18 `TS6133`/`TS6196` lines over 14 distinct column-1 paths) | **EXACT** |
| the seat | `pass 1 · fail 0`, exit 0 | `pass 1 · fail 0`, exit **0** | **EXACT** |
| seat not collected by Playwright | 69 tests / 8 files, 0 hits | **`Total: 69 tests in 8 files`**, `grep -c figure-dimensions` → **0** | **EXACT** |
| Keystone 5 armed, `/equation` | `test(...)`, not `fixme` | `visualization-ux.spec.ts:247` = `test("keystone: /equation is a11y-clean", …)` | **EXACT** |
| `inert` at the adopted dist | 0 | **0**; installed `4.0.0`, declared `^4.0.0` | **EXACT** |
| manifest bytes in the commit | none | ⟨cmd⟩ `git show b3b736c --name-only --format= \| /usr/bin/grep -c 'package.json\|package-lock.json'` → **0** | **EXACT** |

#### The divergence, and its cause PROVED rather than guessed

⟨cmd⟩ `npx --yes oxlint@1.42.0 src e2e vite.config.ts playwright.config.ts` — the exact command §3.1.4
publishes — returns, double-run byte-identical at the settled bytes:
**`Finished in 25ms on 142 files with 90 rules`**. §3.1.4 and §3.5 both print **`141 files`**.

The cause is not inferred. It is isolated by a controlled falsifier, one variable moved:

⟨cmd⟩ `npx --yes oxlint@1.42.0 --ignore-pattern 'e2e/unit/**' src e2e vite.config.ts playwright.config.ts`
→ **`Found 18 warnings and 0 errors.` … `on 141 files`**.

**`141` is the linted set WITHOUT the seat file.** Corroborated by census: ⟨cmd⟩
`find src e2e -type f \( -name '*.ts' -o -name '*.vue' -o -name '*.js' -o -name '*.tsx' -o -name '*.mjs' -o -name '*.cjs' \) | wc -l`
→ **140**, plus the two named configs = **142**; less `e2e/unit/figure-dimensions.unit.ts` = **141**.

So the floor's first run was taken **before the seat file landed**, and the post-commit re-run
(§3's act 12) re-stated only `0 errors / 18 warnings` — never the file count. A figure measured at one
tree was published against another. **This is the WRITE-THEN-MEASURE failure mode, on this seat's own
bytes**, and §3's closing sentence — *"every published figure double-run at the settled bytes"* — is
false for exactly one figure, which is the sentence's own counter-example. Recorded, not smoothed.

#### Gate impact: NONE, and why that is a measurement rather than a reassurance

G-7's GREEN criterion is a floor that is **runnable, wired, and exits 0** — `exit 0` and `0 errors`
both reproduce exactly. The file count is context, not criterion. Further, the two runs above return
**the identical `18 warnings / 0 errors`** with and without the seat file, which measures the thing
that would otherwise be assumed: **the seat file is lint-clean, so its omission from the count could
not have hidden a finding.** The divergence is a bookkeeping defect in a published integer, not a
gate flip, and it is stated as such only because the falsifier says so.

#### Register

**`141 files` joins the forbidden-figure register beside `16 findings / 12 files` (§3.1.2).** It may
not be quoted downstream as the lint floor's file count at this tree. **The figure of record is
`142 files`**, under the committed command, at `b3b736c`. No other §3 figure is disturbed.

---

## §4 — F.W0.d: THE MANIFEST GATE, AUTHORED — and its born-RED facts, measured, dated and branch-stamped

**Unit F.W0.d · 2026-09-17 · seat model `claude-opus-5[1m]`.**

**Authority**: F-W0 §4 **G-6** whole, including the **R-4a** re-cut and **both** GREEN halves · **§6a
lock 5** (*"G-6 is a PRECONDITION-CHECK, not a landing"*, conditioned on G-1's ruled branch) · §3 rows
**8** (`fr-PaperSearchInput MISS-LC2`) · **9** (`fr-EqCoefficientsPanel FR-EQC-7`) · **10**
(`fr-AppHeader FR-AH-33`) · **11** (`fr-GalleryFeaturedCarousel FR-GFC-7`) · **12**
(`fr-AdminFlaggedPanel FR-AFP-55`) · **14** (`fr-EquationResult FR-EQR-30`) · **34**
(`fr-GalleryView FR-GV-28`) · **35** (`fr-EquationResult FR-EQR-24` ≡ `fr-UserSlugBar FR-USB-22`) ·
**§7**'s unit row · **§7b** verification artefacts · **§8**'s two excluded lines (the DECLARE+LOCK
landing; the `cva`/`clsx`/`reka-ui` deletion). Wave record:
`value.js/docs/tranches/X/execution/C/F-W0.md`.

### 4.0 The substrate, the branch stamp, and the bound this unit does not cross

Every figure below is read from the tree at ⟨cmd⟩ `git rev-parse --short HEAD` → **`edee6bf`**, branch
`m/w1-bump-migration`, with ⟨cmd⟩ `git status --porcelain | wc -l` → **0**. Every published figure is
**double-run** and both passes returned byte-identical output.

**BRANCH STAMP — `BRANCH = LAND`.** §6a lock 5 conditions this entire gate on G-1's ruled branch, and
G-1 ruled **LAND** under §0j.D's `OG-F1` (FREEZE-WITH-ADOPTION **and** WORKTREE-AS-BASELINE), landing
the 27 ` M` paths at **`1193003`** (§1). **The measurements below therefore stand against the LANDED
4.0.0 manifest**, and the ABANDON arm did not fire. The counterfactual is recorded once so no later
seat re-derives it: had the branch been ABANDON, the operand would have been the committed **3.1.0**
manifest at `cd26c65` — ⟨cmd⟩ `git show cd26c65:web/package.json | /usr/bin/grep -E
'glass-ui|keyframes\.js|value\.js'` → `"@mkbabb/glass-ui": "^3.1.0"` · `"@mkbabb/keyframes.js":
"^2.2.0"` · `"@mkbabb/value.js": "^0.10.0"` — **and the gate would have transferred to F.W1
unchanged. No F.W0 exit criterion moves either way.**

**The manifest has not moved since the LAND set.** ⟨cmd⟩ `git diff --stat 1193003 HEAD --
web/package.json web/package-lock.json` → **empty** (0 lines). Units *b*, *e* and *c* wrote no
manifest byte, as each of their sections records, so the bytes measured here are the bytes G-1 landed.

**Writable set, hard**: this ledger (append) ·
`value.js/docs/tranches/V/megatranche/formation/fourier/lane-frontend.md` **DATED ERRATA ADDENDUM
ONLY**. **NOT writable, and the bound is the gate's whole shape rather than an incidental fence**:
`web/package.json` · `web/package-lock.json` — F-W0 §2b is categorical (*"unit **d** writes no
manifest byte and is now doc-only"*). **Zero manifest bytes were written by this seat.**
`fourier/web/DESIGN.md` is **not a §2a row**: its contradiction is recorded here and in the
`lane-frontend` addendum, and **no `DESIGN.md` byte was written** (§8's bounds note — ESCALATE rather
than write outside §2a; the escalation branch did not open, because no `DESIGN.md` byte is owed for
the correction to be complete).

---

### 4.1 THE MANIFEST GATE — the text, as F.W1 receives it

> **THE MANIFEST GATE (G-6), AUTHORED AT X.F.W0 BY UNIT *d*, 2026-09-17, `BRANCH = LAND`.**
>
> **`web/package.json` and `web/package-lock.json` must describe the graph the app actually
> evaluates.** The gate is satisfied when, and only when, **one atomic transaction** moves every
> runtime-reached package into `dependencies`, declares and locks every REQUIRED producer peer the
> app's import graph reaches, and removes the two rows measured dead — after which
> **`npm ci --omit=dev` exits 0 and the entry graph evaluates without a module-eval throw.**
>
> **The transaction is F.W1's, not F.W0's** (R-4a). It lands as limbs of **F-W1 §4 Sequencing,
> intra-wave step 4** — the **TWELVE-limb** roster, *cited whole and never restated here* — with
> **FR-EQC-7's `vaul-vue` gate INSIDE it** per **F-W1 §4's cross-edge 1**. **F.W0 authors this gate
> and measures its born-RED facts; it writes no manifest byte, and it claims no credit for the
> landing** (the FR-GIG-5 bar). **The `npm ci --omit=dev` run is F.W1's and cannot halt this wave**
> (§7a).

#### 4.1.1 (i) THE FOUR BORN-RED FACTS — measured at the landed 4.0.0 manifest, dated, branch-stamped

**FACT 1 — the two dependency blocks, as landed.** ⟨cmd⟩ `node -p` over `web/package.json`, double-run:
**`dependencies` = 11 · `devDependencies` = 15.**

| block | members, at the landed manifest (`edee6bf` ≡ `1193003`) |
|---|---|
| **`dependencies` (11)** | `@mkbabb/glass-ui@^4.0.0` · `@mkbabb/keyframes.js@^4.3.0` · `@mkbabb/latex-paper@^0.2.1` · `@mkbabb/pencil-boil@^0.4.1` · `@mkbabb/value.js@^0.13.0` · `@vueuse/core@^14.3.0` · `katex@^0.17.0` · `pinia@^3.0.4` · `tw-animate-css@^1.4.0` · `vue@^3.5.38` · `vue-router@^5.1.0` |
| **`devDependencies` (15)** | `@axe-core/playwright@^4.11.3` · `@playwright/test@^1.61.0` · `@tailwindcss/postcss@^4.3.1` · **`@types/katex@^0.16.8`** · `@types/node@^25.9.3` · `@vitejs/plugin-vue@^6.0.7` · **`class-variance-authority@^0.7.1`** · **`clsx@^2.1.1`** · **`lucide-vue-next@^1.0.0`** · **`reka-ui@^2.9.10`** · **`tailwind-merge@^3.6.0`** · `tailwindcss@^4.3.1` · `typescript@^6.0.3` · `vite@^8.0.16` · `vue-tsc@^3.3.5` |

**The fold witness's NAME SETS reproduce EXACT** — all 11 dependency names and all 15 devDependency
names are the ones F-W0 §4 G-6 enumerates, in the same membership, with no addition and no omission.
**Only the VERSIONS moved, and that is the LAND branch's content**, not a divergence: the M.W1a bump
G-1 landed is what carries `glass-ui ^3.1.0 → ^4.0.0`, `keyframes.js ^2.2.0 → ^4.3.0`,
`value.js ^0.10.0 → ^0.13.0` and the toolchain rows. **The five bolded runtime devDeps are FACT 3's
subject; `@types/katex` is row 14's.**

**FACT 2 — `vaul-vue`, `@lucide/vue` and `embla-carousel-vue` are in NEITHER block.** Three separate
membership probes over the landed manifest, each returning `false` for both blocks, double-run:

| package | in `dependencies`? | in `devDependencies`? | on disk in `web/node_modules`? | glass-ui 4.0.0 peer class |
|---|---|---|---|---|
| `vaul-vue` | **false** | **false** | **present, 0.4.1** | **REQUIRED** |
| `@lucide/vue` | **false** | **false** | **present, 1.20.0** | **REQUIRED** (`^1.16.0`) |
| `embla-carousel-vue` | **false** | **false** | **present, 8.6.0** | **OPTIONAL** (`peerDependenciesMeta`) |

The peer classes are **cited, not re-derived**: §2.3.3 publishes the 14-peer / 7-optional / 7-required
start state, and this gate consumes it.

**FACT 3 — the lock holds ZERO entries for the two required peers, and marks all five runtime
packages `"dev": true`.** ⟨cmd⟩ over `web/package-lock.json` (`lockfileVersion` 3, **195** package
entries), double-run:

| probe | reading |
|---|---|
| `node_modules/vaul-vue` entries | **0** |
| `node_modules/@lucide/vue` entries | **0** |
| `node_modules/embla-carousel-vue` entries | **0** |
| `class-variance-authority` | present, `0.7.1`, **`"dev": true`** |
| `clsx` | present, `2.1.1`, **`"dev": true`** |
| `lucide-vue-next` | present, `1.0.0`, **`"dev": true`** |
| `reka-ui` | present, `2.9.10`, **`"dev": true`** |
| `tailwind-merge` | present, `3.6.0`, **`"dev": true`** |

The zero-entry probes are stated in the spec's own grep idiom as well, and agree:
⟨cmd⟩ `/usr/bin/grep -c '"node_modules/vaul-vue"' package-lock.json` → **0**;
⟨cmd⟩ `/usr/bin/grep -c '"node_modules/@lucide/vue"' package-lock.json` → **0**.

**FACT 4 — therefore `npm ci --omit=dev` FAILS TODAY.** All five packages the shipped source and the
installed producer actually evaluate are `"dev": true` in the lock, so an `--omit=dev` install does
not write them; three of the five are **REQUIRED glass-ui peers** (§2.2.3: `reka-ui` **40**
dist-importers, `class-variance-authority` **11**, `clsx` **2** via `dist/cn-DJXf4yaB.js`), and
`lucide-vue-next` is named by vite's production `vendor-ui` chunk at `vite.config.ts:52`. **This
sentence is a derivation from FACT 3, not a transcript**: the `npm ci --omit=dev` RUN is F.W1's
(R-4a), and **no such transcript is F.W0's** (§7b, verbatim). The proof obligation F.W0 carries is the
measurement; the proof obligation F.W1 carries is the exit code.

**The chain that makes FACT 4 a failure rather than a warning, measured at this seat, double-run** —
the `button` chunk is the app's most-used surface (**35** of its `@mkbabb/glass-ui/button` subpath
imports) and it reaches all three required peers in two hops:

- `dist/button-BNDWhAZb.js:1` → `import { t as e } from "./cn-DJXf4yaB.js";`, then `:3` →
  `import { Primitive as l } from "reka-ui";` and `:4` → `import { cva as u } from
  "class-variance-authority";`
- `dist/cn-DJXf4yaB.js:1` → `import { clsx as e } from "clsx";`

**That is the button-chunk → `cn` → clsx chain, read at the bytes rather than asserted** — and it is
the reason §4.1.4's correction is a gate clause and not a tidy-up.

#### 4.1.2 (ii) THE PRESCRIBED TRANSACTION — named here in full, landed by F.W1

**Six limbs. They land together, inside F-W1 §4 Sequencing intra-wave step 4's TWELVE-limb roster, or
not at all** — an `--omit=dev` install that acquires four of the five runtime packages still throws.

| # | limb | warrant (measured) | owner |
|---|---|---|---|
| **T-1** | **Move the five runtime packages from `devDependencies` to `dependencies`**: `class-variance-authority` · `clsx` · `lucide-vue-next` · `reka-ui` · `tailwind-merge` **minus T-2's deletion** ⇒ the four that move are `cva` · `clsx` · `lucide-vue-next` · `reka-ui` | FACT 3 + FACT 4; §2.2.3's dist-importer denominators | **F.W1** |
| **T-2** | **Delete `tailwind-merge` — ALONE.** | **0** `src/` sites **and 0** glass-ui 4.0.0 `dist/` importers; its only surviving mentions are doc comments — `dist/utils/cn.d.ts`'s rationale prose (*"We replace twMerge with a hand-rolled deduplicator…"*), `README.md`, and two CSS comment sites. Doc-comment-only, exactly C-5's narrowing | **F.W1** |
| **T-3** | **`vaul-vue` declared + locked** — **OR** the barrel→subpath retirement landed (rows 34/35) so **no edge needs it**. §4.1.3 measures which arm is available today. | FACT 2 + FACT 3; `dist/glass-ui.js:60` is a **static** `vaul-vue` import (⟨cmd⟩ `/usr/bin/grep -n 'vaul-vue' dist/glass-ui.js` → `60:`) reached through **7** root-barrel edges | **F.W1** (`FR-EQC-7` fires INSIDE the transaction, per F-W1 §4 cross-edge 1) |
| **T-4** | **`@lucide/vue` declared AND present in the lock** | FACT 2 + FACT 3: a **REQUIRED** peer (`^1.16.0`) filed nowhere, on disk at 1.20.0, with **0** lock entries — *"a required peer filed NOWHERE"* (row 8). Reached through `dist/createLucideIcon-DydS2qgk.js` from **7** of the app's 20 live subpaths (§4.2) | **F.W1** |
| **T-5** | **Remove the dead `@types/katex` row** | `@types/katex@^0.16.8` is inert against `katex@0.17.0`, which **self-declares** `types/katex.d.ts`, under `tsconfig.json`'s `moduleResolution: "bundler"` — all three re-measured at the settled tree (row 14, `FR-EQR-30`) | **F.W1** |
| **T-6** | **Nothing else.** The transaction is closed at five packages plus the `@types/katex` row. | §4.1.5 | — |

**`@lucide/vue` and `lucide-vue-next` are two packages, not one spelling of one**, and T-1 and T-4
are therefore not redundant: `lucide-vue-next@^1.0.0` is the app's **own** direct import (**35** `src/`
files) and moves under T-1; `@lucide/vue@^1.16.0` is **glass-ui's required peer**, reached only
through the producer's chunk, and is declared under T-4. **The `@lucide/vue` RENAME of the app's 35
sites is NOT in this transaction** — §8 excludes it to F.W1 as a current debt riding the uplift
(row 10), and this gate neither pulls it forward nor blocks on it.

#### 4.1.3 T-3's OR-arm, MEASURED — the retirement is INCOMPLETE at glass-ui 4.0.0

Row 9 offers two cures and F.W1 elects between them. **This seat elects nothing; it measures which
arm is available**, because an alternative that does not resolve is not an alternative.

**The 7 root-barrel edges, enumerated quote-agnostically** — ⟨cmd⟩ `/usr/bin/grep -rnE "from
['\"]@mkbabb/glass-ui['\"]" src` → **7 occurrences over 7 distinct files** (double-run; the
quote-agnostic form is load-bearing — a double-quote-only probe returns **6** and drops
`CollapsibleSection.vue`, which uses single quotes, and that file is one of the two row 9 names):

| # | edge | symbol imported | subpath that provides it | pulls `vaul-vue`? |
|---|---|---|---|---|
| 1 | `src/composables/useMorphConfig.ts:9` | `useClipboard` | **`./dom`** (live in the 80-key map) | **0** |
| 2 | `src/components/visualization/gallery/UserSlugBar.vue:5` | `useClipboard` | **`./dom`** | **0** |
| 3 | `src/components/equation/EquationResult.vue:4` | `useClipboard` | **`./dom`** | **0** |
| 4 | `src/components/ui/CollapsibleSection.vue:2` | `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` | **`./collapsible`** | **0** |
| 5 | `src/router/index.ts:2` | `supportsViewTransitions` | **`./motion-core`** | **0** |
| 6 | `src/components/visualization/gallery/AdminUserList.vue:4` | `Checkbox` | **NONE** | — |
| 7 | `src/components/visualization/gallery/GalleryCard.vue:5` | `Checkbox` | **NONE** | — |

**The finding: five of the seven edges retire cleanly; two cannot.** `Checkbox` is exported from the
root barrel in both runtime and types (`dist/glass-ui.js`; `dist/index.d.ts:7` =
`export * from "./components/ui/checkbox";`) **but from no subpath**: a scan of **all 75 `.js` targets
among the 80 export keys** finds `Checkbox` in **none** of them, and **`./checkbox` is not an export
key.** ⟨An earlier reading of this seat's own probe said `Checkbox` was absent from the root types
too; that was a literal-grep artefact against a star re-export, **caught and corrected before
publication**, and it is recorded rather than smoothed — the star re-export is why it resolves.⟩

**Consequence, stated as a sizing input and not as an election**: the barrel→subpath retirement, at
**glass-ui 4.0.0 as installed**, **cannot retire all seven edges**, and **any** surviving root-barrel
edge keeps `dist/glass-ui.js:60`'s static `vaul-vue` import in the graph. **So T-3's OR-arm is
incomplete today, and the declare+lock arm is the only arm that closes on the consumer side alone.**
The arm becomes complete the day the producer publishes a `./checkbox` (or equivalent) subpath — a
**producer-side ask**, which rides the glass-ui BH relay (§6b) and is **not** a frontend hack (FR-COB-8
S-4). **This seat SENDS nothing**: G-3 gates the sends and unit *b* holds that seat; this row is a
record for F.W1 and for whoever next writes the relay.

**Corroborating measurement, double-run**: of the app's **20** live subpath keys, **none** reaches
`vaul-vue`; a transitive closure over every export target finds `vaul-vue` in exactly **one** entry —
the root barrel `.`. **That is the whole of row 9's mechanism, re-proved at the adopted pin.**

#### 4.1.4 (iii) THE DEAD-DEVDEPS ERRATA ADDENDUM — landed in this wave's act, and where

**`cva` / `clsx` / `reka-ui` DELETION IS FORBIDDEN** (F-W0 §8, verbatim: *"**FORBIDDEN** — live
glass-ui runtime peers on the button-chunk→`cn`→clsx chain. Only `tailwind-merge` is genuinely
dead"*). The contradiction it corrects is `lane-frontend.md:70` / `web/DESIGN.md:33`, both of which
book the three for deletion as "dead devDeps".

**The correction is DISCHARGED, and it is cited at its home rather than re-booked** — the dedupe law
binds this seat as it binds every other. The addendum is **`lane-frontend.md` §LF9-1/LF9-2/LF9-3**,
dated **2026-09-17**, landed by unit *e* in this same wave and this same act-family under §6a lock 5,
carrying the four-row liveness table (`reka-ui` 40 / `cva` 11 / `clsx` 2 / `tailwind-merge` 0
dist-importers), the **MOVE-not-DELETE** verdict for the three, the sustained deletion of
`tailwind-merge` alone, and the `DESIGN.md:32 → :33` coordinate correction at all three inheriting
sites. **A second copy of that table would be a second operand, which is the defect class this
programme exists to kill.**

**What this unit adds beside it, because it is G-6's and not G-12's**, is a dated addendum-beside at
the same file: the **prescribed transaction whole** (T-1…T-6), the **three-package NEITHER-BLOCK fact
and the lock zeros**, and the **measured incompleteness of T-3's OR-arm** (§4.1.3) — none of which
LF9-1 carries, and all of which F.W1 needs to size the transaction rather than merely to avoid
deleting a live peer. **No byte of `lane-frontend.md` above the addendum line is edited; no
`web/DESIGN.md` byte is written by this wave at all**, and that bound is stated in both places so a
later seat does not read the silence as an omission.

**The standing rule this gate binds, in one line**: *a peer's liveness is a property of the INSTALLED
PRODUCER's import graph, never of the consumer's `src/`* — the denominator, not the integer (§2.2.3,
LF9-10).

#### 4.1.5 What is NOT in the transaction, and why — `embla-carousel-vue`

**`embla-carousel-vue` is NOT in G-6's set, and its absence is a ruling rather than an oversight.**
At glass-ui 4.0.0 it is an **OPTIONAL** peer (`peerDependenciesMeta`; §2.3.3's 7-optional list), so
**it cannot fail `npm ci --omit=dev`** — the exact condition the transaction is all-or-nothing about.
Folding an optional peer into an all-or-nothing transaction with two required peers **over-binds** it,
and declaring it here would declare a dependency with **zero importers** (row 11's own *"do NOT pull
the adoption forward"* forbids the importer). Its declaration is a **one-line convenience limb riding
the F.W3 `.d` carousel adoption**, per `F-W3.md` §X.1-v4 — **cited, not re-derived**. It remains a
**G-6 MEASURED FACT** (FACT 2's third row) and is **not a G-6 OPERAND**.

**Two further exclusions, named so the roster is closed**: the **`@lucide/vue` rename** of the app's
35 `lucide-vue-next` sites (§8 → F.W1, current debt) and **rows 34/35's import-hygiene arms** as
*cleanups* — row 34's two-path `Visualization` import (`GalleryView.vue:10` via `@/lib/types` vs
`gallery.ts:4` via the `@/lib/api` passthrough, the passthrough being the removable side) and row
35's root-barrel `useClipboard` sites. **They enter G-6 only as T-3's OR-arm**, which is what
§4.1.3 measures; as hygiene they are F.W1's, and row 35's **bundle-weight arm is killed in the
registry's own record and must not be re-argued** (`vendor-ui` is keyed on the package ROOT at
`vite.config.ts:52`, so the manualChunks split is indifferent to leaf-vs-barrel discipline).

---

### 4.2 Addendum-beside — the one inherited enumeration that does not reproduce at 4.0.0 (dated 2026-09-17)

**E-3: §2.3.3 is NOT patched, and neither is F-W0 §3 row 8.** Both stand exactly as written. This is
the correction of record for one clause inside them.

**The clause**: row 8, repeated at §2.3.3's `@lucide/vue` row — *"`createLucideIcon` is reached from
dock/select/configurator/dropdown-menu/collapsible/tabs"*.

**Re-measured at the adopted pin**, by transitive closure over the installed
`@mkbabb/glass-ui@4.0.0` export map (every `from "./…"` edge followed to fixpoint), double-run,
byte-identical:

| claim | re-measured | verdict |
|---|---|---|
| `dock` reaches `createLucideIcon` | yes | **EXACT** |
| `select` | yes | **EXACT** |
| `configurator` | yes | **EXACT** |
| `dropdown-menu` | yes | **EXACT** |
| `tabs` | yes | **EXACT** |
| **`collapsible`** | **NO** | **DIVERGENT — `./collapsible`'s closure does not contain `createLucideIcon-DydS2qgk.js` at 4.0.0** |
| *(unnamed in the clause)* `dialog`, `toast` | **yes, both** | **two reaching subpaths the enumeration omits** |

**The app's live reaching set is therefore SEVEN, not six, and its membership differs at two
names**: `configurator` · `dialog` · `dock` · `dropdown-menu` · `select` · `tabs` · `toast` — the
intersection of the **19** export keys whose closure reaches the chunk with the **20** subpath keys
the app imports live.

**Gate impact: NONE, and that is a measurement rather than a reassurance.** Row 8's conclusion is that
**a faithful `npm ci` yields module-eval throws**, and it needs only that *some* app-imported subpath
reaches the chunk while the lock carries **0** `@lucide/vue` entries. Seven do. The finding is
strictly stronger than the clause it corrects, so **T-4 is unmoved**. What is corrected is an
**enumeration**, and an enumeration that names a member it does not have is a defect at whatever
altitude it sits — particularly one later waves will grep for. **`collapsible` joins the
forbidden-figure register for this clause**: it may not be quoted downstream as a `@lucide/vue`
reach-site at glass-ui 4.0.0.

⟨Why this is an addendum and not a patch: `fr-PaperSearchInput.md` is E-1 immutable, F-W0 is a dated
spec under E-3, and §2.3.3 is another unit's banked writing in this same ledger. **The correction
lands beside all three and rewrites none of them.**⟩

---

### 4.3 This unit's gate reading, and what it routes

| gate | BEFORE (wave open) | AFTER (this unit's close) |
|---|---|---|
| **G-6** | **RED** — *"No gate text exists (`SUBSTRATE-LEDGER.md` absent)"*; the four born-RED facts unmeasured at this wave and unstamped by any branch | **GREEN (F.W0's half).** The gate exists as written text (§4.1); the four born-RED facts are measured, dated 2026-09-17, double-run, and **stamped `BRANCH = LAND`** (§4.1.1); the prescribed transaction is named in full for F.W1 (§4.1.2, T-1…T-6); the dead-devDeps errata addendum is discharged in this wave's act and cited at its home, with G-6's own half added beside (§4.1.4); `embla` is excluded with its reason (§4.1.5). **Zero manifest bytes written.** |

**The split is stated so no reader mistakes it** — F-W0 §4 G-6 publishes **two** GREEN halves and this
seat turns **one**. **F.W1's half** — the transaction landed, `npm ci --omit=dev` exiting 0, the entry
graph evaluating without a module-eval throw — **is neither green nor red at F.W0, and this unit
claims no credit for it** (FR-GIG-5). **The `npm ci --omit=dev` run is F.W1's and could not have
halted this wave** (§7a); none of the three §7a diagnostic-loop triggers fired, and the
branch-conditioned measurement set was produced on its **first** pass.

**Verification artefact (§7b)**: *"the G-6 gate text + its branch-conditioned measurements (no
`npm ci --omit=dev` transcript is F.W0's)"* — that artefact **is §4.1 of this ledger**, stored beside
the wave's other artefacts in the wave's single durable document, as §2a prescribes.

**Routing — nothing dropped:**

| item | routed to |
|---|---|
| The DECLARE+LOCK landing (T-1…T-5) | **F.W1** — limbs of F-W1 §4 Sequencing intra-wave step 4, with `FR-EQC-7`'s `vaul-vue` gate INSIDE it (cross-edge 1) |
| T-3's election (declare+lock **vs** barrel→subpath retirement) | **F.W1** — §4.1.3 measures the arms; F.W0 elects neither |
| The missing `./checkbox` subpath (what would complete the OR-arm) | **the glass-ui BH relay**, producer-side; recorded here, **not sent by this seat** (G-3 gates the sends; unit *b* holds the seat) |
| The `@lucide/vue` rename, 35 sites | **F.W1** (§8, current debt riding the uplift) |
| `embla-carousel-vue`'s declaration | **F.W3 `.d`**, riding the carousel adoption (`F-W3.md` §X.1-v4, cited) |
| Rows 34/35 as import hygiene | **F.W1**; row 35's bundle-weight arm is **dead in the registry's own record** and must not be re-argued |
| `web/DESIGN.md:33`'s own byte | **not this wave's** — `DESIGN.md` is not a §2a row; the correction lives in the ledger and the `lane-frontend` addendum |

**Escalations: none.** No §7a trigger fired. The one bounds question this unit carried — *"if a
`DESIGN.md` byte is genuinely owed, ESCALATE rather than write outside §2a"* — **was answered by
measurement rather than by judgement**: the contradiction is fully corrected by the two documents this
unit and unit *e* may lawfully write, so no `DESIGN.md` byte is owed and the escalation branch never
opened.

**Law compliance**: **no `package.json` / `package-lock.json` byte written** (§2b, categorical) · **no
byte under `web/src/`** · **no byte under `registry/adjudicated/`** (E-1) · **no in-place patch of
`lane-frontend.md`, `CENSUS-2026-08-03.md`, §2.3.3 or F-W0** (E-3 — every correction is a dated
addendum-beside) · **no `git stash`, no `reset --hard`, no `git add -A`, no force-push** · **pathspec
commits only**; `value.js/scripts/dev/dev.sh` **never touched and never staged** (§6a lock 9) ·
`../glass-ui` **READ-ONLY** — read for peer classes and import graphs, written never · **every
published figure double-run at the settled bytes**, and the one figure this seat got wrong on a first
reading is disclosed at §4.1.3 rather than silently corrected.

---

## §5 — F.W0.f: THE REACH RULING — F8-REACH-01 and F8-REACH-02, in one breath

**Unit**: `F.W0.f` · **gate**: **G-10** · **dated 2026-09-17** · SERVED MODEL: `claude-opus-5[1m]`.
**Substrate**: fourier `87ecc856`, branch `m/w1-bump-migration`, `git status --porcelain` → **empty**
at this unit's open. Producer read-only at `v8.0.0^{commit}` = `17a11bc5`; **installed** consumer pin
**4.0.0** (§2.3), which is the pin every producer fact below is measured at.

**Authority**: `F-W0.md` §4 **G-10** · §3 rows **3** · **4** · **26** · §2a's `InfoCard.vue`,
`CanvasOverlayButton.vue` and 8-lift-site rows · **§6a lock 3** (G-1 → G-11 → the lift) and **§6a
lock 6** (G-10 IS ONE COMMIT) · §6b the **F.W3/F.W4** row with **both** sweep-law riders · §7b's
archaeology and the five DELETE orders. Owner ruling: `COHESION.md` **§0j.D**. Same-commit family
restated at `EXECUTION-RUNBOOK.md` **§3.4**.

---

### 5.0 THE RULING — both rows, one breath (R-6)

> **`F8-REACH-01` (`web/src/components/equation/InfoCard.vue`) — DELETE.**
> **`F8-REACH-02` (`web/src/components/visualization/CanvasOverlayButton.vue`) — DELETE.**

Both are the exact verdict vocabulary the delta's HOLD column demands (*"exact `KEEP_WITH_MOUNT`,
`ISOLATED_HARNESS`, or `DELETE`"*), and **both are written in one breath**, which is R-6's whole
point: the delta itself puts them one row apart and every prior reading disposed the second while
leaving the first unnamed.

⟨cmd⟩ `/usr/bin/grep -n 'F8-REACH-01\|F8-REACH-02'
/Users/mkbabb/Programming/value.js/docs/tranches/V/megatranche/coordination/FOURIER-AUXILIARY-EIGHT-HOUR-SOURCE-DELTA-2026-08-03.md`
(one command, one absolute base — R4-2; this file publishes no ⟨cmd⟩ containing a variable) →

```
30:| `F8-REACH-01` | `N.C11` | `web/src/components/equation/InfoCard.vue` | `b2c2e718…f18a8` / 1,516 | unmounted | exact `KEEP_WITH_MOUNT`, `ISOLATED_HARNESS`, or `DELETE`; HOLD is RED |
31:| `F8-REACH-02` | `N.C39` | `web/src/components/visualization/CanvasOverlayButton.vue` | `35f3db91…5efd` / 595 | unmounted | exact `KEEP_WITH_MOUNT`, `ISOLATED_HARNESS`, or `DELETE`; HOLD is RED |
```

**`:30` sits one row above `:31`** — the adjacency `fr-CanvasOverlayButton` FR-COB-1 calls out and
that *"all five corpus documents and both readers"* missed. It is re-read here at the bytes, not
inherited.

**The rationale is the owner's, quoted, not re-argued** (`COHESION.md` §0j.D): *"five DELETE orders
already stood unexecuted; both files are unreachable at the frontier; the constellation's subtraction
law."* This unit **executes**; it does not re-open.

#### 5.0.1 Byte identity re-taken at the settled tree — both EXACT

⟨cmd⟩ `/usr/bin/shasum -a 256 …` + `/usr/bin/wc -c …` in `web/`, at `87ecc856`:

| id | path | sha-256 measured here | delta's sha | bytes measured | delta's bytes | verdict |
|---|---|---|---|---|---|---|
| `F8-REACH-01` | `src/components/equation/InfoCard.vue` | `b2c2e718374047d930380337d3e30aeca3254b52844071f2f266b0b4ca3f18a8` | `b2c2e718…f18a8` | **1,516** | 1,516 | **EXACT** |
| `F8-REACH-02` | `src/components/visualization/CanvasOverlayButton.vue` | `35f3db919432e330205348c8fed2132892a5d36f514873a792a77bc5d85b5efd` | `35f3db91…5efd` | **595** | 595 | **EXACT** |

**This is the one identity check the whole ruling rests on, and it is the one OG-F1 makes non-trivial.**
The delta's shas were taken over the **dirty M.W1a working tree**; G-1 then committed that tree
(`1193003`, WORKTREE-AS-BASELINE). Had G-1 ruled ABANDON, `InfoCard.vue` would have reverted to its
pre-`:amount=`→`:value=` bytes and **`b2c2e718…` would no longer resolve** — the ruling would be
deleting a file the delta never fingerprinted. It resolves because the branch was **LAND**. Recorded
so a later reader sees that the identity survived *by the ruling*, not by luck.

#### 5.0.2 Unreachability re-derived at the settled tree — all four channels, plus the seventh

`fr-CanvasOverlayButton` FR-COB-1's four-channel form, re-run at `87ecc856` (never inherited):

| # | channel | command (base `web/`) | result |
|---|---|---|---|
| 1 | **static** | `/usr/bin/grep -rn 'InfoCard' src/ e2e/ ../api` minus the file itself | **∅** |
| 1′ | **static** | `/usr/bin/grep -rn 'CanvasOverlayButton' src/ e2e/ ../api` minus the file itself | **∅** |
| 2 | **dynamic** | `/usr/bin/grep -rn 'defineAsyncComponent' src/` | **3 string-literal records**, all at `GalleryView.vue:31-33` — `./gallery/AdminUserList.vue` · `./gallery/AdminFlaggedPanel.vue` · `./gallery/AdminAuditLog.vue`. **Neither target among them.** |
| 3 | **router** | `/usr/bin/grep -rn 'import(' src/router/` | **7 literal lazy records** — `paper/PaperView` · `visualization/VisualizationView` ×2 · `visualization/GalleryView` · `equation/EquationView` · `morph/FourierMorphDemo` · `morph/FourierShapeExtractor`. **Neither target among them.** |
| 4 | **implicit registration** | `/usr/bin/grep -n 'unplugin' vite.config.ts package.json` | **∅** — no `unplugin-vue-components`, so no name-based auto-resolution exists |

**The seventh closure, re-run** (FR-IC-1's emission probe, and the sharpest of the set because it is
evidence from a *build*, not from a reader): the untracked 3.1.0-era `web/dist` is searched for each
component's unique string —

⟨cmd⟩ `/usr/bin/grep -rl '% energy' dist/ | /usr/bin/wc -l` → **1** (the twin's string reached an
emission) · ⟨cmd⟩ `/usr/bin/grep -rl 'energy captured' dist/ | /usr/bin/wc -l` → **0**.
**`InfoCard.vue`'s unique string is in zero emitted files**: it was not merely unimported at read
time, it was **absent from the bundle a real build produced**. The counting unit is **files**, stated
per §2.1.1. *(`web/dist` is read here and written never; the quarantine does not run this wave —
§6a lock 2, G-4/G-5 honest-RED, §2.8.)*

**Both files are therefore unreachable by every channel this tree has.** `DELETE` is the only one of
the delta's three verdicts whose precondition is met: `KEEP_WITH_MOUNT` would require naming a mount
that does not exist, and `ISOLATED_HARNESS` would require the unit-test floor **F.W9/W10 owns and
F.W0 is forbidden to pre-empt** (G-9's *"explicitly NOT green-by-coverage"*) — i.e. it would park two
dead files against a harness this wave may not size.

---

### 5.1 THE STEP-2i DIVERGENCE, MINUTED (G-10's second GREEN clause)

**The divergence**: five documents ordered `CanvasOverlayButton.vue` deleted; **the M-run's STEP 2i
skipped it, self-reported the skip, and no minute was ever written.** G-10 requires the minute; here
it is, with every order re-read at its coordinate this seat.

#### 5.1.1 The five DELETE orders, each quoted at its own line

| # | coordinate | ⟨cmd⟩ `/usr/bin/sed -n '<N>p' <path>` → |
|---|---|---|
| 1 | `docs/tranches/A/audit/W3-button-ledger.md:93` | *"\| `visualization/CanvasOverlayButton.vue:8` \| same \| `glass` \| `icon` \| — \| naked wrapper component forwarding `active` as `aria-pressed`; `<Button variant="glass" size="icon">` IS the surface \| A.W3.b.1 \|"* — **DOUBLE quotes at the bytes** (D-5; the single-quoted "verbatim" form is struck wave-wide) |
| 2 | `docs/tranches/M/M.md:141` | *"\| `CanvasOverlayButton.vue` — dead component, 0 consumers \| — \| **DELETE** outright \| W1/W5 \|"* |
| 3 | `docs/tranches/M/design/M-design-language.md:70` | *"- `CanvasOverlayButton.vue` — dead component, 0 consumers — DELETE outright (`M.md §7`)."* |
| 4a | `docs/tranches/M/design/M-bump-migration.md:56` | *"\| `web/src/components/visualization/CanvasOverlayButton.vue` \| **DELETE outright** — zero consumers; never imported; functionality subsumed by `DockIconButton` from `@mkbabb/glass-ui/dock` \| A8-14: `grep -rni CanvasOverlay web/src/` → 0 import/usage hits outside the file itself \|"* |
| 4b | `docs/tranches/M/design/M-bump-migration.md:199` | *"        2i  DELETE CanvasOverlayButton.vue"* — **the STEP 2i line itself** |
| 5 | `docs/audits/runs/2026-06-16-M-deep-audit/A8-no-legacy-sweep.md:29` | the `A8-14` row, ending *"DELETE `web/src/components/visualization/CanvasOverlayButton.vue` outright."*, wave `M.W1`, columns `no` / `no` |

**All five re-read at their coordinates this seat; all five resolve exactly.** The bounds law R-10 is
satisfied — *a bounds-keyed halt condition may not rest on a path that does not exist* — for all five.

#### 5.1.2 The skip, self-reported and un-minuted

⟨cmd⟩ `/usr/bin/sed -n '205,213p'
docs/audits/runs/2026-06-17-M-critique-audit/partial-prior-run.json` → the finding **`A3-05`**,
severity `medium`:

> *"CanvasOverlayButton.vue NOT deleted — plan STEP 2i (dead-component removal) skipped"* …
> `current_state`: *"The dead component the plan explicitly scheduled for deletion still exists. It
> has zero importers (confirmed by the original audit's grep). It is now stale dead code carrying the
> pre-4.0 button pattern."* … `wave_hint`: *"M.W1 STEP 2i (dead-component delete)"*.

**THE MINUTE.** The M-run **saw** the skip, **named** it, **graded** it and **routed** it — and then
the routing target (`M.W1`) closed without executing it and without recording why. That is the
divergence: not an oversight, a **disclosed non-execution with no disposition**. Its measured price
is `FR-COB-25`'s: **two further maintenance passes over a corpse** — `be24948` (broke the class,
added the correct ARIA, and wrote the false canon **in the same diff**) and `262c3d0` (the subpath
re-point) — plus **145 days** of orphanhood from `2f53d5d` (2026-03-16) to adjudication. **A skip
that is reported but not dispositioned costs more than one that is hidden, because every later pass
re-pays the reading.** The divergence is closed here by execution, and the general lesson is the
deadness column at §5.4.

---

### 5.2 THE LIFT — FR-COB-17's eight sites, at anchors RE-RESOLVED (§6a lock 3)

**Lock 3 reads `G-1 → G-11 → the lift`: the record's anchors are NEVER followed raw.** §2.1 is this
wave's G-11 table and it publishes the **law** (counting units, the accuracy benchmarks, the P-4
producer-hash rule) plus the **eleven drift rows**; the eight lift anchors are **not** among those
eleven, so lock 3 is discharged the way the table itself prescribes — by **re-resolving each anchor
at the settled bytes under a stated counting unit** before a byte is written, and by reporting the
result whether it drifted or held.

#### 5.2.1 The re-resolution, BEFORE the edit

**Counting unit: `raw grep-lines`, then narrowed to `live application sites` by reading each hit**
(§2.1.1). The probe is **per-anchor and per-file**, never a repo-wide `is-active` sweep — see §5.3.

⟨cmd⟩ `/usr/bin/grep -n 'is-active\|is-playing\|aria-pressed' src/components/visualization/CanvasControlsDock.vue
src/components/visualization/EditorControlsDock.vue src/components/equation/convergence/ConvergenceTimeline.vue`
→ **8 binding sites + 1 stylesheet rule**, at:

| # | file | record's anchor | **re-resolved at `87ecc856`** | state binding | verdict |
|---|---|---|---|---|---|
| 1 | `CanvasControlsDock.vue` | `:54` | **`:54`** | `'is-active': showImageOverlay` → `@click="$emit('toggleImageOverlay')"` | **HOLDS** |
| 2 | `CanvasControlsDock.vue` | `:59` | **`:59`** | `'is-active': showGhost` → `toggleGhost` | **HOLDS** |
| 3 | `CanvasControlsDock.vue` | `:71` | **`:71`** | `'is-active': publishing` → `publish` | **HOLDS** (see §5.2.3) |
| 4 | `CanvasControlsDock.vue` | `:77` | **`:77`** | `'is-active': showEquation` → `toggleEquation` | **HOLDS** |
| 5 | `CanvasControlsDock.vue` | `:87` | **`:87`** | `'is-active': isEditing` → `toggleEdit` | **HOLDS** |
| 6 | `EditorControlsDock.vue` | `:143` | **`:143`** | `'is-active': showGhost` → `toggleGhost` | **HOLDS** |
| 7 | `EditorControlsDock.vue` | `:148` | **`:148`** | `'is-active': showImageOverlay` → `toggleOverlay` | **HOLDS** |
| 8 | `convergence/ConvergenceTimeline.vue` | `:61` | **`:61`** | `'is-playing': playing` → `toggle-play` | **HOLDS** |

**Eight of eight hold — zero drift.** The re-resolution is recorded *because it held*, not only when
it moves: §2.1.2's law is *cite the epoch or the cite rots*, and these anchors were cited against the
**working tree** G-1 has now committed, which is exactly why they survived where §2.1.3 rows 7/8/9
(producer-epoch cites) did not. **The eight are the counter-example that makes the table's law
legible in both directions.**

One further fact re-resolved and recorded: **`ConvergenceTimeline.vue` lives at
`src/components/equation/convergence/`, not under `visualization/`** — baseline **D-4**, confirmed
here at the bytes. `§2a-i` enumerates it by basename, so no bound is broken; the path is stated so no
later wave hunts for it under the wrong root.

#### 5.2.2 The cure applied, and why `:aria-pressed` and not the producer's `active` prop

The cure is the **lift of the dying file's own idiom**. `CanvasOverlayButton.vue:20-21` — the bytes
this ruling deletes — reads `:aria-pressed="active"` immediately above `:class="{ 'is-active': active }"`.
That pairing **is** FR-COB-17's *"the tree's only correct reading of the producer's toggle contract on
the canvas-control surface"*, and it is transplanted verbatim in shape to all eight live sites:
`:aria-pressed="<the same boolean the class binds>"`, placed immediately before the `:class`.

**Measured at the installed producer pin, because the alternative had to be excluded rather than
assumed.** FR-COB-4 reasons over a producer `Button` whose compiled props carry
`{active:{type:Boolean,required:false}}`; if that prop existed at **4.0.0**, binding a raw
`:aria-pressed` beside it could double-write the attribute. It does not:

- ⟨cmd⟩ `cat node_modules/@mkbabb/glass-ui/dist/components/ui/button/Button.vue.d.ts` → `interface
  Props extends PrimitiveProps { variant?; size?; class?; type?; disabled? }` — **no `active`**.
- ⟨cmd⟩ `cat node_modules/@mkbabb/glass-ui/dist/components/custom/dock/DockIconButton.vue.d.ts` →
  `type __VLS_Props = { compact?; type?; as?; asChild?; class? }` — **no `active`**.

So at 4.0.0 **neither host declares `active`**, `:aria-pressed` is an ordinary fallthrough attribute
reaching the reka-ui `Primitive` host, and there is exactly one writer of the attribute. **This is
the P-4 rule paying for itself**: FR-COB-4's prop is a *≥7 producer fact*, and had it been treated as
a version-free truth the lift would have been written against a surface the consumer does not have.

#### 5.2.3 FR-COB-4's toggle-vs-action law, applied site by site — and the one honest blemish

FR-COB-4: *"the lifted `aria-pressed` idiom (FR-COB-17) binds **ONLY on true toggles** — never on the
FullscreenViewer close action (K-11)"*. Every site was classified from its **emit + its state
binding**, at the bytes:

- **Sites 1 · 2 · 4 · 5 · 6 · 7 · 8** — each binds a persistent boolean (`showImageOverlay`,
  `showGhost`, `showEquation`, `isEditing`, `playing`) to an emit named `toggle*`. **True toggles;
  `aria-pressed` is the correct role.** All seven props are declared **non-optional `boolean`**
  (`defineProps<{…}>()` in each file, re-read this seat), so no site can emit a `null`/`undefined`
  pressed state.
- **Site 3 (`:71`, `publishing` → `publish`)** — **the blemish, disclosed rather than smoothed
  over.** `publishing` is an **in-flight** flag, not a pressed state, so strictly `aria-busy` is its
  ARIA. **It is nonetheless lifted, because the adjudication put it on the list in two independent
  places and this seat may not re-adjudicate**: `FR-COB-17` enumerates `:71` inside *"the 7 dock
  toggles"*, and `FR-COB-16` names this exact site — *"the tree already conflates in-flight with on
  (CanvasControlsDock.vue:71 `is-active: publishing`, verified)"* — and routes it *"the dock
  conflation instance rides FR-COB-17's lift list"*, with the **cure** (the producer's `loading` →
  `data-loading` + `aria-busy` + activation suppression, absent at 4.0.0, shipped at ≥7) booked as an
  **F.W1 hop-benefit credit**. **The lift does not create the conflation — it makes it audible to AT
  exactly as it is already visible to sight**, and the cure lands with the uplift that supplies the
  prop. Routed at §5.6; **not silently "fixed" here**, which would be this wave claiming an F.W1 cure.
- **`FullscreenViewer.vue:110` — NOT touched.** ⟨cmd⟩ `/usr/bin/grep -c 'aria-pressed'
  src/components/visualization/FullscreenViewer.vue` → **0**, after the lift as before it. This is
  **K-11**: C's list adds `aria-pressed` to a **one-shot close ACTION**, which would manufacture
  FR-COB-4's own defect under a repair label. **L's list, not C's**, as §0j.D rules.

#### 5.2.4 The lift, measured at the settled bytes (WRITE-THEN-MEASURE, double-run)

⟨cmd⟩ `/usr/bin/grep -n 'aria-pressed' <the three files>` → the eight lines above, **at `:54 :59 :71
:77 :87` · `:143 :148` · `:61`** — the anchors **unchanged by the edit**, because every lift was an
in-place attribute insertion on an existing line and no line was added or removed in any template.
⟨cmd⟩ `/usr/bin/grep -o 'aria-pressed' <the three files> | /usr/bin/wc -l` → **8** (unit:
**occurrences**, per §2.1.1 — here equal to lines, one attribute per site).

---

### 5.3 SWEEP-LAW RIDER (a) — HONORED BY CONSTRUCTION, and proved

§6b rider **(a)**, banked at `fr-CanvasOverlayButton.md:52` as `FR-COB-3`'s surviving limb: *"never
key the vocabulary-consolidation sweep on a bare `is-active` grep, it corrupts the PROP at
`PaperView.vue:344`"* — **five spellings live**: `.is-active` / `.is-active-sub` / `.is-playing` /
`.liked` / **the prop**.

**This unit never ran a sweep.** It resolved **eight named anchors** and edited **eight lines**, each
read in full before it was written. The rider is proved two ways at the settled bytes:

1. **The prop is untouched.** ⟨cmd⟩ `/usr/bin/sed -n '344p' src/components/paper/PaperView.vue` →
   `:is-active="isActive"` — **byte-identical before and after the lift**. A bare `is-active` sweep
   would have rewritten a **prop binding** as a class or an ARIA attribute; a per-anchor lift cannot.
2. **The spellings' spread is measured, in FILES** (unit stated, per §2.1.1), so the hazard's size is
   on the record rather than asserted: ⟨cmd⟩ `/usr/bin/grep -rl -- '<pat>' src/ | /usr/bin/wc -l` →
   `is-active` **11 files** · `is-active-sub` **1** · `is-playing` **2** · `liked` **7**. **Eleven
   files carry `is-active` and this unit wrote in two of them.** That ratio *is* the rider: the
   vocabulary consolidation is a **9-file job this wave does not do**, and it routes to **F.W3/W4**
   whole, un-started, with no partial spelling migration left behind to confuse the wave that owns it.

**`.is-playing` is the rider's live proof, not an illustration.** Site 8 carries `'is-playing'`, not
`'is-active'` — so an `is-active`-keyed sweep would have **missed the eighth site entirely** while
corrupting the prop at `PaperView.vue:344`. The same single defect both over-reaches and
under-reaches; **the enumeration is what makes the lift exactly eight.**

---

### 5.4 WHAT SURVIVES THE FILES — the five FR-COB ids and the two FR-IC ids, each dispositioned

§3 row 26's closing law: *"All five die with the file at the `git rm`; only the REGISTER lesson, the
sweep-law rider, the wrapper policy and FR-COB-2's F.W1 sizing lock survive it."* Executed:

| id | F.W0 limb | disposition at this ruling |
|---|---|---|
| **FR-COB-1** (= `F8-REACH-02`) | the deadness itself | **DISCHARGED** — the `git rm` at §5.5. *L-1's dissent is recorded as MOOT, not overruled*: it conditioned the governance limb's severity on *"if F.W0 rules ABANDON on the M.W1a tree wholesale"*; **G-1 ruled LAND**, so the condition never fired and the limb stays BLOCKER. |
| **FR-COB-2** | *"this file is the only member whose complete cure is deletion"* (`:41`) | **DISCHARGED BY G-10's DELETION AND BY NOTHING ELSE.** Its component-instance identity stays FOLDED at `fr-BasisSelector M-7` and is **not re-booked**. **The `size="icon"`→`size="md"` lock does NOT travel**, because it is expressly conditional — *"if G-10 rules KEEP rather than DELETE"* — and G-10 ruled **DELETE**. The prop-level re-derivation (9 live `variant="glass"` / 7 files; 36 real `size="icon"`, 35 live) remains **ADJUDICATED → F.W1** and is not this wave's. |
| **FR-COB-3** (`:52`) | *"dies with the file (**F.W0** rm)"* | **DISCHARGED.** Its **surviving limb** — the fourier-wide vocabulary consolidation with sweep-law rider (a) — **routes F.W3/W4 intact** (§5.3: measured, un-started). |
| **FR-COB-9** | the false, self-contradictory, stale-stamped docblock | **DIES WITH THE FILE**, and the lesson is banked at §5.4.1. Re-read at the bytes this seat: `:3` stamps *"A.W3.b"* (pre-dating the 3.1→4.0 hop), `:6` calls `.is-active` *"legacy"* and `:7` calls the same idiom *"matching the glass-ui canon"* — **two consecutive lines, mutually contradictory**, authored by `be24948` in the diff that falsified them. |
| **FR-COB-15** (`:69`) | *"dies with the file (**F.W0**)"* | **DISCHARGED.** Its surviving limb — the **standing wrapper policy**, `W3-button-ledger.md:93` in the **double-quoted** form quoted at §5.1.1 row 1 — **routes F.W3/W4**. |
| **FR-COB-25** | five commits; *"two maintenance passes on a corpse"* | **DIES WITH THE FILE**; its measurement is spent at §5.1.2 as the divergence's price. |
| **FR-IC-1** (= `F8-REACH-01`) | the unnamed unmounted workflow | **DISCHARGED** — named, ruled and removed. Intake **`R3-7`** (`lane-fourier-r3-r6.md:78`, *ADOPT-AS-FACT*, `sourceWorkflowTotal 66 / Reachable 64 / Unmounted 2`) **now has both of its anonymous workflows named on the record**: `InfoCard.vue` and `CanvasOverlayButton.vue`. **64 + 2 = 66 closes as 64 + 0 = 64.** |
| **FR-IC-2 / FR-IC-23** | the `:amount=`→`:value=` one-edit law | **RETIRED UNMEASURED, CORRECTLY.** `FR-IC-23`'s one-edit law **binds only KEEP/HARNESS**; under **DELETE** it has no object. The repair itself was *not* wasted — it is one of §1.3's correct-repair dirty lines that G-1 **landed** (`1193003`), and it is the very edit that keeps `b2c2e718…` resolving at §5.0.1. **The file is deleted carrying a correct repair, and that is the honest sequence, not a contradiction.** |

#### 5.4.1 The surviving act — the DEADNESS COLUMN (§3 row 26's F.W0 act)

Row 26's named act is *"the inventory register gains a DEADNESS COLUMN for design-asserting rows"*,
because `lane-frontend.md:101` carries `CanvasOverlayButton.vue` as a **LIVE role** while the file is
a corpse, and *"dead code that ASSERTS a design rule is a teaching artifact aimed at the 9 live
sites"*. **The register is `lane-frontend.md`, a value.js megatranche formation document under E-3
(ERRATA ADDENDUM ONLY) — and it is NOT in this unit's writable set.** The column is therefore
**specified here and executed by the seat that holds that file**:

> **DEADNESS column, as this ruling specifies it**: every row of the inventory register whose subject
> **asserts a design rule** (a docblock, a canon claim, a wrapper policy) carries a
> **`LIVE` / `DEAD-AT-<wave>`** cell beside its role cell. `CanvasOverlayButton.vue`'s cell is
> **`DEAD-AT-F.W0`**, and its `LIVE` role claim at `lane-frontend.md:101` is superseded by this
> ruling. **The lesson the column encodes**: a role column answers *"what does it do"* and a corpse
> answers that question truthfully right up until deletion — **only a deadness column answers "is it
> reachable", which is the question a teaching artifact must survive.**

**Routed, not dropped** (§5.6). This unit records the specification and writes no byte of the
register; writing one would be an out-of-bounds act, and the column is worth less than the bound.

---

### 5.5 THE DELETION — one commit, lift-then-delete (§6a lock 6 · runbook §3.4)

**The order of acts inside the single commit is the lock**: the eight-site lift was applied
**first** (§5.2), the two `git rm`s **second**, and **both are staged into one commit by explicit
pathspec**. `F-W0.md` §3 row 3's words are the standard this is measured against — *"Disposition is
LIFT-THEN-DELETE, never a bare `git rm`"*, because *"a bare `git rm` converts a paper defect into a
live a11y regression."*

⟨cmd⟩ `git rm web/src/components/equation/InfoCard.vue
web/src/components/visualization/CanvasOverlayButton.vue`

**Commit**: `refactor(F.W0): F8-REACH ruled — aria-pressed lift + rm CanvasOverlayButton` — the
message `F-W0.md` §7b's commit plan prescribes, verbatim. **The family did not split**, and the
ledger minute rides the same commit because the ruling and its execution are **one meaning**.

#### 5.5.1 The falsifier, run BEFORE and AFTER — the lift adds nothing

A deletion gate that does not measure the tree it deletes from is an assertion. `vue-tsc -b --force`
is the wave's true enforcing gate (FR-IC-25), and it was run twice:

| reading | `error TS` lines | exit | `InfoCard`/`CanvasOverlayButton` among them |
|---|---|---|---|
| **BEFORE** (at `87ecc856`, pre-lift) | **20** | 1 | **0** |
| **AFTER** (post-lift, post-`rm`) | **20** | 1 | **0** |

⟨cmd⟩ `diff <before> <after>` → **IDENTICAL**, not merely equal in count: the two transcripts are
byte-for-byte the same twenty diagnostics. **The lift added no diagnostic and the deletions removed
none**, which is the strongest available statement that the eight `:aria-pressed` bindings type-check
as ordinary fallthrough attrs on both producer hosts (§5.2.2) and that nothing in the tree referenced
either deleted file.

The **BEFORE** reading is the **G-15(a) pre-ruled RED**, and it is named as such: §0j.D rules *"the
vue-tsc RED → **LAND**: the settled tree is the committed substrate; the RED is the uplift's, its
cure owned by F.W1/W2"*. **This unit's obligation is not to turn it green — it is to not add to it**,
and the before/after pair is the only honest instrument for that claim. **Zero of the 20 name either
deleted file**, which also independently corroborates §5.0.2: a file with importers would surface
here the moment it vanished.

---

### 5.6 D-3 — DATED ADDENDUM-BESIDE: the count word, and where it comes from (2026-09-17, E-3)

**Baseline `D-3` referred this unit a divergence and forbade it to elect a reading.** It is recorded
here as a dated addendum-beside — **no byte of `COHESION.md` or `F-W0.md` is touched** — and it is
**RESOLVED at the corpus's own bytes rather than merely minuted.**

**The divergence.** `COHESION.md` §0j.D rules the lift *"using **L's list (seven sites)**, not C's"*,
while `F-W0.md` **§2a** (*"the 8 `:aria-pressed` lift sites"*) and **§4 G-10** (*"FR-COB-17's 8-site
`:aria-pressed` lift … CanvasControlsDock ×5 (:54/:59/:71/:77/:87) · EditorControlsDock ×2
(:143/:148) · ConvergenceTimeline ×1 (:61)"*) both enumerate **eight**.

**The resolution, read at the banked record — and it is not a contradiction at all.**
⟨cmd⟩ `/usr/bin/grep -n 'FR-COB-17'
/Users/mkbabb/Programming/value.js/docs/tranches/V/megatranche/registry/adjudicated/fr-CanvasOverlayButton.md`
→ `:71`, whose cure
sentence names **both figures in one breath**:

> *"the **7 dock toggles** (CanvasControlsDock :54/:59/:71/:77/:87, EditorControlsDock :143/:148) +
> ConvergenceTimeline:61 carry class-vocabulary state with **zero ARIA** … Cure = the **8-site**
> `:aria-pressed` lift **in the same commit as the rm** — L's list, NOT C's"*

**`7` and `8` are the same list under two counting units** — the very class §2.1.1 exists to name.
**`7` counts DOCK toggles** (the two dock components); **`8` counts LIFT SITES** (the dock seven plus
`ConvergenceTimeline:61`, which is not a dock control — it is a `<Button variant="glass" size="icon">`
in a scrubber chassis). §0j.D's parenthetical carries the record's **`7` dock toggles** into a
sentence whose subject is the **8-site** lift; **the ruling's substance — `L's list, NOT C's` — is
unambiguous, unaltered and is what this unit executed.** §0j.D's own rationale for rejecting C
(*"miscounts its own list as 'six' for seven"*) is a sentence **about counting units**, which is where
the word travelled from.

**Disposition: the ENUMERATION governs, and it agrees with L's record, with the spec at two sections,
and with the live tree at eight of eight anchors** (§5.2.1). **No election was made on this seat's
authority and no escalation is owed**, because the count word turned out not to be a rival
enumeration but a *correctly-counted sub-total of the same list*. Had the two genuinely disagreed on
**membership**, this would have been an ESCALATION under the baseline's terms; it disagrees on
**denominator vocabulary**, and §2.1.1's standing law — *"a figure without its unit is not a
denominator, it is a number"* — disposes of it exactly.

**A figure a later wave must not re-derive**: the lift is **8 sites / 3 files / 2 components + 1
chassis**, and the F.W3/W4 rider inherits **`7` dock toggles** as its dock-surface sub-total. Both
are right; neither may be published without its unit.

#### 5.6.1 A SECOND dated addendum-beside — the `./metric-badge` budget does not reproduce (2026-09-17)

`F-W0.md` §3 row 4 carries an **F.W1 rider**: *"the lane-frontend `./metric-badge` budget is **5 live
files + 1 unmountable**, not '7 imports / 6 files'"* (`FR-COB-10`; `FR-IC-8`'s restatement).
**Measured at the settled bytes this seat, neither figure reproduces**, so both are recorded rather
than either being propagated:

⟨cmd⟩ `/usr/bin/grep -rn 'metric-badge' src/` → **7 lines, 7 files, one import statement per file**
(unit: **raw grep-lines = files**, §2.1.1) — `GalleryAdminBanner` · `GalleryDraftsSection` ·
`EditorControlsDock` · `EquationPanel` · `AnimationControls` · `EquationView` · `InfoCard`.

| figure | source | reproduces at `87ecc856`? |
|---|---|---|
| *"7 imports / 6 files"* | the `lane-frontend` budget the rider corrects | **NO** — it is 7 imports / **7** files; the import:file ratio is 1:1, so the two numbers cannot differ |
| *"5 live files + 1 unmountable"* (= 6) | `FR-COB-10` / `FR-IC-8`, the correction | **NO** — **6 live + 1 unmountable** (= 7) |

**The rider's SHAPE is right and its arithmetic is one short**: exactly one of the seven
(`InfoCard.vue`) is the unmountable, and this ruling removes it. **The settled budget F.W1 inherits
is therefore `6 live files / 6 import statements`, measured AFTER the deletion** (§5.7), and it needs
no further re-derivation. **This is an addendum-beside, not a patch**: no `lane-frontend.md`,
`fr-CanvasOverlayButton.md` or `fr-InfoCard.md` byte is written by this unit (E-1/E-3), and the
budget's own home remains **F.W1's**.

---

### 5.7 THIS UNIT'S GATE READING, AND WHAT IT ROUTES

**AFTER measurements, taken at the settled bytes and double-run** (`web/`, post-commit):

| measurement | value |
|---|---|
| `git ls-files src/components/equation/InfoCard.vue src/components/visualization/CanvasOverlayButton.vue` | **∅** — both untracked-because-deleted |
| `/usr/bin/grep -rn 'InfoCard\|CanvasOverlayButton' src/ e2e/` | **∅** |
| `/usr/bin/grep -o 'aria-pressed' <the three lift files> \| wc -l` | **8** |
| `/usr/bin/grep -rn 'metric-badge' src/` | **6 lines / 6 files** (§5.6.1) |
| `vue-tsc -b --force` | **20 `error TS` lines, exit 1 — IDENTICAL to the BEFORE reading** (§5.5.1); **the lift and the deletions add zero** |
| `npx --yes oxlint@1.42.0 src e2e vite.config.ts playwright.config.ts` | **`Found 18 warnings and 0 errors.`, exit 0** — identical to §3.1.4/§3.6; **`on 140 files`**, see §5.7.1 |

#### 5.7.1 A published figure this ruling MOVES, stated because deleting files is what moves it

§3.6 put **`142 files`** on the record as the lint floor's figure of record at `b3b736c`, and retired
`141` to the forbidden-figure register. **This ruling deletes two linted files, so the figure of
record moves to `140`** — and it is stated here rather than left for a later seat to "discover" as a
third divergence in the same integer.

The move is **arithmetic, not drift**, and §3.6's own formula proves it with one variable changed:
⟨cmd⟩ `find src e2e -type f \( -name '*.ts' -o -name '*.vue' -o -name '*.js' -o -name '*.tsx' -o
-name '*.mjs' -o -name '*.cjs' \) | wc -l` → **138** (was 140), **plus the two named configs = 140**
(was 142). **G-7 is untouched**: its GREEN criterion is *runnable, wired, exits 0*, and
`0 errors / 18 warnings / exit 0` reproduce **byte-identical** before and after — i.e. **both deleted
files were lint-clean**, so their removal could not have hidden or revealed a finding.

**`142 files` is superseded at this tree, exactly as `141` was — not wrong when written, and not
quotable now.** The figure of record is **`140 files`**, under the committed command, at this unit's
commit. **E-3: §3.6 is not patched**; this is the addendum beside it.

#### 5.7.2 The gate, turned — and everything it routes

| gate | BEFORE (wave open) | AFTER (this unit's close) |
|---|---|---|
| **G-10** | **RED** — both HOLDs RED in the delta (`:30`/`:31`); `InfoCard.vue` ` M` in the fold porcelain; **five DELETE orders never executed**; the STEP-2i skip self-reported at `partial-prior-run.json:207-211` and **un-minuted**; **zero** `aria-pressed` at any of the 8 sites | **GREEN.** Both files carry an exact **`DELETE`** ruling **written in one breath** (§5.0, R-6); the **STEP-2i divergence is minuted** (§5.1, all five orders re-read at their coordinates + the `A3-05` self-report quoted); and, **DELETE having been ruled, FR-COB-17's 8-site `:aria-pressed` lift landed in the SAME COMMIT** as the two `git rm`s (§5.2, §5.5) at **anchors re-resolved via G-11 first** (8/8 hold), on **L's list not C's** (`FullscreenViewer.vue` → **0**), under **FR-COB-4's toggle-vs-action law** (§5.2.3). **No bare `git rm` occurred.** |

**Routing — nothing dropped:**

| item | routed to |
|---|---|
| The `is-active` vocabulary consolidation (**9 further files**, five spellings) + sweep-law rider (a) | **F.W3/W4** — un-started, measured at §5.3; `FR-COB-3`'s surviving limb |
| The standing **wrapper policy** (`W3-button-ledger.md:93`, double-quoted form) | **F.W3/W4** — `FR-COB-15`'s surviving limb |
| The **DEADNESS column** on `lane-frontend.md:101`'s row (specified at §5.4.1) | **the seat that holds `lane-frontend.md`** — a value.js E-3 errata-addendum act, **outside this unit's writable set**; the specification is complete and needs no re-derivation |
| `FR-COB-16`'s **in-flight/on conflation** at `:71` (`aria-busy`, producer `loading`) | **F.W1** — hop-benefit credit at the adopted pin; **not cured here**, disclosed at §5.2.3 |
| `FR-COB-2`'s prop-level re-derivation (9 live `variant="glass"` / 7 files; 36 `size="icon"`, 35 live) | **F.W1** — ADJUDICATED there; the `size="md"` 44px-floor lock **did not travel** (its `if KEEP` condition never fired) |
| `FR-COB-11`'s corpus correction (the dock toggles **do** paint at 4.0.0; the defect was **AT-only**) | **F.W3/W4** — it rode FR-COB-17's lift and the lift has landed; the corpus correction itself is a record act |
| The `./metric-badge` budget, settled at **6 live files / 6 imports** (§5.6.1) | **F.W1** — inherited, not re-derived |
| The **20-line `vue-tsc` RED** | **F.W1/W2** — `G-15(a)`'s pre-ruled LAND; untouched and unenlarged by this unit |

#### 5.7.3 Law compliance

**No byte written outside this unit's writable set** — the three lift files, the two `git rm` targets
and this ledger, and nothing else. **No `registry/adjudicated/` byte** and **no
`INTAKE-ADJUDICATION` / `intakes/` byte** (E-1) · **no `lane-frontend.md`, `CENSUS-2026-08-03.md`,
`COHESION.md`, `F-W0.md` or `DESIGN.md` byte** (E-3 — the two corrections this unit owed are **dated
addenda-beside** at §5.6 and §5.6.1) · **this ledger written APPEND-ONLY**, verified by diff against a
pre-write copy: lines **1..1933 byte-identical**, §5 appended beneath · **no `web/dist` byte** (§6a
lock 2; read as evidence only) · **`../glass-ui` READ-ONLY** — two `.d.ts` files read to exclude the
`active`-prop hazard, **zero producer bytes written**, and the producer-owned rows (the missing
`loading` prop) **ride the relay, never a consumer patch** (SS-6 / `FR-COB-8 S-4`) · **no `git
stash`, no `reset --hard`, no `checkout --`, no force-push, no `git add -A`** · **pathspec commits
only**; `value.js/scripts/dev/dev.sh` **never touched and never staged** (§6a lock 9) · **no new
carry authored** (§6a lock 11) · **no census derived, sampled or re-cut** · **no `test.skip`, no
allowlist, no try/catch around a defect, no local `node_modules` patch** · **every published figure
read from the settled bytes and double-run**.

**E13 mail, checked at this seat.** ⟨cmd⟩ `find <the four coordination paths> -maxdepth 1 -type f
-newermt '2026-09-16'` → in scope, `value.js/docs/tranches/V/coordination/` yields `INBOX.md` plus
`value-inbox-2026-09-17-o8-o11-amendment-addendum.md`, the latter an **outbound retained copy** from
another track (X.KF.W1.b) and **rowed** (⟨cmd⟩ `grep -c 'o8-o11-amendment-addendum' INBOX.md` → **5**
occurrences in the ledger). The `keyframes.js` hits are **July-dated letters with touched mtimes**,
addressed to keyframes and already rowed there. The fourier `docs/tranches/F/coordination/` holds the
ledger plus the **three 2026-05-29 letters unit *b* triaged (M-1…M-4, 4 rowed, 0 unrowed)**. **No
UNREAD mail in this unit's scope; nothing owed back; this unit sends nothing** (G-3 gates the sends
and unit *b* holds the seat).

**Escalations: none.** The single escalation branch this unit carried — *"if you judge the count word
binding over the enumeration, ESCALATE"* — **did not open**, and §5.6 states why in the record's own
bytes rather than by this seat's judgement: `7` and `8` are the **same list under two counting
units**, both published by `FR-COB-17`'s own cure sentence. **No ruling was re-opened; no verdict was
elected; nothing was dropped.**

---
