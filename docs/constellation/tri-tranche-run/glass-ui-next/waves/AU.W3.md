# AU.W3 — the keystone + the correctness fold [3.3.0-publish-blocking]

The publish-quality wave (CHARTER §3 W3, §6). The keystone the campaign skipped
lands FIRST in this wave, then the two oldest debts in the ledger close under it.
This is the publish-blocking fold (CHARTER §5 — it lands before the headline because
3.3.0 cannot ship with a RED correctness gate). The strict-templates keystone is
first WITHIN the wave so the peer-field reshape, the import swap, and every later
clean break fail-closed on a silent no-op.

## §Scope

### The keystone (lands FIRST within the wave)

1. **`proof:strict-templates` — library-wide, `checkUnknownProps:true` across all
   three tsconfigs (#9, `precept-prompt-recap.md §3.2`).** NOT a point-spec dock-prop
   guard — the booked narrow version is SUPERSEDED and NOT shipped. `<GlassDock
   bogus-prop>` MUST become a RED typecheck, closing the silent-no-op CLASS that
   seeded the AS.W7 dock bug, library-wide. The campaign landed the W6/W7 clean breaks
   UNGUARDED by this gate (the inversion `precept-prompt-recap.md §3.2` names); AU
   corrects the ordering.

2. **Re-verify the already-landed clean breaks under the new gate.** The overflow
   one-enum collapse (`8e4cb9f`, `wrap` deleted), the token-only refinements, the
   motion-parity spring — each authored UNGUARDED. AU re-runs the typecheck with the
   flag on against every dock consumer site and asserts ZERO new diagnostics (the
   breaks were correct; the gate now proves it, not the campaign record). The
   transposition, not a workaround: any pre-existing unknown-prop pass surfaced is
   fixed at its idiomatic root (explicit forwarding, `defineProps` completion,
   reka-canonical `v-bind="$attrs"` + `inheritAttrs:false`) — NO `@ts-expect-error`
   suppression added to pass the gate.

### The correctness fold (under the keystone)

3. **`peerDependenciesMeta` + DELETE the dead `optionalPeerDependencies` field
   (#8, CHRONIC RED@HEAD, `precept-prompt-recap.md §3.4`).** `package.json:559` is
   non-standard — npm reads it as nothing, so every peer is silently REQUIRED. FIX the
   field shape (`peerDependenciesMeta[x].optional = true`) AND delete the dead field
   (P1, no alias), THEN gate the derived fact. Born-green: the fix precedes the gate.

4. **DataTable `useElementSize` → in-house `useResizeObserver` (#6, CHRONIC RED@HEAD,
   the ONE hard ordering edge, `precept-prompt-recap.md §3.5`).** `DataTable.vue:3,78`
   reaches `@vueuse/core` through the SOURCE root barrel (`index.ts:104`). The real
   debt is the ABSENT static-import-graph gate. Swap to an in-house `useResizeObserver`
   (born-green) — the swap MUST precede the gate going green — AND add the missing
   gate.

5. **`supportsPostTask` — WIRE or DROP (#7).** Export at `platformSupport.ts:23`, 0
   public-predicate callers (`usePrioritizedTask` calls `getSchedulerPostTask()`
   directly). WIRE it into the `usePrioritizedTask` guard (DRY) OR drop it (P3
   WIRE-by-default). No exported orphan survives.

6. **The keyframes `[2.2.0,3.0.0]` peer-matrix `proof:package` axis** (CHARTER §3 W3).
   Add the peer-compatibility matrix axis so the published peer range is CI-witnessed
   against keyframes' real version surface.

7. **The decomposed a11y sites from W0** (#25/#29). Any site W0's decomposition named
   a REAL WCAG gap (the `LabeledField` for/id binding, a speedtest-named failing site)
   lands its correctness fix here. Sites with no concrete failing target stay BOOK.

## §HARD gates

Per CHARTER §3 W3: **`proof:strict-templates` green + `<GlassDock bogus-prop>` is a
RED typecheck; `proof:peer-optional` (peer optional IFF its literal absent from
`dist/glass-ui.js`) green; `proof:vueuse-free-root` (no `@vueuse/core` reachable from
`dist/glass-ui.js`) green; both born-RED gates redden on a deliberate inject.** Each
registered in `gates.mjs`:

1. **`proof:strict-templates`** (tag `local,ci`) — asserts the flag is on in EACH of
   the three tsconfigs; a fixture `<GlassDock data-bogus-prop="x">` emits the
   unknown-prop diagnostic; the real `vue-tsc --noEmit` build passes with zero new
   `@ts-expect-error` suppressions vs the W0 baseline. **bite-check:** removing the
   flag greens the fixture typecheck → the gate reddens (the diagnostic vanished).

2. **`proof:peer-optional`** (#8, tag `local,ci,release`, RED@HEAD) — a peer P is
   `peerDependenciesMeta[P].optional === true` IFF P's literal is ABSENT from
   `dist/glass-ui.js`. **bite-check:** re-adding a hard import of an optional peer
   reddens it. Greens only after the field-shape fix + the dead field's deletion.

3. **`proof:vueuse-free-root`** (#6, tag `local,ci`, RED@HEAD) — the two-tier idiom
   (P6): a SOURCE-graph gate (retarget `proof-consumers-static.mjs`'s comment-stripped
   transitive walker from `src/index.ts`, scanning `.vue <script>`) BENEATH a
   DIST-floor gate (`grep "@vueuse/core" dist/glass-ui.js = 0`). **Ordering:** the
   `useResizeObserver` swap precedes this greening. **bite-check:** re-importing
   `useElementSize` into any root-reachable `.vue` reddens the source-graph tier even
   when the dist tier passes.

4. **`proof:supportsPostTask-wired`** (#7) — the predicate has ≥1 real caller OR is
   deleted (WIRE-or-DROP, no orphan).

inv ε: gates 2 + 3 are RED at HEAD and green ONLY after the born-green fix lands
BEFORE the gate (P6 — the fix precedes the gate). A passing gate over an unfixed
field/import is impossible by construction.

## §Ordering invariants

- **Within the wave:** `proof:strict-templates` lands FIRST so the peer-field reshape
  + the import swap + every later clean break (AU.W6 `frostShader` delete, AU.W8 dock
  retire) fail-closed under it.
- **The DataTable swap precedes `proof:vueuse-free-root` green** (the ONE hard W6
  ordering edge). The peer-field reshape precedes `proof:peer-optional` green. Both
  born-green-before-gate (enforced by the gates being RED at W3-open, PASS at close).

## §No-legacy

The dead `optionalPeerDependencies` field DELETED (P1). `useElementSize` REMOVED from
the DataTable import, not aliased. `supportsPostTask` WIRED or DELETED — not an
exported orphan with a "wired later" note (the forbidden gate form, P6). The narrow
booked point-spec dock-prop guard KILLED by supersession.
