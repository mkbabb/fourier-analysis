# AU.W0 — formalize + re-ground + decompose (DEV)

The opening wave (CHARTER §3). AU is NOT a fresh successor over a clean AT close —
it is the **execution of AT's authored-but-unrun W2-W8 PLUS the named-forward AU
dock-design gestalt** (`at-state.md §canonical next letter`). AT is plan-authored,
dock-slice-executed, headline-unbuilt; its tree is dirty + was double-driven. W0
formalizes this CHARTER into `glass-ui/docs/tranches/AU/` and re-grounds the record
against HEAD `8e4cb9f` so every later wave gates on FACT, not the AT plan's
narration. **This wave writes NO src** — it is the DEV formalization.

## §Scope

1. **Formalize the CHARTER into `tranches/AU/`.** `AU.md` + `PROGRESS.md` exist; the
   CHARTER §3 wave table is the binding spec; the four sibling audits
   (`audit/{at-state,deferred-lineage,precept-prompt-recap,slides-coupling}.md`) are
   the substrate. The W0b SOTA reads + the C-synthesis bind whole — no re-audit of
   the SOTA is owed (CHARTER §header).

2. **Re-ground the three landed dock commits as FACT** (CHARTER §2). `e906448`
   (W6-dock-c motion-parity), `f0b0ffb` (touch-gate B′), `8e4cb9f` (W7-dock-a/b/c
   overflow + token refinements + doc-rot gate) are SHIPPED, not plan. AU inherits
   them; it does NOT re-litigate them. PROGRESS records them DONE-AT-HEAD with their
   SHAs; they are re-verified on AU's OWN green CI at the close (inv-27 — not
   inherited from the convergence campaign record).

3. **Re-letter the slot-ID collision** (CHARTER §2, `precept-prompt-recap.md §0
   (consequence 1) + §3 (item 1)`).
   The AT PLAN assigned `W6-dock-b` = *the a11y + state-machine contract test*; the
   COMMIT `f0b0ffb` re-used `W6-dock-b` = *the touch-gate B′ test*. Two deliverables,
   one slot. AU records the touch-gate as SHIPPED under its true identity and the
   **un-shipped a11y/state contract test under a fresh AU ID** (AU.W8). The collision
   is NOT inherited; the a11y contract is NOT silently dropped because its slot "looks
   taken."

4. **Decompose the un-auditable bundle** (CHARTER §3 W0, `deferred-lineage.md §10`
   #29). The "3 a11y asks" (DDR-AS-RC-2) is a label, not an auditable spec. W0
   decomposes it against speedtest's AU a11y audit + the `LabeledField` for/id binding
   (#25) into named, file:line-cited WCAG sites. Each decomposed site → FOLD (real
   gap, into AU.W3's correctness fold) or BOOK (no concrete failing site). Zero bundle
   labels survive W0.

5. **Bind zero-deferral at open (P-Inv 28).** Every folded item carries a disposition
   (the `deferred-ledger.md` is the input — 63 numbered rows from `deferred-lineage.md
   §1-§8` + 8 standing asks from `precept-prompt-recap.md §2`, reconciled in the
   ledger's §9; 1:1 dispositioned). No item enters AU un-dispositioned.

6. **Carry DEC-AT-7 verbatim as the load-bearing seam** (`at-state.md §DEC-AT-7
   seam`, CHARTER §4 inv-AT-color). Color space is GAMMA at the blob's faithful lift
   (AU.W7), LINEAR at the shader-quality flip (AU.W7's shader-quality stage) with the
   mandatory `linearToSrgb()`. The `/color` leaf (AU.W5) ships BOTH `oklchToLinear`
   and `oklchToGammaRgb`. A CLOSED design question AU executes — not re-litigated. W0
   pins it so no executor rediscovers it from code.

## §HARD gate

Per CHARTER §3 W0: **`AU.md` + `PROGRESS.md` exist; every folded item carries a
disposition; the `W6-dock-b` collision re-lettered with the touch-gate recorded
SHIPPED + the a11y contract assigned a fresh ID.** Made re-runnable as
`proof:au-w0-reground` (`scripts/proof-au-w0-reground.mjs`), fail-closed:

- **(a) the formalization exists.** `AU.md` + `PROGRESS.md` are present under
  `tranches/AU/`. Reddens if absent.
- **(b) the three landed dock SHAs are reachable** from HEAD
  (`git merge-base --is-ancestor e906448 HEAD && … f0b0ffb && … 8e4cb9f`) — AU is
  grounded on the post-dock tree. Reddens if any SHA is unreachable.
- **(c) zero bundle labels survive + zero un-dispositioned items.**
  `grep -rn "3 a11y asks\|DDR-AS-RC-2 bundle" docs/tranches/AU/` returns 0 OUTSIDE
  the W0 decomposition table; every folded item in `AU.md` carries a FOLD-Wn / BOOK /
  KILL / OUT tag (P-Inv 28).
- **(d) the slot collision is re-lettered.** `grep "W6-dock-b" docs/tranches/AU/`
  resolves only to a historical-citation context (the re-letter note), never a live
  AU deliverable; the touch-gate is recorded SHIPPED (`f0b0ffb`); the a11y/state
  contract is assigned AU.W8's fresh ID.

inv ε: the gate is the proof. **bite-check:** deleting one SHA-ancestry check reddens
(b); leaving any folded item un-tagged reddens (c).

## §No-legacy (the retirements W0 RECORDS, the later waves OWE)

W0 writes no code but records the no-alias deletions (P1) with their owning waves:
`frostShader.ts` DELETE (AU.W6), the demo 1×1-canvas `cssColorToRgb` probe DELETE
(AU.W7, replaced by the throwing injected `ColorResolver`), the dead
`optionalPeerDependencies` field DELETE (AU.W3), the dead `ValueJs` UMD global +
`libraryGlobals` wiring DELETE (AU.W4 as the SFC/build touch pays —
`vite.config.ts:49` + `vite.library.ts:134`, dead under ES-only output),
`DockTabButton` RETIRE (AU.W8, 0 consumers — component
`src/components/custom/dock/DockTabButton.vue`, export
`src/components/custom/dock/index.ts:5`, + the `dock.css:877`/`:947` comment refs).
Each is named with its deletion wave so no later wave "discovers" it and keeps it.

## §Exit

W0 closes when `proof:au-w0-reground` is GREEN and `AU.md`/`PROGRESS.md` record the
re-grounded state. AU.W1 (design slices) is the DEV boundary; AU.W2 is the first IMPL
(the slides-P0 dock opacity-lockstep fold).
