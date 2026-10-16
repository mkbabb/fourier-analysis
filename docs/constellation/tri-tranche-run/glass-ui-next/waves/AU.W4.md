# AU.W4 — Fraunces `@font-face` ship + `proof:font-axes` [slipped, lowest-risk highest-impact]

The slipped ship (CHARTER §3 W4). The ONE slipped SHIP of the grand-audit / AS.W0b
lineage — lowest-risk, highest-impact, and the natural first IMPL after the
publish-blocking correctness fold. `fonts.css:80-138` self-hosts the payload-bearing
woff2 faces (Plus-Jakarta + Fira Code, `font-family: "Plus Jakarta Sans"` with
`src: url("@mkbabb/glass-ui/fonts/.../*.woff2")`); `typography.css:34-49` carries only
the metric-override "Plus Jakarta Sans Fallback" faces (`src: local(...)`, zero
payload). Fraunces is a stack token (`tokens.css:43`) with NO face, so
`typography.css:150` WONK/SOFT axes are SILENTLY INERT — the display token is
dangling (#10).

## §Scope

1. **Ship the Fraunces `@font-face` (opsz+SOFT+WONK woff2, #10).** Mirror the
   payload-bearing woff2 self-host block at `fonts.css:80-138` (the
   `font-family: "Plus Jakarta Sans"` faces with the entry-path weight split) — NOT
   the metric-fallback faces at `typography.css:34-49`. Ship the opsz+SOFT+WONK woff2
   Fraunces face INTO `fonts.css` mirroring that block, add the
   `src/fonts/fraunces/*.woff2` asset + the `./fonts/*` export, and (optionally) a
   calibrated "Fraunces Fallback" metric-override face in `typography.css` mirroring
   the existing fallback pattern — so the dangling display token resolves and the
   WONK/SOFT axes stop being silently inert. FOLD (≥2 MET: words A.W5-P1c live-blocked
   + value.js display face — `deferred-lineage.md` #10; slides DROPPED per DEC-8 but
   the ≥2 holds).

2. **`text-box-trim` paid-diff companion (#41) — FOLD-IF.** Baseline-2025,
   typography-adjacent, 0 consumers. The Fraunces `typography.css` touch is the natural
   paid-diff companion — FOLD it IFF this SFC touch already pays the diff (else BOOK
   with the trigger). Flagged for the planner, not forced.

3. **Dead `ValueJs` UMD global removal (CHARTER §3 / `at-state.md` W7).** Precise
   sites: the build emits `formats: ["es"]` ONLY (`vite.config.ts:44`), so the ENTIRE
   `output.globals` wiring is dead (consumed only by umd/iife) — not just the `ValueJs`
   key. Delete `output.globals: libraryGlobals` at `vite.config.ts:49` AND the dead
   `libraryGlobals` export at `vite.library.ts:134` (the whole map is dead under ES-only
   output). Deleted (P1, no alias), opportunistically as a paid-diff item (the
   typography/build touch pays). A falsifiable no-legacy assertion registers the
   deletion: `grep -rn "ValueJs\|libraryGlobals" src/ vite*.ts = 0` after — a P1
   marker-deletion check (the `frostShader`/`DockTabButton` deletion-grep idiom).
   `text-box-trim` and the UMD removal both ride this wave only if the SFC touch
   already pays — neither is forced.

## §HARD gate

Per CHARTER §3 W4: **`proof:font-axes`: every axis `typography.css` references is
carried by a shipped `@font-face`; the WONK/SOFT axes are no longer silently inert.**
Registered `gates.mjs`:

- Parse the payload-bearing `@font-face` declarations' carried variation axes in
  `fonts.css` (the face's declared axes, incl. the shipped Fraunces face) AND the axis
  usages referenced across `typography.css`; assert REFERENCED (typography.css) ⊆
  DECLARED (fonts.css). RED at HEAD (WONK/SOFT referenced, no Fraunces face in
  `fonts.css` carries them).
- **bite-check:** referencing a WONK axis with the Fraunces face removed reddens it —
  an inert axis is a FAILURE, not a no-op (the whole point: the slip was a silently
  inert axis that no gate caught).

inv ε: green means a shipped face carries every referenced axis, verified by parsing
the artefact — NOT a narration that "Fraunces is now self-hosted." The bite-inject
(removing the face while keeping the axis reference) reddens it.

## §No-legacy

The dangling display token is RESOLVED by shipping the face, not by removing the
token (the token is correct; the face was missing). The dead `ValueJs` UMD global is
DELETED if the SFC touch pays (P1) — the whole `output.globals: libraryGlobals` wiring
(`vite.config.ts:49`) + the `libraryGlobals` export (`vite.library.ts:134`), dead
under ES-only output, gated by `grep -rn "ValueJs\|libraryGlobals" src/ vite*.ts = 0`.
No font fallback is kept behind a flag — the shipped face IS the display face.

## §Visual

A paired-π `baseline|close/` capture of any surface using the display token (the
WONK/SOFT axes now paint where they were inert) + a `DELTA.md` — the visual change is
named, not silently accepted.
