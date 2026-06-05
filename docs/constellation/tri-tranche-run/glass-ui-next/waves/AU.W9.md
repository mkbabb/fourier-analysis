# AU.W9 — control-pane + dark-ergonomics + lean folds + the slides-supply surface

The lean-fold wave (CHARTER §3 W9, §5). The control-pane asks glass-ui self-booked to
3.3.0, the dark-ergonomics pair, the strongest non-headline fold-candidate (Drawer
`:native`), the only coherent size-vocabulary fold, and the publish-gated slides-supply
specs (CHARTER §5 — folded "into AU.W9 / the close as the publish surface admits").
Every item names ≥2 distinct consumer contexts (P3) or is correctness/hygiene. All are
file-disjoint from the dock + blob graphs.

## §Scope

### Control-pane (fourier self-booked to 3.3.0, `deferred-lineage.md §4`)

1. **A-1 `ConfiguratorLayer`/`ConfiguratorRow` inter-row divider-rule opt-in (#30).**
   The machined twin-line groove (today only on `.instrument-rail`) as a Configurator
   chassis opt-in. Satisfaction: adjacent rows render the groove at every breakpoint.
   Precondition: `index.css` is at 99.5% budget — a conscious budget rebase precedes
   this (named, not silent, `precept-prompt-recap.md §2` A-1).

2. **A-2 `ConfiguratorLayer` `label`/`sub` → the `text-title`/`text-heading` ladder at
   the component root (#31).** Today a magic literal at every site
   (`ConfiguratorLayer.vue:118 text-sm font-semibold`). Bind to the ladder so one rung
   change restyles every pane title. Flag: restyles EVERY configurator label across all
   consumers → visual verification (paired-π `baseline|close/`).

### Dark-ergonomics pair (`deferred-lineage.md §3`)

3. **`useGlobalDark({ initialValue })` (#21) + FOUC `darkModeSyncScript()` primitive
   (#22).** The pair: an additive option arg (≥1 firm speedtest) + a string-emitting
   `<head>` helper on `/dark` (≥2: speedtest + words `light-dark()` site). Ships
   together — the FOUC primitive is the reason the option arg matters.

### The strongest non-headline fold-candidate

4. **Drawer `:native` / `GlassNativeDrawer` / `/native-drawer` (#32).** The cleanest
   real ≥2 of any non-headline item (muster `MobileInstrumentSheet` + speedtest mobile
   sheet, both FIRM), retiring the vaul-vue `activeSnapPoint` re-snap bug. AT held it
   for blast-radius coherence; AU FOLDS it IFF scope admits this 2nd substrate wave —
   else BOOK with the named trigger (CHARTER §3 W9). File-disjoint from the dock + blob
   graphs.

### The size-vocabulary fold (the ONLY clean ≥2 for the W-ASKS)

5. **Button `size="icon-sm"` (#17) + `Select size` (#20) as ONE size-prop pass.** The
   W-ASKS are 1-consumer EACH — do NOT ship them as isolated 1-consumer patches (the
   overfitting class). The ≥2 is cross-control coherence + the exported-public-API
   escape (a CVA variant is public surface). FOLD IFF the coherent size-prop wave opens
   — else BOOK (CHARTER §3 W9). The OTHER W-ASKS (#18/#19/#24/#26) stay BOOK.

### The publish-gated slides-supply (CHARTER §5, folded here as the surface admits)

6. **`DialogContent showClose?: boolean = true` [FG.W-dialog P1].** Retires slides'
   `.deck-gate` close-hide HACK (F-01). DeckGate is consumer #1; #2 = any wizard/confirm.
   Default `true` keeps it non-breaking. MEDIUM AT-clobber — but the dock chrome (AU.W8)
   is done, so `DialogContent.vue` is safe to open here, NOT co-edited with dock chrome
   (`slides-coupling.md §1`).

7. **The `/deck` subpath lift [FG.W-deck P1, 5th carry — DO NOT carry a 6th].** git-mv
   + `--deck-pager-accent` neutralization + the neutral CSS slice, NOT a rewrite. The
   sole blocker is the ≥2-consumer gate. AU resolves it DECISIVELY: ratify slides'
   `_fixture/` deck as #2 IF it exercises `useDeck`+`handleDeckKey`+`DeckSlide`
   non-trivially, ELSE commit a glass-ui demo `<Deck>` story (the demo-story-as-#2
   precedent, `slides-coupling.md §1`).

8. **Card `surface="cartoon"` dark-arm + Badge `variant="accent"` [FG.W-card-badge P1,
   each needs #2].** Card gains the dark-scheme stamp shadow + `--cartoon-stamp-x/y`
   token (glass-ui ships the upper-left neutral default; deck keeps its lower-right
   identity). Badge gains `--badge-accent`/`--badge-accent-fg` mirroring `--success`.
   Each FOLDS only with a confirmed #2 (speedtest/value.js witness); else BOOK.

9. **`useCountup` + `v-reveal`/`slideReveal` [FG.W-motion P1, AT-DISJOINT,
   schedulable NOW].** Lift slides' two editorial-motion primitives to
   `composables/motion/` — the figure VALUES stay slides-editorial, the MECHANISM is
   general. #2 = a motion demo story. The one glass-ui item not pin-gated; can run
   ahead of everything (CHARTER §5 — schedulable in parallel at any point).

## §HARD gate

Per CHARTER §3 W9: **each folded item names ≥2 consumers; A-2 visually verified (it
restyles every configurator label); the size-prop wave's ≥2 is cross-control coherence
+ the public-CVA escape.** Made re-runnable:

1. **`proof:au-w9-consumers`** — a machine-readable tally: each W9 item (prop, subpath,
   composable) ↦ its ≥2 distinct consumer contexts OR its correctness/hygiene tag.
   Reddens on any 1-consumer fold (the overfitting bar). The size-prop pass asserts the
   variant lands on ≥2 controls (Button + Select) in ONE vocabulary; the `/deck` lift
   asserts a non-trivial 2nd consumer; Card/Badge fold only with a confirmed #2.

2. **The paired-π protocol** for the visual items (A-2 label ladder restyle, Card
   cartoon dark-arm): `baseline|close/` + `DELTA.md`. A-2's restyle of every configurator
   label is visually verified, not silently accepted.

inv ε: each gate is a re-runnable instrument with a named bite-inject. An item that
cannot name a 2nd consumer at the gate's run is BOOK, not folded — the tally reddens on
an orphan fold.

## §No-legacy

The slides close-hide hack is RETIRED by `showClose` (slides' arm, inv-16 — glass-ui
ships the prop). The vaul-vue `activeSnapPoint` bug is retired by `GlassNativeDrawer`,
not worked around. Every item is additive-or-deletion — zero compatibility aliases.

## §Slides edges

This wave supplies E-dialog, E-deck, E-cardbadge, E-motion (`slides-coupling.md §4`).
All resolve glass-ui-side here; slides consumes only AFTER AU.W10 publishes (the
version hinge). FG.W-motion (E-motion) is AT-disjoint — schedulable immediately.
