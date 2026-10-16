# AU.W6 — `useWebGLCanvas` substrate + aurora refactor (DEC-AT-1)

The transposition the blob lift FORCES (CHARTER §3 W6, §1.1, P2). AT framed the blob
lift as "a forcing function for three transpositions"; this wave lands the first: ONE
`useWebGLCanvas` substrate (aurora + the coming goo-blob share it; the zero-consumer
`frostShader.ts` orphan DELETED; the genuinely-missing `webglcontextrestored` handler
ABSORBED — aurora's existing `useIntersectionPause` off-screen gate carried forward,
not re-added). NO workaround
substitutes for a transposition (P2) — the substrate is net-deletion at its core,
proved by before/after LOC + a ≥2-consumer assert. It lands after the `/color` leaf
(AU.W5, which aurora's bake consumes) and before the blob (AU.W7, the substrate's 2nd
consumer).

## §Scope

1. **Extract `useWebGLCanvas` (DEC-AT-1, #3).** The substrate aurora + goo-blob share.
   Aurora currently carries its own bootstrap. The extraction ABSORBS the
   genuinely-missing robustness (strictly ADDITIVE, CHARTER §1.1): the
   `webglcontextrestored` handler is the ONE absent piece (confirmed:
   `grep -rn webglcontextrestored src/components/custom/aurora/ = 0`). The off-screen
   gate is NOT missing — aurora already composes `useIntersectionPause` as the single
   owner of off-screen pause (`useAurora.ts:15`/`:143`/`:237-246`); the substrate WIRES
   that existing gate (inherits aurora's consumer), it does NOT re-add it. The C6
   must-fix #4 is BINDING — the
   substrate must NOT bake aurora's quad geometry / attrs / DPR / frozen-t choices
   (aurora and goo-blob DIVERGE on these); a consumer-#2 usability assert co-gates it,
   or the "extraction" is a disguised copy.

2. **DELETE `frostShader.ts` (DEC-AT-1, #3, CHARTER §1.1).** Present at HEAD
   (`src/composables/glass/webgl/frostShader.ts`), a zero-consumer orphan. P1:
   DELETED, not deprecated, not behind a flag. The deletion gate asserts FILE-ABSENCE
   (`test ! -f src/composables/glass/webgl/frostShader.ts`) AND no module resolves
   `glass/webgl/frostShader` — NOT a name-grep. A `rg frostShader src/ = 0` is
   born-GREEN at HEAD (the orphan body cites the literal `frostShader` zero times and
   nothing imports it), so the grep-of-name form is REJECTED for this gate (P6/inv-ε —
   the gate must redden on the unfixed, orphan-present state).

3. **Refactor aurora onto the substrate.** Aurora becomes consumer #1 of
   `useWebGLCanvas` — its bootstrap REPLACED by the substrate call, not copied. The
   aurora D-1 dither + D-2 OKLab LUT free-ride land here (the substrate makes them
   cheap).

## §HARD gate

Per CHARTER §3 W6: **`proof:webgl-substrate-single` (pixel AND scheduling parity)
green; consumer-#2-usability assert (substrate does NOT bake aurora's quad/DPR);
`proof:frostShader-deleted` = `test ! -f src/composables/glass/webgl/frostShader.ts`
AND no module resolves `glass/webgl/frostShader` (a name-grep `rg frostShader src/ = 0`
is born-GREEN at HEAD — REJECTED for this gate).** Registered `gates.mjs`:

1. **`proof:webgl-substrate-single`** (DEC-AT-1) — asserts BOTH pixel-parity AND
   scheduling-parity for aurora before/after the substrate swap. The pixel byte-parity
   gate ALONE is blind to a scheduling downgrade (a frame-budget regression that
   renders identically) — so the gate emits a scheduling-parity table (rAF cadence,
   off-screen pause behaviour) co-asserted with the pixel diff. Plus the
   **consumer-#2 usability assert** (C6 must-fix #4): a second consumer mounts
   `useWebGLCanvas` with NON-aurora quad/DPR choices and renders — reddening if the
   substrate baked aurora's choices. **bite-check:** hardcoding aurora's DPR into the
   substrate reddens the consumer-#2 assert.

2. **`proof:frostShader-deleted`** (P1, the no-legacy proof) — a FILE-EXISTENCE assert
   `test ! -f src/composables/glass/webgl/frostShader.ts` (the file is GONE) AND an
   import-graph assert that no module resolves `glass/webgl/frostShader`. The
   name-grep form `rg frostShader src/ = 0` is born-GREEN at HEAD WHILE the orphan
   still exists (the file's own body contains the literal zero times, nothing imports
   it) — born-green directly violates P6/inv-ε, so it is REJECTED for this gate.
   Reddens if the orphan file survives or any module still resolves it.

inv ε: green means pixel parity AND scheduling parity AND the consumer-#2 assert pass
AND the orphan is gone — verified by instrument, not narrated. The two-tier substrate
gate (pixel + scheduling) + the consumer-#2 assert prove the extraction is a
transposition, not a copy.

## §The transposition assert (P2, CHARTER §4 inv-P2)

`useWebGLCanvas` is net-deletion-or-neutral at its core: a before/after LOC count
(aurora's deleted bootstrap + `frostShader.ts`'s deletion vs the substrate's lines) is
emitted at the close, AND the ≥2-consumer assert (aurora + the goo-blob that lands
AU.W7) is named. If the substrate is net-additive with no deletion, it is a disguised
copy — the LOC emission surfaces that.

## §No-legacy

`frostShader.ts` DELETED (P1). Aurora's bootstrap REPLACED by the substrate call, not
copied alongside it. The substrate does NOT bake aurora's choices (the consumer-#2
assert is the guard — a baked substrate is a copy, not a transposition).
