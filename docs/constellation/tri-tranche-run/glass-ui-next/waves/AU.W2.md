# AU.W2 — the dock opacity-lockstep fold [slides-F P0 HEADLINE]

The FIRST IMPL wave (CHARTER §3 W2, §5 priority ordering). slides-F's single most
valuable glass-ui item for perceived quality — the user's "not iOS-smooth" report
(V02) — lands first because it is the highest-priority slides-F-blocking item and is
file-disjoint from the entire blob/WebGL/color graph. It ships in glass-ui's dock
files; slides only bumps the pin once AU publishes (CHARTER §6).

## §Scope

**The opacity-desync half (verified un-fixed on-branch at `8e4cb9f`,
`slides-coupling.md §1`).** AT.W6-dock-c shipped the VT-curve half
(`view-transition.css:61` runs `--dock-resize-spring`, the overshoot is GONE) — but
the opacity half is STILL PENDING: `dock.css:418`/`:436` read
`opacity var(--dock-motion-fast)` (0.2s) on `.dock-layer` / `.dock-layer-item-host`
while the container morphs at `--dock-motion-resize` (0.3s), a 100ms-apart settle
(the STRUCTURAL desync, V02 Problem 2).

**The fold (V02 Fix-2 Option A) — spell BOTH desync declarations:**
(a) the base/inactive rule `dock.css:418` opacity `--dock-motion-fast` →
`--dock-motion-resize` AND the matched `visibility` delay at `:419`
(`0s linear var(--duration-fast)` → `var(--duration-normal)`) so the host's fade and
the container's morph settle together; (b) the active rule `.layer-active`/`.is-active`
at `dock.css:436` independently re-declares `opacity var(--dock-motion-fast)` — swap it
to `--dock-motion-resize` too, but PRESERVE `:437` `visibility 0s` (immediate show — do
NOT add a delay; the `:434` comment "The active layer shows immediately" governs). The
lockstep is opacity-curve unification; the active-rule visibility stays immediate by
design. File-disjoint from blob/WebGL/color — AT-owned dock territory.

This is a TOKEN-level fold (no prop, no component change) — it rides the convergent
`--dock-resize-spring` already landed (`e906448`), unifying the dock's motion
vocabulary so the fade and the morph share one curve AND one duration.

## §HARD gate

Per CHARTER §3 W2: **a playwright timing probe (NOT a screenshot): dock items +
container settle within ONE frame of each other; reddens on a re-injected desync.**
Made `proof:dock-opacity-lockstep`, registered `gates.mjs` (tag `local,ci`):

- Drives the dock collapse↔expand transition; samples the computed `opacity` of
  `.dock-layer-item-host` AND the container's resize over the transition; asserts
  **items + container settle within ONE frame (≤16.7ms) of each other.**
- **bite-check:** reverting the opacity token to `--dock-motion-fast` reddens it (the
  100ms-apart settle returns). Reddens on a >1-frame split.
- A no-regression line: the inert+pointer-events+visibility triad and the
  verified-correct PRM (reduced-motion) degradation are preserved (the fade still
  honors `prefers-reduced-motion`).

inv ε: green means a real timing probe measures the ≤1-frame settle; a screenshot or
a narration ("opacity now matches") does NOT pass. The bite-inject (the desync
re-injection) is the proof the gate is load-bearing.

## §No-legacy

A token swap, no alias — the `--dock-motion-fast` reference on the dock layers is
REPLACED by `--dock-motion-resize`, not kept behind a flag. The old 0.2s opacity path
is deleted, not made opt-in (P1).

## §Slides edge

E-dockanim (`slides-coupling.md §4`) resolves here. The fold is AT-owned — slides
bumps the pin only after AU's publish (AU.W10). AU.W2 does NOT touch slides
(inv-16).
