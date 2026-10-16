# AU.W5 — the `/color` runtime-JS leaf (DEC-AT-7)

The color foundation (CHARTER §3 W5). The first wave of the headline graph — the
`/color` leaf the blob shader + aurora both consume. Runtime color is ~95% on
value.js already (inv-K-2); AU finishes it by hoisting the leaf. This is a CLOSED
design question (inv-AT-color) — AU EXECUTES the leaf, it does NOT re-decide the
answer (`precept-prompt-recap.md §inv-AT-color`, CHARTER §4). It lands before the
substrate (AU.W6) + the blob (AU.W7) because both consume the leaf's helpers.

## §Scope

1. **Hoist the `/color` runtime-JS leaf (#4, DEC-AT-7, inv-AT-color).** Two helpers,
   both value.js-backed — but DISTINCT verbs (don't double-implement the existing one):
   - `oklchToLinear` — HOIST. Already exists, value.js-backed at
     `aurora/composables/color.ts:33` (over `oklabToLinearSRGB`). Relocate the existing
     helper to the `/color` leaf and re-point aurora's import — NO second impl (a
     duplicate would trip `proof:single-color-core`).
   - `oklchToGammaRgb` — AUTHOR new. The blob's gamma exit (DEC-AT-7's W7 GAMMA space —
     the helper that does not exist at HEAD).

   "One core" binds the MATH SOURCE (value.js), NOT the return space — forcing one
   return space re-introduces the darkening defect (`precept-prompt-recap.md
   §inv-AT-color`). Both helpers ship; the consumer picks the space.

2. **The CSS token tier STAYS native (the guarded boundary).** GUARDED against a
   future audit wrongly "finishing the consolidation" — compiling tokens through
   value.js regresses `light-dark()` re-resolution + the token-first override precept
   + payload (`precept-prompt-recap.md §inv-AT-color`). This is a deliberate design
   boundary, not a legacy carve-out: the leaf's gate EXEMPTS the token files
   explicitly.

3. **The published graph is a DAG.** value.js's PUBLISHED lib never imports glass-ui
   (the coupling is dev-only — REFUTED at HEAD, must STAY refuted). The `/color` leaf
   imports value.js; nothing in the published value.js graph imports glass-ui back.

## §HARD gates

Per CHARTER §3 W5: **`proof:color-acyclic` + `proof:single-color-core` green; the
published graph is a DAG (value.js's published lib never imports glass-ui).** Both
registered `gates.mjs`:

1. **`proof:color-acyclic`** (#4) — asserts the `/color` leaf's import graph is a
   DAG: the leaf imports value.js, value.js's published lib never imports glass-ui.
   **bite-check:** introducing a glass-ui → value.js → glass-ui cycle reddens it.

2. **`proof:single-color-core`** (#4) — asserts ONE runtime-JS color source
   (value.js, via the leaf): no second hand-rolled OKLCh/sRGB math path in `src/`.
   The CSS token tier is EXEMPTED — the gate's allowlist names the token files
   explicitly (the guard against finishing the consolidation). **bite-check:** a
   second math source OR a token file routed through value.js reddens it.

inv ε: green means ONE math source (value.js) + a DAG + the token tier stays native,
all verified by the import-graph walk — NOT a narration that "color is single-sourced."

## §No-legacy

The leaf does NOT introduce a second color-math home (`proof:single-color-core`) — it
HOISTS the existing value.js dependency to a clean leaf. `oklchToGammaRgb` is a NEW
helper (the gamma-exit that does not exist at HEAD), not a resurrection of a removed
one. The CSS token tier stays native — a guarded boundary, not a legacy alias.
